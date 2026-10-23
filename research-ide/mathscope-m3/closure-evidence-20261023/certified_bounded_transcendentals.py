#!/usr/bin/env python3
"""Rational outward enclosures for bounded exp/log/sqrt SourceExpressions values.

These prove finite-point function enclosures from exact rational input intervals
via Taylor remainder / geometric tail / integer-square-root bracketing.
They are NOT the pinned MathScope source h, nor a completed native evaluator
for Volterra, pulse ODE, infinite Fourier limits, or final physical 67 jets.
"""
from fractions import Fraction
from math import factorial,isqrt
from rigorous_rational_intervals import Interval,UncertifiedExpression

def _allow(x,max_magnitude=16):
    if not isinstance(x,Interval):
        raise UncertifiedExpression('Must receive an exact rational input interval')
    if max(abs(x.lo),abs(x.hi))>max_magnitude:
        raise UncertifiedExpression('Exact source argument too large for bounded rational transcendental proof')
def _positive_exp_endpoint(x,N):
    if not isinstance(x,Fraction) or x<0:
        raise UncertifiedExpression('Positive rational exponential endpoint required')
    if x==0:return Interval(Fraction(1),Fraction(1))
    halfings=0;t=x
    while t>Fraction(1,2):
        t/=2;halfings+=1
    s=sum((t**j)/factorial(j) for j in range(N+1))
    # Tail bound: the ratio between consecutive omitted terms is at most t/(N+2).
    rem=t**(N+1)/factorial(N+1)/(1-t/Fraction(N+2))
    y=Interval(s,s+rem)
    for _ in range(halfings):y=y*y
    return y

def exp_positive_bounded(x,terms=20):
    _allow(x)
    if type(terms) is not int or not 6<=terms<=128:
        raise UncertifiedExpression('Fixed Taylor order 6 through 128 only')
    def endpoint(q):
        if q>=0:return _positive_exp_endpoint(q,terms)
        return _positive_exp_endpoint(-q,terms).reciprocal()
    lo=endpoint(x.lo).lo;hi=endpoint(x.hi).hi
    return Interval(lo,hi)

def log_positive_bounded(x,terms=24):
    if not isinstance(x,Interval) or x.lo<Fraction(1,2) or x.hi>2:
        raise UncertifiedExpression('Log Taylor enclosure implemented only for [1/2,2]')
    if type(terms) is not int or not 4<=terms<=128:
        raise UncertifiedExpression('Log finite geometric-tail order required')
    def endpoint(q):
        t=(q-1)/(q+1)
        if t==0:return Interval(Fraction(0),Fraction(0))
        s=2*sum(t**(2*k+1)/Fraction(2*k+1) for k in range(terms+1))
        # artanh tail: |2 sum_{k>terms} t^{2k+1}/(2k+1)|
        # <= 2 |t|^{2 terms+3}/((2 terms+3)(1-t^2))
        rem=2*abs(t)**(2*terms+3)/(Fraction(2*terms+3)*(1-t*t))
        return Interval(s-rem,s+rem)
    return Interval(endpoint(x.lo).lo,endpoint(x.hi).hi)

def sqrt_positive_bounded(x,bits=64):
    if not isinstance(x,Interval) or x.lo<0 or x.hi>16:
        raise UncertifiedExpression('Sqrt is only certified for rational input [0,16]')
    if type(bits) is not int or not 8<=bits<=256:
        raise UncertifiedExpression('Dyadic enclosure precision must be 8..256 bits')
    scale=1<<bits
    def endpoint(q):
        numerator=q.numerator*scale*scale;den=q.denominator
        k=isqrt(numerator//den)
        l=Fraction(k,scale)
        h=l if k*k*den==numerator else Fraction(k+1,scale)
        return Interval(l,h)
    return Interval(endpoint(x.lo).lo,endpoint(x.hi).hi)
