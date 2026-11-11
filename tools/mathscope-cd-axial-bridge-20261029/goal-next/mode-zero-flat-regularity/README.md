# Actual mode-zero cutoff flatness from the centered source fields

This uses the original first-cycle artifact from GitHub Actions run
43010593847, the pinned manuscript's Lemma 8.2 on pages 90–92, and the
repaired radial phase and fixed-\(u\) estimates in
[the mode-zero ledger](../first-force-repair/MODE_ZERO_FLAT_LEDGER.md).

## VERIFIED · The two raw inputs and the surviving FiveMap terms

Keep the band and its common index fixed. Let
\(f^\circ=f-\langle f\rangle_Y\) use normalized auxiliary-torus Haar
measure, distinct from physical angular averaging. Let
\(A_e[f]=R^{-e}\chi_R J(R^e f)\), with the actual translated radial
integral and held endpoints.

For the actual final pressure cutoff, #4455782,
\[
 A_{0,\mathrm{final}}=A_0[g_{r,\mathrm{final}}^\circ].
\]
The difference of the two inputs is \(\langle g_{r,\mathrm{final}}\rangle_Y-
\rho P_{\mathrm{final}}\), which is independent of \(Y\). Its ordinary
radial whole is zero because #4455439 integrates the Haar average of
the same source #4455275 and the actual normalizer #633726 has radial
mass one. The shift leaves this difference unchanged. Thus only the
centered raw #4455275 enters this cutoff estimate.

For the actual axial fast-time cutoff term,
\[
 F_{\rm ax}=-c_{i_0}N A_1[\gamma_d]
            =A_1[E_z^\circ].
\]
Here the actual T1 whole #4454051 evaluates
\(\gamma_d=-c_{i_0}^{-1}N^{-1}E_z^\circ\) through the original
`coupled-inverse:1`, with the checked translated actual torus arguments
and the radial weight at its integration binder. The input #4229836 is
exactly #4229480 minus its own two Haar integrals #4229831/#4229832.
Both held radial endpoints, \(R^{-1}\), \(\chi_R\), the torus shift and
\(c_{i_0}\) are independent of \(Y\). On the original ordinary
periodic derivative domain, \(A_1\) commutes with \(N\) and
\(NN^{-1}E_z^\circ=E_z^\circ\). The two negative signs cancel. This
removes the derivative loss and the \(c_{i_0}\) factors from the
estimate of this particular flat residual. The realized Temporal
velocity still uses the original inverse.

The replay also compares the full actual radial source bodies before
and after the FiveMap update, #4454367 and #4455275. The actual FiveMap
increments #4455175, #4455153 and #4455157 depend only on
\((\ell,R,Z,T)\), including all their native defining bodies. The exact
centered change is
\[
 \begin{aligned}
 g_{r,\mathrm{final}}^\circ-g_{r,\mathrm{preFive}}^\circ={}&
  -(D_r+R^{-1})(2\beta_{\mathrm{preFive}}^\circ\beta_5)\\
 &-D_z(\beta_{\mathrm{preFive}}^\circ\gamma_5
           +\beta_5\gamma_{\mathrm{preFive}}^\circ)
  +2R^{-1}v_{\mathrm{preFive}}^\circ v_5.
 \end{aligned}
\]
The algebra replay verifies this by subtracting the actual velocity
contributions and comparing the leftover polynomial with the exact
background-plus-FiveMap radial velocity residual difference. The
leftover is auxiliary independent. The full source comparison keeps
the unchanged wave covariance.

## CONDITIONAL · A finite-order criterion for either actual cutoff

The actual cutoff is a flat step of #633700, namely
\(10(R/(x_0\sqrt s)-1)\). Every derivative of \(\chi_R\) is supported
in the closed fixed interval
\[
 eX_{0,I_{\mathrm{mean}}}\le X\le (121/100)eX_{0,I_{\mathrm{mean}}}.
\]
The original shell proof places this interval strictly inside
\((X_a,X_b)\). The weight \(\zeta\) has a positive lower bound there
and both logarithmic edge distances are uniformly positive. The
strict-exterior replay checks the centered axial input is zero
outside the original fixed radial envelope. The final radial source
agrees there with the original initialized radial source, whose
exterior terms use the auxiliary-independent background and initial
FiveMap. The original early Temporal and all wave covariance terms
vanish on that exterior. Ordinary positive-order matching through the
edges and slow joins is a separate input to the estimate.

For either centered raw input let \(U=R^{d_r}\) and
\(F(U,Z,T,y)=R^e f^\circ(R,Z,T,y)/(d_rR^{d_r-1})\), with \(e=0\)
or \(1\) respectively. Use the actual radial zero extension. Fix an
output derivative order \(m\) and \(p\ge1\). A sufficient mixed
seminorm is
\[
 B_{m,p}=\sup_{Z,T}\max_{|I|\le m}\int_{\mathbb R}
   \max_{j=0,1}\|\partial_{y_j}^{p+1}\partial_U^p D^I F(U,Z,T,\cdot)\|_{L^2_Y}\,dU.
\]
Here \(D^I\) differentiates \((U,Z,T,y)\). The required derivatives
of the zero extension must have no boundary terms in the \(p\)
radial integrations. Smooth zero extension through the displayed
orders is sufficient. The whole fixed-\(u\) integral from (8.9)
then gives
\[
 \|A_e[f^\circ]\|_{C^m}\le
 C_{m,e}(7/18)^p M_{\rm osc}^{-p} B_{m,p}.
\]
The uniform cutoff and radial conversion factors are included in
\(C_{m,e}\). The same bound with a fixed additional constant holds
relative to \(\zeta\) on the actual interior cutoff support. In
particular a uniform unweighted bound for this specific mixed
seminorm suffices. The original \(M_\alpha\) hypothesis implies such a
bound, since each fixed \(\zeta\delta^{-b}\) is bounded.

For the torus estimate, set \(\nu(k)=k_0+(1-\sqrt2)k_1\),
\(n=\|k\|_\infty\), and \(D=2+\sqrt2\). The quadratic norm gives
\(|\nu(k)|^{-1}\le Dn\). Distinct frequencies with \(n\le N\)
are separated by \(1/(2DN)\), including separation from zero.
Summing the ordered positive and negative values gives
\(\sum_{0<n\le N}|\nu(k)|^{-2p}\le4(2DN)^{2p}\). Hence the dyadic
bound is
\[
 \sum_{k\ne0}n^{-2(p+1)}|\nu(k)|^{-2p}\le(16/3)(4D)^{2p}.
\]
For each Fourier mode use \(p+1\) derivatives in a coordinate where
\(|k_j|=n\). Bessel's inequality on the two disjoint subsets and
Cauchy–Schwarz give the constant
\(\sqrt{32/3}(4D)^p/(2\pi)^{2p+1}<(7/18)^p\).
Applying this to the radial IBP identity proves the bound. Thus
\(m+2p+1\) ordinary input derivatives suffice, with the sharper
mixed demands shown above.

If \(B_{m,p}\le C\epsilon^\alpha S_*^B\) uniformly in the original
band, the actual inverse phase estimate yields
\(\epsilon^{\alpha+p/100000}S_*^{B+p\rho_g}\). For a physical
loss \(q^{-L}\), the strict criterion for order \(q^N\) is
\(h(\alpha+p/100000)>N+L\). For \(\alpha=1-1/100000\), even the
ordinary \(q^1\) criterion at \(L=0\) asks for
\(p>100000/h-99999>409500001\). This is an arithmetic bound for
the sufficient derivative route. A recursive analytic class proof
can quantify over \(p\) without materializing those derivatives.

## OPEN · The first actual norm and trace gaps

For \(m=0,p=1\), the first positive gain needs the actual mixed
derivatives \(\partial_U\partial_{y_j}^2F\) and zero-extension
traces through that integration. A sufficient ordinary source order
is \(K=3\) for each centered input.

- The axial raw source #4229480 uses the actual after-Signed
  covariance, retained initialized \(J_0\) mean velocity and the
  pressure derivative #4229476 from the actual after-Signed
  pressure #4229449. A sufficient source-class route at raw order
  \(K\) asks for pressure \(C^{K+1}\), same-stage covariance
  \(C^{K+2}\) through that pressure, and the old mean velocity
  through \(C^{K+2}\). At \(K=3\) these are orders 4, 5 and 5.
  The original initial residual class describes the pressure and
  covariance derivative accounting. The actual retained old mean
  makes its pre-initialized class insufficient for this state.
- For the centered final radial source, put \(K=m+2p+1\). The
  pre-Five radial source needs its mean velocities through
  \(K+2\) and the common covariance and background through
  \(K+1\) by the original complete mean product formulas.
  The \(p+1\) extra torus derivatives in the exact cross terms
  all fall on pre-Five factors. The FiveMap \(\beta_5,\gamma_5\)
  need only slow order \(m+p+1\) and \(v_5\) slow order \(m+p\).
  The fixed FiveMap transfer needs the actual fresh targets
  #4454726/#4454789/#4454848 through \(m+p+2\). Using the original
  fresh-target operator then needs pre-Five velocity order
  \(m+p+4\) and common covariance/background order \(m+p+3\).
  For \(p\ge1\) these are bounded by \(K+2\) and \(K+1\), so
  the FiveMap adds no derivative order to the pre-Five route.
  In the first positive-gain case this means FiveMap orders 2
  and 1, fresh-target order 3, pre-Five velocity order 5, and
  common covariance/background order 4.

The original class code gives same-source product and norm recurrences.
The hosted primary artifact 43035074273 authenticates the isolated
order-2 primary class, its C5 family and its target through order 3.
The [hosted fixed-chart bound](../primary-force-transfer/README.md)
controls the uncut primary cutoff derivative. Its application to
the complete corrected Forced \(W_\alpha\) input still requires
the same live common-reference family and the remaining raw terms.
The higher-order common covariance from
the actual repaired Forced and Signed rows, the actual post-Signed
Temporal inputs, and the intrinsic radial and slow derivative traces
are unresolved. The fixed-\(u\) norm repair and this criterion reduce
the required derivatives but do not supply those actual seminorms.

A finite low-order bound alone cannot close the all-order assertion.
For example take a smooth compact interior bump \(b(U)\) with positive
integral and set
\(F_Q(U,y)=\epsilon^\alpha M_{\rm osc}^{-k}b(U)
\cos(2\pi(y_0-M_{\rm osc}U))\).
It has zero Haar mean, smooth support and uniform weighted \(C^k\)
bounds. On the actual shifted whole, the oscillation cancels under the
radial integral and the output has size \(\epsilon^\alpha M_{\rm osc}^{-k}\).
This family violates every \(q^N\) bound with
\(N>h(\alpha+k/100000)\). It establishes the need for a stronger
analytic premise when inferring arbitrary power decay from finite
low-order input data.

## Replay

With Python assertions enabled, use the checkout containing the
actual second-candidate checkers and the Git objects of the original
producer. `FULL` is the extracted corrected first-cycle graph.

```text
python check_centered_flat_inputs.py --repo REPO --first-dir FULL --out centered-flat-inputs.json
```

Release remains HOLD.
