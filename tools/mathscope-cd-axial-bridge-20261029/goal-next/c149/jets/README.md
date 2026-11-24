# Repeat Forced term and the final jet request

## Verified source structure and conditional formulas

The archived source stream contains 22,380,596 nodes and retains the coupled registry. The successful native Repeat attachment appended 1,764 nodes and registered four fields. Field 32 and indexed root 22382359 give the pressure increment of this one Forced contribution.

For the three gauge components, the reconstruction takes all 240 retained coefficient applications from the original registry. In each chart and mode, the original pre-curl complex gauge is \(i(a+ib)=-b+ia\). The real field sums the positive and conjugate negative modes. Each positive mode contributes \(2((-b)\cos(km\Phi)-a\sin(km\Phi))\). The builder checks the registered system role, sign, source body, actual argument order and zero native derivative orders. It uses the runtime's source node IDs for the phase and carrier. It copies the original outer slow guards, level selectors, transverse and pulse guards, and the complete two-sign and 81-box dispatch from the pressure increment. The own-to-reference factor \(\rho^{A-1/2}\) and reference arguments come from the successful live first-stage gauge ingress. Its chart argument IDs agree exactly with the attached Repeat pressure chart arguments.

This yields three appended gauge identities whose chart interpretation depends on the original fixed-label admission. The append is an offline replay artifact. Live registration and interval evaluation remain open.

For \(R>0\) and at a fixed reference label and \(Q\), write \(R=r/\sqrt Q\), \(Z=z/Q^{1/2-h}\), \(T=\tau/Q\), and \(\epsilon=Q^h\). The normalized cylindrical derivatives are
\[
 D_r=\partial_R+a(v_{r0}\partial_{Y_0}+v_{r1}\partial_{Y_1}),\qquad
 D_z=\epsilon\partial_Z.
\]
The normalized physical \(t\)-derivative has multiplier \(Q^{-1-h}\) and acts as \(-\epsilon\partial_T+c_i(v_{t0}\partial_{Y_0}+v_{t1}\partial_{Y_1})\). Consequently the normalized remaining-time derivative is
\[
 D_\tau=\partial_T-(c_i/\epsilon)(v_{t0}\partial_{Y_0}+v_{t1}\partial_{Y_1})
\]
with multiplier \(Q^{-1}\). The normalized Cartesian derivatives are
\[
 D_x=\cos\theta D_r-\sin\theta R^{-1}\partial_\theta,\qquad
 D_y=\sin\theta D_r+\cos\theta R^{-1}\partial_\theta.
\]
Both have physical multiplier \(Q^{-1/2}\), as does \(D_z\). Rotate the cylindrical input \((A_r,A_\theta,A_z)\) at angle \(\theta\) before applying the derivatives. The exact expansion differentiates the rotation, \(R^{-1}\), and \(a(R)\) through every requested order. It treats \(c_i,\epsilon,v_r,v_t\) as fixed at the reference label. It checks the product rule and equality of the two \(x,y\) derivative orders using integer arithmetic.

For multi-index \(\alpha\) and \(d=\alpha_x+\alpha_y+\alpha_z\), the chart-to-physical multipliers are \(Q^{1/2-A-d/2-\alpha_\tau}\) for the potential and \(Q^{-2A-d/2-\alpha_\tau}\) for pressure. The native derivative direction order is \((R,Z,T,Y_0,Y_1,\theta)\). For instance, pressure's \(z\) derivative uses the single native \(Z\) direction, with coefficient \(\epsilon\) and multiplier \(Q^{-2A-1/2}\). The replay gives 1,073 gauge append nodes and 176 explicit native partial nodes. The 61 A/p operators contain 1,532 exact coefficient terms over 180 distinct native leaves.

## Smooth direct swirl and the axis

The request defines \(s=x^2+y^2=r^2\) and \(B_\theta=r b(s,z,\tau)\) for \(r>0\). The six direct-swirl labels require the canonical smooth scalar \(b\). At positive radius and for a supplied chart scalar \(\bar b\) with \(b=Q^{-A-1/2}\bar b\), the operator for \(\partial_s\) is \(D_s=(2R)^{-1}D_r\), with scale \(Q^{-1}\). Thus
\[
 D_s^2\bar b=\tfrac14\big(R^{-2}D_r^2\bar b-R^{-3}D_r\bar b\big).
\]
The value, \(D_\tau\), \(D_z\), \(D_z^2\), \(D_s\), and \(D_s^2\) are the six requested shapes. The physical factors follow from \(Q^{-A-1/2}\) and one \(Q^{-1}\) per \(s,\tau\) derivative or one \(Q^{-1/2}\) per \(z\) derivative. These formulas require \(R>0\).

If the scalar \(b\) has a \(C^2\) extension in \(s\) to the axis, and the even physical radial function \(F(r)=b(r^2,z,\tau)\) is \(C^4\), then \(F''(0)=2b_s(0,z,\tau)\) and \(F^{(4)}(0)=12b_{ss}(0,z,\tau)\). The second-order Taylor expansion in \(s\) becomes \(F=b(0)+b_s(0)r^2+\frac12 b_{ss}(0)r^4+o(r^4)\). These are axis trace identities for the canonical scalar. The complete smooth source scalar and its six closed-cell intervals remain open.

## Exact outer-cutoff product

The original request uses \(C(s,z,\tau)=\chi(2s/r_0^2)\chi(2z^2/z_0^2)\chi(\tau/\tau_0)\) with \(s=x^2+y^2\). The independent product expansion checks that the 67 labels contain every lower-order field derivative needed to apply \(C\), and the 13 original cutoff labels supply every corresponding cutoff derivative. It produces 260 integer-coefficient terms including the powers of \(x,y\) from the composition. This covers the algebra needed for \(CA,Cb,Cp\) once the inputs are enclosed. Each frozen stage cutoff acts inside its canonical field and still requires original admissibility and tail proofs.

## Remaining original-data obligations

- Authenticate the canonical original potential, direct-swirl scalar and pressure after all correction stages and frozen cutoffs.
- Prove the fixed-label chart coverage and required boundary, seam and axis extensions.
- Evaluate native coupled derivatives using exact enclosures or directed rounding on every requested closed cell, with omitted tails controlled for the same frozen selectors.
- Bind the resulting 67 inclusions to the original request. The certified actual jet count here is 0/67.

## Replay

Run the builder with the successful native Repeat artifact directory and the pinned original request JSON. Then run the derivative and cutoff expansions.

    python build_repeat_gauge_jets.py <native-repeat-directory> <original-jet-request.json> <scratch-directory>
    python realize_cartesian_jet_dispatch.py <scratch-directory>
    python derive_outer_cutoff_product_jets.py <original-jet-request.json> <output.json>

The ordered JSONL appends require the original graph prefix followed by the successful native Repeat attachment. Previously registered identities and definitions stay fixed.
