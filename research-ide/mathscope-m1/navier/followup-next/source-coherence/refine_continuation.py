#!/usr/bin/env python3
"""Choose the final activation widths after C, with exact logarithmic factors.

Every arithmetic comparison is rational. Analytic implications are separated in
CONTINUATION_REFINEMENT.md; they are not represented as generated Lean proofs.
"""
from fractions import Fraction as F
from pathlib import Path
import json,hashlib,math,sys
sys.set_int_max_str_digits(0)
ROOT=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ceil(x):return -(-x.numerator//x.denominator)
def rec(x):
    x=F(x)
    try:v=float(x)
    except OverflowError:v=None
    return {'exact':str(x),'approximate':v if v is not None and math.isfinite(v) and (v or not x) else None}
def main():
    ap=ROOT/'source-axis-cone-refined.json';dp=ROOT/'uniform-source-debt-cone-refined.json'
    axis=json.loads(ap.read_text());base=json.loads(dp.read_text());p=base['singleSourceProfile'];est=base['estimates']
    h=F(p['h']);j=F(p['j0']);lam=F(p['Lambda']);sigma=F(p['sigmaStar']);delta=F(axis['selectedParameters']['deltaStar']);Lmin=1-2*h;D=F(1,2)-h;A=F(1,2)+h
    c=F(axis['bounds']['uniformPhiPositiveLower']['exact']);R=F(axis['bounds']['selfMapDisplacementUpper']['exact']);q=F(159,200);r=F(41,10)
    M=F(axis['tails']['solutionNormUpper']);rho=F(axis['selectedParameters']['coefficientRadius']);radius=F(axis['complexInput']['cauchyRadius']);zeta=F(axis['complexInput']['complexSuprema']['normalizedGradient'])
    def der(k,m):return M*math.factorial(k+m)/(20**k*rho**m*(m+1)**2*q**(k+m+1))
    b00,b10,b01,b11,b02,b12,b03,b13=(der(k,m) for k,m in [(0,0),(1,0),(0,1),(1,1),(0,2),(1,2),(0,3),(1,3)])
    ey=R/(20*q*q);ee=R/(4*rho*q*q);phiMax=1+R/q
    oldt=F(p['t1']);oldk=F(p['kappa0']);oldw=F(p['axialWidth']);oldw2=F(p['shearWidth']);T=F(est['logRadialLengthUpper']['exact'])
    slope=F(est['logFSlopBound']['exact']);slope1=F(est['logFSlopEtaBound']['exact']);slope2=F(est['logFSlopEta2Bound']['exact'])
    slope3=r*(b13/c+3*b12*b01/c**2+3*b11*b02/c**2+6*b11*b01*b01/c**3+b10*b03/c**2+6*b10*b01*b02/c**3+6*b10*b01**3/c**4)
    J1=F(est['referenceLogFEtaBound']['exact']);J2=F(est['referenceLogFEta2Bound']['exact'])
    J3=2*lam*zeta/radius**2+b03/c+3*b01*b02/c**2+2*b01**3/c**3+1
    U3=b03/lam+1
    ratio=F(est['referenceFRatioBound']['exact']);ratio1=F(est['referenceFRatioEtaBound']['exact']);ratio2=ratio*(2*(b02/c+(b01/c)**2+1)+4*(b01/c+1)**2)
    Sq=F(est['SqBound']['exact']);Sq1=(21*(1+slope)+11*slope1+F(1,5)+16*J1+6*J2)
    W2=25+U3;Sq2=W2*(1+slope)+42*slope1+11*slope2+22*h+31*J1+32*J2+6*J3
    invL1=4*h/Lmin**2;invL2=4*h/Lmin**2+32*h*h/Lmin**3
    p1=F(est['p1Bound']['exact']);p1eta=F(est['p1EtaBound']['exact'])
    p1eta2=55*((ratio2*Sq+2*ratio1*Sq1+ratio*Sq2)/Lmin+2*(ratio1*Sq+ratio*Sq1)*invL1+ratio*Sq*invL2)
    pressure=F(axis['sourcePressureCertificate']['totalMassUpper']);P1=F(axis['sourcePressureCertificate']['realBounds']['Pprime']['upper'])+220*J1
    P2=28*pressure+220*J2+440*J1**2
    pc=axis['sourcePressureCertificate']['complexBounds'];pr=F(axis['sourcePressureCertificate']['coefficientNorm']['cauchyRadius'])
    P3=6*F(pc['pressureAbsUpper'])/pr**3+110*(2*J3+12*J1*J2+8*J1**3)
    Sn=F(est['SnBound']['exact']);Sn1=F(est['SnEtaBound']['exact'])
    Sn2=W2*r*b10/lam+42*r*b11/lam+11*r*b12/lam+A*(1+4*25+4*5+8*25)+31*5+32+6*U3+2*P1+4*P2+P3+4*A*(2*P1+P2)+880*J1+440*J2+880*J1**2
    ns=F(est['nsBound']['exact']);ns1=F(est['nsEtaBound']['exact']);ns2=Sn2/Lmin+2*Sn1*invL1+Sn*invL2
    v=55*ns;v1=55*ns1;v2=55*ns2
    logC=F(p['logC']);phase=lam*zeta;L=logC+phase
    # p1>=2*c/Lambda and E_ref^2>=(8/Lambda)*c^2*exp(-2L).
    vmaxA=F(ceil(p1+(110*ns)**2*lam**2/(16*c**3)+1))
    finite=[lam/c,lam/4,1/Lmin,pressure,P1,P2,P3,J1,J2,J3,p1,p1eta,p1eta2,ns,ns1,ns2,v,v1,v2,T,slope,slope1,slope2,slope3,U3,b03/lam,r*b13/lam]
    B0=F(10**6*(1+sum(ceil(abs(x)) for x in finite))**4)
    # Do not expand B0^20 into an unwieldy decimal denominator. The exact
    # scaled exponential is a product of rational factors with integer powers.
    def scaled(upper):return {'kind':'POSITIVE_SCALED_EXPONENTIAL','coefficientNumeratorExact':str(upper),'denominatorFactors':[{'baseExact':'100000000','power':1},{'baseExact':str(B0),'power':20},{'baseExact':str(1+vmaxA),'power':1}],'exponentExact':str(-24*L),'strictlyPositive':True,'upperEnvelopeExact':str(upper)}
    chosen={'t1':scaled(oldt),'kappa0':scaled(oldk),'axialWidth':scaled(oldw),'shearWidth':scaled(oldw2)}
    collarDen=ceil(2*L)+(ceil(1+vmaxA)).bit_length()+20
    collarFraction=F(1,collarDen)
    analyticEtaRadius=min(rho/8,c*rho*(1-r/20-F(1,8))**2/(4*M))
    # A finite rational bound for the exponentially smaller selected widths.
    # The rational denominator only improves this upper bound.
    bits=max(4096,4*(ceil(lam)).bit_length()+2*(ceil(v+v1+v2+J3+slope3+1)).bit_length()+512)
    tiny=F(1,2**bits);tbar=oldt*tiny;kbar=oldk*tiny;wbar=oldw*tiny;wbar2=oldw2*tiny
    uref=b00/lam+2*tbar*r*b10/lam;uref1=b01/lam+2*tbar*r*b11/lam
    uactual=b00/lam+(tbar+kbar*T)*v;uactual1=b01/lam+(tbar+kbar*T)*v1;uactual2=b02/lam+(tbar+kbar*T)*v2
    du=max(uref,uactual);du1=max(uref1,uactual1);dw=du+du1;Wmax=4+dw
    gradientExtra=max(2*tbar*slope1,(tbar+kbar*T)*p1eta/2+wbar2*kbar*p1eta)
    # |H*|<=5, |H*'|<=9, sqrt(H*^2+sigma^2)<=6.
    chiCost=Wmax*r/(4*c)+r*9/(2*c)
    rootCost=lam*du/sigma+6*ee/c
    constCost=dw+Wmax*r*ey/c+11*h+du*(r*9/(2*sigma)+ee)/c+6*gradientExtra
    young=5*rootCost**2/(lam*Lmin)
    sourceLower=3-8*h-j-constCost-young
    refQmin=c/2;refPmin=2*c/lam
    # The Sn comparison preserves its sign in the low-chi region.
    pTiny=F(1,2**bits)
    snError=5*r*b10/lam+22*uref+5*uref1+(880*J1+2200)*pTiny
    endpointError=R/q+4*ey
    endpointAngular=2+2*(F(18,100)-endpointError)/phiMax
    lowRegionTarget=660*lam**2*p1/delta**2
    lowRegionBits=(ceil(lowRegionTarget)).bit_length()+1
    finalGradientConst=du*(r*9/(2*sigma)+ee)/c+6*gradientExtra+young
    finalSlopeSource=F(3,5)*(3-8*h-j-dw)-11*h-finalGradientConst
    shapeSource=F(11,20)*(3-8*h-j-dw)-11*h-finalGradientConst-j*j/(2*D)-2*du
    # The all-eta C2 bound uses the newly selected widths. All pre-separation
    # second derivatives can be made tiny without changing the already fixed C.
    shapeBits=max(base['smallAmplitude']['binaryExponent'],(ceil(F(p['Tsh'])+121)).bit_length()+(ceil(1+J1**2+J2)).bit_length()+256)
    shapeTiny=F(1,2**shapeBits);eps=F(1,2**128)
    early2=(F(p['Tsh'])+121)*shapeTiny**2*(1+100*J1**2+100*J2)+3*shapeTiny*(1+100*J1**2+100*J2)
    globalControl=T*(p1+p1eta+v+v1)+2*(slope+slope1+r*b10/lam+r*b11/lam)+10
    checks={
      'fixedPointErrorBelowDeltaOver100':R<=delta/100,
      'lowChiNsEndpointError':2*ey<delta/2,
      'positivePhaseBudget':L>0 and logC>phase,
      'scaledExponentDominatesDyadicBound':24*L>=bits,
      'pressureExponentDominatesDyadicBound':2*(logC-phase)>=bits,
      'widthsAreBelowOriginalC1Envelopes':all(x>0 for x in [oldt,oldk,oldw,oldw2]) and B0>=1 and vmaxA>=1,
      'referenceThirdDerivativesFiniteControlled':2*tbar*slope3<1 and 2*tbar*r*b13/lam<1,
      'actualGiSecondDerivativeSmall':uactual2<j,
      'uniformLogEtaDerivativesSmall':(tbar+kbar*T)*p1eta2/2+wbar2*kbar*p1eta2<1,
      'realReferenceBoundsFit':sigma<1 and j<1/1000 and 0<h<1/1000 and 4+j+du<5 and 4+du1<5 and phiMax<2,
      'chiCostAbsorbed':chiCost<lam*Lmin/100,
      'sourceSqMargin':sourceLower>F(12,5),
      'referenceQsPositive':refQmin>0,
      'highChiAngularEndpoint':endpointAngular>F(23,10),
      'lowChiReferenceSource':snError<delta/2,
      'lowChiAxialEndpointAmplified':2*(logC-phase)>=lowRegionBits,
      'activationPcAndQuadraticComparison':(oldt+oldk)/100000<F(1,100) and oldt/100000<F(1,100),
      'globalReferenceComparisonControl':globalControl<B0,
      'referenceRatiosBelowGamma':110*ns*lam/c<B0 and p1<B0 and 3*lam/c<B0,
      'smallShearVmax':oldk/F(100000000)<F(1,100),
      'reservedInnerCollarBeforeStepMidpoint':collarFraction<F(1,2),
      'reservedInnerCollarExponentialMargin':collarDen**2-4>2*L+(ceil(1+vmaxA)).bit_length()+10,
      'commonNonzeroAnalyticEtaTube':0<analyticEtaRadius<=rho/8,
      'finalTwoTransitionsFitBefore110':oldw+oldw2<F(1,11),
      'finalConstantSlopeSourceAboveOne':finalSlopeSource>1,
      'shapeTransitionSourceAboveOne':shapeSource>1,
      'shapeLengthUsesUniformStepDerivative':F(p['Tsh'])>=180*(F(est['ell_iBound']['exact'])+1),
      'newShapeAmplitudeBound':logC-F(p['Tsh'])/10-F(est['ell_iBound']['exact'])>=shapeBits,
      'newShapeSeparationBound':F(p['Tsh'])-10*logC-140<=-10*shapeBits,
      'earlySecondDerivativeDebtSmall':early2<eps,
    }
    # These are the reduced sufficient inequalities. K=1000*Gamma^16,
    # Gamma=B0*exp(L), and Vmax<=A*exp(2L). Their logarithmic exponents
    # cancel against the chosen widths and leave the displayed rational tests.
    values={'phiLower':c,'phiUpper':phiMax,'errorY':ey,'errorEta':ee,'axisReferenceUDifference':uref,'axisReferenceUEtaDifference':uref1,'actualUDifference':uactual,'actualUEtaDifference':uactual1,'actualUEta2Difference':uactual2,'WError':dw,'gradientChange':gradientExtra,'chiCost':chiCost,'sqrtChiCost':rootCost,'constantCost':constCost,'YoungRemainder':young,'sourceSqConstantLower':sourceLower,'referenceQsLower':refQmin,'referenceP1Lower':refPmin,'SnReferenceError':snError,'angularEndpointLower':endpointAngular,'finalConstantSlopeSqLower':finalSlopeSource,'shapeTransitionSqLower':shapeSource,'p1Eta2Upper':p1eta2,'nsEta2Upper':ns2,'referenceLogFEta3Upper':J3,'VmaxRationalFactor':vmaxA,'GammaRationalFactor':B0,'logAmplitudeBudget':L,'earlyEta2DebtUpper':early2}
    cert={'schema':'MathScope.Navier.ContinuationRefinement/1','status':'EXACT_SCALAR_CHAIN_PASSED' if all(checks.values()) else 'FAILED','sourceFiles':{'axis':{'file':ap.name,'sha256':sha(ap)},'debtEnvelope':{'file':dp.name,'sha256':sha(dp)}},'etaDomain':['-1','1'],
      'chosenAfterFinalC':chosen,'finiteBounds':{k:rec(vv) for k,vv in values.items()},'dyadicWidthUpper':{'bits':bits,'factor':str(tiny)},'secondDerivativeAmplitudeBits':shapeBits,
      'reservedInnerCollar':{'activationFraction':str(collarFraction),'logarithmicWidth':scaled(oldt*collarFraction),'uniformLowerBoundVs':'9/4','commonNonzeroAnalyticEtaRadius':str(analyticEtaRadius),'edgeVectorNormLower':{'kind':'POSITIVE_SCALED_EXPONENTIAL','coefficientNumeratorExact':str(2*c*c/lam),'denominatorFactors':[],'exponentExact':str(-L),'strictlyPositive':True},'stressFactorization':'T0=e_a B0, B0(0,eta)=F(X0,eta)*p_s,reference(X0,eta); the scalar flatness and smooth division follow the original B.30/A.9 argument applied to these exact positive widths.','fullExteriorStressEndpoint':False},
      'comparisonConstants':{'Gamma':'B0*exp(logC+Lambda*zetaSup)','K':'1000*Gamma^16','Vmax':'A*exp(2*(logC+Lambda*zetaSup))','reducedGlobalComparison':'K*(t1+kappa0+axialWidth+shearWidth) <= (old_t1+old_kappa0+old_axialWidth+old_shearWidth)/100000; exponent and rational factors only improve this bound.','activationQuadraticComparison':'t1*K*(1+Vmax) <= old_t1/100000.','basis':'Explicit term-by-term bounds of B.26--B.29 and the rational moment formulas, documented separately.'},
      'checks':checks,'allExactScalarChecksPassed':all(checks.values()),'derivationFile':'CONTINUATION_REFINEMENT.md','gates':{'sourceAndReferenceSqBoundCalculated':checks['sourceSqMargin'],'allEtaReferenceVrMarginCalculated':checks['highChiAngularEndpoint'] and checks['lowChiReferenceSource'] and checks['lowChiAxialEndpointAmplified'],'CDependentPositiveWidthsSelected':True,'previousC1DebtBoundsMonotone':True,'C2GiBoundCalculated':checks['actualGiSecondDerivativeSmall'],'entireOuterProfileCone':False,'allAnalyticInequalitiesKernelChecked':False,'wholeProfileCertified':False},
      'proofBoundary':'The exact scalar chain and explicit selected widths are executed. The analytic comparison lemma and source/recurrence identification are documented mathematical arguments, not newly kernel-checked Lean proofs. Outer A.4/A.7, the complete C.12 modulated field and exterior stress endpoint are separate.'}
    cp=ROOT/'continuation-refinement.json';cp.write_text(json.dumps(cert,indent=2)+'\n')
    assert all(checks.values()),[k for k,vv in checks.items() if not vv]
    final=json.loads(json.dumps(base));final['schema']='MathScope.Navier.SourceUniformDebtBound/2';final['status']='ANALYTIC_BOUND_CHAIN_PASSED'
    final['sourceFiles']['continuationRefinement']={'file':cp.name,'sha256':sha(cp)}
    final['singleSourceProfile'].update(chosen)
    final['singleSourceProfile']['originalWidthEnvelopes']={k:p[k] for k in chosen}
    final['singleSourceProfile']['widthChoice']='The exact positive scaled exponentials selected after the final C in continuation-refinement.json. Bounds inherited from the larger rational envelopes are monotone.'
    final['singleSourceProfile']['reservedInnerCollar']=cert['reservedInnerCollar']
    final['smallAmplitude']['secondDerivativeBinaryExponent']=shapeBits;final['smallAmplitude']['secondDerivativeUpper']=str(shapeTiny)
    final['smallAmplitude']['earlyEta2DebtUpper']=str(early2)
    final['estimates']['p1Eta2Bound']=rec(p1eta2);final['estimates']['nsEta2Bound']=rec(ns2);final['estimates']['UEta2DeviationFromFourUpper']=rec(j)
    D0=2*j;D1=j;D2=j;Klow=F(est['minimumK']['exact'])
    e7=base['uniformDebt']['UAbsoluteUpper'][0]['exact'];e7=F(e7)*Klow/D0
    # Positive exp(-56/5) majorant already in the first-derivative second row.
    e112=(F(base['uniformDebt']['UAbsoluteUpper'][1]['exact'])-eps)*Klow/D0/F(15,16)
    du2=[(D2+2*D1+2*D0)/Klow*e7,(D2+2*D1+2*D0)/Klow*F(15,16)*e112+eps]
    de2=[eps,2*((D1+D0)**2+D0*(D2+2*D1+2*D0))/Klow**2*e7+eps,eps]
    final['uniformDebt']['UEta2AbsoluteUpper']=list(map(rec,du2));final['uniformDebt']['EEta2AbsoluteUpper']=list(map(rec,de2))
    final['gates']['CDependentWidthsSelectedAfterC']=True;final['gates']['allEtaC2DebtBoundCalculated']=True
    final['proofBoundary']+=' The final positive widths are smaller than the original rational envelopes, so the same C0/C1 debt estimates hold for this final datum. The displayed C2 bounds use the additional derivative estimates and amplitude check in continuation-refinement.json.'
    fp=ROOT/'uniform-source-debt-final.json';fp.write_text(json.dumps(final,indent=2)+'\n')
    print(json.dumps({'status':cert['status'],'checks':checks,'sourceSq':float(sourceLower),'finalSlopeSq':float(finalSlopeSource),'shapeSq':float(shapeSource),'B0digits':len(str(B0)),'widthDyadicBits':bits,'finalSourceSHA256':sha(fp)},indent=2))
if __name__=='__main__':main()
