# Independent review of the corrected post-pulse and exterior estimates

This review covers sections 8–11 of OUTER_DERIVATION.md and the exact
matrix-normalization and dependency-order observations below. It is
conditional on the exact correction roots and pulse bounds in sections
5–7. It does not replace their separate independent audit.

The source is A.11, A.16–A.18, A.23, A.31, formula 4.16 and Lemma 4.5
in the user-provided paper. The complete source hash is
0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f.

The independently reviewed, corrected derivation has SHA-256
ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81.
The accompanying checker refuses to attach this review to different
derivation bytes. Its 21 rational checks support the written argument;
they do not independently prove the differential identities.

## Post-pulse moment and pressure bounds

Assume the exact roots have supplied \(U=M=J=0\) after the pulse,
\(S(\infty)=0\), and the exact pressure-neutral angular edit. Then
\[
S(X)=\tfrac12\int_X^\infty E(X')^2\,dX'
\]
is an identity. It is not a statement that a computed small residual is
zero. The same identity may be differentiated in eta: the finite
interpolation interval is smooth, and the infinite exterior is independent
of eta after the reset.

Set \(q=XE^2\). Before release, \(q'\le-\lambda q\), since
\(l\le-\lambda/2\). The future release integral is at most \(2q_{\rm rel}\).
Thus
\[
\frac{S}{X}\le \frac{E^2}{2}(1/\lambda+2)
\le E^2/\lambda \qquad(\lambda\le1/2).
\]
The bound \(|\partial_\eta\log E|\le2\) gives
\[
\frac{|S|+|S_\eta|}{X}\le5E^2/\lambda<8E^2/\lambda.
\]
All future \(l\) are negative, including the edited intervals and the
terminal flat factor. Hence the actual continuous backward integral gives
\[
|\Pi|\le E^2/2,\qquad |\Pi_\eta|\le2E^2.
\]
Substituting these bounds into 4.16, with \(4h<1\) and \(A\le51/100\),
gives
\[
|N_s|\le(8/\lambda+151/50)E^2.
\]
The inherited lower barrier \(Q\ge\lambda/8\) then yields
\[
|w|\le(64+(604/25)\lambda)E/\lambda^2
<128E/\lambda^2.
\]
This is an independent route to the stated coefficient 128.

The source lower barrier itself is valid: the post-pulse source is at
least \(\lambda-h-\lambda/8\), whereas the value of
\((1+l)(\lambda/8)\) is at most \(\lambda/8\). Thus the vector field
points strictly upward at that lower boundary. The assumption
\(Q\ge\lambda/8\) at pulse end is retained from section 7.

## Exterior release and terminal interval

The following energy estimate uses only the already fixed E schedule and
the angular reset. It does not use the pulse amplitude root, M=J=0, or
S(infinity)=0. It may therefore be used in the earlier total-S root
argument without a circular dependency. The later moment formulas in
this review do require those exact roots, as stated above.

The first unit interval contributes at most \(q_{\rm rel}\) to
\(\int q\,dy\); the steep hold contributes at most \(q_{\rm rel}/2\).
At its end \(q\le q_{\rm rel}h^8\). The following unit interval contributes
at most \(q_{\rm rel}h^8\), and all later slopes satisfy
\(l\le-3h/4\). The remaining infinite integral is therefore bounded by
\((2/3)q_{\rm rel}h^7\). This proves
\[
\int_{\rm release}q\,dy
\le q_{\rm rel}(3/2+h^8+(2/3)h^7)<2q_{\rm rel}.
\]
Independently, the amplitude at the end of the steep hold is at most
\(e_{\rm rel}h^6\); these two distinct exponents must not be interchanged.

At release the reset supplies
\(Q_0=(\lambda-h)/(1-\lambda)\ge3\lambda/4\).
During the first transition put \(\mu=-l\in[\lambda,1]\).
At \(Q=\lambda/2\) the derivative is
\[
\mu-h-(1-\mu)\lambda/2
\ge\lambda/2+\lambda^2/2-h>0.
\]
The hold only increases Q. The later flattening and waiting interval
retain the lower bound \(c_oh\). On terminal coordinates \(y\le1/2\),
A.16 gives that lower bound directly by dropping its positive exponential
factor and integrating \(f_o'/f_o\) over \([1,3]\). It would be
insufficient merely to multiply a lower bound for \(Q_p\) by a decaying
exponential; A.16 is the needed argument.

The exact eta-independent exterior moments give
\[
N_s=2\eta\int_0^\infty(he^s-A)E(y+s)^2\,ds .
\]
Using \(E(y+s)^2\le E(y)^2e^{-(1+3h/2)s}\), its absolute value is at most
\[
2(2/3+51/100)E^2<3E^2.
\]
Consequently the two bounds
\[
|w|\le6e_{\rm rel}/\lambda,\qquad
|w|\le768e_{\rm rel}h^5
\]
apply before and after the steep hold, respectively. With
\(e_{\rm rel}\le\lambda^{100}\), both are below \(1/100\).
This review does not extend the claim past the first half-unit of the
terminal interval to its zero-Q endpoint.

## Actual common stress threshold

The constants
\[
c_{\min}=1/3,\ c_{\max}=2259,\ V=116,\ g_{\min}=1/4
\]
are sufficient if the earlier pulse bounds hold. At the pulse,
\(a-bw>5/4\), \(2<a<3\), \(|b|\le15\), \(|w|\le301\), and the
second ratio gap exceeds \(1/4\). These give
\[
c>5/12>1/3,\quad c<2259,\quad v<115.5<116,\quad G>1/4.
\]
On the other stages \(b=0\) or the stronger axial bounds apply.

The exact threshold construction of Lemma 4.5 gives
\[
P\ge\max\{(V+2)/c_{\min},8c_{\max}V/g_{\min}\}<2^{24}.
\]
For the chosen reference start \(x=e^{-8}\), the smallest stated radial
lower bound is bounded below by \(3^{-8}\). The remaining stage-specific
bounds in section 10 are larger. Thus \(X_R\ge2^{40}\) really does imply
\(p_{s,1}>2^{24}\); checking only the ratio inequalities would not have
been sufficient.

## Complex pressure bound

The unedited E has the form \(c(y)f(z)^{\theta(y)}\) with real
\(0\le\theta\le1\). On the open strip around the real axis,
\(\operatorname{Re}(1+z^2)\ge255/256\) for
\(|\operatorname{Im}z|\le1/16\). A consistent analytic logarithm exists,
and \(|f(z)^\theta|\le256/255\). The real eta-zero mass bound then gives
\[
|\Pi_0(z)|\le4(256/255)^2P_*^2<5P_*^2.
\]
Disks of radius \(1/32\) centered at both real endpoints also lie inside
this domain when its real projection is extended as stated in section 11.
Cauchy's estimate therefore gives \(5P_*^2k!32^k\) for every fixed k.
The argument does not use a disk that exits a truncated real strip.

## Corrections requested during review

The pulse inverse's first row requires the upper numerator
\(2(11/10)3\), rather than \((11/10)(1+3)\). The intended
\(4/\lambda\) inverse bound remains valid with the corrected numerator.
The reviewer notified the producer of this correction.

The amplitude root uses the total exterior energy, so the construction
order should fix the angular reset and terminal wait before selecting
that root. The dependencies are acyclic; a numbered execution order
should display them correctly. The reviewer also requested that
\(1+l\ge9/10\) on interpolation be justified using the actual bound
\(\lambda+9/128<1/10\), rather than only \(l\ge-\lambda-1/10\).

All three corrections are present in the reviewed revision pinned above.

This review does not assert that all earlier differential bounds have
been formalized in Lean. It does not instantiate a new exact B.2 axis,
attach B.8, select a global C.12 frequency, or close any original gate.
