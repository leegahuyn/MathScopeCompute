import datetime, hashlib, json, os, pathlib, re, subprocess, time

repo=pathlib.Path(__file__).resolve().parent/'MathScopeCompute'
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
evidence=repo/'docs/evidence/metadata-phase4-20261013/worker-replay'/('attempt-'+stamp)
evidence.mkdir(parents=True,exist_ok=False)
def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return {'path':path.relative_to(repo).as_posix(),'bytes':path.stat().st_size,'sha256':h.hexdigest()}
def snapshot():
    build=json.loads((repo/'research-ide/mathscope-m3/web/extended-build-data.json').read_text(encoding='utf-8'))
    paths=set(repo/'research-ide'/r['path'] for r in build['sourceBinding']['files'])
    paths.update((repo/'research-ide/mathscope-m3/navier').glob('*.mjs'))
    paths.update(repo/p for p in ['research-ide/mathscope-m3/web/extended-build-data.json','research-ide/mathscope-m3/web/extended-engine.bundle.js','research-ide/mathscope-m3/web/tests/extended-worker.test.mjs'])
    return [digest(p) for p in sorted(paths,key=lambda p:p.relative_to(repo).as_posix())]
started=datetime.datetime.now(datetime.timezone.utc).isoformat()
before=snapshot()
checker=repo/'docs/evidence/metadata-phase4-20261013/check-generated-assets.mjs'
(evidence/'checker.mjs').write_bytes(checker.read_bytes())
(evidence/'runner.py').write_bytes(pathlib.Path(__file__).read_bytes())
commands=[['node','docs/evidence/metadata-phase4-20261013/check-generated-assets.mjs'],['node','--max-old-space-size=1536','--test','--test-reporter=tap','research-ide/mathscope-m3/web/tests/extended-worker.test.mjs']]
rows=[]
for i,argv in enumerate(commands):
    t=time.monotonic(); timed_out=False
    try:
        p=subprocess.run(argv,cwd=repo,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=120)
        out,err,code=p.stdout,p.stderr,p.returncode
    except subprocess.TimeoutExpired as ex:
        out,err,code=ex.stdout or b'',ex.stderr or b'',None; timed_out=True
    (evidence/f'{i}-stdout.log').write_bytes(out)
    (evidence/f'{i}-stderr.log').write_bytes(err)
    rows.append({'command':argv,'elapsedSeconds':time.monotonic()-t,'exitCode':code,'timeout':timed_out,'stdoutSHA256':hashlib.sha256(out).hexdigest(),'stderrSHA256':hashlib.sha256(err).hexdigest()})
    if code!=0: break
after=snapshot()
tap=(evidence/'1-stdout.log').read_text(encoding='utf-8') if (evidence/'1-stdout.log').exists() else ''
counts={k:int(m.group(1)) if (m:=re.search(r'^# '+k+r' (\d+)\s*$',tap,re.M)) else None for k in ['tests','pass','fail','cancelled','skipped','todo']}
passed=len(rows)==2 and all(x['exitCode']==0 and not x['timeout'] for x in rows) and counts=={'tests':11,'pass':11,'fail':0,'cancelled':0,'skipped':0,'todo':0} and before==after
receipt={'schema':'MathScope.M3.GeneratedWorkerReplayAttempt/1','startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checkpointCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo).decode().strip(),'nodeVersion':subprocess.check_output(['node','--version'],cwd=repo).decode().strip(),'budgetSecondsPerCommand':120,'nodeOldSpaceMiB':1536,'checker':digest(checker),'runnerSHA256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),'commands':rows,'testCounts':counts,'sourceBefore':before,'sourceAfter':after,'sourceStable':before==after,'passed':passed,'published':False,'publicV103WorkerReplaced':False,'mathematicalCriteriaPromoted':False}
(evidence/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({'evidence':str(evidence),'passed':passed,'testCounts':counts,'sourceStable':before==after,'sourceFiles':len(before),'commands':rows},ensure_ascii=False))
raise SystemExit(0 if passed else 1)
