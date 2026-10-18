export const RECOVERY_SCHEMA = 'MathScope.RecoveryEvidenceView/1';
export const N8_AXES = ['grid', 'fourier_cutoff', 'coefficient_order', 'arithmetic_precision'];
export const N7_AXES = ['space', 'time'];

export function collectRecoveryParts(parts, expectedCount) {
  if (!Number.isInteger(expectedCount) || expectedCount < 1 || expectedCount > 64 || !Array.isArray(parts) || parts.length !== expectedCount) throw new Error('증거 조각의 개수가 고정 원본과 다릅니다.');
  let encoded = '';
  parts.forEach((part, index) => {
    if (part?.index !== String(index) || typeof part.content !== 'string' || !part.content.length || part.content.length > 12000) throw new Error('증거 조각의 순서 또는 크기가 잘못되었습니다.');
    encoded += part.content;
    if (encoded.length > 400000) throw new Error('증거 조각의 전체 크기가 허용 범위를 넘었습니다.');
  });
  return encoded;
}

export async function decodeRecoveryPayload(encoded, encoding, expectedBytes, Decompressor = globalThis.DecompressionStream) {
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

export function validateRecoveryData(data) {
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

export function displayNumber(value) {
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

export function visibleCriteria(data, stage, status, search) {
  const query = String(search || '').trim().toLowerCase();
  return data.criteria.filter(row => (stage === 'all' || row.stage === stage) && (status === 'all' || (status === 'OPEN' ? row.status === 'OPEN' : status === 'INHERITED_COMPLETE' ? row.status === 'INHERITED_COMPLETE' : row.stage === 'M4')) && (!query || (row.id + ' ' + row.title + ' ' + row.original_acceptance).toLowerCase().includes(query)));
}

export function safeEvidenceLink(source) {
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

export function intervalDisplay(row) {
  if (!row?.interval) return {drawable: false, reason: '구간 평가 미완료'};
  const lo = displayNumber(row.interval[0]), hi = displayNumber(row.interval[1]);
  if (lo === null || hi === null) return {drawable: false, reason: '표시 숫자 범위를 넘음 · 원본 문자열 구간을 확인하세요.'};
  if (hi < lo) return {drawable: false, reason: '구간 끝점 순서 오류'};
  const center = lo / 2 + hi / 2;
  const width = hi - lo;
  if (!Number.isFinite(width)) return {drawable: false, reason: '표시 폭 범위를 넘음 · 원본 문자열 구간을 확인하세요.'};
  return {drawable: true, lo, hi, center, width, exact: row.interval[0] === row.interval[1]};
}
