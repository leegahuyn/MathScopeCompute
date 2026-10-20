"""Replay the two constructive-bound checks only in a fresh copied tree."""
import argparse,hashlib,json,shutil,subprocess,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
root=a.root.resolve();out=a.out.resolve();out.mkdir(parents=True,exist_ok=False)
source=root/'work/actual_evaluator_sources'
rows=json.loads((source/'SOURCE_PINS.json').read_text(encoding='utf-8'))['sources']
picard=json.loads((source/'PICARD_BOUND_ROUTE.json').read_text(encoding='utf-8'))['source']
if picard['path'] not in {row['path'] for row in rows}:
    rows.append(picard)
for row in rows:
    relative=Path(row['path']);assert not relative.is_absolute() and '..' not in relative.parts
    data=(root/relative).read_bytes();assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256']
    dest=out/relative;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
here=out/'work/actual_evaluator_sources';here.mkdir(parents=True,exist_ok=True)
for src in source.iterdir():
    if src.is_file():shutil.copyfile(src,here/src.name)
steps=[]
for name in ['verify_source_research.py','verify_picard_bound_route.py']:
    result=subprocess.run([sys.executable,'-X','utf8','-B',str(here/name),'--root',str(out)],capture_output=True,cwd=out)
    (out/(name+'.stdout.log')).write_bytes(result.stdout);(out/(name+'.stderr.log')).write_bytes(result.stderr)
    steps.append({'script':name,'exit_code':result.returncode})
record={'passed':all(s['exit_code']==0 for s in steps),'steps':steps,'scope':'Constructive elementary bounds and source Picard norm route only. No global-field numerical completion.'}
(out/'REPLAY_RECEIPT.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
print(json.dumps(record));raise SystemExit(0 if record['passed'] else 1)
