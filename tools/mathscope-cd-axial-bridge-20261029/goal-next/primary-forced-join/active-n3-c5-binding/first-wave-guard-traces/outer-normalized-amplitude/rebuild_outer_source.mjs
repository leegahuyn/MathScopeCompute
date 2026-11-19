import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, output, privateGraphPath] = process.argv.slice(2);
if (!runtime || !output || !privateGraphPath) throw new Error('runtime, new receipt and private graph are required');
const folder = resolve(runtime, 'research-ide/mathscope-m2/navier');
const sha = (x) => createHash('sha256').update(x).digest('hex');
const pins = {
  'actual-stress-direction-bounds.mjs': '42a3870cb4cc177333d7fa5ae32be988b2fb43c00fe1cb89c8ee614f70ff23f4',
  'actual-stress-direction-program.mjs': 'b3567c39a9381ef16c3d94f0a24a88571a87dee7a61b9fe782d2076732b165f5',
  'actual-covariance-sensitivity.mjs': 'f27ed95c3a1e40a4dfa4a38340d170aa92c7ec6102b277c952e1dc2dc91ac27c',
  'actual-residual-order-induction-source.mjs': '30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'actual-continuation-exact-support.mjs': '0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
  'actual-covariance-uniform.mjs': '93d714749420aff4d5fbb4ab4db2b373fd5ff447fc70202e6ba0b9b11f6670ad',
  'actual-covariance-ell-one-obstruction.mjs': '305fb60d757d6e4b1963bb6be73a73e25ab14c04c6a6a23aaa74b99ee48eb96f',
  'actual-outer-covariance-flat-extension.mjs': 'd0a991f5e789aae7aa35dd8c18b9a82d9be40b8f31955ce9f166b108aef00c0c',
};
for (const [file, expected] of Object.entries(pins)) assert.equal(sha(await readFile(resolve(folder,file))), expected, file);
const importSource = (name) => import(pathToFileURL(resolve(folder,name)));
const modules = await Promise.all(Object.keys(pins).map(importSource));
const [direction,, sensitivity, induction, support, cone, identity, outer] = modules;
const parameters = 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152';

const original = induction.prepareActualOrderInduction({ order: 1, maxNodes: 2000000 });
const { G, bootstrap } = original;
const { X, eta } = bootstrap.constants;
const { A, D } = G.core;
const h = G.parameter('h');
const target = sensitivity.actualLeadingTargetOnSensitivityGraph(G, {
  background: { prepared: original }, chart: { X, eta, s: G.one }, constants: { A, D, h },
});
assert.equal(original.program.parameterExpressionSHA256, parameters);
assert.ok(target.originalCompletedSourceRetained && target.actualHeatPreparedPressureRetained && target.bothShearTermsRetained);
const rawDefs = target.raw.map(id => {
  const call = G.nodes[id];
  assert.deepEqual(call.args.slice(1), [[X,eta],[0,0]]);
  return G.expressionSystems[call.args[0]];
});
const shell = support.actualSupportOrderProof(bootstrap.completedOrderOne);
assert.ok(shell.pass);
assert.equal(shell.endpoints.Xplus, 28824);
assert.equal(shell.endpoints.Xb, 28826);
const T = bootstrap.actualHeat.heat;
assert.equal(T.Xb, 28826);
const B = bootstrap.G;
const equals = (a,b) => identity.ellOneSourceScalarIdentity(B,a,b).pass;
const terminal = B.outer.stages.at(-1);
assert.equal(terminal.id,'terminal');
assert.ok(equals(terminal.end,B.add(terminal.start,B.q(3))));
assert.ok(equals(T.Xtail,B.mul(B.parameter('XR'),B.exp(terminal.start))));
assert.ok(equals(T.Xb,B.mul(B.parameter('XR'),B.exp(terminal.end))));
assert.equal(sha(JSON.stringify(G.nodes.slice(0,117100))), 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116');

const bounds = direction.actualStressDirectionBounds();
assert.ok(bounds.pass && bounds.outer.pass && bounds.ratio.pass);
assert.equal(bounds.parameterExpressionSHA256, parameters);
assert.equal(bounds.program.parameterExpressionSHA256, parameters);
assert.equal(bounds.outer.factorCoefficientLower, 'C^-10');
assert.equal(bounds.program.exactFactorization.outer, 'T0=exp(-4/delta^2)*delta^-3*(outerTheta,delta^6*outerZ)');
const factor = outer.copyOuterFactorProgram(B,bounds.program,B.fresh('c88_outer_delta'),eta);
assert.ok(equals(factor.roots.Xb,T.Xb));
assert.ok(equals(factor.roots.EpowB,B.mul(B.parameter('Pstar'),B.exp(B.outer.stages.at(-1).logAEnd))));
const robust = cone.covarianceConePolynomialAudit();
assert.ok(robust.pass);
assert.equal(robust.frozenTargetSlopeUpper, '1-(1/16)*kappa');
assert.deepEqual(robust.positiveInverseBounds, ['kappa/64','2']);
const privateData = JSON.stringify({
  targetNodes: G.nodes, targetDefinitions: G.expressionSystems, raw: rawDefs,
  factorNodes: bounds.program.nodes, factorRoots: bounds.program.roots,
});
await writeFile(privateGraphPath, privateData, { flag: 'wx' });
const result = {
  status: 'EXECUTED_ORIGINAL_TARGET_OUTER_FACTOR_AND_CONE_SOURCE',
  privateGraphSHA256: sha(privateData), sourcePins: pins, parameters,
  target: { count: G.nodes.length, X, eta, originalLeadingF: target.F, originalLeadingU: target.U,
    originalLeadingM: target.M, originalPressure: target.Pi, rawBodies: rawDefs.map(x=>x.body), rawOperators: target.terms },
  originalOuterFactor: {
    nodeCount: bounds.program.nodes.length,
    roots: Object.fromEntries(['outerLogDistance','eta','Xb','EpowB','rho','outerTheta','outerZ','outerScaledZ'].map(k=>[k,bounds.program.roots[k]])),
    formula: bounds.program.exactFactorization.outer, limits: bounds.program.domains.outer,
    proofPremises: bounds.program.exactSupport.outer,
    preservedTerms: bounds.program.preservedTerms,
    kernelInventory: bounds.program.outerKernels.map(({name,root,m})=>({name,root,m})),
    endpointSeparation: { Xplus: shell.endpoints.Xplus, Xb: shell.endpoints.Xb, heatTailStart: T.Xtail,
      proof: 'Xplus=e*Xv, Xb>exp(128)*Xv, Xb=exp(3)*Xtail, so delta<=1/2 is after Xplus with heat cutoff saturated.' },
    sameOriginalTerminalEndpointAndHeight: true,
    thetaCoefficientLower: bounds.outer.factorCoefficientLower,
    sourceScaleRatio: bounds.ratio.resultingRatioVariationUpper,
    sourceProjectionProof: bounds.ratio.checks.find(row=>row.id==='same-cover-box-retains-negative-projection'),
  },
  exactCone: { parameters: robust.parameters, rows: robust.proofs.map(row=>({id:row.id,pass:row.pass})),
    inverseBounds: robust.positiveInverseBounds, ratio: robust.frozenTargetSlopeUpper },
  finalJets: 0, release:'HOLD',
};
await writeFile(output, JSON.stringify(result,null,2)+'\n', { flag: 'wx' });
console.log(result.status, result.target.count, result.originalOuterFactor.nodeCount);
