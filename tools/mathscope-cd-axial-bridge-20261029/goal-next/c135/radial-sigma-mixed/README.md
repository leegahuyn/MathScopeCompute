# C135: three original Signed radial Sigma collar directions

The fixed-label recurrence for `Sigma_RRRZ`, `Sigma_RRRR`, and `Sigma_RRRT`
is replayed in the two original narrow collars. It is the original C108
conservative recurrence for protected source roots #22001223, #22001224,
and #22000443, with endpoints #17743711 and #17743713. The verifier expands
only the finite direction bank used by the pinned C125 trace; its values are
placeholders for enumerating the source dependencies, not norm bounds.

The recurrence contains 70 distinct typed pre-Signed covariance roles,
57 Forced directions, 312 initialized-mean roles and 1,435 Primary
covariance roles. The conservative Primary envelope has slow order 8,
time order 2, and transverse order 9. The only Primary covariance role
outside the common L8 ledger is `W_rz,(0,1,0,9)`; it is present in the
pinned original C129 individual L9 witness. No general L9 extrapolation is
made. The local stress demands have total order at most 4. The replay also
checks the exact polynomial chain rule for the three fourth-order local
directions: after each physical radial derivative the power of R drops by
one, and each direction requires at most four derivatives of the source
profile in q, X, eta.

**Conditional analytic implication.** Under the same original fixed-label
chart, frame positivity, admissible smooth coefficient, support, fixed
endpoints, Haar and Fourier inverse realization assumptions used in C134,
the C134 collar argument applies to these finite derivative lists. The
Primary and Forced waves have positive square-root Gaussian power, their
Haar products and initialized mean have Gaussian power one, and the local
stress retains power one with finite collar poles. The C107 source support
and positive-profile C8/leading-profile C16 plus cutoff C6 inputs supply
the necessary finite local derivatives; the original centered short radial
primitives retain the Gaussian power. Consequently each of the three listed
Sigma directions has Gaussian power one with some finite collar pole. This
does not assert a uniform epsilon grade or a numerical bound. The conditional
analytical implication is not a Lean theorem and is not established by the
placeholder values alone.

This packet is not a proof of the complete Repeat C1 aggregate, all charts,
unclipped-source equality, or final jets. Release remains HOLD.

Replay from a workspace containing the pinned inputs:

```text
python -B verify_radial_sigma_mixed.py --work WORK_GOAL_NEXT --goal ORIGINAL_REPO_GOAL_NEXT --runtime ORIGINAL_RESEARCH_IDE --out replay1.json
python -B verify_radial_sigma_mixed.py --work WORK_GOAL_NEXT --goal ORIGINAL_REPO_GOAL_NEXT --runtime ORIGINAL_RESEARCH_IDE --out replay2.json
```

The two JSON files are byte-identical. The nested C134 loader verifies the
hashes of the original source and prior evidence; the C125 loader separately
verifies the inherited original Sigma recurrence and its input pins.
