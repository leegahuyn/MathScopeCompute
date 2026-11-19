import Mathlib

namespace MathScope.M3.CD

section

variable {F : Type*} [CommRing F]

/-- In the radial coefficient, the radial derivative of the radial amplitude
cancels after separating the full divergence defect. -/
theorem mode_two_radial_divergence_defect
    (u v w uR uZ wZ inverseRadius carrier : F) :
    2 * u * uR + w * uZ + u * wZ + inverseRadius * (u ^ 2 - v ^ 2) + 2 * carrier * u =
      w * uZ - u * wZ - inverseRadius * (u ^ 2 + v ^ 2) +
        2 * u * (uR + inverseRadius * u + wZ + carrier) := by
  ring

/-- The cylindrical connection term cancels in the azimuthal coefficient. -/
theorem mode_two_azimuthal_divergence_defect
    (u v w uR vR vZ wZ inverseRadius carrier : F) :
    u * vR + v * uR + w * vZ + v * wZ + 2 * inverseRadius * u * v + 2 * carrier * v =
      u * vR + w * vZ - v * (uR + wZ) +
        2 * v * (uR + inverseRadius * u + wZ + carrier) := by
  ring

/-- In the axial coefficient, the axial derivative of the axial amplitude
cancels after separating the full divergence defect. -/
theorem mode_two_axial_divergence_defect
    (u w uR wR wZ inverseRadius carrier : F) :
    u * wR + w * uR + 2 * w * wZ + inverseRadius * u * w + 2 * carrier * w =
      u * wR - w * uR - inverseRadius * u * w +
        2 * w * (uR + inverseRadius * u + wZ + carrier) := by
  ring

/-- The quadratic +2 coefficient of a solenoidal +1 harmonic requires
amplitude derivatives, two connection terms and no explicit phase gradient. -/
theorem mode_two_amplitude_only_of_zero_divergence
    (u v w uR uZ vR vZ wR wZ inverseRadius carrier : F)
    (hdiv : uR + inverseRadius * u + wZ + carrier = 0) :
    (2 * u * uR + w * uZ + u * wZ + inverseRadius * (u ^ 2 - v ^ 2) + 2 * carrier * u =
      w * uZ - u * wZ - inverseRadius * (u ^ 2 + v ^ 2)) ∧
    (u * vR + v * uR + w * vZ + v * wZ + 2 * inverseRadius * u * v + 2 * carrier * v =
      u * vR + w * vZ - v * (uR + wZ)) ∧
    (u * wR + w * uR + 2 * w * wZ + inverseRadius * u * w + 2 * carrier * w =
      u * wR - w * uR - inverseRadius * u * w) := by
  refine ⟨?_, ?_, ?_⟩
  · simpa only [hdiv, mul_zero, add_zero] using
      mode_two_radial_divergence_defect u v w uR uZ wZ inverseRadius carrier
  · simpa only [hdiv, mul_zero, add_zero] using
      mode_two_azimuthal_divergence_defect u v w uR vR vZ wZ inverseRadius carrier
  · simpa only [hdiv, mul_zero, add_zero] using
      mode_two_axial_divergence_defect u w uR wR wZ inverseRadius carrier

/-- Real part of the original second-harmonic carrier after tangency of the
leading real Primary field. The three normal coordinates are frozen here. -/
theorem mode_two_tangent_carrier_real
    (k nR nTheta nZ uR uTheta uZ vR vTheta vZ uj vj : F)
    (h : nR * uR + nTheta * uTheta + nZ * uZ = 0) :
    -2 * k * (nR * (uR * vj + vR * uj) +
        nTheta * (uTheta * vj + vTheta * uj) +
        nZ * (uZ * vj + vZ * uj)) =
      -2 * k * (nR * vR + nTheta * vTheta + nZ * vZ) * uj := by
  linear_combination (-2 * k * vj) * h

/-- Imaginary part of the same carrier. Its remaining factor contains two
imaginary Primary operands and therefore retains both inverse carriers. -/
theorem mode_two_tangent_carrier_imaginary
    (k nR nTheta nZ uR uTheta uZ vR vTheta vZ uj vj : F)
    (h : nR * uR + nTheta * uTheta + nZ * uZ = 0) :
    2 * k * (nR * (uR * uj - vR * vj) +
        nTheta * (uTheta * uj - vTheta * vj) +
        nZ * (uZ * uj - vZ * vj)) =
      -2 * k * (nR * vR + nTheta * vTheta + nZ * vZ) * vj := by
  linear_combination (2 * k * uj) * h

end

#print axioms mode_two_radial_divergence_defect
#print axioms mode_two_azimuthal_divergence_defect
#print axioms mode_two_axial_divergence_defect
#print axioms mode_two_amplitude_only_of_zero_divergence

#print axioms mode_two_tangent_carrier_real
#print axioms mode_two_tangent_carrier_imaginary

end MathScope.M3.CD
