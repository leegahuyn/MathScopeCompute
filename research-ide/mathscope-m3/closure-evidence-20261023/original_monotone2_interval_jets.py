"""Rational enclosures of the original slow inverse and its Taylor jets.

F(s,Z,T)=s-Z^2*s^(2h)-T, 0<h<2^-4096, 1/2<=s<=2.
The caller supplies a closed Z,T box. Endpoint inequalities are proved here;
the caller's physical support and native argument substitution are not.
No floating point, chosen h, or unproved root oracle is used.
"""
from fractions import Fraction as Q
from math import factorial
from rigorous_rational_intervals import Interval as I, UncertifiedExpression
from certify_original_two_root2_image_endpoints import certify_independent_W_T_box, H

GRAPH_SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REGISTRY_SHA='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'


def authenticate_source(folder):
    """Check original bytes and the entire implicit equation, not just a name."""
    import gzip,hashlib,json
    from pathlib import Path
    folder=Path(folder)
    raw=(folder/'original-source-functions.json').read_bytes()
    if hashlib.sha256(raw).hexdigest()!=REGISTRY_SHA:
        raise UncertifiedExpression('Original native registry SHA mismatch')
    system=json.loads(json.loads(raw)['base']['base']['monotone'])[2]
    required={'name':'ActualCommonBandSlowInverse','variable':622810,
              'parameters':[622803,622804],'body':622819,'left':19,'right':24,
              'derivativeLower':19,'derivativeUpper':1,'numericOracle':False}
    if any(system.get(k)!=v for k,v in required.items()):
        raise UncertifiedExpression('Original system-2 definition mismatch')
    pins={0:('rational',['0','1']),1:('rational',['1','1']),
          9:('source_parameter',['h']),19:('rational',['1','2']),
          20:('rational',['-1','1']),24:('rational',['2','1']),
          25:('multiply',[9,24]),
          622803:('coordinate',['m3_global_band_slow_Z$30436']),
          622804:('coordinate',['m3_global_band_slow_T$30437']),
          622810:('coordinate',['m3_global_band_implicit_s$30443']),
          622811:('integer_power',[622803,2]),622812:('log_positive',[622810]),
          622813:('multiply',[25,622812]),622814:('exp',[622813]),
          622815:('multiply',[622811,622814]),622816:('multiply',[20,622815]),
          622817:('add',[622810,622816]),622818:('multiply',[20,622804]),
          622819:('add',[622817,622818]),
          622820:('actual_monotone_root',[2,622803,622804]),
          623935:('actual_monotone_root',[2,623921,623934])}
    digest=hashlib.sha256();seen=set();count=0
    with gzip.open(folder/'original-source-nodes.jsonl.gz','rb') as stream:
        for j,line in enumerate(stream):
            digest.update(line)
            if j==0:
                if json.loads(line)!={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257}:
                    raise UncertifiedExpression('Original graph header mismatch')
                continue
            count+=1;i=j-1
            if i in pins:
                op,args=pins[i]
                if json.loads(line)!={'op':op,'args':args}:
                    raise UncertifiedExpression('Original source formula node mismatch: '+str(i))
                seen.add(i)
    if count!=4420257 or digest.hexdigest()!=GRAPH_SHA or seen!=set(pins):
        raise UncertifiedExpression('Original graph SHA, node count or formula mismatch')
    return {'graph_sha256':GRAPH_SHA,'native_registry_sha256':REGISTRY_SHA,
            'source_nodes':count,'equation_and_call_pin_count':len(pins),
            'native_call_ids':[622820,623935],
            'actual_runtime_arguments_or_support_bound':False,
            'h_bound_is_inherited_N3_premise_not_reproved_here':True}


def point(q):
    q=Q(q)
    return I(q,q)


def round_out(x,bits):
    scale=1<<bits
    lo=(x.lo.numerator*scale)//x.lo.denominator
    hi=-((-x.hi.numerator*scale)//x.hi.denominator)
    return I(Q(lo,scale),Q(hi,scale))


def inverse_jets(z,t,order=3,bits=128):
    """Each entry encloses a Taylor coefficient, derivative/(a! b!).

    On the source bracket, 1-2H<=s^(2h)<=1/(1-2H), since |log s|<1.
    Thus s=T+Z^2*s^(2h) is enclosed without selecting h. Higher coefficients
    follow by formal implicit series. At each homogeneous degree the only
    unknown coefficient occurs linearly, with factor
    J=1-Z^2*(2h)*s^(2h)/s. Interval division is allowed only for J>1/2.
    The finite polynomial expansion of (1+u)^(2h) is an exact identity for
    each requested jet; its omitted terms have strictly higher degree.
    """
    if not isinstance(z,I) or not isinstance(t,I):
        raise UncertifiedExpression('Exact rational Z,T intervals required')
    if any(type(q)is not Q for q in (z.lo,z.hi,t.lo,t.hi)):
        raise UncertifiedExpression('Floating point endpoints forbidden')
    if type(order)is not int or not 0<=order<=4:
        raise UncertifiedExpression('Supported total native jet order is 0..4')
    if type(bits)is not int or not 32<=bits<=8192:
        raise UncertifiedExpression('Dyadic arithmetic precision must be 32..8192 bits')
    w=z.power(2)
    certify_independent_W_T_box(w.lo,w.hi,t.lo,t.hi)
    power=I(1-2*H,1/(1-2*H))
    raw=t+w*power
    s=I(max(Q(1,2),raw.lo),min(Q(2),raw.hi))
    # Both identities hold for every admissible h, not merely at h=0.
    if w.lo==w.hi==0:
        s=t
    elif w.lo==w.hi and t.lo==t.hi and w.lo+t.lo==1:
        s=point(1)
        power=point(1)
    s=round_out(s,bits)
    exponent=I(Q(0),2*H)
    jac=round_out(point(1)-w*power*exponent/s,bits)
    if jac.lo<=Q(1,2):
        raise UncertifiedExpression('Implicit Jacobian lower bound is not proved')
    indices=[(a,n-a) for n in range(order+1) for a in range(n+1)]
    zero=point(0)
    def add(a,b):return round_out(a+b,bits)
    def mul(a,b):return round_out(a*b,bits)
    def product(a,b):
        out={}
        for (i,j),v in a.items():
            for (k,l),u in b.items():
                if i+j+k+l<=order:
                    key=(i+k,j+l)
                    out[key]=add(out.get(key,zero),mul(v,u))
        return out
    zj={(0,0):z,(1,0):point(1)}
    tj={(0,0):t,(0,1):point(1)}
    wj=product(zj,zj)
    sj={(0,0):s}
    for n in range(1,order+1):
        u={key:round_out(v/s,bits) for key,v in sj.items() if key!=(0,0)}
        up={(0,0):point(1)}
        expansion={(0,0):point(1)}
        binomial=point(1)
        for k in range(1,n+1):
            up=product(up,u)
            binomial=mul(binomial,round_out((exponent-point(k-1))/point(k),bits))
            for key,v in up.items():
                expansion[key]=add(expansion.get(key,zero),mul(binomial,v))
        pj={key:mul(power,v) for key,v in expansion.items()}
        rhs=product(wj,pj)
        # Do not update sj until all same-degree coefficients are computed.
        pending={}
        for a in range(n+1):
            key=(a,n-a)
            pending[key]=round_out(add(rhs.get(key,zero),tj.get(key,zero))/jac,bits)
        sj.update(pending)
    return {
        'schema':'MathScope.M3.OriginalMonotone2IntervalTaylorJets/1',
        'input_Z':z.json(),'input_T':t.json(),'h_contract':'0<h<2^-4096',
        'total_order':order,'arithmetic_bits':bits,
        'root':s.json(),'implicit_J':jac.json(),
        'inverse_two_s':round_out((point(2)*s).reciprocal(),bits).json(),
        'taylor_coefficients':{f'{a},{b}':sj[(a,b)].json() for a,b in indices},
        'derivatives':{f'{a},{b}':round_out(sj[(a,b)]*point(factorial(a)*factorial(b)),bits).json()
                       for a,b in indices},
        'scope':'CONDITIONAL_NATIVE_INPUT_BOX_ONLY',
        'actual_physical_call_support_verified':False,
        'final_A_D_field_certified':False,'final_67_jets_certified':0,
        'natural_Y_certified':33,'natural_Y_OPEN':490,'release':'HOLD',
    }


if __name__=='__main__':
    import argparse,hashlib,json
    from pathlib import Path
    parser=argparse.ArgumentParser()
    parser.add_argument('--graph-dir',required=True)
    parser.add_argument('--boxes',required=True,help='Conditional test boxes, not runtime support certificates')
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    auth=authenticate_source(args.graph_dir)
    inputs=json.loads(Path(args.boxes).read_text(encoding='utf-8'))
    if not isinstance(inputs,list) or not 1<=len(inputs)<=64:
        raise UncertifiedExpression('One through 64 explicitly labeled conditional input boxes required')
    results=[]
    for box in inputs:
        if set(box)!={'label','Z','T','order','bits'} or not isinstance(box['label'],str):
            raise UncertifiedExpression('Require label, Z, T, order, bits')
        results.append({'label':box['label'],**inverse_jets(I.parse(box['Z']),I.parse(box['T']),box['order'],box['bits'])})
    code=Path(__file__).read_bytes()
    payload={'schema':'MathScope.M3.SourcePinnedConditionalNativeJetRun/1',
             'source':auth,'implementation_sha256':hashlib.sha256(code).hexdigest(),
             'inputs':inputs,'results':results,
             'scope':'CONDITIONAL_NATIVE_KERNEL_VALIDATION_NOT_FINAL_PHYSICAL_FIELD',
             'M3':'62/64','M4':'0/16','final_67_jets':'0/67','release':'HOLD'}
    canonical=json.dumps(payload,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()
    payload['run_hash_sha256']=hashlib.sha256(canonical).hexdigest()
    Path(args.output).write_text(json.dumps(payload,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'run_hash_sha256':payload['run_hash_sha256'],'conditional_boxes':len(results),'release':'HOLD'}))
