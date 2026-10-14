import unittest
import copy
from fractions import Fraction as Q

from guard_worker import (Parameters,ScalarProof,combine,fact,guard_attempt,
                         inverse,nonzero,positive,power,rational,step_lemma,unary)
from guard_worker import sha
from acceptance import REQUEST_BINDING_FIELDS,verify_request_binding


class ExactGlobalGuardTests(unittest.TestCase):
    def proof(self,nodes):return ScalarProof(nodes,Parameters({}))

    def test_huge_exponential_symbolic_positive(self):
        p=Parameters({'T':{'exp':{'integer':1000000}},'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}})
        self.assertTrue(positive(p.parameter('h')))
        self.assertTrue(p.parameter('h')['lt1'])
        self.assertIsNone(p.parameter('h')['exact'])

    def test_unknown_parameter_not_defined(self):
        self.assertFalse(positive(Parameters({}).parameter('h')))

    def test_parameter_cycle_not_accepted(self):
        p=Parameters({'a':{'ref':'b'},'b':{'ref':'a'}})
        self.assertFalse(p.parameter('a')['finite'])

    def test_exp_unknown_operand_not_defined(self):
        self.assertFalse(positive(unary('exp',fact())))

    def test_square_is_not_strictly_positive(self):
        x=fact(finite=True,smooth=True)
        self.assertFalse(positive(power(x,2)))
        self.assertFalse(nonzero(power(x,2)))

    def test_positive_offset_square(self):
        x=fact(finite=True,smooth=True)
        self.assertTrue(positive(combine('add',[rational(1),power(x,2)])))

    def test_zero_denominator_rejected(self):
        self.assertFalse(inverse(rational(0))['finite'])

    def test_log_requires_actual_positive_argument(self):
        self.assertFalse(unary('log_positive',rational(-1))['finite'])

    def test_inverse_of_tiny_positive_symbolic(self):
        a=unary('exp',rational(-1000000))
        self.assertTrue(inverse(a)['gt1'])

    def test_constant_quotient(self):
        self.assertEqual(combine('multiply',[rational(2),inverse(rational(3))])['exact'],Q(2,3))

    def test_smooth_compact_integral(self):
        nodes=[{'op':'rational','args':['0','1']},{'op':'rational','args':['1','1']},
               {'op':'coordinate','args':['t',12]},{'op':'integer_power','args':[2,2]},
               {'op':'definite_integral','args':[3,2,0,1]}]
        g={'kind':'ACTUAL_FINITE_INTEGRAL_LEIBNIZ','operand':4,'body':3,'binder':2,'left':0,'right':1,'variable':2}
        self.assertTrue(guard_attempt(g,self.proof(nodes))['provedByThisWorker'])

    def test_integral_with_pole_not_smooth_on_all_real_inputs(self):
        nodes=[{'op':'rational','args':['0','1']},{'op':'rational','args':['1','1']},
               {'op':'coordinate','args':['t',12]},{'op':'inverse','args':[2]},
               {'op':'definite_integral','args':[3,2,0,1]}]
        g={'kind':'ACTUAL_FINITE_INTEGRAL_LEIBNIZ','operand':4,'body':3,'binder':2,'left':0,'right':1,'variable':2}
        self.assertFalse(guard_attempt(g,self.proof(nodes))['provedByThisWorker'])

    def test_integral_binder_mutation_rejected(self):
        nodes=[{'op':'coordinate','args':['t',12]},{'op':'definite_integral','args':[0,0,0,0]}]
        g={'kind':'ACTUAL_FINITE_INTEGRAL_LEIBNIZ','operand':1,'body':0,'binder':1,'left':0,'right':0,'variable':0}
        with self.assertRaises(ValueError):guard_attempt(g,self.proof(nodes))

    def test_opaque_function_does_not_inherit_finiteness(self):
        p=self.proof([{'op':'actual_opaque_value','args':[622820,'actual_monotone_root']}])
        self.assertFalse(p.at(0)['finite'])

    def test_step_composition_requires_actual_argument(self):
        nodes=[{'op':'actual_opaque_value','args':[4,'unknown']},{'op':'source_step_derivative','args':[0,0]}]
        g={'kind':'ORIGINAL_STEP_JET','operand':1,'requestedOrder':1}
        self.assertFalse(guard_attempt(g,self.proof(nodes))['provedByThisWorker'])

    def test_step_entire_real_affine_argument(self):
        nodes=[{'op':'coordinate','args':['x',2]},{'op':'source_step_derivative','args':[0,0]}]
        g={'kind':'ORIGINAL_STEP_JET','operand':1,'requestedOrder':1}
        self.assertTrue(guard_attempt(g,self.proof(nodes))['provedByThisWorker'])

    def test_step_order_mutation_rejected(self):
        nodes=[{'op':'coordinate','args':['x',2]},{'op':'source_step_derivative','args':[0,0]}]
        g={'kind':'ORIGINAL_STEP_JET','operand':1,'requestedOrder':2}
        with self.assertRaises(ValueError):guard_attempt(g,self.proof(nodes))

    def test_unknown_flat_join_retained(self):
        nodes=[{'op':'smooth_piecewise','args':[0,0,0,0,0,0]}]
        g={'kind':'ACTUAL_MATCHING_FLAT_JOIN','operand':0,'guards':[0,0,0]}
        self.assertFalse(guard_attempt(g,self.proof(nodes))['provedByThisWorker'])

    def test_all_order_step_induction_controls(self):
        lemma=step_lemma()
        self.assertEqual([x['order'] for x in lemma['exactInteriorDerivativeControls']],[1,2,3])
        self.assertIn('every fixed',lemma['allOrdersProof'])

    def test_sampled_local_root_label_not_a_global_proof(self):
        nodes=[{'op':'actual_opaque_value','args':[622820,'actual_monotone_root']}]
        g={'kind':'POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN','operand':0,'operation':'sqrt_positive'}
        row=guard_attempt(g,self.proof(nodes))
        self.assertEqual(row['status'],'OPEN')
        self.assertFalse(row['localChartReceiptUsedAsGlobalProof'])


class OriginalRequestBindingTests(unittest.TestCase):
    def fixture(self):
        original={k:None for k in REQUEST_BINDING_FIELDS}
        original.update(actualSourceNode={'op':'rational','args':['1','1']},
            result=10,base=2,orderedDifferentiationCoordinates=[0],
            actualDefinitionSHA256='pinned-registry-sha',minimalObligation='old independent proof frontier',
            status='UNRESOLVED',derivativeComputed=False,proof=None,exactValue=None)
        row=copy.deepcopy(original)
        row.update(originalRequest=copy.deepcopy(original),originalMinimalObligation=original['minimalObligation'],
            originalSourceNodeSHA256=sha(original['actualSourceNode']),orderedSourceCoordinates=[22])
        return original,row

    def test_computed_reason_and_formula_can_change(self):
        original,row=self.fixture()
        row.update(minimalObligation='new exact calculus stop',computedMinimalObligation='new stop',
                   proof='new derivation',exactValue='0',status='COMPUTED')
        self.assertTrue(verify_request_binding(original,row,[{'op':'coordinate','args':['x',22]}]))

    def test_node_registry_direction_and_capture_bindings_cannot_change(self):
        for key in REQUEST_BINDING_FIELDS:
            original,row=self.fixture();row[key]='MUTATED'
            with self.subTest(key=key),self.assertRaises(ValueError):verify_request_binding(original,row)

    def test_complete_original_request_must_be_preserved(self):
        original,row=self.fixture();row['originalRequest']['minimalObligation']='rewritten original'
        with self.assertRaises(ValueError):verify_request_binding(original,row)

    def test_original_reason_must_be_preserved(self):
        original,row=self.fixture();row['originalMinimalObligation']='rewritten original'
        with self.assertRaises(ValueError):verify_request_binding(original,row)

    def test_source_coordinate_word_is_bound_independently(self):
        original,row=self.fixture();row['orderedSourceCoordinates']=[23]
        with self.assertRaises(ValueError):verify_request_binding(original,row,[{'op':'coordinate','args':['x',22]}])

    def test_closed_jet_requires_capture_evidence(self):
        original,row=self.fixture();row.update(closedOnOriginalLeafDefinedDomain=True,derivativeComputed=True)
        with self.assertRaises(ValueError):verify_request_binding(original,row)


if __name__=='__main__':unittest.main()
