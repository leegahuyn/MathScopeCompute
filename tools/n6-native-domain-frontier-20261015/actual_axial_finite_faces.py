"""Qualitative finite values of one ORIGINAL axial Cartesian face integral.

The supported density theorem is fully reconstructed from its20 inputs.
The literal517234 expression may jump at the radial guard: this application
does not identify it with a derivative of a globally glued stress primitive.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path

import actual_axial_density_regularity as density_proof
import actual_axial_raw_regularity as raw_proof
import actual_axial_face_binding as face_source
from actual_background_jet_regularity import ConstantDomains
from natural_domain_proof import canonical_sha


INPUT_FILES = {**density_proof.INPUT_FILES,
    'density': 'ACTUAL_AXIAL_DENSITY_REGULARITY.json',
    'face-source': 'ACTUAL_AXIAL_FACE_BINDING.json'}
# Final standalone original-source probe, after25 adverse tests and genuine
# live-source comparison. This binds every source/comparator operand.
FACE_CANONICAL_PIN = '3abbc24ae5f943d220652f188d50e668fbde62ce4eb19a4b4f9d5c2d68f6cf37'
COUNTERS = density_proof.COUNTERS
ROOT = 517240
FACE_NODES = {
    '517175': {'op': 'multiply', 'args': [19, 517174]},
    '517174': {'op': 'add', 'args': [517128, 517173]},
    '517128': {'op': 'integer_power', 'args': [517015, 2]},
    '517173': {'op': 'integer_power', 'args': [517016, 2]},
    '517176': {'op': 'multiply', 'args': [24, 517175]},
    '517177': {'op': 'sqrt_positive', 'args': [517176]},
    '517218': {'op': 'actual_expression_partial', 'args': [1, [517175, 517017], [0, 1]]},
    '517221': {'op': 'actual_expression_partial', 'args': [1, [117055, 517017], [0, 1]]},
    '517227': {'op': 'actual_expression_partial', 'args': [1, [517175, 517017], [1, 1]]},
    '517222': {'op': 'definite_integral', 'args': [517221, 117055, 28814, 517175]},
    '517234': {'op': 'smooth_piecewise', 'args': [517175, 28814, 28824, 0, 517233, 0]},
    '517235': {'op': 'integer_power', 'args': [517234, 2]},
    '517236': {'op': 'add', 'args': [1, 517235]},
    '517237': {'op': 'sqrt_positive', 'args': [517236]},
    '517238': {'op': 'definite_integral', 'args': [517237, 517017, 20, 1]},
    '517239': {'op': 'definite_integral', 'args': [517238, 517016, 346574, 215514]},
    '517240': {'op': 'definite_integral', 'args': [517239, 517015, 346574, 215514]},
    '215514': {'op': 'sqrt_positive', 'args': [137008]},
    '137008': {'op': 'multiply', 'args': [24, 28826]},
    '346574': {'op': 'multiply', 'args': [20, 215514]},
    '19': {'op': 'rational', 'args': ['1', '2']},
    '20': {'op': 'rational', 'args': ['-1', '1']},
    '24': {'op': 'rational', 'args': ['2', '1']},
    '1': {'op': 'rational', 'args': ['1', '1']},
    '0': {'op': 'rational', 'args': ['0', '1']},
}
COORDINATES = {
    '517015': {'op': 'coordinate', 'args': ['physical_norm_face_7_0$28311']},
    '517016': {'op': 'coordinate', 'args': ['physical_norm_face_7_1$28312']},
    '517017': {'op': 'coordinate', 'args': ['physical_norm_face_7_2$28313']},
    '117055': {'op': 'coordinate', 'args': ['actual_n1_Tz_forward$286']},
}


def need(ok, message):
    if not ok:
        raise ValueError(message)


def same(left, right, message):
    density_proof.require_same(left, right, message)


def source_canonical_sha(value):
    # This original-DAG extractor explicitly sorts JSON keys; the inherited
    # density/Picard receipts use their separate insertion-order convention.
    return face_source.digest(face_source.canonical(value))


def source_nodes(receipt):
    """The final producer supplies one complete original-node dictionary."""
    return receipt.get('selectedSourceNodes', {})


def validate_density(data, hashes, sizes):
    keys = density_proof.INPUT_FILES
    expected = density_proof.compose({k: data[k] for k in keys},
                                     {k: hashes[k] for k in keys},
                                     {k: sizes[k] for k in keys})
    same(data['density'], expected,
         'The density theorem differs from the complete same20-input reconstruction')
    return expected


def validate_source(data):
    receipt = data['face-source']
    need(receipt.get('schema') == 'MathScope.N6.ActualAxialFaceBinding/1',
         'The original axial finite-face source binding is required')
    need(source_canonical_sha(receipt) == FACE_CANONICAL_PIN,
         'Changed complete original finite-face source/comparator receipt')
    for key, expected in [('sourceHeaderRecordSHA256', raw_proof.HEADER),
                          ('fixedDefinitionSHA256', raw_proof.FIXED),
                          ('stage3SHA256', face_source.algebra.STAGE3_SHA256)]:
        need(receipt.get(key) == expected, 'Mixed actual finite-face source identity: '+key)
    nodes = source_nodes(receipt)
    # The original-source producer independently fixes these exact records;
    # its immutable full83 cone and all endpoint/face records are compared
    # here too, not reduced to its sourceComparison=true metadata.
    same(nodes, face_source.expected_nodes(), 'Changed complete original face and endpoint node records')
    same(receipt.get('completeOriginalDerivativeCone'), face_source.algebra.EXPECTED_CONE,
         'Changed complete original83-node Cartesian derivative cone')
    same(receipt.get('faceAndEndpointSourceNodes'), face_source.EXPECTED_EXTRA_NODES,
         'Changed exact original finite-face endpoint/selector source records')
    need(receipt.get('sourceConeNodeCount') == 83 and
         receipt.get('sourceConeCanonicalSHA256') == face_source.CONE_SHA256 and
         receipt.get('selectedSourceNodesCanonicalSHA256') == source_canonical_sha(nodes),
         'Changed complete finite-face source graph identity')
    for ident, expected in {**FACE_NODES, **COORDINATES}.items():
        same(nodes.get(ident), expected, 'Changed original face node/binder '+ident)
    same(receipt.get('sourceComparison'), {
        'actualNodeCountCompared': len(nodes), 'everySelectedNodeStructurallyEqual': True,
        'fullSourceArchiveAuthenticatedByThisTool': False,
        'requiredInheritedAuthentication': 'same original complete gzip/raw/parent stream under pinned Stage3'},
        'The focused finite-face source proof changed its authentication boundary')
    same(receipt.get('actualGuard'), {'node': 517234, 'sourceNode': FACE_NODES['517234'],
        'coordinate': 517175, 'left': 28814, 'right': 28824},
        'Changed original positive axial Cartesian guard')
    same(receipt.get('actualCartesianCoordinates'), {
        'x1': 517015, 'x2': 517016, 'eta': 517017, 'X': 517175,
        'XFormula': '(x1^2+x2^2)/2', 'r': 517177, 'rFormula': 'sqrt(2X)',
        'orderedDerivative': [517015, 517016, 517017]},
        'Changed actual Cartesian coordinates or original derivative ordering')
    same(receipt.get('actualNative1Calls'), [
        {'node': i, 'registry': 'expression:1', 'arguments': FACE_NODES[str(i)]['args'][1],
         'orders': FACE_NODES[str(i)]['args'][2],
         'lexicalScope': [517015, 517016, 517017]+([117055] if i == 517221 else [])}
        for i in [517218, 517221, 517227]],
        'Changed genuine native1 Cartesian/bound-coordinate argument tuples')
    same(receipt.get('native1DefinitionReference'), {
        'registry': 'expression:1', 'parameters': [4756, 2], 'body': 117047,
        'sourceWrapper': data['density']['actualOriginalDensity']['literalWrapper'],
        'definitionAssociationRequiresAcceptedDensityReceipt': True,
        'finiteOrdinaryNativeValuesProvedHere': False},
        'The original native1 body is not associated with the same accepted supported density')
    same(receipt.get('actualRadialPrimitive'), {
        'node': 517222, 'sourceNode': FACE_NODES['517222'], 'binder': 117055,
        'lower': 28814, 'upper': 517175, 'bodyCall': 517221, 'orders': [0, 1],
        'intervalConvention': 'oriented integral from a to Cartesian X; no widened interval'},
        'Changed actual radial primitive binder or moving-endpoint scope')
    same(receipt.get('actualFaceIntegrals'), face_source.face_scopes(),
         'Changed original four exact integral lexical scopes')
    same(receipt.get('actualFiniteFaceBox'), {
        'coordinates': [517015, 517016, 517017],
        'coordinateSourceNodes': {str(i): COORDINATES[str(i)] for i in [517015, 517016, 517017]},
        'bounds': [[346574, 215514], [346574, 215514], [20, 1]],
        'radiusNode': 215514, 'radiusSquareNode': 137008, 'Xb': 28826,
        'radiusFormula': 'sqrt(2*Xb)',
        'boxFormula': '[-sqrt(2*Xb),sqrt(2*Xb)]^2 x [-1,1]',
        'finitePositiveRadiusRequiresActualConstantProof': True, 'coordinateBoxWidened': False},
        'Changed actual finite Cartesian face box or its positive-radius premise')
    same(receipt.get('actualPositiveFaceIntegrand'), {
        'node': 517237, 'formula': 'sqrt(1+E^2)', 'E': 517234,
        'sourceNodes': {str(i): FACE_NODES[str(i)] for i in [517235, 517236, 517237]},
        'conditionalLowerBound': 'sqrt(1+E^2)>=1 for every finite real actual E'},
        'Changed actual positive face radical or its conditional finite-operand premise')
    same(receipt.get('actualSelectorAncestry'), {
        'root': 617466, 'face': 517240, 'path': face_source.SELECTOR_PATH,
        'pathSourceNodes': {str(i): nodes[str(i)] for i in face_source.SELECTOR_PATH},
        'otherAncestorsOmittedFromThisFocusedBinding': True},
        'Changed exact original face-to-selector ancestry')
    for key in ['actualFaceFinitenessProvedHere', 'actualNativeDerivativeExistenceProvedHere',
                'actualAnalyticCompositionApplied', 'actualFaceContinuityProvedHere',
                'actualStressPrimitiveJoinsProvedHere', 'actualTotalAxialMomentZeroProvedHere',
                'numericalNormHonestyProvedHere', 'originalBackground26ClosureProved',
                'wholeGOnJProved', 'sourceDefinitionsConstantsQuantifiersAndOrderedDerivativesChanged']:
        need(receipt.get(key) is False, 'The focused source binding preclaimed an analytic result: '+key)
    for key in COUNTERS:
        need(type(receipt.get(key)) is int and receipt[key] == 0,
             'The focused source binding promoted an original obligation')
    return receipt, nodes


def original_active_algebra(nodes):
    """Independent exact rational reconstruction AFTER inverse domains.

    r denotes the positive source radical, not an independent unproved
    square-root cancellation. All original active operands are traversed.
    """
    import sympy as sp
    x, y, r, ge, gxe, integral = sp.symbols('x y r ge gxe integral', real=True)
    atoms = {517015: x, 517016: y, 517177: r,
             517218: ge, 517227: gxe, 517222: integral}
    visited = set()

    def at(i):
        visited.add(i)
        if i in atoms:
            return atoms[i]
        n = nodes[str(i)]
        op, args = n['op'], n['args']
        if op == 'rational':
            return sp.Rational(int(args[0]), int(args[1]))
        if op == 'add':
            return sum(at(j) for j in args)
        if op == 'multiply':
            return sp.prod(at(j) for j in args)
        if op == 'inverse':
            return 1/at(args[0])
        if op == 'integer_power':
            return at(args[0])**args[1]
        raise ValueError('Unreviewed original active arithmetic '+str((i, op)))

    actual = at(517233)
    expected = x*y*(2*ge/r**3-3*integral/r**5-gxe/r)
    need(sp.cancel(actual-expected) == 0, 'Changed exact original active face formula')
    wrong = x*y*(2*ge/r**3-2*integral/r**5-gxe/r)
    need(sp.cancel(actual-wrong) != 0, 'The missing-integral-coefficient control failed')
    return {'schema': 'MathScope.N6.ActualAxialFaceRationalIdentity/1',
            'actualRoot': 517233,
            'formula': 'E=x*y*(2*g_eta/r^3-3*I_eta/r^5-g_Xeta/r)',
            'I_eta': 'integral_a^X g_eta(s,eta) ds',
            'radialIdentity': 'r^2=2*X=x^2+y^2; r>0 on the active guard',
            'exactRationalResidual': '0',
            'wrongIntegralCoefficientResidualNonzero': True,
            'visitedActiveArithmeticNodes': sorted(visited),
            'arithmeticAppliedOnlyAfterAllActivePrimitiveDomains': True}


def original_box_constants(data, nodes):
    parameters = data['diagnostics']['fullNativePayloads']['fixed']['source']['parametersExactExpressions']
    constants = ConstantDomains(lambda i: nodes[str(i)], parameters)
    a, b, xb, radius, negative_radius = [constants.at(i) for i in
                                        [28814, 28824, 28826, 215514, 346574]]
    need(all(v.strict_positive for v in [a, b, xb, radius]) and
         negative_radius.strict_negative,
         'Actual positive finite annulus and Cartesian face endpoints required')
    return {'Xminus': 28814, 'Xplus': 28824, 'faceXb': 28826,
            'faceRadius': 215514, 'negativeFaceRadius': 346574,
            'radiusFormula': 'R=sqrt(2*Xb)>0',
            'allFixedSourceConstantsFinite': True,
            'originalEndpointDomainChecks': constants.domains,
            'actualUsedSourceNodes': sorted(constants.used)}


def compose(data, hashes, sizes):
    for key in INPUT_FILES:
        need(key in data and key in hashes and key in sizes and
             type(sizes[key]) is int and sizes[key] > 0,
             'Missing original finite-face proof input: '+key)
    density = validate_density(data, hashes, sizes)
    source, nodes = validate_source(data)
    constants = original_box_constants(data, nodes)
    algebra = original_active_algebra(nodes)
    result = {
        'schema': 'MathScope.N6.ActualAxialFiniteFaces/1',
        'sourceHeaderSHA256': raw_proof.HEADER,
        'fixedDefinitionSHA256': raw_proof.FIXED,
        'sourcePaperSHA256': raw_proof.PAPER,
        'inputBindings': {k: {'sha256': hashes[k], 'bytes': sizes[k]} for k in INPUT_FILES},
        'sourceBindingCanonicalSHA256': FACE_CANONICAL_PIN,
        'sameDensityTheoremReconstructedFrom20Inputs': True,
        'sameNative1': density['actualOriginalDensity'],
        'actualOrdinaryNativeApplications': [
            {'node': i, 'sourceCall': FACE_NODES[str(i)],
             'definitionSHA256': raw_proof.DENSITY_PIN,
             'mathematicalPartialOfSameSupportedDensity': True,
             'withinUnchangedSerializedDerivativeLimits': True}
            for i in [517218, 517221, 517227]],
        'actualPhysicalDomain': {
            'CartesianCoordinates': [517015, 517016], 'etaCoordinate': 517017,
            'physicalEta': [-1, 1], 'etaEndpointConvention': 'continuous inward fixed jets',
            'radialCoordinate': 517175, 'radialFormula': 'X=(x^2+y^2)/2>=0',
            'activeGuard': '0<a=Xminus<X<Xplus=b',
            'exteriorEvaluation': 'Select the literal zero exterior before any inverse/radical active operand is evaluated.',
            'rawOrRadialInverseEvaluatedAtAxis': False},
        'actualBox': constants,
        'actualActiveSourceAlgebra': algebra,
        'actualInnerIntegral': {
            'node': 517222, 'sourceNode': FACE_NODES['517222'],
            'binder': 117055, 'integrandCall': 517221,
            'endpointsEvaluatedOutsideNewBinderScope': True,
            'lexicalBinderShadowsOnlyIntegralBody': True,
            'activeOrientation': 'a<X<b',
            'continuousIntegrandOnActualFiniteClosedInterval': True,
            'qualitativeBound': '|I_eta(X,eta)|<=(b-a)*M_eta',
            'noStressPrimitiveJoinUsed': True},
        'boundedPiecewiseArgument': [
            'The reconstructed genuine supported native1 has continuous g_eta and g_Xeta on [a,b] times the physical eta interval[-1,1], with inward eta endpoint jets. Compactness gives finite qualitative constants M_eta and M_Xeta for these SAME ordinary partials.',
            'Select the original lazy wrapper517234 first. If X<=a or X>=b its source branch is exactly0, including the Cartesian axis. The inverse radius and the inner integral in the unused middle branch are never evaluated there.',
            'On the active branch0<a<X<b, r=sqrt(2X)>=rmin=sqrt(2a)>0, |x*y|<=X<b, and the actual binder117055 ranges over[a,X] contained in[a,b]. Every actual native argument is in its genuine density domain and each active inverse has a strictly positive denominator before rational simplification.',
            'The exact original source algebra gives E=x*y*(2*g_eta/r^3-3*I_eta/r^5-g_Xeta/r), hence |E|<=C=b*(2*M_eta/rmin^3+3*(b-a)*M_eta/rmin^5+M_Xeta/rmin)<infinity. This is a qualitative existence bound, with no numerical magnitude assertion.',
            'The literal E may jump on the two guard cylinders X=a or X=b. It is bounded and jointly continuous away from those cylinders, hence measurable; all values on the cylinders are the literal0. No continuity of E across them, stress primitive gluing or vanishing total moment is asserted.'
        ],
        'exactNestedIntegralArgument': [
            'H517237=sqrt(1+E517234^2) satisfies1<=H<=sqrt(1+C^2)=Hmax. In particular the exterior H is1, so finiteness uses the original finite face box rather than compact support of H.',
            'At every fixed(x,y), the eta slice of H is continuous on[-1,1]: off a guard cylinder this uses the genuine inward density jets and the finite parameter integral; on a guard cylinder the literal branch is H=1 for all eta. Thus the exact inner Riemann integral517238 exists with2<=K(x,y)<=2*Hmax.',
            'K is continuous off the circles x^2+y^2=2a and2b by bounded dominated convergence in eta. For each fixed x, these equations have at most four y solutions. Consequently the bounded middle y slice has at most four discontinuities and is Riemann integrable over the original[-R,R].',
            'For every fixed x0, the exceptional y values on those circles form a finite set; K(x,y) converges to K(x0,y) at all remaining y as x tends to x0. The uniform bound2*Hmax and bounded dominated convergence show the middle integral L(x) is continuous. Therefore its original outer Riemann integral517240 exists on[-R,R].',
            'With R=sqrt(2Xb)>0, the three original interval lengths are2,2R,2R. Hence16*Xb=8*R^2<=face517240<=16*Xb*Hmax<infinity. This proves a strictly positive finite scalar, with no certified numerical upper bound or equality to a genuine stress derivative norm.'
        ],
        'actualNestedFace': {
            'nodes': [517238, 517239, 517240],
            'sourceNodes': {str(i): FACE_NODES[str(i)] for i in [517238, 517239, 517240]},
            'orderedBinders': [517017, 517016, 517015],
            'closedEta': [-1, 1], 'CartesianEndpointNodes': [346574, 215514],
            'integralConvention': 'All three literal nested Riemann integrals exist; the same bounded functions also have finite Lebesgue integrals.',
            'qualitativeBounds': '16*Xb<=face517240<=16*Xb*sqrt(1+C^2)<infinity',
            'piecewiseOnlyIntermediateContinuityPromoted': False},
        'optInApplication': {'sourceNode': ROOT, 'sourceCallSHA256': canonical_sha(FACE_NODES[str(ROOT)]),
            'allowedEnvironment': [], 'fullLiveSourceNodesCheckedAtApplication': True,
            'onlyExactCompleteConstantFaceAccepted': True,
            'genericConstantDomainsIntegralContinuityAssumed': False},
        'provedFiniteFaceConclusions': {
            'sameOriginalSupportedNative1OrdinaryPartialsApplied': True,
            'literalGuardSelectedBeforeSingularActiveOperands': True,
            'literal517222ContinuousFiniteParameterIntegral': True,
            'literal517234BoundedPiecewiseMeasurable': True,
            'allThreeOriginalNestedRiemannIntegralsExist': True,
            'literal517240StrictlyPositiveFiniteScalar': True},
        'actualSourceBindingsComposed': True,
        'literal517234BoundedPiecewiseIntegrabilityApplied': True,
        'originalExactFace517240QualitativeFinitenessProved': True,
        'actualTotalAxialMomentZeroProved': False,
        'forwardBackwardPrimitiveEqualityProved': False,
        'actualTzPrimitiveGluingProved': False,
        'genuineTzCartesianDerivativeIdentified': False,
        'originalConsumerIntegralDomainsDischarged': False,
        'originalCartesianGuardDomainsDischarged': False,
        'allNineOriginalBackgroundBodiesProved': False,
        'all26OrderedBackgroundRequestsAccepted': False,
        'numericalNormHonestyProved': False,
        'wholeGOnJProved': False,
        **{key: 0 for key in COUNTERS}}
    return copy.deepcopy(result)


def load_inputs(directory):
    data, hashes, sizes = {}, {}, {}
    for key, filename in INPUT_FILES.items():
        raw = (Path(directory)/filename).read_bytes()
        data[key] = json.loads(raw)
        hashes[key] = hashlib.sha256(raw).hexdigest()
        sizes[key] = len(raw)
    return data, hashes, sizes


def make_finite_face_application(get, input_dir, Bound):
    """Opt in only for this exact complete scalar at its empty lexical scope.

    Public receipt/application copies are evidence for the caller; mutation of
    them never changes the privately reconstructed theorem or live source pin.
    """
    inputs = load_inputs(input_dir)
    theorem = compose(*inputs)
    nodes = copy.deepcopy(source_nodes(inputs[0]['face-source']))
    parameters = copy.deepcopy(inputs[0]['diagnostics']['fullNativePayloads']['fixed']['source']['parametersExactExpressions'])
    applied = []

    def application(constants, node_id, node, environment):
        if node_id != ROOT:
            return None
        need(not environment, 'The exact complete axial face requires an empty lexical environment')
        same(node, FACE_NODES[str(ROOT)], 'Changed actual complete finite-face call')
        same(constants.parameters, parameters,
             'The ConstantDomains fixed parameter expressions differ from the actual density theorem')
        for ident, expected in nodes.items():
            same(get(int(ident)), expected, 'Changed live original finite-face source node '+ident)
            same(constants.get(int(ident)), expected,
                 'The ConstantDomains source differs from the authenticated live face '+ident)
        witness = {'node': ROOT, 'operation': 'source_bound_piecewise_finite_face_integral',
            'actualSourceCallSHA256': canonical_sha(FACE_NODES[str(ROOT)]),
            'theoremSchema': theorem['schema'], 'theoremInputBindings': theorem['inputBindings'],
            'sourceBindingCanonicalSHA256': FACE_CANONICAL_PIN,
            'allActualScopedPrimitiveDomainsChecked': True,
            'allOriginalBindersAndFiniteEndpointSourcesChecked': True,
            'boundedPiecewiseMeasurableOnOriginalFiniteBox': True,
            'allThreeOriginalNestedRiemannIntegralsExist': True,
            'finiteStrictlyPositiveScalar': True,
            'continuousOnFiniteClosedIntervalClaimed': False,
            'stressDerivativeOrNumericalNormEqualityClaimed': False,
            'proved': True}
        constants.domains.append(copy.deepcopy(witness))
        applied.append(copy.deepcopy(witness))
        application.applications = copy.deepcopy(applied)
        return Bound(0, None, True)

    application.receipt = copy.deepcopy(theorem)
    application.applications = []
    return application


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-dir', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args(argv)
    output = args.out.resolve()
    for filename in INPUT_FILES.values():
        original = (args.input_dir/filename).resolve()
        need(output != original and not(output.exists() and original.exists() and output.samefile(original)),
             'Output must not overwrite an original proof input')
    result = compose(*load_inputs(args.input_dir))
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'actualOriginalFace517240FinitePositive': True,
                      'actualStressDerivativeNormIdentified': False,
                      'newOriginalDischarged': 0}))


if __name__ == '__main__':
    main()
