# Original first-cycle gauge operands

`bind_first_cycle_gauge.py` replays the authenticated full post-Five graph.
The historical calibration reads all 4,420,257 original records and the
native registry. The corrected replay reads the same typed operations
from its own exported graph. Node numbers from the historical receipt
carry no authority in the corrected graph.

## Actual component bindings

- Signed has ten fixed band/sign cases and three original native potential
  coordinates per case. At the positive fundamental its normalized
  potential is `i C/2`, with negative complex conjugate on the same
  phase. The checker reads each actual zero-order application from the
  generated velocity, verifies the exact fixed xi/v and representative
  substitutions, checks the two arms of the leading phase cross product,
  and replays the full imaginary cylindrical curl. The derivatives
  include the original own-chart radial fast coefficient and `C_theta/R`.
  All original 162 row mappings and the actual reference scaling are
  checked against the source registry.
- The actual Temporal meridional potential is the native `T1` expression
  `R^-1 (I_left − chi I_whole)`, with the same actual shifted integrand,
  binder, and inner bound in both integrals. The checker recovers its
  radial and axial curl components from their physical velocity lineage
  and verifies all common-torus derivative terms. The direct azimuthal
  increment is the actual `−ci0^-1 inverse_theta`.
- The actual FiveMap meridional potential is `I_left/R`. The checker
  separately retains `(I_left − chi I_whole)/R` and identifies the first
  expression as the one differentiated in the actual radial velocity.
  Its direct azimuthal increment is the original post-Signed FiveMap bump.
- The complete pressure increment is the full post-Five pressure minus
  the authenticated initialized J0 pressure. The latter is read from
  the actual initialized mean function and the original auxiliary
  indexed angular-pressure field. The same completed background pressure
  cancels. Both mean stages and all angular pressure contributions remain
  present before the subtraction.

The historical replay reads J0 pressure #3823049 and final pressure
#4419702. Temporal uses potential #4417418 and direct swirl #4417272.
FiveMap uses #4418427 and direct swirl #4418416. Its separate compact
candidate and raw whole are #4418431 and #4418426.

The corrected GitHub first-cycle artifact from run 43010593847 contains
4,456,994 nodes. Its replay reads J0 pressure #3859821 and post-Five
pressure #4456439, Temporal potential #4454155 and direct swirl #4454009,
and FiveMap potential #4455164 and direct swirl #4455153. The corrected
compact candidate #4455168 and whole #4455163 are retained separately.

The first Forced contribution is recorded separately in the adjacent
`final67/first-forced-gauge.json`. A complete original increment gauge
combines the first Forced and Signed wave potentials with
`(psi_Temporal+psi_FiveMap)e_theta`. Its direct swirl is the sum of the
two displayed direct azimuthal increments.

## Physical normalization and exterior branches

On a fixed original label let `rho=Q_ref/Q_label`. The source evaluates
the own-chart potential at `(sqrt(rho) R, rho^D Z, rho T)` with the
same frozen labels, torus arguments and angle, and scales it into the
reference chart by `rho^(A-1/2)`. The physical potential then carries
`Q_ref^(1/2-A)`. Indeed every physical cylindrical curl derivative
contributes `Q_ref^-1/2`. In the axial derivative this is
`Q_ref^-D = Q_ref^-1/2 epsilon`, since `D=1/2-h`.
The direct azimuthal coefficient carries `Q_ref^-A` and the complete
pressure difference carries `Q_ref^-2A`. The physical Cartesian
potential uses `(A_r cos(theta)−A_theta sin(theta),
A_r sin(theta)+A_theta cos(theta), A_z)`.

The wave potentials require the actual lazy fixed-band, slow-shell,
transverse and pulse guards in the global assembly. Those original
guards produce zero outside their branches. The Temporal potential has
the retained compact `T1` subtraction. On an exterior slow radial region
where its desired axial source vanishes for every torus argument, the
shifted partial integral is zero below the envelope and equals the
whole above it. The corresponding cutoff plateaux give zero in both
exterior regions. These replays do not independently establish that
exterior source support or the Temporal direct swirl support.

## Actual FiveMap weighted whole

`prove_five_whole.py` binds the actual integral nodes and the two native
axial profile terms. The coefficient roots have no radial or auxiliary
free coordinate. The actual band scalar `s` depends on `Z,T`, with
`s` in `[1/2,2]` on the original chart. Set `d=1/5` and
`eta_j(x)=exp(-jd) eta_0(x exp(-jd))`. Changing variables
`R=sqrt(s)x` in the actual weighted whole gives

    I_whole = s^(1-A) mu_1 (c_0 + exp(d)c_1) = 0.

The exact last equality is checked on the current coefficient operands.
The common envelope contains the entire bump supports. The inherited
terminal tree has `Xb=XR exp(Q_end+3)`. Its terminal log correction is
`log(#259/#275)/(1−h)`. The source terms imply `#259>1`: its leading
term contains `exp(-(1−h)/2) (1−h)(−4 log h)` and all other terms are
nonnegative since `0<h<lambda<1` and the source step lies in `[0,1]`.
The exact source step is monotone and has total variation one on its
active strip. This gives `0<#275≤h co exp(3)/(1−h co)<1` using
`co=1/256` and `h<1/64`. Thus the correction is positive and the
terminal radius exceeds `XR exp(60001 T+5)`, while `X0Imean` equals
`XR exp(60001 T−6)`. Also `Xa=4/Lambda<X0Imean`. The two positive
axial bumps satisfy `X0Imean < x^2/2 < exp(5) X0Imean` on their
supports. Scaling by `s` fits them strictly between the actual
bounds `sqrt(Xa)` and `2 sqrt(Xb)`.

The actual unmodified FiveMap potential therefore equals the separately
retained compact candidate on the original domain and vanishes on its
radial exterior branches. The ASTs stay distinct. The regression
controls reject using the left integral as the whole or silently
substituting the compact candidate for the realized potential.
This reduction passes on both the historical whole #4418426 and the
actual corrected whole #4455163.

## Replay

Place this directory under the repository's committed `goal-next`
evidence directory, alongside the committed `first-force-repair`,
`f1-mean`, `flat`, and `cycle` directories. The Python replay uses only
those source readers, the original Git objects, and the downloaded
graph artifact. It does not use the development offset cache.

    python bind_first_cycle_gauge.py --repo REPO --artifact HISTORICAL_ARTIFACT --out historical-gauge-calibration.json
    python prove_five_whole.py --repo REPO --artifact HISTORICAL_ARTIFACT --gauge-receipt historical-gauge-calibration.json --out historical-five-whole.json

For the corrected full artifact from the successful source run, pass
`--corrected` to both commands and use distinct output names. This
requires the corrected original source pin inventory and exact hosted
manifest. The reproduced corrected files here are
`corrected-gauge-replay.json` and `corrected-five-whole.json`, with
the corresponding execution logs. Historical results remain calibration.

The replay binds exact gauge operands and a global assembly recipe.
It creates no new globally assembled Cartesian gauge AST, all-domain
derivative seminorm, first summation scale, or final jets.
