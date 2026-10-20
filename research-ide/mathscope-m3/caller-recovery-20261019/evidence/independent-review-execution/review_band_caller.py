from pathlib import Path
from fractions import Fraction as Q
from math import isqrt
import sys,json,hashlib,datetime,importlib.util
import mpmath as mp
import sympy as sp
root=Path('/workspace/scratch/00fe7982b3e1/MathScopeCompute')
unit=root/'research-ide/mathscope-m3/caller-recovery-20261019'
paths=[unit/'band_caller.py',unit/'README_KO.md',unit/'build_caller_dossier.py',unit/'verify_band_caller.py',unit/'evidence/CALLER_SOURCE_CAPSULE.json',unit/'evidence/BAND_CALLER_VALIDATION.json']
def pin(p):
 b=p.read_bytes();return {'path':str(p.relative_to(root)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
before=[pin(p) for p in paths]
capsule=json.loads((unit/'evidence/CALLER_SOURCE_CAPSULE.json').read_text())
checks=[]
def check(name,ok,**data):
 checks.append({'name':name,'pass':bool(ok),**data})
 if not ok:raise AssertionError(name)
source_data={}
for name,item in capsule['source_files'].items():
 p=root/item['path'];b=p.read_bytes()
 check('source_file_exact_bytes',len(b)==item['bytes'] and hashlib.sha256(b).hexdigest()==item['sha256'],source=name,path=item['path'])
 if name in ['closure','direct','transitive']:source_data[name]=json.loads(b)
record_count=0
for k,node in capsule['source_nodes'].items():
 for origin in capsule['source_record_origins'][k]:
  records=source_data[origin]['newRecords' if origin=='transitive' else 'records']
  if records[k]!=node:raise AssertionError('source record mismatch '+k)
 record_count+=1
check('all_capsule_records_match_original_source_maps',record_count==capsule['source_node_count'],record_count=record_count)
spec=importlib.util.spec_from_file_location('reviewed_band_caller',unit/'band_caller.py')
m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
caller=m.ActualBandCaller();I=caller.native.Interval
mp.mp.dps=240
for numerator in range(32,129):
 s=Q(numerator,64)
 literal=int(mp.floor(mp.mpf('0.5')-mp.log(mp.mpf(s.numerator)/s.denominator,2)))
 check('literal_log_center_point',m.center_offset(I.point(s))==literal,s=str(s),offset=literal)
for radicand in [Q(1,2),Q(2)]:
 scale=2**80
 n=isqrt((radicand.numerator*scale*scale)//radicand.denominator)
 lo,hi=Q(n,scale),Q(n+1,scale)
 check('irrational_center_threshold_strictly_enclosed',lo*lo<radicand<hi*hi)
 check('center_threshold_crossing_remains_open',m.center_offset(I(lo,hi)) is None,radicand=str(radicand))
for numerator in range(1,257):
 s=Q(numerator,64)
 literal=abs(mp.log(mp.mpf(s.numerator)/s.denominator,2))<mp.mpf(3)/4
 expected='ORIGINAL_BAND_GUARD_ACTIVE' if literal else 'EXACT_ZERO_BY_ORIGINAL_BAND_GUARD'
 check('literal_log_support_point',m.band_guard(I.point(s))==expected,s=str(s))
for center in [mp.power(2,-mp.mpf(3)/4),mp.power(2,mp.mpf(3)/4)]:
 scale=2**80
 n=int(mp.floor(center*scale));lo,hi=Q(n,scale),Q(n+1,scale)
 check('support_threshold_crossing_remains_open',m.band_guard(I(lo,hi))=='BAND_GUARD_BOUNDARY_OPEN',interval=[str(lo),str(hi)])
r,s=sp.symbols('r s',positive=True);z,t=sp.symbols('Z T',real=True);h=sp.symbols('h',real=True)
F=lambda a,b,c:a-b**2*a**(2*h)-c
res=sp.powsimp(sp.expand_power_base(F(r*s,r**(sp.Rational(1,2)-h)*z,r*t)-r*F(s,z,t),force=True),force=True)
check('full_positive_variable_residual_covariance_identity',sp.simplify(res)==0)
check('eta_transport_identity',sp.simplify(sp.expand_power_base((r**(sp.Rational(1,2)-h)*z)/(r*s)**(sp.Rational(1,2)-h)-z/s**(sp.Rational(1,2)-h),force=True))==0)
R=sp.Symbol('R',real=True)
check('radial_guard_transport_identity',sp.simplify((sp.sqrt(r)*R)**2/(2*r*s)-R**2/(2*s))==0)
for bits in [16,32,512]:
 for root_s in [Q(1,2),Q(1),Q(2)]:
  out=caller.evaluate(I.point(0),I.point(root_s),bits)
  check('original_formal_chart_status_not_promoted',out['actual_global_last_resolved_tau'] is None and out['new_M3_closures']==0 and not out['whole_K_field_evaluated'] and not out['actual_external_global_point_bound'] and not out['ell_ge_ell0_verified'] and not out['fixed_mesh_ceilings_evaluated'] and not out['original_radial_endpoint_integrals_evaluated'])
  for candidate in out['candidates']:
   delta=candidate['label_minus_reference_ell'];ratio=Q(candidate['Q_reference_over_Q_label']);epsilon=Q(candidate['error_budget']['exp_correction_argument_bound'])
   check('epsilon_domain_proven_at_resource_extremes',abs(delta)<=2 and 0<=epsilon<=Q(1,2**47))
   lower,upper=map(Q,candidate['fixed_label_derivative_multipliers']['dZ'])
   qmp=lambda q:mp.mpf(q.numerator)/q.denominator
   h_upper=Q(candidate['source_h']['closed_enclosure'][1])
   for portion in [Q(0),Q(1,3),Q(1)]:
    h_probe=h_upper*portion
    exact=qmp(ratio)**(mp.mpf('0.5')-qmp(h_probe))
    check('independent_axial_envelope_extremes',qmp(lower)<=exact<=qmp(upper),bits=bits,delta=delta,h_probe_scope='h-envelope algorithm control; not actual source h',h_fraction_of_upper=str(portion))
for name,node_id,expected in [('center',632179,{'op':'multiply','args':[20,632178]}),('support_left',625191,{'op':'rational','args':['-3','4']}),('support_right',120836,{'op':'rational','args':['3','4']})]:
 check('reviewed_literal_source_node',capsule['source_nodes'][str(node_id)]==expected,name_detail=name,node=node_id)
after=[pin(p) for p in paths]
check('reviewed_files_stable_during_review',before==after)
receipt={
 'schema':'MathScope.IndependentBandCallerReview/1','observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/remote_state','status':'PASS_WITHIN_DECLARED_FORMAL_CHART_SCOPE','concrete_defects':[],
 'reviewed_files':before,
 'manual_review':{
  'center_and_ties':'For s in[1/2,2], floor(1/2-log2(s)) equals1 for s^2<=1/2,0 for1/2<s^2<=2,and-1 for s^2>2. Integer translation removes ell exactly; rational boxes that straddle either irrational threshold remain OPEN. No tie rounding is introduced.',
  'support':'For positive s,r, abs(log2(r*s))<3/4 is exactly1/8<(r*s)^4<8. The fourth power is monotone on positive values. Closed boxes wholly outside the strict support return zero; crossing boxes remain OPEN. This does not classify the independent radial guard.',
  'covariance':'For positive r,s, F(r*s;r^(1/2-h)Z,rT)=rF(s;Z,T), eta is unchanged,and Rprime^2/(2*sprime)=R^2/(2*s). Active band support puts transported root strictly inside original(1/2,2). The statements concern correlated transports of original input points, not every Cartesian combination of returned marginal intervals.',
  'axial_enclosure':'Integer center offset and candidate displacement force |delta|<=2. With bits>=16,epsilon=|delta|*2^(-bits-32)<=2^-47<1. For x=h*|delta|*log(2) in[0,epsilon], exp(-x) lies in[1-epsilon,1] and exp(x) lies in[1,1/(1-epsilon)]. Positive sqrt(r) outward enclosures preserve the product bounds. Actual h stays strictly positive.',
  'scope':'Actual external global R/Z/T provenance, integer ell>=ell0/coefficient window, fixed mesh ceilings/representative inputs, radial integrals and nonzero whole-K fields remain unverified. No N7-06/N8-05 closure, no new M3 closure,and tau remains null. Frozen-label derivative multipliers hold both integer labels fixed; no derivative of the nearest-label map is claimed.'
 },
 'independent_checks':checks,'check_count':len(checks),'all_checks_pass':all(c['pass'] for c in checks),
 'method':'Read original source records and byte pins; direct literal-log comparisons; full symbolic positive-variable transport identities;240-dps h-envelope endpoint controls at16/32/512 bits. Existing232-check producer was not rerun.',
 'limitations':['Finite high-precision checks supplement the exact inequalities and do not prove whole-K numerical obligations.','Positive h-envelope probes including endpoints are algorithm controls, not replacement parameters for the actual source h.','Actual original integration, mesh selection and global provenance are outside this module.'],
 'N7_06_closed':False,'N8_05_closed':False,'new_M3_closures':0,'actual_global_last_resolved_tau':None
}
out=unit/'evidence/INDEPENDENT_BAND_CALLER_REVIEW.json'
if out.exists():raise RuntimeError('Refuse overwrite independent receipt')
out.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':receipt['status'],'checks':len(checks),'record_count':record_count,'module_sha256':before[0]['sha256'],'receipt':str(out)}))
