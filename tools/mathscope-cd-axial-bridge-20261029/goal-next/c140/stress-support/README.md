# Native tangential stress support in the materialized N3 Repeat

## VERIFIED. The retained source operands

The replay reads the original GitHub run 44682703381 export. It verifies the
complete 22,380,596-node stream against its SHA-256 manifest. A separate
regeneration from the pinned positive-stress producer matches the first
123,869 nodes byte for byte, through all six forward and backward primitives.
The tighter order-one prefix also matches its recorded proof. The replay reads the
actual normalized tangential stress roots and observes a four-term sum in each
component. The summands are one unguarded leading expression and three
original positive-order stress expressions, each with the original positive
order weight. The exact leading branches use the ordinary radial prefixes
of the materialized source, including the leading pressure datum and both
viscous shear terms.

| Component | Leading body | Normalized band body | Positive orders 1, 2, 3 |
| --- | ---: | ---: | --- |
| Angular | 17732694 | 17732874 | 117068, 120800, 123850 |
| Axial | 17732695 | 17732877 | 117069, 120807, 123857 |

These six positive stress IDs and their forward and backward integrals match
the original order-three receipt in `axial-alln/order-three.json`. For each
row the readback checks the signed FTC, whole-density equality, backward sign,
complete conservative zero and endpoint-matching conclusion. The readback of
the actual order-one axial integrand 117047 yields
`smooth_piecewise(X, Xminus, Xplus, 0, 117045, 0)`. Here 117045 is the interior
raw density. The native integral uses its bound-variable form with fixed
endpoints. Angular order one has right endpoint Xb. Axial order one and both
components of orders two and three have right endpoint Xplus. The exact source
support proof gives Xa < Xminus and Xplus < Xb. These operands have zero
exterior branches and matching jets from the finite stress proof. The time
cutoff and q-power multiplying them do not enlarge their support.

## CONDITIONAL. Leading exterior cancellation on the pinned analytic source

The leading bodies are sums, with neither a literal zero guard nor a sampled
root that can prove their zero exterior. Apply the analytic identities to the
actual F, U, M and pressure operands. This analytic argument uses the pinned
natural-core, moment restoration, heat and smoothness contracts.

At the inner edge the prepared F and U choose the same natural solution for
0 ≤ X ≤ Xa. The natural solution uses the actual A.21 pressure-axis datum.
The manuscript's equation (4.13) and its regular-axis construction on PDF
pages 33, 36 and 44 give zero leading tangential residual there. Regular-axis
forward stresses have zero integration constants. Thus both leading stresses
are identically zero for 0 < X ≤ Xa, with their ordinary continuous value
at the axis. No evaluation of a ratio at X = 0 is needed.

For the outer edge the actual A.2/A.19 producer solves the two affine M and J
conditions and the continuous quadratic S condition, including the exact
exterior power contribution. The original B.8 and actual C.12/I1 correction
preserve all five moments. The A.7 heat edit together with its actual I2
defining equations preserves I, S and the centrifugal pressure integral Cp.
The already executed complete (5.19) audit includes the pre-heat integration
constant and the A.11/A.13 reset and wait. Its conclusion is the zero
subtracted I moment, not merely a zero difference between two edits. The
native U and M are zero in a strict collar of Xv, and the stream reconstruction
makes v zero there. The leading pressure is precisely the radial-infinity
normalized centrifugal primitive because its axis datum and total Cp match.
The source heat producer retains the entire Gamma heat exterior and an
eta-independent amplitude, with both terminal cutoffs equal to one from Xb
onward.

These are the hypotheses of the pinned manuscript's Lemma A.8, PDF pages
140–141. This lemma uses absolute convergence of the **subtracted** angular
moment, its dominated differentiation and the radial transport and viscous
boundary terms. Equation (A.46) expresses the original forward weighted
stress primitives as backward integrals of the exact heat-exterior residuals.
Those residuals are zero by Lemma A.6, with zero axial pressure gradient.
Consequently leading angular and axial stresses are zero for X ≥ Xb. The
swirl and pressure themselves may be nonzero on that exterior. The closed
radial edge and all inward traces use the same source smoothness and flat
factors on the collars, as in (4.32)–(4.33) and (A.48)–(A.49). At eta = ±1
the statements concern the source's one-sided eta derivatives.

The conclusion is a mathematical support implication for the exact producer.
The Python replay checks the actual operand bindings and the finite native
stress receipt. It does not independently establish the manuscript's
analytic leading-core or whole-moment existence contracts.

## Effect on the adjacent reference-label mean seam

Use the C139 adjacent references a and b = a + 1 at a fixed admitted
physical slow point, with 1/2 < s_a < 1. In a coordinates the two complete
radial envelopes are respectively
`[sqrt(Xa), 2 sqrt(Xb)]` and `[sqrt(Xa/2), sqrt(2 Xb)]`. The physical shell
has endpoints `sqrt(2 s_a Xa)` and `sqrt(2 s_a Xb)`. The symmetric difference
of the radial envelopes therefore lies strictly in X < Xa or X > Xb,
where X = R_a²/(2 s_a). The same physical X and eta appear in the native
stress chart substitutions. Both stress components and their radial
derivatives vanish on the extra intervals under the analytic source
contracts above.

For the original current-stage mean, the six covariance components are
assembled with global shell guards. The radial derivative of any such
component and the axial derivative at fixed R are zero on the strict
exterior collars. The resulting gr is zero there, as is the reserved rho
bump. Put f = gr − rho P. The pressure expression is
`p(R) = integral_left^R f − chi(R) integral_left^right f`.
On the inner collar the partial integral and chi are zero. On the outer
collar the partial integral already equals the whole integral and chi is
one. This proves exterior pressure support even before using the separately
verified identity `integral_left^right f = 0`. That identity is needed to
remove the pressure cutoff remainder in the compatibility and moment
identities. The same stress support yields zero radial weighted boundary
flux at each of the four envelope endpoints. Every derivative here is
taken inside the common admitted open overlap with the stated exact-source
regularity.

This removes the stress and current mean pressure exterior collars as
potential differences in comparing the two exact radial integrals. The
interior transport of the full Repeat stage, the exact later gauge and
velocity integrands, derivative interchange across its complete native
indexing, and all recursive orders beyond the materialized N3 graph retain
their separate proof obligations. M3 remains 62/64, final jets remain 0/67
and RELEASE remains HOLD.

## Replay

Run from the workspace root with Python 3.10 or later. All checks use the
standard library and stream the compressed graph without storing it in
memory. The input archive and source pins are specified in the script.

    python work/goal-next/continuation140/stress-support/check_native_stress_support.py
    node work/goal-next/continuation140/stress-support/rebuild_order_three_prefix.mjs

The two captured executions should agree byte for byte.
