import copy,unittest
from shared_structure_frontier import exact_row_inventory,jet_registry_binding
from native_domain_extract import sha

def fixture():
    return ({'rows':[{'id':f'g:{i}','status':'OPEN','originalGuard':{'body':248}} for i in range(10)]},
            {'rows':[{'id':f'j:{i}','status':'OPEN'} for i in range(230)]},
            {'components':[{'rows':[{'id':f'p:{i}','status':'OPEN'} for i in range(1020)]}]})

class OriginalRowCoverage(unittest.TestCase):
    def test_all_three_original_families_are_kept(self):
        g,j,p=fixture();self.assertEqual(tuple(map(len,exact_row_inventory(g,j,p))),(10,230,1020))
    def test_dropped_original_pde_term_is_rejected(self):
        g,j,p=fixture();p['components'][0]['rows'].pop()
        with self.assertRaises(ValueError):exact_row_inventory(g,j,p)

class ActualJetRegistry(unittest.TestCase):
    def setUp(self):
        self.definition={'body':12,'parameters':[3,4]}
        self.call={'op':'actual_expression_partial','args':[0,[3,4],[0,0]]}
        self.reg={'expression':[self.definition]}
        self.row={'sourceCallSHA256':sha(self.call),'definitionSHA256':sha(self.definition),
                  'conditionalTarget':None}
    def test_absent_later_coordinate_preserves_null_target(self):
        self.assertEqual(jet_registry_binding(self.row,self.call,self.reg)[0],'expression:0')
        self.assertIsNone(self.row['conditionalTarget'])
    def test_native_call_and_conditional_target_must_agree(self):
        self.row['conditionalTarget']={'registry':'expression:1'}
        with self.assertRaises(ValueError):jet_registry_binding(self.row,self.call,self.reg)
    def test_changed_registered_definition_is_rejected(self):
        self.reg['expression'][0]['body']=13
        with self.assertRaises(ValueError):jet_registry_binding(self.row,self.call,self.reg)
    def test_duplicate_row_does_not_count_as_coverage(self):
        g,j,p=fixture();j['rows'][1]['id']=j['rows'][0]['id']
        with self.assertRaises(ValueError):exact_row_inventory(g,j,p)
    def test_evidence_calculation_cannot_rewrite_original_status(self):
        g,j,p=fixture();p['components'][0]['rows'][1]['status']='CLOSED'
        with self.assertRaises(ValueError):exact_row_inventory(g,j,p)
    def test_changed_pressure_family_is_rejected(self):
        g,j,p=fixture();g['rows'][0]['originalGuard']['body']=247
        with self.assertRaises(ValueError):exact_row_inventory(g,j,p)

if __name__=='__main__':unittest.main()
