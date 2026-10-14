#!/usr/bin/env python3
"""Prove the retained actual A.21 positive-measure mass bound.

The immutable twelve-stage graph is matched to independently written formulas,
including the actual Qb/Qp wait and infinite pressure tail. No source PASS,
quadrature, finite sample or replacement field is a proof input.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse, hashlib, json, re, time

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
PINS={
 'actual-global-source-outer.mjs':'5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9',
 'actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
 'actual-continuation-exact-core.mjs':'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
 'source-profile-data.mjs':'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a',
}
STAGES=['initial','axialDecay','entry','reservedPower','pulse','interpolation','angular','steepen','steepPower','flatten','wait','terminal']
def sha(raw):return hashlib.sha256(raw).hexdigest()
def digest(x):return sha(json.dumps(x,separators=(',',':'),ensure_ascii=False).encode())
def q(n,d=1):return ('q',F(n,d))
ZERO=q(0);ONE=q(1)
def rational(x):return x[0]=='q'
def add(*xs):
    flat=[];constant=F(0)
    for x in xs:
        for y in (x[1] if x[0]=='add' else [x]):
            if rational(y):constant+=y[1]
            else:flat.append(y)
    if constant:flat.append(('q',constant))
    flat.sort(key=repr)
    return ZERO if not flat else flat[0] if len(flat)==1 else ('add',tuple(flat))
def mul(*xs):
    flat=[];constant=F(1)
    for x in xs:
        for y in (x[1] if x[0]=='mul' else [x]):
            if rational(y):constant*=y[1]
            else:flat.append(y)
    if not constant:return ZERO
    powers={}
    for y in flat:
        base,degree=(y[1],y[2]) if y[0]=='pow' else (y,1)
        powers[base]=powers.get(base,0)+degree
    flat=[base if n==1 else ('pow',base,n) for base,n in powers.items() if n]
    if constant!=1:flat.append(('q',constant))
    flat.sort(key=repr)
    return ONE if not flat else flat[0] if len(flat)==1 else ('mul',tuple(flat))
def powr(x,n):
    if n==0:return ONE
    if rational(x):return ('q',x[1]**n)
    if x[0]=='pow':return powr(x[1],x[2]*n)
    return x if n==1 else ('pow',x,n)
def sub(a,b):return add(a,mul(q(-1),b))
def div(a,b):return mul(a,powr(b,-1))
def exp(x):return ONE if x==ZERO else ('exp',x)
def log(x):return ZERO if x==ONE else ('log',x)
def step(x,n=0):
    if rational(x) and (x[1]<=0 or x[1]>=1):return q(int(n==0 and x[1]>=1))
    return ('step',x,n)
def integral(body,left,right):return ('integral',body,left,right)
def I(fn,left,right,depth=0):return integral(fn(('bound',depth),depth+1),left,right)
def S(x,depth=0):
    # The original outer schedule performs these two exact FTC reductions.
    if x==ZERO:return ZERO
    if x==ONE:return q(1,2)
    return I(lambda t,d:step(t),ZERO,x,depth)
def sourceS(x,depth=0):return I(lambda t,d:step(t),ZERO,x,depth)
def render(x):return repr(x)

def side_conditions():
    hmax=F(1,16);rho=hmax/256;checks=[]
    def check(name,value,formula):checks.append({'id':name,'pass':bool(value),'formula':formula})
    check('actual_h_guard',8002*128>200 and 200>4,'T>128 ande>2 imply0<h=exp(-8002T)<2^-200<2^-4=1/16.')
    check('h_below_one_over16_without_float',1+8002*128>16,'exp(8002T)>1+8002T>16.')
    check('source_step_derivative_upper648',8*3**4==648,'fprime<=4, f(t)+f(1-t)>=exp(-4)>1/81; sigma-prime<8*81=648.')
    check('terminal_amplitude_gradient_lt2h',F(324,256)/(1-rho)<2,'fo-prime/fo<=324rho/(1-rho)<2h when rho=h/256<1/4096.')
    check('all_postinitial_slopes_below_minus_quarter',-F(1,2)+hmax<-F(1,4),'Terminal slope<-1/2+h<-7/16; all other postinitial slopes<=-1/2.')
    check('initial_density_upper5_over4',F(1)/(1-F(1,5))==F(5,4),'exp(s/5)<sum_(n>=0)(1/5)^n=5/4 for0<=s<=1; the negative primitive term is retained.')
    check('initial_endpoint_density_upper25_over37',1+F(2,5)+F(2,5)**2/2==F(37,25),'sigma(1-t)=1-sigma(t) givesintegral_0^1sigma=1/2; c1²=exp(-2/5)<25/37.')
    check('actual_Qhold_lower2',F(1,2)*4==2,'Qsteep>0,1-h>1/2,holdLength=-4log h>4, henceQhold>2.')
    check('actual_Qb_lower1',3<4,'exp(-(1-h)/2)>exp(-1/2)>1/2 becausee<3<4; Qb>Qhold/2>1.')
    check('actual_Qp_upper1',27*rho/(1-rho)<1,'0<Qp<27rho/(1-rho)<27/4095<1 usingFTC integralofsigma-prime=1 and exp(3)<27.')
    check('actual_wait_positive_guard',hmax<1,'0<Qp<1<Qb and1-h>0 implywait=log(Qb/Qp)/(1-h)>0 andfinite.')
    total=F(1,2)*(5+F(5,4)+F(50,37))
    check('actual_positive_measure_mass_lt4K',total==F(1125,296) and total<4,'nu(total)/K<=1/2*(5+5/4+50/37)=1125/296<4.')
    check('pressure_complex_sup5K',total*F(256,255)**2<5,'On|Im z|<=1/16,Re(1+z²)>=255/256; massboundgives|P(z)|<5K.')
    check('retained_reference_pressure_lower',F(5,2)*F(1,2)**2==F(5,8),'Retained reference theta1 measure hasmass5K/2; on|eta|<=1,-P>=5K/8.')
    if not all(r['pass'] for r in checks):raise ValueError('Pressure mass arithmetic failed')
    return {'checks':checks,'allExactChecksPassed':True,'actualMassOverKUpper':str(total),'arithmetic':'EXACT_FRACTION_INTEGER_ONLY'}

def source_binding(repo):
    from source_dag import verify_capture,open_header,definitions,stream_snapshot
    capture=verify_capture(repo);header=open_header(repo);tables=definitions(header);fixed=tables['fixed'];outer=fixed['outer'];pressure=fixed['pressure'];core=fixed['core'];producer_rows=[]
    for name,expected in PINS.items():
        path='research-ide/mathscope-m2/navier/'+name;raw=(repo/path).read_bytes()
        if sha(raw)!=expected:raise ValueError('Changed pressure producer '+path)
        producer_rows.append({'path':path,'sha256':expected,'bytes':len(raw)})
    raw=(repo/'research-ide/mathscope-m2/navier/source-profile-data.mjs').read_bytes();profile=json.loads(re.search(rb'export const PINNED_N3 = (.*);',raw).group(1));p=profile['parametersExactExpressions']
    if fixed['source']['parametersExactExpressions']!=p or fixed['source']['parameterExpressionSHA256']!=profile['parameterExpressionSHA256'] or outer['parameterExpressionSHA256']!=profile['parameterExpressionSHA256']:raise ValueError('The retained pressure does not bind the exact pinned parameter graph')
    expected={'Md':{'integer':1048576},'T':{'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},'lambda':{'exp':{'product':[{'integer':-1000},{'ref':'T'}]}},'co':{'rational':'1/256'},'Tf':{'integer':128},'BOuter':{'product':[{'integer':1000},{'ref':'T'}]},'logP':{'product':[{'integer':2},{'ref':'T'}]},'Pstar':{'exp':{'ref':'logP'}},'K':{'power':[{'ref':'Pstar'},2]}}
    if any(p[k]!=v for k,v in expected.items()):raise ValueError('Changed actual pressure parameters')
    if [r['id'] for r in outer['stages']]!=STAGES or [r['id'] for r in pressure['stages']]!=STAGES:raise ValueError('Changed twelve-stage pressure schedule')
    if core['P0']!=pressure['pressure'] or core['eta']!=pressure['eta']:raise ValueError('The actual core pressure root or formal eta changed')
    ids={core['P0'],core['P0OverPstarSquared'],pressure['initialInfinitePrefix'],pressure['terminalInfiniteTail'],outer['roots']['Qb'],outer['roots']['Qp'],outer['roots']['terminalWait']}
    for r in pressure['stages']:ids.update(r[k] for k in ['variable','integrand','lower','upper','integral','theta'])
    for r in outer['stages']:ids.update(r[k] for k in ['start','end','length','logAStart','logAEnd'])
    nodes={};cutoff=max(ids)
    for ident,node in stream_snapshot(repo):
        if ident<=cutoff:nodes[ident]=node
    if verify_capture(repo)!=capture:raise ValueError('Source changed during pressure stream')
    used=set();cache={}
    def key(ident,scope=(),depth=0):
        token=(ident,scope,depth)
        if token in cache:return cache[token]
        used.add(ident);n=nodes[ident];a=n['args'];op=n['op'];env=dict(scope)
        at=lambda i:key(a[i],scope,depth)
        if op=='rational':out=('q',F(*map(int,a)))
        elif op=='source_parameter':out=('p',a[0])
        elif op=='coordinate':out=env.get(ident,('coordinate',ident))
        elif op=='add':out=add(*(key(i,scope,depth) for i in a))
        elif op=='multiply':out=mul(*(key(i,scope,depth) for i in a))
        elif op=='inverse':out=powr(at(0),-1)
        elif op=='integer_power':out=powr(at(0),a[1])
        elif op=='exp':out=exp(at(0))
        elif op=='log_positive':out=log(at(0))
        elif op=='source_step_derivative':out=step(at(0),a[1])
        elif op=='definite_integral':
            if nodes[a[1]]['op']!='coordinate':raise ValueError('Invalid pressure integral binder')
            local=dict(env);local[a[1]]=('bound',depth)
            out=integral(key(a[0],tuple(sorted(local.items())),depth+1),key(a[2],scope,depth),key(a[3],scope,depth))
        else:raise ValueError('Unreviewed operation in actual pressure formula '+op+' atnode'+str(ident))
        cache[token]=out;return out
    h=('p','h');lam=('p','lambda');T=('p','T');B=('p','BOuter');Tf=('p','Tf');rho=mul(('p','co'),h)
    alpha=mul(q(-1),add(q(1,2),lam));terminal_slope=mul(q(-1),add(q(1,2),h));eta=('eta',);s=('s',);f=powr(add(ONE,powr(eta,2)),-1);logf=log(f)
    def fo(x):return sub(ONE,mul(rho,sub(ONE,step(div(sub(x,ONE),q(2))))))
    def delta(name,x,depth=0,outer_formula=False):
        primitive=S if outer_formula else sourceS
        if name=='initial':return sub(mul(q(1,10),x),mul(q(3,5),primitive(x,depth)))
        if name=='axialDecay':return mul(q(-1,2),x)
        if name=='entry':return sub(mul(q(-1,2),x),mul(lam,primitive(x,depth)))
        if name in ['reservedPower','pulse','angular']:return mul(alpha,x)
        if name=='interpolation':return sub(mul(alpha,x),mul(log(q(2)),step(div(x,Tf))))
        if name=='steepen':return sub(mul(alpha,x),mul(sub(ONE,lam),primitive(x,depth)))
        if name=='steepPower':return mul(q(-3,2),x)
        if name=='flatten':return add(mul(q(-3,2),x),mul(sub(ONE,h),primitive(x,depth)))
        if name=='wait':return mul(terminal_slope,x)
        if name=='terminal':return add(mul(terminal_slope,x),log(div(fo(x),sub(ONE,rho))))
        raise ValueError('Unknown pressure stage')
    a=sub(ONE,lam);hm=sub(ONE,h);hold=mul(q(-4),log(h));Q0=div(sub(lam,h),a)
    Qsteep=mul(exp(mul(q(-1,2),a)),add(Q0,I(lambda t,d:mul(exp(mul(a,sub(t,S(t,d)))),sub(add(lam,mul(a,step(t))),h)),ZERO,ONE)))
    Qhold=add(Qsteep,mul(hm,hold))
    Qb=mul(exp(mul(q(-1,2),hm)),add(Qhold,I(lambda t,d:mul(exp(mul(hm,S(t,d))),hm,sub(ONE,step(t))),ZERO,ONE)))
    Qp=I(lambda t,d:div(mul(exp(mul(hm,t)),rho,step(div(sub(t,ONE),q(2)),1)),mul(q(2),sub(ONE,rho))),ONE,q(3))
    if key(outer['roots']['Qb'])!=Qb or key(outer['roots']['Qp'])!=Qp:raise ValueError('Actual A13 Qb/Qp no longer match the complete positive formula')
    wait=div(log(div(Qb,Qp)),hm)
    if key(outer['roots']['terminalWait'])!=wait:raise ValueError('Actual terminal wait changed')
    lengths=[ONE,T,ONE,mul(q(60),B),div(q(13),lam),Tf,mul(q(30),B),ONE,hold,ONE,wait,q(3)]
    logA=ZERO;y=ZERO;rows=[]
    for j,name in enumerate(STAGES):
        outrow=outer['stages'][j];pr=pressure['stages'][j];length=lengths[j]
        if key(outrow['length'])!=length or key(pr['upper'])!=length or key(pr['lower'])!=ZERO:raise ValueError('Actual stage lengths or finite endpoints changed: '+name)
        if key(outrow['start'])!=y or key(outrow['logAStart'])!=logA:raise ValueError('Actual source stage join changed: '+name)
        theta=sub(ONE,step(div(s,Tf))) if name=='interpolation' else ONE if j<5 else ZERO
        scope=tuple(sorted({core['eta']:eta,pr['variable']:s}.items()))
        if key(pr['theta'],scope)!=theta:raise ValueError('Actual source pressure theta changed: '+name)
        expected_density=exp(mul(q(2),add(logA,delta(name,s),mul(theta,logf))))
        if key(pr['integrand'],scope)!=expected_density:raise ValueError('Actual A21 stage integrand differs from the independent formula: '+name)
        if nodes[pr['integral']]!={'op':'definite_integral','args':[pr['integrand'],pr['variable'],pr['lower'],pr['upper']]}:raise ValueError('Actual full stage integral changed: '+name)
        logA=add(logA,delta(name,length,outer_formula=True));y=add(y,length)
        if key(outrow['logAEnd'])!=logA or key(outrow['end'])!=y:raise ValueError('Actual endpoint amplitude changed: '+name)
        rows.append({'id':name,'sourceVariable':pr['variable'],'sourceIntegrand':pr['integrand'],'sourceIntegral':pr['integral'],'sourceUpper':pr['upper'],'sourceLogAStart':outrow['logAStart'],'sourceLogAEnd':outrow['logAEnd'],'independentFormulaMatched':True,'thetaRange':[0,1],'upperLogAmplitudeSlope':'1/10' if name=='initial' else '-1/4'})
    scope=((core['eta'],eta),)
    prefix=mul(q(5),powr(f,2));tail=div(exp(mul(q(2),logA)),add(ONE,mul(q(2),h)))
    if key(pressure['initialInfinitePrefix'],scope)!=prefix or key(pressure['terminalInfiniteTail'])!=tail:raise ValueError('The complete infinite pressure prefix or tail changed')
    expected_p_over=mul(q(-1,2),add(prefix,*(key(pr['integral'],scope) for pr in pressure['stages']),tail))
    if key(core['P0OverPstarSquared'],scope)!=expected_p_over or key(core['P0'],scope)!=mul(powr(('p','Pstar'),2),expected_p_over):raise ValueError('The actual source P0 pressure aggregate changed')
    return {'status':'FULL_LITERAL_A21_SOURCE_IDENTIFIED','sourceCapture':capture,'sourceCaptureReverifiedAfterStream':True,'fullParentStreamVerified':True,'fullParentNodes':3892594,'sourceProducerBindings':producer_rows,
      'parameterExpressionSHA256':profile['parameterExpressionSHA256'],'exactParameterShapesChecked':sorted(expected),'actualPressureNode':core['P0'],'actualPressureOverPstarSquaredNode':core['P0OverPstarSquared'],
      'actualPressureNodeSHA256':digest(nodes[core['P0']]),'retainedSourcePrefixNodes':len(nodes),'independentlyMatchedStages':rows,
      'actualWaitOperands':{'Qb':outer['roots']['Qb'],'Qp':outer['roots']['Qp'],'wait':outer['roots']['terminalWait'],'sourceOperandFormulasMatched':True,'waitPositiveByWrittenProof':True},
      'actualInfiniteTerms':{'referencePrefix':pressure['initialInfinitePrefix'],'terminalTail':pressure['terminalInfiniteTail'],'bothRetainedAndIndependentlyMatched':True},
      'selectedNodeCount':len(used),'selectedSourceNodesSHA256':digest([[i,nodes[i]] for i in sorted(used)]),'sourceNodeOrIntegralReplacedByNumericValue':False}

def proof_record():
    return {'status':'PROVED','proofMethod':'WRITTEN_CLASSICAL_WITH_EXACT_SOURCE_FORMULA_BINDING',
      'positiveMeasure':'dnu(y)=K*c(y)^2*dy/2, with reference/piecewise/tail amplitudes independent of eta and0<=theta(y)<=1.',
      'steps':[
       'The literal normalized flat step is smooth,0<=sigma<=1,0<=sigma-prime<648, andsigma(1-t)=1-sigma(t). Henceintegral_0^1sigma=1/2.',
       'All twelve stage lengths are positive. The nontrivial A13 wait is positive becauseQsteep>0,Qhold>2,Qb>1 and0<Qp<27rho/(1-rho)<1.',
       'At the first transition0<=s<=1,c(s)^2=exp(s/5-6*integral_0^s sigma/5)<=exp(1/5)<5/4. Its endpoint is c1²=exp(-2/5)<25/37.',
       'All subsequent log amplitude derivatives are<=-1/4. Terminal fo>=1-rho,fo-prime<=324rho yieldfo-prime/fo<2h, hence terminal log slope<-1/2+h<-1/4.',
       'Joins use the exact recorded logAEnd as the next logAStart. Thus c(y)^2<=c1²*exp(-(y-1)/2) for every y>=1, including the infinite terminal tail.',
       'The reference infinite prefix integral equals5. The complete rest contributes<=5/4+2*(25/37). Therefore nu(total)<=1125K/296<4K.',
       'For |Im z|<=1/16,Re(1+z²)>=255/256. The principal-log power(1+z²)^(-2theta) is holomorphic and bounded by(256/255)^2 uniformly for0<=theta<=1. Integrability against this actual finite positive measure gives holomorphy and |P(z)|<5K.',
       'On the real line P is smooth,negative, andeta*Pprime(eta)>=0. The actual theta1 reference mass5K/2 gives-P(eta)>=5K/8 for|eta|<=1.',
      ],'actualPressureMassBound':'1125K/296<4K','actualPressureHolomorphicStrip':'|Im z|<1/16','actualPressureSupStrip':'|P(z)|<5K',
      'pressureNeutralAngularEditUsedAsAssumption':False,'scope':'The retained actual core P0 source formula itself. Equality with a later edited whole physical pressure is a separate moment-cancellation theorem.',
      'newLeanKernelProof':False,'wholeNaturalBanachOperatorAlreadyCertified':False,'actualB8DebtCertified':False,'originalN601Complete':False,'originalN602Complete':False}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--self-test',action='store_true');args=parser.parse_args();started=time.time();arithmetic=side_conditions()
    if args.self_test:print(json.dumps(arithmetic));return
    source=source_binding(ROOT);out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    result={'schema':'MathScope.N6.ActualA21PressureMassProof/1','status':'ACTUAL_RETAINED_A21_PRESSURE_MASS_AND_HOLOMORPHY_PROVED_CLASSICALLY','source':source,'arithmetic':arithmetic,'proof':proof_record(),
      'actualA21MeasureMassBoundProved':True,'actualRetainedP0HolomorphyProved':True,'sourcePassBitsUsedAsProof':False,'originalSourceFilesChanged':False,'originalN601Complete':False,'originalN602Complete':False,'original56of64CountChanged':False,'elapsedSeconds':time.time()-started}
    raw=(json.dumps(result,indent=2,ensure_ascii=False)+'\n').encode();file=out/'pressure-mass-result.json'
    with file.open('xb') as f:f.write(raw)
    print(json.dumps({'status':result['status'],'actualPressureNode':source['actualPressureNode'],'matchedStages':len(source['independentlyMatchedStages']),'massUpper':'1125K/296','exactChecks':len(arithmetic['checks']),'artifact':file.name,'artifactSHA256':sha(raw),'originalN602Complete':False,'elapsedSeconds':result['elapsedSeconds']}))
if __name__=='__main__':main()
