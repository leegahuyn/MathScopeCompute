"""Trace the #672 normalization calls in the authenticated original N=2 current."""
from argparse import ArgumentParser
from collections import defaultdict
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE.parent / p) for p in ('axial-physical', 'f1-mean', 'first-force-repair')]
from bind_mean_angle_scope import Scope
from check_physical_672 import axial_face_integrability
from verify_repaired_first_force import Graph, read

LEFT, XB = 28814, 28826
RUN = 43020929929
COMMIT = '65fda3014857997255fe0b839847d627921b1348'


class NodeView:
    def __init__(self, graph):
        self.graph = graph

    def __getitem__(self, key):
        op, args = self.graph.node(key)
        return {'op': op, 'args': args}


def bind_faces(graph, scope, descriptors, drop=None):
    open_debts, discharged = {}, defaultdict(set)
    finite_x = None
    for i in sorted(scope.values):
        op, args = graph.node(i)
        pending = set()
        if i in descriptors:
            _, operands, orders = args
            assert len(orders) == len(operands) == 2
            for j, (operand, literal) in enumerate(zip(operands, (LEFT, 20), strict=True)):
                if operand != literal:
                    [name] = graph.args(operand, 'coordinate')
                    assert name.startswith('physical_norm_face_')
                    pending.add((operand, i, j))
        for children, bound in scope.plan(i):
            for child in children:
                for variable, site, axis in open_debts.get(child, ()):
                    if op == 'definite_integral' and args[:2] == [child, variable] and i != drop:
                        lo, hi = args[2:]
                        if axis == 0:
                            assert lo == LEFT
                            factors = graph.args(hi, 'multiply')
                            assert len(factors) == 2 and XB in factors
                            [delta] = set(factors) - {XB}
                            [quarter] = graph.args(delta, 'exp')
                            assert graph.args(quarter, 'rational') == ['-1', '4']
                            assert finite_x in (None, hi)
                            finite_x = hi
                        else:
                            assert [lo, hi] == [20, 1]
                        discharged[i, variable].add(site)
                    else:
                        assert variable not in bound or i == drop, (i, variable, site)
                        pending.add((variable, site, axis))
        if pending:
            open_debts[i] = pending
    return open_debts, discharged, finite_x


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('artifact', 'github-metadata', 'selector-readback', 'out'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    assert __debug__
    hosted = read(args.github_metadata)
    assert [hosted[k] for k in ('databaseId', 'headSha', 'status', 'conclusion')] == [
        RUN, COMMIT, 'completed', 'success']
    runtime = read(args.artifact / 'original-n2-prefix.json')
    readback = read(args.selector_readback)
    assert runtime['executingCommit'] == readback['executingCommit'] == COMMIT
    graph_dir = args.artifact / 'original-n2-current-pressure-graph'
    manifest = read(graph_dir / 'original-source-export-manifest.json')
    assert runtime['snapshot'] == manifest
    registry = (graph_dir / 'original-source-functions.json').read_bytes()
    assert sha256(registry).hexdigest() == manifest['definitions_sha256']
    assert manifest['scope'] == 'ORIGINAL_N2_CURRENT_PRESSURE_PREFIX'
    roots = runtime['scope']['roots']
    assert list(roots.values()) == manifest['original_root_ids']
    with TemporaryFile() as backing:
        graph = Graph(graph_dir / 'original-source-nodes.jsonl.gz', backing, manifest)
        scope = Scope(graph, {'base': json.loads(registry), 'definitions': '[[],[],[],[],[]]'})
        stress = scope.base['expression'][672]
        assert stress['name'] == 'ActualAllFiniteOrderOneStress_z'
        assert stress['parameters'] == [4756, 2] and stress['body'] == 117069
        free = {name: sorted(scope.free(root)) for name, root in roots.items()}
        view = NodeView(graph)
        descriptors = {i: view[i] for i in scope.values
                       if graph.node(i)[0] == 'actual_expression_partial' and graph.node(i)[1][0] == 672}
        assert len(descriptors) == 18
        debts, discharged, finite_x = bind_faces(graph, scope, descriptors)
        assert len(discharged) == 12 and all(root not in debts for root in roots.values())
        assert finite_x is not None
        for i, site in descriptors.items():
            assert len([d for d in discharged.values() if i in d]) == sum(
                actual != literal for actual, literal in zip(site['args'][1], [LEFT, 20], strict=True))
        domain = axial_face_integrability(view, descriptors, discharged, finite_x=finite_x,
                                         stress_sites=descriptors.keys())
        removed = min(i for i, _ in discharged)
        control, _, _ = bind_faces(graph, scope, descriptors, drop=removed)
        exposed = [root for root in roots.values() if root in control]
        assert exposed
    result = {
        'schema': 'MathScope.OriginalN2OrderOneAxialFaceReplay/1', 'githubRun': RUN,
        'graphSHA256': manifest['node_stream_sha256'], 'registrySHA256': manifest['definitions_sha256'],
        'roots': roots, 'freeCoordinateUpperSets': free, 'semanticScopeNodes': len(scope.values),
        'reachableDescriptors': sorted(descriptors), 'literalCornerCalls': 3,
        'nonliteralBoundCalls': 15, 'faceIntegrability': domain,
        'radialFaceHull': [LEFT, finite_x], 'etaFaceHull': [20, 1],
        'binderSiteMaps': [{'integral': i, 'variable': v, 'sites': sorted(sites)}
                           for (i, v), sites in sorted(discharged.items())],
        'negativeControl': {'omittedBinder': removed, 'exposedRootIds': exposed},
        'scope': 'Actual N2 current pressure export and its original order-one axial normalization faces.',
        'allCycleFinalField': False, 'finalJets': 0, 'release': 'HOLD',
    }
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8', newline='\n')
    print('Verified 18 reached #672 descriptors, 12 finite face binders, and a removed-binder control.')


if __name__ == '__main__':
    main()
