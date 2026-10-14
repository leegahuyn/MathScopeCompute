"""Existence and every-fixed-order smoothness of the actual common slow chart.

The original image is the domain. No assertion is made about arbitrary (Z,T),
where the original finite bracket need not have a root. A single explicit open
collar of that whole image also gives the endpoint extensions used by the fixed
five-bump kernels. Complete target functions and W/M/S estimates stay separate.
"""
from __future__ import annotations

import argparse
import json
import sqlite3
from fractions import Fraction as Q
from pathlib import Path

from initial_source_lemmas import REPO, PARAM_SHA, PARENT, PAPER_SHA, sha, require, pinned_json, verify_capture, FixedSource, atom, op, lit

HEADER_SHA = '010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c'


def run(repo, artifacts, output):
    capture = verify_capture(repo)
    folder = artifacts / 'mean-proof-inputs-38500114302/dag'
    header = pinned_json(folder / 'header.json', HEADER_SHA)
    require(header['nodeCount'] == 3892594, 'Wrong full parent header')
    registry = json.loads(header['definitions']['base']['base']['monotone'])
    require(len(registry) == 3, 'Wrong actual monotone registry')
    definition = registry[2]
    require({k: definition[k] for k in ('name','variable','parameters','body','left','right','derivativeLower','derivativeUpper','numericOracle')} == {
        'name':'ActualCommonBandSlowInverse','variable':622810,'parameters':[622803,622804],
        'body':622819,'left':19,'right':24,'derivativeLower':19,'derivativeUpper':1,'numericOracle':False}, 'Actual slow inverse definition changed')
    db = sqlite3.connect('file:'+(folder/'source-dag-checkpoint.sqlite').as_posix()+'?mode=ro',uri=True)
    ids = list(range(26))+[622803,622804]+list(range(622810,622830))
    nodes = {i:json.loads(raw) for i,raw in db.execute('SELECT id,raw FROM nodes WHERE id IN ('+','.join('?' for _ in ids)+')',ids)}
    db.close()
    require(set(ids) <= nodes.keys(), 'A required actual chart operand is absent')
    require(nodes[9] == {'op':'source_parameter','args':['h']} and nodes[622820] == {'op':'actual_monotone_root','args':[2,622803,622804]}, 'Actual chart branch changed')
    f = FixedSource(nodes)
    f.aliases.update({9:'h',622810:'s_variable',622803:'Z',622804:'T'})
    s, z, t, h = atom('s_variable'),atom('Z'),atom('T'),atom('h')
    require(f.tree(22) == op('add',lit(Q(1,2)),op('multiply',lit(-1),h)), 'Actual D exponent is not 1/2-h')
    expected = op('add',s,op('multiply',lit(-1),op('power',z,lit(2)),op('exp',op('multiply',lit(2),h,op('log_positive',s)))),op('multiply',lit(-1),t))
    require(f.tree(622819) == expected, 'The actual implicit body is not s-Z^2*s^(2h)-T')
    require(nodes[622825] == {'op':'log_positive','args':[622820]} and nodes[622826] == {'op':'multiply','args':[22,622825]}, 'Actual eta power changed')
    require(nodes[622827] == {'op':'exp','args':[622826]} and nodes[622828] == {'op':'inverse','args':[622827]} and nodes[622829] == {'op':'multiply','args':[622803,622828]}, 'Actual eta coordinate changed')
    profile_text = (repo/'research-ide/mathscope-m2/navier/source-profile-data.mjs').read_text(encoding='utf-8')
    profile = json.loads(profile_text.split('export const PINNED_N3 = ',1)[1].strip().rstrip(';'))
    p = profile['parametersExactExpressions']
    require(profile['parameterExpressionSHA256'] == PARAM_SHA and p['h'] == {'exp':{'product':[{'integer':-8002},{'ref':'T'}]}} and p['T'] == {'sum':[{'exp':{'ref':'Md'}},{'integer':10}]} and p['Md'] == {'integer':1048576}, 'Actual h definition changed')
    # Values below are exact rational consequences of h<1/64. The actual h is
    # much smaller; exp(-8002*T)<2^-8002 follows from T>1 and e>2.
    h_upper = Q(1,64)
    original_derivative_lower = 1-8*h_upper
    collar_derivative_lower = 1-32*h_upper
    parameter_collar = Q(1,256)
    endpoint_change = 13*parameter_collar
    lower_endpoint_margin = Q(1,8)-endpoint_change
    upper_endpoint_margin = Q(1,2)-endpoint_change
    require(original_derivative_lower > Q(1,2) and collar_derivative_lower == Q(1,2), 'Common chart derivative floor failed')
    require(lower_endpoint_margin > 0 and upper_endpoint_margin > 0, 'Fixed collar endpoint signs failed')
    result = {
        'schema':'MathScope.N6.ActualInitialSlowChartDomainProof/1',
        'source':{'headerSHA256':HEADER_SHA,'parentNodesSHA256':PARENT,'parameterExpressionSHA256':PARAM_SHA,'paperSHA256':PAPER_SHA,'definitionIndex':2,'definition':definition,'actualRoot':622820,'actualBody':622819,'actualEta':622829,'capture':capture,'selectedNodeCount':len(nodes),'selectedNodesSHA256':sha(json.dumps([[i,n] for i,n in sorted(nodes.items())],separators=(',',':')).encode())},
        'actualH':{'definition':'exp(-8002*(exp(1048576)+10))','strictPositive':True,'strictUpper':'2^-8002 < 1/64','underflowReplacementUsed':False},
        'originalDomain':{'definition':'D_h = {(Z,T)=(s^(1/2-h)*eta,s*(1-eta^2)): 1/2<=s<=2, -1<=eta<=1}', 'closedImageCompact':True,'sameDomainForEveryDerivativeOrder':True,'arbitraryZTClaimed':False},
        'existenceUniqueness':{'equation':'F(s;Z,T)=s-Z^2*s^(2h)-T=0','derivative':'F_s=1-2h*Z^2*s^(2h-1)','originalBracket':['1/2','2'],
            'proof':['Each image point has its defining s in the original bracket, because D=1/2-h gives Z^2*s^(2h)=s*eta^2.',
                'For all points in the entire bracket and |Z|<=2^D, Z^2*s^(2h-1)<=2^(2-4h)<4. Hence F_s>1-8h>7/8>1/2.',
                'Strict monotonicity gives uniqueness and the two endpoint signs on the whole original image. The selected source root equals that unique root.'],
            'globalOnActualClosedImageProved':True,'originalDeclaredHalfLowerBoundJustified':True,'upperDerivativeBound':'F_s<=1'},
        'fixedOpenCollar':{'parameterDistanceInfinity':'1/256 from D_h','sBracket':['1/4','3'],'ZBound':'|Z|<2',
            'proof':['On this single collar, s^(2h-1)<=4 and |Z|<=2, so F_s>1-32h>1/2.',
                'For original parameters, integrating this derivative floor from the original root gives F(1/4)<-1/8 and F(3)>1/2.',
                'At either collar endpoint |F_Z|=2|Z|s^(2h)<=12 and |F_T|=1. A parameter change of infinity norm at most 1/256 changes F by at most 13/256.',
                'The exact remaining endpoint margins are 19/256 and 115/256. They are positive, so every point of the same collar has a unique root in (1/4,3).'],
            'strictDerivativeLower':'1/2','leftEndpointSignMargin':str(lower_endpoint_margin),'rightEndpointSignMargin':str(upper_endpoint_margin),'sameCollarForEveryOrder':True},
        'allFixedOrderSmoothness':{'provedForActualSAndEta':True,'reason':'The implicit body is C-infinity for s>0 and its actual F_s has the same positive floor on the common collar. The parameter implicit-function theorem therefore gives C-infinity s; uniqueness glues the local inverses. eta=Z*exp(-(1/2-h)*log(s)) is C-infinity on the same collar.',
            'firstDerivatives':['s_T=1/F_s','s_Z=2Z*s^(2h)/F_s'],
            'higherDerivativeRecipe':'For every parameter multi-index I, differentiate F(s(Z,T),Z,T)=0. Isolate F_s*partial^I s; every other term is a finite product of a derivative of the elementary F and lower-order derivatives of s. Divide by F_s>=1/2 and induct. Compactness of one closed subcollar gives finite uniform constants C_I for every fixed order.',
            'uniformInBandAndLabel':'The same actual fixed h and the same normalized image/collar enter every band and label; no integer label, representative, ceiling, or covering index is differentiated.',
            'oneSidedBoundaryJetsAtEtaPlusMinusOne':True,'finiteDerivativeSamplesUsedAsProof':False},
        'globalPositiveBranchTheorem':{'domain':'Z in R, T>=0, (Z,T)!=(0,0), with 0<2h<1','uniquePositiveRoot':True,
            'proof':['For T>0, set a=2h and H(s)=(s-T)/s^a for s>=T. H(T)=0, H(s) tends to infinity, and H_prime=(1-a)*s^(-a)+a*T*s^(-a-1)>0. Thus H(s)=Z^2 has exactly one solution; it is s>=T, with equality exactly when Z=0.',
                'For T=0 and Z!=0, the unique positive root is s=|Z|^(2/(1-2h)). The excluded point (0,0) has no positive root.',
                'At every root on this domain, F_s=1-2h+2h*T/s>=1-2h>0. The implicit-function theorem gives C-infinity dependence in T>0 and a local smooth extension at T=0,Z!=0; every compact subset has finite fixed-order constants.'],
            'agreesWithActualSourceBranchOnOriginalImage':True,
            'actualFiniteBracketExtendedOrChanged':False,'outsideOriginalImageIsASeparateAnalyticContinuation':True},
        'fixedBumpAllOrderConsequence':{'bumpSourceNode':634278,'copySourceNodes':[634278,634467,634497],
            'jointRadialSlowSmoothness':'The source kernels s^-A*eta_j(R/sqrt(s)) are jointly C-infinity, including flat radial zero extensions, on the same common slow collar. x0 is a positive fixed source parameter scale, so their radial supports share one bounded interval separated from zero.',
            'compactMomentDifferentiation':'For each fixed slow derivative order and each of the five actual fixed powers p, all differentiated integrands are continuous on one compact radial x slow set and bounded there. Thus a finite dominating constant times the indicator of that common radial interval justifies differentiation under the integral at every fixed order; no infinite series or Fourier sum is exchanged by this lemma.',
            'multiplicationByActualTargetCoefficients':'Conditional on the smoothness of the actual P/J targets. Those targets contain other full source operators and their smoothness is not supplied by a bump-kernel lemma.',
            'fullInitializedMeanSmoothnessProved':False},
        'remaining':['Smoothness and convergence of every actual natural/implicit/indexed/Volterra/Fourier target entering P,Jtheta,Jz.', 'Uniform full W/M/S input seminorms, fixed supports/gluing and complete (9.10) moments for the entire tuple.', 'The complete original Cartesian PDE residual.'],
        'mathematicalStatus':'ACTUAL_COMMON_SLOW_CHART_GLOBALLY_DEFINED_AND_CINFINITY_ON_ORIGINAL_IMAGE_AND_ONE_FIXED_COLLAR; COMPLETE_INITIAL_STATE_OPEN',
        'originalN601Complete':False,'originalN602Complete':False,'unconditionalWholeStateProof':False,'originalProgressChanged':False,
    }
    output.mkdir(parents=True,exist_ok=True)
    (output/'analytic-initial-source-domain.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':result['mathematicalStatus'],'actualRoot':622820,'globalOriginalImage':True,'allFixedOrderChartSmoothness':True,'wholeN601':False}))
    return result


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo',type=Path,default=REPO)
    parser.add_argument('--artifacts',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    run(args.repo.resolve(),args.artifacts.resolve(),args.output.resolve())
