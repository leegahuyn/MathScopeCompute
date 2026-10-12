#!/usr/bin/env python3
"""Observe the bounded whole-body repair without running source constructors."""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import importlib.util
import json
import re
import resource
import shutil
import subprocess
import time

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'research-ide/mathscope-m3/navier'
TESTS = ['angular-coefficient-bodies.test.mjs', 'exact-stage-snapshot.test.mjs',
         'forced-current-kernel.test.mjs', 'initialized-angular-update-kernel.test.mjs',
         'quadratic-source-identity.test.mjs']


def main():
    spec = importlib.util.spec_from_file_location('actual_forced_source_runner', BASE/'tests/run-global-forced-current.py')
    source = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(source)
    out = BASE/'evidence/global-forced-current-20261012/repair-preflight2'
    out.mkdir(parents=True, exist_ok=False)
    paths = sorted(set(source.source_paths() + [Path(__file__).resolve()]))
    before = [source.row(p) for p in paths]
    source.write(out/'source-bytes-before.json', before)
    for path in paths:
        destination = out/'sources'/path.relative_to(ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, destination)
    command = ['node', '--max-old-space-size=512', '--test', '--test-reporter=tap', '--test-concurrency=1']
    command += [str((BASE/'tests'/p).relative_to(ROOT)) for p in TESTS]

    def limits():
        resource.setrlimit(resource.RLIMIT_AS, (2*1024**3, 2*1024**3))

    started = datetime.now(timezone.utc).isoformat()
    tick, stopped = time.monotonic(), None
    with (out/'node.log').open('wb') as log:
        try:
            result = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, preexec_fn=limits, timeout=120)
            code = result.returncode
        except subprocess.TimeoutExpired:
            code, stopped = None, 'OBSERVED_LIGHT_PREFLIGHT_TIMEOUT'
    elapsed = time.monotonic()-tick
    raw = (out/'node.log').read_text()

    def count(name):
        matches = re.findall(r'^# '+name+r' (\d+)$', raw, re.M)
        return int(matches[-1]) if matches else None

    after = [source.row(p) for p in paths]
    source.write(out/'source-bytes.json', {'before': before, 'after': after, 'unchanged': before == after})
    independent = source.independent()
    source.write(out/'independent-fraction.json', independent)
    tests = {'passed': count('pass'), 'failed': count('fail'), 'skipped': count('skipped'), 'required': 18}
    rss = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss*1024
    passed = code == 0 and stopped is None and before == after and tests == {'passed':18,'failed':0,'skipped':0,'required':18}
    passed = passed and independent['pass'] and rss < 1024**3
    artifacts = [source.row(p) for p in sorted(out.iterdir()) if p.is_file()]
    receipt = {'schema':'MathScope.N6.RetainedBodyForcedRepairObservedExecution/1', 'startedAt':started,
               'finishedAt':datetime.now(timezone.utc).isoformat(), 'elapsedSeconds':elapsed, 'command':command,
               'exitCode':code, 'stoppedReason':stopped, 'nodeTests':tests, 'independentChecks':independent['checkCount'],
               'independentPass':independent['pass'], 'sourceFilesUnchanged':before == after, 'sourceFileCount':len(before),
               'sourceSnapshotsPreserved':True, 'observedChildPeakRSSBytes':rss, 'peakRSSLimitBytes':1024**3,
               'artifacts':artifacts, 'allWholeCoefficientBodyAndArgumentChecksExecuted':tests['passed']==18,
               'sourceShapedNestedDenominatorControlExecuted':tests['passed']==18,
               'streamedGraphAndPrefixMutationControlsExecuted':tests['passed']==18,
               'actualOriginalLargeSourceConstructorExecuted':False, 'actualForcedCurrentConstructed':False,
               'originalN602Complete':False,'originalN603Complete':False,'allOrderClassBoundsEstablished':False,'pass':passed}
    source.write(out/'receipt.json', receipt)
    print(json.dumps({'receipt':source.row(out/'receipt.json'),'nodeTests':tests,'independentChecks':independent['checkCount'],
                      'sourceFilesUnchanged':before == after,'sourceFileCount':len(before),'elapsedSeconds':elapsed,'pass':passed}, indent=2), flush=True)
    return 0 if passed else 1


if __name__ == '__main__':
    raise SystemExit(main())
