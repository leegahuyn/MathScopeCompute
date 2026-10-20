"""Dedicated exact attempts on the 59 original guards left after Stage C.

Bound integration variables on their actual compact fibers; prove the original
Q-terminal normalization positive, and audit opaque substitutions as identities
of partial functions. Local inverse-chart statements do not grant membership of
all global source calls. No graph producer, samples or floating point values.
"""
from __future__ import annotations
from collections import Counter
from dataclasses import dataclass, field
from fractions import Fraction as Q
import copy
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import time

from guard_worker import (PARENT,PROFILE_SHA,STEP_SHA,Parameters,ScalarProof,
    actual_global_attempts,canonical,find,file_sha,read,sha,step_lemma,write)


class SourceIntegrityError(Exception):
    """Input authentication failure, never a mathematical unresolved row."""


@dataclass
class Bound:
    lo: Q|None=None
    hi: Q|None=None
    ls: bool=False
    hs: bool=False
    finite: bool=False
    smooth: bool=False
    support: set=field(default_factory=set)
    stops: set=field(default_factory=set)
    reasons: tuple=()

    def positive(self):return self.finite and self.lo is not None and (self.lo>0 or self.lo==0 and self.ls)
    def negative(self):return self.finite and self.hi is not None and (self.hi<0 or self.hi==0 and self.hs)
    def nonzero(self):return self.positive() or self.negative()
    def nonnegative(self):return self.finite and self.lo is not None and self.lo>=0
    def exact(self):return self.lo if self.finite and self.lo is not None and self.lo==self.hi else None
    def data(self):
        return {'lower':None if self.lo is None else str(self.lo),'upper':None if self.hi is None else str(self.hi),
            'lowerStrict':self.ls,'upperStrict':self.hs,'finite':self.finite,'CInfinityOnCertifiedDomain':self.smooth,
            'sourceCoordinateSupport':sorted(self.support),'unproved':sorted(self.stops),'proofRules':list(self.reasons)}


def const(x):
    x=Q(x);return Bound(x,x,finite=True,smooth=True,reasons=('exact rational',))


def unknown(reason,support=()):return Bound(support=set(support),stops={reason})


def merged(values):
    return {'finite':all(v.finite for v in values),'smooth':all(v.smooth for v in values),
            'support':set().union(*(v.support for v in values)),
            'stops':set().union(*(v.stops for v in values))}


def plus(values):
    m=merged(values)
    lo=sum((v.lo for v in values),Q()) if all(v.lo is not None for v in values) else None
    hi=sum((v.hi for v in values),Q()) if all(v.hi is not None for v in values) else None
    return Bound(lo,hi,lo is not None and any(v.ls for v in values),hi is not None and any(v.hs for v in values),
        **m,reasons=('exact interval addition',))


def negative(v):
    return Bound(None if v.hi is None else -v.hi,None if v.lo is None else -v.lo,
        v.hs,v.ls,v.finite,v.smooth,set(v.support),set(v.stops),('exact sign reversal',))


def times(values):
    if not values:return const(1)
    out=values[0]
    for b in values[1:]:
        a=out;m=merged([a,b])
        if a.lo is not None and a.hi is not None and b.lo is not None and b.hi is not None:
            products=[a.lo*b.lo,a.lo*b.hi,a.hi*b.lo,a.hi*b.hi]
            lo,hi=min(products),max(products)
            # Endpoint strictness is required only for strict signs here;
            # retaining closed finite extrema is conservative.
            ls=lo==0 and ((a.positive() and b.positive()) or (a.negative() and b.negative()))
            hs=hi==0 and ((a.positive() and b.negative()) or (a.negative() and b.positive()))
        elif a.nonnegative() and b.nonnegative():
            lo=a.lo*b.lo;hi=None;ls=lo==0 and a.positive() and b.positive();hs=False
        elif a.negative() and b.negative():
            out=times([negative(a),negative(b)]);continue
        elif (a.negative() and b.nonnegative()) or (b.negative() and a.nonnegative()):
            out=negative(times([negative(a) if a.negative() else a,negative(b) if b.negative() else b]));continue
        else:lo=hi=None;ls=hs=False
        out=Bound(lo,hi,ls,hs,**m,reasons=('exact interval product',))
    return out


def inv(v):
    if not v.nonzero():return unknown('denominator nonzero on the entire actual fiber not proved',v.support)
    if v.negative():return negative(inv(negative(v)))
    lo=Q(0) if v.hi is None else 1/v.hi
    hi=None if v.lo==0 else 1/v.lo
    return Bound(lo,hi,v.hi is None or v.hs,v.ls if hi is not None else False,
        v.finite,v.smooth,set(v.support),set(v.stops),('positive reciprocal',))


def power(v,n):
    if n==0:return const(1)
    if n<0:return power(inv(v),-n)
    if v.exact() is not None and n*max(v.lo.numerator.bit_length(),v.lo.denominator.bit_length())<4096:
        return const(v.lo**n)
    if n%2==0 and not v.nonnegative():
        if v.negative():return power(negative(v),n)
        hi=None if v.lo is None or v.hi is None else max(abs(v.lo),abs(v.hi))**n
        return Bound(Q(0),hi,False,False,v.finite,v.smooth,set(v.support),set(v.stops),('even integer power nonnegative',))
    lo=None if v.lo is None else v.lo**n
    hi=None if v.hi is None else v.hi**n
    return Bound(lo,hi,v.ls,v.hs,v.finite,v.smooth,set(v.support),set(v.stops),('integer power monotonicity',))


class FiberProof:
    def __init__(self,program,expressions,max_work=200000):
        self.program=program;self.params=Parameters(expressions);self.memo={};self.work=0;self.max_work=max_work
        self.parameter_names={i:n['args'][0] for i,n in enumerate(program) if n['op']=='source_parameter'}
        self.affine_cache={};self.integral_certificates={}
        try:parameter_theorem(expressions);self.hierarchy_verified=True
        except ValueError:self.hierarchy_verified=False

    def affine(self,i):
        if i in self.affine_cache:return self.affine_cache[i]
        n=self.program[i];op=n['op'];a=n['args'];out=None
        if op=='rational':out={'1':Q(int(a[0]),int(a[1]))}
        elif op=='source_parameter' and a[0] in ['h','lambda']:out={a[0]:Q(1)}
        elif op=='add':
            ps=[self.affine(j) for j in a]
            if all(x is not None for x in ps):
                out={}
                for p in ps:
                    for k,v in p.items():out[k]=out.get(k,Q())+v
        elif op=='multiply':
            ps=[self.affine(j) for j in a];scale=Q(1);variable=None
            if all(x is not None for x in ps):
                for p in ps:
                    if set(p)<={'1'}:scale*=p.get('1',0)
                    elif variable is None:variable=p
                    else:break
                else:out={k:scale*v for k,v in (variable or {'1':Q(1)}).items()}
        self.affine_cache[i]=out;return out

    def ordered_affine_positive(self,i):
        if not self.hierarchy_verified:return False
        p=self.affine(i)
        if p is None:return False
        # lambda=h+(lambda-h), with both h and lambda-h strictly positive.
        coefficients=[p.get('1',Q()),p.get('h',Q())+p.get('lambda',Q()),p.get('lambda',Q())]
        return all(c>=0 for c in coefficients) and any(c>0 for c in coefficients)

    def ordered_sum_positive(self,i,env):
        if not self.hierarchy_verified:return False
        leaves=[]
        def flatten(j):
            n=self.program[j]
            if n['op']=='add':
                for child in n['args']:flatten(child)
            else:leaves.append(j)
        flatten(i);linear={};nonlinear=[]
        for j in leaves:
            p=self.affine(j)
            if p is None:nonlinear.append(self.at(j,env))
            else:
                for k,v in p.items():linear[k]=linear.get(k,Q())+v
        coefficients=[linear.get('1',Q()),linear.get('h',Q())+linear.get('lambda',Q()),linear.get('lambda',Q())]
        return (all(c>=0 for c in coefficients) and all(v.nonnegative() for v in nonlinear)
                and (any(c>0 for c in coefficients) or any(v.positive() for v in nonlinear)))

    def at(self,i,environment=None):
        env=environment or {};key=(i,tuple((k,v.lo,v.hi,v.ls,v.hs,v.finite,v.smooth,
            tuple(sorted(v.support)),tuple(sorted(v.stops))) for k,v in sorted(env.items())))
        if key in self.memo:return self.memo[key]
        self.work+=1
        if self.work>self.max_work:raise RuntimeError('dedicated guard fiber work budget reached')
        n=self.program[i];op=n['op'];a=n['args'];get=lambda j:self.at(j,env)
        if op=='rational':v=const(Q(int(a[0]),int(a[1])))
        elif op=='coordinate':
            v=copy.deepcopy(env.get(i,Bound(finite=True,smooth=True,support={i},reasons=('arbitrary finite real coordinate',))))
        elif op=='source_parameter':
            f=self.params.parameter(a[0]);lo=Q(0) if f['finite'] and f['signs']<={0,1} else None
            v=Bound(lo,None,lo==0 and f['signs']=={1},False,f['finite'],f['finite'],stops=set(f['stops']),reasons=('pinned exact constant expression',))
            if self.hierarchy_verified and a[0] in ['h','lambda']:v=Bound(Q(0),Q(1,100),True,True,True,True,reasons=('actual exponential parameter hierarchy',))
            if self.hierarchy_verified and a[0]=='co':v=const(Q(1,256))
            if f['exact'] is not None:v=const(f['exact'])
        elif op=='add':
            v=plus([get(j) for j in a])
            if v.finite and (self.ordered_affine_positive(i) or self.ordered_sum_positive(i,env)):
                if v.lo is None or v.lo<=0:v.lo=Q(0);v.ls=True
                v.reasons+=('0<h<lambda from exact exponents',)
        elif op=='multiply':v=times([get(j) for j in a])
        elif op=='inverse':v=inv(get(a[0]))
        elif op=='integer_power':v=power(get(a[0]),a[1])
        elif op=='exp':
            x=get(a[0]);lo=Q(1) if x.nonnegative() else Q(0);ls=(x.positive() if lo==1 else True)
            hi=None;hs=False
            if x.hi is not None and x.hi<=0:hi=Q(1);hs=x.hi<0 or x.hs
            elif x.hi is not None and x.hi<=16:
                hi=Q(3)**max(1,(x.hi.numerator+x.hi.denominator-1)//x.hi.denominator);hs=True
            v=Bound(lo,hi,ls,hs,x.finite,x.smooth,set(x.support),set(x.stops),('real exponential positive and e<3',))
        elif op=='log_positive':
            x=get(a[0])
            if not x.positive():v=unknown('positive logarithm argument on actual fiber not proved',x.support)
            else:
                lo=Q(0) if x.lo is not None and x.lo>=1 else None
                hi=Q(0) if x.hi is not None and x.hi<=1 else None
                ls=lo==0 and (x.lo>1 or x.ls);hs=hi==0 and (x.hi<1 or x.hs)
                if x.hi is not None and x.hi<=Q(1,100):hi=Q(-4);hs=True
                v=Bound(lo,hi,ls,hs,True,x.smooth,set(x.support),set(x.stops),('real log monotonicity; e^4<3^4<100',))
        elif op=='sqrt_positive':
            x=get(a[0])
            v=Bound(Q(0),None,True,False,True,x.smooth,set(x.support),set(x.stops),('positive square root',)) if x.positive() else unknown('positive root operand on original whole domain not proved',x.support)
        elif op=='source_step_derivative':
            x=get(a[0]);order=a[1]
            if order==0:v=Bound(Q(0),Q(1),False,False,x.finite,x.smooth,set(x.support),set(x.stops),('all-order flat logistic real C-infinity',))
            elif order==1:
                strict=x.lo is not None and x.hi is not None and x.lo>0 and x.hi<1
                lower=Q(1,3**16) if strict and x.lo>=Q(1,4) and x.hi<=Q(3,4) else Q(0)
                v=Bound(lower,Q(8),strict and lower==0,False,x.finite,x.smooth,set(x.support),set(x.stops),('sigma prime nonnegative globally, positive on (0,1); exact global upper 8',))
            else:v=Bound(finite=x.finite,smooth=x.smooth,support=set(x.support),stops=set(x.stops),reasons=('all-order flat logistic smoothness',))
        elif op=='definite_integral':
            body,binder,left,right=a;l=get(left);r=get(right)
            low=None if l.lo is None or r.lo is None else min(l.lo,r.lo)
            high=None if l.hi is None or r.hi is None else max(l.hi,r.hi)
            fiber=Bound(low,high,False,False,True,True,support={binder},reasons=('actual compact integration fiber',))
            scoped={**env,binder:fiber};b=self.at(body,scoped)
            m=merged([l,r,b]);m['support'].discard(binder)
            if not m['finite'] or not m['smooth']:
                v=unknown('integrand/endpoints not C-infinity and finite on their actual compact fiber',m['support']);v.stops|=m['stops']
            else:
                length=plus([r,negative(l)]);v=Bound(finite=True,smooth=True,support=m['support'],reasons=('compact-fiber smooth Leibniz theorem at every fixed order',))
                if b.lo is not None and b.hi is not None and length.lo is not None and length.hi is not None:
                    v=times([length,Bound(b.lo,b.hi,False,False,True,True)]);v.smooth=True;v.support=m['support']
                elif b.nonnegative() and length.nonnegative():v.lo=Q(0)
                strict_interior=False
                if l.exact() is not None and r.exact() is not None and r.lo>l.lo and b.nonnegative():
                    quarter=(r.lo-l.lo)/4
                    center=Bound(l.lo+quarter,r.lo-quarter,False,False,True,True,support={binder})
                    inside=self.at(body,{**env,binder:center});strict_interior=inside.positive()
                    if strict_interior:
                        if v.lo is None or v.lo<=0:v.lo=Q(0);v.ls=True
                        v.reasons+=('nonnegative continuous integrand, strictly positive on exact middle half of fiber',)
                self.integral_certificates[str(i)]={'integralNode':i,'originalArgs':a,'fiber':fiber.data(),'integrand':b.data(),
                    'left':l.data(),'right':r.data(),'strictInteriorPositive':strict_interior,'result':v.data()}
        elif op in ['sine','cosine']:
            x=get(a[0]);v=Bound(Q(-1),Q(1),finite=x.finite,smooth=x.smooth,support=set(x.support),stops=set(x.stops))
        elif op in ['maximum','ceiling']:
            xs=[get(j) for j in (a if op=='maximum' else a[:1])];m=merged(xs)
            # A selector with no free coordinates is a fixed exact constant.
            v=Bound(finite=m['finite'],smooth=m['finite'] and not m['support'],support=m['support'],stops=m['stops'],reasons=('fixed selector is constant in all free real coordinates',))
            if all(x.positive() for x in xs):v.lo=Q(0);v.ls=True
        else:v=unknown('actual opaque/branch operator requires original whole-domain proof: '+op,{i})
        self.memo[key]=v;return v


def parameter_theorem(expressions):
    expected={'Md':{'integer':1048576},'T':{'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},
        'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},
        'lambda':{'exp':{'product':[{'integer':-1000},{'ref':'T'}]}},'co':{'rational':'1/256'}}
    for name,value in expected.items():
        if expressions.get(name)!=value:raise ValueError('original parameter hierarchy changed: '+name)
    if not 3**4<100 or not Q(216,25599)<Q(1,100):raise AssertionError('exact terminal proof rational control failed')
    return {'sourceProfileSHA256':PROFILE_SHA,'exactExpressions':expected,
        'conclusions':['T>10','0<h<lambda<1/100','0<rho=co*h<1/25600','1-h>99/100','1-lambda>99/100','1-rho>25599/25600'],
        'proof':'The actual T is finite and >10. Strict monotonicity of exp and -8002T<-1000T<0 give 0<h<lambda. exp(1000T)>1+1000T>100 proves lambda<1/100; co=1/256 gives the remaining exact inequalities.',
        'pointSamplesUsed':False,'hugeExponentialsEvaluated':False}


def terminal_theorem():
    x=Q(1,4)
    if 32*x**4+6*x*x-34*x+8!=0 or 128*x**3+12*x-34>=0:
        raise AssertionError('original sigma-prime all-real upper8 exact proof failed')
    return {'name':'actual-original-Qp-Qb-positive-and-all-order-compact-smooth',
        'Qp':'integral_1^3 exp((1-h)t)*rho*sigma_prime((t-1)/2)/(2*(1-rho)) dt',
        'Qb':'exp(-(1-h)/2)*(Qhold+integral_0^1 exp((1-h)S(t))*(1-h)*(1-sigma(t)) dt)',
        'strictBounds':['rho/(2*3^16)<Qp<216*rho/(1-rho)<1/100','Qb>132/25>5','Qb/Qp>500','log(Qb/Qp)/(1-h)>5'],
        'sigmaPrimeUpperEightProof':'With x=t(1-t) in(0,1/4], use exp(g)+exp(-g)>=2+g^2. Clearing the positive denominator in 8*(4+g^2)-gprime gives 32x^4+6x^2-34x+8; its derivative is <=-29 on[0,1/4] and its right endpoint value is0. Therefore sigma prime<=8 globally, with flat exterior value0.',
        'proof':['sigma prime>=0 globally and >0 on (0,1). On [1/4,3/4], sigma prime=gprime/(2+exp(g)+exp(-g)), |g|<16 and gprime>=4, hence sigma prime>exp(-16)>3^-16. The middle t interval [3/2,5/2] has length1.',
            'On [1,3], exp((1-h)t)<exp(3)<27 and sigma prime<=8. Thus Qp<216*rho/(1-rho). Every factor is finite; no sample or quadrature is used.',
            'Q0=(lambda-h)/(1-lambda)>0. Qsteep>0 since its integrand has lambda-h+(1-lambda)*sigma>0. Qhold=Qsteep+4*(1-h)*(-log h)>4*(99/100)*4. Qb>Qhold/3>132/25, using exp(-(1-h)/2)>1/3 and the nonnegative flatten integral.',
            'Both integrals have C-infinity integrands on their exact compact intervals for 0<h<lambda<1/100,rho=co*h. Every fixed derivative is bounded on each compact parameter neighborhood; compact Leibniz gives every fixed-order derivative. This is an all-order theorem, not extrapolation from a finite table.'],
        'globalCartesianSourceCoordinatesUsed':False,'fullFieldWMSBoundsClaimed':False}


def chart_image_theorem():
    return {'name':'original-slow-image-and-atlas-scaling-universal-lemma',
        'sourceRoot':622820,'equation':'F(s;Z,T)=s-Z^2*s^(2h)-T',
        'originalImage':'Z=s0^(1/2-h)*eta,T=s0*(1-eta^2),1/2<=s0<=2,abs(eta)<=1',
        'imageCharacterization':'T>=0, F(1/2;Z,T)<=0<=F(2;Z,T), with the original unique bracket root',
        'proof':['On the image F(s0)=0, T>=0 and Z^2<=2^(1-2h). Throughout [1/2,2], F_s=1-2h Z^2 s^(2h-1)>1-8h>23/25 for 0<h<1/100. IVT and strict monotonicity give the unique original root.',
            'Conversely a bracket root and T>=0 give eta=Z/s^(1/2-h), eta^2=1-T/s<=1, so the point is in that original image.',
            'For every ratio r>0, map Rprime=sqrt(r)R,Zprime=r^(1/2-h)Z,Tprime=rT and sprime=r*s. Then F(sprime;Zprime,Tprime)=rF(s;Z,T), etapri=eta and Xprime=X. If the ACTUAL candidate band guard gives abs(log2(sprime))<3/4, then 1/2<sprime<2, so that mapped candidate is inside the same original image.',
            'These are quantified algebraic/domain theorems. Every actual global indexed call still needs its exact scaling and pre-evaluation guard bound to this theorem. A top-level coordinate match alone is insufficient.'],
        'allActualGlobalCandidateBindingsVerified':False,'wholeGlobalSourceImageProved':False,'fullFieldCommonSupportProved':False,
        'rootConditionalRange':['1/2','2'],'newGlobalGuardsFromThisLemmaAlone':0}


def bump_theorem():
    return {'name':'exact-original-annular-bump-all-order-flatness-and-positive-mass',
        'definition':'beta(t)=exp(-1/(t*(1-t))) for0<t<1; beta=0 outside',
        'allOrderProof':'Every fixed derivative is beta times a rational function whose only poles are at0and1. Differentiate this form to obtain the next order, proving the statement by induction for arbitrary order. Near0, beta<=exp(-1/t), and for every fixed m and integer k>m, exp(1/t)>t^-k/k!, so t^-m beta tends to0. Reflection gives the same at1. Thus all jets match the zero exterior at both endpoints.',
        'positiveMassBounds':['1/1458<integral_0^1 beta(t)dt<1','1/14580<integral beta(10*(r/a-1))/a dr<1/10, for every a>0 and a full enclosing radial interval'],
        'massProof':'On[1/4,3/4], t(1-t)>=3/16, so beta>=exp(-16/3)>exp(-6)>3^-6. Its integral over that interval is greater than1/(2*3^6)=1/1458. Change variables r=a*(1+t/10), retaining dr=a/10 dt. The two exact scale factors cancel.',
        'jointCompositionPremise':'The actual selector argument and positive scale must be defined and C-infinity on every original source call; actual radial integration bounds must enclose the entire bump. These global source premises are checked separately and never inferred from this scalar theorem.',
        'globalSourceImageFromScalarTheorem':False}


def bump_binding(program,i):
    """Match the literal original scalar bump with exact rational algebra."""
    n=program[i]
    if n['op']!='smooth_piecewise':return {'matched':False,'reason':'not the original scalar piecewise'}
    selector,left,right,low,middle,high=n['args']
    def q(j):
        p=program[j]
        return Q(int(p['args'][0]),int(p['args'][1])) if p['op']=='rational' else None
    if (q(left),q(right),q(low),q(high))!=(Q(0),Q(1),Q(0),Q(0)):
        return {'matched':False,'reason':'original bump branch constants differ'}
    e=program[middle]
    if e['op']!='exp':return {'matched':False,'reason':'original bump middle is not the retained exponential'}
    def padd(a,b):
        c=dict(a)
        for k,v in b.items():c[k]=c.get(k,Q())+v
        return {k:v for k,v in c.items() if v}
    def pmul(a,b):
        c={}
        for k,v in a.items():
            for j,w in b.items():c[k+j]=c.get(k+j,Q())+v*w
        if c and max(c)>32:raise ValueError('bump rational pattern degree budget')
        return {k:v for k,v in c.items() if v}
    memo={};pole_checks=[]
    def endpoint_factors(poly):
        p={k:v for k,v in poly.items() if v};zero_power=one_power=0
        if not p:return None
        while p.get(0,Q())==0:
            p={k-1:v for k,v in p.items()};zero_power+=1
        while len(p)>1 and sum(p.values(),Q())==0:
            # Exact synthetic division by (1-x), retaining coefficients.
            degree=max(p);quotient={0:p.get(0,Q())}
            for k in range(1,degree):quotient[k]=p.get(k,Q())+quotient[k-1]
            if p.get(degree,Q())!=-quotient[degree-1]:return None
            p={k:v for k,v in quotient.items() if v};one_power+=1
        if set(p)!={0} or p[0]==0:return None
        return {'nonzeroRationalFactor':str(p[0]),'zeroEndpointPower':zero_power,'oneEndpointPower':one_power}
    def rational_function(j):
        if j==selector:return ({1:Q(1)},{0:Q(1)})
        if j in memo:return memo[j]
        p=program[j];op=p['op'];a=p['args']
        if op=='rational':v=({0:Q(int(a[0]),int(a[1]))},{0:Q(1)})
        elif op=='inverse':
            num,den=rational_function(a[0]);poles=endpoint_factors(num)
            if poles is None:raise ValueError('an original inverse may have an interior bump pole')
            pole_checks.append({'sourceScalarInverse':j,'operandPolynomial':[[k,str(c)] for k,c in sorted(num.items())],'exactEndpointFactorization':poles})
            v=(den,num)
        elif op in ['add','multiply']:
            v=({0:Q(0) if op=='add' else Q(1)},{0:Q(1)})
            for child in a:
                an,ad=v;bn,bd=rational_function(child)
                v=(padd(pmul(an,bd),pmul(bn,ad)),pmul(ad,bd)) if op=='add' else (pmul(an,bn),pmul(ad,bd))
        elif op=='integer_power' and 0<=a[1]<=8:
            num,den=rational_function(a[0]);v=({0:Q(1)},{0:Q(1)})
            for _ in range(a[1]):v=(pmul(v[0],num),pmul(v[1],den))
        else:raise ValueError('non-rational original bump exponent input')
        memo[j]=v;return v
    try:num,den=rational_function(e['args'][0])
    except ValueError as error:return {'matched':False,'reason':str(error)}
    difference=padd(pmul(num,{1:Q(1),2:Q(-1)}),den)
    return {'matched':not difference,'selector':selector,'branchBounds':[left,right],
        'piecewiseOriginalNodeSHA256':sha(n),'exponentialOriginalNodeSHA256':sha(e),
        'exactExponentIdentity':'exponent*selector*(1-selector)=-1',
        'allOriginalInversePolesExcludedOnOpenBranch':pole_checks,
        'independentPolynomialDifference':[[k,str(v)] for k,v in sorted(difference.items())],
        'allOrdersCertificate':'original-bump-flatness-and-mass.json'}


def serialize_scalar(program,i,depth=6,seen=None):
    if seen is None:seen=set()
    n=program[i]
    if depth<=0 or i in seen:return {'id':i,'node':n,'sha256':sha(n)}
    seen.add(i);op=n['op'];a=n['args']
    children=a if op in ['add','multiply','maximum','smooth_piecewise','definite_integral'] else a[:1] if op in ['inverse','exp','log_positive','sqrt_positive','sine','cosine','ceiling','integer_power','source_step_derivative'] else []
    return {'id':i,'node':n,'sha256':sha(n),'children':[serialize_scalar(program,j,depth-1,seen) for j in children]}


def conservative_domain_support(source_calc,root,max_nodes=50000):
    """All actual arguments contribute to definedness, including unused ones."""
    from jet_worker import definition_key,REGISTERED_OPS
    memo={};active=set()
    def at(i):
        if i in memo:return memo[i]
        if i in active:raise ValueError('cyclic source domain dependency')
        if len(memo)+len(active)>max_nodes:raise RuntimeError('complete actual argument domain support budget')
        active.add(i);n=source_calc.source[i];op=n['op'];a=n['args']
        binding=source_calc.defs.get(definition_key(n))
        if binding is not None:
            fields=[k for k in binding['definition'] if any(w in k.lower() for w in ['domain','premise','hypothes','guard'])]
            if fields:raise ValueError('explicit source domain/premises not independently pulled back: '+','.join(fields))
        if op=='coordinate':value={i}
        elif op in ['rational','source_parameter']:value=set()
        else:
            if op in REGISTERED_OPS:kids=a[1]
            elif op in ['add','multiply','maximum','smooth_piecewise']:kids=a
            elif op in ['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling','integer_power','source_step_derivative']:kids=a[:1]
            elif op=='definite_integral':
                value=(at(a[0])-{a[1]})|at(a[2])|at(a[3]);kids=None
            elif op=='actual_monotone_root':kids=a[1:]
            elif op=='actual_quadratic_root':kids=a[2:3]
            elif op=='actual_natural_series':kids=a[1:3]
            elif op in ['actual_background_picard','actual_background_even_profile']:kids=a[2:4]
            else:raise ValueError('unreviewed exact partial-function domain grammar '+op)
            if kids is not None:value=set().union(*(at(j) for j in kids))
        active.remove(i);memo[i]=value;return value
    return at(root)


def substitution_attempt(program,guard,source_calc):
    """Exact substitution of partial functions: existence remains separate."""
    root,bound,value=(guard[k] for k in ['root','bound','value'])
    applied=[]
    def collect(i):
        n=program[i]
        if n['op']=='unresolved_opaque_substitution':
            r,b,v=n['args'];collect(r);applied.append((b,v))
        elif n['op']=='actual_opaque_value':applied.append(('source',n['args'][0]))
        else:raise ValueError('unreviewed opaque-substitution source grammar')
    collect(root);source_id=applied[0][1]
    support,unknowns=source_calc.source_support(source_id)
    if unknowns:return {'globallyProved':False,'reason':'unreviewed complete source capture closure','unreviewed':sorted(unknowns)}
    try:domain_support=conservative_domain_support(source_calc,source_id)
    except (ValueError,RuntimeError) as error:
        return {'globallyProved':False,'reason':str(error),'conditionalBodySupport':sorted(support)}
    def scalar_coordinate(i):
        n=program[i]
        if n['op']!='coordinate' or len(n['args'])!=2 or type(n['args'][1]) is not int:return None
        return n['args'][1]
    steps=[];original=source_calc.source[source_id];op=original['op']
    from jet_worker import definition_key,REGISTERED_OPS
    key=definition_key(original);binding=source_calc.defs.get(key)
    # A body may omit a coordinate which still occurs in the declared domain.
    # Such metadata needs its own pullback calculus, never the absent-body rule.
    if binding is not None:
        domain_keys=[k for k in binding['definition'] if any(w in k.lower() for w in ['domain','premise','hypothes','guard'])]
        if domain_keys:return {'globallyProved':False,'reason':'explicit source domain/premises require an independent exact domain pullback',
            'domainMetadataFields':domain_keys,'conditionalBodySupport':sorted(support)}
    arguments=copy.deepcopy(original['args'][1]) if op in REGISTERED_OPS else None
    reconstructed=None
    for b,v in [*applied[1:],(bound,value)]:
        sid=scalar_coordinate(b)
        if sid is None:return {'globallyProved':False,'reason':'fresh scalar alpha binder needs complete lexical alpha-renaming proof','steps':steps}
        # Actual arguments remain part of a partial composition's definedness
        # even when the formal expression body omits their values.
        actual_domain_support=set()
        if arguments is not None:
            for argument in arguments:
                ds=conservative_domain_support(source_calc,argument)
                actual_domain_support.update(ds)
        absent=sid not in support and sid not in actual_domain_support and sid not in domain_support
        steps.append({'originalScalarBinder':b,'originalSourceCoordinate':sid,'originalScalarReplacement':v,
            'replacementNode':program[v],'sourceCoordinateAbsent':absent,
            'rule':'identity of the original partial function because complete capture-verified support omits this coordinate' if absent else 'simultaneous capture-free application to the complete original input tuple; original domain pulled back under the same substitution'})
        if not absent:
            # Reconstruct the COMPLETE actual argument tuple. No registered
            # derivative/body helper and no existence theorem is invoked.
            replacement=scalar_coordinate(v)
            if arguments is None or binding is None or replacement is None or not source_calc.capture_audit(source_id)['pass']:
                return {'globallyProved':False,'reason':'nontrivial opaque substitution lacks a complete capture-verified simple source application','steps':steps}
            changed=[]
            for argument in arguments:
                argument_support=conservative_domain_support(source_calc,argument)
                if sid not in argument_support:changed.append(argument)
                elif argument==sid:changed.append(replacement)
                else:return {'globallyProved':False,'reason':'nontrivial compound source argument needs independent capture-free expression substitution','steps':steps}
            arguments=changed;support=set(support)-{sid};domain_support.discard(sid)
            replacement_support,replacement_unknown=source_calc.source_support(replacement)
            if replacement_unknown:return {'globallyProved':False,'reason':'replacement source support is unreviewed','steps':steps}
            support.update(replacement_support)
            domain_support.update(conservative_domain_support(source_calc,replacement))
            reconstructed={'originalSourceNode':source_id,'originalSourceNodeSHA256':sha(original),
                'registryKey':key,'definitionSHA256':binding['definitionSHA256'],
                'formalParameters':binding['definition']['parameters'],
                'storedDerivativeOrdersUnchanged':original['args'][2],
                'newCompleteActualSourceArgumentTuple':arguments,
                'originalCompleteActualSourceArgumentTuple':original['args'][1]}
            steps[-1]['independentlyReconstructedApplication']=copy.deepcopy(reconstructed)
    return {'globallyProved':True,'sourceID':source_id,'completeSourceCoordinateSupport':sorted(support),
        'conservativeOriginalDomainCoordinateSupport':sorted(domain_support),'steps':steps,
        'equalityScope':'exact capture-free substitution with the same complete actual argument tuple and its pulled-back domain; source definedness remains a separate obligation',
        'sourceExistenceProved':False,'globalChartMembershipInferred':False,
        'independentlyReconstructedFinalApplication':reconstructed,
        'actualSystemCaptureAudits':list(source_calc.system_capture_cache.values())}


def complete_source_store(initial,context,allow_full=True):
    """Lazy pinned source fallback; stream stored bytes once, never recompute."""
    from jet_worker import VerifiedSourceStore
    class CompleteStore(VerifiedSourceStore):
        def __init__(self):
            super().__init__(initial,context);self.complete_db=None;self.temp=None
            self.full_receipt={'needed':False,'graphProducerRecomputed':False};self.full_failure=None
        def complete(self):
            if self.complete_db is not None:return
            if self.full_failure is not None:raise RuntimeError(self.full_failure)
            began=time.monotonic()
            sys.path.insert(0,str(Path(context['repo'])/'research-ide/mathscope-m3/certification-20261014'))
            from source_dag import snapshot_manifest,stream_snapshot
            try:manifest_path,manifest=snapshot_manifest(context['repo'])
            except (ValueError,OSError) as error:raise SourceIntegrityError(str(error)) from error
            if manifest['nodesSHA256']!=PARENT or manifest['nodeCount']!=3892594:
                raise SourceIntegrityError('different complete original source parent')
            self.temp=tempfile.TemporaryDirectory(prefix='n6-guard-actual-source-')
            path=Path(self.temp.name)/'original-source-read-only-index.sqlite'
            db=sqlite3.connect(path);db.execute('PRAGMA journal_mode=OFF');db.execute('PRAGMA synchronous=OFF')
            db.execute('CREATE TABLE nodes(id INTEGER PRIMARY KEY,raw TEXT NOT NULL)')
            batch=[];count=0
            self.full_receipt.update(needed=True,executionStatus='READING_STORED_STREAM')
            try:
                for ident,node in stream_snapshot(context['repo']):
                    batch.append((ident,canonical(node)));count+=1
                    if len(batch)>=8192:
                        db.executemany('INSERT INTO nodes VALUES(?,?)',batch);batch=[]
                        self.full_receipt['storedNodesReadBeforeCompletion']=count
                    if time.monotonic()-began>360:raise RuntimeError('360-second bounded complete source indexing stop')
            except (ValueError,OSError) as error:
                db.close();raise SourceIntegrityError(str(error)) from error
            except (RuntimeError,MemoryError) as error:
                db.close();self.full_failure=str(error)
                self.full_receipt.update(executionStatus='RESOURCE_STOP',storedNodesReadBeforeCompletion=count,
                    elapsedSeconds=time.monotonic()-began,completeStoredStreamHashesIndependentlyVerified=False)
                raise RuntimeError(self.full_failure) from error
            if batch:db.executemany('INSERT INTO nodes VALUES(?,?)',batch)
            db.commit();db.execute('PRAGMA query_only=ON');self.complete_db=db
            if count!=3892594:raise SourceIntegrityError('complete original source indexing dropped a node')
            self.full_receipt={'needed':True,'sourceManifestPath':str(manifest_path.relative_to(context['repo'])),
                'sourceManifestSHA256':file_sha(manifest_path),'parentNodesSHA256':PARENT,
                'sourceStoredGzipBytes':manifest['gzipBytes'],'authenticatedOriginalNodesRead':count,
                'temporaryIndexBytes':path.stat().st_size,'elapsedSeconds':time.monotonic()-began,
                'completeStoredStreamHashesIndependentlyVerified':True,'graphProducerRecomputed':False,
                'keptInUserLocalStorage':False,'temporaryIndexUploaded':False}
        def get(self,ident,default=None):
            value=super().get(ident,default)
            if value is not default or not allow_full or type(ident) is not int or not (0<=ident<3892594):return value
            self.complete()
            row=self.complete_db.execute('SELECT raw FROM nodes WHERE id=?',(ident,)).fetchone()
            if row is None:return default
            value=json.loads(row[0]);dict.__setitem__(self,ident,value);self.missing.discard(ident)
            self.loaded[ident]={'sourceNode':ident,'node':value,'nodeSHA256':sha(value)}
            return value
        def evidence(self):return {**super().evidence(),'completeOriginalSourceIndex':self.full_receipt}
        def all_registries(self):
            self.complete()
            from source_dag import open_header,definitions
            try:header=open_header(context['repo']);result=definitions(header)
            except (ValueError,OSError) as error:raise SourceIntegrityError(str(error)) from error
            self.full_receipt['authenticatedSourceHeaderSHA256']=sha(header)
            return result
        def close(self):
            if self.complete_db is not None:self.complete_db.close()
            if self.db is not None:self.db.close()
            if self.temp is not None:self.temp.cleanup()
    return CompleteStore()


class ChartAlgebra:
    """Small exact polynomial verifier, with transcendental nodes as atoms.

    This proves displayed chart identities only. Every denominator is retained
    separately, so polynomial cancellation cannot prove original definedness.
    """
    def __init__(self,source,max_work=100000):self.source=source;self.work=0;self.max_work=max_work
    def polynomial(self,i,atoms):
        memo={}
        def add(a,b):
            out=dict(a)
            for k,v in b.items():out[k]=out.get(k,Q())+v
            return {k:v for k,v in out.items() if v}
        def mul(a,b):
            out={}
            for ka,va in a.items():
                for kb,vb in b.items():
                    key=tuple(sorted(ka+kb));out[key]=out.get(key,Q())+va*vb
            if len(out)>512:raise RuntimeError('exact chart polynomial 512-term budget')
            return {k:v for k,v in out.items() if v}
        def at(j):
            self.work+=1
            if self.work>self.max_work:raise RuntimeError('exact chart algebra work budget')
            if j in atoms:return {(str(atoms[j]),):Q(1)}
            if j in memo:return memo[j]
            n=self.source[j];op=n['op'];a=n['args']
            if op=='rational':v={():Q(int(a[0]),int(a[1]))}
            elif op in ['add','multiply']:
                v={} if op=='add' else {():Q(1)}
                for child in a:v=add(v,at(child)) if op=='add' else mul(v,at(child))
            elif op=='integer_power' and type(a[1]) is int and 0<=a[1]<=8:
                v={():Q(1)}
                for _ in range(a[1]):v=mul(v,at(a[0]))
            elif op=='inverse':
                child=at(a[0])
                if set(child)!={()} or not child[()]:raise ValueError('nonconstant inverse retained as domain-sensitive atom')
                v={():1/child[()]}
            else:raise ValueError('unmatched chart algebra source operation '+op)
            memo[j]=v;return v
        return at(i)
    def rational(self,i):
        try:p=self.polynomial(i,{})
        except ValueError:return None
        return p.get((),Q()) if set(p)<={()} else None
    def factors(self,i):
        n=self.source[i]
        if n['op']=='multiply':return [k for child in n['args'] for k in self.factors(child)]
        if self.rational(i)==1:return []
        return [i]
    def strip_coordinate(self,i,coordinate,expected=None):
        factors=self.factors(i)
        if factors.count(coordinate)!=1:raise ValueError('candidate slow coordinate is not one exact linear factor')
        factors.remove(coordinate)
        if expected is not None:
            if sorted(factors)!=sorted(self.factors(expected)):raise ValueError('candidate coordinate differs from its exact linear source scale')
            return expected
        if len(factors)!=1:raise ValueError('candidate slow scale is not one exact retained source factor')
        return factors[0]
    def positive_exp_ratio(self,i):
        factors=self.factors(i);exps=[];inverses=[]
        for child in factors:
            n=self.source[child]
            if n['op']=='exp':exps.append(child)
            elif n['op']=='inverse' and self.source[n['args'][0]]['op']=='exp':inverses.append(n['args'][0])
            else:raise ValueError('ratio positivity is not an exact product of exponentials and their reciprocals')
        if len(exps)!=1 or len(inverses)!=1:raise ValueError('expected the complete original Q_ref/Q_label pair')
        return exps[0],inverses[0]
    def logarithms(self,i,limit=180):
        todo=[i];seen=set();out=[]
        while todo:
            j=todo.pop()
            if j in seen:continue
            seen.add(j)
            if len(seen)>limit:raise ValueError('band guard source closure exceeds exact bounded grammar')
            n=self.source[j];op=n['op'];a=n['args']
            if op=='log_positive':out.append(j)
            elif op in ['add','multiply']:todo.extend(a)
            elif op in ['inverse','exp','integer_power']:todo.append(a[0])
        return out


def audit_chart_row(source,definition,row,root=622820,h=9):
    """Verify every actual slow map, its fixed-label Jacobian and band guard.

    Returned transport is CONDITIONAL on the reference point belonging to the
    original image. It never proves evaluation of arbitrary Fourier/pressure
    argument substitutions or the field's changing-label flat joins.
    """
    alg=ChartAlgebra(source);parameters=definition.get('parameters',[]);directions=definition.get('directions',[])
    local=row.get('localParameters',[]);values=row.get('values',[])
    if len(local)!=len(values) or len(set(local))!=len(local):raise ValueError('complete original local parameter tuple missing')
    # Slow formal coordinates are bound by exact IDs, never their display name.
    slow=[622802,622803,622804]
    if not all(c in parameters and c in local for c in slow):raise ValueError('all three original slow coordinate IDs are not explicitly bound')
    positions=[local.index(c) for c in slow];mapped=[values[j] for j in positions]
    identity=mapped==slow;scales=[];ratio=None;band_guard=None
    if identity:scales=[None,None,None]
    else:
        if source[h]['op']!='source_parameter' or source[h]['args'][0]!='h':raise ValueError('original h source node binding differs')
        if 'derivativeScales' in row and len(row['derivativeScales'])==3:t_scale=row['derivativeScales'][2]
        elif 'derivativeMaps' in row and slow[2] in directions:
            t_entries=row['derivativeMaps'][directions.index(slow[2])]
            if len(t_entries)!=1 or t_entries[0].get('parameter')!=positions[2]:raise ValueError('actual T coefficient is not a single declared linear scale')
            t_scale=t_entries[0]['coefficient']
        else:raise ValueError('actual T linear scale source binding missing')
        scales=[alg.strip_coordinate(mapped[0],slow[0]),alg.strip_coordinate(mapped[1],slow[1]),
            alg.strip_coordinate(mapped[2],slow[2],t_scale)]
        ratio=scales[2];reference_q,label_q=alg.positive_exp_ratio(ratio)
        radial=source[scales[0]]
        if radial!={'op':'sqrt_positive','args':[ratio]}:raise ValueError('radial chart scale is not the positive square root of the actual ratio')
        axial=source[scales[1]]
        if axial['op']!='exp':raise ValueError('axial chart scale is not the original exponential power')
        logs=alg.logarithms(axial['args'][0]);ratio_logs=[j for j in logs if source[j]['args']==[ratio]]
        if len(ratio_logs)!=1:raise ValueError('actual axial scale lost log of the exact ratio')
        logratio=ratio_logs[0]
        if alg.polynomial(axial['args'][0],{h:'h',logratio:'L'})!={('L',):Q(1,2),('L','h'):Q(-1)}:
            raise ValueError('actual axial exponent differs from (1/2-h)*log(ratio)')
        ell=row.get('label',{}).get('ell')
        if type(ell) is not int or row.get('label',{}).get('Q',label_q)!=label_q:raise ValueError('actual candidate label/Q binding missing')
        label_exponent=source[label_q]['args'][0]
        logtwos=[j for j in alg.logarithms(label_exponent) if alg.rational(source[j]['args'][0])==2]
        if len(logtwos)!=1 or alg.polynomial(label_exponent,{ell:'ell',logtwos[0]:'log2'})!={('ell','log2'):Q(-1)}:
            raise ValueError('actual Q_label is not exp(-ell_label*log(2))')
        logtwo=logtwos[0]
        for guard in row.get('guards',[]):
            if not isinstance(guard,list) or len(guard)!=3:raise ValueError('malformed original row guard')
            coordinate,left,right=guard
            if alg.rational(left)!=Q(-3,4) or alg.rational(right)!=Q(3,4):continue
            try:
                glogs=alg.logarithms(coordinate)
                qlogs=[j for j in glogs if sorted(alg.factors(source[j]['args'][0]))==sorted([reference_q,root])]
                inverse_log=[j for j in alg.factors(coordinate) if source[j]['op']=='inverse' and source[j]['args']==[logtwo]]
                # The inverse log(2) occurs inside an addend, so find by bounded DAG scan.
                def find_inv(j):
                    n=source[j]
                    if n=={'op':'inverse','args':[logtwo]}:return [j]
                    return [k for c in n['args'] for k in find_inv(c)] if n['op'] in ['add','multiply'] else []
                inverses=find_inv(coordinate)
                if len(qlogs)==1 and len(set(inverses))==1:
                    p=alg.polynomial(coordinate,{ell:'ell',qlogs[0]:'logq',inverses[0]:'invlog2'})
                    if p=={('invlog2','logq'):Q(-1),('ell',):Q(-1)}:band_guard=guard;break
            except ValueError:continue
        if band_guard is None:raise ValueError('no exact original pre-evaluation band guard for q/Q_label')
    # All physical derivatives must have the exact fixed-label linear Jacobian.
    if 'derivativeScales' in row:
        if row.get('localDirectionIndices')!=positions or directions!=slow:raise ValueError('global row derivative direction/parameter binding differs')
        declared=row['derivativeScales']
        for got,want in zip(declared,scales):
            if (alg.rational(got)!=1 if want is None else got!=want):raise ValueError('global row Jacobian scale mutation')
    elif 'derivativeMaps' in row:
        maps=row['derivativeMaps']
        if len(maps)!=len(directions):raise ValueError('auxiliary derivative map omitted a global direction')
        for c,pos,want in zip(slow,positions,scales):
            if c not in directions:raise ValueError('auxiliary row omitted an original physical derivative')
            entries=maps[directions.index(c)]
            if len(entries)!=1 or entries[0].get('parameter')!=pos:raise ValueError('auxiliary physical Jacobian mixes local parameters')
            got=entries[0].get('coefficient')
            if (alg.rational(got)!=1 if want is None else got!=want):raise ValueError('auxiliary physical Jacobian coefficient mutation')
        for entries in maps:
            if any(e.get('parameter') in positions for e in entries) and entries not in [maps[directions.index(c)] for c in slow]:
                raise ValueError('an auxiliary derivative changes the original slow coordinates')
    else:raise ValueError('actual indexed derivative Jacobian absent')
    return {'sourceRowSHA256':sha(row),'localBody':row.get('localBody'),'completeActualTuple':values,
        'slowFormalParameterIndices':positions,'actualSlowValues':mapped,'actualFixedLabelScales':scales,
        'identitySlowMap':identity,'ratio':ratio,'actualBandGuard':band_guard,'exactFixedLabelJacobianVerified':True,
        'referenceImageImpliesEveryActiveCandidateImage':True,
        'candidateRootBracket':'1/2 < ratio*s < 2, eta and X invariant' if not identity else 'original reference image unchanged',
        'sourceDefinednessProved':False,'globalFullCallDomainProved':False,'algebraWork':alg.work}


def audit_all_chart_rows(source,context):
    """Inspect every serialized indexed row; emit actual obstructions, no pass flags."""
    kernels={'source-global-expressions.mjs':'89904bd7441a57cf634ff7b4c579e9ee7688868d14eafd999e44f41f74f0c2d1',
        'source-auxiliary-expressions.mjs':'4e1741d0a5ebadaf0858d79b141856d9dc52bb0b3b119b39e6cf83248355ca86'}
    for name,pin in kernels.items():
        if file_sha(Path(context['repo'])/'research-ide/mathscope-m3/navier'/name)!=pin:
            raise SourceIntegrityError('original indexed guard evaluation kernel changed: '+name)
    registries=source.all_registries();selected=[]
    for name,items in registries.items():
        if name=='definitions' and isinstance(items,list):
            for group,entries in enumerate(items):
                if isinstance(entries,list):
                    for index,d in enumerate(entries):
                        if isinstance(d,dict) and isinstance(d.get('rows'),list):selected.append((f'{name}:{group}:{index}',d))
        elif isinstance(items,list):
            for index,d in enumerate(items):
                if isinstance(d,dict) and isinstance(d.get('rows'),list):selected.append((f'{name}:{index}',d))
    results=[];controls=[];began=time.monotonic();resource_stop=None
    for key,d in selected:
        for index,row in enumerate(d['rows']):
            if len(results)>=30000 or time.monotonic()-began>120:
                resource_stop='120-second/30000-row exact all-indexed-row audit resource stop';break
            item={'registryKey':key,'definitionSHA256':sha(d),'row':index,'sourceRowSHA256':sha(row),'verified':False}
            try:item.update(audit_chart_row(source,d,row));item['verified']=True
            except (ValueError,KeyError,RuntimeError,RecursionError) as error:item['obstruction']={'type':type(error).__name__,'message':str(error)}
            results.append(item)
            if item['verified'] and not item['identitySlowMap'] and not controls:
                mutations=[]
                changed=copy.deepcopy(row);changed['guards']=[g for g in changed['guards'] if g!=item['actualBandGuard']]
                mutations.append(('remove actual pre-evaluation band guard',changed))
                if 'derivativeScales' in row:
                    changed=copy.deepcopy(row);changed['derivativeScales'][0]=changed['derivativeScales'][2]
                    mutations.append(('replace actual radial Jacobian by time Jacobian',changed))
                for name,changed in mutations:
                    try:audit_chart_row(source,d,changed)
                    except (ValueError,KeyError):controls.append({'actualRegistryKey':key,'actualRow':index,'mutation':name,'rejected':True})
                    else:raise AssertionError('actual indexed row negative control accepted: '+name)
        if resource_stop:break
    return {'schema':'MathScope.N6.ActualAllIndexedRowDomainTransport/1','allOriginalRegistryHeadersAuthenticated':True,
        'guardEvaluationKernelSHA256':kernels,
        'indexedDefinitionsInventoried':len(selected),'actualRowsInventoried':sum(len(d['rows']) for _,d in selected),
        'actualRowsAttempted':len(results),'actualRowsVerified':sum(x['verified'] for x in results),
        'allActualIndexedRowsStructurallyVerified':not resource_stop and bool(results) and all(x['verified'] for x in results),'rows':results,
        'resourceStop':resource_stop,'negativeControls':controls,
        'evaluationSemantics':'Each serialized guard wraps the local body as choose(coordinate,left,right,0,prior,0); outside an active guard the local root is not evaluated. This says nothing about existence of derivatives across changing labels.',
        'wholeGlobalCallGraphAudited':False,'globalSourceImageProved':False,
        'remainingGlobalCallObstructions':['Every scalar/registry/native root application at every original Cartesian, radial-integral and Fourier argument still needs compositional domain transport.',
            'Reference-chart image membership must be shown at the actual Cartesian source arguments.',
            'All changing-label/copy joins and inverse Fourier source domains remain separate.']}


def run(context,out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True);started=time.monotonic()
    current=read(context['current_matrix_path']);matrix=read(context['matrix_path'])
    if current['parentNodesSHA256']!=PARENT or matrix['parentNodesSHA256']!=PARENT:raise ValueError('original parent changed')
    prior=current['stageC'];previous={r['id']:r for r in prior['rows']}
    if len(previous)!=94 or prior['globallyDischargedGuards']!=35 or prior['remainingGlobalGuards']!=59:raise ValueError('expected exact original 35/59 frontier')
    target=[r for r in prior['rows'] if not r['provedByThisWorker']]
    checkpoint=read(find(context['baseline'],'cartesian-source-checkpoint.json'));program=checkpoint['cartesian']['scalarProgram']
    if checkpoint['cartesian']['diagnostics']['conditionalDomainHypotheses']!=matrix['originalIndependentCartesianDomainGuards']:raise ValueError('original guards changed')
    if sha(program)!=prior['sourceScalarProgramSHA256']:raise ValueError('original scalar program substituted')
    profile=Path(context['repo'])/'research-ide/mathscope-m2/navier/source-profile-data.mjs'
    step=Path(context['repo'])/'research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs'
    if file_sha(profile)!=PROFILE_SHA or file_sha(step)!=STEP_SHA:raise ValueError('original protected source bytes changed')
    expressions=json.loads(profile.read_text(encoding='utf8').split('export const PINNED_N3 = ',1)[1].strip().removesuffix(';'))['parametersExactExpressions']
    parameters=parameter_theorem(expressions);terminal=terminal_theorem();chart=chart_image_theorem();bump=bump_theorem()
    write(out/'parameter-order-certificate.json',parameters);write(out/'terminal-normalization-certificate.json',terminal)
    write(out/'original-chart-image-and-atlas-scaling.json',chart)
    write(out/'original-bump-flatness-and-mass.json',bump)
    from jet_worker import SourceCalculus
    witnesses={w['sourceNode']:w['node'] for w in checkpoint['sourceWitnesses']}
    for w in checkpoint['sourceWitnesses']:
        if sha(w['node'])!=w['nodeSHA256']:raise ValueError('original source witness changed')
    definitions={d['key']:d for d in checkpoint['definitionBindings']}
    for d in definitions.values():
        if sha(d['definition'])!=d['definitionSHA256']:raise ValueError('original registry definition changed')
    source=complete_source_store(witnesses,context);calc=SourceCalculus(source,definitions,max_work=700000,max_nodes=10000)
    calc.deadline=time.monotonic()+600
    proof=FiberProof(program,expressions);rows=[];program_sha=sha(program)
    for old in target:
        g=old['originalGuard'];kind=g['kind'];i=g.get('operand',g.get('root'))
        row={'id':old['id'],'uniqueSourceID':old['uniqueSourceID'],'originalGuard':g,
            'previouslyProved':False,'globallyProved':False,'proofStatus':'OPEN','originalScalarProgramSHA256':program_sha}
        try:
            value=proof.at(i);row['fiberEvidence']=value.data()
            success=(value.positive() if kind=='POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN' else value.nonzero() if kind=='NONZERO_ACTUAL_ARGUMENT' else
                     value.finite and value.smooth if kind in ['ACTUAL_FINITE_INTEGRAL_LEIBNIZ','ORIGINAL_STEP_JET'] else False)
            if success:
                row.update(globallyProved=True,proofStatus='PROVED_ORIGINAL_WHOLE_DOMAIN_PRIMITIVE_GUARD',
                    proofMethod='exact original-parameter inequalities and actual compact integration fibers; every fixed-order compact Leibniz theorem',
                    sourceImageOrLocalLabelAssumed=False)
            elif kind=='ACTUAL_OPAQUE_SUBSTITUTION':
                evidence=substitution_attempt(program,g,calc);row['substitutionEvidence']=evidence
                if evidence['globallyProved']:row.update(globallyProved=True,proofStatus='PROVED_GLOBAL_CAPTURE_SAFE_PARTIAL_FUNCTION_IDENTITY',proofMethod='complete source-body support and capture closure, exact absent-coordinate substitution')
            elif kind=='ACTUAL_MATCHING_FLAT_JOIN':
                binding=bump_binding(program,i);row['allOrderBumpEvidence']=binding
                if binding['matched']:
                    selector=proof.at(binding['selector'])
                    row['allOrderBumpEvidence']['actualJointSelectorDomainEvidence']=selector.data()
                    if selector.finite and selector.smooth:
                        row.update(globallyProved=True,proofStatus='PROVED_WHOLE_DOMAIN_ALL_ORDER_FLAT_BUMP_COMPOSITION',proofMethod='exact original bump match, arbitrary-order endpoint flatness and independently defined C-infinity whole-domain selector')
            if not row['globallyProved']:
                row['minimalRemainingObligation']=sorted(value.stops) or ['strict sign/flat matching on every actual original source application still unproved']
                row['conditionalChartProof']={'certificate':'original-chart-image-and-atlas-scaling.json','allActualGlobalCandidateBindingsVerified':False,'globallyProved':False}
            row['retainedOriginalSourceExpression']=serialize_scalar(program,i)
        except (RuntimeError,RecursionError,ValueError,KeyError) as error:
            row.update(proofStatus='ATTEMPT_STOP_RETAINED',failure={'type':type(error).__name__,'message':str(error)})
        rows.append(row)
        write(out/'guard-solve-progress.json',{'attemptedRemainingGuards':len(rows),'rows':rows})
        print(json.dumps({'id':row['id'],'kind':kind,'proofStatus':row['proofStatus'],'globallyProved':row['globallyProved']}),flush=True)
    write(out/'actual-fiber-integral-certificates.json',proof.integral_certificates)
    write(out/'additional-original-source-witnesses.json',source.evidence())
    closed=sum(r['globallyProved'] for r in rows)
    result={'schema':'MathScope.N6.DedicatedRemainingGlobalGuards/1','stage':'guard-solve',
        'originalParentNodesSHA256':PARENT,'originalGuardCount':94,'previouslyProvedGlobalGuards':35,
        'attemptedRemainingGuards':len(rows),'globallyClosedNewGuards':closed,'remainingGlobalGuards':59-closed,
        'totalGloballyProvedPrimitiveGuards':35+closed,'rows':rows,'original59Retained':len(rows)==59,
        'countsByKind':dict(Counter(r['originalGuard']['kind'] for r in rows)),
        'countsByStatus':dict(Counter(r['proofStatus'] for r in rows)),
        'sourceBinding':{'originalProgramSHA256':program_sha,'currentMatrixSHA256':file_sha(context['current_matrix_path']),
            'profileSHA256':PROFILE_SHA,'stepProducerSHA256':STEP_SHA,'originalRegistries':{k:d['definitionSHA256'] for k,d in definitions.items()}},
        'fiberWork':proof.work,'sourceSupportWork':calc.work,'globalChartCandidateAuditComplete':False,
        'wholeGlobalSourceImageProved':False,'commonFullFieldSupportProved':False,
        'actualGlobalRayleighEnvelopeProved':False,'actualPicardHolomorphicCoefficientNormsProved':False,
        'originalN601Complete':False,'originalN602Complete':False,'original56Of64Changed':False,
        'negativeControls':negative_controls(),'elapsedSeconds':time.monotonic()-started}
    # Preserve every actual guard attempt before a supplemental whole-registry
    # audit can hit its independent source/resource budget.
    write(out/'guard-solve-result.json',result)
    try:
        audit=audit_all_chart_rows(source,context)
    except (RuntimeError,RecursionError,ValueError,KeyError,MemoryError) as error:
        audit={'executionStatus':'ATTEMPT_STOP_RETAINED','failure':{'type':type(error).__name__,'message':str(error)},
            'globalSourceImageProved':False,'wholeGlobalCallGraphAudited':False}
    write(out/'actual-all-indexed-row-domain-audit.json',audit)
    result['actualAllRowStructuralAudit']={k:v for k,v in audit.items() if k!='rows'}
    result['globalChartCandidateAuditComplete']=audit.get('allActualIndexedRowsStructurallyVerified',False)
    result['elapsedSeconds']=time.monotonic()-started
    write(out/'additional-original-source-witnesses.json',source.evidence())
    write(out/'guard-solve-result.json',result);source.close();return result


def negative_controls():
    controls=[]
    fixtures=[('integral pole retained',[{'op':'rational','args':['0','1']},{'op':'rational','args':['1','1']},{'op':'coordinate','args':['t',2]},{'op':'inverse','args':[2]},{'op':'definite_integral','args':[3,2,0,1]}],4),
        ('opaque image not inferred',[{'op':'actual_opaque_value','args':[622820,'actual_monotone_root']}],0)]
    for name,nodes,root in fixtures:
        value=FiberProof(nodes,{}).at(root);rejected=not value.finite
        if not rejected:raise AssertionError('unsafe guard negative control accepted: '+name)
        controls.append({'mutation':name,'rejected':rejected})
    changed={'Md':{'integer':1048576},'T':{'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},
        'h':{'exp':{'product':[{'integer':8002},{'ref':'T'}]}},
        'lambda':{'exp':{'product':[{'integer':-1000},{'ref':'T'}]}},'co':{'rational':'1/256'}}
    try:parameter_theorem(changed)
    except ValueError:controls.append({'mutation':'h exponent sign','rejected':True})
    else:raise AssertionError('parameter sign mutation accepted')
    return controls
