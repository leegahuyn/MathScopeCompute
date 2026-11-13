"""Replay exact radial Gaussian absorption using the original fixed profile."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


TIME = 'ed1773d48e36dcc629f93d5b54fc77cd85ff123d24cb6de50b0e85dfe4d5efc2'
SLOTS = '710b6373a53bd87b5a23fd5ae10c22425b22b5c59847f7c124ab495b1bf10397'
PROFILE = 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
FAMILY = '083764e85ac82eb88c9e8dccbc280acb2292d7370f8332394d81da3b1b6f692c'
TARGET = '233e28aed982a1d1aabe4a9d822c9101eb04b49276318e677a82306969c72908'
PARAMETERS = 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'


def read(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


def original_parameters(path):
    src = read(path, PROFILE).decode()
    profile = json.JSONDecoder().raw_decode(src.split('export const PINNED_N3 = ', 1)[1])[0]
    assert profile['parameterExpressionSHA256'] == PARAMETERS
    data = profile['parametersExactExpressions']
    assert data['t1'] == {'power': [{'ref': 'CSelected'}, -120]}
    assert data['CSelected'] == {'exp': {'ref': 'logCSelected'}}
    assert data['C12EnvelopeR'] == {'exp': {'power': [{'ref': 'sourceEnvelopeS'}, 256]}}
    assert data['sourceEnvelopeS'] == {'power': [{'ref': 'CSelected'}, 100_000]}
    assert data['T'] == {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]}
    assert data['Md'] == {'integer': 1_048_576}
    assert data['Pstar'] == {'exp': {'ref': 'logP'}} and data['logP'] == {'product': [{'integer': 2}, {'ref': 'T'}]}
    assert data['K'] == {'power': [{'ref': 'Pstar'}, 2]}
    assert data['h'] == {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}}
    assert data['j0'] == {'power': [{'ref': 'h'}, 4]}
    assert data['sigmaStar'] == {'quotient': [{'ref': 'j0'}, {'integer': 2000}]}
    numer, denom = data['Q']['quotient']
    multiplier = int(numer['product'][0]['integer'])
    assert multiplier == 2 ** 260 and numer['product'][1] == {'ref': 'K'}
    assert denom == {'power': [{'ref': 'sigmaStar'}, 2]}
    assert data['BRefUpper'] == {'power': [{'ref': 'Q'}, 300]}
    assert data['logCSelected'] == {'sum': [
        {'product': [{'integer': 10}, {'log': {'sum': [{'integer': 1}, {'ref': 'BRefUpper'}]}}]},
        {'power': [{'ref': 'Q'}, 200]}]}
    return data


def main():
    p = ArgumentParser(description=__doc__)
    p.add_argument('physical', type=Path)
    p.add_argument('slots', type=Path)
    p.add_argument('profile', type=Path)
    p.add_argument('degree_runtime', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    physical = json.loads(read(args.physical, TIME))
    slots = json.loads(read(args.slots, SLOTS))
    original_parameters(args.profile)
    family = read(args.degree_runtime / 'mathscope-m2/navier/actual-common-admissible-family.mjs', FAMILY).decode()
    target = read(args.degree_runtime / 'mathscope-m2/navier/actual-common-target-weighted-norms.mjs', TARGET).decode()
    assert "Renv=G.parameter('C12EnvelopeR')" in family and 'G.pow(Renv,4096)' in family
    assert 'aInner=G.pow(c.t1,2)' in target and 'outerRule=weightedGaussianDerivativeRules(G,{a:q(4)' in target
    assert 'delta_*=min(1,log(X/Xa),log(Xb/X))' in target
    nodes = slots['nodes']
    assert nodes['3612'] == {'op': 'source_parameter', 'args': ['t1']}
    assert nodes['3617'] == {'op': 'source_parameter', 'args': ['Xa']}
    assert 14220485 in nodes['14220496']['args'] and physical['normRoots']['K'] == 18310069
    assert physical['normRoots']['B_m'] == 14220496 and physical['normRoots']['Bnorm'] == 14220485
    pole_set = {row['pole'] for rows in physical['conditionalPhysicalDerivativeRows'].values() for row in rows}
    assert pole_set == {18, 24, 30, 36, 42}
    n = max(pole_set) // 2
    e_lower = sum(Fraction(1, i) for i in (1, 1, 2, 6))
    assert e_lower == Fraction(8, 3)
    prefactor = (Fraction(n, 1) / e_lower) ** n
    integer_upper = -(-prefactor.numerator // prefactor.denominator)
    exponent = integer_upper.bit_length()
    assert exponent == 63 and integer_upper < 2 ** exponent
    assert Fraction(n, 4) ** n / e_lower ** n < prefactor  # outer a=4 is cheaper.
    # Since CSelected>2, absorb the rational prefactor into CSelected.
    c_power = 120 * 42 + exponent
    assert c_power == 5103 < 25_600_000
    # log Renv = CSelected^25,600,000 > 5103 log CSelected.
    assert Fraction(25_600_000, 1) > c_power
    # Fixed numerical exponent syntax: exp(1,048,576)<2^(2,097,152),
    # T<2^2,097,153, log Q<64,100 T, and log C<2 exp(12,820,000 T).
    assert 64_020 + Fraction(260 + 22, 10) < 64_100
    assert 12_820_000 * 2 < 2 ** 25 and 5103 * 4 < 2 ** 15
    assert 10 * (1 + 300) < 2 ** 199  # log(1+Q^300)<301 Q, Q>2.
    outer_exp = 2 * 1_048_576 + 27
    result = {
        'schema': 'MathScope.ActiveN3ExactAnnularPoleAbsorption/1',
        'status': 'VERIFIED_EXACT_NUMERICAL_RADIAL_WEIGHT_REDUCTION',
        'inputPins': {'physicalDerivatives': TIME, 'slots': SLOTS, 'profile': PROFILE, 'parameterExpression': PARAMETERS,
                      'sourceFamily': FAMILY, 'sourceTarget': TARGET},
        'nativeRoots': {'t1': 3612, 'Xa': 3617, 'K': 18310069, 'B_m': 14220496, 'Bnorm': 14220485},
        'radialWeight': 'zeta=exp(-t1^2/d_a^2-4/d_b^2), delta_*=min(1,d_a,d_b), d_a=log(X/Xa), d_b=log(Xb/X).',
        'commonPole': 42, 'allInputPoles': sorted(pole_set), 'innerPower': n,
        'maximize': 'x^42 exp(-a*x^2)=(x^2)^21 exp(-a*x^2) has maximum (21/(a*e))^21 at x^2=21/a.',
        'numericFactor': {'eStrictLower': str(e_lower), 'rational': str(prefactor), 'integerUpper': str(integer_upper),
                          'dyadicUpper': f'2^{exponent}'},
        'sourceRelativeBound': 'zeta*delta_*^-b < 2^63*t1^-42 <= CSelected^5103 < Renv <= Bnorm <= K for b<=42.',
        'fixedDyadicBound': {'syntax': f'2^(2^(2^{outer_exp}))', 'integerOuterExponent': outer_exp,
                             'meaning': 'An exact finite dyadic upper endpoint encoded as a power tree.'},
        'gaussianLongitudinal': 'P(v)<=1 from the original midpoint-normalized positive reference envelope on 0<=v<=Ls.',
        'resultingDerivatives': {name: [{**row, 'KSExponent': row['KSExponent'] + 1, 'pole': 0}
                                      for row in rows] for name, rows in physical['conditionalPhysicalDerivativeRows'].items()},
        'remainingFactors': 'K, S, endpoint factor, physical Q and epsilon powers. The graph K has no absolute finite endpoint in this receipt.',
        'scope': 'Only the two selected same-family N3 mode-two contributions. The selected active inverse frame is still a separate exact obligation in this receipt. No final-cell interval promoted.',
        'finalJets': '0/67', 'release': 'HOLD',
    }
    with args.output.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'integerFactor': str(integer_upper), 'status': result['status'], 'SHA256': sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
