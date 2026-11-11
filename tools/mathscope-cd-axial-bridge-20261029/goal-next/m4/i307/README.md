# I3-07 research scope audit

The original p.20 criterion is reproduced from the source-pinned M4 acceptance
matrix. The acceptance model and normal release-lab build both read the same
research boundary registry. The audit runs four actual M2/P8 perfect-prism
routes and validates each ordered comparison. It then replaces real edge
data with an algebraic name and recomputes the serialized digest. All four
altered diagrams are rejected by fresh original route recomputation.

The M4 graph guard rejects an exact conclusion copied to a hypothesis or
user axiom, a transitive dependency cycle, and a research or model claim
relabelled as a theorem. For an imported theorem the guard checks the claim
ID, exact target and printed type against a freshly read exact kernel
artifact receipt. A genuine historical finite M0 receipt passes the
structural import check. A serialized copy, wrong claim ID, wrong
target, changed type, missing receipt and algebraic name alone fail.

This guard checks literal target restatements and registered identities.
It remains a structural guard and issues no research-closure proof.
The four prismatic routes retain external-theorem scope. The browser
exercise uses an isolated reversible build of the archived v103 page.
The repository's existing 20 P8 contracts also pass with these sources.
No new Lean execution or deployment was required for this criterion.

## Reproduction

From this evidence directory run the following commands with Node 24, Python
3.12, Playwright and Chromium. Replace the absolute repository argument
with the checkout containing the source commit.

```text
python materialize.py MATHSCOPE_REPO . 294e36eb04a8269def23fe82a4d503d67a05d514
node audit_i307.mjs source I3-07_RECEIPT.json
node --test --test-reporter=tap source/research-ide/mathscope-m3/tests/p8-contracts.test.mjs
python -c "import gzip; from pathlib import Path; Path('baseline.html').write_bytes(gzip.decompress(Path('source/docs/evidence/m4-evidence-panel-v103-20261013/public-v103.html.gz').read_bytes()))"
python source/research-ide/mathscope-m4/web/build-release-lab.py --baseline baseline.html --out built --kernel kernel-model.json --verification source/research-ide/mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json
node verify_research_panel.cjs . browser-receipt.json
```

Set `MATHSCOPE_PLAYWRIGHT_PATH` to a local Playwright installation when it
cannot be resolved by Node. Set `MATHSCOPE_CHROME_PATH` to use an existing
Chrome installation. The browser receipt preserves the matching desktop
and mobile row data, keyboard behavior and reversible candidate hash.
