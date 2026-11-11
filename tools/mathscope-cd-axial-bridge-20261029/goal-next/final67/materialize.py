"""Read pinned originals into an isolated replay tree."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

PIN = 'eab39dfb1028535b17b5878bc4a17d0de3358020'
M3 = 'research-ide/mathscope-m3/'
RECOVERY = M3 + 'evidence/work-recovery-20261018T072604Z_b479c2d1/'
CLOSURE = M3 + 'closure-evidence-20261023/'
OUTER = M3 + 'recovery-20261019/'
FILES = (
    *(CLOSURE + name for name in (
        'verify_real_67jet_readiness.py', 'verify_67jet_after_actual_signed.py',
        'compile_original_67jet_force_stencil.py', 'conditional_67jet_force_intervals.py',
        'rigorous_rational_intervals.py', 'verify_original_N7_localization_67jet_independent.py',
        'original_monotone2_interval_jets.py', 'certify_original_two_root2_image_endpoints.py',
        'original_torus_fourier_interval.py', 'sourceexpressions_elementary_intervals.py',
        'test_compile_original_67jet_force_stencil.py', 'test_conditional_67jet_force_intervals.py',
        'test_verify_original_N7_localization_67jet_independent.py',
    )),
    OUTER + 'run_outer_cutoff.py',
    OUTER + 'outer_cutoff.py',
    OUTER + 'evidence/OUTER_CUTOFF_WHOLE_K_CELLS.json',
    OUTER + 'evidence/OUTER_CUTOFF_DOUBLED_GRID.json',
    M3 + 'navier/source-inner-growth.mjs',
    M3 + 'navier/source-localization.mjs',
    M3 + 'navier/shrinking-cutoff-summation.mjs',
    M3 + 'navier/final-summation/source-final-summation.mjs',
    M3 + 'navier/evidence/source-localization-20261012/attempt1/localization.json',
    RECOVERY + 'work/prune_recovery/energy/evidence/MISSING_ACTUAL_JET_REQUEST.json',
    RECOVERY + 'work/prune_recovery/energy/evidence/ACTUAL_ENERGY_OPERATOR_BINDING.json',
    RECOVERY + 'recovered/base/work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json',
)
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    root = args.output.resolve()
    pins = {}
    for relative in FILES:
        raw = subprocess.check_output(
            ['git','-c','core.longpaths=true','-C',str(args.repo),'show',PIN+':'+relative]
        )
        path = root / 'source' / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
        pins[relative] = {'sha256':hashlib.sha256(raw).hexdigest(),
                          'gitBlob':hashlib.sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest()}
    (root/'source-pin.json').write_text(json.dumps({'commit':PIN,'files':pins},indent=2)+'\n',
        encoding='utf8',newline='\n')
    print(f'Exact original files: {len(FILES)}')

if __name__ == '__main__':
    main()
