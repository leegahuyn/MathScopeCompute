#!/usr/bin/env python3
"""Quantitative C.12 slow bounds on the same full joining rectangle.

The original source moments are used. Modulation moment errors are recorded
only as increments generated on this rectangle, with no invented incoming
datum. A global frequency still needs the other radial panels and their loop.
"""
import hashlib
import json
import math
from decimal import Decimal, localcontext
from fractions import Fraction as F
from pathlib import Path

from dyadic_interval import I,exp_negative,power
from verify_uniform_certificate import box

HERE=Path(__file__).resolve().parent
SCALE=1<<320


def q(v):
    if 'numerator' in v:
        r=F(int(v['numerator']),int(v['denominator']))
        assert 'exact' not in v or F(v['exact'])==r
        return r
    return F(v['exact'])


def up(x):
    x=F(x)
    return F(-((-x.numerator*SCALE)//x.denominator),SCALE)


def rec(v):
    v=F(v)
    with localcontext() as c:
        c.prec=18
        scientific=format(Decimal(v.numerator)/Decimal(v.denominator),'e')
    try:
        approx=float(v)
        if not math.isfinite(approx) or (v and approx==0):approx=None
    except OverflowError:approx=None
    return {'numerator':str(v.numerator),'denominator':str(v.denominator),
            'approximate':approx,'scientificDisplay':scientific}


def add(*vectors):
    return [up(sum(v[j] for v in vectors)) for j in range(3)]


def scale(v,c):
    return [up(x*c) for x in v]


def mul(a,b):
    return [up(sum(math.comb(j,k)*a[k]*b[j-k] for k in range(j+1))) for j in range(3)]


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    paths={
       'source':HERE.parent/'source-coherence/uniform-source-debt-final.json',
       'binding':HERE/'source-final-bound-moment-inclusion.json',
       'rectangle':HERE/'source-final-joining-rectangle-certificate.json',
       'loop':HERE/'source-final-joining-loop-certificate.json',
       'map':HERE/'uniform-moment-certificate.json',
       'smooth':HERE/'smooth-derivative-certificate.json'}
    docs={k:json.loads(p.read_text()) for k,p in paths.items()}
    s,b,r,l,c,sm=[docs[k] for k in ['source','binding','rectangle','loop','map','smooth']]
    c=c['results'][0]
    assert b['sourceSHA256']==r['sourceSHA256']==l['sourceSHA256']==sha(paths['source'])
    assert r['momentBindingSHA256']==l['bindingSHA256']==sha(paths['binding'])
    assert l['rectangleSHA256']==sha(paths['rectangle'])
    assert b['scope']['uniformSourceEtaSecondDerivativeBoundsSupplied']
    assert not c['geometry']['unitMass']
    axis_path=paths['source'].parent/s['sourceFiles']['axisCertificate']['file']
    axis=json.loads(axis_path.read_text())
    assert sha(axis_path)==s['sourceFiles']['axisCertificate']['sha256']
    xmin=exp_negative(I(8)).lower();xmax=exp_negative(I(5)).upper()
    h=F(s['singleSourceProfile']['h']);D=F(1,2)-h;A=F(1,2)+h;Lmin=1-2*h
    P=q(b['idealReferenceBounds']['bounds']['PStarUpper'])
    rb=r['bounds'];Emin=q(rb['EPositiveLower']);amin=q(rb['aLower'])
    bs=q(rb['axialShearUpper']);Qmax=up(F(63,16)+F(3,4)*h+q(rb['QsError']))
    Nmax=up(q(b['idealReferenceBounds']['bounds']['Nmax'])+q(rb['NsError']))
    Wmax=up(3+q(rb['WError']))
    coeff=[
       [q(b['exactBounds']['uRadius'])]*2+[q(b['exactBounds']['eRadius'])]*3,
       [q(b['etaDerivativeBounds']['uEtaUpper'])]*2+[q(b['etaDerivativeBounds']['eEtaUpper'])]*3,
       [q(b['etaSecondDerivativeBounds']['uEta2Upper'])]*2+[q(b['etaSecondDerivativeBounds']['eEta2Upper'])]*3]
    base=[[q(v) for v in s['uniformDebt'][u]+s['uniformDebt'][e]] for u,e in [
       ('UAbsoluteUpper','EAbsoluteUpper'),('UEtaAbsoluteUpper','EEtaAbsoluteUpper'),
       ('UEta2AbsoluteUpper','EEta2AbsoluteUpper')]]
    absbox=lambda v:max(map(abs,box(v)))
    g=[]
    for row in range(5):
        gj=[]
        for order in range(3):
            v=base[order][row]
            for j in range(5):
                v+=absbox(c['linearMap'][row][j])*coeff[order][j]
                v+=absbox(c['quadraticDiagonal'][row][j])*sum(
                       math.comb(order,k)*coeff[k][j]*coeff[order-k][j] for k in range(order+1))
            gj.append(up(v))
        g.append(gj)
    K=[P,P,2*P];cc=[F(4),F(4),F(0)];KK=mul(K,K)
    err={'M':mul(K,g[0]),'I':mul(K,g[2]),
         'J':add(mul(mul(cc,K),g[2]),mul(KK,g[1])),
         'S':add(scale(mul(mul(cc,K),g[0]),2),mul(KK,g[3])),
         'Cp':mul(KK,g[4])}
    xpow=lambda z:power(I(xmin,xmax),F(z)).upper()
    # 5*sqrt(2)/8 < 1; reference coefficients are enlarged outward.
    Iref=scale(K,xpow(F(8,5)))
    ref={'M':scale(cc,xmax),'I':Iref,'J':mul(cc,Iref),
         'S':add(scale(mul(cc,cc),xmax),scale(KK,F(5,12)*xpow(F(6,5)))),
         'Cp':scale(KK,F(5,2)*xpow(F(1,5)))}
    moments={k:add(ref[k],err[k]) for k in ref}
    pressure=axis['sourcePressureCertificate'];P0=F(pressure['totalMassUpper'])
    P01=F(pressure['realBounds']['Pprime']['upper'])
    # |d_eta^2(1+eta^2)^(-2theta)|<=28, theta in [0,1].
    Pi=add([P0,P01,28*P0],moments['Cp'])
    sig=[q(sm['bounds']['sigma'+str(j)]) for j in range(1,4)]
    support=[[q(x) for x in z] for z in c['geometry']['supports']]
    # B.8 uses sigmaPrime(t), without a 1/width normalization.
    b0=sig[0]
    bY=max(right/(right-left)*sig[1] for left,right in support)
    bYY=max(right/(right-left)*sig[1]+right*right/(right-left)**2*sig[2] for left,right in support)
    eu=[coeff[j][2] for j in range(3)];uu=[coeff[j][0] for j in range(3)]
    E=add(scale(K,xpow(F(1,10))),scale(mul(K,eu),b0))
    du=[q(s['estimates'][k]) for k in ['UDeviationFrom4EtaUpper',
          'UEtaDeviationFromFourUpper','UEta2DeviationFromFourUpper']]
    patchU=scale(mul(K,uu),b0)
    U=[up(cc[j]+max(du[j],patchU[j])) for j in range(3)]
    eD=up(F(1,10)*P*xpow(F(1,10))+P*eu[0]*bY)
    eDD=up(F(1,100)*P*xpow(F(1,10))+P*eu[0]*bYY)
    eDeta=up(F(1,10)*P*xpow(F(1,10))+P*(eu[0]+eu[1])*bY)
    uD=up(max(du[0]*sig[0],P*uu[0]*bY))
    uDD=up(max(du[0]*sig[1],P*uu[0]*bYY))
    uDeta=up(max(du[1]*sig[0],P*(uu[0]+uu[1])*bY))
    aeta=up(2*(eDeta/Emin+eD*E[1]/Emin**2))
    aY=up(2*(eDD/Emin+(eD/Emin)**2))
    beta=up(2*(uDeta/Emin+uD*E[1]/Emin**2))
    bYfield=up(2*(uDD/Emin+uD*eD/Emin**2))
    M,Iv,J,S=[moments[k] for k in ['M','I','J','S']]
    Weta=up((2*D*M[0]+(2-2*D)*M[1]+M[2])/xmin)
    WY=up(1+Wmax+2*D*U[0]+U[1])
    denom=xmin*power(I(2*xmin),F(1,2)).lower()*Emin
    BQeta=up((1-h+D)*Iv[1]+D*Iv[2]+2*J[1]+J[2]+2*abs(h-D)*(J[0]+J[1]))
    Qeta=up(Weta+BQeta/denom+(Qmax+Wmax)*E[1]/Emin)
    Hmax=power(I(2*xmax),F(1,2)).upper()*E[0]
    Heta=power(I(2*xmax),F(1,2)).upper()*E[1]
    BQY=up((1-h)*xmax*Hmax+D*xmax*Heta+
                xmax*(U[1]*Hmax+U[0]*Heta)+2*abs(h-D)*xmax*U[0]*Hmax)
    QY=up(WY+BQY/denom+(Qmax+Wmax)*(F(3,2)+eD/Emin))
    Neta=up(Weta*U[0]+Wmax*U[1]+(D*M[2]+4*h*S[0]+(4*h+2)*S[1]+S[2])/xmin+
               4*A*Pi[0]+(4*A+2)*Pi[1]+Pi[2])
    NY=up(WY*U[0]+Wmax*uD+D*(U[0]+U[1])+4*h*(U[0]**2+E[0]**2/2)+
          2*U[0]*U[1]+E[0]*E[1]+Nmax+Wmax*U[0]+4*A*Pi[0]+Pi[1]+2*A*E[0]**2+E[0]*E[1])
    p1eta=up(xmax*(Qeta/Lmin+Qmax*4*h/Lmin**2))
    p1Y=up(xmax*(Qmax+QY)/Lmin)
    p2eta=up(xmax*(Neta/(Lmin*Emin)+Nmax*4*h/(Lmin**2*Emin)+Nmax*E[1]/(Lmin*Emin**2)))
    p2Y=up(xmax*((Nmax+NY)/(Lmin*Emin)+Nmax*eD/(Lmin*Emin**2)))
    lp={k:q(v) for k,v in l['parameters'].items()};dbar=lp['d0OverXR'];mu=lp['muMaxTimesXR'];Z=lp['absMuP2Upper']
    sqrtZ=F(math.isqrt((1+Z).numerator//(1+Z).denominator)+1)
    T=lp['absTUpper'];V=lp['v'];amax=lp['aUpper']
    tMu=up(24*dbar*sqrtZ);tP=up(30*dbar*mu*mu*sqrtZ)
    muLower=1/(24*dbar*sqrtZ)
    invMuCoefficient=up(1/(dbar*dbar*muLower))
    vp=up(2*(T+lp['absTsUpper'])*tP)
    tTheta=up(12*dbar*mu*sqrtZ)
    slow={}
    for name,ad,bd,pd,ed in [('eta',aeta,beta,p2eta,E[1]/Emin),('logx',aY,bYfield,p2Y,eD/Emin)]:
        tsd=up(bd/amin+bs*ad/amin**2)
        vsd=up(ad+2*bs*bd/amin+bs*bs*ad/amin**2)
        targetd=up(vsd/amin+3*ad/amin**2)
        mud=up((targetd+vp*pd)*invMuCoefficient)
        td=up(tsd+tMu*mud+tP*pd)
        phid=up(ad/amin+amax*T*td)
        thetad=up(24*phid/amin)
        fixedTd=up(td+tTheta*thetad)
        Ad=up((3*fixedTd+ad)/2)
        Bd=up(ed+(3*fixedTd+bd)/2)
        slow[name]={'muDerivativeCoefficient':mud,'tAtFixedThetaCoefficient':td,
                    'inversePhaseDerivativeCoefficient':thetad,'tAtFixedPhaseCoefficient':fixedTd,
                    'ADerivativeCoefficient':Ad,'BDerivativeOverECoefficient':Bd}
    exponent=8*Z
    Aeta=slow['eta']['ADerivativeCoefficient'];Beta=slow['eta']['BDerivativeOverECoefficient']
    AY=slow['logx']['ADerivativeCoefficient'];BY=slow['logx']['BDerivativeOverECoefficient']
    errors={'E':[4*E[0],4*E[1]+2*E[0]*Aeta], 'U':[E[0],E[0]*Beta]}
    def product_error(f,g,df,dg):
        return [up(f[0]*dg[0]+g[0]*df[0]+df[0]*dg[0]),
                up(f[1]*dg[0]+f[0]*dg[1]+g[1]*df[0]+g[0]*df[1]+df[1]*dg[0]+df[0]*dg[1])]
    EU=product_error(E,U,errors['E'],errors['U'])
    UU=product_error(U,U,errors['U'],errors['U'])
    EE=product_error(E,E,errors['E'],errors['E'])
    weight=power(I(2*xmax),F(1,2)).upper()
    inc={
        'M':[up(xmax*x) for x in errors['U']],
        'I':[up(xmax*weight*x) for x in errors['E']],
        'J':[up(xmax*weight*x) for x in EU],
        'S':[up(xmax*(UU[j]+EE[j]/2)) for j in range(2)],
        'Cp':[up(F(3,2)*x) for x in EE]}
    checks={
        'sameSourceAndCompleteRootBinding':True,
        'exactSourceSecondDerivativesSupplied':True,
        'sourceLambdaAndLogCPositive':F(s['singleSourceProfile']['Lambda'])>0 and F(s['singleSourceProfile']['logC'])>0,
        'allUsedDenominatorsPositive':xmin>0 and Emin>0 and amin>0 and Lmin>0,
        'loopVarianceTargetAtLeastOne':lp['v']-q(rb['vUpper'])>=lp['aUpper'],
        'muLowerFitsUniformBracket':muLower<mu,
        'phaseDerivativeInverseBound':V<3 and amin>0,
        'sigmaDerivativeEvidenceBound':sha(HERE/'dyadic_interval.py')==sm['arithmeticSHA256'],
        'allComputedCoefficientsFiniteAndPositive':all(x>0 for vv in slow.values() for x in vv.values()),
        'originalLoopDomainRetained':l['domain']=={'logx':['-8','-5'],'eta':['-1','1'],'phase':'R/Z'},
    }
    output={
      'schema':'MathScope.JoiningSlowBounds/1',
      'status':'EXACT_JOINING_SLOW_DERIVATIVE_BOUNDS' if all(checks.values()) else 'FAILED',
      'inputs':{k:{'file':str(p.relative_to(HERE.parent)),'sha256':sha(p)} for k,p in paths.items()},
      'domain':l['domain'],'arithmetic':'Positive exact Fraction estimates, rounded upward to 320-bit dyadics after each bound.',
      'normalizedPrefixMomentEta2Errors':[rec(z[2]) for z in g],
      'absoluteMomentsEtaThroughTwo':{k:list(map(rec,v)) for k,v in moments.items()},
      'absolutePressureEtaThroughTwo':list(map(rec,Pi)),
      'fieldDerivativeBounds':{k:rec(v) for k,v in {
          'E':E[0],'Eeta':E[1],'Eeta2':E[2],'EDlogx':eD,'EDlogx2':eDD,'EDlogxEta':eDeta,
          'U':U[0],'Ueta':U[1],'Ueta2':U[2],'UDlogx':uD,'UDlogx2':uDD,'UDlogxEta':uDeta,
          'aeta':aeta,'aDlogx':aY,'beta':beta,'bDlogx':bYfield,
          'Qeta':Qeta,'QDlogx':QY,'Neta':Neta,'NDlogx':NY,
          'p1EtaOverXR':p1eta,'p1DlogxOverXR':p1Y,'p2EtaOverXR':p2eta,'p2DlogxOverXR':p2Y}.items()},
      'loopDerivativeCommonExponential':rec(exponent),
      'loopSlowDerivativeBounds':{k:{j:rec(v) for j,v in row.items()} for k,row in slow.items()},
      'interpretation':'Every loop slow derivative is bounded by its recorded coefficient times exp(loopDerivativeCommonExponential). No astronomical exponential is expanded or set to infinity.',
      'C12ErrorFactor':'epsilonN=exp(loopDerivativeCommonExponential)/N, for integer N>=max(4,exp(loopDerivativeCommonExponential)).',
      'C12FieldErrorCoefficients':{k:list(map(rec,v)) for k,v in errors.items()},
      'C12ShearErrorCoefficients':{'a':rec(2*AY),'b':rec(6+4*BY)},
      'C12MomentIncrementErrorCoefficients':{k:list(map(rec,v)) for k,v in inc.items()},
      'incrementMeaning':'The coefficients bound only Delta m(x)-Delta m(exp(-8)) generated within this rectangle, for eta orders zero and one. No incoming modulation moment is set to zero or supplied arbitrarily.',
      'checks':checks,'allScalarChecksPassed':all(checks.values()),
      'scope':{'sameSourceC2ImplicitRootAndPrefixBounds':True,'wholeJoiningRectangleSlowBounds':all(checks.values()),
              'wholeOriginalIntervalSlowBounds':False,'incomingC12MomentDiscrepancyCertified':False,
              'globalFiniteNSelected':False,'actualC2SourcePatchRestored':False,
              'sourceWideC12ConeCertified':False,'originalN305Promoted':False,'originalN306Promoted':False},
      'derivation':'JOINING_SLOW_BOUNDS.md'}
    (HERE/'source-final-joining-slow-bounds.json').write_text(json.dumps(output,indent=2)+'\n')
    assert all(checks.values())
    print(json.dumps({'status':output['status'],'checks':checks,
            'loopExponent':output['loopDerivativeCommonExponential']['scientificDisplay'],
            'AetaCoefficient':rec(Aeta)['scientificDisplay'],'ADlogxCoefficient':rec(AY)['scientificDisplay'],
            'p2EtaOverXR':rec(p2eta)['scientificDisplay']},indent=2))


if __name__=='__main__':main()
