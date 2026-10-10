import AmplitudeInput

noncomputable section
namespace MathScope.SameDatumInputs
open Set Metric Complex
open NavierStokes.AnalyticCoefficientBounds NavierStokes.NaturalAxisCoefficients

theorem actualRealPhase_hasDerivAt {x : ℝ} (hx : x ∈ axisWindow.interval) :
    HasDerivAt (realPhase h j sigma) (realGradient h j sigma x) x := by
  have hd := actualPhase_derivative
    (real_mem_closedTube axisWindow (mul_nonneg (by norm_num) rho_pos.le) hx)
  simpa only [axisPhase_ofReal, complexGradient_ofReal, Complex.ofReal_re] using hd.real_of_complex

theorem actualRealAmplitude_hasDerivAt {x : ℝ} (hx : x ∈ axisWindow.interval) :
    HasDerivAt (realAmplitude h j sigma actualAmplitudeLambda actualAmplitudeC)
      ((actualAmplitudeLambda * realGradient h j sigma x) *
        realAmplitude h j sigma actualAmplitudeLambda actualAmplitudeC x) x := by
  have hd := (((actualRealPhase_hasDerivAt hx).const_mul actualAmplitudeLambda).exp).div_const actualAmplitudeC
  convert hd using 1
  unfold realAmplitude
  ring

theorem actualRealAmplitude_logDerivative {x : ℝ} (hx : x ∈ axisWindow.interval) :
    deriv (realAmplitude h j sigma actualAmplitudeLambda actualAmplitudeC) x /
      realAmplitude h j sigma actualAmplitudeLambda actualAmplitudeC x =
        actualAmplitudeLambda * realGradient h j sigma x := by
  rw [(actualRealAmplitude_hasDerivAt hx).deriv]
  exact mul_div_cancel_right₀ _
    (realAmplitude_pos h j sigma actualAmplitudeLambda amplitudeC_pos x).ne'

#print axioms actualRealPhase_hasDerivAt
#print axioms actualRealAmplitude_hasDerivAt
#print axioms actualRealAmplitude_logDerivative
end MathScope.SameDatumInputs
