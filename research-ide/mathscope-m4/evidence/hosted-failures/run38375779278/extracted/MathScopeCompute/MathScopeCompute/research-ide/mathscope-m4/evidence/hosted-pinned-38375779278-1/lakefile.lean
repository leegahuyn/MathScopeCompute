import Lake
open Lake DSL

package mathscopeM0 where

require mathlib from git
  "https://github.com/leanprover-community/mathlib4.git" @
  "d13f23b723b8a846827a245b89c10fc7d3f11612"

lean_lib MathScope
