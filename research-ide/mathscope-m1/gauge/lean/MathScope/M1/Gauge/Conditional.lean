import Init

/-!
Explicit finite energy and projection logic. Energies in the first two lemmas
are NATURAL NUMBERS in a declared discrete energy unit, not real spectral data.
The remaining projection statements work over any coordinate type and any
property. Analytic norm/domain/limit requirements are recorded independently
in analytic-assumptions.json, not asserted as imported Lean results.
-/
namespace MathScope.M1.Gauge

/-- Finite constructed excited-energy support. No existence assumption is hidden. -/
def finiteExcitedSupport (delta : Nat) (offsets : List Nat) (energy : Nat) : Prop :=
  ∃ offset, offset ∈ offsets ∧ energy = delta + offset

theorem finite_support_has_lower_bound (delta : Nat) (offsets : List Nat) (energy : Nat)
    (support : finiteExcitedSupport delta offsets energy) : delta ≤ energy := by
  obtain ⟨offset, _, he⟩ := support
  rw [he]
  exact Nat.le_add_right delta offset

/-- A nonempty open interval below the declared finite construction contains no excitation. -/
theorem finite_gap_excludes_interval (delta : Nat) (offsets : List Nat) (energy : Nat)
    (below : energy < delta) : ¬ finiteExcitedSupport delta offsets energy := by
  intro hs
  exact Nat.not_lt_of_ge (finite_support_has_lower_bound delta offsets energy hs) below

universe u
structure Point4 (K : Type u) where
  x : K
  y : K
  z : K
  w : K
  deriving DecidableEq
structure Point3 (K : Type u) where
  x : K
  y : K
  z : K
  deriving DecidableEq

def project3 (p : Point4 K) : Point3 K := ⟨p.x,p.y,p.z⟩
def sliceLift (c : K) (p : Point3 K) : Point4 K := ⟨p.x,p.y,p.z,c⟩

theorem project_slice_roundtrip (c : K) (p : Point3 K) :
    project3 (sliceLift c p) = p := by cases p; rfl

/-- Two distinct literal 4D points have the same displayed 3D position. -/
theorem projection_collision :
    project3 (Point4.mk 0 0 0 (0 : Nat)) = project3 (Point4.mk 0 0 0 1) ∧
    Point4.mk 0 0 0 (0 : Nat) ≠ Point4.mk 0 0 0 1 := by decide

/-- Transfer requires the property to be constant on whole projection fibres. -/
theorem property_descends_with_fibre_certificate
    (P : Point4 K → Prop)
    (fibreCertificate : ∀ a b, project3 a = project3 b → (P a ↔ P b))
    (c : K) (p : Point4 K) : P p ↔ P (sliceLift c (project3 p)) := by
  apply fibreCertificate
  rw [project_slice_roundtrip]

/-- A specified slice does reconstruct the original point when its fourth coordinate is known. -/
theorem reconstruction_on_selected_slice (c : K) (p : Point4 K) (onSlice : p.w = c) :
    sliceLift c (project3 p) = p := by
  cases p with
  | mk x y z w =>
    change w = c at onSlice
    cases onSlice
    rfl

set_option pp.fullNames true
#check finite_support_has_lower_bound
#print axioms finite_support_has_lower_bound
#check finite_gap_excludes_interval
#print axioms finite_gap_excludes_interval
#check project_slice_roundtrip
#print axioms project_slice_roundtrip
#check projection_collision
#print axioms projection_collision
#check property_descends_with_fibre_certificate
#print axioms property_descends_with_fibre_certificate
#check reconstruction_on_selected_slice
#print axioms reconstruction_on_selected_slice

end MathScope.M1.Gauge
