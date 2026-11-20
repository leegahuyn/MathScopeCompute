# Same-body radial seams for the original N1 finite approximation

**VERIFIED**. The original N1 runtime and unchanged prefix reproduce both matrix blocks and all six forcing parities, 78 operands in total. The original pressure row is #25602 and its forcing is #26395. The two-term velocity field and three-term pressure field satisfy a literal sum-of-integrals identity for the same original pressure row. Substitution into nine compensated outputs consumes all 18 previously bounded raw calls. The five original compensation equations still have exact zero numerators. The original supported axial node #117047 remains expression system 1 with arguments \((X,\eta)\). The forward, backward and whole integrals #117057, #117066, #117075 preserve their own radius binders, that parameter frame and the original endpoints.

**CONDITIONAL** on the actual C98 leading realization and original C99 ordinary mass, pressure and global leading histories. A single finite Picard body on the actual full radial domain \([0,a]\) gives a smooth approximation at \(X=X_a\). The pressure uses an additional original Picard term so the raw-to-compensated pressure also joins smoothly at \(X_{\rm keep}\). The actual cutoff and moment reconstruction then join to all fixed mixed \((X,\eta)\) orders at \(X_{\rm cut}\), the five Ipos supports, the mass endpoint and \(X_+\). The estimates below quantify the first radial and stress-weighted second radial approximation errors on the registered inner domain. This is a finite approximation, with original analytic leading functions and ordinary quadratures as inputs.

## Original diagonal integral and its smooth parity

Let \(\mathcal B=A_0+A_1\partial_\eta\) and write the original operator
\[
 (G_0 f)_i(\xi,\eta)=\xi\int_0^1 t^{c_i} f_i(t\xi,\eta)\,dt,
 \qquad c=(0,0,2,0,3,1).
\]
Differentiation under this compact, fixed integral gives, for \(r\ge 0\),
\[
 \partial_\xi^r(G_0 f)_i
 =\xi\int_0^1 t^{c_i+r}\partial_\xi^r f_i(t\xi,\eta)\,dt
  +r\int_0^1 t^{c_i+r-1}\partial_\xi^{r-1} f_i(t\xi,\eta)\,dt.
\]
The last term is omitted at \(r=0\). Every exponent that occurs is nonnegative. Mixed parameter differentiation acts on the densities in the same formula. The integral also satisfies \((\partial_\xi+c_i/\xi)(G_0f)_i=f_i\) for \(\xi>0\) and the zero datum at \(\xi=0\). The six parity classes of \(W\) are \(p=(0,0,0,0,1,1)\). For a nonzero original matrix entry the parity is \(1+p_i+p_j\bmod2\); for a nonzero original force it is \(1+p_i\bmod2\). The factor \(\xi\) in \(G_0\) shifts parity once. These rules preserve the original parity for any finite number of terms. The smooth even components have ordinary smooth one-sided \(X=\xi^2\) values at zero, by Taylor's formula with remainder to each required order.

The leading fields have the original flat join at \(X_a\). Under C98 their \(X\)-smoothness and parameter holomorphy give the same properties in the original coefficients and forcing through every fixed order. The original finite integrals that define \(P_1=G_0 f\), \(P_2=P_1+G_0\mathcal BP_1\), and \(P_3=P_1+G_0\mathcal BP_2\) have the same body on both sides of \(\xi=\sqrt{X_a}\). This gives ordinary mixed trace equality at all orders. Formally, \((\partial_\xi+c_i/\xi)P_{N,i}=f_i+(\mathcal B P_{N-1})_i\) for every \(N\ge1\) when \(P_0=0\).

## Pressure primitive and remaining field joins

Take \(\widehat F,\widehat U\) from \(P_2\) and \(\widehat\Pi\) from the fourth component of \(P_3\). That pressure component has diagonal zero, no \(\partial_\eta\) term and only the \(4\xi F_0\) entry acting on \(F\). Its original forcing is \(2\xi p_{\rm known}\). The replay reconstructs both nonzero terms of the original pressure sum individually. Hence
\[
 \partial_X\widehat\Pi=2F_0\widehat F+p_{\rm known},\qquad
 \widehat\Pi(0,\eta)=0.
\]
The third term matters for an exact seam. In a generic miniature case with the same pressure and angular coupling pattern, take \(F_0=1,f_4=2,p_{\rm known}=0\) and keep diagonal \(c_4=3\). Two terms give \(\widehat F=\xi^2/4\) and \(\widehat\Pi=0\). The original pressure recurrence adds \(\xi^4/4\) in the third term, with \(X\) derivative \(\xi^2/2\). The executable check records these exact witnesses at \(\xi=1\).

At \(X_{\rm keep}\), the original cutoff \(1-\sigma\) has unit value and all higher radial jets zero. The original leading pressure primitive has derivative \(-p_{\rm known}\) and zero axis value through this collar, by the retained same-source C99 histories. The new early pressure is therefore exactly the same anchored primitive as its middle expression at \(X_{\rm keep}\), and all higher jets follow from the common density. The same argument for the source mass uses the exact integral of \(\widehat U\). At \(X_{\rm cut}\), the opposite cutoff jet is zero. The positive-radius normalized bump maps preserve flatness at each of their endpoints. Beyond the final axial bump, the first exact moment makes the remaining mass primitive zero. Beyond the original leading axial endpoint, the pressure moment makes the saturated pressure primitive zero up to \(X_+\). These value equalities hold as functions of \(\eta\); all parameter jets commute in the stated ordinary realization. The executable basis checks exercise the diagonal derivative rule on 23,562 exact monomial choices and the formal flat-product and primitive rules on 132 exact basis choices. The formulas establish the identities for each fixed order.

## Absolute raw field and derivative errors

Use the C98 source bounds \(\delta^{-1}<Q^2\), \(a<3Q^{-32}\), and \(M_A<2^{15}Q^4\) for both matrices on \(S_{\delta/4}\). The original forcing integral \(G_0f\) has full-domain norm less than \(2^{26}Q^{-25}\), since the core contribution is at most \(2^{25}Q^{-25}\) and the collar contribution is at most \(2^{21}Q^{-25}\). The short collar width cancels the \(t_1^{-1}\) factor in its forcing. The same simplex and strip estimates of C98 now use the whole domain and one loss \(\delta/8\). They give ratio
\[
 6M_Aa/(\delta/8)<2^{23}Q^{-26}.
\]
In particular \(\|W\|\le2^{27}Q^{-25}\), \(\|W-P_1\|\le2^{50}Q^{-51}\) and \(\|W-P_2\|\le E=2^{73}Q^{-77}\) on \(S_{\delta/8}\).

On \(S_{\delta/16}\), the residual in the first radial equation for \(W-P_2\) is \(\mathcal B(W-P_1)\), bounded by \(2^{70}Q^{-45}\) by Cauchy. The regular diagonal integral gives \(\|(W-P_2)_i/\xi\|\le2^{70}Q^{-45}/(1+c_i)\). Thus \(\|\partial_\xi(W-P_2)\|\le2^{71}Q^{-45}\) including the axis trace. The first two rows give \(\partial_\xi(F-\widehat F)=(W-P_1)_4\) and \(\partial_\xi(U-\widehat U)=(W-P_1)_5\), in zero-based indexing. Since \(g=W-P_1=G_0\mathcal BW\), dividing these by \(2\xi\) gives the raw \(X\) derivative bound \(2^{46}Q^{-19}\). For each of these two errors \(e\), the weighted second derivative from the original stress is \(X e_{XX}=(g_i'-g_i/\xi)/4\) with \(i=4,5\). The diagonal equation gives \(g_i'-g_i/\xi=(\mathcal BW)_i-(c_i+1)g_i/\xi\), with norm at most \(2\|\mathcal BW\|\). Thus \(X e_{XX}\) has the same \(2^{46}Q^{-19}\) bound, including the regular axis trace.

The compatible pressure gives \(\|\partial_X(\Pi-\widehat\Pi)\|\le16QE=2^{77}Q^{-76}\) on \(S_{\delta/8}\), and integrating to \(a^2<5Q^{-64}\) gives pressure value error at most \(E\). Its \(\xi\) derivative is also covered by \(2^{71}Q^{-45}\). C99 transfers these improved value bounds through the unchanged moment compensation.

**OPEN**. The checked source #117047 integrals retain the exact original solution and its original moment constraints. The complete ordinary compensated stress still needs quantitative derivative transfer through the taper, bump and outer leading histories. The finite coherent field approximation solves the pressure relation, while the angular and axial momentum residuals retain their higher Picard tails. Final jets and higher recursions remain open.

## Replay

    $p = 'work/goal-next'
    $d = "$p/continuation100/y/final"
    $r = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    $n = "$p/hosted-43055678022-N4/original-whole-k-current-pressure-graph"
    node "$d/replay_n1_radial_seams.mjs" $r "$n/original-source-functions.json" "$p/continuation99/y/final" "$d/operands-repeat.json"
    python -B "$d/check_n1_radial_seams.py" "$d/operands-repeat.json" "$p/continuation98/y/final" "$p/continuation99/y/final" "$d/receipt-repeat.json"
