"""Exact scalar inverse leaves on one fixed complex eta stadium.

These leaves certify a recognized polynomial only. The caller must independently
bind it to an authenticated source operand; they do not close a global guard or
establish any natural-series, coefficient-norm, or Picard-existence premise.
In particular the disk |eta|<5/4 contains the poles of 1/(1+eta^2).
"""
from fractions import Fraction as F

DOMAIN = 'complex eta with dist(eta,[-1,1])<1/4; real 0<h<1/100'
RADIUS = F(1, 4)
H_MAX = F(1, 100)
ETA_ABS_MAX = 1 + RADIUS


def _canonical(poly):
    if not isinstance(poly, dict):
        return None
    out = {}
    for key, value in poly.items():
        if (not isinstance(key, tuple) or len(key) != 2
                or any(type(power) is not int or power < 0 for power in key)
                or not isinstance(value, F)):
            return None
        if value:
            out[key] = value
    return out


def certify_inverse(poly):
    """Return a fixed-domain exact proof leaf, or None for an unreviewed input.

    Polynomial coefficients must be Fraction values indexed by (h, eta) powers.
    A source ID, serialized proof label, or numeric sample cannot supply a proof.
    """
    poly = _canonical(poly)
    if poly is None:
        return None
    label = None
    if poly == {(0, 0): F(1), (1, 2): F(-2)}:
        correction = 2 * H_MAX * ETA_ABS_MAX ** 2
        lower = 1 - correction
        proof = ('|eta|<5/4 and |2*h*eta^2|<1/32; the reverse triangle '
                 'inequality gives |1-2*h*eta^2|>31/32.')
        label = 'N6-PB-L-NONZERO-STADIUM-QUARTER'
    elif poly == {(0, 0): F(1), (0, 2): F(1)}:
        # Each pole +/-i has distance 1 from the real segment. If x on the
        # segment obeys |eta-x|<1/4, then |eta+/-i| >= |x+/-i|-|eta-x|>3/4.
        lower = (1 - RADIUS) ** 2
        proof = ('Choose x in [-1,1] with |eta-x|<1/4. Since |x-i|>=1 '
                 'and |x+i|>=1, |eta-i|>3/4 and |eta+i|>3/4. '
                 'Thus |1+eta^2|=|eta-i|*|eta+i|>9/16.')
        label = 'N6-PB-ONE-PLUS-ETA-SQUARED-STADIUM-QUARTER'
    elif poly == {(0, 0): F(1), (1, 0): F(-1)}:
        lower = 1 - H_MAX
        proof = 'Real 0<h<1/100 gives |1-h|=1-h>99/100.'
        label = 'N6-PB-ONE-MINUS-H-POSITIVE'
    elif poly == {(0, 0): F(1), (1, 0): F(2)}:
        lower = F(1)
        proof = 'Real h>0 gives |1+2*h|=1+2*h>1.'
        label = 'N6-PB-ONE-PLUS-TWO-H-POSITIVE'
    else:
        return None
    if lower <= 0:
        raise AssertionError('A recognized leaf must have a positive lower bound')
    return {
        'proofID': label,
        'domain': DOMAIN,
        'operandAbsStrictLower': str(lower),
        'inverseAbsStrictUpper': str(1 / lower),
        'exactProof': proof,
        'sourceParameterHBoundIsHypothesis': True,
        'sourceNodeBindingRequired': True,
        'finitePointSampleUsed': False,
        'nativeA0A1ForcingNormProvedByThisLeaf': False,
        'globalGuardOfficiallyClosedByThisLeaf': False,
    }
