import Std
open Lean.Grind
-- Missing the derivative-radial kernel factor is a false bound.
example : (40*768 : Rat) ≤ 1 := by grind
-- The common eta radius cannot be enlarged to rho at Y=5.
example : (1 : Rat)/4+1 < 1 := by grind
