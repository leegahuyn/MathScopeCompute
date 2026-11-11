# Independent readback for GitHub N=2 job 43020929929

`check_n2_selector_receipt.py` consumes the actual runner's
`original-n2-prefix.json` stage file. It can verify a sealed band
stage while later stages are pending or after a later-stage error.
It records which original private stages the runner completed.

The stage readback checks the original source commit, optional
workflow HEAD, historical scale links, the original predecessor,
all 20 `b3` diagonal clauses and their derivative orders, the N=2
window, the two active background rows, and the recorded strict
interior chart point. If current and pressure are complete, it
also checks the exact omitted-order condition and named roots.

Optional `--graph-dir` authenticates the original gzip node stream,
registry and manifest against the stage snapshot. The reader spools
the raw stream to a temporary file and uses a compact offset array.
It avoids reserializing the graph or parsing every node into a
resident Python object. It checks the authenticated first 117,100
node hash and opens exact literal source anchors for the selector
maximum, growth, scale, clause logs and positive norm bounds,
window floor, interior chart formulas and active axial stress and
cutoff roots. A smaller JSON dictionary of exact nodes can be
supplied with `--anchors` instead.

Run from this evidence directory:

    python check_n2_selector_receipt.py ARTIFACT/original-n2-prefix.json n2-selector-readback.json --executing-commit 65fda3014857997255fe0b839847d627921b1348

For a completed graph append:

    --graph-dir ARTIFACT/original-n2-current-pressure-graph

The in-memory stage and AST controls verify schema handling and
reject an omitted diagonal clause and a window built from `b2`
instead of `b3`. The independent gzip-reader control authenticated
the existing original N=1 export with 4,420,257 nodes and checked
the stored axial support and window anchors. These controls
validate the checker. The official run 43020929929 produced
a separate N=2 artifact and the independent readback passed.
The paired original pressure/domain and normalization-face
replays use the same exported graph:

    python check_n2_axial_pressure_domain.py ARTIFACT n2-axial-pressure-domain.json --executing-commit 65fda3014857997255fe0b839847d627921b1348
    python check_n2_order_one_faces.py --artifact ARTIFACT --github-metadata github-run-43020929929.json --selector-readback n2-selector-readback.json --out n2-order-one-faces.json
