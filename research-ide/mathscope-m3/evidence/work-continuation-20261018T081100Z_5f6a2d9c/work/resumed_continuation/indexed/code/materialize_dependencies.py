#!/usr/bin/env python3
"""Authenticated indexed argument/body closure; no producer or private seal."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
sys.path.insert(0,str(ROOT/'work/prune_recovery/native/code'))
from native_binding import SourceBindings, pin, canonical, digest, Unresolved, HEADER, CLOSURE
import argparse,collections,gzip,hashlib,importlib.util,json,time
OUT=Path(__file__).resolve().parents[1]
PIN='42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3'
DIRECT=ROOT/'work/prune_recovery/native/evidence/DIRECT_INDEXED_OPERAND_SUPPLEMENTS.json'
PLANS=ROOT/'work/prune_recovery/native/evidence/FINITE_INDEXED_RECIPES.json'
GRAMMAR=ROOT/'recovered/base/analysis/base/PR30-recovery-handoff/MathScopeCompute/tools/n6-native-domain-frontier-20261015/native_domain_extract.py'
def write(name,obj):
 (OUT/'evidence'/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n')
def load_grammar():
 if pin(GRAMMAR)['sha256']!='566e1a18b5417cafecf9fe7a4cd2e38d1e270c0cc29c1d984448a579a2a92f9d':raise Unresolved('operand grammar differs')
 spec=importlib.util.spec_from_file_location('indexed_pinned_grammar',GRAMMAR);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def run(source):
 start=time.monotonic();b=SourceBindings();h=load_grammar();direct=json.loads(DIRECT.read_text());plans=json.loads(PLANS.read_text())
 for rec in plans['recipes']:
  if rec!=b.indexed_recipe(rec['node']):raise Unresolved('source recipe changed')
 if source.stat().st_size!=32688149:raise Unresolved('compressed source size differs')
 hasher=hashlib.sha256()
 with source.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):hasher.update(block)
 if hasher.hexdigest()!=PIN:raise Unresolved('whole compressed source authentication failed')
 wanted=set()
 for rec in plans['recipes']:
  wanted.update(rec['outerParameters']);wanted.update(rec['outerArgumentNodes'])
  for row in rec['rows']:
   wanted.add(row['localBody']);wanted.update(row['localParameters']);wanted.update(row['argumentNodes']);wanted.add(row['rowCoefficientNode'])
   wanted.update(x for guard in row['guards'] for x in guard)
   for term in row['derivatives']:wanted.update(term['coefficientNodeFactors'])
 if direct['requestedDirectOperandIDs']!=sorted(wanted):raise Unresolved('direct operand requests differ from authenticated recipes')
 if {int(k) for k in direct['records']}!=wanted-set(b.nodes):raise Unresolved('direct supplemental record set differs')
 initial=dict(b.nodes);initial.update({int(k):v for k,v in direct['records'].items()})
 # Keep raw source prefix, parsing only transitively reached rows. All needed
 # references are checked against the authenticated source ID sequence.
 cap=max(int(k) for k in direct['records']);lines=[]
 with gzip.open(source,'rb') as f:
  if f.readline()!=HEADER.read_bytes():raise Unresolved('exact header differs')
  for i,line in enumerate(f):
   if i>cap:break
   # Authenticate every prefix source index without allocating every AST.
   index=int(line[1:line.index(b',')])
   if index!=i:raise Unresolved('source index sequence differs')
   lines.append(line)
 if len(lines)!=cap+1:raise Unresolved('truncated source prefix')
 for k,row in direct['records'].items():
  if json.loads(lines[int(k)])!=[int(k),row]:raise Unresolved('direct supplemental record differs from authenticated source: '+k)
 recovered={};nodes={};native={};bodyless={};edges=collections.Counter();stack=list(direct['requestedDirectOperandIDs']);parents={r:None for r in stack}
 def get(n):
  if n in initial:return initial[n]
  if n in recovered:return recovered[n]
  if type(n)is not int or not 0<=n<len(lines):raise Unresolved('required source outside authenticated prefix: '+str(n))
  ident,row=json.loads(lines[n]);assert ident==n
  recovered[n]=row;return row
 while stack:
  ident=stack.pop()
  if ident in nodes:continue
  row=get(ident);nodes[ident]=row
  for child in h.argument_children(row):
   edges['argument']+=1
   if child not in parents:parents[child]={'parent':ident,'kind':'argument'}
   stack.append(child)
  if row['op'] in h.NATIVE:
   key,definition=h.native_definition(row,b.registry)
   native[str(ident)]={'operation':row['op'],'registry':key,'definitionSHA256':digest(definition)}
   if type(definition.get('body'))is int:
    child=definition['body'];edges['nativeDefinitionBody']+=1
    if child not in parents:parents[child]={'parent':ident,'kind':'nativeDefinitionBody','registry':key}
    stack.append(child)
   else:bodyless[str(ident)]=native[str(ident)]
 # Original evidence records remain immutable. Only newly needed IDs are output.
 missing_arguments=sorted({c for row in nodes.values() for c in h.argument_children(row)}-set(nodes))
 missing_bodies=sorted({h.native_definition(row,b.registry)[1]['body'] for row in nodes.values() if row['op'] in h.NATIVE and type(h.native_definition(row,b.registry)[1].get('body'))is int}-set(nodes))
 if missing_arguments or missing_bodies:raise Unresolved('closure failed')
 report={'schema':'MathScope.ResumedIndexedDependencyClosure/1','implementationKind':'NEW RECOVERY, not original producer bytes',
 'inputs':{'header':pin(HEADER),'initializedClosure':pin(CLOSURE),'directOperands':pin(DIRECT),'recipes':pin(PLANS),'operandGrammar':pin(GRAMMAR)},
 'authentication':{'wholeCompressedSourceSHA256':PIN,'compressedBytes':source.stat().st_size,'wholeCompressedSourceAuthenticated':True,'sourcePrefixRecordsRead':len(lines),'SQLiteUsed':False,'originalProducerRun':False},
 'requestedDirectOperandCount':len(direct['requestedDirectOperandIDs']),'newTransitiveRecordCount':len(recovered),'reachableRecords':len(nodes),'reachableExistingRecordCount':len(nodes)-len(recovered),
 'newRecordOperations':dict(sorted(collections.Counter(x['op'] for x in recovered.values()).items())),
 'reachableOperations':dict(sorted(collections.Counter(x['op'] for x in nodes.values()).items())),
 'newRecords':{str(k):v for k,v in sorted(recovered.items())},'reachableNodeIDs':sorted(nodes),'semanticBoundaries':native,'bodylessSemanticBoundaries':bodyless,
 'closureEdgeCounts':dict(edges),'remainingArgumentDependencyIDs':missing_arguments,'remainingExplicitNativeBodyIDs':missing_bodies,
 'argumentAndExplicitBodyRecordClosureComplete':True,'nativeMathematicalKernelsEvaluated':False,'allNativeHiddenDependenciesMaterialized':False,
 'callerDomainsNumericallyChecked':False,'newM3Closures':0,'N706_closed':False,'N805_closed':False}
 write('TRANSITIVE_INDEXED_DEPENDENCIES.json',report)
 summary={k:report[k] for k in ['requestedDirectOperandCount','newTransitiveRecordCount','reachableRecords','newRecordOperations','reachableOperations','argumentAndExplicitBodyRecordClosureComplete']}
 summary.update({'nativeBoundaryCount':len(native),'bodylessNativeBoundaryCount':len(bodyless),'elapsedSeconds':round(time.monotonic()-start,3),'newM3Closures':0})
 write('DEPENDENCY_RECEIPT.json',summary);print(json.dumps(summary,sort_keys=True))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,default=ROOT/'work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz');run(p.parse_args().source)
