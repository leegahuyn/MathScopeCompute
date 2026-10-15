import copy,unittest
from picard_reuse_application_audit import background_proved_ids

def fixture():
    original=[{'id':f'j:{i}','sourceNode':i,'sourceCallSHA256':str(i),'orderedSourceCoordinates':[2,6]} for i in range(230)]
    rows=[dict(r,status='OPEN',actualFunctionDerivativeExistenceProved=False,originalOrderedRequestPreserved=True) for r in original[:26]]
    background={'schema':'MathScope.N6.ActualBackground26JetRegularity/1','actualOriginalBackgroundRows':rows,
      'provedOriginalBackgroundRowCount':0,'newOriginalJetsDischarged':0,'actualSourceBodyProof':None,'unprovedBodyDomainGaps':['actual integral domain']}
    matrix={'schema':'MathScope.N6.ActualBackground26RowContinuation/1','originalHistoricalMatrixUntouched':True,
      'originalUniversalRequirementsUnchanged':True,'originalPDECountUnchanged':True,'newDischargedGuardIDs':[],
      'after':{'GlobalGuard':10,'CartesianJet':230,'PDE':1020,'total':1260},'newDischargedJetIDs':[],
      'newDischarged':{'CartesianJet':0},'remainingJetIDs':[r['id'] for r in original]}
    return background,matrix,original

class ProofReuseAdverseControls(unittest.TestCase):
    def test_unproved_integral_leaves_all_original_rows_open(self):
        self.assertEqual(background_proved_ids(*fixture()),set())
    def test_absent_later_coordinate_cannot_create_earlier_derivative(self):
        b,m,o=fixture();b['actualOriginalBackgroundRows'][0]['status']='PROVED'
        with self.assertRaisesRegex(ValueError,'earlier derivative'):background_proved_ids(b,m,o)
    def test_ordered_original_request_cannot_be_swapped(self):
        b,m,o=fixture();b['actualOriginalBackgroundRows'][0]['orderedSourceCoordinates']=[6,2]
        with self.assertRaisesRegex(ValueError,'Changed ordered'):background_proved_ids(b,m,o)
    def test_repeated_original_row_cannot_count_as_twenty_six(self):
        b,m,o=fixture();b['actualOriginalBackgroundRows'][1]=copy.deepcopy(b['actualOriginalBackgroundRows'][0])
        with self.assertRaisesRegex(ValueError,'duplicated'):background_proved_ids(b,m,o)
    def test_unproved_pde_cannot_be_closed_by_a_picard_norm(self):
        b,m,o=fixture();m['after']['PDE']=0
        with self.assertRaisesRegex(ValueError,'PDE closure'):background_proved_ids(b,m,o)
    def test_original_universal_requirements_cannot_be_reduced(self):
        b,m,o=fixture();m['originalUniversalRequirementsUnchanged']=False
        with self.assertRaisesRegex(ValueError,'quantifiers'):background_proved_ids(b,m,o)
    def test_guard_cannot_be_closed_by_a_picard_norm(self):
        b,m,o=fixture();m['newDischargedGuardIDs']=['g:0']
        with self.assertRaisesRegex(ValueError,'Guard closure'):background_proved_ids(b,m,o)
    def test_actual_all26_proved_status_is_imported_only_with_full_body_proof(self):
        b,m,o=fixture();ids=[r['id'] for r in b['actualOriginalBackgroundRows']]
        for r in b['actualOriginalBackgroundRows']:
            r['status']='PROVED';r['actualFunctionDerivativeExistenceProved']=True
        b.update(provedOriginalBackgroundRowCount=26,newOriginalJetsDischarged=26,actualSourceBodyProof={'sameActualBodies':True},unprovedBodyDomainGaps=[])
        m.update(newDischargedJetIDs=ids,remainingJetIDs=[r['id'] for r in o[26:]],
          after={'GlobalGuard':10,'CartesianJet':204,'PDE':1020,'total':1234},newDischarged={'CartesianJet':26})
        self.assertEqual(background_proved_ids(b,m,o),set(ids))
        b['unprovedBodyDomainGaps']=['unproved integral']
        with self.assertRaisesRegex(ValueError,'Open body premise'):background_proved_ids(b,m,o)

if __name__=='__main__':unittest.main()
