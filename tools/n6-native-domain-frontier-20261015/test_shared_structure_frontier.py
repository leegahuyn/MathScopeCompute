import copy,unittest
from shared_structure_frontier import exact_row_inventory

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
