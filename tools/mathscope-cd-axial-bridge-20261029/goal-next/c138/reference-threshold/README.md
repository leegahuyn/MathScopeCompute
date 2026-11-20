# C138 reference threshold: exact endpoint and nearest-label proposal

The original common band chart uses the unique root of
`s - Z² s^(2h) - T = 0` on the **closed** interval `[1/2,2]`. The original
indexed cover chooses its own candidate labels from `t=-log₂(q)` by nearest
integer, but the source reference label is a separate frozen integer input;
the source does not automatically choose that reference label from `q`.

Assume an original nonempty coefficient window containing an integer
`k >= ell0+4`, positive `Xa<Xb`, and choose

```text
ell_ref=k, ell_own=k+1, q=2^(-k-1), z=0, tau=q,
X=(Xa+Xb)/2, r=sqrt(2^(-k-1))*sqrt(Xa+Xb).
```

At the reference label `Z_ref=0,T_ref=1/2`, so the actual original implicit
equation has `s_ref=1/2`; at the own label `Z_own=0,T_own=1` and
`s_own=1`. Both charts are on their declared closed brackets. The source
window inequality `k <= floor(log₂(b_(N+1)))-1` gives
`b_(N+1)*q >= 1`, and `k>=ell0+4` gives the strict `q<q*`. Nevertheless
`abs(-log₂(q)-ell_ref)=1`, so strict reference admission fails at the
endpoint even though the closed native reference root exists.

The exact live native registry is read for the eight original Forced/Signed
fields. All contain the same two signed `0:0:0:0` rows, own label in slot 3,
reference label in slot 7, and five identical outer guard triples. At the
point above the shell guard is strict because `Xa<X<Xb`; the band offset is
zero; the Z and T mesh offsets are zero; and the R mesh nearest-integer
offset lies in `[-1/2,1/2)`. Consequently all four offset guards lie strictly
inside the source `(-3/4,3/4)` interval. The rational toy endpoint values in
the replayer check algebra only: the mathematical construction uses the
actual source endpoints symbolically and assumes their native ordering.

This is a control for the active **outer band and mesh row**, not a claim
that the physical torus reaches either auxiliary rectangle or that a complete
wave is nonzero. It does not evaluate the graph outside its native domain.
The generic window hypothesis is explicit; this packet does not select a
specific actual source prefix or prove that such a `k` occurs in every one.

A sufficient reference selection proposal is
`ell_ref=floor(-log₂(q)+1/2)`. For any real `t=-log₂(q)`, its offset belongs
to `[-1/2,1/2)`. In particular each exact half tie maps to offset `-1/2`,
and `|t-ell_ref|<=1/2<1`; consequently `1/2<q/Q_ref<2`. This proposal is
not an implemented source policy: a full proof must select a valid original
coefficient window, establish the remaining domain and guards, and justify
the original fixed-label and transition-seam behavior when labels change.
No ordinary extension is inferred from the closed root or from scaling.
Final jets and release remain open; RELEASE HOLD.

```text
python -B verify_reference_threshold.py --work WORK_GOAL_NEXT --runtime ORIGINAL_RESEARCH_IDE --out replay1.json
python -B verify_reference_threshold.py --work WORK_GOAL_NEXT --runtime ORIGINAL_RESEARCH_IDE --out replay2.json
```

The replayer hash-checks the exact original source modules, selected-node
receipt and full native function registry, and the two output files match.
