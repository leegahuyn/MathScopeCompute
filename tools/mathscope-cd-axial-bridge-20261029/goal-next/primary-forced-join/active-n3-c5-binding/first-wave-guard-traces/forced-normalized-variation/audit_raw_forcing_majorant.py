"""Build explicit absolute coefficient caps from the exact normalized Forced source."""

from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json


PINS = {
    'source': 'dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d',
    'variation': 'c3ec1fb8ea1bf30ec18c09111440099e921a26c3417d5a47e083e5aa6e85dc37',
}


def load(path,name):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==PINS[name], path
    return json.loads(data)


def component_groups(component, indexed_atoms, mode):
    total=defaultdict(Q)
    normalized_derivative_slots=defaultdict(set)
    for scalar, monomial in component['termsAfterFactoringPToMode']:
        eps=0
        other=0
        roles=[]
        for atom,multiplicity in monomial:
            if atom==17732744:
                eps=multiplicity
                continue
            if atom not in indexed_atoms:
                other+=abs(multiplicity)
                continue
            assert multiplicity>0
            row=indexed_atoms[atom]
            role=row['role']
            orders=tuple(row['orders'])
            if row['factorDegree']:
                normal=[jet for jet in row['normalizedDerivativeTerms'] if jet['normalizedPulseDerivativeOrder']==0]
                assert len(normal)==1 and normal[0]['coefficient']==1
                assert tuple(normal[0]['normalizedLeafOrders'])==orders and not normal[0]['affinePulseGradientPowers']
            else:
                assert role=='mean'
            roles.extend((role,sum(orders)) for _ in range(multiplicity))
            normalized_derivative_slots[role].add(orders)
        assert eps>=0
        assert sum(role!='mean' for role,_ in roles)==mode
        total[(tuple(sorted(roles)),eps,other)]+=abs(Q(scalar))
    rate=component['gaussianRatePartBeforeProjection']
    if mode==1:
        assert rate['coefficient']=='r' and rate['normalizedPrimaryVelocity'].startswith('coupled-expression:')
        # Retain the only nonzero explicit P' term after the exact cancellations.
        total[((('rate',0),('u',0)),0,0)]+=1
    else:
        assert rate is None
    return total,normalized_derivative_slots


def verify(args):
    source=load(args.source,'source')
    variation=load(args.variation,'variation')
    assert source['projectedCheckedByMode']=={'1':60,'2':60}
    assert source['rateTermsAfterExactRawCancellation']['mode2']=='All explicit Gaussian rate terms cancel.'
    matrices={(r['key'],r['mode'],r['system'],r['pulse']) for r in variation['nativeSystems']}
    assert matrices=={(r['chart'],r['mode'],r['system'],r['nativePulseVariable']) for r in source['cases']}
    all_groups={m:defaultdict(Q) for m in (1,2)}
    qty=defaultdict(int)
    requests=defaultdict(set)
    for case in source['cases']:
        mode=case['mode']
        atoms={r['root']:r for r in case['rawJetAtoms']}
        assert len(atoms)==len(case['rawJetAtoms'])
        for comp in case['scalars']:
            values, slots=component_groups(comp,atoms,mode)
            for kind,coefficient in values.items():
                all_groups[mode][kind]=max(all_groups[mode][kind],coefficient)
            qty[mode]+=len(comp['termsAfterFactoringPToMode'])
            for name,orders in slots.items():
                requests[name].update(orders)
    assert qty=={1:3080,2:1270}
    assert max(map(sum,requests['u']))==2 and max(map(sum,requests['p']))==1
    assert max(map(sum,requests['tail']))==0 and max(map(sum,requests['mean']))==1
    assert {tuple(sorted(r for r,_ in roles)) for roles,_,_ in all_groups[1]}=={
        ('u',),('p',),('tail',),('mean','u'),('rate','u'),
    }
    assert {tuple(sorted(r for r,_ in roles)) for roles,_,_ in all_groups[2]}=={('u','u')}

    def output(mode, groups):
        result=[]
        for (roles,explicit_eps,other),coef in sorted(groups.items()):
            factor_count=len(roles)+other
            derivative_multipliers=[str(coef*factor_count**j) for j in range(5)]
            result.append({'fieldsAndRawOrders':roles,'explicitFrozenEpsilonPower':explicit_eps,
                           'otherCoefficientFactorCount':other,'positiveCoefficient':str(coef),
                           'maximumMultinomialCoefficientSumThroughOrderFour':derivative_multipliers})
        assert result
        return result

    return {'schema':'MathScope.C90.ForcedRawPositiveCoefficientMajorant/1',
            'inputPins':PINS,'unprojectedScalars':120,'baseNormalizedExactMonomials':dict(qty),
            'firstAndSecondModeCoefficientGroups':{str(m):output(m,d) for m,d in all_groups.items()},
            'normalizedFieldRawTotalOrders':{name:sorted({sum(o) for o in orders})
                                             for name,orders in requests.items()},
            'application':('For each row with explicit frozen epsilon exponent e, multiply epsilon^e and the indicated '
                           'product of actual normalized field and other-operand upper envelopes. The order-j '
                           'constant is the coefficient times the number of distributed factors to the power j. '
                           'Field norms must cover the listed raw orders and the distributed j derivatives; '
                           'coefficient norms must include reciprocals and all pullbacks. The only explicit '
                           'remaining pulse rate r=lambda-d_ref is kept as its own factor.'),
            'scope':{'onlyExplicitEpsilonPowersSeparated':True,'implicitEpsilonInSourceOperandsRetained':True,
                     'absoluteCoefficientBoundOnSameRawForcingOperands':True,
                     'provenNumericalUniformNorm':False},
            'finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser(description=__doc__)
    for field in ('source','variation','out'):
        parser.add_argument('--'+field,type=Path,required=True)
    args=parser.parse_args()
    if not __debug__:
        parser.error('Python assertions are required')
    result=verify(args)
    with args.out.open('x',encoding='utf-8',newline='\n') as file:
        json.dump(result,file,indent=2)
        file.write('\n')
    print(result['schema'])
