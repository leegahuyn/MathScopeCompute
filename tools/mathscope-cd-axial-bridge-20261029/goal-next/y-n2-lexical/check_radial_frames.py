"""Conservative X actual frames of the five [0,X] native integrals."""
import collections,functools,hashlib,json,sys
from fractions import Fraction
from pathlib import Path
from os import environ
D=Path(__file__).resolve().parent;root=D.parent;sys.path.insert(0,str(root/'y'))
from native_reference_scopes import actual_children
raw=Path(environ["MATHSCOPE_N2_REACHED"]).read_bytes();assert hashlib.sha256(raw).hexdigest()=='4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32';x=json.loads(raw);n=dict(x['nodes']);bs=dict(x['sourceBodies'])
raw=Path(environ["MATHSCOPE_N2_REGISTRY"]).read_bytes();assert hashlib.sha256(raw).hexdigest()=='6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f';e=json.loads(json.loads(raw)['base']['expression'])
targets={120481,120503,123572,123594,123638};assert all(n[i]['op']=='definite_integral' and n[i]['args'][2:]==[0,4756] for i in targets)
edges={};parents=collections.defaultdict(list);bind=collections.defaultdict(list)
for i,v in n.items():
 edges[i]=[j for j in actual_children(v)+bs.get(i,[]) if j in n]
 for j in edges[i]:parents[j].append(i)
 if v['op']=='definite_integral':bind[v['args'][1]].append((i,*v['args'][2:]))
q=collections.deque(targets);anc=set(q)
while q:
 for i in parents[q.popleft()]:
  if i not in anc:anc.add(i);q.append(i)
@functools.lru_cache(None)
def nonneg(i):
 v=n[i];a=v['args'];o=v['op']
 if o=='rational':return Fraction(int(a[0]),int(a[1]))>=0
 if o in ('sqrt_positive','exp'):return True
 if o=='integer_power' and a[1]%2==0:return True
 if o in ('multiply','add'):return all(nonneg(j) for j in a)
 return False
cnt=collections.Counter();coord=collections.defaultdict(set);other=[]
for i in anc:
 v=n[i];a=v['args']
 if v['op']!='actual_expression_partial' or not any(j in anc for j in bs.get(i,[])):continue
 f=e[a[0]]['parameters'];assert len(f)==len(a[1]);m=dict(zip(f,a[1]));j=m.get(4756,4756)
 if j==4756:cnt['unchanged_or_no_X_formal']+=1
 elif nonneg(j):cnt['syntactic_nonnegative']+=1
 elif j==1451893:cnt['slow_inverse_nonnegative_on_image']+=1
 elif n[j]['op']=='coordinate':cnt['integral_coordinate']+=1;coord[j].add(i)
 else:other.append([i,j])
assert not other and cnt=={'syntactic_nonnegative':6036,'integral_coordinate':595,'unchanged_or_no_X_formal':55,'slow_inverse_nonnegative_on_image':4} and len(coord)==167
index={j:k for k,j in enumerate(sorted(coord))};known={i:0 for i in x['roots'] if i in anc};q=collections.deque(known)
while q:
 i=q.popleft();v=n[i];a=v['args'];state=known[i]
 for child in edges[i]:
  if child not in anc:continue
  incoming=state
  if '--negative-no-binders' not in sys.argv and v['op']=='definite_integral' and child==a[0] and a[1] in index and child not in a[2:]:incoming |= 1<<index[a[1]]
  prev=known.get(child);new=incoming if prev is None else prev&incoming
  if prev is None or new!=prev:known[child]=new;q.append(child)
fail=[(j,i) for j,calls in coord.items() for i in calls if i not in known or not(known[i]&(1<<index[j]))]
assert len(fail)==(595 if '--negative-no-binders' in sys.argv else 0)
patterns=collections.Counter()
for j in coord:
 name=n[j]['args'][0]
 if name.startswith('physical_norm_face'):
  assert len(bind[j])==1 and bind[j][0][1:] in [(0,28824),(28814,28824)];patterns['face_0_or_Xminus_to_Xplus']+=1
 elif name.startswith(('n2_stress','n3_stress')):patterns['stress_via_face_or_physical_endpoint']+=1
 elif j in (123480,123492):assert len(bind[j])==1 and bind[j][0][1:]==(0,28824);patterns['lower_0_to_Xplus']+=1
 elif j==123635:assert bind[j]==[(123638,0,4756)];patterns['prefix_0_to_outer_X']+=1
 else:raise ValueError((j,name))
assert patterns=={'face_0_or_Xminus_to_Xplus':160,'stress_via_face_or_physical_endpoint':4,'lower_0_to_Xplus':2,'prefix_0_to_outer_X':1}
out={'schema':'MathScope.Y.N2.RadialFiveIntegrals/1','fiveIntegralIds':sorted(targets),'ancestors':len(anc),'partialExpressionRadialFrameCounts':dict(cnt),'coordinateCount':len(coord),'binderDominanceFailures':len(fail),'coordinateBinderCategories':dict(patterns),'scope':'Conservative graph/dataflow classification, not a theorem of simultaneous substitution or all dynamic guards. The one [0,X] prefix binder is recursively dependent on an enclosing nonnegative X; a frame-sensitive induction starting with the physical source image is required. Stress endpoints use the independent face-stress-interval reduction.','release':'HOLD'}
(D/('radial-negative.json' if '--negative-no-binders' in sys.argv else 'radial-five.json')).write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps(out))
