import copy,unittest
from verify_join_receipt import verify

def fixture():
 rows=[]
 for n in range(5):
  for s in ('1','-1'):
   for m in (1,2):
    comp=[{'j':j,'part':p,'raw':9,'primary':1 if m==1 and p=='real' else 0,'supported':8 if m==1 and p=='real' else 9} for j in range(3) for p in ('real','imaginary')]
    rows.append({'key':f'{n}:{s}','m':m,'system':len(rows),'components':comp,'changed':3 if m==1 else 0})
 a={'sameFamilyLiveObjectIdentitiesChecked':True,'sourceGraphFullyExported':False,'backgroundOrder':5,'primaryBackgroundOrder':5,'targetOrder':3,'primaryOrder':2,'primaryFiniteOrder':2,'coefficientOrder':1,'primaryTargetOrders':[0,1,2,3],'primaryTargetPoles':[3,6,9,12],'systems':20,'components':120,'rows':rows,**{k:False for k in ('actualInputForcingWClassCertified','actualCompleteCurrentClassCertified','completeN6','newLeanKernelProof')}}
 return {'status':'VERIFIED_LIVE_SOURCE_JOIN_ONLY','stage':'LIVE_JOIN_ONLY_WITH_FORCED_INPUT_CLASS_OPEN','real_original_current_constructed':True,'real_original_forced_seal_issued':True,'release':'HOLD','actual_final67_jets_evaluated':0,'same_family_join':a},{'verifiedUnchangedPR30Files':27,'verifiedPinnedRepairFiles':2}
class Test(unittest.TestCase):
 def test_good(self):a,b=fixture();self.assertEqual(verify(a,b)['status'],'PASS_RECEIPT_READBACK_ONLY')
 def test_reject(self):
  for f in (lambda x:x['same_family_join'].__setitem__('completeN6',True),lambda x:x['same_family_join']['rows'][0]['components'][0].__setitem__('supported',9),lambda x:x['same_family_join'].__setitem__('primaryBackgroundOrder',4)):
   a,b=fixture();f(a)
   with self.assertRaises(AssertionError):verify(a,b)
 def test_pins(self):
  a,b=fixture();b['verifiedPinnedRepairFiles']=1
  with self.assertRaises(AssertionError):verify(a,b)
 def test_c3_requires_real_c3_and_three_original_class_flags(self):
  a,b=fixture()
  with self.assertRaises(AssertionError):verify(a,b,3)
  a['same_family_join'].update(backgroundOrder=6,primaryBackgroundOrder=6,targetOrder=4,
     primaryOrder=3,primaryFiniteOrder=3,primaryTargetOrders=list(range(5)),primaryTargetPoles=[3,6,9,12,15],
     primaryClassScope={'potentialWOne':True,'fullCurlWOneMinusKappa':True,'angularPressureWOne':True})
  self.assertEqual(verify(a,b,3)['status'],'PASS_RECEIPT_READBACK_ONLY')
  a['same_family_join']['primaryClassScope']['angularPressureWOne']=False
  with self.assertRaises(AssertionError):verify(a,b,3)
if __name__=='__main__':unittest.main()
