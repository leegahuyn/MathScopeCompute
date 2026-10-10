#!/usr/bin/env python3
"""Independent Fraction audit of the symbolic C.2 certificate.

No producer or dyadic arithmetic module is imported. Exact rational interval
operations check the recorded matrix/implicit estimates. A separate decimal
rational enclosure of the smooth step proves conservative derivative and shear
bounds. This does not manufacture the still-missing incoming profile debt.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from fractions import Fraction as F
from functools import lru_cache
import hashlib
import json
from math import isqrt
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE.parent
NAVIER = BASE.parent
EXPECTED_CERT = "a76539a30b9900a0275f2cfb25948c5aa13f222e3e578d3d5fb1f81617bccbe7"
DECIMAL_SCALE = 10**60


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def rat(value):
    return F(int(value["numerator"]), int(value["denominator"]))


def interval(value):
    if isinstance(value, dict) and "lowerNumerator" in value:
        scale = 2**value["denominatorPowerOfTwo"]
        return F(int(value["lowerNumerator"]), scale), F(int(value["upperNumerator"]), scale)
    value = F(value)
    return value, value


def add(a, b):
    return a[0]+b[0], a[1]+b[1]


def neg(a):
    return -a[1], -a[0]


def sub(a, b):
    return add(a, neg(b))


def mul(a, b):
    products = [x*y for x in a for y in b]
    return min(products), max(products)


def inv(a):
    if a[0] <= 0 <= a[1]:
        raise ValueError("Zero denominator interval")
    return F(1)/a[1], F(1)/a[0]


def div(a, b):
    return mul(a, inv(b))


def power(a, n):
    if n < 0:
        return inv(power(a, -n))
    if n == 0:
        return interval(1)
    if n % 2 == 0 and a[0] <= 0 <= a[1]:
        return F(0), max(abs(a[0]), abs(a[1]))**n
    ends = [x**n for x in a]
    return min(ends), max(ends)


def absmax(a):
    return max(abs(a[0]), abs(a[1]))


def contains(a, b):
    return a[0] <= b[0] <= b[1] <= a[1]


def mm(a, b):
    return [[sum_intervals(mul(a[i][k], b[k][j]) for k in range(len(b)))
             for j in range(len(b[0]))] for i in range(len(a))]


def sum_intervals(values):
    value = interval(0)
    for item in values:
        value = add(value, item)
    return value


def norm(matrix):
    return max(sum(absmax(x) for x in row) for row in matrix)


def round_decimal(a):
    low = (a[0] * DECIMAL_SCALE).__floor__()
    high = (a[1] * DECIMAL_SCALE).__ceil__()
    return F(low, DECIMAL_SCALE), F(high, DECIMAL_SCALE)


def exp_negative_point(x):
    """Independent exact Taylor/geometric-tail enclosure, rounded in base ten."""
    x = F(x)
    if x < 0:
        raise ValueError("Negative exponential argument")
    if x >= 200:
        assert 2**200 > DECIMAL_SCALE
        return F(0), F(1, DECIMAL_SCALE)
    reductions = 0
    while x > F(1, 8):
        x /= 2
        reductions += 1
    term = total = F(1)
    for k in range(1, 41):
        term *= x/k
        total += term
    omitted = term*x/41
    tail = omitted/(1-x/42)
    result = round_decimal((1/(total+tail), 1/total))
    for _ in range(reductions):
        result = round_decimal(power(result, 2))
    return result


@lru_cache(maxsize=None)
def sigma_point(t):
    t = F(t)
    if t <= 0:
        return interval(0)
    if t >= 1:
        return interval(1)
    if t > F(1, 2):
        return sub(interval(1), sigma_point(1-t))
    exp = exp_negative_point(1/t**2-1/(1-t)**2)
    return round_decimal((exp[0]/(1+exp[0]), exp[1]/(1+exp[1])))


def step_derivatives(left, right):
    """Whole-cell first and second derivative bounds, independent of the producer."""
    left, right = F(left), F(right)
    if left >= F(1, 2):
        first, second = step_derivatives(1-right, 1-left)
        return first, neg(second)
    if right > F(1, 2):
        first_a, second_a = step_derivatives(left, F(1, 2))
        first_b, second_b = step_derivatives(F(1, 2), right)
        return ((min(first_a[0],first_b[0]),max(first_a[1],first_b[1])),
                (min(second_a[0],second_b[0]),max(second_a[1],second_b[1])))
    if left == 0:
        exp = exp_negative_point(1/right**2-4)
        first_hi = 4/right**3*exp[1]
        second_hi = (16/right**6+12/right**4)*exp[1]
        return (F(0),first_hi),(-second_hi,second_hi)
    t = left,right
    s = sigma_point(left)[0],sigma_point(right)[1]
    one_minus_t = sub(interval(1),t)
    s_product = mul(s,sub(interval(1),s))
    zp = add(mul(interval(2),power(t,-3)),mul(interval(2),power(one_minus_t,-3)))
    zpp = add(mul(interval(-6),power(t,-4)),mul(interval(6),power(one_minus_t,-4)))
    first = mul(s_product,zp)
    second = add(mul(mul(first,sub(interval(1),mul(interval(2),s))),zp),mul(s_product,zpp))
    return first,second


def sqrt_enclosure(value, bits=96):
    value = F(value)
    scale = 2**bits
    low = isqrt((value*scale**2).__floor__())
    return F(low,scale), F(low+1,scale)


def encode(value):
    if isinstance(value,F):
        return {"numerator":str(value.numerator),"denominator":str(value.denominator),"approximate":float(value)}
    if isinstance(value,dict):
        return {key:encode(item) for key,item in value.items()}
    if isinstance(value,(tuple,list)):
        return [encode(item) for item in value]
    return value


def verify(certificate):
    data = json.loads(certificate.read_text())
    checks = []
    def check(name, condition, details=None):
        checks.append({"name":name,"passed":bool(condition),"details":details})
    check("certificate immutable bytes",sha(certificate)==EXPECTED_CERT)
    check("producer source bound",sha(BASE/"certify_symbolic_c2.py")==data["arithmetic"]["implementationSHA256"])
    for name,expected in data["arithmetic"]["dependencies"].items():
        check("pinned arithmetic bytes "+name,sha(NAVIER/"followup-next/uniform-gluing"/name)==expected)
    canonical = json.dumps(data["source"]["parameterExpressions"],sort_keys=True,separators=(",",":")).encode()
    check("same symbolic positive parameter tree",hashlib.sha256(canonical).hexdigest()
          ==data["source"]["parameterTreeSHA256"]=="38e23d037f8b75eaeb30448a815689e92171926d47787196c7c5395fe98425a8")
    lam = rat(data["source"]["lambdaUpper"])
    check("strictly positive admissible lambda upper",lam==F(1,2**200)>0)
    supports = [tuple(map(rat,s)) for s in data["geometry"]["supports"]]
    check("five exact separated half-width supports",supports==[(F(n),F(2*n+1,2)) for n in range(9,14)]
          and all(supports[j][1]<supports[j+1][0] for j in range(4)))
    check("reserved geometry",supports[0][0]>8 and supports[-1][1]<16
          and supports[-1][1]<2**5 and 60*1000*128>25)
    linear = [[interval(x) for x in row] for row in data["linearMap"]]
    quadratic = [[interval(x) for x in row] for row in data["quadraticDiagonal"]]
    root2 = sqrt_enclosure(2,88)
    for j,c in enumerate(data["coefficientIntegrals"]):
        check(f"bump {j} exact unit mass",interval(c["mass"])==interval(1))
        expected_a = [interval(0)]*5
        expected_q = [interval(0)]*5
        if j<2:
            expected_a[0]=interval(1)
            expected_a[1]=interval(c["dividedLog"])
            expected_q[3]=interval(c["bumpSquared"])
        else:
            expected_a[2]=mul(root2,interval(c["sqrt"]))
            expected_a[3]=neg(interval(c["minusHalfLambda"]))
            expected_a[4]=interval(c["minusThreeHalvesLambda"])
            expected_q[3]=mul(interval(-F(1,2)),interval(c["bumpSquared"]))
            expected_q[4]=mul(interval(F(1,2)),interval(c["bumpSquaredOverX"]))
        check(f"column {j} exact original moment linear coefficients",all(contains(linear[i][j],expected_a[i]) for i in range(5)))
        check(f"column {j} exact original moment quadratic coefficients",all(contains(quadratic[i][j],expected_q[i]) for i in range(5)))
    for kind,indices in [("U",range(2)),("E",range(2,5))]:
        idx=list(indices)
        matrix=[[linear[i][j] for j in idx] for i in idx]
        saved=data["inverse"+kind]
        exact=[[rat(x) for x in row] for row in saved["preconditioner"]]
        R=[[interval(x) for x in row] for row in exact]
        encR=[[interval(x) for x in row] for row in saved["enclosedPreconditioner"]]
        mid=[[interval((x[0]+x[1])/2) for x in row] for row in matrix]
        check(kind+" exact preconditioner is midpoint inverse",mm(R,mid)
              ==[[interval(int(i==j)) for j in range(len(idx))] for i in range(len(idx))])
        check(kind+" preconditioner rounding encloses exact fractions",all(contains(encR[i][j],R[i][j])
              for i in range(len(idx)) for j in range(len(idx))))
        RA=mm(encR,matrix)
        residual=[[sub(interval(int(i==j)),RA[i][j]) for j in range(len(idx))] for i in range(len(idx))]
        saved_residual=[[interval(x) for x in row] for row in saved["residual"]]
        check(kind+" saved residual covers independent rational product",all(contains(saved_residual[i][j],residual[i][j])
              for i in range(len(idx)) for j in range(len(idx))))
        z=rat(saved["residualNorm"])
        check(kind+" residual norm",norm(saved_residual)==z and norm(residual)<=z<1)
        check(kind+" inverse bound",rat(saved["preconditionerNorm"])==norm(encR)
              and rat(saved["inverseNormBound"])==norm(encR)/(1-z))
    re_matrix=[[interval(x) for x in row] for row in data["inverseE"]["enclosedPreconditioner"]]
    for kind,columns in [("U",range(2)),("E",range(2,5))]:
        q=[[quadratic[i][j] for j in columns] for i in range(2,5)]
        recomputed=mm(re_matrix,q)
        saved=[[interval(x) for x in row] for row in data["preconditionedQuadratic"+kind]]
        check("quadratic "+kind+" interval product",all(contains(saved[i][j],recomputed[i][j])
              for i in range(3) for j in range(len(list(columns)))))
        check("quadratic "+kind+" norm",norm(saved)==rat(data["bounds"]["B"+kind]))
    b={key:rat(value) for key,value in data["bounds"].items()}
    ru,re,beta=b["scaledURadius"],b["scaledERadius"],b["allowedPreconditionedDebtPerEtaDerivativeOrder0To2"]
    zu,ze=rat(data["inverseU"]["residualNorm"]),rat(data["inverseE"]["residualNorm"])
    bu,be=b["BU"],b["BE"]
    check("inclusion radii and allowed scaled debt",ru==re==F(1,10**6) and beta==F(1,10**8))
    check("U strict self map",b["uImage"]==beta+zu*ru<ru)
    check("E strict self map",b["eImage"]==beta+lam*bu*ru**2+ze*re+lam*be*re**2<re)
    lip=ze+2*lam*be*re
    check("E contraction after solving U",b["eContraction"]==lip<1)
    up=beta/(1-zu)
    ep=(beta+2*lam*bu*ru*up)/(1-lip)
    upp=up
    epp=(beta+2*lam*bu*(up**2+ru*upp)+2*lam*be*ep**2)/(1-lip)
    for key,expected,radius in [("uEtaDerivative1",up,ru),("eEtaDerivative1",ep,re),
                                ("uEtaDerivative2",upp,ru),("eEtaDerivative2",epp,re)]:
        check("implicit "+key,b[key]==expected<radius)
    # The same conclusion is independently stronger than an ordinary joint
    # contraction requirement in the maximum norm; the producer uses a block solve.
    check("full block map also contracts",max(zu,ze+2*lam*bu*ru+2*lam*be*re)<1)
    emin=b["positiveEOverK"]+lam*b["eCorrectionOverKLambda"]
    conservative_emin=(1-5*lam)/sqrt_enclosure(supports[-1][1])[1]
    check("recorded E minimum conservative without evaluating tiny lambda",0<emin<=conservative_emin)
    check("recorded positive E correction",b["eCorrectionOverKLambda"]==2*re*b["bumpSupremum"]
          and b["positiveEOverK"]==emin-lam*b["eCorrectionOverKLambda"]>0)
    saved_da=max(2*re*(right*b["bumpDerivativeSupremum"]/(right-left)**2
                 +(F(1,2)+lam)*b["bumpSupremum"]/(right-left))/b["positiveEOverK"]
                 for left,right in supports[2:])
    saved_db=max(2*right*ru*b["bumpDerivativeSupremum"]/(right-left)**2/emin
                 for left,right in supports[:2])
    check("reported radial shear formula",saved_da==b["radialShearErrorOverLambda"]<F(1,4))
    check("reported axial shear formula",saved_db==b["axialShearErrorOverLambda"]<F(1,4))
    # Independently enclose sigma derivatives on a different 256-cell grid.
    grid=[F(0)]+[F(n,256) for n in range(16,241)]+[F(1)]
    derivatives=[step_derivatives(a,c) for a,c in zip(grid,grid[1:])]
    d1=max(item[0][1] for item in derivatives)
    d2=max(absmax(item[1]) for item in derivatives)
    check("independent whole-cell sigma prime below 9",d1<9)
    check("independent whole-cell sigma second below 128",d2<128)
    pos=conservative_emin-2*lam*re*9
    da=max(2*re*(right*128/(right-left)**2+(F(1,2)+lam)*9/(right-left))/pos for left,right in supports[2:])
    db=max(2*right*ru*128/(right-left)**2/conservative_emin for left,right in supports[:2])
    check("independent positive E",pos>0)
    check("independent radial shear below lambda over four",da<F(1,4))
    check("independent axial shear below lambda over four",db<F(1,4))
    check("independent strict base shear remains above two",da<2)
    check("open profile debts kept open",all(data["claimBoundary"][key] is False for key in
          ["actualModulationIncomingDebtEnclosed","infiniteAxisConstructedHere","fullProfileCertified","formalLeanProof"]))
    return {"schema":"MathScope.SymbolicC2IndependentFractionReview/1",
            "checkedUTC":datetime.now(timezone.utc).isoformat(),"certificateSHA256":sha(certificate),
            "verifierSHA256":sha(__file__),"passed":all(x["passed"] for x in checks),
            "checksPassed":sum(x["passed"] for x in checks),"checksTotal":len(checks),"checks":checks,
            "independentStepMethod":{"gridDenominator":256,"cells":len(derivatives),"decimalRoundingDigits":60,
            "taylorDegree":40,"positiveGeometricTailRetained":True,"sigmaPrimeUpper":d1,"sigmaSecondAbsUpper":d2},
            "independentShear":{"positiveEOverK":pos,"radialErrorOverLambda":da,"axialErrorOverLambda":db},
            "claimBoundary":{"originalMomentRowsReviewedSeparately":True,"incomingScaledDebtEnclosed":False,
                             "fullProfileCertified":False,"formalLeanProof":False},
            "scope":"Exact independent Fraction checks of matrix and implicit bounds plus a separate whole-cell derivative/shear enclosure. Continuous moment coefficient construction is reviewed in REVIEW.md and cross-checked numerically, not reclassified as a source-specific incoming debt proof."}


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--certificate",type=Path,default=BASE/"attempts/0001/certificate.json")
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    report=verify(args.certificate)
    with args.output.open("x") as handle:
        json.dump(encode(report),handle,indent=2)
        handle.write("\n")
    print(json.dumps({key:report[key] for key in ["passed","checksPassed","checksTotal"]}))
    for item in report["checks"]:
        if not item["passed"]:
            print("FAILED:",item["name"])
    raise SystemExit(0 if report["passed"] else 1)
