#!/usr/bin/env python3
"""Cheap byte integrity check; this does not execute the source constructors."""
import hashlib,json,pathlib
root=pathlib.Path(__file__).resolve().parent
manifest=json.loads((root/'SOURCE_PROVENANCE.json').read_text())
rows=[]
for row in manifest['files']:
    data=(root/row['path']).read_bytes()
    digest=hashlib.sha256(data).hexdigest()
    rows.append({'path':row['path'],'bytes':len(data),'sha256':digest,
                 'pass':len(data)==row['bytes'] and digest==row['sha256']})
result={'schema':'MathScope.N602.OriginalInputByteIntegrity/1','originalFiles':len(rows),
        'expectedFiles':manifest['original_source_count'],'allMatched':all(r['pass'] for r in rows),
        'archiveSHA256':manifest['archiveSHA256'],'checks':rows,
        'newPositiveSourceConstructionExecuted':False}
(root/'ORIGINAL_INPUT_INTEGRITY.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'originalFiles':len(rows),'allMatched':result['allMatched']}))
raise SystemExit(0 if result['allMatched'] and len(rows)==manifest['original_source_count'] else 1)
