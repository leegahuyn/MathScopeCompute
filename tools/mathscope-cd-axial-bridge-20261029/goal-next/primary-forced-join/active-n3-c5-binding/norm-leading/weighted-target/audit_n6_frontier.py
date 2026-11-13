#!/usr/bin/env python3
"""Classify only the actual native N6 ancestry inside the already exported K frontier."""
import argparse,collections,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--frontier',type=Path,default=Path('work/goal-next/continuation37/hosted-43368204121-n3/primary-K-arithmetic-frontier.json'));p.add_argument('--out',type=Path);a=p.parse_args()
raw=a.frontier.read_bytes();digest=hashlib.sha256(raw).hexdigest();assert digest=='fbaea5bd2475e54919cef4099479c1c6ad6ad48dc68225190ea9f6c127f07aaa'
x=json.loads(raw);assert x['prefix']==3 and x['graphNamespace']=='norm' and x['roots']['weightedTarget'][-1]==17761755
nodes={r['id']:r['node'] for r in x['nodes']};boundary={r['id']:r['op'] for r in x['nonArithmeticBoundaries']}
assert len(nodes)==len(x['nodes']) and len(boundary)==len(x['nonArithmeticBoundaries'])
root=17761755;seen={root};queue=[root];leaves={}
unary={'integer_power','inverse','exp','log_positive','sqrt_positive','ceiling','ceiling_nonnegative'}
for i in queue:
 n=nodes[i];op=n['op'];args=n['args']
 if i in boundary:
  assert op==boundary[i];leaves[i]=op;continue
 if op in ('rational','source_parameter'):continue
 if op in unary:children=args[:1]
 elif op in ('add','multiply','maximum'):children=args
 else:raise AssertionError(('unexpected native target ancestry op',i,op))
 for child in children:
  assert child in nodes,(i,child)
  if child not in seen:seen.add(child);queue.append(child)
stats=collections.Counter(leaves.values())
out={'status':'PASS','sourceRootN6':root,'ancestorNodeCount':len(seen),'nonArithmeticBoundaryCount':len(leaves),
 'boundaryOpCounts':dict(stats),'boundaryFirstIds':sorted(leaves)[:15],'boundaryLastIds':sorted(leaves)[-15:],
 'allBoundaryIDs':sorted(leaves),'sourceParameters':sorted({nodes[i]['args'][0] for i in seen if nodes[i]['op']=='source_parameter'}),
 'scope':'Exact ancestry classification only; no boundary values assigned and no N6 endpoint inferred.',
 'sourceFrontierSHA256':digest,'release':'HOLD'}
txt=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(txt,encoding='utf8',newline='\n')
print(json.dumps({k:out[k] for k in ('status','sourceRootN6','ancestorNodeCount','nonArithmeticBoundaryCount','boundaryOpCounts')}))
