#!/usr/bin/env python3
"""Independent exact algebra and source-bound checks for actual mean stress.

Only the Python standard library is used. Decimal probes exercise elementary
inequalities independently; they are not a substitute for the continuous proof
or an arbitrary-precision evaluation of the source's entire heat integral.
"""
from __future__ import annotations
import argparse
from decimal import Decimal, localcontext
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[4]
NAVIER=ROOT/'research-ide/mathscope-m2/navier'
COUNT=0
CATEGORIES={}

def check(condition, label, category):
    global COUNT
    if not condition:
        raise AssertionError(label)
    COUNT+=1
    CATEGORIES[category]=CATEGORIES.get(category,0)+1

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def receipt():
    source="import {evaluateActualMeanStress} from './research-ide/mathscope-m2/navier/actual-mean-stress.mjs';console.log(JSON.stringify(evaluateActualMeanStress({bits:512})));"
    return json.loads(subprocess.run(['node','--input-type=module','-e',source],cwd=ROOT,check=True,capture_output=True,text=True).stdout)

def exact_algebra(program,values,parameters):
    overrides={program['roots'][key]:value for key,value in values.items()}
    cache={}
    def ev(node_id):
        if node_id in overrides:
            return overrides[node_id]
        if node_id in cache:
            return cache[node_id]
        op,args=program['nodes'][node_id].values()
        if op=='rational': v=F(int(args[0]),int(args[1]))
        elif op=='source_parameter': v=parameters[args[0]]
        elif op=='add': v=ev(args[0])+ev(args[1])
        elif op=='multiply': v=ev(args[0])*ev(args[1])
        elif op=='inverse': v=1/ev(args[0])
        elif op=='integer_power': v=ev(args[0])**args[1]
        else: raise AssertionError('No implicit numerical/source substitution: '+op)
        cache[node_id]=v
        return v
    return lambda name: ev(program['roots'][name])

def run():
    r=receipt();p=r['program'];nodes=p['nodes'];roots=p['roots']
    for item in r['sourceBindings']+list(r['sourceInputs'].values()):
        path=ROOT/'research-ide'/item['path']
        check(path.stat().st_size==item['bytes'],item['path']+' byte length','source_binding')
        check(sha(path)==item['sha256'],item['path']+' hash','source_binding')

    # Execute the generated algebra with independent exact rational operands.
    # These finite probes test the universal identity; they do not change the
    # pinned source or masquerade as evaluations of its huge physical scales.
    for j in range(1,49):
        lam=F(1,50)+F(j,5000);h=F(1,10000)+F(j,1000000)
        X=F(48+j);H=F(7+j,13);E=F(2+j,9);Ffield=F(11+j,17)
        m=F(1+j,7);J=F(2+j,11);trans=F(-j,1000);DI=F(-3-j,100)
        ev=exact_algebra(p,{'X':X,'H':H,'E':E,'F':Ffield,'mConst':m,'Jeta':J,'transient':trans,'heatIAtZero':DI},{'lambda':lam,'h':h})
        Iref=X*H*(1/(1-lam)+trans);I=Iref-DI
        Q=-1+m/X+((1-h)*I-J)/(X*H);a=2+2*lam
        normalized=(X*Q-a)/(X*lam)
        check(ev('IReference')==Iref,'independent Iref','fraction_identity')
        check(ev('IActual')==I,'full heat debt sign','fraction_identity')
        check(ev('Qs')==Q,'original (4.16)','fraction_identity')
        check(ev('theta')==Ffield*(X*Q-a),'original (4.11) viscosity','fraction_identity')
        check(ev('normalizedTheta')==normalized,'source normalization','fraction_identity')
        heat=-(1-h)*DI/(X*H*lam)
        check(ev('term_heatCompensation')==heat and heat>0,'positive heat compensation','fraction_identity')
        check(ev('term_viscousShear')==-a/(X*lam),'radial viscosity scale','fraction_identity')
        wrong_heat=(-1+m/X+((1-h)*(Iref+DI)-J)/(X*H)-a/X)/lam
        check(normalized-wrong_heat==2*heat,'wrong heat sign detected','negative_control')
        dropped_J=(-1+m/X+(1-h)*I/(X*H)-a/X)/lam
        check(dropped_J-normalized==J/(X*H*lam)>0,'missing J_eta detected','negative_control')
        check(Q/lam-normalized==a/(X*lam)>0,'missing shear detected','negative_control')
        # Pointwise moment values alone do not determine their eta derivative.
        s_eta=F(j,31)
        check(-s_eta/X!=0,'missing S_eta invalidates zero axial stress','negative_control')

    # Check the independently collected exponents of the actual source scales.
    # A pair is the affine expression a*T+b. No exp(huge) is materialized.
    add=lambda x,y:(x[0]+y[0],x[1]+y[1])
    sub=lambda x,y:(x[0]-y[0],x[1]-y[1])
    logX=(F(60001),F(-6));logXstar=(F(60001),F(-18))
    inv_lambda=(F(1000),F(0));log_m_over_XR=(F(1),F(1))
    check(add(sub(log_m_over_XR,logX),inv_lambda)==(-59000,7),'m exponent independently collected','source_exponent')
    check(add(sub((0,0),logX),inv_lambda)==(-59001,6),'viscous exponent independently collected','source_exponent')
    check(add(sub((0,0),logXstar),inv_lambda)==(-59001,18),'heat exponent independently collected','source_exponent')
    decay=F(99,100)*60000-1000
    check(decay==58400 and F(99,100)*8<8,'lambda-dependent stage decay','source_exponent')
    check(F(5,8)+9==F(77,8)<10 and 10+3==13 and 13+2<16,'r-entry bounds','source_exponent')
    check(F(5,2)+4*9+4*9==F(149,2)<128,'J-shape bound','source_exponent')
    rows=r['bounds']['rows'];expected=[(1,1000,0),(1,7002,0),(4,58400,8),(2,59000,7),(7,58400,8),(2,59001,6),(10,59001,18)]
    for row,(power,rate,offset) in zip(rows,expected):
        exponent=128*rate-offset-power
        check((int(row['powerOfTwo']),int(row['decayT']),int(row['offset']))==(power,rate,offset),row['id']+' independently derived coefficient','source_exponent')
        check(int(row['strictDyadicUpperExponent'])==exponent,row['id']+' exact dyadic bound','source_exponent')
        check(exponent>4096+3,row['id']+' maximum supported precision','source_exponent')
    minimum=min(int(row['strictDyadicUpperExponent']) for row in rows)
    check(F(7,1<<minimum)<F(1,1<<4096),'sum of every correction, not a maximum alone','source_exponent')
    lower=F(r['bounds']['theta']['lower']);upper=F(r['bounds']['theta']['upper'])
    check(lower==1-F(1,1<<512) and upper==1+F(1,1<<512),'exact nonzero observation width','source_exponent')

    # Actual parity is visible in the expanded derivative roots. Independently
    # inspect all eta uses of the original integral, before eta=0 substitution.
    for name in ['heatIetaAtZero','heatSetaAtZero','heatCpetaAtZero']:
        check(nodes[roots[name]]=={'op':'rational','args':['0','1']},name+' differentiated exactly','parity')
    def children(node):
        op,args=node['op'],node['args']
        if op in ['rational','coordinate','source_parameter']: return []
        if op in ['integer_power','source_step_derivative']: return [args[0]]
        return args
    for name in ['heatI','heatS','heatCp']:
        visited=set();eta_parents=[]
        def walk(i):
            if i in visited:return
            visited.add(i)
            for child in children(nodes[i]):
                if nodes[child]=={'op':'coordinate','args':['eta']}:eta_parents.append(nodes[i])
                walk(child)
        walk(roots[name])
        check(bool(eta_parents) and all(n['op']=='integer_power' and n['args'][1]==2 for n in eta_parents),name+' depends only on eta squared','parity')
    check(r['axialParity']['coreParityAssumed'] is False,'asymmetric source core not silently reflected','parity')
    check(r['axialParity']['matchedAsFunctionsOfEta'] is True,'restoration includes eta derivatives','parity')

    # Independent Decimal probes of the elementary lower-bound inequalities.
    # Their continuous proofs use monotonicity, not these samples: Gamma<=2
    # follows from v^h<=1+v, and the chosen v/y rectangles have positive mass.
    with localcontext() as ctx:
        ctx.prec=90
        one=Decimal(1);two=Decimal(2);three=Decimal(3)
        check(two<one.exp()<three,'elementary exp constants independently evaluated','decimal_heat')
        for hd in [128,256,1024]:
            h=one/Decimal(hd)
            for zn,zd in [(1,16),(1,4),(1,2),(1,1),(2,1)]:
                Z=Decimal(zn)/Decimal(zd)
                log=(one+Z).ln();a=h*log
                check(log>=Z/(one+Z)>=Z/three,'positive logarithm lower','decimal_heat')
                check(0<a<1 and one-(-a).exp()>=a/2,'positive exponential loss','decimal_heat')
                for vn,vd in [(1,1),(3,2),(2,1)]:
                    v=Decimal(vn)/Decimal(vd)
                    loss=one-(-h*(one+Z*v).ln()).exp()
                    numerator=(-v+h*v.ln()).exp()*loss
                    check(numerator/2>h*Z/Decimal(128),'Laplace rectangle lower integrand','decimal_heat')
                check((1-h)>0,'positive angular heat coefficient','decimal_heat')
            for sn,sd in [(1,2),(3,4),(1,1)]:
                s=Decimal(sn)/Decimal(sd)
                check((-h*s).exp()>one/three,'outer y rectangle lower','decimal_heat')
        check(F(1,108)>F(1,128),'Gamma/Laplace rational slack','decimal_heat')
        check(F(1,384)>F(1,512),'full heat debt lower slack','decimal_heat')

    for key in ['arbitraryEtaStressNumericallyEvaluated','positiveOrderBackgroundStressAssumedZero','globalCoreNumericallyEvaluated','wholeAnnulusCovarianceMatched','globalEquation730Certified','fullN5PackageComplete','newLeanKernelProof']:
        check(r['scope'][key] is False,key+' scope','scope')
    check(r['bounds']['heatCompensation']['debtSetToZero'] is False,'nonzero heat not deleted','scope')
    check(r['bounds']['proofUsesSampling'] is False,'interval is not sample-to-domain promotion','scope')
    return {'schema':'MathScope.ActualMeanStressIndependentAudit/1','pass':True,'checks':COUNT,'categories':CATEGORIES,
            'tools':'Python standard-library Fraction and 90-digit Decimal, independent generated-expression interpreter; Node only obtains the runtime receipt.',
            'scope':'Actual eta-zero leading stress enclosure from exact restored moments and whole-tail bounds. Finite rational probes check universal identities and are never substituted for the fixed source.',
            'wholeHeatQuadratureExecuted':False,'newLeanProof':False,'runtimeChecks':len(r['bounds']['checks']),'programNodes':len(nodes),
            'normalizedTheta':r['normalizedTarget']['theta'],'normalizedZ':r['normalizedTarget']['z'],
            'exactErrorBound':r['normalizedTarget']['thetaExact']['absoluteRemainderUpper'],
            'sourcePaperSHA256':PINNED_SOURCE_PAPER,'assemblySHA256':r['sourceHash'],
            'files':[{ 'path':str(path.relative_to(ROOT)),'bytes':path.stat().st_size,'sha256':sha(path)} for path in [NAVIER/'actual-mean-stress.mjs',Path(__file__),NAVIER/'tests/actual-mean-stress.test.mjs',NAVIER/'research/ACTUAL_MEAN_STRESS_KO.md']],
            'receipt':r}

PINNED_SOURCE_PAPER='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--write',type=Path);args=parser.parse_args()
    evidence=run()
    if args.write:
        target=args.write if args.write.is_absolute() else ROOT/args.write
        target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in evidence.items() if k not in ['receipt','files']},ensure_ascii=False,indent=2))
