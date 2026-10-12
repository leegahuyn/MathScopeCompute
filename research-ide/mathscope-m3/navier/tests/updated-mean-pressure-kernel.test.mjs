import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {globalGraphEqual} from '../source-global-current.mjs';
import {exactFullAuxiliaryMeanPDE,exactFullMeanMomentRemainders,originalFullMeanOperators} from '../source-full-mean-equations.mjs';
import {exactNormalizedHaar,exactWholeRadialIntegral,reconstructUpdatedFullMeanPressure} from '../source-updated-mean-pressure.mjs';

function setup(){
  const G=new AuxiliarySourceExpressions(new ActualConvergentExpressions()),q=(n,d=1)=>G.q(n,d),
    [R,Z,T,...Y]=['R','Z','T','y0','y1'].map(n=>G.fresh(n)),phi=G.mul(q(1,3),G.pow(R,3)),
    geometry={R,Z,T,Y,vr:[q(2),q(-3)],vt:[q(3),G.one],epsilon:q(2,7),ci:q(11,5),
      radialPrimitive:phi,radialFast:G.derivative(phi,R),innerRadius:G.one,outerRadius:q(2)},
    background={b:G.mul(G.pow(R,3),Z),V:G.mul(G.pow(R,3),T),G:G.mul(G.pow(R,3),Z,T)},
    velocity={beta:G.mul(G.pow(R,3),Y[0],T),v:G.mul(G.pow(R,3),Y[1],Z),gamma:G.mul(G.pow(R,3),Y[0],Y[1])},
    covariance=Object.fromEntries(['rr','rtheta','rz','thetatheta','thetaz','zz'].map((n,j)=>
      [n,G.mul(q(j+1),G.pow(R,4),G.add(Y[0],G.mul(T,Y[1])))])),
    stress=[G.mul(G.pow(R,3),Z),G.mul(G.pow(R,3),T)];
  return {G,q,R,Z,T,Y,input:{geometry,background,velocity,covariance,stress,
    rho:G.add(G.one,G.mul(R,Z)),chi:G.mul(R,G.add(G.one,G.mul(Z,T)))}};
}

/** Independently integrate the finite polynomial controls, including all
 * translated torus and radial variables. Sparse integer powers are
 * convolved directly; this does not use the source derivative engine to
 * integrate and does not evaluate unsimplified cylindrical factors at 0.
 */
function exactControl(G,root){
  const sparse=(body,x)=>{
    const cache=new Map(),clean=p=>new Map([...p].filter(([_,c])=>!globalGraphEqual(G,c,G.zero).pass)),
      add=(a,b)=>{const out=new Map(a);for(const [e,c]of b)out.set(e,G.add(out.get(e)??G.zero,c));return clean(out);},
      mul=(a,b)=>{let out=new Map();for(const [e,c]of a)for(const [f,d]of b)out=add(out,new Map([[e+f,G.mul(c,d)]]));return out;},
      inverse=p=>{assert.equal(p.size,1,'only exact monomial denominators occur in this polynomial control');const [[e,c]]=p;return new Map([[-e,G.inv(c)]]);},
      powers=(p,n)=>{if(n<0)return powers(inverse(p),-n);let out=new Map([[0,G.one]]);while(n){if(n%2)out=mul(out,p);n=Math.floor(n/2);if(n)p=mul(p,p);}return out;},
      read=id=>{
        if(cache.has(id))return cache.get(id);let p;
        if(!G.dependsOn(id,x))p=new Map([[0,id]]);
        else if(id===x)p=new Map([[1,G.one]]);
        else{const {op,args}=G.nodes[id];
          if(op==='add')p=args.map(read).reduce(add,new Map());
          else if(op==='multiply')p=args.map(read).reduce(mul,new Map([[0,G.one]]));
          else if(op==='inverse')p=inverse(read(args[0]));
          else if(op==='integer_power')p=powers(read(args[0]),args[1]);
          else assert.fail('nonpolynomial independent control operand '+op);
        }
        p=clean(p);cache.set(id,p);return p;
      };return read(body);
  };
  const memo=new Map(),visit=id=>{
    if(memo.has(id))return memo.get(id);const {op,args}=G.nodes[id];let out=id;
    if(op==='m3_aux_expression_partial')out=visit(G.materializeExpressionFunction(...args));
    else if(op==='actual_expression_partial')out=visit(G.materializeExpressionFunction(...args));
    else if(op==='add')out=G.add(...args.map(visit));
    else if(op==='multiply')out=G.mul(...args.map(visit));
    else if(op==='inverse')out=G.inv(visit(args[0]));
    else if(op==='integer_power')out=G.pow(visit(args[0]),args[1]);
    else if(op==='definite_integral'){
      const [b,x,left,right]=args,body=visit(b),a=visit(left),z=visit(right),terms=[];
      for(const [e,c]of sparse(body,x)){
        assert.ok(e>=0,'all nonzero polynomial control powers are nonnegative after exact cancellation');
        terms.push(G.mul(G.q(1,e+1),c,G.sub(G.pow(z,e+1),G.pow(a,e+1))));
      }
      out=G.add(...terms);
    }
    memo.set(id,out);return out;
  };return visit(root);
}
const equal=(G,a,b)=>globalGraphEqual(G,exactControl(G,a),exactControl(G,b)).pass;

test('updated P/J are complete normalized Haar/radial integrals of the recomputed full source',()=>{
  const s=setup(),{G,R,Y,input}=s,p=reconstructUpdatedFullMeanPressure(G,input),raw=exactFullAuxiliaryMeanPDE(G,input),
    average=body=>Y.reduce((f,y)=>G.integral(f,y,G.zero,G.one),body),
    whole=body=>exactWholeRadialIntegral(G,body,input.geometry,'independent_control'),
    expected={P:whole(average(raw.gr)),Jtheta:whole(average(raw.fluxTheta)),
      Jz:G.sub(whole(average(raw.fluxZ)),G.mul(G.q(1,2),whole(G.mul(G.pow(R,2),average(raw.gr)))))};
  assert.ok(p.checks.every(x=>x.pass));for(const n of ['P','Jtheta','Jz'])assert.equal(equal(G,p.mean[n],expected[n]),true,n);
  assert.equal(Y.every(y=>!G.freeCoordinates(p.mean.P).has(y)),true);
  assert.equal(equal(G,p.mean.P,whole(raw.gr)),false,'the complete torus mean cannot be dropped');
  assert.equal(equal(G,p.mean.Jz,whole(average(raw.fluxZ))),false,'the half R-squared radial defect cannot be dropped');
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.fullPhysicalNonzeroAngularPDEConstructed,false);
});

test('updated full pressure agrees with direct differentiated translated-polynomial integration and keeps A0',()=>{
  const s=setup(),{G,R,Z,input}=s,p=reconstructUpdatedFullMeanPressure(G,input),{Dr,Dz}=originalFullMeanOperators(G,input.geometry),
    value=exactControl(G,p.pressure.value),expected=G.sub(p.pressure.source,p.pressure.cutoffRemainder);
  assert.equal(equal(G,Dr(value),expected),true);
  assert.equal(equal(G,G.derivative(value,Z),p.pressure.slowZDerivative),true);
  assert.equal(equal(G,p.mean.Ez,G.add(p.mean.raw.Ez,Dz(value))),true);
  assert.equal(equal(G,p.mean.radialResidual,G.sub(G.neg(G.mul(input.rho,p.mean.P)),p.pressure.cutoffRemainder)),true);
  assert.equal(equal(G,p.pressure.fullRadialDerivative,p.pressure.source),false,'the actual cutoff term is nonzero');
  assert.equal(p.pressure.cutoffRemainderDeclaredZero,false);assert.equal(p.pressure.allAuxiliaryModesRetained,true);
});

test('a subsequent mean update recomputes new targets and preserves the full nonlinear P/J differences',()=>{
  const s=setup(),{G,R,Z,T,input}=s,old=reconstructUpdatedFullMeanPressure(G,{...input,tag:'old'}),
    increment={beta:G.mul(G.pow(R,3),Z),v:G.mul(G.pow(R,3),T),gamma:G.mul(G.pow(R,3),Z,T)},
    updated=Object.fromEntries(Object.keys(increment).map(n=>[n,G.add(input.velocity[n],increment[n])])),
    next=reconstructUpdatedFullMeanPressure(G,{...input,velocity:updated,tag:'next'}),
    remainders=exactFullMeanMomentRemainders(G,{geometry:input.geometry,background:input.background,previous:input.velocity,increment}),
    whole=body=>exactWholeRadialIntegral(G,exactNormalizedHaar(G,body,input.geometry.Y),input.geometry,'nonlinear_control'),
    pDifference=whole(G.add(remainders.linear.PIntegrand,remainders.Rg)),
    thetaDifference=whole(G.add(remainders.linear.JthetaIntegrand,remainders.JthetaIntegrand)),
    zDifference=G.sub(whole(G.add(G.mul(G.q(2),R,input.background.G,increment.gamma),remainders.JzVelocityIntegrand)),
      G.mul(G.q(1,2),whole(G.mul(G.pow(R,2),G.add(remainders.linear.PIntegrand,remainders.Rg)))));
  assert.equal(equal(G,G.sub(next.mean.P,old.mean.P),pDifference),true);
  assert.equal(equal(G,G.sub(next.mean.Jtheta,old.mean.Jtheta),thetaDifference),true);
  assert.equal(equal(G,G.sub(next.mean.Jz,old.mean.Jz),zDifference),true);
  assert.equal(equal(G,next.mean.P,old.mean.P),false);assert.equal(equal(G,next.pressure.value,old.pressure.value),false);
});

test('incomplete mean sources and altered Haar coordinates are rejected',()=>{
  const s=setup(),{G,input,Y}=s;
  assert.throws(()=>reconstructUpdatedFullMeanPressure(G,{...input,rho:undefined}),{code:'INVALID_INPUT'});
  assert.throws(()=>reconstructUpdatedFullMeanPressure(G,{...input,covariance:{...input.covariance,zz:undefined}}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactNormalizedHaar(G,input.velocity.v,[Y[0],Y[0]]),{code:'INVALID_INPUT'});
  assert.throws(()=>reconstructUpdatedFullMeanPressure(G,{...input,geometry:{...input.geometry,radialPrimitive:G.mul(input.geometry.radialPrimitive,s.Z)}}),{code:'INVALID_INPUT'});
});

test('a Z-dependent enclosing interval retains its exact boundary terms without assuming compact source values zero',()=>{
  const s=setup(),{G,R,Z,Y,input}=s,geometry={...input.geometry,radialPrimitive:R,radialFast:G.one,
      innerRadius:G.add(G.one,Z),outerRadius:G.add(G.q(2),Z)},chi=G.mul(R,Z),
    covariance=Object.fromEntries(Object.keys(input.covariance).map(n=>[n,n==='rr'?G.mul(R,Y[0]):G.zero])),
    p=reconstructUpdatedFullMeanPressure(G,{...input,geometry,covariance,background:{b:G.zero,V:G.zero,G:G.zero},
      velocity:{beta:G.zero,v:G.zero,gamma:G.zero},stress:[G.zero,G.zero],rho:G.one,chi}),
    value=exactControl(G,p.pressure.value),e=p.pressure.endpointTerms,
    omitted=G.sub(G.sub(p.pressure.slowZIntegrals.left,G.mul(G.derivative(chi,Z),p.pressure.integrals.whole)),G.mul(chi,p.pressure.slowZIntegrals.whole));
  assert.equal(equal(G,G.derivative(value,Z),p.pressure.slowZDerivative),true);
  assert.equal(equal(G,p.pressure.slowZDerivative,omitted),false);
  assert.equal(e.endpointTermsDeclaredZero,false);assert.equal(equal(G,e.innerZ,G.zero),false);
});
