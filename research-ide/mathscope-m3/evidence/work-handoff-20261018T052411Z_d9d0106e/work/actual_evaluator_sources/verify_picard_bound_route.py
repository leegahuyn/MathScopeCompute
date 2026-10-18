#!/usr/bin/env python3
"""Check the authenticated first-Picard constant cone and term-count bound."""
from pathlib import Path
from collections import Counter
import argparse, hashlib, json

p=argparse.ArgumentParser()
p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
root=p.parse_args().root.resolve()
relative='analysis/base/PR30-recovery-handoff/angular-proof/inputs/ACTUAL_PICARD_ORIGINAL_NUMERIC_MAJORANT.json'
raw=(root/relative).read_bytes()
expected='36026f7c3804d54f779d214ead8ea434db32b3fc5cb468465d174748eda5a74b'
assert hashlib.sha256(raw).hexdigest()==expected
src=json.loads(raw)
assert src['sameOriginalConstants']=={
    'B':'4096*Lambda^2*Q^3/t1', 'C1':'262144*B^2/delta^2',
    'loss':'delta/8', 'aSquared':'(4/Lambda)*exp(t1/16)',
    'solutionNorm':'exp(9*C1^2*aSquared/(2*loss))',
    'Kcondition':'ceil(72*C1^2*aSquared/loss)'}
cone={int(k):v for k,v in src['originalConstantCone'].items()}
def closure(start):
    found={}
    def visit(i):
        if i in found:return
        n=cone[i];found[i]=n
        if n['op'] in ('source_parameter','rational'):return
        children=n['args'][:1] if n['op']=='integer_power' else n['args']
        for child in children:visit(child)
    visit(start)
    return found
norms={name:closure(i) for name,i in [('commonCollar',24848),('naturalY5',24855)]}
allowed={'rational','source_parameter','multiply','inverse','integer_power','exp'}
assert all(n['op'] in allowed for nodes in norms.values() for n in nodes.values())
params=src['actualParameterASTConstraints']
seen=set()
def parameter_dependencies(v):
    if isinstance(v,dict):
        if 'ref' in v:
            name=v['ref']
            assert name in params
            if name not in seen:
                seen.add(name);parameter_dependencies(params[name])
        else:
            for x in v.values():parameter_dependencies(x)
    elif isinstance(v,list):
        for x in v:parameter_dependencies(x)
for nodes in norms.values():
    for n in nodes.values():
        if n['op']=='source_parameter':parameter_dependencies({'ref':n['args'][0]})
# Monomial exponents include an independent factor E=exp(t1/16)>1.
def mul(*terms):
    result=Counter()
    for term in terms:
        for k,v in term.items():result[k]+=v
    return dict(result)
def power(term,n):return {k:n*v for k,v in term.items()}
B={'two':12,'Lambda':2,'Q':3,'t1':-1}
C1=mul({'two':18},power(B,2),{'delta':-2})
assert C1=={'two':42,'Lambda':4,'Q':6,'t1':-2,'delta':-2}
# Retain the leading integer72 separately.
argument=mul(power(C1,2),{'two':2,'Lambda':-1,'E':1},{'two':3,'delta':-1})
assert argument=={'two':89,'Lambda':7,'Q':12,'t1':-4,'delta':-5,'E':1}
eliminated=dict(argument)
lam=eliminated.pop('Lambda');delta=eliminated.pop('delta')
eliminated=mul(eliminated,{'Q':64*lam},{'rho':delta,'two':-10*delta,'Q':-delta})
assert eliminated=={'two':139,'Q':465,'t1':-4,'E':1,'rho':-5}
weak_power=139+465*260+6
assert weak_power==121045 and 72>2**6
result={
 'schema':'MathScope.ActualPicardPositiveBoundRoute/1',
 'source':{'path':relative,'bytes':len(raw),'sha256':expected,
           'sourceHeaderSHA256':src['sourceHeaderSHA256']},
 'actual_norm_roots':{name:{'root':24848 if name=='commonCollar' else 24855,
    'nodeCount':len(nodes),'operations':dict(Counter(n['op'] for n in nodes.values())),
    'nodes':{str(k):v for k,v in sorted(nodes.items())}}
    for name,nodes in norms.items()},
 'parameterAST':{k:params[k] for k in sorted(seen)},
 'native_function_or_integral_in_norm_cones':False,
 'common_collar_original_tail':src['provedOriginalTail'],
 'all_fixed_derivative_tail':src['universalSourceScopedQuantifiers']['allFixedM'],
 'term_count_algebra':{'C1_exponents':C1,'argument_before_substitution':argument,
   'argument_after_substitution':eliminated,'leading_integer':72,
   'exact_formula':'72*2^139*Q^465*exp(t1/16)/(t1^4*rho^5)',
   'premises':['Q>2^260','0<t1<1','0<rho<1'],
   'premise_source':'actualParameterASTConstraints: K=Pstar^2>1, sigmaStar=h^4/2000<1, Q=2^260*K/sigmaStar^2; CSelected>1; rho=sigmaStar^2/65536.',
   'strict_lower_bound':'Kcondition > 2^121045',
   'integer_monomial_checks_pass':True},
 'effectivity':{
   'norm_upper_expression_closed':True,
   'source_solution_changed':False,
   'larger_certified_integer_K_allowed':True,
   'source_minimal_ceiling_need_not_be_evaluated_for_larger_K':True,
   'numeric_norm_interval_computed':False,
   'actual_Picard_partial_sum_evaluated':False,
   'symbolic_K_is_not_a_partial_sum_value':True,
   'term_count_bound_is_not_general_noncomputability':True,
   'actual_endpoint_energy_upper_not_yet_assembled':True},
 'scope':'Authenticated actual Picard0 common collar. NaturalY5 is a separate auxiliary/natural domain; do not transfer its K to the collar or conversely. No full M3 current norm certificate.'}
out=root/'work/actual_evaluator_sources/PICARD_BOUND_ROUTE.json'
out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'pass':True,'source_sha256':expected,
 'norm_cone_sizes':{k:len(v) for k,v in norms.items()},
 'literal_term_count_lower_bound':'2^121045','numeric_field_evaluated':False}))
