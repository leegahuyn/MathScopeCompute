"""Archive genuine Actions ZIPs and official metadata; no extraction copy."""
from pathlib import Path
import argparse, hashlib, json, subprocess, zipfile
REPO='leegahuyn/MathScopeCompute'
def api(path,binary=False):
    data=subprocess.run(['gh','api',f'repos/{REPO}/{path}'],check=True,stdout=subprocess.PIPE).stdout
    return data if binary else json.loads(data)
def main():
    p=argparse.ArgumentParser();p.add_argument('run',type=int);p.add_argument('--output',required=True);args=p.parse_args();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    run=api(f'actions/runs/{args.run}');rows=api(f'actions/runs/{args.run}/artifacts')['artifacts'];saved=[]
    for row in rows:
        target=out/(row['name']+'.zip');raw=api(f"actions/artifacts/{row['id']}/zip",True);sha=hashlib.sha256(raw).hexdigest()
        if row.get('digest')!=f'sha256:{sha}':raise ValueError('Official Actions digest differs from downloaded ZIP')
        if target.exists() and target.read_bytes()!=raw:raise ValueError('Historical archive overwrite')
        target.write_bytes(raw);record={k:row[k] for k in ['id','name','size_in_bytes','digest','expired']};record.update({'savedPath':target.name,'downloadedBytes':len(raw),'downloadSHA256':sha})
        with zipfile.ZipFile(target) as z:
            record['members']=[{'name':i.filename,'bytes':i.file_size} for i in z.infolist()]
            for name in ['mean-result.json','dag-result.json','radius-monotone-result.json','series-quadratic-result.json','initial-residual-execution.json']:
                if name in z.namelist():
                    d=json.loads(z.read(name));summary={k:d[k] for k in ['status','root','dependencyNodes','integralCount','missingDefinitionNodes','stops','scope','elapsedSeconds'] if k in d};print(json.dumps({'archive':target.name,'file':name,'summary':summary},ensure_ascii=False))
        saved.append(record)
    observation={'schema':'MathScope.N6.ActionsArchiveObservation/1','run':{k:run[k] for k in ['id','head_sha','status','conclusion','html_url','created_at','updated_at']},'artifacts':saved,'originalN601Complete':False,'originalN602Complete':False}
    target=out/f'run-{args.run}-observation.json';target.write_text(json.dumps(observation,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
