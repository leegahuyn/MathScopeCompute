# Rejected historical attempt

The original JSON reports that its target width was met, but root review
found that `collar_factor=sub(ONE,scale(collar,2))` represented the point
`1-2 epsilon`, not the required interval `[1-2 epsilon,1]`. The proof of
the flat collar needs the upper endpoint 1. Therefore this run is not an
accepted continuous enclosure, irrespective of its very small numerical
width. The producer and receipt are preserved without alteration.

The corrected implementation forms both endpoints explicitly and records
them in `attempts/pressure-prefix-0002/receipt.json`. Accepted dependent
receipts pin that run and reject this one.
