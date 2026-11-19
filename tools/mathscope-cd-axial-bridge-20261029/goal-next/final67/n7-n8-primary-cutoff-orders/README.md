# Original Primary cutoff/map orders8 and9

This packet extends the original source-positive cutoff/map recipe to coefficient orders8 and9. It supplies a common finite upper bound

    Ccoeff8, Ccoeff9 <= 2^4096 * Rstar^26,  Rstar=C12EnvelopeR.

The directed common upper has four nested exponentials and is strictly below the already directed original target N6 upper. Consequently these higher cutoff/map constants introduce no extra scalar-base loss when combined with the sharper external target-to-Primary transfer, conditional on the same source domain and remaining background/primitive hypotheses. No native order8/9 graph or private Primary class object was constructed.

The individually retained finite coefficients have3403 and4094 bits, with Rstar powers24 and26. The arithmetic uses exact integers and directed nested-exponential endpoints, with no binary64 numerical decisions.

## Exact consumers

The original globalClassSourceCutoffAndMapConstants sets n=PrimaryOutputOrder+2. Its maximum includes the fixed-label partition FTC, original pulse-step/time coefficients, transverse cutoff, slow-mesh cutoff and original radial/inverse-radius factors.

| Primary output order | Coefficient order n | Partition FTC rows | Highest partition derivative | Highest sigma derivative | Nonzero log-chart FTC rows |
|---|---|---|---|---|---|
|6|8|9|9|10|44|
|7|9|10|10|11|54|

For time the generated coefficient rows run through n+1. The square integral for step derivative j uses sigma derivative j+1, so the last input is sigma_(n+2). For partition derivative j, the extra one-dimensional FTC face uses j+1. The source derivative generator was executed through the needed original sigma11; Python independently reconstructed those integers.

## Source-positive bound

The original partition bump is sigma(3/2-2|x|). Its central plateau removes the absolute-value corner. On the numerator support some integer translate has distance<=1/2, hence bump>=sigma(1/2)=1/2 and the sum-of-squares denominator>=1/4. Only the three retained translates can contribute. The source quotient and all jets vanish at the outer guarded endpoints. Ordinary Bell polynomials and the bound |d^k z^(-1/2)|<=2*4^k*k! for z>=1/4 bound the exact quotient derivatives. The anchored FTC interval has length2, giving3*(1+max(two consecutive derivative bounds)).

The original step is constant outside [0,1] with matching flat jets. Thus its square-integral bounds are sigma_j_upper^2 over the unit interval. The time coefficient is exactly20^m times the binomial product of step bounds. The transverse slope is2/r0=2^35. The source dependence on pulse length Ls^-m and mesh S^(3j) remains explicit in the original theorem; using these as source-only derivative constants requires the original Ls>=1 premise. No length or mesh factor is discarded.

## Independent log-chart admission

Only the chart is analytically continued. No heat, pulse cutoff or fluid profile is assumed holomorphic across its real boundary.

For every real source base point s0 in[1/2,2], eta0 in[-1,1], set Z0=s0^D eta0 and T0=s0(1-eta0^2), D=1/2-h. The original chart satisfies s=T+Z^2 s^(2h). With x=s/s0 and normalized physical variables theta=T/s0, zeta=Z/s0^D, it becomes

    x=theta+zeta^2 x^(2h).

Physical perturbations of radius1/64 yield normalized perturbations at most1/32. On |x-1|<=1/4, with0<h<1/64, the principal branch obeys

    |d_x x^(2h)| <= (1/32)*(4/3)=1/24.
    Lipschitz <= (33/32)^2/24 <1/16.
    |F(x)-1| <= 1/32+(1/32)*(2+1/32)+(33/32)^2/(24*4) <1/4.

This proves a uniform holomorphic fixed point by contraction, agreeing with the original real chart branch at the base point. Its log has magnitude<4. These inequalities are independently checked with exact rational arithmetic.

For profile disks of radius1/4096, elementary bounds |s|>=1/3, |s|<=9/4 and |eta|<=4/3 give |s^D|<=3/2. The physical moves are at most5/4096 in Z and9/4096 in T. Each still permits an additional physical Cauchy radius1/256 inside the1/64 contraction domain. Repeated physical and profile Cauchy estimates therefore give

    Q_n=4*n!*256^n*4096^2

for every required physical log-chart derivative of total order<=n and either s/eta FTC face derivative. The chart log(s) is independent of physical R and profile X, so their derivatives vanish exactly. The source identifies each D^alpha log(s) with the retained coefficient of E_s P in the exact slow expansion; no background derivatives are used.

All eight original FTC unit contributions are retained. The box face-volume product is(5/2)*(1+DeltaX)*3 <12 Rstar^2, using DeltaX<=2Xb<=Rstar^2/2 and Rstar>=1. Since log2>1/2,

    logChartMax <= 24*(1+Q_n)*Rstar^2.

This is a new bounded proof for the44/54 nonzero log-chart rows, rather than an unsupported reuse of the earlier order8 coefficient/eleven-derivative background estimate.

## Radius/carrier factors and common integer

The original radial exponent is exactly2*((1+h)*rho-h/100000), with0<rho<1. Hence |dr|<3 and drAbs=sqrt(1+dr^2)<4. The source factor2 is retained. The original radial envelope gives

    Rlower<=1, Rlower^-1<=2 Rstar, Rupper<=2 Rstar,
    Rbase=2+Rlower+Rlower^-1+Rupper<=7 Rstar.

Thus the original inverse-radius row is <=j!*7^(j+1)*Rstar^(j+1), and the fast radial row is <=(j+5)^(j+1)*7^(j+5)*Rstar^(j+5). The exact source slow-cutoff product is

    4^n*n!*partitionMax^(n+4)*logChartMax^(n+4).

Its Rstar exponent is2n+8, dominating every radius exponent for j<=n. Taking the exact maximum of all finite integer coefficients gives the3403/4094-bit values in the receipt, both<2^4096. As Rstar>=1, the common cap2^4096*Rstar^26 follows.

## Tail/collar and remaining seam

The partition guard, constant step extensions and time cutoff have matching flat endpoint jets. The original annulus has positive Xa, so the radius/carrier powers are smooth on the entire enclosing radial interval, including both collars. Products with the original target radial Gaussian factors retain their known flat extensions; this packet does not divide by a vanishing weight.

The log-chart contraction includes eta=+-1. Complex or negative-T points there are used solely for the geometric log-chart Cauchy proof, with no assertion about extending the heat or fluid field to negative real time.

The precise remaining admission is that every actual point to which the Primary proof applies belongs to its original norm box s in[1/2,2], X in[Xa/2,2Xb], eta in[-1,1], with the same positive radial envelope, fixed labels and pulse-length premise. This is the literal source norm domain. A frozen representative or path outside that box requires its own source admission/transport argument; this packet does not move it into the box. Same-family background C9/C10 and the remaining stability/positive-weight primitive association remain separate. No complete Forced/Signed class or final jet is promoted.

## Replay

    node evaluate_primary_cutoff_orders.mjs <goal-next> <source-runtime> <numeric-runtime> <output-dir>
    python check_primary_cutoff_orders.py <goal-next> <output-dir>

The exact source modules and historical numerical dependencies are authenticated before use. Python checks seven immutable original Git blobs, independently reconstructs the sigma/Bell/partition/time/radius integers and verifies all chart-admission inequalities as rational numbers.

Two complete replays produce byte-identical receipts. Python -O aborts. Final files are UTF-8/LF. This packet is separate from the earlier frozen continuation71 target and transfer packets; it performs no repository writes, Git mutations, GitHub runs or local Lean compilation.
