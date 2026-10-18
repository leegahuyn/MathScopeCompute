#!/usr/bin/env python3
"""Independent exact arithmetic/source review; native implementation is not imported."""
from fractions import Fraction as F
from collections import Counter
from math import comb
from pathlib import Path
import gzip,hashlib,json
ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'recovered/base'
OUT=Path(__file__).resolve().parent
N=ROOT/'work/prune_recovery/native'
M2=BASE/'work/n602_continuation/source/research-ide/mathscope-m2/navier'
HEADER=BASE/'analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json'
CLOSURE=ROOT/'work/prune_recovery/scalar/evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json'
SOURCE=ROOT/'work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz'
HP='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'
CP='2cbb5c74eb58ef82f948a19bad00a299c38b802cb8e668e94da8e34a37f77e91'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_bytes())
def require(x,m):
 if not x:raise ValueError(m)
def jsdata(p):
 text=p.read_text();return json.loads(text[text.index('{'):text.rindex('}')+1])
def digest(d):return hashlib.sha256(json.dumps(d,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def moment(power):
 # G_p(r)=sum n^p*r^n=P_p(r)/(1-r)^(p+1).
 # Independent Euler-operator recurrence, not native Stirling computation.
 p=[F(1)]
 for n in range(power):
  dp=[(i+1)*p[i+1] for i in range(len(p)-1)]
  q=[F(0)]*(len(p)+1)
  for i,v in enumerate(dp):q[i+1]+=v;q[i+2]-=v
  for i,v in enumerate(p):q[i+1]+=(n+1)*v
  p=q
 r=F(1,4);return sum(v*r**i for i,v in enumerate(p))/(1-r)**(power+1)
def main():
 require(sha(HEADER)==HP and sha(CLOSURE)==CP,'Authenticated source changed')
 header=load(HEADER);records=load(CLOSURE)['records'];regs={}
 def visit(d):
  for k,v in d.items():
   if k=='base':visit(v)
   elif isinstance(v,str):
    try:regs[k]=json.loads(v)
    except ValueError:pass
 visit(header['definitions'])
 required_constants={s['rootRadius'] for s in regs['quadratic']}
 extra={}
 require(sha(SOURCE)=='42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3','Full source gzip pin')
 with gzip.open(SOURCE,'rb') as stream:
  require(hashlib.sha256(stream.readline()).hexdigest()==HP,'Stream header pin')
  for line in stream:
   ident,node=json.loads(line)
   if ident in required_constants:extra[str(ident)]=node
   if len(extra)==len(required_constants):break
 require(len(extra)==len(required_constants),'Source root radius unavailable')
 roots=load(N/'evidence/QUADRATIC_AND_SLOW_SOURCE_ADAPTERS.json');norms=load(N/'evidence/NATURAL_NORM_AND_TAIL_RECIPES.json')
 b8=jsdata(M2/'actual-continuation-exact-b8-data.mjs')
 z=max(map(F,b8['inverseResidualUpper']));B=sum(map(F,b8['quadraticPreconditionedBounds']));mu=F(b8['muUpper']);radius=F(b8['rootRadius']);beta=F(b8['incomingPreconditionedBound'])
 expected={0:{'beta':beta,'q':z+2*mu*B*radius,'image':beta+z*radius+mu*B*radius**2}}
 for i in [1,2]:
  beta=F(1,2**441);q=8*F(1,2**200)*2**36*radius;image=beta+4*F(1,2**200)*2**36*radius**2
  expected[i]={'beta':beta,'q':q,'image':image}
 quads=[]
 for row in roots['quadratic']:
  node=records[str(row['node'])];system,component,eta=node['args'];s=regs['quadratic'][system];e=expected[system];p=s['proof'];q=e['q'];beta=e['beta'];bound=beta/(1-q)
  require(node['op']=='actual_quadratic_root' and [system,component,eta]==[row['system'],row['component'],row['actualEtaArgumentNode']],'Quadratic call identity')
  require(0<=component<len(s['rhs']) and row['rhsNode']==s['rhs'][component],'Quadratic normalized component')
  require(row['sourceDefinitionSHA256']==digest(s),'Quadratic complete matrix/definition hash')
  require(F(p['lipschitzUpper'])==q and F(p.get('mapImageUpper',p.get('imageUpper')))==e['image'],'Quadratic certificate arithmetic differs from original source recipe')
  require(F(row['q'])==q and F(row['beta'])==beta and F(row['radius'])==radius and F(row['mapImageUpper'])==e['image'],'Quadratic adapter constants')
  require(list(map(F,row['actualRootUniformEnclosure']))==[-bound,bound] and 0<bound<radius and 0<=q<F(1,4),'Quadratic enclosure')
  require(s['continuousMatrixReplacedByPreconditioner'] is False,'Continuous matrix replacement')
  require(extra[str(s['rootRadius'])]=={'op':'rational','args':[str(radius.numerator),str(radius.denominator)]},'Radius source node')
  require(row['momentRhsNumericallyEvaluated'] is False and row['finiteIterateDeclaredRoot'] is False,'Overstated root claim')
  quads.append({'node':row['node'],'system':system,'component':component,'beta':str(beta),'q':str(q),'bound':str(bound),'same_exact_normalized_source_root':True})
 require(Counter(x['system'] for x in quads)=={0:5,1:5,2:3},'Quadratic inventory')
 s=regs['monotone'][2]
 require(s['parameters']==[622803,622804] and s['variable']==622810 and s['body']==622819,'Slow formal tuple')
 expected_nodes={9:('source_parameter',['h']),19:('rational',['1','2']),24:('rational',['2','1']),20:('rational',['-1','1']),25:('multiply',[9,24]),622811:('integer_power',[622803,2]),622812:('log_positive',[622810]),622813:('multiply',[25,622812]),622814:('exp',[622813]),622815:('multiply',[622811,622814]),622816:('multiply',[20,622815]),622817:('add',[622810,622816]),622818:('multiply',[20,622804]),622819:('add',[622817,622818])}
 for i,(op,args) in expected_nodes.items():require(records[str(i)]=={'op':op,'args':args},'Slow residual AST at '+str(i))
 require(len(roots['slow'])==2 and all(records[str(x['node'])]['args'][0]==2 and x['sourceDomainConditionalBracket']==['1/2','2'] and not x['actualCallerCoordinatesNumericallyEvaluated'] for x in roots['slow']),'Slow invocation/bracket claims')
 profile=jsdata(M2/'source-profile-data.mjs');parameters=profile['parametersExactExpressions']
 ast={'Md':{'integer':1048576},'T':{'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},'j0':{'power':[{'ref':'h'},4]},'sigmaStar':{'quotient':[{'ref':'j0'},{'integer':2000}]},'rho':{'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]},'logP':{'product':[{'integer':2},{'ref':'T'}]},'Pstar':{'exp':{'ref':'logP'}},'K':{'power':[{'ref':'Pstar'},2]},'Q':{'quotient':[{'product':[{'integer':str(2**260)},{'ref':'K'}]},{'power':[{'ref':'sigmaStar'},2]}]}}
 for name,value in ast.items():require(parameters[name]==value,'Source parameter AST changed '+name)
 require(profile['parameterExpressionSHA256']==regs['fixed']['source']['parameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152','Source parameter family')
 natural=[]
 for row in norms['bounds']:
  k,m=row['radialOrder'],row['etaOrder'];p=k+m
  c=sum(F(comb(p,j)*m**(p-j))*moment(j) for j in range(p+1))/(5**k*(m+1)**2)
  require(F(row['exactRationalCoefficient'])==c,'Independent Euler geometric moment differs')
  L=260+16*m+22*(m+1)+max(0,c.numerator.bit_length());A=64020+64016*m
  require(row['integerProof']=={'logConstantUpper':L,'afterTLe2ExpMd':L+2*A,'strictlyBelow':2**(18+m)},'Log compression ledger')
  require(L+2*A<2**(18+m) and row['compressedUpper']=={'exp':{'exp':{'integer':1048576+18+m}}},'Exponential compression')
  natural.append({'radial_order':k,'eta_order':m,'coefficient':str(c),'inner_exponential_integer':1048594+m,'independent_geometric_moment':True})
 observed=sorted(set((n['args'][3],n['args'][4]) for n in records.values() if n['op']=='actual_natural_series'))
 require(sorted((x['radial_order'],x['eta_order']) for x in natural)==observed,'Natural actual derivative pairs differ')
 require(max(m for k,m in observed)==5 and max(x['inner_exponential_integer'] for x in natural)==1048599,'Actual m=5 norm ceiling')
 files=[HEADER,CLOSURE,SOURCE,N/'code/native_binding.py',N/'code/proof_application.py',N/'evidence/EXISTING_PROOF_APPLICATION.json',N/'evidence/PICARD_SOURCE_CONSTANT_SUPPLEMENTS.json',N/'evidence/QUADRATIC_AND_SLOW_SOURCE_ADAPTERS.json',N/'evidence/NATURAL_NORM_AND_TAIL_RECIPES.json',M2/'source-profile-data.mjs',M2/'actual-continuation-exact-b8-data.mjs',M2/'actual-continuation-exact-b8.mjs',M2/'actual-continuation-exact-global.mjs',M2/'actual-continuation-exact-heat.mjs',M2/'actual-continuation-exact-tail.mjs']
 result={'schema':'MathScope.IndependentNativeMathRecoveryReview/1','source_pins':[{'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':sha(p)} for p in files],'review_code_sha256':sha(Path(__file__)),'quadratic':quads,'quadratic_count':len(quads),'quadratic_scope':'Exact same-root Banach value bounds from inherited original contraction certificates; no actual moment RHS values or derivatives computed. B8 residual preconditioner remains approximate; C2/I2 retained continuous inverse is not replaced.',
 'slow':{'actual_calls':len(roots['slow']),'source_body_exact':'s-Z^2*s^(2h)-T','source_parameters':['Z','T'],'source_domain_runtime_conditions':['Z^2<=2','F(1/2)<=0<=F(2)','0<h<1/16 from pinned original parameter expression'],'derivative_proof':'On [1/2,2], s^(2h-1)<=2; hence 1-2h Z^2 s^(2h-1)>=1-8h>1/2 and <=1. Endpoint signs yield the unique root in [1/2,2].','actual_caller_values_evaluated':False},
 'natural':natural,'natural_max_eta_order':5,'natural_max_inner_exponential_integer':1048599,'previous_1048598_scope':'The smaller 1048598 is the m<=4 version of this compression; it must not label this recovered inventory with actual m=5 calls. No assertion is made that a sharper m=5 bound is impossible.',
 'derived_parameters':{'Q':'2^260*4000000*exp(64020*T)','rho_inverse':'2^16*4000000*exp(64016*T)','T':'exp(1048576)+10'},'additional_exact_source_constants':extra,
 'natural_proof':'Use m! binom(n+m,m)*(n)_k <= (n+m)^(m+k), discard (n+1)^-2<=1, and bound Y^(n-k)/20^n <= 5^-k*4^-n for n>=k. The Euler-operator recurrence sums the complete majorant exactly. ln(C Q rho^-m)<=L+(64020+64016m)T <=[L+2(64020+64016m)]exp(Md)<exp(Md+18+m), using T<=2exp(Md), 4000000<2^22, ln2<1, and 2<e. Average coefficients have an additional 1/(n+1) and share the bound.',
 'replay_hardening_review':{'original_header_and_exact_closure_hard_pins_present':True,'strict_outer_registry_namespaces_and_nonnegative_indices_present':True,'indexed_total_derivative_order_limits_present':True,'proof_application_uses_pinned_gzip_instead_of_mutable_database':True,'prior_gaps_reported_to_author_and_corrected':True},
 'source_producer_executed':False,'native_implementation_imported':False,'existing_tests_repeated':False,'newM3Closures':0,'N706_closed':False,'N805_closed':False}
 (OUT/'MATH_SOURCE_REVIEW.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'quadratics':len(quads),'slow_calls':len(roots['slow']),'natural_pairs':len(natural),'max_eta':5,'norm_inner_integer':1048599,'pass':True}))
if __name__=='__main__':main()
