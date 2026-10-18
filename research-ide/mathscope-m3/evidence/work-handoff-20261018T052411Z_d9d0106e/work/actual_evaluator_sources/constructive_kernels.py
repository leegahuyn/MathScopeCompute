#!/usr/bin/env python3
"""Exact elementary bounds for the original source's boundary kernels.

This module bounds actual elementary functions used in the source. It does
not authenticate a full coefficient, choose a replacement h, or certify an
all-space field. All arithmetic decisions below use integers/Fraction.
"""
from fractions import Fraction as Q
from math import comb
import json
from pathlib import Path


def boundary_derivative_polynomial(a, r, order):
    """D_t^n exp(-a/t^r) = P_n(1/t) exp(-a/t^r), t>0."""
    a = Q(a)
    if a <= 0 or r not in (1, 2) or type(order) is not int or order < 0:
        raise ValueError("positive rational a, r in {1,2}, integer order>=0 required")
    p = {0: Q(1)}
    for _ in range(order):
        out = {}
        for k, c in p.items():
            if k:
                out[k + 1] = out.get(k + 1, Q(0)) - k * c
            out[k + r + 1] = out.get(k + r + 1, Q(0)) + a * r * c
        p = {k: c for k, c in sorted(out.items()) if c}
    return p


def monomial_exponential_envelope(a, r, k):
    """Rational upper bound on sup_{u>=0} u^k exp(-a*u^r)."""
    a = Q(a)
    if a <= 0 or r not in (1, 2) or type(k) is not int or k < 0:
        raise ValueError("invalid envelope inputs")
    if k == 0:
        return Q(1)
    # The exact maximum is (k/(a*r*e))^(k/r). Drop e^-k/r,
    # then enlarge both the base and its exponent to rational quantities.
    return max(Q(1), Q(k, r) / a) ** ((k + r - 1) // r)


def boundary_jet_bound(a, r, order, pole=0):
    """Bounds t^-pole |D_t^order exp(-a/t^r)| globally on t>0."""
    if type(pole) is not int or pole < 0:
        raise ValueError("nonnegative integer boundary pole required")
    p = boundary_derivative_polynomial(a, r, order)
    return sum((abs(c) * monomial_exponential_envelope(a, r, k + pole)
                for k, c in p.items()), Q(0))


def mean_seed_jet_bound(order):
    """Original seed exp(-1/[t(1-t)]) on (0,1), flat outside."""
    if type(order) is not int or order < 0:
        raise ValueError("nonnegative integer derivative order required")
    b = [boundary_jet_bound(1, 1, n) for n in range(order + 1)]
    return sum((Q(comb(order, n)) * b[n] * b[order - n]
                for n in range(order + 1)), Q(0))


def inverse_jet_bounds(derivative_bounds, positive_lower):
    """Scalar Leibniz recurrence, requiring a proved positive lower bound."""
    f, lower = [Q(x) for x in derivative_bounds], Q(positive_lower)
    if not f or any(x < 0 for x in f) or lower <= 0:
        raise ValueError("nonnegative finite jet bounds and positive lower required")
    out = [1 / lower]
    for n in range(1, len(f)):
        out.append(sum((Q(comb(n, j)) * f[j] * out[n-j]
                        for j in range(1, n+1)), Q(0)) / lower)
    return out


def source_step_jet_bound(order, r=1):
    """Bounds e^(-1/t^r)/(e^(-1/t^r)+e^(-1/(1-t)^r)).

    At least one of t,1-t is >=1/2. Its exponential is >=e^(-2^r)
    >3^(-2^r). This certifies the denominator before the recurrence.
    """
    if type(order) is not int or order < 0 or r not in (1, 2):
        raise ValueError("nonnegative integer derivative order and r in {1,2} required")
    f = [boundary_jet_bound(1, r, n) for n in range(order+1)]
    inv = inverse_jet_bounds([2*x for x in f], Q(1, 3**(2**r)))
    return sum((Q(comb(order, n))*f[n]*inv[order-n]
                for n in range(order+1)), Q(0))


def anchored_ftc_upper(lengths, face_derivative_bounds):
    """A rational majorant of the source rectangularSourceFTC expression.

    face_derivative_bounds[mask] must bound that source's anchored mixed
    derivative on its face. This function cannot supply those hypotheses.
    sqrt(1+B^2)<=1+B avoids approximate square roots.
    """
    lengths = [Q(x) for x in lengths]
    if not 1 <= len(lengths) <= 3 or any(x < 0 for x in lengths):
        raise ValueError("one to three nonnegative box lengths required")
    if len(face_derivative_bounds) != 2**len(lengths):
        raise ValueError("every anchored face, including the anchor, required")
    out = Q(0)
    for mask, raw in enumerate(face_derivative_bounds):
        b = Q(raw)
        if b < 0:
            raise ValueError("negative face norm")
        term = 1+b
        for j, width in enumerate(lengths):
            if mask & (1 << j):
                term *= width
        out += term
    return out


def sufficient_log_threshold(C, P, gamma, stage, previous=0, log_q0_inverse=0):
    """Original sufficient rule; input source majorant is still required."""
    C, gamma, previous, log_q0_inverse = map(Q, (C, gamma, previous, log_q0_inverse))
    if C <= 0 or gamma <= 0 or type(P) is not int or P < 0 or type(stage) is not int or stage < 1:
        raise ValueError("positive C,gamma and nonnegative P required")
    L = max(Q(1), previous+1, log_q0_inverse+1,
            (2*P/gamma)**2, 2*(C+stage)/gamma)
    return {"L": L, "polynomial_check": gamma*gamma*L >= 4*P*P,
            "coefficient_check": gamma*L/2 >= C+stage,
            "growth_check": L >= previous+1,
            "domain_check": L >= log_q0_inverse+1}


def audit():
    # Exact algebra regression, not numerical samples of the function.
    assert boundary_derivative_polynomial(1, 1, 1) == {2: Q(1)}
    assert boundary_derivative_polynomial(1, 1, 2) == {3: Q(-2), 4: Q(1)}
    assert boundary_derivative_polynomial(1, 2, 2) == {4: Q(-6), 6: Q(4)}
    assert mean_seed_jet_bound(0) == 1
    assert inverse_jet_bounds([2, 3, 5], 1) == [Q(1), Q(3), Q(23)]
    assert anchored_ftc_upper([2,3], [0,0,0,0]) == 12
    rejected = []
    for label, fn in [
        ("zero_gaussian_parameter", lambda: boundary_jet_bound(0,2,1)),
        ("zero_denominator_floor", lambda: inverse_jet_bounds([1],0)),
        ("omitted_FTC_face", lambda: anchored_ftc_upper([1,1],[1,1,1])),
        ("zero_decay_gain", lambda: sufficient_log_threshold(1,2,0,1)),
        ("negative_seed_order", lambda: mean_seed_jet_bound(-1)),
        ("negative_step_order", lambda: source_step_jet_bound(-1)),
        ("noninteger_stage", lambda: sufficient_log_threshold(1,2,Q(1,20),1.5))]:
        try: fn()
        except ValueError: rejected.append(label)
        else: raise AssertionError(label)
    # This is a generic exact arithmetic fixture, never an actual h value.
    threshold = sufficient_log_threshold(5,3,Q(1,20),2,100,200)
    assert all(v for k,v in threshold.items() if k.endswith("check"))
    return {
        "schema": "MathScope.ConstructiveElementarySourceKernels/1",
        "arithmetic": "exact rational; no sampled supremum or floating decision",
        "actual_kernel": "flat exp(-a/t^r), r=1,2; original mean bump and source steps",
        "mean_mass_lower": "1/14580",
        "mass_lower_proof": "Original mass>=exp(-16/3)/20>exp(-6)/20>1/(20*3^6), since e<3.",
        "mean_seed_jet_upper": [str(mean_seed_jet_bound(n)) for n in range(7)],
        "normalized_mean_seed_jet_upper": [str(14580*mean_seed_jet_bound(n)) for n in range(7)],
        "source_step_jet_upper_r1": [str(source_step_jet_bound(n,1)) for n in range(5)],
        "source_step_jet_upper_r2": [str(source_step_jet_bound(n,2)) for n in range(5)],
        "gaussian_a1_r2_pole3_jet_upper": [str(boundary_jet_bound(1,2,n,3)) for n in range(7)],
        "negative_controls_rejected": rejected,
        "generic_schedule_fixture": {k: str(v) if isinstance(v,Q) else v for k,v in threshold.items()},
        "scope": {
            "elementary_bounds_derived": True,
            "all_recursive_source_coefficients_bounded": False,
            "original_h_numerically_substituted": False,
            "actual_final_field_evaluated": False,
            "N706_or_N805_closed": False
        }
    }


if __name__ == "__main__":
    result = audit()
    destination = Path(__file__).with_name("ELEMENTARY_KERNEL_AUDIT.json")
    destination.write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps({"status":"PASS", "artifact":str(destination), "scope":result["scope"]}))
