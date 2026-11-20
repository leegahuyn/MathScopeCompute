# Physical derivative footprint of the active radial residual

The replay reads the pinned ten-chart actual wave and pressure orders,
and the exact original finite harmonic operator. The source uses
$D_r=\partial_R+aL$, $D_z=\varepsilon\partial_Z$, and
$D_t=-\varepsilon\partial_T+c_iN$. With the fixed chart and constant
torus directions, the doubled radial action is
$D_r^2=\partial_R^2+2a\,\partial_RL+a_R L+a^2L^2$.

After the outer first physical derivative, the wave hull has 28 directions
with no $N$, nine with a single $N$, and the pure $N^2$ direction.
The only mixed $T,N$ direction is $TN$, and the only squared $T$
direction is $TT$. The 200 actual pressure applications have baseline
gradient footprint 0, R, Z, L. Their pulse successors are $N,RN,ZN,LN$.
The exact cylindrical connection coefficients remain in the original
source and add no wave orders.

This is a derivative inventory. It keeps the coefficient, pressure,
four original subtraction and guard proof obligations separate.

```text
python -B verify_radial_operator_hull.py --goal GOAL --runtime ORIGINAL_RESEARCH_IDE --out radial-operator-hull.json
```
