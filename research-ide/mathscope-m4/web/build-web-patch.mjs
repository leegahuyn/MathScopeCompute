import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { M4_CRITERIA, HANDOFF_BASELINE } from '../criteria.mjs';
import { assessM4Acceptance, buildM4ChecklistView } from '../acceptance.mjs';

const own = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = name => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1]; };
const sha = data => createHash('sha256').update(data).digest('hex');
const catalog = JSON.parse(await readFile(resolve(own, 'original-criteria.json'), 'utf8'));
const checklist = buildM4ChecklistView(await assessM4Acceptance());
const branchRoot = 'https://github.com/leegahuyn/MathScopeCompute/blob/mathscope-m3-resume-20261013/';
const pinnedRoot = `https://github.com/leegahuyn/MathScopeCompute/blob/${HANDOFF_BASELINE.historicalResumeHead}/`;
const observedReceipts = [];
for (const [label, path, scope] of [
  ['실제 saved-five norm 검사', 'research-ide/mathscope-m3/evidence/resume-20261013/local-latest-norms-attempt3/receipt.json', '유한 소스 결속 계산·세 변조 대조; N6 완료는 별도입니다.'],
  ['독립 fast-time 소스 검사', 'research-ide/mathscope-m3/evidence/resume-20261013/local-fast-time-audit-attempt1/receipt.json', '실제 정의·초기값·전체 행에서 두 fast 좌표 독립성을 확인했습니다. 정의역·class·전체 PDE 증명은 별도입니다.'],
  ['fast-time·norm 결합 검사', 'research-ide/mathscope-m3/evidence/resume-20261013/local-fast-time-integration-attempt2/receipt.json', '같은 원본 source·전체 압력의 조건부 결합입니다. 수치 norm·전체 PDE·초기 class 완료를 뜻하지 않습니다.'],
]) {
  const bytes = await readFile(resolve(own, '../../..', path));
  const receipt = JSON.parse(bytes);
  if (receipt.pass !== true || receipt.exitCode !== 0 || receipt.counts.fail !== 0 || receipt.sourceModulesUnchangedDuringRun !== true) throw new Error('Unverified source receipt: ' + path);
  observedReceipts.push({ kind: 'ACTUAL_SOURCE_TEST_RUN', file: path, repoPath: path, sha256: sha(bytes), label,
    result: `${receipt.counts.pass}/${receipt.counts.tests}, exit ${receipt.exitCode}. ${scope}` });
}
for (const [kind, file] of [
  ['HISTORICAL_ARTIFACT_BYTES', 'evidence/pinned-artifact-audit-20261013.json'],
  ['FRESH_KERNEL_REPLAY', 'evidence/local-kernel-replay-20261013-attempt2/replay.json'],
]) {
  let bytes;
  try { bytes = await readFile(resolve(own, '..', file)); }
  catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  const receipt = JSON.parse(bytes);
  if (kind === 'HISTORICAL_ARTIFACT_BYTES' && receipt.kernelAudits?.every(item => item.verified && item.code === 'HISTORICAL_KERNEL_ARTIFACTS_MATCH')) {
    observedReceipts.push({ kind, file, sha256: sha(bytes), label: '기존 Lean 감사 소스·로그 바이트 재검사',
      result: `${receipt.kernelAudits.length}개 기존 target의 hash가 일치했습니다. 새 커널 실행 또는 M4 원래 기준 전체 인수를 뜻하지 않습니다.` });
  }
  if (kind === 'FRESH_KERNEL_REPLAY' && receipt.actualKernelExecuted === true) {
    const finite = receipt.executions.find(x => x.name === 'Finite');
    const analytic = receipt.executions.find(x => x.name === 'Analytic');
    observedReceipts.push({ kind, file, sha256: sha(bytes), label: '이번 재개의 실제 Lean 실행',
      result: `유한 소스 compile exit ${finite?.exitCode}; 조건부 해석 소스 exit ${analytic?.exitCode}${analytic?.log?.includes("unknown module prefix 'Mathlib'") ? ' (Mathlib import 누락)' : ''}. 로컬 Lean 4.34.0-rc2, 기존 4.34.1 pin 일치=${receipt.historicalToolchainMatched}. 거짓 rfl 대조 거부=${receipt.falseRflRejected}. M4 최종 인수는 미확인입니다.` });
  }
}
const auditLinks = [
  { label: '원래 기준 원문', url: `${branchRoot}research-ide/mathscope-m4/web/original-criteria.json` },
  { label: 'M4 인수·증거 계약', url: `${branchRoot}research-ide/mathscope-m4/README_KO.md` },
  ...observedReceipts.map(item => ({ label: item.label, url: `${branchRoot}${item.repoPath || 'research-ide/mathscope-m4/' + item.file}` })),
];
const dependencies = {
  'N6-01': ['N5', '동일 primary source'], 'N6-02': ['N6-01', '같은 최신 (u,p)'],
  'N6-07': ['N6-01', 'N6-02', '각 finite stage'], 'N6-08': ['N6-07', 'Lemma 5.4'],
  'N7-04': ['N6-08', 'N7-01/02/03', '같은 (9.21) 장'], 'N7-05': ['N7-04', '전체 force jets'],
  'N7-06': ['N6-08', 'N7-04/05', '전체 compact K'], 'N8-05': ['N6-08', 'N7', '독립 refinement'],
};
const m3Checks = {
  'N6-01': ['SAME_SOURCE_SEQUENTIAL_J0', 'LATEST_COMPLETE_PRESSURE', 'EXACT_DEFINITION_9_4_CLASS_AND_MOMENTS'],
  'N6-02': ['INDEPENDENT_DIRECT_PDE', 'ALL_QUADRATIC_REMAINDERS', 'PRESSURE_FLAT_TAIL_ERROR_BUDGET'],
  'N6-07': ['COMMON_DOMAIN_ALL_FINITE_STAGES', 'ALL_ORDER_CONSTANTS_AND_LOG_POWERS', 'DERIVATIVE_AND_TAIL_BOUNDS'],
  'N6-08': ['SHRINKING_CUTOFF_CURL', 'ACTIVE_INDICES', 'LEMMA_5_4_COMPARISON_TAIL'],
  'N7-04': ['ALL_ORDER_TERMINAL_FORCE_JETS', 'ORIGIN_FLATNESS', 'FINITE_NUMERIC_THEOREM_DISTINCTION'],
  'N7-05': ['COMPLETE_JETS_BJ_SCHEDULE', 'DIFFERENTIATED_TAIL', 'COMPACT_FORCE_SUPPORT_AND_JET_MATCH'],
  'N7-06': ['WHOLE_K_ENERGY_BALANCE', 'INDEPENDENT_SPACE_TIME_REFINEMENT', 'BOUND_10_13'],
  'N8-05': ['INDEPENDENT_GRID_CUTOFF_ORDER_PRECISION', 'SEPARATE_TAIL_BOUND', 'LAST_RESOLVED_POSITIVE_TAU'],
};
const criteria = catalog.criteria.map(item => {
  const m4 = M4_CRITERIA.find(value => value.id === item.taskId);
  const view = checklist.groups.flatMap(group => group.criteria).find(value => value.claimId === item.taskId);
  const isM3 = item.taskId.startsWith('N');
  const group = item.taskId.slice(0, 2);
  return { ...item, claimId: view?.claimId || item.taskId,
    dependencies: dependencies[item.taskId] || (group === 'I3' ? ['I0/I1 승계', 'M3 동일 소스·가정', '실제 Lean kernel'] : ['I0–I3', '선택 릴리스 범위', 'M3 잔여 의무 검증']),
    requiredChecks: m4?.checks || m3Checks[item.taskId],
    evidenceBoundary: isM3 ? '공개 누적 평가 56/64의 잔여 항목입니다. 제한된 fixture·norm graph 성공은 이 원래 기준의 새 완료 영수증이 아닙니다.' : 'FINAL_ACCEPTANCE_UNCONFIRMED. 원문 기준의 실제 실행·독립 검수 영수증을 연결하기 전에는 인수 완료를 표시하지 않습니다.',
    links: isM3 ? [
      { label: '공개 56/64 평가', url: `${pinnedRoot}research-ide/mathscope-m3/M3_ALL64_REVIEW_KO.md` },
      { label: `${group} 역사적 진행표`, url: `${pinnedRoot}research-ide/mathscope-m3/${group}_PROGRESS.json` },
      { label: '소스 결속 mean-change', url: `${pinnedRoot}research-ide/mathscope-m3/navier/source-saved-five-mean-change-norms.mjs` },
      ...auditLinks,
    ] : auditLinks,
  };
});
if (criteria.length !== 24 || new Set(criteria.map(x => x.taskId)).size !== 24) throw new Error('Exactly 8 M3 plus 16 M4 originals are required.');
if (catalog.sourceSha256 !== HANDOFF_BASELINE.blueprintSha256) throw new Error('Blueprint hash mismatch.');
const model = {
  schemaVersion: 'mathscope.m4.web-panel/1', blueprintSha256: catalog.sourceSha256,
  publicBaselineSha256: HANDOFF_BASELINE.publicHtmlSha256, m3Accepted: 56, m3Total: 64,
  m4FinalAcceptance: 'UNCONFIRMED', criteria, observedReceipts,
  groups: [
    { label: 'M3 · 남은 원래 수학 의무 8개', ids: HANDOFF_BASELINE.pendingOriginalM3 },
    { label: 'M4 · I3 형식화·증거 관문', ids: M4_CRITERIA.filter(x => x.id.startsWith('I3')).map(x => x.id) },
    { label: 'M4 · R1 통합 인수·재현', ids: M4_CRITERIA.filter(x => x.id.startsWith('R1')).map(x => x.id) },
  ],
  sequence: [
    { id: 'j0', label: 'N6-01 초기 상태', select: 'N6-01' },
    { id: 'pde', label: 'N6-02 전체 잔차', select: 'N6-02' },
    { id: 'orders', label: 'N6-07 차수·도메인', select: 'N6-07' },
    { id: 'local', label: 'N6-08 local 합성', select: 'N6-08' },
    { id: 'global', label: 'N7 force·에너지 / N8 적응', select: 'N7-04' },
    { id: 'kernel', label: 'M4 I3 커널·가정', select: 'I3-06' },
    { id: 'release', label: 'M4 R1 통합 인수', select: 'R1-08' },
  ],
};
const css = await readFile(resolve(own, 'panel.css'), 'utf8');
const js = await readFile(resolve(own, 'panel.js'), 'utf8');
const serialized = JSON.stringify(model).replace(/</g, '\\u003c');
const fragment = `\n<!-- MathScope owned additive evidence panel: mathscope-m4-evidence-20261013 -->
<style id="ms-m4-style">${css}</style>
<button id="ms-m4-launcher" type="button" aria-haspopup="dialog" aria-controls="ms-m4-dialog" aria-expanded="false">M3·M4 원문·증거</button>
<dialog id="ms-m4-dialog" aria-labelledby="ms-m4-heading">
  <header class="ms-m4-top"><div><h2 id="ms-m4-heading">원래 기준에서 실행 증거까지</h2><small>MathScope M3 → M4 · 2026-10-13 인수 기준</small></div><button type="button" class="ms-m4-close" data-close>닫기</button></header>
  <div class="ms-m4-body">
    <div class="ms-m4-baseline"><span>공개 M3 원문 인수<strong>56 / 64 · 잔여 8개</strong></span><span>M4 역사적 최종 인수<strong>미확인 · UNCONFIRMED</strong></span></div>
    <p class="ms-m4-caveat">RH global bridge·전칭 BSD·일반 G continuum quantum YM·전체 원문 NS 재구성은 RESEARCH OPEN입니다. 원래 실패 기록: coherent source class 2100초 TIME_LIMIT, completePressureCertificateSaved=false.</p>
    <details class="ms-m4-observed"><summary>재개 실행 영수증 · 성공/실패 범위</summary><div data-observed-receipts></div></details>
    <nav aria-label="같은 소스의 안전 검증 순서"><ol class="ms-m4-flow" data-flow></ol></nav>
    <div class="ms-m4-workspace">
      <div class="ms-m4-catalog" data-catalog aria-label="원래 체크리스트 기준"></div>
      <section class="ms-m4-inspector" id="ms-m4-inspector" data-inspector aria-labelledby="ms-m4-detail-heading">
        <span class="ms-m4-state" data-detail-state></span><h3 id="ms-m4-detail-heading" tabindex="-1" data-detail-title></h3>
        <p class="ms-m4-original" data-detail-original></p>
        <dl><dt>원문 위치</dt><dd data-detail-page></dd><dt>원 설계도 SHA</dt><dd><code data-detail-sha></code></dd><dt>선행 조건</dt><dd data-detail-deps></dd><dt>증거 범위</dt><dd data-detail-evidence></dd></dl>
        <details><summary>필요한 검증 증거</summary><ul class="ms-m4-checks" data-detail-checks></ul></details><div class="ms-m4-links" data-detail-links></div>
      </section>
    </div>
    <div class="ms-m4-tools"><button type="button" data-export>기준·선택 내보내기</button><label class="ms-m4-import-label">보기 가져오기 <input type="file" accept="application/json,.json" data-import aria-label="검토 대기 상태로 보기 가져오기"></label></div>
    <p class="ms-m4-message" role="status" aria-live="polite" data-message></p>
    <p class="ms-m4-footer">원문 식·정리·수치 실행·렌더링은 서로 다른 증거 층입니다. 이 패널은 원래 24개 기준을 추적하며 완료 권한을 부여하지 않습니다. 공개 기준 v102 / 22764e0e · SHA-256 ${HANDOFF_BASELINE.publicHtmlSha256}</p>
  </div>
</dialog>
<script type="application/json" id="ms-m4-data">${serialized}</script>
<script id="ms-m4-script">${js}</script>
<!-- End MathScope owned additive evidence panel -->\n`;
await mkdir(resolve(own, 'evidence'), { recursive: true });
await writeFile(resolve(own, 'patch-fragment.html'), fragment);
await writeFile(resolve(own, 'panel-model.json'), JSON.stringify(model, null, 2) + '\n');
await writeFile(resolve(own, 'evidence/standalone.html'), `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MathScope M3·M4 evidence panel QA</title><body style="margin:0;background:#edf3f7"><main style="padding:30px;font-family:system-ui"><h1>MathScope 원문·증거 패널 검수</h1><p>하단 M3·M4 버튼으로 24개 원래 기준을 열 수 있습니다.</p></main>${fragment}</body></html>`);
let baselineCheck = null;
if (arg('--baseline')) {
  const baseline = await readFile(resolve(arg('--baseline')));
  const digest = sha(baseline);
  if (digest !== HANDOFF_BASELINE.publicHtmlSha256) throw new Error(`Public baseline changed: ${digest}`);
  const html = baseline.toString('utf8');
  if (html.includes('mathscope-m4-evidence-20261013')) throw new Error('Owned anchor already exists; duplicate insertion rejected.');
  const endings = [...html.matchAll(/<\/body\s*>/gi)];
  if (endings.length !== 1) throw new Error('A single closing body anchor is required.');
  const index = endings[0].index;
  const candidate = html.slice(0, index) + fragment + html.slice(index);
  const recovered = candidate.replace(fragment, '');
  if (!Buffer.from(recovered).equals(baseline)) throw new Error('Existing bytes were changed.');
  const output = arg('--output') ? resolve(arg('--output')) : resolve(own, 'evidence/local-candidate.html');
  await writeFile(output, candidate);
  baselineCheck = { baselineSha256: digest, candidateSha256: sha(candidate), baselineBytes: baseline.length,
    addedBytes: Buffer.byteLength(fragment), originalBytesPreserved: true, insertionAnchor: 'single closing body', output };
}
const receipt = { schemaVersion: 'mathscope.m4.web-patch-build/1', createdAt: new Date().toISOString(),
  fragmentSha256: sha(fragment), modelSha256: sha(JSON.stringify(model)), criteriaCount: criteria.length,
  originalM3Remaining: 8, m4OriginalCriteria: 16, m3OriginalAccepted: 56, m4FinalAcceptance: 'UNCONFIRMED',
  baselineCheck, publicationConfirmed: false };
await writeFile(resolve(own, `evidence/build-receipt-${receipt.createdAt.replace(/[^0-9]/g, '')}.json`), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
await writeFile(resolve(own, 'evidence/build-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt, null, 2));
