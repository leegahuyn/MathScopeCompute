import argparse, hashlib, json, subprocess, time, zipfile
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('run');p.add_argument('output');a=p.parse_args()
repo='leegahuyn/MathScopeCompute'
out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
def api(path):
    return json.loads(subprocess.check_output(['gh','api',f'repos/{repo}/{path}']))
run=api(f'actions/runs/{a.run}')
jobs=api(f'actions/runs/{a.run}/jobs?per_page=100')
artifacts=api(f'actions/runs/{a.run}/artifacts?per_page=100')
records=[]
for item in artifacts['artifacts']:
    if item['expired']: raise ValueError('Expired artifact '+item['name'])
    raw=subprocess.check_output(['gh','api',f'repos/{repo}/actions/artifacts/{item["id"]}/zip?cache_bust={time.time_ns()}'],timeout=180)
    digest=hashlib.sha256(raw).hexdigest()
    if item.get('digest') and item['digest']!='sha256:'+digest: raise ValueError('GitHub archive digest mismatch')
    path=out/(item['name']+'.zip');path.write_bytes(raw)
    with zipfile.ZipFile(path) as z:
        if z.testzip() is not None: raise ValueError('Corrupt ZIP')
        names=z.namelist()
        if len(names)!=len(set(names)):raise ValueError('Duplicate ZIP path')
        members=[]
        for name in names:
            if name.endswith('/'):continue
            data=z.read(name)
            members.append({'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
        receipt=json.loads(z.read('receipt.json'))
        if receipt['sourceCommit']!=run['head_sha']:raise ValueError('Receipt/source commit mismatch')
        for m in receipt['members']:
            data=z.read(m['path'])
            if len(data)!=m['bytes'] or hashlib.sha256(data).hexdigest()!=m['sha256']:raise ValueError('Receipt member mismatch')
    records.append({'name':item['name'],'id':item['id'],'path':path.name,'bytes':len(raw),'sha256':digest,'githubDigest':item.get('digest'),'sourceCommit':receipt['sourceCommit'],'executionStatus':receipt['executionStatus'],'members':members})
    print(json.dumps({'saved':path.name,'bytes':len(raw),'sha256':digest}),flush=True)
for name,obj in [('run.json',run),('jobs.json',jobs),('github-artifacts.json',artifacts)]:
    (out/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
manifest={'schema':'MathScope.N6Continuation.Archives/1','repository':repo,'runId':int(a.run),'sourceCommit':run['head_sha'],'headBranch':run['head_branch'],'status':run['status'],'conclusion':run['conclusion'],'runURL':run['html_url'],'archives':records,'memberReceiptsVerified':True,'archiveIntegrityIsNotMathematicalProof':True}
(out/'ARCHIVE_MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
