#!/usr/bin/env python3
"""Certified values and Z,T jets of original ActualCommonBandSlowInverse.

All arithmetic is exact rational. The fixed positive source h remains its
original exponential expression. A rational enclosure of h introduces an
explicit error, never the substitution h=0. The module supplies the scalar
native kernel; callers must still evaluate the actual source Z,T intervals.
"""
from __future__ import annotations
from dataclasses import dataclass
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path

EXPECTED_CAPSULE_PAYLOAD_SHA256 = "adec1be9fb28cdca2238d99a2126e5d8c444ca0bebc442d8cbb7a746d69c0d60"

class CertificationBlocked(ValueError):
    """The supplied source box is not certified by this kernel's domain."""
    def __init__(self, reason, evidence=None):
        super().__init__(reason)
        self.evidence = evidence or {}

def exact(value):
    if type(value) not in (str, int, F):
        raise CertificationBlocked("Exact rational inputs required; floats are not certificates")
    return F(value)

@dataclass(frozen=True)
class Interval:
    lo: F
    hi: F
    def __post_init__(self):
        object.__setattr__(self, "lo", exact(self.lo))
        object.__setattr__(self, "hi", exact(self.hi))
        if self.lo > self.hi:
            raise CertificationBlocked("Reversed interval")
    @classmethod
    def point(cls, value):
        return cls(value, value)
    @staticmethod
    def coerce(value):
        return value if isinstance(value, Interval) else Interval.point(value)
    def __add__(self, other):
        other = self.coerce(other)
        return Interval(self.lo + other.lo, self.hi + other.hi)
    __radd__ = __add__
    def __neg__(self):
        return Interval(-self.hi, -self.lo)
    def __sub__(self, other):
        return self + -self.coerce(other)
    def __rsub__(self, other):
        return self.coerce(other) + -self
    def __mul__(self, other):
        other = self.coerce(other)
        products = [a*b for a in (self.lo, self.hi) for b in (other.lo, other.hi)]
        return Interval(min(products), max(products))
    __rmul__ = __mul__
    def reciprocal(self):
        if self.lo <= 0 <= self.hi:
            raise CertificationBlocked("An interval denominator contains zero")
        return Interval(1/self.hi, 1/self.lo)
    def __truediv__(self, other):
        return self * self.coerce(other).reciprocal()
    def __rtruediv__(self, other):
        return self.coerce(other) * self.reciprocal()
    def square(self):
        upper = max(self.lo*self.lo, self.hi*self.hi)
        lower = 0 if self.lo <= 0 <= self.hi else min(self.lo*self.lo, self.hi*self.hi)
        return Interval(lower, upper)
    def intersect(self, other):
        return Interval(max(self.lo, other.lo), min(self.hi, other.hi))
    def data(self):
        return [str(self.lo), str(self.hi)]
    @property
    def width(self):
        return self.hi - self.lo

def validate_capsule(capsule):
    if type(capsule) is not dict:
        raise CertificationBlocked("An authenticated source capsule is required")
    payload = {key: value for key, value in capsule.items() if key != "capsule_payload_sha256"}
    actual = hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
    if actual != EXPECTED_CAPSULE_PAYLOAD_SHA256 or capsule.get("capsule_payload_sha256") != EXPECTED_CAPSULE_PAYLOAD_SHA256:
        raise CertificationBlocked("Source capsule differs from the independently pinned complete original capsule")
    if capsule.get("definition_sha256") != "a7b26202a039c4a338e0210e99ea2329c40323d6d6615d3a2519fc097d12dfa0":
        raise CertificationBlocked("Unrecognized original slow inverse definition")
    definition_digest = hashlib.sha256(json.dumps(capsule["definition"], sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
    if definition_digest != capsule["definition_sha256"]:
        raise CertificationBlocked("Original native definition does not match its pin")
    if capsule.get("parameter_expressions") != {
        "Md": {"integer": 1048576},
        "T": {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]},
        "h": {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}},
    }:
        raise CertificationBlocked("Original positive h expression changed")
    if not capsule.get("h_strictly_positive") or capsule.get("h_replaced_by_zero"):
        raise CertificationBlocked("Source h was replaced or its positivity was dropped")
    return capsule

def load_capsule(path: Path):
    return validate_capsule(json.loads(path.read_text()))

def source_h_bound(bits):
    if type(bits) is not int or not 16 <= bits <= 4096:
        raise CertificationBlocked("Supported exact resolution is 16 through 4096 bits")
    exponent = bits + 32
    # T=exp(Md)+10>Md, 8002*Md>exponent, and log(2)<1.
    # Thus 0<h=exp(-8002*T)<exp(-exponent)<2^(-exponent).
    if not 8002 * 1048576 > exponent:
        raise CertificationBlocked("The source-smallness proof does not cover this resolution")
    upper = F(1, 2**exponent)
    return upper, {
        "source_expression": "exp(-8002*(exp(1048576)+10))",
        "strictly_positive": True,
        "closed_enclosure": ["0", str(upper)],
        "upper_strict": True,
        "zero_is_only_enclosure_endpoint": True,
        "substitution_h_equals_zero": False,
        "proof": "T>Md=1048576; 8002*Md>bits+32; log(2)<1. Therefore 0<h<2^(-bits-32).",
        "resolution_bits": bits,
    }

def power_bound(s: Interval, q_upper: F):
    """Enclose s^(2h), where actual 0<2h<q_upper, on unchanged [1/2,2].

    |log(s)|<=log(2)<1. For delta=q_upper<1,
    exp(-delta)>=1-delta and exp(delta)<=1/(1-delta).
    Sign refinements at s=1 preserve exact source-image witnesses.
    """
    if s.lo < F(1, 2) or s.hi > 2 or not 0 < q_upper < F(1, 8):
        raise CertificationBlocked("Power enclosure outside original slow bracket")
    if s.lo == s.hi == 1:
        return Interval.point(1)
    lower = F(1) if s.lo >= 1 else 1-q_upper
    upper = F(1) if s.hi <= 1 else 1/(1-q_upper)
    return Interval(lower, upper)

def residual(s, y, t, q_upper):
    return s - y*power_bound(s, q_upper) - t

def _point_parameter_root(y: F, t: F, q_upper: F, bits: int):
    """Enclose the unique root for one exact pair (Z^2,T) and the actual h."""
    bracket = Interval(F(1, 2), 2)
    derivative = Interval(1-4*q_upper, 1)
    left = residual(Interval.point(bracket.lo), y, t, q_upper)
    right = residual(Interval.point(bracket.hi), y, t, q_upper)
    if left.hi > 0 or right.lo < 0:
        raise CertificationBlocked("Original residual endpoint signs unresolved", {
            "Z_squared": str(y), "T": str(t), "F_left": left.data(), "F_right": right.data(),
            "original_bracket": bracket.data(),
        })
    # These exact roots are algebraic identities of the actual source kernel.
    if y == 0:
        return Interval.point(t), {"method": "source identity Z=0 implies s=T", "iterations": 0, "F_left": left.data(), "F_right": right.data()}
    if y+t == 1:
        return Interval.point(1), {"method": "source identity at s=1", "iterations": 0, "F_left": left.data(), "F_right": right.data()}
    target_width = F(1, 2**bits)
    history = []
    for iteration in range(1, 33):
        midpoint = (bracket.lo+bracket.hi)/2
        f_mid = residual(Interval.point(midpoint), y, t, q_upper)
        newton = Interval.point(midpoint)-f_mid/derivative
        narrowed = bracket.intersect(newton)
        history.append({"iteration": iteration, "width_before": str(bracket.width), "width_after": str(narrowed.width), "residual_midpoint": f_mid.data()})
        bracket = narrowed
        if bracket.width <= target_width:
            return bracket, {"method": "interval Newton with exact rational arithmetic", "iterations": iteration, "F_left": left.data(), "F_right": right.data(), "target_width": str(target_width), "history": history}
    raise CertificationBlocked("Requested root enclosure width was not reached", {"last_bracket": bracket.data(), "target_width": str(target_width), "iterations": 32})

def evaluate(capsule, node_id, z: Interval, t: Interval, bits=96):
    """Evaluate the actual scalar native call, with derivatives holding h fixed.

    z/t must be certified intervals produced by the caller. This function does
    not certify how those inputs were obtained. Its test fixtures are explicitly
    identified as native formal-domain tests, never as global field evaluations.
    """
    # Validate fixed external identity on every entry, including callers
    # passing a dictionary directly rather than using load_capsule().
    validate_capsule(capsule)
    if node_id not in capsule.get("call_nodes", []):
        raise CertificationBlocked("Not an authenticated original slow call")
    node = capsule["records"].get(str(node_id))
    if not node or node["op"] != "actual_monotone_root" or node["args"][0] != 2:
        raise CertificationBlocked("Original call operation or registry changed")
    if not isinstance(z, Interval) or not isinstance(t, Interval):
        raise CertificationBlocked("Certified input intervals are required")
    if t.lo < 0:
        raise CertificationBlocked("Original source image requires T>=0")
    y = z.square()
    if y.hi > 2:
        raise CertificationBlocked("Original derivative domain Z^2<=2 is not certified")
    h_upper, h_proof = source_h_bound(bits)
    q_upper = 2*h_upper
    # The root is increasing in y=Z^2 and T because s_y=s^(2h)/F_s>0,
    # s_T=1/F_s>0. Independent input intervals are enclosed by two corners.
    minimum, min_receipt = _point_parameter_root(y.lo, t.lo, q_upper, bits)
    maximum, max_receipt = _point_parameter_root(y.hi, t.hi, q_upper, bits)
    s = Interval(minimum.lo, maximum.hi)
    q = Interval(0, q_upper)
    p = power_bound(s, q_upper)
    f_s = (1-y*q*p/s).intersect(Interval(1-4*q_upper, 1))
    f_z = -2*z*p
    f_zz = -2*p
    f_sz = -2*z*q*p/s
    f_ss = y*q*(1-q)*p/s.square()
    s_z = -f_z/f_s
    s_t = 1/f_s
    s_zz = -(f_zz+2*f_sz*s_z+f_ss*s_z.square())/f_s
    s_zt = -(f_sz*s_t+f_ss*s_z*s_t)/f_s
    s_tt = -f_ss*s_t.square()/f_s
    result = {
        "schema": "MathScope.ActualSlowInverseJetEnclosure/1",
        "status": "CERTIFIED_NATIVE_INPUT_BOX",
        "source_call_node": node_id,
        "source_argument_nodes": node["args"][1:],
        "definition_sha256": capsule["definition_sha256"],
        "source_capsule_sha256": capsule["capsule_payload_sha256"],
        "input_box": {"Z": z.data(), "T": t.data()},
        "resolution_bits": bits,
        "h": h_proof,
        "value": s.data(),
        "derivatives": {"dZ": s_z.data(), "dT": s_t.data(), "dZZ": s_zz.data(), "dZT": s_zt.data(), "dTT": s_tt.data()},
        "residual_derivative": f_s.data(),
        "root_corner_certificates": {"minimum": min_receipt, "maximum": max_receipt},
        "error_budget": {
            "arithmetic_rounding": "0; every endpoint operation uses exact Fraction arithmetic",
            "source_h_upper": str(h_upper),
            "power_enclosure_max_width": str(1/(1-q_upper)-(1-q_upper)),
            "point_parameter_root_width_target": str(F(1, 2**bits)),
            "full_value_width_includes_input_box_variation": str(s.width),
            "series_or_fourier_tail": "not an operation of this native scalar inverse",
        },
        "strict_source_signs": {
            "h_positive": True,
            "dT_positive": True,
            "dTT_negative_when_Z_nonzero": not (z.lo <= 0 <= z.hi),
            "zero_in_derivative_enclosure_is_not_exact_zero": True,
        },
        "actual_source_caller_coordinates_evaluated": False,
        "whole_K_evaluated": False,
        "radial_guard_classified": False,
        "new_M3_closures": 0,
        "actual_global_last_resolved_tau": None,
    }
    return result
