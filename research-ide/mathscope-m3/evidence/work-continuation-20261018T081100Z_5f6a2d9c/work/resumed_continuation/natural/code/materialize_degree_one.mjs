import fs from 'node:fs';
import {prepareActualNaturalCoreProgram} from '../../../../recovered/base/work/n602_continuation/source/research-ide/mathscope-m2/navier/actual-continuation-exact-core.mjs';

// Only the small original finite coefficient materializer is run, never the
// original global producer, finite cycle, or a substitute parameter profile.
const prepared = prepareActualNaturalCoreProgram({degree: 1});
const output = {
  schema: 'MathScope.ResumedNaturalActualDegreeOne/1',
  rootFields: prepared.rootFields,
  coefficients: prepared.coefficients,
  nodes: prepared.G.nodes,
  recurrence: prepared.program.recurrence,
  source: prepared.G.source,
  degree: 1,
  originalGlobalProducerExecuted: false,
};
fs.writeFileSync(new URL('../evidence/ACTUAL_DEGREE_ONE.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({degree: 1, nodeCount: output.nodes.length, coefficients: output.coefficients, rootFields: output.rootFields}));
