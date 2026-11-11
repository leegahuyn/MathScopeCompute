from os import environ
import json,sys,collections,time
from pathlib import Path
D=Path(__file__).resolve().parent;sys.path.insert(0,str(D.parent/'y'));from native_reference_scopes import actual_children
x=json.load(open(environ["MATHSCOPE_N2_REACHED"],encoding='utf8'));n=dict(x['nodes']);b=dict(x['sourceBodies']);r=json.load(open(environ["MATHSCOPE_N2_REGISTRY"],encoding='utf8'));ex=json.loads(r['base']['expression'])
parents=collections.defaultdict(list);edges={}
for i,v in n.items():
 edges[i]=[j for j in actual_children(v)+b.get(i,[]) if j in n]
 for j in edges[i]:parents[j].append(i)
t=[i for i,v in n.items() if v['op']=='actual_background_even_profile' and v['args'][0] in (3,5)];q=collections.deque(t);anc=set(t)
while q:
 for p in parents[q.popleft()]:
  if p not in anc:anc.add(p);q.append(p)
coords=collections.defaultdict(set)
for i in anc:
 v=n[i];a=v['args']
 if v['op']=='actual_expression_partial' and any(j in anc for j in b.get(i,[])):
  m=dict(zip(ex[a[0]]['parameters'],a[1]));j=m.get(4756,4756)
  if j!=4756 and n[j]['op']=='coordinate':coords[j].add(i)
rows=[]; start=time.time()
for k,(binder,targets) in enumerate(coords.items()):
 seen=set(x['roots']);q=collections.deque(x['roots']);left=set(targets)
 while q and left:
  i=q.popleft();left.discard(i);v=n[i];ch=edges[i]
  if v['op']=='definite_integral' and v['args'][1]==binder:
   body=v['args'][0];ch=[j for j in ch if j!=body]
  for j in ch:
   if j not in seen:seen.add(j);q.append(j)
 rows.append({'binder':binder,'count':len(targets),'undominated':sorted(left ^ targets),'targetsReachedAfterCut':len(targets-left)})
 if k%40==0:print('progress',k,round(time.time()-start,1),flush=True)
print('done',len(rows),'all-bound',sum(r['targetsReachedAfterCut']==0 for r in rows),'part',sum(r['targetsReachedAfterCut']!=0 for r in rows))
open(Path(__file__).resolve().with_name('binder-cuts.json'),'w').write(json.dumps(rows,indent=2)+'\n')
