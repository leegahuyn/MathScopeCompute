# C85 first Forced coefficients on the original radial shell

## VERIFIED

The independent replay authenticates the 22,155,584-record original AST stream from GitHub run 44582875351. It checks all ten frozen sign/level charts and their two positive harmonics, all 120 real projected scalar roots and the actual zero-data native applications. For each root the original input is the source body after subtraction of the separately constructed principal pulse tail, composed with the actual \(H_w\), then fed through the native projection. The replay also checks the distinction between the original two primary pulse systems and the twenty Forced zero-data systems.

| Actual monomial class | Positive harmonic 1 | Positive harmonic 2 |
| --- | ---: | ---: |
| Linear Primary velocity | 1,760 | 0 |
| Linear Primary pressure | 70 | 0 |
| Separately subtracted principal pulse tail | 30 | 0 |
| Whole initialized mean × Primary velocity | 1,220 | 0 |
| Primary velocity × Primary velocity | 0 | 1,270 |

These counts use the exact sparse sum/product expansion of the raw source with retained analytic coefficient atoms. The whole mean uses definitions with bodies #21435335–#21435337. Source multiplication by the mean retains both the background and its initialized increment.

A control follows the actual \(\partial_Z^2 u_r\) jet #21441797 in positive mode 1 on chart 0:+. It occurs in raw source #21444294 and tail-subtracted source #21449789, with coefficient \(-\epsilon^3\). The projected real radial RHS #21661977 keeps it with coefficient \(\epsilon^3 P_{rr}\), where #21661925 is \(P_{rr}=(n_\theta^2+n_z^2)/|n|^2>0\) on the admitted nonzero-angular-normal domain. The actual formal diffusion slot therefore survives normal projection. An analytical relation among the actual source jets could still cancel a linear class.

## CONDITIONAL shell transfer

The C84 coefficient inventory requires C0, R and Z for each of the three components, plus ZZ for r and z, for each of a₁, f₁, f₂ on ten charts. That is 330 labelled complex roles. For the Forced coefficients the replay uses the actual cylindrical curl and the common-torus radial operator \(D_r=\partial_R+aL\), with \(L=\partial_{Y_0}+v_{r1}\partial_{Y_1}\). The original \(H_w\) is fixed in R,Z, and the exact affine identities on every chart give \(L(v)=0\) and \(L(H_w)=L(Y)\). Consequently \(\partial_R,\partial_Z,L\) commute with both the fixed-\(w\) pullback and endpoint substitution \(w=v(Y)\). The pulse cutoff is consequently constant in those three derivative directions on the fixed chart. The proof keeps the physical coefficients \(a,\epsilon,1/R\), the derivatives that hit them, and the normal quotient of the potential.

A sufficient downward-closed mixed derivative set for the actual projected forcing, matrix and potential prefactors is

\[
\mathcal I=\{1,R,Z,L,RR,RZ,RL,ZZ,ZL,RZZ,ZZZ,ZZL\}.
\]

The replay derives the set from the actual three curl remainder components and all 330 target roles. Across twenty original systems it gives 720 labelled complex projected RHS component roles. With derivatives in this set, the raw Primary velocity derivative totals are at most five for mode 1 and four for mode 2. The mode-1 bounds use Primary pressure through order four, the principal tail through order three and the complete mean through order four. The estimate here uses spatial orders only.

Write \(L_s\) for the original pulse length and \(\delta_*\) for the clipped minimum of the two radial log gaps. Let \(W=\zeta^\kappa\delta_*^{-p}\) be fixed along the pulse. Suppose the already-projected RHS through \(\mathcal I\) has a bound \(FW\), the original homogeneous propagator is bounded by \(C\) across every ordered pair in the pulse, and the nonzero-order matrix derivatives in \(\mathcal I\) are bounded by \(B\delta_*^{-b}\). Use the same norm for the vector, matrix and propagator bounds. The exact differentiated zero-data recurrence and ordered simplex volumes give

\[
\max_{\alpha\in\mathcal I}\|D^\alpha u(w)\|
\le C F W L_s\sum_{j=0}^{3}\frac{(7CBL_s\delta_*^{-b})^j}{(j+1)!}.
\]

Each coupling strictly lowers the total derivative order, and the largest row sum is at most \(2^3-1=7\). Thus the inverse preserves the supplied Gaussian exponent and gains at most finite additional polynomial poles under these hypotheses. The mapped curl has the same exponent if its required geometric factors and derivatives have finite pole bounds.

The distinction between the two projected angular harmonics matters quantitatively:

- Mode 2 has the product of two Primary factors, so the available half-Gaussian class yields \(\zeta\) times finite poles for the source, provided the projection coefficients and their required derivatives have finite pole bounds.
- Mode 1 retains linear and background-linear families. Existing half-Gaussian Primary inputs supply a half-Gaussian times finite poles for those families. A stronger bound for the initialized mean increment helps only its portion of the mean product. A uniform stronger bound on the surviving linear sum requires additional information about the actual coefficients or cancellation.
- A \(\zeta\) envelope for the final covariance follows if the paired exponents sum strictly above one and remaining poles are finite. If the paired exponents sum to one, the resulting bound retains the combined polynomial pole unless that pole is absent or controlled by an independent product estimate. For positive \(p\), \(\zeta\delta_*^{-p}/\zeta\) diverges as \(\delta_*\to0\), so a finite constant cannot absorb that loss at the same exponent.

## OPEN

Actual uniform weighted estimates of the projected source and matrix parameters across all original charts, the quantitative mapped-curl coefficients, and the retained-weight estimate for the complete linear mode-1 combination. These remain inputs to the effective covariance, renewed pressure, and full Signed shell closure. N7-06 and N8-05 remain open, final jets 0/67 and RELEASE HOLD.

## Replay

The script accepts the existing source evidence directory as GOAL, the hosted 44582875351 receipt directory as ARTIFACT, and the authenticated C80 immutable source cache as CACHE. RUNTIME is the pinned original runtime with the five M3 source modules, preserved under `continuation66/stage2/runtime-exact`. It pins each source and supporting receipt by SHA-256. Pass an unoccupied output path and run Python with assertions enabled.

```powershell
python -B verify_forced_shell.py --goal GOAL --runtime RUNTIME --artifact ARTIFACT --cache CACHE --out forced-shell-replay.json
Get-FileHash -Algorithm SHA256 forced-shell-final.json,forced-shell-replay.json
```
