#!/usr/bin/env python3
"""Bind three archived source integral enclosures to the live N3 typed DAG."""
import argparse,gzip,hashlib,json
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--graph',type=Path,required=True);p.add_argument('--historic',type=Path,required=True);p.add_argument('--live',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
H=json.loads(a.historic.read_bytes());assert H['graphSHA256']=='75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987'
assert hashlib.sha256(a.historic.read_bytes()).hexdigest()=='03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0'
assert sorted(H['boundaryIntervals'])==['239','257','275']
early=[];digest=hashlib.sha256();count=0
with gzip.open(a.graph,'rb') as f:
 header=f.readline();digest.update(header);meta=json.loads(header)
 for i,line in enumerate(f):
  digest.update(line);count+=1
  if i<=275:early.append(json.loads(line))
assert count==meta['node_count'] and digest.hexdigest()==H['graphSHA256']
live={};hdr=None
with gzip.open(a.live,'rt',encoding='utf8') as f:
 for line in f:
  r=json.loads(line)
  if r['kind']=='header':hdr=r
  elif r['kind']=='node' and r['id']<=275:live[r['id']]=r['node']
assert hdr['sourceProfile']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
queue=[239,257,275];seen=set(queue)
for i in queue:
 n=early[i];assert live.get(i)==n,(i,'live original operand differs')
 op,x=n['op'],n['args']
 if op in ('coordinate','rational','source_parameter'):c=[]
 elif op in ('add','multiply','definite_integral','smooth_piecewise'):c=x
 elif op in ('inverse','exp','log_positive','sqrt_positive','ceiling','sine','cosine','integer_power','source_step_derivative'):c=x[:1]
 else:raise AssertionError((i,op,'no unaudited operation admitted'))
 for j in c:
  assert type(j) is int and j<i,(i,j,'non-topological reference')
  if j not in seen:seen.add(j);queue.append(j)
out={'status':'MATCHED_THREE_ORIGINAL_INTEGRALS_TO_ARCHIVED_BOUNDARIES',
 'roots':[239,257,275],'reachableOriginalNodeCount':len(seen),'archivedIntervals':H['boundaryIntervals'],
 'sourceProfile':hdr['sourceProfile'],'historicalArchiveGraphSHA256':H['graphSHA256'],
 'historicalInputSHA256':hashlib.sha256(a.historic.read_bytes()).hexdigest(),
 'liveExportSHA256':hashlib.sha256(a.live.read_bytes()).hexdigest(),
 'scope':'Exact original DAG identity at the same node IDs including integrand, integration variable, endpoints and full typed dependency closure. Interval validity retains the independent archived source enclosure and private family attestations.',
 'release':'HOLD'}
a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS',len(seen),'typed original nodes, roots',out['roots'])
