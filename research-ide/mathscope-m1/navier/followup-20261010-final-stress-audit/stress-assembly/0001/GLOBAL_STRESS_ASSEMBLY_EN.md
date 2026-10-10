# The same final stress: support, directional margin and one flat weight

## 1. Exact input boundary

This note assembles the stress of **one** final profile. The assembly is
an implication until all the following same-source inputs have been
attached. It does not take an unsupported norm field as evidence.

* The new analytic axis, its literal B.22/B.26 continuation, and the
  actual B.8 correction use the new A.21 datum. They have the original
  regular-axis identities and B.30 inner factorization.
* The actual A.7 heat replacement and I2 compensation are those in
  `HEAT_COMPENSATION_PROOF_EN.md`. Their three exact restored moments,
  and the identically unchanged M and J, retain that same datum.
* One actual source envelope supplies the R in
  `../followup-20261010-symbolic-gluing/C12_FREQUENCY_CONTRACT.md`.
  Its single finite N, continuous modulation debt, and I1 repair then
  give the bounds stated there for the final field on J. In particular
  its four raw gaps are at least `1/(2R)`, and its directional margin
  is `R^-10`. Require `R>=8192` and `R>=C^2`.

The fixed parameters used here are

\[
 Q\ge2^{260},\quad \Lambda=Q^{64},\quad Q>h^{-8},
 \quad h<\lambda<1/100,\quad T=\log(1/h)/8002,
\]
\[
 C=(1+Q^{300})^{10}\exp(Q^{200}),\quad
 X_R=110(CP_*)^{10},\quad P_*=e^{2T},
 \quad t_1=\kappa_0=\omega_1=\omega_2=C^{-120}.
                                                        \tag{S1}
\]

The actual axis bounds give `Gamma<C^3`, `Kcmp<C^49`, `Vmax<C^5`,
`sigma_axis^-1<=Q`, and `|Lambda psi|<=34 Lambda/sigma_axis^2`.
Here `sigma_axis` is the axis separation parameter; it is distinct from
the smooth step sigma. These statements are proved in the same-datum
axis notes and must retain their source binding.

Let

\[
 X_a=X_0=4/\Lambda,\quad
 X_{an}=X_a e^{t_1/16},\quad X_-=X_a e^{t_1/8}.
                                                        \tag{S2}
\]

The end of the outer schedule is `X_b=X_tail e^3`. Its terminal
coordinate is `y_o=log(X/X_tail)`, and `delta_o=3-y_o=log(X_b/X)`.
All these endpoints are independent of eta and physical q.

Primary source: supplied 166-page paper, SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`,
Theorem 4.6 pp.32–34, Lemma 4.4 pp.28–30, A.8–A.10 pp.140–144,
and B.26–B.31 pp.152–153.

## 2. Explicit size of the entire outer interval

The literal A.2 schedule has logarithmic length, from XR to Xb,

\[
 L_{out}=135+T+90\log(1/\lambda)+4\log(1/h)
             +13/\lambda+\mathrm{wait}.                 \tag{S3}
\]

The fixed interpolation length is 128. Since `Q>h^-8`,
`log(1/h)<log(Q)/8` and `lambda^-1<h^-1<Q^(1/8)`.
The three T-dependent terms total `122009T<2Q`.
Also `13/lambda<Q`, using `Q^(7/8)>13`.

For the terminal wait, the release starts with Qs at most 1.
The first and last unit transitions each increase it by at most 1,
because their damping `1+l` is nonnegative and their source
`-l-h` is at most 1. The hold increases it by at most
`4 log(1/h)`. Thus the flattening endpoint satisfies
`Q_b<=3+4log(1/h)<Q`. The exact terminal target obeys
`Q_p>=h/256`, so

\[
 \mathrm{wait}=\frac{\log(Q_b/Q_p)}{1-h}
 <2\bigl(\log Q+8+\log(1/h)\bigr)<3Q.
\]

It follows that `L_out<8Q`. Throughout this complete original outer
schedule, including the small angular corrections, `l>=-1`.
Consequently `d log E/d log X>=-3/2`. At XR the field is at least
`P*/2`, and at Xb the flat terminal factor is exactly 1. Therefore

\[
 X_b=X_R e^{L_{out}}<C^{11},\qquad
 E_{pow}(X_b)>\tfrac12e^{-12Q}>C^{-1}.           \tag{S4}
\]

The comparisons use `log C>=Q^200`, `T<Q/64016`, and
`log(110)+20T+8Q<9Q<Q^200`. All exponent comparisons are exact;
no very small amplitude is replaced by zero. The I2 edit and heat factor
do not change the prescribed exterior power `E_pow` or Xb.

## 3. Directional margin on the unaffected exterior

After the right endpoint of I1, the final profile and all its moments
are exactly the heat-prepared input, by the I1 equations and Lemma 4.4.
This paragraph concerns the interval from there through `y_o=1/2`.
The reviewed outer and heat bounds give

\[
 P=p_{s,1}\ge2^{33},\quad
 1/4\le c=1-bw/a\le2260,\quad v\le116,
\]
\[
 G=2c^2-(v-2)(w+b/a)^2\ge1/8,
 \quad 2<a\le4,\quad |b|\le15,
 \quad |w|\le e^{16T}+e^{-186T}.
                                                        \tag{S5}
\]

These are actual post-I2 comparison bounds, including the portions
between its two separated edits. They are not merely moment totals.

Write `D=P_c-v` and `H_q=2D^2-(v-2)J_c^2`. Directly,

\[
 D/P\ge c/2\ge1/8,\qquad
 H_q/P^2=G-4cv/P+2v^2/P^2\ge1/16.             \tag{S6}
\]

The first uses `116/2^33<1/8`; the second uses
`4*2260*116/2^33<1/16`. Also

\[
 |p_s-(a,-b)|/P\le1+|w|+19/P<3e^{16T},
 \qquad D/P\le c\le2260.
\]

The normalized directional inequalities (4.26) consequently hold with

\[
 \kappa_{ext}=\min\{e^{-16T}/24,\ 1/(16\cdot2260^2)\}
 >\min\{e^{-16T}/24,2^{-27}\}>C^{-2}.          \tag{S7}
\]

Indeed `16T+log24<2logC`, and `C^2>2^27`. The terminal collar
`1/2<=y_o<=3` has kappa=1/2 by H23–H27 of the heat note.
The closed inner collar has kappa=1/2 by
`ACTIVATION_COLLAR_BOUNDS_EN.md`, including the actual C^-120
substitution. Thus all preserved regions supply the input margin
`R^-1` required by the C.12 contract when `R>=C^2`.

Combining those regions with the actual C.12 result gives the single
closed-annulus margin **kappa=R^-10**. This conclusion still requires
the actual envelope R and its source verification; a formal placeholder
for R does not instantiate it.

## 4. One exact global flat weight

Inside the annulus define

\[
 \zeta(X)=\exp\left[-\frac{t_1^2}{\log^2(X/X_a)}
                      -\frac4{\log^2(X_b/X)}\right],
                                                        \tag{S8}
\]

and put zeta=0 on `X<=Xa` and `X>=Xb`. It is smooth, positive
inside, and flat at both endpoints. In particular `0<zeta<=1`.
The following lower bounds refer to the actual physical-stress profile
T0 and are independent of q.

### 4a. Inner collar

The final modulation is exactly zero on this whole collar, including
its overlap with J. Indeed the activation estimate gives
`v_s>=21/10` for `0<=log(X/Xa)<=t1/4`. The actual loop cutoff is
zero once `v_s>=2+delta_L/4`, and the fixed choice
`delta_L=exp(-S^16)<1/10` lies below that threshold. The C.1 loop is
therefore the constant original shear here. Both prescribed periodic
primitives A and B in C.11 vanish identically, so C.12 changes no field
or forward moment on this collar. The I1 repair and all later edits
are supported farther right. Thus the following B.27/B.30 statements
apply to the final field itself.

On `0<log(X/Xa)<=t1/4`, the actual activation has
`F/F_ref>=1`: its log ratio is the positive integral in B.27.
The reference has
`F_ref>=exp(-34Lambda/sigma_axis^2)/(4C)>=C^-3`.
Here `34Q^66<logC` and `C>=4`. The same input bounds give
`|t_s|<=|p2,r/p1,r|<=Gamma^2<C^6`.

The exact angular projection is `F(Pc-vs)`, and the activation note
gives `Pc-vs>=2e_a`. Since

\[
 e_a=e^{-t_1^2/y^2}g_a(y),\quad g_a(y)\ge1/4,
 \qquad y=\log(X/X_a),
\]

we obtain

\[
 |T_0|\ge\frac{F}{2\sqrt{1+t_s^2}}e^{-t_1^2/y^2}
 \ge C^{-11}e^{-t_1^2/y^2}\ge C^{-11}\zeta.
                                                        \tag{S9}
\]

The denominator estimate used is `2(1+C^6)<=C^8`.

### 4b. The affected interval J

The C.12 contract gives on J: final `E>=1/(2R)`, `X<=R`,
`a>=1/(2R)`, `|b|<=2R`, and `Pc-vs>=1/(2R)`.
Thus `F>=R^-2`, `|t_s|<=4R^2`, and

\[
 |T_0|\ge F\frac{P_c-v_s}{\sqrt{1+t_s^2}}
 \ge\frac1{10R^5}\ge R^{-8}\ge R^{-8}\zeta.
                                                        \tag{S10}
\]

We used `sqrt(1+16R^4)<=5R^2` and `R>=8192`.

### 4c. I1 through the start of the terminal heat collar

The original E decreases after I1. The I2 compensation changes it
by less than a quarter in relative value, and the actual heat factor
is at least 1/2 on this region. Hence S4 gives
`E>=C^-2`. Since `X<=C^11`, `sqrt(2X)<=C^6`, so `F>=C^-8`.
By S5–S6, `|t_s|<8` and `Pc-vs>=P/8`. Therefore

\[
 |T_0|\ge F P/72\ge C^{-8}\ge C^{-11}\zeta.
                                                        \tag{S11}
\]

### 4d. Terminal middle, 1/2 <= y_o <= 5/2

Let `rho=h/256`. S1 implies `rho>=C^-2`. The positive last term
of A.54, proved quantitatively in H23, gives

\[
 T_{0,\theta}\ge \sqrt{X/2}\,
             E_{pow}(X)H(2d/X)\rho\psi_o(y_o)/L.
\]

Here `H>=1/2`, `E_pow>=C^-1`, `X>=1`, and
`psi_o(y_o)>=sigma(1/4)>1/(2*3^16)>2^-27`.
It follows that

\[
 |T_0|\ge2^{-29}C^{-3}\ge C^{-4}\ge C^{-11}\zeta.
                                                        \tag{S12}
\]

### 4e. Outer flat collar, 0 < delta_o <= 1/2

Write `delta=delta_o`,
`u=exp(-4/delta^2)` and `v=exp(-(1-delta/2)^(-2))`.
Then `psi_o=u/(u+v)` and its exact derivative gives

\[
 f_o'(y_o)=\rho\frac{uv}{(u+v)^2}
       \left(\frac8{\delta^3}+(1-\delta/2)^{-3}\right)
 \ge\frac{2\rho}{9}e^{-4/\delta^2}\delta^{-3}.
\]

The lower bound uses `v>=e^-2>1/9` and `(u+v)^2<=4`.
The positive boundary term of A.54 consequently gives

\[
 |T_0|\ge
 \frac{2\rho E_{pow}(X_b)}{9\sqrt{2X_b}}
      e^{-4/\delta^2}\delta^{-3}
 \ge C^{-10}e^{-4/\delta^2}\delta^{-3}
 \ge C^{-10}\zeta.                            \tag{S13}
\]

We used S4, `rho>=C^-2`, `sqrt(2Xb)<=C^6`, `H>=1/2`,
and `C>=9/2`. All small powers and heat factors refer to the same
selected exterior; no unspecified positive minimum is used.

The intervals in 4a–4e cover the annulus and overlap. Their common
explicit lower constant is

\[
 \boxed{|T_0|\ge c\zeta,\qquad
        c=\min\{C^{-11},R^{-8}\}>0.}           \tag{S14}
\]

## 5. Flat factorization, all fixed derivatives and endpoint directions

The actual B.30 identity on the unchanged inner collar is
`T0=e_a B0`, with B0 smooth, nonzero at Xa, and
`B0(0,eta)=F(Xa,eta) p_s,r(Xa,eta)`.
S9 also bounds its size below throughout the chosen smaller collar.
Consequently `n=B0/|B0|` is smooth there and its edge value is
parallel to the actual shear `(a,-b_s)`.

On the outer collar the exact A.48–A.50 identities, for the same
heat exterior and the same corrected moments, are

\[
 T_{0,\theta}=e^{-4/\delta^2}\delta^{-3}b_\theta,
 \qquad T_{0,z}=e^{-4/\delta^2}\delta^3 b_z.
\]

Both coefficients extend smoothly, and S13 keeps b_theta bounded
below. Thus the direction is the normalization of
`(b_theta,delta^6 b_z)`, with endpoint value `(1,0)` and `b_s=0`.
No endpoint value is computed by dividing zero stress by zero norm.

Differentiating either exact factorization a fixed number of times
introduces only a finite inverse power of its distance to the edge.
The factor from the opposite edge in S8 has a positive minimum on
each closed small collar. On the remaining compact middle, zeta and
the distance to both edges have positive lower bounds. Thus for each
fixed multi-index alpha there are finite constants C_alpha,m_alpha
such that

\[
 |\partial^\alpha T_0|\le
 C_\alpha\zeta\min\{1,\log(X/X_a),\log(X_b/X)\}^{-m_\alpha}.
\]

Their finiteness follows from the fixed smooth coefficient formulas
and the single fixed N. This is not a simultaneous smallness claim
for all derivative orders, nor a uniform estimate as N tends to
infinity. Requested finite orders may be bounded by differentiating
the same formulas and their implicit roots; no different field is used.

## 6. Exact support and preserved patches

The regular axis solves the exact leading core equations through Xa,
so T0=0 there. With that regular axis, exact total M,J,S, renormalized
I, and the pressure identity, A.8 makes the backward stress zero on
`X>=Xb`, where the swirl is the exact heat solution. S14 makes it
nonzero at every radial interior point, for every eta.

The C.12 modification and its I1 restoration are supported strictly
after the preserved inner analytic rectangle and before I2. The heat
change occurs at its prescribed far exterior location and has its
compensation in I2. The fields U,E on I3 and I4 retain their exact
unmodified power laws. These are the later Ipos and Imean patches.
Their cumulative moments need not equal the pre-heat outer values;
they belong to the same heat-prepared final field, as required.

The final forward pressure starts at the same Pi0. The exact B.8,
I2 and I1 equations preserve the pressure increment, so it equals the
backward pressure normalized to zero at infinity. All support,
factorization and direction claims therefore concern that single
pressure and field.

This closes the stress assembly **if its actual axis, B.8, heat and
finite-N source inputs are all attached**. The scalar checker and this
implication alone do not fill missing inputs or promote a full-profile
gate. In particular the existence of R as an unsupported compact
supremum is not the required whole-domain numerical certificate.
