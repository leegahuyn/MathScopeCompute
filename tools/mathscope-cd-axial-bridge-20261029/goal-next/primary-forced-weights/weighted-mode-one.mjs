import { join } from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const [goal, navier] = process.argv.slice(2);
assert(goal && navier, 'Expected the goal-next and original M3 navier directories');
const evidence = path => join(goal, path);
const original = path => join(navier, path);

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function read(path, expectedHash) {
  const bytes = fs.readFileSync(path);
  assert.equal(hash(bytes), expectedHash, path);
  return JSON.parse(bytes);
}
const live=read(evidence('primary-forced-join/hosted-43219432398/native-receipt.json'),'20bb095d62f467628ba63713a4e13d6a0fd95f6ac5687276a3f918f69186ce2b');const g0=read(evidence('g0-supported/actual-g0-order.json'),'14cee96f2b9f0d47114041c9dd2989da0cc7a4012521f350a5961248a3a352a5');const selectors=read(evidence('whole-k-annular-initial/initialized-mean-selectors.json'),'715139cf007ad4ba9dbaa29c3ca2b135b9865c98c3423056c2925a21cef1bfdf');
assert.equal(live.status,'VERIFIED_LIVE_SOURCE_JOIN_ONLY');assert.equal(live.same_family_join.systems,20);assert.equal(live.same_family_join.components,120);assert.equal(live.same_family_join.actualInputForcingWClassCertified,false);assert.equal(live.same_family_join.primaryOrder,2);assert.equal(g0.cases.length,10);assert(g0.cases.every(c=>c.rawComponents.filter(x=>x.mode===1).every(x=>x.nativeDemand.wave===2&&x.nativeDemand.mean===1)));assert.deepEqual(selectors.actualRoots,{psiT:1706770,temporalDirectV:1706624,temporalPsiNativeBody:1706769,psiFive:3614778,vTotal:3614791,pMean:3615361,totalPressureMoment:3615205});assert.equal(selectors.norms.temporalPsiC3.epsilonExponent,'1-kappa_s');assert.equal(selectors.norms.fivePsiC3.epsilonExponent,'1-kappa_s');assert.equal(selectors.norms.meanDirectV_C2.epsilonExponent,'1-kappa_s');
const source=fs.readFileSync(original('source-harmonic-assembly.mjs'));assert.equal(hash(source),'339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20');const sourceText=source.toString();for(const fragment of ['T=a.map(x=>b.map(y=>S.mul(x,y)))','S.add(Dr(row[0]),S.scale(invR,row[0]),angular(row[1]),Dz(row[2]))','out[0]=S.sub(out[0],S.scale(invR,T[1][1]))','out[1]=S.add(out[1],S.scale(invR,T[0][1]))','C.imaginary(G.mul(k,G.q(m),phaseDerivative),x)'])assert(sourceText.includes(fragment));
// Exact monomial ledger for mixed-mode conservative tensor divergence.
// Variables refer to cylindrical mean M and complex coefficient A;
// explicit source p=0,2 derivatives, three phase pieces and cylindrical connections.
function put(table, group, coefficient, ...factors) {
  const key = group + '|' + factors.sort().join('*');
  table.set(key, (table.get(key) ?? 0) + coefficient);
}

function ledger(j) {
  const table = new Map();
  for (const p of [0, 2]) {
    put(table, 'dA', 1, `M${j}`, `D${p}A${p}`);
    put(table, 'dM', 1, `D${p}M${j}`, `A${p}`);
    put(table, 'dA', 1, `M${p}`, `D${p}A${j}`);
    put(table, 'dM', 1, `D${p}M${p}`, `A${j}`);
  }
  for (const p of [0, 1, 2]) {
    put(table, 'phase', 1, `N${p}`, `M${j}`, `A${p}`);
    put(table, 'phase', 1, `N${p}`, `A${j}`, `M${p}`);
  }
  put(table, 'connection', 1, `M${j}`, 'A0');
  put(table, 'connection', 1, `A${j}`, 'M0');
  if (j === 0) put(table, 'connection', -2, 'M1', 'A1');
  if (j === 1) {
    put(table, 'connection', 1, 'M0', 'A1');
    put(table, 'connection', 1, 'A0', 'M1');
  }
  return table;
}

const cases = [];
for (let component = 0; component < 3; component++) {
  const sums = {dA: 0, dM: 0, phase: 0, connection: 0};
  for (const [key, coefficient] of ledger(component)) {
    sums[key.split('|')[0]] += Math.abs(coefficient);
  }
  assert(sums.dA <= 4 && sums.dM <= 4 && sums.phase <= 6 && sums.connection <= 4);
  cases.push({component, absoluteCoefficientSums: sums});
}
// Exact exponents use units 1/100000, kappa_s=1/100000.
const kappa=1,unit=100000,target=unit-3*kappa,mean=unit-2*kappa,meanD=unit-3*kappa,wave=unit/2,waveD=wave-kappa,kcarrier=-unit/2;
const exponents={phase:mean+wave+kcarrier,regularMeanGradient:meanD+wave,regularWaveGradient:mean+waveD,connection:mean+wave};for(const e of Object.values(exponents))assert(e>=target);assert(unit>0&&wave-3*kappa>=0);
// Countermodel on an annular patch: mean=e_theta, wave=n^-1 e^(in theta)e_z.
// epsilon=n^-2; both divergences vanish and the nonzero z interaction is i.
const row=live.same_family_join.rows.find(r=>r.key==='0:-1'&&r.m===1),actual=row.components.find(c=>c.j===0&&c.part==='real');assert.deepEqual([actual.raw,actual.primary,actual.supported,actual.mapped,actual.formalPathSource],[4576550,4579554,4582026,4740988,4741084]);
const out={status:'CONDITIONAL_POINTWISE_ORDER_ZERO_ONLY',actualLiveSourceExample:{case:'0:-1',mode:1,component:0,part:'real',...actual},sourceEvidence:{exactHarmonicSourceSHA256:hash(source),liveReceipt:'20bb095d62f467628ba63713a4e13d6a0fd95f6ac5687276a3f918f69186ce2b',oldPolynomialReceipt:'14cee96f2b9f0d47114041c9dd2989da0cc7a4012521f350a5961248a3a352a5',oldWeightedSelectors:'715139cf007ad4ba9dbaa29c3ca2b135b9865c98c3423056c2925a21cef1bfdf',oldAndNewGraphsAreNotIdentified:true},conditionalBound:'|I_j| <= 4(M0*A1+A0*M1)+(4*Rinv+6*k*nMax)*M0*A0',ingredientConditions:['actual conservative mean interaction with the SAME source mean and primary wave','A0<=Ca*epsilon^(1/2)*sqrt(zeta)*delta^-p*P(v)','A1<=Ca*epsilon^(1/2-kappa_s)*sqrt(zeta)*delta^-p*P(v)','M0<=Cm*epsilon^(1-2*kappa_s)*zeta*delta^-b; M1<=Cm*epsilon^(1-3*kappa_s)*zeta*delta^-b','k<=Ck*epsilon^(-1/2), nMax<=Cn, 1/R<=Cr','0<epsilon,zeta,delta,P<=1; fixed source support and valid native slow derivatives'],consequence:'|I_j| <= Ca*Cm*[8+4*Cr+6*Ck*Cn]*epsilon^(1-3*kappa_s)*sqrt(zeta)*delta^(-(b+p))*P(v)',exponentUnits:'1/100000',testedExponents:exponents,targetExponent:target,exactConservativeMonomialChecks:cases,counterexample:'On an annular patch M=e_theta, a=(1/n)e_z exp(i*n*theta), epsilon=1/n^2: M,a are divergence-free, mean bounded, wave O(sqrt(epsilon)), but the z interaction is i on R=1; an unweighted mean does not imply any positive epsilon power.',open:['weighted mean C1 in the live joined private family','wave A1 and phase geometry on the exact actual source and fixed pulse path','same-family transfer of the older scalar selectors, including their C16 target and prefix14 leaves','weighted source derivatives and original cutoff edge/label semantics','primary residual and full supported source, all 20 inverse inputs'],notAFullWAlphaCertification:true,release:'HOLD'};console.log(JSON.stringify(out,null,2));
