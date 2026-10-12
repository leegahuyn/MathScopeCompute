#!/usr/bin/env python3
"""Observe the complete generic primary remainder algebra and exact controls.

The Node check proves the full symbolic coefficient identities. Python's
separate Fraction interpreter checks12explicit nondegenerate rational
points and omission controls. Those finite controls are not a uniform
original-source class proof or an actual source-current attachment.
"""
from datetime import datetime,timezone
from fractions import Fraction as F
from pathlib import Path
import hashlib,json,os,re,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
def row(p):
    raw=p.read_bytes();return {'path':str(p.relative_to(ROOT)),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
def write(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def require(x,m):
    if not x:raise ValueError(m)
def paths():
    seen=set()
    def visit(p):
        p=p.resolve()
        require(p.is_relative_to(ROOT) and p.is_file(),'A primary source dependency is missing')
        if p in seen:return
        seen.add(p)
        if p.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',p.read_text()):visit(p.parent/ref)
    visit(BASE/'tests/primary-residual-terms.test.mjs');seen.add(Path(__file__).resolve());return sorted(seen)
def independent(program):
    nodes=program['nodes'];s=program['result'];geometry=program['input']['geometry'];checks=[];points=[]
    def check(name,value):checks.append({'id':name,'pass':bool(value)})
    check('whole-symbolic-node-proof-recorded',program['proof']['pass'] and len(program['proof']['checks'])==30)
    check('every20remainderterm-retained',len(s['terms'])==20 and len({t['id'] for t in s['terms']})==20)
    check('source-current-and-uniform-class-not-claimed',program['genericControlOnly'] and not program['actualOriginalCurrentAttached'] and
          not s['scope']['sourceAuthenticated'] and not s['scope']['allOrderSourceClassCertified'])
    for point in range(12):
        values={'R':F(2)+F(point,7),'Z':F((-1)**point*(point+1),5),'T':F(point+2,11),
                'theta':F(0),'xi':F(point+1,13),'v':F(point+2,17)}
        variables={geometry[k]:v for k,v in values.items()};cache={}
        def evaluate(index):
            if index in cache:return cache[index]
            node=nodes[index];op,args=node['op'],node['args']
            if op=='rational':value=F(int(args[0]),int(args[1]))
            elif op=='coordinate':value=variables[index]
            elif op=='add':value=sum((evaluate(i) for i in args),F(0))
            elif op=='multiply':
                value=F(1)
                for i in args:value*=evaluate(i)
            elif op=='inverse':value=1/evaluate(args[0])
            elif op=='integer_power':value=evaluate(args[0])**args[1]
            else:raise ValueError('Unexpected analytic operation in the rational control: '+op)
            cache[index]=value;return value
        def at(rows,m,j,part):
            return sum((evaluate(r['value'][j][part]) for r in rows if r['m']==m),F(0))
        flat=[r for t in s['terms'] for r in t['rows']]
        for m in [-2,-1,0,1,2]:
            for j in range(3):
                for part in ['real','imaginary']:
                    left=at(s['update']['direct'],m,j,part)-at(s['update']['oldResidual'],m,j,part)
                    right=at(flat,m,j,part)
                    check(f'exact-rational-point-{point}-{m}-{j}-{part}',left==right)
        points.append({k:str(v) for k,v in values.items()})
        if point==0:
            for name in ['complete-primary-pressure-coefficient-gradient','quadratic-leading-phase-tangency',
                         'full-curl-remainder-linear-background','complete-conservative-divergence-correction']:
                terms=next(t for t in s['terms'] if t['id']==name)
                check('omitted-nonzero-term-negative-'+name,any(at(terms['rows'],m,j,part)!=0
                      for m in [-2,-1,0,1,2] for j in range(3) for part in ['real','imaginary']))
    return {'schema':'MathScope.N6.IndependentPrimaryRemainderRationalControls/1','checks':checks,'checkCount':len(checks),
            'points':points,'arithmetic':'Python Fraction only; complete saved coefficient expression DAG evaluated independently.',
            'floatingPointUsed':False,'finitePointChecksAreUniformTheorem':False,'nodeWholePolynomialIdentityCheckedSeparately':True,
            'actualOriginalCurrentAttached':False,'originalN602Complete':False,'allOrderSourceClassCertified':False,
            'pass':all(c['pass'] for c in checks)}
def main():
    require(len(sys.argv)==2 and re.fullmatch(r'[1-9][0-9]*',sys.argv[1]),'Usage: run-primary-residual-terms.py NEW_ATTEMPT')
    source=paths();before=[row(p) for p in source];out=BASE/'evidence/primary-residual-terms-20261012'/('attempt'+sys.argv[1])
    out.mkdir(parents=True,exist_ok=False)
    for p in source:
        d=out/'sources'/p.relative_to(ROOT);d.parent.mkdir(parents=True,exist_ok=True);d.write_bytes(p.read_bytes())
    write(out/'source-before.json',before)
    command=['node','--max-old-space-size=768','--test','--test-reporter=tap',str(BASE/'tests/primary-residual-terms.test.mjs')]
    env=dict(os.environ,M3_PRIMARY_REMAINDER_EVIDENCE=str(out/'program.json'))
    started=datetime.now(timezone.utc).isoformat();tick=time.monotonic();stopped=None
    with (out/'node.log').open('wb') as log:
        try:r=subprocess.run(command,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=120);code=r.returncode
        except subprocess.TimeoutExpired:code=-1;stopped='OBSERVED_TIME_LIMIT'
    elapsed=time.monotonic()-tick;after=[row(p) for p in source];write(out/'source-after.json',after)
    log=(out/'node.log').read_text();count=lambda name:int(re.findall(r'^# '+name+r' (\d+)$',log,re.M)[-1]) if re.findall(r'^# '+name+r' (\d+)$',log,re.M) else None
    results={'pass':False,'checkCount':0}
    try:
        if (out/'program.json').is_file():results=independent(json.loads((out/'program.json').read_text()))
    except Exception as e:results={'pass':False,'checkCount':0,'error':str(e)}
    write(out/'independent.json',results)
    success=code==0 and stopped is None and count('pass')==6 and count('fail')==0 and count('skipped')==0 and before==after and results['pass']
    receipt={'schema':'MathScope.N6.PrimaryRemainderTermsObservedExecution/1','attempt':int(sys.argv[1]),'startedAt':started,
             'finishedAt':datetime.now(timezone.utc).isoformat(),'command':command,'elapsedSeconds':elapsed,'timeoutSeconds':120,
             'v8OldSpaceMiB':768,'exitCode':code,'stoppedReason':stopped,'nodeTests':{'passed':count('pass'),'failed':count('fail'),'skipped':count('skipped'),'required':6},
             'sourceFileCount':len(source),'sourceFilesUnchanged':before==after,'independentChecks':results['checkCount'],'independentPass':results['pass'],
             'allDomainPolynomialComparisonExecutedByNode':True,'independentFractionControlsAreFinitePointChecks':True,
             'actualOriginalCurrentAttached':False,'allOrderSourceClassCertified':False,'originalN602Complete':False,'wholeM3Complete':False,
             'artifacts':[row(p) for p in sorted(out.iterdir()) if p.is_file()],'pass':bool(success)}
    write(out/'receipt.json',receipt);print(json.dumps({'receipt':row(out/'receipt.json'),'pass':bool(success),'nodeTests':receipt['nodeTests'],
          'independentChecks':results['checkCount'],'elapsedSeconds':elapsed},indent=2));return 0 if success else 1
if __name__=='__main__':sys.exit(main())
