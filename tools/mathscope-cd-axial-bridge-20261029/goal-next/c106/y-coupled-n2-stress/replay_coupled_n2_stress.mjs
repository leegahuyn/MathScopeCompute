import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,c104dir,c105dir,output]=process.argv.slice(2);
assert(output,'Usage: ORIGINAL_RUNTIME C104_Y C105_Y NEW_JSON');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pinned=async(path,expected)=>{
  const raw=await readFile(path);
  assert.equal(sha(raw),expected,path);
  return raw;
};
const pins={
  C104:'9b94457853b46d03a64439173a414a5b614b814ddbbc92a808e0b1c0fc1be993',
  C104Ops:'215ad80b268a36ad6e6427a72ed399621f6f37835aff2f8f3fb8b57b1e17a592',
  C105:'4706411acb5ddf906fa50fc07e062c313374a2e34d0042c459da12eec0cddaf6',
  C105Ops:'2f6cdbce5ee4a64a71b18f717b4234d6a45201f7ec28b9164be6ff7a183b8d83',
};
const fixed=JSON.parse(await pinned(resolve(c104dir,'n2-absolute-stress.json'),pins.C104));
const fixedOps=JSON.parse(await pinned(resolve(c104dir,'n2-absolute-stress-operands.json'),pins.C104Ops));
const paired=JSON.parse(await pinned(resolve(c105dir,'coupled-n2.json'),pins.C105));
const pairedOps=JSON.parse(await pinned(resolve(c105dir,'coupled-n2-operands.json'),pins.C105Ops));
assert.equal(fixed.operandsSHA256,pins.C104Ops);
assert.equal(paired.operandsSHA256,pins.C105Ops);
assert.equal(pairedOps.originalPrefixSHA256,fixedOps.originalPrefixSHA256);
assert.ok(paired.wholeCoupledTransfer.sameExteriorPressureAndCoefficientErrorsZeroAfterLastIpos);
assert.deepEqual(paired.coupledMomentNumerators,[0,0,0,0,0]);
const env={...fixedOps.pins,...pairedOps.pins};
for(const [n,digest] of Object.entries(env)) await pinned(resolve(runtime,n),digest);
const load=n=>import(pathToFileURL(resolve(runtime,n)));
const src=await load('actual-residual-order-induction-source.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {sourceScaledOperators}=await load('actual-continuation-exact-order-two-source.mjs');
const {actualPositiveStressFTC}=await load('actual-background-residual-bridge.mjs');
const live=src.prepareActualOrderInduction({order:2,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,bootstrap:b,records:[leading,n1,n2]}=live,{constants:{X,eta},orderOne:r}=b;
const originalPrefixSHA256=sha(JSON.stringify(G.nodes));
assert.equal(originalPrefixSHA256,pairedOps.originalPrefixSHA256);
assert.equal(n2.norm.actual.C,paired.originalNorms.C2);
assert.equal(n2.norm.actual.strip,paired.originalNorms.s);
assert.equal(n2.norm.actual.Kcondition,paired.originalNorms.Kcondition);
assert.ok([n1,n2].every(n=>n.global.actualMomentChecks.every(row=>row.pass)));
assert.deepEqual(n2.stress.compactSupport,[r.Xminus,r.Xplus]);
assert.equal(r.Xplus,28824);
assert.equal(r.Xminus,28814);
assert.ok(r.Xminus!==r.Xplus);
assert.equal(eta,2);
assert.ok([r.Xminus,r.Xplus].every(id=>G.derivative(id,eta)===G.zero));
const primitive=actualPositiveStressFTC(live);
assert.ok(primitive.pass);
const rows=primitive.rows.filter(row=>row.order===2);
assert.equal(rows.length,2);
for(const row of rows){
  const expected=fixed.actualStress.find(old=>old.component===row.component);
  const [body,binder,low,high]=G.nodes[row.integral].args,
    density=row.component==='z'?n2.stress.zBody:n2.stress.thetaBody;
  assert.equal(row.root,expected.root);
  assert.equal(row.integral,expected.integral);
  assert.equal(density,expected.forwardDensity);
  assert.deepEqual([binder,low,high],[expected.binder,r.Xminus,X]);
  assert.equal(body,G.substitute(density,X,binder));
  assert.ok(G.freeCoordinates(body).has(eta));
  assert.deepEqual(row.openDomain,[r.Xminus,r.Xplus]);
  assert.ok(row.check.pass&&!row.negativeWrongSign.pass);
  const [backBody,backBinder,backLo,backHi]=G.nodes[expected.backInt].args;
  assert.deepEqual([backBinder,backLo,backHi],[expected.backBinder,X,r.Xplus]);
  assert.equal(backBody,G.substitute(density,X,backBinder));
  assert.ok(G.freeCoordinates(backBody).has(eta));
}

const q=(n,d=1)=>G.q(n,d),one=G.one,h=G.parameter('h'),{A,D,d,L}=G.core,
  {Z,T}=sourceScaledOperators(G,X,eta),shift=j=>G.mul(q(2*j),h),
  c=G.neg(A),a=G.neg(G.add(A,q(1,2))),cj=j=>G.add(c,shift(j)),aj=j=>G.add(a,shift(j)),
  omega=G.add(G.mul(q(-2),A),shift(2)),tau=G.add(omega,q(1,2));
const dx=f=>G.derivative(f,X),de=f=>G.derivative(f,eta);
const sumTerms=(U,F,V,Pi)=>{
  const z=[T(cj(2),U[2])],theta=[T(aj(2),F[2])];
  for(let i=0;i<3;i++){
    const j=2-i;
    z.push(G.mul(X,V[i],dx(U[j])),G.mul(U[i],Z(cj(j),U[j])));
    theta.push(G.mul(V[i],G.add(G.mul(X,dx(F[j])),F[j])),G.mul(U[i],Z(aj(j),F[j])));
  }
  z.push(Z(omega,Pi),G.mul(q(-2),G.add(G.mul(X,dx(dx(U[2]))),dx(U[2]))),
    G.neg(Z(G.sub(cj(1),D),Z(cj(1),U[1]))));
  theta.push(G.mul(q(-2),G.add(G.mul(X,dx(dx(F[2]))),G.mul(q(2),dx(F[2])))),
    G.neg(Z(G.sub(aj(1),D),Z(aj(1),F[1]))));
  return {z,theta};
};
const whole=[leading.global,n1.global,n2.global];
const native=sumTerms(...['U','F','v'].map(key=>whole.map(row=>row[key])),n2.global.Pi);
assert.deepEqual(native.z,n2.stress.axialTerms);
assert.deepEqual(native.theta,n2.stress.angularTerms);

const xx=G.fresh('C106_X'),ee=G.fresh('C106_eta'),atoms=[xx,ee,h],x=G.sub(X,xx),e=G.sub(eta,ee);
const at=f=>G.simultaneousSubstitute(f,[X,eta],[xx,ee]);
const exact=(lhs,rhs)=>sourceGraphRationalIdentity(G,G.sub(at(lhs),at(rhs)),{atomicNodes:atoms,maxTerms:300000});
const jet=name=>{
  const j=Array.from({length:6},(_,i)=>G.fresh('C106_jet_'+name+'_'+i));
  atoms.push(...j);
  return G.add(j[0],G.mul(j[1],x),G.mul(j[2],e),G.mul(q(1,2),j[3],G.pow(x,2)),
    G.mul(j[4],x,e),G.mul(q(1,2),j[5],G.pow(e,2)));
};
const vel=(name,j,U)=>{
  const v=G.fresh('C106_V_'+name);
  atoms.push(v);
  return G.sub(v,G.mul(x,at(Z(cj(j),U))));
};
const U=[0,1,2].map(j=>jet('U'+j)),F=[0,1,2].map(j=>jet('F'+j)),
  V=U.map((f,j)=>vel('true'+j,j,f)),Pi=jet('Pi2');
const u1=jet('u1'),u2=jet('u2'),f1=jet('f1'),f2=jet('f2'),p=jet('p2'),
  v1=vel('error1',1,u1),v2=vel('error2',2,u2);
const Uh=[U[0],G.sub(U[1],u1),G.sub(U[2],u2)],Fh=[F[0],G.sub(F[1],f1),G.sub(F[2],f2)],
  Vh=[V[0],G.sub(V[1],v1),G.sub(V[2],v2)],Ph=G.sub(Pi,p);
const R=sumTerms(U,F,V.map(f=>G.div(f,X)),Pi),Rh=sumTerms(Uh,Fh,Vh.map(f=>G.div(f,X)),Ph);
const delta=(p,q,ph,qh)=>G.sub(G.mul(p,q),G.mul(ph,qh));
const UV=delta(V[1],U[1],Vh[1],Uh[1]),FV=delta(V[1],F[1],Vh[1],Fh[1]),
  UU=delta(U[1],U[1],Uh[1],Uh[1]),UF=delta(U[1],F[1],Uh[1],Fh[1]);
const jz=G.add(G.mul(q(2),U[0],u2),UU,p),
  jt=G.mul(q(2),X,G.add(G.mul(U[0],f2),G.mul(u2,F[0]),UF)),xF=G.mul(q(2),X,f2);
const bz=G.add(G.mul(V[0],u2),UV,G.mul(v2,U[0]),G.mul(q(-2),X,dx(u2)),
  G.div(G.sub(G.mul(X,u2),G.mul(q(2),eta,X,jz)),L));
const bt=G.add(G.mul(q(2),X,G.add(G.mul(V[0],f2),FV,G.mul(v2,F[0]))),
  G.mul(q(-4),G.pow(X,2),dx(f2)),G.div(G.sub(G.mul(q(2),G.pow(X,2),f2),G.mul(q(2),eta,X,jt)),L));
const rz=G.div(G.add(G.neg(G.mul(G.add(cj(2),one),u2)),G.mul(D,eta,de(u2)),
  G.mul(q(2),eta,G.add(omega,one),jz),G.mul(d,de(jz))),L);
const rt=G.div(G.add(G.neg(G.mul(G.add(aj(2),q(2)),xF)),G.mul(D,eta,de(xF)),
  G.mul(q(2),eta,G.add(tau,one),jt),G.mul(d,de(jt))),L);
const viscZ=G.neg(Z(G.sub(cj(1),D),Z(cj(1),u1))),
  viscT=G.mul(q(-2),X,Z(G.sub(aj(1),D),Z(aj(1),f1)));
const lowerWeightedVisc=G.neg(Z(G.add(G.sub(aj(1),D),one),Z(G.add(aj(1),one),G.mul(q(2),X,f1))));
const az=G.sub(G.add(...R.z),G.add(...Rh.z)),athet=G.mul(q(2),X,G.sub(G.add(...R.theta),G.add(...Rh.theta)));
const azCons=G.add(dx(bz),rz,viscZ),atCons=G.add(dx(bt),rt,viscT);
const checks=[exact(az,azCons),exact(athet,atCons),exact(viscT,lowerWeightedVisc)];
assert.ok(checks.every(row=>row.pass));
const wrong=[
  exact(az,G.sub(azCons,dx(UV))),
  exact(athet,G.sub(atCons,dx(G.mul(q(2),X,FV)))),
  exact(az,G.sub(azCons,viscZ)),
  exact(athet,G.sub(atCons,viscT))
];
assert.ok(wrong.every(row=>!row.pass));
assert.ok(pairedOps.exteriorZeroChecks.every(row=>row.zero));
assert.equal(pairedOps.guards.lastIpos,117099);

const result={
  schema:'MathScope.C106.ActualCoupledN2StressOperands/1',pins,sourcePins:env,originalPrefixSHA256,
  eta,X,activeCutoffs:[r.Xminus,r.Xplus],lastIpos:pairedOps.guards.lastIpos,
  actualStress:fixed.actualStress,stressTermCounts:{z:native.z.length,theta:native.theta.length},
  nativePreviousOrderViscousTerms:{z:native.z.at(-1),theta:native.theta.at(-1)},
  coupledConservativeNumerators:checks.map(row=>row.numeratorMonomials),
  droppedLowerFluxAndViscosityNumerators:wrong.map(row=>row.numeratorMonomials),
  fixedPressureAndTail:{matrixBound:paired.originalNorms.C2,s:paired.originalNorms.s,Kcondition:paired.originalNorms.Kcondition},
  bothOriginalMomentChecks:{first:n1.global.actualMomentChecks.length,second:n2.global.actualMomentChecks.length},
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({cutoffs:result.activeCutoffs,eta,coupled:result.coupledConservativeNumerators,
  omittedLower:result.droppedLowerFluxAndViscosityNumerators}));
