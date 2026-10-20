# Signed full auxiliary pressure successor

This is a separate source successor for the original compatible **pre-temporal signed stage**. It preserves all recovered original modules and their private authenticators. It does not manufacture a post-forced current, accept a JSON packet as a live source, rerun the original Windows launcher, or certify all N6-02 stages.

The new module is `overlay/research-ide/mathscope-m3/navier/source-global-signed-full-pressure.mjs`. The corresponding additive diff is `signed_full_pressure_successor.patch`. The 121 transitive original modules come byte-for-byte from the canonical PR30 HEAD snapshot inside the authenticated source recovery archive; paths, lengths and hashes are in `SOURCE_DEPENDENCY_PROVENANCE.json`. The new module has SHA256 `dc20e9a12ef6fba6648f9e88d029639ab63e88fb4fdeaba5edf51eed272218db` (11272 bytes).

The repair takes the original signed row's complete covariance **before auxiliary Haar integration**, keeps all original full-curl velocity terms, maps all 162 original sign/label contributions onto the common torus, and reconstructs full pressure with the original pressure kernel, rho, chi, stress and actual current mean velocity. It includes the actual signed homogeneous angular pressure. A separately implemented tensor-divergence update retains old flat residual, both ordered cross terms and the new quadratic remainder, then compares all three components to the direct real cylindrical PDE.

The equality comparison alone cannot select the correct pressure: a wrong pressure used consistently in both paths also satisfies the universal update identity. Correct pressure selection is established separately by the preserved full-covariance source flow and private input compatibility. Two independent source reviews found no map/scaling, angular-half, homogeneous-pressure or cylindrical tensor-divergence mismatch. Their analysis is preserved in the sibling theorem-connection review artifacts; no original producer was changed.

## Portable commands

Use a modern Node.js runtime that supports ES modules and built-in `node:fs`/`node:perf_hooks`. Recorded execution used **Node v24.19.0 on Linux**. No npm installation or external package is required. From this directory:

```bash
node --check overlay/research-ide/mathscope-m3/navier/source-global-signed-full-pressure.mjs
node check_private_boundary.mjs
node --max-old-space-size=4096 run_actual_signed_stage.mjs
```

The first command checks syntax. The second imports the entire dependency closure and verifies that a genuine original serialized initialized packet is rejected by the unchanged private source boundary; the authentic fixture and hash are included. It is not a mathematical constructor test. A caller can supply a different fixture path as the first argument, but no serialized packet can satisfy the private seal.

The third command actually starts the unchanged constructor chain: original common admissible family → source band → fixed representative → current → signed current → original full auxiliary pressure → initial angular state → new signed pressure successor. All source authority is created by those constructors in the same process. It records a fifteen-minute cancellation budget and a 4096 MB V8 heap budget. These are explicit execution budgets, not mathematical hypotheses. The original constructor's coefficientOrder=1 is retained; its supported maximum M3 node budget of 4000000 is requested. The unchanged upstream constructor retains its own original finite budgets. Failure at any such budget does not imply a false source identity. This expensive optional run is separate from the Python baseline and original 1260-item verification.

## Recorded results

Syntax: exit 0. Module import/private serialized-packet boundary: exit 0, rejected with the original `INVALID_SOURCE_CONSTRUCTION` message. All 121 recovered dependencies were rehashed and matched their unchanged provenance records. `IMPLEMENTATION_CHECK_RECEIPT.json` also records the earlier fixture-path typo and its correction; that earlier attempt never entered mathematical code.

The first genuine attempt sealed the original signed current at 743303 nodes, then aborted at 281.1 seconds while the original pressure prerequisite was materializing derivative closure. Its chosen 2560 MB JavaScript heap was exhausted (process exit -6); this is a chosen resource limit, not a mathematical failure. The last progress node count was 1798192. Original attempt logs and precise scope are retained in `attempt1/`. One evidence-based retry raises the heap to 4096 MB and records completed-stage checkpoints.

The retried genuine constructor attempt is recorded in `ACTUAL_CONSTRUCTION_RECEIPT.json`, `ACTUAL_RUN_PROCESS.json`, and `logs/actual_construction.*`. The retry returned `PASS_ACTUAL_COMPATIBLE_PRETEMPORAL_SIGNED_STAGE`, process exit 0, in 355.34 seconds. It actually reached and completed the new pressure constructor and all three residual comparisons. Final graph: 1,891,447 nodes. The cheap import/source review checks remain distinct from this executed construction. The full velocity roots are `[1890658,1890659,1890660]`, latest mean pressure root `1890578`, and complete pressure root `1890662`. All three comparison numerators are exactly zero. `DENOMINATOR_DOMAIN_REVIEW.md/json` separately maps all ten listed rational denominator operands to their inherited original-domain nonzero arguments; zero numerators alone do not supply those premises.

## Remaining scope

The new entry explicitly requires the signed state to be the exact same original current as the initial angular state's current, uses the genuine zero pre-temporal mean correction, and rejects post-temporal inputs. A compatible later-current factory/induction is still needed to apply a signed correction after the forced stage. Missing saved checkpoint graphs are a replay limitation, not a mathematical nonexistence argument. No contraction, all-order bound, convergence or original-item completion is inferred from this patch.
