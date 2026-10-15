"""Executed source regressions, negative controls and independent calculus."""
import copy
import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest
import sympy as sp
import remaining_closure as a
import conditional_pressure as pressure

ROOT=Path('/mnt/data')
SOURCE=Path(os.environ.get('N6_SOURCE',ROOT/'n6-domain-full'))
PREPARED=Path(os.environ.get('N6_PREPARED',ROOT/'n6-source/prepared'))
PRIOR=Path(os.environ.get('N6_PRIOR',ROOT/'n6-final'))
EVIDENCE=Path(os.environ.get('N6_EVIDENCE',ROOT/'n6-close1266/evidence'))
STAGE3=Path(os.environ.get('N6_STAGE3',ROOT/'stage3-package/MathScope_N6_Stage3_Verified/verify_domain_transport.py'))

class SourceTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.v3=a.load(STAGE3,'verified_v3',a.V3PIN)
  cls.g=cls.v3.Source(EVIDENCE/'prerequisite-replay/stage3-replay/source-cache.sqlite')
  from header_binding import bind_header_to_gzip
  head,_=bind_header_to_gzip(SOURCE/'original-parent.ndjson.gz',SOURCE/'header.json')
  cls.reg=cls.v3.registries(head)
  cls.p=a.read(PREPARED/'cartesian/checkpoints/cartesian-source-checkpoint.json')['cartesian']['scalarProgram']
  cls.prev=a.read(EVIDENCE/'prerequisite-replay/OBLIGATION_MATRIX_STAGE4.json')
  cls.old=a.read(PRIOR/'OBLIGATION_MATRIX.json')
  cls.result=a.read(EVIDENCE/'OBLIGATION_MATRIX_CONTINUATION.json')
  cls.guards=a.read(EVIDENCE/'GUARD_DISCHARGES.json')['rows']
 def changed(self,i,op,args):return lambda j:{'op':op,'args':args} if j==i else self.g(j)
 def coordinate(self,g=None,p=None):return a.coordinate_proof(p or self.p,g or self.g,SOURCE/'source')
 def endpoint(self,g=None,reg=None):return a.endpoint_proof(self.p,g or self.g,reg or self.reg)
 def reject_coordinate(self,i,op,args):
  with self.assertRaises(ValueError):self.coordinate(self.changed(i,op,args))
 def reject_endpoint(self,i,op,args):
  with self.assertRaises(ValueError):self.endpoint(self.changed(i,op,args))
 def test_authenticated_original_baseline(self):
  self.assertEqual(a.digest((EVIDENCE/'prerequisite-replay/OBLIGATION_MATRIX_STAGE4.json').read_bytes()),a.MATRIX4)
 def test_coordinate_guards_actual_nodes(self):
  q=self.coordinate();self.assertEqual(q['integerBandLower'],14);self.assertEqual(q['Nminus2Lower'],12);self.assertFalse(q['axisExtensionProved'])
 def test_complete_endpoint_argument_restoration(self):
  r=self.endpoint();self.assertTrue(r['allSixArgumentsExactlyEqual']);self.assertEqual(r['restoredSourceArguments'],[a.N,a.R,a.Z,a.T,a.Y0,a.Y1])
 def test_transitive_capture_graph(self):
  r=self.endpoint()['captureAudit'];self.assertEqual(r['sourceNodes'],136186);self.assertEqual(r['definitions'],84);self.assertTrue(r['forbiddenCaptureAbsent']);self.assertFalse(r['allReachedFunctionsDefinedOrSmooth'])
 def test_all_phase_domains_proved_before_cancel(self):
  r=self.endpoint();self.assertEqual(len(r['primitiveDomainChecks']),9);self.assertTrue(r['phaseDomainProof']['noUndefinedPhaseCancelled'])
 def test_partition_of_sixteen_original_guards(self):
  r=self.result;closed=set(r['newDischargedGuardIDs']);open_=set(r['remainingGlobalGuardIDs']);self.assertEqual(len(closed),6);self.assertEqual(len(open_),10)
  self.assertFalse(closed&open_);self.assertEqual(closed|open_,set(self.prev['remainingGlobalGuardIDs']))
 def test_no_false_complete_claim(self):
  r=self.result;self.assertEqual(r['after']['total'],1260);self.assertFalse(r['allOriginal1266Closed']);self.assertFalse(r['axisExtensionProved'])
 def test_original_230_jets_preserved(self):
  r=a.jet_request_audit(self.p,self.prev,self.g,self.reg);self.assertEqual(r['remaining'],230);self.assertEqual(r['newDischarged'],0)
  self.assertEqual(r['counts'],{'CONDITIONAL_NATIVE_HIGHER_PARTIAL':190,'UNPROVED_EARLIER_DERIVATIVE_BEFORE_ABSENT_DIRECTION':36,'NONTRIVIAL_PULLBACK':4})
  self.assertEqual(r['conditionalIdentityClasses'],133);self.assertTrue(all(x['status']=='OPEN' for x in r['rows']))
 def test_original_pde_1020_preserved(self):
  r=a.pde_dependency_audit(PREPARED,self.g,self.reg);self.assertEqual([len(x['rows']) for x in r['components']],[169,197,654]);self.assertEqual(r['newDischarged'],0)
 def test_conditional_pressure_matches_ten_guards(self):
  r=pressure.verify(self.p,self.g,self.reg,self.guards);self.assertEqual(set(r['targetOriginalGuardIDs']),set(self.result['remainingGlobalGuardIDs']));self.assertFalse(r['actualCompleteGrRegularityProved'])
 def test_actual_complete_gr_has_no_hidden_theta_capture(self):
  r=pressure.verify(self.p,self.g,self.reg,self.guards);self.assertTrue(r['completeGrHasNoThetaCapture']);self.assertEqual(r['thetaCaptureAuditNodes'],136186)
 def test_frozen_band_not_differentiated(self):self.assertTrue(self.result['coordinateProof']['coordinatesAreFixedBandParametersDuringDifferentiation'])
 def test_reject_band_threshold_reduction(self):self.reject_coordinate(4654,'rational',['1','1'])
 def test_reject_dropped_original_lower_bound(self):self.reject_coordinate(622785,'maximum',[622784])
 def test_reject_wrong_ceiling(self):self.reject_coordinate(617432,'floor',[617431])
 def test_reject_wrong_Nminus2(self):self.reject_coordinate(635046,'add',[1,a.N])
 def test_reject_Q_negative(self):self.reject_coordinate(622794,'rational',['-1','1'])
 def test_reject_changed_annular_map(self):self.reject_coordinate(622824,'multiply',[622821,1])
 def test_reject_changed_scalar_R(self):
  p=copy.deepcopy(self.p);p[2]={'op':'rational','args':['0','1']}
  with self.assertRaises(ValueError):self.coordinate(p=p)
 def test_reject_changed_source_domain_text(self):
  with tempfile.TemporaryDirectory() as t:
   d=Path(t)
   for n in ('source-global-current.mjs','source-global-band.mjs'):(d/n).write_bytes((SOURCE/'source'/n).read_bytes())
   (d/'source-global-band.mjs').write_text((d/'source-global-band.mjs').read_text()+'\nchanged\n')
   with self.assertRaises(ValueError):a.coordinate_proof(self.p,self.g,d)
 def test_reject_hidden_complete_gr_body_capture(self):
  self.reject_endpoint(3614891,'add',[1,a.BINDER])
 def test_reject_unknown_closure_operation(self):self.reject_endpoint(3614891,'unreviewed_hidden_limit',[1])
 def test_reject_nested_definition_capture(self):
  reg=dict(self.reg);reg['fixed']=copy.deepcopy(reg['fixed']);reg['fixed']['extraNativeBound']={'root':a.BINDER}
  with self.assertRaises(ValueError):self.endpoint(reg=reg)
 def test_reject_encoded_nested_capture(self):
  reg=dict(self.reg);reg['fixed']=dict(reg['fixed']);reg['fixed']['encodedNativeDefinition']=json.dumps({'hidden':a.BINDER})
  with self.assertRaises(ValueError):self.endpoint(reg=reg)
 def test_reject_incomplete_capture_budget(self):
  with self.assertRaises(ValueError):a.CaptureAudit(self.g,self.reg,max_nodes=10).run(3614891,{a.BINDER})
 def test_reject_endpoint_argument_swap(self):self.reject_endpoint(3615202,'m3_aux_expression_partial',[-22,[a.N,a.BINDER,a.T,a.Z,3615158,3615160],[0]*6])
 def test_reject_phase_sign(self):self.reject_endpoint(3615157,'add',[635059,3615156])
 def test_reject_phase_endpoint_shift(self):self.reject_endpoint(3615158,'add',[a.Y0,3615157,1])
 def test_reject_hidden_negative_log_constant(self):self.reject_endpoint(624040,'rational',['-1','1'])
 def test_reject_undefined_cancelling_phase(self):self.reject_endpoint(624050,'rational',['0','1'])
 def test_reject_log_division_by_zero(self):self.reject_endpoint(300172,'rational',['1','1'])
 def test_reject_phase_uses_wrong_binder(self):self.reject_endpoint(3615152,'multiply',[624049,a.Z])
 def test_reject_P_body_not_original_Haar_integral(self):
  reg=dict(self.reg);reg['expressionDefinitions']=list(reg['expressionDefinitions']);reg['expressionDefinitions'][23]={**reg['expressionDefinitions'][23],'body':1}
  with self.assertRaises(ValueError):pressure.verify(self.p,self.g,reg,self.guards)
 def test_reject_pressure_omits_cutoff_remainder(self):
  p=copy.deepcopy(self.p);p[257]=p[249]
  with self.assertRaises(ValueError):pressure.verify(p,self.g,self.reg,self.guards)
 def test_reject_phase_depends_on_Z(self):
  with self.assertRaises(ValueError):pressure.verify(self.p,self.changed(635059,'add',[a.R,a.Z]),self.reg,self.guards)
 def test_reject_Haar_endpoint_change(self):
  with self.assertRaises(ValueError):pressure.verify(self.p,self.changed(3615049,'definite_integral',[3615048,a.Y0,0,24]),self.reg,self.guards)
 def test_reject_jet_variable_reordering(self):
  p=copy.deepcopy(self.p);i=int(self.prev['remainingJetIDs'][0].split(':')[-1]);p[i]['args'][1].append(3)
  with self.assertRaises(ValueError):a.jet_request_audit(p,self.prev,self.g,self.reg)
 def test_reject_dropped_jet(self):
  prev=dict(self.prev);prev['remainingJetIDs']=prev['remainingJetIDs'][:-1]
  with self.assertRaises(ValueError):a.jet_request_audit(self.p,prev,self.g,self.reg)
 def test_reject_pde_coefficient_tamper(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);d=root/'cartesian/rational';d.mkdir(parents=True)
   src=PREPARED/'cartesian/rational/pde_component_0.json';r=a.read(src);r['reducedNumeratorTerms'][0]['coefficient']='999'
   a.write(d/src.name,r)
   with self.assertRaises(ValueError):a.pde_dependency_audit(root,self.g,self.reg)
 def test_reject_false_original_guard_id(self):
  old=copy.deepcopy(self.old);old['cumulativeGlobalGuardRows'][59]['originalGuard']['value']=1
  with self.assertRaises(ValueError):a.guard_rows(old,self.prev,self.result['coordinateProof'],self.result['endpointProof'])

class IndependentMathematicsTests(unittest.TestCase):
 def test_exact_homogeneity_symbolic(self):
  h=sp.symbols('h');self.assertEqual(sp.expand(2*(sp.Rational(1,2)-h)+2*h),1)
 def test_positive_radius_margin_exact(self):
  s,X,Xa=sp.symbols('s X Xa',positive=True)
  self.assertEqual((2*s*X).subs({s:sp.Rational(1,2),X:Xa/2}),Xa/2)
 def test_phase_transport_identity_symbolic(self):
  R,rho,z,t,y0,y1,v=sp.symbols('R rho z t y0 y1 v');psi=sp.Function('Psi');g=sp.Function('g');b=sp.Function('b');P=sp.Function('P')
  H=g(rho,z,t,y0+psi(rho)-psi(R),y1+v*(psi(rho)-psi(R)))-b(rho,z,t)*P(z,t)
  D=sp.diff(H,R)+sp.diff(psi(R),R)*(sp.diff(H,y0)+v*sp.diff(H,y1))
  self.assertEqual(sp.expand(D),0)
 def test_both_endpoint_arguments_symbolic(self):
  R,r,y0,y1,v=sp.symbols('R r y0 y1 v');psi=sp.Function('Psi');self.assertEqual((y0+psi(r)-psi(R)).subs(r,R),y0)
  self.assertEqual((y1+v*(psi(r)-psi(R))).subs(r,R),y1)
 def test_cutoff_remainder_cannot_be_dropped(self):
  R,L,U,y=sp.symbols('R L U y');chi=sp.Function('chi');p=(R-L)*sp.sin(y)-chi(R)*(U-L)*sp.sin(y)
  remainder=sp.diff(p,R)-sp.sin(y);self.assertEqual(sp.expand(remainder+(U-L)*sp.diff(chi(R),R)*sp.sin(y)),0)
  self.assertNotEqual(remainder,0)
 def test_pointwise_derivatives_do_not_imply_integral_rule(self):
  z=sp.symbols('z',positive=True);integral=z*sp.atan(1/z)
  self.assertEqual(sp.limit(integral/z,z,0,dir='+'),sp.pi/2)
  r=sp.symbols('r',positive=True);self.assertEqual(sp.limit(sp.diff(z*z/(z*z+r*r),z),z,0,dir='+'),0)
 def test_simultaneous_substitution_is_not_cascading(self):
  g=lambda i: {'op':'coordinate','args':['x'+str(i)]}
  c=a.PrimitiveCanonical(g);self.assertEqual(c.at(4,((4,5),(5,6))),('coordinate',5))
 def test_cancellation_collects_domain_before_zero(self):
  nodes={0:{'op':'rational','args':['0','1']},1:{'op':'rational','args':['-1','1']},2:{'op':'log_positive','args':[0]},3:{'op':'multiply','args':[1,2]},4:{'op':'add','args':[2,3]}}
  c=a.PrimitiveCanonical(nodes.__getitem__);self.assertEqual(c.at(4),a.ZERO);self.assertEqual(c.domains,{(2,'log_positive',0)})
 def test_phase_domain_checker_rejects_unknown_guard(self):
  with self.assertRaises(ValueError):a.phase_domain_proof(lambda i:None,{(1,'inverse',0)})

if __name__=='__main__':unittest.main(verbosity=2)
