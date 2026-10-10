from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import re,json,hashlib,subprocess,gzip,sys
ROOT=Path(__file__).resolve().parents[1]
BASELINE=ROOT/'evidence/baseline-v54-read-projection.html.gz'
if len(sys.argv)>2:raise SystemExit('Usage: python check_assembly.py [baseline.html or baseline.html.gz]')
source=Path(sys.argv[1]) if len(sys.argv)>1 else BASELINE
source_bytes=source.read_bytes()
original_bytes=gzip.decompress(source_bytes) if source_bytes.startswith(b'\x1f\x8b') else source_bytes
manifest=json.loads((ROOT/'build-manifest.json').read_text())
sha=lambda value:hashlib.sha256(value.encode('utf-8') if isinstance(value,str) else value).hexdigest()
assert sha(original_bytes)==manifest['originalReadProjectionSha256'],'Baseline read projection differs from build manifest'
assert sha(BASELINE.read_bytes())==manifest['baselineArchiveSha256'],'Archived baseline differs from build manifest'
patch_bytes=(ROOT/'page-patches.json').read_bytes()
assert sha(patch_bytes)==manifest['pagePatchesSha256'],'Page patches differ from build manifest'
patches=json.loads(patch_bytes)
assert len(patches)==manifest['patchCount'],'Patch count differs from build manifest'
original=original_bytes.decode('utf-8');candidate=original
for index,patch in enumerate(patches):
    assert patch['operation']=='replace' and isinstance(patch['find'],str) and patch['find'],('Unsupported patch',index)
    assert isinstance(patch['replace'],str),('Invalid replacement',index)
    assert candidate.count(patch['find'])==1,('Expected one exact anchor',index,candidate.count(patch['find']))
    candidate=candidate.replace(patch['find'],patch['replace'],1)
assert sha(candidate)==manifest['candidateReadProjectionSha256'],'Reconstructed candidate differs from build manifest'
class Page(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.scripts={};self.script=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        if tag=='script':self.script=a.get('id')
    def handle_data(self,data):
        if self.script:self.scripts[self.script]=self.scripts.get(self.script,'')+data
    def handle_endtag(self,tag):
        if tag=='script':self.script=None
base=Page();base.feed(original)
new=Page();new.feed(candidate)
old_count=Counter(base.ids);count=Counter(new.ids)
new_duplicates={k:v for k,v in count.items() if v>max(1,old_count[k])}
assert not new_duplicates,new_duplicates
workers=[]
for p in [base,new]:
    matches=re.findall(r'^const WORKER_SOURCE = (.+);$',p.scripts['mathscope-m1-js'],re.M)
    assert len(matches)==1,len(matches)
    workers.append(hashlib.sha256(json.loads(matches[0]).encode()).hexdigest())
# The provider masks some opaque literals. Compare the same read projection;
# never overwrite the original Worker from that projection.
assert workers[0]==workers[1],workers
changed=subprocess.check_output(['git','diff','--name-only','55dacb898f8c204bf0c5925ea901d75d6c2d0f46'],cwd=ROOT.parents[1],text=True).splitlines()
old_changed=[p for p in changed if not p.startswith('research-ide/mathscope-m2/')]
assert not old_changed,old_changed
report={'schema':'MathScope.M2AssemblyAudit/1','newDuplicateIds':new_duplicates,'originalM1WorkerReadProjectionSHA256':workers[0],'candidateM1WorkerReadProjectionSHA256':workers[1],'readProjectionIsNotActualRuntimeSource':True,'originalM1RuntimeWorkerSHA256Observed':'0526fb1030c328e940c39672e86dfb9d24f09f4622794269c1e0eadbb92cc0ca','oldTrackedFilesChanged':old_changed,'newM2RootCount':count['mathscopeResearchM2'],'newM2ScriptCount':count['mathscope-m2-js'],'newVisualBootstrapCount':count['mathscope-m2-visualization-js'],'newAssets':0,'newPages':0,'pass':True}
report.update({'baselineArchive':str(BASELINE.relative_to(ROOT)),'baselineArchiveSha256':sha(BASELINE.read_bytes()),'originalReadProjectionSha256':sha(original_bytes),'candidateReadProjectionSha256':sha(candidate),'pagePatchesSha256':sha(patch_bytes),'patchCount':len(patches),'candidateSource':'RECONSTRUCTED_IN_MEMORY_FROM_BASELINE_AND_ORDERED_PATCHES'})
assert count['mathscopeResearchM2']==count['mathscope-m2-js']==count['mathscope-m2-visualization-js']==1
(ROOT/'evidence/assembly-audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
