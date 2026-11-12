/** Coarse closed numerical upper endpoints for the original regular inner target. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {load, sha, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [tree, targetFile, fixedFile, historicalFile, thresholdsFile, out] = process.argv.slice(2);
assert(tree && targetFile && fixedFile && historicalFile && thresholdsFile && out);
const target = await load(targetFile, '3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770');
const fixed = await load(fixedFile, '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c');
const historical = await load(historicalFile, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
const thresholds = await load(thresholdsFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const navier = resolve(tree, 'research-ide/mathscope-m2/navier');
const program = await readFile(resolve(navier, 'actual-stress-direction-program.mjs'));
assert.equal(sha(program), 'b3567c39a9381ef16c3d94f0a24a88571a87dee7a61b9fe782d2076732b165f5');
const code = program.toString();
const core = await readFile(resolve(navier, 'actual-continuation-exact-core.mjs'));
assert.equal(sha(core), 'd657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815');
assert(core.toString().includes('average=u.map((x,k)=>G.div(x,G.q(k+1)))'));
for (const fragment of [
  'const v=G.add(o,G.mul(G.pow(radius,2),u)),s=G.div(end,G.sqrt(v))',
  'G.div(G.mul(ga(s),fn(s)),G.mul(v,G.sqrt(v)))',
  "Ka('inner_log_ratio',s,t=>natural(t).p1)",
  "Ka('inner_U_difference',s,t=>natural(t).Uy)",
  "integral('inner_exponential_divided_difference',t=>G.exp(G.mul(t,v)),z,o)",
  "Ka('inner_delta_'+name,y,s=>innerMomentDifferenceAlgebra",
  'innerStressDifferenceAlgebra(G,source',
  "G.natural('average',Y)",
  'const ga=s=>G.div(G.sub(o,kap0),G.add(flat(G.div(s,t1)),flat(G.sub(o,G.div(s,t1)))))',
  'const ea=s=>G.mul(G.sub(o,kap0),G.step(G.div(s,t1)))',
]) assert(code.includes(fragment), fragment);
const [{actualLeadingHighJetBounds}, {sourceAllOrderCutoffJets}] = await Promise.all([
  import(pathToFileURL(resolve(navier, 'actual-leading-high-jets.mjs')).href),
  import(pathToFileURL(resolve(navier, 'actual-residual-order-induction-kernels.mjs')).href),
]);
const source = actualLeadingHighJetBounds();
const step = sourceAllOrderCutoffJets({order: 12});
assert(source.pass && source.natural.pass && source.natural.order === 12 && source.hierarchy.pass && step.pass);
assert.equal(source.parameterExpressionSHA256, target.sourceParameterSHA256);
assert.equal(source.natural.commonQPower, 14);
assert(source.premodulation.QRows.some(x => x.id === 'natural-reciprocal-Phi' && x.pass));
assert.deepEqual(historical.definitions.kappa0, {ref: 't1'});
assert.deepEqual(historical.definitions.t1, {power: [{ref: 'CSelected'}, -120]});

// All fixed integers below are < CSelected since CSelected > Q^10000
// and Q >= 2^260 in the source hierarchy.
const Cmin = 1n << 2600000n;
const fac = [1n];
for (let k = 1; k <= 12; k++) fac.push(BigInt(k) * fac[k-1]);
const fixedCoefficient = x => assert(x > 0n && x < Cmin);
for (const coefficient of step.activation.ordinaryDerivativeBounds) fixedCoefficient(1n + BigInt(coefficient));
const flat = k => k === 0 ? 1n : 8n**BigInt(k)*(1n+fac[k]);
const inv = [9n];
for (let k = 1; k <= 12; k++) {
  let coefficient = 0n;
  for (let j = 1; j <= k; j++) coefficient += 2n*flat(j)*inv[k-j];
  inv.push(9n*coefficient);
  fixedCoefficient(fac[k]*inv[k]);
  fixedCoefficient(fac[k]*4n*flat(k));
}
// Real Taylor coefficients of the Ka kernel at u=y/t1. A coefficient of
// degree k carries at most (1+t)^k in the nonnegative Laplace variable.
const n = 10;
const seq = (...a) => Array.from({length: n+1}, (_, k) => BigInt(a[k] ?? 0));
const mul = (a, b) => seq(...a.map((_, k) => a.slice(0,k+1)
  .reduce((total, value, j) => total + value*b[k-j], 0n)));
const add = (a, b) => a.map((value, k) => value+b[k]);
const scale = (a, b) => a.map(value => value*b);
function compose(terms, arg) {
  assert.equal(arg[0], 0n);
  let powers = seq(1);
  let total = seq(0);
  for (const coefficient of terms) {
    total = add(total, scale(powers, coefficient));
    powers = mul(powers, arg);
  }
  return total;
}
const w = seq(0,1,1);
const inverseSqrt = compose(w.map(() => 1n), w);
const changeOfS = mul(seq(1,1), inverseSqrt);
changeOfS[0] = 0n;
const etaAndS = add(changeOfS, seq(0,1));
const weight = compose(w.map((_, k) => BigInt(k+1)), w);
const integrated = mul(compose(w.map((_, k) => BigInt(k+1)), etaAndS), weight);
for (let k = 0; k <= n; k++) {
  const moment = Array.from({length:k+1}, (_, j) => fac[k]/fac[k-j])
    .reduce((total, value) => total+value, 0n);
  // Use the larger integer bound (k+1) k! for the full moment.
  assert(moment <= BigInt(k+1)*fac[k]);
  fixedCoefficient(fac[k]*integrated[k]*BigInt(k+1)*fac[k]);
}
fixedCoefficient(fac[12] * 13n * 4n**13n * 169n**12n);

// Ledger entries bound every ordinary normalized mixed derivative through
// their displayed degree by C^power. Finite Leibniz factors cost one C.
const ledger = [];
function put(name, power, degree, rule, operands=[]) {
  const row = {name, power, degree, rule, operands: operands.map(a => a.name)};
  ledger.push(row);
  return row;
}
const atom = (name, power=1, degree=12) => put(name, power, degree, 'source bound');
const prod = (name, ...values) => put(name, 1+values.reduce((s, a) => s+a.power,0),
  Math.min(...values.map(a => a.degree)), 'Leibniz product', values);
const sum = (name, ...values) => put(name, 1+Math.max(...values.map(a => a.power)),
  Math.min(...values.map(a => a.degree)), 'absolute sum', values);
const derivative = (name, value) => put(name, value.power, value.degree-1, 'ordinary derivative', [value]);
const Ka = (name, value) => put(name, value.power+8, Math.min(value.degree,n),
  'normalized positive Laplace composition, including ga(s), ga(u)^-1 and t1 u^3/2', [value]);
const natural = atom('Phi, u and actual average log-radius derivatives', 1);
const geom = atom('X, X inverse, r, r inverse, L inverse, eta and d');
const small = atom('fixed coefficients 1,2,4,A,D,h,h-D,1-h');
const uStar = atom('actual Ustar and its eta jets');
const ga = atom('ga', 1);
const a = atom('ea and kappa', 1);
const g = atom('actual g on the Omega tube', 1);
const refF = prod('reference F', g, natural);
const refE = prod('reference E', geom, refF);
const refU = sum('reference U', natural, uStar);
const avg = sum('reference average', natural, uStar);
const W = sum('reference W', geom, prod('W average', small, geom, avg),
  prod('W eta average', geom, derivative('average eta',avg)));
const Uy = prod('reference Uy', small, derivative('natural u log derivative',natural));
const invPhi = put('inverse Phi', 13, 12, 'Phi >= 1/4 and finite Taylor inverse', [natural]);
const p1 = prod('reference p1', small, derivative('natural Phi log derivative',natural), invPhi);
const uOver = Ka('uOver', Uy);
const vOver = Ka('vOver', p1);
const v = prod('v', a, vOver);
// For values only, ga(s)/ga(u) <= 36 and u^3 <= 1/64. Thus
// |v| <= t1*C^p1 < 1, with the original t1 = C^-120.
assert(36n < 2n*64n && p1.power < 120);
const expDiv = put('exp divided difference', n*v.power+1, n,
  'bounded derivatives of integral_0^1 exp(tv) and finite composition, |v|<1', [v]);
const FOver = prod('FOver', refF, vOver, expDiv);
const EOver = prod('EOver', geom, FOver);
const energy = sum('E energy difference', prod('E linear',small,refE,EOver), prod('E quadratic',a,EOver,EOver));
const mixed = sum('E U difference', prod('E U first',refE,uOver), prod('E U second',refU,EOver),
  prod('E U quadratic',a,EOver,uOver));
const M = Ka('M difference',prod('M density',geom,uOver));
const I = Ka('I difference',prod('I density',geom,geom,EOver));
const J = Ka('J difference',prod('J density',geom,geom,mixed));
const S = Ka('S difference',prod('S density',geom,sum('S sum',prod('U linear',small,refU,uOver),
  prod('U quadratic',a,uOver,uOver),prod('S energy',small,energy))));
const Cp = Ka('Cp difference',prod('Cp density',small,energy));
const WO = prod('W over',geom,sum('W diff',prod('W M',small,geom,M),prod('W M eta',geom,derivative('M eta',M))));
const FW = sum('F W over',prod('F W first',refF,WO),prod('F W second',W,FOver),prod('F W quadratic',a,FOver,WO));
const WU = sum('W U over',prod('W U first',W,uOver),prod('W U second',refU,WO),prod('W U quadratic',a,WO,uOver));
const angular = sum('angular numerator',prod('I coeff',small,I),prod('I eta coeff',small,geom,derivative('I eta',I)),
  prod('J eta coeff',geom,derivative('J eta',J)),prod('J coeff',small,geom,J));
const axial = sum('axial numerator',prod('axial stock',geom,WU),
  prod('M coeff',small,sum('M and eta',M,prod('M eta coeff',geom,derivative('axial M eta',M)))),
  prod('S coeff',small,geom,S),prod('S eta coeff',geom,derivative('S eta',S)),
  prod('pressure contribution',geom,sum('pressure difference',prod('Cp coeff',small,geom,Cp),
    prod('Cp eta coeff',geom,derivative('Cp eta',Cp)))));
const theta = prod('regular inner theta',ga,sum('theta',prod('theta stock',geom,FW,geom),
  prod('theta moments',angular,small,geom,geom),prod('theta shear',p1,sum('shear diff',refF,prod('kappa FOver',a,FOver)))));
const axialFinal = prod('regular inner z',ga,sum('axial',prod('axial moments',axial,geom,geom),
  prod('axial shear',small,Uy,geom)));
assert(theta.degree >= 9 && axialFinal.degree >= 9);
const {N, evaluateClosedArithmeticDefinitions} = await sourceArithmetic(tree, thresholds.sourcePins, 'coarse-upper');
const p = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names:['CSelected']}).values;
const C = p.get('CSelected');
assert.equal(N.compareEndpoints(fixed.hostedOriginal[3612].upper,{rational:'1/128'}),-1);
// e^(t1/4) <= 1/(1-t1/4) gives Y <= 4*512/511 < 41/10.
assert(4n*512n*10n < 41n*511n);
const zero = {rational:'0'};
const rows = target.regions.inner.rows.map(row => {
  const derivativeOrder = row.orders[0]+row.orders[1]+2;
  const sourcePower = [theta.power, axialFinal.power][row.component];
  // dy = t1 du, so every ordinary derivative through this order costs
  // at most t1^-order. The four face volumes sum to <= 6.
  const power = sourcePower + 120*derivativeOrder;
  const upper = N.toClosed(N.mul(N.point('6'),N.add(N.one(),N.pow(C,power)))).upper;
  return {root: row.root, component: row.component, orders: row.orders, interval: {lower:zero,upper}, power};
});
assert.equal(rows.length,72);
assert.equal(new Set(rows.map(row=>row.root)).size,72);
const result = {
  status:'VERIFIED_ORIGINAL_72_INNER_TARGET_FTC_NUMERICAL_UPPER_ENDPOINTS',
  originalGraphSHA256:target.graph.uncompressedSHA256, actualInnerBodies:target.regions.inner.bodies,
  normalizedCoordinates:['y/t1','eta'], kernelDerivativeOrder:n, outputDerivativeOrder:9,
  maxComponentPower:[theta.power,axialFinal.power], ledger, rows, release:'HOLD',
};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS numerical upper endpoints for all 72 original inner target FTC roots');
