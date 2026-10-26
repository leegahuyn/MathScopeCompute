import Std

-- MUST fail: the u1 recurrence has a factor 1/2, and the pressure exterior
-- tail is not the outer kinetic-energy tail.
example : (9:Rat)/4 = 9/2 := by grind
example (h:Rat) : 1+2*h = 2*h := by grind
