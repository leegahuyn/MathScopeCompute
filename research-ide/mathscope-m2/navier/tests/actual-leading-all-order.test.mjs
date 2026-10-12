import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {actualLeadingAllOrderJets,ACTUAL_LEADING_ALL_ORDER_BINDINGS} from '../actual-leading-all-order-jets.mjs';
import {implicitCatalanCoefficients,physicalXConversion,PositiveTaylorLedger} from '../actual-leading-all-order-jets-arithmetic.mjs';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {SOURCE_PROFILE_ID} from '../source-profile.mjs';

const base=fileURLToPath(new URL('../../../',import.meta.url));
const call=(r,m)=>actualLeadingAllOrderJets({radialOrder:r,etaOrder:m});
const standard=call(2,6);
const allowed=new Set(['rational','source_parameter','add','multiply','inverse','integer_power','exp','log_positive','sqrt_positive']);

test('original document bytes and hashes are bound to this actual source',()=>{
  for(const f of ACTUAL_LEADING_ALL_ORDER_BINDINGS){const b=readFileSync(base+f.path);assert.equal(b.length,f.bytes,f.path);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256,f.path);}
});
test('all actual B8, loop, I1 and full heat I2 definitions are internally selected',()=>{
  assert.equal(standard.pass,true);assert.equal(standard.profileId,SOURCE_PROFILE_ID);
  assert.equal(standard.sourceFunctionIdentity.sameOriginalN,true);assert.equal(standard.sourceFunctionIdentity.actualB8AndI1RootBodiesPresent,true);assert.equal(standard.sourceFunctionIdentity.actualHeatI2RootBodyPresent,true);
  for(const proof of Object.values(standard.rootProofs))assert.ok(Object.values(proof.checks).every(Boolean));
});
test('orders beyond the old twelve-derivative audit generate finite new bounds',()=>{
  for(const [r,m]of [[0,0],[13,0],[0,17],[6,17],[10,24]]){
    const a=call(r,m);assert.equal(a.pass,true);assert.equal(a.totalTaylorOrder,r+m);
    assert.equal(a.primitive.derivativeOrder,r+m+8);assert.equal(a.primitive.ordinaryDerivativeBounds.length,r+m+9);
    assert.ok(a.normProgram.nodes[a.bounds.U0.root]);assert.ok(a.normProgram.nodes[a.bounds.F0active.root]);
    assert.equal(a.scope.fixedSixOrTwelveJetExtrapolation,false);
  }
});
test('norm ASTs contain full finite expressions and no source-oracle norm leaf',()=>{
  const p=standard.normProgram;
  for(const [i,node]of p.nodes.entries()){
    assert.ok(allowed.has(node.op),node.op);
    const refs=node.op==='rational'||node.op==='source_parameter'?[]:node.op==='integer_power'?[node.args[0]]:node.args;
    for(const ref of refs)assert.ok(Number.isInteger(ref)&&ref>=0&&ref<i,'topological positive graph');
  }
  assert.deepEqual(p.nodes[p.roots.actualSourceR],{op:'source_parameter',args:['C12EnvelopeR']});
  assert.deepEqual(p.nodes[p.roots.actualSourceN],{op:'source_parameter',args:['radialFrequencyN']});
});
test('every division and square root has a positive expression argument',()=>{
  const signs=[];
  for(const node of standard.normProgram.nodes){
    const a=node.args.map(x=>signs[x]);let s;
    if(node.op==='rational')s=BigInt(node.args[0])>0n?1:BigInt(node.args[0])<0n?-1:0;
    else if(node.op==='source_parameter'||node.op==='exp')s=1;
    else if(node.op==='multiply')s=a.includes(0)?0:a.every(x=>x===1||x===-1)?a.reduce((x,y)=>x*y,1):null;
    else if(node.op==='add')s=a.every(x=>x===0||x===1)?a.some(x=>x===1)?1:0:a.every(x=>x===0||x===-1)?-1:null;
    else if(node.op==='integer_power')s=node.args[1]%2===0?1:a[0];
    else if(node.op==='inverse'||node.op==='sqrt_positive'){assert.equal(a[0],1,node.op+' at '+signs.length);s=1;}
    else if(node.op==='log_positive'){assert.equal(a[0],1);s=1;/* all logs are C,XR,Lambda >1 */}
    signs.push(s);
  }
  for(const key of ['U0','F0inner','F0active'])assert.equal(signs[standard.bounds[key].root],1);
});
test('small g is never inverted in reference source bounds',()=>{
  const rows=standard.normProgram.ledger;
  assert.ok(rows.some(x=>x.label==='actual reference p1'&&x.smallGDividedOut===false));
  assert.ok(rows.some(x=>x.label==='actual zeta denominator'&&x.positiveValueLower!==undefined));
  assert.ok(rows.some(x=>x.label==='actual B22 Rr'&&x.actualValueUpper!==undefined));
  assert.ok(rows.some(x=>x.label==='actual reference ns'&&x.allSixSnTermsIncluded));
});
test('singular ideal B8 comparison uses its five exact primitives',()=>{
  const row=standard.normProgram.ledger.find(x=>x.label==='actual minus exact ideal B8 moments');
  assert.equal(row.idealAxisSingularDensityNotBoundedByActualF,true);
  assert.equal(row.idealCpPrimitive,'(5/2)*Keta^2*x^(1/5)');assert.equal(row.inputs.length,10);
});
test('removable variance retains the extra two source derivatives at p2=0',()=>{
  const row=standard.normProgram.ledger.find(x=>x.label==='removable Q at p2=0');
  assert.equal(row.requiredTiltOrder,row.order+2);assert.equal(row.divisionByP2,false);
  assert.ok(standard.normProgram.ledger.some(x=>x.label==='removable actual t integral'));
});
test('arbitrary implicit recurrence includes variable coefficients and all mixed degrees',()=>{
  const a=implicitCatalanCoefficients(19);
  const at=(row,A)=>row.terms.reduce((s,t)=>s+BigInt(t.coefficient)*A**BigInt(t.aPower)*(1n+A)**BigInt(t.onePlusAPower),0n);
  const exact=[0n];for(let m=1;m<=19;m++){let v=2n;for(let i=1;i<m;i++)v+=3n*exact[i]*exact[m-i];exact.push(v);}
  for(let m=1;m<=19;m++)assert.equal(at(a.rows[m-1],2n),exact[m]);
  assert.ok(a.rows[18].terms.some(t=>t.onePlusAPower===18));
  for(const row of standard.normProgram.ledger.filter(x=>x.rule==='actual root implicit Catalan recurrence')){
    assert.equal(row.coefficientNormIncludesExternalAndUnknownVariables,true);
    assert.equal(row.fullMixedMajorant,'A*(1/((1-t)*(1-w))-1-w)');
    assert.equal(row.actualJacobianInverseNorm,row.inputs[1]);
  }
});
test('physical X conversion keeps all signed falling-Euler terms',()=>{
  assert.deepEqual(physicalXConversion(4,2).unsignedCoefficients,['0','6','11','6','1']);
  assert.equal(physicalXConversion(4,2).ordinaryCoefficient,'176');
  assert.equal(physicalXConversion(0,0).ordinaryCoefficient,'1');
  const row=standard.normProgram.ledger.find(x=>x.label==='actual fast phase substitution');
  assert.equal(row.sameN,true);assert.equal(row.etaPhaseDerivative,0);
  assert.equal(standard.normProgram.nodes[row.factor].op,'integer_power');
});
test('Finner equality is restricted before C12 while Factive includes actual I2',()=>{
  assert.ok(standard.bounds.F0inner.domain.X[1].includes('t1/16'));
  assert.equal(standard.bounds.F0inner.completedLeadingEqualityOnlyBeforeC12,true);
  assert.ok(standard.bounds.F0active.domain.X[1].includes('Xv*exp(1)'));
  assert.equal(standard.bounds.F0active.actualHeatI2CorrectionIncluded,true);
  assert.equal(standard.bounds.F0active.actualHeatEditIsZeroOnThisDomain,true);
  assert.equal(standard.bounds.F0active.domain.containsAllPositiveOrderVelocityCoefficientSupport,true);
  assert.equal(standard.bounds.F0active.domain.containsStressSupportFromOrder,2);
  assert.equal(standard.bounds.F0active.domain.containsFullFirstOrderAngularStressSupport,false);
  assert.equal(standard.bounds.F0active.fullGlobalF0,false);
});
test('new heat eta jets retain Gamma moments and improper radial decay',()=>{
  const row=standard.normProgram.ledger.find(x=>x.label==='actual heat loss arbitrary eta jet with radial decay');
  assert.equal(row.gammaMomentRows.length,8);assert.equal(row.radialDecayRetained,'1/X');assert.equal(row.improperTailIncluded,true);
  assert.equal(standard.heatDerivativeProof.radialIntegrals.I,'integral_1^infinity x^(-1-h) dx=1/h');
  assert.equal(standard.heatDerivativeProof.oldH9C2Extrapolated,false);
});
test('source/scale injection, derivative omission and cancellation are rejected',()=>{
  for(const input of [null,{radialOrder:-1},{etaOrder:1.5},{etaOrder:129},{R:1},{N:1},{U0:0},{sourceProfile:'fixture'}])assert.throws(()=>actualLeadingAllOrderJets(input));
  assert.throws(()=>actualLeadingAllOrderJets({radialOrder:1,etaOrder:1},{checkCancelled:()=>{throw Error('cancelled');}}),/cancelled/);
  assert.throws(()=>actualLeadingAllOrderJets({radialOrder:2,etaOrder:6},{jetOrderBudget:8}),/budget/);
});
test('an altered output cannot become a new actual source or change subsequent receipts',()=>{
  const a=call(0,1);a.normProgram.nodes[a.bounds.U0.root]={op:'rational',args:['0','1']};a.scope.originalN506Complete=true;
  const b=call(0,1);assert.notDeepEqual(b.normProgram.nodes[b.bounds.U0.root],a.normProgram.nodes[a.bounds.U0.root]);assert.equal(b.scope.originalN506Complete,false);
});
test('bounds never certify an unconstructed completed background, H or qstar',()=>{
  for(const key of ['fullGlobalF0DerivativeBound','positiveOrderCoefficientNormProduced','allOrderCutoffScheduleProduced','completedBackgroundC2TailCertified','actualUniformHColumnsCertified','sourceUniformQStarCertified','originalN506Complete','formalKernelProof'])assert.equal(standard.scope[key],false,key);
  assert.equal(standard.scope.highDerivativeBoundsMayExceedR,true);
});
test('the universal Taylor ledger preserves the actual denominator and slope nodes',()=>{
  const G=new ActualSourceExpressions(),J=new PositiveTaylorLedger(G),F=G.q(7),lo=G.q(1,3),inv=J.inverse('test',14,F,lo),root=J.implicit('test implicit',14,F,G.q(2),G.q(3),2);
  assert.ok(G.nodes[inv]);assert.ok(G.nodes[root]);assert.equal(J.rows[0].positiveValueLower,lo);assert.equal(J.rows[1].finiteCoefficientCount,105);assert.equal(J.rows[1].dimension,2);
});
