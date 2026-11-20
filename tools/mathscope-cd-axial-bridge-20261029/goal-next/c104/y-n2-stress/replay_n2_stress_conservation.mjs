import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, c103, c102Abs, c102Scales, output] = process.argv.slice(2);
assert(output, 'Usage: ORIGINAL_RUNTIME C103_Y C102_ABSOLUTE C102_SCALES NEW_JSON');
const sha = x => createHash('sha256').update(x).digest('hex');
const pinned = async (path, hash) => {
  const bytes = await readFile(path);
  assert.equal(sha(bytes),hash,path);
  return bytes;
};
const previousPins = {
  C103:'75221f220bc472ca8bb4f600a3cb46cb76e07d4d386ba1dcf6ce254e5b86e18b',
  C103Ops:'281e4b9d3e8046a8ad74c299b8a2d68661c1e7bcac73d3edf98a2d882dae24a0',
  C102Leading:'a66c0591ea13634608803e57ead2a80d6167270637afa72d6f74fc71d587d213',
  C102Scales:'abf5fe2c0527610d6b51a053b8fbf5891ea0ed8c43958553a4521efb73a32aac',
};
const last = JSON.parse(await pinned(resolve(c103,'n2-pressure-compensation.json'),previousPins.C103));
const ops = JSON.parse(await pinned(resolve(c103,'n2-pressure-compensation-operands.json'),previousPins.C103Ops));
const leading = JSON.parse(await pinned(resolve(c102Abs,'n1-absolute-outer-operands.json'),previousPins.C102Leading));
const scales = JSON.parse(await pinned(resolve(c102Scales,'n1-outer-scale-operands.json'),previousPins.C102Scales));
assert.equal(last.operandsSHA256,previousPins.C103Ops);
assert.equal(last.replacedN2NativeCalls,19);
const pins = {
  ...ops.pins,
  'actual-background-residual-bridge.mjs':'a0d2823ee658aadff65171441c06c9cb0f52ac7115be948e17600d343fd5788a',
};
for (const [name,hash] of Object.entries(pins)) await pinned(resolve(runtime,name),hash);
const load = n => import(pathToFileURL(resolve(runtime,n)));
const src = await load('actual-residual-order-induction-source.mjs');
const { actualPositiveStressFTC } = await load('actual-background-residual-bridge.mjs');
const { sourceScaledOperators, buildActualOmegaCoefficientOverX } = await load('actual-continuation-exact-order-two-source.mjs');
const { sourceGraphRationalIdentity } = await load('actual-continuation-exact-identities.mjs');
const live = src.prepareActualOrderInduction({order:2,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,records,bootstrap:b} = live,{orderOne:r, constants:{X,eta}} = b;
const [,n1,n2] = records, originalPrefixSHA256 = sha(JSON.stringify(G.nodes));
assert.equal(originalPrefixSHA256,ops.originalPrefixSHA256);
assert.equal(G.nodes.length,ops.originalNodeCount);
assert.ok(n1.global.actualMomentChecks.every(x=>x.pass));
assert.ok(n2.global.actualMomentChecks.every(x=>x.pass));
assert.equal(n2.norm.actual.C,ops.nativeTail.C);
assert.equal(n2.norm.actual.Kcondition,ops.nativeTail.Kcondition);
assert.equal(n2.norm.actual.strip,ops.nativeTail.strip);
assert.equal(n2.norm.actual.radialDomain,ops.nativeTail.radialDomain);

const q = (n,d=1)=>G.q(n,d), h=G.parameter('h'), zero=G.zero, one=G.one;
const Xa=G.parameter('Xa'),t1=G.parameter('t1'),matrix=G.picardSystems[n2.raw.system],norm=n2.norm.actual;
assert.equal(norm.C,G.mul(q(2),G.add(norm.matrixBound,...norm.forcingBounds)));
assert.equal(matrix.A0[0][4],one);
assert.equal(matrix.A0[1][5],one);
assert.deepEqual(matrix.A0.slice(0,2).map(row=>row.filter(x=>x!==zero).length),[1,1]);
assert.ok(matrix.A1.slice(0,2).every(row=>row.every(x=>x===zero)));
assert.equal(r.Xminus,G.mul(Xa,G.exp(G.div(t1,q(128)))));
assert.equal(r.Xkeep,G.mul(Xa,G.exp(G.div(t1,q(64)))));
assert.equal(r.Xcut,G.mul(Xa,G.exp(G.div(t1,q(32)))));
const {A,D,d,L}=G.core;
const {Z,T}=sourceScaledOperators(G,X,eta);
const c=G.neg(A), a=G.neg(G.add(A,q(1,2))), nu=j=>G.mul(q(2*j),h),
  gamma=G.add(c,nu(2)), beta=G.add(a,nu(2)), omega=G.add(G.mul(q(-2),A),nu(2)),
  tau=G.add(omega,q(1,2));
const same = (left,right,atoms=[]) => {
  const result=sourceGraphRationalIdentity(G,G.sub(left,right),{atomicNodes:atoms,maxTerms:200000});
  return result;
};
const scalarChecks = [
  same(G.add(c,gamma),omega,[h]),
  same(G.add(c,beta,one),tau,[h]),
  same(G.add(a,gamma,one),tau,[h]),
  same(G.add(omega,one),nu(1),[h]),
  same(G.mul(q(2),G.add(tau,one)),G.add(one,nu(2)),[h])
];
assert.ok(scalarChecks.every(p=>p.pass));

const fwd = actualPositiveStressFTC(live);
assert.ok(fwd.pass);
const literal = fwd.rows.filter(row=>row.order===2).map(row=>{
  const {component,root,raw,integral}=row;
  const [body,binder,left,right]=G.nodes[integral].args;
  const forwardDensity=component==='theta'?n2.stress.thetaBody:n2.stress.zBody;
  assert.equal(body,G.substitute(forwardDensity,X,binder));
  assert.ok(G.freeCoordinates(body).has(eta));
  assert.ok(!G.freeCoordinates(body).has(X));
  assert.deepEqual([left,right],[r.Xminus,X]);
  assert.deepEqual(row.openDomain,[r.Xminus,r.Xplus]);
  assert.ok(left!==r.Xplus);
  assert.ok([r.Xminus,r.Xplus].every(cut=>G.derivative(cut,eta)===zero));
  assert.equal(root,component==='theta'?ops.originalN2StressSource.RZ[1]:ops.originalN2StressSource.RZ[0]);
  assert.equal(forwardDensity,component==='theta'?ops.originalN2StressSource.theta:ops.originalN2StressSource.z);
  assert.ok(row.negativeWrongSign.pass===false);
  const back=n2.stress[component==='theta'?'backwardTheta':'backwardZ'];
  const product=G.mul(back,row.denominator);
  const backIntegrals = new Set();
  const findIntegral = id => {
    const {op,args}=G.nodes[id];
    if(op==='definite_integral') backIntegrals.add(id);
    else if(op==='multiply'||op==='add'||op==='inverse') for(const sub of args)findIntegral(sub);
  };
  findIntegral(product);
  const [backInt]=backIntegrals;
  assert.equal(backIntegrals.size,1);
  const [backDensity,backBinder,backLeft,backRight]=G.nodes[backInt].args;
  assert.deepEqual([backLeft,backRight],[X,r.Xplus]);
  assert.equal(backDensity,G.substitute(forwardDensity,X,backBinder));
  assert.ok(G.freeCoordinates(backDensity).has(eta));
  assert.ok(same(product,backInt,[backInt]).pass);
  return {component,root,raw,forwardDensity,integral,binder,forwardBoundaries:[left,right],back,backInt,backBinder,
    backwardBoundaries:[backLeft,backRight],eta,physicalSupport:row.openDomain,wrongForwardSignRejected:true};
});
assert.equal(literal.length,2);

const {F,U,v,Pi}=n2.global, leadingFields=records[0].global;
const thetaSource=(fields)=>{
  const Fs=fields.map(r=>r.F),Us=fields.map(r=>r.U),Vs=fields.map(r=>r.v);
  const fx=Fs.map(y=>G.derivative(y,X)), terms=[T(beta,Fs[2])];
  for(let i=0;i<=2;i++){
    const j=2-i;
    terms.push(G.mul(Vs[i],G.add(G.mul(X,fx[j]),Fs[j])),G.mul(Us[i],Z(G.add(a,nu(j)),Fs[j])));
  }
  terms.push(G.mul(q(-2),G.add(G.mul(X,G.derivative(fx[2],X)),G.mul(q(2),fx[2]))),
    G.neg(Z(G.sub(G.add(a,nu(1)),D),Z(G.add(a,nu(1)),Fs[1]))));
  return terms;
};
const axialSource=(fields)=>{
  const Us=fields.map(r=>r.U),Vs=fields.map(r=>r.v),ux=Us.map(y=>G.derivative(y,X)),terms=[T(gamma,Us[2])];
  for(let i=0;i<=2;i++){
    const j=2-i;
    terms.push(G.mul(X,Vs[i],ux[j]),G.mul(Us[i],Z(G.add(c,nu(j)),Us[j])));
  }
  terms.push(Z(omega,fields[2].Pi),G.mul(q(-2),G.add(G.mul(X,G.derivative(ux[2],X)),ux[2])),
    G.neg(Z(G.sub(G.add(c,nu(1)),D),Z(G.add(c,nu(1)),Us[1]))));
  return terms;
};
const fields=[leadingFields,n1.global,{F,U,v,Pi}];
assert.deepEqual(thetaSource(fields),n2.stress.angularTerms);
assert.deepEqual(axialSource(fields),n2.stress.axialTerms);
assert.equal(n2.stress.angularTerms.length,9);
assert.equal(n2.stress.axialTerms.length,10);
const changed={F:G.fresh('C104_diff_F'),U:G.fresh('C104_diff_U'),v:G.fresh('C104_diff_v'),Pi:G.fresh('C104_diff_Pi')};
const alternative=[leadingFields,n1.global,changed];
const thetaAlt=thetaSource(alternative), axialAlt=axialSource(alternative);
for(const j of [3,4,8]) assert.equal(thetaAlt[j],n2.stress.angularTerms[j]);
for(const j of [3,4,9]) assert.equal(axialAlt[j],n2.stress.axialTerms[j]);

const xx=G.fresh('C104_anchor_X'),ee=G.fresh('C104_anchor_eta');
const dx=G.sub(X,xx),de=G.sub(eta,ee);
const anchor = x=>G.simultaneousSubstitute(x,[X,eta],[xx,ee]);
const atoms=[xx,ee,h];
function jet(name){
  const a=[0,1,2,3].map(i=>G.fresh('C104_jet_'+name+'_'+i));
  atoms.push(...a);
  return G.add(a[0],G.mul(a[1],dx),G.mul(q(1,2),a[2],G.pow(dx,2)),G.mul(a[3],de));
}
const f=jet('f'),u=jet('u'),p=jet('p'),f0=jet('F0'),u0=jet('U0');
const vel=(name,exponent,profile)=>{
  const val=G.fresh('C104_'+name);
  atoms.push(val);
  return G.sub(val,G.mul(dx,anchor(Z(exponent,profile))));
};
const V0=vel('V0',c,u0),V=vel('V',gamma,u),V0OverX=G.div(V0,X),VOverX=G.div(V,X);
const Df=G.derivative(f,X),Du=G.derivative(u,X);
const leftZ=G.add(T(gamma,u),G.mul(V0,Du),G.mul(V,G.derivative(u0,X)),
  G.mul(u0,Z(gamma,u)),G.mul(u,Z(c,u0)),Z(omega,p),
  G.mul(q(-2),G.add(G.mul(X,G.derivative(Du,X)),Du)));
const leftTheta=G.mul(q(2),X,G.add(T(beta,f),
  G.mul(V0OverX,G.add(f,G.mul(X,Df))),G.mul(VOverX,G.add(f0,G.mul(X,G.derivative(f0,X)))),
  G.mul(u0,Z(beta,f)),G.mul(u,Z(a,f0)),
  G.mul(q(-2),G.add(G.mul(X,G.derivative(Df,X)),G.mul(q(2),Df)))));
const jz=G.add(G.mul(q(2),u0,u),p),jt=G.mul(q(2),X,G.add(G.mul(u0,f),G.mul(u,f0)));
const bz=G.add(G.mul(V0,u),G.mul(V,u0),G.mul(q(-2),X,Du),
  G.div(G.sub(G.mul(X,u),G.mul(q(2),eta,X,jz)),L));
const bt=G.add(G.mul(q(2),X,G.add(G.mul(V0,f),G.mul(V,f0))),G.mul(q(-4),G.pow(X,2),Df),
  G.div(G.sub(G.mul(q(2),G.pow(X,2),f),G.mul(q(2),eta,X,jt)),L));
const rz=G.div(G.add(G.neg(G.mul(G.add(gamma,one),u)),G.mul(D,eta,G.derivative(u,eta)),
  G.mul(q(2),eta,G.add(omega,one),jz),G.mul(d,G.derivative(jz,eta))),L);
const xf=G.mul(q(2),X,f);
const rt=G.div(G.add(G.neg(G.mul(G.add(beta,q(2)),xf)),G.mul(D,eta,G.derivative(xf,eta)),
  G.mul(q(2),eta,G.add(tau,one),jt),G.mul(d,G.derivative(jt,eta))),L);
const zConservation=same(anchor(leftZ),anchor(G.add(G.derivative(bz,X),rz)),atoms);
const thetaConservation=same(anchor(leftTheta),anchor(G.add(G.derivative(bt,X),rt)),atoms);
assert.ok(zConservation.pass);
assert.ok(thetaConservation.pass);
const failZeroShift=same(anchor(leftZ),anchor(G.sub(G.add(G.derivative(bz,X),rz),
  G.div(G.mul(q(2),eta,G.add(omega,one),jz),L))),atoms);
assert.ok(!failZeroShift.pass);
assert.equal(scales.originalNodes.Xplus,r.Xplus);
assert.deepEqual([leading.originalSource.cut,leading.originalSource.IposLeft,leading.originalSource.last],
  [r.Xcut,r.X0,117099]);
assert.equal(leading.sameSourcePositiveLeadingValueBounds.programSHA256,
  'ba5d3599a275631cd316a27a24dc1834be356705f27485fa76d75d1495022339');

const oldOmega = buildActualOmegaCoefficientOverX(G,{
  order:1,X,eta,U:[records[0].actual.U,n1.actual.U],v:[records[0].actual.v,n1.actual.v]
});
assert.equal(oldOmega.value,n2.raw.omegaOverX);
assert.equal(oldOmega.value,ops.sourcePressure.rawOmega);
assert.ok(same(n2.raw.pKnown,
  G.sub(G.pow(n1.actual.F,2),G.mul(q(1,2),oldOmega.value)),[n1.actual.F,oldOmega.value]).pass);
const profileV0=jet('v0'),profileV1=jet('v1'),profileU1=jet('u1'),profileF1=jet('F1'),
  errorV1=jet('ev1'),errorU1=jet('eu1'),errorF1=jet('eF1');
const omega1 = (U1,v1)=>buildActualOmegaCoefficientOverX(G,{order:1,X,eta,U:[u0,U1],v:[profileV0,v1]}).value;
const sourceOriginal=G.sub(G.pow(profileF1,2),G.mul(q(1,2),omega1(profileU1,profileV1)));
const sourceApprox=G.sub(G.pow(G.sub(profileF1,errorF1),2),
  G.mul(q(1,2),omega1(G.sub(profileU1,errorU1),G.sub(profileV1,errorV1))));
const etaPower=G.sub(nu(1),one), dV1=G.derivative(errorV1,X);
const transport = (left,right)=>G.mul(left,G.add(G.mul(q(1,2),right),G.mul(X,G.derivative(right,X))));
const omegaError=G.add(T(etaPower,errorV1),
  G.mul(q(-2),G.add(G.mul(q(2),dV1),G.mul(X,G.derivative(dV1,X)))),
  transport(profileV0,errorV1), transport(errorV1,profileV0),
  G.mul(u0,Z(etaPower,errorV1)),G.mul(errorU1,Z(q(-1),profileV0)));
const pressureError=G.sub(G.mul(G.sub(G.mul(q(2),profileF1),errorF1),errorF1),
  G.mul(q(1,2),omegaError));
const sourcePressureErrorCheck=same(anchor(G.sub(sourceOriginal,sourceApprox)),anchor(pressureError),atoms);
assert.ok(sourcePressureErrorCheck.pass);

const record={
  schema:'MathScope.C104.OriginalN2StressConservativeOperands/1',pins,previousPins,originalPrefixSHA256,
  sourceOrders:[0,1,2],eta,X,stress:literal,
  sourceTermCounts:{axial:n2.stress.axialTerms.length,angular:n2.stress.angularTerms.length},
  lowerOnlyTermsCancel:{axial:[3,4,9],angular:[3,4,8]},
  actualSupport:{cut:r.Xcut,IposLeft:r.X0,last:117099,Xplus:r.Xplus,Xb:r.Xb,n1AngularDifferentEnd:true},
  matrixTail:{C:n2.norm.actual.C,s:n2.norm.actual.strip,Kcondition:n2.norm.actual.Kcondition},
  sameLeadingValueNorms:{U:leading.sameSourcePositiveLeadingValueBounds.U,F:leading.sameSourcePositiveLeadingValueBounds.F},
  conservativeIdentities:{axial:zConservation.numeratorMonomials,angular:thetaConservation.numeratorMonomials,
    shiftExponentRows:scalarChecks.map(p=>p.numeratorMonomials),wrongN1ExponentResidualMonomials:failZeroShift.numeratorMonomials},
  optionalInnerPressureForcingSensitivity:{source:n2.raw.pKnown,firstOmega:n2.raw.omegaOverX,
    exactErrorIdentityNumeratorMonomials:sourcePressureErrorCheck.numeratorMonomials},
  rawFixedEtaIndependentCutoffs:true
};
await writeFile(output,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceTermCounts:record.sourceTermCounts,conservative:record.conservativeIdentities,
  physicalSupport:[r.Xminus,r.Xplus],eta,bodyNodes:[n2.stress.zBody,n2.stress.thetaBody]}));
