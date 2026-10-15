"""Fresh actual supported-density theorem and adverse source/scope controls."""
import contextlib
import copy
import io
import json
import os
from pathlib import Path
import tempfile
import unittest

import actual_axial_density_regularity as a


REPO = Path(__file__).resolve().parents[2]
FIXTURES = Path(os.environ.get('MATHSCOPE_PROOF_FIXTURE_ROOT',
                              REPO.parent/'right-proof-inputs'))


class ActualAxialDensityRegularityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # The hosted gate must produce the actual20 inputs first. Missing
        # positive fixtures fail the gate; they never become skipped tests.
        cls.inputs = a.load_inputs(FIXTURES)
        cls.baseline = a.compose(*cls.inputs)

    def fresh(self):
        return copy.deepcopy(self.inputs)

    def rejected(self, mutate):
        data, hashes, sizes = self.fresh()
        mutate(data, hashes, sizes)
        with self.assertRaises(ValueError):
            a.compose(data, hashes, sizes)

    def test_real20_inputs_compose_original_supported_native1_regularly(self):
        result = a.compose(*self.fresh())
        self.assertEqual(result['schema'], 'MathScope.N6.ActualAxialDensityRegularity/1')
        self.assertEqual(len(result['inputBindings']), 20)
        self.assertTrue(result['actualSupportedDensityOrdinaryRegularityProved'])
        self.assertTrue(result['genuineLeftTheoremReconstructedFromSame18Inputs'])
        self.assertTrue(all(result['provedSupportedDensityConclusions'].values()))

    def test_domain_is_positive_interior_with_right_axis_and_inward_eta_jets(self):
        domain = self.baseline['ordinaryDerivativeDomain']
        self.assertEqual(domain['radialDomain'], 'X>=0')
        self.assertEqual(domain['jointSmoothInterior'], 'X>0 and -1<eta<1')
        self.assertEqual(domain['physicalEta'], [-1, 1])
        self.assertIn('Right radial jets', domain['axisConvention'])
        self.assertIn('inward eta endpoints', domain['etaConvention'])
        self.assertIs(domain['negativeRadialExtensionClaimed'], False)

    def test_serialized_native_derivative_limits_remain_distinct_from_math_theorem(self):
        contract = self.baseline['unchangedNativeImplementationContract']
        self.assertEqual(contract['serializedDerivativeLimits'], [128, 128])
        self.assertEqual(contract['requestedOrdinaryNativePartialsWithinThoseLimits'], [[0, 1], [1, 1]])
        for key in ['nativeDerivativeLimitsChanged', 'originalNativeHandlerEnabledHere',
                    'originalConsumerAcceptanceChanged']:
            self.assertIs(contract[key], False)
        self.assertEqual(self.baseline['actualOriginalDensity']['definition']['derivativeLimits'], [128, 128])

    def test_no_moment_stress_literal517234_guard_norm_or_original_promotion(self):
        for key in ['actualTotalAxialMomentZeroProved', 'forwardBackwardPrimitiveEqualityProved',
                    'actualTzPrimitiveGluingProved', 'literal517234BoundedPiecewiseIntegrabilityApplied',
                    'originalConsumerIntegralDomainsDischarged', 'originalCartesianGuardDomainsDischarged',
                    'numericalNormHonestyProved', 'wholeGOnJProved']:
            self.assertIs(self.baseline[key], False, key)
        for key in a.COUNTERS:
            self.assertEqual(self.baseline[key], 0)
        self.assertTrue(self.baseline['qualitativeCompactJetFinitenessOnly'])

    def test_left_theorem_is_reconstructed_not_accepted_as_true_flags(self):
        self.rejected(lambda d, h, s: d.update({'left-collar': {'provedLeftCollarConclusions': {
            'supportedNative1LeftJoinLocallyZero': True}}}))
        self.rejected(lambda d, h, s: d['left-collar']['provedLeftCollarConclusions'].update(
            actualRaw117045IdenticallyZeroOnOpenCollar=False))
        self.rejected(lambda d, h, s: d['left-collar'].update(actualTotalAxialMomentZeroProved=True))

    def test_all18_left_input_bindings_have_the_actual_current_hash_and_byte_count(self):
        self.rejected(lambda d, h, s: s.update({'picard-parity': s['picard-parity']+1}))
        self.rejected(lambda d, h, s: h.update({'leading-collar': '0'*64}))
        self.rejected(lambda d, h, s: d['left-collar']['inputBindings']['orderone'].update(sha256='0'*64))

    def test_all_nine_original_Picard_inputs_are_replayed_with_raw_pins(self):
        self.rejected(lambda d, h, s: h.update({'picard-majorant': '0'*64}))
        self.rejected(lambda d, h, s: h.update({'picard-natural_binding': '0'*64}))
        self.rejected(lambda d, h, s: h.update({'picard-b26_binding': '0'*64}))
        self.rejected(lambda d, h, s: d['picard-lineage'].update(domainPrerequisiteSHA256='0'*64))

    def test_both_raw_receipt_and_actual_source_formula_are_reconstructed(self):
        self.rejected(lambda d, h, s: d['raw-regularity']['provedRawResidualConclusions'].update(
            sameOriginalEightTermResidualCInfinity=False))
        self.rejected(lambda d, h, s: d['binding']['actualAxialFormula']['terms'].pop())
        self.rejected(lambda d, h, s: d['binding']['selectedActualSourceNodes']['117047']['args'].__setitem__(4, 0))

    def test_same_finite_v0_v1_operands_are_retained_without_zero_assumption(self):
        self.rejected(lambda d, h, s: d['binding']['actualAxialFormula'].update(leadingv0=0))
        self.rejected(lambda d, h, s: d['orderone-binding']['bodyRoots'].update(v1=0))
        statement = self.baseline['sameRawRegularityApplication']['v0Andv1']
        self.assertIn('v0=18778', statement)
        self.assertIn('v1=29440', statement)
        self.assertIn('No exterior vanishing', statement)

    def test_whole_exterior_source_receipt_is_bound_not_just_pass_flags(self):
        self.rejected(lambda d, h, s: d.update({'exterior-source': {
            'schema': 'MathScope.N6.ActualAxialExteriorZero/1', 'pass': True}}))
        self.rejected(lambda d, h, s: d['exterior-source'].update(inventedRawZeroClaim=True))

    def test_exterior_source_file_pins_and_original_prefix_are_immutable(self):
        self.rejected(lambda d, h, s: d['exterior-source']['sourceFiles'][0].update(sha256='0'*64))
        self.rejected(lambda d, h, s: d['exterior-source']['sourceFiles'].pop())
        self.rejected(lambda d, h, s: d['exterior-source'].update(originalPrefixSHA256='0'*64))

    def test_axial_Xplus_cannot_be_replaced_with_angular_Xb(self):
        self.rejected(lambda d, h, s: d['exterior-source']['exactOriginalRoots'].update(Xplus=28826))
        self.rejected(lambda d, h, s: d['binding']['actualDensity']['guard'].__setitem__(2, 28826))
        density = self.baseline['actualOriginalDensity']
        self.assertEqual(density['Xplus'], 28824)
        self.assertEqual(density['distinctAngularEndpointXb'], 28826)

    def test_exterior_zero_profiles_must_be_the_same_original_U0_U1_Pi1(self):
        self.rejected(lambda d, h, s: d['exterior-source']['exactOriginalRoots'].update(U0=9239))
        self.rejected(lambda d, h, s: d['exterior-source']['exactOriginalRoots'].update(U1=28835))
        self.rejected(lambda d, h, s: d['exterior-source']['exactOriginalRoots'].update(Pi1=50557))

    def test_actual_exterior_trace_cannot_be_replaced_by_a_zero_result(self):
        self.rejected(lambda d, h, s: d['exterior-source'].update(actualExteriorTrace={'pass': True}))
        self.rejected(lambda d, h, s: d['exterior-source']['actualExteriorTrace'].update(endpoint=28826))
        self.rejected(lambda d, h, s: d['exterior-source']['actualExteriorTrace'].update(zeroBranchTrace=[]))

    def test_all_eight_original_terms_are_retained_in_exterior_identity(self):
        self.rejected(lambda d, h, s: d['exterior-source']['actualRawAxialFormula']['terms'].pop())
        self.rejected(lambda d, h, s: d['exterior-source'].update(actualEightTermExteriorTrace={'pass': True}))
        self.rejected(lambda d, h, s: d['binding']['actualAxialFormula']['terms'].__setitem__(7, 0))

    def test_positive_original_endpoint_order_and_eta_independence_are_required(self):
        self.rejected(lambda d, h, s: d['exterior-source']['actualSupportOrder']['endpoints'].update(Xminus=0))
        self.rejected(lambda d, h, s: d['exterior-source']['actualSupportOrder']['expressionChecks'].update(
            allEndpointsIndependentOfEta=False))
        self.rejected(lambda d, h, s: d['exterior-source']['actualSupportOrder']['inequalities'].pop())
        self.rejected(lambda d, h, s: d['exterior-source']['actualEndpointOrdering'].pop('actualAverageCutoff'))
        self.rejected(lambda d, h, s: d['exterior-source']['actualEndpointOrdering']['actualAverageCutoff'].update(source=28826))
        self.rejected(lambda d, h, s: d['exterior-source']['selectedSourceNodes']['29336']['args'].__setitem__(2, 28826))

    def test_exterior_domain_cannot_be_broadened_to_negative_X_or_all_eta(self):
        self.rejected(lambda d, h, s: d['exterior-source'].update(exteriorDomain={
            'radial': 'all real X', 'eta': 'all real eta'}))
        self.rejected(lambda d, h, s: d['diagnostics']['argumentAndContextGraph']['28']['args'].__setitem__(0, 0))

    def test_axis_uses_literal_zero_below_positive_Xminus(self):
        density = self.baseline['actualOriginalDensity']
        self.assertEqual(density['literalWrapper']['args'], [4756, 28814, 28824, 0, 117045, 0])
        self.assertIn('without evaluating raw at X=0', '\n'.join(self.baseline['globalSupportedDensityArgument']))
        self.rejected(lambda d, h, s: d['binding']['selectedActualSourceNodes']['117047']['args'].__setitem__(3, 117045))

    def test_real_native_abi_and_source_density_hash_cannot_be_changed(self):
        self.rejected(lambda d, h, s: d['binding']['actualDensity']['definition'].update(derivativeLimits=[4, 6]))
        self.rejected(lambda d, h, s: d['binding']['actualDensity'].update(definitionSHA256='0'*64))
        self.rejected(lambda d, h, s: d['binding']['actualDensity'].update(component='angular'))

    def test_genuine_right_germ_needs_only_outward_raw_zero_and_continuity(self):
        text = '\n'.join(self.baseline['rightJoinArgument'])
        self.assertIn('J=((a+b)/2,2*b)', text)
        self.assertIn('every fixed mixed raw jet0 at Xplus', text)
        self.assertIn('No two-sided raw-zero collar is assumed', text)
        self.assertNotIn('total moment is zero', text)

    def test_no_source_probe_analytic_or_global_promotion_can_be_injected(self):
        self.rejected(lambda d, h, s: d['exterior-source'].update(actualAnalyticCompositionApplied=True))
        self.rejected(lambda d, h, s: d['exterior-source'].update(actualTotalAxialMomentZeroProvedHere=True))
        self.rejected(lambda d, h, s: d['exterior-source'].update(TzPrimitiveGluingProvedHere=True))

    def test_mutating_previous_result_cannot_poison_future_proofs_or_native_abi(self):
        data, hashes, sizes = self.fresh()
        output = a.compose(data, hashes, sizes)
        output['actualOriginalDensity']['definition']['derivativeLimits'][0] = 999
        output['actualOriginalDensity']['literalWrapper']['args'][2] = 28826
        output['ordinaryDerivativeDomain']['physicalEta'][0] = -100
        output['inputBindings']['left-collar']['sha256'] = 'poison'
        output['provedSupportedDensityConclusions']['genuineRightJoinSameRawSmoothGerm'] = False
        self.assertEqual(a.compose(data, hashes, sizes), self.baseline)
        self.assertEqual(a.raw_proof.DENSITY_DEFINITION['derivativeLimits'], [128, 128])

    def test_returned_theorem_does_not_expose_input_receipt_references(self):
        data, hashes, sizes = self.fresh()
        output = a.compose(data, hashes, sizes)
        data['left-collar']['provedLeftCollarConclusions']['supportedNative1LeftJoinLocallyZero'] = False
        data['exterior-source']['exactOriginalRoots']['U0'] = 0
        self.assertEqual(output, self.baseline)

    def test_cli_refuses_every20_input_output_alias_without_writing(self):
        for key, filename in a.INPUT_FILES.items():
            target = FIXTURES/filename
            before = target.read_bytes()
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, 'overwrite an original proof input'):
                a.main(['--input-dir', str(FIXTURES), '--out', str(target)])
            self.assertEqual(target.read_bytes(), before)

    def test_cli_writes_the_scoped_density_application_from_fresh_inputs(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)/'density.json'
            with contextlib.redirect_stdout(io.StringIO()) as output:
                a.main(['--input-dir', str(FIXTURES), '--out', str(target)])
            result = json.loads(target.read_text(encoding='utf-8'))
            summary = json.loads(output.getvalue())
            self.assertEqual(result, self.baseline)
            self.assertTrue(summary['actualSupportedNative1OrdinaryRegularity'])
            self.assertFalse(summary['actualStressPrimitiveGluing'])
            self.assertEqual(summary['newOriginalDischarged'], 0)


if __name__ == '__main__':
    unittest.main()
