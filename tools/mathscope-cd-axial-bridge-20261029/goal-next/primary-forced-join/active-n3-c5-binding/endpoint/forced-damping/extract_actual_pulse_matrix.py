#!/usr/bin/env python3
"""Stream the original N3 witness, retaining only two pulse matrix windows."""
import gzip,hashlib,json
from pathlib import Path
D=Path('work/goal-next/continuation36/hosted-43363985266/mathscope-original-n3-primary-c5/witness')
W=json.loads((D/'original-active-mode-two-witness.json').read_bytes());raw=(D/'original-source-functions.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==W['snapshot']['definitions_sha256']
registry=json.loads(raw);systems=json.loads(registry['definitions'])[3];assert len(systems)==6
outrows=[]
for w in W['rows']:
 s=systems[w['system']];assert s['id']==w['system'] and s['name']==f"ActualOriginalForced_{w['key']}_m2" and s['forcing']==w['projectedSource'] and s['length']==w['length'] and s['left']==0
 assert s['initial']==[{'real':0,'imaginary':0}]*3 and not s['finitePartialSumIsExactSolution']
 assert s['equation'].startswith('partial_v t = matrix*t + forcing')
 outrows.append({'key':w['key'],'system':s['id'],'matrix':s['matrix'],'forcing':s['forcing'],'normal':w['normal'],'k':w['k'],'epsilon':w['epsilon'],'length':w['length'],'variable':s['variable'],'directions':s['directions']})
assert [r['key'] for r in outrows]==['0:1','1:1']
windows=[(17732735,17733040),(17733100,17733190),(17735960,17736010),(21385600,21386000),(21661700,21665300),(21675090,21678600)];extra={0,1,2,20,24,474,17736577,17736580,17766523,17766524,17788298};nodes={};H=hashlib.sha256();size=0;count=0
with gzip.open(D/'original-source-nodes.jsonl.gz','rb') as f:
 header=f.readline();H.update(header);size+=len(header)
 for i,line in enumerate(f):
  H.update(line);size+=len(line);count+=1
  if i in extra or any(lo<=i<=hi for lo,hi in windows):nodes[i]=json.loads(line)
  if i and i%5000000==0:print('scanned',i,flush=True)
assert count==W['snapshot']['node_count'] and size==W['snapshot']['node_stream_uncompressed_bytes'] and H.hexdigest()==W['snapshot']['node_stream_sha256']
for r in outrows:
 for i in [r['epsilon'],r['k'],r['normal']['squared'],*sum(r['matrix'],[])]:assert i in nodes,(r['key'],i)
out={'status':'PASS_NATIVE_TWO_PULSE_MATRIX_WINDOWS','rows':outrows,'nodes':nodes,'sourceProfile':W['source']['parameterExpressionSHA256'],
 'witnessGraphSHA256':H.hexdigest(),'witnessRegistrySHA256':W['snapshot']['definitions_sha256'],
 'scope':'Actual selected same-live source witness only; no matrix damping sign or output numerical bound is inferred here.','release':'HOLD'}
dest=Path('work/goal-next/continuation44/forced');dest.mkdir(parents=True,exist_ok=True);(dest/'two-pulse-source-windows.json').write_text(json.dumps(out,separators=(',',':'))+'\n',encoding='utf8');print('PASS two actual source systems',flush=True)
