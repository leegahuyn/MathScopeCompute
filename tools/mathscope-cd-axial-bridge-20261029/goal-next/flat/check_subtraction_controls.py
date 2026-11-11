"""Exercise mismatched coefficient, source guard and conjugation bindings."""
from argparse import ArgumentParser
from copy import deepcopy
import json
from pathlib import Path

from combine_principal_cutoffs import combine, load, FORCED_SHA, HOMOGENEOUS_SHA, PROJECTION_SHA


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    here = Path(__file__).resolve().parent
    projection = load(here.parent / 'cycle/group-postfive-residual.json', PROJECTION_SHA)
    forced = load(here / 'forced-principal-cutoffs.json', FORCED_SHA)
    homogeneous = load(here.parent / 'flat-homogeneous/homogeneous-principal-cutoffs.json',
                       HOMOGENEOUS_SHA)
    tests = {}
    cases = forced['firstForcedSubtractedFromSameRowProgram']['cases']

    def rejects(label, *inputs):
        try:
            combine(*inputs)
        except AssertionError:
            tests[label] = 'REJECTED'
        else:
            raise RuntimeError(f'Invalid binding was accepted: {label}')

    wrong_conjugate = deepcopy(forced)
    negative = wrong_conjugate['firstForcedSubtractedFromSameRowProgram']['cases'][0]['coefficients']['-2'][0]
    negative['subtractFirstForced']['imaginaryMultiplier'] = 1
    rejects('positive_imaginary_sign_reused_at_negative_mode', projection, wrong_conjugate, homogeneous)

    wrong_scope = deepcopy(homogeneous)
    wrong_scope['bindings'][0]['sourceGuards'] = cases[1]['ownGuards'][:-1]
    rejects('missing_longitudinal_guard_for_homogeneous_term', projection, forced, wrong_scope)

    wrong_projection = deepcopy(forced)
    slot = wrong_projection['firstForcedSubtractedFromSameRowProgram']['cases'][0]['coefficients']['4'][0]
    slot['projectionRecipe'] = cases[0]['coefficients']['3'][0]['projectionRecipe']
    rejects('mode_four_projection_replaced_by_mode_three', projection, wrong_projection, homogeneous)

    result = combine(projection, forced, homogeneous)
    assert result['symbolicRecompositionCount'] == 240
    args.out.write_text(json.dumps(tests, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(tests))


if __name__ == '__main__':
    main()
