import NavierStokes.AxisContraction
import Mathlib.Tactic

/-!
Literal norm propagation for the original natural remainder.

The bounds on the actual coefficient elements and operators are explicit
inputs of this reusable lemma. They must still be supplied by the concrete
same-datum producer. The remainder bound and its Lipschitz polynomial are
derived from the original definitions, not included as assumed fields.
-/

noncomputable section

namespace MathScope.ThresholdBridge

open NavierStokes.AxisContraction

variable {V : Type*} [NormedAddCommGroup V] [NormedSpace ℝ V]

structure InputNormBounds (O : NaturalOperators V) (d : AxisData V)
    (S : V →L[ℝ] V) (R Q : ℝ) : Prop where
  radius : R ≤ Q
  resolvent : ‖S‖ ≤ Q
  product : ‖O.product‖ ≤ Q
  average : ‖O.average‖ ≤ Q
  primitive : ‖O.primitive‖ ≤ Q
  parameterPrimitive : ‖O.parameterPrimitive‖ ≤ Q
  mulY : ‖O.mulY‖ ≤ Q
  j1 : ‖O.j1‖ ≤ Q
  j2 : ‖O.j2‖ ≤ Q
  param1 : ‖O.param1‖ ≤ Q
  param2 : ‖O.param2‖ ≤ Q
  dot1 : ‖O.dot1‖ ≤ Q
  dot2 : ‖O.dot2‖ ≤ Q
  mixed1 : ‖O.mixed1‖ ≤ Q
  mixed2 : ‖O.mixed2‖ ≤ Q
  one : ‖d.one‖ ≤ Q
  eta : ‖d.eta‖ ≤ Q
  dataD : ‖d.d‖ ≤ Q
  inverseL : ‖d.inverseL‖ ≤ Q
  uStar : ‖d.uStar‖ ≤ Q
  uStarEta : ‖d.uStarEta‖ ≤ Q
  wStar : ‖d.wStar‖ ≤ Q
  hStar : ‖d.hStar‖ ≤ Q
  normalizedGradient : ‖d.normalizedGradient‖ ≤ Q
  zStar : ‖d.zStar‖ ≤ Q
  absA : |d.A| ≤ 1
  absD : |d.D| ≤ 1
  absH : |d.h| ≤ 1

def boundPolynomial (Q : ℝ) : ℝ :=
  2*Q^5 + 3*Q^6 + 3*Q^7 + 11*Q^8 + 8*Q^9 + 2*Q^10 + 29*Q^11

def lipPolynomial (Q : ℝ) : ℝ :=
  2*Q^4 + 3*Q^5 + 4*Q^6 + 17*Q^7 + 14*Q^8 + 4*Q^9 + 58*Q^10

theorem coefficient_norm_bounds (O : NaturalOperators V) (d : AxisData V)
    (S : V →L[ℝ] V) (R Q : ℝ) (hQ : 0 ≤ Q)
    (b : InputNormBounds O d S R Q) :
    ‖angularLinearCoefficient O d‖ ≤ Q + Q + 2*(Q*Q*Q) ∧
    ‖angularQuadraticCoefficient O d‖ ≤ Q*Q*Q ∧
    ‖averageCoefficient d‖ ≤ 2*Q ∧
    ‖angularSlowCoefficient d‖ ≤ 2*Q ∧
    ‖axialLinearCoefficient O d‖ ≤ Q + 4*(Q*Q*Q) + Q*Q*Q ∧
    ‖axialQuadraticCoefficient d‖ ≤ 2*Q ∧
    ‖(4*d.A) • d.eta‖ ≤ 4*Q ∧
    ‖(2 : ℝ) • d.eta‖ ≤ 2*Q := by
  have hu : ‖O.product d.eta d.uStar‖ ≤ Q*Q*Q := by
    calc
      _ ≤ ‖O.product‖ * ‖d.eta‖ * ‖d.uStar‖ := O.product.le_opNorm₂ _ _
      _ ≤ _ := by gcongr; exact b.product; exact b.eta; exact b.uStar
  have hgrad : ‖O.product d.d d.normalizedGradient‖ ≤ Q*Q*Q := by
    calc
      _ ≤ ‖O.product‖ * ‖d.d‖ * ‖d.normalizedGradient‖ := O.product.le_opNorm₂ _ _
      _ ≤ _ := by gcongr; exact b.product; exact b.dataD; exact b.normalizedGradient
  have hdU : ‖O.product d.d d.uStarEta‖ ≤ Q*Q*Q := by
    calc
      _ ≤ ‖O.product‖ * ‖d.d‖ * ‖d.uStarEta‖ := O.product.le_opNorm₂ _ _
      _ ≤ _ := by gcongr; exact b.product; exact b.dataD; exact b.uStarEta
  have hscalar (s : ℝ) (hs : |s| ≤ 1) (k : ℝ) (hk : 0 ≤ k)
      (x : V) (B : ℝ) (hx : ‖x‖ ≤ B) : ‖(k*s) • x‖ ≤ k*B := by
    rw [norm_smul, Real.norm_eq_abs, abs_mul, abs_of_nonneg hk]
    calc
      k * |s| * ‖x‖ ≤ k * 1 * B := by gcongr
      _ = _ := by ring
  have hhOne : ‖d.h • d.one‖ ≤ Q := by
    simpa using hscalar d.h b.absH 1 (by norm_num) d.one Q b.one
  have haOne : ‖d.A • d.one‖ ≤ Q := by
    simpa using hscalar d.A b.absA 1 (by norm_num) d.one Q b.one
  refine ⟨?_, hgrad, ?_, ?_, ?_, ?_, ?_, ?_⟩
  · unfold angularLinearCoefficient
    calc
      _ ≤ ‖d.wStar + d.h • d.one‖ + ‖(2*d.h) • O.product d.eta d.uStar‖ := norm_sub_le _ _
      _ ≤ ‖d.wStar‖ + ‖d.h • d.one‖ + ‖(2*d.h) • O.product d.eta d.uStar‖ := by gcongr; exact norm_add_le _ _
      _ ≤ _ := add_le_add (add_le_add b.wStar hhOne) (hscalar d.h b.absH 2 (by norm_num) _ _ hu)
  · exact hscalar d.D b.absD 2 (by norm_num) d.eta Q b.eta
  · exact hscalar d.h b.absH 2 (by norm_num) d.eta Q b.eta
  · unfold axialLinearCoefficient
    calc
      _ ≤ ‖d.A • d.one - (4*d.A) • O.product d.eta d.uStar‖ + ‖O.product d.d d.uStarEta‖ := norm_add_le _ _
      _ ≤ ‖d.A • d.one‖ + ‖(4*d.A) • O.product d.eta d.uStar‖ + ‖O.product d.d d.uStarEta‖ := by gcongr; exact norm_sub_le _ _
      _ ≤ _ := add_le_add (add_le_add haOne (hscalar d.A b.absA 4 (by norm_num) _ _ hu)) hdU
  · exact hscalar d.A b.absA 2 (by norm_num) d.eta Q b.eta
  · exact hscalar d.A b.absA 4 (by norm_num) d.eta Q b.eta
  · simpa using hscalar 1 (by norm_num) 2 (by norm_num) d.eta Q b.eta


def literalBoundTree (Q : ℝ) : ℝ :=
  ((Q * ((Q * Q) * (((((Q * ((Q * ((Q + Q) + (((2 * Q) * Q) * Q))) * Q)) + ((Q * Q) * Q)) + ((Q * Q) * Q)) + (Q * ((Q * ((Q * ((Q * Q) * Q)) * Q)) * Q))) + (((((Q * ((Q * (((Q * (2 * Q)) * (Q * Q)) + ((Q * (2 * Q)) * Q))) * Q)) + ((Q * (Q * Q)) * ((Q * Q) * Q))) + ((Q * ((Q * (2 * Q)) * (Q * Q))) * Q)) + ((Q * Q) * ((Q * (Q * Q)) * Q))) + ((Q * Q) * ((Q * Q) * Q)))))) + ((Q * Q) * (((((Q * ((Q * ((Q + (((4 * Q) * Q) * Q)) + ((Q * Q) * Q))) * Q)) + ((Q * Q) * Q)) + ((Q * Q) * Q)) + ((((Q * ((Q * (2 * Q)) * ((Q * Q) * Q))) + ((Q * ((Q * (2 * Q)) * (Q * Q))) * Q)) + ((Q * Q) * ((Q * (Q * Q)) * Q))) + ((Q * Q) * ((Q * Q) * Q)))) + (Q * ((((Q * (4 * Q)) * (Q * ((Q * ((Q * 2) * 2)) * ((Q * Q) * Q)))) + ((Q * Q) * (Q * ((Q * ((Q * 2) * 2)) * ((Q * Q) * Q))))) + ((Q * (2 * Q)) * (Q * ((Q * ((Q * 2) * 2)) * ((Q * Q) * Q)))))))))

theorem literalBoundTree_eq (Q : ℝ) : literalBoundTree Q = boundPolynomial Q := by
  unfold literalBoundTree boundPolynomial
  ring

theorem originalBound_le_polynomial (O : NaturalOperators V) (d : AxisData V)
    (S : V →L[ℝ] V) (R Q : ℝ) (hR : 0 ≤ R) (hQ : 0 ≤ Q)
    (b : InputNormBounds O d S R Q) :
    remainderBound O d S R 2 hR (by norm_num) ≤ boundPolynomial Q := by
  obtain ⟨h1,h2,h3,h4,h5,h6,h7,h8⟩ := coefficient_norm_bounds O d S R Q hQ b
  rcases b with ⟨hr,hs,hp,hav,hpr,hpp,hmy,hj1,hj2,hpa1,hpa2,hd1,hd2,hm1,hm2,
    ho,he,hdd,hi,hu,hue,hw,hh,hg,hz,hA,hD,hH⟩
  simp only [remainderBound, controlledRemainder, Controlled.const, Controlled.constBound,
    Controlled.fst, Controlled.snd, Controlled.linear, Controlled.bilinear,
    Controlled.add, Controlled.sub, Controlled.neg, Controlled.unitSmul, Controlled.pair]
  calc
    _ ≤ literalBoundTree Q := by
      unfold literalBoundTree
      gcongr <;> first | assumption | positivity | norm_num
    _ = _ := literalBoundTree_eq Q

def literalLipTree (Q : ℝ) : ℝ :=
  ((Q * (Q * ((0 * (((((Q * ((Q * ((Q + Q) + (((2 * Q) * Q) * Q))) * Q)) + ((Q * Q) * Q)) + ((Q * Q) * Q)) + (Q * ((Q * ((Q * ((Q * Q) * Q)) * Q)) * Q))) + (((((Q * ((Q * (((Q * (2 * Q)) * (Q * Q)) + ((Q * (2 * Q)) * Q))) * Q)) + ((Q * (Q * Q)) * ((Q * Q) * Q))) + ((Q * ((Q * (2 * Q)) * (Q * Q))) * Q)) + ((Q * Q) * ((Q * (Q * Q)) * Q))) + ((Q * Q) * ((Q * Q) * Q))))) + (Q * (((((Q * (Q * ((0 * Q) + (((Q + Q) + (((2 * Q) * Q) * Q)) * 1)))) + (Q * ((0 * Q) + (Q * 1)))) + (Q * ((1 * Q) + (Q * 0)))) + (Q * (Q * (((Q * ((0 * Q) + (((Q * Q) * Q) * 1))) * Q) + (((Q * ((Q * Q) * Q)) * Q) * 1))))) + (((((Q * (Q * ((((Q * ((0 * (Q * Q)) + ((2 * Q) * (Q * 1)))) + (Q * ((0 * Q) + ((2 * Q) * 1)))) * Q) + ((((Q * (2 * Q)) * (Q * Q)) + ((Q * (2 * Q)) * Q)) * 1)))) + (Q * (((Q * 1) * ((Q * Q) * Q)) + ((Q * Q) * (Q * ((0 * Q) + (Q * 1))))))) + (Q * (((Q * ((0 * (Q * Q)) + ((2 * Q) * (Q * 1)))) * Q) + (((Q * (2 * Q)) * (Q * Q)) * 1)))) + (Q * ((0 * ((Q * (Q * Q)) * Q)) + (Q * (Q * (((Q * 1) * Q) + ((Q * Q) * 1))))))) + (Q * ((1 * ((Q * Q) * Q)) + (Q * (Q * ((0 * Q) + (Q * 1)))))))))))) + (Q * ((0 * (((((Q * ((Q * ((Q + (((4 * Q) * Q) * Q)) + ((Q * Q) * Q))) * Q)) + ((Q * Q) * Q)) + ((Q * Q) * Q)) + ((((Q * ((Q * (2 * Q)) * ((Q * Q) * Q))) + ((Q * ((Q * (2 * Q)) * (Q * Q))) * Q)) + ((Q * Q) * ((Q * (Q * Q)) * Q))) + ((Q * Q) * ((Q * Q) * Q)))) + (Q * ((((Q * (4 * Q)) * (Q * ((Q * ((Q * 2) * 2)) * ((Q * Q) * Q)))) + ((Q * Q) * (Q * ((Q * ((Q * 2) * 2)) * ((Q * Q) * Q))))) + ((Q * (2 * Q)) * (Q * ((Q * ((Q * 2) * 2)) * ((Q * Q) * Q)))))))) + (Q * (((((Q * (Q * ((0 * Q) + (((Q + (((4 * Q) * Q) * Q)) + ((Q * Q) * Q)) * 1)))) + (Q * ((0 * Q) + (Q * 1)))) + (Q * ((1 * Q) + (Q * 0)))) + ((((Q * (Q * ((0 * ((Q * Q) * Q)) + ((2 * Q) * (Q * ((1 * Q) + (Q * 1))))))) + (Q * (((Q * ((0 * (Q * Q)) + ((2 * Q) * (Q * 1)))) * Q) + (((Q * (2 * Q)) * (Q * Q)) * 1)))) + (Q * ((0 * ((Q * (Q * Q)) * Q)) + (Q * (Q * (((Q * 1) * Q) + ((Q * Q) * 1))))))) + (Q * ((1 * ((Q * Q) * Q)) + (Q * (Q * ((0 * Q) + (Q * 1)))))))) + (Q * (((Q * ((0 * (Q * ((Q * ((Q * 2) * 2)) * ((Q * Q) * Q)))) + ((4 * Q) * (Q * (Q * (((Q * ((0 * 2) + (2 * 0))) * ((Q * Q) * Q)) + (((Q * 2) * 2) * (Q * ((1 * Q) + (Q * 1)))))))))) + (Q * ((0 * (Q * ((Q * ((Q * 2) * 2)) * ((Q * Q) * Q)))) + (Q * (Q * (Q * (((Q * ((0 * 2) + (2 * 0))) * ((Q * Q) * Q)) + (((Q * 2) * 2) * (Q * ((1 * Q) + (Q * 1))))))))))) + (Q * ((0 * (Q * ((Q * ((Q * 2) * 2)) * ((Q * Q) * Q)))) + ((2 * Q) * (Q * (Q * (((Q * ((0 * 2) + (2 * 0))) * ((Q * Q) * Q)) + (((Q * 2) * 2) * (Q * ((1 * Q) + (Q * 1)))))))))))))))))

theorem literalLipTree_eq (Q : ℝ) : literalLipTree Q = lipPolynomial Q := by
  unfold literalLipTree lipPolynomial
  ring

theorem originalLip_le_polynomial (O : NaturalOperators V) (d : AxisData V)
    (S : V →L[ℝ] V) (R Q : ℝ) (hR : 0 ≤ R) (hQ : 0 ≤ Q)
    (b : InputNormBounds O d S R Q) :
    remainderLip O d S R 2 hR (by norm_num) ≤ lipPolynomial Q := by
  obtain ⟨h1,h2,h3,h4,h5,h6,h7,h8⟩ := coefficient_norm_bounds O d S R Q hQ b
  rcases b with ⟨hr,hs,hp,hav,hpr,hpp,hmy,hj1,hj2,hpa1,hpa2,hd1,hd2,hm1,hm2,
    ho,he,hdd,hi,hu,hue,hw,hh,hg,hz,hA,hD,hH⟩
  simp only [remainderLip, controlledRemainder, Controlled.const, Controlled.constBound,
    Controlled.fst, Controlled.snd, Controlled.linear, Controlled.bilinear,
    Controlled.add, Controlled.sub, Controlled.neg, Controlled.unitSmul, Controlled.pair]
  calc
    _ ≤ literalLipTree Q := by
      unfold literalLipTree
      gcongr <;> first | assumption | positivity | norm_num
    _ = _ := literalLipTree_eq Q

#print axioms MathScope.ThresholdBridge.originalBound_le_polynomial
#print axioms MathScope.ThresholdBridge.originalLip_le_polynomial

end MathScope.ThresholdBridge
