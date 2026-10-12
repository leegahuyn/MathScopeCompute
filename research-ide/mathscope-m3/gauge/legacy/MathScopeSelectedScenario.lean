import Mathlib.Basic.Real.Basic

/-!
# MathScope conditional Yang–Mills and projection contract

STATUS: conditional scaffold. This file is NOT a formalization or proof of the
Clay Yang–Mills existence and mass-gap problem. Kernel checking this file checks
the stated consequences of the declared assumptions only.

Formalization boundary:
* `SpectralInterface` contains a set of real energies and elementary spectral
  conditions. It does not construct a Hilbert space, a self-adjoint Hamiltonian,
  quantum fields, an interacting measure, or an Osterwalder–Schrader reconstruction.
* The group declaration is metadata. Its compact/simple status is an external,
  uninterpreted predicate; a label is not a theorem about a Lie group.
* `IsNontrivialQuantumYMOnR4` is also an uninterpreted semantic interface. Its
  OS/Wightman, gauge-invariance, renormalization and short-distance obligations
  have not been formalized here.
* `userAssumedYMExistenceWithGap` is a deliberate custom axiom. Its name must
  remain visible in the axiom audit of dependent corollaries.
* A slider-selected delta is a proposed lower bound in a chosen energy unit.
  Existence of SOME positive gap does not certify EVERY slider value for one model.

References:
https://www.claymath.org/wp-content/uploads/2022/06/yangmills.pdf
https://lean-lang.org/doc/reference/latest/Axioms/
-/

namespace MathScopeConditionalYM

/-- Declaration metadata only: this record is not a compact Lie group structure. -/
structure GaugeGroupDeclaration where
  name : String
  specification : String

/-- Minimal real spectral interface; the QFT realization remains a separate obligation. -/
structure SpectralInterface where
  spectrum : Set ℝ
  vacuumEnergy : (0 : ℝ) ∈ spectrum
  positiveEnergy : ∀ E ∈ spectrum, 0 ≤ E
  finiteExcitation : ∃ E ∈ spectrum, 0 < E

/-- A positive lower bound on every positive spectral energy. -/
def HasMassGap (M : SpectralInterface) (delta : ℝ) : Prop :=
  0 < delta ∧ ∀ E ∈ M.spectrum, 0 < E → delta ≤ E

/-- Immediate spectral exclusion, with all hypotheses visible in the theorem. -/
theorem gap_excludes_open_interval (M : SpectralInterface) (delta : ℝ)
    (hGap : HasMassGap M delta) :
    ∀ E, 0 < E → E < delta → E ∉ M.spectrum := by
  intro E hPositive hBelow hSpectrum
  exact (not_lt_of_ge (hGap.2 E hSpectrum hPositive)) hBelow

/-- A certified lower bound also certifies every smaller positive lower bound. -/
theorem smaller_positive_gap (M : SpectralInterface) (delta epsilon : ℝ)
    (hGap : HasMassGap M delta) (hPositive : 0 < epsilon)
    (hSmaller : epsilon ≤ delta) : HasMassGap M epsilon := by
  refine ⟨hPositive, ?_⟩
  intro E hSpectrum hEnergy
  exact le_trans hSmaller (hGap.2 E hSpectrum hEnergy)

/-- Any actual positive spectral energy provides a finite upper bound on delta. -/
theorem gap_has_finite_upper_bound (M : SpectralInterface) (delta : ℝ)
    (hGap : HasMassGap M delta) :
    ∃ E ∈ M.spectrum, 0 < E ∧ delta ≤ E := by
  obtain ⟨E, hSpectrum, hPositive⟩ := M.finiteExcitation
  exact ⟨E, hSpectrum, hPositive, hGap.2 E hSpectrum hPositive⟩

/-- Transfer uses explicit spectral inclusion in the same energy units. -/
theorem gap_transfer (original observed : SpectralInterface) (delta : ℝ)
    (hObservedGap : HasMassGap observed delta)
    (hBridge : original.spectrum ⊆ observed.spectrum) :
    HasMassGap original delta := by
  refine ⟨hObservedGap.1, ?_⟩
  intro E hOriginal hPositive
  exact hObservedGap.2 E (hBridge hOriginal) hPositive

/-- Three coordinates followed by one discarded coordinate. -/
abbrev Point3 := ℝ × ℝ × ℝ
abbrev Point4 := Point3 × ℝ

def project3 (x : Point4) : Point3 := x.1
def insertSlice (c : ℝ) (y : Point3) : Point4 := (y, c)

theorem project_insert_slice (c : ℝ) (y : Point3) :
    project3 (insertSlice c y) = y := rfl

theorem projection_surjective : Function.Surjective project3 := by
  intro y
  exact ⟨insertSlice 0 y, rfl⟩

/-- An explicit failure of reconstruction from a 3D point without extra data. -/
theorem projection_not_injective : ¬ Function.Injective project3 := by
  intro hInjective
  have h : insertSlice 0 (0, 0, 0) = insertSlice 1 (0, 0, 0) :=
    hInjective rfl
  have hTime : (0 : ℝ) = 1 := congrArg Prod.snd h
  exact zero_ne_one hTime

/-- An observable can descend only when it is constant on projection fibres. -/
def ConstantOnFibres {Value : Type*} (f : Point4 → Value) : Prop :=
  ∀ x y, project3 x = project3 y → f x = f y

/-- Exact criterion for representing an observable without loss through this projection. -/
theorem observable_descends_iff {Value : Type*} (f : Point4 → Value) :
    (∃ g : Point3 → Value, ∀ x, f x = g (project3 x)) ↔ ConstantOnFibres f := by
  constructor
  · rintro ⟨g, hFactor⟩ x y hProjection
    rw [hFactor x, hFactor y, hProjection]
  · intro hFibres
    refine ⟨fun y => f (insertSlice 0 y), ?_⟩
    intro x
    exact hFibres x (insertSlice 0 (project3 x)) rfl

/-- Additional data sufficient to reconstruct points in a specified domain. -/
structure ReconstructionCertificate (domain : Set Point4) where
  reconstruct : Point3 → Point4
  correct : ∀ x ∈ domain, reconstruct (project3 x) = x

theorem reconstruction_implies_injective_on (domain : Set Point4)
    (certificate : ReconstructionCertificate domain) :
    Set.InjOn project3 domain := by
  intro x hx y hy hProjection
  calc
    x = certificate.reconstruct (project3 x) := (certificate.correct x hx).symm
    _ = certificate.reconstruct (project3 y) := congrArg certificate.reconstruct hProjection
    _ = y := certificate.correct y hy

/-- A property of a certified reconstruction transfers back on the certified domain. -/
theorem property_of_certified_reconstruction (domain : Set Point4)
    (certificate : ReconstructionCertificate domain) (P : Point4 → Prop)
    (x : Point4) (hx : x ∈ domain)
    (hObserved : P (certificate.reconstruct (project3 x))) : P x := by
  rw [certificate.correct x hx] at hObserved
  exact hObserved

/-!
## Explicit assumption mode

The next TWO axioms introduce fixed semantic predicates. They do not define
compact simple Lie groups or quantum field theories. The third axiom supplies
the user's hypothetical existence statement in that still-incomplete interface.
No axiom here universally quantifies over arbitrary replacement predicates.
-/

axiom IsCompactSimpleGaugeGroup : GaugeGroupDeclaration → Prop

axiom IsNontrivialQuantumYMOnR4 : GaugeGroupDeclaration → SpectralInterface → Prop

axiom userAssumedYMExistenceWithGap (G : GaugeGroupDeclaration)
    (hGroup : IsCompactSimpleGaugeGroup G) :
    ∃ (M : SpectralInterface) (delta : ℝ),
      IsNontrivialQuantumYMOnR4 G M ∧ HasMassGap M delta

/-- Conditional corollary bundle, deliberately dependent on the custom existence axiom. -/
theorem conditional_gap_corollaries (G : GaugeGroupDeclaration)
    (hGroup : IsCompactSimpleGaugeGroup G) :
    ∃ (M : SpectralInterface) (delta : ℝ),
      IsNontrivialQuantumYMOnR4 G M ∧
      HasMassGap M delta ∧
      (∀ epsilon, 0 < epsilon → epsilon ≤ delta → HasMassGap M epsilon) ∧
      (∀ E, 0 < E → E < delta → E ∉ M.spectrum) := by
  obtain ⟨M, delta, hYM, hGap⟩ := userAssumedYMExistenceWithGap G hGroup
  refine ⟨M, delta, hYM, hGap, ?_, ?_⟩
  · intro epsilon hPositive hSmaller
    exact smaller_positive_gap M delta epsilon hGap hPositive hSmaller
  · exact gap_excludes_open_interval M delta hGap

/-!
## Axiom audit

The first group must not depend on the three custom YM interface axioms.
The last declaration deliberately does depend on `userAssumedYMExistenceWithGap`.
A successful kernel check of that last theorem is CONDITIONAL, never a proof
that quantum Yang–Mills exists or that a positive gap has been established.
-/

#print axioms gap_excludes_open_interval
#print axioms smaller_positive_gap
#print axioms gap_has_finite_upper_bound
#print axioms gap_transfer
#print axioms project_insert_slice
#print axioms projection_surjective
#print axioms projection_not_injective
#print axioms observable_descends_iff
#print axioms reconstruction_implies_injective_on
#print axioms property_of_certified_reconstruction
#print axioms conditional_gap_corollaries

end MathScopeConditionalYM


/- Selected MathScope scenario. GENERATED SOURCE: requires its own kernel check.
   The selected positive lower bound is an ADDITIONAL USER AXIOM.
   Changing the slider creates a different hypothesis, not a measured spectrum.
   The BPST density observation is not used as evidence of this axiom. -/
namespace MathScopeSelectedScenario
open MathScopeConditionalYM
def declaredGroup : GaugeGroupDeclaration :=
  { name := "SU(2)", specification := "User-declared compact simple gauge group; realization required" }
noncomputable def declaredDelta : ℝ := (10 : ℝ) / 10
noncomputable def selectedSlice : ℝ := (0 : ℝ) / 10
axiom declaredGroupHasRequiredStructure : IsCompactSimpleGaugeGroup declaredGroup
axiom selectedModel : SpectralInterface
axiom selectedExistenceAndGap :
  IsNontrivialQuantumYMOnR4 declaredGroup selectedModel ∧ HasMassGap selectedModel declaredDelta
theorem selected_gap_corollary :
    ∀ E, 0 < E → E < declaredDelta → E ∉ selectedModel.spectrum := by
  exact gap_excludes_open_interval selectedModel declaredDelta selectedExistenceAndGap.2
theorem selected_slice_roundtrip (y : Point3) :
    project3 (insertSlice selectedSlice y) = y := by
  exact project_insert_slice selectedSlice y
/- The following theorem needs the reconstruction certificate explicitly.
   A density line integral is not such a certificate. -/
theorem selected_observation_transfer (domain : Set Point4)
    (certificate : ReconstructionCertificate domain) (P : Point4 → Prop)
    (x : Point4) (hx : x ∈ domain)
    (hObserved : P (certificate.reconstruct (project3 x))) : P x := by
  exact property_of_certified_reconstruction domain certificate P x hx hObserved
#print axioms selected_gap_corollary
#print axioms selected_slice_roundtrip
#print axioms selected_observation_transfer
end MathScopeSelectedScenario
