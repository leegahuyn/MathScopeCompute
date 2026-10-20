"""Independent source-index, coefficient and literal-zero certificate checks."""
import copy
import hashlib
import json
from fractions import Fraction


def check(ok, reason):
    if not ok:
        raise ValueError(reason)


def hash_json(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


def verify_original_coverage(terms, evidence):
    rows = evidence['allOriginalTerms']
    check(len(rows) == len(terms), 'Original residual term omitted/duplicated')
    atoms = {}
    for atom in evidence['atomAttempts']:
        sid = atom['sourceNode']
        check(sid not in atoms, 'Original atom attempted twice')
        check(hash_json(atom['actualNode']) == atom['nodeSHA256'], 'Original source atom hash changed')
        atoms[sid] = atom
        fiber = atom.get('completeIndexedThetaFiberProof')
        if fiber and fiber.get('provedConditionalFactorizedAlgebra'):
            check(fiber['allOriginalRowsRetained'] and fiber['originalRows'] == 162 and
                  len(fiber['rowsAttempted']) == 162 and
                  [r['row'] for r in fiber['rowsAttempted']] == list(range(162)),
                  'An indexed theta proof omitted an original source row')
            check(not fiber['slowLabelsOrTorusCopiesFrozenByAssumption'] and
                  all(r['allOriginalSwitchesAndOtherArgumentsThetaIndependent'] and
                      r['exactLocalThetaArgumentAndJacobian'] for r in fiber['rowsAttempted']),
                  'Indexed theta proof silently froze a varying selector/argument')
            check(fiber['provedOnOriginalLeafDefinedDomain'] is False and
                  fiber['factorizedCircuitIsOriginalPartialFunctionDomainIdentity'] is False and
                  bool(fiber['factorizedAlgebraExtraPremises']),
                  'Lazy indexed source domain was silently replaced by total indicator multiplication')
        if atom['sourceAtomProvedZeroOnOriginalLeafDefinedDomain']:
            zero = atom.get('literalSourceZeroRule')
            check(bool(zero), 'Original-domain strict zero needs an independent literal source-atom rule')
            if zero:
                audit = zero['captureAudit']
                check(audit['pass'] and not audit['unboundCapturedCoordinates'] and not audit['unreviewedSupport'],
                      'Literal source-zero capture prerequisites are not proved')
                check(zero['firstStoredDirection'] == zero['completeStoredWord'][0]
                      and zero['firstStoredDirection'] not in audit['formalBodyFreeCoordinates'],
                      'A later absent source derivative was incorrectly used to erase an earlier derivative')
                check(zero['sourceNode'] == sid and zero['nodeSHA256'] == atom['nodeSHA256']
                      and zero['definitionSHA256'] == audit['definitionSHA256'],
                      'Literal zero rule belongs to a different original source/definition')
    for index, (term, row) in enumerate(zip(terms, rows)):
        check(row['inputTermIndex'] == index and row['original'] == term,
              'Original source term index, monomial or coefficient changed')
        check(hash_json(term) == row['originalSHA256'], 'Original source term digest changed')
        expected = []
        if term['monomial']:
            expected = sorted(tuple(map(int, pair.split(':'))) for pair in term['monomial'].split(','))
        actual = sorted((x['sourceNode'], x['power']) for x in row['sourceFactorBindings'])
        check(expected == actual, 'A source factor/power was omitted from a coefficient transport')
        for factor in row['sourceFactorBindings']:
            atom = atoms[factor['sourceNode']]
            check(factor['primaryRoot'] == atom['primaryRoot'] and
                  factor['independentRoot'] == atom['independentTaylorRoot'], 'Source atom formula binding changed')
        if row['originalTermZeroOnLeafDefinedDomain']:
            check(any(atoms[f['sourceNode']]['sourceAtomProvedZeroOnOriginalLeafDefinedDomain']
                      for f in row['sourceFactorBindings']), 'A conditional factorized zero was promoted to original-domain term zero')
        Fraction(term['coefficient'])
    check(evidence['originalAnalyticEqualityProved'] is False,
          'Finite source-body algebra was promoted to original global analytic PDE equality')
    return {'status': 'INDEPENDENT_ORIGINAL_TERM_AND_SOURCE_INDEX_COVERAGE_PASS',
            'allOriginalTermsChecked': len(terms), 'allOriginalAtomsChecked': len(atoms),
            'completeThetaFieldSourceAtomsChecked': sum(bool(a.get('completeIndexedThetaFiberProof', {}).get('provedConditionalFactorizedAlgebra'))
                                                       for a in atoms.values() if a.get('completeIndexedThetaFiberProof')),
            'wholeAnalyticEqualityProved': False}


def negative_source_controls(terms, evidence):
    controls = []
    for name in ['original_coefficient', 'omitted_original_term', 'source_witness', 'factor_power', 'analytic_promotion']:
        changed = dict(evidence)
        changed['allOriginalTerms'] = list(evidence['allOriginalTerms'])
        changed['atomAttempts'] = list(evidence['atomAttempts'])
        if name == 'original_coefficient':
            row = copy.deepcopy(changed['allOriginalTerms'][0])
            changed['allOriginalTerms'][0] = row
            row['original']['coefficient'] = str(Fraction(row['original']['coefficient']) + 1)
        elif name == 'omitted_original_term':
            changed['allOriginalTerms'].pop()
        elif name == 'source_witness':
            changed['atomAttempts'][0] = dict(changed['atomAttempts'][0])
            changed['atomAttempts'][0]['nodeSHA256'] = '0' * 64
        elif name == 'factor_power':
            index = next(i for i, r in enumerate(changed['allOriginalTerms']) if r['sourceFactorBindings'])
            row = copy.deepcopy(changed['allOriginalTerms'][index])
            changed['allOriginalTerms'][index] = row
            row['sourceFactorBindings'][0]['power'] += 1
        else:
            changed['originalAnalyticEqualityProved'] = True
        try:
            verify_original_coverage(terms, changed)
            rejected, reason = False, None
        except (ValueError, KeyError, IndexError) as error:
            rejected, reason = True, str(error)
        controls.append({'mutation': name, 'rejected': rejected, 'reason': reason})
    check(all(c['rejected'] for c in controls), 'A source/term mutation survived independent verification')
    return controls
