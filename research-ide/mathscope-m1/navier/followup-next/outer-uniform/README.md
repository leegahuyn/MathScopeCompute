# Outer A.4 audit: the retained Md=1 candidate fails its cone

## 1. Result and the object being tested

The prescribed outer profile of the retained common source datum has an
actual point with **Pc < 0**. The relaxed cone in the source requires
**Pc > 2**. The current `Md=1`, `logP=14` choice therefore cannot be used as
the globally admissible outer profile required by the original construction.
This rejection applies for every positive radial scale XR.

The exact witness is

\[
\eta=\frac34,\qquad
y_* = \exp(1/2)-1,\qquad
\log(X/X_R)=1+y_* = \exp(1/2).
\]

Here y is the local logarithmic coordinate of the A.2 axial stage. At this
point the argument of the prescribed smooth step is exactly 1/2. Outward
88-bit dyadic enclosures of the actual continuous integrals give:

| Quantity | Certified interval, displayed approximately |
| --- | --- |
| Qs | `[1.740796708000249, 1.74923192030256]` |
| Ns/E² | `[-2.0036305683702893, -1.9999438555500306]` |
| bs*w | `[33.286214421749364, 33.50916365691168]` |
| a − bs*w | `[-31.50916365691168, -31.286214421749367]` |
| Pc/XR | `[-143.31274978617154, -141.61251423213955]` |

The JSON stores integer numerators and the exact denominator `2^88`.
The displayed decimals are not used as certificate endpoints.

This result concerns the literal A.2 outer schedule, its A.21 pressure datum,
and its reference moment values. A replacement inner axis joined by the
required exact B.8 five-moment matching has these same moment combinations
at the witness and consequently the same obstruction. This statement does
not assume that an unfinished numerical matching residual is zero.

The datum and old evidence remain unchanged. Local axis, moment-inclusion,
and joining results retain their stated domains. They cannot be promoted
to a global source witness using this rejected outer field. The paper's
existential construction with sufficiently large Md is not refuted. No
general Navier–Stokes claim or new Lean analytic theorem is made here.

## 2. Source binding and reproducibility

The producer reads the exact rational parameters directly from
`../source-coherence/source-axis-cone-refined.json`, under
`sourcePressureCertificate.parametersExact`. In the current snapshot they
include:

| Parameter | Preserved value |
| --- | --- |
| Md | `1` |
| logP | `14` |
| h | The exact binary64 rational originally entered as `1e-8` |
| lambda | The exact binary64 rational originally entered as `0.0002` |
| co | The exact binary64 rational originally entered as `0.005` |
| Tf | `64` |
| historical logXR | `20`; the proof instead covers all positive XR |

The certificate binds the axis JSON, the original `outer.mjs`, and the
outward interval library with SHA-256. The complete paper is identified by
SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The implementation preserves the pinned upstream source commit
`f9e8bc5b38b6e212696e8a30e3e91517af887bbd`.

Source anchors used in this audit:

| Source location | Role |
| --- | --- |
| A.2 and A.5–A.7, p.129 onward | Exact smooth step, outer schedule, and parameter order |
| A.21–A.23, pp.133–134 | Fixed pressure datum and pressure-neutral future edits |
| A.24–A.26, pp.134–135 | Cone quantities and the exact Qs equation |
| 4.15–4.16 and B.35, p.155 | Moment reconstruction and the numerator Ns |
| 4.20–4.22 | Reconstructed Pc and its necessary cone inequality |

From the **MathScopeCompute repository root**, use:

```sh
python3 research-ide/mathscope-m1/navier/followup-next/outer-uniform/certify_axial_midpoint.py
python3 research-ide/mathscope-m1/navier/followup-next/outer-uniform/verify_axial_counterexample.py
python3 research-ide/mathscope-m1/navier/followup-next/outer-uniform/verify_fixed_logp_md_family.py
python3 research-ide/mathscope-m1/navier/followup-next/outer-uniform/test_outer_audit.py
python3 research-ide/mathscope-m1/navier/followup-next/uniform-gluing/verify_outer_counterexample.py
```

From an extracted distribution, enter its `research-ide` directory and omit
that prefix. Only Python's standard library and the included sibling
`uniform-gluing/dyadic_interval.py` are required. No network, floating-point
quadrature package, or Lean installation is needed for these checks.

The default interval calculation uses 256 cells in each positive continuous
integral and normally finishes in about one second. The other three checks
normally finish in less than a second each. **Exit code zero means that the
expected candidate rejection was verified.** It does not mean that the
candidate passed the source cone or that a construction gate was completed.

The separate verifier performs **20/20** exact rational checks, including
source binding, algebraic reconstruction, and two intentional false-promotion
controls. The independent quadrature-free proof in `uniform-gluing` performs
**14/14** rational checks. Section 7's parameter-family argument performs
**15/15** rational checks. Reproduction and invalid-input checks additionally
pass **18/18** checks at two distinct cell resolutions.

## 3. Continuous integral enclosure

Write

\[
A=\tfrac12+h,\quad D=\tfrac12-h,\quad d=1-\eta^2,\quad
L=1-2h\eta^2,\quad f=(1+\eta^2)^{-1},\quad
J_0'=\frac{2\eta}{1+\eta^2}.
\]

On the initial unit transition, let
\(S_\sigma(t)=\int_0^t\sigma(s)\,ds\). The source gives

\[
l=\tfrac35(1-\sigma(t)),\quad U=4\eta,\quad
E=P_*f\exp\!\left(\tfrac{t}{10}-\tfrac35S_\sigma(t)\right).
\]

The exact symmetry \(\sigma(1-t)=1-\sigma(t)\) implies
\(S_\sigma(1)=1/2\). In particular, the amplitude at the start of the axial
stage is exactly \(P_*f\exp(-1/5)\).

The two initial positive integrals are

\[
B=\int_0^1\exp\!\left(\tfrac85t-\tfrac35S_\sigma(t)\right)dt,
\qquad
C=\int_0^1\exp\!\left(\tfrac65t-\tfrac65S_\sigma(t)\right)dt.
\]

The producer bounds each increment of \(S_\sigma\) by monotonicity of the
step, then evaluates the exponential on each whole closed cell in the
\((t,S_\sigma)\) rectangle. Cell widths multiply these interval ranges.
It does not estimate an integral error from point samples or use a sampled
supremum.

For Md=1, the axial coefficient is
\(k(y)=4(1-\sigma(\log(1+y)))\). Substitution
\(q=\log(1+y)\) makes the witness endpoint exactly \(q=1/2\):

\[
K_1=\int_0^{1/2}4(1-\sigma(q))\exp(e^q-1+q)\,dq,
\]

\[
K_2=\int_0^{1/2}16(1-\sigma(q))^2\exp(e^q-1+q)\,dq.
\]

The factor \(e^q\) is the change-of-variable Jacobian. Every integrand is
enclosed on whole cells using the same outward arithmetic. Positive
exponentials are obtained by reciprocating a separated enclosure of the
negative exponential; small positive tail endpoints are retained.

At the witness, the exact step identities give

\[
k=2,\qquad k'=-32e^{-1/2},\qquad a=2,\qquad
E^2=P_*^2f^2\exp(-2/5-y_*).
\]

## 4. Reference moments and the actual Qs

Set

\[
R_I=e^{-13/10}(5/8+B),\qquad
R_E=e^{-3/5}(5/6+C)+y_*,
\]

\[
\bar k=e^{-y_*}(4+K_1),\qquad
\overline{k^2}=e^{-y_*}(16+K_2),\qquad W=1-L\bar k.
\]

Here \(R_E\) is the reference energy primitive divided by the current
\(XE^2\). The factors 5/8 and 5/6 include the complete inner reference
integrals. There is no finite cutoff of that reference interval.

With

\[
a_0=4L-1,\qquad
C_\eta=-h(1-8\eta^2)+(D+4d)\eta J_0',
\]

the exact initial-stage equation is
\(Q_s'+(1+l)Q_s=a_0l+C_\eta\), and its axial starting value is

\[
Q_{\rm start}=a_0+(C_\eta-a_0)R_I.
\]

During the axial stage, A.26 becomes

\[
Q_s'+Q_s=c_0+c_1k,\qquad
c_0=-h+D\eta J_0',\quad c_1=2h\eta^2+d\eta J_0'.
\]

Its value at the witness is therefore

\[
Q_s=e^{-y_*}Q_{\rm start}
+c_0(1-e^{-y_*})+c_1e^{-y_*}K_1.
\]

This supplies an actual positive separated denominator. The certificate
does not insert an assumed positive constant in place of the source Qs.

The remaining reference combinations are

\[
M-\eta M_\eta=0,\qquad
\frac{S}{XE^2}=\frac{\eta^2\overline{k^2}}{E^2}-\frac{R_E}{2},\qquad
\frac{S_\eta}{XE^2}=\frac{2\eta\overline{k^2}}{E^2}+J_0'R_E.
\]

The separate squared-velocity and squared-energy reference primitives
are a convenient way to calculate **S and its derivative**. They are not
claimed to be separately matched by the replacement axis. Exact B.8
matching preserves the specified S combination and the other four moments.

## 5. Pressure: a bound on the entire unedited tail

At this point the fixed A.21 datum and the source forward identity give

\[
\frac{\Pi}{E^2}=-\frac12\int_0^\infty
\frac{E(y_*+s,\eta)^2}{E(y_*,\eta)^2}\,ds.
\]

The remaining exact axial length is

\[
r=T_d-y_*=e+11-\sqrt e>11.
\]

On this interval the squared ratio equals \(e^{-s}\), and the angular
exponent \(\theta\) equals one. Everywhere later in the unedited schedule
\(0\le\theta\le1\). The angular interpolation decreases the combined
amplitude factor from f to 1/2. All later log-amplitude slopes are at most
\(-1/2\), except for the terminal flat factor whose total possible ratio
is bounded by \((1-\rho)^{-1}\), where \(\rho=c_oh\). Consequently

\[
\frac{E(y_*+s,\eta)^2}{E(y_*,\eta)^2}
\le\frac{e^{-s}}{(1-\rho)^2}.
\]

Differentiation of the angular factor in the prescribed pressure integrand
has multiplier \(-2\theta J_0'\). Since \(\eta=3/4>0\), this gives

\[
-\frac{1}{2(1-\rho)^2}
\le\frac{\Pi}{E^2}\le-\frac12(1-e^{-r}),
\]

\[
J_0'(1-e^{-r})\le\frac{\Pi_\eta}{E^2}
\le\frac{J_0'}{(1-\rho)^2}.
\]

These bounds include the entire infinite tail. Later pressure-neutral
corrections may be omitted before their support by the exact source
identity; an unverified numerical residual is not treated as neutrality.
The independent proof in `uniform-gluing` uses only the lower positive
integral on the remaining exact axial segment, so its sign conclusion does
not depend on the terminal-factor upper envelope.

## 6. Direct reconstruction proves a necessary cone failure

The actual numerator from 4.16/B.35 is evaluated as

\[
\frac{N_s}{E^2}=-\frac{Wk\eta}{E^2}
+4h\eta\frac{S}{XE^2}
-d\frac{S_\eta}{XE^2}
+4A\eta\frac{\Pi}{E^2}
-d\frac{\Pi_\eta}{E^2}.
\]

In particular, the \(-WU\) term is **not** additionally divided by X.
The reconstruction then gives

\[
b_sw=\frac{2k'\eta(N_s/E^2)}{Q_s},\qquad
b_s^2=\frac{4(k')^2\eta^2}{E^2},\qquad a=2,
\]

\[
\frac{p_{s,1}}{X_R}=\frac{\exp(1+y_*)Q_s}{L}>0,\qquad
\frac{P_c}{p_{s,1}}=1-\frac{b_sw}{2}.
\]

Both \(k'\) and \(N_s\) are negative. Their contribution makes the final
ratio negative. Multiplication by the strictly positive
\(p_{s,1}/X_R\) yields the negative Pc/XR interval in section 1.

A.24 gives useful sufficient cone tests, including \(a-b_sw>0\). The
certificate does more than observe their failure: it reconstructs **Pc**
and contradicts its necessary condition **Pc > 2**. Increasing XR scales
this negative value by a positive factor and cannot repair its sign.

The separate verifier imports neither the producer nor its interval
library. It reconstructs the downstream interval algebra using exact
`fractions.Fraction` operations. The continuous integral enclosures and
their analytic identification with the source remain the explicit
mathematical boundary described in sections 3–5; twenty scalar checks
are not a Lean formalization of those analytic identities.

## 7. Why changing Md alone while keeping logP=14 cannot repair this

The source's parameter order A.6 requires

\[
T_d=e^{M_d}+10,\qquad \log P_*>T_d.
\]

**If logP remains 14, every A.6-compatible positive Md must satisfy
\(0<M_d<\log4<7/5\).** The last strict inequality follows from a finite
positive Taylor lower bound \(e^{7/5}>4\), evaluated exactly by the
family checker.

The same obstruction extends to this entire continuous Md interval, with
the existing h retained. It is not a scan of finitely many Md samples.
At the step midpoint set \(x=e^{M_d/2}\). Then

\[
1<x<2,\quad y_*=x-1<1,\quad
|k'|=\frac{32}{M_dx}>\frac{80}{7},\quad
T_d-y_*=x^2+11-x>11.
\]

The initial Qs stage is independent of Md. Exact ODE barriers give
\(1<Q_s<3\) there and \(1/3<Q_s\le3\) in the axial stage, because
\(c_0>1/3\), \(c_1>0\), and \(c_0+4c_1<3\). At every midpoint,
\(E^2>f^2 2^{26}\). Also \(0\le\bar k\le4\),
\(0\le\overline{k^2}\le16\), \(|W|\le3\), and \(R_E\ge0\).
Dropping only nonpositive terms gives the uniform estimate

\[
\frac{N_s}{E^2}\le
\frac{9/2+27h}{f^2 2^{26}}
-(2A\eta+dJ_0')(1-2^{-11})<-1.16942856.
\]

Thus throughout this prospective parameter family,

\[
b_sw>6.68244892,\qquad a-b_sw<-4.68244892,
\qquad P_c/X_R<-1.56081630.
\]

The checker stores exact rational bounds for these inequalities. Each
prospective Md is understood to use **its own exact A.21 pressure datum**.
Reusing the old pressure function after changing Md would be a separate
inconsistency; this family argument does not do that or mutate any datum.

A repair must therefore consider a new compatible hierarchy of at least
Md, logP, h and the A.21 pressure function, followed by renewed axis and
moment calculations. A.5 explicitly selects Md sufficiently large before
choosing P*. Increasing Md also increases the required logP exponentially
and reduces the allowed h through \(h\ll\min\{\lambda,e^{-T_d}\}\).

The historical numerical implementation's supported limits
`Md <= 4`, `logP <= 100`, and `h >= 1e-12` are implementation bounds, not
certificates of this source hierarchy. No alternative Md is recommended
as globally admissible by this audit. A midpoint success at a different
choice would still leave the full outer domain and every eta to certify.

## 8. Files and completion boundary

| File | Purpose |
| --- | --- |
| `certify_axial_midpoint.py` | Source-bound whole-cell continuous integral enclosures and direct Pc reconstruction |
| `axial-midpoint-certificate.json` | Actual fixed-datum counterexample and exact outward endpoints |
| `verify_axial_counterexample.py` | Independent downstream rational reconstruction and rejection controls |
| `axial-midpoint-rational-checks.json` | Stored 20/20 verification record |
| `verify_fixed_logp_md_family.py` | Exact rational checks supporting section 7's continuous Md-family rejection |
| `fixed-logp-md-family-rejection.json` | Prospective family, analytic boundary and 15/15 scalar record |
| `test_outer_audit.py` | Reproduction at distinct cell resolutions and invalid-input/source-binding controls |
| `outer-audit-tests.json` | Stored results of those checks |

The independent quadrature-free derivation and program are maintained in
`../uniform-gluing/OUTER_CANDIDATE_FAILURE.md` and
`../uniform-gluing/verify_outer_counterexample.py`. Their separate artifact
is `../uniform-gluing/outer-counterexample-independent.json`.

This add-on **completes a reproducible audit and rejection of the current
outer candidate**. It does not complete original N3-02, N3-05, N3-06 or
N3-07. No historical acceptance JSON or source has been overwritten, and
the original 70-item baseline remains a historical snapshot. A later
reselection must produce one compatible object and re-establish all
dependent pressure, matching, cone and endpoint obligations before any
original gate can be promoted.
