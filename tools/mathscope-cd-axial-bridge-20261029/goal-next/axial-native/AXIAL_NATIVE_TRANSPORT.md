# Native domains of the original positive axial stress

## Verified replay

The unmodified original producer ran through orders 1, 2 and 3.
Its first 117,100 nodes match the independently authenticated source
prefix. The exact source support proof binds the radial order

$$
0<X_a<X_-<X_{\rm keep}<X_{\rm cut}<a^2<1
<I_{\rm pos,left}<X_{\rm lastU}<I_{\rm pos,right}<X_v<X_+<X_b.
$$

The last mass-bump endpoint lies strictly inside the reserved positive
interval. Its normalized squared radius is greater than one and less
than sixteen, and the interval ends at $I_{\rm pos,left}e^5$.
The original geometry includes the definitions and exact inequalities
for the other endpoints. Each endpoint is independent of $\eta$.

The checker opens each reached shared expression with a separate formal
environment populated by the ranges of its actual arguments. Literal
integral endpoints are evaluated in the outer environment. The integral
body has a new bound coordinate with the closed hull of those endpoints.
The checker refines the active coordinate of each lazy radial branch
by its own actual guards. It uses closed hulls at joins, which give
conservative domain bounds for the native inputs. The branches discarded
as disjoint lie outside those hulls.

The checker visits Picard and even-profile calls, the integral binders
that can reach those calls, and the original system coefficient bodies.
The other leading primitives enter through their previously established
source semantics. The replay also checks that the leading quadratic and
monotone registry bodies contain no hidden Picard call. For every
reached Picard native, the replay checks the corresponding radial
interval, the independently tagged $\eta$ argument, and the lower-order
recursion edge when reading a newly generated source system.

| Order | Axial density | Original forward | Original backward | Whole |
| --- | ---: | ---: | ---: | ---: |
| 1 | 117047 | 117057 | 117066 | 117075 |
| 2 | 120791 | 120804 | 120818 | Same original forward density with upper endpoint Xplus |
| 3 | 123841 | 123854 | 123868 | Same original forward density with upper endpoint Xplus |

The replay checks value, $\eta$ derivative and mixed $X,\eta$
derivative of the original stress under the branch conditions. It
also checks the actual radial derivative and even-X integral
materializers on their original core domains. The actual forcing edges
are empty at order one, lead to order one at order two, and lead
to orders one and two at order three. For each order the finite
endpoint checks apply the exact jets
$(0,0),(0,1),(0,2),(1,0),(1,1),(2,0)$ at both $X_-$ and $X_+$,
with formal $\eta$ and with each literal value $\eta=\pm1$.

## Original export and exact formal-to-actual substitution

Independent Python streamed and authenticated all 4,420,257 nodes and
the complete registry. Original expression 1 has body `#117047`;
original expression 672, named `ActualAllFiniteOrderOneStress_z`,
has body `#117069`. Both formal lists are `[X#4756, eta#2]`.
The original literal integrands are expression 1 applied to the
following actual operands:

| Primitive | Integral | Fresh binder | Actual operands | Outer endpoints |
| --- | ---: | ---: | --- | --- |
| Forward | 117057 | 117055 | [117055, 2] | [28814, 4756] |
| Backward | 117066 | 117064 | [117064, 2] | [4756, 28824] |
| Whole | 117075 | 117073 | [117073, 2] | [28814, 28824] |

In particular the raw density's piecewise switch is on the
integration coordinate when the integral is evaluated. It is not
the caller's unbound $X$. At either fixed endpoint, the substitution
acts on this integration coordinate and selects the literal zero
branch of the density. The original ordinary $\eta$ derivative
has the same zero branches because both thresholds are independent
of $\eta$. The forward radial FTC endpoint copy uses the actual
upper endpoint $X$ and lies in the same certified closed binder hull.

The stream also records 157 direct descriptors for exported function
672. Of those, 108 have at least one direct coordinate named
capture_free_argument by the substitution machinery. This is a
descriptor census without a reachability inference. Exactly 24
have the literal radial input $X_-$ and six of
those have literal $\eta=-1$ (node 20). Their derivative orders
are the six endpoint jets replayed above. All six literal physical
corner applications therefore bind to the source's zero jets under
the earlier smooth-gluing theorem. Other actual arguments and the
surrounding physical chart or finite-face guards require their own
application proof.

## Structural induction on the original generator

For arbitrary fixed $n$, take the pinned source geometry, the leading
primitive contracts, and the earlier local Picard and flat-join
semantics. The following rules transport the actual radial and
parameter domains through the original source construction.

1. For the signed stress, the active branch requires $X_-<X<X_+$.
   The forward and backward intervals and the whole interval are
   contained in $[X_-,X_+]$. For each binder value $s$ in that interval
   the density's formals receive $(s,\eta)$ simultaneously. The
   primitive denominator is $\sqrt{2X}>0$ on the active branch.
   At and outside either edge the source stress selects its zero branch.
2. The current positive U and F contain their original radial cutoff
   local profiles and reserved-interval repairs. Before and during the
   local cutoff only $0\le X\le X_{\rm cut}<a^2$ reaches the raw
   Picard profiles. Outside that cutoff the local branch is zero.
   The repair coefficients depend on $\eta$ and their retained complete
   local moments use literal intervals $[0,X_{\rm cut}]$. A lower
   pressure or flux moment has literal interval $[0,X_+]$ and uses
   already finalized lower profiles. Such an interval is permitted by
   those profiles' own branch contracts. It gives no extra domain to
   any raw Picard term.
3. The original raw average and raw pressure are selected only in
   their core branches. The average in a middle branch uses the
   original mass primitive divided by positive $X$, bounded away
   from zero by $X_{\rm keep}$. The inner pressure-source
   $\Omega/X$ representative is guarded by $a^2$ at general order
   and uses only already constructed cutoff-local tuples. Its global
   representative uses finalized lower fields on their full
   domains. The original first-order pressure and leading moments
   use their separately bound original stream and $X_v$ cutoff.
4. In each lower cutoff-local average use $0\le t\le1$ and the
   actual operand $tX$ from its literal integral. Thus
   $0\le tX\le X$. In each original regularized Picard derivative
   the operand is $t\xi$ or $\sqrt X\prod_j t_j$. It remains in
   $[0,a]$ for a native admitted on $[0,a^2]$ or $[0,a]$.
   The other formal operand is unchanged $\eta$ throughout.
   Source-system definitions themselves are evaluated with
   $X=\xi^2$ for $0\le\xi\le a$. Their raw forcing edges go only
   to lower orders, as follows from the explicit source loop.
5. Differentiating a shared expression differentiates its body
   at the formal coordinates and then applies the actual arguments.
   The original chain rule gives the corresponding actual
   coordinate derivatives. Branch derivatives retain the same
   radial guards, using the previously proved matching fixed jets.
   Fixed-endpoint differentiation keeps the same binder interval.
   A Leibniz endpoint copy substitutes a member of the previously
   proved closed hull. The $\eta$ endpoint convention is the
   ordinary one-sided limit from $[-1,1]$.

These rules establish the transport implication for every fixed
order produced by the same formulas. The induction has a separate
n=1 leading-source input, and the higher-order constructor only
references earlier source systems. The finite execution witnesses
orders 1–3 and the indicated derivative materializations. A
finite code budget remains in force.

## Scope controls and open applications

The diagnostic creates an original order-two raw Picard profile
descriptor with radial argument $X_+>a^2$. The checker rejects it.
It separately rejects a literal integral from $X_-$ to $X_+$ whose
body sends its own binder directly to that Picard profile. The second
rejection still occurs when the caller's unrelated outer $X$ has
a valid core bound. A third control substitutes $X_+$ as the actual
$\eta$ operand and is rejected independently of the radial bound.

The result covers the original Lemma 5.2 axial producer's Picard
calls and their transitive integration scope under its source
contracts. Applications from the complete first-FiveMap export
with nonliteral physical arguments still require an independent
proof of their actual radial and parameter chart conditions.
The full finite-face integral environment, physical infinite cutoff,
and final gauge jets have separate obligations. No gate count or
release decision is promoted by this evidence.

Reproduce from the shared workspace root:

    node --max-old-space-size=4096 work/goal-next/axial-native/check_native_domains.mjs work/goal-next/axial-native/native-domains.json
    python work/goal-next/axial-native/check_export_binding.py work/delivery-20261110/inputs/graph work/goal-next/axial-native/export-binding.json

