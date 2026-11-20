import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,stressPath,pairedPath,output]=process.argv.slice(2);
assert.ok(output,'Provide original runtime, frozen N3 stress operands, C105 paired receipt and fresh output');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async(path,id)=>{const raw=await readFile(path);assert.equal(sha(raw),id,path);return JSON.parse(raw);};
const prior={stress:'e630f67a5f175f0b5e305c8f6dec1a382bb2ff24453ef152fbf84630e8677183',
  paired:'4706411acb5ddf906fa50fc07e062c313374a2e34d0042c459da12eec0cddaf6'};
const stress=await read(stressPath,prior.stress),paired=await read(pairedPath,prior.paired);
assert.equal(paired.localStability.matrixCap,'Ma=2^20 Q^4');
assert.deepEqual(stress.exactLowerRecursionDifferences.lowerAngularAndAxialNumerators,[0,0]);
assert.equal(stress.exactLowerRecursionDifferences.omega2Numerator,0);assert.equal(stress.exactLowerRecursionDifferences.rawPressureNumerator,0);
for(const [name,hash] of Object.entries(stress.pins))assert.equal(sha(await readFile(resolve(runtime,name))),hash,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const source=await load('actual-residual-order-induction-source.mjs');
const {sourceSquareStepSecondDerivativeProof}=await load('actual-continuation-exact-order-two-source.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const live=source.prepareActualOrderInduction({order:3,maxNodes:2000000});
assert.ok(source.assertActualOrderInduction(live));
const {G,bootstrap:b,records:[n0,n1,n2,n3]}=live,{X,eta}=b.constants;
assert.equal(sha(JSON.stringify(G.nodes)),stress.sourcePrefixSHA256);
const q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,Q=G.parameter('Q'),h=G.parameter('h'),Xa=G.parameter('Xa');
const ns=[n1,n2,n3].map(n=>n.norm.actual),[nativeS1,s2,s3]=ns.map(n=>n.strip);
const s1=G.div(b.inner.delta,q(16)),a=G.sqrt(b.inner.aSquared);
const exact=(left,right,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(left,right),{atomicNodes,maxTerms:200000});
for(const [i,k] of [8,1<<19,1<<27].entries())assert.ok(exact([nativeS1,s2,s3][i],G.div(b.inner.delta,q(k)),[b.inner.delta]).pass);
assert.ok(exact(s2,G.mul(q(256),s3),[b.inner.delta]).pass);
for(const n of [n2,n3]){
  const {raw,order}=n,s=G.picardSystems[raw.system],fromSource=source.actualInductionLinearKernel(G,{X,eta,xi:raw.xi,lambda:G.mul(q(2*order),h),
    F0:n0.actual.F,U0:n0.actual.U,v0:n0.actual.v,pKnown:raw.pKnown,Htheta:raw.Htheta,Hz:raw.Hz});
  const atXi=id=>G.substitute(id,X,G.pow(raw.xi,2));
  assert.equal(n.norm.actual.radialDomain,b.inner.aSquared);
  assert.deepEqual(s.diagonal,[0,0,2,0,3,1]);
  assert.deepEqual(s.A0,fromSource.matrix0.map(row=>row.map(atXi)));
  assert.deepEqual(s.A1,fromSource.matrix1.map(row=>row.map(atXi)));
  assert.deepEqual(s.forcing,fromSource.rawForcing.map(atXi));
  assert.deepEqual(s.A0.slice(0,2),[[z,z,z,z,o,z],[z,z,z,z,z,o]]);
  assert.deepEqual(s.A1.slice(0,2),[Array(6).fill(z),Array(6).fill(z)]);
  assert.deepEqual(s.forcing.slice(0,2),[z,z]);
}

// Exact first/weighted-second X conversion for either pure diagonal row.
const xi=G.fresh('C110C_xi'),xi0=G.fresh('C110C_xi0'),w=G.fresh('C110C_w_at_xi'),rr=G.fresh('C110C_rhs');
const second=[3,1].map(diag=>{
  const wPrime=G.sub(rr,G.div(G.mul(q(diag),w),xi0));
  const wAt=G.add(w,G.mul(wPrime,G.sub(xi,xi0)));
  const Dx=G.div(wAt,G.mul(q(2),xi));
  const Dxx=G.mul(G.pow(xi,2),G.div(G.derivative(Dx,xi),G.mul(q(2),xi)));
  const observed=G.substitute(Dxx,xi,xi0), wanted=G.div(G.sub(rr,G.div(G.mul(q(diag+1),w),xi0)),q(4));
  const proof=exact(observed,wanted,[xi0,w,rr]);
  const wrong=exact(observed,G.div(G.sub(rr,G.div(G.mul(q(diag),w),xi0)),q(4)),[xi0,w,rr]);
  assert.ok(proof.pass&&!wrong.pass);
  return {diag,actualNumerator:proof.numeratorMonomials,omittedGeometricTermNumerator:wrong.numeratorMonomials};
});
const step=sourceSquareStepSecondDerivativeProof();
assert.ok(step.pass&&step.sigmaPrimeUpper.startsWith('9 ')&&step.sigmaSecondUpper==='8192');
const t1=G.parameter('t1'),w0=G.div(t1,q(64));
const k1=G.div(q(9),G.mul(w0,Xa));
const k2=G.add(G.div(q(9),G.mul(w0,G.pow(Xa,2))),G.div(q(8192),G.mul(G.pow(w0,2),G.pow(Xa,2))));
const taper=G.add(o,G.mul(q(3),k1),k2),Ma=G.mul(q(1n<<20n),G.pow(Q,4));
const E=s=>G.add(o,G.div(q(2),s));
const C1=ns[0].C,M1=ns[0].solutionNorm;
const H1=G.div(G.mul(q(4096),G.add(o,C1),G.add(o,M1),G.pow(Q,64)),G.mul(t1,s1));
const forcing2Gain=G.div(G.mul(q(1n<<25n),H1),G.pow(s1,2));
const individual=ns.slice(0,2).map(({C,solutionNorm,strip})=>{
  const rawSlope=G.add(G.mul(Ma,E(strip),solutionNorm),C);
  return G.mul(taper,G.add(solutionNorm,G.mul(q(2),rawSlope)));
});
const P=G.maximum(o,b.inner.B,...individual);
const e0=G.mul(q(1n<<25n),G.pow(Q,64),G.pow(t1,-2),G.add(G.mul(q(1n<<73n),G.pow(Q,-77)),G.mul(q(1n<<46n),G.pow(Q,-19))));
const rawTail=(e,epsilon2,epsilon3)=>{
  const Fd2=G.mul(forcing2Gain,e),E2=G.add(epsilon2,G.mul(q(2),a,Fd2));
  const J2=G.add(G.mul(q(16),Ma,E(s2),E2),Fd2);
  const N2Cut=G.mul(taper,G.add(E2,G.mul(q(2),J2)));
  const finiteLower=G.add(e,N2Cut);
  const localFd3=G.div(G.mul(q(1n<<35n),P,finiteLower),G.pow(s2,4));
  const E3=G.add(epsilon3,G.mul(q(2),a,localFd3));
  const J3=G.add(G.mul(q(16),Ma,E(s3),E3),localFd3);
  const N3Cut=G.mul(taper,G.add(E3,G.mul(q(2),J3)));
  const eta3=G.mul(q(6),G.pow(G.add(o,G.div(q(16),s3)),3),G.add(E3,N3Cut));
  return {Fd2,E2,J2,N2Cut,localFd3,E3,J3,N3Cut,eta3,gain:G.add(finiteLower,eta3)};
};
const coefficients=[[o,z,z],[z,o,z],[z,z,o]].map(xs=>rawTail(...xs)),[Pn,P2,P3]=coefficients.map(t=>t.gain);
const bits=q(258),ln2=G.log(q(2)),ln4=G.log(q(4));
const depth=k=>G.ceiling(G.div(G.add(G.mul(bits,ln2),G.log(G.add(o,k))),ln4));
const N=G.add(q(2),G.ceiling(G.div(G.log(G.add(o,G.mul(G.pow(q(2),258),Pn,e0))),G.mul(q(25),G.log(Q)))));
const K2=G.maximum(G.add(ns[1].Kcondition,q(2)),depth(P2)),K3=G.maximum(G.add(ns[2].Kcondition,q(2)),depth(P3));
assert.ok([N,K2,K3].every(id=>G.freeCoordinates(id).size===0));
const out={schema:'MathScope.C110.OriginalNativeN3PairedLocalMixedOperands/1',prior,pins:stress.pins,
  actualSourcePrefix:stress.sourcePrefixSHA256,actualSystems:[n2.raw.system,n3.raw.system],radialDomain:[z,b.inner.aSquared],originalEta:eta,
  nativeEtaStrips:{nativeS1,s1,s2,s3,delta:b.inner.delta,ratioS2OverS3:256},exactWeightedSecond:second,
  stableMatrix:{bound:Ma,formula:'2^20 Q^4',wordRatio:'6 Ma a/s3 < 2^52 Q^-26 < 1/2',originalLeadingUnchanged:true},
  positiveScales:{a,Q,t1,Xa,k1,k2,taper,Ma,H1,forcing2Gain,C1,M1,P,e0,individual,
    nativeC2:ns[1].C,nativeC3:ns[2].C,Kcondition2:ns[1].Kcondition,Kcondition3:ns[2].Kcondition},
  actualScalarCoefficients:coefficients,depths:{N,K2,K3,positiveBudgetBits:258,freeCoordinateCount:0,numericallyEvaluated:false},
  exactLocalCoupledForcingFourIdentities:[0,0,0,0],lowerWholeIposEta3Attached:false,generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({actualSystems:out.actualSystems,second,N,K2,K3,eta3:coefficients.map(row=>row.eta3)}));
