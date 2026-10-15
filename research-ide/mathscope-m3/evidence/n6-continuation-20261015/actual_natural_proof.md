# Actual natural coefficient series: an independent Banach majorant

This proof concerns the actual recurrence in the unchanged
`actual-continuation-exact-core.mjs:58-78`, with the full fixed payload
SHA-256 `c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b`.
It does not use the payload string `coefficientNormUpper: Q` as a premise.
Argument-domain binding of every saved call is a separate application step.

## 1. Exact norm and its complete coefficient space

Fix `I=[-33/32,33/32]`, and set

```
b(n,m)=(n+m)!/[n! 20^n (n+1)^2 rho^m (m+1)^2].
||a||=sup_(n,m,eta in I) |partial_eta^m a_n(eta)|/b(n,m).
```

Use coefficient sequences of smooth functions on I with finite norm. This
is complete: a norm-Cauchy sequence gives uniform limits for every fixed
n,m, and uniform convergence of a function and its next derivative on I
identifies those limits as successive derivatives. The norm bounds pass
to the limit. The same argument on the real interval, with one-sided
endpoint derivatives, suffices; a priori complex norms of the unknown
coefficients are not an input.

For products, write i+j=n and r+s=m. The ratio of the factorial factors
in the Leibniz convolution is

```
binom(i+r,r)*binom(j+s,s)/binom(n+m,m) <= 1.
```

This counts the subsets with exactly r selections from the first i+r
positions, among all m-subsets of n+m positions. Also, for every n,

```
sum_i (n+1)^2/[(i+1)^2(n-i+1)^2]
 <= sum_i 2[(i+1)^(-2)+(n-i+1)^(-2)] < 8,
```

because `n+2=(i+1)+(n-i+1)` and `sum_(l>=1) l^-2<2`.
The identical inequality in m proves `||ab||<=64||a||||b||` for all
unbounded n,m. Radial averaging A divides coefficient n by n+1, so
`||A a||<=||a||`.

Define the actual raising operators

```
(IY a)_N=a_(N-1)/N,
(J1 a)_N=a_(N-1)/N^2,
(J2 a)_N=a_(N-1)/[N(N+1)]              (N>=1),
```

with zero constant coefficient. Direct ratios of b give all three norms
at most 80. This definition of J1/J2 retains the source's exact factors
one-half outside the operators.

More generally let P be a product of r input sequences, allowing at most
one factor to be differentiated once in eta and at most one factor to
have a radial `Y partial_Y`; these may occur on different factors or on
the same factor. Averages of a factor are allowed. Let e,d in {0,1}
record these operations. The positive Leibniz majorant is bounded by

```
64^(r-1) product_j ||a_j|| * n^d * b(n,m+e).
```

For e=1 this uses
`multinomial(m; m_j) <= multinomial(m+1; m_j+e_j)`; a radial coefficient
index is at most the total index n. At output N=n+1,

```
b(N-1,m+1)/[N^2*b(N,m)]
 = (20/rho)*(N+1)^2/N^3*((m+1)/(m+2))^2.
```

Multiplying by `(N-1)^d` is still at most `80/rho`. The e=0 ratio
similarly gives at most 80. J2 has a larger denominator than J1.
Consequently

```
||Ji P|| <= 80*64^(r-1)*rho^(-e)*product_j ||a_j||.       (A)
```

This is the bounded integrated mixed-product operator needed by the
actual recurrence. It does not assume the bare eta or radial derivative
is a bounded operator on the coefficient space.

## 2. The actual fixed inputs have these norms

The authenticated parameter expressions are

```
T=exp(2^20)+10, h=exp(-8002*T), j=h^4,
sigma=j/2000, rho=sigma^2/65536,
K=Pstar^2>1, Q=2^260*K/sigma^2, Lambda=Q^64,
BRefUpper=Q^300,
log CSelected=Q^200+10 log(1+BRefUpper).
```

In particular `0<h,j<1/1000`, `0<sigma<1`, `Q>=2^260`,
`rho^-1<=Q`. All source scales are finite exact real expressions.

The literal actual pressure is a fixed positive-measure integral

```
P(z)=-integral (1+z^2)^(-2 theta) dmu, 0<=theta<=1.
```

This follows directly by extracting `logf=-log(1+z^2)` from each retained
A.21 stage density. All stage lengths and the base amplitude factors
are eta-independent. The initial prefix contributes mass `5K/2`.
The first unit interval contributes at most
`(K/2) integral_0^1 exp(s/5)ds <5K/8`, since
`exp(1/5)<1/(1-1/5)=5/4`. The subsequent axial-decay interval contributes
at most `K/2`.

After that interval, every source logarithmic amplitude slope is at most
-1/2, except the terminal explicit factor `fo/(1-co*h)`, which lies
between 1 and 2. Interpolation adds the nonincreasing factor
`exp(-log(2)*sigma_step)`. Thus the complete remaining finite schedule
and its retained infinite terminal tail have total mass at most
`2K exp(-T)`. Since `T>128`, this is less than `3K/8`. Hence

```
mu(total)<(5/2+5/8+1/2+3/8)K=4K.                         (B)
```

All stage lengths are positive. The only nontrivial one is the wait:
its source Qb exceeds one, whereas its Qp is less than one. Indeed
`lambda>h`, so the preceding scalar Q solutions are positive;
the `-4 log h` hold adds `(1-h)*(-4 log h)`, and flattening decreases
this by a factor less severe than exp(-1). Thus Qb>1. The defining
terminal integral gives `Qp<=exp(3)*co*h/(1-co*h)<1` for `co=1/256`,
`h<1/1000`, using `exp(3)<27`. Therefore the logarithm specifying the
wait is positive. The finite positive measure (B) is about the literal
pressure body used by the native coefficient producer; it does not
require substituting a theorem about pressure-neutral angular edits.

On the strip `|Im z|<=1/16`, `Re(1+z^2)>=255/256`. The principal
logarithm is holomorphic there. A compact-uniform integrable bound for
the positive-measure integral proves holomorphy and
`|P|<=4K*(256/255)^2<5K`. On the much smaller tube used next, a
radius-1/32 Cauchy circle stays in that strip, so `|P'|<=160K`.

Let Omega be the distance-`sigma^2/2048` tube around I. It is convex,
contains zero, and satisfies `|z|<17/16`. The actual source polynomials

```
D=1/2-h, A=1/2+h, d=1-z^2, L=1-2h z^2,
Ustar=4z+j, Hstar=Dz+d Ustar,
Wstar=1-4d-2D z Ustar,
Zstar=-A(1-2z Ustar)Ustar-4Hstar-d P'+4A z P
```

obey `|Hstar|<10`, `|Hstar'|<20`, `|Ustar|<5`, `|Wstar|<23`,
`|Zstar|<1024K`, `|L|>99/100` on Omega. These estimates are direct
triangle inequalities with `|z|<17/16`; they are not sampled maxima.
For a nearest real x in I,

```
|Hstar(z)^2-Hstar(x)^2| < (400/2048)*sigma^2 < sigma^2/4.
```

Hence the actual denominator `Hstar^2+sigma^2` is bounded away from zero,
and

```
|chi|=|Hstar^2/(Hstar^2+sigma^2)|<=1,
|zeta|=|L Hstar/(Hstar^2+sigma^2)|<=32/sigma^2.
```

The primitive psi along a segment in Omega has `|psi|<=64/sigma^2`.
The actual selected amplitude satisfies

```
log CSelected >= Q^200 >= 64*Q^64/sigma^2+1,
```

because `sigma^-2<=Q/65536` and `Q>=2^260`. Thus the exact actual
`g=exp(Lambda*psi)/CSelected` has `|g|<=exp(-1)<1` on Omega.
There is no underflow substitution.

Every radius `r=sigma^2/4096` circle about I lies in Omega. For any
radial-constant holomorphic f bounded by M there,

```
rho^m*(m+1)^2*|f^(m)|/m! <= M*(m+1)^2/16^m <= 2M.
```

Therefore

```
||chi||<=2, ||L^-1||<=4, ||g||<=2,
||Zstar||<=2048K, ||zeta||<=64/sigma^2,
```

and the norms of every displayed polynomial input are below Q. These
are derived input bounds for the actual functions. The unknown Phi/u
coefficient bound has not been assumed.

## 3. Resolve the linear chi term without a smallness assumption

Let `Tchi=(1/2)J2 M_chi`. Since chi is radial-constant, it commutes with
J2. For k>=1, direct coefficient ratios show

```
||J2^k|| <= 20^k*(k+1)^2/[k!(k+1)!]
          <=80^k/[k!(k+1)!].
```

Multiplication by chi has norm at most 128. Thus

```
||Tchi^k|| <=5120^k/[k!(k+1)!].
```

The operator series `S=sum_(k>=0)(-Tchi)^k` converges absolutely and is
the two-sided inverse of `1+Tchi`: its finite telescoping remainder
tends to zero in operator norm. Also

```
||S|| <=sum 6400^k/(k!)^2 <=exp(160)<3^160<2^256<=Q/16.
```

The middle inequality follows from `binom(2k,k)<=4^k` and the even
exponential series. The final integer inequality is checked exactly.

Set

```
x0=(S 1, -(1/2)J1(L^-1 Zstar)).
```

Its second component has norm at most
`(1/2)*80*64*4*2048K<2^25K<Q/16`, so `||x0||<=Q/16` in the maximum
product norm. The closed radius-one ball about x0 is contained in
`||(Phi,u)||<=Q`.

## 4. Bound the complete actual nonlinear recurrence, term by term

Write t=Lambda^-1. The original coefficient loop is exactly the
coefficient recurrence of

```
W=Wstar+t*(-2D eta A(u)-d partial_eta A(u)),
U=Ustar+t*u, H=Hstar+t*d*u,
p=g^2 IY(Phi^2), alpha=A*(1-4eta Ustar)+4d,
R1=L^-1*[(W+h*(1-2eta U)+d*u*zeta)*Phi
          +W*(Y partial_Y Phi)+H*partial_eta Phi],
R2=L^-1*[alpha*u-2A eta*t*u^2+W*(Y partial_Y u)
          +Hstar*partial_eta u+d*t*u*partial_eta u
          -4A eta*p+d*partial_eta p-2eta*(Y partial_Y p)].
```

In particular `||p||<=80*64^3 Q^4` and
`||p(Phi)-p(Phi')||<=2*80*64^3 Q^3 ||Phi-Phi'||`.
Expand R1 into its twelve literal monomials. Applying (A) and `||S||<=Q`
gives positive majorant rows `c Q^a` for `S J2 R1`:

```
term                         c                       a   field degree
Wstar*Phi                    80*64^2                 4       1
-2t D eta A(u)*Phi           160*64^4                 6       2
-t d A(u)_eta*Phi            80*64^3                  6       2
h*Phi                       80*64^2                  4       1
-2h eta Ustar*Phi            160*64^4                 6       1
-2th eta u*Phi               160*64^4                 6       2
d u zeta*Phi                80*64^4                  6       2
Wstar*(Y Phi_Y)              80*64^2                  4       1
-2t D eta A(u)*(Y Phi_Y)     160*64^4                 6       2
-t d A(u)_eta*(Y Phi_Y)      80*64^3                  6       2
Hstar*Phi_eta                80*64^2                  5       1
t d u*Phi_eta                80*64^3                  6       2
```

The L^-1 factor is included in every row. The single possible eta
derivative costs rho^-1<=Q, and the S factor costs Q; no bare unknown
derivative is bounded separately. For `J1 R2` the twelve rows are:

```
term                         c                       a   field degree
A*u                         80*64^2                  3       1
-4A eta Ustar*u              320*64^4                 5       1
4d*u                        320*64^2                 3       1
-2A eta t*u^2                160*64^4                 5       2
Wstar*(Y u_Y)                80*64^2                  3       1
-2t D eta A(u)*(Y u_Y)       160*64^4                 5       2
-t d A(u)_eta*(Y u_Y)        80*64^3                  5       2
Hstar*u_eta                  80*64^2                  4       1
d t u*u_eta                 80*64^3                  5       2
-4A eta*p                    4*80^2*64^6              7       2
d*p_eta                     80^2*64^5                7       2
-2eta*(Y p_Y)                2*80^2*64^5              6       2
```

In the last three rows the full p majorant, including g^2 and the
primitive, is retained. Difference of each multilinear monomial is a
telescoping sum replacing one unknown field factor at a time. Thus its
Lipschitz row is `(field degree)*c*Q^(a-1)`.
The exact sums of the two positive coefficient ledgers and their
degree-weighted versions are both less than `2^56<Q`. Maximum powers
are seven for the value and six for its Lipschitz bound. Consequently
on the full norm-Q ball,

```
||(S J2R1, J1R2)|| <Q^8,
Lip[(S J2R1,J1R2)] <Q^8.                                  (C)
```

The accompanying checker verifies these exact integer ledgers and the
source recurrence's commutative monomial expansion. It does not sample
finite n,m to infer the universal operator estimate (A).

## 5. Construct the actual unique limit and identify every coefficient

The original recurrence is equivalent to

```
F(Phi,u)=x0+(1/(2Lambda))*(S J2R1,J1R2).
```

By (C), F maps the closed radius-one ball about x0 to itself and has
Lipschitz constant less than `epsilon=(1/2)Q^-56<1/2`.
Completeness and the geometric series of consecutive iterate
differences construct its unique limit x in that ball. Continuity of
the bounded integrated operators identifies its fixed-point equation.
Taking limits in the displacement bound gives `||x-x0||<=epsilon`.
This is an existence/convergence proof, not a premise named
`FixedPointExists` and not a finite displayed partial sum.

All raising operators increase radial degree. Comparing radial
coefficients gives exactly

```
Phi_0=1, u_0=0,
Phi_(n+1)=(-chi Phi_n+t*(R1)_n)/[2(n+1)(n+2)],
u_(n+1)=(-L^-1 Zstar*[n=0]+t*(R2)_n)/[2(n+1)^2],
p_(n+1)=g^2*sum_(i=0)^n Phi_i Phi_(n-i)/(n+1).
```

The right sides depend only on earlier radial coefficients and their
actual eta derivatives. Induction therefore identifies **all** finite
coefficient outputs of the actual source producer with this single
limit, and proves their bound from the construction. The definition of
`actual_natural_series` is the limit of these same outputs; no second
function is substituted for it.

For every fixed radial/eta derivative order and `|Y|<=Ymax<20`, the
resulting differentiated series converges uniformly by its explicit
b(n,m) majorant and the ratio tending to `Ymax/20`. This proves normal
convergence and local smoothness of the actual function. It also
provides the original tail formula for that same recurrence.

For the needed positivity, `S1=f0(chi Y)`, where

```
f0(x)=sum_(n>=0) (-x)^n/[2^n n!(n+1)!].
```

On real eta, `0<=chi<=1`. For `0<=x<=41/10`, the alternating tail
after degree three is positive, and the cubic is strictly decreasing:

```
f0(x)>=1-x/4+x^2/48-x^3/1152
      >=305719/1152000 >1/4+1/128.
```

Since `||Phi-f0(chi Y)||<=epsilon`, evaluation on Y<=41/10 has error
at most `epsilon/(1-41/200)<2epsilon<Q^-56<1/128`.
Therefore the **actual Phi is greater than 1/4** throughout that real
rectangle. This supplies, rather than assumes, the real lower bound
used by the later original Picard coefficient-domain proof.

The same norm also supplies its required complex extension. Summing the
coefficient bounds first gives, for real eta in I and |Y|<=5,

```
|partial_eta^m Phi| <= Q*rho^-m*m!/(m+1)^2*(4/3)^(m+1).
```

The eta Taylor series therefore converge normally for distance less than
3rho/4. On distance at most rho/4 their differentiated series obey

```
|Phi_eta| <= (Q/rho)*(16/9)*sum_(l>=0) (l+1)/3^l
           =4Q/rho.
```

Here dropping the further denominator `(l+2)^2` only enlarges the bound.
Overlapping Taylor disks agree on a real interval and hence throughout
their overlap, giving the same holomorphic extension. At the source
`delta=rho/(1024Q)`, real Y<=4.1 and dist(eta,I)<=delta consequently give

```
|Phi(Y,eta)|>=1/4-(4Q/rho)*delta=63/256>1/8.
```

Thus the original complex reciprocal-Phi domain is derived on the
actual prescribed source tube, without a numerical Phi enclosure.

## Source application boundary

The analytic argument above uses the literal recurrence and exact
parameter hierarchy displayed in the full authenticated fixed payload
and pinned coefficient-producer source. Its executable source-binding
probe must confirm that re-running the degree-zero producer retains
the same core/pressure/outer fixed bodies; finite degree-zero execution
alone is not the proof of the infinite contraction.

The theorem proves the natural function's coefficient norm, normal
convergence and real Phi positivity on the stated rectangle. It does
not by itself prove that every syntactically reached natural call in
g21 has an **active** argument inside that rectangle, that every
parameter substitution respects the domain, or that every whole-radial
candidate guard is valid. Those actual argument/binder/native-context
bindings remain separate requirements before original Guard 10 or
Jet/PDE counts can be changed.
