(() => {
  'use strict';
  const panel = document.querySelector('[data-m4-formal-view]');
  const { formalClaims } = JSON.parse(document.getElementById('ms-r1-data').textContent);
  const find = attr => panel.querySelector('[data-claim-' + attr + ']');
  const write = (attr, text) => { find(attr).textContent = text; };
  if (!formalClaims.claims.length) {
    write('status', 'Lean 증거를 확인할 수 없습니다. ' + formalClaims.status);
    return;
  }

  const picker = find('picker');
  const claims = new Map(formalClaims.claims.map(claim => [claim.claimId, claim]));
  for (const [id, claim] of claims) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = claim.expert.target.split('.').at(-1);
    picker.append(option);
  }

  const draw = () => {
    const claim = claims.get(picker.value);
    const { shared, student, expert } = claim;
    write('id', shared.claimId + ' · ' + claim.grade);
    write('scope', shared.scope);
    write('quantifier', shared.quantifier);
    write('assumptions', shared.assumptionIds.join(', ') || '없음');
    write('approximation', shared.approximationScope);
    find('student').dataset.selectedClaimId = shared.claimId;
    write('explanation', student.explanation);
    write('example', student.example || '');
    find('example').hidden = student.example === null;
    find('expert').dataset.selectedClaimId = shared.claimId;
    write('type', expert.targetType);
    write('axioms', expert.axioms.join(', ') || '없음');
    write('source', claim.sourceFile);
    write('counterexample', expert.counterexampleCondition);
    write('receipt', claim.receiptSha256);
  };
  const preferred = formalClaims.claims.find(claim => claim.criterionIds.includes('I3-08'));
  if (preferred) picker.value = preferred.claimId;
  picker.addEventListener('change', draw);
  draw();
  find('content').hidden = false;
  find('status').hidden = true;
})();
