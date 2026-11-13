#!/usr/bin/env python3
"""Independent pinned receipt cross-read. Does not re-prove analytic premises."""
import argparse,hashlib,json
from fractions import Fraction as F
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--goal-next',type=Path,default=Path(__file__).resolve().parents[2]);p.add_argument('--out',type=Path);a=p.parse_args()
paths={
 'order':('work/goal-next/axial-alln/order-three.json','26bbd0d14f0218dfe0a6be2494845e6de86bb8cb23f782bccb695ba2abfee2c7'),
 'binding':('work/goal-next/axial-native/export-binding.json','fe2d9af725a2fd4d7fdbbcb9eb2a9f242fe5160775589351f36d03964a4076d1'),
 'algebra':('work/goal-next/axial-alln/independent-algebra.json','46a7d0c9b4c8cad532ad19818361a11bf0f65f063f75d7c561e1ee410f3371c8'),
 'domain':('work/goal-next/axial-native/native-domains.json','1a075e3e27cae76c10aafb14388a2d2ab09625112a1857344620ff8a52113e9d')}
data={}
for name,(rel,digest) in paths.items():
    raw=(a.goal_next/Path(rel).relative_to('work/goal-next')).read_bytes();assert hashlib.sha256(raw).hexdigest()==digest,name
    data[name]=json.loads(raw)
r=data['order']; c=r['certificate']; binding=data['binding']; algebra=data['algebra']
assert r['input']['order']==3 and r['prefixSHA256']=='d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116'
assert binding['formals']==[4756,2] and binding['density']==117047 and binding['sourceStressFunction']==672 and binding['sourceStressBody']==117069
expected=[(117057,117055,[28814,4756]),(117066,117064,[4756,28824]),(117075,117073,[28814,28824])]
for row,(root,binder,ends) in zip(binding['literalIntegrals'],expected):
    assert (row['integral'],row['binder'],row['endpoints'])==(root,binder,ends)
    assert row['actualArguments']==[binder,2]
assert all(algebra['checks'].values()) and algebra['endpointNegativeControl']=='-17408/3375'
assert -4*F(1)*(1+2*F(1,32))/(1-2*F(1,32))**3==F(-17408,3375)
rows=[x for x in c['stressRows'] if x['component']=='z']
assert [(x['order'],x['actualRawResidual']) for x in rows]==[(1,117045),(2,120788),(3,123838)]
assert all(x['pass'] and x['actualConservativeTotalReduced']==0 and x['allFixedDerivativeJetsMatch'] for x in rows)
assert rows[0]['originalTotal']==117075
assert c['scope']['allGeneratedPositiveOrdersExecuted']==3 and not c['scope']['newLeanKernelProof']
assert not c['scope']['commonInfiniteCutoffBackgroundAssembled']
families=c['momentFamilies'];assert any(x['proof']['kind']=='original-M0-FTC-axis-and-whole-exterior' for x in families)
assert any(x['proof']['kind']=='source-full-global-density-to-original-continuous-moment-equation' for x in families)
out={'status':'PASS','source_binding':'#672 formal [#4756,#2]; #117047 and all three actual integration binders anchored',
     'finite_source_replay_orders':[1,2,3],'negative_eta_endpoint_fraction':'-17408/3375',
     'scope':'cross-check of pinned prior receipts, not independent proof of their continuous source assumptions or an all-order Lean result',
     'source_moment_status':'zero-family substitution based on source moment/leading-stream proofs, not unconditional reduction of #117075 by a Lean kernel',
     'native_application_scope':'only the actual arguments and endpoint jets covered in the pinned domain receipt',
     'release':'HOLD','pins':{v[0]:v[1] for v in paths.values()}}
txt=json.dumps(out,indent=2)+'\n'
if a.out:a.out.write_text(txt,encoding='utf8',newline='\n')
print(txt,end='')
