from os import environ
"""Check exact slow-inverse eta equation and native row rescaling, conditionally."""
import collections,hashlib,json,sys
from pathlib import Path
D=Path(__file__).resolve().parent;root=D.parent;sys.path.insert(0,str(root/'y'))
from native_reference_scopes import actual_children
raw=(Path(environ["MATHSCOPE_N2_REACHED"])).read_bytes();assert hashlib.sha256(raw).hexdigest()=='4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32';x=json.loads(raw);n=dict(x['nodes']);bs=dict(x['sourceBodies'])
raw=(Path(environ["MATHSCOPE_N2_REGISTRY"])).read_bytes();assert hashlib.sha256(raw).hexdigest()=='6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f';r=json.loads(raw);base=r['base'];mon=json.loads(base['monotone']);globalfields=json.loads(base['m3GlobalFields']);aux=json.loads(r['fieldDefinitions']);pulses=json.loads(base['m3GlobalPulses'])
expected={1451889:('actual_monotone_root',[2,1451872,1451873]),1451888:('add',[1451886,1451887]),1451886:('add',[1451879,1451885]),1451887:('multiply',[20,1451873]),1451885:('multiply',[20,1451884]),1451884:('multiply',[1451880,1451883]),1451880:('integer_power',[1451872,2]),1451883:('exp',[1451882]),1451882:('multiply',[25,1451881]),1451881:('log_positive',[1451879]),1451898:('multiply',[1451872,1451897]),1451897:('inverse',[1451896]),1451896:('exp',[1451895]),1451895:('multiply',[22,1451894]),1451894:('log_positive',[1451889]),22:('add',[19,21]),21:('multiply',[9,20]),25:('multiply',[9,24]),19:('rational',['1','2']),20:('rational',['-1','1']),24:('rational',['2','1'])}
for i,(o,a) in expected.items():assert n[i]=={'op':o,'args':a},i
assert mon[2]['name']=='ActualCommonBandSlowInverse' and mon[2]['body']==1451888 and mon[2]['left']==19 and mon[2]['right']==24 and mon[2]['parameters']==[1451872,1451873]
old=json.loads((Path(environ["MATHSCOPE_N1_REACHED"])).read_bytes());oldids={c['id'] for c in old['calls']};targets={c['id'] for c in x['calls'] if c['id'] not in oldids}|{i for i,v in n.items() if v['op']=='actual_background_even_profile' and v['args'][0] in (3,5)}
parents=collections.defaultdict(list)
for i,v in n.items():
 for j in actual_children(v)+bs.get(i,[]):
  if j in n:parents[j].append(i)
q=collections.deque(targets);anc=set(q)
while q:
 for j in parents[q.popleft()]:
  if j not in anc:anc.add(j);q.append(j)
counts=collections.Counter();rows=collections.Counter();seenfields=set();ratios=set()
for i in sorted(anc):
 v=n[i];op=v['op'];a=v['args']
 if not any(j in anc for j in bs.get(i,[])):continue
 if op=='m3_global_indexed_partial':fld=globalfields[a[0]];actual=a[1];key=('global',a[0])
 elif op=='m3_aux_indexed_partial':fld=aux[a[0]];actual=a[1];key=('aux',a[0])
 elif op=='actual_covariance_volterra':
  fld=json.loads(pulses[a[0]]['originalDefinition']);actual=a[3];key=('covariance',a[0])
 else:continue
 f=fld['parameters'];assert len(f)==len(actual) and f[:3]==[1451871,1451872,1451873] and actual[1:3]==f[1:3], (i,op,f,actual);counts[op]+=1
 if key in seenfields:continue
 seenfields.add(key)
 for row in fld.get('rows',[]):
  if row['localBody'] not in anc:continue
  m=dict(zip(row['localParameters'],row['values']));assert all(k in m for k in [1451871,1451872,1451873]);z=n[m[1451872]];t=n[m[1451873]];assert z['op']=='multiply' and z['args'][0]==1451872 and t['op']=='multiply' and t['args'][0]==1451873
  ratio=t['args'][1];v=n[z['args'][1]];assert v['op']=='exp';mul=n[v['args'][0]];assert mul['op']=='multiply' and mul['args'][0]==22 and n[mul['args'][1]]=={'op':'log_positive','args':[ratio]}
  ratioNode=n[ratio]; assert ratioNode['op']=='multiply';aa,bb=ratioNode['args'];assert n[aa]['op']=='exp' and n[bb]['op']=='inverse' and n[n[bb]['args'][0]]['op']=='exp';ratios.add(ratio);rows[key[0]]+=1
assert counts=={'actual_covariance_volterra':4,'m3_global_indexed_partial':4,'m3_aux_indexed_partial':39};assert rows['global']>0 and rows['aux']>0
# Countermodel for dropping T>=0: h=1/32,s=1,Z=2,T=-3 satisfies root equation and eta=2.
# The root remains bracketed: (8/7)^16>2 and (5/4)^16>2; derivative >1/2 on [1/2,2].
assert 8**16>2*7**16 and 5**16>2*4**16
out={'schema':'MathScope.Y.N2.SlowEtaFrame/1','nativeFrameCallCounts':dict(counts),'uniqueFieldDefinitions':len(seenfields),'checkedReachedNativeRows':dict(rows),'distinctPositiveRatios':len(ratios),'sourceIdentity':'eta=Z/s^(1/2-h); s-Z^2*s^(2h)-T=0 => eta^2=1-T/s for s>0','rowIdentity':'for c>0, Znext=Z*c^(1/2-h), Tnext=T*c, snext=s*c preserve eta and the exact inverse equation','conditional':'A native inverse exists in its [1/2,2] bracket only on its declared image. For s>0 and T>=0, eta^2<=1. To use scaling, snext must lie in the actual row bracket/image and the unique-root theorem must apply.','negativeControl':'h=1/32,s=1,Z=2,T=-3 solves the source equation, has eta=2 and even admits a positive monotone bracket; the physical T>=0 hypothesis cannot be dropped. This is not an actual-domain counterexample.','limits':'Global full-frame hygiene, all guards and source-domain transport remain separately open; embedded covariance definition is source cross-checked, not a private runtime seal.','release':'HOLD'}
(D/'slow-eta-frame.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps(out))
