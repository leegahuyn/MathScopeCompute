#!/usr/bin/env python3
"""Exact rational verification of OPENAI Navier-Stokes Appendix B, (B.11).

Reference PDF SHA256: 0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f
For 0 <= z <= 41/10, f0(z) = sum_n (-z/2)^n/(n!(n+1)!).
This is an explicit comparison function, NOT the actual nonlinear Phi.
"""
from fractions import Fraction as Q
from math import factorial
import json,sys
from pathlib import Path

MAX_Z=Q(41,10)
PAPER_F0_LOWER=Q(305719,1152000)

def finite_enclosure(z,r=0,n=12):
    """At any exact rational z in [0,4.1], bound f0^(r)(z) by alternating terms."""
    if type(z) is not Q or not Q(0)<=z<=MAX_Z or r<0 or n<1:
        raise ValueError("Exact z in [0,41/10], r>=0, n>=1 required")
    t=z/2
    s=sum((Q((-1)**r,2**r)*(-t)**m/
           (factorial(m)*factorial(m+r+1)) for m in range(n+1)),Q(0))
    tail=Q((-1)**r,2**r)*(-t)**(n+1)/(factorial(n+1)*factorial(n+r+2))
    return min(s,s+tail),max(s,s+tail)

def paper_B11_certificate(max_derivative=5):
    if type(max_derivative) is not int or not 1<=max_derivative<=50:
        raise ValueError("Derivative budget 1..50")
    # t=z/2 in [0,41/20]. P3'(t)=-((t-4)^2+8)/48 <0.
    t=Q(41,20)
    p3=1-t/2+t*t/12-t*t*t/144
    if p3!=PAPER_F0_LOWER:raise AssertionError("Original B.11 constant mismatch")
    if t/Q(2*3)>=1 or t/Q(4*5)>=1:
        raise AssertionError("Alternating remainder monotonicity failed")
    # For r>=1, (-1)^r f0^(r) = 1/2^r sum_m (-t)^m/[m!(m+r+1)!]
    # and the alternating terms decrease from the first term since t/(r+2)<1.
    deriv=[]
    for r in range(1,max_derivative+1):
        hi=Q(1,2**r*factorial(r+1))
        lo=hi*(1-t/Q(r+2))
        if not Q(0)<lo<=hi:raise AssertionError("Derivative bound invalid")
        deriv.append({"order":r,"signed_derivative_positive":True,"lower":str(lo),"upper":str(hi)})
    return {
      "schema":"MathScope.OpenAIPaper.B11ExactComparisonCertificate/1",
      "reference_PDF_SHA256":"0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
      "reference":"OPENAI Finite Time Blowup for Navier-Stokes, Appendix B page 146, equations (B.11)-(B.13)",
      "scope":"EXPLICIT_F0_ONLY",
      "Ychi_assumptions":"0<=Ychi<=41/10; requires actual Y and chi bounds",
      "P3_decreasing_derivative":"-((t-4)^2+8)/48",
      "f0_lower_exact":str(p3),"f0_upper_exact":"1",
      "radial_derivatives":deriv,
      "sufficient_Phi_positivity_condition":"C_0_0/Lambda < 305719/1152000 (B.13)",
      "actual_original_C00_numeric_proven":False,
      "actual_original_Brho_norm_proven":False,
      "actual_Phi_positive_proven":False,
      "new_global_523_Y_bounds_certified":0,
      "final_67_field_jets_certified":0,
      "M3":"62/64","M4":"0/16","release":"HOLD"
    }

if __name__=="__main__":
    receipt=paper_B11_certificate()
    if len(sys.argv)>1:Path(sys.argv[1]).write_text(json.dumps(receipt,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps(receipt,indent=2,ensure_ascii=False))
