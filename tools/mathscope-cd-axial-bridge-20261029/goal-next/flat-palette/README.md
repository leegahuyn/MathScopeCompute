# Exact support separation for the original fixed pulse rows

## VERIFIED

The finite replay proves the geometric separation of the original palette and binds it to the actual first post-FiveMap source. It rehashes all 4,420,257 original AST nodes and compares the complete 159,655-node projected graph. The checked rows are the 81 exact source boxes with both signs, for a total of 162 rows. The two coordinatewise nearest copies, actual palettes and all five outer guards are checked on every row. No enormous physical coordinate or profile value is rounded or substituted.

Write M=1048576, r0=1/(16384·M), and J=[[3,1],[1,5]]. For label (ell,g0,g1,g2,sign), use the palette digits ell mod 9, g0 mod 5, g1 mod 5, g2 mod 5 and the sign bit. The exact center is (ν/M,0), with 1≤ν≤2250. The AST replay checks each center as this exact mixed-radix expression.

At one fixed reference point, every candidate band is the same nearest band plus one of -1,0,1. In one candidate band the mesh coordinates and three nearest integers are common, and each candidate mesh label differs only by offsets in {-1,0,1}. Therefore distinct relative bands give different residues modulo 9, distinct mesh offsets in one band give different residues modulo 5, and opposite signs in the same box give different final bits. The replay accounts for all 13,041 unordered pairs. The broader original palette also distinguishes any intersecting enlarged same-band boxes because their integer differences are at most 4 in each axis. Bands far enough apart are already separated by their slow supports.

For the original eigenvectors vr=(1,1−√2) and vt=(√2−1,1), the row sums of absolute values in the rectangle basis are √2<3/2. The dual basis is obtained from the dot products with vr and vt divided by Dgeom=4−2√2. Thus even the doubled rectangle |xi|,|eta|≤2r0 has Cartesian coordinate radius <3r0. The retained five powers J⁰,…,J⁴ have maximum absolute row norm 1028.

Let two centers have exact common-torus covering indices d_a≤d_b and put d=d_b−d_a. Simultaneous membership in their enlarged rectangles would put J^d c_a−c_b within a coordinate error <3r0·(1028+1) of an integer vector, since J^d preserves the integer lattice. For d=0 the first coordinate has distance at least 1/M by distinct colors. For d≥1 the second coordinate has distance at least 1/M, independent of the target center, by checking all 2,250 source residues in each of the four matrix powers. The worst-case strict clearance is greater than 13297/17179869184. There is no inverse torus covering in this argument.

The common source base label is ell_ref−2. With q<2^(−ell0−4), ell0≥8 and q/Q_ref∈[1/2,2], all candidate bands lie in [ell_ref−2,ell_ref+2], and the base label is at least 8. The actual index function is the floor of f(ell)=((1+h)ell log 2−2 log ell)/log(4+√2). It is increasing for ell≥8 since log 2>1/2. On a four-band step the logarithmic subtraction only decreases the increment, and 4+√2>4 gives f(ell+4)−f(ell)<2(1+h)<3 for the original h<1/64. The integer index differences lie in the exact selector range [0,4]. The checker validates the actual index and copy formulas, including the identity of the band-dependent selector and the selected matrix entries at all five integer inputs.

All eight archived Forced and Signed velocity and angular-pressure fields retain the same 162 actual label/guard/copy maps. Their sixteen own-chart defining bodies are checked at each of the five matrix cases, with the exact slow reference-to-own substitution and unchanged fixed-label slots. Each uses the five original zero-exterior slow guards, then the actual |xi|<r0 and 0<v<Ls guards. The exact lift relation v=(eta+r0)/ci and length Ls=2r0/ci with ci>0 give |eta|<r0. The original guards evaluate the retained source body only inside those ranges. The 100 reached indexed partials preserve the declared fixed-coordinate argument order. No derivative of the palette index or nearest copy is substituted.

## CONDITIONAL

At a nearest-copy seam the competing fixed copies have the seam coordinate ±1/2, beyond the enlarged rectangle by a positive margin. Both zero-exterior guards therefore stay zero in a neighborhood of that seam on a fixed band and label, without evaluating the inner pulse body. The original transverse and longitudinal cutoffs have additional zero collars in the first Forced and Signed constructions. Full analytic regularity of the native operands and flatness where the other slow guards change still require separate proof.

If the original ordinary derivatives exist with their required flat joins, their supports lie in the same closed labelled rectangles. Every cross-row product then vanishes at any fixed source point. The geometric clearance does not establish ordinary differentiability or make a product of undefined operands meaningful. The archived private source authentication flags are preserved.

## OPEN

The certificate covers the first post-FiveMap source and its actual fixed-label maps. It does not complete the analytic source joins, the remainder of the additive first-cycle flat residual, the second supported forcing input, N7-06, N8-05, or the final field jets.

## Reproduction

Run Python 3 with assertions enabled.

```text
python check_palette.py --repo REPO --graph original-source-nodes.jsonl.gz --registry original-source-functions.json --reached reached.json --projection group-postfive-residual.json --output palette-receipt.json
```

The JSON receipt records the fixed source/registry/projection hashes, the matrix residue checks, all actual row maps, local guard case roots, and controls for wrong sign center, wrong nearest copy, missing band guard, changed covering difference, and widened transverse guard.
