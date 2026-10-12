#!/usr/bin/env python3
"""Observe source-bound positive IBP norms and audit their exact recipe.

The actual saved node prefix is authenticated independently. The small
positive-IBP fixed operator programs really execute. High finite source
derivative bodies are deferred and are never reported as materialized.
Formal Q(sqrt(2)) substitutions audit the outer arithmetic only; they are
not numerical values or norms of the original physical source.
"""
from datetime import datetime,timezone
from fractions import Fraction as F
from pathlib import Path
import gzip,hashlib,importlib.util,json,os,re,subprocess,sys,time

ROOT=Path(__file__).resolve().parents[4];BASE=ROOT/'research-ide/mathscope-m3/navier'
def digest(raw):return hashlib.sha256(raw).hexdigest()
def row(p):
    raw=p.read_bytes();return {'path':str(p.relative_to(ROOT)),'bytes':len(raw),'sha256':digest(raw)}
def write(p,value):p.write_text(json.dumps(value,indent=2)+'\n')
def require(value,message):
    if not value:raise ValueError(message)
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def sources():
    seen=set()
    def visit(p):
        p=p.resolve();require(p.is_relative_to(ROOT) and p.is_file(),'A complete executed dependency is missing')
        if p in seen:return
        seen.add(p)
        if p.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',p.read_text()):visit(p.parent/ref)
    for p in [BASE/'tests/saved-initialized-cutoff-norms.test.mjs',Path(__file__),BASE/'tests/run-saved-initialized-authority.py']:visit(p)
    return sorted(seen)
def exact(r):return F(int(r['numerator']),int(r['denominator']))
def pick(o,path):
    for k in path:o=o[k]
    return o
def qmul(a,b):return (a[0]*b[0]+2*a[1]*b[1],a[0]*b[1]+a[1]*b[0])
def independent(data):
    checks=[]
    def check(name,value):checks.append({'id':name,'pass':bool(value)})
    audit=module('saved_cutoff_source_byte_oracle',BASE/'tests/run-saved-initialized-authority.py').independent(data)
    checks.extend(audit['checks'])
    source=data['source'];authority=data['authority'];b=authority['bodies'];nodes={r['id']:r['node'] for r in data['selectedNodeBindings']}
    def node(i):return nodes[i]
    def flatten(i,op):
        n=node(i)
        return sum((flatten(j,op) for j in n['args']),[]) if n['op']==op else [i]
    def q(i,n,d=1):return node(i)=={'op':'rational','args':[str(n),str(d)]}
    check('same-actual-source-prefix',authority['source']==source['source'])
    check('same-entire-initialized-root-binding',authority['actualRoots']==source['actualRoots'])
    original=BASE/'evidence/global-forced-current-20261012/attempt382884203291'
    index=json.loads((original/'checkpoint-index.json').read_text());manifest_path=ROOT/index['checkpoints'][0]['path'];manifest=json.loads(manifest_path.read_text())
    with gzip.open(manifest_path.parent/manifest['parts'][0]['path'],'rt') as f:header=json.loads(f.readline())
    definitions=json.loads(header['definitions']['base']['expressionDefinitions'])
    inverse_definitions=json.loads(header['definitions']['base']['inverseDefinitions'])
    for r in authority['originalSourceFiles']:check('unchanged-original-source-producer-'+r['path'],row(ROOT/r['path'])==r)
    t=b['temporal'];g=b['geometry'];psi=t['psiDefinition'];m1=next(i for i in flatten(t['velocity']['v'],'multiply') if q(i,-1))
    check('actual-T1-shared-body-definition',psi['definition']==definitions[-1-psi['system']] and psi['body']==psi['definition']['body'])
    check('actual-inverse-theta-definition',t['thetaDefinition']==inverse_definitions[node(t['thetaRoot'])['args'][0]])
    check('actual-inverse-z-definition',t['zDefinition']==inverse_definitions[node(t['zRoot'])['args'][0]])
    for name in ['theta','z']:
        d=t[name+'Definition'];check(name+'-full-source-inverse-zero-mode',d['zeroMode']=='The exact normalized Haar mean is projected out.' and d['finiteSumDeclaredEqualToLimit'] is False)
    check('actual-temporal-v-complete-source-product',sorted(flatten(t['velocity']['v'],'multiply'))==sorted([m1,t['thetaRoot'],g['ciInverse']]))
    check('actual-temporal-beta-full-potential-derivative',sorted(flatten(t['velocity']['beta'],'multiply'))==sorted([m1,g['epsilon'],t['psiZ']]))
    check('actual-T1-input-gamma-desired',sorted(flatten(t['gammaDesired'],'multiply'))==sorted([m1,t['zRoot'],g['ciInverse']]))
    check('actual-T1-whole-integral-complete-envelope',node(t['whole'])['args']==[t['integrand'],t['radialVariable'],g['innerRadius'],g['outerRadius']])
    check('actual-T1-left-integral-complete-envelope',node(t['left'])['args']==[t['integrand'],t['radialVariable'],g['innerRadius'],g['R']])
    inverse_r=next(i for i in flatten(t['A1'],'multiply') if node(i)=={'op':'inverse','args':[g['R']]})
    check('actual-retained-A1-product',sorted(flatten(t['A1'],'multiply'))==sorted(flatten(g['chiR'],'multiply')+[t['whole'],inverse_r]))
    for j,r in enumerate(b['pressureRows']):
        tag='pressure-stage-'+str(j)+'-';stage=['temporal','initialized'][j]
        check(tag+'same-actual-A0',r['A0']==source['actualRoots'][stage+'Pressure']['cutoffRemainder'])
        check(tag+'complete-A0-product',sorted(flatten(r['A0'],'multiply'))==sorted(flatten(g['chiR'],'multiply')+[r['whole']]))
        terms=flatten(r['centeredSource'],'add');negative=next(x for x in terms if x!=r['gr'])
        check(tag+'complete-centered-source',len(terms)==2 and r['gr'] in terms and
              sorted(flatten(negative,'multiply'))==sorted([m1,r['P']]+flatten(r['rho'],'multiply')))
        for name in ['Pdefinition','haarDefinition']:
            d=r[name];check(tag+'actual-'+name,d['definition']==definitions[-1-d['system']])
        haar_outer=node(r['haarDefinition']['body']);haar_inner=node(haar_outer['args'][0])
        check(tag+'full-unit-mass-Haar',haar_outer['op']=='definite_integral' and haar_inner['op']=='definite_integral' and
              haar_outer['args'][1]==g['Y'][1] and haar_inner['args'][1]==g['Y'][0] and haar_inner['args'][0]==r['gr'] and
              all(q(n,v) for n,v in zip(haar_outer['args'][2:]+haar_inner['args'][2:],[0,1,0,1])))
        pnode=node(r['Pdefinition']['body'])
        check(tag+'full-whole-pressure-moment',pnode['op']=='definite_integral' and pnode['args'][2:]==[g['innerRadius'],g['outerRadius']])
    norm=b['normalization'];rho_node=node(norm['rho']);mass_node=node(norm['mass'])
    check('actual-rho-exact-positive-seed-normalization',rho_node['op']=='multiply' and sorted(rho_node['args'])==sorted([norm['unnormalized'],norm['massInverse']]) and
          node(norm['massInverse'])=={'op':'inverse','args':[norm['mass']]} and mass_node['op']=='definite_integral' and mass_node['args'][2:]==[g['innerRadius'],g['outerRadius']])
    check('actual-post-temporal-and-after-five-pressure-are-distinct',b['pressureRows'][0]['gr']!=b['pressureRows'][1]['gr'] and b['pressureRows'][0]['whole']!=b['pressureRows'][1]['whole'])
    alpha=F(99999,100000);kappa=F(1,100000)
    for j,r in enumerate(data['minimumRows']):
        target=exact(r['target']);p=r['ibpOrder'];result=alpha+p*kappa
        check('minimum-positive-IBP-'+str(j),p>=1 and result>=target and (p==1 or alpha+(p-1)*kappa<target) and exact(r['resultExponent'])==result)
    for j,d in enumerate(data['demandRows']):
        m=d['order'];p=d['ibpOrder'];u=m+2*p+3;tag='demand-'+str(j)+'-'
        expected={'A1DesiredVelocityOrder':u,'fastA1DesiredVelocityOrder':u+1,'A0FullRadialSourceOrder':u,
                  'fastA1InitialResidualOrder':m+2*p+8,'upstreamInitializedProgramOrder':u,
                  'upstreamTargetWeightedOrder':u+13,'upstreamBackgroundSlowOrder':u+15,
                  'fixedTemporalRadialOutputOrder':m+1,'fixedPressureRadialOutputOrder':m,'conservativeIntegerSPowerGain':p}
        for k,v in expected.items():check(tag+k,d[k]==v)
        check(tag+'exact-epsilon-gain',exact(d['resultExponent'])==alpha+p*kappa)
    substitutions=[]
    for j,c in enumerate(data['certificates']):
        p=c['program'];m=p['request']['order'];ibp=p['request']['ibpOrder'];u=m+2*ibp+3;ns=p['scalarProgram']['nodes'];calls=p['callGraph']['calls'];tag='program-'+str(j)+'-'
        encoded=canonical(p).encode();check(tag+'lossless-certificate',digest(encoded)==c['graph']['sha256'] and len(encoded)==c['graph']['canonicalBytes'])
        check(tag+'complete-three-source-calls',len(calls)==3 and [x['producer'] for x in calls]==['initialized','radial','radial'] and [x['dependencies'] for x in calls]==[[],[0],[0]])
        check(tag+'correct-upstream-finite-order',calls[0]['request']=={'order':u})
        check(tag+'correct-two-fixed-IBP-orders',calls[1]['request']['order']==m+1 and calls[2]['request']['order']==m and all(x['request']['ibpOrder']==ibp for x in calls[1:]))
        for i,n in enumerate(ns):
            check(tag+'typed-node-'+str(i),n['type'] in ['natural','scalar'] and n['op'] in ['rational','natural','source_result','multiply','sqrt_positive','add','maximum'])
            if n['op']=='source_result':
                call,path=n['args'];check(tag+'valid-result-selector-'+str(i),call in [0,1,2] and all(isinstance(k,(int,str)) for k in path) and
                    ((call==0 and path[0] in ['temporalProducts','freshProducts','fullUpdatedMean'] and path[2] in [u,u+1] and path[-1] in ['constant','power','pole']) or (call in [1,2] and n['type']=='scalar' and path[-1]=='constant')))
        for case in range(2):
            offsets=[0,3][case];input_values=[F(101+offsets,7),F(103+offsets,11),F(107+offsets,13),F(109+offsets,17)];fixed_values=[F(211+offsets,19),F(223+offsets,23),F(227+offsets,29)]
            input_power=[3+offsets,5+offsets,7+offsets,11+offsets];input_pole=[11+offsets,13+offsets,17+offsets,19+offsets];values=[]
            for n in ns:
                op=n['op'];a=n['args']
                if op=='source_result':
                    call,path=a
                    if call==0:
                        k=(0 if path[2]==u else 1) if path[0]=='temporalProducts' else (2 if path[0]=='freshProducts' else 3)
                        value=(input_values[k],F(0)) if n['type']=='scalar' else (input_power[k] if path[-1]=='power' else input_pole[k])
                    else:
                        k=(0 if path[3]==m else 1) if call==1 else 2;value=(fixed_values[k],F(0))
                elif op=='rational':value=(F(int(a[0]),int(a[1])),F(0))
                elif op=='natural':value=int(a[0])
                elif op=='multiply':
                    value=(F(1),F(0))
                    for i in a:value=qmul(value,values[i])
                elif op=='sqrt_positive':require(values[a[0]]==(F(2),F(0)),'The only extra root is the original sqrt(2) direction norm');value=(F(0),F(1))
                elif op=='add':value=sum(values[i] for i in a)
                elif op=='maximum':value=max(values[i] for i in a)
                values.append(value)
            expected=[(fixed_values[0]*input_values[0],F(0)),(F(0),fixed_values[1]*input_values[1]),
                      (fixed_values[2]*input_values[2],F(0)),(fixed_values[2]*input_values[3],F(0))]
            for k,(name,o) in enumerate(p['outputs'].items()):
                check(tag+'formal-exact-product-'+str(case)+'-'+name,values[o['constant']]==expected[k])
                check(tag+'formal-full-S-power-'+str(case)+'-'+name,values[o['power']]==input_power[k]+ibp)
                check(tag+'formal-complete-input-pole-'+str(case)+'-'+name,values[o['pole']]==max(input_pole[:2] if k<2 else input_pole[2:]))
                check(tag+'actual-exponent-'+str(case)+'-'+name,exact(o['epsilonExponent'])==alpha+ibp*kappa)
            substitutions.append({'program':j,'case':case,'outputValues':{name:[str(x) for x in values[o['constant']]] for name,o in p['outputs'].items()},'formalValuesAreNotOriginalSourceNorms':True})
        for k in ['actualSavedCutoffBodiesAuthenticated','actualWholeWeightedZeroMomentsAuthenticated','sameSourceAllFiniteNormRecipeBound',
                  'actualFiniteTypedCutoffCompositionExecuted','allFiniteCutoffFlatnessByOriginalPositiveIBP']:check(tag+'positive-'+k,p['scope'][k] is True)
        for k in ['originalLiveFamilyRuntimeRecreated','actualHighOrderSourceDerivativeBodiesMaterialized','selectedInputNormProgramExecuted',
                  'selectedFixedRadialOperatorNormsExecuted','wholeInitialTangentialResidualClassCertified','completeN6']:check(tag+'separate-'+k,p['scope'][k] is False)
    finite=data['finite'];p=data['certificates'][0]['program'];up=finite['upstreamProgram'];fixed=finite['fixedRadialPrograms'];nat={r['node']:int(r['value']) for r in finite['naturalResults']}
    check('selected-small-IBP-actual-input-AST',up['request']['order']==5 and len(up['callGraph']['calls'])==13 and up['scope']['actualSourceIdentityAuthenticated'] is True and up['scope']['actualSavedSourceScalarNormCompositionExecuted'] is True)
    for r in finite['sourceResults']:
        call=r['call'];path=r['path'];selected=pick([up,*fixed][call],path);tag='finite-result-'+str(r['node'])+'-'
        check(tag+'exact-producer-selection',selected==(int(r['value']) if r['type']=='natural' else r['expressionRoot']))
        check(tag+'typed-outer-leaf',p['scalarProgram']['nodes'][r['node']]=={'type':r['type'],'op':'source_result','args':[call,path]})
    for j,r in enumerate(fixed):
        check('actual-fixed-radial-'+str(j)+'-same-source',r['source']['paperSHA256']==source['source']['paperSHA256'] and r['source']['parameterExpressionSHA256']==source['source']['parameterExpressionSHA256'])
        check('actual-fixed-radial-'+str(j)+'-complete-pass',all(c['pass'] for c in r['checks']) and r['request']['ibpOrder']==1 and r['request']['order']==1-j)
        pole_node=p['callGraph']['calls'][j+1]['request']['pole']['naturalNode'];check('actual-fixed-radial-'+str(j)+'-full-input-pole',r['request']['pole']==nat[pole_node])
    for name,o in p['outputs'].items():
        path=next(r['path'][:-1] for r in finite['sourceResults'] if r['node']==o['inputNorm']['constant']);f=pick(up,path)
        check('actual-input-'+name+'-original-initial-class',f['epsilonExponent']=='1-kappa_s' and f['weight']=='zeta' and f['gaussian']=='1')
        check('actual-output-'+name+'-power',nat[o['power']]==f['power']+1)
        check('actual-output-'+name+'-pole-covers-input',nat[o['pole']]>=f['pole'])
    for key in ['actualSourceInputScalarProgramExecuted','actualFixedRadialOperatorProgramsExecuted','allTypedInputConstantsPowersAndPolesResolved']:
        check('selected-finite-positive-'+key,finite['scope'][key] is True)
    check('selected-finite-never-invents-norm-numbers',finite['sourceNormNumbersInvented'] is False)
    check('whole-original-domain-and-positive-h-retained',authority['phase']['positiveOriginalHRetained'] is True and authority['phase']['newCommonQThresholdIntroduced'] is False)
    for key in ['actualHighOrderSourceDerivativeBodiesMaterialized','originalPrivateFamilyRuntimeHydrated','wholeInitialTangentialResidualClassCertified','completeN6']:
        check('honest-final-scope-'+key,data[key] is False)
    return {'schema':'MathScope.N6.SavedInitializedCutoffIndependent/1','checks':checks,'checkCount':len(checks),'pass':all(c['pass'] for c in checks),
      'wholeOriginalSourceStreamIndependentlyAuthenticated':True,'exactExponentArithmetic':'fractions.Fraction',
      'outerNormArithmetic':'Exact Q(sqrt(2)) with typed source-result substitutions','formalSubstitutions':substitutions,
      'formalSubstitutionsAreNotPhysicalNormValues':True,'actualHighOrderSourceDerivativeBodiesMaterialized':False}

def main():
    require(len(sys.argv)==2 and re.fullmatch(r'[1-9][0-9]*',sys.argv[1]),'Use a new positive attempt number')
    paths=sources();before=[row(p) for p in paths];out=BASE/'evidence/saved-initialized-cutoff-norms-20261012'/('attempt'+sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
    for p in paths:
        dest=out/'sources'/p.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(p.read_bytes())
    write(out/'source-before.json',before)
    command=['node','--max-old-space-size=3072','--test','--test-reporter=tap',str(BASE/'tests/saved-initialized-cutoff-norms.test.mjs')]
    env=dict(os.environ,MATHSCOPE_SAVED_CUTOFF_DIRECTORY=str(out));started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();stopped=None
    with (out/'node.log').open('wb') as log:
        try:r=subprocess.run(command,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=180);code=r.returncode
        except subprocess.TimeoutExpired:code=-1;stopped='OBSERVED_TIME_LIMIT'
    log=(out/'node.log').read_text();count=lambda name:int(re.findall(r'^# '+name+r' (\d+)$',log,re.M)[-1]) if re.findall(r'^# '+name+r' (\d+)$',log,re.M) else None
    audit={'pass':False,'checkCount':0};observation=None
    try:
        path=out/'saved-initialized-cutoff-norms.json'
        if path.is_file():
            data=json.loads(path.read_text());audit=independent(data);observation=data['processObservation']
    except Exception as error:audit={'pass':False,'checkCount':0,'error':str(error)}
    write(out/'independent.json',audit);after=[row(p) for p in paths];write(out/'source-after.json',after)
    success=code==0 and stopped is None and count('pass')==9 and count('fail')==0 and count('skipped')==0 and before==after and audit['pass']
    receipt={'schema':'MathScope.N6.SavedInitializedCutoffObservedExecution/1','attempt':int(sys.argv[1]),'startedAt':started,'finishedAt':datetime.now(timezone.utc).isoformat(),
      'elapsedSeconds':time.monotonic()-tick,'command':command,'timeoutSeconds':180,'v8OldSpaceMiB':3072,'exitCode':code,'stoppedReason':stopped,
      'nodeTests':{'passed':count('pass'),'failed':count('fail'),'skipped':count('skipped'),'required':9},'sourceFileCount':len(paths),'sourceFilesUnchanged':before==after,
      'independentChecks':audit['checkCount'],'independentPass':audit['pass'],'processObservation':observation,
      'actualSavedSourcePositiveCutoffBindingExecuted':observation is not None,'actualSelectedFixedRadialNormProducersExecuted':observation is not None,
      'originalSourceConstructorRerun':False,'originalCoefficientReplayRerun':False,'allHighOrderDerivativeGraphsMaterialized':False,
      'wholeInitialTangentialResidualClassCertified':False,'completeN6':False,'wholeM3Complete':False,
      'artifacts':[row(p) for p in sorted(out.iterdir()) if p.is_file()],'pass':bool(success)}
    write(out/'receipt.json',receipt);print(json.dumps({'receipt':row(out/'receipt.json'),'pass':bool(success),'nodeTests':receipt['nodeTests'],
      'independentChecks':audit['checkCount'],'elapsedSeconds':receipt['elapsedSeconds'],'auditError':audit.get('error')},indent=2));return 0 if success else 1
if __name__=='__main__':sys.exit(main())
