# Actual radial envelopes for the original mean and pressure

The C132 hosted stream and native registry pin the original active order-three input. The independent Python audit reads the complete decompressed 22,380,596-record stream and checks its SHA-256. It verifies the source's six selected pairs of partial and whole radial integrals, the native definition and argument order of the Signed pressure, Temporal potential and FiveMap operations, and the common shell guard on all 4,698 rows of the 29 protected indexed fields. The guards belong to the original fields available in the hosted export. The separately dispatched original Repeat registration must supply the four proposed final indexed fields.

The replay of the original full auxiliary mean operators uses a finite support algebra. A summand inherits exterior zero from each supported factor, and a derivative preserves zero on an open exterior wherever that derivative exists. Division uses a positive power of the original positive radial coordinate. The replay covers six PDE outputs and eleven explicitly returned moment integrands or subexpressions. In particular it retains the stress in the tangential residuals, the pressure term in the axial residual, the six covariance components, quadratic increments, time and all viscous terms. Nine omissions expose the corresponding unsupported summands. This proves the local support implication for the attached formulas. It does not supply the existence or the input regularity for each term.

## Common physical collars

For adjacent references, let `a` be the first reference, let `b=a+1` and write `s_b=2s_a`. Strict admission of both brackets gives `1/2<s_a<1`. In the first radius variable, the two fixed normalized radial envelopes are

- `[sqrt(Xa), 2 sqrt(Xb)]`
- `[sqrt(Xa/2), sqrt(2 Xb)]`

Each contains the common shell `[sqrt(2 s_a Xa), sqrt(2 s_a Xb)]` strictly, since `Xa>0` and `Xb>Xa`. Choose the ends of an enclosing closed interval in the resulting two open collars. The shell endpoints then lie strictly between those ends. The zero-tail premises of the Lean equality use the chosen collar ends. This avoids presupposing values at the exact edges of the shell just to compare enclosing integrals. The derivatives used by the PDE still require their genuine traces and regularity at the physical joins.

The global bump uses `u=10(R/(sqrt(s) sqrt(2 X0) exp(1/2))-1)`, with `X0=X0Imean`. Its seed is supported where `0<u<1`, so `exp(1) X0 < X < exp(1) (11/10)^2 X0`. The original reserved patch places this interval strictly inside `(Xa,Xb)`. The mass is positive; reducing its two fixed integrals to the same support is legitimate. After the reference change, the argument of both `rho` and the step `chi` is preserved. The resulting `rho` transforms with radial weight `lambda^(1/2)`, and `chi` is zero on the left collar and one on the right.

The pinned `shiftedRadialIntegrals` uses the same physical radial point and shifts both torus coordinates by `(Phi(r)-Phi(R)) v_r`. It preserves a radial zero holding for every torus phase. For a supported density `f` with fixed outer `ZT` and evaluation point, the original centered form is `I_left(f) - chi I_whole(f)`. On the left tail both the left integral and `chi` vanish. On the right tail the left integral equals the whole integral and `chi=1`. This preserves zero exterior without a separate zero-total hypothesis for the shifted density. The ordinary mean pressure additionally records its particular zero-total normalization. The explicit `chi_R I_whole` and `chi_Z I_whole` terms are retained. Their support follows from the flat step profile. The same reasoning applies to the original `L gr` and the density used for the slow axial derivative, provided the relevant local derivatives exist.

Fourier coefficients of a zero source on a fixed collar vanish, since each is an integral against the original torus character. Every finite normalized zero-mode-excluded inverse vanishes there. Its realized limit also vanishes. The analytic requirements for existence and differentiated convergence remain. For the Temporal potential and compact FiveMap primitive the same fixed-enclosure suppression applies to their own densities, using the pinned native definitions and their supported velocity increments. The Lean theorem controls the change of integral endpoints after the original radial substitution and common density have been justified. Its inherited integration hypotheses keep those assumptions explicit.

The raw background stress is a separate input. Positive orders are covered through the original stress constructions. The unguarded leading terms require the original natural balance at the inner edge and the exterior heat and moment identities of Lemma A.8 at the outer edge. A supplementary original replay pins these to the actual stress roots. In particular, the nonzero leading heat velocity and pressure on the exterior are not themselves cut to zero.

## Reproduction

```text
python -B audit_native_radial_envelopes.py <unmodified-44682703381-artifact-directory> native-radial-envelopes.json
node replay_original_mean_support.mjs <pinned-runtime>/research-ide/mathscope-m3/navier
```

The check resolves the fixed-envelope padding step for supported, already aligned integrands. The complete native whole-field comparison across both references and the analytic, numerical and release decisions keep their separate evidence requirements.
