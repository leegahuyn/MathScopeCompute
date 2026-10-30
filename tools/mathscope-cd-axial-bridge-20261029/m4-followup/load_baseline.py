"""Extract exact tracked producer modules from the named repository commit."""
import argparse,hashlib,json,pathlib,subprocess
p=argparse.ArgumentParser();p.add_argument('--repo',required=True);p.add_argument('--ref',default='9595b4de5a1065b694d225c0ad2a14d5aa4435a9');a=p.parse_args()
root=pathlib.Path(__file__).resolve().parent
paths=['research-ide/mathscope-m0/proof.mjs','research-ide/mathscope-m0/lean/shipped-proof-data.mjs','research-ide/mathscope-m4/proof-jobs.mjs']
out={}
for path in paths:
 b=subprocess.check_output(['git','show',a.ref+':'+path],cwd=a.repo)
 dest=root/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
 out[path]=hashlib.sha256(b).hexdigest()
(root/'producer-hashes.json').write_text(json.dumps({'commit':a.ref,'sha256':out},indent=2)+'\n',encoding='utf8')
print(json.dumps(out,indent=2))
