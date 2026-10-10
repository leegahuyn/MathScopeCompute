# Independent review of the actual preloop lower gaps

`verify_preloop_gaps.py` completed with actual exit code zero and
**75/75 independent checks passed**, recorded in
`preloop-gap-review-001.json`. Its input snapshots authenticate the
new gap proof and producer, actual B.8 certificate, continuation,
activation proof, original outer derivation, and the separately
audited source derivative bound `S=C^100000`.

The continuous proof `B8_AND_PRELOOP_GAPS_EN.md` was read in full.
The independent arithmetic checks support that proof; they do not
replace it with a radial or eta grid. The same final parameter tree
and positive widths occur in both the lower-gap and upper-derivative
inputs.

The B.8 convention is significant: the five bumps are sigma prime
on intervals of width `1/4096`, with no unit-mass multiplier. Their
value, radial derivative, and first eta derivative therefore have the
factors displayed in G3 and G6. The exact partial density differences
give the J, energy, and pressure bounds with coefficients below
`1`, `1`, and `17` after division by mu. The energy calculation
retains the linear `2c deltaU` term when moving to the *raw* moments;
the transformed-row cancellation is not incorrectly carried across
that change of normalization. Converting the earlier transformed
rows to the raw rows costs at most 27, and restoration costs at most
28j. Thus the `100mu` continuous partial-moment bound is justified.

The stock recovery was checked directly in the original 4.16 formulas.
The powers of XR cancel from Qs and Ns before any stock ratio is
estimated. The independent verifier proves, by polynomial algebra
over `QQ[h,eta]` after clearing `1+eta^2`, the exact ideal identity

`Qid=9/8-5h/8+2h eta^2+(5/8)*(2eta^2/(1+eta^2))*(D+4d)`.

Together with `E>P/6`, the complete partial-debt bounds imply
`|Qs-Qid|<2^40 mu P<1/16`. The full Ns terms, including actual pressure
and its derivative, are bounded by `2^20 P^2`; hence
`|w|<2^24 P`. The product `mu P=exp(-16002T)` is what makes the
projected stock positive. No erroneous multiplication by the much
larger absolute source bound C is used in this local argument.

The remaining lower-bound ledger is consistent across its regions.
On activation the same flat factor occurs in the field comparisons,
so its dyadic lower bound at `y/t1=1/16` controls both the projected
and quadratic gaps. Later continuation and transitions retain their
explicit comparison margins. The B.34/fixed-slope source estimate
prevents a downward crossing of `p1=5/2`. The original outer ratio
bounds are combined with its actual finite stock
`p>=3^-8 XR>C^9>2^33`, retaining the `4 c v/p` correction in the
quadratic test. This yields the common actual relaxed-gap bound
`C^-1000` on J.

The left loop collar has `vs-2>1/10`; the right collar has the exact
value `2lambda`, with `lambda^-1<C`. Both exceed `S^-1`. The left
part of `J\I` lies in the proved inner collar, and its right part lies
within the untouched constant-slope interval. I2 and the later heat
edit begin strictly beyond J and preserve the same datum, so they do
not change these forward quantities.

The independently audited upper jet envelope at the same S and these
lower gaps now provide the two actual inputs of the previously
reviewed loop contract. This conclusion does not itself instantiate
the original Lean analytic premises or promote the complete original
profile acceptance gate.
