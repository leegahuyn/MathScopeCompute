"""Check positive epsilon degrees of the C92 grouped raw forcing."""

from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json


PINS={
    'factor':'dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d',
    'geometry':'e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291',
    'primary':'a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244',
}
KAPPA=Q(1,100000)
CARRIER={'KNormalR','KNormalTheta','KNormalZ'}


def read(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],key
    return json.loads(raw)


def verify(source,geometry,primary):
    kind=geometry['conditionalCoefficientCaps']['actualCoefficientProfiles']
    charts={(row['chart'],row['mode']):{int(k):v for k,v in row['matchedOpaqueFactors'].items()}
            for row in geometry['chartRows']}
    assert len(geometry['eikonalAndMeanTransport']['exactSourceChecks'])==10
    assert all(r['realCurlReducesToHalfAmplitudeOnPositiveFrameDomain']
               for r in primary['exactSameBody']['families'].values())
    scale=defaultdict(list)
    for row in primary['weightedQuotientLedger']['bounds']:
        epsilon=Q(row['epsilonPower'])+Q(row['inverseCarrierPower'],2)
        scale[row['role']].append(epsilon)
    roles={'u':min(min(v) for k,v in scale.items() if k.startswith('velocity')),
           'p':min(scale['pressureOverP']),'tail':min(scale['principalTailOverP']),'mean':Q(0)}
    assert roles=={'u':Q(1,2),'p':Q(1),'tail':Q(1,2),'mean':Q(0)}
    classes=defaultdict(list)
    grouped=Counter()
    for case in source['cases']:
        geometry_roles=charts[case['chart'],case['mode']]
        field_roles={r['root']:r['role'] for r in case['rawJetAtoms']}
        for scalar in case['scalars']:
            for coefficient,term in scalar['termsAfterFactoringPToMode']:
                assert Q(coefficient)!=0
                fields=tuple(sorted(field_roles[i] for i,n in term if i in field_roles for _ in range(n)))
                factors={geometry_roles[i] for i,n in term if i in geometry_roles}
                if case['mode']==1 and ('KPhaseTime' in factors or ('mean' in fields and factors&CARRIER)):
                    grouped[1]+=1
                    continue
                exponent=Q(0)
                for i,multiplicity in term:
                    assert multiplicity>0
                    if i in field_roles:
                        base=roles[field_roles[i]]
                    else:
                        entries=kind[geometry_roles[i]]['envelopesBySlowOrder']
                        base=min(Q(q[1])-Q(q[2])/2 for row in entries for q in row)
                    exponent+=multiplicity*base
                classes[case['mode'],fields].append(exponent)
    expected={(1,('mean','u')):(920,Q(1,2)-KAPPA),(1,('p',)):(70,Q(1,2)),
              (1,('tail',)):(30,Q(1,2)),(1,('u',)):(1700,Q(1,2)),
              (2,('u','u')):(1270,Q(1,2))}
    tally={k:(len(v),min(v)) for k,v in classes.items()}
    assert tally==expected and grouped=={1:360}
    returned=[{'mode':m,'fields':f,'monomials':n,'minimumEpsilon':str(e)}
              for (m,f),(n,e) in sorted(tally.items())]
    return {'status':'VERIFIED_POSITIVE_EPSILON_GRADES_FOR_CONDITIONAL_SOURCE_ENVELOPES',
            'inputPins':PINS,'unregroupedMonomials':returned,'reassociatedModeOneMonomials':360,
            'modeOneGaussianRateTermsAfterC90':{'scalars':60,'minimumEpsilon':'1/2'},
            'regroupedMinimumEpsilons':{'canceledEikonalRemainder':str(1-KAPPA),
                                       'independentConservativeRemainder':str(Q(1,2)-KAPPA)},
            'uniformFormalLowerGradeBothModes':str(Q(1,2)-KAPPA),
            'scope':'The original C91 operand and C92 geometry envelopes are hypotheses for the termwise arithmetic. Uses k<=2*epsilon^(-1/2) and k^-1<=sqrt(epsilon). Geometry uses the minimum of all admissible order-0..4 exponent rows. No S factor or radial pole is discarded and no field amplitude constant is evaluated.',
            'finalJets':0,'release':'HOLD'}


def main():
    assert __debug__
    parser=ArgumentParser(description=__doc__)
    for key in ('factor','geometry','primary','out'):
        parser.add_argument('--'+key,type=Path,required=True)
    a=parser.parse_args()
    result=verify(*(read(getattr(a,key),key) for key in ('factor','geometry','primary')))
    with a.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])


if __name__=='__main__':
    main()
