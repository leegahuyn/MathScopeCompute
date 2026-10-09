#!/usr/bin/env python3
"""Exact B.35 ideal-profile algebra and source-dependent B.36 constants."""
import hashlib
import json
from fractions import Fraction as F
from pathlib import Path

from dyadic_interval import I, exp_negative

HERE=Path(__file__).resolve().parent


def rec(x):
    x=F(x)
    return {"numerator":str(x.numerator),"denominator":str(x.denominator),"approximate":float(x)}


def check_ideal_identity():
    checks=[]
    for eta in [F(-1),F(-3,7),F(0),F(2,5),F(1)]:
        for h in [F(1,100000000),F(1,1000),F(3,1000)]:
            for z in [F(1,2),F(3,5)]:
                for p,p0,p0e in [(F(2),F(-3),F(4)),(F(2000000),F(-9000000000000),F(-15000000000000))]:
                    x=z**10;K=p/(1+eta*eta);k=-2*eta/(1+eta*eta)
                    D=F(1,2)-h;A=F(1,2)+h;d=1-eta*eta
                    U=4*eta;E=K*z
                    M=U*x;Me=4*x
                    # Ibar=I/sqrt(2), Hbar=H/sqrt(2); the factor cancels in Qs.
                    Ib=F(5,8)*K*z**16;Ibe=k*Ib;Jb=U*Ib;Jbe=4*Ib+U*Ibe
                    S=U*U*x-F(5,12)*K*K*z**12
                    Se=8*U*x-F(5,6)*k*K*K*z**12
                    Cp=F(5,2)*K*K*z*z;Cpe=5*k*K*K*z*z
                    Pi=p0+Cp;Pie=p0e+Cpe
                    W=1-2*D*eta*M/x-d*Me/x
                    Q=-W+((1-h)*Ib-D*eta*Ibe-d*Jbe+2*(h-D)*eta*Jb)/(x*K*z**6)
                    N=-W*U+(D*(M-eta*Me)+4*h*eta*S-d*Se)/x+4*A*eta*Pi-d*Pie
                    closedQ=F(9,8)-F(5,8)*h+2*h*eta*eta+F(5,4)*eta*eta*(D+4*d)/(1+eta*eta)
                    closedN=eta*(-20+32*(1+h)*eta*eta)+4*A*eta*p0-d*p0e+K*K*z*z*eta*(5+F(25,3)*h+F(25,3)*d/(1+eta*eta))
                    checks.extend([W==-3+8*h*eta*eta,Q==closedQ,N==closedN])
    return {"passed":sum(checks),"total":len(checks)}


def source_constants(axis_path):
    source=json.loads(axis_path.read_text())
    pressure=source['sourcePressureCertificate']
    h=F(source['selectedParameters']['h'])
    logP=F(pressure['parametersExact']['logP'])
    P=exp_negative(I(logP)).reciprocal()
    Pmin,Pmax=P.lower(),P.upper()
    qmin=F(9,8)-F(5,8)*h
    emin=Pmin/2*exp_negative(I(F(4,5))).lower()
    p0=F(pressure['totalMassUpper'])
    p1=F(pressure['realBounds']['Pprime']['upper'])
    nmax=52+32*h+4*(F(1,2)+h)*p0+p1+(F(40,3)+F(25,3)*h)*Pmax*Pmax*exp_negative(I(1)).upper()
    w=1+nmax/(emin*qmin)
    return {'schema':'MathScope.IdealB35Bounds/1','sourceAxisCertificateSHA256':hashlib.sha256(axis_path.read_bytes()).hexdigest(),
            'domain':{'logx':['-8','-5'],'eta':['-1','1']},
            'closedForms':{'W':'-3+8*h*eta^2','Qs':'9/8-5*h/8+2*h*eta^2+(5/4)*eta^2*(D+4*d)/(1+eta^2)',
                           'Ns':'eta*(-20+32*(1+h)*eta^2)+4*A*eta*Pi0-d*Pi0eta+K^2*x^(1/5)*eta*(5+25*h/3+25*d/(3*(1+eta^2)))'},
            'bounds':{k:rec(v) for k,v in {'PStarLower':Pmin,'PStarUpper':Pmax,'Qmin':qmin,'emin':emin,'Nmax':nmax,'wStarUpper':w,'B36AllowedBs':F(1,10)/(1+w)}.items()},
            'exactAlgebraControls':check_ideal_identity(),
            'scope':'Whole-box bounds for the A.7 ideal profile using the same A.21 datum. These do not by themselves bound the perturbed profile or its eta derivatives.'}


if __name__=='__main__':
    axis=HERE.parent/'source-coherence/source-axis-bounds.json'
    result=source_constants(axis)
    out=HERE/'ideal-reference-source-bounds.json'
    out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'identity':result['exactAlgebraControls'],'bounds':{k:v['approximate'] for k,v in result['bounds'].items()}},indent=2))
    assert result['exactAlgebraControls']['passed']==result['exactAlgebraControls']['total']
