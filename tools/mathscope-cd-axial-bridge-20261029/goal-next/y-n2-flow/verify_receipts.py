import json
from pathlib import Path
D=Path(__file__).resolve().parent
p=json.loads((D/'range-flow-n2.json').read_text());q=json.loads((D/'no-bracket.json').read_text());r=json.loads((D/'no-loop.json').read_text())
assert p['priorCount']==q['priorCount']==r['priorCount']==0
assert p['certifiedRangeCount']==567 and p['openRangeCount']==0 and p['usedRoot2Brackets']==[1451889] and len(p['transported'])==1680 and not p['unsupported']
assert q['certifiedRangeCount']==563 and q['openRangeCount']==4 and {v['id'] for v in q['openCalls']}=={4758,4784,5177,5299} and q['unresolved']=={'nn 1451893':4}
assert r['certifiedRangeCount']==409 and r['openRangeCount']==158 and r['negativeControlDroppedLoopLeftSign']
assert not p['nativeRootExistenceCertified']
print('PASS N2 567 static calls conditional; controls 563/567, 409/567')
