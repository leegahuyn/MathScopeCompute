# The original n=1 leading bound on the whole real-X/complex-eta rectangle

This instantiates the precise missing premise in the preceding
`n1-native-semantic` packet. It does not assume that premise. The input
foundation is the already independently constructed ACTUAL infinite
natural-axis theorem `SAME_DATUM_ANALYTIC_AXIS.md`, SHA-256
`1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920`.
That theorem constructs one analytic function of the same pressure datum,
proves its coefficient-space norm <=Q, its natural-mode ODE and its regular
mass/pressure primitives. It is a written analytic theorem, not a completed
Lean instantiation. This packet does not replace it by a finite polynomial.

## Statement with the unchanged source constants

Use the original normalized angular field F0=phi0/C and axial field U0.
Put

```
Lambda=Q^64, Xa=4/Lambda, t1=CSelected^(-120),
rho=sigmaStar^2/65536, delta=rho/(1024Q),
a^2=Xa exp(t1/16), B=4096 Lambda^2 Q^3/t1.
```

On the WHOLE rectangle `0<=X<=a^2`, `eta in S_delta`, the actual leading
F0,U0 have ordinary physical-X derivatives0,1,2 bounded in absolute value
by this B. They are holomorphic in eta. Every fixed higher physical-X
derivative also exists and is holomorphic on a smaller common eta tube,
with a finite bound allowed to depend on the derivative. The core and
B.26 fields have matching fixed jets at Xa. The actual core/collar v0
is reconstructed from the SAME ordinary average of this U0.

The X variable here is the actual source X, with inner Picard xi=sqrt(X).
It is not the similarity radius R; the separate paper convention is R^2=2X.
No common interval, amplitude, activation width or source constant is changed.

## 1. Source binding, including the actual average

The exporter runs the original producer unchanged and pins its original
117,100-node prefix to d125d121...2116. It hard-pins the pregluing source,
profile and exact body-comparison helpers. All selected branch inequalities
are stated below; the generic reducer itself is not treated as authority.

For B.26 log radius y in [0,t1/16], the source evaluation radius is
`cx=Xa exp(y)`. It satisfies `cx<Xstart=Xa exp(t1)`. Thus every B.22
reference field and all five reference moment branches select their natural
core branch. There are eight recorded branch changes in each actual control.
The source's local terminal yB is `log(100/Xa)>1>t1`; hence beta=1 and
blend=0 here. This local 100 is the pregluing control threshold, not the
later complete global Xb. The same inequalities hold at each actual
integration binder0<=s<=y.

Exact body/alpha comparisons bind the original shear and U controls to

```
actualShear = kappa * naturalSource.p1,
actualUControl = -(1/2) kappa * cx * naturalSource.ns,
kappa = 1-(1-t1)*sigma(y/t1).
```

These are the literal `sourceFromState` functionals of the same natural
fields and their five complete core moments. This is not an assumption that
B.26 actual fields equal their B.22 reference. Actual B.26 integrals remain.
The original unsimplified natural operand is Lambda*cx; only the separately
checked source equality Xa=4/Lambda converts it to Y=4exp(y).

Additional exact checks bind the actual inner F0 collar to
`g*Phi(4)*exp(-(1/2) integral_0^y actualShear)` and the actual U0 collar
to its original B.26 integral. The harmless E/sqrt(2X) conversion is
cancelled only for X>=Xa>0. The actual v0 core branch uses
`Avg U0=Ustar+naturalAverage(Lambda X)/Lambda`; its collar branch uses

```
M(X)=coreM(4)+integral_Xa^X actualB26U,
v0=(2eta U0-2D eta*(M/X)-d partial_eta(M/X))/L.
```

Both branch bodies are checked against the original v0 nodes. The natural
average theorem gives `coreM(4)=integral_0^Xa U0`. Therefore the collar
formula is the same ordinary integral0..X of the actual U0. No new average
bound is assumed, and no singular axis division is evaluated.

## 2. Match the ACTUAL source controls to the natural-mode ODE

Write `A=1/2+h,D=1/2-h,d=1-eta^2,L=1-2h eta^2`. The literal source
moments have ordinary derivatives

```
M_X=U, I_X=2XF, J_X=2XUF,
S_X=U^2-XF^2, Pi_X=F^2.
```

All start with zero primitive constant except the retained actual pressure
Pi(0)=P0(eta). Set

```
W=1-(2D eta M+d M_eta)/X,
K=(1-h)I-D eta I_eta-d J_eta+2(h-D)eta J,
Qs=-W+K/(2X^2 F),
Ns=-WU+[D(M-eta M_eta)+4h eta S-d S_eta]/X
        +4A eta Pi-d Pi_eta.
```

These are precisely the sourceFromState operands, not substitute mode
coefficients. Define the denominator-free first-integral quantities

```
Ctheta=K-2X^2 F W+4L X^2 F_X,
Cz=X Ns+2L X U_X.
```

Independent SymPy differentiation with the five displayed primitive laws
proves exactly

```
partial_X Ctheta = -2XL raw_theta,
partial_X Cz = -L raw_z,
```

where raw_theta and raw_z are the original leading natural-mode advective
coefficients with the full time, transport, pressure and radial viscosity
operators. No positive-order or previous-order viscosity is inserted.
The source v is `(W-1+2eta U)/L` in those coefficients. Both primitive
constants vanish at the regular axis: I,J,M,S and their eta derivatives
are zero there, and every other term in Ctheta,Cz has an explicit X factor.
There is no lost pressure constant. The wrong omission of P0 gives the
nonzero derivative defect `-4A eta P0+d P0_eta`, checked independently.

The ACTUAL analytic natural solution satisfies raw_theta=raw_z=0 by the
pinned mode ODE. Consequently Ctheta=Cz=0. The exact algebraic conversions
checked in Python then give, for positive X,

```
p1_ref = X Qs/L = -2X F_X/F = -2Y Phi_Y/Phi,
ns_ref = Ns/L = -2U_X = -2u_Y.
```

This connects the original integral state to the exact mode, including its
regular axis constants. It is valid for the complex eta tube too: the
analytic-axis theorem supplies the holomorphic mode and primitive identities,
or equivalently they extend from real eta by the identity theorem. The
division by F is legitimate since g is a nonvanishing exponential and Phi
has the complex lower bound proved below.

## 3. Source-selected amplitude and complex tube

The unchanged source has `Q=2^260 K/sigmaStar^2`, K=Pstar^2>1,
`Lambda=Q^64`, and
`log CSelected=10log(1+Q^300)+Q^200`. Hence Q>=2 and

```
log Caxis=64 Lambda/sigmaStar^2+1
        <=64 Q^65+1 < Q^200 < log CSelected.
```

The middle strict inequality follows from `Q^135>=2^135>128`.
Thus CSelected>=Caxis, so the pinned analytic-axis amplitude theorem gives
|g|<=1 on its original complex tube. Also CSelected>=Q, t1<=2^-120,
and `8Q t1<=8 CSelected^-119<1`. No numerical underflow or amplitude
reselection is used. The source j0=h^4 and sigmaStar=j0/2000 ensure
0<rho<1 and delta<1/2048<1/32. S_delta lies inside the original analytic
tube and has |eta|<=33/32; L is uniformly nonzero there.

## 4. Natural C2 bounds on S_delta

The actual coefficient-space norm <=Q and its positive binomial majorant
give, on |Y|<=4.1 and dist(eta,[-1,1])<=delta,

```
|partial_Y^k f| <= Q * k!/20^k * (1-|Y|/20-delta/rho)^(-k-1),
```

for f=Phi,u. The ratio is at most `41/200+1/1024<1/4`.
Exact rational comparison gives
`|f|<=2Q, |f_Y|<=Q/5, |f_YY|<=Q/25` and `|Phi_eta|<=4Q/rho`.
The real actual Phi>1/4 from the same theorem, so integration along a
complex eta segment of length<=delta gives

```
|Phi| >= 1/4-4Q delta/rho = 63/256 > 1/8.
```

This proves the actual inverse and log-slope have no hidden pole.
The exact FULL source slope p1_ref (including its factor2) obeys

```
|p1_ref|/Q <= (41/10)*(1/5)*(512/63) <8,
|partial_y p1_ref|/Q^2
 <= (41/10)*(1/5)*(512/63)
    +(41/10)^2*(1/25)*(512/63)
    +(41/10)^2*(1/25)*(131072/3969) <80.
```

Here 512/63=2/|Phi|_lower and 131072/3969=2/|Phi|_lower^2.
There is no missing factor2. The B.26 log-F slope is `p=-p1_ref/2`,
so it obeys the same stated loose bounds8Q,80Q^2.
Likewise, `r=Y u_Y/Lambda` satisfies `|r|<=Q/Lambda` and
`|r_y|<=2Q/Lambda` by exact rational comparisons.

Natural F=gPhi and U=Ustar+u/Lambda have X derivatives given by the
constant scaling Y=Lambda X. Their C2 bounds are immediately smaller than
B. The value of U is <5 because `|Ustar|<=4*(33/32)+1/1000` and
`2Q/Lambda<=2^-62`.

## 5. ACTUAL B.26 C2 bounds and common join

The source/mode correspondence gives the actual equations

```
F_y=kappa p F, U_y=kappa r,
F(0)=gPhi(4), U(0)=Ustar+u(4)/Lambda.
```

For REAL y in [0,t1/16], |kappa|<=1 and |kappa_y|<=9/t1 by the
actual smooth-step bound. Kappa is eta-independent, so the actual finite
integrals and exponentials are holomorphic in eta on the whole S_delta.
Their exponent has modulus at most `8Q*t1/16<1/16`, giving |F|<=6Q;
the actual U integral adds at most t1 Q/(16Lambda), giving |U|<=6.
The elementary inequality exp(1/16)<2 suffices; no radial complex step is
introduced. In fact these functions need only smooth dependence on real y.

Product rules retain every term and yield

```
|F_y| <=48Q^2,
|F_yy| <=432Q^2/t1+864Q^3,
|U_y| <=Q/Lambda,
|U_yy| <=(9/t1+2)Q/Lambda.
```

At X>=Xa=4/Lambda, `partial_X=X^-1 partial_y` and
`partial_XX=X^-2(partial_yy-partial_y)`. Therefore

```
|F_X| <=12Lambda Q^2,
|F_XX| <=84Lambda^2 Q^3/t1,
|U_X| <=Q/4,
|U_XX| <=(3/4)Lambda Q/t1.
```

Every displayed value and derivative is bounded by the ORIGINAL
`B=4096Lambda^2Q^3/t1`, since Lambda,Q>=1 and t1<=1.
At y=0 the actual smooth step is flat and kappa=1 with every positive
derivative zero. Thus the actual integral solution and natural reference
have all matching fixed y jets, uniformly on smaller eta tubes. Changing
to positive X preserves these jets at Xa. The natural branch includes the
axis without any logarithmic evaluation. This proves the whole-rectangle
ordinary leading/holomorphic/average premises of the kernel packet.

## 6. Precisely what follows for the mathematical n=1 Picard solution

Combine this instantiation with the frozen `n1-native-semantic` actual
source norm-tree and prior source-bound Volterra convergence theorem.
The ACTUAL system0 coefficients and forcing are smooth on 0<=xi<=a,
holomorphic on S_(delta/4), and bounded there individually by C1/2,
where C1=262144B^2/delta^2. The original A1 mask and diagonal are unchanged.
For s=delta/8, its genuine Volterra series converges uniformly on
[0,a]xS_s, with the original tail4^-N/3 for
N>=ceil(72 C1^2 a^2/s). Its solution is unique among the stated bounded
holomorphic zero-axis solutions.

Ordinary eta derivatives on smaller tubes are the uniformly convergent
derivative series by Cauchy. The actual source RHS and first G kernel checks
identify requested eta jets0..2 (RHS inputs through3) with those derivatives
in the canonical series denotation. Every fixed real-xi derivative also
converges on a smaller eta tube by the prior high-radial-tail theorem:
its finite leading derivative bounds now exist from the actual smooth
B.26/natural formulas and their flat join, rather than being independent
Picard assumptions. Original parity gives even first-four components;
the existing regular even-X integral theorem identifies their ordinary
one-sided X jets, including the axis specialization. No strip or bound
uniform in all derivative orders or all n is claimed.

The infinite-series denotation remains different from numerical execution.
The actual diagnostic interpreter rejects the native descriptor, and its
finite display remains capped at eight terms. This packet does not implement
or run a numerical infinite interpreter. It also does not provide a Lean
proof of the entire original natural-axis coefficient-space construction,
or discharge general n, all outer actual callers, global FiveMap, final jets
or RELEASE. The stated mathematical n=1 implication uses the pinned actual
analytic-axis theorem as its existing foundation, with no new B oracle.
