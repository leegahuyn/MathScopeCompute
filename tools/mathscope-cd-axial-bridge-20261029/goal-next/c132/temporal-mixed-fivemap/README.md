# Original mixed Temporal inputs for the FiveMap time derivative

This replay covers the two Temporal velocity derivatives requested by the original fixed-label FiveMap transfer. The radial component is $\partial_Z\partial_T\beta_{\mathrm{Temporal}}$ from original potential #22150943. The swirl is $\partial_Z\partial_T v_{\mathrm{Temporal}}$ at #22150797. The original centered inverse roots #22032008 and #22032006 and pressure derivative #22031648 remain unchanged.

For $\beta_{ZT}$, the C130 outer shifted FTC applies to the radial momentum flux and radial viscosity. The original flat traces at both radial endpoints make its whole derivative integral vanish. The replay retains the direct inverse of this radial source and the shifted primitive of the remaining axial and pressure source. The derivative requires two Z derivatives and one T derivative of the potential, with all lower Z,T orders for the Fourier limiting argument.

For $v_{ZT}$, the C127 native $E_\theta$ equation gives the exact projected fast term $-\Pi_0 v_{\mathrm{init},ZT}$. The remaining four Fourier evaluations are the original nonfast $E_\theta$ at values, Z, T and ZT, each paired with its $L^2$ derivative. The bound keeps the full radial divergence and cylindrical vector viscosity. The source coefficients $c_i$, $a(R)$ and the L,N directions have no Z or T variation on each fixed label.

The proof pins all 138 and 104 required initialized mean rows to the original C132 table, including $\beta_{Z^3T^2L^2}$, $\gamma_{Z^2T^2L^2}$ and $v_{ZT^2L^2}$. The two current bounds use original positive matrix, chart, and guard assumptions, the jointly ordinary source realization in R,Z,T and native torus, and the given fixed-label normalization. The original full Repeat, final jets and release remain open.

The original census calls 64 and 32 post-Signed covariance rows. Against the C130/C127 and spatial reference tables, eight fresh rows are separately attached for each derivative. Every additional row must have an immutable paired source receipt with the matching component and derivative. The incomplete-covariance negative control aborts before writing any norm. The accepted proof retains the original Fourier tail $\le25K^{-1/2}(\|f\|_2+\|L^2 f\|_2/36)$ uniformly on the common native chart for every differentiated pair.

After the finite coefficient debit, the conditional normalized fixed-label bounds are $|\beta_{\mathrm{Temporal},ZT}|\le\varepsilon^{99999/50000}S^{34}$ and $|v_{\mathrm{Temporal},ZT}|\le\varepsilon^{99997/100000}S^{25}$. Their pre-debit logarithmic coefficient ranks in $H/2^{128}$ units are 102658 and 102646. The exact operand census and both numerical results reproduced byte-for-byte.

## Replay

Use the pinned evidence root `WORK` and the repository evidence root `GOAL`. The first command is the pure dependency census. With `--numeric-out`, the second additionally rejects missing or non-identical numerical sources and computes the two bounds.

```text
python -B verify_mixed_temporal_census.py --work WORK --goal GOAL --out mixed-temporal-census.json
python -B verify_mixed_temporal_census.py --work WORK --goal GOAL --out mixed-temporal-census.json --numeric-out mixed-temporal-bound.json
```
