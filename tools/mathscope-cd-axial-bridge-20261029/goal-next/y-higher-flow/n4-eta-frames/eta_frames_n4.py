"""N4 source natural/even eta frames with lexical integral must-dataflow."""
import argparse,collections,hashlib,json,sys
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('reach',type=Path);p.add_argument('registry',type=Path);p.add_argument('helper',type=Path);p.add_argument('out',type=Path);p.add_argument('--negative-no-binders',action='store_true');a=p.parse_args()
def read(path,pin):
 b=path.read_bytes();assert hashlib.sha256(b).hexdigest()==pin,path;return b
assert hashlib.sha256(a.helper.read_bytes()).hexdigest()=='37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758'
sys.path.insert(0,str(a.helper.parent));from native_reference_scopes import actual_children
x=json.loads(read(a.reach,'1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc'));n=dict(x['nodes']);bs=dict(x['sourceBodies'])
reg=json.loads(read(a.registry,'049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad'))['base'];expr=json.loads(reg['expression']);mon=json.loads(reg['monotone']);pic=json.loads(reg['picard'])
natural={c['id'] for c in x['calls']};profiles={i for i,v in n.items() if v['op']=='actual_background_even_profile'}
assert len(natural)==597 and len(profiles)==259 and all(n[i]['args'][2]==2 for i in natural) and all(n[i]['args'][3]==2 for i in profiles)
assert [pic[i]['eta'] for i in (0,3,5,7,9)]==[2]*5
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
coord=collections.defaultdict(set);others=collections.Counter();unknown=[];samples=collections.defaultdict(list)
for i in sorted(anc):
 v=n[i];av=v['args']
 if v['op']!='actual_expression_partial' or not any(j in anc for j in bs.get(i,[])):continue
 f=expr[av[0]]['parameters'];assert len(f)==len(av[1]);m=dict(zip(f,av[1]));assert len(m)==len(f);j=m.get(2,2)
 if j==2:k='unchanged_or_no_eta_formal'
 elif j==20:k='literal_minus_one'
 elif j==1:k='literal_plus_one'
 elif j==4587663:k='slow_inverse_eta'
 elif n[j]['op']=='coordinate':coord[j].add(i);continue
 else:unknown.append([i,j,n[j]]);continue
 others[k]+=1
 if len(samples[k])<8:samples[k].append(i)
assert not unknown,unknown[:10]
bad_binders={j:bind[j] for j in coord if len(bind[j])!=1 or bind[j][0][1:]!=(20,1)}
assert not bad_binders,list(bad_binders.items())[:5]
index={j:k for k,j in enumerate(sorted(coord))};known={i:0 for i in x['roots'] if i in anc};queue=collections.deque(known);updates=0
while queue:
 i=queue.popleft();v=n[i];av=v['args'];state=known[i]
 for child in edges[i]:
  if child not in anc:continue
  incoming=state
  if not a.negative_no_binders and v['op']=='definite_integral' and child==av[0] and av[1] in index and child not in av[2:]:incoming|=1<<index[av[1]]
  prev=known.get(child);new=incoming if prev is None else prev&incoming
  if prev is None or new!=prev:known[child]=new;queue.append(child);updates+=1
fail=[]
for j,calls in coord.items():
 for i in calls:
  if i not in known or not known[i]&(1<<index[j]):fail.append([j,i])
expected=sum(map(len,coord.values())) if a.negative_no_binders else 0;assert len(fail)==expected,(len(fail),expected,fail[:5])
assert n[4587663]=={'op':'multiply','args':[4587637,4587662]} and n[4587654]=={'op':'actual_monotone_root','args':[2,4587637,4587638]}
assert mon[2]['name']=='ActualCommonBandSlowInverse' and mon[2]['left']==19 and mon[2]['right']==24
out={'status':'PASS_N4_ETA_BINDER_DOMINANCE' if not a.negative_no_binders else 'NEGATIVE_BINDERS_DISABLED','naturalTargets':len(natural),'evenTargets':len(profiles),'ancestryNodes':len(anc),'expressionFrameCategories':dict(others),'categorySamples':dict(samples),'coordinateCount':len(coord),'coordinateCallCount':sum(map(len,coord.values())),'allCoordinateBinderEndpoints':[-1,1],'binderFailures':len(fail),'failureSamples':fail[:20],'dataflowUpdates':updates,'root':4587654,'physicalEta':4587663,'scope':'Conservative reached N4 original natural and even profile nodes; actual expression-partial frames only. Source branch, derivative and capture-free semantics, defined original inverse and T>=0 physical image, other typed-native frame maps and dynamically generated nodes are independent premises.','release':'HOLD'}
a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps(out))
