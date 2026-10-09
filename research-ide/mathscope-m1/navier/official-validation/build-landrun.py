import datetime, hashlib, json, os, pathlib, subprocess, time

B = pathlib.Path(__file__).resolve().parent
source = B / 'landrun-src'
env = dict(os.environ)
env.update(PATH=str(B/'go/bin')+os.pathsep+env.get('PATH',''),
           GOROOT=str(B/'go'), GOPATH=str(B/'go-work'),
           GOCACHE=str(B/'go-cache'), GOENV='off', GOTOOLCHAIN='local')
command = [str(B/'go/bin/go'), 'build', '-mod=readonly', '-o', str(B/'landrun'), 'cmd/landrun/main.go']
out = {'sourceURL':'https://github.com/Zouuup/landrun',
       'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=source,text=True).strip(),
       'command':command,'cwd':str(source),
       'environment':{k:env[k] for k in ['GOROOT','GOPATH','GOCACHE','GOENV','GOTOOLCHAIN']},
       'startedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()}
with (B/'landrun-build.log').open('w') as log:
    run = subprocess.run(command,cwd=source,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=900)
out['exitCode']=run.returncode
out['completedUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat()
out['logSHA256']=hashlib.sha256((B/'landrun-build.log').read_bytes()).hexdigest()
out['sourceStatus']=subprocess.check_output(['git','status','--porcelain'],cwd=source,text=True)
if run.returncode==0:
    out['binarySHA256']=hashlib.sha256((B/'landrun').read_bytes()).hexdigest()
(B/'landrun-build.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('landrun build exit',run.returncode,flush=True)
