from os import environ
"""Exact original N2 eta source frames and conservative lexical binder dominance."""
import collections,hashlib,json,sys
from pathlib import Path
D=Path(__file__).resolve().parent;root=D.parent;sys.path.insert(0,str(root/'y'))
from native_reference_scopes import actual_children
P=Path(environ["MATHSCOPE_N2_REACHED"]);raw=P.read_bytes(); assert hashlib.sha256(raw).hexdigest()=='4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32';x=json.loads(raw);n=dict(x['nodes']);bs=dict(x['sourceBodies'])
P=Path(environ["MATHSCOPE_N2_REGISTRY"]);raw=P.read_bytes();assert hashlib.sha256(raw).hexdigest()=='6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f';registry=json.loads(raw)['base'];expr=json.loads(registry['expression']);mon=json.loads(registry['monotone']);pic=json.loads(registry['picard']);assert [pic[i]['eta'] for i in (3,5)]==[2,2]
old=(Path(environ["MATHSCOPE_N1_REACHED"])).read_bytes();assert hashlib.sha256(old).hexdigest()=='5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459'; oldids={c['id'] for c in json.loads(old)['calls']}
natural={c['id'] for c in x['calls'] if c['id'] not in oldids}; profiles={i for i,v in n.items() if v['op']=='actual_background_even_profile' and v['args'][0] in (3,5)};assert len(natural)==44 and len(profiles)==37
assert all(n[i]['args'][2]==2 for i in natural) and all(n[i]['args'][3]==2 for i in profiles)
assert n[2]=={'op':'coordinate','args':['eta']} and n[20]=={'op':'rational','args':['-1','1']} and n[1]=={'op':'rational','args':['1','1']}
parents=collections.defaultdict(list);edges={};bind=collections.defaultdict(list)
for i,v in n.items():
 edges[i]=[j for j in actual_children(v)+bs.get(i,[]) if j in n]
 for j in edges[i]:parents[j].append(i)
 if v['op']=='definite_integral':bind[v['args'][1]].append((i,*v['args'][2:]))
q=collections.deque(natural|profiles);anc=set(q)
while q:
 for j in parents[q.popleft()]:
  if j not in anc:anc.add(j);q.append(j)
coord=collections.defaultdict(set);others=collections.Counter();ordinary=[]
for i in sorted(anc):
 v=n[i];a=v['args']
 if v['op']!='actual_expression_partial' or not any(j in anc for j in bs.get(i,[])):continue
 f=expr[a[0]]['parameters'];assert len(f)==len(a[1]);m=dict(zip(f,a[1]));assert len(m)==len(f);j=m.get(2,2)
 if j==2:others['unchanged_or_no_eta_formal']+=1
 elif n[j]['op']=='coordinate':coord[j].add(i)
 elif j==20:others['literal_minus_one']+=1
 elif j==1451898:others['slow_inverse_eta']+=1
 else:ordinary.append([i,j,n[j]])
assert not ordinary and others=={'unchanged_or_no_eta_formal':97,'literal_minus_one':2986,'slow_inverse_eta':6}
assert len(coord)==1536 and sum(map(len,coord.values()))==4312
assert all(len(bind[j])==1 and bind[j][0][1:]==(20,1) for j in coord)
# Must-property intersection: only transfer an integral binder to its body edge.
# All structural branches and native semantic-definition edges remain enabled.
index={j:k for k,j in enumerate(sorted(coord))};known={i:0 for i in x['roots'] if i in anc};queue=collections.deque(known);updates=0
while queue:
 i=queue.popleft();v=n[i];a=v['args'];state=known[i]
 for child in edges[i]:
  if child not in anc:continue
  incoming=state
  if '--negative-no-binders' not in sys.argv and v['op']=='definite_integral' and child==a[0] and a[1] in index and child not in a[2:]:incoming |= 1<<index[a[1]]
  prev=known.get(child)
  new=incoming if prev is None else prev & incoming
  if prev is None or new!=prev:known[child]=new;queue.append(child);updates+=1
fail=[]
for j,calls in coord.items():
 for i in calls:
  if i not in known or not (known[i] & (1<<index[j])):fail.append([j,i])
assert len(fail)==(4312 if '--negative-no-binders' in sys.argv else 0)
# The remaining six use eta=Z/s^D; the exact original monotone inverse system bracket and actual map are checked separately.
assert n[1451898]['op']=='multiply' and n[1451898]['args']==[1451872,1451897]
assert n[1451889]=={'op':'actual_monotone_root','args':[2,1451872,1451873]};assert mon[2]['name']=='ActualCommonBandSlowInverse' and mon[2]['left']==19 and mon[2]['right']==24
out={'schema':'MathScope.Y.N2.EtaFrameAudit/1','sourceNaturalTargets':44,'sourceEvenTargets':37,'sourceTargetsEtaFormal':2,'ancestryNodes':len(anc),'expressionFrameCategories':dict(others),'integralCoordinateCount':len(coord),'integralCoordinateCallCount':sum(map(len,coord.values())),'allEtaBinderEndpoints':[-1,1],'binderMustDominationFailed':len(fail),'failureSamples':fail[:20],'dataflowUpdates':updates,'scope':'Conservative graph proof for lexical integral body edges and direct actual_expression_partial frames only; typed definition applications and derivative/capture semantics require independent verification. The physical eta argument uses the original inverse only on its actual image; its relation to the preimage eta is a mathematical premise.','release':'HOLD'}
(D/('eta-negative.json' if '--negative-no-binders' in sys.argv else 'eta-frames.json')).write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps(out))
