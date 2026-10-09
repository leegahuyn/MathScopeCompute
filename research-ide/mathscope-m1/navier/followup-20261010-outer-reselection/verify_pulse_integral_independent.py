#!/usr/bin/env python3
"""Independent high-precision diagnostic plus exact certificate endpoint checks.

Gauss-Legendre agreement is diagnostic. The outward whole-cell certificate,
not this floating-point quadrature, supplies the integral enclosure proof.
"""
from __future__ import annotations

import hashlib
import json
import sys
from fractions import Fraction as F
from pathlib import Path

HERE=Path(__file__).resolve().parent


def endpoints(record):
    den=1 << record["denominatorPowerOfTwo"]
    return F(int(record["lowerNumerator"]),den),F(int(record["upperNumerator"]),den)


def exact_checks(record):
    amp_lo,amp_hi=endpoints(record["uniformAmplitude"]["bracket"])
    square_lo,square_hi=endpoints(record["uniformAmplitude"]["squaredBracket"])
    k_lo,k_hi=endpoints(record["integrals"]["Kb"])
    b_lo,b_hi=endpoints(record["integrals"]["beginning"])
    m_lo,m_hi=endpoints(record["integrals"]["middle"])
    c_lo,c_hi=endpoints(record["integrals"]["cutoff"])
    return {
        "positive_all_three_integrals":min(b_lo,m_lo,c_lo)>0,
        "total_lower_is_not_above_sum":k_lo<=b_lo+m_lo+c_lo,
        "total_upper_is_not_below_sum":k_hi>=b_hi+m_hi+c_hi,
        "source_Kb_bracket":F(1,5)<k_lo<k_hi<F(1,4),
        "root_lower_by_exact_integer_comparison":amp_lo**2<=square_lo,
        "root_upper_by_exact_integer_comparison":amp_hi**2>=square_hi,
        "entire_amplitude_bracket_inside_unique_root_ball":F(9,10)<amp_lo<amp_hi<F(6,5),
        "no_joining_or_global_promotion":not record["scope"]["newAxisOrJoiningGenerated"] and not record["scope"]["fullOriginalProfileCompleted"],
        "analytic_bridge_is_explicit":record["scope"]["amplitudeBracketConditionalOnWrittenAnalyticTotalSBridge"],
        "no_underflow_substitution":not record["scope"]["lambdaOrHUnderflowedToZero"],
    }


def main():
    sys.path.insert(0,str(HERE.parents[1]/"arithmetic/vendor"))
    import mpmath as mp
    path=HERE/"actual-main-pulse-integral.json"
    record=json.loads(path.read_text())
    checks=exact_checks(record)
    mp.mp.dps=70
    nodes,weights=mp.gauss_quadrature(64,"legendre")

    def integrate(f,a,b):
        a,b=mp.mpf(a),mp.mpf(b)
        mid,half=(a+b)/2,(b-a)/2
        return half*sum(weights[k]*f(mid+half*nodes[k]) for k in range(len(nodes)))

    def step(t):
        if t<=0:return mp.mpf(0)
        if t>=1:return mp.mpf(1)
        a=mp.exp(-1/t**2);b=mp.exp(-1/(1-t)**2)
        return a/(a+b)

    def primitive(t):
        if t<=0:return mp.mpf(0)
        if t>mp.mpf('.5'):return t-mp.mpf('.5')+primitive(1-t)
        return integrate(step,0,t/2)+integrate(step,t/2,t)

    beginning=sum(integrate(lambda t:mp.exp(-t/25)*primitive(t)**2,
                            mp.mpf(k)/4,mp.mpf(k+1)/4) for k in range(4))/125000
    middle=integrate(lambda x:mp.exp(-2*x)*(x-mp.mpf('.01'))**2,mp.mpf('.02'),5)
    middle+=integrate(lambda x:mp.exp(-2*x)*(x-mp.mpf('.01'))**2,5,10)
    cutoff=sum(integrate(lambda t:mp.exp(-20-2*t)*(mp.mpf('9.99')+t)**2*(1-step(t))**2,
                         mp.mpf(k)/4,mp.mpf(k+1)/4) for k in range(4))
    values={"beginning":beginning,"middle":middle,"cutoff":cutoff,"Kb":beginning+middle+cutoff}

    def to_mp(q):return mp.mpf(q.numerator)/q.denominator
    for name,value in values.items():
        lo,hi=endpoints(record["integrals"][name])
        checks["independent_gauss_legendre_inside_"+name]=to_mp(lo)<value<to_mp(hi)
    central_amp=mp.sqrt((1-mp.exp(-26))/(4*values["Kb"]))
    amp_lo,amp_hi=endpoints(record["uniformAmplitude"]["bracket"])
    checks["independent_zero_error_center_inside_uniform_bracket"]=to_mp(amp_lo)<central_amp<to_mp(amp_hi)
    result={"schema":"MathScope.IndependentMainPulseIntegralDiagnostic/1",
            "method":"70-digit independent Gauss-Legendre integration plus exact Fraction endpoint checks",
            "verifierSHA256":hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            "mpmathVersion":mp.__version__,
            "certificateSHA256":hashlib.sha256(path.read_bytes()).hexdigest(),
            "independentValues":{k:mp.nstr(v,65) for k,v in values.items()},
            "zeroTotalSErrorAmplitudeCenter":mp.nstr(central_amp,65),
            "checks":checks,"passed":sum(checks.values()),"total":len(checks),
            "scope":{"independentNumericalAgreementIsNotEnclosureProof":True,
                     "newFullProfileCertificate":False,"originalN3GatePromoted":False}}
    (HERE/"main-pulse-integral-independent.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps({"passed":result["passed"],"total":result["total"],
                      "Kb":result["independentValues"]["Kb"],
                      "zeroErrorAmplitudeCenter":result["zeroTotalSErrorAmplitudeCenter"]},indent=2))
    if not all(checks.values()):raise SystemExit(1)


if __name__=="__main__":main()
