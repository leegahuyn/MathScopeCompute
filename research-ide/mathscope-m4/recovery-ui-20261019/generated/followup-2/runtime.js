(() => {
const RECOVERY_SCHEMA = 'MathScope.RecoveryEvidenceView/1';
const N8_AXES = ['grid', 'fourier_cutoff', 'coefficient_order', 'arithmetic_precision'];
const N7_AXES = ['space', 'time'];

function collectRecoveryParts(parts, expectedCount) {
  if (!Number.isInteger(expectedCount) || expectedCount < 1 || expectedCount > 64 || !Array.isArray(parts) || parts.length !== expectedCount) throw new Error('증거 조각의 개수가 고정 원본과 다릅니다.');
  let encoded = '';
  parts.forEach((part, index) => {
    if (part?.index !== String(index) || typeof part.content !== 'string' || !part.content.length || part.content.length > 12000) throw new Error('증거 조각의 순서 또는 크기가 잘못되었습니다.');
    encoded += part.content;
    if (encoded.length > 400000) throw new Error('증거 조각의 전체 크기가 허용 범위를 넘었습니다.');
  });
  return encoded;
}

async function decodeRecoveryPayload(encoded, encoding, expectedBytes, Decompressor = globalThis.DecompressionStream) {
  if (encoding !== 'gzip-base64') throw new Error('지원하지 않는 증거 전송 형식입니다. 원장 링크를 확인하세요.');
  if (!Number.isInteger(expectedBytes) || expectedBytes < 1 || expectedBytes > 2500000) throw new Error('증거 데이터의 원래 바이트 수가 허용 범위를 벗어났습니다.');
  if (typeof encoded !== 'string' || !encoded.length || encoded.length > 400000 || encoded.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) throw new Error('증거 전송 데이터가 비어 있거나 손상되었습니다.');
  if (typeof Decompressor !== 'function') throw new Error('이 브라우저는 저장된 증거 압축을 풀 수 없습니다. 아래 원장 링크에서 같은 원문과 근거를 확인하세요.');
  const packed = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
  const reader = new Blob([packed]).stream().pipeThrough(new Decompressor('gzip')).getReader();
  const raw = new Uint8Array(expectedBytes);
  let offset = 0;
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array) || value.byteLength > expectedBytes - offset) throw new Error('증거 압축 해제 크기가 고정 원본 크기를 초과했습니다.');
      raw.set(value, offset); offset += value.byteLength;
    }
    if (offset !== expectedBytes) throw new Error('증거 압축 해제 크기가 고정 원본과 다릅니다.');
    return raw;
  } catch (error) {
    try { await reader.cancel(); } catch { /* Keep the original validation error. */ }
    throw error;
  } finally { reader.releaseLock(); }
}

function validateRecoveryData(data) {
  if (!data || data.schema !== RECOVERY_SCHEMA) throw new Error('지원하지 않는 증거 데이터 형식입니다.');
  if (!Array.isArray(data.criteria) || data.criteria.length !== 80) throw new Error('원래 M3 64개와 M4 16개 기준이 모두 필요합니다.');
  const ids = data.criteria.map(row => row.id);
  if (new Set(ids).size !== 80) throw new Error('기준 ID가 중복되었습니다.');
  if (data.criteria.filter(row => row.stage === 'M3').length !== 64 || data.criteria.filter(row => row.stage === 'M4').length !== 16) throw new Error('원래 단계별 기준 수가 일치하지 않습니다.');
  if (!data.criteria.every(row => typeof row.original_acceptance === 'string' && row.original_acceptance.trim() && Number.isInteger(row.source_page))) throw new Error('기준 원문 또는 페이지가 누락되었습니다.');
  if (data.status?.m3Complete !== 62 || data.status?.m3Total !== 64) throw new Error('이 증거 묶음의 인증된 M3 기준선은 62/64입니다.');
  const open = data.criteria.filter(row => row.stage === 'M3' && row.status === 'OPEN').map(row => row.id).sort();
  if (open.join('|') !== 'N7-06|N8-05') throw new Error('미해결 원래 의무의 ID가 일치하지 않습니다.');
  if (data.status.actualGlobalLastResolvedTau !== null) throw new Error('이 자료에 실제 전역 last-resolved tau 값은 없습니다.');
  if (data.status.m4Complete !== null || data.status.wholeM4Complete !== false) throw new Error('M4 전체 인수 결과를 이 자료에서 발급할 수 없습니다.');
  if (data.status.initial1260Scope !== 'INITIAL_CONSTRUCTION_ONLY') throw new Error('초기 1,260개 의무의 범위가 달라졌습니다.');
  if (data.criteria.filter(row => row.stage === 'M4').some(row => !['OPEN', 'PARTIAL'].includes(row.status))) throw new Error('이 증거 묶음에는 M4 원래 조건 전체 인수가 없습니다.');
  if (data.refinement.n8.map(row => row.axis).join('|') !== N8_AXES.join('|')) throw new Error('N8-05의 원래 네 축이 달라졌습니다.');
  if (data.refinement.n7.map(row => row.axis).join('|') !== N7_AXES.join('|')) throw new Error('N7-06의 공간·시간 독립 비교가 누락되었습니다.');
  for (const row of data.nativeRows || []) {
    if (typeof row.id !== 'string' || !row.source || !row.scope) throw new Error('native 구간의 출처와 범위가 필요합니다.');
    if (row.interval && (!Array.isArray(row.interval) || row.interval.length !== 2 || row.interval.some(value => typeof value !== 'string'))) throw new Error('원본 구간은 두 문자열 끝점을 유지해야 합니다.');
  }
  if (data.support) {
    const s = data.support;
    if (s.schema !== 'MathScope.ActualOuterCutoffCells/1' || !Number.isInteger(s.grid) || s.grid < 1 || s.cells.length !== s.grid ** 3) throw new Error('실제 cutoff 셀의 개수 또는 형식이 잘못되었습니다.');
    if (s.whole_K_energy !== null || s.actual_last_resolved_tau !== null || s.N706_closed || s.N805_closed || s.actual_nonzero_final_field_evaluated) throw new Error('cutoff 지원 영역을 실제 전역 에너지 완료로 승격할 수 없습니다.');
    if (s.cells.some(cell => cell.energy !== null || !['EXACT_ZERO', 'MISSING_ACTUAL_FIELD_JETS'].includes(cell.status) || cell.index.length !== 3 || cell.index.some(i => !Number.isInteger(i) || i < 0 || i >= s.grid) || !s.jet_sets[cell.jet_set])) throw new Error('cutoff 셀의 원래 상태·좌표·jet 연결이 잘못되었습니다.');
    if (new Set(s.cells.map(cell => cell.index.join(','))).size !== s.cells.length) throw new Error('cutoff 셀 좌표가 중복되었습니다.');
    if (s.cells.filter(cell => cell.status === 'EXACT_ZERO').length !== s.exact_zero_cells || s.cells.filter(cell => cell.status === 'MISSING_ACTUAL_FIELD_JETS').length !== s.missing_field_cells) throw new Error('실제 셀 상태 수가 원장과 다릅니다.');
  }
  return data;
}

function displayNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value).trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?(?:\/[+-]?\d+(?:\.\d*)?)?$/.test(text)) return null;
  const parts = text.split('/');
  const denominator = parts.length === 2 ? Number(parts[1]) : 1;
  if (!denominator) return null;
  let result = Number(parts[0]) / denominator;
  if (parts.length === 2 && /^[+-]?\d+$/.test(parts[0]) && /^[+-]?\d+$/.test(parts[1]) && (!Number.isFinite(Number(parts[0])) || !Number.isFinite(denominator))) {
    const negative = parts[0].startsWith('-') !== parts[1].startsWith('-');
    const numeratorDigits = parts[0].replace(/^[+-]?0*/, '') || '0';
    const denominatorDigits = parts[1].replace(/^[+-]?0*/, '') || '0';
    const mantissa = digits => Number(digits.slice(0, 15)) / Math.pow(10, Math.min(15, digits.length) - 1);
    result = (negative ? -1 : 1) * mantissa(numeratorDigits) / mantissa(denominatorDigits) * Math.pow(10, numeratorDigits.length - denominatorDigits.length);
    if (!result && numeratorDigits !== '0') return null;
  }
  if (!result && /[1-9]/.test(parts[0].split(/[eE]/)[0])) return null;
  return Number.isFinite(result) ? result : null;
}

function visibleCriteria(data, stage, status, search) {
  const query = String(search || '').trim().toLowerCase();
  return data.criteria.filter(row => (stage === 'all' || row.stage === stage) && (status === 'all' || (status === 'OPEN' ? row.status === 'OPEN' : status === 'INHERITED_COMPLETE' ? row.status === 'INHERITED_COMPLETE' : row.stage === 'M4')) && (!query || (row.id + ' ' + row.title + ' ' + row.original_acceptance).toLowerCase().includes(query)));
}

function safeEvidenceLink(source) {
  if (!source || typeof source.url !== 'string') return null;
  try {
    const url = new URL(source.url);
    if (url.protocol !== 'https:') return null;
    const allowed = ['github.com', 'raw.githubusercontent.com', 'cdn.openai.com', 'openai.com'];
    if (!allowed.includes(url.hostname)) return null;
    if (['github.com', 'raw.githubusercontent.com'].includes(url.hostname) && !url.pathname.startsWith('/leegahuyn/MathScopeCompute/')) return null;
    return url.href;
  } catch { return null; }
}

function intervalDisplay(row) {
  if (!row?.interval) return {drawable: false, reason: '구간 평가 미완료'};
  const lo = displayNumber(row.interval[0]), hi = displayNumber(row.interval[1]);
  if (lo === null || hi === null) return {drawable: false, reason: '표시 숫자 범위를 넘음 · 원본 문자열 구간을 확인하세요.'};
  if (hi < lo) return {drawable: false, reason: '구간 끝점 순서 오류'};
  const center = lo / 2 + hi / 2;
  const width = hi - lo;
  if (!Number.isFinite(width)) return {drawable: false, reason: '표시 폭 범위를 넘음 · 원본 문자열 구간을 확인하세요.'};
  return {drawable: true, lo, hi, center, width, exact: row.interval[0] === row.interval[1]};
}

function annotateHistoricalPanels(doc) {
  let installed = 0;
  for (const id of ['ms-m3eight-dialog', 'ms-m4-dialog', 'n3-picard-audit']) {
    const host = doc.getElementById(id), noticeId = 'ms3ip-history-' + id;
    if (!host || doc.getElementById(noticeId)) continue;
    const note = doc.createElement('aside');
    note.id = noticeId;
    note.className = 'ms3ip-historical-notice';
    note.setAttribute('role', 'note');
    note.textContent = '과거 저장 상태 · 아래 56/64 등의 수치는 이 패널이 보존한 과거 범위입니다. 현재 M3 원장은 62/64이며 N7-06·N8-05는 OPEN입니다. M4 원래 인수는 미확인이고 actual global τ=null입니다. 현재 원문·근거는 “M3 62/64 · 실제 증거 보기”에서 확인하세요.';
    host.prepend(note);
    installed++;
  }
  return installed;
}

(() => {
'use strict';
const panel = document.getElementById('ms3ip');
if (!panel) return;
const $ = id => document.getElementById('ms3ip-' + id);
const txt = (id, value) => { $(id).textContent = String(value ?? 'null'); };
const ns = 'http://www.w3.org/2000/svg';
let data = null, selectedCriterion = 'N7-06', originalData = null;
const EXPECTED_ORIGINAL_SHA = '14f5d2edbaed921c97dcfd42a3a5be3485be83b671cbdffafe5101197718cf10';
function json(value) { return JSON.stringify(value, null, 2); }
function option(el, value, label) { const o = document.createElement('option'); o.value = value; o.textContent = label; el.append(o); }
function svgNode(svg, tag, attrs, content) { const n = document.createElementNS(ns, tag); for (const [key, value] of Object.entries(attrs || {})) n.setAttribute(key, value); if (content !== undefined) n.textContent = content; svg.append(n); return n; }
function sourceLinks(id, sources) {
  const el = $(id); el.replaceChildren();
  for (const source of sources.filter(Boolean)) { const href = safeEvidenceLink(source); if (!href) continue; const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = source.label || source.path || '증거'; a.title = source.sha256 ? 'SHA-256: ' + source.sha256 : '원본 저장소'; el.append(a); }
}
function table(id, headers, rows) {
  const target = $(id), t = document.createElement('table'), head = document.createElement('thead'), hr = document.createElement('tr'), body = document.createElement('tbody');
  headers.forEach(label => { const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = label; hr.append(cell); }); head.append(hr); t.append(head);
  rows.forEach(row => { const tr = document.createElement('tr'); row.forEach(value => { const td = document.createElement('td'); td.textContent = String(value ?? 'null · 미평가'); tr.append(td); }); body.append(tr); });
  t.append(body); target.replaceChildren(t);
}
function view(name) {
  panel.querySelectorAll('[data-pane]').forEach(el => { el.hidden = el.dataset.pane !== name; });
  panel.querySelectorAll('[data-view]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.view === name)));
}
$('open').addEventListener('click', () => { if (!panel.open) panel.showModal(); });
$('close').addEventListener('click', () => panel.close());
panel.addEventListener('close', () => $('open').focus());
panel.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => view(el.dataset.view)));
annotateHistoricalPanels(document);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => annotateHistoricalPanels(document), {once: true});

function criterionDetail() {
  const row = data.criteria.find(item => item.id === selectedCriterion);
  if (!row) { txt('ctitle', '선택할 항목이 없습니다.'); ['cstatus', 'csummary', 'coriginal', 'cscope', 'cdetail'].forEach(id => txt(id, '')); $('clinks').replaceChildren(); return; }
  txt('ctitle', row.id + ' · ' + row.title);
  txt('cstatus', row.status + ' · 원 설계도 ' + row.source_page + '쪽');
  $('cstatus').dataset.status = row.status;
  txt('csummary', row.summary);
  txt('coriginal', row.original_acceptance);
  txt('cscope', row.scope);
  txt('cdetail', json(row.details));
  sourceLinks('clinks', [row.source, ...(row.links || [])]);
  $('criteria-list').querySelectorAll('button').forEach(button => button.setAttribute('aria-current', String(button.dataset.id === selectedCriterion)));
}
function criteria() {
  const rows = visibleCriteria(data, $('stage').value, $('status-filter').value, $('search-criteria').value);
  txt('filter-count', rows.length + '개 표시 / 원래 80개 · 상태는 원래 인수 범위에만 적용합니다.');
  const list = $('criteria-list'); list.replaceChildren();
  if (!rows.length) { list.textContent = '검색 결과가 없습니다. 원래 장부의 항목이 삭제되었다는 뜻은 아닙니다.'; selectedCriterion = null; criterionDetail(); return; }
  if (!rows.some(row => row.id === selectedCriterion)) selectedCriterion = rows[0].id;
  rows.forEach(row => { const b = document.createElement('button'); b.type = 'button'; b.textContent = row.id; b.dataset.status = row.status; b.dataset.id = row.id; b.setAttribute('aria-label', row.id + ' ' + row.title + ' ' + row.status); b.addEventListener('click', () => { selectedCriterion = row.id; criterionDetail(); }); list.append(b); });
  criterionDetail();
}
function nativeRows() {
  const rows = data.nativeRows.filter(row => row.family === $('native-family').value);
  $('native-row').replaceChildren(); rows.forEach(row => option($('native-row'), row.id, row.label));
  table('native-table', ['소스 ID', '원래 구간 [하한, 상한]', '적용 범위'], rows.map(row => [row.id, row.interval ? '[' + row.interval.join(', ') + ']' : null, row.scope]));
  nativeDetail();
}
function nativeDetail() {
  const row = data.nativeRows.find(item => item.id === $('native-row').value), svg = $('native-chart');
  svg.replaceChildren();
  if (!row) { txt('native-summary', '표시할 저장 구간이 없습니다.'); txt('native-values', 'null · 미평가'); return; }
  txt('native-summary', row.label + ' · ' + row.scope);
  svgNode(svg, 'title', {}, row.label + '의 구간. 정확한 문자열 끝점은 아래 표에 있습니다.');
  const d = intervalDisplay(row);
  if (!d.drawable) svgNode(svg, 'text', {x: 24, y: 82, fill: '#73521d', 'font-size': 16}, d.reason);
  else {
    const margin = d.width > 0 ? d.width * 0.15 : Math.max(Math.abs(d.lo) * 0.2, 1e-12);
    const low = d.lo - margin, high = d.hi + margin, project = value => 65 + (value - low) / (high - low) * 510;
    svgNode(svg, 'line', {x1: 40, x2: 600, y1: 85, y2: 85, stroke: '#b1c7bc', 'stroke-width': 1});
    if (low <= 0 && high >= 0) { svgNode(svg, 'line', {x1: project(0), x2: project(0), y1: 40, y2: 115, stroke: '#697f71', 'stroke-dasharray': '3 4'}); svgNode(svg, 'text', {x: project(0), y: 135, 'text-anchor': 'middle', 'font-size': 12}, '0'); }
    svgNode(svg, 'line', {x1: project(d.lo), x2: project(d.hi), y1: 76, y2: 76, stroke: '#176349', 'stroke-width': 8});
    [d.lo, d.hi].forEach(value => svgNode(svg, 'line', {x1: project(value), x2: project(value), y1: 65, y2: 87, stroke: '#164e3f', 'stroke-width': 3}));
    svgNode(svg, 'text', {x: 30, y: 26, 'font-size': 14, fill: '#183d30'}, d.exact ? '정확한 단일 구간' : '저장된 균일 구간 · 중심 측정값 없음');
    svgNode(svg, 'text', {x: 30, y: 155, 'font-size': 12}, '하한 ≈ ' + d.lo.toExponential(7) + '     상한 ≈ ' + d.hi.toExponential(7));
  }
  txt('native-values', json({id: row.id, exact_interval: row.interval, scope: row.scope, source_sha256: row.source.sha256, ...row.details}));
  sourceLinks('native-links', [row.source, data.sources.nativeChecks, data.sources.nativeLog, data.sources.nativeCode]);
}
function supportSlice() {
  const support = data.support, svg = $('support-chart');
  svg.replaceChildren(); $('support-cell').replaceChildren();
  if (!support?.cells?.length) { txt('support-summary', '저장된 실제 cutoff 셀을 찾지 못했습니다. 값은 null입니다.'); txt('support-detail', '미검수 · 자료 로딩 또는 검증 실패'); return; }
  const z = Number($('support-z').value), cells = support.cells.filter(cell => cell.index[2] === z), N = support.grid, unit = 384 / N;
  cells.forEach(cell => option($('support-cell'), cell.index.join(','), '(' + cell.index.join(', ') + ') · ' + (cell.status === 'EXACT_ZERO' ? '정확한 0' : '실제 field jets 미평가')));
  svgNode(svg, 'title', {}, 'ζ 절단 ' + support.edges[z] + '에서 ' + support.edges[z + 1] + '의 셀 상태. 동일 셀을 선택 목록으로 탐색할 수 있습니다.');
  cells.forEach(cell => { const x = 115 + cell.index[0] * unit, y = 404 - (cell.index[1] + 1) * unit; const rect = svgNode(svg, 'rect', {x, y, width: unit, height: unit, fill: cell.status === 'EXACT_ZERO' ? '#b9dccb' : '#f4cb81', stroke: '#fff', 'stroke-width': 1, 'data-cell': cell.index.join(',')}); svgNode(rect, 'title', {}, cell.index.join(',') + ' · ' + cell.status); rect.addEventListener('click', () => { $('support-cell').value = cell.index.join(','); supportDetail(); }); });
  svgNode(svg, 'text', {x: 306, y: 454, 'text-anchor': 'middle', 'font-size': 16}, 'ξ · 표시 범위 [−1, 1]');
  svgNode(svg, 'text', {x: 10, y: 218, 'font-size': 14}, 'υ ∈ [−1,1]');
  [['−1',115,424],['0',307,424],['1',499,424],['−1',90,404],['0',90,212],['1',90,20]].forEach(([label,x,y]) => svgNode(svg,'text',{x,y,'font-size':12},label));
  supportDetail();
}
function supportDetail() {
  const support = data.support, key = $('support-cell').value, cell = support?.cells?.find(item => item.index.join(',') === key);
  if (!cell) { txt('support-detail', '현재 절단에 선택한 셀이 없습니다.'); return; }
  const jets = support.jet_sets[cell.jet_set];
  $('support-chart').querySelectorAll('[data-cell]').forEach(rect => { rect.setAttribute('stroke', rect.dataset.cell === key ? '#122f26' : '#fff'); rect.setAttribute('stroke-width', rect.dataset.cell === key ? 3 : 1); });
  const bounds = cell.index.map(i => [support.edges[i], support.edges[i + 1]]);
  txt('support-detail', json({cell_index: cell.index, normalized_coordinate_bounds: {xi: bounds[0], upsilon: bounds[1], zeta: bounds[2]}, stored_time_interval_rho: support.settings.normalized_time, status: cell.status, energy: cell.energy, source_formula: support.source_formula, original_coordinates: support.coordinates, derivative_contract: support.derivative_contract, ...jets, source_sha256: data.sources.support.sha256, run_hash: support.run_hash}));
}
function cutoffCurve() {
  const svg = $('cutoff-chart'); svg.replaceChildren(); const rows = data.support?.cutoff_curve || [];
  svgNode(svg, 'title', {}, '저장된 원래 sigma1 cutoff의 구간. 점 사이 연결은 표시용 보간입니다.');
  if (!rows.length) { svgNode(svg, 'text', {x: 20, y: 100}, '저장 곡선이 없습니다.'); return; }
  const points = rows.map(row => ({x: displayNumber(row.s), low: displayNumber(row.interval[0]), high: displayNumber(row.interval[1])})).filter(row => row.x !== null && row.low !== null && row.high !== null);
  const px = x => 48 + x * 520, py = y => 185 - y * 145;
  svgNode(svg, 'line', {x1: 48, x2: 585, y1: 185, y2: 185, stroke:'#6b8073'});
  svgNode(svg, 'line', {x1: 48, x2: 48, y1: 30, y2: 185, stroke:'#6b8073'});
  const path = points.map((p,i) => (i?'L':'M') + px(p.x) + ',' + py((p.low+p.high)/2)).join(' ');
  svgNode(svg,'path',{d:path,fill:'none',stroke:'#155d45','stroke-width':2});
  svgNode(svg,'text',{x:60,y:24,'font-size':14},'χ(s) = 1 − σ₁(2s − 1) · 保存된 65구간'.replace('保存된', '저장된'));
  svgNode(svg,'text',{x:48,y:207,'font-size':12},'s=0');svgNode(svg,'text',{x:560,y:207,'font-size':12},'s=1');
  svgNode(svg,'text',{x:60,y:229,'font-size':12},'점 사이 선은 표시용 보간 · 실제 비영 전역장의 값이 아님');
}
function supportInit() {
  const support = data.support;
  if (!support) { supportSlice(); return; }
  txt('support-summary', '원래 K를 덮는 정규화 상자 [−1,1]³의 ' + support.grid + '³ = ' + support.cell_count + '개 셀: cutoff 지지 밖 또는 flat 경계의 정확한 0 분기 ' + support.exact_zero_cells + '개, 실제 field jets 미평가 ' + support.missing_field_cells + '개. 이 비율은 K의 에너지 평가율이나 M3 진척률이 아닙니다. whole-K energy = null; actual last-resolved τ = null.');
  option($('support-time'), 'stored', 'ρ = τ/τ₀ ∈ [' + support.settings.normalized_time.join(', ') + '] · 저장된 구간만');
  for(let z=0; z<support.grid; z++) option($('support-z'), z, z + ': ζ ∈ [' + support.edges[z] + ', ' + support.edges[z+1] + ']');
  $('support-z').value = String(Math.floor(support.grid / 2));
  sourceLinks('support-links', [data.sources.support, data.sources.supportRun, data.sources.supportCode, data.sources.supportTests]);
  txt('support-refinement', json({refinement: support.spatial_refinement, scope: support.refinement_scope, original_nonzero_field_evaluated: support.actual_nonzero_final_field_evaluated, remaining_field_jets: support.remaining_field_jets, derivative_contract: support.derivative_contract, source_pins: support.source_pins, code_pins: support.code_pins}));
  supportSlice(); cutoffCurve();
}
function refinement() {
  const which = $('refinement-kind').value, original = data.criteria.find(row => row.id === (which === 'n7' ? 'N7-06' : 'N8-05'));
  txt('refinement-original', original.id + ' · 원 설계도 ' + original.source_page + '쪽\n' + original.original_acceptance);
  txt('refinement-status', 'OPEN · 실제 비영 최종장 A/b/p jets와 stage 1–4·slow-base 자료가 아직 연결되지 않아 실제 에너지 평가 전에 중단되었습니다. null은 0이나 통과값이 아닙니다.');
  const labels = {space:'공간',time:'시간',grid:'격자 grid',fourier_cutoff:'Fourier cutoff',coefficient_order:'coefficient order',arithmetic_precision:'arithmetic precision'};
  table('refinement-table', ['독립 축', '기준 → 2배 요청', '실제 비교 결과', '별도 tail / 오차', '상태'], data.refinement[which].map(row => [labels[row.axis], row.request, row.comparison, row.tail, row.status]));
  txt('refinement-detail', json({original_condition: original.original_acceptance, request: data.refinement.raw[which === 'n7' ? 'N706' : 'N805'], separate_tail: data.refinement.raw.separate_tail, actual_last_resolved_tau: data.refinement.raw.actual_last_resolved_tau, source_sha256: data.sources.refinement.sha256}));
  sourceLinks('refinement-links',[data.sources.refinement,data.sources.supportRun,original.source]);
}
function norm() {
  const n = data.legacy.norms[Number($('norm').value)], svg = $('chart'); svg.replaceChildren();
  if (!n) return;
  txt('normnumbers', '목표 ' + n.target + ' / 확보 ' + n.bound_exponent + ' / 지수 여유 ' + n.margin + ' · 수치 상수 C는 미평가');
  svgNode(svg, 'title', {}, '기존 초기 소스의 노름 목표 지수와 확보 지수. 실제 크기 그래프가 아닙니다.');
  [['목표',n.target,'#738f82'],['확보',n.bound_exponent,'#208168']].forEach(([label,value,color],i) => { svgNode(svg,'text',{x:15,y:45+i*62,'font-size':17},label+' '+value); svgNode(svg,'rect',{x:185,y:24+i*62,width:Math.max(0,displayNumber(value)/2.1*390),height:27,fill:color}); });
  txt('normdetail',json({...n,grade:'동일 초기 소스 정리 적용; 수치 C 미평가',domain:data.legacy.domain,source:data.legacy.source,historical_snapshot:'2026-10-16',current_M3_ledger:'62/64; scoped inherited acceptance'}));
}
function jet() {
  const j = Number($('jet').value);
  txt('jetdetail','j='+j+'\nk_j=c∞·2^A·4^j·(h)_j(1+h)_j·r^(-1-2h-2j)\nS_j=Σ binom(j,l) k_l k_(j-l) 의 계수\np_j=−S_j·r^(-2-4h-2j)/(2+4h+2j)\nF_r=χ_r p_j+χ(1−χ) Dt^j(K²)/r\nF_θ=−2χ_r k_j′−(χ_rr+χ_r/r+χ_zz)k_j\nF_z=χ_z p_j\n열 외곽 r>0, X≥Xext, χ_t=1 범위. 실제 소수값이나 whole-K 완성 수치값은 아닙니다.');
}
function alias() {
  const n=Number($('samples').value), bad=[-4,-3,-2,-1,1,2,3,4].filter(k=>k%n===0);
  txt('alias',bad.length?'실패 대조: 초기 force norm angular 곱의 alias '+bad.join(', ')+' · 해상도 부족':'현재 초기 angular 곱 최대 |m|=4: 정확한 유한 직교 합. 전체 최종장 Fourier tail은 별도 미해결입니다.');
}
function originals() {
  if (!originalData) { txt('originalstate','원본 초기 1,260개 완료를 승계했습니다. 개별 ID 장부는 파일 로딩 대기 중입니다. 화면에 없는 항목을 0개로 표시하지 않습니다.'); $('original').disabled=true; txt('originaldetail','고정 SHA-256의 evidence/UI_DATA.json을 선택하면 개별 원본 ID와 증거가 나타납니다. 현재 원장은 변경하지 않습니다.'); return; }
  const search=$('search').value.trim().toLowerCase(),rows=originalData.original_rows.filter(row=>String(row.id).toLowerCase().includes(search));
  txt('originalstate',rows.length+'개 표시 / 원본 1,260개 · 과거 ID별 PASS와 근거, 이번 재증명 아님.');
  $('original').replaceChildren();rows.forEach(row=>option($('original'),row.id,row.id+' · '+row.family));$('original').disabled=!rows.length;originalDetail();
}
function originalDetail() { const row=originalData?.original_rows.find(item=>item.id===$('original').value);txt('originaldetail',row?json({...row,source_ledger_sha256:originalData.original_ledger_hash,current_M3_unchanged:'62/64'}):'해당 ID가 없습니다. 원본 장부에서 삭제된 것으로 해석하지 않습니다.'); }
async function sha256(raw) { if(!globalThis.crypto?.subtle)throw new Error('WebCrypto가 없어 SHA-256 무결성을 확인할 수 없습니다. 증거 수치는 미검증 상태입니다.');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw))).map(v=>v.toString(16).padStart(2,'0')).join(''); }
function downloadJSON(value,filename) { const url=URL.createObjectURL(new Blob([json(value)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
$('import').addEventListener('change',async()=>{
  txt('import-error','검증 중…');
  try { const file=$('import').files[0];if(!file){txt('import-error','파일 선택이 취소되었습니다.');return;}if(file.size>2500000)throw new Error('파일 한도 2.5MB 초과. 현재 자료를 유지합니다.');const raw=await file.arrayBuffer();if(await sha256(raw)!==EXPECTED_ORIGINAL_SHA)throw new Error('고정 UI 데이터 SHA-256 불일치. 현재 원장을 유지합니다.');const next=JSON.parse(new TextDecoder().decode(raw));if(next.schema!=='MathScope.M3.IntegratedView/1'||next.original_rows?.length!==1260||next.ledger?.rows?.length!==64||next.ledger.complete!==57)throw new Error('고정 과거 자료의 원래 범위가 일치하지 않습니다.');originalData=next;originals();txt('import-error','SHA-256 일치 · 과거 1,260개 ID를 읽었습니다. 현재 M3 62/64는 유지합니다.');}catch(error){txt('import-error',error.message);}
});
async function init() {
  try {
    const el=document.getElementById('ms3ip-recovery-data');if(!el)throw new Error('증거 데이터가 없습니다. 배포 조각의 연결 상태를 확인해야 합니다.');
    const encoded=el.dataset.parts?collectRecoveryParts(Array.from(document.querySelectorAll('script[data-ms3ip-part]')).map(part=>({index:part.dataset.ms3ipPart,content:part.textContent})),Number(el.dataset.parts)):el.textContent;
    const raw=await decodeRecoveryPayload(encoded,el.dataset.encoding,Number(el.dataset.bytes)),hash=await sha256(raw);if(hash!==el.dataset.sha256)throw new Error('증거 데이터 SHA-256 불일치. 수치와 상태의 연결을 중단했습니다.');
    data=validateRecoveryData(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw)));
    txt('m3-count','62 / 64 · 원래 범위 승계');txt('m4-count',data.criteria.filter(r=>r.stage==='M4'&&r.status==='PARTIAL').length+' PARTIAL · '+data.criteria.filter(r=>r.stage==='M4'&&r.status==='OPEN').length+' OPEN');txt('tau','null · 미해결');
    txt('error','데이터 SHA-256 일치 · 원래 80개 ID / 실제 소스의 저장 구간 / null 보존');$('error').dataset.error='false';
    txt('provenance','증거 버전 '+data.revision.label+' · source commit '+data.revision.newEvidenceCommit+' · 현재 기준선 '+data.revision.inheritedCommit+' · UI 데이터 SHA-256 '+hash+' · 원 설계도 SHA-256 '+data.blueprint.sha256);
    sourceLinks('source-links',[data.sources.currentLedger,data.sources.m3Matrix,data.sources.m4Matrix,data.sources.criteria,data.sources.refinement,data.sources.paper]);
    [['matrix','연속 I₁ 행렬 · 25개'],['root','실제 root η-미분 균일 구간 · 8개'],['caller','실제 caller η-미분 균일 구간 · 2개']].forEach(([value,label])=>option($('native-family'),value,label));
    data.legacy.norms.forEach((n,i)=>option($('norm'),i,n.id));for(let j=0;j<=6;j++)option($('jet'),j,j);
    ['stage','status-filter','search-criteria'].forEach(id=>$(id).addEventListener(id==='search-criteria'?'input':'change',criteria));
    $('native-family').addEventListener('change',nativeRows);$('native-row').addEventListener('change',nativeDetail);$('support-z').addEventListener('change',supportSlice);$('support-time').addEventListener('change',supportSlice);$('support-cell').addEventListener('change',supportDetail);$('refinement-kind').addEventListener('change',refinement);
    $('norm').addEventListener('change',norm);$('jet').addEventListener('change',jet);$('samples').addEventListener('change',alias);$('search').addEventListener('input',originals);$('original').addEventListener('change',originalDetail);
    $('export').addEventListener('click',()=>{const n=data.legacy.norms[Number($('norm').value)];downloadJSON({schema:'MathScope.M3.SelectedEvidence/2',norm:n,source:data.legacy.source,domain:data.legacy.domain,evidenceSnapshot:'2026-10-16',currentM3:'62/64',actualGlobalLastResolvedTau:null,wholeM3Complete:false},n.id+'.json');});
    criteria();nativeRows();supportInit();refinement();norm();jet();alias();originals();view('criteria');panel.dataset.ready='true';panel.dataset.evidenceSha256=hash;
  } catch(error) { txt('error',error.message);$('error').dataset.error='true';panel.dataset.ready='error';txt('m3-count','62 / 64 · 원장 기준, 표시 데이터 미검증');panel.querySelectorAll('select,input').forEach(el=>el.disabled=true); }
}
init();
})();

})();