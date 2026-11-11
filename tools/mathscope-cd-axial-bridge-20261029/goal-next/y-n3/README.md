# N2/N3 source chart split and N3 15 new natural arguments

The original N3 GitHub run 43057719849 has a 3,914,395-node uncompressed stream SHA-256 `f59857c4616e90727e64d9aa77b8ee8a51082274c16cff53098ea7f5db5f511c` and registry SHA-256 `75c53ba678b7db51dc53527d6b753d76e1fc013d515ff253b7b581513b0b53a0`. `collect_n3_reachable.mjs` checks both hashes, its 13 original current/pressure and selector roots, and native registry rules. It visits 598,891 nodes and 713 definition entries; among 582 reached natural nodes there are zero unresolved native kinds. An empty coupled facade adapts the raw-base registry to the typed reader. This traversal concerns the current, pressure and selector roots. Both branches of piecewise nodes are traversed, including inactive branches.

`audit_new15.py` compares the exact N3 reach to the pinned N2 reach. All N2 567 calls and their literal AST nodes are unchanged in N3. The 15 new calls are 11 with `#125505=Lambda*xi4^2` and four with `#125579=Lambda*Xa*exp(log(xi4^2/Xa))`. These use actual order-4 Picard system 7, original domain `0<=xi4<=sqrt(Xa*exp(t1/16))` and eta formal #2. Its positive-log calls are reachable before, and unreachable after, removal of the nine matching source `xi4^2>Xa` branch paths. Its four original even-profile calls likewise disappear after removing all matching Xkeep/Xcut branch arms, and exist before the removal. No shared expression in its coefficient closure rebinds its formal xi4. Assuming the declared original Picard radial domain, its eta/frame semantics and `Xa=4/Lambda, 0<t1<1`, every one of the 15 new values lies in `[0,4 exp(t1/16)]`, which is strictly below `64/15<5`.

This new order-4 system is reachable in the N3 selector prefix because the original omitted next scale b4 uses its coefficient norms. The complete range for all 582 calls remains OPEN, including transport of the earlier 567 calls through N3 frames, active physical image conditions, Picard regularity and seam derivatives.

For any valid original N2 reference chart with `floor(log2 b2)<=ell<=floor(log2 b3)-1`, `q=2^(-ell)*s` and `1/2<s<2`, source monotonicity gives `b3*q>=2*s>1`. If `b3*q>=2`, use N2. If `1<b3*q<2` and the same actual common family obeys `b4>=2*b3`, set `ell3=floor(log2 b3)`. Then `ell3` lies in the N3 window, `1/2<2^ell3*q<2`, and `b4*q>2`. The original b3 cutoff is flat zero at this physical q; field identity across differently constructed chart objects still requires the original actual common-family and chart compatibility theorem. Exact rational controls in `check_chart_split.py` give 20,188 retained N2 and 1,708 N2-to-N3 cases; these do not evaluate the actual source scales. Original release remains HOLD.

Replay from this directory. In the combined evidence archive:

- `MATHSCOPE_N2_REACHED` points to `inputs/original-axial-n2/y-reached.json`.
- `MATHSCOPE_N3_REACHED` points to `inputs/original-whole-k-n3-diagonal/y-reached.json`.
- `MATHSCOPE_N3_GRAPH` points to `inputs/original-whole-k-n3-diagonal/original-whole-k-current-pressure-graph`.

    node --max-old-space-size=4096 collect_n3_reachable.mjs GRAPH REACHED_JSON
    python audit_new15.py
    python check_chart_split.py
