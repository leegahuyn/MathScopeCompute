import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {globalGraphEqual} from '../source-global-current.mjs';
import {originalFullMeanOperators} from '../source-full-mean-equations.mjs';
import {realizeOriginalTemporalPotential} from '../source-temporal-potential.mjs';
import {exactAuxiliaryPi,finiteAuxiliaryInverse} from '../source-auxiliary-fourier.mjs';
import {checkActualFiniteAuxiliaryIdentity} from '../source-global-temporal.mjs';

function setup(){
  const G=new AuxiliarySourceExpressions(new ActualConvergentExpressions()),q=(n,d=1)=>G.q(n,d),
    [R,Z,T,...Y]=['R','Z','T','y0','y1'].map(x=>G.fresh(x)),phi=G.pow(R,3),
    geometry={R,Z,T,Y,vr:[q(2),q(-3)],vt:[G.sub(G.sqrt(q(2)),G.one),G.one],
      radialPrimitive:phi,radialFast:G.derivative(phi,R),epsilon:q(2,7),ci:q(11,5),
      chi:G.mul(G.pow(R,2),G.add(G.one,G.mul(Z,T))),innerRadius:G.one,outerRadius:q(3)},
    inverseTheta=G.mul(R,T,G.add(Y[0],G.pow(Y[1],2))),inverseZ=G.mul(G.pow(R,2),Z,T,G.add(G.pow(Y[0],2),Y[1]));
  return {G,q,R,Z,T,Y,geometry,inverseTheta,inverseZ};
}

/** Independent exact integration of the finite polynomial controls, with
 * actual derivative-based termination instead of an omitted Taylor tail.
 */
function exactControl(G,root){
  const memo=new Map(),visit=id=>{
    if(memo.has(id))return memo.get(id);const {op,args}=G.nodes[id];let out=id;
    if(op==='m3_aux_expression_partial')out=visit(G.materializeExpressionFunction(...args));
    else if(op==='add')out=G.add(...args.map(visit));
    else if(op==='multiply')out=G.mul(...args.map(visit));
    else if(op==='inverse')out=G.inv(visit(args[0]));
    else if(op==='integer_power')out=G.pow(visit(args[0]),args[1]);
    else if(op==='definite_integral'){
      const [b,x,left,right]=args,body=visit(b),a=visit(left),z=visit(right),terms=[];let derivative=body,factorial=1n;
      for(let k=0;k<=40&&derivative!==G.zero;k++){
        terms.push(G.mul(G.q(1,factorial*BigInt(k+1)),G.substitute(derivative,x,G.zero),G.sub(G.pow(z,k+1),G.pow(a,k+1))));
        derivative=G.derivative(derivative,x);factorial*=BigInt(k+1);
      }
      assert.equal(derivative,G.zero,'every independent polynomial integral must terminate exactly');out=G.add(...terms);
    }
    memo.set(id,out);return out;
  };return visit(root);
}
const equal=(G,a,b)=>globalGraphEqual(G,exactControl(G,a),exactControl(G,b)).pass;

test('the full T1 meridional potential matches independent translated-polynomial integration in both auxiliary directions',()=>{
  const s=setup(),{G,geometry,inverseTheta,inverseZ}=s,p=realizeOriginalTemporalPotential(G,{geometry,inverseTheta,inverseZ}),
    {Dr,Dz,De}=originalFullMeanOperators(G,geometry),psi=exactControl(G,p.rawPsi);
  assert.ok(p.checks.every(x=>x.pass));assert.equal(equal(G,p.velocity.beta,G.neg(Dz(psi))),true);
  assert.equal(equal(G,p.velocity.gamma,De(psi,1)),true);
  assert.equal(equal(G,p.velocity.gamma,G.sub(p.gammaDesired,p.cutoffRemainder)),true);
  assert.equal(equal(G,p.velocity.gamma,p.gammaDesired),false,'the nonzero cutoff remainder cannot disappear');
  assert.equal(equal(G,G.add(De(p.velocity.beta,1),Dz(p.velocity.gamma)),G.zero),true);
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.cutoffRemainderDeclaredZero,false);
});

test('the physical ci inverse and slow time term remain necessary on a nonzero time-dependent control',()=>{
  const s=setup(),{G,geometry,inverseTheta,inverseZ}=s,p=realizeOriginalTemporalPotential(G,{geometry,inverseTheta,inverseZ});
  assert.equal(equal(G,G.mul(geometry.ci,p.velocity.v),G.neg(inverseTheta)),true);
  assert.equal(equal(G,p.velocity.v,G.neg(inverseTheta)),false);
  assert.equal(equal(G,p.slowTime.angular,G.neg(G.mul(geometry.epsilon,G.derivative(p.velocity.v,s.T)))),true);
  assert.equal(equal(G,p.slowTime.angular,G.zero),false);assert.equal(equal(G,p.slowTime.axial,G.zero),false);
  assert.equal(p.slowTimeTermsRetained,true);
});

test('omitting either fast radial column changes the independently realized axial field',()=>{
  const s=setup(),{G,geometry,inverseTheta,inverseZ}=s,p=realizeOriginalTemporalPotential(G,{geometry,inverseTheta,inverseZ}),
    psi=exactControl(G,p.rawPsi),omit=G.add(G.derivative(psi,s.R),G.mul(geometry.radialFast,geometry.vr[0],G.derivative(psi,s.Y[0])),G.div(psi,s.R));
  assert.equal(equal(G,p.velocity.gamma,omit),false);assert.equal(p.integrals.endpointCheck.pass,true);
  assert.equal(p.angularIntegrals.endpointCheck.pass,true);
});

test('direct N on actual finite coefficient integrals agrees with its complete source projection and rejects a changed divisor',()=>{
  const s=setup(),{G,Y,T}=s,pi=exactAuxiliaryPi(G),body=G.add(G.q(7),G.mul(T,G.sine(G.mul(G.q(2),pi.value,G.add(Y[0],Y[1]))))),
    finite=finiteAuxiliaryInverse(G,{body,Y,cutoff:1,derivativeOrders:[0,1]}),proof=checkActualFiniteAuxiliaryIdentity(G,finite);
  assert.equal(proof.pass,true);assert.equal(proof.rows.length,4);assert.equal(proof.sourceAuthenticated,false);
  const changed=structuredClone(finite);changed.rows[0].divisor.quadratic.integerNorm='2';
  assert.equal(checkActualFiniteAuxiliaryIdentity(G,changed).pass,false);
  const missingPair=structuredClone(finite);missingPair.rows[0].sourceProjection=G.zero;
  assert.equal(checkActualFiniteAuxiliaryIdentity(G,missingPair).pass,false);
});

test('a temporal potential cannot drop an original operator factor or one inverse component',()=>{
  const s=setup();for(const input of [{geometry:s.geometry,inverseTheta:s.inverseTheta},
    {geometry:{...s.geometry,ci:undefined},inverseTheta:s.inverseTheta,inverseZ:s.inverseZ}])
    assert.throws(()=>realizeOriginalTemporalPotential(s.G,input));
});
