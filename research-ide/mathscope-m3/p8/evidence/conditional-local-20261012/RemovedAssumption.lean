import Init

/-! A deliberately circular research ledger demonstration. The printed goal is
    supplied verbatim as a user axiom. This is CONDITIONAL_ON_TARGET, never an
    independent arithmetic proof or part of the unconditional finite audit. -/
namespace MathScope.P8.Conditional


theorem conditional_target : (2 : Nat) + 2 = 4 := assumedTarget

end MathScope.P8.Conditional
