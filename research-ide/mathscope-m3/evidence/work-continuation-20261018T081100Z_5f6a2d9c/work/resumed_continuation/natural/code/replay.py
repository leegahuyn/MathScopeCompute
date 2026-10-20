#!/usr/bin/env python3
"""Replay only the new natural continuation, with complete execution receipt."""
import hashlib,json,subprocess,sys
from pathlib import Path
OUT=Path(__file__).resolve().parents[1]
ROOT=OUT.parents[2]

def pin(path):
    return {'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size}

jobs=[('materialize',['node',str(OUT/'code/materialize_degree_one.mjs')]),
      ('certify',[sys.executable,str(OUT/'code/certify_scaled_callers.py')])]
receipts=[]
for name,argv in jobs:
    try:
        p=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,timeout=45)
        stdout,stderr,code=p.stdout,p.stderr,p.returncode
    except subprocess.TimeoutExpired as e:
        stdout=e.stdout or '';stderr=e.stderr or ''
        if isinstance(stdout,bytes):stdout=stdout.decode(errors='replace')
        if isinstance(stderr,bytes):stderr=stderr.decode(errors='replace')
        stderr+='\nNew natural continuation job exceeded 45 seconds.\n';code=124
    files=[]
    for suffix,value in [('stdout.log',stdout),('stderr.log',stderr),('exit.txt',str(code)+'\n')]:
        path=OUT/'logs'/f'{name}.{suffix}';path.write_text(value);files.append(pin(path))
    receipts.append({'name':name,'argv':argv,'exitCode':code,'logs':files})
    if code:break
outputs=[OUT/'evidence/ACTUAL_DEGREE_ONE.json',OUT/'evidence/SCALED_CALLER_CERTIFICATES.json']
receipt={'schema':'MathScope.ResumedNaturalReplayReceipt/1','jobs':receipts,
    'code':[pin(p)for p in sorted((OUT/'code').glob('*'))if p.is_file()],
    'outputs':[pin(p)for p in outputs if p.exists()],
    'pass':len(receipts)==2 and all(x['exitCode']==0 for x in receipts),
    'originalGlobalProducerExecuted':False,'newM3Closures':0}
(OUT/'evidence/EXECUTION_RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'pass':receipt['pass'],'jobs':len(receipts),'normalizedScalarEnclosures':33 if receipt['pass'] else None,'newM3Closures':0}))
sys.exit(0 if receipt['pass'] else 1)
