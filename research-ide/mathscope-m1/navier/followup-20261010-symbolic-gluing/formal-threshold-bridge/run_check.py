#!/usr/bin/env python3
"""Append-only original-kernel execution for the concrete input producer."""
from pathlib import Path
import hashlib,json,os,re,subprocess,datetime,sys
HERE=Path(__file__).resolve().parent
AUDIT=Path('/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/official-validation')
REPO=AUDIT/'repo'
PIN='f9e8bc5b38b6e212696e8a30e3e91517af887bbd'
KERNEL=AUDIT/'lean-4.34.0-rc2-linux/lib/lean/libleanshared.so'
KERNEL_SHA='cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def tracked_hashes():
    names=subprocess.check_output(['git','ls-files','-z'],cwd=REPO).decode().split('\0')
    return {n:sha(REPO/n) for n in names if n and (REPO/n).is_file()}
def main():
    if sha(KERNEL)!=KERNEL_SHA:raise ValueError('Kernel pin mismatch')
    if subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()!=PIN:
        raise ValueError('Original commit mismatch')
    number=1
    while (HERE/'attempts'/f'{number:04d}').exists():number+=1
    dest=HERE/'attempts'/f'{number:04d}';dest.mkdir(parents=True)
    src=dest/'ThresholdBridge.lean';src.write_bytes((HERE/'ThresholdBridge.lean').read_bytes())
    before=tracked_hashes()
    env=os.environ.copy()
    for name in ('GITHUB_TOKEN','GH_TOKEN','LEAN_PATH','LEAN_SRC_PATH'):env.pop(name,None)
    for name in list(env):
        if name.startswith('COMPARATOR_'):env.pop(name)
    env['PATH']=str(AUDIT/'lean-entry-layout/bin')+os.pathsep+env.get('PATH','')
    env['LEAN_SYSROOT']=str(AUDIT/'lean-entry-layout')
    env['LAKE_HOME']=str(AUDIT/'lake-home')
    env['MATHLIB_CACHE_DIR']=str(AUDIT/'mathlib-cache')
    env['LAKE_CACHE_DIR']=str(AUDIT/'lake-cache')
    cmd=[str(AUDIT/'lean-4.34.0-rc2-linux/bin/lake'),'env','lean','--root',str(dest),str(src)]
    started=datetime.datetime.now(datetime.timezone.utc).isoformat()
    with (dest/'lean.log').open('w') as log:
        result=subprocess.run(cmd,cwd=REPO,env=env,stdout=log,stderr=subprocess.STDOUT)
    after=tracked_hashes();out=(dest/'lean.log').read_text()
    (dest/'original-source-hashes-before.json').write_text(json.dumps(before,indent=2)+'\n')
    (dest/'original-source-hashes-after.json').write_text(json.dumps(after,indent=2)+'\n')
    axes={name:[x.strip() for x in body.split(',') if x.strip()]
          for name,body in re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]",out,re.S)}
    required={"MathScope.ThresholdBridge."+name for name in
        ["coefficient_norm_bounds","originalBound_le_polynomial","originalLip_le_polynomial",
         "original_threshold_le","original_sharp_error","exists_unique_fixedPoint_at_Q64"]}
    expected_present=required<=set(axes)
    only_allowed=all(set(values)<=set(["propext","Classical.choice","Quot.sound"]) for values in axes.values())
    kernel_after=sha(KERNEL)
    receipt={'schema':'MathScope.Navier.OriginalRemainderThresholdKernelCheck/1',
        'startedUTC':started,'finishedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'command':cmd,'cwd':str(REPO),'sourceSHA256':sha(src),'runnerSHA256':sha(Path(__file__)),
        'originalCommit':PIN,'kernelSHA256':KERNEL_SHA,'exitCode':result.returncode,
        'originalTrackedFilesPreserved':before==after,'printedAxioms':axes,
        'requiredAxiomDeclarationsPresent':expected_present,'onlyStandardAxioms':only_allowed,
        'kernelSHA256After':kernel_after,'kernelPreserved':kernel_after==KERNEL_SHA,
        'containsSorryAx':any('sorryAx' in a for a in axes.values()),
        'status':'PASS' if result.returncode==0 and before==after and expected_present and only_allowed and kernel_after==KERNEL_SHA else 'FAIL',
        'scope':'Literal original remainder bounds; actual coefficient/operator norm premises remain explicit',
        'fullAnalyticInputProducerCompleted':False,'fullOriginalN303Completion':False}
    (dest/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'attempt':str(dest),'status':receipt['status'],'exitCode':result.returncode}))
    print(out)
    return int(receipt['status']!='PASS')
if __name__=='__main__':raise SystemExit(main())
