import MathScope.M1.Gauge.Fixtures
set_option maxRecDepth 200000
set_option maxHeartbeats 16000000
namespace MathScope.M1.Gauge

/-- All fourteen actual compact G2 basis matrices have square shape. -/
theorem g2_shapes : g2Basis.all (squareShape 7) = true := by decide

/-- The complete real antisymmetric matrix basis is anti-Hermitian. -/
theorem g2_compact_form : g2Basis.all antiHermitian = true := by decide

/-- All 91 unordered brackets agree with the exact table of the octonion stabilizer. -/
theorem g2_complete_bracket_table : checkBracketRows 7 g2Basis g2BracketRows = true := by decide

/-- Actual 7x7 embedded quaternion matrices; cleared denominator SU2 brackets. -/
theorem g2_embedding_brackets : matBracket g2L0 g2L1 = matScale 2 g2L2 ∧ matBracket g2L1 g2L2 = matScale 2 g2L0 ∧ matBracket g2L2 g2L0 = matScale 2 g2L1 := by decide

/-- B=-Tr_7/2 and T=L/2 give B(T_a,T_b)=delta_ab/2, index one. -/
theorem g2_embedding_metric : gramTrace g2EmbeddingScaled = [[4,0,0],[0,4,0],[0,0,4]] := by decide

/-- An exact exceptional-algebra Jacobi fixture, distinct from an abstract group label. -/
theorem g2_jacobi_fixture : bracketJacobi g2B0 g2B1 g2B2 = matZero 7 := by decide

/-- The exact nontrivial quaternion block link is orthogonal and unitary. -/
theorem g2_link_unitary : matMul (matDagger g2U0) g2U0 = matId 7 := by decide

/-- Distinct exact compact site frames used in a finite gauge covariance fixture. -/
theorem g2_nonconstant_site_frames : matMul (matDagger g2Omega0) g2Omega0 = matId 7 ∧ matMul (matDagger g2Omega1) g2Omega1 = matId 7 := by decide

/-- Exact endpoint cancellation for an actual exceptional-group loop with unequal site frames. -/
theorem g2_holonomy_covariance : holonomy3 (gaugeLink g2Omega0 g2U0 g2Omega1) (gaugeLink g2Omega1 g2U1 (matId 7)) (gaugeLink (matId 7) g2U2 g2Omega0) = gaugeLink g2Omega0 (holonomy3 g2U0 g2U1 g2U2) g2Omega0 := by decide

/-- Closed unnormalized Wilson trace equality of literal matrices, without floating point. -/
theorem g2_wilson_trace : matTrace (holonomy3 (gaugeLink g2Omega0 g2U0 g2Omega1) (gaugeLink g2Omega1 g2U1 (matId 7)) (gaugeLink (matId 7) g2U2 g2Omega0)) = matTrace (holonomy3 g2U0 g2U1 g2U2) := by decide

set_option pp.fullNames true
#check g2_shapes
#print axioms g2_shapes
#check g2_compact_form
#print axioms g2_compact_form
#check g2_complete_bracket_table
#print axioms g2_complete_bracket_table
#check g2_embedding_brackets
#print axioms g2_embedding_brackets
#check g2_embedding_metric
#print axioms g2_embedding_metric
#check g2_jacobi_fixture
#print axioms g2_jacobi_fixture
#check g2_link_unitary
#print axioms g2_link_unitary
#check g2_nonconstant_site_frames
#print axioms g2_nonconstant_site_frames
#check g2_holonomy_covariance
#print axioms g2_holonomy_covariance
#check g2_wilson_trace
#print axioms g2_wilson_trace
end MathScope.M1.Gauge
