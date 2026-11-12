import Mathlib

namespace MathScope.M3.CD

/-- The integer window supplied by the two source maximum arms contains L+2. -/
theorem reference_band_label (ellZero L M : ℤ)
    (hL : ellZero + 4 ≤ L) (hM : L + 4 ≤ M) :
    max ellZero L ≤ L + 2 ∧ L + 2 ≤ M - 1 ∧ ellZero + 6 ≤ L + 2 := by
  constructor
  · apply max_le <;> omega
  · omega

/-- The original factor-two growth from the third selector row onward
gives the lower integer label, even when the window has one label. -/
theorem reference_general_window_lower_label (ellZero : ℤ) (a b : ℝ)
    (hdeep : (ellZero : ℝ) + 8 ≤ a) (hgrowth : a + 1 ≤ b) :
    max ellZero ⌊a⌋ = ⌊a⌋ ∧ ⌊a⌋ ≤ ⌊b⌋ - 1 ∧ ellZero + 8 ≤ ⌊a⌋ := by
  have hL : ellZero + 8 ≤ ⌊a⌋ := by
    apply Int.le_floor.mpr
    exact_mod_cast hdeep
  have hM : ⌊a⌋ + 1 ≤ ⌊b⌋ := by
    apply Int.le_floor.mpr
    rw [Int.cast_add, Int.cast_one]
    linarith [Int.floor_le a]
  exact ⟨max_eq_right (by omega), by omega, hL⟩

/-- An explicit point below the last retained cutoff and strictly past
the first omitted cutoff in the original factor-two regime. -/
theorem reference_general_window_strict_point (v growth : ℝ)
    (hlo : 1 / 2 < v) (hhi : v ≤ 1) (hGrowth : 2 ≤ growth) :
    let s := (1 / 2 + v) / 2
    1 / 2 < s ∧ s < 1 ∧ s / v < 1 ∧ 1 < growth * (s / v) := by
  let s := (1 / 2 + v) / 2
  change 1 / 2 < s ∧ s < 1 ∧ s / v < 1 ∧ 1 < growth * (s / v)
  have hv : 0 < v := by linarith
  have hratio : 1 / 2 < s / v := (lt_div_iff₀ hv).mpr (by dsimp [s]; linarith)
  have hmul : 2 * (s / v) ≤ growth * (s / v) :=
    mul_le_mul_of_nonneg_right hGrowth (by linarith)
  refine ⟨by dsimp [s]; linarith, by dsimp [s]; linarith, (div_lt_iff₀ hv).mpr ?_, by linarith⟩
  dsimp [s]
  linarith

/-- Original angular carriers use an integer winding. A different
polar lift preserves both coefficients of each harmonic. -/
theorem integer_carrier_angle_shift (offset theta : ℝ) (winding lift : ℤ) :
    Real.cos (offset + (winding : ℝ) * (theta + (lift : ℝ) * (2 * Real.pi))) =
      Real.cos (offset + (winding : ℝ) * theta) ∧
    Real.sin (offset + (winding : ℝ) * (theta + (lift : ℝ) * (2 * Real.pi))) =
      Real.sin (offset + (winding : ℝ) * theta) := by
  have h : offset + (winding : ℝ) * (theta + (lift : ℝ) * (2 * Real.pi)) =
      (offset + (winding : ℝ) * theta) + (↑(winding * lift) : ℝ) * (2 * Real.pi) := by
    push_cast
    ring
  exact ⟨by rw [h, Real.cos_add_int_mul_two_pi], by rw [h, Real.sin_add_int_mul_two_pi]⟩

/-- The original physical time is (t=1-\tau).
The fast coefficient has a positive sign after multiplication by `-eps`. -/
theorem reference_torus_fast_time_sign (eps Q cover derivative : ℝ) :
    -eps * (cover * (-Q) * derivative) = (eps * Q * cover) * derivative := by
  ring

/-- Use the normalized chart equation on the positive domain. A strict
decrease on this domain follows from either a nonzero axial coordinate
or positive time. -/
theorem positive_reference_root_unique {s₁ s₂ Z T a : ℝ}
    (ha : 0 < a) (hT : 0 ≤ T) (hnonzero : Z ≠ 0 ∨ 0 < T)
    (h₁ : 0 < s₁) (h₂ : 0 < s₂)
    (hr₁ : Z ^ 2 / s₁ ^ a + T / s₁ = 1)
    (hr₂ : Z ^ 2 / s₂ ^ a + T / s₂ = 1) :
    s₁ = s₂ := by
  have strictDecrease (x y : ℝ) (hx : 0 < x) (hy : 0 < y) (hxy : x < y) :
      Z ^ 2 / y ^ a + T / y < Z ^ 2 / x ^ a + T / x := by
    have hxpow : 0 < x ^ a := Real.rpow_pos_of_pos hx _
    have hypow : 0 < y ^ a := Real.rpow_pos_of_pos hy _
    have hp : x ^ a < y ^ a := Real.rpow_lt_rpow hx.le hxy ha
    rcases hnonzero with hz | ht
    · have hzlt : Z ^ 2 / y ^ a < Z ^ 2 / x ^ a := by
        apply (div_lt_div_iff₀ hypow hxpow).2
        exact mul_lt_mul_of_pos_left hp (sq_pos_of_ne_zero hz)
      have htLe : T / y ≤ T / x := by
        apply (div_le_div_iff₀ hy hx).2
        exact mul_le_mul_of_nonneg_left hxy.le hT
      exact add_lt_add_of_lt_of_le hzlt htLe
    · have hzLe : Z ^ 2 / y ^ a ≤ Z ^ 2 / x ^ a := by
        apply (div_le_div_iff₀ hypow hxpow).2
        exact mul_le_mul_of_nonneg_left hp.le (sq_nonneg _)
      have htLt : T / y < T / x := by
        apply (div_lt_div_iff₀ hy hx).2
        exact mul_lt_mul_of_pos_left hxy ht
      exact add_lt_add_of_le_of_lt hzLe htLt
  rcases lt_trichotomy s₁ s₂ with hlt | heq | hgt
  · have h := strictDecrease s₁ s₂ h₁ h₂ hlt
    rw [hr₁, hr₂] at h
    exact (lt_irrefl _ h).elim
  · exact heq
  · have h := strictDecrease s₂ s₁ h₂ h₁ hgt
    rw [hr₁, hr₂] at h
    exact (lt_irrefl _ h).elim

/-- A replacement of the time coordinate alone can destroy existence in the
registered bracket. This is a control for transport into nested frames. -/
theorem zero_axial_time_below_reference_bracket {s T a : ℝ}
    (hs : 1 / 2 ≤ s) (hT : T < 1 / 2) :
    ¬ ((0 : ℝ) ^ 2 / s ^ a + T / s = 1) := by
  have hpos : 0 < s := by linarith
  intro h
  have hdiv : T / s = 1 := by simpa using h
  have htime : T = 1 * s := (div_eq_iff hpos.ne').mp hdiv
  linarith

-- The source representative takes the midpoint of the intersection of
-- the time box with the two axial chart endpoint values.
theorem representative_midpoint_brackets {F : ℝ → ℝ} {lo hi tLo tHi : ℝ}
    (hlo : 1 / 2 ≤ lo) (hhi : hi ≤ 2) (hband : lo < hi)
    (hmono : StrictMonoOn F (Set.Icc (1 / 2) 2))
    (htime : tLo < tHi) (hleft : F lo < tHi) (hright : tLo < F hi) :
    let t := (max tLo (F lo) + min tHi (F hi)) / 2
    F lo < t ∧ t < F hi ∧ F (1 / 2) < t ∧ t < F 2 := by
  have hloSet : lo ∈ Set.Icc (1 / 2 : ℝ) 2 := ⟨hlo, hband.le.trans hhi⟩
  have hhiSet : hi ∈ Set.Icc (1 / 2 : ℝ) 2 := ⟨hlo.trans hband.le, hhi⟩
  have hfirst : (1 / 2 : ℝ) ∈ Set.Icc (1 / 2 : ℝ) 2 := by norm_num
  have hlast : (2 : ℝ) ∈ Set.Icc (1 / 2 : ℝ) 2 := by norm_num
  have hf : F lo < F hi := hmono hloSet hhiSet hband
  have hmid : max tLo (F lo) < min tHi (F hi) :=
    lt_min (max_lt htime hleft) (max_lt hright hf)
  have hlow : max tLo (F lo) < (max tLo (F lo) + min tHi (F hi)) / 2 := by
    linarith
  have hupp : (max tLo (F lo) + min tHi (F hi)) / 2 < min tHi (F hi) := by
    linarith
  have ht₁ := (le_max_right tLo (F lo)).trans_lt hlow
  have ht₂ := hupp.trans_le (min_le_right tHi (F hi))
  exact ⟨ht₁, ht₂, (hmono.monotoneOn hfirst hloSet hlo).trans_lt ht₁,
    ht₂.trans_le (hmono.monotoneOn hhiSet hlast hhi)⟩

/-- The original open three-quarter band guard cannot activate a label
outside the integer window within either quarter-width margin. -/
theorem open_band_guard_within_window {t : ℝ} {lo hi j : ℤ}
    (htlo : (lo : ℝ) - 1 / 4 ≤ t) (hthi : t ≤ (hi : ℝ) + 1 / 4)
    (hactive : |t - (j : ℝ)| < 3 / 4) : lo ≤ j ∧ j ≤ hi := by
  obtain ⟨hl, hu⟩ := abs_lt.mp hactive
  have hjlo : (lo : ℝ) - 1 < (j : ℝ) := by linarith
  have hjhi : (j : ℝ) < (hi : ℝ) + 1 := by linarith
  have hloInt : lo - 1 < j := by exact_mod_cast hjlo
  have hhiInt : j < hi + 1 := by exact_mod_cast hjhi
  omega

/-- A finite product of the original unit-interval Picard binders preserves
the radial square bound, including the axis and the upper moment endpoint. -/
theorem picard_unit_radial_square {x upper : ℝ} (hx : x ∈ Set.Icc 0 upper)
    (ts : List ℝ) (ht : ∀ t ∈ ts, t ∈ Set.Icc 0 1) :
    (Real.sqrt x * ts.prod) ^ 2 ∈ Set.Icc 0 upper := by
  have unitProduct (ys : List ℝ) (hy : ∀ y ∈ ys, y ∈ Set.Icc 0 1) :
      ys.prod ∈ Set.Icc (0 : ℝ) 1 := by
    induction ys with
    | nil => simp
    | cons a ys ih =>
      have ha := hy a List.mem_cons_self
      have hp := ih (fun y hy' => hy y (List.mem_cons_of_mem _ hy'))
      simp only [List.prod_cons]
      exact ⟨mul_nonneg ha.1 hp.1, by simpa using mul_le_mul ha.2 hp.2 hp.1 zero_le_one⟩
  have hp := unitProduct ts ht
  have hnonneg := mul_nonneg (Real.sqrt_nonneg x) hp.1
  have hle : Real.sqrt x * ts.prod ≤ Real.sqrt x := by
    simpa using mul_le_mul_of_nonneg_left hp.2 (Real.sqrt_nonneg x)
  refine ⟨sq_nonneg _, ?_⟩
  calc
    (Real.sqrt x * ts.prod) ^ 2 ≤ (Real.sqrt x) ^ 2 :=
      pow_le_pow_left₀ hnonneg hle 2
    _ = x := Real.sq_sqrt hx.1
    _ ≤ upper := hx.2

/-- The original N2 local moment radius puts every such natural argument
below five at any finite depth in the unit-interval radial integrations. -/
theorem picard_local_moment_natural_range {x Xa Λ t₁ : ℝ}
    (hXa : 0 < Xa) (hΛXa : Λ * Xa = 4) (ht₁ : t₁ < 1 / 128)
    (hx : x ∈ Set.Icc 0 (Xa * Real.exp (t₁ / 32))) (ts : List ℝ)
    (ht : ∀ t ∈ ts, t ∈ Set.Icc 0 1) :
    Λ * (Real.sqrt x * ts.prod) ^ 2 ∈ Set.Ico 0 5 := by
  have hΛ : 0 < Λ := by
    by_contra! h
    have hbad := mul_nonpos_of_nonpos_of_nonneg h hXa.le
    linarith
  have hr := picard_unit_radial_square hx ts ht
  have he := Real.exp_pos (t₁ / 32)
  have hunit : (1 - t₁ / 32) * Real.exp (t₁ / 32) ≤ 1 := by
    calc
      _ ≤ Real.exp (-(t₁ / 32)) * Real.exp (t₁ / 32) := by
        apply mul_le_mul_of_nonneg_right _ he.le
        linarith [Real.add_one_le_exp (-(t₁ / 32))]
      _ = 1 := by rw [← Real.exp_add, neg_add_cancel, Real.exp_zero]
  have hlt : (4 / 5 : ℝ) * Real.exp (t₁ / 32) <
      (1 - t₁ / 32) * Real.exp (t₁ / 32) :=
    mul_lt_mul_of_pos_right (by linarith) he
  refine ⟨mul_nonneg hΛ.le hr.1, ?_⟩
  calc
    Λ * (Real.sqrt x * ts.prod) ^ 2 ≤ Λ * (Xa * Real.exp (t₁ / 32)) :=
      mul_le_mul_of_nonneg_left hr.2 hΛ.le
    _ = 4 * Real.exp (t₁ / 32) := by rw [← mul_assoc, hΛXa]
    _ < 5 := by linarith [hlt.trans_le hunit]

/-- The log forms in the active radial branch preserve its natural argument. -/
theorem picard_local_moment_normalizations {u Xa Λ : ℝ}
    (hXa : 0 < Xa) (hu : Xa < u) (hΛXa : Λ * Xa = 4) :
    Xa * Real.exp (Real.log (u / Xa)) = u ∧
    4 * Real.exp (Real.log (u / Xa)) = Λ * u := by
  rw [Real.exp_log (div_pos (hXa.trans hu) hXa)]
  constructor
  · field_simp [hXa.ne']
  · rw [← hΛXa]
    field_simp [hXa.ne']

#print axioms reference_band_label
#print axioms reference_general_window_lower_label
#print axioms reference_general_window_strict_point
#print axioms integer_carrier_angle_shift
#print axioms reference_torus_fast_time_sign
#print axioms positive_reference_root_unique
#print axioms zero_axial_time_below_reference_bracket
#print axioms representative_midpoint_brackets
#print axioms open_band_guard_within_window
#print axioms picard_unit_radial_square
#print axioms picard_local_moment_natural_range
#print axioms picard_local_moment_normalizations

end MathScope.M3.CD
