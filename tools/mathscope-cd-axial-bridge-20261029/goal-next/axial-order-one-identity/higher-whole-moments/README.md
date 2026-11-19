# Complete higher-order moment operands

## VERIFIED

The independent replay uses the unchanged original completeOrder branch.
It retains the authenticated 117,100-node prefix, the same original
order-one whole-moment receipt and the same positive Ipos supports and
inverse matrices. For each \(n=2,3,4,5\) it binds all five local
integrals on \([0,X_{\mathrm{cut}}]\), the three whole lower histories
on \([0,X_+]\), all five incoming and correction operands, the two
actual matrix right sides and their inverse products. It checks the
original local mass and pressure prefixes, the whole pressure-convolution
prefix and the five individual normalized radial bump prefixes at each
order. Every bound variable is inspected independently of its caller.
The matrix and integration bounds are fixed in eta. All five repaired
rows cancel in exact rational algebra with their actual incoming moments
as independent operands.

Both source Omega branches are rebuilt from their corresponding
cutoff-local and global lower fields. The loop uses \(\Omega_{n-1}\)
divided by \(X\), including its double axial derivative of \(v_{n-2}\)
with the outer exponent lowered by \(D\). The join uses the original
\(a^2\), and the third branch is zero. The replay rejects reversing
the pressure Omega sign, removing \(X\) from the weighted axial Omega
and dropping the fifth correction, separately at each checked order.

## CONDITIONAL ordinary interpretation, all fixed orders

Write \(F_n=F_t+\delta F\), \(U_n=U_t+\delta U\) for the original
cutoff-local and Ipos pieces. Define
\[
\omega=\Omega_{n-1}/X,\quad
P_{\rm low}=\sum_{i=1}^{n-1}F_iF_{n-i}-\omega/2.
\]
On the common source domain the leading global \(F_0,U_0\)
restrict to the same original inner functions, and the global and
cutoff-local Omega use the same lower mass plateau wherever the join
requires it. On Ipos the ordinary leading restrictions are
\(U_0=0\) and \(F_0=e_f R^{-2-2\lambda}\), retaining any nonzero lower
stream or velocity. Use the full lower global fields in the other
convolution terms, throughout \([0,X_+]\).

The five full physical densities in \(X\) are
\[
 U_n,\qquad 2XF_n,\qquad P'=2F_0F_n+P_{\rm low},\qquad
 2X\sum_{i+j=n}U_i F_j,\qquad \sum_{i+j=n}U_i U_j-XP'.
\]
The contributions with an index zero occur in the local or repaired
current part. The other factors use \(1\le i,j<n\), \(i+j=n\).
Consequently row 3 has lower body \(\sum F_i F_j-\omega/2\),
row 4 has \(2X\sum U_iF_j\), and row 5 has
\(\sum(U_iU_j-XF_iF_j)+X\omega/2\). Row 5 therefore uses an
independent \(X\)-weighted Omega history. In order one the lower
pair sums are empty and the separately bound leading historical
pressure and weighted flux Omega supply rows 3 and 5.

For the Ipos portions let \(R=R_b\rho\) and let \(B_\alpha,B_\beta\)
be the five actual normalized bump combinations with the solved
coefficients. The source uses \(\delta U=B_\alpha/R_b\),
\(\delta F=B_\beta/(R_bR)\), \(dX=R_b^2\rho\,d\rho\). This
maps the five correction densities to the weights
\[
 R_b\rho B_\alpha,\quad R_b^2\rho^2B_\beta,\quad
 2e_fR_b^{-2-2\lambda}\rho^{-2-2\lambda}B_\beta,\quad
 e_fR_b^{1-2\lambda}\rho^{1-2\lambda}B_\alpha,\quad
 -e_fR_b^{-2\lambda}\rho^{-2\lambda}B_\beta .
\]
The two axial rows use the first matrix row and its confluent
combination \(U_{\rm mat,0}-2\lambda U_{\rm mat,1}\).
Indeed \(1-2\lambda\int_0^{\log\rho}e^{-2\lambda s}\,ds
=\rho^{-2\lambda}\). The angular matrix contains the weights of rows
2, 3 and 5. All weights and \(e_f,R_b,\lambda\) are the same source
choices at each order. Positivity and the normalized point-determinant
argument for these supports give the ordinary inverses. The pinned
order-one receipt verifies each of the thirteen continuous matrix entries,
the radial Jacobian and the Ipos leading field restriction.

### Pressure and stream prefixes

Read the candidate pressure density \(P'\) as the independent
expression above. The axis pressure row of the original Picard solution
has this derivative below \(X_{\mathrm{keep}}\) and zero axis value.
The original middle branch is the sum of the local prefix of
\(2F_0F_t\), the Ipos prefixes of \(2F_0\delta F\) and the whole
lower prefix of \(P_{\rm low}\). The first prefix keeps its cutoff
plateau. Each new bump prefix has its own lower limit, normalized
upper radius and exact complete matrix entry on its right. The
two pressure branches consequently give the same ordinary primitive
\(\int_0^X P'(s,\eta)\,ds\). Beyond \(X_v\), \(P'\) is zero by the
original support, including the predecessor axial field in Omega.
Row 3 gives zero integral and hence a zero pressure collar on the left
of \(X_+\) before taking the literal zero extension. This establishes
the ordinary primitive without assuming its right endpoint value.
Integration by parts now identifies the fifth whole density with the
integral of \(\sum U_iU_j+\Pi_n\).

Likewise the source \(M_n\) uses the regular axis average, the
cutoff-local \(U_t\) prefix and its true plateau, and two Ipos axial
prefixes with their completed matrix entries. Its accumulated
value after the second bump is row 1, hence zero. The reconstructed
velocity uses the regular average of \(U_n\), and division by \(X\)
occurs only away from the axis. The two clipped primitives depend
smoothly on eta under the ordinary lower-coefficient, leading
join and integral contracts because the radial endpoints are fixed.
At \(\eta=\pm1\) the derivative convention is the inward trace.

This supplies a single complete fixed-order proof pattern for the
three moment families used by the axial cancellation, conditional
on the original ordinary coefficient realization and leading mixed
jet contracts. It is a source-structural proof plus finite source
replay. Uniform bounds in unbounded order, numerical native infinite
evaluation and the final time-cutoff field remain OPEN. RELEASE HOLD.

## Replay

    node --max-old-space-size=3072 check_higher_moments.mjs ORIGINAL_NAVIER N1_WHOLE_MOMENTS_JSON OUTPUT.json

Use the archived original research-ide/mathscope-m2/navier directory,
the pinned continuation52 whole-moments.json and a fresh output path.
