# Actual slow inverse: native values and first/second derivatives

This is a **new implementation**, developed from the byte-verified PR30 source
at commit `333d6095d4a2d2d69ceec9b25c44e1d3381e36d2`. It is not a recovery of
the implementation described in the unsaved 10:08-10:16 historical messages.

The implemented operator is the original registry `monotone:2`, named
`ActualCommonBandSlowInverse`, at calls `622820` and `623935`. The source
residual is

\[
 F(s;Z,T)=s-Z^2s^{2h}-T,
 \qquad h=\exp[-8002(\exp(1048576)+10)].
\]

The original bracket remains `1/2 <= s <= 2`. The code requires the original
source-image condition `T >= 0`, `Z^2 <= 2`, and independently certified
residual endpoint signs. An unresolved sign or input domain is rejected;
neither the bracket nor the original source parameters are relaxed.

## Source and provenance

`prepare_native_source.py` checks the exact full-file SHA-256 values of the
original source header, the already recovered scalar closure, and the pinned
profile. It extracts only the 19 needed source records, the original native
definition, and the exact parameter expressions into `evidence/SOURCE_CAPSULE.json`.
The original 700-record recovery and 3,407-record dependency work are reused.
Their producers and expensive mathematical runs are not repeated.

The original paper has SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
PDF page 7, equation (3.2), defines the physical similarity inverse. Pages
62-63, equation (6.1), give the band scaling. Taking `s=q/Q`, `Z=z/Q^D`, and
`T=tau/Q` gives the exact residual above. PDF page 24, equation (4.1), records
the same similarity definitions and their derivative denominator.

## What was executed

`verify_slow_inverse.py` completed with exit code 0. It verified:

- 19 explicitly declared native formal-domain input boxes, including seven
  exact original source-image witnesses `s=1`, `Z=eta`, `T=1-eta^2`.
- 22 independent endpoint certificates, including the precision comparisons.
  These use a separate rational atanh series for logarithms and a Taylor
  series for exponentials, with complete remainder bounds.
- Five symbolic implicit-differentiation identities for `dZ`, `dT`, `dZZ`,
  `dZT`, and `dTT`.
- Sixteen rejection controls covering domains, floats, reversed intervals,
  unresolved endpoint signs, altered native definitions, and replacement of
  the original positive `h` by zero.
- Native resolution at 32, 64, and 128 bits. The certified value intervals
  shrink strictly as this resolution increases.

The chosen boxes test the **actual source-defined scalar native function**.
They are not represented as numerical evaluations of the outer arguments of
the final global field. The full data, rational enclosures, error budgets,
negative-control failures, and scope flags are in
`evidence/ACTUAL_SLOW_INVERSE_VALIDATION.json`.

The first verification invocation failed because SymPy was absent; this failed
attempt is retained in `EXECUTION_RECEIPT.json` and `logs/`. After installing
the pinned review dependency, the verification passed. The native evaluator
itself uses Python's standard library only.

## Why the positive h was not dropped

For requested resolution `b` in `[16,4096]`, the code proves

\[
 0<h<2^{-(b+32)}.
\]

Indeed, `T=exp(Md)+10>Md=1048576`, `8002*Md>b+32`, and `log(2)<1`.
The enclosure `[0,2^(-b-32)]` contains the actual positive number and retains
its exact expression and positivity proof. Zero is an enclosure endpoint; it
is not substituted into the source equation. Every root and derivative
interval includes the resulting uncertainty explicitly.

For `delta=2^(-b-31)` and `1/2<=s<=2`, `|log(s)|<1` gives

\[
 1-\delta \le s^{2h}\le (1-\delta)^{-1}.
\]

The sign of `log(s)` refines this interval above or below 1. At `s=1`, the
power is exactly 1 for the same nonzero `h`. These rational bounds avoid
underflow and do not require expansion of the enormous source exponential.

## Root enclosure and derivatives

On the original bracket,

\[
 F_s=1-2hZ^2s^{2h-1}\ge 1-8h>1/2.
\]

Here `s^(2h-1)<=2` on the retained bracket because `0<2h<1` and
`1/2<=s<=2`; together with `Z^2<=2` this gives the displayed derivative
lower bound. The implementation writes it as `F_s>=1-4*q_upper`, where
`q_upper` bounds `2h`.

The endpoint signs establish a unique root. Exact interval Newton steps
retain every possible root; they stop only after the declared point-parameter
width is reached. Since `s_(Z^2)=s^(2h)/F_s>0` and `s_T=1/F_s>0`, two
parameter corners enclose the full independent `Z,T` box. The reported full
value width includes input-box variation, which is distinct from the
point-parameter solver tolerance.

All derivatives hold the same fixed source `h` constant. With `d=F_s`,

\[
 s_Z=-F_Z/d,\quad s_T=1/d,
\]
\[
 s_{ZZ}=-(F_{ZZ}+2F_{sZ}s_Z+F_{ss}s_Z^2)/d,
\]
\[
 s_{ZT}=-(F_{sZ}s_T+F_{ss}s_Zs_T)/d,\qquad
 s_{TT}=-F_{ss}s_T^2/d.
\]

The derivative bounds use exact rational interval operations. In particular,
`s_TT` is strictly negative at `Z != 0` for the original positive `h`, even
when a displayed enclosure has 0 as its upper endpoint. The evidence records
this distinction explicitly.

## Reproduce

From this directory, use the existing recovered PR30 directory as the input:

```bash
python prepare_native_source.py --recovery-root ../../evidence/work-recovery-20261018T072604Z_b479c2d1 --output evidence/SOURCE_CAPSULE.json
python verify_slow_inverse.py --source-capsule evidence/SOURCE_CAPSULE.json --output-dir evidence
```

The independent algebra reviewer requires `sympy==1.14.0` and
`mpmath==1.3.0`. They may be installed into a separate dependency directory
and exposed through `PYTHONPATH`; no dependencies are required for importing
`slow_inverse_native.py` itself. The exact executed paths, dependency location,
commands, stdout, stderr, and exit codes are retained in
`EXECUTION_RECEIPT.json`.

The source preparation command assumes the installed location is
`research-ide/mathscope-m3/recovery-20261019/native`; pass the actual recovery
directory path if the files are packaged elsewhere. No repository, source,
profile, or acceptance ledger is mutated by
source preparation or native evaluation.

## Remaining original obligations

The following are still OPEN:

- Evaluate the actual original caller arguments `622803/622804` and
  `623921/623934` in their correct lexical frames and physical source domains.
- Use the resulting inverse values to classify `R^2/(2*s)` against the
  unchanged source radial endpoints `Xa` and `XR*exp(node319)`; crossing boxes
  must remain unresolved or be subdivided.
- Evaluate the other actual native derivatives, retained current `A,b,p`,
  cutoff, force, pressure, and slow-base terms.
- Perform whole-K energy, dissipation, and force-work integration with
  independent space/time refinement (N7-06).
- Perform the original independent grid/Fourier-cutoff/coefficient-order/
  arithmetic-precision comparisons and separate tail bounds (N8-05).

This scalar native progress closes no original M3 acceptance row. It does not
close the eight expression derivative leaves or all 138 native boundaries.
M3 remains 62/64 in the inherited ledger, and actual global last-resolved tau
remains `null`. This native-only precision comparison is not N8-05 acceptance.
