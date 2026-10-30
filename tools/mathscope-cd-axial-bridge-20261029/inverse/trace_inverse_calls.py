"""Source-bound #622820 caller inventory, with exact graph provenance.

An occurrence is not an evaluation and no native chart-domain claim is made.
"""
import argparse,collections,gzip,hashlib,json
from pathlib import Path

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 manifest=json.loads((a.source/'original-source-export-manifest.json').read_text(encoding='utf8'))
 defs=json.loads((a.source/'original-source-functions.json').read_text(encoding='utf8'))
 exp=json.loads(defs['base']['base']['expression']);mon=json.loads(defs['base']['base']['monotone'])
 assert mon[2]['parameters']==[622803,622804] and mon[2]['name']=='ActualCommonBandSlowInverse'
 targets={688,689,690,691}; found=collections.defaultdict(list);selected={}; h=hashlib.sha256()
 with gzip.open(a.source/'original-source-nodes.jsonl.gz','rb') as f:
  header=f.readline();h.update(header)
  for i,line in enumerate(f):
   h.update(line);n=json.loads(line);op=n['op'];args=n['args']
   if 622791<=i<=623950: selected[i]=n
   if op=='actual_expression_partial' and args[0] in targets:
    found[args[0]].append({'id':i,'arguments':args[1],'derivatives':args[2]})
 assert h.hexdigest()==manifest['node_stream_sha256']
 assert selected[622803]=={'op':'coordinate','args':['m3_global_band_slow_Z$30436']}
 assert selected[622804]=={'op':'coordinate','args':['m3_global_band_slow_T$30437']}
 assert selected[622820]=={'op':'actual_monotone_root','args':[2,622803,622804]}
 for fid in targets:assert exp[fid]['parameters']==[622802,622803,622804,622791]
 out={'graph_sha256':h.hexdigest(),'root':selected[622820], 'monotone_system':mon[2],
      'expression_definitions':{str(i):exp[i] for i in sorted(targets)},
      'call_counts':{str(i):len(found[i]) for i in sorted(targets)},
      'argument_tuples':{str(i):[{'arguments':list(t),'count':c} for t,c in collections.Counter(tuple(v['arguments']) for v in found[i]).most_common()] for i in sorted(targets)},
      'calls':found,'selected_nodes':selected,
      'scope':'call argument IDs only; no interpreter, no source-native range proof, no graph reachability proof per root'}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(out,indent=2,ensure_ascii=False),encoding='utf8')
 print(json.dumps({'graph_sha256':out['graph_sha256'],'counts':out['call_counts'],'scope':out['scope']},indent=2))
if __name__=='__main__':main()
