"""Copy the exact bounded replay inputs; never mutate their source paths."""
from pathlib import Path
import argparse,json,hashlib,shutil
def main():
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path('.'));p.add_argument('--destination',type=Path,required=True);a=p.parse_args()
    root=a.root.resolve();destination=a.destination.resolve();manifest=json.loads((root/'work/actual_evaluator/evidence/INPUT_MANIFEST.json').read_text())
    paths={r['path'] for r in manifest['files']}
    paths.add('analysis/base/PR30-recovery-handoff/MathScopeCompute/tools/n6-native-domain-frontier-20261015/native_domain_extract.py')
    own=root/'work/actual_evaluator'
    paths.add('work/actual_evaluator/README.md')
    for folder,glob in [('code','*.py'),('code','*.mjs'),('evidence','*.json'),('evidence','*.csv')]:
        paths.update(str(p.relative_to(root)) for p in (own/folder).glob(glob))
    paths.update(str(p.relative_to(root)) for p in (own/'core_source').rglob('*.mjs'))
    rows=[]
    for relative in sorted(paths):
        src=root/relative;dst=destination/relative;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst)
        raw=dst.read_bytes();rows.append({'path':relative,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
    result={'schema':'MathScope.ActualEvaluatorPortableReplayInputs/1','files':rows,'count':len(rows),'total_bytes':sum(x['bytes'] for x in rows)}
    (destination/'ACTUAL_EVALUATOR_REPRO_MANIFEST.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'files':len(rows),'bytes':result['total_bytes']}))
if __name__=='__main__':main()
