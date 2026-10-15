"""Same-source regularity of the raw eight-term order-one axial residual.

This composition stops BEFORE the supported density's piecewise wrapper.
It proves no density join, stress primitive join, integral, norm or original
obligation. The source probe and the completed profile receipts are inputs.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from natural_domain_proof import canonical_sha, source_parameter_proof
from actual_background_profile_constants import (
    HEADER, FIXED, LEADING_SCOPE, ONE_CONCLUSIONS, ORDER_ONE,
)

DIAGNOSTICS = 'b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1'
PAPER = '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
DENSITY_PIN = 'f815fd78afc4ef36627e657a34ba84624c838a44039de6435b748020b52b1689'
BASE = 'research-ide/mathscope-m2/navier/'
SOURCE_PINS = {BASE + name: pin for name, pin in {
    'actual-continuation-exact-stress.mjs': '22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2',
    'actual-continuation-exact-pde-proof.mjs': '816bd419d6b09545c18d2629c405fe91391f502b467409adecf6eed07c43c547',
    'actual-continuation-exact-inner.mjs': '3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
    'actual-continuation-exact-order-one.mjs': 'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
    'actual-continuation-exact-support.mjs': '0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
    'actual-residual-order-induction-expressions.mjs': 'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501',
}.items()}
LEADING_ROOTS = {'E': 71957, 'F': 71959, 'U': 9236, 'M': 9239,
                 'V': 18779, 'v': 18778, 'Xb': 28826, 'Xv': 3293}
# Preserve the original registered field order when recomputing its hash.
DENSITY_DEFINITION = {
    'name': 'actual_n1_Tz_forward_integrand', 'parameters': [4756, 2],
    'body': 117047, 'derivativeLimits': [128, 128],
    'implementation': 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
    'unspecifiedOracle': False, 'historicalBodyPreserved': True,
}
TERM_IDS = [87480, 87481, 87488, 87489, 87490, 117027, 117030, 117031]
TERM_ROLES = ['time U1', 'X v0 U1_X', 'U0 Z_(c+lambda1) U1',
              'X v1 U0_X', 'U1 Z_c U0', 'Z_(-2A+lambda1) Pi1',
              '-2(X U1_XX+U1_X)', '-Z_(c-D) Z_c U0']
SOURCE_NODES = {
    '87480': {'op': 'multiply', 'args': [1953, 87479]},
    '87481': {'op': 'multiply', 'args': [18779, 72309]},
    '87488': {'op': 'multiply', 'args': [9236, 87487]},
    '87489': {'op': 'multiply', 'args': [29441, 33214]},
    '87490': {'op': 'multiply', 'args': [29289, 78019]},
    '117027': {'op': 'multiply', 'args': [1953, 117026]},
    '117030': {'op': 'multiply', 'args': [190, 117029]},
    '117031': {'op': 'multiply', 'args': [20, 79047]},
    '117045': {'op': 'add', 'args': [117031, 117044]},
    '117047': {'op': 'smooth_piecewise',
               'args': [4756, 28814, 28824, 0, 117045, 0]},
}
COEFFICIENT_NODES = {
    '1': {'op': 'rational', 'args': ['1', '1']},
    '2': {'op': 'coordinate', 'args': ['eta']},
    '9': {'op': 'source_parameter', 'args': ['h']},
    '15': {'op': 'integer_power', 'args': [2, 2]},
    '19': {'op': 'rational', 'args': ['1', '2']},
    '20': {'op': 'rational', 'args': ['-1', '1']},
    '21': {'op': 'multiply', 'args': [9, 20]},
    '22': {'op': 'add', 'args': [19, 21]},
    '23': {'op': 'add', 'args': [9, 19]},
    '24': {'op': 'rational', 'args': ['2', '1']},
    '25': {'op': 'multiply', 'args': [9, 24]},
    '26': {'op': 'multiply', 'args': [15, 25]},
    '27': {'op': 'multiply', 'args': [20, 26]},
    '28': {'op': 'add', 'args': [1, 27]},
    '29': {'op': 'multiply', 'args': [15, 20]},
    '30': {'op': 'add', 'args': [1, 29]},
}


def need(ok, message):
    if not ok:
        raise ValueError(message)


def raw_sha(raw):
    return hashlib.sha256(raw).hexdigest()


def validate(data, hashes):
    """Authenticate exact source fields before using the profile theorems."""
    binding, leading, one, old, diag = (data[k] for k in
        ['binding', 'leading', 'orderone', 'orderone-binding', 'diagnostics'])
    need(hashes['diagnostics'] == DIAGNOSTICS, 'Changed original raw diagnostics')
    fixed = diag.get('fullNativePayloads', {}).get('fixed', {})
    need(canonical_sha(fixed) == FIXED, 'Changed original complete fixed definition')
    parameter_proof = source_parameter_proof(fixed)
    core, graph = fixed.get('core', {}), diag.get('argumentAndContextGraph', {})
    need(all(core.get(k) == v for k, v in {'A': 23, 'D': 22, 'd': 30, 'L': 28}.items())
         and all(graph.get(k) == v for k, v in COEFFICIENT_NODES.items()),
         'Changed actual T/Z coefficient and L denominator source nodes')

    need(binding.get('schema') == 'MathScope.N6.ActualAxialStressSourceBinding/1',
         'Actual axial source binding required')
    need(binding.get('sourceHeaderSHA256') == HEADER and
         binding.get('fixedDefinitionSHA256') == FIXED and
         binding.get('sourcePaperSHA256') == PAPER and
         binding.get('diagnosticsSHA256') == hashes['diagnostics'],
         'Mixed axial source identities')
    files = binding.get('sourceFiles', [])
    need(isinstance(files, list) and all(isinstance(v, dict) for v in files),
         'Malformed axial source-file bindings')
    actual_pins = {v.get('path'): v.get('sha256') for v in files}
    need(len(actual_pins) == len(files) and
         all(actual_pins.get(path) == pin for path, pin in SOURCE_PINS.items()),
         'Changed or missing actual axial source-file pins')
    need(binding.get('originalConstructionOptions') ==
         {'terms': 0, 'bits': 128, 'heatIterations': 0},
         'Changed original axial construction options')
    density = binding.get('actualDensity', {})
    need(density.get('registry') == 'expression:1' and
         density.get('definition') == DENSITY_DEFINITION and
         canonical_sha(density.get('definition')) == DENSITY_PIN and
         density.get('definitionSHA256') == DENSITY_PIN and
         density.get('component') == 'axial' and
         density.get('guard') == [4756, 28814, 28824] and
         density.get('angularGuardUsesDifferentRightEndpoint') == 28826,
         'Changed original axial density definition or component')
    inventory = diag.get('allReachedRegistryInventory', [])
    need(sum(v.get('key') == 'expression:1' and v.get('sha256') == DENSITY_PIN
             for v in inventory) == 1, 'Original density absent from diagnostics')
    nodes = binding.get('selectedActualSourceNodes', {})
    need(all(nodes.get(k) == v for k, v in SOURCE_NODES.items()),
         'Changed original raw axial source nodes')
    formula = binding.get('actualAxialFormula', {})
    expected = {'root': 117045, 'terms': TERM_IDS, 'termRoles': TERM_ROLES,
                'lambda1': 25, 'leadingU0': 9236, 'leadingv0': 18778,
                'U1': 29289, 'v1': 29440, 'Pi1': 50558}
    need(all(formula.get(k) == v for k, v in expected.items()),
         'Changed original eight-term raw axial formula or source roots')
    need(formula.get('allEightOriginalTermsIndependentlyReconstructed') is True and
         formula.get('lambda1Equals2h') is True and
         binding.get('actualSourceBytesUnchanged') is True and
         binding.get('originalDefinitionsUnchanged') is True and
         binding.get('sourceAssertionsUsedAsAnalyticPremises') is False,
         'Unverified axial source reconstruction')
    controls = binding.get('exactNegativeControls', {}).get('allEightTermOmissionsRejected')
    need(isinstance(controls, list) and len(controls) == 8 and
         all(row == {'index': j, 'sourceTerm': term, 'correctlyRejected': True}
             for j, (row, term) in enumerate(zip(controls, TERM_IDS))),
         'Missing original axial omission controls')

    need(leading.get('schema') == 'MathScope.N6.ActualCompletedLeadingFrozenApplication/1'
         and leading.get('sourceHeaderSHA256') == HEADER and
         leading.get('fixedDefinitionSHA256') == FIXED and
         leading.get('actualCompletedLeadingRoots') == LEADING_ROOTS,
         'Same completed-leading source roots required')
    need(leading.get('provedActualCompletedLeading', {}).get('regularity') == LEADING_SCOPE,
         'Actual leading joint and inward-endpoint regularity required')
    need(leading.get('inputSHA256', {}).get('payload') == hashes['diagnostics'] and
         leading.get('inputSHA256', {}).get('stream-binding') == hashes['orderone-binding'],
         'Completed leading uses different original source chain')
    need(old.get('schema') == 'MathScope.N6.ActualOrderOnePrimitiveBinding/1' and
         old.get('sourceHeaderSHA256') == HEADER and old.get('sourcePaperSHA256') == PAPER and
         old.get('diagnosticsSHA256') == hashes['diagnostics'] and
         old.get('bodyRoots') == ORDER_ONE,
         'Original six order-one body bindings required')
    need(all(old.get('actualLeadingRoots', {}).get(k) == LEADING_ROOTS[k]
             for k in ['U', 'M', 'V', 'v', 'Xv']),
         'Order-one theorem uses different completed leading roots')
    need(one.get('schema') == 'MathScope.N6.ActualOrderOnePrimitiveCalculus/1' and
         one.get('sourceHeaderSHA256') == HEADER and
         one.get('actualSourceBindingsComposed') is True and
         one.get('actualAllOrderGlobalRegularityComposed') is True and
         one.get('remainingAnalyticPremises') == [] and
         one.get('provedActualOrderOneConclusions') == ONE_CONCLUSIONS,
         'Actual all-six completed order-one regularity theorem required')
    need(one.get('inputSHA256', {}).get('leading') == hashes['leading'] and
         one.get('inputSHA256', {}).get('binding') == hashes['orderone-binding'],
         'Order-one regularity uses a different leading/source receipt')
    need(formula['leadingU0'] == leading['actualCompletedLeadingRoots']['U'] and
         formula['leadingv0'] == leading['actualCompletedLeadingRoots']['v'] and
         all(formula[k] == old['bodyRoots'][k] for k in ['U1', 'v1', 'Pi1']),
         'Raw residual operands differ from the completed profile theorems')
    return parameter_proof


def compose(data, hashes):
    parameters = validate(data, hashes)
    return {
        'schema': 'MathScope.N6.ActualAxialRawResidualRegularity/1',
        'sourceHeaderSHA256': HEADER, 'fixedDefinitionSHA256': FIXED,
        'sourcePaperSHA256': PAPER, 'inputSHA256': dict(hashes),
        'actualRawResidual': {'root': 117045, 'terms': TERM_IDS,
            'termRoles': TERM_ROLES, 'coordinates': [4756, 2],
            'actualOperands': {'U0': 9236, 'v0': 18778, 'U1': 29289,
                               'v1': 29440, 'Pi1': 50558}},
        'parameterSourceProof': parameters,
        'actualCoefficientSourceNodes': COEFFICIENT_NODES,
        'denominatorProof': {
            'literal': 'L=1-2*h*eta^2', 'h': 'exp(-8002*T)',
            'strictBounds': 'T=exp(1048576)+10>10; 0<h<1/16; |eta|<=1 imply L>7/8',
            'argument': 'exp(8002*T)>1+8002*T>16, so h<1/16. The same fixed source supplies A=1/2+h, D=1/2-h and d=1-eta^2.',
            'finiteRealSourceConstants': True, 'numericalEvaluationUsed': False},
        'ordinaryOperatorDefinitions': {
            'T_a': '(-a*f+D*eta*f_eta+X*f_X)/L',
            'Z_a': '(2*eta*(a*f-X*f_X)+d*f_eta)/L',
            'nu': 'lambda1=2*h', 'c': '-A'},
        'regularityArgument': [
            'The authenticated completed-leading theorem gives the same U0 and v0 jointly smooth for X>0, |eta|<1, with every fixed mixed jet continuous at inward eta endpoints.',
            'The authenticated completed order-one theorem gives the same U1,v1,Pi1 and their fixed mixed jets on that domain, including their original profile joins.',
            'Each T_a and Z_a is a finite sum of derivatives multiplied by polynomial coefficients and 1/L. L>7/8 makes that inverse and every fixed derivative smooth on a neighborhood of the closed eta interval.',
            'The eight retained raw terms use only finite compositions, products, and these operators; therefore the raw residual is jointly C-infinity on the physical interior and has all fixed continuous inward eta jets.',
            'Every fixed mixed raw derivative is continuous on [alpha,beta] times [-1,1], for arbitrary finite 0<alpha<=beta. Compactness gives a finite bound; no numerical bound is asserted.'],
        'provedRawResidualConclusions': {
            'sameOriginalEightTermResidualCInfinity': True,
            'allFixedMixedJetsContinuousAtInwardEtaEndpoints': True,
            'allFixedPartialsFiniteOnEveryFiniteClosedPositiveRadialBox': True,
            'requestedRawOrdinaryPartials': [[0, 1], [1, 1]],
            'appliesBeforeSupportedDensityWrapper': True},
        'regularityOfActualDensityProved': False,
        'supportedDensityOrdinaryDerivativesProved': False,
        'actualInnerCollarRestrictionProved': False,
        'boundedPiecewiseIntegrabilityProved': False,
        'forwardBackwardPrimitiveEqualityProved': False,
        'actualTzPrimitiveGluingProved': False,
        'actualTotalAxialMomentZeroProved': False,
        'numericalNormHonestyProved': False,
        'remainingContracts': [
            'Source-bound equality of the global and inner profiles on an open collar through Xminus, including the genuine mass average and all required jets.',
            'Supported density joins and its classical ordinary derivatives at Xminus and Xplus.',
            'Actual total axial mass/pressure-flux cancellation, integral differentiation, and forward/backward primitive equality and gluing.',
            'Actual Cartesian guard domains, finite integrals on their real boxes, numerical norm bounds, and original obligation acceptance gates.'],
        'wholeGOnJProved': False, 'newOriginalGuardsDischarged': 0,
        'newOriginalJetsDischarged': 0, 'newOriginalPDETermsDischarged': 0,
    }


def load_inputs(paths):
    raw = {name: Path(path).read_bytes() for name, path in paths.items()}
    return ({name: json.loads(value) for name, value in raw.items()},
            {name: raw_sha(value) for name, value in raw.items()})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    names = ['binding', 'leading', 'orderone', 'orderone-binding', 'diagnostics']
    for name in names:
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    data, hashes = load_inputs({name: getattr(args, name.replace('-', '_')) for name in names})
    result = compose(data, hashes)
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'actualRawAxialResidualRegularity': True,
        'supportedDensityOrdinaryDerivatives': False, 'newOriginalDischarged': 0}))


if __name__ == '__main__':
    main()
