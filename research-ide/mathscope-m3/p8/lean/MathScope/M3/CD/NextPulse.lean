import Mathlib

namespace MathScope.M3.CD

private def dot3 (x y : Fin 3 → ℂ) : ℂ :=
  x 0 * y 0 + x 1 * y 1 + x 2 * y 2

/-- The constraint of the fixed moving-normal pulse system evolves by
scalar damping. The row contraction keeps both the input force and n'. -/
theorem fixed_pulse_normal_evolution (n dn t Kt f : Fin 3 → ℂ) (a : ℂ)
    (hq : dot3 n n ≠ 0) :
    let c := dot3 n (fun j => Kt j + f j) - dot3 dn t
    let rhs := fun j => -(Kt j + f j) - a * t j + n j * (c / dot3 n n)
    dot3 dn t + dot3 n rhs = -a * dot3 n t := by
  let q := dot3 n n
  let c := dot3 n (fun j => Kt j + f j) - dot3 dn t
  change dot3 dn t + dot3 n (fun j => -(Kt j + f j) - a * t j + n j * (c / q)) =
    -a * dot3 n t
  have hdot : dot3 n (fun j => -(Kt j + f j) - a * t j + n j * (c / q)) =
      -dot3 n (fun j => Kt j + f j) - a * dot3 n t + q * (c / q) := by
    simp [q, dot3]
    ring
  have hq' : q ≠ 0 := hq
  have hcancel : q * (c / q) = c := by field_simp
  rw [hdot, hcancel]
  dsimp [c]
  ring

/-- The reconstructed original normal pressure cancels the normal part
of the principal residual, including the contribution of the input force. -/
theorem fixed_pulse_pressure_component (n c k q : ℂ)
    (hk : k ≠ 0) (hq : q ≠ 0) :
    n * (c / q) + Complex.I * k * n * (Complex.I * c / (k * q)) = 0 := by
  calc
    _ = (1 + Complex.I * Complex.I) * n * (c / q) := by
      field_simp [hk, hq] <;> ring
    _ = 0 := by rw [Complex.I_mul_I] <;> ring

/-- Reusing the mode-one frame changes only the scalar diagonal damping. -/
theorem fixed_pulse_mode_damping (A d m : ℝ) :
    A - m ^ 2 * d = (A - d) - (m ^ 2 - 1) * d := by
  ring

/-- The scalar damping multiplier commutes with the fixed matrix
propagator. Here Au is one coordinate of the original matrix product. -/
theorem fixed_pulse_shifted_propagator {s u : ℝ → ℝ} {v a Au : ℝ}
    (hs : HasDerivAt s (-a * s v) v) (hu : HasDerivAt u Au v) :
    HasDerivAt (fun w => s w * u w) (s v * Au - a * (s v * u v)) v := by
  convert hs.mul hu using 1
  ring

#print axioms fixed_pulse_normal_evolution
#print axioms fixed_pulse_pressure_component
#print axioms fixed_pulse_mode_damping
#print axioms fixed_pulse_shifted_propagator

end MathScope.M3.CD
