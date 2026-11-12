# First actual supported forcing and its derivative demand

This replay uses the 4,197,115-node first corrected Forced graph
from GitHub Actions run 43010379487. Its uncompressed stream has
SHA-256 `1ab376e369484c63e17b0d891eebcc18ddedf53f8e6acb907bc9ec8c05d51fc3`.
The initialized state and residual operators are from the pinned
manuscript's (8.3), (8.12), (9.1)–(9.2), Proposition 9.5 and the
original `source-initialized-angular.mjs` producer.

## VERIFIED · 120 corrected raw coefficients and the highest jets

For each of the ten original difference/sign cases, the checker
constructs the cylindrical conservative harmonic operator independently
from the actual native wave, its angular pressure, the same actual
initialized mean, and the exact angle in the original own-label body.
It compares all 120 real and imaginary components to the raw roots
and then subtracts the authenticated primary tail. The original
radial and time cover factors \(\Lambda_g^{-d}\) and \(T_g^{-d}\)
are retained, as are the carrier, geometric connections, and every
ordinary derivative of the wrapped native coefficient.

The normalized initialized mean uses roots #3675280, #3675282 and
#3675284. Each is the original reference-chart native field evaluated
at the same lifted actual tuple and multiplied by #3675278. Their
defining bodies #3675273–#3675275 use the original background plus
the actual \(J_0\) perturbation #3614790–#3614792. The angular-independent
pressure body #3675276 consists of the original background pressure
#622935 and the rebuilt \(J_0\) mean pressure #3615361. Its pressure
gradient belongs to physical angular mode zero. The replay finds no
application of this pressure in either positive nonzero harmonic.

In mode 1 the actual corrected source contains the primary wave's
linear residual and its interaction with the initialized mean. For
every component and both complex parts the same-wave native
\(\partial_R^2\) term has coefficient \(-\epsilon\), and the same-wave
native \(\partial_Z^2\) term has coefficient \(-\epsilon^3\).
Both terms survive the actual subtraction. Every real or imaginary
component also retains first native derivatives of the initialized
mean. The highest retained angular pressure derivative is first
order. These statements are exact in the typed coefficient algebra.

In mode 2 the source is unchanged by the correction. Every monomial
is of degree two in the actual Primary wave values or jets. The
highest wave derivative is first order. The phase-dependent part
is exactly \(2ik(n_\Phi\cdot a)a\), with \(a\) the positive complex
wave coefficient and
\(n_\Phi=(D_r\Phi,R^{-1}\partial_\theta\Phi,D_z\Phi)\). The exact
leading real native bodies satisfy \(n_\Phi\cdot\Re a=0\) on all ten
charts, by direct polynomial comparison using their original curl
factors. The remaining contraction therefore uses the actual
imaginary full-curl remainder. This establishes the needed
phase-derivative reduction in the conservative polynomial itself.

## CONDITIONAL · What the primary C2 class transfers

For the actual joined source, suppose the local Primary leading
coefficient has \(W_{1/2}\) bounds and its full-curl remainder has
\(W_{1-\kappa_s}\) bounds through order 2. These are the two class
outputs of the isolated hosted Primary order-2 run 43035074273.
The original derivative and geometry bounds have
\(D_r=\partial_R+a_r L\) with \(a_r\) costing at most
\(\epsilon^{-\kappa_s}\), \(D_z=\epsilon\partial_Z\), and
\(k=O(\epsilon^{-1/2})\). The normal and connection coefficients
carry their fixed shell and polynomial factors. Then the mode-2
source has its full \(W_{1-\kappa_s}\) bound through order 1.
Indeed, differentiating its phase-free quadratic part uses at
most two ordinary wave derivatives. Its phase part contracts
one curl remainder and one complete primary amplitude, giving
\(\epsilon^{-1/2}\epsilon^{1-\kappa_s}\epsilon^{1/2}\).
Products retain the stronger \(\zeta P(v)^2\) weight, which is
bounded by \(\sqrt\zeta P(v)\). This transfer needs neither the
initialized mean nor a mean pressure bound.

The original palette difference \(d\in\{0,1,2,3,4\}\) determines the
common-torus factors. The own-to-reference band ratio is
\(\rho=2^{\ell_{\rm own}-\ell_{\rm ref}}\), which uses the original two
dyadic band indices. The fixed slow substitutions and
normalization contribute only fixed powers of \(\rho\), including
\(\rho^{2A+1/2}\) for the residual coefficient when converting an
own value to reference normalization. \(X\) and its edge distances
agree at the same physical point. \(S_{\rm own}/S_{\rm ref}\le9/4\)
for \(\ell_{\rm ref}\ge8\), and
\(\epsilon_{\rm own}/\epsilon_{\rm ref}=\rho^{-h}\). These factors
cause no loss in the exponent. The actual fixed-lift map \(H_w\)
has \(v(H_w)=w\) and retains the Gaussian weight. Its fixed-label
Jacobian supplies the previously proved \((5/4)^s\) factor for
ordinary derivatives of order \(s\). The two signs, fixed label/copy,
and original coordinate branches remain part of the estimate.

For mode 1 the principal homogeneous cancellation and the primary
cutoff subtraction lead to the remainder in (9.2). With the actual
source class hypotheses, this remainder has \(W_{1-3\kappa_s}\)
and the initialized mean interaction has \(W_{1-\kappa_s}\), since
the tangential mean has exponent \(1-\kappa_s\) and the radial mean
has an extra \(\epsilon\). The exact coefficient demand is as follows.

| Requested raw forcing order \(s\) | Primary wave in mode 1 | Angular pressure in mode 1 | Initialized mean in mode 1 | Primary wave in mode 2 |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 2 | 1 | 1 | 1 |
| 1 | 3 | 2 | 2 | 2 |
| 2 | 4 | 3 | 3 | 3 |
| 3 | 5 | 4 | 4 | 4 |

The two strongest immediate transfers from a joined Primary C2
would therefore be mode-2 order 1 and mode-1 order 0 after the
separate initialized mean order-1 bound. The latter also needs
the original homogeneous amplitude cancellation on the common
ordinary derivative domain. The exact subtraction retains the
earlier verified half-amplitude factor. This replay does not divide
by the flat cutoff.

## OPEN · First actual gaps and the initialized mean route

GitHub run [43219432398](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43219432398)
completed the live same-family order-two join and verified the 120
native components in the new graph namespace. The separate initialized
mean replay now supplies [conditional fixed-reference spatial C2 bounds](../whole-k-annular-pressure-lower/MEAN_SPATIAL_C2.md).
The live order-three rerun [43232163618](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43232163618)
has passed runner preparation and the checker controls. It is still building
the source join. The spatial mean result needs the original weighted norm,
fixed-representative transport and live-family binding before it supplies the
mode-one forcing class. The coefficient transfer is conditional on the
original same-source Primary class and the smooth zero extension
along the full actual pulse path. The exact product ideal shows
zero when the retained wave/pressure jets and primary cutoff jet
are zero and their companion operands are defined. Positive-order
intrinsic shell, transverse and slow seam regularity remains an
analytic condition.

The original mode-one route needs the actual initialized mean with its
weights and charts through \(C^1\). Its early Temporal source includes raw axial
residual #643883 and the original shifted-pressure axial derivative
#643849. The corrected fixed-\(u\) operator preserves ordinary derivative
order under the actual smooth zero extension. The improved Temporal
inverse costs two ordinary source derivatives. The realized radial
velocity adds a \(Z\) derivative. Thus an available sufficient route
to the pre-Five Temporal velocity through order 1 uses actual early
axial residual through order 4. The pressure inside that residual
requires same-source pre-Haar covariance through order 6, since
one derivative forms \(g_r\) and one is the axial pressure derivative.
These are sufficient derivative orders for this operator composition.

The actual initialized FiveMap then requires all three early fresh
defect targets. Its order-1 radial velocity needs targets through
order 2. The full original fresh-target estimate at order 2 needs
pre-Five mean velocity through order 4 and background/covariance
through order 3. Along the same sufficient route that increases the
early axial input demand to order 7 and its upstream covariance
to order 9. A directional estimate of the integrated actual targets
may lower that sufficient demand. The isolated Primary order-2
class, mean-pressure exterior identities, and fixed FiveMap
coefficient inverse do not supply those actual derivative norms.

For mode-1 order 1 there is the additional independent Primary C3
obligation, already witnessed by the second-order typed jets after
subtraction. The full first correction \(C^1/C^2\) route through the
mapped curl uses raw forcing orders 2 and 3 respectively. The table
gives the corresponding Primary, angular-pressure and initialized
mean demands. Actual weighted norms and all remaining statuses
stay OPEN. RELEASE HOLD.

## Replay

Use Python with assertions enabled, `REPO` containing the existing
conservative replay and the extracted first Forced graph as `FIRST`.

```text
python replay_g0.py --repo REPO --first-dir FIRST --out actual-g0-order.json
```
