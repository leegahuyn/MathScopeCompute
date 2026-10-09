import MathScope.M0.Defs

open MathScope.M0

/- A sign error in D1: this certificate is false and must fail. -/
def corruptD1 (v : C1) : C2 := ⟨-v.v + v.w, 0, -v.u + v.y⟩

example : corruptD1 (d0 ⟨0, 1, 0, 0⟩) = zeroC2 := by
  decide
