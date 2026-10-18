#!/usr/bin/env python3
"""New actual-source collar bound application; never runs the source producer.

The result is a coarse exact numeric-expression enclosure, not a finite-term
Picard evaluation. It applies the retained full-collar theorem to two ordinary
radial jets and two literal averages at authenticated source callers.
"""
from __future__ import annotations
from collections import Counter
from fractions import Fraction as F
from functools import lru_cache
from hashlib import sha256
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parents[1]
HEADER = ROOT/'recovered/base/analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json'
CLOSURE = ROOT/'work/prune_recovery/scalar/evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json'
PROOFS = ROOT/'recovered/base/analysis/base/PR30-recovery-handoff/angular-proof/inputs'
MAJORANT = PROOFS/'ACTUAL_PICARD_ORIGINAL_NUMERIC_MAJORANT.json'
AVERAGE = PROOFS/'ACTUAL_PICARD_AVERAGE_COLLAR.json'
PRIOR = ROOT/'work/prune_recovery/native/evidence/EXISTING_PROOF_APPLICATION.json'
CROSSWALK = ROOT/'work/prune_recovery/ORIGINAL_138_CROSSWALK.json'
SOURCE = ROOT/'recovered/base/work/n602_continuation/source/research-ide/mathscope-m2/navier'

def canonical(obj, sort=True):
    return json.dumps(obj,sort_keys=sort,separators=(',',':'),ensure_ascii=False).encode()

def pin(path):
    raw=path.read_bytes()
    return {'path':str(path.relative_to(ROOT)),'sha256':sha256(raw).hexdigest(),'bytes':len(raw)}

def require(condition, text):
    if not condition: raise ValueError(text)

def write(name,obj):
    (OUT/'evidence'/name).write_text(json.dumps(obj,indent=2,ensure_ascii=False)+'\n')

def mul(x,y):
    c,a=x;d,b=y;p=Counter(dict(a))
    p.update(dict(b))
    return c*d,tuple(sorted((k,v) for k,v in p.items() if v))

def power(x,n):
    c,a=x
    return c**n,tuple((k,v*n) for k,v in a if v*n)

def main():
    inputs=[HEADER,CLOSURE,MAJORANT,AVERAGE,PRIOR,CROSSWALK,
            SOURCE/'actual-background-majorant.mjs',SOURCE/'actual-continuation-exact-functions.mjs']
    pins=[pin(p) for p in inputs]
    require(pins[0]['sha256']=='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1','header pin')
    require(pins[1]['sha256']=='2cbb5c74eb58ef82f948a19bad00a299c38b802cb8e668e94da8e34a37f77e91','closure pin')
    require(pins[2]['sha256']=='36026f7c3804d54f779d214ead8ea434db32b3fc5cb468465d174748eda5a74b','retained theorem pin')
    header=json.loads(HEADER.read_text());closed=json.loads(CLOSURE.read_text())
    nodes=closed['records'];major=json.loads(MAJORANT.read_text())
    average=json.loads(AVERAGE.read_text());prior=json.loads(PRIOR.read_text())
    cross=json.loads(CROSSWALK.read_text());reg={}
    def unpack(d):
        for k,v in d.items():
            if k=='base':unpack(v)
            elif isinstance(v,str):
                try:reg[k]=json.loads(v)
                except json.JSONDecodeError:pass
    unpack(header['definitions'])
    system=reg['picard'][0]
    require(sha256(canonical(system,False)).hexdigest()==major['originalPicardSHA256']==average['actualPicardSHA256'],'actual system identity')
    require(major['actualSourceAndAnalyticInputsComposed'] and major['numericC1KCertifiedTailBoundsProvedHere'],'retained all-order actual theorem')
    require(closed['source_header_sha256']==pins[0]['sha256'],'raw closure header')
    require(all(prior['picard']['sameActualParameterExpressions'].values()),'prior actual parameter binding')
    params=reg['fixed']['source']['parametersExactExpressions']
    for k,v in major['actualParameterASTConstraints'].items():require(params[k]==v,'parameter mismatch '+k)
    cone=major['originalConstantCone']
    for k,v in cone.items():
        if k in nodes:require(nodes[k]==v,'raw scalar changed '+k)
    require(all(prior['picard']['sameOriginalTailRoots'].values()),'original tail binding')
    require(all(x['matchesOriginalProof'] for x in prior['picard']['sameOriginalConstantNodeComparisons']),'constant source proof attachment')

    expected={
      0:('rational',['0','1']),1:('rational',['1','1']),2:('coordinate',['eta']),
      4756:('coordinate',['X']),29329:('coordinate',['actual_n1_axis_average$200']),
      29330:('multiply',[4756,29329]),
      29331:('actual_background_even_profile',[0,1,29330,2,0,0]),
      29342:('actual_background_even_profile',[0,1,29330,2,0,1]),
      29332:('definite_integral',[29331,29329,0,1]),
      29343:('definite_integral',[29342,29329,0,1]),
      29336:('smooth_piecewise',[4756,28819,29328,29332,29335,0]),
      29436:('smooth_piecewise',[4756,28819,29328,29343,29435,0]),
      72018:('actual_background_even_profile',[0,0,4756,2,1,0]),
      72257:('actual_background_even_profile',[0,1,4756,2,1,0]),
      72026:('smooth_piecewise',[4756,28819,28823,72018,72025,0]),
      72261:('smooth_piecewise',[4756,28819,28823,72257,72260,0]),
      28814:('multiply',[3617,28813]),28813:('exp',[28812]),
      28812:('multiply',[3612,28811]),28811:('rational',['1','128']),
      28819:('multiply',[3617,28818]),28818:('exp',[28817]),
      28817:('multiply',[3612,28816]),28816:('rational',['1','64'])}
    for k,(op,args) in expected.items():require(nodes[str(k)]=={'op':op,'args':args},'actual caller record '+str(k))
    require(system['diagonal']==[0,0,2,0,3,1],'singular diagonal')
    require(system['zeroAxisDatum']==[0]*6,'zero-axis datum')
    require(system['A0'][0]==[0,0,0,0,1,0] and system['A0'][1]==[0,0,0,0,0,1],'F/U derivative rows')
    require(system['A1'][0]==system['A1'][1]==[0]*6 and system['forcing'][:2]==[0,0],'first rows no extra terms')
    require(system['solutionNorm']['commonCollar']==24848 and system['radialDomain']==[0,24806],'common collar norm/domain')
    ledger=major['exactRationalLedger']
    for k,upper in [('A0row4OverBDelta',512),('A0row5OverBDelta',512),('A1row4OverBDelta',512),('A1row5OverBDelta',512),('forcingOverB2DeltaSquared',65536)]:
        require(F(ledger[k])<=upper,'original source coefficient bound '+k)
    source_majorant=(SOURCE/'actual-background-majorant.mjs').read_text()
    require('All A0/A1 row sums <=512B/delta' in source_majorant,'coefficient norm interpretation')
    require('||f1||_infty<=65536B^2/delta^2' in source_majorant,'forcing norm interpretation')
    require(512<262144 and 65536<262144,'C1 bounds each coefficient operator and forcing, since B/delta>1')

    # Decode the actual source monomials; E means the unchanged exp(t1/16).
    @lru_cache(None)
    def monomial(i):
        n=cone[str(i)];a=n['args'];op=n['op']
        if op=='rational':return F(int(a[0]),int(a[1])),()
        if op=='source_parameter':
            if a[0]=='Lambda':return F(1),(('Q',64),)
            if a[0]=='Xa':return F(4),(('Q',-64),)
            return F(1),((a[0],1),)
        if op=='multiply':
            v=(F(1),())
            for j in a:v=mul(v,monomial(j))
            return v
        if op=='inverse':return power(monomial(a[0]),-1)
        if op=='integer_power':return power(monomial(a[0]),a[1])
        if op=='exp':
            require(monomial(a[0])==(F(1,16),(('t1',1),)),'unexpected exponential')
            return F(1),(('E',1),)
        raise ValueError('unsupported monomial '+op)
    require(monomial(24818)==(F(2**62),(('Q',264),('rho',-2),('t1',-2))),'actual C1 normalized')
    require(monomial(24801)==(F(1,1024),(('Q',-1),('rho',1))),'actual delta normalized')
    require(monomial(24847)==(F(9*2**138),(('E',1),('Q',465),('rho',-5),('t1',-4))),'actual log M normalized')

    # All arithmetic below is exact integer/rational arithmetic. The proof
    # documents the analytic inequalities connecting these comparisons.
    compression_checks={
      'logQ_over_T':260+22+64020 < 2**16,
      'logRhoInverse_over_T':16+22+64016 < 2**16,
      'fourMillion_below_2pow22':4000000<2**22,
      'logC_remainder_absorbed':3010<2**(260*199),
      'logS_remainder_absorbed':617<2**(260*199),
      'prefactor_remainder_absorbed':342<2**(260*199),
      'logPrefactor_below_S':481<9*2**138,
      'loglogH_coefficient':962<2**10,
      'top_exponent_coefficient':10+200*2**16<2**24,
      'top_integer':1048576+25==1048601,
      'rhs_coefficient':1+1+16==18,
      'F_integral_weight':F(1,2)*F(1,4)==F(1,8),
      'U_integral_weight':F(1,2)*F(1,2)==F(1,4),
      'radial_shared_factor':F(18,4)<5,
      'closed_collar_before_Xkeep':F(3,256)<F(1,64),
      'collar_before_aSquared':F(1,64)<F(1,16),
      'strict_actual_activation':F(1,256)>0,
      'Xminus_inside_collar':F(1,256)<F(1,128)<F(3,256),
      'cauchy_disc_inside_tube':F(1,16)<F(1,8)}
    require(all(compression_checks.values()),'exact compression or domain arithmetic')
    bound={'exp':{'exp':{'exp':{'exp':{'integer':1048601}}}}}
    caller_domain={
      'freeX':{'lower':'Xa*exp(t1/256)','upper':'Xa*exp(3*t1/256)','closed':True},
      'eta':['-1','1'],
      'containsActualSourceXminusNode':28814,
      'allXStrictlyBeyondActualNaturalCore':True,
      'sourceXkeepNode':28819,'sourceCommonASquaredNode':24805,
      'exactSourceParameterInequalities':['Q>2^260','0<rho<1','0<t1<1','delta=rho/(1024Q) in (0,1)','B/delta>1'],
      'proof':'Positive t1 and rational exponent comparisons give Xa<left<=X<=right<Xkeep<aSquared. Every t in [0,1] has 0<=tX<=aSquared.'}
    cases=[(29336,29332,29331,'value','M',True),
           (29436,29343,29342,'eta-order-1','16*M/delta',True),
           (72026,72018,72018,'ordinary-X-order-1-F','18*C1*M/(8*delta)',False),
           (72261,72257,72257,'ordinary-X-order-1-U','18*C1*M/(4*delta)',False)]
    original_ids={r['sourceNodeId'] for r in cross['rows']}
    apps=[]
    for caller,selected,native,kind,expression,integral in cases:
        apps.append({'sourceCaller':caller,'selectedSourceNode':selected,'nativeSourceNode':native,
          'nativeIsOriginal138':native in original_ids,'kind':kind,'callerDomain':caller_domain,
          'exactSourceUpper':expression,'M_sourceNormRoot':24848,'C1_sourceRoot':24818,'delta_sourceRoot':24801,
          'numericEnclosure':{'lower':{'negate':bound},'upper':bound},
          'numericEnclosureEncoding':'finite positive real expression with only integer1048601 and four exponentials',
          'literalIntegralDomainVerified':integral,'sourceCallerDomainProved':True,
          'ordinaryRadialRecurrenceApplied':kind.startswith('ordinary'),
          'radialHolomorphyUsed':False,'pointValueOrRequestedPrecisionComputed':False,
          'wholeNativeKernelNumericallyCompleted':False,'N706orN805Closed':False})
    write('ACTUAL_COLLAR_BOUND_APPLICATION.json',{
      'schema':'MathScope.ActualPicardOrdinaryCollarBoundApplication/1',
      'implementationKind':'NEW source-proof application, not recovered lost implementation bytes',
      'inputs':pins,'originalParameterASTSHA256':reg['fixed']['source']['parameterExpressionSHA256'],
      'originalPicardDefinitionSHA256':major['originalPicardSHA256'],
      'retainedAllOrderProofReused':True,'sourceCallerApplications':apps,
      'exactChecks':compression_checks,
      'normalizedActualConstants':{'C1':'2^62*Q^264/(rho^2*t1^2)',
        'delta':'rho/(1024*Q)','logM':'9*2^138*Q^465*exp(t1/16)/(rho^5*t1^4)'},
      'observedNativeCount':4,'original138TouchedNativeCount':sum(a['nativeIsOriginal138'] for a in apps),
      'wholeOriginal138NewlyCompleted':0,
      'notClaimed':['high-precision Picard values','second radial jets','pressure radial jet','global sourcecaller domain coverage','whole-K/four-axis norm closure','N706 closure','N805 closure'],
      'nextExactFrontier':[
        {'nodes':[72136,72310],'need':'Ordinary second X jets of F/U require bounding the differentiated RHS integral (coefficient xi derivatives and resulting W derivatives) or an interval differential-equation evaluator over the original full collar.'},
        {'nodes':[87492],'need':'First X derivative of Pi requires source-specific coefficient/forcing parity factorization in A0[3][0]=node25602 and forcing[3]=node26395, or a bounded ordinary xi-derivative recurrence.'},
        {'need':'Turning these coarse enclosures into narrow values requires validated quadrature/ODE/accelerated Picard evaluation with explicit arithmetic error and tail; the literal K budget is not an impossibility result.'} ]})
    write('ACTUAL_CALLER_RECORDS.json',{'source':pins[1], 'records':{str(k):nodes[str(k)] for k in expected},
      'actualSystemRows':{k:system[k] for k in ['diagonal','A0','A1','forcing','zeroAxisDatum','radialDomain','solutionNorm']}})
    print(json.dumps({'actualCallerApplications':len(apps),'ordinaryFullCollarRadialJetApplications':2,
      'literalAverageApplications':2,'constantUpper':'exp(exp(exp(exp(1048601))))',
      'sourceDomainProved':True,'allExactChecks':True,'wholeNativeClosures':0,'N706Closed':False,'N805Closed':False}))

if __name__=='__main__':main()
