"""Build the M0 source modules and minimal, optimistic-lock page patches."""
from pathlib import Path
import re,json,hashlib

ROOT=Path(__file__).resolve().parent
BASE=ROOT/'baseline/v031.html'
manifest=json.loads((ROOT/'baseline/manifest.json').read_text())
(ROOT/'baseline-data.mjs').write_text('export const BASELINE = '+json.dumps(manifest,ensure_ascii=False)+';\n')

entries=['contracts.mjs','session.mjs','values.mjs','worker.mjs','compute.mjs','lean/shipped-proof-data.mjs','proof.mjs','baseline-data.mjs','integration.mjs','webmcp.mjs','acceptance.mjs','foundation.mjs']
symbols={name:'__m0_'+str(i) for i,name in enumerate(entries)}
compiled=['/* MathScope Research M0 1.0.0 — maintained modules; scoped evidence. */','(function(){','\"use strict\";']
for name in entries:
    source=(ROOT/name).read_text()
    def resolve(target):
        normalized=str((Path(name).parent/target).as_posix()).removeprefix('./')
        if normalized not in symbols: raise ValueError('Unknown import '+normalized)
        if entries.index(normalized)>=entries.index(name): raise ValueError('Dependency order '+name+' -> '+normalized)
        return symbols[normalized]
    def named(m):
        fields=re.sub(r'\s+as\s+',': ',m.group(1))
        return 'const {'+fields+'} = '+resolve(m.group(2))+';'
    source=re.sub(r"^import\s+\{([^}]+)\}\s+from\s+['\"]([^'\"]+)['\"];?\s*$",named,source,flags=re.M)
    source=re.sub(r"^import\s+\*\s+as\s+(\w+)\s+from\s+['\"]([^'\"]+)['\"];?\s*$",lambda m:'const '+m.group(1)+' = '+resolve(m.group(2))+';',source,flags=re.M)
    names=re.findall(r'^export\s+(?:async\s+)?(?:function|class|const|let)\s+([A-Za-z_$][\w$]*)',source,flags=re.M)
    for group in re.findall(r'^export\s+(?:const|let)\s*\{([^}]+)\}',source,flags=re.M):
        names.extend(x.strip().split(':')[-1].strip() for x in group.split(','))
    source=re.sub(r'^export\s+','',source,flags=re.M)
    if re.search(r'^\s*(?:import|export)\s',source,flags=re.M): raise ValueError('Unbundled statement '+name)
    compiled.extend(['const '+symbols[name]+' = (()=>{',source,'return {'+','.join(dict.fromkeys(names))+'};','})();'])
compiled.append('})();')
js='\n'.join(compiled)
(ROOT/'foundation.bundle.js').write_text(js)
html=(ROOT/'foundation.html').read_text();css=(ROOT/'foundation.css').read_text()
base=BASE.read_text();patches=[]
def patch(find,replace,label):
    global base
    if base.count(find)!=1: raise ValueError('Nonunique/missing anchor '+label)
    patches.append({'operation':'replace','find':find,'replace':replace})
    base=base.replace(find,replace,1)

nav='        <button class="nav-btn" data-view-target="research-extensions"><span class="nav-icon">RX</span><span>Prime / Cohomology / Gauge / Fluid</span></button>'
patch(nav,'        <button class="nav-btn" data-view-target="research-foundation"><span class="nav-icon">M0</span><span>Research Foundation</span></button>\n'+nav,'M0 nav')
anchor='<section class="view rx" data-view="research-extensions" id="v031ResearchExtensions">'
patch(anchor,html+'\n'+anchor,'M0 workspace')
patch('</head>','<style id="mathscope-m0-css">\n'+css+'\n</style>\n</head>','M0 CSS')

old=(ROOT/'baseline/validate-session.txt').read_text()
new=old.replace('    return errors;','''    if(s.researchM0!=null){
      const validator=window.MathScopeM0Contracts?.validateResearchM0Namespace;
      if(typeof validator!=='function')errors.push('M0 contract runtime unavailable; import cannot be validated');
      else errors.push(...validator(s.researchM0).errors.map(e=>'M0: '+e));
    }
    return errors;''')
patch(old,new,'legacy session validates M0')
q='''  function quarantineImportedSession(incoming){
    // Checkpoints are import data too: restoring one must not revive current proof.
    const pending=[incoming],seen=new Set();
    while(pending.length){
      const item=pending.pop();if(!item||typeof item!=='object'||seen.has(item))continue;seen.add(item);'''
patch(q,q+'''\n      if(item.researchM0){
        const quarantine=window.MathScopeM0Contracts?.quarantineResearchM0Namespace;
        if(typeof quarantine!=='function')throw Error('M0 import quarantine is unavailable');
        quarantine(item.researchM0);
      }''','nested checkpoint M0 quarantine')

commit='''  async function commitResearchM0(namespace,{expectedSessionId,expectedM0Revision,reason='M0 update'}={}){
    if(!expectedSessionId||expectedSessionId!==session.id)throw Error('M0 target session changed; retry in the selected session');
    const revision=session.researchM0?.revision??null;
    if(expectedM0Revision!==revision)throw Error('M0 revision changed; refresh before saving');
    const guarded=window.MathScopeM0Contracts;
    if(!guarded?.verifyResearchM0Namespace)throw Error('M0 contract runtime unavailable');
    const prepared=clone(namespace),report=await guarded.verifyResearchM0Namespace(prepared);
    if(!report.ok)throw Error('M0 validation: '+report.errors.slice(0,6).join(' | '));
    if(expectedSessionId!==session.id||(session.researchM0?.revision??null)!==revision)throw Error('Session changed during M0 validation; no changes saved');
    if(revision!==null&&prepared.revision<revision)throw Error('M0 namespace cannot roll back its revision');
    if(revision!==null&&prepared.revision===revision){
      if(guarded.canonicalStringify(prepared)===guarded.canonicalStringify(session.researchM0))return clone(session);
      throw Error('M0 content changes must advance the namespace revision');
    }
    const incoming=clone(session);incoming.researchM0=prepared;
    const parent='session:r'+incoming.sessionRevision;incoming.sessionRevision++;
    incoming.updatedAt=now();
    incoming.revisions.unshift(createRevisionRecord('session',incoming.id,'session:r'+incoming.sessionRevision,parent,'research-m0',String(reason).slice(0,250),'ADAPTER'));
    const nextStore={...store,sessions:{...store.sessions,[incoming.id]:incoming},updatedAt:now()};
    const serialized=JSON.stringify(nextStore);
    if(serialized.length>4.5*1024*1024)throw Error('M0 session exceeds local storage budget; export and start a smaller session');
    // A single atomic storage write precedes the in-memory state change.
    localStorage.setItem(STORAGE_KEY,serialized);
    store=nextStore;session=incoming;dirty=false;clearTimeout(autosaveTimer);
    log('STORE','Saved: '+String(reason).slice(0,250));renderAll();
    return clone(session);
  }

'''
patch('  function exposeApi(){',commit+'  function exposeApi(){','namespace commit bridge')
patch('      getSession:()=>clone(session),','      getSession:()=>clone(session),\n      commitResearchM0,','expose commit bridge')
oldrender="    renderTop(); renderTree(); renderInspector(); renderCanvas(); renderDock(); renderStageTests(); renderRecovery();window.MathScopeFailureUI?.refresh?.();"
patch(oldrender,oldrender+"\n    window.dispatchEvent(new CustomEvent('mathscope:session-rendered',{detail:{sessionId:session?.id,revision:session?.sessionRevision}}));",'session change notification')
patch("if(btn && !location.hash.includes('legacy'))btn.click();","if(btn && !location.hash.includes('legacy') && !location.hash.startsWith('#research-foundation'))btn.click();",'respect M0 deep link')
patch('</body>','<script id="mathscope-m0-js">\n'+js.replace('</script','<\\/script')+'\n</script>\n</body>','M0 runtime')

(ROOT/'page-patches.json').write_text(json.dumps(patches,ensure_ascii=False))
(ROOT/'v031-with-m0.html').write_text(base)
out={'schema':'MathScopeM0Build/1','target':manifest['page']['url'],'baseVersion':41,'baseVersionHash':'d400a17e','patchCount':len(patches),'bundleSha256':hashlib.sha256(js.encode()).hexdigest(),'bundleBytes':len(js.encode()),'pageBytes':len(base.encode()),'newAssets':0,'newPages':0,'releaseGate':'UNCHANGED / HOLD','files':{n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in entries+['foundation.html','foundation.css']}}
(ROOT/'build-manifest.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print(json.dumps({k:out[k] for k in ['patchCount','bundleBytes','pageBytes','bundleSha256','newAssets']}))
