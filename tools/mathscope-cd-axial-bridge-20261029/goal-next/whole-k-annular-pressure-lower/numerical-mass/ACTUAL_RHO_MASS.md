# Exact enclosure of original normalized radial mass

The full original corrected initialized graph from run 43010593847 has 4,456,994 nodes and SHA-256 `ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf`. The executable verifies the full stream and original nodes #633682–#633725. The actual pressure bump mass is #633724; its actual positive reciprocal is #633725. The node numbers are specific to this graph namespace.

Put

    a = sqrt(2 X0Imean) exp(1/2) sqrt(s),
    u = 10 (R/a - 1).

The original #633723 integrand is `a^-1 exp(-1/(u(1-u)))` on `0<u<1`, and exactly zero outside. Its radial integration endpoints are `sqrt(Xa)` and `2 sqrt(Xb)`. For u in [0,1], `X=R²/(2s)=X0Imean*exp(1)*(1+u/10)²`. The original fixed Imean patch is `0<log(X/X0Imean)<5`; indeed `1<=log(X/X0Imean)<=1+2log(11/10)<=6/5<5`. Assuming the source's original Imean subset of `[Xa,Xb]`, `X0Imean>0` and `1/2<=s<=2`, `sqrt(Xa)<=R<=2sqrt(Xb)` over the entire bump. Thus the complete actual integral becomes

    #633724 = (1/10) integral_0^1 exp(-1/(u(1-u))) du.

This does not apply if the original patch inclusion or positivity assumptions fail. The exact analytic change of variables is not a finite sampled integral and no source radius or `s` is assigned a numerical value.

The original patch bounds and \(0<\lambda<1\) have a separate
[directed arithmetic replay](../../whole-k-annular-initial/numerical/README.md).
Its source records identify both actual radial endpoints, and the admitted
band supplies \(1/2\le s\le2\).

The integrand is symmetric about 1/2 and increasing on [0,1/2]. Rational left and right endpoint Darboux sums over 131,072 equal cells on that half interval enclose the integral. Each exponential is enclosed by exact BigInt arithmetic: for `x<32`, alternating Taylor sums of `exp(-x/128)` with odd/even truncations and directed 160-bit fixed-point rounding, followed by seven directed squarings; for `x>=32`, use `0<=exp(-x)<2^-32`. A coarser 16,384-cell enclosure is recomputed and must contain the refined result. The exact integer numerators and denominator are in `actual-rho-mass.json`.

Outward decimal display:

    0.000702978853 <= #633724 <= 0.000702992830
    1422.489616 <= #633725 <= 1422.517896
    1422 < #633725 < 1423.

The denominator is therefore strictly positive under the stated original source hypotheses. The same authenticated original graph has the five actual FiveMap moments #634285, #634289, #634293, #634296, #634300 with respective powers p = 2, -2-2lambda, -2lambda, 1, 1-2lambda, and source x0=#633686. The exact substitution x=x0(1+u/10) gives mu_p/x0^p = (1/10) integral (1+u/10)^p exp(-1/(u(1-u))) du. When 0<lambda<=1, each p is in [-4,2]. Hence all five normalized moments are positive and satisfy mu_p/x0^p > 10000/20834143; the JSON also provides five individual rigorous decimal ranges. This does not evaluate x0 or lambda numerically.

A separate independent checker uses positive Taylor bounds on exp(x/64), six squarings, reciprocal bounds, 32,768 midpoint cells and the global bound |f prime|<1. Its rigorous wider interval contains the entire Darboux interval, and its independent midpoint range lies inside that interval. This checks the mathematical integral and arithmetic independently, while the original graph authentication and support premise remain separate.

These numerical intervals apply only to this exact actual #633724 mass and reciprocal and the stated normalized mu bounds. They do not evaluate covariance H determinants, selected source scales, target/background FTC norm integrals, the live private-family equivalent, final fields, N7/N8, or any final jet. RELEASE HOLD remains unchanged.

Reproduce from this directory.

    node actual-rho-mass.mjs ORIGINAL_SOURCE_NODES_JSONL_GZ ORIGINAL_SOURCE_GLOBAL_CURRENT_MJS ORIGINAL_ACTUAL_PULSE_MEANPATCH_MJS
    node rho-mass-independent.mjs OUTPUT_MASS_JSON
