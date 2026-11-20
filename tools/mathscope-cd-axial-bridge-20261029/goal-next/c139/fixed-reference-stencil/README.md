# Fixed-reference band and mesh stencil joins

The original cover uses three consecutive absolute labels per axis and
the cutoff support is the open interval of radius (3/4). For a nearest
integer switch at (k+1/2), compare the old and new stencil formulas on
the open interval ((k+1/4,k+3/4)). The departing center (k-1) and
entering center (k+2) are farther than (5/4) from every point of the
interval. Their numerator and denominator contributions vanish
identically. The two retained translates have precisely the same
offsets. This gives local equality of normalized squared weights and
of their nonnegative square-root cutoffs.

The pinned native label recipe recomputes the three mesh coordinates in
each retained *absolute* band. Retaining the same absolute mesh triple
gives the same modular color, torus center, bounded fixed-reference
matrix branch and physical chain coefficients. The condition is
applied independently to each affected coordinate. The original lazy
outer guards select zero for entering and departing rows before their
local expressions are evaluated. With the same admissible reference
chart and unchanged retained source bodies, the old and new sums are
equal as functions on a neighborhood. They therefore have the same
ordinary derivatives where those retained bodies have the required
regularity.

The replay compares all 128 stencil choices at twelve exact rational
inputs, including very large positive and negative integer controls.
It checks partition and absolute-label arguments. The separate native
registration run is required to read the four new indexed fields. This
result concerns index changes inside one fixed reference chart. A
change of the reference label itself requires comparing the original
normalization, torus map and mean.

```text
python -B verify_fixed_reference_stencil.py --goal GOAL --runtime ORIGINAL_RESEARCH_IDE --out fixed-reference-stencil.json
```
