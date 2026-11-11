import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { strict as assert } from 'node:assert';

const [repo, out] = process.argv.slice(2);
const imp = path => import(pathToFileURL(resolve(repo,path)));
const { createReleaseLab } = await imp('research-ide/mathscope-m4/release-lab/runtime.mjs');
const { readCatalog, nativeWorkerFactory } = await imp('research-ide/mathscope-m4/release-lab/verify-fixtures.mjs');
const { createM1Engine } = await imp('research-ide/mathscope-m1/core/engine.mjs');
const { createM2Engine } = await imp('research-ide/mathscope-m2/core/engine.mjs');
const { normalizeRequest: M1 } = await imp('research-ide/mathscope-m1/core/registry.mjs');
const { normalizeRequest: M2 } = await imp('research-ide/mathscope-m2/core/registry.mjs');
const { getExamples } = await imp('research-ide/mathscope-m2/navier/index.mjs');
const catalog = await readCatalog();
const actual = getExamples().find(e => e.request.kind === 'ns.actual-background');
const fixtures = [...catalog.fixtures.filter(e => ['prism','delta'].includes(e.id)), {
  ...catalog.fixtures.find(e => e.id === 'axis'), id: 'ns-coefficient', engine: 'M2',
  request: actual.request, claimId: 'R1-03/N4-03',
}];
const delta2 = structuredClone(fixtures.find(fixture => fixture.id === 'delta'));
delta2.id = 'delta2';
delta2.request.input.family.delta = 2;
delta2.request.input.probe = [0.1,-0.15,0.2,0.05];
fixtures.push(delta2);
const lab = createReleaseLab({catalog: fixtures, factories: {
  M1: () => createM1Engine({workerFactory:nativeWorkerFactory}),
  M2: () => createM2Engine({workerFactory:nativeWorkerFactory}),
}, normalizers:{ M1, M2 }});
try {
 for (const {id} of fixtures) {
  const job = await lab.run(id);
  console.log(id, job.state, job.elapsedMs, job.result && Object.keys(job.result).join(','));
  await writeFile(resolve(out,id+'.json'),JSON.stringify(job,null,2)+'\n');
 }
} finally {
 lab.dispose();
}
