# First Forced transverse and pulse faces in the original N3 source

**VERIFIED source binding.** The replay uses the original same-run
spatial stream from GitHub `44582875351` and the independently checked C80
first Forced gauge and curl. It authenticates all ten fixed sign/level
charts and both positive harmonics per chart. The opposite harmonics
follow the exact conjugate relation checked in C80.

## Pulse faces

The original guard retains the closed native pulse interval with
endpoints \(0,L_s\). In every actual mapped gauge the retained multiplier
is
\[
 \psi(v)=\sigma(20v/L_s-4)\,\sigma(16-20v/L_s),
\]
where the original flat step \(\sigma(x)\) is zero for \(x\le0\).
Therefore the actual gauge is zero on the interior collars
\(0<v<L_s/5\) and \(4L_s/5<v<L_s\). All its curl terms are zero on the
same collars, since the body is identically zero there. The outer
guard supplies the zero branch beyond the pulse interval. The proof
uses native evaluations only on \([0,L_s]\) and does not need terminal
vanishing of the uncut native solution.

## Transverse faces

The original transverse guard has faces \(\xi=\pm r_0\). Every
required initialized primary wave, pressure and principal flat-source
body vanishes for \(|\xi|>3r_0/4\) by the original exterior cutoff. The
checker follows each relevant native definition and actual argument
substitution to the original piecewise choice with norm
\(\sqrt{(\xi/r_0)^2}\), upper threshold \(3/4\) and literal zero on
the exterior branch. Ordinary derivatives of the same bodies vanish on
this open collar as well.

Each actual retained source scalar is in the ideal of these exact
native seed applications. The whole mean stays in the source. At each
fixed label and lift the actual native path is
\[
 H_w(Y)=Y+\frac{c_i}{T_g^\delta}(w-v(Y))v_t,
 \qquad \xi(H_w)=\xi,\qquad v(H_w)=w .
\]
The checker expands these exact identities on the actual graph over
\(\mathbb Q(\sqrt2)\), checks each retained `ActualWholeNonzeroSource`
body and confirms that its mapped application changes only the two
original common torus slots. The source pulse-time coordinate remains
the original independent \(w\). The actual `CoupledForced_source`
wrappers and projected force are matched to these same six mapped
components for every native case. Thus the projected forcing is zero
along the complete original pulse interval in the transverse collar.

The same original forced matrix and zero initial data give the
identically zero native solution there by uniqueness. The C80 endpoint
applications evaluate exactly that solution with their actual mapped
\(v\). This establishes zero of the gauge and its complete curl on the
open interior transverse collar. Across either outer face the original
lazy guard supplies the exterior zero. The argument uses the fixed
continuous lift, including its original copy coordinates, throughout
the path \(H_w\).

**CONDITIONAL C3 extension.** On the admitted fixed chart with strict
original band, three mesh and shell guards, these collars yield zero
jets of the first Forced potential and curl through order three at all
four listed faces, including intersections of the two kinds of faces.
The conditions are ordinary source definedness on the retained
neighborhood, admitted nonzero normal denominators, and continuity of
the same native zero-data matrix on its closed pulse. For physical
time boundary points any slow time derivatives use the original
one-sided convention. No uniform numerical derivative estimate is
required for zero jets on these open collars.

**OPEN.** The four slow offset faces and shell faces, full corrected
wave or Signed joins, bounds for geometric and energetic spatial
endpoints, and all final jets remain separate. Jets 0/67 and RELEASE HOLD.

```text
python -B verify_forced_seams.py HOSTED_ARTIFACT NEW_RECEIPT.json --goal GOAL_NEXT
```
