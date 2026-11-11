"""Structural finite-induction premises for five [0,X] integrals."""
import collections,functools,hashlib,json,sys
from fractions import Fraction
from pathlib import Path
from os import environ
D=Path(__file__).resolve().parent;root=D.parent;sys.path.insert(0,str(root/'y'))
from native_reference_scopes import actual_children
raw=Path(environ["MATHSCOPE_N2_REACHED"]).read_bytes();assert hashlib.sha256(raw).hexdigest()=='4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32';x=json.loads(raw);n=dict(x['nodes']);bs=dict(x['sourceBodies'])
raw=Path(environ["MATHSCOPE_N2_REGISTRY"]).read_bytes();assert hashlib.sha256(raw).hexdigest()=='6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f';r=json.loads(raw);ex=json.loads(r['base']['expression']);gf=json.loads(r['base']['m3GlobalFields']);af=json.loads(r['fieldDefinitions']);pulse=json.loads(r['base']['m3GlobalPulses'])
targets={120481,120503,123572,123594,123638};edges={};parents=collections.defaultdict(list)
for i,v in n.items():
 edges[i]=[j for j in actual_children(v)+bs.get(i,[]) if j in n]
 for j in edges[i]:parents[j].append(i)
q=collections.deque(targets);anc=set(q)
while q:
 for i in parents[q.popleft()]:
  if i not in anc:anc.add(i);q.append(i)
# Topological ordering of the full conservative semantic ancestor graph.
ind={i:0 for i in anc}
for i in anc:
 for j in edges[i]:
  if j in anc:ind[j]+=1
q=collections.deque(i for i in ind if ind[i]==0);seen=0
while q:
 i=q.popleft();seen+=1
 for j in edges[i]:
  if j in ind:
   ind[j]-=1
   if not ind[j]:q.append(j)
assert seen==len(anc)==70518
free={}
for i in sorted(n):
 v=n[i];a=v['args'];o=v['op'];children=[j for j in actual_children(v) if j in n];assert all(j<i for j in children)
 if i==4756:free[i]=True
 elif o=='definite_integral':free[i]=free.get(a[2],False) or free.get(a[3],False) or (a[1]!=4756 and free.get(a[0],False))
 else:free[i]=any(free[j] for j in children)
assert all(not free[i] for i in x['roots'])
counts=collections.Counter();missing_formal_systems=set()
for i in anc:
 v=n[i];a=v['args'];hit=any(j in anc for j in bs.get(i,[]))
 if not hit:continue
 op=v['op'];counts[op]+=1
 if op=='actual_expression_partial':
  f=ex[a[0]]['parameters']
  if 4756 not in f:missing_formal_systems.add(a[0])
 elif op=='m3_global_indexed_partial':assert 4756 not in gf[a[0]]['parameters'] and all(4756 not in row['localParameters'] for row in gf[a[0]]['rows'])
 elif op=='m3_aux_indexed_partial':assert 4756 not in af[a[0]]['parameters'] and all(4756 not in row['localParameters'] for row in af[a[0]]['rows'])
 elif op=='actual_covariance_volterra':assert 4756 not in json.loads(pulse[a[0]]['originalDefinition'])['parameters']
 else:raise ValueError((i,op))
assert counts=={'actual_expression_partial':6690,'m3_aux_indexed_partial':39,'actual_covariance_volterra':4,'m3_global_indexed_partial':4}
assert all(not free[ex[i]['body']] for i in missing_formal_systems)
rad=json.loads((D/'radial-five.json').read_text());pos=json.loads((root/'y-n2-domain/face-stress-intervals.json').read_text());src=json.loads((D/'original-source-guards.json').read_text());eta=json.loads((root/'y-n2-eta/slow-eta-frame.json').read_text());assert rad['binderDominanceFailures']==0 and rad['coordinateBinderCategories']['prefix_0_to_outer_X']==1 and pos['nestedFaceDomination']['failed']==0 and src['sourceCommit']=='a9b3a5b317525f6d0a71e2e356b054c9d25d2e60' and eta['checkedReachedNativeRows']=={'global':243,'aux':972}
# Minimal negative control for a false premise: a binder in [0,X] need not be nonnegative when X<0.
assert Fraction(-1,2) in (Fraction(-1,2),) and min(Fraction(0),Fraction(-1))<=Fraction(-1,2)<=max(Fraction(0),Fraction(-1)) and Fraction(-1,2)<0
out={'schema':'MathScope.Y.N2.FiniteRadialFrameInduction/1','targetIntegrals':sorted(targets),'conservativeAncestorDAGNodes':seen,'XNotFreeAtAllNineSourceRoots':True,'nativeEntries':dict(counts),'noXFormalExpressionSystems':len(missing_formal_systems),'allNoXFormalBodiesLackFreeX':True,'linkedEvidence':['radial-five.json','face-stress-intervals.json','original-source-guards.json','slow-eta-frame.json'],'conditionalInduction':'On each finite source-evaluation frame, begin with valid physical slow inverse s>0 and X=R^2/(2s)>=0; assume source operations and chart arguments are defined. Preserve nonnegativity through unchanged X, the syntactically nonnegative expressions, the verified positive endpoints and lexical binders, and the original simultaneous capture-free substitutions. For prefix 123638, incoming X>=0 gives binder 123635 in [0,X], so the rebound X at call 123637 is nonnegative. Propagate along the finite acyclic source reach. This applies to values and lexical frame ranges under the original source semantics.','remaining':'The physical reference image, original fixed-label and endpoint derivative semantics, full natural-series Y upper bounds and Picard evaluations need their separate proofs. The induction does not itself certify a jet, native convergence, or RELEASE.','negativeControl':'X=-1 and binder=-1/2 satisfies [X,0] but is negative, so the nonnegative incoming-frame condition is necessary.','release':'HOLD'}
(D/'finite-frame-induction.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS finite acyclic original frame audit with explicit source-semantic hypotheses')
