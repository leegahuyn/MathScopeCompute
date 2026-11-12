"""Reconstruct the exact original 67+13 pointwise polynomials using sparse rational algebra."""
import sys,json,hashlib
from pathlib import Path
from fractions import Fraction as Q
source=Path(sys.argv[1] if len(sys.argv)>1 else 'work/goal-next/final67/source').resolve();base=source/'research-ide/mathscope-m3/closure-evidence-20261023'
expected={'conditional_67jet_force_intervals.py':'6bd4527e1d0bf12bf78bc661e4890466d74b548432055f08bf92b819292bb3ee','compile_original_67jet_force_stencil.py':'758b29a60419a1e2c77d1255d7b1b298e20180adb6dfef3f3a75a0aa7976509b','rigorous_rational_intervals.py':'e5f63a02a7cef384eafb697be14f1e9c8dccca973b8c51b6e296a592c0f87616','verify_real_67jet_readiness.py':'8487f2bbf04483051f50ddd0e32491dfe5ef1fe1764a93ffca03ffdc244293f9','verify_original_N7_localization_67jet_independent.py':'f4996967623ae5b1ab448aad86a61d224d935a3bf1b7f3a05dbf3bf66643e07f'}
for name,pin in expected.items():assert hashlib.sha256((base/name).read_bytes()).hexdigest()==pin,name
sys.path.insert(0,str(base))
import conditional_67jet_force_intervals as C
from verify_real_67jet_readiness import load_source,REQ
req,reqsha=load_source(REQ); labels=req['requested_field_jets']+req['requested_cutoff_jets'];assert len(labels)==80 and len(set(labels))==80
n=82;zero=(0,)*n
def unit(i):
 e=[0]*n;e[i]=1;return tuple(e)
class V:
 def __init__(self,p):self.p={k:v for k,v in p.items() if v}
 @staticmethod
 def c(q):return V({zero:Q(q)})
 @staticmethod
 def var(i):return V({unit(i):Q(1)})
 def __add__(self,b):
  d=self.p.copy()
  for k,v in b.p.items():d[k]=d.get(k,Q(0))+v
  return V(d)
 def __neg__(self):return V({k:-v for k,v in self.p.items()})
 def __sub__(self,b):return self+-b
 def __mul__(self,b):
  d={}
  for k,v in self.p.items():
   for l,w in b.p.items():
    kl=tuple(a+b for a,b in zip(k,l));d[kl]=d.get(kl,Q(0))+v*w
  return V(d)
 def power(self,p):
  assert isinstance(p,int) and p>=0
  o=V.c(1)
  for _ in range(p):o=o*self
  return o
 def val(self,values):return sum((v*Q.__pow__(Q(1),1)*prod(values,i) for i,v in self.p.items()),Q(0))
 def json(self):return self

def prod(vals,exps):
 r=Q(1)
 for v,k in zip(vals,exps):
  if k:r*=v**k
 return r
orig=C.constant;C.constant=V.c
obj=C.ConditionalPointForce.__new__(C.ConditionalPointForce)
obj.values={key:V.var(i+2) for i,key in enumerate(labels)};obj.x=V.var(0);obj.y=V.var(1);obj.zero=V.c(0)
E=C.E; z=C.ZERO
vel=[obj.velocity(i,z) for i in range(3)];grad=[[obj.velocity(i,E[j]) for j in range(3)] for i in range(3)];pressure=obj.Cp(z)
force=[-obj.velocity(i,E[3])-sum((obj.velocity(i,C.add(E[d],E[d])) for d in range(3)),V.c(0))+sum((vel[d]*obj.velocity(i,E[d]) for d in range(3)),V.c(0))+obj.Cp(E[i]) for i in range(3)]
C.constant=orig
for k in (1,2):
 vals=[Q((i+k)%7-3,i%5+1) for i in range(80)];jets={key:[str(vals[i])]*2 for i,key in enumerate(labels)}
 xy={'x':['1/3','1/3'],'y':['-2/5','-2/5']};result=C.ConditionalPointForce(jets,xy).evaluate();allv=[Q(1,3),Q(-2,5),*vals]
 for p,actual in zip(vel,result['velocity_intervals']):assert str(p.val(allv))==actual[0]==actual[1]
 for p,actual in zip(force,result['defined_force_intervals']):assert str(p.val(allv))==actual[0]==actual[1]
 backend=C.ConditionalPointForce(jets,xy)
 for i in range(3):
  for j in range(3):
   actual=backend.velocity(i,E[j]).json();assert str(grad[i][j].val(allv))==actual[0]==actual[1]
 actual=backend.Cp(z).json();assert str(pressure.val(allv))==actual[0]==actual[1]
def encode(p):return [{'coefficient':str(c),'powers':[[i,x] for i,x in enumerate(exp) if x]} for exp,c in sorted(p.p.items())]
outputs={'velocity':[encode(a) for a in vel],'velocity_gradient':[[encode(a) for a in row] for row in grad],'localized_pressure':encode(pressure),'force':[encode(a) for a in force]}
binding_path=base.parent/'evidence/work-recovery-20261018T072604Z_b479c2d1/work/prune_recovery/energy/evidence/ACTUAL_ENERGY_OPERATOR_BINDING.json'
raw=binding_path.read_bytes();assert hashlib.sha256(raw).hexdigest()=='5dd07f5cd8d7b647f3afeb7cbbb03c6f0472c96e81bcf22c3fc071d46e0f74b2'
binding=json.loads(raw);assert binding['operatorRowsBoundToCapturedOriginal'] is True
keys={'x0':0,'x1':1,**{label:i+2 for i,label in enumerate(labels)}}
def original_poly(rows):
 out={}
 for term in rows:
  e=[0]*n
  if term['monomial']!='1':
   for key in term['monomial'].split('*'):e[keys[key]]+=1
  exp=tuple(e);out[exp]=out.get(exp,Q(0))+Q(term['coefficient'])
 return {k:v for k,v in out.items() if v}
origpol=binding['exactPolynomials']
for a,b in zip(vel,origpol['velocity']):assert a.p==original_poly(b)
for ar,br in zip(grad,origpol['velocityGradient']):
 for a,b in zip(ar,br):assert a.p==original_poly(b)
assert pressure.p==original_poly(origpol['pressure'])
for a,b in zip(force,origpol['directForce']):assert a.p==original_poly(b)
assert any(t['monomial']=='C@0,1,0*p@0,0,0,0' and t['coefficient']=='1' for t in origpol['directForce'][2]), 'missing cutoff-pressure commutator'
assert any(t['monomial'].count('*')>=3 for t in origpol['directForce'][0]), 'missing nonlinear force terms'
without_pressure=[t for t in origpol['directForce'][2] if t['monomial']!='C@0,1,0*p@0,0,0,0'];assert force[2].p!=original_poly(without_pressure)
nonlinear=next(t for t in origpol['directForce'][0] if t['monomial'].count('*')>=3);without_nonlinear=[t for t in origpol['directForce'][0] if t is not nonlinear];assert force[0].p!=original_poly(without_nonlinear)
manifest={'schema':'MathScope.Annular.ExactOriginal67Plus13LocalizationPolynomial/1','scope':'symbolic original stencil only; no actual field or global assertion','sourceRequestSHA256':reqsha,'sourceFilesSHA256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (base/'conditional_67jet_force_intervals.py',base/'compile_original_67jet_force_stencil.py',base/'verify_original_N7_localization_67jet_independent.py')},'variables':['x','y']+labels,'outputs':outputs,'regression':{'twoRational80JetComparisonsToOriginalIntervalBackend':'PASS','all16PolynomialsEqualCapturedOriginalBinding':'PASS','capturedBindingSHA256':'5dd07f5cd8d7b647f3afeb7cbbb03c6f0472c96e81bcf22c3fc071d46e0f74b2','cutoffPressureAndNonlinearOmissionControls':'PASS'},'release':'HOLD'}
out = Path(__file__).resolve().parent / 'original-67plus13-polynomials.json'
# Keep the archived bytes identical across operating systems.
out.write_bytes((json.dumps(manifest, indent=1).replace('\n', '\r\n') + '\r\n').encode())
print(json.dumps({
    'terms_velocity': [len(x.p) for x in vel],
    'terms_force': [len(x.p) for x in force],
    'backend_comparisons': 'PASS',
    'receipt': str(out),
}))
