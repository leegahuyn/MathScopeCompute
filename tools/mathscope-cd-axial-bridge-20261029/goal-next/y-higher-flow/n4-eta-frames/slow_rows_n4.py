"""N4 typed source eta-rescaling rows, conditional on actual slow image."""
import argparse,collections,hashlib,json,sys
from fractions import Fraction
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('reach',type=Path);p.add_argument('registry',type=Path);p.add_argument('helper',type=Path);p.add_argument('out',type=Path);a=p.parse_args()
def read(path,pin):
 b=path.read_bytes();assert hashlib.sha256(b).hexdigest()==pin,path;return b
read(a.helper,'37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758');sys.path.insert(0,str(a.helper.parent));from native_reference_scopes import actual_children
x=json.loads(read(a.reach,'1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc'));n=dict(x['nodes']);bs=dict(x['sourceBodies'])
r=json.loads(read(a.registry,'049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad'));base=r['base'];glob=json.loads(base['m3GlobalFields']);aux=json.loads(r['fieldDefinitions']);pulses=json.loads(base['m3GlobalPulses']);mon=json.loads(base['monotone'])
assert n[4587654]=={'op':'actual_monotone_root','args':[2,4587637,4587638]} and mon[2]['body']==4587653
natural={c['id'] for c in x['calls']};profiles={i for i,v in n.items() if v['op']=='actual_background_even_profile'};assert (len(natural),len(profiles))==(597,259)
parents=collections.defaultdict(list)
for i,v in n.items():
 for j in actual_children(v)+bs.get(i,[]):
  if j in n:parents[j].append(i)
q=collections.deque(natural|profiles);anc=set(q)
while q:
 for j in parents[q.popleft()]:
  if j not in anc:anc.add(j);q.append(j)
assert n[4587664]=={'op':'multiply','args':[4587628,4587654]};assert n[4587628]['op']=='exp'
assert n[4590074]=={'op':'multiply','args':[20,4590073]} and n[4590073]=={'op':'multiply','args':[4582353,4590072]}
assert n[4582353]=={'op':'inverse','args':[127]} and n[4590072]=={'op':'log_positive','args':[4587664]} and n[127]=={'op':'log_positive','args':[24]}
counts=collections.Counter();rows=collections.Counter();seen=set();ratios=set();samples=[]
for i in sorted(anc):
 v=n[i];op=v['op'];av=v['args']
 if not any(j in anc for j in bs.get(i,[])):continue
 if op=='m3_global_indexed_partial':fld=glob[av[0]];actual=av[1];key=('global',av[0])
 elif op=='m3_aux_indexed_partial':fld=aux[av[0]];actual=av[1];key=('aux',av[0])
 elif op=='actual_covariance_volterra':fld=json.loads(pulses[av[0]]['originalDefinition']);actual=av[3];key=('covariance',av[0])
 else:continue
 f=fld['parameters'];assert len(f)==len(actual) and f[:3]==[4587636,4587637,4587638] and actual[1:3]==f[1:3],(i,op,f,actual);counts[op]+=1
 if key in seen:continue
 seen.add(key)
 for row in fld.get('rows',[]):
  if row['localBody'] not in anc:continue
  m=dict(zip(row['localParameters'],row['values']));assert all(k in m for k in [4587636,4587637,4587638]);z=n[m[4587637]];t=n[m[4587638]]
  assert z['op']=='multiply' and z['args'][0]==4587637 and t['op']=='multiply' and t['args'][0]==4587638
  ratio=t['args'][1];v=n[z['args'][1]];assert v['op']=='exp' and n[v['args'][0]]=={'op':'multiply','args':[22,n[v['args'][0]]['args'][1]]}
  assert n[n[v['args'][0]]['args'][1]]=={'op':'log_positive','args':[ratio]}
  rn=n[ratio];assert rn['op']=='multiply';aa,bb=rn['args'];assert aa==4587628 and n[bb]['op']=='inverse';Q=n[bb]['args'][0];assert n[Q]['op']=='exp';ratios.add(ratio)
  ell=row['label']['ell'];assert row['label'].get('Q',Q)==Q and n[n[Q]['args'][0]]=={'op':'multiply','args':[20,n[n[Q]['args'][0]]['args'][1]]}
  ellprod=n[n[Q]['args'][0]]['args'][1];assert n[ellprod]=={'op':'multiply','args':[127,ell]}
  guard,left,right=row['guards'][-1];assert n[left]=={'op':'rational','args':['-3','4']} and n[right]=={'op':'rational','args':['3','4']}
  gn=n[guard];assert gn['op']=='add' and gn['args'][0]==4590074 and n[gn['args'][1]]=={'op':'multiply','args':[20,ell]}
  rows[key[0]]+=1
  if len(samples)<8:samples.append({'type':key[0],'field':key[1],'localBody':row['localBody'],'ratio':ratio,'guard':guard,'ell':ell})
assert rows['global']>0 and rows['aux']>0
assert 8**16>2*7**16 and 5**16>2*4**16
assert Fraction(1,2)<=1<=2 and 4*1>2 and -2<Fraction(-3,4)
out={'status':'PASS_N4_REACHED_TYPED_SLOW_ROWS_CONDITIONAL','targets':{'natural':597,'even':259},'ancestryNodes':len(anc),'typedNativeCalls':dict(counts),'uniqueDefinitions':len(seen),'checkedRows':dict(rows),'distinctPositiveRatios':len(ratios),'samples':samples,'sourceReference':{'R':4587636,'Z':4587637,'T':4587638,'s':4587654,'eta':4587663,'q':4587664},'conditional':'For c=Qref/Qlabel>0, actual Znext=Z*c^(1/2-h), Tnext=T*c. The original band guard makes 1/2<snext=c*s<2, and source inverse uniqueness identifies snext only on valid reference image with exact lazy/row and native semantics; T>=0 is preserved.','negativeControl':'h=1/32,s=1,Z=2,T=-3 yields eta=2 despite a unique bracketed inverse; T>=0 cannot be omitted.','scope':'Reached indexed covariance/global/aux rows with localBody in target ancestry; no runtime-private seal or global image proof, no automatically generalized derivative eta-frame or dynamic native closure.','release':'HOLD'}
out['negativeGuardControl']='Abstract s=1,Z=0,T=1,Qref=1,Qlabel=1/4 gives c=4, q=1 and source row guard value -2; dropping the guard sends the valid reference root to s_next=4 outside [1/2,2]. This is not an actual-row counterexample.'
a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps(out))
