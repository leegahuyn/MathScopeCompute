/** Lossless metadata snapshots for the original first-selector tuples.
 * Present undefined, absent fields, array holes, Map/Set entries and
 * function identity are distinct. This is a read-only generic comparison,
 * not an actual-source token or a relaxed global JSON/canonical policy.
 */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const snapshots=new WeakMap();

function encodeTuple(value,limits,knownFunctions=null){
  const objects=[],seen=new Map(),functions=knownFunctions??new Map(),statistics={entries:0,objects:0,functions:0,maps:0,sets:0,
    undefinedPaths:[],functionPaths:[],arrayHoleCount:0},tick=depth=>{
    if(++statistics.entries>limits.maxEntries||depth>limits.maxDepth)
      fail('RESOURCE_LIMIT','The original tuple snapshot exceeded its explicit metadata budget.');
  },visit=(x,path,depth)=>{
    tick(depth);
    if(x===undefined){statistics.undefinedPaths.push(path);return ['undefined'];}
    if(x===null)return ['null'];
    if(typeof x==='string'||typeof x==='boolean')return [typeof x,x];
    if(typeof x==='number'){
      if(!Number.isFinite(x))fail('INVALID_SOURCE_CONSTRUCTION','An original tuple has a nonfinite numeric metadata value at '+path);
      return ['number',Object.is(x,-0)?'-0':String(x)];
    }
    if(typeof x==='bigint')return ['bigint',String(x)];
    if(typeof x!=='object'&&typeof x!=='function')fail('INVALID_SOURCE_CONSTRUCTION','Unsupported original tuple metadata type at '+path);
    if(seen.has(x))return ['reference',seen.get(x)];
    const id=objects.length,record={id};seen.set(x,id);objects.push(record);statistics.objects++;
    if(typeof x==='function'){
      if(!functions.has(x)){
        if(knownFunctions)fail('INVALID_SOURCE_CONSTRUCTION','An original tuple function identity changed at '+path);
        functions.set(x,functions.size);
      }
      record.type='function';record.identity=functions.get(x);record.source=Function.prototype.toString.call(x);
      statistics.functions++;statistics.functionPaths.push(path);
    }else if(Array.isArray(x)){
      record.type='array';record.length=x.length;
      if(x.length>limits.maxEntries)fail('RESOURCE_LIMIT','The original tuple array exceeds its finite metadata budget.');
      let present=0;for(let j=0;j<x.length;j++)if(Object.hasOwn(x,j))present++;
      statistics.arrayHoleCount+=x.length-present;
    }else if(x instanceof Map&&Object.getPrototypeOf(x)===Map.prototype){
      if(x.size>limits.maxEntries)fail('RESOURCE_LIMIT','The original tuple Map exceeds its finite metadata budget.');
      record.type='map';record.entries=[...x].map(([k,v],j)=>[visit(k,path+'.mapKey['+j+']',depth+1),visit(v,path+'.mapValue['+j+']',depth+1)]);statistics.maps++;
    }else if(x instanceof Set&&Object.getPrototypeOf(x)===Set.prototype){
      if(x.size>limits.maxEntries)fail('RESOURCE_LIMIT','The original tuple Set exceeds its finite metadata budget.');
      record.type='set';record.entries=[...x].map((v,j)=>visit(v,path+'.set['+j+']',depth+1));statistics.sets++;
    }else if(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null){
      record.type=Object.getPrototypeOf(x)===null?'null-prototype-object':'object';
    }else fail('INVALID_SOURCE_CONSTRUCTION','An unsupported producer/class entered the original tuple metadata at '+path);
    const keys=Reflect.ownKeys(x);
    if(keys.some(k=>typeof k!=='string'))fail('INVALID_SOURCE_CONSTRUCTION','Symbol-keyed original tuple metadata is unsupported at '+path);
    record.properties=keys.sort().map(k=>{
      const d=Object.getOwnPropertyDescriptor(x,k);
      if(!Object.hasOwn(d,'value'))fail('INVALID_SOURCE_CONSTRUCTION','An accessor entered the original tuple metadata at '+path+'.'+k);
      return {key:k,enumerable:d.enumerable,configurable:d.configurable,writable:d.writable,value:visit(d.value,path+'.'+k,depth+1)};
    });
    return ['reference',id];
  },root=visit(value,'$',0);
  return {encoding:{root,objects},statistics,functions};
}

export function captureFirstSelectorSourceTupleSnapshot(records,{maxEntries=250000,maxDepth=128}={}){
  if(!Number.isSafeInteger(maxEntries)||maxEntries<1||!Number.isSafeInteger(maxDepth)||maxDepth<1)
    fail('INVALID_INPUT','Use positive finite tuple metadata budgets.');
  const limits={maxEntries,maxDepth},{encoding,statistics,functions}=encodeTuple(records,limits),
    result={schema:'MathScope.FirstSelectorOriginalTupleTypedSnapshot/1',encoding,statistics,
      presentUndefinedAndMissingFieldsDistinguished:true,arrayHolesDistinguished:true,originalFunctionIdentityChecked:true,
      sourceAuthenticated:false};
  snapshots.set(result,{data:canonicalStringify(result),functions,limits,compared:false});return result;
}

export function assertFirstSelectorSourceTupleSnapshotUnchanged(records,snapshot){
  const saved=snapshots.get(snapshot);
  if(!saved||canonicalStringify(snapshot)!==saved.data)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged read-only snapshot of the original source tuple.');
  const now=encodeTuple(records,saved.limits,saved.functions);
  if(canonicalStringify(now.encoding)!==canonicalStringify(snapshot.encoding)||canonicalStringify(now.statistics)!==canonicalStringify(snapshot.statistics))
    fail('INVALID_SOURCE_CONSTRUCTION','An original source tuple root, coefficient, optional field or metadata value changed.');
  saved.compared=true;return true;
}

/** A small serializable audit of the comparison. The actual snapshot and
 * function identities remain private to the in-process comparison. */
export function firstSelectorSourceTupleSnapshotAudit(snapshot){
  const saved=snapshots.get(snapshot);
  if(!saved||canonicalStringify(snapshot)!==saved.data)fail('INVALID_SOURCE_CONSTRUCTION','The original tuple snapshot changed.');
  return structuredClone({schema:snapshot.schema,statistics:snapshot.statistics,
    presentUndefinedAndMissingFieldsDistinguished:true,arrayHolesDistinguished:true,originalFunctionIdentityChecked:true,
    snapshotComparedBeforeAndAfterAdditionalNorm:saved.compared,sourceAuthenticated:false});
}
