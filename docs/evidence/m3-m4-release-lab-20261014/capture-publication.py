import argparse, gzip, hashlib, json, re, urllib.request
from pathlib import Path
from datetime import datetime, timezone

parser=argparse.ArgumentParser()
parser.add_argument('--version',type=int,required=True)
parser.add_argument('--version-hash',required=True)
parser.add_argument('--gzip',action='store_true')
args=parser.parse_args()
root=Path(__file__).resolve().parent.parent
url='https://project29770.websitepublisher.ai/v0.3.1.html'
with urllib.request.urlopen(url,timeout=60) as response:
    raw=response.read()
    headers=dict(response.headers)
text=raw.decode('utf-8')
baseline_path=root/'work/live-before.html'
baseline=baseline_path.read_bytes() if baseline_path.exists() else gzip.decompress((root/'work/live-before.html.gz').read_bytes())
patches=json.loads((root/'work/r1-preview/patches.json').read_text(encoding='utf-8'))
candidate=baseline.decode('utf-8')
for patch in patches: candidate=candidate.replace(patch['find'],patch['replace'],1)
candidate=candidate.encode('utf-8')
platform_pattern=r'\n<!-- WPE-DEBUG[^>]*-->\n<script src="https://cdn.websitepublisher.ai/wpe/loader.js"[^>]*></script>\n\n\n<!-- WebsitePublisher.ai Powered-by Widget -->\n<div id="wpa-widget".*?\n</div>\n'
platform_expected=re.findall(platform_pattern,candidate.decode('utf-8'),re.S)
platform_actual=re.findall(platform_pattern,text,re.S)
if len(platform_actual)!=1 or platform_actual!=platform_expected:
    raise ValueError('Unexpected platform managed footer change')
model_pattern=r'(<script id="ms-r1-data" type="application/json">)(.*?)(</script>)'
actual_model=re.search(model_pattern,text,re.S)
expected_model=re.search(model_pattern,candidate.decode('utf-8'),re.S)
if json.loads(actual_model[2])!=json.loads(expected_model[2]):
    raise ValueError('Published mathematical model changed')
restored=text[:actual_model.start(2)]+expected_model[2]+text[actual_model.end(2):]
restored=re.sub(platform_pattern,'',restored,flags=re.S)
candidate_without_platform=re.sub(platform_pattern,'',candidate.decode('utf-8'),flags=re.S)
if restored!=candidate_without_platform:raise ValueError('Delivered owned source or unrelated content changed')
for patch in reversed(patches):
    if restored.count(patch['replace'])!=1:
        raise ValueError('Delivered patch is absent or nonunique: '+patch['find'][:70])
    restored=restored.replace(patch['replace'],patch['find'],1)
model=re.search(r'<script id="ms-r1-data" type="application/json">(.*?)</script>',text,re.S).group(1)
data=json.loads(model)
receipt={
    'schema':'MathScope.R1.PublishedReadback/1',
    'readAt':datetime.now(timezone.utc).isoformat(),
    'url':url,'pageVersion':args.version,'versionHash':args.version_hash,
    'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),
    'exactCandidateBytes':raw==candidate,
    'unrelatedBytesPreserved':restored==re.sub(platform_pattern,'',baseline.decode('utf-8'),flags=re.S),
    'platformManagedFooter':'Exact existing WPE loader and powered-by widget relocated after new owned content by platform; unchanged bytes verified.',
    'inlineModelSemanticsPreserved':True,
    'modelEscapingNote':'Platform decodes JSON \\u003c to < in application/json. Parsed mathematical model is identical; all owned executable source bytes match.',
    'baselineSHA256':hashlib.sha256(baseline).hexdigest(),
    'inlineModelSHA256':hashlib.sha256(model.encode()).hexdigest(),
    'fixtures':len(data['catalog']['fixtures']),
    'refinementAxes':len(data['catalog']['refinementPlan']),
    'wholeM3Complete':False,
    'headers':{k:v for k,v in headers.items() if k.lower() in ('content-type','last-modified','etag','cache-control')},
    'rollback':'Reverse forward-patches.json in reverse order with a freshly read version_hash. No rollback executed.'}
if not receipt['unrelatedBytesPreserved']:raise ValueError('Unrelated delivered bytes changed')
out=root/'work/MathScopeCompute/docs/evidence/m3-m4-release-lab-20261014'
out.mkdir(exist_ok=True,parents=True)
(out/f'publication-v{args.version}.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf-8')
if args.gzip:
    (out/f'published-v{args.version}.html.gz').write_bytes(gzip.compress(raw,compresslevel=9,mtime=0))
print(json.dumps(receipt,ensure_ascii=False))
