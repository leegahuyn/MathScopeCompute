# Actual tail selection and the original pressure predicate

[Attempt 0001](attempts/0001/receipt.json) completed on the pinned original
Lean 4.34.0-rc2 kernel with exit 0 at 2026-10-09 23:36:08 UTC. It audits
seven declarations; each uses only `propext`, `Classical.choice`, and
`Quot.sound`. Both inventories contain the same 2,669 original tracked
files, and the original kernel digest is unchanged.

The input is the actual new clock from
`formal-input-producer/attempts/0012/SameDatumInputs.lean`. Its flattening
length is 128, its tail coefficient is 1/256, and its pressure is the
literal integral defined there. The canonical schedule is used only for
the release lag and release adjustment, whose formulas depend on the
same core parameters. Its different flattening and tail constants are
not substituted for the new ones.

Let `r=h/256`, `a=1-h`, and

\[
 q_* = \frac{1}{1-r}\int_0^3 e^{at}
        \frac r2\,\sigma'((t-1)/2)\,dt.
\]

The source proves `r/(1-r) <= q_* <= exp(3) r/(1-r)`, strict positivity,
and `q_* < exp(-2) h`. Consequently the selected logarithmic hold
`log(releaseLag/q_*)/(1-h)` is positive and satisfies its exact exponential
target equation. This is an exact real definition; the tiny positive
tail debt is never set to zero.

The positive hold locates every new transition to the right of the
ideal prefix. Thus the actual clock weight is exactly
`Pstar^2 exp(y/5)` and its shape exponent is exactly one for every
`y <= 0`. Together with the already proved actual admissibility predicate
and `Pstar >= 2`, these identities instantiate the original
`NaturalAxisData.pressureData_of_ideal_prefix`. The resulting theorem is
`MathScope.SameDatumInputs.newPressure_pressureData`.

The source SHA-256 is
`b57060e0a69edc0257f943f8268c4d54bdeeb0e3ef12ace89b97b01b5bde6092`.
The accepted `.olean`, complete log, input snapshot, runner snapshot, and
before/after inventories are retained in the attempt directory.

Run `python3 run_check.py` from this directory in the documented original
runtime to create a new numbered attempt. The runner does not overwrite
an accepted result. This component by itself does not assert completion
of the original finite-to-infinite N3-03 gate.
