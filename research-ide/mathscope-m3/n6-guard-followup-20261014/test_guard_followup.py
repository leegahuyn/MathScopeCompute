import copy
import json
import sys
from pathlib import Path
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parent))
from guard_followup import IterativeSourceCalculus,attempt,domain_support,negative_controls,classify_row_audit,constant_four_minus_sqrt_two,branch_dominance
from jet_worker import js_hash


def fixture(depth=1,hidden=False):
    source={0:{'op':'coordinate','args':['x']},1:{'op':'coordinate','args':['y']},
        2:{'op':'coordinate','args':['unused binder']},3:{'op':'rational','args':['1','1']}}
    body=2 if hidden else 0
    for i in range(4,4+depth):source[i]={'op':'multiply','args':[body,3]};body=i
    ident=4+depth;source[ident]={'op':'actual_expression_partial','args':[0,[0,1],[0,0]]}
    d={'name':'deep original expression','parameters':[0,1],'body':body,'derivativeLimits':[2,2]}
    defs={'expression:0':{'key':'expression:0','definition':d,'definitionSHA256':js_hash(d)}}
    program=[{'op':'coordinate','args':['unused binder',2]},{'op':'coordinate','args':['x',0]},
        {'op':'actual_opaque_value','args':[ident,'actual_expression_partial']}]
    return source,defs,program


class IterativeCaptureTests(unittest.TestCase):
    def picard_fixture(self,hidden_domain=False):
        source={0:{'op':'coordinate','args':['xi']},1:{'op':'coordinate','args':['eta']},
            2:{'op':'coordinate','args':['hidden binder']},3:{'op':'rational','args':['1','1']},
            4:{'op':'rational','args':['0','1']},5:{'op':'actual_background_picard','args':[0,0,0,1,0]},
            6:{'op':'actual_expression_partial','args':[0,[0,1],[0,0]]}}
        d={'xi':0,'eta':1,'A0':[[4]*6 for _ in range(6)],'A1':[[4]*6 for _ in range(6)],
            'forcing':[4]*6,'zeroAxisDatum':[4]*6,'radialDomain':[4,2 if hidden_domain else 3],
            'solutionNorm':{'commonCollar':3,'naturalExtensionToY5':3,'naturalExtensionNotUsedAsActualActivation':True}}
        expression={'parameters':[0,1],'body':5,'derivativeLimits':[1,1]}
        defs={key:{'key':key,'definition':value,'definitionSHA256':js_hash(value)}
            for key,value in [('picard:0',d),('expression:0',expression)]}
        program=[{'op':'coordinate','args':['binder',2]},{'op':'coordinate','args':['xi',0]},
            {'op':'actual_opaque_value','args':[6,'actual_expression_partial']}]
        return source,defs,program

    def test_native_radial_domain_list_endpoints_independently_reopened(self):
        source,defs,program=self.picard_fixture()
        calc=IterativeSourceCalculus(source,defs,max_work=10000)
        proof=attempt(program,{'root':2,'bound':0,'value':1},calc)
        self.assertTrue(proof['globallyProved'])
        self.assertTrue(proof['nativeDomainListEndpointsAndIndexedDerivativeScalesAudited'])
        audit=calc.system_capture_cache['picard:0']
        self.assertTrue(audit['completeNativeDomainAndBoundRootsAudited'])
        self.assertEqual([(r['sourceField'],r['sourceNode']) for r in audit['nativeDomainAndBoundRootAudits'][:2]],
            [('radialDomain[0]',4),('radialDomain[1]',3)])

    def test_hidden_native_radial_domain_list_endpoint_rejects_substitution(self):
        source,defs,program=self.picard_fixture(hidden_domain=True)
        calc=IterativeSourceCalculus(source,defs,max_work=10000)
        self.assertFalse(attempt(program,{'root':2,'bound':0,'value':1},calc)['globallyProved'])
        self.assertEqual(calc.system_capture_cache['picard:0']['additionalNativeDomainHiddenCoordinates'],[2])

    def test_hidden_native_solution_norm_bound_rejects_substitution(self):
        source,defs,program=self.picard_fixture()
        d=defs['picard:0']['definition'];d['solutionNorm']['commonCollar']=2
        defs['picard:0']['definitionSHA256']=js_hash(d)
        calc=IterativeSourceCalculus(source,defs,max_work=10000)
        self.assertFalse(attempt(program,{'root':2,'bound':0,'value':1},calc)['globallyProved'])

    def test_malformed_native_norm_and_unreviewed_domain_fields_fail_closed(self):
        for field,value in [('solutionNorm',{'commonCollar':'2'}),('extraDomain',{'positive':2})]:
            source,defs,program=self.picard_fixture()
            d=defs['picard:0']['definition'];d[field]=value
            defs['picard:0']['definitionSHA256']=js_hash(d)
            calc=IterativeSourceCalculus(source,defs,max_work=10000)
            self.assertFalse(attempt(program,{'root':2,'bound':0,'value':1},calc)['globallyProved'])

    def test_retained_original_volterra_norm_bound_is_reopened(self):
        for hidden in [False,True]:
            source={0:{'op':'coordinate','args':['time']},1:{'op':'coordinate','args':['parameter']},
                2:{'op':'coordinate','args':['hidden binder']},3:{'op':'rational','args':['1','1']},
                4:{'op':'rational','args':['0','1']}}
            original={'variable':0,'parameters':[1],'matrix':[[4,4],[4,4]],'initial':[3,4],
                'length':3,'normUpper':2 if hidden else 3}
            d={'variable':0,'parameters':[1],'matrix':[[4,4],[4,4]],'initial':[3,4],'length':3,'left':4,
                'originalDefinition':json.dumps(original),'directions':[1]}
            defs={'m3GlobalPulses:0':{'key':'m3GlobalPulses:0','definition':d,'definitionSHA256':js_hash(d)}}
            calc=IterativeSourceCalculus(source,defs,max_work=10000)
            audit=calc.system_capture_audit('m3_global_pulse_jet',0)
            self.assertEqual(audit['pass'],not hidden)
            self.assertTrue(any(r['sourceField']=='originalDefinition.normUpper' for r in audit['nativeDomainAndBoundRootAudits']))

    def test_literal_eta_order_does_not_become_source_domain_edge(self):
        source,defs,program=self.picard_fixture()
        d=defs['picard:0']['definition'];d['tail']={'etaOrder':2,'sourceStrip':3}
        defs['picard:0']['definitionSHA256']=js_hash(d)
        calc=IterativeSourceCalculus(source,defs,max_work=10000)
        self.assertTrue(attempt(program,{'root':2,'bound':0,'value':1},calc)['globallyProved'])

    def test_recursive_native_domain_metadata_fails_closed_and_cleans_active_state(self):
        source,defs,program=self.picard_fixture()
        d=defs['picard:0']['definition'];d['radialDomain'][1]=5
        defs['picard:0']['definitionSHA256']=js_hash(d)
        calc=IterativeSourceCalculus(source,defs,max_work=10000)
        self.assertFalse(attempt(program,{'root':2,'bound':0,'value':1},calc)['globallyProved'])
        self.assertFalse(calc.native_domain_capture_active)
        self.assertFalse(calc.support_active)

    def indexed_fixture(self,hidden=False,native=False):
        source={0:{'op':'coordinate','args':['x']},1:{'op':'coordinate','args':['y']},
            2:{'op':'coordinate','args':['hidden binder']},3:{'op':'rational','args':['1','1']},
            4:{'op':'rational','args':['0','1']},5:{'op':'coordinate','args':['implicit s']}}
        body=2 if hidden else 0
        defs={}
        if native:
            source[6]={'op':'actual_monotone_root','args':[0,0,1]};body=6
            d={'variable':5,'parameters':[0,1],'body':2 if hidden else 5,'left':4,'right':3,'derivativeLower':3,'derivativeUpper':3}
            defs['monotone:0']={'key':'monotone:0','definition':d,'definitionSHA256':js_hash(d)}
        d={'parameters':[0,1],'body':body,'derivativeLimits':[1,1]}
        defs['expressionDefinitions:0']={'key':'expressionDefinitions:0','definition':d,'definitionSHA256':js_hash(d)}
        d={'parameters':[0,1],'directions':[0,1],'rows':[{'coefficient':3,'values':[0,1],
            'localParameters':[0,1],'localBody':body,'localSystem':-1,'guards':[],
            'derivativeMaps':[[{'parameter':0,'coefficient':3}],[{'parameter':1,'coefficient':3}]]}]}
        defs['fieldDefinitions:0']={'key':'fieldDefinitions:0','definition':d,'definitionSHA256':js_hash(d)}
        source[7]={'op':'m3_aux_indexed_partial','args':[0,[0,1],[0,0]]}
        return IterativeSourceCalculus(source,defs,max_work=100000)

    def test_every_indexed_local_body_reopened_and_hidden_capture_rejected(self):
        calc=self.indexed_fixture(hidden=True);coords,unknown=calc.source_support(7)
        self.assertTrue(unknown);self.assertFalse(calc.capture_audit(7)['pass'])
        self.assertEqual(calc.indexed_local_capture_cache['fieldDefinitions:0']['uniqueLocalBodiesIndependentlyAudited'][0]['hiddenCapturedCoordinates'],[2])

    def test_native_coefficients_inside_indexed_local_body_are_reopened(self):
        calc=self.indexed_fixture(hidden=True,native=True);coords,unknown=calc.source_support(7)
        self.assertTrue(unknown);self.assertFalse(calc.capture_audit(7)['pass'])
        self.assertFalse(calc.system_capture_cache['monotone:0']['pass'])

    def test_exact_indexed_local_body_and_native_capture_can_pass(self):
        calc=self.indexed_fixture(native=True);coords,unknown=calc.source_support(7)
        self.assertFalse(unknown);self.assertTrue(calc.capture_audit(7)['pass'])
        self.assertTrue(calc.indexed_local_capture_cache['fieldDefinitions:0']['allActualLocalBodiesChecked'])

    def test_hidden_global_derivative_scale_capture_is_rejected(self):
        calc=self.indexed_fixture()
        d=calc.defs['fieldDefinitions:0']['definition'];d['rows'][0]['derivativeScales']=[3,2]
        calc.defs['fieldDefinitions:0']['definitionSHA256']=js_hash(d)
        coords,unknown=calc.source_support(7)
        self.assertTrue(unknown);self.assertFalse(calc.capture_audit(7)['pass'])
        audit=calc.indexed_local_capture_cache['fieldDefinitions:0']
        self.assertTrue(audit['allStoredDerivativeScalesChecked'])
        self.assertEqual(audit['fixedLabelDerivativeScaleCaptureAudits'][1]['hiddenCapturedCoordinates'],[2])

    def test_exact_global_derivative_scales_reopened_and_can_pass(self):
        calc=self.indexed_fixture()
        d=calc.defs['fieldDefinitions:0']['definition'];d['rows'][0]['derivativeScales']=[3,0]
        calc.defs['fieldDefinitions:0']['definitionSHA256']=js_hash(d)
        coords,unknown=calc.source_support(7)
        self.assertFalse(unknown);self.assertTrue(calc.capture_audit(7)['pass'])
        audit=calc.indexed_local_capture_cache['fieldDefinitions:0']
        self.assertEqual(len(audit['fixedLabelDerivativeScaleCaptureAudits']),2)

    def test_actual_deep_dag_has_no_python_recursion(self):
        source,defs,_=fixture(4000);calc=IterativeSourceCalculus(source,defs,max_work=100000)
        coords,unknown=calc.source_support(max(source))
        self.assertEqual(coords,{0});self.assertFalse(unknown)
        self.assertGreater(calc.maximum_explicit_stack,1000)

    def test_deep_hidden_capture_is_rejected(self):
        source,defs,program=fixture(4000,True);calc=IterativeSourceCalculus(source,defs,max_work=100000)
        e=attempt(program,{'root':2,'bound':0,'value':1},calc)
        self.assertFalse(e['globallyProved'])

    def test_absent_actual_binder_preserves_partial_function_domain(self):
        source,defs,program=fixture(4000);calc=IterativeSourceCalculus(source,defs,max_work=100000)
        e=attempt(program,{'root':2,'bound':0,'value':1},calc)
        self.assertTrue(e['globallyProved']);self.assertFalse(e['sourceExistenceProved'])
        self.assertEqual(e['actualCompleteArgumentTupleUnchanged'],[0,1])
        self.assertEqual(e['completeOriginalDomainSupport'],[0,1])

    def test_unused_actual_argument_remains_domain_dependency(self):
        source,defs,program=fixture();calc=IterativeSourceCalculus(source,defs,max_work=100000)
        program[0]={'op':'coordinate','args':['y',1]}
        e=attempt(program,{'root':2,'bound':0,'value':1},calc)
        self.assertFalse(e['globallyProved'])

    def test_explicit_hidden_domain_is_rejected(self):
        source,defs,program=fixture();defs['expression:0']['definition']['domain']={'positive':2}
        defs['expression:0']['definitionSHA256']=js_hash(defs['expression:0']['definition'])
        calc=IterativeSourceCalculus(source,defs,max_work=100000)
        self.assertFalse(attempt(program,{'root':2,'bound':0,'value':1},calc)['globallyProved'])

    def test_binder_scope_removes_only_integrand_dependency(self):
        source={0:{'op':'coordinate','args':['r']},1:{'op':'coordinate','args':['x']},
            2:{'op':'rational','args':['0','1']},3:{'op':'definite_integral','args':[0,0,2,1]}}
        calc=IterativeSourceCalculus(source,{},max_work=100000)
        coords,unknown=calc.source_support(3);domain,_=domain_support(calc,3)
        self.assertEqual(coords,{1});self.assertEqual(domain,{1});self.assertFalse(unknown)

    def test_cycle_is_retained_and_active_state_cleans(self):
        calc=IterativeSourceCalculus({0:{'op':'add','args':[0]}},{},max_work=1000)
        coords,unknown=calc.source_support(0)
        self.assertFalse(coords);self.assertTrue(unknown);self.assertFalse(calc.support_active)

    def test_budget_failure_cleanup_retains_exact_unknown(self):
        source,defs,_=fixture(100);calc=IterativeSourceCalculus(source,defs,max_work=5)
        with self.assertRaises(RuntimeError):calc.source_support(max(source))
        self.assertFalse(calc.support_active)

    def test_runtime_mutations_are_rejected(self):
        self.assertTrue(all(x['rejected'] for x in negative_controls()))

    def test_native_variational_blocks_are_not_falsely_counted_as_chart_failures(self):
        audit={'resourceStop':None,'rows':[{'registryKey':'m3GlobalFields:0','verified':True},
            {'registryKey':'fieldDefinitions:1','verified':True},{'registryKey':'m3GlobalBlocks:0','verified':False}]}
        result=classify_row_audit(audit)
        self.assertEqual(result['actualIndexedFieldRowsVerified'],2)
        self.assertTrue(result['allActualIndexedFieldRowsStructurallyVerified'])
        self.assertEqual(result['nativePulseVariationalBlockRows'],1)
        self.assertFalse(result['nativePulseDomainCertificateInferred'])

    def test_original_constant_guard_exact_square_enclosure(self):
        program=[{'op':'rational','args':['-1','1']},{'op':'rational','args':['2','1']},
            {'op':'sqrt_positive','args':[1]},{'op':'multiply','args':[0,2]},
            {'op':'rational','args':['4','1']},{'op':'add','args':[3,4]}]
        guard={'kind':'POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN','operation':'log_positive','operand':5}
        result=constant_four_minus_sqrt_two(program,guard)
        self.assertTrue(result['exactConstant4MinusSqrt2']);self.assertEqual(result['strictLowerBound'],'2')
        for index,value in [(4,1),(1,16)]:
            changed=copy.deepcopy(program);changed[index]={'op':'rational','args':[str(value),'1']}
            with self.assertRaises(ValueError):constant_four_minus_sqrt_two(changed,guard)

    def branch_fixture(self):
        return [{'op':'rational','args':['0','1']},{'op':'rational','args':['1','1']},
            {'op':'coordinate','args':['t',999]},{'op':'rational','args':['-1','1']},
            {'op':'multiply','args':[3,2]},{'op':'add','args':[1,4]},
            {'op':'multiply','args':[2,5]},{'op':'inverse','args':[6]},
            {'op':'multiply','args':[3,7]},{'op':'exp','args':[8]},
            {'op':'smooth_piecewise','args':[2,0,1,0,9,0]}]

    def test_all_dag_sinks_force_original_bump_interior(self):
        result=branch_dominance(self.branch_fixture(),{'operand':6})
        self.assertTrue(result['globallyProved']);self.assertFalse(result['selectorDefinednessProved'])

    def test_unguarded_inverse_sink_rejects_branch_proof(self):
        program=self.branch_fixture()+[{'op':'inverse','args':[6]}]
        self.assertFalse(branch_dominance(program,{'operand':6})['globallyProved'])

    def test_literal_source_id_is_not_an_evaluation_edge(self):
        program=self.branch_fixture()+[{'op':'coordinate','args':['unrelated source coordinate',7]}]
        self.assertTrue(branch_dominance(program,{'operand':6})['globallyProved'])

    def test_integral_shadowing_drops_outer_branch_fact(self):
        program=self.branch_fixture();program[10]={'op':'definite_integral','args':[9,2,0,1]}
        program.append({'op':'smooth_piecewise','args':[2,0,1,0,10,0]})
        self.assertFalse(branch_dominance(program,{'operand':6})['globallyProved'])

    def test_unknown_evaluation_grammar_fails_closed(self):
        program=self.branch_fixture()+[{'op':'unknown_helper','args':[7]}]
        with self.assertRaises(ValueError):branch_dominance(program,{'operand':6})


if __name__=='__main__':unittest.main()
