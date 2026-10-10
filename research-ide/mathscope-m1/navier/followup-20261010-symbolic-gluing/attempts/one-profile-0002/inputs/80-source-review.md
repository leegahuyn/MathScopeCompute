# Independent review of the final continuation and source derivative bounds

## Result and exact reviewed inputs

The finite derivative argument has no blocking defect identified in this
review. The independent program `verify_source_derivative_bounds.py`
completed with actual exit code zero and **179/179 checks passed** in
`source-derivative-review-001.json`. All examined proof, producer, and
certificate bytes, as well as the independent verifier, are copied in
`source-derivative-review-001.inputs/`. The final mathematical inputs are:

| Input | SHA-256 |
| --- | --- |
| Actual axis certificate | `32f59e314e04d71bd7d47cf1bf3d1208e98b6549240875b7e2e2740c63ba2605` |
| Same-profile continuation/debt certificate | `819440fca3698cffc9752226c563a826f9cf7728139dddde405ddb82f3c0b9bd` |
| Global source derivative certificate | `bf9ca2766ad0ec90aa055becccc07b7ad882c71928e51c71529543c9d94efb4f` |
| New B.8 continuous operator certificate | `0a2c375dfdd09d7aa90a0275a8697eb3eb073bf4a9b81e1f862af2ba8ed20f07` |

The one member under discussion has `j=h^4`, `mu=h^2`,
`Bref=Q^300`, `C=(1+Q^300)^10 exp(Q^200)`, and
`t1=kappa0=omega1=omega2=C^-120`. The new source bound is the exact
positive expression `S=C^100000`. These constants are attached to the
same Picard solution, reference/actual continuations, five-moment root,
and A.21 datum. No small positive exponential is replaced by zero.

The program is independent of the producer modules. In particular it
reconstructs the higher derivative table by *finite Taylor expansions*
of reciprocals, logarithms, and exponentials. It does not reuse the
producer's ordinary-derivative Bell or reciprocal recursion. Every
input hash is checked against the consuming certificate, and the program
checks that the input bytes remain unchanged during the audit.

## Higher reference derivatives and the same B.8 root

The actual coefficient-space evaluation formula gives the needed
eta derivatives through order five and all mixed logarithmic-radius/eta
derivatives through total order eight. The factorial factor is
`(m+k)!/(m+1)^2`, with `rho^-m`, not an unweighted analytic sup norm.
The independent Stirling expansion of `(Y dY)^r` reproduces all 45
displayed coefficients. The resulting upper bounds `Q^7` for the
eta-order-five input and `Q^10` for the mixed-order-eight input are valid.

For the higher eta table, the finite Taylor expansion gives the same
positive polynomials as the producer for `log Phi`, logarithmic slope,
the actual B.22 factor, radial ratios, pressure-carrying field derivatives,
the literal sources, and the integrated reference stock. The short B.22
integral is essential: its eta-order-five logarithmic change is bounded
by `Q^-157`. It is not legitimate to exponentiate an unrelated `Q^64`
bound and infer a polynomial field bound. The displayed integral avoids
that error, giving `Rr_eta^m<Q^8` and radial-ratio derivatives through
order four below `Q^260`.

The extra pressure input needed by the fourth source derivative is also
available from the same A.21 strip bound. Explicitly, for `m<=5`,
`|P^(m)| <= 5 K m! 32^m`; its largest fixed coefficient is below
`2^260`. Hence the looser `Q^3` pressure entry used in the source table
is valid. The forward correction uses the actual regular integral
`integral F^2 dX`. The exponential reserve is still sufficient because
`2048-425>1000`. This is a bound on a continuous integral and its
derivatives, rather than pointwise quadrature evidence.

The actual drift through eta order four is bounded by
`(2j,j,j,j,j)`. Independently differentiating its product with
`(1+eta^2)/Pstar` and its square with
`(1+eta^2)^2/Pstar^2` gives exactly

| Transformed term | Ordinary derivative coefficients, orders 0–4 |
| --- | --- |
| `(Gi-4eta)/K` | `(4,6,10,14,22) j` |
| `(Gi-4eta)^2/K^2` | `(16,48,152,472,1448) j^2` |

The second energy row has the exact cancellation
`U^2-c^2-2c(U-c)=(U-c)^2`. Both new exact preconditioner norms are
below `2^40`. Division by the same `mu=h^2`, together with the actual
early error `h^3`, therefore gives incoming derivatives below `1e-8`
through eta order four.

The normalized matrices and quadratic tensors are independent of eta.
This is why differentiating their implicit equations introduces no
uncontrolled derivative of a matrix. In the E equation the two terms
containing `E0 Em` are absorbed in the same derivative inverse bounded
by `1/(1-qE)`; the remaining quadratic partitions have the ordinary
binomial coefficients. Independent Taylor-coefficient convolution,
followed by multiplication by `m!`, reproduces the stored bounds for
the same root. All its derivatives of orders 1–4 are strictly below
`1e-6`. These are derivatives of the unique branch supplied by the
continuous B.8 contraction, not separate choices at different eta.

## Radial width losses and the complete source

The narrow radial transitions require a graded estimate. For a positive
radial order `r`, the defining B.22 equations lose at most `t1^-(r-1)`;
the eta-only derivatives use the short-integral bounds. In a product
with radial orders `ri` totaling `r>0`,

`sum max(ri-1,0) = r - #{i:ri>0} <= r-1`.

Thus a finite Bell polynomial does not multiply the worst width loss by
the number of its factors. The reference field estimate `Q^900`, the
source estimate `Q^1000 t1^-r`, and the B.25 stock derivative exponents
`400,1003,1115,1227` follow with the stated fixed coefficients. The
independent audit evaluates the Bell polynomials and this ODE exponent
recurrence directly.

The literal B.26 controls were compared with the complete supplied
paper, equations B.26–B.29. On activation,
`kappa=1-(1-kappa0)sigma(y/t1)` is independent of eta. Afterwards it
is the constant `kappa0`. The final axial cutoff and convex interpolation
use factors of radius only and the actual reference stock. Consequently
there is no hidden derivative of a freely chosen eta-dependent kappa.
The same graded bound yields `Q^4000 t1^-(r-1)` for the relevant
logarithmic controls and `Q^20000 t1^-3<C^362` for the field through
total order four. In these Bell estimates the value of E is retained
as its separately proved positive small value; `|log E|` is not
exponentiated as an upper bound for every derivative.

The B.34 shift has width at least one, its endpoint eta derivatives
through order four are controlled by the higher reference calculation,
and its exponential remains small. The B.8 correction uses the same
fourth-order root just checked. Its bumps are supported in the fixed
rescaled intervals of width `1/4096`, with `x d_x` controlled by the
finite Stirling expansion. The remaining outer stages before I1 use
only fixed-width or T-scaled cutoffs and the explicit factor
`f=(1+eta^2)^-1`. They introduce no free implicit amplitude root on this
part of the radius. These facts justify `[E]_4,[U]_4<C^1000` on J.

The lower bounds are attached to the actual stages. The inner reference
has `g>C^-2`, `Rr>=1/4`, and `sqrt(2X)>C^-1/2`; the actual bounded
logarithmic changes retain `E>C^-3`. On the shift E increases. On the
outer part through I1 its logarithm is larger than `-30001T`, while
`log Q>=64020T` and `log C>=Q^200`. The B.8 correction preserves its
positive lower bound. Similarly B.26 has
`a=kappa p1,r >= C^-120/(4 Lambda)>C^-122`, and the later stages
preserve a stronger bound. The radial range `C^-1<X<C^12` follows from
the displayed exact coordinates; the pressure at zero is handled by
its regular factor and does not use this away-from-zero bound.

Forward moments use the actual five continuous densities and derivatives
under finite integrals. Positive radial derivatives follow from
`D_y integral_0^X f = X f(X)`. The bound `C^2030` includes the
eta-order-four inputs required by the stock vector's third derivatives.
Reciprocal Taylor expansion gives `[1/E]_3<C^3015` and
`[1/H]_3<C^3050`. A separate positive grouping of the complete original
4.16 formulas, including **`-XWU`** in the axial numerator, gives powers
strictly below `C^8000` for both stock coordinates.

The subsequent table for `a,b,1/a,ts,vs,Pc,Jc` is consistent with the
finite reciprocal/product rules. Its largest ordinary-derivative bound
is `C^29004`. A total-order-three jet in two variables contains ten
terms before factorial normalization; multiplying by ten is still
strictly below `S=C^100000`. This observation explicitly connects the
maximum-derivative convention in the source note to the sum convention
in the loop input contract.

## Audit boundary

This review accepts the written source-derivative argument and its exact
finite arithmetic for the specified profile. Its independent record
does not supply the separate continuous lower bounds for all relaxed
cone gaps, the modulation proof, final heat/stress endpoint conclusions,
or the original Lean analytic proof terms. The global source certificate
correctly keeps these obligations separate. The later C.12/loop
construction must consume this same source and its actual lower margins.

The original axis monomial/Cauchy audit was also repeated against the
final axis bytes: `axis-fraction-review-002.json` is **48/48 PASS**.
Earlier receipts are retained as historical observations of their
earlier input hashes, rather than silently relabeled as current.
