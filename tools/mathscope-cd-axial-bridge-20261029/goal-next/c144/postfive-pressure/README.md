# Original mean pressure at the PostFive to Repeat handoff

The pinned original graph's complete physical PostFive pressure is
`#22153227`. It is the previous full Signed pressure plus the change
from its Signed mean pressure `#22031621` to PostFive mean pressure
`#22152569`. The pressure used as the Repeat template's angular zero
mode is a separate expression `#22155587`, the background pressure
`#17732937` plus `#22152569`.

The Python check streams all 22,380,596 original records. It verifies
the lexical arguments of the full radial source `gr`, its two unit
torus integrals, the whole radial moment `P`, and the normalization
and cutoff nodes. For pressure, its fast auxiliary derivative and its
slow axial derivative, both the partial radial integral and the whole
one use the same translated integrand and bound variable. The outer
variable R is the upper endpoint only of the partial integral.

The native radial derivative is `#22152582`. Expanding its add and
multiply nodes with exact rational coefficients leaves precisely

```text
+ #22152220   gr
- #22152356   rho * P
- #22152570   (partial_R chi) * I_whole
```

Both products with the auxiliary derivative of the radial primitive
cancel by their literal original factors. Replacing the negative
cutoff derivative term with zero changes the expression. This negative
control preserves every other actual node.

On a fixed admitted chart, the pressure map is linear in the
increment of the angular covariance when mean velocity, normalization
and geometry are kept fixed. After computing the complete new
covariance difference, the independent pressure update consists of a
shifted radial primitive of `delta gr - rho * delta P`, centered by
the same cutoff. This follows from linearity of the original normalized
Haar and radial integrals. The corresponding Lean theorem bounds
its size by the larger absolute value of the two radial partial
integrals when the cutoff lies in [0,1]. The two-integral formula
keeps the error estimate independent of cancellation between the two
large full pressure values. The next all-operand check must still
apply it to the actual new covariance fields.

```text
python -B verify_live_postfive_pressure.py ACTIVE_ORIGINAL_EXPORT ORIGINAL_NAVIER_RUNTIME pressure-readback.json
```
