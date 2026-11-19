"""Independently reduce the seven source-bound compact closure roots."""

from argparse import ArgumentParser
from hashlib import sha256
import importlib.util
import json
from pathlib import Path

EXPECTED_RECEIPT = '74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529'
EXPECTED_EXACT = '260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75'
ARITHMETIC = {'rational', 'add', 'multiply', 'inverse', 'integer_power'}
EXPECTED_SOURCE_PINS = {
    'source-postfive-full-3d-residual.mjs': 'd93195ac381c75860e5d450a77ad3160ade16ca4579f4988dc38948e504163de',
    'source-postfive-direct-split.mjs': '2f0ae4c984026ac13661ba032ac40d79fc096e116abdb5c256b28fba4b829774',
    'source-harmonic-assembly.mjs': '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20',
}


def stable_receipt(receipt):
    return {**receipt, 'stages': [{key: value for key, value in stage.items() if key != 'rssBytes'}
                                  for stage in receipt['stages']]}


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def load_exact(module_path):
    assert digest(module_path) == EXPECTED_EXACT, 'Original independent rational reducer changed.'
    spec = importlib.util.spec_from_file_location('original_exact_reducer', module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.Exact


class CompactGraph:
    def __init__(self, closure):
        rows = closure['records']
        ids = [row['originalId'] for row in rows]
        assert ids == sorted(set(ids))
        assert all(isinstance(i, int) and not isinstance(i, bool) and 0 <= i < closure['sourceGraphNodes'] for i in ids)
        self.records = {row['originalId']: row['record'] for row in rows}
        opaque, denominators = [], set()
        for original_id, record in self.records.items():
            operation, args = record['op'], record['args']
            assert isinstance(operation, str) and isinstance(args, list)
            if operation in {'add', 'multiply'}:
                children = args
            elif operation in {'inverse', 'integer_power'}:
                assert len(args) == (1 if operation == 'inverse' else 2)
                children = [args[0]]
                if operation == 'inverse' or args[1] < 0:
                    denominators.add(args[0])
                if operation == 'integer_power':
                    assert isinstance(args[1], int) and not isinstance(args[1], bool)
            else:
                children = []
            if operation not in ARITHMETIC:
                opaque.append(original_id)
            for child in children:
                assert isinstance(child, int) and not isinstance(child, bool)
                assert 0 <= child < original_id and child in self.records
        assert opaque == closure['opaqueOriginalIds']
        assert sorted(denominators) == closure['denominatorOriginalIds']
        self.denominators = sorted(denominators)

    def node(self, original_id):
        record = self.records[original_id]
        return record['op'], record['args']


def reduce_closure(closure, exact_class):
    assert closure['schema'] == 'MathScope.PostFive.DirectSplitArithmeticClosure/1'
    graph = CompactGraph(closure)
    roots = closure['roots']
    difference_roots = roots['conservativeDifferences'] + [roots['divergenceDifference']]
    controls = roots['directResidualControls']
    assert len(difference_roots) == 4 and len(controls) == 3
    assert len(set(difference_roots + controls)) == 7
    assert all(root in graph.records for root in difference_roots + controls)
    algebra = exact_class(graph)
    # The source IDs are topological. Warm the original cached reducer in
    # that order so deep source chains require no Python recursion growth.
    for original_id in graph.records:
        algebra.of(original_id)
    control_sizes = [len(algebra.of(root)) for root in controls]
    assert all(size > 0 for size in control_sizes), 'Direct residual control collapsed.'
    assert all(algebra.of(root) == {} for root in difference_roots), 'An actual direct/split difference survives.'
    return {'zeroPolynomials': 4, 'directResidualMonomials': control_sizes,
            'denominatorValuesRequiringSourceDomain': graph.denominators}


def main():
    parser = ArgumentParser(description=__doc__)
    for option in ('closure', 'manifest', 'receipt', 'exact-module', 'out'):
        parser.add_argument('--' + option, type=Path, required=True)
    parser.add_argument('--source-file', action='append', default=[], metavar='NAME=PATH')
    args = parser.parse_args()
    assert __debug__
    assert digest(args.receipt) == EXPECTED_RECEIPT
    receipt = json.loads(args.receipt.read_bytes())
    assert receipt['status'] == 'VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION' and receipt['prefix'] == 3
    manifest = json.loads(args.manifest.read_bytes())
    assert manifest['schema'] == 'MathScope.PostFive.DirectSplitArithmeticClosureManifest/1'
    assert manifest['firstCycleReceiptSHA256'] == EXPECTED_RECEIPT
    assert manifest['ignoredVolatileReceiptFields'] == ['stages[].rssBytes']
    assert stable_receipt(manifest['currentReceipt']) == stable_receipt(receipt)
    assert manifest['originalPrivatePDESealRevalidated'] and not manifest['actualFullResidualProvedZero']
    raw = args.closure.read_bytes()
    assert sha256(raw).hexdigest() == manifest['closureSHA256'] and len(raw) == manifest['closureBytes']
    closure = json.loads(raw)
    assert closure['sourceGraphNodes'] == manifest['sourceGraphNodes'] == receipt['split']['nodeCount']
    assert len(closure['records']) == manifest['records']
    assert len(closure['opaqueOriginalIds']) == manifest['opaqueRecords']
    assert closure['roots']['conservativeDifferences'] == receipt['split']['roots']
    assert closure['roots']['divergenceDifference'] == receipt['split']['divergence']
    final = next(stage for stage in receipt['stages'] if stage['name'] == 'original-post-five-physical-residual')
    assert closure['roots']['directResidualControls'] == final['conservativeResidual']
    assert closure['physicalVelocity'] == final['velocity'] and closure['physicalPressure'] == final['pressure']
    source_paths = {}
    for item in args.source_file:
        name, path = item.split('=', 1)
        assert name not in source_paths
        source_paths[name] = Path(path)
    assert set(source_paths) == set(EXPECTED_SOURCE_PINS)
    assert len(manifest['sourcePins']) == len(EXPECTED_SOURCE_PINS)
    assert {entry['name']: entry['sha256'] for entry in manifest['sourcePins']} == EXPECTED_SOURCE_PINS
    for entry in manifest['sourcePins']:
        path = source_paths[entry['name']]
        assert digest(path) == entry['sha256'] and path.stat().st_size == entry['bytes']
    result = reduce_closure(closure, load_exact(args.exact_module))
    out = {
        'schema': 'MathScope.PostFive.IndependentDirectSplitReduction/1',
        'status': 'VERIFIED_ACTUAL_DIRECT_SPLIT_RATIONAL_IDENTITIES',
        'closureSHA256': manifest['closureSHA256'], 'firstCycleReceiptSHA256': EXPECTED_RECEIPT,
        'exactReducerSHA256': EXPECTED_EXACT, 'sourcePins': manifest['sourcePins'],
        'roots': closure['roots'], **result,
        'condition': 'The same opaque source/native operands and denominator values are defined on the original admitted chart.',
        'actualConservativeResidualProvedZero': False, 'quantitativeClosure': 'OPEN',
        'finalJets': 0, 'release': 'HOLD',
    }
    args.out.write_text(json.dumps(out, indent=2) + '\n', encoding='utf8', newline='\n')
    print(json.dumps({'zeroPolynomials': result['zeroPolynomials'],
                      'directResidualMonomials': result['directResidualMonomials']}))


if __name__ == '__main__':
    main()
