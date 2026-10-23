#!/usr/bin/env python3
"""Exact multiindex compiler for the 67 original final-field and 13 cutoff jets.

For u = curl(C A) + C*b(s,z,tau)*(-y,x,0), s=x*x+y*y,
f = -d_tau u - Delta u + (u.grad)u + grad(C*p).
This is a structural sufficiency theorem for pointwise source *inputs*,
NOT evaluation of final source functions, an actual numerical enclosure,
a proof of all-j regularity or a global forcing certificate.
"""
import argparse,itertools,json
from collections import Counter
from fractions import Fraction
from pathlib import Path

ZERO=(0,0,0,0)
E=tuple(tuple(int(i==j) for i in range(4)) for j in range(4))
BASIS=(ZERO,E[3],*E[:3],*(add(a,a) for a in E[:3])) if False else None
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def partitions(a):
    return itertools.product(*(range(x+1) for x in a))
def poly_plus(a,b):
    c=dict(a)
    for k,v in b.items():
        c[k]=c.get(k,Fraction(0))+v
        if not c[k]:del c[k]
    return c
def poly_derivative(a,d):
    c={}
    for exps,v in a.items():
        if exps[d]:
            out=list(exps);out[d]-=1;out=tuple(out)
            c[out]=c.get(out,Fraction(0))+v*exps[d]
    return c
def poly_mul_xy(a,d):
    c={}
    for exps,v in a.items():
        out=list(exps);out[d]+=1;out=tuple(out)
        c[out]=c.get(out,Fraction(0))+2*v
    return c
def composite_multiindices(cart):
    """Exact Faà di Bruno support via derivations Dx=dx+2x ds, Dy=dy+2y ds."""
    out=set()
    for alpha in cart:
        state={(0,0,0):{(0,0):Fraction(1)}}
        for direction in (0,1):
            for _ in range(alpha[direction]):
                after={}
                for jet,coef in state.items():
                    k=poly_derivative(coef,direction)
                    if k:after[jet]=poly_plus(after.get(jet,{}),k)
                    nextjet=(jet[0]+1,jet[1],jet[2])
                    after[nextjet]=poly_plus(after.get(nextjet,{}),poly_mul_xy(coef,direction))
                state={k:v for k,v in after.items() if v}
        for k,coef in state.items():
            if coef:out.add((k[0],alpha[2],alpha[3]))
    return out
def requested(req):
    targets=req['requested_field_jets'];cutoffs=req['requested_cutoff_jets']
    def parse(values):
        d={}
        for label in values:
            name,orders=label.split('@')
            d.setdefault(name,set()).add(tuple(map(int,orders.split(','))))
        return d
    return parse(targets),parse(cutoffs)
def compile_stencil(req):
    if req.get('coordinates')!={'A_and_p':['x','y','z','tau'],
      'b_and_C':['s','z','tau'],'physical_time_derivative':'-partial_tau'}:
        raise ValueError('Original coordinate and physical-time convention missing')
    have,cut_have=requested(req)
    if set(have)!={'A0','A1','A2','b','p'} or set(cut_have)!={'C'}:
        raise ValueError('Original field/cutoff identities changed')
    basis=(ZERO,E[3],*E[:3],*(add(x,x) for x in E[:3]))
    curl=(((2,1),(1,2)),((0,2),(2,0)),((1,0),(0,1)))
    needA={f'A{i}':set() for i in range(3)}
    needCcart=set();needBcart=set()
    # Velocity and its dt, gradient and Laplacian need curl derivatives
    for terms in curl:
        for alpha in basis:
            for component,d in terms:
                total=add(alpha,E[d])
                for beta in partitions(total):
                    needA[f'A{component}'].add(beta)
                    needCcart.add(sub(total,beta))
    # C*b(s,z,tau)*(-y,x,0) and the product rule for x,y factors
    for alpha in basis:
        for rotated_coordinate in (0,1):
            needBcart.add(alpha)
            if alpha[rotated_coordinate]:
                needBcart.add(sub(alpha,E[rotated_coordinate]))
    # grad(C*p)
    needP={ZERO,*E[:3]}
    needCcart.update(needP)
    # product C*b may require all partitions of each b derivative
    for alpha in needBcart:
        needCcart.update(partitions(alpha))
    needB=composite_multiindices(needBcart)
    needC=composite_multiindices(needCcart)
    need={**needA,'b':needB,'p':needP}
    failures={k:{'missing':sorted(need[k]-have.get(k,set())),
                 'unexpected':sorted(have.get(k,set())-need[k])} for k in need}
    failures['C']={'missing':sorted(needC-cut_have['C']),
                    'unexpected':sorted(cut_have['C']-needC)}
    if any(row['missing'] or row['unexpected'] for row in failures.values()):
        raise ValueError('Original 67+13 derivative-stencil mismatch: '+repr(failures))
    out={'schema':'MathScope.M3.Original67Plus13ForceDerivativeStencil/1',
      'operator':'u=curl(C*A)+C*b(s,z,tau)*(-y,x,0); f=-partial_tau(u)-Delta(u)+(u.grad)u+grad(C*p)',
      'radial_coordinate':'s=x*x+y*y',
      'cartesian_source_derivatives':{k:[list(t) for t in sorted(need[k])] for k in ('A0','A1','A2','p')},
      'radial_source_derivatives':{k:[list(t) for t in sorted(need[k])] for k in ('b',)},
      'radial_cutoff_derivatives':{'C':[list(t) for t in sorted(needC)]},
      'original_target_counts':{k:len(have[k]) for k in ('A0','A1','A2','b','p')},
      'original_cutoff_count':len(cut_have['C']),
      'original_final_field_value_intervals_obtained':0,
      'original_cutoff_cell_interval_values_obtained':0,
      'original_cell_interval_backend_connected':False,
      'actual_field_evaluator_identified':False,
      'actual_external_force_proved':False,
      'scope':'EXACT_GENERIC_POINTWISE_DERIVATIVE_DEPENDENCIES_NOT_NUMERIC_EVALUATION',
      'release':'HOLD'}
    assert sum(out['original_target_counts'].values())==67 and out['original_cutoff_count']==13
    return out
def main():
    p=argparse.ArgumentParser()
    p.add_argument('--out',type=Path)
    a=p.parse_args()
    from verify_real_67jet_readiness import load_source,REQ
    req,_=load_source(REQ)
    result=compile_stencil(req)
    if a.out:
        a.out.parent.mkdir(parents=True,exist_ok=True)
        a.out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'exact_structural_inputs':'67+13','missing_stencil_derivatives':0,
      'actually_certified_final_field_jet_intervals':0,'release':'HOLD'}))
if __name__=='__main__':main()
