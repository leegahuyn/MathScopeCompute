"""Compute source-h enclosures from time remaining tau=1-t and axial z.

This factory constructs points in the ORIGINAL inverse image. It does not
postulate independent Z,T boxes or evaluate a final velocity field. The
source construction's active coefficient window, radial shell, mesh labels
and representative inverse #623935 still need separate certification.

For D=1/2-h, q>0 is uniquely defined by
  z^2*q^(-2D) + tau/q = 1.
The left side strictly decreases from infinity to zero for tau>0. This is
the existence proof: q-z^2*q^(2h)-tau need not increase near q=0.
On tau+z^2<=1, q<=1 and q>=tau. A dyadic Q then rescales the root to the
source bracket: s=q/Q, Z=z/Q^D, T=tau/Q. No h value is selected or set to 0.
"""
from fractions import Fraction as F
from math import isqrt
from pathlib import Path
import argparse,hashlib,json
from rigorous_rational_intervals import Interval as I,UncertifiedExpression
from pinned_n3_parameter_intervals import (pinned_profile,exact_pinned_parameter_interval,
    EXPECTED_DECODED_EXPRESSIONS_SHA256)
from original_monotone2_interval_jets import (H,point,_validate_options,
    _jets_from_proved_image,authenticate_source)

MAX_INPUT_BITS=32768


def _integer_text(n):
    """Bounded arithmetic can still exceed Python's decimal-string limit.

    Convert in small chunks, without changing process-wide safety settings.
    JSON stores these as strings, never approximate floating point numbers.
    """
    if n<0:return '-'+_integer_text(-n)
    chunks=[];base=10**1000
    while n>=base:
        n,r=divmod(n,base);chunks.append(r)
    return str(n)+''.join(str(r).zfill(1000) for r in reversed(chunks))


def _fraction_text(q):
    return _integer_text(q.numerator)+('' if q.denominator==1 else '/'+_integer_text(q.denominator))


def _interval_json(value):
    return [_fraction_text(value.lo),_fraction_text(value.hi)]


def _dyadic(exponent):
    return F(1<<exponent) if exponent>=0 else F(1,1<<(-exponent))


def _floor_log2(value):
    if type(value)is not F or value<=0:
        raise UncertifiedExpression('Positive exact rational required')
    k=value.numerator.bit_length()-value.denominator.bit_length()
    if _dyadic(k)>value:k-=1
    return k


def _source_contract():
    profile=pinned_profile() # Recomputes the complete N3 expression digest.
    bound=exact_pinned_parameter_interval('h',profile)
    if bound.lo!=0 or bound.hi!=H:
        raise UncertifiedExpression('Original nonzero h magnitude contract changed')
    return {'decoded_N3_expressions_sha256':EXPECTED_DECODED_EXPRESSIONS_SHA256,
            'h':'exp(-8002*(exp(1048576)+10))','h_strictly_positive':True,
            'h_upper_bound':'2^-4096','D':'1/2-h',
            'source_D_formula_node':22,'native_system':2,'direct_call':622820,
            'D_formula_requires_original_graph_authentication':True}


def physical_core_chart(tau,z,bits=128):
    """Enclose each correlated image point from the entire tau,z box.

    Reject boxes too wide for this one dyadic chart; subdivision must retain
    all rejected cells. Individual points satisfying tau>0,tau+z^2<=1 always
    fit. The returned Z,T intervals alone are NOT a certificate for their
    Cartesian product. This is not a serialized certificate trust interface.
    """
    _validate_options(z,tau,0,bits)
    for x in (tau.lo,tau.hi,z.lo,z.hi):
        if max(abs(x.numerator).bit_length(),x.denominator.bit_length())>MAX_INPUT_BITS:
            raise UncertifiedExpression('Physical input exceeds exact rational bit budget')
    if tau.lo<=0:
        raise UncertifiedExpression('Strictly positive time remaining tau=1-t required; tau=0 is not covered')
    w=z.power(2)
    qhi=tau.hi+w.hi
    if qhi>1:
        raise UncertifiedExpression('This core chart requires tau_upper+max(z^2)<=1')
    # tau>=2^-B; log(q)>=log(tau)>=-B*log(2)>-B.
    B=max(1,-_floor_log2(tau.lo))
    epsilon=2*H*B
    if epsilon>=F(1,2):
        raise UncertifiedExpression('Logarithmic magnitude bound insufficient')
    qlo=tau.lo+w.lo*(1-epsilon)
    exponent=_floor_log2(qhi)
    # Choose one active source band, rather than merely the wider root
    # bracket. The rational split at 3/2 leaves room on both sides of
    # |log2(s)|<3/4. Its exact fourth-power inequalities are checked below.
    if qhi/_dyadic(exponent)>F(3,2):exponent+=1
    ell=-exponent
    Q=_dyadic(exponent)
    s=I(qlo/Q,qhi/Q)
    if s.lo<F(1,2) or s.hi>2:
        raise UncertifiedExpression('Physical box spans multiple native charts; subdivide without dropping cells')
    if s.lo**4<=F(1,8) or s.hi**4>=8:
        raise UncertifiedExpression('Physical box spans source band supports; subdivide without dropping cells')
    # Relative sqrt rounding keeps a tiny Q positive even at low precision.
    if ell%2:
        scale=1<<bits
        numerator=isqrt(2*scale*scale)
        sqrtQ=I(F(numerator,scale),F(numerator+1,scale))*point(_dyadic(-(ell+1)//2))
    else:
        sqrtQ=point(_dyadic(-ell//2))
    # Q^D=sqrt(Q)*exp(h*ell*log(2)); e^x<=1/(1-x), 0<=x<1.
    if H*ell>=1:
        raise UncertifiedExpression('Dyadic similarity exponent exceeds source magnitude proof')
    QD=sqrtQ*I(F(1),F(1)/(1-H*ell))
    Z=z/QD
    T=tau/point(Q)
    # eta^2=z^2*q^(2h)/q=1-tau/q <1; also q<=qhi.
    eta2=I(F(0),max(F(0),1-tau.lo/qhi))
    jac=I(1-2*H*eta2.hi,F(1))
    return {'tau':tau,'z':z,'q':I(qlo,qhi),'Q':Q,'ell':ell,
            'Q_power_D':QD,'Z':Z,'T':T,'s':s,'eta_squared':eta2,
            'native_J':jac,'log_magnitude_bound_B':B,
            'source':_source_contract()}


def physical_core_jets(tau,z,order=3,bits=128):
    """Native Z,T partials and their fixed-Q pullback to physical z,tau.

    Q is held fixed on each certified chart when differentiating. Although
    the factory can choose another Q in the next chart, q and its derivatives
    agree there by uniqueness. No derivative of a dyadic selector is taken.
    For original time t=1-tau, a b-th time derivative gains (-1)^b.
    """
    _validate_options(z,tau,order,bits)
    c=physical_core_chart(tau,z,bits)
    power=I(1-2*H,F(1)/(1-2*H))
    r=_jets_from_proved_image(c['Z'],c['T'],c['s'],power,c['native_J'],order,bits)
    pulled={}
    original_time={}
    for key,pair in r['derivatives'].items():
        a,b=map(int,key.split(','))
        scaling=point(c['Q'])/(c['Q_power_D'].power(a)*point(c['Q']).power(b))
        value=I.parse(pair)*scaling
        pulled[key]=_interval_json(value)
        original_time[key]=_interval_json(value*point((-1)**b))
    chart={k:(_interval_json(v) if isinstance(v,I) else _fraction_text(v) if type(v)is F else v)
           for k,v in c.items()}
    r.update(schema='MathScope.M3.PhysicalCoreOriginalNativeJets/1',
             physical_chart=chart,scope='SOURCE_H_CORRELATED_PHYSICAL_CORE_IMAGE',
             native_input_image_proved=True,
             independent_Z_T_cartesian_product_certified=False,
             derivatives_are='native partial Z,T derivatives, not physical tau,z derivatives',
             physical_q_derivatives_z_tau=pulled,
             physical_q_derivatives_z_t=original_time,
             physical_time_convention='tau=1-t; Q fixed during local differentiation',
             original_active_band_window_membership_proved=False,
             source_band_offset_strict_support_proved=True,
             source_band_offset_support='abs(log2(q/Q))<3/4; verified by 1/8<(q/Q)^4<8',
             original_mesh_and_representative_support_proved=False,
             final_field_samples_generated=False)
    return r


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--graph-dir',required=True)
    parser.add_argument('--physical-boxes',required=True)
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    auth=authenticate_source(args.graph_dir)
    inputs=json.loads(Path(args.physical_boxes).read_text(encoding='utf-8'))
    if not isinstance(inputs,list) or not 1<=len(inputs)<=64:
        raise UncertifiedExpression('One through 64 physical boxes required')
    results=[]
    for b in inputs:
        if set(b)!={'label','tau','z','order','bits'} or not isinstance(b['label'],str):
            raise UncertifiedExpression('Require label,tau,z,order,bits')
        results.append({'label':b['label'],**physical_core_jets(I.parse(b['tau']),I.parse(b['z']),b['order'],b['bits'])})
    modules=['original_physical_slow_chart.py','original_monotone2_interval_jets.py',
             'rigorous_rational_intervals.py','pinned_n3_parameter_intervals.py',
             'certify_original_two_root2_image_endpoints.py']
    implementation={p:hashlib.sha256(Path(__file__).with_name(p).read_bytes()).hexdigest() for p in modules}
    payload={'schema':'MathScope.M3.SourcePinnedPhysicalCoreNativeRun/1',
             'source_authentication':auth,'implementation_sha256':implementation,
             'inputs':inputs,'results':results,'M3':'62/64','M4':'0/16',
             'final_67_jets':'0/67','release':'HOLD'}
    canonical=json.dumps(payload,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()
    payload['run_hash_sha256']=hashlib.sha256(canonical).hexdigest()
    Path(args.output).write_text(json.dumps(payload,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'physical_core_boxes':len(results),'run_hash_sha256':payload['run_hash_sha256'],'release':'HOLD'}))


if __name__=='__main__':main()
