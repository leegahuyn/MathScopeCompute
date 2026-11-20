# Original coefficient-window transition at the nearest-reference seam

Write $t=-\log_2 q$ and let the old upper reference label be $j$, so
the native window rule gives
$j=\lfloor\log_2 b_{N+1}\rfloor-1$.
The next integer $j+1$ belongs to the following source window, when
that window is available from the same original family. The native
monotone scale sequence gives

$$
\log_2(b_nq)\ge j+1-t>1/4
\quad (n\ge N+1, j+1/4<t<j+3/4).
$$

In this open overlap both old and new slow charts are strict and every
added coefficient cutoff is zero with all derivatives. This includes
the actual radial term `sigma*chi'` and the weighted covariance
targets. Use the original coefficient prefix and the same physical
$q,X,\eta$ for the other terms. The claim covers original background
and target contributions. Equality of all Repeat corrections and
native indexed field applications across the new producer remains a
separate obligation.

After choosing an absolute reference label, select the original
coefficient window containing it. A larger prefix can satisfy the
upper window inequality and fail the lower one. The replay checks
both integer bounds for every assignment.

```text
python -B verify_original_window_transition.py --runtime ORIGINAL_RESEARCH_IDE --out window-transition.json
```
