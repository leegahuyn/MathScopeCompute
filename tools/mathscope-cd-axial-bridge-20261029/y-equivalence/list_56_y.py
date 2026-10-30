import json
from pathlib import Path
nodes=json.loads(Path('work/source-audit/prefix-selected-nodes.json').read_text())
d=json.loads(Path('C:/Users/사용자/Documents/Codex/2026-10-24/referenced-chatgpt-conversation-this-is-an/work/fresh-first-fivemap-receipt.json').read_text())
pairs=d['expanded_native_definition_semantic_closure']['natural_source_input_pairs']['original_56_input_pairs']
def fmt(i,depth=0):
 n=nodes[str(i)]; op=n['op']; a=n['args']
 if op in ['coordinate','source_parameter','rational']:return f'{op}{a}#{i}'
 if depth>=4:return f'{op}#{i}'
 if op in ['multiply','add','inverse','exp','integer_power']:
  argids=a[:1] if op=='integer_power' else a
  return f'{op}#{i}('+','.join(fmt(j,depth+1) if str(j) in nodes else str(j) for j in argids)+')'
 return f'{op}#{i}'
for p in pairs:
 n=nodes[str(p['Y_node_id'])];
 if n['op']=='multiply' and any(nodes[str(i)]['op']=='exp' for i in n['args'] if str(i) in nodes):
  print(p['Y_node_id'],p['source_call_nodes'],fmt(p['Y_node_id']))
