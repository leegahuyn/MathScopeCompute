#!/usr/bin/env python3
"""Exact original band offsets and caller transport in a source slow chart.

The original integer ell is kept symbolic. No selector constant, global point,
radial endpoint, or fixed representative is manufactured by this module.
"""
from __future__ import annotations
from fractions import Fraction as Q
from math import isqrt
from pathlib import Path
import hashlib
import json
import sys
import types

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
CAPSULE_SHA256='620925294060e0c821492c5bbf2dcc20cfcab2c83e9a937fa3798498813dec06'
NATIVE_SHA256='efb7f304a98820b0da7450b4acfe88d52f10e5bf82b1bde0564121dab5391609'
NATIVE_RELATIVE='research-ide/mathscope-m3/recovery-20261019/native/slow_inverse_native.py'
NATIVE_CAPSULE_RELATIVE='research-ide/mathscope-m3/recovery-20261019/native/evidence/SOURCE_CAPSULE.json'

def validate_capsule(value):
    if type(value) is not dict:raise ValueError('AUTHENTICATED_CALLER_CAPSULE_REQUIRED')
    payload={k:v for k,v in value.items() if k!='payload_sha256'}
    encoded=json.dumps(payload,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
    if hashlib.sha256(encoded).hexdigest()!=CAPSULE_SHA256 or value.get('payload_sha256')!=CAPSULE_SHA256:
        raise ValueError('FULL_ORIGINAL_CALLER_CAPSULE_MISMATCH')
    return value

def load_native(repo):
    path=Path(repo)/NATIVE_RELATIVE
    payload=path.read_bytes()
    if hashlib.sha256(payload).hexdigest()!=NATIVE_SHA256:
        raise ValueError('FROZEN_NATIVE_IMPLEMENTATION_CHANGED')
    # Execute exactly the bytes just checked, avoiding a second file read.
    name='_mathscope_frozen_native_'+NATIVE_SHA256
    if name not in sys.modules:
        module=types.ModuleType(name);module.__file__=str(path)
        sys.modules[name]=module
        exec(compile(payload,str(path),'exec'),module.__dict__)
    return sys.modules[name]

def center_offset(s):
    """floor(1/2-log2(s)) with integer ell canceled exactly.

    Closed tie conventions match -ceil(-(1/2-log2(s))). A rational
    interval crossing an irrational threshold returns OPEN, never rounding.
    """
    if s.lo<Q(1,2) or s.hi>2:raise ValueError('ORIGINAL_SLOW_BRACKET_REQUIRED')
    if s.hi*s.hi<=Q(1,2):return 1
    if s.lo*s.lo>Q(1,2) and s.hi*s.hi<=2:return 0
    if s.lo*s.lo>2:return -1
    return None

def band_guard(scaled_s):
    """Original strict support |log2(scaled_s)|<3/4, closed flat zero."""
    if scaled_s.lo<=0:raise ValueError('POSITIVE_SCALED_S_REQUIRED')
    lower,upper=scaled_s.lo**4,scaled_s.hi**4
    if upper<=Q(1,8) or lower>=8:return 'EXACT_ZERO_BY_ORIGINAL_BAND_GUARD'
    if lower>Q(1,8) and upper<8:return 'ORIGINAL_BAND_GUARD_ACTIVE'
    return 'BAND_GUARD_BOUNDARY_OPEN'

def sqrt_bound(value,bits,interval_type):
    """Exact outward dyadic square-root enclosure; no floating arithmetic."""
    if value<0:raise ValueError('NONNEGATIVE_RADICAND_REQUIRED')
    scale=1<<bits
    integer=isqrt((value.numerator*scale*scale)//value.denominator)
    lower=Q(integer,scale)
    upper=lower if lower*lower==value else Q(integer+1,scale)
    if not lower*lower<=value<=upper*upper:raise AssertionError('SQRT_ENCLOSURE')
    return interval_type(lower,upper)

class ActualBandCaller:
    def __init__(self,repo=REPO,source_capsule=None):
        self.repo=Path(repo)
        self.source=json.loads((HERE/'evidence/CALLER_SOURCE_CAPSULE.json').read_text()) if source_capsule is None else source_capsule
        validate_capsule(self.source)
        self.native=load_native(self.repo)
        self.native_source=self.native.load_capsule(self.repo/NATIVE_CAPSULE_RELATIVE)

    def _candidate(self,s,z,t,offset,displacement,bits):
        if type(offset) is not int or offset!=center_offset(s):
            raise ValueError('ORIGINAL_CENTER_OFFSET_MISMATCH')
        if type(displacement) is not int or displacement not in (-1,0,1):
            raise ValueError('ORIGINAL_THREE_BAND_DISPLACEMENTS_REQUIRED')
        delta=offset+displacement
        ratio=Q(2**delta) if delta>=0 else Q(1,2**(-delta))
        I=self.native.Interval
        radial_multiplier=sqrt_bound(ratio,bits,I)
        h_upper,h_proof=self.native.source_h_bound(bits)
        epsilon=abs(delta)*h_upper
        if delta>0: exponential=I(1-epsilon,1)
        elif delta<0: exponential=I(1,1/(1-epsilon))
        else:exponential=I.point(1)
        axial_multiplier=radial_multiplier*exponential
        scaled_s=ratio*s
        status=band_guard(scaled_s)
        return {
            'candidate_displacement':displacement,'label_minus_reference_ell':delta,
            'label_expression':f'ell+({delta})','reference_ell_value':None,
            'Q_reference_over_Q_label':str(ratio),
            'transported_s_enclosure':scaled_s.data(),
            'band_guard':status,'fourth_power_enclosure':[str(scaled_s.lo**4),str(scaled_s.hi**4)],
            'fixed_label_derivative_multipliers':{'dR':radial_multiplier.data(),'dZ':axial_multiplier.data(),'dT':[str(ratio),str(ratio)]},
            'local_Z_argument_enclosure':(axial_multiplier*z).data(),
            'local_T_argument_enclosure':(ratio*t).data(),
            'root_relation':'F(r*s; r^(1/2-h)*Z,r*T)=r*F(s;Z,T), since2*(1/2-h)+2*h=1',
            'local_root_bracket_certified_from_active_guard':True if status=='ORIGINAL_BAND_GUARD_ACTIVE' else None,
            'local_root_domain_reason':'Active guard gives2^(-3/4)<r*s<2^(3/4), inside(1/2,2); original eta is preserved by exact transport.',
            'representative_evaluated':False,'radial_guard_classified':False,
            'source_h':h_proof,
            'error_budget':{'rational_operations_rounding':'0','sqrt_width':str(radial_multiplier.width),
                           'exp_correction_argument_bound':str(epsilon),
                           'exponential_enclosure':exponential.data(),
                           'h_replaced_by_zero':False},
        }

    def evaluate(self,z,t,bits=96):
        validate_capsule(self.source)
        # Bounded resource scope for this small caller unit, not an original
        # mathematical threshold or N8 arithmetic-precision completion gate.
        if type(bits) is not int or not 16<=bits<=512:
            raise ValueError('CALLER_UNIT_RESOLUTION_16_THROUGH_512')
        native=self.native.evaluate(self.native_source,622820,z,t,bits)
        s=self.native.Interval(*native['value'])
        offset=center_offset(s)
        candidates=None if offset is None else [self._candidate(s,z,t,offset,j,bits) for j in (-1,0,1)]
        return {
            'schema':'MathScope.ActualBandCallerTransportEnclosure/1',
            'status':'BAND_LABEL_BOUNDARY_OPEN' if offset is None else 'FORMAL_ORIGINAL_CHART_TRANSPORT_ENCLOSED',
            'source_capsule_sha256':CAPSULE_SHA256,'frozen_native_sha256':NATIVE_SHA256,
            'reference_slow_call':622820,'original_argument_nodes':[622803,622804],
            'input_box':native['input_box'],'source_h':native['h'],'resolution_bits':bits,
            'reference_root_enclosure':s.data(),'native_definition_sha256':native['definition_sha256'],
            'center_label_minus_reference_ell':offset,'center_source_node':632179,
            'candidates':candidates,
            'source_domain_hypothesis':'Original reference ell is an integer; z/t boxes lie in the Z,T part of the original slow image proved by the native residual bracket. External global-point and ell-window provenance remains unestablished.',
            'original_B0':'7/10','original_C0_star':'6/5',
            'actual_external_global_point_bound':False,'reference_ell_value':None,
            'ell_ge_ell0_verified':False,'fixed_mesh_ceilings_evaluated':False,
            'fixed_representative_call623935_evaluated':False,
            'original_radial_endpoint_integrals_evaluated':False,
            'whole_K_field_evaluated':False,'N7_06_closed':False,'N8_05_closed':False,
            'new_M3_closures':0,'actual_global_last_resolved_tau':None,
        }
