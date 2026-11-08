# Actual F0 and Picard system 0: conditional source binding

The exact graph, function registry and pinned profile are authenticated by
`check_f0_binding.py`. For a common assignment and `X=xi²>0`, it compares
actual `ActualFinalLeadingF` #71959 with Picard `sourceLeading.F0` #25601.
The two strict regions `0<X<Xa` and `Xa<X<Xminus` pass exact structural
interning after the explicitly listed branch, step-plateau, integral and real
operation conditions. Three negative controls reject missing source branches
or a mutated branch. This is not an analytic evaluation.

The source comparison assumes the guards written in `f0-binding.json` and
defined smooth interpretations. In particular, use of the heat cutoff requires
`Xminus<XK`. `check_terminal_guards.py` authenticates the XK/Qb/Qp graph
relations and `REVIEW.md` describes the source's conditional analytic
argument for Qb>Qp>0; that argument is not a Lean proof or a numeric
evaluation. The actual interpreter, integrability and smooth step conditions
must hold before this guard becomes a certified fact.

Equality at Xa, Xminus and X=0, full native-coordinate domain, Picard
convergence/ODE satisfaction, and actual residual/moment cancellation are not
proved. No M3, M4, Y, jet or release count is promoted. See `REVIEW.md` for
the independent review, exact assumptions, source blob IDs and reproduction.
