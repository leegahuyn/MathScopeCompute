import Mathlib.Basic.Real.Basic
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.Ring

/-!
Scalar certificates for the ACTUAL natural sourceFromState first integrals.
The companion n1-leading-B source packet binds these formulas to original
B.26 controls. The primitive X laws and ordinary derivative meanings have
already been substituted into the displayed derivatives. No native value,
ODE satisfaction, axis constant, or natural-axis existence is inferred here.
-/

namespace MathScope.M3.CD.SourceNaturalFirstIntegrals
noncomputable section

structure Jet where
  X : ℝ
  eta : ℝ
  h : ℝ
  F : ℝ
  Fx : ℝ
  Fxx : ℝ
  Fe : ℝ
  U : ℝ
  Ux : ℝ
  Uxx : ℝ
  Ue : ℝ
  P : ℝ
  Pe : ℝ
  M : ℝ
  Me : ℝ
  I : ℝ
  Ie : ℝ
  J : ℝ
  Je : ℝ
  S : ℝ
  Se : ℝ

private def A (j : Jet) : ℝ := 1 / 2 + j.h
private def D (j : Jet) : ℝ := 1 / 2 - j.h
private def L (j : Jet) : ℝ := 1 - 2 * j.h * j.eta ^ 2
private def delta (j : Jet) : ℝ := 1 - j.eta ^ 2
private def W (j : Jet) : ℝ :=
  1 - (2 * D j * j.eta * j.M + delta j * j.Me) / j.X
private def Wx (j : Jet) : ℝ :=
  -(2 * D j * j.eta * j.U + delta j * j.Ue) / j.X
  + (2 * D j * j.eta * j.M + delta j * j.Me) / j.X ^ 2
private def v (j : Jet) : ℝ := (W j - 1 + 2 * j.eta * j.U) / L j
private def T (j : Jet) (b f fx fe : ℝ) : ℝ :=
  (-b * f + j.X * fx + D j * j.eta * fe) / L j
private def Z (j : Jet) (b f fx fe : ℝ) : ℝ :=
  (2 * j.eta * (b * f - j.X * fx) + delta j * fe) / L j

def angularMoment (j : Jet) : ℝ :=
  (1 - j.h) * j.I - D j * j.eta * j.Ie - delta j * j.Je
  + 2 * (j.h - D j) * j.eta * j.J
def angularMomentX (j : Jet) : ℝ :=
  2 * j.X * ((1 - j.h) * j.F - D j * j.eta * j.Fe
    - delta j * (j.Ue * j.F + j.U * j.Fe)
    + 2 * (j.h - D j) * j.eta * j.U * j.F)

def rawTheta (j : Jet) : ℝ :=
  T j (-A j - 1 / 2) j.F j.Fx j.Fe
  + v j * (j.X * j.Fx + j.F)
  + j.U * Z j (-A j - 1 / 2) j.F j.Fx j.Fe
  - 2 * (j.X * j.Fxx + 2 * j.Fx)
def rawZ (j : Jet) : ℝ :=
  T j (-A j) j.U j.Ux j.Ue + j.X * v j * j.Ux
  + j.U * Z j (-A j) j.U j.Ux j.Ue
  + Z j (-2 * A j) j.P (j.F ^ 2) j.Pe
  - 2 * (j.X * j.Uxx + j.Ux)

def Ctheta (j : Jet) : ℝ :=
  angularMoment j - 2 * j.X ^ 2 * j.F * W j
  + 4 * L j * j.X ^ 2 * j.Fx
def CthetaX (j : Jet) : ℝ :=
  angularMomentX j - 4 * j.X * j.F * W j
  - 2 * j.X ^ 2 * j.Fx * W j - 2 * j.X ^ 2 * j.F * Wx j
  + 4 * L j * (2 * j.X * j.Fx + j.X ^ 2 * j.Fxx)

private def axialMoment (j : Jet) : ℝ :=
  D j * (j.M - j.eta * j.Me) + 4 * j.h * j.eta * j.S - delta j * j.Se
private def axialMomentX (j : Jet) : ℝ :=
  D j * (j.U - j.eta * j.Ue)
  + 4 * j.h * j.eta * (j.U ^ 2 - j.X * j.F ^ 2)
  - delta j * (2 * j.U * j.Ue - 2 * j.X * j.F * j.Fe)
def Ns (j : Jet) : ℝ :=
  -W j * j.U + axialMoment j / j.X + 4 * A j * j.eta * j.P - delta j * j.Pe
def Cz (j : Jet) : ℝ := j.X * Ns j + 2 * L j * j.X * j.Ux
def CzX (j : Jet) : ℝ :=
  -W j * j.U - j.X * Wx j * j.U - j.X * W j * j.Ux
  + axialMomentX j + (4 * A j * j.eta * j.P - delta j * j.Pe)
  + j.X * (4 * A j * j.eta * j.F ^ 2 - 2 * delta j * j.F * j.Fe)
  + 2 * L j * (j.Ux + j.X * j.Uxx)

set_option maxHeartbeats 4000000 in
theorem natural_angular_first_integral_derivative (j : Jet)
    (hX : j.X ≠ 0) (hL : 1 - 2 * j.h * j.eta ^ 2 ≠ 0) :
    CthetaX j = -2 * j.X * L j * rawTheta j := by
  dsimp only [CthetaX, angularMomentX, rawTheta, v, W, Wx, T, Z, A, D, L, delta]
  field_simp [hX, hL]
  ring

set_option maxHeartbeats 4000000 in
theorem natural_axial_first_integral_derivative (j : Jet)
    (hX : j.X ≠ 0) (hL : 1 - 2 * j.h * j.eta ^ 2 ≠ 0) :
    CzX j = -L j * rawZ j := by
  dsimp only [CzX, axialMomentX, rawZ, v, W, Wx, T, Z, A, D, L, delta]
  field_simp [hX, hL]
  ring

def sourceP1 (j : Jet) : ℝ :=
  j.X * (-W j + angularMoment j / (2 * j.X ^ 2 * j.F)) / L j
def sourceNs (j : Jet) : ℝ := Ns j / L j

set_option maxHeartbeats 2000000 in
theorem source_p1_mode_defect (j : Jet)
    (hX : j.X ≠ 0) (hL : 1 - 2 * j.h * j.eta ^ 2 ≠ 0) (hF : j.F ≠ 0) :
    2 * L j * j.X * j.F * (sourceP1 j + 2 * j.X * j.Fx / j.F) = Ctheta j := by
  dsimp only [sourceP1, Ctheta, angularMoment, W, A, D, L, delta]
  field_simp [hX, hL, hF]
  ring

set_option maxHeartbeats 2000000 in
theorem source_ns_mode_defect (j : Jet)
    (hX : j.X ≠ 0) (hL : 1 - 2 * j.h * j.eta ^ 2 ≠ 0) :
    j.X * L j * (sourceNs j + 2 * j.Ux) = Cz j := by
  dsimp only [sourceNs, Cz, Ns, axialMoment, W, A, D, L, delta]
  field_simp [hX, hL]

end
end MathScope.M3.CD.SourceNaturalFirstIntegrals

#print axioms MathScope.M3.CD.SourceNaturalFirstIntegrals.natural_angular_first_integral_derivative
#print axioms MathScope.M3.CD.SourceNaturalFirstIntegrals.natural_axial_first_integral_derivative
#print axioms MathScope.M3.CD.SourceNaturalFirstIntegrals.source_p1_mode_defect
#print axioms MathScope.M3.CD.SourceNaturalFirstIntegrals.source_ns_mode_defect
