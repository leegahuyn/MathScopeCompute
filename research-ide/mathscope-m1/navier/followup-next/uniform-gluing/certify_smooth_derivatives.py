#!/usr/bin/env python3
"""Continuous derivative bounds for the actual flat step and bump shapes."""
import hashlib
import json
from fractions import Fraction as F
from pathlib import Path

from dyadic_interval import I,exp_negative,sigma_interval,sigma_prime_box,sigma_second_box

HERE=Path(__file__).resolve().parent


def third_box(a,b):
    a,b=F(a),F(b)
    assert 0<=a<=b<=1
    if a>=F(1,2):
        return third_box(1-b,1-a)
    if b>F(1,2):
        l,r=third_box(a,F(1,2)),third_box(F(1,2),b)
        return I(min(l.lo,r.lo),max(l.hi,r.hi),raw=True)
    if a==0:
        if b==0:return I(0)
        assert b<=F(1,4)
        # Each t^-k*exp(-1/t^2), k in {5,7,9}, is increasing on
        # 0<t<=1/4. This proves the bound through the flat endpoint.
        v=I(64/b**9+144/b**7+48/b**5)*exp_negative(I(1/b**2-4))
        return I(-v.hi,v.hi,raw=True)
    t=I(a,b);s=sigma_interval(a,b)
    gp=2/t**3+2/(1-t)**3
    gpp=-6/t**4+6/(1-t)**4
    gppp=24/t**5+24/(1-t)**5
    return s*(1-s)*((1-6*s+6*s*s)*gp**3+3*(1-2*s)*gp*gpp+gppp)


def rec(v):
    v=F(v)
    return {'numerator':str(v.numerator),'denominator':str(v.denominator),'approximate':float(v)}


def main():
    n=1024
    bounds=[F(0)]*3;attained=[None]*3
    for i in range(n//2):
        a,b=F(i,n),F(i+1,n)
        vals=[sigma_prime_box(a,b),sigma_second_box(a,b),third_box(a,b)]
        for j,v in enumerate(vals):
            m=v.abs().upper()
            if m>bounds[j]:bounds[j]=m;attained[j]=[str(a),str(b)]
    # Reflection sigma(1-t)=1-sigma(t) transfers every absolute bound
    # to the other half, including the other flat endpoint.
    output={'schema':'MathScope.FlatStepDerivativeBounds/1',
            'shape':'sigma(t)=exp(-1/t^2)/(exp(-1/t^2)+exp(-1/(1-t)^2)) on (0,1), with flat constant extensions.',
            'domain':['0','1'],'method':'88-bit outward dyadic whole-cell formulas, exact reflection, and analytic endpoint majorants.',
            'partitionCells':n,'bounds':{'sigma'+str(j+1):rec(v) for j,v in enumerate(bounds)},
            'maximizingEnclosureCells':attained,
            'endpointThirdDerivativeMajorant':'(64*t^-9+144*t^-7+48*t^-5)*exp(4-t^-2) for 0<t<=1/4, increasing there.',
            'bumpTransfer':{
                'B8':'b(x)=sigmaPrime((x-left)/width): sup|b^(k)| <= sup|sigma^(k+1)|/width^k, k=0,1,2.',
                'unitMassC2':'b(x)=sigmaPrime((x-left)/width)/width: sup|b^(k)| <= sup|sigma^(k+1)|/width^(k+1), k=0,1,2.'},
            'sourceSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'arithmeticSHA256':hashlib.sha256((HERE/'dyadic_interval.py').read_bytes()).hexdigest(),
            'scope':{'continuousStepAndBumpDerivatives':True,'sourceC12SlowDerivativesCertified':False,'globalConePromoted':False}}
    (HERE/'smooth-derivative-certificate.json').write_text(json.dumps(output,indent=2)+'\n')
    print(json.dumps({k:v['approximate'] for k,v in output['bounds'].items()},indent=2))


if __name__=='__main__':main()
