/** Exact snapshot guard only. This helper computes no numerical bound and
 * conveys no source authority. A private producer must independently
 * authenticate its unchanged original prefix and function definitions. */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';
const snapshots=new WeakMap();
export function captureNumericalScaleRootSeal(G,{appendStart,roots}){
  if(!G||!Array.isArray(G.nodes)||!Number.isSafeInteger(appendStart)||appendStart<0||appendStart>G.nodes.length||
    !Array.isArray(roots)||roots.some(id=>!Number.isSafeInteger(id)||id<0||!G.nodes[id]))
    fail('INVALID_INPUT','Use the existing graph, its pre-attachment prefix length and every numerical source root.');
  const unique=[...new Set(roots)].sort((a,b)=>a-b),end=G.nodes.length,
    record={schema:'MathScope.NumericalScaleRootSeal/1',appendStart,appendEnd:end,sourceRoots:unique,
      appendedNodeCount:end-appendStart,sourceAuthenticated:false,numericalCalculationPerformed:false},
    data=canonicalStringify(record),appended=canonicalStringify(G.nodes.slice(appendStart,end)),
    rootNodes=canonicalStringify(unique.map(id=>({id,node:G.nodes[id]})));
  snapshots.set(record,{G,data,appendStart,end,unique,appended,rootNodes});return record;
}
export function assertNumericalScaleRootSeal(record,G){
  const s=snapshots.get(record);if(!s||s.G!==G||s.data!==canonicalStringify(record)||!Array.isArray(G.nodes)||
    s.appended!==canonicalStringify(G.nodes.slice(s.appendStart,s.end))||
    s.rootNodes!==canonicalStringify(s.unique.map(id=>({id,node:G.nodes[id]}))))
    fail('INVALID_SOURCE_CONSTRUCTION','A retained numerical source root or its newly appended arithmetic dependency changed.');
  return true;
}
