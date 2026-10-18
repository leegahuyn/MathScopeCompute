#!/usr/bin/env python3
"""Small exact identities for diagnosis; no historical producer or quadrature."""
from pathlib import Path
from fractions import Fraction as Q
import hashlib,json,time
import sympy as s

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[1]/'MathScopeCompute'
CAP=REPO/'research-ide/mathscope-m3/caller-recovery-20261019/evidence/CALLER_SOURCE_CAPSULE.json'
raw=CAP.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='ba08b603d841e0f27cdd8f44513ff52de6a6b0f279c4d8d3ec2c7dfa2dbafd42'
capsule=json.loads(raw);nodes=capsule['source_nodes'];checks=[];start=time.monotonic()
def check(name,value,**detail):
    checks.append({'name':name,'pass':bool(value),**detail})
    assert value,name
u,h,b,T=s.symbols('u h b T',positive=True)
A=s.exp(-1/u**2);B=s.exp(-1/(1-u)**2)
sigma=A/(A+B)
check('A5_seed_derivative',s.simplify(s.diff(A,u)-2*A/u**3)==0)
check('A5_reflected_seed_derivative',s.simplify(s.diff(B,u)+2*B/(1-u)**3)==0)
aa,bb=s.symbols('aa bb',positive=True)
quotient=(2*aa*bb/u**3+2*aa*bb/(1-u)**3)/(aa+bb)**2
target=2*(aa/(aa+bb))*(bb/(aa+bb))*(u**-3+(1-u)**-3)
check('A5_positive_derivative_identity',s.factor(quotient-target)==0,
      condition='0<u<1, aa=exp(-1/u^2)>0, bb=exp(-1/(1-u)^2)>0')
check('A5_reflection_identity',s.factor(sigma.subs(u,1-u)+sigma-1)==0)
rho=h/256;v=s.symbols('v',real=True);derivative=s.Function('sigma_prime')
original=rho*s.exp(b*v)*derivative((v-1)/2)/(2*(1-rho))
normalized=h*s.exp(b*(1+2*u))*derivative(u)/(256-h)
check('literal_node275_change_of_variables',s.factor(2*original.subs(v,1+2*u)-normalized)==0)
check('legacy_normalized_upper54',Q(54,256)==Q(27,128))
check('legacy_scaled_inverse_lower',1/Q(27,128)==Q(128,27))
check('diagnostic_sharper_upper',Q(27,255)==Q(9,85))
check('diagnostic_sharper_inverse_lower',1/Q(9,85)==Q(85,9))
check('diagnostic_does_not_replace_legacy_output',Q(9,85)<Q(27,128))
# The following rational inequalities support the analytic A.12 co bound.
check('center_quarter_step_derivative_bound',Q(1,4)*2*(64+64)==64)
check('outer_quarter_tail_less_than_one',Q(134,2**14)<1)
check('original_co256_meets_A12_with_bound64',Q(32,255)<Q(1,4))
check('legacy_Qb_upper_addition',Q(1,15)+3+Q(3,2)==Q(137,30))
W=s.Symbol('original_wait',positive=True)
parameters={'T':T,'BOuter':1000*T,'lambda':s.exp(-1000*T),'h':s.exp(-8002*T),
            'XR':s.Symbol('XR',positive=True),'Tf':s.Integer(128),'co':s.Rational(1,256)}
memo={280:W}
def at(i):
    if i in memo:return memo[i]
    n=nodes[str(i)];op,a=n['op'],n['args']
    if op=='rational':x=s.Rational(*map(int,a))
    elif op=='source_parameter':x=parameters[a[0]]
    elif op=='add':x=sum(at(k) for k in a)
    elif op=='multiply':x=s.prod(at(k) for k in a)
    elif op=='inverse':x=1/at(a[0])
    elif op=='exp':x=s.exp(at(a[0]))
    elif op=='log_positive':x=s.log(at(a[0]))
    else:raise ValueError('Unexpected AST operation in fixed-wait endpoint expression: '+op)
    memo[i]=x;return x
expected=13*s.exp(1000*T)+122009*T+135+W
check('exact_original_node319_log_radius_reduction',s.simplify(at(319)-expected)==0,
      equation='node319 = 13*exp(1000*T)+122009*T+135+node280',
      warning='node280 remains the original unevaluated wait here; no invented value')
report={'schema':'MathScope.RadialSymbolicDiagnosis/1','status':'PASS','checks':checks,
        'sympy':s.__version__,'source_capsule_sha256':hashlib.sha256(raw).hexdigest(),
        'check_count':len(checks),'elapsed_seconds':time.monotonic()-start,
        'scope':'Exact symbolic/rational consequences for diagnosis only. The implemented adapter reuses existing factor54. No quadrature, original h replacement, whole-Xb numeric value or M3 closure.',
        'new_M3_closures':0,'actual_global_last_resolved_tau':None}
with (HERE/'SYMBOLIC_DIAGNOSIS_CHECKS.json').open('x',encoding='utf-8') as f:
    json.dump(report,f,indent=2,ensure_ascii=False);f.write('\n')
print(json.dumps({'status':'PASS','checks':len(checks),'elapsed_seconds':report['elapsed_seconds']}))
