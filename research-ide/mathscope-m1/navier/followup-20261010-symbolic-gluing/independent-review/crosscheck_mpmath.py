#!/usr/bin/env python3
"""Independent high-precision diagnostics for positive-lambda C.2 moments.

Uses mpmath directly, never importing the producer. Adaptive quadrature is a
diagnostic; it does not replace the rigorous whole-cell enclosures. The zero
lambda limit is only a comparison of continuous normalized weights, not an
admissible original source or a substitution for the actual positive lambda.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys
from time import monotonic

sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent
BASE=HERE.parent
EXPECTED="a76539a30b9900a0275f2cfb25948c5aa13f222e3e578d3d5fb1f81617bccbe7"


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--certificate",type=Path,default=BASE/"attempts/0001/certificate.json")
    parser.add_argument("--mpmath-root",type=Path,help="Optional directory containing the mpmath package")
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    if args.output.exists():
        raise FileExistsError("Choose a new output filename")
    if sha(args.certificate)!=EXPECTED:
        raise ValueError("Unexpected certificate bytes")
    if args.mpmath_root:
        sys.path.insert(0,str(args.mpmath_root.resolve()))
    import mpmath as mp
    mp.mp.dps=220
    data=json.loads(args.certificate.read_text())
    start=monotonic()
    checks=[]
    numerical=[]

    def dec(value):
        return mp.nstr(value,110)
    def check(name,value,detail=None):
        checks.append({"name":name,"passed":bool(value),"detail":detail})
    def sigma_prime(t):
        if t<=0 or t>=1:
            return mp.mpf(0)
        if t>mp.mpf("0.5"):
            return sigma_prime(1-t)
        q=mp.exp(-1/t**2+1/(1-t)**2)
        return q/(1+q)**2*(2/t**3+2/(1-t)**3)
    nodes=[mp.mpf(0),mp.mpf(1)/16,mp.mpf(1)/4,mp.mpf(1)/2,
           mp.mpf(3)/4,mp.mpf(15)/16,mp.mpf(1)]
    def integrate(fn):
        return mp.quad(fn,nodes)
    def enclosed(value,record):
        denominator=mp.mpf(2)**record["denominatorPowerOfTwo"]
        low=mp.mpf(record["lowerNumerator"])/denominator
        high=mp.mpf(record["upperNumerator"])/denominator
        return low<=value<=high
    supports=[(mp.mpf(n),mp.mpf(n)+mp.mpf(1)/2) for n in range(9,14)]
    # The same unit-mass bump integral is independent of column and lambda.
    mass=integrate(sigma_prime)
    check("adaptive unit mass diagnostic",abs(mass-1)<mp.mpf("1e-150"),dec(mass-1))
    square=integrate(lambda t:2*sigma_prime(t)**2)
    base=[]
    for j,(left,right) in enumerate(supports):
        width=right-left
        half=integrate(lambda t:mp.sqrt(left+width*t)*sigma_prime(t))
        reciprocal_square=integrate(lambda t:sigma_prime(t)**2/(width*(left+width*t)))
        base.append((half,reciprocal_square))
        check(f"column {j} sqrt coefficient",enclosed(half,data["coefficientIntegrals"][j]["sqrt"]))
        check(f"column {j} square coefficient",enclosed(square,data["coefficientIntegrals"][j]["bumpSquared"]))
        check(f"column {j} reciprocal square coefficient",enclosed(reciprocal_square,data["coefficientIntegrals"][j]["bumpSquaredOverX"]))
    for label,lam in [("2^-200",mp.mpf(2)**-200),("2^-300",mp.mpf(2)**-300),("continuous limit only",mp.mpf(0))]:
        rows=[]
        for j,(left,right) in enumerate(supports):
            width=right-left
            w=integrate(lambda t:(-mp.log(left+width*t) if not lam else
                         mp.expm1(-lam*mp.log(left+width*t))/lam)*sigma_prime(t))
            minus_half=integrate(lambda t:(left+width*t)**(-mp.mpf(1)/2-lam)*sigma_prime(t))
            minus_three=integrate(lambda t:(left+width*t)**(-mp.mpf(3)/2-lam)*sigma_prime(t))
            for name,value in [("dividedLog",w),("minusHalfLambda",minus_half),("minusThreeHalvesLambda",minus_three)]:
                check(label+f" column {j} "+name,enclosed(value,data["coefficientIntegrals"][j][name]),dec(value))
            rows.append({"dividedLog":w,"minusHalfLambda":minus_half,"minusThreeHalvesLambda":minus_three})
        numerical.append({"lambdaCase":label,"originalSourceAllowed":bool(lam),
                          "values":[{k:dec(v) for k,v in row.items()} for row in rows]})
        if not lam:
            continue
        # Directly integrate the original physical moment densities, retaining
        # the near-cancelling J-M row. These are arbitrary positive-scale
        # algebra diagnostics, not a different claimed final profile.
        eta=mp.mpf(1)/3
        x0=mp.mpf(7)/3
        K=(mp.mpf(5)/7)/(1+eta**2)
        z=[mp.mpf(1)/10**8,-mp.mpf(1)/2/10**8,mp.mpf(3)/10**9,-mp.mpf(2)/10**9,mp.mpf(1)/10**9]
        moments=[mp.mpf(0) for _ in range(5)]
        for j,(left,right) in enumerate(supports):
            width=right-left
            def density(t,index):
                x=left+width*t
                X=x0*x
                bump=sigma_prime(t)/width
                e0=K*x**(-mp.mpf(1)/2-lam)
                u=K*lam*z[j]*bump if j<2 else mp.mpf(0)
                e=e0+(K*lam*z[j]*bump if j>=2 else mp.mpf(0))
                H=mp.sqrt(2*X)*e
                H0=mp.sqrt(2*X)*e0
                values=[u,H-H0,u*H,u**2-(e**2-e0**2)/2,(e**2-e0**2)/(2*X)]
                return values[index]*x0*width
            for k in range(5):
                # Identically zero densities are omitted only where the actual
                # disjoint support structure forces them to vanish.
                if (j<2 and k in (1,4)) or (j>=2 and k in (0,2)):
                    continue
                moments[k]+=integrate(lambda t,k=k:density(t,k))
        dM,dI,dJ,dS,dCp=moments
        normalized=[dM/(x0*K*lam),
                    (dJ/(mp.sqrt(2)*x0**mp.mpf("1.5")*K**2)-dM/(x0*K))/lam**2,
                    dI/(x0**mp.mpf("1.5")*K*lam),dS/(x0*K**2*lam),dCp/(K**2*lam)]
        reconstructed=[z[0]+z[1],sum(z[j]*rows[j]["dividedLog"] for j in range(2)),
                       mp.sqrt(2)*sum(z[j]*base[j][0] for j in range(2,5)),
                       -sum(z[j]*rows[j]["minusHalfLambda"] for j in range(2,5))
                       +lam*square*(sum(z[j]**2 for j in range(2))-sum(z[j]**2 for j in range(2,5))/2),
                       sum(z[j]*rows[j]["minusThreeHalvesLambda"] for j in range(2,5))
                       +lam*sum(z[j]**2*base[j][1] for j in range(2,5))/2]
        errors=[abs(x-y) for x,y in zip(normalized,reconstructed)]
        for k,error in enumerate(errors):
            check(label+f" original physical row {k} equals normalized map",error<mp.mpf("1e-65"),dec(error))
        numerical[-1]["physicalRowCrosscheck"]={"eta":"1/3","X0":"7/3","K":"(5/7)/(1+eta^2)",
                                              "normalized":list(map(dec,normalized)),"absoluteErrors":list(map(dec,errors))}
        print(json.dumps({"case":label,"maxPhysicalRowError":dec(max(errors))}),flush=True)
    report={"schema":"MathScope.SymbolicC2IndependentMpmathDiagnostic/1",
            "checkedUTC":datetime.now(timezone.utc).isoformat(),"certificateSHA256":sha(args.certificate),
            "scriptSHA256":sha(__file__),"mpmathVersion":mp.__version__,"mpmathInitSHA256":sha(mp.__file__),
            "precisionDecimalDigits":mp.mp.dps,"quadrature":"Independent adaptive mpmath quadrature over six fixed subintervals",
            "passed":all(x["passed"] for x in checks),"checksPassed":sum(x["passed"] for x in checks),
            "checksTotal":len(checks),"checks":checks,"numerical":numerical,"elapsedSeconds":monotonic()-start,
            "claimBoundary":{"numericalDiagnosticOnly":True,"originalLambdaIsNeverZero":True,
                             "incomingProfileDebtCertified":False,"fullProfileCertified":False,"formalLeanProof":False}}
    with args.output.open("x") as handle:
        json.dump(report,handle,indent=2)
        handle.write("\n")
    print(json.dumps({key:report[key] for key in ["passed","checksPassed","checksTotal","elapsedSeconds"]}))
    raise SystemExit(0 if report["passed"] else 1)


if __name__=="__main__":
    main()
