# Same-live N3 common-Y covariance C4 envelope

The native N3 Primary C5 and selected-Forced-input receipt, its 21,681,493-node
source registry, and the original source files are pinned by
`check_common_w4.py`. The replay checks the C4 **local** full covariance row,
all 162 native rows per requested component, their two signed actual source
systems and five differentiated argument slots. It verifies the eigenvector
relations below for every matrix power from 0 to 4 using exact arithmetic in
`Q(sqrt(2))`. The current receipt is `common-w4-weighted-v4.json`.

For original `W_rtheta` and `W_thetaz`, on the same admitted fixed-label chart,
write `S=ell_ref^2`, `epsilon=Q_ref^h`, `Tg=4+sqrt(2)`, and
`delta_*=min(1,log(X/Xa),log(Xb/X))`. The following bound is a conditional
mathematical transfer of the source's already sealed local C4 estimate:

```text
max_(|I|<=4) |I W_(rtheta,thetaz)|
  <= 5184 * 4^2589 * Tg^20 * K^2585 * S^2589
     * epsilon * zeta * delta_*^(-36),
```

where I is any word in `(d_R,d_Z,d_T,L,N)`, holding the common Y and fixed
integer labels as appropriate. `K=#18310069` and `K^2585=#18310098` are in the
same-live **target/norm graph namespace**, not node IDs to be read from the
current graph. The class receipt gives the source local covariance bound
`K^2585 S_label^2585 epsilon_label zeta delta_*^-36 P(v_label)^2` through C4.

## Derivation

For each retained label the original row has coefficient
`(Q_ref/Q_label)^(2A)` and applies one of the two signed local covariance
bodies to its own five active variables. The label and nearest torus copy are
frozen during differentiation. The fixed-label map is affine in the common
variables and has constant first derivative coefficients. The original source
uses the matrix `Jg=[[3,1],[1,5]]`, radial and temporal directions
`vr=(1,1-sqrt(2))`, `vt=(sqrt(2)-1,1)`, and integer `0<=d<=4`. Its exact
eigenvalues are `Lambda=4-sqrt(2)` and `Tg=4+sqrt(2)`, giving

```text
L xi=Lambda^d,  N xi=0,  L v=0,  N v=Tg^d/ci_label.
```

The other three local derivative coefficients are at most 4 by the original
dyadic-band comparison. The floor definition of the original `ci_label` gives
`ci_label^-1 <= Tg*ell_label^2`. For the original admissible bands,
`|ell_label-ell_ref|<=2`, `ell_ref>=8` and hence
`ell_label^2<=4*S`. Consequently all five single-direction factors are at
most `J=4*Tg^5*S`: `Lambda^4<3^4=81` and `J>=4*64>81`. Since the local map
is affine on each frozen branch, each successive derivative adds only one J
factor; original flat joins are required when changing branch or cover label.

The same source comparison gives `S_label<=4*S`, preserves X, the logarithmic
boundary distances and original zeta on the two charts, and bounds every slow
chart factor. With `0<h<1/2` and `1/4<=Q_ref/Q_label<=4`, one has
`epsilon_label<=2*epsilon`, and the covariance normalization is at most 16.
The source Gaussian satisfies `P(v_label)^2<=1`. Sum all 81 boxes and both
signs without assuming disjointness or taking a Haar average. The scalar
coefficient is `162*16*2=5184`; the Jacobian contributes `(4*Tg^5*S)^4` and
the local scale contributes `(4*S)^2585`.

This result is conditional on the **original** local C4 class bound holding at
every actual mapped point, the admissible dyadic domain and positive distance,
and the original support and flat-join statements. It is a source-linked
symbolic estimate; it does not claim that the native pre-Haar W4 seal was
constructed, nor that K was numerically enclosed.

## Consequence for the 52 positive-N v indices

The source `ci0` uses `i(ell_ref-2)` but the reference `Q_ref`. The original
floor estimate therefore gives `ci0^-1<=8*Tg*S`: the factor 8 includes the
two-band shift in the power of Q, and is not omitted. The original palette is
monotone on the admitted range; with `Lambda>1` the radial phase coefficient
using `i(ell_ref-2)` is bounded by the same source estimate for the reference
palette index. The actual K is the maximum containing the original C7
cutoff/map constant, whose radius rows give `|D_s^beta a|<=K*epsilon^-kappa_s`
and `|D_s^beta(1/R)|<=K` for `|beta|<=3`. Thus the A in the prior reduction
can be chosen as `2*K*epsilon^-kappa_s`.

Combining the W bound and the previous exact positive-N v identity yields, for
the 19 indices where the remaining Haar projection costs factor two,

```text
2985984 * 4^2589 * Tg^21 * K^2586 * S^2590
        * epsilon^(1-kappa_s) * zeta * delta_*^(-36).
```

For the other 33 indices, a positive L or N derivative kills the Haar mode and
the numerical factor is `1492992`. These are symbolic **conditional** bounds
on the actual N3 source at fixed label; source domain, flat joins and the
original radial-phase lemma are still essential premises. The 52 indices are
the corresponding common-reference `D_s/L/N` shapes: an own-label `xi/v`
mode-one derivative still needs its explicit pullback factors and dyadic slow
coordinate conversion. They do not give
other mean components, a full initialized mean C4, a Forced input bound, or any
of the final 67 numerical jets. RELEASE HOLD remains.

## Replay

Use `check_common_w4.py --help`. It accepts the previous pointwise receipt,
same-run Primary receipt and native registry, plus the exact original
pressure, band and Primary class files. All SHA-256 pins are inside the
script. No original file is modified and no Lean build is run locally.
