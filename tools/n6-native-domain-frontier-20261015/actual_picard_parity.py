"""Exact reflection identities of every actual Picard coefficient expression.

This proves source expression identities on their defined domains. Smooth
coefficient domains and interface matching remain independent prerequisites.
"""
import argparse,hashlib,json,os
from functools import lru_cache
from pathlib import Path

RAW='b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1'
SYSTEM='c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60'
def digest(x):return hashlib.sha256(json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()

class Reflection:
 def __init__(self,nodes,xi):self.nodes=nodes;self.xi=xi
 @lru_cache(None)
 def parity(self,i,flipped=()):
  n=self.nodes[i];op,a=n['op'],n['args'];at=lambda k:self.parity(k,flipped)
  if op=='coordinate':return 1 if i==self.xi or i in flipped else 0
  if op=='rational':return 2 if int(a[0])==0 else 0
  if op=='source_parameter':return 0
  if op=='actual_natural_series':return 0 if at(a[1]) in (0,2) and at(a[2]) in (0,2) else None
  if op=='integer_power':
   q=at(a[0]);return 2 if q==2 and a[1]>0 else None if q is None else (q*a[1])%2
  if op=='inverse':return at(a[0])
  if op in ('sqrt_positive','exp','log_positive','source_step_derivative'):return 0 if at(a[0]) in (0,2) else None
  if op=='add':return self.common([at(c) for c in a])
  if op=='multiply':
   values=[at(c) for c in a];return 2 if 2 in values else None if None in values else sum(values)%2
  if op=='smooth_piecewise':
   return self.common([at(c) for c in a[3:]]) if all(at(c) in (0,2) for c in a[:3]) else None
  if op=='definite_integral':
   body,binder,left,right=a;pl,pr=at(left),at(right)
   assert binder!=self.xi,'The source integration binder shadows the reflected coordinate; an explicit scoped proof is required.'
   if left==right:return 2
   if pl in (0,2) and pr in (0,2):return self.parity(body,tuple(sorted(set(flipped)-{binder})))
   if pl in (1,2) and pr in (1,2):
    q=self.parity(body,tuple(sorted(set(flipped)|{binder})))
    return 2 if q==2 else None if q is None else (q+1)%2
   return None
  raise ValueError('Unknown source parity operation '+op)
 @staticmethod
 def common(values):
  nonzero=set(values)-{2}
  return next(iter(nonzero)) if len(nonzero)==1 else 2 if not nonzero else None

def inspect(nodes,system):
 r=Reflection(nodes,system['xi']);pattern=[0,0,0,0,1,1]
 forcing=[r.parity(i) for i in system['forcing']]
 matrices={key:[[r.parity(i) for i in row] for row in system[key]] for key in ('A0','A1')}
 assert all(q in (2,(pattern[i]-1)%2) for i,q in enumerate(forcing)),'Wrong actual forcing reflection'
 for matrix in matrices.values():
  assert all(q in (2,(pattern[i]-pattern[j]-1)%2) for i,row in enumerate(matrix) for j,q in enumerate(row)),'Wrong actual coefficient reflection'
 return forcing,matrices

def main():
 p=argparse.ArgumentParser();p.add_argument('--diagnostics',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 raw=a.diagnostics.read_bytes();assert hashlib.sha256(raw).hexdigest()==RAW;d=json.loads(raw)
 system=d['fullNativePayloads']['picard:0'];assert digest(system)==SYSTEM
 assert system['order']==1 and system['zeroAxisDatum']==[0]*6 and system['diagonal']==[0,0,2,0,3,1]
 nodes={int(k):v for k,v in d['argumentAndContextGraph'].items()}
 roots=[*sum(system['A0'],[]),*sum(system['A1'],[]),*system['forcing']];seen=set();todo=list(roots)
 while todo:
  i=todo.pop()
  if i in seen:continue
  seen.add(i);n=nodes[i];op,ar=n['op'],n['args']
  if op in ('rational','coordinate','source_parameter'):continue
  if op in ('integer_power','source_step_derivative'):ar=ar[:1]
  elif op=='actual_natural_series':ar=ar[1:3]
  else:assert op in ('add','multiply','inverse','sqrt_positive','exp','log_positive','definite_integral','smooth_piecewise'),op
  todo.extend(ar)
 assert len(seen)==3679
 forcing,matrices=inspect(nodes,system)
 controls=[]
 def reject(name,s):
  try:inspect(nodes,s)
  except AssertionError:controls.append({'name':name,'rejected':True})
  else:raise AssertionError('Accepted parity mutation '+name)
 changed=json.loads(json.dumps(system));changed['forcing'][3]=1;reject('changed actual odd forcing to a nonzero even constant',changed)
 changed=json.loads(json.dumps(system));changed['A0'][0][4]=system['xi'];reject('changed actual even cross-block coefficient to odd xi',changed)
 result={'schema':'MathScope.N6.ActualPicardReflectionParity/1','executionRun':os.environ.get('GITHUB_RUN_ID'),
 'diagnosticsSHA256':RAW,'sourcePicardSHA256':SYSTEM,'completeCoefficientNodes':len(seen),
 'coefficientSourceGraphSHA256':digest([[i,nodes[i]] for i in sorted(seen)]),
 'parityEncoding':{'0':'EVEN','1':'ODD','2':'IDENTICALLY_ZERO','null':'UNPROVED'},'actualForcingParity':forcing,'actualMatrixParities':matrices,
 'actualSolutionParity':[0,0,0,0,1,1],
 'sourceReflectionIdentitiesProved':True,'negativeControls':controls,
 'integralRule':'Even limits preserve the integrand reflection with the binder fixed. Odd limits reflect the binder and reverse orientation, giving one additional odd sign. A zero limit is compatible with either rule.',
 'conditionalSolutionConclusion':'Once actual coefficient regularity and locally normal Picard convergence are proved, uniqueness of the same zero-axis solution and reflection equivariance imply that its first four components are even in xi and last two are odd. No finite sample or numerical parity test is used.',
 'conditionalEvenProfileConclusion':'For a C-infinity even function f(xi,eta), f(sqrt(X),eta) has a C-infinity one-sided X extension at0. The original iterated-integral even-profile derivative formula follows from repeated FTC, including the source weights and factors2^-k.',
 'coefficientRegularityAndNormalConvergenceStillRequired':True,'newOriginalGuardDischarged':0,'newOriginalJetDischarged':0,'newOriginalPDEDischarged':0}
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'coefficientNodes':len(seen),'sourceReflectionIdentities':True,'negativeControls':len(controls),'newOriginalDischarged':0}))
if __name__=='__main__':main()
