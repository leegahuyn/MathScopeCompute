#!/usr/bin/env python3
"""Independent exact-Fraction check of the fresh B.8 mu=h^2 operator."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from fractions import Fraction as F
import json
from pathlib import Path

from verify_certificate import (BASE, NAVIER, sha, rat, interval, contains, mm,
    sub, norm, mul, power, exp_negative_point, encode)

EXPECTED="0a2c375dfdd09d7aa90a0275a8697eb3eb073bf4a9b81e1f862af2ba8ed20f07"


def verify(path):
    data=json.loads(path.read_text())
    checks=[]
    def check(name,value,detail=None):
        checks.append({"name":name,"passed":bool(value),"detail":detail})
    check("fresh B8 certificate bytes",sha(path)==EXPECTED)
    check("fresh B8 producer bytes",sha(BASE/"certify_symbolic_b8.py")==data["arithmetic"]["implementationSHA256"])
    check("same new C2 binding source bytes",sha(BASE/"certify_symbolic_c2.py")
          ==data["arithmetic"]["c2SupportAndBindingCodeSHA256"])
    for name,expected in data["arithmetic"]["dependencies"].items():
        check("arithmetic pin "+name,sha(NAVIER/"followup-next/uniform-gluing"/name)==expected)
    check("same exact outer parameter tree",data["source"]["parameterTreeSHA256"]
          =="38e23d037f8b75eaeb30448a815689e92171926d47787196c7c5395fe98425a8")
    supports=[tuple(map(rat,x)) for x in data["geometry"]["supports"]]
    check("fresh exact half-dyadic supports",supports==[(F(n,2048),F(2*n+1,4096)) for n in range(6,11)])
    check("all five supports disjoint",all(supports[j][1]<supports[j+1][0] for j in range(4)))
    check("support lies in original B8 logarithmic patch",supports[0][0]>exp_negative_point(6)[1]
          and supports[-1][1]<exp_negative_point(5)[0])
    check("unnormalized step derivative bump masses",list(map(rat,data["geometry"]["integralMass"]))
          ==[b-a for a,b in supports] and data["geometry"]["unitMass"] is False)
    linear=[[interval(x) for x in row] for row in data["linearMap"]]
    quadratic=[[interval(x) for x in row] for row in data["quadraticDiagonal"]]
    check("exact U mass row",all(linear[0][j]==interval(supports[j][1]-supports[j][0]) for j in range(2)))
    check("correct separated U and E blocks",all(linear[i][j]==interval(0)
          for i in range(5) for j in range(5) if (i<2)!=(j<2)))
    check("only original S and Cp have quadratic coefficients",all(quadratic[i][j]==interval(0)
          for i in range(3) for j in range(5)) and all(quadratic[4][j]==interval(0) for j in range(2)))
    for kind,indices in [("U",range(2)),("E",range(2,5))]:
        indices=list(indices)
        A=[[linear[i][j] for j in indices] for i in indices]
        saved=data["inverse"+kind]
        exact=[[interval(rat(x)) for x in row] for row in saved["exact"]]
        rounded=[[interval(x) for x in row] for row in saved["interval"]]
        midpoint=[[interval((x[0]+x[1])/2) for x in row] for row in A]
        check(kind+" exact midpoint inverse",mm(exact,midpoint)
              ==[[interval(int(i==j)) for j in range(len(indices))] for i in range(len(indices))])
        check(kind+" inverse intervals contain exact fractions",all(contains(rounded[i][j],exact[i][j])
              for i in range(len(indices)) for j in range(len(indices))))
        product=mm(rounded,A)
        residual=[[sub(interval(int(i==j)),product[i][j]) for j in range(len(indices))] for i in range(len(indices))]
        saved_residual=[[interval(x) for x in row] for row in saved["residual"]]
        check(kind+" residual encloses independent rational arithmetic",all(contains(saved_residual[i][j],residual[i][j])
              for i in range(len(indices)) for j in range(len(indices))))
        z=rat(saved["z"])
        check(kind+" residual norm and inverse bound",norm(saved_residual)==z<1
              and rat(saved["inverse_bound"])==norm(rounded)/(1-z))
    preconditioner=[[interval(x) for x in row] for row in data["inverseE"]["interval"]]
    for kind,cols in [("U",range(2)),("E",range(2,5))]:
        q=[[quadratic[i][j] for j in cols] for i in range(2,5)]
        prod=mm(preconditioner,q)
        saved=[[interval(x) for x in row] for row in data["preconditionedQuadratic"+kind]]
        check("quadratic "+kind+" product and norm",all(contains(saved[i][j],prod[i][j])
              for i in range(3) for j in range(len(list(cols)))) and norm(saved)==rat(data["bounds"]["B"+kind]))
    b={key:rat(value) for key,value in data["bounds"].items()}
    mu,ru,re,beta=b["muUpper"],b["uRadius"],b["eRadius"],b["allowedPreconditionedScaledDebtPerDerivative0To2"]
    zu,ze=rat(data["inverseU"]["z"]),rat(data["inverseE"]["z"])
    bu,be=b["BU"],b["BE"]
    check("positive mu upper and symbolic h square",mu==F(1,2**400)>0
          and data["source"]["scaleExpression"]=="mu=h^2=exp(-16004*T)>0")
    check("strict U self map",b["uImage"]==beta+zu*ru<ru)
    check("strict E self map",b["eImage"]==beta+mu*bu*ru**2+ze*re+mu*be*re**2<re)
    lip=ze+2*mu*be*re
    check("E contraction",b["eContraction"]==lip<1)
    u1=beta/(1-zu)
    e1=(beta+2*mu*bu*ru*u1)/(1-lip)
    u2=u1
    e2=(beta+2*mu*bu*(u1*u1+ru*u2)+2*mu*be*e1*e1)/(1-lip)
    for key,val,radius in [("uEtaDerivative1",u1,ru),("eEtaDerivative1",e1,re),
                           ("uEtaDerivative2",u2,ru),("eEtaDerivative2",e2,re)]:
        check(key,b[key]==val<radius)
    emin=b["positiveEOverK"]+mu*re*b["bumpSupremum"]
    check("positive field minimum from exact tenth-power comparison",emin>0
          and emin**10<=supports[0][0] and b["positiveEOverK"]>0)
    da=max(2*re*(right*b["bumpDerivativeSupremum"]/(right-left)+F(1,10)*b["bumpSupremum"])
           /b["positiveEOverK"] for left,right in supports[2:])
    db=max(2*right*ru*b["bumpDerivativeSupremum"]/(right-left)/emin for left,right in supports[:2])
    check("exact mu-scaled radial shear",b["radialShearErrorOverMu"]==da<F(1,4))
    check("exact mu-scaled axial shear",b["axialShearErrorOverMu"]==db<F(1,4))
    # Conservative independent thresholds use the separately verified global
    # sigma' < 9 and |sigma''| < 128, and the elementary E0/K > 1/2.
    check("independent elementary base minimum",F(1,2)**10<supports[0][0])
    pos=F(1,2)-mu*re*9
    conservative_da=max(2*re*(right*128/(right-left)+F(1,10)*9)/pos for left,right in supports[2:])
    conservative_db=max(2*right*ru*128/(right-left)/F(1,2) for left,right in supports[:2])
    check("independent conservative shear bounds",pos>0 and conservative_da<F(1,4) and conservative_db<F(1,4))
    check("scaled debt derivative meaning explicit","K(eta), c(eta)" in data["normalization"]["etaDerivativeMeaning"])
    check("actual source debt and formal completion remain open",all(data["claimBoundary"][key] is False for key in
          ["actualIncomingAxisDebtCertified","fullProfileCertified","formalLeanProof"]))
    return {"schema":"MathScope.SymbolicB8IndependentFractionReview/1","checkedUTC":datetime.now(timezone.utc).isoformat(),
            "certificateSHA256":sha(path),"verifierSHA256":sha(__file__),"sharedIndependentVerifierSHA256":sha(Path(__file__).with_name("verify_certificate.py")),
            "passed":all(x["passed"] for x in checks),"checksPassed":sum(x["passed"] for x in checks),"checksTotal":len(checks),"checks":checks,
            "independentConservativeBounds":{"positiveEOverK":pos,"radialShearErrorOverMu":conservative_da,"axialShearErrorOverMu":conservative_db},
            "claimBoundary":{"matrixAndScalarBoundsVerified":True,"sameActualIncomingAxisDebtCertified":False,"fullProfileCertified":False},
            "scope":"Independent Fraction audit of the newly recomputed B8 map with positive mu=h^2. Original moments use J-cI and S-2cM before division by mu; derivatives include all K and c factors. The actual continuation debt remains absent."}


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--certificate",type=Path,default=BASE/"attempts/b8-0001/certificate.json")
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    result=verify(args.certificate)
    with args.output.open("x") as stream:
        json.dump(encode(result),stream,indent=2)
        stream.write("\n")
    print(json.dumps({key:result[key] for key in ["passed","checksPassed","checksTotal"]}))
    for check in result["checks"]:
        if not check["passed"]:
            print("FAILED:",check["name"])
    raise SystemExit(0 if result["passed"] else 1)
