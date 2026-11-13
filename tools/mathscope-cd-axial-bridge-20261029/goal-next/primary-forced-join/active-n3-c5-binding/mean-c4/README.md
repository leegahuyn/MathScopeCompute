# Same-live N3 initialized mean: positive longitudinal demand

The 21,681,493-node source export and registry from hosted run 43296617887 are
distinct from the older 6,019,418-node witness. `check_same_live_v.py` verifies
their hashes, the existing same-run Primary C5/selected-Forced receipt, the
independent prior-edge readback, the actual temporal inverse and the relevant
source nodes. It writes `same-live-v-l2-covariance.json` without changing a
source checkout. The source registry records `sourceAuthenticated: false`;
the readback does not itself create an independent private live seal.

For the exact initialized mean used in the current's mode-one source, the
component v is #21435336 = background #17744974 + temporal #19570772 +
FiveMap #21374923. The temporal term is `-c0^-1` times the exact theta inverse
#19560947, `c0=#17745449`, and the source is Etheta=#17754253. The fixed-label
coefficient c0 uses frozen ell and earlier source roots only. The FiveMap v
definition has formals `(ell,R,Z,T)`, and the background contains no common Y.
The original Etheta is covariance #17754252 plus the original stress term
#17744077. That stress term was created before the two common Y coordinates;
the pinned prior-edge audit establishes forward dependence cannot occur. The
Haar projection therefore removes the stress term without setting it to zero.

Under the source Fourier inverse theorem, fixed-label smoothness and c0>0,
put `N=(sqrt(2)-1) d_Y0+d_Y1`, `L=d_Y0+(1-sqrt(2))d_Y1`, and
`Pperp=1-Haar`. For j>=1,

```text
N^j v = -c0^-1 N^(j-1) Pperp (D2 W_rtheta + epsilon d_Z W_thetaz),
D2 = d_R + a L + 2/R.
```

The actual source fields are indexed systems 1 and 4, representing the full
81-box, both-sign fixed-label cover; the required original support and flat
joins remain hypotheses of the field definition. Normalized Haar projection is
an L2 contraction and commutes with these constant torus directions and the
ordinary slow partials at fixed common Y. Thus the displayed source identity
gives the L2 inequality in the receipt. It is not a pointwise common-Y bound.

`check_v_covariance_demand.py` executes the Leibniz bookkeeping for the 52
positive-N v indices in the C3 mean-wave stencil. The source W derivatives
have total slow/N/L degree at most 4. If B bounds the enumerated W L2 norms and
A>=1 bounds both `||D^beta a||_infinity` and
`2||D^beta (1/R)||_infinity` for slow degree <=3, then for 0<epsilon<=1 each
of the 52 requested norms is at most `18*c0^-1*A*B`. The exact factor comes
from two direct terms and two Leibniz products with <=2^3 terms each. For
`R>=Rmin>0`, `||d_R^k(1/R)|| <= k! Rmin^(-k-1)` and all Z/T derivatives
of 1/R vanish. The bound is conditional: this work does not numerically bound
A, B, c0 inverse, or prove fixed-Y control.

The prior archived positive-N receipt covers all 52 index shapes but is a
different graph; its numerical endpoints are not transferred here. The 69
zero-N indices need mean total slow/L order 4, including L4; the previous
transverse receipt stops at L3 with total order 3. The original inverse-loss
route uses source L4 and L6 for that new case, and the radial term asks for
covariance L7. The existing full mean C3, cross C2 or pointwise certificates do
not automatically settle the new source or its finite fixed-Y bounds. Beta,
gamma, all zero-N parts, complete mode-one C3, final 67 jets and release remain
open.

Run the readback with the explicitly pinned node stream, registry, two hosted
receipts, temporal and pressure source files, and independent readback. All
paths are command-line arguments; see `--help` in `check_same_live_v.py`.
Then run:

```text
python check_v_covariance_demand.py same-live-v-l2-covariance.json NEW_OUTPUT.json
```

The resulting receipt was written as `same-live-v-l2-demand-coarse.json`.
No Lean compilation or Git mutation was performed.
