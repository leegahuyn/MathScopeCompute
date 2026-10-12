import Init

/-!
MathScope kernel-only conditional logic.

This standalone companion requires Lean 4, but not mathlib. The energies are an
ABSTRACT ORDER INTERFACE, not a construction of the real numbers. The product
coordinate result applies to real coordinates after instantiation; this core
file itself contains no Euclidean metric, Lie group, Hilbert space, or QFT.
The mathlib companion `MathScopeConditionalYM.lean` uses actual real energies.

All quantum-existence conclusions below intentionally depend on a custom axiom.
The abstract quantum predicates have not been expanded into OS/Wightman axioms.
Neither a picture nor this logic proves the Yang–Mills Millennium problem.
-/

namespace MathScopeConditionalYMCore

universe u v

structure EnergyOrder where
  Carrier : Type
  zero : Carrier
  le : Carrier → Carrier → Prop
  lt : Carrier → Carrier → Prop
  leTrans : ∀ a b c, le a b → le b c → le a c
  leNotLt : ∀ a b, le a b → ¬ lt b a

structure SpectralInterface (E : EnergyOrder) where
  spectrum : E.Carrier → Prop
  vacuum : spectrum E.zero
  positiveEnergy : ∀ x, spectrum x → E.le E.zero x
  finiteExcitation : ∃ x, spectrum x ∧ E.lt E.zero x

def HasGap (E : EnergyOrder) (M : SpectralInterface E) (delta : E.Carrier) : Prop :=
  E.lt E.zero delta ∧ ∀ x, M.spectrum x → E.lt E.zero x → E.le delta x

theorem gapExcludesOpenInterval (E : EnergyOrder) (M : SpectralInterface E)
    (delta : E.Carrier) (hGap : HasGap E M delta) :
    ∀ x, E.lt E.zero x → E.lt x delta → ¬ M.spectrum x := by
  intro x hPositive hBelow hSpectrum
  exact E.leNotLt delta x (hGap.2 x hSpectrum hPositive) hBelow

theorem smallerPositiveGap (E : EnergyOrder) (M : SpectralInterface E)
    (delta epsilon : E.Carrier) (hGap : HasGap E M delta)
    (hPositive : E.lt E.zero epsilon) (hSmaller : E.le epsilon delta) :
    HasGap E M epsilon := by
  refine ⟨hPositive, ?_⟩
  intro x hSpectrum hEnergy
  exact E.leTrans epsilon delta x hSmaller (hGap.2 x hSpectrum hEnergy)

theorem gapHasFiniteUpperBound (E : EnergyOrder) (M : SpectralInterface E)
    (delta : E.Carrier) (hGap : HasGap E M delta) :
    ∃ x, M.spectrum x ∧ E.lt E.zero x ∧ E.le delta x := by
  cases M.finiteExcitation with
  | intro x h => exact ⟨x, h.1, h.2, hGap.2 x h.1 h.2⟩

/-- Spectral inclusion is an additional certificate, not a property of a drawing. -/
theorem gapTransfer (E : EnergyOrder) (original observed : SpectralInterface E)
    (delta : E.Carrier) (hObserved : HasGap E observed delta)
    (hBridge : ∀ x, original.spectrum x → observed.spectrum x) :
    HasGap E original delta := by
  refine ⟨hObserved.1, ?_⟩
  intro x hOriginal hPositive
  exact hObserved.2 x (hBridge x hOriginal) hPositive

abbrev Point3 (C : Type u) := C × C × C
abbrev Point4 (C : Type u) := Point3 C × C

def project3 {C : Type u} (x : Point4 C) : Point3 C := x.1
def insertSlice {C : Type u} (c : C) (y : Point3 C) : Point4 C := (y, c)

theorem projectInsertSlice {C : Type u} (c : C) (y : Point3 C) :
    project3 (insertSlice c y) = y := rfl

theorem projectionSurjective {C : Type u} (c : C) :
    ∀ y : Point3 C, ∃ x : Point4 C, project3 x = y := by
  intro y
  exact ⟨insertSlice c y, rfl⟩

theorem projectionNotInjective {C : Type u} (a b : C) (hne : a ≠ b) :
    ¬ (∀ x y : Point4 C, project3 x = project3 y → x = y) := by
  intro hInjective
  have h : insertSlice a (a, a, a) = insertSlice b (a, a, a) :=
    hInjective (insertSlice a (a, a, a)) (insertSlice b (a, a, a)) rfl
  exact hne (congrArg Prod.snd h)

def ConstantOnFibres {C : Type u} {V : Type v} (f : Point4 C → V) : Prop :=
  ∀ x y, project3 x = project3 y → f x = f y

theorem observableDescendsIff {C : Type u} {V : Type v} (c : C)
    (f : Point4 C → V) :
    (∃ g : Point3 C → V, ∀ x, f x = g (project3 x)) ↔ ConstantOnFibres f := by
  constructor
  · intro h
    cases h with
    | intro g hFactor =>
      intro x y hProjection
      calc
        f x = g (project3 x) := hFactor x
        _ = g (project3 y) := congrArg g hProjection
        _ = f y := (hFactor y).symm
  · intro hFibres
    refine ⟨fun y => f (insertSlice c y), ?_⟩
    intro x
    exact hFibres x (insertSlice c (project3 x)) rfl

structure ReconstructionCertificate {C : Type u} (domain : Point4 C → Prop) where
  reconstruct : Point3 C → Point4 C
  correct : ∀ x, domain x → reconstruct (project3 x) = x

theorem reconstructionInjectiveOn {C : Type u} (domain : Point4 C → Prop)
    (certificate : ReconstructionCertificate domain) :
    ∀ x y, domain x → domain y → project3 x = project3 y → x = y := by
  intro x y hx hy hProjection
  calc
    x = certificate.reconstruct (project3 x) := (certificate.correct x hx).symm
    _ = certificate.reconstruct (project3 y) := congrArg certificate.reconstruct hProjection
    _ = y := certificate.correct y hy

theorem propertyOfCertifiedReconstruction {C : Type u} (domain : Point4 C → Prop)
    (certificate : ReconstructionCertificate domain) (P : Point4 C → Prop)
    (x : Point4 C) (hx : domain x)
    (hObserved : P (certificate.reconstruct (project3 x))) : P x := by
  exact Eq.mp (congrArg P (certificate.correct x hx)) hObserved

structure GaugeGroupDeclaration where
  name : String
  specification : String

/- Fixed semantic interfaces. They are deliberately not arbitrary predicates
   universally substituted into the existence axiom. The energy interface is
   abstract here; use the mathlib companion for real energies. -/
axiom quantumEnergyOrder : EnergyOrder
axiom IsCompactSimpleGaugeGroup : GaugeGroupDeclaration → Prop
axiom IsNontrivialQuantumYMOnR4 :
  GaugeGroupDeclaration → SpectralInterface quantumEnergyOrder → Prop

axiom userAssumedYMExistenceWithGap (G : GaugeGroupDeclaration)
    (hGroup : IsCompactSimpleGaugeGroup G) :
    ∃ (M : SpectralInterface quantumEnergyOrder) (delta : quantumEnergyOrder.Carrier),
      IsNontrivialQuantumYMOnR4 G M ∧ HasGap quantumEnergyOrder M delta

theorem conditionalGapCorollaries (G : GaugeGroupDeclaration)
    (hGroup : IsCompactSimpleGaugeGroup G) :
    ∃ (M : SpectralInterface quantumEnergyOrder) (delta : quantumEnergyOrder.Carrier),
      IsNontrivialQuantumYMOnR4 G M ∧
      HasGap quantumEnergyOrder M delta ∧
      (∀ epsilon, quantumEnergyOrder.lt quantumEnergyOrder.zero epsilon →
        quantumEnergyOrder.le epsilon delta → HasGap quantumEnergyOrder M epsilon) := by
  cases userAssumedYMExistenceWithGap G hGroup with
  | intro M hM =>
    cases hM with
    | intro delta h =>
      refine ⟨M, delta, h.1, h.2, ?_⟩
      intro epsilon hPositive hSmaller
      exact smallerPositiveGap quantumEnergyOrder M delta epsilon h.2 hPositive hSmaller

#print axioms gapExcludesOpenInterval
#print axioms smallerPositiveGap
#print axioms gapHasFiniteUpperBound
#print axioms gapTransfer
#print axioms projectInsertSlice
#print axioms projectionSurjective
#print axioms projectionNotInjective
#print axioms observableDescendsIff
#print axioms reconstructionInjectiveOn
#print axioms propertyOfCertifiedReconstruction
#print axioms conditionalGapCorollaries

end MathScopeConditionalYMCore
