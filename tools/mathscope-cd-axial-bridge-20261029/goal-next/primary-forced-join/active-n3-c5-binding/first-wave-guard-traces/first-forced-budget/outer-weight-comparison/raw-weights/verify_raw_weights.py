"""Compute original first Forced band degrees and radial poles per mixed derivative."""

from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
from math import factorial
from pathlib import Path
import json


FILES={
    'geometry':('first-forced-budget/geometry/outer-forced-geometry.json','e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291'),
    'epsilon':('first-forced-budget/geometry/epsilon-grade.json','ced340026d5fb40921b9a326133404c9148241fba904ea353b29d331b70ea036'),
    'factor':('forced-normalized-variation/source/normalized-first-forced.json','dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d'),
    'primary':('initial-mean-norm/primary/primary-quotient-ledger.json','a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244'),
    'mean':('initial-mean-norm/initial-mean-caps.json','2d172188703c2ddb81925eae70fd91252f8df9a743b8ff96ba325a6ac7f9bd1a'),
    'direction':('temporal-weighted-inverse/first-forced-covariance/mean-direction.json','65c7c4dedd18a6dcc25ed5d8a4e5b274d0a3911b923f737d7df21dd50c76e42d'),
    'radial':('temporal-weighted-inverse/first-forced-covariance/outer-covariance-final.json','bd1974a286e1bb99f07c780b8a3ca29dc2ff65347231cfa36a31bb744133eb3d'),
    'variation':('forced-normalized-variation/weighted-variation.json','c3ec1fb8ea1bf30ec18c09111440099e921a26c3417d5a47e083e5aa6e85dc37'),
    'log':('first-forced-budget/first-forced-log-budget.json','904f3f665055f46ba49e96617e832216c39c9fe80a018382d29c38f6aec19d1c'),
    'label':('outer-fixed-label-norm/band-weight.json','4e334a10ed93839437baa8b2caefe36d32291bfc6c3d67d3b8b04c41fa797ba0'),
}
R,Z,T,Y0,Y1=17732748,17732749,17732750,17745430,17745431
MEANS=('beta','v','gamma')
CARRIER={'KNormalR','KNormalTheta','KNormalZ'}
GEOMETRY_NORMALS=('KNormalR','KNormalTheta','KNormalZ')
ZERO=(0,0,0)
GRADE_ZERO=(Q(0),0)


def load(band,key):
    file,pin=FILES[key]
    raw=(band/file).read_bytes()
    assert sha256(raw).hexdigest()==pin,key
    return json.loads(raw)


def suborders(alpha):
    return product(*(range(a+1) for a in alpha))


def subtract(alpha,beta):
    return tuple(a-b for a,b in zip(alpha,beta,strict=True))


def sum_orders(alpha,beta):
    return tuple(a+b for a,b in zip(alpha,beta,strict=True))


def upper(values):
    values=[v for v in values if v is not None]
    return (max(v[0] for v in values),max(v[1] for v in values)) if values else None


def combine(a,b):
    if a is None or b is None:
        return None
    return a[0]+b[0],a[1]+b[1]


def field_inventory(data):
    direction=data['direction']
    assert direction['coefficientIdentity']=='coefficient(Y1) - vr1*coefficient(Y0) = 0'
    assert data['primary']['firstForcedDemand']['nativeRawScalarsChecked']==120
    assert all(r['independentPulseDerivativesOfNormalizedFields']==
               ('first derivative of matching u, coefficient +1' if r['mode']==1 else 'identically zero')
               for r in data['primary']['firstForcedDemand']['pulseDerivativeCancellations'])
    assert data['epsilon']['uniformFormalLowerGradeBothModes']=='49999/100000'
    mean=data['mean']
    orders={tuple(a) for a in direction['meanNativeSourceDemand']['commonOrdersForBetaVAndGamma']}
    assert len(orders)==43
    potential=[]
    for name in MEANS:
        observed={tuple(row['RZL']):row['terms'] for row in mean['rows'][name]}
        assert set(observed)==orders
        potential.append(observed)
    max_complete_pole=max(i[2] for row in potential for entries in row.values() for i in entries)
    assert max_complete_pole==27
    absorption=Q(factorial(14),4**14)
    assert absorption==Q(mean['palette']['fullGaussianAbsorptionConstantThroughPole27'])
    return potential,absorption


def assemble(data):
    source=data['factor']
    geometry=data['geometry']
    mean,absorption=field_inventory(data)
    raw_paths=data['radial']['radialJetDemand']
    alphas=tuple(sorted(tuple(a) for a in raw_paths['forcingAndMatrixDirections']))
    assert len(alphas)==len(set(alphas))==23 and max(map(sum,alphas))==4
    assert {beta for alpha in alphas for beta in suborders(alpha)}==set(alphas)
    geom_grades=geometry['conditionalCoefficientCaps']['actualCoefficientProfiles']
    primary={}
    for row in data['primary']['weightedQuotientLedger']['bounds']:
        primary[row['role'],row['slowOrder'],row['components']]=row
    assert data['primary']['weightedQuotientLedger']['firstPulseDerivativeCoverage']['addsBandOrLogLoss'] is False
    assert data['primary']['weightedQuotientLedger']['transverseDerivativeCoverage']['costInSAndLaurent']==0
    geom_case={(r['chart'],r['mode']):{int(i):c for i,c in r['matchedOpaqueFactors'].items()}
               for r in geometry['chartRows']}

    @cache
    def single(factor,alpha):
        r,z,l=alpha
        j=r+z
        kind=factor[0]
        if kind=='geometry':
            if l:
                return None
            rows=geom_grades[factor[1]]['envelopesBySlowOrder'][j]
            # Dropping S^(-rho_g) is safe. Keep positive powers intact.
            return upper([(Q(row[0]),0) for row in rows])
        if kind in ('baseline','phaseSlow'):
            return None if l else GRADE_ZERO
        if kind=='pulseLength':
            return None if alpha!=ZERO else (Q(1),0)
        if kind in ('mean','increment'):
            c,base=factor[1:]
            index=sum_orders(base,alpha)
            values=mean[c][index]
            if kind=='increment' or index[2]:
                return max(Q(row[0]) for row in values),0
            return max(Q(0),*(Q(row[0]) for row in values)),0
        role,c,part,base_slow,base_xi,base_v=factor
        total_slow=base_slow+j
        transverse=base_xi+l
        if role=='u':
            assert total_slow<=7 and transverse<=8 and base_v<=1
            if part=='real':
                entries=[primary['velocityRealOverP',total_slow,'all']]
            else:
                axis=('r','theta','z')[c]
                entries=[row for (tag,k,components),row in primary.items()
                         if tag.startswith('velocityImaginary') and total_slow==k and axis in components.split(',')]
                assert len(entries)==(1,3,3)[c]
        else:
            assert base_v==0
            entries=[primary['pressureOverP' if role=='p' else 'principalTailOverP',
                             total_slow,'imaginary' if role=='p' else 'real']]
        return upper([(Q(x['constantSPower']),x['totalLogPoleAfterG']) for x in entries])

    @cache
    def derivative(factors,alpha):
        if not factors:
            return GRADE_ZERO if alpha==ZERO else None
        return upper([combine(single(factors[0],beta),derivative(factors[1:],subtract(alpha,beta)))
                      for beta in suborders(alpha)])

    signatures={1:set(),2:set()}
    tally=Counter()
    for case in source['cases']:
        key,mode=case['chart'],case['mode']
        chart=source['normalizedPrimaryByChart'][key]
        metadata=chart['slowAndTransversePartialFactorLeaves']
        fields={x['root']:x for x in case['rawJetAtoms']}
        nodes=geom_case[key,mode]
        for scalar in case['scalars']:
            j,part=scalar['coordinate'],scalar['part']
            if mode==1:
                # C91 exact pulse derivative; C90 exact Gaussian rate. Their
                # normalized velocity envelope has the same S,pole degree.
                signatures[1].add(('pulseDerivative',( ('u',j,part,0,0,1), )))
                signatures[1].add(('GaussianRate',( ('geometry','normalizedPulseRate'),('u',j,part,0,0,0) )))
            for coefficient,monomial in scalar['termsAfterFactoringPToMode']:
                assert Q(coefficient)!=0
                assert sum(n for i,n in monomial if i in fields and fields[i]['role']!='mean')==mode
                globals={nodes[i] for i,n in monomial if i in nodes}
                means=[fields[i] for i,n in monomial if i in fields and fields[i]['role']=='mean']
                assert len(means)<=1
                if mode==1 and ('KPhaseTime' in globals or (means and globals&CARRIER)):
                    tally['regroupedHighFrequencyTerms']+=1
                    continue
                factors=[]
                drop=False
                for i,n in monomial:
                    assert n>0
                    if i in nodes:
                        factors.extend([('geometry',nodes[i])]*n)
                        continue
                    field=fields[i]
                    role=field['role']
                    if role=='mean':
                        orders=dict(zip((R,Z,T,17732737,Y0,Y1),field['orders'],strict=True))
                        assert all(not orders[x] for x in (T,17732737))
                        if orders[Y1]:
                            assert orders[Y1]==1 and not orders[Y0]
                            drop=True
                            break
                        index=(orders[R],orders[Z],orders[Y0])
                        c=int(field['nativeDefinition'].split(':')[-1])
                        factors.extend([('mean',c,index)]*n)
                    else:
                        native=metadata[field['nativeDefinition']]
                        orders=dict(zip(native['formalParameters'],field['orders'],strict=True))
                        assert all(x in (R,Z,T,Y0,Y1) or not t for x,t in orders.items())
                        base_slow=sum(orders.get(x,0) for x in (R,Z,T))
                        base_xi=sum(orders.get(x,0) for x in (Y0,Y1))
                        name=native['name']
                        if role=='u':
                            c=int(name.rsplit('_',2)[1])
                            component_part=name.rsplit('_',1)[1]
                        elif role=='p':
                            c,component_part=0,'imaginary'
                        else:
                            c,component_part=int(name.rsplit('_',1)[1]),'real'
                        factors.extend([(role,c,component_part,base_slow,base_xi,0)]*n)
                if drop:
                    tally['meanY1MonomialsRepresentedByPairedL']+=1
                    continue
                tally[f'mode{mode}RetainedOriginalMonomials']+=1
                signatures[mode].add(('unregrouped',tuple(sorted(factors))))
    assert tally['regroupedHighFrequencyTerms']==360
    assert tally['mode2RetainedOriginalMonomials']==1270
    assert tally['mode1RetainedOriginalMonomials']+tally['meanY1MonomialsRepresentedByPairedL']==3080-360

    for j in range(3):
        for part in ('real','imaginary'):
            u=('u',j,part,0,0,0)
            signatures[1].add(('eikonal',(('baseline',),('geometry','KNormalR'),u)))
            signatures[1].add(('eikonal',(('pulseLength',),('phaseSlow',),u)))
            signatures[1].add(('eikonal',(('pulseLength',),('phaseSlow',),('phaseSlow',),u)))
            for i,n in enumerate(GEOMETRY_NORMALS):
                signatures[1].add(('eikonal',(('geometry',n),('increment',i,ZERO),u)))
                # C91 tangency removes the real part from n dot U. The
                # explicit 1/k of the remaining imaginary factor persists.
                signatures[1].add(('independentConservative',(('geometry',n),
                    ('u',i,'imaginary',0,0,0),('mean',j,ZERO))))

    records={}
    bound={}
    for mode in (1,2):
        rows=[]
        for alpha in alphas:
            byclass=defaultdict(list)
            for role,factors in signatures[mode]:
                byclass[role].append(derivative(factors,alpha))
            maxima={role:upper(values) for role,values in sorted(byclass.items())}
            grade=upper(maxima.values())
            assert grade is not None
            bound[mode,alpha]=grade
            rows.append({'RZL':alpha,'geometrySlopeVariable':alpha[0]+alpha[1],
                         'rawBandPower':str(grade[0]),'rawAdditionalLogPoleAfterGToMode':grade[1],
                         'classes':{role:[str(value[0]),value[1]] for role,value in maxima.items() if value is not None}})
        records[str(mode)]=rows

    def baseline(mode):
        return max(s-3*(a[0]+a[1]) for (m,a),(s,p) in bound.items() if m==mode)

    def pole_baseline(mode):
        return max(p-3*(a[0]+a[1]) for (m,a),(s,p) in bound.items() if m==mode)

    joined={}
    for mode in (1,2):
        b,p=baseline(mode),pole_baseline(mode)
        folded=[]
        for alpha in alphas:
            band=Q(0)
            pole=0
            for beta in suborders(alpha):
                if beta[2]!=alpha[2]:
                    continue
                raw_s,raw_p=bound[mode,beta]
                lost=(alpha[0]+alpha[1])-(beta[0]+beta[1])
                # Each displaced slow derivative costs one S in a frame,
                # projector, or M_j. No more than 'lost' further ordered
                # windows can occur, so two S per displaced derivative.
                band=max(band,raw_s+2*lost+(1 if mode==1 else Q(1,2)))
                pole=max(pole,raw_p)
            assert band<=b+3*(alpha[0]+alpha[1])+(1 if mode==1 else Q(1,2))
            assert pole<=p+3*(alpha[0]+alpha[1])
            folded.append({'RZL':alpha,'velocityOverPBandPower':str(band),'additionalLogPoleAfterGToMode':pole})
        joined[str(mode)]={'rawUniformBandInterceptAtSlope3':str(b),
                           'rawUniformPoleInterceptAtSlope3':p,
                           'physicalOverP':folded}
    assert {tuple(row['RZL']) for row in data['variation']['rows']}==set(alphas)
    scalar_budget=scalar_join(data,records,joined)
    return {'status':'VERIFIED_RAW_SOURCE_DEGREE_ENUMERATION_CONDITIONAL_ON_SAME_CHART_FIELD_NORMS',
            'inputPins':{key:value[1] for key,value in FILES.items()},
            'directions':alphas,'distinctDirections':len(alphas),'termTally':dict(sorted(tally.items())),
            'distinctGradeSignaturesByMode':{str(m):len(rows) for m,rows in signatures.items()},
            'primaryGaussianWeight':'g(d)=exp(-2/d^2)*d^(-3/2); one common g(d)^m removed from the radial pole columns.',
            'meanZetaPoleAbsorption':{'maxPriorPole':27,'upper':str(absorption),
             'rule':'0<d<=1/4 and 0<=zeta<=exp(-4/d^2). Since d^-27<=d^-28, take the positive exponential series degree 14.'},
            'rawPerDirection':records,'conditionalOrderedVariation':joined,
            'conditionalScalarFactorsAndLogJoin':scalar_budget,
            'profileScope':{'geometryNegativeRhoFactorsDroppedInBandUpper':True,
              'ambientMeanYDerivativePairedIntoL':True,'unpulledPrimaryVJetTermsRegrouped':True,
              'sameFixedOriginalChartAndRepresentative':True,'noCommonSignAssumed':True,
              'constantMultiplicitiesNotRebudgeted':True,'nativeFieldNumericalEnclosures':False},
            'explicitCommonEpsilonGrade':data['epsilon']['uniformFormalLowerGradeBothModes'],
            'finalJets':0,'release':'HOLD'}


def scalar_join(data,records,joined):
    q=Q(1,128)**2/(2*Q(7,4)**2)
    ratio=1/(1-q)
    assert ratio==Q(data['radial']['poleAlgebra']['oppositeGaussianRatioAtMost'])==Q(100352,100351)
    assert ratio**2<4
    maximum={}
    for mode in (1,2):
        key=str(mode)
        raw=records[key]
        folded=joined[key]['physicalOverP']
        max_raw_power=max(Q(row['rawBandPower']) for row in raw)
        max_folded_power=max(Q(row['velocityOverPBandPower']) for row in folded)
        max_raw_pole=max(Q(row['rawAdditionalLogPoleAfterGToMode']) for row in raw)+Q(3*mode,2)
        max_folded_pole=max(Q(row['additionalLogPoleAfterGToMode']) for row in folded)+Q(3*mode,2)
        assert max_raw_pole==max_folded_pole<=64
        assert max_folded_power<=64 and max_raw_power<=64
        maximum[key]={'rawBandPower':str(max_raw_power),'nativeVelocityOverPBandPower':str(max_folded_power),
                      'totalRadialPoleAfterZetaToModeOverTwo':str(max_folded_pole),'conversionConstant':str(ratio**mode)}

    logs=data['geometry']['conditionalCoefficientCaps']['originalSlabLogBudget']
    assert logs['rawGeometryProductsWithLeibniz']['maxFactorsByMode']=={'1':4,'2':2}
    assert logs['rawGeometryProductsWithLeibniz']['logBound']=='H/2^124'
    assert data['log']['logBudget']=='H/2^109 for the field product and variation coefficient under the original source hypotheses'
    assert data['mean']['scope']['sameLiveBackgroundBOverEpsilonC5BoundAttachedOnOriginalSlab']
    assert max(Q(term[1],100000) for rows in data['mean']['rows'].values() for row in rows for term in row['terms'])==4
    actual_mean_power=max(Q(term[0]) for rows in data['mean']['rows'].values() for row in rows for term in row['terms'])
    assert actual_mean_power==Q(45,2) and actual_mean_power<=Q(51,2)
    assert Q(10,8)**2<2 and 3**4<2**7
    # Four original opaque geometry coefficients plus a full background
    # multiplier, which may also be the factor G in omega_Z*G.
    assert 2*(4+1)+1<2**4
    finite={'referenceDerivativeSlots':12,'referenceBandRescaling':26,'referenceEpsilonRescaling':1,
            'primaryAmbientXiSlopes':14,'positiveCarrierFactors':2,'radialGaussianRatio':2,
            'regroupedBranchAndLeibnizCoefficients':12,'complexModulusAndFiniteSums':3}
    assert sum(finite.values())<=136
    assert 2**136<2**(128*511-1-128)  # log finite 2^136 < H/2^128
    assert Q(1,2**124)+Q(1,2**128)+Q(1,2**109)<Q(1,2**108)

    loss=Q(data['label']['lemmaApplication']['rho'])
    assert loss==Q(1,2**20) and data['label']['lemmaApplication']['rangeOfPolynomialDegree']==['0','64']
    eps=data['epsilon']
    assert eps['modeOneGaussianRateTermsAfterC90']['minimumEpsilon']=='1/2'
    common=Q(eps['uniformFormalLowerGradeBothModes'])
    assert common-loss>0
    return {'maximaByMode':maximum,
            'exactGaussianConversion':'On original outer collar zeta=exp(-t1^2/log(X/Xa)^2-4/d^2). With t1<=1/128 and log(X/Xa)>=7/4, g(d)^m <= (100352/100351)^m*zeta^(m/2)*d^(-3*m/2).',
            'epsilon':{'GaussianRateAndNormalizedPulseDerivative':'1/2',
                       'groupedEikonal':eps['regroupedMinimumEpsilons']['canceledEikonalRemainder'],
                       'independentConservative':eps['regroupedMinimumEpsilons']['independentConservativeRemainder'],
                       'commonUnabsorbed':str(common),'additionalLossAbsorbingFinalSPowerOnce':str(loss),
                       'remainingEpsilonAfterOneBandAbsorption':str(common-loss)},
            'constantLedger':{
                'referenceToOwnRatio':'1/4 <= Qref/Qown <= 4 on same physical q, so |ell_ref-ell|<=2 and, for ell>=8, Sref/S<2.',
                'additionalCompleteBackgroundCharge':'Set C_F=M. The same-profile complete background b/epsilon, RF, G bounds are <=8*Bnorm*M through the needed slow derivatives. Charge one extra factor no greater than Cgeo for products with the full baseline or with G multiplying omega_Z; derivative reference multipliers are tracked separately.',
                'groupedFiniteBranchCap':'The separated b*n_r, epsilon*w*omega_T, epsilon*w*G*omega_Z, three n_i*Delta_i and three tangency terms account for at most 9 branch slots. Expanding omega adds at most two equal-majorant terms and at most four factors each take a part of four derivatives.',
                'powersOfTwoByReason':finite,'allowedFiniteFactor':'2^136',
                'geometryWithExtraBaselineLog':'H/2^124','fieldAndVariationLog':'H/2^109',
                'combinedLogAfterFiniteFactor':'H/2^108',
                'scope':'The variation and field log budget already includes original modal response mass and normalized oscillatory field/covariance constants. All field constants retain the same admitted original slab and short radial path premises.'}}


def main():
    assert __debug__
    cli=ArgumentParser(description=__doc__)
    cli.add_argument('--band',type=Path,required=True)
    cli.add_argument('--out',type=Path,required=True)
    args=cli.parse_args()
    result=assemble({k:load(args.band,k) for k in FILES})
    with args.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])
    for mode,row in result['conditionalOrderedVariation'].items():
        print(mode,row['rawUniformBandInterceptAtSlope3'],row['rawUniformPoleInterceptAtSlope3'])


if __name__=='__main__':
    main()
