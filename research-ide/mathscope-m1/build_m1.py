"""Static dependency bundler and precise, non-destructive WebsitePublisher patches.

No downloaded source is ever evaluated in the browser. The worker graph is built
only from versioned local application modules. Fail on unsupported ESM syntax.
"""
from pathlib import Path
import re,json,hashlib,subprocess

ROOT=Path(__file__).resolve().parent
WORK=ROOT.parent
sha=lambda s:hashlib.sha256(s.encode() if isinstance(s,str) else s).hexdigest()
IMPORT=re.compile(r"^import\s+(\{[\s\S]*?\}|\*\s+as\s+\w+)\s+from\s+['\"]([^'\"]+)['\"];?\s*$",re.M)
REEXPORT=re.compile(r"^export\s+\{([^}]+)\}\s+from\s+['\"]([^'\"]+)['\"];?\s*$",re.M)

def bundle(entry):
    order=[];visiting=set();done=set()
    def target(p,value):
        if not value.startswith('.'):raise ValueError('External import disallowed: '+value)
        q=(p.parent/value).resolve()
        if not q.is_relative_to(WORK):raise ValueError('Import outside project')
        if not q.exists():raise FileNotFoundError(q)
        return q
    def visit(p):
        if p in visiting:raise ValueError('Cyclic module graph: '+str(p))
        if p in done:return
        visiting.add(p);s=p.read_text()
        if re.search(r'\bimport\s*\(',s):
            raise ValueError('Dynamic import is not supported by the static Worker graph: '+str(p))
        for pattern in (IMPORT,REEXPORT):
            for m in pattern.finditer(s):visit(target(p,m.group(2)))
        visiting.remove(p);done.add(p);order.append(p)
    visit(entry.resolve());symbols={p:'__m1_'+str(i) for i,p in enumerate(order)}
    out=['/* MathScope M1 — static audited-domain application bundle. */','(()=>{','"use strict";']
    for p in order:
        s=p.read_text();exports=[]
        def replace_import(m):
            fields=m.group(1);dependency=symbols[target(p,m.group(2))]
            if fields.startswith('*'):return 'const '+fields.split()[-1]+' = '+dependency+';'
            fields=re.sub(r'\s+as\s+',': ',fields)
            return 'const '+fields+' = '+dependency+';'
        s=IMPORT.sub(replace_import,s)
        def reexport(m):
            dependency=symbols[target(p,m.group(2))];local=[]
            for field in m.group(1).split(','):
                names=re.split(r'\s+as\s+',field.strip());src=names[0];dest=names[-1]
                local.append(src if src==dest else src+': '+dest);exports.append(dest)
            return 'const {'+','.join(local)+'} = '+dependency+';'
        s=REEXPORT.sub(reexport,s)
        exports.extend(re.findall(r'^export\s+(?:async\s+)?(?:function|class|const|let)\s+([\w$]+)',s,re.M))
        def list_export(m):
            for item in m.group(1).split(','):
                parts=re.split(r'\s+as\s+',item.strip());exports.append(parts[0] if len(parts)==1 else parts[1]+':'+parts[0])
            return ''
        s=re.sub(r'^export\s*\{([^}]+)\}\s*;?\s*$',list_export,s,flags=re.M)
        s=re.sub(r'^export\s+','',s,flags=re.M)
        if re.search(r'^\s*(?:import|export)\s',s,re.M):raise ValueError('Unsupported ESM form: '+str(p))
        out.extend(['const '+symbols[p]+' = (()=>{',s,'return {'+','.join(dict.fromkeys(exports))+'};','})();'])
    out.append('})();')
    return '\n'.join(out),order

worker,workerfiles=bundle(ROOT/'core/worker-entry.mjs')
(ROOT/'m1.worker.js').write_text(worker)
(ROOT/'core/worker-data.mjs').write_text('export const WORKER_SOURCE = '+json.dumps(worker,ensure_ascii=False)+';\nexport const WORKER_SHA256 = '+json.dumps(sha(worker))+';\n')
app,appfiles=bundle(ROOT/'workspace.mjs')
(ROOT/'workspace.bundle.js').write_text(app)
for file in [ROOT/'m1.worker.js',ROOT/'workspace.bundle.js']:
    subprocess.run(['node','--check',str(file)],check=True)
patches=[]
def patch(find,replace):patches.append({'operation':'replace','find':find,'replace':replace})

# Extend only the specific M0 schema and session-kind clauses. No fetched or
# redacted original bundle is used as a replacement payload.
contracts=(WORK/'mathscope-m0/contracts.mjs').read_text()
anchor="  AssumptionSpec:schema('AssumptionSpec',{...assumption.properties},assumption.required),"
addition=contracts[contracts.index(anchor):contracts.index("  PrismSpec:schema('PrismSpec',")]
patch(anchor,addition.rstrip())
anchor="  if (kind==='PrecisionBudget') precisionSemantics(value,errors);"
addition=contracts[contracts.index(anchor):contracts.index("  if (kind==='PrimeQuerySpec') {")]
patch(anchor,addition.rstrip())
session=(WORK/'mathscope-m0/session.mjs').read_text()
for prefix in ['const KIND_MAP=Object.freeze(', '    const allowed={object:']:
    new=next(line for line in session.splitlines() if line.startswith(prefix))
    old=new.replace("M1ObjectSpec:'object',",'').replace("'M1ObjectSpec',",'')
    patch(old,new)
nav='        <button class="nav-btn" data-view-target="research-foundation"><span class="nav-icon">M0</span><span>Research Foundation</span></button>'
patch(nav,'        <button class="nav-btn" data-view-target="research-objects"><span class="nav-icon">M1</span><span>Actual Mathematical Objects</span></button>\n'+nav)
anchor='<section class="view m0" data-view="research-foundation" id="mathscopeResearchM0">'
# The live M0 section's precise class/attributes are read from the existing local source.
m0html=(WORK/'mathscope-m0/foundation.html').read_text()
anchor=m0html.splitlines()[0]
patch(anchor,(ROOT/'workspace.html').read_text()+'\n'+anchor)
patch('</head>','<style id="mathscope-m1-css">\n'+(ROOT/'workspace.css').read_text()+'\n</style>\n</head>')
patch("if(btn && !location.hash.includes('legacy') && !location.hash.startsWith('#research-foundation'))btn.click();","if(btn && !location.hash.includes('legacy') && !location.hash.startsWith('#research-foundation') && !location.hash.startsWith('#research-objects'))btn.click();")
patch('</body>','<script id="mathscope-m1-js">\n'+app.replace('</script','<\\/script')+'\n</script>\n</body>')
(ROOT/'page-patches.json').write_text(json.dumps(patches,ensure_ascii=False))
manifest={'schema':'MathScope.M1Build/1','target':'https://project29770.websitepublisher.ai/v0.3.1.html','baseVersion':44,'baseVersionHash':'4d79dd82','patchCount':len(patches),'workerSha256':sha(worker),'workerBytes':len(worker.encode()),'bundleSha256':sha(app),'bundleBytes':len(app.encode()),'sourceFiles':{str(p.relative_to(WORK)):sha(p.read_bytes()) for p in set(workerfiles+appfiles)},'newAssets':0,'newPages':0,'sourcePolicy':'STATIC_LOCAL_GRAPH_ONLY','originalPagePolicy':'PRECISE_PATCHES_PRESERVE_UNRELATED_CONTENT_AND_OPAQUE_HASHES'}
(ROOT/'build-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({k:manifest[k] for k in ['patchCount','workerBytes','bundleBytes','workerSha256','bundleSha256']},ensure_ascii=False))
