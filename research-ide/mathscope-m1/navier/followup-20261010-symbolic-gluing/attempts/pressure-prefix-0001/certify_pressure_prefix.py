#!/usr/bin/env python3
"""Validated Taylor integration of the same outer pressure prefix.

Fixed dyadic interval arithmetic; actual source sigma; Cauchy remainder on
continuous complex discs, including flat endpoint collars.  No mpmath or
floating-point value enters the certificate.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import time
from fractions import Fraction as F
from pathlib import Path

HERE=Path(__file__).resolve().parent
BITS=384
UNIT=1<<BITS
ORDER=96
DEN=2048
LEFT=DEN//16
RIGHT=15*DEN//16
COUNT={"interval_products":0,"rounded_convolutions":0,"rational_conversions":0,
       "rounded_scalar_operations":0,"exponentials":0}
ONE=(UNIT,UNIT)
ZERO=(0,0)

def ceildiv(a,b): return -((-a)//b)
def point(x):
    x=F(x)
    COUNT["rational_conversions"]+=1
    return x.numerator*UNIT//x.denominator,ceildiv(x.numerator*UNIT,x.denominator)
def add(a,b): return a[0]+b[0],a[1]+b[1]
def neg(a): return -a[1],-a[0]
def sub(a,b): return add(a,neg(b))
def rawmul(a,b):
    COUNT["interval_products"]+=1
    al,ah=a;bl,bh=b
    if al>=0:
        if bl>=0: return al*bl,ah*bh
        if bh<=0: return ah*bl,al*bh
        return ah*bl,ah*bh
    if ah<=0:
        if bl>=0: return al*bh,ah*bl
        if bh<=0: return ah*bh,al*bl
        return al*bh,al*bl
    if bl>=0: return al*bh,ah*bh
    if bh<=0: return ah*bl,al*bl
    return min(al*bh,ah*bl),max(al*bl,ah*bh)
def mul(a,b):
    lo,hi=rawmul(a,b)
    COUNT["rounded_scalar_operations"]+=1
    return lo//UNIT,ceildiv(hi,UNIT)
def scale(a,n,d=1):
    COUNT["rounded_scalar_operations"]+=1
    if n<0: return neg(scale(a,-n,d))
    return a[0]*n//d,ceildiv(a[1]*n,d)
def invpos(a):
    if a[0]<=0: raise ValueError("Reciprocal interval crosses zero")
    COUNT["rounded_scalar_operations"]+=1
    return UNIT*UNIT//a[1],ceildiv(UNIT*UNIT,a[0])
def widen(a,rad): return a[0]-rad,a[1]+rad
def frac_json(a):
    return {"lower":str(F(a[0],UNIT)),"upper":str(F(a[1],UNIT)),
            "width":str(F(a[1]-a[0],UNIT))}
def expneg(x):
    x=F(x)
    if x<0: raise ValueError("Expected nonnegative argument")
    COUNT["exponentials"]+=1
    if x==0: return ONE
    m=0
    while x>F(1,2):
        x/=2;m+=1
    p=point(x)
    term=ONE;out=ONE
    for k in range(1,121):
        term=scale(mul(term,p),-1,k)
        out=add(out,term)
    # e^|x| |x|^121 /121! <2^-700; dyadic ceiling is outward.
    rad=ceildiv(UNIT,1<<700)
    out=widen(out,rad)
    for _ in range(m): out=mul(out,out)
    if out[0]<=0: raise AssertionError("Insufficient precision for exponential positivity")
    return out
def rawconv(a,b,k,start=0,weighted=False):
    lo=hi=0
    for j in range(start,k+1):
        x,y=rawmul(a[j],b[k-j])
        if weighted: x*=j;y*=j
        lo+=x;hi+=y
    return lo,hi
def sigma_jet(n):
    t=F(n,DEN);step=F(1,DEN)
    mirror=t>F(1,2)
    if mirror: t=1-t;step=-step
    aa=1/t**2
    bb=1/(1-t)**2
    left=[aa];right=[bb]
    for k in range(ORDER):
        left.append(left[-1]*(-step/t)*F(k+2,k+1))
        right.append(right[-1]*(step/(1-t))*F(k+2,k+1))
    logs=[point(right[k]-left[k]) for k in range(ORDER+1)]
    q=[expneg(left[0]-right[0])]
    for k in range(1,ORDER+1):
        lo,hi=rawconv(logs,q,k,start=1,weighted=True)
        div=UNIT*k
        q.append((lo//div,ceildiv(hi,div)))
        COUNT["rounded_convolutions"]+=1
    d0=invpos(add(ONE,q[0]))
    inverse=[d0]
    for k in range(1,ORDER+1):
        lo,hi=rawconv(q,inverse,k,start=1)
        conv=(lo//UNIT,ceildiv(hi,UNIT))
        inverse.append(neg(mul(d0,conv)))
        COUNT["rounded_convolutions"]+=1
    if mirror: return inverse
    return [sub(ONE,inverse[0])]+[neg(x) for x in inverse[1:]]

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output",required=True,type=Path)
    args=p.parse_args()
    if args.output.exists(): raise SystemExit("Refusing to overwrite historical evidence")
    outer=HERE.parent/"followup-20261010-outer-reselection/OUTER_DERIVATION.md"
    oh=hashlib.sha256(outer.read_bytes()).hexdigest()
    if oh!="ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81":
        raise SystemExit("Wrong outer source")
    assert 2*F(1,2)**121/F(math.factorial(121))<F(1,2**700)
    assert 2*F(3,8)**254<F(1,2**350)
    assert F(1,256)*4/(F(3,10)-F(1,256))**3<F(2,3)
    assert F(160,109)**2-F(256,27)<-4
    assert F(1,5)+F(13,5*256)<F(1,4)

    start=time.monotonic()
    collar=point(F(1,2**350))
    collar_factor=sub(ONE,scale(collar,2))
    exp_left=invpos(expneg(F(1,80)))
    first=mul(scale(sub(exp_left,ONE),5),collar_factor)
    rr=mul(exp_left,collar_factor)
    integral=ZERO
    radius=F(1,256)
    ratio=F(1,DEN)/radius
    tail=2*ratio**(ORDER+1)/(1-ratio)
    rad=ceildiv(tail.numerator*UNIT,tail.denominator)
    int_rad=ceildiv(tail.numerator*UNIT,tail.denominator*DEN)
    common=math.lcm(*range(1,ORDER+2))
    integral_weights=[common//(k+1) for k in range(ORDER+1)]
    checkpoints=[]
    for n in range(LEFT,RIGHT):
        sig=sigma_jet(n)
        r=[rr]
        for k in range(ORDER):
            lo,hi=rawconv(sig,r,k)
            num_lo=r[k][0]*UNIT-6*hi
            num_hi=r[k][1]*UNIT-6*lo
            denom=5*(k+1)*DEN*UNIT
            r.append((num_lo//denom,ceildiv(num_hi,denom)))
            COUNT["rounded_convolutions"]+=1
        rr=widen((sum(x[0] for x in r),sum(x[1] for x in r)),rad)
        ilo=sum(x[0]*w for x,w in zip(r,integral_weights))
        ihi=sum(x[1]*w for x,w in zip(r,integral_weights))
        deni=common*DEN
        incr=widen((ilo//deni,ceildiv(ihi,deni)),int_rad)
        integral=add(integral,incr)
        if not (0<rr[0]<rr[1]<2*UNIT):
            raise AssertionError("The analytic positive enclosure was lost")
        if (n-LEFT+1)%128==0 or n+1==RIGHT:
            row={"completedCells":n-LEFT+1,"totalCells":RIGHT-LEFT,
                 "elapsedSeconds":round(time.monotonic()-start,3),
                 "RWidthBits":BITS-(rr[1]-rr[0]).bit_length()}
            checkpoints.append(row)
            print(json.dumps(row),flush=True)
    e04=expneg(F(2,5))
    last=mul(mul(e04,sub(invpos(expneg(F(1,16))),ONE)),collar_factor)
    total=add(add(first,integral),last)
    coeff=add(point(F(5,2)),scale(add(total,e04),1,2))
    width=F(coeff[1]-coeff[0],UNIT)
    if not width<F(1,2**256):
        raise AssertionError(f"Pressure prefix width did not meet 256-bit target: {width}")
    receipt={
        "schema":"mathscope.same-datum.pressure-prefix.continuous-taylor.v1",
        "source":{"outerSha256":oh,"producerSha256":hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
        "method":{"precisionBits":BITS,"taylorDegree":ORDER,"step":f"1/{DEN}",
                  "complexCauchyRadius":"1/256","complexRBound":"2",
                  "firstCollar":[0,"1/16"],"lastCollar":["15/16",1],
                  "sigmaIntegralCollarUpper":"1/2^350","bodyCells":RIGHT-LEFT,
                  "endpointRemainderPerCell":str(tail),
                  "roundoff":"All integer operations directed outward; no machine floating-point arithmetic in enclosures."},
        "actualIntegralOfR":frac_json(total),
        "pressureCoefficient":frac_json(coeff),
        "coefficientDefinition":"5/2 + (1/2)*integral_0^1 exp(y/5-(6/5)*integral_0^y sigma)dy + (1/2)*exp(-2/5)",
        "operations":COUNT,"progress":checkpoints,"elapsedSeconds":round(time.monotonic()-start,3),
        "claimBoundary":{"continuousPrefixIntegralEnclosed":True,
                         "coefficientWidthBelow2PowMinus256":True,
                         "fullA21DatumComparisonRequiresSeparateAnalyticProof":True,
                         "newLeanProof":False,"fullProfileCertified":False}}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with args.output.open("x") as f:
        json.dump(receipt,f,indent=2);f.write("\n")
    with (args.output.parent/Path(__file__).name).open("xb") as f: f.write(Path(__file__).read_bytes())
    print(json.dumps({"success":True,"receipt":str(args.output),"widthBits":BITS-(coeff[1]-coeff[0]).bit_length(),
                      "elapsedSeconds":receipt["elapsedSeconds"]}),flush=True)
if __name__=="__main__": main()

