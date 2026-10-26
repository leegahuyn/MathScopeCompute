"""Actual first nonlinear natural coefficient: global tube and finite jets.

Phi_1=(-chi+Lambda^-1*(-3+h-j0*eta)/L)/4, not a Bessel comparator.
Only radial coefficient n=1 is certified here. This does not prove the full
Phi,u fixed point, its B_rho norm/tail, source arguments, or final A-D jets.
"""
import argparse,gzip,hashlib,json
from fractions import Fraction as F
from math import factorial
from pathlib import Path
from rigorous_rational_intervals import Interval as I,UncertifiedExpression
from original_monotone2_interval_jets import GRAPH_SHA,REGISTRY_SHA,H,point,round_out
from pinned_n3_parameter_intervals import pinned_profile,EXPECTED_DECODED_EXPRESSIONS_SHA256

PRODUCERS={
 'actual-continuation-exact-core.mjs':'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
 'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
}


def require(ok,message):
    if not ok:raise UncertifiedExpression('PHI1_UNPROVED: '+message)


def _padd(a,b):
    out=dict(a)
    for k,v in b.items():out[k]=out.get(k,F(0))+v
    return {k:v for k,v in out.items() if v}


def _pmul(a,b):
    out={}
    for i,u in a.items():
        for j,v in b.items():
            k=tuple(x+y for x,y in zip(i,j));out[k]=out.get(k,F(0))+u*v
    return {k:v for k,v in out.items() if v}


def source_polynomial(nodes,root,cache=None):
    """Independent exact polynomial normal form in eta,h,j0."""
    if cache is None:cache={}
    if root in cache:return cache[root]
    n=nodes[root];op=n['op'];a=n['args'];one={(0,0,0):F(1)}
    if op=='rational':out={(0,0,0):F(int(a[0]),int(a[1]))}
    elif op=='coordinate' and root==2 and a==['eta']:out={(1,0,0):F(1)}
    elif op=='source_parameter' and a==['h']:out={(0,1,0):F(1)}
    elif op=='source_parameter' and a==['j0']:out={(0,0,1):F(1)}
    elif op in ('add','multiply'):
        require(len(a)==2,'polynomial arity')
        u=source_polynomial(nodes,a[0],cache);v=source_polynomial(nodes,a[1],cache)
        out=_padd(u,v) if op=='add' else _pmul(u,v)
    elif op=='integer_power' and type(a[1])is int and 0<=a[1]<=8:
        out=one
        for _ in range(a[1]):out=_pmul(out,source_polynomial(nodes,a[0],cache))
    else:raise UncertifiedExpression('Unsupported Phi1 polynomial source node '+str(root))
    out={k:v for k,v in out.items() if v};cache[root]=out;return out


def source_parameter_bounds():
    p=pinned_profile()['parametersExactExpressions']
    require(p['j0']=={'power':[{'ref':'h'},4]} and
            p['sigmaStar']=={'quotient':[{'ref':'j0'},{'integer':2000}]},'j0 and sigmaStar')
    require(p['rho']=={'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]},'original rho')
    require(p['Lambda']=={'power':[{'ref':'Q'},64]} and p['K']=={'power':[{'ref':'Pstar'},2]} and
            p['Pstar']=={'exp':{'ref':'logP'}} and p['logP']=={'product':[{'integer':2},{'ref':'T'}]},'positive scales')
    require(p['Q']['quotient'][0]['product'][1]=={'ref':'K'} and
            p['Q']['quotient'][1]=={'power':[{'ref':'sigmaStar'},2]},'source Q formula')
    C=int(p['Q']['quotient'][0]['product'][0]['integer'])
    require(C>2**64 and C>163840,'source Q budget constant')
    # T>0, Pstar>1, K>1, 0<sigmaStar<1. Hence Q>C>2^64 and
    # Lambda=Q^64>2^4096. This does NOT assume a full coefficient norm.
    return {'h_strictly_positive':True,'h_upper':'2^-4096',
            'j0':'h^4','sigmaStar':'h^4/2000','rho':'sigmaStar^2/65536',
            'inverse_Lambda_strict_upper':'2^-4096','Q_numerator_constant':str(C),
            'decoded_N3_expressions_sha256':EXPECTED_DECODED_EXPRESSIONS_SHA256}


def authenticate_source(folder):
    folder=Path(folder);raw=(folder/'original-source-functions.json').read_bytes()
    require(hashlib.sha256(raw).hexdigest()==REGISTRY_SHA,'native registry SHA')
    fixed=json.loads(json.loads(raw)['base']['base']['fixed']);core=fixed['core']
    expected={'eta':2,'h':9,'j0':3453,'Lambda':3454,'sigmaStar':3455,
              'D':22,'d':30,'L':28,'Ustar':3459,'Hstar':3461,'Wstar':3467,'chi':3472}
    require(all(core.get(k)==v for k,v in expected.items()),'original core tuple')
    sha=hashlib.sha256();nodes=[];count=0
    with gzip.open(folder/'original-source-nodes.jsonl.gz','rb') as stream:
        for j,line in enumerate(stream):
            sha.update(line)
            if j==0:
                require(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},'graph header');continue
            count+=1
            if j-1<=3472:nodes.append(json.loads(line))
    require(count==4420257 and sha.hexdigest()==GRAPH_SHA,'entire original graph SHA')
    def check(i,op,args):require(nodes[i]=={'op':op,'args':args},'core node '+str(i))
    check(3457,'inverse',[3454]);check(3468,'integer_power',[3461,2]);check(3469,'integer_power',[3455,2])
    check(3470,'add',[3468,3469]);check(3471,'inverse',[3470]);check(3472,'multiply',[3468,3471])
    e={(1,0,0):F(1)};h={(0,1,0):F(1)};j={(0,0,1):F(1)};one={(0,0,0):F(1)}
    neg=lambda a:{k:-v for k,v in a.items()}
    mulconst=lambda n,a:_pmul({(0,0,0):F(n)},a)
    U=source_polynomial(nodes,core['Ustar']);W=source_polynomial(nodes,core['Wstar'])
    pref=_padd(W,_pmul(h,_padd(one,neg(mulconst(2,_pmul(e,U))))))
    require(pref=={(0,0,0):F(-3),(0,1,0):F(1),(1,0,1):F(-1)},'R1 numerator identity')
    require(source_polynomial(nodes,core['Hstar'])=={(0,0,1):F(1),(1,0,0):F(9,2),
             (1,1,0):F(-1),(2,0,1):F(-1),(3,0,0):F(-4)},'actual Hstar polynomial')
    require(source_polynomial(nodes,core['L'])=={(0,0,0):F(1),(2,1,0):F(-2)},'actual L polynomial')
    base=Path(__file__).resolve().parents[2]/'mathscope-m2/navier'
    for name,digest in PRODUCERS.items():
        require(hashlib.sha256((base/name).read_bytes()).hexdigest()==digest,'coefficient producer '+name)
    return {'graph_sha256':GRAPH_SHA,'registry_sha256':REGISTRY_SHA,
            'polynomial_identities_checked':['Hstar','L','Wstar+h*(1-2*eta*Ustar)=-3+h-j0*eta'],
            'producer_sha256':PRODUCERS,'source_parameters':source_parameter_bounds(),
            'source_first_FiveMap_only':True}


def tube_bound():
    """Exact rational checks supporting the written complex-tube proof.

    For real x in[-2,2], |z-x|<=4*rho, |z|<17/8. Then |H(z)|<=54,
    |H(x)|<=28, |H'|<=63, so the denominator variation <sigma^2/2.
    Cauchy's theorem itself is not implemented as a finite numerical test.
    """
    Hbound=F(54);Hreal=F(28);Hp=F(63);variation=Hp*(Hbound+Hreal)
    require(variation<6000 and F(6000,16384)<F(1,2),'complex denominator margin')
    require(2*F(1,32)*F(17,8)**2<F(1,2),'L denominator margin')
    chi=2*Hbound**2;remainder=F(165,16)
    phi=(chi+remainder)/4
    require(phi<2048,'Phi1 tube bound')
    return {'real_eta_interval_I_prime':['-2','2'],'complex_tube_radius':'4*rho',
            'original_appendix_interval_I_bound_to_I_prime':False,
            'rho':'sigmaStar^2/65536','Hstar_absolute_upper':'54','Hstar_derivative_upper':'63',
            'Hstar_squared_plus_sigma_squared_modulus_lower':'sigmaStar^2/2',
            'L_modulus_lower':'1/2','Phi1_modulus_upper':'2048/sigmaStar^2',
            'all_eta_derivative_bound_on_I_prime':'m!*(2048/sigmaStar^2)/(4*rho)^m',
            'B_rho_radial_n1_slice_on_I_prime_upper':'163840/sigmaStar^2 < Q',
            'B_rho_definition':'a_(n,m)=20^-n*rho^-m*m!*binom(n+m,m)/((n+1)^2*(m+1)^2)',
            'n1_weight_identity':'1/a_(1,m)=80*(m+1)*rho^m/m!',
            'integer_weight_lemma':'m+1 <= 4^m for every natural m',
            'complex_holomorphy_and_Cauchy_formalized_in_Lean':False,
            'whole_Phi_u_Brho_norm_proved':False}


def _phi1_scaled_series(h,h8,inverse_Lambda,degree,bits):
    """Taylor series in xi=eta/j0; no division by an interval containing h=0."""
    zero=point(0);one=point(1)
    rnd=lambda x:round_out(x,bits)
    def add(a,b):return [rnd(a[k]+b[k]) for k in range(degree+1)]
    def scale(a,x):return [rnd(v*x) for v in a]
    def mul(a,b):
        return [rnd(sum((a[j]*b[k-j] for j in range(k+1)),zero)) for k in range(degree+1)]
    def inverse(a):
        out=[rnd(a[0].reciprocal())]
        for n in range(1,degree+1):
            out.append(rnd(-sum((a[k]*out[n-k] for k in range(1,n+1)),zero)/a[0]))
        return out
    def poly(values):return (values+[zero]*(degree+1))[:degree+1]
    Hs=poly([one,rnd(point(F(9,2))-h),-h8,rnd(-h8*point(4))])
    hs2=mul(Hs,Hs);den=add(hs2,poly([point(F(1,4000000))]))
    chi=mul(hs2,inverse(den))
    L=poly([one,zero,rnd(-point(2)*h*h8)])
    r1=mul(poly([rnd(point(-3)+h),-h8]),inverse(L))
    return scale(add(scale(chi,point(-1)),scale(r1,inverse_Lambda)),point(F(1,4)))


def phi1_axis_jets(degree=5,bits=256):
    require(type(degree)is int and 0<=degree<=5,'supported eta orders 0..5')
    require(type(bits)is int and 32<=bits<=8192,'arithmetic bits 32..8192')
    bounds=source_parameter_bounds();small=I(F(0),H)
    coefficients=_phi1_scaled_series(round_out(small,bits),round_out(I(F(0),H**8),bits),
                                    round_out(small,bits),degree,bits)
    jets=[]
    for m,c in enumerate(coefficients):
        value=round_out(c*point(factorial(m)),bits)
        jets.append({'eta_order':m,'normalized_enclosure':value.json(),
                     'normalization':'h^(4*m) * d_eta^m Phi_1(0)',
                     'unnormalized_exact_scale':{'base':'h','integer_exponent':-4*m}})
    return {'schema':'MathScope.M3.ActualFirstPhiCoefficientAxisJets/1',
            'radial_coefficient':1,'component':'Phi','eta':'0','arithmetic_bits':bits,
            'coefficient_formula':'(-chi+Lambda^-1*(-3+h-j0*eta)/L)/4',
            'source_parameters':bounds,'axis_chi_exact':'4000000/4000001',
            'normalized_eta_jets':jets,'complex_tube_and_Brho_slice':tube_bound(),
            'actual_nonlinear_finite_coefficient_evaluated':True,
            'finite_degree1_Phi_polynomial_Brho_on_I_prime_norm_le_Q':True,
            'whole_natural_function_evaluated':False,'whole_Phi_u_Brho_norm_proved':False,
            'common_all_radial_coefficients_complex_domain_proved':False,
            'source_natural_Y_calls_newly_certified':0,'natural_Y_certified':33,'natural_Y_OPEN':490,
            'final_67_jets':0,'M3':'62/64','M4':'0/16','release':'HOLD'}


def main():
    p=argparse.ArgumentParser();p.add_argument('--graph-dir',required=True);p.add_argument('--output',required=True)
    args=p.parse_args();source=authenticate_source(args.graph_dir)
    result=phi1_axis_jets(bits=4096)
    payload={'schema':'MathScope.M3.SourcePinnedActualPhi1Run/1','source':source,'result':result,
             'implementation_sha256':{name:hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()
                for name in ('original_phi1_coefficient.py','original_monotone2_interval_jets.py',
                             'rigorous_rational_intervals.py','pinned_n3_parameter_intervals.py',
                             'certify_original_two_root2_image_endpoints.py')}}
    canonical=json.dumps(payload,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()
    payload['run_hash_sha256']=hashlib.sha256(canonical).hexdigest()
    Path(args.output).write_text(json.dumps(payload,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'run_hash_sha256':payload['run_hash_sha256'],'actual_Phi_radial_coefficients':1,
                      'normalized_eta_jets':6,'whole_Phi_u_Brho_norm_proved':False,'release':'HOLD'}))


if __name__=='__main__':main()
