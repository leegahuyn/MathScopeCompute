import test from 'node:test';
import assert from 'node:assert/strict';
import {recordedSourceNearTerminal,sourceNearTerminalObservations} from '../../navier/source-near-terminal-evidence.mjs';
import {buildNearTerminalPanel,nearTerminalSummary,nearTerminalSelection,renderNearTerminalChart} from '../navier-near-terminal-view.mjs';

const results=await recordedSourceNearTerminal(),result={package:'N8',operation:'source-near-terminal-record',results,
  observations:sourceNearTerminalObservations(results)},original=JSON.stringify(result);
class Element{
  constructor(tag,doc){this.tagName=tag;this.ownerDocument=doc;this.children=[];this.attributes={};this.style={};this.handlers={};this.textContent='';}
  setAttribute(name,value){this.attributes[name]=String(value);}
  append(...children){this.children.push(...children);}
  addEventListener(name,handler){this.handlers[name]=handler;}
}
const document={createElementNS:(_ns,tag)=>new Element(tag,document)};
const flatten=node=>[node,...node.children.flatMap(flatten)];

test('three component panels retain fifteen exact source intervals and distinct positive normalizations',()=>{
  const panel=buildNearTerminalPanel(result);assert.equal(panel.components.length,3);
  assert.deepEqual(panel.components.map(component=>component.name),['radial','azimuthal','axial']);
  assert.equal(new Set(panel.components.map(component=>component.quantity)).size,3);
  for(const component of panel.components){assert.equal(component.rows.length,5);
    for(const row of component.rows){const actual=result.results.certificate.rows.find(value=>value.depth===row.depth),
      field=actual.components.find(value=>value.name===component.name);
      assert.deepEqual([row.lower,row.upper],field.interval.displayEnclosure);assert.deepEqual(row.exactInterval,field.interval);
      assert.equal(row.sourceTauNode,actual.tau.expression);assert.equal(row.physicalPositiveScale,field.physicalVelocity.positiveScale);
      assert.equal(row.formulaTauNode,result.results.certificate.formulaProgram.roots['tau_'+row.depth]);
      assert.equal(row.y,undefined,'no midpoint observation is invented');}}
  assert.equal(panel.recordedOnly,true);assert.equal(panel.physicalPointSamplesGenerated,false);assert.equal(panel.completeN8,false);
  assert.equal(buildNearTerminalPanel({package:'N7'}),null);assert.equal(JSON.stringify(result),original);
});

test('SVG places each full interval on its own normalized axis and exposes keyboard depth selection',()=>{
  const panel=buildNearTerminalPanel(result),host=new Element('div',document);let selected=null;
  const svg=renderNearTerminalChart(host,panel,{selectedDepth:4,onSelect:depth=>{selected=depth;}}),nodes=flatten(svg),
    bars=nodes.filter(node=>'data-source-enclosure-bar'in node.attributes),buttons=nodes.filter(node=>'data-source-depth-select'in node.attributes);
  assert.equal(bars.length,15);assert.equal(buttons.length,15);assert.equal(host.children[0],svg);
  assert.equal(nodes.filter(node=>['circle','polyline','path'].includes(node.tagName)).length,0);
  for(const bar of bars){const [name,depthText]=bar.attributes['data-source-enclosure-bar'].split(':'),depth=Number(depthText),
    index=panel.components.findIndex(component=>component.name===name),component=panel.components[index],row=component.rows.find(row=>row.depth===depth),
    lo=Math.min(...component.rows.map(row=>row.lower)),hi=Math.max(...component.rows.map(row=>row.upper)),span=hi-lo,
    lower=lo-.12*span,upper=hi+.12*span,Y=value=>24+index*215+170-125*(value-lower)/(upper-lower);
    assert.equal(Number(bar.attributes.x1),100+570*depth/12);assert.equal(bar.attributes.x1,bar.attributes.x2);
    assert.ok(Math.abs(Number(bar.attributes.y1)-Y(row.lower))<1e-10);
    assert.ok(Math.abs(Number(bar.attributes.y2)-Y(row.upper))<1e-10);}
  const control=buttons.find(node=>node.attributes['data-source-depth-select']==='12');
  assert.equal(control.attributes.width,'44');assert.equal(control.attributes.tabindex,'0');
  let prevented=false;control.handlers.keydown({key:' ',preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(selected,12);selected=null;control.handlers.click();assert.equal(selected,12);
  assert.match(svg.attributes['aria-label'],/실제 시간이 아닌/);assert.equal(JSON.stringify(result),original);
});

test('selection preserves exact tau/scales and distinguishes the new core identity from historical dependencies',()=>{
  const selected=nearTerminalSelection(result,8),c=result.results.certificate,summary=nearTerminalSummary(result);
  assert.deepEqual(selected.exactSourceRow,c.rows[3]);assert.equal(selected.scalarProgram.roots.tau_8,c.formulaProgram.roots.tau_8);
  assert.equal(selected.scalarProgram.sourceNodeIds.tau_8,c.rows[3].tau.expression);
  assert.equal(selected.sourceChangedBySelection,false);assert.equal(selected.physicalTimeOrVelocityRoundedToBinary64,false);
  assert.equal(selected.historicalFinalFieldIdentification.dependencies.length,2);assert.equal(selected.completeN8,false);
  assert.equal(selected.currentCoreRestriction.newSupportProofExecuted,true);
  assert.equal(selected.currentCoreRestriction.proofSHA256,result.results.coreRestrictionEvidence.proofSHA256);
  assert.equal(selected.finalDomainInclusion.domainInclusionAudit.assertedMathematicalObstruction,false);
  assert.equal(summary.finalFieldBridge.finalLocalizedFieldIdentified,false);
  assert.equal(summary.finalFieldBridge.finalLocalizedCoreRestrictionIdentified,true);
  assert.equal(summary.coreRestrictionEvidence.newSupportProofExecuted,true);
  assert.equal(summary.scope.actualInnerRestrictionIdentified,true);
  assert.equal(summary.historicalSourceScope.sourceFinalFieldIdentificationExternal,true);
  assert.equal(summary.finalFieldBridge.domainInclusionAudit.separateRecordedDomainProofVerified,true);
  assert.equal(summary.domainPrerequisiteEvidence.finalN6FieldConstructed,false);
  assert.equal(summary.domainPrerequisiteEvidence.domainArtifact.sha256,result.results.domainPrerequisiteEvidence.domainArtifact.sha256);
  assert.equal(summary.formulaProgram.nodes,undefined);assert.equal(summary.formulaProgram.nodesOmittedOnlyFromDOM,true);
  assert.equal(summary.formulaProgram.nodeCount,c.formulaProgram.nodes.length);assert.ok(JSON.stringify(summary).length<40000);
  assert.equal(summary.decimalSamples.length,6);assert.ok(summary.decimalSamples.every(row=>row.exactZeroExtension&&row.missingSourceValuesSetToZero===false));
  assert.match(JSON.stringify(summary),/Proposition9\.9/);assert.match(JSON.stringify(summary),/Proposition10\.1/);
  assert.throws(()=>nearTerminalSelection(result,3),{code:'INVALID_NEAR_TERMINAL_VIEW'});
  selected.exactSourceRow.components[0].interval.lower='0';assert.equal(JSON.stringify(result),original);
});

test('forged source bridges, physical binary64 values and spatial samples are rejected',()=>{
  const changes=[value=>{value.results.certificate.claims.finalLocalizedVelocity.dependencies=[];},
    value=>{value.observations.samples=[{position:[0,0,0],velocity:[0,0,0]}];},
    value=>{value.results.certificate.rows[0].tau.binary64=0;},
    value=>{value.results.certificate.rows[0].components[1].physicalVelocity.binary64=0;},
    value=>{value.results.certificate.rows[0].components[2].interval.midpointUsed=true;},
    value=>{value.results.finalFieldBridge.domainInclusionAudit.assertedMathematicalObstruction=true;},
    value=>{value.results.finalFieldBridge.domainInclusionAudit.sameOriginalLocalizationQStar=false;},
    value=>{value.results.domainPrerequisiteEvidence.finalN6FieldConstructed=true;},
    value=>{value.results.coreRestrictionEvidence.checks[0].pass=false;},
    value=>{value.results.finalFieldBridge.finalLocalizedCoreRestrictionIdentified=false;},
    value=>{value.results.coreRestrictionEvidence.proofSHA256='0'.repeat(64);},
    value=>{value.observations.contract.finalCoreRestrictionIdentificationExternal=true;},
    value=>{value.results.certificate.formulaProgram.roots.physical_axial_0=-1;},
    value=>{value.results.freshSourceConstructorExecuted=true;}];
  for(const change of changes){const changed=structuredClone(result);change(changed);
    assert.throws(()=>buildNearTerminalPanel(changed),{code:'INVALID_NEAR_TERMINAL_VIEW'});}
});
