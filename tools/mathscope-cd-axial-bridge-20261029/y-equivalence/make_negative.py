import json,pathlib
p=pathlib.Path('C:/Users/사용자/Documents/Codex/2026-10-24/referenced-chatgpt-conversation-this-is-an/work/fresh-first-fivemap-receipt.json')
d=json.loads(p.read_text(encoding='utf8'));d['source_node_sha256']='0'*64
pathlib.Path('work/jet-followup/invalid-receipt.json').write_text(json.dumps(d),encoding='utf8')
