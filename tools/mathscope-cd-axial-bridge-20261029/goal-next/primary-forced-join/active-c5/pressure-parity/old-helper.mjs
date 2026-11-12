/** Scratch canonical-value snapshot.  No native issuer is patched here. */
import {createHash} from 'node:crypto';

const forbidden=new Set(['__proto__','prototype','constructor']);
const isIndex=k=>{const n=Number(k);return Number.isInteger(n)&&n>=0&&n<4294967295&&String(n)===k;};
const orderedKeys=v=>{
  const keys=Object.keys(v).sort();
  return [...keys.filter(isIndex).sort((a,b)=>Number(a)-Number(b)),...keys.filter(k=>!isIndex(k))];
};

/** Emit exact canonical JSON text in bounded fragments for plain data JSON.
 * Accessors are deliberately rejected: the source graph uses data properties,
 * and getter execution order need not agree with sorted-object JSON output.
 */
export function canonicalEmit(value,sink){
  if(typeof Object.prototype.toJSON==='function'||typeof Array.prototype.toJSON==='function')throw TypeError('toJSON on built-in JSON prototype is unsupported');
  const active=new Set();
  function visit(v,path,allow=false){
    if(v===null||typeof v==='string'||typeof v==='boolean'){sink(JSON.stringify(v));return;}
    if(typeof v==='number'){
      if(!Number.isFinite(v)||(!allow&&Number.isInteger(v)&&!Number.isSafeInteger(v)))throw TypeError(path+': unsafe JSON number');
      sink(JSON.stringify(Object.is(v,-0)?0:v));return;
    }
    if(typeof v!=='object')throw TypeError(path+': unsupported JSON value');
    if(active.has(v))throw TypeError(path+': cyclic JSON');
    if(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)throw TypeError(path+': plain JSON object required');
    active.add(v);
    if(Array.isArray(v)){
      sink('[');for(let i=0;i<v.length;i++){
        if(!Object.hasOwn(v,i))throw TypeError(path+': sparse JSON array');
        const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!Object.hasOwn(d,'value'))throw TypeError(path+': accessor');
        if(i)sink(',');visit(d.value,path+'['+i+']',allow);
      }sink(']');
    }else{
      const keys=orderedKeys(v);sink('{');
      for(let i=0;i<keys.length;i++){
        const k=keys[i];if(forbidden.has(k))throw TypeError(path+': reserved key');
        const d=Object.getOwnPropertyDescriptor(v,k);if(!d||!Object.hasOwn(d,'value'))throw TypeError(path+': accessor');
        if(i)sink(',');sink(JSON.stringify(k));sink(':');
        const approximate=(v.kind==='FLOAT64'&&k==='value')||(v.kind==='STATISTICAL_ESTIMATE'&&['estimate','standardError','interval'].includes(k));
        visit(d.value,path+'.'+k,approximate);
      }sink('}');
    }
    active.delete(v);
  }
  visit(value,'$');
}

export function canonicalHash(value){
  const h=createHash('sha256');let bytes=0;
  canonicalEmit(value,s=>{h.update(s,'utf8');bytes+=Buffer.byteLength(s,'utf8')});
  return {sha256:h.digest('hex'),bytes};
}

/** Canonical cloned metadata with the original strict JSON value rules.
 * A recursive clone needs memory proportional to metadata but does not create
 * the huge canonical string. It is for data properties, not accessor objects.
 */
export function canonicalClone(value){
  const active=new Set();
  function visit(v,path,allow=false){
    if(v===null||typeof v==='string'||typeof v==='boolean')return v;
    if(typeof v==='number'){
      if(!Number.isFinite(v)||(!allow&&Number.isInteger(v)&&!Number.isSafeInteger(v)))throw TypeError(path+': unsafe JSON number');
      return Object.is(v,-0)?0:v;
    }
    if(typeof v!=='object')throw TypeError(path+': unsupported JSON value');
    if(active.has(v))throw TypeError(path+': cyclic JSON');
    if(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)throw TypeError(path+': plain JSON object required');
    active.add(v);let out;
    if(Array.isArray(v)){
      out=[];for(let i=0;i<v.length;i++){
        if(!Object.hasOwn(v,i))throw TypeError(path+': sparse JSON array');
        const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d||!Object.hasOwn(d,'value'))throw TypeError(path+': accessor');
        out.push(visit(d.value,path+'['+i+']',allow));
      }
    }else{
      out={};for(const k of Object.keys(v).sort()){
        if(forbidden.has(k))throw TypeError(path+': reserved key');
        const d=Object.getOwnPropertyDescriptor(v,k);if(!d||!Object.hasOwn(d,'value'))throw TypeError(path+': accessor');
        const approximate=(v.kind==='FLOAT64'&&k==='value')||(v.kind==='STATISTICAL_ESTIMATE'&&['estimate','standardError','interval'].includes(k));
        out[k]=visit(d.value,path+'.'+k,approximate);
      }
    }
    active.delete(v);return out;
  }
  return visit(value,'$');
}

function freezeDeep(v){
  if(v&&typeof v==='object'){
    for(const k of Object.keys(v))freezeDeep(v[k]);
    if(!Object.isFrozen(v))Object.freeze(v);
  }
  return v;
}

function containsNegativeZero(v){
  if(typeof v==='number')return Object.is(v,-0);
  return v&&typeof v==='object'&&Object.keys(v).some(k=>containsNegativeZero(v[k]));
}

/** Compare two admitted source graph prefixes without a monolithic string.
 * Identity is fast only for recursively frozen records already validated by
 * captureNodePrefix; callers must first assert the source family seal.
 */
export function compareNodePrefixes(a,b,count,canonicalStringify){
  if(!Array.isArray(a)||!Array.isArray(b)||!Number.isSafeInteger(count)||count<0)return false;
  const n=Math.min(a.length,count);if(n!==Math.min(b.length,count))return false;
  for(let i=0;i<n;i++){
    if(!Object.hasOwn(a,i)||!Object.hasOwn(b,i))throw TypeError('sparse JSON array');
    if(a[i]===b[i]&&a[i]&&typeof a[i]==='object'&&Object.isFrozen(a[i]))continue;
    if(canonicalStringify(a[i])!==canonicalStringify(b[i]))return false;
  }
  return true;
}

/** Node records must be valid data JSON. Original graph nodes are frozen so
 * equal-by-identity is sound. Canonical −0 is separately cloned/normalized.
 * Expected records remain private; public nodes and live prefix arrays are
 * distinct and can be replaced, just as in the old append-only graph.
 */
export function captureNodePrefix(source,canonicalStringify){
  if(!Array.isArray(source))throw TypeError('Expected source nodes');
  const privateNodes=[];
  for(const node of source){
    canonicalEmit(node,()=>{}); // strict JSON validation before freeze
    const normalized=containsNegativeZero(node)?freezeDeep(canonicalStringify===JSON.stringify?JSON.parse(JSON.stringify(node)):canonicalClone(node)):node;
    freezeDeep(node);privateNodes.push(normalized);
  }
  Object.freeze(privateNodes);
  function equalRecord(actual,expected){
    if(actual===expected)return true;
    try{return canonicalStringify(actual)===canonicalStringify(expected)}catch{return false}
  }
  function verify(live,exact=false){
    if(!Array.isArray(live)||live.length<privateNodes.length||(exact&&live.length!==privateNodes.length))return false;
    for(let i=0;i<privateNodes.length;i++){
      if(!Object.hasOwn(live,i)||!equalRecord(live[i],privateNodes[i]))return false;
    }
    return true;
  }
  return {nodeCount:privateNodes.length,verify,detached:()=>privateNodes};
}

export function makeSnapshot(packed,canonicalStringify){
  if(!packed||!Array.isArray(packed.nodes))throw TypeError('Expected program nodes');
  const prefix=captureNodePrefix(packed.nodes,canonicalStringify);
  const metadata={...packed};delete metadata.nodes;
  const publicProgram=canonicalClone(metadata);publicProgram.nodes=prefix.detached();
  const metadataSeal=canonicalStringify(metadata);
  function verify(live,program){
    if(!program||!prefix.verify(live)||!prefix.verify(program.nodes,true))return false;
    const nextMetadata={...program};delete nextMetadata.nodes;
    try{return canonicalStringify(nextMetadata)===metadataSeal}catch{return false}
  }
  return {program:publicProgram,nodeCount:prefix.nodeCount,verify};
}

import {canonicalStringify as _originalCanonical} from '../../mathscope-m0/contracts.mjs';
const _prefix=(nodes,count,fn)=>{if(!Number.isSafeInteger(count)||count<0||count>nodes.length)throw TypeError('Invalid prefix');return captureNodePrefix(count===nodes.length?nodes:nodes.slice(0,count),fn)};
export const captureNodes=(nodes,count=nodes.length)=>_prefix(nodes,count,_originalCanonical);
export const captureRawNodes=(nodes,count=nodes.length)=>_prefix(nodes,count,JSON.stringify);
export const makeProgramSnapshot=packed=>makeSnapshot(packed,_originalCanonical);
export const sameNodePrefix=(a,b,count)=>compareNodePrefixes(a,b,count,_originalCanonical);
