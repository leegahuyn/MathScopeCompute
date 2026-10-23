#!/usr/bin/env python3
"""Exact rational finite DAG interval evaluator. No original final-field source authority."""
from __future__ import annotations
from dataclasses import dataclass
from fractions import Fraction

class UncertifiedExpression(ValueError): pass

def exact_fraction(value):
    if isinstance(value,(bool,float)) or not isinstance(value,(str,int,Fraction)):
        raise UncertifiedExpression('Floating-point or non-rational enclosure forbidden')
    return Fraction(value)

@dataclass(frozen=True)
class Interval:
    lo:Fraction
    hi:Fraction
    def __post_init__(self):
        if self.lo>self.hi:raise UncertifiedExpression('Reversed closed interval')
    @staticmethod
    def parse(x):
        if not isinstance(x,(tuple,list)) or len(x)!=2:
            raise UncertifiedExpression('Require exact rational endpoints')
        return Interval(exact_fraction(x[0]),exact_fraction(x[1]))
    def json(self):return [str(self.lo),str(self.hi)]
    def __add__(a,b):return Interval(a.lo+b.lo,a.hi+b.hi)
    def __neg__(a):return Interval(-a.hi,-a.lo)
    def __sub__(a,b):return a+(-b)
    def __mul__(a,b):
        v=[a.lo*b.lo,a.lo*b.hi,a.hi*b.lo,a.hi*b.hi]
        return Interval(min(v),max(v))
    def reciprocal(a):
        if a.lo<=0<=a.hi:raise UncertifiedExpression('Denominator interval includes zero')
        return Interval(Fraction(1,a.hi),Fraction(1,a.lo))
    def __truediv__(a,b):return a*b.reciprocal()
    def power(a,n):
        if type(n) is not int or abs(n)>1000:raise UncertifiedExpression('Require bounded integer power')
        if n<0:return a.power(-n).reciprocal()
        if n==0:return Interval(Fraction(1),Fraction(1))
        if n%2:return Interval(a.lo**n,a.hi**n)
        vs=[a.lo**n,a.hi**n]
        return Interval(Fraction(0) if a.lo<=0<=a.hi else min(vs),max(vs))

def evaluate_graph(nodes,root,variables,max_work=25000):
    if type(root) is not int or not 0<=root<len(nodes):
        raise UncertifiedExpression('Missing graph root')
    if len(nodes)>max_work:raise UncertifiedExpression('Budget exceeded without truncation')
    vals=[]
    for item in nodes:
        if not isinstance(item,dict):raise UncertifiedExpression('Non-object graph node')
        op=item.get('op');args=item.get('args',[])
        if not isinstance(args,list) or any(type(a) is not int or not 0<=a<len(vals) for a in args):
            raise UncertifiedExpression('Invalid forward reference')
        if op=='const':
            if args:raise UncertifiedExpression('Constant with arguments')
            q=exact_fraction(item.get('q'));v=Interval(q,q)
        elif op=='var':
            if args:raise UncertifiedExpression('Variable with arguments')
            name=item.get('name')
            if name not in variables:raise UncertifiedExpression('Closed-cell input missing')
            v=variables[name]
            if not isinstance(v,Interval):raise UncertifiedExpression('Invalid variable enclosure')
        elif op in ('add','mul') and len(args)>=2:
            v=vals[args[0]]
            for j in args[1:]:v=(v+vals[j]) if op=='add' else (v*vals[j])
        elif op=='sub' and len(args)==2:v=vals[args[0]]-vals[args[1]]
        elif op=='div' and len(args)==2:v=vals[args[0]]/vals[args[1]]
        elif op=='neg' and len(args)==1:v=-vals[args[0]]
        elif op=='pow_int' and len(args)==1:v=vals[args[0]].power(item.get('n'))
        else:raise UncertifiedExpression('Unsupported/unbounded operation '+str(op))
        vals.append(v)
    return vals[root]
