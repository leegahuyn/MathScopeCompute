import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, output, graph] = process.argv.slice(2);
if (!runtime || !output || !graph) throw new Error('runtime, output and private graph paths are required');
const modulePath = resolve(runtime, 'research-ide/mathscope-m2/navier/actual-order-one-weighted-stress.mjs');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const pin = '49cde0b930f375e8eca5610ecb7d1e91c9c4361bdd1395a1971081fb1fdfd1b3';
if (sha(await readFile(modulePath)) !== pin) throw new Error('unexpected original source module');
const m = await import(pathToFileURL(modulePath));
const source = m.prepareActualOrderOneWeightedStress({ derivativeOrder: 2, maxNodes: 1500000 }, {
  onProgress: (step) => console.log(JSON.stringify(step)),
});
const certificate = await m.actualOrderOneWeightedStressCertificateFromProgram(source);
if (!certificate.pass || certificate.request.derivativeOrder !== 2) throw new Error('incomplete original order-two norm construction');
const snapshot = source.G.captureFunctionDefinitions();
const entries = source.terminal.terminalNorms.filter((row) => row.etaOrder === 0);
const pureNormals = entries.map((row) => ({
  order: row.deltaOrder, bound: row.bound, cornersAndFaces: Object.keys(row).sort(),
}));
if (pureNormals.map((row) => row.order).join(',') !== '0,1,2') throw new Error('missing pure terminal lower box derivative');
const exported = {
  nodes: source.program.nodes, snapshot, b: source.terminal.B, bBody: source.terminal.Bbody,
  delta: source.terminal.delta, Xdelta: source.terminal.Xdelta,
  sourceBinding: certificate.sourceBinding, terminalNorms: entries,
};
const privateGraph = JSON.stringify(exported);
await writeFile(graph, privateGraph, { flag: 'wx' });
const outputData = {
  status: 'VERIFIED_ORIGINAL_ORDER_TWO_TERMINAL_NORM_CONSTRUCTION',
  originalModuleSHA256: pin, request: certificate.request, graph: certificate.graph,
  finiteTerminalOrders: pureNormals, allMixedTerminalNorms: source.terminal.terminalNorms.length,
  bBody: exported.bBody, bNative: exported.b, delta: exported.delta,
  closurePrivateSHA256: sha(privateGraph), originalSource: certificate.sourceBinding,
  domain: certificate.domain, checks: certificate.checks, scope: certificate.scope,
};
await writeFile(output, JSON.stringify(outputData,null,2)+'\n', { flag: 'wx' });
console.log(outputData.status, pureNormals.map(({ order, bound }) => ({ order, bound })));
