"""Adversarial primitive-scope fixtures; these are not original-source receipts."""
import copy,unittest
from types import SimpleNamespace
import actual_eta_transport as e
from actual_background_body_domains import audit_actual_body_domains,PrimitiveGap

def fixture():
 n={};serial=800000
 def put(i,op,*a):n[i]={'op':op,'args':list(a)};return i
 def new(op,*a):
  nonlocal serial
  serial+=1;return put(serial,op,*a)
 def rat(i,p,q=1):return put(i,'rational',str(p),str(q))
 rat(0,0);rat(1,1);rat(19,1,2);rat(20,-1);rat(24,2)
 for i in [e.X,e.ETA,e.R,e.Z,e.TIME,622791,617438,622831,622810,617752]:put(i,'coordinate','fixture'+str(i))
 put(23,'source_parameter','h');put(21,'multiply',20,23);put(22,'add',19,21)
 # The exact original chart equation and coordinate formulas.
 sv=622810;logsv=new('log_positive',sv);s2h=new('exp',new('multiply',24,23,logsv))
 chartbody=new('add',sv,new('multiply',20,new('integer_power',e.Z,2),s2h),new('multiply',20,e.TIME))
 put(e.CHART_S,'actual_monotone_root',2,e.Z,e.TIME)
 put(e.CHART_X,'multiply',new('integer_power',e.R,2),19,new('inverse',e.CHART_S))
 put(e.CHART_ETA,'multiply',e.Z,new('exp',new('multiply',20,22,new('log_positive',e.CHART_S))))
 # Actual lazy linear-seed cutoff structure, with correct endpoint scopes.
 u=new('add',new('multiply',24,622831),20);v=new('add',1,new('multiply',20,u))
 aa=new('exp',new('multiply',20,new('inverse',u)));bb=new('exp',new('multiply',20,new('inverse',v)))
 put(622845,'smooth_piecewise',622831,19,1,1,new('multiply',bb,new('inverse',new('add',aa,bb))),0)
 put(617753,'actual_expression_partial',2,[617752,e.ETA],[0,0]);put(617754,'integer_power',617753,2)
 put(617755,'definite_integral',617754,617752,0,e.X)
 put(3451,'rational','0','1');put(9239,'rational','0','1');put(617466,'source_parameter','C12EnvelopeR')
 sigma=new('multiply',617438,617466);cut=new('actual_expression_partial',680,[sigma],[1])
 lvalue=new('add',1,new('multiply',20,24,23,new('integer_power',e.ETA,2)));linverse=new('inverse',lvalue)
 normalized=new('add',3451,9239,617466,cut,linverse)
 put(622830,'multiply',new('exp',new('multiply',20,622791,new('log_positive',24))),e.CHART_S)
 expressions={i:{'name':'fixture'+str(i),'parameters':[e.X,e.ETA],'body':0,'derivativeLimits':[128,128],'unspecifiedOracle':False} for i in range(2,11)}
 expressions[680]={'parameters':[622831],'body':622845};expressions[677]={'parameters':[e.X,e.ETA],'body':617755}
 for i in range(681,686):expressions[i]={'parameters':[617438,e.X,e.ETA],'body':normalized}
 for i,helper in [(688,681),(689,682),(690,685),(691,684)]:
  body=new('actual_expression_partial',helper,[622830,e.CHART_X,e.CHART_ETA],[0,0,0]);expressions[i]={'parameters':[e.R,e.Z,e.TIME,622791],'body':body}
 reg={'expression':expressions,'monotone':{2:{'name':'ActualCommonBandSlowInverse','variable':sv,'parameters':[e.Z,e.TIME],'body':chartbody,'left':19,'right':24}}}
 class Constants:
  def at(self,i):return SimpleNamespace(strict_positive=True)
  def ast(self,key):
   from fractions import Fraction
   return SimpleNamespace(lo=Fraction(0),hi=Fraction(1,16),strict_positive=True,strict_negative=False)
 return n,reg,Constants(),new

class ActualBodyDomains(unittest.TestCase):
 def run_audit(self,n,reg,c):return audit_actual_body_domains(n.__getitem__,reg,{'M':9239},617466,c)
 def changed(self,build):
  n,r,c,new=fixture();old=r['expression'][688]['body'];bad=build(new,n,r)
  r['expression'][688]['body']=new('add',old,new('multiply',0,bad))
  with self.assertRaises((PrimitiveGap,ValueError)):self.run_audit(n,r,c)
 def test_scoped_positive_fixture(self):
  n,r,c,_=fixture();d=self.run_audit(n,r,c)
  self.assertTrue(d['completeActualClosure']);self.assertTrue(d['allOperandsCheckedBeforeAlgebraicCancellation'])
  self.assertEqual(len(d['bodyRootsAndDefinitionHashes']),9);self.assertTrue(d['actualCpIntegralAudits']);self.assertTrue(d['actualCutoffBranchAudits'])
 def test_hidden_inverse_zero(self):self.changed(lambda new,n,r:new('inverse',0))
 def test_canceled_inverse_eta(self):self.changed(lambda new,n,r:new('inverse',e.ETA))
 def test_hidden_log_zero(self):self.changed(lambda new,n,r:new('log_positive',0))
 def test_hidden_negative_radical(self):self.changed(lambda new,n,r:new('sqrt_positive',20))
 def test_hidden_zero_radical_not_smooth(self):self.changed(lambda new,n,r:new('sqrt_positive',0))
 def test_zero_power_does_not_hide_inverse(self):self.changed(lambda new,n,r:new('integer_power',new('inverse',0),0))
 def test_unknown_native_canceled(self):
  def build(new,n,r):r['expression'][999]={'parameters':[e.X,e.ETA]};return new('actual_expression_partial',999,[e.X,e.ETA],[0,0])
  self.changed(build)
 def test_wrong_profile_tuple(self):self.changed(lambda new,n,r:new('actual_expression_partial',2,[e.X,e.Z],[0,0]))
 def test_wrong_profile_partial(self):self.changed(lambda new,n,r:new('actual_expression_partial',2,[e.X,e.ETA],[1,0]))
 def test_unknown_monotone_root(self):self.changed(lambda new,n,r:new('actual_monotone_root',99,e.Z,e.TIME))
 def test_unbound_coordinate(self):self.changed(lambda new,n,r:new('coordinate','not an admitted coordinate'))
 def test_unknown_conditional(self):self.changed(lambda new,n,r:new('smooth_piecewise',e.X,0,1,0,1,0))
 def test_bad_cutoff_middle(self):
  n,r,c,new=fixture();n[622845]['args'][4]=new('inverse',new('add',622831,new('multiply',20,622831)))
  with self.assertRaises((PrimitiveGap,ValueError)):self.run_audit(n,r,c)
 def test_bad_inactive_cutoff_branch(self):
  n,r,c,new=fixture();n[622845]['args'][3]=new('inverse',0)
  with self.assertRaises((PrimitiveGap,ValueError)):self.run_audit(n,r,c)
 def test_bad_cp_integrand_at_zero(self):
  n,r,c,new=fixture();n[617755]['args'][0]=new('inverse',617752)
  with self.assertRaises((PrimitiveGap,ValueError)):self.run_audit(n,r,c)
 def test_unknown_integral(self):self.changed(lambda new,n,r:new('definite_integral',1,e.X,0,1))
 def test_bad_cutoff_order(self):
  self.changed(lambda new,n,r:new('actual_expression_partial',680,[new('multiply',617438,617466)],[2]))

if __name__=='__main__':unittest.main()
