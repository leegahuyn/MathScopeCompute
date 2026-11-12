# Original N3 and N4 potential certificates on the physical reference slab

The Python replay authenticates the original diagonal exports and the two
independently checked Primary potential exports. It compares both retained
and first omitted scale expressions and the lower, upper and dyadic
reference operands across each export pair. It then checks the common
threshold and the \(b_3,b_4\) scale expressions across the original
N3 and N4 diagonals. Long original norm sums are walked iteratively.
For N4, 4,599,551 literal source records are common to the potential and
diagonal current exports, along with their used native definitions.

Write \(C=\ell_{\min}\), \(q_{\rm Big}=2^{-(C+10)}\).
The authenticated scale result gives \(b_3q_{\rm Big}=32\),
\(b_4q_{\rm Big}=64\). The actual N4 selector includes the term
\(\log 2+\log b_4\) in the maximum for \(\log b_5\), so \(b_5\ge2b_4\).
The original reference window starts at the maximum of \(\ell_0=C+6\)
and \(\lfloor\log_2 b_N\rfloor\), with upper endpoint
\(\lfloor\log_2 b_{N+1}\rfloor-1\).

| Physical \(q/q_{\rm Big}\) | Certificate | Reference label | \(s=q/Q\) | First omitted product |
| --- | --- | --- | --- | --- |
| \([1/64,1/32]\) | N4 | \(C+16\) | \([1,2]\) | \(b_5q\ge2\) |
| \([1/32,1/16)\) | N3 | \(C+15\) | \([1,2)\) | \(b_4q\ge2\) |

For an active relative label \(\ell'\), \(s'=2^{\ell'}q>1/2\) and
\(\ell'\ge C+14\ge22\). On the original admissible representative box,
\(|s_{\rm rep}-s'|\le27/(\ell')^6\) gives
\(q_{\rm rep}/q>1-54/22^6>1/2\). The first omitted scale times
\(q_{\rm rep}\) is therefore strictly greater than one. The original
representative condition \(s_{\rm rep}<2\) also gives
\(q_{\rm rep}<q_{\rm Big}\). The lower face and the overlapping
intermediate reference face are included.

These are exact source window and cutoff checks. The application of the
potential estimate to the physical field uses the original smooth live
charts and representative premises. Its source FTC constants remain
symbolic. Numerical final-field integration, later correction stages, and
the 67 closed final jet intervals remain OPEN.

[Reference cover receipt](primary-reference-cover.json) · [N4 potential run](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43219547189)
