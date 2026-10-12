"""Extend an observed page with P8 and six M3 workspaces, preserving existing code."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,re
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('p8_patch',ROOT/'build_p8_patch.py');P8=importlib.util.module_from_spec(spec);spec.loader.exec_module(P8)
def sha(x):return hashlib.sha256(x.encode()).hexdigest()
SOURCES=['extended-workspace.html','extended-workspace.css','extended-engine.bundle.js','extended-workspace.js']
OLD_FOUNDATION_GUARD="!location.hash.startsWith('#research-m3'))btn.click();"
NEW_FOUNDATION_GUARD="!location.hash.startsWith('#research-m3') && !location.hash.startsWith('#research-gauge-m3') && !location.hash.startsWith('#research-fluid-m3'))btn.click();"
def build(original):
 if 'data-e3="g3"' in original:raise ValueError('Extended M3 workspace already exists: use exact block updates, not a fresh insertion')
 if 'id="mathscopeResearchM3P8"' in original:raise ValueError('P8 already exists: inspect current page before creating a new patch')
 patches,candidate,p8manifest=P8.build(original)
 def patch(find,replace):
  nonlocal candidate
  if candidate.count(find)!=1:raise ValueError('Expected unique M3 anchor '+find[:90])
  patches.append({'operation':'replace','find':find,'replace':replace});candidate=candidate.replace(find,replace,1)
 sources={n:(ROOT/n).read_text() for n in SOURCES}
 nav='<button class="nav-btn" data-view-target="research-m3-p8"><span class="nav-icon">P8</span><span>Structure &amp; Review</span></button>'
 patch(nav,nav+'\n        <button class="nav-btn" data-view-target="research-gauge-m3"><span class="nav-icon">Y5+</span><span>Gauge · M3</span></button>\n        <button class="nav-btn" data-view-target="research-fluid-m3"><span class="nav-icon">N6+</span><span>Fluid · M3</span></button>')
 patch('<section class="view m1 m2"',sources['extended-workspace.html']+'\n<section class="view m1 m2"')
 patch('</head>','<style id="mathscope-m3-extended-css">\n'+sources['extended-workspace.css']+'\n</style>\n</head>')
 scripts=[]
 for element_id,name in [('mathscope-m3-extended-engine-js','extended-engine.bundle.js'),('mathscope-m3-extended-workspace-js','extended-workspace.js')]:
  content=re.sub(r'</script',lambda m:'<\\/script',sources[name],flags=re.I);scripts.append('<script id="'+element_id+'">\n'+content+'\n</script>')
 patch('<script id="mathscope-m2-js">','\n'.join(scripts)+'\n<script id="mathscope-m2-js">')
 patch(OLD_FOUNDATION_GUARD,NEW_FOUNDATION_GUARD)
 restored=candidate
 for p in reversed(patches):
  if restored.count(p['replace'])!=1:raise ValueError('Non-unique reverse patch')
  restored=restored.replace(p['replace'],p['find'],1)
 if restored!=original:raise ValueError('Unrelated page bytes changed')
 # Verify every existing script, allowing only the two explicit routing guards.
 ids=re.findall(r'\bid="([^"]+)"',sources['extended-workspace.html'])
 if len(ids)!=len(set(ids)):raise ValueError('Duplicate extended DOM ID')
 for element_id in ids:
  if original.count('id="'+element_id+'"'):raise ValueError('Existing DOM ID collision '+element_id)
 scripts_before=re.findall(r'<script\b[^>]*>.*?</script>',original,re.S|re.I);preserved=0
 for s in scripts_before:
  expected=s.replace(P8.OLD_P7_GUARD,P8.NEW_P7_GUARD,1) if P8.OLD_P7_GUARD in s else s
  expected=expected.replace(OLD_FOUNDATION_GUARD,NEW_FOUNDATION_GUARD,1)
  if candidate.count(expected)<original.count(s):raise ValueError('Existing script was not preserved')
  preserved+=1
 # Fold insertions into original anchors so every find string is
 # present in the observed baseline, even for backends validating a batch first.
 folded=[]
 for item in patches:
  owners=[p for p in folded if item['find'] in p['replace']]
  if owners:
   if len(owners)!=1 or owners[0]['replace'].count(item['find'])!=1:raise ValueError('Ambiguous folded patch')
   owners[0]['replace']=owners[0]['replace'].replace(item['find'],item['replace'],1)
  else:folded.append(dict(item))
 rebuilt=original
 for item in folded:
  if original.count(item['find'])!=1:raise ValueError('Folded anchor is not unique in baseline')
  rebuilt=rebuilt.replace(item['find'],item['replace'],1)
 if rebuilt!=candidate:raise ValueError('Folded patch changed final bytes')
 patches=folded
 return patches,candidate,{'schema':'MathScope.M3.ExtendedPagePatch/1','baseSHA256':sha(original),'candidateSHA256':sha(candidate),'patchCount':len(patches),'preservedExistingScriptBlocks':preserved,'newPages':0,'newAssets':0,'sourceFiles':{n:sha(s) for n,s in sources.items()},'p8':p8manifest,'p7OnlyChange':'Existing P7 hash route now excludes P8. P7 calculations and visualization source are unchanged.','foundationOnlyChange':'The existing startup timer respects the new Gauge and Fluid routes.','wholeM3Complete':False}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--baseline',required=True,type=Path);p.add_argument('--out',required=True,type=Path);args=p.parse_args();patches,candidate,manifest=build(args.baseline.read_text());args.out.mkdir(parents=True,exist_ok=True)
 (args.out/'page-patches.json').write_text(json.dumps(patches,ensure_ascii=False));(args.out/'candidate.html').write_text(candidate);(args.out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print(json.dumps(manifest,ensure_ascii=False))
