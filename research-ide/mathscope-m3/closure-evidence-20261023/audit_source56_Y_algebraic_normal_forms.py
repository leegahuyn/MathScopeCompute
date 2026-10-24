#!/usr/bin/env python3
"""Authenticated first-FiveMap 56-source-Y algebraic normalization.

Every exp(log_positive(z)) cancellation retains the required z>0 guard.
Xa=4/Lambda is used ONLY under the source SHA-bound original receipt.
Algebraic simplification is NOT Y<=5, B_rho existence, interval evaluation,
an actual final A/b/p field, or a certificate for any of the 67 final jets.
"""
from fractions import Fraction as F
from collections import defaultdict
from pathlib import Path
import gzip,hashlib,json,sys

ORIGINAL_SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
NATIVE_SHA='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'

class InvalidOriginalNaturalSource(ValueError):pass

class Term:
 def __init__(self,coefficient=F(1),factors=(),guards=()):
  self.coefficient=coefficient;self.factors=tuple(sorted((k,v) for k,v in dict(factors).items() if v))
  self.guards=frozenset(guards)
 def times(self,b):
  e=dict(self.factors)
  for k,v in b.factors:e[k]=e.get(k,0)+v
  return Term(self.coefficient*b.coefficient,e.items(),self.guards|b.guards)
 def power(self,k):
  if k<0 and self.coefficient==0:raise InvalidOriginalNaturalSource('inverse zero')
  return Term(self.coefficient**k,[(a,v*k) for a,v in self.factors],self.guards)
 def text(self):
  out=[str(self.coefficient)] if self.coefficient!=1 or not self.factors else []
  out += [k+(('^'+str(v)) if v!=1 else '') for k,v in self.factors]
  return ' * '.join(out)
 def key(self):return (str(self.coefficient),self.factors)
def atom(key):return Term(factors=[(key,1)])

class OriginalAlgebra:
 def __init__(self,nodes):self.nodes=nodes;self.cache={};self.stack=set()
 def node(self,i):
  if type(i)!=int or i<0 or i>=len(self.nodes):raise InvalidOriginalNaturalSource('invalid graph node')
  return self.nodes[i]
 def positive(self,i):
  x=self.node(i);op=x['op'];a=x['args']
  if op=='rational':return F(int(a[0]),int(a[1]))>0
  if op=='source_parameter':return a[0] in ('Xa','Lambda','Q','rho','t1','CSelected')
  if op=='exp':return True
  if op=='multiply':return all(self.positive(y) for y in a)
  if op=='inverse':return self.positive(a[0])
  if op=='integer_power':return self.positive(a[0])
  return False
 def solve(self,i):
  if i in self.cache:return self.cache[i]
  if i in self.stack:raise InvalidOriginalNaturalSource('cyclic original AST')
  self.stack.add(i)
  x=self.node(i);op=x['op'];a=x['args']
  if op=='rational':v=Term(F(int(a[0]),int(a[1])))
  elif op=='source_parameter':
   v=Term(F(4),[('Lambda',-1)]) if a==['Xa'] else atom(a[0] if a==['Lambda'] else 'PARAM:'+a[0])
  elif op=='coordinate':v=atom('COORD:'+a[0])
  elif op=='multiply':
   v=Term()
   for ch in a:v=v.times(self.solve(ch))
  elif op=='inverse':v=self.solve(a[0]).power(-1)
  elif op=='integer_power':
   if type(a[1])!=int:raise InvalidOriginalNaturalSource('integer power metadata')
   v=self.solve(a[0]).power(a[1])
  elif op=='exp':
   z=self.node(a[0])
   if z['op']=='log_positive':
    j=z['args'][0];base=self.solve(j)
    guard=() if self.positive(j) else ('NODE_'+str(j)+'_STRICT_POSITIVE_FOR_LOG',)
    v=Term(base.coefficient,base.factors,base.guards|frozenset(guard))
   else:v=atom('EXP_NODE:'+str(a[0]))
  elif op=='log_positive':
   z=self.node(a[0])
   v=self.solve(z['args'][0]) if z['op']=='exp' else atom('LOG_NODE:'+str(a[0]))
  elif op=='add':
   t=[self.solve(j) for j in a]
   v=Term(sum((b.coefficient for b in t),F(0)),guards=frozenset().union(*(b.guards for b in t))) if all(not b.factors for b in t) else atom('SUM_NODE:'+str(i))
  else:v=atom(op.upper()+'_NODE:'+str(i))
  self.stack.remove(i);self.cache[i]=v;return v

def certify_original56(source_dir,receipt_path):
 m=json.loads((Path(source_dir)/'original-source-export-manifest.json').read_text())
 r=json.loads(Path(receipt_path).read_text())
 if m.get('node_count')!=4420257 or m.get('node_stream_sha256')!=ORIGINAL_SHA or m.get('definitions_sha256')!=NATIVE_SHA or r.get('source_sha256')!=ORIGINAL_SHA or r.get('native_definition_sha256')!=NATIVE_SHA or not r.get('source_Lambda_Xa_exactly_four_proved'):
  raise InvalidOriginalNaturalSource('original graph and pinned Xa=4/Lambda proof are required')
 pairs=r.get('pairs')
 if not isinstance(pairs,list) or len(pairs)!=56 or sum(t['source_call_nodes'] for t in pairs)!=523:
  raise InvalidOriginalNaturalSource('56 pair/523 call certified frontier mismatch')
 last=max(max(t['Y_node_id'],t['eta_node_id']) for t in pairs)
 if last>=100000:raise InvalidOriginalNaturalSource('source input prefix budget')
 nodes=[];h=hashlib.sha256()
 with gzip.open(Path(source_dir)/'original-source-nodes.jsonl.gz','rb') as f:
  for k,line in enumerate(f):
   h.update(line)
   if k==0:continue
   if len(nodes)<=last:nodes.append(json.loads(line))
 if h.hexdigest()!=ORIGINAL_SHA:raise InvalidOriginalNaturalSource('full original 4.4M node SHA mismatch')
 return audit_pairs(nodes,pairs,r)

def audit_pairs(nodes,pairs,r):
 if not r.get('source_Lambda_Xa_exactly_four_proved'):raise InvalidOriginalNaturalSource('Xa identity unverified')
 algebra=OriginalAlgebra(nodes);rows=[];bykey={};seen=set()
 for p in pairs:
  yid,eid=p['Y_node_id'],p['eta_node_id']
  if (yid,eid) in seen or nodes[yid]!=p['Y_source_node'] or nodes[eid]!=p['eta_source_node'] or nodes[eid]!={'op':'coordinate','args':['eta']}:
   raise InvalidOriginalNaturalSource('source Y/eta witness altered')
  seen.add((yid,eid));t=algebra.solve(yid)
  known=(t.coefficient==4 and not t.factors) or (
   t.coefficient==4 and len(t.factors)==1 and t.factors[0][1]==1 and t.factors[0][0].startswith('EXP_NODE:') and
   nodes[int(t.factors[0][0].split(':')[1])]=={'op':'source_parameter','args':['t1']})
  if known!=bool(p['source_Y_algebraic_classification'].get('Y_upper5_proved')):
   raise InvalidOriginalNaturalSource('actual source Y bound proof unexpectedly promoted')
  row={'Y_id':yid,'eta_id':eid,'calls':p['source_call_nodes'],'normal_form':t.text(),
    'positive_domain_obligations':sorted(t.guards),'actual_Y_bound_proved':known,
    'analytic_Brho_coefficient_norm_proved':False,'complex_eta_common_domain_proved':False}
  rows.append(row)
  g=bykey.setdefault(t.key(),{'normal_form':t.text(),'pairs':0,'calls':0,'Y_bound_certified_calls':0})
  g['pairs']+=1;g['calls']+=row['calls'];g['Y_bound_certified_calls']+=row['calls'] if known else 0
 count=sum(z['calls'] for z in rows);proved=sum(z['calls'] for z in rows if z['actual_Y_bound_proved'])
 if count!=523 or proved!=33:raise InvalidOriginalNaturalSource('actual proof call counts changed')
 return {'schema':'MathScope.M3.Source56ConservativeAlgebraicNormalForms/1',
  'original_node_SHA256':ORIGINAL_SHA,'native_registry_SHA256':NATIVE_SHA,
  'first_FiveMap_only':True,'source_pairs':56,'source_calls':523,
  'Y_bound_certified_calls':33,'remaining_unproved_Y_bounds':490,
  'different_algebraic_signatures':len(bykey),
  'real_positive_log_domain_obligations_retained':True,
  'common_complex_domain_proved':False,'coefficient_Brho_norm_le_Q_proved':False,
  'final_67_closed_cell_jets_certified':0,'release':'HOLD',
  'groups':sorted(bykey.values(),key=lambda z:-z['calls']),'per_pair':rows}
if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit('Usage: script.py original_archive_directory verified56.json output.json')
 x=certify_original56(sys.argv[1],sys.argv[2]);Path(sys.argv[3]).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'algebraic_signatures':x['different_algebraic_signatures'],'original_calls':523,'Y_proven':33,'release':'HOLD'}))
