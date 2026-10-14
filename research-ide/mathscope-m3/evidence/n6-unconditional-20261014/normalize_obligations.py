"""Scope-clarify a byte-verified raw cloud matrix without granting any proof.

The immutable raw cloud output and ZIP remain untouched. This derived matrix
uses the already-authenticated actual Picard registry and preserves every
request, guard, open status, source binding and original acceptance criterion.
"""
import copy
import hashlib
import json
from pathlib import Path
import zipfile

HERE = Path(__file__).resolve().parent
ARCHIVE = HERE / 'cloud-38508339662/n6-independent-acceptance-38508339662.zip'
PIN = '468795cf810701728104278b76d28d7f0e1544cc43789ae845fec4edba8ccf8c'
CODE = '297e0ca51780e12670b18e1faf3b13d5d4e6fdb1'

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def main():
    if sha(ARCHIVE.read_bytes()) != PIN:
        raise ValueError('Changed original successful cloud archive')
    with zipfile.ZipFile(ARCHIVE) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)) or sum(row.file_size for row in archive.infolist()) > 20 * 1024 * 1024:
            raise ValueError('Ambiguous or oversized original receipt archive')
        receipt = json.loads(archive.read('receipt.json'))
        if receipt['sourceCommit'] != CODE or receipt['executionStatus'] != 'SUCCESS':
            raise ValueError('Wrong cloud execution source')
        if set(names) != {row['path'] for row in receipt['members']} | {'receipt.json'}:
            raise ValueError('Incomplete original cloud receipt')
        for row in receipt['members']:
            data = archive.read(row['path'])
            if len(data) != row['bytes'] or sha(data) != row['sha256']:
                raise ValueError('Changed raw cloud receipt member')
        raw = archive.read('obligation-matrix.json')
    if raw != (HERE / 'obligation-matrix.json').read_bytes():
        raise ValueError('Raw cloud matrix copy was changed')
    original = json.loads(raw)
    result = copy.deepcopy(original)
    system = original['newSourceBoundCalculations']['analytic'][0]['data']['source']['system']
    if system['name'] != 'ActualSameN3OrderOneInner' or system['xi'] != 25516 or system['eta'] != 2:
        raise ValueError('Different actual inner Picard source')
    roots = sorted({system['xi'], system['eta'], *sum(system['A0'], []),
                    *sum(system['A1'], []), *system['forcing'],
                    system['tail']['sourceBound'], system['tail']['sourceStrip'], system['tail']['loss']})
    corrections = []
    for row in result['requirements']:
        if row['id'] == 'B-common-holomorphic-eta-strip':
            corrections.append({'id': row['id'], 'oldSourceRoots': row['sourceRoots'], 'oldQuantifier': row['quantifier']})
            row['sourceRoots'] = roots
            row['sourceRegistry'] = 'picard[0]:ActualSameN3OrderOneInner'
            row['scope'] = 'actual original inner-Picard radial collar and its common eta neighborhood'
            row['quantifier'] = 'Every actual inner-Picard coefficient/forcing call on its original common inner collar; exterior heat requires real C-infinity only'
            row['minimalUnprovedLemma'] = 'Actual source A0/A1/forcing/natural/background holomorphic norm enclosures on the original common inner collar; preserve the real exterior heat domain and do not require a holomorphic eta extension of the heat ingredient at eta endpoints.'
            row['relatedSeparateSourcePrerequisites'] = [4483, 5029]
            row['exteriorHeatHolomorphyRequired'] = False
        elif row['id'] in ['9.9-total-wave', '9.9-curl-remainder']:
            row['sourceRootRole'] = 'complete velocity inspection anchors; these roots are not the isolated grouped wave/curl remainder'
            row['actualNormTargetBindingStillRequired'] = 'Bind w and w-w0_tan separately from the base and mean terms, using actual grouped full-curl source coefficients; total velocity roots alone do not certify W membership.'
    if len(corrections) != 1 or any(row['status'] != 'OPEN' or row['wholeSourceCertificateIndependentlyVerified'] is not False for row in result['requirements']):
        raise ValueError('Scope clarification changed a mathematical verdict')
    if result['verdict'] != original['verdict'] or len(result['originalIndependentCartesianRequests']) != 393 or len(result['originalIndependentCartesianDomainGuards']) != 94:
        raise ValueError('A proof, request or domain guard was silently changed')
    result['schema'] = 'MathScope.N6Unconditional.ScopeClarifiedObligationMatrix/1'
    result['scopeClarificationProvenance'] = {
        'kind': 'DERIVED_COPY_OF_VERIFIED_RAW_CLOUD_OUTPUT', 'rawCloudMatrix': 'obligation-matrix.json',
        'rawCloudMatrixSHA256': sha(raw), 'rawCloudArchiveSHA256': PIN, 'rawCloudCodeCommit': CODE,
        'generator': 'normalize_obligations.py', 'generatorSHA256': sha(Path(__file__).read_bytes()),
        'corrections': corrections, 'newMathematicalProofGranted': False,
        'rawCloudArtifactModified': False, 'allRequestsGuardsAndVerdictsPreserved': True}
    out = HERE / 'OBLIGATION_MATRIX_SCOPED.json'
    out.write_bytes((json.dumps(result, ensure_ascii=False, indent=2) + '\n').encode())
    print(json.dumps({'scopeClarifiedMatrix': out.name, 'rawCloudSHA256': sha(raw), 'actualInnerPicardSourceRoots': roots,
                      'N601': result['verdict']['N6-01'], 'N602': result['verdict']['N6-02'], 'newProofGranted': False}))

if __name__ == '__main__':
    main()
