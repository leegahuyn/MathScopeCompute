import {execFile} from 'node:child_process';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {exportPostFiveDirectSplitClosure} from './export_direct_split_closure.mjs';

const run = promisify(execFile);
const here = relative => fileURLToPath(new URL(relative, import.meta.url));
const sourceModules = [
  ['../post-signed-20261023/source-postfive-full-3d-residual.mjs',
   'd93195ac381c75860e5d450a77ad3160ade16ca4579f4988dc38948e504163de'],
  ['../post-signed-20261023/source-postfive-direct-split.mjs',
   '2f0ae4c984026ac13661ba032ac40d79fc096e116abdb5c256b28fba4b829774'],
  ['source-harmonic-assembly.mjs',
   '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20'],
];

export async function verifyLivePostFiveSplit({navier, out, pde, split, currentReceipt}) {
  const referenceReceiptPath = here('./hosted-44528954587/first-cycle.json');
  const sourceFiles = sourceModules.map(([relative, sha256]) => ({
    name: relative.split('/').at(-1), file: resolve(navier, relative), sha256,
  }));
  const closure = await exportPostFiveDirectSplitClosure({
    G: pde.G, pde, split, currentReceipt, referenceReceiptPath, outDir: out, sourceFiles,
  });
  console.log(JSON.stringify({status: 'EXPORTED_ACTUAL_POST_FIVE_ARITHMETIC_CLOSURE',
    records: closure.records, opaqueRecords: closure.opaqueRecords, sha256: closure.closureSHA256}));
  // The Python reduction treats every non-arithmetic source operand as an
  // opaque leaf identified by its original node ID.
  try {
    const {stdout, stderr} = await run('python3', [
      '-B', here('./verify_direct_split_closure.py'),
      '--closure', join(out, 'direct-split-arithmetic-closure.json'),
      '--manifest', join(out, 'direct-split-arithmetic-manifest.json'),
      '--receipt', referenceReceiptPath,
      '--exact-module', here('../../first-force-repair/verify_repaired_first_force.py'),
      '--out', join(out, 'independent-direct-split.json'),
      ...sourceFiles.flatMap(({name, file}) => ['--source-file', `${name}=${file}`]),
    ], {env: {...process.env, PYTHONINTMAXSTRDIGITS: '0'}});
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } catch (error) {
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    throw error;
  }
}
