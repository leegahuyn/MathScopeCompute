# Directed cell weights for the original moving annulus

**Verified geometric integration.** The pinned original physical annulus
uses \(X_a\le X\le X_b\), \(|z/z_0|\le 1/\sqrt2\), and
\(\rho=\tau/\tau_0\in[1/2,1]\). Set \(u=\sqrt2 z/z_0\),
\(v=(X-X_a)/(X_b-X_a)\), \(Q=q/\tau_0\), \(B=u^2/2\) and \(s=\rho+B\).
The implicit coordinate equation is \(Q=\rho+BQ^{2h}\). The normalized
physical measure after the full angular integral has common prefactor
\(\sqrt2\pi\tau_0(X_b-X_a)\) times \(Q\,dv\,du\,d\rho\). On the
endpoint slice \(\rho=1/2\) use \(Q\,dv\,du\).

On \(Q\ge1/2\), the derivative of \(Q-BQ^{2h}\) is at least \(1-2h>0\).
The admissible root lies in \([1/2,2)\) because the expression at
\(Q=\rho\) is at most \(\rho\) and its value at \(2\) is strictly
above one. Since \(s\in[1/2,3/2]\), the logarithm is
2-Lipschitz between \(Q\) and \(s\). Write \(x=2h\log Q\).
The exponential series for \(|x|<1/32\) gives
\(\lvert e^x-1\rvert<3h\) and
\(\lvert e^x-1-x\rvert<3h^2\). Therefore
\[
 |Q-s|\le3hB,\qquad
 |Q-s-2hB\log s|\le B(3h^2+12h^2 B)\le9h^2B.
\]
This is a pointwise bound on the original implicit \(Q\).

For a cell let \(J=\int s\), \(I_B=\int B\) with its relevant coordinate
volume. Bound the minimum and maximum of \(s\) using the endpoint values
of \(\rho\) and the range of \(u^2\). Bound their logarithms by the
nine-term atanh series in \(y=(s-1)/(s+1)\).
The common remainder bound is
\(2\cdot 3^{-19}/(19(1-1/9))\). Its domain is \(-1/3\le y\le1/5\).
Round the lower and upper bounds outwards to multiples of \(2^{-20}\).
Denote the resulting bounds \(L\le\log s\le U\). Thus the cell's weight
apart from the common prefactor is enclosed in
\[
 [\,J+2h I_B L-9h^2I_B,\; J+2h I_B U+9h^2I_B\,].
\]
The two finite logarithm approximants are monotone in \(s\), since the
truncated atanh polynomial is increasing, the error bound is fixed,
and outward rounding preserves order. Hence child interval sums
are nested in the parent interval. The \(J,I_B\) terms are conserved
exactly. The replay checks strict enclosure within the earlier
\([J-2hI_B,J+4hI_B]\) totals at every resolution and monotonicity
between all consecutive resolutions.

The highest recorded resolution uses 64 endpoint cells and 4,096 slab
cells in \((u,\rho)\), with the full radial interval retained. Its
interval width compared with the earlier geometric width is at most
\(727519217/12884901888<0.0565\) on the endpoint and
\(93842612365/1649267441664<0.0570\) on the slab. These are worst-case
ratios over the original \(0<h<1/64\). Multipliers involving \(\pi\)
and \(\tau_0\) cancel in the ratios.

For a nonnegative final-field integrand, interval multiplication with a
same-cell enclosure can use these weights directly. For signed work or
boundary terms use the extrema of all products and the appropriate
boundary weight. The existing proof of geometry gives no quantitative
integrand variation or value information. Whole-annulus final-field
energy, grid and Fourier refinement, N7-06 and N8-05 remain open.

## Reproduce the weight receipt

```text
python -B refine_annular_weight.py --measure-source ORIGINAL_ANNULAR_MEASURE_JSON --out NEW_RECEIPT_JSON
```

The pinned input is the prior original
`whole-k-annular-initial/energy/annular-measure.json`. Evaluation uses
only Python integers and rational numbers.
