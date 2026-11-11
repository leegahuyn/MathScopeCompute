# Original axial stress and recurrence

## VERIFIED — pinned original producer through order 3

The unchanged positive-stress producer materialized 139,216 graph nodes at
`order=3, maxNodes=2200000`. Its first 117,100 node JSON hash is
`d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116`,
the same prefix independently matched to the authenticated 4,420,257-node
first-FiveMap export. Orders 2 and 3 below are roots of this finite replay.
The separately authenticated #672 binding is order 1.

| Order | Raw axial | Supported density | Forward integral | Backward integral | Reduced whole |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 117045 | 117047 | 117057 | 117066 | 0 |
| 2 | 120788 | 120791 | 120804 | 120818 | 0 |
| 3 | 123838 | 123841 | 123854 | 123868 | 0 |

The source verified exact raw identities, pressure and continuity prerequisites,
whole five-moment repairs, signed primitive FTC, matching fixed stress jets and
its private evidence guards. The axial endpoints for all three rows are
`[Xminus#28814, Xplus#28824]`. In the original order-one registry
`ActualAllFiniteOrderOneStress_z#672` has body `#117069` and native density
expression 1 has body `#117047`; their two formal operands are
`[X#4756, eta#2]`. Its original axial whole root is `#117075`.

The old test suite ran orders 1 and 2. The new order-3 replay separately checks
the private producer and each axial result. The first run's wrapper incorrectly
looked for `pass` on each FTC row, although the schema has a global pass and
individual identity checks. `order-three.log` retains that assertion failure.
The corrected run verifies the global pass, each row's density, primitive and
FTC identities, and the false wrong-sign control. See `order-three-verified.log`.

## VERIFIED — arbitrary-order exact differential identities

The physical domain is $q>0$, $t<1$, $r\ge0$, with
$1-t=q(1-\eta^2)$, $z=q^D\eta$, $X=r^2/(2q)=R^2/2$,
$A=1/2+h$, $D=1/2-h$, $d=1-\eta^2$ and $L=1-2h\eta^2$.
Here $|\eta|<1$ and the physical $\pm1$ values are one-sided limits.
The determinant of the scaled $(q,\eta)$ derivative system is $L$.
The physical chain rule gives the manuscript's operators $T_a,Z_a$ from
(4.2). In particular the physical time, transport, pressure, radial viscosity
and previous-order axial viscosity terms have the same power
$q^{-A-1+\nu}$ for $\nu=2nh$. Radial integration removes a factor of
$q$ through $r\,dr=q\,dX$. In similarity radius $R\,dR=dX$.

Write $v_i=V_i/X$, $Q=\sum_{i+j=n}U_iU_j$,
$H=\sum_{i+j=n}v_iU_j$, $a=-A+\nu$,
$b=-2A+\nu$, $\mu=2(n-1)h$ and $c=-A+\mu$.
For each ordered pair separately, conversion to flux form adds
$U_j(\partial_X(Xv_i)+Z_{-A+2ih}U_i)$.
The corresponding stream identity makes that term zero. The resulting raw
conservative coefficient is

```text
T_a(U_n) + ∂X(X H) + Z_b(Q + Pi_n)
    - 2(X ∂XX U_n + ∂X U_n) - Z_(c-D)(Z_c(U_(n-1))).
```

Let bars drop the $X\partial_X$ part of the corresponding operator.
The exact identity keeps the whole radial boundary $B$.

```text
raw = Tbar_(D+nu)(U_n) + Zbar_mu(Q - X ∂X Pi_n)
    - Zbar_mu(Zbar_(D+mu)(U_(n-1))) + ∂X B

B = X U_n/L + X H - 2 eta X(Q + Pi_n)/L
    + Zbar_mu(X Pi_n) - 2 X ∂X U_n
    + 2 eta X Z_c(U_(n-1))/L
    + Zbar_mu(2 eta X U_(n-1)/L).
```

The term $\bar Z_\mu(X\Pi_n)$ includes the positive pressure boundary
contribution from $\int\Pi_n=-\int X\partial_X\Pi_n+[X\Pi_n]$.
The exact independent Python calculation checks these statements with free
symbolic exponents/functions. It also checks the distinct powers of the
first and fifth moments in (5.20) and the prior axial mass in (5.21).

## CONDITIONAL — arbitrary fixed n source implication

The original loop in `actual-residual-order-induction-source.mjs` constructs
n=1 from the existing exact original one-order Picard bootstrap. For each
n≥2 it calls the same six-component original constructor at $2nh$, using
the already completed cutoff-local lower tuples for the inner forcing and
the full globally extended lower tuples for the whole pressure and lower
moment histories. The order n loop rejects an incomplete prior tuple. Before
adding a later tuple, its current rational inverse checks run on the five
actual algebraic moment operands. The private global conservative-moment
adapter separately matches these operands to the complete source integrals.

For any fixed n, the following premises suffice to carry the axial conclusion
through that original loop.

1. The actual Picard solution has ordinary smooth profiles on the fixed
   radial core and all fixed inward η derivatives on the parameter closure.
   The retained core, flat radial cutoff and five bumps have the claimed
   ordinary semantics. The actual U, v and pressure have finite axis limits
   and agree with the reconstructed global stream and pressure.
2. The complete local and reserved-interval densities and every ordered lower
   convolution are the operands of the verified five-moment inverse. This
   proves $m_{n,1}=m_{n,5}=0$ as functions of η and supplies the stream
   and pressure zero exteriors. For n≥2 use $m_{n-1,1}=0$ from the
   preceding positive-order step. For n=1 the prior axial moment is
   $\int_0^{X_v}U_0\,dX=M_0(X_v)-M_0(0)=0$, using the original
   leading stream and its zero exterior. The order-one compensated
   angular moment is separate and uses $X_b$.
3. The checked ordering is $0<X_-<X_{keep}<X_{cut}<a^2$,
   with the positive patch to the right of the core and
   $I_{pos,right}<X_v<X_+<X_b$. The left raw residual is zero by the
   original core equations. The right raw residual is zero after $X_+$
   because each product has a positive factor and the pressure and current
   positive fields have their checked zero exterior. The prior factor is
   positive-order for n≥2. At n=1 the actual leading U has already ended
   at $X_v$. Smoothness up to and across $X_+$ gives a zero right jet.
   Every term of $B$ vanishes at $X=0$ by the factor $X$ and regularity
   and at $X=X_+$ by these exterior identities.
4. The same source endpoints are independent of η. For each fixed
   derivative order the mixed jets are continuous with one-sided boundary
   values on the compact integration rectangle. The usual differentiation
   under a fixed compact integral applies to each of those derivatives.
   Thus the integrated identity reduces to the three zero moment
   families. The same density in both literals then gives
   `backward - forward = whole/sqrt(2X) = 0` on $X_-<X<X_+$.
   The stress extends with zero fixed jets at each join. It is literal
   zero near $X=0$. The factors $X$ and $\sqrt{2X}$ are used away from
   the axis. In the active interval the radial equation for the stress is
   `∂X(sqrt(2X) T_n,z) = -raw`.

The original complex source strip is $4s_n$ for
$s_n=\delta/(8\cdot256^n)>0$. The preceding auxiliary solution strip
is $256s_n$, leaving $252s_n$. Its independent auxiliary complex
radial radii satisfy $r_{n-1}-r_n=2^{-(n-1)}>0$.
The original order-one actual solution uses a different, larger strip.
On the real interval the verified $0<h<1/16$ gives $L>7/8$.
On $|\eta|\le33/32$, the corresponding complex bound is
$|L|>7103/8192>1/2$, and $|d|<3$.
For any fixed finite n, this keeps the denominator nonsingular and permits
Cauchy estimates with a positive loss. The six-component derivative matrix
maps the first four coordinates to the last two and annihilates the last
two; diagonal Volterra kernels and η derivatives preserve this block
condition. Thus adjacent η operators vanish and a k-fold Picard term has
at most ⌈k/2⌉ parameter derivatives. Bounded analytic source data on the
larger strip yields the ordered-simplex/factorial convergence estimate of
(5.8) on the smaller strip. Even radial parity uses regular Volterra
integrals before passing from ξ to $X=\xi^2$, as in the original Picard
derivative implementation. All of these losses and bounds are for each
fixed order and jet.

At η=±1, $d=0$ is a value identity. The inward derivatives still
differentiate the full coefficients. For the scalar $f=1$, omitting
$d\partial_\eta(\bar Z_a f)/L$ gives a term zero at either endpoint
but with inward η derivative
$-4a\eta(1+2h)/(1-2h)^3$ there. With $a=1,h=1/32,\eta=1$, the
exact difference is $-17408/3375$.

## OPEN — remaining source execution and analytic semantics

The runtime requires a positive safe integer order and rejects requests above
the integer part of the square root of the requested graph budget. The graph
budget is capped at 8,000,000 nodes, so 2,828 is an upper bound on the
request order even before construction. The derivative materializer has its
own finite budget. The new replay establishes
orders 1–3. The algebra and conditional induction do not quantify over every
accepted or possible native caller. That quantification requires independently
establishing the actual ordinary Picard limit and native derivative semantics
for a general newly generated order under the original source majorants,
and transporting the verified regularity and domain through each application
of its formal `(X, eta)` operands. In particular, an outer inequality on a
caller's X is not automatically an inequality on a definite-integral binder or
an actual native X operand. A finite AST pass alone cannot discharge this
obligation. There is no assertion of one positive η strip or a derivative bound
uniform in n. The physical infinite cutoff, common flat residual, and terminal
jet certificates are separate obligations.

Reproduce from the common workspace root:

```text
python work/goal-next/axial-alln/check_axial_induction.py
node --max-old-space-size=4096 work/goal-next/axial-alln/replay_order_three.mjs work/goal-next/axial-alln/order-three.json
```

