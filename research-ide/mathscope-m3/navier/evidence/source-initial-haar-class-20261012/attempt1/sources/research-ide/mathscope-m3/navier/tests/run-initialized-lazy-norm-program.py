#!/usr/bin/env python3
"""Independent finite call-DAG and Q(sqrt(2)) norm-composition audit.

The independent substitutions below are formal positive scalar inputs,
not computed original norm values. Every source-result path is audited,
and an independent complete operator calculus checks the actual wiring.
The separate saved/live capability gate supplies source authentication.
"""
from datetime import datetime,timezone
from fractions import Fraction as Q
from functools import lru_cache
from math import comb,factorial,isqrt
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import resource
import shutil
import subprocess
import time

ROOT=Path(__file__).resolve().parents[4];BASE=ROOT/'research-ide/mathscope-m3/navier'

def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def digest(path):
    b=path.read_bytes();return {'path':str(path.relative_to(ROOT)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def sources():
    seen=set()
    def visit(path):
        path=path.resolve()
        if path in seen:return
        if not path.is_relative_to(ROOT):raise ValueError('Source escaped repository')
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for ref in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/ref)
    for p in [BASE/'source-initialized-lazy-norm-program.mjs',BASE/'tests/initialized-lazy-norm-program.test.mjs',Path(__file__)]:visit(p)
    return sorted(seen)

class K:
    """Exact a+b*sqrt(2); no floating-point norm or source substitution."""
    __slots__=('a','b')
    def __init__(self,a=0,b=0):self.a,self.b=Q(a),Q(b)
    def __add__(self,x):
        if not isinstance(x,K):x=K(x)
        return K(self.a+x.a,self.b+x.b)
    __radd__=__add__
    def __mul__(self,x):
        if not isinstance(x,K):x=K(x)
        return K(self.a*x.a+2*self.b*x.b,self.a*x.b+self.b*x.a)
    __rmul__=__mul__
    def __pow__(self,n):
        if n<0:
            d=self.a*self.a-2*self.b*self.b
            return K(self.a/d,-self.b/d)**(-n)
        v=K(1);b=self
        while n:
            if n&1:v=v*b
            b=b*b;n//=2
        return v
    def __eq__(self,x):
        if not isinstance(x,K):x=K(x)
        return self.a==x.a and self.b==x.b
    def __neg__(self):return K(-self.a,-self.b)
    def __sub__(self,x):return self+-x if isinstance(x,K) else self+K(-x)
    def sign(self):
        a,b=self.a,self.b
        if not b:return (a>0)-(a<0)
        if not a:return (b>0)-(b<0)
        if a*b>0:return (a>0)-(a<0)
        d=a*a-2*b*b
        return ((a>0)-(a<0))*((d>0)-(d<0))
    def __lt__(self,x):return (self-x).sign()<0

SQRT2=K(0,1)

def independent(data):
    checks=[]
    def check(name,truth):checks.append({'id':name,'pass':bool(truth)})
    for p in data['programs']:
        m=p['request']['order'];tag='m'+str(m)+'-';d=p['sourceDemand'];calls=p['callGraph']['calls'];nodes=p['scalarProgram']['nodes']
        expected={'backgroundSlowOrder':m+15,'targetWeightedOrder':m+13,'primaryOrder':m+12,'commonYOrder':m+12,
          'backgroundClassOrder':m+11,'pressureOrder':m+11,'initialResidualOrder':m+10,'temporalOrder':m+5,
          'freshDefectOrder':m+3,'fixedFiveOrder':m+2,'finiteCoefficientPrefix':max(2,m+11),'fullWeightedStressDerivativeOrder':m+11}
        for key,n in expected.items():check(tag+'exact-complete-derivative-demand-'+key,d[key]==n)
        names=['target','primary','commonY','background','radial','fourier','radial','five','pressure','initialResidual','temporal','fresh','initialized']
        dependencies=[[],[0],[1],[1],[],[],[],[],[2,4],[8,3],[9,5,4],[10,6],[11,7]]
        check(tag+'closed-producer-identity-inventory',[c['producer'] for c in calls]==names)
        for j,c in enumerate(calls):
            check(tag+'closed-call-dependencies-'+str(j),c['id']==j and c['dependencies']==dependencies[j])
            check(tag+'no-caller-or-executed-derivative-label-'+str(j),not c['callerCallableSupplied'] and not c['derivativeBodiesMaterialized'])
        check(tag+'only-same-family-and-fixed-source-leaves',p['callGraph']['leaves']==[0,4,5,6,7] and p['callGraph']['sameSourceLeaf']==0)
        check(tag+'first-original-inverse-only',calls[5]['request']=={'order':m+6,'inversePower':1})
        local=p['degreeProgram'];prefix=[]
        for j,row in enumerate(p['commonYMetadata']):
            a,b=local['primaryCovariance'][j],local['covarianceRemainder'][j]
            prefix.append((max(a['power'],b['power'])+1+j,max(a['pole'],b['pole'])))
            check(tag+'complete-leading-remainder-affine-degree-'+str(j),row['power']==max(x[0] for x in prefix) and row['pole']==max(x[1] for x in prefix))
        pole=max([r['pole'] for r in p['commonYMetadata']]+[3+3*(m+11)])
        check(tag+'primary-original-covariance-pole',d['requiredPrimaryRadialPole']==pole)
        check(tag+'distinct-fresh-quadratic-radial-pole',d['requiredFreshRadialPole']==2*pole and calls[4]['request']['pole']==pole and calls[6]['request']['pole']==2*pole)
        supported={'rational','source_norm_result','add','multiply','integer_power','sqrt_positive','maximum'}
        selected={}
        for i,n in enumerate(nodes):
            op,args=n['op'],n['args'];valid=op in supported
            if op=='rational':valid=valid and Q(*map(int,args))>=0
            elif op=='source_norm_result':
                c,path=args;name=calls[c]['producer'];key=(c,tuple(path));selected[key]=i
                valid=valid and c in [2,3,4,5,6,7]
                if name=='commonY':valid=valid and path[:2]==['bounds','rows'] and path[3:]==['fields','fullCovariance','constant'] and 0<=path[2]<=m+12
                elif name=='background':valid=valid and path[0]=='rows' and path[2] in ['F','G','b','fullStress'] and path[3:] == ['constant'] and 0<=path[1]<=m+11
                elif name=='fourier':valid=valid and path[:3]==['operators','temporal','rows'] and path[4:]==['constant'] and 0<=path[3]<=m+6
                elif name=='five':valid=valid and path[0]=='byOrder' and 0<=path[1]<=m+2 and (path[2:]==['maximum'] or path[2]=='componentBounds' and path[3] in ['v','gamma','psi','betaOverEpsilon'])
                elif name=='radial':
                    basic=path in [['geometry','B'],['geometry','middleZetaInverse'],['weight','wholeIntegralConstant']]
                    pressure=path[0] in ['pressureInput','pressureRows'] and 0<=path[1]<=calls[c]['request']['order'] and path[2] in ['wholeHaarProjectionConstant','rhoWeightedNorm','constant','pressureConstant']
                    change=path[:2]==['change','exponents'] and path[2] in [0,1] and path[3]=='throughOrder' and 0<=path[4]<=calls[c]['request']['order'] and path[5] in ['outputPrefactor','outputComposition','transformedSource']
                    cutoff=path[:2]==['cutoff','rows'] and 0<=path[2]<=calls[c]['request']['order']+1 and path[3]=='bound'
                    primitive=path[:3]==['rows',1,'orders'] and 0<=path[3]<=calls[c]['request']['order'] and path[4]=='primitiveConstant'
                    valid=valid and (basic or pressure or change or cutoff or primitive)
                else:valid=False
            else:
                children=args[:1] if op=='integer_power' else args
                valid=valid and all(isinstance(k,int) and 0<=k<i for k in children)
            check(tag+'typed-complete-scalar-node-'+str(i),valid)

        # Two independent positive substitutions test the entire connected
        # algebra. They are conditional scalar checks, never source values.
        for trial in [0,1]:
            t=tag+'formal-'+str(trial)+'-'
            def leaf(call,path):
                if not trial:return K(1)
                code=sum((j+1)*sum(map(ord,str(v))) for j,v in enumerate(path))
                # B is the same original fixed radial envelope in both
                # norm-index programs, so even the formal test retains it.
                if path==['geometry','B']:return K(2)
                return K(Q(3+(code+call)%11,3))
            values=[]
            for n in nodes:
                op,a=n['op'],n['args']
                if op=='rational':v=K(Q(*map(int,a)))
                elif op=='source_norm_result':v=leaf(a[0],a[1])
                elif op=='add':v=sum(values[k] for k in a)
                elif op=='multiply':
                    v=K(1)
                    for k in a:v=v*values[k]
                elif op=='integer_power':v=values[a[0]]**a[1]
                elif op=='sqrt_positive':
                    x=values[a[0]]
                    if x==K(2):v=SQRT2
                    else:
                        if x.b:raise ValueError('Unsupported nonrational square root')
                        an,bn=isqrt(x.a.numerator),isqrt(x.a.denominator)
                        if an*an!=x.a.numerator or bn*bn!=x.a.denominator:raise ValueError('Square root is not exact')
                        v=K(Q(an,bn))
                elif op=='maximum':v=max(values[k] for k in a)
                else:raise ValueError('Unknown scalar operator')
                values.append(v)
            def get(row):return values[row['constant']]
            def at(c,*path):
                key=(c,tuple(path))
                if key not in selected:raise ValueError('Complete selector missing: '+str(key))
                return leaf(c,list(path))
            def equal(name,value,row):check(t+name,value==get(row))
            def pressure_rows(gr,c):
                out=[]
                for j,g in enumerate(gr):
                    centered=at(c,'pressureInput',j,'constant')*g
                    raw=3**j*at(c,'change','exponents',0,'throughOrder',j,'outputPrefactor')*at(c,'change','exponents',0,'throughOrder',j,'outputComposition')*at(c,'cutoff','rows',j+1,'bound')*at(c,'weight','wholeIntegralConstant')*at(c,'geometry','middleZetaInverse')*at(c,'change','exponents',0,'throughOrder',j,'transformedSource')
                    rp=2**j*at(c,'pressureInput',j,'rhoWeightedNorm')*at(c,'pressureInput',j,'wholeHaarProjectionConstant')*g
                    out.append({'pressure':at(c,'pressureRows',j,'pressureConstant')*g,'centeredSource':centered,'rhoP':rp,
                      'cutoffA0':raw*centered,'fullRadialPressureDerivative':centered+raw*centered,'radialPressureDefect':rp+raw*centered})
                return out
            B=at(4,'geometry','B');cov=[at(2,'bounds','rows',j,'fields','fullCovariance','constant') for j in range(m+13)]
            I=lambda j:sum(comb(j,k)*factorial(k)*B**(k+1) for k in range(j+1))
            F=lambda j:sum(comb(j,k)*factorial(k+5)*B**(k+5) for k in range(j+1))
            gr=[cov[j+1]*(2+2*I(j)+SQRT2*F(j)) for j in range(m+12)]
            for j,g in enumerate(gr):equal('initial-full-gr-'+str(j),g,p['initialGr'][j]['gr'])
            pr=pressure_rows(gr,4)
            for j,r in enumerate(pr):
                for k,v in r.items():equal('initial-full-pressure-'+str(j)+'-'+k,v,p['initialPressure'][j][k])
            E=[]
            for j in range(m+11):
                W=cov[j+1];S=at(3,'rows',j+1,'fullStress','constant')
                pair={'Etheta':W*(2+2*I(j)+SQRT2*F(j))+S*(1+2*I(j)),
                  'Ez':W*(2+I(j)+SQRT2*F(j))+S*(1+I(j))+pr[j+1]['pressure']}
                E.append(pair)
                for k,v in pair.items():equal('initial-complete-residual-'+str(j)+'-'+k,v,p['initialResidualRows'][j]['fields'][k])
            desired=[]
            for j in range(m+7):
                f=at(5,'operators','temporal','rows',j,'constant');v=f*E[j+4]['Etheta'];g=f*E[j+4]['Ez']
                raw=3**j*at(4,'change','exponents',1,'throughOrder',j,'outputPrefactor')*at(4,'change','exponents',1,'throughOrder',j,'outputComposition')*at(4,'cutoff','rows',j+1,'bound')*at(4,'weight','wholeIntegralConstant')*at(4,'geometry','middleZetaInverse')*at(4,'change','exponents',1,'throughOrder',j,'transformedSource')
                desired.append({'v':v,'gammaDesired':g,'psi':g*at(4,'rows',1,'orders',j,'primitiveConstant'),'cutoffA1':g*raw,'gamma':g+g*raw})
            temporal=[]
            for j in range(m+6):
                a,b=desired[j],desired[j+1];row={**a,'beta':b['psi'],'slowTimeAngular':b['v'],'slowTimeAxial':b['gamma'],'fastTimeAxialCutoff':SQRT2*b['cutoffA1']}
                temporal.append(row)
                for k,v in row.items():equal('complete-temporal-operator-'+str(j)+'-'+k,v,p['temporalProducts']['rows'][j]['fields'][k])

            # Independent sequence calculus for every complete mean term.
            B=at(6,'geometry','B')
            def plus(*ss):return [sum(s[j] for s in ss) for j in range(min(map(len,ss)))]
            def scale(s,c):return [c*x for x in s]
            def product(a,b):return [sum(comb(j,k)*a[k]*b[j-k] for k in range(j+1)) for j in range(min(len(a),len(b)))]
            def inverse(n):return [factorial(j)*B**(j+1) for j in range(n)]
            def fast(n):return [factorial(j+4)*B**(j+4) for j in range(n)]
            def Dr(s):return plus(s[1:],scale(product(fast(len(s)-1),s[1:]),SQRT2))
            def De(s,e):return plus(Dr(s),scale(product(inverse(len(s)-1),s),e))
            def tm(s):return scale(s[1:],1+SQRT2)
            def divR(s,power=1):
                c=inverse(len(s))
                for _ in range(power-1):c=product(c,inverse(len(s)))
                return product(c,s)
            def Rmul(s,power):return product([factorial(power)*B**power]*len(s),s)
            def lap(s):
                ds=Dr(s)
                return plus(Dr(ds),product(inverse(len(ds)-1),ds),s[2:],product(product(inverse(len(s)-2),inverse(len(s)-2)),s))
            bg={k:[at(3,'rows',j,k,'constant') for j in range(m+5)] for k in ['b','G']}
            bg['V']=[2**j*B*at(3,'rows',j,'F','constant') for j in range(m+5)]
            previous={k:[row[k] for row in temporal] for k in ['beta','v','gamma']};W=cov[:m+5]
            projection=at(6,'pressureInput',0,'wholeHaarProjectionConstant')
            def fresh(v,n):
                beta,angular,axial=v['beta'],v['v'],v['gamma'];b,V,G=bg['b'],bg['V'],bg['G']
                groups={'time':tm(beta),'radial':De(plus(scale(product(b,beta),2),product(beta,beta),W),1),
                  'axial':plus(product(b,axial),product(G,beta),product(beta,axial),W)[1:],
                  'centrifugal':divR(plus(scale(product(V,angular),2),product(angular,angular),W)),'viscous':lap(beta)}
                g=plus(*groups.values());ft=Rmul(plus(product(G,angular),product(V,axial),product(axial,angular),W),2)
                fz=Rmul(plus(scale(product(G,axial),2),product(axial,axial),W),1);wg=Rmul(g,2)
                return {'gr':g[:n+1],'terms':groups,'fluxTheta':ft,'fluxZ':fz,'weightedGr':wg,
                  'defects':[{'P':projection*g[j],'Jtheta':projection*ft[j],'Jz':projection*(fz[j]+Q(1,2)*wg[j])} for j in range(n+1)]}
            before=fresh(previous,m+3)
            def verify_fresh(name,want,actual):
                for j,row in enumerate(actual['rows']):
                    for k in ['gr','fluxTheta','fluxZ','weightedGr']:equal(name+'-'+str(j)+'-'+k,want[k][j],row[k])
                    for k,seq in want['terms'].items():equal(name+'-'+str(j)+'-'+k,seq[j],row['grTerms'][k])
                    for k,v in want['defects'][j].items():equal(name+'-'+str(j)+'-'+k,v,row['defects'][k])
            verify_fresh('full-fresh-post-temporal',before,p['freshProducts'])
            pp=pressure_rows(before['gr'],6)
            for j,r in enumerate(pp):
                for k,v in r.items():equal('fresh-rebuilt-T0-'+str(j)+'-'+k,v,p['postPressure'][j][k])
            increment={k:[] for k in ['v','gamma','psi','beta']}
            for j,row in enumerate(p['fiveProducts']['rows']):
                total=sum(before['defects'][j+1].values())
                equal('all-three-new-defects-'+str(j),total,row['combinedInput'])
                for k in increment:
                    key='betaOverEpsilon' if k=='beta' else k
                    value=at(7,'byOrder',j,'componentBounds',key)*total;increment[k].append(value)
                    equal('full-five-source-product-'+str(j)+'-'+k,value,row['fields'][k])
            updated={k:[previous[k][j]+increment[k][j] for j in range(m+3)] for k in ['beta','v','gamma']}
            for j,row in enumerate(p['updatedVelocityRows']):
                for k,seq in updated.items():equal('old-plus-five-velocity-'+str(j)+'-'+k,seq[j],row[k])
            after=fresh(updated,m);verify_fresh('full-updated-mean',after,p['fullUpdatedMean'])
            pp=pressure_rows(after['gr'],6)
            for j,r in enumerate(pp):
                for k,v in r.items():equal('updated-full-T0-'+str(j)+'-'+k,v,p['updatedPressure'][j][k])
            beta,angular,axial=previous['beta'][:m+3],previous['v'][:m+3],previous['gamma'][:m+3]
            db,dv,dg=increment['beta'],increment['v'],increment['gamma'];b,G=bg['b'],bg['G']
            groups={'time':tm(db),'radial':De(plus(scale(product(b,db),2),scale(product(beta,db),2),product(db,db)),1),
              'axial':plus(product(b,dg),product(G,db),product(beta,dg),product(axial,db),product(db,dg))[1:],
              'angular':divR(plus(scale(product(angular,dv),2),product(dv,dv))),'viscous':lap(db)}
            rg=plus(*groups.values());jt=Rmul(plus(product(axial,dv),product(angular,dg),product(dg,dv)),2)
            jz=Rmul(plus(scale(product(axial,dg),2),product(dg,dg)),1);wrg=Rmul(rg,2)
            for j,row in enumerate(p['remainder']['rows']):
                for k,seq in groups.items():equal('full-nonlinear-remainder-'+str(j)+'-'+k,seq[j],row['terms'][k])
                for k,v in {'Rg':rg[j],'JthetaIntegrand':jt[j],'JzVelocityIntegrand':jz[j],'weightedRg':wrg[j]}.items():equal('remainder-integrand-'+str(j)+'-'+k,v,row[k])
                for k,v in {'P':projection*rg[j],'Jtheta':projection*jt[j],'Jz':projection*(jz[j]+Q(1,2)*wrg[j])}.items():equal('remainder-whole-moment-'+str(j)+'-'+k,v,row['defects'][k])
        kappa=Q(1,100000)
        for j,row in enumerate(p['rows']):
            check(tag+'original-tangential-positive-margin-'+str(j),1-kappa-Q(9,10)==Q(9999,100000)>0)
            check(tag+'original-radial-positive-margin-'+str(j),2-kappa-Q(19,10)==Q(9999,100000)>0)
            check(tag+'all-new-defects-exponent-'+str(j),all(f['epsilonExponent']=='2-2*kappa_s' and f['pole']==0 for f in row['freshDefects'].values()))
            check(tag+'new-defects-positive-C0-margin-'+str(j),2-2*kappa-Q(6,5)==Q(39999,50000)>0)
        check(tag+'no-source-or-materialization-authority-from-structure',not p['scope']['actualSourceIdentityAuthenticated'] and not p['scope']['actualFinitePrivateNormAttachmentExecuted'] and not p['scope']['originalAllFiniteSourceRecipeAuthenticated'])
        check(tag+'original-radial-flatness-and-complete-N6-separate',not p['scope']['allOrdersRadialCutoffFlatnessCertified'] and not p['scope']['completeN6'])
    higher=data['fixtures']['higherOrder']
    check('higher-finite-order-retains-original-source-demand',higher['request']['order']==13 and higher['sourceDemand']['backgroundSlowOrder']==28 and higher['sourceDemand']['targetWeightedOrder']==26)
    check('higher-finite-order-does-not-claim-source-body-materialization',not higher['scope']['actualHighOrderSourceDerivativeBodiesMaterialized'] and all(r['defectExponents']==['2-2*kappa_s']*3 for r in higher['finalRows']))
    check('all-registry-items-are-imported-function-references',data['fixtures']['producersAreActualImportedFunctions'] and len(data['fixtures']['producerKeys'])==24)
    check('no-finite-substitution-is-an-original-norm-value',not data['actualPrivateCurrentIdentityUsed'] and not data['actualHighOrderSourceLeafMaterializationExecuted'] and not data['completeN6'])
    return checks

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--attempt',type=int,required=True);a=ap.parse_args()
    if a.attempt<1:raise ValueError('A positive new attempt is required')
    dest=BASE/'evidence/source-initialized-lazy-norm-program-20261012'/('attempt'+str(a.attempt))
    if dest.exists():raise ValueError('An observed attempt cannot be overwritten')
    dest.mkdir(parents=True);start=time.monotonic();started=datetime.now(timezone.utc).isoformat();paths=sources()
    before=[digest(p) for p in paths];write(dest/'source-before.json',before)
    for path in paths:
        target=dest/'sources'/path.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,target)
    env=dict(os.environ);env['MATHSCOPE_INITIALIZED_LAZY_NORM_DIRECTORY']=str(dest)
    cmd=['node','--max-old-space-size=384','--test',str(BASE/'tests/initialized-lazy-norm-program.test.mjs')]
    with (dest/'node.log').open('w') as out:result=subprocess.run(cmd,env=env,stdout=out,stderr=subprocess.STDOUT,timeout=60,check=False)
    log=(dest/'node.log').read_text();nt=re.search(r'(?:#|ℹ) tests (\d+)',log);np=re.search(r'(?:#|ℹ) pass (\d+)',log)
    checks=[];error=None
    try:checks=independent(json.loads((dest/'initialized-lazy-norm-program.json').read_text()))
    except Exception as exc:error=str(exc)
    write(dest/'independent-exact.json',{'schema':'MathScope.N6.InitializedLazyNormIndependent/1','checks':checks,'error':error,
      'oracle':'Independently typed closed producer DAG, exact finite derivative and pole recurrences, and two Q(sqrt(2)) substitutions through the complete radial, stress, temporal, fresh-moment, T0, fixed-five and nonlinear-remainder calculus.',
      'formalPositiveScalarsAreNotOriginalNormValues':True,'actualSourceIdentityAndMaterializationGateSeparate':True})
    after=[digest(p) for p in paths];write(dest/'source-after.json',after)
    success=result.returncode==0 and nt and np and nt[1]==np[1]=='9' and checks and all(c['pass'] for c in checks) and error is None and before==after
    receipt={'schema':'MathScope.N6.InitializedLazyNormObservedReceipt/1','status':'PASS' if success else 'FAIL',
      'startedAt':started,'finishedAt':datetime.now(timezone.utc).isoformat(),'elapsedSeconds':time.monotonic()-start,
      'node':{'command':cmd,'exitCode':result.returncode,'tests':int(nt[1]) if nt else None,'passed':int(np[1]) if np else None,
        'maxOldSpaceMiB':384,'wallLimitSeconds':60,'observedChildResourceMaxRSSBytes':resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss*1024},
      'independent':{'status':'PASS' if checks and all(c['pass'] for c in checks) and error is None else 'FAIL','passed':sum(c['pass'] for c in checks),'total':len(checks),'error':error},
      'source':{'files':len(paths),'unchanged':before==after,'snapshotDirectory':'sources'},
      'artifacts':[digest(p) for p in sorted(dest.iterdir()) if p.is_file()],
      'scope':{'closedFiniteScalarProgramExecuted':True,'fullOperatorCompositionIndependentlyReplayed':True,
        'actualLiveSourceIdentityGateExecuted':False,'actualHighOrderSourceBodiesMaterialized':False,
        'actualSavedSourceBindingSeparate':True,'completeN6':False}}
    write(dest/'receipt.json',receipt);print(json.dumps(receipt,ensure_ascii=False,indent=2));raise SystemExit(0 if success else 1)

if __name__=='__main__':main()
