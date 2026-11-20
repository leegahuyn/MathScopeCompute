# Original FiveMap first time derivatives

The authenticated 22,155,584-node source has FiveMap increments #22151963, #22151941 and #22151945 for radial, swirl and axial velocity. Their native arguments are the fixed label, R, Z and T. The live potential #22151952 uses the forward unshifted primitive #22151950 of $r\gamma_F$. Its whole counterpart is #22151951. The earlier Temporal potential #22150943 has separate shifted primitives.

The actual scale #17732766 is the registered root with only Z and T as inputs. The same $s$ therefore applies along the entire radial primitive, where $R=\sqrt{s}\,x$. The original flat bump copies satisfy $1\le\log(X/X_0)<2$ because $\log(11/10)<1/10$. Their whole support lies strictly inside the fixed positive radial endpoints #17743711 and #17743713 by the original $X_a<X_0<e^5X_0<X_b$ and $1/2\le s\le2$. The protected axial coefficients satisfy $c_0+e^d c_1=0$, with the same $e^d$ in the second bump argument and normalization. The whole primitive is $s^{1-A}\mu_3(c_0+e^d c_1)=0$. Its T and ZT derivatives are zero on the admitted smooth branch. The live and compact comparator therefore agree through these ordinary derivatives. All three FiveMap increments have flat radial support traces.

The actual fresh P, Jθ and Jz bodies are #22151513, #22151576 and #22151635. Their native applications bind only the fixed label, Z and T. The fixed-label radial derivative in time is $-\varepsilon R^{-1}\int_\alpha^R r\gamma_{F,ZT}\,dr$. Gamma T uses the two Jθ-dependent copies and swirl T the three P/Jz-dependent copies. The product rule retains $s(Z,T)$, the actual normalized target powers and the positive original matrix inverse factors. The necessary moment orders for this coefficient route are P and P_T, Jz and Jz_T, and Jθ, Jθ_Z, Jθ_T and Jθ_ZT.

## Exact mean reductions

Centering and translation invariance give zero normalized Haar mean for the Temporal velocity and its ordinary derivatives. The linear Temporal beta terms in the fresh radial time and vector viscosity consequently have zero Haar mean. The initialized $\beta_{TT}$ and $\beta_{ZZT}$ inputs survive. The quadratic and initialized–Temporal cross products also remain.

For radial weights $w=1$ and $w=R^2$, the radial flux term in the bulk is $(w'-w/R)\overline U$. The radial viscosity has zero bulk term because $w''-w'/R=0$. This identity retains the original flat traces for both radial integrations by parts. The factors $R^2$ in the angular moment and $-1/2$ on the weighted radial contribution in Jz are from the actual mean source.

The $\gamma_{\mathrm{Temporal},ZT}$ product uses $\varepsilon\gamma_{\mathrm{Temporal},ZT}=-(D_r+1/R)\beta_{\mathrm{Temporal},T}$ at fixed label. For original weight $w$ and factor $f$, the transferred bulk integrand is $\beta_{\mathrm{Temporal},T}[D_r(wf)-wf/R]/\varepsilon$ and its radial trace is $-[w\overline{f\beta_{\mathrm{Temporal},T}}]/\varepsilon$. Periodic Haar and flat support remove the traces. The factors are $V+v$ with $w=R^2$ for Jθ, and $b+\beta$ for the mixed pressure term. Only R and L derivatives of those factors are added. The initialized $\gamma_{ZT}$ and the $v_{ZT}$ term in Jθ remain.

The pressure path retains $\beta_{\mathrm{Temporal},ZT}\gamma$. The corresponding $\psi_{\mathrm{Temporal},ZZT}$ goes through the actual twice differentiated axial W+ pressure source. Its highest covariance is $W^+_{rz,Z^4T}$, paired with $L^2W^+_{rz,Z^4T}$ in the chosen Fourier estimate. Separate $P_{ZT}$ or $J_{z,ZT}$ requests can recover the higher $Z^5T$ branch. They lie outside the first FiveMap T scope. A generic compact annular double-FTC control proves that the ordinary $Z^4T$ path can survive. Its rational polynomial check gives $P_T/\varepsilon^2=64/315$ and $J_{z,T}/\varepsilon^2=32/77$. The control establishes dependence of the transfer operator, while the actual covariance values require their own source proofs.

The pinned conservative C103 recurrence expands this transfer to 157 typed W+ and 266 initialized mean input rows, including the lower directions and Fourier partners. Relative to the C130 and C129 pinned tables, 76 and 104 rows respectively lie outside those coverage lists. Of those, 28 covariance and 48 mean requests have positive time order. A new whole-velocity norm still requires numerical bounds for the high Temporal $\beta_{ZT}$ and $v_{ZT}$ inputs and the differentiated finite matrix geometry.

## Reproduction

`PROTECTED_EXPORT` is the immutable C70 original source export, `WORK` the previous-cycle evidence root and `GOAL` the repository evidence root. Python verifies the entire protected stream SHA-256 and extracts the required source records. Both extraction and proof ran twice.

```text
python -B extract_protected_fivemap.py --artifact PROTECTED_EXPORT --out protected-source-slice.json
python -B verify_fivemap_velocity_time.py --work WORK --goal GOAL --source protected-source-slice.json --out fivemap-velocity-time.json
```
