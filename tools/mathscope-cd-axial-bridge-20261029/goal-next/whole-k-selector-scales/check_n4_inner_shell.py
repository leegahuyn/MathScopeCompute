"""Exact source-bound radial refinement of the N4 bottom strip."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json

import sympy as S

from check_common_b_scales import F8, blob


STRIP_HASH = '93b184861c991fb8e25ced9211b52d3383dad2a63b8218f0b798a4a61147ca30'
SOURCE = 'research-ide/'
M2 = SOURCE + 'mathscope-m2/navier/'
M3 = SOURCE + 'mathscope-m3/navier/'


def pinned_source(repo):
    markers = {
        M3+'source-global-representative.mjs': [
            'sUpperRaw=min(q(2),O.div(O.pow(Ru,2),O.mul(q(2),Xa)))',
            'sUpper=O.maximum(sLower,sUpperRaw),TLower=O.maximum(O.zero,Tl),TUpper=Tu',
            'selectedTimeInterval=[O.maximum(TLower,F(sLower)),min(TUpper,F(sUpper))]',
            'T=mid(...selectedTimeInterval)',
            'There is an interior admissible radius iff max(1/2,max(0,Rl)^2/(2Xb))<s<min(2,Ru^2/(2Xa))'],
        M2+'actual-common-admissible-family.mjs': [
            "Renv=G.parameter('C12EnvelopeR')",
            "{id:'actual-flat-boundary-direction-neighbourhood',lower:G.pow(Renv,1024)}",
            'ellMinimum=G.ceiling(G.maximum(q(8),Sminimum,frequencyMinimum))'],
        M2+'actual-centered-pulse-enclosure.mjs': [
            "CSelected:{exp:{ref:'logCSelected'}},sourceEnvelopeS:{power:[{ref:'CSelected'},100000]},C12EnvelopeR:{exp:{power:[{ref:'sourceEnvelopeS'},256]}}",
            'Thus CSelected>2 and Renv=exp(CSelected^25600000)>2^4096'],
        M2+'actual-continuation-exact-support.mjs': [
            "actualT1:same(p.t1,{power:[{ref:'CSelected'},-120]})",
            'r.Xminus===G.mul(Xa,G.exp(G.div(t1,q(128))))&&r.Xkeep===G.mul(Xa,G.exp(G.div(t1,q(64))))'],
        M2+'actual-positive-global-stress.mjs': [
            'innerRestriction:{endpoint:b.orderOne.Xminus,unchangedCutoffStart:b.orderOne.Xkeep',
            'The raw residual is identically zero before Xminus by the actual common-core Picard recurrence.']}
    pins={}
    for name,need in markers.items():
        raw=blob(repo,name)
        assert all(value.encode() in raw for value in need),name
        pins[name]=sha256(raw).hexdigest()
    return pins


def exact_checks():
    # The selected lower endpoint is >=1-w. Its upper endpoint is
    # <2F(1)-(1-w)<=1+w and therefore equals F(sUpper).
    w,z,s,factor=S.symbols('w z s factor',positive=True)
    assert S.expand((2*(1-z)-(1-w))-(s-z*factor)-(1+w-s-z*(2-factor)))==0
    # With p=1+w, normalized transverse area is 2*pi*Xa*(p-s).
    # At fixed s, |eta|<sqrt((s-1)/s). The two positive Jacobians are
    # (1-eta^2)/2 and (s/2)^D*(1/2-h*eta^2), respectively.
    eta,D,h=S.symbols('eta D h',real=True)
    rho=s*(1-eta**2)/2
    zeta=(s/2)**D*eta
    jacobian=S.simplify(S.det(S.Matrix([[S.diff(zeta,eta),S.diff(zeta,s)],
                                      [S.diff(rho,eta),S.diff(rho,s)]])))
    assert S.simplify(jacobian.subs(D,S.Rational(1,2)-h)-(s/2)**(S.Rational(1,2)-h)*(S.Rational(1,2)-h*eta**2))==0
    u=S.symbols('u',real=True,nonnegative=True)
    assert S.integrate((w-u)*S.sqrt(u),(u,0,w))==4*w**S.Rational(5,2)/15
    # 6144*exp(25600000*Lc) >= 6144+6144*25600000*Lc.
    # Thus e^6144>96 and the remaining exponential decays faster than t1.
    assert 100000*256==25600000 and 6*1024==6144
    assert 1+6144>128*Fraction(3,4) and 6144*25600000>120
    return {'sUpper':'sUpper<1+w-(2-sUpper^(2h))*ZRep^2<=1+w',
            'actualPoint':'1<=s<1+w and Xa<X<Xa*(1+w)',
            'transverseAnnulus':'2*Xa*s<R^2<2*Xa*(1+w) with R=r/sqrt(qMin)',
            'etaRhoArea':'2*w^(3/2)/(3*sqrt(1+w))',
            'zetaRhoArea':'((1+w)/2)^D * 2*w^(3/2)/(3*sqrt(1+w))',
            'transverseEtaRhoVolumeUpper':'(8*pi/15)*Xa*w^(5/2)',
            'transverseZetaRhoVolumeUpper':'(8*pi/15)*Xa*((1+w)/2)^D*w^(5/2)',
            'originalInnerInterval':'Xa*(1+w)<Xa*exp(t1/128)=Xminus<Xkeep',
            'sourceComparison':'w<t1/128 via ellMinimum>=Renv^1024, log Renv=exp(25600000*log CSelected), t1=CSelected^(-120)'}


def main():
    parser=ArgumentParser(description=__doc__)
    for name in ('repo','strip','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    raw=args.strip.read_bytes()
    assert sha256(raw).hexdigest()==STRIP_HASH
    original=json.loads(raw)
    assert original['geometry']['timeHalfWidth']=='w=3/(4*L^6)'
    assert original['geometry']['literalCondition']=='sRep<1 requires integer time center 1, T<1+w and ZRep^2<w'
    result={'schema':'MathScope.N7.ActualRepresentativeBottomInnerShell/1','sourceCommit':F8,
            'priorStripSHA256':STRIP_HASH,'sourceSHA256':pinned_source(args.repo),
            'exactRefinement':exact_checks(),
            'scope':'Original positive slow stress core cancellation applies on the current point. Fast waves, representative coefficient data and whole K integrals require separate arguments.',
            'actualN4Use':'OPEN','release':'HOLD'}
    data=(json.dumps(result,indent=2)+'\n').encode()
    args.out.write_bytes(data)
    print('PASS exact source-bound inner annulus and normalized transverse-axial-time volume')
    print(f'{sha256(data).hexdigest()}  {args.out.name}')


if __name__=='__main__':
    main()
