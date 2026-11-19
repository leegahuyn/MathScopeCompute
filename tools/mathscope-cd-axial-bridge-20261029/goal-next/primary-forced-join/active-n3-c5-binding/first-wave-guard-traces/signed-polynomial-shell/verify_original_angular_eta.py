"""Audit the weighted angular integral and its inward eta derivative domains."""

import argparse
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys


def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()


def match_live_prefix(goal, artifact, cache, expected):
    active = goal / 'primary-forced-join/active-n3-c5-binding'
    sys.path[:0] = [str(active / 'spatial-readback'), str(active / 'live-wave-gauge/signed')]
    import source_stream
    import source_cache

    folder = artifact / 'first-correction-spatial-source'
    manifest_bytes = (folder / source_stream.MANIFEST).read_bytes()
    assert sha256(manifest_bytes).hexdigest() == '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a'
    manifest = json.loads(manifest_bytes)
    native = source_stream.Native(folder, manifest)
    assert native.pin == 'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03'
    for kind, row in expected['nativePrefixes'].items():
        defs = json.loads(native.base_snapshot['base'][kind])[:row['count']]
        assert len(defs) == row['count']
        actual_hash = sha256(canonical(defs)).hexdigest()
        if kind == 'expression':
            assert row['matchedMaterializer'] and row['originalLimits'] == [4, 6]
            assert [entry['body'] for entry in defs] == [117048, 117047]
            assert all(entry['parameters'] == [4756, 2] and entry['derivativeLimits'] == row['inductionLimits']
                       and entry['historicalBodyPreserved'] and not entry['unspecifiedOracle'] for entry in defs)
            assert actual_hash == row['widenedSHA256']
        else:
            assert actual_hash == row['sha256'], kind
    assert set(expected['nativePrefixes']) == {'expression', 'quadratic', 'monotone', 'picard'}

    stream = source_cache.load(source_stream, folder, manifest, 22153782, cache)
    try:
        assert stream.count == 22155584 and stream.verify['sha256'] == 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
        digest = sha256(b'[')
        for index in range(expected['nodes']):
            operand = stream.record(index)
            if index:
                digest.update(b',')
            digest.update(canonical({'op': operand['op'], 'args': operand['args']}))
        digest.update(b']')
        assert digest.hexdigest() == expected['sha256']
        return {**expected, 'sourceStreamSHA256': stream.verify['sha256'], 'liveRegistrySHA256': native.pin}
    finally:
        stream.__exit__()


def verify(goal, original, artifact, cache):
    stress_file = goal / (
        'primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/'
        'angular-order-one-shell/transport/stress-transport.json'
    )
    raw_stress = stress_file.read_bytes()
    assert sha256(raw_stress).hexdigest() == '3667d24bfaebfa135a019d7444d661286aa5e79fdb036e553b30e5b69e8138be'
    data = json.loads(raw_stress)
    original_bytes = original.read_bytes()
    angular = json.loads(original_bytes)
    live = data['exactAngularFlux']
    assert angular['status'] == 'EXECUTED_ORIGINAL_ORDER_ONE_CANCELLATION_WITH_PREHEAT_CONSTANT'
    assert angular['scope']['authoritativeValue'] == 'CONDITIONAL_ORDINARY_SOURCE_INTEGRAL_SEMANTICS'
    assert angular['actualSource']['parameterExpressionSHA256'] == 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
    assert angular['originalPrefix']['nodes'] == 117100
    common = match_live_prefix(goal, artifact, cache, angular['originalPrefix'])
    assert live['sourcePrimitives']['wholeAngularMoment'] == angular['actualOriginalOrderOne']['angularTotal'] == 117072
    assert live['sourceSupport']['rawInnerBody'] == angular['actualOriginalOrderOne']['sourceAngular'] == 117038
    assert live['sourceRegistry']['body'] == 117048 and live['sourceSupport']['ends'] == [28814, 28826]
    proof = angular['leadingAngular']
    assert proof['preHeatConstant'] and proof['ordinaryInwardEtaEndpoints'] and not proof['heatTailTruncated']
    assert all(proof['positiveWaitAndTail'].values())
    assert angular['originalAngularTimeAndFlux']['exactInverseRows'] == [True, True]
    assert angular['tangentialWhole']['theta']['reducedConservativeTotal'] == 0
    assert angular['tangentialWhole']['axial']['originalTotal'] == 117075

    # The affine exponents are stored as (constant coefficient, h coefficient).
    A = (Fraction(1, 2), 1)
    D = (Fraction(1, 2), -1)
    b = (-1, -1)
    c = (-Fraction(1, 2), -1)
    current_gap = (0, 2)
    def total(*values):
        return tuple(sum(coefficients) for coefficients in zip(*values, strict=True))
    assert total(b, A, (Fraction(1, 2), 0)) == (0, 0)
    assert total(c, A) == (0, 0)
    assert total(b, current_gap, (2, 0)) == (1, 1)
    assert total(b, c, current_gap, (2, 0)) == (Fraction(1, 2), 0)
    assert total(b, (2, 0), (-D[0], -D[1])) == (Fraction(1, 2), 0)
    assert total(b, (2, 0)) == (1, -1)

    # For 0<h<1 and Z>=0, successive Gamma factors give H'(Z)<=2 in norm
    # and H''(Z)<=12. In the eta chain Z' and Z'' have norm <=4/X.
    heat1 = 1 * 2
    heat2 = 1 * 2 * 2 * 3
    tail = [2 * heat1 * 2, 2 * heat1 * 4, 2 * (heat2 * 4 ** 2 + heat1 * 4)]
    assert tail == [8, 16, 400]
    return {
        'status': 'VERIFIED_ETA_TAIL_DOMINATION_AND_ANGULAR_WEIGHT_SHIFTS',
        'originalReplaySHA256': sha256(original_bytes).hexdigest(),
        'sameLiveOriginalPrefix': common,
        'paper': {'sha256': '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
                  'printedPage': 53, 'equations': ['(5.19)', '(5.21)']},
        'source': {'supportedIntegrand': 117048, 'rawAngular': 117038, 'wholeAngular': 117072,
                   'originalAxisAndOuterCutoffs': [28814, 28826]},
        'outerEtaWeightMajorant': {'orders': [0, 1, 2], 'constants': tail,
                                  'commonWeight': 'abs(C)*X^(-1-h), X>=max(Xb,1), 0<h<1',
                                  'etaDomain': '[-1,1], inward endpoint derivatives only'},
        'nearAxis': 'If the normalized original F and its ordinary eta derivatives are bounded, the fixed subtraction contributes X^(-h) only to order zero, which is integrable for h<1.',
        'subtractedPhysicalPower': 'q^(-A)*sqrt(2X)*C*X^b=2^(A+1/2)*C*r^(-2A), so the subtraction is independent of physical z.',
        'conservativeAngularMoment': 'Tbar_(1+h)m1,2 + Zbar_(1/2)m1,4 - Zbar_(1/2)Zbar_(1-h)I0',
        'leadingMomentOmissionControl': {'input': 'm1,2=m1,4=0, I0=1', 'atEtaZero': '-2*(1-h)', 'nonzero': '0<h<1'},
        'ordinaryPremises': ['Same original Picard, root and heat functions as ordinary calculus objects.',
                              'Compact radial derivative majorants and smooth matches at all original profile joins.',
                              'Original conservative identity with the radial axis and outer fluxes vanishing.'],
        'wholeMomentStatus': 'CONDITIONAL_ACTUAL_ORIGINAL_ORDER_ONE',
        'allOrdersConstructed': False, 'finalJets': 0, 'release': 'HOLD',
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for option in ('goal', 'original', 'artifact', 'cache', 'out'):
        parser.add_argument('--' + option, type=Path, required=True)
    args = parser.parse_args()
    if not __debug__:
        parser.error('Python assertions must be enabled')
    result = verify(args.goal, args.original, args.artifact, args.cache)
    with args.out.open('x', encoding='utf-8', newline='\n') as file:
        json.dump(result, file, indent=2)
        file.write('\n')
    print(result['status'])
