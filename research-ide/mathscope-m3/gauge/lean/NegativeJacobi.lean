import Init
abbrev V := Int × Int × Int
def badBracket (a b : V) : V :=
  (a.1*b.2.1-a.2.1*b.1, a.2.1*b.2.2-a.2.2*b.2.1, a.2.2*b.1-a.1*b.2.2)
def add (a b : V) : V := (a.1+b.1,a.2.1+b.2.1,a.2.2+b.2.2)
def e0 : V := (1,0,0)
def e1 : V := (0,1,0)
def e2 : V := (0,0,1)
-- This skew table is deliberately not a Lie bracket. Its Jacobi sum is
-- (-1,-1,-1), so kernel evaluation must reject the false zero certificate.
example : add (add (badBracket e0 (badBracket e1 e2))
  (badBracket e1 (badBracket e2 e0))) (badBracket e2 (badBracket e0 e1)) = (0,0,0) := by decide
