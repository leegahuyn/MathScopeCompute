import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {createQuadraticSourceVerifier} from '../source-quadratic-identity.mjs';

test('only the literal original positive sqrt2 supplies the exact quadratic relation',()=>{
  const G=new ActualConvergentExpressions(),r=G.sqrt(G.q(2)),s=G.fresh('arbitrary_source_root'),verify=createQuadraticSourceVerifier(G);
  assert.equal(verify(G.sub(G.pow(r,2),G.q(2))).pass,true);
  assert.equal(verify(G.sub(G.pow(r,2),G.q(3))).pass,false);
  assert.equal(verify(G.sub(G.pow(s,2),G.q(2))).pass,false);
  assert.equal(verify(G.sub(G.pow(G.sqrt(G.q(3)),2),G.q(3))).pass,false);
  assert.equal(verify(G.sub(G.mul(G.add(G.q(4),r),G.sub(G.q(4),r)),G.q(14))).pass,true);
});

test('every retained exact integer quadratic divisor matches the independent conjugate and norm formula',()=>{
  const G=new ActualConvergentExpressions(),r=G.sqrt(G.q(2)),verify=createQuadraticSourceVerifier(G,{maxProducts:1000000});let count=0;
  for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++){
    if(!a&&!b)continue;const norm=BigInt(a*a-2*b*b),d=G.add(G.q(a),G.mul(G.q(b),r)),conjugate=G.sub(G.q(a),G.mul(G.q(b),r)),
      reciprocal=G.div(conjugate,G.q(norm));
    assert.notEqual(norm,0n);assert.equal(verify(G.sub(G.inv(d),reciprocal)).pass,true);
    assert.equal(verify(G.sub(G.mul(d,reciprocal),G.one)).pass,true);count++;
  }
  assert.equal(count,120);
});

test('shared composite symbolic denominators are consistently factored over the exact coefficient field',()=>{
  const G=new ActualConvergentExpressions(),r=G.sqrt(G.q(2)),x=G.fresh('x'),y=G.fresh('y'),d=G.add(x,G.mul(r,y)),
    conjugate=G.sub(x,G.mul(r,y)),norm=G.sub(G.pow(x,2),G.mul(G.q(2),G.pow(y,2))),verify=createQuadraticSourceVerifier(G),
    identity=G.sub(G.inv(d),G.div(conjugate,norm));
  assert.equal(verify(identity).pass,true);
  assert.equal(verify(G.sub(G.inv(d),G.div(conjugate,G.sub(G.pow(x,2),G.pow(y,2))))).pass,false);
  assert.throws(()=>createQuadraticSourceVerifier(G,{maxProducts:1})(G.pow(G.add(x,y,r),5)),{code:'RESOURCE_LIMIT'});
});
