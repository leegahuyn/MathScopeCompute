#!/usr/bin/env python3
"""N7-02 source-geometry structural regression, NOT actual C field completion.

Independent symbolic Cartesian differentiations are compared to the
existing original 67+13 rational jet composition backend. Exercises
  u = curl(C(s,z,tau) A(x,y,z,tau)) + C(s,z,tau)b(s,z,tau)*(-y,x,0)
  f = -partial_tau u - Delta u + (u.grad)u + grad(C p).
Also checks exact residual localization formula with w=grad(C) cross A.
All fixtures here are compact *polynomials*, not the actual A-D source or
compact smooth cutoffs, and do not supply original field input intervals.
"""
import argparse,json
from fractions import Fraction as Q
from pathlib import Path
import sympy as S
from conditional_67jet_force_intervals import ConditionalPointForce
from verify_real_67jet_readiness import load_source,REQ
from compile_original_67jet_force_stencil import compile_stencil

x,y,z,tau=S.symbols("x y z tau")
ss=S.symbols("s")
space=(x,y,z)
def gradient(expr):
    return S.Matrix([S.diff(expr,u) for u in space])
def curl(U):
    return S.Matrix([S.diff(U[2],y)-S.diff(U[1],z),
                     S.diff(U[0],z)-S.diff(U[2],x),
                     S.diff(U[1],x)-S.diff(U[0],y)])
def laplace(U):
    return S.Matrix([sum(S.diff(U[i],v,2) for v in space) for i in range(3)])
def advection(U,V):
    return S.Matrix([sum(U[j]*S.diff(V[i],space[j]) for j in range(3)) for i in range(3)])
def rational(v):
    q=S.cancel(v)
    if not q.is_Rational:
        raise ValueError("Independent polynomial evaluation is not rational")
    return Q(int(q.p),int(q.q))
def sample_fields():
    c=1+ss/S.Integer(7)+z*tau/S.Integer(11)+ss*z/S.Integer(13)
    b=1+ss/S.Integer(3)+z/S.Integer(5)+tau/S.Integer(7)
    A=S.Matrix([x*y+z*tau+x*x/S.Integer(3),
       y*z+x*tau/S.Integer(5)+z*z/S.Integer(7),
       x*z+y*tau/S.Integer(7)+x*y/S.Integer(11)])
    p=(x*x+y*y)/5+x*z/7+y*tau/11
    return c,b,A,p

def fixture_receipt(point):
    req,_=load_source(REQ)
    stencil=compile_stencil(req)
    radial_c,radial_b,A,p=sample_fields()
    C=radial_c.subs(ss,x*x+y*y)
    B=radial_b.subs(ss,x*x+y*y)
    q=S.Matrix([-y,x,S.Integer(0)])
    U0=curl(A)+B*q
    W=gradient(C).cross(A)
    U=curl(C*A)+C*B*q
    assert all(S.expand(U[i]-(C*U0+W)[i])==0 for i in range(3))
    div=S.expand(sum(S.diff(U[i],space[i]) for i in range(3)))
    if div!=0:raise AssertionError("Radial cutoff structural divergence no longer vanishes")
    CP=C*p
    R=lambda vel,pressure: -vel.diff(tau)-laplace(vel)+advection(vel,vel)+gradient(pressure)
    physical_force=R(U,CP)
    # Independently derive all localization corrections. In particular retain
    # the time derivative of curl cutoff, every quadratic W interaction,
    # pressure gradient p*grad(C), and all diffusion commutators.
    decomposed=C*R(U0,p)-S.diff(C,tau)*U0-W.diff(tau)
    decomposed+=(C*C-C)*advection(U0,U0)
    dotU0gradC=sum(U0[j]*S.diff(C,space[j]) for j in range(3))
    dotWgradC=sum(W[j]*S.diff(C,space[j]) for j in range(3))
    decomposed+=C*dotU0gradC*U0+C*advection(U0,W)
    decomposed+=dotWgradC*U0+C*advection(W,U0)+advection(W,W)
    decomposed-=sum(S.diff(C,v,2) for v in space)*U0
    decomposed-=2*S.Matrix([sum(S.diff(C,v)*S.diff(U0[i],v)
                                  for v in space) for i in range(3)])
    decomposed-=laplace(W)
    decomposed+=p*gradient(C)
    if any(S.expand(physical_force[i]-decomposed[i])!=0 for i in range(3)):
        raise AssertionError("Independent direct residual != full localization corrections")
    sx,sy,sz,st=point
    subs={x:S.Rational(sx),y:S.Rational(sy),z:S.Rational(sz),tau:S.Rational(st)}
    radial_sub={ss:subs[x]**2+subs[y]**2,z:subs[z],tau:subs[tau]}
    fns={"A0":A[0],"A1":A[1],"A2":A[2],"p":p,"b":radial_b,"C":radial_c}
    jet_intervals={}
    for label in req["requested_field_jets"]+req["requested_cutoff_jets"]:
        name,orders=label.split("@")
        n=tuple(int(k) for k in orders.split(","))
        args=(ss,z,tau) if name in ("b","C") else (x,y,z,tau)
        expression=fns[name]
        for arg,count in zip(args,n):
            if count:expression=S.diff(expression,arg,count)
        value=rational(expression.subs(radial_sub if name in ("b","C") else subs))
        jet_intervals[label]=[str(value),str(value)]
    xy={"x":[str(sx),str(sx)],"y":[str(sy),str(sy)]}
    result=ConditionalPointForce(jet_intervals,xy).evaluate()
    expected_u=[str(rational(S.expand(v).subs(subs))) for v in U]
    expected_f=[str(rational(S.expand(v).subs(subs))) for v in physical_force]
    expected_div=str(rational(div.subs(subs)))
    if result["velocity_intervals"]!=[[v,v] for v in expected_u]:
        raise AssertionError("Original 67+13 input jets produced WRONG velocity")
    if result["defined_force_intervals"]!=[[v,v] for v in expected_f]:
        raise AssertionError("Original 67+13 input jets produced WRONG direct PDE residual")
    if result["direct_divergence_interval"]!=[expected_div,expected_div]:
        raise AssertionError("Radial cutoff curl divergence mismatch")
    bad_u=C*U0             # negative control: forget grad(C) cross A
    omit_nonlin=-U.diff(tau)-laplace(U)+gradient(CP)
    if all(S.expand((U-bad_u)[i]).subs(subs)==0 for i in range(3)):
        raise AssertionError("Negative cutoff commutator control no longer distinguishes")
    if all(S.expand((physical_force-omit_nonlin)[i]).subs(subs)==0 for i in range(3)):
        raise AssertionError("Negative nonlinear residual control no longer distinguishes")
    return {"point_x_y_z_tau":[str(v) for v in point],
            "original_67_field_plus_13_cutoff_jet_inputs":len(jet_intervals),
            "source_geometry_u_equals_curl_CA_plus_cb_rotation":True,
            "independent_cartesian_velocity":[v for v in expected_u],
            "independent_cartesian_full_force":[v for v in expected_f],
            "direct_divergence":expected_div,
            "original_jet_backend_equals_independent_differentiation":True,
            "full_localization_commutator_equals_direct_3D_residual":True,
            "negative_missing_grad_c_cross_A_rejected":True,
            "negative_omitted_quadratic_u_grad_u_rejected":True,
            "stencil_sha_scope":stencil["schema"]}

def audit():
    pts=[(Q(1,3),Q(-2,5),Q(1,7),Q(1,2)),
         (Q(-3,7),Q(2,9),Q(3,11),Q(2,3))]
    rows=[fixture_receipt(p) for p in pts]
    return {"schema":"MathScope.M3.N7.Original67JetIndependentCartesianLocalizationAudit/1",
        "source_operator":"u=curl(C*A)+C*b(s,z,tau)*(-y,x,0); physical partial_t=-partial_tau",
        "actual_original_67_final_A_D_jet_interval_values_certified":0,
        "actual_original_C_native_definition_domains_authenticated":False,
        "source_original_finite_cutoff_or_tail_authenticated":False,
        "independent_full_three_dimensional_symbolic_cutoff_and_quadratic_regressions":len(rows),
        "polynomial_fixtures_not_final_C_D_solution":True,
        "rows":rows,"N6_02":"STILL_OPEN_GLOBAL","N7_02":"STILL_OPEN_ACTUAL_SOURCE",
        "N7_06":"OPEN","N8_05":"OPEN",
        "M3":"62/64","M4":"0/16","release":"HOLD"}

def main():
    p=argparse.ArgumentParser();p.add_argument("--out",type=Path)
    a=p.parse_args();r=audit()
    result=json.dumps(r,ensure_ascii=False,indent=2)+"\n"
    if a.out:a.out.write_text(result,encoding="utf-8")
    print(json.dumps({"independent_polynomial_cases":len(r["rows"]),
      "original_67_plus_13_interval_backend_matches_direct_PDE":True,
      "actual_final_C_D_jets_certified":0,"release":"HOLD"}))
if __name__=="__main__":main()
