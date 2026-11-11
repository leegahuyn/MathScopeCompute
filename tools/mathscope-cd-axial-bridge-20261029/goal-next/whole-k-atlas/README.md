# Whole-K slab: a source-window atlas using at most four coefficients

This is a conditional exact geometric/selector result. It assumes the original selector's real source semantics and an actually constructed **same common family through b5**, including all original diagonal norm clauses, cutoff scales and the frozen representative construction. The already hosted C5 family through b2 does not supply b3–b5. The result does not execute the N=0–4 source graphs, prove every natural-series Y<=5, settle all native operations, or certify the full whole-K energy balance or final jets.

Let `C=ellMinimum>=8`, `ell0=C+6`, and `qBig=2^(-(C+10))`. Here the localization calls the same positive scalar `qStar`/`qBig`; the original current's `qGlobalStar=2^(-(ell0+4))` equals it. The localization node #622791 is in its own scalar namespace, not the unrelated #622791 in the post-Five graph. The exact source blobs checked by the replay define the common first-scale lower bound `b1>=2^(C+10)`, `b2>=16*b1`, and for n>=3 `b_n>=2*b_(n-1)`. Hence

    b1 >= 2^(C+10), b2 >= 2^(C+14), b3 >= 2^(C+15),
    b4 >= 2^(C+16), b5 >= 2^(C+17).

The genuine source functions use actual logarithms and their original maximum-of-norm clauses; these lower inequalities do not evaluate the scale values or replace those clauses.

## Complete slab and initial selector

The whole-K slab has

    qBig/64 <= q < qBig/16,
    t = -log2(q) in (C+14,C+16].

Consequently `b5*q>=2`. Set `ell=floor(t)`. Then `ell` is one of `C+14,C+15,C+16` and `s=2^(ell-t)` is in `(1/2,1]`, including t exactly an integer. Define `a_n=log2(b_n)` and

    N = max({0} union {n in {1,2,3,4}: floor(a_n)<=ell}).

Because `floor(a5)>=C+17>ell`, the actual selector gives a unique original N window. If N=0, it is `[ell0, floor(a1)-1]`: this is the leading-source-only branch, not a fabricated first positive coefficient. If N>=1, it is `[floor(a_N), floor(a_(N+1))-1]`; the source's extra max with ell0 is redundant because `floor(a1)>=ell0+4`. The adjacent integer windows do not overlap and leave no integer label gap. The definition of N guarantees that `ell` lies in this **actual original** window and `b_(N+1)*q>1`. It does not assert any bound on the actual b1–b5 beyond source growth.

## One source-preserving step gives the required representative margin

If `b_(N+1)*q>=2`, keep N and ell. Otherwise `1<b_(N+1)*q<2`; N cannot be 4, because `b5*q>=2`. Increase N by exactly one and set `ell_new=floor(a_(N+1))`. Since `a_(N+1)-1<t<a_(N+1)`, its reference `s_new=2^(ell_new-t)` lies in `(1/2,2)`. The increased selector's genuine next window contains ell_new, and its omitted scale satisfies

    b_(N+2)*q >= 2*b_(N+1)*q > 2.

For initial N=0 the same step selects N=1 and uses the stronger original growth `b2>=16*b1`. This is why the leading-only branch must be handled explicitly. In every case the final original coefficient order is at most 4, its reference lies in the actual corresponding window, its reference inverse exists on its physical image and its next-source tail has margin at least 2. At the time of the switch the old first-omitted cutoff and all its fixed jets are flat zero at the physical q. This does not equate an invalid old frozen representative to the new representative; the two-field compatibility statement is used only under the original source's simultaneous-validity hypotheses.

## Every active frozen representative is inside the original source domain

The original outer relative-band guard is strict: `|t-ell_prime|<3/4`. On this slab every active integer label is one of `C+14,C+15,C+16`; the equality case of the band guard is the lazy zero branch. Thus, with `s_prime=2^ell_prime q`,

    1/2 < s_prime < 2,
    ell_prime >= C+14 >= 22.

In each row whose original shell and mesh guards are active, the original frozen representative construction supplies `1/2<srep<2` and `|srep-s_prime|<=27/ell_prime^6`. Therefore

    srep/s_prime > 1-54/ell_prime^6 > 1/2,
    b_(N+1)*qrep = b_(N+1)*q*(srep/s_prime) > 1,
    qrep = 2^(-ell_prime)*srep < 2^(-C-13) = qGlobalStar/8 < qGlobalStar.

These inequalities hold uniformly over the entire slab for the selected source prefix, including the t=C+16 endpoint. In the actual physical chart `Z=s^D eta`, `T=s(1-eta²)` with |eta|<=1, every active root uses the same original positive bracket and every radial profile `R²/(2s)` or integration-binder square is nonnegative. The qstar/tail result is not a proof that all nested Y upper bounds or all derivative/endpoint limits follow: those require exact source-call reachability and branch-sensitive upper-range analysis at each selected N.

## Evidence and minimality scope

`check_whole_k_atlas.py` checks the exact f8 original family, source window, band, localization and representative producer fragments and their hashes; it then checks 26,112 exact rational log-scale/control cases, including floor ties, N=0 selection, the one-step switch and N=4. These tests support but do not replace the general proof above. A permitted abstract minimal-growth selector with `a1=C+10`, `a2=C+14`, `a3=C+15`, `a4=C+16`, `a5=C+17`, at t=C+16, yields selected N=4 and first-omitted margin exactly 2. This shows the bound is sharp for the stated source inequalities and this selection algorithm; it does not claim the pinned actual norm-based selector attains those values or that no other atlas might use fewer coefficients.

Actual b1–b5 on one live common family and all needed native class/ODE and cutoff semantics remain separate source obligations. The earlier raw N=1 Y verification remains 519/523 without explicit physical binding; the source-bound N=1 523/523 result does not automatically become a whole-slab all-N Y result. No M3/M4 acceptance or 67-jet progress is promoted. RELEASE HOLD.

Replay:

    python check_whole_k_atlas.py --repo <repository> --out result.json
