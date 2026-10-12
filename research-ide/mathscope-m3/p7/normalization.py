"""Explicit divisor bookkeeping for completed zeta and elliptic L-functions."""
from __future__ import annotations

from fractions import Fraction


def _point(s):
    if not isinstance(s, dict):
        return None
    values = []
    for name in ("real", "imag"):
        value = s.get(name, "0")
        if isinstance(value, dict):
            if value.get("lower") != value.get("upper"):
                return None
            value = value.get("lower")
        try:
            values.append(Fraction(value))
        except (ValueError, TypeError, ZeroDivisionError):
            return None
    return tuple(values)


def zeta_normalization_ledger(s, *, evaluated_function="zeta"):
    point = _point(s)
    exceptional = None
    if point is not None and point[1] == 0:
        real = point[0]
        if real == 1:
            exceptional = {"source": "zeta simple pole with residue 1", "factor": "simple zero from s-1",
                           "target": "xi removable, exact value 1/2", "zeroMultiplicityTransferred": False}
        elif real == 0:
            exceptional = {"source": "zeta(0)=-1/2", "factor": "s cancels the Gamma(s/2) simple pole",
                           "target": "xi removable, exact value 1/2", "zeroMultiplicityTransferred": False}
        elif real.denominator == 1 and real < 0 and real.numerator % 2 == 0:
            exceptional = {"source": "zeta trivial simple zero", "factor": "Gamma(s/2) simple pole",
                           "target": "xi finite and nonzero by reflection to Re(s)>1", "zeroMultiplicityTransferred": False}
    return {
        "schema": "MathScope.P7.CompletedNormalizationLedger/1", "sourceFunction": "zeta(s)", "targetFunction": "xi(s)",
        "evaluatedFunction": evaluated_function, "input": s,
        "forward": "xi(s)=s*(s-1)*pi^(-s/2)*Gamma(s/2)*zeta(s)/2",
        "inverse": "zeta(s)=2*pi^(s/2)*rgamma(s/2)*xi(s)/(s*(s-1)), with analytic limits at s=0,1",
        "completedFunctionalEquation": "xi(s)=xi(1-s)",
        "zeroPoleRules": [
            {"locus": "0<Re(s)<1", "rule": "The multiplier is finite and nonzero; nontrivial zero multiplicities agree."},
            {"locus": "s=-2,-4,-6,...", "rule": "Simple trivial zeta zeros cancel simple Gamma(s/2) poles; they are not xi zeros."},
            {"locus": "s=1", "rule": "The simple zeta pole is removed by s-1; xi(1)=1/2."},
            {"locus": "s=0", "rule": "The factor s removes the Gamma(s/2) pole; xi(0)=1/2."},
        ],
        "pointConversion": exceptional or {"classification": "REGULAR_POINT_OR_INPUT_RECTANGLE", "exceptionalLociRequireTheListedAnalyticLimits": True},
        "finiteEulerProductCanReplaceZeta": False,
        "primarySource": "https://dlmf.nist.gov/25.4",
    }


def elliptic_normalization_ledger(s, *, conductor, root_number, all_bad_factors=True):
    if type(conductor) is not int or conductor < 1 or type(root_number) is not int or root_number not in (-1, 1) or all_bad_factors is not True:
        raise ValueError("The completed elliptic normalization requires all local factors, a conductor and a root number")
    point = _point(s)
    trivial = point is not None and point[1] == 0 and point[0].denominator == 1 and point[0] <= 0
    return {
        "schema": "MathScope.P7.CompletedNormalizationLedger/1", "sourceFunction": "L(E,s)", "targetFunction": "Lambda(E,s)",
        "input": s, "conductor": conductor, "rootNumber": root_number, "allBadFactorsIncluded": True,
        "forward": "Lambda(E,s)=N^(s/2)*(2*pi)^(-s)*Gamma(s)*L(E,s)=c^(-s)*Gamma(s)*L(E,s)",
        "inverse": "L(E,s)=c^s*rgamma(s)*Lambda(E,s), c=2*pi/sqrt(N)",
        "completedFunctionalEquation": "Lambda(E,s)=w*Lambda(E,2-s)",
        "zeroPoleRules": [
            {"locus": "s outside nonpositive integers", "rule": "The normalizer is finite and nonzero; L and Lambda zero multiplicities agree."},
            {"locus": "s=0,-1,-2,...", "rule": "Simple trivial L zeros cancel simple Gamma(s) poles. Lambda is nonzero there by the functional equation and the nonvanishing Euler product at s=2,3,4,..."},
            {"locus": "all finite s", "rule": "The complete weight-two newform Lambda is entire; L has no finite pole."},
        ],
        "pointConversion": {"classification": "TRIVIAL_L_ZERO_CANCELS_GAMMA_POLE" if trivial else "REGULAR_COMPLETED_CONVERSION",
                            "reciprocalGammaUsedToAvoidPoleDivision": True, "trivialLZeroForcedExactly": trivial},
        "goodOnlySeriesWouldBe": "L^S(E,s); its removed bad factors must be restored before using this completed functional equation",
        "theoremDependencies": ["modularity over Q", "complete local Euler factors", "weight-two Mellin transform", "Euler-product nonvanishing in Re(s)>3/2"],
        "primarySource": "https://www.jmilne.org/math/Books/EC2.pdf",
    }
