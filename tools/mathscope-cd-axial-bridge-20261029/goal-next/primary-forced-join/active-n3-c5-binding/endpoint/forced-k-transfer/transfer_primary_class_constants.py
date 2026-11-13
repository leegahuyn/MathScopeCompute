#!/usr/bin/env python3
"""Transfer an existing directed K upper to the actual same-live primary constants."""
import hashlib,json
from fractions import Fraction
from pathlib import Path

whole=Path('work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-forced-join/active-n3-c5-binding/norm-leading/n3-whole-k.json')
live=Path('work/goal-next/continuation40/first-cycle-43372241418/same-family-mode-two.json')
frontier=Path('work/goal-next/continuation40/first-cycle-43372241418/primary-K-arithmetic-frontier.json')
generator=Path('work/goal-next/continuation32/n4-25m-preflight/runtime/research-ide/mathscope-m3/navier/source-primary-class-majorants.mjs')
binder=Path('work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-forced-join/active-n3-c5-binding/bind_live_primary_c5.mjs')
sha=lambda b:hashlib.sha256(b).hexdigest()
raw=whole.read_bytes();assert sha(raw)=='0e1984e6f872e9a167b7920d31a55b4888a807c359a0c38dbff9f8f8af5f4acb'
K=json.loads(raw);L=json.loads(live.read_bytes());assert K['status']=='DIRECTED_CONDITIONAL_WHOLE_ORIGINAL_K' and K['prefix']==L['prefix']==3
assert L['status']=='VERIFIED_COMPLETE_SAME_LIVE_N3_FIRST_FORCED' and L['completeForcedSeal'] and not L['numericOutputBound']
assert K['K']==L['normRoots']['K']==18310069 and sha(frontier.read_bytes())==K['sourcePins']['frontier']
def blob(x):return hashlib.sha1(b'blob '+str(len(x)).encode()+b'\0'+x).hexdigest()
g=generator.read_bytes();b=binder.read_bytes();assert blob(g)=='505a33a2a3a8581a7b72bcc3d1a904ebc2ea73bf' and blob(b)=='8a23f6390b003bdfbf166999ad8135b749132c7b'
assert b'K=G.maximum(q(1n<<128n)' in g and b'constant:G.pow(K,d.power)' in g and b'const raw2 = mode(old.waveResidual, 2).value' in b
assert b'assert.deepEqual(raw2, quadratic' in b and b"assert.equal(pair(pre)[part], G.mul(G.q(1, 2), original))" in b
u=K['enclosure']['upper'];depth=0
while isinstance(u,dict) and list(u)==['exp']:depth+=1;u=u['exp']
assert depth==10 and list(u)==['rational'];a=Fraction(u['rational']);assert 12<a and a+1<2**21
rows=L['normRoots']['classRows'];assert len(rows)==6 and [r['order'] for r in rows]==list(range(6))
fields={'primary','potential','curlRemainder','homogeneousPressure','fullCovariance','covarianceRemainder'}
results=[]
for row in rows:
 assert set(row['fields'])==fields
 for name,v in row['fields'].items():
  assert type(v['power']) is int and 0<v['power']<2**12
  assert v['sourceStage']=='LOCAL_COEFFICIENT_BEFORE_AUXILIARY_HAAR_AVERAGE'
  results.append({'order':row['order'],'field':name,'sourceConstant':v['constant'],'power':v['power'],'pole':v['pole'],'strictUpper':'T25'})
assert L['full']['checks'] and all(c['pass'] is True for c in L['full']['checks'])
forced=L['full']['rows'];selected=[r for r in forced if r['key'] in ('0:1','1:1') and r['harmonic']==2]
assert len(selected)==2 and {r['key'] for r in selected}=={'0:1','1:1'} and all(r['raw']==r['supported'] and r['principal'] is None and not r['forcedOutputClassCertified'] for r in selected)
out={'status':'CONDITIONAL_SAME_LIVE_PRIMARY_CONSTANTS_ENCLOSED','Kroot':K['K'],'KupperExpressionDepth':depth,'KupperArgument':str(a),'classConstants':results,
 'selectedSameLiveModeTwo':[{'key':r['key'],'harmonic':2,'forcingRoots':r['supported'],'sourcePulseSystem':r['sourcePulseSystem']} for r in selected],
 'proof':'For a>12 and integer p<2^12, exp^9(a+1)>p*exp^9(a), so (exp^10(a))^p<exp^10(a+1). Since a+1<2^21<T5 and exp(Tj)<T(j+2), every K^p<T25; T1=2 and T(j+1)=2^Tj.',
 'scope':'The 36 numerical source constants transfer conditionally to the very same live primary class. The selected mode-two systems are source-bound to the lifted primary. No bound is yet asserted on mode-two forcing, physical pullback, inverse, forced field, other K runs, or final jets.',
 'inputSHA256':{'wholeK':sha(raw),'sameLive':sha(live.read_bytes()),'frontier':sha(frontier.read_bytes()),'generator':sha(g),'binder':sha(b)},'release':'HOLD'}
dest=Path('work/goal-next/continuation41/forced-transfer');dest.mkdir(parents=True,exist_ok=True)
(dest/'n3-primary-constants-transfer.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS 36 source constants < T25; two same-live mode-two branches remain conditional')
