# Actual natural limit and actual B.8 branch: classical proof

This is a proof at the level of classical analysis, with exact scalar and
continuous-integral replay in `natural_actual.py`. It is not a new Lean kernel
proof. The infinite function is not replaced by a finite coefficient graph.
The claims concern the retained actual natural datum and the first B.8 system;
they do not prove the global C.12 envelope, improper heat debt, initial j=0
Proposition 9.5 tuple, or full physical nonzero-angular residual acceptance.

The selected operations are exactly node 4483
`actual_natural_series(average,474,2,0,0)`, with node 474 equal to rational 4,
and node 5029 `actual_quadratic_root(0,4,2)`. The CLI independently checks the
byte-pinned cached header and SQLite against the original pinned ZIP members.
It checks the defining producer bytes and the actual first quadratic registry,
then walks every operand of its five right sides. It neither reads stored PASS
flags nor accepts an unauthenticated replacement for a defining integral.

## 1. Complete coefficient space and actual data

Put `I=[-33/32,33/32]`. For radial sequences `a=(a_n)` of smooth real
functions on I, including compatible endpoint jets, set

\[
 w_{n,m}=20^{-n}\rho^{-m}\frac{m!\binom{n+m}{m}}
 {(n+1)^2(m+1)^2},\qquad
 \|a\|=\sup_{n,m,\eta\in I}\frac{|a_n^{(m)}(\eta)|}{w_{n,m}}.
\]

Take the finite-norm sequences and the max product norm on two copies.
This space is complete: a norm-Cauchy sequence gives uniformly Cauchy jets
for each fixed n,m; pass to their uniform limits and use
`a_n^(m)(y)-a_n^(m)(x)=integral_x^y a_n^(m+1)` to preserve compatibility.
The weight inequalities pass to the limit. This proves completeness directly,
without postulating a family of unrelated coefficient derivative arrays.

The actual parameter expressions are

\[
 T=e^{2^{20}}+10>128,\quad K=e^{4T},\quad h=e^{-8002T},\quad
 j=h^4,\quad\mu=h^2,\quad\sigma=j/2000,\quad
 \rho=\sigma^2/65536,
\]
\[
 Q=2^{260}K/\sigma^2,\quad\Lambda=Q^{64},\quad
 C=(1+Q^{300})^{10}e^{Q^{200}},\quad
 \tau=C^{-120},\quad T_{sh}=Q^{90}.
\]

All are positive finite real numbers. In particular `h<2^-200`, `Q>2^260`,
`rho^-1<=Q`, `Qj²>1`, and `Qh^8>1`. The source widths are
`t1=kappa0=omega1=omega2=tau`; the code checks their literal expression
trees, rather than treating them as independently selectable inputs.

Use the source fields

\[
 A=1/2+h,\ D=1/2-h,\ d=1-\eta^2,\ L=1-2h\eta^2,\ U_*=4\eta+j,
\]
\[
 H_*=D\eta+dU_*,\quad W_*=1-4d-2D\eta U_*,
\]
\[
 Z_*=-A(1-2\eta U_*)U_*-4H_*-dP'+4A\eta P,
 \quad\chi=H_*^2/(H_*^2+\sigma^2),\quad
 \zeta=-LH_* /(H_*^2+\sigma^2).
\]

Here P is the retained actual A.21 integral `core.P0`, not a new pressure
oracle. The already source-matched proof `../certification-20261014/pressure_mass_lemma.md`
identifies its twelve stages, initial infinite prefix and terminal infinite
tail and gives the actual positive measure mass `<1125K/296<4K`.
The proof applies to these retained operands; angular neutrality or a later
updated mean pressure is not assumed. Its representation is
`P(z)=-integral(1+z²)^(-2theta)dnu`, `0<=theta<=1`.

On the closed tube of radius `sigma²/2048` about I, `|z|<17/16`,
`|H_*|<10`, `|H_*'|<20`. For nearest real x,
`|H_*(z)^2-H_*(x)^2|<sigma²/4`; hence the two denominators obey
`|H_*²+sigma²|>=H_*(x)²+3sigma²/4` and `|L|>99/100`.
This also gives `|chi|<=1`, `|zeta|<=32/sigma²`.
On `|Im z|<=1/16`, the positive-measure representation is holomorphic
by dominated differentiation and has `|P|<5K`; Cauchy on radius 1/32
gives `|P'|<=160K` on the small tube. Direct substitution gives
`|Z_*|<1024K`; the other polynomial bounds are 2,3,5,23 and 2 for
eta,d,Ustar,Wstar and L inverse respectively.

Every radius `r=sigma²/4096` disk about I lies inside the larger tube.
Cauchy embeds each actual radial-constant field into the above complete
space with norm at most its complex sup times
`sum_(m>=0)(m+1)²(1/16)^m=4352/3375<2`. This proves actual
Banach membership, compatibility of all ordinary derivatives, and radial
constancy of every fixed input. Each norm is below Q. The actual primitive
`psi(z)=integral_0^z zeta` is holomorphic on the convex tube, is real on I,
and has `|psi|<=64/sigma²` (in fact `34/sigma²` on the closed tube).
Since `64Lambda/sigma²+1<log C`, the literal amplitude
`g=exp(Lambda psi)/C` is positive on I and has coefficient norm at most 2.
Thus no actual input premise remains in this construction.

## 2. Original bounded operations and literal recurrence assembly

`AxisWeightEstimates.lean` supplies the exact weight above.
`AxisOperators.lean` defines multiplication by the finite convolution and
Leibniz sum, averaging by `a_n/(n+1)`, primitive by
`a_(n-1)/n`, multiplication by Y by `a_(n-1)`, and regular inverse
`J_r a` by `a_(n-1)/[n(n+r-1)]` for n>=1, zero at n=0.
Its integrated derivative composites are respectively

\[
 J_r((a_\eta)b),\quad J_r(a Yb_Y),\quad
 J_r((a_\eta)Yb_Y).
\]

These are bounded operators on the *complete* space: the convolution
weight estimate is 64, averaging is 1, primitive/Jr/mulY are 80,
parameter primitive is `80/rho`, and the three bilinear composites are
`5120/rho`, 5120, `5120/rho`. The bounds follow from the actual weighted
Leibniz/convolution sums; separate eta differentiation is not assumed
bounded. All displayed operator constants are below Q.

For `Tchi=(1/2)J2 Mchi`, the radial-degree filtration improves the Jr
bound at degree k by `(k+1)(k+2)`; using `||chi||<=2` gives
`||Tchi^n||<=5120^n/[n!(n+1)!]`. Therefore
`S=sum(-Tchi)^n` converges in operator norm, has both inverse identities
with `1+Tchi`, and has norm `<exp160<2^256`. This uses factorial
convergence, not a small norm assumption on Tchi.

Set `t=Lambda^-1`, `B=average(u)`,
`W=Wstar-t(2D eta B+d B_eta)`, `U=Ustar+t u`,
`Hc=Hstar+t d u`, and `p=primitive(g² Phi²)`.
The exact literal core producer forms

\[
 R_1=L^{-1}[(W+h(1-2\eta U)+d u\zeta)\Phi
                  +W Y\Phi_Y+H_c\Phi_\eta],
\]
\[
 R_2=L^{-1}[(A(1-4\eta U_*)+4d)u-2A\eta t u^2
        +W Yu_Y+H_*u_\eta+t d u u_\eta
        -4A\eta p+d p_\eta-2\eta Yp_Y].
\]

These are exactly the `pref`, `r1`, `alpha`, `r2` expressions in
`actual-continuation-exact-core.mjs`. Expanding W,U,Hc and using
`B+YB_Y=u` yields the integrated `naturalRemainder` in
`AxisContraction.lean`: its angular terms are lin1,quad1,-t slow1,
its axial terms lin2,-t slow2,+pressure, followed by multiplication
by L inverse and S on the angular component only. The parameter
derivative acts on the first argument, so `param2(Phi,Hstar)` gives
`J2(Phi_eta Hstar)`, as required by the literal recurrence. In slow1,
`param2(B,dPhi)` gives `J2(d B_eta Phi)` and the separate
`d*mixed2(B,Phi)` gives `J2(d B_eta YPhi_Y)` because d has radial
degree zero. Their sum is the required `J2(d B_eta(Phi+YPhi_Y))`;
neither operator alone includes both terms. The term `-d u Phi_eta`
is retained separately as `-param2(Phi,d u)`. In the axial pressure term,
`Yp_Y=Y(g²Phi²)` is precisely the operator `mulY source`.
Thus the bound tree in the CLI is a tree for the actual integrated
recurrence, with every slow, mixed and pressure term retained.

The two exact nonnegative bound polynomials, recomputed in the CLI, are

\[
 B(Q)=2Q^5+3Q^6+3Q^7+11Q^8+8Q^9+2Q^{10}+29Q^{11},
\]
\[
 L_N(Q)=2Q^4+3Q^5+4Q^6+17Q^7+14Q^8+4Q^9+58Q^{10}.
\]

The actual pair `x0=(S1,-Y Zstar/(2L))` obeys
`||x0||+1<2^256+2^25K+1<Q`. On its closed radius-one ball,
`F(x)=x0+naturalRemainder(x)/(2Lambda)` has displacement
`<=29Q^-53<1` and Lipschitz constant `<=51Q^-54<1/2`.
Iterating F from x0, the geometric difference series converges in the
complete space. Continuity gives an actual fixed point x; the contraction
gives uniqueness in this ball and `||x-x0||<=29Q^-53`.
This removes the actual input/operator assembly premise classically.

Undoing S and comparing coefficients gives, for every n,

\[
 \Phi_0=1,\ u_0=p_0=0,\quad
 p_{n+1}=\frac{g^2\sum_{i=0}^n\Phi_i\Phi_{n-i}}{n+1},
\]
\[
 \Phi_{n+1}=\frac{-\chi\Phi_n+t(R_1)_n}{2(n+1)(n+2)},\quad
 u_{n+1}=\frac{-L^{-1}Z_*1_{n=0}+t(R_2)_n}{2(n+1)^2}.
\]

Each right side uses only prior radial coefficients and their ordinary eta
derivatives. Induction identifies every finite producer coefficient with
this *same* infinite fixed point. Integration raises radial degree, so
there is no circular coefficient equation or top jet set to zero.

## 3. Evaluation and all fixed derivative orders

For every fixed k,m and `|Y|<20`, differentiating the coefficient series
has a locally uniform summable majorant. For `|Y|<=R<20`, the weighted
binomial sum gives

\[
 |\partial_Y^k\partial_\eta^m e|
 \le\|e\|\rho^{-m}\frac{(m+k)!}{(m+1)^2 20^k}
              (1-R/20)^{-m-k-1}.
\]

Taylor expansion in eta is also locally normally convergent when
`|Y|/20+|eta-eta0|/rho<1`; thus `|Y|<=5` has a common eta
neighborhood of radius rho/4. This justifies all fixed-order termwise
derivatives, averages, products and primitives. The actual node 4483 is
the average evaluated at Y=4. The other natural calls in the five B.8
history operands have `0<=Y<=4exp(2tau)<4.1`: core endpoints and
integration variables, the short B.22 reference collar, and fixed Y=4.
Their exact operand IDs and derivative orders are saved in the result.

For each fixed k,m the tail beyond N is bounded by

\[
 Q\rho^{-m}\frac{m!}{(m+1)^2}
 \sum_{n>N}\binom{n+m}{m}\frac{(n)_k R^{n-k}}{20^n(n+1)^2}.
\]

Its ratio is at most `(R/20)(N+2+m)/(N+2-k)` for N large enough.
When this is less than one, first term divided by one minus ratio bounds
the entire infinite tail. It tends to zero for each fixed derivative.
The finite materializer's resource limits do not change this definition.

On real `0<=Y<=4.1`, the exact alternating reference series gives
`f0(Ychi)>=305719/1152000`, `0<=chi<=1`; its upper bound is 1.
The actual fixed-point displacement above, with the evaluation estimate,
is below 2^-100. Therefore `1/4<Phi<2`. Through eta order three,
`Phi,u` and `Y Phi_Y,Yu_Y` are bounded by Q^5; the physical
`U-Ustar=t u` is bounded by Q^-58. These estimates apply to the actual
infinite functions, uniformly on the full eta interval.

## 4. Direct bounds for the literal B.22 reference

Here F denotes the literal producer's regular scalar `naturalF=g*Phi`,
and E denotes its angular amplitude `sqrt(2X)*F`. In particular the
physical angular factor E is retained in every moment: `I_X=sqrt(2X)E=2XF`
and `Cp_X=E²/(2X)=F²`. The ratio `Fr/g` below refers to the regular scalar,
so the change to `I/(2X²g)` and the nonsingular pressure primitive keep
their exact radial measure factors.

This proof does not use the strict cone comparison or monotonicity of the
reference. On the reference collar the literal producer is

\[
 F_r/g=\Phi(4e^\tau,\eta)\exp v,\quad
 v=\int_\tau^y\alpha(s)Y\Phi_Y/\Phi\,ds,
 \quad 0\le\alpha\le1,\quad\tau\le y\le2\tau,
\]
\[
 U_r=U(4e^\tau,\eta)+t\int_\tau^y\alpha(s)Y u_Y\,ds.
\]

The natural section before the collar and the constant section afterwards
are retained. By reciprocal differentiation from Phi>1/4, the jets of
`Y Phi_Y/Phi` through three are below Q^32. Since the integration
length is at most tau<Q^-200, every jet of v is below Q^-168.
The real exponential lies between 1/2 and 2; Bell differentiation gives
`1/8<Rr=Fr/g<4` and its jets through three below Q^6.
The physical Uref jets are at most six, and its deviation from Ustar
is at most `2Q^-58`. These bounds hold throughout `0<=X<=110`.

The CLI bounds the literal reference source *directly* from its original
moment formula. Define

\[
 \mathcal I=I_r/(2X^2g)=\int_0^1sR_r(sX)ds,\quad
 \mathcal J=J_r/(2X^2g)=\int_0^1sU_r(sX)R_r(sX)ds.
\]

Their ordinary jets through three are below Q^8. In the derivative terms
`Ieta/(2X²g)=(log g)' mathcal I+mathcal Ieta` and similarly for J.
The first three relevant phase derivatives are below Q^70. The literal
`sourceFromState` formula is

\[
 p_{1,r}=\frac XL\left[-W_r+
 \frac{(1-h)\mathcal I-D\eta((\log g)'\mathcal I+\mathcal I_\eta)
 -d((\log g)'\mathcal J+\mathcal J_\eta)+2(h-D)\eta\mathcal J}{R_r(X)}\right],
\]
\[
 n_{s,r}=L^{-1}[-W_r U_r+D(M_r-\eta M_{r,\eta})/X
       +4h\eta S_r/X-dS_{r,\eta}/X+4A\eta(P+C_{p,r})
       -d(P'+C_{p,r,\eta})].
\]

`W=1-2D eta M/X-d M_eta/X` is retained. The common g cancels
before division in p1. Jets of `1/Rr` through two follow from the
actual reciprocal identity with `1/Rr<=8`; jets of `1/L` have bounds
`(2,16,272)`. For ns, jets through three of S/X and P+Cp are below
Q^3: Uref jets are at most six, Eref derivatives are exponentially
small, the moment definitions are continuous integrals, and the actual
P Cauchy derivatives through three are `<Q²`.
The CLI expands every ordinary Leibniz product, including third moment
derivatives needed for second source derivatives, and records the resulting
positive polynomials. They prove

\[
 \max_{m\le2}|p_{1,r}^{(m)}|<Q^{200},\qquad
 \max_{m\le2}|n_{s,r}^{(m)}|<Q^7.
\]

This estimate uses every actual reference moment; it makes no assumption
about a comparison source being equal to the B.26 actual field.

## 5. Actual B.26 and B.34, with all early histories

In log radius y the literal B.26 control is
`U_y=-(1/2)kappa beta X ns,r`, with
`0<=beta<=1`, `kappa=tau+(1-tau)(1-sigma(y/tau))`.
For `0<=y<=L0=log(110Lambda/4)<Q²`,

\[
 \int_0^{L0}\kappa\,dy\le\tau(1+L0).
\]

Since `C>Q^10000`, this proves the actual axial C2 change is below
`110Q^7 tau(1+Q²)<Q^-1000`. Thus throughout the core,
actual B.26, frozen Gi shift, and restoration,
`delta=U-c`, `c=4eta`, has ordinary jets `(2j,j,j)`.
No radial derivative of a narrow cutoff is used in this estimate.

The actual shear is `(1-blend)kappa p1,r+(4/5)blend`.
The first part has absolute C2 integral at most
`tau(1+Q²)Q^200<1`; the second part is nonnegative and eta
independent. Consequently `F=g Phi4 exp(-integral shear/2)` has
value at most `4g` and its first two eta derivatives have bounds
`g` times a fixed positive polynomial in Q, of degree at most 214.
The natural core has the same bound. The actual `ell_i=log(C Ei)`
and its first two derivatives are below Q^80, since
`Lambda psi` is below `34Q^65`, the constant-target log integral
is at most L0, and the nonconstant eta integrals are below one.

At the actual selected C, `log g<=34Lambda/sigma²-log C`.
The remaining exponential reserve absorbs the above polynomial factors.
Thus F on `[0,110]` and E on `[0,110]` have every ordinary eta
jet through two bounded by `Delta=exp(-Q^200/4)`.
During B.34,

\[
 \log E=-\log C+y/10+(1-\sigma(y/Tsh))\ell_i+
                       \sigma(y/Tsh)\log f,\quad f=(1+\eta²)^{-1}.
\]

For `0<=y<=Tsh`, its value is below `-Q^200/2`; its first two
eta derivatives are bounded by Q^81. Bell's formulas
`E'=E l'`, `E''=E(l''+(l')²)` are absorbed by the same reserve,
so the E jets remain below Delta until Xsep.

At Xsep the source endpoint is exactly ideal:
`E=Keta xsep^(1/10)`, where
`Keta=Pstar f`, `xsep=exp(Q^90)/(CPstar)^10<=Delta^10`.
The entire interval order `Xsep<XR exp(-8)<XR exp(-7)` follows.
All ideal-gap and restoration integrals are retained after that endpoint.

The early pressure uses its nonsingular core measure
`integral_0^110 F² dX`, and then `integral E² dy/2` on the shift.
Their normalized C2 jets are bounded by
`8000(Tsh+111)Delta²`. The exact ideal primitive contributes
`(5/2)xsep^(1/5)<= (5/2)Delta²` after division by Keta².
The normalized early I difference is at most `100Delta`, since its
positive measure is `sqrt2 x^(1/2)dx` and its ideal primitive has
the factor xsep^(8/5). The early J-cI difference also has bound
`100Delta`: cancel cI *before differentiating*, leaving delta E,
and use the already proved delta jets. The early angular energy
difference has normalized C2 bound `100Delta²`, using measure dx.
These constants include the reciprocal Keta jets
`(2,2,2)` and Keta^-2 jets `(4,8,16)`, because Pstar>1.
They all fit within

\[
 \epsilon=10^6(Tsh+111)\Delta²+10^6\Delta<Q^{-1000}<h³.
\]

For completeness the first strict inequality follows from
`exp(Q^200/4)>(Q^200/4)^6/6!>2*10^6 Q^1091`,
`Tsh+111<Q^91`, and Q>=2^260. The last follows from `Qh^8>1`.
Thus the entire early histories, including their improper axis pressure
primitive handled in nonsingular variables, are bounded uniformly in eta.

## 6. Actual five normalized debts

Write the original actual-minus-ideal moments as dM,dI,dJ,dS,dCp.
The normalized rows are exactly

\[
 dM/(XR Keta),\quad(dJ-cdI)/(XR^{3/2}Keta²),\quad
 dI/(XR^{3/2}Keta),\quad(dS-2cdM)/(XR Keta²),\quad dCp/Keta².
\]

The first row is exactly `integral delta/Keta dx` over
`0<x<exp(-7)`. Its C2 jet is at most `(4,6,10)j`, from the
full delta and Keta inverse jets. No early M error is discarded.
The second row after Xsep is the same delta/Keta multiplied by the
positive weight `sqrt2 x^(3/5)dx`, of mass less than one; its early
error is at most epsilon. In the fourth row the exact algebraic identity

\[
 U²-c²-2c(U-c)=(U-c)²
\]

cancels the linear axial debt *before* differentiation. The jets of
delta² are `(4,4,6)j²`; multiplication by Keta^-2 gives
`(16,48,152)j²`. The source restoration cutoff depends only on x
and lies in `[0,1]`, so it preserves all delta jet bounds. The I and
pressure rows have only the already bounded early difference because E
is ideal from Xsep onward. Therefore the actual whole-history C2 row
bounds are at most `14j+epsilon` for the two U rows and
`184j²+epsilon` for the three E rows.

The stored system right side is the *negative* of these rows divided by
the positive actual mu=h². Every derivative order m=0,1,2 therefore
satisfies `||rhs^(m)||infinity<15h`. This is an estimate of the
actual functions on all eta in [-1,1], not an eta-zero jet or a finite
quadrature observation. All actual B22/B26/B34/ideal-gap/restoration
operands are included in the audited closure.

## 7. The actual selected zero-seeded preconditioned branch

The source uses the actual continuous matrix A and diagonal quadratic
matrix Qdiag with the original five support intervals of width 1/4096,
and an exact rational approximate inverse R. It iterates

\[
 z^{(0)}=0,\qquad z^{(n+1)}=z^{(n)}-
       R(Az^{(n)}+\mu Qdiag(z^{(n)})²-rhs).
\]

The CLI *recomputes* A and Qdiag as outward rational interval integrals
with the original pinned arithmetic algorithm. It integrates against
positive d sigma, using exact outward ranges of powers on every cell and
the mass enclosure `sigma(b)-sigma(a)`; squared bumps use the whole-cell
range of sigma prime times d sigma. Analytic flat endpoint majorants
cover the two omitted central-grid collars. This bounds continuous
integrals; no sampled Gaussian error difference is a proof input.

It checks that the actual source R equals the newly recomputed rational
midpoint inverse, then independently forms the full interval `I-RA`
using the actual R. The resulting infinity norm is less than 1/32
(approximately .024333), and `||R||<2^40`. R is invertible because
RA is invertible. The actual preconditioned incoming bound is
`||R rhs^(m)||<2^40 15h<10^-8`.

With r=10^-6, mu<2^-400 and the recomputed `||R Qdiag||` bound,
the CLI verifies

\[
 \beta+\|I-RA\|r+\mu\|RQdiag\|r²<r,\qquad
 q=\|I-RA\|+2\mu\|RQdiag\|r<1/4.
\]

The original zero-seeded sequence stays in the ball and converges to its
unique fixed point, with tail `||z-z^(n)||<=10^-6 4^-n`.
Since R is invertible, its fixed-point equation is the original continuous
quadratic equation. This proves selected-branch equivalence directly;
an unrelated exact-inverse iteration or a rootRadius label is not used.

At every point of this ball the actual Jacobian
`J=A+2mu Qdiag diag(z)` has `||I-RJ||<1/4`, hence is invertible
with `||J^-1||<2^41`. The actual rhs is smooth at every fixed order:
all natural operations have the common proved neighborhood, Phi stays
positive inside every logarithmic reference formula, and all remaining
integrands are compositions/integrals of smooth real functions over finite
eta-independent endpoints. Their finite moving radial endpoints are
positive and source-defined; arbitrary fixed eta jets pass under each
integral by compactness. The implicit function theorem therefore gives
the same smooth branch for every fixed eta derivative order, with
`J z_eta=rhs_eta` and the full ordinary product rule at higher orders.
The source graph walk independently proves A,Qdiag,mu,R are eta
independent, so no coefficient derivative is silently dropped.

This removes the B8 five-history debt, branch-selection and Jacobian
premises classically. The displayed local proofs leave the broader original
acceptance gates unchanged.
