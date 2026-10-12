import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordedSourceN7DomainExterior,sourceExteriorForceObservations} from '../../navier/source-exterior-force-evidence.mjs';
import {buildSourceDomainExteriorPanel,sourceDomainExteriorSummary,sourceDomainExteriorSelection,renderSourceDomainExterior} from '../navier-source-domain-exterior-view.mjs';

const results=await recordedSourceN7DomainExterior(),result={package:'N7',operation:'source-domain-exterior-record',results,
  observations:sourceExteriorForceObservations(results),runHash:'recorded-view-test'},before=JSON.stringify(result);
class Element{
  constructor(tag,doc){this.tagName=tag;this.ownerDocument=doc;this.children=[];this.attributes={};this.style={};this.handlers={};this.textContent='';}
  setAttribute(key,value){this.attributes[key]=String(value);}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=[...children];}
  addEventListener(name,handler){this.handlers[name]=handler;}
}
const document={createElement:tag=>new Element(tag,document)},flatten=node=>[node,...node.children.flatMap(flatten)];

test('exact domain ratios and five force rows keep actual normalizations, polynomials and source identities',()=>{
  const panel=buildSourceDomainExteriorPanel(result);
  assert.deepEqual(panel.domainRows.map(row=>row.value),['1/64','1/4','1/4']);
  assert.equal(panel.initialPrerequisites.length,5);assert.equal(panel.domain.allInitialChecksPass,true);
  assert.deepEqual(panel.forceRows.map(row=>row.order),[0,1,2,3,4]);
  for(const row of panel.forceRows){const actual=results.exterior.rows[row.order];
    assert.deepEqual(row.velocityPolynomial,actual.polynomials.velocityPolynomial);assert.deepEqual(row.squarePolynomial,actual.polynomials.squarePolynomial);
    assert.deepEqual(row.exactSourceNodeIds,actual.expressions);assert.equal(row.wholeGlobalJet,false);
    for(const [component,sourceName]of [['radial','normalizedRadial'],['theta','normalizedTheta'],['divergence','normalizedDivergence']]){
      assert.equal(row[component].exactTemplate,actual.midpoint[sourceName].formula);
      assert.equal(row[component].expression,actual.midpoint[sourceName].expression);
      assert.equal(row[component].positiveScale,actual.midpoint[sourceName].scale.replace(/j\b/g,String(row.order)));
      assert.equal(row[component].value,undefined,'an exact normalized formula is not a fabricated physical number');}}
  assert.match(panel.forceRows[0].theta.formula,/h/);assert.equal(panel.forceRows[0].theta.sign,'NEGATIVE');
  assert.equal(panel.physicalVelocitySamplesGenerated,false);assert.equal(panel.completeN7,false);
  assert.equal(buildSourceDomainExteriorPanel({package:'N8'}),null);assert.equal(JSON.stringify(result),before);
});

test('semantic tables expose every exact ratio and all orders through native keyboard buttons without flow geometry',()=>{
  const panel=buildSourceDomainExteriorPanel(result),host=new Element('main',document);let selected=null;
  const section=renderSourceDomainExterior(host,panel,{selectedOrder:2,onSelect:order=>{selected=order;}}),nodes=flatten(section),
    buttons=nodes.filter(node=>'data-source-exterior-order-select'in node.attributes);
  assert.equal(host.children[0],section);assert.equal(nodes.filter(node=>node.tagName==='table').length,2);
  assert.equal(nodes.filter(node=>'data-source-domain-ratio'in node.attributes).length,3);
  assert.equal(nodes.filter(node=>'data-source-force-order'in node.attributes).length,5);
  assert.equal(nodes.filter(node=>'data-source-force-component'in node.attributes).length,15);
  assert.equal(nodes.filter(node=>['svg','canvas','polyline','path'].includes(node.tagName)).length,0);
  assert.equal(buttons.length,5);assert.equal(buttons.filter(node=>node.attributes['aria-pressed']==='true').length,1);
  for(const button of buttons){assert.equal(button.tagName,'button');assert.equal(button.attributes.type,'button');
    assert.equal(button.style.minHeight,'44px');assert.match(button.attributes['aria-label'],/양의 배율/);}
  buttons[4].handlers.click();assert.equal(selected,4);
  const text=nodes.map(node=>node.textContent).join('\n');assert.match(text,/원본 h > 0/);assert.match(text,/초기 영 구간/);
  assert.match(text,/활동 구간의 전체 에너지 값은 아직/);assert.match(text,/−64h/);
  assert.equal(nodes.filter(node=>node.tagName==='th').every(node=>['col','row'].includes(node.attributes.scope)),true);
  assert.equal(JSON.stringify(result),before);
});

test('compact selection and summary retain full-artifact hashes, whole improper pressure and unresolved global extension',()=>{
  const selected=sourceDomainExteriorSelection(result,4),summary=sourceDomainExteriorSummary(result);
  assert.deepEqual(selected.exactSourceRow,results.exterior.rows[4]);assert.equal(selected.sourceChangedBySelection,false);
  assert.equal(selected.fullScalarProgram.scalarProgramSHA256,results.exterior.graph.scalarProgramSHA256);
  assert.equal(selected.fullScalarProgram.fullArtifactRetainedInRepository,true);
  assert.match(selected.exactSourceRow.pressureJet,/infinity/);assert.equal(selected.originalPositiveHRetained,true);
  assert.equal(selected.positivePhysicalScalesEvaluatedAsBinary64,false);assert.equal(selected.wholeGlobalTerminalForceJetsConstructed,false);
  assert.equal(summary.domainProof.sourceTheoremAppliedToExecutedInitialPremises,true);
  assert.equal(summary.domainProof.finalCorrectionSequenceExecuted,false);assert.equal(summary.wholeKEnergyNearTerminalComputed,false);
  assert.equal(summary.globalForceExtension.forceAfterTerminalTimeConstructed,false);
  assert.equal(summary.initialZeroEnergy.activeNearTerminalWholeKEnergyComputed,false);
  assert.equal(summary.fullScalarProgram.nodes,undefined);assert.ok(JSON.stringify(summary).length<60000);
  assert.throws(()=>sourceDomainExteriorSelection(result,5),{code:'INVALID_SOURCE_DOMAIN_EXTERIOR_VIEW'});
  selected.exactSourceRow.polynomials.velocityPolynomial[0]='changed';assert.equal(JSON.stringify(result),before);
});

test('altered ratios, omitted orders, lost h or force divergence and promoted whole-field energy are rejected',()=>{
  const changes=[value=>{value.observations.domain.qBigOverCommonQStar='1';},
    value=>{value.results.domain.initialPrerequisites.pop();},value=>{value.observations.forceRows.pop();},
    value=>{value.observations.forceRows[0].theta='0';},value=>{value.results.exterior.rows[0].midpoint.normalizedTheta.scale='1';},
    value=>{value.results.exterior.rows[0].midpoint.normalizedDivergence.sign='ZERO';},
    value=>{value.observations.forceRows[0].velocityPolynomial=['0'];},
    value=>{value.observations.samples=[{position:[1,0,0],velocity:[0,0,0]}];},
    value=>{value.observations.curves=[{points:[[0,0],[1,1]]}];},
    value=>{value.results.wholeKEnergyNearTerminalComputed=true;},
    value=>{value.results.exterior.initialZeroBranch.activeNearTerminalWholeKEnergyComputed=true;},
    value=>{value.results.domain.domainProof.finalCorrectionSequenceExecuted=true;},
    value=>{value.results.fullScalarProgram.completeFormulaProgramIncludedInThisRecord=true;},
    value=>{value.results.freshSourceConstructorExecuted=true;}];
  for(const change of changes){const changed=structuredClone(result);change(changed);
    assert.throws(()=>buildSourceDomainExteriorPanel(changed),{code:'INVALID_SOURCE_DOMAIN_EXTERIOR_VIEW'});}
});

test('the actual shared workspace table selects all five source rows with their exact formulas and positive scales',()=>{
  const workspace=readFileSync(new URL('../extended-workspace.js',import.meta.url),'utf8'),
    start=workspace.indexOf('function renderTable(){'),end=workspace.indexOf('function renderVisual(){',start);
  assert.ok(start>=0&&end>start);
  const makeTable=new Function('out','el','pretty','model','selectedSourceExteriorOrder','selectSourceExteriorOrder','show',
    workspace.slice(start,end)+'; return renderTable;'),table=new Element('tbody',document),labels={},selected=[],
    el=(tag,text,attrs={})=>{const node=new Element(tag,document);if(text!==undefined)node.textContent=text;
      for(const [name,value]of Object.entries(attrs))node.setAttribute(name,value);return node;},
    panel=buildSourceDomainExteriorPanel(result);
  makeTable(()=>table,el,JSON.stringify,{sourceDomainExteriorPanel:panel},3,order=>selected.push(order),(key,text)=>{labels[key]=text;})();
  assert.equal(table.children.length,5);
  for(const [index,row]of table.children.entries()){
    const button=row.children[0].children[0],location=JSON.parse(row.children[1].textContent),values=JSON.parse(row.children[2].textContent);
    assert.equal(button.attributes['data-source-exterior-order'],String(index));
    assert.equal(button.attributes['aria-pressed'],String(index===3));button.handlers.click();
    assert.equal(location.positiveScales.radial,panel.forceRows[index].radial.positiveScale);
    assert.equal(location.positiveScales.theta,panel.forceRows[index].theta.positiveScale);
    assert.equal(values.divergence,panel.forceRows[index].divergence.formula);
    assert.deepEqual(values.velocityPolynomial,results.exterior.rows[index].polynomials.velocityPolynomial);
    assert.match(row.children[3].textContent,/수식 ID는 수치값 아님/);
  }
  assert.deepEqual(selected,[0,1,2,3,4]);assert.match(labels['table-caption'],/속도 표본 0개/);
  assert.match(labels['table-note'],/원본 파일/);assert.equal(JSON.stringify(result),before);
});

test('the actual shared source links preserve repository paths, artifact hashes and safe source-only destinations',()=>{
  const workspace=readFileSync(new URL('../extended-workspace.js',import.meta.url),'utf8'),
    start=workspace.indexOf('function addSourceArtifactLinks('),end=workspace.indexOf('function addSummaryTable(',start);
  assert.ok(start>=0&&end>start);
  const makeLinks=new Function('out','el','build',workspace.slice(start,end)+'; return addSourceArtifactLinks;'),
    host=new Element('div',document),el=(tag,text,attrs={})=>{const node=new Element(tag,document);if(text!==undefined)node.textContent=text;
      for(const [name,value]of Object.entries(attrs))node.setAttribute(name,value);return node;},
    build={sourceBinding:{repository:'https://github.com/leegahuyn/MathScopeCompute',branch:'source-review-test'}},
    addLinks=makeLinks(()=>host,el,build);
  addLinks(result);const nodes=flatten(host),links=nodes.filter(node=>node.tagName==='a');
  assert.equal(links.length,4);
  for(const artifact of [results.exteriorArtifact,results.domainArtifact,results.receipt,results.sourceCapture]){
    assert.ok(links.some(node=>node.attributes.href===build.sourceBinding.repository+'/blob/source-review-test/'+artifact.path));
    assert.ok(nodes.some(node=>node.textContent.includes(artifact.sha256)));
  }
  assert.ok(links.every(node=>node.attributes.rel==='noopener noreferrer'&&node.attributes.target==='_blank'));
  const beforeCount=host.children.length;
  addLinks({results:{artifact:{path:'research-ide/../../outside.json',sha256:'a'.repeat(64),bytes:1},
    domainArtifact:{path:'https://unrelated.example/file.json',sha256:'a'.repeat(64),bytes:1}}});
  assert.equal(host.children.length,beforeCount);assert.equal(JSON.stringify(result),before);
});
