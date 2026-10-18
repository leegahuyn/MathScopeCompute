#!/usr/bin/env python3
"""Actual indexed local first derivative DAG and exact nearest-cell guards.

Uses the original formal variables before an explicit lexical application.
Native expression derivative calls remain exact, named evaluation obligations.
"""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
from fractions import Fraction as F
import collections,json
import materialize_dependencies as dep
ROOT=dep.ROOT;OUT=dep.OUT
from native_binding import canonical,digest,pin,Unresolved
TRANSITIVE=OUT/'evidence/TRANSITIVE_INDEXED_DEPENDENCIES.json'
SOURCE_COUNT=3892594
class DAG:
 def __init__(self,nodes,bindings,grammar):
  self.source=nodes;self.b=bindings;self.h=grammar;self.new={};self.lookup={};self.free_memo={};self.diff_memo={};self.trace=[]
 def node(self,i):return self.new[i] if i in self.new else self.source[i]
 def make(self,op,args):
  key=canonical([op,args]);i=self.lookup.get(key)
  if i is None:
   i=SOURCE_COUNT+len(self.new);self.new[i]={'op':op,'args':args};self.lookup[key]=i
  return i
 def q(self,x):
  x=F(x)
  if x==0:return 0
  if x==1:return 1
  return self.make('rational',[str(x.numerator),str(x.denominator)])
 def rational(self,i):
  n=self.node(i)
  return F(*map(int,n['args'])) if n['op']=='rational' else None
 def add(self,*terms):
  out=0
  for t in terms:
   if t==0:continue
   if out==0:out=t;continue
   x,y=self.rational(out),self.rational(t)
   out=self.q(x+y) if x is not None and y is not None else self.make('add',sorted([out,t]))
  return out
 def mul(self,*terms):
  out=1
  for t in terms:
   if t==0:return 0
   if t==1:continue
   x,y=self.rational(out),self.rational(t)
   out=self.q(x*y) if x is not None and y is not None else t if out==1 else self.make('multiply',sorted([out,t]))
  return out
 def power(self,x,n):
  if n==0:return 1
  if n==1:return x
  return self.make('integer_power',[x,n])
 def inv(self,x):return self.make('inverse',[x])
 def integral(self,body,binder,left,right):
  return 0 if body==0 or left==right else self.make('definite_integral',[body,binder,left,right])
 def apply(self,body,formals,values):
  if len(set(formals))!=len(formals) or len(formals)!=len(values):raise Unresolved('application arity or capture failure')
  return self.make('lexical_application',[body,formals,values])
 def children(self,i):
  n=self.node(i)
  if n['op']=='lexical_application':return [n['args'][0],*n['args'][2]]
  return self.h.argument_children(n)
 def free(self,i):
  if i in self.free_memo:return self.free_memo[i]
  op,a=self.node(i).values()
  if op=='coordinate':v={i}
  elif op=='definite_integral':v=(self.free(a[0])-{a[1]})|self.free(a[2])|self.free(a[3])
  elif op=='lexical_application':v=(self.free(a[0])-set(a[1]))|set().union(*(self.free(x) for x in a[2]))
  else:v=set().union(*(self.free(x) for x in self.children(i)))
  self.free_memo[i]=frozenset(v);return self.free_memo[i]
 def d(self,i,var):
  key=i,var
  if key in self.diff_memo:return self.diff_memo[key]
  op,a=self.node(i).values();d=lambda x:self.d(x,var)
  if var not in self.free(i):out=0;rule='independent formal variable'
  elif op=='coordinate':out=1;rule='formal coordinate'
  elif op=='add':out=self.add(*(d(x) for x in a));rule='sum'
  elif op=='multiply':out=self.add(self.mul(d(a[0]),a[1]),self.mul(a[0],d(a[1])));rule='product'
  elif op=='inverse':out=self.mul(self.q(-1),d(a[0]),self.power(i,2));rule='reciprocal'
  elif op=='integer_power':out=self.mul(self.q(a[1]),self.power(a[0],a[1]-1),d(a[0]));rule='integer power'
  elif op=='exp':out=self.mul(i,d(a[0]));rule='exponential'
  elif op=='log_positive':out=self.mul(d(a[0]),self.inv(a[0]));rule='positive logarithm'
  elif op=='sqrt_positive':out=self.mul(d(a[0]),self.inv(self.mul(self.q(2),i)));rule='positive square root'
  elif op=='sine':out=self.mul(self.make('cosine',[a[0]]),d(a[0]));rule='sine'
  elif op=='cosine':out=self.mul(self.q(-1),self.make('sine',[a[0]]),d(a[0]));rule='cosine'
  elif op=='source_step_derivative':out=self.mul(self.make(op,[a[0],a[1]+1]),d(a[0]));rule='original step derivative'
  elif op=='smooth_piecewise':
   # Exactly the original source join rule. No derivative of a nearest label
   # is taken. Matching source jets remain the original theorem's premise.
   out=self.make(op,a[:3]+[d(x) for x in a[3:]]);rule='original matching-jet piecewise rule'
  elif op=='definite_integral':
   body,binder,left,right=a;dl,dr=d(left),d(right)
   out=self.add(0 if binder==var else self.integral(d(body),binder,left,right),
      0 if dr==0 else self.mul(self.apply(body,[binder],[right]),dr),
      0 if dl==0 else self.mul(self.q(-1),self.apply(body,[binder],[left]),dl));rule='Leibniz with lexical endpoint binding'
  elif op in {'actual_expression_partial','m3_aux_expression_partial'}:
   key_def,definition=self.b.definition(self.node(i));terms=[]
   if len(a[1])!=len(definition['parameters']):raise Unresolved('native expression arity')
   for j,value in enumerate(a[1]):
    scale=d(value)
    if scale==0:continue
    orders=a[2].copy();orders[j]+=1
    if orders[j]>definition['derivativeLimits'][j]:raise Unresolved('original derivative budget exhausted')
    terms.append(self.mul(scale,self.make(op,[a[0],a[1],orders])))
   out=self.add(*terms);rule='original native expression chain rule'
  else:raise Unresolved(f'actual local derivative needs unsupported operation {op} at {i} w.r.t. {var}')
  self.diff_memo[key]=out;self.trace.append({'sourceNode':i,'formalVariable':var,'rule':rule,'resultNode':out});return out

def affine(g,root,atoms):
 if root in atoms:return {root:F(1)}
 n=g.node(root);op,a=n['op'],n['args']
 if op=='rational':return {None:F(*map(int,a))}
 if op=='add':
  out=collections.defaultdict(F)
  for c in a:
   for k,v in affine(g,c,atoms).items():out[k]+=v
  return {k:v for k,v in out.items() if v}
 if op=='multiply':
  x,y=(g.rational(c) for c in a)
  if x is not None:return {k:x*v for k,v in affine(g,a[1],atoms).items() if x*v}
  if y is not None:return {k:y*v for k,v in affine(g,a[0],atoms).items() if y*v}
 raise Unresolved('nonaffine guard expression')

def nearest_guard(g,guard):
 selector,left,right=guard
 if g.rational(left)!=F(-3,4) or g.rational(right)!=F(3,4):raise Unresolved('not original nearest-cell guard')
 n=g.node(selector)
 if n['op']!='add':raise Unresolved('guard selector is not original sum')
 # Try both operands as the continuous atom. The other must be the retained
 # ceiling of -(1/2+x); no claim depends on a sampled floating-point value.
 for x in n['args']:
  seen=set();stack=[selector]
  while stack:
   i=stack.pop()
   if i in seen or i==x:continue
   seen.add(i);q=g.node(i)
   if q['op']=='ceiling':
    try:
     if affine(g,selector,{x,i})=={x:F(1),i:F(1)} and affine(g,q['args'][0],{x})=={None:F(-1,2),x:F(-1)}:
      return {'guard':guard,'continuousAtom':x,'ceilingNode':i,'ceilingArgument':q['args'][0],
       'selectorIdentity':'x + ceil(-1/2 - x)','certifiedSelectorEnclosure':['-1/2','1/2'],
       'upperEndpointActuallyExcluded':True,'strictlyInsideOriginalGuard':True,
       'hypothesis':'continuousAtom is a finite defined real; inherited source-image definedness is not removed',
       'proof':'For y=-1/2-x, 0<=ceil(y)-y<1, so -1/2<=x+ceil(y)<1/2; [-1/2,1/2] is strictly inside (-3/4,3/4).'}
    except Unresolved:pass
   stack.extend(g.children(i))
 raise Unresolved('guard is not authenticated nearest-cell identity')

def main():
 if pin(TRANSITIVE)['sha256']!='81fc4a98953dd28683d7ae7f4e171eca92bcd258e9f7fbfb3160bebae8eaf43d':raise Unresolved('reviewed transitive source record evidence differs')
 if pin(dep.DIRECT)!=json.loads(TRANSITIVE.read_text())['inputs']['directOperands']:raise Unresolved('direct source operand evidence differs')
 b=dep.SourceBindings();h=dep.load_grammar();nodes=dict(b.nodes)
 for p,k in [(dep.DIRECT,'records'),(TRANSITIVE,'newRecords')]:nodes.update({int(i):r for i,r in json.loads(p.read_text())[k].items()})
 recipe=next(r for r in json.loads(dep.PLANS.read_text())['recipes']if r['node']==643019)
 if recipe!=b.indexed_recipe(643019):raise Unresolved('actual indexed call differs')
 g=DAG(nodes,b,h);local={};rows=[]
 for row in recipe['rows']:
  for term in row['derivatives']:
   key=(row['localBody'],tuple(term['localOrders']))
   if key not in local:
    body=row['localBody']
    for var,count in zip(row['localParameters'],term['localOrders']):
     for _ in range(count):body=g.d(body,var)
    if not g.free(body)<=set(row['localParameters']):raise Unresolved('derivative introduced unbound formal')
    local[key]={'originalBody':row['localBody'],'formalParameters':row['localParameters'],'orders':term['localOrders'],
      'formalDerivativeRoot':body,'freeCoordinates':sorted(g.free(body)),'differentiateBeforeSubstitution':True}
  # Row derivative is generated once per sign; each actual chart binds all
  # source arguments simultaneously in a separate lexical frame.
  terms=[]
  for term in row['derivatives']:
   body=local[(row['localBody'],tuple(term['localOrders']))]['formalDerivativeRoot']
   applied=g.apply(body,row['localParameters'],row['argumentNodes'])
   terms.append(g.mul(g.q(term['integerMultiplier']),*term['coefficientNodeFactors'],applied))
  unguarded=g.mul(row['rowCoefficientNode'],g.add(*terms));value=unguarded
  for selector,left,right in row['guards']:value=g.make('smooth_piecewise',[selector,left,right,0,value,0])
  rows.append({'rowIndex':row['index'],'sourceLabel':row['label'],'formalLocalDerivativeRoot':body,
     'lexicalApplication':applied,'unguardedRoot':unguarded,'guardedRoot':value,
     'guardEvaluationOrder':list(reversed(row['guards']))})
 field=g.apply(g.add(*(r['guardedRoot']for r in rows)),recipe['outerParameters'],recipe['outerArgumentNodes'])
 center=[r for r in recipe['rows']if r['label']['key']=='0:0:0:0']
 guards=[nearest_guard(g,v)for v in center[0]['guards'][1:]]
 # Track exact source dependency path to the missing slow inverse for the
 # innermost radial guard. This is a precise evaluation obligation, not a
 # source-domain relaxation or a newly supplied numeric oracle.
 def path_to(root,target):
  todo=[(root,[root])];seen=set()
  while todo:
   i,p=todo.pop()
   if i==target:return p
   if i in seen:continue
   seen.add(i);todo.extend((c,p+[c])for c in g.children(i))
  return None
 remaining=center[0]['guards'][0];slow_path=path_to(remaining[0],622820)
 if not slow_path:raise Unresolved('radial guard no longer reaches actual slow inverse')
 native_leaves={str(i):v for i,v in g.new.items()if v['op'] in h.NATIVE}
 # Controls exercise only authenticated graph perturbations, never toy values.
 negative=[]
 original=g.node(guards[0]['ceilingNode']);bad_id=guards[0]['ceilingNode'];g.source=dict(g.source);g.source[bad_id]={'op':'ceiling','args':[1]}
 try:nearest_guard(g,guards[0]['guard']);raise AssertionError('mutated ceiling accepted')
 except Unresolved:negative.append('changed actual ceiling argument rejected')
 g.source[bad_id]=original
 try:nearest_guard(g,[guards[0]['guard'][0],0,1]);raise AssertionError('mutated boundary accepted')
 except Unresolved:negative.append('changed original guard endpoints rejected')
 try:g.d(632178,622791);raise AssertionError('frozen nearest label derivative accepted')
 except Unresolved as e:negative.append('frozen nearest-label derivative rejected: '+str(e))
 report={'schema':'MathScope.ResumedActualIndexedDerivativeConnection/1','implementationKind':'NEW RECOVERY symbolic derivative materializer',
 'inputs':{'recipes':pin(dep.PLANS),'transitiveDependencies':pin(TRANSITIVE),'originalHeader':pin(dep.HEADER)},
 'actualIndexedCall':643019,'originalIndexedDefinitionSHA256':recipe['sourceDefinitionSHA256'],'retainedRows':len(rows),
 'formalDerivativeBodies':list(local.values()),'generatedNodeNamespaceStart':SOURCE_COUNT,'generatedNodes':{str(k):v for k,v in g.new.items()},
 'ruleApplications':g.trace,'rows':rows,'assembledFieldRoot':field,
 'nativeDerivativeLeaves':native_leaves,'nativeDerivativeLeavesNumericallyEvaluated':False,
 'centerRows':[r['index']for r in center],'centerOuterGuardCertificates':guards,
 'conditionalActiveGuardCountPerCenterRow':len(guards),'guardProofScope':'All finite defined source values of the continuous atoms; actual source definedness remains required',
 'remainingInnerGuard':remaining,'remainingInnerGuardPathToSlowInverse':slow_path,
 'exactRemainingKernel':{'node':622820,'operation':nodes[622820]['op'],'arguments':nodes[622820]['args'],'definition':b.registry['monotone'][2],
  'need':'Certified ActualCommonBandSlowInverse evaluation at actual caller Z,T, then a certified enclosure of R^2/(2*s) relative to original endpoints Xa (node 3617) and XR*exp(node 319) (node 28826); boundary crossing must subdivide or remain unresolved'},
 'negativeControls':negative,'localOrdinaryDerivativeDAGMaterialized':True,'allNestedNativeDerivativeBodiesMaterialized':False,
 'originalSourceMutated':False,'callerNumericalValuesInvented':False,'actualIndexedNumericalValueComputed':False,'newM3Closures':0,'N706_closed':False,'N805_closed':False}
 dep.write('ACTUAL_INDEXED_DERIVATIVE_CONNECTION.json',report)
 summary={'actualIndexedCall':643019,'retainedRows':len(rows),'formalLocalBodies':len(local),'generatedDAGNodes':len(g.new),'formalDerivativeRules':len(g.trace),
 'nativeDerivativeLeaves':len(native_leaves),'centerRows':[r['index']for r in center],'exactOuterGuardCertificates':len(guards),'negativeControlsPassed':len(negative),
 'remainingGuard':remaining,'remainingKernel':622820,'actualNumericalValueComputed':False,'newM3Closures':0}
 dep.write('DERIVATIVE_RECEIPT.json',summary);print(json.dumps(summary,sort_keys=True))
if __name__=='__main__':main()
