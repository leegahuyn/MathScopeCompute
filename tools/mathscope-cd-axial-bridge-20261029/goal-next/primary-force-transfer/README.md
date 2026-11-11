# First corrected primary-flat forcing: C3 transfer and obstruction

The independently replayed corrected first-Forced receipt binds all 30 real fundamental operands in ten fixed band/sign charts to the **same uncut actual primary amplitude**: `P_primary=(1/2)*psi_v*A_uncut`. It retains the fixed coordinate substitution, the positive target weight, the original moving-frame tangency, and the inner cutoffs in the target-weight integrals. The receipt's own hash and graph hash are checked here; this short replay does not redo that independent graph traversal. The corresponding corrected input is `f_supported=f_raw-P_primary`; bounding this single term is only part of bounding f_supported.

## Conditional direct transfer, no division by the cutoff

In each fixed-label own chart, `v` is the pulse variable, `L=Ls` is independent of slow variables and v, and the original time cutoff is

    psi(v) = sigma(20v/L-4) * sigma(16-20v/L).

The two transition intervals are `(L/5,L/4)` and `(3L/4,4L/5)`. On either transition the other factor is identically 1, and all positive-order derivatives vanish on the exterior/plateau and at the flat joins. For the actual common window, `L>=1` follows from `L=2*r0/ci`, `ci<=ell^(-2)`, `r0=2^(-34)`, and `ell>=ellMinimum>=Bnorm^512>=2^65536`.

Let `a(u)=exp(-u^(-2))` for u>0 and zero otherwise, and `sigma=a(u)/(a(u)+a(1-u))` on (0,1) with its original flat endpoint extensions. On [0,1] the denominator is at least exp(-4)>1/81 and 0<=sigma<=1. Repeated differentiation gives `a^(n)=P_n(1/u) exp(-1/u²)` with `P_(n+1)=2z³P_n-z²P_n'`. The exact integer ledger in `check_primary_force_transfer.py` bounds the first four derivatives of a by `[4,36,1968,36720]`. From `sigma*(a(u)+a(1-u))=a(u)`, the Leibniz recurrence bounds successive sigma derivatives by `[972,1268460,2483370576,6482530964880]`. These are conservative, source-independent constants. Hence, for r=1,...,4, on the full pulse interval including its one-sided joins,

    |partial_v^r psi| <= 20^r * bound(sigma^(r)) / L^r <= 2^60/L.

Suppose independently that every actual uncut-amplitude partial derivative in the fixed own coordinates (slow variables, xi, v) through total order 3 is bounded pointwise by `N*W`, with the same `W` including the correct Gaussian `P(v)`, epsilon, zeta and boundary-pole factors. Because L and labels are fixed, the product rule gives, for every total mixed order <=3,

    |D^alpha P_primary| <= (1/2)*(2^3)*(2^60/L)*N*W
                        = 2^62*N*W/L.

This is a proved implication from the stated common-weight input bound, not a constructed actual N. In particular, the historical order-2 primary class output is for `psi*A_uncut`. Its internal algebra has amplitude ingredients through order 3, but the uncut product must be separately authenticated and bounded from actual sqrt(y), fixed pulse, and slow/transverse factors before applying the implication. The C5/target-C3 hosted artifact, even if successful, does not itself certify that new uncut attachment or the full corrected forcing. For a common-reference class the exact fixed-lift and neighboring band epsilon, zeta and S conversion are additional required steps. The two correction signs, 20 actual forced inverses, pressure and all other raw residual terms must remain included.

## A sharp obstruction to dividing the cutoff

A qualitative countermodel shows why the finite C2 norm of `psi*A` alone cannot supply the required uncut term. Near the left endpoint set `u=20v/L-4`; the other cutoff factor equals one. Let `b` be a nonnegative smooth bump supported in `(1,2)` with `b(3/2)=1`, and define

    F_delta(u) = delta^2*b(u/delta),  A_delta(u)=F_delta(u)/sigma(u)

on the transition, extending A_delta by zero outside its compact support. Each A_delta is smooth. The C2 norm of F_delta=sigma*A_delta is uniformly bounded, but at `u=3delta/2`, the logarithmic derivative satisfies `sigma'/sigma=2/u^3+O(1)`, so `sigma'*A_delta=(sigma'/sigma)*F_delta` grows like `delta^(-1)`. This family is a logical counterexample, not an assertion about the actual native amplitude. It establishes that even a successful bound for the cut C2 field cannot automatically be divided by the flat cutoff to produce the needed input. The direct uncut construction above is the appropriate missing step.

## Replay

    python check_primary_force_transfer.py --repo <checkout> --binding <independent-primary-half-amplitude.json> --out result.json

The test uses exact integers, checks all ten chart keys and 30 source bindings, source cutoff code, seed-polynomial recurrence and derivative constants. It does not evaluate the actual field or prove the stronger uncut source seminorm. All status counts and RELEASE HOLD stay unchanged.
