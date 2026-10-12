# Original localization operator: executed differential proof

This module addresses the literal operator requirements in **N7-02** and
**N7-03**. It proves identities for the original source-bound localization
operator. It does not numerically enumerate the final N6 fields, construct
their global terminal jets, or evaluate whole-K energy. Those requirements
remain separate.

The original criterion text is preserved in
`../ORIGINAL_M3_M4_CRITERIA.json`, Blueprint page 64. The mathematical source
is the fixed 166-page Navier–Stokes paper, SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`,
page 118, equations (10.4)–(10.5).

## Authenticated inputs and executed scope

`source-localization-operator.mjs` rehashes the immutable near-terminal
archive and the separate original-domain archive. Their full source
bindings, including the parameter expression hash and common6 graph, must
agree. The original localization qBig must be the same source node in both.
No caller-provided A, B, pressure, cutoff, source constants or proof flags
are accepted.

The archived operator contains three velocity rows with five terms each:
two curl terms, two cutoff-gradient terms, and one direct azimuthal term.
Every field, component, derivative, coefficient sign and scalar source ID
is checked against the actual captured cutoff and its gradients. Pressure
uses the same cutoff. The complete captured scalar program is also hashed.

Only its small open cutoff subgraph is freshly reconstructed. The original
positive tau0 and z0 remain source-bound symbolic constants. The replay
checks the three cutoff factors, squared-radius and axial arguments, all
three gradients, all nine Hessian entries, the negative tau time derivative
and the complete Laplacian. **All 18 checks returned identical exact
expressions; the reconstructed graph has 396 nodes.** The original
multi-gigabyte source constructor is not rerun by this operation.

The exp(-1/u) derivative recurrence and its elementary polynomial-times-
exponential bound supply the cutoff seam regularity. The fixed domain
bridge supplies the strict support margin, so the local operator and the
identically zero outside definition agree on an open overlap. Undefined
source fields are never evaluated and then multiplied by zero.

## Complete commutator calculation

Write `v=curl(A)+B_e_theta`, `g=grad(c) cross A`, `u=c*v+g`, and
`p=c*p_loc`. With viscosity one and physical `partial_t=-partial_tau`,
the direct residual is

```text
F = partial_t u + (u dot grad)u - Delta u + grad(c*p_loc).
```

The independent decomposition keeps `c*R(v,p_loc)` and these ten families:

| Family | Exact term |
|---|---|
| Linear cutoff | `(partial_t c-Delta c)*v` |
| Diffusion product | `-2 sum_k (partial_k c)*(partial_k v)` |
| Linear curl commutator | `(partial_t-Delta)g` |
| Nonlinear scaling | `(c^2-c)*(v dot grad)v` |
| Cutoff advection | `c*(v dot grad c)*v` |
| Local field advects commutator | `c*(v dot grad)g` |
| Commutator advects local field | `c*(g dot grad)v` |
| Commutator advects cutoff | `(g dot grad c)*v` |
| Quadratic commutator | `(g dot grad)g` |
| Pressure product | `p_loc*grad c` |

The eighth family cancels exactly because `g=grad(c) cross A`. It is
included before cancellation. Each of the other nine families has an
explicit nonzero omission witness.

`localization-jet-algebra.mjs` uses distinct formal Cartesian jets of A
and p. It applies the explicit chain rule to the source-axisymmetric
functions `C(s,z,tau)` and `b(s,z,tau)`, with `s=x^2+y^2` and
`B_e_theta=b*(-y,x,0)`. It never assumes that the unlocalized residual
vanishes. Integer coefficients are exact BigInts, and a zero identity is
accepted only when its entire normalized polynomial is empty.

The direct force has **441 monomials** and its divergence has **272**.
The executed identities prove the full curl product, `u=c*v+g`, structural
`div u=0`, the complete residual decomposition, and

```text
-Delta(c*p_loc) = sum_ij partial_i partial_j(u_i*u_j) - div F.
```

There are **8 exact identity checks** and **14 nonzero omission/symmetry
controls**. A theta-dependent cutoff is rejected by a nonzero structural
divergence witness. No Leray projection modifies the force.

## Independent original-source control

The Python checker uses a separate representation: ordinary multivariate
Cartesian polynomials with `fractions.Fraction` coefficients. It constructs
a nontrivial rational A, p, C and b, differentiates them directly, and
compares complete coefficient maps with every emitted velocity, force,
local residual, curl commutator, pressure, divergence and Laplacian. It
does not merely compare a few sample values or re-read JS success flags.

It then specializes the emitted jet polynomials to the **actual original
exterior heat germ** at `z=0`, `r^2=3/8`, and the one-sided terminal limit.
The original h remains an indeterminate with its source-proved `h>0`.
The positive physical factor `B=K/r` also remains an indeterminate; it is
removed only by the stated homogeneous normalization. The exact cutoff
midpoint derivatives are derived by Taylor arithmetic: both exponentials
have the same positive factor exp(-2), which cancels before division.

With `n=1+2h`, the independent calculation recovers

| Quantity | Exact normalized value | Retained physical scale |
|---|---|---|
| Radial force | `1/4+3/n` | `S_0/r` |
| Azimuthal force | `-64*h` | `K_0` |
| Force divergence | `16/n-16-4*n/3` | `S_0` |

The last value is strictly negative because `n>1`. The pressure identity
holds with div F and fails when that term is omitted. Omitting the
pressure cutoff also produces a nonzero error. This is a source-specific
nonzero control. It is not claimed to be the global terminal force jet.
The other four original exterior jet orders remain linked to their
separate observed source receipt.

## Observed gate and immutable pins

Run a new integer attempt from the repository root:

```sh
python -B research-ide/mathscope-m3/navier/tests/run-localization-operator.py 2
```

Existing attempt directories are never overwritten. Attempt 1 completed
in 2.992 seconds: **10/10 Node tests and 55/55 independent exact checks**,
13 captured dependency files unchanged, and both complete inherited
near-terminal/domain archive packages reverified. All new source bytes,
logs, complete proof polynomials and independent checks are retained.

| Artifact | SHA-256 |
|---|---|
| `evidence/source-localization-operator-20261012/attempt1/receipt.json` | `5795edbba6a0ef7db696699f717eba90120c485daf1ebed6adf8f51cfc67c16f` |
| `evidence/source-localization-operator-20261012/attempt1/localization-operator.json` | `2ec87463df11b4ac83add61e804fbfce01b067d3ea29e4356e587be70dcc3359` |
| `evidence/source-localization-operator-20261012/attempt1/independent-exact.json` | `42074974bcbb2c1e16051acabb40404bcbb31ffce5c557ba35e33d254484cbc6` |
| `evidence/source-localization-operator-20261012/attempt1/source-bytes.json` | `5d7c763974d6df8203773e2f83105bc6c49913a9dd4d488594715b0d656ac8cc` |

The canonical proof object SHA-256, excluding its own `proofSHA256` field,
is `33f32d13dcd8e6c2d9122e936fa007f83da319ad122f72a9990e6dad9bc2370e`.

## API and limits

```js
import {
  sourceLocalizationOperatorProof,
  assertSourceLocalizationOperatorProof,
  sourceLocalizationOperatorObservations
} from './source-localization-operator.mjs';

const proof = await sourceLocalizationOperatorProof({});
assertSourceLocalizationOperatorProof(proof);
const tables = sourceLocalizationOperatorObservations(proof);
```

The returned object is privately sealed. Edited objects and cloned imports
cannot become proof authority. Observations contain exact proof tables and
source artifact links, with empty spatial samples and curves.

The universal operator identity is freshly executed. Existence and
smoothness of the named final source fields are still attributed to the
original source theorem; their numerical construction is not inferred
from the identity. The proof does not assert global terminal jets, force
extension, whole-K energy, complete N6/N7, a Lean proof, or whole-M3
completion. Original checklist assessment belongs to the release review.
