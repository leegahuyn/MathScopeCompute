"""Ordinary regularity of the ORIGINAL supported axial density native1.

The genuine left application is reconstructed from all18 original inputs.
The right join uses a separately authenticated exterior source trace and the
same raw residual regularity theorem.  No total moment, stress primitive,
original Cartesian guard, literal517234 integral or numerical norm is proved.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path

import actual_axial_left_collar as left_proof
import actual_axial_raw_regularity as raw_proof
from natural_domain_proof import canonical_sha


INPUT_FILES = {**left_proof.INPUT_FILES,
    'left-collar': 'ACTUAL_AXIAL_LEFT_COLLAR.json',
    'exterior-source': 'ACTUAL_AXIAL_EXTERIOR_ZERO.json'}
# Filled from the final deterministic standalone original-source probe,
# after its source equality and adverse tests have passed. It authenticates
# complete trace/comparator operands, not a collection of pass-only flags.
EXTERIOR_CANONICAL_PIN = 'bafa26fe8872f238a249971b3b3364d40cfeff37a70c052a542e876d7147a2de'
SOURCE_PINS = {**left_proof.COLLAR_SOURCE_PINS,
    raw_proof.BASE+'actual-continuation-exact-support.mjs':
        '0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
    raw_proof.BASE+'actual-continuation-exact-identities.mjs':
        'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712',
    raw_proof.BASE+'actual-residual-order-induction-expressions.mjs':
        'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501'}
COUNTERS = ['newOriginalGuardsDischarged', 'newOriginalJetsDischarged',
            'newOriginalPDETermsDischarged']


def need(condition, message):
    if not condition:
        raise ValueError(message)


def require_same(left, right, message):
    need(left_proof.same(left, right), message)


def validate_left_and_raw(data, hashes, sizes):
    """Do not promote a copied left flag or mix independently sourced receipts."""
    original_data = {key: data[key] for key in left_proof.INPUT_FILES}
    original_hashes = {key: hashes[key] for key in left_proof.INPUT_FILES}
    original_sizes = {key: sizes[key] for key in left_proof.INPUT_FILES}
    expected = left_proof.compose(original_data, original_hashes, original_sizes)
    require_same(data['left-collar'], expected,
                 'The genuine left theorem differs from the complete same18-input reconstruction')
    # left_proof.compose independently replays raw_proof.validate/compose and
    # all9 Picard inputs, including their exact raw pins and SHA/byte chains.
    return expected


def validate_exterior(data):
    receipt = data['exterior-source']
    need(receipt.get('schema') == 'MathScope.N6.ActualAxialExteriorZero/1',
         'Original axial exterior source receipt required')
    need(canonical_sha(receipt) == EXTERIOR_CANONICAL_PIN,
         'Changed complete original exterior source trace/comparator receipt')
    for key, expected in [('sourceHeaderSHA256', raw_proof.HEADER),
                          ('fixedDefinitionSHA256', raw_proof.FIXED),
                          ('sourcePaperSHA256', raw_proof.PAPER),
                          ('diagnosticsSHA256', raw_proof.DIAGNOSTICS)]:
        need(receipt.get(key) == expected, 'Mixed original exterior source identity: '+key)
    left_proof.source_files(receipt, SOURCE_PINS, 'Changed actual exterior producer source pins')
    require_same(receipt.get('originalConstructionOptions'),
                 {'terms': 0, 'bits': 128, 'heatIterations': 0},
                 'Changed original exterior construction options')
    need(receipt.get('originalPrefixNodeCount') == 117100 and
         receipt.get('originalPrefixSHA256') == left_proof.PREFIX_PIN,
         'The exterior proof uses a different original source prefix')
    for key in ['originalSourcePrefixUnchanged', 'originalFunctionDefinitionsUnchanged',
                'sourceBytesUnchanged']:
        need(receipt.get(key) is True, 'Changed original exterior source: '+key)
    require_same(receipt.get('exactOriginalRoots'), {
        'U0': 9236, 'U1': 29289, 'Pi1': 50558, 'v0': 18778, 'v1': 29440,
        'X': 4756, 'eta': 2, 'Xv': 3293, 'Xplus': 28824,
        'rawAxial': 117045, 'density': 117047},
        'The actual exterior profiles, finite operands or axial endpoint changed')
    require_same(receipt.get('actualSupportOrder'), data['binding'].get('actualSupportOrder'),
                 'Exterior and raw proofs use different original source support ordering')
    require_same(receipt.get('actualScalarParameterOrdering'), data['leading-collar']['ordering'],
                 'Exterior and left proofs use different scalar parameter ordering')
    support = receipt['actualSupportOrder']
    endpoints = {'Xa': 3617, 'Xminus': 28814, 'Xkeep': 28819, 'Xcut': 28823,
                 'aSquared': 24805, 'IposLeft': 28987, 'IposRight': 28988,
                 'lastU': 29328, 'Xv': 3293, 'Xplus': 28824, 'Xb': 28826}
    require_same(support.get('endpoints'), endpoints, 'Changed actual support endpoint node IDs')
    need(support.get('schema') == 'MathScope.ActualBackgroundSupportOrder/1' and
         support.get('parameterExpressionSHA256') ==
         'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152' and
         support.get('expressionChecks', {}).get('allEndpointsIndependentOfEta') is True and
         support.get('numericalCoordinateComparisonUsed') is False,
         'Unproved actual fixed eta-independent support ordering')
    require_same(support.get('inequalities'), [
        'Xminus<Xkeep<Xcut<a^2<IposLeft<IposRight<Xv<Xplus<Xb',
        'all five radial bump endpoints<IposRight', 'all endpoints are independent of eta'],
        'The actual ordered support chain changed')
    domain = {'kind': 'strict-positive-outward-half-line', 'coordinate': 4756,
              'left': 28824,
              'leftSourceNode': {'op': 'multiply', 'args': [588, 3293]},
              'inequality': 'X>Xplus>0'}
    require_same(receipt.get('exteriorDomain'), domain,
                 'The original exterior source domain is not X>Xplus>0')
    ordering = receipt.get('actualEndpointOrdering', {})
    require_same(ordering.get('coordinate'), 4756, 'Different free radial source coordinate')
    require_same(ordering.get('domain'), domain, 'Different admitted exterior selection domain')
    require_same(ordering.get('actualEndpoints'), endpoints, 'Different exterior source endpoints')
    parameters = data['diagnostics']['fullNativePayloads']['fixed']['source']['parametersExactExpressions']
    require_same(ordering.get('parameterExpressions'), {key: parameters[key] for key in
                 ['lambda', 'BOuter', 'X0Ipos', 'IposRight', 'X0I1', 'I1Right', 'loopIRight']},
                 'The exact original exterior parameter expressions changed')
    require_same(ordering.get('exactLogComparisons'), {
        'IposRightOverXv': 'exp(-9-13/lambda)<1',
        'XplusOverXv': 'exp(1)>1',
        'tailLog': 'X>Xplus=Xp*exp(13/lambda+1) implies log(X/Xp)>13/lambda+1>13/lambda',
        'I1Support': 'X>Xplus>I1Right=X0I1*exp(5), so X/X0I1>exp(5)>32',
        'actualStepArguments': ['2*(X/X0I1-9)>1', '2*(X/X0I1-10)>1']},
        'The actual logarithmic tail/flat-step exterior inequalities changed')
    require_same(ordering.get('actualAverageCutoff'), {
        'source': 29328, 'sourceNode': {'op': 'multiply', 'args': [28987, 29327]},
        'normalizedSupport': 29008,
        'normalizedSupportSourceNode': {'op': 'rational', 'args': ['8193', '4096']},
        'squaredSupport': 29327,
        'squaredSupportSourceNode': {'op': 'rational', 'args': ['67125249', '16777216']},
        'formula': 'lastU=X0Ipos*(8193/4096)^2',
        'strictBound': '(8193/4096)^2<16<32<exp(5), so lastU<IposRight<Xv<Xplus',
        'exactIntegerCheck': '8193^2<16*4096^2',
        'actualAverageBranches': [29336, 29436]},
        'The genuine mass average/eta cutoff lost its exact original lastU support bound')
    need(8193**2 == 67125249 and 4096**2 == 16777216 and
         8193**2 < 16*4096**2 and 16 < 32,
         'Exact original average cutoff arithmetic changed')
    need(ordering.get('numericalCoordinateComparisonUsed') is False,
         'Exterior ordering was replaced by a numerical coordinate comparison')
    selected = receipt.get('selectedSourceNodes', {})
    for key, node in raw_proof.SOURCE_NODES.items():
        require_same(selected.get(key), node, 'Changed retained raw/density source node '+key)
    for key, node in {
        '2': {'op': 'coordinate', 'args': ['eta']},
        '4756': {'op': 'coordinate', 'args': ['X']},
        '588': {'op': 'exp', 'args': [1]},
        '28824': {'op': 'multiply', 'args': [588, 3293]},
        '101': {'op': 'rational', 'args': ['13', '1']},
        '102': {'op': 'inverse', 'args': [8]},
        '103': {'op': 'multiply', 'args': [101, 102]},
        '8': {'op': 'source_parameter', 'args': ['lambda']},
        '5099': {'op': 'log_positive', 'args': [5098]},
        '5098': {'op': 'multiply', 'args': [4756, 5097]},
        '5097': {'op': 'inverse', 'args': [613]},
        '5128': {'op': 'smooth_piecewise', 'args': [5099, 0, 103, 0, 5127, 0]},
        '9199': {'op': 'source_step_derivative', 'args': [9198, 1]},
        '9204': {'op': 'source_step_derivative', 'args': [9203, 1]},
        '29008': {'op': 'rational', 'args': ['8193', '4096']},
        '29327': {'op': 'rational', 'args': ['67125249', '16777216']},
        '29328': {'op': 'multiply', 'args': [28987, 29327]},
        '29336': {'op': 'smooth_piecewise', 'args': [4756, 28819, 29328, 29332, 29335, 0]},
        '29436': {'op': 'smooth_piecewise', 'args': [4756, 28819, 29328, 29343, 29435, 0]},
    }.items():
        require_same(selected.get(key), node, 'Changed original exterior endpoint/tail/step node '+key)
    for key, node in data['leading-collar']['ordering']['actualI1StepArgumentSourceNodes'].items():
        require_same(selected.get(key), node, 'Different same-source I1 argument: '+key)
    trace = receipt.get('actualExteriorTrace', {})
    require_same(trace.get('checks'), [{'index': j, 'expression': root, 'zero': True}
                 for j, root in enumerate([9236, 29289, 50558])],
                 'The three exterior identities do not use actual U0/U1/Pi1')
    need(trace.get('schema') == 'MathScope.ActualExteriorZeroEvaluation/1' and
         trace.get('endpoint') == 28824 and trace.get('visitedNodes') == 22 and
         trace.get('compactIntegrandMistakenForZeroPrimitive') is False and
         trace.get('pass') is True, 'Incomplete actual three-profile exterior trace')
    require_same(receipt.get('actualThreeProfileVisitedNodes'), [
        9236, 7966, 5175, 5157, 5128, 7961, 7959, 9209, 9207, 9201, 9169,
        9200, 24, 9199, 9206, 9170, 9205, 9204, 29289, 28839, 29268, 50558],
        'Changed actual22 source nodes reached by the three-profile zero checker')
    branches = trace.get('zeroBranchTrace', [])
    require_same([row.get('node') for row in branches],
                 [5128, 5157, 5175, 7959, 9199, 9204, 28839, 29268, 50558],
                 'Missing or changed actual exterior branch/step trace')
    for row in branches:
        node = selected[str(row['node'])]
        if node['op'] == 'smooth_piecewise':
            require_same({'rightEndpoint': row.get('rightEndpoint'),
                          'selected': row.get('selected'), 'after': row.get('after')},
                         {'rightEndpoint': node['args'][2], 'selected': 'after', 'after': node['args'][5]},
                         'A source exterior selector chooses a different retained branch')
        else:
            require_same([row.get('stepArgument'), row.get('derivativeOrder')], node['args'],
                         'A source step derivative uses a different support argument/order')
    formula = data['binding']['actualAxialFormula']
    require_same(receipt.get('actualRawAxialFormula'),
                 {key: formula[key] for key in ['root', 'terms', 'termRoles',
                  'allEightOriginalTermsIndependentlyReconstructed', 'lambda1',
                  'leadingU0', 'leadingv0', 'U1', 'v1', 'Pi1']},
                 'The right source omitted/changed an original eight-term operand')
    eight = receipt.get('actualEightTermExteriorTrace', {})
    require_same(eight, data['binding'].get('actualRawAxialExterior'),
                 'The new eight-term trace differs from the original raw source audit')
    require_same(eight.get('checks'), [{'index': j, 'expression': root, 'zero': True}
                 for j, root in enumerate(raw_proof.TERM_IDS)],
                 'Incomplete original eight-term exterior zero identities')
    need(eight.get('visitedNodes') == 291 and eight.get('endpoint') == 28824,
         'Changed actual eight-term raw trace coverage or axial endpoint')
    density = receipt.get('actualDensity', {})
    bootstrap = {key: value for key, value in raw_proof.DENSITY_DEFINITION.items()
                 if key != 'historicalBodyPreserved'}
    bootstrap['derivativeLimits'] = [4, 6]
    bootstrap['implementation'] = 'actual-continuation-exact-functions.mjs:materializeExpressionFunction'
    require_same(density, {'registry': 'expression:1', 'bootstrapDefinition': bootstrap,
        'definition': raw_proof.DENSITY_DEFINITION, 'definitionSHA256': raw_proof.DENSITY_PIN,
        'component': 'axial', 'guard': [4756, 28814, 28824],
        'sourceNode': raw_proof.SOURCE_NODES['117047'],
        'angularGuardUsesDifferentRightEndpoint': 28826},
        'Changed original supported native1 body, source ABI or axial guard')
    require_same(receipt.get('sourceConclusions'), {
        'actualThreeOriginalProfilesHaveZeroExteriorBranch': True,
        'actualEightOriginalAxialTermZeroTracesBound': True,
        'originalRawResidualAndSupportedDensityWrapperRetained': True},
        'Incomplete actual exterior source conclusions')
    for key in ['actualAnalyticCompositionApplied', 'analyticRightExteriorZeroProvedHere',
                'rawAxialResidualZeroProvedHere', 'allDerivativeExistenceProvedHere',
                'densityJoinsProvedHere', 'actualTotalAxialMomentZeroProvedHere',
                'TzPrimitiveGluingProvedHere', 'numericalNormHonestyProvedHere', 'wholeGOnJProved']:
        need(receipt.get(key) is False, 'The source-only trace preclaimed an analytic theorem: '+key)
    for key in COUNTERS:
        need(type(receipt.get(key)) is int and receipt[key] == 0,
             'The exterior source receipt promoted an original obligation')
    return receipt


def compose(data, hashes, sizes):
    for key in INPUT_FILES:
        need(key in data and key in hashes and key in sizes and sizes[key] > 0,
             'Missing original density proof input: '+key)
    left = validate_left_and_raw(data, hashes, sizes)
    exterior = validate_exterior(data)
    result = {
        'schema': 'MathScope.N6.ActualAxialDensityRegularity/1',
        'sourceHeaderSHA256': raw_proof.HEADER,
        'fixedDefinitionSHA256': raw_proof.FIXED,
        'sourcePaperSHA256': raw_proof.PAPER,
        'inputBindings': {key: {'sha256': hashes[key], 'bytes': sizes[key]} for key in INPUT_FILES},
        'actualOriginalDensity': {
            'registry': 'expression:1', 'definitionSHA256': raw_proof.DENSITY_PIN,
            'definition': raw_proof.DENSITY_DEFINITION,
            'body': 117047, 'rawMiddle': 117045,
            'literalWrapper': {'op': 'smooth_piecewise',
                               'args': [4756, 28814, 28824, 0, 117045, 0]},
            'coordinates': {'X': 4756, 'eta': 2},
            'Xminus': 28814, 'Xplus': 28824,
            'distinctAngularEndpointXb': 28826,
            'rawProfileOperands': {'U0': 9236, 'v0': 18778,
                                   'U1': 29289, 'v1': 29440, 'Pi1': 50558}},
        'ordinaryDerivativeDomain': {
            'radialDomain': 'X>=0',
            'jointSmoothInterior': 'X>0 and -1<eta<1',
            'axisConvention': 'Right radial jets at X=0, obtained from the literal zero neighborhood0<=X<Xminus.',
            'etaConvention': 'Every fixed mixed jet extends continuously to the original inward eta endpoints eta=+-1.',
            'physicalEta': [-1, 1],
            'negativeRadialExtensionClaimed': False},
        'unchangedNativeImplementationContract': {
            'serializedDerivativeLimits': [128, 128],
            'requestedOrdinaryNativePartialsWithinThoseLimits': [[0, 1], [1, 1]],
            'mathematicalScope': 'Each fixed ordinary mixed derivative of the same actual supported function exists with the stated endpoint conventions; this does not change the serialized native implementation limits.',
            'nativeDerivativeLimitsChanged': False,
            'originalNativeHandlerEnabledHere': False,
            'originalConsumerAcceptanceChanged': False},
        'sameRawRegularityApplication': {
            'originalRawRoot': 117045,
            'sameOriginalFiveProfileOperands': True,
            'allFixedMixedRawJetsContinuousForPositiveXAndInwardEtaEndpoints': True,
            'LBound': 'L=1-2*h*eta^2>7/8 on the original physical eta interval',
            'v0Andv1': 'The SAME accepted leading/order-one theorems give finite smooth v0=18778 and v1=29440 at every positive radial point, with each fixed jet finite on fixed positive radial compact boxes. No exterior vanishing of v0 or v1 is assumed.'},
        'rightJoinArgument': [
            'The authenticated original source trace shows U0=9236, U1=29289 and Pi1=50558 are identically0 on the entire open exterior X>Xplus28824, for the SAME physical eta. The right endpoint is the axial Xplus, not the angular Xb28826.',
            'The accepted same-source smooth profile theorems make every fixed mixed ordinary derivative of these three identically zero functions0 throughout that exterior. Their inward eta endpoint jets are0 by continuity.',
            'Each of the eight original raw terms is zero there: time(U1); X*v0*U1_X; U0*Z(U1); X*v1*U0_X; U1*Z(U0); Z(Pi1); -2*(X*U1_XX+U1_X); and -Z_(c-D)Z_c(U0). The same finite v0,v1 and L>7/8 justify the products and operators; no0-times-undefined evaluation is used.',
            'Consequently raw117045 and every fixed mixed raw derivative are0 on X>Xplus. The raw theorem supplies joint C-infinity through the positive point Xplus and continuous inward eta jets. Taking limits from the exterior therefore gives every fixed mixed raw jet0 at Xplus, including inward eta endpoints.',
            'Let a=Xminus and b=Xplus. The eta-independent interval J=((a+b)/2,2*b) is positive, lies entirely above a, and contains b because0<a<b. On J left of b the supported density equals raw; right of b its literal0 equals raw by the actual exterior identity; at b both values are0 by raw continuity. Thus the supported density agrees with the SAME genuine raw smooth function on all of J, giving its smooth germ through Xplus. No two-sided raw-zero collar is assumed.'
        ],
        'globalSupportedDensityArgument': [
            'For0<=X<Xminus, the literal original supported wrapper selects0. Since Xminus>0, this gives a zero neighborhood through the radial axis, so all right radial jets and their fixed eta derivatives are0 there without evaluating raw at X=0.',
            'The fully reconstructed genuine left theorem identifies supported native1 with the locally zero smooth germ on the original open collar through Xminus, including every fixed mixed jet and inward eta endpoint convention.',
            'For Xminus<X<Xplus, supported native1 is exactly the same raw117045 and inherits its joint ordinary regularity. At Xplus use the right raw smooth germ just proved; for X>Xplus the wrapper is literally0.',
            'These are local statements on one common physical domain. Together they give every fixed mixed ordinary derivative of the original supported native1 on the positive radial interior and continuous right-axis/inward-eta endpoint jets on X>=0, eta in[-1,1].',
            'The original source endpoints are fixed, finite, eta-independent and satisfy0<Xminus<Xplus. Every fixed density jet is0 outside the same closed radial interval[Xminus,Xplus] and at its two endpoints. On every finite closed radial box times[-1,1], the existing fixed jets are continuous; compactness supplies a finite qualitative bound for each fixed derivative separately. No bound value, all-orders common constant or numerical norm is asserted.'
        ],
        'provedSupportedDensityConclusions': {
            'sameOriginalSupportedNative1Body': True,
            'genuineLeftJoinLocallyZero': True,
            'genuineRightJoinSameRawSmoothGerm': True,
            'allFixedMixedOrdinaryDerivativesOnPositiveRadialInterior': True,
            'axisRightJetsZeroFromLiteralZeroNeighborhood': True,
            'allFixedMixedJetsContinuousAtInwardEtaEndpoints': True,
            'allFixedJetsFiniteOnEveryFiniteClosedRadialBox': True,
            'everyFixedJetSupportedInOriginalClosedRadialInterval': True},
        'actualSourceBindingsComposed': True,
        'genuineLeftTheoremReconstructedFromSame18Inputs': True,
        'actualSupportedDensityOrdinaryRegularityProved': True,
        'qualitativeCompactJetFinitenessOnly': True,
        'actualTotalAxialMomentZeroProved': False,
        'forwardBackwardPrimitiveEqualityProved': False,
        'actualTzPrimitiveGluingProved': False,
        'literal517234BoundedPiecewiseIntegrabilityApplied': False,
        'originalConsumerIntegralDomainsDischarged': False,
        'originalCartesianGuardDomainsDischarged': False,
        'numericalNormHonestyProved': False,
        'wholeGOnJProved': False,
        'remainingContracts': [
            'Bind and discharge the original Cartesian-X guard domains and the original literal517234 finite-integral consumer applications.',
            'Prove the actual combined total axial moment and its required parameter identities before identifying forward/backward stress primitives and their joins.',
            'Prove actual numerical magnitude/norm bounds and original acceptance gates. Smooth supported density alone discharges none of these obligations.'
        ],
        'newOriginalGuardsDischarged': 0,
        'newOriginalJetsDischarged': 0,
        'newOriginalPDETermsDischarged': 0,
    }
    return copy.deepcopy(result)


def load_inputs(directory):
    data, hashes, sizes = {}, {}, {}
    for key, filename in INPUT_FILES.items():
        raw = (Path(directory)/filename).read_bytes()
        data[key] = json.loads(raw)
        hashes[key] = hashlib.sha256(raw).hexdigest()
        sizes[key] = len(raw)
    return data, hashes, sizes


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-dir', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args(argv)
    output = args.out.resolve()
    for filename in INPUT_FILES.values():
        original = (args.input_dir/filename).resolve()
        need(output != original and not (output.exists() and original.exists()
             and output.samefile(original)), 'Output must not overwrite an original proof input')
    result = compose(*load_inputs(args.input_dir))
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'actualSupportedNative1OrdinaryRegularity': True,
                      'actualStressPrimitiveGluing': False, 'newOriginalDischarged': 0}))


if __name__ == '__main__':
    main()
