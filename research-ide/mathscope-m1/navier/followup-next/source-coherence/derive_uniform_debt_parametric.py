#!/usr/bin/env python3
"""Parameterized copy of derive_uniform_debt.py (the baseline file is preserved).

Exact source-dependent C0 bounds for one analytic B.22/B.26/B.34 profile.

This is not a numerical certificate for the old Float64 continuation arrays.
The analytic input bundle retains its explicit Lean verification boundary.
"""
from fractions import Fraction as F
from pathlib import Path
import json,hashlib,math,argparse,sys
sys.set_int_max_str_digits(0)

SCRIPT_ROOT=Path(__file__).resolve().parent
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def ceil(x): return -(-x.numerator//x.denominator)
def record(x):
    x=F(x)
    try:
        v=float(x)
        representable=math.isfinite(v) and (not x or v!=0)
    except OverflowError:
        v=None;representable=False
    return {'exact':str(x),'numerator':str(x.numerator),'denominator':str(x.denominator),'approximate':v if representable else None,'displayRepresentable':representable}
def exp_lower(x,N=160):
    x=F(x);t=F(1);s=t
    for k in range(1,N+1):t*=x/k;s+=t
    return s
def weighted(R,v):return [sum(abs(F(int(x['numerator']),int(x['denominator'])))*y for x,y in zip(row,v)) for row in R]
def main():
    parser=argparse.ArgumentParser(description='Source-parametric exact C0/C1 debt bounds; never a global profile certificate.')
    parser.add_argument('--directory',required=True,type=Path)
    parser.add_argument('--source',default='source-axis-cone-refined.json')
    parser.add_argument('--output',default='uniform-source-debt-cone-refined.json')
    args=parser.parse_args()
    ROOT=args.directory.resolve()
    if not ROOT.is_dir(): raise ValueError('The variant directory must already exist')
    sp=ROOT/args.source;mp=SCRIPT_ROOT.parent/'uniform-gluing/uniform-moment-certificate.json' 
    s=json.loads(sp.read_text());m=json.loads(mp.read_text())['results'][0]
    assert s['status']=='VERIFIED_LOCAL_BOUND_CERTIFICATE' and m['passed']
    p=s['selectedParameters'];h=F(p['h']);j=F(p['j0']);lam=F(p['Lambda']);rho=F(p['coefficientRadius'])
    # Read the exact source value, including exact binary64 inputs, instead of
    # inserting the baseline logP=14. The positive Taylor sum is a rigorous
    # lower bound for every nonnegative logP in the source producer's range.
    logP=F(s['sourcePressureCertificate']['parametersExact']['logP'])
    assert 0<=logP<=100, 'logP is outside the frozen source producer range' 
    M=F(s['tails']['solutionNormUpper']);phi_min=F(s['bounds']['uniformPhiPositiveLower']['exact']);r=F(41,10);Lmin=1-2*h;q=1-r/20
    def der(k,z): return M*math.factorial(k+z)/(20**k*rho**z*(z+1)**2*q**(k+z+1))
    b00,b10,b01,b11=der(0,0),der(1,0),der(0,1),der(1,1)
    b02,b12=der(0,2),der(1,2)
    zeta=F(s['complexInput']['complexSuprema']['normalizedGradient']);phase=F(s['bounds']['phaseRealPartUpper'])
    slope=r*b10/phi_min
    slope_eta=r*(b11/phi_min+b10*b01/phi_min**2)
    slope_eta2=r*(b12/phi_min+2*b11*b01/phi_min**2+b10*b02/phi_min**2+2*b10*b01**2/phi_min**3)
    # Baseline reference data, uniform in eta and the later choice of C.
    logeta=lam*zeta+b01/phi_min+1
    logeta2=lam*zeta/F(s['complexInput']['cauchyRadius'])+b02/phi_min+(b01/phi_min)**2+1
    ratio=3*b00/phi_min
    ratio_eta=ratio*(2*b01/phi_min+2)
    pressure=F(s['sourcePressureCertificate']['totalMassUpper'])
    pressure_eta=F(s['sourcePressureCertificate']['realBounds']['Pprime']['upper'])
    Sq=11*(1+slope)+F(11,100)+6*logeta
    Qs=ratio*Sq/2
    p1=110*Qs/Lmin
    Sq_eta=21*(1+slope)+11*slope_eta+F(1,5)+16*logeta+6*logeta2
    p1_eta=55*((ratio_eta*Sq+ratio*Sq_eta)/Lmin+ratio*Sq*4*h/Lmin**2)
    udot=r*b10/lam
    Sn=11*udot+60+pressure_eta+220*logeta+3*(pressure+110)+220
    ns=Sn/Lmin
    v=55*ns
    pressure_ref=pressure+110;pressure_ref_eta=pressure_eta+220*logeta
    pressure_ref_eta2=28*pressure+220*logeta2+440*logeta**2
    Sn_eta=21*udot+11*r*b11/lam+300+2*pressure_ref_eta+pressure_ref_eta2+3*(pressure_ref+pressure_ref_eta)+220+440*logeta
    ns_eta=Sn_eta/Lmin+Sn*4*h/Lmin**2
    v_eta=55*ns_eta
    log_length=F((ceil(110*lam/4)).bit_length()+1)
    t1=min(F(1,10000),1/(100*(slope+slope_eta+slope_eta2+1)),1/(100*(p1+p1_eta+1)),j/(100*(v+v_eta+1)))
    kap=min(F(1,100),1/(100*log_length*(p1+p1_eta+1)),j/(100*log_length*(v+v_eta+1)))
    # The last two changes occur after X=100 and before X=110.
    width=F(1,100)
    delta_u=b00/lam+(t1+kap*log_length)*v
    delta_u_eta_reference=b01/lam+2*t1*r*b11/lam
    delta_u_eta=b01/lam+(t1+kap*log_length)*v_eta
    delta_u_eta2_reference=b02/lam+2*t1*r*b12/lam
    delta_log_f=(t1+kap*log_length)*p1/2+F(1,20)
    ell=lam*phase+b00+1/phi_min+110+1
    Tsh=F(ceil(1000*(ell+1)))
    amplitude_bits=(ceil(Tsh+111)).bit_length()+(ceil(logeta+logeta2+1)).bit_length()+256
    logC=F(ceil(2*Tsh+2*ell+45*b00+amplitude_bits+2))
    tiny=F(1,2**amplitude_bits);eps=F(1,2**128)
    P_lower=exp_lower(logP);K_lower=P_lower/2;DU=2*j
    exp7upper=1/exp_lower(7);exp112upper=1/exp_lower(F(56,5))
    # Pre-separation errors use E<=tiny, F<=tiny/sqrt(220), and
    # x_sep<=tiny^10. Constants deliberately overestimate the primitive bounds.
    early_E_bound=((Tsh+111)*tiny**2+10*tiny**2)*(1+10*logeta+10*logeta2)
    early_I_bound=3*tiny*(1+10*logeta+10*logeta2)
    Erows=[early_I_bound,early_E_bound,early_E_bound]
    debtU=[DU/K_lower*exp7upper,DU/K_lower*F(15,16)*exp112upper+eps]
    debtE=[eps,(DU/K_lower)**2*exp7upper+eps,eps]
    D1=j
    debtU_eta=[(D1+DU)/K_lower*exp7upper,(D1+DU)/K_lower*F(15,16)*exp112upper+eps]
    debtE_eta=[eps,2*DU*(D1+DU)/K_lower**2*exp7upper+eps,eps]
    preU=weighted(m['exactPreconditionerU'],debtU);preE=weighted(m['exactPreconditionerE'],debtE)
    checks={
      'sameExactSourceH':str(h)==s['sourcePressureCertificate']['parameterHExact'],
      'localAxisAmplitudeCanBeDecreased':logC>=F(p['logC']),
      'baselineAxisDeviationSmall':b00/lam<j/100 and b01/lam<j/100,
      'referenceUAndEtaWithinFive':4+j+delta_u<5 and 4+delta_u_eta_reference<5 and delta_u_eta2_reference<1,
      'referenceLogChangesControlled':2*t1*slope<1 and 2*t1*slope_eta<1 and 2*t1*slope_eta2<1,
      'coreYWindow':4/(1-2*t1)<F(41,10),
      'referenceRadialWindow':2*t1<1 and 2*width<F(1,20),
      'logRadialLengthBound':2**int(log_length)>110*lam/4,
      'B26UniformUDeviation':delta_u<=j,
      'B26UniformUEtaDeviation':delta_u_eta<=D1,
      'B26UniformLogFChange':delta_log_f<1,
      'laterCChosenAfterTsh':logC>=Tsh+amplitude_bits,
      'coreESmall':logC-lam*phase-45*b00>=amplitude_bits,
      'B34ESmall':logC-Tsh/10-ell>=amplitude_bits,
      'xSepBeforeRestore':Tsh-10*logC-10*logP<=-10*amplitude_bits,
      'continuousEarlyDebtBelowEpsilon':all(x<eps for x in Erows),
      'uniformUPreconditionedDebt':max(preU)<F(1,25000),
      'uniformEPreconditionedDebt':max(preE)<F(1,1000000),
    }
    result={'schema':'MathScope.Navier.SourceUniformDebtBound/1','status':'ANALYTIC_BOUND_CHAIN_PASSED' if all(checks.values()) else 'FAILED','sourceFiles':{'axisCertificate':{'file':sp.name,'sha256':sha(sp)},'uniformMomentMap':{'file':str(mp.relative_to(SCRIPT_ROOT.parent)),'sha256':sha(mp)}},
      'singleSourceProfile':{'pressureFamily':'source-outer-A21','sourceParameters':s['inputModel']['pressure']['sourceParameters'],'h':str(h),'j0':str(j),'sigmaStar':p['sigmaStar'],'Lambda':p['Lambda'],'logC':str(logC),'Tsh':str(Tsh),'t1':str(t1),'kappa0':str(kap),'axialWidth':str(width),'shearWidth':str(width),'Xi':'110','logXR':f'log(110)+10*(logC+{logP})','axis':'The unique Appendix-B analytic fixed point selected by the source bound certificate, with amplitude decreased to the newly selected C.','reference':'Exact B.22 integral of the cutoff times the analytic log-F and U slopes.','continuation':'Exact B.26 integral of reference controls and the two terminal shear transitions.','gluing':'Exact B.34 field and Gi-to-4eta restoration, followed by the certified B.8 implicit root.','oldV54ArraysUsed':False},
      'estimates':{k:record(vv) for k,vv in {'solutionNorm':M,'phiLower':phi_min,'phi00':b00,'phi10':b10,'phi01':b01,'phi11':b11,'phi02':b02,'phi12':b12,'logFSlopBound':slope,'logFSlopEtaBound':slope_eta,'logFSlopEta2Bound':slope_eta2,'referenceLogFEtaBound':logeta,'referenceLogFEta2Bound':logeta2,'referenceFRatioBound':ratio,'referenceFRatioEtaBound':ratio_eta,'SqBound':Sq,'p1Bound':p1,'p1EtaBound':p1_eta,'SnBound':Sn,'SnEtaBound':Sn_eta,'nsBound':ns,'nsEtaBound':ns_eta,'B26USlopeBound':v,'B26USlopeEtaBound':v_eta,'logRadialLengthUpper':log_length,'UDeviationFromAxisDatum':delta_u,'UEtaDeviationFromFour':delta_u_eta,'UDeviationFrom4EtaUpper':DU,'UEtaDeviationFromFourUpper':D1,'logFChange':delta_log_f,'ell_iBound':ell,'minimumPStar':P_lower,'minimumK':K_lower,'epsilon':eps,'earlyPressureAndEnergyDebtUpper':early_E_bound}.items()},
      'smallAmplitude':{'binaryExponent':amplitude_bits,'upper':str(tiny),'positiveFunctionNotZero':True,'earlyAngularEtaDebtUpper':str(early_I_bound),'logProof':'e^(-B)<=2^(-B), because 1>log(2); no underflowed Float64 is used as a zero.'},
      'uniformDebt':{'etaDomain':['-1','1'],'UOrder':['M/K','(J-4eta*I)/K^2'],'EOrder':['I/K','(S-8eta*M)/K^2','Cp/K^2'],'UAbsoluteUpper':list(map(record,debtU)),'EAbsoluteUpper':list(map(record,debtE)),'UEtaAbsoluteUpper':list(map(record,debtU_eta)),'EEtaAbsoluteUpper':list(map(record,debtE_eta)),'preconditionedUUpper':list(map(record,preU)),'preconditionedEUpper':list(map(record,preE)),'preconditionedUEtaUpper':list(map(record,weighted(m['exactPreconditionerU'],debtU_eta))),'preconditionedEEtaUpper':list(map(record,weighted(m['exactPreconditionerE'],debtE_eta))),'allowedU':'1/25000','allowedE':'1/1000000'},
      'checks':checks,'allFiniteScalarChecksPassed':all(checks.values()),
      'analyticDerivationFile':'UNIFORM_SOURCE_DEBT.md',
      'gates':{'oneSourcePressureAxisContinuation':True,'allEtaC0DebtBoundCalculated':all(checks.values()),'uniformMomentMapDebtMembership':checks['uniformUPreconditionedDebt'] and checks['uniformEPreconditionedDebt'],'numericalContinuationArrayIdentified':False,'generatedAnalyticPremisesKernelChecked':False,'strictConeOnWholeProfileCertified':False,'originalGlobalParameterHierarchyComplete':False,'fullProfileCertified':False,'formalPass':False},
      'proofBoundary':'Finite arithmetic verifies the stated analytic estimate chain and its actual source-dependent constants. The calculus derivation is given in the companion document. The published axis-bound premise bundle, its decreased-amplitude instantiation, and the exact functional B.22/B.26 definitions have not been assembled into a new Lean proof. The result therefore does not certify old v54 arrays or close every N3-05/N3-06/global-profile gate.'}
    out=ROOT/args.output;out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'status':result['status'],'checks':checks,'preconditionedU':list(map(float,preU)),'preconditionedE':list(map(float,preE)),'sourceLogCdigits':len(str(logC)),'amplitudeBits':amplitude_bits},indent=2))
    assert all(checks.values()),'A source-dependent scalar gate failed'
if __name__=='__main__':main()
