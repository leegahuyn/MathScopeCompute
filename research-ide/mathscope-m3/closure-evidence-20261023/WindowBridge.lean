import Std

namespace MathScope.M3.WindowBridge

/- The integer bridge only. These theorems do not assert realness of the
source majorants, logarithm/floor laws, or analyticity of any NS field. -/

theorem first_window_witness (ellMin m n : Int)
    (smallBand : ellMin + 10 ≤ m) (growth : m + 4 ≤ n) :
    max (ellMin + 6) m ≤ m ∧ m ≤ n - 1 := by
  constructor <;> omega

theorem first_window_has_four_levels (ellMin m n : Int)
    (smallBand : ellMin + 10 ≤ m) (growth : m + 4 ≤ n) :
    ∀ j : Int, 0 ≤ j → j ≤ 3 →
      max (ellMin + 6) m ≤ m + j ∧ m + j ≤ n - 1 := by
  intro j lo hi
  constructor <;> omega

theorem qstar_exponent_margin (ellMin m : Int)
    (smallBand : ellMin + 10 ≤ m) :
    ellMin + 4 + 6 ≤ m := by omega

theorem first_omitted_exponent_margin (m n j : Int)
    (growth : m + 4 ≤ n) (hi : j ≤ 3) :
    m + j + 1 ≤ n := by omega

theorem bounded_machine_level_excluded (ellMin ell : Int)
    (frequency : 32768 < ellMin) (sourceLevel : ellMin + 6 ≤ ell) :
    ¬ ell ≤ 32768 := by omega

#print axioms first_window_witness
#print axioms first_window_has_four_levels
#print axioms qstar_exponent_margin
#print axioms first_omitted_exponent_margin
#print axioms bounded_machine_level_excluded

end MathScope.M3.WindowBridge
