# Native middle target through order eleven

The replay authenticates the same-body middle connection from historical calls #117773 and #117774, with bodies #117771 and #117772, to active bodies #17732694 and #17732695 at their original \(X,\eta\) arguments. It reproduces the original C9 positive recurrence, then extends the same four radial prefixes, \(M\), pressure and shear formulas. The shear and the angular derivatives of the moments use leading inputs through orders 11 and 12 for middle target orders 10 and 11, respectively.

Put \(D\ge1\) for a uniform bound on the needed ordinary \(F_0,U_0\) derivatives. The pure \(\eta\) derivatives of the integrands use the whole prefix \(0\le X\le X_b\). Radial differentiation of the prefixes uses the original fundamental theorem of calculus. In ordinary \(X,\eta\) variables the angular and axial caps are \(R_{\rm env}^{44}D^2\) and \(R_{\rm env}^{75}D^2\) respectively. The C100 fixed-label chart adds at most \(R_{\rm env}^{169}\), including the original \(s^{-A-1/2}\) multiplier. For \(\log D\le R_{\rm env}^{4096}\) this gives the stronger conditional physical cap \(\log\|T_{\rm bar}\|_{C^{11}}\le H/2^{256}\). The middle guard overlaps the native inner collar for \(u\in[1/8,1/4]\) and the outer collar for \(\delta\in[1/4,1/2]\).

## Leading pressure datum

The original signed pressure datum \(P_0\) includes every A.21 stage and both infinite tails. The exact scalar is \(K=P_\star^2<C_{\rm Selected}\). At \(\eta=0\) the normalized initial infinite contribution is 5 and the next integral is less than 2. The initial log amplitude starts at zero. Sigmoid symmetry makes it \(-1/5\) after the first unit interval. Each subsequent stage decreases the log amplitude by at least half its local distance, except that the final stage carries an extra bounded additive shift \(\log(f_o/(1-\rho))\). Since \(\rho<1/64\), its squared multiplicative factor is less than 2. The finite tail of the stage list and the retained infinite tail together contribute less than 2. Including the pressure prefactor gives \(\lvert P_0(0)\rvert\le9K/2\).

On every complex \(\eta\) disk of radius \(1/32\) centered at real \(\lvert\eta\rvert\le1\), the real part of \(1+\eta^2\) is at least \(1023/1024\). The original \(f^{2\theta}\) factors are analytic on that disk, have modulus at most \((1024/1023)^2<10/9\), and leave the real-semantics definition unchanged. Cauchy's estimate gives \(\lvert\partial_\eta^m P_0\rvert\le5K\,m!\,32^m\). Through order 12 this independently fits \(C_{\rm Selected}^2<R_{\rm env}\). The original pressure sign and all actual stages are retained.

The packet checks the source formulas and integer/rational inequalities. The middle attachment remains conditional on the whole-path \(F_0,U_0\) derivative envelope, the original physical chart, and the admitted fixed-label geometry. It does not evaluate higher native FTC integrals or stage energy.

~~~text
python -B verify_regular_middle_high.py --goal GOAL_NEXT --runtime ORIGINAL_RUNTIME --chart C100_CHART11_JSON --out regular-middle-c11.json
~~~
