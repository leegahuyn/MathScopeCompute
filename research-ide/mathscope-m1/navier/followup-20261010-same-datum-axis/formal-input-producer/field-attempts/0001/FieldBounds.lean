import SameDatumInputs

noncomputable section
namespace MathScope.SameDatumInputs

open Set Metric MeasureTheory Complex
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates
open NavierStokes.AnalyticCoefficientBounds NavierStokes.NaturalAxisCoefficients
open scoped Topology ContDiff

theorem selected_small_parameters : NavierStokes.NaturalAxisData.SmallParameters h j :=
  ⟨h_pos, h_le_thousandth, j_pos, j_le_thousandth⟩

theorem complex_D_norm : ‖(NavierStokes.NaturalAxisData.D h : ℂ)‖ ≤ 1 := by
  rw [Complex.norm_real, Real.norm_eq_abs, abs_le]
  dsimp [NavierStokes.NaturalAxisData.D]
  constructor <;> linarith [h_pos, h_le_thousandth]

theorem complex_A_norm : ‖(NavierStokes.NaturalAxisData.A h : ℂ)‖ ≤ 1 := by
  rw [Complex.norm_real, Real.norm_eq_abs, abs_le]
  dsimp [NavierStokes.NaturalAxisData.A]
  constructor <;> linarith [h_pos, h_le_thousandth]

theorem tube_norm_le_three_halves {z : ℂ} (hz : z ∈ closedTube axisWindow (32 * rho)) :
    ‖z‖ ≤ 3 / 2 := by
  rcases hz with ⟨x, hx, hz⟩
  have hxabs : |x| ≤ 33 / 32 := by
    change -33 / 32 ≤ x ∧ x ≤ 33 / 32 at hx
    exact abs_le.mpr hx
  have hxnorm : ‖(x : ℂ)‖ ≤ 33 / 32 := by simpa using hxabs
  rw [dist_eq_norm] at hz
  have htri := norm_add_le (z - (x : ℂ)) (x : ℂ)
  rw [sub_add_cancel] at htri
  linarith [rho_le_small]

theorem tube_mono_sixteen {z : ℂ} (hz : z ∈ closedTube axisWindow (16 * rho)) :
    z ∈ closedTube axisWindow (32 * rho) := by
  rcases hz with ⟨x, hx, hz⟩
  exact ⟨x, hx, by linarith [rho_pos]⟩

theorem complex_d_norm {z : ℂ} (hz : ‖z‖ ≤ 3 / 2) : ‖complexD z‖ ≤ 4 := by
  have hs : ‖z‖ ^ 2 ≤ 9 / 4 := by nlinarith [norm_nonneg z]
  have hb := norm_sub_le (1 : ℂ) (z ^ 2)
  rw [norm_one, norm_pow] at hb
  exact hb.trans (by linarith)

theorem complex_U_norm {z : ℂ} (hz : ‖z‖ ≤ 3 / 2) : ‖complexU j z‖ ≤ 7 := by
  have hb := norm_add_le ((4 : ℂ) * z) (j : ℂ)
  rw [norm_mul, Complex.norm_ofNat, Complex.norm_real, Real.norm_eq_abs, abs_of_pos j_pos] at hb
  exact hb.trans (by linarith [j_le_one])

theorem complex_H_norm {z : ℂ} (hz : ‖z‖ ≤ 3 / 2) : ‖complexH h j z‖ ≤ 25 := by
  have hd := complex_d_norm hz
  have hu := complex_U_norm hz
  calc
    ‖complexH h j z‖ ≤ ‖(NavierStokes.NaturalAxisData.D h : ℂ) * z‖ +
        ‖complexD z * complexU j z‖ := norm_add_le _ _
    _ = ‖(NavierStokes.NaturalAxisData.D h : ℂ)‖ * ‖z‖ +
        ‖complexD z‖ * ‖complexU j z‖ := by rw [norm_mul, norm_mul]
    _ ≤ 1 * (3 / 2) + 4 * 7 := by gcongr; exact complex_D_norm
    _ ≤ 25 := by norm_num

theorem complex_H_difference {z w : ℂ} (hz : ‖z‖ ≤ 3 / 2) (hw : ‖w‖ ≤ 3 / 2) :
    ‖complexH h j z - complexH h j w‖ ≤ 36 * ‖z - w‖ := by
  have hid : complexH h j z - complexH h j w = (z - w) *
      (((NavierStokes.NaturalAxisData.D h : ℂ) + 4) -
        (j : ℂ) * (z + w) - 4 * (z ^ 2 + z * w + w ^ 2)) := by
    unfold complexH complexD complexU
    ring
  have hd : ‖(NavierStokes.NaturalAxisData.D h : ℂ) + 4‖ ≤ 5 := by
    have hh := norm_add_le (NavierStokes.NaturalAxisData.D h : ℂ) (4 : ℂ)
    norm_num at hh
    linarith [complex_D_norm]
  have hsum : ‖z + w‖ ≤ 3 := (norm_add_le z w).trans (by linarith)
  have hjsum : ‖(j : ℂ) * (z + w)‖ ≤ 3 := by
    rw [norm_mul, Complex.norm_real, Real.norm_eq_abs, abs_of_pos j_pos]
    calc j * ‖z + w‖ ≤ 1 * 3 := by gcongr; exact j_le_one
         _ = 3 := by ring
  have hz2 : ‖z‖ ^ 2 ≤ 9 / 4 := by nlinarith [norm_nonneg z]
  have hw2 : ‖w‖ ^ 2 ≤ 9 / 4 := by nlinarith [norm_nonneg w]
  have hzw : ‖z‖ * ‖w‖ ≤ 9 / 4 := by nlinarith [mul_nonneg (by linarith : 0 ≤ 3 / 2 - ‖z‖)
    (norm_nonneg w)]
  have hquad : ‖z ^ 2 + z * w + w ^ 2‖ ≤ 27 / 4 := by
    have h1 := norm_add_le (z ^ 2 + z * w) (w ^ 2)
    have h2 := norm_add_le (z ^ 2) (z * w)
    rw [norm_pow] at h1
    rw [norm_pow, norm_mul] at h2
    linarith
  have hfour : ‖(4 : ℂ) * (z ^ 2 + z * w + w ^ 2)‖ ≤ 27 := by
    rw [norm_mul, Complex.norm_ofNat]
    linarith
  have hinside : ‖(((NavierStokes.NaturalAxisData.D h : ℂ) + 4) -
      (j : ℂ) * (z + w) - 4 * (z ^ 2 + z * w + w ^ 2))‖ ≤ 36 := by
    have h1 := norm_sub_le ((NavierStokes.NaturalAxisData.D h : ℂ) + 4) ((j : ℂ) * (z + w))
    have h2 := norm_sub_le (((NavierStokes.NaturalAxisData.D h : ℂ) + 4) - (j : ℂ) * (z + w))
      (4 * (z ^ 2 + z * w + w ^ 2))
    linarith
  rw [hid, norm_mul]
  nlinarith [mul_le_mul_of_nonneg_left hinside (norm_nonneg (z - w))]

theorem complex_H_squared_difference {z w : ℂ} (hz : ‖z‖ ≤ 3 / 2) (hw : ‖w‖ ≤ 3 / 2) :
    ‖complexH h j z ^ 2 - complexH h j w ^ 2‖ ≤ 1800 * ‖z - w‖ := by
  rw [sq_sub_sq, norm_mul]
  have hsum : ‖complexH h j z + complexH h j w‖ ≤ 50 :=
    (norm_add_le _ _).trans (by linarith [complex_H_norm hz, complex_H_norm hw])
  calc
    _ ≤ (36 * ‖z - w‖) * 50 := by gcongr; exact complex_H_difference hz hw
    _ = _ := by ring

theorem real_center_norm {x : ℝ} (hx : x ∈ axisWindow.interval) : ‖(x : ℂ)‖ ≤ 3 / 2 := by
  apply tube_norm_le_three_halves
  exact real_mem_closedTube axisWindow (by positivity : 0 ≤ 32 * rho) hx

theorem denominator_norm_lower {z : ℂ} (hz : z ∈ closedTube axisWindow (16 * rho)) :
    sigma ^ 2 / 2 ≤ ‖denominator h j sigma z‖ := by
  have hzn := tube_norm_le_three_halves (tube_mono_sixteen hz)
  rcases hz with ⟨x, hx, hz⟩
  have hd := complex_H_squared_difference hzn (real_center_norm hx)
  rw [← dist_eq_norm] at hd
  have hdiff : ‖complexH h j z ^ 2 - complexH h j (x : ℂ) ^ 2‖ ≤ sigma ^ 2 / 2 := by
    dsimp [rho] at hz
    nlinarith [sq_nonneg sigma]
  have hn : ‖denominator h j sigma (x : ℂ)‖ = NavierStokes.NaturalAxisData.H h j x ^ 2 + sigma ^ 2 := by
    rw [denominator_ofReal, Complex.norm_real, Real.norm_eq_abs, abs_of_nonneg (by positivity)]
  have hsub : denominator h j sigma z - denominator h j sigma (x : ℂ) =
      complexH h j z ^ 2 - complexH h j (x : ℂ) ^ 2 := by unfold denominator; ring
  have hb := norm_sub_norm_le (denominator h j sigma (x : ℂ)) (denominator h j sigma z)
  rw [hn, norm_sub_rev, hsub] at hb
  nlinarith [sq_nonneg (NavierStokes.NaturalAxisData.H h j x)]

theorem chi_complex_bound (z : ℂ) (hz : z ∈ closedTube axisWindow (16 * rho)) :
    ‖complexChi h j sigma z‖ ≤ 1 := by
  have hden : 0 < ‖denominator h j sigma z‖ :=
    lt_of_lt_of_le (by positivity : 0 < sigma ^ 2 / 2) (denominator_norm_lower hz)
  have hzn := tube_norm_le_three_halves (tube_mono_sixteen hz)
  rcases hz with ⟨x, hx, hz⟩
  have hd := complex_H_squared_difference hzn (real_center_norm hx)
  rw [← dist_eq_norm] at hd
  have hdiff : ‖complexH h j z ^ 2 - complexH h j (x : ℂ) ^ 2‖ ≤ sigma ^ 2 / 2 := by
    dsimp [rho] at hz
    nlinarith [sq_nonneg sigma]
  have hn : ‖denominator h j sigma (x : ℂ)‖ = NavierStokes.NaturalAxisData.H h j x ^ 2 + sigma ^ 2 := by
    rw [denominator_ofReal, Complex.norm_real, Real.norm_eq_abs, abs_of_nonneg (by positivity)]
  have hnH : ‖complexH h j (x : ℂ) ^ 2‖ = NavierStokes.NaturalAxisData.H h j x ^ 2 := by
    rw [complexH_ofReal, ← Complex.ofReal_pow, Complex.norm_real, Real.norm_eq_abs,
      abs_of_nonneg (sq_nonneg _)]
  have hsub : denominator h j sigma z - denominator h j sigma (x : ℂ) =
      complexH h j z ^ 2 - complexH h j (x : ℂ) ^ 2 := by unfold denominator; ring
  have hb := norm_sub_norm_le (denominator h j sigma (x : ℂ)) (denominator h j sigma z)
  rw [hn, norm_sub_rev, hsub] at hb
  have ha := norm_sub_norm_le (complexH h j z ^ 2) (complexH h j (x : ℂ) ^ 2)
  rw [hnH] at ha
  rw [complexChi, norm_div, div_le_one hden]
  linarith

theorem tube_pressure_strip {z : ℂ} (hz : z ∈ closedTube axisWindow (32 * rho)) :
    z ∈ NavierStokes.PressureDatum.strip := by
  rcases hz with ⟨x, hx, hz⟩
  have hi := Complex.abs_im_le_norm (z - (x : ℂ))
  simp only [Complex.sub_im, Complex.ofReal_im, sub_zero] at hi
  rw [dist_eq_norm] at hz
  change |z.im| < 1 / 2
  linarith [rho_le_small]

theorem tube_regularSet {z : ℂ} (hz : z ∈ closedTube axisWindow (16 * rho)) :
    z ∈ regularSet h j sigma := by
  refine ⟨⟨tube_pressure_strip (tube_mono_sixteen hz), ?_⟩, ?_⟩
  · exact norm_pos_iff.mp (by linarith [complexL_norm_lower hz])
  · exact norm_pos_iff.mp (lt_of_lt_of_le (by positivity : 0 < sigma ^ 2 / 2) (denominator_norm_lower hz))

theorem fixedField_analytic (k : Field) :
    AnalyticOnNhd ℂ (complexField h j sigma newComplexPressure k) (closedTube axisWindow (16 * rho)) :=
  (complexField_analytic newPressure_admissible h j sigma k).mono (fun _ hz => tube_regularSet hz)

def chiInput : AxisSpace axisWindow rho :=
  boundedAxisElement rho_pos selected_radius_gap (by norm_num : (0 : ℝ) < 1)
    (fixedField_analytic .chi) chi_complex_bound

theorem chiInput_norm : ‖chiInput‖ ≤ 2 := by
  have hb := boundedAxisElement_norm rho_pos selected_radius_gap
    (by norm_num : (0 : ℝ) < 1) (fixedField_analytic .chi) chi_complex_bound
  rw [selected_radius_ratio, one_mul] at hb
  exact hb.trans radiusLoss_sixteenth_le_two

theorem chiInput_coefficient (n : ℕ) {x : ℝ} (hx : x ∈ axisWindow.interval) :
    coefficient axisWindow (weight rho) chiInput n x =
      if n = 0 then NavierStokes.NaturalAxisData.chi h j sigma x else 0 := by
  rw [chiInput, boundedAxisElement_coefficient rho_pos selected_radius_gap
    (by norm_num : (0 : ℝ) < 1) (fixedField_analytic .chi) chi_complex_bound n hx]
  rw [complexField_ofReal newPressure_admissible]
  simp [realField]

end MathScope.SameDatumInputs

#print axioms MathScope.SameDatumInputs.denominator_norm_lower
#print axioms MathScope.SameDatumInputs.chiInput_norm
#print axioms MathScope.SameDatumInputs.chiInput_coefficient
