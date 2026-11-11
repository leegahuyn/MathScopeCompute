"""Reduce the three corrected original direct/split differences and divergence."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'corrected-flat'))
from bind_corrected_flat import (BASE, FULL_COMMIT, FULL_SCOPE, STREAM, ReplayGraph,
                                verify_manifest)
from verify_repaired_first_force import Exact, git_blob, read


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('repo', 'artifact', 'out'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    assert __debug__
    run = read(args.artifact / 'corrected-first-cycle-run.json')
    directory = args.artifact / 'corrected-first-cycle-graph'
    manifest, _ = verify_manifest(directory, FULL_SCOPE, FULL_COMMIT)
    assert run['executing_commit'] == FULL_COMMIT
    assert run['first_fivemap_graph_replay_manifest'] == manifest
    assert run['post_five_direct_vs_split_AST_constructed']
    assert run['post_five_direct_vs_split_same_original_pressure_root']
    assert not run['post_five_full_three_dimensional_PDE_residual_proved_zero']
    direct = run['post_five_full_three_dimensional_PDE_residual_roots']
    differences = run['post_five_direct_vs_split_difference_roots']
    divergence = run['post_five_direct_vs_split_divergence_difference_root']
    assert direct == manifest['original_root_ids'][5:8]
    assert differences == manifest['original_root_ids'][8:11]
    assert len(set(direct + differences + [divergence])) == 7
    program = ('research-ide/mathscope-m3/post-signed-20261023/'
               'source-postfive-direct-split.mjs')
    code = git_blob(args.repo, BASE, program)
    assert b'const defects=direct.map((x,j)=>G.sub(x,conservativeDecomposed[j]))' in code
    assert b'const divergenceDefect=G.sub(full.residual.divergence,' in code
    assert b'G.add(original.divergence,increment.divergence)' in code
    with TemporaryFile() as backing:
        graph = ReplayGraph(directory / STREAM, backing, manifest)
        algebra = Exact(graph)
        control = [len(algebra.of(root)) for root in direct]
        assert all(count > 0 for count in control)
        assert [algebra.of(root) for root in differences + [divergence]] == [{}] * 4
    receipt = {
        'schema': 'MathScope.M3.CorrectedDirectSplitExactReduction/1',
        'graphSHA256': manifest['node_stream_sha256'],
        'registrySHA256': manifest['definitions_sha256'],
        'graphNodes': manifest['node_count'], 'sourceCodeSHA256': sha256(code).hexdigest(),
        'conservativeDifferenceRoots': differences, 'divergenceDifferenceRoot': divergence,
        'zeroPolynomials': 4, 'directResidualRoots': direct,
        'controlDirectResidualMonomials': control,
        'condition': 'Original native calls and displayed denominators are defined in the source domain.',
        'completeResidualProvedZero': False, 'finalJets': 0, 'release': 'HOLD',
    }
    args.out.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f"Verified 3 actual conservative differences and 1 divergence difference. Direct monomials {control}.")


if __name__ == '__main__':
    main()
