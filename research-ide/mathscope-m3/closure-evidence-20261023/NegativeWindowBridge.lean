import Std

-- A factor-8 gap would not guarantee the fourth level. This file MUST fail.
example (ellMin m n : Int)
    (smallBand : ellMin + 10 ≤ m) (insufficientGrowth : m + 3 ≤ n) :
    ∀ j : Int, 0 ≤ j → j ≤ 3 →
      max (ellMin + 6) m ≤ m + j ∧ m + j ≤ n - 1 := by
  intro j lo hi
  constructor <;> omega
