import Std
open Lean.Grind
-- Algebraic control: removing the nonzero nonlinear contribution is false.
example : ((-1+1*(-3+0) : Rat)/4)=(-1)/4 := by grind
-- Taking a wrong sign in the positivity correction is false.
example : (305719 : Rat)/1152000-1 > 53/200 := by grind
