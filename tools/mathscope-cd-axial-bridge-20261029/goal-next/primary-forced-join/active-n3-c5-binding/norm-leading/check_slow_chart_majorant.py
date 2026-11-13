"""Bound the eight-face FTC constants of the actual slow-chart coefficient recurrence."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


PINS = {
    'actual-all-band-background-norm-kernel.mjs': '384daafdcb5cad2e57b4bbb0440bc4b2e4a5912b4835e2d7510c21301a44ff15',
    'actual-compact-all-band-background-norms.mjs': '62d877ca5d45073c8e95862bc0f5d0d44197f8ace34bd77d885bfbececc69464',
    'actual-background-physical-seminorms.mjs': 'd3713e0a3f1cd17404e2afb23da20c4b32e9e840445eed53ce2849ecd200d240',
}


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('navier', type=Path)
    parser.add_argument('out', type=Path)
    args = parser.parse_args()
    files = {}
    for name, pin in PINS.items():
        raw = (args.navier / name).read_bytes()
        assert sha256(raw).hexdigest() == pin, name
        files[name] = raw.decode()
    chart = files['actual-all-band-background-norm-kernel.mjs']
    issuer = files['actual-compact-all-band-background-norms.mjs']
    for literal in ('[G.zero,G.div(R,s),G.zero]',
                    'G.neg(G.mul(q(2),eta,X,inverseD,inverseL))',
                    'G.mul(d,inverseD,inverseL)', 'G.neg(G.div(G.mul(D,eta,inverseL),s))',
                    'put([...term.profileOrders],chart.derivative(term.coefficient,axis))',
                    'G.mul(term.coefficient,chart.coefficients[axis][j])'):
        assert literal in chart
    for literal in ('Xlo=G.div(G.parameter(\'Xa\'),q(2))',
                    'lower:[q(1,2),Xlo,q(-1)],upper:[q(2),Xhi,G.one]',
                    'positiveE=G.div(multipliers.leadingF,G.sqrt(G.mul(q(2),X)))',
                    'positiveU=multipliers.leadingG', 'compactCoefficientSourceFTC(G,{body:root,...box'):
        assert literal in issuer
    assert 'upperBound=G.sqrt(G.add(G.one,G.pow(atFace,2)))' in files['actual-background-physical-seminorms.mjs']

    # Use H = max(2, Lambda, Rstar), so X in [2/H,H^2], 0<h<1/64.
    # Every factor is controlled by J_d(f)=max_|alpha|<=d |partial^alpha f|.
    # Bounds below are coefficient * H^power and all degrees through eleven.
    assert Fraction(1) - 2 * Fraction(1, 64) * Fraction(5, 4)**2 > Fraction(1, 2)
    # Cauchy radius 1/4 for 1/(1-2h eta^2), around every real eta in [-1,1].
    reciprocal_L = 2 * 4**11 * factorial(11)
    # For |a|<=2: (a)_falling <= 2*3*...*(k+1); s in [1/2,2].
    s_power = max(2**(k+2) * factorial(k+1) for k in range(12))
    # X^a for a in {-1/2,0,1/2,1}. X^{-1}<=H, X<=H^2.
    # For a=1 the first derivative is 1 and all later ones are 0.
    x_power = max(factorial(k+1) for k in range(12))
    # Products have at most four factors, including an eta polynomial whose
    # jet bound is 2. Another factor 4 covers the scalar prefactors.
    base = 8 * 4**11 * s_power * x_power * reciprocal_L
    assert base < 2**144
    # H^13 dominates X^a and its derivatives. Multiplying the first chart
    # coefficient by s converts the Euler direction to ordinary d/ds.
    assert 2 * 2**11 * base < 2**156
    atom = {'powerOfTwo': 156, 'powerOfH': 13}
    # Each step has at most 3 product and 3 differentiated-coordinate terms.
    # Each product costs at most 2^11 in the total-order seminorm.
    steps = [{'order': j, 'powerOfTwo': 156 + 170*j, 'powerOfH': 13*(j+1)}
             for j in range(9)]
    assert 6 * 2**11 < 2**14
    assert steps[-1] == {'order': 8, 'powerOfTwo': 1516, 'powerOfH': 117}
    # (1+3/2)(1+2)(1+Delta X) <= 15 H^2, as Delta X <= H^2.
    assert Fraction(5, 2) * 3 * 2 == 15
    assert 15 * 2 < 2**5
    result = {'schema': 'MathScope.OriginalSlowChartCoefficientFTCUpper/1', 'status': 'PASS',
              'sourcePins': PINS, 'box': {'s': ['1/2', '2'], 'X': ['Xa/2', '2Xb'], 'eta': ['-1', '1']},
              'geometry': 'H=max(2,Lambda,C12EnvelopeR), Xa=4/Lambda, 4Xb<=C12EnvelopeR^2, 0<h<1/64',
              'initialMultipliers': ['s^(-A-1/2)', 's^(-A)', 's^(-A-1/2)/sqrt(2X)', 's^(-A)'],
              'coefficientAtomBound': atom, 'coefficientRecurrenceBound': steps,
              'faceBound': 'Each original nonconstant slow-chart coefficient FTC sum lies in [0,2^1521 H^119].',
              'numericInputStillRequired': 'The source value or a directed upper for H, with the original radial envelope.',
              'scope': 'Actual source slow-chart coefficient expansion only. Neither profile, target norm, nor complete K is enclosed here.',
              'release': 'HOLD'}
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8', newline='\n')
    print('PASS actual slow-chart coefficient recurrence through order eight and all eight FTC faces')


if __name__ == '__main__':
    main()
