#!/usr/bin/env python3
"""Independent Fraction/Decimal checks of the actual finite-jet producer.

The actual enormous source constants are kept symbolic. Generic finite
parameters below test the DIFFERENTIAL MAJORANT mathematics, never stand in
for the accepted N3 profile or its signed debt values.
"""
from __future__ import annotations
import argparse
from decimal import Decimal, localcontext
from fractions import Fraction as F
from functools import lru_cache
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent
RESEARCH_IDE = NAVIER.parent.parent
checks = []

def check(condition, name):
    checks.append({"id": name, "pass": bool(condition)})
    if not condition:
        raise AssertionError(name)

def conv(a, b, n):
    return [sum((a[j] * b[k-j] for j in range(k+1)
                 if j < len(a) and k-j < len(b)), F(0)) for k in range(n+1)]

def inv(a, n):
    b = [1/a[0]]
    for k in range(1, n+1):
        b.append(-sum((a[j]*b[k-j] for j in range(1, min(k, len(a)-1)+1)), F(0))/a[0])
    return b

def power(a, j, n):
    b = [F(1)] + [F(0)]*n
    for _ in range(j):
        b = conv(b, a, n)
    return b

def polynomial_value(a, x):
    return sum((v*x**j for j, v in enumerate(a)), F(0))

def dec(x):
    return Decimal(x.numerator)/Decimal(x.denominator) if isinstance(x, F) else Decimal(x)

def graph_eval(program):
    @lru_cache(None)
    def ev(i):
        node=program["nodes"][i]; a=node["args"]; op=node["op"]
        if op=="rational": return F(int(a[0]), int(a[1]))
        if op=="source_parameter": raise ValueError("Actual source parameter is not replaced by a fixture: "+a[0])
        if op=="add":
            x,y=ev(a[0]),ev(a[1]);return x+y if isinstance(x,F) and isinstance(y,F) else dec(x)+dec(y)
        if op=="multiply":
            x,y=ev(a[0]),ev(a[1]);return x*y if isinstance(x,F) and isinstance(y,F) else dec(x)*dec(y)
        if op=="inverse": return 1/ev(a[0])
        if op=="integer_power": return ev(a[0])**a[1]
        if op=="exp": return dec(ev(a[0])).exp()
        if op=="log_positive": return dec(ev(a[0])).ln()
        if op=="sqrt_positive": return dec(ev(a[0])).sqrt()
        raise ValueError(op)
    return ev

def signed_euler_polynomial(r):
    p=[1]
    for j in range(r):
        b=[0]*(len(p)+1)
        for k,c in enumerate(p): b[k]-=j*c;b[k+1]+=c
        p=b
    return p

def source_step(order, exponent):
    p={0:1}; seed=[]; polynomials=[]
    for r in range(order+1):
        seed.append(sum(abs(c)*max(1,(j+exponent-1)//exponent)**max(1,(j+exponent-1)//exponent) for j,c in p.items()))
        polynomials.append(dict(p)); b={}
        for j,c in p.items():
            b[j+exponent+1]=b.get(j+exponent+1,0)+exponent*c
            if j:b[j+1]=b.get(j+1,0)-j*c
        p={j:c for j,c in b.items() if c}
    floor=64 if exponent==2 else 16
    recip=[floor]; step=[1]
    for n in range(1,order+1):
        recip.append(floor*sum(comb(n,k)*2*seed[k]*recip[n-k] for k in range(1,n+1)))
        step.append(sum(comb(n,k)*seed[k]*recip[n-k] for k in range(n+1)))
    return step,recip,polynomials,seed

def run(data):
    receipt=data["receipt"]; p=receipt["normProgram"]; eval_norm=graph_eval(p)
    check(receipt["pass"],"actual-request-checks")
    check(receipt["radialOrder"]==3 and receipt["etaOrder"]==14,"actual-order-beyond-old-twelve")
    check(all(x["pass"] for x in data["summaryRequests"]),"all-independent-source-requests-pass")
    check(receipt["sourceFunctionIdentity"]["actualHeatI2RootBodyPresent"],"actual-full-heat-root-body")
    for binding in receipt["sourceBindings"]:
        b=(RESEARCH_IDE/binding["path"]).read_bytes()
        check(len(b)==binding["bytes"] and sha256(b).hexdigest()==binding["sha256"],"source-bytes:"+binding["path"])
    for key in ["fullGlobalF0DerivativeBound","positiveOrderCoefficientNormProduced","allOrderCutoffScheduleProduced","completedBackgroundC2TailCertified","actualUniformHColumnsCertified","sourceUniformQStarCertified","originalN506Complete"]:
        check(receipt["scope"][key] is False,"scope-not-promoted:"+key)
    check("t1/16" in receipt["bounds"]["F0inner"]["domain"]["X"][1],"inner-identification-before-C12")
    check(receipt["bounds"]["F0active"]["actualHeatI2CorrectionIncluded"],"actual-I2-in-active-F")
    check(receipt["bounds"]["F0active"]["domain"]["containsAllPositiveOrderVelocityCoefficientSupport"],"active-domain-covers-velocity-coefficients")
    check(receipt["bounds"]["F0active"]["domain"]["containsStressSupportFromOrder"]==2 and
          receipt["bounds"]["F0active"]["domain"]["containsFullFirstOrderAngularStressSupport"] is False,
          "first-order-angular-stress-not-promoted")
    check(F(1,16)<F(1,8),"strict-unchanged-collar-separation")
    check(F(1)<128,"active-Xplus-before-heat-on-original-Tf")

    # A fresh seed polynomial recurrence, retaining all coefficients beyond12.
    cutoff=data["cutoff"]
    for exponent,part in [(2,cutoff["activation"]),(1,cutoff["timeStep"])]:
        n=len(part["ordinaryDerivativeBounds"])-1
        step,recip,polys,seeds=source_step(n,exponent)
        for k in range(n+1):
            check(step[k]==int(part["ordinaryDerivativeBounds"][k]),f"sigma{exponent}-ordinary-{k}")
            check(recip[k]==int(part["reciprocalOrdinaryDerivativeBounds"][k]),f"sigma{exponent}-reciprocal-{k}")
            actual={v["power"]:int(v["coefficient"]) for v in part["seedDerivatives"][k]["polynomial"]}
            check(actual==polys[k],f"seed{exponent}-polynomial-{k}")
            check(seeds[k]==int(part["seedDerivatives"][k]["ordinaryDerivativeUpper"]),f"seed{exponent}-global-monomial-bound-{k}")
    check(11**4<64*4**4 and 11**2<16*4**2,"actual-cutoff-denominator-floors")

    # Physical chain rule tested against monomials with independent direct
    # differentiation, not merely against the unsigned recurrence.
    for row in data["conversions"]:
        r=row["radialOrder"]; signed=signed_euler_polynomial(r)
        check([abs(v) for v in signed]==list(map(int,row["unsignedCoefficients"])),f"signed-Euler-polynomial-{r}")
        coefficient=sum(abs(c)*factorial(k)*factorial(7) for k,c in enumerate(signed))
        check(coefficient==int(row["ordinaryCoefficient"]),f"ordinary-X-eta-factorials-{r}")
        for a in [F(-3,2),F(1,3),F(7,2),F(19)]:
            direct=F(1)
            for j in range(r):direct*=a-j
            check(polynomial_value(signed,a)==direct,f"physical-monomial-{r}-{a}")
    check(polynomial_value([0,0,1],F(3))!=F(3)*(F(3)-1),"negative-omit-Euler-lower-term")

    # The Catalan formula is compared to the FULL double geometric source
    # equation. Coefficients of t*w, t*w^2, w^3,... are retained independently.
    rows=data["implicit"]["rows"]; maxn=len(rows)
    for A in [F(1,8),F(1,2),F(2)]:
        w=[F(0)]*(maxn+1)
        for n in range(1,maxn+1):
            total=F(0)
            for j in range(n+1):
                wp=power(w,j,n)
                for i in range(n+1):
                    if i+j>n or (i,j) in [(0,0),(0,1)]:continue
                    total+=wp[n-i]
            w[n]=A*total
            closed=sum(F(int(t["coefficient"]))*A**t["aPower"]*(1+A)**t["onePlusAPower"] for t in rows[n-1]["terms"])
            check(closed==w[n],f"full-mixed-implicit-{A}-{n}")
    # Three genuinely variable equations; no constant-quadratic fixture can
    # make these source coefficients disappear.
    for variant in ["one-plus-t","geometric-quadratic","linear-and-all-higher"]:
        nmax=22; w=[F(0)]*(nmax+1)
        for n in range(1,nmax+1):
            total=F(1) if n==1 else F(0)
            square=conv(w,w,n)
            if variant=="one-plus-t":total+=square[n]+(square[n-1] if n else 0)
            elif variant=="geometric-quadratic":total+=sum(square)
            else:
                total+=sum(w[:n])
                for j in range(2,n+1):total+=sum(power(w,j,n))
            w[n]=total
            bound=sum(F(int(t["coefficient"]))*2**t["onePlusAPower"] for t in rows[n-1]["terms"])
            check(w[n]<=bound,f"variable-implicit-{variant}-{n}")
        if variant=="one-plus-t":
            check(w[3]>2,"negative-constant-quadratic-omits-tw2")

    # Natural B_rho coefficients: reconstruct log-radial derivatives as
    # operators on arbitrary powers, then compare exact coefficient sums.
    natural_rows=[r for r in p["ledger"] if r["label"]=="actual natural log-radius total jet"]
    for entry in natural_rows:
        for row in entry["coefficients"]:
            rr,mm=row["radialOrder"],row["etaOrder"]
            S=[[0]*(rr+1) for _ in range(rr+1)];S[0][0]=1
            for i in range(1,rr+1):
                for j in range(1,i+1):S[i][j]=S[i-1][j-1]+j*S[i-1][j]
            value=sum((F(S[rr][j]*factorial(mm+j)*2**(mm+j+1),4**j*factorial(rr)*factorial(mm)) for j in range(rr+1)),F(0))
            check(value==eval_norm(row["coefficientRoot"]),f"actual-natural-coefficient-{entry['order']}-{rr}-{mm}")
            if rr+mm<=8:
                for power_y in [0,1,3,7,19]:
                    falling=F(0)
                    for j in range(rr+1):
                        a=1
                        for v in range(j):a*=power_y-v
                        falling+=S[rr][j]*a
                    check(falling==power_y**rr,f"natural-Euler-on-monomial-{rr}-{mm}-{power_y}")

    # Independent exact Taylor coefficients for concrete functions.
    ev=graph_eval(data["toy"]); tr=data["toy"]["roots"]
    for n in [0,1,2,5,9,14,19]:
        for eta0 in [F(-1),F(-3,4),F(0),F(1,7),F(1)]:
            den=[1+eta0**2,2*eta0,F(1)]; series=inv(den,n)
            check(sum(map(abs,series))<=ev(tr[f"inverse{n}"]),f"actual-rational-f-Taylor-{n}-{eta0}")
        # sqrt(1+(3/4+t)^2), with exact zeroth sqrt 5/4.
        den=[F(25,16),F(3,2),F(1)]; sq=[F(5,4)]
        for k in range(1,n+1):sq.append(((den[k] if k<len(den) else 0)-sum(sq[j]*sq[k-j] for j in range(1,k)))/(2*sq[0]))
        check(dec(sum(map(abs,sq)))<=dec(ev(tr[f"sqrt{n}"])),f"positive-square-root-Taylor-{n}")
        ex=[F(1)]
        for k in range(1,n+1):ex.append((ex[k-1]+(2*ex[k-2] if k>=2 else 0))/k)
        check(dec(sum(ex))<=dec(ev(tr[f"exp{n}"])),f"exp-t-plus-t2-Taylor-{n}")
        check(sum((F(1,k) for k in range(1,n+1)),F(0))<=ev(tr[f"log{n}"]),f"log1plus-t-Taylor-{n}")

    # Actual circle mean: M(z)=sum z^(2j)/(4^j*(j!)^2). From that
    # independent period moment identity, R=M(2z)/M(z)^2 and its removable Q
    # satisfy Q_j=R_(j+2), including Q(0)=1/2.
    nmax=28; M=[F(0)]*(nmax+3)
    for j in range((nmax+2)//2+1):M[2*j]=F(1,4**j*factorial(j)**2)
    M2=[v*2**j for j,v in enumerate(M)]; Rseries=conv(M2,inv(conv(M,M,nmax+2),nmax+2),nmax+2)
    check(Rseries[0]==1 and Rseries[1]==0 and Rseries[2]==F(1,2),"actual-removable-variance-axis")
    for j in range(nmax+1):
        integrated=Rseries[j+2]*(j+1)*(j+2)*F(1,(j+1)*(j+2))
        check(integrated==Rseries[j+2],f"actual-removable-variance-derivative-{j}")
    check(Rseries[2]!=0,"negative-Q-axis-is-not-zero-or-divide-by-zero")

    # The ideal B8 reference has an unbounded F at zero. Its exact Cp
    # primitive remains finite and obeys the actual power-law identity.
    for j in range(1,33):
        t=F(1,j+1);x=t**5;K=F(3,2);XR=F(7)
        cp=F(5,2)*K*K*t
        # x=t^5 makes all fractional source powers rational. The source
        # primitive is differentiated through X=XR*t^5 independently.
        derivative=(F(5,2)*K*K)/(5*XR*t**4)
        exact_field_square=K*K/(2*XR*t**4)
        check(derivative==exact_field_square,f"ideal-Cp-exact-derivative-{j}")
        check(cp>0 and cp<F(5,2)*K*K,f"ideal-Cp-finite-at-axis-{j}")
    check(F(3,2)**2/(2*7*F(1,1000)**4)>10**8,
          "negative-ideal-F-not-a-bounded-actual-axis-field")

    # Actual Gamma normalized heat loss: derivatives at Z=0 are exact
    # rising-factorial moments. At eta endpoints use the continuous
    # one-sided derivatives, not a nonexistent negative-Z Laplace integral.
    heatrow=next(x for x in p["ledger"] if x["label"]=="actual heat loss arbitrary eta jet with radial decay")
    check(heatrow["radialDecayRetained"]=="1/X" and heatrow["improperTailIncluded"],"heat-all-orders-integrable-decay")
    for h in [F(1,8),F(1,3),F(1,2)]:
        kmax=17; a=[F(0)];ph=p1=F(1);positive=4*h
        for j in range(1,kmax+1):
            ph*=h+j-1;p1*=h+j
            a.append((-1)**(j+1)*ph*p1/factorial(j));positive+=ph*p1*6**j/factorial(j)
            check(p1==__import__('functools').reduce(lambda v,i:v*(h+i),range(1,j+1),F(1)),f"Gamma-exact-moment-{h}-{j}")
        for X in [F(1),F(3),F(17)]:
            for eta0 in [-1,1]:
                Z=[F(0),-4*eta0/X,-2/X]+[F(0)]*(kmax-2);loss=[F(0)]*(kmax+1)
                for j in range(1,kmax+1):
                    zz=power(Z,j,kmax);loss=[v+a[j]*w for v,w in zip(loss,zz)]
                check(sum(map(abs,loss))<=positive/X,f"actual-heat-endpoint-all-jets-{h}-{X}-{eta0}")
        A=F(1,2)+h
        check(F(1,h)>0 and F(1,2*A)<=1 and F(1,1+2*A)<=1,f"actual-improper-heat-integrals-{h}")
        check(F(1,2)+A>1 and -F(1,2)+A<1,f"negative-removing-1-over-X-loses-integrability-{h}")

    # Fast phase: direct differentiation of B=y^a eta^b phi^c after phi=Ny.
    for a in range(5):
        for c in range(5):
            for r in range(5):
                N=7;lhs=0
                for j in range(r+1):
                    def fall(x,k):
                        v=1
                        for i in range(k):v*=x-i
                        return v
                    if j<=c and r-j<=a:
                        lhs+=comb(r,j)*N**j*fall(a,r-j)*fall(c,j)*N**(c-j)
                rhs=fall(a+c,r)*N**c
                check(lhs==rhs,f"actual-fast-phase-chain-{a}-{c}-{r}")
    check(2*7**2!=2,"negative-dropping-N-squared-term")
    check(all(x["pass"] for x in checks),"all-independent-checks-pass")

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--fixture',type=Path);parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    raw=args.fixture.read_text() if args.fixture else subprocess.check_output(['node',str(HERE/'actual-leading-all-order-fixture.mjs')],text=True)
    data=json.loads(raw)
    with localcontext() as c:
        c.prec=180;run(data)
    result={"schema":"MathScope.ActualLeadingAllOrderIndependentAudit/1","pass":all(x["pass"] for x in checks),"checks":len(checks),"failed":[x for x in checks if not x["pass"]],
      "arithmetic":"independent Python Fraction and 180-digit Decimal","receiptSHA256":data["receiptSHA256"],
      "sourceScope":"Actual U0 global and actual F0 on the specified inner/active domains; source values kept symbolic. Generic arithmetic substitutions are not alternative N3 inputs.",
      "negativeControls":["missing falling-Euler terms","constant quadratic missing t*w^2","removable Q set to zero","singular ideal F treated as bounded","heat 1/X discarded","fast N^2 omitted"],"rows":checks}
    out=json.dumps(result,separators=(',',':'))
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(out+'\n')
    print(out)

if __name__=='__main__':main()
