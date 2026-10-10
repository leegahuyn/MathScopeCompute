#!/usr/bin/env python3
"""Run concrete same-datum operator/assembly modules in the pinned original kernel."""
from pathlib import Path
import os, subprocess, json, re, argparse
from run_check import sha, tracked_hashes, AUDIT, REPO, PIN, KERNEL, KERNEL_SHA

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent.parent
DEPS = {
    'SameDatumInputs': HERE / 'attempts/0012',
    'SameDatumMass': HERE.parent / 'independent-review/formal-mass-bound/attempts/0002',
    'FieldBounds': HERE / 'field-attempts/0009',
    'ThresholdBridge': NAVIER / 'followup-20261010-symbolic-gluing/formal-threshold-bridge/attempts/0005',
    'AmplitudeInput': NAVIER / 'followup-20261010-symbolic-gluing/formal-amplitude-input/attempts/0002',
    'AmplitudeDynamics': NAVIER / 'followup-20261010-symbolic-gluing/formal-amplitude-input/dynamics-attempts/0002',
    'PressureSelection': NAVIER / 'followup-20261010-symbolic-gluing/formal-pressure-selection/attempts/0001',
    'AxisFiniteJet': HERE.parent / 'independent-review/formal-finite-jet/attempts/0002',
}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--module', default='OperatorBounds')
    parser.add_argument('--operator-attempt')
    parser.add_argument('--concrete-attempt')
    args = parser.parse_args()
    module = args.module
    if not re.fullmatch('[A-Z][A-Za-z0-9]*', module):
        raise ValueError('Invalid module name')
    if args.operator_attempt:
        DEPS['OperatorBounds'] = HERE / 'operator-attempts' / args.operator_attempt
    if args.concrete_attempt:
        DEPS['ConcreteProducer'] = HERE / 'assembly-attempts' / args.concrete_attempt
    if sha(KERNEL) != KERNEL_SHA:
        raise ValueError('Kernel mismatch')
    deps_before = {name: {'sourceSHA256': sha(path / (name + '.lean')),
                          'oleanSHA256': sha(path / (name + '.olean')),
                          'sourcePath': str(path / (name + '.lean')),
                          'oleanPath': str(path / (name + '.olean'))}
                   for name, path in DEPS.items()}
    bucket = 'operator-attempts' if module == 'OperatorBounds' else 'assembly-attempts'
    n = 1
    while (HERE / bucket / f'{n:04d}').exists():
        n += 1
    dest = HERE / bucket / f'{n:04d}'
    dest.mkdir(parents=True)
    src = dest / (module + '.lean')
    src.write_bytes((HERE / (module + '.lean')).read_bytes())
    depdir = dest / 'inputs'
    depdir.mkdir()
    for name, path in DEPS.items():
        (depdir / (name + '.lean')).write_bytes((path / (name + '.lean')).read_bytes())
    before = tracked_hashes()
    env = os.environ.copy()
    for key in ('GITHUB_TOKEN', 'GH_TOKEN', 'LEAN_PATH', 'LEAN_SRC_PATH'):
        env.pop(key, None)
    env['PATH'] = str(AUDIT / 'lean-entry-layout/bin') + os.pathsep + env.get('PATH', '')
    env['LEAN_SYSROOT'] = str(AUDIT / 'lean-entry-layout')
    env['LAKE_HOME'] = str(AUDIT / 'lake-home')
    env['MATHLIB_CACHE_DIR'] = str(AUDIT / 'mathlib-cache')
    env['LAKE_CACHE_DIR'] = str(AUDIT / 'lake-cache')
    env['LEAN_PATH'] = os.pathsep.join(str(path) for path in DEPS.values())
    output = dest / (module + '.olean')
    cmd = [str(AUDIT / 'lean-4.34.0-rc2-linux/bin/lake'), 'env', 'lean',
           '--root', str(dest), '-o', str(output), str(src)]
    logfile = dest / 'lean.log'
    with logfile.open('w') as log:
        run = subprocess.run(cmd, cwd=REPO, env=env, stdout=log, stderr=subprocess.STDOUT)
    after = tracked_hashes()
    out = logfile.read_text()
    axioms = {name: [v.strip() for v in vals.split(',') if v.strip()]
              for name, vals in re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]", out, re.S)}
    deps_after = {name: {'sourceSHA256': sha(path / (name + '.lean')),
                         'oleanSHA256': sha(path / (name + '.olean')),
                         'sourcePath': str(path / (name + '.lean')),
                         'oleanPath': str(path / (name + '.olean'))}
                  for name, path in DEPS.items()}
    clean = run.returncode == 0 and before == after and deps_before == deps_after and bool(axioms)
    clean = clean and all(set(v) <= {'propext', 'Classical.choice', 'Quot.sound'} for v in axioms.values())
    result = {'schema': 'MathScope.Navier.ConcreteOperatorKernel/1', 'module': module,
              'status': 'PASS' if clean else 'FAIL', 'exitCode': run.returncode, 'command': cmd,
              'sourceSHA256': sha(src), 'outputOleanSHA256': sha(output) if output.exists() else None,
              'logSHA256': sha(logfile), 'kernelSHA256': KERNEL_SHA,
              'kernelPreserved': sha(KERNEL) == KERNEL_SHA, 'originalCommit': PIN,
              'originalTrackedFilesPreserved': before == after,
              'importedInputsPreserved': deps_before == deps_after,
              'importedInputs': deps_before, 'printedAxioms': axioms,
              'fullOriginalN303Completion': False}
    (dest / 'receipt.json').write_text(json.dumps(result, indent=2) + '\n')
    (dest / 'original-before.json').write_text(json.dumps(before, indent=2) + '\n')
    (dest / 'original-after.json').write_text(json.dumps(after, indent=2) + '\n')
    print(json.dumps({'attempt': str(dest), 'status': result['status'], 'exitCode': run.returncode}))
    print(out)
    return int(result['status'] != 'PASS')

if __name__ == '__main__':
    raise SystemExit(main())
