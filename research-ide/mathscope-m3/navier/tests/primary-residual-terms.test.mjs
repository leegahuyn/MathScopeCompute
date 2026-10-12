import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {originalCylindricalDifferentialOperators} from '../source-harmonic-assembly.mjs';
import {createQuadraticSourceVerifier} from '../source-quadratic-identity.mjs';
import {exactPrimaryResidualDecomposition,assertExactPrimaryResidualDecomposition,
  verifyExactPrimaryResidualDecomposition} from '../source-primary-residual-terms.mjs';

function fixture(){
  const G=new ActualConvergentExpressions(),[R,Z,T,theta,xi,v]=['R','Z','T','theta','xi','v'].map(n=>G.fresh(n)),
    epsilon=G.q(2,5),geometry={R,Z,T,theta,xi,v,epsilon,radialFast:G.add(G.one,R)},
    F=G.add(R,Z,T),Bz=G.add(G.mul(R,Z),T),pz=G.q(2),
    phase=G.add(theta,G.div(G.mul(pz,Z),epsilon),G.mul(G.q(3),R),G.neg(G.mul(v,G.add(F,G.mul(pz,Bz))))),
    input={geometry,phase,k:G.q(2),axialCarrier:pz,background:{b:G.mul(R,Z),F,G:Bz,pressure:G.mul(R,T)},
      amplitude:{t:[G.add(R,xi),G.add(Z,v),G.mul(T,xi,v)],weight:G.add(G.one,T,xi,v),psi:G.mul(v,G.sub(G.one,v))},
      curlRemainder:[G.mul(R,v),G.mul(Z,xi),G.add(T,v)],meanVelocity:[G.mul(R,xi),G.mul(Z,v),G.mul(T,xi,v)],
      meanPressure:G.add(G.mul(R,Z),xi),oldFlatResidual:[{m:0,value:[
        {real:G.pow(R,2),imaginary:G.zero},{real:G.mul(R,Z),imaginary:G.zero},{real:G.pow(T,2),imaginary:G.zero}]}]},
    result=exactPrimaryResidualDecomposition(G,input);
  return {G,R,Z,T,theta,xi,v,input,result};
}

function homogeneousFixture(common=false){
  const G=new ActualConvergentExpressions(),[R,Z,T,theta,x,y]=['R','Z','T','theta','x','y'].map(n=>G.fresh(n)),
    q=(n,d=1)=>G.q(n,d),epsilon=q(2,5),k=q(2),F=q(3,2),radical=G.sqrt(q(2)),
    vr=[G.one,G.sub(G.one,radical)],vt=[G.sub(radical,G.one),G.one],norm=G.sub(q(4),G.mul(q(2),radical)),ci=q(3,2),
    xi=common?G.div(G.add(G.mul(vr[0],x),G.mul(vr[1],y)),norm):x,
    v=common?G.div(G.add(G.mul(vt[0],x),G.mul(vt[1],y)),G.mul(norm,ci)):y,
    geometry=common?{R,Z,T,theta,Y:[x,y],vr,vt,ci,epsilon,radialFast:G.add(G.one,R)}:
      {R,Z,T,theta,xi:x,v:y,epsilon,radialFast:G.add(G.one,R)},
    D=originalCylindricalDifferentialOperators(G,geometry),phase=G.sub(theta,G.mul(F,v)),
    n=[D.Dr(phase),D.angular(phase),D.Dz(phase)],d=G.mul(epsilon,G.pow(k,2),G.add(...n.map(z=>G.pow(z,2)))),
    pulse=G.exp(G.neg(G.mul(d,v))),t=[pulse,G.zero,G.mul(Z,pulse)],weight=G.add(G.one,xi,T),psi=G.mul(v,G.sub(G.one,v)),
    L=t.map(z=>G.mul(weight,psi,z)),
    // Complete i*C*exp(i*k*Phi) curl for this nonzero normal-pressure
    // control. The imaginary theta remainder cancels the leading
    // divergence; it is not independently divergence free.
    remainder=[G.zero,G.add(D.Dz(G.div(G.mul(R,L[2]),k)),D.Dr(G.div(G.mul(R,L[0]),k))),G.zero],
    input={geometry,phase,k,axialCarrier:G.zero,background:{b:G.zero,F,G:G.zero,pressure:G.mul(R,T)},
      amplitude:{t,weight,psi},curlRemainder:remainder,meanVelocity:[G.zero,G.zero,G.zero],meanPressure:G.zero,oldFlatResidual:[]};
  return {G,R,Z,T,theta,D,L,input,result:exactPrimaryResidualDecomposition(G,input)};
}

test('all twenty actual remainder term families reproduce every full conservative coefficient and old flat root',t=>{
  const {G,input,result}=fixture(),proof=verifyExactPrimaryResidualDecomposition(G,result);
  assert.equal(proof.pass,true);assert.deepEqual(proof.modes,[-2,-1,0,1,2]);assert.equal(proof.checks.length,30);
  assert.equal(result.terms.length,20);assert.ok(proof.checks.every(x=>x.numeratorMonomials===0));
  assert.deepEqual(result.update.oldFlatResidual,input.oldFlatResidual);
  assert.equal(result.scope.homogeneousDefectRemoved,false);assert.equal(result.scope.sourceAuthenticated,false);
  assert.equal(result.scope.allOrderSourceClassCertified,false);assert.equal(result.scope.fullCurlDivergenceDeclaredZero,false);
  assert.ok(result.terms.find(x=>x.id==='complete-primary-pressure-coefficient-gradient').fullCutoffAndNormalPressureInsideDerivatives);
  t.diagnostic('Full polynomial remainder identity used '+proof.maximumProducts+' exact products.');
  if(process.env.M3_PRIMARY_REMAINDER_EVIDENCE)writeFileSync(process.env.M3_PRIMARY_REMAINDER_EVIDENCE,
    JSON.stringify({schema:'MathScope.N6.PrimaryRemainderPolynomialControlProgram/1',nodes:G.nodes,input,result,proof,
      actualOriginalCurrentAttached:false,numericalSourceScaleSubstituted:false,genericControlOnly:true},null,2)+'\n',{flag:'wx'});
});

test('omitting pressure, quadratic phase, full curl or conservative-divergence terms fails the independent PDE route',()=>{
  const {G,result}=fixture();
  for(const id of ['complete-primary-pressure-coefficient-gradient','quadratic-leading-phase-tangency',
    'full-curl-remainder-linear-background','complete-conservative-divergence-correction']){
    const changed={...result,terms:result.terms.filter(t=>t.id!==id)},proof=verifyExactPrimaryResidualDecomposition(G,changed);
    assert.equal(proof.pass,false,id);
    if(id==='quadratic-leading-phase-tangency')assert.ok(proof.checks.some(c=>Math.abs(c.m)===2&&!c.pass));
  }
  const changed={...result,waves:result.waves.map(w=>({...w,pressure:{real:G.zero,imaginary:G.zero}}))};
  assert.equal(verifyExactPrimaryResidualDecomposition(G,changed).pass,false);
});

test('a true nonzero homogeneous pressure cancels the principal operator and only the whole curl cancels divergence',()=>{
  const {G,result,D,L}=homogeneousFixture(),verify=createQuadraticSourceVerifier(G),p=result.principal;
  assert.ok(p.unweightedDefect.every(x=>verify(x).pass));assert.equal(verify(p.phase).pass,true);
  assert.equal(verify(p.leadingTangency).pass,true);assert.equal(verify(p.fastWeightDerivative).pass,true);
  assert.equal(verify(p.unweightedPressureImaginary).pass,false,'the normal pressure is nonzero');
  assert.equal(verify(G.add(D.Dr(L[0]),G.div(L[0],D.R),D.Dz(L[2]))).pass,false,'leading divergence is nonzero');
  assert.ok(result.divergence.waves.every(r=>verify(r.value.real).pass&&verify(r.value.imaginary).pass));
  assert.equal(verifyExactPrimaryResidualDecomposition(G,result).pass,true);
  assert.ok(result.terms.find(x=>x.id==='pulse-cutoff-derivative').rows.some(r=>r.value.some(z=>!verify(z.real).pass)));
  const pressureOmitted=p.unweightedDefect.map((x,j)=>G.add(x,G.mul(result.input.k,p.normal[j],p.unweightedPressureImaginary)));
  assert.ok(pressureOmitted.some(x=>!verify(x).pass));
});

test('the two original irrational common-torus derivative columns remain in every physical remainder term',()=>{
  const {G,result}=homogeneousFixture(true),verify=createQuadraticSourceVerifier(G),p=result.principal;
  assert.ok(p.unweightedDefect.every(x=>verify(x).pass));assert.equal(verify(p.phase).pass,true);
  assert.equal(verify(p.fastWeightDerivative).pass,true);
  const proof=verifyExactPrimaryResidualDecomposition(G,result);
  assert.equal(proof.pass,true);assert.equal(proof.checks[0].originalRadical.onlyDeclaredAlgebraicRelation,'sqrt(2)^2=2');
});

test('a fabricated source promise, fast background, changed exact record or incomplete vector cannot gain authority',()=>{
  const {G,input,result,v}=fixture();
  assert.equal(assertExactPrimaryResidualDecomposition(G,result),true);
  assert.throws(()=>assertExactPrimaryResidualDecomposition(G,{...result}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>exactPrimaryResidualDecomposition(G,{...input,sourceAuthenticated:true}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactPrimaryResidualDecomposition(G,{...input,background:{...input.background,F:v}}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactPrimaryResidualDecomposition(G,{...input,curlRemainder:input.curlRemainder.slice(0,2)}),{code:'INVALID_INPUT'});
  const old=result.terms[0].rows[0].value[0].real;result.terms[0].rows[0].value[0].real=G.zero;
  try{assert.throws(()=>assertExactPrimaryResidualDecomposition(G,result),{code:'INVALID_SOURCE_CONSTRUCTION'});}
  finally{result.terms[0].rows[0].value[0].real=old;}
  assert.equal(assertExactPrimaryResidualDecomposition(G,result),true);
});

test('existing scalar graph and function definitions cannot change under an unchanged primary record, while appends remain allowed',()=>{
  const {G,result,input}=fixture(),index=input.amplitude.weight,node=structuredClone(G.nodes[index]);
  G.nodes[index]={op:'rational',args:['0','1']};
  try{assert.throws(()=>assertExactPrimaryResidualDecomposition(G,result),{code:'INVALID_SOURCE_CONSTRUCTION'});}
  finally{G.nodes[index]=node;}
  const old=G.naturalKernel.tailImplementation;G.naturalKernel.tailImplementation='changed';
  try{assert.throws(()=>assertExactPrimaryResidualDecomposition(G,result),{code:'INVALID_SOURCE_CONSTRUCTION'});}
  finally{G.naturalKernel.tailImplementation=old;}
  G.q(11,7);assert.equal(assertExactPrimaryResidualDecomposition(G,result),true);
});
