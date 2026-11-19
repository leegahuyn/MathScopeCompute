import Mathlib.Data.Real.Basic
import Mathlib.Tactic.FieldSimp
import Mathlib.Tactic.Ring

/-!
The actual n=1 source coefficient and its seven radial flux terms.

The companion Python check binds these scalar expressions to original raw
source #117045, with legacy #672/#117047 and all three source integral frames.
These real numbers are putative ordinary profile jets. Existence of those
jets, mixed commutation, native limits, fixed-cutoff gluing, actual continuity,
and boundary vanishing are separate analytic/source obligations.
-/

namespace MathScope.M3.CD.AxialSourceSevenFlux
noncomputable section

structure Jet where
  X : ℝ
  eta : ℝ
  h : ℝ
  u0 : ℝ
  u0x : ℝ
  u0e : ℝ
  u0xx : ℝ
  u0xe : ℝ
  u0ee : ℝ
  u1 : ℝ
  u1x : ℝ
  u1e : ℝ
  u1xx : ℝ
  v0 : ℝ
  v0x : ℝ
  v1 : ℝ
  v1x : ℝ
  p : ℝ
  px : ℝ
  pe : ℝ
  pxe : ℝ

private def A (j : Jet) : ℝ := 1 / 2 + j.h
private def D (j : Jet) : ℝ := 1 / 2 - j.h
private def L (j : Jet) : ℝ := 1 - 2 * j.h * j.eta ^ 2
private def delta (j : Jet) : ℝ := 1 - j.eta ^ 2
private def c (j : Jet) : ℝ := -A j
private def a (j : Jet) : ℝ := c j + 2 * j.h
private def b (j : Jet) : ℝ := -2 * A j + 2 * j.h

private def Z (j : Jet) (w f fx fe : ℝ) : ℝ :=
  (2 * j.eta * (w * f - j.X * fx) + delta j * fe) / L j
private def T (j : Jet) (w f fx fe : ℝ) : ℝ :=
  (-w * f + j.X * fx + D j * j.eta * fe) / L j
private def Zbar (j : Jet) (w f fe : ℝ) : ℝ :=
  (2 * w * j.eta * f + delta j * fe) / L j
private def Tbar (j : Jet) (w f fe : ℝ) : ℝ :=
  (-w * f + D j * j.eta * fe) / L j

private def leadingZ (j : Jet) : ℝ := Z j (c j) j.u0 j.u0x j.u0e
private def leadingZx (j : Jet) : ℝ :=
  (2 * j.eta * (c j * j.u0x - j.u0x - j.X * j.u0xx)
    + delta j * j.u0xe) / L j
private def leadingZe (j : Jet) : ℝ :=
  (2 * (c j * j.u0 - j.X * j.u0x)
    + 2 * j.eta * (c j * j.u0e - j.X * j.u0xe)
    - 2 * j.eta * j.u0e + delta j * j.u0ee) / L j
  + (2 * j.eta * (c j * j.u0 - j.X * j.u0x) + delta j * j.u0e)
    * (4 * j.h * j.eta) / (L j) ^ 2
private def lowerBar (j : Jet) : ℝ := Zbar j (D j) j.u0 j.u0e
private def lowerBarE (j : Jet) : ℝ :=
  (2 * D j * j.u0 + 2 * D j * j.eta * j.u0e
    - 2 * j.eta * j.u0e + delta j * j.u0ee) / L j
  + (2 * D j * j.eta * j.u0 + delta j * j.u0e)
    * (4 * j.h * j.eta) / (L j) ^ 2

/-- Original n=1 advective axial coefficient, including the shifted SECOND
physical axial derivative of the leading U0. -/
def raw (j : Jet) : ℝ :=
  T j (a j) j.u1 j.u1x j.u1e
  + j.X * j.v0 * j.u1x + j.u0 * Z j (a j) j.u1 j.u1x j.u1e
  + j.X * j.v1 * j.u0x + j.u1 * leadingZ j
  + Z j (b j) j.p j.px j.pe
  - 2 * (j.X * j.u1xx + j.u1x)
  - Z j (c j - D j) (leadingZ j) (leadingZx j) (leadingZe j)

/-- n=1 has nu=2h and mu=0. The previous axial mass is the LEADING mass. -/
def momentDensity (j : Jet) : ℝ :=
  Tbar j (D j + 2 * j.h) j.u1 j.u1e
  + Zbar j 0 (2 * j.u0 * j.u1 - j.X * j.px)
      (2 * (j.u0e * j.u1 + j.u0 * j.u1e) - j.X * j.pxe)
  - Zbar j 0 (lowerBar j) (lowerBarE j)

private def H (j : Jet) : ℝ := j.v0 * j.u1 + j.v1 * j.u0
private def Hx (j : Jet) : ℝ :=
  j.v0x * j.u1 + j.v0 * j.u1x + j.v1x * j.u0 + j.v1 * j.u0x
private def Q (j : Jet) : ℝ := 2 * j.u0 * j.u1
private def Qx (j : Jet) : ℝ := 2 * (j.u0x * j.u1 + j.u0 * j.u1x)
private def lastFluxX (j : Jet) : ℝ :=
  2 * j.eta * (j.u0 + j.X * j.u0x) / L j
private def lastFluxXE (j : Jet) : ℝ :=
  (2 * (j.u0 + j.X * j.u0x)
    + 2 * j.eta * (j.u0e + j.X * j.u0xe)) / L j
  + 2 * j.eta * (j.u0 + j.X * j.u0x)
    * (4 * j.h * j.eta) / (L j) ^ 2

/-- Ordinary radial derivative of ALL SEVEN source boundary flux terms,
including the positive pressure integration-by-parts boundary. -/
def sevenFluxDerivative (j : Jet) : ℝ :=
  (j.u1 + j.X * j.u1x) / L j
  + H j + j.X * Hx j
  - 2 * j.eta * ((Q j + j.p) + j.X * (Qx j + j.px)) / L j
  + Zbar j 0 (j.p + j.X * j.px) (j.pe + j.X * j.pxe)
  - 2 * (j.u1x + j.X * j.u1xx)
  + 2 * j.eta * (leadingZ j + j.X * leadingZx j) / L j
  + Zbar j 0 (lastFluxX j) (lastFluxXE j)

def continuity0 (j : Jet) : ℝ := j.v0 + j.X * j.v0x + leadingZ j
def continuity1 (j : Jet) : ℝ :=
  j.v1 + j.X * j.v1x + Z j (a j) j.u1 j.u1x j.u1e

set_option maxHeartbeats 4000000 in
theorem source_n1_seven_flux_with_defects (j : Jet)
    (hL : 1 - 2 * j.h * j.eta ^ 2 ≠ 0) :
    raw j = momentDensity j + sevenFluxDerivative j
      - (j.u1 * continuity0 j + j.u0 * continuity1 j) := by
  dsimp only [raw, momentDensity, sevenFluxDerivative, continuity0, continuity1,
    leadingZ, leadingZx, leadingZe, lowerBar, lowerBarE,
    H, Hx, Q, Qx, lastFluxX, lastFluxXE,
    T, Z, Tbar, Zbar, a, b, c, A, D, L, delta]
  field_simp [hL]
  <;> ring

/-- Source stream identities, rather than moment cancellation, must remove
both distinct ordered-pair defects. -/
theorem source_n1_seven_flux_of_continuity (j : Jet)
    (hL : 1 - 2 * j.h * j.eta ^ 2 ≠ 0)
    (h0 : continuity0 j = 0) (h1 : continuity1 j = 0) :
    raw j = momentDensity j + sevenFluxDerivative j := by
  rw [source_n1_seven_flux_with_defects j hL, h0, h1]
  ring

end
end MathScope.M3.CD.AxialSourceSevenFlux

#print axioms MathScope.M3.CD.AxialSourceSevenFlux.source_n1_seven_flux_with_defects
#print axioms MathScope.M3.CD.AxialSourceSevenFlux.source_n1_seven_flux_of_continuity
