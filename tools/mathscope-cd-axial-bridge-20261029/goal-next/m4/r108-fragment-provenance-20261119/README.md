# R1-08: authenticated fragment provenance against public response

**VERIFIED, partial.** A read-only WebsitePublisher `fragments(operation=list)` call for project 29770 returned 14 current fragment records and their complete content. In memory, the exact UTF-8 content was hashed with SHA-256. The custom independent JS hashing implementation was checked against the standard `abc` SHA-256 vector. The hashes, provider short version hashes, version numbers, timestamps, character lengths, and a short identification prefix were retained in `provider-fragment-digests.json`; full provider responses were not stored. The provider's eight-character version hashes equal the first eight SHA-256 characters for these observed records only; no general provider hash contract is assumed.

`verify-fragments.cjs` reads those recorded observations and the archived public HTTP body `production-v137-readback.html`. That body was independently freshly fetched 2026-11-19 13:42:38 UTC, with HTTP 200, 30,707,818 bytes, and SHA-256 `a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48` in the pre-existing `production-readback-20261119/public-http.json`. Every recorded prefix is unique in that snapshot. Taking each recorded UTF-16 character length and re-encoding the selected range to UTF-8 yields 14/14 full SHA-256 matches using Node's independent crypto implementation. The non-overlapping ranges cover 1,125,144 bytes, approximately 3.66% of the body: twelve `msr` recovery data fragments, one runtime, and one layout. A modified fragment is detected and an ambiguous prefix is rejected.

A previously prepared **offline-only** 122-byte pointer CSS insertion produces the local HTTP-body candidate `bed25212d4d3397d2c5d71092afe141ef87c165b6a9fba00d1827c97ef4d84a3`. The same 14 observed fragment SHA-256 values still match the candidate, showing that this particular local byte change preserves those fragment contents. Existing separate local browser checks and exact reverse-transform checks are in `m4/r108/operational-replay-audit`.

**Boundaries.** This matches the observed provider fragment digests to corresponding ranges of one previously retrieved public response, under standard SHA-256 collision resistance. Recorded hashes alone do not independently re-authenticate the provider: a reviewer must repeat the read-only connector call to reproduce that observation. The provider editable main page source and the rest of the served representation are not recovered or bound here, and no edit/restore capability is inferred. Version-content requests for versions 103 and 137 were earlier denied under the Free plan; the live rollback endpoint is a state-changing operation and was not called. The HTTP-body candidate is neither an editable-source patch nor a hosted production candidate. Thus operational R1-08 remains OPEN; the separate private candidate's recorded 16/16 scope and global RELEASE HOLD are unchanged.

The saved hash observation was processed locally after a read-only connector call completed by 2026-11-19 14:18 UTC. No remote write, rollback, publication, repository edit, or Lean compile was performed.

Reproduce the offline comparisons with Node.js:

```text
node verify-fragments.cjs provider-fragment-digests.json <archived-v137-http-body> fragment-public-binding.json
```

To repeat the online portion independently, call the WebsitePublisher connector `fragments` for project 29770 with `operation=list`, compute SHA-256 over each returned `content` in UTF-8, and compare all names, versions, content lengths and hashes against the digest file; do not publish or change any fragment. Keep the full connector response private if it contains sensitive content.
