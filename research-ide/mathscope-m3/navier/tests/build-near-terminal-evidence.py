"""Package a successful observed source gate after verifying every source byte.

This reads the fixed repository attempt2, never a browser-supplied certificate.
The generated JavaScript contains the complete source scalar program and a
canonical content digest; consuming it is explicitly an archive operation.
"""
from fractions import Fraction
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[4]
BASE = Path('research-ide/mathscope-m3/navier')
ATTEMPT = BASE / 'evidence/source-near-terminal-20261012/attempt2'
RECEIPT = ATTEMPT / 'receipt.json'
TARGET = BASE / 'source-near-terminal-evidence-data.mjs'


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def verified_file(root, row):
    path = Path(row['path'])
    resolved = (root / path).resolve()
    if path.is_absolute() or '..' in path.parts or not str(path).startswith('research-ide/') or not resolved.is_relative_to(root.resolve()):
        raise ValueError('An archive source path escapes the repository')
    raw = resolved.read_bytes()
    if len(raw) != row['bytes'] or digest(raw) != row['sha256']:
        raise ValueError('Recorded source or artifact bytes changed: ' + str(path))
    return raw


def archive(root=ROOT):
    root = Path(root)
    raw = (root / RECEIPT).read_bytes()
    receipt = json.loads(raw)
    if not (receipt['schema'] == 'MathScope.N8.SourceNearTerminalObservedExecution/1'
            and receipt['attempt'] == 2 and receipt['pass'] is True and receipt['exitCode'] == 0
            and receipt['stoppedReason'] is None and receipt['sourceFilesUnchanged'] is True
            and receipt['nodeTests'] == {'passed': 10, 'failed': 0, 'skipped': 0}
            and receipt['independentStatus'] == 'PASS'
            and receipt['originalN804CriterionComplete'] is False
            and receipt['originalFinalN6FieldsConstructed'] is False
            and receipt['fullLocalizedForceConstructed'] is False
            and receipt['wholeN8ReconstructionComputed'] is False
            and receipt['newLeanExecuted'] is False and receipt['wholeM3Complete'] is False):
        raise ValueError('The observed near-terminal source gate or its scope is not passing')
    refs = {Path(row['path']).name: row for row in receipt['artifacts']}
    expected = {'node.log', 'source-bytes-before.json', 'source-bytes.json', 'independent-fraction.json', 'near-terminal.json'}
    if set(refs) != expected or len(receipt['artifacts']) != len(expected):
        raise ValueError('All five original gate artifacts are required exactly once')
    contents = {name: verified_file(root, row) for name, row in refs.items()}
    capture, before = json.loads(contents['source-bytes.json']), json.loads(contents['source-bytes-before.json'])
    rows = capture['before']
    if not (capture['unchanged'] is True and rows == capture['after'] == before['files']
            and len(rows) == before['fileCount'] == receipt['sourceFileCount']
            and len({row['path'] for row in rows}) == len(rows)):
        raise ValueError('The original complete before/after dependency capture does not match')
    for row in rows:
        verified_file(root, row)
    log = contents['node.log'].decode('utf-8')
    if len(re.findall(r'^ok \d+ - ', log, re.M)) != 10 or re.search(r'^not ok ', log, re.M):
        raise ValueError('The raw source log does not contain ten passing tests')
    independent = json.loads(contents['independent-fraction.json'])
    if not (independent['status'] == 'PASS' and len(independent['checks']) == receipt['independentCheckCount']
            and len(independent['checks']) >= 38 and all(row['pass'] is True for row in independent['checks'])):
        raise ValueError('The independent exact Fraction gate is incomplete')
    certificate = json.loads(contents['near-terminal.json'])
    if not (certificate['schema'] == 'MathScope.N8.ActualSourceNearTerminal/1'
            and certificate['verification']['checksPass'] is True
            and all(row['pass'] is True for row in certificate['checks'])):
        raise ValueError('The source certificate is not passing')
    scope = certificate['scope']
    for key in ['fullN6FinalFieldConstructed', 'fullLocalizedForceConstructed', 'wholeN8ReconstructionComputed',
                'originalN804CriterionComplete', 'newLeanKernelProof', 'wholeM3Complete', 'allSpaceSourceVelocityEvaluator']:
        if scope[key] is not False:
            raise ValueError('The observed certificate scope was enlarged: ' + key)
    bridge = certificate['claims']['finalLocalizedVelocity']
    if bridge['status'] != 'EXTERNAL_SOURCE_THEOREM_IDENTIFICATION_REQUIRED' or len(bridge['dependencies']) != 2:
        raise ValueError('The two external final-field identifications must remain explicit')
    for name in ['Proposition9.9', 'Proposition10.1']:
        if not any(name in dependency for dependency in bridge['dependencies']):
            raise ValueError('Missing original final-field dependency: ' + name)
    if [row['depth'] for row in certificate['rows']] != [0, 2, 4, 8, 12]:
        raise ValueError('Every recorded positive-source observation must remain')
    for row in certificate['rows']:
        error = Fraction(1, 1 << (row['depth'] + 2))
        if not (row['tau']['exactSign'] == 'POSITIVE' and row['tau']['binary64'] is None
                and row['samePointAndTimeForAllComponents'] is True and row['unitLocalizationPlateau'] is True
                and row['underflowReplacedByZero'] is False and len(row['components']) == 3):
            raise ValueError('The single exact positive source time or scope changed')
        for component in row['components']:
            leading, interval = component['leadingInterval'], component['interval']
            lower, upper = Fraction(leading['lower']), Fraction(leading['upper'])
            if not (Fraction(interval['lower']) == lower - error and Fraction(interval['upper']) == upper + error
                    and Fraction(interval['remainderAbsUpper']) == error and interval['midpointUsed'] is False
                    and component['physicalVelocity']['binary64'] is None and component['sourceLimitIdentificationExternal'] is True):
                raise ValueError('The full interval or physical scaling changed')
    program = certificate['formulaProgram']
    if not (len(program['nodes']) == certificate['graph']['scalarNodeCount']
            and program['allSelectedObservationRootsHaveNoFreeCoordinates'] is True
            and program['primaryTimeVariable'] == 's=-log(tau)' and program['underflowReplacedByZero'] is False):
        raise ValueError('The complete exact source scalar program is required')
    return {'schema': 'MathScope.N8.SourceNearTerminalArchive/1',
            'receipt': {'path': str(RECEIPT), 'sha256': digest(raw), 'bytes': len(raw)},
            'gate': {**{key: receipt[key] for key in ['command', 'exitCode', 'elapsedSeconds', 'nodeTests', 'startedAt', 'finishedAt',
                       'nodeResourceUsagePeakRSSBytes', 'sourceFileCount', 'independentCheckCount']},
                     'workingDirectory': 'repository root', 'freshlyExecutedByArchiveConsumer': False},
            'artifact': refs['near-terminal.json'], 'artifacts': receipt['artifacts'],
            'sourceDependencyCapture': {**refs['source-bytes.json'], 'fileCount': len(rows)},
            'sourceValidation': {'mode': 'BUILD_TIME_BYTE_VERIFICATION', 'allCapturedSourceFilesMatch': True,
                                 'allRecordedArtifactBytesMatch': True, 'browserHasReexecutedConstructor': False},
            'certificate': certificate, 'independentVerification': independent,
            'historicalExecutionAssessment': {key: receipt[key] for key in ['originalN804CriterionComplete',
                 'originalFinalN6FieldsConstructed', 'fullLocalizedForceConstructed', 'wholeN8ReconstructionComputed',
                 'newLeanExecuted', 'wholeM3Complete']}}


def source_paths(root=ROOT):
    value = archive(root)
    capture = json.loads((Path(root) / value['sourceDependencyCapture']['path']).read_bytes())
    return [Path(root) / RECEIPT] + [Path(root) / row['path'] for row in value['artifacts'] + capture['before']]


def javascript_digest(value):
    code = """import {createHash} from 'node:crypto';let text='';for await(const c of process.stdin)text+=c;
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
process.stdout.write(createHash('sha256').update(canonical(JSON.parse(text))).digest('hex'));"""
    return subprocess.check_output(['node', '--input-type=module', '-e', code], input=json.dumps(value, ensure_ascii=False), text=True).strip()


def build(root=ROOT, check=False):
    value = archive(root)
    sha256 = javascript_digest(value)
    data = json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
    output = ('// Generated from the observed original three-component source gate; do not edit.\n'
              'export const SOURCE_NEAR_TERMINAL_ARCHIVE_SHA256 = ' + json.dumps(sha256) + ';\n'
              'export const SOURCE_NEAR_TERMINAL_ARCHIVE = ' + data + ';\n')
    target = Path(root) / TARGET
    if check:
        if not target.exists() or target.read_text(encoding='utf-8') != output:
            raise ValueError('Stale generated near-terminal source archive')
    else:
        target.write_text(output, encoding='utf-8', newline='\n')
    return {'schema': 'MathScope.N8.SourceNearTerminalArchiveBuild/1', 'archiveSHA256': sha256,
            'generatedBytes': len(output.encode()), 'sourceFiles': value['gate']['sourceFileCount'],
            'exactRows': len(value['certificate']['rows']), 'componentsPerRow': 3,
            'scalarNodes': len(value['certificate']['formulaProgram']['nodes']), 'recordedOnly': True,
            'freshSourceConstructorExecuted': False, 'checkOnly': check}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(check=args.check)))
