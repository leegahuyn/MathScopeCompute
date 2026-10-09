#!/usr/bin/env python3
"""Refresh delivery file hashes without changing the sealed audit summary."""
from pathlib import Path
import hashlib,json
B=Path(__file__).resolve().parent
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
files=[]
for p in sorted(B.iterdir()):
    if p.is_file() and p.suffix in ['.json','.log','.md','.lean','.diff','.py','.c'] and p.name!='audit-files.json':
        files.append({'file':p.name,'bytes':p.stat().st_size,'sha256':digest(p)})
(B/'audit-files.json').write_text(json.dumps({
    'files':files,
    'sealedSummarySHA256':digest(B/'official-audit-summary.json'),
    'excluded':'Toolchains, archives, source checkouts, .lake, and build/cache directories are intentionally outside the delivery set.'},indent=2)+'\n')
print(json.dumps({'files':len(files),'bytes':sum(p['bytes'] for p in files),
                 'auditFilesSHA256':digest(B/'audit-files.json'),
                 'sealedSummarySHA256':digest(B/'official-audit-summary.json')},indent=2))
