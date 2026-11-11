"""Compose source-bound principal flat coefficients with the residual projection."""
from argparse import ArgumentParser
from collections import Counter
from hashlib import sha256
import json
from pathlib import Path

from bind_forced_cutoffs import GRAPH_SHA, REGISTRY_SHA, PROJECTION_SHA

FORCED_SHA = '719318e74afc94b7f6c45e6cf36d05362cffa8cf1f4567d0d5b61ed852e0b76d'
HOMOGENEOUS_SHA = '71decc3be7133087fd05268b1c1ae58758fc3c5d26593cbe9deccd038ed08642'
MODES = (-4, -3, -2, -1, 1, 2, 3, 4)


def load(path, expected):
    raw = path.read_bytes()
    actual = sha256(raw).hexdigest()
    assert actual == expected, (path, actual)
    return json.loads(raw)


def conjugate(terms):
    result = []
    for atom in terms:
        if atom[0] == 'forcedComplex':
            kind, real, imaginary, sign = atom
            result.append((kind, real, imaginary, -sign))
        else:
            result.append(atom)
    return result


def combine(projection, forced, homogeneous):
    assert forced['firstPostFiveGraphSHA256'] == homogeneous['graphSHA256'] == GRAPH_SHA
    assert forced['nativeRegistrySHA256'] == homogeneous['registrySHA256'] == REGISTRY_SHA
    assert forced['fullResidualProjectionSHA256'] == homogeneous['residualProjectionSHA256'] == PROJECTION_SHA
    assert homogeneous['forcedPrincipalCutoffsSHA256'] == FORCED_SHA
    assert homogeneous['divideByCutoff'] is False
    assert homogeneous['residualReferenceChartScale'] == projection['forcingChart']['referenceResidualMultiplier']

    source = forced['firstForcedSubtractedFromSameRowProgram']
    forced_bindings = {(r['difference'],r['sign'],r['mode']):r for r in forced['bindings']}
    homogeneous_bindings = {
        (row['difference'],row['sign'],row['component']):(i,row)
        for i,row in enumerate(homogeneous['bindings'])
    }
    assert len(homogeneous_bindings) == len(homogeneous['bindings']) == 30
    assert len(forced_bindings) == len(forced['bindings']) == 20
    assert len(source['rows']) == len(projection['rows']) == 162
    assert source['selectorFormal'] == projection['forcingChart']['levelDifferenceCoordinate']

    cases, corrected_count, recomposed_count = [], 0, 0
    for case in source['cases']:
        key = case['difference'],case['sign']
        m1 = forced_bindings[(*key,1)]
        flat_by_mode = {}
        for mode in MODES:
            m = abs(mode)
            formulas = []
            for component, entry in enumerate(case['coefficients'][str(mode)]):
                raw = ('originalProjection',entry['projectionRecipe'])
                assert entry['projectionRecipe'] == projection['residual'][component]['rawSameRowOwnPhaseNonzeroModes'][str(mode)]
                flat = []
                if m <= 2:
                    forced_atom = entry['subtractFirstForced']
                    expected = forced_bindings[(*key,m)]['components'][component]
                    assert forced_atom['real'] == expected['real']['expected']
                    assert forced_atom['imaginary'] == expected['imaginary']['expected']
                    assert forced_atom['imaginaryMultiplier'] == (1 if mode>0 else -1)
                    flat.append(('forcedComplex',forced_atom['real'],forced_atom['imaginary'],
                                 forced_atom['imaginaryMultiplier']))
                else:
                    assert entry['subtractFirstForced'] is None
                if m == 1:
                    index, hom = homogeneous_bindings[(*key,component)]
                    assert hom['phase'] == case['phase'] == m1['phase']
                    assert hom['sourceGuards'] == case['ownGuards']
                    assert hom['pulseValue'] == m1['pulseValue'] and hom['mappedCutoff'] == m1['cutoff']
                    assert hom['mappedPulseDerivative'] == m1['cutoffDerivative']
                    for family in ('primary','signed'):
                        assert hom[family]['uncutHalfLeading']
                        flat.append(('homogeneousReal',index,family,hom['mappedPulseDerivative']))
                coefficients = Counter({raw:1})
                coefficients.subtract(flat)
                corrected_count += bool(flat)
                decomposition = coefficients.copy()
                decomposition.update(flat)
                assert +decomposition == Counter({raw:1}) and not -decomposition
                recomposed_count += 1
                formulas.append({'residualRecipe':raw,'subtract':flat})
            flat_by_mode[mode] = formulas
        for m in (1,2,3,4):
            assert all(conjugate(p['subtract']) == n['subtract'] for p,n in
                       zip(flat_by_mode[m],flat_by_mode[-m]))
        cases.append({
            'difference':case['difference'], 'sign':case['sign'], 'phase':case['phase'],
            'ownParameters':case['ownParameters'], 'ownGuards':case['ownGuards'], 'modes':flat_by_mode,
        })
    assert recomposed_count == 240 and corrected_count == 120
    for row, original in zip(source['rows'],projection['rows']):
        assert row['label'] == original['label'] and row['rowGuards'] == original['guards']
        assert row['rowActualValues'] == original['values'] and row['differenceNode'] == original['values'][-1]
        assert row['caseIndices'] == [i for i,c in enumerate(cases) if c['sign']==row['label']['sign']]
    return {
        'schema':'MathScope.M3.FirstCyclePrincipalFlatSubtraction/1',
        'verdict':'VERIFIED_EXACT_PRINCIPAL_FLAT_SUBTRACTION',
        'firstForcedCutoffsSHA256':FORCED_SHA, 'homogeneousCutoffsSHA256':HOMOGENEOUS_SHA,
        'originalGraphSHA256':GRAPH_SHA, 'originalRegistrySHA256':REGISTRY_SHA,
        'fullResidualProjectionSHA256':PROJECTION_SHA,
        'selectedCaseCount':len(cases), 'indexedRowCount':len(source['rows']),
        'symbolicRecompositionCount':recomposed_count, 'correctedComplexCoefficientCount':corrected_count,
        'selectorFormal':source['selectorFormal'], 'caseRule':source['caseRule'],
        'rows':source['rows'], 'cases':cases,
        'forcedComplex':'Archived real root plus i times archived imaginary root times the indicated sign.',
        'homogeneousReal':'Mapped pulse derivative times the referenced uncut half-leading real potential recipe.',
        'evaluationOrder':'Apply original reference row guards and selected own case guards before evaluating any subtractand.',
        'modeZero':'Unchanged in this nonzero principal subtraction.',
        'crossRowProducts':'Retain the original projection cross-row terms until their support separation applies.',
        'completeFirstCycleFlatResidual':False,
        'completeSecondForcingInput':False,
    }


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('projection','forced','homogeneous','out'):
        parser.add_argument('--'+name, type=Path, required=True)
    args = parser.parse_args()
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled')
    result = combine(load(args.projection,PROJECTION_SHA),load(args.forced,FORCED_SHA),
                     load(args.homogeneous,HOMOGENEOUS_SHA))
    args.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(f"{result['symbolicRecompositionCount']} exact mode/component recompositions in "
          f"{result['selectedCaseCount']} fixed phase cases")


if __name__ == '__main__':
    main()
