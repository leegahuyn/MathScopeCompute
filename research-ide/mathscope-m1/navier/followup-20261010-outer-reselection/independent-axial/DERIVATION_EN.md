# Independent quantitative check of the replacement axial stage

This document checks one continuous region of a new explicit parameter
proposal. It does not identify that proposal with any previously generated
axis or joining data. It does not complete the pulse, corrected exterior,
global modulation, or final stress. The original nine acceptance gates are
not promoted by this document.

## 1. New exact parameters and domain

Use the literal A.2 schedule with

\[
M_d=2^{20},\quad T=e^{M_d}+10,\quad \log P_*=2T,\quad
\lambda=e^{-1000T},\quad h=e^{-8002T},\quad
c_o=1/256,\quad T_f=128.
\]

These are finite positive real expressions. Their definition does not
require constructing their decimal expansions. The accompanying JSON uses
an expression tree, not an underflowed floating-point value.

The domain of this check is every \(y\in[0,T]\) in the axial stage and every
\(\eta\in[-1,1]\). Its global radial coordinate is
\(\log(X/X_R)=1+y\). Pressure is defined by the exact unedited A.21 backward
integral for these parameters. The original source shows how future
pressure-neutral edits preserve this pressure before their support; this
document does not assert that their exact correction roots have been built.

Write
\[
s=\eta^2,\ d=1-s,\ D=\tfrac12-h,\ A=\tfrac12+h,\
L=1-2hs,\ f=(1+s)^{-1},\ J_0'=2\eta/(1+s).
\]

The explicit choices imply \(T>11\), \(0<h<1/100\),
\(h e^T<1/48\), and \(0<\rho=c_oh<1/1000\).
For example \(h e^T=e^{-8001T}\), and
\(e^{8001T}>1+8001(11)>48\). This uses exact monotonic inequalities.
It does not assert that these few inequalities settle every later
"sufficiently small" requirement in the paper.

## 2. Smooth-step and angular lower bounds

The derivative of the exact flat step is
\[
\sigma'(t)=\sigma(t)(1-\sigma(t))
 \left(2/t^3+2/(1-t)^3\right).
\]

The included checker covers the entire half interval \([0,1/2]\) with 256
closed cells using outward dyadic intervals. Its first endpoint cell uses
the analytic majorant \(4t^{-3}e^{4-t^{-2}}\); that majorant is increasing
on the cell, so the positive right endpoint bounds the whole collar.
Exact symmetry covers the other half. This proves \(\|\sigma'\|_\infty<9\)
without interpreting a sampled maximum as a supremum.

Consequently the axial schedule has
\[
0\le k\le4,\qquad |k'(y)|\le\frac{e_d}{1+y},\qquad
e_d=\frac{36}{M_d}.
\]

Formula A.25 gives, uniformly in eta,
\[
Q_{\rm ref}\ge\frac{9/5-(29/5)h}{8/5}>1.
\]

During the initial unit transition its source is at least \(-h\) and the
linear coefficient is between 1 and \(8/5\). Variation of constants gives
\[
Q_{\rm start}\ge e^{-8/5}-h>\frac15-h\ge\frac16.
\]

The strict bound \(e^{8/5}<5\) is verified by a rational Taylor sum with its
entire positive remainder bounded by a geometric series.

On the axial interval A.26 gives
\[
Q'+Q\ge-h+\frac{49}{100}s.
\]

Set \(z=e^{-y}\). Thus
\[
Q\ge z/6+\bigl((49/100)s-h\bigr)(1-z).
\]

The multiaffine expression
\[
z/6+(49/100)s(1-z)-(s+z)/12
\]

is nonnegative at all four corners of \([0,1]^2\), hence throughout that
square by bilinear interpolation. Moreover \(h\le z/48\). Therefore
\[
\boxed{Q\ge(s+z)/16>0.}
\]

This proof includes eta zero and the two angular endpoints.

## 3. Exact moment formula and the pressure tail

The amplitude on this stage is
\[
E^2=P_*^2 f^2 e^{-2/5-y}\ge\tfrac14e^{3T-2/5}
 \ge e^{2T}.
\]

The last inequality follows from \(e^{T-2/5}>4\), valid already for
\(T\ge11\). There is no large-exponential numerical evaluation here.

Let \(\bar k,\overline{k^2}\) be the exact exponentially weighted moment
averages, with the reference inner contribution included. Then
\[
0\le\bar k\le4,\quad0\le\overline{k^2}\le16,\quad
W=1-L\bar k,\quad |W|\le3.
\]

The exact energy primitive ratio is
\[
R_E=e^{-3/5}(5/6+C)+y,\qquad
C=\int_0^1 e^{(6/5)t-(6/5)\int_0^t\sigma}\,dt .
\]

Positivity and \(e^{6/5}<4\) imply \(0\le R_E<5+y\).

All later unedited slopes are at most \(-1/2\). The angular interpolation
decreases the amplitude factor from f to \(1/2\), and its angular exponent
stays in \([0,1]\). The terminal flat factor changes a squared tail ratio
by at most \((1-\rho)^{-2}\). The exact infinite backward pressure therefore
satisfies
\[
|\Pi|/E^2\le\frac1{2(1-\rho)^2},\qquad
|\Pi_\eta|/E^2\le\frac{2|\eta|}{(1-\rho)^2}.
\]

No finite radial truncation is substituted for this tail.

### Existence of the terminal waiting interval in that schedule

The terminal schedule itself must be well defined before its backward
pressure can be used. This can be checked for the new explicit parameters
without solving either of the later moment-correction root problems.

First, \(T_f=128\) gives the required profile-interpolation slope bound
\(9\log(2)/128<9/128<1/10\). For the terminal flat factor,
\[
0\le f_o'/f_o\le
\frac{9h}{512(1-h/256)}
\le\frac{150}{8533}h<h/4.
\]

Hence \(0<1+l<1\) on that last transition. The target in A.13 is
\[
Q_p=\int_0^3
\exp\!\left(\int_0^v(1+l(s))\,ds\right)
\frac{f_o'(v)}{f_o(v)}\,dv .
\]

It is strictly positive because \(f_o'\) is positive on the open
transition. Integration of the logarithmic derivative and \(e<3\) give
\[
0<Q_p<27[-\log(1-\rho)]
\le\frac{27\rho}{1-\rho}
\le\frac{900}{8533}h<0.001055.
\]

The scalar Q used to specify the preceding waiting time starts at
\((\lambda-h)/(1-\lambda)>0\) at the exterior transition. On the unit
transition to \(l=-1\) its source \(-l-h\) is nonnegative, so it stays
positive. The hold at \(l=-1\) for \(4\log(1/h)\) then gives
\(Q\ge4(1-h)\log(1/h)\). On the next unit transition to \(l=-h\),
its source is again nonnegative and its linear coefficient is at most 1.
At the start of the wait this proves
\[
Q_{\rm before}>
\frac{4(99/100)\,8002\,(11)}3=116189.04>Q_p .
\]

Thus the exact waiting time
\[
T_{\rm wait}
=\frac{\log(Q_{\rm before}/Q_p)}{1-h}
\]

is positive, finite, and independent of eta. The defining Q here is the
scalar equation used by A.2 to prescribe the exterior schedule. No claim
is made that an uncomputed angular correction already has its required
moment. The unedited E schedule and its A.21 pressure integral are
nevertheless well defined, since E is independent of the pulse amplitude
and of the omitted pressure-neutral correction.

### Reconstructing the axial numerator

The exact B.35 combination reduces to
\[
\frac{N_s}{E^2}
=\frac{-Wk\eta+4h\eta^3\overline{k^2}
       -2d\eta\overline{k^2}}{E^2}
+(-2h\eta-dJ_0')R_E
+4A\eta\frac{\Pi}{E^2}-d\frac{\Pi_\eta}{E^2}.
\]

In this linear-in-eta axial profile, \(M-\eta M_\eta=0\) exactly. In
particular, the \(-WU\) term has not been divided by an extra X.

The three parts above have absolute bounds
\[
\frac{44+64h}{E^2}|\eta|<|\eta|,\qquad
3|\eta|(5+y),\qquad
\frac{2A+2}{(1-\rho)^2}|\eta|<7|\eta|,
\]

respectively. The first inequality follows already from
\(E^2\ge e^{22}>1+22+22^2/2=265\).
Consequently
\[
\boxed{|N_s|/E^2\le24|\eta|(1+y).}
\]

Combining this with the Q bound yields
\[
|b_sw|=\left|\frac{2k'\eta(N_s/E^2)}Q\right|
\le768e_d\frac{\eta^2}{\eta^2+e^{-y}}
\le\frac{27}{1024}<\frac1{32},
\qquad
\frac{b_s^2}{a}\le2e_d^2,\quad a=2 .
\]

## 4. A concrete threshold for the actual relaxed cone

It is necessary to connect the ratio inequalities to actual cone
membership. Set
\[
c=1-b_sw/a,\quad j=w+b_s/a,\quad v=a+b_s^2/a,\quad
\delta=2-2b_sw-b_s^2/a-(a-2)w^2.
\]

Clearing the positive denominator \(a^3\), the checker compares every
coefficient of the exact polynomial identity
\[
G:=2c^2-(v-2)j^2=(v/a)\delta .
\]

Uniform bounds for this axial stage are
\[
c\ge c_{\min}=63/64,\quad c\le c_{\max}=65/64,\quad
v\le V=65/32,\quad G\ge g_{\min}=31/16.
\]

For \(P=p_{s,1}>0\), \(P_c=Pc\), and \(J_c=Pj\), choose
\[
P\ge\max\left\{\frac{V+2}{c_{\min}},
                  \frac{8c_{\max}V}{g_{\min}}\right\}.
\]

Then \(P_c\ge V+2>\max\{2,v\}\), and
\[
\frac{2(P_c-v)^2-(v-2)J_c^2}{P^2}
=G-\frac{4cv}{P}+\frac{2v^2}{P^2}
\ge g_{\min}/2>0.
\]

Both thresholds are below 9: they are \(86/21\) and \(4225/496\).
Thus \(P\ge9\) suffices. Since
\[
p_{s,1}=\frac{XQ}{L}
\ge\frac{X_R e}{16}>\frac{X_R}{8},
\]

the simple later condition \(X_R\ge128\) implies \(p_{s,1}>16>9\).
Lemma 4.5 now proves the actual relaxed cone throughout this axial region.
It proves the admissible cone at points where \(v>2\).

**At eta zero, and wherever \(k'=0\), the present axial stage has \(v=2\).**
Therefore this result is not a strict admissible-cone certificate at every
axial point. The later modulation requirement is retained.

## 5. Reproduction and limits

Run verify_axial_bounds.py with Python 3.12+ from any working directory.
It requires the preserved sibling outward interval module and otherwise
uses only Python's standard library. It writes the exact scalar checks,
all 256 cell enclosures, source hashes and explicit parameter expressions
to independent-axial-certificate.json.

The original cone algebra and the interval identities used here are
analytic derivations checked alongside executable exact arithmetic. They
have not been instantiated as an original Lean analytic theorem.

The complete outer pulse and its two-moment correction, the angular
pressure-preserving correction, the heat replacement, the new A.21
axis/prefix, same-source matching, global modulation and final support
remain separate obligations. This result does not set any uncomputed
matching residual to zero or claim a completed original acceptance gate.
