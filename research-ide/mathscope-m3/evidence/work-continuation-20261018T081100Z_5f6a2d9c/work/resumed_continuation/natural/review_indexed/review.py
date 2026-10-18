#!/usr/bin/env python3
"""Independent raw-source and expanded-polynomial indexed review."""
import collections,gzip,hashlib,importlib.util,json,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
INDEX=ROOT/'work/resumed_continuation/indexed'
sys.dont_write_bytecode=True
sys.path.insert(0,str(ROOT/'work/prune_recovery/native/code'))
from native_binding import SourceBindings

def canonical(x):return json.dumps(x,sort_keys=True,separators=(',',':'))
def pin(p):return {'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def plus(a,b):
 d=collections.defaultdict(F,a)
 for k,v in b.items():d[k]+=v
 return {k:v for k,v in d.items() if v}
def times(a,b):
 d=collections.defaultdict(F)
 for am,av in a.items():
  for bm,bv in b.items():
   m=collections.defaultdict(int,am)
   for k,v in bm:m[k]+=v
   d[tuple(sorted((k,v)for k,v in m.items()if v))]+=av*bv
 return {k:v for k,v in d.items() if v}
def atom(k):return {((k,1),):F(1)}
def const(q):return {} if q==0 else {():F(q)}

def main():
 paths=[INDEX/'evidence/TRANSITIVE_INDEXED_DEPENDENCIES.json',INDEX/'evidence/ACTUAL_INDEXED_DERIVATIVE_CONNECTION.json']
 dep,der=(json.loads(p.read_text())for p in paths)
 closure=json.loads((ROOT/'work/prune_recovery/scalar/evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json').read_text())
 direct=json.loads((ROOT/'work/prune_recovery/native/evidence/DIRECT_INDEXED_OPERAND_SUPPLEMENTS.json').read_text())
 nodes={int(k):v for k,v in closure['records'].items()}
 nodes.update({int(k):v for k,v in direct['records'].items()})
 nodes.update({int(k):v for k,v in dep['newRecords'].items()})
 source=ROOT/'work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz'
 assert hashlib.sha256(source.read_bytes()).hexdigest()=='42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3'
 wanted=set(dep['reachableNodeIDs']); matched=set(); max_wanted=max(wanted)
 with gzip.open(source,'rb') as f:
  f.readline()
  for line in f:
   i,n=json.loads(line)
   if i in wanted:
    assert nodes[i]==n,('raw source mismatch',i)
    matched.add(i)
   if i>=max_wanted:break
 assert matched==wanted
 grammar_path=ROOT/'recovered/base/analysis/base/PR30-recovery-handoff/MathScopeCompute/tools/n6-native-domain-frontier-20261015/native_domain_extract.py'
 spec=importlib.util.spec_from_file_location('independent_pinned_grammar',grammar_path);grammar=importlib.util.module_from_spec(spec);spec.loader.exec_module(grammar)
 binding=SourceBindings()
 stack=list(direct['requestedDirectOperandIDs']);reachable=set()
 while stack:
  i=stack.pop()
  if i in reachable:continue
  reachable.add(i);n=nodes[i];stack.extend(grammar.argument_children(n))
  if n['op'] in grammar.NATIVE:
   _,definition=grammar.native_definition(n,binding.registry)
   if type(definition.get('body')) is int:stack.append(definition['body'])
 assert reachable==wanted
 generated={int(k):v for k,v in der['generatedNodes'].items()};allnodes=nodes|generated
 R=622802;free_cache={};poly_cache={};native_keys={}
 def free(i):
  if i in free_cache:return free_cache[i]
  n=allnodes[i];op,a=n['op'],n['args']
  if op=='coordinate':s={i}
  elif op=='definite_integral':s=(free(a[0])-{a[1]})|free(a[2])|free(a[3])
  elif op=='lexical_application':s=(free(a[0])-set(a[1]))|set().union(*(free(v)for v in a[2]))
  else:s=set().union(*(free(v)for v in grammar.argument_children(n)))
  free_cache[i]=s;return s
 def native_key(n):
  key='native:'+canonical(n);native_keys[key]=n;return key
 def poly(i):
  if i in poly_cache:return poly_cache[i]
  n=allnodes[i];op,a=n['op'],n['args']
  if op=='rational':v=const(F(*map(int,a)))
  elif i==R:v=atom('R')
  elif i in nodes and R not in free(i):v=atom('constant:'+str(i))
  elif op=='add':v=plus(poly(a[0]),poly(a[1]))
  elif op=='multiply':v=times(poly(a[0]),poly(a[1]))
  elif op=='inverse':
   p=poly(a[0]);assert len(p)==1
   mon,co=next(iter(p.items()));v={tuple((k,-e)for k,e in mon):1/co}
  elif op=='integer_power':
   assert a[1]>=0;v=const(1)
   for _ in range(a[1]):v=times(v,poly(a[0]))
  elif op=='smooth_piecewise':
   # One independent selector indicator for each original branch. This
   # proves all branchwise polynomial derivatives simultaneously, with the
   # source matching-jet premise retained at joins.
   v={}
   for j,body in enumerate(a[3:]):v=plus(v,times(atom('guard:'+canonical([a[:3],j])),poly(body)))
  elif op=='actual_expression_partial':
   assert a[1][0]==R and all(R not in free(x)for x in a[1][1:])
   v=atom(native_key(n))
  else:raise AssertionError(('unsupported actual polynomial operation',i,op))
  poly_cache[i]=v;return v
 def derivative(p):
  result={}
  for mon,co in p.items():
   for k,power in mon:
    if k=='R':extra={};factor=power
    elif k.startswith('native:'):
     n=json.loads(json.dumps(native_keys[k]));n['args'][2][0]+=1
     extra={native_key(n):1};factor=power
    else:continue
    new=dict(mon);new[k]-=1
    for a,v in extra.items():new[a]=new.get(a,0)+v
    term={tuple(sorted((a,v)for a,v in new.items()if v)):co*factor}
    result=plus(result,term)
  return result
 derivative_checks=[]
 for b in der['formalDerivativeBodies']:
  assert b['orders']==[1]+[0]*8 and b['formalParameters'][0]==R
  expected=derivative(poly(b['originalBody']));actual=poly(b['formalDerivativeRoot'])
  assert expected==actual,('derivative differs',b['originalBody'])
  derivative_checks.append({'body':b['originalBody'],'root':b['formalDerivativeRoot'],'expandedLaurentMonomials':len(actual),'pass':True})
 recipe=binding.indexed_recipe(643019)
 assert len(recipe['rows'])==len(der['rows'])==162
 for actual,row in zip(der['rows'],recipe['rows']):
  assert actual['rowIndex']==row['index'] and actual['sourceLabel']==row['label']
  app=allnodes[actual['lexicalApplication']]
  assert app=={'op':'lexical_application','args':[actual['formalLocalDerivativeRoot'],row['localParameters'],row['argumentNodes']]}
  assert actual['guardEvaluationOrder']==list(reversed(row['guards']))
  root=actual['guardedRoot']
  for guard in reversed(row['guards']):
   n=allnodes[root];assert n['op']=='smooth_piecewise'
   assert n['args'][:3]==guard and n['args'][3]==n['args'][5]==0
   root=n['args'][4]
  assert root==actual['unguardedRoot']
 field=allnodes[der['assembledFieldRoot']]
 assert field['op']=='lexical_application' and field['args'][1:]==[recipe['outerParameters'],recipe['outerArgumentNodes']]
 def affine(i,atoms):
  if i in atoms:return {i:F(1)}
  n=nodes[i];op,a=n['op'],n['args']
  if op=='rational':return {None:F(*map(int,a))}
  if op=='add':
   d=collections.defaultdict(F)
   for child in a:
    for k,v in affine(child,atoms).items():d[k]+=v
   return {k:v for k,v in d.items()if v}
  if op=='multiply':
   p,q=(affine(c,atoms)for c in a)
   if set(p)<= {None}:return {k:p.get(None,0)*v for k,v in q.items()if p.get(None,0)*v}
   if set(q)<= {None}:return {k:q.get(None,0)*v for k,v in p.items()if q.get(None,0)*v}
  raise AssertionError(('nonaffine guard',i))
 for guard in der['centerOuterGuardCertificates']:
  selector,left,right=guard['guard'];x=guard['continuousAtom'];ceil=guard['ceilingNode']
  assert nodes[ceil]['op']=='ceiling'
  assert affine(selector,{x,ceil})=={x:F(1),ceil:F(1)}
  assert affine(nodes[ceil]['args'][0],{x})=={None:F(-1,2),x:F(-1)}
  assert affine(left,set())=={None:F(-3,4)} and affine(right,set())=={None:F(3,4)}
  assert F(-3,4)<F(-1,2)<=F(1,2)<F(3,4)
 assert der['remainingInnerGuard']==[622824,3617,28826]
 path=der['remainingInnerGuardPathToSlowInverse']
 assert path[0]==622824 and path[-1]==622820
 for i,j in zip(path,path[1:]):assert j in grammar.argument_children(nodes[i])
 assert not der['actualIndexedNumericalValueComputed'] and der['newM3Closures']==0
 report={'schema':'MathScope.IndependentIndexedContinuationReview/1','inputs':[pin(p)for p in paths+[INDEX/'code/materialize_dependencies.py',INDEX/'code/exact_derivative_connection.py']],
  'status':'PASS_WITH_STATED_SYMBOLIC_AND_DEFINED_REAL_SCOPE','rawSourceRecordsIndependentlyMatched':len(matched),
  'argumentAndExplicitBodyClosureIndependentlyRecomputed':True,'newTransitiveRecordCount':len(dep['newRecords']),
  'derivativeMethod':'Expand actual bodies as exact sparse Laurent polynomials in R, native-function atoms, and original branch indicators; differentiate expanded monomials and compare with new derivative DAG.',
  'localDerivativeChecks':derivative_checks,'originalNativeDerivativeLeavesRetained':len(der['nativeDerivativeLeaves']),
  'all162LexicalBindingsAndGuardWrappersChecked':True,'fourNearestCellIdentitiesChecked':True,
  'nearestCellProof':'0<=ceil(y)-y<1 gives -1/2<=x+ceil(-1/2-x)<1/2, inside the original (-3/4,3/4).',
  'remainingActualInnerGuardAndSlowInversePathChecked':True,
  'limitations':['Branchwise derivative equality uses original matching-jet theorem at joins','Native derivative functions remain unevaluated','Nearest-cell guards require finite defined real atoms','Inner slow-inverse guard and actual global numerical value remain unresolved'],
  'newM3Closures':0}
 (OUT/'REVIEW.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':report['status'],'sourceRecords':len(matched),'newRecords':len(dep['newRecords']),'localDerivatives':derivative_checks,'rows':162,'guards':4,'newM3Closures':0}))

if __name__=='__main__':main()
