import unittest
from audit_original_114_native_expression_argument_bindings import (
    choose_def,validate_binding,OriginalNativeBindingGap,OPS
)

class NativeSourceFormalActualBindings(unittest.TestCase):
    def setUp(self):
        self.definition={'body':1,'parameters':[4,5],
                         'derivativeLimits':[3,5]}
        self.defs={'global':[self.definition],
                   'aux':[self.definition],
                   'coupled':[dict(self.definition,id='coupled-expression:0')],
                   'forced':[dict(self.definition,id='forced-expression:0')]}

    def test_valid_exact_original_global_argument_binding(self):
        d,s,p,v,o=validate_binding(
            {'op':'actual_expression_partial','args':[0,[111,112],[1,2]]},self.defs)
        self.assertEqual((s,p,v,o),('0',[4,5],[111,112],[1,2]))
        self.assertEqual(d['body'],1)

    def test_valid_actual_coupled_and_forced_binding(self):
        for op,sid in [('m3_coupled_expression_partial','coupled-expression:0'),
                       ('m3_forced_expression_partial','forced-expression:0')]:
            d,s,p,v,o=validate_binding(
                {'op':op,'args':[sid,[37,38],[0,0]]},self.defs)
            self.assertEqual((s,v),(sid,[37,38]))

    def test_valid_aux_negative_system_id(self):
        _,sid,p,v,_=validate_binding(
            {'op':'m3_aux_expression_partial','args':[-1,[22,21],[0,3]]},self.defs)
        self.assertEqual(sid,'-1')

    def test_missing_actual_arguments_fail_closed(self):
        with self.assertRaises(OriginalNativeBindingGap):
            validate_binding({'op':'actual_expression_partial',
                'args':[0,[111],[1,2]]},self.defs)

    def test_actual_derivative_beyond_source_limit_fail_closed(self):
        with self.assertRaises(OriginalNativeBindingGap):
            validate_binding({'op':'actual_expression_partial',
                'args':[0,[111,112],[4,0]]},self.defs)

    def test_duplicate_formal_parameter_refuses_substitution_proof(self):
        self.defs['global'][0]['parameters']=[4,4]
        with self.assertRaises(OriginalNativeBindingGap):
            validate_binding({'op':'actual_expression_partial',
                'args':[0,[111,112],[0,0]]},self.defs)

    def test_invalid_façade_ids_rejected(self):
        with self.assertRaises(OriginalNativeBindingGap):
            choose_def('m3_coupled_expression_partial','forced-expression:0',self.defs)
        with self.assertRaises(OriginalNativeBindingGap):
            choose_def('actual_expression_partial',-1,self.defs)

if __name__=='__main__':unittest.main()
