import copy
from fractions import Fraction as Q
from pathlib import Path
import sys
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'n6-cloud-20261014'))
from guard_solve import (Bound,FiberProof,bump_binding,bump_theorem,chart_image_theorem,
    const,inv,negative_controls,parameter_theorem,substitution_attempt,terminal_theorem,times)
from jet_worker import SourceCalculus,js_hash


def profile():
    return {'Md':{'integer':1048576},'T':{'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},
        'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},
        'lambda':{'exp':{'product':[{'integer':-1000},{'ref':'T'}]}},'co':{'rational':'1/256'}}


class FiberTests(unittest.TestCase):
    def test_exact_h_lambda_order(self):
        nodes=[{'op':'source_parameter','args':['lambda',8]},{'op':'source_parameter','args':['h',9]},
            {'op':'rational','args':['-1','1']},{'op':'multiply','args':[1,2]},{'op':'add','args':[0,3]}]
        self.assertTrue(FiberProof(nodes,profile()).at(4).positive())

    def test_zero_log_exponential_not_strictly_signed(self):
        nodes=[{'op':'rational','args':['0','1']},{'op':'exp','args':[0]},{'op':'log_positive','args':[1]}]
        value=FiberProof(nodes,{}).at(2)
        self.assertTrue(value.finite);self.assertFalse(value.nonzero())

    def test_environment_cache_cannot_transfer_unproved_regularity(self):
        proof=FiberProof([{'op':'coordinate','args':['x',10]}],{})
        good=Bound(Q(1),Q(2),finite=True,smooth=True,support={0})
        bad=Bound(Q(1),Q(2),finite=False,smooth=False,support={0},stops={'unproved source domain'})
        self.assertTrue(proof.at(0,{0:good}).smooth)
        self.assertFalse(proof.at(0,{0:bad}).smooth)
        self.assertFalse(proof.at(0,{0:bad}).finite)

    def test_changed_hierarchy_cannot_get_order(self):
        p=profile();p['h']['exp']['product'][0]['integer']=8002
        with self.assertRaises(ValueError):parameter_theorem(p)
        nodes=[{'op':'source_parameter','args':['h',9]}]
        value=FiberProof(nodes,p).at(0)
        self.assertIsNone(value.hi)

    def test_unknown_parameter_not_assumed_finite(self):
        self.assertFalse(FiberProof([{'op':'source_parameter','args':['h',9]}],{}).at(0).finite)

    def test_compact_fiber_avoids_actual_pole(self):
        nodes=[{'op':'rational','args':['1','1']},{'op':'rational','args':['3','1']},
            {'op':'coordinate','args':['t',10]},{'op':'inverse','args':[2]},
            {'op':'definite_integral','args':[3,2,0,1]}]
        result=FiberProof(nodes,{}).at(4)
        self.assertTrue(result.positive());self.assertTrue(result.smooth)

    def test_pole_inside_actual_fiber_kept_open(self):
        nodes=[{'op':'rational','args':['-1','1']},{'op':'rational','args':['1','1']},
            {'op':'coordinate','args':['t',10]},{'op':'inverse','args':[2]},
            {'op':'definite_integral','args':[3,2,0,1]}]
        self.assertFalse(FiberProof(nodes,{}).at(4).finite)

    def test_terminal_sigma_prime_integral_strictly_positive(self):
        nodes=[{'op':'rational','args':['1','1']},{'op':'rational','args':['3','1']},
            {'op':'coordinate','args':['t',10]},{'op':'rational','args':['-1','1']},
            {'op':'add','args':[2,3]},{'op':'rational','args':['1','2']},
            {'op':'multiply','args':[4,5]},{'op':'source_step_derivative','args':[6,1]},
            {'op':'definite_integral','args':[7,2,0,1]}]
        proof=FiberProof(nodes,{});value=proof.at(8)
        self.assertTrue(value.positive());self.assertTrue(value.smooth)
        self.assertTrue(proof.integral_certificates['8']['strictInteriorPositive'])

    def test_terminal_fixed_all_order_theorem(self):
        theorem=terminal_theorem()
        self.assertIn('1/100',theorem['strictBounds'][0])
        self.assertIn('derivative is <=-29',theorem['sigmaPrimeUpperEightProof'])

    def test_opaque_value_not_global_chart_domain(self):
        value=FiberProof([{'op':'actual_opaque_value','args':[622820,'actual_monotone_root']}],profile()).at(0)
        self.assertFalse(value.positive());self.assertFalse(value.finite)

    def test_original_chart_theorem_never_promotes_all_calls(self):
        self.assertFalse(chart_image_theorem()['allActualGlobalCandidateBindingsVerified'])

    def test_positive_times_small_positive_stays_strict(self):
        v=Bound(Q(0),Q(1,100),True,True,True,True)
        self.assertTrue(times([const(Q(1,256)),v]).positive())
        self.assertFalse(inv(Bound(Q(0),Q(1),False,False,True,True)).finite)


class BumpTests(unittest.TestCase):
    def nodes(self):
        return [{'op':'rational','args':['0','1']},{'op':'rational','args':['1','1']},
            {'op':'coordinate','args':['x',10]},{'op':'rational','args':['-1','1']},
            {'op':'multiply','args':[3,2]},{'op':'add','args':[1,4]},
            {'op':'multiply','args':[2,5]},{'op':'inverse','args':[6]},
            {'op':'multiply','args':[3,7]},{'op':'exp','args':[8]},
            {'op':'smooth_piecewise','args':[2,0,1,0,9,0]}]

    def test_exact_source_bump_pattern(self):
        self.assertTrue(bump_binding(self.nodes(),10)['matched'])
        self.assertIn('1/1458',bump_theorem()['positiveMassBounds'][0])

    def test_mutated_exponent_cannot_match(self):
        nodes=self.nodes();nodes[8]={'op':'multiply','args':[1,7]}
        self.assertFalse(bump_binding(nodes,10)['matched'])

    def test_algebraic_cancellation_cannot_hide_interior_pole(self):
        nodes=self.nodes()
        nodes.extend([{'op':'rational','args':['-1','2']},{'op':'add','args':[2,11]},
            {'op':'inverse','args':[12]},{'op':'multiply','args':[12,13]},
            {'op':'multiply','args':[8,14]},{'op':'exp','args':[15]}])
        nodes[10]={'op':'smooth_piecewise','args':[2,0,1,0,16,0]}
        self.assertFalse(bump_binding(nodes,10)['matched'])


class CaptureSubstitutionTests(unittest.TestCase):
    def fixture(self,hidden=False):
        source={0:{'op':'coordinate','args':['x']},1:{'op':'coordinate','args':['y']},
            2:{'op':'coordinate','args':['z']},3:{'op':'integer_power','args':[2 if hidden else 0,2]},
            4:{'op':'actual_expression_partial','args':[0,[0,1],[0,0]]}}
        d={'parameters':[0,1],'body':3,'derivativeLimits':[8,8]}
        defs={'expression:0':{'key':'expression:0','definition':d,'definitionSHA256':js_hash(d)}}
        program=[{'op':'coordinate','args':['x',0]},{'op':'coordinate','args':['y',1]},
            {'op':'coordinate','args':['z',2]},{'op':'actual_opaque_value','args':[4,'actual_expression_partial']}]
        return program,SourceCalculus(source,defs)

    def test_absent_coordinate_substitution_is_partial_function_identity(self):
        program,calc=self.fixture();e=substitution_attempt(program,{'root':3,'bound':1,'value':2},calc)
        self.assertTrue(e['globallyProved']);self.assertFalse(e['sourceExistenceProved'])

    def test_nontrivial_actual_tuple_reconstructed_exactly(self):
        program,calc=self.fixture();e=substitution_attempt(program,{'root':3,'bound':0,'value':2},calc)
        self.assertTrue(e['globallyProved'])
        self.assertEqual(e['independentlyReconstructedFinalApplication']['newCompleteActualSourceArgumentTuple'],[2,1])

    def test_hidden_capture_prevents_substitution_proof(self):
        program,calc=self.fixture(True);e=substitution_attempt(program,{'root':3,'bound':1,'value':2},calc)
        self.assertFalse(e['globallyProved'])

    def test_runtime_negative_controls_rejected(self):
        self.assertTrue(all(c['rejected'] for c in negative_controls()))


if __name__=='__main__':unittest.main()
