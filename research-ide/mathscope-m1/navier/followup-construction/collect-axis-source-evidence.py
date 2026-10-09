"""Package completed source-axis test logs without claiming a new test run.

Run the commands listed in the resulting JSON before using this collector.
The frozen rational module and its historical Lean receipts are never rewritten.
"""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent
tap_path = ROOT / 'axis-source-tests.tap'
tap = tap_path.read_text()
counts = {key: int(re.search(r'^# '+key+r' (\d+)$', tap, re.M).group(1))
          for key in ['tests', 'pass', 'fail', 'cancelled', 'skipped']}
assert counts['tests'] == counts['pass'] == 34
assert counts['fail'] == counts['cancelled'] == counts['skipped'] == 0
checks = [{'name': name, 'pass': True} for name in re.findall(r'^ok \d+ - (.+)$', tap, re.M)]
assert len(checks) == counts['tests']
independent = json.loads((ROOT/'axis-source-independent-validation.json').read_text())
assert independent['status'] == 'PASS'
assert independent['passed'] == independent['total']
assert independent['negativePassed'] == independent['negativeTotal']
derivation = json.loads((ROOT/'axis-source-derivation.json').read_text())
digest = lambda p: sha256(p.read_bytes()).hexdigest()
assert digest(ROOT/'axis-source-certificate.mjs') == derivation['derivedSha256']
assert digest(ROOT/'axis-certificates.mjs') == derivation['baseSha256']
for source in independent['sourceFiles']:
    assert digest(ROOT/source['path']) == source['sha256'], source['path']
assert digest(ROOT/'axis-source-default-certificate.json') == independent['certificate']['sha256']

data = {
    'schema': 'MathScope.SourceAxisValidationLedger/1',
    'checkedAt': datetime.now(timezone.utc).isoformat(),
    'status': 'PASS',
    'module': 'ns.axis-source-certificate',
    'finiteJsTests': {'pass': counts['pass'], 'total': counts['tests'],
                      'log': tap_path.name, 'logSha256': digest(tap_path), 'checks': checks},
    'independentExactChecks': {'pass': independent['passed'], 'total': independent['total'],
                              'negativePass': independent['negativePassed'], 'negativeTotal': independent['negativeTotal'],
                              'artifact': 'axis-source-independent-validation.json',
                              'sha256': digest(ROOT/'axis-source-independent-validation.json')},
    'derivation': derivation,
    'certificate': independent['certificate'],
    'validationScope': [
        'Actual public-API default and 256-bit source-pressure certificates, exact h binding, input refusals, source scope, budget and cancellation.',
        'Seven pinned byte-identical algorithm spans plus the unchanged selection/positivity/sampling arithmetic in the driver.',
        'Python Fraction and Bernstein checks of exponential enclosures, positive-mixture pressure intervals, whole-eta cutoff cells, complex scalar bounds, Banach inequalities and independently summed tails.',
        'Four in-memory negative controls: false global upgrade, forged mass, changed exact h and a falsely zero infinite tail.'
    ],
    'notCertified': [
        'Equality with the numerically repaired outer field or its exact five-moment identities.',
        'Identity and rounding-error binding of the existing finite eta jets to the infinite fixed-point coefficients.',
        'A generated Lean proof of the complete analytic premise bundle or a complete global Navier-Stokes witness.'
    ],
    'lean': {'newKernelTargets': 0, 'rationalDefaultScalarReceiptTransferred': False,
             'meaning': 'The 16 original-reference and 4 rational-default scalar audits retain their original separate scope.'},
    'commandsAlreadyExecuted': [
        {'command': 'node --test --test-reporter=tap navier/followup-construction/axis-source-certificate.test.mjs > navier/followup-construction/axis-source-tests.tap', 'observedExitCode': 0},
        {'command': 'python3 navier/followup-construction/verify-axis-source-independent.py --generate', 'observedExitCode': 0},
        {'command': 'python3 navier/followup-construction/verify-axis-source-independent.py', 'observedExitCode': 0}
    ],
    'workingDirectory': str(ROOT.parent.parent),
    'environment': {'node': subprocess.check_output(['node', '--version'], text=True).strip(),
                    'python': subprocess.check_output(['python3', '--version'], text=True).strip()},
    'preflight': {'log': 'axis-source-tests.preflight.tap',
                  'countedInFinalResult': False,
                  'note': 'The initial test incorrectly required different nearby exact h inputs to select different integer Lambda majorants. The assertion was corrected: the exact parameter tuple must differ, while conservatively rounded integer majorants may coincide. No consumer defect was involved.'}
}
ledger_path = ROOT/'axis-source-test-results.json'
ledger_path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
owned = ['axis-source-certificate.test.mjs', 'axis-source-tests.tap', 'axis-source-tests.preflight.tap',
         'verify-axis-source-independent.py', 'collect-axis-source-evidence.py',
         'axis-source-default-certificate.json', 'axis-source-independent-validation.json', 'axis-source-test-results.json']
manifest = {
    'schema': 'MathScope.SourceAxisValidationFiles/1',
    'scope': 'Additional tests and evidence only; no frozen source or historical receipt was changed.',
    'files': [{'path': name, 'bytes': (ROOT/name).stat().st_size, 'sha256': digest(ROOT/name)} for name in owned],
    'dependencyPins': independent['sourceFiles']
}
(ROOT/'axis-source-validation-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps({'js': [counts['pass'], counts['tests']],
                  'independent': [independent['passed'], independent['total']],
                  'negative': [independent['negativePassed'], independent['negativeTotal']],
                  'moduleSha256': derivation['derivedSha256'],
                  'ledger': str(ledger_path), 'ledgerSha256': digest(ledger_path)}))
