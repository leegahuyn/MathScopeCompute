#!/usr/bin/env python3
"""Observe a positive exact saved-source norm binding and audit its full AST.

The original saved source is read and authenticated. Its norm composition
uses the fixed same-source continuation; high-order derivative bodies and
the improved tangential-residual proof remain separately labelled. The
independent full scalar oracle uses formal positive values only, as in its
original gate. Those values never become norms of the actual source.
"""
from datetime import datetime,timezone
from pathlib import Path
import copy,hashlib,importlib.util,json,os,re,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[4];BASE=ROOT/'research-ide/mathscope-m3/navier'
def digest(raw):return hashlib.sha256(raw).hexdigest()
def row(p):
    raw=p.read_bytes();return {'path':str(p.relative_to(ROOT)),'bytes':len(raw),'sha256':digest(raw)}
def write(p,value):p.write_text(json.dumps(value,indent=2)+'\n')
def require(value,message):
    if not value:raise ValueError(message)
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def sources():
    seen=set()
    def visit(p):
        p=p.resolve();require(p.is_relative_to(ROOT) and p.is_file(),'A full source dependency is missing')
        if p in seen:return
        seen.add(p)
        if p.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',p.read_text()):visit(p.parent/ref)
    for p in [BASE/'tests/saved-initialized-norm-family.test.mjs',Path(__file__),
              BASE/'tests/run-saved-initialized-authority.py',BASE/'tests/run-initialized-lazy-norm-program.py']:visit(p)
    return sorted(seen)
def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def independent(data):
    checks=[]
    def check(name,value):checks.append({'id':name,'pass':bool(value)})
    source_audit=module('saved_source_byte_oracle',BASE/'tests/run-saved-initialized-authority.py').independent(data)
    checks.extend(source_audit['checks'])
    scalar_audit=module('original_source_scalar_oracle',BASE/'tests/run-initialized-lazy-norm-program.py')
    checks.extend(scalar_audit.independent(data['rawProgramFixtures']))
    source=data['source'];family=data['family'];binding=family['sourceBinding']
    check('actual-source-capability-positive-binding',data['actualSavedSourcePositiveBindingExecuted'] is True)
    check('same-initialized-source-node-prefix',binding['actualMeanSourcePrefixSHA256']==source['source']['sourceNodePrefixSHA256'])
    check('complete-actual-current-roots',binding['actualRoots']==source['actualRoots'])
    original=json.loads((BASE/'evidence/global-forced-current-20261012/attempt382884203291/source-bytes-before.json').read_text())
    by_path={r['path']:r for r in original['files']}
    for r in family['continuation']['originalRecipeFiles']:
        check('unchanged-original-continuation-producer-'+r['path'],by_path.get(r['path'])==r and row(ROOT/r['path'])==r)
    for j,certificate in enumerate(data['certificates']):
        p=certificate['program'];raw=data['rawProgramFixtures']['programs'][j];tag='bound-m'+str(p['request']['order'])+'-'
        text=canonical(p).encode()
        check(tag+'complete-lossless-program-hash',digest(text)==certificate['graph']['sha256'] and len(text)==certificate['graph']['canonicalBytes'])
        check(tag+'all-13-closed-source-calls',certificate['graph']['producerCallCount']==13==len(p['callGraph']['calls']))
        for key in ['scalarProgram','callGraph','sourceDemand','derivativeDemand','degreeProgram','affineProgram',
                    'commonYMetadata','inputRows','initialGr','initialPressure','initialResidualRows','temporalProducts',
                    'freshProducts','postPressure','fiveProducts','updatedVelocityRows','fullUpdatedMean','remainder','updatedPressure','rows']:
            check(tag+'full-audited-norm-composition-'+key,p[key]==raw[key])
        check(tag+'same-actual-source-for-entire-composition',p['savedSourceBinding']['source']==source['source'] and p['savedSourceBinding']['actualRoots']==source['actualRoots'])
        for r in p['savedSourceBinding']['leafBindings']:
            check(tag+'source-result-'+str(r['node']),p['scalarProgram']['nodes'][r['node']]=={'op':'source_norm_result','args':[r['call'],r['path']]} and r['producer']==p['callGraph']['calls'][r['call']]['producer'])
        for key in ['actualSourceIdentityAuthenticated','originalAllFiniteSourceRecipeAuthenticated',
                    'actualSavedSourceScalarNormCompositionExecuted','sameMathematicalSourceForEveryDeferredNorm']:
            check(tag+'positive-'+key,p['scope'][key] is True)
        for key in ['originalLiveFamilyRuntimeRecreated','actualHighOrderSourceDerivativeBodiesMaterialized',
                    'actualFinitePrivateNormAttachmentExecuted','actualImprovedTangentialResidualClassCertified','completeN6']:
            check(tag+'separate-'+key,p['scope'][key] is False)
        check(tag+'all-integer-flattening-not-claimed',certificate['allIntegerDerivativeGraphsExecuted'] is False)
    check('higher-order-same-authenticated-source',data['higherOrder']['sourceBinding']==source['source'])
    check('higher-order-continuation-positive',data['higherOrder']['scope']['sameMathematicalSourceForEveryDeferredNorm'] is True)
    for key in ['actualHighOrderSourceLeafMaterializationExecuted','originalPrivateFamilyRuntimeHydrated','wholeInitialTangentialResidualClassCertified','completeN6']:
        check('honest-scope-'+key,data[key] is False)
    return {'schema':'MathScope.N6.SavedInitializedNormFamilyIndependent/1','checks':checks,'checkCount':len(checks),
      'pass':all(r['pass'] for r in checks),'wholeOriginalSourceStreamRechecked':True,
      'originalScalarCompositionIndependentlyReplayed':True,'formalScalarSubstitutionsAreNotSourceNormValues':True}
def main():
    require(len(sys.argv)==2 and re.fullmatch(r'[1-9][0-9]*',sys.argv[1]),'Use a new positive attempt number')
    paths=sources();before=[row(p) for p in paths]
    out=BASE/'evidence/saved-initialized-norm-family-20261012'/('attempt'+sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
    for p in paths:
        dest=out/'sources'/p.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(p.read_bytes())
    write(out/'source-before.json',before)
    command=['node','--max-old-space-size=3072','--test','--test-reporter=tap',str(BASE/'tests/saved-initialized-norm-family.test.mjs')]
    env=dict(os.environ,MATHSCOPE_SAVED_INITIALIZED_NORM_DIRECTORY=str(out));started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();stopped=None
    with (out/'node.log').open('wb') as log:
        try:result=subprocess.run(command,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=180);code=result.returncode
        except subprocess.TimeoutExpired:code=-1;stopped='OBSERVED_TIME_LIMIT'
    log=(out/'node.log').read_text();count=lambda name:int(re.findall(r'^# '+name+r' (\d+)$',log,re.M)[-1]) if re.findall(r'^# '+name+r' (\d+)$',log,re.M) else None
    audit={'pass':False,'checkCount':0};observation=None
    try:
        if (out/'saved-initialized-norm-family.json').is_file():
            data=json.loads((out/'saved-initialized-norm-family.json').read_text());audit=independent(data);observation=data['processObservation']
    except Exception as error:audit={'pass':False,'checkCount':0,'error':str(error)}
    write(out/'independent.json',audit);after=[row(p) for p in paths];write(out/'source-after.json',after)
    success=code==0 and stopped is None and count('pass')==6 and count('fail')==0 and count('skipped')==0 and before==after and audit['pass']
    receipt={'schema':'MathScope.N6.SavedInitializedNormFamilyObservedExecution/1','attempt':int(sys.argv[1]),'startedAt':started,
      'finishedAt':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-tick,'command':command,'timeoutSeconds':180,'v8OldSpaceMiB':3072,
      'exitCode':code,'stoppedReason':stopped,'nodeTests':{'passed':count('pass'),'failed':count('fail'),'skipped':count('skipped'),'required':6},
      'sourceFileCount':len(paths),'sourceFilesUnchanged':before==after,'independentChecks':audit['checkCount'],'independentPass':audit['pass'],
      'processObservation':observation,'actualSavedSourcePositiveNormProgramBindingExecuted':True,
      'wholeHighOrderDerivativeGraphsMaterialized':False,'originalSourceConstructorRerun':False,'originalCoefficientReplayRerun':False,
      'wholeInitialTangentialResidualClassCertified':False,'completeN6':False,'wholeM3Complete':False,
      'artifacts':[row(p) for p in sorted(out.iterdir()) if p.is_file()],'pass':bool(success)}
    write(out/'receipt.json',receipt)
    print(json.dumps({'receipt':row(out/'receipt.json'),'pass':bool(success),'nodeTests':receipt['nodeTests'],
      'independentChecks':audit['checkCount'],'elapsedSeconds':receipt['elapsedSeconds'],'auditError':audit.get('error')},indent=2))
    return 0 if success else 1
if __name__=='__main__':sys.exit(main())
