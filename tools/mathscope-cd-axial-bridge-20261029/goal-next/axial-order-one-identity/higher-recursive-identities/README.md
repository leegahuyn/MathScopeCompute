# Original axial density at every fixed positive order

## VERIFIED

The authenticated order-one branch gives the legacy function #672, raw
density #117045, supported integrand #117047 and whole integral #117075.
The higher branch uses the separate attachStress constructor in original
actual-residual-order-induction-source.mjs, SHA-256
30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047.
The unchanged order-five export has 130,926 nodes and its first 117,100
records match the authenticated order-one prefix. The symbolic reader
checks 52 individual source terms at orders 2 through 5 before checking
each complete raw formula and its actual eta derivative. The raw roots
are the bodies of the original shared expressions, which have different
IDs from their shared application nodes.

The source guard, both split integration binders and the first native eta
application are tested independently. Each original primitive substitutes
its fresh radius for both the guard coordinate and the first formal
argument. The second argument remains the common original eta. The
integrand uses the radius inside the integral. Both primitives use the
same source expression and the correct forward/backward signs.

Verifying each term is essential for the derivative-exponent slot.
Putting \(-A+2ih\) in the derivative of \(U_j\) gives a wrong individual
term. The discrepancy \(4h\eta(j-i)U_iU_j/L\) cancels under the
interchange \(i\leftrightarrow j\) in the complete ordered sum. At
\(n=2,i=0,j=2\) with free values \(U_0=U_2=1,h=1/32,\eta=1/2\),
the exact discrepancy is \(8/63\). The replay also rejects a wrong
outer viscosity exponent, an omitted pressure boundary, and an omitted
continuity defect in every checked order. The four controls use free jets.

## CONDITIONAL match to (5.20) and (5.21)

Take the original domain \(q>0,\ t<1,\ r\ge0\) with
\(1-t=q(1-\eta^2)\), \(z=q^D\eta\), \(X=r^2/(2q)=R^2/2\),
\(A=1/2+h\) and \(D=1/2-h\). Write
\(d=1-\eta^2\), \(L=1-2h\eta^2>7/8\) on the closed real profile
domain. The end values \(\eta=\pm1\) are inward profile traces.
The derivative formulas at fixed physical radius are
\[
 \partial_t(q^a f)=q^{a-1}T_a f,\qquad
 \partial_z(q^a f)=q^{a-D}Z_a f,
\]
where
\[
 T_a f=(-a f+Xf_X+D\eta f_\eta)/L,\qquad
 Z_a f=(2\eta(a f-Xf_X)+df_\eta)/L.
\]
Differentiating the two coordinate relations gives
\(q_t=-1/L,\eta_t=D\eta/(qL)\) and
\(q_z=2\eta q^{1-D}/L,\eta_z=d q^{-D}/L\).
Consequently \(X_t=X/(qL)\) and \(X_z=-2\eta X q^{-D}/L\).
The \(d_\eta,L_\eta\) terms remain present when taking an eta jet,
including at an inward endpoint with \(d=0\).

For each admitted fixed \(n\) write \(\nu=2nh\), \(\mu=2(n-1)h\),
\(a_i=-A+2ih\), \(a=a_n\), \(b=-2A+\nu\), \(c=a_{n-1}\),
and \(v_i=V_i/X\). The physical axial velocity, radial velocity
and pressure coefficients have powers \(q^{-A+2ih}\),
\(q^{-1/2+2ih}\) and \(q^{-2A+2ih}\), respectively, with
radial velocity profile \(V_i/R\). Term by term, time, radial
transport, axial transport, pressure gradient and radial viscosity
give the common axial residual factor \(q^{-A-1+\nu}\).
The previous-order axial viscosity gives the same factor because
\(-A+\mu-2D=-A-1+\nu\). The exact raw density is
\[
 T_a U_n+\sum_{i+j=n}\bigl(Xv_i\,U_{j,X}+U_iZ_{a_j}U_j\bigr)
 +Z_b\Pi_n-2(XU_{n,XX}+U_{n,X})-Z_{c-D}(Z_c U_{n-1}).
\]
The original higher loop uses all \(0\le i\le n\), \(j=n-i\),
the lower global tuples and the current repaired tuple. This includes
\(i=j\) once for even \(n\) and both directions for unequal indices.
The source Picard forcing uses the strictly positive pairs \(1\le i<n\)
and its original cutoff-local records. The pressure uses the whole
Omega coefficient at index \(n-1\). Its nested axial viscosity for
\(n\ge2\) uses \(v_{n-2}\). The axial residual uses \(U_{n-1}\).

### Ordered transport and the seven boundaries

Set \(C_i=(Xv_i)_X+Z_{a_i}U_i\). For one ordered pair, the
product rule with \(a_i+a_j=b\) gives
\[
 Xv_i U_{j,X}+U_iZ_{a_j}U_j
 =\partial_X(Xv_i U_j)+Z_b(U_iU_j)-U_j C_i.
\]
Write \(Q=\sum_{i+j=n}U_iU_j\) and \(H=\sum_{i+j=n}v_iU_j\).
Let \(\bar T,\bar Z\) omit the \(X\partial_X\) summand and preserve
the eta coefficients. The raw source density equals
\[
 \bar T_{D+\nu}U_n+\bar Z_\mu(Q-X\Pi_{n,X})
 -\bar Z_\mu\bar Z_{D+\mu}U_{n-1}
 +\partial_X B-\sum_{i+j=n}U_j C_i,
\]
where the complete radial expression is
\[
 B=\frac{XU_n}{L}+XH-\frac{2\eta X(Q+\Pi_n)}{L}
   +\bar Z_\mu(X\Pi_n)-2XU_{n,X}
   +\frac{2\eta X Z_cU_{n-1}}{L}
   +\bar Z_\mu\left(\frac{2\eta X U_{n-1}}L\right).
\]
The six symbolic free-jet identities and their eta derivatives prove the
formula by summing the ordered pairs and the linear terms. The pressure
uses \(\Pi_n=-X\Pi_{n,X}+(X\Pi_n)_X\), which contributes the
positive fourth boundary. The ordinary reconstructed stream obeys
\(M_{i,X}=U_i\) and
\[
 Xv_i=(2\eta XU_i-2\eta(D+2ih)M_i-dM_{i,\eta})/L.
\]
Substitution gives \(C_i=0\). It also covers the reconstructed leading
stream at \(i=0\) on the same real chart.

### Ordinary zero collars

At \(X<X_{\mathrm{keep}}\), the actual cutoff equals one and the
repair supports have not started. The leading source and the earlier
local reconstructions agree with their original global restrictions there.
The source standalone \(n=1\) and common \(n\ge2\) Picard kernels have
the same axial row template. Component 3 yields
\(\Pi_{n,X}=2F_0F_n+p_{\mathrm{known}}\). With \(W_5=2\xi U_{n,X}\)
and \(X=\xi^2\), component 5 gives
\((W_{5,\xi}+W_5/\xi)/2=2(U_{n,X}+XU_{n,XX})\).
The source row divided by 2 has the other raw axial terms on its right
side, including the correct sign of \(p_{\mathrm{known}}\).
The independent check verifies this equation and its eta derivative
for arbitrary \(n\). The ordinary Picard solution and the common
core inputs give a zero collar about \(X_-\), because
\(0<X_-<X_{\mathrm{keep}}\).

The ordinary pressure join at \(X_{\mathrm{keep}}\) follows from the
same original primitive and the common axis constant. At \(a^2\) the
local and global Omega operands agree with their ordinary jets by the
cutoff-mass plateau. At \(X>X_v\) the leading axial \(U_0,v_0\)
and their mixed jets are zero. Positive-order \(F_i,U_i\) have ended
by \(I_{\mathrm{pos,right}}<X_v\). Each ordinary positive \(M_i\)
has derivative \(U_i\) and becomes zero after the two axial repair
bumps by moment 1, so positive \(v_i\) end too. The positive-order
pressure derivative vanishes for \(X_v<X\le X_+\). Each current
convolution has a positive factor, and at \(n=2\) the nested viscosity
of the pressure Omega uses the now zero leading \(v_0\). At \(n=1\)
the leading Omega has zero exterior by the same leading axial support.
Moment 3 gives zero constant pressure on the final interval. Thus
the pressure and raw axial residual have an open zero collar on the
left of \(X_+\). The physical leading \(F_0\) may persist farther
right. Its positive-order pressure partners have ended.

### Whole integral and stress

Each summand of \(B\) has a factor \(X\) at the axis. Ordinary regular
limits for the displayed derivatives make the axis boundary zero.
The right collar gives the other zero boundary. The completed moment
rows 1, 3 and 5 apply here. The linear algebra checks that each sum of
incoming and Ipos correction is zero. The whole-moment denotations
require the ordinary local density on \([0,X_{\mathrm{cut}}]\),
the strictly positive-index global products and actual Omega on
\([0,X_+]\), and the exact Ipos radial Jacobian. The fifth density
is \(Q-X\Pi_{n,X}\). Its integral equals the integral of \(Q+\Pi_n\)
because the endpoint traces of \(X\Pi_n\) vanish.

The actual Ipos scalar is the same fixed
\(\lambda=\exp(-1000T)\) at every order. The source \(T=\exp(1048576)+10\)
gives \(0<\lambda<1/4\). The normalized supports have exact width
\(1/2048\), are inside \(1<x<4\) and have adjacent gaps above \(1/4\).
The positive bump has total mass one by the FTC for the ordinary
flat step. In the axial two-column point determinant the second
weight is \(xw(x)\), where \(w'(x)=x^{-1-2\lambda}>1/8\).
Then \(xy(w(y)-w(x))>1/32\) for the two ordered supports.
For the angular three-column point determinant factor
\(x^{-2-2\lambda}>1/32\) from each column and put \(t=x^2\).
The remaining rows are \(t^{2+\lambda},1,t\), with the second
divided difference at least 1. The two consecutive \(t\) gaps
exceed \(1/2\) and the outer gap exceeds 1, as checked directly for
the original support intervals. The determinant has a fixed sign
and magnitude above \(1/131072\). Integration against the three
positive unit-mass bumps preserves the sign and lower bound by
multilinearity. This supplies the same ordinary normalized inverse
at every fixed order once the bump primitives are interpreted.

For \(n\ge2\) the previous mass is row 1 of the completed order
\(n-1\). For \(n=1\) it is the leading stream integral
\(\int_0^{X_v}U_0=M_0(X_v)-M_0(0)=0\). The current first and fifth
moments need first eta derivatives, and the previous mass needs
second eta derivatives. The fixed compact intervals and continuous
mixed jets give integrable envelopes for interchanging the integrals
and these derivatives. Every further fixed eta derivative uses the
corresponding additional regularity.

The pointwise physical residual factor is \(q^{-A-1+\nu}\), and
\(r\,dr=q\,dX\) at fixed \(q,\eta\). The paper's axial integral
is the supported source whole integral times \(q^{-A+\nu}\). The
two zero collars identify its supported density with the raw coefficient
throughout the integration domain. Under the ordinary premises and
three moment identities the whole integral is zero. Splitting gives
\[
 -\frac1{\sqrt{2X}}\int_{X_-}^{X} \mathrm{raw}_n(s,\eta)\,ds
 =\frac1{\sqrt{2X}}\int_X^{X_+}\mathrm{raw}_n(s,\eta)\,ds
 \quad(X_-<X<X_+).
\]
The square-root divisor is used only in this positive interval.
Both zero collars and the common whole integral give the zero
extension with every admitted fixed mixed jet.

## OPEN

The arbitrary fixed-order implication uses the ordinary source
coefficient realization, same-source real leading mixed derivatives
and support, the pressure/stream primitive contracts, and ordinary
semantics for each native input to the Ipos integrals. The symbolic
replay supplies the independent density and eta algebra. Infinite
solver execution, order-uniform convergence, the whole physical
time-cutoff sum and terminal jets remain OPEN. RELEASE HOLD.

## Replay

Pass the archived original research-ide/mathscope-m2/navier directory and
fresh output paths. Use Python with SymPy 1.14.0 and assertions enabled.

    node --max-old-space-size=3072 export_actual_axial.mjs ORIGINAL_NAVIER source-axial-orders.json
    python -B check_actual_axial.py source-axial-orders.json actual-axial-identity.json
