# M3 Remaining Eight — Website visualization v107 (2026-10-14 KST)

## Ordering and deployed destination

The user's required sequence was honored: **WebsitePublisher project #29770 v0.3.1.html was patched and verified first** (v107, version hash `9dacbd43`), then this source snapshot was saved to GitHub. The deploy is public:
https://project29770.websitepublisher.ai/v0.3.1.html

This change is purely additive. It preserves v106 (hash `20181a02`), the original M3 evidence ledger and the official **56/64** acceptance count.

## Exact website-side sources

- `m3-remaining-eight-v107.html`: launcher + accessible eight-gate dialog.
- `m3-remaining-eight-v107.css`: responsive interactive workspace styling.
- `m3-remaining-eight-v107.js`: eight independently selectable finite, transparent sample visualizations, with source-linked original criteria and explicit OPEN guards.
- `tests/m3-remaining-eight-v107.test.mjs`: syntax and simulated-DOM interaction tests for all eight gates.

To reinsert safely into the platform page: use a version-hash-guarded targeted patch before the **single final** `</body>\n</html>`, inserting `<style id="ms-m3eight-style">` + CSS + `</style>`, then HTML, then `<script id="ms-m3eight-script">` + JS + `</script>`. Do not overwrite or reset the 29MB existing page; check for the IDs before applying the patch to avoid duplication.

## Eight distinct graphical studies

| Gate | Bounded view | Still required to claim original completion |
|---|---|---|
| N6-01 | Ordered five-component finite moment correction | Actual full-torus temporal inverse; latest complete pressure each step; exact constants/classes (9.9)-(9.10) |
| N6-02 | Independent direct versus decomposed scalar 1D residual with quadratic term | Actual 3D physical PDE, pressure, flat tail and complete error budget |
| N6-07 | Finite-stage `sigma_j=1/5+j/10` and illustrative common domain | All real `K_{m,l}`, log powers, derivative losses and uniform tail |
| N6-08 | Shrinking toy cutoff and omitted geometric-amplitude tail | Exact (9.21), curl, original Lemma 5.4 and source-dependent tail |
| N7-04 | Explicit flat toy's finite 0–2 time jets | All-order force jets, zero-origin spatial jets and C∞ bounds |
| N7-05 | Finite cutoff Taylor/Borel-like splice | All actual `F_j,b_j`, differentiated tail, exact compact support; not a velocity extension |
| N7-06 | One-mode ODE energy identity/quadrature defect | Actual whole fixed spatial K, independent space-time refinements and (10.13) |
| N8-05 | Four selectable independent toy refinement axes | Original pulse/axial/Fourier/order/precision enclosure, omitted tail, last positive τ |

**None of these bounded examples is an original-field proof.** The previous 56/64 remains untouched, and the eight mathematical gates remain OPEN. The page reads existing `ms-m4-data` original criteria and authoritative source links. No old failure receipts were altered.

## Verification

WebsitePublisher returned `status=live`, v107, hash `9dacbd43`; readback contains all HTML/CSS/JS IDs and retains the previous M3 and M4 UI. The JavaScript parser succeeded. A separate simulated DOM test executed all eight selectable panels, generated nonempty SVG paths, found the original criteria/OPEN warnings, and opened/closed the dialog.

Real Chromium/mobile layout, site Worker execution and original theorem proof were **not** newly certified by this change. Run the Node tests and browser regression separately.
