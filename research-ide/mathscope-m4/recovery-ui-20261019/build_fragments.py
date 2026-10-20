#!/usr/bin/env python3
"""Prepare supported SSI fragments and one guarded activation; no network writes.

Every stored fragment is complete HTML. The data fragments are inert script
elements. WebsitePublisher expands SSI includes server-side, with the one
complete runtime fragment last. No browser DOM installer or eval is used.
"""
import base64, gzip, hashlib, json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
WS = ROOT.parent
BEGIN = "<!-- MathScope M3 integrated 20261016 BEGIN -->"
END = "<!-- MathScope M3 integrated 20261016 END -->"
PART_SIZE = 12000

def sha(raw): return hashlib.sha256(raw).hexdigest()
def compact(value): return json.dumps(value, ensure_ascii=False, separators=(",", ":"))

def build():
    out = HERE / "generated/fragments"
    out.mkdir(exist_ok=True)
    whole = (HERE / "generated/integrated-block.html").read_text()
    preparation = json.loads((HERE / "generated/PREPUBLICATION_MANIFEST.json").read_text())
    data = (HERE / "generated/RECOVERY_UI_DATA.json").read_bytes()
    parsed = json.loads(data)
    assert parsed["revision"]["newEvidenceCommit"] == "cf98ec1e832d88317f0c07072b5053a88866c904"
    match = re.search(r'<script id="ms3ip-recovery-data" type="application/octet-stream" data-encoding="gzip-base64" data-bytes="(\d+)" data-sha256="([a-f0-9]{64})">([A-Za-z0-9+/=]+)</script>', whole)
    assert match and int(match[1]) == len(data) and match[2] == sha(data)
    encoded = match[3]
    assert gzip.decompress(base64.b64decode(encoded, validate=True)) == data
    assert whole.startswith(BEGIN + "\n") and whole.rstrip().endswith(END)
    pieces = [encoded[i:i + PART_SIZE] for i in range(0, len(encoded), PART_SIZE)]
    assert len(pieces) == 12
    name_prefix = "msr-20261019-cf98-" + sha(data)[:8]
    descriptor = '<script id="ms3ip-recovery-data" type="application/octet-stream" data-encoding="gzip-base64" data-bytes="' + str(len(data)) + '" data-sha256="' + sha(data) + '" data-parts="' + str(len(pieces)) + '"></script>'
    layout = whole[len(BEGIN) + 1:match.start()] + descriptor
    tail = whole[match.end():].strip()
    assert tail.endswith(END)
    runtime = tail[:-len(END)].strip()
    assert runtime.startswith('<script id="ms3ip-recovery-runtime">') and runtime.endswith('</script>')
    fragment_contents = [(name_prefix + "-layout", layout)]
    for index, piece in enumerate(pieces):
        content = '<script id="ms3ip-recovery-part-' + str(index).zfill(2) + '" type="application/octet-stream" data-ms3ip-part="' + str(index) + '">' + piece + '</script>'
        fragment_contents.append((name_prefix + "-data-" + str(index).zfill(2), content))
    fragment_contents.append((name_prefix + "-runtime", runtime))
    records = []
    for order, (name, content) in enumerate(fragment_contents):
        # A component must have complete style/script/dialog boundaries.
        for tag in ["script", "style", "dialog"]:
            assert len(re.findall(r"<" + tag + r"\b", content)) == content.count("</" + tag + ">"), (name, tag)
        request = {"project_id":29770,"operation":"create","name":name,"content":content}
        payload = compact(request).encode()
        assert len(payload) < 40000
        (out / (name + ".html")).write_text(content)
        (out / (name + ".request.json")).write_bytes(payload)
        records.append({"order":order,"name":name,"htmlPath":str((out / (name + ".html")).relative_to(ROOT)),"contentBytes":len(content.encode()),"contentSha256":sha(content.encode()),"requestPath":str((out / (name + ".request.json")).relative_to(ROOT)),"requestBytes":len(payload),"requestSha256":sha(payload),"initialOperation":"create","onNameConflict":"READ_AND_COMPARE; never overwrite or force","referencedByProductionBeforeActivation":False})
    includes = [f'<!--#wps-include fragment="{name}" -->' for name, _ in fragment_contents]
    stored_block = BEGIN + "\n" + "\n".join(includes) + "\n" + END
    rendered = BEGIN + "\n" + "\n".join(content for _, content in fragment_contents) + "\n" + END
    expanded = stored_block
    for (name, content), include in zip(fragment_contents, includes):
        assert expanded.count(include) == 1
        expanded = expanded.replace(include, content)
    assert expanded == rendered
    original = (WS / "website_audit/production-v117-public.html").read_text()
    start = original.index(BEGIN); stop = original.index(END, start) + len(END)
    old = original[start:stop]
    proposed = original[:start] + rendered + original[stop:]
    patch = {"project_id":29770,"slug":"v0.3.1.html","base_version_hash":"d7474dd6","patch_summary":"Activate 14 previously verified isolated recovery fragments. Original M3 62/64, M4 original acceptance unconfirmed, energy/tau null; source-pinned 80 criteria and actual stored intervals/cutoff cells. Preserve all outside engine bytes.","patches":[{"operation":"replace","find":old,"replace":stored_block}]}
    activation = compact(patch).encode()
    assert len(activation) < 25000
    (out / "activation-patch.json").write_bytes(activation)
    (out / "stored-block.html").write_text(stored_block)
    (out / "rendered-block.html").write_text(rendered)
    (WS / "website_audit/production-fragment-proposed.html").write_text(proposed)
    outside_before = original[:start] + original[stop:]
    a = proposed.index(BEGIN); b = proposed.index(END, a) + len(END)
    outside_after = proposed[:a] + proposed[b:]
    assert outside_before == outside_after
    scripts = re.findall(r'<script\b[^>]*>.*?</script\s*>', outside_before, re.S | re.I)
    report = {"schema":"MathScope.FragmentPublicationPlan/1","preparedOnly":True,"noFragmentOrPageMutationPerformed":True,"supportedTool":"mcp__codex_apps__websitepublisher_fragments","sourceRevision":parsed["revision"]["newEvidenceCommit"],"serverIncludeSyntax":'<!--#wps-include fragment="name" -->',"fragmentInventoryObservation":{"observer":"parent /root","operation":"list","durationSeconds":4.278,"fragments":[],"count":0,"observationSource":"Parent-provided actual successful tool response after the interrupted read bundle"},"fragments":records,"fragmentCount":len(records),"dataPartCount":len(pieces),"partCharactersMax":PART_SIZE,"dataSha256":sha(data),"decodedDataBytes":len(data),"all80OriginalCriteriaAnd35NativeAnd512CellsRetained":True,"runtimeSequence":"layout, 12 complete inert data scripts in fixed order, one complete runtime script; native bounded gzip decode and SHA-before-parse","dynamicDomInstaller":False,"evalOrFunctionConstructor":False,"activation":{"path":str((out / "activation-patch.json").relative_to(ROOT)),"bytes":len(activation),"sha256":sha(activation),"requiredCurrentVersion":117,"baseVersionHash":"d7474dd6","operations":1,"mustReadBeforeWrite":True,"gates":["All 14 new names have successful fragment create/readback evidence","No conflicting or missing fragment version","Current actual page still matches the guarded baseline","No paid change, asset deletion, other-page mutation, or force flag"]},"storedBlockBytes":len(stored_block.encode()),"renderedBlockBytes":len(rendered.encode()),"renderedBlockSha256":sha(rendered.encode()),"proposedPublicSha256":sha(proposed.encode()),"outsideMarkerBytesIdentical":outside_before==outside_after,"outsideScriptCount":len(scripts),"previousLargeCalls":"Attempts 1 and 2 remain without tool success/error; observed production unchanged through20:21 UTC; do not infer a size cause or resend them","interruptionHandling":"Record every response independently. On an ambiguous create, read fragment list/versions and compare before any retry. On activation409/ambiguity, read page version and actual public bytes; no blind retry.","billingOrQuotaChange":False,"quotaLimitationHandling":"If the supported operation rejects quota, retain local work and stop; no upgrade or deletion.","published":False}
    (out / "FRAGMENT_PUBLICATION_PLAN.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    return report

if __name__ == "__main__":
    report = build()
    print(json.dumps({"fragments":report["fragmentCount"],"dataParts":report["dataPartCount"],"requestBytes":[r["requestBytes"] for r in report["fragments"]],"activation":report["activation"],"renderedBlockBytes":report["renderedBlockBytes"],"renderedBlockSha256":report["renderedBlockSha256"],"published":False}, indent=2))
