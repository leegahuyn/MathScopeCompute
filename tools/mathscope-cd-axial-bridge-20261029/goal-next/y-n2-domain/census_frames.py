from os import environ
"""Conservative N2 call-frame census: backwards fixed-point, sign syntax."""
import collections,functools,hashlib,json,sys
from fractions import Fraction
from pathlib import Path
D=Path(__file__).resolve().parent; root=D.parent;sys.path.insert(0,str(root/'y'))
from native_reference_scopes import actual_children
raw=(Path(environ["MATHSCOPE_N2_REACHED"])).read_bytes();assert hashlib.sha256(raw).hexdigest()=='4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32'; x=json.loads(raw);n=dict(x['nodes']);bs=dict(x['sourceBodies'])
reg=(Path(environ["MATHSCOPE_N2_REGISTRY"])).read_bytes();assert hashlib.sha256(reg).hexdigest()=='6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f';registry=json.loads(reg)['base'];e=json.loads(registry['expression']);mono=json.loads(registry['monotone']); assert mono[2]['name']=='ActualCommonBandSlowInverse' and mono[2]['left']==19 and mono[2]['right']==24 and mono[2]['parameters']==[1451872,1451873];assert n[19]=={'op':'rational','args':['1','2']} and n[24]=={'op':'rational','args':['2','1']}
assert n[1451889]=={'op':'actual_monotone_root','args':[2,1451872,1451873]} and n[1451893]=={'op':'multiply','args':[1451890,1451892]} and n[1451890]=={'op':'integer_power','args':[1451871,2]} and n[1451892]=={'op':'inverse','args':[1451891]} and n[1451891]=={'op':'multiply','args':[24,1451889]}
parents=collections.defaultdict(list);binders=collections.defaultdict(list)
for i,v in n.items():
 for j in actual_children(v)+bs.get(i,[]):
  if j in n:parents[j].append(i)
 if v['op']=='definite_integral':binders[v['args'][1]].append((i,v['args'][2],v['args'][3]))
targets=[i for i,v in n.items() if v['op']=='actual_background_even_profile' and v['args'][0] in (3,5)];assert len(targets)==37
q=collections.deque(targets);anc=set(q)
while q:
 for p in parents[q.popleft()]:
  if p not in anc:anc.add(p);q.append(p)
@functools.lru_cache(None)
def nonneg(i):
 v=n[i];a=v['args'];o=v['op']
 if o=='rational':return Fraction(int(a[0]),int(a[1]))>=0
 if o in ('sqrt_positive','exp'):return True
 if o=='integer_power' and a[1]%2==0:return True
 if o in ('multiply','add'):return all(nonneg(j) for j in a)
 return False
rows=[]
for i in sorted(anc):
 v=n[i];a=v['args']
 if v['op']!='actual_expression_partial' or not any(j in anc for j in bs.get(i,[])):continue
 f=e[a[0]]['parameters'];assert len(f)==len(a[1]);m=dict(zip(f,a[1]));assert len(m)==len(f)
 if 4756 not in m or m[4756]==4756:continue
 j=m[4756];rows.append((i,a[0],j))
classes=collections.Counter(); unknown=[]
for i,s,j in rows:
 if nonneg(j):classes['syntactic_nonnegative']+=1
 elif j==1451893:classes['nonnegative_given_actual_monotone_inverse_image']+=1
 elif n[j]['op']=='coordinate':classes['coordinate_needs_binder_transport']+=1;unknown.append((i,s,j))
 else:classes['other_needs_semantic_proof']+=1;unknown.append((i,s,j))
coords=sorted({j for _,_,j in unknown if n[j]['op']=='coordinate'})
patterns=collections.Counter()
for j in coords:
 if not binders[j]:patterns['no_reached_integral_with_binder']+=1
 else:
  for _,l,h in binders[j]:patterns[f'{l}:{h}']+=1
out={'schema':'MathScope.Y.N2.EvenProfileAncestrySignCensus/1','targetSystemProfileCount':len(targets),'backwardReachedNodes':len(anc),'radialExpressionActuals':len(rows),'syntacticNonnegativeRuleCounts':dict(classes),'coordinateCount':len(coords),'binderEndpointPatterns':dict(patterns),'noncoordinateUnknowns':[r for r in unknown if n[r[2]]['op']!='coordinate'][:20],'witnesses':[{'call':i,'expression':s,'radialActual':j,'node':n[j],'reachedIntegrals':binders[j][:4]} for i,s,j in unknown[:20]],'conditionalPhysicalFrame':'X #1451893=R²/(2 s) with s=#1451889 actual monotone system 2. Its source bracket [1/2,2] gives X>=0 wherever the declared original image permits this inverse; chart-image membership and eta bounds remain separate.','scope':'Backwards fixed-point over both branches and all typed native definitions. Syntactic nonnegativity is formal and assumes sqrt_positive/exp are defined. A binder existing in the graph is not proof of dominance or capture-free application. Upper bounds, eta/frame typing and active semantics require separate verification. Counts do not certify all actual caller contexts.','release':'HOLD'}
(D/'ancestry-sign-census.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps({k:out[k] for k in ('targetSystemProfileCount','backwardReachedNodes','radialExpressionActuals','syntacticNonnegativeRuleCounts','coordinateCount')}))
