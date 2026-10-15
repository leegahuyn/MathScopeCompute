# Actual 162-row support binding

The checker reads the source-authenticated projections from cloud run
38696116795. It does not allocate replacement labels or evaluate sample
field values. Its symbolic equalities use the actual source nodes.

The 162 rows of each of the three initialized angular residuals have the
same original labels and outer guards as the 162 rows of all three velocity
components and the angular pressure. The checker verifies that correspondence
for every row of all seven native indexed definitions.

For each actual row, it proves the source center is

    ((2*((((ell mod9)*5+g0 mod5)*5+g1 mod5)*5+g2 mod5)+signBit+1)/2^20,0).

The actual ell and grid nodes are integer-valued ceiling expressions. Their
source definitions give the nearest band plus relativeBand in {-1,0,1},
and each band's nearest grid plus relativeMesh in {-1,0,1}^3. Different
bands have integer differences 1 or2, and different same-band mesh indices
have a nonzero difference of magnitude at most2 in some coordinate. Their
residues modulo9 and modulo5 respectively differ. Opposite signs have
different parity colors. The finite mixed-radix encoding is injective, so
the actual 162 candidate labels always have distinct colors. This is a
symbolic statement about every original candidate tuple, not a sample of
selected mesh integers.

The actual three mesh guards are checked to be
`ell^6*(actual label-chart coordinate)-actual grid`, with bounds ±3/4;
the actual band guard is the common original band coordinate minus ell,
also with bounds ±3/4. Every candidate is thus tied to the same integers
used in its color expression.

For every actual row and every integer delta from0 through4, the checker
proves its actual nearest-copy nodes and velocity xi/v nodes equal the
following map, retaining both Y columns:

    n=floor(J^delta*Y-center+(1/2,1/2)),
    offset=J^delta*Y-center-n,
    xi=(v_r dot offset)/(4-2sqrt2),
    v=((v_t dot offset)/(4-2sqrt2)+r0)/c_i_row,
    v_r=(1,1-sqrt2), v_t=(sqrt2-1,1), r0=2^-34.

This checks 1,620 nearest-copy and 1,620 xi/v equalities against actual
source expressions. It also checks each actual delta node is
`floor(f(ell_label))-floor(f(N-2))`, where
`f(x)=((1+h)*x*log2-2log x)/log(4+sqrt2)`.

On the unchanged chart, q=2^-N*s with1/2<=s<=2. The nearest-band candidate
construction therefore gives N-2<=ell_label<=N+2. The original proven band
guard gives N>=14. The original h satisfies0<h<1/16. On this interval f is
increasing, because log2>1/2 and2/x<=1/6. Its variation is less than
`4*(1+h)*log2/log(4+sqrt2)<2*(1+h)<17/8<3`. The actual nonnegative integer
floor difference is therefore less than4, and in particular lies in the
original branch inventory0..4. Pairwise relative differences also lie in
that inventory. No caller-supplied palette-level bound is used.

The eight complete original local velocity/pressure bodies have seven
outer lazy zero guards each. The checker verifies all those source nodes
and their zero exterior branches. The innermost two actual guards require
`|xi|<=r0` and `0<=v<=2*r0/c_i_local`. If the actual label substitution
identifies c_i_local with c_i_row, their support lies in the closed
rectangle `|xi|<=r0, |eta|<=r0`, where eta=c_i_row*v-r0.

For J=[[3,1],[1,5]], exact integer multiplication gives vertical center
distance numerators1,8,50,288 for delta1,2,3,4. The checker independently
tests all 2,250 original center numerators at every positive delta.
Distinct centers at delta0 differ by at least1/2^20 horizontally. Each
coordinate of either basis has absolute row sum sqrt2<3/2. Even the
original doubled rectangles have row perturbation less than3*r0.
The largest row sum of J^delta is1028, so two enlarged rectangles can
alter a center difference by at most

    3*(1028+1)*r0 = 3087/2^34 < 1/2^20,

with strict gap13297/2^34. They cannot meet. Both coordinatewise nearest
lifts are valid because3*r0<1/2. Thus the actual 162 distinct rows have
pairwise disjoint wave support once the one explicit c_i substitution
identity is bound.

For distinct complete wave rows, disjoint support gives the identically
zero tensor w_i tensor w_j. Each w_i contains both same-row conjugate
angular harmonics; their interaction is retained. The entire common mean
is retained and its products with every wave are retained. If the actual
guarded fields are C^k, their derivatives vanish off the same closed
support, and continuity gives flat exterior derivatives at its boundary.
Consequently every required derivative of each identically zero cross
tensor is zero. This last differentiability premise is an original
regularity obligation, and is not manufactured by this support checker.

The current projection omits a few ancestors of the original local
c_i node623025. Their complete primitive cone has been requested. Until
the actual equality c_i_local(ell_label)=c_i_row is checked, the geometric
support conclusion remains explicitly conditional. No original Jet230 or
PDE1020 row is marked discharged.
