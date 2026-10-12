import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {evaluateActualMeanStress,compileActualMeanStressProgram,actualMeanStressBounds,verifyActualMeanStress,ACTUAL_MEAN_STRESS_BINDINGS} from '../actual-mean-stress.mjs';
import {PINNED_N3} from '../source-profile-data.mjs';

const result=evaluateActualMeanStress({bits:512}),program=result.program,sha=b=>createHash('sha256').update(b).digest('hex');
const physicalBase=new URL('../../../',import.meta.url),copy=()=>structuredClone(result);
function finiteAlgebra(program,rootValues,parameters){
  const overrides=new Map(Object.entries(rootValues).map(([name,v])=>[program.roots[name],v])),memo=new Map();
  const ev=id=>{
    if(overrides.has(id))return overrides.get(id);if(memo.has(id))return memo.get(id);const {op,args}=program.nodes[id];let v;
    if(op==='rational')v=Number(args[0])/Number(args[1]);else if(op==='source_parameter')v=parameters[args[0]];
    else if(op==='add')v=ev(args[0])+ev(args[1]);else if(op==='multiply')v=ev(args[0])*ev(args[1]);else if(op==='inverse')v=1/ev(args[0]);
    else if(op==='integer_power')v=ev(args[0])**args[1];else if(op==='exp')v=Math.exp(ev(args[0]));else if(op==='sqrt_positive')v=Math.sqrt(ev(args[0]));else if(op==='log_positive')v=Math.log(ev(args[0]));
    else throw Error('A finite algebra test may not silently evaluate a source integral or oracle: '+op);
    assert(Number.isFinite(v),'Every finite substitution is explicit: '+op);memo.set(id,v);return v;
  };
  return name=>ev(program.roots[name]);
}

test('mean stress is byte-bound to the actual same-source heat, continuation and restoration evidence',()=>{
  for(const file of[...ACTUAL_MEAN_STRESS_BINDINGS,...Object.values(PINNED_N3.inputs)]){
    const bytes=readFileSync(new URL(file.path,physicalBase));assert.equal(bytes.length,file.bytes);assert.equal(sha(bytes),file.sha256,file.path);
  }
  assert.equal(result.profileId,'same-profile-2026-10-10.3');assert.equal(result.parameterExpressionSHA256,PINNED_N3.parameterExpressionSHA256);
  assert.equal(result.axialParity.coreParityAssumed,false);assert.equal(result.axialParity.matchedAsFunctionsOfEta,true);
  assert.equal(program.exactRestoration.coreParityAssumed,false);assert(program.exactRestoration.I2.includes('negative'));
});

test('the exact heat program has all three integrands, the full improper tail and an independent Gamma integral',()=>{
  assert.equal(program.heatDefinition.GammaIsExplicitLaplaceIntegral,true);assert.equal(program.heatDefinition.axisComparisonGammaUsed,false);
  assert(!program.nodes.some(n=>n.op==='source_parameter'&&n.args[0]==='Gamma'));
  assert.equal(program.nodes[program.roots.heatGamma].op,'definite_integral');
  for(const name of['heatI','heatS','heatCp','heatIAtZero','heatThetaLower','heatThetaUpper','Xtail','Etail','rEntry','Jeta','viscousShear'].filter(n=>n!=='viscousShear'))assert(Number.isInteger(program.roots[name]),name);
  assert(program.compactIntegrals.some(x=>x.name==='fullHeatAngularDebt'));assert(program.compactIntegrals.some(x=>x.name==='fullHeatEnergyDebt'));assert(program.compactIntegrals.some(x=>x.name==='fullHeatPressureDebt'));
  assert(program.compactIntegrals.every(x=>x.upper==='infinity'&&x.endpointInterpretation.includes('improper')));
  assert.equal(program.heatDefinition.tailTruncated,false);assert(!program.operations.some(x=>/oracle|unknown|certificate|assumed/.test(x)));
  assert.equal(program.scope.entireHeatIntegralNumericallyQuadratured,false);
});

test('differentiating each actual heat integral yields an exactly zero eta derivative at zero',()=>{
  for(const name of['heatIetaAtZero','heatSetaAtZero','heatCpetaAtZero','heatM','heatJ','z'])assert.deepEqual(program.nodes[program.roots[name]],{op:'rational',args:['0','1']},name);
  assert.equal(result.normalizedTarget.zExact,'0');assert.deepEqual(result.normalizedTarget.z,[0,0]);
  assert.equal(result.axialParity.momentTotalsAloneAtEtaZeroUsed,false);
  // Missing only the derivative of a cumulative moment invalidates the parity:
  // U=M=eta=0, S_eta=1, Pi_eta=0 gives Ns=-1/X, not zero.
  const X=7,Ns=-1/X;assert.notEqual(Ns,0);
});

test('all exact exponent inequalities imply a positive non-degenerate source enclosure',()=>{
  for(const bits of[16,128,512,4096]){
    const b=actualMeanStressBounds(bits);assert(b.pass);assert.equal(b.checks.length,11);assert.equal(b.rows.length,7);
    for(const row of b.rows){const exponent=BigInt(row.decayT)*128n-BigInt(row.offset)-BigInt(row.powerOfTwo);assert.equal(String(exponent),row.strictDyadicUpperExponent);assert(exponent>BigInt(bits+3));}
    const [ln,ld]=b.theta.lower.split('/').map(BigInt),[un,ud]=b.theta.upper.split('/').map(BigInt);assert.equal(ld,1n<<BigInt(bits));assert.equal(ld,ud);assert.equal(un-ln,2n);assert(0n<ln&&ln<ld&&ud<un);
    assert(b.theta.binary64[0]<1&&b.theta.binary64[1]>1);if(bits<=52){assert(b.theta.binary64[0]<=1-2**(-bits));assert(b.theta.binary64[1]>=1+2**(-bits));}assert.equal(b.heatCompensation.strictlyPositive,true);assert.equal(b.heatCompensation.debtSetToZero,false);assert.equal(b.heatCompensation.tailDropped,false);
  }
});

test('finite algebra independently reconstructs (4.16), radial viscosity, and the heat compensation sign',()=>{
  for(let j=1;j<=12;j++){
    const lambda=.04+j/1000,h=.0002+j/100000,X=32+j,H=1+j/13,E=H/Math.sqrt(2*X),F=H/(2*X),mConst=.3+j/10,Jeta=.2+j/11,transient=-.005*j,DI=-.03-j/100;
    const ev=finiteAlgebra(program,{X,H,E,mConst,Jeta,transient,heatIAtZero:DI},{lambda,h});
    const Iref=X*H*(1/(1-lambda)+transient),I=Iref-DI,Qs=-1+mConst/X+((1-h)*I-Jeta)/(X*H),shear=2+2*lambda,expected=(X*Qs-shear)/(X*lambda);
    assert(Math.abs(ev('normalizedTheta')-expected)<2e-13);assert(Math.abs(ev('theta')/(F*X*lambda)-expected)<2e-13);
    assert(Math.abs(ev('IActual')-I)<1e-13);assert(Math.abs(ev('Qs')-Qs)<1e-14);
    const heat=-(1-h)*DI/(X*H*lambda);assert(heat>0);assert(Math.abs(ev('term_heatCompensation')-heat)<1e-14);
    const wrongSign=(-1+mConst/X+((1-h)*(Iref+DI)-Jeta)/(X*H)-shear/X)/lambda;
    const omittedHeat=(-1+mConst/X+((1-h)*Iref-Jeta)/(X*H)-shear/X)/lambda;
    assert(Math.abs(expected-wrongSign-2*heat)<2e-13);assert(Math.abs(expected-omittedHeat-heat)<2e-13);
    assert(Math.abs(expected-(Qs/lambda))>.5,'The viscosity contribution is not negligible for a generic algebra check.');
  }
});

test('precision changes the analytic radius while retaining the same actual point and complete source program',()=>{
  const a=evaluateActualMeanStress({y:1.25,bits:128}),b=evaluateActualMeanStress({y:1.25,bits:1024});
  assert.deepEqual(a.program.nodes,b.program.nodes);assert.deepEqual(a.program.roots,b.program.roots);assert.deepEqual(a.observedDomain,b.observedDomain);
  assert.notEqual(a.normalizedTarget.thetaExact.absoluteRemainderUpper,b.normalizedTarget.thetaExact.absoluteRemainderUpper);
  assert.equal(a.program.request.yExact,'5/4');assert.deepEqual(a.normalizedTarget.theta,b.normalizedTarget.theta);
});

test('retained observations reject omitted heat, false parity, fabricated zero or package completion',()=>{
  assert.equal(verifyActualMeanStress(result).pass,true);
  for(const mutate of[
    r=>r.sourceHash='0'.repeat(64),r=>r.parameterExpressionSHA256='0'.repeat(64),r=>r.sourceBindings[0].sha256='0'.repeat(64),
    r=>r.bounds.heatCompensation.debtSetToZero=true,r=>r.program.roots.heatIAtZero=r.program.roots.z,
    r=>r.program.exactRestoration.onImean.I='I_reference',r=>r.axialParity.coreParityAssumed=true,
    r=>r.normalizedTarget.theta=[1,1],r=>r.normalizedTarget.z=[-1,1],r=>r.scope.entireHeatIntegralNumericallyQuadratured=true,
    r=>r.scope.globalEquation730Certified=true,r=>r.scope.fullN5PackageComplete=true,r=>r.scope.positiveOrderBackgroundStressAssumedZero=true
  ]){const r=copy();mutate(r);assert.equal(verifyActualMeanStress(r).pass,false);}
});

test('actual representative scope and physical normalization are unambiguous',()=>{
  assert.equal(result.coordinateFrame,'PROFILE_X_ETA_AT_Q_OVER_QREF_ONE');assert.equal(program.normalization.theta,'T0_theta/(F*X*lambda)');
  assert.equal(result.scope.leadingStressOnly,true);assert.equal(result.scope.actualHeatPreparedTargetEnclosed,true);assert.equal(result.scope.wholeMeanYIntervalBounded,true);
  for(const k of['arbitraryEtaStressNumericallyEvaluated','positiveOrderBackgroundStressAssumedZero','globalCoreNumericallyEvaluated','wholeAnnulusCovarianceMatched','globalEquation730Certified','fullN5PackageComplete','newLeanKernelProof'])assert.equal(result.scope[k],false,k);
  assert.equal(result.rows[0].sourceProgramRoot,'normalizedTheta');assert.equal(result.rows[1].sourceProgramRoot,'z');
});

test('unsupported source, axis, field, heat debt, and input precision cannot enter this producer',()=>{
  for(const input of[null,[],2,{sourceProfile:'fabricated'},{eta:.1},{s:1},{h:0},{lambda:0},{heatDebt:0},{sourceCertificate:true},{y:0},{y:5},{y:NaN},{bits:0},{bits:12.5},{bits:4097}])assert.throws(()=>evaluateActualMeanStress(input));
  assert.deepEqual(evaluateActualMeanStress({y:4.75}),evaluateActualMeanStress({y:4.75}));assert.equal(verifyActualMeanStress(null).pass,false);
  assert.throws(()=>evaluateActualMeanStress({}, {checkCancelled(){throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}}),e=>e.code==='CANCELLED');
  const finite=x=>{if(typeof x==='number')assert(Number.isFinite(x));else if(x&&typeof x==='object')Object.values(x).forEach(finite);};finite(result);
});
