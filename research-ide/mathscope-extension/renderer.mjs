/** Bounded CPU projection of retained 3D data, with an orthographic camera.
 * One visible scene, <=6000 marks, DPR<=1.5, event-driven redraw only.
 * Coordinates remain mathematical data; camera rotations do not change them.
 */
export const palette = ['#76e2cd', '#ffd282', '#99b8ff', '#f69fa5', '#ceafff'];
export function heatColor(t) {
  t = Math.max(0, Math.min(1, t));
  const a = [64, 171, 183], b = [255, 186, 100];
  return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
}
export class Scene3D {
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
export function plot2D(canvas, series, { xLabel = 'x', yLabel = 'y', xBounds, yBounds } = {}) {
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
