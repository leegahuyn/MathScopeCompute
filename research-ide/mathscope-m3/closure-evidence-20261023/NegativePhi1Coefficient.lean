import Std

-- These two false scalar claims MUST be rejected. A wider tube has not
-- inherited the proven denominator margin, and the exact coefficient
-- contribution is different from the comparator value 1/4.
example : (6000 : Rat)/2048 < 1/2 := by grind
example : (1000000 : Rat)/4000001 = 1/4 := by grind
