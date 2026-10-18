
/* MathScope research extensions 0.1.0. Local source modules and exact validation metadata. */
(function(){
'use strict';
const __rx_module_0 = (() => {
/** Bounded CPU projection of retained 3D data, with an orthographic camera.
 * One visible scene, <=6000 marks, DPR<=1.5, event-driven redraw only.
 * Coordinates remain mathematical data; camera rotations do not change them.
 */
const palette = ['#76e2cd', '#ffd282', '#99b8ff', '#f69fa5', '#ceafff'];
function heatColor(t) {
  t = Math.max(0, Math.min(1, t));
  const a = [64, 171, 183], b = [255, 186, 100];
  return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
}
class Scene3D {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.yaw = -0.65; this.pitch = 0.42; this.zoom = 1;
    this.data = { points: [], lines: [], arrows: [], axes: ['x', 'y', 'z'] };
    this.selected = null; this.projected = []; this.drag = null;
    this.observer = new ResizeObserver(() => this.draw()); this.observer.observe(canvas);
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      this.drag = { x: e.clientX, y: e.clientY, moved: false };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      this.drag.moved = this.drag.moved || Math.abs(dx) + Math.abs(dy) > 2;
      this.yaw += dx * 0.008; this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch + dy * 0.008));
      this.drag.x = e.clientX; this.drag.y = e.clientY; this.draw();
    });
    canvas.addEventListener('pointerup', (e) => {
      if (this.drag && !this.drag.moved) this.pick(e);
      this.drag = null; if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointercancel', () => { this.drag = null; });
    canvas.addEventListener('lostpointercapture', () => { this.drag = null; });
    canvas.addEventListener('keydown', (e) => {
      const action = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Home: 'reset', '+': 'in', '=': 'in', '-': 'out' }[e.key];
      if (action) { e.preventDefault(); this.camera(action); }
    });
  }
  camera(action) {
    if (action === 'reset') { this.yaw = -0.65; this.pitch = 0.42; this.zoom = 1; }
    if (action === 'front') { this.yaw = 0; this.pitch = 0; }
    if (action === 'left') this.yaw -= 0.18;
    if (action === 'right') this.yaw += 0.18;
    if (action === 'up') this.pitch = Math.min(1.3, this.pitch + 0.15);
    if (action === 'down') this.pitch = Math.max(-1.3, this.pitch - 0.15);
    if (action === 'in') this.zoom = Math.min(2.2, this.zoom * 1.12);
    if (action === 'out') this.zoom = Math.max(0.4, this.zoom / 1.12);
    this.draw();
  }
  set(data) {
    this.data = { points: [], lines: [], arrows: [], axes: ['x', 'y', 'z'], ...data }; this.selected = null;
    const coords = [...this.data.points.map(p => p.pos), ...this.data.lines.flatMap(l => l.points), ...this.data.arrows.map(a => a.pos)];
    this.bounds = data.bounds || [0, 1, 2].map(i => {
      let min = Math.min(...coords.map(p => p[i])), max = Math.max(...coords.map(p => p[i]));
      if (!Number.isFinite(min) || !Number.isFinite(max)) { min = -1; max = 1; }
      if (max === min) { min -= 0.5; max += 0.5; }
      return [min, max];
    });
    this.spans = this.bounds.map(b => b[1] - b[0]);
    if (data.equalScale) this.spans = this.spans.map(() => Math.max(...this.spans));
    this.canvas.dataset.markCount = String(coords.length); this.canvas.dataset.renderer = 'CPU_ORTHOGRAPHIC_3D';
    this.draw();
  }
  project(pos) {
    const v = pos.map((x, i) => (x - (this.bounds[i][0] + this.bounds[i][1]) / 2) / this.spans[i] * 2);
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const x = c * v[0] + s * v[2], z = -s * v[0] + c * v[2];
    const y = cp * v[1] - sp * z, depth = sp * v[1] + cp * z;
    const scale = Math.min(this.width * 0.30, this.height * 0.32) * this.zoom;
    return [this.width / 2 + x * scale, this.height * 0.5 - y * scale, depth];
  }
  stroke(points, color, width = 1, dash = []) {
    const c = this.ctx; c.beginPath(); c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dash);
    points.forEach((p, i) => { const v = this.project(p); if (i) c.lineTo(v[0], v[1]); else c.moveTo(v[0], v[1]); }); c.stroke(); c.setLineDash([]);
  }
  draw() {
    const box = this.canvas.getBoundingClientRect(); if (box.width < 2 || box.height < 2 || !this.ctx || !this.bounds) return;
    this.width = box.width; this.height = box.height; const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(box.width * dpr); this.canvas.height = Math.round(box.height * dpr);
    const c = this.ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#081522'; c.fillRect(0, 0, box.width, box.height);
    const b = this.bounds, corner = b.map(a => a[0]);
    for (let i = 0; i < 3; i++) {
      const end = [...corner]; end[i] = b[i][1]; this.stroke([corner, end], '#7390a5', 1.2);
      const p = this.project(end); c.fillStyle = '#dfedf5'; c.font = '11px sans-serif'; c.fillText(this.data.axes[i] || 'xyz'[i], Math.max(8, Math.min(this.width - 100, p[0] + 5)), Math.max(18, Math.min(this.height - 22, p[1] - 5)));
      for (const f of [0, .5, 1]) {
        const q = [...corner]; q[i] = b[i][0] + f * (b[i][1] - b[i][0]); const s = this.project(q);
        c.fillStyle = '#9eb6ca'; c.font = '9px monospace'; c.fillText(formatTick(q[i]), s[0] - 5, s[1] + 14);
      }
    }
    for (let j = 0; j <= 4; j++) {
      const x = b[0][0] + (b[0][1] - b[0][0]) * j / 4, z = b[2][0] + (b[2][1] - b[2][0]) * j / 4;
      this.stroke([[x, b[1][0], b[2][0]], [x, b[1][0], b[2][1]]], '#20394b');
      this.stroke([[b[0][0], b[1][0], z], [b[0][1], b[1][0], z]], '#20394b');
    }
    for (const line of this.data.lines) this.stroke(line.points, line.color || palette[0], line.width || 1.5, line.dash || []);
    this.projected = this.data.points.map((p, i) => ({ ...p, xy: this.project(p.pos), index: i })).sort((a, b) => a.xy[2] - b.xy[2]);
    for (const p of this.projected) { c.globalAlpha = p.alpha ?? .85; c.beginPath(); c.fillStyle = p.color || palette[0]; c.arc(p.xy[0], p.xy[1], p.radius || 3, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
    for (const a of this.data.arrows) {
      const p = this.project(a.pos), q = this.project(a.pos.map((v, i) => v + a.vector[i]));
      const dx = q[0] - p[0], dy = q[1] - p[1], length = Math.hypot(dx, dy);
      if (length < .2) continue; c.strokeStyle = a.color || palette[0]; c.lineWidth = 1.3; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
      const u = dx / length, v = dy / length, size = Math.min(4, length * .3);
      c.moveTo(q[0] - size * u + size * .55 * v, q[1] - size * v - size * .55 * u); c.lineTo(q[0], q[1]); c.lineTo(q[0] - size * u - size * .55 * v, q[1] - size * v + size * .55 * u); c.stroke();
    }
    c.font = '10px sans-serif'; let x = 12;
    for (const [i, text] of (this.data.legend || []).entries()) { c.fillStyle = palette[i % palette.length]; c.fillRect(x, 12, 8, 8); c.fillStyle = '#d6e5ef'; c.fillText(text, x + 13, 20); x += Math.min(190, 27 + text.length * 6); }
    c.fillStyle = '#91aabd'; c.font = '10px sans-serif'; c.fillText('3D coordinates · orthographic camera · drag / arrow keys / Home', 12, this.height - 10);
    if (this.selected) {
      const label = this.selected.label || this.selected.pos.map(formatTick).join(', '); c.fillStyle = '#102c3d'; c.fillRect(8, 32, Math.min(this.width - 16, 420), 27); c.fillStyle = '#ffe1a6'; c.font = '11px monospace'; c.fillText(label.slice(0, 78), 15, 50);
    }
    this.canvas.dataset.renderReady = 'true';
  }
  pick(e) {
    const box = this.canvas.getBoundingClientRect(), x = e.clientX - box.left, y = e.clientY - box.top;
    let nearest = null, distance = 14;
    for (const p of this.projected) { const d = Math.hypot(p.xy[0] - x, p.xy[1] - y); if (d < distance) { nearest = p; distance = d; } }
    this.selected = nearest; this.draw();
  }
  destroy() { this.observer.disconnect(); }
}
function formatTick(x) { return Math.abs(x) >= 10000 || (x !== 0 && Math.abs(x) < .01) ? x.toExponential(1) : Number(x.toPrecision(3)).toString(); }
function plot2D(canvas, series, { xLabel = 'x', yLabel = 'y', xBounds, yBounds } = {}) {
  const box = canvas.getBoundingClientRect(); if (box.width < 2) return;
  const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr);
  const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); const w = box.width, h = box.height; c.fillStyle = '#071622'; c.fillRect(0, 0, w, h);
  const all = series.flatMap(s => s.points);
  const xb = xBounds || [Math.min(...all.map(p => p[0])), Math.max(...all.map(p => p[0]))], yb = yBounds || [Math.min(...all.map(p => p[1])), Math.max(...all.map(p => p[1]))];
  const X = x => 48 + (w - 74) * (x - xb[0]) / (xb[1] - xb[0] || 1), Y = y => h - 40 - (h - 64) * (y - yb[0]) / (yb[1] - yb[0] || 1);
  c.font = '10px monospace';
  for (let i = 0; i <= 4; i++) { const y = yb[0] + (yb[1] - yb[0]) * i / 4; c.strokeStyle = '#203748'; c.beginPath(); c.moveTo(48, Y(y)); c.lineTo(w - 20, Y(y)); c.stroke(); c.fillStyle = '#a7bfd1'; c.fillText(formatTick(y), 3, Y(y) + 3); const x = xb[0] + (xb[1] - xb[0]) * i / 4; c.fillText(formatTick(x), X(x) - 8, h - 25); }
  series.forEach((s, j) => { c.strokeStyle = s.color || palette[j]; c.lineWidth = 1.7; c.beginPath(); s.points.forEach((p, i) => { if (i) c.lineTo(X(p[0]), Y(p[1])); else c.moveTo(X(p[0]), Y(p[1])); }); c.stroke(); });
  c.fillStyle = '#d8e8f3'; c.font = '10px sans-serif'; c.fillText(yLabel, 7, 12); c.fillText(xLabel, Math.max(50, w - 155), h - 8); canvas.dataset.renderReady = 'true';
}

return {palette,heatColor,Scene3D,plot2D};
})();
const __rx_module_1 = (() => {
/**
 * MathScope arithmetic/cohomology workbench, version 0.1.0.
 * Pure, dependency-free ESM. Integer enumerations are exact within stated bounds;
 * logarithms, integrals and displayed eigenvalues use IEEE-754 doubles.
 * No operation in this module proves PNT, RH, BSD, or computes prismatic cohomology.
 */

const ARITHMETIC_MODEL_VERSION = '0.1.0';
const ARITHMETIC_LIMITS = Object.freeze({ primeCutoff: 1000000, ellipticPrime: 100003, fieldPrime: 65521, torusDimension: 8 });

function integer(value, name, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(`${name} must be an integer in [${min}, ${max}].`);
  return value;
}
function mod(value, p) { return ((value % p) + p) % p; }
function isPrimeNumber(n) {
  if (!Number.isSafeInteger(n) || n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}
function primeField(p) {
  integer(p, 'p', 2, ARITHMETIC_LIMITS.fieldPrime);
  if (!isPrimeNumber(p)) throw new RangeError('p must be prime; Gaussian elimination here is over a field.');
  return p;
}

/** Inclusive sieve of Eratosthenes. */
function sievePrimes(limit = 2000) {
  integer(limit, 'limit', 0, ARITHMETIC_LIMITS.primeCutoff);
  const composite = new Uint8Array(limit + 1);
  for (let p = 2; p * p <= limit; p++) if (!composite[p]) {
    for (let q = p * p; q <= limit; q += p) composite[q] = 1;
  }
  const primes = [];
  for (let p = 2; p <= limit; p++) if (!composite[p]) primes.push(p);
  return primes;
}

/** Li_2(x) = integral from 2 to x of dt/log(t), for x >= 2.
 * We evaluate Ei(log x)-Ei(log 2) using the convergent power series.
 * This is the offset logarithmic integral, NOT the principal-value li(x).
 * The result is a numerical approximation, without a certified interval bound.
 */
function logarithmicIntegralFrom2(x) {
  if (!Number.isFinite(x) || x < 2 || x > ARITHMETIC_LIMITS.primeCutoff) throw new RangeError('Li_2 requires 2 <= x <= 1000000.');
  if (x === 2) return 0;
  const a = Math.log(x), b = Math.log(2);
  let sum = Math.log(a / b), termA = 1, termB = 1, compensation = 0;
  for (let k = 1; k <= 256; k++) {
    termA *= a / k;
    termB *= b / k;
    const term = (termA - termB) / k;
    const corrected = term - compensation, next = sum + corrected;
    compensation = (next - sum) - corrected;
    sum = next;
    if (k > a + 12 && Math.abs(term) <= 2e-15 * Math.max(1, Math.abs(sum))) return sum;
  }
  throw new Error('Logarithmic integral series did not converge within the configured bound.');
}

function primeCountingFunction(x) {
  if (!Number.isFinite(x) || x < 0) throw new RangeError('x must be finite and nonnegative.');
  return sievePrimes(Math.floor(x)).length;
}

function chebyshevPsi(x) {
  if (!Number.isFinite(x) || x < 0) throw new RangeError('x must be finite and nonnegative.');
  const n = Math.floor(x);
  let total = 0;
  for (const p of sievePrimes(n)) {
    for (let power = p; power <= n;) {
      total += Math.log(p);
      if (power > n / p) break;
      power *= p;
    }
  }
  return total;
}

/** 3D z is a categorical lane, never an intrinsic extra dimension of primes. */
function computePrimeData({ maxX = 2000, samples = 180 } = {}) {
  integer(maxX, 'maxX', 2, ARITHMETIC_LIMITS.primeCutoff);
  integer(samples, 'samples', 2, 2000);
  const primes = sievePrimes(maxX), primeSet = new Set(primes);
  const mangoldt = new Float64Array(maxX + 1);
  for (const p of primes) for (let power = p; power <= maxX;) {
    mangoldt[power] += Math.log(p);
    if (power > maxX / p) break;
    power *= p;
  }
  const selected = new Set([2, maxX]);
  for (let i = 0; i < samples; i++) selected.add(Math.round(2 + (maxX - 2) * i / (samples - 1)));
  let pi = 0, psi = 0;
  const rows = [];
  for (let x = 2; x <= maxX; x++) {
    if (primeSet.has(x)) pi++;
    psi += mangoldt[x];
    if (selected.has(x)) {
      const xOverLogX = x / Math.log(x), liFrom2 = logarithmicIntegralFrom2(x);
      rows.push({ x, pi, psi, xOverLogX, liFrom2, piRatio: pi / xOverLogX, liRatio: liFrom2 / xOverLogX, psiRatio: psi / x, piMinusLi: pi - liFrom2, psiMinusX: psi - x });
    }
  }
  const laneSpecs = [
    { id: 'pi', label: 'π(x)/(x/log x)', key: 'piRatio', raw: 'pi', color: '#65dce4' },
    { id: 'li2', label: 'Li₂(x)/(x/log x)', key: 'liRatio', raw: 'liFrom2', color: '#c3a8ff' },
    { id: 'psi', label: 'ψ(x)/x', key: 'psiRatio', raw: 'psi', color: '#f5bb75' },
    { id: 'limit', label: '기준값 1', key: null, raw: null, color: '#849cae' }
  ];
  const series3D = laneSpecs.map((lane, z) => ({
    id: lane.id, label: lane.label, color: lane.color, lane: z,
    points: rows.map(row => ({ x: row.x, y: lane.key ? row[lane.key] : 1, z, rawValue: lane.raw ? row[lane.raw] : 1 }))
  }));
  return {
    version: ARITHMETIC_MODEL_VERSION, primes, rows, series3D,
    summary: { maxX, primeCount: pi, pi, psi, xOverLogX: rows.at(-1).xOverLogX, liFrom2: rows.at(-1).liFrom2, piRatio: rows.at(-1).piRatio, psiRatio: rows.at(-1).psiRatio },
    axes: { x: '절단값 x', y: '정규화한 비율', z: '함수별 범주 레인' },
    definitions: { pi: 'π(x)=#{p≤x:p prime}', psi: 'ψ(x)=Σ_{p^k≤x} log p', liFrom2: 'Li₂(x)=∫₂ˣ dt/log t', pnt: 'π(x)/(x/log x)→1; equivalently ψ(x)/x→1' },
    evidence: { status: 'COMPUTED_FINITE_RANGE', exact: ['prime enumeration', 'π(x)'], approximate: ['logarithms', 'ψ(x)', 'Li₂(x)'], theoremInferredFromPlot: false, scope: '유한 범위 실험. 3D 레인은 표현상의 구분이며 소수의 내재적 차원이 아니다.', sourceIds: ['dlmf-pnt', 'dlmf-zeta'] }
  };
}

function truncatedZetaEulerProduct({ maxPrime = 97, s = 2 } = {}) {
  if (!Number.isFinite(s) || s <= 1) throw new RangeError('The direct Euler product here requires real s > 1.');
  const primes = sievePrimes(maxPrime);
  const logProduct = primes.reduce((sum, p) => sum - Math.log1p(-Math.pow(p, -s)), 0);
  return { s, maxPrime, value: Math.exp(logProduct), factors: primes.length, status: 'FINITE_EULER_PRODUCT', hasTailBound: false, analyticallyContinued: false };
}

/** Count the smooth projective elliptic curve by adding its point at infinity.
 * Bad reduction is checked for this integral model; no model minimization is done.
 */
function ellipticCurveAtPrime(p, a = -1, b = 0, { includePoints = false } = {}) {
  integer(p, 'p', 2, ARITHMETIC_LIMITS.ellipticPrime);
  integer(a, 'a', -1000000, 1000000);
  integer(b, 'b', -1000000, 1000000);
  if (!isPrimeNumber(p)) throw new RangeError('p must be prime.');
  const am = mod(a, p), bm = mod(b, p);
  const discriminantModP = mod(-16 * (4 * mod(mod(am * am, p) * am, p) + 27 * mod(bm * bm, p)), p);
  const curve = { a, b, equation: `y² = x³ + (${a})x + (${b})` };
  if (p === 2 || discriminantModP === 0) return {
    p, curve, goodReduction: false, discriminantModP, pointCount: null, ap: null,
    status: 'EXCLUDED_BAD_MODEL_REDUCTION', reason: '이 정수 모델의 판별식이 0 mod p이므로 좋은 소수의 Euler 공식을 적용하지 않는다.', sourceIds: ['bsd-clay']
  };
  const rootCount = new Uint8Array(p);
  const roots = includePoints ? Array.from({ length: p }, () => []) : null;
  for (let y = 0; y < p; y++) {
    const yy = mod(y * y, p);
    rootCount[yy]++;
    if (roots) roots[yy].push(y);
  }
  let affineCount = 0;
  const points = [];
  for (let x = 0; x < p; x++) {
    const rhs = mod(mod(mod(x * x, p) * x, p) + am * x + bm, p);
    affineCount += rootCount[rhs];
    if (roots) for (const y of roots[rhs]) points.push({ x, y, z: p });
  }
  const pointCount = affineCount + 1, ap = p + 1 - pointCount;
  const hasseSquaredCheck = ap * ap <= 4 * p;
  if (!hasseSquaredCheck) throw new Error('Internal arithmetic error: counted smooth curve violates Hasse bound.');
  const re = ap / 2, im = Math.sqrt(4 * p - ap * ap) / 2;
  return {
    p, curve, goodReduction: true, discriminantModP, affineCount, pointAtInfinity: 1, pointCount, ap,
    normalizedTrace: ap / (2 * Math.sqrt(p)), hasseSquaredCheck, points,
    localPolynomial: { variable: 'T', coefficientsAscending: [1, -ap, p], formula: `1 − (${ap})T + ${p}T²` },
    localFactorFormula: `1 / (1 − (${ap})·${p}^(−s) + ${p}^(1−2s))`,
    zetaFormula: `(1 − (${ap})T + ${p}T²) / ((1−T)(1−${p}T))`,
    frobeniusEigenvalues: [{ re, im }, { re, im: -im }],
    cohomologicalInterpretation: { degrees: [0, 1, 2], dimensions: [1, 2, 1], traces: [1, ap, p], pointCountAsAlternatingTrace: `1 − (${ap}) + ${p} = ${pointCount}`, sourceIds: ['etale-milne'] },
    status: 'EXACT_FINITE_FIELD_COUNT', sourceIds: ['bsd-clay', 'etale-milne']
  };
}

/** Point counts over F_(p^m), via the elliptic Frobenius recurrence.
 * m is the extension degree of a finite field, not geometric dimension.
 * BigInt strings preserve the integer result through JSON and browser UI.
 */
function ellipticExtensionCounts(p, ap, maxDegree = 6) {
  integer(p, 'p', 3, ARITHMETIC_LIMITS.ellipticPrime);
  integer(ap, 'ap', -1000, 1000);
  integer(maxDegree, 'maxDegree', 1, 24);
  if (!isPrimeNumber(p) || ap * ap > 4 * p) throw new RangeError('Require an odd prime and an elliptic trace satisfying a_p²≤4p.');
  const q = BigInt(p), a = BigInt(ap);
  let previous = 2n, current = a, qPower = 1n;
  const rows = [];
  for (let m = 1; m <= maxDegree; m++) {
    qPower *= q;
    if (m > 1) { const next = a * current - q * previous; previous = current; current = next; }
    rows.push({ extensionDegree: m, fieldOrder: qPower.toString(), trace: current.toString(), pointCount: (qPower + 1n - current).toString() });
  }
  return { p, ap, rows, status: 'THEOREM_BACKED_INTEGER_RECURRENCE', meaningOfDegree: 'm=[F_(p^m):F_p], not the dimension of E', sourceIds: ['etale-milne'] };
}

function ellipticPrimeData({ maxPrime = 97, a = -1, b = 0, selectedPrime = 11 } = {}) {
  integer(maxPrime, 'maxPrime', 3, ARITHMETIC_LIMITS.ellipticPrime);
  const all = sievePrimes(maxPrime).map(p => ellipticCurveAtPrime(p, a, b));
  const rows = all.filter(row => row.goodReduction), excluded = all.filter(row => !row.goodReduction);
  const selected = ellipticCurveAtPrime(selectedPrime, a, b, { includePoints: true });
  return {
    curve: { a, b }, rows, excluded, selected,
    extensionCounts: selected.goodReduction ? ellipticExtensionCounts(selected.p, selected.ap) : null,
    evidence: { status: 'FINITE_FIELD_ARITHMETIC', globalLFunctionComputed: false, analyticRankComputed: false, bsdProved: false, pointDisplayMeaning: '유한체 원소를 0,…,p−1 대표로 그린 산점도. 유클리드 거리에는 불변적 의미가 없다.', badPrimePolicy: '판별식이 0 mod p인 이 모델의 소수 제외; 나쁜 Euler 인자와 모델 최소화 미구현.' }
  };
}

function truncatedEllipticEulerProduct({ maxPrime = 97, a = -1, b = 0, s = 2 } = {}) {
  if (!Number.isFinite(s) || s <= 1.5) throw new RangeError('Direct good-prime Euler products here require real s > 3/2; s=1 needs a different analytic-continuation method.');
  integer(maxPrime, 'maxPrime', 3, ARITHMETIC_LIMITS.ellipticPrime);
  const all = sievePrimes(maxPrime).map(p => ellipticCurveAtPrime(p, a, b));
  const rows = all.filter(row => row.goodReduction);
  const logProduct = rows.reduce((sum, { p, ap }) => sum - Math.log(1 - ap * Math.pow(p, -s) + Math.pow(p, 1 - 2 * s)), 0);
  return { value: Math.exp(logProduct), s, maxPrime, factors: rows.length, excludedPrimes: all.filter(row => !row.goodReduction).map(row => row.p), status: 'FINITE_GOOD_PRIME_PRODUCT', hasTailBound: false, analyticallyContinued: false, canInferAnalyticRank: false };
}

function powerMod(base, exponent, p) {
  let answer = 1, term = mod(base, p), remaining = exponent;
  while (remaining > 0) {
    if (remaining % 2) answer = mod(answer * term, p);
    term = mod(term * term, p);
    remaining = Math.floor(remaining / 2);
  }
  return answer;
}
function zeroMap(rows, cols) { return { kind: 'zero', rows: integer(rows, 'rows'), cols: integer(cols, 'cols') }; }

function matrixShape(matrix, emptyCols = 0) {
  if (matrix?.kind === 'zero') return { rows: integer(matrix.rows, 'rows'), cols: integer(matrix.cols, 'cols') };
  if (!Array.isArray(matrix)) throw new TypeError('A matrix must be an array of rows or a zero-map descriptor.');
  const rows = matrix.length, cols = rows ? matrix[0].length : emptyCols;
  if (!Number.isSafeInteger(cols) || cols < 0 || matrix.some(row => !Array.isArray(row) || row.length !== cols || row.some(x => !Number.isSafeInteger(x)))) throw new TypeError('A dense matrix must be rectangular and contain safe integers.');
  return { rows, cols };
}

/** Rank of a dense integer matrix reduced in F_p, or of a compact zero map. */
function matrixRankModP(matrix, p = 3) {
  primeField(p);
  const shape = matrixShape(matrix);
  if (matrix?.kind === 'zero' || shape.rows === 0 || shape.cols === 0) return 0;
  const work = matrix.map(row => row.map(x => mod(x, p)));
  let rank = 0;
  for (let col = 0; col < shape.cols && rank < shape.rows; col++) {
    let pivot = rank;
    while (pivot < shape.rows && work[pivot][col] === 0) pivot++;
    if (pivot === shape.rows) continue;
    [work[rank], work[pivot]] = [work[pivot], work[rank]];
    const inv = powerMod(work[rank][col], p - 2, p);
    for (let j = col; j < shape.cols; j++) work[rank][j] = mod(work[rank][j] * inv, p);
    for (let i = rank + 1; i < shape.rows; i++) {
      const factor = work[i][col];
      if (factor === 0) continue;
      for (let j = col; j < shape.cols; j++) work[i][j] = mod(work[i][j] - factor * work[rank][j], p);
    }
    rank++;
  }
  return rank;
}

function compositionIsZero(next, previous, p, middleDimension, inputDimension) {
  if (next?.kind === 'zero' || previous?.kind === 'zero') return true;
  const out = next.length;
  for (let i = 0; i < out; i++) for (let j = 0; j < inputDimension; j++) {
    let sum = 0;
    for (let k = 0; k < middleDimension; k++) sum = mod(sum + mod(next[i][k], p) * mod(previous[k][j], p), p);
    if (sum !== 0) return false;
  }
  return true;
}

/** H^k = ker d^k / im d^(k-1); refuse an input with d² != 0. */
function cohomologyDimensions(complex, p = 3) {
  primeField(p);
  const { dimensions, differentials } = complex;
  if (!Array.isArray(dimensions) || dimensions.length === 0 || dimensions.some(d => !Number.isSafeInteger(d) || d < 0 || d > 500)) throw new RangeError('Invalid cochain dimensions.');
  if (!Array.isArray(differentials) || differentials.length !== dimensions.length - 1) throw new RangeError('Need one differential per adjacent degree.');
  differentials.forEach((d, k) => {
    const shape = matrixShape(d, dimensions[k]);
    if (shape.rows !== dimensions[k + 1] || shape.cols !== dimensions[k]) throw new RangeError(`d^${k} has incompatible dimensions.`);
  });
  const compositionChecks = [];
  for (let k = 0; k + 1 < differentials.length; k++) {
    const valid = compositionIsZero(differentials[k + 1], differentials[k], p, dimensions[k + 1], dimensions[k]);
    compositionChecks.push({ fromDegree: k, valid });
    if (!valid) throw new Error(`d^${k + 1} d^${k} != 0 over F_${p}; this is not a cochain complex.`);
  }
  const ranks = differentials.map(d => matrixRankModP(d, p));
  const degrees = dimensions.map((dimC, k) => {
    const rankIncoming = k > 0 ? ranks[k - 1] : 0, rankOutgoing = ranks[k] ?? 0;
    return { degree: k, dimC, rankIncoming, rankOutgoing, kernelDimension: dimC - rankOutgoing, betti: dimC - rankOutgoing - rankIncoming };
  });
  const alternating = values => values.reduce((sum, n, k) => sum + (k % 2 ? -n : n), 0);
  return { p, degrees, betti: degrees.map(d => d.betti), ranks, dSquaredZero: true, compositionChecks, eulerCharacteristic: alternating(dimensions), cohomologyEulerCharacteristic: alternating(degrees.map(d => d.betti)), status: 'EXACT_FINITE_FIELD_LINEAR_ALGEBRA' };
}

function binomial(n, k) {
  integer(n, 'n', 0, 52);
  integer(k, 'k', 0, n);
  let answer = 1n;
  for (let j = 1; j <= Math.min(k, n - k); j++) answer = answer * BigInt(n - j + 1) / BigInt(j);
  return Number(answer);
}

/** Educational degree filtration F^r C^k = C^k for k >= r, else 0.
 * This is not a Nygaard, Hodge, or conjugate filtration computation.
 */
function degreeFiltrationData(complex) {
  return {
    kind: 'DECREASING_DEGREE_FILTRATION', formula: 'F^r C^k = C^k if k≥r; 0 otherwise',
    rows: Array.from({ length: complex.dimensions.length + 1 }, (_, r) => ({
      filtrationDegree: r, dimensions: complex.dimensions.map((n, k) => k >= r ? n : 0), associatedGradedDimension: complex.dimensions[r] ?? 0
    })),
    modulesAre: 'COCHAIN_SPACES_C_K', differentialRule: 'd raises degree; restriction to F^r keeps all maps starting in degree k≥r and is zero below r.',
    associatedGradedMeaning: 'gr_F^r C is C^r in degree r with zero differential; these dimensions need not be Betti numbers.',
    actualPrismaticFiltration: false, caption: '유한 복합체 C의 감소 차수 필트레이션. 각 칸은 C^k의 차원이며 H^k의 차원과 다를 수 있다. Nygaard/Hodge 필트레이션 계산은 포함하지 않는다.'
  };
}

/** Supported finite CW/simplicial cochain examples. */
function cohomologyExample({ kind = 'triangle', p = 3, dimension = 2, filled = true } = {}) {
  primeField(p);
  let complex;
  if (kind === 'triangle' || kind === 'circle') {
    const fill = kind === 'circle' ? false : Boolean(filled);
    complex = {
      name: fill ? '채운 삼각형' : '삼각형의 경계 S¹', kind, dimensions: [3, 3, fill ? 1 : 0],
      differentials: [[[-1, 1, 0], [0, -1, 1], [1, 0, -1]], fill ? [[1, 1, 1]] : zeroMap(0, 3)],
      cellCounts: [3, 3, fill ? 1 : 0], filled: fill,
      construction: 'Oriented edges 01,12,20; d⁰ is incidence and d¹ sums the boundary of the face.'
    };
  } else if (kind === 'torus') {
    integer(dimension, 'dimension', 1, ARITHMETIC_LIMITS.torusDimension);
    const dimensions = Array.from({ length: dimension + 1 }, (_, k) => binomial(dimension, k));
    complex = {
      name: `T^${dimension} = (S¹)^${dimension}`, kind, dimension, dimensions,
      differentials: dimensions.slice(1).map((rows, k) => zeroMap(rows, dimensions[k])),
      cellCounts: dimensions, construction: 'Product CW structure of n circles; every cellular differential is zero.',
      cohomologyFormula: 'H*(T^n; F_p) ≅ Λ_(F_p)(u₁,…,u_n), |u_i|=1; dim H^k=binomial(n,k).',
      formulaStatus: 'ESTABLISHED_TOPOLOGICAL_THEOREM', sourceIds: ['hatcher-at']
    };
  } else if (kind === 'rp2' || kind === 'RP2' || kind === 'projective-plane') {
    complex = {
      name: '실사영평면 RP²', kind: 'rp2', dimensions: [1, 1, 1], differentials: [[[0]], [[2]]], cellCounts: [1, 1, 1],
      construction: 'One cell per degree; d⁰=0 and d¹=2 over the integers, then reduce coefficients mod p.', sourceIds: ['hatcher-at']
    };
  } else throw new RangeError(`Unknown cohomology example: ${kind}`);
  const cohomology = cohomologyDimensions(complex, p);
  return {
    complex, cohomology, betti: cohomology.betti, filtration: degreeFiltrationData(complex),
    points3D: cohomology.degrees.flatMap(({ degree, betti }) => Array.from({ length: betti }, (_, basisIndex) => ({ x: degree, y: basisIndex + 1, z: p }))),
    axes: { x: '코호몰로지 차수 k', y: 'H^k 추상 기저 인덱스', z: '계수체의 표지 p' },
    evidence: { status: 'COMPUTED_CW_TOY', intrinsicDimensionRepresentedFaithfully: false, basisRepresentativesComputed: false, cupProductComputed: false, perfectoidComputed: false, prismaticComputed: false, finiteFieldEtaleComputed: false,
      scope: '유한 CW/단체 복합체의 코호몰로지 차원. n은 토러스의 위상적 차원이고 p는 계수체의 특성이다. 표시된 3D 좌표는 차수·기저·계수체를 배치한 구조도다.', sourceIds: ['hatcher-at'] }
  };
}

/** Research relationships are source-linked statements, not executable implications. */
const ARITHMETIC_CONNECTIONS = {
  version: '0.1.0',
  sources: [
    { id: 'dlmf-pnt', title: 'NIST DLMF §27.2: prime-counting function and PNT', url: 'https://dlmf.nist.gov/27.2' },
    { id: 'dlmf-zeta', title: 'NIST DLMF §25.16: Chebyshev ψ and Riemann zeros', url: 'https://dlmf.nist.gov/25.16' },
    { id: 'dlmf-euler', title: 'NIST DLMF §27.4: Euler products', url: 'https://dlmf.nist.gov/27.4' },
    { id: 'etale-milne', title: 'J. S. Milne: Lectures on Étale Cohomology, §§25–27', url: 'https://www.jmilne.org/math/CourseNotes/LEC.pdf' },
    { id: 'bsd-clay', title: 'Andrew Wiles: The Birch and Swinnerton-Dyer Conjecture', url: 'https://www.claymath.org/wp-content/uploads/2022/05/birchswin.pdf' },
    { id: 'perfectoid-scholze', title: 'Peter Scholze: Perfectoid Spaces, Theorem 1.7', url: 'https://www.math.uni-bonn.de/people/scholze/PerfectoidSpaces.pdf' },
    { id: 'prisms-bhatt-scholze', title: 'Bhatt–Scholze: Prisms and Prismatic Cohomology, Theorems 1.8 and 3.10', url: 'https://people.mpim-bonn.mpg.de/scholze/prisms.pdf' },
    { id: 'hatcher-at', title: 'Allen Hatcher: Algebraic Topology, cellular cohomology and products', url: 'https://pi.math.cornell.edu/~hatcher/AT/AT.pdf' }
  ],
  nodes: [
    { id: 'primes', label: '소수 분포 π, ψ', kind: 'ARITHMETIC' },
    { id: 'zeta', label: '리만 ζ(s)', kind: 'ANALYTIC' },
    { id: 'rh', label: '리만 가설', kind: 'OPEN_CONJECTURE' },
    { id: 'finite-points', label: 'X(F_(q^m))', kind: 'ARITHMETIC' },
    { id: 'etale', label: 'Hⁱ_ét + Frobenius', kind: 'COHOMOLOGY' },
    { id: 'local-zeta', label: '유한체 Z(X,T)', kind: 'RATIONAL_FUNCTION' },
    { id: 'elliptic-local', label: 'E의 a_p와 Euler 인자', kind: 'COMPUTABLE_EXAMPLE' },
    { id: 'elliptic-global', label: 'L(E,s)', kind: 'ANALYTIC' },
    { id: 'bsd', label: 'BSD: rank = ord_(s=1)L', kind: 'OPEN_CONJECTURE' },
    { id: 'perfectoid', label: 'Perfectoid rings/spaces', kind: 'ARITHMETIC_GEOMETRY' },
    { id: 'perfectoid-tilt', label: 'Tilt X♭ / K♭', kind: 'ARITHMETIC_GEOMETRY' },
    { id: 'perfect-prisms', label: 'Perfect prisms', kind: 'ARITHMETIC_GEOMETRY' },
    { id: 'prismatic', label: 'RΓ_Δ(X/A)', kind: 'COHOMOLOGY_INTERFACE' },
    { id: 'crystalline', label: 'Crystalline cohomology', kind: 'COMPARISON_TARGET' },
    { id: 'de-rham', label: 'de Rham cohomology', kind: 'COMPARISON_TARGET' },
    { id: 'hodge-tate', label: 'Hodge–Tate comparison', kind: 'COMPARISON_TARGET' },
    { id: 'padic-etale', label: 'generic-fiber étale', kind: 'COMPARISON_TARGET' },
    { id: 'cw-toy', label: '유한 CW 코호몰로지', kind: 'COMPUTED_TOY' }
  ],
  edges: [
    { from: 'primes', to: 'zeta', status: 'THEOREM', label: 'Euler product / logarithmic derivative', formula: 'ζ(s)=∏p(1−p^(−s))^(−1), −ζ′/ζ=ΣΛ(n)n^(−s)', assumptions: ['Re(s)>1 for these convergent expansions'], sourceIds: ['dlmf-euler'] },
    { from: 'zeta', to: 'primes', status: 'THEOREM', label: 'PNT and explicit-formula connection', formula: 'π(x)~x/log x ⇔ ψ(x)=x+o(x)', assumptions: ['asymptotic statement as x→∞; finite plots do not establish the limit'], sourceIds: ['dlmf-pnt', 'dlmf-zeta'] },
    { from: 'rh', to: 'primes', status: 'CONDITIONAL_EQUIVALENCE', label: 'RH ⇔ stronger error control', formula: 'RH ⇔ [for every ε>0, ψ(x)=x+O(x^(1/2+ε))]', assumptions: ['RH itself remains a conjecture; the equivalence is a theorem'], sourceIds: ['dlmf-zeta'] },
    { from: 'etale', to: 'finite-points', status: 'THEOREM', label: 'Frobenius trace formula', formula: '#X(F_(q^m))=Σ_i(−1)^i Tr(Frob_q^m|Hⁱ_ét)', assumptions: ['X/F_q smooth and proper; ℓ≠char(F_q); Hⁱ over the algebraic closure with Q_ℓ coefficients; geometric Frobenius convention'], sourceIds: ['etale-milne'] },
    { from: 'etale', to: 'local-zeta', status: 'THEOREM', label: 'Alternating characteristic polynomials', formula: 'Z(X,T)=∏_i det(1−TFrob_q|Hⁱ_ét)^((−1)^(i+1))', assumptions: ['same smooth proper finite-field setup; i=0,…,2dim(X)'], sourceIds: ['etale-milne'] },
    { from: 'finite-points', to: 'elliptic-local', status: 'THEOREM', label: 'Elliptic specialization', formula: 'a_p=p+1−#E(F_p); P_p(T)=1−a_pT+pT²', assumptions: ['good reduction at p; include the point at infinity'], sourceIds: ['bsd-clay', 'etale-milne'] },
    { from: 'elliptic-local', to: 'elliptic-global', status: 'THEOREM_WITH_ANALYTIC_REQUIREMENTS', label: 'Global L-function', formula: 'L(E,s)=∏_p L_p(E,s)', assumptions: ['include bad-prime factors for the complete L-function; direct product converges absolutely for Re(s)>3/2; analytic continuation required at s=1'], sourceIds: ['bsd-clay'] },
    { from: 'elliptic-global', to: 'bsd', status: 'CONJECTURE', label: 'Arithmetic rank and central vanishing', formula: 'rank E(Q)=ord_(s=1)L(E,s)', assumptions: ['elliptic curve over Q; general equality is not established by the finite computation'], sourceIds: ['bsd-clay'] },
    { from: 'perfectoid', to: 'perfectoid-tilt', status: 'THEOREM', label: 'Tilting equivalence', formula: 'Perf_K ≃ Perf_(K♭), X ↦ X♭', assumptions: ['K perfectoid field; X perfectoid over K; tilting also identifies étale sites; this is not a projection between Euclidean coordinate spaces'], sourceIds: ['perfectoid-scholze'] },
    { from: 'perfectoid', to: 'perfect-prisms', status: 'THEOREM', label: 'Perfectoid rings ↔ perfect prisms', formula: 'R ↦ (A_inf(R),ker θ); (A,I) ↦ A/I', assumptions: ['categories and perfectoid-ring convention of Bhatt–Scholze Theorem 3.10'], sourceIds: ['prisms-bhatt-scholze'] },
    { from: 'perfect-prisms', to: 'prismatic', status: 'THEORY_SETUP', label: 'Choose a base prism and X', formula: 'RΓ_Δ(X/A)', assumptions: ['(A,I) bounded prism; X smooth p-adic formal over A/I; not every bounded prism must be perfect'], sourceIds: ['prisms-bhatt-scholze'] },
    { from: 'prismatic', to: 'crystalline', status: 'COMPARISON_THEOREM', label: 'Crystalline comparison', formula: 'RΓ_crys ≅ RΓ_Δ ⊗̂^L_(A,φ_A) A', assumptions: ['bounded prism; smooth p-adic formal X; I=(p)'], sourceIds: ['prisms-bhatt-scholze'] },
    { from: 'prismatic', to: 'de-rham', status: 'COMPARISON_THEOREM', label: 'de Rham comparison', formula: 'RΓ_dR ≅ RΓ_Δ ⊗̂^L_(A,φ_A) A/I', assumptions: ['bounded prism; smooth p-adic formal X; Frobenius-twisted completed base change'], sourceIds: ['prisms-bhatt-scholze'] },
    { from: 'prismatic', to: 'hodge-tate', status: 'COMPARISON_THEOREM', label: 'Hodge–Tate comparison', formula: 'Ω^i_(R/(A/I)){−i} ≅ H^i(RΓ_Δ(X/A)⊗^L_A A/I)', assumptions: ['same bounded-prism setup; X=Spf(R) affine and smooth; {−i} denotes the Breuil–Kisin twist'], sourceIds: ['prisms-bhatt-scholze'] },
    { from: 'prismatic', to: 'padic-etale', status: 'COMPARISON_THEOREM', label: 'Étale comparison', formula: 'RΓ_ét(X_η,Z/p^m) ≅ (RΓ_Δ/p^m[1/I])^(φ=1)', assumptions: ['same setup; additionally A perfect; generic fiber over Q_p; derived Frobenius fixed points'], sourceIds: ['prisms-bhatt-scholze'] },
    { from: 'local-zeta', to: 'rh', status: 'NO_INFERENCE', label: '유한체의 Weil RH에서 고전적 RH로의 자동 추론 없음', assumptions: ['the finite-field and classical Riemann zeta functions are distinct objects'], sourceIds: ['etale-milne', 'dlmf-zeta'] },
    { from: 'cw-toy', to: 'prismatic', status: 'NO_INFERENCE', label: '행렬 toy ≠ 실제 프리즘 코호몰로지', assumptions: ['the CW complex has no supplied p-adic formal scheme, prism, descent, or comparison data'], sourceIds: [] },
    { from: 'prismatic', to: 'bsd', status: 'NO_INFERENCE', label: '시각적 유사성·차원만으로 BSD 결론 없음', assumptions: ['any proposed implication requires a precise new theorem and all its hypotheses'], sourceIds: [] }
  ],
  prismaticContract: {
    status: 'REFERENCE_INTERFACE_ONLY', input: ['prime p', 'δ-ring A and Cartier ideal I', 'A derived (p,I)-complete', 'p ∈ I+φ(I)A', 'A/I has bounded p-power torsion', 'smooth p-adic formal X over A/I'],
    extraConditions: { crystalline: 'I=(p)', etale: 'A perfect and X_η the generic fiber', hodgeTate: 'affine X for the displayed formula' },
    output: 'Derived A-complex with Frobenius; comparison targets require their indicated base changes.',
    numericalComplexConstructed: false, sourceIds: ['prisms-bhatt-scholze']
  },
  dimensionContract: { geometricDimension: 'dim X or torus n', cohomologicalDegree: 'i in Hⁱ', fieldExtensionDegree: 'm in F_(q^m)', coefficientPrime: 'ℓ≠char(F_q) for étale; p for the separate finite CW examples', screenDimension: 'three display axes; not an identification of the underlying mathematical objects' },
  scope: '실행 모듈은 소수·유한체 타원곡선·유한 CW 선형대수. Perfectoid/prismatic 항목은 원전과 가정이 있는 이론 연결 구조도이며 해당 대상을 계산했다고 주장하지 않는다.'
};

return {ARITHMETIC_MODEL_VERSION,ARITHMETIC_LIMITS,sievePrimes,logarithmicIntegralFrom2,primeCountingFunction,chebyshevPsi,computePrimeData,truncatedZetaEulerProduct,ellipticCurveAtPrime,ellipticExtensionCounts,ellipticPrimeData,truncatedEllipticEulerProduct,zeroMap,matrixRankModP,cohomologyDimensions,binomial,degreeFiltrationData,cohomologyExample,ARITHMETIC_CONNECTIONS};
})();
const __rx_module_2 = (() => {
/**
 * MathScope: classical SU(2) BPST reference and conditional quantum-gap metadata.
 * No quantum Yang–Mills measure, vacuum sample, Hamiltonian, or mass is computed.
 *
 * Conventions: T_a = -i sigma_a/2, tr(T_a T_b) = -delta_ab/2;
 * [T_a,T_b] = epsilon_abc T_c. The coupling g occurs in the action, not A.
 * A^a_mu = 2 eta^a_mu,nu x_nu / (|x|^2 + rho^2),
 * F^a_mu,nu = -4 rho^2 eta^a_mu,nu / (|x|^2 + rho^2)^2.
 * S density = (1/(4g^2)) sum_{a,mu,nu} (F^a_mu,nu)^2.
 * Source: Vandoren–van Nieuwenhuizen, arXiv:0802.1862, eqs. (2.1),(2.12)–(2.15).
 * https://arxiv.org/pdf/0802.1862
 */

const YM_SOURCES = Object.freeze([
  { title: 'Clay: Yang–Mills existence and mass gap', url: 'https://www.claymath.org/wp-content/uploads/2022/06/yangmills.pdf', scope: 'Quantum problem; Hamiltonian spectrum; OS/Wightman requirements.' },
  { title: 'Vandoren–van Nieuwenhuizen: Lectures on instantons', url: 'https://arxiv.org/pdf/0802.1862', scope: 'Classical BPST formulas, conventions, and SU(N) embeddings.' },
  { title: 'Lean reference: Axioms', url: 'https://lean-lang.org/doc/reference/latest/Axioms/', scope: 'Custom axioms are assumptions; #print axioms audits dependencies.' }
]);

const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite.`);
  return value;
};
const positive = (value, name) => {
  finite(value, name);
  if (!(value > 0)) throw new RangeError(`${name} must be strictly positive.`);
  return value;
};

const GROUPS = Object.freeze({
  'SU(2)': { name: 'SU(2)', lieAlgebraDimension: 3, fieldImplemented: true },
  'SU(3)': { name: 'SU(3)', lieAlgebraDimension: 8, fieldImplemented: false },
  'G2': { name: 'G₂', lieAlgebraDimension: 14, fieldImplemented: false },
  'F4': { name: 'F₄', lieAlgebraDimension: 52, fieldImplemented: false },
  'E6': { name: 'E₆', lieAlgebraDimension: 78, fieldImplemented: false },
  'E7': { name: 'E₇', lieAlgebraDimension: 133, fieldImplemented: false },
  'E8': { name: 'E₈', lieAlgebraDimension: 248, fieldImplemented: false },
  'arbitrary': { name: '사용자가 지정한 compact simple G', lieAlgebraDimension: null, fieldImplemented: false }
});

function getGaugeGroupMetadata(group = 'SU(2)') {
  const aliases = { SU2: 'SU(2)', SU3: 'SU(3)', 'G₂': 'G2', 'F₄': 'F4', 'E₆': 'E6', 'E₇': 'E7', 'E₈': 'E8', G: 'arbitrary' };
  const key = aliases[group] || group;
  if (!Object.hasOwn(GROUPS, key)) throw new RangeError('Unsupported gauge-group declaration. Use "arbitrary" for another group.');
  const data = GROUPS[key];
  return {
    key, ...data,
    mathematicalStatus: 'Group metadata; compact/simple classification is not a Lean certificate.',
    renderedModel: data.fieldImplemented ? 'Classical SU(2) BPST one-instanton in regular gauge' : null,
    missingForField: data.fieldImplemented ? [] : [
      'A specified Lie algebra basis and structure constants',
      'An invariant inner product and its normalization',
      'A concrete representation or certified SU(2) embedding',
      'A connection/curvature model and its verification'
    ],
    quantumConstruction: false
  };
}

function getYMModelContract() {
  return {
    id: 'ym-bpst-conditional-v1',
    object: 'A classical SU(2) connection on Euclidean R4 in regular gauge',
    coordinates: ['x1', 'x2', 'x3', 'x4'],
    fourthCoordinateMeaning: 'Euclidean coordinate; this animation is not Lorentzian time evolution.',
    normalizedDensity: 'q4(x) = (6/pi^2) rho^4 / (|x|^2 + rho^2)^4; integral_R4 q4 = 1',
    actionDensity: 's4(x) = (8 pi^2 / g^2) q4(x)',
    normalizedProjection: 'q3(y) = integral_R q4(y,t) dt = (15/(8 pi)) rho^4 / (|y|^2 + rho^2)^(7/2)',
    slice: 'q4(y,c): restriction to x4=c, not integration over x4',
    projectionLoss: 'The line integral does not recover A, F, Euclidean time dependence, or a quantum state.',
    fieldComponents: 'A and F components depend on gauge; q4 and s4 are invariant scalar densities.',
    quantumStatus: 'ASSUMPTION MODE: quantum existence and a positive Hamiltonian gap are hypotheses.',
    deltaMeaning: 'A declared lower bound on nonzero spectral energies, not a measured or solved mass.',
    arbitraryGaugeGroupStatus: 'Metadata until a concrete verified representation/embedding is supplied.',
    units: 'User-selected consistent length/energy units. No physical calibration is inferred.',
    sources: YM_SOURCES
  };
}

/** Levi-Civita epsilon_abc with indices 0,1,2. */
function epsilon3(a, b, c) {
  if (a === b || b === c || a === c) return 0;
  return ((a - b) * (b - c) * (c - a)) / 2;
}

/** Self-dual 't Hooft symbol. a=0..2; mu,nu=0..3; eta_a,i,4=delta_ai. */
function tHooftEta(a, mu, nu) {
  if (![a, mu, nu].every(Number.isInteger) || a < 0 || a > 2 || mu < 0 || mu > 3 || nu < 0 || nu > 3) {
    throw new RangeError('eta indices: a=0..2; mu,nu=0..3.');
  }
  if (mu === nu) return 0;
  if (nu === 3) return a === mu ? 1 : 0;
  if (mu === 3) return a === nu ? -1 : 0;
  return epsilon3(a, mu, nu);
}

function point4(options = {}) {
  const { x = 0, y = 0, z = 0, t = 0, rho = 1 } = options;
  return { coords: [finite(x, 'x'), finite(y, 'y'), finite(z, 'z'), finite(t, 't')], rho: positive(rho, 'rho') };
}

/** Components in one fixed gauge; do not label component arrows gauge-invariant. */
function bpstConnection(options = {}) {
  const { coords, rho } = point4(options);
  const denominator = coords.reduce((sum, x) => sum + x * x, 0) + rho * rho;
  return Array.from({ length: 3 }, (_, a) => Array.from({ length: 4 }, (_, mu) =>
    2 * coords.reduce((sum, x, nu) => sum + tHooftEta(a, mu, nu) * x, 0) / denominator
  ));
}

/** Curvature components F[a][mu][nu] in the same regular gauge. */
function bpstCurvature(options = {}) {
  const { coords, rho } = point4(options);
  const denominator = coords.reduce((sum, x) => sum + x * x, 0) + rho * rho;
  const scale = -4 * rho * rho / (denominator * denominator);
  return Array.from({ length: 3 }, (_, a) => Array.from({ length: 4 }, (_, mu) =>
    Array.from({ length: 4 }, (_, nu) => scale * tHooftEta(a, mu, nu))
  ));
}

/** Nonnegative density normalized to integral 1 on R4 (unit instanton charge). */
function bpstDensity4D(options = {}) {
  const { coords, rho } = point4(options);
  const r2 = coords.reduce((sum, x) => sum + x * x, 0);
  return (6 / Math.PI ** 2) * rho ** 4 / (r2 + rho ** 2) ** 4;
}

function bpstActionDensity4D(options = {}) {
  const g = positive(options.coupling ?? 1, 'coupling');
  return (8 * Math.PI ** 2 / g ** 2) * bpstDensity4D(options);
}

/** Exact integral over x4. It is not an orthogonal projection of field components. */
function bpstProjectedDensity3D(options = {}) {
  const { x = 0, y = 0, z = 0, rho = 1 } = options;
  positive(rho, 'rho');
  const r2 = finite(x, 'x') ** 2 + finite(y, 'y') ** 2 + finite(z, 'z') ** 2;
  return (15 / (8 * Math.PI)) * rho ** 4 / (r2 + rho ** 2) ** 3.5;
}

function validateView({ mode = 'slice', slice = 0, rho = 1, group = 'SU(2)' } = {}) {
  if (!['slice', 'projection'].includes(mode)) throw new RangeError('mode must be "slice" or "projection".');
  finite(slice, 'slice');
  positive(rho, 'rho');
  return { mode, slice, rho, group: getGaugeGroupMetadata(group) };
}

/** Analytic scalar-density isosurfaces. Radius is in the coordinate units of rho. */
function getYMIsosurfaces(options = {}) {
  const { mode, slice, rho, group } = validateView(options);
  if (!group.fieldImplemented) return [];
  const levels = options.levels ?? [0.75, 0.35, 0.12, 0.03];
  const scale2 = rho ** 2 + (mode === 'slice' ? slice ** 2 : 0);
  const power = mode === 'slice' ? 4 : 3.5;
  const peak = mode === 'slice' ? bpstDensity4D({ t: slice, rho }) : bpstProjectedDensity3D({ rho });
  return levels.map((level) => {
    positive(level, 'relative level');
    if (level > 1) throw new RangeError('relative isodensity level must not exceed 1.');
    return { relativePeak: level, value: peak * level, radius: Math.sqrt(scale2 * (level ** (-1 / power) - 1)) };
  });
}

/**
 * Sample a 3D volume of a slice or exact marginal density on a finite cube.
 * Grid points are deterministic sample locations, not Monte Carlo vacuum samples.
 * No integral or convergence claim is inferred from the grid sum.
 */
function createYMField(options = {}) {
  const { mode, slice, rho, group } = validateView(options);
  const resolution = options.resolution ?? 17;
  const extent = options.extent ?? 3.5;
  if (!Number.isInteger(resolution) || resolution < 3 || resolution > 49) throw new RangeError('resolution must be an integer from 3 to 49.');
  positive(extent, 'extent');
  if (!group.fieldImplemented) return {
    kind: 'metadata-only', available: false, group,
    points: [], positions: new Float32Array(), values: new Float64Array(),
    relativeValues: new Float32Array(), message: '이 G의 장은 아직 지정되지 않았습니다. 구체적 표현/임베딩과 연결이 필요합니다.'
  };
  const count = resolution ** 3;
  const positions = new Float32Array(count * 3);
  const values = new Float64Array(count);
  const relativeValues = new Float32Array(count);
  const points = [];
  const referencePeak = mode === 'slice' ? bpstDensity4D({ rho }) : bpstProjectedDensity3D({ rho });
  const currentPeak = mode === 'slice' ? bpstDensity4D({ t: slice, rho }) : referencePeak;
  let index = 0;
  for (let iz = 0; iz < resolution; iz++) {
    for (let iy = 0; iy < resolution; iy++) {
      for (let ix = 0; ix < resolution; ix++) {
        const x = -extent + 2 * extent * ix / (resolution - 1);
        const y = -extent + 2 * extent * iy / (resolution - 1);
        const z = -extent + 2 * extent * iz / (resolution - 1);
        const value = mode === 'slice'
          ? bpstDensity4D({ x, y, z, t: slice, rho })
          : bpstProjectedDensity3D({ x, y, z, rho });
        const relative = value / referencePeak;
        positions.set([x, y, z], index * 3);
        values[index] = value;
        relativeValues[index] = relative;
        points.push({ x, y, z, value, relative, relativePeak: value / currentPeak });
        index++;
      }
    }
  }
  return {
    kind: 'classical-reference', available: true, group, mode, slice, rho, resolution, extent,
    points, positions, values, relativeValues, currentPeak, referencePeak,
    isosurfaces: getYMIsosurfaces(options),
    densityUnits: mode === 'slice' ? 'length^-4' : 'length^-3',
    analyticTotalOverR3: mode === 'slice' ? (3 / 4) * rho ** 4 / (rho ** 2 + slice ** 2) ** 2.5 : 1,
    normalizationNote: 'Raw density retains its analytic normalization. relativeValues use the central reference peak; colors are display scalings.',
    interpretation: mode === 'slice' ? 'Restriction q4(x1,x2,x3,c)' : 'Line integral ∫ q4(x1,x2,x3,t) dt over all real t',
    quantumVacuumSample: false,
    evidence: 'NUMERIC SAMPLING OF AN EXPLICIT CLASSICAL REFERENCE FORMULA'
  };
}

/** Declared possible spectral region; no spectral density/eigenvalues are computed. */
function getGapSpectrumContract({ delta = 1 } = {}) {
  positive(delta, 'delta');
  return {
    delta,
    vacuumEnergy: 0,
    excludedOpenInterval: [0, delta],
    possibleExcitedEnergyRegion: [delta, null],
    formula: 'spec(H) ⊆ {0} ∪ [Δ,∞)',
    actualSpectrumComputed: false,
    status: 'CONDITIONAL / USER-DECLARED GAP',
    note: 'The upper region permits spectral values; it does not assert that every energy there occurs. Changing Δ changes the hypothesis.'
  };
}

/**
 * Conditional Euclidean-time envelope C exp(-Delta*t).
 * Reading it as a QFT correlation bound additionally needs a self-adjoint positive
 * Hamiltonian, the stated gap, a vacuum-orthogonal vector, and spectral calculus.
 * This function evaluates only the displayed envelope, not a YM correlator.
 */
function gapEnvelope({ delta = 1, time = 0, prefactor = 1 } = {}) {
  positive(delta, 'delta');
  finite(time, 'time');
  finite(prefactor, 'prefactor');
  if (time < 0 || prefactor < 0) throw new RangeError('time and prefactor must be nonnegative.');
  return prefactor * Math.exp(-delta * time);
}

function createGapCurve({ delta = 1, prefactor = 1, maxTime = 8, samples = 121 } = {}) {
  positive(maxTime, 'maxTime');
  if (!Number.isInteger(samples) || samples < 2 || samples > 10001) throw new RangeError('samples must be an integer from 2 to 10001.');
  const contract = getGapSpectrumContract({ delta });
  const points = Array.from({ length: samples }, (_, i) => {
    const time = maxTime * i / (samples - 1);
    return { time, value: gapEnvelope({ delta, time, prefactor }) };
  });
  return { points, contract, label: '가정된 Euclidean-time envelope C·exp(-Δt)', computedCorrelator: false };
}

return {YM_SOURCES,getGaugeGroupMetadata,getYMModelContract,tHooftEta,bpstConnection,bpstCurvature,bpstDensity4D,bpstActionDensity4D,bpstProjectedDensity3D,getYMIsosurfaces,createYMField,getGapSpectrumContract,gapEnvelope,createGapCurve};
})();
const __rx_module_3 = (() => {
/**
 * MathScope: Navier--Stokes source-linked models.
 *
 * Three deliberately separate objects:
 * 1. paper-core: an explicit divergence-free SCHEMATIC with the paper's core
 *    scaling exponents. It is not OpenAI's corrected solution or smooth force.
 * 2. paper-exterior: numerical evaluation of the actual heat-exterior formula
 *    (4.29), Lemma A.6, on r > 0. Its integration into the global construction
 *    is not performed here.
 * 3. taylor-green: a separate exact 2D periodic solution lifted to T^3.
 *
 * No dependency on a DOM, network service, or external JavaScript library.
 */

const PI = Math.PI;
const norm = (v) => Math.hypot(...v);
const add = (a, b, c = 1) => a.map((x, i) => x + c * b[i]);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

const sourceLedger = Object.freeze([
  { id: 'paper', title: 'Finite Time Blowup for Navier–Stokes', author: 'OpenAI', pages: 166, date: '2026-09-08', url: 'https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf', scope: 'Theorem 1.1; Sections 2–3; Theorem 4.6(v); Lemma A.6' },
  { id: 'announcement', title: 'On the Navier–Stokes Millennium Prize Problem', date: '2026-09-08', url: 'https://openai.com/index/navier-stokes-solution/', scope: 'OpenAI states alternatives C and D and publishes Lean formalization.' },
  { id: 'clay-announcement', title: 'Navier-Stokes Announcement', date: '2026-09-11', url: 'https://www.claymath.org/news/navier-stokes-announcement/', scope: 'CMI says the problem has apparently been settled; evaluation and attribution follow its deliberate process.' },
  { id: 'formalization', title: 'OpenAI/NavierStokesAndEuler', url: 'https://github.com/openai/NavierStokesAndEuler', scope: 'External Lean source. This module does not rebuild or certify that repository.' },
  { id: 'clay-statement', title: 'Charles Fefferman: Existence and Smoothness of the Navier–Stokes Equation', url: 'https://www.claymath.org/wp-content/uploads/2022/06/navierstokes.pdf', scope: 'Alternatives A/B have zero force; C/D allow smooth force.' }
]);

const metadata = Object.freeze({
  id: 'navier-stokes-source-lab',
  title: 'Navier–Stokes · 논문 구조와 정확한 외곽 흐름',
  version: '1.0.0',
  checkedAt: '2026-10-09',
  theorem: {
    reference: 'Theorem 1.1, p. 1; Corollary 10.6, p. 125',
    viscosity: 'For each ν > 0', domain: 'R³, with a periodic corollary on R³/Z³',
    initialData: 'u(x,0)=0', forcing: 'f ∈ C∞c(R³ × (0,∞);R³)',
    regularity: 'u,p smooth on R³ × [0,1), with fixed compact spatial support',
    conclusion: 'sup(t<1) ||u(t)||₂ < ∞; limsup(t→1−) ||u(t)||∞ = ∞',
    scope: 'Forced Clay alternatives C/D. No assertion here settles the unforced alternatives A/B.',
    localVerification: 'External source theorem; the complete proof and Lean repository were not rerun by this module.'
  },
  modes: [
    { id: 'paper-core', label: '논문 핵심 스케일 · 발산 0 도식', status: 'SCHEMATIC', note: '논문의 수축·속도·에너지 지수를 따르는 별도 명시적 장. 원 논문의 전체 해·힘·펄스 보정을 재현하지 않습니다.' },
    { id: 'paper-exterior', label: '논문 heat exterior · 실제 공식', status: 'ANALYTIC COMPONENT · QUADRATURE', note: '식 (4.29), Lemma A.6의 외곽 회전장을 r>0에서 수치적분으로 평가합니다. 축과 전역 접합은 포함하지 않습니다. c∞=1은 정규화이며 이 외곽식 단독은 R³ 유한 에너지 해가 아닙니다.' },
    { id: 'taylor-green', label: 'Taylor–Green · 별도 기준해', status: 'EXACT BENCHMARK · FLOAT EVALUATION', note: 'T³ 위의 z 독립인 2차원 정확해입니다. 논문의 blowup 해와 별개입니다.' }
  ],
  sources: sourceLedger
});

function finite(value, name) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  return value;
}

function normalizeOptions(options = {}) {
  const mode = options.mode ?? 'paper-core';
  if (!metadata.modes.some((m) => m.id === mode)) throw new RangeError(`Unknown mode: ${mode}`);
  const h = finite(Number(options.h ?? 0.005), 'h');
  if (!(h > 0 && h < 0.01)) throw new RangeError('h must satisfy 0 < h < 1/100');
  const tau = finite(Number(options.tau ?? 0.1), 'tau');
  if (!(tau > 0 && tau <= 1)) throw new RangeError('tau must satisfy 0 < tau <= 1');
  const viscosity = finite(Number(options.viscosity ?? 1), 'viscosity');
  if (!(viscosity > 0)) throw new RangeError('viscosity must be positive');
  const time = finite(Number(options.time ?? 0), 'time');
  if (time < 0) throw new RangeError('time must be nonnegative');
  const amplitude = finite(Number(options.amplitude ?? 1), 'amplitude');
  const cInfinity = finite(Number(options.cInfinity ?? 1), 'cInfinity');
  if (!(cInfinity > 0)) throw new RangeError('cInfinity must be positive');
  const waveNumber = Number(options.waveNumber ?? 1);
  if (!Number.isInteger(waveNumber) || waveNumber < 1 || waveNumber > 8) throw new RangeError('waveNumber must be an integer from 1 to 8');
  const resolution = Math.round(clamp(finite(Number(options.resolution ?? 9), 'resolution'), 3, 33));
  const extent = finite(Number(options.extent ?? 2.5), 'extent');
  if (!(extent > 0 && extent <= 10)) throw new RangeError('extent must be in (0,10]');
  const rMin = finite(Number(options.rMin ?? 0.65), 'rMin');
  const rMax = finite(Number(options.rMax ?? 2.5), 'rMax');
  if (!(rMin > 0 && rMax > rMin)) throw new RangeError('Require 0 < rMin < rMax');
  const frame = options.frame ?? 'physical';
  if (!['physical', 'similarity'].includes(frame)) throw new RangeError('frame must be physical or similarity');
  return { mode, h, tau, viscosity, time, amplitude, cInfinity, waveNumber, resolution, extent, rMin, rMax, frame, bias: 0.12 };
}

/** Proportional scale representatives, not the paper's unknown constants. */
function paperScales(options = {}) {
  const o = normalizeOptions({ ...options, mode: options.mode ?? 'paper-core' });
  const { tau, h, viscosity: nu } = o;
  const A = 0.5 + h, D = 0.5 - h, rootNu = Math.sqrt(nu);
  return {
    tau, h, A, D, viscosity: nu,
    radialLength: rootNu * tau ** 0.5,
    axialLength: rootNu * tau ** D,
    velocityScale: rootNu * tau ** (-A),
    radialVelocityScale: rootNu * tau ** (-0.5),
    aspectRatio: tau ** (-h),
    volumeScale: nu ** 1.5 * tau ** (1.5 - h),
    energyScale: nu ** 2.5 * tau ** (0.5 - 3 * h),
    dissipationScale: nu ** 2.5 * tau ** (-0.5 - 3 * h),
    pulseAmplitudeScale: rootNu * tau ** (-0.5 - h / 2),
    pulseWavelengthScale: rootNu * tau ** (0.5 + h / 2),
    pulseToCoreVelocityRatio: tau ** (h / 2),
    angularReynoldsScale: tau ** (-h),
    radialReynoldsScale: 1,
    axialToRadialDiffusionRatio: tau ** (2 * h),
    energyExponent: 0.5 - 3 * h,
    log10Radius: 0.5 * Math.log10(nu) + 0.5 * Math.log10(tau),
    log10AxialLength: 0.5 * Math.log10(nu) + D * Math.log10(tau),
    log10Velocity: 0.5 * Math.log10(nu) - A * Math.log10(tau),
    log10Energy: 2.5 * Math.log10(nu) + (0.5 - 3 * h) * Math.log10(tau),
    relation: 'asymptotic proportional scales; prefactors normalized for display',
    parameterScope: 'The source proves existence of one suitable fixed h and profiles. Selecting another h here changes a pedagogical model, not a certified source solution.'
  };
}

/** Exact coordinate relation (3.2), with the viscosity rescaling in Section 3. */
function fromSimilarity({ X, eta, theta = 0 }, options = {}) {
  const o = normalizeOptions(options);
  if (!(X >= 0) || !(Math.abs(eta) < 1)) throw new RangeError('Require X >= 0 and |eta| < 1');
  finite(X, 'X'); finite(eta, 'eta'); finite(theta, 'theta');
  const q = o.tau / (1 - eta * eta);
  const r = Math.sqrt(o.viscosity * 2 * q * X);
  return { position: [r * Math.cos(theta), r * Math.sin(theta), Math.sqrt(o.viscosity) * q ** (0.5 - o.h) * eta], q, X, eta, theta };
}

/** Inverse coordinate map, solved by monotone bisection at the valid root. */
function toSimilarity(point, options = {}) {
  const o = normalizeOptions(options);
  const p = Array.isArray(point) ? point : [point.x, point.y, point.z];
  p.forEach((v) => finite(v, 'coordinate'));
  const z = p[2] / Math.sqrt(o.viscosity), D = 0.5 - o.h;
  let lo = Math.max(o.tau, Math.abs(z) ** (1 / D)), hi = 2 * lo;
  const f = (q) => q - z * z * q ** (2 * o.h) - o.tau;
  for (let j = 0; f(hi) < 0 && j < 200; j++) hi *= 2;
  for (let j = 0; j < 90; j++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid; else lo = mid;
  }
  const q = (lo + hi) / 2;
  return { q, X: (p[0] ** 2 + p[1] ** 2) / (2 * o.viscosity * q), eta: z / q ** D, theta: Math.atan2(p[1], p[0]), residual: f(q) };
}

// Lanczos Gamma, used only near Gamma(1+h), away from poles.
function gamma(z) {
  const coefficients = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  let x = 0.99999999999980993;
  z -= 1;
  for (let i = 0; i < coefficients.length; i++) x += coefficients[i] / (z + i + 1);
  const t = z + 7.5;
  return Math.sqrt(2 * PI) * t ** (z + 0.5) * Math.exp(-t) * x;
}

function integrate(f, a, b, tolerance = 1e-10, depth = 19) {
  const mid = (a + b) / 2, fa = f(a), fm = f(mid), fb = f(b);
  const area = (b - a) * (fa + 4 * fm + fb) / 6;
  function rec(l, r, fl, fc, fr, old, tol, remaining) {
    const m = (l + r) / 2, lm = (l + m) / 2, rm = (m + r) / 2;
    const flm = f(lm), frm = f(rm);
    const left = (m - l) * (fl + 4 * flm + fc) / 6;
    const right = (r - m) * (fc + 4 * frm + fr) / 6;
    const delta = left + right - old;
    if (remaining <= 0 || Math.abs(delta) <= 15 * tol) return left + right + delta / 15;
    return rec(l, m, fl, flm, fc, left, tol / 2, remaining - 1) + rec(m, r, fc, frm, fr, right, tol / 2, remaining - 1);
  }
  return rec(a, b, fa, fm, fb, area, tolerance, depth);
}

const heatCache = new Map();

/** Formula (4.29), plus its first two differentiated integrals. */
function heatProfile(Z, h = 0.005) {
  if (!(Z >= 0) || !Number.isFinite(Z) || !(h > 0 && h < 0.01)) throw new RangeError('Require finite Z >= 0 and 0 < h < .01');
  const key = `${h}:${Z.toPrecision(15)}`;
  if (heatCache.has(key)) return { ...heatCache.get(key) };
  const g = gamma(1 + h), power = 2 / (1 + h), upper = 45 ** ((1 + h) / 2);
  const moment = (order) => integrate((w) => {
    if (w === 0) return 0;
    const v = w ** power;
    return 2 * w / (1 + h) * Math.exp(-v) * v ** order * (1 + Z * v) ** (-h - order) / g;
  }, 0, upper, 2e-11);
  const H = moment(0), dH = -h * moment(1), ddH = h * (h + 1) * moment(2);
  const odeResidual = Z * Z * ddH + (1 + (2 + 2 * h) * Z) * dH + h * (h + 1) * H;
  const result = { H, dH, ddH, odeResidual, evaluation: 'adaptive quadrature; not interval arithmetic', tailCutoffV: 45 };
  if (heatCache.size >= 512) heatCache.clear();
  heatCache.set(key, result);
  return { ...result };
}

function heatJet(rPhysical, o) {
  if (!(rPhysical > 0)) throw new RangeError('The paper exterior is defined here only on r > 0');
  const sqrtNu = Math.sqrt(o.viscosity), r = rPhysical / sqrtNu;
  const m = 1 + 2 * o.h, C = o.cInfinity * 2 ** (0.5 + o.h), Z = 4 * o.tau / (r * r);
  const profile = heatProfile(Z, o.h);
  const { H, dH, ddH } = profile;
  const K0 = C * r ** (-m) * H;
  const dr0 = C * r ** (-m - 1) * (-m * H - 2 * Z * dH);
  const drr0 = C * r ** (-m - 2) * (m * (m + 1) * H + (4 * m + 6) * Z * dH + 4 * Z * Z * ddH);
  const dt0 = -4 * C * r ** (-m - 2) * dH;
  return { K: sqrtNu * K0, dr: dr0, drr: drr0 / sqrtNu, dt: sqrtNu * dt0, Z, profile };
}

function rawPoint(position, o) {
  const [x, y, z] = position;
  if (o.mode === 'taylor-green') {
    const k = o.waveNumber, a = o.amplitude * Math.exp(-2 * o.viscosity * k * k * o.time);
    const sx = Math.sin(k * x), cx = Math.cos(k * x), sy = Math.sin(k * y), cy = Math.cos(k * y);
    return { velocity: [a * sx * cy, -a * cx * sy, 0], pressure: a * a / 4 * (Math.cos(2 * k * x) + Math.cos(2 * k * y)), pressureGradient: [-a * a * k / 2 * Math.sin(2 * k * x), -a * a * k / 2 * Math.sin(2 * k * y), 0], vorticity: [0, 0, 2 * a * k * sx * sy], divergence: 0, force: [0, 0, 0] };
  }
  if (o.mode === 'paper-exterior') {
    const r = Math.hypot(x, y), jet = heatJet(r, o), K = jet.K;
    return { velocity: [-K * y / r, K * x / r, 0], pressure: null, pressureFormula: '-integral_r^infinity K(rho,t)^2/rho drho', pressureGradient: [K * K * x / (r * r), K * K * y / (r * r), 0], vorticity: [0, 0, jet.dr + K / r], divergence: 0, force: [0, 0, 0], heatResidual: jet.dt - o.viscosity * (jet.drr + jet.dr / r - K / (r * r)) };
  }
  const s = paperScales(o), R2 = (x * x + y * y) / s.radialLength ** 2, Z = z / s.axialLength;
  const e = Math.exp(-R2 - Z * Z), B = Z + o.bias, c = 1 - 2 * Z * B;
  const F = -s.velocityScale / (2 * s.axialLength) * c * e;
  const swirl = s.velocityScale / s.radialLength * e;
  // Streamfunction: Psi = (1/2) Lr^2 U R^2 (Z+b) exp(-R^2-Z^2).
  // ur=-(1/r) d_z Psi; uz=(1/r) d_r Psi. Cartesian form is regular at r=0.
  return { velocity: [F * x - swirl * y, F * y + swirl * x, s.velocityScale * (1 - R2) * B * e], pressure: null, pressureGradient: null, vorticity: null, divergence: 0, force: null };
}

function samplePoint(point, options = {}) {
  const o = normalizeOptions(options), position = Array.isArray(point) ? [...point] : [point.x, point.y, point.z];
  if (position.length !== 3) throw new RangeError('A point needs exactly three coordinates');
  position.forEach((v) => finite(v, 'coordinate'));
  const data = rawPoint(position, o), scales = paperScales(o);
  const useSimilarity = o.mode === 'paper-core' && o.frame === 'similarity';
  const unit = useSimilarity ? [scales.radialLength, scales.radialLength, scales.axialLength] : [1, 1, 1];
  return { position, x: position[0], y: position[1], z: position[2], ...data, speed: norm(data.velocity), displayPosition: position.map((v, i) => v / unit[i]), displayVelocity: data.velocity.map((v, i) => v / unit[i]) };
}

function sampleField(options = {}) {
  const o = normalizeOptions(options), scales = paperScales(o), points = [], n = o.resolution;
  if (o.mode === 'paper-exterior') {
    const radialCount = Math.max(3, Math.round(n / 2)), angles = 2 * n, heights = Math.max(3, Math.round(n / 3));
    const rootNu = Math.sqrt(o.viscosity);
    for (let j = 0; j < radialCount; j++) {
      const r = rootNu * (o.rMin + (o.rMax - o.rMin) * j / (radialCount - 1));
      for (let a = 0; a < angles; a++) for (let k = 0; k < heights; k++) {
        const theta = 2 * PI * a / angles, z = rootNu * o.extent * (2 * k / (heights - 1) - 1);
        points.push(samplePoint([r * Math.cos(theta), r * Math.sin(theta), z], o));
      }
    }
  } else {
    const bounds = o.mode === 'paper-core' ? [o.extent * scales.radialLength, o.extent * scales.radialLength, o.extent * scales.axialLength] : [PI, PI, PI];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
      const ids = [i, j, k];
      points.push(samplePoint(bounds.map((b, axis) => b * (2 * ids[axis] / (n - 1) - 1)), o));
    }
  }
  const modeInfo = metadata.modes.find((m) => m.id === o.mode);
  return { points, scales, options: o, maxSpeed: Math.max(...points.map((p) => p.speed)), bounds: { min: [0, 1, 2].map((a) => Math.min(...points.map((p) => p.displayPosition[a]))), max: [0, 1, 2].map((a) => Math.max(...points.map((p) => p.displayPosition[a]))) }, status: modeInfo.status, disclaimer: modeInfo.note, mode: o.mode, frameNote: o.frame === 'similarity' && o.mode === 'paper-core' ? 'Each axis uses its own similarity length. Vectors are instantaneously rescaled; these are not trajectories in a moving coordinate system.' : 'Physical spatial coordinates; no anisotropy exaggeration.' };
}

/** Frozen-time streamlines parameterized by arclength, not particle trajectories. */
function traceStreamline(seed, options = {}) {
  const o = normalizeOptions(options), points = [samplePoint(seed, o)];
  const steps = Math.round(clamp(Number(options.steps ?? 150), 2, 2000));
  const scale = o.mode === 'paper-core' ? paperScales(o).radialLength : Math.sqrt(o.viscosity);
  const ds = Number(options.stepSize ?? 0.045 * scale), direction = options.reverse ? -1 : 1;
  if (!(ds > 0) || !Number.isFinite(ds)) throw new RangeError('stepSize must be positive and finite');
  const f = (p) => { const v = rawPoint(p, o).velocity, n = norm(v); return n > 1e-100 ? v.map((v0) => direction * v0 / n) : [0, 0, 0]; };
  for (let j = 0; j < steps; j++) {
    const p = points.at(-1).position, k1 = f(p);
    if (norm(k1) === 0) break;
    const k2 = f(add(p, k1, ds / 2)), k3 = f(add(p, k2, ds / 2)), k4 = f(add(p, k3, ds));
    const next = p.map((v, a) => v + ds * (k1[a] + 2 * k2[a] + 2 * k3[a] + k4[a]) / 6);
    if (o.mode === 'paper-exterior' && Math.hypot(next[0], next[1]) < 1e-8) break;
    points.push(samplePoint(next, o));
  }
  return { points, kind: 'frozen-time streamline', parameter: 'arclength', particleTrajectory: false };
}

/** Independent spatial finite differences, including pressure-gradient balance. */
function residualAtPoint(point, options = {}) {
  const o = normalizeOptions(options), p = Array.isArray(point) ? [...point] : [point.x, point.y, point.z];
  const base = rawPoint(p, o), s = paperScales(o);
  const eps = o.mode === 'paper-core' ? Math.min(s.radialLength, s.axialLength) * 1e-4 : o.mode === 'paper-exterior' ? Math.hypot(p[0], p[1]) * 1e-4 : 1e-4 / o.waveNumber;
  const gradient = [[], [], []], laplacian = [0, 0, 0];
  for (let axis = 0; axis < 3; axis++) {
    const plus = [...p], minus = [...p]; plus[axis] += eps; minus[axis] -= eps;
    const vp = rawPoint(plus, o).velocity, vm = rawPoint(minus, o).velocity;
    for (let c = 0; c < 3; c++) {
      gradient[c][axis] = (vp[c] - vm[c]) / (2 * eps);
      laplacian[c] += (vp[c] - 2 * base.velocity[c] + vm[c]) / (eps * eps);
    }
  }
  const divergence = gradient[0][0] + gradient[1][1] + gradient[2][2];
  const gradientNorm = Math.hypot(...gradient.flat());
  const divergenceRelative = Math.abs(divergence) / Math.max(1, gradientNorm);
  if (o.mode === 'paper-core') return { divergence, divergenceRelative, momentumResidual: null, status: 'No pressure or smooth forcing certificate for the schematic.' };
  const dt = o.mode === 'paper-exterior' ? Math.min(1e-4, o.tau / 100) : 1e-4;
  const op = o.mode === 'paper-exterior' ? { ...o, tau: o.tau - dt } : { ...o, time: o.time + dt };
  const om = o.mode === 'paper-exterior' ? { ...o, tau: o.tau + dt } : { ...o, time: o.time - dt };
  const vp = rawPoint(p, op).velocity, vm = rawPoint(p, om).velocity;
  const temporal = vp.map((v, c) => (v - vm[c]) / (2 * dt));
  const advective = gradient.map((g) => g.reduce((sum, g0, a) => sum + g0 * base.velocity[a], 0));
  const residual = temporal.map((v, c) => v + advective[c] - o.viscosity * laplacian[c] + base.pressureGradient[c]);
  const termScale = Math.max(1, norm(temporal), norm(advective), o.viscosity * norm(laplacian), norm(base.pressureGradient));
  return { divergence, divergenceRelative, momentumResidual: norm(residual), relativeMomentumResidual: norm(residual) / termScale, residualVector: residual, status: 'Finite-difference diagnostic; not a continuum proof.', spatialStep: eps, timeStep: dt };
}

function diagnostics(options = {}) {
  const o = normalizeOptions(options), s = paperScales(o);
  let sample, energy;
  if (o.mode === 'paper-core') {
    sample = [0.7 * s.radialLength, 0.4 * s.radialLength, 0.3 * s.axialLength];
    const kappa = s.radialLength / s.axialLength;
    energy = PI * Math.sqrt(PI / 2) / 8 * s.velocityScale ** 2 * s.radialLength ** 2 * s.axialLength * (1.25 + o.bias ** 2 + kappa ** 2 * (3 / 16 + o.bias ** 2 / 4));
  } else sample = o.mode === 'paper-exterior' ? [Math.sqrt(o.viscosity), 0.4 * Math.sqrt(o.viscosity), 0.2] : [0.37, -0.61, 0.2];
  const check = residualAtPoint(sample, o), point = samplePoint(sample, o);
  const result = { ...check, point, scales: s, status: metadata.modes.find((m) => m.id === o.mode).status, completePaperSolution: false, externalFormalProofRerun: false, finiteResolution: true };
  if (o.mode === 'paper-core') Object.assign(result, { analyticSchematicEnergy: energy, energyDomain: 'R³; (1/2) integral |u_schematic|² dx', schematicDivergenceIdentity: '(1/r)∂r(r ur)+∂z uz=0 by the streamfunction', sameForcingAsPaper: false, initialRestImplemented: false });
  if (o.mode === 'paper-exterior') Object.assign(result, { heatEquationResidual: point.heatResidual, axisIncluded: false, globalGluingImplemented: false, sourceReference: 'Equation (4.29); Lemma A.6, pp. 137–138', cInfinity: o.cInfinity, normalization: 'c∞ defaults to 1; it is not the amplitude fixed by the complete proof.', viscosityConvention: 'uν(x,t)=sqrt(ν)u1(x/sqrt(ν),t), pν(x,t)=ν p1(x/sqrt(ν),t). rMin/rMax are specified in unit-viscosity coordinates.', standaloneWholeSpaceFiniteEnergy: false, energyScope: 'The displayed exterior expression alone is z-independent and excludes r=0. Finite energy and compact support belong to the completed, glued construction.', samplingAnnulusScope: 'The radial window is selected for illustration. It is not a numerical certificate for the proof-selected exterior boundary Xb.' });
  if (o.mode === 'taylor-green') {
    const a = o.amplitude * Math.exp(-2 * o.viscosity * o.waveNumber ** 2 * o.time);
    Object.assign(result, { meanKineticEnergy: a * a / 4, meanEnstrophy: a * a * o.waveNumber ** 2 / 2, meanViscousDissipation: o.viscosity * a * a * o.waveNumber ** 2, domain: '(R/2πZ)³, independent of z', exactSolutionFamily: true });
  }
  return result;
}

function correctionLedger(count = 6, options = {}) {
  const o = normalizeOptions(options), n = Math.round(clamp(Number(count), 1, 100));
  return Array.from({ length: n }, (_, j) => ({ stage: j, sigma: 1 / 5 + j / 10, baseQExponent: o.h * (1 / 5 + j / 10), reference: 'Proposition 9.6; (9.8), (9.18)', status: 'THEOREM DESCRIPTION', limitation: 'A numerical stage number omits derivative losses, logarithmic factors, constants, and the separately retained flat remainder. It is not a residual certificate.' }));
}

function scalingSeries(options = {}) {
  const count = Math.round(clamp(Number(options.count ?? 61), 2, 300));
  const maxLog = clamp(Number(options.maxLog ?? 12), 1, 150);
  return Array.from({ length: count }, (_, j) => paperScales({ ...options, tau: 10 ** (-maxLog * j / (count - 1)) }));
}


return {sourceLedger,metadata,normalizeOptions,paperScales,fromSimilarity,toSimilarity,heatProfile,samplePoint,sampleField,traceStreamline,residualAtPoint,diagnostics,correctionLedger,scalingSeries};
})();
const __rx_module_4 = (() => {
const Arithmetic = __rx_module_1;
const { Scene3D, plot2D, palette, heatColor } = __rx_module_0;
/** Arithmetic UI owns only the prime/cohomology controls and their output.
 * Tabs and camera buttons are bound by the parent extension controller.
 */
function mountArithmeticUI({ onUpdate = () => {}, report = () => {} } = {}) {
  const byId = id => document.getElementById(id);
  const required = id => {
    const node = byId(id);
    if (!node) throw new Error(`Arithmetic UI requires #${id}.`);
    return node;
  };
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  };
  const format = (value, digits = 4) => typeof value === 'number'
    ? (Number.isInteger(value) ? value.toLocaleString('en-US') : value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }))
    : String(value);
  const integerInput = (id, fallback, min, max) => {
    const value = Number(byId(id)?.value ?? fallback);
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(`${id}: ${min}부터 ${max}까지의 정수가 필요합니다.`);
    return value;
  };
  const scenePrime = new Scene3D(required('rx-prime-canvas'));
  const sceneCoho = new Scene3D(required('rx-coho-canvas'));
  const scenes = { prime: scenePrime, coho: sceneCoho };
  const graph = Arithmetic.ARITHMETIC_CONNECTIONS;
  const nodesById = new Map(graph.nodes.map(node => [node.id, node]));
  const sourcesById = new Map(graph.sources.map(source => [source.id, source]));
  let primeData = null, ellipticData = null, cohoData = null;
  let primeKey = '', ellipticKey = '', cohoKey = '';
  let currentTab = 'primes', selection = { type: 'node', id: 'prismatic' }, renderedCohoView = null;
  let primeTimer = null, graphReady = false, lastError = null, lastComputedAt = null;
  const eulerProducts = {
    zeta: Arithmetic.truncatedZetaEulerProduct({ maxPrime: 97, s: 2 }),
    elliptic: Arithmetic.truncatedEllipticEulerProduct({ maxPrime: 97, a: -1, b: 0, s: 2 })
  };

  function stats(targetId, entries) {
    const target = required(targetId);
    target.replaceChildren(...entries.map(([label, value]) => {
      const stat = element('div', null, 'rx-stat');
      stat.append(element('span', label), element('strong', value));
      return stat;
    }));
  }

  function table(headers, rows, caption) {
    const out = element('table');
    if (caption) {
      const title = element('caption', caption);
      title.style.textAlign = 'left'; title.style.padding = '10px 0'; title.style.color = '#d9eef8';
      out.append(title);
    }
    const head = element('thead'), headRow = element('tr');
    for (const label of headers) {
      const th = element('th', label); th.scope = 'col'; headRow.append(th);
    }
    head.append(headRow); out.append(head);
    const body = element('tbody');
    for (const cells of rows) {
      const row = element('tr');
      for (const value of cells) {
        const cell = element('td');
        if (value && typeof value === 'object' && value.nodeType) cell.append(value);
        else cell.textContent = String(value ?? '—');
        row.append(cell);
      }
      body.append(row);
    }
    out.append(body);
    return out;
  }

  function sourceLinks(ids) {
    const box = element('div', null, 'rx-source-links');
    const unique = [...new Set(ids)];
    for (const id of unique) {
      const source = sourcesById.get(id);
      if (!source) continue;
      const url = new URL(source.url);
      if (url.protocol !== 'https:') continue;
      const anchor = element('a', source.title);
      anchor.href = url.href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
      box.append(anchor);
    }
    return box;
  }

  function details(summary, content) {
    const out = element('details', null, 'rx-details');
    out.append(element('summary', summary));
    if (Array.isArray(content)) out.append(...content);
    else out.append(content);
    return out;
  }

  function labelForStatus(status) {
    return ({
      THEOREM: '알려진 정리', COMPARISON_THEOREM: '가정을 갖춘 비교 정리', THEORY_SETUP: '이론의 입력 설정',
      THEOREM_WITH_ANALYTIC_REQUIREMENTS: '해석적 조건을 갖춘 구성', CONDITIONAL_EQUIVALENCE: '추측과의 동치 정리',
      CONJECTURE: '일반적으로 미해결인 추측', NO_INFERENCE: '자동 추론 없음'
    })[status] || status;
  }

  function statusTag(status) {
    const category = status === 'NO_INFERENCE' ? 'non-implication' : status === 'CONJECTURE' ? 'conjecture' : status.startsWith('CONDITIONAL') ? 'conditional' : '';
    const tag = element('span', labelForStatus(status), `rx-tag ${category}`);
    tag.dataset.status = status;
    return tag;
  }

  function primeInputs() {
    return { maxX: integerInput('rx-maxx', 2000, 100, 20000), samples: 180 };
  }
  function ellipticInputs() {
    return { maxPrime: 97, a: -1, b: 0, selectedPrime: integerInput('rx-elliptic-p', 11, 3, 97) };
  }
  function cohoInputs() {
    const kind = byId('rx-coho-kind')?.value || 'torus';
    if (!['torus', 'triangle', 'circle', 'rp2'].includes(kind)) throw new RangeError('지원되는 유한 복합체를 선택하세요.');
    const p = integerInput('rx-coho-p', 3, 2, 7);
    if (![2, 3, 5, 7].includes(p)) throw new RangeError('계수체는 F₂, F₃, F₅, F₇ 중에서 선택하세요.');
    const view = byId('rx-coho-view')?.value || 'cohomology';
    if (!['cohomology', 'filtration'].includes(view)) throw new RangeError('지원되지 않는 코호몰로지 관측입니다.');
    return { kind, p, dimension: integerInput('rx-coho-dim', 3, 1, 8), filled: byId('rx-coho-filled')?.checked ?? true, view };
  }

  function guarded(action) {
    try { const result = action(); lastError = null; return result; }
    catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      report(`산술·코호몰로지 입력 오류: ${lastError}`);
      return null;
    }
  }

  function notify(tab, reason) {
    onUpdate({ module: 'arithmetic', tab, reason });
  }

  function refreshPrimes(force = false) {
    const input = primeInputs(), key = JSON.stringify(input);
    const changed = force || primeKey !== key || !primeData;
    if (changed) { primeData = Arithmetic.computePrimeData(input); primeKey = key; lastComputedAt = new Date().toISOString(); }
    required('rx-maxx-value').textContent = String(input.maxX);
    const summary = primeData.summary;
    stats('rx-prime-stats', [
      ['π(N) · 소수 개수', format(summary.pi)], ['π(N) / (N/log N)', format(summary.piRatio, 6)],
      ['ψ(N) / N', format(summary.psiRatio, 6)], ['Li₂(N) · 적분 근사', format(summary.liFrom2, 4)]
    ]);
    const statNode = required('rx-prime-stats');
    statNode.dataset.cutoff = String(input.maxX); statNode.dataset.pi = String(summary.pi);
    const chartLines = primeData.series3D.map((series, index) => ({
      points: series.points.map(point => [point.x, point.y, point.z]), color: palette[index],
      width: series.id === 'limit' ? 1.2 : 2, dash: series.id === 'limit' ? [5, 4] : []
    }));
    const chartPoints = primeData.series3D.flatMap((series, index) => series.points
      .filter((_, i) => i % 6 === 0 || i === series.points.length - 1)
      .map(point => ({ pos: [point.x, point.y, point.z], color: palette[index], radius: 2.8,
        label: `${series.label}; x=${point.x}; ratio=${point.y.toPrecision(7)}; raw=${format(point.rawValue, 5)}` })));
    const maximumRatio = Math.max(...primeData.series3D.flatMap(series => series.points.map(point => point.y)));
    scenePrime.set({
      lines: chartLines, points: chartPoints,
      axes: ['x · 절단값', '정규화 비율', '범주 레인'], bounds: [[2, input.maxX], [0, Math.max(1.4, maximumRatio * 1.04)], [0, 3]],
      legend: ['π비율', 'Li₂비율', 'ψ/x', '기준 1']
    });
    const caption = required('rx-prime-caption');
    const laneKey = element('p', '레인 0: π(x)/(x/log x) · 1: Li₂(x)/(x/log x) · 2: ψ(x)/x · 3: 기준값 1.');
    caption.replaceChildren(laneKey,
      element('p', `Li₂(x)=∫₂ˣ dt/log t. 정수 절단값 ${primeData.rows.length}개를 관측하고 선으로 이어 표시합니다. π는 정확한 개수이고 ψ와 Li₂는 부동소수점 계산입니다. 화면의 레인 좌표는 수학 대상의 추가 차원을 뜻하지 않습니다.`),
      sourceLinks(['dlmf-pnt', 'dlmf-zeta']));
    required('rx-prime-renderer').textContent = 'CPU 3D · 표본 관측';
    const sampled = primeData.rows.filter((_, i) => i === 0 || i === primeData.rows.length - 1 || i % Math.ceil(primeData.rows.length / 10) === 0);
    const products = table(['유한 곱 (s=2)', '값', '범위'], [
      ['ζ의 Euler 인자', format(eulerProducts.zeta.value, 8), 'p≤97'],
      ['E의 좋은 소수 Euler 인자', format(eulerProducts.elliptic.value, 8), '3≤p≤97']
    ], '소수별 인자로 계산한 두 유한 곱');
    required('rx-prime-table').replaceChildren(
      table(['x', 'π(x)', 'x/log x', 'Li₂(x)', 'ψ(x)/x'], sampled.map(row => [format(row.x), format(row.pi), format(row.xOverLogX, 3), format(row.liFrom2, 3), format(row.psiRatio, 5)]), '선택한 유한 구간의 표본값'),
      details('Euler product의 실제 유한 계산 보기', [products,
        element('p', 'ζ의 직접 Euler 곱은 실수 s>1, E의 직접 곱은 s>3/2에서만 제공합니다. 위 값에는 꼬리 오차 보증과 s=1로의 해석적 연장이 없으며, E의 값은 좋은 소수 인자만 곱했습니다.', 'rx-note'),
        sourceLinks(['dlmf-euler', 'bsd-clay'])])
    );
    return changed;
  }

  function refreshElliptic(force = false) {
    const input = ellipticInputs(), key = JSON.stringify(input);
    const changed = force || key !== ellipticKey || !ellipticData;
    if (changed) { ellipticData = Arithmetic.ellipticPrimeData(input); ellipticKey = key; lastComputedAt = new Date().toISOString(); }
    const selected = ellipticData.selected;
    if (!selected.goodReduction) throw new Error('선택한 소수에서 좋은 축소 조건이 충족되지 않습니다.');
    stats('rx-elliptic-result', [
      ['소수 p', String(selected.p)], ['#E(Fₚ) · 무한원점 포함', String(selected.pointCount)],
      ['Frobenius trace aₚ', String(selected.ap)], ['Hasse 검사 aₚ² ≤ 4p', `${selected.ap ** 2} ≤ ${4 * selected.p}`]
    ]);
    const resultNode = required('rx-elliptic-result');
    resultNode.dataset.prime = String(selected.p); resultNode.dataset.pointCount = String(selected.pointCount); resultNode.dataset.ap = String(selected.ap);
    const eig = selected.frobeniusEigenvalues[0];
    const traceRows = selected.cohomologicalInterpretation.degrees.map((degree, i) => [
      degree, selected.cohomologicalInterpretation.dimensions[i], selected.cohomologicalInterpretation.traces[i], degree % 2 ? '−' : '+'
    ]);
    const box = required('rx-elliptic-table');
    const finitePoints = element('p', selected.points.map(point => `(${point.x},${point.y})`).join(', '), 'rx-note');
    box.replaceChildren(
      element('div', `Pₚ(T) = ${selected.localPolynomial.formula}\nZ(E/Fₚ,T) = ${selected.zetaFormula}`, 'rx-formula'),
      table(['차수 i', 'dim Hⁱ_ét', 'Frob trace', '교대 부호'], traceRows, '좋은 소수에서 알려진 étale 해석'),
      element('p', `교대 trace: ${selected.cohomologicalInterpretation.pointCountAsAlternatingTrace}. H¹의 복소 고유값 표현은 ${format(eig.re, 4)} ± ${format(eig.im, 4)}i이며, 소수점 표시는 근사입니다. 점 개수에서 특성다항식을 정한 것으로, étale 복합체를 직접 계산한 결과는 아닙니다.`, 'rx-note'),
      details(`선택한 F_${selected.p}의 affine 점 ${selected.affineCount}개 보기`, [finitePoints, element('p', '목록에 더해 무한원점 1개를 셉니다. 0,…,p−1은 체 원소의 대표이고 대표 사이의 유클리드 거리는 산술 불변량이 아닙니다.', 'rx-note')]),
      details('유한체 확장 F_(p^m)에서의 점 개수', [
        table(['확장 차수 m', '체의 크기 p^m', '#E(F_(p^m))'], ellipticData.extensionCounts.rows.map(row => [row.extensionDegree, row.fieldOrder, row.pointCount]), 'Frobenius 점화식으로 계산한 정수'),
        element('p', 'm은 체의 확장 차수입니다. 곡선 E의 기하적 차원은 1로 유지됩니다. 이 표는 aₚ에서 출발하는 알려진 점화식을 사용합니다.', 'rx-note')
      ]),
      details('여러 좋은 소수의 정확한 개수 비교', table(['p', '#E(Fₚ)', 'aₚ', 'aₚ/(2√p)'], ellipticData.rows.map(row => [row.p, row.pointCount, row.ap, format(row.normalizedTrace, 5)]), 'E : y²=x³−x, p≤97')),
      sourceLinks(['etale-milne', 'bsd-clay'])
    );
    box.querySelector('.rx-formula').style.whiteSpace = 'pre-wrap';
    return changed;
  }

  function cochainTable() {
    return table(['차수 k', 'dim Cᵏ', 'rank dᵏ⁻¹', 'rank dᵏ', 'dim ker dᵏ', 'dim Hᵏ'],
      cohoData.cohomology.degrees.map(row => [row.degree, row.dimC, row.rankIncoming, row.rankOutgoing, row.kernelDimension, row.betti]),
      `${cohoData.complex.name} · 계수체 F_${cohoData.cohomology.p}`);
  }

  function filtrationTable() {
    return table(['r', ...cohoData.complex.dimensions.map((_, k) => `dim FʳC${k}`), 'dim grʳ'],
      cohoData.filtration.rows.map(row => [row.filtrationDegree, ...row.dimensions, row.associatedGradedDimension]),
      'C의 감소 차수 필트레이션 · FʳCᵏ=Cᵏ (k≥r), 0 (k<r)');
  }

  function refreshCohomology(force = false) {
    const input = cohoInputs();
    const { view, ...modelInput } = input;
    const key = JSON.stringify(modelInput), changed = force || cohoKey !== key || !cohoData;
    if (changed) { cohoData = Arithmetic.cohomologyExample(modelInput); cohoKey = key; lastComputedAt = new Date().toISOString(); }
    required('rx-coho-dim').disabled = input.kind !== 'torus';
    required('rx-coho-filled').disabled = input.kind !== 'triangle';
    const modelDimension = input.kind === 'torus' ? input.dimension : (input.kind === 'circle' || (input.kind === 'triangle' && !input.filled)) ? 1 : 2;
    required('rx-coho-dim-value').textContent = String(modelDimension);
    stats('rx-coho-stats', [
      ['모델의 위상적 차원', String(modelDimension)], ['계수체', `F_${input.p}`],
      ['dᵏ⁺¹dᵏ=0', '유한 행렬 검사 통과'], ['χ(C) = χ(H)', String(cohoData.cohomology.eulerCharacteristic)]
    ]);
    required('rx-coho-stats').dataset.betti = JSON.stringify(cohoData.betti);
    required('rx-coho-stats').dataset.model = input.kind;
    const degrees = cohoData.complex.dimensions.length - 1;
    const caption = required('rx-coho-caption');
    if (view === 'filtration') {
      const points = [], lines = [];
      for (const row of cohoData.filtration.rows) {
        const r = row.filtrationDegree;
        row.dimensions.forEach((dimC, k) => {
          const color = heatColor(r / Math.max(1, degrees + 1));
          if (dimC > 0) lines.push({ points: [[k, 0, r], [k, dimC, r]], color, width: 3 });
          points.push({ pos: [k, dimC, r], color: dimC > 0 ? color : '#4e6273', radius: dimC > 0 ? 3 : 1.7,
            label: `r=${r}, k=${k}, dim F^r C^k=${dimC}` });
        });
      }
      sceneCoho.set({
        points, lines, axes: ['코체인 차수 k', 'dim FʳCᵏ', '필트레이션 r'],
        bounds: [[0, Math.max(1, degrees)], [0, Math.max(1, ...cohoData.complex.dimensions)], [0, degrees + 1]], legend: []
      });
      caption.replaceChildren(
        element('p', `FʳCᵏ=Cᵏ (k≥r), 0 (k<r). x=k, y=dim FʳCᵏ, z=r. d가 차수를 올리므로 각 FʳC는 실제 부분복합체이고 Fʳ⁺¹C⊆FʳC입니다.`),
        element('p', '막대 높이는 코체인 공간의 차원입니다. Hᵏ의 차원이나 Hᵏ(C)의 유도된 필트레이션으로 해석하지 않습니다. Nygaard/Hodge 필트레이션은 이 관측에서 계산하지 않습니다.'),
        sourceLinks(['hatcher-at'])
      );
    } else {
      const points = cohoData.points3D.map(point => ({
        pos: [point.x, point.y, point.z], color: palette[point.x % palette.length], radius: cohoData.betti.reduce((a, b) => a + b, 0) > 100 ? 2.2 : 3.4,
        label: `H^${point.x}; abstract basis #${point.y}; F_${point.z}; b_${point.x}=${cohoData.betti[point.x]}`
      }));
      sceneCoho.set({
        points, axes: ['코호몰로지 차수 k', '추상 기저 인덱스', '계수체 표지 p'],
        bounds: [[0, Math.max(1, degrees)], [0, Math.max(2, ...cohoData.betti) + 1], [0, 8]], legend: []
      });
      caption.replaceChildren(
        element('p', `${cohoData.complex.name}: Betti 차원 [${cohoData.betti.join(', ')}]. 각 차수 k에 dim Hᵏ개의 추상 기저 표지를 배치했습니다. x=k, y=기저 인덱스, z=p이며 현재 계수체의 한 층을 표시합니다.`),
        element('p', '차수별 차원은 유한 행렬로 계산했습니다. 그림의 점은 코호몰로지 대표 cocycle 자체나 원본 공간의 좌표가 아니며, 화면 배치는 기하적 거리·cup product를 보존한다는 뜻이 아닙니다.'),
        sourceLinks(['hatcher-at'])
      );
    }
    if (input.kind === 'rp2') caption.append(element('p', `RP²의 d¹는 정수 행렬 [2]입니다. 현재 F_${input.p}에서 rank d¹=${cohoData.cohomology.ranks[1]}. F₂에서는 2=0이 되어 계수체에 따른 차이가 생깁니다.`));
    if (input.kind === 'triangle') caption.append(element('p', input.filled ? '2-cell을 채운 삼각형: H¹의 차원이 0입니다.' : '삼각형 경계: H¹의 차원이 1입니다.'));
    if (input.kind === 'torus') caption.append(element('p', cohoData.complex.cohomologyFormula));
    const matrixText = cohoData.complex.differentials.map((matrix, k) => matrix.kind === 'zero'
      ? `d^${k}: zero map (${matrix.rows}×${matrix.cols})`
      : `d^${k}:\n${matrix.map(row => '[' + row.join(', ') + ']').join('\n')}`).join('\n\n');
    const matrixPre = element('pre', matrixText);
    matrixPre.style.whiteSpace = 'pre-wrap'; matrixPre.style.fontSize = '12px'; matrixPre.style.lineHeight = '1.8';
    required('rx-coho-table').replaceChildren(
      view === 'filtration' ? filtrationTable() : cochainTable(),
      details(view === 'filtration' ? '원래 복합체의 코호몰로지 차원 보기' : 'C의 감소 차수 필트레이션 표 보기', view === 'filtration' ? cochainTable() : filtrationTable()),
      details('입력한 코체인 미분 행렬 보기', [element('p', `정수 행렬을 F_${input.p}로 줄여 계산합니다. 0인 미분은 행렬 크기만 저장합니다.`, 'rx-note'), matrixPre]),
      element('p', '유한 CW/단체 복합체의 계산 기록입니다. Prismatic·perfectoid 대상의 복합체 또는 비교사상은 이 계산 결과에 포함되지 않습니다.', 'rx-note')
    );
    renderedCohoView = view;
    return changed;
  }

  function appendPrismContract(target) {
    const contract = graph.prismaticContract;
    if (!contract) return;
    target.append(element('h4', 'Prismatic 입력 계약'), element('p', '이 지도는 원전의 설정과 비교 정리를 연결합니다. 아래 대수적 입력으로 실제 복합체를 구성하는 계산기는 아직 연결하지 않았습니다.'));
    const inputs = element('ul');
    for (const condition of contract.input) inputs.append(element('li', condition));
    target.append(inputs, element('p', contract.output), sourceLinks(contract.sourceIds));
  }

  function edgeButton(edge, index, title) {
    const button = element('button', title || edge.label, 'rx-edge');
    button.type = 'button'; button.dataset.edgeIndex = String(index); button.setAttribute('aria-controls', 'rx-connection-detail');
    button.addEventListener('click', () => { showEdge(index); notify('cohomology', 'connection-selection'); });
    return button;
  }

  function updateNodePressedState() {
    for (const button of required('rx-connection-nodes').querySelectorAll('button[data-node-id]')) {
      const pressed = selection.type === 'node' && selection.id === button.dataset.nodeId;
      button.setAttribute('aria-pressed', String(pressed));
      button.style.borderColor = pressed ? '#8be6d4' : '';
    }
  }

  function showNode(id) {
    const node = nodesById.get(id);
    if (!node) return;
    selection = { type: 'node', id };
    const target = required('rx-connection-detail');
    target.replaceChildren(element('h3', node.label), element('p', node.kind, 'rx-note'));
    const related = graph.edges.map((edge, index) => ({ edge, index })).filter(({ edge }) => edge.from === id || edge.to === id);
    target.append(element('p', '아래 관계를 선택하면 정리의 적용 가정과 출처를 확인할 수 있습니다.'));
    const list = element('ul');
    for (const { edge, index } of related) {
      const item = element('li');
      item.append(edgeButton(edge, index, `${nodesById.get(edge.from).label} → ${nodesById.get(edge.to).label}: ${edge.label}`));
      item.append(document.createTextNode(' '), statusTag(edge.status)); list.append(item);
    }
    target.append(list);
    if (id === 'prismatic' || id === 'perfect-prisms') appendPrismContract(target);
    if (id === 'cw-toy') target.append(element('p', '현재 실행한 예제는 CW/단체 복합체입니다. 행렬의 차원이 비슷해도 p-adic formal scheme, prism, Frobenius, descent 자료가 새로 주어지지는 않습니다.'));
    if (id === 'rh' || id === 'bsd') target.append(element('p', '이 노드의 일반 명제는 추측으로 유지됩니다. 유한 계산 결과나 그림 선택으로 증명 상태를 변경하지 않습니다.', 'rx-warn'));
    target.append(sourceLinks(related.flatMap(({ edge }) => edge.sourceIds)));
    updateNodePressedState();
  }

  function showEdge(index) {
    const edge = graph.edges[index];
    if (!edge) return;
    selection = { type: 'edge', index, from: edge.from, to: edge.to };
    const target = required('rx-connection-detail');
    target.replaceChildren(element('h3', `${nodesById.get(edge.from).label} → ${nodesById.get(edge.to).label}`), statusTag(edge.status), element('p', edge.label));
    if (edge.formula) target.append(element('div', edge.formula, 'rx-formula'));
    target.append(element('h4', '적용 가정과 범위'));
    const list = element('ul');
    for (const assumption of edge.assumptions) list.append(element('li', assumption));
    target.append(list);
    if (edge.status === 'NO_INFERENCE') target.append(element('p', '이 연결은 자동 추론이 성립한다는 주장을 차단하는 범위 기록입니다. 새로운 함의를 제안하려면 명제와 증명을 별도로 제시해야 합니다.', 'rx-warn'));
    if (edge.status === 'CONDITIONAL_EQUIVALENCE') target.append(element('p', '동치 관계가 알려졌다는 사실과 그 관계에 등장하는 추측이 증명됐다는 주장은 서로 다른 상태입니다.', 'rx-warn'));
    if (edge.sourceIds.length) target.append(element('h4', '원전'), sourceLinks(edge.sourceIds));
    else target.append(element('p', '출처 유형: MathScope의 계산·추론 범위 선언.', 'rx-note'));
    if (edge.from === 'prismatic' || edge.to === 'prismatic') appendPrismContract(target);
    updateNodePressedState();
  }

  function mountGraph() {
    if (graphReady) return;
    const grid = required('rx-connection-nodes');
    grid.replaceChildren(...graph.nodes.map(node => {
      const button = element('button', null, 'rx-node');
      button.type = 'button'; button.dataset.nodeId = node.id; button.setAttribute('aria-controls', 'rx-connection-detail');
      button.append(element('strong', node.label), element('small', node.kind));
      button.addEventListener('click', () => { showNode(node.id); notify('cohomology', 'connection-selection'); });
      return button;
    }));
    required('rx-connection-edges').replaceChildren(table(['연결', '수학적 관계 · 상세 열기', '상태'],
      graph.edges.map((edge, index) => [
        `${nodesById.get(edge.from).label} → ${nodesById.get(edge.to).label}`, edgeButton(edge, index), statusTag(edge.status)
      ]), '정리·추측·범위 선언을 구별한 연결 목록'));
    graphReady = true;
    showNode(selection.id || 'prismatic');
  }

  function cameraState(scene) { return { yaw: scene.yaw, pitch: scene.pitch, zoom: scene.zoom, projection: 'orthographic' }; }

  function snapshot(tab) {
    // Export/save must not pair a just-moved slider with the previous result while
    // the short input debounce is still pending.
    clearTimeout(primeTimer); primeTimer = null;
    if (primeKey !== JSON.stringify(primeInputs()) || !primeData) refreshPrimes();
    if (ellipticKey !== JSON.stringify(ellipticInputs()) || !ellipticData) refreshElliptic();
    const cohoInput = cohoInputs();
    const { view: requestedView, ...cohoModelInput } = cohoInput;
    if (cohoKey !== JSON.stringify(cohoModelInput) || !cohoData || renderedCohoView !== requestedView) refreshCohomology();
    const result = {
      module: 'arithmetic-cohomology', version: Arithmetic.ARITHMETIC_MODEL_VERSION, recordedAt: new Date().toISOString(), lastComputedAt,
      inputs: { primes: primeInputs(), elliptic: ellipticInputs(), cohomology: cohoInput },
      results: { primes: primeData, elliptic: ellipticData, cohomology: cohoData, finiteEulerProducts: eulerProducts },
      representation: {
        primes: { axes: { x: 'integer cutoff x', y: 'normalized function value', z: 'categorical series lane' }, laneOrder: ['piRatio', 'liRatio', 'psiRatio', 'constantOne'],
          integralConvention: 'Li₂(x)=integral_2^x dt/log(t)', sampling: '180 requested integer cutoffs, deduplicated; straight connecting display segments',
          exactData: ['primes', 'π(x)'], floatingPoint: ['logarithms', 'ψ(x)', 'Li₂(x)'], finitePlotProvesLimit: false, camera: cameraState(scenePrime) },
        elliptic: { presentation: 'exact count table, Frobenius polynomial, theorem-backed extension recurrence', includePointAtInfinity: true,
          curve: 'y²=x³−x', badPrimeExcluded: 2, fieldCoordinates: 'representatives 0,...,p−1', extensionDegreeIsGeometricDimension: false,
          analyticContinuationComputed: false, analyticRankComputed: false, bsdStatus: 'CONJECTURE' },
        cohomology: cohoInput.view === 'filtration'
          ? { view: 'filtration', axes: { x: 'cochain degree k', y: 'dim F^r C^k', z: 'filtration index r' },
            filtration: 'F^r C^k=C^k for k>=r, otherwise 0; decreasing subcomplex filtration',
            heightsAre: 'cochain-space dimensions, not Betti numbers or induced H*(C) filtration', prismaticFiltrationComputed: false, camera: cameraState(sceneCoho) }
          : { view: 'cohomology', axes: { x: 'cohomology degree k', y: 'abstract basis index', z: 'coefficient-field label p' },
            basisRepresentativesComputed: false, geometricEmbedding: false, cupProductComputed: false, prismaticComputed: false, camera: cameraState(sceneCoho) }
      },
      referenceGraph: { selection, nodes: graph.nodes, edges: graph.edges, sources: graph.sources, prismaticContract: graph.prismaticContract },
      proofStatus: { numericalRunsAreLeanProofs: false, pntInferredFromPlot: false, rhProved: false, bsdProved: false, perfectoidComputed: false, prismaticComputed: false },
      ui: { currentTab, lastError }
    };
    if (tab === 'primes') {
      return JSON.parse(JSON.stringify({
        module: 'primes', version: result.version, recordedAt: result.recordedAt, lastComputedAt,
        input: { ...result.inputs.primes, elliptic: result.inputs.elliptic },
        results: { primes: primeData, elliptic: ellipticData, finiteEulerProducts: eulerProducts },
        representation: { primes: result.representation.primes, elliptic: result.representation.elliptic },
        grade: 'COMPUTED_FINITE_RANGE', proofStatus: result.proofStatus,
        sourceIds: ['dlmf-pnt', 'dlmf-zeta', 'dlmf-euler', 'etale-milne', 'bsd-clay']
      }));
    }
    if (tab === 'cohomology') {
      return JSON.parse(JSON.stringify({
        module: 'cohomology', version: result.version, recordedAt: result.recordedAt, lastComputedAt,
        input: result.inputs.cohomology,
        results: { ...cohoData, referenceGraph: result.referenceGraph },
        representation: result.representation.cohomology,
        grade: 'COMPUTED_CW_TOY', proofStatus: result.proofStatus,
        sourceIds: ['hatcher-at', 'perfectoid-scholze', 'prisms-bhatt-scholze']
      }));
    }
    return JSON.parse(JSON.stringify(result));
  }

  function runChecks() {
    const checks = [];
    const check = (name, fn, detail) => {
      try { checks.push({ name, pass: Boolean(fn()), ...(detail ? { detail } : {}) }); }
      catch (error) { checks.push({ name, pass: false, detail: error instanceof Error ? error.message : String(error) }); }
    };
    check('Arithmetic: π(100)=25', () => Arithmetic.primeCountingFunction(100) === 25);
    check('Arithmetic: ψ includes prime powers', () => Math.abs(Arithmetic.chebyshevPsi(10) - (3 * Math.log(2) + 2 * Math.log(3) + Math.log(5) + Math.log(7))) < 1e-12);
    check('Arithmetic: Li₂ normalization and value', () => Arithmetic.logarithmicIntegralFrom2(2) === 0 && Math.abs(Arithmetic.logarithmicIntegralFrom2(10) - 5.120435724669805) < 1e-11);
    check('Elliptic: E(F13) has 8 points and trace 6', () => { const row = Arithmetic.ellipticCurveAtPrime(13); return row.pointCount === 8 && row.ap === 6; });
    check('Elliptic: bad prime 2 excluded', () => Arithmetic.ellipticCurveAtPrime(2).goodReduction === false);
    check('Elliptic: s=1 direct-product boundary enforced', () => { try { Arithmetic.truncatedEllipticEulerProduct({ s: 1 }); return false; } catch (error) { return error instanceof RangeError; } });
    check('Cohomology: T8 has binomial Betti dimensions', () => JSON.stringify(Arithmetic.cohomologyExample({ kind: 'torus', dimension: 8, p: 3 }).betti) === JSON.stringify([1, 8, 28, 56, 70, 56, 28, 8, 1]));
    check('Cohomology: RP² distinguishes coefficient characteristic', () => JSON.stringify(Arithmetic.cohomologyExample({ kind: 'rp2', p: 2 }).betti) === '[1,1,1]' && JSON.stringify(Arithmetic.cohomologyExample({ kind: 'rp2', p: 3 }).betti) === '[1,0,0]');
    check('Cohomology: filled triangle kills H1', () => Arithmetic.cohomologyExample({ kind: 'triangle', filled: true }).betti[1] === 0 && Arithmetic.cohomologyExample({ kind: 'triangle', filled: false }).betti[1] === 1);
    check('Filtration: decreasing cochain direction', () => JSON.stringify(Arithmetic.cohomologyExample({ kind: 'triangle', filled: true }).filtration.rows[1].dimensions) === '[0,3,1]');
    check('UI: prime display matches current computed inputs', () => Boolean(primeData) && required('rx-prime-stats').dataset.pi === String(primeData.summary.pi) && primeData.summary.maxX === primeInputs().maxX);
    check('UI: elliptic display includes infinity', () => Boolean(ellipticData) && required('rx-elliptic-result').dataset.pointCount === String(ellipticData.selected.affineCount + 1));
    check('UI: cohomology display matches model', () => Boolean(cohoData) && required('rx-coho-stats').dataset.betti === JSON.stringify(cohoData.betti));
    check('UI: graph nodes and relationship controls mounted', () => required('rx-connection-nodes').querySelectorAll('button[data-node-id]').length === graph.nodes.length && required('rx-connection-edges').querySelectorAll('button[data-edge-index]').length === graph.edges.length);
    check('References: primary-source URLs use HTTPS', () => graph.sources.every(source => new URL(source.url).protocol === 'https:'));
    check('Evidence: BSD and prismatic scope retained', () => graph.edges.find(edge => edge.from === 'elliptic-global' && edge.to === 'bsd').status === 'CONJECTURE' && cohoData.evidence.prismaticComputed === false);
    check('UI: retained scene coordinates finite', () => [scenePrime, sceneCoho].every(scene => [...scene.data.points.map(point => point.pos), ...scene.data.lines.flatMap(line => line.points)].every(pos => pos.length === 3 && pos.every(Number.isFinite))));
    return checks;
  }

  function render(tab = currentTab) {
    if (!['primes', 'cohomology'].includes(tab)) return;
    currentTab = tab;
    guarded(() => {
      if (tab === 'primes') { refreshPrimes(); refreshElliptic(); scenePrime.draw(); }
      else { refreshCohomology(); mountGraph(); sceneCoho.draw(); }
    });
  }

  required('rx-maxx').addEventListener('input', () => {
    required('rx-maxx-value').textContent = required('rx-maxx').value;
    clearTimeout(primeTimer);
    primeTimer = setTimeout(() => guarded(() => { refreshPrimes(); notify('primes', 'cutoff-input'); }), 75);
  });
  required('rx-maxx').addEventListener('change', () => {
    clearTimeout(primeTimer);
    guarded(() => { refreshPrimes(); notify('primes', 'cutoff-change'); report('소수의 유한 구간 관측을 갱신했습니다.'); });
  });
  required('rx-prime-run').addEventListener('click', () => {
    clearTimeout(primeTimer);
    guarded(() => { refreshPrimes(true); refreshElliptic(); notify('primes', 'recompute'); report(`N=${primeData.summary.maxX}, π(N)=${primeData.summary.pi} 계산 완료. 유한 실험 상태를 유지합니다.`); });
  });
  required('rx-elliptic-p').addEventListener('change', () => guarded(() => {
    refreshElliptic(); notify('primes', 'elliptic-prime'); report(`p=${ellipticData.selected.p}에서 #E(Fp)=${ellipticData.selected.pointCount} (무한원점 포함).`);
  }));
  for (const id of ['rx-coho-kind', 'rx-coho-p', 'rx-coho-filled', 'rx-coho-view']) {
    byId(id)?.addEventListener('change', () => guarded(() => {
      refreshCohomology(); notify('cohomology', id); report(`${cohoData.complex.name}: Betti [${cohoData.betti.join(', ')}], F_${cohoData.cohomology.p}.`);
    }));
  }
  required('rx-coho-dim').addEventListener('input', () => guarded(() => { refreshCohomology(); notify('cohomology', 'dimension'); }));
  required('rx-coho-dim').addEventListener('change', () => guarded(() => { refreshCohomology(); notify('cohomology', 'dimension-change'); }));

  guarded(() => { refreshPrimes(); refreshElliptic(); refreshCohomology(); mountGraph(); });
  return { render, snapshot, runChecks, scenes };
}

return {mountArithmeticUI};
})();
const __rx_module_5 = (() => {
const YM = __rx_module_2;
const { Scene3D, plot2D, palette, heatColor } = __rx_module_0;
const $ = id => document.getElementById(id);
const num = (value, digits = 5) => Number.isFinite(value) ? Number(value.toPrecision(digits)).toString() : '—';
function put(id, value) { $(id).textContent = value; }
function stats(id, entries) {
  const nodes = entries.map(([label, value]) => {
    const node = document.createElement('div'); node.className = 'rx-stat';
    const small = document.createElement('span'); small.textContent = label;
    const strong = document.createElement('strong'); strong.textContent = String(value);
    node.append(small, strong); return node;
  }); $(id).replaceChildren(...nodes);
}
function download(name, text, type) {
  const link = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type }));
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A selected hypothesis is separate from existence of some unknown positive gap. */
function createScenarioLean(baseSource, options) {
  const delta10 = Math.round(options.delta * 10), slice10 = Math.round(options.slice * 10);
  const labels = { 'SU(2)': 'SU(2)', 'SU(3)': 'SU(3)', G2: 'G2', arbitrary: 'arbitrary compact simple G' };
  if (!Object.hasOwn(labels, options.gauge) || !(delta10 > 0 && delta10 <= 40)) throw Error('Invalid Lean scenario.');
  return baseSource + '\n\n' + [
    '/- Selected MathScope scenario. GENERATED SOURCE: requires its own kernel check.',
    '   The selected positive lower bound is an ADDITIONAL USER AXIOM.',
    '   Changing the slider creates a different hypothesis, not a measured spectrum.',
    '   The BPST density observation is not used as evidence of this axiom. -/',
    'namespace MathScopeSelectedScenario',
    'open MathScopeConditionalYM',
    'def declaredGroup : GaugeGroupDeclaration :=',
    '  { name := "' + labels[options.gauge] + '", specification := "User-declared compact simple gauge group; realization required" }',
    'noncomputable def declaredDelta : ℝ := (' + delta10 + ' : ℝ) / 10',
    'noncomputable def selectedSlice : ℝ := (' + slice10 + ' : ℝ) / 10',
    'axiom declaredGroupHasRequiredStructure : IsCompactSimpleGaugeGroup declaredGroup',
    'axiom selectedModel : SpectralInterface',
    'axiom selectedExistenceAndGap :',
    '  IsNontrivialQuantumYMOnR4 declaredGroup selectedModel ∧ HasMassGap selectedModel declaredDelta',
    'theorem selected_gap_corollary :',
    '    ∀ E, 0 < E → E < declaredDelta → E ∉ selectedModel.spectrum := by',
    '  exact gap_excludes_open_interval selectedModel declaredDelta selectedExistenceAndGap.2',
    'theorem selected_slice_roundtrip (y : Point3) :',
    '    project3 (insertSlice selectedSlice y) = y := by',
    '  exact project_insert_slice selectedSlice y',
    '/- The following theorem needs the reconstruction certificate explicitly.',
    '   A density line integral is not such a certificate. -/',
    'theorem selected_observation_transfer (domain : Set Point4)',
    '    (certificate : ReconstructionCertificate domain) (P : Point4 → Prop)',
    '    (x : Point4) (hx : x ∈ domain)',
    '    (hObserved : P (certificate.reconstruct (project3 x))) : P x := by',
    '  exact property_of_certified_reconstruction domain certificate P x hx hObserved',
    '#print axioms selected_gap_corollary',
    '#print axioms selected_slice_roundtrip',
    '#print axioms selected_observation_transfer',
    'end MathScopeSelectedScenario', ''
  ].join('\n');
}

function mountYMUI({ onUpdate = () => {}, report = () => {}, recordClaim = null, leanBundle = {} } = {}) {
  const scene = new Scene3D($('rx-ym-canvas'));
  let field = null, options = null, pendingClaim = null, selectedSource = '', sourceName = '';
  function inputs() {
    return {
      gauge: $('rx-gauge').value, mode: $('rx-ym-mode').value,
      rho: Number($('rx-rho').value), slice: Number($('rx-slice').value), delta: Number($('rx-delta').value)
    };
  }
  function leanState() {
    const variant = $('rx-lean-variant').value;
    if (variant === 'core') {
      selectedSource = leanBundle.coreSource || '-- Source unavailable';
      sourceName = 'MathScopeConditionalYM_Core.lean';
      return { variant, validation: leanBundle.validation?.core || { status: 'SOURCE PREPARED' },
        scope: 'Lean Core의 추상 에너지 순서와 곱좌표 논리. 실제 ℝ·Lie group·Hilbert space·OS/Wightman 구성은 이 파일에 포함되지 않습니다.' };
    }
    if (variant === 'mathlib') {
      selectedSource = leanBundle.mathlibSource || '-- Source unavailable';
      sourceName = 'MathScopeConditionalYM.lean';
      return { variant, validation: leanBundle.validation?.mathlib || { status: 'SOURCE PREPARED · NOT COMPILED' },
        scope: 'Mathlib의 실수 에너지와 ℝ⁴ → ℝ³를 사용하는 조건부 인터페이스. 양자장·Hamiltonian·compact simple Lie group의 실제 구성은 별도 의무입니다.' };
    }
    selectedSource = createScenarioLean(leanBundle.mathlibSource || '', inputs());
    sourceName = 'MathScopeSelectedScenario.lean';
    const exactSourceChecked = selectedSource === leanBundle.scenarioSource;
    return { variant, validation: exactSourceChecked ? leanBundle.validation.scenario : { status: 'GENERATED SOURCE · NOT COMPILED', selectedInputs: inputs() },
      scope: '현재 G·Δ를 명시한 사용자 공리와 조건부 따름정리입니다. ' + (exactSourceChecked
        ? '현재 소스는 실제 검사한 기본 시나리오와 바이트 단위로 일치합니다. 결론은 명시한 사용자 공리에 의존합니다.'
        : '이 선택 소스는 별도 컴파일이 필요하며, 다른 소스의 검증 기록이 자동으로 적용되지 않습니다.') };
  }
  function renderLean() {
    const lean = leanState();
    $('rx-lean-source').value = selectedSource;
    put('rx-lean-status', lean.validation.status || 'SOURCE PREPARED');
    put('rx-lean-scope', lean.scope);
    $('rx-lean-meta').replaceChildren();
    const p = document.createElement('p');
    p.textContent = '사용자 공리 의존성을 #print axioms로 확인하세요. 소스 컴파일 기록은 현재 세션의 검증된 FORMAL PASS 인증서로 자동 승격되지 않습니다.';
    const pre = document.createElement('pre');
    const audit = lean.validation;
    pre.textContent = JSON.stringify({
      status: audit.status, toolchain: audit.toolchain, sourceSha256: audit.sourceSha256,
      checkedInputs: audit.inputs || audit.selectedInputs, theoremCount: audit.theoremCount,
      axiomFreeTheoremCount: audit.axiomFreeTheoremCount,
      standardAxiomsOnlyTheoremCount: audit.standardAxiomsOnlyTheoremCount,
      customAxiomDependentTheoremCount: audit.customAxiomDependentTheoremCount,
      customAxioms: audit.customAxioms, energyDomain: audit.energyDomain,
      command: audit.standardCommand, exitCode: audit.exitCode, axiomAudit: audit.log
    }, null, 2);
    $('rx-lean-meta').append(p, pre);
  }
  function ring(radius, axis) {
    return Array.from({ length: 49 }, (_, i) => {
      const a = 2 * Math.PI * i / 48, out = [radius * Math.cos(a), radius * Math.sin(a), 0];
      if (axis === 1) return [out[0], 0, out[1]];
      if (axis === 2) return [0, out[0], out[1]];
      return out;
    });
  }
  function render() {
    options = inputs();
    const group = YM.getGaugeGroupMetadata(options.gauge);
    put('rx-rho-value', options.rho.toFixed(2)); put('rx-slice-value', options.slice.toFixed(2)); put('rx-delta-value', options.delta.toFixed(2));
    $('rx-slice').disabled = options.mode !== 'slice';
    put('rx-gauge-note', group.fieldImplemented
      ? '표시 장: 고전 SU(2) BPST. 조건부 양자 이론의 군 선언과 장의 수치 자료를 별도로 기록합니다.'
      : '조건부 선언: ' + group.name + '. 아래 그림은 명시적으로 SU(2) BPST 기준장입니다. 선택한 G의 실제 장을 얻으려면 Lie algebra·불변 내적·검증된 표현/임베딩이 필요합니다.');
    field = YM.createYMField({ ...options, group: 'SU(2)', resolution: 17, extent: 3 });
    const reference = options.mode === 'slice' ? YM.bpstDensity4D({ rho: 1 }) : YM.bpstProjectedDensity3D({ rho: 1 });
    const logScale = value => Math.min(1, Math.log1p(9 * value / reference) / Math.log(10));
    const points = field.points.filter(p => p.value / reference >= 0.0001).map(p => ({
      pos: [p.x, p.y, p.z], color: heatColor(logScale(p.value)), radius: 1.5 + 1.9 * logScale(p.value),
      alpha: .15 + .65 * logScale(p.value),
      label: 'x=' + [p.x, p.y, p.z].map(x => num(x, 3)).join(',') + '; q=' + num(p.value, 6)
    }));
    const lines = field.isosurfaces.slice(0, 3).flatMap((iso, j) => [0, 1, 2].map(axis => ({
      points: ring(iso.radius, axis), color: palette[j], width: 1, dash: j === 2 ? [4, 4] : []
    })));
    scene.set({ points, lines, axes: ['x₁', 'x₂', 'x₃'], equalScale: true, bounds: [[-3, 3], [-3, 3], [-3, 3]], legend: ['SU(2) BPST', options.mode === 'slice' ? 'slice q₄' : 'integral q₃'] });
    stats('rx-ym-stats', [
      ['관측 원본 / 조건부 군', 'SU(2) / ' + group.name],
      ['중심 밀도', num(field.currentPeak)],
      ['∫ℝ³ 관측 밀도 (해석식)', num(field.analyticTotalOverR3)],
      ['밀도 단위', field.densityUnits]
    ]);
    put('rx-ym-caption',
      (options.mode === 'slice' ? 'x₄=' + options.slice.toFixed(2) + ' 단면 q₄(x,c).' : 'x₄ 전 범위를 적분한 스칼라 밀도 q₃=∫q₄dx₄.') +
      ' 고정 상자 [−3,3]³에서 표본화. 색은 절대 밀도에 log1p를 적용하며 ρ=1의 중심값 이상은 상한 색입니다. 선은 현재 중심 밀도의 75%·35%·12% 구면을 나타내는 원입니다. 좌표·밀도 클릭 조회 가능. 3D 장이나 양자 스펙트럼을 복원한 결과는 아닙니다.');
    const gap = YM.createGapCurve({ delta: options.delta, maxTime: 8, samples: 121 });
    plot2D($('rx-gap-canvas'), [{ points: gap.points.map(p => [p.time, p.value]), color: palette[1] }],
      { xLabel: 't (declared units)', yLabel: 'envelope exp(−Δt), C=1', xBounds: [0, 8], yBounds: [0, 1] });
    renderLean();
    if (pendingClaim && JSON.stringify(options) !== pendingClaim.inputKey) {
      put('rx-ym-claim-status', '입력이 변경되었습니다. 이전 Claim은 당시 입력의 기록이며 현재 선택값을 뒷받침하지 않습니다.');
      pendingClaim = null; $('rx-ym-assumption').checked = false;
    }
  }
  function snapshot() {
    if (!field) render();
    const current = inputs(), lean = leanState();
    return {
      module: 'yangmills', input: current,
      declaredGaugeGroup: YM.getGaugeGroupMetadata(current.gauge),
      displayedGaugeGroup: 'SU(2)',
      objectContract: YM.getYMModelContract(),
      representation: {
        sourceDimension: 4, displayDimension: 3,
        method: current.mode === 'slice' ? 'slice' : 'scalar line integral',
        map: field.interpretation, bounds: [[-3, 3], [-3, 3], [-3, 3]],
        sampling: { resolution: 17, count: field.points.length, renderedPoints: scene.data.points.length },
        loss: 'Connection/curvature and discarded coordinate are not reconstructed. Quantum spectra are not present.',
        colors: 'Fixed rho=1 peak reference; log1p; upper clipping; values remain unmodified.',
        inverseStatus: 'NO_GLOBAL_INVERSE'
      },
      numerical: { peak: field.currentPeak, analyticIntegral: field.analyticTotalOverR3, densityUnits: field.densityUnits, isosurfaces: field.isosurfaces },
      gap: YM.getGapSpectrumContract({ delta: current.delta }),
      conditionalClaim: pendingClaim,
      lean: { variant: lean.variant, filename: sourceName, validation: lean.validation, source: selectedSource },
      sources: YM.YM_SOURCES, grade: 'NUMERICAL INDICATOR'
    };
  }
  function runChecks() {
    const delta = 1.4, base = YM.bpstDensity4D({ rho: 1 }), after = YM.bpstDensity4D({ rho: 1 });
    return [
      { name: 'YM | ∫q₃ = 1 analytic normalization', pass: YM.createYMField({ mode: 'projection', resolution: 3 }).analyticTotalOverR3 === 1 },
      { name: 'YM | slice differs from line integral', pass: Math.abs(base - YM.bpstProjectedDensity3D({ rho: 1 })) > 1e-3 },
      { name: 'YM | Δ does not alter BPST density', pass: base === after && YM.gapEnvelope({ delta, time: 1 }) < YM.gapEnvelope({ delta: 1, time: 1 }) },
      { name: 'YM | arbitrary G has no fabricated field', pass: YM.createYMField({ group: 'arbitrary' }).available === false },
      { name: 'YM | selected Lean source preserves user axiom', pass: createScenarioLean('', { gauge: 'SU(2)', delta: 1.4, slice: 0 }).includes('axiom selectedExistenceAndGap') }
    ];
  }
  for (const id of ['rx-gauge', 'rx-ym-mode', 'rx-rho', 'rx-slice', 'rx-delta']) {
    $(id).addEventListener('input', () => { try { render(); onUpdate('yangmills'); } catch (error) { report(error.message, true); } });
  }
  $('rx-lean-variant').addEventListener('change', () => { renderLean(); onUpdate('yangmills'); });
  $('rx-lean-download').addEventListener('click', () => { renderLean(); download(sourceName, selectedSource, 'text/plain;charset=utf-8'); report(sourceName + ' 소스를 내보냈습니다.'); });
  $('rx-lean-copy').addEventListener('click', async () => {
    try { renderLean(); await navigator.clipboard.writeText(selectedSource); report('선택한 Lean 소스를 복사했습니다.'); }
    catch { report('복사 권한을 사용할 수 없습니다. 소스 상자에서 선택하거나 다운로드하세요.', true); }
  });
  $('rx-ym-claim').addEventListener('click', async () => {
    if (!$('rx-ym-assumption').checked) { put('rx-ym-claim-status', '사용자 가정으로 기록할 항목을 체크하면 조건부 Claim을 생성할 수 있습니다.'); return; }
    const o = inputs();
    pendingClaim = {
      status: 'RESEARCH HYPOTHESIS', inputKey: JSON.stringify(o), createdAt: new Date().toISOString(),
      statement: '선언한 G에 비자명한 양자 Yang–Mills 모델 M과 HasMassGap(M, ' + o.delta + ')가 있다고 가정하면 spec(M)∩(0,' + o.delta + ')=∅.',
      assumptions: [
        'G의 compact simple 구조는 외부에서 실현·검증해야 한다.',
        'IsNontrivialQuantumYMOnR4는 아직 전체 OS/Wightman 공리로 확장되지 않은 의미 인터페이스이다.',
        '선택한 Δ=' + o.delta + '에서의 존재·간극은 추가 사용자 공리이며 수치 관측으로 얻은 결과가 아니다.',
        '3D 관측에서 원본 성질을 도출하려면 명시적 복원 인증서 또는 스펙트럼 포함 조건이 필요하다.'
      ],
      observation: { gauge: 'SU(2)', mode: o.mode, rho: o.rho, slice: o.slice },
      source: createScenarioLean(leanBundle.mathlibSource || '', o),
      compilationStatus: 'GENERATED SOURCE · NOT COMPILED'
    };
    if (pendingClaim.source === leanBundle.scenarioSource) {
      pendingClaim.compilationStatus = leanBundle.validation.scenario.status;
      pendingClaim.exactSourceAudit = leanBundle.validation.scenario.sourceSha256;
    }
    put('rx-ym-claim-status', '조건부 Claim 생성: ' + pendingClaim.statement + ' 사용자 공리와 선택 입력을 함께 기록합니다.');
    $('rx-lean-variant').value = 'scenario'; renderLean(); onUpdate('yangmills');
    if (recordClaim) {
      try { await recordClaim(snapshot()); }
      catch (error) { report('Claim은 화면에 생성했지만 세션 기록에 실패했습니다: ' + error.message, true); }
    }
  });
  return { render, snapshot, runChecks, scenes: { ym: scene } };
}

return {createScenarioLean,mountYMUI};
})();
const __rx_module_6 = (() => {
const NS = __rx_module_3;
const { Scene3D, plot2D, palette, heatColor } = __rx_module_0;
const length = (v) => Math.hypot(...v);
const fmt = (value, digits = 3) => {
  if (!Number.isFinite(value)) return '해당 없음';
  if (value === 0) return '0';
  return Math.abs(value) < 0.001 || Math.abs(value) >= 10000 ? value.toExponential(2) : Number(value.toPrecision(digits)).toString();
};
const clone = (x) => JSON.parse(JSON.stringify(x));

/** Mount the NS module into the existing rx-ns-* / rx-tau / rx-viscosity DOM. */
function mountNSUI({ onUpdate = () => {}, report = () => {} } = {}) {
  const required = (id) => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Navier–Stokes UI element missing: ${id}`);
    return el;
  };
  const el = {
    mode: required('rx-ns-mode'), tau: required('rx-tau'), tauValue: required('rx-tau-value'),
    h: required('rx-ns-h'), frame: required('rx-ns-frame'), time: required('rx-ns-time'),
    timeValue: required('rx-ns-time-value'), viscosity: required('rx-viscosity'),
    run: required('rx-ns-run'), canvas: required('rx-ns-canvas'), grade: required('rx-ns-grade'),
    caption: required('rx-ns-caption'), stats: required('rx-ns-stats'),
    graph: required('rx-ns-scale-canvas'), diagnostics: required('rx-ns-diagnostics')
  };
  const ns = new Scene3D(el.canvas);
  let scheduled = 0, current = null, lastError = null, initializing = true;
  let graphLegend = document.getElementById('rx-ns-graph-legend');
  if (!graphLegend) {
    graphLegend = document.createElement('div'); graphLegend.id = 'rx-ns-graph-legend';
    graphLegend.className = 'rx-note'; el.graph.insertAdjacentElement('afterend', graphLegend);
  }
  const formula = document.getElementById('rx-ns-formula') || el.mode.closest('.rx-controls')?.querySelector('.rx-formula');
  if (formula) formula.style.whiteSpace = 'pre-line';
  const plotTitle = el.graph.closest('.card')?.querySelector('.card-title');

  function readOptions() {
    const mode = el.mode.value;
    const a = Number(el.tau.value);
    if (!Number.isFinite(a)) throw new RangeError('τ의 로그 지수를 확인해주세요.');
    const viscosity = Number(el.viscosity.value);
    if (!el.viscosity.checkValidity()) throw new RangeError('점성 ν는 입력란의 허용 범위에서 양수로 설정해주세요.');
    return NS.normalizeOptions({
      mode, tau: 10 ** (-a), h: Number(el.h.value),
      frame: mode === 'paper-core' ? el.frame.value : 'physical',
      time: mode === 'taylor-green' ? Number(el.time.value) : 0,
      viscosity, resolution: 9, extent: 2.5, rMin: 0.65, rMax: 2.5, cInfinity: 1
    });
  }

  function configureControls(mode) {
    const benchmark = mode === 'taylor-green';
    el.tau.disabled = benchmark; el.h.disabled = benchmark;
    el.frame.disabled = mode !== 'paper-core';
    if (el.frame.disabled) el.frame.value = 'physical';
    el.time.disabled = !benchmark; el.viscosity.disabled = false;
    el.timeValue.textContent = Number(el.time.value).toFixed(2);
    el.tauValue.textContent = fmt(10 ** (-Number(el.tau.value)), 4);
    el.run.textContent = mode === 'paper-exterior' ? '논문 외곽식 다시 계산' : benchmark ? '정확한 기준해 다시 계산' : 'core 도식 다시 계산';
  }

  function stats(items) {
    el.stats.replaceChildren();
    for (const [label, value] of items) {
      const box = document.createElement('div'), title = document.createElement('span'), number = document.createElement('strong');
      box.className = 'rx-stat'; title.textContent = label; number.textContent = value;
      box.append(title, number); el.stats.append(box);
    }
  }

  function detail(paragraphs) {
    el.diagnostics.replaceChildren();
    for (const text of paragraphs) { const p = document.createElement('p'); p.textContent = text; el.diagnostics.append(p); }
  }

  function legend(items, tail = '') {
    graphLegend.replaceChildren();
    for (const [index, name] of items.entries()) {
      const item = document.createElement('span'); item.style.color = palette[index]; item.style.marginRight = '14px';
      item.textContent = '● ' + name; graphLegend.append(item);
    }
    if (tail) { const note = document.createElement('div'); note.textContent = tail; graphLegend.append(note); }
  }

  function drawGraph(o, d) {
    if (o.mode === 'paper-exterior') {
      if (plotTitle) plotTitle.textContent = '실제 외곽식 · 반경과 속력';
      const currentK = [], limitK = [], rootNu = Math.sqrt(o.viscosity);
      for (let i = 0; i <= 64; i++) {
        const r = rootNu * (o.rMin + (o.rMax - o.rMin) * i / 64);
        currentK.push([r, NS.samplePoint([r, 0, 0], o).speed]);
        limitK.push([r, rootNu * o.cInfinity * (r * r / (2 * o.viscosity)) ** (-0.5 - o.h)]);
      }
      plot2D(el.graph, [{ points: currentK, color: palette[0] }, { points: limitK, color: palette[1] }], { xLabel: 'physical r > 0', yLabel: 'Kν(r, τ)', xBounds: [rootNu * o.rMin, rootNu * o.rMax], yBounds: [0, limitK[0][1] * 1.08] });
      legend(['현재 τ의 K(r)', 'τ→0⁺ 외곽 극한'], 'H(0)=1로 계산한 극한입니다. 고정 r>0에서 외곽 속력은 유한합니다.');
      el.graph.setAttribute('aria-label', `논문 외곽식의 반경별 속력. 현재 τ=${o.tau}의 K와 τ가 0으로 접근하는 외곽 극한. 물리 반경은 ${rootNu * o.rMin}에서 ${rootNu * o.rMax}, 점성은 ${o.viscosity}입니다.`);
      return { kind: 'radial-heat-exterior', x: 'r', y: 'K', series: [{ label: 'current K', points: currentK }, { label: 'limit at fixed positive r', points: limitK }] };
    }
    if (o.mode === 'taylor-green') {
      if (plotTitle) plotTitle.textContent = '기준해 · 평균 운동에너지의 시간 변화';
      const maxTime = Math.max(2, o.time + 0.5), energy = [];
      for (let i = 0; i <= 80; i++) {
        const t = maxTime * i / 80;
        energy.push([t, o.amplitude ** 2 * Math.exp(-4 * o.viscosity * o.waveNumber ** 2 * t) / 4]);
      }
      const mark = [[o.time, 0], [o.time, d.meanKineticEnergy]];
      plot2D(el.graph, [{ points: energy, color: palette[0] }, { points: mark, color: palette[1] }], { xLabel: 'time t', yLabel: 'mean kinetic energy', xBounds: [0, maxTime], yBounds: [0, o.amplitude ** 2 / 4 * 1.08] });
      legend(['E(t)=a(t)²/4', '현재 시각'], 'E는 (2π)³ 주기 상자에서의 공간 평균 운동에너지입니다.');
      el.graph.setAttribute('aria-label', `Taylor Green 기준해의 평균 운동에너지 시간곡선. 점성 ${o.viscosity}, 현재 시각 ${o.time}, 현재 평균 에너지 ${d.meanKineticEnergy}.`);
      return { kind: 'taylor-green-mean-energy', x: 'time', y: 'mean kinetic energy', series: [{ label: 'E(t)', points: energy }], currentTime: o.time };
    }
    if (plotTitle) plotTitle.textContent = 'core · 이론 스케일과 도식의 에너지';
    const maxLog = Math.max(4, Number(el.tau.max) || 4), data = NS.scalingSeries({ ...o, count: 65, maxLog });
    const values = [
      { label: 'log₁₀ ℓᵣ', key: 'log10Radius' },
      { label: 'log₁₀ ℓ𝓏', key: 'log10AxialLength' },
      { label: 'log₁₀ U', key: 'log10Velocity' },
      { label: 'log₁₀ Ecore', key: 'log10Energy' }
    ];
    const series = values.map((s, i) => ({ label: s.label, points: data.map((p) => [-Math.log10(p.tau), p[s.key]]), color: palette[i] }));
    plot2D(el.graph, series, { xLabel: '−log₁₀ τ', yLabel: 'log₁₀ normalized scale', xBounds: [0, maxLog] });
    legend(values.map((s) => s.label), '논문의 점근 지수를 정규화한 이론 곡선입니다. 아래 도식의 전체 해나 원 논문의 외력을 인증하지 않습니다.');
    el.graph.setAttribute('aria-label', 'τ가 0으로 접근할 때 반경과 축 길이, 속력과 core 에너지의 정규화된 이론 스케일. 로그 축이며 본문의 실제 전체 해를 계산한 그래프는 아닙니다.');
    return { kind: 'paper-core-asymptotic-scales', x: '-log10 tau', y: 'log10 normalized scale', series: series.map(({ label, points }) => ({ label, points })) };
  }

  function sceneData(field, o) {
    const s = field.scales, physicalCore = o.mode === 'paper-core' && o.frame === 'physical';
    const referenceExtent = 2.5 * Math.sqrt(o.viscosity);
    const bounds = physicalCore ? [[-referenceExtent, referenceExtent], [-referenceExtent, referenceExtent], [-referenceExtent, referenceExtent]] : [0, 1, 2].map((a) => [field.bounds.min[a], field.bounds.max[a]]);
    const span = Math.max(...bounds.map(([a, b]) => b - a));
    const maxVector = Math.max(...field.points.map((p) => length(p.displayVelocity)));
    const targetLength = physicalCore ? 0.40 * s.radialLength : span * 0.072;
    const arrowFactor = maxVector > 0 ? targetLength / maxVector : 0;
    const color = (speed) => heatColor(field.maxSpeed > 0 ? speed / field.maxSpeed : 0);
    const visible = field.points.filter((p) => p.speed > field.maxSpeed * 0.015);
    const points = visible.map((p) => ({ pos: p.displayPosition, color: color(p.speed), radius: o.mode === 'paper-exterior' ? 1.8 : 1.25, alpha: 0.5, label: `x=(${p.position.map((v) => fmt(v)).join(', ')}) |u|=${fmt(p.speed)}` }));
    const arrows = visible.map((p) => ({ pos: p.displayPosition, vector: p.displayVelocity.map((v) => v * arrowFactor), color: color(p.speed) }));
    const lines = [];
    if (o.mode === 'paper-exterior') {
      for (const baseR of [0.8, 1.3, 2.1]) for (const baseZ of [-1.1, 1.1]) {
        const r = baseR * Math.sqrt(o.viscosity), z = baseZ * Math.sqrt(o.viscosity);
        const speed = NS.samplePoint([r, 0, z], o).speed;
        lines.push({ points: Array.from({ length: 65 }, (_, j) => [r * Math.cos(j * Math.PI / 32), r * Math.sin(j * Math.PI / 32), z]), color: color(speed), width: 1.1 });
      }
    } else if (o.mode === 'paper-core') {
      for (const zSign of [-1, 1]) for (let j = 0; j < 4; j++) {
        const theta = j * Math.PI / 2;
        const seed = [0.8 * s.radialLength * Math.cos(theta), 0.8 * s.radialLength * Math.sin(theta), zSign * 0.35 * s.axialLength];
        const stream = NS.traceStreamline(seed, { ...o, steps: 65, stepSize: 0.025 * s.radialLength });
        lines.push({ points: stream.points.map((p) => p.displayPosition), color: '#698d9c', width: 1 });
      }
    }
    const axes = o.mode === 'paper-core' && o.frame === 'similarity' ? ['x / ℓᵣ', 'y / ℓᵣ', 'z / ℓ𝓏'] : ['x', 'y', 'z'];
    return { data: { points, arrows, lines, bounds, equalScale: true, axes, legend: [`speed 0 → ${fmt(field.maxSpeed)}`] }, arrowFactor, rawSampleCount: field.points.length, displayedSampleCount: visible.length, colorRange: [0, field.maxSpeed], physicalBoundsFixed: physicalCore, streamlineType: 'frozen-time, not particle trajectories' };
  }

  function textFor(o, field, d, drawing) {
    el.grade.textContent = o.mode === 'paper-exterior' ? 'PAPER FORMULA · NUMERICAL' : o.mode === 'taylor-green' ? 'EXACT BENCHMARK' : 'SCHEMATIC · DIV-FREE';
    el.grade.classList.toggle('warn', o.mode === 'paper-core');
    const arrowNote = `화살표에는 공통 표시 배율 ${fmt(drawing.arrowFactor)}을 곱했습니다. 색은 실제 표본 속력 0–${fmt(field.maxSpeed)}에 대응하며, 매 입력에서 색 범위를 다시 계산합니다. 매우 작은 속력의 표본은 그림에서 생략합니다.`;
    if (o.mode === 'paper-exterior') {
      if (formula) formula.textContent = 'A = 1/2 + h, s = r²/2, τ = 1−t\nH(Z) = Γ(1+h)⁻¹ ∫₀∞ e⁻ᵛ vʰ(1+Zv)⁻ʰ dv\nK₁(r,t) = c∞ s⁻ᴬ H(2τ/s)\nKν(r,t) = √ν K₁(r/√ν,t), uν = Kν eθ';
      const rLo = Math.sqrt(o.viscosity) * o.rMin, rHi = Math.sqrt(o.viscosity) * o.rMax;
      el.caption.textContent = `논문 식 (4.29), Lemma A.6의 실제 외곽식입니다. ν=${fmt(o.viscosity)}, c∞=1, 물리 반경 r∈[${fmt(rLo)}, ${fmt(rHi)}]이며 r=0은 제외합니다. ν=1 공식을 √ν로 재척도화했습니다. 선은 고정 시각의 원형 유선입니다. ${arrowNote}`;
      el.canvas.setAttribute('aria-label', `논문 heat exterior의 원형 속도장. 축을 제외한 물리 반경 ${rLo}부터 ${rHi}까지 표본화했고, 최대 표본 속력은 ${field.maxSpeed}입니다. 외곽식 단독은 R3 유한 에너지 해가 아닙니다.`);
      stats([['τ = 1−t', fmt(o.tau)], ['물리 반경 · 축 제외', `${fmt(rLo)}–${fmt(rHi)}`], ['최대 표본 속력', fmt(field.maxSpeed)], ['점성 ν / 정규화 c∞', `${fmt(o.viscosity)} / 1`], ['상대 ∇·u 진단', fmt(d.divergenceRelative)], ['상대 NS 잔차 진단', fmt(d.relativeMomentumResidual)]]);
      detail([
        '원문 직접식: 첨부 논문 p.138의 적분식 (A.32)과 외곽 회전장 (A.33)을 수치적으로 평가했습니다. H와 미분값은 적응형 수치적분을 사용합니다.',
        `현재 검사점 (${d.point.position.map((v) => fmt(v)).join(', ')})에서 heat equation 잔차는 ${fmt(d.heatEquationResidual)}, 중앙차분 NS 상대 잔차는 ${fmt(d.relativeMomentumResidual)}입니다. 이는 부동소수점 진단입니다.`,
        'c∞=1은 표시 정규화입니다. 관측창은 r/√ν∈[0.65,2.5]이며, 선택한 h와 이 반경은 전체 증명에서 선택된 상수와 외곽 경계 Xb의 수치 인증이 아닙니다.',
        '외곽식 단독은 z에 독립이고 축을 제외하므로 R³의 유한에너지해가 아닙니다. compact support, 유계 에너지, 정지 초기조건은 core·펄스·보정·국소화를 모두 합친 원 논문의 정리에 속합니다.',
        '압력은 p=−∫ᵣ∞K(ρ,t)²/ρ dρ로 정규화됩니다. 여기서는 운동량 검사용 압력 기울기를 계산하며 압력장 전체의 표본값은 만들지 않습니다.',
        '전체 펄스, 모든 차수의 외력 상쇄, 전역 접합 및 OpenAI Lean 저장소의 재빌드는 이 관측의 검증 범위에 포함되지 않습니다.'
      ]);
      return;
    }
    if (o.mode === 'taylor-green') {
      if (formula) formula.textContent = 'a(t) = exp(−2νt)\nu = (a sin x cos y, −a cos x sin y, 0)\np = (a²/4)(cos 2x + cos 2y)\nEmean(t) = a(t)² / 4';
      el.caption.textContent = `독립적인 Taylor–Green 기준해입니다. (R/2πZ)³에 놓았으며 z에 따른 변화가 없는 2차원 흐름의 3차원 표현입니다. ${arrowNote}`;
      el.canvas.setAttribute('aria-label', `Taylor Green의 z 독립 주기 속도장. 시각 ${o.time}, 점성 ${o.viscosity}, 최대 표본 속력 ${field.maxSpeed}. 논문의 blowup 해와 별개의 기준해입니다.`);
      stats([['시각 t', fmt(o.time)], ['점성 ν', fmt(o.viscosity)], ['최대 표본 속력', fmt(field.maxSpeed)], ['평균 운동에너지', fmt(d.meanKineticEnergy)], ['평균 enstrophy', fmt(d.meanEnstrophy)], ['평균 점성 소산률', fmt(d.meanViscousDissipation)]]);
      detail([
        '정확한 주기 기준해를 직접 평가합니다. 외력은 0이며, 속도·압력식을 NS 방정식에 대입하면 만족합니다. 현재 그래프는 PDE 시간적분 알고리즘의 결과가 아닙니다.',
        `검사점의 중앙차분 상대 NS 잔차는 ${fmt(d.relativeMomentumResidual)}, 상대 발산 진단은 ${fmt(d.divergenceRelative)}입니다. 정확한 공식의 부동소수점 평가와 독립 차분을 비교합니다.`,
        '평균 운동에너지는 ½⟨|u|²⟩, 평균 enstrophy는 ½⟨|curl u|²⟩입니다. 에너지 그래프는 ν에 따른 정확한 지수 감쇠를 표시합니다.',
        '이 기준해는 모든 시각에서 매끈하게 감쇠합니다. 원 논문의 정지 초기조건·유한시간 blowup 구성과 연결해 동일한 해로 기록하지 않습니다.',
        'z축의 여러 층은 같은 2차원 속도장을 반복한 것입니다. 일반적인 3차원 와류 신장이나 임의 초기조건의 정칙성을 이 예제로 판정하지 않습니다.'
      ]);
      return;
    }
    if (formula) formula.textContent = 'ℓᵣ ∼ τ¹ᐟ², ℓ𝓏 ∼ τ¹ᐟ²⁻ʰ\nU ∼ τ⁻¹ᐟ²⁻ʰ, Ecore ∼ τ¹ᐟ²⁻³ʰ\nΨ = ½ ℓᵣ² U R²(Z+0.12)e⁻ᴿ²⁻ᶻ²\nuᵣ = −r⁻¹∂zΨ, u𝓏 = r⁻¹∂rΨ';
    const referenceExtent = fmt(2.5 * Math.sqrt(o.viscosity));
    const frameNote = o.frame === 'physical' ? `물리 좌표는 현재 ν의 τ=1 축 범위 [−${referenceExtent},${referenceExtent}]를 고정하여 τ에 따른 수축을 유지합니다. 작은 core를 자세히 보려면 유사 좌표를 선택하세요.` : '각 좌표를 ℓᵣ 또는 ℓ𝓏로 나누어 core를 확대했습니다. 이 화면에서 크기가 유지되는 것은 좌표 재조정의 결과입니다.';
    el.caption.textContent = `논문의 스케일을 따르는 별도 발산 0 도식입니다. 원 논문의 실제 profile이나 외력을 계산한 장은 아닙니다. ${frameNote} ${arrowNote} 회색 선은 고정 시각 유선입니다.`;
    el.canvas.setAttribute('aria-label', `논문 core 스케일에 맞춘 별도의 발산 없는 와류 도식. τ=${o.tau}, h=${o.h}, 좌표계 ${o.frame}. 전체 논문의 blowup 해를 재현하지 않습니다.`);
    stats([['τ = 1−t', fmt(o.tau)], ['반경 스케일 ℓᵣ', fmt(field.scales.radialLength)], ['축 스케일 ℓ𝓏', fmt(field.scales.axialLength)], ['ℓ𝓏 / ℓᵣ', fmt(field.scales.aspectRatio)], ['최대 도식 표본 속력', fmt(field.maxSpeed)], ['도식의 R³ 총 운동에너지', fmt(d.analyticSchematicEnergy)]]);
    detail([
      '도식은 명시적 streamfunction에서 만들었습니다. uᵣ=−r⁻¹∂zΨ, u𝓏=r⁻¹∂rΨ와 축대칭 회전 성분을 사용하므로 발산은 해석적으로 0입니다.',
      `중앙차분 상대 발산 진단은 ${fmt(d.divergenceRelative)}입니다. 이 도식에는 원 논문의 압력이나 매끈한 외력의 증명서가 없으므로 NS 운동량 잔차를 PASS로 표시하지 않습니다.`,
      `표시한 총 에너지 ${fmt(d.analyticSchematicEnergy)}는 이 Gaussian 도식 자체의 R³ 적분입니다. 그래프의 Ecore∼τ^(1/2−3h)는 원 논문의 core 점근 법칙을 별도로 표시합니다.`,
      `선택된 h=${o.h}는 0<h<0.01에 속하지만, 원 논문은 적절한 고정 h와 profile의 존재를 구성합니다. 이 슬라이더의 모든 h에서 그 profile 전체를 계산했다는 뜻은 아닙니다.`,
      '이 도식에는 정지 초기조건용 시간 cutoff, compact 공간 cutoff, 외곽 접합, 진동 펄스와 무한차수 상쇄를 적용하지 않았습니다. source theorem과의 공통점은 명시된 수축·속도·에너지 지수입니다.',
      '3D 카메라 회전은 보존한 좌표를 다시 관측하는 동작입니다. 그림을 회전하거나 더 촘촘히 표본화해도 원 논문의 증명 상태가 바뀌지는 않습니다.'
    ]);
  }

  function snapshot() {
    return clone(current ? {
      schema: 'MathScope.NavierStokesObservation.v1', valid: lastError === null, error: lastError,
      options: current.options, controls: { tauLog10: Number(el.tau.value), requestedFrame: el.frame.value, requestedTime: Number(el.time.value), requestedViscosity: Number(el.viscosity.value) },
      results: current.summary, graph: current.graph,
      representation: { ...current.representation, camera: { yaw: ns.yaw, pitch: ns.pitch, zoom: ns.zoom } }, sourceLedger: NS.sourceLedger,
      contract: { sourceTheorem: NS.metadata.theorem, displayedMode: current.options.mode, displayedStatus: current.status, finiteSamples: true, floatingPoint: true, completePaperSolution: false, globalGluingImplemented: false, externalLeanRebuilt: false, cameraChangesMathematics: false, pressureSamplesAvailable: current.options.mode === 'taylor-green' }
    } : { schema: 'MathScope.NavierStokesObservation.v1', valid: false, error: lastError ?? 'Not rendered', sourceLedger: NS.sourceLedger });
  }

  function render() {
    if (scheduled) { cancelAnimationFrame(scheduled); scheduled = 0; }
    configureControls(el.mode.value);
    try {
      const o = readOptions(), field = NS.sampleField(o), d = NS.diagnostics(o), drawing = sceneData(field, o);
      ns.set(drawing.data); textFor(o, field, d, drawing);
      const graph = drawGraph(o, d);
      current = {
        options: o, status: field.status, graph,
        summary: { sampleCount: field.points.length, maximumSampleSpeed: field.maxSpeed, diagnosticPoint: d.point.position, divergenceRelative: d.divergenceRelative, momentumResidual: d.momentumResidual, relativeMomentumResidual: d.relativeMomentumResidual ?? null, heatEquationResidual: d.heatEquationResidual ?? null, meanKineticEnergy: d.meanKineticEnergy ?? null, meanEnstrophy: d.meanEnstrophy ?? null, meanViscousDissipation: d.meanViscousDissipation ?? null, analyticSchematicEnergy: d.analyticSchematicEnergy ?? null, scales: o.mode === 'paper-core' ? field.scales : null, standaloneWholeSpaceFiniteEnergy: d.standaloneWholeSpaceFiniteEnergy ?? null },
        representation: { kind: 'CPU orthographic 3D field', axes: drawing.data.axes, bounds: drawing.data.bounds, equalScale: true, fixedPhysicalCoreBounds: drawing.physicalBoundsFixed, camera: { yaw: ns.yaw, pitch: ns.pitch, zoom: ns.zoom }, arrowCommonFactor: drawing.arrowFactor, colorQuantity: 'physical sampled speed', colorRange: drawing.colorRange, colorRangeRecomputedPerInput: true, suppressedBelowRelativeSpeed: 0.015, displayedSampleCount: drawing.displayedSampleCount, streamlines: drawing.streamlineType, frameNote: field.frameNote }
      };
      lastError = null; if (!initializing) onUpdate(snapshot());
      return snapshot();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      current = null;
      el.grade.textContent = 'INPUT / COMPUTE ERROR'; el.grade.classList.add('warn');
      el.caption.textContent = '현재 입력의 계산이 완료되지 않았습니다. 입력값을 확인해주세요.';
      stats([]); detail([lastError]); ns.set({ bounds: [[-1, 1], [-1, 1], [-1, 1]], equalScale: true });
      const context = el.graph.getContext('2d'); context.clearRect(0, 0, el.graph.width, el.graph.height);
      el.graph.dataset.renderReady = 'false'; graphLegend.textContent = '현재 입력의 그래프를 계산하지 못했습니다.';
      report('Navier–Stokes 계산 오류: ' + lastError); if (!initializing) onUpdate(snapshot()); return snapshot();
    }
  }

  function runChecks() {
    const checks = [];
    const check = (name, fn) => { try { const result = fn(); checks.push({ name, pass: Boolean(result.pass), detail: result.detail }); } catch (e) { checks.push({ name, pass: false, detail: String(e.message || e) }); } };
    check('NS · 논문 heat profile 정규화와 ODE', () => {
      const h = 0.005, z = NS.heatProfile(0, h), p = NS.heatProfile(2, h);
      return { pass: Math.abs(z.H - 1) < 1e-8 && Math.abs(z.dH + h * (1 + h)) < 1e-9 && Math.abs(p.odeResidual) < 3e-8, detail: `H(0)=${fmt(z.H, 8)}, ODE residual=${fmt(p.odeResidual)}` };
    });
    check('NS · 실제 외곽식 운동량·발산 독립 차분', () => {
      const d = NS.diagnostics({ mode: 'paper-exterior', tau: 0.1, viscosity: 1 });
      return { pass: d.relativeMomentumResidual < 1e-6 && d.divergenceRelative < 1e-7 && d.axisIncluded === false && d.standaloneWholeSpaceFiniteEnergy === false, detail: `relative momentum=${fmt(d.relativeMomentumResidual)}, divergence=${fmt(d.divergenceRelative)}; r=0 excluded` };
    });
    check('NS · core 도식의 발산과 검증 범위', () => {
      const d = NS.diagnostics({ mode: 'paper-core', tau: 0.001 });
      return { pass: d.divergenceRelative < 1e-7 && d.momentumResidual === null && d.sameForcingAsPaper === false, detail: `relative divergence=${fmt(d.divergenceRelative)}; smooth-force certificate absent` };
    });
    check('NS · Taylor–Green 운동량·에너지 기준값', () => {
      const o = { mode: 'taylor-green', viscosity: 0.6, time: 0.4 }, d = NS.diagnostics(o), expected = Math.exp(-4 * o.viscosity * o.time) / 4;
      return { pass: d.relativeMomentumResidual < 1e-6 && Math.abs(d.meanKineticEnergy - expected) < 1e-12, detail: `relative momentum=${fmt(d.relativeMomentumResidual)}, mean energy=${fmt(d.meanKineticEnergy)}` };
    });
    check('NS · 원 논문 similarity 좌표 왕복', () => {
      const o = { tau: 1e-8, h: 0.005, viscosity: 1 }, a = NS.fromSimilarity({ X: 0.7, eta: -0.4, theta: 0.5 }, o), b = NS.toSimilarity(a.position, o);
      return { pass: Math.abs(b.X - 0.7) < 1e-10 && Math.abs(b.eta + 0.4) < 1e-10, detail: 'Equation (3.2) at τ=1e−8' };
    });
    return checks;
  }

  const queueRender = () => { if (!scheduled) scheduled = requestAnimationFrame(() => { scheduled = 0; render(); }); };
  for (const control of [el.mode, el.tau, el.h, el.frame, el.time, el.viscosity]) {
    control.addEventListener('input', queueRender); control.addEventListener('change', queueRender);
  }
  el.run.addEventListener('click', render);
  render();
  initializing = false;
  return { render, snapshot, runChecks, scenes: { ns } };
}


return {mountNSUI};
})();
const __rx_module_7 = (() => {
/** Translate bounded experimental observations into the existing typed session.
 * The existing audited verifier remains the sole issuer of formal certificates.
 */
const EXTENSION_VERSION = '0.1.0';
function createResearchBundle(snapshot, { session, inputsHash, createdAt = new Date().toISOString() }) {
  if (!snapshot || !['primes', 'cohomology', 'yangmills', 'navier'].includes(snapshot.module)) throw Error('Unknown extension module.');
  if (!session || !inputsHash) throw Error('Session and exact input hash are required.');
  const module = snapshot.module, input = snapshot.input || snapshot.options || {};
  const prefix = 'rx-' + module, objectId = prefix + '-object', repId = prefix + '-representation', claimId = prefix + '-claim';
  function revision(group, id) {
    const old = (session[group] || []).find(n => n.id === id);
    const count = Number(String(old?.revision || '').match(/:r(\d+)$/)?.[1] || 0);
    return { revision: id + ':r' + (count + 1), parentRevision: old?.revision || null };
  }
  const cohoDim = input.kind === 'torus' ? Number(input.dimension || 3)
    : input.kind === 'circle' || (input.kind === 'triangle' && input.filled === false) ? 1 : 2;
  const dims = { primes: [1, 1], cohomology: [cohoDim, input.kind === 'rp2' ? 4 : cohoDim * 2], yangmills: [4, 4], navier: [3, 3] }[module];
  const kind = { primes: 'ArithmeticFunctionFamily', cohomology: 'FiniteCWModel', yangmills: 'ClassicalGaugeDensity', navier: 'VelocityFieldSample' }[module];
  const provenance = { source: 'MathScope Research Extensions', adapterVersion: EXTENSION_VERSION, capturedAt: createdAt, execution: 'Browser finite computation' };
  const conditional = module === 'yangmills' && snapshot.conditionalClaim;
  const assumptions = conditional ? snapshot.conditionalClaim.assumptions : [
    'Displayed finite samples and floating-point computations have the stated model scope.',
    'A visual representation or a local compilation audit does not issue an audited proof certificate.'
  ];
  const object = {
    id: objectId, type: kind, baseField: 'R', intrinsicDim: dims[0], ambientDim: dims[1],
    structures: [module, 'explicit-model', 'bounded-observation'], domainRef: null,
    ...revision('objects', objectId), assumptions, provenance, hash: inputsHash,
    definition: snapshot.objectContract || snapshot.results?.complex || null, input,
    coefficientField: module === 'cohomology' ? 'F_' + (input.p || 3) : null,
    dimensionNote: module === 'cohomology' ? 'Underlying finite CW model dimension; cohomology degree and coefficient field are separate data.' : null
  };
  const observed = snapshot.representation || {};
  const map = module === 'yangmills'
    ? (input.mode === 'slice' ? 'q4(y,c): 4D scalar-density restriction to x4=c' : 'q3(y)=integral_R q4(y,t) dt: scalar marginal')
    : module === 'primes' ? '(x, ratio(x), sequence lane)' : module === 'cohomology'
      ? 'Labeled coordinates from cohomological degree/basis or cochain degree-filtration dimensions'
      : 'Finite velocity samples at the specified time and coordinate frame';
  const rep = {
    id: repId, sourceObjectRef: objectId,
    method: module === 'yangmills' ? (input.mode === 'slice' ? 'slice' : 'user-defined') : 'sampled-finite',
    displayDim: 3, mapDefinition: map, parameters: { input, contract: observed, camera: snapshot.camera || null },
    sampling: observed.sampling || { mode: 'bounded explicit computation', count: 'recorded in observation' },
    injectivityStatus: module === 'yangmills' ? 'NON_INJECTIVE' : 'NOT_APPLICABLE_TO_DATA_LAYOUT',
    ambiguityRef: { type: 'representation-contract', description: 'Labels, sampling and model assumptions remain part of the observation.' },
    fidelityVector: { topology: null, metric: null, spectral: null, dynamics: null },
    lostDimensions: module === 'yangmills' ? ['x4'] : [],
    discardedCoordinates: module === 'yangmills' ? ['x4'] : [],
    inverseStatus: module === 'yangmills' ? 'NO_GLOBAL_INVERSE' : 'NO_GEOMETRIC_RECONSTRUCTION_CLAIM',
    provenance, ...revision('representations', repId), stale: false, freshness: 'CURRENT'
  };
  const statements = {
    primes: 'Recorded finite prime counts, normalized ratios, and elliptic-curve good-prime data at the specified inputs; no asymptotic or conjecture proof.',
    cohomology: 'Recorded cohomology of the explicitly supplied finite cellular/simplicial complex over Fp; comparison-theorem references do not turn it into a prismatic computation.',
    yangmills: 'Recorded a finite observation of the explicit classical SU(2) BPST scalar density; the declared gauge group and quantum-gap hypothesis are separate.',
    navier: 'Recorded the selected Navier–Stokes analytic component, schematic field, or independent benchmark at explicit finite inputs; no full-paper rebuild or global blowup verification.'
  };
  const claim = {
    id: claimId, type: 'ClaimSpec', statement: conditional ? snapshot.conditionalClaim.statement : statements[module],
    scope: conditional ? 'USER AXIOM / CONDITIONAL COROLLARY' : 'FINITE COMPUTATION / DECLARED MODEL',
    assumptions, dependsOn: [objectId, repId], status: conditional ? 'RESEARCH HYPOTHESIS' : 'SUPPORTED',
    freshness: 'CURRENT', ...revision('claims', claimId)
  };
  const evidence = {
    id: prefix + '-evidence', type: 'EvidenceRecord', grade: conditional ? 'RESEARCH HYPOTHESIS' : 'NUMERICAL INDICATOR',
    claimRef: claimId, method: conditional
      ? (snapshot.conditionalClaim.compilationStatus === 'KERNEL_PASS_CONDITIONAL'
        ? 'Explicit user hypothesis with an exact-source conditional compilation audit'
        : 'Explicit user hypothesis and generated Lean source; separate compilation required')
      : 'Explicit finite browser model with reproducible inputs',
    inputsHash, environmentHash: 'browser-js-ieee754-cpu3d/' + EXTENSION_VERSION,
    residuals: snapshot.diagnostics || snapshot.numerical || (module === 'navier' && snapshot.results ? {
      divergenceRelative: snapshot.results.divergenceRelative,
      relativeMomentumResidual: snapshot.results.relativeMomentumResidual,
      momentumResidual: snapshot.results.momentumResidual,
      heatEquationResidual: snapshot.results.heatEquationResidual
    } : null), errorBounds: null,
    assumptions, generatedAt: createdAt, adapterVersion: EXTENSION_VERSION,
    upstreamRevisions: [object.revision, rep.revision, claim.revision],
    stale: false, freshness: 'CURRENT', supportsCurrent: true,
    scope: claim.scope, observation: snapshot
  };
  return {
    bundleId: prefix + '-bundle', objects: [object], representations: [rep], claims: [claim], evidence: [evidence],
    researchRuns: [{
      id: prefix + '-run', type: 'ResearchExtensionRun', createdAt, module, inputsHash,
      input, evidenceRef: evidence.id, sourceObjectRef: objectId, representationRef: repId,
      releaseGate: 'UNCHANGED / HOLD'
    }]
  };
}

return {EXTENSION_VERSION,createResearchBundle};
})();
const __rx_module_8 = (() => {
const leanBundle = {"coreSource": "import Init\n\n/-!\nMathScope kernel-only conditional logic.\n\nThis standalone companion requires Lean 4, but not mathlib. The energies are an\nABSTRACT ORDER INTERFACE, not a construction of the real numbers. The product\ncoordinate result applies to real coordinates after instantiation; this core\nfile itself contains no Euclidean metric, Lie group, Hilbert space, or QFT.\nThe mathlib companion `MathScopeConditionalYM.lean` uses actual real energies.\n\nAll quantum-existence conclusions below intentionally depend on a custom axiom.\nThe abstract quantum predicates have not been expanded into OS/Wightman axioms.\nNeither a picture nor this logic proves the Yang–Mills Millennium problem.\n-/\n\nnamespace MathScopeConditionalYMCore\n\nuniverse u v\n\nstructure EnergyOrder where\n  Carrier : Type\n  zero : Carrier\n  le : Carrier → Carrier → Prop\n  lt : Carrier → Carrier → Prop\n  leTrans : ∀ a b c, le a b → le b c → le a c\n  leNotLt : ∀ a b, le a b → ¬ lt b a\n\nstructure SpectralInterface (E : EnergyOrder) where\n  spectrum : E.Carrier → Prop\n  vacuum : spectrum E.zero\n  positiveEnergy : ∀ x, spectrum x → E.le E.zero x\n  finiteExcitation : ∃ x, spectrum x ∧ E.lt E.zero x\n\ndef HasGap (E : EnergyOrder) (M : SpectralInterface E) (delta : E.Carrier) : Prop :=\n  E.lt E.zero delta ∧ ∀ x, M.spectrum x → E.lt E.zero x → E.le delta x\n\ntheorem gapExcludesOpenInterval (E : EnergyOrder) (M : SpectralInterface E)\n    (delta : E.Carrier) (hGap : HasGap E M delta) :\n    ∀ x, E.lt E.zero x → E.lt x delta → ¬ M.spectrum x := by\n  intro x hPositive hBelow hSpectrum\n  exact E.leNotLt delta x (hGap.2 x hSpectrum hPositive) hBelow\n\ntheorem smallerPositiveGap (E : EnergyOrder) (M : SpectralInterface E)\n    (delta epsilon : E.Carrier) (hGap : HasGap E M delta)\n    (hPositive : E.lt E.zero epsilon) (hSmaller : E.le epsilon delta) :\n    HasGap E M epsilon := by\n  refine ⟨hPositive, ?_⟩\n  intro x hSpectrum hEnergy\n  exact E.leTrans epsilon delta x hSmaller (hGap.2 x hSpectrum hEnergy)\n\ntheorem gapHasFiniteUpperBound (E : EnergyOrder) (M : SpectralInterface E)\n    (delta : E.Carrier) (hGap : HasGap E M delta) :\n    ∃ x, M.spectrum x ∧ E.lt E.zero x ∧ E.le delta x := by\n  cases M.finiteExcitation with\n  | intro x h => exact ⟨x, h.1, h.2, hGap.2 x h.1 h.2⟩\n\n/-- Spectral inclusion is an additional certificate, not a property of a drawing. -/\ntheorem gapTransfer (E : EnergyOrder) (original observed : SpectralInterface E)\n    (delta : E.Carrier) (hObserved : HasGap E observed delta)\n    (hBridge : ∀ x, original.spectrum x → observed.spectrum x) :\n    HasGap E original delta := by\n  refine ⟨hObserved.1, ?_⟩\n  intro x hOriginal hPositive\n  exact hObserved.2 x (hBridge x hOriginal) hPositive\n\nabbrev Point3 (C : Type u) := C × C × C\nabbrev Point4 (C : Type u) := Point3 C × C\n\ndef project3 {C : Type u} (x : Point4 C) : Point3 C := x.1\ndef insertSlice {C : Type u} (c : C) (y : Point3 C) : Point4 C := (y, c)\n\ntheorem projectInsertSlice {C : Type u} (c : C) (y : Point3 C) :\n    project3 (insertSlice c y) = y := rfl\n\ntheorem projectionSurjective {C : Type u} (c : C) :\n    ∀ y : Point3 C, ∃ x : Point4 C, project3 x = y := by\n  intro y\n  exact ⟨insertSlice c y, rfl⟩\n\ntheorem projectionNotInjective {C : Type u} (a b : C) (hne : a ≠ b) :\n    ¬ (∀ x y : Point4 C, project3 x = project3 y → x = y) := by\n  intro hInjective\n  have h : insertSlice a (a, a, a) = insertSlice b (a, a, a) :=\n    hInjective (insertSlice a (a, a, a)) (insertSlice b (a, a, a)) rfl\n  exact hne (congrArg Prod.snd h)\n\ndef ConstantOnFibres {C : Type u} {V : Type v} (f : Point4 C → V) : Prop :=\n  ∀ x y, project3 x = project3 y → f x = f y\n\ntheorem observableDescendsIff {C : Type u} {V : Type v} (c : C)\n    (f : Point4 C → V) :\n    (∃ g : Point3 C → V, ∀ x, f x = g (project3 x)) ↔ ConstantOnFibres f := by\n  constructor\n  · intro h\n    cases h with\n    | intro g hFactor =>\n      intro x y hProjection\n      calc\n        f x = g (project3 x) := hFactor x\n        _ = g (project3 y) := congrArg g hProjection\n        _ = f y := (hFactor y).symm\n  · intro hFibres\n    refine ⟨fun y => f (insertSlice c y), ?_⟩\n    intro x\n    exact hFibres x (insertSlice c (project3 x)) rfl\n\nstructure ReconstructionCertificate {C : Type u} (domain : Point4 C → Prop) where\n  reconstruct : Point3 C → Point4 C\n  correct : ∀ x, domain x → reconstruct (project3 x) = x\n\ntheorem reconstructionInjectiveOn {C : Type u} (domain : Point4 C → Prop)\n    (certificate : ReconstructionCertificate domain) :\n    ∀ x y, domain x → domain y → project3 x = project3 y → x = y := by\n  intro x y hx hy hProjection\n  calc\n    x = certificate.reconstruct (project3 x) := (certificate.correct x hx).symm\n    _ = certificate.reconstruct (project3 y) := congrArg certificate.reconstruct hProjection\n    _ = y := certificate.correct y hy\n\ntheorem propertyOfCertifiedReconstruction {C : Type u} (domain : Point4 C → Prop)\n    (certificate : ReconstructionCertificate domain) (P : Point4 C → Prop)\n    (x : Point4 C) (hx : domain x)\n    (hObserved : P (certificate.reconstruct (project3 x))) : P x := by\n  exact Eq.mp (congrArg P (certificate.correct x hx)) hObserved\n\nstructure GaugeGroupDeclaration where\n  name : String\n  specification : String\n\n/- Fixed semantic interfaces. They are deliberately not arbitrary predicates\n   universally substituted into the existence axiom. The energy interface is\n   abstract here; use the mathlib companion for real energies. -/\naxiom quantumEnergyOrder : EnergyOrder\naxiom IsCompactSimpleGaugeGroup : GaugeGroupDeclaration → Prop\naxiom IsNontrivialQuantumYMOnR4 :\n  GaugeGroupDeclaration → SpectralInterface quantumEnergyOrder → Prop\n\naxiom userAssumedYMExistenceWithGap (G : GaugeGroupDeclaration)\n    (hGroup : IsCompactSimpleGaugeGroup G) :\n    ∃ (M : SpectralInterface quantumEnergyOrder) (delta : quantumEnergyOrder.Carrier),\n      IsNontrivialQuantumYMOnR4 G M ∧ HasGap quantumEnergyOrder M delta\n\ntheorem conditionalGapCorollaries (G : GaugeGroupDeclaration)\n    (hGroup : IsCompactSimpleGaugeGroup G) :\n    ∃ (M : SpectralInterface quantumEnergyOrder) (delta : quantumEnergyOrder.Carrier),\n      IsNontrivialQuantumYMOnR4 G M ∧\n      HasGap quantumEnergyOrder M delta ∧\n      (∀ epsilon, quantumEnergyOrder.lt quantumEnergyOrder.zero epsilon →\n        quantumEnergyOrder.le epsilon delta → HasGap quantumEnergyOrder M epsilon) := by\n  cases userAssumedYMExistenceWithGap G hGroup with\n  | intro M hM =>\n    cases hM with\n    | intro delta h =>\n      refine ⟨M, delta, h.1, h.2, ?_⟩\n      intro epsilon hPositive hSmaller\n      exact smallerPositiveGap quantumEnergyOrder M delta epsilon h.2 hPositive hSmaller\n\n#print axioms gapExcludesOpenInterval\n#print axioms smallerPositiveGap\n#print axioms gapHasFiniteUpperBound\n#print axioms gapTransfer\n#print axioms projectInsertSlice\n#print axioms projectionSurjective\n#print axioms projectionNotInjective\n#print axioms observableDescendsIff\n#print axioms reconstructionInjectiveOn\n#print axioms propertyOfCertifiedReconstruction\n#print axioms conditionalGapCorollaries\n\nend MathScopeConditionalYMCore\n", "mathlibSource": "import Mathlib.Basic.Real.Basic\n\n/-!\n# MathScope conditional Yang–Mills and projection contract\n\nSTATUS: conditional scaffold. This file is NOT a formalization or proof of the\nClay Yang–Mills existence and mass-gap problem. Kernel checking this file checks\nthe stated consequences of the declared assumptions only.\n\nFormalization boundary:\n* `SpectralInterface` contains a set of real energies and elementary spectral\n  conditions. It does not construct a Hilbert space, a self-adjoint Hamiltonian,\n  quantum fields, an interacting measure, or an Osterwalder–Schrader reconstruction.\n* The group declaration is metadata. Its compact/simple status is an external,\n  uninterpreted predicate; a label is not a theorem about a Lie group.\n* `IsNontrivialQuantumYMOnR4` is also an uninterpreted semantic interface. Its\n  OS/Wightman, gauge-invariance, renormalization and short-distance obligations\n  have not been formalized here.\n* `userAssumedYMExistenceWithGap` is a deliberate custom axiom. Its name must\n  remain visible in the axiom audit of dependent corollaries.\n* A slider-selected delta is a proposed lower bound in a chosen energy unit.\n  Existence of SOME positive gap does not certify EVERY slider value for one model.\n\nReferences:\nhttps://www.claymath.org/wp-content/uploads/2022/06/yangmills.pdf\nhttps://lean-lang.org/doc/reference/latest/Axioms/\n-/\n\nnamespace MathScopeConditionalYM\n\n/-- Declaration metadata only: this record is not a compact Lie group structure. -/\nstructure GaugeGroupDeclaration where\n  name : String\n  specification : String\n\n/-- Minimal real spectral interface; the QFT realization remains a separate obligation. -/\nstructure SpectralInterface where\n  spectrum : Set ℝ\n  vacuumEnergy : (0 : ℝ) ∈ spectrum\n  positiveEnergy : ∀ E ∈ spectrum, 0 ≤ E\n  finiteExcitation : ∃ E ∈ spectrum, 0 < E\n\n/-- A positive lower bound on every positive spectral energy. -/\ndef HasMassGap (M : SpectralInterface) (delta : ℝ) : Prop :=\n  0 < delta ∧ ∀ E ∈ M.spectrum, 0 < E → delta ≤ E\n\n/-- Immediate spectral exclusion, with all hypotheses visible in the theorem. -/\ntheorem gap_excludes_open_interval (M : SpectralInterface) (delta : ℝ)\n    (hGap : HasMassGap M delta) :\n    ∀ E, 0 < E → E < delta → E ∉ M.spectrum := by\n  intro E hPositive hBelow hSpectrum\n  exact (not_lt_of_ge (hGap.2 E hSpectrum hPositive)) hBelow\n\n/-- A certified lower bound also certifies every smaller positive lower bound. -/\ntheorem smaller_positive_gap (M : SpectralInterface) (delta epsilon : ℝ)\n    (hGap : HasMassGap M delta) (hPositive : 0 < epsilon)\n    (hSmaller : epsilon ≤ delta) : HasMassGap M epsilon := by\n  refine ⟨hPositive, ?_⟩\n  intro E hSpectrum hEnergy\n  exact le_trans hSmaller (hGap.2 E hSpectrum hEnergy)\n\n/-- Any actual positive spectral energy provides a finite upper bound on delta. -/\ntheorem gap_has_finite_upper_bound (M : SpectralInterface) (delta : ℝ)\n    (hGap : HasMassGap M delta) :\n    ∃ E ∈ M.spectrum, 0 < E ∧ delta ≤ E := by\n  obtain ⟨E, hSpectrum, hPositive⟩ := M.finiteExcitation\n  exact ⟨E, hSpectrum, hPositive, hGap.2 E hSpectrum hPositive⟩\n\n/-- Transfer uses explicit spectral inclusion in the same energy units. -/\ntheorem gap_transfer (original observed : SpectralInterface) (delta : ℝ)\n    (hObservedGap : HasMassGap observed delta)\n    (hBridge : original.spectrum ⊆ observed.spectrum) :\n    HasMassGap original delta := by\n  refine ⟨hObservedGap.1, ?_⟩\n  intro E hOriginal hPositive\n  exact hObservedGap.2 E (hBridge hOriginal) hPositive\n\n/-- Three coordinates followed by one discarded coordinate. -/\nabbrev Point3 := ℝ × ℝ × ℝ\nabbrev Point4 := Point3 × ℝ\n\ndef project3 (x : Point4) : Point3 := x.1\ndef insertSlice (c : ℝ) (y : Point3) : Point4 := (y, c)\n\ntheorem project_insert_slice (c : ℝ) (y : Point3) :\n    project3 (insertSlice c y) = y := rfl\n\ntheorem projection_surjective : Function.Surjective project3 := by\n  intro y\n  exact ⟨insertSlice 0 y, rfl⟩\n\n/-- An explicit failure of reconstruction from a 3D point without extra data. -/\ntheorem projection_not_injective : ¬ Function.Injective project3 := by\n  intro hInjective\n  have h : insertSlice 0 (0, 0, 0) = insertSlice 1 (0, 0, 0) :=\n    hInjective rfl\n  have hTime : (0 : ℝ) = 1 := congrArg Prod.snd h\n  exact zero_ne_one hTime\n\n/-- An observable can descend only when it is constant on projection fibres. -/\ndef ConstantOnFibres {Value : Type*} (f : Point4 → Value) : Prop :=\n  ∀ x y, project3 x = project3 y → f x = f y\n\n/-- Exact criterion for representing an observable without loss through this projection. -/\ntheorem observable_descends_iff {Value : Type*} (f : Point4 → Value) :\n    (∃ g : Point3 → Value, ∀ x, f x = g (project3 x)) ↔ ConstantOnFibres f := by\n  constructor\n  · rintro ⟨g, hFactor⟩ x y hProjection\n    rw [hFactor x, hFactor y, hProjection]\n  · intro hFibres\n    refine ⟨fun y => f (insertSlice 0 y), ?_⟩\n    intro x\n    exact hFibres x (insertSlice 0 (project3 x)) rfl\n\n/-- Additional data sufficient to reconstruct points in a specified domain. -/\nstructure ReconstructionCertificate (domain : Set Point4) where\n  reconstruct : Point3 → Point4\n  correct : ∀ x ∈ domain, reconstruct (project3 x) = x\n\ntheorem reconstruction_implies_injective_on (domain : Set Point4)\n    (certificate : ReconstructionCertificate domain) :\n    Set.InjOn project3 domain := by\n  intro x hx y hy hProjection\n  calc\n    x = certificate.reconstruct (project3 x) := (certificate.correct x hx).symm\n    _ = certificate.reconstruct (project3 y) := congrArg certificate.reconstruct hProjection\n    _ = y := certificate.correct y hy\n\n/-- A property of a certified reconstruction transfers back on the certified domain. -/\ntheorem property_of_certified_reconstruction (domain : Set Point4)\n    (certificate : ReconstructionCertificate domain) (P : Point4 → Prop)\n    (x : Point4) (hx : x ∈ domain)\n    (hObserved : P (certificate.reconstruct (project3 x))) : P x := by\n  rw [certificate.correct x hx] at hObserved\n  exact hObserved\n\n/-!\n## Explicit assumption mode\n\nThe next TWO axioms introduce fixed semantic predicates. They do not define\ncompact simple Lie groups or quantum field theories. The third axiom supplies\nthe user's hypothetical existence statement in that still-incomplete interface.\nNo axiom here universally quantifies over arbitrary replacement predicates.\n-/\n\naxiom IsCompactSimpleGaugeGroup : GaugeGroupDeclaration → Prop\n\naxiom IsNontrivialQuantumYMOnR4 : GaugeGroupDeclaration → SpectralInterface → Prop\n\naxiom userAssumedYMExistenceWithGap (G : GaugeGroupDeclaration)\n    (hGroup : IsCompactSimpleGaugeGroup G) :\n    ∃ (M : SpectralInterface) (delta : ℝ),\n      IsNontrivialQuantumYMOnR4 G M ∧ HasMassGap M delta\n\n/-- Conditional corollary bundle, deliberately dependent on the custom existence axiom. -/\ntheorem conditional_gap_corollaries (G : GaugeGroupDeclaration)\n    (hGroup : IsCompactSimpleGaugeGroup G) :\n    ∃ (M : SpectralInterface) (delta : ℝ),\n      IsNontrivialQuantumYMOnR4 G M ∧\n      HasMassGap M delta ∧\n      (∀ epsilon, 0 < epsilon → epsilon ≤ delta → HasMassGap M epsilon) ∧\n      (∀ E, 0 < E → E < delta → E ∉ M.spectrum) := by\n  obtain ⟨M, delta, hYM, hGap⟩ := userAssumedYMExistenceWithGap G hGroup\n  refine ⟨M, delta, hYM, hGap, ?_, ?_⟩\n  · intro epsilon hPositive hSmaller\n    exact smaller_positive_gap M delta epsilon hGap hPositive hSmaller\n  · exact gap_excludes_open_interval M delta hGap\n\n/-!\n## Axiom audit\n\nThe first group must not depend on the three custom YM interface axioms.\nThe last declaration deliberately does depend on `userAssumedYMExistenceWithGap`.\nA successful kernel check of that last theorem is CONDITIONAL, never a proof\nthat quantum Yang–Mills exists or that a positive gap has been established.\n-/\n\n#print axioms gap_excludes_open_interval\n#print axioms smaller_positive_gap\n#print axioms gap_has_finite_upper_bound\n#print axioms gap_transfer\n#print axioms project_insert_slice\n#print axioms projection_surjective\n#print axioms projection_not_injective\n#print axioms observable_descends_iff\n#print axioms reconstruction_implies_injective_on\n#print axioms property_of_certified_reconstruction\n#print axioms conditional_gap_corollaries\n\nend MathScopeConditionalYM\n", "scenarioSource": "import Mathlib.Basic.Real.Basic\n\n/-!\n# MathScope conditional Yang–Mills and projection contract\n\nSTATUS: conditional scaffold. This file is NOT a formalization or proof of the\nClay Yang–Mills existence and mass-gap problem. Kernel checking this file checks\nthe stated consequences of the declared assumptions only.\n\nFormalization boundary:\n* `SpectralInterface` contains a set of real energies and elementary spectral\n  conditions. It does not construct a Hilbert space, a self-adjoint Hamiltonian,\n  quantum fields, an interacting measure, or an Osterwalder–Schrader reconstruction.\n* The group declaration is metadata. Its compact/simple status is an external,\n  uninterpreted predicate; a label is not a theorem about a Lie group.\n* `IsNontrivialQuantumYMOnR4` is also an uninterpreted semantic interface. Its\n  OS/Wightman, gauge-invariance, renormalization and short-distance obligations\n  have not been formalized here.\n* `userAssumedYMExistenceWithGap` is a deliberate custom axiom. Its name must\n  remain visible in the axiom audit of dependent corollaries.\n* A slider-selected delta is a proposed lower bound in a chosen energy unit.\n  Existence of SOME positive gap does not certify EVERY slider value for one model.\n\nReferences:\nhttps://www.claymath.org/wp-content/uploads/2022/06/yangmills.pdf\nhttps://lean-lang.org/doc/reference/latest/Axioms/\n-/\n\nnamespace MathScopeConditionalYM\n\n/-- Declaration metadata only: this record is not a compact Lie group structure. -/\nstructure GaugeGroupDeclaration where\n  name : String\n  specification : String\n\n/-- Minimal real spectral interface; the QFT realization remains a separate obligation. -/\nstructure SpectralInterface where\n  spectrum : Set ℝ\n  vacuumEnergy : (0 : ℝ) ∈ spectrum\n  positiveEnergy : ∀ E ∈ spectrum, 0 ≤ E\n  finiteExcitation : ∃ E ∈ spectrum, 0 < E\n\n/-- A positive lower bound on every positive spectral energy. -/\ndef HasMassGap (M : SpectralInterface) (delta : ℝ) : Prop :=\n  0 < delta ∧ ∀ E ∈ M.spectrum, 0 < E → delta ≤ E\n\n/-- Immediate spectral exclusion, with all hypotheses visible in the theorem. -/\ntheorem gap_excludes_open_interval (M : SpectralInterface) (delta : ℝ)\n    (hGap : HasMassGap M delta) :\n    ∀ E, 0 < E → E < delta → E ∉ M.spectrum := by\n  intro E hPositive hBelow hSpectrum\n  exact (not_lt_of_ge (hGap.2 E hSpectrum hPositive)) hBelow\n\n/-- A certified lower bound also certifies every smaller positive lower bound. -/\ntheorem smaller_positive_gap (M : SpectralInterface) (delta epsilon : ℝ)\n    (hGap : HasMassGap M delta) (hPositive : 0 < epsilon)\n    (hSmaller : epsilon ≤ delta) : HasMassGap M epsilon := by\n  refine ⟨hPositive, ?_⟩\n  intro E hSpectrum hEnergy\n  exact le_trans hSmaller (hGap.2 E hSpectrum hEnergy)\n\n/-- Any actual positive spectral energy provides a finite upper bound on delta. -/\ntheorem gap_has_finite_upper_bound (M : SpectralInterface) (delta : ℝ)\n    (hGap : HasMassGap M delta) :\n    ∃ E ∈ M.spectrum, 0 < E ∧ delta ≤ E := by\n  obtain ⟨E, hSpectrum, hPositive⟩ := M.finiteExcitation\n  exact ⟨E, hSpectrum, hPositive, hGap.2 E hSpectrum hPositive⟩\n\n/-- Transfer uses explicit spectral inclusion in the same energy units. -/\ntheorem gap_transfer (original observed : SpectralInterface) (delta : ℝ)\n    (hObservedGap : HasMassGap observed delta)\n    (hBridge : original.spectrum ⊆ observed.spectrum) :\n    HasMassGap original delta := by\n  refine ⟨hObservedGap.1, ?_⟩\n  intro E hOriginal hPositive\n  exact hObservedGap.2 E (hBridge hOriginal) hPositive\n\n/-- Three coordinates followed by one discarded coordinate. -/\nabbrev Point3 := ℝ × ℝ × ℝ\nabbrev Point4 := Point3 × ℝ\n\ndef project3 (x : Point4) : Point3 := x.1\ndef insertSlice (c : ℝ) (y : Point3) : Point4 := (y, c)\n\ntheorem project_insert_slice (c : ℝ) (y : Point3) :\n    project3 (insertSlice c y) = y := rfl\n\ntheorem projection_surjective : Function.Surjective project3 := by\n  intro y\n  exact ⟨insertSlice 0 y, rfl⟩\n\n/-- An explicit failure of reconstruction from a 3D point without extra data. -/\ntheorem projection_not_injective : ¬ Function.Injective project3 := by\n  intro hInjective\n  have h : insertSlice 0 (0, 0, 0) = insertSlice 1 (0, 0, 0) :=\n    hInjective rfl\n  have hTime : (0 : ℝ) = 1 := congrArg Prod.snd h\n  exact zero_ne_one hTime\n\n/-- An observable can descend only when it is constant on projection fibres. -/\ndef ConstantOnFibres {Value : Type*} (f : Point4 → Value) : Prop :=\n  ∀ x y, project3 x = project3 y → f x = f y\n\n/-- Exact criterion for representing an observable without loss through this projection. -/\ntheorem observable_descends_iff {Value : Type*} (f : Point4 → Value) :\n    (∃ g : Point3 → Value, ∀ x, f x = g (project3 x)) ↔ ConstantOnFibres f := by\n  constructor\n  · rintro ⟨g, hFactor⟩ x y hProjection\n    rw [hFactor x, hFactor y, hProjection]\n  · intro hFibres\n    refine ⟨fun y => f (insertSlice 0 y), ?_⟩\n    intro x\n    exact hFibres x (insertSlice 0 (project3 x)) rfl\n\n/-- Additional data sufficient to reconstruct points in a specified domain. -/\nstructure ReconstructionCertificate (domain : Set Point4) where\n  reconstruct : Point3 → Point4\n  correct : ∀ x ∈ domain, reconstruct (project3 x) = x\n\ntheorem reconstruction_implies_injective_on (domain : Set Point4)\n    (certificate : ReconstructionCertificate domain) :\n    Set.InjOn project3 domain := by\n  intro x hx y hy hProjection\n  calc\n    x = certificate.reconstruct (project3 x) := (certificate.correct x hx).symm\n    _ = certificate.reconstruct (project3 y) := congrArg certificate.reconstruct hProjection\n    _ = y := certificate.correct y hy\n\n/-- A property of a certified reconstruction transfers back on the certified domain. -/\ntheorem property_of_certified_reconstruction (domain : Set Point4)\n    (certificate : ReconstructionCertificate domain) (P : Point4 → Prop)\n    (x : Point4) (hx : x ∈ domain)\n    (hObserved : P (certificate.reconstruct (project3 x))) : P x := by\n  rw [certificate.correct x hx] at hObserved\n  exact hObserved\n\n/-!\n## Explicit assumption mode\n\nThe next TWO axioms introduce fixed semantic predicates. They do not define\ncompact simple Lie groups or quantum field theories. The third axiom supplies\nthe user's hypothetical existence statement in that still-incomplete interface.\nNo axiom here universally quantifies over arbitrary replacement predicates.\n-/\n\naxiom IsCompactSimpleGaugeGroup : GaugeGroupDeclaration → Prop\n\naxiom IsNontrivialQuantumYMOnR4 : GaugeGroupDeclaration → SpectralInterface → Prop\n\naxiom userAssumedYMExistenceWithGap (G : GaugeGroupDeclaration)\n    (hGroup : IsCompactSimpleGaugeGroup G) :\n    ∃ (M : SpectralInterface) (delta : ℝ),\n      IsNontrivialQuantumYMOnR4 G M ∧ HasMassGap M delta\n\n/-- Conditional corollary bundle, deliberately dependent on the custom existence axiom. -/\ntheorem conditional_gap_corollaries (G : GaugeGroupDeclaration)\n    (hGroup : IsCompactSimpleGaugeGroup G) :\n    ∃ (M : SpectralInterface) (delta : ℝ),\n      IsNontrivialQuantumYMOnR4 G M ∧\n      HasMassGap M delta ∧\n      (∀ epsilon, 0 < epsilon → epsilon ≤ delta → HasMassGap M epsilon) ∧\n      (∀ E, 0 < E → E < delta → E ∉ M.spectrum) := by\n  obtain ⟨M, delta, hYM, hGap⟩ := userAssumedYMExistenceWithGap G hGroup\n  refine ⟨M, delta, hYM, hGap, ?_, ?_⟩\n  · intro epsilon hPositive hSmaller\n    exact smaller_positive_gap M delta epsilon hGap hPositive hSmaller\n  · exact gap_excludes_open_interval M delta hGap\n\n/-!\n## Axiom audit\n\nThe first group must not depend on the three custom YM interface axioms.\nThe last declaration deliberately does depend on `userAssumedYMExistenceWithGap`.\nA successful kernel check of that last theorem is CONDITIONAL, never a proof\nthat quantum Yang–Mills exists or that a positive gap has been established.\n-/\n\n#print axioms gap_excludes_open_interval\n#print axioms smaller_positive_gap\n#print axioms gap_has_finite_upper_bound\n#print axioms gap_transfer\n#print axioms project_insert_slice\n#print axioms projection_surjective\n#print axioms projection_not_injective\n#print axioms observable_descends_iff\n#print axioms reconstruction_implies_injective_on\n#print axioms property_of_certified_reconstruction\n#print axioms conditional_gap_corollaries\n\nend MathScopeConditionalYM\n\n\n/- Selected MathScope scenario. GENERATED SOURCE: requires its own kernel check.\n   The selected positive lower bound is an ADDITIONAL USER AXIOM.\n   Changing the slider creates a different hypothesis, not a measured spectrum.\n   The BPST density observation is not used as evidence of this axiom. -/\nnamespace MathScopeSelectedScenario\nopen MathScopeConditionalYM\ndef declaredGroup : GaugeGroupDeclaration :=\n  { name := \"SU(2)\", specification := \"User-declared compact simple gauge group; realization required\" }\nnoncomputable def declaredDelta : ℝ := (10 : ℝ) / 10\nnoncomputable def selectedSlice : ℝ := (0 : ℝ) / 10\naxiom declaredGroupHasRequiredStructure : IsCompactSimpleGaugeGroup declaredGroup\naxiom selectedModel : SpectralInterface\naxiom selectedExistenceAndGap :\n  IsNontrivialQuantumYMOnR4 declaredGroup selectedModel ∧ HasMassGap selectedModel declaredDelta\ntheorem selected_gap_corollary :\n    ∀ E, 0 < E → E < declaredDelta → E ∉ selectedModel.spectrum := by\n  exact gap_excludes_open_interval selectedModel declaredDelta selectedExistenceAndGap.2\ntheorem selected_slice_roundtrip (y : Point3) :\n    project3 (insertSlice selectedSlice y) = y := by\n  exact project_insert_slice selectedSlice y\n/- The following theorem needs the reconstruction certificate explicitly.\n   A density line integral is not such a certificate. -/\ntheorem selected_observation_transfer (domain : Set Point4)\n    (certificate : ReconstructionCertificate domain) (P : Point4 → Prop)\n    (x : Point4) (hx : x ∈ domain)\n    (hObserved : P (certificate.reconstruct (project3 x))) : P x := by\n  exact property_of_certified_reconstruction domain certificate P x hx hObserved\n#print axioms selected_gap_corollary\n#print axioms selected_slice_roundtrip\n#print axioms selected_observation_transfer\nend MathScopeSelectedScenario\n", "validation": {"schemaVersion": 1, "checkedAt": "2026-10-09T10:14:48.886450+00:00", "overallStatus": "CORE_AND_MATHLIB_AND_DEFAULT_SCENARIO_KERNEL_PASS_CONDITIONAL", "kernelScope": "Logical consequences of supplied interfaces/axioms, not existence of quantum Yang–Mills or a computed mass gap.", "core": {"status": "KERNEL_PASS_CONDITIONAL", "toolchain": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)", "sourceFile": "MathScopeConditionalYM_Core.lean", "sourceSha256": "c4316c0c6b8d3ba1461b675a377728b8baf2096b6f0ea6938fa9653eb1326639", "exitCode": 0, "command": ["/tmp/mathscope-lean-embed", "/workspace/scratch/afa9cd11a21b/lean-4.34.1-linux", "/workspace/scratch/afa9cd11a21b/mathscope-extension/MathScopeConditionalYM_Core.lean"], "standardCommand": "lean MathScopeConditionalYM_Core.lean", "log": "'MathScopeConditionalYMCore.gapExcludesOpenInterval' does not depend on any axioms\n'MathScopeConditionalYMCore.smallerPositiveGap' does not depend on any axioms\n'MathScopeConditionalYMCore.gapHasFiniteUpperBound' does not depend on any axioms\n'MathScopeConditionalYMCore.gapTransfer' does not depend on any axioms\n'MathScopeConditionalYMCore.projectInsertSlice' does not depend on any axioms\n'MathScopeConditionalYMCore.projectionSurjective' does not depend on any axioms\n'MathScopeConditionalYMCore.projectionNotInjective' does not depend on any axioms\n'MathScopeConditionalYMCore.observableDescendsIff' does not depend on any axioms\n'MathScopeConditionalYMCore.reconstructionInjectiveOn' does not depend on any axioms\n'MathScopeConditionalYMCore.propertyOfCertifiedReconstruction' does not depend on any axioms\n'MathScopeConditionalYMCore.conditionalGapCorollaries' depends on axioms: [IsCompactSimpleGaugeGroup,\n IsNontrivialQuantumYMOnR4,\n quantumEnergyOrder,\n userAssumedYMExistenceWithGap]\n", "logFile": "ym-lean-core-audit.txt", "theoremCount": 11, "axiomFreeTheoremCount": 10, "customAxiomDependentTheoremCount": 1, "customAxioms": ["IsCompactSimpleGaugeGroup", "IsNontrivialQuantumYMOnR4", "quantumEnergyOrder", "userAssumedYMExistenceWithGap"], "energyDomain": "abstract EnergyOrder; not a construction of R", "negativeControlRejected": true, "negativeControlExitCode": 1, "negativeControlLogFile": "ym-lean-negative-control.txt"}, "mathlib": {"status": "KERNEL_PASS_CONDITIONAL", "toolchain": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)", "sourceFile": "MathScopeConditionalYM.lean", "sourceSha256": "6d64aa5b3f4a62477a6732ed1b6018f4ee588ffd051e22a04fcce9fcbfaa234c", "exitCode": 0, "command": ["/tmp/mathscope-lean-embed", "/workspace/scratch/afa9cd11a21b/lean-4.34.1-linux", "/workspace/scratch/afa9cd11a21b/mathscope-extension/MathScopeConditionalYM.lean"], "environment": {"LEAN_PATH": "/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/plausible/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/LeanSearchClient/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/importGraph/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/proofwidgets/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/aesop/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/Qq/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/batteries/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/Cli/.lake/build/lib/lean", "LEAN_SYSROOT": "/workspace/scratch/afa9cd11a21b/lean-4.34.1-linux"}, "standardCommand": "lake env lean MathScopeConditionalYM.lean", "log": "'MathScopeConditionalYM.gap_excludes_open_interval' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.smaller_positive_gap' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.gap_has_finite_upper_bound' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.gap_transfer' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.project_insert_slice' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.projection_surjective' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.projection_not_injective' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.observable_descends_iff' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.reconstruction_implies_injective_on' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.property_of_certified_reconstruction' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.conditional_gap_corollaries' depends on axioms: [propext,\n Classical.choice,\n IsCompactSimpleGaugeGroup,\n IsNontrivialQuantumYMOnR4,\n userAssumedYMExistenceWithGap,\n Quot.sound]\n", "logFile": "ym-lean-mathlib-audit.txt", "theoremCount": 11, "mathlibTag": "v4.34.1", "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612", "customAxiomDependence": "Expected and explicit; no unconditional quantum Yang–Mills construction follows.", "standardAxioms": ["propext", "Classical.choice", "Quot.sound"], "generalTheoremCount": 10, "customAxiomDependentTheoremCount": 1, "customAxioms": ["IsCompactSimpleGaugeGroup", "IsNontrivialQuantumYMOnR4", "userAssumedYMExistenceWithGap"], "energyDomain": "mathlib real numbers"}, "scenario": {"status": "KERNEL_PASS_CONDITIONAL", "toolchain": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)", "sourceFile": "MathScopeSelectedScenario_SU2_Delta1_Slice0.lean", "sourceSha256": "91ebce6fb7fbb17c9a6100fa86a8724c9151053d366ef65620fac557b6f3e815", "exitCode": 0, "command": ["/tmp/mathscope-lean-embed", "/workspace/scratch/afa9cd11a21b/lean-4.34.1-linux", "/workspace/scratch/afa9cd11a21b/mathscope-extension/MathScopeSelectedScenario_SU2_Delta1_Slice0.lean"], "environment": {"LEAN_PATH": "/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/plausible/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/LeanSearchClient/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/importGraph/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/proofwidgets/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/aesop/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/Qq/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/batteries/.lake/build/lib/lean:/workspace/scratch/afa9cd11a21b/mathlib-ym-check/.lake/packages/Cli/.lake/build/lib/lean", "LEAN_SYSROOT": "/workspace/scratch/afa9cd11a21b/lean-4.34.1-linux"}, "standardCommand": "lake env lean MathScopeSelectedScenario_SU2_Delta1_Slice0.lean", "log": "'MathScopeConditionalYM.gap_excludes_open_interval' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.smaller_positive_gap' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.gap_has_finite_upper_bound' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.gap_transfer' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.project_insert_slice' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.projection_surjective' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.projection_not_injective' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.observable_descends_iff' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.reconstruction_implies_injective_on' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.property_of_certified_reconstruction' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeConditionalYM.conditional_gap_corollaries' depends on axioms: [propext,\n Classical.choice,\n IsCompactSimpleGaugeGroup,\n IsNontrivialQuantumYMOnR4,\n userAssumedYMExistenceWithGap,\n Quot.sound]\n'MathScopeSelectedScenario.selected_gap_corollary' depends on axioms: [propext,\n Classical.choice,\n IsNontrivialQuantumYMOnR4,\n selectedExistenceAndGap,\n selectedModel,\n Quot.sound]\n'MathScopeSelectedScenario.selected_slice_roundtrip' depends on axioms: [propext, Classical.choice, Quot.sound]\n'MathScopeSelectedScenario.selected_observation_transfer' depends on axioms: [propext, Classical.choice, Quot.sound]\n", "logFile": "ym-lean-scenario-audit.txt", "theoremCount": 14, "mathlibTag": "v4.34.1", "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612", "customAxiomDependence": "Expected and explicit; no unconditional quantum Yang–Mills construction follows.", "inputs": {"gauge": "SU(2)", "delta": 1, "slice": 0}, "additionalTheorems": 3, "baseSourceSha256": "6d64aa5b3f4a62477a6732ed1b6018f4ee588ffd051e22a04fcce9fcbfaa234c", "scope": "This exact generated source only; changed inputs require a distinct source hash and check.", "customAxioms": ["selectedModel", "selectedExistenceAndGap", "IsNontrivialQuantumYMOnR4"], "generatorSourceSha256": "e78ef747986228bf4d7b7d1aa1698a2f638ad87729cfd816b1930a2c200f8f30", "additionalUserAxiomDependentTheoremCount": 1, "additionalGeneralTheoremCount": 2}, "execution": {"method": "Official Lean shared library embedded with explicit Lean.initSearchPath; normal frontend and default kernel checks.", "reason": "CLI installation autodetection calls /proc/<pid>/exe, unavailable in this environment.", "runtimeModified": false, "kernelModified": false, "verifierGuardModified": false, "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13", "embeddingSourceFile": "lean-embed-check.c", "embeddingSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e", "embeddingBinarySha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa", "cacheConfiguration": "Official mathlib v4.34.1 cache algorithm with explicit source-path ReaderT context; original cached mathematical modules and official runtime unchanged."}, "absenceOfSorry": true, "displayPolicy": "A successful check is FORMAL CONDITIONAL for the explicit formalization scope, not CLAY SOLVED."}};

return {leanBundle};
})();
const __rx_module_9 = (() => {
const { mountArithmeticUI } = __rx_module_4;
const { mountYMUI } = __rx_module_5;
const { mountNSUI } = __rx_module_6;
const { createResearchBundle, EXTENSION_VERSION } = __rx_module_7;
const { leanBundle } = __rx_module_8;
const initialHash = typeof location !== 'undefined' ? location.hash : '';
const STORAGE_KEY = 'mathscope:v031:research-extensions:1';
const MODULES = ['primes', 'cohomology', 'yangmills', 'navier'];
const LABELS = { primes: '소수 · L-functions', cohomology: '고차원 · 코호몰로지', yangmills: '양–밀스 · Lean', navier: 'Navier–Stokes' };

function bootResearchExtensions() {
  const root = document.getElementById('v031ResearchExtensions');
  if (!root || root.dataset.mounted === 'true') return;
  const $ = id => document.getElementById(id);
  let active = 'primes', booting = true, parts = {}, checks = null, saving = false, lastError = null, userRouted = false;
  const controls = Array.from(root.querySelectorAll('input[id], select[id]'));
  function report(message, error = false) {
    $('rx-status').textContent = message; $('rx-status').classList.toggle('rx-warn', Boolean(error));
    if (error) lastError = String(message);
  }
  let preferences = null;
  try {
    preferences = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (preferences?.version === EXTENSION_VERSION) {
      for (const control of controls) {
        if (!Object.hasOwn(preferences.controls || {}, control.id) || control.id === 'rx-ym-assumption') continue;
        const value = preferences.controls[control.id];
        if (control.type === 'checkbox') control.checked = Boolean(value);
        else if (control.tagName === 'SELECT') {
          if (Array.from(control.options).some(o => o.value === String(value))) control.value = String(value);
        } else {
          const n = Number(value), min = Number(control.min), max = Number(control.max);
          if (Number.isFinite(n) && (control.min === '' || n >= min) && (control.max === '' || n <= max)) control.value = String(n);
        }
      }
      if (MODULES.includes(preferences.active)) active = preferences.active;
    }
  } catch { /* A stale local preference must not block a mathematical module. */ }
  function persistControls() {
    const values = {};
    for (const control of controls) {
      if (control.id === 'rx-ym-assumption') continue;
      values[control.id] = control.type === 'checkbox' ? control.checked : control.value;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: EXTENSION_VERSION, active, controls: values })); }
    catch { report('로컬 설정 저장 공간을 사용할 수 없습니다. JSON 내보내기를 사용할 수 있습니다.', true); }
  }
  function cameraState(name) {
    const key = { primes: 'prime', cohomology: 'coho', yangmills: 'ym', navier: 'ns' }[name];
    const scene = scenes[key]; return { yaw: scene.yaw, pitch: scene.pitch, zoom: scene.zoom, projection: 'orthographic' };
  }
  function currentSnapshot(name = active) {
    let data;
    if (name === 'primes' || name === 'cohomology') data = parts.arithmetic.snapshot(name);
    else data = parts[name === 'yangmills' ? 'ym' : 'ns'].snapshot();
    if (data.valid === false) throw Error(data.error || '현재 입력을 계산하지 못했습니다.');
    return {
      ...data, module: name, input: data.input || data.options || {},
      camera: cameraState(name), extensionVersion: EXTENSION_VERSION,
      releaseGate: 'RELEASE HOLD / existing Stage8 gate unchanged'
    };
  }
  function debug() {
    if (booting) return;
    try {
      const snapshot = currentSnapshot();
      const summary = active === 'primes'
        ? { primes: snapshot.results?.primes?.summary, elliptic: snapshot.results?.elliptic?.selected, finiteEulerProducts: snapshot.results?.finiteEulerProducts }
        : active === 'cohomology'
          ? { complex: snapshot.results?.complex?.name, betti: snapshot.results?.betti, cohomology: snapshot.results?.cohomology, filtration: snapshot.results?.filtration?.formula }
          : snapshot.numerical || snapshot.results || null;
      const compact = { module: active, input: snapshot.input, checks,
        representation: snapshot.representation, camera: snapshot.camera, results: summary,
        modelGrade: snapshot.grade || snapshot.contract?.displayedStatus,
        conditionalClaim: snapshot.conditionalClaim ? { statement: snapshot.conditionalClaim.statement, status: snapshot.conditionalClaim.status } : null,
        lean: snapshot.lean ? { variant: snapshot.lean.variant, status: snapshot.lean.validation?.status } : null,
        error: lastError };
      const text = JSON.stringify(compact, null, 2);
      $('rx-debug').textContent = text.length > 24000 ? text.slice(0, 24000) + '\n… 전체 기록은 JSON 내보내기에 포함됩니다.' : text;
      root.dataset.activeModule = active;
    } catch (error) { $('rx-debug').textContent = '현재 기록 생성 오류: ' + error.message; }
  }
  function onUpdate() { if (!booting) { persistControls(); debug(); } }
  function renderCurrent() {
    if (active === 'primes' || active === 'cohomology') parts.arithmetic.render(active);
    else parts[active === 'yangmills' ? 'ym' : 'ns'].render();
  }
  function setTab(name, updateHash = true) {
    if (!MODULES.includes(name)) return;
    active = name;
    for (const tab of root.querySelectorAll('[data-rx-tab]')) {
      const selected = tab.dataset.rxTab === name;
      tab.classList.toggle('active', selected); tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
    }
    for (const module of MODULES) $('rx-' + module).hidden = module !== name;
    if (updateHash && root.classList.contains('active')) history.replaceState(null, '', '#research-extensions/' + name);
    renderCurrent(); persistControls(); debug();
    report(LABELS[name] + ' · 입력·관측·가정을 확인할 수 있습니다.');
  }
  async function digest(text) {
    const bytes = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  }
  async function record(snapshot) {
    if (saving) throw Error('현재 기록 작업이 진행 중입니다.');
    const api = window.MathScopeV031Foundation;
    if (!api?.commitTypedBundle) throw Error('연구 세션 인터페이스가 아직 준비되지 않았습니다.');
    saving = true; $('rx-save').disabled = true;
    try {
      const session = api.getSession(), content = JSON.stringify(snapshot);
      if (content.length > 500000) throw Error('단일 관측이 너무 큽니다. JSON으로 내보내세요.');
      const inputsHash = await digest(content);
      const latest = api.getSession();
      if (latest.id !== session.id || latest.sessionRevision !== session.sessionRevision) throw Error('현재 세션이 변경되었습니다. 선택한 세션에서 다시 기록하세요.');
      const bundle = createResearchBundle(snapshot, { session: latest, inputsHash });
      const saved = api.commitTypedBundle(bundle, 'Research Extensions · ' + LABELS[snapshot.module]);
      const recordedEvidence = saved.evidence.find(e => e.id === 'rx-' + snapshot.module + '-evidence');
      if (!recordedEvidence || recordedEvidence.inputsHash !== inputsHash) throw Error('저장된 관측 해시를 확인하지 못했습니다.');
      root.dataset.lastSavedModule = snapshot.module; root.dataset.lastSavedGrade = recordedEvidence.grade;
      root.dataset.lastSavedHash = inputsHash; root.dataset.lastSavedSession = saved.id;
      report('“' + saved.title + '”에 ' + LABELS[snapshot.module] + ' 기록 완료 · ' + recordedEvidence.grade + ' · revision ' + saved.sessionRevision);
      debug(); return { sessionId: saved.id, grade: recordedEvidence.grade, inputsHash };
    } finally { saving = false; $('rx-save').disabled = false; }
  }
  parts.arithmetic = mountArithmeticUI({ onUpdate, report });
  parts.ym = mountYMUI({ onUpdate, report, leanBundle, recordClaim: async snapshot => {
    const data = { ...snapshot, module: 'yangmills', camera: cameraState('yangmills'), extensionVersion: EXTENSION_VERSION };
    return record(data);
  } });
  parts.ns = mountNSUI({ onUpdate, report });
  const scenes = { ...parts.arithmetic.scenes, ...parts.ym.scenes, ...parts.ns.scenes };
  booting = false; root.dataset.mounted = 'true';

  for (const button of root.querySelectorAll('[data-rx-tab]')) {
    button.addEventListener('click', event => { if (event.isTrusted) userRouted = true; setTab(button.dataset.rxTab); });
    button.addEventListener('keydown', event => {
      const index = MODULES.indexOf(active), direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      let target = null;
      if (direction) target = MODULES[(index + direction + MODULES.length) % MODULES.length];
      else if (event.key === 'Home') target = MODULES[0];
      else if (event.key === 'End') target = MODULES.at(-1);
      if (target) { event.preventDefault(); setTab(target); $('rx-tab-' + target).focus(); }
    });
  }
  for (const button of root.querySelectorAll('[data-rx-open]')) button.addEventListener('click', () => setTab(button.dataset.rxOpen));
  for (const group of root.querySelectorAll('[data-rx-camera]')) {
    for (const button of group.querySelectorAll('[data-camera]')) button.addEventListener('click', () => { scenes[group.dataset.rxCamera].camera(button.dataset.camera); debug(); });
  }
  $('rx-save').addEventListener('click', async () => {
    try { renderCurrent(); await record(currentSnapshot()); }
    catch (error) { report('기록 실패: ' + error.message, true); }
  });
  $('rx-export').addEventListener('click', async () => {
    try {
      renderCurrent();
      const snapshot = currentSnapshot(), generatedAt = new Date().toISOString();
      const payload = { schema: 'MathScopeResearchExtensionObservation/1', generatedAt, snapshot,
        sourcePage: location.origin + location.pathname, audit: { sha256: await digest(JSON.stringify(snapshot)), runtime: 'JavaScript finite computation / CPU orthographic 3D' } };
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = 'MathScope-' + active + '-observation.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      report('현재 ' + LABELS[active] + ' 입력·관측·출처·가정을 JSON으로 내보냈습니다.');
    } catch (error) { report('내보내기 실패: ' + error.message, true); }
  });
  function runChecks() {
    const results = [...parts.arithmetic.runChecks(), ...parts.ym.runChecks(), ...parts.ns.runChecks()];
    const api = window.MathScopeV031Foundation;
    if (api?.canPromoteEvidence) results.push({
      name: 'Session | finite observations cannot issue FORMAL PASS',
      pass: api.canPromoteEvidence({ grade: 'NUMERICAL INDICATOR' }, 'FORMAL PASS').ok === false
    });
    checks = { checkedAt: new Date().toISOString(), pass: results.every(r => r.pass), passed: results.filter(r => r.pass).length, total: results.length, results,
      scope: 'Finite model, UI and trust-boundary checks. No conjecture proof, full-paper build, or release freeze.' };
    root.dataset.checksPass = String(checks.pass); root.dataset.checksCount = String(checks.total);
    report('확장 검증 ' + checks.passed + '/' + checks.total + ' · ' + (checks.pass ? 'PASS' : '실패 항목을 확인하세요') + ' · 계산·화면·기록 범위');
    $('rx-debug').closest('details').open = true; debug(); return checks;
  }
  $('rx-test').addEventListener('click', () => { try { runChecks(); } catch (error) { report('검증 실행 오류: ' + error.message, true); } });
  const nav = document.querySelector('[data-view-target="research-extensions"]');
  for (const routeButton of document.querySelectorAll('[data-view-target]')) {
    routeButton.addEventListener('click', event => {
      if (!event.isTrusted) return;
      userRouted = true;
      if (routeButton.dataset.viewTarget !== 'research-extensions' && location.hash.startsWith('#research-extensions')) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    });
  }
  nav?.addEventListener('click', () => { setTab(active); report(LABELS[active] + ' · 회전·입력 변경·관측 기록을 사용할 수 있습니다.'); });
  root.addEventListener('input', persistControls);
  let resizeFrame = null;
  window.addEventListener('resize', () => {
    if (resizeFrame || !root.classList.contains('active')) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = null; renderCurrent(); });
  });
  function openFromHash(hash) {
    const match = hash.match(/^#research-extensions(?:[\/=]([a-z]+))?$/);
    if (!match) return false;
    if (MODULES.includes(match[1])) active = match[1];
    nav?.click(); return true;
  }
  window.addEventListener('hashchange', () => { userRouted = true; openFromHash(location.hash); });
  setTab(active, false);
  report('4개 연구 모듈 준비 완료 · 현재 선택한 탭의 관측을 기록할 수 있습니다.');
  if (initialHash.startsWith('#research-extensions')) setTimeout(() => { if (!userRouted) openFromHash(initialHash); }, 650);
  // Bounded read-only inspection; proof promotion remains with the existing verifier.
  window.MathScopeResearchExtensions = Object.freeze({
    version: EXTENSION_VERSION,
    getObservation: () => JSON.parse(JSON.stringify(currentSnapshot())),
    getChecks: () => checks ? JSON.parse(JSON.stringify(checks)) : null
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootResearchExtensions, { once: true });
  else bootResearchExtensions();
}

return {bootResearchExtensions};
})();
})();
