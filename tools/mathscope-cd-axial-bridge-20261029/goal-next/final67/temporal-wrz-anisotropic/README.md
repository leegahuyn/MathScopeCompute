# Original Wrz transverse derivative and Temporal inverse

## VERIFIED

The pinned active N3 original source slab is extracted from the
21,681,493-node graph verified in C73. The exact symbolic replay reads
both guarded local Wrz bodies 17737175 and 17740593 and both interior
bodies 17737168 and 17740586. All six native potential bodies
17735323–17735325 and 17738774–17738776 are homogeneous of degree
one in the original transverse cutoff chi, node 17733045. The replay
follows the original potential calls, including their explicit
formal-to-actual xi slots.

Writing the potential as chi times a coefficient independent of xi,
the radial imaginary curl is proportional to chi and the axial
imaginary curl has terms proportional to chi and chi'. The separate
leading product is proportional to chi squared. The exact original
interior polynomial therefore has the form chi² B + chi chi' C,
where B,C are independent of xi. In particular chi' squared is absent.
This also holds after applying the selected slow order Z^6 T with
local xi and v fixed. For each sign the original seven local guards
have just one xi predicate, the interval [-r0,r0]. The other six
predicates are independent of xi. The same decisions for those six
predicates therefore apply at both sampling points. At seams use
the original flat extensions.

The C74 receipt binds the retained beta_Z gamma product to native
node 21374077 of the complete post-Temporal radial source. The
highest allocation on that factor sends its original extra slow
derivatives to the same Wrz field 17753400 at Z^6 T. It remains a
pre-Haar quantity at the input of the inverse.

## CONDITIONAL

Fix the original local R,Z,T, band and mesh labels, and pulse v. Let
M bound the local selected slow jet at both xi=0 and xi=r0/2. The
original m=7 local class provides this if the slow arguments and all
underlying class hypotheses lie in the admitted original domain.
The samples vary only xi in the original local rectangle.

At xi=0 the cutoff is on its plateau with chi=1 and chi'=0. At
xi=r0/2 the step argument is 1/2. Its normalized seed has value 1/2
and derivative 8 there. Since r0=2^-34, chi chi' at this sample is
-8/r0=-2^37. The two exact samples therefore give

    B = f_loc(0)
    C = (f_loc(0)/4 - f_loc(r0/2))/2^37
    |B| <= M,    |C| <= 5 M / 2^39.

The exact integer source bounds C1,C2,C3 for chi derivatives give
the following second derivative coefficient. Both summands are
retained.

    D = (2 C1² + 2 C2) + (5/2^39)(3 C1 C2 + C3)
    |partial_xi² f_loc| <= D M
    D = 1131260571511535374892556877824.

The original common-Y vector L satisfies L xi=Lambda^d and L v=0
on every fixed row, with 0<=d<=4. The two exact Jacobian columns
in all 162 guarded rows are the C73 columns. The source map therefore
costs at most Lambda^8 < (13/5)^8 in L². This transfer requires no
slow derivatives beyond m=7.

For f=partial_Z^6 partial_T Wrz on the common torus, the scale
rho^(2A+6D+1) of one row combines with epsilon_label^beta to give
rho^[5-(4+beta)h] epsilon_ref^beta. Each factor in rho is bounded
by 1024 for rho in [1/4,4], h in (0,1/64), and either original beta
in {1, 2-2 kappa_s}. Here the D in the scale exponent is the original
slow axial chart exponent, distinct from the derivative bound above.
Together with S_label<=4 S_ref and P(v)^2<=1, set

    Mref = zeta [
       (4 Khat S_ref)^2976 epsilon_ref delta_*^(-44)
       + (4 Khat S_ref)^3813 epsilon_ref^(2-2 kappa_s) delta_*^(-54)
    ].

The normalized torus has unit mass. Summing all signed rows gives
||f||₂ <= 162*1024*Mref and
||L²f||₂ <= 162*1024*D*(13/5)^8*Mref. Use the original infinite
anisotropic bound from the quadratic divisor and Parseval,

    ||N^-1 P_perp f||∞ <= (85/6)||f||₂ + (85/216)||L²f||₂.

The combined coefficient is
12048129045385425246741413553542558508493824/78125 < 2^127.
With the same C73 half-Gaussian cost it follows on the admitted
atlas that

    ||N^-1 P_perp f||∞ <= 2 sqrt(zeta) exp[(-1+2^-113+6/L)H].

The original T0 and T1 translate Y by a constant on each radial
integration fiber and have cutoff and radial weights independent
of Y. Translation invariance of the inverse and Haar projection,
and absolute uniform convergence of the bounded inverse series,
allow T0 to commute through the inverse on the verified periodic
source class. If the complete shifted radial path stays in the
admitted atlas and the same original cutoff lies in [0,1], then
the order-zero pointwise norms of T0 and T1 on [a,b] are at most
2(b-a) and 2b(b-a)/a, respectively. The actual source has
a=sqrt(Xa), b=2sqrt(Xb). Thus the highest allocation through two
radial operators costs at most 4b(b-a)^2/a times the radial
supremum of the inverse bound. The source coefficient ci^-1
remains explicit. This step does not transport a radial Gaussian
factor from the binder to the external observation radius.

## OPEN

This packet verifies the original active N3 native transverse
shape and bounds the selected inverse conditional on the local
source class. The actual N3/N4 identification of every slow mapped
point and complete shifted radial binder with its admissible role,
other quadratic factors and lower cutoff allocations, and later
signed corrections remain open. Final jets stay 0/67 and RELEASE HOLD.

## Replay

    python verify_wrz_anisotropic.py WORKSPACE NEW_RECEIPT.json

The ZIP carries the immutable compact inputs. To run a standalone
replay after extraction, use

    python verify_wrz_anisotropic.py . NEW_RECEIPT.json --bundle

## Original radial length and palette factor

The separate check verifies the original base label ell−2, its palette
floor, ci, both shifted original T1 integrals and the exact original ci
inverse. With ell>2 and h<1/64, the source floor reduces the lower rate
by at most Tg and the extra two labels by at most eight. Thus
`ci^-1 < 48 ell^2`. The directed original radial length bound is
`log(4 b^3/a) < H/2^120` for a=sqrt(Xa), b=2 sqrt(Xb).
Combining these with the two-point inverse bound gives the recorded
`sup_r sqrt(zeta(r)) exp[(-4+2^-112)H]`
for the single highest allocation in d_Z^2 d_T(beta_Z).
The original radial path admission, other derivative allocations and
later multiplication by gamma have their own bounds.

Use the same source-slab and workspace archive paths as the separate
anisotropic replay:

    python -B verify_radial_scalar.py WORKSPACE NEW_RADIAL_SCALAR.json

The required source-native and source-slab receipts belong to the prior
C73/C74 evidence archives. The exact length calculator is in the
adjacent original-radial-time-length folder.
