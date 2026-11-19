"""Verify the actual N3 FiveMap radial endpoint and axial derivative in the native stream."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json
import sys


def match_mean(graph, native, ingress, compact, spatial):
    from source_stream import need
    from verify_spatial_structure import arithmetic_terms, inverse_partner

    row_by_kind = {r['component']:r for r in compact['componentRows']}
    assert [r['postFiveRoot'] for r in compact['componentRows']] == ingress['input']['latest']
    geometry = spatial['typedSourceReadback']['resolvedGeometryRoots']
    epsilon, radius = (compact['physicalFactors'][n] for n in ('epsilon','R'))
    assert radius == geometry['R']
    ell,R,Z,T = row_by_kind['z']['sourceArguments']
    assert (R,Z,T) == tuple(geometry[x] for x in ('R','Z','T'))

    gamma = row_by_kind['z']['latestFiveIncrement']
    beta = row_by_kind['r']['latestFiveIncrement']
    swirl = row_by_kind['theta']['latestFiveIncrement']
    assert swirl == ingress['input']['azimuthalSwirls'][1]
    declared, actual, orders = native.application(graph,gamma,'PostSignedFiveBump_gamma')
    beta_declared, beta_actual, beta_orders = native.application(graph,beta,'PostSignedFiveBump_beta')
    assert actual == beta_actual == [ell,R,Z,T] and orders == beta_orders == [0]*4

    five_raw = ingress['input']['meanPotentials'][1]
    primitive,_ = inverse_partner(graph,five_raw,R)
    integrand,bound,lower,upper = graph.args(primitive,'definite_integral')
    assert upper == R and bound != R
    graph.args(bound,'coordinate')
    xa, = graph.args(lower, 'sqrt_positive')
    assert graph.args(xa, 'source_parameter') == ['Xa']

    five_whole = ingress['input']['fiveWhole']
    whole_i, whole_b, whole_l, whole_r = graph.args(five_whole, 'definite_integral')
    assert (whole_i, whole_b, whole_l) == (integrand, bound, lower)
    assert whole_r != upper and whole_r != lower
    factor_terms = arithmetic_terms(graph, whole_r, limit=14)
    assert len(factor_terms) == 1
    (sqrt_xb,), multiplier = next(iter(factor_terms.items()))
    assert multiplier == 2
    xb, = graph.args(sqrt_xb, 'sqrt_positive')
    shell_factors = list(graph.args(xb, 'multiply'))
    xr, = [i for i in shell_factors if graph.record(i) == {'op':'source_parameter','args':['XR']}]
    shell_factors.remove(xr)
    shell_end, = graph.args(shell_factors[0], 'exp')
    assert len(shell_factors) == 1
    graph.args(shell_end, 'add')
    temporal_whole = spatial['typedSourceReadback']['coefficientAndScopeReadback']['temporalLeftAndWhole'][1]
    _, _, temporal_lower, temporal_upper = graph.args(temporal_whole, 'definite_integral')
    assert (temporal_lower, temporal_upper) == (lower, whole_r)

    compact_rhs, _ = inverse_partner(graph, ingress['input']['fiveCompactCandidate'], R)
    compact_terms = arithmetic_terms(graph, compact_rhs, {primitive, five_whole}, limit=180)
    assert compact_terms.pop((primitive,)) == Fraction(1)
    (cutoff_term, cutoff_sign), = compact_terms.items()
    assert len(cutoff_term) == 2 and five_whole in cutoff_term and cutoff_sign == -1

    def check_integrand(root, order):
        terms = arithmetic_terms(graph,root,{bound})
        assert len(terms) == 1
        term,coefficient = next(iter(terms.items()))
        assert len(term) == 2 and bound in term and coefficient == Fraction(1)
        app = next(i for i in term if i != bound)
        definition, coordinates, derivative = native.application(graph,app,'PostSignedFiveBump_gamma',zero_order=False)
        assert definition == declared and coordinates == [ell,bound,Z,T]
        assert derivative == [0,0,order,0]
        return app

    ordinary_app = check_integrand(integrand,0)
    beta_terms = arithmetic_terms(graph,beta_declared['body'],{epsilon},limit=160)
    assert len(beta_terms) == 1
    term, coef = next(iter(beta_terms.items()))
    assert coef == -1 and epsilon in term and len(term) == 3
    invR, = [r for r in term if graph.record(r) == {'op':'inverse','args':[R]}]
    integral, = [r for r in term if r not in {epsilon,invR}]
    beta_i,beta_b,t0,t1 = graph.args(integral,'definite_integral')
    assert [beta_b,t0,t1] == [bound,lower,upper]
    derivative_app = check_integrand(beta_i,1)

    psi_T = ingress['input']['meanPotentials'][0]
    assert psi_T == compact['verifiedPsiApplicationIDs'][0]
    definition, time_coordinates, _ = native.application(graph,psi_T,'afterActualSigned162_actual_meridional_potential')
    assert time_coordinates == compact['temporalDirections']
    for root in compact['verifiedPsiApplicationIDs']:
        d,a,o = native.application(graph,root,definition['name'],zero_order=False)
        assert d == definition and a == time_coordinates and sum(o) <= 1

    return {'schema':'MathScope.N7.ActualN3MeanGaugeNativeCalculus/1',
            'status':'VERIFIED_ACTUAL_NATIVE_FIVEMAP_BODY_AND_TEMPORAL_APPLICATION_BINDINGS',
            'actualMean':{'temporalPsi':psi_T,'fivePsi':five_raw,
                          'fiveGamma':gamma,'fiveBeta':beta,'fiveSwirl':swirl,
                          'ordinaryGammaWithBoundRadius':ordinary_app,
                          'axialGammaDerivativeWithBoundRadius':derivative_app,
                          'sameRadialLimits':[lower,upper],'sameBoundRadius':bound,
                          'wholeFixedRadialLimits':[lower,whole_r],'wholeSharedIntegrand':five_whole,
                          'compactCandidate':ingress['input']['fiveCompactCandidate']},
            'ordinaryGaugeProofPremises':['ordinary FTC on the live radial segment',
                'same smooth native branch through the radial limits',
                'fixed radial end labels and differentiability under the integral',
                'original temporal shifted phase derivatives and support contracts'],
            'cannotPromoteWholeGauge':True,'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}


def main():
    assert __debug__
    cli = ArgumentParser(description=__doc__)
    for field in ('reader','artifact','spatial','compact','out','scratch'):
        cli.add_argument('--'+field,type=Path,required=True)
    p = cli.parse_args()
    sys.path.insert(0,str(p.reader))
    from source_stream import MANIFEST, SourceStream, Native, read
    spatial, _ = read(p.spatial)
    assert spatial['status'] == 'VERIFIED_ACTIVE_N3_SPATIAL_SOURCE_STREAM_AND_OPERAND_BINDINGS'
    assert spatial['hostedRun']['id'] == 44582875351
    compact, _ = read(p.compact,'4034331b1ab4204a845d197b213e3566a7bc677aa4541f22936e2bc77b89435d')
    ingress, _ = read(p.artifact/'first-correction-spatial-ingress.json',spatial['ingressSHA256'])
    directory = p.artifact/'first-correction-spatial-source'
    manifest, _ = read(directory/MANIFEST,spatial['graphManifestSHA256'])
    native = Native(directory,manifest)
    with SourceStream(directory,manifest,ingress['originalPrefix'],p.scratch) as graph:
        result = match_mean(graph,native,ingress,compact,spatial)
    with p.out.open('x',encoding='utf8',newline='\n') as handle:
        json.dump(result,handle,indent=2)
        handle.write('\n')


if __name__ == '__main__':
    main()
