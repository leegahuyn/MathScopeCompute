import NavierStokes.SeedConePaper
import Mathlib.Tactic.NormNum

/-!
An explicit finite stress threshold in the original cone predicates.
The analytic source-dependent bounds remain hypotheses. This file does not
identify a numerical profile with an infinite profile or assert a global cone.
-/

set_option autoImplicit false

namespace MathScope.OuterReselection

theorem normalized_threshold_nine {c j v p : ℝ}
    (hcmin : (63 : ℝ) / 64 ≤ c)
    (hcmax : c ≤ (65 : ℝ) / 64)
    (hv0 : 0 ≤ v)
    (hvmax : v ≤ (65 : ℝ) / 32)
    (hgmin : (31 : ℝ) / 16 ≤ 2 * c ^ 2 - (v - 2) * j ^ 2)
    (hp : 9 ≤ p) :
    2 < p * c ∧ v < NavierStokes.ConeAlgebra.coneBound (p * c) (p * j) := by
  have hp0 : 0 < p := by linarith
  have hPc : (9 : ℝ) * (63 / 64) ≤ p * c :=
    mul_le_mul hp hcmin (by norm_num) (le_of_lt hp0)
  have hP : 2 < p * c := by linarith
  have hvP : v < p * c := by linarith
  have hcv : c * v ≤ (65 : ℝ) / 64 * (65 / 32) :=
    mul_le_mul hcmax hvmax hv0 (by norm_num)
  have hgap : (9 : ℝ) * (31 / 16) ≤
      p * (2 * c ^ 2 - (v - 2) * j ^ 2) :=
    mul_le_mul hp hgmin (by norm_num) (le_of_lt hp0)
  have hscale : 4 * c * v <
      p * (2 * c ^ 2 - (v - 2) * j ^ 2) := by nlinarith
  exact ⟨hP, NavierStokes.ConeAlgebra.finite_amplitude_cone hp0 hP hvP hscale⟩

theorem paper_relaxed_threshold_nine {b w p : ℝ}
    (hcmin : (63 : ℝ) / 64 ≤ 1 - b * w / 2)
    (hcmax : 1 - b * w / 2 ≤ (65 : ℝ) / 64)
    (hvmax : 2 + b ^ 2 / 2 ≤ (65 : ℝ) / 32)
    (hgmin : (31 : ℝ) / 16 ≤
      2 * (1 - b * w / 2) ^ 2 -
        ((2 + b ^ 2 / 2) - 2) * (w + b / 2) ^ 2)
    (hp : 9 ≤ p) :
    NavierStokes.SeedConePaper.RelaxedCone 2 b p (w * p) := by
  have hv0 : 0 ≤ 2 + b ^ 2 / 2 := by nlinarith [sq_nonneg b]
  obtain ⟨hP, hroot⟩ :=
    normalized_threshold_nine hcmin hcmax hv0 hvmax hgmin hp
  have hparallel : NavierStokes.SeedConePaper.parallelStress 2 b p (w * p) =
      p * (1 - b * w / 2) := by
    unfold NavierStokes.SeedConePaper.parallelStress
    ring
  have htransverse : NavierStokes.SeedConePaper.transverseStress 2 b p (w * p) =
      p * (w + b / 2) := by
    unfold NavierStokes.SeedConePaper.transverseStress
    ring
  have hshear : NavierStokes.SeedConePaper.shearMagnitude 2 b =
      2 + b ^ 2 / 2 := by
    unfold NavierStokes.SeedConePaper.shearMagnitude
    ring
  unfold NavierStokes.SeedConePaper.RelaxedCone
  rw [hparallel, htransverse, hshear]
  exact ⟨by norm_num, hP, hroot⟩

theorem paper_admissible_threshold_nine {b w p : ℝ}
    (hcmin : (63 : ℝ) / 64 ≤ 1 - b * w / 2)
    (hcmax : 1 - b * w / 2 ≤ (65 : ℝ) / 64)
    (hvmax : 2 + b ^ 2 / 2 ≤ (65 : ℝ) / 32)
    (hgmin : (31 : ℝ) / 16 ≤
      2 * (1 - b * w / 2) ^ 2 -
        ((2 + b ^ 2 / 2) - 2) * (w + b / 2) ^ 2)
    (hp : 9 ≤ p)
    (hstrict : 2 < NavierStokes.SeedConePaper.shearMagnitude 2 b) :
    NavierStokes.SeedConePaper.AdmissibleCone 2 b p (w * p) :=
  ⟨paper_relaxed_threshold_nine hcmin hcmax hvmax hgmin hp, hstrict⟩

theorem zero_axial_shear_is_not_admissible (p w : ℝ) :
    ¬ NavierStokes.SeedConePaper.AdmissibleCone 2 0 p (w * p) := by
  simp [NavierStokes.SeedConePaper.AdmissibleCone,
    NavierStokes.SeedConePaper.shearMagnitude]

theorem normalized_outer_threshold {c j v p : ℝ}
    (hcmin : (1 : ℝ) / 3 ≤ c)
    (hcmax : c ≤ 2259)
    (hv0 : 0 ≤ v)
    (hvmax : v ≤ 116)
    (hgmin : (1 : ℝ) / 4 ≤ 2 * c ^ 2 - (v - 2) * j ^ 2)
    (hp : (2 : ℝ) ^ 24 ≤ p) :
    2 < p * c ∧ v < NavierStokes.ConeAlgebra.coneBound (p * c) (p * j) := by
  have hp0 : 0 < p := by linarith
  have hPc : (2 : ℝ) ^ 24 * (1 / 3) ≤ p * c :=
    mul_le_mul hp hcmin (by norm_num) (le_of_lt hp0)
  have hP : 2 < p * c := by norm_num at hPc ⊢; linarith
  have hvP : v < p * c := by norm_num at hPc; linarith
  have hcv : c * v ≤ (2259 : ℝ) * 116 :=
    mul_le_mul hcmax hvmax hv0 (by norm_num)
  have hgap : (2 : ℝ) ^ 24 * (1 / 4) ≤
      p * (2 * c ^ 2 - (v - 2) * j ^ 2) :=
    mul_le_mul hp hgmin (by norm_num) (le_of_lt hp0)
  have hscale : 4 * c * v <
      p * (2 * c ^ 2 - (v - 2) * j ^ 2) := by
    norm_num at hgap hcv
    nlinarith
  exact ⟨hP, NavierStokes.ConeAlgebra.finite_amplitude_cone hp0 hP hvP hscale⟩

theorem paper_relaxed_outer_threshold {a b w p : ℝ}
    (ha : 0 < a)
    (hcmin : (1 : ℝ) / 3 ≤ 1 - b * w / a)
    (hcmax : 1 - b * w / a ≤ 2259)
    (hv0 : 0 ≤ NavierStokes.SeedConePaper.shearMagnitude a b)
    (hvmax : NavierStokes.SeedConePaper.shearMagnitude a b ≤ 116)
    (hgmin : (1 : ℝ) / 4 ≤
      2 * (1 - b * w / a) ^ 2 -
        (NavierStokes.SeedConePaper.shearMagnitude a b - 2) * (w + b / a) ^ 2)
    (hp : (2 : ℝ) ^ 24 ≤ p) :
    NavierStokes.SeedConePaper.RelaxedCone a b p (w * p) := by
  obtain ⟨hP, hroot⟩ := normalized_outer_threshold hcmin hcmax hv0 hvmax hgmin hp
  have hparallel : NavierStokes.SeedConePaper.parallelStress a b p (w * p) =
      p * (1 - b * w / a) := by
    unfold NavierStokes.SeedConePaper.parallelStress
    ring
  have htransverse : NavierStokes.SeedConePaper.transverseStress a b p (w * p) =
      p * (w + b / a) := by
    unfold NavierStokes.SeedConePaper.transverseStress
    ring
  unfold NavierStokes.SeedConePaper.RelaxedCone
  rw [hparallel, htransverse]
  exact ⟨ha, hP, hroot⟩

theorem paper_admissible_outer_threshold {a b w p : ℝ}
    (ha : 0 < a)
    (hcmin : (1 : ℝ) / 3 ≤ 1 - b * w / a)
    (hcmax : 1 - b * w / a ≤ 2259)
    (hv0 : 0 ≤ NavierStokes.SeedConePaper.shearMagnitude a b)
    (hvmax : NavierStokes.SeedConePaper.shearMagnitude a b ≤ 116)
    (hgmin : (1 : ℝ) / 4 ≤
      2 * (1 - b * w / a) ^ 2 -
        (NavierStokes.SeedConePaper.shearMagnitude a b - 2) * (w + b / a) ^ 2)
    (hp : (2 : ℝ) ^ 24 ≤ p)
    (hstrict : 2 < NavierStokes.SeedConePaper.shearMagnitude a b) :
    NavierStokes.SeedConePaper.AdmissibleCone a b p (w * p) :=
  ⟨paper_relaxed_outer_threshold ha hcmin hcmax hv0 hvmax hgmin hp, hstrict⟩

end MathScope.OuterReselection

#check MathScope.OuterReselection.normalized_threshold_nine
#print axioms MathScope.OuterReselection.normalized_threshold_nine
#check MathScope.OuterReselection.paper_relaxed_threshold_nine
#print axioms MathScope.OuterReselection.paper_relaxed_threshold_nine
#check MathScope.OuterReselection.paper_admissible_threshold_nine
#print axioms MathScope.OuterReselection.paper_admissible_threshold_nine
#check MathScope.OuterReselection.zero_axial_shear_is_not_admissible
#print axioms MathScope.OuterReselection.zero_axial_shear_is_not_admissible
#check MathScope.OuterReselection.normalized_outer_threshold
#print axioms MathScope.OuterReselection.normalized_outer_threshold
#check MathScope.OuterReselection.paper_relaxed_outer_threshold
#print axioms MathScope.OuterReselection.paper_relaxed_outer_threshold
#check MathScope.OuterReselection.paper_admissible_outer_threshold
#print axioms MathScope.OuterReselection.paper_admissible_outer_threshold
