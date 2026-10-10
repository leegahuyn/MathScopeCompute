import SameDatumInputs
import Mathlib.Analysis.Complex.ExponentialBounds

/-! A mass bound for the actual new clock weight, with its selected Tf=128
and co=1/256. No bound on an unknown pressure, no tail replacement, and no
numerical zero for lambda or h is assumed. -/

noncomputable section

namespace MathScope.SameDatumInputs

open Set MeasureTheory
open NavierStokes.OutgoingSchedule NavierStokes.OutgoingTail
open scoped Topology

theorem mass_tailShape_le_one (t : ℝ) : newTailShape t ≤ 1 := by
  have hs := mul_le_mul_of_nonneg_left
    (NavierStokes.OutgoingSchedule.sigma_le_one ((t - 1) / 2)) newTailRho_pos.le
  unfold newTailShape
  linarith

theorem mass_tailRatio_nonneg (t : ℝ) :
    0 ≤ newTailShape t / (1 - newTailRho) :=
  div_nonneg (newTailShape_pos t).le (by linarith [newTailRho_lt_half])

theorem mass_tailRatio_le_two (t : ℝ) :
    newTailShape t / (1 - newTailRho) ≤ 2 := by
  apply (div_le_iff₀ (by linarith [newTailRho_lt_half] : 0 < 1 - newTailRho)).mpr
  linarith [mass_tailShape_le_one t, newTailRho_lt_half]

theorem mass_flattenFactor_le_one (y : ℝ) :
    Real.exp (-Real.log 2 * NavierStokes.OutgoingSchedule.sigma
      ((y - actualCore.endpoint) / 128)) ≤ 1 := by
  apply Real.exp_le_one_iff.mpr
  exact mul_nonpos_of_nonpos_of_nonneg
    (neg_nonpos.mpr (Real.log_nonneg (by norm_num))) (sigma_nonneg _)

theorem mass_releaseStart_ge_hold : actualCore.holdStart ≤ newReleaseStart := by
  have he : actualCore.holdStart ≤ actualCore.endpoint := by
    dsimp [NavierStokes.OutgoingSchedule.Parameters.endpoint]
    linarith [actualCore.pulseStart_ge_hold, actualCore.pulseLength_pos]
  unfold newReleaseStart newFlattenEnd
  linarith [T_pos]

theorem mass_releaseStart_pos : 0 < newReleaseStart :=
  actualCore.holdStart_pos.trans_le mass_releaseStart_ge_hold

theorem mass_releaseAdjustment_le {t : ℝ} (ht : 0 ≤ t) :
    releaseAdjustment canonicalTail t ≤ lam * t := by
  have hc : Continuous (fun v : ℝ => releaseSlope canonicalTail v + lam) :=
    (releaseSlope_contDiff canonicalTail).continuous.add continuous_const
  calc
    releaseAdjustment canonicalTail t =
        ∫ v in (0 : ℝ)..t, releaseSlope canonicalTail v + lam := rfl
    _ ≤ ∫ _v in (0 : ℝ)..t, lam :=
      intervalIntegral.integral_mono_on ht (hc.intervalIntegrable 0 t)
        (continuous_const.intervalIntegrable 0 t) (fun v _ => by
          have hs := (releaseSlope_bounds canonicalTail v).2
          change releaseSlope canonicalTail v ≤ -h at hs
          linarith [h_pos])
    _ = lam * t := by simp [mul_comm]

theorem mass_slope_le_three_fifths (v : ℝ) : slope T lam v ≤ 3 / 5 := by
  have hs := sigma_nonneg v
  have hl := mul_nonneg lam_pos.le (sigma_nonneg (v - (T + 1)))
  unfold slope
  linarith

theorem mass_slope_nonpos {v : ℝ} (hv : 1 ≤ v) : slope T lam v ≤ 0 := by
  have hl := mul_nonneg lam_pos.le (sigma_nonneg (v - (T + 1)))
  rw [slope, sigma_one hv]
  linarith

theorem mass_logAmplitude_unit {y : ℝ} (hy : 0 ≤ y) :
    logAmplitude T lam y ≤ y / 10 := by
  have hc : Continuous (fun v : ℝ => slope T lam v - 1 / 2) :=
    (slope_contDiff T lam).continuous.sub continuous_const
  calc
    logAmplitude T lam y = ∫ v in (0 : ℝ)..y, slope T lam v - 1 / 2 := rfl
    _ ≤ ∫ _v in (0 : ℝ)..y, (1 / 10 : ℝ) :=
      intervalIntegral.integral_mono_on hy (hc.intervalIntegrable 0 y)
        (continuous_const.intervalIntegrable 0 y)
        (fun v _ => by linarith [mass_slope_le_three_fifths v])
    _ = y / 10 := by simp; ring

theorem mass_logAmplitude_nonneg_clock {y : ℝ} (hy : 0 ≤ y) :
    logAmplitude T lam y ≤ 3 / 5 - y / 2 := by
  by_cases hy1 : y ≤ 1
  · linarith [mass_logAmplitude_unit hy]
  · have h1y : 1 ≤ y := (le_of_not_ge hy1).le
    have hc : Continuous (fun v : ℝ => slope T lam v - 1 / 2) :=
      (slope_contDiff T lam).continuous.sub continuous_const
    have hp : (∫ v in (1 : ℝ)..y, slope T lam v - 1 / 2) ≤ -(y - 1) / 2 := by
      calc
        _ ≤ ∫ _v in (1 : ℝ)..y, (-1 / 2 : ℝ) :=
          intervalIntegral.integral_mono_on h1y (hc.intervalIntegrable 1 y)
            (continuous_const.intervalIntegrable 1 y)
            (fun v hv => by linarith [mass_slope_nonpos hv.1])
        _ = -(y - 1) / 2 := by simp; ring
    have hj : logAmplitude T lam y = logAmplitude T lam 1 +
        ∫ v in (1 : ℝ)..y, slope T lam v - 1 / 2 := by
      exact (intervalIntegral.integral_add_adjacent_intervals
        (hc.intervalIntegrable 0 1) (hc.intervalIntegrable 1 y)).symm
    rw [hj]
    linarith [mass_logAmplitude_unit (y := 1) (by norm_num)]

theorem mass_radialAmplitude_nonneg_clock {y : ℝ} (hy : 0 ≤ y) :
    radialAmplitude Pstar T lam y ≤ Pstar * Real.exp (3 / 5 - y / 2) := by
  exact mul_le_mul_of_nonneg_left
    (Real.exp_le_exp.mpr (mass_logAmplitude_nonneg_clock hy)) Pstar_pos.le

theorem mass_clockAmplitude_le_double (y : ℝ) :
    newClockAmplitude y ≤ 2 * (radialAmplitude Pstar T lam y *
      Real.exp (releaseAdjustment canonicalTail (y - newReleaseStart))) := by
  have hp : 0 ≤ radialAmplitude Pstar T lam y := by
    unfold radialAmplitude
    exact (mul_pos Pstar_pos (Real.exp_pos _)).le
  have hb : 0 ≤ radialAmplitude Pstar T lam y *
      Real.exp (releaseAdjustment canonicalTail (y - newReleaseStart)) :=
    mul_nonneg hp (Real.exp_pos _).le
  unfold newClockAmplitude
  calc
    _ = (radialAmplitude Pstar T lam y *
      Real.exp (releaseAdjustment canonicalTail (y - newReleaseStart))) *
      Real.exp (-Real.log 2 * NavierStokes.OutgoingSchedule.sigma
        ((y - actualCore.endpoint) / 128)) *
      (newTailShape (y - newTailStart) / (1 - newTailRho)) := by ring
    _ ≤ (radialAmplitude Pstar T lam y *
      Real.exp (releaseAdjustment canonicalTail (y - newReleaseStart))) * 1 * 2 :=
      mul_le_mul (mul_le_mul_of_nonneg_left (mass_flattenFactor_le_one y) hb)
        (mass_tailRatio_le_two _) (mass_tailRatio_nonneg _) (by positivity)
    _ = _ := by ring

theorem mass_clockAmplitude_left {y : ℝ} (hy : y ≤ 0) :
    newClockAmplitude y ≤ 2 * Pstar * Real.exp (y / 10) := by
  have hr := releaseAdjustment_early canonicalTail
    (t := y - newReleaseStart) (by linarith [mass_releaseStart_pos])
  have hb := mass_clockAmplitude_le_double y
  simpa [hr, radialAmplitude, logAmplitude_ideal T_pos.le hy, mul_assoc] using hb

theorem mass_radialRelease_nonneg_clock {y : ℝ} (hy : 0 ≤ y) :
    radialAmplitude Pstar T lam y *
      Real.exp (releaseAdjustment canonicalTail (y - newReleaseStart)) ≤
        Pstar * Real.exp (3 / 5 - y / 2) := by
  by_cases hyr : y ≤ newReleaseStart
  · rw [releaseAdjustment_early canonicalTail (by linarith : y - newReleaseStart ≤ 0),
      Real.exp_zero, mul_one]
    exact mass_radialAmplitude_nonneg_clock hy
  · have hry : newReleaseStart ≤ y := (le_of_not_ge hyr).le
    have hrad : radialAmplitude Pstar T lam y =
        radialAmplitude Pstar T lam newReleaseStart *
          Real.exp (-(1 / 2 + lam) * (y - newReleaseStart)) :=
      radialAmplitude_hold actualCore.dropLength_pos.le mass_releaseStart_ge_hold hry
    have ha := mass_releaseAdjustment_le (t := y - newReleaseStart) (by linarith)
    have hb := mass_radialAmplitude_nonneg_clock mass_releaseStart_pos.le
    rw [hrad]
    calc
      _ ≤ (Pstar * Real.exp (3 / 5 - newReleaseStart / 2) *
        Real.exp (-(1 / 2 + lam) * (y - newReleaseStart))) *
          Real.exp (lam * (y - newReleaseStart)) :=
        mul_le_mul (mul_le_mul_of_nonneg_right hb (Real.exp_pos _).le)
          (Real.exp_le_exp.mpr ha) (Real.exp_pos _).le (by positivity)
      _ = Pstar * (Real.exp (3 / 5 - newReleaseStart / 2) *
        Real.exp (-(1 / 2 + lam) * (y - newReleaseStart)) *
          Real.exp (lam * (y - newReleaseStart))) := by ring
      _ = _ := by
        rw [← Real.exp_add, ← Real.exp_add]
        congr 1
        congr 1
        ring

theorem mass_clockAmplitude_right {y : ℝ} (hy : 0 ≤ y) :
    newClockAmplitude y ≤ 2 * Pstar * Real.exp (3 / 5 - y / 2) := by
  have hb := mul_le_mul_of_nonneg_left (mass_radialRelease_nonneg_clock hy)
    (by norm_num : (0 : ℝ) ≤ 2)
  exact (mass_clockAmplitude_le_double y).trans (by simpa [mul_assoc] using hb)

theorem mass_clockWeight_left {y : ℝ} (hy : y ≤ 0) :
    newClockWeight y ≤ 4 * Pstar ^ 2 * Real.exp ((1 / 5 : ℝ) * y) := by
  have he : Real.exp (y / 10) ^ 2 = Real.exp ((1 / 5 : ℝ) * y) := by
    rw [← Real.exp_nat_mul]
    congr 1
    norm_num
    ring
  calc
    newClockWeight y ≤ (2 * Pstar * Real.exp (y / 10)) ^ 2 :=
      pow_le_pow_left₀ (newClockAmplitude_pos y).le (mass_clockAmplitude_left hy) 2
    _ = _ := by rw [mul_pow, mul_pow, he]; ring

theorem mass_clockWeight_right {y : ℝ} (hy : 0 ≤ y) :
    newClockWeight y ≤
      (4 * Pstar ^ 2 * Real.exp (6 / 5)) * Real.exp ((-1 : ℝ) * y) := by
  have he : Real.exp (3 / 5 - y / 2) ^ 2 =
      Real.exp (6 / 5) * Real.exp ((-1 : ℝ) * y) := by
    rw [← Real.exp_nat_mul, ← Real.exp_add]
    congr 1
    norm_num
    ring
  calc
    newClockWeight y ≤ (2 * Pstar * Real.exp (3 / 5 - y / 2)) ^ 2 :=
      pow_le_pow_left₀ (newClockAmplitude_pos y).le (mass_clockAmplitude_right hy) 2
    _ = _ := by rw [mul_pow, mul_pow, he]; ring

theorem mass_clockWeight_integral_left :
    (∫ y in Iic (0 : ℝ), newClockWeight y) ≤ 20 * Pstar ^ 2 := by
  have hb := setIntegral_mono_on newClockWeight_integrable.integrableOn
    ((integrableOn_exp_mul_Iic (by norm_num : (0 : ℝ) < 1 / 5) 0).const_mul
      (4 * Pstar ^ 2)) measurableSet_Iic (fun y hy => mass_clockWeight_left hy)
  calc
    _ ≤ ∫ y in Iic (0 : ℝ), 4 * Pstar ^ 2 * Real.exp ((1 / 5 : ℝ) * y) := hb
    _ = 20 * Pstar ^ 2 := by
      rw [integral_const_mul, integral_exp_mul_Iic (by norm_num : (0 : ℝ) < 1 / 5) 0]
      norm_num
      ring

theorem mass_clockWeight_integral_right :
    (∫ y in Ioi (0 : ℝ), newClockWeight y) ≤ 4 * Pstar ^ 2 * Real.exp (6 / 5) := by
  have hb := setIntegral_mono_on newClockWeight_integrable.integrableOn
    ((integrableOn_exp_mul_Ioi (by norm_num : (-1 : ℝ) < 0) 0).const_mul
      (4 * Pstar ^ 2 * Real.exp (6 / 5))) measurableSet_Ioi
      (fun y hy => mass_clockWeight_right hy.le)
  calc
    _ ≤ ∫ y in Ioi (0 : ℝ), (4 * Pstar ^ 2 * Real.exp (6 / 5)) *
        Real.exp ((-1 : ℝ) * y) := hb
    _ = 4 * Pstar ^ 2 * Real.exp (6 / 5) := by
      rw [integral_const_mul, integral_exp_mul_Ioi (by norm_num : (-1 : ℝ) < 0) 0]
      norm_num

theorem mass_exp_six_fifths_lt_nine : Real.exp (6 / 5 : ℝ) < 9 := by
  have he := Real.exp_one_lt_three
  have hp := Real.exp_pos (1 : ℝ)
  have h2 : Real.exp (2 : ℝ) < 9 := by
    rw [show (2 : ℝ) = 1 + 1 by norm_num, Real.exp_add]
    nlinarith
  exact (Real.exp_le_exp.mpr (by norm_num : (6 / 5 : ℝ) ≤ 2)).trans_lt h2

/-- A fully instantiated mass bound for the selected new A.21 clock. -/
theorem newClockWeight_mass_le : (∫ y : ℝ, newClockWeight y) ≤ 64 * Pstar ^ 2 := by
  have hsplit := integral_Iic_add_Ioi
    (b := (0 : ℝ)) newClockWeight_integrable.integrableOn newClockWeight_integrable.integrableOn
  have hp : 0 ≤ Pstar ^ 2 := sq_nonneg _
  have he := mul_le_mul_of_nonneg_left mass_exp_six_fifths_lt_nine.le
    (show 0 ≤ 4 * Pstar ^ 2 by positivity)
  linarith [mass_clockWeight_integral_left, mass_clockWeight_integral_right]

end MathScope.SameDatumInputs

#print axioms MathScope.SameDatumInputs.mass_clockAmplitude_left
#print axioms MathScope.SameDatumInputs.mass_clockAmplitude_right
#print axioms MathScope.SameDatumInputs.mass_clockWeight_left
#print axioms MathScope.SameDatumInputs.mass_clockWeight_right
#print axioms MathScope.SameDatumInputs.newClockWeight_mass_le
