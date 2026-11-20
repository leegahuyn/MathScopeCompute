# A reference label with a certified bracket on a physical cell

An external caller gives a certified interval `[t_l,t_u]` for the
original physical coordinate `t=-log_2 q` and the inclusive range of
integer labels in one already verified coefficient window. The
normalized scale at reference label ell is `s=2^(ell-t)`. In this
form the caller can work with extremely large labels without ever
forming a denominator `2^ell`.

The worst log-distance on the cell is

```text
max(|t_l-ell|,|t_u-ell|) = (t_u-t_l)/2 + |ell-(t_l+t_u)/2|.
```

The nearest integer to the midpoint, clipped to the allowed integer
window, minimizes this value. Thus the algorithm finds an admissible
choice whenever any allowed label has worst log-distance at most
3/4 on the cell. Exact integer powers give
`(7/12)^4<1/8` and `8<(12/7)^4`, so for that chosen
label both s and `s^(1-2h)` lie in `[7/12,12/7]` under the original
`0≤h≤1/16`.

With the original `T=s(1-eta²)` and `Z²=s^(1-2h) eta²`, use
`(1/2)^(2h)≥7/8` and `2^(2h)≤8/7`. The two
endpoint expressions have lower bound `49/96>1/2` and
upper bound `96/49<2`, respectively. Therefore the original native
monotone bracket is strict on the entire physical cell. The original
derivative bound follows from the same upper inequality and `T≥0`.
This includes the extended 3/4 cover, rather than requiring the
nearest dyadic label before restricting to the original window.

The Python replay cross-checks the selected minimizer and its
admission flag against exhaustive exact comparisons for 13,124
interval cells. It also tests an original-window exclusion and
a translated very large integer label. The check requires the
physical q enclosure and coefficient-window proof as inputs. The
original externally selected reference and its full-field switch
still require a source execution with this admission.

```text
python -B verify_covered_reference_selection.py selection-replay.json
```
