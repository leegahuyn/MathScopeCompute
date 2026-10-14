import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompleteResidualVerifier} from './residual-rational-verifier.mjs';
import {createFactoredRationalVerifier} from '../navier/forced-rational-identity.mjs';
import {sourceSemanticChildren,definitionForNode,createResidualFrontier} from './residual-frontier.mjs';
import {createResidualCartesianCalculus,deriveActualCartesianResidual} from './residual-cartesian.mjs';
import {openFullResidualSource,fullResidualProgram} from './residual-source.mjs';
import {reduceSourceTrigNumerator} from './residual-trig.mjs';

test('the output extension exports all25 exact terms and preserves original verifier arithmetic',()=>{
  const nodes=[{op:'rational',args:['0','1']},...Array.from({length:25},(_,i)=>({op:'coordinate',args:['x'+i]}))];
  const put=(op,args)=>{nodes.push({op,args});return nodes.length-1;};let root=1;for(let id=2;id<=25;id++)root=put('add',[root,id]);
  const a=createFactoredRationalVerifier({nodes})(root),b=createCompleteResidualVerifier({nodes})(root);
  assert.equal(a.numerator.length,20);assert.equal(b.numerator.length,25);assert.equal(b.numeratorMonomials,a.numeratorMonomials);
  assert.deepEqual(b.numerator.slice(0,20),a.numerator);assert.equal(b.productsUsed,a.productsUsed);assert.equal(b.pass,false);assert.equal(b.completeNumeratorExported,true);
  assert.deepEqual(b.actualAtomicNodes,Array.from({length:25},(_,i)=>i+1));
  const one=put('rational',['1','1']),inverse=put('inverse',[1]),identity=put('add',[put('multiply',[1,inverse]),put('rational',['-1','1'])]);
  const c=createCompleteResidualVerifier({nodes})(identity);assert.equal(c.pass,true);assert.ok(c.denominatorOperands.includes(1));assert.equal(c.nonzeroDenominatorProofRequired,true);
  assert.notEqual(one,identity);
});

test('source registry indices and derivative orders are metadata, while the complete atom body remains bound',()=>{
  const node={op:'m3_aux_indexed_partial',args:[90,[3,4],[2,6]]};assert.deepEqual(sourceSemanticChildren(node),[3,4]);
  assert.deepEqual(sourceSemanticChildren({op:'actual_quadratic_root',args:[0,4,2]}),[2]);
  assert.deepEqual(sourceSemanticChildren({op:'integer_power',args:[4,6]}),[4]);
  assert.deepEqual(sourceSemanticChildren({op:'m3_forced_pulse_partial',args:[0,'real',2,4,[7,8],[1,0]]}),[4,7,8]);
});

test('coupled namespaces and forced systems bind their original complete registry group and exact id',()=>{
  const expression={id:'coupled-expression:0',name:'ActualAngular',parameters:[1],body:4},forced={id:0,name:'ActualForce',parameters:[1],matrix:[[4]],forcing:[{real:4,imaginary:0}]};
  const defs={definitions:[[expression],[],[],[forced],[]]};
  assert.deepEqual(definitionForNode({op:'m3_coupled_expression_partial',args:['coupled-expression:0',[1],[0]]},defs).definition,expression);
  assert.deepEqual(definitionForNode({op:'m3_forced_pulse_partial',args:[0,'real',0,1,[1],[0]]},defs).definition,forced);
  assert.throws(()=>definitionForNode({op:'m3_coupled_expression_partial',args:['coupled-expression:1',[1],[0]]},defs),{code:'INVALID_ACTUAL_RESIDUAL_SOURCE'});
});

test('every opaque source node and its actual definition survive multi-label classification',()=>{
  const nodes=[{op:'rational',args:['0','1']},{op:'coordinate',args:['R']},{op:'coordinate',args:['Y0']},{op:'actual_expression_partial',args:[0,[1,2],[0,0]]},{op:'mystery_actual_limit',args:['literal',1]}];
  const definitions={expression:[{name:'ActualPressureResidual',parameters:[1,2],body:4}]},f=createResidualFrontier({node:id=>nodes[id],definitions,geometry:{R:1,Z:1,T:1,Y:[2],theta:2,epsilon:0,ci:0,radialFast:0},nodeCount:nodes.length});
  const term=f.classify('1:2,3:1','-3/7');assert.ok(term.labels.includes('NEGATIVE_EXACT_COEFFICIENT'));assert.ok(term.labels.includes('REPEATED_ACTUAL_ATOM'));assert.ok(term.labels.includes('RADIAL_COORDINATE'));assert.deepEqual(term.opaqueFrontierSourceIDs,[3,4]);
  const d=f.diagnostics();assert.equal(d.actualOpaqueFrontier.length,2);assert.deepEqual(d.actualOpaqueFrontier.find(x=>x.sourceNode===4).node,nodes[4]);assert.deepEqual(d.definitionBindings[0].definition,definitions.expression[0]);assert.equal(d.oldPassFlagsInsideDefinitionsUsedAsProof,false);
});

function evaluate(G,root,coordinates){const memo=new Map();function at(id){if(memo.has(id))return memo.get(id);const {op,args:a}=G.nodes[id];let value;
  if(op==='rational')value=Number(a[0])/Number(a[1]);else if(op==='coordinate'){assert.ok(Object.hasOwn(coordinates,a[0]));value=coordinates[a[0]];}
  else if(op==='add')value=a.reduce((s,x)=>s+at(x),0);else if(op==='multiply')value=a.reduce((s,x)=>s*at(x),1);else if(op==='inverse')value=1/at(a[0]);else if(op==='integer_power')value=at(a[0])**a[1];
  else if(op==='sine'){assert.equal(at(a[0]),0);value=0;}else if(op==='cosine'){assert.equal(at(a[0]),0);value=1;}else throw new Error('Unresolved fixture operation:'+op);
  memo.set(id,value);return value;}return at(root);}
function fixture(){const nodes=[{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},...['R','Z','T','Y0','Y1','theta'].map(name=>({op:'coordinate',args:[name]}))];
  return {nodes,node:id=>nodes[id],geometry:{R:2,Z:3,T:4,Y:[5,6],theta:7,vr:[1,0],vt:[0,1],epsilon:1,ci:0,radialFast:0}};}

test('independent Cartesian rotation retains the centrifugal connection of a rigid angular velocity',()=>{
  const f=fixture(),G=createResidualCartesianCalculus({node:f.node}),r=deriveActualCartesianResidual(G,{geometry:f.geometry,velocity:[0,2,0],pressure:0}),coordinates={R:2,Z:0,T:0,Y0:0,Y1:0,theta:0};
  assert.equal(r.diagnostics.unresolvedActualJetRequests.length,0);
  assert.deepEqual(r.backToCylindrical.map(x=>evaluate(G,x,coordinates)),[-2,0,0]);
  assert.equal(evaluate(G,r.divergence,coordinates),0);
  assert.deepEqual(r.jets.map(x=>evaluate(G,x.laplacian,coordinates)),[0,0,0]);
  assert.equal(r.actualCartesianPDEVerified,false,'A finite fixture is never an actual source PDE proof.');
});

test('unknown actual field leaves record every total derivative stop instead of returning0',()=>{
  const f=fixture();f.nodes.push({op:'m3_aux_indexed_partial',args:[0,[2,3,4,5,6,7],[0,0,0,0,0,0]]});const G=createResidualCartesianCalculus({node:f.node}),r=deriveActualCartesianResidual(G,{geometry:f.geometry,velocity:[8,0,0],pressure:0});
  assert.ok(r.diagnostics.unresolvedActualJetRequests.length>0);assert.ok(G.nodes.some(n=>n.op==='unresolved_total_source_jet'));assert.equal(r.actualOpaqueJetsIndependentlyEvaluated,false);assert.equal(r.actualCartesianPDEVerified,false);assert.equal(r.diagnostics.unresolvedJetReplacedByZero,false);
  assert.deepEqual(r.diagnostics.opaqueActualOperands[0].node,f.nodes[8]);
});

test('independent source coordinate identity is retained even when literal coordinate names coincide',()=>{
  const nodes=[{op:'coordinate',args:['theta']},{op:'coordinate',args:['theta']}],G=createResidualCartesianCalculus({node:id=>nodes[id]}),x=G.importSource(0),y=G.importSource(1);
  assert.notEqual(x,y);assert.equal(G.derivative(x,y),G.zero);assert.equal(G.derivative(x,x),G.one);
});

test('a copied saved capability or replacement source cannot authorize an actual PDE claim',async()=>{
  assert.throws(()=>fullResidualProgram({source:{status:'SOURCE_VERIFIED',actualCartesianPDEVerified:true}}),{code:'INVALID_ACTUAL_RESIDUAL_SOURCE'});
  await assert.rejects(openFullResidualSource({completeN6:true}),{code:'INVALID_ACTUAL_RESIDUAL_SOURCE'});
});

test('exact source same-argument trig reduction cancels every power and retains denominator obligations',()=>{
  const nodes=[{op:'coordinate',args:['actual_theta']},{op:'sine',args:[0]},{op:'cosine',args:[0]},{op:'sine',args:[0]}];
  const at=numerator=>reduceSourceTrigNumerator({node:id=>nodes[id],atomicSourceIDs:[1,2,3],numerator});
  const identity=at([{monomial:'1:2',coefficient:'1'},{monomial:'2:2',coefficient:'1'},{monomial:'',coefficient:'-1'}]);
  assert.equal(identity.quotientNumeratorZero,true);assert.equal(identity.relations.length,1);assert.equal(identity.relations[0].argumentSourceNode,0);
  assert.equal(identity.nonzeroDenominatorHypothesesDischarged,false);assert.equal(identity.actualSourcePDEVerified,false);
  const quartic=at([{monomial:'2:4',coefficient:'1'},{monomial:'1:2',coefficient:'2'},{monomial:'1:4',coefficient:'-1'},{monomial:'',coefficient:'-1'}]);
  assert.equal(quartic.quotientNumeratorZero,true);
  const alias=at([{monomial:'1:1',coefficient:'3/7'},{monomial:'3:1',coefficient:'-3/7'}]);assert.equal(alias.quotientNumeratorZero,true);
});

test('distinct actual source phases never satisfy a trig relation by coordinate name',()=>{
  const nodes=[{op:'coordinate',args:['theta']},{op:'coordinate',args:['theta']},{op:'sine',args:[0]},{op:'cosine',args:[1]}];
  const r=reduceSourceTrigNumerator({node:id=>nodes[id],atomicSourceIDs:[2,3],numerator:[{monomial:'2:2',coefficient:'1'},{monomial:'3:2',coefficient:'1'},{monomial:'',coefficient:'-1'}]});
  assert.equal(r.relations.length,0);assert.equal(r.reducedMonomials,3);assert.equal(r.quotientNumeratorZero,false);assert.equal(r.unrelatedAnglesMerged,false);
});
