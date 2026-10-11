/** Read-only metadata/serialization audit. This does NOT create a private
 * actual source attachment or evaluate the original first selector. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';
import {numericalExponentialArithmetic} from '../actual-numerical-exponential-arithmetic.mjs';
import {evaluateClosedArithmeticDefinitions} from '../actual-closed-parameter-arithmetic.mjs';
import {getPinnedSourceProfile} from '../source-profile.mjs';
import {tracedArithmeticEvaluator} from '../actual-selection-arithmetic-enclosure-kernel.mjs';

const root=new URL('../',import.meta.url),evidence=new URL('research/evidence/',root),inputs=[],checks=[];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function read(path){const bytes=fs.readFileSync(new URL(path,evidence));inputs.push({path,sha256:sha(bytes)});return JSON.parse(bytes);}
function check(id,fn){fn();checks.push({id,pass:true});}
const value=read('physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt2-physical-value-certificate.json'),
  target=read('physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt2-target-certificate.json'),
  bodies=read('physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt2-finite-bodies-certificate.json'),
  all=bodies.rows.concat(bodies.physical.rows),profile=getPinnedSourceProfile(),N=numericalExponentialArithmetic({maxMemoEntries:30000}),
  parameters=evaluateClosedArithmeticDefinitions(profile.parametersExactExpressions,N),detail=N.reportInterval(N.point(2)),
  {lower,upper,...normalDetail}=detail,placeholder={interval:{lower,upper},...normalDetail,individualPrecisionMet:true},
  projectionRows=all.map((row,index)=>({index,rowKey:[row.quantity,row.sign??'physical',row.component,row.derivative].join(':'),
    quantity:row.quantity,sign:row.sign??null,component:row.component,derivative:row.derivative,order:row.order,
    sourceRoot:row.positiveExactScale,positiveExactScale:row.positiveExactScale,
    originalValue:row.physicalValue??row.normalizedDirectionDerivative,
    interval:{...placeholder.interval,coordinateDefinition:placeholder.coordinateDefinition,coordinate:placeholder.coordinate,
      coordinateWidth:placeholder.coordinateWidth,toleranceMet:placeholder.toleranceMet},
    coordinateDefinition:placeholder.coordinateDefinition,logarithmCount:placeholder.logarithmCount,coordinate:placeholder.coordinate,
    logCoordinateWidth:placeholder.coordinateWidth,toleranceMet:placeholder.toleranceMet,individualPrecisionMet:true,
    originalValueRelativeToleranceGuaranteed:false,actualScaleRecipeBound:false}));
const trace={nodes:[{id:0,node:{op:'rational',args:['2','1']}},{id:1,node:{op:'source_parameter',args:['h']}},
    {id:2,node:{op:'multiply',args:[0,1]}}],nonArithmeticBoundaries:[]},
  arithmetic=tracedArithmeticEvaluator(trace,N,{parameters:parameters.values});arithmetic.value(2);

check('270-actual-row-metadata-fields-present',()=>{
  assert.equal(all.length,270);for(const r of all){
    for(const k of ['quantity','component','derivative','order','positiveExactScale'])assert.ok(Object.hasOwn(r,k)&&r[k]!==undefined,k);
    assert.ok(Number.isSafeInteger(r.physicalValue??r.normalizedDirectionDerivative));
  }canonicalStringify(projectionRows);
});
check('actual-physical-scale-containers-present',()=>{
  const s=bodies.physical.scales;
  for(const k of ['physicalQScale','pTilde','Bs','Rsharp','F','gabs','Ls'])assert.ok(Number.isSafeInteger(s[k]),k);
  for(const k of ['r','z','t','theta']){
    assert.ok(Number.isSafeInteger(s.coordinateScales[k]));assert.ok(Number.isSafeInteger(s.Omega[k]));
  }
  assert.equal(s.positiveVelocityScales.length,3);canonicalStringify(s);
});
check('target-seven-and-original-sigma-public-shape',()=>{
  assert.deepEqual(target.numerics.rows.map(r=>r.name),['Ac','tau','g','F','profileX','profileRadius','gamma']);
  for(const r of target.numerics.rows){assert.ok(r.interval?.lower&&r.interval?.upper);assert.equal(r.toleranceMet,true);}
  assert.equal(value.numerics.centered.sigmaIntegral.pass,true);
  assert.equal(typeof value.numerics.centered.sigmaIntegral.integral.lower,'string');
  assert.equal(typeof value.numerics.centered.sigmaIntegral.integral.upper,'string');
  canonicalStringify({target:target.numerics.rows,sigma:value.numerics.centered.sigmaIntegral.integral});
});
check('25-actual-value-categories-covered-by-explicit-root-recipes',()=>{
  const names=['pulseCylindrical','weightedCylindrical','covariance','weights','centers','mass','squareRootWeights','determinant'];
  let count=0;for(const [name,array]of Object.entries(value.numerics.values)){
    assert.ok(names.includes(name),name);const rows=Array.isArray(array[0])?array.flat():array;count+=rows.length;
    for(const r of rows){assert.equal(typeof r.lower,'string');assert.equal(typeof r.upper,'string');}
  }
  assert.equal(count,25);canonicalStringify(value.numerics.values);
});
check('numerical-reports-and-parameter-traversal-are-plain-json',()=>{
  assert.equal(typeof profile.parameterExpressionSHA256,'string');
  const serialized={arithmetic:N.report(),traversal:arithmetic.report(),
    parameterTraversal:{count:parameters.values.size,evaluationOrder:parameters.evaluationOrder},
    report:placeholder,request:{precisionBits:384,logCoordinateTolerance:'1/1000000000000',maxOperations:100000000,maxMemoEntries:30000,maxNodes:250000}};
  assert.equal(parameters.values.size,63);canonicalStringify(serialized);structuredClone(serialized);
});
check('strict-canonicalizer-rejects-undefined-function-and-map-controls',()=>{
  for(const x of [undefined,()=>0,new Map([['x',1]])])assert.throws(()=>canonicalStringify({root:{x}}));
});

const runtimeFiles=['actual-common-positive-scale-enclosure.mjs','actual-numerical-scale-root-seal.mjs',
  'actual-numerical-exponential-arithmetic.mjs','actual-closed-parameter-arithmetic.mjs',
  'actual-selection-arithmetic-enclosure-kernel.mjs','actual-original-a13-numerical-enclosure.mjs','actual-positive-geometric-scale-kernel.mjs'];
const result={schema:'MathScope.PositiveScalePublicProjectionShapeAudit/1',checks,pass:checks.every(r=>r.pass),
  actualMetadataRows:all.length,actualValueCoefficientCount:25,actualTargetRows:target.numerics.rows.length,
  inputs,runtimeFiles:runtimeFiles.map(path=>({path,sha256:sha(fs.readFileSync(new URL(path,root)))})),
  sourceAuthenticated:false,originalSourceConstructorExecuted:false,originalSelectorNumericallyEvaluated:false,
  sourceAuthorityOrPrivateSealBypassed:false,original270BodyDerivativesRecomputed:false,
  limitation:'The copied metadata fields and report/diagnostic JSON shapes are checked. The placeholder value2 exercises serialization only; it is never an enclosure of any original source scale. Full private source attachment and its final seal remain required.'};
fs.writeFileSync(new URL('closed-selection-arithmetic-20261011/positive-scale-public-projection-shape-audit.json',evidence),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:result.pass,checks:checks.length,actualMetadataRows:all.length,sourceAuthenticated:false}));
