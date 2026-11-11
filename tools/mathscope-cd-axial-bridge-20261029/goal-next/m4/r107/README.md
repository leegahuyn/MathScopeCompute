# R1-07 walkthrough evidence

The original blueprint gives the criterion on page 68. The walkthrough guide and
machine-readable edits use exact source commit
`e5113446c4d4ede3decd6107e6ab3dd52dce1697`. Four scenarios dispatch 14 actual
browser Worker jobs through the normal release-lab and M1 Navier–Stokes views.

The source-backed NS validation includes an actual leading recurrence residual
comparison, a nonzero complete-equation residual at the checked leading-core
point, Taylor–Green finite differences and the pressure-sign control. The source
audit separately compares exact local tail bounds for the explicit rational
pressure datum. `R1-07_RECEIPT.json` records the results and their scopes.

## Open the tested candidate

Decompress `candidate.html.gz` to `candidate.html` and serve the directory on
loopback. Use a normal Chromium tab for the steps in `WALKTHROUGHS_KO.md`.

```text
python -m http.server 39217 --bind 127.0.0.1
```

Open `http://127.0.0.1:39217/candidate.html`. The candidate SHA-256 is in
`browser-build.json`. It was built reversibly from the archived v103 HTML.

## Audit the observed exports

In a copy of the evidence directory, materialize the tracked files in
`source-pin.json` from a full Git object store and run the audit. The
original browser records are in `raw/`. Set `MATHSCOPE_PLAYWRIGHT_PATH` and
`MATHSCOPE_CHROME_PATH` when using a local Playwright installation.

```text
python materialize.py REPO EVIDENCE e5113446c4d4ede3decd6107e6ab3dd52dce1697
python audit_walkthroughs.py EVIDENCE recheck.json
node replay_walkthroughs.cjs EVIDENCE FRESH_OUTPUT_DIRECTORY
python audit_walkthroughs.py EVIDENCE repeated.json --second FRESH_OUTPUT_DIRECTORY
```

For the automated replay, place the decompressed HTML under
`EVIDENCE/built/candidate.html` and copy `browser-build.json` to
`EVIDENCE/built/manifest.json`. The original build used the ordinary
`build-release-lab.py` with the archived v103 baseline, the passing
original release-lab fixture manifest and the recorded I3-07 kernel model.

The observed scope is the isolated candidate running the current source. The
production-site and human-review states are recorded separately in the receipt.
