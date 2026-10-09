import Init

/-!
Research metadata only.  No mathematical proposition is postulated as an
axiom here.  Unconditional theorem modules do not import this file.
-/

namespace MathScope.M0.Open

structure ResearchGate where
  id : String
  statement : String
  status : String
  deriving Repr

def researchGates : List ResearchGate := [
  ⟨"RH_GLOBAL_BRIDGE", "A new global bridge proving classical RH", "RESEARCH OPEN"⟩,
  ⟨"BSD_UNIVERSAL", "BSD for all relevant elliptic curves", "RESEARCH OPEN"⟩,
  ⟨"YM_CONTINUUM", "Nontrivial continuum quantum YM with a positive gap for general G",
    "RESEARCH OPEN"⟩,
  ⟨"PRISM_COMPARISON_IMPLEMENTATION", "Implement known comparison hypotheses and adapters",
    "MODEL DEVELOPMENT"⟩
]

end MathScope.M0.Open
