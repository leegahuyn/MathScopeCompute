import Mathlib
/-!
Original paper equations (3.2), (5.12)-(5.16), (6.8): source-facing **conditional**
interface. Exact native AST input membership is not asserted here.
-/
namespace MathScope.M3.CD
noncomputable section

def slowInputEquation (s Z T h : ℝ) : ℝ := s - Z^2 * s^(2*h) - T

/-- Original active band, conditional on the physical q and dyadic Q bounds. -/
theorem original_active_band_ratio (q Q : ℝ) (hQ : 0 < Q)
    (hlow : Q/2 ≤ q) (hhigh : q ≤ 2*Q) :
    (1/2:ℝ) ≤ q/Q ∧ q/Q ≤ 2 := by
  constructor
  · apply (le_div_iff₀ hQ).2
    nlinarith
  · apply (div_le_iff₀ hQ).2
    nlinarith

/-- Paper's (3.2) physical input normalized at Q. One source-image equation,
    not a theorem that every *free* source AST (Z,T) satisfies this premise. -/
theorem physical_chart_source_image (q Q z τ η h : ℝ)
    (hq : 0 < q) (hQ : 0 < Q)
    (hZ : z / Q^((1/2:ℝ)-h) = (q/Q)^((1/2:ℝ)-h)*η)
    (hτ : τ = q*(1-η^2)) :
    slowInputEquation (q/Q) (z / Q^((1/2:ℝ)-h)) (τ/Q) h = 0 := by
  have hs : 0 < q/Q := div_pos hq hQ
  have hτQ : τ/Q = (q/Q)*(1-η^2) := by
    rw [hτ]
    field_simp
  have hp : ((q/Q)^((1/2:ℝ)-h))^2 * (q/Q)^(2*h) = q/Q := by
    have hx : ((q/Q)^((1/2:ℝ)-h))^2 =
        (q/Q)^(((1/2:ℝ)-h)+((1/2:ℝ)-h)) := by
      calc
        _ = (q/Q)^((1/2:ℝ)-h) * (q/Q)^((1/2:ℝ)-h) := by ring
        _ = _ := (Real.rpow_add hs _ _).symm
    rw [hx, ← Real.rpow_add hs]
    have hsump : ((1/2:ℝ)-h)+((1/2:ℝ)-h)+(2*h)=1 := by ring
    rw [hsump]
    simp
  rw [hZ, hτQ]
  unfold slowInputEquation
  have hm : (((q/Q)^((1/2:ℝ)-h))*η)^2 * (q/Q)^(2*h) = (q/Q)*η^2 := by
    calc
      _ = (((q/Q)^((1/2:ℝ)-h))^2*(q/Q)^(2*h))*η^2 := by ring
      _ = (q/Q)*η^2 := by rw [hp]
  rw [hm]
  ring

/-- The original three-coordinate mesh admits a nearest integral center,
    but the actual frozen indices are separate source parameters. -/
theorem original_mesh_three_nearest (E R Z T : ℝ) :
    ∃ a b c : ℤ,
      |E*R-(a:ℝ)| < (3:ℝ)/4 ∧
      |E*Z-(b:ℝ)| < (3:ℝ)/4 ∧
      |E*T-(c:ℝ)| < (3:ℝ)/4 := by
  have nearest (x : ℝ) : ∃ j : ℤ, |x-(j:ℝ)| < (3:ℝ)/4 := by
    let j : ℤ := ⌊x+(1/2:ℝ)⌋
    refine ⟨j, ?_⟩
    have hl : (j:ℝ) ≤ x+(1/2:ℝ) := Int.floor_le _
    have hu : x+(1/2:ℝ) < (j:ℝ)+1 := Int.lt_floor_add_one _
    apply abs_lt.mpr
    constructor <;> dsimp [j] at * <;> linarith
  obtain ⟨a,ha⟩ := nearest (E*R)
  obtain ⟨b,hb⟩ := nearest (E*Z)
  obtain ⟨c,hc⟩ := nearest (E*T)
  exact ⟨a,b,c,ha,hb,hc⟩

/-- Source cutoff coordinates Xa*exp(t1/128), Xa*exp(t1/64),
    Xa*exp(t1/32) are ordered if Xa and t1 are positive. -/
theorem original_n1_cutoff_radii_order (Xa t1 : ℝ)
    (hXa : 0 < Xa) (ht1 : 0 < t1) :
    Xa*Real.exp (t1/128) < Xa*Real.exp (t1/64) ∧
    Xa*Real.exp (t1/64) < Xa*Real.exp (t1/32) := by
  constructor
  · apply mul_lt_mul_of_pos_left (Real.exp_lt_exp.mpr ?_) hXa
    linarith
  · apply mul_lt_mul_of_pos_left (Real.exp_lt_exp.mpr ?_) hXa
    linarith

end
end MathScope.M3.CD
