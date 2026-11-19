# Actual order-one axial stress cutoff collars

**Verified in the finite source.** The replay authenticates the legacy
`ActualAllFiniteOrderOneStress_z` #672 registry and unchanged 117,100-node
original source prefix. Raw axial residual #117045 is the active branch
of the supported density #117047. The actual three literal integrals
#117057, #117066 and #117075 bind their own radius and keep the live
parameter `eta` fixed. Their source parameter derivative keeps both
endpoints and substitutes native expression 1 with orders `[0,1]` in
the original binder frame. Their source radial derivatives are,
respectively, the density at the actual caller radius, its negative,
and zero. The source replay treats every literal integral as opaque
when reducing radial case branches.

## Strict zero collars in the ordinary mathematical source

Use the original strict radial ordering

```text
0 < Xminus #28814 < Xkeep #28819 < Xcut #28823 < a² #24805
  < IposRight #28988 < Xv #3293 < Xplus #28824,
lastU #29328 < IposRight.
```

The original support proof includes the intermediate patch start, all
five bump ends and independence of the endpoints from eta. The collars
are strictly wider than the endpoint singletons.

**Conditional left collar.** For \(0<X<X_{\mathrm{keep}}\), source
U1 #29289 routes to the original raw Picard U1, Pi1 #50558 to the
original raw Picard pressure, and M1/X #29336 to the regular original
average \(\int_0^1 U_{1,\mathrm{raw}}(sX,\eta)\,ds\). The binder
uses \(0\le sX\le X<a^2\), so the primitive stays in the core domain.
Original same-source core agreement supplies the leading U0 and v0.
If the actual ordinary Picard ODE/PDE, leading restriction, native
average and primitive jets have their previously stated real
denotations, the unswitched raw residual vanishes across Xminus on
this entire strict interval. The original local-profile cutoff equals one there.
These are finite source branch checks and an ordinary consequence of
the core equations. The replay does not establish a convergent
Picard solution or ordinary mixed-jet commutation by graph comparison.

**Conditional right collar.** When \(X_v<X<X_+\), the leading
U0 #9236 and v0 #18778, the current U1 #29289, and both M1 #29334
and M1/X #29336 reduce to literal zero. The same applies to v1 #29440,
which uses U1 and the average (and its parameter derivative). This
uses literal exterior branches and does not substitute moment 1.
Moment 1 is still needed globally to identify M1 as the ordinary
primitive of U1 and to remove the current axial mass in (5.21).

The pressure case is different. The actual middle pressure branch
#50556 of #50558 saturates all three retained prefixes since Xv exceeds
every cutoff and bump bound. The replay reduces it to the sum

```text
localMoments[2] + correctionMoments[2] - pressureOmega
= incomingMoment[2] + correctionMoment[2]
= #28985 + #71402
= #71416 .
```

These are the same source operands as support repair row 3. The
saturated expression is not the literal zero node. The exact
pressure repair cancels with the original incoming moment bodies
kept as symbolic operands. The replay produces zero numerator
monomials over the retained denominator and binds every denominator
factor to the original positive scales, \(1+\eta^2\) or the
pressure matrix determinant. The continuous determinant bound is
the original independent 3×3 bump-matrix result. Thus row 3
supplies zero as a function of eta on the original real domain
when the native integrals and determinant proof are interpreted
as specified. The negative control drops the correction and fails the
exact rational identity on the retained symbolic operands.
It is a test of the reduction, with no claim about sampled native
values. At Xplus and beyond, the actual Pi1
uses its literal zero branch. Since all these pieces equal zero on
an open neighborhood of Xplus, they need no independent matching
of jets at that radius. For the axial residual the shifted
previous-order viscosity uses U0, which has already ended at Xv.

The replay also clears denominators in **all five** actual order-one
repair residual nodes with the same five original incoming integral
operands. Each reduced rational numerator is zero and each
omitted-correction control fails. This directly checks the original
source matrix application. The ordinary identification of these
operands with the complete physical moment integrals remains
separate, as do real nonzero denominator premises from the
original continuous inverse and positive source scales.

## Value equality, parameter differentiation and outer joining

The above implications give supported density \(r(X,\eta)\) with
support in \([X_{\rm keep},X_v]\). Values of its endpoint derivatives
are then immediate at Xminus and Xplus. Neither strict zero collar
sets any accumulated integral to zero. For an admitted eta define
\(I(\eta)=\int_{X_-}^{X_+}r(X,\eta)\,dX\) in the ordinary real
interpretation. The two implemented primitive formulas on \(X_-<X<X_+\)
are

\[
F=-\frac{\int_{X_-}^{X}r\,dX'}{\sqrt{2X}},\qquad
B=\frac{\int_X^{X_+} r\,dX'}{\sqrt{2X}},\qquad
B-F=\frac{I(\eta)}{\sqrt{2X}} .
\]

On the left collar \(F=0\). On \(X_v<X<X_+\), \(B=0\) and
\(F=-I(\eta)/\sqrt{2X}\). Thus the forward formula itself matches
the implemented exterior zero exactly when \(I(\eta)=0\). A zero
identity for **every** eta makes the forward stress literally zero
through both switches, giving every ordinary mixed jet at those
switches that zero value. No separate seam-jet or differentiation
under the integral argument at the switches is required in this
step. One fixed-eta value equality by itself would not prove eta-jet
agreement.

For the actual derivatives in the transition interior, and for
integrating (5.20)–(5.21), use the following elementary implication.
For any fixed order (k\), take the actual real primitive family
or density (f(s,\eta)) on its fixed interval (J). Suppose its
ordinary eta derivatives through order (k\) exist, with continuous
one-sided values at (\eta=\pm1\), and each derivative is dominated
by an integrable function of (s) independent of eta. Uniform finite
bounds on the bounded interval suffice. The difference quotient for
each preceding derivative is bounded by the envelope for the next
derivative by the mean-value theorem. Dominated convergence therefore
gives the integral of the next derivative, including both inward
endpoint derivatives. Induction gives all orders through (k\). A
radial primitive with variable upper or lower limit uses ordinary
FTC where the interior density is continuous. No moving-boundary
term occurs for the eta derivatives, including the left or right
radial primitive with the caller X held fixed.

**Open source semantics.** To instantiate this for (I=0), the
actual leading and positive primitive jets must satisfy the
pointwise source continuity/pressure laws, the moment operands
must have their proved whole-integral denotations, and the actual
leading mass identity (\int_0^{X_v}U_0=M_0(X_v)-M_0(0)=0) must be
applied. In the integrated moment formula the prior leading mass
requires two eta derivatives, while the current mass and
pressure-flux families require one. For the admitted actual native
first eta derivative of the stress, the density also needs the
corresponding integrable derivative envelope. The finite replay
checks literal AD and scopes; it does not certify these analytic
envelopes or equate the displayed finite Picard sums with the
ordinary mixed jets.

## Relation to n ≥ 2

The executed source node checks are order one. The generated
`completeOrder` construction uses the same support thresholds
for U, F, the stream average, and radial v. For every earlier
positive order these fields are zero on the strict collar by
their literal supports, and the leading radial v0 ends at Xv.
Every term of the original `buildActualOmegaCoefficientOverX`
contains a radial v or a derivative of a radial v, including
the (n=2) prior-viscosity term using v0. Thus the actual lower
pressure density (\sum_{i,j\ge1,\ i+j=n}F_iF_j-\Omega_{n-1}/(2X))
is zero on that collar under ordinary source denotation. The
original lower pressure prefix up to X and its incoming whole
moment up to Xplus now agree there by interval additivity. With
the same saturated bump-prefix formulas, Pi_n in the middle
branch equals the actual pressure repair row 3 of that order,
which is zero as a function of eta under its integral semantics.
Earlier pressure exteriors are not required for this right-collar
implication. The left still requires the actual order-(n) core
and its native Picard convergence and lower source transport.
The prior axial mass for (n\ge2) is the positive order (n-1)
row 1 moment. This is a conditional source-template implication
for each generated (n\), not an executed all-order native claim.

## Reproduce

Run with Node 24, the original `mathscope-m2/navier` runtime
directory, the original 4,420,257-node graph's legacy
`original-source-functions.json`, and a fresh output path.

```text
node --max-old-space-size=3072 replay-axial-collars.mjs ORIGINAL_NAVIER LEGACY_REGISTRY NEW_RECEIPT.json
```

The theorem uses the original real chart \(X>0\) and \(L\ne0\).
No Lean compilation, numerical native-point test, repository mutation,
or promotion of a global gate is part of this replay. RELEASE HOLD.
