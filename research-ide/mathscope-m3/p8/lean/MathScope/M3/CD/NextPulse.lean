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

/-- The raw first source already contains the primary cutoff derivative. -/
theorem first_forced_raw_tail_bookkeeping (g primary ψ tail : ℂ) :
    (g + primary) - ψ * (g + primary) + tail -
      ((1 - ψ) * (g + primary) + tail + primary) = -primary := by
  ring

/-- Solving with the separated forcing keeps the primary tail in the
physical residual and gives the supported forcing the expected cutoff. -/
theorem first_forced_separated_tail_bookkeeping (g primary ψ tail : ℂ) :
    (g + primary) - ψ * g + tail = primary + (1 - ψ) * g + tail := by
  ring

/-- The complete ordered convolution contributes two pairs at mode 3. -/
theorem repeat_forced_mode_three_pairs (term : ℤ → ℤ → ℂ) :
    (∑ i ∈ Finset.Icc (-2 : ℤ) 2,
      if 3 - i ∈ Finset.Icc (-2 : ℤ) 2 then term i (3 - i) else 0) =
      term 1 2 + term 2 1 := by
  have h : Finset.Icc (-2 : ℤ) 2 = {-2, -1, 0, 1, 2} := by decide
  rw [h]
  norm_num [Finset.sum_insert]

/-- The complete ordered convolution contributes a single pair at mode 4. -/
theorem repeat_forced_mode_four_pairs (term : ℤ → ℤ → ℂ) :
    (∑ i ∈ Finset.Icc (-2 : ℤ) 2,
      if 4 - i ∈ Finset.Icc (-2 : ℤ) 2 then term i (4 - i) else 0) =
      term 2 2 := by
  have h : Finset.Icc (-2 : ℤ) 2 = {-2, -1, 0, 1, 2} := by decide
  rw [h]
  norm_num [Finset.sum_insert]

/-- A mean factor cannot contribute to either of the new high modes. -/
theorem repeat_forced_high_mode_has_two_waves (i j : ℤ)
    (hi : -2 ≤ i ∧ i ≤ 2) (hj : -2 ≤ j ∧ j ≤ 2)
    (h : i + j < -2 ∨ 2 < i + j) : i ≠ 0 ∧ j ≠ 0 := by
  constructor <;> omega

/-- Differentiating a conservative product after selecting its Fourier
mode gives the sum of the two charged derivatives before convolution.
The ordinary derivatives of the two amplitudes are df and dg. -/
theorem repeat_forced_conservative_fourier_product
    (f g df dg m n κ : ℂ) :
    (df * g + f * dg) + Complex.I * (m + n) * κ * (f * g) =
      (df + Complex.I * m * κ * f) * g +
        f * (dg + Complex.I * n * κ * g) := by
  ring

/-- The tangent-propagator contribution fits inside a small part of the
original cutoff exponent. B is log(1/qBig) in the source application. -/
theorem first_scale_tangent_log_budget (bnorm L B : ℝ)
    (hbnorm : 1 ≤ bnorm) (hL : L ≤ 1 / 2 ^ 30)
    (hB : bnorm ^ 512 / 2 ≤ B) :
    1024 * (3 * bnorm ^ 256 * L) ≤ B / 128 := by
  have hpos : 0 ≤ bnorm := by linarith
  have hpow : bnorm ^ 256 ≤ bnorm ^ 512 := by
    calc
      bnorm ^ 256 = bnorm ^ 256 * 1 := by ring
      _ ≤ bnorm ^ 256 * bnorm ^ 256 :=
        mul_le_mul_of_nonneg_left (one_le_pow₀ hbnorm) (pow_nonneg hpos _)
      _ = bnorm ^ 512 := by rw [← pow_add]
  have hsmall : 3072 * L ≤ 1 / 256 := by
    norm_num at hL ⊢
    linarith
  calc
    _ = (3072 * L) * bnorm ^ 256 := by ring
    _ ≤ (1 / 256) * bnorm ^ 256 := mul_le_mul_of_nonneg_right hsmall (pow_nonneg hpos _)
    _ ≤ (1 / 256) * bnorm ^ 512 := mul_le_mul_of_nonneg_left hpow (by norm_num)
    _ ≤ B / 128 := by linarith

#print axioms fixed_pulse_normal_evolution
#print axioms fixed_pulse_pressure_component
#print axioms fixed_pulse_mode_damping
#print axioms fixed_pulse_shifted_propagator
#print axioms first_forced_raw_tail_bookkeeping
#print axioms first_forced_separated_tail_bookkeeping
#print axioms repeat_forced_mode_three_pairs
#print axioms repeat_forced_mode_four_pairs
#print axioms repeat_forced_high_mode_has_two_waves
#print axioms repeat_forced_conservative_fourier_product
#print axioms first_scale_tangent_log_budget

end MathScope.M3.CD
