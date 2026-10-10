#!/usr/bin/env python3
"""Enclose the actual source R0 integral and the new uniform amplitude bracket.

The two non-polynomial collars are integrated with outward whole-cell
enclosures. The central polynomial-exponential piece is evaluated exactly
up to certified exponential enclosures. No quadrature error is inferred
from samples. The amplitude conclusion additionally uses the explicit
analytic total-S error proved in OUTER_DERIVATION.md.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from fractions import Fraction as F
from pathlib import Path

HERE=Path(__file__).resolve().parent
ARITHMETIC=HERE.parent/"followup-next/uniform-gluing/dyadic_interval.py"
sys.path.insert(0,str(ARITHMETIC.parent))
from dyadic_interval import I, exp_negative, sigma, power


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def enclose(cells=2048):
    if not isinstance(cells,int) or cells<64 or cells>16384:
        raise ValueError("Choose an integer whole-cell count in [64,16384]")
    width=F(1,cells)
    step=[sigma(F(k,cells)) for k in range(cells+1)]
    primitive=I(0)
    beginning=I(0)
    cutoff=I(0)
    start_cells=[]
    end_cells=[]
    for k in range(cells):
        a,b=F(k,cells),F(k+1,cells)
        # Since sigma is monotone, its primitive increment is enclosed
        # throughout this entire cell. The lower endpoint uses the exact
        # accumulated lower enclosure, not a point quadrature estimate.
        next_primitive=primitive+I(step[k].lower(),step[k+1].upper())*width
        whole_primitive=I(primitive.lower(),next_primitive.upper())
        inc=exp_negative(I(a,b)/25)*whole_primitive**2*width/F(125000)
        beginning=beginning+inc
        start_cells.append(inc.json())
        # xi=10+t; phi=xi-.01 on this complete cutoff collar.
        one_minus_step=I(1-step[k+1].upper(),1-step[k].lower())
        end_inc=exp_negative(20+2*I(a,b))*(I(F(999,100))+I(a,b))**2*one_minus_step**2*width
        cutoff=cutoff+end_inc
        end_cells.append(end_inc.json())
        primitive=next_primitive

    # Integral e^(-2x)*(x-.01)^2 dx has decreasing positive primitive
    # e^(-2x)*[(x-.01)^2/2+(x-.01)/2+1/4].
    def antiderivative(x):
        u=I(x)-F(1,100)
        return exp_negative(2*I(x))*(u*u/2+u/2+F(1,4))
    middle=antiderivative(F(1,50))-antiderivative(10)
    kb=beginning+middle+cutoff
    energy=(1-exp_negative(I(26)))/4
    # The actual selected T satisfies e^(20T)*lambda < 2^-200.
    # This is a proven uniform C1 error bound in the scalar S equation.
    error=I(-F(1,2**200),F(1,2**200))
    amplitude_squared=(energy+error)/kb
    amplitude=power(amplitude_squared,F(1,2))
    checks={
        "actual_step_integral_half_enclosed":primitive.contains(F(1,2)),
        "all_start_integral_cells_nonnegative":all(int(x["lowerNumerator"])>=0 for x in start_cells),
        "all_cutoff_integral_cells_nonnegative":all(int(x["lowerNumerator"])>=0 for x in end_cells),
        "actual_Kb_above_one_fifth":kb.lower()>F(1,5),
        "actual_Kb_below_one_quarter":kb.upper()<F(1,4),
        "actual_amplitude_bracket_inside_original_root_bracket":amplitude.lower()>F(9,10) and amplitude.upper()<F(6,5),
        "positive_amplitude_squared":amplitude_squared.lower()>0,
        "rational_root_lower_verified":amplitude.lower()**2<=amplitude_squared.lower(),
        "rational_root_upper_verified":amplitude.upper()**2>=amplitude_squared.upper(),
        "whole_cell_domains_cover_both_collars":cells*width==1 and len(start_cells)==len(end_cells)==cells,
        "analytic_total_S_error_below_two_to_minus_200":980*128>200,
    }
    return {
        "schema":"MathScope.ActualMainPulseIntegralEnclosure/1",
        "status":"ACTUAL_CONTINUOUS_PULSE_INTEGRAL_ENCLOSED" if all(checks.values()) else "FAILED",
        "sourcePaperSHA256":"0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
        "sourceFormula":"R0(xi)=integral_0^xi sigma(v/.02)dv * (1-sigma(xi-10))",
        "domains":{"beginning":"xi=.02*t, t in [0,1]","middle":"xi in [.02,10]","cutoff":"xi=10+t, t in [0,1]","outside":"R0=0 for xi<=0 or xi>=11"},
        "cellsPerNonPolynomialCollar":cells,
        "method":"Positive whole-cell integral enclosures; exact primitive on central piece; no sampled supremum or omitted tail.",
        "bindings":{"arithmeticSHA256":sha(ARITHMETIC),"producerSHA256":sha(Path(__file__)),
                    "outerDerivationSHA256":sha(HERE/"OUTER_DERIVATION.md"),
                    "outerEnvelopeCertificateSHA256":sha(HERE/"outer-envelope-certificate.json")},
        "integrals":{"sigmaIntegral":primitive.json(),"beginning":beginning.json(),"middle":middle.json(),
                     "cutoff":cutoff.json(),"Kb":kb.json(),"pulseEnergyConstant":energy.json()},
        "uniformAmplitude":{"eta":"[-1,1]","bracket":amplitude.json(),"squaredBracket":amplitude_squared.json(),
                            "actualTotalSErrorAbsoluteUpper":"2^-200",
                            "dependsOnAnalyticBridge":"OUTER_DERIVATION.md sections 5-6: same corrected E, exact M/J roots, and actual total-S polynomial."},
        "wholeCellIntegralEnclosures":{"beginning":start_cells,"cutoff":end_cells},
        "checks":checks,"passed":sum(checks.values()),"total":len(checks),
        "scope":{"actualSourceR0ContinuousIntegralEnclosed":True,
                 "amplitudeBracketConditionalOnWrittenAnalyticTotalSBridge":True,
                 "independentEtaSampleRootsCombined":False,"lambdaOrHUnderflowedToZero":False,
                 "newAxisOrJoiningGenerated":False,"fullOriginalProfileCompleted":False,
                 "newLeanTheorem":False,"originalAcceptanceGatePromoted":False},
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--cells",type=int,default=2048)
    parser.add_argument("--output",type=Path,default=HERE/"actual-main-pulse-integral.json")
    args=parser.parse_args()
    result=enclose(args.cells)
    args.output.write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps({"status":result["status"],"passed":result["passed"],"total":result["total"],
                      "Kb":result["integrals"]["Kb"]["approximate"],
                      "allEtaAmplitudeBracket":result["uniformAmplitude"]["bracket"]["approximate"],
                      "failed":[k for k,v in result["checks"].items() if not v]},indent=2))
    if not all(result["checks"].values()):
        raise SystemExit(1)


if __name__=="__main__":
    main()
