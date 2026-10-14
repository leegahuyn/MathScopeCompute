import test from 'node:test';
import assert from 'node:assert/strict';
import {createMeanLimitCaptureRules} from './mean_capture.mjs';
import {inspectMeanDefiningCaptures} from '../mean-equivalence-20261014/mean-functional-equivalence.mjs';

function fixture(){
  const nodes=new Map([[0,{op:'rational',args:['0','1']}],[1,{op:'rational',args:['1','1']}],[2,{op:'coordinate',args:['eta']}],[3,{op:'coordinate',args:['xi']}],[4,{op:'coordinate',args:['actual_X']}],[5,{op:'coordinate',args:['fresh_radial']}]]);
  const zeros=()=>Array.from({length:6},()=>Array(6).fill(0));
  const metadata=Object.fromEntries(['axisProof','axisEnvelope','axisProducer','pressure','activation','stepDerivative','continuation'].map(name=>[name,{path:'fixture/'+name,sha256:'0'.repeat(64),bytes:0}]));
  const picard={name:'retained-system',order:1,xi:3,eta:2,diagonal:[0,0,2,0,3,1],A0:zeros(),A1:zeros(),forcing:Array(6).fill(0),zeroAxisDatum:Array(6).fill(0),unknowns:Array(6).fill('metadata'),radialDomain:[0,1],sourceLeading:{F0:1,U0:0,v0:0,omega0OverX:0},tail:{sourceMajorant:'actual-background-majorant.mjs:actualBackgroundMajorant',sourceBound:1,sourceStrip:1,solutionStrip:1,loss:1,Kcondition:1,Kprecision:1,K:1,etaOrder:2,error:0,target:1,proof:'retained premise',sourceTruncationIndexNumericallyMaterialized:false,tailIsForTheCertifiedIndexNotForDisplayedTerms:true},solutionNorm:{commonCollar:1,naturalExtensionToY5:1,naturalExtensionNotUsedAsActualActivation:true},actualSourceInputs:metadata,sourceEquations:['5.2','5.3','5.4','5.5','5.6','5.7','5.8'],leadingReferenceSubstitution:false,callerSuppliedForcing:false};
  nodes.set(10,{op:'actual_background_even_profile',args:[0,0,4,2,0,1]});
  const covariance={name:'retained-volterra',variable:3,parameters:[2],matrix:[[0,1],[1,0]],normUpper:1,length:1,initial:[1,0],implementation:'actual-covariance-volterra.mjs:covariancePartialSum',derivativeImplementation:'actual-covariance-volterra.mjs:covarianceRhs',solution:'retained ordered integral definition',normConvention:'induced infinity',coefficientNormMustBeBoundBySource:true,displayedPartialSumIsExactSolution:false};
  nodes.set(11,{op:'actual_covariance_volterra',args:[0,1,4,[2]]});
  const definitions={picard:[picard],m3GlobalPulses:[{covariance:0,parameters:[2],directions:[2],directionParameterIndices:[0],matrix:[[0,1],[1,0]],variable:3,left:0,length:1,initial:[1,0],originalDefinition:JSON.stringify(covariance),equation:'retained variational equation',exactSolution:'exact infinite limit',matrixDerivativesSuppliedByCaller:false,sourceAuthenticated:false}]};
  return {nodes,picard,covariance,definitions,sourceNode:id=>nodes.get(id)};
}
function inspect(f,body){const rules=createMeanLimitCaptureRules(f);return inspectMeanDefiningCaptures({sourceNode:f.sourceNode,definitions:f.definitions,operatorBindings:[{kind:'fixture',index:0,definition:{body,parameters:[4]}}],freshBinderSourceIDs:[5],sourceCaptureRules:rules.rules});}

test('full original Picard and Volterra grammar closes only binder syntax',()=>{
  const f=fixture();for(const body of [10,11]){const result=inspect(f,body);assert.equal(result.status,'FRESH_BINDER_CAPTURE_ABSENCE_CERTIFIED');assert.equal(result.allHiddenCaptureClosureProved,true);assert.equal(result.allAnalyticDomainsProved,false);}
});
test('hidden radial coordinate in an original Picard forcing is detected',()=>{const f=fixture();f.picard.forcing[0]=5;const result=inspect(f,10);assert.equal(result.status,'CAPTURE_WITNESS_FOUND');assert.equal(result.allHiddenCaptureClosureProved,false);});
test('hidden capture nested in an actual expression registry body is detected',()=>{
  const f=fixture();f.nodes.set(12,{op:'actual_expression_partial',args:[0,[],[]]});f.definitions.expression=[{body:5,parameters:[],derivativeLimits:[]}];f.picard.forcing[0]=12;assert.equal(inspect(f,10).status,'CAPTURE_WITNESS_FOUND');
});
test('hidden radial coordinate in original covariance matrix is detected',()=>{
  const f=fixture();f.covariance.matrix[0][0]=5;f.definitions.m3GlobalPulses[0].matrix[0][0]=5;f.definitions.m3GlobalPulses[0].originalDefinition=JSON.stringify(f.covariance);assert.equal(inspect(f,11).status,'CAPTURE_WITNESS_FOUND');
});
test('covariance originalDefinition and captured wrapper must agree',()=>{const f=fixture();f.covariance.parameters=[5];f.definitions.m3GlobalPulses[0].originalDefinition=JSON.stringify(f.covariance);assert.throws(()=>inspect(f,11),e=>e.code==='UNREVIEWED_CAPTURE_GRAMMAR');});
test('changed covariance initial or matrix tuple cannot keep the prior wrapper binding',()=>{
  for(const mutate of [f=>f.covariance.initial[0]=5,f=>f.covariance.matrix[0][0]=5]){const f=fixture();mutate(f);f.definitions.m3GlobalPulses[0].originalDefinition=JSON.stringify(f.covariance);assert.throws(()=>inspect(f,11),e=>e.code==='UNREVIEWED_CAPTURE_GRAMMAR');}
});
test('unknown defining record field stops instead of ignoring a hidden dependency',()=>{const f=fixture();f.picard.undeclaredCoefficient=5;assert.throws(()=>inspect(f,10),e=>e.code==='UNREVIEWED_CAPTURE_GRAMMAR');});
test('fields classified as textual provenance cannot hide numeric coordinate dependencies',()=>{
  for(const mutate of [f=>f.picard.unknowns[0]=5,f=>f.picard.actualSourceInputs.axisProof.path=5,f=>f.picard.actualSourceInputs.axisProof.hiddenBody=5,f=>f.picard.tail.proof=5,f=>f.picard.callerSuppliedForcing=true]){const f=fixture();mutate(f);assert.throws(()=>inspect(f,10),e=>e.code==='UNREVIEWED_CAPTURE_GRAMMAR');}
});
test('missing semantic signature fields are rejected',()=>{
  for(const [body,mutate]of [[10,f=>delete f.picard.tail.K],[10,f=>delete f.picard.solutionNorm.commonCollar],[11,f=>delete f.covariance.normUpper]]){const f=fixture();mutate(f);f.definitions.m3GlobalPulses[0].originalDefinition=JSON.stringify(f.covariance);assert.throws(()=>inspect(f,body),e=>e.code==='UNREVIEWED_CAPTURE_GRAMMAR');}
});
test('unreviewed higher Picard system remains a visible boundary',()=>{const f=fixture();f.definitions.picard.push({...f.picard});f.nodes.set(10,{op:'actual_background_even_profile',args:[1,0,4,2,0,1]});const result=inspect(f,10);assert.equal(result.status,'HIDDEN_DEFINITION_CAPTURE_OPEN');assert.equal(result.unknownBoundaryCount,1);});
test('component and full derivative tuple mutations are rejected',()=>{for(const args of [[0,4,4,2,0,1],[0,0,4,2,5,1],[0,0,4,2,0,9]]){const f=fixture();f.nodes.set(10,{op:'actual_background_even_profile',args});assert.throws(()=>inspect(f,10),e=>e.code==='UNREVIEWED_CAPTURE_GRAMMAR');}});
test('Volterra missing/duplicate registry or incomplete actual parameter tuple is rejected',()=>{
  for(const mutate of [f=>f.definitions.m3GlobalPulses=[],f=>f.definitions.m3GlobalPulses.push(f.definitions.m3GlobalPulses[0]),f=>f.nodes.set(11,{op:'actual_covariance_volterra',args:[0,1,4,[]]})]){const f=fixture();mutate(f);assert.throws(()=>inspect(f,11),e=>e.code==='UNREVIEWED_CAPTURE_GRAMMAR');}
});
