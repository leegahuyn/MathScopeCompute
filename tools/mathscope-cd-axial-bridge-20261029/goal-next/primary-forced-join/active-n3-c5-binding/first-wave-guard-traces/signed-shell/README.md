# C83: actual Signed radial primitive reduction

**VERIFIED:** two actual same-live post-Forced Sigma bodies, their compact primitive identities and normal derivative recurrence through order 3; the original shell places the mean correction strictly away from both shell edges. Six original Signed potential bodies are linear in those same two Sigma applications and contain exactly one inverse of the same positive target amplitude. This is an exact symbolic reduction using completed GitHub source run `44582875351`.

**OPEN:** the retained Gaussian weight of the actual post-Forced Haar residual, beginning at value order 0. Therefore the Signed radial seam is still **CONDITIONAL**. No complete radial seam, mixed C3, final jet, or release promotion is claimed. RELEASE HOLD remains.

## New actual source reduction

The actual native functions are `ActualLatestMeanSigma_after-forced_0` and `_1`, Signed applications `22001223`, `22001224`, definitions `coupled-expression:1276`, `1277`. Their bodies are `21999641`, `22000464`. With theta weight `w=2` and axial weight `w=1`, the authenticated graph gives exactly

```
Sigma = -R^(-w) (I - chi J)
I = integral_alpha^R p(r) dr
J = integral_alpha^beta p(r) dr
```

Here `alpha=17743711=sqrt(Xa)`, `beta=17743713=2sqrt(Xb)`, and the same bound radius is `17743710`. The actual weighted integrands are `21999634`, `22000457`; their primitives are `(21999635,21999636)` and `(22000458,22000459)`. No free R remains in those bound integrands or fixed limits. The audit traverses the actual argument DAG with binder-aware integral handling and native argument metadata.

The actual normalized two-torus means `M=<E>_Y`, at the bound radius, are `21999624`, `22000447`. Their underlying raw residual roots are `21999622`, `22000445`. Each actual weighted integrand is exactly `r^w M` plus correction terms that all contain the same compact bump `17743723`.

The source geometry has `X=R^2/(2s)`, with s independent of R, bracketed in `[1/2,2]`. The actual mean cutoff is

`chi=step(10*(R/(sqrt(s)*x0)-1))`, `x0=sqrt(2*X0Imean)*exp(1/2)`.

The original parameter-tree verifier checks `Xa<X0Imean` and `exp(5)*X0Imean<Xb`. Consequently:

- On the inner collar `Xa<X<=X0Imean`, chi and rho are identically zero.
- On the outer collar `exp(2)*X0Imean<=X<Xb`, chi is identically one and rho is zero.

These are strict neighborhoods of the shell faces. The second assertion uses `exp(1)>2>(11/10)^2`. The mean bump and cutoff cannot introduce radial derivatives there.

Thus the inner expression is the forward primitive, while on the outer collar the **actual corrected** primitive equals

`Sigma = +R^(-w) integral_R^beta p(r) dr`.

This backward-tail identity does **not** require `J=0`. The whole correction already subtracts the exact same J. The full global FTC identity retains its actual cutoff remainder:

`Sigma_R = -R^(-w)*p(R) - w*Sigma/R + R^(-w)*chi_R*J`.

The receipt records the exact endpoint substitution `r -> R`; it does not invent a materialized endpoint node ID. A nonzero-moment control (`p=1`, alpha=1, beta=3, R=2, w=1) gives actual/backward Sigma `1/2`, while dropping the cutoff gives `-1/2`.

## Smallest normal derivative input

On either collar, `p(R)=R^w M`, so exact rational differentiation gives:

| Derivative | Formula |
| --- | --- |
| Sigma_R | `-M - w*Sigma/R` |
| Sigma_RR | `-M_R + w*M/R + w*(w+1)*Sigma/R^2` |
| Sigma_RRR | `-M_RR + w*M_R/R - w*(w+2)*M/R^2 - w*(w+1)*(w+2)*Sigma/R^3` |

Therefore normal Sigma jets through 3 require **M through normal order 2**, together with the value primitive. A retained bound `M=O(zeta*delta^(-p))`, its zero extension outside the actual moving shell, and the standard matching Gaussian primitive lemma supply that value bound. For `g(x)=x^(-p)*exp(-a/x^2)`, `p*d^2<=2a` gives `g'>=0` on `(0,d]`, hence `integral_0^d g<=d*g(d)`. Positive finite radial Jacobians and the opposite-end Gaussian factor must stay matched to the original source weight.

The first unproved retained-weight input is actual M **order 0**. This packet does not infer it from an unweighted native norm or a syntactic Sigma factor. Normal orders 1 and 2 are then also needed. Pure tangential Z/T order 3 under the primitive remains necessary for full mixed C3; the normal reduction does not remove it.

The six actual `GenericSignedAfterForced` bodies each have total Sigma degree 1 and inverse amplitude power -1, with original amplitude roots `17733826`, `17733827` and target y roots `17733801`, `17733805`. For `a=sqrt(y)`, the exact inverse-a derivatives through order 3 are checked as rational polynomials. If `y>=c_y*zeta` and y derivatives each retain zeta times finite poles, every inverse-a derivative retains `zeta^(-1/2)`. Multiplying by the required Sigma weight leaves `sqrt(zeta)` times finite poles. The original Gaussian then forces the desired zero traces. Actual y/H/frame premises remain attached to their own same-source receipts; they are not manufactured by this implication.

The raw quotient is used only on admitted interior source branches. Exterior lazy guards provide zero before evaluating a singular amplitude inverse. No value is assigned to a singular unguarded endpoint expression.

## Replay

```powershell
python -B verify_signed_shell.py --goal <checkout>/tools/mathscope-cd-axial-bridge-20261029/goal-next --work <work>/goal-next --out signed-shell.json
```

The script resolves the committed C82 receipt at `--goal/primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/signed/signed-seams.json` and the committed cache helper at `--goal/primary-forced-join/active-n3-c5-binding/live-wave-gauge/signed/source_cache.py` (SHA256 `909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f`). It pins the existing source reader, exact algebra, shell verifier and transitive proof helpers. The explicit external data supplied by `--work` are `continuation70/hosted-44582875351/first-correction-spatial-ingress.json`, its `first-correction-spatial-source/` directory, and the immutable `continuation80/signed-wave/cache/` records/offsets/metadata. No scratch C82 code or continuation30 runtime is required.

It reauthenticates all 22,155,584 actual source records, with the native registry digest. Assertions must remain enabled (`-O` aborts). No local Lean, repository mutation, GitHub job or upload is performed. All ten fixed Signed cases inherit this same native Sigma/amplitude interface; cross-label glue and the C82 fast-face result remain separate.
