"""Apply the original Picard theorem to the axial density's LEFT collar only.

This consumer replays the accepted nine-input Picard composition, authenticates
the original raw residual and both collar probes, and supplies the ordinary
calculus argument between them.  It does not prove a total moment, a right
join, a global density theorem, a numerical norm or an original obligation.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path

import sympy as S

import actual_axial_raw_regularity as raw_proof
import picard_regularity_composition as picard_proof
from natural_domain_proof import canonical_sha


INPUT_FILES = {
    'binding': 'ACTUAL_AXIAL_STRESS_SOURCE_BINDING.json',
    'raw-regularity': 'ACTUAL_AXIAL_RAW_REGULARITY.json',
    'leading': 'ACTUAL_COMPLETED_LEADING_DOMAINS.json',
    'orderone': 'ACTUAL_ORDER_ONE_GLOBAL_REGULARITY.json',
    'orderone-binding': 'ACTUAL_ORDER_ONE_PRIMITIVE_BINDING.json',
    'leading-collar': 'ACTUAL_LEADING_INNER_COLLAR.json',
    'average-collar': 'ACTUAL_PICARD_AVERAGE_COLLAR.json',
    'picard': 'ACTUAL_PICARD_REGULARITY_COMPOSITION.json',
    'diagnostics': 'NATIVE_DOMAIN_DIAGNOSTICS.json',
}
PICARD_FILES = {
    'domains': 'PICARD_DOMAIN_PROOF.json',
    'lineage': 'PICARD_INTERFACE_LINEAGE.json',
    'structure': 'ACTUAL_PICARD_STRUCTURE.json',
    'natural_binding': 'ACTUAL_NATURAL_KERNEL_BINDING.json',
    'majorant': 'ACTUAL_NATURAL_MAJORANT.json',
    'b26_binding': 'ACTUAL_NATURAL_B26_BINDING.json',
    'b26_identity': 'ACTUAL_NATURAL_B26_IDENTITY.json',
    'parity': 'ACTUAL_PICARD_PARITY.json',
    'leading_binding': 'ACTUAL_PICARD_LEADING_BINDING.json',
}
INPUT_FILES.update({'picard-'+key: value for key, value in PICARD_FILES.items()})
RAW_KEYS = ['binding', 'leading', 'orderone', 'orderone-binding', 'diagnostics']
COLLAR = {
    'left': 'Xa*exp(t1/256)', 'right': 'Xa*exp(3*t1/256)',
    'contains': 'Xminus=Xa*exp(t1/128)',
    'containment': 'Xa<left<Xminus<right<Xkeep<aSquared<loopILeft<1',
}
LEADING_COLLAR_CANONICAL_PIN = 'b9364d74b9e163fa728d236b8e15f640a74f04ee864d081c5334374aac72609f'
AVERAGE_COLLAR_CANONICAL_PIN = 'f2568c58523141badf838d6dc5239725d67fde05d4ac219b565920dee7c32dbe'
INNER_PDE_CANONICAL_PIN = 'a5dc42b7009cac979b451fbffc70dfcceb5d0e0f4b5184da95e1ffa287293183'
PREFIX_PIN = 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116'
SOURCE_BASE = 'research-ide/mathscope-m2/navier/'
COLLAR_SOURCE_PINS = {SOURCE_BASE+name: value for name, value in {
    'actual-continuation-exact-stress.mjs': '22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2',
    'actual-continuation-exact-inner.mjs': '3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
    'actual-continuation-exact-order-one.mjs': 'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
    'actual-continuation-exact-global.mjs': '497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f',
    'actual-continuation-exact-b8.mjs': '1e0d6586a60ee5aa3d5315c40f624ebb9e8a4925a00117818d41d6697fc67baf',
    'actual-continuation-exact-pregluing.mjs': '7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3',
    'actual-continuation-exact-functions.mjs': '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
    'actual-global-source-expressions.mjs': 'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
    'actual-global-primitive-kernels.mjs': 'efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59',
}.items()}
PICARD_W = list(range(26746, 26752))
PICARD_WE = [28804, 28805, 117101, 28806, 117102, 117103]
FORCING = [0, 0, 0, 26395, 26694, 26744]


def need(value, message):
    if not value:
        raise ValueError(message)


def same(left, right):
    """Type-sensitive JSON equality, including false versus the source node 0."""
    return json.dumps(left, sort_keys=True, separators=(',', ':')) == json.dumps(
        right, sort_keys=True, separators=(',', ':'))


def require_same(left, right, message):
    need(same(left, right), message)


def source_files(receipt, expected, message):
    rows = receipt.get('sourceFiles', [])
    need(isinstance(rows, list) and all(isinstance(row, dict) for row in rows), message)
    pins = {row.get('path'): row.get('sha256') for row in rows}
    need(len(rows) == len(pins) and pins == expected, message)


def validate_picard(data, hashes, sizes):
    """Re-execute every original composition premise and its byte chain."""
    inputs = {key: data['picard-'+key] for key in PICARD_FILES}
    bindings = {key: {'sha256': hashes['picard-'+key], 'bytes': sizes['picard-'+key]}
                for key in PICARD_FILES}
    for key, pin in {'majorant': picard_proof.MAJORANT,
                     'natural_binding': picard_proof.NATURAL,
                     'b26_binding': picard_proof.B26}.items():
        need(bindings[key]['sha256'] == pin, 'Changed exact original Picard input bytes: '+key)
    need(inputs['lineage'].get('domainPrerequisiteSHA256') == bindings['domains']['sha256'],
         'Picard lineage uses a different original domain proof')
    reconstructed = picard_proof.compose(inputs)
    reconstructed['inputBindings'] = bindings
    require_same(data['picard'], reconstructed,
                 'Accepted Picard receipt differs from the full nine-input reconstruction')
    need(data['orderone'].get('inputSHA256', {}).get('picard') == hashes['picard'],
         'Order-one regularity uses a different accepted Picard receipt')
    system = data['diagnostics'].get('fullNativePayloads', {}).get('picard:0', {})
    need(canonical_sha(system) == picard_proof.SYSTEM,
         'The actual complete Picard0 definition changed')
    need(canonical_sha(data['diagnostics']['fullNativePayloads']['fixed']) == picard_proof.FIXED,
         'The actual complete fixed definition changed')
    require_same(system.get('diagonal'), [0, 0, 2, 0, 3, 1], 'Changed original Picard diagonal')
    require_same(system.get('zeroAxisDatum'), [0]*6, 'Changed actual zero-axis data')
    require_same(system.get('forcing'), FORCING, 'Changed actual full known forcing')
    require_same(system.get('radialDomain'), [0, 24806], 'A narrowed collar cannot replace the full Picard radial domain')
    require_same(system.get('sourceLeading'), {'F0': 25601, 'U0': 25638,
                 'v0': 25637, 'omega0OverX': 26393}, 'Changed original inner leading representatives')
    need(system.get('xi') == 25516 and system.get('eta') == 2 and
         system.get('order') == 1 and system.get('leadingReferenceSubstitution') is False and
         system.get('callerSuppliedForcing') is False, 'Different actual Picard coordinates/source')
    for row, expected in [(1, [0, 0, 0, 0, 0, 1]), (2, [0, 0, 0, 0, 0, 20]),
                          (3, [25602, 0, 0, 0, 0, 0])]:
        require_same(system['A0'][row], expected, 'Changed actual U/K/pressure Picard row')
        require_same(system['A1'][row], [0]*6, 'Changed actual U/K/pressure derivative row')
    graph = data['diagnostics']['argumentAndContextGraph']
    for key, expected in {'25516': {'op': 'coordinate', 'args': ['actual_inner_xi']},
                          '25577': {'op': 'multiply', 'args': [24, 25516]},
                          '24806': {'op': 'sqrt_positive', 'args': [24805]},
                          '8': {'op': 'source_parameter', 'args': ['lambda']},
                          '474': {'op': 'rational', 'args': ['4', '1']},
                          '50': {'op': 'rational', 'args': ['-1', '2']},
                          '25517': {'op': 'multiply', 'args': [474, 25516]},
                          '25602': {'op': 'multiply', 'args': [25517, 25601]},
                          '26394': {'op': 'multiply', 'args': [50, 26393]},
                          '26395': {'op': 'multiply', 'args': [25577, 26394]}}.items():
        require_same(graph.get(key), expected, 'Changed actual denominator/domain/outer-lambda source node '+key)
    return reconstructed, system


def validate_leading_collar(data):
    collar = data['leading-collar']
    need(canonical_sha(collar) == LEADING_COLLAR_CANONICAL_PIN,
         'Changed complete original leading-collar source receipt')
    need(collar.get('schema') == 'MathScope.N6.ActualLeadingInnerCollar/1' and
         collar.get('sourceHeaderSHA256') == raw_proof.HEADER and
         collar.get('fixedDefinitionSHA256') == raw_proof.FIXED and
         collar.get('sourcePaperSHA256') == raw_proof.PAPER and
         collar.get('diagnosticsSHA256') == raw_proof.DIAGNOSTICS,
         'Different actual leading collar source')
    source_files(collar, COLLAR_SOURCE_PINS, 'Changed original leading collar producer pins')
    require_same(collar.get('actualOriginalRoots'), {'globalU': 9236, 'globalM': 9239,
                 'globalMeta': 18767, 'globalv': 18778, 'innerU': 24858, 'innerv': 24914},
                 'Changed original leading collar roots')
    require_same(collar.get('ordering', {}).get('openCollar'), COLLAR,
                 'The original open collar changed')
    need(collar.get('originalPrefixNodeCount') == 117100 and
         collar.get('originalPrefixSHA256') == PREFIX_PIN,
         'Mixed original leading-collar graph prefix')
    return collar


def validate_inner_pde(data, system):
    pde = data['binding'].get('actualInnerPDE', {})
    need(canonical_sha(pde) == INNER_PDE_CANONICAL_PIN,
         'Changed full six-check original Picard-to-PDE arithmetic receipt')
    require_same(pde.get('stateRoots'), PICARD_W, 'Different actual Picard solution states')
    require_same(pde.get('stateEtaRoots'), PICARD_WE, 'Different actual Picard eta states')
    require_same(pde.get('actualForcing'), system['forcing'], 'Inner PDE omits or changes actual forcing')
    need(pde.get('schema') == 'MathScope.ActualInnerPDEIdentity/1' and
         pde.get('order') == 1 and pde.get('system') == 0 and
         pde.get('commonASquared') == 24805, 'Different actual inner PDE source/domain')
    checks = pde.get('checks', {})
    need(set(checks) == {'FDerivative', 'UDerivative', 'average', 'pressure', 'angular', 'axial'},
         'All six original Picard/PDE identities are required')
    for key, row in checks.items():
        need(row.get('schema') == 'MathScope.ActualGraphRationalIdentity/1' and
             row.get('pass') is True and row.get('numeratorMonomials') == 0 and
             row.get('analyticOperandsReplacedByNumericalValues') is False and
             row.get('nonzeroDenominatorProofRequired') is True,
             'Unproved original source arithmetic identity: '+key)
        need(row.get('sourceAtomicNodes', [])[:6] == PICARD_W and
             row.get('sourceAtomicNodes', [])[6:12] == PICARD_WE,
             'Different state operands in original PDE arithmetic')
    require_same(checks['axial'].get('denominatorOperands'), [28, 25577],
                 'Changed original axial denominator-clearing obligations')
    require_same(checks['average'].get('denominatorOperands'), [25516],
                 'Changed genuine average denominator obligation')
    return pde


def ordinary_chain_calculus():
    """Independent exact X=xi^2 conversion, only at xi>0."""
    xi = S.Symbol('xi', positive=True)
    U, K, W5, rhs5, F0, F, omega = S.symbols('U K W5 rhs5 F0 F omegaOverX', real=True)
    ux = W5/(2*xi)
    uxx = (rhs5-W5/xi)/(4*xi**2)-W5/(4*xi**3)
    average = S.cancel((2*xi*(U+K)+xi**2*(W5-W5-2*K/xi))/(2*xi)-U)
    viscosity = S.cancel(-2*(xi**2*uxx+ux)+rhs5/2)
    rhs3 = 4*xi*F0*F-xi*omega
    pressure = S.cancel(rhs3/(2*xi)-(2*F0*F-omega/2))
    need(average == viscosity == pressure == 0, 'Ordinary-X/xi chain rule failed')
    return {
        'coordinate': 'X=xi^2; xi=sqrt(X)>0 on C',
        'U_X': 'W5/(2*xi)',
        'U_XX': '(rhs5-W5/xi)/(4*xi^2)-W5/(4*xi^3)',
        'originalDiagonalFive': 1,
        'W5Equation': 'partial_xi W5 + W5/xi = rhs5',
        'axialViscosity': '-2*(X*U_XX+U_X)=-rhs5/2',
        'Pi_X': 'rhs3/(2*xi)',
        'actualPressureRhs': 'rhs3=4*xi*F0*F-xi*omegaOverX',
        'actualPressureDensity': 'Pi_X=2*F0*F-omegaOverX/2',
        'exactChecks': {'genuineMassPrimitiveDerivative': str(average),
                        'axialViscosityChain': str(viscosity),
                        'pressureChain': str(pressure)},
        'axisDivisionUsed': False,
    }


def validate_average(data, system):
    """Bind original trees/rows; diagnostic appended IDs remain graph-local."""
    average = data['average-collar']
    need(average.get('schema') == 'MathScope.N6.ActualPicardAverageCollar/1',
         'Original Picard average collar source receipt required')
    # The standalone source producer is deterministic under its pinned
    # original options, source bytes and prefix. Bind its COMPLETE result,
    # including both comparator operands and genuine canonical forms. A
    # forged RHS accompanied by equal invented forms must never count as
    # an executed actual-source identity. No source-side paths/run IDs occur
    # in this receipt. The structural checks below explain its application.
    need(canonical_sha(average) == AVERAGE_COLLAR_CANONICAL_PIN,
         'Changed complete actual average source/comparator receipt')
    for key, expected in [('sourceHeaderSHA256', raw_proof.HEADER),
                          ('fixedDefinitionSHA256', raw_proof.FIXED),
                          ('sourcePaperSHA256', raw_proof.PAPER),
                          ('diagnosticsSHA256', raw_proof.DIAGNOSTICS),
                          ('actualPicardSHA256', picard_proof.SYSTEM)]:
        need(average.get(key) == expected, 'Mixed actual average source identity: '+key)
    source_files(average, {**COLLAR_SOURCE_PINS,
        SOURCE_BASE+'actual-continuation-exact-identities.mjs':
        'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712'},
        'Changed actual average producer source pins')
    require_same(average.get('originalConstructionOptions'),
                 {'terms': 0, 'bits': 128, 'heatIterations': 0},
                 'Different original average construction')
    need(average.get('originalPrefixNodeCount') == 117100 and
         average.get('originalPrefixSHA256') == PREFIX_PIN,
         'The original average source prefix changed')
    for key in ['originalSourcePrefixUnchanged', 'originalFunctionDefinitionsUnchanged',
                'sourceBytesUnchanged']:
        need(average.get(key) is True, 'Changed original average source: '+key)
    require_same(average.get('exactOriginalRoots'), {
        'average': 29336, 'literalAverage': 29332, 'averageEta': 29436,
        'literalAverageEta': 29343, 'U1': 29289, 'Pi1': 50558, 'v1': 29440,
        'innerU': 28835, 'innerPi': 50557, 'system': 0, 'xi': 25516,
        'X': 4756, 'eta': 2, 'lambda1': 25}, 'Changed original average/Picard profile roots')
    binding = average.get('actualAverageBinding', {})
    nodes = binding.get('sourceNodes', {})
    # This digest binds the complete literal original-node table, including
    # every integral binder/body/endpoint, branch and nu/outer-lambda node.
    # It contains no newly appended diagnostic node IDs.
    need(canonical_sha(nodes) == '187527f474c990e19165438f84c8e67a9f862287d9582583dd3499f9ce44ae86',
         'Changed original average source-node table')
    for key, value in [('sourceAverage', 29336), ('beforeXkeep', 29332),
                       ('integrandNode', 29331), ('binder', 29329),
                       ('radialProduct', 29330), ('massBefore', 29333)]:
        require_same(binding.get(key), value, 'Changed literal average binding: '+key)
    require_same(binding.get('literalIntegral'),
                 {'op': 'definite_integral', 'args': [29331, 29329, 0, 1]},
                 'The actual average lost its complete fixed t interval')
    require_same(binding.get('etaDerivative'), {
        'wholeAverage': 29436, 'literalIntegral': 29343, 'integrandNode': 29342,
        'fixedBoundsIndependentOfEta': True,
        'actualSourceDerivativeBindings': [
            {'source': 29336, 'coordinate': 2, 'derivative': 29436},
            {'source': 29332, 'coordinate': 2, 'derivative': 29343}]},
        'Changed genuine same-eta average derivative')
    rows = average.get('actualPicardRows', {})
    require_same(rows, {
        'system': 0, 'definitionSHA256': picard_proof.SYSTEM, 'xi': 25516,
        'eta': 2, 'order': 1, 'diagonal': system['diagonal'],
        'Urow': system['A0'][1], 'Krow': system['A0'][2],
        'A1U': system['A1'][1], 'A1K': system['A1'][2],
        'forcingU': system['forcing'][1], 'forcingK': system['forcing'][2],
        'zeroAxisDatum': system['zeroAxisDatum'], 'commonRadialDomain': [0, 24806],
        'commonASquared': 24805,
        'equations': ['partial_xi U=W5', 'partial_xi K=-2*K/xi-W5'],
        'allSourceRowsCompared': True, 'stateRoots': PICARD_W,
        'stateNodes': [{'op': 'actual_background_picard',
                        'args': [0, j, 25516, 2, 0]} for j in range(6)]},
        'Actual average rows do not match the full authenticated Picard0')
    require_same(average.get('collarOrdering'), data['leading-collar']['ordering'],
                 'Average and leading profiles use different source collars')
    ordering = average.get('positiveOrderOrdering', {})
    expected_parameters = data['diagnostics']['fullNativePayloads']['fixed']['source']['parametersExactExpressions']
    require_same(ordering.get('parameterExpressions'),
                 {key: expected_parameters[key] for key in ['X0Ipos', 'IposRight']},
                 'Changed actual positive-order endpoint definitions')
    for key, value in [('actualX0Ipos', 28987), ('actualIposRight', 28988),
                       ('actualLastU', 29328), ('lastUNormalizedRight', 29008)]:
        require_same(ordering.get(key), value, 'Changed actual positive endpoint: '+key)
    need(ordering.get('exactLastUFactor') == '(8193/4096)^2>1' and
         ordering.get('noNumericalEndpointEvaluation') is True,
         'Positive-order support ordering is missing')
    # All selected branches must be exactly the original before-Xkeep and
    # before-Ipos branches. No caller collar may enter an opaque integral.
    expected_restrictions = {
        'U1': (29289, 28835, [28839, 29268]),
        'Pi1': (50558, 50557, [50558]),
        'average': (29336, 29332, [29336]),
        'averageEta': (29436, 29343, [29436]),
        'M1': (29334, 29333, [29334]),
        'v1': (29440, None, [28839, 29268, 29336, 29436]),
    }
    restrictions = average.get('positiveOrderRestrictions', {})
    need(set(restrictions) == set(expected_restrictions), 'Missing actual positive collar restriction')
    for key, (root, reduced, selected_nodes) in expected_restrictions.items():
        row = restrictions[key]
        require_same(row.get('root'), root, 'Different original restriction root: '+key)
        if reduced is not None:
            require_same(row.get('reduced'), reduced, 'Different original profile restriction: '+key)
        require_same(row.get('domain'), COLLAR, 'A profile is restricted on a different collar')
        trace = row.get('trace', [])
        require_same([item.get('node') for item in trace], selected_nodes,
                     'Changed source branch restriction trace: '+key)
        for item in trace:
            source = nodes[str(item['node'])]
            require_same(item.get('sourceNode'), source, 'Changed retained positive branch')
            require_same(item.get('selectedRoot'), source['args'][3], 'Changed original branch selection')
            need(item.get('selected') == 'before', 'Unsupported positive collar branch')
        need(all(item.get('lexicalBodiesAndArgumentsNotRestricted') is True
                 for item in row.get('opaque', [])), 'Caller collar transported under an integral/native binder')
    identities = average.get('conditionalAverageIdentities', {})
    for key, left, eta_order in [('value', 29332, 0), ('eta', 29343, 1)]:
        row = identities.get(key, {})
        require_same(row.get('left'), left, 'Changed actual average identity left operand')
        terms = row.get('terms', [])
        need(isinstance(terms, list) and len(terms) == 2 and
             all(type(value) is int for value in terms), 'Missing actual U/K average terms')
        require_same(row.get('rightSourceNode'), {'op': 'add', 'args': terms},
                     'Changed genuine U+K sum')
        require_same(row.get('termSourceNodes'), [
            {'op': 'actual_background_even_profile', 'args': [0, j, 4756, 2, 0, eta_order]}
            for j in (1, 2)], 'Changed actual average component, eta or derivative order')
        if eta_order == 0:
            require_same(terms[0], 28835, 'The actual average no longer uses original U1')
    v = identities.get('v1', {})
    require_same(v.get('original'), 29440, 'Changed original v1 average reconstruction')
    require_same(v.get('restricted'), restrictions['v1'].get('reduced'), 'Mixed local v1 graph')
    require_same(v.get('inner'), v.get('conditionalReduced'), 'Actual average substitution did not recover inner v1')
    need(v.get('formula') == '[2*eta*U-2*eta*(D+nu)*(U+K)-d*partial_eta(U+K)]/L' and
         v.get('nu') == 25 and v.get('nuIdentity') == 'nu=2*h; distinct from outer lambda node8' and
         v.get('conditionalSourceSubstitutionOnly') is True,
         'Changed v1 coefficient, physical eta, or nu=2h normalization')
    require_same(v.get('substitutedAverageAtoms'), [29332, 29343],
                 'Conditional v1 rewrites more than the two genuine average atoms')
    checks = average.get('exactBodyChecks', {})
    expected_lefts = {'literalAverage': 29332, 'literalAverageEta': 29343,
                      'massBeforeXkeep': 29333, 'originalVFormula': 29440,
                      'localVFormula': v.get('restricted'), 'U1Inner': 28835,
                      'Pi1Inner': 50557, 'conditionalVTransfer': v.get('conditionalReduced')}
    need(set(checks) == set(expected_lefts), 'Missing actual average/profile body checks')
    for key, left in expected_lefts.items():
        row = checks[key]
        require_same(row.get('left'), left, 'Changed exact source-body left operand: '+key)
        forms = row.get('normalForms', [])
        need(row.get('schema') == 'MathScope.ExplicitPrimitiveBodyIdentity/1' and
             row.get('pass') is True and len(forms) == 2 and same(forms[0], forms[1]) and
             row.get('sourceValuesReplaced') is False and
             row.get('derivativeOrMomentIdentityAssumed') is False and
             row.get('boundNamesIgnored') is True,
             'Actual source body check replaced by a pass-only flag: '+key)
    require_same(checks['conditionalVTransfer'].get('right'), v.get('inner'),
                 'Conditional v transfer targets a different inner profile')
    generic = average.get('genericAverageIdentity', {})
    need(generic.get('schema') == 'MathScope.OriginalEvenAveragePrimitiveIdentity/1' and
         generic.get('sourceAuthenticated') is False and generic.get('pass') is True,
         'Generic algebra cannot authenticate actual profiles on its own')
    for key, rejected, monomials in [('check', False, 0), ('wrongSign', True, 1)]:
        check = generic.get(key, {})
        need(check.get('schema') == 'MathScope.ActualGraphRationalIdentity/1' and
             check.get('pass') is (not rejected) and check.get('numeratorMonomials') == monomials and
             check.get('analyticOperandsReplacedByNumericalValues') is False,
             'Missing exact generic average/sign control')
    required = average.get('requiredPicardRegularity', {})
    need(required.get('schema') == data['picard']['schema'] and
         required.get('actualPicardSHA256') == picard_proof.SYSTEM and
         required.get('actualFixedSHA256') == picard_proof.FIXED and
         required.get('radialDomain') == 'FULL 0<=X<=aSquared24805; not just the open Xminus collar' and
         required.get('parameterDomain') == 'actual common Picard eta neighborhood of [-1,1]; physical endpoint jets are inward',
         'Average calculus is outside the accepted full radial/parameter domain')
    required_conclusions = required.get('requiredSubkernelConclusions', {})
    need(set(required_conclusions) == {'actualPicardAllFixedMixedDerivativeNormalConvergence',
         'actualZeroAxisSingularODEViaRescaledIntegral', 'actualNativeEvenProfilesCInfinityOnZeroToASquared',
         'actualCoefficientCInfinityXiAndCommonEtaHolomorphy', 'actualSolutionParity'},
         'Incomplete actual Picard analytic prerequisites')
    for key, expected in required_conclusions.items():
        require_same(expected, data['picard']['provedSubkernelConclusions'].get(key),
                     'Unproved accepted Picard premise: '+key)
    for key in ['actualAnalyticCompositionApplied', 'actualAverageEqualityApplied',
                'rawAxialResidualZeroProvedHere', 'densityJoinsProvedHere',
                'actualTotalAxialMomentZeroProvedHere', 'TzPrimitiveGluingProvedHere', 'wholeGOnJProved']:
        need(average.get(key) is False, 'The source-only average probe promoted an analytic theorem: '+key)
    validate_even_interpretations(average, system)
    return average


def validate_even_interpretations(average, system):
    interpretation = average.get('evenProfileInterpretation', {})
    need(interpretation.get('sourceImplementation') ==
         SOURCE_BASE+'actual-continuation-exact-functions.mjs:materializePicardEvenDerivative' and
         interpretation.get('radialOrder') == 0 and interpretation.get('etaOrder') == 0 and
         interpretation.get('identity') == 'even_component(X,eta)=W_component(sqrt(X),eta)' and
         interpretation.get('genuineInfinitePicardOperations') is True and
         interpretation.get('displayedFiniteTermsUsed') is False,
         'Missing actual even-profile infinite Picard interpretation')
    rows = interpretation.get('sourceBindings', [])
    require_same([row.get('component') for row in rows], [1, 2, 3],
                 'The actual U, K and pressure even interpretations are all required')
    sqrt_nodes = set()
    for row in rows:
        component = row['component']
        require_same(row.get('evenSourceNode'), {'op': 'actual_background_even_profile',
                     'args': [0, component, 4756, 2, 0, 0]},
                     'Even interpretation uses a different actual component/eta')
        source = row.get('picardSourceNode', {})
        args = source.get('args', [])
        need(source.get('op') == 'actual_background_picard' and len(args) == 5 and
             same(args[:2], [0, component]) and same(args[3:], [2, 0]),
             'Even interpretation changed actual Picard component, eta or derivative')
        sqrt_nodes.add(args[2])
        if component in (1, 3):
            require_same(row.get('evenNode'), {1: 28835, 3: 50557}[component],
                         'Even interpretation is attached to a different original U/Pi body')
    need(len(sqrt_nodes) == 1, 'Mixed radial sqrt coordinates in actual even interpretation')
    # The probe supplies the literal sqrt node as well as the native call.
    require_same(interpretation.get('radialSourceNode'),
                 {'op': 'sqrt_positive', 'args': [4756]},
                 'A string assertion cannot replace the actual sqrt(X) source node')
    require_same(interpretation.get('radialNode'), next(iter(sqrt_nodes)),
                 'Even materialization uses a different radial source node')
    require_same(interpretation.get('sourceX'), 4756, 'Changed actual even-profile X coordinate')
    require_same(average.get('coordinateDerivativeInterpretation'), {
        'coordinateMap': 'X=xi^2',
        'positiveInterval': '0<X<aSquared and 0<xi<sqrt(aSquared)',
        'exactJacobian': 'dX/dxi=2*xi>0',
        'U': {'evenNode': 28835, 'sourceW5': 26751,
              'formula': 'partial_X U_even=W5/(2*xi)',
              'sourceEquation': 'partial_xi U=W5 from the bound actual U row'},
        'Pi': {'evenNode': 50557, 'sourceW3': 26749,
               'formula': 'partial_X Pi_even=rhs3/(2*xi)', 'diagonal': 0,
               'actualA0Row': system['A0'][3], 'actualA1Row': system['A1'][3],
               'actualForcing': 26395},
        'conditionedOnSameGenuinePicardODEAndSmoothness': True},
        'Ordinary-X/xi derivative interpretation is not bound to the actual U/pressure rows')


def compose(data, hashes, sizes):
    for key in INPUT_FILES:
        need(key in data and key in hashes and key in sizes and sizes[key] > 0,
             'Missing actual proof input: '+key)
    base_data, base_hashes = ({key: data[key] for key in RAW_KEYS},
                             {key: hashes[key] for key in RAW_KEYS})
    raw_proof.validate(base_data, base_hashes)
    require_same(data['raw-regularity'], raw_proof.compose(base_data, base_hashes),
                 'Raw residual regularity receipt differs from its actual source reconstruction')
    picard, system = validate_picard(data, hashes, sizes)
    leading_collar = validate_leading_collar(data)
    average = validate_average(data, system)
    inner_pde = validate_inner_pde(data, system)
    result = {
        'schema': 'MathScope.N6.ActualAxialLeftCollar/1',
        'sourceHeaderSHA256': raw_proof.HEADER,
        'fixedDefinitionSHA256': raw_proof.FIXED,
        'sourcePaperSHA256': raw_proof.PAPER,
        'actualPicardSHA256': picard_proof.SYSTEM,
        'inputBindings': {key: {'sha256': hashes[key], 'bytes': sizes[key]} for key in INPUT_FILES},
        'actualCollar': {'coordinate': 4756, 'etaCoordinate': 2,
                         'openRadialInterval': COLLAR, 'etaInterior': '-1<eta<1',
                         'inwardEtaEndpoints': [-1, 1], 'samePhysicalEtaUsed': True},
        'originalSourceRoots': {'rawAxial': 117045, 'supportedNative1': 117047,
                               'U0': 9236, 'v0': 18778, 'U1': 29289,
                               'v1': 29440, 'Pi1': 50558, 'actualAverage': 29332,
                               'PicardStates': PICARD_W, 'nu': 25, 'outerLambda': 8},
        'ordinaryChainCalculus': ordinary_chain_calculus(),
        'averageApplication': {
            'actualUAndKRowsUsed': [1, 2], 'sameZeroAxisDatum': [0]*6,
            'fullRadialDomainUsed': [0, 24805],
            'genuinePrimitive': 'partial_X[X*(U+K)]=U for X>0, by the actual U and K rows.',
            'axisConstant': 'The accepted even profiles and every fixed eta jet are bounded on compact sets through X=0. Hence X*(U+K) and each fixed eta jet tend to0. No 1/X or1/xi is evaluated at the axis.',
            'FTCAndChangeOfVariable': 'The same zero-axis primitive gives X*(U+K)=integral_0^X U(s,eta)ds. For X>0, s=tX gives U+K=integral_0^1 U(tX,eta)dt, with the original binder, parameter and normalization.',
            'fixedMixedDerivativeRule': 'partial_X^r partial_eta^s integral_0^1 U(tX,eta)dt = integral_0^1 t^r*(partial_X^r partial_eta^s U)(tX,eta)dt for each fixed nonnegative r,s.',
            'interchangeJustification': 'The reconstructed actual Picard normal convergence and even-profile C-infinity theorem apply on the complete0<=X<=aSquared24805 domain and a common eta neighborhood containing[-1,1]. On each compact subdomain every fixed derivative is continuous and bounded. All tX with0<=t<=1 stay in that same approved domain, so fixed-compact differentiation under the finite integral is valid.',
            'inwardEtaEndpoints': 'Prove the identities for-1<eta<1, then pass every fixed jet continuously to eta=+-1 using the accepted inward endpoint convention.',
            'average29332EqualsSamePicardUPlusK': True,
            'allExistingFixedMixedAverageJetsMatch': True,
        },
        'rawZeroApplication': [
            'The authenticated leading collar identifies the complete original U0,v0 with the same inner leading representatives on the open interval C.',
            'The source-bound positive U1 and Pi1 restrictions select their original before-Xkeep Picard branches. The genuine average identity and its eta derivative identify v1 with the exact same Picard reconstruction, preserving D+nu,d,L and nu=2h node25.',
            'Thus all five operands U0,v0,U1,v1,Pi1 agree with the inner solution on C times(-1,1), together with every fixed mixed derivative that appears in the raw eight-term formula.',
            'On C, xi=sqrt(X)>0 and L>7/8. Hence the actual denominators xi,2xi,L in the six source Picard-to-PDE checks are nonzero. The independent chain rule converts the original U/W5 and pressure rows to ordinary-X derivatives and converts radial axial viscosity to-rhs5/2.',
            'The unchanged six Picard rows with full forcing[0,0,0,26395,26694,26744] and state roots26746..26751 give the authenticated inner axial identity. The independently reconstructed eight original raw terms therefore have sum raw117045=0 everywhere on C times(-1,1).',
            'Joint raw smoothness on this open product implies every fixed mixed raw derivative is0 there. Continuity of each accepted fixed inward eta jet gives the same zero limits at eta=+-1.',
            'The original native1 wrapper is0 to the left of Xminus28814 and raw117045 to its right inside C. Both are identically0 on this neighborhood. Consequently only its LEFT join is locally the zero smooth function, with all fixed mixed jets0 and the original inward eta endpoint convention.',
        ],
        'provedLeftCollarConclusions': {
            'allFiveActualProfilesEqualInnerOnCommonCollar': True,
            'actualRaw117045IdenticallyZeroOnOpenCollar': True,
            'allFixedMixedRawJetsZeroOnOpenCollar': True,
            'allFixedInwardEtaEndpointRawJetsZero': True,
            'supportedNative1LeftJoinLocallyZero': True,
        },
        'actualSourceBindingsComposed': True,
        'actualPicardRegularityReconstructedFromAllNineInputs': True,
        'regularityOfActualDensityGloballyProved': False,
        'supportedDensityRightJoinProved': False,
        'actualTotalAxialMomentZeroProved': False,
        'forwardBackwardPrimitiveEqualityProved': False,
        'actualTzPrimitiveGluingProved': False,
        'boundedPiecewiseIntegrabilityProved': False,
        'numericalNormHonestyProved': False,
        'wholeGOnJProved': False,
        'remainingContracts': [
            'The supported density right join and its ordinary derivatives at Xplus.',
            'The actual combined axial mass/pressure-flux moment, required integral/parameter derivative interchanges, and forward/backward stress primitive gluing.',
            'Original Cartesian guards, finite integrals, quantitative numerical norm bounds and acceptance gates.',
        ],
        'newOriginalGuardsDischarged': 0, 'newOriginalJetsDischarged': 0,
        'newOriginalPDETermsDischarged': 0,
    }
    # No returned theorem object may expose a global constant, an input
    # receipt, or a cached mutable proof object for later callers to alter.
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
    print(json.dumps({'actualAxialLeftCollarZero': True,
                      'globalDensityPromoted': False, 'newOriginalDischarged': 0}))


if __name__ == '__main__':
    main()
