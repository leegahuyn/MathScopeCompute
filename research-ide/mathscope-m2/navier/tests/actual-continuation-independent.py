#!/usr/bin/env python3
"""Independent Fraction/Decimal oracles for additive actual continuation.

The polynomial oracle picks exact rational values INSIDE the coefficient
intervals; it tests the enclosure algorithm and is not a replacement source.
The actual-source connection is the separately hashed analytic/debt proof.
"""
from fractions import Fraction as F
from decimal import Decimal, localcontext
from math import factorial, comb
from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[4]
JS = r'''
import {directedArithmetic,rational as q} from './research-ide/mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {evaluateActualCoreMoments,integrateIntervalPolynomial} from './research-ide/mathscope-m2/navier/actual-continuation-moments.mjs';
import {evaluateActualCorePoint} from './research-ide/mathscope-m2/navier/actual-core-evaluator.mjs';
import {integrateReferenceRegular,actualB22CollarBudget} from './research-ide/mathscope-m2/navier/actual-continuation-reference.mjs';
import {actualContinuationOmegaComparison,evaluateActualAxialContinuationCell} from './research-ide/mathscope-m2/navier/actual-continuation-comparison.mjs';
const cases=[{Y:'4',eta:{kind:'DIRECT_RATIONAL',value:'1/4'}},{Y:'3/2',eta:{kind:'DIRECT_RATIONAL',value:'-2/5'}},{Y:'4',eta:{kind:'J_SCALED',value:'1'}},{Y:'4',eta:{kind:'RHO_SCALED',value:'1/4'}}];
const cores=cases.map(x=>({input:{...x,bits:192,degree:32,etaOrder:2},core:evaluateActualCoreMoments({...x,bits:192,degree:32,etaOrder:2}),anchor:evaluateActualCorePoint({...x,Y:'1',bits:192,degree:32,etaOrder:2,radialOrder:0})}));
const logarithms=[];for(const bits of [96,192,512]){const A=directedArithmetic(bits);for(const x of ['1/7','2','16','1000','513/512','1/1048576'])logarithms.push({bits,x,interval:A.pack(A.logRational(x))});}
const A=directedArithmetic(192),primitive=integrateReferenceRegular(A,{left:q(1),right:q(4),U:A.point(11),Ueta:A.point(13),a:A.point(2),b:A.point(3),ae:A.point(5),be:A.point(7)});
const polynomial=[];for(const weight of [0,1,2,3,4])polynomial.push({weight,interval:A.pack(integrateIntervalPolynomial(A,[q(3,7),q(-5,9),q(11,13)].map(A.point),q(1,3),q(7,5),weight))});
console.log(JSON.stringify({cores,logarithms,primitive,polynomial,budget:actualB22CollarBudget(),comparison:actualContinuationOmegaComparison(),cells:['-1','0','1/4','1'].map(eta=>evaluateActualAxialContinuationCell({eta,XInterval:['0','110'],bits:192}))}));
'''

def fraction(s):
    return F(str(s))

def ends(box):
    return fraction(box['lower']), fraction(box['upper'])

def midpoint(box):
    a, b = ends(box)
    return (a + b) / 2

def enclosed(box, value):
    a, b = ends(box)
    return a <= value <= b

checks = []

def check(name, condition, detail=None):
    checks.append({'id':name, 'pass':bool(condition), **({'detail':detail} if detail else {})})
    if not condition:
        raise AssertionError(name)

data = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', JS], cwd=ROOT, text=True))

# Independent logarithm oracle: Python Decimal uses its own correctly rounded ln.
with localcontext() as ctx:
    ctx.prec = 240
    for row in data['logarithms']:
        x=fraction(row['x']);v=(Decimal(x.numerator)/Decimal(x.denominator)).ln()
        v=F(v);eps=F(1,10**230)
        lo,hi=ends(row['interval'])
        check(f"decimal_log_{row['bits']}_{row['x']}",lo<=v-eps and v+eps<=hi)

# Independent power antiderivative, without the JS interval implementation.
for row in data['polynomial']:
    a,b=F(1,3),F(7,5);w=row['weight'];coeff=[F(3,7),F(-5,9),F(11,13)]
    value=sum(c*(b**(k+w+1)-a**(k+w+1))/F(k+w+1) for k,c in enumerate(coeff))
    check(f'polynomial_weight_{w}',enclosed(row['interval'],value))

def jet_times(a,b):
    return [sum(a[k]*b[m-k] for k in range(m+1)) for m in range(3)]

def integral(poly,weight,Y):
    # Coefficients are those of t=y/Y. This is an exact beta-monomial formula.
    return [sum(co[m]/F(k+weight+1) for k,co in enumerate(poly))*Y**(weight+1)*factorial(m) for m in range(3)]

nonzero_higher_derivative = False
for ci,case in enumerate(data['cores']):
    inp=case['input'];Y=fraction(inp['Y']);N=inp['degree'];anchor=case['anchor'];result=case['core']
    chi=[midpoint(x) for x in anchor['phi']['chiNormalizedEtaTaylorCoefficients']]
    phi=[]
    for n in range(N+1):
        # Closed binomial coefficients of chi(w)^n, not the JS recurrence.
        jet=[chi[0]**n,
             F(n)*chi[0]**(n-1)*chi[1] if n else F(0),
             (F(n)*chi[0]**(n-1)*chi[2] if n else F(0))+(F(comb(n,2))*chi[0]**(n-2)*chi[1]**2 if n>=2 else F(0))]
        factor=F((-1)**n,2**n*factorial(n)*factorial(n+1))*Y**n
        phi.append([factor*v for v in jet])
    # The coefficient enclosure contains j0 in [0,2^-192]. Choose its exact
    # midpoint for this operator oracle; this is explicitly NOT a source datum.
    j=F(1,2**193)
    ucoef=[midpoint(row['uOverKReference'])*Y*j**m/F(factorial(m)) for m,row in enumerate(anchor['axial']['rows'])]
    u=[[F(0)]*3,ucoef]
    def product(p,r):
        # A bivariate Cauchy product, evaluated independently with rational sums.
        return [[sum(p[i][a]*r[k-i][m-a] for i in range(len(p)) if 0<=k-i<len(r) for a in range(m+1)) for m in range(3)] for k in range(len(p)+len(r)-1)]
    cases=[('phi',phi,0),('yPhi',phi,1),('phiSquared',product(phi,phi),0),('yPhiSquared',product(phi,phi),1),('uOverK',u,0),('uOverKSquared',product(u,u),0),('yUOverKPhi',product(u,phi),1)]
    for key,pol,w in cases:
        oracle=integral(pol,w,Y)
        for m,value in enumerate(oracle):
            row=next(r for r in result['rows'] if r['id']==key and r['etaDerivativeOrder']==m)
            check(f'core_operator_{ci}_{key}_eta{m}',enclosed(row['polynomialIntegral'],value))
            lo,hi=ends(row['polynomialIntegral']);alo,ahi=ends(row['actualInterval']);radius=fraction(row['analyticIntegralErrorUpper'])
            check(f'core_actual_error_{ci}_{key}_eta{m}',radius>0 and alo<=lo-radius and ahi>=hi+radius)
            if ci==2 and key=='phi' and m==2:
                nonzero_higher_derivative=not enclosed(row['polynomialIntegral'],value/2)
check('missing_second_derivative_factorial_fails',nonzero_higher_derivative)

# Integrate independently as Laurent polynomials. The negative-power term
# produces log(b/a); squares retain all cross terms.
with localcontext() as ctx:
    ctx.prec=230
    log4=Decimal(4).ln();lo,hi=Decimal(1),Decimal(4)
    def lint(coeff):
        result=Decimal(0)
        for p,c in coeff.items():
            dc=Decimal(c.numerator)/Decimal(c.denominator)
            result+=dc*(log4 if p==-1 else (hi**(p+1)-lo**(p+1))/Decimal(p+1))
        return result
    raw={
      'Jminus1':{0:F(2),-1:F(3)}, 'Jzero':{1:F(2),0:F(3)},
      'Jminus1Eta':{0:F(5),-1:F(7)}, 'JzeroEta':{1:F(5),0:F(7)},
      'Hminus1':{0:F(22),-1:F(33)},'Hzero':{1:F(22),0:F(33)},
      'Hminus1Eta':{0:F(81),-1:F(116)},'HzeroEta':{1:F(81),0:F(116)},
      'Kminus2':{0:F(4),-1:F(12),-2:F(9)},'Kminus1':{1:F(4),0:F(12),-1:F(9)}
    }
    for key,p in raw.items():
        check('reference_laurent_'+key,enclosed(data['primitive']['values'][key],F(lint(p))))
    check('reference_primitive_log_omission_fails',not enclosed(data['primitive']['values']['Jminus1'],F(6)))
    check('reference_derivative_product_omission_fails',not enclosed(data['primitive']['values']['Hminus1Eta'],F(11*(15+7*log4))))

# Fixed source hierarchy and derivative coefficient proof, exact integer work.
budget=data['budget'];check('forty_factorial_below_Q_minimum',factorial(40)<2**260)
check('C_power_budget',8000+3000-1>10000)
check('B22_positive_width_exponent',260*(120*10000-2000)>2048)
check('B8_source_bump_product_budget',F(2*9*13,10**6)<1)
check('actual_smallness_exponent',F(3,2**16002)<F(1,2**16000)<F(1,2**2048))
check('C12_mass_average_exponent',13*(50-22-1)==351)

# Recompute the rational comparison upper bounds from ordinary product rules.
h=F(1,1024);invL=1/(1-2*h);A=F(1,2)+h
v=4*invL;ve=9*invL+4*(4*h)*invL**2
p=invL/2*(F(1,2)*16+256+2*A*40)+128/F(4)+2
f=invL/2*(F(1,2)*8+F(5,2)+128+20)+128/F(8)
check('comparison_delta_v',v<5);check('comparison_delta_v_eta',ve<16)
check('comparison_pressure_axis_included',p<256);check('comparison_flux',f<256)
check('source_remainder_nonzero_and_not_relative',fraction(data['comparison']['weightedRemainder']['final']['POverXR'])==F(1,2**2040)+F(1,2**260) and not data['comparison']['weightedRemainder']['remainderIsRelativeError'])
check('mass_match_not_inferred_from_support','Equal U alone' in data['comparison']['supportAndMass']['primitiveVanishingReason'])
check('functional_eta_family_not_promoted',not data['comparison']['scope']['etaDerivativeFamilyOfMomentRemainderCertified'])
check('actual_total_debt_not_fabricated',not data['comparison']['scope']['fullGlobalOmegaMomentValuesAvailable'])

for i,row in enumerate(data['cells']):
    check(f'actual_cell_{i}_finite_width',all(ends(x['actualInterval'])[0]<=ends(x['actualInterval'])[1] for x in row['rows']))
    check(f'actual_cell_{i}_keeps_source_and_modulation',row['error']['includesActualB26B34B8'] and row['error']['includesActualC12AndI1Repair'] and not row['scope']['actualUEquals4Eta'])

paths=[ROOT/'research-ide/mathscope-m2/navier'/name for name in ['actual-continuation-arithmetic.mjs','actual-continuation-moments.mjs','actual-continuation-reference.mjs','actual-continuation-a2-program.mjs','actual-continuation-comparison.mjs','actual-continuation-construction.mjs']]
out={'schema':'MathScope.ActualContinuationIndependentAudit/1','pass':all(x['pass'] for x in checks),'checksPassed':sum(x['pass'] for x in checks),'checksTotal':len(checks),'checks':checks,'sourceSHA256':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths},'scope':{'oracleArithmetic':'Python Fraction and Decimal; no JS arithmetic code imported','polynomialOracle':'Exact rational points inside certified coefficient intervals test the polynomial enclosure operator; these test points are not source replacements.','analyticSourceProof':'Imported source identities, Banach tail/debt/derivative proofs remain separate and hash-bound.','wholeA2IntegralCentersNumericallyEnclosed':False,'fullActualMomentDebtsClosed':False,'newLeanKernelProof':False}}
path=Path(__file__).with_name('actual-continuation-independent.json');path.write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'pass':out['pass'],'checksPassed':out['checksPassed'],'checksTotal':out['checksTotal'],'path':str(path)}))
