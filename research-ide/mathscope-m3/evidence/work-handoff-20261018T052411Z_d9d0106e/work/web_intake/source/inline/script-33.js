(() => {
  'use strict';
  const root = document.getElementById('ms-m4-dialog');
  const dataNode = document.getElementById('ms-m4-data');
  if (!root || !dataNode || root.dataset.ready) return;
  const model = JSON.parse(dataNode.textContent);
  const byId = new Map(model.criteria.map(item => [item.taskId, item]));
  const q = selector => root.querySelector(selector);
  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  let selectedId = 'N6-01';
  let importedRecords = 0;
  const setMessage = value => { q('[data-message]').textContent = value; };
  const link = (text, href) => {
    const node = make('a', text);
    node.href = href; node.target = '_blank'; node.rel = 'noopener noreferrer';
    return node;
  };
  for (const receipt of model.observedReceipts || []) {
    const paragraph = make('p');
    paragraph.append(make('strong', `${receipt.label}: `), make('span', receipt.result));
    const digest = make('code', `영수증 SHA-256 ${receipt.sha256}`);
    paragraph.append(make('br'), digest);
    q('[data-observed-receipts]').append(paragraph);
  }
  function select(id, focusDetail = false) {
    const item = byId.get(id); if (!item) return;
    selectedId = id;
    root.querySelectorAll('[data-criterion]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.criterion === id)));
    q('[data-detail-title]').textContent = `${id} · ${item.title}`;
    q('[data-detail-state]').textContent = id.startsWith('N') ? '원래 M3 기준 · 잔여 의무' : 'M4 최종 인수 미확인';
    q('[data-detail-original]').textContent = item.exactCriterion;
    q('[data-detail-page]').textContent = `99쪽 원 설계도 p.${item.pdfPage}`;
    q('[data-detail-sha]').textContent = model.blueprintSha256;
    q('[data-detail-deps]').textContent = item.dependencies.join(' → ');
    q('[data-detail-evidence]').textContent = item.evidenceBoundary;
    const checks = q('[data-detail-checks]'); checks.replaceChildren();
    item.requiredChecks.forEach(check => checks.append(make('li', check)));
    const links = q('[data-detail-links]'); links.replaceChildren();
    item.links.forEach(value => links.append(link(value.label, value.url)));
    q('[data-inspector]').dataset.selectedCriterion = id;
    if (focusDetail) { q('[data-detail-title]').focus({ preventScroll: true }); q('[data-inspector]').scrollIntoView({ block: 'nearest', behavior: 'auto' }); }
  }
  for (const group of model.groups) {
    const section = make('section', undefined, 'ms-m4-group');
    const heading = make('h3', group.label); section.append(heading);
    const grid = make('div', undefined, 'ms-m4-grid');
    model.criteria.filter(item => group.ids.includes(item.taskId)).forEach(item => {
      const button = make('button', undefined, 'ms-m4-item');
      button.type = 'button'; button.dataset.criterion = item.taskId;
      button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-controls', 'ms-m4-inspector');
      button.append(make('strong', item.taskId), make('span', item.title));
      button.addEventListener('click', () => select(item.taskId, matchMedia('(max-width:700px)').matches));
      grid.append(button);
    });
    section.append(grid); q('[data-catalog]').append(section);
  }
  model.sequence.forEach(step => {
    const li = make('li'); const button = make('button', step.label);
    button.type = 'button'; button.dataset.step = step.id;
    button.addEventListener('click', () => select(step.select, true));
    li.append(button); q('[data-flow]').append(li);
  });
  const launcher = document.getElementById('ms-m4-launcher');
  launcher.addEventListener('click', () => {
    if (typeof root.showModal === 'function') root.showModal(); else root.setAttribute('open', '');
    launcher.setAttribute('aria-expanded', 'true');
    q('[data-close]').focus();
  });
  const close = () => { if (typeof root.close === 'function') root.close(); else root.removeAttribute('open'); launcher.setAttribute('aria-expanded', 'false'); launcher.focus(); };
  q('[data-close]').addEventListener('click', close);
  root.addEventListener('close', () => { launcher.setAttribute('aria-expanded', 'false'); launcher.focus(); });
  q('[data-export]').addEventListener('click', () => {
    const record = { schemaVersion: 'mathscope.m4.web-view/1', blueprintSha256: model.blueprintSha256,
      publicBaselineSha256: model.publicBaselineSha256, selectedCriterion: selectedId,
      m3OriginalAccepted: 56, m3OriginalTotal: 64, m4FinalAcceptance: 'UNCONFIRMED',
      importedTrust: 'REASSESSMENT_REQUIRED', evidenceRecords: [],
      criteria: model.criteria.map(item => ({ taskId: item.taskId, originalPage: item.pdfPage, state: item.taskId.startsWith('N') ? 'ORIGINAL_M3_PENDING' : 'FINAL_ACCEPTANCE_UNCONFIRMED' })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }));
    const a = make('a'); a.href = url; a.download = 'MathScope-M3-M4-evidence-view.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setMessage('선택 상태와 원래 기준을 내보냈습니다. 인수 권한은 내보내기에 포함되지 않습니다.');
  });
  q('[data-import]').addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 262144) throw new Error('256 KiB 가져오기 예산을 초과했습니다.');
      const imported = JSON.parse(await file.text());
      if (imported.schemaVersion !== 'mathscope.m4.web-view/1') throw new Error('지원하지 않는 보기 형식입니다.');
      if (imported.blueprintSha256 !== model.blueprintSha256 || imported.publicBaselineSha256 !== model.publicBaselineSha256) throw new Error('원 설계도 또는 공개 기준 hash가 다릅니다.');
      if (!byId.has(imported.selectedCriterion)) throw new Error('원래 기준 ID가 아닙니다.');
      if (!Array.isArray(imported.evidenceRecords) || imported.evidenceRecords.length > 256) throw new Error('증거 기록 형식 또는 개수 예산이 잘못되었습니다.');
      importedRecords = imported.evidenceRecords.length;
      select(imported.selectedCriterion);
      root.dataset.importedTrust = 'QUARANTINED_REASSESSMENT_REQUIRED';
      root.dataset.importedRecordCount = String(importedRecords);
      setMessage(`가져온 기록 ${importedRecords}건은 검토 대기(QUARANTINED)입니다. 선택만 복원했으며 56/64와 M4 미확인 판정은 유지됩니다.`);
    } catch (error) {
      root.dataset.lastImportError = 'IMPORT_REJECTED';
      setMessage(`가져오기 거부: ${error.message} 기존 관측과 판정은 유지됩니다.`);
    } finally { event.target.value = ''; }
  });
  select(selectedId);
  root.dataset.ready = 'true';
  root.dataset.m3Accepted = '56'; root.dataset.m3Total = '64';
  root.dataset.m4FinalAcceptance = 'UNCONFIRMED';
})();
