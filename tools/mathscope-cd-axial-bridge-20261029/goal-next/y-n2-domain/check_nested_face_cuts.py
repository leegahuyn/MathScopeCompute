from os import environ
import json,sys,collections,time
from pathlib import Path
D=Path(__file__).resolve().parent;sys.path.insert(0,str(D.parent/'y'));from native_reference_scopes import actual_children
x=json.load(open(environ["MATHSCOPE_N2_REACHED"],encoding='utf8'));n=dict(x['nodes']);b=dict(x['sourceBodies']);eds={};stress=collections.defaultdict(set)
for i,v in n.items():
 eds[i]=[j for j in actual_children(v)+b.get(i,[]) if j in n]
 if v['op']=='definite_integral':
  ar=v['args'];nm=n[ar[1]]['args'][0]
  if nm.startswith(('n2_stress','n3_stress')) and n[ar[3]]['op']=='coordinate' and n[ar[3]]['args'][0].startswith('physical_norm_face'):
   stress[ar[3]].add(i)
rows=[];start=time.time()
for k,(binder,targets) in enumerate(stress.items()):
 seen=set(x['roots']);q=collections.deque(x['roots']);left=set(targets)
 while q and left:
  i=q.popleft();left.discard(i);v=n[i];ch=eds[i]
  if v['op']=='definite_integral' and v['args'][1]==binder:ch=[j for j in ch if j!=v['args'][0]]
  for j in ch:
   if j not in seen:seen.add(j);q.append(j)
 rows.append({'binder':binder,'targets':sorted(targets),'reachedAfterCut':sorted(targets-left)})
 if k%40==0:print('progress',k,round(time.time()-start,1),flush=True)
print('done',len(rows),'targets',sum(len(r['targets']) for r in rows),'failed',sum(bool(r['reachedAfterCut']) for r in rows));open(Path(__file__).resolve().with_name('nested-face-cuts.json'),'w').write(json.dumps(rows,indent=2)+'\n')
