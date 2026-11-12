# Archived first Forced mode-two input through C3

The original replay binds all 60 real and imaginary mode-two source
components to the actual ten fixed lift/sign paths. The separate source
readback checks each pulse pullback and the shared initialized prefix.
This replay authenticates both receipts and independently expands
the cylindrical conservative quadratic over exact signed integer
polynomials.

For the positive harmonic coefficient U, let J be the rotation
J U = (-U_theta,U_r,0). The original conservative coefficient is

~~~text
D_r(U_j U_r) + D_z(U_j U_z) + U_j U_r/R
  + U_theta (J U)_j/R + 2 i k U_j (n dot U).
~~~

The original full-curl divergence identity cancels the carrier. The
replay subtracts the candidate carrier-free coefficient

~~~text
U_r D_r U_j + U_z D_z U_j
  - U_j(D_r U_r + D_z U_z + U_r/R) + U_theta (J U)_j/R .
~~~

It obtains exactly twice U_j times the full-curl divergence. Reversing
the phase part of the divergence identity fails for each component.
The replay then differentiates the carrier-free signed polynomial in
the five ordinary own-label directions.

Each surviving term has two primary factors. Each factor keeps one
sqrt(zeta) and one P(v), and its own logarithmic pole. Product poles
add. Taking the maximum among the actual requested terms gives common
poles 72, 96, 120 and 144 through orders zero to three. Each real
product contains two leading or two imaginary wave factors. Each
imaginary product contains one of each. The radial fast derivative
adds at most one epsilon^(-kappa_s) factor. Thus the common real and
imaginary powers are 1-kappa_s and 3/2-2*kappa_s, respectively. The
directed replay resolves 15,052 distinct monomial bounds and all 56
mixed multi-indices through C3, including 21 through C2.

The bounds apply on the original admitted archived fixed-label charts
with their smooth zero joins. The numerical operand slab does not
supply N1 admissibility in the strict physical whole-K interior.
The zero-data inverse, mapped gauge and pressure, and a new live
attachment require additional work.

## Replay

~~~sh
node --stack-size=4096 evaluate_mode_two_input_c3.mjs GOAL_NEXT ARITHMETIC_RUNTIME mixed-wave-c4-numerical.json mode-two-input-c3-numerical.json
~~~

The arithmetic runtime and numerical wave input are those used for
the mixed-wave C4 replay. The receipt SHA-256 is
8c54f654d6bf2751c6b17d00047ba53a9222beb9901d538d22c1f72e8c21c42a.

## Archived zero-data inverse and mapped outputs through C3

The inverse replay authenticates the existing independent readback of
the ten archived native zero-data systems. It reuses the checked
mode-two matrix difference -3d I against the fundamental homogeneous
matrix, the exact mapped gauge, full pressure and both cutoff sources.
The reconstructed positive graph uses the actual projected frame
Q = Bleft Pi_n, with Pi_n = I - n n^T/|n|^2, the source normal
and the archived B and M jets. It retains the additional damping
d = epsilon k^2 |n|^2 and uses epsilon k^2 <= 4 when forming its
positive derivative bounds.

Write t_2 = B P z and M_2 = M - 3d I. Then the actual normalized
equation is z_v = M_2 z + F, with F = -Q g_2 / P and z(0)=0.
The normalized propagator has the same forward bound W because the
additional scalar damping commutes with the fundamental propagator
and multiplies it by a factor in [0,1].

Use positive Taylor coefficients indexed by (s,l,j), with s the
total slow degree in R,Z,T, l the transverse xi degree and j the
longitudinal degree. Divide by s!l!j!. The source frame is independent
of xi. The differentiated zero-data Duhamel and endpoint recurrences
are

~~~text
z[s,l,0] <= Ls W (F[s,l,0] + sum_{a=1}^s M2[a,0,0] z[s-a,l,0])
z[s,l,j] <= (F[s,l,j-1] +
  sum_{a=0}^s sum_{b=0}^{j-1} M2[a,0,b] z[s-a,l,j-1-b]) / j .
~~~

The source envelope has P_v = (lambda-dref)P. The latter coefficient
is nonnegative before Ls/2 and nonpositive after it because the
frozen reference tilt has absolute value u exactly at Ls/2.
Consequently 0 < P <= 1. Derivatives of 1/P have the same absolute
Taylor majorant as derivatives of P after factoring out their
respective positive envelopes. Along the pulse the slow point and
Gaussian remain fixed. The normalized forcing uses g_2/P and therefore
loses at most one P. Multiplying by BP restores P in t_2.

The mapped gauge is i times n cross (psi t_2)/(2k|n|^2). The full
mapped pressure retains both (n^T K-n_v^T)t_2 and n dot g_2 with
the original prefactor i psi/(2k|n|^2). The multiplication by i
exchanges the real and imaginary upper factors. The inequality
1/k <= sqrt(epsilon) adds one half to their epsilon powers.
The complement (1-psi)g_2 retains P^2, and psi' t_2 retains P.
The fourth psi derivative enters the C3 bound of the latter term.
The input poles 72, 96, 120 and 144 remain the common bounds through
orders zero to three. The single infinity-norm bound for t_2,
gauge and the two cutoff vectors applies to each component.

Directed arithmetic resolves 200 upper endpoints for all 56 ordinary
multi-indices. The separate replay reconstructs the projected matrix,
the normalized forcing and 40 Duhamel and endpoint recurrences,
then checks every mapped output. Its controls reject omission of
the slow or endpoint second recurrence and an unswapped complex part.

~~~sh
node --stack-size=4096 evaluate_mode_two_inverse_c3.mjs GOAL_NEXT ARITHMETIC_RUNTIME mixed-wave-c4.json mode-two-input-c3-numerical.json mode-two-inverse-c3-numerical.json
node check_mode_two_inverse_c3.mjs mixed-wave-c4.json GOAL_NEXT/whole-k-annular-pressure-lower/lower-covariance-pressure.json mode-two-inverse-c3-numerical.json mode-two-inverse-c3-readback.json
~~~

The inverse receipt SHA-256 is
e66bdbe54057e202131efa663c687d93ce943e66103b92ec9254aa52c11154b1.
The independent readback SHA-256 is
459aeb5bba7a42c86c92a79ec9246ca335a7345baaf327cfdd48cd03cfd49711.

## Transfer to the active original whole-K bands

The exact conservative carrier cancellation, projected-frame identities
and zero-data recurrence apply to a newly authenticated mode-two source
on an admitted active chart. The archived N1 coefficient cannot be
extended by enlarging its q domain. The strict whole-K interior needs
the active N3/N4 source with its actual completed background, frozen
representative, target and covariance. Recheck the physical selector
and the frozen representative selector separately. In particular, the
fourth frozen coefficient can require bounds even where the physical
fourth coefficient is zero. Rebind each native mode-two coefficient,
its H_w formal and actual arguments, damping and mapped outputs to
that graph. Recheck the stability W, normal and frame denominator
floors and square-root weight on the original pulse charts. The
ordinary profile and scalar bounds are inputs to that replay. Converting
these phase-free jets to physical Cartesian field atoms additionally
requires the actual harmonic phase and source coordinate pullback.
