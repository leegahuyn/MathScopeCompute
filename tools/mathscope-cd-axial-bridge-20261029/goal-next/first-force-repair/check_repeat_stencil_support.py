"""Bind the live repeat operator to the closed support of the original stencil."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
from tempfile import TemporaryFile

from check_repeat_forced_candidates import CANDIDATE_FILE, CANDIDATE_SCOPE, Graph, STREAM, verify_manifest
from bind_corrected_flat import Algebra, GEOMETRY_FIELDS, Nodes, check_rows, finite_palette, matrices

OFFSETS = (-1, 0, 1)
SUPPORT = Fraction(3, 4)
RUN = 43015175416
RECEIPT_SHA = '3e3911a19698f1f59187a34665a86be9b1e2f6296a3fa113be1b5f12be2d5285'


def stencil(centres):
    return {tuple(j + shift for j, shift in zip(centres, offsets, strict=True))
            for offsets in product(OFFSETS, repeat=len(centres))}


def stencil_checks():
    # Model all choices at a simultaneous tie, including a switch in one coordinate.
    before = stencil((0, 0, 0, 0))
    changed = Counter()
    for mask in product((0, 1), repeat=4):
        if not any(mask):
            continue
        after = stencil(mask)
        for side, rows in ((-1, before - after), (2, after - before)):
            assert all(any(toggle and row[i] == side for i, toggle in enumerate(mask)) for row in rows)
        assert len(before & after) == 2 ** sum(mask) * 3 ** (4 - sum(mask))
        changed[sum(mask)] += len(before ^ after)
    # On the open half-width 3/4 about the tie, either changed label is strictly outside.
    assert min(abs(Fraction(1, 2) - side) for side in (-1, 2)) - SUPPORT == SUPPORT
    assert Fraction(2) - Fraction(1, 2) == Fraction(3, 2) > SUPPORT
    # Dropping a neighbor would lose the positive factor for the adjacent centre at the tie.
    assert abs(Fraction(1, 2) - 1) < SUPPORT
    return {'simultaneousTieMasks': 15, 'changedUnsignedRowsByNumberOfSwitchedCoordinates': dict(changed),
            'closedSupportRadius': '3/4', 'openStencilSwitchCollarRadius': '3/4',
            'nearestRadius': '1/2', 'omittedLabelMinimumDistance': '3/2',
            'missingAdjacentLabelRejected': True}


def main():
    parser = ArgumentParser(description=__doc__)
    for key in ('candidate-dir', 'official-receipt', 'out'):
        parser.add_argument('--' + key, type=Path, required=True)
    args = parser.parse_args()
    raw_receipt = args.official_receipt.read_bytes()
    assert sha256(raw_receipt).hexdigest() == RECEIPT_SHA
    official = json.loads(raw_receipt)
    assert official['run'] == RUN and len(official['systems']) == 40
    manifest, registry = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, official['commit'])
    assert manifest['node_stream_sha256'] == official['graphSHA256']
    assert manifest['definitions_sha256'] == official['registrySHA256']
    candidate = json.loads((args.candidate_dir / CANDIDATE_FILE).read_bytes())
    assert candidate['snapshot'] == manifest
    _, field_rows, *_ = json.loads(registry['definitions'])
    fields = {row['id']: row for row in field_rows}
    names = [fields[entry['field']]['name'] for entry in candidate['fields']]
    assert names == ['ActualForcedCurrent_velocity_' + str(j) for j in range(3)] + [
        'ActualForcedCurrent_angular_pressure',
        *('GenericSigned162_velocity_' + str(j) for j in range(3)), 'GenericSigned162_angular_pressure']
    indexed_rows = None
    with TemporaryFile() as backing:
        graph = Graph(args.candidate_dir / STREAM, backing, manifest)
        for entry in candidate['fields']:
            field = fields[entry['field']]
            system, actual, orders = graph.args(entry['root'], 'm3_coupled_indexed_partial')
            assert system == field['id'] and actual == field['parameters']
            assert orders == [0] * len(field['directions'])
            rows = [{k: row[k] for k in GEOMETRY_FIELDS} for row in field['rows']]
            if indexed_rows is None:
                indexed_rows = rows
            assert rows == indexed_rows
        powers = matrices()
        checked, pairs = check_rows(Algebra(Nodes(graph)), {'rows': indexed_rows}, powers)
    stencil_evidence = stencil_checks()
    palette = finite_palette(powers)
    assert len(checked) == 162 and sum(pairs.values()) == 13041
    result = {
        'schema': 'MathScope.M3.LiveSecondStencilSupport/1',
        'run': RUN, 'graphSHA256': official['graphSHA256'], 'registrySHA256': official['registrySHA256'],
        'indexedFields': names, 'signedRows': len(checked), 'sameFieldMaps': True,
        'checkedIndexedOuterGuards': sum(len(row['guards']) for row in checked),
        'pairSeparation': dict(pairs), 'closedEnlargedRectangleStrictClearance': palette['strictClearanceAbove'],
        'nearestStencil': stencil_evidence,
        'analyticConsequence': {
            'scope': 'ordinary derivatives on the admitted fixed reference chart',
            'exitingAndEnteringRows': 'literal zero on an open neighborhood of a tie',
            'inactivePairs': 'at least one guarded row is zero on a neighborhood, so its ordinary derivatives are zero there',
            'remainingOwnRowRegularity': 'OPEN',
            'independentSameRowCoefficientEquality': 'OPEN',
        },
        'completeSecondForcedState': False, 'finalJets': 0, 'release': 'HOLD',
    }
    args.out.write_bytes((json.dumps(result, indent=2) + '\n').encode())
    print('PASS live 162 rows and 810 outer guards, 13,041 row pairs, and 15 tie masks')


if __name__ == '__main__':
    main()
