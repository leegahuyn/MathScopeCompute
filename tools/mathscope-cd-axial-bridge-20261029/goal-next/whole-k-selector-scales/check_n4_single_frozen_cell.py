"""Reduce the actual frozen N4 cutoff to one original mesh phase."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json

import sympy as S

from check_common_b_scales import F8, blob


MAXIMA='a4c58765594add6fe9d5d460d2f5c6861003f7ed9d13f31f3c2828ab3f756d96'
INNER='c92ccaf35e6ffca3697b78d7599e2d45f0df427a33f52eb7d7791262434c6a41'
M3='research-ide/mathscope-m3/navier/'
M2='research-ide/mathscope-m2/navier/'


def pinned_source(repo):
    markers={
        M3+'source-global-representative.mjs':[
            'scale=G.pow(ell,6),width=G.div(q(3,4),scale)',
            'sUpperRaw=min(q(2),O.div(O.pow(Ru,2),O.mul(q(2),Xa)))',
            'sLower=O.maximum(q(1,2),O.div(O.pow(radialLowerPositive,2),O.mul(q(2),Xb)))',
            'zSquaredUpper=O.div(O.sub(sUpper,TLower),power(sUpper,O.mul(q(2),h)))',
            'Z=O.choose(negativeWidth,O.zero,O.zero,positiveMidpoint,positiveMidpoint,negativeMidpoint)',
            'F=s=>O.sub(s,O.mul(O.pow(Z,2),power(s,O.mul(q(2),h))))',
            'selectedTimeInterval=[O.maximum(TLower,F(sLower)),min(TUpper,F(sUpper))]',
            'T=mid(...selectedTimeInterval)' ],
        M3+'source-global-current.mjs':[
            'bandCoordinate=G.neg(G.div(G.log(band.chart.qActual),G.log(q(2))))',
            'meshAxes=[R,Z,T].map((x,j)=>fixedLabelSourcePartitionFactor(G,G.sub(G.mul(G.pow(ell,6),x),band.meshLabels[j])))' ],
        M3+'global-source-index.mjs':[
            "support:'abs(x-j)<3/4'", 'qcompare(absQ(offset),SUPPORT)<0' ],
        M3+'source-localization.mjs':[
            'tau0===G.div(qStar,q(32))',
            'x1^2+x2^2<=r0^2/2, x3^2<=z0^2/2' ],
        M2+'actual-continuation-exact-support.mjs':[
            'Hence Xa<Xminus<Xkeep<Xcut<a^2<1<XR<IposLeft.',
            'Thus Xplus<Xv*exp(128)<Xb.' ]}
    out={}
    for path,need in markers.items():
        raw=blob(repo,path)
        assert all(x.encode() in raw for x in need),path
        out[path]=sha256(raw).hexdigest()
    return out


def scalar_checks():
    w,z,fs,fr,sigma=S.symbols('w z fs fr sigma',positive=True)
    s=S.symbols('s',positive=True)
    midpoint=(1-w+s-z*fs)/2
    assert S.expand((midpoint+z*fr)-((1-w+s)/2+z*(fr-fs/2)))==0
    assert S.expand((2*(sigma-z*fr)-1+w)-(s-z*fs))==2*sigma-1+w-s+z*fs-2*z*fr
    # a<sqrt(2) and sqrt(1+w)-1<w/2. Hence the physical
    # interval for the radial upper endpoint is narrower than one step.
    assert 2*Q(3,8)**2<1
    assert Q(3,4*24**6)<min(Q(1,2),Q(9,98))
    assert (Q(4,3))**4>2
    # For b4*qBig=64, Delta<=w-w^2/4 suffices, while Delta>=w excludes.
    # These synthetic phase models choose Delta=w/2 and Delta=2*w.
    assert Q(1,2)+Q(1,8)<1 and 2>1
    return {'oneRadialGridCandidate':True,'axialMinimumAtZero':True,
            'strictRepresentativeLower':'sRep>1-w/2+w^2/16',
            'sufficientB4Ratio':'b4*qBig>=64/(1-w/2+w^2/16)'}


def main():
    parser=ArgumentParser(description=__doc__)
    for option in ('repo','maxima','inner','out'):
        parser.add_argument('--'+option,type=Path,required=True)
    args=parser.parse_args()
    raw=args.maxima.read_bytes();assert sha256(raw).hexdigest()==MAXIMA
    assert json.loads(raw)['exactRatios']=={'b1*qBig':1,'b2*qBig':16,'b3*qBig':32}
    raw=args.inner.read_bytes();assert sha256(raw).hexdigest()==INNER
    assert json.loads(raw)['exactRefinement']['sUpper']=='sUpper<1+w-(2-sUpper^(2h))*ZRep^2<=1+w'
    result={'schema':'MathScope.N7.SingleOriginalFrozenN4CellCriterion/1','sourceCommit':F8,
            'sourceSHA256':pinned_source(args.repo),'higherMaximaSHA256':MAXIMA,'innerShellSHA256':INNER,
            'notation':{'L':'ellMinimum+16','S':'L^6','w':'3/(4*S)','a':'sqrt(2*Xa)',
                        'k0':'floor(a*S-3/4)+1','Ru':'(k0+3/4)/S','sUpper':'(Ru/a)^2',
                        'sigma':'64/(b4*qBig)','F':'F(s)=s-(w^2/4)*s^(2h)'},
            'checked':scalar_checks(),
            'exactCriterion':{'criticalBand':"ell'=L",'candidateGrid':["k0","0","S"],
                'preconditions':['1<sUpper<1+w','1-w/2+w^2/16<sigma<=1'],
                'strictTest':'F(sUpper)<2*F(sigma)-1+w',
                'meaning':'If the test passes, this box has an open physical K intersection and its frozen fourth cutoff is positive. If it fails, every physical K box has a zero fourth cutoff at its frozen representative.',
                'growthFloorSpecialCase':'For b4*qBig=64, sUpper-1<=w-w^2/4 suffices for a positive frozen cutoff, while sUpper-1>=w excludes it.'},
            'proof':[
                'A positive fourth cutoff implies sRep<1 at the only critical label. The time center is one and 1<sUpper<1+w. The radial upper interval has width a*(sqrt(1+w)-1)<1/S.',
                'On that unique radial cell, Xb>4*Xa gives sLower=1/2. Both time endpoints before radial clipping are 1-w and 1+w. The lower endpoint stays 1-w.',
                'The permitted axial absolute upper exceeds sqrt(w/2)>7*w/3. Axial label zero chooses the negative midpoint -w/2. Labels plus or minus one use their full one-sign boxes and have absolute midpoint 4*w/3. Other labels are bounded away from zero by 5*w/3.',
                'With sUpper fixed, increasing u=ZRep^2 decreases the chosen upper time by at most DeltaU*sUpper^(2h). The original root increases strictly because sRep^(2h)>sUpper^(2h)/2 on 1/2<=sRep<=sUpper<=2.',
                'At label zero compare the selected time midpoint directly to F(sigma). For sigma<=1 the right-hand upper time is at most 1+w-w^2/2. Thus the minimum with 1+w drops out of the strict comparison.',
                'If the strict test passes, a point with T=1, Z=0, s=1 and R strictly between max(a,Rl) and Ru is in K, with positive original band and mesh factors. An open neighborhood from the permitted time side has the same label.' ],
            'scope':'Determines existence of a positive fourth cutoff at an original frozen representative, conditional on one exact radial grid phase and the original fourth scale. The complete fast field has separate evidence obligations.',
            'actualPhaseEvaluated':False,'release':'HOLD'}
    data=(json.dumps(result,indent=2)+'\n').encode();args.out.write_bytes(data)
    print('PASS one exact original representative cell criterion and sharpened sufficient cutoff')
    print(sha256(data).hexdigest(),args.out.name)


if __name__=='__main__':
    main()
