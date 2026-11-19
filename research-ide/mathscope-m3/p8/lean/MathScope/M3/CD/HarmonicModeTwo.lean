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

end

#print axioms mode_two_radial_divergence_defect
#print axioms mode_two_azimuthal_divergence_defect
#print axioms mode_two_axial_divergence_defect
#print axioms mode_two_amplitude_only_of_zero_divergence

end MathScope.M3.CD
