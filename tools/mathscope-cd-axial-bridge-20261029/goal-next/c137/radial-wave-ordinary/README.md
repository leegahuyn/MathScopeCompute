# Ordinary native wave and pressure on the radial faces

**VERIFIED.** The protected stream and active append were authenticated and
the replay read all 240 raw scalar routes for the ten active charts.
The 1,560 wave applications use the same 120 original protected coordinate
bodies as the C135 source witness. The 200 pressure applications use the
40 protected pressure bodies already identified by C120. Each active
pressure body has its complete five-slot routing (value, R, Z, Y0, Y1).
The 40 active radial pressure rows have exact ordinary gradient coefficients
1, a, and a·vr1. This combines Y0 and Y1 into the same L used by the
ordinary donors. The 40 active axial rows have coefficient ε. Harmonics
three and four have no wave-pressure application in these raw rows.

For each of the 40 pressure bodies, the original Forced term multiplies
its six-term numerator by ψ/(mk|n|²), with the sign and real-imaginary
swap from multiplication by i. The terms contain exactly the three
original normal-source products n_j f_j and three original uncut
tangent-state products. Both forced harmonics and both parts use the
same geometry row in each chart, as in the source formula
`normalRow = nᵀK - n_vᵀ`. Only the harmonic-one imaginary pressure adds
the original Primary and Signed pressures. Its Signed term references
the same protected Σ applications #22001223 and #22001224. The twenty
original harmonic-two pressure denominators and numerator IDs also
match the earlier exact readback.

**CONDITIONAL.** Extend the finite radial collar bounds at fixed admitted
label and fixed ε>0 under the original chart/frame positivity, same
pulse path, weighted profile, and ordinary centered Fourier realization
assumptions in C110, C120, C129 and C134–C135. The ordinary wave list
consists of the 27 N=0 first-derivative directions other than TT and
the seed value. The pressure list is the 13 N=0 directions and value.
The pressure list exactly equals the 14 protected C120 quantitative
directions. There is no new pressure TT request.

The conservative first Forced and Signed curl closure is the Leibniz
downset of wave rows plus 0, R, Z and L. This calls 55 phase-free gauge
directions. Both harmonics have C129 quantitative gauge rows for 53
directions. The two remaining directions R³L and R⁴ have the exact
C135 finite source replay with the Gaussian analysis inherited from C134.
This packet replays the held-back gauge source dependencies separately,
including 72 initialized mean roles, their 431 typed Primary covariance
roles and the ordinary Primary envelope (slow degree 6, T degree 1, L
degree 8). No transverse order 9 or 10 is needed for this separate
two-gauge extension. Signed uses the 25 projected RZT directions in the
receipt, all covered for both radial collars. The Signed source has no L
derivative demand, as L annihilates its uncut amplitude and pulse
representative. The cutoff derivatives use the original finite smooth
cutoff orders. The weighted stress and centered primitive normalization
use pressure root #22000443 and fixed endpoints #17743711 and #17743713.

On either face write ℓ for u or d, where
`u=log(X/X_a)/t_1`, `d=log(X_b/X)` and
`ζ=exp(-1/u²-4/d²)`. Ordinary derivatives of the weighted Primary
and first Forced factors keep ζ^(1/2) for mode one and ζ for mode two
up to a finite power of ℓ^(-1). For the two C135-only gauges, this follows
by differentiating the original zero-data Volterra equation along the
finite downset of the source orders. Its matrix stays locally bounded
on the original finite pulse path at fixed label. The Gaussian depends
on the slow shell, is constant during this pulse integration and factors
out of the estimate. The original short centered primitives and Fourier
tails supply the required mean role derivatives under their given
realization premises. The Signed source gives ζ up to a finite pole.
The original inverse divides by one factor of √ζ and introduces no
further inverse Gaussian. This yields the same √ζ bound for the Signed
pressure and velocity. Reintroducing native phase and finite radial
Laurent multipliers preserves the one-sided zero trace, jointly on
compact neighborhoods of each fixed-label face, since
ℓ^(-p) exp(-c/ℓ²) tends to zero for every finite p and c>0.

This packet concerns the ordinary wave and pressure portion of the
fixed-label radial first derivative. The mean cofactors, four
subtractions, TT, N-varying directions and TN use independent packets.
The full aggregate and any uniform ε estimate require their own
conclusions. Final jets remain 0/67 and RELEASE HOLD.

Run twice with byte-identical results:

~~~text
python -B verify_radial_wave_ordinary.py --work WORK_GOAL_NEXT --goal REPO_GOAL_NEXT --out ordinary-wave-pressure.json
python -B verify_radial_wave_ordinary.py --work WORK_GOAL_NEXT --goal REPO_GOAL_NEXT --out ordinary-wave-pressure-replay.json
~~~
