# Actual first-cycle mode-zero cutoff terms

The graph is the corrected first-cycle export from GitHub Actions run
43010593847. The uncompressed 4,456,994-node stream has SHA-256
`ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf`.
The manuscript references below use the repository-pinned 166-page copy
with SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.

## VERIFIED · Source operands and scalar balances

Let \(\langle\cdot\rangle_\theta\) denote angular averaging and let
\(\langle\cdot\rangle_Y\) denote the distinct normalized auxiliary-torus
Haar mean. The three raw conservative source roots are #4456772,
#4456774 and #4456776. The exact replay recovers all three pure-mean
monomial slices using the actual updated mean velocity and pressure.
It then restores the same-label wave covariance fluxes using the actual
six Forced fields and six Signed covariance increments. It binds all
162 index-map rows in each of those fields and checks 60 exact
coefficient identities across the ten original fixed cases. On the
common ordinary derivative domain, the geometric support condition
needed to discard products from distinct labels is that their actual
closed supports and the relevant derivative supports are disjoint.

Write \(E_B\) for the residual of the original background, evaluated
with the same differential operators. The replay gives the exact
scalar mean ledger
\[
 \langle R_*\rangle_\theta=E_B+
 \bigl(-\rho P_{\rm final}-A_{0,{\rm final}},
 E_{\theta,{\rm final}},E_{z,{\rm final}}\bigr).
\]
The tangential terms include the original background stress divergences
from #633815 and #633863. The corresponding final mean equation roots
are #4455360 and #4455812. The last includes the refreshed normalized
pressure's axial derivative. The ordinary wave covariance flux in
cylindrical coordinates uses
\[
 \left(\partial_R W_{rr}+R^{-1}(W_{rr}-W_{\theta\theta})+\partial_Z W_{rz},
 \partial_R W_{r\theta}+2R^{-1}W_{r\theta}+\partial_Z W_{\theta z},
 \partial_R W_{rz}+R^{-1}W_{rz}+\partial_Z W_{zz}\right)
\]
with the same source derivative conventions as the raw graph.

The final radial source body is #4455275 and its zero-derivative native
application is #4455432. The actual final pressure normalization uses
\(P_{\rm final}=\)#4455439 and \(\rho=\)#633726. Its potential #4455781
and cutoff remainder \(A_{0,{\rm final}}=\)#4455782 satisfy
\[
 D_r p_m=g_{r,{\rm final}}-\rho P_{\rm final}-A_{0,{\rm final}}.
\]
The direct gradient #4456672 and staged gradient #4455794 agree after
cancellation of the two translated radial integrals. Direct mean axial
pressure derivative #4456702 equals staged #4455808 by lexical
alpha-equivalence. The older Signed pressure remainder #4229450 is
canceled by the pressure refresh. The Corollary 8.5 roots #4197521
and #4198320 enter the constructed after-Forced stresses. The replay
uses those resulting stresses in the ledger.

The Temporal potential is the actual native T1 application #4454155.
The radial equation gives the axial velocity #4454167 as
\(\gamma_d-A_1\), with explicit FTC root #4454182,
\(\gamma_d=\)#4454011 and \(A_1=\)#4454181. The actual normalized
desired inverse uses the centered source #4229836 and the original
`coupled-inverse:1`. The raw axial fast-time term #4456764 contains
exactly one copy of this Temporal term. The actual FiveMap axial
velocity #4455157 is auxiliary-fast-time invariant. Its separate
weighted full-line integral #4455163 is zero on the actual domain by
the FiveMap moment replay. Applying the original centered inverse
identity to the Temporal component gives
\[
 F_{\rm ax}=-c_{i_0}N A_1.
\]
The sign follows from the retained T1 cutoff subtraction. This
identifies the additional axial fast-time flat contribution inside
\(E_{z,{\rm final}}\). The other summands of the mean ledger retain
their own source estimates.

## VERIFIED · The radial phase exponent and its fixed-window lower bound

In source graph #635059, \(\Phi(R)=M_{\rm osc}R^{d_r}\). Its derivative
is #635060. Read \(Q=2^{-\ell}\), \(\epsilon=Q^h\),
\(\rho_g=\log(4-\sqrt2)/\log(4+\sqrt2)\), and
\(d_r/2=(1+h)\rho_g-h/100000\) from the retained original source.
Writing \(i_0=x-\delta\) with \(0\le\delta<1\) and
\[
 x=\frac{(1+h)(\ell-2)\log2-2\log(\ell-2)}{\log(4+\sqrt2)}
\]
gives
\[
 M_{\rm osc}=(4-\sqrt2)^{-\delta}2^{-2(1+h)\rho_g}
 (\ell-2)^{-2\rho_g}Q^{-h/100000}.
\]
The negative exponent on \(Q\) corrects the earlier pressure-norm
derivation. It also gives the gain used on manuscript page 92
\(M_{\rm osc}^{-1}\le12\epsilon^{1/100000}S_*^{\rho_g}\) since
\(S_*=\ell^2\), \(4-\sqrt2<3\), and \(2(1+h)\rho_g<2\).

The original localization source has
\(q_{\rm Big}=2^{-(\ell_{\min}+10)}\) and
\(\ell_{\min}\ge(64/h)^2\). The admitted range
\(q/Q\in[1/2,2]\), \(q<q_{\rm Big}\) implies
\(\ell>\ell_{\min}+9\). Write \(H=1/h\), so \(H>4096\) from
the original \(h=e^{-8002T_*}\), \(T_*>10\). In particular
\(\ell\ge4096H^2\). The exact inequalities
\(1/2<\rho_g<2/3\) follow by squaring \(14>9\sqrt2\) and
\(70<58\sqrt2\). With \(1/2<\log2<1\) and \(\log3<2\) this gives
\[
 \log M_{\rm osc}>
 f(\ell,H)=\frac{\ell}{200000H}-\frac43\log\ell-4.
\]
For \(H\ge4096\), \(f\) increases in \(\ell\) on
\(\ell\ge4096H^2\). The function \(f(4096H^2,H)\) increases in
\(H\) on that domain. Since \(\log(4096^3)<36\), the resulting
strict lower bound is \(99644/3125>31\). Thus the unit coefficient
bound is false throughout any nonempty admitted fixed N1 window.
The same lower estimate grows unboundedly with \(\ell\) at fixed
\(h>0\) if all admissible scales are considered.

## CONDITIONAL · Replacement bounds and uniform flatness

Use the manuscript's fixed-\(u\) formula (8.9), at fixed reference
band. Let \(U=R^{d_r}\) and \(b(r)=(d_r r^{d_r-1})^{-1}\).
With \(F(U)=b(R)f(R)\), each half-line integral contains
\(F(U+u,Z,T,y+M_{\rm osc}uv_r)\). The phase shift is independent
of all ordinary coefficient variables at fixed \(u\). The weighted
input uses the actual smooth zero extension at both intrinsic edges
and along the needed slow joins. This justifies differentiation of
the integral with no moving-support boundary terms.

Let \(E=\max(1,R_o,R_i^{-1})\). The change of variables in the
integral replaces \(du\) by \(dr/b(r)\). On the original shell,
\(1<d_r<3/2\), \(b\le E\) and \(|b^{(j)}|/b\le j!E^j\).
The formal product rule gives
\[
 |(b\partial_r)^j(b f)|/b\le a_j E^{2j}\|f\|_{C^j},
 \qquad (a_0,a_1,a_2,a_3)=(1,2,7,37).
\]
For \(1\le j\le3\), \(|\partial_R^jU|\le2E^j\). Integrating
over \(r\)-length at most \(E\) gives constants
\((1,4,32,384)_k E^{3k+1}\) for the whole integral and the sum
of the absolute derivative-integral bounds over its two halves.
This bound includes mixed ordinary derivatives. Combining the
actual cutoff derivative bounds \((1,2^{17},2^{36},2^{55})\)
with \(I_c=(1-\chi)A_--\chi A_+\) gives
\[
 \|I_c f\|_{C^k}\le (2,2^{18},2^{37},2^{56})_k
 E^{3k+1}\|f\|_{C^k},\qquad 0\le k\le3.
\]
At positive order, derivatives hitting \(\chi\) multiply the
whole \(A_-+A_+\). The coefficient-independent normalized pressure
mass and the same \(R^{\pm1}\) multipliers give these replacement
transfer factors.

| Actual output | \(k=0\) | \(k=1\) | \(k=2\) | \(k=3\) |
| --- | ---: | ---: | ---: | ---: |
| Normalized mean pressure difference per \(\|g_{r,{\rm final}}-g_{r,J_0}\|_{C^k}\) | \(2^{17}E^2\) | \(2^{44}E^5\) | \(2^{76}E^8\) | \(2^{108}E^{11}\) |
| Temporal potential per \(\|\gamma_d\|_{C^k}\) | \(2^3E^3\) | \(2^{21}E^7\) | \(2^{41}E^{11}\) | \(2^{62}E^{15}\) |

The realized \(C^2\) radial velocity has bound
\(\epsilon E^{11}(2^{41}\|\partial_Z\gamma_d\|_{C^2}+
2^{60}\|\gamma_d\|_{C^2})\). The realized axial bound is
\(2^{61}E^{11}\|\gamma_d\|_{C^2}\). These powers are compatible
with the original radial budget \(B_*\ge R_*^{4096}\), \(E\le R_*\).
The displayed transfers require the actual input seminorms and the
stated smooth zero extension.

The auxiliary Haar moments required by Lemma 8.2 follow for the
two identified inputs. For T0, the actual \(P_{\rm final}\) integrates
the same final source and the actual \(\rho\) has radial mass one.
For T1, the normalized original desired inverse has zero auxiliary
mean at each slow point, and multiplication by \(R\) preserves it.
These conditions give zero Haar mean of the full shifted whole.
The nonzero auxiliary modes of the whole require the oscillatory
estimate, and the full torus-dependent whole can survive pointwise.

Under the original all-order \(M_\alpha\) input bounds, each fixed
output derivative and integer \(p\) uses the manuscript's repeated
radial integration by parts on the smooth zero extension. The torus
Fourier inversion needs up to \(|I_y|+p+3\) auxiliary-torus
derivatives and the integration needs up to \(I_R+p\) radial
derivatives, with the requested slow derivatives also present.
The axial \(N A_1\) contributes one more torus derivative. The
desired inverse \(\gamma_d\) requires its own source derivative
loss. The factor \(M_{\rm osc}^{-p}\) then gives
\(\epsilon^{p/100000}\) times a fixed polynomial in \(\ell\).
For each requested \(q^N\) bound with fixed physical derivative
loss \(q^{-L}\), choose \(p\) with
\(h(\alpha+p/100000)>N+L\). This absorbs the remaining polynomial.
Actual all-order uniform weighted seminorms and all common seam
derivative domains remain open.

## Dependent evidence

- The earlier `first-pressure-norm` and `first-pressure-norm-c3`
  phase-bound fields, positive-order fixed-binder transfer factors
  and realized velocity norm factors require replacement. The
  previous `REPORT_KO` estimates using these factors inherit that
  correction. Order-zero integral bounds, cutoff and normalization
  geometry, the exact native T0/T1/FTC identities, and the
  independent radial envelope comparison remain valid.
- `whole-k-angular` and `jet-branch-diagnostic` use the unchanged
  radial envelope comparison. `n1-seam-collars` uses the unchanged
  actual Temporal velocity roots. `pressure-exterior`,
  `temporal-exterior` and `first-scale-closure` preserve their
  stated source and support results.
- The exact raw fixed-row projection, the principal nonzero
  Proposition 9.1/9.3 ledger and the present zero-mode scalar
  balances use exact source algebra. Their analytic hypotheses
  retain the same scope. Historical checkpoint byte-replays
  reproduce the original receipt bytes.

## Replay

Set `REPO` to the isolated MathScopeCompute checkout, `SCRATCH` to
`work/goal-next`, and `FULL` to the extracted `corrected-first-cycle-graph`
directory from run 43010593847. Run with Python assertions enabled.

```text
python check_mode_zero_flat.py --repo REPO --full-dir FULL --scratch-parent SCRATCH --pressure-receipt SCRATCH/pressure-exterior/corrected-pressure-exterior.json --principal-flat-receipt actual-principal-flat-ledger.json --wave-receipt repeat-own-wave-operands-detailed.json --out actual-mode-zero-flat.json
python check_radial_phase_sign.py --repo REPO --first-dir FULL --mean-receipt actual-mode-zero-flat.json --out radial-phase-sign.json
```

`actual-mode-zero-flat.json` SHA-256 is
`d0548a8520f7363294fd330aa332a79f32cb7a366c149b03a918ad3966915725`.
`radial-phase-sign.json` SHA-256 is
`3b5a526636b6646b620e7870a676c0f59b27648a8f0aceab5a88d6fc69ef7f91`.
The second replay pins the first receipt, authenticates the full
source stream and original localization program, and recomputes
the finite algebraic and norm majorants. Release remains HOLD.
