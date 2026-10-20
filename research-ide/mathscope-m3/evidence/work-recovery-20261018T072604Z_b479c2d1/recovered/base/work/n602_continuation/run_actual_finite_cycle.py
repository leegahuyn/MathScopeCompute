#!/usr/bin/env python3
"""Record the actual Node process exit, including V8 aborts and signals."""
import hashlib,json,pathlib,subprocess,time
root=pathlib.Path(__file__).resolve().parent
command=['node','--max-old-space-size=4096',str(root/'run_actual_finite_cycle.mjs')]
started=time.time()
with (root/'logs/actual.stdout.log').open('w') as out,(root/'logs/actual.stderr.log').open('w') as err:
    proc=subprocess.Popen(command,cwd=root,stdout=out,stderr=err)
    (root/'ACTUAL_PROCESS_RUNNING.json').write_text(json.dumps({'command':command,'pid':proc.pid,'startUnix':started},indent=2)+'\n')
    code=proc.wait()
record={'command':command,'exitCode':code,'elapsedSeconds':round(time.time()-started,3),
        'chosenHeapLimitMiB':4096,'originalWindowsRunRepeated':False,
        'stdoutSha256':hashlib.sha256((root/'logs/actual.stdout.log').read_bytes()).hexdigest(),
        'stderrSha256':hashlib.sha256((root/'logs/actual.stderr.log').read_bytes()).hexdigest()}
(root/'ACTUAL_PROCESS.json').write_text(json.dumps(record,indent=2)+'\n')
(root/'logs/actual.exit.txt').write_text(str(code)+'\n')
print(json.dumps(record))
raise SystemExit(0 if code==0 else 1)
