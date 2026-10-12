import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {runJob} from '../../mathscope-m2/arithmetic/index.mjs';
import {buildM2ComparisonDiagram} from '../p8/comparison.mjs';
const context={window:{}};vm.runInNewContext(await fs.readFile(new URL('../web/p8-visual-models.js',import.meta.url),'utf8'),context);
const {build,views}=context.window.MathScopeP8VisualModels;
const json=x=>JSON.parse(JSON.stringify(x));
const request=(kind,input)=>({kind,input,precision:{N:4},budget:{}});
const actual={projective:await runJob(request('arithmetic.projective',{p:'3',n:2,m:1})),ordinary:await runJob(request('arithmetic.elliptic',{p:'5',m:1})),supersingular:await runJob(request('arithmetic.elliptic',{p:'7',m:1})),tower:await runJob(request('arithmetic.perfectoidTower',{p:'3',M:4,V:8}))};
// The wrapper is test-only UI input; mathematical values come from actual M2 execution above.
const envelope=(inheritedM2,view)=>({schema:'MathScope.M3.P8.Execution/1',request:{kind:'p8.visual_structure',input:{view,m2Request:inheritedM2.request}},execution:{status:'COMPLETED'},scope:{wholeM3Complete:false,wholeP8Complete:false},result:{inheritedM2},sourceBinding:{testHarness:'actual M2 computation; no claimed P8 execution receipt'}});
const model=(name,view)=>build({record:envelope(actual[name],view),view});
test('all four structural views use actual inherited outputs and preserve them byte for byte',()=>{
  const before=JSON.stringify(actual);
  for(const [name,view]of [['projective','degree-basis-valuation'],['ordinary','hodge-newton'],['projective','prime-degree-frobenius'],['tower','refinement-tower']]){
    const m=model(name,view);assert.ok(m.points.length>0,view);assert.ok(m.table.rows.length>0);assert.equal(m.formalComplete,false);assert.equal(m.certificateIssued,false);assert.ok(m.points.every(p=>p.position.every(Number.isFinite)));assert.ok(m.points.every(p=>p.exact&&p.source.inheritedResultHash===actual[name].resultHash));
  }assert.equal(JSON.stringify(actual),before);
});
test('projective degree/basis/valuation retains actual matrix column and external theorem',()=>{
  const m=model('projective','degree-basis-valuation');assert.deepEqual(json(m.points.map(p=>p.position)),[[0,0,0],[2,0,1],[4,0,2]]);assert.deepEqual(json(m.points[2].exact.matrixColumn),['9']);assert.equal(m.points[2].exact.sourceTheorem.localKernelCheck,false);
});
test('ordinary and supersingular Newton slopes differ without changing Hodge polygon',()=>{
  const a=model('ordinary','hodge-newton'),b=model('supersingular','hodge-newton');const coords=(m,role)=>json(m.points.filter(p=>p.role===role).map(p=>p.position));assert.deepEqual(coords(a,'data'),coords(b,'data'));assert.deepEqual(coords(a,'comparison'),[[0,0,1],[1,0,1],[2,1,1]]);assert.deepEqual(coords(b,'comparison'),[[0,0,1],[1,.5,1],[2,1,1]]);assert.equal(b.table.rows.at(-1)[0],'원래 계수 Newton hull');
});
test('Frobenius weight is restricted to supplied projective Tate factors',()=>{
  const m=model('projective','prime-degree-frobenius');assert.equal(m.points.length,9);assert.ok(m.points.every(p=>p.position[1]===p.position[2]));assert.ok(m.points.some(p=>p.exact.localFactor.localVariable==='T_7'));assert.equal(model('ordinary','prime-degree-frobenius').points.length,0);
});
test('finite root prefix retains exact fractions and no invented infinite points',()=>{
  const m=model('tower','refinement-tower');assert.deepEqual(json(m.points.map(p=>p.position)),[[0,0,0],[1,0,-1],[2,0,-2],[3,0,-3],[4,0,-4]]);assert.equal(m.points.at(-1).exact.level.valuationDenominator,'81');assert.equal(m.lines.length,4);assert.ok(m.omissions.some(s=>s.includes('SYMBOLIC_NOT_COMPUTED')));
});
test('missing, zero, nonfinite and malformed data do not create fake measurements',()=>{
  for(const view of views){const m=build({view});assert.equal(m.status,'NOT_RUN');assert.equal(m.points.length,0);}
  const bad=json(actual.projective);bad.results.finitePerfectComparison.finitePerfectComplex.terms[2].frobenius=[[null]];const m=build({record:envelope(bad,'degree-basis-valuation')});assert.equal(m.points.length,2);assert.ok(m.table.rows.some(row=>row[1].frobenius?.[0]?.[0]===null));
  const badTower=json(actual.tower);badTower.results.levels[2].valuationDenominator='0';const t=build({record:envelope(badTower,'refinement-tower')});assert.equal(t.points.length,4);assert.equal(t.lines.length,2);assert.ok(t.points.some(p=>Object.is(p.position[0],0)));
});
test('authority promotion and unfinished executions are rejected',()=>{
  const r=envelope(actual.projective,'degree-basis-valuation');r.scope.wholeP8Complete=true;assert.throws(()=>build({record:r}));r.scope.wholeP8Complete=false;r.execution.status='FAILED';assert.throws(()=>build({record:r}));
});
test('actual comparison diagram exposes source operations and assumptions as schematic data',async()=>{
  const diagram=await buildM2ComparisonDiagram(request('arithmetic.comparison',{operation:'perfectPrism',p:'3',target:'deRham'}));const r=envelope(actual.projective,'comparison-diagram');r.request.kind='p8.comparison';r.result={diagram};const before=JSON.stringify(r),m=build({record:r,view:'comparison-diagram'});assert.equal(m.points.length,diagram.nodes.length);assert.equal(m.lines.length,diagram.edges.length);assert.ok(m.axes.every(a=>a.type==='schematic'));assert.ok(m.lines.every(l=>Array.isArray(l.exact.requiredAssumptionRefs)));assert.equal(JSON.stringify(r),before);
});
test('changed assumptions are shown as stale edges without rewriting original diagram',async()=>{
  const {invalidateComparisonAfterAssumptionChange,validateComparisonDiagram}=await import('../p8/comparison.mjs');
  const diagram=await buildM2ComparisonDiagram(request('arithmetic.comparison',{operation:'perfectPrism',p:'3',target:'etale'})),id=diagram.assumptions[0].id;
  const invalidation=invalidateComparisonAfterAssumptionChange(diagram,id),altered=json(diagram);altered.assumptions=altered.assumptions.filter(a=>a.id!==id);
  const replayAfterRemoval=await validateComparisonDiagram(altered),r=envelope(actual.projective,'comparison-diagram');r.result={diagram,invalidation,replayAfterRemoval};
  const before=JSON.stringify(r),m=build({record:r,view:'comparison-diagram'});assert.equal(m.status,'COMPARISON_STALE');assert.ok(m.lines.length>0);assert.ok(m.lines.every(l=>l.role==='open'&&l.label.startsWith('[STALE]')));assert.deepEqual(json(m.lines.map(l=>l.exact)),diagram.edges);assert.equal(JSON.stringify(r),before);assert.equal(m.formalComplete,false);
});
