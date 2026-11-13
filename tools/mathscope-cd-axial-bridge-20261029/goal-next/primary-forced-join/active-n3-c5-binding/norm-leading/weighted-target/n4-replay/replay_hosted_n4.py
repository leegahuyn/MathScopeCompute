#!/usr/bin/env python3
"""Fail-closed replay of the hosted N4 target and its arithmetic dependencies."""
import argparse,gzip,hashlib,json,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--artifact',type=Path,required=True);p.add_argument('--outdir',type=Path,required=True);p.add_argument('--prefix',type=int,choices=(3,4),default=4);a=p.parse_args()
D=Path('work/goal-next/continuation40/n4-target');a.outdir.mkdir(parents=True,exist_ok=True)
R=a.artifact
native=json.loads((R/'primary-c5-native.json').read_bytes());index=json.loads((R/'primary-K-binding-index.json').read_bytes())
front=R/'primary-K-arithmetic-frontier.json';idx=R/'primary-K-binding-index.json';graph=R/'primary-target-c6-source.jsonl.gz'
for path,key in [(front,'normOperandBoundary'),(idx,'normBindingIndex')]:assert hashlib.sha256(path.read_bytes()).hexdigest()==native[key]['sha256'],key
assert index['prefix']==a.prefix and native['targetOperandDag']['schema']=='MathScope.ActualTargetC6TypedDag/1' and native['targetOperandDag']['rowCount']==168
assert graph.is_file()
with gzip.open(graph,'rt',encoding='utf8') as f:header=json.loads(f.readline())
assert header['nodeRecordsSHA256']==native['targetOperandDag']['nodeRecordsSHA256']
assert header['sourceProfile']==native['targetOperandDag']['sourceProfile']==index['targetSourceProfileSHA256']
def execute(*args):subprocess.run([str(x) for x in args],check=True)
label=f'n{a.prefix}'
match=a.outdir/f'{label}-live-c6-c7-binding.json';integrals=a.outdir/f'{label}-three-integrals-binding.json';classification=a.outdir/f'{label}-weighted-target-classification.json';directed=a.outdir/f'{label}-weighted-target-directed.json';readback=a.outdir/f'{label}-weighted-target-readback.json'
execute(sys.executable,D/'match_c6_certified.py','--live',graph,'--out',match)
execute(sys.executable,D/'bind_three_source_integrals.py','--graph','work/goal-next/axial-recursion/hosted-43020929929/original-n2-current-pressure-graph/original-source-nodes.jsonl.gz','--historic','work/goal-next/whole-k-prefix/historical-scale-arithmetic-input.json','--live',graph,'--out',integrals)
execute(sys.executable,D/'classify_weighted_target.py','--prefix',a.prefix,'--frontier',front,'--index',idx,'--match',match,'--directed','work/goal-next/continuation38/target-bound/c7-directed-readback.json','--out',classification)
execute('node','--max-old-space-size=4096',D/'evaluate_weighted_target.mjs','work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/whole-k-annular-initial/numerical/source_arithmetic.mjs','work/goal-next/annular-numeric-24/pinned-original-runtime','work/goal-next/whole-k-prefix/historical-scale-arithmetic-result.json','work/goal-next/whole-k-prefix/historical-scale-arithmetic-input.json',R,match,'work/goal-next/continuation37/slow-chart-directed.json','work/goal-next/continuation37/slow-chart-majorant.json',classification,integrals,directed)
execute(sys.executable,D/'check_weighted_target_directed.py','--input',directed,'--classification',classification,'--out',readback)
mapped=index.get('mapFTC');out={'status':'PASS_ALL_TARGET_REPLAYS','prefix':a.prefix,'mapFTCPresent':mapped is not None,
 'mapFTCFields':sorted(mapped) if isinstance(mapped,dict) else [],
 'nativeTargetDag':native['targetOperandDag'],'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (match,integrals,classification,directed,readback)},
 'scope':'Conditional on the archived target/slow-chart/integral analytic interval bounds and same-family source seals; no full K or release conclusion.','release':'HOLD'}
(a.outdir/f'{label}-replay-summary.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print(json.dumps({'status':out['status'],'prefix':a.prefix,'mapFTCPresent':out['mapFTCPresent']}))
