# Original initialized spatial gauge factorization

This replay separates the slow background, mean and primary terms in the
30 actual spatial potential atoms of total order at most two. It uses the
same pinned original stage-zero, mean, primary and physical transport
receipts as the prior 67-atom computation.

The largest non-direct term in the previous energy envelope was
`A1@2,0,0,0`. Its source bound #437 is exactly primary #356 plus mean
#363 plus slow background #436. The original mean contribution has the
largest upper endpoint among these three.

For each potential atom with spatial orders (x,y,z), the mean physical
reciprocal power is (x+y+z)/2+(1-z)h. Its normalized coefficient uses
`psiSpatial[j]+five.psi[j]` and removes the time and mixed-time maxima.
The primary reciprocal power in the archived generic bound is
(x+y+z)/2-z h. All factors use the exact conversion from the original
dyadic band to tau0, including the extra two dyadic labels.

The source phase
`p theta+pz Z/epsilon+x0 R-v H(R,Z,T)` also permits the normalized
spatial directions `partial_R, epsilon partial_Z, partial_theta`.
The literal band source and 20 symbolic first/second derivative formulas
are checked in `spatial-phase-source.json`. The standalone inverse epsilon
in the Z derivative cancels. For the spatial pullback, xi_R=a and v is
spatially fixed, so the first Jacobian factor is 1+a. Restoring z ordinary
Z derivatives costs epsilon^(-z), cancelling Q^(z h) from the old physical
scale. The final primary reciprocal power is therefore (x+y+z)/2.
These changes use the original admitted fixed-label source domain,
smoothness, epsilon<=1 and existing coefficient derivative envelopes.

The complete localization replay has 118 positive terms. At the recorded
directed precision its energy upper endpoint still exceeds the sufficient
initialized energy budget. Each separate slow, mean and primary upper
envelope also exceeds that budget. Their largest terms involve,
respectively, b@0,0,0 with the axial cutoff derivative, b@1,0,0, and
A1@2,0,0,0. The original 67-atom JSON is reproduced byte-for-byte with
SHA-256
`9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34`.
Two runs reproduce the spatial factors, source phase certificate and energy
certificate byte-for-byte.

The spatial reductions have equal rounded final component endpoints to
the generic factored replay at this precision. The actual annular energy,
all later corrections and final jets remain open. The retained global
coefficient envelopes need sharper local bounds and retained small
source factors to establish the energy comparison.

## Replay

Only the following seven files form this result.

* README.md
* evaluate_gauge_spatial.mjs
* evaluate_gauge_budget.mjs
* check_spatial_phase.py
* spatial-gauge-adapted-factors.json
* spatial-phase-source.json
* initialized-budget-adapted-gauge.json

Both Node files dynamically load the arithmetic helper from the supplied
GOAL_NEXT directory, so their own directory is freely movable. Python 3
with SymPy is required for the source phase check. Run these commands with
fresh writable output paths, keeping the phase certificate beside the
factor certificate for the energy replay.

```text
python check_spatial_phase.py ORIGINAL_BAND_SOURCE spatial-phase-source.json
node --stack-size=4096 evaluate_gauge_spatial.mjs GOAL_NEXT ORIGINAL_RUNTIME SLOW_RECEIPT original67.json spatial-gauge-adapted-factors.json
node evaluate_gauge_budget.mjs GOAL_NEXT ORIGINAL_RUNTIME HISTORICAL_INPUT ORIGINAL_POLYNOMIAL initialized-budget-adapted-gauge.json DIRECT_SPATIAL_RECEIPT spatial-gauge-adapted-factors.json
```

ORIGINAL_BAND_SOURCE is the archived
`research-ide/mathscope-m3/navier/source-global-band.mjs` with SHA-256
`babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60`.
The other runtime/input roles and source pins are those in the prior
stage-zero and correction-budget replays. DIRECT_SPATIAL_RECEIPT is the
preceding `direct-spatial-factor.json` under correction-budget.
RELEASE HOLD.
