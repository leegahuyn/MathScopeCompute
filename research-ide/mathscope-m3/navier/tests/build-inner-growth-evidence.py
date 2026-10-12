"""Package the observed N7 inner restriction without rerunning its constructor.

The immutable successful receipt is a trust anchor, not an input supplied by
the browser. Every original artifact and all 97 captured source files must
still match. The generated module retains the complete scalar formula DAG.
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
ATTEMPT = BASE / 'evidence/inner-growth-20261012/attempt2'
RECEIPT = ATTEMPT / 'receipt.json'
TARGET = BASE / 'source-inner-growth-evidence-data.mjs'
RECEIPT_SHA256 = '019bd3babe83d6af74dccd28bde6eb734393a454a7af60f114778f20c556ff28'


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def verified_file(root, row):
    path = Path(row['path'])
    if path.is_absolute() or '..' in path.parts or not str(path).startswith('research-ide/'):
        raise ValueError('An archive path is outside the source repository')
    resolved = (root / path).resolve()
    if not resolved.is_relative_to(root.resolve()):
        raise ValueError('An archive path escapes the source repository')
    raw = resolved.read_bytes()
    if len(raw) != row['bytes'] or digest(raw) != row['sha256']:
        raise ValueError('Recorded source or artifact bytes changed: ' + str(path))
    return raw


def archive(root=ROOT):
    root = Path(root)
    raw = (root / RECEIPT).read_bytes()
    if digest(raw) != RECEIPT_SHA256:
        raise ValueError('The immutable observed N7 receipt changed')
    receipt = json.loads(raw)
    if not (receipt['schema'] == 'MathScope.N7.InnerGrowthObservedExecution/1'
            and receipt['pass'] is True and receipt['exitCode'] == 0
            and receipt['timeout'] is False and receipt['sourceFilesUnchanged'] is True
            and receipt['nodeTests'] == {'passed': 8, 'failed': 0}
            and receipt['sourceFileCount'] == 97 and receipt['independentStatus'] == 'PASS'
            and receipt['newLeanExecuted'] is False
            and receipt['originalFinalN6FieldConstructed'] is False
            and receipt['wholeM3Complete'] is False):
        raise ValueError('The original source gate or its scope is not passing')
    refs = {Path(r['path']).name: r for r in receipt['artifacts']}
    if set(refs) != {'node.log', 'source-bytes.json', 'independent-fraction.json', 'inner-growth.json'}:
        raise ValueError('Expected all four original source gate artifacts')
    contents = {name: verified_file(root, row) for name, row in refs.items()}
    capture = json.loads(contents['source-bytes.json'])
    if capture['schema'] != 'MathScope.N7.InnerGrowthSourceBytes/1' or capture['fileCount'] != 97 or len(capture['files']) != 97:
        raise ValueError('The complete original source capture is required')
    if len({r['path'] for r in capture['files']}) != 97:
        raise ValueError('Repeated source paths cannot replace a missing dependency')
    for row in capture['files']:
        verified_file(root, row)
    log = contents['node.log'].decode('utf-8')
    if len(re.findall(r'^ok \d+ - ', log, re.M)) != 8 or re.search(r'^not ok ', log, re.M):
        raise ValueError('The raw constructor log is not eight passing tests')
    independent = json.loads(contents['independent-fraction.json'])
    if independent['status'] != 'PASS' or len(independent['checks']) != 9 or any(c['pass'] is not True for c in independent['checks']):
        raise ValueError('The independent exact Fraction gate is incomplete')
    certificate = json.loads(contents['inner-growth.json'])
    if certificate['schema'] != 'MathScope.N7.ActualInnerGrowth/1' or any(c['pass'] is not True for c in certificate['checks']):
        raise ValueError('The source certificate is not passing')
    if certificate['scope']['originalCompleteN6FieldConstructed'] is not False or certificate['scope']['newLeanKernelProof'] is not False:
        raise ValueError('The observed certificate scope was enlarged')
    bridge = certificate['claims']['originalLocalizedPath']
    if bridge['status'] != 'CONDITIONAL_ON_EXTERNAL_SOURCE_THEOREM_IDENTIFICATION' or len(bridge['dependencies']) != 2:
        raise ValueError('The two external final-field identifications must remain explicit')
    if not any('Proposition9.9' in d for d in bridge['dependencies']) or not any('Proposition10.1' in d for d in bridge['dependencies']):
        raise ValueError('The original support and localization dependencies are missing')
    phi = certificate['leading']['freshCore']['phi']['rows'][0]['actualNonlinearInterval']
    lo, hi = Fraction(phi['lower']), Fraction(phi['upper'])
    if not Fraction(1, 2) < lo < hi:
        raise ValueError('The strict positive source leading interval was lost')
    rows = certificate['rows']
    if [row['depth'] for row in rows] != [0, 2, 4, 8, 12]:
        raise ValueError('All five recorded exact depths must be preserved in order')
    for row in rows:
        radius = Fraction(1, 1 << (row['depth'] + 2))
        lower, upper = Fraction(row['interval']['lower']), Fraction(row['interval']['upper'])
        if Fraction(row['remainderAbsUpper']) != radius or lower != lo - radius or upper != hi + radius:
            raise ValueError('The full exact source remainder changed')
        if Fraction.from_float(row['displayEnclosure'][0]) > lower or Fraction.from_float(row['displayEnclosure'][1]) < upper:
            raise ValueError('A display bound is not an outward enclosure')
        if row['physicalVelocity']['binary64'] is not None or row['finiteSumMidpointUsed'] is not False or row['externalSourceTheoremBridgeRequired'] is not True:
            raise ValueError('A symbolic source path was replaced with a numerical sample')
    program = certificate['formulaProgram']
    if len(program['nodes']) != certificate['graph']['scalarNodeCount'] or not program['valuesAreExactExpressions'] or program['underflowReplacedByZero']:
        raise ValueError('The complete exact scalar program must be preserved')
    return {
        'schema': 'MathScope.N7.InnerGrowthArchive/1',
        'receipt': {'path': str(RECEIPT), 'sha256': RECEIPT_SHA256, 'bytes': len(raw)},
        'gate': {**{key: receipt[key] for key in ['command', 'exitCode', 'elapsedSeconds', 'observedPeakRSSBytes', 'nodeTests', 'startedAt', 'finishedAt']},
                 'workingDirectory': 'repository root',
                 'environment': {'M3_N7_INNER_EVIDENCE': refs['inner-growth.json']['path']},
                 'independentFractionChecks': 9, 'freshlyExecutedByArchiveConsumer': False},
        'artifact': refs['inner-growth.json'],
        'sourceDependencyCapture': {**refs['source-bytes.json'], 'fileCount': 97},
        'artifacts': receipt['artifacts'],
        'sourceValidation': {'mode': 'BUILD_TIME_BYTE_VERIFICATION', 'allCapturedSourceFilesMatch': True,
                             'allRecordedArtifactBytesMatch': True, 'browserHasReexecutedConstructor': False,
                             'replayMeaning': 'Validate this immutable archive and its current source, input and result hashes. The original common-family/core constructor is not rerun.'},
        'certificate': certificate,
        'independentVerification': independent,
        'historicalExecutionAssessment': {key: receipt[key] for key in ['originalN7CriterionComplete', 'originalFinalN6FieldConstructed', 'newLeanExecuted', 'wholeM3Complete']},
    }


def source_paths(root=ROOT):
    """Verified archive inputs for the outer browser source manifest."""
    value = archive(root)
    capture = json.loads((Path(root) / value['sourceDependencyCapture']['path']).read_bytes())
    return [Path(root) / RECEIPT] + [Path(root) / row['path'] for row in value['artifacts'] + capture['files']]


def javascript_digest(value):
    # Match WebCrypto's exact JSON canonicalization, including IEEE754 numbers.
    code = """import {createHash} from 'node:crypto';let s='';for await(const c of process.stdin)s+=c;
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
process.stdout.write(createHash('sha256').update(canonical(JSON.parse(s))).digest('hex'));"""
    return subprocess.check_output(['node', '--input-type=module', '-e', code], input=json.dumps(value, ensure_ascii=False), text=True).strip()


def build(root=ROOT, check=False):
    value = archive(root)
    sha256 = javascript_digest(value)
    data = json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
    output = ('// Generated from the immutable observed N7 source gate; do not edit.\n'
              'export const INNER_GROWTH_ARCHIVE_SHA256 = ' + json.dumps(sha256) + ';\n'
              'export const INNER_GROWTH_ARCHIVE = ' + data + ';\n')
    target = Path(root) / TARGET
    if check:
        if not target.exists() or target.read_text(encoding='utf-8') != output:
            raise ValueError('Stale generated inner growth archive')
    else:
        target.write_text(output, encoding='utf-8', newline='\n')
    return {'schema': 'MathScope.N7.InnerGrowthArchiveBuild/1', 'archiveSHA256': sha256,
            'generatedBytes': len(output.encode()), 'sourceFiles': 97, 'exactRows': 5,
            'scalarNodes': len(value['certificate']['formulaProgram']['nodes']),
            'recordedOnly': True, 'freshSourceConstructorExecuted': False, 'checkOnly': check}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(check=args.check)))
