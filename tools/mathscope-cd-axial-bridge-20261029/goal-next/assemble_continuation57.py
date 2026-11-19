"""Verify the leading support and general axial source coefficient packet."""

import re

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation56 import PARENTS as EARLIER

PARENT = 'ea0ee4dd88f6bff42d4114433e46d82d48a1682a'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation56_Delta_20261120.zip':
           '0a332f876c5c7ece7d9d680553ffba6d81cc61881ebf117bd04722803d46b87b'}
LEADING = 'axial-order-one-identity/leading-axial-support/'
GENERAL = 'axial-order-one-identity/higher-recursive-identities/'
CI = 'ci-44564079637/'
EXTRA = {
    '.github/workflows/mathscope-cd-axial-bridge-20261029.yml':
        '0ae7da6b285c287f058a1c34b01d889d4dcb1708e5c204d02f907f0fc5a825b9',
    'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/AxialHigherOrderTransport.lean':
        '1a4e7e53e459a2f0e49e81801993ce15760a81b90bcab84d84fb9e7885f08e86',
}
PINS = {
    LEADING + 'LEADING_AXIAL_SUPPORT.md': 'ac76353ab60c75487d374a3a03678442007d8f55036cd5520a9208a9aa24a683',
    LEADING + 'check_leading_axial_support.mjs': '46a6288d7651f7239ecd56dd91f416f2026042dc2c94ad18e774a4a1a4f18e9a',
    LEADING + 'leading-axial-support.json': '5c0fda42461aca2e77cd2987100a0e7a38dced94ec3be8883ae639df765f06cd',
    GENERAL + 'README.md': 'dd9f946aac79d9b68bfb8be9ea73adfe51aac311c0577b97bd429585e406384a',
    GENERAL + 'source-axial-orders.json': 'f10ab6d291d2cbd85c3ec486ed96a437e91376528d6d44406e8368ef2703814d',
    GENERAL + 'actual-axial-identity.json': '5471549a783c68e0ed110bf923145ee7c81efbc2606b61dbd1d4ff874929767d',
    GENERAL + 'export_actual_axial.mjs': 'ae62f72bc5e6afd2ccef78beba09b2b4d68c522bca59c9a84fb20cc98937bc19',
    GENERAL + 'check_actual_axial.py': 'cfb57cd5b34037b75e81b844f8edbf43c94d45f1d7e41bbc832f85524e9bb866',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    leading = source(LEADING + 'leading-axial-support.json')
    for path, pin in leading['sourcePins'].items():
        assert entry(raw(LEADING + 'archives/' + path))['sha256'] == pin, path
    assert {key: leading['actualRoots'][key] for key in ('U', 'M', 'v', 'Xv')} == {
        'U': 9236, 'M': 9239, 'v': 18778, 'Xv': 3293}
    assert leading['currentUniformBound']['ledgerRows'] == 203
    assert leading['Xv']['leftCollarLogWidth'] == '17/20' and leading['Xv']['rightGuardRoots'] == [0, 0, 0]
    assert leading['Ipos']['omegaOverX'] == '-mConst^2/(2 X^2)' and leading['Ipos']['omegaNonzeroControl']

    higher = source(GENERAL + 'actual-axial-identity.json')
    assert higher['sliceSHA256'] == PINS[GENERAL + 'source-axial-orders.json']
    assert higher['sourceTerms'] == 52 and [row['order'] for row in higher['rows']] == [2, 3, 4, 5]
    assert len(higher['genericFreeJetIdentityChecks']) == higher['genericEtaDifferentiatedIdentities'] == 6
    assert len(higher['genericStreamAndLocalPicardChecks']) == 3
    for row in higher['rows']:
        n = row['order']
        assert row['orderedPairs'] == [[i, n - i] for i in range(n + 1)]
        assert row['checkedRawAndEtaIdentities'] == row['rejectedWrongTermOrIdentity'] == 4
        assert row['boundaryTerms'] == 7 and row['wrongExponentSlotInvisibleInSummedTransport']
    margins = higher['actualIposMargins']
    assert margins['normalizedAxialDeterminantLower'] == '1/32'
    assert margins['normalizedAngularDeterminantAbsoluteLower'] == '1/131072'

    run = source(CI + 'run.json')
    assert run['headSha'] == 'e3ca865569cf119ba3c70545968a862960ed5d75'
    assert run['status'] == 'completed' and run['conclusion'] == 'success'
    assert run['url'].endswith('/actions/runs/44564079637')
    lean_path = 'MathScope/M3/CD/AxialHigherOrderTransport.lean'
    assert f'{EXTRA["research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/AxialHigherOrderTransport.lean"]}  {lean_path}' in raw(CI + 'source-sha256.txt').decode()
    log = raw(CI + 'AxialHigherOrderTransport.log').decode()
    axioms = re.findall(r'depends on axioms: \[([^\]]+)\]', log)
    assert len(axioms) == 5 and 'warning:' not in log and 'error:' not in log
    assert all(set(row.replace(' ', '').replace('\n', '').split(',')) ==
               {'propext', 'Classical.choice', 'Quot.sound'} for row in axioms)
    return {'sourceOrders': [2, 3, 4, 5], 'actualSourceTerms': 52, 'exactGenericEtaIdentities': 6,
            'leadingMixedDerivativeLedgerRows': 203, 'sourceIposLowerMargins': ['1/32', '1/131072'],
            'githubLeanRun': 44564079637, 'leanTheorems': 5}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation57', date='20261120',
                   verify=verify_evidence, additional_pins=EXTRA)
