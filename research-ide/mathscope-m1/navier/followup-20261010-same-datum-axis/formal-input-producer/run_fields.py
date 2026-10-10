#!/usr/bin/env python3
from pathlib import Path
import os,subprocess,json,datetime,re
from run_check import sha,tracked_hashes,AUDIT,REPO,PIN,KERNEL,KERNEL_SHA
HERE=Path(__file__).resolve().parent
BASE=HERE/'attempts/0012'
MASS=HERE.parent/'independent-review/formal-mass-bound/attempts/0002'
def main():
    if sha(KERNEL)!=KERNEL_SHA:raise ValueError('Kernel mismatch')
    n=1
    while (HERE/'field-attempts'/f'{n:04d}').exists():n+=1
    dest=HERE/'field-attempts'/f'{n:04d}';dest.mkdir(parents=True)
    src=dest/'FieldBounds.lean';src.write_bytes((HERE/'FieldBounds.lean').read_bytes())
    (dest/'SameDatumInputs.lean').write_bytes((BASE/'SameDatumInputs.lean').read_bytes())
    (dest/'SameDatumMass.lean').write_bytes((MASS/'SameDatumMass.lean').read_bytes())
    before=tracked_hashes();env=os.environ.copy()
    for key in ('GITHUB_TOKEN','GH_TOKEN','LEAN_PATH','LEAN_SRC_PATH'):env.pop(key,None)
    env['PATH']=str(AUDIT/'lean-entry-layout/bin')+os.pathsep+env.get('PATH','')
    env['LEAN_SYSROOT']=str(AUDIT/'lean-entry-layout');env['LAKE_HOME']=str(AUDIT/'lake-home')
    env['MATHLIB_CACHE_DIR']=str(AUDIT/'mathlib-cache');env['LAKE_CACHE_DIR']=str(AUDIT/'lake-cache')
    env['LEAN_PATH']=str(BASE)+os.pathsep+str(MASS)
    cmd=[str(AUDIT/'lean-4.34.0-rc2-linux/bin/lake'),'env','lean','--root',str(dest),'-o',str(dest/'FieldBounds.olean'),str(src)]
    with (dest/'lean.log').open('w') as log:
        run=subprocess.run(cmd,cwd=REPO,env=env,stdout=log,stderr=subprocess.STDOUT)
    after=tracked_hashes();out=(dest/'lean.log').read_text()
    axes={name:[v.strip() for v in vals.split(',') if v.strip()] for name,vals in
          re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]",out,re.S)}
    result={'schema':'MathScope.Navier.ActualFieldInputKernel/1','exitCode':run.returncode,
        'status':'PASS' if run.returncode==0 and before==after and not any('sorryAx' in a for a in axes.values()) else 'FAIL',
        'command':cmd,'sourceSHA256':sha(src),'baseSourceSHA256':sha(BASE/'SameDatumInputs.lean'),
        'baseOleanSHA256':sha(BASE/'SameDatumInputs.olean'),'kernelSHA256':KERNEL_SHA,
        'massSourceSHA256':sha(MASS/'SameDatumMass.lean'),'massOleanSHA256':sha(MASS/'SameDatumMass.olean'),
        'originalCommit':PIN,'originalTrackedFilesPreserved':before==after,'printedAxioms':axes,
        'fullOriginalN303Completion':False}
    (dest/'receipt.json').write_text(json.dumps(result,indent=2)+'\n')
    (dest/'original-before.json').write_text(json.dumps(before,indent=2)+'\n')
    (dest/'original-after.json').write_text(json.dumps(after,indent=2)+'\n')
    print(json.dumps({'attempt':str(dest),'status':result['status'],'exitCode':run.returncode}));print(out)
    return int(result['status']!='PASS')
if __name__=='__main__':raise SystemExit(main())
