#!/usr/bin/env python3
"""Conditional exact mixed-derivative radial tail via OPENAI NS Appendix B (B.4).

Let ||F||_rho<=M with original Appendix B coefficient weight:
  |d_eta^beta F_alpha| <= M*20^-alpha*rho^-beta*beta!*
  binomial(alpha+beta,beta)/((alpha+1)^2*(beta+1)^2).
Then for |Y|<=R<20, the mixed (r,beta) derivative tail from alpha>N
is <= M*rho^-beta*exact_tail_factor(N,r,beta,R).
This does NOT establish the needed original M, rho, eta disk, or Phi/u.
"""
from fractions import Fraction as Q
from math import factorial,comb
from pathlib import Path
import json,sys

def tail_factor(N,r,beta,R=Q(41,10)):
    if any(type(n) is not int or n<0 for n in (N,r,beta)):
        raise ValueError("N,r,beta must be nonnegative exact integers")
    if type(R) is not Q or not Q(0)<=R<Q(20):
        raise ValueError("exact 0<=R<20 required")
    n=N+1
    if n<r:raise ValueError("N insufficient for radial derivative")
    ratio=(R/Q(20))*Q(n+beta+1,n+1-r)
    if ratio>=1:raise ValueError("unable to bound geometric derivative tail, increase N")
    first=(Q(factorial(n),factorial(n-r))*
           Q(comb(n+beta,beta)*factorial(beta),(n+1)**2*(beta+1)**2)*
           R**(n-r)/Q(20)**n)
    return first/(1-ratio)

def receipt(N=12):
    pairs=[{"radial_order":r,"eta_order":b,
            "conditional_bound":f"M * rho^-{b} * ({tail_factor(N,r,b)})",
            "rational_coefficient":str(tail_factor(N,r,b))}
           for r in range(4) for b in range(6)]
    assert len(pairs)==24
    return {
      "schema":"MathScope.OpenAIPaper.B4MixedDerivativeConditionalTail/1",
      "source":"OPENAI Finite Time Blowup for Navier-Stokes, Appendix B p145-148, B.4 and R<20",
      "original_paper_pdf_SHA256":"0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
      "scope":"B_RHO_NORM_HYPOTHESIS_ONLY_NOT_ORIGINAL_SOURCE_PROFILE",
      "source_weight":"20^-alpha*rho^-beta*beta!*binomial(alpha+beta,beta)/((alpha+1)^2*(beta+1)^2)",
      "radius_R":"41/10",
      "truncation_degree":N,
      "mixed_derivative_upper_enclosures":pairs,
      "original_source_M_rho_domain_certified":False,
      "original_source_coefficient_values_evaluated":False,
      "original_523_calls_newly_certified":0,
      "final_67_field_jet_intervals_certified":0,
      "M3":"62/64","M4":"0/16","release":"HOLD"
    }
if __name__=="__main__":
    r=receipt()
    if len(sys.argv)>1:Path(sys.argv[1]).write_text(json.dumps(r,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps({"pairs":len(r["mixed_derivative_upper_enclosures"]),"r0_beta0":str(tail_factor(12,0,0)),"release":r["release"]}))
