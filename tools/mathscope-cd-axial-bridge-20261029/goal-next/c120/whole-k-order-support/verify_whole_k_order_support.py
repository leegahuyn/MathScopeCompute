"""Exact source-bound positive-order support on the registered physical K."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


GOAL = Path('work/goal-next')
REPO_EVIDENCE = Path('work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next')
RUN = GOAL / 'continuation101/axial-budget/runtime/research-ide'
END = GOAL / 'final67/source/research-ide'
PINS = {
    'physicalK': (Path('work/goal-20261111/m3/whole-k-chart.json'),'af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9'),
    'registeredGrid': (Path('work/goal-20261111/jets/whole-k-grid.json'),'2fe21b411211d884df2dbe5afeb44c01d891acdfcf0511120b023cfaf3167f3c'),
    'liveSlab': (GOAL/'continuation109/k1-domain-audit/final/fixed-n3-domain.json','df338897da4078df56cf8632d4f10a605bdfa16e02a1a331381e389bf5dc8738'),
    'exteriorExtension': (GOAL/'continuation109/n8-nonzero-certified-domain/final/nonzero-exterior-seam.json','5d15adc58c06706c5c2add8e4241e674cc1181f6ec54604a9335c2695516e948'),
    'C8Live': (GOAL/'continuation61/c8-slab/final/c8-slab.json','e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b'),
    'bScales': (REPO_EVIDENCE/'whole-k-selector-scales/fourth/fourth-selector-maxima.json','5a6ecee45d797d582e3218c36f980d5eb131619c860cec1bfb4d57aea89cdf56'),
    'atlas': (REPO_EVIDENCE/'whole-k-atlas/primary-reference-cover.json','143d32b523429323eb3efc8ef8ea9c8f8922162bd919712cfe41580103a788be'),
    'sourceFixedOrders': (GOAL/'continuation114/y-native-n5/final/native-n5-fixed-operands.json','1ab657059a995b2697bb4ca2a747819483a9a04ae909d06d9ee6886bb36df22e'),
    'actualN1Core': (GOAL/'continuation90/y/final/core-interval.json','6e074bcaabf5634256a771c8318a236e7c1e50df338cd8793ed42110fe019cf1'),
}
MODULES = {
    'commonSelector': (RUN/'mathscope-m2/navier/actual-common-admissible-family.mjs','7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75'),
    'window': (RUN/'mathscope-m3/navier/global-source-index.mjs','a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f'),
    'nativeBand': (RUN/'mathscope-m3/navier/source-global-band.mjs','a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b'),
    'sourceRadialGuards': (RUN/'mathscope-m2/navier/actual-continuation-exact-support.mjs','0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98'),
    'sourceProfile': (RUN/'mathscope-m2/navier/source-profile.mjs','4578d632c3da8c6994557bcb4e78babf4dcede1e4893252c6a8ae2e342426133'),
    'localization': (END/'mathscope-m3/navier/source-localization.mjs','5f6480f9799a9a83945f696833b9213585572efbe65e9e755b2935726e6f1036'),
    'stageSelector': (END/'mathscope-m3/navier/shrinking-cutoff-summation.mjs','a4afa225c5da82d6894a40314ecdc8f7784390f58bb47e085d5d724d9f7ee05c'),
    'stageSum': (END/'mathscope-m3/navier/final-summation/source-final-summation.mjs','67c2f0a63d4b1a5fdf86a4c25f776ed0fdf0a6cd379d08aaf858231621c04450'),
}
ANCHORS = {
    'commonSelector': ('for(let n=1;n<=historicalRows.length;n++)',
        'growth=G.add(previous,G.log(q(n===2?16:2)))',
        'smallBand=n===1?G.mul(G.add(ellMinimum,q(10)),log2):G.zero',
        'logScale=G.maximum(old.logScale,growth,smallBand,...constraints.map(c=>c.requiredLog))',
        'previous=logScale'),
    'window': ('next=commonRows[N],previous=N?commonRows[N-1]:null',
        'lower=previous?G.maximum(ell0,floor(G.div(previous.logScale,log2))):ell0',
        'upper=G.sub(floor(G.div(next.logScale,log2)),G.one)',
        "qOverQ:['1/2','2']"),
    'nativeBand': ('G.choose(x,G.q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero)',
        'family.selector.rows.length<activeOrder+1',
        'qActual=G.mul(Q,s)',
        'powerQ=power(q0,G.mul(q(2*n),h))',
        'extra=G.mul(sigma,G.expressionValue(sourceCutoff.system,[sigma],[1]))',
        'weight=G.mul(useChi,powerQ)',
        'Fterms.push(G.mul(weight,sourceRoots.F));Gterms.push(G.mul(weight,sourceRoots.U))',
        'Mterms.push(G.mul(weight,sourceRoots.M));Pterms.push(G.mul(weight,sourceRoots.Pi))',
        'radialTerms.push(G.mul(powerQ,G.sub(G.mul(useChi,X0,sourceRoots.v),G.div(G.mul(q(2),eta0,useExtra,sourceRoots.M),G.core.L))))',
        'TthetaTerms.push(G.mul(weight,sourceRoots.Ttheta));TzTerms.push(G.mul(weight,sourceRoots.Tz))',
        'F0=atRep(leadingFields.F),FR0=atRep(G.derivative(leadingFields.F,R)),GR0=atRep(G.derivative(leadingFields.G,R))'),
    'sourceRadialGuards': ('Xa=4/Lambda with Lambda>=2^16640','Xa<Xminus<Xkeep<Xcut<a^2<1<XR<IposLeft'),
    'sourceProfile': ("upperBoundExact:'2^-4096'","D:'1/2-h'"),
    'localization': ("x1^2+x2^2<=r0^2/2, x3^2<=z0^2/2",
        'tau0===G.div(qStar,q(32))',
        'expectedMinimum=G.ceiling(G.maximum(q(8)',
        'r0===G.one','tau=q*(1-eta^2), z=q^D*eta, X=r^2/(2q)',
        'matching derivatives of every order at1/2 and1','timeArgument=G.div(tau,tau0)',
        "u=curl(c*A)+c*B_e_theta; p=c*p_loc",
        "tau>=tau0"),
    'stageSelector': ('L=G.maximum(G.one,G.add(G.one,previousLogScale),G.add(G.one,logQ0Reciprocal)', 'a=G.exp(L)'),
    'stageSum': ("relativeLogWindow:['1','3/2']", 'L_j is nondecreasing', 'completeActiveSet:copy(plan.requiredIncrementIndices)'),
}


def load(root, pair):
    file, digest = pair
    data = (root/file).read_bytes()
    assert sha256(data).hexdigest()==digest, file
    return data


def rational_controls():
    exp_x_lower=lambda n:sum(Q(n**k,factorial(k)) for k in range(15))
    assert Q(9,8)**8>2
    assert 2*Q(1,16)==Q(1,8)
    D,h=(Q(1,2),-1),(0,1)
    assert tuple(2*a+2*b for a,b in zip(D,h))==(1,0)
    assert Q(1,2)*Q(9,8)+1==Q(25,16)
    assert 1-4*Q(1,16)==Q(3,4)
    assert Q(9,16)/(Q(1,2)+Q(9,16))==Q(9,17)<Q(9,16)
    assert Q(9,16)/(Q(15,32)+Q(9,16))==Q(6,11)<Q(9,16)
    # C109 seam-patch source is still in the old reference bracket, but
    # the closed spatial axis of the same K gives a distinct obstruction.
    assert Q(15,32)+Q(1,16)*Q(1,2)==Q(1,2)
    assert Q(15,32)<Q(1,2)
    assert Q(1,2)<2*Q(15,32)==Q(15,16)<1
    assert Q(1,2)<2*Q(15,32) and 2*Q(1,2)==1
    assert 4*Q(15,32)==Q(15,8)>1
    assert Q(3,4)+Q(1,4)==1
    assert Q(1,2)<Q(3,4)<1< Q(25,16)<2
    # Exact extended band t=-log2(Q) lies in (-3/4,5/4),
    # so offsets outside {-1,0,1} cannot satisfy the strict 3/4 guard.
    assert Q(25,16)**4<2**3 and Q(32,15)**4<2**5
    # C>=8 and the nearby labels give ell_own>=C+14>=22.
    # Keep the actual sharper representative fraction rather than
    # replacing it by its older uniform lower bound 1/2.
    assert Q(15,8)*(1-Q(54,22**6))>1
    assert 2*(1-Q(54,22**6))>1
    # A single frozen q window has width ratio exp(1/2)<sqrt(3).
    # Two original points at rho=1/2 with sigma zero and 4/9 give ratio>7/4.
    # Need (7/8)^(2h)>(27/32), which follows from 0<2h<1.
    assert Q(1,2)+Q(4,9)*Q(7,8)>Q(7,8)
    assert Q(7,4)**2>3
    assert exp_x_lower(5)>128 and exp_x_lower(6)>256
    row=[]
    for k in range(3):
        rho=Q(1,2**(k+1))
        first_zero_b=4+k
        # General induction b_n tau0>=2^(n-3). This checks
        # the exact equality at each of the three displayed boundaries.
        assert Q(2**(first_zero_b-3))*rho==1
        first_zero_stage=5 if k<=1 else 6
        assert exp_x_lower(first_zero_stage)*rho/32>1
        row.append({'minimumTauOverTau0':str(rho),'allBackgroundOrdersAtLeastThisZero':first_zero_b,
                    'allCorrectionStagesAtLeastThisZero':first_zero_stage})
    return row


def main(root):
    pts={key:json.loads(load(root,pair)) for key,pair in PINS.items()}
    anchors={}
    for k,pair in MODULES.items():
        text=load(root,pair).decode()
        anchors[k]=[]
        for token in ANCHORS[k]:
            assert token in text,(k,token)
            anchors[k].append([text[:text.index(token)].count('\n')+1,token])
    old=pts['physicalK']
    grid=pts['registeredGrid']
    c109=pts['liveSlab']
    slab=c109['fixedSlab']
    c8=pts['C8Live']
    scales=pts['bScales']
    atlas=pts['atlas']
    exact=pts['sourceFixedOrders']
    ratios=[scales['exactRatios'][f'b{i}*qBig'] for i in range(1,5)]
    assert ratios==[1,16,32,64]
    assert scales['physicalFourthCutoffJets']=='ZERO on q>=qBig/64, including the flat endpoint'
    assert old['background']['selector_lower_bounds_b_n_times_qBig']==list(map(str,ratios))
    assert old['background']['possibly_active_orders']==[0,1,2,3]
    assert grid['settings']['normalized_time']==['1/2','1']
    assert grid['coordinates']['whole_K']=='xi^2+upsilon^2<=1/2 and zeta^2<=1/2'
    assert grid['coordinates']['tau0']=='qbig/32'
    assert old['variables']['chart_equation']=='Q - sigma * Q^(2h) = rho'
    assert slab['QrefOverQBig']=='1/32' and slab['admittedPhysicalQOverQBig']==['1/64','1/16']
    assert slab['firstOmittedScaleTimesQ']==['1','4']
    cut=c109['actualRows']['cutoffAndFrozenFrame']
    assert [cut['timeCutoffDefinition'],cut['timeCutoffBody']]==[32019,17732791]
    assert cut['frozenCalls']==[17732973,17732983,17732993]
    assert c8['hashes']['scales']==PINS['bScales'][1] and c8['hashes']['cover']==PINS['atlas'][1]
    assert atlas['scaleReceiptSHA256']==PINS['bScales'][1]
    assert [x['prefix'] for x in atlas['rows']]==[3,4]
    assert atlas['physicalSlab']['N4']['referenceEll']=='ellMinimum+16'
    assert atlas['physicalSlab']['N3']['referenceEll']=='ellMinimum+15'
    assert '27/ell\'^6' in atlas['frozenRepresentative']
    assert exact['distinctN1StressGuards']==[
        {'component':'theta','domain':[28814,28826]},
        {'component':'z','domain':[28814,28824]}]
    assert all(s['forward'][0]==28814 and s['backward'][-1]==28824 for order in exact['exactOrders'] for s in order['stressRows'])
    # Exact floor registrations. ell0=C+6, log2(b_n)=C+10+log2(ratio_n).
    exponents=[10+n.bit_length()-1 for n in ratios]
    assert exponents==[10,14,15,16]
    windows=[(6,9),(10,13),(14,14),(15,15)]
    assert [upper for _,upper in windows]==[x-1 for x in exponents]
    assert [lower for lower,_ in windows]==[6,*exponents[:-1]]
    zero_tiers=rational_controls()
    assert old['corrections']['first_strictly_zero_stage']==5
    assert old['corrections']['possibly_active_stages']==[1,2,3,4]
    assert Q(old['corrections']['exp5_lower'])>128
    exterior=pts['exteriorExtension']
    assert exterior['geometry']['rho'][0]=='15/32' and exterior['geometry']['zeta'][0]=='1/4'
    assert exterior['geometry']['bothQBoundsStrict'] and exterior['geometry']['qOverTau0']==['1/2','1']
    assert exterior['sameWholeFinalFieldObservedRefinements']==0
    n1=pts['actualN1Core']
    assert n1['actualCoreInput']['admitted']=='0<X<Xa, eta=0'
    assert n1['positiveNormalization']=='j0*X' and n1['originalEvenProfile']==28835
    assert Q(n1['normalizedEnclosure'][0])>0
    assert 2*Q(3,4)*Q(1,32)<Q(1,4)  # qBig<1, Xa<1, so its physical point is on the radial unit plateau
    return {'schema':'MathScope.C120.OriginalWholeKPositiveOrderSupport/1',
      'pins':{key:pair[1] for key,pair in PINS.items()},'runtimePins':{key:pair[1] for key,pair in MODULES.items()},
      'originalSourceAnchors':anchors,
      'registeredK':{'originalGridSha':PINS['registeredGrid'][1],'spatial':'r^2<=1/2; sigma=(z/z0)^2<=1/2',
        'physicalTauOverTau0':['1/2','1'],'tau0OverQBig':'1/32','normalizedQBracket':['1/2','25/16'],
        'upperQStrict':True,'etaSquaredUpper':'9/17','positiveQChartDerivativeLower':'3/4'},
      'background':{'exactB1ThroughB4TimesQBig':ratios,'potentiallyContributingOrders':[1,2,3],
        'allHigherOrdersExactlyFlatZeroFrom':4,'laterStructuralLowerBound':'b_n >= 2^(n-4) b4 for every n>=4',
        'weights':'q^(2nh) chi(b_n q), plus q^(2nh) b_n q chi_prime(b_n q) in the radial stream commutator',
        'sourceFields':['F','U','M','Pi','radial v','Ttheta','Tz'],
        'scalarCases':[
          {'n':1,'argument':'Q/32','wholeK':'unit plateau','radialChiPrimeFactor':'zero everywhere'},
          {'n':2,'argument':'Q/2','wholeK':'unit plateau when rho+sigma<=1, positive transition otherwise','radialChiPrimeFactor':'nonzero precisely when rho+sigma>1'},
          {'n':3,'argument':'Q','wholeK':'positive iff rho+sigma<1; plateau at rho=1/2 and sigma=0','radialChiPrimeFactor':'nonzero precisely when Q in (1/2,1)'},
          {'nFrom':4,'argumentLower':'2^(n-3) Q>=1','wholeK':'all cutoff jets zero including the n4 equality'}],
        'stressAngularN1Right':28826,'bothHigherStressRight':28824,
        'actualNonzeroCoefficientsInferredFromScalarSupport':False,'doNotDiscardNonlinearProductsOfRetainedOrders':True},
      'conditionalActualN1Witness':{'component':'axial U1','orbitEta':0,'sourceX':n1['actualCoreInput']['X'],
        'rho':'3/4','sigma':'0','qOverTau0':'3/4','physicalRadiusSquared':'2*q*X',
        'sourceNormalizedLower':n1['normalizedEnclosure'][0],'strictlyPositiveUnderOriginalC90OrdinaryPremises':True,
        'N2AndN3FieldNonzeroValuesInferredFromScalarWeight':False,'initialTemporalMultiplier':'1/2'},
      'registration':{'sourceN0ThroughN3EllWindowsRelativeToEllMinimum':windows,
        'N4WindowStartsAtRelativeLabel':16,'N4WindowNonemptyByB5Growth':True,
        'fixedC109LiveN3Label':'ellMinimum+15','sameBodyN3AndN4PhysicalWeightsMatchWhereBothAdmitted':True,
        'N4RegistrationCanIncludeFlatZeroActualN4Term':True,'leadingOnlyOriginalFrozenCalls':cut['frozenCalls'],
        'actualSeparateFullFrozenFieldN4ZeroProved':False,'infiniteLaterNativeFieldsNumericallyEvaluated':False},
      'auxiliaryWiderTime':{'sameSpatialK':True,'newPhysicalTauOverTau0':['15/32','1'],'registeredIntervalChanged':False,
        'qBracket':['15/32','25/16'],'upperQStrict':True,'etaSquaredUpper':'6/11',
        'oldReferenceOnlyIf':'rho+sigma*2^(-2h)>=1/2',
        'C109ExteriorSubpatchInOldReference':True,
        'axisWitness':{'rho':'15/32','sigma':'0','Q':'15/32','B4q':'15/16','newScalarN4':'positive transition'},
        'exactBackgroundHigherZeroFrom':5,'exactB5qLower':'15/8',
        'availableReferenceCharts':[{'ellRelativeToEllMin':15,'coefficientOrder':3,'qOverTau0Range':['1','25/16'],'sRange':['1','25/16']},
                                   {'ellRelativeToEllMin':16,'coefficientOrder':4,'qOverTau0Range':['15/32','1'],'sRange':['15/16','2']}],
        'relativeActiveBandLabels':[-1,0,1],
        'sameBoxRepresentativeOmission':{'admittedRepresentativePremise':'s_own>1/2 and abs(s_rep-s_own)<=27/ell_own^6',
          'ellOwnLower':22,'N3FirstOmittedTimesQrepLower':'2*(1-54/22^6)>1',
          'N4FirstOmittedTimesQrepLower':'(15/8)*(1-54/22^6)>1','noPossibleN5AtSuchFrozenPoints':True},
        'fullNativeRegistrationAndFinalFieldForExtendedGrid':'OPEN',
        'aboveRho1':'original outer localization and all its jets equal zero'},
      'separateCorrectionSchedule':{'onRegisteredKPossiblyActiveStages':[1,2,3,4],'noCutoffStageAtLeastFive':True,
        'fixedWideAuxiliaryIntervalStageFiveStillZero':True,'growth':'a_j*qBig>=exp(j)',
        'allActualStageActivationOrCanonicalScaleNormsMaterialized':False,'structuralLowerTimeCuts':zero_tiers,
        'singleOriginalFinalQWindowCoversK':False},
      'claimBoundary':'Exact source-cutoff support and original registration arithmetic. Ordinary product/jet use keeps fixed source realization and zero-branch hypotheses. Values, corrected final-state assembly and convergence remain independent.',
      'N7_06':'OPEN','N8_05':'OPEN','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('--workspace',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    with args.out.open('xb') as f:
        f.write((json.dumps(main(args.workspace),indent=2)+'\n').encode())
    print('PASS original fixed K retains n1,n2,n3 only; wider physical interval has exact n4 scalar witness and all n>=5 flat zero')
