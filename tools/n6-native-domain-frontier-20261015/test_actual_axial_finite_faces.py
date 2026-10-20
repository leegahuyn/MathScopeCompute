"""Original finite-face application, exact source and scope adverse controls."""
import contextlib
import copy
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import actual_axial_finite_faces as a
from actual_background_jet_regularity import Bound


REPO = Path(__file__).resolve().parents[2]
FIXTURES = Path(os.environ.get('MATHSCOPE_PROOF_FIXTURE_ROOT',
                              REPO.parent/'face-proof-inputs'))


class FakeConstants:
    def __init__(self, get, parameters):
        self.get = get
        self.parameters = parameters
        self.domains = []


class ActualAxialFiniteFacesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # A missing genuine positive fixture is a failed gate, never a skip.
        cls.inputs = a.load_inputs(FIXTURES)
        cls.baseline = a.compose(*cls.inputs)

    def fresh(self):
        return copy.deepcopy(self.inputs)

    def rejected(self, mutate):
        data, hashes, sizes = self.fresh()
        mutate(data, hashes, sizes)
        with self.assertRaises(ValueError):
            a.compose(data, hashes, sizes)

    def handler(self):
        nodes = copy.deepcopy(a.source_nodes(self.inputs[0]['face-source']))
        get = lambda i: nodes[str(i)]
        parameters = copy.deepcopy(self.inputs[0]['diagnostics']['fullNativePayloads']['fixed']['source']['parametersExactExpressions'])
        return a.make_finite_face_application(get, FIXTURES, Bound), nodes, FakeConstants(get, parameters)

    def test_real22_inputs_compose_exact_original_finite_face(self):
        result = a.compose(*self.fresh())
        self.assertEqual(result['schema'], 'MathScope.N6.ActualAxialFiniteFaces/1')
        self.assertEqual(len(result['inputBindings']), 22)
        self.assertTrue(result['sameDensityTheoremReconstructedFrom20Inputs'])
        self.assertTrue(all(result['provedFiniteFaceConclusions'].values()))
        self.assertTrue(result['originalExactFace517240QualitativeFinitenessProved'])

    def test_density_theorem_is_fully_replayed_not_consumed_as_true_flags(self):
        self.rejected(lambda d, h, s: d.update(density={
            'schema': 'MathScope.N6.ActualAxialDensityRegularity/1',
            'actualSupportedDensityOrdinaryRegularityProved': True}))
        self.rejected(lambda d, h, s: d['density']['provedSupportedDensityConclusions'].update(
            genuineRightJoinSameRawSmoothGerm=False))
        self.rejected(lambda d, h, s: d['density'].update(actualTzPrimitiveGluingProved=True))

    def test_replayed_density_checks_same20_input_sha_and_bytes(self):
        self.rejected(lambda d, h, s: h.update({'left-collar': '0'*64}))
        self.rejected(lambda d, h, s: s.update({'exterior-source': s['exterior-source']+1}))
        self.rejected(lambda d, h, s: d['density']['inputBindings']['raw-regularity'].update(sha256='0'*64))

    def test_original_raw_and_left_picard_proofs_are_still_reconstructed(self):
        self.rejected(lambda d, h, s: h.update({'picard-majorant': '0'*64}))
        self.rejected(lambda d, h, s: d['average-collar']['exactBodyChecks']['originalVFormula'].update(
            right=0, normalForms=[0, 0]))
        self.rejected(lambda d, h, s: d['binding']['actualAxialFormula']['terms'].pop())

    def test_complete_face_source_receipt_is_required(self):
        self.rejected(lambda d, h, s: d.update({'face-source': {
            'schema': 'MathScope.N6.ActualAxialFaceBinding/1', 'pass': True}}))
        self.rejected(lambda d, h, s: d['face-source'].update(inventedAnalyticClaim=True))

    def test_complete_Python_sorted_receipt_pin_includes_all_CLI_input_bindings(self):
        receipt = self.inputs[0]['face-source']
        self.assertEqual(a.source_canonical_sha(receipt), a.FACE_CANONICAL_PIN)
        self.assertIn('inputBindings', receipt)
        without_bindings = copy.deepcopy(receipt)
        without_bindings.pop('inputBindings')
        self.assertNotEqual(a.source_canonical_sha(without_bindings), a.FACE_CANONICAL_PIN)

    def test_rehashed_counterfeit_native_metadata_or_lexical_scope_still_rejected(self):
        for mutate in [
            lambda r: r['actualNative1Calls'][0].update(registry='expression:0'),
            lambda r: r['actualFaceIntegrals'][0].update(bodyScope=[517016]),
            lambda r: r.update(actualAnalyticCompositionApplied=True),
        ]:
            data, hashes, sizes = self.fresh()
            mutate(data['face-source'])
            with patch.object(a, 'FACE_CANONICAL_PIN', a.source_canonical_sha(data['face-source'])):
                with self.assertRaises(ValueError):
                    a.compose(data, hashes, sizes)

    def test_exact_native1_source_calls_and_original_orders(self):
        applications = self.baseline['actualOrdinaryNativeApplications']
        self.assertEqual([row['node'] for row in applications], [517218, 517221, 517227])
        self.assertEqual([row['sourceCall']['args'][0] for row in applications], [1, 1, 1])
        self.assertEqual([row['sourceCall']['args'][2] for row in applications], [[0, 1], [0, 1], [1, 1]])
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517218']['args'].__setitem__(0, 0))
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517227']['args'].__setitem__(2, [0, 1]))

    def test_density_abi_and_positive_axial_endpoint_are_unchanged(self):
        self.assertEqual(self.baseline['sameNative1']['definition']['derivativeLimits'], [128, 128])
        self.assertEqual(self.baseline['sameNative1']['body'], 117047)
        self.rejected(lambda d, h, s: d['binding']['actualDensity']['definition'].update(derivativeLimits=[4, 6]))
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517234']['args'].__setitem__(2, 28826))

    def test_actual_radial_coordinate_is_cartesian_half_radius_squared(self):
        self.assertEqual(self.baseline['actualPhysicalDomain']['radialFormula'], 'X=(x^2+y^2)/2>=0')
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517175']['args'].__setitem__(0, 24))
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517173']['args'].__setitem__(0, 517017))

    def test_lazy_axis_zero_does_not_evaluate_singular_active_formula(self):
        domain = self.baseline['actualPhysicalDomain']
        self.assertIs(domain['rawOrRadialInverseEvaluatedAtAxis'], False)
        self.assertIn('before any inverse', domain['exteriorEvaluation'])
        self.assertIn('never evaluated there', '\n'.join(self.baseline['boundedPiecewiseArgument']))
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517234']['args'].__setitem__(3, 517233))

    def test_inner_integral_keeps_original_binder_and_endpoint_scope(self):
        inner = self.baseline['actualInnerIntegral']
        self.assertEqual(inner['sourceNode']['args'], [517221, 117055, 28814, 517175])
        self.assertTrue(inner['endpointsEvaluatedOutsideNewBinderScope'])
        self.assertTrue(inner['lexicalBinderShadowsOnlyIntegralBody'])
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517222']['args'].__setitem__(1, 517175))
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517221']['args'][1].__setitem__(0, 517175))

    def test_original_face_ordered_binders_and_actual_boxes_are_bound(self):
        face = self.baseline['actualNestedFace']
        self.assertEqual(face['orderedBinders'], [517017, 517016, 517015])
        self.assertEqual(face['CartesianEndpointNodes'], [346574, 215514])
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517239']['args'].__setitem__(1, 517015))
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517240']['args'].__setitem__(3, 28824))

    def test_physical_eta_is_exact_closed_minus_one_to_one(self):
        self.assertEqual(self.baseline['actualPhysicalDomain']['physicalEta'], [-1, 1])
        self.assertEqual(self.baseline['actualPhysicalDomain']['etaEndpointConvention'],
                         'continuous inward fixed jets')
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517238']['args'].__setitem__(2, 0))
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['517238']['args'].__setitem__(3, 24))

    def test_box_radius_uses_original_Xb_distinct_from_density_Xplus(self):
        box = self.baseline['actualBox']
        self.assertEqual([box['Xplus'], box['faceXb']], [28824, 28826])
        self.assertEqual(box['radiusFormula'], 'R=sqrt(2*Xb)>0')
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['137008']['args'].__setitem__(1, 28824))
        self.rejected(lambda d, h, s: a.source_nodes(d['face-source'])['346574']['args'].__setitem__(0, 1))

    def test_exact_original_active_algebra_has_independent_negative_control(self):
        identity = self.baseline['actualActiveSourceAlgebra']
        self.assertEqual(identity['exactRationalResidual'], '0')
        self.assertTrue(identity['wrongIntegralCoefficientResidualNonzero'])
        self.assertTrue(identity['arithmeticAppliedOnlyAfterAllActivePrimitiveDomains'])
        nodes = copy.deepcopy(a.source_nodes(self.inputs[0]['face-source']))
        nodes['517233']['args'][0] = 1
        with self.assertRaisesRegex(ValueError, 'active face formula'):
            a.original_active_algebra(nodes)

    def test_Riemann_integrals_use_original_finite_circle_sections(self):
        text = '\n'.join(self.baseline['exactNestedIntegralArgument'])
        self.assertIn('at most four y solutions', text)
        self.assertIn('bounded dominated convergence', text)
        self.assertIn('middle integral L(x) is continuous', text)
        self.assertIn('exterior H is1', text)
        self.assertIs(self.baseline['actualNestedFace']['piecewiseOnlyIntermediateContinuityPromoted'], False)
        self.assertIs(self.baseline['optInApplication']['genericConstantDomainsIntegralContinuityAssumed'], False)

    def test_no_genuine_stress_derivative_norm_or_original_row_promotion(self):
        for key in ['actualTotalAxialMomentZeroProved', 'forwardBackwardPrimitiveEqualityProved',
                    'actualTzPrimitiveGluingProved', 'genuineTzCartesianDerivativeIdentified',
                    'originalConsumerIntegralDomainsDischarged', 'originalCartesianGuardDomainsDischarged',
                    'allNineOriginalBackgroundBodiesProved', 'all26OrderedBackgroundRequestsAccepted',
                    'numericalNormHonestyProved', 'wholeGOnJProved']:
            self.assertIs(self.baseline[key], False, key)
        for key in a.COUNTERS:
            self.assertEqual(self.baseline[key], 0)

    def test_exact_empty_scope_handler_returns_positive_finite_value(self):
        handler, nodes, constants = self.handler()
        out = handler(constants, 517240, nodes['517240'], ())
        self.assertIsInstance(out, Bound)
        self.assertTrue(out.strict_positive)
        self.assertEqual(len(handler.applications), 1)
        self.assertEqual(handler.applications, constants.domains)
        witness = constants.domains[0]
        self.assertTrue(witness['allThreeOriginalNestedRiemannIntegralsExist'])
        self.assertTrue(witness['boundedPiecewiseMeasurableOnOriginalFiniteBox'])
        self.assertFalse(witness['continuousOnFiniteClosedIntervalClaimed'])
        self.assertFalse(witness['stressDerivativeOrNumericalNormEqualityClaimed'])

    def test_handler_declines_all_unowned_source_nodes_without_any_witness(self):
        handler, nodes, constants = self.handler()
        for i in [517218, 517221, 517227, 517222, 517234, 517238, 517239, 617466]:
            self.assertIsNone(handler(constants, i, nodes.get(str(i), {}), ()))
        self.assertEqual(handler.applications, [])
        self.assertEqual(constants.domains, [])

    def test_handler_rejects_coordinate_shadowing_of_complete_constant_face(self):
        handler, nodes, constants = self.handler()
        for coord in [117055, 517015, 517016, 517017]:
            with self.subTest(coord=coord), self.assertRaisesRegex(ValueError, 'empty lexical'):
                handler(constants, 517240, nodes['517240'], ((coord, Bound(0, 1)),))

    def test_handler_rejects_changed_actual_complete_source_call(self):
        handler, nodes, constants = self.handler()
        node = copy.deepcopy(nodes['517240'])
        node['args'][1] = 517016
        with self.assertRaisesRegex(ValueError, 'complete finite-face call'):
            handler(constants, 517240, node, ())

    def test_handler_checks_all_live_source_nodes_at_every_application(self):
        handler, nodes, constants = self.handler()
        handler(constants, 517240, nodes['517240'], ())
        nodes['517221']['args'][0] = 0
        with self.assertRaisesRegex(ValueError, 'live original finite-face'):
            handler(constants, 517240, nodes['517240'], ())
        self.assertEqual(len(handler.applications), 1)

    def test_handler_rejects_mixed_ConstantDomains_source_graph(self):
        handler, nodes, constants = self.handler()
        counterfeit = copy.deepcopy(nodes)
        counterfeit['517238']['args'][2] = 0
        constants.get = lambda i: counterfeit[str(i)]
        with self.assertRaisesRegex(ValueError, 'ConstantDomains source differs'):
            handler(constants, 517240, nodes['517240'], ())

    def test_handler_rejects_mixed_actual_fixed_parameter_expressions(self):
        handler, nodes, constants = self.handler()
        constants.parameters['XR'] = {'integer': 0}
        with self.assertRaisesRegex(ValueError, 'fixed parameter expressions differ'):
            handler(constants, 517240, nodes['517240'], ())
        self.assertEqual(handler.applications, [])

    def test_mutating_public_handler_receipt_cannot_change_private_theorem(self):
        handler, nodes, constants = self.handler()
        handler.receipt['sameNative1']['definition']['derivativeLimits'][0] = 0
        handler.receipt['inputBindings']['density']['sha256'] = 'poison'
        handler.receipt['actualNestedFace']['orderedBinders'][0] = 0
        handler(constants, 517240, nodes['517240'], ())
        self.assertEqual(constants.domains[0]['theoremInputBindings'], self.baseline['inputBindings'])

    def test_public_application_ledger_mutation_does_not_poison_next_evidence(self):
        handler, nodes, constants = self.handler()
        handler(constants, 517240, nodes['517240'], ())
        handler.applications[0]['finiteStrictlyPositiveScalar'] = False
        handler.applications.append({'counterfeit': True})
        handler(constants, 517240, nodes['517240'], ())
        self.assertEqual(len(handler.applications), 2)
        self.assertTrue(all(row['finiteStrictlyPositiveScalar'] for row in handler.applications))
        self.assertEqual(handler.applications, constants.domains)

    def test_previous_output_mutation_cannot_poison_future_compositions(self):
        data, hashes, sizes = self.fresh()
        output = a.compose(data, hashes, sizes)
        output['sameNative1']['definition']['derivativeLimits'][0] = 0
        output['actualOrdinaryNativeApplications'][0]['sourceCall']['args'][0] = 0
        output['actualNestedFace']['sourceNodes']['517240']['args'][1] = 0
        output['actualPhysicalDomain']['physicalEta'][0] = -100
        self.assertEqual(a.compose(data, hashes, sizes), self.baseline)
        self.assertEqual(a.FACE_NODES['517218']['args'][0], 1)

    def test_output_retains_no_mutable_input_receipt_references(self):
        data, hashes, sizes = self.fresh()
        output = a.compose(data, hashes, sizes)
        data['density']['actualOriginalDensity']['definition']['derivativeLimits'][0] = 0
        a.source_nodes(data['face-source'])['517240']['args'][0] = 0
        self.assertEqual(output, self.baseline)

    def test_cli_refuses_all22_original_input_output_aliases(self):
        for key, filename in a.INPUT_FILES.items():
            target = FIXTURES/filename
            before = target.read_bytes()
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, 'overwrite an original proof input'):
                a.main(['--input-dir', str(FIXTURES), '--out', str(target)])
            self.assertEqual(target.read_bytes(), before)

    def test_cli_writes_fresh_scoped_qualitative_finiteness_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)/'face.json'
            with contextlib.redirect_stdout(io.StringIO()) as output:
                a.main(['--input-dir', str(FIXTURES), '--out', str(target)])
            self.assertEqual(json.loads(target.read_text(encoding='utf-8')), self.baseline)
            summary = json.loads(output.getvalue())
            self.assertTrue(summary['actualOriginalFace517240FinitePositive'])
            self.assertFalse(summary['actualStressDerivativeNormIdentified'])
            self.assertEqual(summary['newOriginalDischarged'], 0)


if __name__ == '__main__':
    unittest.main()
