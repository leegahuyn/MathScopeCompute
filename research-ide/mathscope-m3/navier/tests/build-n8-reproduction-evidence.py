#!/usr/bin/env python3
"""Package the actually observed N8 hosted execution and its public inputs.

This checks an immutable historical CI archive. The separate CI reproduction
command must execute against each new shipped build; packaging does not
pretend to execute that new build or grant imported mathematical authority.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re
import zipfile


REPO = Path(__file__).resolve().parents[4]
ROOT_PATH = Path('research-ide/mathscope-m3')
EVIDENCE = Path('navier/evidence/n8-reproduction-20261012')
ARCHIVE = EVIDENCE/'ci-a210590/observed-ci.zip'
OBSERVATION = EVIDENCE/'ci-a210590/github-observation.json'
SOURCE_MANIFEST = '4954c589e421e7a560c2625c9a8f5d30842c3ede31d80acdbd53df07a904f0f3'
ZIP_SHA256 = '9e6defc224572602d85262c682d274478b1088bdfb09332d1e6a05496dd4eab8'
HEAD = 'a2105903d23d25f4a8068bd846cb7d7ad6dc4bbe'
TREE = 'cdbce5f9a711b7ecdc6c08a06438e4ea8d0b4a7e'
CI_COMMIT = '231bda30c1cf1fb9cae1c3dcfcc8895da4a5e77f'
FIXTURES = {
    'N8-flow': ('flow-export.json', 'SELECTED_RUN', 2e-12, 2e-11),
    'N8-source-core-refinement': ('core-refinement-export.json', 'SOURCE_FIXTURE', 0, 0),
    'N8-source-near-terminal': ('near-terminal-run.json', 'SOURCE_FIXTURE', 0, 0),
}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def stable(value):
    # Source manifest rows contain only path/hash strings and integer bytes.
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def build(root=REPO, check=False):
    root = Path(root).resolve()
    m3 = root/ROOT_PATH
    checks = []

    def require(identity, condition):
        checks.append({'id': identity, 'pass': bool(condition)})
        if not condition:
            raise ValueError('N8 reproduction archive check failed: '+identity)

    def pin(path):
        path = Path(path)
        raw = (m3/path).read_bytes()
        return {'path': str(path), 'bytes': len(raw), 'sha256': sha(raw)}

    archive_pin = pin(ARCHIVE)
    require('actual-downloaded-CI-archive-bytes', archive_pin['sha256'] == ZIP_SHA256
            and archive_pin['bytes'] == 4936391)
    observation = json.loads((m3/OBSERVATION).read_bytes())
    job, artifact = observation['job'], observation['artifact']
    require('observed-successful-job-and-correct-revision',
            job['id'] == 114909653537 and job['run_id'] == 38278478150
            and job['head_sha'] == HEAD and job['status'] == 'completed'
            and job['conclusion'] == 'success' and observation['runnerCommit'] == CI_COMMIT
            and observation['runnerTree'] == TREE)
    require('observed-GitHub-artifact-identity', artifact['id'] == 11760526040
            and artifact['digest'] == 'sha256:'+ZIP_SHA256
            and artifact['workflow_run']['head_sha'] == HEAD
            and artifact['workflow_run']['id'] == 38278478150)
    step_names = ['Verify the shipped Worker and display contract build',
                  'Reject selected-run model substitution, altered values and incomplete replay metadata',
                  'Reproduce actual public N8 observations in fresh Node and shipped Worker processes']
    require('all-required-actual-CI-steps-completed-successfully', all(
        any(row['name'] == name and row['status'] == 'completed' and row['conclusion'] == 'success'
            for row in job['steps']) for name in step_names))
    runs = []
    with zipfile.ZipFile(m3/ARCHIVE) as archive:
        require('archive-CRC-and-unique-member-names', archive.testzip() is None
                and len(set(archive.namelist())) == len(archive.namelist()))
        get = lambda name: json.loads(archive.read(name))
        prefix = 'n8-selected-run-reproduction/'
        parent = get(prefix+'receipt.json')
        require('three-independent-processes-completed', parent['pass'] is True
                and parent['runStatus'] == 'PASS' and parent['actualSeparateProcesses'] is True
                and parent['fixtureIds'] == list(FIXTURES)
                and len(parent['runs']) == 3 and all(row['pass'] for row in parent['checks']))
        current_build = get('bundle-check.log')
        require('observed-shipped-build-was-checked-without-rebuilding',
                current_build['sourceManifestSHA256'] == SOURCE_MANIFEST
                and current_build['sourceFiles'] == 523 and current_build['checkOnly'] is True)
        sources = []
        for launch in parent['runs']:
            identity = launch['id']
            expected_file, role, atol, rtol = FIXTURES[identity]
            receipt_bytes = archive.read(prefix+launch['receiptPath'])
            require(identity+'-successful-child-receipt-bytes', launch['pass'] is True
                    and launch['exitCode'] == 0 and launch['stopReason'] is None
                    and sha(receipt_bytes) == launch['receiptSHA256'])
            child = json.loads(receipt_bytes)
            require(identity+'-all-source-Worker-and-replay-checks', child['pass'] is True
                    and all(row['pass'] for row in child['checks'])
                    and len(child['runs']) == 1 and child['requestedFixtureIds'] == [identity])
            row = child['runs'][0]
            before = get(prefix+identity+'/source-before.json')
            after = get(prefix+identity+'/source-after.json')
            require(identity+'-complete-source-manifest-before-and-after',
                    len(before['files']) == 523 and before['files'] == after['files']
                    and after['unchanged'] is True and sha(stable(before['files'])) == SOURCE_MANIFEST
                    and before['build'] == after['build']
                    and before['shippedWorkerBundle'] == after['shippedWorkerBundle'])
            for verifier in before['verifierSources']:
                raw = archive.read(prefix+identity+'/verifier-source-snapshot/'+verifier['path'])
                require(identity+'-frozen-verifier-'+verifier['path'],
                        len(raw) == verifier['bytes'] and sha(raw) == verifier['sha256'])
            sources.append(before)
            environment = child['environment']
            require(identity+'-actually-observed-independent-runtime',
                    environment['hostedCI'] is True and environment['githubRunId'] == '38278478150'
                    and environment['runnerCommit'] == CI_COMMIT and environment['runnerTree'] == TREE
                    and environment['pullRequestHead'] == HEAD and environment['node'] == 'v24.21.0'
                    and environment['platform'] == 'linux' and environment['architecture'] == 'x64')
            observed = row['observed']
            public_pin = pin(Path('evidence/all64-20261012/public-v99')/expected_file)
            require(identity+'-exact-public-observation', observed['file'] == expected_file
                    and observed['bytes'] == public_pin['bytes'] and observed['sha256'] == public_pin['sha256']
                    and observed['sourceManifest'] == SOURCE_MANIFEST and row['sameSource'] is True)
            if role == 'SELECTED_RUN':
                require(identity+'-actual-export-and-presentation-validated',
                        observed['format'] == 'EXPORTED_EXECUTION_RECORD'
                        and row['inspection']['valid'] is True and row['inspection']['presentationVerified'] is True)
            comparison = row['comparison']
            require(identity+'-every-mathematical-value-with-original-tolerance',
                    row['role'] == role and row['pass'] is True and comparison['pass'] is True
                    and comparison['absoluteTolerance'] == atol and comparison['relativeTolerance'] == rtol
                    and comparison['totalMismatches'] == 0 and comparison['numericValues'] > 0
                    and row['directNodeAndShippedWorkerExactMatch'] is True
                    and row['shippedWorkerReplay']['status'] == 'MATCH')
            fresh = row['current']['artifact']
            raw = archive.read(prefix+identity+'/'+fresh['path'])
            require(identity+'-complete-fresh-record-bytes', len(raw) == fresh['bytes'] and sha(raw) == fresh['sha256'])
            required = ['edition', 'source', 'constants', 'basis', 'domain', 'timeSchedule', 'quadrature',
                        'truncations', 'precision', 'tails', 'residual', 'energy', 'camera']
            require(identity+'-all-named-metadata-categories', all(name in row['categories'] for name in required))
            energy = row['categories']['energy']
            require(identity+'-no-cross-model-energy-substitution',
                    energy.get('originalPaperWholeSpaceEnergy') is False if role == 'SELECTED_RUN'
                    else energy['finitePeriodicEnergySubstituted'] is False)
            runs.append({'id': identity, 'role': role, 'publicObservation': public_pin,
                         'freshRecordInArchive': prefix+identity+'/'+fresh['path'],
                         'freshRecord': fresh, 'environment': environment, 'release': child['release'],
                         'categories': row['categories'], 'comparison': comparison,
                         'publicResultDigest': observed['resultDigest'],
                         'freshResultDigest': row['current']['resultDigest'],
                         'shippedWorkerReplay': row['shippedWorkerReplay'], 'pass': True})
        require('identical-shipped-build-and-verifier-snapshots-for-all-fixtures',
                all(snapshot == sources[0] for snapshot in sources))
        independent = get('n8-selected-run-independent-numpy.json')
        require('independent-NumPy-reference-actually-passed', independent['pass'] is True
                and independent['checkCount'] == 14 and all(row['pass'] for row in independent['checks'])
                and independent['environment']['python'] == '3.12.15'
                and independent['environment']['numpy'] == '2.3.5'
                and independent['originalPaperWholeSpaceEnergy'] is False
                and independent['continuumErrorEnclosureIssued'] is False)
        guard_log = archive.read('n8-reproduction-contract.tap').decode()
        require('six-model-and-metadata-mutation-guards-passed',
                re.search(r'^# tests 6$', guard_log, re.M) and re.search(r'^# pass 6$', guard_log, re.M)
                and re.search(r'^# fail 0$', guard_log, re.M))
    result = {'schema': 'MathScope.N8.ObservedReproductionManifest/1',
              'status': 'PASS', 'pass': True, 'criterion': 'N8-08',
              'assessmentRequired': True, 'wholeM3Complete': False,
              'scope': 'Observed reproduction of the executed finite periodic selected run and two original-source fixtures.',
              'observedSourceCommit': HEAD, 'observedRunnerCommit': CI_COMMIT,
              'observedRunnerTree': TREE, 'sourceManifestSHA256': SOURCE_MANIFEST,
              'archive': archive_pin, 'githubObservation': pin(OBSERVATION),
              'sourceFileCount': 523, 'nodeTests': {'passed': 6, 'failed': 0},
              'independentCheckCount': 14, 'fixtureCount': 3,
              'elapsedSeconds': sum(row['durationSeconds'] for row in parent['runs']),
              'comparedNumericValues': sum(row['comparison']['numericValues'] for row in runs),
              'runs': runs, 'independentReference': independent, 'checks': checks,
              'packager': pin(Path('navier/tests')/Path(__file__).name),
              'newRuntimeExecutionPerformedByPackager': False,
              'currentBuildReproductionRequiredInCI': True,
              'wholeLocalizedFieldOrEnergyProved': False, 'importedAuthorityAdopted': False}
    output = m3/EVIDENCE/'manifest.json'
    raw = (json.dumps(result, indent=2, ensure_ascii=False, allow_nan=False)+'\n').encode()
    if check:
        if not output.is_file() or output.read_bytes() != raw:
            raise ValueError('The observed N8 reproduction manifest is stale.')
    else:
        output.write_bytes(raw)
    return {'status': 'PASS', 'checks': len(checks), 'fixtureCount': 3,
            'comparedNumericValues': result['comparedNumericValues'], 'manifest': pin(EVIDENCE/'manifest.json'),
            'checkOnly': check, 'newRuntimeExecutionPerformed': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(check=args.check), indent=2))
