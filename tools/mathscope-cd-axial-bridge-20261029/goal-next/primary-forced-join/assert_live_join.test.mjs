import test from 'node:test';import assert from 'node:assert/strict';
import {assertLivePrimaryForcedJoin, raiseSharedNodeLimit} from './assert_live_join.mjs';

test('the shared allocator admits new nodes after its real ceiling changes', () => {
  const allocator = {nodes: [0, 1], maxNodes: 2, append(node) {
    if (this.nodes.length >= this.maxNodes) throw Error('node limit');
    this.nodes.push(node);
  }};
  const layer = baseGraph => new Proxy({baseGraph}, {get(target, key) {
    if (Reflect.has(target, key)) return target[key];
    const value = baseGraph[key];
    return typeof value === 'function' ? value.bind(baseGraph) : value;
  }});
  const auxiliary = layer(allocator);
  const coupled = layer(auxiliary);
  assert.throws(() => coupled.append(2), /node limit/);
  auxiliary.maxNodes = 3;
  assert.equal(coupled.maxNodes, 3);
  assert.throws(() => coupled.append(2), /node limit/);
  assert.throws(() => raiseSharedNodeLimit(coupled, 2, 3));
  delete auxiliary.maxNodes;
  assert.deepEqual(raiseSharedNodeLimit(coupled, 2, 3),
    {previous: 2, maximum: 3, sourceNodeCount: 2, actualAllocatorUpdated: true});
  coupled.append(2);
  assert.deepEqual(allocator.nodes, [0, 1, 2]);
  assert.throws(() => coupled.append(3), /node limit/);
});
function fixture(){
 const native=Object.fromEntries(['assertActualCommonAdmissibleFamily','assertActualCommonTargetWeightedNorms','assertGlobalCurrentState','assertGlobalPrimaryClassOperator','assertGlobalInitializedAngular','assertGlobalForcedCurrent'].map(k=>[k,()=>true]));
 const family={request:{throughOrder:2,derivativeOrder:5}},nodes=[],G={nodes,zero:0,q:x=>x,mul:(a,b)=>a*b,add:(a,b)=>a+b,expressionSystem:body=>({body})};
 const current={G,band:{family,window:{coefficientOrder:1}}},target={family,request:{derivativeOrder:3}},primary={current,target,request:{order:2},bounds:{backgroundRow:{derivativeOrder:3,backgroundDerivativeOrder:5},targetRows:[0,1,2,3].map(i=>({derivativeOrder:i,pole:3+3*i}))},scope:{actualFiniteDerivativeOrder:2,actualForcedInputWClassCertified:false,completeN6:false}},templates=[],forcedTemplates=[];
 for(let n=0;n<5;n++)for(const sign of [1,-1]){
  const key=`${n}:${sign}`,raw=[1,2].map(m=>({m,value:[0,1,2].map(j=>({real:1000+100*n+10*j+m,imaginary:2000+100*n+10*j+m}))}));
  const prior=[{m:1,value:[0,1,2].map(()=>({real:1,imaginary:0}))}];
  const supported=raw.map(r=>({m:r.m,value:r.value.map((v,j)=>({real:v.real-(r.m===1?1:0),imaginary:v.imaginary}))}));
  const old={key,waveResidual:raw,primaryFlatResidual:prior,nonzeroAngularForcing:supported};templates.push(old);
  const forced=supported.map(r=>{const pullback=r.value.map(v=>Object.fromEntries(['real','imaginary'].map(part=>[part,{body:v[part],mapped:v[part],system:v[part],check:{pass:true}}])));
   return {m:r.m,inputRoots:r.value,pullback,bound:{originalSource:r.value,wrappedSource:r.value},signedSolutions:[{pathSource:r.value}],inverse:{system:2*(2*n+(sign===1?0:1))+r.m},checks:[{pass:true}]};});
  forcedTemplates.push({key,rawInitializedWaveResidual:raw,primaryFlatResidual:prior,originalSourceRows:supported,forced,support:{checks:[{pass:true}]}});
 }
 const initial={G,templates,mean:{temporal:{pressure:{current}}}},forced={G,input:initial,templates:forcedTemplates};return {family,current,target,primary,initial,forced,native};
}
test('one live chain has 20 systems and all 120 exact components',()=>{const v=assertLivePrimaryForcedJoin(fixture());assert.equal(v.systems,20);assert.equal(v.components,120);assert.equal(v.actualInputForcingWClassCertified,false)});
test('reject wrong target family, detached current and altered raw source',()=>{for(const edit of [x=>x.target.family={},x=>x.primary.current={},x=>{x.forced.templates[0].forced[0].inputRoots[0].real++}]){const x=fixture();edit(x);assert.throws(()=>assertLivePrimaryForcedJoin(x));}});
test('reject fake seal and substituted primary component',()=>{let x=fixture();x.native.assertGlobalForcedCurrent=()=>{throw Error('bad seal')};assert.throws(()=>assertLivePrimaryForcedJoin(x));x=fixture();x.forced.templates[0].primaryFlatResidual[0].value[0].real=9;assert.throws(()=>assertLivePrimaryForcedJoin(x));});
