import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';

const [repo, originalRepo=repo] = process.argv.slice(2);
assert.ok(repo);
const revision = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5';
const source = 'research-ide/mathscope-m2/navier/actual-residual-order-induction-norms.mjs';
const original = execFileSync('git', ['-C', originalRepo, 'show', revision+':'+source], { encoding: 'utf8' });
const patched = readFileSync(resolve(repo, source), 'utf8');
const extract = text => {
  const start = text.indexOf('function importPositiveProgram(');
  const end = text.indexOf('\nexport function attachActualInductionNorms', start);
  assert.ok(start >= 0 && end > start);
  const fail = (_code, message) => { throw new Error(message); };
  return runInNewContext('('+text.slice(start, end).trim()+')', { fail });
};
const recursive = extract(original);
const iterative = extract(patched);

function trace(importer, program, root) {
  const emitted = [];
  const graph = Object.fromEntries(
    ['q', 'parameter', 'add', 'mul', 'inv', 'pow', 'exp', 'log', 'sqrt', 'maximum'].map(
      op => [op, (...args) => {
        emitted.push([op, ...args]);
        return emitted.length-1;
      }]
    )
  );
  const value = importer(graph, program, root);
  return { value, emitted };
}

const leadingModule = 'research-ide/mathscope-m2/navier/actual-leading-all-order-jets.mjs';
const { actualLeadingAllOrderJets } = await import(pathToFileURL(resolve(repo, leadingModule)).href);
const actual = actualLeadingAllOrderJets({ radialOrder: 4, etaOrder: 6 });
assert.equal(actual.pass, true);
const exactRoots = [actual.bounds.U0.root, actual.bounds.F0inner.root, actual.bounds.F0active?.root]
  .filter(Number.isSafeInteger);
assert.ok(exactRoots.length >= 2);
for (const root of exactRoots) {
  assert.deepEqual(trace(iterative, actual.normProgram, root), trace(recursive, actual.normProgram, root));
}

const program = { nodes: [{ op: 'rational', args: ['1', '1'] }] };
for (let n = 1; n <= 25_000; n++) program.nodes.push({ op: 'add', args: [n-1, 0] });
const depth = program.nodes.length-1;
assert.throws(() => trace(recursive, program, depth), /Maximum call stack/);
const deep = trace(iterative, program, depth);
assert.equal(deep.value, depth);
assert.equal(deep.emitted.length, depth+1);
assert.deepEqual(deep.emitted.at(-1), ['add', depth-1, 0]);
assert.throws(() => trace(iterative, { nodes: [{ op: 'add', args: [0, 0] }] }, 0), /Invalid leading norm DAG operand/);
console.log(JSON.stringify({ actualLeadingRootsExactlyMatched: exactRoots, deepChain: depth, backEdgeRejected: true }));
