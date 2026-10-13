"""Package an observed public document without changing it or promoting criteria."""
from pathlib import Path
import argparse, datetime, gzip, hashlib, json, re, subprocess

own = Path(__file__).resolve().parent
repo = own.parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--readback', type=Path, required=True)
args = parser.parse_args()
sha = lambda raw: hashlib.sha256(raw).hexdigest()
web = repo/'research-ide/mathscope-m4/web'
baseline_path = repo/'research-ide/mathscope-m3/evidence/all64-20261012/release56/candidate-v031-attempt2.html.gz'
baseline = gzip.decompress(baseline_path.read_bytes())
model = json.loads((web/'panel-model.json').read_bytes())
build = json.loads((web/'evidence/build-receipt.json').read_bytes())
authored = (web/'patch-fragment.html').read_bytes()
marker = b'<script type="application/json" id="ms-m4-data">'
assert authored.count(marker) == 1
start = authored.index(marker)+len(marker)
end = authored.index(b'</script>', start)
serialized = authored[start:end]
delivered_serialized = serialized.replace(b'\\u003c', b'<')
assert json.loads(serialized) == json.loads(delivered_serialized) == model
assert not re.search(rb'<(?:/?script|!--)', delivered_serialized, flags=re.I)
delivered = authored[:start]+delivered_serialized+authored[end:]
anchor = build['baselineCheck']['insertionAnchor'].encode()
assert baseline.count(anchor) == 1
candidate = baseline.replace(anchor, anchor+authored)
expected = baseline.replace(anchor, anchor+delivered)
actual = args.readback.read_bytes()
assert sha(baseline) == model['publicBaselineSha256'] == '6189fd98be1bcd857f9b4c65f980746b15ab4dd95d64c4b2a3d1fe9655056eb9'
assert sha(candidate) == build['baselineCheck']['candidateSha256'] == '6a1116bec4551d3f3826c636a2189d7d0d94ea9c0b847fc0f77a9790f7e1cf49'
assert actual == expected and actual.count(delivered) == 1
assert actual.replace(delivered, b'') == baseline
assert sha(actual) == 'e6ebde6250a861296554f26305cb40200b0a70e822acb3f588e9dca423d6e784'
versions = json.loads((own/'websitepublisher-version-readback.json').read_bytes())
assert versions['current_version'] == 103 and versions['current_version_hash'] == '34a95b22'
archive = gzip.compress(actual, compresslevel=9, mtime=0)
(own/'public-v103.html.gz').write_bytes(archive)
(own/'delivered-fragment.html').write_bytes(delivered)
attempts = []
for name in ['live-20261013093155594','live-20261013093618467','live-20261013095417465']:
    receipt_path = web/'evidence'/name/'receipt.json'
    receipt = json.loads(receipt_path.read_bytes())
    files = [{'path':p.relative_to(repo).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in sorted(receipt_path.parent.iterdir()) if p.is_file()]
    attempts.append({'name':name,'passed':receipt['passed'],'receipt':receipt_path.relative_to(repo).as_posix(),'receiptSHA256':sha(receipt_path.read_bytes()),'files':files})
final = json.loads((web/'evidence/live-20261013095417465/receipt.json').read_bytes())
assert final['passed'] is True and final['mathematicalCriteriaPromoted'] is False
assert len(final['results']) == 2
assert all(r['documentSHA256'] == sha(actual) and r['allOriginalBytesPreserved'] and not r['publicDocumentIntercepted'] for r in final['results'])
head = subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
record = {
    'schema':'MathScope.M4.EvidencePanelPublication/1',
    'packagedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'repository':'https://github.com/leegahuyn/MathScopeCompute','branch':'mathscope-m3-resume-20261013',
    'pullRequest':'https://github.com/leegahuyn/MathScopeCompute/pull/22',
    'publicationCheckpointCommit':head,'scope':'ORIGINAL_24_CRITERION_EVIDENCE_TRACKING_UI',
    'url':'https://project29770.websitepublisher.ai/v0.3.1.html','projectId':29770,
    'previousVersion':102,'previousVersionHash':'22764e0e','previousPublicSHA256':sha(baseline),
    'version':103,'versionHash':'34a95b22','publicBytes':len(actual),'publicSHA256':sha(actual),
    'authoredCandidateSHA256':sha(candidate),'authoredFragmentSHA256':sha(authored),'deliveredFragmentSHA256':sha(delivered),
    'publisherSerialization':'Only the inline JSON data literal \\u003c was decoded to <; both parse to the identical authoritative model. No executable code or prior byte changed.',
    'modelSHA256':sha((web/'panel-model.json').read_bytes()),
    'sourceVerifierSHA256':sha((web/'verify-live-panel.mjs').read_bytes()),
    'previousSnapshot':baseline_path.relative_to(repo).as_posix(),
    'snapshot':{'path':(own/'public-v103.html.gz').relative_to(repo).as_posix(),'bytes':len(archive),'sha256':sha(archive),'uncompressedSHA256':sha(actual)},
    'originalBytesPreserved':True,'modelSemanticEquality':True,'actualPublicDesktopMobileChecksPassed':True,
    'browser':{'name':'Chrome','version':final['browserVersion'],'desktopViewport':[1440,1050],'mobileViewport':[390,844],'physicalMobileDeviceTested':False},
    'attempts':attempts,
    'M3OriginalAccepted':56,'M3OriginalTotal':64,'M4FinalAcceptance':'UNCONFIRMED',
    'mathematicalCriteriaPromoted':False,'wholeM3Complete':False,'wholeM4Complete':False,'finalFreeze':False,
    'allRepositoryCIClaimedSuccessful':False,
    'rollback':{'execute':False,'expectedVersionHash':'34a95b22','findFile':(own/'delivered-fragment.html').relative_to(repo).as_posix(),'replace':'','requiredRecoveredSHA256':sha(baseline)}
}
(own/'PUBLICATION.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'publicSHA256':sha(actual),'archiveBytes':len(archive),'attempts':len(attempts),'allOriginalBytesPreserved':True,'mathematicalCriteriaPromoted':False}))
