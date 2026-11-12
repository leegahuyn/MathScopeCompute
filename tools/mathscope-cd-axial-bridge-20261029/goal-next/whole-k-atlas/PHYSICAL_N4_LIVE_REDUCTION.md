# Original fourth background row on the physical slab

**VERIFIED source structure and cutoff lemma.** The original N3 and N4 source
exports contain 3,914,395 and 7,358,162 records. Both complete streams and both
raw native registries are authenticated before comparison. The first 123,870
node records agree. The first three background coefficient roots and the
leading normalized F and G roots are in this shared prefix. The original
selector arithmetic gives `b_j*qBig = 1, 16, 32, 64` for `j=1,2,3,4`.

The actual normalized fourth row carries `q^(8h) χ(b4 q)` for F, G, M,
pressure and both stresses. The radial velocity row also has the commutator
factor `(b4 q) χ'(b4 q)`. The native formal definitions use the actual
normalized arguments `q = Q_ell s`, `X = R²/(2s)`, `η = Z/s^D`. The
original inverse has bracket `[1/2,2]` and solves
`s - T - Z² s^(2h) = 0`. The replay checks actual argument slots, derivative
orders, powers, cutoff branch and commutator factors from the literal registries.

On the physical slab, `q >= qBig/64` and `b4 q >= 1`. The original
`CommonOriginalTimeCutoff` is smooth and identically zero for arguments
greater than 1. Lean proves every finite iterated derivative is zero on the
closed upper half-line, including the face `q=qBig/64`. Product and chain
rules give zero jets for both fourth cutoff factors and their source-supported
products at admitted smooth points. At a source seam this inference uses the
original smooth extension. The proof is for the fourth **background** row.

**VERIFIED native argument comparison.** The eight matrix roots of the two
registered signed N4 pulses and their common length agree structurally with the
corresponding N3 roots after binding the common F and G values and derivatives
on this live slab. The formal substitutions for both matrices use the same
local band label, pulse variable, and representative. The frozen carrier calls
read just the original leading F, radial derivative of F, and radial derivative
of G. The actual fixed arguments are
`(sqrt(2 srep Xrep), ηrep srep^D, srep (1-ηrep²))`.
The checker rejects changing a frozen call to the live arguments. The matrix
comparison preserves typed function calls, derivative orders and positional
children. It normalizes associativity and commutativity of the supported
commutative scalar operators.

**CONDITIONAL physical consequence.** With the original smooth common chart,
fixed representative and valid pulse interval, uniqueness for the two linear
initial-value problems gives the same pulse trajectory and finite local
derivatives for the two background truncations on the shared physical
domain. The N3 certificate retains its admitted reference-label window. Bounds
that read the completed field at a representative still require their own
frozen estimates. This removes the fourth common background row from the live
carrier calculation, while the actual fourth Forced correction and all final
67 enclosures remain open.

```sh
python "$p/whole-k-atlas/check_n3_n4_live_band.py" \
  --n3 inputs/original-whole-k-n3-diagonal \
  --n4 inputs/original-whole-k-n4-diagonal \
  --fourth "$p/whole-k-selector-scales/fourth/fourth-selector-maxima.json" \
  --out /tmp/n3-n4-live-band.json
```

[Source comparison](n3-n4-live-band.json) · [GitHub Lean](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43229357946)
