# Whole-K angular reduction and the first-correction radial collar

The original slab uses \(r^2=x^2+y^2\), \(\tau_0=q_{\rm Big}/32\),
\(z_0=\tau_0^{1/2-h}\), \(\zeta=z/z_0\), and \(\rho=\tau/\tau_0\). Its outer cutoff is
\(C=\chi(2r^2)\chi(2\zeta^2)\chi(\rho)\). The spatial section
\(r^2,\zeta^2\le1/2\) contains complete physical circles at \(r>0\).
The slab has \(1/2\le\rho\le1\). At the starting slice \(\rho=1\)
the velocity vanishes and the 13 outer cutoff jets are all zero.
With \(U=\tau_0^A u\) and \(F=\tau_0^{A+1}f\), division of the
integrated balance by \(z_0\tau_0^{-2A}\) gives transverse and axial
dissipation coefficients \(\nu\tau_0\) and \(\nu\tau_0^{2h}\).
The integration measures are \(r\,dr\,d\theta\,d\zeta\) and
\(d\rho\) with the physical time limits reversed.

## Source radial collar

The first correction's five joined physical roots are #4458212,
#4458214, #4458216, #4458218 and #4458220. Their exterior guards
give \(r^2\le Q_{\rm ref} R_o^2\) on the radial support, with
\(R_o=2\sqrt{X_b}\) and \(Q_{\rm ref}=2^{-(L+2)}\). The original
selector gives \(Q_{\rm ref}\le q_{\rm Big}/4\), and the source
radial-envelope comparison gives \(R_o\le R_*=\mathrm{C12EnvelopeR}\).
From \(\ell_{\min}\ge R_*^{1024}\) one obtains
\[
 \log(1/q_{\rm Big})>\tfrac12 R_*^{1024}\ge\tfrac12+512\log R_*.
\]
Consequently \(r^2\le q_{\rm Big}R_*^2/4<1/6<1/4\) on this support.
The outer radial factor \(\chi(2r^2)\) is identically one in an
open neighborhood of it. Its radial cutoff-curl contribution is
zero. The actual stage cutoff \(\chi(a_1q)\) is independent of
the angle. Axial and time cutoff terms remain.

The verified closed \(N=1\) box has \(15/16\le T\le17/16\) and
\(|Z|\le1/8\). For \(j=L-\ell_{\min}-10\), \(T=2^{j-3}\rho\).
The overlap with whole-K occurs only for \(j=3\) and
\(15/16\le\rho\le1\), or \(j=4\) and \(1/2\le\rho\le17/32\).
Both cases retain the axial condition
\(|\zeta|2^{(j-3)(1/2-h)}\le1/8\).

## Source angular modes

The replay checks 486 indexed gauge rows and 30 own-chart
bodies. It binds 150 trigonometric terms with \(|m|=1,2\) and
420 angle-independent guard or argument roots. The mean
meridional potential and direct swirl are independent of
\(\theta\). The phase of each remaining term is \(m k\Phi\),
where \(\Phi=\omega\theta/k+\Phi_0\) and \(\omega\) is the
original nonzero integer winding. The corresponding physical
Fourier frequency is \(n=m\omega\). Angularly invariant
localization and cylindrical curl preserve these frequencies.

The cross term between the mean and nonzero wave parts of the
first correction has zero full-circle integral on the admitted
regular chart. Equal physical frequencies across rows and
stages must be grouped before taking a norm or work product.
In cylindrical orthonormal components the transverse Cartesian
derivative uses \((\partial_\theta+J)U/r\), where
\(J(v_r,v_\theta,v_z)=(-v_\theta,v_r,0)\). The angular part of
the gradient for frequency \(n\) therefore uses
\(r^{-2}|(inI+J)U_n|^2\).

N7-06 still requires the same final field across the entire slab,
its endpoint energy, interior dissipation and work, and independent
space and time refinements. The exact angular reduction applies to
the first correction in its admitted overlap. The normalized
starting-slice contribution is zero globally. RELEASE HOLD.

## Replay

Run the Python checker with the original source pins, normalized
whole-K chart, first-gauge joined graph and native delta, and
radial-envelope receipt. The command-line options accept alternate
locations for those inputs.

