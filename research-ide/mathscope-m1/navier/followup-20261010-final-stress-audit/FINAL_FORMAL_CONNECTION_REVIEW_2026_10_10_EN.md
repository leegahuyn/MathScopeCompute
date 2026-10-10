# Final independent review of the original N3-03 connection

Review date: 2026-10-10 UTC. This review uses the completed fresh 13-module
prefix, its one-module extension, the actual 125-entry mixed-array consumer,
and the subsequent independent import-resolution audit. It supplements the
historical 68/2 assessment; it does not rewrite that record or any original
criterion. The machine-readable review records the exact review time and
every source hash.

## 1. Verdict under the unchanged original requirement

**The original remaining N3-03 condition is fulfilled by the evidence below.**
The actual infinite fixed point, its finite radial and eta jet, the separate
truncation and rounding bounds, and the instantiated Lean premises now refer
to the same selected datum and amplitude. The original comparison fixture
and positivity requirement are also verified below. This permits a new dated
69 PASS / 1 PARTIAL assessment. The protected Comparator remains independent
and has no successful final outcome supplied by this review.

The original acceptance text is preserved verbatim in
[original-acceptance.json](../../evidence/original-acceptance.json):

> Bρ norm의 invariant ball와 contraction 상계 <1을 인증하거나 미인증 상태로 남긴다. f0(4.1)=0.2711140554… 및 φ/φ*>0 fixture를 확인한다.

The user's inherited condition is the connection between the infinite fixed
point, finite jet, arithmetic error and Lean premises. The six items in the
unchanged [N3-03 checklist](../../../docs/NS_GATES_EN.md) determine this review;
the [scope review](N303_COMPLETION_SCOPE_REVIEW_EN.md) explains why a mandatory
Lean reevaluation of every numerical interval operation would be an added
implementation requirement. Blueprint pp.55–56 and handoff pp.4,10 give the
same source and continuation requirements. Their exact PDF and original
record hashes remain pinned by the historical and new assessments.

| Original checklist | Actual accepted evidence and finding |
| --- | --- |
| Exact infinite space, data, operator and norm | `SameDatumInputs`, `FieldBounds` and `OperatorBounds` construct the actual `AxisSpace axisWindow rho`, all selected fields, compatible data, coefficient operators and resolvent. `selectedInputNormBounds` supplies every field of the actual norm contract. |
| All hypotheses for the actual A.21 datum | `SameDatumMass` controls the actual entire clock integral. `PressureSelection` proves the actual decay hold, ideal prefix and original `PressureData` for the literal pressure integral. `AmplitudeInput` and `AmplitudeDynamics` prove the actual amplitude, its norm and derivative. `ThresholdBridge` and `OperatorBounds` supply the literal original threshold at the selected Q and Lambda. |
| Exact finite recurrence | `ConcreteProducer` selects the unique actual fixed point. `ConcreteJetRecurrence` proves its all-n/m projection, the exact 25-by-5 rectangular block, the all-eta reference formula and every eta derivative identity. |
| Radial/eta truncation and rounding | `ConcreteFiniteJet` supplies the concrete radial enclosure. `MixedEtaBindings` and the 812-check actual consumer bind all 125 saved midpoint/radius pairs and the exact positive eta chart, with separate nonlinear, radial-tail, eta-tail and rounding bounds. |
| Actual kernel statements and receipts | Thirteen fresh source compilations followed by one fresh consumer compilation exit zero; 110 printed declaration audits use only the standard axioms. Independent original-parser import resolution verifies the actual fresh objects and their hashes. |
| Same continuation/gluing input | The selected pressure integral, h/j/sigma/rho/Q/Lambda/C, fixed-point equation and amplitude are exactly the definitions in the one-profile specification. Uniqueness in the same invariant ball identifies the formal selected solution with the written axis used by the actual continuation, B.8, heat and final corrections. |

## 2. Actual data and invariant ball

The accepted `ConcreteProducer` source has no free input amplitude, field
norm predicate or caller-supplied pressure datum. It uses the selected
actual values

\[
\rho=\sigma^2/65536,\quad Q=2^{260}P_*^2/\sigma^2,\quad
\Lambda=Q^{64},\quad C=(1+Q^{300})^{10}e^{Q^{200}}.
\]

The original coefficient-space norm, natural remainder, actual resolvent
and reference pair are used directly. The actual operator bounds establish
`5120/rho <= Q`, all field/operator bounds, and reference radius at most Q.
The original controlled-remainder estimates and literal threshold are
bounded by the selected `Q^64`; the contraction factor is at most one half.
The invariant closed ball has radius one about the selected reference.
The source does not assume that the generated data satisfy this contract.
It supplies the proof fields and applies the original theorem.

`selectedFixedPoint_spec` gives the exact nonlinear fixed-point equation,
membership in that invariant ball, uniqueness there, and the sharp bound

\[
\|A-A_{\rm ref}\|\le 29/Q^{53}.
\]

`selected_scaled_solution` applies the original integrated-equation bridge
to the actual smooth Phi, U, radial average and pressure correction.
`selected_uniform_mixed_error` supplies all radial and eta derivative orders.
The actual pressure is the literal integral of `newAngular²`, and the actual
amplitude has its selected logarithmic derivative. These facts identify
the same mathematical object as the analytic axis already used by the
[one-profile construction](../followup-20261010-symbolic-gluing/ONE_PROFILE_SPECIFICATION.md).
The uniqueness statement is the identification step; agreement of a few
numerical endpoint values is not used as a replacement.

Sources: [concrete producer](../followup-20261010-same-datum-axis/formal-input-producer/assembly-attempts/0002/ConcreteProducer.lean),
[actual operator bounds](../followup-20261010-same-datum-axis/formal-input-producer/operator-attempts/0004/OperatorBounds.lean),
[same-datum analytic proof](../followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md).

## 3. Exact recurrence, both finite directions and actual arithmetic

For every n and every eta in the real source window, the exact reference
coefficient is

\[
B_n(\eta)=\frac{(-\chi(h,j,\sigma,\eta)/2)^n}{n!(n+1)!}.
\]

The kernel proves this identity, every ordinary eta derivative identity,
and the exact projection of the nonlinear fixed point. At n=0 the selected
coefficient is exactly one, so all positive eta derivatives in that row
vanish. The normalized xi coefficient uses `j^m/m!`; a derivative-value
table uses `j^m` instead. The two conventions are kept distinct.

The actual positive parameters satisfy `h <= 2^-4096` and `j² <= 2^-32768`.
The exact kernel identities for `H(j xi)/j` and the rational chi function
are the functions evaluated by the saved 25-by-5 array. The accepted
nonlinear coefficient intervals contain the reference intervals enlarged
by the positive all-order norm error. Their literal rational midpoint and
radius pairs define one named polynomial M; no arbitrary `c`, `delta` or
`hround` remains in the final consumer.

On the specified actual continuous chart

\[
0\le Y\le41/10,\quad |\eta|\le\rho/4,\quad
\xi=\eta/j,\quad |\xi|\le\epsilon:=2^{-16000},
\]

the five error contributions are as follows. Write R0=41/10 and

\[
E_{nm}=\frac{29\,2^{-260(53-m)}\binom{n+m}{m}}
 {20^n(n+1)^2(m+1)^2}\quad(n>0),\qquad E_{0m}=0.
\]

| Contribution | Actual upper bound |
| --- | --- |
| Infinite nonlinear value vs reference | `(4/3) 2^-512` |
| Eta Taylor tail after m=4 | `243 (16 epsilon)^5/(1-16 epsilon) < 2^-79000` |
| Radial tail after n=24 | `R0^25/(25!26!)/(1-R0/(26*27))/(1-16 epsilon) < 2^-120` |
| Nonlinear vs reference finite block | `sum E_nm R0^n epsilon^m < 2^-512` |
| Actual directed coefficient rounding | `sum radius_nm R0^n epsilon^m < 2^-190` |

The exact rational sum is below `2^-119`, hence
`|Phi_selected(Y,eta)-M(Y,eta/j)| < 2^-118` throughout that chart.
The finite-block term is needed because the saved centers come from
nonlinear intervals. It is included, so reference and nonlinear centers
are not silently interchanged. The companion independent verifier
recomputes every midpoint/radius, every E_nm and this complete error sum.

The complex xi disk of radius 1/16 is used only for the reference Cauchy
bound. It is not asserted to be a complex domain of the nonlinear solution.
The finite positive eta chart does not cover the full interval [-1,1];
the original infinite solution and its all-order estimates do cover the
real source window. The original finite-jet criterion is met on the stated
chart, with its domain printed in every consumer.

Sources: [exact recurrence](../followup-20261010-same-datum-axis/formal-input-producer/assembly-attempts/0004/ConcreteJetRecurrence.lean),
[actual eta identities](../followup-20261010-same-datum-axis/independent-review/formal-finite-jet/attempts/0008/MixedEtaBindings.lean),
[actual mixed-array proof](../followup-20261010-same-datum-axis/independent-review/ACTUAL_MIXED_ETA_BINDING.md),
[812-check receipt](../followup-20261010-same-datum-axis/independent-review/actual-mixed-eta-binding-001.json).

## 4. The original f0 fixture and actual positivity

The original scalar fixture is

\[
f_0(4.1)=0.2711140554036643841027965\ldots,
\quad f_0(z)=\sum_{n\ge0}\frac{(-z/2)^n}{n!(n+1)!}.
\]

It remains distinct from the new actual profile value near
`Phi(4.1,0)=0.2711141757820183`. At eta zero the new selected reference
uses `chi(0)=4000000/4000001`, rather than one. The old fixture therefore
cannot be substituted as the new nonlinear endpoint value.

The original outward numerical interval is
`[0.2711140554036619, 0.27111405540366706]`. The companion verifier
independently evaluates forty exact rational terms and bounds the
alternating tail by its first omitted term. Its exact resulting interval
lies inside the preserved outward interval and between the requested
decimal prefixes `0.2711140554` and `0.2711140555`.

For every real eta, `0 <= chi <= 1`. For `0 <= z <= 4.1`, the alternating
tail after the cubic has the correct positive sign, and

\[
f_0(z)\ge 1-z/4+z^2/48-z^3/1152
 \ge 305719/1152000.
\]

The cubic derivative is `-((z-8)^2+32)/384 < 0`, so its minimum on this
interval is the stated endpoint value. The actual nonlinear value error
from the now instantiated norm theorem is below `2^-100`. Consequently

\[
\Phi=\varphi/\varphi_*>305719/1152000-2^{-100}>1/4>0
\]

for `0 <= Y <= 4.1` and eta in the actual real source window. The actual
exponential amplitude is positive. This verifies the original positivity
condition for the selected profile, not merely for the comparison fixture.

Sources: [original high-precision fixture](../evidence/high-precision-fixtures.json),
[original outward interval](../evidence/numerical-validation.json),
[same-datum positivity proof, section 7](../followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md).

## 5. Actual execution, independent import resolution and limits

The [fresh prefix](../followup-20261010-symbolic-gluing/formal-clean-replay/attempts/0001/receipt.json)
starts with no custom object files and compiles thirteen source modules.
It completes at 2026-10-10 00:07:32 UTC. The
[extension](../followup-20261010-symbolic-gluing/formal-clean-replay/extension-attempts/0001/receipt.json)
compiles `MixedEtaBindings` against precisely that prefix and completes at
00:08:09 UTC. Together these are **13 plus 1 source compilations and 110
printed declaration audits**, all with exit zero and only `propext`,
`Classical.choice` and `Quot.sound`. The extension does not recompile the
thirteen-module prefix, and this independent review does not perform an
additional kernel execution.

The [343-check independent import audit](../followup-20261010-same-datum-axis/formal-input-producer/replay-independent-audit/attempts/0001/receipt.json)
completes at 00:13:12 UTC. The actual original parser and resolver find all
custom imports in the fresh outputs with their exact hashes. The preserved
launcher rejects direct `--deps`; that failed command remains logged.
The audit instead executes the original `Lean.Elab.printImports` API,
which is the implementation used by the official `Lean.Shell --deps`
branch. It does not report the rejected command as successful or modify
the launcher. All 2,669 original tracked files and the original kernel
remain unchanged.

The companion review verifies the 343-check receipt's actual source pins,
resolved objects, two resolver executions, both fresh compilation receipts,
all source/object/log bytes and all audited declarations. This is additional
independent source, recorded-execution and exact-rational verification;
its check count is not a count of additional mathematical theorems.

The 125 numerical rows are validated by exact interval arithmetic attached
to the actual kernel identities. They are not all individually reevaluated
inside Lean. The full nonlinear expression graph over every eta is not
claimed to be directly numerically evaluated. The later continuation,
global cone, stress and endpoint arguments retain their written analytic
and independently checked interval scopes. N3-03 completion does not mean
that this entire final profile is formalized in Lean, or that the original
protected Comparator has passed.

## 6. New assessment and preservation

The new assessment may mark N3-03 PASS because each original connection now
has actual evidence. This changes the separate current count to 69/1 and
the requested nine to eight fulfilled and one partial. The original
61/7/2 records, the historical 68/2 assessment, unsuccessful attempts,
conditional component receipts and their honest scope flags are preserved.
The new assessment references this proof and the executed independent
receipt; it never infers completion solely from their check totals.

Reproduction of this source/record/rational review uses
`check_final_formal_connection.py --deps-review <accepted-343-receipt>`
with `--output` pointing to a new, nonexistent receipt file. The script
imports none of the proof producers or numerical interval helpers and
refuses to overwrite any previous review.
