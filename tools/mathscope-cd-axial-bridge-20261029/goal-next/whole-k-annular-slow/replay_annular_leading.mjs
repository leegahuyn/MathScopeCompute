import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [root,output]=process.argv.slice(2);
assert.ok(root&&output);
const path=resolve(root,'research-ide/mathscope-m2/navier/actual-leading-enlarged-c2.mjs');
const {actualLeadingEnlargedC2}=await import(pathToFileURL(path).href);
const data=actualLeadingEnlargedC2();
assert.equal(data.pass,true);
assert.ok(Object.values(data.checks).every(Boolean));
assert.deepEqual(data.bounds.F0.domain,{X:['Xa/2','2*Xb'],eta:['-1','1']});
const m=data.regions.find(r=>r.producer==='actualStressDirectionBounds.middle.fieldRows:entire_annulus_F_mixed2');
assert.deepEqual(m.interval,['Xa','Xb']);
assert.equal(m.logNorm,'R^70');
assert.ok(m.originalFastNSecondDerivativeRetained);
const graph=data.normProgram.nodes;
const selected=new Set();
function descend(id,depth){
  selected.add(id);
  if(!depth)return;
  const {op,args}=graph[id];
  if(['multiply','add','inverse','maximum','sqrt_positive'].includes(op)){
    for(const v of args)descend(v,depth-1);
  }else if(op==='integer_power')descend(args[0],depth-1);
}
for(const id of [m.root,data.roots.F0ClosedAnnulusLogC2,data.roots.physicalXConversionFactor,
                 data.roots.actualSourceR,data.roots.actualSourceXa])descend(id,5);
const out={schema:'MathScope.N7.ActualAnnularLeadingC2Bound/1',
  sourceParameterSHA256:data.parameterExpressionSHA256,
  graph:{count:graph.length,sha256:createHash('sha256').update(JSON.stringify(graph)).digest('hex')},
  sourceChecks:data.checks,allRoots:data.roots,domain:data.bounds.F0.domain,
  middle:m,exterior:data.actualExterior,
  middleNodes:Object.fromEntries([...selected].sort((a,b)=>a-b).map(i=>[i,graph[i]])),
  scope:data.scope};
await writeFile(output,JSON.stringify(out,null,2)+'\n');
console.log('PASS actual leading annulus F0 mixed C2 and unchanged terminal heat source.');
