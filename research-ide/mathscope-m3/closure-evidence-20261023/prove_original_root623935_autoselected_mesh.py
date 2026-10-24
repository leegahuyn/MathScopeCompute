#!/usr/bin/env python3
"""Construct certified original integer mesh witnesses for general real source representatives.

The representative radial square-root and s^(1/2-h)*eta need not be rational.
Outward rational intervals enclose both quantities. An integer mesh index
selected from each interval is accepted ONLY when the entire interval is
strictly inside the original 3/(4 ell^6) cell. This is conditional on a
fixed mesh-index selection matching the actual runtime frozen coordinates.

A mathematical nearest-integer witness exists for every individual real
representative, since |E*x-round(E*x)|<=1/2<3/4. Computing one uniform
integer valid for every h in (0,2^-4096) may fail if the source ell is
too large relative to the finite enclosure precision, correctly OPEN.
"""
from fractions import Fraction as F
from math import isqrt
from prove_original_root623935_general_srep_image import (
    z_image_enclosure,graph_pin,ImageConditionOPEN,need,GRAPH_SHA)

def sqrt_positive_rational_interval(x,bits):
    need(type(x) is F and x>=0,'nonnegative exact radial square required')
    need(type(bits) is int and 32<=bits<=2048,'32<=bits<=2048 required')
    m=1<<bits
    k=isqrt(x.numerator*m*m//x.denominator)
    return F(k,m),F(k+1,m)

def nearest_integer_fraction(x):
    need(type(x) is F,'exact rational center required')
    return (2*x.numerator+x.denominator)//(2*x.denominator)

def select_original_integer_mesh(xlo,xhi,ell):
    need(type(ell) is int and ell>=3,'original ell>=3 required')
    need(type(xlo) is F and type(xhi) is F and xlo<=xhi,
         'valid rigorous real-coordinate enclosure required')
    E=ell**6
    k=nearest_integer_fraction((xlo+xhi)*F(E,2))
    # Inclusive comparisons at outer enclosures are deliberately NOT
    # silently weakened; the physical representative is strictly interior.
    tol=F(3,4*E)
    need(max(abs(xlo-F(k,E)),abs(xhi-F(k,E)))<tol,
         'outward real coordinate enclosure cannot certify a strict original integer mesh')
    return F(k),{'index':k,'physical_center':str(F(k,E)),
                  'outward_interval':[str(xlo),str(xhi)],
                  'strict_delta':str(tol),'strict_entire_interval_inside':True}

def certify_all_h_autoselected_representative(ell,Xa,Xb,Xrep,srep,eta,bits=100):
    vals=(Xa,Xb,Xrep,srep,eta)
    need(all(type(x) is F for x in vals),'exact source parameter witnesses required')
    need(0<Xa<=Xrep<=Xb and F(1,2)<=srep<=2 and -1<=eta<=1,
         'original representative X,s,eta chart required')
    need(type(ell) is int and ell>=3,'original integer ell>=3 required')
    E=ell**6
    Rlo,Rhi=sqrt_positive_rational_interval(2*srep*Xrep,bits)
    Zlo,Zhi=z_image_enclosure(srep,eta,bits)
    Trep=srep*(1-eta*eta)
    r,rc=select_original_integer_mesh(Rlo,Rhi,ell)
    z,zc=select_original_integer_mesh(Zlo,Zhi,ell)
    t,tc=select_original_integer_mesh(Trep,Trep,ell)
    rlo=(r-F(3,4))/E;rhi=(r+F(3,4))/E
    tlo=(t-F(3,4))/E;thi=(t+F(3,4))/E
    a=max(F(1,2),max(F(0),rlo)**2/(2*Xb))
    b=max(a,min(F(2),rhi*rhi/(2*Xa)))
    m=max(F(0),tlo);M=thi
    # Outward nonnegative radial sqrt interval -> R in [rlo,rhi].
    # R^2=2*srep*Xrep and Xa<=Xrep<=Xb imply a<=srep<=b.
    # Trep>=0 and strict time interior imply m<=Trep<M.
    need(F(1,2)<=a<=srep<=b<=2,'radial interval transport failed')
    need(0<=m<=Trep<M,'time interval transport failed')
    return {
      'schema':'MathScope.M3.OriginalRoot623935ExistentialMeshWitnessUniformSmallH/1',
      'original_AST_sha256_required':GRAPH_SHA,'actual_root_node':623935,
      'ell':ell,'representative_X':[str(Xa),str(Xrep),str(Xb)],
      'source_srep':str(srep),'source_eta_rep':str(eta),
      'radial_R_is_sqrt_of_2sX_even_if_irrational':True,
      'original_mesh_indices':[int(r),int(z),int(t)],
      'mesh_witnesses':{'r':rc,'z':zc,'t':tc},
      'radial_source_lower_denominator':'Xb',
      'radial_source_upper_denominator':'Xa',
      's_interval':[str(a),str(b)],
      'T_interval':[str(m),str(M)],
      'all_h_srep_Z_interval_contains_original_s_power_D_eta':True,
      'source_signed_projection_value_in_chart_image':True,
      'actual_mesh_selection_is_the_original_native_runtime_selection':False,
      'exists_some_valid_integer_mesh_for_each_representative':True,
      'all_runtime_source_mesh_index_bindings_proved':False,
      'piecewise_all_order_jet_gluing_proved':False,
      'original_523_Y_proved':33,'original_523_Y_OPEN':490,
      'final_67_jets':0,'M3':'62/64','M4':'0/16','release':'HOLD',
    }

if __name__=='__main__':
    import argparse,json
    p=argparse.ArgumentParser()
    p.add_argument('--original-graph')
    p.add_argument('--output')
    p.add_argument('--ell',type=int,default=3)
    a=p.parse_args()
    pinned=graph_pin(a.original_graph) if a.original_graph else {'source_AST_pin':'NOT_PERFORMED'}
    cert=certify_all_h_autoselected_representative(
      a.ell,F(1,2),F(3,2),F(1),F(3,4),F(3,5))
    cert.update({'graph_pin_evidence':pinned})
    out=json.dumps(cert,ensure_ascii=False,indent=2)
    if a.output:open(a.output,'w').write(out+'\n')
    print(out)
