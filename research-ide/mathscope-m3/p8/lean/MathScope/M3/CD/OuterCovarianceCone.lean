import Mathlib

namespace MathScope.M3.CD

private theorem covariance_cone_numerator
    {k x y r : ℝ} (hk : 0 < k) (hk₁ : k ≤ 1)
    (hx₀ : 1 - k / 128 ≤ x) (hx₁ : x ≤ 1 + k / 128)
    (hy₀ : 1 - k / 128 ≤ y) (hy₁ : y ≤ 1 + k / 128)
    (hr₀ : -(1 - k / 16) ≤ r) (hr₁ : r ≤ 1 - k / 16) :
    3 * k / 64 ≤ x - y * r ∧ x - y * r ≤ 2 * (129 / 128) := by
  have hy : 0 ≤ y := by linarith
  have hr : 0 ≤ 1 - k / 16 := by linarith
  have hab := mul_le_mul hr₁ hy₁ hy hr
  have hlow : 3 * k / 64 ≤ x - y * r := by
    nlinarith only [hab, hx₀, sq_nonneg k]
  have hneg : -r ≤ 1 := by linarith
  have hprod := mul_le_mul_of_nonneg_left hneg hy
  constructor
  · exact hlow
  · nlinarith only [hprod, hx₁, hy₁, hk₁]

/-- A positive-margin bound for the normalized two-column covariance solve.
The physical determinant and the two positive column masses are handled
separately when undoing these coordinates. -/
theorem outer_covariance_cone_weights
    {k a b c d r : ℝ} (hk : 0 < k) (hk₁ : k ≤ 1)
    (ha₀ : 1 - k / 128 ≤ a) (ha₁ : a ≤ 1 + k / 128)
    (hb₀ : 1 - k / 128 ≤ b) (hb₁ : b ≤ 1 + k / 128)
    (hc₀ : 1 - k / 128 ≤ c) (hc₁ : c ≤ 1 + k / 128)
    (hd₀ : 1 - k / 128 ≤ d) (hd₁ : d ≤ 1 + k / 128)
    (hr₀ : -(1 - k / 16) ≤ r) (hr₁ : r ≤ 1 - k / 16) :
    let det := a * d + b * c
    15 / 8 ≤ det ∧ det ≤ 17 / 8 ∧
      (k / 64 ≤ (d - b * r) / det ∧ (d - b * r) / det ≤ 2) ∧
      (k / 64 ≤ (c + a * r) / det ∧ (c + a * r) / det ≤ 2) := by
  let det := a * d + b * c
  change 15 / 8 ≤ det ∧ det ≤ 17 / 8 ∧
      (k / 64 ≤ (d - b * r) / det ∧ (d - b * r) / det ≤ 2) ∧
      (k / 64 ≤ (c + a * r) / det ∧ (c + a * r) / det ≤ 2)
  have ad₀ : (127 / 128 : ℝ) * (127 / 128) ≤ a * d :=
    mul_le_mul (by linarith) (by linarith) (by positivity) (by linarith)
  have bc₀ : (127 / 128 : ℝ) * (127 / 128) ≤ b * c :=
    mul_le_mul (by linarith) (by linarith) (by positivity) (by linarith)
  have ad₁ : a * d ≤ (129 / 128 : ℝ) * (129 / 128) :=
    mul_le_mul (by linarith) (by linarith) (by linarith) (by positivity)
  have bc₁ : b * c ≤ (129 / 128 : ℝ) * (129 / 128) :=
    mul_le_mul (by linarith) (by linarith) (by linarith) (by positivity)
  have hdet₀ : 15 / 8 ≤ det := by
    dsimp [det]
    linarith only [ad₀, bc₀]
  have hdet₁ : det ≤ 17 / 8 := by
    dsimp [det]
    linarith only [ad₁, bc₁]
  have hdetpos : 0 < det := by linarith
  have hn₁ := covariance_cone_numerator hk hk₁ hd₀ hd₁ hb₀ hb₁ hr₀ hr₁
  have hn₂ : 3 * k / 64 ≤ c + a * r ∧ c + a * r ≤ 2 * (129 / 128) := by
    have hc := covariance_cone_numerator hk hk₁ hc₀ hc₁ ha₀ ha₁
      (r := -r) (by linarith) (by linarith)
    simpa only [mul_neg, sub_neg_eq_add] using hc
  have divide {n : ℝ} (h₀ : 3 * k / 64 ≤ n) (h₁ : n ≤ 2 * (129 / 128)) :
      k / 64 ≤ n / det ∧ n / det ≤ 2 := by
    have upper := mul_le_mul_of_nonneg_left hdet₁ (by positivity : 0 ≤ k / 64)
    exact ⟨(le_div_iff₀ hdetpos).2 (by linarith only [upper, h₀, hk]),
      (div_le_iff₀ hdetpos).2 (by linarith only [h₁, hdet₀])⟩
  exact ⟨hdet₀, hdet₁, divide hn₁.1 hn₁.2, divide hn₂.1 hn₂.2⟩

/-- Undo one positive mass and the regularized target scale. This keeps
the floor on the regular coefficient after removal of the flat factor. -/
theorem outer_covariance_positive_mass_lower
    {k tau w mass massUpper : ℝ} (hk : 0 ≤ k) (htau : 0 ≤ tau)
    (hmass : 0 < mass) (hmassUpper : mass ≤ massUpper)
    (hw : k / 64 ≤ w) :
    k * tau / (64 * massUpper) ≤ tau * w / mass := by
  have hmassUpperPos : 0 < massUpper := hmass.trans_le hmassUpper
  have hscaled : 0 ≤ tau * (k / 64) := by positivity
  calc
    _ = (tau * (k / 64)) / massUpper := by
      field_simp [hmassUpperPos.ne'] <;> ring
    _ ≤ (tau * (k / 64)) / mass :=
      div_le_div_of_nonneg_left hscaled hmass hmassUpper
    _ ≤ _ := div_le_div_of_nonneg_right (mul_le_mul_of_nonneg_left hw htau) hmass.le

#print axioms outer_covariance_cone_weights
#print axioms outer_covariance_positive_mass_lower

end MathScope.M3.CD
