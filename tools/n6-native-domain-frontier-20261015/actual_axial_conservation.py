"""Exact conditional axial conservation algebra; no actual-source discharge.

The profiles in this module are arbitrary symbolic functions.  A separate source
binder must authenticate their bodies, signs and normalizations before these
identities can be applied to the original serialized graph.  In particular,
continuity, endpoint fluxes, zero moments and analytic regularity are premises,
not consequences of a successful algebra check.
"""
from __future__ import annotations

import argparse
from functools import lru_cache
import json
from pathlib import Path

import sympy as S


def exact(expression):
    """Normalize a rational differential-polynomial expression exactly."""
    return S.cancel(S.together(expression.doit()))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def symbolic_model(profiles=None):
    """Retain the original source constants and the full order-one formula."""
    X, eta, h, lam = S.symbols("X eta h lambda1", real=True)
    A = S.Rational(1, 2) + h
    D = 1 - A
    d = 1 - eta**2
    L = 1 - 2*h*eta**2
    c = -A
    if profiles is None:
        profiles = {name: S.Function(name)(X, eta)
                    for name in ("U0", "v0", "U1", "v1", "Pi1")}
    U0, v0, U1, v1, Pi1 = (profiles[name] for name in
                            ("U0", "v0", "U1", "v1", "Pi1"))

    def Z(alpha, f):
        return (2*eta*(alpha*f-X*S.diff(f, X))+d*S.diff(f, eta))/L

    def T(alpha, f):
        return (-alpha*f+D*eta*S.diff(f, eta)+X*S.diff(f, X))/L

    C0 = S.diff(X*v0, X) + Z(c, U0)
    C1 = S.diff(X*v1, X) + Z(c+lam, U1)
    axial_viscosity = -2*(X*S.diff(U1, X, 2)+S.diff(U1, X))
    leading_axial_viscosity = -Z(c-D, Z(c, U0))
    raw = (T(c+lam, U1) + X*v0*S.diff(U1, X)
           + U0*Z(c+lam, U1) + X*v1*S.diff(U0, X)
           + U1*Z(c, U0) + Z(2*c+lam, Pi1)
           + axial_viscosity + leading_axial_viscosity)
    radial_flux = X*(v0*U1+v1*U0)-2*X*S.diff(U1, X)
    conserved = (T(c+lam, U1) + S.diff(radial_flux, X)
                 + Z(2*c+lam, 2*U0*U1+Pi1)
                 + leading_axial_viscosity)
    return dict(X=X, eta=eta, h=h, lam=lam, A=A, D=D, d=d, L=L, c=c,
                profiles=profiles, Z=Z, T=T, C0=C0, C1=C1, raw=raw,
                conserved=conserved, radial_flux=radial_flux,
                axial_viscosity=axial_viscosity,
                leading_axial_viscosity=leading_axial_viscosity)


def radial_antiderivative_checks(model):
    """Check derivatives of candidate primitives, without an FTC assertion."""
    X, eta, D, d, L = (model[k] for k in ("X", "eta", "D", "d", "L"))
    alpha = S.Symbol("alpha", real=True)
    Q = S.Function("Q")(X, eta)
    f = S.diff(Q, X)
    T_primitive = (-(alpha+1)*Q+D*eta*S.diff(Q, eta)+X*f)/L
    Z_primitive = (2*eta*(alpha+1)*Q+d*S.diff(Q, eta)-2*eta*X*f)/L
    checks = {
        "TPrimitiveDerivativeResidual": exact(S.diff(T_primitive, X)-model["T"](alpha, f)),
        "ZPrimitiveDerivativeResidual": exact(S.diff(Z_primitive, X)-model["Z"](alpha, f)),
    }
    require(all(value == 0 for value in checks.values()),
            "The exact radial antiderivative identities changed")
    return {
        "exactChecks": {key: str(value) for key, value in checks.items()},
        "TPrimitive": str(T_primitive), "ZPrimitive": str(Z_primitive),
        "conditionalDefiniteIdentities": {
            "T": "integral_a^b T_alpha(f) dX = (-(alpha+1)*M + D*eta*M_eta + [X*f]_a^b)/L",
            "Z": "integral_a^b Z_alpha(f) dX = (2*eta*(alpha+1)*M + d*M_eta - 2*eta*[X*f]_a^b)/L",
            "M": "M(eta)=integral_a^b f(X,eta) dX",
        },
        "scope": "Only derivatives of candidate primitives are checked here. The definite identities additionally require their analytic hypotheses.",
        "remainingDefiniteIdentityPremises": [
            "Finite radial bounds a<b that are independent of eta, and L!=0.",
            "A genuine primitive Q_X=f with the required joint differentiability on the complete radial interval.",
            "The fundamental theorem of calculus and differentiation under the integral for M_eta; no source integrability or interchange is proved here.",
            "Retain both actual endpoint flux terms [X*f]_a^b unless separately proved zero.",
        ],
    }


def signed_primitive_checks():
    """Signed axial stresses agree exactly when their full moment vanishes."""
    X = S.Symbol("X", positive=True)
    Qx, Qa, Qb = S.symbols("Q_Xvalue Q_avalue Q_bvalue", real=True)
    radius = S.sqrt(2*X)
    forward = -(Qx-Qa)/radius
    backward = (Qb-Qx)/radius
    total = Qb-Qa
    residual = exact(forward-backward+total/radius)
    inverse_check = exact(radius*(forward-backward)+total)
    require(residual == 0 and inverse_check == 0,
            "Signed forward/backward moment identity changed")
    return {
        "forward": str(forward), "backward": str(backward),
        "difference": str(exact(forward-backward)),
        "exactDifferenceResidual": str(residual),
        "exactRecoverMomentResidual": str(inverse_check),
        "iff": "For X>0 and genuine finite primitives, forward=backward iff integral_a^b f=0.",
        "densityFlatnessImpliesZeroMoment": False,
    }


def compact_nonzero_moment_counterexample():
    """Supply a C-infinity compact bump, with a positive exact mass bound.

    If rho(t)=exp(-1/t) for t>0 and zero otherwise, every derivative on
    t>0 has the form exp(-1/t)*P_n(1/t).  The polynomial recurrence and
    exponential monomial limit below prove all endpoint jets vanish.
    The product rho(X-1)*rho(2-X) is compact and positive on (1,2).
    """
    t, w = S.symbols("t w", positive=True)
    degree = S.Symbol("m", integer=True, nonnegative=True)
    P = S.Function("P")
    recurrence = exact(
        S.diff(S.exp(-1/t)*P(1/t), t)
        - S.exp(-1/t)/t**2*(P(1/t)-S.diff(P(w), w).subs(w, 1/t)))
    decay = S.limit(w**degree*S.exp(-w), w, S.oo)
    require(recurrence == 0 and decay == 0,
            "Flat-bump polynomial recurrence or exponential decay changed")
    lower_bound = S.exp(-8)/2
    require(lower_bound.is_positive is True, "The compact bump mass bound must be positive")
    X = S.Symbol("X", real=True)
    polynomial = (X-1)**4*(2-X)**4
    polynomial_mass = S.integrate(polynomial, (X, 1, 2))
    require(polynomial_mass == S.Rational(1, 630), "Exact finite-jet counterexample mass")
    return {
        "smoothBump": "f(X)=rho(X-1)*rho(2-X), rho(t)=exp(-1/t) for t>0 and 0 for t<=0",
        "support": "[1,2]", "allEndpointJetsVanish": True,
        "polynomialRecurrence": "P_0(w)=1; P_(n+1)(w)=w^2*(P_n(w)-P_n'(w))",
        "recurrenceDerivativeResidual": str(recurrence),
        "allMonomialDecay": str(decay),
        "massLowerBound": str(lower_bound),
        "massBoundReason": "On [5/4,7/4], both positive arguments of rho are >=1/4, so each rho>=exp(-4); integrate over the interval of length 1/2.",
        "conclusion": "All density endpoint jets can vanish while the total moment is strictly positive. The signed primitive joins then fail.",
        "finiteJetPolynomialControl": {
            "density": "(X-1)^4*(2-X)^4 on [1,2], zero outside",
            "zeroExtensionRegularity": "C^3; not C-infinity",
            "exactTotalMoment": str(polynomial_mass),
        },
        "actualSourceCounterexample": False,
    }


def negative_controls(model):
    """Reject four exact mutations; a rational witness proves nonidentity."""
    X, eta = model["X"], model["eta"]
    U0, U1, v1, Pi1 = (model["profiles"][k] for k in ("U0", "U1", "v1", "Pi1"))
    correction = U1*model["C0"]+U0*model["C1"]
    mutations = {
        "omittedCrossAdvection": model["raw"]-X*v1*S.diff(U0, X)-model["conserved"]+correction,
        "wrongPressureCoefficient": model["raw"]+model["Z"](2*model["c"]+model["lam"], Pi1)-model["conserved"]+correction,
        "omittedAxialViscosity": model["raw"]-model["axial_viscosity"]-model["conserved"]+correction,
        "omittedOrderOneContinuityTerm": model["raw"]-model["conserved"]+U1*model["C0"],
    }
    expected = {
        "omittedCrossAdvection": -X*v1*S.diff(U0, X),
        "wrongPressureCoefficient": model["Z"](2*model["c"]+model["lam"], Pi1),
        "omittedAxialViscosity": -model["axial_viscosity"],
        "omittedOrderOneContinuityTerm": -U0*model["C1"],
    }
    replacements = {
        "U0": 1+X+eta+X*eta,
        "U1": 2+X**2+eta**2,
        "v0": 1+X*eta,
        "v1": 2+X+eta,
        "Pi1": 3+X*eta+eta**2,
    }
    substitutions = {model["profiles"][name]: value for name, value in replacements.items()}
    point = {X: S.Rational(3, 2), eta: S.Rational(1, 3),
             model["h"]: S.Rational(1, 10), model["lam"]: S.Rational(1, 7)}
    require(exact(model["L"].subs(point)) != 0, "Control witness is outside the L domain")
    results = {}
    for name, expression in mutations.items():
        residual = exact(expression)
        require(exact(residual-expected[name]) == 0, "Mutation residual mismatch: "+name)
        witness = exact(residual.subs(substitutions, simultaneous=True).doit().subs(point))
        require(witness.is_Rational and witness != 0, "Mutation lacks a nonzero rational witness: "+name)
        results[name] = {
            "rejected": True, "exactResidual": str(residual),
            "exactRationalWitness": str(witness),
        }
    return {
        "controls": results,
        "witnessProfiles": {name: str(value) for name, value in replacements.items()},
        "witnessPoint": {str(key): str(value) for key, value in point.items()},
    }


@lru_cache(maxsize=1)
def derive():
    model = symbolic_model()
    U0, U1 = (model["profiles"][key] for key in ("U0", "U1"))
    conservation_residual = exact(model["raw"]-model["conserved"]
                                  +U1*model["C0"]+U0*model["C1"])
    require(conservation_residual == 0, "Full axial conservation identity changed")
    return {
        "sourceFormulaIdentity": "raw-conserved=-U1*C0-U0*C1",
        "exactConservationResidual": str(conservation_residual),
        "constants": {key: str(model[key]) for key in ("A", "D", "d", "L", "c")},
        "operatorDefinitions": {
            "Z_alpha": "(2*eta*(alpha*f-X*f_X)+(1-eta^2)*f_eta)/L",
            "T_alpha": "(-alpha*f+D*eta*f_eta+X*f_X)/L",
            "C_i": "partial_X(X*v_i)+Z_(c+i*lambda1)(U_i), i=0,1",
        },
        "rawFormula": str(model["raw"]),
        "conservedFormula": str(model["conserved"]),
        "radialFlux": str(model["radial_flux"]),
        "radialAntiderivatives": radial_antiderivative_checks(model),
        "signedPrimitives": signed_primitive_checks(),
        "compactCounterexample": compact_nonzero_moment_counterexample(),
        "strictNegativeControls": negative_controls(model),
    }


def build_artifact():
    return {
        "schema": "MathScope.N6.ActualAxialConservationAlgebra/1",
        "scope": "Exact conditional symbolic algebra for the supplied source formula; arbitrary symbolic profiles, with no actual source bindings composed.",
        **derive(),
        "actualSourceBindingsComposed": False,
        "actualContinuityComposed": False,
        "actualZeroMassAndFluxMomentsProved": False,
        "actualPrimitiveJoinsProved": False,
        "actualGlobalRegularityComposed": False,
        "originalFrontier": {"jets": 230, "guards": 10, "PDEObligations": 1020, "total": 1260},
        "newOriginalGuardsDischarged": 0,
        "newOriginalJetsDischarged": 0,
        "newOriginalPDETermsDischarged": 0,
        "remainingActualPremises": [
            "Authenticate the literal native1 axial residual registry body, operator arguments, signs, normalization, and original leading/order-one source correspondence.",
            "Establish actual C0=C1=0 with the complete leading and order-one profiles, not metadata flags.",
            "Prove the original positive ordered finite radial bounds a<b and L!=0 on the actual domain.",
            "Establish joint regularity of the actual density and required eta/X derivatives on the full compact interval, finite integrals, and every required integral/parameter derivative interchange.",
            "Prove actual inner and outer collar vanishing and endpoint jets with the correct axial component support; density flatness alone gives no zero total moment.",
            "Derive the actual zero mass, nonlinear flux and pressure moment equations and endpoint radial fluxes from the original five-moment solve and conserved identity, for every required eta.",
            "Prove the total actual weighted residual integral and its required parameter derivatives vanish before identifying forward/backward primitives and gluing their fixed mixed jets.",
        ],
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args(argv)
    result = build_artifact()
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"exactConservationResidual": result["exactConservationResidual"],
                      "actualSourceBindingsComposed": False,
                      "newOriginalDischarged": 0}))


if __name__ == "__main__":
    main()
