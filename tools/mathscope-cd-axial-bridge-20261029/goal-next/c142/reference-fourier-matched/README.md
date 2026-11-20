# Matched finite Fourier modes across adjacent reference labels

The original finite inverse has a square diagnostic cutoff from 1 through 8.
The active PostSigned source builds the diagnostic with cutoff 1 and keeps
the original exact inverse as a separate expression. Two full square
diagnostics generally select different terms across a change of reference.
The finite equality below compares corresponding terms in the two squares.

## Conditional comparison

Let `a,b` be the adjacent references, `Sx` the physical change of slow
coordinates, `λ = Q_b/Q_a = 1/2`, and `d ∈ {0,1}` the difference of
reference palette indices. Put `J = [[3,1],[1,5]]`, `L = (J^d)^T`,
`v_t = (√2−1,1)`, and `T_g = 4+√2`. Assume the **actual centered source**
has the physical overlap identity

\[
 F_b(Sx,J^dY)=\lambda^w F_a(x,Y).
\]

This premise is separate from the coefficient calculation, and is required
for each actual angular and axial source being compared. The formulas
below use integrable periodic source functions at the admitted slow point.

For integer `k`, the character at `k` in the b-chart pulls back to the
character at `Lk` in the a-chart. The original normalized Haar measure is
preserved by the parent torus cover. Thus for the native convention
\(\widehat F(k)=C_k-iS_k\),

\[
  \widehat F_b(Sx,k)=\lambda^w\widehat F_a(x,Lk).
\]

When d = 1, the cover has degree 14. Its kernel is cyclic with generator
`(5,−1)/14` modulo integers. The a-source is invariant under its translations.
Consequently its coefficient at `ℓ` equals itself times the deck
character at `ℓ`. It must be zero unless `5ℓ₀−ℓ₁ ≡ 0 (mod 14)`. The latter
condition is exactly `ℓ ∈ J^T ℤ²`, since the two coordinates of
`adj(J^T)ℓ` are then both multiples of 14. This proves **zero off-image
coefficients under the source overlap premise**. The same Haar argument
transports the zero mode, which the runtime does not invert. For d = 0
the deck group is trivial and every integer frequency lies in the image.

Write `B_K = {k ∈ ℤ² | 0 < ‖k‖∞ ≤ K}`. For any two cutoffs define the
paired symmetric sets

\[
 C_b=B_{K_b}\cap L^{-1}(B_{K_a}),\qquad
 C_a=L C_b=B_{K_a}\cap L B_{K_b}.
\]

Only retain these corresponding rows from the original finite diagnostic in
each reference. A native row already represents both signs. If the image
of the native b-half-lattice representative lies in the other half of the
a-lattice, choose its negative as the native a-row. Cosine coefficients
are unchanged, sine coefficients and the divisor change sign together, and
the harmonic has the same pulled-back value. This also covers the d = 1
frequency control `(1,−4) ↦ (−1,−19)`.

The physical eigenvector identity `J^d v_t = T_g^d v_t` gives
`δ(Lk)=T_g^d δ(k)` for `δ(k)=v_t·k`. The nonzero exact divisor is handled
in \(\mathbb Q(\sqrt2)\) by the same norm identity as the runtime. A b-row
has the original factor `2 (C sin − S cos)/(2π δ(k))`. The factor `2/(2π)`
is common in the comparison. The matched finite sums therefore satisfy

\[
  I_b^{C_b}(Sx,J^dY)=T_g^d\lambda^w I_a^{C_a}(x,Y).
\]

The original temporal scale satisfies
`c_b = λ^(1+h) T_g^d c_a`. For the centered transverse or axial residual,
`w = 2A + 1/2` with `A = 1/2 + h`, so the actual expression `−I/c`
has velocity grade `w−(1+h) = A` after matched restriction. This finding
concerns the finite terms and this division. The whole-field radial
potential, cutoff contribution and derivative chain require their respective
exact identities.

## Verified cutoff choices

For d = 0 the unfiltered square comparison uses equal cutoffs. For d = 1
there is **no pair of positive unfiltered squares** that works for arbitrary
transported sources. The b-corner `(K_b,K_b)` pulls back to
`(4K_b,6K_b)`, requiring `K_a ≥ 6K_b`. That same a-square also contains
the pullback of `(K_b+1,0)`, beyond the b-square. An exact single-harmonic
counterexample at the live `(K_a,K_b)=(1,1)) uses `k=(1,0)` in b,
whose a-frequency is `(3,1)`. Under the overlap premise the a-square
at cutoff 1 has zero coefficients at every nonzero mode. This statement
does not supply values for any of the actual b-coefficients.

| a diagnostic cutoff | Nonzero a modes on the image | Smallest b radius covering all of those modes |
| ---: | ---: | ---: |
| 1 | 0 | 0 |
| 2 | 0 | 0 |
| 3 | 2 | 1 |
| 4 | 4 | 1 |
| 5 | 8 | 2 |
| 6 | 12 | 2 |
| 7 | 16 | 3 |
| 8 | 20 | 3 |

The matched intersection is nonempty for all runtime pairs with
`K_a≥3,K_b≥1`. It is empty at the current live cutoff-1 pair for d = 1.
To retain **all** of the b-square while selecting rows in a, the feasible
runtime pairs are `(6,1)`, `(7,1)`, and `(8,1)`. For example, square
`K_a=6` contains every image of `B_1`. It also contains the images of
`±(2,0), ±(2,−1)`, whose row pairs must be excluded. Retaining all of a b-box
with `K_b≥2` by the same strategy requires `K_a≥12`, beyond the current
explicit finite diagnostic limit.

The replay reads the pinned cutoff values, uses exact integers for the
64 unequal-chart cutoff pairs, verifies 289 deck character sums by reduction
modulo the 14th cyclotomic polynomial, and checks 576 independent sine and
cosine transport identities over the rational quadratic field. It checks the
grades symbolically as affine exponents in h. No actual source coefficients
were numerically evaluated and the active runtime was left unchanged.
Full centered-source transport for the native Repeat, the infinite inverse
and its tails, N8-05, and the final jet verdict remain open.

Run the deterministic replay from the workspace root:

    python -B work/goal-next/continuation142/reference-fourier-matched/check_matched_fourier.py
