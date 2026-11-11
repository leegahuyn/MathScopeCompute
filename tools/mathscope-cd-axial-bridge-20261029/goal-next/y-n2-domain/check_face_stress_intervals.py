from os import environ
"""Check concrete signed bounds of face and nested stress endpoints."""
import collections,functools,hashlib,json
from fractions import Fraction
from pathlib import Path
D=Path(__file__).resolve().parent;root=D.parent;raw=(Path(environ["MATHSCOPE_N2_REACHED"])).read_bytes();assert hashlib.sha256(raw).hexdigest()=='4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32'
n=dict(json.loads(raw)['nodes']);cuts=json.loads((D/'binder-cuts.json').read_text());nested=json.loads((D/'nested-face-cuts.json').read_text()); assert len(cuts)==182 and all(not r['targetsReachedAfterCut'] for r in cuts);assert len(nested)==128 and sum(len(r['targets']) for r in nested)==256 and all(not r['reachedAfterCut'] for r in nested)
b=collections.defaultdict(list)
for i,v in n.items():
 if v['op']=='definite_integral':b[v['args'][1]].append((i,*v['args'][2:]))
@functools.lru_cache(None)
def nonneg(i):
 v=n[i];a=v['args'];o=v['op']
 if o=='rational':return Fraction(int(a[0]),int(a[1]))>=0
 if o in ('sqrt_positive','exp'):return True
 if o=='integer_power' and a[1]%2==0:return True
 if o in ('multiply','add'):return all(nonneg(j) for j in a)
 return False
face={r['binder'] for r in cuts if n[r['binder']]['args'][0].startswith('physical_norm_face')}; assert len(face)==160
endpoints=collections.Counter()
for j in face:
 for i,lo,hi in b[j]:endpoints[(lo,hi)]+=1
assert endpoints=={(0,28824):32,(28814,28824):128}
stress={r['binder'] for r in cuts if n[r['binder']]['args'][0].startswith(('n2_stress','n3_stress'))}; assert len(stress)==4
classes=collections.Counter();face_targets=set()
for j in stress:
 for i,lo,hi in b[j]:
  assert lo==28814
  if nonneg(hi):classes['syntactic']+=1
  elif hi in face:classes['nested_face']+=1;face_targets.add(i)
  elif hi==1451893:classes['slow_inverse']+=1
  else:raise ValueError((i,lo,hi,n[hi]))
assert classes=={'syntactic':798,'nested_face':256,'slow_inverse':2}
assert face_targets=={i for r in nested for i in r['targets']}
out={'schema':'MathScope.Y.N2.FaceStressIntervalReduction/1','faceBinders':len(face),'faceIntervals':{'0_to_Xplus':32,'Xminus_to_Xplus':128},'stressBinders':len(stress),'stressIntervals':dict(classes),'nestedFaceDomination':{'coordinates':128,'stressIntegralNodes':256,'failed':0},'assumptions':['exact source geometry 0<Xminus<Xplus','each syntactic sqrt expression and the operands of all inverse expressions are defined','actual slow inverse is evaluated on its declared image, giving s in [1/2,2]','capture-free simultaneous substitution and lazy branches','eta remains in native parameter domain'],'scope':'Endpoint nonnegativity and structural domination; not entire native caller-frame or derivative domain proof.','release':'HOLD'}
(D/'face-stress-intervals.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS face intervals and 1056 stress endpoint reduction with stated native assumptions')
