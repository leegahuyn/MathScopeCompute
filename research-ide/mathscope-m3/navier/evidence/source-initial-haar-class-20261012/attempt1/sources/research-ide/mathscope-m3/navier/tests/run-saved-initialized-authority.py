#!/usr/bin/env python3
"""Observe a read-only actual source capability and independent byte audit.

No original source constructor or 540-identity replay is rerun. The full
saved parent stream, exact initialized prefix and selected source roots
are byte-bound independently in Python; no new PDE/class result is claimed.
"""
from datetime import datetime,timezone
from pathlib import Path
import gzip,hashlib,io,json,os,re,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
ORIGINAL=BASE/'evidence/global-forced-current-20261012/attempt382884203291'
def digest(raw):return hashlib.sha256(raw).hexdigest()
def row(p):
    raw=p.read_bytes();return {'path':str(p.relative_to(ROOT)),'bytes':len(raw),'sha256':digest(raw)}
def write(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def require(x,m):
    if not x:raise ValueError(m)
def paths():
    seen=set()
    def visit(p):
        p=p.resolve();require(p.is_relative_to(ROOT) and p.is_file(),'A byte reader dependency is missing')
        if p in seen:return
        seen.add(p)
        if p.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',p.read_text()):visit(p.parent/ref)
    visit(BASE/'tests/saved-initialized-authority.test.mjs');seen.add(Path(__file__).resolve());return sorted(seen)
def independent(program):
    cap=program['source'];mean_bytes=(ORIGINAL/'initialized-mean-construction.json').read_bytes();mean=json.loads(mean_bytes)
    index=json.loads((ORIGINAL/'checkpoint-index.json').read_text());ref=index['checkpoints'][0]
    manifest_path=ROOT/ref['path'];manifest_bytes=manifest_path.read_bytes();m=json.loads(manifest_bytes)
    checks=[]
    def check(name,value):checks.append({'id':name,'pass':bool(value)})
    check('same-fixed-actual-mean-artifact',digest(mean_bytes)==cap['source']['originalMeanCertificateSHA256']==
          '22c878e7ace454c61f00c9ee4952738f7f9fa7b1c269eca538ca224dd8fcb96b')
    check('same-original-manifest',digest(manifest_bytes)==ref['sha256'])
    encoded=b''
    for j,r in enumerate(m['parts']):
        raw=(manifest_path.parent/r['path']).read_bytes();check('complete-gzip-part-'+str(j),digest(raw)==r['sha256'] and len(raw)==r['bytes']);encoded+=raw
    check('complete-parent-compressed-bytes',len(encoded)==m['gzipBytes'] and digest(encoded)==m['gzipSHA256'])
    selected={r['id']:r['node'] for r in program['selectedNodeBindings']};prefix=hashlib.sha256();prefix_bytes=0;raw_hash=hashlib.sha256();raw_bytes=0;count=0
    with gzip.GzipFile(fileobj=io.BytesIO(encoded)) as stream:
        header=stream.readline();raw_hash.update(header);raw_bytes+=len(header)
        for line in stream:
            raw_hash.update(line);raw_bytes+=len(line)
            if count<mean['graph']['nodeCount']:prefix.update(line);prefix_bytes+=len(line)
            if count in selected:
                value=json.loads(line);check('actual-source-root-'+str(count),value[0]==count and value[1]==selected[count])
            count+=1
    check('whole-uncompressed-parent-bytes',count==m['nodeCount'] and raw_bytes==m['rawBytes'] and raw_hash.hexdigest()==m['rawSHA256'])
    check('complete-initialized-mean-prefix',mean['graph']['nodeCount']==3615866==cap['source']['sourceNodeCount'] and
          prefix.hexdigest()==cap['source']['sourceNodePrefixSHA256'] and prefix_bytes==cap['source']['sourceNodePrefixBytes'])
    for key,name in [('temporal','temporal'),('moments','initialized')]:
        check('actual-'+name+'-velocity',cap['actualRoots'][name+'Velocity']==mean['stages'][key]['velocity'])
        check('actual-'+name+'-pressure',cap['actualRoots'][name+'Pressure']==mean['stages'][key]['pressure'])
    check('fresh-current-targets-retained',cap['actualRoots']['freshInputDefects']==mean['bumps']['actualInputDefects'])
    check('new-nonlinear-defects-retained',cap['actualRoots']['retainedRemainderDefects']==mean['nonlinear']['remainderDefects'])
    for key in ['originalPrivateProducerAuthorityHydrated','liveFamilyRuntimeRecreated','uniformAllOrderSourceClassProved',
                'wholeIndependentPhysicalPDECompared','completeForcedCurrentCertificateRecovered','originalN602Complete','completeN6','wholeM3Complete']:
        check('no-promoted-'+key,cap['scope'][key] is False)
    return {'schema':'MathScope.N6.IndependentSavedInitializedSourceByteAudit/1','checks':checks,'checkCount':len(checks),
            'actualSourcePrefixSHA256':prefix.hexdigest(),'actualSourceNodeCount':3615866,'byteArithmetic':'Exact UTF-8 bytes, SHA-256 and integer node identifiers.',
            'wholeOriginalParentStreamRead':True,'noSourceClassOrPDEIdentityProvedByByteHash':True,'pass':all(c['pass'] for c in checks)}
def main():
    require(len(sys.argv)==2 and re.fullmatch(r'[1-9][0-9]*',sys.argv[1]),'Usage: run-saved-initialized-authority.py NEW_ATTEMPT')
    source=paths();before=[row(p) for p in source];out=BASE/'evidence/saved-initialized-authority-20261012'/('attempt'+sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
    for p in source:
        d=out/'sources'/p.relative_to(ROOT);d.parent.mkdir(parents=True,exist_ok=True);d.write_bytes(p.read_bytes())
    write(out/'source-before.json',before)
    command=['node','--max-old-space-size=3072','--test','--test-reporter=tap',str(BASE/'tests/saved-initialized-authority.test.mjs')]
    env=dict(os.environ,M3_SAVED_INITIALIZED_AUTHORITY_EVIDENCE=str(out/'source-authority.json'))
    started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();stopped=None
    with (out/'node.log').open('wb') as log:
        try:r=subprocess.run(command,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=180);code=r.returncode
        except subprocess.TimeoutExpired:code=-1;stopped='OBSERVED_TIME_LIMIT'
    elapsed=time.monotonic()-tick;after=[row(p) for p in source];write(out/'source-after.json',after)
    log=(out/'node.log').read_text();count=lambda name:int(re.findall(r'^# '+name+r' (\d+)$',log,re.M)[-1]) if re.findall(r'^# '+name+r' (\d+)$',log,re.M) else None
    results={'pass':False,'checkCount':0};observation=None
    try:
        if (out/'source-authority.json').is_file():
            program=json.loads((out/'source-authority.json').read_text());results=independent(program);observation=program['processObservation']
    except Exception as error:results={'pass':False,'checkCount':0,'error':str(error)}
    write(out/'independent.json',results)
    success=code==0 and stopped is None and count('pass')==3 and count('fail')==0 and count('skipped')==0 and before==after and results['pass']
    receipt={'schema':'MathScope.N6.SavedInitializedSourceAuthorityObservedExecution/1','attempt':int(sys.argv[1]),'startedAt':started,
             'finishedAt':datetime.now(timezone.utc).isoformat(),'command':command,'elapsedSeconds':elapsed,'timeoutSeconds':180,'v8OldSpaceMiB':3072,
             'exitCode':code,'stoppedReason':stopped,'nodeTests':{'passed':count('pass'),'failed':count('fail'),'skipped':count('skipped'),'required':3},
             'sourceFileCount':len(source),'sourceFilesUnchanged':before==after,'independentChecks':results['checkCount'],'independentPass':results['pass'],
             'processObservation':observation,'originalSourceConstructorRerun':False,'originalCoefficientReplayRerun':False,
             'originalPrivateSourceAuthorityHydrated':False,'wholeIndependentPDECompared':False,'allOrderSourceClassProved':False,
             'originalN602Complete':False,'wholeM3Complete':False,'artifacts':[row(p) for p in sorted(out.iterdir()) if p.is_file()],'pass':bool(success)}
    write(out/'receipt.json',receipt);print(json.dumps({'receipt':row(out/'receipt.json'),'pass':bool(success),'nodeTests':receipt['nodeTests'],
          'independentChecks':results['checkCount'],'elapsedSeconds':elapsed},indent=2));return 0 if success else 1
if __name__=='__main__':sys.exit(main())
