# Oriented collar reduction of ordinary Temporal mean cofactors

The unoptimized C135 original recurrence reads 280 W+ covariance roles
and 373 initialized mean roles. This replay attaches the C130 shifted
radial flux FTC to the same Temporal potential #22150943 and keeps the
actual pressure source #22031648 and centered axial body #22032008.
The conditional source identities use the two fixed radial endpoints,
both flat projected endpoint traces, and the original fixed-label shift.

On the two original narrow collars, $\chi=0$ or $\chi=1$. The centered
shifted primitive is the forward short integral at the lower collar and
the negative backward short integral at the upper collar. Consequently
the outer $\chi_R$ correction is zero, while the original upper
endpoint and nested pressure correction remain present. Apply the
ordinary radial FTC to the signed radial axial-flux term inside that
integral. The signed boundary term vanishes at both original fixed
endpoints. The radial divergence form is differentiated separately
with the original axial inverse and the needed $L^2$ partners.

The resulting conservative source demand drops to 251 covariance roles
and 349 initialized mean roles. This verifies a dependency reduction.
An original high-order Primary ledger is still required for some
remaining roles. The branch carries no whole-field numerical upper
bound and the radial C1 result remains open.

```text
python -B trace_oriented_temporal_cofactors.py --goal GOAL --work WORK --out reduced-ordinary.json
```
