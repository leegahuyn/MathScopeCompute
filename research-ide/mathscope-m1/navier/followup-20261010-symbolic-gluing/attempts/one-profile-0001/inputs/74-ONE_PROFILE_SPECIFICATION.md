# One source, one parameter hierarchy, one leading-profile construction

## 1. Scope and source identity

This specification joins the new outer field, the actual A.21 datum, the
unique infinite axis solution, the actual B.8 correction, A.7 heat
compensation and C.12 modulation. It uses the supplied 166-page source
paper with SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The original Lean source is fixed to
`f9e8bc5b38b6e212696e8a30e3e91517af887bbd`, Lean 4.34.0-rc2.

The target is the leading profile and annular stress of Theorem 4.6.
It is not a claim to reconstruct the complete time-dependent solution,
to remove the forcing, or to extend smooth velocity through time one.
Those scopes remain unchanged from the original acceptance contract.

An assembly receipt must attach the actual same-source input evidence
listed below before it can use the resulting finite N and cone bound.
This file does not turn the remaining Lean analytic-premise work into
a completed formal proof. Numeric, written analytic, and kernel evidence
retain separate fields in the receipt.

## 2. Complete finite selection order

All exponentials and powers below denote finite exact real expressions.
Positive small values retain their exact expression even when a numerical
enclosure has lower endpoint zero. The frequency is an exact integer
expression; it is not rounded to a machine integer.

| Stage | Exact choices |
| --- | --- |
| Outer scale | `Md=2^20`, `T=exp(Md)+10`, `Pstar=exp(2T)` |
| Exponents | `lambda=exp(-1000T)`, `h=exp(-8002T)`, `co=1/256`, `Tf=128` |
| Matching | `epsilonMoment=h^3`, `j0=h^4`, `muMoment=h^2` |
| Axis separation | `deltaStar=j0/10`, `sigmaStar=j0/2000`, `rho=sigmaStar^2/65536` |
| Infinite axis | `Q=2^260 Pstar^2/sigmaStar^2`, `Lambda=Q^64` |
| Reference and shift | `BRefUpper=Q^300`, `Bk=Q^80`, `Tsh=Q^90` |
| One final amplitude and radius | `C=(1+Q^300)^10 exp(Q^200)`, `XR=110(C Pstar)^10` |
| One width choice | `t1=kappa0=omega1=omega2=C^-120` |
| Actual source bound | `S=C^100000`, from the full source derivative table |
| Original C.1 loop | `d0=1/(8S)`, `muLoopMax=S^12`, `deltaLoop=exp(-S^16)` |
| C.12 envelope | `R=exp(S^256)` |
| Final frequency and margin | `N=1+ceil(R^50)`, `kappa=R^-10` |

The full parameter tree also records the complex radius, `Caxis`, the
reference comparison constants, the early-amplitude bound and every
support endpoint. It verifies that references are acyclic and that
shared expressions agree exactly. None of `C`, `t1`, `S`, `R` or `N`
is defined by an unevaluated supremum or an unproved "large enough"
instruction. The finite derivative tables and their analytic derivations
supply their inequalities.

Increasing C does not leave the old nonlinear axis fixed point unchanged.
Here C is selected once within the proved uniform family, after the
shift length. Every downstream object uses that one newly selected limit.
The old `Md=1, logP=14` datum and its finite arrays are not inputs.

## 3. Exact field construction

1. Use the literal A.2 outer schedule with the new outer choices. The
   two angular coefficients are the unique small roots of their exact
   continuous angular-reset and zero-pressure equations. The terminal
   wait is the exact positive logarithmic selector in A.13. The pulse
   amplitude is the unique root in `[9/10,6/5]` of its exact total-energy
   equation after the two linear M/J corrections. These choices fix the
   actual outer E and U; they do not depend on a pressure approximation.
2. Define `Pi0` by the complete integral A.21, omitting only the exactly
   pressure-neutral angular bumps. The resulting analytic function is
   the pressure datum for every stage. The validated approximation
   `Pi0/Pstar^2=-cP/(1+eta^2)^2+error` retains its actual analytic error;
   it is an evaluator for this datum, not its definition.
3. Form the literal B.1 source polynomials from `Ustar=4eta+j0`, h and
   this Pi0. In the original complete coefficient space use the full
   natural remainder, the convergent resolvent and the contraction with
   `Lambda=Q^64`, `g=exp(Lambda psi)/C`. The unique Picard limit is the
   axis function. Recover E, U, Pi and V0 from this same limit by the
   formulas proved in `SAME_DATUM_ANALYTIC_AXIS.md`.
4. Continue by B.22 and B.26 using the fixed widths. Apply the exact
   B.34 shift of length Tsh. Restore the axial function on
   `-8<log(X/XR)<-7`. On the B.8 patch solve the freshly enclosed
   five-bump quadratic equations with scale `muMoment=h^2`. The actual
   incoming debt and its parameter derivatives are bounded before
   this solution is invoked. Matching the five moments gives exact
   equality with the prescribed outer field beyond the patch.
5. Replace the far power law by the actual heat exterior A.7, using
   the prescribed terminal cutoff. Solve the new continuous C.2
   E-only correction on I2 for its three nonzero moment debts. M and
   J remain identically zero. All five convergent moment differences
   and the pressure datum are restored exactly.
6. Construct the original C.1 loop for the actual premodulation states,
   with the choices in the table. Use its actual zero-mean primitives
   A and B in `E_N=E exp(A(X,eta,N log X)/N)` and
   `U_N=U+B(X,eta,N log X)/N`. The same continuous C.2 map on I1
   restores the five modulation moments. Its input is the proved
   continuous `O(1/N)` debt, including the `lambda^-2` second row.
7. Define final pressure forward from Pi0, and final V0, Qs, Ns and
   stress from the exact cumulative integrals of the final fields.
   Equality of the five restored moments invokes Lemma 4.4 at each
   join. The final stress therefore uses these fields, rather than
   the stress of an earlier uncorrected profile.

The two finite-dimensional root types are unambiguous: their continuous
preconditioned maps are strict contractions in the recorded small boxes,
uniformly in every eta in `[-1,1]`. The heat and modulation corrections
have separate supports and separate debts, although they use the same
validated C.2 operator shape.

## 4. Exact supports and reserved patches

Set `B=1000T`, `Xa=4/Lambda` and `Xc=XR exp(T+2)`.
For a patch offset b write `X0(b)=Xc exp(60B-b)`.

| Object | Exact interval or definition |
| --- | --- |
| Left end of the source envelope J | `Xan=Xa exp(t1/16)` |
| Left end of the loop interval I | `Xa exp(t1/8)` |
| Preserved inner constant-loop collar | Through `Xa exp(t1/4)` |
| Right end of I | `XR exp(T+3)=Xc exp(1)` |
| Right constant-loop collar | `Xc exp([1/2,1])` |
| Right end of J | `16 X0(25)` |
| I1, modulation restoration | `X0(25)<X<X0(25) exp(5)` |
| I2, heat compensation | `X0(20)<X<X0(20) exp(5)` |
| Ipos, reserved | `X0(14)<X<X0(14) exp(5)` |
| Imean, reserved | `X0(8)<X<X0(8) exp(5)` |
| C.2 bump supports within a used patch | `9..9.5`, `10..10.5`, `11..11.5`, `12..12.5`, `13..13.5` in `X/X0(b)` |
| B.8 patch | `exp(-6)<X/XR<exp(-5)` |
| B.8 bump supports | `[n/2048,(2n+1)/4096]`, `n=6,7,8,9,10` |
| Outer annulus endpoint | `Xb=Xtail exp(3)`, with Xtail given by the exact A.13 wait |

I1 and I2 share only the boundary of their open reserved intervals;
their compact bump supports are strictly separated. Ipos and Imean
remain the unmodified power law after all present operations. The
entire loop interval ends before I1. On the right loop collar
`U=b=0`, `a=v=2+2lambda`, while `deltaLoop<lambda`, so the loop is
exactly constant there. On the inner collar `v>=2.1` and
`deltaLoop<.1` give the same conclusion. Thus A and B vanish
exactly on both collars and outside the loop interval.

## 5. The quantitative implications after input attachment

The source bound controls all actual functions through the required
mixed log-radius/eta orders. The separate preloop margin ledger must
establish the four relaxed gaps and both boundary-collar gaps on this
same field. `LOOP_DERIVATIVE_ENVELOPE.md` then bounds the complete
implicit loop and its circle reparametrization, including both zero
denominators treated by their smooth integral extensions.

With the resulting R, `C12_FREQUENCY_CONTRACT.md` gives a continuous
field change at most `4R^2/N`, a distinct order-one radial derivative
change, and preconditioned modulation debt at most `R^14/N` in the
factorial C_eta^2 norm. The repair stays on the same small root branch.
The four final raw gaps on J are at least `1/(2R)`; the one closed-annulus
directional margin is `kappa=R^-10`, using the preserved outer and
inner margin bounds as well.

The global stress argument uses exactly

\[
 \zeta(X)=\exp\left(-\frac{t_1^2}{\log^2(X/X_a)}
                    -\frac4{\log^2(X_b/X)}\right)
\]

inside `(Xa,Xb)`, with zero extension. After its inputs are attached,
the stress is zero outside that annulus, nonzero inside, and satisfies
`|T0|>=min(C^-11,R^-8) zeta`. The two factorizations give the edge
directions by limits, without evaluating `T0/|T0|` at a zero endpoint.

## 6. Evidence levels and the remaining formal connection

The assembly must distinguish the complete written analytic construction,
executed continuous interval enclosures, finite scalar audits, evaluated
core arrays and actual Lean kernel receipts. An exact expression graph
is not a completed numerical evaluation, and a scalar checker is not a
kernel proof of its analytic derivation.

The new core intervals evaluate the same infinite profile at eta zero,
with radial derivatives and one parameter derivative. The all-eta
analytic bounds and symbolic recurrence identify the mathematical
functions, but the entire nonlinear eta-jet graph and every original
Lean analytic premise have not yet been evaluated or instantiated.
The original N3-03 formal-connection requirement remains explicit.
Independent protected Comparator completion is also a separate N1-06
requirement. No assembly hash or successful packaging run can replace
either result.
