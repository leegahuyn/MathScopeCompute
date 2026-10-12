import test from 'node:test';
import assert from 'node:assert/strict';
import {recordedGlobalForcedCurrent,globalForcedCurrentObservations} from '../../navier/source-global-forced-current-evidence.mjs';
import {buildSourceForcedCurrentPanel,sourceForcedCurrentSummary,sourceForcedCurrentSelection,renderSourceForcedCurrent} from '../navier-source-forced-current-view.mjs';

const results=await recordedGlobalForcedCurrent(),result={package:'N6',operation:'global-forced-current-record',results,
  observations:globalForcedCurrentObservations(results),runHash:'recorded-forced-view-test'},before=JSON.stringify(result);
class Element{
  constructor(tag,doc){this.tagName=tag;this.ownerDocument=doc;this.children=[];this.attributes={};this.style={};this.handlers={};this.textContent='';}
  setAttribute(key,value){this.attributes[key]=String(value);}
  append(...children){this.children.push(...children);}
  addEventListener(name,handler){this.handlers[name]=handler;}
}
const document={createElement:tag=>new Element(tag,document)},flatten=node=>[node,...node.children.flatMap(flatten)];

test('the exact source panel retains all ten lifts, all twenty inverses, complete pressure and distinct tail scopes',()=>{
  const p=buildSourceForcedCurrentPanel(result),summary=sourceForcedCurrentSummary(result);
  assert.equal(p.harmonicRows.length,10);assert.equal(p.inverseRows.length,20);assert.equal(p.signedSourceContributions,162);
  assert.equal(p.numericalVelocitySamplesGenerated,false);assert.equal(p.initializedJ0,false);assert.equal(p.completeN6,false);
  assert.equal(summary.graph.sha256,results.summary.graph.sha256);assert.equal(summary.artifact.sha256,results.artifact.sha256);
  assert.deepEqual(summary.harmonicRows,result.observations.harmonicRows);assert.deepEqual(summary.pressure,result.observations.pressure);
  assert.equal(summary.limits[0].bound,'0');assert.equal(summary.limits[0].noOtherTailIsDeclaredZero,true);
  assert.equal(summary.limits[1].numericalBoundEvaluated,false);assert.equal(summary.limits[2].bound,null);
  assert.equal(summary.originalConstructionGate.pass,false);assert.equal(summary.gate.actualCoefficientComparisons,540);
  assert.equal(summary.pressure.totalGlobalPressureExpression,null);assert.equal(summary.pressure.angularRows.length,10);
  const selected=sourceForcedCurrentSelection(result,p.harmonicRows[9].key);
  assert.deepEqual(selected.sourceTemplate,results.summary.templates[9]);assert.equal(selected.inverseRows.length,2);
  assert.equal(selected.sourceChangedBySelection,false);assert.equal(selected.expressionIdsAreNumericalValues,false);
  selected.sourceTemplate.forced[0].source[0].real=-1;assert.equal(JSON.stringify(result),before);
  assert.throws(()=>sourceForcedCurrentSelection(result,'missing'),{code:'INVALID_SOURCE_FORCED_CURRENT_VIEW'});
  assert.equal(buildSourceForcedCurrentPanel({package:'N8'}),null);
});

test('the semantic mode table offers all ten keyboard selections and source links without fabricated flow geometry',()=>{
  const panel=buildSourceForcedCurrentPanel(result),host=new Element('main',document);let selected=null;
  const section=renderSourceForcedCurrent(host,panel,{selectedKey:panel.harmonicRows[4].key,onSelect:key=>{selected=key;}}),
    nodes=flatten(section),buttons=nodes.filter(x=>'data-source-forced-select'in x.attributes);
  assert.equal(host.children[0],section);assert.equal(nodes.filter(x=>x.tagName==='table').length,1);
  assert.equal(nodes.filter(x=>'data-source-forced-row'in x.attributes).length,10);assert.equal(buttons.length,10);
  assert.equal(buttons.filter(x=>x.attributes['aria-pressed']==='true').length,1);
  for(const b of buttons){assert.equal(b.tagName,'button');assert.equal(b.attributes.type,'button');assert.equal(b.style.minHeight,'44px');
    assert.match(b.attributes['aria-label'],/source와 압력/);}
  buttons[9].handlers.click();assert.equal(selected,panel.harmonicRows[9].key);
  assert.equal(nodes.filter(x=>['svg','canvas','polyline','path'].includes(x.tagName)).length,0);
  assert.equal(nodes.filter(x=>'data-source-forced-inverse'in x.attributes).length,2);
  assert.equal(nodes.filter(x=>x.tagName==='th').every(x=>['col','row'].includes(x.attributes.scope)),true);
  const text=nodes.map(x=>x.textContent).join('\n');assert.match(text,/유한 각도 목록/);assert.match(text,/Volterra tail/);
  assert.match(text,/법선 source 압력/);assert.match(text,/전체 혼합 파라미터/);assert.match(text,/수치 장 값이나 수치 상계가 아닙니다/);
  assert.match(text,/540개 PDE 계수/);assert.match(text,/35분 제한/);assert.doesNotMatch(text,/#null|#undefined/);
  assert.equal(nodes.filter(x=>'data-source-forced-angular-pressure'in x.attributes).length,1);
  const link=nodes.find(x=>'data-source-forced-artifact'in x.attributes);assert.equal(link.attributes.href,results.fullArtifactURL);
  assert.equal(link.attributes.rel,'noopener noreferrer');assert.equal(JSON.stringify(result),before);
});

test('omitted harmonics, changed original H_w or pressure, fake samples and promoted mixed closure are rejected',()=>{
  const changes=[r=>r.observations.harmonicRows.pop(),r=>r.observations.harmonicRows[0].nextResidualModes.pop(),
    r=>{r.observations.harmonicRows[0].discardedBoundScope='Every Fourier mode';},
    r=>{r.observations.inverseRows[0].wholePath.preimagesIdentified=true;},
    r=>{r.observations.inverseRows[0].fullPressure.real=-1;},
    r=>{r.observations.inverseRows[0].fullMixedParameterClosureExecuted=true;},
    r=>{r.observations.pressure.meanIncrement=-1;},r=>{r.observations.limits[1].numericalBoundEvaluated=true;},
    r=>{r.observations.pressure.totalGlobalPressureExpression=123;},
    r=>{r.observations.pressure.angularRows[0].rows.pop();},
    r=>{r.results.originalConstructionGate.pass=true;},
    r=>{r.results.scope.completeGlobalCurrentCertificateRecovered=true;},
    r=>{r.observations.samples=[{position:[1,0,0],velocity:[0,0,0]}];},
    r=>{r.observations.curves=[{points:[[0,0],[1,1]]}];},
    r=>{r.results.scope.fullMixedDerivativeClosureAudited=true;},r=>{r.results.freshSourceConstructorExecuted=true;}];
  for(const change of changes){const changed=structuredClone(result);change(changed);
    assert.throws(()=>buildSourceForcedCurrentPanel(changed),{code:'INVALID_SOURCE_FORCED_CURRENT_VIEW'});}
});
