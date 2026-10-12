#!/usr/bin/env python3
"""Independent exact (9.11), norm convolution and complete saved-body gate."""
from datetime import datetime,timezone
from fractions import Fraction as Q
from math import comb,factorial,isqrt
from pathlib import Path
import gzip,hashlib,importlib.util,io,json,os,re,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[4];BASE=ROOT/'research-ide/mathscope-m3/navier'
def digest(raw):return hashlib.sha256(raw).hexdigest()
def row(p):
    raw=p.read_bytes();return {'path':str(p.relative_to(ROOT)),'bytes':len(raw),'sha256':digest(raw)}
def write(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def require(x,m):
    if not x:raise ValueError(m)
def module(name,path):
    s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def paths():
    seen=set()
    def visit(p):
        p=p.resolve();require(p.is_relative_to(ROOT) and p.is_file(),'Complete source bytes are required')
        if p in seen:return
        seen.add(p)
        if p.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',p.read_text()):visit(p.parent/ref)
    for p in [BASE/'tests/initial-haar-class.test.mjs',Path(__file__),BASE/'tests/run-pressure-class-kernel.py',
              BASE/'tests/run-saved-initialized-authority.py',BASE/'tests/run-initialized-lazy-norm-program.py']:visit(p)
    return sorted(seen)
def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def independent(data):
    checks=[]
    def check(name,x):checks.append({'id':name,'pass':bool(x)})
    f=data['fixture'];split=f['split'];inp=split['input'];nodes=data['graph']['nodes'];directions=[inp[k] for k in ['R','Z','T']]
    oracle=module('haar_laurent_oracle',BASE/'tests/run-pressure-class-kernel.py');P=oracle.Laurent(nodes,directions)
    W={k:P.read(v) for k,v in inp['haarCovariance'].items()};S0=[P.read(x) for x in inp['leadingStress']];SH=[P.read(x) for x in inp['higherStress']]
    invR=P.power(P.read(inp['R']),-1);eps=P.read(inp['epsilon']);pressure=P.read(inp['haarPressure'])
    def De(poly,c):return P.add(P.derivative(poly,0),P.scale(P.multiply(invR,poly),c))
    refs={}
    for name,rad,ax,c,j in [('Etheta','rtheta','thetaz',2,0),('Ez','rz','zz',1,1)]:
        stress=P.add(S0[j],SH[j]);radial=De(P.add(W[rad],P.scale(stress,-1)),c)
        axial=P.multiply(eps,P.derivative(P.add(W[ax],pressure if name=='Ez' else {}),1));refs[name]=P.add(radial,axial)
    for r in split['rows']:
        check('whole-Haar-direct-'+r['name'],P.read(r['direct'])==refs[r['name']])
        check('whole-Haar-split-'+r['name'],P.read(r['decomposed'])==refs[r['name']])
        check('nonzero-curl-remainder-retained-'+r['name'],P.read(r['covarianceRemainder'])!={})
    for j in f['jets']:
        for r in j['rows']:
            expected=P.jet(refs[r['name']],j['orders']);tag=r['name']+'-'+','.join(map(str,j['orders']))
            check('complete-direct-jet-'+tag,P.read(r['left'])==expected)
            check('complete-split-jet-'+tag,P.read(r['right'])==expected)
    for r in f['omissions']:check('reject-omitted-'+r['name']+'-'+r['key'],P.read(r['difference'])!={})
    for d in f['demands']:
        m=d['order'];check('finite-source-demand-'+str(m),d['requiredPrimaryHaarOrder']==m+1 and d['requiredHigherStressOrder']==m+1 and
          d['requiredFullPressureOrder']==m+1 and d['requiredCommonYOrder']==m+2 and d['requiredTargetWeightedOrder']==m+3 and d['requiredBackgroundSlowOrder']==m+5)
    km=module('haar_scalar_field_oracle',BASE/'tests/run-initialized-lazy-norm-program.py');K=km.K
    def scalar_values(nodes,trial):
        values=[]
        for i,n in enumerate(nodes):
            op,a=n['op'],n['args']
            if op=='rational':value=K(Q(*map(int,a)))
            elif op=='source_norm_result':
                code=sum((j+1)*sum(map(ord,str(x))) for j,x in enumerate(a[1]));value=K(1 if not trial else Q(3+(code+a[0])%11,3))
            elif op=='add':value=sum(values[x] for x in a)
            elif op=='multiply':
                value=K(1)
                for x in a:value=value*values[x]
            elif op=='integer_power':value=values[a[0]]**a[1]
            elif op=='maximum':value=max(values[x] for x in a)
            elif op=='sqrt_positive':
                x=values[a[0]]
                if x==K(2):value=K(0,1)
                else:
                    require(x.b==0,'An unexpected irrational root appeared');an,bn=isqrt(x.a.numerator),isqrt(x.a.denominator)
                    require(an*an==x.a.numerator and bn*bn==x.a.denominator,'Square root must be exact');value=K(Q(an,bn))
            else:raise ValueError('Unknown complete scalar operator '+op)
            values.append(value)
        return values
    def norm_audit(tag,nodes,products,Broot):
        for trial in [0,1]:
            values=scalar_values(nodes,trial);at=lambda f:values[f['constant']];B=values[Broot]
            rs,cs,hs,ps=[products['inputs'][key] for key in ['remainder','covariance','higher','pressure']]
            for row_ in products['rows']:
                j=row_['order']
                for name,c in [('Etheta',2),('Ez',1)]:
                    con=lambda xs:c*sum(comb(j,k)*factorial(k)*B**(k+1)*at(xs[j-k]) for k in range(j+1))
                    terms={'curlSlowRadial':at(rs[j+1]),'curlConnection':con(rs),'higherStressSlowRadial':at(hs[j+1]),
                      'higherStressConnection':con(hs),'fullAxialCovariance':at(cs[j+1]),'fullAxialPressure':at(ps[j+1]) if name=='Ez' else K(0)}
                    out=row_['fields'][name]
                    for key,v in terms.items():check(tag+'-'+str(trial)+'-'+name+'-'+str(j)+'-'+key,v==values[out['terms'][key]])
                    check(tag+'-'+str(trial)+'-'+name+'-'+str(j)+'-complete-sum',sum(terms.values())==at(out))
                    check(tag+'-'+str(trial)+'-'+name+'-'+str(j)+'-original-margin',Q(out['conservativePaperExponentExact'])-Q(149,100)==Q(out['positiveMarginOverOriginalRequirement'])==Q(499,50000)>0)
    nf=f['normFixture'];norm_audit('fixture',nf['nodes'],nf['products'],nf['input']['radiusBase'])
    a=f['actual'];source_audit=module('haar_saved_byte_oracle',BASE/'tests/run-saved-initialized-authority.py').independent(a);checks.extend(source_audit['checks'])
    cert=a['certificate'];bound=cert['program'];parent=a['parent'];encoded=canonical(bound).encode()
    check('complete-saved-program-hash',digest(encoded)==cert['graph']['sha256'] and len(encoded)==cert['graph']['canonicalBytes'])
    check('identical-authenticated-parent-scalar-prefix',bound['scalarProgram']['nodes'][:len(parent['scalarProgram']['nodes'])]==parent['scalarProgram']['nodes'])
    check('same-actual-source-body-and-parent',bound['source']==a['source']['source']==parent['savedSourceBinding']['source'])
    # Compare all actual field definitions to the full authenticated source
    # header; labels, guards, complete local bodies and both signs survive.
    original=BASE/'evidence/global-forced-current-20261012/attempt382884203291';index=json.loads((original/'checkpoint-index.json').read_text())
    mp=ROOT/index['checkpoints'][0]['path'];manifest=json.loads(mp.read_text());compressed=b''.join((mp.parent/r['path']).read_bytes() for r in manifest['parts'])
    with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:header=json.loads(stream.readline())
    aux=json.loads(header['definitions']['base']['fieldDefinitions']);glob=json.loads(header['definitions']['base']['base']['m3GlobalFields']);expr=json.loads(header['definitions']['base']['base']['expression'])
    for field in bound['sourceBinding']['fields']:
        name=field['name'];ad=field['completeCommonYDefinition'];gd=field['completeHaarDefinition'];node=field['actualCommonYNode'];hn=field['actualHaarNode']
        check('complete-source-aux-definition-'+name,ad==aux[node['args'][0]])
        check('complete-source-Haar-definition-'+name,gd==glob[hn['args'][0]])
        check('same-original-Haar-root-'+name,ad['sourceRecipe']['originalCurrentCovariance']==field['actualHaarRoot'])
        for d in [field['completeBothSignLocalDefinition'],*field['actualSignLocalDefinitions']]:
            check('complete-source-local-body-'+d['name'],{k:v for k,v in d.items() if k!='id'}==expr[d['id']])
        bykey={r['label']['key']:r for r in gd['rows']}
        for r in ad['rows']:
            g=bykey[r['label']['key']]
            check('every-original-label-sign-'+name+'-'+r['label']['key']+'-'+str(r['label']['sign']),
              r['label']['sign'] in [-1,1] and r['guards']==g['guards'] and r['coefficient']==g['coefficient'])
    scalar=bound['scalarProgram']['nodes'];calls=bound['callGraph']['calls'];Broot=next(i for i,n in enumerate(scalar) if n=={'op':'source_norm_result','args':[4,['geometry','B']]})
    norm_audit('actual-source-program-formal-scalar',scalar,bound['products'],Broot)
    for j,n in enumerate(scalar[len(parent['scalarProgram']['nodes']):],start=len(parent['scalarProgram']['nodes'])):
        op,args=n['op'],n['args'];valid=op in ['rational','source_norm_result','add','multiply','integer_power','sqrt_positive','maximum']
        if op=='source_norm_result':
            c,path=args;valid=valid and (c==1 and path[:2]==['bounds','haarRows'] and path[3]=='fields' and path[4] in ['fullCovariance','covarianceRemainder'] and path[5]=='constant' or
              c==3 and path[0]=='rows' and path[2:]==['higherStress','constant'])
        elif op not in ['rational']:valid=valid and all(isinstance(x,int) and 0<=x<j for x in (args[:1] if op=='integer_power' else args))
        check('typed-closed-Haar-scalar-'+str(j),valid)
    check('same-source-positive-Haar-norm',bound['scope']['actualSavedSourceIdentityAuthenticated'] and bound['scope']['actualFiniteHaarNormCompositionExecuted'])
    check('no-full-covariance-zero-claim',not bound['sourceBinding']['leadingIdentity']['wholeCovarianceDeclaredEqualToLeadingTarget'])
    check('no-hydrated-live-function-claim',not bound['sourceBinding']['leadingIdentity']['literalOriginalIdentityFunctionReexecutedOnHydratedLiveCurrent'])
    check('remaining-temporal-A1-stage-separate',not bound['scope']['initializedTangentialResidualClassComplete'] and not bound['scope']['allOrdersCutoffFlatnessApplied'])
    check('whole-N6-not-promoted',not bound['scope']['completeN6'] and not data['completeN6'])
    return {'schema':'MathScope.N6.InitialHaarClassIndependent/1','checks':checks,'checkCount':len(checks),'pass':all(r['pass'] for r in checks),
      'exactEquationArithmetic':'Complete Q(sqrt(2)) Laurent maps and mixed derivative identities.',
      'normArithmetic':'Exact finite connection convolutions under two formal positive scalar inputs; these are not invented actual norms.',
      'completeSavedSourceDefinitionsCompared':True,'initialWholeTangentialResidualStillSeparate':True}
def main():
    require(len(sys.argv)==2 and re.fullmatch(r'[1-9][0-9]*',sys.argv[1]),'Choose a new positive attempt')
    ps=paths();before=[row(p) for p in ps];out=BASE/'evidence/source-initial-haar-class-20261012'/('attempt'+sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
    for p in ps:
        d=out/'sources'/p.relative_to(ROOT);d.parent.mkdir(parents=True,exist_ok=True);d.write_bytes(p.read_bytes())
    write(out/'source-before.json',before);env=dict(os.environ,MATHSCOPE_INITIAL_HAAR_DIRECTORY=str(out))
    cmd=['node','--max-old-space-size=3072','--test','--test-reporter=tap',str(BASE/'tests/initial-haar-class.test.mjs')]
    start=datetime.now(timezone.utc).isoformat();tick=time.monotonic();stop=None
    with (out/'node.log').open('wb') as log:
        try:r=subprocess.run(cmd,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=180);code=r.returncode
        except subprocess.TimeoutExpired:code=-1;stop='OBSERVED_TIME_LIMIT'
    log=(out/'node.log').read_text();count=lambda n:int(re.findall(r'^# '+n+r' (\d+)$',log,re.M)[-1]) if re.findall(r'^# '+n+r' (\d+)$',log,re.M) else None
    audit={'pass':False,'checkCount':0};observation=None
    try:
        if (out/'initial-haar-class.json').is_file():
            data=json.loads((out/'initial-haar-class.json').read_text());audit=independent(data);observation=data['processObservation']
    except Exception as error:audit={'pass':False,'checkCount':0,'error':str(error)}
    write(out/'independent.json',audit);after=[row(p) for p in ps];write(out/'source-after.json',after)
    success=code==0 and stop is None and count('pass')==7 and count('fail')==0 and count('skipped')==0 and before==after and audit['pass']
    receipt={'schema':'MathScope.N6.InitialHaarClassObservedExecution/1','startedAt':start,'finishedAt':datetime.now(timezone.utc).isoformat(),
      'elapsedSeconds':time.monotonic()-tick,'command':cmd,'timeoutSeconds':180,'v8OldSpaceMiB':3072,'exitCode':code,'stoppedReason':stop,
      'nodeTests':{'passed':count('pass'),'failed':count('fail'),'skipped':count('skipped'),'required':7},
      'sourceFileCount':len(ps),'sourceFilesUnchanged':before==after,'independentChecks':audit['checkCount'],'independentPass':audit['pass'],
      'processObservation':observation,'actualSavedHaarNormProgramExecuted':bool(data['actualSavedHaarNormProgramExecuted']) if observation else False,
      'originalSourceConstructorRerun':False,'allHighOrderSourceBodiesMaterialized':False,
      'wholeInitializedTangentialResidualClassCertified':False,'completeN6':False,
      'artifacts':[row(p) for p in sorted(out.iterdir()) if p.is_file()],'pass':bool(success)}
    write(out/'receipt.json',receipt);print(json.dumps({'receipt':row(out/'receipt.json'),'pass':bool(success),
      'nodeTests':receipt['nodeTests'],'independentChecks':audit['checkCount'],'elapsedSeconds':receipt['elapsedSeconds'],'auditError':audit.get('error')},indent=2))
    return 0 if success else 1
if __name__=='__main__':sys.exit(main())
