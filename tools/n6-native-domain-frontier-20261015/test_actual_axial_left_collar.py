"""Fresh positive application and adverse original-source/analytic controls."""
import contextlib
import copy
import hashlib
import io
import json
import os
from pathlib import Path
import tempfile
import unittest

import actual_axial_left_collar as a


REPO = Path(__file__).resolve().parents[2]
FIXTURES = Path(os.environ.get('MATHSCOPE_PROOF_FIXTURE_ROOT',
                              REPO.parent/'average-proof-inputs'))


class ActualAxialLeftCollarTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # This is intentionally required, with no skipped positive fixture.
        # The hosted workflow points this environment variable at its fresh
        # output directory after all original inputs and probes have run.
        cls.inputs = a.load_inputs(FIXTURES)
        cls.baseline = a.compose(*cls.inputs)

    def fresh(self):
        return copy.deepcopy(self.inputs)

    def rejected(self, mutate):
        data, hashes, sizes = self.fresh()
        mutate(data, hashes, sizes)
        with self.assertRaises(ValueError):
            a.compose(data, hashes, sizes)

    def test_fresh_original_receipts_apply_the_actual_left_collar_theorem(self):
        result = a.compose(*self.fresh())
        self.assertEqual(result['schema'], 'MathScope.N6.ActualAxialLeftCollar/1')
        self.assertTrue(all(result['provedLeftCollarConclusions'].values()))
        self.assertTrue(result['actualPicardRegularityReconstructedFromAllNineInputs'])
        self.assertEqual(len(result['inputBindings']), len(a.INPUT_FILES))
        self.assertEqual(result['actualCollar']['etaInterior'], '-1<eta<1')
        self.assertEqual(result['actualCollar']['inwardEtaEndpoints'], [-1, 1])

    def test_no_global_density_moment_stress_norm_or_original_promotion(self):
        result = self.baseline
        for key in ['regularityOfActualDensityGloballyProved', 'supportedDensityRightJoinProved',
                    'actualTotalAxialMomentZeroProved', 'forwardBackwardPrimitiveEqualityProved',
                    'actualTzPrimitiveGluingProved', 'boundedPiecewiseIntegrabilityProved',
                    'numericalNormHonestyProved', 'wholeGOnJProved']:
            self.assertIs(result[key], False, key)
        for key in ['newOriginalGuardsDischarged', 'newOriginalJetsDischarged',
                    'newOriginalPDETermsDischarged']:
            self.assertEqual(result[key], 0)
        self.assertNotIn('rawZeroOnAllZeroToXminus', result['provedLeftCollarConclusions'])

    def test_exact_ordinary_pressure_and_viscosity_chain_rules(self):
        calculus = a.ordinary_chain_calculus()
        self.assertTrue(all(value == '0' for value in calculus['exactChecks'].values()))
        self.assertEqual(calculus['actualPressureRhs'], 'rhs3=4*xi*F0*F-xi*omegaOverX')
        self.assertEqual(calculus['actualPressureDensity'], 'Pi_X=2*F0*F-omegaOverX/2')
        self.assertEqual(calculus['originalDiagonalFive'], 1)
        self.assertFalse(calculus['axisDivisionUsed'])

    def test_picard_receipt_is_reconstructed_in_full(self):
        self.rejected(lambda d, h, s: d['picard'].update(inventedConclusion=True))
        self.rejected(lambda d, h, s: d['picard']['inputBindings']['domains'].update(bytes=1))
        self.rejected(lambda d, h, s: d['picard']['provedSubkernelConclusions'].update(
            actualPicardAllFixedMixedDerivativeNormalConvergence=False))

    def test_all_three_original_pinned_raw_picard_inputs_are_enforced(self):
        for key in ['majorant', 'natural_binding', 'b26_binding']:
            with self.subTest(key=key):
                self.rejected(lambda d, h, s, key=key: h.update({'picard-'+key: '0'*64}))

    def test_domain_lineage_and_all_nine_byte_bindings_are_required(self):
        self.rejected(lambda d, h, s: d['picard-lineage'].update(domainPrerequisiteSHA256='0'*64))
        self.rejected(lambda d, h, s: s.update({'picard-parity': s['picard-parity']+1}))
        self.rejected(lambda d, h, s: d['picard-domains']['unprovedProofStates'].append('open'))

    def test_orderone_must_use_this_exact_accepted_picard_receipt(self):
        self.rejected(lambda d, h, s: d['orderone']['inputSHA256'].update(picard='0'*64))
        self.rejected(lambda d, h, s: h.update(picard='0'*64))

    def test_raw_regularity_receipt_cannot_be_replaced_by_flags(self):
        self.rejected(lambda d, h, s: d.update({'raw-regularity': {
            'sameOriginalEightTermResidualCInfinity': True}}))
        self.rejected(lambda d, h, s: d['raw-regularity']['actualRawResidual']['terms'].pop())

    def test_mixed_leading_or_positive_profile_roots_are_rejected(self):
        self.rejected(lambda d, h, s: d['leading']['actualCompletedLeadingRoots'].update(U=9239))
        self.rejected(lambda d, h, s: d['orderone-binding']['bodyRoots'].update(Pi1=50557))
        self.rejected(lambda d, h, s: d['average-collar']['exactOriginalRoots'].update(v1=29441))

    def test_leading_open_collar_and_true_mass_history_are_retained(self):
        self.rejected(lambda d, h, s: d['leading-collar']['ordering']['openCollar'].update(left='Xminus'))
        self.rejected(lambda d, h, s: d['leading-collar'].update(originalNaturalMassConstant=0))
        self.rejected(lambda d, h, s: d['leading-collar']['retainedMassPrimitiveNodes']['24898']['args'].__setitem__(0, 0))

    def test_literal_average_binder_bounds_and_sampled_tX_are_required(self):
        self.rejected(lambda d, h, s: d['average-collar']['actualAverageBinding']['literalIntegral']['args'].__setitem__(2, 28814))
        self.rejected(lambda d, h, s: d['average-collar']['actualAverageBinding']['sourceNodes']['29330']['args'].__setitem__(0, 28814))
        self.rejected(lambda d, h, s: d['average-collar']['actualAverageBinding'].update(binder=2))

    def test_actual_same_eta_average_derivative_is_required(self):
        self.rejected(lambda d, h, s: d['average-collar']['actualAverageBinding']['sourceNodes']['29342']['args'].__setitem__(3, 29329))
        self.rejected(lambda d, h, s: d['average-collar']['actualAverageBinding']['etaDerivative'].update(literalIntegral=29332))

    def test_actual_U_K_rows_and_bounded_zero_axis_premises_are_required(self):
        self.rejected(lambda d, h, s: d['average-collar']['actualPicardRows']['Krow'].__setitem__(5, 1))
        self.rejected(lambda d, h, s: d['average-collar']['actualPicardRows']['zeroAxisDatum'].__setitem__(2, 1))
        self.rejected(lambda d, h, s: d['diagnostics']['fullNativePayloads']['picard:0']['zeroAxisDatum'].__setitem__(1, 1))

    def test_full_zero_to_aSquared_domain_cannot_be_narrowed_to_caller_collar(self):
        self.rejected(lambda d, h, s: d['average-collar']['actualPicardRows'].update(commonRadialDomain=[28814, 28819]))
        self.rejected(lambda d, h, s: d['average-collar']['requiredPicardRegularity'].update(radialDomain='only C'))
        self.rejected(lambda d, h, s: d['diagnostics']['fullNativePayloads']['picard:0'].update(radialDomain=[28814, 24806]))

    def test_nu_2h_must_not_be_outer_lambda(self):
        self.rejected(lambda d, h, s: d['average-collar']['conditionalAverageIdentities']['v1'].update(nu=8))
        self.rejected(lambda d, h, s: d['average-collar']['actualAverageBinding']['sourceNodes']['25']['args'].__setitem__(0, 8))
        self.rejected(lambda d, h, s: d['binding']['actualAxialFormula'].update(lambda1=8))

    def test_original_full_forcing_and_all_six_PDE_states_are_required(self):
        self.rejected(lambda d, h, s: d['binding']['actualInnerPDE']['actualForcing'].__setitem__(5, 0))
        self.rejected(lambda d, h, s: d['binding']['actualInnerPDE']['stateRoots'].__setitem__(1, 26746))
        self.rejected(lambda d, h, s: d['binding']['actualInnerPDE']['checks'].pop('average'))
        self.rejected(lambda d, h, s: d['binding'].update(actualInnerPDE={'pass': True}))

    def test_actual_denominator_clearing_nodes_and_diagonal_are_required(self):
        self.rejected(lambda d, h, s: d['binding']['actualInnerPDE']['checks']['axial'].update(denominatorOperands=[]))
        self.rejected(lambda d, h, s: d['diagnostics']['argumentAndContextGraph']['25577']['args'].__setitem__(0, 1))
        self.rejected(lambda d, h, s: d['diagnostics']['fullNativePayloads']['picard:0']['diagonal'].__setitem__(5, 0))

    def test_original_eight_raw_terms_cannot_be_omitted(self):
        self.rejected(lambda d, h, s: d['binding']['actualAxialFormula']['terms'].pop())
        self.rejected(lambda d, h, s: d['binding']['selectedActualSourceNodes']['87489']['args'].__setitem__(0, 0))

    def test_positive_source_branch_restrictions_cannot_be_shifted_or_faked(self):
        self.rejected(lambda d, h, s: d['average-collar']['positiveOrderRestrictions']['U1']['trace'][0]['sourceNode']['args'].__setitem__(0, 29330))
        self.rejected(lambda d, h, s: d['average-collar']['positiveOrderRestrictions']['average']['trace'][0].update(selectedRoot=0))
        self.rejected(lambda d, h, s: d['average-collar']['exactBodyChecks'].update(conditionalVTransfer={'pass': True}))

    def test_even_U_K_pressure_interpretations_must_use_the_same_sqrtX_and_eta(self):
        self.rejected(lambda d, h, s: d['average-collar']['evenProfileInterpretation']['sourceBindings'].pop())
        self.rejected(lambda d, h, s: d['average-collar']['evenProfileInterpretation']['radialSourceNode']['args'].__setitem__(0, 29330))
        self.rejected(lambda d, h, s: d['average-collar']['evenProfileInterpretation']['sourceBindings'][2]['picardSourceNode']['args'].__setitem__(3, 29329))

    def test_actual_pressure_row_and_forcing_must_be_preserved(self):
        self.rejected(lambda d, h, s: d['average-collar']['coordinateDerivativeInterpretation']['Pi']['actualA0Row'].__setitem__(0, 25601))
        self.rejected(lambda d, h, s: d['average-collar']['coordinateDerivativeInterpretation']['Pi'].update(actualForcing=0))
        self.rejected(lambda d, h, s: d['diagnostics']['argumentAndContextGraph']['26394']['args'].__setitem__(0, 1))

    def test_generic_average_algebra_needs_source_and_wrong_sign_controls(self):
        self.rejected(lambda d, h, s: d['average-collar']['genericAverageIdentity'].update(sourceAuthenticated=True))
        self.rejected(lambda d, h, s: d['average-collar']['genericAverageIdentity']['wrongSign'].update({'pass': True}))
        self.rejected(lambda d, h, s: d['average-collar']['conditionalAverageIdentities']['value']['termSourceNodes'][1]['args'].__setitem__(1, 3))

    def test_physical_eta_domain_and_inward_endpoint_convention_are_required(self):
        self.rejected(lambda d, h, s: d['average-collar']['requiredPicardRegularity'].update(parameterDomain='all eta with no endpoint convention'))
        self.rejected(lambda d, h, s: d['average-collar']['conditionalAverageIdentities']['eta']['termSourceNodes'][0]['args'].__setitem__(3, 29329))

    def test_source_probe_cannot_preclaim_the_analytic_application(self):
        self.rejected(lambda d, h, s: d['average-collar'].update(actualAnalyticCompositionApplied=True))
        self.rejected(lambda d, h, s: d['average-collar'].update(actualTotalAxialMomentZeroProvedHere=True))

    def test_forged_source_comparator_RHS_or_equal_forms_are_rejected(self):
        def forged(d, h, s):
            row = d['average-collar']['exactBodyChecks']['originalVFormula']
            row['right'], row['normalForms'] = 0, [0, 0]
        self.rejected(forged)
        self.rejected(lambda d, h, s: d['average-collar']['exactBodyChecks']['conditionalVTransfer'].update(
            {'right': 0, 'normalForms': [0, 0], 'pass': True}))

    def test_previous_result_mutation_cannot_poison_later_theorems(self):
        data, hashes, sizes = self.fresh()
        poisoned = a.compose(data, hashes, sizes)
        poisoned['actualCollar']['openRadialInterval']['left'] = 'poison'
        poisoned['originalSourceRoots']['PicardStates'][0] = -1
        poisoned['ordinaryChainCalculus']['exactChecks']['pressureChain'] = '1'
        self.assertEqual(a.compose(data, hashes, sizes), self.baseline)
        direct = a.ordinary_chain_calculus()
        direct['exactChecks']['axialViscosityChain'] = '1'
        self.assertEqual(a.ordinary_chain_calculus()['exactChecks']['axialViscosityChain'], '0')

    def test_changed_standalone_source_receipt_is_rejected_even_with_renamed_diagnostic_ids(self):
        data, hashes, sizes = self.fresh()
        receipt = data['average-collar']
        def moved(value):
            return value+1000000 if type(value) is int and value >= 117100 else value
        even = receipt['evenProfileInterpretation']
        even['radialNode'] = moved(even['radialNode'])
        for row in even['sourceBindings']:
            for key in ['evenNode', 'picardValueNode']:
                row[key] = moved(row[key])
            row['picardSourceNode']['args'][2] = moved(row['picardSourceNode']['args'][2])
        for key in ['value', 'eta']:
            row = receipt['conditionalAverageIdentities'][key]
            row['right'] = moved(row['right'])
            row['terms'] = [moved(item) for item in row['terms']]
            row['rightSourceNode']['args'] = list(row['terms'])
        v = receipt['conditionalAverageIdentities']['v1']
        for key in ['restricted', 'inner', 'conditionalReduced']:
            v[key] = moved(v[key])
        receipt['positiveOrderRestrictions']['v1']['reduced'] = v['restricted']
        for row in receipt['exactBodyChecks'].values():
            for key in ['left', 'right']:
                row[key] = moved(row[key])
            row['normalForms'] = [moved(item) for item in row['normalForms']]
        raw = (json.dumps(receipt, ensure_ascii=False, indent=2)+'\n').encode('utf-8')
        hashes['average-collar'], sizes['average-collar'] = hashlib.sha256(raw).hexdigest(), len(raw)
        with self.assertRaisesRegex(ValueError, 'complete actual average source/comparator receipt'):
            a.compose(data, hashes, sizes)

    def test_cli_rejects_output_alias_to_every_original_input_without_writing(self):
        for key in a.INPUT_FILES:
            target = FIXTURES/a.INPUT_FILES[key]
            before = target.read_bytes()
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, 'overwrite an original proof input'):
                a.main(['--input-dir', str(FIXTURES), '--out', str(target)])
            self.assertEqual(target.read_bytes(), before)

    def test_cli_writes_only_the_scoped_application_with_all_input_byte_bindings(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)/'left.json'
            with contextlib.redirect_stdout(io.StringIO()) as output:
                a.main(['--input-dir', str(FIXTURES), '--out', str(target)])
            result = json.loads(target.read_text(encoding='utf-8'))
            summary = json.loads(output.getvalue())
            self.assertEqual(result, self.baseline)
            self.assertTrue(summary['actualAxialLeftCollarZero'])
            self.assertFalse(summary['globalDensityPromoted'])
            self.assertEqual(summary['newOriginalDischarged'], 0)


if __name__ == '__main__':
    unittest.main()
