import datetime,hashlib,json,os,pathlib,subprocess,time,sys

repo=pathlib.Path('/workspace/scratch/cf975e3da716/MathScopeCompute')
directory=repo/'research-ide/mathscope-m2/navier/research/evidence/inner-covariance-flat-20261011'
attempt=int(sys.argv[1]) if len(sys.argv)>1 else 1
stem=f'actual-inner-covariance-flat-extension-source-attempt{attempt}'
directory.mkdir(parents=True,exist_ok=True)
files=['research-ide/mathscope-m2/navier/actual-inner-flat-kernel.mjs',
       'research-ide/mathscope-m2/navier/actual-inner-covariance-flat-extension.mjs',
       'research-ide/mathscope-m2/navier/tests/actual-inner-flat-kernel.test.mjs',
       'research-ide/mathscope-m2/navier/tests/actual-inner-covariance-flat-extension-source.test.mjs']
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
before={p:digest(repo/p) for p in files}
snapshots=directory/f'attempt{attempt}-snapshots';snapshots.mkdir(exist_ok=False)
for p in files:(snapshots/(pathlib.Path(p).name+'.txt')).write_bytes((repo/p).read_bytes())
started=datetime.datetime.now(datetime.timezone.utc).isoformat();begin=time.perf_counter()
cmd=['node','--max-old-space-size=3072','--test','--test-reporter=tap',files[-1]]
env=os.environ.copy();env['MATHSCOPE_INNER_COVARIANCE_EVIDENCE_DIR']=str(directory);env['MATHSCOPE_INNER_COVARIANCE_RECEIPT_STEM']=stem
log=directory/(stem+'.log');processfile=directory/(stem+'-process.json');assert not log.exists() and not processfile.exists()
timed_out=False
with log.open('xb') as out:
    proc=subprocess.Popen(cmd,cwd=repo,env=env,stdout=out,stderr=subprocess.STDOUT)
    try:code=proc.wait(timeout=180)
    except subprocess.TimeoutExpired:
        timed_out=True;proc.kill();code=proc.wait()
receipt=directory/(stem+'.json');source=json.loads(receipt.read_text()) if receipt.exists() else None
after={p:digest(repo/p) for p in files}
record={'schema':'MathScope.ObservedSourceProcess/1','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'startedAt':started,'command':cmd,'sourceSHA256AtExecution':before,'sourceUnchangedAfterRun':before==after,'exitCode':code,
 'timeout':timed_out,'timeoutSeconds':180,'wallElapsedMs':(time.perf_counter()-begin)*1000,
 'peakRSSBytes':source.get('peakRSSBytes') if source else None,'log':{'path':str(log.relative_to(repo)),'sha256':digest(log)},
 'sourceReceipt':{'path':str(receipt.relative_to(repo)),'exists':receipt.exists(),'sha256':digest(receipt) if receipt.exists() else None},
 'snapshots':[{'original':p,'path':str((snapshots/(pathlib.Path(p).name+'.txt')).relative_to(repo)),'sha256':before[p]} for p in files],
 'pass':code==0 and not timed_out and before==after and bool(source and source.get('pass')),'designedNegativeControl':False}
processfile.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(record,ensure_ascii=False,indent=2),flush=True)
