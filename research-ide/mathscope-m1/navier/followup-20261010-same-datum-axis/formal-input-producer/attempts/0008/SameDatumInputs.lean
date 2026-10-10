import NavierStokes.AxisCoefficientSpace
import NavierStokes.NaturalAxisCoefficients
import NavierStokes.SchedulePressure
import Mathlib.Analysis.SpecialFunctions.ExpDeriv
import Mathlib.Tactic.FunProp
import Mathlib.MeasureTheory.Integral.Asymptotics

/-! Concrete initial members of the new axis input family.

The actual rho and fixed real window are used below.  The two constructed
elements are the literal one and eta inputs, with all adjacent derivative
identities and all-order weighted bounds proved rather than postulated.
This file does not supply the remaining pressure-dependent input elements.
-/

noncomputable section

namespace MathScope.SameDatumInputs

open Set
open NavierStokes.AxisCoefficientSpace NavierStokes.AxisWeightEstimates

def Md : ℝ := 2 ^ (20 : ℕ)
def T : ℝ := Real.exp Md + 10
def h : ℝ := Real.exp (-8002 * T)
def j : ℝ := h ^ (4 : ℕ)
def sigma : ℝ := j / 2000
def rho : ℝ := sigma ^ (2 : ℕ) / 65536

theorem T_pos : 0 < T := by unfold T; positivity
theorem h_pos : 0 < h := Real.exp_pos _
theorem h_le_one : h ≤ 1 := by
  unfold h
  apply Real.exp_le_one_iff.mpr
  nlinarith [T_pos]
theorem h_le_thousandth : h ≤ 1 / 1000 := by
  have hT : 10 < T := by unfold T; linarith [Real.exp_pos Md]
  have he : (1000 : ℝ) ≤ Real.exp (8002 * T) := by
    nlinarith [Real.add_one_le_exp (8002 * T)]
  have hinv := one_div_le_one_div_of_le (by norm_num : (0 : ℝ) < 1000) he
  unfold h
  rw [show -8002 * T = -(8002 * T) by ring, Real.exp_neg]
  simpa only [one_div] using hinv
theorem j_pos : 0 < j := pow_pos h_pos _
theorem j_le_one : j ≤ 1 := by
  exact pow_le_one₀ h_pos.le h_le_one
theorem j_le_thousandth : j ≤ 1 / 1000 := by
  have hpow := pow_le_one₀ h_pos.le h_le_one (n := 3)
  have hj : j ≤ h := by
    unfold j
    calc
      h ^ 4 = h ^ 3 * h := by ring
      _ ≤ 1 * h := mul_le_mul_of_nonneg_right hpow h_pos.le
      _ = h := one_mul h
  exact hj.trans h_le_thousandth
theorem sigma_pos : 0 < sigma := div_pos j_pos (by norm_num)
theorem sigma_le_one : sigma ≤ 1 := by
  unfold sigma
  nlinarith [j_le_one]
theorem rho_pos : 0 < rho := div_pos (sq_pos_of_pos sigma_pos) (by norm_num)
theorem rho_le_sixteenth : rho ≤ 1 / 16 := by
  unfold rho
  nlinarith [sigma_pos, sigma_le_one, sq_nonneg (sigma - 1)]
theorem rho_le_small : rho ≤ 1 / 65536 := by
  unfold rho
  nlinarith [sigma_pos, sigma_le_one, sq_nonneg (sigma - 1)]

def axisWindow : Window := ⟨-33 / 32, 33 / 32, by norm_num⟩

theorem eta_abs_bound {x : ℝ} (hx : x ∈ axisWindow.interval) : |x| ≤ 2 := by
  change -33 / 32 ≤ x ∧ x ≤ 33 / 32 at hx
  rw [abs_le]
  constructor <;> linarith [hx.1, hx.2]

def oneJet (n m : ℕ) (_x : ℝ) : ℝ := if n = 0 ∧ m = 0 then 1 else 0
def etaJet (n m : ℕ) (x : ℝ) : ℝ :=
  if n = 0 then if m = 0 then x else if m = 1 then 1 else 0 else 0

theorem oneJet_continuous (n m : ℕ) : ContinuousOn (oneJet n m) axisWindow.interval := by
  unfold oneJet
  exact continuousOn_const

theorem oneJet_derivative (n m : ℕ) (x : ℝ) (_hx : x ∈ axisWindow.interval) :
    HasDerivWithinAt (oneJet n m) (oneJet n (m + 1) x) axisWindow.interval x := by
  have hn : oneJet n (m + 1) x = 0 := by simp [oneJet]
  rw [hn]
  change HasDerivWithinAt (fun _ : ℝ => if n = 0 ∧ m = 0 then 1 else 0) 0 _ _
  exact hasDerivWithinAt_const x axisWindow.interval _

theorem oneJet_bound (n m : ℕ) (x : ℝ) (_hx : x ∈ axisWindow.interval) :
    |oneJet n m x| ≤ 2 * weight rho n m := by
  by_cases hn : n = 0 ∧ m = 0
  · rcases hn with ⟨rfl, rfl⟩
    norm_num [oneJet, weight]
  · simpa [oneJet, hn] using (mul_nonneg (by norm_num : (0 : ℝ) ≤ 2)
      (weight_pos rho_pos n m).le)

theorem etaJet_continuous (n m : ℕ) : ContinuousOn (etaJet n m) axisWindow.interval := by
  unfold etaJet
  split_ifs <;> first | exact continuousOn_id | exact continuousOn_const

theorem etaJet_derivative (n m : ℕ) (x : ℝ) (_hx : x ∈ axisWindow.interval) :
    HasDerivWithinAt (etaJet n m) (etaJet n (m + 1) x) axisWindow.interval x := by
  by_cases hn : n = 0
  · subst n
    cases m with
    | zero =>
      change HasDerivWithinAt (fun x : ℝ => x) 1 _ _
      exact hasDerivWithinAt_id x axisWindow.interval
    | succ m =>
      cases m with
      | zero =>
        change HasDerivWithinAt (fun _ : ℝ => 1) 0 _ _
        exact hasDerivWithinAt_const x axisWindow.interval _
      | succ m =>
        have hz : etaJet 0 (m + 1 + 1) = fun _ : ℝ => 0 := by funext y; simp [etaJet]
        rw [hz]
        have hnext : etaJet 0 (m + 1 + 1 + 1) x = 0 := by simp [etaJet]
        rw [hnext]
        exact hasDerivWithinAt_const x axisWindow.interval _
  · have hz : etaJet n m = fun _ : ℝ => 0 := by funext y; simp [etaJet, hn]
    rw [hz]
    have hnext : etaJet n (m + 1) x = 0 := by simp [etaJet, hn]
    rw [hnext]
    exact hasDerivWithinAt_const x axisWindow.interval _

theorem etaJet_bound (n m : ℕ) (x : ℝ) (hx : x ∈ axisWindow.interval) :
    |etaJet n m x| ≤ 2 * weight rho n m := by
  by_cases hn : n = 0
  · subst n
    cases m with
    | zero => simpa [etaJet, weight] using eta_abs_bound hx
    | succ m =>
      cases m with
      | zero =>
        have hi : (2 : ℝ) ≤ rho⁻¹ := by
          rw [← one_div rho, le_div_iff₀ rho_pos]
          linarith [rho_le_sixteenth]
        norm_num [etaJet, weight]
        linarith
      | succ m =>
        simpa [etaJet] using (mul_nonneg (by norm_num : (0 : ℝ) ≤ 2)
          (weight_pos rho_pos 0 (m + 1 + 1)).le)
  · simpa [etaJet, hn] using (mul_nonneg (by norm_num : (0 : ℝ) ≤ 2)
      (weight_pos rho_pos n m).le)

def oneInput : AxisSpace axisWindow rho :=
  ofJetFamily axisWindow (weight rho) (weight_pos rho_pos) oneJet
    oneJet_continuous oneJet_derivative 2 (by norm_num) oneJet_bound

def etaInput : AxisSpace axisWindow rho :=
  ofJetFamily axisWindow (weight rho) (weight_pos rho_pos) etaJet
    etaJet_continuous etaJet_derivative 2 (by norm_num) etaJet_bound

theorem oneInput_norm : ‖oneInput‖ ≤ 2 :=
  norm_ofJetFamily_le axisWindow (weight rho) (weight_pos rho_pos) oneJet
    oneJet_continuous oneJet_derivative 2 (by norm_num) oneJet_bound

theorem etaInput_norm : ‖etaInput‖ ≤ 2 :=
  norm_ofJetFamily_le axisWindow (weight rho) (weight_pos rho_pos) etaJet
    etaJet_continuous etaJet_derivative 2 (by norm_num) etaJet_bound

theorem oneInput_coefficient (n : ℕ) {x : ℝ} (hx : x ∈ axisWindow.interval) :
    coefficient axisWindow (weight rho) oneInput n x = if n = 0 then 1 else 0 := by
  rw [oneInput, coefficient_ofJetFamily]
  simp [oneJet]
  exact hx

theorem etaInput_coefficient (n : ℕ) {x : ℝ} (hx : x ∈ axisWindow.interval) :
    coefficient axisWindow (weight rho) etaInput n x = if n = 0 then x else 0 := by
  rw [etaInput, coefficient_ofJetFamily]
  simp [etaJet]
  exact hx

open NavierStokes.AnalyticCoefficientBounds NavierStokes.NaturalAxisCoefficients
open scoped BigOperators ContDiff

/-- The exact loss at the chosen factor-16 Cauchy radius is below two. -/
theorem square_le_four_pow (m : ℕ) : ((m : ℝ) + 1) ^ 2 ≤ (4 : ℝ) ^ m := by
  induction m with
  | zero => norm_num
  | succ m ih =>
    rw [show (4 : ℝ) ^ (m + 1) = 4 ^ m * 4 by rw [pow_succ]]
    push_cast
    nlinarith [show (0 : ℝ) ≤ m by positivity]

theorem radiusLoss_sixteenth_le_two : radiusLoss (1 / 16) ≤ 2 := by
  have hterm (m : ℕ) : ((m : ℝ) + 1) ^ 2 * (1 / 16 : ℝ) ^ m ≤ (1 / 4 : ℝ) ^ m := by
    calc
      _ ≤ (4 : ℝ) ^ m * (1 / 16 : ℝ) ^ m :=
        mul_le_mul_of_nonneg_right (square_le_four_pow m) (by positivity)
      _ = _ := by rw [← mul_pow]; norm_num
  have hs := summable_geometric_of_norm_lt_one (by norm_num : ‖(1 / 4 : ℝ)‖ < 1)
  calc
    radiusLoss (1 / 16) ≤ ∑' m : ℕ, (1 / 4 : ℝ) ^ m :=
      (summable_radiusLoss (by norm_num) (by norm_num)).tsum_le_tsum hterm hs
    _ = (1 - (1 / 4 : ℝ))⁻¹ := tsum_geometric_of_norm_lt_one (by norm_num)
    _ ≤ 2 := by norm_num

theorem selected_radius_gap : rho < 16 * rho := by linarith [rho_pos]

theorem selected_radius_ratio : rho / (16 * rho) = 1 / 16 := by
  field_simp [rho_pos.ne']

theorem tube_norm_le_three {z : ℂ} (hz : z ∈ closedTube axisWindow (16 * rho)) :
    ‖z‖ ≤ 3 := by
  rcases hz with ⟨x, hx, hz⟩
  have hxnorm : ‖(x : ℂ)‖ ≤ 2 := by simpa using eta_abs_bound hx
  rw [dist_eq_norm] at hz
  have htri := norm_add_le (z - (x : ℂ)) (x : ℂ)
  rw [sub_add_cancel] at htri
  linarith [rho_le_small]

theorem complexL_norm_lower {z : ℂ} (hz : z ∈ closedTube axisWindow (16 * rho)) :
    (1 / 2 : ℝ) ≤ ‖complexL h z‖ := by
  have hz3 := tube_norm_le_three hz
  have hs : ‖z‖ ^ 2 ≤ 9 := by nlinarith [norm_nonneg z]
  have hterm : ‖2 * (h : ℂ) * z ^ 2‖ ≤ 1 / 2 := by
    rw [norm_mul, norm_mul, norm_pow]
    norm_num only [Complex.norm_ofNat, Complex.norm_real, Real.norm_eq_abs,
      abs_of_pos h_pos]
    have hp := mul_le_mul_of_nonneg_left hs h_pos.le
    nlinarith [h_le_thousandth]
  have hl := norm_sub_norm_le (1 : ℂ) (2 * (h : ℂ) * z ^ 2)
  norm_num only [norm_one] at hl
  unfold complexL
  linarith

def inverseLComplex (z : ℂ) : ℂ := (complexL h z)⁻¹

theorem inverseL_analytic : AnalyticOnNhd ℂ inverseLComplex (closedTube axisWindow (16 * rho)) := by
  intro z hz
  have hn : complexL h z ≠ 0 := norm_pos_iff.mp (by linarith [complexL_norm_lower hz])
  have hf : AnalyticAt ℂ (complexL h) z := by unfold complexL; fun_prop
  exact hf.inv hn

theorem inverseL_complex_bound (z : ℂ) (hz : z ∈ closedTube axisWindow (16 * rho)) :
    ‖inverseLComplex z‖ ≤ 2 := by
  have hl := complexL_norm_lower hz
  have hp : 0 < ‖complexL h z‖ := by linarith
  rw [inverseLComplex, norm_inv, ← one_div, div_le_iff₀ hp]
  linarith

def inverseLInput : AxisSpace axisWindow rho :=
  boundedAxisElement rho_pos selected_radius_gap (by norm_num : (0 : ℝ) < 2)
    inverseL_analytic inverseL_complex_bound

theorem inverseLInput_norm : ‖inverseLInput‖ ≤ 4 := by
  have hb := boundedAxisElement_norm rho_pos selected_radius_gap
    (by norm_num : (0 : ℝ) < 2) inverseL_analytic inverseL_complex_bound
  rw [selected_radius_ratio] at hb
  change ‖inverseLInput‖ ≤ _ at hb
  linarith [radiusLoss_sixteenth_le_two]

theorem inverseLInput_coefficient (n : ℕ) {x : ℝ} (hx : x ∈ axisWindow.interval) :
    coefficient axisWindow (weight rho) inverseLInput n x =
      if n = 0 then (NavierStokes.NaturalAxisData.L h x)⁻¹ else 0 := by
  rw [inverseLInput, boundedAxisElement_coefficient rho_pos selected_radius_gap
    (by norm_num : (0 : ℝ) < 2) inverseL_analytic inverseL_complex_bound n hx]
  simp [inverseLComplex, complexL_ofReal]

/-- Literal parameters of the new outgoing schedule, without a generic
caller-supplied pressure function or smoothness record. -/
def Pstar : ℝ := Real.exp (2 * T)
def lam : ℝ := Real.exp (-1000 * T)

theorem Pstar_pos : 0 < Pstar := Real.exp_pos _
theorem Pstar_ge_two : 2 ≤ Pstar := by
  unfold Pstar
  nlinarith [Real.add_one_le_exp (2 * T), T_pos,
    show 10 < T by unfold T; linarith [Real.exp_pos Md]]
theorem lam_pos : 0 < lam := Real.exp_pos _
theorem lam_lt_tenth : lam < 1 / 10 := by
  have he : (10 : ℝ) < Real.exp (1000 * T) := by
    nlinarith [Real.add_one_le_exp (1000 * T),
      show 10 < T by unfold T; linarith [Real.exp_pos Md]]
  have hi := one_div_lt_one_div_of_lt (by norm_num : (0 : ℝ) < 10) he
  unfold lam
  rw [show -1000 * T = -(1000 * T) by ring, Real.exp_neg]
  simpa only [one_div] using hi
theorem h_le_lam_squared : h ≤ lam ^ 2 := by
  unfold h lam
  rw [← Real.exp_nat_mul]
  apply Real.exp_le_exp.mpr
  norm_num
  nlinarith [T_pos]
theorem h_small_for_schedule : 2 * h < lam := by
  have hp := mul_pos lam_pos (show 0 < 1 - 2 * lam by linarith [lam_lt_tenth])
  nlinarith [h_le_lam_squared]

def actualCore : NavierStokes.OutgoingSchedule.Parameters where
  P := Pstar
  m := Md
  lam := lam
  wait := 60000 * T
  P_pos := Pstar_pos
  m_pos := by unfold Md; positivity
  lam_pos := lam_pos
  lam_lt := lam_lt_tenth
  wait_gt := by nlinarith [show 10 < T by unfold T; linarith [Real.exp_pos Md]]

/- The upstream TailData fixes a different flattenLength and tailCoefficient.
The next wrapper is therefore a comparison object, NOT the pressure datum
used by the frozen new profile.  The shared core parameters alone do not
establish equality of the two complete schedules. -/
def canonicalTail : NavierStokes.OutgoingTail.TailData where
  core := actualCore
  h := h
  h_pos := h_pos
  h_small := h_small_for_schedule

def canonicalPressure : ℝ → ℝ := NavierStokes.SchedulePressure.axisPressure canonicalTail
def canonicalComplexPressure : ℂ → ℂ := NavierStokes.SchedulePressure.complexAxisPressure canonicalTail

theorem canonicalPressure_is_literal_integral (eta : ℝ) :
    canonicalPressure eta = -(1 / 2 : ℝ) * ∫ y : ℝ,
      NavierStokes.OutgoingTail.finalAngular canonicalTail (y, eta) ^ 2 := rfl

theorem canonicalPressure_smooth : ContDiff ℝ ∞ canonicalPressure :=
  NavierStokes.SchedulePressure.axisPressure_contDiff canonicalTail

theorem canonicalComplexPressure_analytic :
    AnalyticOnNhd ℂ canonicalComplexPressure NavierStokes.PressureDatum.strip :=
  NavierStokes.SchedulePressure.complexAxisPressure_analytic canonicalTail

theorem canonicalComplexPressure_real (eta : ℝ) :
    canonicalComplexPressure (eta : ℂ) = (canonicalPressure eta : ℂ) :=
  NavierStokes.SchedulePressure.complexAxisPressure_ofReal canonicalTail eta

theorem canonicalPressure_pressureData : NavierStokes.NaturalAxisData.PressureData canonicalPressure :=
  NavierStokes.SchedulePressure.natural_axis_pressureData canonicalTail Pstar_ge_two

theorem actualCore_dropLength : actualCore.dropLength = T := rfl
theorem actualCore_wait : actualCore.wait = 60000 * T := rfl

open NavierStokes.OutgoingSchedule NavierStokes.OutgoingTail
open MeasureTheory Filter
open scoped Topology

/-! The exact new tail, with Tf=128 and co=1/256. The release ODE
and releaseAdjustment from the canonical object depend only on h and
lambda, not on its different flattenLength or terminal coefficient. -/

def newTailRho : ℝ := h / 256
def newTailShape (t : ℝ) : ℝ :=
  1 - newTailRho + newTailRho * NavierStokes.OutgoingSchedule.sigma ((t - 1) / 2)
def newTailShapeDeriv (t : ℝ) : ℝ :=
  (newTailRho / 2) * deriv NavierStokes.OutgoingSchedule.sigma ((t - 1) / 2)
def newTailDebt : ℝ :=
  (∫ t in (0 : ℝ)..3, Real.exp ((1 - h) * t) * newTailShapeDeriv t) / (1 - newTailRho)
def newDecayHold : ℝ :=
  Real.log (releaseLag canonicalTail canonicalTail.rampEnd / newTailDebt) / (1 - h)
def newFlattenEnd : ℝ := actualCore.endpoint + 128
def newReleaseStart : ℝ := newFlattenEnd + 30000 * T
def newTailStart : ℝ := newReleaseStart + canonicalTail.rampEnd + newDecayHold
def newShapeExponent (y : ℝ) : ℝ :=
  1 - NavierStokes.OutgoingSchedule.sigma ((y - actualCore.endpoint) / 128)
def newClockAmplitude (y : ℝ) : ℝ :=
  radialAmplitude Pstar T lam y *
    Real.exp (-Real.log 2 * NavierStokes.OutgoingSchedule.sigma ((y - actualCore.endpoint) / 128)) *
    Real.exp (releaseAdjustment canonicalTail (y - newReleaseStart)) *
    (newTailShape (y - newTailStart) / (1 - newTailRho))
def newClockWeight (y : ℝ) : ℝ := newClockAmplitude y ^ 2

theorem newTailRho_pos : 0 < newTailRho := div_pos h_pos (by norm_num)
theorem newTailRho_lt_half : newTailRho < 1 / 2 := by
  unfold newTailRho
  linarith [h_le_thousandth]

theorem newTailShape_contDiff : ContDiff ℝ ∞ newTailShape := by
  unfold newTailShape
  exact contDiff_const.add (contDiff_const.mul
    (sigma_contDiff.comp ((contDiff_id.sub contDiff_const).div_const 2)))

theorem newTailShape_early {t : ℝ} (ht : t ≤ 1) : newTailShape t = 1 - newTailRho := by
  simp [newTailShape, sigma_zero (by linarith : (t - 1) / 2 ≤ 0)]

theorem newTailShape_late {t : ℝ} (ht : 3 ≤ t) : newTailShape t = 1 := by
  rw [newTailShape, sigma_one (by linarith : 1 ≤ (t - 1) / 2)]
  ring

theorem newTailShape_pos (t : ℝ) : 0 < newTailShape t := by
  have hs := mul_nonneg newTailRho_pos.le (sigma_nonneg ((t - 1) / 2))
  unfold newTailShape
  linarith [newTailRho_lt_half]

theorem newShapeExponent_contDiff : ContDiff ℝ ∞ newShapeExponent := by
  unfold newShapeExponent
  exact contDiff_const.sub (sigma_contDiff.comp
    ((contDiff_id.sub contDiff_const).div_const 128))

theorem newShapeExponent_bounds (y : ℝ) : 0 ≤ newShapeExponent y ∧ newShapeExponent y ≤ 1 := by
  unfold newShapeExponent
  constructor <;> linarith [sigma_nonneg ((y - actualCore.endpoint) / 128),
    sigma_le_one ((y - actualCore.endpoint) / 128)]

theorem newClockAmplitude_contDiff : ContDiff ℝ ∞ newClockAmplitude := by
  unfold newClockAmplitude
  exact (((radialAmplitude_contDiff Pstar T lam).mul
    (contDiff_const.mul (sigma_contDiff.comp
      ((contDiff_id.sub contDiff_const).div_const 128))).exp).mul
    (((releaseAdjustment_contDiff canonicalTail).comp
      (contDiff_id.sub contDiff_const)).exp)).mul
    ((newTailShape_contDiff.comp (contDiff_id.sub contDiff_const)).div_const (1 - newTailRho))

theorem newClockAmplitude_pos (y : ℝ) : 0 < newClockAmplitude y := by
  unfold newClockAmplitude radialAmplitude
  exact mul_pos (mul_pos (mul_pos (mul_pos Pstar_pos (Real.exp_pos _))
    (Real.exp_pos _)) (Real.exp_pos _))
    (div_pos (newTailShape_pos _) (by linarith [newTailRho_lt_half]))

theorem newClockWeight_contDiff : ContDiff ℝ ∞ newClockWeight := newClockAmplitude_contDiff.pow 2
theorem newClockWeight_nonneg (y : ℝ) : 0 ≤ newClockWeight y := sq_nonneg _

def newLeftCut : ℝ := min (min 0 actualCore.endpoint) (min newReleaseStart (newTailStart + 1))
def newRightCut : ℝ := max (max actualCore.holdStart newFlattenEnd)
  (max (newReleaseStart + canonicalTail.rampEnd) (newTailStart + 3))

theorem newClockAmplitude_left {y : ℝ} (hy : y ≤ newLeftCut) :
    newClockAmplitude y = Pstar * Real.exp (y / 10) := by
  have hy0 : y ≤ 0 := hy.trans ((min_le_left _ _).trans (min_le_left _ _))
  have hyend : y ≤ actualCore.endpoint := hy.trans ((min_le_left _ _).trans (min_le_right _ _))
  have hyrel : y ≤ newReleaseStart := hy.trans ((min_le_right _ _).trans (min_le_left _ _))
  have hytail : y ≤ newTailStart + 1 := hy.trans ((min_le_right _ _).trans (min_le_right _ _))
  have ht : newTailShape (y - newTailStart) = 1 - newTailRho :=
    newTailShape_early (by linarith)
  have hs : NavierStokes.OutgoingSchedule.sigma ((y - actualCore.endpoint) / 128) = 0 :=
    sigma_zero (by linarith)
  have hr := releaseAdjustment_early canonicalTail (t := y - newReleaseStart) (by linarith)
  unfold newClockAmplitude radialAmplitude
  rw [hs, mul_zero, Real.exp_zero, hr, Real.exp_zero, ht,
    div_self (by linarith [newTailRho_lt_half] : 1 - newTailRho ≠ 0),
    mul_one, mul_one, mul_one, logAmplitude_ideal T_pos.le hy0]

theorem newClockWeight_left {y : ℝ} (hy : y ≤ newLeftCut) :
    newClockWeight y = Pstar ^ 2 * Real.exp ((1 / 5 : ℝ) * y) := by
  rw [newClockWeight, newClockAmplitude_left hy, mul_pow, ← Real.exp_nat_mul]
  congr 1
  congr 1
  norm_num
  ring

end MathScope.SameDatumInputs

#print axioms MathScope.SameDatumInputs.rho_pos
#print axioms MathScope.SameDatumInputs.oneInput_norm
#print axioms MathScope.SameDatumInputs.etaInput_norm
#print axioms MathScope.SameDatumInputs.oneInput_coefficient
#print axioms MathScope.SameDatumInputs.etaInput_coefficient
#print axioms MathScope.SameDatumInputs.radiusLoss_sixteenth_le_two
#print axioms MathScope.SameDatumInputs.inverseLInput_norm
#print axioms MathScope.SameDatumInputs.inverseLInput_coefficient
#print axioms MathScope.SameDatumInputs.canonicalPressure_is_literal_integral
#print axioms MathScope.SameDatumInputs.canonicalPressure_pressureData
#print axioms MathScope.SameDatumInputs.canonicalComplexPressure_analytic
