import test from 'node:test';
import assert from 'node:assert/strict';
import {runNavierM3} from '../../navier/index.mjs';
import {buildInnerGrowthPanel,innerGrowthSummary,innerGrowthSelection,renderInnerGrowthChart} from '../navier-inner-growth-view.mjs';

const result=await runNavierM3({package:'N7',operation:'inner-growth-record'}),original=JSON.stringify(result);
class Element{
  constructor(tag,doc){this.tagName=tag;this.ownerDocument=doc;this.children=[];this.attributes={};this.style={};this.handlers={};this.textContent='';}
  setAttribute(name,value){this.attributes[name]=String(value);}
  append(...children){this.children.push(...children);}
  addEventListener(name,handler){this.handlers[name]=handler;}
}
const document={createElementNS:(_ns,tag)=>new Element(tag,document)};
function flatten(node){return [node,...node.children.flatMap(flatten)];}

test('five exact enclosure bars retain the actual rows and their source provenance',()=>{
  const panel=buildInnerGrowthPanel(result);assert.equal(panel.rows.length,5);
  for(const row of panel.rows){const actual=result.results.certificate.rows.find(x=>x.depth===row.depth);
    assert.deepEqual([row.lower,row.upper],actual.displayEnclosure);assert.deepEqual(row.exactInterval,actual.interval);
    assert.equal(row.remainderAbsUpper,actual.remainderAbsUpper);assert.equal(row.sourceTauNode,actual.tau);
    assert.equal(row.formulaTauNode,result.results.certificate.formulaProgram.roots['tau_'+row.depth]);
    assert.equal(row.y,undefined,'no invented midpoint observation');
  }
  assert.equal(panel.recordedOnly,true);assert.equal(panel.physicalPointSamplesGenerated,false);
  assert.equal(panel.completeN6,false);assert.equal(panel.externalDependencies.length,2);
  assert.equal(buildInnerGrowthPanel({package:'N8'}),null);assert.equal(JSON.stringify(result),original);
});

test('the mounted SVG uses independent linear depth and interval endpoint coordinates',()=>{
  const panel=buildInnerGrowthPanel(result),host=new Element('div',document);let selected=null;
  const svg=renderInnerGrowthChart(host,panel,{selectedDepth:4,onSelect:depth=>{selected=depth;}}),nodes=flatten(svg),
    bars=nodes.filter(n=>'data-enclosure-bar'in n.attributes),caps=nodes.filter(n=>'data-enclosure-cap'in n.attributes);
  assert.equal(host.children[0],svg);assert.equal(bars.length,5);assert.equal(caps.length,10);
  assert.equal(nodes.filter(n=>['circle','polyline','path'].includes(n.tagName)).length,0);
  const maximum=Math.max(...result.results.certificate.rows.map(row=>row.displayEnclosure[1]))*1.12;
  for(const bar of bars){const depth=Number(bar.attributes['data-enclosure-bar']),actual=result.results.certificate.rows.find(row=>row.depth===depth);
    assert.equal(Number(bar.attributes.x1),92+50*depth);assert.equal(bar.attributes.x1,bar.attributes.x2);
    assert.ok(Math.abs(Number(bar.attributes.y1)-(270-215*actual.displayEnclosure[0]/maximum))<1e-12);
    assert.ok(Math.abs(Number(bar.attributes.y2)-(270-215*actual.displayEnclosure[1]/maximum))<1e-12);
  }
  const control=nodes.find(n=>n.attributes['data-depth-select']==='12');assert.equal(control.attributes.tabindex,'0');assert.equal(control.attributes.width,'44');
  let prevented=false;control.handlers.keydown({key:'Enter',preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(selected,12);
  selected=null;control.handlers.click();assert.equal(selected,12);
  assert.ok(svg.attributes['aria-label'].includes('실제 시간이 아닌'));
  assert.equal(JSON.stringify(result),original);
});

test('selection preserves exact source values, distinct DAG IDs and the conditional final-field bridge',()=>{
  const selected=innerGrowthSelection(result,8),c=result.results.certificate;
  assert.deepEqual(selected.exactSourceRow,c.rows[3]);assert.equal(selected.exactSourceRow.physicalVelocity.binary64,null);
  assert.equal(selected.scalarProgram.roots.tau_8,c.formulaProgram.roots.tau_8);
  assert.equal(selected.scalarProgram.sourceNodeIds.tau_8,c.rows[3].tau);
  assert.equal(selected.sourceChangedBySelection,false);assert.equal(selected.externalFinalFieldIdentification.dependencies.length,2);
  assert.equal(selected.newLeanExecuted,false);assert.match(selected.exactFormulas.tau,/log\(1\+4\*C\/eScale\)/);
  assert.throws(()=>innerGrowthSelection(result,3),/recorded source depths/);
  selected.exactSourceRow.interval.lower='0';assert.equal(JSON.stringify(result),original);
});

test('DOM summaries omit the large DAG while the exported result retains it unchanged',()=>{
  const summary=innerGrowthSummary(result),text=JSON.stringify(summary);
  assert.equal(summary.formulaProgram.nodesOmittedOnlyFromDOM,true);
  assert.equal(summary.formulaProgram.nodeCount,28966);assert.equal(summary.formulaProgram.nodes,undefined);
  assert.ok(text.length<20000);assert.equal(result.results.certificate.formulaProgram.nodes.length,28966);
  assert.match(summary.leading.physicalLower,/>0/);assert.match(summary.remainder.inequality,/C\*tau\^\(2h\)/);
  assert.match(text,/Proposition9\.9/);assert.match(text,/Proposition10\.1/);
  assert.equal(summary.gate.freshlyExecutedByArchiveConsumer,false);assert.equal(JSON.stringify(result),original);
});

test('missing source bridge, fake spatial samples and numerical underflow substitutions are refused',()=>{
  const cases=[r=>{r.results.certificate.claims.originalLocalizedPath.dependencies=[];},
    r=>{r.observations.samples=[{position:[0,0,0],velocity:[0,0,0]}];},
    r=>{r.results.certificate.rows[0].physicalVelocity.binary64=0;},
    r=>{r.results.certificate.formulaProgram.roots.tau_0=-1;},
    r=>{r.results.freshSourceConstructorExecuted=true;}];
  for(const change of cases){const changed=structuredClone(result);change(changed);assert.throws(()=>buildInnerGrowthPanel(changed),{code:'INVALID_INNER_GROWTH_VIEW'});}
});
