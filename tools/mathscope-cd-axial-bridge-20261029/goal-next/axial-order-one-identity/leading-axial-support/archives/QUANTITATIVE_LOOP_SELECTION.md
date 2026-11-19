# An explicit variance bracket for the original C.1 shear loop

## Scope

This note replaces the finite-cover selection of the variance bracket in
the supplied Appendix C.1 with an explicit sufficient bound. It uses the
same exponential loop, exact mean, variance equation, and circle
reparametrization as the source. It does not assert that the new complete
axis-to-outer profile has already supplied the input bounds listed below.
No finite modulation frequency or full-profile certificate is issued here.

The paper is the supplied 166-page file with SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The source anchors are equations (C.4)-(C.10), pp.159-160, and the
four-component cone map (4.35), p.38.

## 1. An elementary uniform variance lower bound

Let the average be normalized Lebesgue measure on one circle, put

\[
 M(z)=\langle e^{z\sin\theta}\rangle,
 \quad R(z)=M(2z)/M(z)^2,
 \quad V(\mu,p)=\frac{d_0^2}{p^2}\{R(\mu p)-1\},
\]

with the continuous value \(V(\mu,0)=d_0^2\mu^2/2\).
For every real \(z\),

\[
 R(z)-1\ge
 \begin{cases} z^2/4,& |z|\le1,\\
 \sqrt{|z|}/64,& |z|\ge1.
 \end{cases}                                                   \tag{1}
\]

**Small arguments.** Write \(X=\sin\theta\). By symmetry and the
positive exponential series,
\(\langle Xe^{zX}\rangle\ge z/2\) for \(z\ge0\).
Cauchy-Schwarz and \(\langle X^2\rangle=1/2\) therefore give
\(\operatorname{Var}(e^{zX})\ge z^2/2\).
Also

\[
 M(1)=\sum_{k\ge0}\frac1{4^k(k!)^2}
 \le\frac54+\frac{1/64}{1-1/36},\qquad M(1)^2<2.
\]

The geometric tail bound uses the decreasing ratio
\(1/[4(k+1)^2]\) for \(k\ge2\). Dividing the variance by
\(M(z)^2\le M(1)^2<2\) proves the first line. Evenness covers
negative arguments.

**Large arguments.** For \(z\ge1\), the integral
\(M(z)=\pi^{-1}\int_0^\pi e^{z\cos\theta}\,d\theta\) and
\(\cos\theta\le1-2\theta^2/\pi^2\) imply

\[
 M(z)\le \frac{\sqrt\pi}{2\sqrt{2z}}e^z,
 \qquad M(z)^2<\frac{e^{2z}}{2z}.
\]

The cosine inequality follows from the chord lower bound for
\(\sin(\theta/2)\) on \([0,\pi]\).
On \(0\le\theta\le1/\sqrt z\),
\(\cos\theta\ge1-\theta^2/2\); hence

\[
 M(2z)\ge\frac{e^{2z-1}}{\pi\sqrt z}
 >\frac{e^{2z}}{12\sqrt z}.
\]

Here only \(e<3\) and \(\pi<4\) are used. Thus
\(R(z)>\sqrt z/6\). For \(z\ge144\), this gives
\(R(z)-1\ge\sqrt z/12\).
On \([1,144]\), strict increase of \(R\) (the variance identity
for \((\log M)''>0\), as in (C.6)) and the small-argument result
give \(R(z)-1\ge1/4\ge\sqrt z/48\). Both estimates imply (1).

It follows that

\[
 V(\mu,p)\ge
 \begin{cases}
 d_0^2\mu^2/4,& |\mu p|\le1,\\
 d_0^2\sqrt\mu/(64|p|^{3/2}),& |\mu p|\ge1.
 \end{cases}                                                   \tag{2}
\]

The second branch is not used at \(p=0\).

## 2. A single finite bracket, without an unspecified compact cover

Suppose the fixed whole-domain source bounds give
\(a\ge a_->0\), \(|p_{s,2}|\le P\), and \(d_0>0\).
The exact positive expression

\[
 \boxed{\mu_{\max}=1+
 \frac4{d_0\sqrt{a_-}}+
 \frac{2^{16}(1+P)^3}{a_-^2d_0^4}}                            \tag{3}
\]

satisfies
\(V(\mu_{\max},p)>4/a_->3/a_-\) for every \(|p|\le P\).
Indeed, in the first branch of (2) the second term of (3) suffices.
In the second branch its third term gives
\(\sqrt\mu>256(1+P)^{3/2}/(a_-d_0^2)\), which suffices as
well. This proves the bracket used in (C.7) for the exact variance
equation \(V=\rho/a\), since \(0\le\rho<3\).

This expression remains finite even when the source bounds are represented
by nested exponentials. It is not a machine float and is not replaced by
infinity. It does not solve a different moment equation.

## 3. A uniform simple-root estimate, including zero variance

Set \(Z=\mu_{\max}P\), and use the smooth signed square root
\(W(\mu,p)\) of \(V\), odd in \(\mu\). On \(\mu\ge0\),
\(W=\sqrt V\). The tilted density satisfies
\(e^{z\sin\theta}/M(z)\ge e^{-2|z|}\), so

\[
 (\log M)''(z)=\operatorname{Var}_{z}(\sin\theta)
 \ge\tfrac12 e^{-2|z|}.
\]

This follows by bounding the density below before minimizing
\(\langle(\sin\theta-c)^2\rangle=1/2+c^2\) over \(c\).
For \(0<\mu\le\mu_{\max}\), \(|p|\le P\), differentiation
of the exact expression for \(V\) gives

\[
 V_\mu\ge d_0^2\mu e^{-4Z}.
\]

The exact divided-difference formula in (C.5), using
\(|\partial_z(e^{z\sin\theta}/M(z))|\le2e^{2Z}\), gives
\(\sqrt V\le2d_0\mu e^{2Z}\). Consequently

\[
 \boxed{W_\mu\ge(d_0/4)e^{-6Z}>0.}                            \tag{4}
\]

At \(\mu=0\), the value is \(d_0/\sqrt2\), also satisfying
(4). This supplies a quantitative nonsingular implicit equation for
the smooth right side \(\sqrt\rho/\sqrt a\). The cutoff in (C.9)
makes \(\sqrt\rho\) smooth: where the cutoff is supported,
\(v_*-v_s\ge\delta_L/4\). Higher derivative estimates must still
include the actual derivatives of the source and of this cutoff.

## 4. Explicit choices for the loop's strict cone

The following are bounds on the fixed input over the **whole** rectangle,
not sampled estimates:

\[
 a\ge a_->0,\quad |p_1|\le P_1,\quad |p_2|\le P,\quad
 |t_s|\le T_s,\quad c_s-2\ge4d_0>0.
\]

Let \(m_c>0\) and \(m_q>0\) bound from below
\(c_s-v_s\) and
\(2(c_s-v_s)^2-(v_s-2)j_s^2\) respectively. The strict relaxed
condition implies their positivity, but a new source must supply the
actual quantitative lower bounds. Let \(m_\partial>0\) bound
\(v_s-2\) on fixed boundary collars.
Define

\[
 T_*=T_s+2d_0\mu_{\max}e^{2\mu_{\max}P},
 \quad J_*=P+P_1T_*,
\]

\[
 \delta_L=\min\left\{\tfrac12,d_0,
 \frac{4d_0^2}{1+J_*^2},\frac{m_\partial}{2}\right\}>0.       \tag{5}
\]

These choices also verify the full auxiliary family required by (C.8),
before solving the variance equation. At the test value \(v=2+\delta_L\),
every \(0\le\mu\le\mu_{\max}\) satisfies \(c-v\ge2d_0\) and
\[
 2(c-v)^2-(v-2)j^2
 \ge8d_0^2-\delta_LJ_*^2>4d_0^2>0.
\]
The exact quadratic cone test therefore gives
\(U(c(t),j(t))>2+\delta_L\) throughout that auxiliary family.

Use exactly the smooth cutoff and variance choice (C.9) with this
\(\delta_L\), solve (C.10) in the bracket (3), and apply the exact
circle reparametrization in the source. The loop has its prescribed
mean. Its four cone gaps are bounded below by

\[
 \boxed{\kappa_L=\min\left\{
 a_-,\frac2{1+T_*^2},\frac{\delta_L}{8},m_c,2d_0,m_q,4d_0^2
 \right\}>0.}                                                 \tag{6}
\]

To verify this, where the cutoff vanishes the loop equals the original
shear and \(v_s-2\ge\delta_L/4\). Where it is nonzero,
\(2+\delta_L/8\le v\le2+\delta_L/2\),
\(c(t)\ge c_s-d_0\ge2+3d_0\), and \(|j(t)|\le J_*\).
Thus \(c-v\ge5d_0/2\) and

\[
 2(c-v)^2-(v-2)j^2
 \ge\tfrac{25}{2}d_0^2-\tfrac12\delta_L J_*^2
 \ge\tfrac{21}{2}d_0^2>4d_0^2.
\]

Also \(a_L=v/(1+t^2)\ge2/(1+T_*^2)\). The cutoff regimes and
the unchanged boundary collars now prove (6).

## 5. Remaining concrete input

Equations (3)-(6) are explicit proved selection conditions for the original
loop. To apply them to the final new MathScope profile, the same completed
axis, continuation, B.8 repair, and heat-prepared outer field must provide
\(a_-,P_1,P,T_s,d_0,m_c,m_q,m_\partial\) and the derivative bounds
needed for the antiderivatives in (C.11). The new C.2 interval map supplies
the correction operator; its actual scaled modulation debt is not supplied
by this note. Choosing the final finite integer N and proving (4.26) over
the final annulus remain distinct tasks.
