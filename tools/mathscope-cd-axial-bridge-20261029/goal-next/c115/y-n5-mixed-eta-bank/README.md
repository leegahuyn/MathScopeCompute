# Original N5 higher eta input bank

**VERIFIED.** The original 130,926-node N5 prefix and its N4 prefix are unchanged. The source norm producer at radial order two and eta order nine executes with 4,470 scalar nodes and leading roots `#5684` and `#5690`. Exact replay retains both actual branches of `Omega4/X`, their previous viscosity `-Z_(6h-D-1) Z_(6h-1) v3`, and the two previous N4 stress viscosities. All ordered lower products and three fixed-bound whole integrals keep the same eta, independent radial binders, and the range `[0,Xplus]`. Removing the middle `F2 F3`, `U2 U3`, ordered angular cross terms, or previous viscosity gives respectively 1, 1, 2, and 2 nonzero numerator monomials. The analogous literal lower sources reproduce their 7, 9, and 11 terms per branch at N2, N3, and N4.

**CONDITIONAL.** Use the original ordinary leading and native Picard realizations and the C105/C110/C112 paired local error estimates. The comparisons use the source finite recurrences at the original positive orders and keep the leading N0 fixed. Ordinary radial derivatives and differentiation under the original fixed-endpoint integrals are required. Use the original smooth endpoints, Ipos inverse, bump supports, pressure axis datum, and saturated zero exterior.

## Common norms and exact eta demands

For real eta in `[-1,1]`, let `||g||_m = sum_(k=0)^m sup|d_eta^k g|/k!`. Use the supremum over the relevant radial support of these norms for the value, first X derivative, and X-weighted second X derivative. This factorial-weighted norm is submultiplicative. The source has `L=1-2h eta^2`; on each radius-1/2 Cauchy disc, `|L|>1/2`. Consequently `||1/L||_9 <= 2046 < 2048`. The exact source radial mass law applies to the finite and true fields, with `Avg(U)=int_0^1 U(tX)dt`. Its gain from the F/U mixed radial family through eta `m+1` to v through eta `m` is bounded by `2^17`. In its second radial derivative, use `X t^2 U_XX(tX)=t (tX) U_XX(tX)`. With `B=max(1,Xplus)`, the ordinary `Z`, `X*d_X Z`, `T`, and `Z²` norm gains are bounded by `2^18 B`, `2^18 B`, `2^17 B`, and `2^36 B²`. The two-Z gain applies to input from eta `m+2`, preserving the mixed weighted radial forms. The source leading norm is `H=2^22(1+U_*+F_*)`; it supplies F0/U0 through eta nine and v0 through eta eight. Any required leading X weight on the actual support costs at most B.

The actual whole lower density stages N2, N3, N4, N5 require output eta orders 7, 5, 3, 1. The N2 eta-seven *difference* uses the fixed leading v0 through eta eight; the previous `Z²v0` cancels since N0 is identical in both histories. The two leading endpoint pairs at every stage use the changed field at its higher eta order directly against the fixed leading. For products where both positive orders vary, the true and finite magnitude estimates use the decreasing sequence F/U orders 7, 5, 3, 1 and v orders 6, 4, 2, 0 at N1 to N4. In particular, the `(1,4),(4,1)` pressure products require and receive the N4 F/U first-eta magnitude. The N5 previous-viscosity input `v3` through eta three is supplied by the stronger N3 v bank through eta four. The N5 stress viscosities require F4/U4 through eta three.

## Original compensation and depth transfer

Let `Qb` be the sum of the two original normalized bump derivative gains using the actual inverse row entries and the fixed source `ef=Ef/(1+eta²)`. This relation gives `||1/ef||_m≤5/Ef`, and the inverse matrices and radial profiles are eta independent. The exact C110 normalized bump derivative identities are reused. Let `A` majorize one, H and the applicable earlier true and finite whole magnitudes. The gain for the original Omega difference is `2^40 B² A sum D_j`, and the gain for all three lower whole density differences is `Dlow=2^42 B³ A sum D_j`. In the fifth debt the whole pressure carries its original X. Ordered mixed products use `ab-a_hat b_hat=(a-a_hat)b+a_hat(b-b_hat)`, with each earlier error charged twice over all `i+j=n` rows. This includes N5's `F2 F3` and `U2 U3` terms.

For each stage N2 through N4, set `base=(1+2/s_j)^m Cut_j` using the C105/C110/C112 paired local comparison. The local forcing cap is homogeneous linear in lower errors since their field norms are bounded by the original true bounds plus one. The raw pressure remains at compatible `P_(K_j+1)` and is bounded by the uncut value error before the (larger) cutoff charge. Using the original five incoming rows, their inverses, and the compatible pressure derivative and axis datum gives

```
M_j = 4 B² H base + B Dlow
S_j = base + Qb M_j
D_j = 2^17 S_j
P_j = base + B (2 H S_j + Dlow)
```

These are respectively the five moment error bound, whole F/U mixed radial error, whole v mixed radial error (one eta order lower), and whole pressure error with first X derivative. The same supports and correction inverse give the magnitude caps. They use an ordinary bound on Omega without cancellation at the lower magnitude orders 7, 5, 3, and 1. The true N2 magnitude is justified at order five, where the prior `Z²v0` is available from leading eta nine.

The budget is linear in the C105 N1 error and the three exact native tail parameters `4^-Kj/3`, with positive coefficients constructed from the original parameters. The four closed depths make each contribution less than `2^-259` while enforcing `K_j>=Kcondition_j+2`. The conversion `7!=5040` covers every individual ordinary derivative in the bank. The whole N2 error family F/U/Pi eta seven and v eta six, N3 F/U/Pi eta five and v eta four, N4 F/U/Pi eta three and v eta two, and the specified first-eta N5 lower input and stress-viscosity errors are each strictly below `2^-256`. These numerical tolerances are symbolic error guarantees. No finite numerical depth or coefficient center is evaluated.

**OPEN.** N5's own paired native Picard solve, five compensations, pressure and guarded stress errors remain to be attached. General Y and final jets stay open. Release remains HOLD.

## Replay

Run `node replay_n5_eta_bank.mjs ORIGINAL_RUNTIME C114_FIXED_N5_OPERANDS C113_ETA_BANK_OPERANDS C112_LOCAL_N4_OPERANDS C113_PAIRED_N4_OPERANDS C110_WHOLE_N2_MIXED_OPERANDS NEW_OPERANDS`, then `python -B check_n5_eta_bank.py --operands NEW_OPERANDS --out NEW_RESULT`. All referenced receipts and source modules are hash pinned.
