import Mathlib
/-! Actual frozen mesh index equality is OPEN. -/
namespace MathScope.M3.CD
theorem one_frozen_cell_diameter (E v w : ℝ) (j : ℤ)
    (hE : 0 < E)
    (hv : |E*v - (j:ℝ)| < (3:ℝ)/4)
    (hw : |E*w - (j:ℝ)| < (3:ℝ)/4) :
    |v-w| < ((3:ℝ)/2)/E := by
  rcases abs_lt.mp hv with ⟨hv₁,hv₂⟩
  rcases abs_lt.mp hw with ⟨hw₁,hw₂⟩
  have hprod : |E*(v-w)| < (3:ℝ)/2 := by
    apply abs_lt.mpr
    constructor <;> nlinarith
  rw [abs_mul, abs_of_pos hE] at hprod
  apply (lt_div_iff₀ hE).2
  nlinarith [hprod]

/-- Exact existential nearest index; no use of approximated giant ell.
    The actual frozen source index must STILL be proved equal to a safe index. -/
theorem strict_nearest_mesh_index (E v : ℝ) :
    ∃ j : ℤ, |E*v - (j:ℝ)| < (3:ℝ)/4 := by
  let j : ℤ := ⌊E*v + (1/2:ℝ)⌋
  refine ⟨j, ?_⟩
  have hlo : (j:ℝ) ≤ E*v + (1/2:ℝ) := Int.floor_le _
  have hhi : E*v + (1/2:ℝ) < (j:ℝ)+1 := Int.lt_floor_add_one _
  apply abs_lt.mpr
  constructor <;> dsimp [j] at * <;> linarith

theorem original_integer_mesh_scale_positive (ell : ℕ) (h : 0 < ell) :
    (0:ℝ) < (ell:ℝ)^6 := by
  positivity
end MathScope.M3.CD
