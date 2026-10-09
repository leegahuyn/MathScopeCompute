import MathScope.M1.Gauge.Fixtures
set_option maxRecDepth 200000
set_option maxHeartbeats 16000000
namespace MathScope.M1.Gauge

/-- All eight concrete defining matrices have square shape. -/
theorem su3_shapes : su3Basis.all (squareShape 3) = true := by decide

/-- The literal full basis lies in the anti-Hermitian real form. -/
theorem su3_compact_form : su3Basis.all antiHermitian = true := by decide

/-- All 28 unordered basis brackets agree with the exact integral table. -/
theorem su3_complete_bracket_table : checkBracketRows 3 su3Basis su3BracketRows = true := by decide

/-- Cleared denominators: L_a=2T_a, hence [L_a,L_b]=2 epsilon L_c. -/
theorem su3_embedding_brackets : matBracket su3L0 su3L1 = matScale 2 su3L2 ∧ matBracket su3L1 su3L2 = matScale 2 su3L0 ∧ matBracket su3L2 su3L0 = matScale 2 su3L1 := by decide

/-- With B=-Tr and T=L/2 this gives B(T_a,T_b)=delta_ab/2, index one. -/
theorem su3_embedding_metric : gramTrace su3EmbeddingScaled = [[2,0,0],[0,2,0],[0,0,2]] := by decide

/-- A nonzero nested-bracket Jacobi fixture; full table Jacobi is independently exact-rational checked. -/
theorem su3_jacobi_fixture : bracketJacobi su3B0 su3B1 su3B2 = matZero 3 := by decide

/-- A nontrivial exact embedded SU2 link is unitary. -/
theorem su3_link_unitary : matMul (matDagger su3U0) su3U0 = matId 3 := by decide

set_option pp.fullNames true
#check su3_shapes
#print axioms su3_shapes
#check su3_compact_form
#print axioms su3_compact_form
#check su3_complete_bracket_table
#print axioms su3_complete_bracket_table
#check su3_embedding_brackets
#print axioms su3_embedding_brackets
#check su3_embedding_metric
#print axioms su3_embedding_metric
#check su3_jacobi_fixture
#print axioms su3_jacobi_fixture
#check su3_link_unitary
#print axioms su3_link_unitary
end MathScope.M1.Gauge
