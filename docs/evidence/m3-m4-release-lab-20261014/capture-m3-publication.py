import gzip,hashlib,json,re,urllib.request
from pathlib import Path
from datetime import datetime,timezone
root=Path(__file__).resolve().parent.parent
repo=root/'work/MathScopeCompute'
evidence=repo/'docs/evidence/m3-m4-release-lab-20261014'
baseline=gzip.decompress((evidence/'published-v105.html.gz').read_bytes()).decode('utf-8')
pattern=r'<script id="mathscope-m3-extended-engine-js">.*?</script>'
old=re.findall(pattern,baseline,re.S)
if len(old)!=1:raise ValueError('Ambiguous previous M3 script')
bundle=(repo/'research-ide/mathscope-m3/web/extended-engine.bundle.js').read_bytes()
new='<script id="mathscope-m3-extended-engine-js">\n'+re.sub('</script',lambda _:r'<\/script',bundle.decode('utf-8'),flags=re.I)+'\n</script>'
expected=baseline.replace(old[0],new,1).encode('utf-8')
with urllib.request.urlopen('https://project29770.websitepublisher.ai/v0.3.1.html',timeout=60) as response:raw=response.read()
if raw!=expected:
    actual=raw.decode('utf-8');i=next((i for i,(a,b)in enumerate(zip(actual,expected.decode('utf-8'))) if a!=b),min(len(actual),len(expected)))
    raise ValueError('Published bytes differ at '+str(i)+': '+repr(actual[i-50:i+100]))
actual_script=re.findall(pattern,raw.decode('utf-8'),re.S)
actual_bundle=actual_script[0].split('>\n',1)[1].rsplit('\n</script>',1)[0].encode('utf-8')
if actual_bundle!=bundle:raise ValueError('Actual Worker bundle differs from Git source')
model=json.loads(re.search(r'<script id="ms-r1-data" type="application/json">(.*?)</script>',raw.decode('utf-8'),re.S)[1])
receipt={'schema':'MathScope.M3.ExactPublishedBundle/1','readAt':datetime.now(timezone.utc).isoformat(),'url':'https://project29770.websitepublisher.ai/v0.3.1.html','pageVersion':106,'versionHash':'20181a02','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'previousVersion':105,'previousVersionHash':'a9cf0eb7','ownedElement':'mathscope-m3-extended-engine-js','bundlePath':'research-ide/mathscope-m3/web/extended-engine.bundle.js','bundleBytes':len(bundle),'bundleSHA256':hashlib.sha256(bundle).hexdigest(),'exactExpectedPageBytes':True,'unrelatedBytesPreserved':True,'R1ModelPreserved':True,'wholeM3Complete':False,'M4FinalAcceptance':'UNCONFIRMED','rollback':'Replace only the owned script by its exact v105 content recovered from published-v105.html.gz, with a freshly read version_hash. No rollback executed.'}
(evidence/'publication-v106.json').write_bytes(json.dumps(receipt,ensure_ascii=False,indent=2).encode('utf-8'))
print(json.dumps(receipt,ensure_ascii=False))
