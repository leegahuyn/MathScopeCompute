from pathlib import Path
import subprocess, hashlib, json, datetime, time, os, re, sys

root=Path(__file__).resolve().parents[3]
out=root/('research-ide/mathscope-m3/evidence/resume-20261013/local-latest-norms-attempt'+(sys.argv[1] if len(sys.argv)>1 else '1'))
out.mkdir(parents=True,exist_ok=False)
test=root/'research-ide/mathscope-m3/navier/tests/saved-five-mean-change-norms.test.mjs'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
env=dict(os.environ,M3_SAVED_FIVE_CHANGE_EVIDENCE=str(out/'observed.json'))
command=['node','--max-old-space-size=1536','--test','--test-reporter=tap','--test-concurrency=1',str(test)]
before={p.relative_to(root).as_posix():sha(p) for p in (root/'research-ide/mathscope-m3/navier').glob('*.mjs')}
started=now();tick=time.monotonic();stop=None
proc=subprocess.Popen(command,cwd=root,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
try:
    stdout,stderr=proc.communicate(timeout=150)
except subprocess.TimeoutExpired:
    stop='TIME_LIMIT'
    subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],capture_output=True)
    stdout,stderr=proc.communicate()
(out/'test.tap').write_bytes(stdout)
(out/'test.stderr').write_bytes(stderr)
tap=stdout.decode('utf-8',errors='replace')
def count(key):
    matches=re.findall(r'^# '+key+r' (\d+)$',tap,re.M)
    return int(matches[-1]) if matches else None
controls=['copied capabilities, parents and cutoff records cannot issue source-bound results','omitted derivative orders, caller norm values and insufficient budgets are rejected','changes to actual roots, full pressure, scalar constants and completion flags invalidate the seal']
negative={s:bool(re.search(r'^ok \d+ - '+re.escape(s)+r'\s*$',tap,re.M)) for s in controls}
observed=out/'observed.json'
unchanged=all((root/p).is_file() and sha(root/p)==v for p,v in before.items())
receipt={'schema':'MathScope.M3.ExplicitLatestSavedNormTest/1','commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'test':test.relative_to(root).as_posix(),'testSHA256':sha(test),'startedAtUTC':started,'finishedAtUTC':now(),'elapsedSeconds':round(time.monotonic()-tick,3),'exitCode':proc.returncode,'stopReason':stop,'node':subprocess.check_output(['node','--version'],text=True).strip(),'budget':{'wallSeconds':150,'oldSpaceMiB':1536,'oldSpaceIsNotRSSLimit':True},'counts':{s:count(s) for s in ['tests','pass','fail','skipped','cancelled']},'negativeControls':negative,'sourceFilesChecked':len(before),'sourceModulesUnchangedDuringRun':unchanged,'artifacts':{p.name:{'sha256':sha(p),'bytes':p.stat().st_size} for p in out.iterdir() if p.is_file()},'wholeM3Complete':False,'M4Accepted':False,'criterionPromotionPerformed':False}
receipt['pass']=proc.returncode==0 and stop is None and count('tests')==8 and count('pass')==8 and count('fail')==0 and count('skipped')==0 and count('cancelled')==0 and all(negative.values()) and unchanged and observed.is_file()
(out/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt,ensure_ascii=False))
raise SystemExit(0 if receipt['pass'] else 1)
