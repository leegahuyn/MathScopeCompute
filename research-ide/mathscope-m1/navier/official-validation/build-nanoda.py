import datetime, hashlib, json, os, pathlib, subprocess

B=pathlib.Path(__file__).resolve().parent
result=json.loads((B/'rust-prepared.json').read_text())
prefix=B/'rust-toolchain'
for component in result['components']:
    command=[str(pathlib.Path(component['root'])/'install.sh'),
             '--prefix='+str(prefix),'--sysconfdir='+str(prefix/'etc'),
             '--disable-ldconfig']
    log=B/('rust-install-'+component['name']+'.log')
    with log.open('w') as output:
        run=subprocess.run(command,stdout=output,stderr=subprocess.STDOUT,timeout=240)
    component.update(installCommand=command,installExitCode=run.returncode,
                     installLogSHA256=hashlib.sha256(log.read_bytes()).hexdigest())
    if run.returncode:
        (B/'rust-toolchain.json').write_text(json.dumps(result,indent=2)+'\n')
        raise RuntimeError('official rust installation failed: '+component['name'])
env=dict(os.environ)
env.update(PATH=str(prefix/'bin')+os.pathsep+env.get('PATH',''),
           CARGO_HOME=str(B/'cargo-home'),CARGO_TARGET_DIR=str(B/'nanoda-target'))
result['rustcVersion']=subprocess.check_output([str(prefix/'bin/rustc'),'--version','--verbose'],env=env,text=True)
result['cargoVersion']=subprocess.check_output([str(prefix/'bin/cargo'),'--version','--verbose'],env=env,text=True)
result['completedUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat()
(B/'rust-toolchain.json').write_text(json.dumps(result,indent=2)+'\n')
source=B/'nanoda-src'
command=[str(prefix/'bin/cargo'),'build','--release','--locked','--jobs','2']
out={'sourceURL':'https://github.com/ammkrn/nanoda_lib',
     'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=source,text=True).strip(),
     'command':command,'cwd':str(source),
     'environment':{k:env[k] for k in ['CARGO_HOME','CARGO_TARGET_DIR']},
     'startedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()}
log=B/'nanoda-build.log'
with log.open('w') as output:
    run=subprocess.run(command,cwd=source,env=env,stdout=output,stderr=subprocess.STDOUT,timeout=900)
out['exitCode']=run.returncode
out['completedUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat()
out['logSHA256']=hashlib.sha256(log.read_bytes()).hexdigest()
out['sourceStatus']=subprocess.check_output(['git','status','--porcelain'],cwd=source,text=True)
binary=B/'nanoda-target/release/nanoda_bin'
if run.returncode==0:out['binarySHA256']=hashlib.sha256(binary.read_bytes()).hexdigest()
(B/'nanoda-build.json').write_text(json.dumps(out,indent=2)+'\n')
print('nanoda build exit',run.returncode,flush=True)
