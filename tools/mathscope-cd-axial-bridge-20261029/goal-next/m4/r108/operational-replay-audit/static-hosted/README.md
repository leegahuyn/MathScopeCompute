# R1-08: archived operational and private-candidate dependency audit

This is a read-only static audit of existing saved evidence. It does not
modify or query the operating site, prepare a new deployment, or duplicate
the prior pointer/rollback rehearsal. `inspect_hosted.mjs` pins six exact
inputs, decompresses the real isolated Worker's embedded HTML, compares the
historical HTML references and patch anchors, and records the Worker routing
and CSP in `static-hosted.json`.

The archived operational HTTP response is 30,707,818 bytes, SHA-256
`a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48`.
The isolated Worker embeds 28,928,002 candidate bytes with SHA-256
`0504482900dbeac2faf992be9a923bc51ab1de6bcec0b82ac058085444669735`.
The previously verified four-patch transform requires baseline SHA-256
`e6ebde6250a861296554f26305cb40200b0a70e822acb3f588e9dca423d6e784`,
which is not the archived operating response. Therefore its byte-pinned
replay cannot directly accept the operating response. An HTTP response is
not itself the authenticated editable WebsitePublisher source: the latter
and a mapping to its served representation remain independent inputs.

The original patch's exact replacement strings 1 and 2 each occur once in
the archived operating HTML. Their shorter `find` strings each occur only
as substrings of those replacement strings, so this is not evidence for an
additional unapplied copy. Exact replacement strings 3 and 4 do not occur;
each corresponding original `find` string does occur once outside the
replacement. The isolated candidate has each replacement exactly once.
This comparison uses literal byte sequences only; it does not prove that a
different implementation of patches 3 and 4 is absent, nor does it prepare
or validate an operational patch.

The operating snapshot also has an `/m3-picard-audit.html` iframe, absent
from this older isolated candidate. The isolated Worker handles only `/` and
`/v0.3.1.html`; other paths receive 404. Its CSP omits `frame-src`, so its
`default-src 'none'` also forbids frames. In the candidate HTML the literal
references include three external WebsitePublisher CSS assets, four external
WebsitePublisher scripts and a Google Fonts stylesheet. Its Worker permits
only self/inline for scripts and styles, self/data for fonts, and self for
connections; these external asset origins are not allowed. This exact
static mismatch supports the already recorded private-site screenshot defect,
but does not prove all individual requests were attempted or that any live
server is currently unchanged.

The previously completed pointer work already exists in
`goal-next/m4/r108/production-pointer-local`, with separate reversible
in-memory rehearsal and browser tests in `operational-replay-audit`. The
original R1-08 text requires prepared rollback materials, not an actual
production rollback. Existing independent review accepted the *separate
private candidate scope* and the recorded overall scoped M4 assessment is
16/16; neither establishes a production-site release. A production-targeted
claim still needs its exact editable-source baseline and mapping, a reviewed
target-specific change and recovery material, suitable asset/route/backend
handling if claiming those capabilities, provider recovery access, and an
actual matching deployment and post-publication screen with review. The
present archived candidate's partial M1/M2 evidence cannot supply those
production claims. RELEASE HOLD remains.

Reproduce this static readback from the workspace root (Node.js):

```text
node work/goal-next/continuation40/m4/inspect_hosted.mjs \
  work/goal-next/production-current-readback.html \
  work/goal-next/r108-isolated-site/dist/server/index.js \
  work/goal-next/r108-hosted-screen/actual-post-publication-screen.json \
  work/goal-next/r108/manifest.json work/goal-next/r108/patches.json \
  work/goal-next/continuation40/m4/static-hosted.json
```

On PowerShell use one line or its native continuation syntax. The archived
HTTP snapshot is evidence of the earlier observation, not a fresh network
read. No local Lean or Git action was performed.
