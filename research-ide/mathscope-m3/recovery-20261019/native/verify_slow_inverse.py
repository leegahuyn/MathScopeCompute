#!/usr/bin/env python3
"""Independent exact endpoint certificates and implicit-jet algebra checks.

The reviewer uses atanh-series logarithms and Taylor exponential remainders,
independent of the native evaluator's exp bound. It does not evaluate whole-K
fields or certify the numerical coordinates of the original graph callers.
"""
from __future__ import annotations
import argparse
import copy
from fractions import Fraction as F
import hashlib
import json
from math import factorial
from pathlib import Path
import time
import sympy as sp

from slow_inverse_native import Interval, CertificationBlocked, evaluate, load_capsule

def pair(value):
    if isinstance(value, tuple):
        return value
    return F(value), F(value)

def add(a, b):
    a, b = pair(a), pair(b)
    return a[0]+b[0], a[1]+b[1]

def neg(a):
    a = pair(a)
    return -a[1], -a[0]

def mul(a, b):
    a, b = pair(a), pair(b)
    values = [x*y for x in a for y in b]
    return min(values), max(values)

def log_certificate(s, terms=16):
    """log(s)=2 sum v^(2k+1)/(2k+1), v=(s-1)/(s+1)."""
    s = F(s)
    if not F(1, 2) <= s <= 2:
        raise AssertionError("Reviewer log input is outside the original bracket")
    v = (s-1)/(s+1)
    partial = sum((2*v**(2*k+1)/F(2*k+1) for k in range(terms)), F(0))
    remainder = 2*abs(v)**(2*terms+1)/(F(2*terms+1)*(1-v*v))
    return partial-remainder, partial+remainder

def exp_certificate(x, terms=4):
    """Taylor polynomial interval plus a rational bound on the full tail."""
    x = pair(x)
    a = max(abs(v) for v in x)
    if a >= 1:
        raise AssertionError("Reviewer exponential tail proof requires |x|<1")
    total, power = pair(1), pair(1)
    for k in range(1, terms+1):
        power = mul(power, x)
        total = add(total, mul(power, F(1, factorial(k))))
    remainder = a**(terms+1)/(F(factorial(terms+1))*(1-a))
    return total[0]-remainder, total[1]+remainder

def independent_power(s, q_upper):
    if s == 1:
        return pair(1)
    logarithm = log_certificate(s)
    result = exp_certificate(mul((F(0), q_upper), logarithm))
    # Monotonicity of exp and the known sign of log(s) sharpens the 0 endpoint.
    if s >= 1:
        result = max(F(1), result[0]), result[1]
    if s <= 1:
        result = result[0], min(F(1), result[1])
    return result

def source_endpoint(s, y, t, q_upper):
    p = independent_power(F(s), q_upper)
    return F(s)-y*p[1]-t, F(s)-y*p[0]-t

def review_root_box(result):
    zlo, zhi = map(F, result["input_box"]["Z"])
    tlo, thi = map(F, result["input_box"]["T"])
    ylo = F(0) if zlo <= 0 <= zhi else min(zlo*zlo, zhi*zhi)
    yhi = max(zlo*zlo, zhi*zhi)
    slo, shi = map(F, result["value"])
    q_upper = 2*F(result["h"]["closed_enclosure"][1])
    assert F(1, 2) <= slo <= shi <= 2
    # F is increasing in s, decreasing in y and T. These two endpoint signs
    # enclose every root in the full supplied independent Z,T box.
    left = source_endpoint(slo, ylo, tlo, q_upper)
    right = source_endpoint(shi, yhi, thi, q_upper)
    assert left[1] <= 0, (result["input_box"], "left sign", left)
    assert right[0] >= 0, (result["input_box"], "right sign", right)
    assert 1-4*q_upper > F(1, 2)
    assert result["h"]["strictly_positive"] and not result["h"]["substitution_h_equals_zero"]
    return {
        "left_upper_le_zero": True, "right_lower_ge_zero": True,
        "method": "independent exact atanh-log series and exp Taylor series with full rational tails",
        "log_terms": 16, "exp_terms": 4,
        "derivative_lower_gt_one_half": True,
        "actual_source_call_node": result["source_call_node"],
        "source_h_positive_expression_retained": True,
    }

def review_implicit_derivatives():
    s, z, t, q = sp.symbols("s z T q", positive=True)
    f = s-z*z*s**q-t
    d = sp.diff(f, s)
    dz, dt = -sp.diff(f, z)/d, -sp.diff(f, t)/d
    derived = {
        "dZ": dz, "dT": dt,
        "dZZ": sp.diff(dz, z)+sp.diff(dz, s)*dz,
        "dZT": sp.diff(dz, t)+sp.diff(dz, s)*dt,
        "dTT": sp.diff(dt, t)+sp.diff(dt, s)*dt,
    }
    p, y = s**q, z*z
    independent_formulas = {
        "dZ": 2*z*p/d,
        "dT": 1/d,
        "dZZ": 2*p/d+8*y*q*p*p/(s*d*d)-4*y*y*q*(1-q)*p**3/(s*s*d**3),
        "dZT": 2*z*q*p/(s*d*d)-2*z*y*q*(1-q)*p*p/(s*s*d**3),
        "dTT": -y*q*(1-q)*p/(s*s*d**3),
    }
    checks = {}
    for name, expected in independent_formulas.items():
        difference = sp.factor(derived[name]-expected)
        assert difference == 0, name
        checks[name] = "symbolic implicit differentiation identity ==0"
    # This derivative is strictly negative for actual h>0, Z!=0, q=2h<1.
    # An interval endpoint 0 must not be presented as an exact zero derivative.
    return {"identities": checks, "sympy_version": sp.__version__, "h_is_held_fixed": True, "strict_nonzero_test": "dTT<0 whenever Z!=0, because actual q=2h is strictly between0 and1"}

def exact_source_image_jets(result):
    """Check seven exact s=1 witnesses and nonzero-h endpoint test instances.

    q endpoint instances are checks of an enclosure family, not replacements
    for the fixed original source h. This test makes no caller coordinate claim.
    """
    z = F(result["input_box"]["Z"][0])
    t = F(result["input_box"]["T"][0])
    assert t+z*z == 1 and result["value"] == ["1", "1"]
    qhi = 2*F(result["h"]["closed_enclosure"][1])
    for q in (F(0), qhi/2, qhi):
        d, y = 1-q*z*z, z*z
        values = {
            "dZ": 2*z/d, "dT": 1/d,
            "dZZ": 2/d+8*y*q/d**2-4*y*y*q*(1-q)/d**3,
            "dZT": 2*z*q/d**2-2*z*y*q*(1-q)/d**3,
            "dTT": -y*q*(1-q)/d**3,
        }
        for name, value in values.items():
            lo, hi = map(F, result["derivatives"][name])
            assert lo <= value <= hi, (name, q, value, lo, hi)
    return {"exact_source_image_witness": "s=1; Z=eta; T=1-eta^2", "exact_root": "1", "jet_family_endpoint_checks": 15, "global_caller_test": False}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-capsule", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    capsule = load_capsule(args.source_capsule)
    start = time.monotonic()
    rows, independent = [], []
    witnesses = [F(-1), F(-3,4), F(-1,2), F(0), F(1,2), F(3,4), F(1)]
    for eta in witnesses:
        result = evaluate(capsule, 622820, Interval.point(eta), Interval.point(1-eta*eta), 96)
        result["validation_case"] = "exact original source-image witness s=1"
        rows.append(result)
        independent.append({"index": len(rows)-1, **review_root_box(result), **exact_source_image_jets(result)})
    points = [("0", "1/2"), ("0", "3/4"), ("0", "3/2"), ("0", "2"), ("1/4", "1/2"), ("1/2", "1/2"), ("3/4", "1/2"), ("1", "1/2"), ("-1", "1/4"), ("5/4", "1/4")]
    for z, t in points:
        result = evaluate(capsule, 623935, Interval.point(z), Interval.point(t), 96)
        result["validation_case"] = "chosen formal-domain input of the actual native source function"
        rows.append(result)
        independent.append({"index": len(rows)-1, **review_root_box(result)})
    for z, t in [(Interval("1/4", "1/2"), Interval("1/2", "3/4")), (Interval("-3/4", "-1/2"), Interval("3/5", "4/5"))]:
        result = evaluate(capsule, 622820, z, t, 96)
        result["validation_case"] = "chosen independent formal-domain interval box"
        rows.append(result)
        independent.append({"index": len(rows)-1, **review_root_box(result)})
    precision = []
    for bits in (32, 64, 128):
        result = evaluate(capsule, 622820, Interval.point("3/4"), Interval.point("1/2"), bits)
        precision.append({"bits": bits, "value": result["value"], "width": str(F(result["value"][1])-F(result["value"][0])), "h_upper": result["h"]["closed_enclosure"][1], "independent_review": review_root_box(result)})
    assert F(precision[2]["width"]) < F(precision[1]["width"]) < F(precision[0]["width"])
    controls = []
    bad_inputs = [
        ("unknown original call", lambda: evaluate(capsule, 999, Interval.point(0), Interval.point(1))),
        ("float coordinate", lambda: Interval.point(0.5)),
        ("reversed interval", lambda: Interval(1, 0)),
        ("Z squared beyond original certified domain", lambda: evaluate(capsule, 622820, Interval.point(2), Interval.point(1))),
        ("T outside original source image", lambda: evaluate(capsule, 622820, Interval.point(1), Interval.point("-1/10"))),
        ("unresolved left endpoint sign", lambda: evaluate(capsule, 622820, Interval.point(0), Interval.point("1/4"))),
        ("unresolved right endpoint sign", lambda: evaluate(capsule, 622820, Interval.point(1), Interval.point("3/2"))),
        ("invalid resolution", lambda: evaluate(capsule, 622820, Interval.point(1), Interval.point(0), 0)),
    ]
    for name, function in bad_inputs:
        try:
            function()
        except CertificationBlocked as error:
            controls.append({"name": name, "rejected": True, "reason": str(error), "evidence": error.evidence})
        else:
            raise AssertionError(f"Negative control accepted: {name}")
    # Hash-aware tampering checks exercise the native source binding itself.
    for mutation in ("h_equals_zero", "definition_body_changed", "actual_call_arguments_changed", "residual_body_record_changed"):
        changed = copy.deepcopy(capsule)
        if mutation == "h_equals_zero":
            changed["parameter_expressions"]["h"] = {"integer": 0}
        elif mutation == "definition_body_changed":
            changed["definition"]["body"] = 0
        elif mutation == "actual_call_arguments_changed":
            changed["records"]["623935"]["args"][1] = 0
        else:
            changed["records"]["622819"]["args"][0] = 0
        changed.pop("capsule_payload_sha256")
        changed["capsule_payload_sha256"] = hashlib.sha256(json.dumps(changed, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
        mutation_path = args.output_dir / f"control_{mutation}.json"
        mutation_path.write_text(json.dumps(changed, indent=2)+"\n")
        try:
            load_capsule(mutation_path)
        except CertificationBlocked as error:
            controls.append({"name": mutation, "rejected": True, "reason": str(error)})
        else:
            raise AssertionError(f"Source mutation accepted: {mutation}")
        try:
            evaluate(changed, 623935, Interval.point("1/2"), Interval.point("3/4"))
        except CertificationBlocked as error:
            controls.append({"name": mutation+"_direct_evaluate", "rejected": True, "reason": str(error)})
        else:
            raise AssertionError(f"Direct evaluate accepted a rehashed source mutation: {mutation}")
    algebra = review_implicit_derivatives()
    evidence = {
        "schema": "MathScope.NewActualSlowInverseValidation/1",
        "implementation_kind": "NEW native implementation and verification, not a recovered historical patch",
        "source_capsule_sha256": capsule["capsule_payload_sha256"],
        "source_call_nodes": [622820, 623935],
        "native_validation_boxes": rows,
        "independent_root_certificates": independent,
        "independent_symbolic_jet_review": algebra,
        "native_precision_comparison": precision,
        "negative_controls": controls,
        "scope": "Actual source scalar inverse and its fixed-h first/second Z,T derivatives on declared certified formal-domain boxes. Chosen test inputs are not the numerical coordinates of the final global graph callers.",
        "remaining": ["Evaluate actual outer caller Z,T boxes", "Certify R^2/(2*s) against original Xa and XR*exp(node319) radial guard", "Evaluate all other native derivatives/cutoff/current A,b,p", "Whole-K energy and independent space/time refinement", "Original four-axis refinement and separate tails"],
        "all_138_native_boundaries_closed": False,
        "eight_expression_derivative_leaves_closed": False,
        "actual_caller_coordinates_evaluated": False,
        "N7_06_closed": False, "N8_05_closed": False,
        "new_M3_closures": 0, "actual_global_last_resolved_tau": None,
        "elapsed_seconds": time.monotonic()-start,
    }
    output = args.output_dir / "ACTUAL_SLOW_INVERSE_VALIDATION.json"
    output.write_text(json.dumps(evidence, ensure_ascii=False, indent=2)+"\n")
    summary = {"status": "PASS", "native_boxes": len(rows), "independent_endpoint_certificates": len(independent)+len(precision), "implicit_jet_identities": len(algebra["identities"]), "negative_controls": len(controls), "precision_comparison_bits": [32,64,128], "h_replaced_by_zero": False, "actual_caller_coordinates_evaluated": False, "new_M3_closures": 0, "actual_global_last_resolved_tau": None, "elapsed_seconds": evidence["elapsed_seconds"], "output": str(output)}
    (args.output_dir / "SUMMARY.json").write_text(json.dumps(summary, indent=2)+"\n")
    print(json.dumps(summary, ensure_ascii=False))

if __name__ == "__main__":
    main()
