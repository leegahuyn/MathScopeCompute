import Init

/-!
Universal finite transport laws. The group operations and their laws are
explicit parameters. Nothing here constructs a compact group, a quantum
measure, a continuum limit, a vacuum Hamiltonian or a mass gap.
-/
namespace MathScope.M1.Gauge

universe u v
structure GroupLaw (G : Type u) where
  mul : G → G → G
  inv : G → G
  one : G
  assoc : ∀ a b c, mul (mul a b) c = mul a (mul b c)
  inv_mul : ∀ a, mul (inv a) a = one
  one_mul : ∀ a, mul one a = a
  mul_one : ∀ a, mul a one = a

namespace GroupLaw

def link (L : GroupLaw G) (gx u gy : G) : G := L.mul (L.mul gx u) (L.inv gy)

theorem inverse_cancellation (L : GroupLaw G) (a b : G) :
    L.mul (L.inv a) (L.mul a b) = b := by
  rw [← L.assoc, L.inv_mul, L.one_mul]

/-- Exact endpoint cancellation for every lawful group and arbitrary links. -/
theorem adjacent_transport_covariance (L : GroupLaw G) (gx gy gz u v : G) :
    L.mul (L.link gx u gy) (L.link gy v gz) =
      L.link gx (L.mul u v) gz := by
  simp only [link, L.assoc, inverse_cancellation]

/-- A closed three-edge holonomy transforms by conjugation at its base vertex. -/
theorem closed_holonomy_covariance (L : GroupLaw G) (gx gy gz u v w : G) :
    L.mul (L.mul (L.link gx u gy) (L.link gy v gz)) (L.link gz w gx) =
      L.link gx (L.mul (L.mul u v) w) gx := by
  rw [adjacent_transport_covariance, adjacent_transport_covariance]

/-- A class function is an explicit hypothesis. Matrix trace is separately checked in fixtures. -/
theorem closed_character_invariant (L : GroupLaw G) (χ : G → V)
    (classFunction : ∀ gx h, χ (L.link gx h gx) = χ h)
    (gx gy gz u v w : G) :
    χ (L.mul (L.mul (L.link gx u gy) (L.link gy v gz)) (L.link gz w gx)) =
      χ (L.mul (L.mul u v) w) := by
  rw [closed_holonomy_covariance, classFunction]

set_option pp.fullNames true
#check inverse_cancellation
#print axioms inverse_cancellation
#check adjacent_transport_covariance
#print axioms adjacent_transport_covariance
#check closed_holonomy_covariance
#print axioms closed_holonomy_covariance
#check closed_character_invariant
#print axioms closed_character_invariant

end GroupLaw
end MathScope.M1.Gauge
