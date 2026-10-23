#!/usr/bin/env python3
"""Exact finite polynomial control: not certification of the original 4.4M-node source."""
import json
import sympy as s

r,z,t,theta,xi,v=s.symbols('r z t theta xi v', real=True)
eps=s.Rational(2,5); a=1+r*r
Dr=lambda x:s.diff(x,r)+a*s.diff(x,xi)
Dz=lambda x:eps*s.diff(x,z)
Dt=lambda x:-eps*s.diff(x,t)+s.diff(x,v)
Ang=lambda x:s.diff(x,theta)/r
Lap=lambda x:Dr(Dr(x))+Dr(x)/r+Dz(Dz(x))+s.diff(x,theta,2)/r**2
Div=lambda u:Dr(u[0])+u[0]/r+Ang(u[1])+Dz(u[2])
def bilinear(advector,field):
    a,b=advector,field
    out=[a[0]*Dr(x)+a[1]*Ang(x)+a[2]*Dz(x) for x in b]
    out[0]-=a[1]*b[1]/r
    out[1]+=a[1]*b[0]/r
    return out
def residual(u,p):
    viscosity=[Lap(u[0])-u[0]/r**2-2*s.diff(u[1],theta)/r**2,
               Lap(u[1])-u[1]/r**2+2*s.diff(u[0],theta)/r**2,Lap(u[2])]
    pressure=[Dr(p),Ang(p),Dz(p)]
    quad=bilinear(u,u); d=Div(u)
    return [Dt(u[j])-eps*viscosity[j]+pressure[j]+quad[j]+u[j]*d for j in range(3)]
def main():
    U=[r*xi+theta*z+t,z*theta+r*v,r*z+xi*t]
    dU=[z*v+theta*r,r*xi+theta*t,z*xi+r*v]
    p=r*z+t*xi+theta*v;dp=r*theta+z*v+xi*t
    direct=residual([U[i]+dU[i] for i in range(3)],p+dp)
    old=residual(U,p);inc=residual(dU,dp)
    left=bilinear(U,dU);right=bilinear(dU,U)
    split=[old[j]+inc[j]+left[j]+right[j]+U[j]*Div(dU)+dU[j]*Div(U) for j in range(3)]
    difference=[s.cancel(direct[j]-split[j]) for j in range(3)]
    assert difference==[0,0,0],difference
    assert s.cancel(direct[1]-(split[1]-dU[1]*U[0]/r))!=0
    assert s.cancel(Div(U))!=0 and s.cancel(Div(dU))!=0
    return {'schema':'MathScope.N6.CylindricalFinitePolarizationControl/1',
            'component_defects':['0','0','0'],'mutation_control':'PASS',
            'includes_slow_fast_theta_derivatives':True,
            'includes_nonlinear_cross_terms':True,
            'includes_conservative_divergence_correction':True,
            'classification':'FINITE_POLYNOMIAL_CONTROL_NOT_ACTUAL_SOURCE',
            'original_full_field_certified':False,'release':'HOLD'}
if __name__=='__main__':print(json.dumps(main(),indent=2))
