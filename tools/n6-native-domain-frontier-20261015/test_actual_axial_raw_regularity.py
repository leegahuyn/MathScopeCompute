"""Raw-axial scope and source controls using real historical profile receipts."""
import copy
import hashlib
import json
from pathlib import Path
import unittest

import actual_axial_raw_regularity as a

REPO = Path(__file__).resolve().parents[2]
HISTORY = REPO / 'research-ide/mathscope-m3/evidence/n6-continuation-20261015/run-38734477166'


def fixture():
    names = {'leading': 'ACTUAL_COMPLETED_LEADING_DOMAINS.json',
             'orderone': 'ACTUAL_ORDER_ONE_GLOBAL_REGULARITY.json',
             'orderone-binding': 'ACTUAL_ORDER_ONE_PRIMITIVE_BINDING.json',
             'diagnostics': 'NATIVE_DOMAIN_DIAGNOSTICS.json'}
    data, hashes = a.load_inputs({name: HISTORY / file for name, file in names.items()})
    # An exact subset of the source probe output, not an executed fresh probe.
    # Success here validates composition; the hosted source probe supplies
    # execution evidence separately.
    binding = {'schema': 'MathScope.N6.ActualAxialStressSourceBinding/1',
        'sourceHeaderSHA256': a.HEADER, 'fixedDefinitionSHA256': a.FIXED,
        'sourcePaperSHA256': a.PAPER, 'diagnosticsSHA256': a.DIAGNOSTICS,
        'sourceFiles': [{'path': p, 'sha256': h} for p, h in a.SOURCE_PINS.items()],
        'originalConstructionOptions': {'terms': 0, 'bits': 128, 'heatIterations': 0},
        'actualDensity': {'registry': 'expression:1',
            'definition': copy.deepcopy(a.DENSITY_DEFINITION), 'definitionSHA256': a.DENSITY_PIN,
            'component': 'axial', 'guard': [4756, 28814, 28824],
            'angularGuardUsesDifferentRightEndpoint': 28826},
        'actualAxialFormula': {'root': 117045, 'terms': list(a.TERM_IDS),
            'termRoles': list(a.TERM_ROLES), 'lambda1': 25, 'lambda1Equals2h': True,
            'leadingU0': 9236, 'leadingv0': 18778, 'U1': 29289, 'v1': 29440, 'Pi1': 50558,
            'allEightOriginalTermsIndependentlyReconstructed': True},
        'selectedActualSourceNodes': copy.deepcopy(a.SOURCE_NODES),
        'exactNegativeControls': {'allEightTermOmissionsRejected': [
            {'index': j, 'sourceTerm': term, 'correctlyRejected': True}
            for j, term in enumerate(a.TERM_IDS)]},
        'actualSourceBytesUnchanged': True, 'originalDefinitionsUnchanged': True,
        'sourceAssertionsUsedAsAnalyticPremises': False}
    data['binding'] = binding
    hashes['binding'] = a.canonical_sha(binding)
    return data, hashes


class ActualAxialRawRegularityControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original_data, cls.original_hashes = fixture()

    def fresh(self):
        return copy.deepcopy(self.original_data), dict(self.original_hashes)

    def rejected(self, mutate):
        data, hashes = self.fresh()
        mutate(data, hashes)
        with self.assertRaises(ValueError):
            a.compose(data, hashes)

    def test_real_profile_receipts_compose_raw_theorem(self):
        data, hashes = self.fresh()
        result = a.compose(data, hashes)
        self.assertTrue(result['provedRawResidualConclusions']['sameOriginalEightTermResidualCInfinity'])
        self.assertEqual(result['provedRawResidualConclusions']['requestedRawOrdinaryPartials'], [[0, 1], [1, 1]])
        self.assertEqual(result['inputSHA256'], hashes)

    def test_no_density_primitive_norm_or_original_promotion(self):
        result = a.compose(*self.fresh())
        for key in ['regularityOfActualDensityProved', 'supportedDensityOrdinaryDerivativesProved',
                    'actualInnerCollarRestrictionProved', 'boundedPiecewiseIntegrabilityProved',
                    'forwardBackwardPrimitiveEqualityProved', 'actualTzPrimitiveGluingProved',
                    'actualTotalAxialMomentZeroProved', 'numericalNormHonestyProved', 'wholeGOnJProved']:
            self.assertIs(result[key], False, key)
        for key in ['newOriginalGuardsDischarged', 'newOriginalJetsDischarged', 'newOriginalPDETermsDischarged']:
            self.assertEqual(result[key], 0)

    def test_changed_or_missing_source_file_pin_rejected(self):
        self.rejected(lambda d, h: d['binding']['sourceFiles'][0].update(sha256='0' * 64))
        self.rejected(lambda d, h: d['binding']['sourceFiles'].pop())

    def test_changed_raw_guard_and_term_nodes_rejected(self):
        self.rejected(lambda d, h: d['binding']['selectedActualSourceNodes']['117047']['args'].__setitem__(2, 28826))
        self.rejected(lambda d, h: d['binding']['selectedActualSourceNodes']['87488']['args'].__setitem__(0, 9239))
        self.rejected(lambda d, h: d['binding']['actualAxialFormula']['terms'].pop())

    def test_metadata_cannot_replace_source_formula(self):
        def mutate(d, h):
            d['binding']['selectedActualSourceNodes'] = {}
            d['binding']['actualAxialFormula']['allEightOriginalTermsIndependentlyReconstructed'] = True
        self.rejected(mutate)
        self.rejected(lambda d, h: d['binding'].update(sourceAssertionsUsedAsAnalyticPremises=True))

    def test_wrong_density_abi_hash_component_and_options_rejected(self):
        self.rejected(lambda d, h: d['binding']['actualDensity']['definition'].update(derivativeLimits=[4, 6]))
        self.rejected(lambda d, h: d['binding']['actualDensity'].update(definitionSHA256='0' * 64))
        self.rejected(lambda d, h: d['binding']['actualDensity'].update(component='angular'))
        self.rejected(lambda d, h: d['binding']['originalConstructionOptions'].update(heatIterations=1))

    def test_different_completed_profile_roots_rejected(self):
        self.rejected(lambda d, h: d['leading']['actualCompletedLeadingRoots'].update(U=9239))
        self.rejected(lambda d, h: d['orderone-binding']['bodyRoots'].update(Pi1=50557))
        self.rejected(lambda d, h: d['binding']['actualAxialFormula'].update(leadingv0=24914))

    def test_broken_hash_chain_and_unresolved_orderone_rejected(self):
        self.rejected(lambda d, h: h.update(leading='0' * 64))
        self.rejected(lambda d, h: h.update({'orderone-binding': '0' * 64}))
        self.rejected(lambda d, h: d['orderone'].update(remainingAnalyticPremises=['still conditional']))
        self.rejected(lambda d, h: d['orderone'].update(actualAllOrderGlobalRegularityComposed=False))
        self.rejected(lambda d, h: d['orderone']['provedActualOrderOneConclusions'].update(allSixOriginalProfilesCInfinity=False))

    def test_changed_raw_diagnostics_and_fixed_parameters_rejected(self):
        self.rejected(lambda d, h: h.update(diagnostics='0' * 64))
        self.rejected(lambda d, h: d['diagnostics']['fullNativePayloads']['fixed']['source']['parametersExactExpressions'].update(h={'integer': 0}))
        self.rejected(lambda d, h: d['diagnostics']['argumentAndContextGraph']['28']['args'].__setitem__(1, 26))

    def test_missing_omission_control_rejected(self):
        self.rejected(lambda d, h: d['binding']['exactNegativeControls']['allEightTermOmissionsRejected'].pop())

    def test_fresh_source_probe_when_available(self):
        path = REPO.parent / 'local-proof/ACTUAL_AXIAL_STRESS_SOURCE_BINDING.json'
        if not path.exists():
            self.skipTest('Fresh local source probe is tested by its hosted gate.')
        data, hashes = self.fresh()
        raw = path.read_bytes()
        data['binding'] = json.loads(raw)
        hashes['binding'] = hashlib.sha256(raw).hexdigest()
        # A concurrently running probe may still be replacing the five-pin
        # predecessor; only the finalized six-pin output is applicable.
        if len(data['binding'].get('sourceFiles', [])) < len(a.SOURCE_PINS):
            self.skipTest('Fresh source probe is still being regenerated with the induction ABI pin.')
        self.assertTrue(a.compose(data, hashes)['provedRawResidualConclusions']['sameOriginalEightTermResidualCInfinity'])


if __name__ == '__main__':
    unittest.main()
