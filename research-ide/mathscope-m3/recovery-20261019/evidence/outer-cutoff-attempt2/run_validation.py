"""Capture a bounded, reproducible validation of this new cutoff implementation."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import time

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    output=HERE/'evidence/cutoff-validation-attempt2'
    output.mkdir(parents=True,exist_ok=False)
    commands=[
        ('outer-cutoff',[sys.executable,str(HERE/'run_outer_cutoff.py')]),
        ('cutoff-tests',[sys.executable,'-m','unittest','discover','-s',str(HERE),'-p','test_outer_cutoff.py','-v']),
        ('original-ledger',[sys.executable,str(HERE/'build_m3_ledger.py')]),
    ]
    records=[]
    for label,args in commands:
        before=time.perf_counter()
        run=subprocess.run(args,cwd=REPO,capture_output=True)
        for stream,data in [('stdout',run.stdout),('stderr',run.stderr)]:
            (output/f'{label}.{stream}.log').write_bytes(data)
        records.append({'label':label,'argv':args,'cwd':str(REPO),'exit_code':run.returncode,
                        'elapsed_seconds':time.perf_counter()-before,
                        'logs':[{'path':str((output/f'{label}.{s}.log').relative_to(REPO)),
                                 'sha256':digest(output/f'{label}.{s}.log')} for s in ['stdout','stderr']]})
        if run.returncode:
            break
    from outer_cutoff import PINS
    receipt={'schema':'MathScope.CutoffValidationExecution/1','commands':records,
             'code_inputs':[{ 'path':str(p.relative_to(REPO)),'sha256':digest(p)} for p in sorted(HERE.glob('*.py'))],
             'source_inputs':PINS,
             'verified_outputs':[{'path':str(p.relative_to(REPO)),'sha256':digest(p),'bytes':p.stat().st_size}
                                 for p in sorted((HERE/'evidence').glob('*.json'))]+[
                                     {'path':str((HERE/'M3_CURRENT_ORIGINAL_LEDGER.json').relative_to(REPO)),
                                      'sha256':digest(HERE/'M3_CURRENT_ORIGINAL_LEDGER.json')}],
             'prior_observed_failure':{'command':'python -m unittest discover -s research-ide/mathscope-m3/recovery-20261019 -p test_outer_cutoff.py -v',
                                       'exit_code':1,'error':'ModuleNotFoundError: No module named mpmath',
                                       'evidence_location':'Earlier actual tool response in this session; exact raw stdout/stderr were not persisted.',
                                       'resolution':'Installed pinned mpmath1.3.0 into the separate scratch dependency directory; final command uses PYTHONPATH.'},
             'review_fix':'The public4096-bit request now reserves32 internal exp guard bits; an active-transition regression exercises it.',
             'M3':{'inherited_complete':62,'total':64,'newly_closed':0,'open':['N7-06','N8-05']},
             'actual_last_resolved_tau':None}
    (output/'EXECUTION.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'commands':[{k:r[k] for k in ['label','exit_code','elapsed_seconds']} for r in records],
                      'receipt':str(output/'EXECUTION.json'),'sha256':digest(output/'EXECUTION.json')}))
    return next((r['exit_code'] for r in records if r['exit_code']),0)


if __name__=='__main__':
    raise SystemExit(main())
