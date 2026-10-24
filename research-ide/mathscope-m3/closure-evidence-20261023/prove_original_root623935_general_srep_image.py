#!/usr/bin/env python3
"""Source-conditional all-s representative image theorem for root #623935.

This does not certify that runtime physical-field callers satisfy the guards.
It does not establish C^k joins, natural-series Y bounds, or final jets.
"""
from fractions import Fraction as F
from math import isqrt
import gzip,hashlib,json

GRAPH_SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
PINS={
  623921:('smooth_piecewise',[623914,0,0,623920,623920,623918]),
  623934:('multiply',[19,623933]),
  623935:('actual_monotone_root',[2,623921,623934]),
  623875:('maximum',[19,623874]),
  623883:('maximum',[623875,623882]),
  623858:('integer_power',[622791,6]),
  623859:('inverse',[623858]),
  623860:('multiply',[120836,623859]),
  623877:('multiply',[24,3617]),
  623873:('inverse',[137008]),
  137008:('multiply',[24,28826]),
  28826:('multiply',[12,28825]),
}
class ImageConditionOPEN(ValueError): pass

def need(ok,msg):
    if not ok: raise ImageConditionOPEN(msg)

def graph_pin(path):
    sha=hashlib.sha256();found={};count=0
    with gzip.open(path,'rb') as f:
        for row in f:
            sha.update(row)
            if count==0:
                need(json.loads(row)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},'AST header mismatch')
            else:
                node=count-1
                if node in PINS: found[node]=json.loads(row)
            count+=1
    need(sha.hexdigest()==GRAPH_SHA and count==4420258,'full AST sha/count mismatch')
    for n,(op,args) in PINS.items():
        need(found.get(n)=={'op':op,'args':args},f'AST source mismatch #{n}')
    return {'original_AST_sha256':GRAPH_SHA,'actual_root_node':623935,'pin_count':len(PINS)}

def z_image_enclosure(s,eta,bits=80):
    """Exact enclosing rationals for Z=s^(1/2-h)*eta, every 0<h<2^-4096.

    On [1/2,2], |log(s)|<=log(2)<1, so |h log s|<eps=2^-4096.
    Using 1-eps<exp(-h log s)<(1-eps)^-1 and exact sqrt rounding,
    the rational interval contains real Z without selecting a sample h.
    """
    need(type(s) is F and type(eta) is F,'rational s,eta witnesses required')
    need(F(1,2)<=s<=2 and -1<=eta<=1,'original s,eta bounds missing')
    need(type(bits) is int and 32<=bits<=2048,'invalid sqrt enclosure precision')
    scale=1<<bits
    floor=isqrt((s.numerator*scale*scale)//s.denominator)
    sqrt_lo=F(floor,scale);sqrt_hi=F(floor+1,scale)
    eps=F(1,1<<4096)
    amp_lo=sqrt_lo*(1-eps);amp_hi=sqrt_hi/(1-eps)
    if eta>=0:return amp_lo*eta,amp_hi*eta
    return amp_hi*eta,amp_lo*eta

def certify_general_representative(ell,r_index,z_index,t_index,Xa,Xb,Xrep,srep,Rrep,eta,bits=80):
    """Source-locked sufficient conditions, proved for all allowed real h.

    Mesh indices are integers (stored as exact rational witnesses). Strict Z/T
    interior intentionally excludes problematic zero-width switching faces.
    """
    need(type(ell) is int and ell>=3,'original integer ell>=3 missing')
    vals=(r_index,z_index,t_index,Xa,Xb,Xrep,srep,Rrep,eta)
    need(all(type(v) is F for v in vals),'exact rational witnesses required')
    need(all(v.denominator==1 for v in (r_index,z_index,t_index)),
         'original mesh index must be integer')
    need(0<Xa<=Xrep<=Xb and F(1,2)<=srep<=2,'source X/s bounds missing')
    need(Rrep>=0 and Rrep*Rrep==2*srep*Xrep,'original R^2=2sX identity missing')
    need(-1<=eta<=1,'source eta domain missing')
    E=ell**6;delta=F(3,4*E)
    rlo=(r_index-F(3,4))/E;rhi=(r_index+F(3,4))/E
    zlo=(z_index-F(3,4))/E;zhi=(z_index+F(3,4))/E
    tlo=(t_index-F(3,4))/E;thi=(t_index+F(3,4))/E
    Zlo,Zhi=z_image_enclosure(srep,eta,bits)
    Trep=srep*(1-eta*eta)
    need(rlo<=Rrep<=rhi,'radial representative not in THIS mesh')
    need(zlo<Zlo<=Zhi<zhi,'outward Z enclosure not strictly inside THIS mesh')
    need(tlo<Trep<thi,'time representative not strictly inside THIS mesh')
    # Source lower denominator Xb != upper denominator Xa.
    a=max(F(1,2),max(F(0),rlo)**2/(2*Xb))
    b=max(a,min(F(2),rhi*rhi/(2*Xa)))
    m=max(F(0),tlo);M=thi
    need(F(1,2)<=a<=srep<=b<=2,'original radial transport failed')
    need(0<=m<=Trep<M and m<=b,'original time transport failed')
    # For actual Z=srep^(1/2-h)*eta, g(srep)=Trep, where
    # g(s)=s-Z^2 s^(2h). Since Z^2<=2 and s in [1/2,2],
    # g'(s)=1-2hZ²s^(2h-1)>1-8h>1-2^-4093>1/2.
    # Therefore g(a)<=Trep<=g(b), and source annulus L<=|Z|<=U.
    # For eta!=0, M>Trep gives STRICT L<|Z|, so the signed
    # intersection containing the strictly interior Z has positive width
    # (from its side toward zero). For eta=0, L=0 and U>0 because
    # m<Trep=srep<=b; the negative intersection has positive width.
    # If w_negative>0 source chooses its valid midpoint; otherwise the
    # nonempty positive intersection has positive width and is selected.
    # Then max(m,g(a))<=min(M,g(b)), proving source T midpoint feasible.
    return {
      'schema':'MathScope.M3.OriginalRoot623935GeneralSrepConditionalImage/1',
      'original_root':623935,'original_AST_sha256_required':GRAPH_SHA,
      'srep':str(srep),'eta':str(eta),'ell':ell,
      'mesh_center_physical':[str(x/E) for x in (r_index,z_index,t_index)],
      'z_image_outward_for_every_h':[str(Zlo),str(Zhi)],
      's_bracket':[str(a),str(b)],'T_bracket':[str(m),str(M)],
      'strict_representative_Z_T_mesh_guards':True,
      'source_signed_projected_Z_T_in_image_for_every_source_h':True,
      'original_source_log_sqrt_domain_guards':True,
      'inverse_denominator_2s_ge_one':True,
      'piecewise_Ck_join_proved':False,
      'all_native_runtime_representatives_satisfy_guards':False,
      'original_global_monotone2_calls_newly_certified':0,
      'original_523_Y_certified':33,'original_523_Y_OPEN':490,
      'final_67_jets':0,'M3':'62/64','M4':'0/16','release':'HOLD'
    }

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--original-graph');p.add_argument('--output')
    a=p.parse_args()
    result=graph_pin(a.original_graph) if a.original_graph else {'original_AST_PIN':'NOT_RUN'}
    result.update(certify_general_representative(
        3,F(729),F(0),F(729),F(1,2),F(3,2),F(1,2),F(1),F(1),F(0)))
    output=json.dumps(result,indent=2)
    if a.output:open(a.output,'w').write(output+'\n')
    print(output)
