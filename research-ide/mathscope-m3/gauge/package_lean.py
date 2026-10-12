#!/usr/bin/env python3
"""Package only observed, hashed kernel results for browser audit comparison."""
from pathlib import Path
import json,hashlib,base64
HERE=Path(__file__).resolve().parent
IDE=HERE.parents[1]
REPO=IDE.parent
report=json.loads((HERE/'evidence'/'lean-audit.json').read_text())
sources=[]
recorded={}
for row in report['commands']+report['inheritedLegacySources']:
    path=row['sourcePath'];recorded.setdefault(path,set()).add(row['sourceSha256'])
for row in report['commands']:
    if not row['expectedOutcomeObserved'] or ((row['exitCode']==0)!=(row['expected']=='PASS')):
        raise ValueError('A process did not have its recorded expected outcome: '+row['id'])
    if hashlib.sha256((IDE/row['logPath']).read_bytes()).hexdigest()!=row['logSha256']:
        raise ValueError('Kernel log bytes changed: '+row['logPath'])
for path in sorted(recorded):
    raw=(IDE/path).read_bytes();content=raw.decode('utf-8');sha=hashlib.sha256(raw).hexdigest()
    if recorded[path]!={sha}:
        raise ValueError('Source changed after its kernel receipt; new kernel run required: '+path)
    sources.append({'path':path,'content':content,'sha256':sha})
old=json.loads((HERE/'legacy'/'original-validation.json').read_text())
report['legacyCoreTen']={'axiomFreeCount':old['core']['axiomFreeTheoremCount'],'customDependentCount':old['core']['customAxiomDependentTheoremCount'],'sourceSha256':old['core']['sourceSha256'],'abstractOrderInterface':True,'newCoreExecution':True}
report['legacyCustomAxioms']={k:old[k]['customAxioms'] for k in ['core','mathlib','scenario']}
report['legacyMathlibPin']={'tag':old['mathlib']['mathlibTag'],'commit':old['mathlib']['mathlibCommit'],'sourceSha256':old['mathlib']['sourceSha256'],'newExecution':False}
real_release_path=HERE/'evidence/real-lean-release.json'
real_audit=None
real_release=None
if real_release_path.exists():
    real_release=json.loads(real_release_path.read_text())
    root=HERE/'evidence/real-lean-audit'
    raw=(root/'audit.json').read_bytes();real_audit=json.loads(raw)
    if real_release['status']!='RECORDED_CI_SOURCE_MATCH' or real_release['report']!=real_audit:
        raise ValueError('The real release does not preserve its observed source-bound CI report')
    if real_audit['status']!='KERNEL_CHECKED_REAL_FINITE_SCOPES' or real_audit['customAxioms'] or not real_audit['absenceOfSorry']:
        raise ValueError('The real finite kernel gates were not all observed')
    if hashlib.sha256(raw).hexdigest()!=real_release['localPackagingVerification']['rawAuditSHA256']:
        raise ValueError('The original real audit bytes changed')
    archive=HERE/'evidence'/real_release['archive']
    if hashlib.sha256(archive.read_bytes()).hexdigest()!=real_release['ci']['artifactSHA256']:
        raise ValueError('The downloaded CI archive bytes changed')
    if hashlib.sha256((root/'import-closure.json').read_bytes()).hexdigest()!=real_audit['environment']['importClosureSha256']:
        raise ValueError('The real imported closure changed')
    for row in real_audit['sourceFiles']:
        file=(REPO/row['path']).resolve()
        if not file.is_relative_to(REPO):
            raise ValueError('Audited source is outside the repository')
        raw=file.read_bytes()
        if hashlib.sha256(raw).hexdigest()!=row['sha256']:
            raise ValueError('Real source changed after CI; new kernel run required: '+row['path'])
        display_path=row['path'].removeprefix('research-ide/') if row['path'].startswith('research-ide/') else '../'+row['path']
        sources.append({'path':display_path,'content':raw.decode('utf-8'),'sha256':row['sha256'],'kernelScope':'REAL_FINITE_CI_DEPENDENCY'})
    commands=[real_audit['build'],real_audit['consumerAudit']]
    for row in real_audit['hypothesisRemovalControls']:
        if not row['expectedRejectionObserved'] or row['positiveControl']['exitCode']!=0 or row['negativeControl']['exitCode']==0:
            raise ValueError('A real hypothesis-removal control failed its exact expected outcome')
        commands.extend([row['positiveControl'],row['negativeControl']])
        for stem,key in [('Consumer_','positiveSourceSha256'),('Removed_','negativeSourceSha256')]:
            file=root/(stem+row['id']+'.lean');raw=file.read_bytes()
            if hashlib.sha256(raw).hexdigest()!=row[key]:
                raise ValueError('A real hypothesis-removal source changed: '+file.name)
            sources.append({'path':str(file.relative_to(IDE)),'content':raw.decode('utf-8'),'sha256':row[key],'kernelScope':'REAL_FINITE_HYPOTHESIS_CONTROL'})
    for row in commands:
        if hashlib.sha256((root/row['logFile']).read_bytes()).hexdigest()!=row['logSha256']:
            raise ValueError('A real raw compiler log changed: '+row['logFile'])
    if len(real_audit['targets'])!=8 or len(real_audit['hypothesisRemovalControls'])!=9:
        raise ValueError('The real finite target/control set is incomplete')
    real_release={k:real_release[k] for k in ['schema','status','ci','localPackagingVerification','serializedAuthority']}
payload={'audit':report,'realAudit':real_audit,'realRelease':real_release,'sources':sources}
encoded=base64.b64encode(json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode('utf-8')).decode('ascii')
# Preserve the exact UTF-8 source bytes across publishers that decode Unicode
# escapes inside nested JavaScript strings. Decode before the unchanged SHA
# comparisons; this changes transport only, never source or proof authority.
(HERE/'proof-data.mjs').write_text('// Generated only after current source/log bytes match observed kernel receipts. Imported files cannot grant this authority.\n// UTF-8 base64 transport preserves literal source escapes through HTML publishing.\nconst PINNED_GAUGE_PAYLOAD=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(atob("'+encoded+'"),c=>c.charCodeAt(0))));\nexport const PINNED_GAUGE_AUDIT=PINNED_GAUGE_PAYLOAD.audit;\nexport const PINNED_GAUGE_REAL_AUDIT=PINNED_GAUGE_PAYLOAD.realAudit;\nexport const PINNED_GAUGE_REAL_RELEASE=PINNED_GAUGE_PAYLOAD.realRelease;\nexport const PINNED_GAUGE_SOURCES=PINNED_GAUGE_PAYLOAD.sources;\n')
print('Packaged',len(sources),'sources;',len(report['commands']),'local finite/legacy processes;',len(real_audit['targets']) if real_audit else 0,'new real CI targets.')
