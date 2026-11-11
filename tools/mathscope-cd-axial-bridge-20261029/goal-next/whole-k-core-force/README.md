# Original localized force and energy interval transfer

The checker substitutes the original 82 operands in the pinned energy operator. The 67 field operands are converted to their original 22 scalar \(a,b,p\) derivatives in the core or slow annular gauge. The checker independently differentiates the Cartesian velocity and pressure and compares all three velocity, nine velocity-gradient, one pressure and three full force rows. The result retains the physical \(-\partial_\tau\) sign, centrifugal and other nonlinear terms, and the pressure gradient. The divergence is exactly zero.

On the original entire inner region \(0\le \Lambda X\le4\) the radial outer cutoff is flat. The axial cutoff can vary. Thus \(C=C(z,\tau)\) there, with all needed \(z\)-derivatives through order three and the mixed \(z,\tau\) derivative. The checker enforces the original derivative coefficients using 256 exact rational transition cells. It keeps the \(C_zA\) curl term, \(C_zp\) pressure term and their other derivatives. The \(Y=4\) face uses the original smooth annular zero extension.

The force and normalized energy, dissipation, work and force-square integral upper endpoints are finite expressions in positive original norm factors. The checker records the physical volume Jacobian and bounds the original moving spatial region at each time. Restricted regions have spatial and moving-boundary flux. Whole-K energy defect and independent refinements remain open.

In the annular mode the same operator is applied to the slow field only. Its exact force increment for the full localized velocity \(U_B+w\) and pressure \(p_B+\pi\) is
\[
-\partial_\tau w-\Delta w+\nabla\pi+
(U_B\cdot\nabla)w+(w\cdot\nabla)U_B+(w\cdot\nabla)w.
\]
The original annular initialization and active wave/mean corrections still need jet bounds. N7-06 and N8-05 remain OPEN. Global jet coverage is 0/67 and RELEASE HOLD remains in force.

    python check_inner_force.py --localization-source <inputs/localization-source> --chart <whole-k-chart.json> \
      --whole-inner-intervals ../whole-k-inner-axis/inner-axis-jet-bounds.json --out whole-inner-force-energy.json
    python check_inner_force.py --localization-source <inputs/localization-source> --chart <whole-k-chart.json> \
      --annular-slow-intervals ../whole-k-annular-slow/annular-slow-jet-bounds.json --out annular-slow-force-energy.json
