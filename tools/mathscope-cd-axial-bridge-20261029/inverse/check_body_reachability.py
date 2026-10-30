"""Check syntactic typed-operand reachability from four bodies to #622820."""
import argparse,gzip,json,sys
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--audit-script',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
sys.path.insert(0,str(a.audit_script.parent));from audit_source_graph import operand_refs
reg=json.loads((a.source/'original-source-functions.json').read_text(encoding='utf8'))
expr=json.loads(reg['base']['base']['expression']);ids=[688,689,690,691]; nodes=[]
with gzip.open(a.source/'original-source-nodes.jsonl.gz','rt',encoding='utf8') as f:
 next(f)
 for i,line in enumerate(f):
  nodes.append(json.loads(line))
  if i>=622940:break
out={}
for fid in ids:
 root=expr[fid]['body'];todo=[(root,[])];seen=set();path=None
 while todo:
  n,parents=todo.pop()
  if n in seen:continue
  seen.add(n)
  if n==622820:path=parents+[n];break
  if n>=len(nodes):continue
  todo.extend((j,parents+[n]) for j in operand_refs(nodes[n]))
 assert path is not None,(fid,root)
 out[str(fid)]={'function':expr[fid]['name'],'body':root,'typed_operand_path':path,'path_nodes':{str(i):nodes[i] for i in path}}
a.out.write_text(json.dumps(out,indent=2),encoding='utf8')
print(json.dumps({k:{'body':v['body'],'path':v['typed_operand_path']} for k,v in out.items()},indent=2))
