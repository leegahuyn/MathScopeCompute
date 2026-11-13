import assert from 'node:assert/strict';
import {readFile,unlink} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {exportActualTargetC6Dag} from './export_target_c6_dag.mjs';
const output=process.argv[2];assert.ok(output);
const nodes=[{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},{op:'coordinate',args:['X']},{op:'coordinate',args:['eta']},{op:'coordinate',args:['t']},{op:'add',args:[2,3]},{op:'actual_expression_partial',args:[0,[2,3],[0,0]]},{op:'definite_integral',args:[6,4,0,1]}];
const rows=[];for(const kind of ['inner','middle','outer'])for(let c=0;c<2;c++)for(let r=0;r<=6;r++)for(let e=0;r+e<=6;e++)rows.push({kind,component:c,radialOrder:r,etaOrder:e,coordinates:[2,3],lower:[0,0],upper:[1,1],body:6,actualCoefficientBody:5,actualDerivative:6,bound:7,faces:Array.from({length:4},(_,i)=>({mask:i,derivative:6,selectedCoordinates:[],upperBound:7}))});
const target={family:{},request:{derivativeOrder:6},sourceBinding:{parameterExpressionSHA256:'test-only'},ftcRows:rows,G:{nodes,
 expressionSystems:[{name:'fixture',parameters:[2,3],body:5,derivativeLimits:[8,8]}],picardSystems:[],quadraticSystems:[],monotoneSystems:[],captureFunctionDefinitions:()=>({fixed:'{}'})}};
const result=await exportActualTargetC6Dag(target,{outputPath:output,requireCommonPrefix:false});assert.equal(result.rowCount,168);assert.equal(result.nodeCount,8);assert.equal(result.definitionCounts.expression,1);
const decoded=gunzipSync(await readFile(output)).toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(decoded[0].rows.length,168);assert.equal(decoded.filter(x=>x.kind==='node').length,8);assert.equal(decoded.filter(x=>x.kind==='definition').length,1);
await assert.rejects(exportActualTargetC6Dag({...target,ftcRows:rows.slice(1)},{outputPath:output+'.bad',requireCommonPrefix:false}),/TARGET_ROW_COUNT/);
const altered=structuredClone(nodes);altered[5]={op:'unknown_native',args:[]};
await assert.rejects(exportActualTargetC6Dag({...target,G:{...target.G,nodes:altered}},{outputPath:output+'.bad',requireCommonPrefix:false}),/UNSUPPORTED_TYPED_OP/);
await assert.rejects(exportActualTargetC6Dag(target,{outputPath:output+'.bad',maxVisited:3,requireCommonPrefix:false}),/TARGET_DAG_VISIT_BUDGET/);
await assert.rejects(exportActualTargetC6Dag(target,{outputPath:output+'.bad'}),/ORIGINAL_SOURCE_PREFIX_MISMATCH/);
await unlink(output);console.log('PASS 168-row typed DAG, integral binder, expression definition, unknown-op and budget controls');
