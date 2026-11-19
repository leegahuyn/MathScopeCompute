# Directed length factor of the original shifted radial operators

The original fixed radial limits are a=sqrt(Xa) and b=2 sqrt(Xb).
The rate 4*b*(b-a)^2/a from the retained highest T0/T1 allocation is
bounded by 4*b^3/a. This calculation evaluates the exact log expression
log32+(3/2)log Xb−(1/2)log Xa, using the original directed Xb and source
Xa, and compares its upper endpoint with H/2^120. It also compares log2
with H/2^128. Both comparisons are strict.

    node evaluate_radial_length_cost.mjs GOAL_NEXT WORK NEW_RECEIPT.json
