"""Original N4 graph: direct actual lower Picard source-domain call edges."""
import collections
import gzip
import hashlib
import json
from pathlib import Path
import sys

assert len(sys.argv)==6,'usage: REACHED_JSON REGISTRY_JSON PROFILE_MJS GRAPH_JSONL_GZ OUT_JSON'
reached, registry, profile, graph, out = map(Path, sys.argv[1:])
helper = Path(__file__).resolve().parents[2] / "y" / "native_reference_scopes.py"
assert hashlib.sha256(helper.read_bytes()).hexdigest() == "37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758"
sys.path.insert(0, str(helper.parent))
from native_reference_scopes import actual_children
pins={'reached':'1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc','registry':'049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad','profile':'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'}
def read(p,h):
 b=p.read_bytes();assert hashlib.sha256(b).hexdigest()==h,p;return b
x=json.loads(read(reached,pins['reached']));assert x['graphSHA256']=='ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd' and x['visitedNodes']==1169752 and not x['unresolvedReachedNative'];n=dict(x['nodes']);bs=dict(x['sourceBodies']);r=json.loads(read(registry,pins['registry']));pic=json.loads(r['base']['picard'])
profile_source = read(profile, pins['profile']).decode('utf8')
profile_data, _ = json.JSONDecoder().raw_decode(profile_source.split('export const PINNED_N3 = ', 1)[1])
parameters = profile_data['parametersExactExpressions']
assert parameters['Xa'] == {'quotient': [{'integer': 4}, {'ref': 'Lambda'}]}
assert parameters['CSelected'] == {'exp': {'ref': 'logCSelected'}}
assert parameters['t1'] == {'power': [{'ref': 'CSelected'}, -120]}
for i,(op,args) in {2:('coordinate',['eta']),3612:('source_parameter',['t1']),3617:('source_parameter',['Xa']),24802:('rational',['1','16']),24803:('multiply',[3612,24802]),24804:('exp',[24803]),24805:('multiply',[3617,24804]),28816:('rational',['1','64']),28817:('multiply',[3612,28816]),28818:('exp',[28817]),28819:('multiply',[3617,28818]),28820:('rational',['1','32']),28821:('multiply',[3612,28820]),28822:('exp',[28821]),28823:('multiply',[3617,28822])}.items():assert n[i]=={'op':op,'args':args},i
# Independently bind the original missing endpoint node to the exact full source stream.
h=hashlib.sha256();count=0;endpoint=None
with gzip.open(graph,'rb') as f:
 line=f.readline();h.update(line);assert json.loads(line)['node_count']==7358162
 for line in f:
  h.update(line)
  if count==24806:endpoint=json.loads(line)
  count+=1
assert count==7358162 and h.hexdigest()==x['graphSHA256'] and endpoint=={'op':'sqrt_positive','args':[24805]}
# Check the formal source system IDs, shared fixed radius and inherited eta coordinate.
ids=[0,3,5,7,9];assert [pic[i]['order'] for i in ids]==[1,2,3,4,5]
assert pic[0]['name']=='ActualSameN3OrderOneInner' and all(pic[i]['kind']=='actual' for i in ids[1:])
assert all(pic[i]['eta']==2 and pic[i]['radialDomain']==[0,24806] for i in ids)
def walk(roots,cut):
 q=collections.deque(roots);seen=set(q);cuts=set()
 while q:
  i=q.popleft();v=n[i];ch=actual_children(v);replacement=cut(i,v)
  if replacement is not None:ch=replacement;cuts.add(i)
  for j in ch:
   assert j in n,(i,j)
   if j not in seen:seen.add(j);q.append(j)
 return seen,cuts
by=[]
for index,sid in enumerate(ids):
 s=pic[sid];xi=s['xi'];roots=set(s['forcing']+[j for row in s['A0']+s['A1'] for j in row]);full,_=walk(roots,lambda i,v:None);groups=collections.defaultdict(set)
 for i in full:
  v=n[i];a=v['args']
  if v['op'] in ('actual_background_even_profile','actual_background_picard'):
   assert v['op']=='actual_background_even_profile' and a[0] in ids[:index] and a[3]==2
   groups[(a[0],a[2])].add(i)
 # There is no other reached native definition hidden in a coefficient root.
 assert all(n[i]['op']=='actual_background_even_profile' for i in full if i in bs)
 assert {k[0] for k in groups}==set(ids[:index])
 details=[]
 for (lower,arg),targets in sorted(groups.items()):
  square=n[arg]
  if square['op']=='integer_power':
   assert square['args']==[xi,2];factor=None
  else:
   assert square['op']=='multiply';factor,squared=square['args'];assert n[squared]=={'op':'integer_power','args':[xi,2]};assert n[factor]['op']=='coordinate'
  def cut(i,v):
   a=v['args']
   if v['op']!='smooth_piecewise' or a[0]!=arg or a[1]!=28819:return None
   return [a[0],a[1],a[2],a[5]] if a[2]==28823 else [a[0],a[1],a[2],a[4],a[5]]
  after,cuts=walk(roots,cut);assert not (after&targets) and cuts
  binder_cuts=[]
  if factor is not None:
   def cut_binder(i,v):
    a=v['args'];return [a[2],a[3]] if v['op']=='definite_integral' and a[1:]==[factor,0,1] else None
   after,binder_cuts=walk(roots,cut_binder);assert not (after&targets) and binder_cuts
  details.append({'lowerSystem':lower,'lowerOrder':pic[lower]['order'],'radialArgument':arg,'unitBinder':factor,'callCount':len(targets),'calls':sorted(targets),'guardCutCount':len(cuts),'unguardedCalls':0,'unitBinderCutCount':len(binder_cuts),'unboundCalls':0 if factor is not None else None})
 by.append({'order':s['order'],'system':sid,'xi':xi,'coefficientReachNodes':len(full),'directLowerCalls':sum(q['callCount'] for q in details),'lowerOrders':sorted({q['lowerOrder'] for q in details}),'groups':details})
assert [v['directLowerCalls'] for v in by]==[0,19,37,48,59]
assert [sum(g['callCount'] for g in v['groups'] if g['unitBinder'] is not None) for v in by]==[0,7,16,21,26]
assert len({i for v in by for g in v['groups'] for i in g['calls']})==163
result={'schema':'MathScope.Y.N4.ActualRecursivePicardCallDomains/1','sourceGraphSHA256':x['graphSHA256'],'inputSHA256':pins,'systems':by,'totalDirectLowerCalls':163,'unitBinderCalls':70,'baselineAllTargetsReachable':True,'allMatchingGuardAndUnitBinderCutsRemoveTargets':True,'exactGeometry':'Xa>0,t1>0 gives Xkeep=Xa*exp(t1/64)<Xcut=Xa*exp(t1/32)<a^2=Xa*exp(t1/16).','conditionalProof':'For each actual outer system xi in [0,a], eta in its admitted domain: a guarded lower actual even-profile receives either X=xi^2 or X=t*xi^2 with its own literal t in [0,1]. Its exact same-X lazy guard restricts a reached profile call to 0<=X<=Xcut<a^2. Every lower actual Picard system has the same [0,a] radial domain and unchanged eta; hence sqrt(X) is admissible. Apply this finite lower-order induction through orders 1..5.','limits':'Only the four reached original actual systems coefficient A0/A1/forcing roots and their direct lower Picard calls; no claim about original entry caller, auxiliary systems, runtime derivative-generated new AST, all finite n, Picard convergence, boundary jets or total Y. Assumes exact source semantics, actual outer xi/eta admissibility and prior source parameter validity.','release':'HOLD'}
out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n');print(json.dumps({'status':'PASS','orders':5,'directLowerCalls':163,'unitBinderCalls':70,'unguarded':0,'unbound':0}))
