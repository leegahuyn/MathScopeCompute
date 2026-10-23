#!/usr/bin/env python3
"""Universal smooth-field algebra only; does not certify actual infinite MathScope source."""
import json
import sympy as S
def audit():
    x,y,z,t=S.symbols('x y z t',real=True)
    coords=(x,y,z)
    chi=S.Function('chi')(x,y,z,t)
    A=[S.Function('A'+str(j))(x,y,z,t) for j in range(3)]
    curl=lambda a:[S.diff(a[2],y)-S.diff(a[1],z),S.diff(a[0],z)-S.diff(a[2],x),S.diff(a[1],x)-S.diff(a[0],y)]
    cross=lambda a,b:[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
    grad=[S.diff(chi,c) for c in coords]
    before=curl([chi*v for v in A])
    after=[chi*v+w for v,w in zip(curl(A),cross(grad,A))]
    differences=[S.simplify(a-b) for a,b in zip(before,after)]
    div=S.simplify(sum(S.diff(before[j],coords[j]) for j in range(3)))
    radial=S.symbols('s',nonnegative=True)
    b=S.Function('b')(radial,z,t).subs(radial,x*x+y*y)
    angular=[-y*b,x*b,S.Integer(0)]
    div_angular=S.simplify(sum(S.diff(angular[j],coords[j]) for j in range(3)))
    missing_commutator=[S.simplify(a-chi*v) for a,v in zip(before,curl(A))]
    if differences!=[0,0,0] or div!=0 or div_angular!=0 or all(q==0 for q in missing_commutator):
        raise AssertionError('Cutoff-before-curl identity or mutation check failed')
    return {'schema':'MathScope.N6.FiniteCutoffBeforeCurlIdentity/1',
            'curl_product_rule_defects':['0']*3,'divergence_of_curl':'0',
            'axis_regular_angular_b_divergence':'0','missing_grad_chi_cross_A_rejected':True,
            'actual_original_cutoff_field_bound':False,'common_domain_proved':False,
            'infinite_series_converged':False,
            'classification':'GENERIC_SYMBOLIC_FINITE_IDENTITY_NOT_SOURCE_PROOF'}
if __name__=='__main__':print(json.dumps(audit(),indent=2))
