import Init

/-- Required negative control.  This file must fail. -/
theorem rejected_zero_eq_one : (0 : Nat) = 1 := by
  rfl
