"""Exact dyadic log/exp enclosures for a pinned arbitrary rational exponent."""
from fractions import Fraction as F
from functools import lru_cache
from dyadic_interval import I, exp_negative


def _atanh_log(m):
    z=(m-1)/(m+1);z2=z*z;term=z;total=I(0)
    count=40
    for n in range(count):
        total=total+term/(2*n+1)
        term=term*z2
    tail=2*term/((2*count+1)*(1-z2))
    return I(2*total.lo,2*total.hi+tail.hi,raw=True)


LOG2=_atanh_log(I(2))


@lru_cache(maxsize=16384)
def _log_point(x):
    x=F(x)
    if x<=0:raise ValueError('positive argument required')
    k=x.numerator.bit_length()-x.denominator.bit_length()
    m=x/(F(2)**k)
    while m<1:m*=2;k-=1
    while m>=2:m/=2;k+=1
    return _atanh_log(I(m))+k*LOG2


def log_interval(x):
    x=I(x)
    if x.lo<=0:raise ValueError('log interval contains zero')
    a,b=_log_point(x.lower()),_log_point(x.upper())
    return I(a.lo,b.hi,raw=True)


def _exp_point(x):
    x=F(x)
    return exp_negative(I(-x)) if x<=0 else exp_negative(I(x)).reciprocal()


def exp_interval(x):
    x=I(x)
    a,b=_exp_point(x.lower()),_exp_point(x.upper())
    return I(a.lo,b.hi,raw=True)


def power_general(x,exponent):
    return exp_interval(F(exponent)*log_interval(x))
