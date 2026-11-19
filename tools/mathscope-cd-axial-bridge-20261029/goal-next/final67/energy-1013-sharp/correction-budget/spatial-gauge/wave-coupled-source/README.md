# Original initialized primary wave within its reserved energy budget

The complete initialized primary-wave contribution, including its outer
axial-cutoff curl and all first spatial derivatives, satisfies
J_wave^2 < 2^(-32) S_R under the original archived source, stable pulse,
normal/determinant, derivative and smooth-chart premises. This is stronger
than the requested 2^(-28) fraction. The active later corrections remain
separate.

All quantities use the same normalization as the successful slow and mean
packets

```text
U_i = tau0^A u_i,
G_ij = tau0^(A+1/2) partial_j u_i,
J^2/tau0 <= 32 Xb (sum U_i^2 + 2 sum G_ij^2),
A=1/2+h, D=1/2-h.
```

The replay imports the exact common
weighted-velocity/evaluate_mean_bulk_energy.mjs helper with SHA-256
61d4d23e7ec003206758c861a2e464791730dc6f14b648d3b5eb721418f59f7b.
It uses that helper's h, ellMinimum, hLogTau and Xb without substituting
new numerical parameters. The final receipt records all four.
The historical input, fixed numerical parameters, background and common
threshold pins are the same as in the successful mean packet.

The original mixed-wave producer authenticates the 4,456,994-node source,
registry, six primary potential bodies and source curl. The numerical
program joins its 7,215 positive records to the pinned lower-covariance
graph. It retains the leading sqrt(epsilon), the complete
epsilon^(1-kappa_s) remainder and the pre-curl potential coefficient.
For the phase derivative k sqrt(epsilon)<=2 and
k epsilon^(1-kappa_s)<=2. The potential prefactor satisfies
Q^(-h) sqrt(epsilon)/k<=Q^(-h) epsilon=1. These cancellations remove the
apparent negative phase powers before numerical evaluation.

Let V0 bound the sum of real and imaginary velocity coefficients, V1
their ordinary spatial derivatives plus radial-fast, phase and connection
terms, A0 the original potential coefficient and A1 its corresponding
spatial derivative coefficient. The exact common Gaussian absorption is
included. With all 162 signed source rows retained,

```text
W = 162*64*Gauss*(21 V0 + V1 + 712 A0 + 20 A1).
```

The original cutoff bounds are 1, 20/tau0^D and 692/tau0^(2D).
Before the displayed enlargement the normalized localized velocity
envelope is 4 V0+20 A0, and the covariant gradient envelope is
32 V1+80 V0+692 A0+160 A1. The factors 32 and 160 include adjacent
polar-component connections. Every coefficient fits inside W.

Energy uses the Euclidean and Frobenius norms. These norms are preserved
by the polar-to-Cartesian rotations, as independently verified for an
arbitrary vector and 3-by-3 matrix modulo c^2+s^2=1. Thus the component
counts remain three and nine. No cancellation among waves or among
different physical windings is used.

The exact Laurent ledger has only P and F as correlated source factors,
with positive degrees 34 and 2. The original common threshold gives

```text
P <= exp(L/2^33),
F <= exp(1+L/100000),
L = h*(ellMinimum+13)*log(2)>0.
```

At P=F=1 the original numerical engine consumes 1,070 reachable records.
The strict directed comparison log(W0)+2 < L/16 and the exact degree
loss 34/2^33+2/100000<1/16 imply W<exp(L/8). The checked geometry gives
log(672 Xb)<L/4, hence J_wave^2/tau0<exp(L/2).
The source 2^(-32) force-budget loss is less than L, so its lower
logarithm is at least L. Therefore

```text
J_wave^2/(2^(-32) S_R) <= exp(-L/2) < 1.
```

The independent verifier reconstructs the archived graph join, the
coefficient root, 1,070 Laurent-degree bounds and three strict endpoint
orders using exact rational seeds. The arithmetic engine uses the
existing coarse directed representation; precision was not increased.

Run from the workspace root with fresh output paths. Set GOAL_NEXT to
the repository's tools/mathscope-cd-axial-bridge-20261029/goal-next,
RUNTIME to work/goal-next/annular-numeric-24/pinned-original-runtime and
HISTORICAL_INPUT to
work/goal-next/whole-k-prefix/historical-scale-arithmetic-input.json.

```text
python build_wave_energy_ledger.py GOAL_NEXT NEW_LEDGER
python check_wave_energy_scaling.py NEW_LEDGER NEW_SCALING_AUDIT
node evaluate_wave_energy.mjs GOAL_NEXT RUNTIME HISTORICAL_INPUT NEW_LEDGER NEW_ENERGY_RECEIPT
python verify_wave_energy.py GOAL_NEXT NEW_LEDGER NEW_ENERGY_RECEIPT NEW_READBACK
```

The scale audit uses SymPy 1.14.0 for the generic rotation norm identities.
The other Python steps use exact rational arithmetic and standard modules.
Required source conditions are recorded in the ledger and numerical
receipt. This is an initialized-primary-only bound on the same original
annular slab. The later active increments, complete N7/N8 certification
and final67 jets remain open. RELEASE HOLD.
