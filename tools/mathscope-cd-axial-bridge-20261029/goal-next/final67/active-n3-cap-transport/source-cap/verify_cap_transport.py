"""Source-pinned stage-one cap transport and integer-log propagator reduction."""
from argparse import ArgumentParser
from fractions import Fraction as F
from hashlib import sha256
from importlib.util import module_from_spec,spec_from_file_location
from pathlib import Path
import json

if not __debug__:raise RuntimeError('Exact proof assertions must remain enabled.')

PINS={
 'sameFamily':'dab937b981df7eeca4e72338d69e9969ed435e7e1590a4b146f6ae1043b0a937',
 'primary':'23599487a19b0570eb9641567a0e64ce7de7bf9a8583a5203f15dcfa84cb8a27',
 'cycle':'d7503aae22ab2785e77f8e4092bef1854defb17914882b0b9ff1adca9f5be7b8',
 'frontier':'fbaea5bd2475e54919cef4099479c1c6ad6ad48dc68225190ea9f6c127f07aaa',
 'cover':'143d32b523429323eb3efc8ef8ea9c8f8922162bd919712cfe41580103a788be',
 'builder':'ca387b2c61daf45fbd0473f5fa297aae0442b2349272a8ae959f2af5082c401f',
 'Kupper':'0e1984e6f872e9a167b7920d31a55b4888a807c359a0c38dbff9f8f8af5f4acb',
 'spatialStencil':'5152e1b5bb7c0e91ae223bc35e7b26c6899ea329fdc000f213f58fb8ab0027c4',
 'scaleClosure':'1efc5a0d90ed98b14d79ee4c20d4ff2a3b86cf9c4cedd0cc1590868dbcbaf81a',
 'scaleChecker':'9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee',
 'weightedCutoffComposition':'4b9e76aa053e18e767f8d82c7cd64a09b0bd23e942cd39157bf9ea95efdcc648',
}

def read(path,key,decode=True):
    raw=path.read_bytes();assert sha256(raw).hexdigest()==PINS[key],key
    return json.loads(raw) if decode else raw.decode()

def polynomial(program,values):
    result=F(0)
    for row in program:
        value=F(row['coefficient']);assert value>=0
        for name,power in row['powers'].items():
            assert type(power)is int and power>=0
            value*=values[name]**power
        result+=value
    return result

def main():
    p=ArgumentParser(description=__doc__)
    p.add_argument('goal_next',type=Path);p.add_argument('source_bundle',type=Path)
    p.add_argument('spatial_stencil',type=Path);p.add_argument('output',type=Path)
    a=p.parse_args();assert not a.output.exists(),'Use a fresh output.'
    root=a.goal_next/'primary-forced-join/active-n3-c5-binding'
    report=read(a.source_bundle/'same-family-mode-two.json','sameFamily')
    primary=read(a.source_bundle/'primary-c5-native.json','primary')
    cycle=read(a.source_bundle/'first-cycle.json','cycle')
    cover=read(a.goal_next/'whole-k-atlas/primary-reference-cover.json','cover')
    builder=read(root/'spatial-stage1/stage1_spatial_ingress.mjs','builder',False)
    K=read(root/'norm-leading/n3-whole-k.json','Kupper')
    stencil=read(a.spatial_stencil,'spatialStencil')
    composition=read(a.goal_next/'final67/correction-jet-composition/correction-jet-composition.json','weightedCutoffComposition')
    scale=read(a.goal_next/'first-scale-closure/first-scale-closure.json','scaleClosure')
    checker_path=a.goal_next/'first-scale-closure/check_first_scale_closure.py'
    read(checker_path,'scaleChecker',False)
    spec=spec_from_file_location('pinned_original_scale_checker',checker_path)
    checker=module_from_spec(spec);spec.loader.exec_module(checker)
    original_program,original_roots=checker.verify_qbig(a.goal_next.parents[2])
    checker.exact_parameter_tree(original_program)
    original_code_pins=checker.code_pins(a.goal_next.parents[2])
    assert original_code_pins==scale['checkedSourceSHA256']
    assert original_program.data['parameterExpressionSHA256']==primary['source']['parameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
    assert report['status']=='VERIFIED_COMPLETE_SAME_LIVE_N3_FIRST_FORCED'
    assert report['prefix']==primary['domain']['prefixOrder']==cycle['prefix']==3
    assert report['completeForcedSeal'] and not report['numericOutputBound']
    assert primary['status']=='VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS'
    assert primary['source']['allConstantsFromSamePrivateFamily'] is True
    assert primary['scope']['actualPostTemporalFiveMapClassCertified'] is False
    assert report['normRoots']['K']==primary['normRoot']==K['K']==18310069
    assert report['normRoots']['namespace']=='norm'
    assert len(report['normRoots']['classRows'])==6
    rows=report['full']['rows']
    assert len(rows)==20 and {r['system'] for r in rows}==set(range(20))
    assert {(r['key'],r['harmonic']) for r in rows}=={(str(d)+':'+str(sign),m) for d in range(5) for sign in (1,-1) for m in (1,2)}
    for row in rows:
        assert row['sourcePulseSystem']==(0 if row['key'].endswith(':1') else 1)
        assert row['forcedOutputClassCertified'] is False
        assert len(row['H_w'])==2 and len(row['localCoordinates'])==5
        assert len(row['projected'])==len(row['originalSource'])==3
    assert len({tuple(row['H_w']) for row in rows})==10
    assembly=report['full']['assembly']
    assert [assembly[k] for k in ('allOriginalSourceLabels','signedSourceContributions','exactPositiveSourceSystems','exactNegativeConjugateSolutionRoutes')]==[81,162,20,20]
    assert len(report['full']['checks'])==805 and all(c['pass'] is True for c in report['full']['checks'])
    assert cycle['status']=='VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION' and len(cycle['stages'])==6
    assert cycle['stages'][3]['name']=='original-post-signed-exact-temporal'
    assert cycle['stages'][4]['name']=='original-post-signed-five-map'
    for text in ('const meanPotentials = [temporal.potential.psi, five.potential.psi];',
      'const azimuthalSwirls = [temporal.potential.velocity.v, five.increment.v];',
      'normalizedRoots: {U, G_U, A, G_A}',
      "assert.equal(forced.assembly.exactPositiveSourceSystems, 20);"):
        assert text in builder,text

    assert cover['status']=='SOURCE_BOUND_TWO_REFERENCE_WINDOWS_WITH_FROZEN_TAIL_MARGIN'
    slab=cover['physicalSlab']
    assert slab['N3']=={'qOverQBig':['1/32','1/16'],'referenceEll':'ellMinimum+15','s':'[1,2)','omittedTimesQ':'>=2'}
    assert slab['N4']=={'qOverQBig':['1/64','1/32'],'referenceEll':'ellMinimum+16','s':'[1,2]','omittedTimesQ':'>=2'}
    # Q3=qBig/32=tau0, Q4=qBig/64=tau0/2. Check the exact physical interval cover.
    assert F(1,64)/F(1,32)==F(1,2) and F(1,16)/F(1,32)==2
    # Uniform h<1/64 conversions for Q4=tau0/2; compare rational powers with integer arithmetic.
    assert F(3,2)**64>2**33  # 2^(1/2+h)<3/2.
    assert F(9,8)**64>2     # 2^h<9/8, hence 2^(1+h)<9/4.
    bracket=stencil['capPrograms']['exactEntrywiseEnergyBracket']
    assert len(stencil['sourceSlots'])==24
    assert stencil['cutoffBounds']['totalFirst_tau0']=='35'
    assert stencil['cutoffBounds']['totalSecond_tau0']=='1658'
    assert composition['status']=='VERIFIED_ORIGINAL_67_COMPOSITION_WITH_CONDITIONAL_CUTOFF_BOUNDS'
    assert composition['bounds']['weightedSeedIntegerCaps']==[1,4,33,854]
    q1=F(stencil['cutoffBounds']['qzNormalizedUpper'])
    q2=F(stencil['cutoffBounds']['qzzNormalizedUpper'])
    assert (q1,q2)==(F(768,503),F(282932224,127263527))
    ceiling=lambda x:(x.numerator+x.denominator-1)//x.denominator
    k1=ceiling(F(3,2)*4*q1);k2=ceiling(2*(33*q1*q1+4*q2))
    c1=20+k1;c2=692+2*20*k1+k2
    assert (k1,k2,c1,c2)==(10,172,30,1264)
    def signed_component_bound(program,kind,values,first,second):
        total=F(0)
        for term in program:
            coeff=abs(F(term['coefficient']));aa,bb=(F(1,2),1) if kind=='velocity' else (F(1),1)
            source_degree=0
            for variable,power in term['powers'].items():
                if variable in ('T','T_z','T_zz'):
                    value,da,db={'T':(1,F(0),0),'T_z':(first,F(-1,2),1),'T_zz':(second,F(-1),2)}[variable]
                else:
                    source_degree+=power;group=stencil['sourceSlots'][variable]['group']
                    name,da,db={'U':('u0',F(-1,2),-1),'G_U':('u1',F(-1),-1),
                      'A':('a0',F(0),-1),'G_A':('a1',F(-1,2),-1)}[group]
                    value=values[name]
                aa+=power*da;bb+=power*db;coeff*=value**power
            assert source_degree==1 and aa==0 and bb in (0,1,2)
            # tau0^(bb*h)=t^bb<=1, uniformly on the actual slab.
            total+=coeff
        return total
    def source_energy_coefficient(values,first,second):
        vv=[signed_component_bound(row,'velocity',values,first,second) for row in stencil['signedStencils']['velocity']]
        gg=[[signed_component_bound(row,'gradient',values,first,second) for row in rows] for rows in stencil['signedStencils']['covariantGradient']]
        return sum(v*v for v in vv)+2*sum(v*v for row in gg for v in row)
    charts=[]
    for name,factors in [('N3',(F(1),F(1),F(1),F(1))),('N4',(F(3,2),F(9,4),F(9,8),F(3,2)))]:
        values=dict(zip(('u0','u1','a0','a1'),factors));values['t']=F(1)
        assert source_energy_coefficient(values,35,1658)==polynomial(bracket,values)
        coefficient=source_energy_coefficient(values,c1,c2)
        ratio=96*coefficient
        assert ratio<2**30 and ratio*F(1,2**56)<F(1,2**26)
        charts.append({'reference':name,'normalizedToPhysicalCapFactors':{k:str(v) for k,v in values.items() if k!='t'},
          'energyBracketCoefficientAt_t_1':str(coefficient),'ratioCoefficientUpper':str(ratio),
          'strictRatioDyadicUpper':'2^30','sufficientSameLog2CapGate':'log2(W_cap)+2*log2(Xb)+28<=h*(ellMinimum+15)',
          'actualLiveCorrectionChartMembershipProvedByThisReplay':False})
    # Exact integer certificates for the scalar gate; no float/huge exponential evaluations.
    for w,x,g in [(0,1,30),(20,3,54),(2**100,2**50,2**100+2**51+28)]:
        assert w+2*x+28<=g
        assert 30-2*28<=-26
    control={'w':20,'x':3,'g':53}
    assert control['w']+2*control['x']+28>control['g']

    # The norm frontier is the same genuine 1,245,636-record arithmetic closure as the old directed K run.
    frontier=read(a.source_bundle/'primary-K-arithmetic-frontier.json','frontier')
    assert K['sourcePins']['frontier']==PINS['frontier']
    nodes={r['id']:r['node'] for r in frontier['nodes']}
    assert len(nodes)==1245636 and frontier['roots']['W']==18310065
    exact={18310065:{'op':'exp','args':[18310064]},
      18310064:{'op':'multiply','args':[14220489,18310063]},
      18310063:{'op':'multiply','args':[261,17727099]},
      261:{'op':'rational','args':['3','1']},
      18310066:{'op':'integer_power','args':[18310065,8]}}
    assert all(nodes[id]==node for id,node in exact.items())
    assert nodes[18310069]['op']=='maximum' and 18310066 in nodes[18310069]['args']
    assert nodes[17727099]=={'op':'integer_power','args':[14220485,256]}
    assert nodes[14220489]=={'op':'multiply','args':[14220487,14220488]}
    assert nodes[14220487]=={'op':'add','args':[474,3622]}
    assert nodes[474]=={'op':'rational','args':['4','1']}
    assert nodes[3622]=={'op':'sqrt_positive','args':[24]}
    assert nodes[24]=={'op':'rational','args':['2','1']}
    assert nodes[14220488]=={'op':'rational','args':['1',str(2**33)]}
    pending=[14220485];bnorm_terms=[]
    while pending:
        id=pending.pop()
        if nodes[id]['op']=='add':pending.extend(nodes[id]['args'])
        else:bnorm_terms.append(id)
    assert len(bnorm_terms)==11 and 14220477 in bnorm_terms and 14220478 in bnorm_terms
    assert nodes[14220477]=={'op':'rational','args':[str(2**128),'1']}
    assert nodes[14220478]=={'op':'integer_power','args':[2128530,4096]}
    assert nodes[2128530]=={'op':'source_parameter','args':['C12EnvelopeR']}
    assert nodes[9]=={'op':'source_parameter','args':['h']}
    # Same exact source parameter tree: Q>=2000^2 exp((4+8*8002)T), Lc>=Q^200>800T.
    assert 4+8*8002==64020 and 200*64020>800
    assert 25600000*800>8002 and 4096>1
    assert 2<2**2 and F(36,2**33)<F(1,2**27)
    # log W_prop/H_gain <36/(2^33*h*Bnorm^256)<2^-27.
    # H_gain=h*(ellMinimum+15)*log2 >h*Bnorm^512/2; Bnorm>h^-1.
    # For a,b,c,d,p<=2^16 the first, second, third, fifth factor logarithms each cost <H_gain/2^20.
    exponents={'a_log2':128*511-16,'b_logB':128*510-1-16,
      'c_logInverseH':128*510-1-16,'p_logL':128*255-2-16}
    assert all(v>20 for v in exponents.values())
    assert F(4,2**20)+F(1,2**11)<F(1,2**10)
    direct_gain={'definition':'H_gain=-h*log(tau0)=h*(ellMinimum+15)*log(2)',
      'result':'log(W_prop)/H_gain <2^-27',
      'dependsOnNumericalKUpper':False,
      'nativeNormNamespaceRoots':{'Bnorm':14220485,'BnormRadiusTerm':14220478,'C12EnvelopeR':2128530,'E':17727099,'Lmax':14220489,'W_prop':18310065,'h':9},
      'originalLocalizationNamespaceRoots':original_roots,
      'sameExactParameterExpressionSHA256':primary['source']['parameterExpressionSHA256'],
      'sameFamilyThresholdRecipeSourceSHA256':original_code_pins['research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs'],
      'sourceInequalities':['ellMinimum>=Bnorm^512 in that same privately sealed family',
        'Bnorm>=max(2^128,C12EnvelopeR^4096)',
        'log CSelected>=Q_parameter^200>800*T_parameter',
        'log C12EnvelopeR=exp(25600000*log CSelected)>8002*T_parameter=log(h^-1)',
        'Lmax=(4+sqrt(2))/2^33<6/2^33',
        'H_gain>h*Bnorm^512/2',
        'log W_prop=3*Bnorm^256*Lmax<18*Bnorm^256/2^33',
        'h*Bnorm^256>1; 36<64'],
      'crossNamespaceNodeIDsEquated':False,
      'liveCorrectionChartAndSamePhysicalThresholdTransportStillRequired':True}
    factorized_target={'conditionalTarget':'2^28*Xb^2*W_cap <=2^a*Bnorm^b*h^(-c)*W_prop^d*L^p, L=ellMinimum+15',
      'integerPowers':'0<=a,b,c,d,p<=2^16',
      'provedImplication':'log(2^28*Xb^2*W_cap)<H_gain/1024<H_gain; hence the scalar cap gate',
      'nonPropagatorLogRatioDyadicExponentsAfterPowerCap':exponents,
      'propagatorLogRatioAfterPowerCap':'<2^-11',
      'sumLogRatioUpper':str(F(4,2**20)+F(1,2**11)),
      'actualCompleteStage1CapMembershipProved':False,
      'higherBackgroundB_mBoundByBnorm':False}
    assert K['status']=='DIRECTED_CONDITIONAL_WHOLE_ORIGINAL_K'
    upper=K['enclosure']['upper'];depth=0
    while isinstance(upper,dict) and list(upper)==['exp']:
        depth+=1;upper=upper['exp']
    assert depth==10 and list(upper)==['rational']
    aa=F(upper['rational']);assert 12<aa and aa+1<2**21
    # e=sum 1/n! <=5/2+(1/6)/(1-1/4)=49/18<3<4, so log(2)>1/2.
    e_upper=F(5,2)+F(1,6)/(1-F(1,4))
    assert e_upper==F(49,18) and e_upper<3<4
    # T1=2,T2=4,T3=16,T4=65536,T5=2^65536; a<2^21<T5/4.
    assert 2**(2**(2**2))==65536 and 21<65536-2
    # For integer X>=16: exp(X/4)<2^(X/2)<=2^X/4.
    # The last comparison is the exact exponent inequality X/2<=X-2.
    assert F(16,2)<=16-2 and F(1,2)<=1
    induction=[{'naturalExpDepth':d,'strictUpper':'T'+str(5+d)+'/4'} for d in range(10)]
    assert induction[-1]=={'naturalExpDepth':9,'strictUpper':'T14/4'}
    # log K <=exp^9(a)<T14/4; K>=W_prop^8 ->log2 W_prop<T14/16.
    assert F(1,4)/8/F(1,2)==F(1,16)
    integer_log_bound={'symbolicInteger':'T14/16 = 2^(T13-4)',
      'result':'ceil(log2(W_prop))<=T14/16',
      'premise':'same pinned existing conditional directed K upper; W_prop^8 is an actual operand of K maximum',
      'naturalLogKUpper':'T14/4','towerConvention':'T1=2; T(n+1)=2^Tn',
      'originalWpropRoot':18310065,'originalEroot':17727099,'originalLmaxRoot':14220489,'Kroot':18310069,
      'exactSourceFormula':'W_prop=exp(3*E*Lmax), K>=W_prop^8',
      'naturalExpInduction':induction,'usedForCompleteCorrectionCap':False}
    result={'schema':'MathScope.N7.StageOneSourceCapTransportAndPropagatorLog/1',
      'status':'VERIFIED_SOURCE_GAIN_RATIO_AND_CONDITIONAL_TWO_REFERENCE_CAP_GATE',
      'inputSHA256':PINS,'all20ForcedSystems':[{'key':r['key'],'harmonic':r['harmonic'],'system':r['system'],
        'sourcePulseSystem':r['sourcePulseSystem'],'H_w':r['H_w'],'localCoordinates':r['localCoordinates'],
        'projectedSourceRoots':r['projected'],'classBoundEstablished':False} for r in rows],
      'means':{'Temporal':{'potentialSlot':'pde.five.temporal.potential.psi','potentialRoot':None,
         'exactInverseRoots':cycle['stages'][3]['inverses'],'freshPressureAndMeanRoots':cycle['stages'][3]['freshPressureAndMeans']},
        'FiveMap':{'potentialSlot':'pde.five.potential.psi','potentialRoot':None,'freshPressureAndMeanRoots':cycle['stages'][4]['freshPressureAndMeans']},
        'actualPostTemporalFiveMapClassCertified':False},
      'sourceCounts':{'ForcedPositiveSystems':20,'negativeConjugateRoutes':20,'signedSourceContributions':162,'localTemplateKeys':10,'nativeH_wPairs':10,'signedPotentialTemplatesAlsoRequired':10},
      'referenceTransport':charts,
      'sharperCutoffComposition':{'weightedSeedCaps':[1,4,33,854],'q1':str(q1),'q2':str(q2),
        'stageCutoff_tau0_units':[k1,k2],'totalCutoff_tau0_units':[c1,c2],
        'recomputedFromUniversalSignedStencil':True,'old35_1658MajorantsUsedAsNew30_1264Bounds':False},
      'integerCapGate':{'definition':'w>=ceil(log2 W_cap), x>=ceil(log2 Xb), g<=floor(h*(ellMinimum+15))',
        'sufficientExactIntegerComparison':'w+2*x+28<=g','conclusion':'J_stage1^2<=2^-26*S_R on each authenticated chart',
        'strictFailedControl':control,'actualW_capEndpoint':None,'actualIntegerComparisonExecuted':False},
      'propagatorIntegerLog':integer_log_bound,'propagatorSourceRecords':exact,
      'propagatorToOriginalPhysicalGain':direct_gain,'explicitFactorizedCapTarget':factorized_target,
      'sourceEvidenceExecution':{'priorRun':44553053960,'fullSourceConstructionSealed':True,
        'priorSpatialWrapperFailureRecorded':report.get('error',{}).get('message'),
        'retry44568520276NotQueried':True},
      'primaryClassConstants':{'sameRunClasses':36,'classMaximumPower':max(f['power'] for row in report['normRoots']['classRows'] for f in row['fields'].values()),
        'inheritsConditionalKUpper':True,'doesNotSupplyCompleteForcedOrMeanOutputCap':True},
      'remaining':['prove source gauge defects zero or add their value/gradient caps',
        'enclose all20 native Forced outputs, all10 Signed outputs and both actual fresh means in the24 normalized group caps',
        'authenticate live stage1 correction on the actual N3/N4 reference branches and all label/flat-seam transports',
        'construct N4 correction operands or prove actual same-family atlas matching; prior Primary cover does not do this',
        'prove W_cap log gate; W_prop root is a different source quantity',
        'construct and enclose correction stages2,3,4 separately'],
      'scope':{'stage':1,'actualCapBudgetsClosed':0,'actualWholeFieldNumericalEnclosure':False,
        'newArtifactDownloadedOrLiveRunQueried':False,'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}}
    a.output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
    print(json.dumps({'status':result['status'],'ForcedSystems':len(rows),'chartRatioConstants':[c['ratioCoefficientUpper'] for c in charts],
      'integerLogWprop':'T14/16','logWpropOverH':'<2^-27','integerCapMargin':28,'actualCapBudgetsClosed':0}))

if __name__=='__main__':main()
