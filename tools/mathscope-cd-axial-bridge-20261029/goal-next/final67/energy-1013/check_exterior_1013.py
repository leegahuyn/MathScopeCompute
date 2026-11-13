"""Bind manuscript (10.13) to the exact localized whole-K exterior budget."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

from pypdf import PdfReader


PINS = {
    'paper':'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
    'chart':'af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9',
    'moving':'c614a3a12ec8d9dcf5bd02235dd6227bb79969d372f345baad6aec471c127c2b',
    'radial':'0d67104a020f0e7b57cdbeabc4bade9d5401cbe795cdde9a7b0e60ce90cb8c5d',
    'center':'de578dd4f456e8ad698f33baa8302bd65af8550d53e4317589946aacc85be28f',
}


def need(condition, message):
    if not condition:
        raise ValueError(message)


def read(path, label):
    raw = path.read_bytes()
    need(sha256(raw).hexdigest() == PINS[label], f'original {label} pin')
    return raw


def main():
    p = ArgumentParser(description=__doc__)
    for name in (*PINS,'out'):
        p.add_argument('--'+name,type=Path,required=True)
    a = p.parse_args()
    data = {name:read(getattr(a,name),name) for name in PINS}
    manuscript = PdfReader(a.paper)
    need(len(manuscript.pages)==166,'pinned original 166-page manuscript')
    page_118 = ' '.join(manuscript.pages[117].extract_text().split())
    page_121 = ' '.join(manuscript.pages[120].extract_text().split())
    need('The support is contained in K=' in page_118 and '(10.4)' in page_118
         and 'χt(t) =0(1−t≥τ 0)' in page_118 and 'χ t(t) =1(0≤1−t≤τ 0/2)' in page_118,
         'same support, time cutoff and operator in (10.4)')
    need('Lemma 10.4.' in page_121 and 'F(t) = ∫' in page_121
         and '∥∇u(s)∥ 22 ds≤ F(t)2' in page_121 and '(10.13)' in page_121
         and 'from the zero datum' in page_121, 'original whole-space endpoint and dissipation comparison')
    chart, moving, radial, center = (json.loads(data[name]) for name in ('chart','moving','radial','center'))
    need(chart['variables']['rho']=='tau/tau0 with tau=1-t and tau0=qBig/32'
         and chart['variables']['time_measure']=='dt = -tau0 d rho, reversed time integration limits',
         'same whole-K normalization and orientation')
    need(moving['domain']=='whole-K physical X>=Xb with moving inner face r^2=2*q*Xb, all physical angles'
         and radial['movingHeatSHA256']==PINS['moving'], 'same actual moving subdomain')
    need(center['endpoint']['rho']=='1/2' and center['endpoint']['thirdOrderPremiseDischarged']
         and center['endpoint']['lowerBoundStrictPositive'], 'positive disjoint actual center endpoint')
    energy = Q(moving['intervals']['both']['endpointEnergyOverScale'][1])
    dissipation = Q(1,2**8171)
    need(moving['dissipationWithTimeWeightOverScale']==['0','2^-8171']
         and 2*(energy+dissipation)<4, 'actual exterior LHS strictly below 4S')
    need(radial['wholeKFullForceL1TimeL2SpaceSquaredLower']=='2^-20*S_R > 2^8172*S',
         'same-final whole-K force RHS strictly above 2^8172 S')
    budget_coefficient = 2**8172 - 4
    need(budget_coefficient>2**8171,'strict positive interior comparison budget')
    result = {
        'schema':'MathScope.N7.OriginalEnergyComparisonBudget/1',
        'status':'VERIFIED_SAME_FIELD_EXTERIOR_BUDGET_INTERIOR_COMPARISON_OPEN',
        'inputSHA256':PINS,
        'originalPages':[118,121],
        'domain':'full localized support K and rho in [1/2,1], endpoint t=1-tau0/2',
        'earlierPhysicalTime':'u=p=f=0 identically on [0,1-tau0] by flat original time cutoff',
        'normalization':{
            'commonFactor':'z0*tau0^(-2A), exact positive, cancels',
            'left':'2*(E_star+D_star) with E_star=1/2*integral |tau0^A u|^2 and D_star=tau0^(2A+1)*integral |grad u|^2',
            'right':'(integral_[1/2,1] norm_{L2(dxdy dzeta)}(tau0^(A+1)*f) d rho)^2',
        },
        'genuineExteriorComparison':{'leftUpper':'4*S','wholeKRightLower':'2^8172*S'},
        'interiorCriterion':'2*(E_inner+D_inner+E_annular+D_annular) <= (2^8172-4)*S is sufficient for actual (10.13)',
        'interiorBudget':'(2^8172-4)*S',
        'strictDisjointCenterEnergyLower':center['endpoint']['actualNormalizedSwirlEnergyLower'],
        'centerLowerIsNotUpper':True,
        'interfaceFlux':'No interface flux enters (10.13) itself. For energy defect, pair identical oriented traces and moving boundaries at Xa and Xb before enclosures.',
        'notYetCompared':'The sufficient interior budget is an exact criterion. Its actual annular bound and full whole-K refinement are still open.',
        'N7_06':'OPEN','N8_05':'OPEN','finalJets':0,'release':'HOLD',
    }
    raw=(json.dumps(result,indent=2)+'\n').encode()
    a.out.write_bytes(raw)
    print('PASS exact manuscript (10.13) normalization, actual exterior LHS and whole-K force RHS budget')
    print(sha256(raw).hexdigest(),a.out.name)


if __name__=='__main__':
    main()
