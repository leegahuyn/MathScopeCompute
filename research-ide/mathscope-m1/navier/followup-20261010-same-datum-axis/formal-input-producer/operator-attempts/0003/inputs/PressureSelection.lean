import SameDatumInputs
import Mathlib.Analysis.Complex.ExponentialBounds
import Mathlib.Tactic

/-! Actual new Tf=128, co=1/256 pressure: positive selected terminal wait
and the ideal prefix required by the original PressureData constructor.
Every inequality below concerns the new literal clock, not canonicalPressure.
-/

noncomputable section

namespace MathScope.SameDatumInputs

open Set MeasureTheory NavierStokes.OutgoingSchedule NavierStokes.OutgoingTail
open scoped Topology ContDiff

theorem newTailShapeDeriv_contDiff : ContDiff ℝ ∞ newTailShapeDeriv :=
  contDiff_const.mul (((contDiff_infty_iff_deriv.mp sigma_contDiff).2).comp
    ((contDiff_id.sub contDiff_const).div_const 2))

theorem newTailShape_hasDerivAt (t : ℝ) :
    HasDerivAt newTailShape (newTailShapeDeriv t) t := by
  have hs := (sigma_contDiff.differentiable (by simp) ((t-1)/2)).hasDerivAt
  have hm := (hs.comp t (((hasDerivAt_id t).sub_const 1).div_const 2)).const_mul newTailRho
  convert! hm.const_add (1-newTailRho) using 1 <;> simp [newTailShape, newTailShapeDeriv] <;> ring

theorem newTailShapeDeriv_nonneg (t : ℝ) : 0 ≤ newTailShapeDeriv t :=
  mul_nonneg (div_nonneg newTailRho_pos.le (by norm_num)) (sigma_derivative_nonneg _)

theorem newTailShapeDeriv_integral :
    (∫ t in (0 : ℝ)..3, newTailShapeDeriv t) = newTailRho := by
  have hi := intervalIntegral.integral_eq_sub_of_hasDerivAt
    (fun t _ => newTailShape_hasDerivAt t)
    (newTailShapeDeriv_contDiff.continuous.intervalIntegrable 0 3)
  rw [newTailShape_late (by norm_num), newTailShape_early (by norm_num)] at hi
  linarith

theorem newTailDebt_bounds :
    newTailRho/(1-newTailRho) ≤ newTailDebt ∧
    newTailDebt ≤ Real.exp 3*newTailRho/(1-newTailRho) := by
  have hden : 0 < 1-newTailRho := by linarith [newTailRho_lt_half]
  have hsub : 0 < 1-h := by linarith [h_le_thousandth]
  have hc : Continuous (fun t => Real.exp ((1-h)*t)*newTailShapeDeriv t) :=
    (Real.continuous_exp.comp (continuous_const.mul continuous_id)).mul
      newTailShapeDeriv_contDiff.continuous
  have hlo := intervalIntegral.integral_mono_on (μ := volume) (a := 0) (b := 3)
    (by norm_num) (newTailShapeDeriv_contDiff.continuous.intervalIntegrable 0 3)
    (hc.intervalIntegrable 0 3) (fun t ht => ?_)
  have hhi := intervalIntegral.integral_mono_on (μ := volume) (a := 0) (b := 3)
    (g := fun t => Real.exp 3*newTailShapeDeriv t)
    (by norm_num) (hc.intervalIntegrable 0 3)
    ((continuous_const.mul newTailShapeDeriv_contDiff.continuous).intervalIntegrable 0 3)
    (fun t ht => ?_)
  · rw [newTailShapeDeriv_integral] at hlo
    rw [intervalIntegral.integral_const_mul, newTailShapeDeriv_integral] at hhi
    exact ⟨(div_le_div_iff_of_pos_right hden).mpr hlo,
      (div_le_div_iff_of_pos_right hden).mpr hhi⟩
  · have he : Real.exp ((1-h)*t) ≤ Real.exp 3 := by
      apply Real.exp_le_exp.mpr
      nlinarith [h_pos,ht.1,ht.2]
    exact mul_le_mul_of_nonneg_right he (newTailShapeDeriv_nonneg t)
  · have he : 1 ≤ Real.exp ((1-h)*t) :=
      Real.one_le_exp_iff.mpr (mul_nonneg hsub.le ht.1)
    nlinarith [mul_le_mul_of_nonneg_right he (newTailShapeDeriv_nonneg t)]

theorem newTailDebt_pos : 0 < newTailDebt :=
  (div_pos newTailRho_pos (by linarith [newTailRho_lt_half])).trans_le newTailDebt_bounds.1

theorem newTailDebt_small : newTailDebt < Real.exp (-2)*h := by
  have hden : 0 < 1-newTailRho := by linarith [newTailRho_lt_half]
  have hratio : newTailRho/(1-newTailRho) ≤ h/255 := by
    apply (div_le_iff₀ hden).mpr
    unfold newTailRho
    nlinarith [mul_nonneg h_pos.le (sub_nonneg.mpr h_le_one)]
  have hexp : Real.exp 5 < 255 := by
    calc
      Real.exp 5 = (Real.exp 1)^5 := by rw [← Real.exp_nat_mul]; norm_num
      _ < (3 : ℝ)^5 := by gcongr; exact Real.exp_one_lt_three
      _ < 255 := by norm_num
  have hcoef : Real.exp 3/255 < Real.exp (-2) := by
    apply (div_lt_iff₀ (by norm_num : (0 : ℝ) < 255)).mpr
    have he : Real.exp 3 = Real.exp (-2)*Real.exp 5 := by rw [← Real.exp_add]; norm_num
    rw [he]
    simpa only [mul_comm] using mul_lt_mul_of_pos_left hexp (Real.exp_pos (-2))
  calc
    newTailDebt ≤ Real.exp 3*newTailRho/(1-newTailRho) := newTailDebt_bounds.2
    _ = Real.exp 3*(newTailRho/(1-newTailRho)) := by ring
    _ ≤ Real.exp 3*(h/255) := mul_le_mul_of_nonneg_left hratio (Real.exp_pos _).le
    _ = (Real.exp 3/255)*h := by ring
    _ < _ := mul_lt_mul_of_pos_right hcoef h_pos

theorem releaseLag_gt_newTailDebt :
    newTailDebt < releaseLag canonicalTail canonicalTail.rampEnd := by
  have hl := mul_lt_mul_of_pos_left (initialLag_gt_h canonicalTail) (Real.exp_pos (-2))
  exact newTailDebt_small.trans (hl.trans_le (releaseLag_lower canonicalTail))

theorem newDecayHold_pos : 0 < newDecayHold := by
  unfold newDecayHold
  apply div_pos _ (by linarith [h_le_thousandth])
  apply Real.log_pos
  exact (one_lt_div newTailDebt_pos).mpr releaseLag_gt_newTailDebt

theorem newDecayHold_hits_target :
    releaseLag canonicalTail canonicalTail.rampEnd *
      Real.exp (-(1-h)*newDecayHold) = newTailDebt := by
  have hq : 0 < releaseLag canonicalTail canonicalTail.rampEnd :=
    newTailDebt_pos.trans releaseLag_gt_newTailDebt
  have he : -(1-h)*newDecayHold =
      -Real.log (releaseLag canonicalTail canonicalTail.rampEnd/newTailDebt) := by
    unfold newDecayHold
    field_simp [show 1-h ≠ 0 by linarith [h_le_thousandth]]
  rw [he, Real.exp_neg, Real.exp_log (div_pos hq newTailDebt_pos)]
  field_simp

theorem newCoreEndpoint_pos : 0 < actualCore.endpoint := by
  dsimp [Parameters.endpoint]
  linarith [actualCore.pulseStart_pos,actualCore.pulseLength_pos]

theorem newReleaseStart_pos : 0 < newReleaseStart := by
  dsimp [newReleaseStart,newFlattenEnd]
  linarith [newCoreEndpoint_pos,T_pos]

theorem newTailStart_pos : 0 < newTailStart := by
  unfold newTailStart
  linarith [newReleaseStart_pos,canonicalTail.rampEnd_pos,newDecayHold_pos]

theorem newLeftCut_nonneg : 0 ≤ newLeftCut := by
  unfold newLeftCut
  exact le_min (le_min le_rfl newCoreEndpoint_pos.le)
    (le_min newReleaseStart_pos.le (by linarith [newTailStart_pos]))

theorem newClockWeight_ideal {y : ℝ} (hy : y ≤ 0) :
    newClockWeight y = Pstar^2*Real.exp ((1/5 : ℝ)*y) :=
  newClockWeight_left (hy.trans newLeftCut_nonneg)

theorem newShapeExponent_ideal {y : ℝ} (hy : y ≤ 0) : newShapeExponent y = 1 := by
  unfold newShapeExponent
  rw [sigma_zero (by linarith [newCoreEndpoint_pos] : (y-actualCore.endpoint)/128 ≤ 0)]
  ring

theorem newPressure_pressureData : NavierStokes.NaturalAxisData.PressureData newPressure :=
  NavierStokes.NaturalAxisData.pressureData_of_ideal_prefix newPressure_admissible Pstar_ge_two
    (fun _ hy => newClockWeight_ideal hy) (fun _ hy => newShapeExponent_ideal hy)

end MathScope.SameDatumInputs

#print axioms MathScope.SameDatumInputs.newTailDebt_bounds
#print axioms MathScope.SameDatumInputs.newTailDebt_small
#print axioms MathScope.SameDatumInputs.newDecayHold_pos
#print axioms MathScope.SameDatumInputs.newDecayHold_hits_target
#print axioms MathScope.SameDatumInputs.newClockWeight_ideal
#print axioms MathScope.SameDatumInputs.newShapeExponent_ideal
#print axioms MathScope.SameDatumInputs.newPressure_pressureData
