# Parameter transport and actual endpoint spatial derivatives

These two replays extend the original selected N3 mode-two witness for
systems 1 and 5. The first retains the source-specific shear exponent for
arbitrary inputs to the variational equation. The second applies the
original spatial operators to the actual endpoint substitution.

For the source matrix

```text
M = -P K - n nprime^T/|n|^2 - d I,
P = I - n n^T/|n|^2, d = 4 epsilon k^2 |n|^2,
```

put c=n^T u and v=P u. Exact symbolic matrix identities give

```text
cprime = -d c,
vprime = M v - c P(Kn+nprime)/|n|^2.
```

Thus every input splits into a tangent component and a controlled normal
lift. If Nmin<=|n|<=Nmax, |nprime|<=N1 and ||K||2<=K0 on the admitted
closed pulse of length L, set

```text
H = Nmax/Nmin,
C = 1+H*(1+(K0+N1/Nmin)*L).
```

The full propagator has norm at most
C exp((Abg-mu)(t-s)), where Abg bounds the actual shear rate
sqrt((R FR)^2+GR^2)/2 and mu=4 epsilon/Renv^2 is the previously verified
carrier-based damping floor. In this bound the normal factors are
algebraic.

For the five original smooth parameters, the exact differentiated
zero-data equations are triangular. Each coupling lowers total derivative
order. Through order four there are at most four couplings, each
binomial row sum is at most 15, and each subinterval contributes one C.
Consequently the fixed-time derivative envelope is

```text
max_|alpha|<=4 ||D^alpha u(t)||2
 <= C F t exp(max(Abg-mu,0)t)
    sum_{j=0}^4 (15 C B t)^j/(j+1)!.
```

F bounds all actual projected forcing parameter derivatives through order
four and B bounds the nonzero parameter derivatives of M through that
order. These finite suprema, Nmin/Nmax/N1/K0 and the admitted analytic
domain still need actual enclosures. Every damping derivative remains
inside B.

For the two actual fixed-lift endpoint records the original pulse is

```text
v(Y) = ((vt dot (Jg^delta Y-center-copy))/Dgeom+r0)/ci,
delta = 0 or 1.
```

The source coordinates R,Z,T and theta are independent of this v, with
the original label, center and integer copy frozen. Exact arithmetic gives
L(v)=0 and (ci/Tg^delta)N(v)=1. Therefore each original spatial operator
Dr=partial_R+aL, Dz=epsilon partial_Z and
angular=R^(-1)partial_theta commutes with endpoint evaluation w=v(Y).
The replay verifies all first and second spatial operator compositions
on a universal 36-coefficient second-order jet, retaining derivatives of a
and inverse R. Higher spatial compositions follow by the first-operator
chain rule applied successively on a smooth fixed chart.

The normalized source time operator contributes exactly one pulse-time
derivative

```text
time(EU)=E(time_parameter U+partial_w U).
```

Arbitrary Y coordinate derivatives require their own endpoint chain
terms. The nonzero partial_Y1 v at delta=0 is retained as an exact control.
Cartesian rotations, phase factors, cutoff derivatives, normal quotient
potential, pressure, global flat joins and final jets require their
original source estimates.

From the workspace root with the archived inputs restored, use Python and
SymPy 1.14.0

```text
python work/goal-next/continuation47/forced/certify_parameter_transport.py
python work/goal-next/continuation47/forced/certify_spatial_endpoint_chain.py
```

The source witness and prior receipts are pinned by SHA-256. These
conditional analytic bounds and exact source operator identities advance
the two selected branches. RELEASE HOLD.
