import Mathlib

/-!
For source #622820 this proves a mathematical bracket condition and uniqueness.
It does not show that any actual free or native coordinates satisfy the condition.
The closed interval includes endpoint roots and T = 0. -/

open Set
namespace MathScope.M3.CD.InverseBracket
noncomputable section

def F (h Z T s : ℝ) : ℝ := s - Z^2 * s^(2*h) - T
def G (h Z T s : ℝ) : ℝ := 1 - Z^2 * s^(2*h-1) - T/s

theorem normalized_eq (h Z T s : ℝ) (hs : 0 < s) :
    G h Z T s = F h Z T s / s := by
  unfold G F
  rw [Real.rpow_sub_one (ne_of_gt hs)]
  field_simp

theorem normalized_strictMonoOn (h Z T : ℝ) (hh : h < 1/2) (hT : 0 ≤ T)
    (hnonzero : Z ≠ 0 ∨ 0 < T) : StrictMonoOn (G h Z T) (Ioi 0) := by
  intro x hx y hy hxy
  have hxpos : 0 < x := hx
  have hp : y^(2*h-1) < x^(2*h-1) :=
    Real.rpow_lt_rpow_of_neg hxpos hxy (by linarith)
  have hp0 : y^(2*h-1) ≤ x^(2*h-1) := le_of_lt hp
  have hsq : 0 ≤ Z^2 := sq_nonneg Z
  have hweakpow : Z^2*y^(2*h-1) ≤ Z^2*x^(2*h-1) :=
    mul_le_mul_of_nonneg_left hp0 hsq
  have hweakdiv : T/y ≤ T/x := div_le_div_of_nonneg_left hT hxpos (le_of_lt hxy)
  rcases hnonzero with hZ | hTpos
  · have hstrict : Z^2*y^(2*h-1) < Z^2*x^(2*h-1) :=
      mul_lt_mul_of_pos_left hp (sq_pos_of_ne_zero hZ)
    dsimp [G]
    linarith
  · have hstrict : T/y < T/x := div_lt_div_of_pos_left hTpos hxpos hxy
    dsimp [G]
    linarith

theorem root_unique_on_positive (h Z T x y : ℝ) (hh : h < 1/2) (hT : 0 ≤ T)
    (hx : 0 < x) (hy : 0 < y) (hFx : F h Z T x = 0) (hFy : F h Z T y = 0) :
    x = y := by
  have hn : Z ≠ 0 ∨ 0 < T := by
    by_cases hZ : Z = 0
    · right
      by_contra ht
      have hT0 : T = 0 := by linarith
      simp [F, hZ, hT0] at hFx
      linarith
    · exact Or.inl hZ
  apply (normalized_strictMonoOn h Z T hh hT hn).injOn hx hy
  rw [normalized_eq h Z T x hx, normalized_eq h Z T y hy, hFx, hFy]
  simp

theorem root_exists_of_endpoint_signs (h Z T a b : ℝ) (ha : 0 < a) (hab : a ≤ b)
    (hleft : F h Z T a ≤ 0) (hright : 0 ≤ F h Z T b) :
    ∃ s ∈ Icc a b, F h Z T s = 0 := by
  have hcPow : ContinuousOn (fun x : ℝ => x^(2*h)) (Icc a b) :=
    ContinuousOn.rpow_const continuousOn_id (by
      intro x hx
      exact Or.inl (ne_of_gt (lt_of_lt_of_le ha hx.1)))
  have hc : ContinuousOn (F h Z T) (Icc a b) := by
    unfold F
    exact (continuousOn_id.sub (continuousOn_const.mul hcPow)).sub continuousOn_const
  have hmem : (0:ℝ) ∈ Icc (F h Z T a) (F h Z T b) := ⟨hleft, hright⟩
  obtain ⟨s, hs, hz⟩ := intermediate_value_Icc hab hc hmem
  exact ⟨s, hs, hz⟩

theorem endpoint_signs_of_root (h Z T a b s : ℝ) (ha : 0 < a) (hab : a ≤ b)
    (hh : h < 1/2) (hT : 0 ≤ T) (hs : s ∈ Icc a b) (hz : F h Z T s = 0) :
    F h Z T a ≤ 0 ∧ 0 ≤ F h Z T b := by
  have hspos : 0 < s := lt_of_lt_of_le ha hs.1
  have hb : 0 < b := lt_of_lt_of_le ha hab
  have hn : Z ≠ 0 ∨ 0 < T := by
    by_cases hZ : Z = 0
    · right
      by_contra ht
      have hT0 : T = 0 := by linarith
      simp [F, hZ, hT0] at hz
      linarith
    · exact Or.inl hZ
  have hm := (normalized_strictMonoOn h Z T hh hT hn).monotoneOn
  have hla : G h Z T a ≤ G h Z T s := hm ha hspos hs.1
  have hrb : G h Z T s ≤ G h Z T b := hm hspos hb hs.2
  rw [normalized_eq h Z T a ha, normalized_eq h Z T s hspos, hz, zero_div] at hla
  rw [normalized_eq h Z T b hb, normalized_eq h Z T s hspos, hz, zero_div] at hrb
  constructor
  · have : F h Z T a ≤ 0*a := (div_le_iff₀ ha).1 hla
    linarith
  · have : 0*b ≤ F h Z T b := (le_div_iff₀ hb).1 hrb
    linarith

theorem exact_bracket_root_iff (h Z T a b : ℝ) (ha : 0 < a) (hab : a ≤ b)
    (hh : h < 1/2) (hT : 0 ≤ T) :
    (∃ s ∈ Icc a b, F h Z T s = 0) ↔ (F h Z T a ≤ 0 ∧ 0 ≤ F h Z T b) := by
  constructor
  · rintro ⟨s, hs, hz⟩
    exact endpoint_signs_of_root h Z T a b s ha hab hh hT hs hz
  · rintro ⟨hleft, hright⟩
    exact root_exists_of_endpoint_signs h Z T a b ha hab hleft hright

theorem source_bracket_zero_input_counterexample (h : ℝ) :
    F h 0 0 (1/2) = 1/2 ∧ F h 0 0 2 = 2 := by
  simp [F]

theorem chart_power_factor (h s : ℝ) (hs : 0 < s) :
    (s ^ ((1/2:ℝ)-h))^2 * s^(2*h) = s := by
  have hsquare : (s ^ ((1/2:ℝ)-h))^2 =
      s ^ (((1/2:ℝ)-h) + ((1/2:ℝ)-h)) := by
    calc
      _ = s ^ ((1/2:ℝ)-h) * s ^ ((1/2:ℝ)-h) := by ring
      _ = _ := (Real.rpow_add hs _ _).symm
  rw [hsquare, ← Real.rpow_add hs]
  have hsum : ((1/2:ℝ)-h) + ((1/2:ℝ)-h) + (2*h) = 1 := by ring
  rw [hsum]
  simp

theorem root_to_chart (h Z T s : ℝ) (hs : 0 < s) (hT : 0 ≤ T)
    (hz : F h Z T s = 0) :
    ∃ eta : ℝ, |eta| ≤ 1 ∧ Z = s^((1/2:ℝ)-h)*eta ∧ T = s*(1-eta^2) := by
  let p : ℝ := s^((1/2:ℝ)-h)
  have hp : p ≠ 0 := ne_of_gt (Real.rpow_pos_of_pos hs _)
  let eta : ℝ := Z/p
  have hZ : Z = p*eta := by
    dsimp [eta]
    field_simp
  have hfac : p^2 * s^(2*h) = s := chart_power_factor h s hs
  have hterm : Z^2 * s^(2*h) = s*eta^2 := by
    rw [hZ]
    calc
      _ = (p^2 * s^(2*h))*eta^2 := by ring
      _ = _ := by rw [hfac]
  have hTval : T = s*(1-eta^2) := by
    unfold F at hz
    rw [hterm] at hz
    linarith
  have hsq : eta^2 ≤ 1 := by
    by_contra ht
    have hneg : 1-eta^2 < 0 := by linarith
    have hn : s*(1-eta^2) < 0 := mul_neg_of_pos_of_neg hs hneg
    linarith
  refine ⟨eta, (sq_le_one_iff_abs_le_one eta).mp hsq, ?_, hTval⟩
  exact hZ

theorem chart_to_root (h Z T s eta : ℝ) (hs : 0 < s)
    (hZ : Z = s^((1/2:ℝ)-h)*eta) (hT : T = s*(1-eta^2)) :
    F h Z T s = 0 := by
  have hfac := chart_power_factor h s hs
  unfold F
  rw [hZ, hT]
  calc
    _ = s - ((s^((1/2:ℝ)-h))^2*s^(2*h))*eta^2 - s*(1-eta^2) := by ring
    _ = 0 := by rw [hfac]; ring

theorem chart_image_iff_endpoint_signs (h Z T a b : ℝ) (ha : 0 < a) (hab : a ≤ b)
    (hh : h < 1/2) (hT : 0 ≤ T) :
    (∃ s ∈ Icc a b, ∃ eta : ℝ, |eta| ≤ 1 ∧
      Z = s^((1/2:ℝ)-h)*eta ∧ T = s*(1-eta^2)) ↔
    (F h Z T a ≤ 0 ∧ 0 ≤ F h Z T b) := by
  rw [← exact_bracket_root_iff h Z T a b ha hab hh hT]
  constructor
  · rintro ⟨s, hs, eta, heta, hZ, hTval⟩
    exact ⟨s, hs, chart_to_root h Z T s eta (lt_of_lt_of_le ha hs.1) hZ hTval⟩
  · rintro ⟨s, hs, hz⟩
    obtain ⟨eta, heta, hZ, hTval⟩ := root_to_chart h Z T s (lt_of_lt_of_le ha hs.1) hT hz
    exact ⟨s, hs, eta, heta, hZ, hTval⟩

end
end MathScope.M3.CD.InverseBracket

#print axioms MathScope.M3.CD.InverseBracket.normalized_eq
#print axioms MathScope.M3.CD.InverseBracket.normalized_strictMonoOn
#print axioms MathScope.M3.CD.InverseBracket.root_unique_on_positive
#print axioms MathScope.M3.CD.InverseBracket.root_exists_of_endpoint_signs
#print axioms MathScope.M3.CD.InverseBracket.endpoint_signs_of_root
#print axioms MathScope.M3.CD.InverseBracket.exact_bracket_root_iff
#print axioms MathScope.M3.CD.InverseBracket.source_bracket_zero_input_counterexample
#print axioms MathScope.M3.CD.InverseBracket.chart_power_factor
#print axioms MathScope.M3.CD.InverseBracket.root_to_chart
#print axioms MathScope.M3.CD.InverseBracket.chart_to_root
#print axioms MathScope.M3.CD.InverseBracket.chart_image_iff_endpoint_signs
