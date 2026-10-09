"""Package actual, successful Lean audits; never synthesize proof receipts.

The browser can compare these exact sources. This build step verifies the
stored source and log bytes, and the original compiler exit codes. A paper
reference remains separate from a locally imported Lean target.
"""
from pathlib import Path
import json, hashlib

ROOT=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b.encode() if isinstance(b,str) else b).hexdigest()
audits=[]

def verified_file(root,entry):
    path=root/entry['path']
    text=path.read_text()
    assert text==entry['content'], ('Source changed after kernel audit',path)
    assert sha(text)==entry['sha256'], ('Source digest mismatch',path)
    return {**entry,'path':str(path.relative_to(ROOT))}

def verified_build(root,b):
    assert b['exitCode']==0, ('Failed positive build',b.get('command'))
    log=b.get('log','')
    assert sha(log)==b['logSha256'], 'Compiler log hash mismatch'
    log_file=b.get('logFile') or b.get('logPath')
    if log_file:
        assert (root/log_file).read_text()==log, ('Stored log mismatch',log_file)
    return b

for domain,loc in [('arithmetic','evidence/lean-audit.json'),('gauge','lean/lean-audit.json')]:
    root=ROOT/domain; source=root/loc
    data=json.loads(source.read_text())
    file_root=root if domain=='arithmetic' else root/'lean'
    files=[verified_file(file_root,f) for f in data['sourceFiles']]
    files=[f for f in files if f.get('role')!='EXPECTED_REJECTED_SOURCE' and 'Negative' not in f['path']]
    builds=[verified_build(file_root,b) for b in data.get('builds',data.get('commands',[]))]
    targets=data['targets']
    for t in targets:
        assert t.get('name') and t.get('type') and isinstance(t.get('axioms'),list)
        assert not t.get('customAxioms') and 'sorryAx' not in t['axioms']
    for n in data['negativeControls']:
        assert n['exitCode']!=0 and n['rejected']
        assert sha(n['log'])==n['logSha256']
    environment=data.get('environment') or {k:data[k] for k in ['toolchain','mathlibCommit','mathlibImported','runtimeLibrarySha256','driverSha256','kernelModified','runtimeModified','guardModified','frontend']}
    audits.append({'id':domain+'-m1-local','label':('산술 · 복합체 · 소수' if domain=='arithmetic' else '게이지 · SU(3) · G2 · 조건부 정리')+' / '+str(len(targets))+' Lean targets','sourceFiles':files,'targets':targets,'builds':builds,'environment':environment,'negativeControls':data['negativeControls'],'scope':data['scope'],'checkedAt':data['checkedAt'],'originalAuditPath':str(source.relative_to(ROOT)),'originalAuditSha256':sha(source.read_bytes()),'browserKernelRerun':False})

# The NS adapter is optional until its whole narrow component build succeeds.
# A partially successful module compilation cannot issue a package receipt.
nsroot=ROOT/'navier'; nspath=nsroot/'evidence/lean-validation.json'
if nspath.exists():
    data=json.loads(nspath.read_text())
    records=data.get('records',[])
    if records and all(r['exitCode']==0 for r in records) and data.get('negativeControls'):
        files=[]; builds=[]; targets=[]
        for r in records:
            p=nsroot/r['sourceFile']; content=p.read_text()
            assert sha(content)==r['sourceSha256']
            files.append({'path':str(p.relative_to(ROOT)),'content':content,'sha256':sha(content),'externalSourceUnchanged':r.get('externalSourceUnchanged',False)})
            builds.append(verified_build(nsroot/'evidence',r))
            targets.extend({'name':t['target'],'type':t['targetType'],'axioms':t['axioms'],'customAxioms':t.get('customAxioms',[])} for t in r['targets'])
        for t in targets:assert t['name'] and t['type'] and not t['customAxioms'] and 'sorryAx' not in t['axioms']
        for n in data['negativeControls']:
            assert n['exitCode']!=0 and (n.get('rejected') or n.get('expectedRejected'))
            assert sha(n['log'])==n['logSha256']
        audits.append({'id':'ns-m1-local','label':'유체 · 실제 외부 정의 · 분석 가정 / '+str(len(targets))+' Lean targets','sourceFiles':files,'targets':targets,'builds':builds,'environment':data['environment'],'negativeControls':data['negativeControls'],'scope':data['scope'],'external':data['external'],'checkedAt':data['checkedAt'],'originalAuditPath':str(nspath.relative_to(ROOT)),'originalAuditSha256':sha(nspath.read_bytes()),'browserKernelRerun':False})

# The follow-up rc2 audit is a separate cohort: imported original statements
# and four new fixed scalar lemmas. It never certifies all generated analytic
# premises of the executable axis-bound producer.
axis_path=nsroot/'followup-construction/axis-pinned-audit.json'
if axis_path.exists():
    data=json.loads(axis_path.read_text())
    assert data['id']=='ns-axis-original-rc2'
    assert data['browserKernelRerun'] is False and data['fullAnalyticPremiseKernelProof'] is False
    assert data['environment']['kernelModified'] is False
    assert data['environment']['runtimeModified'] is False
    assert data['environment']['verifierGuardModified'] is False
    files=[verified_file(ROOT,f) for f in data['sourceFiles']]
    builds=[verified_build(ROOT,b) for b in data['builds']]
    assert builds
    targets=data['targets']
    for t in targets:
        assert t['name'] and t['type'] and isinstance(t['axioms'],list)
        assert not t.get('customAxioms') and 'sorryAx' not in t['axioms']
        assert t['scope'] in {'IMPORTED_ORIGINAL_THEOREM_TYPE_AND_AXIOM_AUDIT','KERNEL_CHECKED_FIXED_SCALAR_THEOREM'}
    assert sum(t['scope']=='IMPORTED_ORIGINAL_THEOREM_TYPE_AND_AXIOM_AUDIT' for t in targets)==16
    assert sum(t['scope']=='KERNEL_CHECKED_FIXED_SCALAR_THEOREM' for t in targets)==4
    for n in data['negativeControls']:
        assert n['exitCode']!=0 and n['rejected']
        assert sha(n['log'])==n['logSha256']
        assert (ROOT/n['logFile']).read_text()==n['log']
    original=ROOT/data['originalAuditPath']
    assert sha(original.read_bytes())==data['originalAuditSha256']
    audits.append({**data,'sourceFiles':files,'builds':builds})

references=[]
source_sets=json.loads((ROOT/'core/domain-references.json').read_text())
for domain,entries in source_sets.items():
    for r in entries:
        if r.get('status')=='LOCAL_SOURCE_PINNED_IN_LEAN_AUDIT':continue
        references.append({'id':r['id'],'title':r['title'],'url':r['url'],'locator':r.get('locator',''),'scope':r.get('supports') or r.get('role') or r.get('access') or 'Scope stated in the source adapter.','domains':[domain],'status':'THEOREM_REFERENCE'})
lock=json.loads((nsroot/'sources.lock.json').read_text())
references.extend([
    {'id':'NS-PAPER','title':lock['attachment']['author']+', '+lock['attachment']['title'],'url':'https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf','locator':'Theorem 1.1; Theorem 4.6; Appendices A, B, C; 166 pages','scope':'Forced R3/periodic theorem reference and actual leading component formulae. Full source proof and complete profile certification are separate.','domains':['ns'],'status':'THEOREM_REFERENCE','sha256':lock['attachment']['sha256'],'version':lock['attachment']['date']},
    {'id':'NS-OFFICIAL-REPOSITORY','title':'OpenAI NavierStokesAndEuler source repository','url':lock['repository']['url']+'/tree/'+lock['repository']['commit'],'locator':'Pinned commit '+lock['repository']['commit']+'; Flatness and ProblemStatement adapter','scope':'Selected unchanged source components have separate local audits; the original full repository is not rebuilt.','domains':['ns'],'status':'THEOREM_REFERENCE','version':lock['repository']['commit']}
])
known_bsd=json.loads((ROOT/'core/bsd-known-case-reference.json').read_text())
assert known_bsd['role']=='THEOREM_REFERENCE' and not known_bsd['kernelVerified'] and known_bsd['leanImport'] is None
known_bsd['scope']='E/Q의 해석적 랭크 0·1을 정확히 가정하면 대수적 랭크 일치와 Sha 유한성. 전체 BSD 선도계수 공식·랭크 계산·수치 입력의 자동 인증은 포함하지 않습니다.'
references.insert(0,known_bsd)
assert len({r['id'] for r in references})==len(references)
(ROOT/'core/audit-data.mjs').write_text('export const AUDITS = '+json.dumps(audits,ensure_ascii=False)+';\nexport const REFERENCES = '+json.dumps(references,ensure_ascii=False)+';\n')
(ROOT/'evidence').mkdir(exist_ok=True)
(ROOT/'evidence/packaged-audits.json').write_text(json.dumps({'audits':[{'id':a['id'],'targets':len(a['targets']),'positiveBuilds':len(a['builds']),'negativeControls':len(a['negativeControls']),'sourceFiles':len(a['sourceFiles']),'sourceAuditSha256':a['originalAuditSha256']} for a in audits],'references':references,'kernelRerun':False,'scope':'Package byte validation of actual previous kernel checks.'},ensure_ascii=False,indent=2))
print(json.dumps({'audits':len(audits),'targets':sum(len(a['targets']) for a in audits),'references':len(references),'bytes':(ROOT/'core/audit-data.mjs').stat().st_size}))
