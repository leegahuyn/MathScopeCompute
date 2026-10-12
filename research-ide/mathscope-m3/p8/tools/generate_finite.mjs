/** Filesystem wrapper; the browser-facing finite-certificates module remains pure. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeFiniteCertificate,exportLeanCertificate} from '../finite-certificates.mjs';

const base=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=path.join(base,'lean/MathScope/P8/Generated.lean');
const fixture=path.join(base,'lean/finite-input.json');
const record=makeFiniteCertificate(),expectedSource=exportLeanCertificate(record),expectedFixture=JSON.stringify(record,null,2)+'\n';
if(process.argv[2]==='--write') {
  await fs.mkdir(path.dirname(source),{recursive:true});await fs.writeFile(source,expectedSource);await fs.writeFile(fixture,expectedFixture);
  console.log('Exported finite input and Lean source; Lean has not been run.');
} else if(process.argv[2]==='--check') {
  if(await fs.readFile(source,'utf8')!==expectedSource||await fs.readFile(fixture,'utf8')!==expectedFixture)throw new Error('Generated source or exact input differs from deterministic export.');
  console.log('Deterministic finite source/input match. Lean has not been run by this check.');
} else throw new Error('Use --write or --check.');
