"""Package the actual same-family residual comparison and order-one moment denotation."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation51 import PARENTS as EARLIER, BINDING


PARENT = '424cf060ab156d08a40fe4d92845e868afe2c929'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation51_Delta_20261120.zip':
           'fef6dfe9bcf89ecc67a9456ac27d5ed5404a94081cc06934857a630064b0c6b7'}
HOSTED = BINDING + 'hosted-44541601028/'
AXIAL = 'axial-order-one-identity/'
PINS = {
    HOSTED + 'direct-split-arithmetic-closure.json': '51057fc92e13cd7fc9a875e71c2926c6769cc3536ee1a13f2bea7ddd630cd94a',
    HOSTED + 'direct-split-arithmetic-manifest.json': '2952e2ba02c3973e9221e58fb8a3d63e2f56e73f8e6833bc513b3db29d3f9b4c',
    HOSTED + 'independent-direct-split.json': 'bc91034dffc735ef809dc9c4efd21e6ae6efa21c4af48ae0a027d2ba31110455',
    HOSTED + 'first-cycle.json': '37e8670816ddd5a209cd79670200b75808e504a35c9d9a76d872d2d2de371776',
    HOSTED + 'native-run.log': '5607eca6e1490ba9d22251d3f75bb395e375a9be07aaa7d094b4c21930558c0c',
    AXIAL + 'official-manuscript.json': '6814b8cfb43b4759a3dc54df4b071799196cb0032915a4269a4f09910628baf5',
    AXIAL + 'whole-moments/whole-moments.json': '3d4be5e7b50d1f1310ee2588f59cf055be87ddfaff60f75ca4cbf98c9371d4cb',
    AXIAL + 'whole-moments/check_order_one_whole_moments.mjs':
        'd0ab0fc1e94db9e618319c5af196f73e5eac7276e386771c7434aa68b65516d6',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(path))['sha256'] == pin, path
    run = source(HOSTED + 'hosted-run.json')
    assert run['workflowRun'] == 44541601028 and run['conclusion'] == 'success'
    assert run['sourceCommit'] == 'f6e726d08d2bf532c58f5dce7103a57ca45182a8'
    assert run['matchesHostedReadback']
    exact = source(HOSTED + 'independent-direct-split.json')
    assert run['localIndependentReadbackSHA256'] == PINS[HOSTED + 'independent-direct-split.json']
    assert exact['status'] == 'VERIFIED_ACTUAL_DIRECT_SPLIT_RATIONAL_IDENTITIES'
    assert exact['zeroPolynomials'] == 4 and exact['directResidualMonomials'] == [953, 1053, 3134]
    assert exact['roots']['conservativeDifferences'] == [22153774, 22153776, 22153778]
    assert exact['roots']['divergenceDifference'] == 22153781
    assert len(exact['denominatorValuesRequiringSourceDomain']) == 10
    assert not exact['actualConservativeResidualProvedZero'] and exact['quantitativeClosure'] == 'OPEN'
    manifest = source(HOSTED + 'direct-split-arithmetic-manifest.json')
    assert manifest['closureSHA256'] == exact['closureSHA256'] == PINS[HOSTED + 'direct-split-arithmetic-closure.json']
    assert manifest['currentReceipt'] == source(HOSTED + 'first-cycle.json')
    assert manifest['originalPrivatePDESealRevalidated']
    assert (manifest['sourceGraphNodes'], manifest['records'], manifest['opaqueRecords']) == (22153782, 1663, 316)

    paper = source(AXIAL + 'official-manuscript.json')
    assert paper['matchesPreviouslyUsedArchive'] and paper['pages'] == 166
    assert paper['sha256'] == '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
    assert paper['step4EquationPage'] == 53 and paper['forwardBackwardRepresentationPage'] == 54
    moments = source(AXIAL + 'whole-moments/whole-moments.json')
    assert moments['status'] == 'CONDITIONAL_ORDER_ONE_PHYSICAL_MOMENTS_BOUND_TO_ORIGINAL_SOURCE'
    assert entry(raw(AXIAL + 'collars/axial-collars-verified.json'))['sha256'] == moments['collarSHA256']
    assert len(moments['localRows']) == len(moments['whole']['physicalMoments']) == 5
    assert len(moments['omega']['rows']) == 10
    assert len(moments['patch']['matrixEntries']) == 13
    assert len(moments['patch']['pullbacks']) == 5
    assert all(row['pass'] for row in moments['whole']['densitySplits'])
    assert moments['whole']['wholeStress'] == 117075
    prior = moments['priorLeadingMass']
    assert [prior[key] for key in ('M', 'U', 'axis', 'exterior')] == [9239, 9236, 0, 0]
    assert not moments['scope']['allN'] and moments['scope']['ordinaryNativeIntegralAndLimitSemanticsRetained']
    return {'sourceGraphNodes': 22153782, 'arithmeticRecords': 1663, 'exactResidualDifferences': 4,
            'wholeMomentRows': 5, 'omegaHistoryIntegrals': 10, 'bumpMatrixLiterals': 13,
            'officialManuscriptByteIdentical': True}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation52', date='20261120',
                   verify=verify_evidence)
