# Original live Picard tail through order five

## VERIFIED

The archived original compiler regenerated all ten persisted Picard
systems. Its runtime registry matches the authenticated original
7,358,162-record N4 export. The independent Python check compares the
first 130,348 regeneration nodes and every retained original scalar
operand against the archive. It also pins the C88 typed recurrence check
for the exact same ten systems.

The original `actualOrderInductionTail` entry point processed 260
requests, covering the actual and auxiliary families at orders 1–5,
eta derivative orders 0–12, and precision targets 128 and 256 bits.
The verifier reads each \(C,s,a^2,K_{\rm condition}\) directly from
the original registered coefficient row, including the actual/auxiliary
choice of radial endpoint and the bootstrap eta strip. It reads the
positive remainder, its Cauchy factor and both competing integer bounds
from the returned native AST. The 240 requests with \(m>0\) reject the
wrong Cauchy factor \(m!s^{-m}\) in an exact structural control.

| Native system | Kind | Original \(C\) | \(s\) | \(K_{\rm condition}\) |
| ---: | --- | ---: | ---: | ---: |
| 0 | actual 1 | 24818 | 24807 | 24825 |
| 1 | auxiliary 1 | 117190 | 117103 | 117202 |
| 2 | auxiliary 2 | 117775 | 117678 | 117787 |
| 3 | actual 2 | 118568 | 117678 | 118577 |
| 4 | auxiliary 3 | 120947 | 120822 | 120959 |
| 5 | actual 3 | 121892 | 120822 | 121901 |
| 6 | auxiliary 4 | 124023 | 123872 | 124035 |
| 7 | actual 4 | 125092 | 123872 | 125101 |
| 8 | auxiliary 5 | 127420 | 127243 | 127432 |
| 9 | actual 5 | 128610 | 127243 | 128619 |

## Exact dominance at the original source parameters

The same exact profile has
\[
T=e^{1048576}+10,\quad h=e^{-8002T},\quad
\sigma_*=\frac{h^4}{2000},\quad \rho=\frac{\sigma_*^2}{65536},\quad
Q=\frac{2^{260}e^{4T}}{\sigma_*^2},\quad
\Lambda=Q^{64},\quad X_a=\frac4\Lambda,\quad
\delta=\frac{\rho}{1024Q}.
\]
Thus \(0<h,\sigma_*,\rho,t_1<1\) and \(Q,\Lambda>1\). The original
\(C_{\rm Selected}=e^{10\log(1+Q^{300})+Q^{200}}\) gives
\(t_1=C_{\rm Selected}^{-120}<1\).
The actual radial domain has \(a^2=X_a e^{t_1/16}\).
The auxiliary domain has \(a^2=(6+2^{-(n-1)})/\Lambda\).
Both satisfy \(a^2\ge4/\Lambda\).
The original \(s=\delta/8\) in the actual bootstrap and
\(s=\delta/(8\cdot256^n)\) in all other rows gives \(0<s\le1\).

At the actual bootstrap, the verified \(B=4096\Lambda^2Q^3/t_1\)
and \(C=2^{18}B^2/\delta^2\) imply \(C\ge\Lambda^2\).
For every higher actual row \(H_0=\max(1,B)\ge\Lambda^2\).
The auxiliary row has \(H_0=\max(1,B_0)\) with
\[
B_0=64Q(1+g_{\rm bound})
\max\!\left(1,\frac{2\Lambda^2}{(8-r_n)^2}\right)
\ge32\Lambda^2,\qquad r_n=6+2^{-(n-1)} .
\]
The recorded matrix bound is at least \(512H_0\) and all forcing caps
are nonnegative, so every \(C\ge\Lambda^2\). These are inequalities
for the source's explicit *bound expressions*. The ordinary
coefficient-norm hypotheses are separately tracked below.

For \(P_m=m!(2/s)^m\), the live native producer returns
\[
K=\max(1,K_{\rm condition},K_{\rm precision}),\quad
K_{\rm condition}=\left\lceil\frac{72C^2a^2}{s}\right\rceil,\quad
K_{\rm precision}=
\left\lceil\frac{b\log 2+\log(\max(1,P_m))}{\log 4}\right\rceil .
\]
The unrounded condition threshold is at least \(288\Lambda^3/s\).
Because \(m!\le16^m\), \(P_m\ge1\), \(\log2\ge1/2\) and
\(\log(1/s)\le 1/s-1\), the precision threshold before rounding is
at most \((b/2+7m/2)/s\le170/s\) for \(0\le m\le12\) and
\(b\le256\). The gap exceeds one. Therefore the actual symbolic
integer is exactly \(K_{\rm condition}\) for all requests.
The original standalone \(n=1\) registered \(K=\texttt{\#24835}\)
uses a distinct historical precision formula. Its source operands
and stronger \(2304/\delta\) lower threshold give the same dominance.

Since \(K_{\rm condition}>\Lambda^3>e^{768T}>2^{768T}\),
its bit length exceeds \(768\cdot2^{1048576}\). This lower bound
uses the exact profile and needs no decimal evaluation of \(K\).

## CONDITIONAL ordinary tail

For every requested row, \(K\ge K_{\rm precision}\) gives
\[
\log P_m-K\log4\le-b\log2,\qquad
\frac{P_m 4^{-K}}3\le\frac{2^{-b}}3 .
\]
For the original standalone bootstrap, use
\(\log_2(m!)\le m^2\) and
\(\log_2(16/\delta)\le4+2/\delta\) in its retained precision formula.

Under the source's B.26 ordinary joins, original coefficient norms
and Cauchy strip assumptions, the C47/C54 convergence argument and C88
same-kernel recurrence transfer this exact symbolic tail to the
ordinary Picard remainder uniformly on each admitted fixed radial
domain and all \(\eta\in[-1,1]\), including the derivative order \(m\).
For the auxiliary radius the analytic argument uses its prescribed
complex radial disk and the original smaller eta strip.

## OPEN

The certified \(K\)-term value and associated arithmetic enclosure have
not been evaluated. Complete original physical-chart coverage and
arbitrary higher-order native materializations still have separate
requirements. Y, N7-06/N8-05, final jets and release receive no new
acceptance count. RELEASE HOLD.

## Replay

Use the original archived `mathscope-m2/navier` directory as RUNTIME
and the original `hosted-43055678022-N4/original-whole-k-current-pressure-graph`
directory as ARCHIVE. The final C88 native recurrence receipt is PRIOR.

```text
node --max-old-space-size=3072 replay_original_picard_tail.mjs RUNTIME ARCHIVE/original-source-functions.json NEW_LIVE.json
python -B verify_picard_tail.py --actual NEW_LIVE.json --archive ARCHIVE --prior PRIOR --out NEW_TAIL.json
```
