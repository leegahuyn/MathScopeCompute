# Strict native reference-bracket evidence with exact intervals

For the original slow inverse, set
`F(s)=s-Z² s^(2h)-T`, with positive reference scale and real
`0≤h≤1/16`. The original bracket endpoints are `1/2` and `2`.
The polynomial comparison `2(7/8)^8<1` implies

```text
7/8 ≤ (1/2)^(2h) ≤ 1 ≤ 2^(2h) ≤ 8/7.
```

A sufficient directed interval check uses the lower enclosure of
`T+(7/8)Z²` and upper enclosure of `T+(8/7)Z²`. The first must exceed
`1/2` and the second must be below `2`. This supplies strict signs
for the exact source endpoint expressions. With `T≥0`, the upper
test also implies `Z²<2`, hence on `[1/2,2]` the native derivative
`1-2h Z² s^(2h-1)` is greater than `1/2` and at most `1`.

For the nearest dyadic reference, the actual normalized coordinate s
lies in `[1/sqrt(2),sqrt(2)]`, contained in `[2/3,3/2]`. The
original coordinate equations give `T=s(1-eta²)` and
`Z²=s^(1-2h) eta²`. Since `s^(1-2h)` lies between s and one, the two
endpoint tests are convex averages of values with shared bounds.
The lower test is at least `7/12`; the upper test is at most
`12/7`. The Lean proof handles the exact real powers and inequalities.

For an increase of one in the reference label, the original physical
rescaling multiplies T by 2 and Z² by `2^(1-2h)∈[7/4,2]).
The decrease uses their reciprocals. The Python guard checks the
original label and either neighbor which is already in the allowed
coefficient window. It never extends the supplied window. It certifies
the known two (Z=0) cases at the adjacent labels: a T of 15/32 moves
to 15/16 at the next label, and a T of 5/2 moves to 5/4 at the preceding
label. Restricting the guard to the rejected old labels leaves both
cases unresolved. Ordinary T=1 and the physical time-zero case with
Z²=1 remain in their original label.

The check supplies a reference-admission condition for actual
input enclosures. The task still requires proving the chosen
window, actual evaluator ingress, all row-specific support
conditions and the common physical-field identity after reference
transport. The replay makes read-only checks and does not change the
operating reference selector.

```text
python -B check_reference_bracket_guard.py bracket-guard.json
```
