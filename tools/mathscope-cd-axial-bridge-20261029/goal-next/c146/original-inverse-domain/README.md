# Original first-FiveMap Y call frames and inverse admission

## Verified source readback

The replay authenticates the original 4,420,257-node first-FiveMap stream,
its native registry, the exact 11-root closure and all 159,655 retained
source nodes. It follows 706,824 lexical node states, checking the original
29,484 guarded relative-row records. It uses no active N3 graph or
explicit N1 evaluation-point fixture.

The four conditional real radial range inputs are `#4758` (Phi),
`#4784` (u), `#5177` (average) and `#5299` (one eta derivative
of average). Each reads `#4757 = #3454 * #4756 = Lambda * X`.
Fourteen exact native calls bind their formal radial coordinate to the
two original aliases. The last column records the distinct slow point
kinds in which each call is actually reached, independent of whether
the caller has established that point's domain.

| Call IDs | Radial alias | Reached slow point kinds |
| --- | --- | --- |
| 622900, 622910, 623780, 623787 | 622824 | Reference, own, own with saved reference |
| 622920, 633873, 633970 | 622824 | Reference, own with saved reference |
| 622930 | 622824 | Reference |
| 622941, 622949 | 622824 | Frozen representative by direct operands and by reconstructed image |
| 634082, 634101, 634163, 634184 | 634081 | Own with saved reference, inside radial integral |

`#622824 = R²/(2s)` and `#634081 = r_integral²/(2s)` retain the
same native denominator with `s = #622820`. The radial integral
rebinds its radial coordinate and keeps its slow axial and time inputs.
The frozen representative uses the **same** system with
`s_rep = #623935` and actual arguments `#623921, #623934`.
It is reached only after the original own row has passed its guards.
The reconstructed image pair is `#622958, #622962`. The direct
representative pair is `#625946, #625947`. The replay distinguishes
both from the ordinary own calls and from the saved reference return.

The top-level reference is different. The original physical pressure
`#4419702` and four derivative or residual entry roots
`#4420035, #4420039, #4420249, #4420253` require the inverse before
entering row bodies. In particular, the pressure path queries
`#622820` through the actual cutoff derivative `#633733`.
This path needs the inverse even to evaluate the cutoff's input.

## The exact free-reference condition

The native inverse has formal input pair `#622803, #622804` and evaluates

\[
 F(v)=v-Z^2v^{2h}-T
\]

on its registered interval $[1/2,2]$. For physical $T\ge0$, its required
endpoint signs are exactly

\[
 Z^2\,2^{-2h}+T\ge\tfrac12,
 \qquad
 Z^2\,2^{2h}+T\le2 .
\]

For these signs the upper inequality gives
$Z^2\le2^{1-2h}$. On the whole bracket,
$v^{2h-1}\le2^{1-2h}<2$. Thus the actual $0<h<1/16$ gives
$1/2<1-8h\le F'(v)\le1$ there. The signs consequently provide both
root existence and the native derivative bounds. Equivalently, an
already admitted physical reference gives
$Z=s^D\eta$, $T=s(1-\eta^2)$, $1/2\le s\le2$ and
$|\eta|\le1$. The original exponent relation $2D+2h=1$ makes
$F(s)=0$ and implies the endpoint signs by the same monotonicity.
The raw first-FiveMap export receives the reference label and
coordinates as free inputs. The guard formulas below consume their
inverse. They do not choose the external reference.

An explicit physical ingress can instead solve the reference-free positive
equation $q-z^2q^{2h}=\tau$ for $\tau\ge0$ and $(z,\tau)\ne(0,0)$.
Every positive root lies where $q^{1-2h}\ge z^2$, on which the derivative
of the left side is at least $1-2h>0$. The left side starts at zero at the
lower end of that domain and increases without bound. For $z=0$, the
positive root is $q=\tau$. If the physical logarithmic coordinate
$t={-\log_2 q}$ lies in $[L-1/4,U+1/4]$, the integer
$\lfloor t+1/2\rfloor$ lies in the original window and supplies
$1/2<s<2$ at this same physical point. This proves a sufficient
external selection predicate and does not install one in the export.

## Why internal own and representative endpoints are conditional consequences

Assume an admitted original reference and a strict original relative-band,
shell and mesh guard. The own normalized arguments obey
$Z'=r^DZ$, $T'=rT$ with $r=Q_{ref}/Q_{own}$. Put $s'=rs$.
The actual original band guard is
$|{-\log_2 q}-\ell_{own}|<3/4$, so
$2^{-3/4}<s'=q/Q_{own}<2^{3/4}$.
The exact relation $2D+2h=1$ sends the original zero equation to
$F_{own}(s')=rF_{ref}(s)=0$. This is an interior bracket root. The
saved-reference return divides out these same powers, recovering
the admitted pair with no new endpoint premise. The registered
ordered substitutions and row guards are checked in the replay.

For the actual frozen representative, write the selected mesh intervals
$[R_l,R_u]$, $[Z_l,Z_u]$, $[T_l,T_u]$ and use the actual shell
$X_a<X<X_b$. The physical $R>0$ and interior own point give

\[
 s_l=\max(1/2,\max(0,R_l)^2/(2X_b))
   <s'<s_u=\min(2,R_u^2/(2X_a)).
\]

An admitted own point implies $s_l<s_u$, so the producer's
positive extension for empty intervals leaves these endpoints intact.
Let $T_l^+=\max(0,T_l)$. Since $s\mapsto s-Z^2s^{2h}$ is increasing
on the bracket, the actual input of that mesh cell witnesses the two
strict projected inequalities

\[
 \frac{s_l-T_u}{s_l^{2h}}<Z^2<
 \frac{s_u-T_l^+}{s_u^{2h}} .
\]

They are strict also when the actual time is zero. The active open time
cell then has $T_u>0$, and increasing from the actual zero time makes
the upper condition strict. Intersecting the resulting axial region
with the original open axial cell gives a nonempty open subset. The
actual sign split drops at most the single point $Z=0$, so one of its
intervals has positive width. The native midpoint lies in it.
Its upper bound on $Z_{rep}^2$ gives the same monotonicity on $[1/2,2]$.
The projected strict signs force the time interval

\[
 (T_l^+,T_u)\cap
 (s_l-Z_{rep}^2s_l^{2h},\ s_u-Z_{rep}^2s_u^{2h})
\]

to have positive width. The native time midpoint is inside, so
$T_{rep}>0$ and the two signs hold strictly at $s_l,s_u$, hence on
the native bracket. The representative's root
$s_{rep}\in(s_l,s_u)$ yields $|\eta_{rep}|<1$ and the radial midpoint
remains in the same shell and mesh cell. Both subsequent native
image expressions therefore recover this same bracket root.

It follows that there is no additional frozen-root bracket debt once
the original reference and positive own guard are admitted. This
argument concerns the root image itself. Other physical cutoffs or
whole-field derivative bounds need their own premises.

## Positive-time countercontrols to automatic reference admission

Let $L=\#622785$ and $U=\#622790$. The original selector has
$L\ge\ell_0+4$, $U\ge L+3$, and $b_2\ge16b_1\ge2^{L+4}$.
Choose its **actual integer reference slot** $\ell=L+2$, so
$Q_\ell/q_\star\le1/4$ and $b_2Q_\ell\ge4$.
Take $Z=0$ and either $T=15/32$ or $T=5/2$. Both choices
give a physical positive time $q=\tau=Q_\ell T$, satisfy
$q<q_\star$ and $b_2q>1$, and permit any positive $X$ strictly
in the original shell by choosing $R=\sqrt{2TX}$.

For $T=15/32$, the physical logarithmic band coordinate
$t={-\log_2 q}$ satisfies $L+3<t<L+13/4$, since $(16/15)^4<2$.
For $T=5/2$, that coordinate lies between $L$ and $L+1$.
Both ranges keep every relative label that can pass the strict
$3/4$ band guard within $[L,U]$. Nevertheless $F(v)=v-T$.
The first tuple fails the lower endpoint sign by $F(1/2)=1/32$,
and the second fails the upper one by $F(2)=-1/2$. These are
countercontrols to deriving reference admission from the physical
time, shell and window inequalities alone. They do not satisfy the
required reference image predicate, and no actual field value is
asserted for an inverse outside its bracket.

**VERIFIED** for the exact original call/frame readback and these
countercontrols. **CONDITIONAL** for the 523/523 real radial range
after an explicit original-reference admission. The unbound radial
result remains 519/523. The separate numeric Y ledger remains
`33/523`. Automatic attachment to the external first-FiveMap entry
and final jets remain open. RELEASE HOLD.

Run from the workspace root:

    python -B work/goal-next/continuation146/original-inverse-domain/replay_original_inverse_contexts.py
