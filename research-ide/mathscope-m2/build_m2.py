"""Build additive static code and exact existing-page patches; zero new assets/pages."""
from pathlib import Path
import re,json,hashlib,subprocess,sys,gzip,tempfile

ROOT=Path(__file__).resolve().parent
WORK=ROOT.parent
BASELINE=ROOT/'evidence/baseline-v54-read-projection.html.gz'
BASELINE_READ_PROJECTION_SHA256='7bdf4cd11e35ab021d4d5686cdbdd709062f3675635eba523be6f16fbc7de948'
sha=lambda s:hashlib.sha256(s.encode() if isinstance(s,str) else s).hexdigest()
IMPORT=re.compile(r"^import\s+(\{[\s\S]*?\}|\*\s+as\s+\w+)\s+from\s+['\"]([^'\"]+)['\"];?\s*$",re.M)
REEXPORT=re.compile(r"^export\s+(\{[^}]+\}|\*)\s+from\s+['\"]([^'\"]+)['\"];?\s*$",re.M)

def bundle(entry):
    order=[];visiting=set();done=set()
    def target(p,value):
        if not value.startswith('.'):raise ValueError('External import disallowed: '+value)
        q=(p.parent/value).resolve()
        if not q.is_relative_to(WORK):raise ValueError('Import outside research code')
        if not q.exists():raise FileNotFoundError(q)
        return q
    def visit(p):
        if p in visiting:raise ValueError('Cyclic module graph: '+str(p))
        if p in done:return
        visiting.add(p);s=p.read_text()
        if re.search(r'\bimport\s*\(',s):raise ValueError('Dynamic code import disallowed: '+str(p))
        for pattern in (IMPORT,REEXPORT):
            for m in pattern.finditer(s):visit(target(p,m.group(2)))
        visiting.remove(p);done.add(p);order.append(p)
    visit(entry.resolve());symbols={p:'__m2_'+str(i) for i,p in enumerate(order)}
    out=['/* MathScope M2 — additive, static source-bound mathematical computation. */','(()=>{','"use strict";']
    for p in order:
        s=p.read_text();exports=[];stars=[]
        def replace_import(m):
            fields=m.group(1);dependency=symbols[target(p,m.group(2))]
            if fields.startswith('*'):return 'const '+fields.split()[-1]+' = '+dependency+';'
            return 'const '+re.sub(r'\s+as\s+',': ',fields)+' = '+dependency+';'
        s=IMPORT.sub(replace_import,s)
        def reexport(m):
            dependency=symbols[target(p,m.group(2))]
            if m.group(1)=='*':stars.append('...'+dependency);return ''
            for field in m.group(1)[1:-1].split(','):
                names=re.split(r'\s+as\s+',field.strip());src=names[0];dest=names[-1]
                # A re-export has no local binding in ESM. Re-declaring it here
                # collides when the same symbol is also imported for local use.
                exports.append(dest+': '+dependency+'.'+src)
            return ''
        s=REEXPORT.sub(reexport,s)
        exports.extend(re.findall(r'^export\s+(?:async\s+)?(?:function|class|const|let)\s+([\w$]+)',s,re.M))
        def list_export(m):
            for item in m.group(1).split(','):
                parts=re.split(r'\s+as\s+',item.strip());exports.append(parts[0] if len(parts)==1 else parts[1]+':'+parts[0])
            return ''
        s=re.sub(r'^export\s*\{([^}]+)\}\s*;?\s*$',list_export,s,flags=re.M)
        s=re.sub(r'^export\s+default\s+([\w$]+);?\s*$',lambda m:'',s,flags=re.M)
        s=re.sub(r'^export\s+','',s,flags=re.M)
        if re.search(r'^\s*(?:import|export)\s',s,re.M):raise ValueError('Unsupported ESM form: '+str(p))
        out.extend(['const '+symbols[p]+' = (()=>{',s,'return {'+','.join(stars+list(dict.fromkeys(exports)))+'};','})();'])
    out.append('})();')
    return '\n'.join(out),order

subprocess.run(['node',str(ROOT/'prepare-evidence.mjs')],check=True)
subprocess.run(['node',str(ROOT/'compat/build-m1-retention.mjs')],check=True)
worker,workerfiles=bundle(ROOT/'core/worker-entry.mjs')
(ROOT/'m2.worker.js').write_text(worker)
(ROOT/'core/worker-data.mjs').write_text('export const WORKER_SOURCE = '+json.dumps(worker,ensure_ascii=False)+';\nexport const WORKER_SHA256 = '+json.dumps(sha(worker))+';\n')
app,appfiles=bundle(ROOT/'workspace.mjs')
visual,visualfiles=bundle(ROOT/'visualization/global.mjs')
(ROOT/'workspace.bundle.js').write_text(app)
(ROOT/'visualization.bundle.js').write_text(visual)
for file in [ROOT/'m2.worker.js',ROOT/'workspace.bundle.js',ROOT/'visualization.bundle.js']:subprocess.run(['node','--check',str(file)],check=True)
if len(sys.argv)>2:raise SystemExit('Usage: python build_m2.py [baseline.html or baseline.html.gz]')
source=Path(sys.argv[1]) if len(sys.argv)>1 else BASELINE
source_bytes=source.read_bytes()
original_bytes=gzip.decompress(source_bytes) if source_bytes.startswith(b'\x1f\x8b') else source_bytes
if sha(original_bytes)!=BASELINE_READ_PROJECTION_SHA256:raise ValueError('Expected the preserved v54 provider read projection; a different baseline requires a new reviewed patch set')
original=original_bytes.decode('utf-8');candidate=original;patches=[]
def patch(find,replace):
    global candidate
    count=candidate.count(find)
    if count!=1:raise ValueError('Expected one exact anchor, found '+str(count)+': '+repr(find[:100]))
    patches.append({'operation':'replace','find':find,'replace':replace});candidate=candidate.replace(find,replace,1)
for p in json.loads((ROOT/'visualization/live-m1-patch.json').read_text()):patch(p['find'],p['replace'])
for p in json.loads((ROOT/'compat/m1-retention-patches.json').read_text()):patch(p['find'],p['replace'])
audit=json.loads((ROOT/'visualization/live-patch-audit.json').read_text())
textpatch=audit['recommendedHTMLTextPatch'];patch(textpatch['find'],textpatch['replace'])
patch('<title>MathScope v0.3.1 DEV — Mathematical IDE</title>','<title>MathScope v0.3.1 — M1 / M2 Research IDE</title>')
patch("document.title='MathScope v0.3.1 DEV — Stage 8 Hardening';","document.title='MathScope v0.3.1 — M1 / M2 Research IDE';")
patch('현재 v0.2.1 안정판 기능을 복제한 개발 브랜치입니다.','M1 관측 개선과 M2 계산 확장을 반영한 개발판입니다. 원문 기준별 상태는 M2 진행 현황에서 확인하세요.')
nav='        <button class="nav-btn" data-view-target="research-objects"><span class="nav-icon">M1</span><span>Actual Mathematical Objects</span></button>'
patch(nav,'        <button class="nav-btn" data-view-target="research-m2"><span class="nav-icon">M2</span><span>Extensions & Evidence</span></button>\n'+nav)
anchor='<section class="view m1" data-view="research-objects" id="mathscopeResearchM1" lang="ko">'
patch(anchor,(ROOT/'workspace.html').read_text()+'\n'+anchor)
patch('</head>','<style id="mathscope-m2-css">\n'+(ROOT/'workspace.css').read_text()+'\n</style>\n</head>')
patch("&& !location.hash.startsWith('#research-objects'))btn.click();","&& !location.hash.startsWith('#research-objects') && !location.hash.startsWith('#research-m2'))btn.click();")
safe=lambda s:s.replace('</script','<\\/script')
patch('<script id="mathscope-m1-js">','<script id="mathscope-m2-visualization-js">\n'+safe(visual)+'\n</script>\n<script id="mathscope-m1-js">')
patch('</body>','<script id="mathscope-m2-js">\n'+safe(app)+'\n</script>\n</body>')
(ROOT/'page-patches.json').write_text(json.dumps(patches,ensure_ascii=False))
with tempfile.NamedTemporaryFile(prefix='mathscope-m2-v0.3.1-',suffix='.candidate.html',delete=False) as candidate_file:
    candidate_file.write(candidate.encode('utf-8'))
    candidate_path=candidate_file.name
files=set(workerfiles+appfiles+visualfiles)
manifest={'schema':'MathScope.M2AdditiveBuild/1','target':'https://project29770.websitepublisher.ai/v0.3.1.html','baseVersion':54,'baseVersionHash':'16f4f911','originalReadProjectionSha256':sha(original),'candidateReadProjectionSha256':sha(candidate),'readProjectionContainsRedactions':'[REDACTED]' in original,'readHashScope':'Provider read projection only; opaque original values are preserved by targeted patches and runtime worker hashes are verified separately','patchCount':len(patches),'workerSha256':sha(worker),'workerBytes':len(worker.encode()),'bundleSha256':sha(app),'bundleBytes':len(app.encode()),'visualizationSha256':sha(visual),'visualizationBytes':len(visual.encode()),'sourceFiles':{str(p.relative_to(WORK)):sha(p.read_bytes()) for p in sorted(files)},'newAssets':0,'newPages':0,'originalM1WorkerPolicy':'UNCHANGED','protectedSourceFilesModified':False,'sourcePolicy':'STATIC_LOCAL_MODULE_GRAPH; NO EVAL; NO REMOTE EXECUTABLE INPUT','pagePolicy':'UNIQUE_ANCHOR_TARGETED_PATCHES_WITH_BASE_VERSION_HASH'}
manifest.update({'baselineArchive':str(BASELINE.relative_to(ROOT)),'baselineArchiveSha256':sha(BASELINE.read_bytes()),'pagePatchesSha256':sha((ROOT/'page-patches.json').read_bytes()),'candidateStorage':'TRANSIENT_SYSTEM_TEMPFILE; RECONSTRUCT_FROM_BASELINE_AND_PATCHES'})
(ROOT/'build-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({**{k:manifest[k] for k in ['patchCount','workerBytes','bundleBytes','visualizationBytes','workerSha256','bundleSha256']},'candidateTemporaryPath':candidate_path},ensure_ascii=False))
