import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {exactCommonTorusMatrix,exactCommonTorusRectangle} from '../source-global-pressure.mjs';
import {shiftedRadialIntegrals} from '../source-pressure.mjs';

const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:160000}).pass;

function integrateControlPolynomials(G,root){
  const memo=new Map(),visit=id=>{
    if(memo.has(id))return memo.get(id);const {op,args}=G.nodes[id];let out=id;
    if(op==='add')out=G.add(...args.map(visit));
    else if(op==='multiply')out=G.mul(...args.map(visit));
    else if(op==='integer_power')out=G.pow(visit(args[0]),args[1]);
    else if(op==='inverse')out=G.inv(visit(args[0]));
    else if(op==='definite_integral'){
      const [original,x,left,right]=args,body=visit(original),a=visit(left),b=visit(right),terms=[];let derivative=body,factorial=1n;
      for(let degree=0;degree<=30&&derivative!==G.zero;degree++){
        terms.push(G.mul(G.q(1,factorial*BigInt(degree+1)),G.substitute(derivative,x,G.zero),G.sub(G.pow(b,degree+1),G.pow(a,degree+1))));
        derivative=G.derivative(derivative,x);factorial*=BigInt(degree+1);
      }
      assert.equal(derivative,G.zero,'the independent test integral must be a finite polynomial, with no omitted Taylor tail');out=G.add(...terms);
    }
    memo.set(id,out);return out;
  };return visit(root);
}

test('all five original integer torus covering matrices and determinants match independent recurrence',()=>{
  const G=new ActualConvergentExpressions(),J=[[3n,1n],[1n,5n]];let expected=[[1n,0n],[0n,1n]];
  for(let k=0;k<=4;k++){
    const M=exactCommonTorusMatrix(G,G.q(k));
    assert.deepEqual(M.value.map(row=>row.map(root=>G.fraction(root)[0])),expected);
    assert.equal(M.determinants[k],String(14n**BigInt(k)));
    expected=[0,1].map(i=>[0,1].map(j=>J[i][0]*expected[0][j]+J[i][1]*expected[1][j]));
  }
  for(const bad of [G.q(-1),G.q(5),G.q(3,2)])assert.throws(()=>exactCommonTorusMatrix(G,bad),{code:'INVALID_INPUT'});
});

test('the original rectangle keeps both nontrivial torus Jacobian columns and the exact ci divisor',()=>{
  const G=new ActualConvergentExpressions(),Y=[G.fresh('y0'),G.fresh('y1')],sqrt2=G.sqrt(G.q(2)),
    vr=[G.one,G.sub(G.one,sqrt2)],vt=[G.sub(sqrt2,G.one),G.one],Dgeom=G.sub(G.q(4),G.mul(G.q(2),sqrt2)),
    ci=G.q(7,3),matrix=exactCommonTorusMatrix(G,G.q(2)).value,center=[G.q(7,1048576),G.zero],
    s=exactCommonTorusRectangle(G,{Y,matrix,center,vr,vt,Dgeom,ci,r0:G.q(1,17179869184)});
  // Jg^2=[[10,8],[8,26]] calculated independently.
  const exactXi=[G.div(G.sub(G.q(18),G.mul(G.q(8),sqrt2)),Dgeom),G.div(G.sub(G.q(34),G.mul(G.q(26),sqrt2)),Dgeom)],
    exactV=[G.div(G.sub(G.mul(G.q(10),sqrt2),G.q(2)),G.mul(Dgeom,ci)),G.div(G.add(G.mul(G.q(8),sqrt2),G.q(18)),G.mul(Dgeom,ci))];
  s.xiJacobian.forEach((root,j)=>assert.equal(equal(G,root,exactXi[j]),true));
  s.vJacobian.forEach((root,j)=>assert.equal(equal(G,root,exactV[j]),true));
  assert.equal(equal(G,s.vJacobian[1],G.mul(ci,exactV[1])),false);
  assert.equal(s.nearestCopyDerivativeTaken,false);assert.equal(s.sourceAuthenticated,false);
  assert.throws(()=>G.derivative(s.xi,Y[0]),{code:'UNSUPPORTED'},'the floor-selected lift cannot be differentiated directly');
});

test('a full auxiliary pressure radial identity requires both torus directions and retains the cutoff defect',()=>{
  const G=new AuxiliarySourceExpressions(new ActualConvergentExpressions()),R=G.fresh('R'),Y=[G.fresh('y0'),G.fresh('y1')],
    vr=[G.q(2),G.q(-3)],phi=G.pow(R,3),a=G.derivative(phi,R),body=G.add(G.mul(R,G.pow(Y[0],2)),G.mul(G.pow(R,2),Y[1])),
    L=f=>G.add(...Y.map((y,j)=>G.mul(vr[j],G.derivative(f,y)))),chi=G.pow(R,2),
    options={R,Y,radialPrimitive:phi,vr,innerRadius:G.one,outerRadius:G.q(3)},
    I=shiftedRadialIntegrals(G,{body,...options,tag:'independent_polynomial'}),
    IL=shiftedRadialIntegrals(G,{body:L(body),...options,tag:'independent_L_polynomial'}),
    p=G.sub(I.left,G.mul(chi,I.whole)),A0=G.mul(G.derivative(chi,R),I.whole),
    fromActualDifferentiation=G.add(G.derivative(p,R),G.mul(a,L(p))),
    fromCompleteLeibniz=G.add(I.endpoint,G.neg(G.mul(a,IL.left)),G.neg(A0),G.mul(chi,a,IL.whole),
      G.mul(a,G.sub(IL.left,G.mul(chi,IL.whole))));
  const exact=root=>integrateControlPolynomials(G,root);
  assert.equal(equal(G,exact(fromActualDifferentiation),exact(G.sub(body,A0))),true);
  assert.equal(equal(G,exact(fromCompleteLeibniz),exact(fromActualDifferentiation)),true);
  assert.equal(equal(G,exact(fromActualDifferentiation),body),false);
  assert.equal(equal(G,exact(G.add(G.derivative(p,R),G.mul(a,vr[0],G.derivative(p,Y[0])))),exact(G.sub(body,A0))),false);
  assert.equal(I.endpointCheck.pass,true);assert.notEqual(I.whole,G.zero);
});
