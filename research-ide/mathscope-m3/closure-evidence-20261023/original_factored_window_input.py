"""Source-window algebra and native input with unexpanded original scales.

The original minimum level exceeds 2^8204. Expanding Q=2^-ell into an
ordinary rational is infeasible. Retain Q and its h-dependent powers EXACTLY;
in particular Q^h cannot be replaced by 1 just because h is very small.

The window theorem assumes the finite-real semantics of the original norm
and selector expressions. This file does not prove that missing analytic
premise, the representative support, or any final A-D physical field.
"""
import argparse,gzip,hashlib,json
from fractions import Fraction as F
from pathlib import Path
from original_monotone2_interval_jets import authenticate_source,inverse_jets,point,GRAPH_SHA
from pinned_n3_parameter_intervals import pinned_profile,EXPECTED_DECODED_EXPRESSIONS_SHA256
from rigorous_rational_intervals import UncertifiedExpression

PINS={
    9:('source_parameter',['h']),20:('rational',['-1','1']),24:('rational',['2','1']),
    127:('log_positive',[24]),474:('rational',['4','1']),591:('rational',['16','1']),
    669:('rational',['10','1']),4654:('rational',['8','1']),
    28815:('rational',['64','1']),117105:('rational',['6','1']),
    136158:('inverse',[9]),617356:('multiply',[28815,136158]),
    617357:('integer_power',[617356,2]),
    617431:('maximum',[4654,617430,617357]),617432:('ceiling',[617431]),
    617433:('add',[117105,617432]),617434:('add',[474,617432]),
    617435:('multiply',[127,617434]),617436:('multiply',[20,617435]),
    617437:('exp',[617436]),617463:('add',[669,617432]),
    617464:('multiply',[127,617463]),
    617465:('maximum',[137420,127,617464,617441,617444,617447,617450,617453,617456,617459,617462]),
    617466:('exp',[617465]),617512:('log_positive',[591]),
    617513:('add',[617465,617512]),
    617514:('maximum',[163613,617513,0,617469,617472,617475,617478,617481,617484,617487,617490,617493,617496,617499,617502,617505,617508,617511]),
    617515:('exp',[617514]),617517:('inverse',[127]),
    622781:('multiply',[617465,617517]),622782:('multiply',[20,622781]),
    622783:('ceiling',[622782]),622784:('multiply',[20,622783]),
    622785:('maximum',[617433,622784]),622786:('multiply',[617514,617517]),
    622787:('multiply',[20,622786]),622788:('ceiling',[622787]),
    622789:('multiply',[20,622788]),622790:('add',[20,622789]),
    622791:('coordinate',['N6_global_frozen_integer_band_N1$30434']),
    622792:('multiply',[127,622791]),622793:('multiply',[20,622792]),
    622794:('exp',[622793]),
    622831:('coordinate',['common_band_time_cutoff_argument$30444']),
    622845:('smooth_piecewise',[622831,19,1,1,622844,0]),
}


def verify_pin(node,item):
    op,args=PINS[node]
    if item!={'op':op,'args':args}:
        raise UncertifiedExpression('Original window formula changed at '+str(node))


def authenticate_window(folder):
    pinned_profile() # Entire decoded N3 dictionary, not only its stored seal.
    native=authenticate_source(folder)
    raw=(Path(folder)/'original-source-functions.json').read_bytes()
    from original_monotone2_interval_jets import REGISTRY_SHA
    if hashlib.sha256(raw).hexdigest()!=REGISTRY_SHA:
        raise UncertifiedExpression('Original native registry changed')
    cutoff=json.loads(json.loads(raw)['base']['base']['expression'])[680]
    if any(cutoff.get(k)!=v for k,v in {'name':'CommonOriginalTimeCutoff','parameters':[622831],'body':622845}.items()):
        raise UncertifiedExpression('Original coefficient cutoff definition changed')
    seen=set();sha=hashlib.sha256();count=0
    with gzip.open(Path(folder)/'original-source-nodes.jsonl.gz','rb') as stream:
        for j,line in enumerate(stream):
            sha.update(line)
            if j==0:
                if json.loads(line)!={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257}:
                    raise UncertifiedExpression('Original graph header changed')
                continue
            count+=1;i=j-1
            if i in PINS:verify_pin(i,json.loads(line));seen.add(i)
    if count!=4420257 or sha.hexdigest()!=GRAPH_SHA or seen!=set(PINS):
        raise UncertifiedExpression('Original window source SHA/count/pins changed')
    return {'native_equation':native,'window_formula_pin_count':len(PINS),
            'original_cutoff_expression_system':680,'cutoff_constant_zero_after_argument_one':True,
            'decoded_N3_expressions_sha256':EXPECTED_DECODED_EXPRESSIONS_SHA256,
            'source_norm_and_selector_expressions_proved_finite_real':False}


def integer_window_bridge(ell_min,m,n):
    """Integer conclusion only; m,n floor inequalities must be proved upstream."""
    if any(type(x)is not int for x in (ell_min,m,n)):
        raise UncertifiedExpression('Exact integer levels required')
    if m<ell_min+10 or n<m+4:
        raise UncertifiedExpression('Source small-band or factor-16 floor premise missing')
    lo=max(ell_min+6,m);hi=n-1
    return {'lower':lo,'upper':hi,'four_witness_levels':[m+j for j in range(4)]}


def pullback_power(a,b):
    if type(a)is not int or type(b)is not int or a<0 or b<0 or a+b>4:
        raise UncertifiedExpression('Total q jet order must be 0..4')
    return {'base':'Q','rational_exponent':str(F(1)-F(a,2)-b),
            'h_exponent_coefficient':a,'exact_exponent':'rational_exponent + h_exponent_coefficient*h'}


def factored_native_inputs(order=4,bits=4096):
    """No serialized certificate or chosen replacement scale is accepted.

    Four original window labels are expressions m+j, m=#622784. At Z=0,T=1
    the native s is exactly 1 for the ORIGINAL h, and physical tau=q=Q.
    This is an input/equation calculation, not an evaluation of final u,p.
    """
    pinned_profile()
    native=inverse_jets(point(0),point(1),order,bits)
    physical={}
    for key,value in native['derivatives'].items():
        a,b=map(int,key.split(','))
        physical[key]={'native_coefficient_interval':value,'positive_exact_scale':pullback_power(a,b),
                       'time_t_sign':(-1)**b}
    return {
        'schema':'MathScope.M3.OriginalFactoredWindowNativeInput/1',
        'window_source':{'ellMinimum':617432,'ell0':617433,'log_b1':617465,'log_b2':617514,
                         'm_floor_log2_b1':622784,'n_floor_log2_b2':622789,
                         'window_lower':622785,'window_upper':622790,'Q':622794},
        'floor_derivation':{
            'small_band':'log_b1 >= (ellMinimum+10)*log(2); floor(log_b1/log(2)) >= ellMinimum+10',
            'growth':'log_b2 >= log_b1+log(16) = log_b1+4*log(2); n >= m+4',
            'four_labels':'ell=m+j, j=0,1,2,3, lie in [max(ellMinimum+6,m),n-1]',
            'qStar_margin':'for s=1, q/qStar <= 2^(-6-j)',
            'first_omitted_cutoff':'b2*q >= 2^(4-j) >= 2; original chi(b2*q) and all its derivatives are zero',
            'all_later_cutoffs':'same conclusion requires the original all-order monotone selector recursion'},
        'finite_real_source_scale_premise_discharged':False,
        'source_window_algebra_proved_under_finite_real_source_scales':True,
        'whole_real_log_floor_derivation_formalized_in_Lean':False,
        'factored_labels':[{'ell':{'source_node':622784,'integer_offset':j},
                            'Q':'exp(-ell*log(2))','tau':'Q','z':'0','q':'Q',
                            'native_Z':'0','native_T':'1','native_s':'1',
                            'source_band_offset':'0','first_omitted_b2_q_lower':str(2**(4-j))}
                           for j in range(4)],
        'native_jets':native,'physical_q_jets_z_tau_with_t_sign':physical,
        'scale_exclusion':{'source_h_upper':'2^-4096','frequencyMinimum':'(64/h)^2',
                           'ellMinimum_strict_lower':'2^8204',
                           'earlier_absolute_core_normalizer_max_level':32768,
                           'earlier_absolute_core_normalizer_levels_excluded_from_source_window':True,
                           'finite_real_source_scale_premise_required':True},
        'h_dependent_Q_powers_retained':True,'Q_h_replaced_by_one':False,
        'physical_r_and_original_mesh_labels_evaluated':False,
        'representative_623935_image_proved':False,
        'actual_final_field_values_computed':False,'final_67_jets':0,
        'natural_Y_certified':33,'natural_Y_OPEN':490,'M3':'62/64','M4':'0/16','release':'HOLD'}


def main():
    p=argparse.ArgumentParser();p.add_argument('--graph-dir',required=True);p.add_argument('--output',required=True)
    args=p.parse_args();source=authenticate_window(args.graph_dir)
    result=factored_native_inputs()
    payload={'schema':'MathScope.M3.SourcePinnedFactoredWindowInputRun/1','source':source,'result':result,
             'implementation_sha256':{name:hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()
                for name in ('original_factored_window_input.py','original_monotone2_interval_jets.py',
                             'pinned_n3_parameter_intervals.py','rigorous_rational_intervals.py',
                             'certify_original_two_root2_image_endpoints.py')}}
    canonical=json.dumps(payload,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()
    payload['run_hash_sha256']=hashlib.sha256(canonical).hexdigest()
    Path(args.output).write_text(json.dumps(payload,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'run_hash_sha256':payload['run_hash_sha256'],'factored_labels':4,
                      'finite_source_scales_proved':False,'final_jets':0,'release':'HOLD'}))


if __name__=='__main__':main()
