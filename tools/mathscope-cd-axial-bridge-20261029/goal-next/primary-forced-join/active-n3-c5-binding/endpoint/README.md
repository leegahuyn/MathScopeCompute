# Original active N3 mode-two endpoint and transport

The independent exact readback inspects the genuine N3 source graph, not a recreated coefficient. It authenticates the stream and registry, matches the actual fixed \(J_g^\delta\) lift in both eligible cases, and checks the two affine coordinates, their four first partials, and the cancellation of the physical radial pulse derivative. Literal positive \(\sqrt2\) is the only algebraic radical relation.

On the fixed own-label chart, the exact source operators give \(D_r v=D_z v=0\), \({\cal T}v=1\), \(D_r\xi=a_{\rm fast}\), and \(D_z\xi={\cal T}\xi=0\). Both common torus columns and the fixed nearest-copy offset remain in the source. The checker follows the complete pressure application \(w\mapsto v(Y)\), verifies the full complex potential and its declared native derivative calls, and independently reconstructs all six mapped velocity coefficient slots. Removing the cylindrical \(A_\theta/R\) term leaves a nonzero exact discrepancy.

The two archived candidates are \(\delta=0,1\). Their affine endpoint satisfies \(|\partial_{Y_i}v|<3 L_{\max}S/r_0\), from \(D_{\rm geom}>1\), the maximal column sum \(6\) of \(J_g\), and \(c_iL_s=2r_0\). All higher fixed-label derivatives of \(v(Y)\) vanish. An order-\(j\) common-coordinate derivative of the composed coefficient thus costs at most \((1+3 L_{\max}S/r_0)^j\). In the curl, the exact radial and axial cancellation avoids a pulse-chain loss in the first spatial operator. The velocity coefficient then uses the retained C4 gauge bound.

The independent degree replay gives these bounds with the common factor \(\delta_*^{-42}\zeta P(v(Y))\).

| Normalized coefficient | Degree of \(KS\) | Degree of the endpoint factor | Power of \(\varepsilon\) |
| --- | --- | --- | --- |
| Gauge C4 | 3165 | 4 | \(149999/100000\) |
| Velocity C3 | 3172 | 3 | \(99999/100000\) |
| Pressure C4 | 3172 | 4 | \(149999/100000\) |

Original normalized to physical scaling on the fixed own label is \(Q^{1/2-A}\) for potential, \(Q^{-A}\) for velocity, and \(Q^{-2A}\) for pressure. With original \(D=1/2-h\), \(\varepsilon=Q^h\), the physical axial derivative is \(Q^{-1/2}D_z\). The physical radial and azimuthal derivatives each have the same \(Q^{-1/2}\) prefactor. Physical time has factor \(Q^{-1}\varepsilon^{-1}\) against the normalized time operator. The formulas are for \(X_a<X<X_b\), the admitted slow chart and closed source pulse. Evaluating \(\delta_*^{-42}\) at a radial seam lies outside this estimate.

## Replay

Define GOAL_NEXT as the pinned evidence tree. Use the original hosted artifact directory as BUNDLE.

~~~sh
python -B check_endpoint.py \
  --bundle BUNDLE \
  --active-readback GOAL_NEXT/primary-forced-join/active-mode-two-witness/hosted-43288360518/n3-active-mode-two-readback.json \
  --checker GOAL_NEXT/primary-forced-join/active-mode-two-witness/check_active_mode_two.py \
  --previous-checker GOAL_NEXT/first-force-repair/verify_repaired_first_force.py \
  --inverse-receipt GOAL_NEXT/primary-forced-join/active-n3-c5-binding/active-inverse/n3-active-inverse-degrees.json \
  --out endpoint.json
~~~

For the same-family hosted 43296617887 BUNDLE, replace the active-readback option by both --same-family-join HOSTED/same-family-mode-two.json and --same-family-primary HOSTED/primary-c5-native.json. The same-family path checks the actual norm namespace, class rows and complete projected source operands against the same-run source graph. It raises Python's integer readback limit only for the SHA-pinned graph. The verifier needs temporary disk space for a stream copy and an eight-byte offset per node.

~~~sh
python -B replay_endpoint_bounds.py endpoint.json ENDPOINT_SHA256 \
  GOAL_NEXT/primary-forced-join/active-n3-c5-binding/active-inverse/n3-active-inverse-degrees.json \
  GOAL_NEXT/primary-forced-join/active-n3-c5-binding/check_n3_mode_two_degrees.py endpoint-bounds.json
~~~

The older 6,019,418-node exact replay passed 12,835,313 typed edges, all twelve endpoint pressure native calls and all sixteen mapped curl partials per branch. The same-family 43296617887 replay passed the same endpoint checks on 21,681,493 nodes and 43,980,655 typed edges. Its exact receipt is n3-same-family-active-endpoint.json with SHA256 5abe63bc103e29e14694528d5bac4733b84f217344679ddfdff0b65727e18d85. The subsequent bound receipt n3-same-family-active-endpoint-bounds.json has SHA256 496ae8a16a642171f8e6f17aef9ad091761f07000526479ea077522bc0634ef8.

The active frame method prepareActiveModeTwoFrame validates one live Primary and Initialized seal once, then checks the selected original frame at each supplied Forced branch. It checks literal Gaussian midpoint and integrand and does not need the whole Forced seal. Its Node syntax check passed. A fresh frame run and final Cartesian jet intervals remain separate.

The separate physical-transport replay checks the exact source coordinate exponents, normalized Cartesian operators, the phase derivative \(2ikD\Phi\), and the rotating cylindrical basis. It gives an explicit worst-case factor \(12^j j! U^j\) through order four. Here \(U\) bounds the actual scalar operator coefficient derivatives through C3, including \(2k{\cal T}\Phi\). This source-dependent supremum is open. A fixed-label operator formula alone gives no Cartesian jet interval.

~~~sh
python -B replay_physical_transport.py endpoint-bounds.json BOUNDS_SHA256 \
  /path/to/original/research-ide physical-transport.json
~~~

The same-family physical-transport receipt is n3-same-family-physical-transport.json with SHA256 7829836ce2331c75425a21dafd72262ba285c46f49afda0489076005b5f3c4bc.
