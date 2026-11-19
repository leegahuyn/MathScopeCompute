# Full-inner original coefficient refinement: degree4 to degree8

This is a new coefficient-order refinement on the original final inner field,0<=Y=Lambda X<=4, including the axis and the smooth inner-side face. The original leading coefficient n=0 stays exact. Every original positive coefficient n=1,2,3 is approximated by an executed signed finite polynomial, and all original chi(b_n q) q^(2nh) factors remain. The prior actual selector excludes n>=4 throughout this slab; annular wave and mean corrections vanish here by the existing original inner-field identification.

VERIFIED:324 genuine native derivative operands,72 signed F/U/Pi polynomial families,24 exact Stokes-average polynomials, exact full-inner remainder comparisons, and propagation to all22 scalar and67 local linear gauge-jet error intervals. All22 scalar errors and48 nonzero atom errors shrink by a factor at most5/16;19 A_z atom errors stay exactly zero. The original123870-node source prefix is unchanged, and every imported runtime byte matches its previously pinned original Git blob.

These are certified approximation-error enclosures about source-bound polynomial centres. The original positive analytic norm factors remain exact symbolic expressions. This packet does not claim evaluated profile sample values, numerical nonlinear force/energy integrals, annular grid refinement or whole-K N8 completion. N7-06/N8-05 remain OPEN, global jets0/67 and RELEASE HOLD are unchanged.

## Executed signed coefficients and exact tails

The three actual source auxiliary analytic disks have Y radii7,13/2,25/4. Anchor the approximation at Y=2. The entire complex circle of radius4 about2 lies in |Y|<=6<25/4, so the same original source solution norm M_n applies on it. Every real0<=Y<=4 is at distance at most2 from the anchor, giving geometric ratio1/2.

For f_n=F_n,U_n,Pi_n, the actual native coefficient is

    c_(n,k,t)=D_X^k D_eta^t f_n(2/Lambda,eta)/(Lambda^k k!).

The graph constructor emits every k=0..8,t=0..3 at the actual original system and nonzero anchor. Its raw signed polynomial is P_N(Y)=sum c_k(Y-2)^k. For physical reconstruction it also emits P_N(Y)-P_N(0), using the original identity f_n(0,eta)=0. This preserves the actual positive-order axis datum and zero pressure datum. Native coefficients are retained with their signs rather than replaced by analytic norm bounds. No Picard approximation, numerical sample or surrogate source coefficient is supplied.

For d=0..3, let T_(N,d)=4^-d [d^d/dz^d(z^(N+1)/(1-z))] at z=1/2. The error in D_Y^d D_eta^t f_n is bounded by

    M_n t! (2/strip_n)^t T_(N,d).

The exact rational comparison is:

| Radial derivative d | Degree4 cap | Degree8 cap | New/old width |
|---|---:|---:|---:|
|0|1/16|1/256|1/16|
|1|3/16|5/256|5/48|
|2|1/2|23/256|23/128|
|3|39/32|195/512|5/16|

Each cap multiplies the same positive original M_n t!(2/strip_n)^t. The finite degree5..8 coefficient-gap caps are15/256,43/256,105/256,429/512, respectively. Exact tail4=gap+tail8 proves pointwise nesting of the raw signed profile enclosures despite their differing polynomial centres. For the axis-corrected reconstruction, radial-d0 tail and gap caps double; radial-d>=1 caps stay unchanged. The ratios in the table remain identical, and the corrected profile enclosures also nest.

For the actual Stokes average integral_0^1 U_n(vY/Lambda,eta)dv, the polynomial is integrated exactly. Each Y monomial of degree l receives1/(l+1); differentiating d times gives the additional tail factor1/(d+1). The constant axis correction is retained in the average as well. The independent reader verifies all24 raw and24 corrected average polynomials and rejects replacing an average by unaveraged U.

The existing physical operator transfer uses source H_(e,r,t)=W_e r!t!(2/strip_n)^t M_n. A remainder therefore scales the corresponding old positive norm term by the axis-corrected T_(N,r)/r!. When different derivative tuples share the same exact graph norm root, the replay takes the maximum applicable scale rather than guessing one derivative order. Every resulting degree8 scale is at most5/16 of its degree4 scale. The original Lambda powers, physical tau0 powers and cutoff factors remain unchanged in all22/67 transferred rows. The leading part has zero approximation error because it is kept exact.

## Source premises and limits

The proof reuses the existing actual raw/auxiliary core identification, complex source norm proof, smooth zero extensions, physical coordinate transfer, final-field identification on X<=Xa and actual n>=4 selector exclusion. Source pressure normalization is preserved, including the exact leading datum and unshifted positive-order raw pressure. The source coefficients at the anchor are genuine native expressions; their numerical evaluation remains separate.

The two scripts take explicit input paths and can be placed anywhere. GOAL_NEXT is the existing evidence root and ORIGINAL_RUNTIME is the same pinned original core runtime used by whole-k-inner-axis. Python requires SymPy; assertions must remain enabled. Use a fresh output directory:

```text
node build_inner_taylor.mjs GOAL_NEXT ORIGINAL_RUNTIME OUT/inner-taylor-source.json
python check_inner_taylor.py GOAL_NEXT OUT/inner-taylor-source.json OUT/inner-taylor-refinement.json
```

Both outputs reproduce byte-for-byte on complete replay. All files use UTF-8/LF. The six files in this final directory, including MANIFEST.json, form the deliverable. Preliminary work and mutated negative-control files outside this directory are excluded. No existing repository, branch, operating website, original source graph or numerical base67 file was modified. No local Lean compilation was performed.
