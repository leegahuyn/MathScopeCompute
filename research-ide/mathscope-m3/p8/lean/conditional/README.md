# Separate conditional audit

This demonstration assumes its literal arithmetic goal as `assumedTarget`.
The dependent theorem is therefore always **CONDITIONAL_ON_TARGET**. Its small
goal could be proved independently, but this demonstration deliberately does not
do so. It exercises the assumption ledger and actual source invalidation.

Run after the pinned parent Lake environment has been prepared:

```sh
python ../tools/audit_conditional_lean.py --output ../evidence/conditional-lean-audit
```

The command is run from `p8/lean`. It compiles the conditional module separately,
imports it freshly, and requires the precise custom-axiom closure containing only
`MathScope.P8.Conditional.assumedTarget`. It then deletes exactly that axiom line
from a copy of the source, leaves the dependent proof intact, and requires the
single unknown-identifier diagnostic from a new Lean process. Dependency errors,
crashes, missing imports, or unrelated syntax errors do not count as success.

`ConditionalLeanAudit/1` records the original and regenerated source hashes,
printed types/axioms, commands, logs, environment and separate import closure.
It never uses `LeanAudit/1`, never sets unconditional `customAxioms: []`, and
never issues independent proof authority. Actual CI execution is still required;
source generation and parser tests alone are not execution evidence.
