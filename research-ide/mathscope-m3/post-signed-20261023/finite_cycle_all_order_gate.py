#!/usr/bin/env python3
"""Strict finite four-cycle source AST chaining. Not all-order mathematical certification."""
from fractions import Fraction
class IncompleteCycle(ValueError):pass
def need(x,msg):
    if not x:raise IncompleteCycle(msg)
def validate_finite_cycles(cycles):
    need(isinstance(cycles,list) and len(cycles)==4,'A,B,C,D are all required')
    previous=None;seen=set()
    for i,(label,x) in enumerate(zip('ABCD',cycles)):
        digest=x.get('source_graph_sha256')
        need(x.get('cycle')==label and x.get('stage_index')==i,'wrong stage order')
        need(isinstance(digest,str) and len(digest)==64 and digest not in seen,
             'missing or repeated source graph digest')
        need(x.get('inherited_source_graph_sha256')==previous,'stage source not inherited')
        for name in ('forced','signed','temporal','five_map','updated_full_pressure','full_3d_pde'):
            need(x.get(name)=='ACTUAL_SOURCE_AST_VERIFIED','incomplete actual cycle: '+name)
        for name in ('velocity_roots','pde_residual_roots'):
            values=x.get(name)
            need(isinstance(values,list) and len(values)==3 and
                 all(type(v) is int and v>=0 for v in values),'missing physical roots')
        need(type(x.get('pressure_root')) is int and x['pressure_root']>=0,
             'fresh full physical pressure required')
        need(x.get('cutoff_before_curl') is True and
             x.get('actual_nonzero_fourier_tail_retained') is True,
             'original cutoff/Fourier ordering changed')
        previous=digest;seen.add(digest)
    return {'finite_chain_structural_audit':True,'all_j_common_domain_proved':False,
            'all_m_analytic_bounds_proved':False,'actual_source_chain_math_proved':False,
            'original_release':'HOLD'}
def finite_bounds(rows):
    need(isinstance(rows,list) and rows,'finite bounds need rows')
    keys=set()
    for r in rows:
        j,m=r['j'],r['m']
        need(type(j) is int and j>=0 and type(m) is int and m>=0 and
             (j,m) not in keys,'invalid/duplicated derivative order')
        keys.add((j,m))
        d0,d1=Fraction(r['domain_min_radius']),Fraction(r['domain_max_radius'])
        C,loss=Fraction(r['derivative_bound']),Fraction(r['derivative_loss'])
        need(0<d0<=d1 and C>=0 and loss>=0,'positive domain and finite nonnegative estimates')
        need(isinstance(r.get('source_field_norm_sha256'),str) and
             len(r['source_field_norm_sha256'])==64,'source coefficient digest missing')
    return {'finite_estimate_rows':len(rows),'uniform_all_m_proved':False,
            'common_domain_all_j_proved':False}
