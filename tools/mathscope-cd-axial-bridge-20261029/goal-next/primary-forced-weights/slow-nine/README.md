# Pointwise bounds for the archived initialized mean C3

**VERIFIED numerical source inputs.** The fixed original annular chart has
ordinary \(R,Z,T\) bounds through C9 for both background fields and weighted
C8 for both target components. The target retains
\(\zeta\delta_*^{-27}\), with
\(\delta_*=\min(1,\log(X/X_a),\log(X_b/X))\).

The C9 calculation imports the original uniform ordinary profile bounds
through degree ten. For the six positive-order fields the old numerical
FTC envelope \(3(1+\Delta)(1+M)\) dominates the pointwise bound \(M\),
where \(\Delta\ge0\) is the width of the original profile rectangle.
Leading F0 and U0 use the earlier active and exterior pointwise
certificates. The original cutoff Euler recurrence is executed at order
nine for each of the three active positive orders. The endpoint
\(h<1/64\) suffices for its nonnegative polynomial.

The weighted C8 calculation uses the three original target regions.
The inner component bounds cover degree nine in the normalized variables.
Converting \(y/t_1\) to \(y\) through order eight costs at most \(t_1^{-8}\).
The outer integer Taylor ledger already extends through degree nine and
retains the source radial factor. The middle uses the raw pointwise C8
component bounds and \(\zeta^{-1}\le e^{128}\) after differentiation.
The original Gaussian-Laurent and unsigned Stirling recurrences are
executed through order eight. The missing logarithmic distance on each
collar is greater than one, so the reciprocal Gaussian costs at most
\(e^4\).

The fixed physical chart has the same elementary polydisc of radius
\(1/(128R_*)\). The degree-\(j\) Cauchy count is \(\binom{j+2}{2}\).
The replay factors out \((128R_*)^j\) and takes positive products with
exact integers and directed source arithmetic. Real profile derivatives
stay on the original domain and use its flat joins. The all-band FTC
expression required by the native private-family constructor is separate.

**CONDITIONAL numerical covariance and mean.** The positive full-curl
calculation authenticates 972 original covariance rows. Order eight of
the pre-curl potential supplies ordinary order seven of \(W_{rz}\),
including its \(L^2\) term. The square-root weight uses poles
\(14,27,54,\ldots,216\). The zeroth pole 14 bounds \(27/2\). The
positive-order recurrence uses the original weight lower bound and keeps
its Gaussian. The common pole 216 is absorbed for the unweighted mean.

The replay retains both original radial pressure terms, the Fourier inverse
bounds and the fixed radial C5 inputs. It gives upper endpoints for
Temporal \(\beta\) at slow order four, both fresh FiveMap targets at slow
order three and the total initialized \(v\) at slow order three. The
independent Python check reads back 72 records in the 4,456,994-node
archive, including the shifted covariance and the left/whole integration
binder. The [adjoint proof](../higher-mean/adjoint-c3/README.md) also
identifies the four highest potential directions and an exact nonzero
\(P\) pairing.

The last replay binds all 52 mean derivative indices per component in
the archived mean–wave C2 stencil. The 156 bindings combine the numerical
positive-pulse, transverse and pure-slow inputs. The factor 128 includes
the earlier factor four for the source epsilon valuation, the
reference-to-own scaling through order three and the fixed-band epsilon
ratio. Beta has one extra epsilon. Applying the result requires the
original common fixed chart along the complete pulse path. The wave C3
inputs for the cross term, wave C4 for full Forced C2, the live family
identification and the later corrections remain open.

## Replay

~~~sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
work="$p/primary-forced-weights/slow-nine"
rt=inputs/annular-numerical-runtime
hist=inputs/original-selector-scales/historical-scale-arithmetic-input.json
graph=inputs/corrected-first-cycle/corrected-first-cycle-graph
chart=tools/mathscope-cd-axial-bridge-20261029/goal-20261111/m3/whole-k-chart.json
node --stack-size=4096 "$work/replay_pointwise_norms.mjs" "$p" "$rt" "$hist" /tmp/pointwise-norms.json
python -B "$work/check_original_high_rows.py" "$graph" \
  "$p/primary-forced-weights/higher-mean/adjoint-c3/fivemap-highest-directions.json" /tmp/original-high-rows.json
node --stack-size=4096 --max-old-space-size=3072 "$work/replay_covariance_seven.mjs" \
  "$p" "$graph" "$chart" "$rt" /tmp/pointwise-norms.json /tmp/covariance-mean.json
node --stack-size=4096 "$work/bind_cross_c2_mean.mjs" \
  "$p" "$rt" /tmp/covariance-mean.json /tmp/cross-c2-mean.json
~~~
