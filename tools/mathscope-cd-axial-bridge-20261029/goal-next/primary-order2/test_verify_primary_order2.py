import hashlib,json,tempfile,unittest
from pathlib import Path
from verify_primary_order2 import verify,PIN

def put(p,obj):
 data=json.dumps(obj,separators=(',',':'),sort_keys=True).encode();p.write_bytes(data)
 return {'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}

def fixture(p):
 files={}
 def save(name,obj):files[name]=put(p/name,obj);return files[name]['sha256']
 family=save('family-program.json',{'nodes':[]});target=save('target-program.json',{'nodes':[{'op':'rational'}],'request':{'derivativeOrder':3}})
 full={'nodes':[{'op':'base'},{'op':'suffix'}],'definitions':{},'kernel':{}}
 current=save('current-native-program.json',{'nodes':[{'op':'suffix'}],'definitions':{},'kernel':{},'data':{}});save('current-full-graph.json',full)
 add={'targetBase':{'sha256':target},'currentBase':{'sha256':current},'norm':{'start':1,'nodes':[{}]},'current':{'start':2,'nodes':[{}]},'record':{'request':{'order':2}}}
 primary=save('primary-additive-program.json',add)
 check=[{'pass':True}]
 save('family-certificate.json',{'request':{'throughOrder':2,'derivativeOrder':5},'checks':check,'graph':{'sha256':family}})
 save('current-certificate.json',{'graph':{'sha256':current,'nodeCount':2},'source':{'prefixNodeCount':1}})
 save('target-certificate.json',{'checks':check,'request':{'derivativeOrder':3},'graph':{'sha256':target,'nodeCount':1}})
 scope={'actualFiniteDerivativeOrder':2,'actualOriginalPrimaryWOneHalfClassCertified':True,'actualOriginalPrimaryPressureWOneClassCertified':True,**{k:False for k in ('actualForcedInputWClassCertified','actualCompleteInitialN6TupleClassCertified','allFiniteIterationStagesClassCertified','completeN6','newLeanKernelProof')}}
 save('primary-certificate.json',{'request':{'order':2},'checks':check,'bounds':{'backgroundRow':{'derivativeOrder':3,'backgroundDerivativeOrder':5},'targetRows':[{'derivativeOrder':i,'pole':3+3*i} for i in range(4)]},'domain':{'actualWindow':{'coefficientOrder':1},'oneFinitePrefixClaimedValidAtAllQ':False},'scope':scope,'graph':{'sha256':primary,'normAddedNodes':1,'currentAddedNodes':1}})
 put(p/'status.json',{'status':'PASS','sourceCommit':PIN,'release':'HOLD','files':files,'familyHash':family,'targetHash':target,'currentHash':current,'primaryHash':primary})
class Controls(unittest.TestCase):
 def test_missing_status_cannot_pass(self):
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaises(FileNotFoundError): verify(Path(d))
 def test_failed_status_cannot_pass(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);put(p/'status.json',{'status':'FAILED'})
   with self.assertRaises(ValueError): verify(p)
 def test_false_passing_status_cannot_pass(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);put(p/'status.json',{'status':'PASS','sourceCommit':PIN,'release':'HOLD','files':{}})
   with self.assertRaises(ValueError): verify(p)
 def test_synthetic_positive_and_body_mutation(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);fixture(p);self.assertEqual(verify(p)['status'],'PASS')
   with (p/'current-native-program.json').open('ab') as f:f.write(b' ')
   with self.assertRaises(ValueError):verify(p)
 def test_unjustified_promotion_is_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);fixture(p);s=json.loads((p/'status.json').read_text());s['release']='PASS';put(p/'status.json',s)
   with self.assertRaises(ValueError):verify(p)
if __name__=='__main__':unittest.main()
