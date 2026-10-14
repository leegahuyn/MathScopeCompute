import copy
import sys
from pathlib import Path
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parent))
from guard_followup import IterativeSourceCalculus,attempt,domain_support,negative_controls
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
        with self.assertRaises(ValueError):attempt(program,{'root':2,'bound':0,'value':1},calc)

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


if __name__=='__main__':unittest.main()
