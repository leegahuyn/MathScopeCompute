import SameDatumInputs
import SameDatumMass

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
    rw [abs_le]
    constructor <;> linarith [hx.1, hx.2]
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
  have hd : ‖complexD z‖ ≤ 13 / 4 := by
    have hs : ‖z‖ ^ 2 ≤ 9 / 4 := by nlinarith [norm_nonneg z]
    have hb := norm_sub_le (1 : ℂ) (z ^ 2)
    rw [norm_one, norm_pow] at hb
    exact hb.trans (by linarith)
  have hu := complex_U_norm hz
  calc
    ‖complexH h j z‖ ≤ ‖(NavierStokes.NaturalAxisData.D h : ℂ) * z‖ +
        ‖complexD z * complexU j z‖ := norm_add_le _ _
    _ = ‖(NavierStokes.NaturalAxisData.D h : ℂ)‖ * ‖z‖ +
        ‖complexD z‖ * ‖complexU j z‖ := by rw [norm_mul, norm_mul]
    _ ≤ 1 * (3 / 2) + (13 / 4) * 7 := by gcongr; exact complex_D_norm
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
    norm_num only [Complex.norm_ofNat] at hh
    linarith [complex_D_norm]
  have hsum : ‖z + w‖ ≤ 3 := (norm_add_le z w).trans (by linarith)
  have hjsum : ‖(j : ℂ) * (z + w)‖ ≤ 3 := by
    rw [norm_mul, Complex.norm_real, Real.norm_eq_abs, abs_of_pos j_pos]
    calc j * ‖z + w‖ ≤ 1 * 3 := by gcongr; exact j_le_one
         _ = 3 := by ring
  have hz2 : ‖z‖ ^ 2 ≤ 9 / 4 := by nlinarith [norm_nonneg z]
  have hw2 : ‖w‖ ^ 2 ≤ 9 / 4 := by nlinarith [norm_nonneg w]
  have hzw : ‖z‖ * ‖w‖ ≤ 9 / 4 := by
    calc ‖z‖ * ‖w‖ ≤ (3 / 2) * (3 / 2) := by gcongr
         _ = 9 / 4 := by norm_num
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
  rw [show complexH h j z ^ 2 - complexH h j w ^ 2 =
    (complexH h j z - complexH h j w) * (complexH h j z + complexH h j w) by ring, norm_mul]
  have hsum : ‖complexH h j z + complexH h j w‖ ≤ 50 :=
    (norm_add_le _ _).trans (by linarith [complex_H_norm hz, complex_H_norm hw])
  calc
    _ ≤ (36 * ‖z - w‖) * 50 := by gcongr; exact complex_H_difference hz hw
    _ = _ := by ring

theorem real_center_norm {x : ℝ} (hx : x ∈ axisWindow.interval) : ‖(x : ℂ)‖ ≤ 3 / 2 := by
  apply tube_norm_le_three_halves
  exact real_mem_closedTube axisWindow (mul_nonneg (by norm_num) rho_pos.le) hx

theorem denominator_norm_lower {z : ℂ} (hz : z ∈ closedTube axisWindow (16 * rho)) :
    sigma ^ 2 / 2 ≤ ‖denominator h j sigma z‖ := by
  have hzn := tube_norm_le_three_halves (tube_mono_sixteen hz)
  rcases hz with ⟨x, hx, hz⟩
  have hd := complex_H_squared_difference hzn (real_center_norm hx)
  rw [dist_eq_norm] at hz
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
    lt_of_lt_of_le (div_pos (sq_pos_of_pos sigma_pos) (by norm_num)) (denominator_norm_lower hz)
  have hzn := tube_norm_le_three_halves (tube_mono_sixteen hz)
  rcases hz with ⟨x, hx, hz⟩
  have hd := complex_H_squared_difference hzn (real_center_norm hx)
  rw [dist_eq_norm] at hz
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
  · exact norm_pos_iff.mp (lt_of_lt_of_le (div_pos (sq_pos_of_pos sigma_pos) (by norm_num)) (denominator_norm_lower hz))

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
  simp only [newComplexPressure]
  rw [complexField_ofReal newPressure_admissible]
  simp [realField]

theorem complex_kernel_bound {a : ℝ} (ha0 : 0 ≤ a) (ha1 : a ≤ 1) {z : ℂ}
    (hz : z ∈ NavierStokes.PressureDatum.strip) :
    ‖NavierStokes.PressureDatum.complexKernel a z‖ ≤ Real.exp 2 := by
  have him : |z.im| < 1 / 2 := hz
  have hb : (1 / 2 : ℝ) ≤ ‖1 + z ^ 2‖ := by
    have hr := Complex.re_le_norm (1 + z ^ 2)
    have hre : (1 + z ^ 2).re = 1 + z.re * z.re - z.im * z.im := by
      simp only [Complex.add_re, Complex.one_re, pow_two, Complex.mul_re]
      ring
    rw [hre] at hr
    have hi := abs_lt.mp him
    nlinarith [sq_nonneg z.re, sq_nonneg (z.im - 1 / 2), sq_nonneg (z.im + 1 / 2)]
  have hblog : -(1 : ℝ) ≤ Real.log ‖1 + z ^ 2‖ := by
    have hlog := Real.log_le_log (by norm_num : (0 : ℝ) < 1 / 2) hb
    have h2 := Real.log_le_sub_one_of_pos (by norm_num : (0 : ℝ) < 2)
    rw [one_div, Real.log_inv] at hlog
    linarith
  have ha := mul_le_mul_of_nonneg_left hblog ha0
  unfold NavierStokes.PressureDatum.complexKernel
  rw [Complex.norm_exp]
  apply Real.exp_le_exp.mpr
  norm_num [Complex.mul_re, Complex.mul_im, Complex.log_re]
  nlinarith

theorem newComplexPressure_norm (z : ℂ) (hz : z ∈ NavierStokes.PressureDatum.strip) :
    ‖newComplexPressure z‖ ≤ 512 * Pstar ^ 2 := by
  have hi := NavierStokes.PressureDatum.integrable_complexKernel newPressure_admissible z
  have hg := newClockWeight_integrable.const_mul (Real.exp 2)
  have hm : (∫ y : ℝ, ‖(newClockWeight y : ℂ) *
      NavierStokes.PressureDatum.complexKernel (newShapeExponent y) z‖) ≤
      ∫ y : ℝ, Real.exp 2 * newClockWeight y := by
    apply integral_mono hi.norm hg
    intro y
    dsimp only
    rw [norm_mul, Complex.norm_real, Real.norm_eq_abs, abs_of_nonneg (newClockWeight_nonneg y)]
    have hk := complex_kernel_bound (newShapeExponent_bounds y).1 (newShapeExponent_bounds y).2 hz
    nlinarith [mul_le_mul_of_nonneg_left hk (newClockWeight_nonneg y)]
  rw [integral_const_mul] at hm
  have hmass := newClockWeight_mass_le
  have hexp : Real.exp 2 < 9 := by
    have he := Real.exp_one_lt_three
    have hepos := Real.exp_pos (1 : ℝ)
    rw [show (2 : ℝ) = 1 + 1 by norm_num, Real.exp_add]
    nlinarith
  have hn : ‖∫ y : ℝ, (newClockWeight y : ℂ) *
      NavierStokes.PressureDatum.complexKernel (newShapeExponent y) z‖ ≤
      ∫ y : ℝ, ‖(newClockWeight y : ℂ) *
        NavierStokes.PressureDatum.complexKernel (newShapeExponent y) z‖ :=
    norm_integral_le_integral_norm _
  have hmul := mul_le_mul_of_nonneg_left hmass (Real.exp_pos (2 : ℝ)).le
  have hmass0 : (0 : ℝ) ≤ ∫ y : ℝ, newClockWeight y :=
    MeasureTheory.integral_nonneg (fun y => newClockWeight_nonneg y)
  unfold newComplexPressure NavierStokes.PressureDatum.complexPressure
  rw [norm_mul]
  norm_num only [norm_neg, norm_div, norm_one, Complex.norm_ofNat]
  nlinarith [sq_nonneg Pstar]

theorem pressure_prime_norm (z : ℂ) (hz : z ∈ closedTube axisWindow (16 * rho)) :
    ‖deriv newComplexPressure z‖ ≤ 16384 * Pstar ^ 2 := by
  have him : |z.im| ≤ 16 * rho := by
    rcases hz with ⟨x, hx, hz⟩
    have hi := Complex.abs_im_le_norm (z - (x : ℂ))
    simp only [Complex.sub_im, Complex.ofReal_im, sub_zero] at hi
    rw [dist_eq_norm] at hz
    exact hi.trans hz
  have hball : closedBall z (1 / 32) ⊆ NavierStokes.PressureDatum.strip := by
    intro w hw
    have hi := Complex.abs_im_le_norm (w - z)
    have ht := abs_add_le (w.im - z.im) z.im
    rw [sub_add_cancel] at ht
    simp only [Complex.sub_im] at hi
    rw [mem_closedBall, dist_eq_norm] at hw
    change |w.im| < 1 / 2
    linarith [rho_le_small]
  let f : ℂ → ℂ := fun w => newComplexPressure w / (512 * Pstar ^ 2 : ℝ)
  have hK : (0 : ℝ) < 512 * Pstar ^ 2 := mul_pos (by norm_num) (sq_pos_of_pos Pstar_pos)
  have hKn : ((512 * Pstar ^ 2 : ℝ) : ℂ) ≠ 0 := by exact_mod_cast hK.ne'
  have hf : DifferentiableOn ℂ f (closedBall z (1 / 32)) := by
    exact ((newComplexPressure_analytic.differentiableOn.mono hball).div_const _)
  have hb : ∀ w ∈ sphere z (1 / 32), ‖f w‖ ≤ 1 := by
    intro w hw
    dsimp [f]
    rw [norm_div, Complex.norm_real, Real.norm_eq_abs, abs_of_pos hK, div_le_one hK]
    exact newComplexPressure_norm w (hball (sphere_subset_closedBall hw))
  have he := NavierStokes.AnalyticCoefficientBounds.norm_iteratedDeriv_le
    (by norm_num : (0 : ℝ) < 1 / 32) hf hb 1
  have hzstrip := hball (mem_closedBall_self (by norm_num : (0 : ℝ) ≤ 1 / 32))
  have hd : deriv f z = deriv newComplexPressure z / (512 * Pstar ^ 2 : ℝ) :=
    deriv_div_const _
  simp only [iteratedDeriv_one] at he
  rw [hd, norm_div, Complex.norm_real, Real.norm_eq_abs, abs_of_pos hK] at he
  norm_num at he
  have hu := (div_le_iff₀ hK).mp he
  nlinarith

theorem complex_L_norm {z : ℂ} (hz : ‖z‖ ≤ 3 / 2) : ‖complexL h z‖ ≤ 2 := by
  have hs : ‖z‖ ^ 2 ≤ 9 / 4 := by nlinarith [norm_nonneg z]
  have hb := norm_sub_le (1 : ℂ) (2 * (h : ℂ) * z ^ 2)
  rw [norm_one, norm_mul, norm_mul, Complex.norm_ofNat, Complex.norm_real,
    Real.norm_eq_abs, abs_of_pos h_pos, norm_pow] at hb
  have hm := mul_le_mul_of_nonneg_left hs (mul_nonneg (by norm_num) h_pos.le)
  dsimp only [complexL]
  nlinarith [h_le_thousandth]

theorem complex_W_norm {z : ℂ} (hz : ‖z‖ ≤ 3 / 2) : ‖complexW h j z‖ ≤ 40 := by
  have hd := complex_d_norm hz
  have hu := complex_U_norm hz
  have ht : ‖2 * (NavierStokes.NaturalAxisData.D h : ℂ) * z * complexU j z‖ ≤ 21 := by
    rw [norm_mul, norm_mul, norm_mul, Complex.norm_ofNat]
    calc
      2 * ‖(NavierStokes.NaturalAxisData.D h : ℂ)‖ * ‖z‖ * ‖complexU j z‖ ≤
          2 * 1 * (3 / 2) * 7 := by gcongr; exact complex_D_norm
      _ = 21 := by norm_num
  have h1 := norm_sub_le (1 : ℂ) (4 * complexD z)
  have h2 := norm_sub_le (1 - 4 * complexD z)
    (2 * (NavierStokes.NaturalAxisData.D h : ℂ) * z * complexU j z)
  rw [norm_one, norm_mul, Complex.norm_ofNat] at h1
  dsimp only [complexW]
  linarith

theorem gradient_complex_bound (z : ℂ) (hz : z ∈ closedTube axisWindow (16 * rho)) :
    ‖complexGradient h j sigma z‖ ≤ 100 / sigma ^ 2 := by
  have hzn := tube_norm_le_three_halves (tube_mono_sixteen hz)
  have hL := complex_L_norm hzn
  have hH := complex_H_norm hzn
  have hden := denominator_norm_lower hz
  have hdenpos : 0 < ‖denominator h j sigma z‖ :=
    lt_of_lt_of_le (by positivity [sigma_pos]) hden
  rw [complexGradient, norm_div, norm_mul, norm_neg]
  apply (div_le_iff₀ hdenpos).mpr
  have hm : ‖complexL h z‖ * ‖complexH h j z‖ ≤ 50 := by
    calc ‖complexL h z‖ * ‖complexH h j z‖ ≤ (2 : ℝ) * 25 := by gcongr
         _ = 50 := by norm_num
  have hh : (100 / sigma ^ 2) * (sigma ^ 2 / 2) = 50 := by
    field_simp [sigma_pos.ne']; ring
  have hc : 0 ≤ 100 / sigma ^ 2 := by positivity
  calc _ ≤ 50 := hm
       _ = (100 / sigma ^ 2) * (sigma ^ 2 / 2) := hh.symm
       _ ≤ _ := mul_le_mul_of_nonneg_left hden hc

theorem z_complex_bound (z : ℂ) (hz : z ∈ closedTube axisWindow (16 * rho)) :
    ‖complexZ h j newComplexPressure z‖ ≤ 262144 * Pstar ^ 2 := by
  have hzn := tube_norm_le_three_halves (tube_mono_sixteen hz)
  have hP := newComplexPressure_norm z (tube_pressure_strip (tube_mono_sixteen hz))
  have hP' := pressure_prime_norm z hz
  have hU := complex_U_norm hzn
  have hd := complex_d_norm hzn
  have hH := complex_H_norm hzn
  have h1 : ‖1 - 2 * z * complexU j z‖ ≤ 22 := by
    have hh := norm_sub_le (1 : ℂ) (2 * z * complexU j z)
    rw [norm_one, norm_mul, norm_mul, Complex.norm_ofNat] at hh
    have hm : 2 * ‖z‖ * ‖complexU j z‖ ≤ 21 := by
      calc 2 * ‖z‖ * ‖complexU j z‖ ≤ (2 : ℝ) * (3 / 2) * 7 := by gcongr
           _ = 21 := by norm_num
    linarith
  have ht1 : ‖-(NavierStokes.NaturalAxisData.A h : ℂ) *
      (1 - 2 * z * complexU j z) * complexU j z‖ ≤ 154 := by
    rw [norm_mul, norm_mul, norm_neg]
    calc ‖(NavierStokes.NaturalAxisData.A h : ℂ)‖ * ‖1 - 2 * z * complexU j z‖ * ‖complexU j z‖ ≤
        (1 : ℝ) * 22 * 7 := by gcongr <;> exact complex_A_norm
         _ = 154 := by norm_num
  have ht2 : ‖complexH h j z * 4‖ ≤ 100 := by
    rw [norm_mul, Complex.norm_ofNat]; linarith
  have ht3 : ‖complexD z * deriv newComplexPressure z‖ ≤ 65536 * Pstar ^ 2 := by
    rw [norm_mul]
    calc _ ≤ 4 * (16384 * Pstar ^ 2) := by gcongr
         _ = _ := by ring
  have ht4 : ‖4 * (NavierStokes.NaturalAxisData.A h : ℂ) * z * newComplexPressure z‖ ≤
      3072 * Pstar ^ 2 := by
    rw [norm_mul, norm_mul, norm_mul, Complex.norm_ofNat]
    calc _ ≤ 4 * 1 * (3 / 2) * (512 * Pstar ^ 2) := by gcongr; exact complex_A_norm
         _ = _ := by ring
  have hb1 := norm_sub_le (-(NavierStokes.NaturalAxisData.A h : ℂ) *
    (1 - 2 * z * complexU j z) * complexU j z) (complexH h j z * 4)
  have hb2 := norm_sub_le (-(NavierStokes.NaturalAxisData.A h : ℂ) *
    (1 - 2 * z * complexU j z) * complexU j z - complexH h j z * 4)
    (complexD z * deriv newComplexPressure z)
  have hb3 := norm_add_le (-(NavierStokes.NaturalAxisData.A h : ℂ) *
    (1 - 2 * z * complexU j z) * complexU j z - complexH h j z * 4 -
    complexD z * deriv newComplexPressure z)
    (4 * (NavierStokes.NaturalAxisData.A h : ℂ) * z * newComplexPressure z)
  dsimp only [complexZ]
  nlinarith [Pstar_ge_two]

def fixedFieldBound : Field → ℝ
  | .one => 1 | .eta => 2 | .d => 4 | .inverseL => 2
  | .uStar => 7 | .uStarEta => 4 | .wStar => 40 | .hStar => 25
  | .zStar => 262144 * Pstar ^ 2 | .chi => 1 | .gradient => 100 / sigma ^ 2

theorem fixedFieldBound_pos (k : Field) : 0 < fixedFieldBound k := by
  cases k <;> dsimp [fixedFieldBound] <;> positivity [Pstar_pos, sigma_pos]

theorem fixedField_norm (k : Field) (z : ℂ)
    (hz : z ∈ closedTube axisWindow (16 * rho)) :
    ‖complexField h j sigma newComplexPressure k z‖ ≤ fixedFieldBound k := by
  have hzn := tube_norm_le_three_halves (tube_mono_sixteen hz)
  cases k with
  | one => norm_num [complexField, fixedFieldBound]
  | eta => simpa [complexField, fixedFieldBound] using hzn.trans (by norm_num : (3 : ℝ) / 2 ≤ 2)
  | d => exact complex_d_norm hzn
  | inverseL => exact inverseL_complex_bound z hz
  | uStar => exact complex_U_norm hzn
  | uStarEta => norm_num [complexField, fixedFieldBound]
  | wStar => exact complex_W_norm hzn
  | hStar => exact complex_H_norm hzn
  | zStar => exact z_complex_bound z hz
  | chi => exact chi_complex_bound z hz
  | gradient => exact gradient_complex_bound z hz

def selectedElement (k : Field) : AxisSpace axisWindow rho :=
  boundedAxisElement rho_pos selected_radius_gap (fixedFieldBound_pos k)
    (fixedField_analytic k) (fixedField_norm k)

theorem selectedElement_norm (k : Field) : ‖selectedElement k‖ ≤ 2 * fixedFieldBound k := by
  have hb := boundedAxisElement_norm rho_pos selected_radius_gap
    (fixedFieldBound_pos k) (fixedField_analytic k) (fixedField_norm k)
  rw [selected_radius_ratio] at hb
  calc
    _ ≤ fixedFieldBound k * radiusLoss (1 / 16) := hb
    _ ≤ fixedFieldBound k * 2 := mul_le_mul_of_nonneg_left radiusLoss_sixteenth_le_two (fixedFieldBound_pos k).le
    _ = _ := by ring

theorem selectedElement_coefficient (k : Field) (n : ℕ) {x : ℝ}
    (hx : x ∈ axisWindow.interval) :
    coefficient axisWindow (weight rho) (selectedElement k) n x =
      if n = 0 then realField h j sigma newPressure k x else 0 := by
  rw [selectedElement, boundedAxisElement_coefficient rho_pos selected_radius_gap
    (fixedFieldBound_pos k) (fixedField_analytic k) (fixedField_norm k) n hx]
  simp only [newComplexPressure, complexField_ofReal newPressure_admissible, Complex.ofReal_re]
  rfl

theorem selectedElement_chi : selectedElement .chi = chiInput := rfl

def selectedAxisData : NavierStokes.AxisContraction.AxisData (AxisSpace axisWindow rho) where
  A := NavierStokes.NaturalAxisData.A h
  D := NavierStokes.NaturalAxisData.D h
  h := h
  one := selectedElement .one
  eta := selectedElement .eta
  d := selectedElement .d
  inverseL := selectedElement .inverseL
  uStar := selectedElement .uStar
  uStarEta := selectedElement .uStarEta
  wStar := selectedElement .wStar
  hStar := selectedElement .hStar
  normalizedGradient := selectedElement .gradient
  zStar := selectedElement .zStar

theorem selectedElement_radial (k : Field) :
    NavierStokes.NaturalAxisBridge.RadiallyConstant axisWindow rho (selectedElement k) := by
  intro n hn x hx
  rw [selectedElement_coefficient k n hx, ite_eq_right hn]

theorem selectedElement_value (k : Field) {x : ℝ} (hx : x ∈ axisWindow.interval) :
    NavierStokes.NaturalAxisBridge.inputValue axisWindow rho (selectedElement k) x =
      realField h j sigma newPressure k x :=
  (selectedElement_coefficient k 0 hx).trans (ite_eq_left rfl)

theorem selectedAxisData_compatible :
    NavierStokes.NaturalAxisBridge.CompatibleData axisWindow rho chiInput selectedAxisData := by
  rw [← selectedElement_chi]
  refine {
    chi_radial := selectedElement_radial .chi
    one_radial := selectedElement_radial .one
    eta_radial := selectedElement_radial .eta
    d_radial := selectedElement_radial .d
    inverseL_radial := selectedElement_radial .inverseL
    uStar_radial := selectedElement_radial .uStar
    uStarEta_radial := selectedElement_radial .uStarEta
    wStar_radial := selectedElement_radial .wStar
    hStar_radial := selectedElement_radial .hStar
    gradient_radial := selectedElement_radial .gradient
    zStar_radial := selectedElement_radial .zStar
    one_value := fun x hx => selectedElement_value .one hx
    eta_value := fun x hx => selectedElement_value .eta hx
    uStarEta_value := ?_
  }
  intro x hx
  have hx' : x ∈ axisWindow.interval := ⟨hx.1.le, hx.2.le⟩
  change NavierStokes.NaturalAxisBridge.inputValue axisWindow rho (selectedElement .uStarEta) x =
    deriv (NavierStokes.NaturalAxisBridge.inputValue axisWindow rho (selectedElement .uStar)) x
  rw [selectedElement_value .uStarEta hx']
  have heq : NavierStokes.NaturalAxisBridge.inputValue axisWindow rho (selectedElement .uStar) =ᶠ[nhds x]
      NavierStokes.NaturalAxisData.U j := by
    filter_upwards [Icc_mem_nhds hx.1 hx.2] with y hy
    exact selectedElement_value .uStar hy
  rw [heq.deriv_eq]
  symm
  change deriv (fun y : ℝ => 4 * y + j) x = 4
  simp

end MathScope.SameDatumInputs

#print axioms MathScope.SameDatumInputs.denominator_norm_lower
#print axioms MathScope.SameDatumInputs.chiInput_norm
#print axioms MathScope.SameDatumInputs.chiInput_coefficient
#print axioms MathScope.SameDatumInputs.newComplexPressure_norm
#print axioms MathScope.SameDatumInputs.pressure_prime_norm
#print axioms MathScope.SameDatumInputs.selectedElement_norm
#print axioms MathScope.SameDatumInputs.selectedElement_coefficient
#print axioms MathScope.SameDatumInputs.selectedAxisData_compatible
