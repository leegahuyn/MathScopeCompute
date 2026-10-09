# Follow-up evidence for the nine original NS gates

This dated addendum accompanies the English M0/M1 source and evidence edition. It preserves the original v54 acceptance assessment and records the additional work separately. The generators, exact certificates, independent checks, and unsuccessful branches are included under `mathscope-m1/navier/followup-next/`.

## A concrete rejection of the current outer candidate

The outer-domain audit found an actual failure for the current `Md=1` candidate. At the interior point

\[
\eta=3/4,\qquad y_{\mathrm{axial}}=e^{1/2}-1,
\]

the continuous outward interval calculation gives

\[
Q_s\in[1.74079,1.74924],\qquad
\frac{N_s}{E^2}\in[-2.00364,-1.99994],
\]

and

\[
\frac{P_c}{X_R}\in[-143.313,-141.612].
\]

These displayed decimal intervals are widened for readability; the certificate stores exact dyadic endpoints. The required relaxed cone has `Pc>2`, whereas this candidate has **`Pc<0` for every positive `XR`**. Increasing the radial scale cannot fix this sign. See [the executable counterexample](../mathscope-m1/navier/followup-next/outer-uniform/axial-midpoint-certificate.json) and [its derivation](../mathscope-m1/navier/followup-next/outer-uniform/README.md).

This is a rejection of the current MathScope parameter candidate. The original paper chooses `Md` sufficiently large; it does not assert that `Md=1` works. The local axis, moment-map and joining-rectangle results below retain their explicitly limited domains. They cannot be assembled into a global certified profile with this rejected outer candidate.

Keeping `logP=14` also constrains `Md<log(4)` through the original requirement `logP>exp(Md)+10`. The [exact family audit](../mathscope-m1/navier/followup-next/outer-uniform/fixed-logp-md-family-rejection.json) extends the rejection to **every real `0<Md<log(4)`**, using each prospective parameter's own A.21 pressure. Thus changing `Md` alone within the permitted range cannot fix the current pressure choice. A substantially larger `Md` requires reselecting the pressure and `h`, then regenerating the A.21 datum and all dependent axis, continuation and matching certificates. Passing one midpoint check for another pressure would still not establish the whole-domain cone.

## One source datum and explicit domains

The new source-dependent chain uses the A.21 pressure producer with `Md=1`, `logP=14`, the source's exact dyadic representations of `lambda≈0.0002` and `h≈1e-8`, and `j0=1e-10`. The binding record is [uniform-source-debt-final.json](../mathscope-m1/navier/followup-next/source-coherence/uniform-source-debt-final.json), with SHA-256:

```text
ac79c8268a501f9762b5f13f6efe114809a94e568efc614e2fd66ceae4303c7a
```

This record describes the common analytic input for the new components. It is not a certificate that every later exterior correction and modulation has been completed. The old deployed `logP=0` finite arrays remain a separate historical fixture.

The angular domain is the complete similarity interval `-1≤eta≤1`. The physical similarity map sends finite axial coordinates at positive similarity time to `|eta|<1`; the two endpoints are one-sided limits. The joining certificates below cover the stated radial rectangle, rather than every radius in the final field.

The pressure producer's `logXR=20` is a normalization used in its computation. The A.21 pressure integral is independent of the radial scale after the change of variables `y=log(X/XR)`. The final radial scale is represented symbolically by `XR=110 exp(10(logC+14))`; it is not stored as an overflowing binary64 number. Its source ledger keeps this distinction explicit.

## Additional completed components

| Component | Added evidence | Exact scope |
|---|---|---|
| Infinite-axis bounds and finite prefix | A source-bound, 1024-bit outward interval recurrence, a refined fixed-point error bound, and directed logarithmic observations | A finite prefix and its analytic bound chain; the generated analytic premises have not been instantiated and kernel checked as one new Lean theorem |
| Core formulas | Independent polynomial reconstitution, symbolic checks, and an actual Lean audit of universal algebra and scalar inequalities | The stated algebraic identities; the old finite candidate's nonzero stress residual is retained |
| Continuation parameters | Explicit selection of `C` followed by smaller positive transition widths, quantified derivative bounds, and a comparison argument | The documented axis/continuation domains; the comparison stops at the interpolation endpoint, followed by a separate barrier argument |
| Continuous five-bump map | Outward enclosures of the actual continuous B.8 and C.2 integrals; preconditioned nonlinear contraction and implicit-function bounds | The specified correction operators and certified debt balls, with all quadratic terms |
| Source-dependent B.8 joining | Bounds on the same source's debt, the implicit root and its first two eta derivatives | All eta in `[-1,1]`, with the source analytic assumptions explicitly recorded |
| Joining relaxed cone | Positive field, shear, moment and cone bounds propagated through all partial integrals | The entire rectangle `-8≤log(X/XR)≤-5`, `-1≤eta≤1` |
| C.1 oscillatory loop | A uniform variance bracket, Bessel-function bounds, exact means and positive cone margins | Every phase in `R/Z` on that same joining rectangle |
| C.12 slow derivatives and frequency | Explicit slow-derivative bounds and a finite local frequency, stored by its exact exponent | The contribution generated on the joining rectangle, conditional on a stated incoming moment bound and a compatible loop on preceding regions |
| Actual outer-candidate rejection | Continuous initial/axial integrals, an analytic infinite-tail pressure enclosure, and direct reconstruction of `Pc` | A rigorously enclosed interior point proves that the current `Md=1` outer candidate fails the required cone |
| Parameter regeneration | A new CLI recomputes the pressure, axis, continuation and 1024-bit prefix from a separate source input; full baseline byte parity and a distinct input were executed | A local source pipeline; a successful run does not certify a new global outer candidate |

### Continuous integration and the implicit root

The interval generator uses exact outward dyadic arithmetic. Linear bump integrals are enclosed against the positive measure `d sigma`; squared-bump integrals include an analytic derivative bound on every cell, including the endpoint cells. The certificate uses 1024 partitions and 88-bit outward bounds. Comparing two approximate quadrature rules is recorded separately from these continuous enclosures.

After the original moment-row transformations, the B.8 operator is independent of eta and of the positive pressure amplitude. Its nonlinear contraction bound is below `0.18761` for the base certified ball. The C.2 map is recomputed for the actual small source lambda; the earlier lambda `1/5` certificate is not transferred to it. The tighter source-dependent root ball has a contraction bound below `0.01531`.

The proofs of the finite inclusion inequalities use exact rational arithmetic. The independent 80-digit integrations are diagnostic cross-checks. None of those numerical integrations is described as a Lean kernel proof.

### The joining-domain cone and the local frequency

The whole joining-rectangle estimates include `Qs>1.1249989`, positive corrected `E`, positive angular shear, and a relaxed-cone margin. The subsequent C.1 loop gives positive admissible-cone margins for every oscillatory phase on that rectangle. These results explicitly retain the distinction between a relaxed cone and the stronger modulated admissible cone.

The C.12 calculation now bounds the slow radial and angular derivatives rather than only its values. It selects a mathematically finite joining frequency with an exact logarithmic representation. The resulting bound is extremely large and is not an assertion that a browser can execute that many oscillations.

The incoming normalized moment discrepancy and its first eta derivative must satisfy the positive tolerance recorded in [source-final-joining-frequency.json](../mathscope-m1/navier/followup-next/uniform-gluing/source-final-joining-frequency.json). That discrepancy has **not** been set to zero. Its actual value must be supplied by the construction on the preceding region. A locally generated error bound does not certify this incoming error or select one frequency for the entire original interval.

## Original Lean build and independent Comparator

The repository contains a dedicated [original verification workflow](https://github.com/leegahuyn/MathScopeCompute/actions/workflows/ns-original-verification.yml) and [pinned runner](https://github.com/leegahuyn/MathScopeCompute/tree/main/tools/ns-original-ci). It runs the full original default build and the protected Comparator in separate fresh jobs.

The Comparator path creates an unprivileged user with a working user systemd session, preserves the original AF_UNIX restriction and Landlock confinement, and tests those restrictions before the actual comparison. It builds the required nanoda independent kernel and uses the unchanged original configuration. It rejects original project artifacts built before the guarded comparison. A script or workflow definition alone does not close either gate: their final exits and result artifacts must be inspected.

The first public run is [37979127351](https://github.com/leegahuyn/MathScopeCompute/actions/runs/37979127351), on MathScope commit `8c4271aa5a35b1d34c30279fb306a099944e4823`. At the publication observation recorded in this edition, those jobs had not yet produced a verified successful final receipt. The earlier selected C/D declaration build and axiom checks retain their narrower scope.

## Conditions still needed for the complete profile

The following obligations remain open unless a later, explicit acceptance receipt closes them:

1. A successful actual exit of the original full default build, and separately of the original protected Comparator including nanoda.
2. A new simultaneous parameter choice and a quantitative outer A.4 construction that passes its full domain, including every outer correction and its pressure/moment identity with A.21. The present `Md=1` candidate is rejected by the explicit counterexample above. The code's supported input range is not a proof of the paper's sufficiently-large/small choices.
3. The generated analytic premise bundle and exact finite-to-infinite coefficient relation instantiated in the original Lean types and kernel checked.
4. The same exact infinite core's required leading identities and regularity, connected to the finite observations.
5. One compatible C.1 loop and C.12 slow-derivative bounds over the entire required radial interval, including the incoming joining moments.
6. The actual C.2 discrepancy after that global modulation, its continuous restoration, and preservation of the full-domain strict cone.
7. The exterior heat replacement, final stress support, nonvanishing, flat factorization and endpoint limits for that same final field.

The new files make several formerly numerical subproblems quantitatively checkable. They do not yet supply one completed global leading profile, and this edition does not mark the original nine gates as complete.

## Regenerate a separate local source chain

The new [parameter regeneration guide](../mathscope-m1/navier/followup-next/source-coherence/PARAMETRIC_REGENERATION.md) documents the executable dependency chain. Run these commands from `research-ide`, choosing an unused run name:

```bash
node mathscope-m1/navier/followup-next/source-coherence/rebuild-source-variant.mjs \
  --baseline-check --name baseline-parity-replay

node mathscope-m1/navier/followup-next/source-coherence/rebuild-source-variant.mjs \
  --name local-parameter-replay --Md 1.01 --logP 15
```

The included historical baseline replay matched all bytes of three original JSON documents, with no fields excluded. The separate `Md=1.01`, `logP=15` run actually recomputed the new A.21 pressure, axis parameters, continuation bounds and degree-24 radial / degree-2 angular prefix at 1024-bit precision. Its source identity is different and is not substituted for the original source in the joining certificates.

This alternate input is a test of parameter propagation, not a recommended global NS candidate. Its global-profile and analytic-Lean-premise flags remain false. The unchanged pressure producer's finite input ranges can exclude the much larger/smaller choices required by the original parameter hierarchy; the CLI does not silently expand those ranges.

## Reproduce and inspect the evidence

Start with the [English installation guide](INSTALL_AND_REPRODUCIBILITY_EN.md). The arithmetic certificate generators use the Python standard library; the independent numerical/symbolic checks additionally use the pinned `mpmath` and `sympy` dependencies in `requirements-reference.txt`.

Each addon directory includes its derivation, exact input bindings, generator commands and evidence scope. Historical failed branches and source-preserving revisions are included so a successful local certificate cannot silently replace a failed global claim. The English source manifest separately hashes these addons and the unchanged v54 sources.
