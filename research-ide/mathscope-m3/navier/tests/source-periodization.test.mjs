import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {prepareActualSourceLocalization,assertActualSourceLocalization} from '../source-localization.mjs';
import {exactPeriodizationRequest,periodizationScaleLedger,attachActualSourcePeriodization,
  assertActualSourcePeriodization,actualSourcePeriodizationCertificate} from '../source-periodization.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';

let prepared,lastObservation=0;
function observe(extra={}){
  const text=readFileSync('/proc/self/status','utf8'),hostPID=Number(text.match(/^Pid:\s+(\d+)/m)?.[1]),
    addressSpaceBytes=Number(text.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,
    rssBytes=process.memoryUsage().rss,maximumRSSBytes=process.resourceUsage().maxRSS*1024;
  console.log('# SOURCE_PERIODIZATION '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maximumRSSBytes,addressSpaceBytes}));
  if(rssBytes>13*1024**3/2||addressSpaceBytes>7*1024**3)
    throw Object.assign(Error('Own periodization process exceeded its declared memory budget.'),{code:'RESOURCE_LIMIT'});
}
const context={onProgress:observe,checkCancelled:()=>{if(Date.now()-lastObservation>1000){lastObservation=Date.now();observe({stage:'periodization-resource-check'});}}};
const get=()=>prepared??=prepareActualSourceLocalization({},context).then(localization=>attachActualSourcePeriodization(localization));

test('pure exact source support selection preserves terminal time one',()=>{
  const x=exactPeriodizationRequest();
  assert.equal(x.spatialScale,'3');assert.deepEqual(x.t0,{numerator:'8',denominator:'9'});
  assert.deepEqual(x.forceTimeUpper,{numerator:'10',denominator:'9'});
  assert.equal(x.support.strictSquaredMarginNumerator,'5');
  const y=exactPeriodizationRequest({viscosity:'9/4'});
  assert.equal(y.spatialScale,'4');assert.deepEqual(y.t0,{numerator:'15',denominator:'16'});
  assert.equal(y.support.strictSquaredMarginNumerator,'28');
});

test('pure very small and very large positive viscosities keep exact strict gaps',()=>{
  const cases=['1/'+('1'+'0'.repeat(100)),('1'+'0'.repeat(100))+'/3','250/100','7/11'];
  for(const viscosity of cases){
    const x=exactPeriodizationRequest({viscosity}),n=BigInt(x.viscosity.numerator),d=BigInt(x.viscosity.denominator),l=BigInt(x.spatialScale);
    assert.ok(l>1n&&l*l*d>4n*n);assert.equal(BigInt(x.support.strictSquaredMarginNumerator),l*l*d-4n*n);
    assert.ok(l===2n||(l-1n)*(l-1n)*d<=4n*n);
  }
  assert.deepEqual(exactPeriodizationRequest({viscosity:'250/100'}).viscosity,{numerator:'5',denominator:'2'});
});

test('pure touching and overlapping source supports are rejected rather than summed',()=>{
  for(const input of [{spatialScale:'2'},{viscosity:'9/4',spatialScale:'3'},{viscosity:'100',spatialScale:'2'}])
    assert.throws(()=>exactPeriodizationRequest(input),{code:'OVERLAPPING_SUPPORT'});
  for(const viscosity of ['0','-1','1/0','Infinity','NaN','0.01','1e-400','1/2/3'])
    assert.throws(()=>exactPeriodizationRequest({viscosity}),{code:'INVALID_VISCOSITY'});
  assert.throws(()=>exactPeriodizationRequest({viscosity:'1',spatialScale:'3/2'}),{code:'INVALID_SPATIAL_SCALE'});
  assert.throws(()=>exactPeriodizationRequest({sameForcing:true,periodicPressure:true}),{code:'INVALID_INPUT'});
});

test('pure full PDE, pressure and integrated energy retain their correct Jacobians',()=>{
  const x=periodizationScaleLedger();assert.equal(x.checks.every(v=>v.pass),true);
  for(const value of Object.values(x.momentum))assert.deepEqual(value,{nuHalfPower:1,lambdaPower:3});
  for(const value of Object.values(x.pressurePoisson))assert.deepEqual(value,{nuHalfPower:0,lambdaPower:4});
  for(const value of Object.values(x.energyTerms))assert.deepEqual(value,{nuHalfPower:5,lambdaPower:-1});
  assert.notDeepEqual(x.momentum.force,{nuHalfPower:1,lambdaPower:0});
  assert.equal(x.sourcePDEOrEnergyExecuted,false);
});

test('source field authority is not created from an imported success record',()=>{
  for(const record of [{},{pass:true},{scope:{actualOriginalSourceCutoffConstructed:true,originalCriterionComplete:true}}])
    assert.throws(()=>attachActualSourcePeriodization(record),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('source actual localization is transported with the same cutoff and complete operator terms',async()=>{
  const s=await get(),{G,localization:l}=s;
  assert.equal(assertActualSourceLocalization(l),true);assert.equal(assertActualSourcePeriodization(s),true);
  assert.equal(s.checks.every(x=>x.pass),true);assert.equal(s.operator.velocity.every(row=>row.terms.length===5),true);
  assert.equal(s.operator.pressure.length,1);assert.deepEqual(s.support.periods,['1','1','1']);
  assert.equal(s.support.N8TwoPiGalerkinDomainSubstituted,false);assert.equal(s.support.atMostNonzeroTranslatesAtOnePoint,1);
  assert.equal(s.scales.velocity,G.q(3));assert.equal(s.scales.pressure,G.q(9));assert.equal(s.scales.force,G.q(27));
  assert.equal(s.scales.wholeEnergy,G.q(1,3));assert.equal(s.operator.arbitraryLerayProjectionApplied,false);
});

test('source transported cutoff has an actual unit plateau and exact initial zero branch',async()=>{
  const s=await get(),{G,localization:l}=s,coords=[...s.coordinates.physical,s.coordinates.positiveTau],
    inside=G.div(l.constants.tau0,G.mul(G.q(4),s.scales.timePullback)),outside=G.div(G.mul(G.q(2),l.constants.tau0),s.scales.timePullback),
    cInside=G.simultaneousSubstitute(s.cutoff.body,coords,[G.zero,G.zero,G.zero,inside]),
    cOutside=G.simultaneousSubstitute(s.cutoff.body,coords,[G.zero,G.zero,G.zero,outside]);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(cInside,G.one)).pass,true);
  assert.equal(sourceGraphRationalIdentity(G,cOutside).pass,true);
  for(const root of [...s.cutoff.gradient,s.cutoff.physicalTimeDerivative]){
    const a=G.simultaneousSubstitute(root,coords,[G.zero,G.zero,G.zero,inside]);
    const b=G.simultaneousSubstitute(root,coords,[G.zero,G.zero,G.zero,outside]);
    assert.equal(sourceGraphRationalIdentity(G,a).pass,true);assert.equal(sourceGraphRationalIdentity(G,b).pass,true);
  }
});

test('source original time, path and energy use the same combined scaling',async()=>{
  const s=await get(),{G}=s,atShift=G.substitute(s.coordinates.originalTime,s.coordinates.positiveTau,G.inv(s.scales.timePullback));
  assert.equal(sourceGraphRationalIdentity(G,atShift).pass,true);
  const atTerminal=G.substitute(s.coordinates.originalTime,s.coordinates.positiveTau,G.zero);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(atTerminal,G.one)).pass,true);
  assert.equal(s.time.terminalTime,'1');assert.equal(s.time.postTerminalVelocityExtensionClaimed,false);
  assert.equal(s.path.originalXin,s.localization.inner.point.Xin);assert.equal(s.path.originalE0,s.localization.inner.leading.actualE0);
  assert.equal(s.path.wholeLocalizedVelocityComputed,false);assert.equal(s.energy.finiteCoreEnergyUsedAsWholeEnergy,false);
});

test('source changed scales, gaps, pressure or completion flags invalidate the private seal',async()=>{
  const s=await get();assert.throws(()=>assertActualSourcePeriodization({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,key,bad]of [[s.scales,'force',s.G.one],[s.support,'atMostNonzeroTranslatesAtOnePoint',2],
    [s.scope,'originalN708Complete',true],[s.comparison.periodic,'periodicPressureRequired',false]]){
    const previous=object[key];object[key]=bad;
    try{assert.throws(()=>assertActualSourcePeriodization(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[key]=previous;}
  }
  assert.equal(assertActualSourcePeriodization(s),true);
});

test('source full scalar record retains original bindings and explicit missing full-field obligations',async()=>{
  const s=await get(),certificate=await actualSourcePeriodizationCertificate(s);
  assert.equal(certificate.verification.checksPass,true);
  assert.equal(certificate.graph.scalarProgramSHA256,await sha256(canonicalStringify(certificate.formulaProgram)));
  assert.ok(certificate.formulaProgram.nodes.length>s.localization.formulaProgram.nodes.length);
  assert.deepEqual(certificate.formulaProgram.nodes.slice(0,s.localization.formulaProgram.nodes.length),s.localization.formulaProgram.nodes);
  assert.equal(certificate.scope.originalN708Complete,false);assert.equal(certificate.scope.wholeM3Complete,false);
  assert.equal(certificate.operator.force.sourceForceConstructed,false);assert.equal(certificate.comparison.originalComparisonConclusionIssued,false);
  assert.equal(certificate.energy.sourceWholeKEnergyAvailable,false);
  observe({stage:'source-periodization-certificate-ready',nodeCount:s.G.nodes.length,scalarNodes:certificate.formulaProgram.nodes.length});
  if(process.env.M3_N7_PERIODIZATION_EVIDENCE)await writeFile(process.env.M3_N7_PERIODIZATION_EVIDENCE,JSON.stringify(certificate,null,2)+'\n');
});
