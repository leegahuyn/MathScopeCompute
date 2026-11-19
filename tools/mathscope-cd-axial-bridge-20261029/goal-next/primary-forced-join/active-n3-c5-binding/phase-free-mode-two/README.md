# Fixed-label quadratic second harmonic

The original initialized angular source uses the complete positive first
harmonic of the stored curl. The same-live binder checks that the +2 raw
residual is its self-quadratic and that no primary flat residual appears at
+2. The hosted run 44528954587 carries twenty positive Forced systems.
Its ten +2 systems cover the five integer lifts and both palette signs.
The recorded +2 raw and supported coefficients agree on every row.

Write (U=(u,v,w)) for the complex positive first-harmonic amplitude in
the cylindrical frame. Use the unchanged original fixed-label operators
(D_r=∂_R+a(v_rcdot∂_Y)) and (D_z=ε∂_Z).
The full harmonic divergence is

```text
d = D_r u + u/R + D_z w + i k (grad_cyl Phi)·U.
```

The original conservative +2 coefficient is the following vector plus
`2 d U`.

```text
w D_z u - u D_z w - (u²+v²)/R
u D_r v + w D_z v - v (D_r u + D_z w)
u D_r w - w D_r u - u w/R
```

For a smooth source harmonic curl on the admitted fixed chart, (d=0).
The exact defect term is available when using a source representation
whose divergence has a separate numerical bound. The radial coefficient
then uses the axial derivatives weighted by epsilon and the two retained
cylindrical products. Its fast radial derivative terms cancel. The
azimuthal coefficient has no remaining inverse-radius connection term.

The Lean file proves the three exact component identities and the
zero-divergence specialization. The Node replay executes the authentic
harmonic kernel on a polynomial complex amplitude and on a nonzero
manufactured harmonic curl. The exact rational reducer checks both real
and imaginary components. Omitting the defect in the first case, or
changing the radial connection sign in the second case, fails.

The source checker pins the final Forced receipt and the effective
original source modules. The independent integer replay covers all 126
five-parameter multi-indices through order four.
Let (B) bound the complete positive amplitude and its derivatives
through order five. Let (I) bound the derivatives of (1/R) and
(A_i) those of the two original radial coefficients (a v_{r,i}),
each through order four. Epsilon is constant for a frozen label.
At total order four the component bounds have respective multipliers

```text
radial    32 epsilon + 162 I
azimuthal 32(1+epsilon) + 162(A1+A2)
axial     32 + 81 I + 162(A1+A2)
```

Each multiplier is applied to (B^2). At total order (j), the two- and
three-factor Leibniz sums are (2^j) and (3^j).

The exact quadratic-field replay also checks all five powers of the
original integer cover for both eigenvectors. The (Y) Jacobian of the
fixed-lift map (H_w) has column sums ((1+sqrt{2})/2) and (1/2) in
absolute value. The (w) column sum is (c_i T_g^{-δ}sqrt{2}).
With the original fixed (0<c_ile1), the fourth-order transport
factor is at most (625/256) at fixed (w) and (81/16) with (w)
derivatives included. These estimates use the mapped point in the
admitted source chart. Projection derivatives, quantitative amplitude
norms, the Forced inverse and final jet intervals remain open.

Replay with the original runtime `research-ide` folder and the completed
hosted 44528954587 artifact. Give the programs fresh output paths.

```text
node replay_harmonic_source.mjs ORIGINAL_RUNTIME_RESEARCH_IDE NEW_KERNEL_JSON
python -B bind_mode_two_bounds.py HOSTED_ARTIFACT ../bind_live_primary_c5.mjs NEW_SOURCE_JSON
```

[GitHub Lean compilation](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44542662819)
