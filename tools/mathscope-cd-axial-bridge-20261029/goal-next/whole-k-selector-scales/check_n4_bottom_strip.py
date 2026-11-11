"""Exact physical and representative geometry of the unresolved lower strip."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json

import sympy as S

from check_common_b_scales import F8, blob


FAMILY_RESULT = '6873cf394c0d70cdef4a4a9a7e6b50780832be87d7c48ca7dcdc88938a3a5c97'
M3 = 'research-ide/mathscope-m3/navier/'


def source_pins(repo):
    markers = {
        'source-global-representative.mjs': [
            'scale=G.pow(ell,6),width=G.div(q(3,4),scale)',
            'selectedTimeInterval=[O.maximum(TLower,F(sLower)),min(TUpper,F(sUpper))]',
            'T=mid(...selectedTimeInterval)',
            'Each of the three coordinate differences to any other active point in the box is<3/(2ell^6)',
            'partial_s F>=1-2h*4^(1-2h)>1-8h>1/2'],
        'source-global-band.mjs': ['chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T)',
                                   'qActual=G.mul(Q,s)', 's in[1/2,2],eta in[-1,1]'],
        'source-localization.mjs': ['tau0===G.div(qStar,q(32))','ell0===G.add(ellMinimum,q(6))'],
        'global-source-index.mjs': ['upper=G.sub(floor(G.div(next.logScale,log2)),G.one)',
                                   'qOverQ:[\'1/2\',\'2\']'],
    }
    out={}
    for name,need in markers.items():
        raw=blob(repo,M3+name)
        assert all(x.encode() in raw for x in need),(name,need)
        out[M3+name]=sha256(raw).hexdigest()
    return out


def exact_areas():
    # p=1+delta, a^2=delta/p; the displayed expressions are computed
    # by ordinary polynomial and square-root antiderivatives.
    d,a,u=S.symbols('delta a u',positive=True)
    eta=S.symbols('eta',real=True)
    source=S.integrate(((1+d)*(1-eta**2)-1)/2,(eta,-a,a))
    assert S.simplify(source.subs(a,S.sqrt(d/(1+d))) - 2*d**S.Rational(3,2)/(3*S.sqrt(1+d)))==0
    # At fixed rho, |zeta| < ((1+delta)/2)^D sqrt(u),
    # u=1-2*rho/(1+delta), with d rho=-(1+delta)/2 d u.
    normalized=S.integrate((1+d)*S.sqrt(u),(u,0,d/(1+d)))
    assert S.simplify(normalized - 2*d**S.Rational(3,2)/(3*S.sqrt(1+d)))==0
    # Strip width refinement from w=3/(4*L^6) and L>=24.
    rational_top=Q(3,4)*(1+Q(33,32)*(1+Q(2,24**3))**2)
    assert Q(33,32)**32>2 and rational_top<Q(25,16)
    return {'etaRhoArea':'2*delta^(3/2)/(3*sqrt(1+delta))',
            'zetaRhoArea':'((1+delta)/2)^D * 2*delta^(3/2)/(3*sqrt(1+delta))',
            'strictWidthMajorant':'delta=25/(16*L^6)',
            'rationalWidthComparison':[str(rational_top),str(Q(25,16))],
            'additionalActualMeshRectangleEtaRhoArea':'w*(sqrt(w)+2*w)',
            'additionalActualMeshRectangleZetaRhoArea':'2^(-D)*w*(sqrt(w)+2*w)'}


def main():
    parser=ArgumentParser(description=__doc__)
    for k in ('repo','selector-result','out'):
        parser.add_argument('--'+k,type=Path,required=True)
    args=parser.parse_args()
    raw=args.selector_result.read_bytes()
    assert sha256(raw).hexdigest()==FAMILY_RESULT
    selector=json.loads(raw)
    assert selector['wholeK']['N0Excluded'] and selector['wholeK']['fourthAndLaterPhysicallyInactive']
    result={'schema':'MathScope.N7.ActualRepresentativeBottomStripArea/1','sourceCommit':F8,
            'sourceSHA256':source_pins(args.repo),'selectorResultSHA256':FAMILY_RESULT,
            'geometry':{'qMin':'qBig/64','tau0':'2*qMin','criticalLabel':'L=ellMinimum+16',
                        'timeHalfWidth':'w=3/(4*L^6)',
                        'literalCondition':'sRep<1 requires integer time center 1, T<1+w and ZRep^2<w',
                        'oneSidedRepresentativeFloor':'sRep>1-w at the critical label',
                        'possibleBottomStrip':'1<=q/qMin<1+delta and 1/2<=rho<(1+delta)*(1-eta^2)/2',
                        'etaCut':'abs(eta)<sqrt(delta/(1+delta))'},
            'areas':exact_areas(),
            'oneSufficientAuthenticatedComparator':['b4*qBig>=64/(1-w)','b3*qBig>=32/(1-w)','b2*qBig>=16/(1-w)'],
            'actualComparatorStatus':'OPEN',
            'scope':'Geometric upper envelope of points where N4 may still be needed. Actual N4 use is not asserted.',
            'release':'HOLD'}
    out=(json.dumps(result,indent=2)+'\n').encode();args.out.write_bytes(out)
    print('PASS exact eta/time and physical normalized z/time bottom strip measures')
    print(f'{sha256(out).hexdigest()}  {args.out.name}')


if __name__=='__main__':
    main()
