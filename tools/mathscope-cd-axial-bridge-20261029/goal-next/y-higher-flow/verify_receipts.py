import json
from pathlib import Path
D=Path(__file__).resolve().parent
for order,total,root,transports,nn in [(3,582,2086999,3881,2087003),(4,597,4587654,7770,4587658)]:
 p=json.loads((D/f'n{order}.json').read_text());q=json.loads((D/f'n{order}-no-bracket.json').read_text());r=json.loads((D/f'n{order}-no-loop.json').read_text())
 assert p['priorCount']==q['priorCount']==r['priorCount']==0
 assert p['certifiedRangeCount']==total and p['openRangeCount']==0 and p['usedRoot2Brackets']==[root] and len(p['transported'])==transports and not p['unsupported']
 assert q['certifiedRangeCount']==total-4 and q['openRangeCount']==4 and {v['id'] for v in q['openCalls']}=={4758,4784,5177,5299} and q['unresolved']=={f'nn {nn}':4}
 assert r['certifiedRangeCount']==total-158 and r['openRangeCount']==158 and r['negativeControlDroppedLoopLeftSign']
 assert not p['nativeRootExistenceCertified']
x=json.loads((D/'reference-roots.json').read_text());assert [r['root'] for r in x['sourceRecords']]==[2086999,4587654]
print('PASS N3 582 and N4 597 static calls conditional, exact root images and four fail-closed controls')
