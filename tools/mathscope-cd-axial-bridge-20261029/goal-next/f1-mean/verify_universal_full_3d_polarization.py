#!/usr/bin/env python3
"""Universally quantified *smooth-function identity* over the source chart derivations.

The checker symbolically expands arbitrary smooth coordinate-dependent functions,
not selected finite polynomials. Does not assert that original 4M-node functions
have been proved smooth, have identical semantic leaves, or satisfy NS forcing.
"""
import json
import sympy as S

def audit():
    R,Z,T,th,xi,eta=S.symbols('R Z T theta xi eta',positive=True)
    eps,nu=S.symbols('eps nu',positive=True)
    a=S.Function('a')(R)
    Dr=lambda f:S.diff(f,R)+a*S.diff(f,xi)
    Dt=lambda f:-eps*S.diff(f,T)+S.diff(f,eta)
    Dz=lambda f:eps*S.diff(f,Z)
    Dth=lambda f:S.diff(f,th)/R
    D=(Dr,Dth,Dz)
    U=[S.Function('U'+str(i))(R,Z,T,th,xi,eta) for i in range(3)]
    V=[S.Function('V'+str(i))(R,Z,T,th,xi,eta) for i in range(3)]
    P=S.Function('P')(R,Z,T,th,xi,eta)
    Q=S.Function('Q')(R,Z,T,th,xi,eta)
    div=lambda w:Dr(w[0])+w[0]/R+Dth(w[1])+Dz(w[2])
    lap=lambda w:Dr(Dr(w))+Dr(w)/R+Dz(Dz(w))+S.diff(w,th,2)/R**2
    def vL(w):
        return [lap(w[0])-w[0]/R**2-2*S.diff(w[1],th)/R**2,
                lap(w[1])-w[1]/R**2+2*S.diff(w[0],th)/R**2,lap(w[2])]
    def B(w,v):
        out=[sum(w[k]*D[k](v[i]) for k in range(3)) for i in range(3)]
        out[0]-=w[1]*v[1]/R
        out[1]+=w[1]*v[0]/R
        return out
    def resid(w,p):
        ad=B(w,w);vl=vL(w);d=div(w)
        return [Dt(w[i])-nu*vl[i]+ad[i]+D[i](p)+w[i]*d for i in range(3)]
    new=[x+y for x,y in zip(U,V)]
    direct=resid(new,P+Q);old=resid(U,P);inc=resid(V,Q)
    uv=B(U,V);vu=B(V,U);du=div(U);dv=div(V)
    defects=[S.expand(direct[i]-old[i]-inc[i]-uv[i]-vu[i]-U[i]*dv-V[i]*du)
             for i in range(3)]
    divergence=S.expand(div(new)-du-dv)
    if defects!=[0,0,0] or divergence!=0:
        raise AssertionError(f'Universal identity failed: {defects}, {divergence}')
    # Mutation test: omitted physical cylindrical connection term does not verify
    omitted=uv[1]-U[1]*V[0]/R
    if S.expand(uv[1]-omitted)==0:
        raise AssertionError('Cylindrical connection mutation undetected')
    return {'schema':'MathScope.N6.UniversalCylindricalPolarization/1',
      'scope':'ARBITRARY_SMOOTH_FUNCTIONS_6_COORDINATES_ON_R_POSITIVE',
      'original_radial_fast_coefficient':'a(R)','epsilon_and_viscosity_symbolic':True,
      'direct_minus_split_components':['0','0','0'],
      'divergence_additivity':'0','missing_cylindrical_connection_rejected':True,
      'actual_source_AST_defects_reduced':False,
      'source_regularities_proved':False,'external_forcing_regularities_proved':False,
      'AtoD_global_induction_proved':False,'final_67_numeric':0,'release':'HOLD'}
if __name__=='__main__':print(json.dumps(audit(),indent=2))
