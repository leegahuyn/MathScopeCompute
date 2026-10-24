#!/usr/bin/env python3
"""SHA-bound order-one Omega prefix: only conditional Omega2>=0.

Under X>=0 and real integrable v0,
 Omega2(X)=integral_[0,X] v0(x)^2 dx >=0.
Omega0/Omega1 signs and every upper bound remain OPEN. Not a proof
that all 70 natural-series call sites respect their original domains.
"""
from pathlib import Path
import hashlib,json,sys
from audit_original_local_B2_radius_41 import original_blob_sha, ORDER_ONE_BLOB

class ChangedOmegaSource(ValueError):pass

def source_omega_sign_contract(path=None):
    if path is None:
        path=Path(__file__).resolve().parents[2]/'mathscope-m2/navier/actual-continuation-exact-order-one.mjs'
    data=Path(path).read_bytes()
    if original_blob_sha(data)!=ORDER_ONE_BLOB:
        raise ChangedOmegaSource('Original source blob changed')
    src=data.decode('utf-8')
    necessary=[
      "const at=(id,x)=>G.substitute(id,X,x),integrate=(body,left,right,prefix)=>{const t=G.fresh(prefix);return G.integral(at(body,t),t,left,right);};",
      "const prefixBodies=[v0,G.mul(U0,v0),G.pow(v0,2)],prefix=prefixBodies.map((body,j)=>integrate(body,z,X,'actual_n1_Omega_prefix'+j));",
    ]
    if any(item not in src for item in necessary):
        raise ChangedOmegaSource('Original integrand definition changed')
    return {
      'schema':'MathScope.M3.OriginalOmegaPrefixConditionalSign/1',
      'original_order_one_blob_SHA1':ORDER_ONE_BLOB,
      'original_order_one_SHA256':hashlib.sha256(data).hexdigest(),
      'prefix_j_to_integrand':['v0','U0*v0','v0^2'],
      'prefix_j_source_function_names':['actual_n1_Omega_prefix0','actual_n1_Omega_prefix1','actual_n1_Omega_prefix2'],
      'conditional_hypotheses':['X>=0','v0 real and integrable on [0,X]'],
      'Omega2_nonnegative_under_stated_hypotheses':True,
      'Omega0_sign_from_source_alone':'UNKNOWN',
      'Omega1_sign_from_source_alone':'UNKNOWN',
      'upper_for_any_Omega_from_sign_alone':False,
      'additional_upper_requirements':{
          'Omega0':'Lambda*X*sup_[0,X]|v0| <=5 and Omega0>=0',
          'Omega1':'Lambda*X*sup_[0,X]|U0|*sup_[0,X]|v0| <=5 and Omega1>=0',
          'Omega2':'Lambda*X*(sup_[0,X]|v0|)^2 <=5',
      },
      'all_70_Omega_natural_calls_Y_bounds_certified':False,
      'new_full_original_Y_certified_calls':0,
      'original_Y_certified_calls':33,
      'original_Y_unproved_calls':490,
      'M3':'62/64','M4':'0/16','final_67_jets':0,'release':'HOLD',
    }

if __name__=='__main__':
    r=source_omega_sign_contract()
    if len(sys.argv)>1:
        Path(sys.argv[1]).write_text(json.dumps(r,indent=2)+'\n')
    print(json.dumps(r,indent=2))
