# Independent review of axial Picard row 5

## Result and evidence

The existing `work/axial-inner/check_row5_algebra.py` was copied unchanged to this directory and executed independently with SymPy. It returned an exactly zero symbolic remainder for

`2*raw_axial = -U_xixi - U_xi/xi + row5_rhs`,

and the deliberate pressure-coefficient mutation produced the nonzero exact remainder `-4*F*F0*eta*xi^2/L`. The local output `row5-algebra.json` records both results and the script's SHA-256. This is an exact symbolic identity for the explicitly transcribed expressions, not numerical sampling.

The manually reviewed sources from `origin/mathscope-cd-lean-three-gates-20261027` are:

* `research-ide/mathscope-m2/navier/actual-continuation-exact-inner.mjs`, lines 30–55: leading coefficient setup, Z operator, row-5 matrix coefficients, forcing and the unknown ordering.
* `research-ide/mathscope-m2/navier/actual-continuation-exact-stress.mjs`, lines 16–23: actual axial residual and order-one physical fields.
* Recovered hash-pinned manuscript `navier-stokes.pdf`, page 46, (5.2), (5.4), (5.5).

The row matches the reviewed source in every transcribed term: the coefficients of `F`, `U`, `K`, `Pi`, `W`, `Ueta`, `Keta`, and `Pieta`, together with the forcing `-2*Visc-4*eta*X*Pknown/L`. The handwritten expansion of the stress source agrees with the script's `adv` and `-2(X U_XX+U_X)` after changing variables to `X=xi^2`.

## Required hypotheses and limits

The calculation requires `xi != 0`, `L != 0`, `A+D=1`, `W=partial_xi U1`, `Hu=X*partial_X U0`, `Z0=Z_c U0`, and `Pi_X=2*F0*F1+Pknown`. The equality `V1/X=v1` uses `average(U1)=U1+K1` and the source's formula (5.2). The parameter `lam` is arbitrary in this algebra; the original order-one interpretation additionally binds it to `2*h`. Eta derivatives are taken at fixed X, equivalently fixed xi because xi is independent of eta.

The residual source uses the heat-prepared `finalF` and completed `finalU,finalv`, whereas the Picard operator builds its own leading `F0,U0,v0`. Their equality, including the required radial and eta derivatives on the inner collar, is a distinct source-binding obligation. The coefficient review is manual and has not yet authenticated every actual DAG subtree against the handwritten transcription. Nor does this result prove the Picard series converges and solves the differential system, establish the pressure derivative premise in the source, handle the axis `xi=0`, prove the native argument domain, or establish full moment cancellation. The original source identity and `#672` are therefore **OPEN**.
