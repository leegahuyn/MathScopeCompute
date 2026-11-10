# Independent current review: original axial row bridge

Reviewed the current source files by exact bytes:

* `check_source_row.py`: SHA-256 `f395c3cd818aa1ac4becd77ef68903bd144ae2da50e7496afa967565c54b8925`.
* `source-row.json`: SHA-256 `40193582bf3701a2dd8a40e95ba70aa426f5688024f02bdb3ac73dedec3df4c9f`.
* `README.md`: SHA-256 `7a05e2d6c2b5c2449df7192889b315ad2bbb3e399619f1cf68713190b7e74f9c`.

An independent normal-mode run against the packaged original graph completed
with exit code 0 and the generated JSON was equal to the saved `source-row.json`
after parsing. It scanned 4,420,257 nodes and checked the graph and registry
SHA-256 values. Optimized `python -O` exited with code 1 at the explicit
`__debug__` guard before creating output. This matters because the checker uses
Python assertions for mandatory checks.

The exact structural projection matches the actual stress producer's eight
terms and the six entries in each of A0 and A1 row 5 plus the forcing. The two
specified altered-coefficient controls produce nonzero symbolic remainders.
The result also checks the source graph's order-one v1-factor expression and
the Picard pressure row. The label correction is consistent with the producer:
source node #29440 is `v1`, while the radial profile coefficient is
`V1 = X * v1`. The internal SymPy atom still named `V1` represents the factor
and is multiplied by X in the raw residual; the JSON labels it `v1_factor`.

The identity comparing the two actual AST projections is valid under the
recorded substitutions: `xi != 0`, `L != 0`, `X=xi^2`, the chain rules,
equality of actual and Picard leading fields and needed derivatives, equality
of the lower-viscosity operands, `Pi_X=2 F0 F1 - Omega/2`, and the source
average/eta-derivative relation used for v1. All participating operands must be
defined in a real smooth interpretation. The source-node-to-derivative aliases
are hypotheses, not proved by the projection. At xi=0, dividing by xi is not
valid and a separate axis limit is necessary.

Thus the checks substantiate conditional algebraic source correspondence; they
do not establish actual Picard convergence or ODE satisfaction, all native
arguments, pressure and average identities, cutoff boundary jets, or the
integral moment itself. `#672` and global/all-order cancellation remain OPEN.
