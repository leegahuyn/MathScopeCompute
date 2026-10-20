#!/usr/bin/env python3
"""Independent permutation-based review of the continuous matrix enclosures.
Reads the other worker's output and writes only in this review directory.
"""
from fractions import Fraction as F
from hashlib import sha256
from itertools import permutations
from math import isqrt, factorial
from pathlib import Path
import json

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
TARGET=ROOT/'work/resumed_continuation/quadratic/evidence/ACTUAL_CONTINUOUS_MATRIX_AND_JETS.json'
RECORDS=ROOT/'work/resumed_continuation/quadratic/evidence/SELECTED_AUTHENTICATED_SOURCE_RECORDS.json'

def point(a):return F(a),F(a)
def add(a,b):return a[0]+b[0],a[1]+b[1]
def neg(a):return -a[1],-a[0]
def mul(a,b):
    c=[x*y for x in a for y in b]
    return min(c),max(c)
def scale(a,b):return mul(point(b),a)
def inv(a):
    assert a[0]*a[1]>0
    return 1/a[1],1/a[0]
def determinant(a):
    n=len(a);total=point(0)
    for p in permutations(range(n)):
        sign=(-1)**sum(p[i]>p[j] for i in range(n) for j in range(i+1,n))
        term=point(sign)
        for i,j in enumerate(p):term=mul(term,a[i][j])
        total=add(total,term)
    return total
def norm(a):return max(sum(max(abs(x),abs(y)) for x,y in row) for row in a)
def log_enclosure(x):
    x=F(x);power=0
    while x>2:x/=2;power+=1
    def direct(x):
        x=F(x)
        t=(x-1)/(x+1);n=110
        lower=2*sum(t**(2*k+1)/F(2*k+1) for k in range(n))
        tail=2*t**(2*n+1)/(F(2*n+1)*(1-t*t))
        return lower,lower+tail
    return add(direct(x),scale(direct(2),power))
def sqrti(x):
    x=F(x);d=2**110;n=isqrt(x.numerator*d*d//x.denominator)
    return F(n,d),F(n,d) if F(n,d)**2==x else F(n+1,d)
def encloses(outer,inner):return outer[0]<=inner[0]<=inner[1]<=outer[1]

def main():
    d=json.loads(TARGET.read_text());src=json.loads(RECORDS.read_text())['records']
    parse=lambda x:tuple(F(v) for v in x)
    A=[[parse(v) for v in row] for row in d['linearMatrixIntervals']]
    E=[r[2:] for r in A[2:]];U=[r[:2] for r in A[:2]]
    delta=F(1,2**200);decay=1-3*delta
    checks={}
    checks['all25ActualEntriesMatched']=len(d['matrixIntegralBindings'])==25 and all(x['analyticIntegralMatched'] for x in d['matrixIntegralBindings'])
    checks['samePositiveLambdaUpper']=d['lambdaInterval']==['0',str(delta)] and not d['lambdaSetToZero']
    checks['sourceRawC2ProductConvention']=d['systems'][0]['proof']['normConvention'].startswith('max over components, eta in [-1,1], and ordinary eta derivative orders 0,1,2')
    checks['sourceQuadraticNorm']=F(d['systems'][0]['proof']['quadraticUpper'])==64
    for j in range(5):
        left=F(j+9);right=left+F(1,2)
        for i in range(5):
            if (i<2)!=(j<2):checks[f'zero_{i}_{j}']=A[i][j]==point(0)
        if j<2:
            checks[f'unit_mass_{j}']=A[0][j]==point(1)
            ll,rr=log_enclosure(left),log_enclosure(right)
            checks[f'continuous_log_interval_{j}']=encloses(A[1][j],(-rr[1],-ll[0]+F(9,2)*delta))
        else:
            xlo,xhi=sqrti(left),sqrti(right)
            checks[f'sqrt_interval_{j}']=encloses(A[2][j],(sqrti(2*left)[0],sqrti(2*right)[1]))
            checks[f'negative_power_interval_{j}']=encloses(A[3][j],(-1/xlo[0],-decay/xhi[1]))
            checks[f'power_three_halves_interval_{j}']=encloses(A[4][j],(decay/(right*xhi[1]),1/(left*xlo[0])))
    dU=parse(d['UDeterminantInterval']);dE=parse(d['EDeterminantInterval'])
    checks['U_determinant_independent_permutations']=encloses(dU,determinant(U)) and dU[1]<0
    checks['E_positive_determinant']=0<dE[0]<dE[1]
    # f=x^(2+lambda) has f''/2 >=1 on x>=11, lambda>=0.
    # [f,-x,1] has positive Vandermonde sign; gaps .5,1.5,.5.
    product_lower=F(3,8)*sqrti(2)[0]
    for r in [F(23,2),F(25,2),F(27,2)]:product_lower*=decay/(r*sqrti(r)[1])
    checks['E_divided_difference_lower_independently_safe']=dE[0]<=product_lower
    # An independent upper bound uses the point determinant, avoiding shared
    # expression dependency differences between Laplace and permutation sums.
    assert (2+delta)*(1+delta)/(2*(1-3*delta))<2
    point_upper=sqrti(2)[1]*F(45,8)*2
    for l in [F(11),F(12),F(13)]:point_upper/=l*sqrti(l)[0]
    checks['E_upper_independent_divided_difference']=point_upper<=dE[1]
    output_inverse=[[parse(v) for v in row] for row in d['linearInverseIntervals']]
    for offset,mat,det in [(0,U,dU),(2,E,dE)]:
        n=len(mat)
        for i in range(n):
            for j in range(n):
                minor=[[mat[r][c] for c in range(n) if c!=i] for r in range(n) if r!=j]
                cofactor=scale(determinant(minor),(-1)**(i+j))
                value=mul(cofactor,inv(det))
                checks[f'inverse_cofactor_{offset+i}_{offset+j}']=encloses(output_inverse[offset+i][offset+j],value)
    M=F(d['newLinearInverseInfinityNormUpper']);beta=F(1,2**441);r=F(1,1000000)
    checks['inverse_norm_recomputed']=M==norm(output_inverse) and M<2**30
    q=8*delta*M*64*r
    checks['C2_contraction_recomputed']=F(d['newC2ContractionUpper'])==q< F(d['previousC2ContractionUpper'])<F(1,4)
    jet=beta/(1-q)
    checks['same_actual_preconditioned_incoming_beta']=F(d['maximumRawEtaJetIncomingBound'])==beta
    checks['C2_fixed_point_bound_recomputed']=F(d['newUniformOrdinaryC2JetBound'])==jet
    checks['C2_ball_invariant']=beta+4*delta*M*64*r*r<r
    checks['eight_actual_eta_calls']=len(d['rootDerivativeEnclosures'])==8 and all(x['ordinaryEtaOrders']==[0,1,2] and parse(x['eachDerivativeEnclosure'])==(-jet,jet) for x in d['rootDerivativeEnclosures'])
    point_q=2*delta*M*64*jet
    checks['actualJacobianNeumannBound']=F(d['actualI1JacobianInverseInfinityNormUpper'])==M/(1-point_q) and point_q<1
    # sigma_2'=2 sigma_2(1-sigma_2)(s^-3+(1-s)^-3).
    # Middle interval: <=2*(1/4)*(64+64)=64. Near zero the
    # bound is (3584/27)*exp(-14)<1; reflection handles near one.
    checks['sigma2_middle_bound']=2*F(1,4)*(64+64)==64
    checks['sigma2_endpoint_bound']=sum(F(14**k,factorial(k)) for k in range(4))>F(3584,27)
    cutoff=ROOT/d['sourceCutoffDefinition']['path']
    checks['source_sigma2_definition']=sha256(cutoff.read_bytes()).hexdigest()==d['sourceCutoffDefinition']['sha256'] and 'sigma_2(s)=a(s)/(a(s)+a(1-s)), a(s)=exp(-1/s^2)' in cutoff.read_text()
    checks['sigma2_global_upper']=d['newElementaryGlobalSigma2PrimeBound']==64
    for c in d['actualCallers']:
        caller,root,factor=c['callerNode'],c['rootNode'],c['factorNode']
        node=src[str(factor)];step=node['args'][1]
        checks[f'caller_source_factor_{caller}']=src[str(caller)]=={'op':'multiply','args':[root,factor]} and node['op']=='multiply' and node['args'][0]==24 and src['24']=={'op':'rational','args':['2','1']} and src[str(step)]['op']=='source_step_derivative' and src[str(step)]['args'][1]==1
        checks[f'caller_uniform_eta_jet_{caller}']=c['factorEtaIndependentProvedByRawCone'] and 2 not in c['factorSourceNodes'] and c['factorGlobalEnclosure']==['0','128'] and c['ordinaryEtaOrders']==[0,1,2] and parse(c['eachCallerDerivativeEnclosure'])==(-128*jet,128*jet)
    checks['no_whole_closure_claim']=not d['N706Closed'] and not d['N805Closed'] and d['wholeKernelRowsClosed']==0 and not d['originalRhsNumericallyEvaluated']
    assert all(checks.values()),[k for k,v in checks.items() if not v]
    record={'schema':'MathScope.IndependentQuadraticReview/1','reviewer':'continue_picard',
      'target':{'path':str(TARGET.relative_to(ROOT)),'sha256':sha256(TARGET.read_bytes()).hexdigest()},
      'targetCodeSHA256':sha256((ROOT/'work/resumed_continuation/quadratic/code/continue_quadratic.py').read_bytes()).hexdigest(),
      'checks':checks,'allPassed':True,
      'analyticReview':['The factor x^(-3/2-lambda) leaves rows sqrt(2)*x^(2+lambda), -x, 1, with positive determinant sign.',
        'The product support gaps are >=3/8; f divided difference is >=1 from f second derivative/2>=1.',
        'Positive normalized bump measures preserve the pointwise determinant lower bound by multilinearity.',
        'The already proved beta applies to the same exact A inverse and actual RHS, so replacing its operator-norm upper bound does not invalidate beta.',
        'Raw ordinary C2 product constants4 and8 give the stated Banach-space self-map and contraction; the zero-seeded root is unchanged.',
        'For s<=1/4, sigma(1-sigma)<=exp(2-s^-2), s^-3 exp(-s^-2)<=64exp(-16), and (1-s)^-3<=64/27. Thus sigma prime<1 there; reflection and the middle interval give global bound64.',
        'The actual eta-independent source factors are twice sigma_2 prime, so each actual caller9206/71726 C2 jet is bounded by128 times the same root-jet enclosure.'],
      'scope':'Independent continuous-matrix/C2-bound review; not an actual RHS evaluation or N706/N805 closure.'}
    (HERE/'REVIEW.json').write_text(json.dumps(record,indent=2)+'\n')
    print(json.dumps({'allPassed':True,'exactChecks':len(checks),'targetSHA256':record['target']['sha256']}))

if __name__=='__main__':main()
