import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, registry, priorPath, output] = process.argv.slice(2);
assert(output, 'ORIGINAL_NAVIER_DIR ORIGINAL_FUNCTION_REGISTRY C90_CORE_OPERANDS NEW_JSON');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const priorBytes = await readFile(priorPath);
const priorSHA256 = sha(priorBytes);
assert.equal(priorSHA256, 'c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d');
const prior = JSON.parse(priorBytes);
for (const [file, expected] of Object.entries(prior.sourcePins))
  assert.equal(sha(await readFile(resolve(runtime, file))), expected, file);
const rawRegistry = await readFile(registry);
assert.equal(sha(rawRegistry), prior.registrySHA256);
const originalSystems = JSON.parse(JSON.parse(rawRegistry).base.picard);
const source = await import(pathToFileURL(resolve(runtime,'actual-residual-order-induction-source.mjs')));
const live = source.prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(source.assertActualOrderInduction(live));
const {G, records, bootstrap} = live;
const {X:formalX, eta} = bootstrap.constants;
assert.deepEqual(G.picardSystems, originalSystems.slice(0,2));
assert.equal(G.nodes.length,prior.originalPrefixNodes);
assert.equal(sha(JSON.stringify(G.nodes)),prior.originalPrefixSHA256);
assert.equal(G.source.parameterExpressionSHA256,prior.parameterExpressionSHA256);

const z = G.zero, o = G.one, {A, j0:j, Lambda} = G.core;
assert.equal(G.substitute(G.core.Ustar,eta,z),j);
const axisExpected = G.mul(G.q(4),A,j);
const {auxiliary:norm} = records[1].norm;
const a = G.sqrt(norm.radialDomain), C = norm.C, s = norm.strip;
const B = G.q(1048576);
const xi = G.div(G.mul(a,j,G.pow(s,2)),G.mul(G.add(o,a),B,G.pow(G.add(o,C),3)));
const X = G.pow(xi,2), Y = G.mul(Lambda,X);
assert.deepEqual({a,C,s,xi,X,Y},{a:prior.ids.a,C:prior.ids.C,s:prior.ids.s,xi:prior.ids.xi,X:prior.ids.X,Y:prior.ids.Y});
const etaWidth = G.div(G.mul(s,j),G.mul(B,G.add(o,C)));
const xiSmall = G.mul(s,xi), XSmall = G.pow(xiSmall,2), YSmall = G.mul(Lambda,XSmall);
const fortyEight = G.q(48), twelve = G.q(12);
const ids = [z,o,A,j,Lambda,a,C,s,B,xi,X,Y,etaWidth,xiSmall,XSmall,YSmall,fortyEight,twelve,axisExpected];
const rows = [];
for (const kind of ['raw','auxiliary']) {
  const original = prior.rows.find((row) => row.kind===kind);
  const record = records[1][kind];
  const sys = G.picardSystems[record.system];
  assert.equal(record.U,original.formalU);
  assert.equal(sys.forcing[5],original.f5);
  const axisParam = G.substitute(sys.forcing[5],sys.xi,z);
  const valueAxis = G.substitute(axisParam,eta,z);
  const etaAxis = G.derivativeAt(axisParam,eta,z);
  const etaAxisFullDerivative = G.substitute(G.derivative(axisParam,eta),eta,z);
  const dX = G.derivative(record.U,formalX), dEta = G.derivative(record.U,eta);
  const at = (body,x,e) => G.simultaneousSubstitute(body,[formalX,eta],[x,e]);
  const radialAtC90 = at(dX,X,z);
  const radialAtEtaEdge = at(dX,X,etaWidth);
  const etaAtSmall = at(dEta,XSmall,z);
  assert.equal(radialAtC90,G.picardEven(record.system,1,X,z,1,0));
  assert.equal(radialAtEtaEdge,G.picardEven(record.system,1,X,etaWidth,1,0));
  assert.equal(etaAtSmall,G.picardEven(record.system,1,XSmall,z,0,1));
  const originalAxisSlope = G.mul(G.q(1,4),etaAxis);
  ids.push(record.U,valueAxis,etaAxis,etaAxisFullDerivative,originalAxisSlope,dX,dEta,
    radialAtC90,radialAtEtaEdge,etaAtSmall);
  rows.push({
    kind,system:record.system,originalEvenProfile:record.U,originalForcing:sys.forcing[5],
    xiFormal:sys.xi,etaFormal:sys.eta,axisParam,valueAxis,etaAxis,etaAxisFullDerivative,
    scaledEtaSlopeAtAxis:originalAxisSlope,
    formal:{dX,dEta},calls:{radialAtC90,radialAtEtaEdge,etaAtSmall},
    originalCore:records[1].coreAgreement.domain,
  });
}
const stop = new Set([a,C,s]);
const reached = new Set();
while (ids.length) {
  const id = ids.pop();
  if (reached.has(id)) continue;
  reached.add(id);
  const {op,args} = G.nodes[id];
  if (stop.has(id)||['rational','source_parameter','coordinate'].includes(op)) continue;
  if (op==='integer_power') ids.push(args[0]);
  else if (['add','multiply','inverse','exp','log_positive','sqrt_positive','ceiling','maximum'].includes(op))
    ids.push(...args);
  else if (op==='actual_background_even_profile') ids.push(...args.slice(2,4));
  else throw Error(['Unexpected axis or coordinate node',id,op,JSON.stringify(args)].join(' '));
}
const result = {
  schema:'MathScope.C91.OriginalN1NativeCoreDerivativeOperands/1',
  priorSHA256,registrySHA256:prior.registrySHA256,sourcePrefixSHA256:prior.originalPrefixSHA256,
  profileSHA256:prior.parameterExpressionSHA256,originalSystemsBound:true,
  ids:{zero:z,one:o,A,j,Lambda,a,C,s,B,xi,X,Y,etaWidth,xiSmall,XSmall,YSmall,fortyEight,twelve,axisExpected},
  rows,nodes:[...reached].sort((a,b)=>a-b).map((id)=>[id,G.nodes[id]]),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
for (const row of rows) console.log(JSON.stringify(row));
