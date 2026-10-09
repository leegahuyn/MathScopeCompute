#!/usr/bin/env python3
"""Use the pinned official Lean environment for small, local proof checks."""
from pathlib import Path
import json,subprocess,os,hashlib,time
ROOT=Path(__file__).resolve().parent
previous=json.loads((ROOT.parents[1]/'followup-construction/axis-lean-command.json').read_text())
env=os.environ.copy();env.update(previous['environment'])
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def run(source,stem,expect):
    cmd=previous['command'][:3]+['--root',str(ROOT),str(source)]
    start=time.monotonic();p=subprocess.run(cmd,cwd=previous['cwd'],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120)
    log=ROOT/(stem+'.log');log.write_text(p.stdout)
    out={'command':cmd,'cwd':previous['cwd'],'exitCode':p.returncode,'expectedExitCode':expect,'elapsedSeconds':time.monotonic()-start,'sourceSHA256':sha(source),'logSHA256':sha(log),'pinnedEnvironmentReceipt':'../../followup-construction/axis-lean-command.json','passed':p.returncode==expect,'scope':'Small local kernel check in the official pinned environment; not a whole analytic premise bundle.'}
    (ROOT/(stem+'-command.json')).write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({'case':stem,'exitCode':p.returncode,'passed':out['passed'],'elapsedSeconds':out['elapsedSeconds']}));assert out['passed']
run(ROOT/'PositiveScales.lean','positive-scales-lean',0)
negative=ROOT/'negative-control';negative.mkdir(exist_ok=True)
false=negative/'FalseAxialIdentity.lean'
false.write_text('import Mathlib.Data.Real.Basic\nimport Mathlib.Tactic.NormNum\n\nexample : (-(1 : ℝ) * 1 = -1 * 1 / 2) := by\n  norm_num\n')
run(false,'negative-axial-lean',1)
