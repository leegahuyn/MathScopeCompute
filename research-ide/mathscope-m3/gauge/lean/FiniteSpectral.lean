import Init

/-!
Exact finite certificates. Every energy/time scale below is an exact
nonnegative integer numerator with separately recorded positive denominators.
The geometric semigroup certificate controls all discrete times in this
explicit finite model. It is not a formalization of Real.exp, Real.log, a
continuous-group transfer operator, or a continuum quantum field theory.
-/
namespace MathScope.M3.Gauge

abbrev WeightedLevel := Nat × Nat
def weightSum (levels : List WeightedLevel) : Nat :=
  (levels.map (fun p => p.1)).sum
def spectralNumerator (levels : List WeightedLevel) (time : Nat) : Nat :=
  (levels.map (fun p => p.1 * p.2 ^ time)).sum

/-- Nonnegative weights and a bound on every level give a finite spectral bound.
Divide by the same positive D^time and weight denominator on both sides to
read this as sum w_j q_j^time <= r^time sum w_j. -/
theorem finite_positive_spectral_sum_bound
    (levels : List WeightedLevel) (r time : Nat)
    (allLevels : ∀ p ∈ levels, p.2 ≤ r) :
    spectralNumerator levels time ≤ weightSum levels * r ^ time := by
  induction levels with
  | nil => simp [spectralNumerator, weightSum]
  | cons p ps ih =>
    have hp : p.2 ≤ r := allLevels p (by simp)
    have hps : ∀ q ∈ ps, q.2 ≤ r := by
      intro q hq
      exact allLevels q (by simp [hq])
    have hterm := Nat.mul_le_mul_left p.1 (Nat.pow_le_pow_left hp time)
    have htail := ih hps
    simpa [spectralNumerator, weightSum, Nat.add_mul] using Nat.add_le_add hterm htail

structure TransferCertificate where
  modelId : String
  cutoff : String
  denominator : Nat
  eigenNumerators : List Nat
  vacuumIndices : List Nat
  atNumerator : Nat
  atDenominator : Nat
  ratioNumerator : Nat
  ratioDenominator : Nat
  deriving Repr

def TransferCertificate.valid (c : TransferCertificate) : Bool :=
  0 < c.denominator && 0 < c.atNumerator && 0 < c.atDenominator &&
  0 < c.ratioNumerator && c.ratioNumerator < c.ratioDenominator &&
  1 < c.eigenNumerators.length &&
  !c.vacuumIndices.isEmpty &&
  c.vacuumIndices.all (fun i => i < c.eigenNumerators.length) &&
  c.eigenNumerators.any (fun a => a < c.denominator) &&
  (c.eigenNumerators.zipIdx).all (fun (a,i) =>
    0 < a && a ≤ c.denominator &&
    ((c.vacuumIndices.contains i) == (a == c.denominator)) &&
    (c.vacuumIndices.contains i || a * c.ratioDenominator ≤ c.ratioNumerator * c.denominator))

/-- Full four-dimensional Hilbert space of the displayed finite diagonal model.
It is not the dimension of a finite-space compact-group lattice Hilbert space. -/
def fourState : TransferCertificate :=
  ⟨"m3-four-state-diagonal-transfer", "complete finite C^4; no uncut lattice claim",
    8, [8,4,2,1], [0], 1,1,1,2⟩
theorem four_state_transfer_certificate : fourState.valid = true := by decide

def degenerateVacuum : TransferCertificate :=
  ⟨"m3-degenerate-vacuum", "complete finite C^4 with two-dimensional vacuum",
    8, [8,8,4,1], [0,1], 1,1,1,2⟩
theorem complete_degenerate_vacuum_certificate : degenerateVacuum.valid = true := by decide

def fourStateWeights : List WeightedLevel := [(100,4),(35,2),(15,1)]
theorem four_state_all_time_envelope (time : Nat) :
    spectralNumerator fourStateWeights time ≤ 150 * 4 ^ time := by
  have h : ∀ p ∈ fourStateWeights, p.2 ≤ 4 := by
    intro p hp
    simp [fourStateWeights] at hp
    rcases hp with h | h | h <;> subst p <;> decide
  simpa [weightSum, fourStateWeights] using
    finite_positive_spectral_sum_bound fourStateWeights 4 time h

structure Point4 where
  x : Int
  y : Int
  z : Int
  w : Int
  deriving DecidableEq
abbrev Point3 := Int × Int × Int
def project (p : Point4) : Point3 := (p.x,p.y,p.z)
def insertSlice (c : Int) (p : Point3) : Point4 := ⟨p.1,p.2.1,p.2.2,c⟩
theorem projection_collision :
  project ⟨0,0,0,0⟩ = project ⟨0,0,0,1⟩ ∧
  (Point4.mk 0 0 0 0) ≠ (Point4.mk 0 0 0 1) := by decide
theorem project_insert_slice (c : Int) (p : Point3) :
    project (insertSlice c p) = p := by cases p; rfl
theorem property_of_fibre_constancy (P : Point4 → Prop)
    (hfibre : ∀ x y, project x = project y → (P x ↔ P y))
    (x y : Point4) (samePicture : project x = project y) : P x ↔ P y :=
  hfibre x y samePicture
theorem property_of_certified_reconstruction
    (D : Point4 → Prop) (R : Point3 → Point4) (P : Point4 → Prop)
    (reconstructs : ∀ x, D x → R (project x) = x)
    (x : Point4) (inDomain : D x) (observed : P (R (project x))) : P x := by
  rw [reconstructs x inDomain] at observed
  exact observed

def declaredGap (spectrum : Nat → Prop) (delta : Nat) : Prop :=
  0 < delta ∧ ∀ energy, spectrum energy → 0 < energy → delta ≤ energy
theorem conditional_gap_exclusion (spectrum : Nat → Prop) (delta energy : Nat)
    (hgap : declaredGap spectrum delta) (hpositive : 0 < energy)
    (hbelow : energy < delta) : ¬ spectrum energy := by
  intro hs
  exact Nat.not_lt_of_ge (hgap.2 energy hs hpositive) hbelow
theorem correct_direction_spectrum_transfer
    (original observed : Nat → Prop) (delta : Nat)
    (hgap : declaredGap observed delta)
    (inclusion : ∀ energy, original energy → observed energy) :
    declaredGap original delta := by
  exact ⟨hgap.1, fun energy hOrig hPos => hgap.2 energy (inclusion energy hOrig) hPos⟩

#print axioms finite_positive_spectral_sum_bound
#print axioms four_state_transfer_certificate
#print axioms complete_degenerate_vacuum_certificate
#print axioms four_state_all_time_envelope
#print axioms projection_collision
#print axioms project_insert_slice
#print axioms property_of_fibre_constancy
#print axioms property_of_certified_reconstruction
#print axioms conditional_gap_exclusion
#print axioms correct_direction_spectrum_transfer
end MathScope.M3.Gauge
