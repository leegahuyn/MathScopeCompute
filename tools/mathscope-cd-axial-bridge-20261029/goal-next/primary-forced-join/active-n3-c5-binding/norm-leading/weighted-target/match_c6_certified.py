#!/usr/bin/env python3
"""Exact lexical/typed comparison of live C6 FTC faces to pinned C7 receipts.

No shared-prefix shortcut is assumed; old live headers without prefix hashes
remain verifiable if their reachable typed DAG and native definitions suffice.
"""
import argparse,gzip,hashlib,json,re,sys
from pathlib import Path
from collections import Counter
from functools import lru_cache
from safe_common_nodes import cert

p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,default=Path('work/goal-next/continuation38/target-bound/c7-grammar-test.jsonl.gz'));p.add_argument('--candidates',type=Path,default=Path('work/goal-next/continuation38/target-bound/c7-candidate-168.json'));p.add_argument('--live',type=Path,required=True);p.add_argument('--comparator',type=Path,default=Path('work/goal-next/whole-k-prefix/compare_selector_exports.py'));p.add_argument('--out',type=Path,required=True);p.add_argument('--self-test',action='store_true');a=p.parse_args()
pins={a.archive:'1cb16569006d9481b7e26d09c030c363db50ca0f5c8136ed3a1a66ddf6055357',a.candidates:'adb3eb331af0434058588f8f6db512633fc6a5e24f87b37a249e804df3f03ac2',a.comparator:'63753fb59a4848c15df43a03d9e18a6f202cf217dd0e5101e46ac15532429ece'}
for f,d in pins.items():assert hashlib.sha256(f.read_bytes()).hexdigest()==d,f
same_archive=hashlib.sha256(a.live.read_bytes()).hexdigest()==pins[a.archive]
assert not same_archive or a.self_test,'Archived self-comparison requires --self-test and is not a live binding.'
assert not a.self_test or same_archive,'--self-test expects the same archived DAG on both sides.'
sys.path.insert(0,str(a.comparator.parent));from compare_selector_exports import Compare,Difference,typed_controls
sys.setrecursionlimit(12000)
class Dag:
 def __init__(self,path):
  self.nodes={};self.reg={k:{} for k in ('expression','picard','quadratic','monotone')};h=hashlib.sha256();header=None;trailer=None
  with gzip.open(path,'rt',encoding='utf8') as f:
   for line in f:
    item=json.loads(line);kind=item['kind']
    if kind=='header':assert header is None;header=item
    elif kind=='node':
     assert item['id'] not in self.nodes;self.nodes[item['id']]=item['node']
     h.update((json.dumps([item['id'],item['node']],ensure_ascii=False,separators=(',',':'))+'\n').encode())
    elif kind=='definition':
     assert item['type'] in self.reg and item['id'] not in self.reg[item['type']];self.reg[item['type']][item['id']]=item['definition']
    elif kind=='trailer':assert trailer is None;trailer=item
    else:raise AssertionError(('unknown-record',kind))
  assert header and trailer and header['schema']=='MathScope.ActualTargetC6TypedDag/1'
  assert header['rowCount']==len(header['rows'])==168 and len(self.nodes)==header['nodeCount']==trailer['nodeCount']
  assert h.hexdigest()==header['nodeRecordsSHA256']
  assert {k:len(v) for k,v in self.reg.items()}==header['definitionCounts']==trailer['definitionCounts']
  self.header=header;self.base={}
  for k,vals in self.reg.items():
   array=[None]*(max(vals,default=-1)+1)
   for i,x in vals.items():array[i]=x
   self.base[k]=array
 def node(self,i):
  if i not in self.nodes:raise Difference('missing typed reachable node '+str(i))
  n=self.nodes[i];return n['op'],n['args']

class TargetCompare(Compare):
 def compare(self,i,j,bindings=()):
  if i==j and i in getattr(self,'certified',()) and all(x==y or i<min(x,y) for x,y in bindings):return
  lop,la=self.exports[0].node(i);rop,ra=self.exports[1].node(j)
  if lop==rop=='actual_expression_partial':
   dl=self.exports[0].base['expression'][la[0]];dr=self.exports[1].base['expression'][ra[0]]
   nl=self.definition(0,'expression',la[0]).get('name','');nr=self.definition(1,'expression',ra[0]).get('name','')
   if nl.startswith('audited-target-wrapper/') or nr.startswith('audited-target-wrapper/'):
    if len(la[2])!=2 or len(ra[2])!=2 or any(type(x) is not int or x<0 or x>8 for x in [*la[2],*ra[2]]):
     raise Difference('target wrapper derivative request exceeds jointly checked budget')
    if any(x>y for x,y in zip(la[2],dl['derivativeLimits'])) or any(x>y for x,y in zip(ra[2],dr['derivativeLimits'])):
     raise Difference('target wrapper derivative request exceeds source budget')
  return super().compare(i,j,bindings)
 def definition(self,side,kind,index):
  d=super().definition(side,kind,index)
  if kind!='expression':return d
  name=d.get('name','');kind_tag=None;component=None
  m=re.fullmatch(r'DirectionalActualTarget_(inner|outer|middle)_([01])',name)
  if not m:m=re.fullmatch(r'ActualCommonTargetRegular_(inner|outer)_([01])',name)
  if m:kind_tag,component=m.groups()
  else:
   m=re.fullmatch(r'ActualCommonTargetMiddle_([01])',name)
   if m:kind_tag='middle';component=m.group(1)
  if kind_tag is None:return d
  limits=d.get('derivativeLimits');assert isinstance(limits,list) and len(limits)==2 and all(type(x) is int and x>=8 for x in limits),(name,limits)
  return {**d,'name':'audited-target-wrapper/'+kind_tag+'/'+component,'derivativeLimits':[8,8]}

def wrapper_controls():
 class Tiny:
  def __init__(self,name,limits):
   self.nodes=[('rational',['1','1']),('coordinate',['x']),('coordinate',['eta']),('add',[1,2]),('actual_expression_partial',[0,[0,0],[6,0]])]
   self.base={'expression':[{'name':name,'parameters':[1,2],'body':3,'derivativeLimits':limits,'implementation':'fixture','unspecifiedOracle':False}]}
  def node(self,i):return self.nodes[i]
 left=Tiny('DirectionalActualTarget_inner_0',[9,9]);right=Tiny('ActualCommonTargetRegular_inner_0',[8,8])
 TargetCompare(left,right,0).compare(4,4)
 try:TargetCompare(left,Tiny('ActualCommonTargetRegular_inner_1',[8,8]),0).compare(4,4)
 except Difference:pass
 else:raise AssertionError('wrong target component accepted')
 try:TargetCompare(left,Tiny('ActualCommonTargetRegular_inner_0',[7,8]),0).compare(4,4)
 except AssertionError:pass
 else:raise AssertionError('insufficient target derivative budget accepted')
 excessive=Tiny('ActualCommonTargetRegular_inner_0',[8,8]);excessive.nodes[4]=('actual_expression_partial',[0,[0,0],[9,0]])
 try:TargetCompare(left,excessive,0).compare(4,4)
 except Difference:pass
 else:raise AssertionError('out-of-budget derivative request accepted')
 return {'C7_C6_wrapper_alias_allowed':True,'wrong_component_rejected':True,'insufficient_budget_rejected':True,'out_of_budget_request_rejected':True}

left,right=Dag(a.archive),Dag(a.live); candidates=json.loads(a.candidates.read_bytes());assert candidates['count']==168
assert left.header['sourceProfile']==right.header['sourceProfile']==candidates['sourceParameterSHA256']
def key(row):return (row['kind'],row['component'],row['radialOrder'],row['etaOrder'])
L={key(x):x for x in left.header['rows']};R={key(x):x for x in right.header['rows']};C={key(x):x for x in candidates['rows']}
assert len(L)==len(R)==len(C)==168 and L.keys()==R.keys()==C.keys()
# Same-byte archive self-test may shortcut its identical node IDs. A real
# live DAG never receives that shortcut without independent prefix evidence.
controls=typed_controls();wrapper_tests=wrapper_controls()
compare=TargetCompare(left,right,0);compare.certified=cert(left,right);matched=[]
print('independently certified shared dependency-closed nodes:',len(compare.certified),flush=True)
for k in sorted(C):
 l,r,c=L[k],R[k],C[k]
 assert l['bound']==c['originalC7Root'] and [x['upperBound'] for x in l['faces']]==c['originalC7Faces']
 try:
  for i,(lf,rf) in enumerate(zip(l['faces'],r['faces'],strict=True)):
   assert lf['mask']==rf['mask']==i
   compare.context=(*k,'face',i);compare.compare(lf['upperBound'],rf['upperBound'])
  compare.context=(*k,'whole');compare.compare(l['bound'],r['bound'])
 except Difference as exc:
  result={'status':'FAIL_TYPED_LEXICAL_MATCH','row':k,'reason':exc.reason,'frames':exc.frames,'matched':len(matched),'release':'HOLD'}
  a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8');raise SystemExit(json.dumps(result))
 matched.append({'kind':k[0],'component':k[1],'radialOrder':k[2],'etaOrder':k[3],
                 'archivedC7Root':l['bound'],'liveC6Root':r['bound'],'archivedFaces':[x['upperBound'] for x in l['faces']],
                 'liveFaces':[x['upperBound'] for x in r['faces']],'directedInterval':c['directedInterval']})
 if len(matched)%28==0:print('PASS',len(matched),flush=True)
# A face-integral cannot be silently exchanged with its zero-dimensional corner.
q=next(x for x in R.values() if x['radialOrder']==x['etaOrder']==0)
try:compare.compare(q['faces'][0]['upperBound'],q['faces'][1]['upperBound'])
except Difference:pass
else:raise AssertionError('wrong-face negative control was accepted')
out={'status':'TEST_ONLY_ARCHIVE_SELF_COMPARISON' if same_archive else 'MATCHED_168_TYPED_FACE_ROOTS_PROVENANCE_REQUIRES_SEPARATE_ATTESTATION','sourceProfile':candidates['sourceParameterSHA256'],
 'matchedCount':len(matched),'faceCount':len(matched)*4,'matched':matched,'normalizations':dict(compare.normalizations),
 'negativeControl':'corner versus integral face rejected','typedControls':controls,'wrapperControls':wrapper_tests,'sharedPrefixShortcut':False,'certifiedCommonDependencyClosedNodes':len(compare.certified),
 'scope':'Typed lexical equality of live source C6 FTC face roots to pinned archived C7 rows and their directed intervals. The original analytic majorants, hosted source seal and complete K arithmetic remain separate.',
 'liveSHA256':hashlib.sha256(a.live.read_bytes()).hexdigest(),'archiveSHA256':pins[a.archive],'candidateSHA256':pins[a.candidates],'release':'HOLD'}
a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS archive self-test only' if same_archive else 'PASS typed face equivalence; live provenance requires separate attestation')
