# Angular cross averages of the actual first FiveMap and Forced pieces

Bind F to the actual first post-Signed FiveMap increment and W to the
first Forced-only wave increment in the same completed N3 run
44582875351. Here W is exactly ForcedFullWave minus the InitializedWave
whose native carrier coefficients were checked by the same-live wave
replay. The separate Signed wave is outside W.

The FiveMap cylindrical components and their covariant derivatives
have physical angular mode zero. The admitted first Forced rows use
relative harmonics ±1 and ±2. Their actual phase is
p*theta plus an angle-independent function. The retained original
wave number k is the ceiling of the reciprocal of the positive square
root of epsilon. The original band rounds k times its unrounded
angular carrier and replaces a rounded zero by a signed unit.
Call this nonzero integer omega. The actual slope is p=omega/k, so
the physical angular frequencies are ±m*omega, never zero.
The phase and Fourier count use physical theta, which is distinct
from the original auxiliary torus variables. The native guards and
held coefficient arguments are independent of physical theta.

For the gradient, differentiating a mode in theta multiplies its
coefficient by i*m*omega. The cylindrical connection adds J/r times the
same mode. Radial and axial derivatives differentiate its coefficient,
local phase offset and cutoff without changing the angular mode on
an admitted smooth branch, where the label and integer carrier are frozen.
The same conclusion holds at a smooth
source join under the original flat support premises.

Use the same physical orthogonal rotation for both fields. It
cancels in the vector dot product. The gradients undergo
G -> R_theta G R_theta^T so both rotations cancel in the
Frobenius contraction as well. The angular Haar averages are
therefore exactly

    integral_theta <F,W> = 0
    integral_theta <grad F,grad W>_F = 0.

The average is linear across the original guarded cover rows.
Coincident nonzero carriers from two rows still have zero pairing
with the FiveMap cylindrical zero mode.

This identity permits addition of the two exact isolated energy or
dissipation integrands before radial or time integration, with each
field in its original physical scaling. It uses normalized full-circle
Haar. A coefficient-independent zero-cross guarantee for a uniform
sampled grid with N points requires no nonzero retained m*omega to be
a multiple of N, or removal of those explicitly aliased terms.
For example m=omega=2 produces a false mean on the four-point grid.
The ordinary physical branch premises, actual numerical energy and
dissipation intervals, cross terms of wave pieces, force and later
cycles retain their own proofs. N8-05 is 0/4, final jets 0/67,
and RELEASE HOLD.

Replay from the preserved workspace with Python 3.

    python verify_cross_angular.py WORKSPACE NEW_RECEIPT.json --join-receipt wave-join-parent.json

The verifier checks the complete original streamed SHA and uses a
byte-per-node angular-dependence ledger, without writing a large
uncompressed graph copy.
