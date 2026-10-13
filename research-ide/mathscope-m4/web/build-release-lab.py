"""Add the release lab to the observed v103 without rewriting unrelated bytes."""
import argparse, hashlib, json, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]

def sha(x): return hashlib.sha256(x.encode()).hexdigest()

def build(observed, catalog, verification, kernel, source_refinement=None):
    if 'id="ms-r1-lab"' in observed: raise ValueError('Already installed: use an owned replacement')
    candidate, patches, bridges = observed, [], []
    def patch(find, replacement):
        nonlocal candidate
        if observed.count(find) != 1: raise ValueError('Anchor not unique: ' + find[:70])
        patches.append(dict(operation='replace',find=find,replace=replacement))
        candidate=candidate.replace(find,replacement,1)
    for phase in ('1','2'):
        find = 'const api=Object.freeze({version:M'+phase+'_VERSION,'
        replacement = find + 'createReleaseEngine:()=>createM'+phase+'Engine(),normalizeReleaseRequest:normalizeRequest,'
        patch(find,replacement)
        for file in ('workspace.mjs','workspace.bundle.js'):
            path=ROOT/('mathscope-m'+phase)/file
            raw=path.read_bytes();text=raw.decode('utf-8')
            if text.count(find)!=1: raise ValueError('Source anchor not unique '+str(path))
            bridges.append(dict(sourcePath=path.relative_to(ROOT.parent).as_posix(),sourceSHA256=hashlib.sha256(raw).hexdigest(),find=find,replace=replacement,scope='Additive release engine constructor and input normalization; computation source and Worker bytes unchanged'))
    style='<style id="ms-r1-style">'+(HERE/'release-lab.css').read_text(encoding='utf-8')+'</style>\n'
    html=(HERE/'release-lab.html').read_text(encoding='utf-8')
    find='<div class="ms-m4-tools">'
    patch(find,style+html+'\n'+find)
    runtime=(ROOT/'mathscope-m4/release-lab/runtime.mjs').read_text(encoding='utf-8').replace('export function createReleaseLab','function createReleaseLab')
    script=runtime+'\n'+(HERE/'release-lab.js').read_text(encoding='utf-8')
    model_object=dict(catalog=catalog,verification=verification,kernel=kernel,sourceRefinement=source_refinement)
    model=json.dumps(model_object,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    if json.loads(model)!=model_object:raise ValueError('Inline model changed its mathematical values')
    addon='<script id="ms-r1-data" type="application/json">'+model+'</script>\n<script id="ms-r1-js">\n'+re.sub('</script',r'<\\/script',script,flags=re.I)+'\n</script>\n'
    patch('</body>',addon+'</body>')
    restored=candidate
    for p in reversed(patches): restored=restored.replace(p['replace'],p['find'],1)
    if restored!=observed: raise ValueError('Unrelated bytes changed')
    return patches,candidate,dict(schema='MathScope.R1.OwnedPatch/1',baseSHA256=sha(observed),candidateSHA256=sha(candidate),newAssets=0,newPages=0,unrelatedBytesPreserved=True,patchCount=len(patches),reversible=True,wholeM3Complete=False,additiveEngineBridges=bridges,originalWorkspaceFilesUnchanged=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--baseline',required=True,type=Path);p.add_argument('--out',required=True,type=Path);p.add_argument('--kernel',required=True,type=Path);p.add_argument('--verification',required=True,type=Path);p.add_argument('--refinement',type=Path);args=p.parse_args()
    catalog=json.loads((ROOT/'mathscope-m4/release-lab/catalog.json').read_text(encoding='utf-8'))
    verification=json.loads(args.verification.read_text(encoding='utf-8'))
    if verification.get('pass') is not True: raise ValueError('Fixture verification did not pass')
    kernel=json.loads(args.kernel.read_text(encoding='utf-8'));refinement=json.loads(args.refinement.read_text(encoding='utf-8')) if args.refinement else None
    patches,candidate,manifest=build(args.baseline.read_bytes().decode('utf-8'),catalog,verification,kernel,refinement)
    args.out.mkdir(parents=True,exist_ok=True)
    (args.out/'patches.json').write_text(json.dumps(patches,ensure_ascii=False),encoding='utf-8')
    (args.out/'candidate.html').write_bytes(candidate.encode('utf-8'))
    (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(json.dumps(manifest))
