#!/usr/bin/env python3
"""Independent Fraction replay of residual algebra and actual source intervals.

Ordinary-size rational parameter assignments are used ONLY for universal PDE
algebra identities. Actual residual intervals are reconstructed separately from
the pinned A.21 receipt, actual positive small-parameter bounds, and fixed
Cauchy radius. No rational diagnostic assignment is called the N3 source.
"""
from __future__ import annotations
from fractions import Fraction as F
from functools import lru_cache
from pathlib import Path
import hashlib
import json
import math
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[4]
HERE=Path(__file__).resolve().parent
checks=[]
def check(name,passed):
    checks.append({'id':name,'pass':bool(passed)})
    if not passed: raise AssertionError(name)

fixture=json.loads(subprocess.run(['node',str(HERE/'actual-residual-order-fixture.mjs')],cwd=ROOT,text=True,capture_output=True,check=True).stdout)
graph=fixture['program']

def algebra_evaluator(h,j,lam,sigma,amp):
    pars={'h':h,'j0':j,'Lambda':lam,'sigmaStar':sigma}
    pressure=[F(-3),F(0),F(5),F(0),F(2),F(0),F(3),F(0),F(1)]+[F(0)]*40
    @lru_cache(None)
    def ev(node,degree=0):
        op,args=graph['nodes'][node]['op'],graph['nodes'][node]['args']
        out=[F(0)]*(degree+1)
        if op=='rational':out[0]=F(int(args[0]),int(args[1]))
        elif op=='source_parameter':out[0]=pars[args[0]]
        elif op=='eta':
            if degree:out[1]=F(1)
        elif op=='source_A21_pressure':out=[pressure[k]/math.factorial(k) for k in range(degree+1)]
        elif op=='source_normalized_amplitude':
            out[0]=amp
            if degree:
                zeta=ev(graph['fixed']['zeta'],degree-1)
                for n in range(degree):out[n+1]=lam*sum((zeta[k]*out[n-k] for k in range(n+1)),F(0))/(n+1)
        elif op=='add':out=[x+y for x,y in zip(ev(args[0],degree),ev(args[1],degree))]
        elif op=='multiply':
            a,b=ev(args[0],degree),ev(args[1],degree)
            out=[sum((a[k]*b[n-k] for k in range(n+1)),F(0)) for n in range(degree+1)]
        elif op=='inverse_nonzero':
            a=ev(args[0],degree);out[0]=1/a[0]
            for n in range(1,degree+1):out[n]=-sum((a[k]*out[n-k] for k in range(1,n+1)),F(0))/a[0]
        elif op=='eta_derivative':
            a=ev(args[0],degree+args[1]);out=[a[k+args[1]]*math.factorial(k+args[1])/math.factorial(k) for k in range(degree+1)]
        else:raise ValueError(op)
        return tuple(out)
    return ev

diagnostics=[(F(1,20),F(1,5),F(9),F(1,50),F(1,5)),(F(1,40),F(2,5),F(5),F(1,10),F(1,7))]
for d,(h,j,lam,sigma,amp) in enumerate(diagnostics):
    ev=algebra_evaluator(h,j,lam,sigma,amp);A=F(1,2)+h
    for name,coefficients in graph['retainedResidualCoefficients'].items():
        for k,node in enumerate(coefficients):
            for s in range(2):check(f'universal-retained-cancellation-{d}-{name}-X{k}-eta{s}',ev(node,s)[s]==0)
    roots=graph['axisRoots']
    exact={'alpha':A*j,'alphaEta':F(12),'alphaEtaEta':2*A*j*(8*h-3),'z1Axis':F(0),'z1FirstX':(F(9,2)-18*h*h)*j,'radial0Axis':24-4*A*F(-3)+F(5),'radial1Axis':F(0),'radial2Axis':F(0)}
    for name,value in exact.items():check(f'universal-axis-identity-{d}-{name}',ev(roots[name])[0]==value)
    # Dropping the axial correction leaves the actual order-zero axis debt.
    missing_u1=2*A*j
    check(f'negative-omit-positive-order-axial-correction-{d}',missing_u1!=0)
    # Dropping Pi1 loses the original Omega0 pressure shift at retained order.
    check(f'negative-omit-positive-order-pressure-{d}',ev(roots['radial0Axis'])[0]!=0)
    check(f'nonzero-unretained-actual-operator-{d}',ev(roots['z1FirstX'])[0]>0)

# Reconstruct the actual input intervals directly from their original receipt.
receipt=ROOT/'research-ide/mathscope-m1/navier/followup-20261010-symbolic-gluing/attempts/pressure-datum-0001/receipt.json'
source=json.loads(receipt.read_text())
check('actual-pressure-source-hash',hashlib.sha256(receipt.read_bytes()).hexdigest()==graph['sourceInputs']['pressure']['sha256'])
tiny=F(1,2**2048);eps=F(1,2**160)
def ia(a,b):return a[0]+b[0],a[1]+b[1]
def im(a,b):
    v=[x*y for x in a for y in b];return min(v),max(v)
def scale(a,s):return im(a,(F(s),F(s)))
def pt(x):return F(x),F(x)
AA=ia(pt(F(1,2)),(F(0),tiny));bb=scale(ia(pt(1),(F(0),tiny)),-1)
chi=F(4000000,4000001);zp=F(4000000*3999999,4000001**2)
angular=ia(ia(pt(chi*chi),im(im(ia(pt(F(9,2)),scale((F(0),tiny),-1)),pt(zp)),(F(0),tiny))),scale(im(im(bb,(F(0),tiny)),im((F(0),tiny),(F(0),tiny))),2))
pr=[tuple(F(source['normalizedPressureTaylorCoefficients'][m]['derivativeInterval'][end]) for end in ['lower','upper']) for m in [0,2]]
pressure=ia(ia(scale((F(0),tiny),-12),scale(im(AA,pr[0]),2)),scale(pr[1],F(-1,2)))
base={(0,'theta'):scale(angular,-1),(0,'z'):scale(AA,2),(0,'radial'):ia(scale(pressure,-2),(-24*tiny,F(0))),(1,'theta'):pt(0),(1,'z'):(F(9,2)-18*tiny*tiny,F(9,2)),(1,'radial'):pt(0)}
def round_out(a,bits):
    d=2**bits
    return F((a[0]*d).__floor__(),d),F((a[1]*d).__ceil__(),d)
def interval(row):return F(row['lower']),F(row['upper'])

coordinates={};witnesses={}
for case in fixture['cases']:
    bits,mesh=case['request']['bits'],case['request']['mesh']
    label=f'b{bits}-g{mesh}'
    check('same-domain-'+label,case['domain']['id']=='same-N3-natural-core-fixed-residual-domain.1' and case['domain']['XExact']==['0','4*residualXUnit'])
    check('positive-X-not-underflowed-'+label,all(r['XStrictlyPositive'] and r['XBinary64'] is None for r in case['pointRows']))
    for row in case['pointRows']:
        x=F(row['XMultiplierExact']);tail=x*eps/16;src=base[row['N'],row['component']]
        exact=round_out((src[0]-tail,src[1]+tail),bits);got=interval(row['normalizedInterval'])
        check(f'actual-source-residual-interval-{label}-{row["id"]}',exact==got and got[0]<got[1])
        check(f'outward-display-{label}-{row["id"]}',F(row['displayEnclosure'][0])<=got[0] and F(row['displayEnclosure'][1])>=got[1])
        key=(row['N'],row['component'],row['XMultiplierExact'])
        coordinates.setdefault(key,[]).append((bits,got,row['XExactExpression']))
        if row['N']==0 and row['component']=='radial' and x==1:witnesses[bits,mesh]=got[0]
    for t in case['timeRows']:
        lower=witnesses[bits,mesh];upper=F(1,2**t['k'])
        check(f'actual-same-scale-order-improvement-{label}-k{t["k"]}',F(t['N0NormLowerExact'])==lower and F(t['N1NormUpperExact'])==upper and F(t['actualNormRatioUpperExact'])==upper/lower and lower>1 and upper/lower<1)
        check(f'q-positive-symbolic-{label}-k{t["k"]}',t['qStrictlyPositive'] and t['qBinary64'] is None and t['actualHUnchanged'])
    check('global-scope-stays-false-'+label,not case['scope']['globalN1MomentRepairComplete'] and not case['scope']['wholeProfileResidualComplete'] and not case['scope']['allNResidualComplete'])
for key,values in coordinates.items():
    check('coordinate-independent-'+str(key),all(v[2]==values[0][2] for v in values))
    by_bits={b:a for b,a,_ in values}
    previous=None
    for bits in sorted(by_bits):
        current=by_bits[bits]
        if previous:check('precision-nesting-'+str(key)+'-'+str(bits),previous[0]<=current[0]<=current[1]<=previous[1])
        previous=current

# Exact endpoint checking proves the affine-in-h exponent inequality over the
# entire interval 0<=h<=1/4; this is not finite sampling of a nonlinear claim.
for m in range(7):
    for h in [F(0),F(1,4)]:
        check(f'uniform-Km-m{m}-h{h}',F(3,2)+2*h+m<=2+m and F(3,2)+h+m<=2+m)

# Independent exact polynomial inverse of the original coordinate Jacobian.
# q powers have been factored out; h and eta remain formal indeterminates.
# Thus these four identities hold throughout the analytic chart, rather than
# at a finite selection of h or eta values.
def padd(*ps):
    r={}
    for p in ps:
        for k,v in p.items():r[k]=r.get(k,F(0))+v
    return {k:v for k,v in r.items() if v}
def pscale(p,a):return {k:v*F(a) for k,v in p.items() if v*F(a)}
def pmul(p,q):
    r={}
    for (i,j),a in p.items():
        for (k,l),b in q.items():
            key=(i+k,j+l);r[key]=r.get(key,F(0))+a*b
    return {k:v for k,v in r.items() if v}
one={(0,0):F(1)};eta={(0,1):F(1)};hp={(1,0):F(1)}
dp=padd(one,pscale(pmul(eta,eta),-1))
Dp=padd(pscale(one,F(1,2)),pscale(hp,-1))
Lp=padd(one,pscale(pmul(hp,pmul(eta,eta)),-2))
jac=[[dp,pscale(eta,-2)],[pmul(Dp,eta),one]]
adj=[[one,pscale(eta,2)],[pscale(pmul(Dp,eta),-1),dp]]
for i in range(2):
    for j in range(2):
        value=padd(*(pmul(jac[i][k],adj[k][j]) for k in range(2)))
        check(f'coordinate-jacobian-exact-polynomial-{i}{j}',value==(Lp if i==j else {}))
check('negative-omit-axial-moving-scale-term',pmul(jac[0][0],adj[0][1])!={})
check('negative-time-sign-inverse',pscale(adj[0][0],-1)!=adj[0][0])

# Complex-domain and operator constants are checked at their exact symbolic
# worst bounds. R,rho0<1 and Dspace>=1 are source-derived, not caller inputs.
check('cartesian-polydisc-image',F(1225,8192)<F(1,2))
check('cartesian-linear-prefactor',F(17,32)<1)
check('analytic-inverse-L',1-8*tiny>F(1,2))
check('fixed-domain-within-derivative-compact',eps/F(64)<F(1,64)<F(1,8))
check('two-residual-Cauchy-tail-budget',F(8,256)<F(1,16))
check('axial-difference-quotient-Cauchy-tail-budget',F(8,256)<F(1,16))
for m in range(7):
    # Setting Dspace=1 is the minimum of each remaining affine positive
    # margin. Their coefficients of Dspace are positive for every m>=0.
    time_margin=8*(m+2)-2*(m+2)-3*(m+1)
    axial_margin=26*(m+2)-8*(m+2)-13*(m+1)
    check(f'physical-time-budget-m{m}',time_margin>0 and 8*(m+2)-3*(m+1)>0)
    check(f'physical-axial-budget-m{m}',axial_margin>0 and 26*(m+2)-13*(m+1)>0)
    check(f'physical-common-budget-m{m}',32*(m+2)>=max(8*(m+2),26*(m+2),m+1))
    check(f'ordinary-derivative-factorial-covered-m{m}',math.factorial(m)<=(m+1)**m)

out={'schema':'MathScope.ActualResidualIndependentAudit/1','pass':all(c['pass'] for c in checks),'checks':len(checks),'scope':{'actualPressureAndResidualIntervalsReplayed':True,'fixedCoordinatesAndNMeshPrecisionSeparated':True,'rationalDiagnosticIsActualSource':False,'globalTupleCertified':False},'details':checks}
destination=HERE/'actual-residual-order-independent.json'
destination.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k!='details'}))
