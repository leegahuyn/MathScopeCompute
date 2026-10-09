import * as C from './contracts.mjs';
import * as S from './session.mjs';
import * as V from './values.mjs';
import * as Compute from './compute.mjs';
import * as Proof from './proof.mjs';
import * as Integration from './integration.mjs';
import { BASELINE } from './baseline-data.mjs';
import { registerM0Tools } from './webmcp.mjs';
import { runM0Acceptance } from './acceptance.mjs';

const clone = value => JSON.parse(C.canonicalStringify(value));
const pretty = value => JSON.stringify(value, null, 2);
const BASELINE_JSON = C.canonicalStringify(BASELINE);

// This bridge exists before the legacy DOMContentLoaded importer starts.
// Data validation cannot issue the legacy application's formal certificates.
if (typeof window !== 'undefined') {
  window.MathScopeM0Contracts = Object.freeze({
    canonicalStringify: C.canonicalStringify,
    validateResearchM0Namespace(namespace) {
      const report = S.validateResearchM0Namespace(namespace);
      if (namespace?.baseline && C.canonicalStringify(namespace.baseline) !== BASELINE_JSON) report.errors.push('M0 baseline differs from the installed release.');
      report.ok = report.errors.length === 0;
      return report;
    },
    async verifyResearchM0Namespace(namespace) {
      const report = await S.verifyResearchM0Namespace(namespace);
      if (namespace?.baselineHash !== await C.sha256(BASELINE_JSON)) report.errors.push('M0 baseline is not the installed release baseline.');
      report.ok = report.errors.length === 0;
      return report;
    },
    quarantineResearchM0Namespace: S.quarantineResearchM0Namespace,
  });
}

const ADAPTER_LABELS = {
  'prime-segment': '소수 구간 · 정확한 정수',
  'padic-delta': 'p-진 δ · 정밀도 전파',
  'rational-interval': '유리수 구간 · 정확한 끝점',
  'integer-matrix-product': '정수 행렬 · D₁D₀ 계산',
};
const ADAPTER_DESCRIPTIONS = {
  'prime-segment': '선택한 유한 구간의 모든 정수를 체와 독립적인 나눗셈 검사로 확인합니다. 상한 1,000,000, 구간 폭 20,000입니다.',
  'padic-delta': 'Zₚ에서 φ = id, δ(a) = (a − aᵖ)/p를 계산합니다. 출력 N자리에는 입력 N+1자리가 필요합니다.',
  'rational-interval': '유리수 끝점을 정확히 계산하여 포함 구간을 얻습니다. 초월함수와 적분은 현재 어댑터의 범위 밖입니다.',
  'integer-matrix-product': '명시한 정수 행렬의 곱을 두 알고리즘으로 확인합니다. 기본 예제는 설계도의 유한 D₁D₀ = 0 계산입니다.',
};
const CONTRACT_LABELS = {
  PrimeQuerySpec: 'PrimeQuerySpec · 무한 소수집합 / 유한 질의',
  PrismSpec: 'PrismSpec · 프리즘 입력 계약',
  GaugeGroupSpec: 'GaugeGroupSpec · 군과 전역형',
  StateFamilySpec: 'StateFamilySpec · 장 / Δ의 역할',
  PDEConstructionSpec: 'PDEConstructionSpec · 방정식 / 출처 / 절단',
  ObservationMapSpec: 'ObservationMapSpec · 4D → 3D 관측',
  AssumptionSpec: 'AssumptionSpec · 개별 가정',
  AssumptionLedger: 'AssumptionLedger · 가정 원장',
  ClaimSpec: 'ClaimSpec · 주장과 적용 범위',
  SourceManifest: 'SourceManifest · 출처와 버전',
};

export async function bootM0() {
  const root = document.getElementById('mathscopeResearchM0');
  if (!root || root.dataset.mounted === 'true') return;
  const $ = id => document.getElementById(id);
  const base = () => {
    const api = window.MathScopeV031Foundation;
    if (!api?.getSession || !api?.commitResearchM0) throw Error('기존 Research Session 연결을 아직 사용할 수 없습니다.');
    return api;
  };
  const engine = Compute.createComputeEngine();
  const examples = await C.getContractExamples();
  const capabilities = await engine.capabilities();
  const proofs = Proof.listShippedProofs();
  const pendingJobs = new Map();
  const replayReports = new Map();
  let selectedJobId = null, selectedNodeId = null, activeTab = 'objects';
  let selectedBundle = null, editedProof = null, selectedFile = null, proofEdit = 0, lastProof = null;
  let lastChecks = null, checking = null, toolRegistration = null, sequence = 0, exportURL = null;
  const nextId = prefix => prefix + ':' + Date.now().toString(36) + ':' + (++sequence);

  function text(id, value) { $(id).textContent = typeof value === 'string' ? value : pretty(value); }
  function status(message, failed = false) {
    text('m0-status', message); $('m0-status').classList.toggle('m0-error', failed); $('m0-status').dataset.error = String(failed);
  }
  function download(name, data) {
    const content = typeof data === 'string' ? data : pretty(data);
    if (exportURL) URL.revokeObjectURL(exportURL);
    exportURL = URL.createObjectURL(new Blob([content], {type: 'application/json;charset=utf-8'}));
    const link = $('m0-download-link'); link.href = exportURL; link.download = name; link.textContent = name + ' 다운로드';
    $('m0-export-content').value = content; $('m0-export-panel').hidden = false; $('m0-export-panel').open = true;
  }
  function on(id, fn) {
    $(id).addEventListener('click', async () => {
      const button = $(id); if (button.dataset.busy === 'true') return;
      button.dataset.busy = 'true'; button.disabled = true;
      try { await fn(); } catch (error) { status(error.message, true); }
      finally { button.dataset.busy = 'false'; button.disabled = false; renderJobs(); }
    });
  }
  function option(select, value, label) {
    const element = document.createElement('option'); element.value = value; element.textContent = label; select.append(element);
  }
  function item(container, title, detail, action, selected = false) {
    const element = document.createElement(action ? 'button' : 'div');
    element.className = 'm0-item'; element.dataset.selected = String(selected);
    if (action) { element.type = 'button'; element.addEventListener('click', action); }
    const strong = document.createElement('strong'); strong.textContent = title;
    const small = document.createElement('small'); small.textContent = detail;
    element.append(strong, small); container.append(element);
  }
  function paragraphs(id, entries) {
    const area = $(id); area.replaceChildren();
    for (const [label, value] of entries) {
      const p = document.createElement('p'), strong = document.createElement('strong');
      strong.textContent = label + ' '; p.append(strong, document.createTextNode(String(value))); area.append(p);
    }
  }

  async function writeNamespace(reason, update) {
    const api = base(), original = api.getSession();
    const migrated = await S.migrateSession(original, BASELINE);
    let ns = migrated.researchM0;
    if (!original.researchM0) ns = await S.addNode(ns, {kind:'SourceManifest', payload:examples.SourceManifest});
    ns = await update(ns, original);
    const result = await api.commitResearchM0(ns, {
      expectedSessionId: original.id, expectedM0Revision: original.researchM0?.revision ?? null, reason,
    });
    renderSession(); return result;
  }

  function renderSession() {
    let current;
    try { current = base().getSession(); } catch (error) { status(error.message, true); return; }
    const ns = current.researchM0;
    text('m0-session-title', current.title || current.id); text('m0-session-id', current.id);
    text('m0-revision', ns ? 'M0 revision ' + ns.revision : 'M0 연결 전');
    text('m0-node-count', (ns?.nodes.length || 0) + ' nodes');
    $('m0-object-list').replaceChildren(); $('m0-assumption-list').replaceChildren(); $('m0-edge-list').replaceChildren();
    if (!ns?.nodes.length) item($('m0-object-list'), '등록된 M0 대상이 없습니다.', '예제를 검사한 뒤 세션에 등록하세요.');
    for (const node of [...(ns?.nodes || [])].reverse()) {
      item($('m0-object-list'), node.id, node.kind + ' · ' + node.revision + ' · ' + node.freshness,
        () => { selectedNodeId = node.id; text('m0-node-detail', node); $('m0-node-detail').closest('details').open = true; }, selectedNodeId === node.id);
      if (node.payload.schema === 'MathScope.AssumptionSpec/1') item($('m0-assumption-list'), node.id,
        node.payload.origin + ' · ' + node.revision + ' · ' + node.payload.statement,
        () => { $('m0-assumption-id').value = node.id; $('m0-assumption-statement').value = node.payload.statement; $('m0-assumption-reason').value = node.payload.reason; });
    }
    for (const edge of ns?.edges || []) item($('m0-edge-list'), edge.from + ' → ' + edge.to, edge.type + ' · ' + edge.freshness + ' · ' + edge.proofStatus);
    const selected = ns?.nodes.find(n => n.id === selectedNodeId); if (selected) text('m0-node-detail', selected);
    $('m0-initialize').textContent = ns ? '현재 M0 연결 확인' : '현재 세션에 M0 연결';
  }
  function setTab(name, updateHash = true, focus = false) {
    if (!['objects','jobs','evidence','lean'].includes(name)) return;
    activeTab = name;
    for (const tab of root.querySelectorAll('[data-m0-tab]')) {
      const active = tab.dataset.m0Tab === name;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      $('m0-panel-' + tab.dataset.m0Tab).hidden = !active;
      if (active && focus) tab.focus();
    }
    if (updateHash && root.classList.contains('active')) history.replaceState(null, '', '#research-foundation/' + name);
  }
  for (const tab of root.querySelectorAll('[data-m0-tab]')) {
    tab.addEventListener('click', () => setTab(tab.dataset.m0Tab));
    tab.addEventListener('keydown', event => {
      const names = ['objects','jobs','evidence','lean'], position = names.indexOf(activeTab);
      let next = position;
      if (event.key === 'ArrowRight') next = (position + 1) % 4;
      else if (event.key === 'ArrowLeft') next = (position + 3) % 4;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = 3;
      else return;
      event.preventDefault(); setTab(names[next], true, true);
    });
  }
  function loadContract() {
    const kind = $('m0-contract-kind').value, example = examples[kind];
    $('m0-contract-json').value = pretty(example); $('m0-object-id').value = example.id;
    text('m0-contract-result', '예제 준비 · 계약 검사는 수학적 가정의 증명을 뜻하지 않습니다.');
  }
  for (const [kind, label] of Object.entries(CONTRACT_LABELS)) option($('m0-contract-kind'), kind, label);
  $('m0-contract-kind').addEventListener('change', loadContract);
  on('m0-contract-example', loadContract);
  on('m0-contract-validate', () => {
    const result = C.validate($('m0-contract-kind').value, JSON.parse($('m0-contract-json').value));
    text('m0-contract-result', result); status(result.ok ? '입력 계약 통과 · 선언한 수학적 가정은 별도 검증 대상입니다.' : '계약 오류를 확인하세요.', !result.ok);
  });
  on('m0-contract-add', async () => {
    const kind = $('m0-contract-kind').value, payload = JSON.parse($('m0-contract-json').value), id = $('m0-object-id').value.trim();
    payload.id = id; if (payload.revision) payload.revision = id + ':r1';
    C.assertValid(kind, payload);
    await writeNamespace('Register ' + kind, ns => S.addNode(ns, {id, kind, payload}, {allowUnresolvedRefs:false}));
    text('m0-contract-result', {ok:true, id, status:'REGISTERED', trust:'DECLARED'}); status(id + '를 현재 세션에 등록했습니다.');
  });
  on('m0-schema-export', () => download('MathScope-' + $('m0-contract-kind').value + '-schema.json', C.SCHEMAS[$('m0-contract-kind').value]));
  on('m0-export-copy', async () => {
    try { await navigator.clipboard.writeText($('m0-export-content').value); status('JSON을 클립보드에 복사했습니다.'); }
    catch { $('m0-export-content').focus(); $('m0-export-content').select(); status('JSON을 선택했습니다. Ctrl+C 또는 Command+C로 복사하세요.'); }
  });
  on('m0-initialize', async () => { await writeNamespace('Connect M0 foundation', ns => ns); status('M0 연결 확인 완료 · 기존 대상과 증거 ID를 보존했습니다.'); });
  on('m0-capture', async () => {
    const getter = window.MathScopeResearchExtensions?.getObservation;
    if (!getter) throw Error('확장 관측 모듈을 사용할 수 없습니다.');
    const snapshot = getter(), original = base().getSession();
    const matched = (original.objects || []).find(n => n.id === 'rx-' + snapshot.module + '-object' && C.canonicalStringify(n.input) === C.canonicalStringify(snapshot.input));
    await writeNamespace('Capture extension ' + snapshot.module, async ns => {
      const legacyRefs = [], bindings = [];
      if (matched) for (const group of ['objects','representations','claims','evidence']) {
        for (const node of original[group] || []) if (node.id.startsWith('rx-' + snapshot.module + '-')) {
          const hash = await C.sha256(node), indexed = ns.legacyIndex.find(n => n.id === node.id && n.hash === hash);
          if (indexed) { legacyRefs.push({id:node.id, revision:node.revision || 'legacy-unversioned', hash}); bindings.push({group, node}); }
        }
      }
      const payload = {schema:'MathScope.LegacyObservation/1', module:snapshot.module, input:snapshot.input,
        scope:{kind:'FINITE',finite:{description:'One finite displayed observation; detailed input cutoffs and projection are retained in snapshot',itemCount:1}},
        legacyRefs, snapshot:{...snapshot, legacyBindings:bindings, bindingRule:'Only unchanged baseline-indexed legacy records with matching input are linked.'},
        grade:snapshot.conditionalClaim ? 'RESEARCH HYPOTHESIS' : 'NUMERICAL INDICATOR'};
      return S.addNode(ns, {id:'m0-observation:' + snapshot.module, kind:'LegacyObservation', payload});
    });
    status(snapshot.module + ' 관측의 입력·3D 표현·출처를 M0에 기록했습니다.');
  });
  on('m0-export', async () => {
    const session = base().getSession(); if (!session.researchM0) throw Error('먼저 M0를 연결하거나 대상을 등록하세요.');
    download('MathScope-M0-' + session.id + '.json', await S.exportSessionBundle(session));
    status('현재 세션과 M0 계약·의존 관계를 파일로 준비했습니다. 아래에서 다운로드하거나 JSON을 복사하세요.');
  });
  on('m0-import', () => $('m0-import-file').click());
  on('m0-revalidate-inputs', async () => {
    await writeNamespace('Recheck imported input contracts', async ns => S.revalidateImportedInputs(ns,{expectedBaselineHash:await C.sha256(BASELINE_JSON)}));
    status('입력의 계약·해시를 다시 확인했습니다. 기존 계산 결과와 Lean 증거는 재실행·재감사 대상입니다.');
  });
  $('m0-import-file').addEventListener('change', async () => {
    const file = $('m0-import-file').files[0]; if (!file) return;
    try {
      if (file.size > 8 * 1024 * 1024) throw Error('가져오기 한도는 8 MiB입니다.');
      const content = await file.text(), header = JSON.parse(content);
      if (header.schema === 'MathScope.ObservationBundle/1') {
        status('가져온 계산 묶음을 설치된 엔진으로 재현 중입니다.');
        const replay = await engine.replayBundle(content); selectedJobId = replay.job.id; renderJobs();
        text('m0-job-result', replay); setTab('jobs'); status('계산 묶음 재현: ' + replay.comparison.status); return;
      }
      if (header.schema === 'MathScope.CheckpointBundle/1') {
        const job = await engine.importCheckpoint(content); selectedJobId = job.id; renderJobs(); setTab('jobs');
        status('체크포인트를 가져왔습니다. 재개하면 저장된 계산 접두부를 다시 검사합니다.'); return;
      }
      const imported = await S.importSessionBundle(content, {expectedBaselineHash:await C.sha256(BASELINE_JSON)});
      if (imported.schema !== C.LEGACY_SESSION_SCHEMA) throw Error('화면에서 가져올 때는 전체 ResearchSession 묶음이 필요합니다.');
      const result = base().importVerifiedBundleSession(imported, 'MathScope M0 JSON');
      if (result?.ok === false) throw Error(result.error || pretty(result));
      renderSession(); status('별도 연구 세션으로 가져왔습니다. 저장된 검증 근거는 REVALIDATION_REQUIRED입니다.');
    } catch (error) { status('가져오기 실패: ' + error.message, true); }
    finally { $('m0-import-file').value = ''; }
  });

  async function loadJob() {
    const adapter = $('m0-adapter').value;
    $('m0-job-json').value = pretty(await Compute.createExampleJob(adapter)); text('m0-adapter-description', ADAPTER_DESCRIPTIONS[adapter]);
  }
  for (const [id,label] of Object.entries(ADAPTER_LABELS)) option($('m0-adapter'), id, label);
  $('m0-adapter').addEventListener('change', () => void loadJob().catch(error => status(error.message,true)));
  on('m0-job-example', loadJob);
  async function runRequest(input, {signal} = {}) {
    if (signal?.aborted) return {ok:false,state:'NOT_STARTED',code:'CANCELLED'};
    const original = base().getSession(), migrated = await S.migrateSession(original, BASELINE);
    const requested = clone(input); requested.id = nextId('m0-job');
    const prepared = await Integration.prepareSessionJob(requested, migrated.researchM0, capabilities);
    if (signal?.aborted) return {ok:false,state:'NOT_STARTED',code:'CANCELLED'};
    const job = await engine.submit(prepared.request);
    pendingJobs.set(job.id, {sessionId:original.id, prepared}); selectedJobId = job.id;
    if (signal) {
      const abort = () => { try { engine.cancel(job.id); } catch {} };
      signal.addEventListener('abort', abort, {once:true});
      void engine.wait(job.id).then(() => signal.removeEventListener('abort',abort));
      if (signal.aborted) abort();
    }
    renderJobs(); status((job.status === 'COMPLETED' ? '계산 완료' + (job.fromCache ? ' · 동일 입력 캐시' : '') : '계산 시작') + ' · ' + ADAPTER_LABELS[job.request.adapter.id]);
    return {ok:true,jobId:job.id,status:job.status,executionMode:job.executionMode};
  }
  on('m0-job-run', () => runRequest(JSON.parse($('m0-job-json').value)));
  function selectedJob() { if (!selectedJobId) throw Error('먼저 작업을 선택하세요.'); return engine.getJob(selectedJobId); }
  function renderJobs() {
    const jobs = engine.listJobs(); $('m0-job-list').replaceChildren();
    for (const job of [...jobs].reverse()) item($('m0-job-list'), ADAPTER_LABELS[job.request.adapter.id] || job.request.adapter.id,
      job.id + ' · ' + job.status + (job.fromCache ? ' · CACHE' : ''), () => { selectedJobId = job.id; renderJobs(); }, selectedJobId === job.id);
    const job = selectedJobId ? engine.getJob(selectedJobId) : null;
    text('m0-job-state', job?.status || 'IDLE'); $('m0-job-progress').value = job?.progress || 0;
    text('m0-job-progress-text', job ? Math.round(job.progress * 100) + '% · ' + job.executionMode + ' · 시도 ' + job.attempt : '아직 실행한 작업이 없습니다.');
    const result = job?.result;
    $('m0-job-cancel').disabled = !job || !['RUNNING','QUEUED','CANCEL_REQUESTED'].includes(job.status);
    $('m0-job-resume').disabled = !job || !['CANCELLED','BUDGET_EXCEEDED'].includes(job.status);
    $('m0-job-save').disabled = !result || !pendingJobs.has(job?.id);
    $('m0-job-export').disabled = !result;
    $('m0-job-replay').disabled = job?.status !== 'COMPLETED';
    if (result) {
      const vals = result.values || {}, lines = [];
      if (vals.count) lines.push(['소수 개수', V.formatValue(vals.count)]);
      if (vals.delta) lines.push(['δ(a)', V.formatValue(vals.delta)]);
      if (vals.result?.kind === 'REAL_INTERVAL') lines.push(['포함 구간', V.formatValue(vals.result)]);
      if (vals.product) {
        const zero = vals.product.every(row => row.every(value => value.kind === 'INTEGER' && value.value === '0'));
        lines.push(['행렬곱',zero ? '0 (' + vals.product.length + ' × ' + (vals.product[0]?.length || 0) + ' 영행렬)' : '[' + vals.product.map(row => '[' + row.map(V.formatValue).join(', ') + ']').join(', ') + ']']);
      }
      lines.push(['기록 등급', result.evidence.grade], ['검증 범위', result.evidence.scopeKind], ['입력 SHA-256', result.inputHash.slice(0,20) + '…']);
      if (result.message) lines.unshift(['실행 응답', result.message]);
      if (replayReports.has(job.id)) lines.push(['독립 재현',replayReports.get(job.id).comparison.status]);
      paragraphs('m0-result-summary',lines); text('m0-job-result',replayReports.has(job.id) ? {result,replay:replayReports.get(job.id).comparison} : result);
    } else { $('m0-result-summary').replaceChildren(); text('m0-job-result', job ? '계산 중 · 마지막 체크포인트를 유지합니다.' : '계산 결과가 여기에 표시됩니다.'); }
  }
  engine.subscribe(job => {
    renderJobs();
    if (job.id === selectedJobId && ['COMPLETED','CANCELLED','PRECISION_REQUIRED','BUDGET_EXCEEDED','FAILED','UNSUPPORTED'].includes(job.status)) status('계산 ' + job.status + ' · ' + job.id, ['FAILED','UNSUPPORTED'].includes(job.status));
  });
  on('m0-job-cancel', () => { const job = selectedJob(); engine.cancel(job.id); status('취소 요청을 보냈습니다. 마지막 체크포인트를 보존합니다.'); });
  on('m0-job-resume', async () => {
    const job = selectedJob();
    if (job.status === 'BUDGET_EXCEEDED') {
      const resource = job.result?.details?.resource;
      if (!['maxMillis','maxBytes','maxItems','maxOperations'].includes(resource)) throw Error('이 예산 오류는 자동 재개할 수 없습니다. 입력과 실행 한도를 확인하세요.');
      const previous = job.request.budget[resource], cap = Compute.COMPUTE_LIMITS[resource];
      const increased = Math.min(cap,Math.max(previous + 1,previous * 2));
      if (increased <= previous) throw Error('현재 어댑터의 ' + resource + ' 한도에 도달했습니다. 더 작은 유한 범위로 새 계산을 만드세요.');
      const budget = {...job.request.budget,[resource]:increased}, context = pendingJobs.get(job.id);
      if (context) {
        const current = base().getSession(); if (current.id !== context.sessionId) throw Error('이 작업을 시작한 연구 세션으로 돌아와 재개하세요.');
        const migrated = await S.migrateSession(current,BASELINE);
        context.prepared = await Integration.prepareSessionJob({...job.request,budget},migrated.researchM0,capabilities);
      }
      await engine.resume(job.id,{budget}); status('체크포인트 재개 · ' + resource + ' ' + previous + ' → ' + increased);
    } else { await engine.resume(job.id); status('체크포인트 재개 · ' + job.id); }
  });
  on('m0-job-save', async () => {
    const job = selectedJob(), context = pendingJobs.get(job.id);
    if (!context) throw Error('가져온 작업은 원래 모델의 세션 연결을 먼저 복원해야 합니다. 재현 묶음으로 보존할 수 있습니다.');
    if (context.sessionId !== base().getSession().id) throw Error('계산을 시작한 연구 세션으로 돌아온 뒤 저장하세요.');
    await writeNamespace('Record compute ' + job.id, ns => Integration.saveSessionJob(ns,context.prepared,job));
    status('입력 대상·계산 작업·결과·출처를 같은 세션에 기록했습니다.');
  });
  on('m0-job-export', async () => {
    const job = selectedJob(), checkpoint = ['CANCELLED','BUDGET_EXCEEDED'].includes(job.status);
    const content = checkpoint ? await engine.exportCheckpoint(job.id) : await engine.exportBundle(job.id);
    download('MathScope-M0-' + (checkpoint ? 'checkpoint-' : 'observation-') + job.id.replaceAll(':','-') + '.json', content);
    status(checkpoint ? '재개 가능한 체크포인트 파일을 준비했습니다.' : '입력·출력·출처·검사 기록·계산 소스가 담긴 파일을 준비했습니다.');
  });
  on('m0-job-replay', async () => {
    const sourceJob = selectedJob(), content = await engine.exportBundle(sourceJob.id), isolated = Compute.createComputeEngine();
    status('새 엔진으로 같은 입력을 다시 계산하고 있습니다.');
    try {
      const replay = await isolated.replayBundle(content); replayReports.set(sourceJob.id,replay); text('m0-job-result',replay);
      status('새 엔진 재현 검사: ' + replay.comparison.status + ' · 가져온 등급을 신뢰하지 않고 다시 계산했습니다.', replay.comparison.status !== 'MATCH');
    } finally { isolated.dispose(); }
  });
  on('m0-cloud-check', async () => {
    if (typeof window.MathScopeV031Stage3?.checkCloud !== 'function') throw Error('기존 계산 서버 연결 API를 사용할 수 없습니다.');
    text('m0-cloud-result','기존 계산 서버 응답 확인 중…');
    const response = await window.MathScopeV031Stage3.checkCloud();
    text('m0-cloud-result',{...response,m0LocalAdapters:'These four exact adapters run in the browser worker; no remote M0 adapter is claimed.'});
  });

  on('m0-assumption-add', async () => {
    const id = $('m0-assumption-id').value.trim();
    const payload = {...clone(examples.AssumptionSpec),id,revision:id + ':r1',statement:$('m0-assumption-statement').value.trim(),reason:$('m0-assumption-reason').value.trim()};
    await writeNamespace('Add USER_AXIOM ' + id, ns => S.addAssumption(ns,payload));
    text('m0-evidence-result',{id,origin:'USER_AXIOM',status:'DECLARED'}); status('사용자 가정을 등록했습니다. 이를 사용하는 주장은 조건부로 유지됩니다.');
  });
  on('m0-assumption-revise', async () => {
    const id = $('m0-assumption-id').value.trim(); let invalidated = [];
    await writeNamespace('Revise assumption ' + id, async ns => {
      const result = await S.reviseAssumption(ns,id,{statement:$('m0-assumption-statement').value.trim(),reason:$('m0-assumption-reason').value.trim()});
      invalidated = result.invalidated; return result.namespace;
    });
    text('m0-evidence-result',{revised:id,stale:invalidated,rule:'Only dependency descendants were invalidated.'});
    status('가정 수정 완료 · 의존 항목 ' + invalidated.length + '개 STALE');
  });
  $('m0-edge-json').value = pretty({id:'m0-example-edge',type:'DEPENDS_ON',from:'source-node-id',to:'dependent-node-id'});
  on('m0-edge-add', async () => {
    const edge = JSON.parse($('m0-edge-json').value);
    await writeNamespace('Add dependency ' + edge.id, ns => S.addEdge(ns,edge,{isVerifiedCertificate:Proof.isVerifiedProofReceipt}));
    text('m0-evidence-result',{ok:true,edgeId:edge.id}); status('검사한 의존 관계를 등록했습니다.');
  });
  on('m0-dependency-example', async () => {
    let info;
    await writeNamespace('Create selective-stale example', async ns => { info = await S.addDependencyExample(ns); return info.namespace; });
    $('m0-assumption-id').value = info.assumptionId;
    const assumption = base().getSession().researchM0.nodes.find(n => n.id === info.assumptionId);
    $('m0-assumption-statement').value = assumption.payload.statement; $('m0-assumption-reason').value = assumption.payload.reason;
    text('m0-evidence-result',{assumptionId:info.assumptionId,dependentIds:info.dependentIds,independentId:info.independentId,next:'Edit the assumption statement and select the revise button.'});
    status('가정 변경 예제를 만들었습니다. 진술을 수정하면 관련 주장 2개만 STALE가 됩니다.');
  });

  function showProofFile() {
    selectedFile = $('m0-proof-file').value;
    $('m0-proof-source').value = editedProof.sourceFiles.find(f => f.path === selectedFile)?.content || '';
  }
  function loadProof() {
    selectedBundle = Proof.getShippedProofBundle($('m0-proof-example').value);
    editedProof = clone(selectedBundle.jobSpec); proofEdit++; lastProof = null;
    $('m0-proof-file').replaceChildren();
    for (const file of editedProof.sourceFiles) option($('m0-proof-file'),file.path,file.path);
    $('m0-proof-file').value = editedProof.sourceFiles.at(-1).path; showProofFile();
    const meta = proofs.find(p => p.id === selectedBundle.id);
    paragraphs('m0-proof-summary', [['정리',meta.target],['학습 설명',meta.explanation.student],['연구 범위',meta.explanation.expert],['명시한 사용자 공리',meta.axioms.custom.join(', ') || '없음']]);
    text('m0-proof-status','NOT CHECKED'); text('m0-proof-result',{claimId:meta.claimId,scope:meta.scope,axioms:meta.axioms,status:'Exact audit comparison required.'});
  }
  for (const proof of proofs) option($('m0-proof-example'),proof.id,proof.label);
  $('m0-proof-example').addEventListener('change',loadProof); $('m0-proof-file').addEventListener('change',showProofFile);
  $('m0-proof-source').addEventListener('input', () => {
    const file = editedProof.sourceFiles.find(f => f.path === selectedFile); if (!file) return;
    file.content = $('m0-proof-source').value; proofEdit++; lastProof = null;
    text('m0-proof-status','STALE'); text('m0-proof-result','소스가 변경되었습니다. 이 내용에는 기존 커널 검사 기록을 적용할 수 없습니다. 새 ProofJob으로 내보낼 수 있습니다.');
  });
  async function checkSelectedProof() {
    const edit = proofEdit, spec = clone(editedProof), bundle = clone(selectedBundle);
    const job = await Proof.prepareProofJob(spec), result = await Proof.assessProofEvidence(job,bundle);
    if (edit !== proofEdit) return {ok:false,status:'STALE',reason:'Source changed during audit comparison.'};
    lastProof = {job,result};
    text('m0-proof-status',result.status); text('m0-proof-result',{job:{id:job.id,target:job.target,digests:job.digests,context:job.context},...result});
    status(result.verified ? '포함된 실제 Lean 검사와 소스·공리·환경이 일치합니다. 적용 범위는 오른쪽 정리의 명세입니다.' : '현재 소스의 감사 상태: ' + result.status);
    return {ok:result.verified,...result,jobId:job.id};
  }
  on('m0-proof-reset',loadProof); on('m0-proof-check',checkSelectedProof);
  on('m0-proof-save', async () => {
    const job = await Proof.prepareProofJob(clone(editedProof));
    await writeNamespace('Record ProofJob ' + job.target, ns => S.addNode(ns,{kind:'ProofJob',payload:job}));
    status('정확한 Lean 소스와 가정·환경을 ProofJob으로 기록했습니다. 임의의 세션 주장에 대한 증명 지위를 부여하지 않습니다.');
  });
  on('m0-proof-export', async () => {
    const job = await Proof.prepareProofJob(clone(editedProof));
    download('MathScope-M0-' + selectedBundle.id + '-ProofJob.json', Proof.exportProofRequest(job,selectedBundle));
    status('새 커널 검사에 필요한 Lean 소스·가정·의존 관계·환경을 파일로 준비했습니다.');
  });

  async function runChecks(options = {}) {
    if (checking) return checking;
    text('m0-check-result','별도 메모리에서 M0 기반 검사 실행 중…');
    $('m0-check-result').closest('details').open = true;
    checking = runM0Acceptance({...options,onProgress:result => text('m0-check-result',result)}).then(result => {
      lastChecks = result; text('m0-check-result',result); root.dataset.checksPass = String(result.pass);
      status('M0 기반 검사 ' + result.passed + '/' + result.total + ' · ' + (result.pass ? 'PASS' : '실패 항목 확인'),!result.pass); return result;
    }).finally(() => { checking = null; });
    return checking;
  }
  on('m0-check',runChecks);
  const api = Object.freeze({
    version:'1.0.0',
    getStatus() {
      const current = base().getSession(), ns = current.researchM0;
      return {ok:true,version:'1.0.0',session:{id:current.id,title:current.title,legacyRevision:current.sessionRevision,m0Revision:ns?.revision ?? null,
        legacyCounts:Object.fromEntries(['objects','representations','claims','evidence'].map(k=>[k,current[k]?.length || 0])),
        m0:ns ? S.dependencySummary(ns) : null},capabilities,
        jobs:engine.listJobs().map(j=>({id:j.id,status:j.status,adapter:j.request.adapter.id,progress:j.progress,fromCache:j.fromCache})),
        proof:{capabilities:Proof.getProofCapabilities(),selected:selectedBundle.id,status:lastProof?.result.status || (proofEdit ? $('m0-proof-status').textContent : 'NOT_CHECKED')},
        checks:lastChecks,releaseGate:'UNCHANGED / HOLD'};
    },
    validateContract:(kind,value)=>C.validate(kind,value),
    runFixture:async (adapter,options) => runRequest(await Compute.createExampleJob(adapter),options),
    getJobStatus:jobId => ({ok:true,job:engine.getJob(jobId)}),
    cancelJob:jobId => ({ok:true,cancelRequested:engine.cancel(jobId),job:engine.getJob(jobId)}),
    runChecks,checkSelectedProof,
  });
  window.MathScopeResearchM0 = api;
  async function registerTools() {
    toolRegistration = await registerM0Tools(api);
    const {dispose,...publicState} = toolRegistration; text('m0-webmcp-status',publicState);
  }
  window.addEventListener('pagehide', event => { toolRegistration?.dispose(); if (!event.persisted) { engine.dispose(); if (exportURL) URL.revokeObjectURL(exportURL); } });
  window.addEventListener('pageshow', event => { if (event.persisted) void registerTools(); });
  window.addEventListener('mathscope:session-rendered',renderSession);
  const nav = document.querySelector('[data-view-target="research-foundation"]');
  nav?.addEventListener('click', () => { setTab(activeTab); renderSession(); });
  for (const button of document.querySelectorAll('[data-view-target]')) button.addEventListener('click',event => {
    if (event.isTrusted && button.dataset.viewTarget !== 'research-foundation' && location.hash.startsWith('#research-foundation')) history.replaceState(null,'',location.pathname + location.search);
  });
  function route() {
    const match = location.hash.match(/^#research-foundation(?:\/(objects|jobs|evidence|lean))?$/);
    if (match) { activeTab = match[1] || 'objects'; nav?.click(); setTab(activeTab,false); }
  }
  window.addEventListener('hashchange',route);
  text('m0-runtime',capabilities.executionMode === 'BROWSER_WEB_WORKER' ? 'Browser Worker · 4 adapters' : 'Local runtime · 4 adapters');
  text('m0-proof-count',proofs.length + ' pinned proof bundles');
  text('m0-capabilities',capabilities); text('m0-proof-capabilities',Proof.getProofCapabilities()); text('m0-baseline',BASELINE);
  loadContract(); await loadJob(); loadProof(); renderSession(); renderJobs();
  root.dataset.mounted = 'true'; root.dataset.version = '1.0.0';
  await registerTools(); route();
  status('M0 준비 완료 · 대상을 등록하거나 정확한 작은 계산을 실행하세요.');
}

if (typeof document !== 'undefined') {
  const start = () => void bootM0().catch(error => {
    const status = document.getElementById('m0-status'); if (status) { status.textContent = 'M0 초기화 오류: ' + error.message; status.classList.add('m0-error'); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
}
