"""Native finite-value controls; metadata fixtures are not graph proofs."""
import copy,unittest
from fractions import Fraction as Q
from actual_background_jet_regularity import ConstantDomains,Bound,Gap
from actual_background_profile_constants import make_profile_native_handler,ProfileConstantGap,HEADER,FIXED,LEADING_SCOPE,ONE_CONCLUSIONS,ORDER_ONE
# Original definition metadata only; the synthetic graph below does not
# evaluate original profile bodies or authenticate a source graph.
PROFILE_DEFINITIONS={2: {'name': 'ActualFinalLeadingF',
     'parameters': [4756, 2],
     'body': 71959,
     'derivativeLimits': [128, 128],
     'implementation': 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
     'unspecifiedOracle': False,
     'historicalBodyPreserved': True},
 3: {'name': 'ActualFinalLeadingU',
     'parameters': [4756, 2],
     'body': 9236,
     'derivativeLimits': [128, 128],
     'implementation': 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
     'unspecifiedOracle': False,
     'historicalBodyPreserved': True},
 4: {'name': 'ActualFinalLeadingVOverX',
     'parameters': [4756, 2],
     'body': 18778,
     'derivativeLimits': [128, 128],
     'implementation': 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
     'unspecifiedOracle': False,
     'historicalBodyPreserved': True},
 5: {'name': 'ActualFinalOrderOneF',
     'parameters': [4756, 2],
     'body': 29290,
     'derivativeLimits': [128, 128],
     'implementation': 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
     'unspecifiedOracle': False,
     'historicalBodyPreserved': True},
 6: {'name': 'ActualFinalOrderOneU',
     'parameters': [4756, 2],
     'body': 29289,
     'derivativeLimits': [128, 128],
     'implementation': 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
     'unspecifiedOracle': False,
     'historicalBodyPreserved': True},
 7: {'name': 'ActualFinalOrderOneVOverX',
     'parameters': [4756, 2],
     'body': 29440,
     'derivativeLimits': [128, 128],
     'implementation': 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
     'unspecifiedOracle': False,
     'historicalBodyPreserved': True},
 8: {'name': 'ActualFinalOrderOneStream',
     'parameters': [4756, 2],
     'body': 29334,
     'derivativeLimits': [128, 128],
     'implementation': 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
     'unspecifiedOracle': False,
     'historicalBodyPreserved': True},
 9: {'name': 'ActualFinalOrderOneAverage',
     'parameters': [4756, 2],
     'body': 29336,
     'derivativeLimits': [128, 128],
     'implementation': 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
     'unspecifiedOracle': False,
     'historicalBodyPreserved': True},
 10: {'name': 'ActualFinalOrderOnePressure',
      'parameters': [4756, 2],
      'body': 50558,
      'derivativeLimits': [128, 128],
      'implementation': 'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',
      'unspecifiedOracle': False,
      'historicalBodyPreserved': True}}

def fixture():
 reg={'expression':copy.deepcopy(PROFILE_DEFINITIONS)}
 roots={'F':reg['expression'][2]['body'],'U':reg['expression'][3]['body'],'v':reg['expression'][4]['body'],'M':9239}
 hashes={'leading':'a'*64,'orderone-binding':'b'*64,'orderone':'c'*64}
 leading={'schema':'MathScope.N6.ActualCompletedLeadingFrozenApplication/1','sourceHeaderSHA256':HEADER,
  'fixedDefinitionSHA256':FIXED,'provedActualCompletedLeading':{'regularity':LEADING_SCOPE},
  'actualCompletedLeadingRoots':roots,'inputSHA256':{'stream-binding':hashes['orderone-binding']}}
 one={'schema':'MathScope.N6.ActualOrderOnePrimitiveCalculus/1','actualAllOrderGlobalRegularityComposed':True,
  'remainingAnalyticPremises':[],'provedActualOrderOneConclusions':ONE_CONCLUSIONS.copy(),
  'inputSHA256':{'leading':hashes['leading'],'binding':hashes['orderone-binding']}}
 binding={'schema':'MathScope.N6.ActualOrderOnePrimitiveBinding/1','sourceHeaderSHA256':HEADER,
  'bodyRoots':ORDER_ONE.copy(),'actualLeadingRoots':{k:roots[k] for k in ['M','U','v']}}
 data={'leading':leading,'orderone':one,'orderone-binding':binding}
 # Three FTC face coordinates; X=(x1^2+x2^2)/2 includes the actual axis.
 n={0:{'op':'rational','args':['0','1']},1:{'op':'rational','args':['1','1']},
  2:{'op':'rational','args':['1','2']},3:{'op':'rational','args':['-1','1']},
  8001:{'op':'coordinate','args':['synthetic cartesian x1']},
  8002:{'op':'coordinate','args':['synthetic cartesian x2']},
  416267:{'op':'coordinate','args':['synthetic physical norm face eta']},
  8003:{'op':'integer_power','args':[8001,2]},8004:{'op':'integer_power','args':[8002,2]},
  8005:{'op':'add','args':[8003,8004]},416302:{'op':'multiply','args':[2,8005]},
  416306:{'op':'actual_expression_partial','args':[6,[416302,416267],[2,1]]}}
 env=tuple(sorted({8001:Bound(Q(-2),Q(2)),8002:Bound(Q(-2),Q(2)),416267:Bound(Q(-1),Q(1))}.items()))
 return reg,data,hashes,n,env

class ActualProfileConstantControls(unittest.TestCase):
 def setup_call(self,change=None):
  reg,data,hashes,n,env=fixture()
  if change:change(reg,data,hashes,n)
  handler=make_profile_native_handler(reg,data,hashes,Bound)
  c=ConstantDomains(n.__getitem__,{},native_handler=handler)
  return c,n,env
 def test_nativeU1_secondX_firstEta_axis_face_value_is_only_finite(self):
  c,n,env=self.setup_call();value=c.at(416306,env)
  self.assertEqual((value.lo,value.hi,value.strict_positive,value.strict_negative),(None,None,False,False))
  proof=c.domains[-1];self.assertTrue(proof['finiteAndContinuousOnActualClosedScopedBox'])
  self.assertTrue(proof['noMagnitudeSignOrNormUpperBoundClaimed']);self.assertFalse(proof['n2RegularityOrNormHonestyAssumed'])
  self.assertEqual(proof['argumentEnclosures'][0]['lo'],'0')
 def test_all_nine_actual_profile_definition_hashes_bound(self):
  for index in range(2,11):
   with self.subTest(index=index):
    c,n,env=self.setup_call();n[416306]['args'][0]=index;value=c.at(416306,env)
    self.assertIsNone(value.hi)
 def test_handler_disabled_by_default(self):
  _,_,_,n,env=fixture();c=ConstantDomains(n.__getitem__,{})
  with self.assertRaises(Gap):c.at(416306,env)
 def test_changed_actual_body_hash(self):
  with self.assertRaises(ProfileConstantGap):self.setup_call(lambda r,d,h,n:r['expression'][6].update(body=0))
 def test_changed_native_parameter_scope(self):
  with self.assertRaises(ProfileConstantGap):self.setup_call(lambda r,d,h,n:r['expression'][6].update(parameters=[4756,622803]))
 def test_oracle_profile_cannot_be_promoted(self):
  with self.assertRaises(ProfileConstantGap):self.setup_call(lambda r,d,h,n:r['expression'][6].update(unspecifiedOracle=True))
 def test_uncomposed_orderone_theorem_rejected(self):
  with self.assertRaises(ProfileConstantGap):self.setup_call(lambda r,d,h,n:d['orderone'].update(actualAllOrderGlobalRegularityComposed=False))
 def test_unresolved_all_order_premise_rejected(self):
  with self.assertRaises(ProfileConstantGap):self.setup_call(lambda r,d,h,n:d['orderone'].update(remainingAnalyticPremises=['missing axis proof']))
 def test_changed_leading_regular_domain_rejected(self):
  with self.assertRaises(ProfileConstantGap):self.setup_call(lambda r,d,h,n:d['leading']['provedActualCompletedLeading'].update(regularity='only X>0 eta=0'))
 def test_changed_body_binding_chain_rejected(self):
  with self.assertRaises(ProfileConstantGap):self.setup_call(lambda r,d,h,n:d['orderone']['inputSHA256'].update(binding='0'*64))
 def test_changed_fixed_header_rejected(self):
  with self.assertRaises(ProfileConstantGap):self.setup_call(lambda r,d,h,n:d['leading'].update(fixedDefinitionSHA256='0'*64))
 def test_native_negative_X_rejected(self):
  c,n,env=self.setup_call();n[416306]['args'][1][0]=3
  with self.assertRaises(Gap):c.at(416306,env)
 def test_native_eta_outside_closed_domain_rejected(self):
  c,n,env=self.setup_call();env=tuple((j,Bound(Q(-1),Q(101,100)) if j==416267 else b) for j,b in env)
  with self.assertRaises(Gap):c.at(416306,env)
 def test_unbound_eta_coordinate_rejected(self):
  c,n,env=self.setup_call();env=tuple((j,b) for j,b in env if j!=416267)
  with self.assertRaises(Gap):c.at(416306,env)
 def test_x_axis_itself_is_permitted(self):
  c,n,env=self.setup_call();n[416306]['args'][1][0]=0
  self.assertIsNone(c.at(416306,env).lo)
 def test_eta_endpoint_jets_permitted(self):
  for eta in [-1,1]:
   c,n,env=self.setup_call();env=tuple((j,Bound(Q(eta),Q(eta),eta>0,eta<0)) if j==416267 else (j,b) for j,b in env)
   self.assertIsNone(c.at(416306,env).hi)
 def test_both_argument_domains_checked_before_opaque_value(self):
  c,n,env=self.setup_call();n[8006]={'op':'inverse','args':[0]};n[416306]['args'][1][0]=8006
  with self.assertRaises(Gap):c.at(416306,env)
 def test_unknown_profile_native_rejected(self):
  c,n,env=self.setup_call();n[416306]['args'][0]=999
  with self.assertRaises(Gap):c.at(416306,env)
 def test_negative_native_partial_order_rejected(self):
  c,n,env=self.setup_call();n[416306]['args'][2]=[-1,1]
  with self.assertRaises(Gap):c.at(416306,env)
 def test_boolean_native_partial_order_rejected(self):
  c,n,env=self.setup_call();n[416306]['args'][2]=[True,1]
  with self.assertRaises(Gap):c.at(416306,env)
 def test_out_of_ABI_partial_order_rejected(self):
  c,n,env=self.setup_call();n[416306]['args'][2]=[129,1]
  with self.assertRaises(Gap):c.at(416306,env)
 def test_same_shared_native_rechecked_in_each_scoped_box(self):
  c,n,env=self.setup_call();c.at(416306,env)
  bad=tuple((j,Bound(Q(-2),Q(2)) if j==416267 else b) for j,b in env)
  with self.assertRaises(Gap):c.at(416306,bad)
 def test_no_native_value_sign_is_inferred(self):
  c,n,env=self.setup_call();n[8006]={'op':'inverse','args':[416306]}
  with self.assertRaises(Gap):c.at(8006,env)

if __name__=='__main__':unittest.main()
