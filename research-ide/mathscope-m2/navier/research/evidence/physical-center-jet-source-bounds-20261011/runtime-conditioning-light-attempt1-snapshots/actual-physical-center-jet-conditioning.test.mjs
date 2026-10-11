import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {physicalCenterNumericalJetConditioning as runtime} from '../actual-physical-center-jet-conditioning.mjs';
import {physicalCenterNumericalJetConditioning as source} from '../actual-physical-center-jet-source-enclosure-bounds.mjs';

const box=x=>({lower:x,upper:x}),values=()=>({centers:[box('3/8'),box('7/16')],weights:[box('16/9'),box('64/49')],
  covariance:[[box('9/32'),box('49/128')],[box('9/32'),box('-49/128')]]});

test('runtime and frozen source conditioning have identical complete function bytes',()=>{
  const original=readFileSync(new URL('../actual-physical-center-jet-source-enclosure-bounds.mjs',import.meta.url),'utf8'),
    copy=readFileSync(new URL('../actual-physical-center-jet-conditioning.mjs',import.meta.url),'utf8'),
    start=original.indexOf('export function physicalCenterNumericalJetConditioning('),end=original.indexOf('\n/** Read-only diagnostic addendum',start),
    body=original.slice(start,end).trimEnd()+'\n',copyBody=copy.slice(copy.indexOf('export function physicalCenterNumericalJetConditioning('));
  assert.equal(copyBody,body);
  assert.equal(createHash('sha256').update(copyBody).digest('hex'),createHash('sha256').update(body).digest('hex'));
});

test('asymmetric independent centers give the same directed conditioning without source authority',()=>{
  const v=values(),before=structuredClone(v),a=runtime(v,256),b=source(v,256);
  assert.deepEqual(a,b);assert.deepEqual(v,before);assert.equal(a.pass,true);assert.equal(a.sourceAuthenticated,false);
  assert.equal(a.arithmetic.binary64UsedForDecisions,false);assert.ok(a.checks.every(c=>c.pass));
});

test('singular covariance and broad positive-weight boxes are rejected by the lightweight copy',()=>{
  const singular=values();singular.covariance[1][1]=box('49/128');
  assert.throws(()=>runtime(singular,256));assert.throws(()=>source(singular,256));
  const broad=values();broad.weights[0]={lower:'1/8',upper:'4'};
  assert.throws(()=>runtime(broad,256),{code:'PRECISION_REQUIRED'});assert.throws(()=>source(broad,256),{code:'PRECISION_REQUIRED'});
});
