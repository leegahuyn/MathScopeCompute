#!/usr/bin/env python3
"""EXACT CONDITIONAL forcing enclosure from all 67 A,b,p + 13 cutoff jet intervals.

u=curl(C A)+C*b(s,z,tau)*(-y,x,0), s=x²+y².
f=-partial_tau u -Delta u +(u.grad)u +grad(C p).
All 80 input intervals MUST be supplied. Actual original function evaluations
and independent source provenance are NOT available: outputs are NEVER certificates.
"""
import json
from functools import lru_cache
from math import comb
from fractions import Fraction
from rigorous_rational_intervals import Interval,UncertifiedExpression
from compile_original_67jet_force_stencil import (
 E,ZERO,add,sub,partitions,poly_plus,poly_derivative,poly_mul_xy,compile_stencil)
from verify_real_67jet_readiness import load_source,REQ

def label(name,alpha):return name+'@'+','.join(map(str,alpha))
def constant(q):return Interval(Fraction(q),Fraction(q))
class ConditionalPointForce:
    def __init__(self,jets,xy):
        req,_=load_source(REQ);compile_stencil(req)
        required=set(req['requested_field_jets']+req['requested_cutoff_jets'])
        if type(jets) is not dict or set(jets)!=required:
            raise UncertifiedExpression('Require all and only original 67+13 closed-interval inputs')
        if type(xy) is not dict or set(xy)!={'x','y'}:
            raise UncertifiedExpression('Require point or closed-cell x,y intervals')
        self.values={k:Interval.parse(v) for k,v in jets.items()}
        self.x=Interval.parse(xy['x']);self.y=Interval.parse(xy['y'])
        self.zero=constant(0)
    @lru_cache(None)
    def chain(self,name,alpha):
        if name not in ('C','b') or len(alpha)!=4:
            raise UncertifiedExpression('Invalid radial composite derivative')
        state={(0,0,0):{(0,0):Fraction(1)}}
        for d in (0,1):
            for _ in range(alpha[d]):
                nxt={}
                for jet,coeff in state.items():
                    derivative=poly_derivative(coeff,d)
                    if derivative:nxt[jet]=poly_plus(nxt.get(jet,{}),derivative)
                    shifted=(jet[0]+1,jet[1],jet[2])
                    nxt[shifted]=poly_plus(nxt.get(shifted,{}),poly_mul_xy(coeff,d))
                state={key:v for key,v in nxt.items() if v}
        result=self.zero
        for (ns,_,__),coeff in state.items():
            key=label(name,(ns,alpha[2],alpha[3]))
            if key not in self.values:raise UncertifiedExpression('Missing source radial jet '+key)
            poly=self.zero
            for (px,py),value in coeff.items():
                poly=poly+constant(value)*self.x.power(px)*self.y.power(py)
            result=result+poly*self.values[key]
        return result
    @lru_cache(None)
    def CA(self,j,alpha):
        result=self.zero
        for beta in partitions(alpha):
            gamma=sub(alpha,beta)
            key=label('A'+str(j),gamma)
            if key not in self.values:raise UncertifiedExpression('Missing original '+key)
            coefficient=1
            for a,b in zip(alpha,beta):coefficient*=comb(a,b)
            result=result+constant(coefficient)*self.chain('C',beta)*self.values[key]
        return result
    @lru_cache(None)
    def CB(self,alpha):
        result=self.zero
        for beta in partitions(alpha):
            gamma=sub(alpha,beta);coefficient=1
            for a,b in zip(alpha,beta):coefficient*=comb(a,b)
            result=result+constant(coefficient)*self.chain('C',beta)*self.chain('b',gamma)
        return result
    @lru_cache(None)
    def Cp(self,alpha):
        result=self.zero
        for beta in partitions(alpha):
            gamma=sub(alpha,beta);key=label('p',gamma)
            if key not in self.values:raise UncertifiedExpression('Missing original '+key)
            coefficient=1
            for a,b in zip(alpha,beta):coefficient*=comb(a,b)
            result=result+constant(coefficient)*self.chain('C',beta)*self.values[key]
        return result
    @lru_cache(None)
    def velocity(self,i,alpha):
        curl=(((2,1),(1,2)),((0,2),(2,0)),((1,0),(0,1)))
        (first,d),(second,k)=curl[i]
        result=self.CA(first,add(alpha,E[d]))-self.CA(second,add(alpha,E[k]))
        if i==0:
            result=result-self.y*self.CB(alpha)
            if alpha[1]:result=result-constant(alpha[1])*self.CB(sub(alpha,E[1]))
        elif i==1:
            result=result+self.x*self.CB(alpha)
            if alpha[0]:result=result+constant(alpha[0])*self.CB(sub(alpha,E[0]))
        return result
    def evaluate(self):
        velocity=[self.velocity(i,ZERO) for i in range(3)]
        force=[]
        for i in range(3):
            term=-self.velocity(i,E[3])
            for d in range(3):term=term-self.velocity(i,add(E[d],E[d]))
            for d in range(3):term=term+velocity[d]*self.velocity(i,E[d])
            force.append(term+self.Cp(E[i]))
        div=self.zero
        for i in range(3):div=div+self.velocity(i,E[i])
        return {'schema':'MathScope.M3.Conditional67Plus13ForceInterval/1',
          'input_interval_count':80,
          'velocity_intervals':[x.json() for x in velocity],
          'defined_force_intervals':[x.json() for x in force],
          'direct_divergence_interval':div.json(),
          'algebraic_divergence_zero_for_smooth_input_fields':True,
          'actual_source_final_jet_enclosures_certified':0,
          'original_source_input_interval_provenance_verified':False,
          'actual_original_force_proved':False,
          'status':'CONDITIONAL_INTERVAL_COMPOSITION_NOT_ACTUAL_SOURCE',
          'release':'HOLD'}
def fixture_linear_curl():
    req,_=load_source(REQ)
    jets={x:['0','0'] for x in req['requested_field_jets']+req['requested_cutoff_jets']}
    jets['C@0,0,0']=['1','1']
    jets['A2@0,0,0,0']=['6','6']
    jets['A2@1,0,0,0']=['3','3']
    jets['A2@0,1,0,0']=['2','2']
    jets['A2@1,1,0,0']=['1','1']
    return jets,{'x':['2','2'],'y':['3','3']}
if __name__=='__main__':
    jets,xy=fixture_linear_curl()
    r=ConditionalPointForce(jets,xy).evaluate()
    assert r['velocity_intervals']==[['2','2'],['-3','-3'],['0','0']],r
    assert r['defined_force_intervals']==[['2','2'],['3','3'],['0','0']],r
    assert r['direct_divergence_interval']==['0','0'],r
    assert r['actual_source_final_jet_enclosures_certified']==0
    print(json.dumps({'synthetic_exact_curl_fixture':'PASS','real_source_jets_certified':0,'release':'HOLD'}))
