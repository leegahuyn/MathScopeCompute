"""Replay the two centered inputs for the actual first-cycle flat remainders."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import subprocess
import sys


FULL_SHA = 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
REGISTRY_SHA = '657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333'
MEAN_SHA = 'd0548a8520f7363294fd330aa332a79f32cb7a366c149b03a918ad3966915725'
PRESSURE_SHA = 'c5e39a3d7a18849f42189e0821c065298736893d10c60d1baad5c86f8589f04f'
PHASE_SHA = '3b5a526636b6646b620e7870a676c0f59b27648a8f0aceab5a88d6fc69ef7f91'
ORIGINAL = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
ELL, R, Z, T, Y0, Y1 = 622791, 622802, 622803, 622804, 635044, 635045
AR, CI = 635060, 635063
BEFORE = [4454231, 4454232, 4454233]
FIVE = [4455175, 4455153, 4455157]
AFTER = [4455176, 4455177, 4455178]
BACKGROUND = [622934, 634588, 622933]


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return json.loads(raw)


def source_pins(repo):
    required = {
        'source-forced-class-majorants.mjs': ('actualInputForcingWClassCertified:false',
                                             'requiredBackgroundDerivativeOrder:order+2'),
        'source-global-temporal-class-majorants.mjs': ('same actual private pressure/current',
                                                       'actualAllOrdersTemporalCutoffFlatnessCertified:false'),
        'source-global-fresh-mean-class-majorants.mjs': ('actualAllOrdersRadialCutoffFlatnessCertified:false',
                                                         'requiredInitializedInputDefectOrder'),
        'source-fresh-mean-class-kernel.mjs': ('requiredPreFiveVelocityOrder:m+5',
                                              'requiredInitializedFiveMapOrder:m+2'),
        'source-initial-residual-class-kernel.mjs': ('requiredPressureOrder:m+1',
                                                    'requiredCommonYCovarianceOrder:m+2'),
        'source-radial-class-majorants.mjs': ('G.mul(X0,G.exp(G.one),q(121,100))',
                                              'sourceGapProof:'),
    }
    hashes = {}
    for file, fragments in required.items():
        path = 'research-ide/mathscope-m3/navier/' + file
        blob = subprocess.check_output(['git', '-C', str(repo), 'show', f'{ORIGINAL}:{path}'])
        assert all(s.encode() in blob for s in fragments), (file, fragments)
        hashes[path] = sha256(blob).hexdigest()
    return hashes


def read_centered_operands(g, registry, pressure, mean):
    expressions, _, inverses, *_ = json.loads(registry['definitions'])
    definitions = {r['id']: r for r in expressions}
    [temporal] = [row for row in inverses if row['id'] == 'coupled-inverse:1']
    assert temporal['body'] == 4229836 and temporal['Y'] == [Y0, Y1]
    assert temporal['operator'] == '(sqrt(2)-1)*partial_y0+partial_y1'
    assert temporal['zeroMode'] == 'The exact normalized Haar mean is projected out.'
    assert g.node(4229836) == ('add', [4229480, 4229835])
    assert g.node(4229835) == ('multiply', [20, 4229832])
    assert g.node(4229832) == ('definite_integral', [4229831, Y1, 0, 1])
    assert g.node(4229831) == ('definite_integral', [4229480, Y0, 0, 1])
    assert g.node(4229480) == ('add', [4229129, 4229479])
    assert g.node(4229479) == ('multiply', [622798, 4229476])

    assert g.node(4455782) == ('multiply', [633761, 4455625])
    assert g.node(4455625) == ('definite_integral', [4455623, 4455571, 633710, 633712])
    t0 = pressure['finalT0']
    assert t0['nativeGrActual'][2:4] == [Z, T]
    assert t0['normalization'] == {'nativePBody': 4455438, 'nativeHaarBody': 4455434,
                                  'sourceAtFormalArguments': 4455432}
    assert t0['rho']['normalizationMass'] == 633724 and t0['rho']['massIntegrand'] == 633723
    assert t0['defectP'] == 4455439 and t0['integrand'] == 4455623 and t0['formalGrBody'] == 4455275
    assert definitions['coupled-expression:1336']['body'] == 4455275
    assert definitions['coupled-expression:1328']['body'] == 4454367

    assert g.node(4454181) == ('multiply', [623135, 4454170])
    assert g.node(623135) == ('inverse', [R])
    assert g.node(4454170) == ('multiply', [633761, 4454051])
    assert g.node(4454051) == ('definite_integral', [4454049, 4454013, 633710, 633712])
    assert g.node(4454049) == ('multiply', [4454013, 4454048])
    assert g.node(4454048) == ('multiply', [20, 4454047])
    assert g.node(4454047) == ('multiply', [1706622, 4454046]) and g.node(1706622) == ('inverse', [CI])
    assert g.node(4454046) == ('m3_coupled_inverse_partial', ['coupled-inverse:1',
        [4454013, Z, T, ELL, 4454020, 4454022], [0]*5])
    assert g.node(4454020) == ('add', [Y0, 4454019]) and g.node(4454022) == ('add', [Y1, 4454021])
    assert g.node(4454021) == ('multiply', [623066, 4454019])
    assert g.node(4454019) == ('add', [643116, 4454018]) and g.node(643116) == ('multiply', [20, 635059])
    assert g.node(4454018) == ('multiply', [635058, 4454017])
    assert g.node(4454017) == ('exp', [4454016]) and g.node(4454016) == ('multiply', [624048, 4454015])
    assert g.node(4454015) == ('log_positive', [4454014]) and g.node(4454014) == ('multiply', [624049, 4454013])
    assert mean['temporal']['inverseSource'] == 4229836 and mean['temporal']['flatAxialFormula'] == '-ci0*N(A1)'
    assert g.node(633733) == ('source_step_derivative', [633700, 0])
    assert g.node(633761) == ('multiply', [633759, 633760])
    assert g.node(633759) == ('source_step_derivative', [633700, 1])
    assert g.node(633700) == ('multiply', [669, 633699]) and g.node(669) == ('rational', ['10', '1'])
    shell = pressure['normalizedReferenceShell']
    assert [shell[k] for k in ('Xa', 'Xb', 'originalMeanPatchLeft', 'cutoffArgument')] == [3617, 28826, 633682, 633700]
    assert shell['proof'].startswith('Xa<X0Imean and Xb>e^5 X0Imean.')
    assert pressure['temporalExteriorSource']['exteriorRawScope']['4229480'] == [ELL, R, Z, T]
    assert not pressure['twoSidedPositiveOrderSeamJetsCertified']
    for root, system in zip((4454726, 4454789, 4454848), (1330, 1331, 1332), strict=True):
        assert g.node(root) == ('m3_coupled_expression_partial', [f'coupled-expression:{system}', [ELL, Z, T], [0]*3])
    return definitions, {'A0': 4455782, 'A0CenteredSourceBody': 4455275, 'A0NativeSource': 4455432,
                         'actualPressureMoment': 4455439, 'normalizerMass': 633724,
                         'A1': 4454181, 'actualTemporalWeightedWhole': 4454051,
                         'F_axCenteredSource': 4229836, 'preTemporalRawEz': 4229480,
                         'preTemporalEzPressureZ': 4229476, 'meanCutoff': 633733, 'meanCutoffR': 633761,
                         'meanCutoffInteriorXInterval': ['exp(1)*X0Imean', '121/100*exp(1)*X0Imean'],
                         'preFiveFreshTargets': [4454726, 4454789, 4454848], 'weightedSeamTracesCertified': False}


def replay_five_difference(g, a, operator, definitions, equal, velocity_only):
    for j, (inc, body) in enumerate(zip(FIVE, [4455174, 4455152, 4455156], strict=True)):
        op, (system, actual, orders) = g.node(inc)
        assert op == 'm3_coupled_expression_partial' and actual == [ELL, R, Z, T] and orders == [0]*4
        assert definitions[system]['parameters'] == [ELL, R, Z, T] and definitions[system]['body'] == body
        assert not {Y0, Y1} & a.scope.free(body)
        assert g.node(AFTER[j]) == ('add', [BEFORE[j], inc])
    assert all(not {Y0, Y1} & a.scope.free(root) for root in BACKGROUND)
    bg, before, five, after = ([a.of(i) for i in row] for row in (BACKGROUND, BEFORE, FIVE, AFTER))
    sum_fields = lambda x, y: [a.add(i, j) for i, j in zip(x, y, strict=True)]
    radial = lambda fields: velocity_only(operator, a, fields, 0)
    old, new = radial(sum_fields(bg, before)), radial(sum_fields(bg, after))
    observed = a.sub(a.of(4455275), a.of(4454367))
    equal(a, observed, a.sub(old, new), 'actual two gr bodies and exact full FiveMap velocity change')
    before_beta, before_v, before_gamma = before
    dbeta, dv, dgamma = five
    cross_r = a.mul(a.scalar(2), before_beta, dbeta)
    cross_z = a.add(a.mul(before_beta, dgamma), a.mul(dbeta, before_gamma))
    center_cross = a.add(a.neg(operator.base_derivative((cross_r, a.zero), R)[0]),
                         a.neg(a.mul(operator.inv_r, cross_r)),
                         a.neg(operator.base_derivative((cross_z, a.zero), Z)[0]),
                         a.mul(a.scalar(2), operator.inv_r, before_v, dv))
    background_five = a.sub(radial(bg), radial(sum_fields(bg, five)))
    equal(a, a.sub(observed, center_cross), background_five, 'Y-independent remainder after removing FiveMap cross terms')
    return {'preFiveGr': 4454367, 'finalGr': 4455275, 'beforeMeanVelocity': BEFORE,
            'fiveMapYIndependentVelocity': FIVE, 'finalMeanVelocity': AFTER,
            'fullDifferenceMonomials': len(observed), 'crossMonomials': len(center_cross),
            'discardedYIndependentMonomials': len(background_five),
            'centeredCrossIdentity': ['-(D_r+1/R)(2*beta_pre^circ*beta_5)',
                                      '-D_z(beta_pre^circ*gamma_5+beta_5*gamma_pre^circ)',
                                      '+2*v_pre^circ*v_5/R']}


def finite_criterion():
    # Both torus directions have the same irrational spacing after integer rotation.
    # Dyadic sum <= 4*(4D)^(2p) * sum 4^-j, and the two Bessel components
    # contribute sqrt(2). Use D<7/2, 2*pi>6, and sqrt(32/3)<6.
    assert Fraction(32, 3) < 36 and Fraction(4*7, 2*36) == Fraction(7, 18)
    # Two minus signs and the identical nonzero temporal Fourier symbol cancel.
    assert (-1) * (-1) == 1
    assert 100000*4096 - 99999 == 409500001
    for m, p in ((0, 1), (1, 2), (3, 4)):
        k = m + 2*p + 1
        assert max(k+2, m+p+4) == k+2 and max(k+1, m+p+3) == k+1
    return {'weightedWholeInputs': ['f^circ with e=0', 'actual E_z^circ with e=1'],
            'extraRadialOrdersPerIBP': 'p', 'extraTorusOrdersPerIBP': 'p+1',
            'totalSufficientRawInputOrder': 'm+2*p+1', 'frequencyInverseConstant': '(7/18)^p',
            'fiveMapSufficientSlowOrder': {'betaGamma': 'm+p+1', 'swirl': 'm+p', 'freshTargets': 'm+p+2'},
            'minimumPositiveIBPAtOutputOrderZero': {'inputOrder': 3, 'p': 1,
                                                       'fiveBetaGammaSlowOrder': 2, 'fiveSwirlSlowOrder': 1,
                                                       'preFiveFreshTargets': 3, 'preFiveVelocityGeneric': 5,
                                                       'preFiveCommonCovarianceGeneric': 4,
                                                       'preTemporalPressureForEzDirect': 4,
                                                       'preTemporalOldMeanVelocityGeneric': 5,
                                                       'preTemporalCommonCovarianceGeneric': 5},
            'strictLowerBoundOnSufficientIBPOrderForQ1WithoutPhysicalLossAtAlpha1MinusKappa': 409500001,
            'numericActualInputSeminormsCertified': False, 'allOrderSourceClassCertified': False}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('repo', 'first-dir', 'out'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    evidence = Path(__file__).resolve().parent.parent
    sys.path[:0] = [str(evidence/'first-force-repair'), str(evidence/'f1-mean')]
    from check_mode_zero_flat import equal, velocity_only
    from check_repeat_forced_candidates import FULL_SCOPE, STREAM, Graph, verify_manifest
    from replay_repeat_conservative import DifferentialAlgebra, FourierResidual

    mean = pinned(evidence/'first-force-repair/actual-mode-zero-flat.json', MEAN_SHA)
    pressure = pinned(evidence/'pressure-exterior/corrected-pressure-exterior.json', PRESSURE_SHA)
    phase = pinned(evidence/'first-force-repair/radial-phase-sign.json', PHASE_SHA)
    manifest, registry = verify_manifest(args.first_dir, FULL_SCOPE)
    assert manifest['node_stream_sha256'] == phase['graphSHA256'] == mean['graphSHA256'] == FULL_SHA
    assert manifest['definitions_sha256'] == pressure['registrySHA256'] == REGISTRY_SHA
    with TemporaryFile() as backing:
        graph = Graph(args.first_dir/STREAM, backing, manifest)
        definitions, roots = read_centered_operands(graph, registry, pressure, mean)
        a = DifferentialAlgebra(graph, registry)
        operator = FourierResidual(a, 0, a.of(AR), a.of(CI))
        five = replay_five_difference(graph, a, operator, definitions, equal, velocity_only)
    result = {'schema': 'MathScope.N6.CenteredFirstCycleFlatInput/1', 'graphSHA256': FULL_SHA,
              'registrySHA256': REGISTRY_SHA, 'modeZeroReceiptSHA256': MEAN_SHA,
              'phaseReceiptSHA256': PHASE_SHA, 'originalSourceSHA256': source_pins(args.repo),
              'operands': roots, 'exactFiveMapDifference': five,
              'identitiesOnCommonDerivativeDomain': ['A0_final=A0[g_r_final^circ]',
                                                      'F_ax=A1[E_z_beforeTemporal^circ]'],
              'finiteAnalyticCriterion': finite_criterion(), 'release': 'HOLD'}
    raw = (json.dumps(result, indent=2) + '\n').encode()
    args.out.write_bytes(raw)
    print('PASS exact centered operands and full FiveMap difference')
    print(f'{sha256(raw).hexdigest()}  {args.out.name}')


if __name__ == '__main__':
    main()
