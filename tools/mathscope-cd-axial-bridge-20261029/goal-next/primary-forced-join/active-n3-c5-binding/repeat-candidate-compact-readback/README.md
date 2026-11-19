# Local checks for the original N3 repeat append

The proposed verifier keeps the complete repeat graph and native registry
in the process that constructed them, or in ephemeral local storage. Its
output is a compact count, hash and check receipt. The raw append,
function bodies, formal or actual argument arrays, roots and coordinates
are excluded from that receipt. This design has been exercised against
the authentic archived N1 append. The current active N3 append remains
unavailable for external raw replay.

## Minimal checks on the local source

1. **Predecessor integrity.** Recompute the predecessor stream digest
   after the repeat using the original compact node framing and the
   predecessor header count. Compare it to the same-run accepted spatial
   digest. Compare the ordered native registry prefix byte-for-byte and
   verify the expected continuation of its definition groups. Record
   counts and digests of the predecessor, the new append and the new
   registry suffix. A before-only hash cannot detect a mutation during
   repeat. Establish provenance in the same process as the original
   private PDE assertion and bind the receipt to that workflow run.
2. **Modes and supported source.** Require precisely ten signed fixed
   templates and positive modes 1–4 for each. Check `supported=raw−sub`
   over all three components and two parts. Check the original four term
   families for mode one, the two first-Forced families for mode two,
   and the exact zero subtraction for modes three and four. To recover
   `sub=sum(original terms)` exactly, follow already interned additive
   nodes in the predecessor as well as new nodes. The N1 fixture does
   reuse a predecessor sum. Each final guarded scalar is seven nested
   `smooth_piecewise(condition,lo,hi,0,inside,0)` choices. The outer-to-
   inner roles are band, T mesh, Z mesh, R mesh, shell, transverse and
   pulse. Compare all seven operands to the original fixed-label guards.
   Match the innermost body to the supported source with the required
   representative substitution. The archived N1 interiors already
   have the exact supported IDs. This shape check gives no equality on
   the complement of the open supported domain.
3. **Actual (H_w) applications.** Each guarded component is shared as
   a native `m3_coupled_expression_partial(system,actuals,orders)` with
   zero orders and its defining body. Its mapped application uses the
   same system and changes exactly the two common `Y` slots. Bind the
   new slots to the predecessor's original (H_w=Y+
   (c_i/T_g^\delta)(w-v(Y))v_t), with unchanged slow arguments and labels.
   Check its independent longitudinal invariance against the fixed-label
   chart and the exact retained derivative expression. The prototype
   checks the application shape, exact bound body and the common pair
   of replacement operands for every case of a fixed template.
4. **Actual forced pulse and physical output.** Each native positive
   system has the unchanged pulse variable and interval, complete
   3-by-3 matrix, six forcing components, three zero complex initial
   components, and exact ordered-integral limit semantics. Check
   each `CoupledForced_source_` wrapper retains the exact mapped body
   in its corresponding case and part. The projected forcing reaches
   those wrappers. The independent algebra check, if included, should
   verify the actual `−P_n f` projection with original normal operands
   and keep the `n·f` contribution in the pressure numerator. Require
   one zero-order exact formal application for each of the six original
   mapped potential definitions per case. Their returned full curl
   reaches precisely those six, with the original complex orientation
   `(-shared.imaginary,+shared.real)` for the curl remainder. The
   returned pressure has no dependency on those six potential wrappers.
   Check the opposite signed harmonic by exact conjugacy. If validating
   more than the prototype's gauge dependency, also expand the actual
   four derivative-bearing curl forms and compare all phase and
   cylindrical factors locally.

The structural checks leave the actual guarded/unclipped equality,
uniform weighted source bounds, seams, mathematical stage-two closure,
and the final jets open. Any analytic statement added to this receipt
needs its own exact hypotheses and check result. The archived controls
do not confer those checks on the new N3 graph.

## Implementing a receipt with no graph output

An in-run JS reader can inspect the already held graph without cloning
it. Serialize rows into a streaming SHA-256 reducer and do not write a
raw output file. If an independent Python reader is used, give it only
the locally held prefix and append or a local file descriptor. Close or
dispose of that data after verification. The prototype demonstrates the
core append checks in Python and authenticates the archived fixture by
its existing three digests. Production should supply the actual
predecessor accessor and validate the first three points above on the
original live N3 process before claiming any comparable check result.

The public receipt may contain only its schema, run and verifier
identity, input digests, aggregate counts, named boolean check results,
and explicit open status fields. Failures should keep only a short
check identifier in public logs. Do not serialize failing node
objects, operand arrays, inner exception payloads or registry entries.
No workflow or upload was executed for this design.

## Authentic archived control

The executed N1 prototype checked 240 exact supported subtraction joins,
240 nested guards, 240 original pullback pairs, 40 complete zero-data
forced pulse systems, 240 forcing-component wrapper associations,
240 unique zero-order gauge applications, 40 same-case gauge curl
associations and independent pressures, and 160 conjugate
velocity/pressure pairs. The input is the pinned original append with
225,012 nodes. The output contains no AST data or coordinate values.
Three deliberate local mutations were rejected: a dropped supported
operand, a borrowed pullback from the wrong harmonic and an unchanged
imaginary component in the negative harmonic.

```text
python -B check_local_append_core.py ARCHIVED_N1_VERIFIED_DIRECTORY NEW_COMPACT_RECEIPT.json
```
