import Std

/- This file MUST fail. The audit checks the actual compiler exit code. -/
theorem MathScope.M2.Navier.negativeFalse : False := by
  grind
