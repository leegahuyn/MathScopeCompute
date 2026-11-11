from os import environ
import json,collections,sys
from pathlib import Path
D=Path(__file__).resolve().parent;sys.path.insert(0,str(D.parent/'y'));from native_reference_scopes import actual_children
x=json.load(open(environ["MATHSCOPE_N2_REACHED"],encoding='utf8')); n=dict(x['nodes']); bs=dict(x['sourceBodies']); target=120278; binder=120276
for cut in (False,True):
 seen=set(x['roots']); q=collections.deque(x['roots'])
 while q and target not in seen:
  i=q.popleft();v=n[i];ch=actual_children(v)+bs.get(i,[])
  if cut and v['op']=='definite_integral' and v['args'][1]==binder:ch=[j for j in ch if j!=v['args'][0]]
  for j in ch:
   if j in n and j not in seen:seen.add(j);q.append(j)
 print('cut',cut,'target_reachable',target in seen)
 assert (target in seen) != cut
