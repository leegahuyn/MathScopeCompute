/** Isolate the original monotone kernel and the physical ingress countercontrol. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const research = process.argv[2];
assert(research, 'Supply pinned original research-ide directory');
const kernel = 'mathscope-m2/navier/actual-continuation-exact-functions.mjs';
const identities = 'mathscope-m2/navier/actual-continuation-exact-identities.mjs';
const pins = {
  [kernel]: '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  [identities]: 'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712',
  'mathscope-m3/navier/source-global-band.mjs': 'a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b',
};
for (const [name, pin] of Object.entries(pins)) {
  const body = await readFile(resolve(research, name));
  assert.equal(createHash('sha256').update(body).digest('hex'), pin, name);
}
const {ActualConvergentExpressions} = await import(pathToFileURL(resolve(research, kernel)).href);
const G = new ActualConvergentExpressions();
const Z = G.fresh('axial_countercontrol');
const T = G.fresh('time_countercontrol');
const s = G.fresh('implicit_countercontrol');
const h = G.parameter('h');
const half = G.q(1, 2);
const two = G.q(2);
const D = G.sub(half, h);
const power = (x, a) => G.exp(G.mul(a, G.log(x)));
const F = G.sub(G.sub(s, G.mul(G.pow(Z, 2), power(s, G.mul(two, h)))), T);
const system = G.defineMonotoneSystem({name:'ActualCommonBandSlowInverse', variable:s, parameters:[Z,T],
  body:F, left:half, right:two, derivativeLower:half, derivativeUpper:G.one,
  endpointProof:'Pinned source chart check', numericOracle:false});
const substitute = (expr, zs, ts) =>
  G.simultaneousSubstitute(expr, [Z, T, s], [zs, ts, G.one]);
const chart = (zs, ts) => {
  const root = G.monotoneRoot(system, [zs,ts]);
  assert.deepEqual(G.nodes[root], {op:'actual_monotone_root', args:[system,zs,ts]});
  const eta = G.div(zs, power(root, D));
  assert.equal(substitute(F,zs,ts),G.zero);
  const etaAtOne = G.substitute(eta,root,G.one);
  assert.equal(etaAtOne,zs);
  return {root, eta, residualAtOne: substitute(F,zs,ts),
    rawEtaAtCertifiedRoot:G.nodes[etaAtOne].args};
};
const positiveBoundary = chart(G.one, G.zero);
const negativeBoundary = chart(G.q(-1), G.zero);
const inadmissible = chart(G.q(5,4), G.q(-9,16));
assert.deepEqual(inadmissible.rawEtaAtCertifiedRoot,['5','4']);
const inward = G.monotoneRootPartial(system,1,[G.one,G.zero]);
const givenRoot = G.substitute(inward,positiveBoundary.root,G.one);
const expectedRootSlope = G.inv(G.sub(G.one,G.mul(two,h)));
const algebra = await import(pathToFileURL(resolve(research, identities)).href);
assert(algebra.sourceGraphRationalIdentity(G,G.sub(givenRoot,expectedRootSlope),{atomicNodes:[h]}).pass);
assert.deepEqual(positiveBoundary.rawEtaAtCertifiedRoot,['1','1']);
assert.deepEqual(negativeBoundary.rawEtaAtCertifiedRoot,['-1','1']);

console.log(JSON.stringify({
  sourcePins:pins, originalFormula:'s-Z^2*s^(2h)-T', nonproductionReplay:true,
  zeroTimeAtBothEtaEndpoints:[positiveBoundary,negativeBoundary],
  physicallyExcluded:{...inadmissible,T:'-9/16',eta:'5/4',
    conditionalAnalyticBracket:'for 0<h<1/16, derivative on [1/2,2] > 39/64 and F(1)=0',
    originalMonotoneNodeAllowsStructure:true, originalChartAdmitsPhysicalPoint:false},
  activeTimeDerivativeDefinitionAtS1:G.nodes[givenRoot], activeTimeDerivativeMatches:true,
  finalJets:0, release:'HOLD',
},null,2));
