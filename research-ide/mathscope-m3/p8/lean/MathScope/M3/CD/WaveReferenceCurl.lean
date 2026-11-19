import Mathlib.Analysis.SpecialFunctions.Exp
import Mathlib.Tactic.Ring

namespace MathScope.M3.CD

/-- On the frozen own/reference labels the axial factor transports with the
same square-root ratio as the radial derivative. The native AST uses
exponentials of the exact logarithms. -/
theorem wave_reference_axial_scale (logRho logQOwn h : ℝ) :
    Real.exp (h * (logQOwn + logRho)) * Real.exp ((1 / 2 - h) * logRho) =
      Real.exp ((1 / 2 : ℝ) * logRho) * Real.exp (h * logQOwn) := by
  simp only [← Real.exp_add]
  congr 1
  ring

/-- Each reference derivative contributes the extra square-root ratio
needed to convert the potential scale to the original velocity scale. -/
theorem wave_reference_potential_scale (logRho h : ℝ) :
    Real.exp (h * logRho) * Real.exp ((1 / 2 : ℝ) * logRho) =
      Real.exp ((1 / 2 + h) * logRho) := by
  rw [← Real.exp_add]
  congr 1
  ring

/-- The original three cylindrical curl components commute with the fixed
own/reference coordinate scaling. The radial auxiliary multiplier and the
positive radius inverse must refer to the same physical point. Each value
and derivative is evaluated on the same admitted smooth source branch. -/
theorem wave_reference_cylindrical_curl
    (potentialScale radialScale axialScale velocityScale : ℝ)
    (radialFastRef radialFastOwn epsilonRef epsilonOwn inverseRRef inverseROwn : ℝ)
    (aTheta partialAzTheta partialArTheta partialAThetaZ partialArZ : ℝ)
    (partialAzR partialAThetaR auxiliaryAz auxiliaryATheta : ℝ)
    (hVelocity : potentialScale * radialScale = velocityScale)
    (hFast : radialFastRef = radialScale * radialFastOwn)
    (hAxial : epsilonRef * axialScale = radialScale * epsilonOwn)
    (hAngular : inverseRRef = radialScale * inverseROwn) :
    potentialScale *
        (inverseRRef * partialAzTheta - (epsilonRef * axialScale) * partialAThetaZ) =
      velocityScale * (inverseROwn * partialAzTheta - epsilonOwn * partialAThetaZ) ∧
    potentialScale *
        ((epsilonRef * axialScale) * partialArZ -
          (radialScale * partialAzR + radialFastRef * auxiliaryAz)) =
      velocityScale * (epsilonOwn * partialArZ - (partialAzR + radialFastOwn * auxiliaryAz)) ∧
    potentialScale *
        (radialScale * partialAThetaR + radialFastRef * auxiliaryATheta +
          inverseRRef * aTheta - inverseRRef * partialArTheta) =
      velocityScale *
        (partialAThetaR + radialFastOwn * auxiliaryATheta +
          inverseROwn * aTheta - inverseROwn * partialArTheta) := by
  rw [hFast, hAxial, hAngular, ← hVelocity]
  exact ⟨by ring, by ring, by ring⟩

/-- Real divergence of a phase-modulated cylindrical curl, with the overall
factor one half suppressed. Only the three mixed phase defects survive. -/
theorem phase_curl_real_divergence_defect {F : Type*} [CommRing F]
    (k invR nR nTheta nZ nThetaR nThetaZ nZR nRZ : F)
    (cR cTheta cZ cThetaR cZR cRZ cThetaZ : F) :
    k * (nZR * cTheta + nZ * cThetaR - nThetaR * cZ - nTheta * cZR) +
      invR * (k * (nZ * cTheta - nTheta * cZ)) +
      k * (nThetaZ * cR + nTheta * cRZ - nRZ * cTheta - nR * cThetaZ) -
      k * (-nR * cThetaZ + nTheta * (cRZ - cZR) + nZ * (cThetaR + invR * cTheta)) =
    k * (-(nThetaR + invR * nTheta) * cZ + (nZR - nRZ) * cTheta + nThetaZ * cR) := by
  ring

/-- The imaginary divergence uses commutation of the two slow physical
derivatives and the exact alternating real leading curl. -/
theorem phase_curl_imaginary_divergence_zero {F : Type*} [CommRing F]
    (k invR nR nTheta nZ cR cTheta cZ cThetaZ cThetaRZ cThetaZR : F)
    (hcomm : cThetaRZ = cThetaZR) :
    -cThetaRZ - invR * cThetaZ + cThetaZR + invR * cThetaZ +
      k * (nR * (k * (nZ * cTheta - nTheta * cZ)) +
        nTheta * (k * (nR * cZ - nZ * cR)) +
        nZ * (k * (nTheta * cR - nR * cTheta))) = 0 := by
  rw [hcomm]
  ring

#print axioms wave_reference_axial_scale
#print axioms wave_reference_potential_scale
#print axioms wave_reference_cylindrical_curl

#print axioms phase_curl_real_divergence_defect
#print axioms phase_curl_imaginary_divergence_zero

end MathScope.M3.CD
