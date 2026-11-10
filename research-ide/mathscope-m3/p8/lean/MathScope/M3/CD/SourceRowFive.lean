import Mathlib.Data.Real.Basic
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.Linarith
import Mathlib.Tactic.Ring

/-!
# Order-one axial source row: scalar algebra certificate

The companion authenticated Python checker compares each coefficient of the
original system-0 row 5 and each of the eight terms of raw source #117045 with
the scalar expressions below. This file proves the relation between those
expressions. It does not implement or interpret the source graph in Lean.

In particular, the fields below are independent real numbers, not derivatives
whose analytic existence has been proved. The substitution X = xi^2 is the
inner-profile variable, and is distinct from the manuscript identity X = R^2/2.
All statements here are for order one, lambda_1 = 2h.
-/

namespace MathScope.M3.CD.SourceRowFive
noncomputable section

/-- Values and jets at one putative source point. `W` represents U_xi and
`Uxx` represents U_xixi. The two meanings are explicit substitution obligations,
not consequences of this scalar structure. -/
structure Jet where
  xi : ℝ
  eta : ℝ
  h : ℝ
  F0 : ℝ
  U0 : ℝ
  v0 : ℝ
  U0X : ℝ
  U0Eta : ℝ
  Omega : ℝ
  Visc : ℝ
  F : ℝ
  U : ℝ
  K : ℝ
  P : ℝ
  W : ℝ
  Uxx : ℝ
  UEta : ℝ
  KEta : ℝ
  PEta : ℝ

private def A (j : Jet) : ℝ := 1 / 2 + j.h
private def D (j : Jet) : ℝ := 1 / 2 - j.h
private def L (j : Jet) : ℝ := 1 - 2 * j.h * j.eta ^ 2
private def delta (j : Jet) : ℝ := 1 - j.eta ^ 2
private def gamma (j : Jet) : ℝ := -A j + 2 * j.h
private def pressureWeight (j : Jet) : ℝ := -2 * A j + 2 * j.h

/-- The source #29440 is the radial *factor*. The manuscript radial
coefficient V_1 is X times this factor. Here the average has been replaced by
U+K, and its eta derivative by U_eta+K_eta. -/
def radialFactor (j : Jet) : ℝ :=
  (2 * j.eta * j.U - 2 * j.eta * (D j + 2 * j.h) * (j.U + j.K)
    - delta j * (j.UEta + j.KEta)) / L j

private def leadingZ (j : Jet) : ℝ :=
  (2 * j.eta * (-A j * j.U0 - j.xi ^ 2 * j.U0X)
    + delta j * j.U0Eta) / L j

/-- The eight source summands of raw #117045 after the explicit substitutions

X=xi^2, U_X=W/(2xi), U_XX=(Uxx-W/xi)/(4xi^2),
Pi_X=2F0*F-Omega/2, source lower viscosity=Visc,
and equality of the actual and Picard leading profiles and their used jets.

This definition does not assert that these substitutions hold for native calls.
-/
def pulledBackRaw (j : Jet) : ℝ :=
  (-gamma j * j.U + D j * j.eta * j.UEta
      + j.xi ^ 2 * (j.W / (2 * j.xi))) / L j
    + j.xi ^ 2 * j.v0 * (j.W / (2 * j.xi))
    + j.U0 * ((2 * j.eta * (gamma j * j.U
        - j.xi ^ 2 * (j.W / (2 * j.xi)))
      + delta j * j.UEta) / L j)
    + j.xi ^ 2 * radialFactor j * j.U0X
    + j.U * leadingZ j
    + (2 * j.eta * (pressureWeight j * j.P
        - j.xi ^ 2 * (2 * j.F0 * j.F - j.Omega / 2))
      + delta j * j.PEta) / L j
    - 2 * (j.xi ^ 2 * ((j.Uxx - j.W / j.xi) / (4 * j.xi ^ 2))
      + j.W / (2 * j.xi))
    - j.Visc

/-- The source system-0 row 5 expression A0*u+A1*u_eta+forcing,
with all twelve stored coefficients (including the literal zeros) projected
onto [F,U,K,P,0,W] and [0,U_eta,K_eta,P_eta,0,0]. -/
def sourceRowFive (j : Jet) : ℝ :=
  (-8 * j.eta * j.xi ^ 2 * j.F0 / L j) * j.F
    + (2 * gamma j * (2 * j.eta * j.U0 - 1) / L j
      + 4 * j.eta * (A j - 2 * j.h) * (j.xi ^ 2 * j.U0X) / L j
      + 2 * leadingZ j) * j.U
    + (-4 * j.eta * (D j + 2 * j.h) * (j.xi ^ 2 * j.U0X) / L j) * j.K
    + (4 * pressureWeight j * j.eta / L j) * j.P
    + (j.xi / L j + j.xi * j.v0 - 2 * j.eta * j.xi * j.U0 / L j) * j.W
    + (2 * (D j * j.eta + delta j * j.U0
      - delta j * (j.xi ^ 2 * j.U0X)) / L j) * j.UEta
    + (-2 * delta j * (j.xi ^ 2 * j.U0X) / L j) * j.KEta
    + (2 * delta j / L j) * j.PEta
    - 2 * j.Visc - 4 * j.eta * j.xi ^ 2 * (-j.Omega / 2) / L j

set_option maxHeartbeats 2000000 in
/-- Exact algebraic bridge. The xi=0 axis and L=0 are explicitly excluded.
No Picard convergence, ODE satisfaction, cutoff, or moment claim occurs here. -/
theorem raw_row_identity (j : Jet) (hxi : j.xi ≠ 0)
    (hL : 1 - 2 * j.h * j.eta ^ 2 ≠ 0) :
    2 * pulledBackRaw j = -j.Uxx - j.W / j.xi + sourceRowFive j := by
  dsimp only [pulledBackRaw, sourceRowFive, radialFactor, leadingZ,
    gamma, pressureWeight, A, D, L, delta]
  field_simp [hxi, hL]
  <;> ring

/-- The inner raw residual vanishes if the actual profile satisfies the
radial row equation and every substitution encoded in `pulledBackRaw` is valid.
The latter analytic/source obligations are not proved by this theorem. -/
theorem raw_zero_of_row_equation (j : Jet) (hxi : j.xi ≠ 0)
    (hL : 1 - 2 * j.h * j.eta ^ 2 ≠ 0)
    (hrow : j.Uxx + j.W / j.xi = sourceRowFive j) :
    pulledBackRaw j = 0 := by
  have h := raw_row_identity j hxi hL
  linarith

/-- On the scalar substitutions, the zero raw residual and the radial
row equation are equivalent. This does not assume the row is actually solved. -/
theorem raw_zero_iff_row_equation (j : Jet) (hxi : j.xi ≠ 0)
    (hL : 1 - 2 * j.h * j.eta ^ 2 ≠ 0) :
    pulledBackRaw j = 0 ↔ j.Uxx + j.W / j.xi = sourceRowFive j := by
  have h := raw_row_identity j hxi hL
  constructor <;> intro hz <;> linarith

end
end MathScope.M3.CD.SourceRowFive

#print axioms MathScope.M3.CD.SourceRowFive.raw_row_identity
#print axioms MathScope.M3.CD.SourceRowFive.raw_zero_of_row_equation
#print axioms MathScope.M3.CD.SourceRowFive.raw_zero_iff_row_equation
