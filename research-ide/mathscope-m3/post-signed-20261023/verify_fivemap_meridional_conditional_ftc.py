#!/usr/bin/env python3
"""Conditional FiveMap meridional divergence theorem; does not mint original private seals."""
import json
import sympy as S

def verify():
    R,Rin,Z,eps,a,Y=S.symbols('R Rin Z eps a Y',real=True,positive=True)
    s=S.Symbol('s',positive=True);Gamma=S.Function('Gamma')
    # Original FiveMap requires five-bump increment to be Y-free.
    psi=S.Integral(s*Gamma(s,Z),(s,Rin,R))/R
    beta=-eps*S.diff(psi,Z)
    Dz=lambda f:eps*S.diff(f,Z)
    Dr=lambda f:S.diff(f,R)+a*S.diff(f,Y)
    De=lambda f:Dr(f)+f/R
    gamma=Gamma(R,Z)
    value=S.simplify((De(psi)-gamma).doit())
    divergence=S.simplify((De(beta)+Dz(gamma)).doit())
    assert value==0 and divergence==0,(value,divergence)
    # Do not silently drop the fast torus derivative: it becomes nonzero
    # when Y-dependent gamma is inserted into the same unshifted integral.
    gammaY=Gamma(R,Z)*Y
    psiY=S.Integral(s*Gamma(s,Z)*Y,(s,Rin,R))/R
    betaY=-eps*S.diff(psiY,Z)
    assert S.simplify((De(psiY)-gammaY).doit())!=0
    assert S.simplify((De(betaY)+Dz(gammaY)).doit())!=0
    return {'schema':'MathScope.N6.FiveMapMeridionalConditionalFTC/1',
      'conditional_assumptions':['Y-free Gamma','positive radius','Gamma smooth',
         'Dr and Dz commute','weighted whole moment zero for compact radial support'],
      'meridional_potential_identity':'De(psi)=Gamma under Y independence',
      'meridional_divergence_identity':'De(beta)+Dz(Gamma)=0',
      'torus_dependence_mutation':'REJECTED',
      'actual_original_full_field_divergence_proved':False,
      'actual_source_Cinfty_and_cutoff_convergence_proved':False,
      'actual_five_moment_whole_zero_proved_here':False,
      'status':'CONDITIONAL_GENERIC_LEMMA_NOT_ORIGINAL_GLOBAL_CERTIFICATE',
      'release':'HOLD'}

if __name__=='__main__':print(json.dumps(verify(),indent=2))
