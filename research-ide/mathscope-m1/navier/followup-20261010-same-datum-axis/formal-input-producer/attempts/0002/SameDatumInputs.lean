import NavierStokes.AxisCoefficientSpace
import Mathlib.Analysis.SpecialFunctions.ExpDeriv
import Mathlib.Tactic.FunProp

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
theorem j_pos : 0 < j := pow_pos h_pos _
theorem j_le_one : j ≤ 1 := by
  exact pow_le_one₀ h_pos.le h_le_one
theorem sigma_pos : 0 < sigma := div_pos j_pos (by norm_num)
theorem sigma_le_one : sigma ≤ 1 := by
  unfold sigma
  nlinarith [j_le_one]
theorem rho_pos : 0 < rho := div_pos (sq_pos_of_pos sigma_pos) (by norm_num)
theorem rho_le_sixteenth : rho ≤ 1 / 16 := by
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
          rw [le_inv_iff₀ rho_pos]
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

end MathScope.SameDatumInputs

#print axioms MathScope.SameDatumInputs.rho_pos
#print axioms MathScope.SameDatumInputs.oneInput_norm
#print axioms MathScope.SameDatumInputs.etaInput_norm
#print axioms MathScope.SameDatumInputs.oneInput_coefficient
#print axioms MathScope.SameDatumInputs.etaInput_coefficient
