import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [repo,out,correctedGraph]=process.argv.slice(2);
assert.ok(repo&&out&&correctedGraph);
const load=file=>import(pathToFileURL(resolve(repo,'research-ide/mathscope-m3/navier',file)).href);
const authority=await load('source-saved-initialized-authority.mjs');
const norms=await load('source-saved-initialized-norm-family.mjs');
const cap=await authority.openSavedInitializedSource();
const source=authority.savedInitializedSourceProgram(cap);
const family=norms.attachSavedInitializedNormFamily(cap);
const p=norms.constructSavedInitializedNormProgram(family,{order:3});
assert.equal(norms.assertSavedInitializedNormProgram(p),true);
assert.equal(source.nodeCount,3615866);
const cutoff=await load('source-saved-initialized-cutoff-norms.mjs');
const cutoffAuthority=await cutoff.attachSavedInitializedCutoffAuthority(family);
assert.equal(cutoff.assertSavedInitializedCutoffAuthority(cutoffAuthority),true);
const original=cutoffAuthority.bodies;
const primary=await load('source-primary-class-majorants.mjs');
const primaryDegree=primary.originalPrimaryClassDegreeProgram({order:3,targetPoles:[3,6,9,12,15]});
const actualRoots={
  psiT:original.temporal.psi,
  temporalDirectV:original.temporal.velocity.v,
  temporalPsiNativeBody:original.temporal.rawPsi,
  psiFive:cap.actualRoots.potential.psi,
  vTotal:cap.actualRoots.initializedVelocity.v,
  pMean:cap.actualRoots.initializedPressure.value,
  totalPressureMoment:cap.actualRoots.initializedPressure.integrals.whole
};
const row=(rows,order,name)=>{
  const r=rows.find(x=>x.order===order);
  assert.ok(r);
  const norm=r.fields[name];
  assert.ok(norm&&Number.isInteger(norm.constant));
  return norm;
};
const selected={
  temporalPsiC3:row(p.temporalProducts.rows,3,'psi'),
  fivePsiC3:row(p.fiveProducts.rows,3,'psi'),
  meanDirectV_C2:p.rows[2].velocity.v,
  meanPressureC1:p.rows[1].fullPressure
};
const used=new Set();
function visit(id){
  if(used.has(id))return;
  used.add(id);
  const n=p.scalarProgram.nodes[id];
  assert.ok(n);
  if(['add','multiply','maximum','inverse','sqrt_positive'].includes(n.op))for(const child of n.args)visit(child);
  if(n.op==='integer_power')visit(n.args[0]);
}
for(const n of Object.values(selected))visit(n.constant);
const cert=await norms.savedInitializedNormProgramCertificate(p);
assert.ok(Object.values(actualRoots).every(Number.isSafeInteger));
assert.equal(original.pressureRows[1].pressure,actualRoots.pMean);
const selectedPrimary={potential:primaryDegree.weighted.potential,
  homogeneousPressure:primaryDegree.pressure,demands:primaryDegree.derivativeOrders,exponents:primaryDegree.exponents};
const corrected=JSON.parse(await readFile(resolve(correctedGraph,'original-source-functions.json'),'utf8'));
function follow(root,path){
  let found=root;
  for(const k of path) found=found?.[k];
  return found;
}
const registry=source.definitionCollections.map(({namespace,value})=>{
  const path=namespace.split('.').slice(1);
  const otherRaw=follow(corrected,path);
  assert.equal(typeof otherRaw,'string',namespace);
  const other=JSON.parse(otherRaw);
  const digest=hash=>createHash('sha256').update(JSON.stringify(hash)).digest('hex');
  if(!Array.isArray(value)){
    return {namespace,savedKeys:Object.keys(value),correctedKeys:Object.keys(other),identicalObject:JSON.stringify(value)===JSON.stringify(other)};
  }
  let n=0;
  while(n<value.length&&n<other.length&&JSON.stringify(value[n])===JSON.stringify(other[n]))n++;
  return {namespace,savedLength:value.length,correctedLength:other.length,identicalPrefix:n,prefixSHA256:digest(value.slice(0,n))};
});
const doc={schema:'MathScope.N7.AnnularInitializedMeanExactNormSelectors/1',
  actualSource:family.source,actualRoots,programGraph:cert.graph,
  sourceDemand:p.sourceDemand,norms:selected,primaryDegree:selectedPrimary,callGraph:p.callGraph.calls,
  originalMeanGeometry:original.geometry,registry,
  sourceBodyRecords:Object.fromEntries(Object.values(actualRoots).map(id=>[id,source.node(id)])),
  exactNormLeafValuesMaterialized:false,
  scalarClosure:Object.fromEntries([...used].sort((a,b)=>a-b).map(i=>[i,p.scalarProgram.nodes[i]])),
  leafBindings:p.savedSourceBinding.leafBindings.filter(row=>used.has(row.node)),
  scope:p.scope};
await writeFile(out,JSON.stringify(doc,null,2)+'\n');
console.log('PASS same actual saved initialized mean with C3 norm program and exact psi C3, v C2, pressure C1 selectors.');
console.log('Saved initialized source roots', JSON.stringify(actualRoots));
console.log('Demand',JSON.stringify(p.sourceDemand));
console.log('Selected',JSON.stringify(selected));
