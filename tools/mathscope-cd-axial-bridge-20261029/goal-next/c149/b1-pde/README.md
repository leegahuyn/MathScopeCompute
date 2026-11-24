# Independent PostFive Repeat conservative PDE readback

This packet attaches the native four-field Repeat increment from GitHub
Actions run 44717711039, artifact 14626236637, to the archived PostFive
residual and the independent C148 covariance and fixed-mean pressure data.
It emits three exact conservative residual expressions in the archived node
namespace. The C148 covariance fields and necessary pressure nodes are
relocated before the new operators. The published native suffix and original
22,380,596 records retain their numbering.

## Verified on the frozen source graph

- The two waveform reconstructions agree on the exact normal forms of all 16
  expression bodies and 648 typed rows. This checks branch guards,
  ordered function arguments and derivative multi-indices, including the
  frozen label. Ring operations are rational and use the parity identities for
  sine and cosine. A common source node may remain opaque under the same ID.
- The three archived PostFive residual roots expand to the corresponding
  conservative formula with their actual transport, vector Laplacian,
  pressure and divergence operands. The independent new graph checks the
  full updated operator against the expanded difference, including every
  conservative divergence term.
- The new radial diffusion retains the derivative of the radial fast
  coefficient. Time retains the negative slow-time derivative and the
  original fast generator. The residual retains both frame connections in
  vector diffusion, both nonlinear connections and the whole-integral
  radial pressure cutoff derivative. Three deletion controls check
  quadratic advection, the radial cutoff derivative and the radial vector
  connection.

For old velocity U, Repeat velocity w, and full pressure increment δp,
the residual difference is

    ∂t w + A(U,w) + A(w,U) + A(w,w) − ε Δvec w + ∇δp
         + U div w + w div U + w div w.

A(v,u) is the cylindrical covariant transport of u by v. Its radial
connection is −vθ uθ/R and its angular connection is vθ ur/R. On the
chart with a frozen label and R>0, Dr = ∂R + a L, Dz = ε ∂Z,
Dθ = (1/R) ∂θ and ∂t = −ε ∂T + ci N. The product rule for Dr²
retains (∂R a)L. The full pressure is the old pressure plus the native
angular increment plus the C148 mean increment. The checked radial
derivative of the mean increment is δgr − ρ δP − (∂R χ) δIwhole.

## Conditional physical interpretation

On a fixed admitted chart with the ordinary derivatives and the original
support premises, each row's waveform uses angle-independent amplitudes
and the same affine phase for the predecessor and increment. The archive
carrier is the ceiling of ε⁻¹ᐟ² and is a positive integer. The normalized
angle integral of the row's product therefore retains exactly the signed
pairs whose modes sum to zero. C143 supplies cross-row product vanishing
under its admitted support and derivative premises. This yields the six
C148 covariance increments on that scope. Their reference factor b^(2A)
is the product of the two velocity factors b^A.

The first remaining physical obligations are the ordinary traces at slow
and reference interfaces and the identity between the guarded candidate
and the original uncut supported residual throughout the required domain.
The actual mean and velocity correction closures and independent norm
bounds remain open. The whole conservative residual has no zero
certificate, the candidate has no live private source seal, final jets
remain 0/67, and release remains on HOLD.

## Replay

Run from the workspace root with Python 3.11 or later. Replace the path
names in the commands with the following values.

| Name | Workspace-relative path |
| --- | --- |
| PKG | work/goal-next/continuation149/b1-pde |
| SOURCE | work/audit-20261121/native-repeat-44717711039 |
| C147 | work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/c147/registration-recovery |
| C148 | work/goal-next/continuation148 |

    python -B PKG/verify_prefix.py SOURCE PKG/old-window.json PKG/old-wave-leaves.json
    python -B PKG/compare_native_wave.py SOURCE C147 PKG/old-wave-leaves.json OUTPUT_WAVE_JSON
    python -B PKG/build_pde.py SOURCE PKG/old-window.json C148 OUTPUT_DIRECTORY

The verifier reads the archive sequentially and authenticates the entire
decompressed stream including the header. The two replay scripts pin their
append and registry inputs. C148 must contain offline-covariance/replay-c132
and offline-mean/replay-c132.
For this saved checkpoint, set PKG to the b1-pde directory and C148 to its
bundled sibling b1-inputs. The original native archive is GitHub Actions
artifact 14626236637 from run 44717711039.

| Replayed file | SHA-256 |
| --- | --- |
| candidate.json | e36a7d752b38517f2b0cbed7b81ee7f952fa3dad2610d667807c1cd71df98a16 |
| relocated-definitions.json | 7ceb23e1dd055c953cbec8fbe0969d427c3ac07b4161dc6814261b6344ce4082 |
| relocated-covariance-mean-operator.jsonl | a35d9a633dc346869a20c9b1665963206384931e78547c2eccb2c4bd3666c140 |

The direct and increment-form residual triples are
[22387442,22387459,22387473] and [22387508,22387542,22387570].
They evaluate to the same formal expressions on the common graph.
