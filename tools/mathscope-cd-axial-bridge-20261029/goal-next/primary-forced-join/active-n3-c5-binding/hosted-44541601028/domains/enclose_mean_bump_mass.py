"""Enclose the original mean normalization integral by exact directed sums."""

from argparse import ArgumentParser
from decimal import Decimal, ROUND_CEILING, ROUND_FLOOR, localcontext
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from pathlib import Path


DOMAIN_SHA256 = '9710a61866abf6f258c88a2f7678b28bfaba7d50d7f679c535cdde8442ee7d6c'
BIT_PRECISION = 128
DENOMINATOR = 2**BIT_PRECISION


def scaled_floor(value):
    numerator = value.numerator * DENOMINATOR
    return numerator // value.denominator


def scaled_ceiling(value):
    return -scaled_floor(-value)


def negative_exponential(exponent):
    """Enclose exp(-exponent) as two integers over the fixed dyadic denominator."""
    assert exponent >= 0
    if exponent >= BIT_PRECISION:
        return 0, 1
    squarings = 0
    while exponent > Fraction(1, 8):
        exponent /= 2
        squarings += 1

    partial, term = Fraction(1), Fraction(1)
    for degree in range(1, 20):
        term *= -exponent / degree
        partial += term
    # On [0,1/8], the degree-19 alternating sum is below the
    # exponential and the degree-18 sum is above it.
    lower, upper = scaled_floor(partial), scaled_ceiling(partial - term)
    assert 0 <= lower <= upper <= DENOMINATOR
    for _ in range(squarings):
        lower = lower * lower // DENOMINATOR
        upper = (upper * upper + DENOMINATOR - 1) // DENOMINATOR
    return lower, upper


@cache
def seed(u):
    assert 0 <= u <= Fraction(1, 2)
    if u == 0:
        return 0, 0
    return negative_exponential(1 / (u * (1 - u)))


def normalized_mass_bound(cells):
    """Sum monotone left and right rectangles on the symmetric half interval."""
    samples = [seed(Fraction(index, 2 * cells)) for index in range(cells + 1)]
    lower = sum(value[0] for value in samples[:-1])
    upper = sum(value[1] for value in samples[1:])
    scale = 10 * cells * DENOMINATOR
    return Fraction(lower, scale), Fraction(upper, scale)


def display(bound, rounding):
    with localcontext() as context:
        context.prec = 12
        context.rounding = rounding
        return str(Decimal(bound.numerator) / Decimal(bound.denominator))


def closed(lower, upper):
    return {
        'lowerExact': str(lower), 'upperExact': str(upper),
        'lowerDecimal': display(lower, ROUND_FLOOR), 'upperDecimal': display(upper, ROUND_CEILING),
    }


def main():
    assert __debug__, 'Exact directed arithmetic requires assertions.'
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('domains', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    data = args.domains.read_bytes()
    assert sha256(data).hexdigest() == DOMAIN_SHA256
    domains = json.loads(data)
    assert domains['meanMass']['root'] == 17743725
    assert domains['status'] == 'CONDITIONAL_POSITIVITY_OF_SAME_LIVE_DENOMINATORS_ON_ADMITTED_SOURCE_CHART'

    grids = {}
    prior = None
    for cells in (128, 512, 2048):
        lower, upper = normalized_mass_bound(cells)
        assert Fraction(1, 5000) < lower < upper
        if prior is not None:
            assert prior[0] < lower < upper < prior[1]
        grids[str(cells)] = closed(lower, upper)
        prior = lower, upper
    peak = seed(Fraction(1, 2))
    integer_comparison = 24**128 < 250 * 23**128
    assert integer_comparison
    result = {
        'schema': 'MathScope.N3.OriginalMeanBumpMassEnclosure/1',
        'status': 'CONDITIONAL_ORIGINAL_MEAN_BUMP_MASS_WITH_DIRECTED_RATIONAL_BOUNDS',
        'sourceDenominatorReceiptSHA256': DOMAIN_SHA256,
        'originalMassRoot': 17743725,
        'originalNormalization': '(1/10) integral_0^1 exp(-1/(u*(1-u))) du',
        'method': 'Symmetry, monotone Riemann sums, alternating rational exponential bounds '
                  'and outward rounded dyadic squaring.',
        'dyadicBits': BIT_PRECISION,
        'gridsOnHalfInterval': grids,
        'inverseMass': closed(1 / upper, 1 / lower),
        'scaledPeakNormalizedSeed': closed(Fraction(peak[0], DENOMINATOR) / upper,
                                          Fraction(peak[1], DENOMINATOR) / lower),
        'simpleIntegerMargin24Pow128Below250Times23Pow128': integer_comparison,
        'conditions': 'The original admitted slow chart and the source whole-envelope '
                      'change of variables in the attached denominator audit apply.',
        'release': 'HOLD',
    }
    with args.output.open('x', encoding='utf-8', newline='\n') as file:
        json.dump(result, file, indent=2)
        file.write('\n')
    print(json.dumps({'mass': grids['2048'], 'inverseMass': result['inverseMass']}))


if __name__ == '__main__':
    main()
