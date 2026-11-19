# Successful same-source first correction

GitHub Actions run 44528954587 completed the original active-N3 first
correction on workflow commit `31c067839c27f7575e53a686a7ec10588b8d1b0b`.
It passed the setup preflight, including 29 original source-file pins and
six option-contract probes. This execution passed the previously blocked
post-Signed Temporal stage and constructed the original FiveMap and
full three-dimensional physical residual.

| Stage | Original graph nodes |
| --- | ---: |
| Original latest mean stress | 22,001,223 |
| Signed 162 successor | 22,032,001 |
| Centered post-Signed frontier | 22,032,009 |
| Exact formal Temporal inverse construction | 22,151,888 |
| Original FiveMap | 22,153,216 |
| Full physical residual | 22,153,565 |
| Direct versus split comparison root construction | 22,153,782 |

The external Python replay compares six complete stage records against the
actual runner log, confirms the three historically verified stage records
with only process RSS excluded, and checks the original Forced test
inventory. It binds the actual completed workflow metadata, option
probes, Signed test transcripts and their exact bytes. This evidence verifies
an actual same-source first-cycle construction.

The resulting residual roots are #22153560, #22153562 and #22153564. The
four new comparison roots are #22153774, #22153776, #22153778 and
#22153781 (divergence). They were constructed and saved as source node IDs.
Their exact reductions and the physical residual enclosures are open.
The separate full-graph independent analysis step was skipped by this
workflow configuration. A fresh read of the arithmetic dependencies of
these four comparison roots, with the direct roots as nonzero controls,
is needed to certify their actual identities on the same graph.

To replay the receipt, use the sibling `hosted-44029534187` from the prior
checkpoint and a fresh output path. Run in this directory with Python 3.

```text
python check_first_cycle_stages.py . ../hosted-44029534187 NEW_JSON --hosted-completed
```

The baseline controls in `verification-controls.json` use fresh copies of
the prior stopped artifact. They respectively force its completion status,
replace its first Forced check ID with the second check ID, and drop its
Temporal-frontier transcript record. The receipt validator rejects each
changed copy. The final workflow validation retains the stopped-baseline
checks and additionally validates the completed execution.

[GitHub run 44528954587](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44528954587)
