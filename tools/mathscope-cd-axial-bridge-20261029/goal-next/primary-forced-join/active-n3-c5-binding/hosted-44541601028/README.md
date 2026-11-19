# Original same-family N3 direct and split residual comparison

**VERIFIED exact source arithmetic.** GitHub run 44541601028 succeeded on
`f6e726d08d2bf532c58f5dce7103a57ca45182a8`. The same original first-cycle
source construction reached a 22,153,782-node graph. While the original
post-Five owner was still live, it exported the arithmetic closure of
the three conservative difference roots, the divergence difference,
and three direct-residual controls. The 1,663 records include 316
opaque source operands.

The unchanged original exact polynomial reducer gives zero for the
three difference roots #22153774, #22153776, #22153778 and divergence
difference #22153781. The three original direct residual controls each
have nonzero coefficient counts, respectively 953, 1,053, and 3,134
monomials. The local independent replay reproduced the hosted output
byte-for-byte.

**CONDITIONAL physical evaluation.** This proves equality of the two
expressions whenever their shared native source operands are defined
and the ten recorded denominator values are nonzero on the original
admitted chart. This identity leaves actual residual size, supported
source regularity, quantitative closure, and final jets OPEN.
The [denominator audit](domains/README.md) proves positivity of all ten
under that original chart and ordinary source denotation. It also
encloses the original mean normalization integral by exact directed
rational sums.

Run the verifier one directory up, with the original pinned runtime
files and a fresh output. `SOURCE_FILE` parameters are the full PDE
module, direct split module and harmonic assembly module respectively.
Their SHA-256 values are in the manifest and are enforced by the script.

~~~text
python -B verify_direct_split_closure.py --closure hosted-44541601028/direct-split-arithmetic-closure.json --manifest hosted-44541601028/direct-split-arithmetic-manifest.json --receipt hosted-44528954587/first-cycle.json --exact-module EXACT_MODULE --source-file source-postfive-full-3d-residual.mjs=FULL_PDE_PATH --source-file source-postfive-direct-split.mjs=SPLIT_PATH --source-file source-harmonic-assembly.mjs=HARMONIC_PATH --out NEW_RECEIPT
~~~

The full source execution is preserved in `native-run.log` and the
first-cycle receipt. The compact closure suffices for this exact
arithmetic check. RELEASE HOLD.
