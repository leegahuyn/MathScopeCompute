# Actual PostFive predecessor for the indexed Repeat correction

This readback pins the successful original run 44682703381. It uses its
first-cycle, candidate and full-export receipts and independently reads
the entire 22,380,596-record graph. The old source velocity is exactly
[#22153222, #22153223, #22153224], the pressure is #22153227, and the
conservative residual is [#22153560, #22153562, #22153564]. These are the
physical PostFive values dispatched into the actual Repeat producer.

Each full velocity component contains the corresponding original Signed
physical velocity and the new mean increment, with both roots checked.
The pressure retains the original full Signed pressure #22031665 and
adds the newly computed PostFive mean pressure change. The old mean
pressure enters with the negative sign. Neither the old full pressure
nor the old conservative residual is inferred to be zero.

The eight indexed fields in that candidate receipt are the prior Forced
and Signed velocity and angular pressure fields. The completed graph
export does not yet supply the four newly registered roots. The live
attachment run has a separate receipt and append stream. After
independent acceptance of that append, the three new angular velocity
roots and new angular pressure root must be evaluated against this exact
PostFive predecessor, with a new mean pressure refresh and new complete
conservative residual. The upper mode and energy obligations belong to
that updated field.

```text
python -B readback_postfive_predecessor.py HOSTED_44682703381_DIRECTORY postfive-predecessor.json
```
