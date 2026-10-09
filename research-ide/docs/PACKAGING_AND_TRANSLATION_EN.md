# Packaging, translation, and archive restoration

## What “English edition” means

The English edition supplies a complete English entry point for understanding and running the delivered M0/M1 implementation:

- The README, installation/reproduction guide, mathematical-scope guide, evidence guide, packaging guide, and status guide.
- All **70 original titles, implementation requirements, and acceptance criteria**, translated with IDs, ordering, baseline statuses, and per-record source digests preserved.
- Detailed English descriptions of **all eight NS follow-up families** and **all nine outstanding v54 gates**.
- A **59-example English presentation catalog** and a launcher using the original engine.
- Integrity, original-archive restoration, and English ZIP packaging utilities.

It does **not** rewrite the bytes of mathematical sources, canonical requests, fixture outputs, Lean files, original acceptance records, historical logs, Korean documents, or source manifests. Those remain provenance. Some internal source comments, raw result diagnostics, and stored original labels therefore remain in Korean. The deployed browser UI is not automatically translated or redeployed by this package.

The English catalog is a presentation layer only. `run` delegates to the original pinned CLI without changing the request. `list --json` supplies English labels beside the original labels and unmodified request objects. Translation is not a mathematical change or evidence promotion.

## The original archive

The original delivered archive is:

```text
MathScope_M0_M1_Source_and_Evidence.zip
bytes: 73559111
SHA-256: ccc8d6dd7bc85f8e5a054aa04c0adab6f1ebd3172a175c667180cf9ef75b58f9
```

It contains **935 original files plus `PACKAGE_MANIFEST.json`**. Its original source manifest is preserved exactly as [provenance/original-v54-PACKAGE_MANIFEST.json](../provenance/original-v54-PACKAGE_MANIFEST.json). All original members were checked against that manifest before selection.

## Git source tree versus full distribution ZIP

The normal source tree retains **693 original files**, totaling **45,459,669 bytes**, including every mathematical source, execution contract, numerical fixture, independent reference, Lean source/audit, failure history, and current final screenshot present in the original archive. The other **242 generated QA or historical screenshot images**, totaling **69,382,139 bytes**, can be stored separately under `archive-members/<original path>`. No computation source or mathematical evidence text is omitted from the normal tree.

The complete normal-tree/archive-member selection and every original digest are in [source-selection.json](../provenance/source-selection.json). Its `omitted` list means omitted from the normal source tree; those entries can be restored from the original archive or the separate auxiliary-member directory. English guides link directly to available source/evidence files and describe archived images separately.

The normal Git source tree is independently runnable without the archived images. When the auxiliary directory is also committed, GitHub Actions can rebuild the full 935-member English distribution without downloading an earlier ZIP or sending a large opaque ZIP blob to Git. The auxiliary images do not become computation inputs. External papers, installed dependencies, toolchains, caches, and the whole external proof repository were already outside the original source archive.

## Build a self-contained English ZIP from the Git tree

Run from `research-ide/`:

```bash
python3 tools/verify_english_release.py
python3 tools/package_english_release.py --output ./dist/MathScope_M0_M1_English.zip
```

This creates a runnable English distribution from the preserved Git sources and English companions. The archive contains its own complete member manifest with byte lengths and SHA-256. The tool checks source pins, English bindings, CRCs, every member digest, and source stability during packaging. It does not build Lean or deploy MathScope.

The output must be new unless `--force` is explicitly supplied. `dist/` is excluded from Git. A generated ZIP is a release artifact rather than a file that needs to be committed back into the source tree.

## Reconstruct the full English distribution from Git members

When `archive-members/` contains all 242 auxiliary originals, run:

```bash
python3 tools/package_english_release.py \
  --archive-members ./archive-members \
  --output ./dist/MathScope_M0_M1_English_Full.zip
```

The tool checks every auxiliary member against the immutable original manifest, combines it with the 693 normal source members, and requires exactly **935 original members**. It restores the images to their original member paths in the ZIP. It does not include a second `archive-members/` copy. The preserved original package manifest is included under `provenance/`.

The full distribution also includes English companions and explicitly allowed post-v54 addons, with a new complete ZIP manifest. It verifies that the original member bytes are identical. It does not claim that the new ZIP container has the same SHA-256 as the earlier Korean archive.

## Build the full English distribution from the original ZIP

If the original archive is available, use:

```bash
python3 tools/package_english_release.py \
  --original-archive /path/to/MathScope_M0_M1_Source_and_Evidence.zip \
  --output ./dist/MathScope_M0_M1_English_Full.zip
```

This verifies the exact original archive hash and all its entries, then includes **all 935 original files with their exact bytes**, the original package manifest under its provenance name, the English companions, and explicitly allowed post-v54 addons. The distribution's own manifest distinguishes construction from the original ZIP from construction using preserved Git and auxiliary members.

The compact/full distinction concerns rendered artifacts. Both distributions include the same original mathematical source and evidence text. The full edition does not improve an acceptance status or proof grade merely by adding the rendered QA images.

## Restore the original archive exactly

To recover the original 935 members and original root manifest into a separate new directory:

```bash
python3 tools/restore_original_archive.py \
  /path/to/MathScope_M0_M1_Source_and_Evidence.zip \
  --destination /path/to/new-v54-original-directory
```

The tool verifies the expected archive SHA, exact member set, CRCs, each member digest, and safe relative paths before extracting. It refuses an existing destination. It does not contact a network service, modify this release, or replace a later user's files.

## Source and English manifests

`SOURCE_TRANSLATION_MANIFEST.json` binds:

1. The original archive and original manifest identities.
2. The preserved-source selection manifest and all 50 computation-source pins.
3. Every English document, localization record, and utility by digest.
4. The 70 translated criterion IDs and 59 example IDs.
5. The optional auxiliary-image storage policy and its original-manifest membership.
6. The frozen baseline scope and the fact that translation does not modify computation.

New mathematical work can be included below the explicit roots in `provenance/addon-allowlist.json`. The source-coherence and uniform-gluing directories under `mathscope-m1/navier/followup-next/` are **post-v54 additions**, not replacements of original members. The manifest lists them in a separate category with their own hashes. The 50 v54 source pins and 693 original-file checks remain unchanged, and the original 70-entry assessment is not promoted automatically.

After intentionally editing an English document or finalizing an allowed addon, regenerate the English manifest with:

```bash
python3 tools/verify_english_release.py --write-manifest
python3 tools/verify_english_release.py
```

This command still refuses any changed original file or invalid translation coverage. It cannot legitimize a modified original mathematical source. New mathematics must occupy an explicitly allowed new path, receive a separate assessment, and keep its own source hashes; the historical source-selection record remains unchanged.

## Attribution and third-party material

Original license files remain unchanged at their original relative paths, including the license for the selected external NS source files. The original archive includes only the specifically selected unchanged external files, not the full paper or all external repositories. Source URLs and the pinned external commit are recorded in the original evidence.

This documentation does not assign a new license to inherited third-party code, source formulas, paper text, or historical evidence. Any repository-wide licensing decision must respect those existing notices and the rights in the original MathScope code.
