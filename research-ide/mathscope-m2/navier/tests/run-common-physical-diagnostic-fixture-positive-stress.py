"""Small real-worker integration of the additive source runner, without math."""
import contextlib
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE.parents[2]
OUT = BASE / 'research/evidence/node-inspector-diagnostics-20261011/common-runner-integration-attempt1'
OUT.mkdir()
runner_path = BASE / 'tests/run-common-physical-package-diagnostic-positive-stress.py'
spec = importlib.util.spec_from_file_location('positive_stress_diagnostic_runner_fixture', runner_path)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
fixture = OUT / 'actual-small-checkpoint-worker.test.mjs'
fixture.write_text("""import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
test('small checkpoint and CPU diagnostic integration',async()=>{
  console.log('# SOURCE_PROGRESS '+JSON.stringify({phase:'positive-stress-leading-angular-source-start',at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
  const start=performance.now();let checkpoints=0,sum=0;
  async function checkpoint(complete=false){
    checkpoints++;
    await writeFile(process.env.M2_COMMON_PHYSICAL_EVIDENCE,JSON.stringify({complete,certificates:{fixture:{checkpoints}},sourceConstructions:{fixture:1},mathematicalSourceExecuted:false}));
  }
  function diagnosticArithmeticBurst(){
    const until=performance.now()+3;
    while(performance.now()<until)sum+=Math.sqrt(1+sum%97);
  }
  await checkpoint();
  while(performance.now()-start<2400){
    diagnosticArithmeticBurst();
    if(performance.now()-start<550&&performance.now()-start>checkpoints*100)await checkpoint();
    await new Promise(resolve=>setTimeout(resolve,4));
  }
  assert.ok(sum>0);assert.ok(checkpoints>=3);await checkpoint(true);
});
""")
runner.EVIDENCE = OUT
runner.SOURCE_TEST = fixture
runner.SAMPLING_INTERVAL = 0.05
runner.STALE_SECONDS = 0.25
runner.PROFILE_SECONDS = 0.1
runner.TIMEOUT_SECONDS = 30
runner.CLIENT_TIMEOUT_SECONDS = 15
old_argv = sys.argv
wrapper_log = OUT / 'integration-wrapper.log'
with wrapper_log.open('x') as stream, contextlib.redirect_stdout(stream):
    try:
        sys.argv = [str(runner_path), '1', '--preflight']
        preflight_code = runner.main()
        sys.argv = [str(runner_path), '1', '--run']
        execution_code = runner.main()
    finally:
        sys.argv = old_argv
process_path = OUT / 'actual-common-physical-package-source-attempt1-process.json'
process = json.loads(process_path.read_text())
diagnostic = process['diagnostic']
checks = [
    {'id': 'real-small-worker-and-frozen-runner-exit-zero', 'pass': preflight_code == execution_code == 0 and process['pass'] and process['tests'] == {'passed': 1, 'failed': 0}},
    {'id': 'both-checkpoint-and-log-staleness-trigger-one-capture', 'pass': diagnostic['status'] == 'CAPTURED' and diagnostic['observedExitCode'] == 0 and diagnostic['checkpointCountAtTrigger'] >= 3 and diagnostic['secondsWithoutVisibleOrCheckpointProgress'] > runner.STALE_SECONDS},
    {'id': 'worker-pause-is-resumed-and-process-identities-retained', 'pass': diagnostic['debuggerPauseResumed'] and diagnostic['reportedWorkerHostPid'] and diagnostic['reportedWorkerLocalPid']},
    {'id': 'namespace-aware-process-tree-includes-manager-and-worker', 'pass': process['memoryObservation']['namespaceAwareProcessTree']['maximumProcessCount'] >= 2 and process['peakRSSBytes'] > 0},
    {'id': 'existing-attempt-output-reuse-is-rejected', 'pass': False},
]
try:
    sys.argv = [str(runner_path), '1', '--run']
    runner.main()
except RuntimeError as error:
    checks[-1]['pass'] = 'immutable' in str(error)
finally:
    sys.argv = old_argv
for check in checks:
    check['pass'] = bool(check['pass'])
sha = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()
record = {'schema': 'MathScope.SmallCommonDiagnosticRunnerIntegration/1',
          'mathematicalSourceExecuted': False, 'mathematicalSourcesModified': False,
          'fixtureOnlyTiming': {'staleSeconds': runner.STALE_SECONDS, 'profileSeconds': runner.PROFILE_SECONDS},
          'productionTimingUnchanged': {'staleSeconds': 45, 'profileSeconds': 5, 'externalTimeoutSeconds': 1800},
          'checks': checks, 'pass': all(check['pass'] for check in checks),
          'observedTargetExitCode': process['exitCode'], 'processReceipt': {'path': str(process_path.relative_to(ROOT)), 'sha256': sha(process_path)},
          'runner': {'path': str(runner_path.relative_to(ROOT)), 'sha256': sha(runner_path)},
          'fixture': {'path': str(fixture.relative_to(ROOT)), 'sha256': sha(fixture)},
          'test': {'path': str(Path(__file__).relative_to(ROOT)), 'sha256': sha(__file__)},
          'elapsedSeconds': process['elapsedSeconds'], 'peakRSSBytes': process['peakRSSBytes']}
receipt = OUT / 'integration-validation.json'
with receipt.open('x') as stream:
    json.dump(record, stream, indent=2)
    stream.write('\n')
print(json.dumps({'pass': record['pass'], 'checks': len(checks), 'mathSourceExecuted': False,
                  'elapsedSeconds': record['elapsedSeconds'], 'receipt': str(receipt.relative_to(ROOT))}))
raise SystemExit(0 if record['pass'] else 1)
