# R1-05 candidate browser audit

The original Blueprint 1.0 (99 pages, SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`) states R1-05 on page 68. Pages 18 and 85 state the 100 ms interaction p95 target. `budget.json` fixes the actual tested sample set and a 384 MiB sampled Chrome renderer memory bound before the final audit. The memory bound applies to the recorded Chrome renderer metric and 31 checkpoints per view. GPU and whole-system resident memory are outside that metric.

The isolated HTML candidate combines the existing v103 base bytes and the release-lab source tested through commit `e5113446c4d4ede3decd6107e6ab3dd52dce1697`. The unchanged candidate digest is `0504482900dbeac2faf992be9a923bc51ab1de6bcec0b82ac058085444669735`. Three CSS and three JavaScript resources are served from the immutable v117 read-only web intake archive for the candidate's same resource URLs. The test also serves the pinned Three.js 0.180.0 modules by content hash. Browser routing is isolated. Unrelated resources and live service calls are blocked. No site write or Lean run occurs.

The four observed cases use Chrome 157, 1200×900 desktop and 390×844 touch-emulated mobile, and both the original WebGL renderer through ANGLE SwiftShader and the original Canvas2D fallback with WebGL disabled. The P7-01 scene uses nine archived execution records. Each case renders 88 points and 88 lines with a single canvas and distinct scene pixels. The table, selected source sample and display domains match exactly across both backends and viewports. Keyboard rotation, reset, dialog selection and focus return were exercised. The two mobile cases also changed the sample by a touch tap. The displayed colors are representational. No mathematics result or release status is promoted by rendering.

| Case | p95 render interaction | Maximum sampled renderer bytes |
| --- | ---: | ---: |
| Desktop WebGL | 33.8 ms | 182,865,748 |
| Touch mobile WebGL | 25.9 ms | 124,036,190 |
| Desktop Canvas2D | 15.2 ms | 187,169,590 |
| Touch mobile Canvas2D | 19.9 ms | 122,535,659 |

Each row records 30 native arrow interactions. Timing starts in capture-phase keydown and ends when the renderer's own output reports the newly drawn frame. Both viewport widths and both modal widths match their scroll widths. All 292 non-whitespace characters of the long Lean type fit within the display column. The two mobile hanging spaces are recorded explicitly. The scene screenshots verify nonempty rendered pixels in an unobstructed canvas crop. No page errors or error overlays occur in these four cases. WebGL-disabled console diagnostics are expected and accompany the observed Canvas2D fallback.

An exploratory replay without the six external page assets made two inherited elements appear to overflow. Exact archived assets remove that overflow without source edits. The initial animation-frame polling method included an extra frame and gave 105.9 ms on desktop WebGL. The final measurement uses the renderer's actual output mutation and preserves that earlier receipt. A small layout experiment was discarded because the mobile fragments beyond the formula box were whitespace.

## Reproduction

Use the exact combined HTML generated with the original release-lab builder and source in the I3-08 evidence. Verify its SHA-256 against `candidate-build.json` before executing the browser test. Set `MATHSCOPE_PLAYWRIGHT_PATH`, `MATHSCOPE_PNGJS_PATH` and `MATHSCOPE_CHROME_PATH` for the local browser test dependencies. The test output includes Chrome version, recorded viewport and the fixture scope.

```text
python EVIDENCE/materialize_assets.py --repo REPOSITORY --out SCRATCH
node EVIDENCE/verify_r105.cjs SCRATCH CANDIDATE_HTML
```

Copy `budget.json` and `archive-asset-pins.json` to `SCRATCH` before running the Node command. `R1-05_RECEIPT.json` binds the tested source data, four rendered views, screenshot hashes, benchmark limits, and sampled timing and memory. The physical mobile hardware and the current operating web are outside this receipt.
