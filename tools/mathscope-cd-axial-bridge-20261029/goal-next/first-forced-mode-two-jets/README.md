# Archived first Forced mode two, selected ordinary output jets

**VERIFIED source and arithmetic.** The producer authenticates the 4,197,115-node original Forced graph, its native registry, and the exact original forced-pulse implementation. In all ten archived mode-two systems, the actual matrix differs from its same-row mode-one matrix by \(-3dI\). The actual off-diagonal roots coincide. The mode-one source has the additional mean reference-band formal \(\#3675253\), while both matrices use the same live slow and torus derivative directions. The readback checks the original zero-data applications, mapped potential, pressure and cutoff terms and verifies the derivative arithmetic with noncommuting matrices.

**CONDITIONAL analytic result.** The 636-node positive graph bounds all ordinary first derivatives of the archived mode-two solution \(t_2\) and mapped gauge, and the selected second derivatives \(vv\), \(Rv,Zv,Tv\) and \(\xi v\). It also bounds the mapped mode-two pressure and both principal cutoff terms through ordinary order one. These estimates use the earlier actual weighted input C1 and original same-box stability, denominator, cutoff and smooth extension premises. They apply in the archived N1 admitted fixed-label domain. The physical whole-K annulus requires a separate active N3/N4 source attachment. Final jets 0/67, RELEASE HOLD.

| Bound | Value | Any slow derivative | \(\xi\) | \(v\) | \(vv\) | Slow-\(v\) | \(\xi v\) |
|---|---:|---:|---:|---:|---:|---:|---:|
| \(t_2\) | 401 | 404 | 405 | 408 | 412 | 417 | 420 |
| Mapped normalized gauge | 477 | 480 | 481 | 484 | 488 | 493 | 496 |
| Mapped normalized pressure | 590 | 607 | 627 | 622 | | | |
| \((1-\psi)g_2\) | 365 | 366 | 366 | 629 | | | |
| \(\psi't_2\) | 630 | 631 | 632 | 635 | | | |

The slow column bounds each of \(R,Z,T\), holding the original label, representative and fast coordinates fixed. The table concerns the positive complex mode coefficients before differentiating the separate harmonic phase. The normalized gauge and pressure roots carry \(\epsilon^{3/2-\kappa_s}\zeta\delta^{-144}P(v)\), \(t_2\) and the cutoff derivative term carry \(\epsilon^{1-\kappa_s}\zeta\delta^{-144}P(v)\), and the complement carries the same latter weight with \(P(v)^2\). Use the original physical gauge or pressure scale when converting these coefficients.

## Actual derivative variables

The native ordered solution has equation \(t_v=(A_\phi-4dI)t-\Pi_ng_2\) and zero data at \(v=0\). Its stored parameter directions are \(R,Z,T,Y_0,Y_1\). The original derivative implementation increases the matching variational order for a live parameter and uses the exact forced right-hand side when differentiating the pulse endpoint. The fixed original path \(H_w\) preserves \(\xi\) and changes the pulse value to \(w\). The first input certificate binds the 60 components through the actual native path applications. For the present estimates it gives the ordinary own-label derivatives with respect to \(R,Z,T,\xi,v\), including \(v\) along the pulse. At fixed slow point and frozen label, \(\xi\) is independent of the path endpoint and the frame has no \(\xi\) dependence.

The normalized source uses \(t=BPz\) and \(G=\lambda-d_{\rm ref}\), with \(P_v=GP\). Put
\[
M_2=M-3dI,\qquad F=-B_{\rm left}\Pi_n\,g_2/P.
\]
Then \(z_v=M_2z+F\) and \(z(0)=0\). The original forward propagator bound \(W\) still holds because the scalar damping \(3d\) is nonnegative and commutes with the fundamental propagator. The norm construction retains actual matrix bounds through the first slow and pulse derivatives. It uses \(\epsilon k^2\le4\) to bound the added \(3d\) and its derivatives by \(12\) times the corresponding jets of \(|n|^2\).

## Weighted slow and pulse derivatives

For an ordinary slow parameter \(s\in\{R,Z,T\}\), differentiate the exact zero-data equation at fixed endpoints:
\[
(z_s)_v=M_2z_s+(M_2)_sz+F_s,\qquad z_s(0)=0 .
\]
The \(\xi\) equation has zero matrix derivative. The positive graph applies Duhamel with \(L_s W\) and the exact first derivative of \(B_{\rm left}\Pi_n\). The actual source \(g_2\) and its first derivatives each retain \(P^2\). Dividing once by positive \(P\) in the normalized equation leaves \(P\le1\). The derivative of the normalized source in \(v\) retains the term from \((1/P)_v=-G/P\). Slow derivatives of the source use the actual differentiated source bounds from the input certificate. No derivative is taken of the positive envelope used as a bound.

Use the exact equations
\[
z_{vv}=(M_2)_vz+M_2z_v+F_v,\quad
z_{sv}=(M_2)_sz+M_2z_s+F_s,\quad
z_{\xi v}=M_2z_\xi+F_\xi .
\]
Recover \(t\) and its derivatives by the product rule for \(BPz\), including \(P_{vv}=(G_v+G^2)P\). The frame derivative bounds follow from the original moving \(n\), \(n_v\), \(K_a,N_a,s_a\), \(c_0\sqrt{1+s^2}\), \(B\), and \(B_{\rm left}\), using the retained positive denominators. The readback independently checks the ordered matrix derivative and rejects moving \((M_2)_s\) through \(z\). Second slow derivatives or third pulse derivatives would require at least the corresponding second source jets. A complete third-order mapped gauge also requires third slow source jets.

## Mapped source outputs

The original normalized mode-two potential is \(i\,n\times(\psi t)/(2k|n|^2)\). The bound uses the actual \(n/|n|^2\) derivative factors, \(\psi'\) and \(\psi''\), and all selected product terms. The original mapped pressure is
\[
\psi\pi_2=\frac{i\psi}{2k|n|^2}
\big((n^\top K-n_v^\top)t+n\cdot g_2\big).
\]
The pressure C1 bound keeps the direct normal-source term and its first derivatives. Use \(k^{-1}\le\sqrt\epsilon\) for both pressure and gauge. The two original cutoff source terms are bounded separately. Their \(v\) derivatives retain \(-\psi'g_2\) and \(\psi''t+\psi't_v\), respectively. The source ledger records their exact mapped nodes for every archived case.

## Replay

```text
node --max-old-space-size=2048 replay_mode_two_jets.mjs GOAL_NEXT ARCHIVED_FORCED_GRAPH ORIGINAL_FORCED_PULSE_MJS mode-two-selected-jets.json
node check_mode_two_jets.mjs GOAL_NEXT ARCHIVED_FORCED_GRAPH mode-two-selected-jets.json mode-two-selected-jets-readback.json
```

In the workspace GOAL_NEXT is `work/goal-next` and ARCHIVED_FORCED_GRAPH is `work/goal-next/first-force-repair/hosted-43010379487/corrected-first-forced-graph`. ORIGINAL_FORCED_PULSE_MJS is the original `research-ide/mathscope-m3/navier/source-forced-pulse.mjs` at archived source SHA-256 `129423c917b3b8b1aae72b242f802e9f9934f17569fa895c669708785dbff924`, available under `work/goal-next/second-live/node-fixture/` in the workspace. The replay imports the two earlier archived mode-two receipts and the actual primary and background norm graphs by SHA-256. No local Lean compilation, new GitHub run, or numerical quadrature was used.
