import FieldBounds
import Mathlib.Tactic

/-!
The actual normalized phase exponential for the selected same-datum profile.
Every bound below uses the fixed rho and the literal finite choices Q, Lambda, C.
No abstract analytic-input witness or amplitude norm hypothesis is assumed.
-/

set_option maxHeartbeats 1000000
noncomputable section
namespace MathScope.SameDatumInputs

open Set Metric MeasureTheory Complex
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates
open NavierStokes.AnalyticCoefficientBounds NavierStokes.NaturalAxisCoefficients
open scoped Topology ContDiff Interval

def actualAmplitudeQ : ℝ := 2 ^ 260 * Pstar ^ 2 / sigma ^ 2
def actualAmplitudeLambda : ℝ := actualAmplitudeQ ^ 64
def actualAmplitudeC : ℝ := (1 + actualAmplitudeQ ^ 300) ^ 10 * Real.exp (actualAmplitudeQ ^ 200)

theorem amplitudeQ_pos : 0 < actualAmplitudeQ := by
  unfold actualAmplitudeQ
  positivity [Pstar_pos, sigma_pos]

theorem amplitudeQ_ge_one : 1 ≤ actualAmplitudeQ := by
  have hs : sigma ^ 2 ≤ 1 := pow_le_one₀ sigma_pos.le sigma_le_one
  have hp : 1 ≤ Pstar ^ 2 := by nlinarith [Pstar_ge_two]
  have hk : (1 : ℝ) ≤ 2 ^ 260 := by norm_num
  unfold actualAmplitudeQ
  apply (le_div_iff₀ (sq_pos_of_pos sigma_pos)).mpr
  nlinarith

theorem phase_bound_le_amplitudeQ : 200 / sigma ^ 2 ≤ actualAmplitudeQ := by
  have hp : 1 ≤ Pstar ^ 2 := by nlinarith [Pstar_ge_two]
  have hk : (200 : ℝ) ≤ 2 ^ 260 := by norm_num
  unfold actualAmplitudeQ
  apply div_le_div_of_nonneg_right _ (sq_nonneg sigma)
  nlinarith

theorem amplitudeC_pos : 0 < actualAmplitudeC := by
  unfold actualAmplitudeC
  positivity [amplitudeQ_pos]

theorem amplitudeC_exp_lower : Real.exp (actualAmplitudeQ ^ 200) ≤ actualAmplitudeC := by
  have hp : 1 ≤ (1 + actualAmplitudeQ ^ 300) ^ 10 :=
    one_le_pow₀ (by positivity [amplitudeQ_pos])
  unfold actualAmplitudeC
  nlinarith [Real.exp_pos (actualAmplitudeQ ^ 200)]

theorem denominator_norm_lower_wide {z : ℂ} (hz : z ∈ closedTube axisWindow (32 * rho)) :
    sigma ^ 2 / 16 ≤ ‖denominator h j sigma z‖ := by
  have hzn := tube_norm_le_three_halves hz
  rcases hz with ⟨x, hx, hz⟩
  have hd := complex_H_squared_difference hzn (real_center_norm hx)
  rw [dist_eq_norm] at hz
  have hdiff : ‖complexH h j z ^ 2 - complexH h j (x : ℂ) ^ 2‖ ≤ 15 * sigma ^ 2 / 16 := by
    dsimp [rho] at hz
    nlinarith [sq_nonneg sigma]
  have hn : ‖denominator h j sigma (x : ℂ)‖ = NavierStokes.NaturalAxisData.H h j x ^ 2 + sigma ^ 2 := by
    rw [denominator_ofReal, Complex.norm_real, Real.norm_eq_abs, abs_of_nonneg (by positivity)]
  have hsub : denominator h j sigma z - denominator h j sigma (x : ℂ) =
      complexH h j z ^ 2 - complexH h j (x : ℂ) ^ 2 := by unfold denominator; ring
  have hb := norm_sub_norm_le (denominator h j sigma (x : ℂ)) (denominator h j sigma z)
  rw [hn, norm_sub_rev, hsub] at hb
  nlinarith [sq_nonneg (NavierStokes.NaturalAxisData.H h j x)]

theorem complexL_norm_lower_wide {z : ℂ} (hz : z ∈ closedTube axisWindow (32 * rho)) :
    (1 / 2 : ℝ) ≤ ‖complexL h z‖ := by
  have hz3 := tube_norm_le_three_halves hz
  have hs : ‖z‖ ^ 2 ≤ 9 := by nlinarith [norm_nonneg z]
  have hterm : ‖2 * (h : ℂ) * z ^ 2‖ ≤ 1 / 2 := by
    rw [norm_mul, norm_mul, norm_pow]
    norm_num only [Complex.norm_ofNat, Complex.norm_real, Real.norm_eq_abs, abs_of_pos h_pos]
    have hp := mul_le_mul_of_nonneg_left hs h_pos.le
    nlinarith [h_le_thousandth]
  have hl := norm_sub_norm_le (1 : ℂ) (2 * (h : ℂ) * z ^ 2)
  norm_num only [norm_one] at hl
  unfold complexL
  linarith

theorem wide_tube_regularSet {z : ℂ} (hz : z ∈ closedTube axisWindow (32 * rho)) :
    z ∈ regularSet h j sigma := by
  refine ⟨⟨tube_pressure_strip hz, ?_⟩, ?_⟩
  · exact norm_pos_iff.mp (by linarith [complexL_norm_lower_wide hz])
  · exact norm_pos_iff.mp (lt_of_lt_of_le
      (div_pos (sq_pos_of_pos sigma_pos) (by norm_num)) (denominator_norm_lower_wide hz))

def phaseRealInterval : Set ℂ := Complex.ofReal '' axisWindow.interval
def phaseOpenDomain : Set ℂ := thickening (32 * rho) phaseRealInterval

theorem phaseRealInterval_zero : (0 : ℂ) ∈ phaseRealInterval := by
  refine ⟨0, ?_, by simp⟩
  norm_num [axisWindow, Window.interval]

theorem phaseOpenDomain_open : IsOpen phaseOpenDomain := isOpen_thickening

theorem phaseOpenDomain_convex : Convex ℝ phaseOpenDomain := by
  have hc : Convex ℝ phaseRealInterval :=
    (convex_Icc axisWindow.left axisWindow.right).linear_image Complex.ofRealCLM.toLinearMap
  exact hc.thickening (32 * rho)

theorem phaseOpenDomain_zero : (0 : ℂ) ∈ phaseOpenDomain :=
  self_subset_thickening (by positivity [rho_pos]) phaseRealInterval phaseRealInterval_zero

theorem phaseOpenDomain_in_wide_tube : phaseOpenDomain ⊆ closedTube axisWindow (32 * rho) := by
  intro z hz
  rcases mem_thickening_iff.mp hz with ⟨w, ⟨x, hx, rfl⟩, hzw⟩
  exact ⟨x, hx, hzw.le⟩

theorem tube_in_phaseOpenDomain : closedTube axisWindow (16 * rho) ⊆ phaseOpenDomain := by
  rintro z ⟨x, hx, hz⟩
  apply mem_thickening_iff.mpr
  exact ⟨x, ⟨x, hx, rfl⟩, by linarith [rho_pos]⟩

theorem actualPhase_analytic :
    AnalyticOnNhd ℂ (axisPhase h j sigma) (closedTube axisWindow (16 * rho)) := by
  have hg : DifferentiableOn ℂ (complexGradient h j sigma) phaseOpenDomain :=
    ((complexGradient_analytic h j sigma).mono
      (fun _ hz => wide_tube_regularSet (phaseOpenDomain_in_wide_tube hz))).differentiableOn
  exact (NavierStokes.AnalyticPrimitive.analyticOnNhd_primitive
    phaseOpenDomain_open phaseOpenDomain_convex phaseOpenDomain_zero hg).mono tube_in_phaseOpenDomain

theorem actualPhase_derivative {z : ℂ} (hz : z ∈ closedTube axisWindow (16 * rho)) :
    HasDerivAt (axisPhase h j sigma) (complexGradient h j sigma z) z := by
  have hg : DifferentiableOn ℂ (complexGradient h j sigma) phaseOpenDomain :=
    ((complexGradient_analytic h j sigma).mono
      (fun _ hz => wide_tube_regularSet (phaseOpenDomain_in_wide_tube hz))).differentiableOn
  exact NavierStokes.AnalyticPrimitive.hasDerivAt_primitive
    phaseOpenDomain_open phaseOpenDomain_convex phaseOpenDomain_zero hg (tube_in_phaseOpenDomain hz)

theorem phase_segment_in_tube {z : ℂ} (hz : z ∈ closedTube axisWindow (16 * rho))
    {t : ℝ} (ht : t ∈ Icc (0 : ℝ) 1) : (t : ℂ) * z ∈ closedTube axisWindow (16 * rho) := by
  rcases hz with ⟨x, hx, hz⟩
  have hx0 : (0 : ℝ) ∈ axisWindow.interval := by norm_num [axisWindow, Window.interval]
  have htx : t * x ∈ axisWindow.interval := by
    simpa only [smul_eq_mul] using
      (convex_Icc axisWindow.left axisWindow.right).smul_mem_of_zero_mem hx0 hx ht
  refine ⟨t * x, htx, ?_⟩
  rw [dist_eq_norm, Complex.ofReal_mul, ← mul_sub, norm_mul, Complex.norm_real,
    Real.norm_eq_abs, abs_of_nonneg ht.1]
  rw [dist_eq_norm] at hz
  calc t * ‖z - (x : ℂ)‖ ≤ 1 * (16 * rho) := by gcongr; exact ht.2
       _ = 16 * rho := by ring

theorem actualPhase_norm (z : ℂ) (hz : z ∈ closedTube axisWindow (16 * rho)) :
    ‖axisPhase h j sigma z‖ ≤ 200 / sigma ^ 2 := by
  have hint : ‖∫ t in (0 : ℝ)..1, complexGradient h j sigma ((t : ℂ) * z)‖ ≤ 100 / sigma ^ 2 := by
    have hb := intervalIntegral.norm_integral_le_of_norm_le_const
      (a := (0 : ℝ)) (b := 1) (C := 100 / sigma ^ 2)
      (f := fun t : ℝ => complexGradient h j sigma ((t : ℂ) * z)) (by
        intro t ht
        exact gradient_complex_bound _ (phase_segment_in_tube hz
          (by simpa only [uIcc_of_le zero_le_one] using uIoc_subset_uIcc ht)))
    simpa using hb
  rw [axisPhase, NavierStokes.AnalyticPrimitive.primitive, norm_mul]
  have hzn : ‖z‖ ≤ 2 := (tube_norm_le_three_halves (tube_mono_sixteen hz)).trans (by norm_num)
  calc ‖z‖ * _ ≤ 2 * (100 / sigma ^ 2) := by gcongr
       _ = _ := by ring

def actualComplexAmplitude (z : ℂ) : ℂ :=
  Complex.exp ((actualAmplitudeLambda : ℂ) * axisPhase h j sigma z) / (actualAmplitudeC : ℂ)

theorem actualComplexAmplitude_analytic :
    AnalyticOnNhd ℂ actualComplexAmplitude (closedTube axisWindow (16 * rho)) := by
  intro z hz
  have hp := actualPhase_analytic z hz
  have hC : (actualAmplitudeC : ℂ) ≠ 0 := by exact_mod_cast amplitudeC_pos.ne'
  unfold actualComplexAmplitude
  fun_prop (disch := assumption)

theorem actualComplexAmplitude_norm (z : ℂ) (hz : z ∈ closedTube axisWindow (16 * rho)) :
    ‖actualComplexAmplitude z‖ ≤ 1 := by
  have hp : (axisPhase h j sigma z).re ≤ actualAmplitudeQ :=
    (Complex.re_le_norm _).trans ((actualPhase_norm z hz).trans phase_bound_le_amplitudeQ)
  have hΛ : 0 ≤ actualAmplitudeLambda := pow_nonneg amplitudeQ_pos.le _
  have hexp : ((actualAmplitudeLambda : ℂ) * axisPhase h j sigma z).re ≤ actualAmplitudeQ ^ 200 := by
    simp only [Complex.mul_re, Complex.ofReal_re, Complex.ofReal_im, zero_mul, sub_zero]
    calc actualAmplitudeLambda * (axisPhase h j sigma z).re ≤ actualAmplitudeLambda * actualAmplitudeQ :=
           mul_le_mul_of_nonneg_left hp hΛ
         _ = actualAmplitudeQ ^ 65 := by rw [actualAmplitudeLambda, pow_succ]
         _ ≤ _ := pow_le_pow_right₀ amplitudeQ_ge_one (by norm_num)
  rw [actualComplexAmplitude, norm_div, Complex.norm_exp, Complex.norm_real,
    Real.norm_eq_abs, abs_of_pos amplitudeC_pos, div_le_one amplitudeC_pos]
  exact (Real.exp_le_exp.mpr hexp).trans amplitudeC_exp_lower

def actualAmplitudeInput : AxisSpace axisWindow rho :=
  boundedAxisElement rho_pos selected_radius_gap (by norm_num : (0 : ℝ) < 1)
    actualComplexAmplitude_analytic actualComplexAmplitude_norm

theorem actualAmplitudeInput_norm : ‖actualAmplitudeInput‖ ≤ 2 := by
  have hb := boundedAxisElement_norm rho_pos selected_radius_gap
    (by norm_num : (0 : ℝ) < 1) actualComplexAmplitude_analytic actualComplexAmplitude_norm
  rw [selected_radius_ratio, one_mul] at hb
  exact hb.trans radiusLoss_sixteenth_le_two

theorem actualAmplitudeInput_coefficient (n : ℕ) {x : ℝ} (hx : x ∈ axisWindow.interval) :
    coefficient axisWindow (weight rho) actualAmplitudeInput n x =
      if n = 0 then realAmplitude h j sigma actualAmplitudeLambda actualAmplitudeC x else 0 := by
  rw [actualAmplitudeInput, boundedAxisElement_coefficient rho_pos selected_radius_gap
    (by norm_num : (0 : ℝ) < 1) actualComplexAmplitude_analytic actualComplexAmplitude_norm n hx]
  simp [actualComplexAmplitude, realAmplitude, axisPhase_ofReal, ← Complex.ofReal_mul,
    ← Complex.ofReal_exp, ← Complex.ofReal_div]

theorem actualAmplitudeInput_radial :
    NavierStokes.NaturalAxisBridge.RadiallyConstant axisWindow rho actualAmplitudeInput := by
  intro n hn x hx
  rw [actualAmplitudeInput_coefficient n hx, ite_eq_right hn]

theorem actualAmplitudeInput_value {x : ℝ} (hx : x ∈ axisWindow.interval) :
    NavierStokes.NaturalAxisBridge.inputValue axisWindow rho actualAmplitudeInput x =
      realAmplitude h j sigma actualAmplitudeLambda actualAmplitudeC x :=
  (actualAmplitudeInput_coefficient 0 hx).trans (ite_eq_left rfl)

#print axioms actualPhase_analytic
#print axioms actualPhase_derivative
#print axioms actualPhase_norm
#print axioms actualComplexAmplitude_norm
#print axioms actualAmplitudeInput_norm
#print axioms actualAmplitudeInput_coefficient
#print axioms actualAmplitudeInput_radial
#print axioms actualAmplitudeInput_value

end MathScope.SameDatumInputs
