# Independent review of the actual A.21 pressure tail

## Reviewed claim and exact sources

The post-axial tail argument in
`../followup-20261010-symbolic-gluing/PRESSURE_DATUM_INTERVAL.md`
is valid for the literal outer schedule and the actual pressure datum.
The reviewed revision has SHA-256
`8dfd40a7206871b425e69894ead0321fe6f476c338f0532739c1d055a920386d`.
This review checks its section 1 directly against the supplied source
paper, rather than treating a pressure approximation as the definition
of the datum.

The source paper has SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The exact axial formula is on p.129; the subsequent shapes and terminal
factor are on p.130; the complete A.21 definition and the pressure
preservation argument are on pp.133–134. The new parameter choices
are bound to `OUTER_DERIVATION.md`, SHA-256
`ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81`.

This is an independent continuous proof review of the tail. It does
not claim an independent rerun of the 1792-cell prefix quadrature.
That quadrature and its independent review have separate receipts.

## 1. The exact prefix and the whole axial interval

Set `P=exp(2T)`, `f(z)=(1+z^2)^(-1)`, and

\[
 \Sigma(y)=\int_0^y\sigma(u)\,du,\qquad
 R(y)=\exp(y/5-6\Sigma(y)/5).
\]

The inner reference has `E=P f exp(y/10)`, so its contribution to
`-Pi0/P^2` is exactly `(5/2)f^2`. On the first unit transition,
the literal slope is `l=(3/5)(1-sigma)`, whence
`(log E)'=1/10-(3/5)sigma` and `E^2=P^2 f^2 R`.
The identity `sigma(y)+sigma(1-y)=1` gives `Sigma(1)=1/2`.
Consequently the next interval begins at `P1=P exp(-1/5)`.

The source states **exactly**

\[
 E=P_1 f(z)e^{-s/2},\qquad 0\le s\le T.
\]

This formula holds throughout that interval while U decreases.
There is no angular interpolation on this stage. Its exact pressure
contribution is

\[
 \frac12e^{-2/5}(1-e^{-T})f(z)^2.
\]

Define

\[
 c_P=\frac52+\frac12\int_0^1R(y)\,dy+\frac12e^{-2/5}.
                                                        \tag{P1}
\]

The final summand replaces only the finite axial exponential by
its infinite continuation. It introduces the explicitly retained
omitted-tail term `(1/2)exp(-2/5-T)f^2`.

## 2. Uniform decay on every actual post-axial stage

As A.21 prescribes, omit the two E bumps whose total pressure
increment is exactly zero. Write the remaining tail as

\[
 E(s,z)=c(s)f(z)^{\theta(s)},\qquad
 c(0)=P\exp(-1/5-T/2),\qquad 0\le\theta\le1.
\]

The coefficient c and all stage lengths are independent of z.
Its logarithmic derivative is at most `-1/2` on every subsequent
stage:

* On the unit entry, the constant-slope interval and the pulse,
  `l<=0` and the angular factor remains f.
* During A.10, the additional coefficient
  `2^(-(1-theta))` decreases as theta decreases. Its contribution
  is `theta' log(2)<=0`; the remaining log derivative is
  `-1/2-lambda`.
* The uniform interval, both release transitions and the steep hold
  have `l<=0` and no parameter-dependent angular factor.
* On the terminal interval,
  `l=-h+fo'/fo<-3h/4<0`. Beyond it the exact power law has `l=-h`.

The azimuthal interpolation changes the coefficient continuously
at its endpoints, so the bounds integrate across the whole schedule.
The exact terminal wait may be very long, but it introduces no loss:
it also has `l=-h`. Thus

\[
 c(s)^2\le c(0)^2e^{-s},\qquad
 \int_0^\infty c(s)^2\,ds\le P^2e^{-2/5-T}.       \tag{P2}
\]

Neither a finite cutoff nor a numerical underflow is used in P2.

## 3. One analytic strip and the exact error identity

On the entire horizontal strip `|Im z|<=1/16`,

\[
 \operatorname{Re}(1+z^2)\ge255/256>0.
\]

The principal logarithm of `1+z^2` is analytic there. For the real
exponent `0<=theta<=1`,

\[
 |f(z)^{2\theta}|
   =|1+z^2|^{-2\theta}
   \le(256/255)^2<2.                              \tag{P3}
\]

P2–P3 are an integrable majorant uniform on this whole strip.
They prove both convergence of the actual tail and the analytic
interchange, with

\[
 \left|\frac1{2P^2}\int_{\rm post\text{-}axial}E(s,z)^2\,ds\right|
 <e^{-T}.
\]

The omitted infinite axial tail has the same strict bound by P3
with theta=1. Subtracting the two tails gives the identity

\[
 \boxed{\frac{\Pi_0(z)}{P^2}=-c_P f(z)^2+\mathcal E(z),
       \qquad |\mathcal E(z)|<2e^{-T}<2^{-1400}.}   \tag{P4}
\]

For the numerical last inequality, `M=2^20` and the positive
exponential series give `T=exp(M)+10>2^39>1024`.
Also `e>8/3`, and the exact integer comparison
`2(3/8)^1024<2^-1400` proves the bound. The much smaller exact
`2exp(-T)` remains available; P4 does not redefine it as zero.

Cauchy's estimate on each real-centered disc of radius 1/16
therefore bounds the order-k Taylor coefficient of the actual
error by `2^-1400 16^k`. The datum is even, so its odd Taylor
coefficients at zero vanish exactly. These facts justify using
an evaluated interval for cP to enclose finite coefficients of
the actual pressure. They do not identify a separate finite
nonlinear core array with its infinite fixed point.

## 4. Preservation through later smooth edits

The two omitted angular corrections satisfy exactly
`integral (E_new^2-E_old^2)/(2X) dX=0` by A.11.
The same real-parameter identity is one of the B.8 and I1
five-moment equations. The actual A.7 heat edit and I2 root
restore it together with the angular and energy moments.
Consequently the actual forward pressure starts at the same
Pi0 and equals the pressure normalized to zero at radial infinity
once those same-source corrections have all been attached.

It is not necessary to extend the later heat or smooth bump
coefficients to this complex strip. Their zero total pressure
increment is an exact identity for every real eta, and they
preserve the already defined analytic datum. On the interior
of an edit its cumulative pressure may change; only the common
datum and the restored cumulative value outside the edit are
claimed equal.

No blocking defect was found in the tail argument. Its scope is
the exact analytic datum and its uniformly bounded error. The
separate prefix quadrature, actual all-eta moment roots, axis
coefficient identification, and any claimed Lean verification
retain their own evidence requirements.
