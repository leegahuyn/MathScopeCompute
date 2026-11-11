"""Exact N4 new natural operands and source-bound Picard guard reduction."""
import collections,gzip,hashlib,json,sys,importlib.util
from fractions import Fraction
from pathlib import Path
from os import environ
D=Path(__file__).resolve().parent;root=D.parent;sys.path.insert(0,str(root/'y'))
from native_reference_scopes import actual_children
H=lambda p,h:(lambda b: b if hashlib.sha256(b).hexdigest()==h else (_ for _ in ()).throw(ValueError(str(p))))(p.read_bytes())
a=json.loads(H(Path(environ["MATHSCOPE_N3_REACHED"]),'3de8ebed1c18e6d5ec3d104d82e2b5c65302c82865f0025015ba23b96cc886fa'));x=json.loads(H(Path(environ["MATHSCOPE_N4_REACHED"]),'1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc'))
dir=Path(environ["MATHSCOPE_N4_GRAPH"]);reg=json.loads(H(dir/'original-source-functions.json','049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad'))
profile_path=Path(environ["MATHSCOPE_ORIGINAL_RUNTIME"])/"research-ide/mathscope-m2/navier/source-profile-data.mjs"
profile=H(profile_path,'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a').decode('utf8');profile,_=json.JSONDecoder().raw_decode(profile.split('export const PINNED_N3 = ',1)[1]);p0=profile['parametersExactExpressions'];assert p0['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]} and p0['t1']=={'power':[{'ref':'CSelected'},-120]}
spec=importlib.util.spec_from_file_location('source_guards',root.parent/"axial-exterior/check_source_guards.py");source_guards=importlib.util.module_from_spec(spec);spec.loader.exec_module(source_guards);assert source_guards.check(p0)==[]
assert x['graphSHA256']=='ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd' and x['visitedNodes']==1169752 and x['nativeDefinitionEntries']==751 and x['reachedNaturalCalls']==597 and not x['unresolvedReachedNative']
n=dict(x['nodes']);oldn=dict(a['nodes']);bs=dict(x['sourceBodies']);old={c['id']:c for c in a['calls']};new={c['id']:c for c in x['calls']};assert len(old)==582 and set(old)<=set(new) and all(old[i]==new[i] and oldn[i]==n[i] for i in old)
newids=set(new)-set(old);groups={k:sorted(i for i in newids if new[i]['y']==k) for k in (129036,129110)};assert [len(groups[k]) for k in groups]==[11,4] and len(newids)==15 and all(new[i]['eta']==2 for i in newids)
pic=json.loads(reg['base']['picard']);p=pic[9];assert p['name']=='ActualSameN3actualOrder5' and p['xi']==129000 and p['eta']==2 and p['radialDomain']==[0,24806]
for i,(op,args) in {2:('coordinate',['eta']),3612:('source_parameter',['t1']),3454:('source_parameter',['Lambda']),3617:('source_parameter',['Xa']),3679:('inverse',[3617]),129000:('coordinate',['actual_actual_order_5_xi$363']),129035:('integer_power',[129000,2]),129036:('multiply',[3454,129035]),129042:('multiply',[3679,129035]),129043:('log_positive',[129042]),129108:('exp',[129043]),129109:('multiply',[3617,129108]),129110:('multiply',[3454,129109])}.items():assert n[i]=={'op':op,'args':args},i
with gzip.open(dir/'original-source-nodes.jsonl.gz','rt',encoding='utf8') as f:
 header=json.loads(next(f));assert header['node_count']==7358162
 anchors={}
 for i,line in enumerate(f):
  if i in (24802,24803,24804,24805,24806):anchors[i]=json.loads(line)
  if i==24806:break
 else:raise AssertionError('missing domain endpoint')
 assert anchors=={24802:{'op':'rational','args':['1','16']},24803:{'op':'multiply','args':[3612,24802]},24804:{'op':'exp','args':[24803]},24805:{'op':'multiply','args':[3617,24804]},24806:{'op':'sqrt_positive','args':[24805]}}
def walk(roots,cut):
 q=collections.deque(roots);seen=set(roots);cuts=set()
 while q:
  i=q.popleft();v=n[i];ch=actual_children(v);repl=cut(i,v)
  if repl is not None:ch=repl;cuts.add(i)
  for j in ch+bs.get(i,[]):
   if j in n and j not in seen:seen.add(j);q.append(j)
 return seen,cuts
roots=set(p['forcing']+[j for row in p['A0']+p['A1'] for j in row]);t=set(groups[129110])
def logcut(i,v):
 a=v['args'];return [a[0],a[1],a[2],a[3]] if v['op']=='smooth_piecewise' and a[:3]==[129035,3617,24805] else None
baseline,_=walk(roots,lambda i,v:None);assert t<=baseline
log_seen,logcuts=walk(roots,logcut);assert len(logcuts)==9 and not log_seen&t
full,_=walk(roots,lambda i,v:None);expressions=json.loads(reg['base']['expression']);alter=[]
for i in full:
 v=n[i]
 if v['op']=='actual_expression_partial':
  sid,actual,_=v['args'];formal=expressions[sid]['parameters']
  if 129000 in formal and actual[formal.index(129000)]!=129000:alter.append(i)
assert not alter
profiles={i for i,v in n.items() if v['op']=='actual_background_even_profile' and v['args'][0]==9};assert profiles=={130332,130333,130334,130347} and all(n[i]['args'][2:4]==[4756,2] for i in profiles)
def profilecut(i,v):
 a=v['args']
 if v['op']!='smooth_piecewise' or a[0]!=4756 or a[1]!=28819:return None
 return [a[0],a[1],a[2],a[5]] if a[2]==28823 else [a[0],a[1],a[2],a[4],a[5]]
baseline_profiles,_=walk(x['roots'],lambda i,v:None);assert profiles<=baseline_profiles
profile_seen,cuts=walk(x['roots'],profilecut);assert len(cuts)==66 and not profile_seen&profiles
assert Fraction(4)*Fraction(16,15)<5
out={'schema':'MathScope.Y.N4.New15.SourceDomainAudit/1','graphSHA256':x['graphSHA256'],'N4ReachedSHA256':'1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc','N4Visited':x['visitedNodes'],'N4ResolvedNativeDefinitionEntries':x['nativeDefinitionEntries'],'N3StaticNaturalCalls':len(old),'N4StaticNaturalCalls':len(new),'N3CallsIdentical':len(old),'N4NewCalls':15,'newYGroups':{str(k):v for k,v in groups.items()},'system9':{'sourceOrder':5,'xi':129000,'eta':2,'radialDomain':[0,24806],'guardedLogCalls':len(t),'logGuardCutCount':len(logcuts),'logCallsReachableBeforeCut':len(baseline&t),'logCallsReachableAfterCut':len(log_seen&t),'alteredXiFormalSharedCalls':len(alter),'evenProfileCalls':sorted(profiles),'evenProfileGuardCutCount':len(cuts),'evenProfileCallsReachableBeforeCut':len(baseline_profiles&profiles),'evenProfileCallsReachableAfterCut':len(profile_seen&profiles)},'pinnedProfileSHA256':'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a','exactProfileFacts':'Xa=4/Lambda and 0<t1<1 are checked from the pinned source profile; source endpoint sqrt(Xa*exp(t1/16)) is authenticated.', 'conditionalRange':'On the source Picard radial domain 0<=xi<=sqrt(Xa*exp(t1/16)), Xa=4/Lambda, and 0<t1<1, both operands equal Lambda*xi^2 in the active guarded branch and are in [0,4*exp(t1/16)] subset [0,64/15) subset [0,5].','limits':'Typed reach includes inactive branches; Picard convergence, each actual parameter/binder frame, eta image, N3->N4 chart field identification, transport of old 582 calls, all N4 derivatives and seam jets remain separate; no 597/597 claim.','release':'HOLD'}
(D/'new15-audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS original N4 597 calls and conditional new15 Picard operand reduction')
