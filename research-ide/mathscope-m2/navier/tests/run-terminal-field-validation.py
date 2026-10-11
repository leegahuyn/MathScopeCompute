#!/usr/bin/env python3
"""Run one bounded process and preserve success or failure with exact imports."""
from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json
import os
import re
import resource
import subprocess
import time

parser=argparse.ArgumentParser()
parser.add_argument('--mode',choices=['kernel','source'],required=True)
parser.add_argument('--attempt',type=int,required=True)
args=parser.parse_args()
repo=Path(__file__).resolve().parents[4]
base=repo/'research-ide/mathscope-m2/navier'
out=base/'research/evidence/terminal-field-20261011'
out.mkdir(parents=True,exist_ok=True)
prefix=f'{args.mode}-attempt-{args.attempt}'
test=base/f'tests/actual-terminal-field-scaled-enclosure-{args.mode}.test.mjs'

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def closure(start):
    seen=set()
    def walk(path):
        path=path.resolve()
        if path in seen:return
        seen.add(path)
        if path.suffix not in ['.mjs','.js']:return
        for rel in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):
            walk(path.parent/rel)
    walk(start)
    return {str(p.relative_to(repo)):digest(p) for p in sorted(seen)}

before=closure(test)
command=['node','--max-old-space-size=3072','--test',str(test.relative_to(repo))]
env=os.environ.copy()
env['MATHSCOPE_TERMINAL_FIELD_OUTPUT']=str(out/f'{prefix}-certificate.json')
start=time.perf_counter()
try:
    result=subprocess.run(command,cwd=repo,env=env,capture_output=True,text=True,timeout=150,check=False)
    code=result.returncode;log=result.stdout+result.stderr
except subprocess.TimeoutExpired as err:
    code=124
    raw=[err.stdout or '',err.stderr or '']
    log=''.join(v.decode(errors='replace') if isinstance(v,bytes) else v for v in raw)+'\nTIMEOUT after 150 seconds\n'
elapsed=time.perf_counter()-start
logfile=out/f'{prefix}.tap';logfile.write_text(log)
after=closure(test)
record=dict(schema='MathScope.TerminalFieldValidationProcess/1',generatedAt=datetime.now(timezone.utc).isoformat(),mode=args.mode,attempt=args.attempt,
    command=command,exitCode=code,elapsedSeconds=elapsed,peakRSSBytes=resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss*1024,
    importsSHA256Before=before,importsSHA256After=after,importsUnchanged=before==after,log=logfile.name,logSHA256=digest(logfile),
    pass_=code==0 and before==after)
record['pass']=record.pop('pass_')
receipt=out/f'{prefix}-process.json';receipt.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:record[k] for k in ['mode','attempt','exitCode','elapsedSeconds','peakRSSBytes','importsUnchanged','pass']},ensure_ascii=False))
print(log[-7000:])
raise SystemExit(0 if record['pass'] else 1)
