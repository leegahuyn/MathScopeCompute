"""Refine the normalized measure of the original initialized moving annulus."""

from argparse import ArgumentParser
from fractions import Fraction as F
from functools import lru_cache
from hashlib import sha256
from pathlib import Path
import json


H_MAX = F(1, 64)
LOG_TERMS = 9
LOG_UNITS = 2**20
MEASURE_SOURCE_PIN = "ca68dc8805e20402773ff1ebb6dd8c311c01d4d188390876e17006383c6d274b"


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


@lru_cache(maxsize=None)
def log_bracket(s):
    assert F(1, 2) <= s <= F(3, 2)
    y = (s - 1) / (s + 1)
    epsilon = 2 * F(1, 3)**(2 * LOG_TERMS + 1) / ((2 * LOG_TERMS + 1) * F(8, 9))
    center = 2 * sum(y**(2*k+1) / (2*k+1) for k in range(LOG_TERMS))
    lower = (LOG_UNITS * (center - epsilon)).__floor__()
    upper = (LOG_UNITS * (center + epsilon)).__ceil__()
    return F(lower, LOG_UNITS), F(upper, LOG_UNITS)


def cell(rho0, rho1, u0, u1):
    if rho0 == rho1:
        assert rho0 == F(1, 2)
        mass_rho, first_rho = F(1), rho0
    else:
        mass_rho = rho1 - rho0
        first_rho = (rho1**2-rho0**2)/2
    b = mass_rho * (u1**3-u0**3)/6
    j = (u1-u0) * first_rho + b
    sqlo = 0 if u0 <= 0 <= u1 else min(u0*u0,u1*u1)
    sqhi = max(u0*u0,u1*u1)
    s_lo, s_hi = rho0 + sqlo/2, rho1 + sqhi/2
    # The normalized interval is j + h*[aLo,aHi] + h^2*[-e,e].
    return j, b, 2 * b * log_bracket(s_lo)[0], 2 * b * log_bracket(s_hi)[1], 9 * b


def subdivision(level, final):
    n = 2**level
    angular = [F(2*i,n)-1 for i in range(n+1)]
    rho = [F(1, 2)]*2 if final else [F(1,2)+F(i,2*n) for i in range(n+1)]
    cells = [cell(rl, rr, ul, ur) for rl,rr in zip(rho,rho[1:])
             for ul,ur in zip(angular,angular[1:])]
    return tuple(map(sum,zip(*cells))), len(cells)


def no_wider_than_previous(current, previous):
    j,b,lo,hi,e = current
    p_j,p_b,p_lo,p_hi,p_e = previous
    assert (j,b,e) == (p_j,p_b,p_e)
    assert p_lo <= lo <= hi <= p_hi


def run():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--measure-source", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    assert digest(args.measure_source) == MEASURE_SOURCE_PIN
    old = json.loads(args.measure_source.read_bytes())
    totals = {}
    for label,final in (("finalSlice",True),("fullSlab",False)):
        prior = None
        history = []
        for level in range(7):
            values,n = subdivision(level,final)
            if prior is not None:
                no_wider_than_previous(values, prior)
            prior = values
            j,b,lo,hi,e = values
            expect = (F(4,3),F(1,3)) if final else (F(11,12),F(1,6))
            assert (j,b) == expect
            # Each new bracket is strictly within the historical one
            # throughout 0<h<1/64, proved at the outer positive endpoint.
            tightened_lo = lo - e * H_MAX
            tightened_hi = hi + e * H_MAX
            assert -2*b < tightened_lo < tightened_hi < 4*b
            ratio = (tightened_hi-tightened_lo)/(6*b)
            history.append({"level":level,"cells":n,"j":str(j),"b":str(b),
                            "hLowerCoefficient":str(lo),"hUpperCoefficient":str(hi),
                            "hSquaredErrorCoefficient":str(e),
                            "worstWidthRatioToHistorical":str(ratio)})
        totals[label] = history
    result = {"status":"VERIFIED_ORIGINAL_MOVING_ANNULUS_WEIGHT_ONLY",
              "originalMeasureReceiptSHA256":MEASURE_SOURCE_PIN,
              "originalMeasureSchema":old.get("schema"),
              "coefficientDefinition":"I_Q in [j + h*aLo - h^2*e, j + h*aHi + h^2*e]",
              "commonFactor":"sqrt(2)*pi*tau0*(Xb-Xa)",
              "hAssumption":"0 < h < 1/64","levels":totals,
              "annularFinalFieldIntegrands":"OPEN","N7-06":"OPEN","N8-05":"OPEN",
              "finalJets":0,"release":"HOLD"}
    args.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:{z:v[-1][z] for z in ("cells","worstWidthRatioToHistorical")} for k,v in totals.items()}))


if __name__ == "__main__":
    run()
