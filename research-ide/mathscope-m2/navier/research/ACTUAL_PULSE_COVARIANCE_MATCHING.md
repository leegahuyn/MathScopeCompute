# Actual Imean inverse and complete pointwise physical covariance sum

## Scope

The two new modules join the **actual heat-prepared source stress** to the
**actual homogeneous-pulse covariance** at the same Imean representative. They
compute positive squared amplitudes and verify the physical normalization in
paper (7.30), using a concrete permitted squared partition whose entire active
set at that physical point is known exactly.

This is a finite, actual-source point computation. It is **not** a construction
of every local wave on the whole source annulus. In particular,
`wholeAnnulusCovarianceMatched`, `allSlowNeighborhoodsMatched`, and
`sourceUniformQStarCertified` stay false. The geometric choice of a finite
observation's `qBigObservation` does not establish that it is below the original
common analytic `q_*`. The whole N5-06 criterion and the full N5 package are not
promoted by these modules alone.

No old source, target, amplitude, or covariance file is modified. Both sources
are executed and checked by deterministic replay; a caller cannot supply a
replacement target, matrix, weight, mesh index, or exponent.

## 1. Source identity and the exact local inverse

The source is `same-profile-2026-10-10.3`, with accepted assembly SHA-256
`184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd`.
The primary paper is the supplied 166-page document, SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The relevant formulas are (6.8)–(6.9), (6.13), (7.24), (7.27), and
(7.30), on paper pages 64–66 and 82–84.

The immutable inputs are:

| Input | Module | SHA-256 |
|---|---|---|
| Actual final leading stress, including heat debts | `actual-mean-stress.mjs` | `7dc194a8a33ff5a3882c1bedf82cf1d26efe3220f0bd66a1e550482369ccad71` |
| Actual homogeneous covariance integrals | `actual-pulse-covariance-integrals.mjs` | `6690a62a744195fa733f8a3b3f61f90b291a88c9cbb490e94e96d4963e3065c5` |
| Actual phase and moving frame | `actual-pulse-amplitude-phase.mjs` | `0ed21e490d93a59caa578d91a4dd3df3791a0e9a07a845740a15cd7578c98224` |
| Actual full-path amplitude enclosure | `actual-pulse-amplitude-integrator.mjs` | `096eea803e7c17481c4926b4a8b811ddf54ddc4df615253477092780c3d1b60d` |

Fix `y` in `[1/4,19/4]`, `eta=0`, and `s=q/Q=1`. Put

\[
 X=X_{0,\mathrm{Imean}}e^y,\qquad R_0=\sqrt{2X},\qquad F=E/R_0.
\]

The stress producer returns an actual exact function object and the enclosure

\[
 T_{0,\theta}=FX\lambda\,\mathcal T,\qquad
 |\mathcal T-1|<2^{-b},\qquad T_{0,z}=0.
\]

The positive heat contribution is retained. Axial vanishing follows from the
restored cumulative moment **functions** and the parity of the actual heat
debts, as proved in `ACTUAL_MEAN_STRESS_KO.md`. It is not inferred from the local
velocity or an assumed parity of the original nonlinear core. Since `s=1`, the
original target `T0,*=(Q/q)^(A+1/2) T0` is exactly `T0` here.

The covariance producer supplies computed positive integral objects
`A`, `B`, and `Cchi`. Its exact two-column matrix is

\[
 H=C\begin{pmatrix}\sqrt\lambda A&\sqrt\lambda A\\B&-B\end{pmatrix},
 \qquad C=J_{\mathrm{rect}}C_\chi r_0^2\frac{u_*}{\sqrt{G}},
 \qquad J_{\mathrm{rect}}=4-2\sqrt2.
\]

These are the original homogeneous solutions with their left growing datum,
not a constant polarization or normalized midpoint vector. The covariance
includes the angular half factor, exactly one transverse mass, all normalized
Haar lifts, and the nonzero cutoff tail. See
`ACTUAL_PULSE_COVARIANCE.md` for the Gaussian-width quadrature and tail proof.

The general inverse, with both target components retained, is

\[
 y_+=\frac12\left(\frac{T_\theta}{C\sqrt\lambda A}
                  +\frac{T_z}{CB}\right),\qquad
 y_-=\frac12\left(\frac{T_\theta}{C\sqrt\lambda A}
                  -\frac{T_z}{CB}\right).
\]

The actual target above therefore gives

\[
 y_+=y_-=\mathcal S\,\widehat y,\qquad
 \mathcal S=\frac{FX\sqrt\lambda\sqrt G}{r_0^2u_*}>0,\qquad
 \widehat y=\frac{\mathcal T}{2J_{\mathrm{rect}}C_\chi A}>0.
\]

The modules compute an outward enclosure of `widehat y` and its positive square
root. The full positive scale `S` remains a source expression with bound source
roots. It is not rounded to zero or an overflowing binary64 value. The actual
wave is

\[
 W_0=\sqrt\varepsilon\sqrt{\mathcal S}
       \sum_{\sigma=\pm}\sqrt{\widehat y}\,b_\sigma.
\]

This changes neither the original homogeneous datum nor its midpoint reference
normalization. The exact determinant is `-2 C^2 sqrt(lambda) A B`, with a positive
absolute lower bound inherited from the actual integral enclosures.

### Source binding and dependency-aware equality

The two module outputs are independently replayed from their pinned requests.
Their profile, assembly hash, exact `y`, `eta`, and `q/Q` must agree. The phase's
`F0` root and the target's `F` root are compared as exact expression trees after
flattening sums and products and combining rational constants. Thus equal
display intervals are not accepted as evidence that the sources coincide.

An exact BigInt rational Laurent-polynomial calculation multiplies `H` by its
two-column inverse and obtains zero residual in both components. Its atoms
refer to the **same computed objects** on both sides. This preserves the
dependence between `A` in the matrix and `1/A` in the weight. A second, ordinary
interval multiplication is also returned; its wider interval contains zero but
is not mislabeled an exact interval cancellation. The actual target object is
never replaced by the center value one.

## 2. A concrete squared partition permitted by the original construction

Paper §6.2 explicitly permits normalized translates of a smooth bump. It
requires a band support within `q/Q in [1/2,2]`, a mesh of `Sstar^-3`, and a mesh
support extending at most one mesh length on either side of its grid point.
It does not prescribe a particular origin for the product lattice.

Use the original smooth step `sigma` and fix

\[
 b(t)=\begin{cases}
 1,& |t|\le1/4,\\
 \sigma(3/2-2|t|),&1/4<|t|<3/4,\\
 0,&|t|\ge3/4.
 \end{cases}
 \qquad
 \chi_j(t)=\frac{b(t-j)}{\sqrt{\sum_k b(t-k)^2}}.
\]

The function is smooth across zero because it is constant nearby; all transition
jets agree with the constant extensions at the other joins. A nearest integer
is at distance at most `1/2`, where `b>=sigma(1/2)=1/2`. Hence the denominator
squared is at least `1/4`. At most two translates are nonzero, so the formula is
locally finite and smooth, and `sum_j chi_j^2=1` is an exact shared-denominator
identity. These are functions, not a list of declared sample weights.

For the bands take `t=-log(q)/log(2)` and centers `ell`. A nonzero band satisfies
`|t-ell|<3/4`, which is strictly inside the original support bound
`1/2<q/Q<2`. For the mesh take the product of three such partitions with scale
`ell^6`, and fix the translated origin

\[
 (R_0(y),0,1),\qquad
 \text{grid points}=(R_0(y),0,1)+\ell^{-6}a,
 \quad a\in\mathbb Z^3.
\]

Choosing `y` constructs this explicit M2 partition instance once. The origin,
all discrete choices, and labels remain fixed when differentiating within that
instance. Changing the request's `y` constructs a different allowed partition
instance for the **same N3 profile**; the lattice is not silently moved while
evaluating derivatives. No source field or exponent is changed by this choice.

The support palette in `source-support.mjs` applies to this translated lattice:
same-band index differences are unaffected by translation, and distinct nearby
bands already receive different colors. Its exact all-label separation proof
and common `r0=2^-34` therefore remain valid.

## 3. Complete actual active set at the observed physical point

Let the actual source band be

\[
 \ell_* = \left\lceil M^{100}h^{-4}\right\rceil,
 \quad M=C12EnvelopeR^{100},\quad Q=2^{-\ell_*}.
\]

This is the identical band expression used by the frozen actual phase and
amplitude modules. The huge integer need not be materialized to prove the
relative index identities below. Choose the geometric observation family with
`ell0=ell_*-1` and `qBigObservation=3Q/2`. Since `M>=2^50` and `0<h<1`,
`ell_*>2^5000`, so `ell0>=8`. The original geometric domain constraint holds:

\[
 0<Q<3Q/2<2Q=2^{-\ell_0}.
\]

This `qBigObservation` is **only a geometric active-family bound**. The actual
amplitude certificate applies at `ell_*` using the source-derived Imean local
threshold. It does not validate the pulses at `ell_*-1`, all other
representatives, or the whole original annulus. In particular it does not
assert `qBigObservation<=` the original common analytic `q_*`.

The physical point is

\[
 \tau=Q,\qquad z=0,\qquad r=\sqrt Q R_0.
\]

The original implicit equation `q=tau+z^2 q^(2h)` gives `q=Q` exactly. Its
profile point is `X=X0Imean exp(y)`, `eta=0`, strictly inside the original
Imean patch and hence the stress shell. The source endpoint ordering is

\[
 X_a=4/\Lambda<4<X_R<X0Imean e^y<X0Imean e^5
       <X_{mainpulse}=X0Imean e^8<X_b.
\]

The parameter identities and patch order are fixed in
`ONE_PROFILE_SPECIFICATION.md` and `GLOBAL_STRESS_ASSEMBLY_EN.md`, already bound
by the immutable target and pulse producers. The observed point itself is the
witness that the center box intersects the active shell in (6.8).

At this point, the band coordinate is exactly `ell_*`, and all three mesh
coordinates relative to the fixed origin are exactly zero. Consequently:

* The sole nonzero band is `ell_*`, with cutoff one.
* The sole nonzero mesh box is `a=(0,0,0)`, with product cutoff one.
* Every other integer band differs by at least one.
* Every other integer mesh index differs in some coordinate by at least one.

The last two facts put every omitted index outside the support radius `3/4`.
They prove the **entire infinite-index complement** is exactly zero. This is
not a truncated active list or an arbitrary declaration of one-box support.
There is also an open geometric neighborhood of relative radius `1/4` with
the same active set, although covariance throughout that neighborhood is not
certified by this point evaluator.

The center box's two signs are distinct auxiliary rectangles. Their colors are
the exact functions `250*(ell_* mod 9)` and `250*(ell_* mod 9)+1`, giving centers
`((color+1)/1048576,0)`. The shared integer residue is not guessed. Uniform
palette separation proves disjointness for every possible value of that exact
residue. The minus phase program is generated explicitly from the same source
root; its angular integer is the negative of the same positive nonzero integer
used by the plus phase. The frozen exact sign parity then gives the actual
minus covariance, with unchanged angular component and negated axial component.

## 4. Actual finite pointwise form of (7.30)

The local inverse gives `C(W0)=epsilon*T0,*`. The product cutoff is one and its
box is counted **once**. Both sign rectangles are already inside that local
covariance. Since no other box is active, the full pointwise physical sum is

\[
 \sum_{\beta\ \mathrm{active}}Q_\beta^{-2A}\eta_\beta^2
             \varepsilon_\beta T_{0,*}
 =Q^{-2A+h}T_0
 =q^{-A-1/2}T_0,
 \qquad q=Q,
\]

using `A=1/2+h`. More generally the exact exponent calculation retains the
factor `(Q/q)^(A+1/2)` and checks

\[
 Q^{-2A+h}(Q/q)^{A+1/2}
   =Q^{-A+h+1/2}q^{-A-1/2}=q^{-1-h}.
\]

The code checks this with exact rational affine exponents in the actual
positive `h`. Omitting epsilon fails the identity; setting `h=0` would hide
that failure and is forbidden. Counting the two signs as two slow boxes also
fails. The exact physical multiplier `q^(-1-h) F X lambda` is kept positive
and symbolic, with its source roots, rather than underflowing on screen.

The covariance is the original angular/Haar average at fixed slow variables.
The pointwise physical velocity product is not asserted to equal that average.
No full-curl covariance correction or later signed-stress correction is added
without its own computation.

## 5. API, source paths, verification

`actualMeanPulseMatchedStress({sourceProfile?, y=2.5, cells=256,
cutoffCells=cells, bits=512}, context)` returns the actual source target,
actual covariance, normalized positive weights, determinant and local identity.

`actualMeanPulsePointwiseAssembly` accepts the same request and returns:

* `localMatch`: the preceding source join;
* `partition`: the concrete smooth family, domain and complete active set;
* `labels`: both source phase programs and the exact parity audit;
* `rows`: the one actual slow-box physical stress contribution;
* `physicalIdentity`: exact (7.30) at this source point;
* `scope`: the finite point claim and explicit whole-family false flags.

Every row retains a resolving `result.results.*` source path. Nested source
rows are rebased under `localMatch`. Exact interval tables retain the target's
positive rational error width and the physical positive scales.

Commands from the repository root:

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-pulse-covariance-matching.test.mjs
node research-ide/mathscope-m2/navier/tests/actual-pulse-covariance-matching-fixture.mjs
python research-ide/mathscope-m2/navier/tests/actual-pulse-covariance-matching-independent.py
```

The Node suite has 12 passing tests. The independent Python suite has 1,195
passing exact Fraction and 100-digit Decimal checks: 12 actual source
enclosure cases, 50 independent general two-column inverse cases, and 129
offsets of the explicit smooth partition. It checks matrix inversion by the
determinant formula, interval extrema with exact binary64 rational endpoints,
and smooth-bump weights by independent high-precision exponential evaluation.

Negative controls include a target outside the cone, the missing inverse half,
the missing epsilon scale, double-counted signs, an omitted box, modified
source/target fields, and an altered source origin. Full deterministic replay
rejects retained receipts after any such modification. Tests also verify that
all four source input files still have their frozen SHA-256 hashes.

The remaining original global obligation is to supply source-valid local
covariance/target certificates throughout the required enlarged neighborhoods
and a common analytic `q_*`, then run the same partition assembly for the
entire family. The explicit partition alone does not create those missing
wave certificates.
