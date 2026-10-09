#!/usr/bin/env python3
"""Propagate the same source C1 discrepancy through B.35 on the joining rectangle.

All radial-prefix moment errors are bounded by positive full-support integrals.
This is an analytic function-defined profile bound. It does not identify the
old finite arrays, certify the preceding B.34/activation intervals, or perform
C.12 on the completed source profile.
"""
import argparse
import hashlib
import json
from fractions import Fraction as F
from pathlib import Path

from dyadic_interval import I,exp_negative,power
from verify_uniform_certificate import q,box

HERE=Path(__file__).resolve().parent
BOUND_SCALE=1<<240


def up(x):
    x=F(x)
    return F(-((-x.numerator*BOUND_SCALE)//x.denominator),BOUND_SCALE)


def down(x):
    x=F(x)
    return F((x.numerator*BOUND_SCALE)//x.denominator,BOUND_SCALE)


def rec(x):
    x=F(x)
    return {'numerator':str(x.numerator),'denominator':str(x.denominator),'approximate':float(x)}


def absupper(value):
    a,b=box(value)
    return max(abs(a),abs(b))


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--source',type=Path,default=HERE.parent/'source-coherence/uniform-source-debt-small-j.json')
    ap.add_argument('--binding',type=Path,default=HERE/'source-bound-moment-inclusion.json')
    ap.add_argument('--output',type=Path,default=HERE/'source-joining-rectangle-certificate.json')
    args=ap.parse_args()
    sp,mp,bp=args.source,HERE/'uniform-moment-certificate.json',args.binding
    source=json.loads(sp.read_text());binding=json.loads(bp.read_text());cert=json.loads(mp.read_text())['results'][0]
    assert binding['sourceSHA256']==hashlib.sha256(sp.read_bytes()).hexdigest()
    assert binding['uniformMapSHA256']==hashlib.sha256(mp.read_bytes()).hexdigest()
    assert binding['scope']['wholeEtaC0SmallRootEnclosure'] and binding['scope']['uniformSourceEtaDerivativeBoundsSupplied']
    radii=[q(binding['exactBounds']['uRadius'])]*2+[q(binding['exactBounds']['eRadius'])]*3
    derivatives=[q(binding['etaDerivativeBounds']['uEtaUpper'])]*2+[q(binding['etaDerivativeBounds']['eEtaUpper'])]*3
    base=[q(v) for v in source['uniformDebt']['UAbsoluteUpper']+source['uniformDebt']['EAbsoluteUpper']]
    base1=[q(v) for v in source['uniformDebt']['UEtaAbsoluteUpper']+source['uniformDebt']['EEtaAbsoluteUpper']]
    g=[];g1=[]
    for i in range(5):
        g.append(up(base[i]+sum(absupper(cert['linearMap'][i][j])*radii[j]+absupper(cert['quadraticDiagonal'][i][j])*radii[j]**2 for j in range(5))))
        g1.append(up(base1[i]+sum(absupper(cert['linearMap'][i][j])*derivatives[j]+2*absupper(cert['quadraticDiagonal'][i][j])*radii[j]*derivatives[j] for j in range(5))))
    ideal=binding['idealReferenceBounds']['bounds'];P=q(ideal['PStarUpper']);emin=q(ideal['emin']);qmin=q(ideal['Qmin']);nmax=q(ideal['Nmax'])
    h=F(source['singleSourceProfile']['h']);D=F(1,2)-h;A=F(1,2)+h
    assert 0<h<F(1,100) and P>0 and emin>0 and qmin>0
    m=up(P*g[0]);ii=up(P*g[2]);jj=up(4*P*g[2]+P*P*g[1]);ss=up(8*P*g[0]+P*P*g[3]);cp=up(P*P*g[4])
    m1=up(P*(g[0]+g1[0]));ii1=up(P*(g[2]+g1[2]));jj1=up(P*(8*g[2]+4*g1[2])+P*P*(2*g[1]+g1[1]));ss1=up(P*(16*g[0]+8*g1[0])+P*P*(2*g[3]+g1[3]));cp1=up(P*P*(2*g[4]+g1[4]))
    bmax=q(cert['radialBounds']['bumpSupremum']);xmin=exp_negative(I(8)).lower()
    ru,re=radii[0],radii[2];u1,e1=derivatives[0],derivatives[2]
    Eerr=up(P*re*bmax);Eerr1=up(P*(re+e1)*bmax)
    DU=q(source['estimates']['UDeviationFrom4EtaUpper']);D1=q(source['estimates']['UEtaDeviationFromFourUpper'])
    Uerr=up(max(DU,P*ru*bmax));Uerr1=up(max(D1,P*(ru+u1)*bmax))
    actual_emin=down(emin-Eerr)
    Werr=up((2*D*m+m1)/xmin)
    Berr=up((1-h)*ii+D*ii1+jj1+2*(D-h)*jj)
    qmax=F(63,16)+F(3,4)*h
    denom=down(xmin*power(I(2*xmin),F(1,2)).lower()*actual_emin)
    Qerr=up(Werr+Berr/denom+(qmax+3)*Eerr/actual_emin)
    Nerr=up(4*Werr+(3+Werr)*Uerr+(D*(m+m1)+4*h*ss+ss1)/xmin+4*A*cp+cp1)
    actual_qmin=down(qmin-Qerr)
    n_ratio=up((nmax+Nerr)/(actual_emin*actual_qmin)) if actual_qmin>0 else None
    w_safe=up(1+n_ratio) if n_ratio is not None else None
    da=q(binding['exactBounds']['absoluteAngularShearDeviation'])
    bs_restore=2*DU*bmax/emin
    bs=up(max(q(binding['exactBounds']['absoluteAxialShearBound']),bs_restore))
    alo=down(F(4,5)-da);ahi=up(F(4,5)+da)
    vupper=up(ahi+bs*bs/alo)
    Gmin=down(actual_qmin-bs*(nmax+Nerr)/(alo*actual_emin))
    logC=F(source['singleSourceProfile']['logC'])
    # log XR=log110+10(logC+14)>10. Use only exp(10) as a finite lower
    # bound: the enormously larger real XR is never rounded to Infinity.
    xr_lower=exp_negative(I(10)).reciprocal().lower()
    pc_lower=down(xr_lower*xmin*Gmin)
    checks={
        'SameSourceAndMapHashes':True,'EPositiveOnWholeRectangle':actual_emin>0,
        'QPositiveOnWholeRectangle':actual_qmin>0,'QWithinB36HalfMargin':Qerr<=qmin/2,
        'AngularShearWithinOneTenth':da<=F(1,10),'AxialShearMeetsComputedRatioTolerance':w_safe is not None and bs<=F(1,10)/(1+w_safe),
        'aPositiveOnWholeRectangle':alo>0,'vBelowOneOnWholeRectangle':vupper<1,
        'GAtLeastSixSeventhsQ':Gmin>=F(6,7)*actual_qmin,
        'FiniteLowerRadialScaleValid':logC>=1,'PcGreaterThanTwoThroughoutRectangle':pc_lower>2,
    }
    output={'schema':'MathScope.SourceJoiningRectangle/1','status':'ANALYTIC_WHOLE_JOINING_RECTANGLE_RELAXED_CONE' if all(checks.values()) else 'FAILED',
            'sourceSHA256':hashlib.sha256(sp.read_bytes()).hexdigest(),'momentBindingSHA256':hashlib.sha256(bp.read_bytes()).hexdigest(),'uniformMapSHA256':hashlib.sha256(mp.read_bytes()).hexdigest(),
            'domain':{'logx':['-8','-5'],'eta':['-1','1']},
            'boundArithmetic':'Exact Fraction algebra with directed 240-bit dyadic rounding after each positive upper bound and each positive lower bound; all encoded inequalities use these outward bounds.',
            'positivePrefixIntegration':{'method':'Every fixed-sign linear/quadratic partial bump integral is bounded by its full-support absolute integral; disjoint supports remove all mixed products.',
                                         'normalizedPrefixMomentErrors':list(map(rec,g)),'normalizedPrefixMomentEtaErrors':list(map(rec,g1))},
            'absoluteMomentErrors':{k:rec(v) for k,v in {'M':m,'I':ii,'J':jj,'S':ss,'Cp':cp,'Meta':m1,'Ieta':ii1,'Jeta':jj1,'Seta':ss1,'Cpeta':cp1}.items()},
            'bounds':{k:rec(v) for k,v in {'EError':Eerr,'EEtaError':Eerr1,'UError':Uerr,'UEtaError':Uerr1,'WError':Werr,'QsError':Qerr,'NsError':Nerr,'EPositiveLower':actual_emin,'QsPositiveLower':actual_qmin,'angularShearError':da,'axialShearUpper':bs,'aLower':alo,'aUpper':ahi,'vUpper':vupper,'GPositiveLower':Gmin,'PcLower':pc_lower,'safeNsOverEQBound':w_safe}.items()},
            'checks':checks,'allScalarChecksPassed':all(checks.values()),
            'scope':{'wholeJoiningRectangleAndAllEta':all(checks.values()),'continuousCorrectionMapRoot':True,'prefixMomentsIncluded':True,'strictRelaxedConeOnRectangle':all(checks.values()),
                     'precedingB34IntervalCertified':False,'activationAndInnerCollarCertified':False,'sameCompleteOuterFieldPressureCertified':False,
                     'C12AppliedToSameProfile':False,'admissibleConeVsGreaterThanTwo':False,'newLeanAnalyticPremiseProof':False,
                     'oldFiniteArraysCertified':False,'originalN305Promoted':False,'originalN306Promoted':False},
            'proofBoundary':'An exact arithmetic propagation of the supplied source-specific analytic C1 bound chain. Its continuous B.8 map is independently enclosed. The source-axis functional definitions and generated analytic estimates are not newly Lean-checked; remaining radial regions and C.12 are explicitly outside this rectangle certificate.'}
    args.output.write_text(json.dumps(output,indent=2)+'\n')
    print(json.dumps({'status':output['status'],'bounds':{k:v['approximate'] for k,v in output['bounds'].items()},'checks':checks},indent=2))
    assert all(checks.values())


if __name__=='__main__':main()
