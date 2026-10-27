import Mathlib
/-! Five original scaled moment identities; source integral membership is OPEN. -/
namespace MathScope.M3.CD
noncomputable section
private def axisU0 (m₀ R : ℝ) : ℝ := -m₀ / R
private def axisU1 (m₀ m₃ R ef ru lam : ℝ) : ℝ :=
  (axisU0 m₀ R + m₃ / (ef * ru)) / (2 * lam)
private def axisE0 (m₁ R2 : ℝ) : ℝ := -m₁ / R2
private def axisE1 (m₂ ef rp : ℝ) : ℝ := -m₂ / (2 * ef * rp)
private def axisE2 (m₄ ef rz : ℝ) : ℝ := m₄ / (ef * rz)

/-- Conditional physical moment identities, not the original integral estimates. -/
theorem five_physical_moment_cancellation
    (m₀ m₁ m₂ m₃ m₄ R R2 ef ru rp rz lam : ℝ)
    (hR : R ≠ 0) (hR2 : R2 ≠ 0) (hef : ef ≠ 0)
    (hru : ru ≠ 0) (hrp : rp ≠ 0) (hrz : rz ≠ 0)
    (hlam : lam ≠ 0) :
    (m₀ + R * axisU0 m₀ R = 0) ∧
    (m₁ + R2 * axisE0 m₁ R2 = 0) ∧
    (m₂ + (2 * ef * rp) * axisE1 m₂ ef rp = 0) ∧
    (m₃ + ef * ru * (axisU0 m₀ R - 2 * lam * axisU1 m₀ m₃ R ef ru lam) = 0) ∧
    (m₄ - ef * rz * axisE2 m₄ ef rz = 0) := by
  constructor
  · dsimp [axisU0]
    field_simp
  constructor
  · dsimp [axisE0]
    field_simp
  constructor
  · dsimp [axisE1]
    field_simp
  constructor
  · dsimp [axisU0, axisU1]
    field_simp
    <;> ring
  · dsimp [axisE2]
    field_simp

theorem adjugate_two_by_two (a b c d : ℝ) :
    (a * d + b * (-c) = a*d-b*c) ∧
    (a * (-b) + b*a = 0) ∧
    (c * d + d * (-c) = 0) ∧
    (c * (-b) + d*a = a*d-b*c) := by
  constructor; · ring
  constructor; · ring
  constructor; · ring
  · ring

private def det3 (a b c d e f g h i : ℝ) : ℝ :=
  a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g)
private def dx3 (r s t b c e f h i : ℝ) : ℝ :=
  r*(e*i-f*h)-b*(s*i-f*t)+c*(s*h-e*t)
private def dy3 (a r c d s f g t i : ℝ) : ℝ :=
  a*(s*i-f*t)-r*(d*i-f*g)+c*(d*t-s*g)
private def dz3 (a b r d e s g h t : ℝ) : ℝ :=
  a*(e*t-s*h)-b*(d*t-s*g)+r*(d*h-e*g)

theorem three_by_three_cramer_polynomials
    (a b c d e f g h i r s t : ℝ) :
    a*dx3 r s t b c e f h i + b*dy3 a r c d s f g t i + c*dz3 a b r d e s g h t
        = r*det3 a b c d e f g h i ∧
    d*dx3 r s t b c e f h i + e*dy3 a r c d s f g t i + f*dz3 a b r d e s g h t
        = s*det3 a b c d e f g h i ∧
    g*dx3 r s t b c e f h i + h*dy3 a r c d s f g t i + i*dz3 a b r d e s g h t
        = t*det3 a b c d e f g h i := by
  dsimp [dx3, dy3, dz3, det3]
  constructor
  · ring
  constructor
  · ring
  · ring

theorem three_by_three_correction
    (a b c d e f g h i r s t : ℝ)
    (hdet : det3 a b c d e f g h i ≠ 0) :
    let D := det3 a b c d e f g h i
    let x := dx3 r s t b c e f h i / D
    let y := dy3 a r c d s f g t i / D
    let z := dz3 a b r d e s g h t / D
    (a*x + b*y + c*z = r) ∧
    (d*x + e*y + f*z = s) ∧
    (g*x + h*y + i*z = t) := by
  dsimp
  constructor
  · field_simp [hdet]
    dsimp [dx3, dy3, dz3, det3]
    ring
  constructor
  · field_simp [hdet]
    dsimp [dx3, dy3, dz3, det3]
    ring
  · field_simp [hdet]
    dsimp [dx3, dy3, dz3, det3]
    ring

end
end MathScope.M3.CD
