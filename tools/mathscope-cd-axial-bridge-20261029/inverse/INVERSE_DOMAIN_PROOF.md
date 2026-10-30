# Original monotone root #622820: exact image criterion and source binders

## Exact source observations

The graph and registry hashes are those recorded in `inverse-calls.json`. The source graph has `#622803 = coordinate(m3_global_band_slow_Z$30436)`, `#622804 = coordinate(m3_global_band_slow_T$30437)`, and `#622820 = actual_monotone_root(2,#622803,#622804)`. Registry monotone system 2 has those two formal parameters, interval [1/2,2], and is named `ActualCommonBandSlowInverse`. Its `endpointProof` string is an assertion, not an evaluated domain proof. At node `#622819` its exact formula is `s - Z^2 exp(2h log(s)) - T`; in the positive interval this is `F(s)=s-Z² s^(2h)-T`.

Expression functions `#688` through `#691` are the slow F,G,b,pressure functions. They bind `[R#622802,Z#622803,T#622804,ell#622791]` and contain the inverse within their bodies. For example `#622932` invokes function #688 with those exact four arguments and no derivatives, and `#623122` invokes it with derivative orders [0,1,0,0]. Full-graph structural inventory sees 1,148, 1,163, 25, and 4 such expression-call nodes for functions #688–691, respectively. These totals include intermediate symbolic substitution nodes and do not assert that every node is reached during physical execution. The argument table in `inverse-calls.json` preserves every distinct ordered tuple and derivative multi-index.

In `research-ide/mathscope-m3/navier/source-global-band.mjs`, `R,Z,T` are freshly introduced; `chartSystem` registers F and the root using `[Z,T]`. It separately documents `slowPointDomain` in metadata. By contrast, `atRep` specifically substitutes `Rrep=sqrt(2*sRep*Xrep)`, `Zrep=sRep^D*etaRep`, and `Trep=sRep*(1-etaRep²)` into representative leading fields. This source construction establishes how representative substitution is intended to work; it does not establish that every generic free slow point or each later partially substituted expression lies in the chart image. Formal arguments cannot be silently identified with concrete native values.

## Endpoint criterion: a mathematical reduction, not a runtime certificate

Let `0<h<1/2`, `D=1/2-h`, `a=1/2`, `b=2`, real Z and `T>=0`. Define `F(s)=s-Z²s^(2h)-T` for s>0. Then the following are equivalent:

1. There exist `s in [a,b]` and `eta in [-1,1]` with `Z=s^D eta` and `T=s(1-eta²)`.
2. `F(a)<=0<=F(b)`.

Whenever either holds the root s is unique. Equality is permitted at either endpoint. Proof: put `G(s)=F(s)/s=1-Z²s^(2h-1)-T/s`. Its derivative for s>0 is `(1-2h)Z²s^(2h-2)+T/s²`, nonnegative and strictly positive unless Z=T=0. In the exceptional case F(s)=s>0, condition 2 fails and no positive root exists. Otherwise G is strictly increasing. Condition 2 gives G(a)<=0<=G(b); continuity yields exactly one root s in [a,b]. At this root, `Z²s^(2h)=s-T`; because T>=0, `Z²s^(2h-1)<=1`. Hence `eta=Z/s^D` is real with |eta|<=1, and the equations in 1 follow. Conversely, substituting the representation into F gives F(s)=0; strict increase of G gives the two endpoint inequalities. This proves both directions, including endpoints.

This theorem does not establish the system's claimed uniform derivative bound `F'(s)>=1/2` across the whole bracket at every 0<h<1/2. The original source uses much smaller h. On the chart image, `Z² <= 2^(1-2h)`, and for s in [1/2,2], `F'(s)=1-2h Z²s^(2h-1) >= 1-8h > 1/2` when 0<h<1/16. Thus that further derivative claim also needs both smallness and the actual-image bound. Physical `T>0` implies |eta|<1; T=0 is an endpoint-profile limit, not an interior physical point.

For the source-native direct calls the new, explicit proof obligation is: for every actually reached binding of formal Z,T, show `T>=0`, `F(1/2)<=0<=F(2)`, and the quantitative small-h and differentiability conditions required by the root evaluator. It is not sufficient that a different representative tuple meets these conditions. For differentiating through inverse calls on a boundary, prove a suitable neighborhood or one-sided extension; a root at a bracket endpoint alone does not supply an open-domain differentiability result.

An unrestricted countermodel is Z=T=0: `F(1/2)=1/2` and `F(2)=2`, so no root is in the interval. This only refutes a universal claim from AST syntax; no actual physical native call has been shown to realize the countermodel. `domain_exact_checks.py` exercises exact rational endpoint cases and an interior h=1/4 sample with rigorous integer square-root enclosures. The latter deliberately does not pretend to satisfy the original tiny-h constraint. No M3, M4, Y, jet, or release status changes follow.
