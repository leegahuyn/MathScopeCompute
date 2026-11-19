# C86: actual n=1 whole angular moment

This bounded replay verifies source bindings and exact rational algebra. It does not by itself prove that the actual real integral #117072 is zero. The original leading-conservation proof is replayed separately by the parent task. No repository file, source graph, Git ref, or compiled Lean result is changed here.

## Verified source bindings

The authenticated same-live export is GitHub run 44582875351, 22,155,584 nodes, stream SHA256 `faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96`. Its original first 117100 nodes reproduce the C57 JSON-array SHA256 `d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116` exactly.

* Original #117038 is the angular residual divided by r. #117046 is its original supported expression on [Xminus #28814, Xb #28826]; #117048 is exactly 2X times that expression. Native definition0 has this literal body. #117051, #117062 and whole #117072 use the same native definition with three alpha-renamed bound variables. The forward/backward stress difference is therefore `-Jtheta(eta)/(2X)` under integral additivity/FTC.
* Actual current moments #14246833 and #14246841 use native density definitions31922 and31924. Exact algebra verifies `2X F1` and `2X(U0 F1+F0 U1)`. Their literal zero-order native aliases resolve to original F0 #71959, U0 #9236, F1 #29290 and U1 #29289. The C57 five-moment proof therefore supplies the matching denotations on the same original prefix, with C57's explicit native and analytic premises. The name `ActualWholeGlobalMomentZero` is not treated as a proof.
* A complete dependency walk of Xminus #28814, Xplus #28824 and Xb #28826 verifies that these endpoints are independent of the profile variables X #4756 and eta #2. Their other parameter dependencies are retained. This does not remove derivatives of internal cutoff profiles or a moving physical radius.
* Actual I2 native system2 has first linear row [8894,8946,8996], zero first quadratic row, RHS #71708, selected roots #71717–#71719, and actual complete heat angular debt #71547. With `N0=#71702` and the independent I2 amplitude `lambda=#8`, exact algebra gives
  `DeltaI + heatI = lambda*N0*(firstLinearRow(root)-rhs0)`.
  This is a source-row binding only. Identification of `DeltaI` with the real correction integral, identification of `heatI` with the real improper heat change, the native root equation, and the preheat identity are not inferred here. Actual final F0 #71959 visibly includes I2 correction #71741 and complete heat edit #71955.

The exponent `lambda1=2h` is node #25. It is distinct from I2's source parameter `lambda=#8`. The verifier preserves this distinction.

## Conservative reduction and the missing independent leading identity

Use `A=1/2+h`, `D=1/2-h`, `b=-1-h`, `L=1-2h eta^2`, and positive q powers:

```
q-z^2 q^(2h)=1-t,  eta=z/q^D,  r^2=2qX,
Tbar_a f=(-a f+D eta f_eta)/L,
Zbar_a f=(2a eta f+(1-eta^2)f_eta)/L.
```

Thus `d_t(q^a f)=q^(a-1)Tbar_a f` and `d_z(q^a f)=q^(a-D)Zbar_a f`. In profile coordinates, integrating the unbarred operators against 2X shifts their exponent parameter by +2. This follows by integration by parts from `integral 2X*(X f_X)=-2 integral 2X*f`, with the full boundary term `2X^2 f` retained until justified to vanish.

Define the entire subtracted integral together:

```
m12 = integral_0^infinity 2X F1 dX,
m14 = integral_0^infinity 2X(U0 F1+U1 F0) dX,
I0  = integral_0^infinity 2X(F0-C X^(-1-h)) dX.
```

Here C is eta independent, from the fixed physical pure-power exterior `P(r)=const*r^(-2A)`. The two pieces defining I0 generally diverge separately at infinity for `0<h<1`; they must not be split into two ordinary integrals. The full heat factor is not substituted for this fixed reference.

The actual cylindrical conservative angular identity is

```
r^2 Rtheta = d_t(r^2 utheta)
  + d_r(r^2 ur utheta) + d_z(r^2 uz utheta)
  - d_r(r^2 utheta_r-r utheta) - d_zz(r^2 utheta).
```

At coefficient n=1, its integrated current term has power `q^(1+h)`, its axial flux has power `q^(1/2)`, and the leading subtracted angular moment has power `q^(1-h)`. Applying the physical derivatives leaves the common power `q^h`. Therefore, once the endpoint and integral hypotheses below hold, the literal whole source moment obeys

```
Jtheta = Tbar_(1+h) m12 + Zbar_(1/2) m14
         - Zbar_(1/2) Zbar_(1-h) I0.
```

Consequently `m12=m14=I0=0` as eta-function identities suffices. The independent leading identity cannot be discarded: the formal control `m12=m14=0, I0=1` gives `Jtheta(0)=-2(1-h)`, or exactly `-99/50` at rational control h=1/100. This is a countermodel to that weakened inference, not a counterexample to the actual source.

For n>=2, the lower angular viscosity uses the positive-order moment at n-1 instead. That recursion is separate; this receipt does not assert a new all-n proof or replace the special n=1 leading subtraction.

## Explicit analytic boundary

The source-side reduction is conditional on the following concrete facts.

1. The raw and supported source residuals denote the same full physical residual, using the original continuity/inner equation and exterior equations. Replacing a raw expression by a zero branch cannot itself prove this. Do not differentiate a discontinuous replacement and omit its interface terms.
2. Axis parity and the actual compact positive-order factors make both radial boundary fluxes vanish. In particular, retain `r^2 ur utheta` and `r^2 utheta_r-r utheta` before taking endpoint limits.
3. Use `q>0`, `t<1`, `|eta|<1`, `0<h<1` and `L>0`. Current moments vanish as functions, with the first eta derivatives required by the formula; I0 requires two. All internal eta dependence, cutoff derivatives and native argument substitutions remain actual.
4. For I0, axis integrability follows from the subtracted power when h<1. At infinity the actual difference has the heat-tail cancellation, typically `r^2(utheta0-P)=O(r^(-1-2h))`, integrable for h>0. A bound on utheta0 alone does not give this cancellation. Required derivatives need uniform locally integrable majorants.
5. Use fixed physical integration bounds [0,infinity]. In any preblowup local parameter neighborhood take a common exterior radius beyond which the actual leading field is z independent; this justifies differentiation of the renormalized moment without an invented moving-bound cancellation. If moving finite bounds are used instead, retain all Reynolds terms unless the required value/first traces vanish.
6. At eta=+-1, use inward one-sided nonnegative heat-time traces and uniform majorants. Do not assert negative heat-time continuation. Subtracting an eta-dependent full heat profile globally can produce nonintegrable eta derivatives at the axis and is not automatically the paper's subtraction.
7. Interpret the original I2 equation by real integral identities and prove the preheat angular moment. The separately available original function `actualLeadingSubtractedAngularProof(first,heat)` addresses this source boundary; this packet only pins the source module and does not rerun or assume its conclusion.

The existing 16 conditional Lean linear-algebra theorems and the C57 actual-density binding are distinct from these analytic hypotheses. No global progress counter is promoted here.

## Replay and inputs

The verifier has no absolute runtime import paths. From the task workspace, with the existing authenticated source cache present, run:

```powershell
python -B work/goal-next/continuation86/whole-angular/verify_whole_angular.py --goal work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next --work work/goal-next --out work/goal-next/continuation86/whole-angular/whole-angular.json
```

Required external inputs are explicitly pinned in `inputPins`: the committed source-stream reader, committed C80 cache helper, exact rational algebra helper, read-only Git source helper, C57 receipt and C57 verifier. The source export is at `continuation70/hosted-44582875351/first-correction-spatial-source`, and the previously authenticated cache at `continuation80/signed-wave/cache`, both relative to `--work`. No large graph is copied or uploaded. The replay authenticates the complete cached stream on every invocation, then checks only the bounded source ingredients above. Read-only Git source access uses commit `059df9db3a188ce18f3c43a0dca3a92f2e02a4b2`.

Assertions are mandatory; Python optimized mode is rejected. All deliverable text uses LF. `replay.log` records two actual successful invocations with identical receipt hashes. Status: source/row algebra VERIFIED; whole angular analytic reduction CONDITIONAL; the final join to #117072=0 remains outside this packet.
