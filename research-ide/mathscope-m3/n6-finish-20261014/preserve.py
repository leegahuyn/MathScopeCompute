"""Persist reviewable compact outputs using the Git API, restricted to child branch."""
import argparse, base64, hashlib, json, os, urllib.request
from pathlib import Path
REPO='leegahuyn/MathScopeCompute'
BRANCH='mathscope-m3-n6-cloud-20261014'
ROOT='research-ide/mathscope-m3/evidence/n6-finish-20261014'
def api(path,data=None,method='GET'):
    req=urllib.request.Request('https://api.github.com/repos/'+REPO+'/'+path,
        data=json.dumps(data).encode() if data is not None else None,method=method,
        headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json',
                 'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=60) as r:return json.load(r)
def raw(path,ref):
    row=api('contents/'+path+'?ref='+ref)
    if row.get('encoding')!='base64':raise ValueError('Unsupported source content encoding')
    return base64.b64decode(row['content'])
def main():
    p=argparse.ArgumentParser();p.add_argument('--result',required=True,type=Path);a=p.parse_args()
    commit=os.environ['GITHUB_SHA'];run=os.environ['GITHUB_RUN_ID']
    if os.environ['GITHUB_REF']!='refs/heads/'+BRANCH:raise ValueError('Only the dedicated child branch may be updated')
    current=api('git/ref/heads/'+BRANCH)['object']['sha']
    if current!=commit:raise ValueError('Branch advanced; preserving artifacts without overwriting newer work')
    names=['RESULTS_KO.md','OBLIGATION_MATRIX.json','shard-progress.json','CERTIFICATE_HASHES.json',
           'acceptance-result.json','verification-summary.json','receipt.json','execution.json',
           'jet-solve-application-result.json']
    files={ROOT+'/run-'+run+'/'+name:(a.result/name).read_bytes() for name in names if (a.result/name).is_file()}
    if not files:raise ValueError('No result outputs to preserve')
    artifacts=api(f'actions/runs/{run}/artifacts?per_page=100')
    jobs=api(f'actions/runs/{run}/jobs?per_page=100')
    observation={'runId':run,'codeCommit':commit,'branch':BRANCH,
                 'runURL':f'https://github.com/{REPO}/actions/runs/{run}',
                 'artifacts':[{k:x.get(k) for k in ['id','name','digest','size_in_bytes','expired','expires_at']} for x in artifacts['artifacts']],
                 'jobs':[{k:x.get(k) for k in ['id','name','status','conclusion','html_url']} for x in jobs['jobs']],
                 'largeOutputsDurable':False,'largeArtifactExpiryRequiresReproductionFromGitSources':True}
    files[ROOT+'/run-'+run+'/GITHUB_OBSERVATION.json']=(json.dumps(observation,ensure_ascii=False,indent=2)+'\n').encode()
    manifest_path='research-ide/SOURCE_TRANSLATION_MANIFEST.json'
    # Contents API suppresses >1MiB bodies; read its Git blob explicitly.
    info=api('contents/'+manifest_path+'?ref='+commit)
    if info.get('encoding')=='base64' and info.get('content'):
        old=base64.b64decode(info['content'])
    else:
        blob=api('git/blobs/'+info['sha']);old=base64.b64decode(blob['content'])
    manifest=json.loads(old);rows={r['path']:r for r in manifest['editionArtifacts']}
    for path,data in files.items():
        name=path.removeprefix('research-ide/')
        rows[name]={'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'category':'ENGLISH_GUIDE_TOOL_OR_RELEASE_PROVENANCE'}
    manifest['editionArtifactCount']=len(rows);manifest['editionArtifacts']=[rows[k] for k in sorted(rows)]
    files[manifest_path]=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
    head=api('git/commits/'+commit);entries=[]
    for path,data in files.items():
        if len(data)>24*1024**2:raise ValueError('Durable reviewable result exceeded 24MiB budget')
        obj=api('git/blobs',{'content':base64.b64encode(data).decode(),'encoding':'base64'},'POST')
        entries.append({'path':path,'mode':'100644','type':'blob','sha':obj['sha']})
    tree=api('git/trees',{'base_tree':head['tree']['sha'],'tree':entries},'POST')
    obj=api('git/commits',{'message':f'Preserve dedicated N6 remaining-obligation run {run}: proofs and exact stops',
                         'tree':tree['sha'],'parents':[commit]},'POST')
    # A race here is rejected by non-fast-forward protection.
    api('git/refs/heads/'+BRANCH,{'sha':obj['sha'],'force':False},'PATCH')
    print(json.dumps({'savedCommit':obj['sha'],'savedFiles':len(files),'runURL':observation['runURL']}))
if __name__=='__main__':main()
