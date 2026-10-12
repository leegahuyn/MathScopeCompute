import test from 'node:test';
import assert from 'node:assert/strict';
import {qpdCechAlexanderP1,verifyQpdNerve} from '../qpd-nerve.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const mod=(a,m)=>((a%m)+m)%m;
function inverse(x,m){x=mod(x,m);for(let a=1n;a<m;a++)if(a*x%m===1n)return a;throw Error('no modular inverse');}
function power(a,n,m){a=mod(a,m);if(n<0){a=inverse(a,m);n=-n;}let r=1n;for(let i=0;i<n;i++)r=r*a%m;return r;}
function evaluate(poly,values,m){return mod(poly.reduce((sum,term)=>sum+Object.entries(term.powers).reduce((v,[k,n])=>mod(v*power(values[k],n,m),m),BigInt(term.coefficient)),0n),m);}
function valuesFor(p,q,T,m=101n){
 const Q=x=>Array.from({length:p},(_,k)=>power(x,k,m)).reduce((s,c)=>mod(s+c,m),0n),v={q:BigInt(q)};T.forEach((t,i)=>{v['T'+i]=BigInt(t);});
 for(let j=1;j<T.length;j++){
  const d=mod(power(BigInt(T[j]),p,m)-power(BigInt(T[0]),p,m),m),y=mod(d*inverse(Q(BigInt(q)),m),m),phiY=mod((power(BigInt(T[j]),p*p,m)-power(BigInt(T[0]),p*p,m))*inverse(Q(power(BigInt(q),p,m)),m),m);
  v[`Y${j}_0`]=y;v[`Y${j}_1`]=mod((phiY-power(y,p,m))*inverse(BigInt(p),m),m);
 }
 return v;
}

test('P5-08: actual q-PD envelope delta equations agree with an independent rational finite-field oracle',()=>{
 for(const p of [2,3,5]){
  const r=qpdCechAlexanderP1({p,nerveDegree:3,deltaDepth:1,N:4}),values=valuesFor(p,2,[1,4,7,9]);
  for(const e of r.envelopes)for(const relation of e.relations){assert.equal(evaluate(relation.equation,values,101n),0n);assert.equal(e.displayIsQuotientKillingHigherDelta,false);}
  assert(r.nerveChecks.every(c=>c.zero??c.equal));assert(r.checks.every(c=>c.pass));assert.equal(r.scope.canonicalQPDDescent,true);
  const equation=clone(r.envelopes[1].relations[0].equation);equation[0].coefficient=String(BigInt(equation[0].coefficient)+1n);assert.notEqual(evaluate(equation,values,101n),0n);
 }
});

test('P5-08: every recorded face/degeneracy sends actual delta generators to the independently evaluated target',()=>{
 const p=3,r=qpdCechAlexanderP1({p}),T=[1,4,7,9],q=2;
 for(const map of [...r.faceMaps,...r.degeneracyMaps]){
  const target=valuesFor(p,q,T.slice(0,map.targetDegree+1)),source=valuesFor(p,q,map.indices.map(i=>T[i]));
  for(const image of map.images)assert.equal(evaluate(image.image,target,101n),mod(source[image.generator],101n));
 }
 // A nontrivial basepoint-changing face really includes Witt/delta carry terms.
 const face=r.faceMaps.find(f=>f.sourceDegree===1&&f.indices[0]===1),image=face.images.find(i=>i.generator==='Y1_1');
 assert(image.image.some(t=>Object.keys(t.powers).some(k=>k.endsWith('_0'))));
});

test('P5-08: actual inversion overlap matches the independent rational envelope oracle and preserves triple cocycles',()=>{
 const p=3,r=qpdCechAlexanderP1({p}),T=[2,4,7,9],q=2,values=valuesFor(p,q,T),inverted=valuesFor(p,q,T.map(t=>inverse(BigInt(t),101n)));
 for(const map of r.twoAffineCover.overlapMaps)for(const image of map.images)assert.equal(evaluate(image.image,values,101n),mod(inverted[image.generator],101n));
 assert(r.twoAffineCover.overlapChecks.every(x=>x.pass));assert(r.twoAffineCover.naturalityWitnesses.every(x=>x.pass));
 assert(r.twoAffineCover.naturalityWitnesses.some(x=>x.differenceBeforeRelations.length>0)); // genuinely uses the q-PD quotient relations.
 for(const x of r.twoAffineCover.naturalityWitnesses)assert.deepEqual(x.afterMultiplicationByQIntegerAndDefiningRelations,[]);
});

test('P5-08: delta depth is an observation; deleted higher relations, inverted prism generator and forged maps are rejected',()=>{
 const input={p:3,deltaDepth:1},r=qpdCechAlexanderP1(input);assert(verifyQpdNerve(input,r).pass);assert.equal(r.scope.multiplicativeEInfinityCertified,false);assert.equal(r.canonicalComparison.formalComplete,false);
 for(const mutate of [r=>{r.envelopes[1].relations.pop();},r=>{r.faceMaps[2].images.at(-1).image=[];},r=>{r.twoAffineCover.overlapMaps[1].images.at(-1).image=[];},r=>{r.canonicalComparison.localStep.sameInputs='unrelated singular input';}]){const bad=clone(r);mutate(bad);assert.equal(verifyQpdNerve(input,bad).pass,false);}
 for(const flag of ['truncateHigherDelta','invertPrismGenerator','rawPolynomialDiagonal','singular','certifyEInfinity'])assert.throws(()=>qpdCechAlexanderP1({[flag]:true}),e=>e.code==='INVALID_QPD_COMPARISON');
 assert.throws(()=>qpdCechAlexanderP1({deltaDepth:2}),e=>e.code==='INPUT_RANGE');
});
