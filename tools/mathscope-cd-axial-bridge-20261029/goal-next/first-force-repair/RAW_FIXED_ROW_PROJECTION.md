# Actual second Forced raw conservative projection on fixed rows

The replay reads the full 4,682,006-node live candidate and its native
registry from [GitHub run 43015175416](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43015175416).
The corrected preceding residual, the exact input candidate, and the
first Forced geometry are pinned by their source hashes.

## Exact operands and operators

The original real reference residual uses full velocity roots
\(\#4456434,\#4456435,\#4456436\) and full pressure root \(\#4456439\).
The independent rational derivative algebra replays the wave-dependent
parts of the three original conservative roots \(\#4456772,\#4456774,\#4456776\).
It retains the full mean velocity in the mixed quadratic terms and the
actual angular pressure in the gradient. The separate pure mean terms
are angle independent. Native derivative atoms are keyed by operator,
definition, exact actual arguments and orders. Indexed order slots use
the native directions. The derivative algebra builds the product-rule
form of the conservative divergence from the actual field roots.

For the live candidate, the same independent algebra reads every
\(m=1,2,3,4\) raw coefficient for ten fixed phase cases. The 240 exact
real and imaginary identities include the derivative of the radial
fast rate, the cylindrical connections, both angular velocity-pressure
families, and the product with the full mean. The verified numerical
coefficient ring uses rationals with typed source atoms. The ordinary
analytic interpretation requires the source functions to have those
derivatives at the stated arguments.

The wave operand replay matches all 160 actual amplitude and pressure
operands to the two original indexed field families, including the
primary and Signed homogeneous pressure and the first Forced full
pressure. It retains both conjugate arms. The mean replay checks the
actual post-Five mean, the reference-to-own arguments in all 1,296
field rows, and the 120 derivative-of-mean terms. Omitting the
radial chart factor fails all 120 controls.

## Transport and coefficient identification

For a fixed label let \(\rho=Q_{\rm ref}/Q_{\rm own}\). The checked
rows use
\[
 (R_{\rm own},Z_{\rm own},T_{\rm own})
   =(\rho^{1/2}R_{\rm ref},\rho^D Z_{\rm ref},\rho T_{\rm ref}).
\]
The physical radius is the same. At that radius the derivative of the
source radial phase has the same physical factor, multiplied by
\(\sqrt Q\) and the covering factor. The local covering division
\(\Lambda_g^{i(\ell_{\rm own})-i(\ell_{\rm ref}-2)}\)
leaves the same base exponent as the actual reference phase.
The exact time calculation uses \(T_g\) and \(Q^{1+h}\).
The checked source has \(\epsilon=Q^h\). With \(D+h=1/2\), the
three spatial physical operators therefore transport with
\(\rho^{1/2}\), and the normalized physical time operator with
\(\rho^{1+h}\). The derivatives preserve the native order
\((R,Z,T,Y_0,Y_1,\theta)\). The labels, copy and carrier
integers remain fixed throughout the differentiation.

The reference wave velocity and pressure are the same own-label
expressions multiplied by \(\rho^A\) and \(\rho^{2A}\), respectively.
The live own mean applies the inverse factors to the actual complete
reference mean. Every linear, viscosity, pressure and conservative
quadratic term therefore has the same total factor
\(\rho^{2A+1/2}\). The exact charged Fourier product rule agrees
with the ordered convolution. It also passed
[GitHub Lean run 43035073237](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43035073237).

On the common ordinary derivative domain, the candidate raw
coefficient thus equals the nonzero Fourier coefficient of the
preceding original residual for that row after removal of this
reference multiplier. The stencil readback supplies a zero neighborhood
for the inactive rows on the valid local chart. In a region where the
remaining row has the required ordinary derivatives, every
cross-row term has an identically zero factor. The
[principal flat ledger](PROP91_93_FLAT_LEDGER.md) identifies the
nonzero cutoff terms. Actual derivative gluing at all support seams,
the mode-zero flat bounds in \(F[1]\), and the uniform weighted
bounds for the supported \(G[1]\) remain open.

## Replay

Use the original extracted directories from the candidate replay guide.
Run the two operand checkers described in their companion reports and
retain their exact receipt bytes.

    python replay_repeat_conservative.py --first-dir FIRST --candidate-dir CANDIDATE --official-receipt independent-second-forced-candidates.json --out independent-repeat-conservative.json
    python check_repeat_row_transport.py --first-dir FIRST --candidate-dir CANDIDATE --official-receipt independent-second-forced-candidates.json --out repeat-row-transport.json
    python bind_repeat_raw_projection.py --out verified-fixed-row-raw-projection.json
