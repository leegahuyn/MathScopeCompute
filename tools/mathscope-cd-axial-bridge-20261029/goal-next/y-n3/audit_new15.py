"""Exact N3 new natural operands and source-bound Picard guard reduction."""
import collections,gzip,hashlib,json,sys
from fractions import Fraction
from pathlib import Path
from os import environ
D=Path(__file__).resolve().parent;root=D.parent;sys.path.insert(0,str(root/'y'))
from native_reference_scopes import actual_children
H=lambda p,h:(lambda b: b if hashlib.sha256(b).hexdigest()==h else (_ for _ in ()).throw(ValueError(str(p))))(p.read_bytes())
a=json.loads(H(Path(environ["MATHSCOPE_N2_REACHED"]),'4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32'));x=json.loads(H(Path(environ["MATHSCOPE_N3_REACHED"]),'3de8ebed1c18e6d5ec3d104d82e2b5c65302c82865f0025015ba23b96cc886fa'))
dir=Path(environ["MATHSCOPE_N3_GRAPH"]);reg=json.loads(H(dir/'original-source-functions.json','75c53ba678b7db51dc53527d6b753d76e1fc013d515ff253b7b581513b0b53a0'))
assert x['graphSHA256']=='f59857c4616e90727e64d9aa77b8ee8a51082274c16cff53098ea7f5db5f511c' and x['visitedNodes']==598891 and x['nativeDefinitionEntries']==713 and x['reachedNaturalCalls']==582 and not x['unresolvedReachedNative']
n=dict(x['nodes']);oldn=dict(a['nodes']);bs=dict(x['sourceBodies']);old={c['id']:c for c in a['calls']};new={c['id']:c for c in x['calls']};assert len(old)==567 and set(old)<=set(new) and all(old[i]==new[i] and oldn[i]==n[i] for i in old)
newids=set(new)-set(old);groups={k:sorted(i for i in newids if new[i]['y']==k) for k in (125505,125579)};assert [len(groups[k]) for k in groups]==[11,4] and len(newids)==15 and all(new[i]['eta']==2 for i in newids)
pic=json.loads(reg['base']['picard']);p=pic[7];assert p['name']=='ActualSameN3actualOrder4' and p['xi']==125469 and p['eta']==2 and p['radialDomain']==[0,24806]
for i,(op,args) in {2:('coordinate',['eta']),3617:('source_parameter',['Xa']),3679:('inverse',[3617]),125469:('coordinate',['actual_actual_order_4_xi$340']),125504:('integer_power',[125469,2]),125505:('multiply',[3454,125504]),125511:('multiply',[3679,125504]),125512:('log_positive',[125511]),125577:('exp',[125512]),125578:('multiply',[3617,125577]),125579:('multiply',[3454,125578])}.items():assert n[i]=={'op':op,'args':args},i
with gzip.open(dir/'original-source-nodes.jsonl.gz','rt',encoding='utf8') as f:
 header=json.loads(next(f));assert header['node_count']==3914395
 for i,line in enumerate(f):
  if i==24806:assert json.loads(line)=={'op':'sqrt_positive','args':[24805]};break
 else:raise AssertionError('missing domain endpoint')
def walk(roots,cut):
 q=collections.deque(roots);seen=set(roots);cuts=set()
 while q:
  i=q.popleft();v=n[i];ch=actual_children(v);repl=cut(i,v)
  if repl is not None:ch=repl;cuts.add(i)
  for j in ch+bs.get(i,[]):
   if j in n and j not in seen:seen.add(j);q.append(j)
 return seen,cuts
roots=set(p['forcing']+[j for row in p['A0']+p['A1'] for j in row]);t=set(groups[125579])
def logcut(i,v):
 a=v['args'];return [a[0],a[1],a[2],a[3]] if v['op']=='smooth_piecewise' and a[:3]==[125504,3617,24805] else None
baseline,_=walk(roots,lambda i,v:None);assert t<=baseline
log_seen,logcuts=walk(roots,logcut);assert len(logcuts)==9 and not log_seen&t
full,_=walk(roots,lambda i,v:None);expressions=json.loads(reg['base']['expression']);alter=[]
for i in full:
 v=n[i]
 if v['op']=='actual_expression_partial':
  sid,actual,_=v['args'];formal=expressions[sid]['parameters']
  if 125469 in formal and actual[formal.index(125469)]!=125469:alter.append(i)
assert not alter
profiles={i for i,v in n.items() if v['op']=='actual_background_even_profile' and v['args'][0]==7};assert profiles=={126666,126667,126668,126681} and all(n[i]['args'][2:4]==[4756,2] for i in profiles)
def profilecut(i,v):
 a=v['args']
 if v['op']!='smooth_piecewise' or a[0]!=4756 or a[1]!=28819:return None
 return [a[0],a[1],a[2],a[5]] if a[2]==28823 else [a[0],a[1],a[2],a[4],a[5]]
baseline_profiles,_=walk(x['roots'],lambda i,v:None);assert profiles<=baseline_profiles
profile_seen,cuts=walk(x['roots'],profilecut);assert len(cuts)==54 and not profile_seen&profiles
assert Fraction(4)*Fraction(16,15)<5
out={'schema':'MathScope.Y.N3.New15.SourceDomainAudit/1','graphSHA256':x['graphSHA256'],'N3ReachedSHA256':'3de8ebed1c18e6d5ec3d104d82e2b5c65302c82865f0025015ba23b96cc886fa','N3Visited':x['visitedNodes'],'N3ResolvedNativeDefinitionEntries':x['nativeDefinitionEntries'],'N2StaticNaturalCalls':len(old),'N3StaticNaturalCalls':len(new),'N2CallsIdentical':len(old),'N3NewCalls':15,'newYGroups':{str(k):v for k,v in groups.items()},'system7':{'sourceOrder':4,'xi':125469,'eta':2,'radialDomain':[0,24806],'guardedLogCalls':len(t),'logGuardCutCount':len(logcuts),'logCallsReachableBeforeCut':len(baseline&t),'logCallsReachableAfterCut':len(log_seen&t),'alteredXiFormalSharedCalls':len(alter),'evenProfileCalls':sorted(profiles),'evenProfileGuardCutCount':len(cuts),'evenProfileCallsReachableBeforeCut':len(baseline_profiles&profiles),'evenProfileCallsReachableAfterCut':len(profile_seen&profiles)},'conditionalRange':'On the source Picard radial domain 0<=xi<=sqrt(Xa*exp(t1/16)), Xa=4/Lambda, and 0<t1<1, both operands equal Lambda*xi^2 in the active guarded branch and are in [0,4*exp(t1/16)] subset [0,64/15) subset [0,5].','limits':'Typed reach includes inactive branches; Picard convergence, each actual parameter/binder frame, eta image, N2->N3 chart field identification, transport of old 567 calls, all N3 derivatives and seam jets remain separate; no 582/582 claim.','release':'HOLD'}
(D/'new15-audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS original N3 582 calls and conditional new15 Picard operand reduction')
