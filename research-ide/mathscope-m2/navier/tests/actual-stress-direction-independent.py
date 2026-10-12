#!/usr/bin/env python3
"""Independent source binding, ring algebra and exact kernel audit.

Full stresses are evaluated before subtraction; this differs from the
factored JavaScript formula. The audit does not numerically sample the
original tiny-scale profile or claim to formalize its analytic proof.
"""
from __future__ import annotations
import argparse
from collections import Counter
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import subprocess

HERE=Path(__file__).resolve().parent
NAVIER=HERE.parent
RESEARCH_IDE=NAVIER.parents[1]


class Audit:
    def __init__(self):
        self.checks=0
        self.categories=Counter()

    def check(self, condition, category, message):
        if not condition:
            raise AssertionError(message)
        self.checks+=1
        self.categories[category]+=1

    def equal(self, actual, expected, category, message):
        self.check(actual==expected,category,message)


def read(values):
    return {k:F(v) for k,v in values.items()}


def densities(X,r,E,U):
    return [X*U,r*X*E,r*X*E*U,X*(U*U-E*E/2),E*E/2]


def direct_stress(c,b,m):
    # Original (4.11)/(4.16), evaluated separately at each full state.
    h,eta,D,A,d,L=(c[k] for k in ['h','eta','D','A','d','L'])
    X,r,F0,U,Fy,Uy=(b[k] for k in ['X','r','F','U','Fy','Uy'])
    W=1-(2*D*eta*m['M']+d*m['Meta'])/X
    ang=(1-h)*m['I']-D*eta*m['Ieta']-d*m['Jeta']+2*(h-D)*eta*m['J']
    theta=-F0*X*W/L+ang/(2*X*L)+2*Fy
    axial=(-X*W*U+D*(m['M']-eta*m['Meta'])+4*h*eta*m['S']
           -d*m['Seta']+X*(4*A*eta*m['Cp']-d*m['Cpeta']))/(L*r)+2*Uy/r
    return theta,axial


def audit_ledger(a,rows,base,order):
    values={}
    minimum=2**(260 if base=='C' else 13)
    for row in rows:
        name,power,rule=row['id'],row['power'],row['rule']
        a.check(name not in values and isinstance(power,int) and power>=0,'finite_power_ledgers','unique power row '+name)
        inputs=row.get('inputs',[])
        a.check(all(k in values for k in inputs),'finite_power_ledgers','previous source operands '+name)
        if rule=='sum':
            expected=max(values[k] for k in inputs)+row['reserve']
            coefficient=len(inputs)
        elif rule=='mixed product':
            expected=sum(values[k] for k in inputs)+row['reserve']
            coefficient=len(inputs)**order
        elif rule=='ordinary derivative extraction within the supplied mixed-jet rectangle':
            expected=values[inputs[0]]+1
            coefficient=math.factorial(order)
        elif rule=='actual flat-factor integral and its first y derivative':
            expected=values[inputs[0]]+1
            coefficient=6
        elif rule=='actual outer Laplace kernel through first delta derivative':
            expected=values[inputs[0]]+row['reserve']
            coefficient=row['m']+12
        elif rule.startswith('finite Bell derivatives'):
            expected=order*values[inputs[0]]+row['reserve']
            coefficient=1+math.factorial(order)*(order+1)**(order+2)
            a.check(coefficient>15,'finite_power_ledgers','third exp divided difference Bell terms')
        else:
            expected=power
            coefficient=None
        if coefficient is not None:
            a.equal(power,expected,'finite_power_ledgers','computed exponent '+name)
            a.equal(int(row['coefficient']),coefficient,'finite_power_ledgers','finite Leibniz coefficient '+name)
            a.check(4*coefficient<minimum**row.get('reserve',1),'finite_power_ledgers','literal factors and coefficient reserve '+name)
        values[name]=power
    return values


def run():
    fixture=json.loads(subprocess.check_output(['node',str(HERE/'actual-stress-direction-fixture.mjs')],cwd=NAVIER))
    r=fixture['receipt']
    a=Audit()
    a.equal(r['pass'],True,'source_binding','actual source producer')
    for b in r['sourceBindings']:
        data=(RESEARCH_IDE/b['path']).read_bytes()
        a.equal(len(data),b['bytes'],'source_binding',b['path']+' bytes')
        a.equal(hashlib.sha256(data).hexdigest(),b['sha256'],'source_binding',b['path']+' SHA')
    a.equal(r['bounds']['closedAnnulus']['eta'],[-1,1],'source_binding','full original real eta interval')
    a.equal(r['generatedSourceInput']['pass'],True,'source_binding','higher source jets actually produced')
    a.equal(r['ratio']['completedBackgroundFrozenFrameIncluded'],False,'scope','leading frame is not the completed frame')
    for k in ['completedPositiveOrderBackgroundBound','actualGeneralLabelHomogeneousPulseEnclosed','actualUniformHColumnsCertified','sourceUniformQStarCertified','globalEquation730Certified','originalN506Complete','newLeanKernelProof']:
        a.equal(r['scope'][k],False,'scope','unearned '+k)
    p=r['program']
    a.equal(p['profileId'],r['profileId'],'source_binding','same exact factor profile')
    a.equal(p['scope']['entireFunctionNumericallyEnclosed'],False,'scope','symbolic integral is not a numerical enclosure')
    a.equal(p['exactFactorization']['commonZeroStressFactorDividedNumerically'],False,'scope','flat zero division')
    a.check('actual_natural_series' in p['operations'],'source_binding','actual natural series operation retained')
    a.check(all(n['args'][3]<=2 and n['args'][4]<=2 for n in p['nodes'] if n['op']=='actual_natural_series'),'source_binding','explicit available natural derivative orders')
    a.check(all(isinstance(v,int) and 0<=v<len(p['nodes']) for v in p['roots'].values()),'source_binding','all exact roots refer to actual nodes')

    # Evaluate the original five densities at two states, subtract, divide
    # by the positive activation. This does not expand them as the producer.
    cross_detected=0
    for case in fixture['algebra']['inner']:
        b,c,m,dm=map(read,[case['state'],case['constants'],case['reference'],case['momentDifference']])
        E=b['E']+b['a']*b['EOver']
        U=b['U']+b['a']*b['uOver']
        original=densities(b['X'],b['r'],b['E'],b['U'])
        changed=densities(b['X'],b['r'],E,U)
        for j in range(5):
            a.equal(F(case['density'][j]),(changed[j]-original[j])/b['a'],'nonlinear_moment_differences',f'case {case["id"]} density {j}')
        linear_J=b['r']*b['X']*(b['E']*b['uOver']+b['U']*b['EOver'])
        if linear_J!=F(case['density'][2]):
            cross_detected+=1
        reference=b|{'Fy':-b['p1']*b['F']/2}
        actual=b|{'F':b['F']+b['a']*b['FOver'],'U':U,'Uy':b['kappa']*b['Uy']}
        actual['Fy']=-b['kappa']*b['p1']*actual['F']/2
        actual_m={k:m[k]+b['a']*dm[k] for k in m}
        refT=direct_stress(c,reference,m)
        actualT=direct_stress(c,actual,actual_m)
        for j,key in enumerate(['theta','axial']):
            a.equal(F(case['stress'][key]),(actualT[j]-refT[j])/b['a'],'full_stress_difference',f'case {case["id"]} {key}')
        if b['Uy']:
            a.check(F(case['stress']['axial'])+2*b['Uy']/b['r']!=(actualT[1]-refT[1])/b['a'],'negative_controls','missing inner axial viscosity')
        a.equal(b['r']**2,2*b['X'],'ring_geometry','exact radius')
        a.equal(c['L'],1-2*c['h']*c['eta']**2,'ring_geometry','source L')
    a.check(cross_detected>30,'negative_controls','omitting nonlinear mixed term is detected')

    # Original unfactored A.54 terms have a common positive flat value z.
    # Reassemble them before dividing by z*delta^-3.
    for case in fixture['algebra']['outer']:
        b=read(case['input'])
        z=F(case['id']+1,101)
        fy=z*b['delta']**-3*b['c']
        raw=2*b['K']*fy/b['r']+z*b['viscous']/(2*b['r']**2)+z*b['inviscid']/(4*b['L']*b['r']**2)
        out=F(case['output']['theta'])
        a.equal(out,raw/(z*b['delta']**-3),'outer_stress_factors','three angular terms')
        a.equal(F(case['output']['axial']),b['axialIntegral']/(4*b['r']),'outer_stress_factors','nested axial normalization')
        a.check(out-2*b['K']*b['c']/b['r']!=out,'negative_controls','missing positive boundary term')

    # Direct inverse change of variables: u=t1²/s²-t1²/y².
    # By choosing rational s/y the square root appearing in the displayed
    # Jacobian is also exactly rational, so no floating point is involved.
    for n in range(1,33):
        t1=F(n+7,3)
        y=t1*F(n,8*(n+1))
        s=y*F(n+2,2*n+5)
        u=t1*t1/(s*s)-t1*t1/(y*y)
        v=1+(y/t1)**2*u
        sqrt_v=y/s
        a.equal(v,sqrt_v**2,'flat_substitution','inner transformed radius')
        a.equal(y**3/(2*t1*t1*sqrt_v**3),s**3/(2*t1*t1),'flat_substitution','inner exact Jacobian')
        a.check(u>0 and 0<y/t1<F(1,4),'flat_substitution','inner full analytic domain side')
        delta=F(n,2*(n+1))
        s=delta*F(n+1,2*n+3)
        t=1/(s*s)-1/(delta*delta)
        v=1+delta*delta*t
        sqrt_v=delta/s
        for m in [-3,-2,-1,0,1,4]:
            a.equal(s**m*s**3/2,delta**(m+3)/(2*sqrt_v**(m+3)),'flat_substitution','outer power and Jacobian '+str(m))
        # d/d delta [exp(-4/delta²)/8] = exp(-4/delta²)*delta^-3.
        a.equal(F(1,8)*8,1,'flat_primitive_identity','m=-3 constant exact primitive')
        a.check(F(1,4)*8!=1,'negative_controls','missing Jacobian one half')
        a.equal(delta**-3*delta**6,delta**3,'flat_primitive_identity','axial sixth power in common direction')

    # Closed Laplace moments, including the first tail moment. For b
    # bounded by B, delta<=1/2 gives coefficient (m+3)*int(t e^-4t)/2.
    a.equal(F(math.factorial(0),4),F(1,4),'kernel_moments','J value')
    a.equal(F(math.factorial(1),4**2)/2,F(1,32),'kernel_moments','J first derivative')
    for T in [F(0),F(1,4),F(2),F(7),F(31,2)]:
        a.equal((T/4+F(1,16))/2,T/8+F(1,32),'kernel_moments','tail derivative coefficient')
        # Integration by parts identity for tail factor P(T)=T/4+1/16.
        a.equal(4*(T/4+F(1,16))-F(1,4),T,'kernel_moments','first tail moment primitive')
    a.check(2*(1-F(1,16384))>1,'kernel_moments','actual activation lower logarithmic slope')
    a.equal(2*(1+F(1,27)),F(56,27),'kernel_moments','activation upper logarithmic slope')
    a.check(1+F(56,27)<5,'kernel_moments','complete Ka derivative')
    for n,negative in enumerate(fixture['negativeKernelBudgets']):
        a.equal(negative['pass'],False,'negative_controls','insufficient continuous kernel budget '+str(n))
    for row in r['outer']['heatDerivatives']:
        n=row['order']
        a.equal(int(row['upper']),math.factorial(n)*math.factorial(n+1),'heat_moments','actual positive Gamma quotient '+str(n))
        # For 0<h<1: (h)_n <=n!, (1+h)_n <=(n+1)!.
        for h in [F(1,10000),F(1,100),F(1,3)]:
            exact=math.prod((h+j)*(h+1+j) for j in range(n))
            a.check(exact<=int(row['upper']),'heat_moments','heat derivative bound')

    # Finite positive power arithmetic uses the unchanged source base.
    inner=audit_ledger(a,r['inner']['ledger'],'C',3)
    outer=audit_ledger(a,r['outer']['ledger'],'C',3)
    middle=audit_ledger(a,r['middle']['ledger'],'R',2)
    a.equal(max(inner['innerTheta'],inner['innerZ'])+1,r['inner']['factorCoefficientCPower'],'finite_power_ledgers','inner computed final power')
    a.equal(max(outer['outerTheta'],outer['outerScaledZ'])+1,r['outer']['factorCoefficientCPower'],'finite_power_ledgers','outer computed final power')
    a.equal(max(middle['theta'],middle['z'])+1,r['middle']['stressFirstJetPower'],'finite_power_ledgers','middle computed final power')
    for row in fixture['additionalAbsorptions']+[r['inner']['absorption'],r['outer']['absorption']]:
        term=row['expSeriesTerm']
        a.equal(int(row['factorial']),math.factorial(term),'exponential_absorption','actual chosen series term')
        a.check(math.factorial(term)<2**260,'exponential_absorption','finite factorial absorbed by same C')
        a.equal(row['effectivePower'],25600000*term-1,'exponential_absorption','same original R exponent')
        a.check(row['effectivePower']>row['power'],'exponential_absorption','strict power gap')

    # Independent ordinary D_y² with a nontrivial mixed y/phase polynomial
    # A(y,phi)=y²+3y phi+2phi². Differentiating its composition directly
    # gives 2/N+6+4N. The large 4N contribution must not disappear.
    for N in [2,17,257,8193]:
        composed=F(2,N)+6+4*N
        chain=F(2,N)+2*3+N*4
        a.equal(chain,composed,'fast_radial_chain','ordinary second derivative')
        a.check(chain!=F(2,N)+6+4,'negative_controls','fast phase second derivative is not order one')
    a.check(12<8192 and 51<53<56<59<64,'finite_power_ledgers','original fast N chain powers')
    a.check(3**128<2**256<2**260,'flat_middle_lower','actual e^-128 lower absorption')
    a.check(r['middle']['unitDirectionDerivativePower']<512,'flat_middle_lower','middle normalized direction')

    # Eliminate sqrt(a²+b²) before evaluating the independent c0 identity.
    # This also verifies that the displayed weaker a lower bound only
    # gives vs < R18; a false R8 inference is explicitly rejected.
    for k in range(1,65):
        aa,bb,F0=F(k+10,7),F(k-20,11),F(k+3,19)
        s=aa*aa+bb*bb
        n2=aa*aa/s
        lam2=-4*F0*F0*n2+2*F0*F0*aa
        direct=lam2/(4*F0*F0*n2)
        a.equal(direct,(aa+bb*bb/aa-2)/2,'frozen_geometry','c0 exact squared identity')
    a.check(3+10+3+1<18,'frozen_geometry','weak displayed vs upper')
    R=8192
    weak_a,weak_b=F(2,R**10),F(R**3,2)
    a.check(weak_a>F(1,R**10) and abs(weak_b)<R**3 and weak_a+weak_b**2/weak_a>R**8,'negative_controls','vs<R8 is not inferred from a>R^-10 alone')
    a.check(1+71+10<83,'frozen_geometry','lambda upper uses corrected c0')
    a.check(11+524+66+1<2048,'frozen_geometry','quotient derivative budget')
    a.check(3*1024>524+33+1,'frozen_geometry','projection retained first')
    a.check(64<R and 3*1024>2048+10+1,'frozen_geometry','actual same-box cone variation')

    paths=[NAVIER/'actual-stress-direction-program.mjs',NAVIER/'actual-stress-direction-bounds.mjs',HERE/'actual-stress-direction.test.mjs',HERE/'actual-stress-direction-fixture.mjs',Path(__file__).resolve(),NAVIER/'research/ACTUAL_STRESS_DIRECTION_KO.md']
    files=[]
    for path in paths:
        data=path.read_bytes()
        files.append({'path':str(path.relative_to(RESEARCH_IDE)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
    canonical=json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
    return {'schema':'MathScope.ActualStressDirectionIndependentEvidence/1','pass':True,'checks':a.checks,'categories':dict(a.categories),'method':'Exact Fraction evaluation of original full stress differences, nonlinear moment densities, both flat substitutions and Laplace primitives, independent finite power arithmetic and source byte binding. No finite profile sampling is used as a whole-domain certificate.','receiptCanonicalSHA256':hashlib.sha256(canonical).hexdigest(),'files':files,'receipt':r,'scope':{'finiteArithmeticIndependentlyChecked':True,'flatEndpointDirectionsIncluded':True,'completedBackgroundFrameCertified':False,'fullAnalyticProofFormalized':False,'actualUniformHColumnsCertified':False,'sourceUniformQStarCertified':False,'originalN506Complete':False}}


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    result=run()
    if args.output:
        args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({k:result[k] for k in ['schema','pass','checks','categories','receiptCanonicalSHA256']},ensure_ascii=False))
    else:
        print(json.dumps(result,ensure_ascii=False))
