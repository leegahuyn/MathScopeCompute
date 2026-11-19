import Mathlib

namespace MathScope.M3.CD

/-- Two stage transitions cannot overlap if their source scales differ
by at least a factor two. The original exponential scale gap gives this premise. -/
theorem annular_stage_transitions_disjoint
    {a b q : ℝ} (ha : 0 < a) (hab : 2 * a ≤ b)
    (hleft : 1 / (2 * a) < q) (hright : q < 1 / b) : False := by
  have hb : 0 < b := lt_of_lt_of_le (by positivity) hab
  have hq : 0 ≤ q := le_of_lt (lt_trans (by positivity) hleft)
  have hqa : 1 < q * (2 * a) := (div_lt_iff₀ (by positivity)).mp hleft
  have hqb : q * b < 1 := (lt_div_iff₀ hb).mp hright
  exact (not_lt_of_ge (le_trans hqa.le (mul_le_mul_of_nonneg_left hab hq))) hqb

/-- One scalar contraction of the covariant convection discrepancy.
The two original cumulative states are `u` and `u + w`, with
mixture weights `C-K` and `K`. The third state is zero. -/
theorem annular_adjacent_convection_component
    (C K u w du dw : ℝ) :
    (C * u + K * w) * (C * du + K * dw)
      - ((C - K) * u * du + K * (u + w) * (du + dw)) =
    - (1 - C) * (C - K) * (u * du)
      - (1 - C) * K * ((u + w) * (du + dw))
      - (C - K) * K * (w * dw) := by
  ring

/-- The source uses time `-∂τ`. For one potential component and either
cutoff, applying the heat operator to its first axial derivative times
the potential has only first-time and second-space potential jets. -/
theorem annular_gauge_heat_component
    (Cz CzTau Czz Czzz a aTau az lapA : ℝ) :
    -(CzTau * a + Cz * aTau)
      - (Czzz * a + 2 * Czz * az + Cz * lapA) =
    Cz * (-aTau - lapA) - (CzTau + Czzz) * a - 2 * Czz * az := by
  ring

/-- Scalar component of the force-square bound for the mixture with the
zero state and its two adjacent cumulative residuals. -/
theorem annular_adjacent_residual_square
    {C K r s : ℝ} (hC : C ≤ 1) (hK0 : 0 ≤ K) (hKC : K ≤ C) :
    ((C - K) * r + K * s)^2 ≤ (C - K) * r^2 + K * s^2 := by
  have h0 : 0 ≤ (1 - C) * (C - K) * r^2 :=
    mul_nonneg (mul_nonneg (sub_nonneg.mpr hC) (sub_nonneg.mpr hKC)) (sq_nonneg r)
  have h1 : 0 ≤ (1 - C) * K * s^2 :=
    mul_nonneg (mul_nonneg (sub_nonneg.mpr hC) hK0) (sq_nonneg s)
  have h2 : 0 ≤ (C - K) * K * (r - s)^2 :=
    mul_nonneg (mul_nonneg (sub_nonneg.mpr hKC) hK0) (sq_nonneg (r - s))
  calc
    ((C - K) * r + K * s)^2 ≤
        ((C - K) * r + K * s)^2
          + (1 - C) * (C - K) * r^2 + (1 - C) * K * s^2 + (C - K) * K * (r - s)^2 := by
      linarith only [h0, h1, h2]
    _ = (C - K) * r^2 + K * s^2 := by ring

/-- Exact margin for the tighter two-reference annular energy transfer.
The verified larger N4 coefficient bounds both reference conversions. -/
theorem annular_sharper_spatial_energy_gate
    {Xb t cap bracket ratio : ℝ}
    (ht : 0 ≤ t) (hcap : 0 ≤ cap)
    (hscaled : Xb^2 * (t * cap) ≤ (7 / 8) / 2^27)
    (hbracket : 96 * bracket ≤ 312885936 * cap^2)
    (hratio : ratio ≤ 96 * Xb^4 * t^2 * bracket) :
    ratio ≤ 1 / 2^26 := by
  have hs0 : 0 ≤ Xb^2 * (t * cap) := by positivity
  have hlim : (0 : ℝ) ≤ (7 / 8) / 2^27 := by norm_num
  have hs : (Xb^2 * (t * cap))^2 ≤ ((7 / 8) / 2^27)^2 := by
    simpa only [pow_two] using mul_le_mul hscaled hscaled hs0 hlim
  calc
    ratio ≤ 96 * Xb^4 * t^2 * bracket := hratio
    _ = (Xb^4 * t^2) * (96 * bracket) := by ring
    _ ≤ (Xb^4 * t^2) * (312885936 * cap^2) := mul_le_mul_of_nonneg_left hbracket (by positivity)
    _ = 312885936 * (Xb^2 * (t * cap))^2 := by ring
    _ ≤ 312885936 * ((7 / 8) / 2^27)^2 := mul_le_mul_of_nonneg_left hs (by norm_num)
    _ ≤ 1 / 2^26 := by norm_num

#print axioms annular_stage_transitions_disjoint
#print axioms annular_adjacent_convection_component
#print axioms annular_gauge_heat_component
#print axioms annular_adjacent_residual_square
#print axioms annular_sharper_spatial_energy_gate

end MathScope.M3.CD
