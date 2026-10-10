import NavierStokes.AxisContraction
import Mathlib.Tactic

/-!
Literal norm propagation for the original natural remainder.

The bounds on the actual coefficient elements and operators are explicit
inputs of this reusable lemma. They must still be supplied by the concrete
same-datum producer. The remainder bound and its Lipschitz polynomial are
derived from the original definitions, not included as assumed fields.
-/

set_option maxHeartbeats 2000000

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
  have h1' : ‖angularLinearCoefficient O d‖ ≤ Q + Q + 2*Q*Q*Q := by
    simpa only [mul_assoc] using h1
  have h5' : ‖axialLinearCoefficient O d‖ ≤ Q + 4*Q*Q*Q + Q*Q*Q := by
    simpa only [mul_assoc] using h5
  rcases b with ⟨hr,hs,hp,hav,hpr,hpp,hmy,hj1,hj2,hpa1,hpa2,hd1,hd2,hm1,hm2,
    ho,he,hdd,hi,hu,hue,hw,hh,hg,hz,hA,hD,hH⟩
  simp only [remainderBound, controlledRemainder, Controlled.const, Controlled.constBound,
    Controlled.fst, Controlled.snd, Controlled.linear, Controlled.bilinear,
    Controlled.add, Controlled.sub, Controlled.neg, Controlled.unitSmul, Controlled.pair]
  calc
    _ ≤ literalBoundTree Q := by
      unfold literalBoundTree
      try simp only [zero_mul, mul_zero, zero_add, add_zero, one_mul, mul_one]
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
  have h1' : ‖angularLinearCoefficient O d‖ ≤ Q + Q + 2*Q*Q*Q := by
    simpa only [mul_assoc] using h1
  have h5' : ‖axialLinearCoefficient O d‖ ≤ Q + 4*Q*Q*Q + Q*Q*Q := by
    simpa only [mul_assoc] using h5
  rcases b with ⟨hr,hs,hp,hav,hpr,hpp,hmy,hj1,hj2,hpa1,hpa2,hd1,hd2,hm1,hm2,
    ho,he,hdd,hi,hu,hue,hw,hh,hg,hz,hA,hD,hH⟩
  simp only [remainderLip, controlledRemainder, Controlled.const, Controlled.constBound,
    Controlled.fst, Controlled.snd, Controlled.linear, Controlled.bilinear,
    Controlled.add, Controlled.sub, Controlled.neg, Controlled.unitSmul, Controlled.pair]
  calc
    _ ≤ literalLipTree Q := by
      unfold literalLipTree
      try simp only [zero_mul, mul_zero, zero_add, add_zero, one_mul, mul_one]
      gcongr <;> first | assumption | positivity | norm_num
    _ = _ := literalLipTree_eq Q


theorem boundPolynomial_le (Q : ℝ) (hQ : 1 ≤ Q) : boundPolynomial Q ≤ 58*Q^11 := by
  have h5 : Q^5 ≤ Q^11 := pow_le_pow_right₀ hQ (by norm_num)
  have h6 : Q^6 ≤ Q^11 := pow_le_pow_right₀ hQ (by norm_num)
  have h7 : Q^7 ≤ Q^11 := pow_le_pow_right₀ hQ (by norm_num)
  have h8 : Q^8 ≤ Q^11 := pow_le_pow_right₀ hQ (by norm_num)
  have h9 : Q^9 ≤ Q^11 := pow_le_pow_right₀ hQ (by norm_num)
  have h10 : Q^10 ≤ Q^11 := pow_le_pow_right₀ hQ (by norm_num)
  unfold boundPolynomial
  linarith only [h5,h6,h7,h8,h9,h10]

theorem lipPolynomial_le (Q : ℝ) (hQ : 1 ≤ Q) : lipPolynomial Q ≤ 102*Q^10 := by
  have h4 : Q^4 ≤ Q^10 := pow_le_pow_right₀ hQ (by norm_num)
  have h5 : Q^5 ≤ Q^10 := pow_le_pow_right₀ hQ (by norm_num)
  have h6 : Q^6 ≤ Q^10 := pow_le_pow_right₀ hQ (by norm_num)
  have h7 : Q^7 ≤ Q^10 := pow_le_pow_right₀ hQ (by norm_num)
  have h8 : Q^8 ≤ Q^10 := pow_le_pow_right₀ hQ (by norm_num)
  have h9 : Q^9 ≤ Q^10 := pow_le_pow_right₀ hQ (by norm_num)
  unfold lipPolynomial
  linarith only [h4,h5,h6,h7,h8,h9]

theorem polynomial_threshold (Q : ℝ) (hQ : (2 : ℝ)^260 ≤ Q) :
    1 + boundPolynomial Q + lipPolynomial Q ≤ Q^64 := by
  have h1 : 1 ≤ Q := le_trans (one_le_pow₀ (by norm_num : (1 : ℝ) ≤ 2)) hQ
  have h0 : 0 ≤ Q := le_trans zero_le_one h1
  have h161 : (161 : ℝ) ≤ Q := (le_trans
    (by norm_num : (161 : ℝ) ≤ 2^(8 : ℕ))
    (pow_le_pow_right₀ (by norm_num : (1 : ℝ) ≤ 2) (by norm_num : (8 : ℕ) ≤ 260))).trans hQ
  have hpow : Q^10 ≤ Q^11 := pow_le_pow_right₀ h1 (by norm_num)
  have hone : (1 : ℝ) ≤ Q^11 := one_le_pow₀ h1
  have htotal : 1 + boundPolynomial Q + lipPolynomial Q ≤ 161*Q^11 := by
    have hl := lipPolynomial_le Q h1
    have hb := boundPolynomial_le Q h1
    have hl' : lipPolynomial Q ≤ 102*Q^11 :=
      hl.trans (mul_le_mul_of_nonneg_left hpow (by norm_num))
    linarith only [hone,hb,hl']
  calc
    _ ≤ 161*Q^11 := htotal
    _ ≤ Q*Q^11 := mul_le_mul_of_nonneg_right h161 (pow_nonneg h0 _)
    _ = Q^12 := by ring
    _ ≤ Q^64 := pow_le_pow_right₀ h1 (by norm_num)

theorem polynomial_sharp_error (Q : ℝ) (hQ : 1 ≤ Q) :
    boundPolynomial Q / (2*Q^64) ≤ 29 / Q^53 := by
  have h0 : 0 < Q := lt_of_lt_of_le zero_lt_one hQ
  calc
    _ ≤ (58*Q^11) / (2*Q^64) :=
      div_le_div_of_nonneg_right (boundPolynomial_le Q hQ) (by positivity)
    _ = 29 / Q^53 := by
      field_simp
      <;> ring

theorem original_threshold_le (O : NaturalOperators V) (d : AxisData V)
    (S : V →L[ℝ] V) (x0 : V × V) (Q : ℝ) (hQ : (2 : ℝ)^260 ≤ Q)
    (b : InputNormBounds O d S (‖x0‖+1) Q) :
    contractionThreshold O d S x0 2 (by norm_num) ≤ Q^64 := by
  have h0 : 0 ≤ Q := le_trans (by positivity) hQ
  unfold contractionThreshold
  calc
    _ ≤ 1 + boundPolynomial Q + lipPolynomial Q := by
      gcongr
      · exact originalBound_le_polynomial O d S (‖x0‖+1) Q (by positivity) h0 b
      · exact originalLip_le_polynomial O d S (‖x0‖+1) Q (by positivity) h0 b
    _ ≤ _ := polynomial_threshold Q hQ

theorem original_sharp_error (O : NaturalOperators V) (d : AxisData V)
    (S : V →L[ℝ] V) (R Q : ℝ) (hR : 0 ≤ R) (hQ : 1 ≤ Q)
    (b : InputNormBounds O d S R Q) :
    remainderBound O d S R 2 hR (by norm_num) / (2*Q^64) ≤ 29 / Q^53 := by
  have h0 : 0 ≤ Q := le_trans zero_le_one hQ
  exact (div_le_div_of_nonneg_right
    (originalBound_le_polynomial O d S R Q hR h0 b) (by positivity)).trans
      (polynomial_sharp_error Q hQ)

theorem exists_unique_fixedPoint_at_Q64 [CompleteSpace V]
    (O : NaturalOperators V) (d : AxisData V) (S : V →L[ℝ] V)
    (x0 : V × V) (Q : ℝ) (hQ : (2 : ℝ)^260 ≤ Q)
    (b : InputNormBounds O d S (‖x0‖+1) Q) (a : V) (ha : ‖a‖ ≤ 2) :
    ∃ x : V × V, ‖x-x0‖ ≤ 1 ∧
      x0 + (1/(2*Q^64)) • naturalRemainder O d S (1/Q^64) a x = x ∧
      ‖x-x0‖ ≤ 29/Q^53 ∧
      ∀ y : V × V, ‖y-x0‖ ≤ 1 →
        x0 + (1/(2*Q^64)) • naturalRemainder O d S (1/Q^64) a y = y → y=x := by
  obtain ⟨x,hball,hfix,herror,hunique⟩ := exists_unique_natural_fixedPoint
    O d S x0 2 (by norm_num) (Q^64) (original_threshold_le O d S x0 Q hQ b) a ha
  refine ⟨x,hball,hfix,?_,hunique⟩
  exact herror.trans (original_sharp_error O d S (‖x0‖+1) Q (by positivity)
    (le_trans (one_le_pow₀ (by norm_num : (1 : ℝ) ≤ 2)) hQ) b)

#print axioms MathScope.ThresholdBridge.coefficient_norm_bounds
#print axioms MathScope.ThresholdBridge.originalBound_le_polynomial
#print axioms MathScope.ThresholdBridge.originalLip_le_polynomial
#print axioms MathScope.ThresholdBridge.original_threshold_le
#print axioms MathScope.ThresholdBridge.original_sharp_error
#print axioms MathScope.ThresholdBridge.exists_unique_fixedPoint_at_Q64

end MathScope.ThresholdBridge
