import unittest
from original_representative_frozen_coordinates import propagate_masks

class FrozenNativeArgumentDependencies(unittest.TestCase):
    def test_fixed_label_native_call_has_no_current_point_input(self):
        nodes=[{'op':'coordinate','args':['label']},{'op':'coordinate','args':['physical_Z']},
               {'op':'source_parameter','args':['h']},{'op':'multiply','args':[0,2]},
               {'op':'actual_monotone_root','args':[2,0,3]}]
        masks,bad=propagate_masks(nodes,{0:'label'},{1:'physical_Z'})
        self.assertEqual(masks[4],1);self.assertEqual(bad[4],0)

    def test_accidental_current_point_dependence_is_detected(self):
        nodes=[{'op':'coordinate','args':['label']},{'op':'coordinate','args':['physical_Z']},
               {'op':'add','args':[0,1]},{'op':'actual_monotone_root','args':[2,0,2]}]
        masks,_=propagate_masks(nodes,{0:'label'},{1:'physical_Z'})
        self.assertEqual(masks[3],3)

    def test_unknown_native_body_is_not_silently_declared_frozen(self):
        nodes=[{'op':'coordinate','args':['label']},{'op':'actual_quadratic_root','args':[0,0,0]},
               {'op':'actual_monotone_root','args':[2,0,1]}]
        masks,bad=propagate_masks(nodes,{0:'label'},{})
        self.assertEqual(masks[2],1);self.assertEqual(bad[2],1)

    def test_any_unlisted_coordinate_is_rejected_as_potential_live_input(self):
        nodes=[{'op':'coordinate','args':['label']},{'op':'coordinate','args':['new_physical_coordinate']},
               {'op':'actual_monotone_root','args':[2,0,1]}]
        masks,_=propagate_masks(nodes,{0:'label'},{})
        self.assertEqual(masks[2],3)

    def test_bound_coordinate_in_original_constant_is_not_a_physical_input(self):
        nodes=[{'op':'rational','args':['0','1']},{'op':'rational','args':['1','1']},
               {'op':'coordinate','args':['integration_variable']},
               {'op':'definite_integral','args':[2,2,0,1]},
               {'op':'actual_monotone_root','args':[2,3,3]}]
        masks,bad=propagate_masks(nodes,{},{} )
        self.assertEqual(masks[4],0);self.assertEqual(bad[4],0)

    def test_integration_endpoint_coordinate_remains_free(self):
        nodes=[{'op':'rational','args':['0','1']},{'op':'coordinate','args':['endpoint']},
               {'op':'definite_integral','args':[0,1,0,1]}]
        masks,_=propagate_masks(nodes,{},{} )
        self.assertNotEqual(masks[2],0)

if __name__=='__main__':unittest.main()
