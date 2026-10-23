#!/usr/bin/env python3
"""Paper (6.2), (6.7), (8.19): exact-rational finite Fourier torus inverse.

vt=(sqrt(2)-1,1), period-one T², mean-zero real modes.
Proof boundaries: input coefficients MUST be independently certified; the
four-derivative tail bound is conditional on a source-proven norm bound.
Nothing here authenticates native m3_coupled_inverse_partial, all-j stages,
or actual 67 final-field jets.
"""
from math import isqrt, factorial
from fractions import Fraction as Q
from functools import lru_cache
from rigorous_rational_intervals import Interval,UncertifiedExpression

def const(x):
    x=Q(x);return Interval(x,x)

@lru_cache(None)
def sqrt2_bracket(bits=96):
    if type(bits) is not int or not 16<=bits<=512:raise UncertifiedExpression('sqrt2 dyadic bits outside 16..512')
    d=1<<bits;k=isqrt(2*d*d)
    return Interval(Q(k,d),Q(k+1,d))

def atan_reciprocal(q,terms):
    if type(q) is not int or q<2 or type(terms) is not int or not 8<=terms<=256:
        raise UncertifiedExpression('Invalid rational arctan series')
    x=Q(1,q);s=sum(((-1)**j*x**(2*j+1))/Q(2*j+1) for j in range(terms))
    e=x**(2*terms+1)/Q(2*terms+1)
    return Interval(s,s+e) if terms%2==0 else Interval(s-e,s)

@lru_cache(None)
def pi_bracket(terms=40):
    # Machin: pi/4 = 4 arctan(1/5)-arctan(1/239).
    p=const(16)*atan_reciprocal(5,terms)-const(4)*atan_reciprocal(239,terms)
    if not Q(3)<p.lo<=p.hi<Q(22,7):raise UncertifiedExpression('Pi enclosure failed')
    return p

def inverse_direction_multiplier(k0,k1,sqrt2=None,pi=None):
    if type(k0) is not int or type(k1) is not int or (k0==0 and k1==0) or max(abs(k0),abs(k1))>100000:
        raise UncertifiedExpression('Only nonzero bounded integer frequencies')
    s=sqrt2 if sqrt2 is not None else sqrt2_bracket()
    p=pi if pi is not None else pi_bracket()
    a=k1-k0;b=k0;d=a*a-2*b*b
    if d==0:raise AssertionError('Integer Pell norm vanished for nonzero frequency')
    # (a+sqrt2*b)^(-1) = (a-sqrt2*b)/(a²-2b²), where a=k1-k0, b=k0.
    return ((const(a)-const(b)*s)/const(d))/(const(2)*p)

def parse_key(k):
    if not isinstance(k,str):raise UncertifiedExpression('Expected canonical k0,k1')
    a=k.split(',')
    if len(a)!=2 or any(not x or x.startswith('+') for x in a):
        raise UncertifiedExpression('Invalid torus frequency')
    try:x,y=map(int,a)
    except ValueError as e:raise UncertifiedExpression('Invalid torus frequency') from e
    if k!=f'{x},{y}':raise UncertifiedExpression('Noncanonical torus frequency')
    return x,y

def inverse_finite_real_fourier_modes(source_modes,precision=96,max_modes=500):
    if not isinstance(source_modes,dict) or not source_modes or len(source_modes)>max_modes:
        raise UncertifiedExpression('Provide finite real Fourier source spectrum')
    c={}
    for key,value in source_modes.items():
        k=parse_key(key)
        if not isinstance(value,dict) or set(value)!={'re','im'}:
            raise UncertifiedExpression('Require certified real/imag coefficient intervals')
        c[k]=(Interval.parse(value['re']),Interval.parse(value['im']))
    z=const(0)
    if (0,0) in c and c[(0,0)]!=(z,z):
        raise UncertifiedExpression('Nonzero Haar mean cannot be inverted')
    for (a,b),(re,im) in c.items():
        if not (a or b):continue
        if (-a,-b) not in c:raise UncertifiedExpression('Conjugate Fourier mode missing')
        rr,ii=c[-a,-b]
        if rr!=re or ii!=-im:raise UncertifiedExpression('Non-real Fourier spectrum')
    s=sqrt2_bracket(precision);p=pi_bracket();out={}
    for (a,b),(re,im) in sorted(c.items()):
        if not (a or b):continue
        q=inverse_direction_multiplier(a,b,s,p)
        # (re+i im)/(2*pi*i*(vt·k)) = (im-i re)/(2*pi*(vt·k))
        out[f'{a},{b}']={'re':(im*q).json(),'im':((-re)*q).json()}
    return {'schema':'MathScope.M3.ConditionalPaperEq819TorusInverse/1',
        'torus_direction':'(sqrt(2)-1,1)','period':'1',
        'zero_mean_checked':True,'conjugacy_checked':True,
        'output_coefficients':out,'numeric_input_mode_count':len(out),
        'source_coefficients_independently_authenticated_here':False,
        'infinite_fourier_tail_certified':False,
        'actual_original_inverse_operator_source_body_certified':False,
        'actual_original_final_field_jet_intervals_certified':0,
        'scope':'FINITE_FOURIER_MODE_ENCLOSURES_ONLY','release':'HOLD'}

def conditional_Cm_fourier_tail_bound(m,K,source_m_plus4_supnorm):
    """For smooth periodic mean-zero F, ||tail||_{C^m} <= 7 M/(1944 K).
    M must independently bound max |d^alpha F| for |alpha|=m+4.
    Proof: |vt.k|^-1 <= (2+sqrt2) n < (7/2)n; 8n shell modes;
    (2*pi)^-5 <= 6^-5; sum_{n>K} n^-2 <= 1/K.
    """
    if type(m) is not int or not 0<=m<=256 or type(K) is not int or K<1:
        raise UncertifiedExpression('Finite derivative order and positive cutoff required')
    if isinstance(source_m_plus4_supnorm,(bool,float)) or not isinstance(source_m_plus4_supnorm,(str,int,Q)):
        raise UncertifiedExpression('Source-proven rational majorant required')
    M=Q(source_m_plus4_supnorm)
    if M<0:raise UncertifiedExpression('Nonnegative majorant required')
    return {'schema':'MathScope.M3.ConditionalEq819FourDerivativeTail/1',
        'm':m,'K':K,'input_Cm_plus4_supnorm':str(M),
        'tail_Cm_upper_bound':str(Q(7,1944*K)*M),
        'actual_source_Cm_plus4_bound_proven_by_this_kernel':False,
        'actual_all_order_tail_certified':False,'release':'HOLD'}
