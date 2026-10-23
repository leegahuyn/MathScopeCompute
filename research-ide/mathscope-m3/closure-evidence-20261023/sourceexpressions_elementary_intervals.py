#!/usr/bin/env python3
"""Fail-closed exact rational interpreter for original SourceExpressions node signatures.

Supports only rational, coordinate, add, multiply, inverse, integer_power.
All original native symbolic / source parameters / exp / definite integral /
ODE / derivative / cutoff operations need separately justified interval kernels.
This generic finite interpreter NEVER certifies MathScope's final A,b,p.
"""
from fractions import Fraction
from rigorous_rational_intervals import Interval,UncertifiedExpression,exact_fraction

class UnsupportedOriginalNumericKernel(UncertifiedExpression):
    def __init__(self,operation,node_id):
        self.operation=operation;self.node_id=node_id
        super().__init__('MISSING_ORIGINAL_INTERVAL_KERNEL '+str(operation)+' node='+str(node_id))

def _require(cond,message):
    if not cond:raise UncertifiedExpression(message)

def _node_inputs(args,previous,arity):
    _require(type(args) is list and len(args)==arity,'Wrong SourceExpressions node arity')
    _require(all(type(x) is int and 0<=x<len(previous) for x in args),
       'Missing/forward SourceExpressions numeric argument')
    return [previous[x] for x in args]

def evaluate_original_elementary_nodes(nodes,roots,coordinates,max_nodes=20000):
    _require(type(nodes) is list and 0<len(nodes)<=max_nodes,
       'Finite original node budget exhausted; no partial result promoted')
    _require(type(roots) is list and roots and
       all(type(x) is int and 0<=x<len(nodes) for x in roots),
       'Every root must be an existing node index')
    _require(type(coordinates) is dict,'Closed coordinate boxes required')
    variables={name:Interval.parse(raw) for name,raw in coordinates.items()}
    evaluated=[]
    for i,node in enumerate(nodes):
        _require(type(node) is dict and set(node)=={'op','args'},
           'Original source node schema must remain unchanged')
        op,args=node['op'],node['args']
        if op=='rational':
            _require(type(args) is list and len(args)==2 and
                all(type(x) is str and x.lstrip('-').isdigit() for x in args),
                'SourceExpressions rational must use decimal numerator and denominator')
            d=int(args[1]);_require(d!=0,'Source rational zero denominator')
            q=Fraction(int(args[0]),d);result=Interval(q,q)
        elif op=='coordinate':
            _require(type(args) is list and len(args)==1 and type(args[0]) is str,
                'SourceExpressions coordinate label absent')
            _require(args[0] in variables,'Physical coordinate bound missing: '+args[0])
            result=variables[args[0]]
        elif op=='add':
            a,b=_node_inputs(args,evaluated,2);result=a+b
        elif op=='multiply':
            a,b=_node_inputs(args,evaluated,2);result=a*b
        elif op=='inverse':
            (a,)=_node_inputs(args,evaluated,1);result=a.reciprocal()
        elif op=='integer_power':
            _require(type(args) is list and len(args)==2 and
                type(args[0]) is int and 0<=args[0]<len(evaluated) and
                type(args[1]) is int,'Original integer power args invalid')
            result=evaluated[args[0]].power(args[1])
        else:
            raise UnsupportedOriginalNumericKernel(op,i)
        evaluated.append(result)
    return {'schema':'MathScope.M3.OriginalElementaryASTIntervals/1',
       'node_count':len(evaluated),
       'roots':{str(i):evaluated[i].json() for i in roots},
       'input_coordinates':sorted(variables),
       'source':'FINITE_ELEMENTARY_SUBGRAPH_ONLY',
       'actual_final_A_b_p_provenance_verified':False,
       'actual_original_67_jet_intervals_certified':0,
       'all_order_smoothness_verified':False,'release':'HOLD'}
