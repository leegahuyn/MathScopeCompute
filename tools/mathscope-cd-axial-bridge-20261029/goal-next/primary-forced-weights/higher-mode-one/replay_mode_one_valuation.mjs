/** Exact signed algebra and weighted derivative ledger for original mode one. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [goal, runtime, out, regularOutput] = process.argv.slice(2);
assert([5, 6].includes(process.argv.length), 'Use GOAL_NEXT, ORIGINAL_RUNTIME, OUTPUT, [REGULAR_C2_OUTPUT].');
if (regularOutput) assert.notEqual(resolve(out), resolve(regularOutput));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function load(root, file, pin) {
  const bytes = await readFile(resolve(root, file));
  assert.equal(sha(bytes), pin, file);
  return bytes.toString();
}
const evidence = {
  raw: ['g0-supported/actual-g0-order.json', '14cee96f2b9f0d47114041c9dd2989da0cc7a4012521f350a5961248a3a352a5'],
  path: ['g0-supported/mean-hw-binding.json', 'c44a1d3cce45033868d33476d70e206a755c32a29999d64a30ffb44411c4dba7'],
  half: ['first-force-repair/independent-primary-half-amplitude.json', 'f1f6454d74fb6423361802fddad6ac0be70f8824c7f4e1107f5d3afc1b7d8b46'],
  mean: ['whole-k-annular-pressure-lower/mean-path-longitudinal.json', 'e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59'],
  meanWeight: ['primary-forced-weights/weighted-stage-zero-valuation.json', '240a21bc2a0886b4f21ead841a5baf949bf68bd6f71cf05fbbefb474bfab6ce8'],
  primary: ['whole-k-primary-potential-c3/initialized-primary-potential-c3.json', '6c3a65a40767e74e2093ddc6869e33fe024f154eb60a1b77a22ac365b4c6140d'],
  uncut: ['primary-force-transfer/hosted-uncut-amplitude.json', '14fc3bfb53e7528297a773b3a15bb9874585501c853ffaae29b6c4e3bbcc1165'],
  live: ['primary-forced-join/hosted-43219432398/native-receipt.json', '20bb095d62f467628ba63713a4e13d6a0fd95f6ac5687276a3f918f69186ce2b'],
};
const filePins = {
  harmonic: ['mathscope-m3/navier/source-harmonic-assembly.mjs', '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20'],
  initialized: ['mathscope-m3/navier/source-initialized-angular.mjs', '3e4f32a554e8e2ceccd3e003aa220c2f191c23b98cceb3b07f1f2d81e4bf2f1d'],
  band: ['mathscope-m3/navier/source-global-band.mjs', 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'],
  pressure: ['mathscope-m3/navier/source-global-angular.mjs', '4e9c3ea67b124a953856f83d0aca0dcfec4b01a245043424de2bb035b8d902ca'],
  cover: ['mathscope-m3/navier/source-global-pressure.mjs', 'fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d'],
  partition: ['mathscope-m2/navier/actual-covariance-source-certificate.mjs', 'c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681'],
  frame: ['mathscope-m2/navier/actual-covariance-matrix.mjs', '7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26'],
  curl: ['mathscope-m2/navier/actual-full-curl.mjs', '4276a850dbff4b5c357c47e1827eb7785b19c7e7c395c94ee4f22ef0c96d58d2'],
};
const readAll = (pins, root, convert) => Promise.all(Object.entries(pins).map(async ([key, [file, pin]]) =>
  [key, convert(await load(root, file, pin))])).then(Object.fromEntries);
const [{raw, path, half, mean, meanWeight, primary, uncut, live}, src] = await Promise.all([
  readAll(evidence, goal, JSON.parse), readAll(filePins, resolve(runtime, 'research-ide'), x => x),
]);
const expect = (key, ...strings) => strings.forEach(s => assert(src[key].includes(s), `${key}: ${s}`));
expect('harmonic', 'T=a.map(x=>b.map(y=>S.mul(x,y)))', 'S.add(Dr(row[0]),S.scale(invR,row[0]),angular(row[1]),Dz(row[2]))',
  'S.sub(out[0],S.scale(invR,T[1][1]))', 'S.add(out[1],S.scale(invR,T[0][1]))',
  'C.imaginary(G.mul(k,G.q(m),phaseDerivative),x)', 'G.mul(q(2),invR2),thetaDerivative(U[1])');
expect('initialized', 'completeMeanVelocity=background.map((x,j)=>G.add(x,meanVelocity[j]))',
  'G.mul(power(ratio,G.neg(A)),G.expressionValue(id,referenceValues))',
  'G.mul(G.q(1,2),dpsi,x)', 'subtractVectorRows(G,waveResidual,primaryFlatResidual)',
  'operators.L(v),G.zero', 'operators.N(xi),G.zero', 'commonToPulseScale:factor,Hw',
  'ratio=G.exp(G.mul(G.sub(ell,ellReference),G.log(G.q(2))))');
expect('band', 'phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,phaseSpeed))',
  'fullEikonalRemainder=G.add(G.mul(fields.b,frame.n[0]),G.mul(epsilon,v,G.sub(HT,G.mul(fields.G,HZ))))',
  'b:G.mul(epsilon,power(s,q(-1,2)))');
expect('frame', 'const K=[[G.zero,G.neg(G.mul(q(2),F)),G.zero]',
  'pressureImaginaryRow:pressureNumerator.map(x=>G.div(x,G.mul(k,n2)))',
  'n^T*A_phi+n_prime^T=0', 'w_prime=[Bleft*(Aphi*B-Bprime)-lambda*I-(d-dref)*I]*w; z=P*w');
expect('pressure', 'value:{real:G.zero,imaginary}', 't_prime+K*t+d*t+i*k*n*pi=0 before the scalar cutoff');
expect('cover', 'baseEll=G.sub(ell,q(2)),baseIndex=paletteIndex(baseEll)', 'delta=G.sub(i,baseIndex)');
expect('partition', 'const bands=[-1,0,1].map(relativeBand=>', 'ell=G.add(nearestBand,q(relativeBand))');
expect('curl', 'MathScope.M2.Navier.full_cylindrical_curl_divergence', 'D_r u_r+u_r/R+D_z u_z+i*k*n dot u');
assert.equal(raw.graphSHA256, path.sourceSHA256);
assert.equal(raw.registrySHA256, path.registrySHA256);
assert.equal(path.componentCount, 120);
assert.equal(raw.cases.length, 10);
assert.equal(path.paths.filter(row => row.mode === 1).length, 10);
assert.equal(mean.sourceSHA256, primary.sourceSHA256);
assert.equal(meanWeight.source.oldGraph, mean.sourceSHA256);
assert.equal(live.same_family_join.actualInputForcingWClassCertified, false);
const archived = raw.cases.map(row => {
  const parts = row.rawComponents.filter(x => x.mode === 1);
  assert.equal(parts.length, 6);
  assert(parts.every(x => x.nativeDemand.wave === 2 && x.nativeDemand.mean === 1));
  assert(parts.every(x => x.secondDerivativeCoefficients.RR === '-epsilon' && x.secondDerivativeCoefficients.ZZ === '-epsilon^3'));
  const pathRow = path.paths.find(x => x.mode === 1 && x.chart === row.key);
  assert(pathRow);
  return {key: row.key, phase: row.phase, waveSystems: row.waveSystems, angularPressure: row.angularPressureSystem,
    parts: parts.map(({component, part, raw, supported}) => ({component, part, raw, supported})), path: pathRow};
});

const axes = ['R', 'Z', 'T', 'xi', 'v'];
const z = () => new Map();
function put(table, key, r, i) {
  const [x, y] = table.get(key) ?? [0n, 0n];
  const pair = [r + x, i + y];
  if (pair.every(v => v === 0n)) table.delete(key);
  else table.set(key, pair);
}
const c = (r, i = 0) => new Map([["", [BigInt(r), BigInt(i)]]].filter(([, pair]) => pair.some(x => x !== 0n)));
const varOf = key => new Map([[key, [1n, 0n]]]);
const jet = name => varOf(`${name}@00000`);
const add = (...rows) => {
  const out = z();
  for (const row of rows) for (const [key, [r, i]] of row) put(out, key, r, i);
  return out;
};
const factors = key => key ? key.split('*') : [];
function monomial(xs) {
  let radial = 0;
  const ordinary = [];
  for (const x of xs) {
    if (x === 'R') radial++;
    else if (/^iR\d+$/.test(x)) radial -= Number(x.slice(2));
    else ordinary.push(x);
  }
  if (radial < 0) ordinary.push(`iR${-radial}`);
  for (let j = 0; j < radial; j++) ordinary.push('R');
  return ordinary.sort().join('*');
}
function multiply(a, b) {
  const out = z();
  for (const [u, [x, y]] of a) for (const [v, [r, i]] of b) {
    put(out, monomial([...factors(u), ...factors(v)]), x * r - y * i, x * i + y * r);
  }
  return out;
}
const mul = (...rows) => rows.reduce(multiply, c(1));
const neg = a => mul(c(-1), a);
const sub = (a, b) => add(a, neg(b));
const Re = a => new Map([...a].filter(([, [r]]) => r).map(([key, [r]]) => [key, [r, 0n]]));
const Im = a => new Map([...a].filter(([, [, i]]) => i).map(([key, [, i]]) => [key, [i, 0n]]));
function dAtom(key, j) {
  if (key.includes('@')) {
    const [family, order] = key.split('@');
    if (['F', 'G', 'B'].includes(family) && j > 2 || family === 'a' && j !== 0) return z();
    const counts = [...order].map(Number);
    counts[j]++;
    return varOf(`${family}@${counts.join('')}`);
  }
  if (key === 'R' && j === 0 || key === 'v' && j === 4) return c(1);
  if (/^iR\d+$/.test(key) && j === 0) {
    const k = Number(key.slice(2));
    return mul(c(-k), varOf(`iR${k + 1}`));
  }
  return z();
}
function partial(a, j) {
  const out = [];
  for (const [key, [r, i]] of a) {
    const xs = factors(key);
    for (let at = 0; at < xs.length; at++) {
      out.push(mul(c(r, i), dAtom(xs[at], j), ...xs.filter((_, k) => k !== at).map(varOf)));
    }
  }
  return add(...out);
}
const [R, v, ir, eps, k, p, pz, x0] = ['R', 'v', 'iR1', 'eps', 'k', 'p', 'pz', 'x0'].map(varOf);
const [a, F, G, B, P] = ['a', 'F', 'G', 'B', 'P'].map(jet);
const L = [0, 1, 2].map(j => jet(`L${j}`));
const J = [0, 1, 2].map(j => jet(`J${j}`));
const M = [0, 1, 2].map(j => jet(`M${j}`));
const U = L.map((x, j) => add(x, mul(c(0, 1), J[j])));
const b = mul(eps, B);
const background = [b, mul(R, F), G];
const H = add(mul(p, F), mul(pz, G));
const n = [sub(x0, mul(v, partial(H, 0))), mul(p, ir), sub(pz, mul(eps, v, partial(H, 1)))];
const phaseTime = sub(mul(eps, v, partial(H, 2)), H);
const d = mul(eps, k, k, add(...n.map(x => mul(x, x))));
const Dr = x => add(partial(x, 0), mul(a, partial(x, 3)));
const Dz = x => mul(eps, partial(x, 1));
const time = x => sub(partial(x, 4), mul(eps, partial(x, 2)));
const phase = (j, x) => mul(c(0, 1), k, n[j], x);
const Rphase = x => add(Dr(x), phase(0, x));
const Zphase = x => add(Dz(x), phase(2, x));
const theta = x => mul(c(0, 1), k, p, x);
const dot = (a, b) => add(...a.map((x, j) => mul(x, b[j])));
const K = [[z(), mul(c(-2), F), z()], [add(mul(c(2), F), mul(R, partial(F, 0))), z(), z()], [partial(G, 0), z(), z()]];
const divU = add(Rphase(U[0]), mul(ir, U[0]), phase(1, U[1]), Zphase(U[2]));
const divBackground = add(Dr(background[0]), mul(ir, background[0]), Dz(background[2]));
function tensor(a, b) {
  const T = a.map(x => b.map(y => mul(x, y)));
  const ret = T.map(row => add(Rphase(row[0]), mul(ir, row[0]), phase(1, row[1]), Zphase(row[2])));
  ret[0] = sub(ret[0], mul(ir, T[1][1]));
  ret[1] = add(ret[1], mul(ir, T[0][1]));
  return ret;
}
const cross = X => tensor(X, U).map((x, j) => add(x, tensor(U, X)[j]));
const meanWave = cross(M);
const oldWave = cross(background);
const gradient = [Rphase(mul(c(0, 1), P)), phase(1, mul(c(0, 1), P)), Zphase(mul(c(0, 1), P))];
const connectionLap = [sub(neg(mul(ir, ir, U[0])), mul(c(2), ir, ir, theta(U[1]))),
  add(neg(mul(ir, ir, U[1])), mul(c(2), ir, ir, theta(U[0]))), z()];
const lap = U.map((x, j) => add(Rphase(Rphase(x)), mul(ir, Rphase(x)), Zphase(Zphase(x)), phase(1, phase(1, x)), connectionLap[j]));
const rawMinusCut = U.map((x, j) => add(time(x), mul(c(0, 1), k, phaseTime, x), neg(mul(eps, lap[j])),
  gradient[j], oldWave[j], meanWave[j], neg(jet(`Cut${j}`))));
const viscRemainder = U.map((x, j) => add(Dr(Dr(x)), Dz(Dz(x)), mul(ir, Dr(x)), connectionLap[j],
  mul(c(0, 1), k, Dr(n[0]), x), mul(c(0, 2), k, n[0], Dr(x)),
  mul(c(0, 1), k, Dz(n[2]), x), mul(c(0, 2), k, n[2], Dz(x)), mul(c(0, 1), k, ir, n[0], x)));
const eikonal = add(mul(b, n[0]), mul(eps, v, sub(partial(H, 2), mul(G, partial(H, 1)))));
assert.equal(sub(add(phaseTime, dot(background, n)), eikonal).size, 0);
const smallBackgroundShape = [add(mul(U[0], Dr(b)), mul(U[2], Dz(b))),
  add(mul(U[2], Dz(background[1])), mul(ir, b, U[1])), mul(U[2], Dz(G))];
const principalReal = L.map((x, j) => sub(add(partial(x, 4), dot(K[j], L), mul(d, x), neg(mul(k, n[j], P))), jet(`Cut${j}`)));
const regular = U.map((x, j) => add(
  neg(mul(eps, partial(x, 2))), mul(c(0, 1), k, eikonal, x), neg(mul(eps, viscRemainder[j])),
  [mul(c(0, 1), Dr(P)), z(), mul(c(0, 1), Dz(P))][j],
  mul(b, Dr(x)), mul(G, Dz(x)), mul(x, divBackground), smallBackgroundShape[j],
  mul(c(0, 1), add(partial(J[j], 4), dot(K[j], J), mul(d, J[j])))));
const reduced = regular.map((x, j) => add(x, meanWave[j]));
assert(rawMinusCut.every((x, j) => sub(x, add(reduced[j], mul(background[j], divU), principalReal[j])).size === 0));
assert.notEqual(sub(rawMinusCut[0], add(reduced[0], principalReal[0])).size, 0, 'Dropping the full-curl divergence identity must fail.');
assert.notEqual(sub(rawMinusCut[0], add(reduced[0], mul(background[0], divU))).size, 0, 'Dropping the real homogeneous principal identity must fail.');

const unit = 100000;
const basePower = key => {
  if (key === 'eps') return unit;
  if (key === 'k') return -unit / 2;
  if (key.startsWith('a@')) return -1;
  if (key.startsWith('L')) return unit / 2;
  if (key.startsWith('J')) return unit - 1;
  if (key.startsWith('P@')) return unit;
  if (key.startsWith('M')) return key.startsWith('M0') ? 2 * unit - 1 : unit - 1;
  return 0;
};
function evaluate(table) {
  assert(table.size > 0);
  let exponent = Infinity;
  let coefficientSum = 0n;
  const demands = {};
  for (const [key, [r, i]] of table) {
    assert.equal(i, 0n);
    const atoms = factors(key);
    exponent = Math.min(exponent, atoms.reduce((s, v) => s + basePower(v), 0));
    coefficientSum += r < 0n ? -r : r;
    for (const atom of atoms.filter(x => x.includes('@'))) {
      const [name, orders] = atom.split('@');
      const family = /^[LJM]/.test(name) ? name[0] : name;
      const total = [...orders].reduce((s, d) => s + Number(d), 0);
      demands[family] = Math.max(demands[family] ?? 0, total);
    }
  }
  return {terms: table.size, coefficientSum: String(coefficientSum), minEpsilonUnits: exponent, maxLeafOrders: demands};
}
const tables = {meanWave, reduced};
const jets = [];
const regularC2 = [];
function collect(orders, remaining, current) {
  const total = orders.reduce((a, b) => a + b, 0);
  const summary = Object.fromEntries(Object.entries(current).map(([name, rows]) => [name, rows.map(row => [evaluate(Re(row)), evaluate(Im(row))])]));
  for (const [key, rows] of Object.entries(summary)) for (const [real, imag] of rows) {
    assert(real.minEpsilonUnits >= 149998, key);
    assert(imag.minEpsilonUnits >= 99999, key);
  }
  for (let j = 0; j < 3; j++) {
    const rr = [...orders]; rr[0] += 2;
    const zz = [...orders]; zz[1] += 2;
    assert.equal(Re(current.reduced[j]).get(`L${j}@${rr.join('')}*eps`)?.[0], -1n);
    assert.equal(Im(current.reduced[j]).get(`J${j}@${rr.join('')}*eps`)?.[0], -1n);
    assert.equal(Re(current.reduced[j]).get(`L${j}@${zz.join('')}*eps*eps*eps`)?.[0], -1n);
    assert.equal(Im(current.reduced[j]).get(`J${j}@${zz.join('')}*eps*eps*eps`)?.[0], -1n);
  }
  jets.push({orders, total, ...summary});
  if (regularOutput && total <= 2) {
    const rows = current.reduced.map((row, j) => sub(row, current.meanWave[j]));
    regularC2.push({orders, components: rows.map(row => [...row].sort(([a], [b]) => a < b ? -1 : Number(a > b))
      .map(([monomial, [real, imaginary]]) => [factors(monomial), String(real), String(imaginary)]))});
  }
  if (remaining === 0) return;
  const start = Math.max(0, orders.findLastIndex(x => x > 0));
  for (let direction = start; direction < axes.length; direction++) {
    const next = [...orders]; next[direction]++;
    collect(next, remaining - 1, Object.fromEntries(Object.entries(current).map(([key, rows]) =>
      [key, rows.map(row => partial(row, direction))])));
  }
}
collect([0, 0, 0, 0, 0], 3, tables);
assert.equal(jets.length, 56);
assert.equal(new Set(jets.map(x => x.orders.join(','))).size, 56);
const degreeSummary = Array.from({length: 4}, (_, order) => {
  const rows = jets.filter(x => x.total === order);
  const groups = Object.fromEntries(Object.keys(tables).map(key => {
    const parts = rows.flatMap(row => row[key]);
    const all = parts.flat();
    const maxLeafOrders = Object.fromEntries([...new Set(all.flatMap(x => Object.keys(x.maxLeafOrders)))].map(family =>
      [family, Math.max(...all.map(x => x.maxLeafOrders[family] ?? 0))]));
    return [key, {realMin: Math.min(...parts.map(x => x[0].minEpsilonUnits)),
      imaginaryMin: Math.min(...parts.map(x => x[1].minEpsilonUnits)), maxLeafOrders}];
  }));
  assert.equal(groups.reduced.maxLeafOrders.L, order + 2);
  assert.equal(groups.reduced.maxLeafOrders.J, order + 2);
  assert.equal(groups.reduced.maxLeafOrders.P, order + 1);
  assert.equal(groups.meanWave.maxLeafOrders.M, order + 1);
  return {order, mixedMultiIndices: rows.length, ...groups};
});
const receipt = {
  status: 'VERIFIED_ARCHIVED_MODE_ONE_SIGNED_ALGEBRA_CONDITIONAL_WEIGHTED_C3',
  archive: {graphSHA256: raw.graphSHA256, registrySHA256: raw.registrySHA256, checkedFundamentalParts: 60, cases: archived,
    exactReferenceMeanRoots: path.meanNativeRoots, meanArguments: path.meanReferenceArguments},
  inputs: {evidence, filePins, oldMeanRootFamilies: mean.roots.meanSpatialBounds,
    oldMeanLongitudinal: mean.roots.longitudinalBounds, primaryUncutProofStatus: uncut.status, halfAmplitudeStatus: half.status},
  sourceIdentities: {decomposition: 'raw - primaryCut = reduced + background*div_phase(U) + (real principal - primaryCut)',
    eikonal: 'phaseTime + background dot n = b*n_R + epsilon*v*(H_T - G*H_Z)',
    requiredFullCurl: 'div_phase(U)=0 under original smooth curl hypotheses',
    requiredRealPrincipal: 'L_v+K L+epsilon k^2 |n|^2 L - k n P = psi_v A_uncut/2',
    rawSecondDerivativeWitnesses: 'The -epsilon RR and -epsilon^3 ZZ terms survive at every differentiated order and both real/imaginary parts.'},
  axes, exponentUnits: '1/100000', degreeSummary, jets,
  chart: {H_w: path.exactPathFormula, xiDerivative: 'Lambda^-delta L', vDerivative: '(ci/Tg^delta) N',
    ownSlowDerivativeAtFixedY: 'Original reference substitution has constant rho scales and no slow derivative of H_w.',
    normal: ['x0-v H_R', 'p/R', 'pz-epsilon v H_Z'], phase: 'p theta+pz Z/epsilon+x0 R-v(p F+pz G)',
    referenceMean: 'rho^-A M(rho^-1/2 R,rho^-D Z,rho^-1 T,ell_ref,Y); rho=2^(ell_own-ell_ref).',
    paletteExponent: 'delta=i(ell_own)-i(ell_ref-2) in {0,1,2,3,4}, independent of the dyadic ratio.',
    nearestReferenceOwnBands: 'ell_own-ell_ref in {-1,0,1}; rho in {1/2,1,2}.',
    backgroundChartChange: 'At the same physical point s_ref=s_own/rho and X,eta,q agree. Reference-to-own factors for b,RF,G cancel by A=1/2+h, D=1/2-h.'},
  analyticInputs: {wave: 'Phase-free real L C5 carries epsilon^1/2 sqrt(zeta) P; imaginary J C5 carries epsilon^(1-kappa_s) sqrt(zeta) P.',
    angularPressure: 'Pure imaginary pressure P C4 carries epsilon sqrt(zeta) P(v), retaining actual moving-normal denominator.',
    mean: 'Same-label phase-free initialized mean required through total4, tangential epsilon^(1-kappa_s), radial epsilon^(2-kappa_s). Mean flat weight can be dropped since each term has a weighted wave or pressure.',
    sourceGeometry: 'Fixed carriers; k<=2 epsilon^-1/2; a and its differentiated powers cost epsilon^-kappa_s each; b=epsilon B; F,G,B and geometric derivatives uniformly bounded with original poles/constants.',
    pulse: 'P(v) and Gaussian poles are retained through actual source jet inputs. For every w use original Hw validity, support, positive denominators and smooth zero extension.'},
  open: ['Actual same-current C4/C5 primary wave and C3/C4 angular pressure for raw orders 2/3.',
    'Actual mean mixed temporal/transverse path jets and slow C3/C4 on the same admitted chart.',
    'Same live graph replay and original N3/N4 whole-K active attachment.',
    'No numerical weighted source norms, inverse C3, correction completion or final atom acceptance.'],
  finalJets: '0/67', release: 'HOLD',
};
await writeFile(out, JSON.stringify(receipt, null, 2) + '\n');
if (regularOutput) {
  assert.equal(regularC2.length, 21);
  const regularReceipt = {
    schema: 'MathScope.ArchivedForcedModeOneRegularC2/1',
    source: receipt.archive,
    epsilonUnits: unit,
    axes,
    rows: regularC2,
  };
  await writeFile(regularOutput, JSON.stringify(regularReceipt) + '\n');
}
console.log(`PASS ${archived.length * 6} archived fundamental coefficient identities and ${jets.length} ordinary jet index rows through C3.`);
