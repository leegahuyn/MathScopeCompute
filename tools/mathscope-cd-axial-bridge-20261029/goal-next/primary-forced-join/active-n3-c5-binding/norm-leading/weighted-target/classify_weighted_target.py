#!/usr/bin/env python3
"""Split source N_0..N_6 dependencies at independently matched FTC roots.

The proof receipt is a bound on 168 positive rows, not an estimate of N_m.
All other source dependencies retain their own proof obligations.
"""
import argparse,collections,hashlib,json
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--frontier',type=Path,required=True);p.add_argument('--index',type=Path,required=True);p.add_argument('--match',type=Path,required=True);p.add_argument('--directed',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
F=json.loads(a.frontier.read_bytes());I=json.loads(a.index.read_bytes());M=json.loads(a.match.read_bytes());D=json.loads(a.directed.read_bytes())
assert F['graphNamespace']==I['graphNamespace']=='norm' and F['prefix']==I['prefix']==3
assert M['status']=='MATCHED_168_TYPED_FACE_ROOTS_PROVENANCE_REQUIRES_SEPARATE_ATTESTATION' and M['matchedCount']==168 and M['faceCount']==672
assert D['status']=='PRIOR_C7_DIRECTED_168_CANDIDATES_READBACK' and D['inputSHA256']==M['candidateSHA256'] and sum(D['counts'].values())==168 and D['commonCandidateDyadicUpper'].startswith('T15,')
assert F['roots']['K']==I['normRoot'] and I['targetSourceProfileSHA256']==M['sourceProfile']
def key(r):return (r['kind'],r['component'],r['radialOrder'],r['etaOrder'])
idx={key(r):r for r in I['targetFTC']};matched={key(r):r for r in M['matched']}
assert idx.keys()==matched.keys() and len(idx)==168
for k in idx:
 assert idx[k]['bound']==matched[k]['liveC6Root']
 assert [x['upperBound'] for x in idx[k]['faces']]==matched[k]['liveFaces']
targets={r['bound']:key(r) for r in I['targetFTC']}; coeff={r['bound']:r['sourceConstant'] for r in I['coefficientFTC']}
assert len(targets)==168 and not (targets.keys() & coeff.keys())
nodes={x['id']:x['node'] for x in F['nodes']};boundary={x['id']:x['op'] for x in F['nonArithmeticBoundaries']}
assert len(nodes)==len(F['nodes']) and len(boundary)==len(F['nonArithmeticBoundaries'])
rows=[]
for m,root in enumerate(F['roots']['weightedTarget']):
 queue=[root];seen={root};hits={};cftc={};opaque={};operators=collections.Counter();parameters=set()
 for i in queue:
  if i in targets: hits[i]=targets[i];continue
  if i in coeff:cftc[i]=coeff[i];continue
  n=nodes[i];op=n['op'];x=n['args'];operators[op]+=1
  if i in boundary:assert op==boundary[i];opaque[i]=op;continue
  if op=='source_parameter':parameters.add(x[0]);continue
  if op=='rational':continue
  if op in {'integer_power','inverse','exp','log_positive','sqrt_positive','ceiling','ceiling_nonnegative'}:children=x[:1]
  elif op in {'add','multiply','maximum'}:children=x
  else:raise AssertionError((i,op))
  for c in children:
   assert c in nodes,(i,c)
   if c not in seen:seen.add(c);queue.append(c)
 rows.append({'order':m,'root':root,'targetRows':len(hits),'targetOrders':dict(sorted(collections.Counter(str(sum(k[2:])) for k in hits.values()).items())),
  'matchedTargetIDs':sorted(hits),'coefficientFTC':len(cftc),'coefficientFTCSourceConstant':sum(cftc.values()),
  'opaqueCount':len(opaque),'opaqueOperations':dict(collections.Counter(opaque.values())), 'opaqueIDs':sorted(opaque),
  'operators':dict(operators),'sourceParameters':sorted(parameters),'visitedNodes':len(seen)})
out={'status':'PASS_DEPENDENCY_CLASSIFICATION_ONLY','rootRows':rows,'targetFTCAllBelowTower15':True,
 'towerDefinition':'T1=2; T(j+1)=2^Tj; strict numerical interval bounds independently verified by check_c7_directed.py',
 'inputSHA256':{str(q):hashlib.sha256(q.read_bytes()).hexdigest() for q in (a.frontier,a.index,a.match,a.directed)},
 'scope':'N_m traversal stops at 168 structurally matched live target FTC roots; coefficient FTC and other opaque source boundaries remain unbounded. No N_m or K numerical endpoint is claimed.',
 'release':'HOLD'}
a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps([{k:r[k] for k in ('order','root','targetRows','coefficientFTC','opaqueCount','opaqueOperations')} for r in rows]))
