"""Package the original order-one Picard eta kernel and leading-bound reduction."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation54 import PARENTS as EARLIER


PARENT = 'a8c1c3f0dd83bf937f0a607840b718ae78ff5fb5'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation54_Delta_20261120.zip':
           '21b2722f451cd81c7beb97336a8871232c879a0071d4289acc313a7bf1bbcb4a'}
KERNEL = 'axial-order-one-identity/native-eta-kernel/'
PINS = {
    'source-kernel.json': '0c0aa96af53ec099e3c2efc1745859d873a3e60562285cf15ba34faedb1eaee4',
    'kernel-identity.json': 'f293338a1abbeb9bec5d6072140b0ce0b5848f727a0f159ea1093ca2103e0964',
    'export_n1_kernel.mjs': '624165023d0a3602059a8c3a5246079d8a6db6672a3bc252272c42b809816e21',
    'checks.log': 'b0589d44e8a8f30f1fafee602de82d445823ad74a127a61ac113e3e22bddb968',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(KERNEL + path))['sha256'] == pin, path
    kernel = source(KERNEL + 'kernel-identity.json')
    assert kernel['status'] == 'PASS_ACTUAL_N1_ETA_RHS_AND_LEADING_BOUND_REDUCTION'
    assert kernel['sourceSHA256'] == PINS['source-kernel.json']
    assert kernel['sourceSystem'] == 0 and len(kernel['sourceCoefficientEtaRows']) == 18
    assert (kernel['ordinaryFormalEtaDerivativeIdentities'], kernel['literalFiniteGfEtaIdentities']) == (12, 9)
    assert len(kernel['coefficientMajorants']) == 12 and len(kernel['forcingMajorants']) == 6
    assert all(row['pass'] for row in kernel['coefficientMajorants'] + kernel['forcingMajorants'])
    assert kernel['omegaMajorant']['pass'] and kernel['omegaMajorant']['sourceTriangleCoefficient'] == '4949/2'
    assert kernel['sourceC1'] == {'B': 24812, 'delta': 24801, 'C1': 24818,
                                 'formula': '262144*B^2/delta^2'}
    controls = kernel['negativeControls']
    assert controls['wrongSecondEtaBinomialRows'] == [3, 4, 5] and controls['oneLargeMatrixLiteralRejected']
    assert controls['diagnosticNativeEvaluation']['code'] == 'UNSUPPORTED'
    assert not kernel['allOrders'] and kernel['release'] == 'HOLD'
    return {'originalN1RhsEtaRows': 18, 'etaIdentities': 12, 'firstVolterraEtaIdentities': 9,
            'coefficientMajorantRows': 12, 'forcingMajorantRows': 6,
            'ordinaryNativeLimitIdentification': 'OPEN'}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation55', date='20261120',
                   verify=verify_evidence)
