#!/usr/bin/env python3
"""Independent Fraction algebra + high-precision integral cross-check.

The certificate's enclosure proof is its outward Stieltjes construction. This
separate verifier checks the finite inclusion inequalities exactly, then uses a
different 80-digit integration route to catch formula or normalization defects.
High-precision agreement is never substituted for the enclosure proof.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / "arithmetic/vendor"))
import mpmath as mp


def q(v):
    return F(int(v["numerator"]), int(v["denominator"]))


def box(v):
    s = 1 << v["denominatorPowerOfTwo"]
    return F(int(v["lowerNumerator"]), s), F(int(v["upperNumerator"]), s)


def add(a, b):
    return a[0] + b[0], a[1] + b[1]


def mul(a, b):
    values = [x*y for x in a for y in b]
    return min(values), max(values)


def absolute_upper(a):
    return max(abs(a[0]), abs(a[1]))


def multiply(r, a):
    return [[sum_boxes(mul((r[i][k], r[i][k]), a[k][j]) for k in range(len(a)))
             for j in range(len(a[0]))] for i in range(len(r))]


def sum_boxes(values):
    total = (F(0), F(0))
    for v in values:
        total = add(total, v)
    return total


def norm(a):
    return max(sum(absolute_upper(v) for v in row) for row in a)


def finite_check(record):
    linear = [[box(v) for v in row] for row in record["linearMap"]]
    quad = [[box(v) for v in row] for row in record["quadraticDiagonal"]]
    ru = [[q(v) for v in row] for row in record["exactPreconditionerU"]]
    re = [[q(v) for v in row] for row in record["exactPreconditionerE"]]
    au = [[linear[i][j] for j in range(2)] for i in range(2)]
    ae = [[linear[i][j] for j in range(2,5)] for i in range(2,5)]
    residuals = []
    for r, a in [(ru,au),(re,ae)]:
        prod = multiply(r, a)
        residuals.append(norm([[(F(int(i==j))-v[1],F(int(i==j))-v[0])
                               for j,v in enumerate(row)] for i,row in enumerate(prod)]))
    zu, ze = residuals
    bu = norm(multiply(re, [[quad[i][j] for j in range(2)] for i in range(2,5)]))
    be = norm(multiply(re, [[quad[i][j] for j in range(2,5)] for i in range(2,5)]))
    data = record["nonlinearBounds"]
    u,e=q(data["uRadius"]),q(data["eRadius"])
    beta_u,beta_e=q(data["allowedPreconditionedDebtU"]),q(data["allowedPreconditionedDebtE"])
    image_u=beta_u+zu*u
    image_e=beta_e+bu*u*u+ze*e+be*e*e
    contraction=ze+2*be*e
    checks={
        "U inverse Neumann bound":zu < 1,
        "E inverse Neumann bound":ze < 1,
        "recorded U inverse residual is an upper bound":zu<=q(record["inverseResidualNormU"]),
        "recorded E inverse residual is an upper bound":ze<=q(record["inverseResidualNormE"]),
        "U ball strict inclusion":image_u<u,
        "E ball strict inclusion":image_e<e,
        "E contraction strict":contraction<1,
        "recorded U image bound encloses recomputation":image_u<=q(data["uImageRadius"]),
        "recorded E image bound encloses recomputation":image_e<=q(data["eImageRadius"]),
        "recorded contraction encloses recomputation":contraction<=q(data["eContractionFactor"]),
        "whole source eta is not promoted":record["scope"]["wholeSourceEtaDebtCertified"] is False,
        "whole cone is not promoted":record["scope"]["finalProfileConeCertified"] is False,
        "new kernel proof is not fabricated":record["scope"]["newLeanKernelProof"] is False,
    }
    return checks


def mpq(value):
    value=F(value)
    return mp.mpf(value.numerator)/value.denominator


def mp_bump(t):
    if t<=0 or t>=1:
        return mp.mpf(0)
    z=-1/t**2+1/(1-t)**2
    if z>0:
        e=mp.exp(-z)
        return e/(1+e)**2*(2/t**3+2/(1-t)**3)
    e=mp.exp(z)
    return e/(1+e)**2*(2/t**3+2/(1-t)**3)


def integral_check(record):
    mp.mp.dps=80
    alpha=mpq(q(record["geometry"]["alpha"]))
    supports=[[mpq(q(v)) for v in s] for s in record["geometry"]["supports"]]
    split=[0,mp.mpf(1)/16,mp.mpf(1)/4,mp.mpf(1)/2,mp.mpf(3)/4,mp.mpf(15)/16,1]
    checks={}
    refs=[]
    for j,(a,b) in enumerate(supports):
        width=b-a
        factor=1/width if record["geometry"]["unitMass"] else 1
        powers=[mp.mpf(0),alpha+mp.mpf('.5'),mp.mpf('.5'),alpha,alpha-1]
        actual_l=[mp.mpf(0)]*5
        actual_q=[mp.mpf(0)]*5
        rows=[0,1] if j<2 else [2,3,4]
        for row in rows:
            value=mp.quad(lambda t:(a+width*t)**powers[row]*mp_bump(t)*width*factor,split)
            actual_l[row]=value*(mp.sqrt(2) if row in [1,2] else -1 if row==3 else 1)
        square=mp.quad(lambda t:mp_bump(t)**2*width*factor**2,split)
        actual_q[3]=square if j<2 else -square/2
        if j>=2:
            actual_q[4]=mp.quad(lambda t:mp_bump(t)**2/(a+width*t)*width*factor**2/2,split)
        for name,values,key in [("L",actual_l,"linearMap"),("Q",actual_q,"quadraticDiagonal")]:
            for row,value in enumerate(values):
                lo,hi=box(record[key][row][j])
                checks[f"{name}[{row},{j}] independent 80-digit integral inside enclosure"]=(mpq(lo)<=value<=mpq(hi))
        refs.append(dict(column=j,linear=[mp.nstr(v,72) for v in actual_l],quadratic=[mp.nstr(v,72) for v in actual_q]))
    return checks,refs


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--certificate",type=Path,default=HERE/"uniform-moment-certificate.json")
    ap.add_argument("--output",type=Path,default=HERE/"uniform-moment-independent.json")
    args=ap.parse_args()
    certificate=json.loads(args.certificate.read_text())
    results=[]
    for record in certificate["results"]:
        checks=finite_check(record)
        more,refs=integral_check(record)
        checks.update(more)
        print(record["name"],sum(checks.values()),"/",len(checks),flush=True)
        results.append(dict(name=record["name"],passed=sum(checks.values()),total=len(checks),checks=checks,independentValues=refs))
    payload=dict(schema="MathScope.UniformMomentIndependent/1",certificateSHA256=hashlib.sha256(args.certificate.read_bytes()).hexdigest(),
                 sourceSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                 passed=sum(r["passed"] for r in results),total=sum(r["total"] for r in results),results=results,
                 scope="Exact Fraction verification of inclusion inequalities, plus independent 80-digit cross-checks of continuous coefficients; this does not bind missing whole-profile source debts.")
    args.output.write_text(json.dumps(payload,indent=2)+"\n")
    raise SystemExit(0 if payload["passed"]==payload["total"] else 1)


if __name__=="__main__":
    main()
