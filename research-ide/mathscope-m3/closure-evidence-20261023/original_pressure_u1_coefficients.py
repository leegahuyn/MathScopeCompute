"""Actual A.21 pressure quadrature and the first nonlinear u coefficient.

Retain the square radial seed exp(-1/y^2). A.21 pressure has an exponentially
small post-decay remainder, so source T need not be materialized. No whole
Phi,u fixed point, final A-D field, energy, or release is certified here.
"""
import argparse,gzip,hashlib,json
from fractions import Fraction as F
from functools import lru_cache
from math import factorial
from pathlib import Path
from rigorous_rational_intervals import Interval as I,UncertifiedExpression
from original_monotone2_interval_jets import GRAPH_SHA,REGISTRY_SHA,H,point,round_out
from pinned_n3_parameter_intervals import pinned_profile
from original_phi1_coefficient import authenticate_source as authenticate_phi1

STAGES=['initial','axialDecay','entry','reservedPower','pulse','interpolation',
        'angular','steepen','steepPower','flatten','wait','terminal']
PRODUCERS={
 'actual-global-source-outer.mjs':'5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9',
 'actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
 'actual-continuation-exact-support.mjs':'0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
}


def require(ok,why):
    if not ok:raise UncertifiedExpression('PRESSURE_U1_UNPROVED: '+why)


def source_scales():
    p=pinned_profile()['parametersExactExpressions']
    expected={'BOuter':{'product':[{'integer':1000},{'ref':'T'}]},
              'co':{'rational':'1/256'},'Tf':{'integer':128},
              'lambda':{'exp':{'product':[{'integer':-1000},{'ref':'T'}]}},
              'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},
              'logP':{'product':[{'integer':2},{'ref':'T'}]}}
    require(all(p.get(k)==v for k,v in expected.items()),'original pressure scales')
    require(F(32,8191)<1 and F(31,16)>1,'positive wait scalar margins')
    C=int(p['Q']['quotient'][0]['product'][0]['integer'])
    require(C>819200,'finite coefficient pair norm budget')
    return {'h_positive_and_less_than_lambda':True,'h_upper':'2^-4096',
            'outer_rho':'h/256','outer_rho_upper':'1/8192',
            'Qb_strict_lower':'31/16','Qp_strict_bounds':['0','32/8191'],
            'terminal_wait_finite_and_positive':True,
            'inverse_K_upper':'2^-40','exp_minus_T_upper':'2^-8192',
            'step':'exp(-1/y^2)/(exp(-1/y^2)+exp(-1/(1-y)^2))',
            'step_properties':['monotone','sigma(1-y)=1-sigma(y)','integral_0^1 sigma=1/2']}


class PressureAD:
    """Independent fixed-endpoint differentiation of the source pressure DAG.

    Constructors use exact algebra and source node interning. No source AD
    function is called. Analytic applicability follows from the pressure
    strip bound; only fixed, eta-independent integral bounds are accepted.
    """
    def __init__(self,nodes):
        self.nodes=list(nodes);self.index={self.key(n['op'],n['args']):i for i,n in enumerate(nodes)}
        self.cache={};self.dep={};self.integrals=0
        self.zero=self.q(0);self.one=self.q(1)
    @staticmethod
    def key(op,args):return json.dumps([op,args],separators=(',',':'))
    def put(self,op,args):
        key=self.key(op,args)
        if key not in self.index:self.index[key]=len(self.nodes);self.nodes.append({'op':op,'args':args})
        return self.index[key]
    def q(self,n,d=1):
        x=F(n,d);return self.put('rational',[str(x.numerator),str(x.denominator)])
    def binary(self,op,a,b):
        if op=='add':
            if a==self.zero:return b
            if b==self.zero:return a
        else:
            if a==self.zero or b==self.zero:return self.zero
            if a==self.one:return b
            if b==self.one:return a
        u=self.nodes[a];v=self.nodes[b]
        if u['op']==v['op']=='rational':
            x=F(*map(int,u['args']));y=F(*map(int,v['args']))
            z=x+y if op=='add' else x*y;return self.q(z.numerator,z.denominator)
        return self.put(op,sorted([a,b]))
    def add(self,*args):
        out=self.zero
        for a in args:out=self.binary('add',out,a)
        return out
    def mul(self,*args):
        out=self.one
        for a in args:out=self.binary('multiply',out,a)
        return out
    def inv(self,a):
        n=self.nodes[a]
        if n['op']=='rational':return self.q(int(n['args'][1]),int(n['args'][0]))
        return self.put('inverse',[a])
    def pow(self,a,n):
        if n==0:return self.one
        if n==1:return a
        if n<0:return self.pow(self.inv(a),-n)
        if n==2 and self.nodes[a]['op']=='rational':
            x=F(*map(int,self.nodes[a]['args']));return self.q(x.numerator*x.numerator,x.denominator*x.denominator)
        return self.put('integer_power',[a,n])
    def depends(self,i):
        if i in self.dep:return self.dep[i]
        n=self.nodes[i];op=n['op'];a=n['args']
        if op in ('rational','source_parameter'):v=False
        elif op=='coordinate':v=i==2
        elif op in ('add','multiply','smooth_piecewise'):v=any(self.depends(c) for c in a)
        elif op=='definite_integral':v=(a[1]!=2 and self.depends(a[0])) or self.depends(a[2]) or self.depends(a[3])
        elif op in ('inverse','integer_power','exp','log_positive','sqrt_positive','source_step_derivative'):
            v=self.depends(a[0])
        else:raise UncertifiedExpression('Unknown pressure dependency operation '+op)
        self.dep[i]=v;return v
    def derivative(self,i):
        if i in self.cache:return self.cache[i]
        if not self.depends(i):out=self.zero
        else:
            n=self.nodes[i];op=n['op'];a=n['args'];d=self.derivative
            if op=='coordinate':out=self.one
            elif op=='add':out=self.add(d(a[0]),d(a[1]))
            elif op=='multiply':out=self.add(self.mul(d(a[0]),a[1]),self.mul(a[0],d(a[1])))
            elif op=='inverse':out=self.mul(self.q(-1),self.mul(d(a[0]),self.pow(i,2)))
            elif op=='integer_power':out=self.mul(self.q(a[1]),self.pow(a[0],a[1]-1),d(a[0]))
            elif op=='exp':out=self.mul(i,d(a[0]))
            elif op=='log_positive':out=self.mul(d(a[0]),self.inv(a[0]))
            elif op=='definite_integral':
                require(a[1]!=2 and not self.depends(a[2]) and not self.depends(a[3]),'fixed pressure integral endpoints')
                body=d(a[0]);self.integrals+=1
                out=self.zero if body==self.zero or a[2]==a[3] else self.put(op,[body,*a[1:]])
            else:raise UncertifiedExpression('Unsupported eta-dependent pressure operation '+op)
        self.cache[i]=out;return out
    def even(self,i,cache=None):
        if cache is None:cache={}
        if i in cache:return cache[i]
        if not self.depends(i):v='even'
        else:
            n=self.nodes[i];op=n['op'];a=n['args']
            if op=='coordinate':v='odd'
            elif op=='integer_power':
                base=self.even(a[0],cache)
                v='even' if a[1]==0 else 'unknown' if base=='unknown' else 'even' if a[1]%2==0 else base
            elif op=='add':
                x=self.even(a[0],cache);v=x if x==self.even(a[1],cache) else 'unknown'
            elif op=='multiply':
                x=self.even(a[0],cache);y=self.even(a[1],cache)
                v='unknown' if 'unknown' in (x,y) else 'even' if x==y else 'odd'
            elif op in ('exp','log_positive','inverse','sqrt_positive'):
                v='even' if self.even(a[0],cache)=='even' else 'unknown'
            elif op=='definite_integral':
                v=self.even(a[0],cache) if a[1]!=2 and not self.depends(a[2]) and not self.depends(a[3]) else 'unknown'
            else:v='unknown'
        cache[i]=v;return v


def authenticate_source(folder):
    phi=authenticate_phi1(folder);raw=(Path(folder)/'original-source-functions.json').read_bytes()
    require(hashlib.sha256(raw).hexdigest()==REGISTRY_SHA,'original registry SHA')
    fixed=json.loads(json.loads(raw)['base']['base']['fixed']);p=fixed['pressure'];outer=fixed['outer'];core=fixed['core']
    require([x['id'] for x in p['stages']]==STAGES==[x['id'] for x in outer['stages']],'complete 12 source stages')
    require(p['pressure']==core['P0']==3451 and p['pressureOverPstarSquared']==3449 and
            p['eta']==2 and p['f']==17 and p['logf']==18,'original pressure roots')
    sha=hashlib.sha256();nodes=[];count=0
    with gzip.open(Path(folder)/'original-source-nodes.jsonl.gz','rb') as stream:
        for j,line in enumerate(stream):
            sha.update(line)
            if j:
                count+=1
                if j-1<=3611:nodes.append(json.loads(line))
    require(count==4420257 and sha.hexdigest()==GRAPH_SHA,'entire graph SHA')
    for row,ref in zip(p['stages'],outer['stages']):
        require(nodes[row['integral']]=={'op':'definite_integral','args':[row['integrand'],row['variable'],0,ref['length']]},'pressure integral '+row['id'])
        require(nodes[row['integrand']]['op']=='exp','literal pressure density')
    replay=PressureAD(nodes)
    require(replay.even(3451)=='even','literal pressure eta evenness')
    for row,ref in zip(p['stages'],outer['stages']):
        require(not replay.depends(ref['length']) and not replay.depends(ref['logAStart']),'eta-independent pressure schedule')
        expected_theta=1 if row['id'] in STAGES[:5] else 0
        if row['id']=='interpolation':
            step=replay.put('source_step_derivative',[replay.mul(row['variable'],replay.inv(13)),0])
            expected_theta=replay.add(1,replay.mul(replay.q(-1),step))
        require(row['theta']==expected_theta,'actual pressure theta '+row['id'])
    require(outer['stages'][0]['logAEnd']==replay.q(-1,5),'initial amplitude endpoint')
    prefix=replay.mul(replay.q(5),replay.pow(17,2))
    require(prefix==p['initialInfinitePrefix'],'complete infinite initial pressure prefix')
    tail=replay.mul(replay.put('exp',[replay.mul(replay.q(2),outer['stages'][-1]['logAEnd'])]),
                    replay.inv(replay.add(1,replay.mul(replay.q(2),9))))
    require(tail==p['terminalInfiniteTail'],'complete infinite terminal pressure tail')
    require(replay.mul(replay.q(-1,2),replay.add(prefix,*[row['integral'] for row in p['stages']],tail))==3449,'full A21 pressure sum')
    require(replay.derivative(3451)==3602,'independent pressure eta derivative replay')
    neg=lambda a:replay.mul(replay.q(-1),a)
    # Bind the actual Zstar to the pressure derivative just independently
    # differentiated, before using u1=-Zstar/(2L).
    A=core['A'];Us=core['Ustar'];Hs=core['Hstar'];d=core['d']
    Z=replay.add(neg(replay.mul(A,replay.add(1,neg(replay.mul(replay.q(2),2,Us))),Us)),
                 neg(replay.mul(replay.q(4),Hs)),neg(replay.mul(d,3602)),
                 replay.mul(replay.q(4),A,2,3451))
    require(Z==core['Zstar']==3611,'independent Zstar decomposition')
    require(len(replay.nodes)==len(nodes),'pressure derivative required an unbound expression')
    require(nodes[3611]=={'op':'add','args':[3608,3610]} and core['Zstar']==3611,'actual Zstar root')
    base=Path(__file__).resolve().parents[2]/'mathscope-m2/navier'
    for name,digest in PRODUCERS.items():require(hashlib.sha256((base/name).read_bytes()).hexdigest()==digest,'producer '+name)
    return {'Phi1_source':phi,'pressure_root':3451,'pressure_eta_root':3602,
            'independent_eta_derivative_reproduced_exact_source_node':True,
            'pressure_evenness_checked_from_source_AST':True,
            'differentiated_fixed_integrals':replay.integrals,
            'complete_pressure_stage_count':12,'all_source_stage_lengths_eta_independent':True,
            'original_pressure_tail_retained':True,'pressure_tail_denominator':'1+2h',
            'outer_energy_tail_certified':False,'producer_sha256':PRODUCERS,'source_scales':source_scales()}


@lru_cache(maxsize=32768)
def _exp_point(x,bits):
    require(type(x)is F,'exact exponential endpoint')
    if x==0:return point(1)
    if x>0:return round_out(_exp_point(-x,bits).reciprocal(),bits)
    t=-x
    if t>=bits:return I(F(0),F(1,1<<bits))
    k=0
    while t>F(1,2):t/=2;k+=1
    rnd=lambda a:round_out(a,bits)
    term=point(1);s=point(1);terms=max(24,(bits+5)//4)
    for j in range(1,terms+1):term=rnd(term*point(t)/point(j));s=rnd(s+term)
    remainder=term.hi*t/F(terms+1)/(1-t/F(terms+2))
    out=I(s.lo,s.hi+remainder).reciprocal()
    for _ in range(k):out=rnd(out*out)
    return rnd(out)


@lru_cache(maxsize=16384)
def _square_step(s,bits):
    if s<=0:return point(0)
    if s>=1:return point(1)
    if s==F(1,2):return point(F(1,2))
    if s>F(1,2):return point(1)-_square_step(1-s,bits)
    t=1/(s*s)-1/((1-s)*(1-s))
    e=_exp_point(-t,bits)
    # Monotone map e/(1+e), evaluated by its endpoint formula.
    return round_out(I(e.lo/(1+e.lo),e.hi/(1+e.hi)),bits)


def pressure_quadrature(cells=512,bits=128):
    require(type(cells)is int and 16<=cells<=8192 and cells&(cells-1)==0,'power-of-two cell count 16..8192')
    require(type(bits)is int and 32<=bits<=256,'arithmetic precision 32..256')
    source_scales();dt=F(1,cells);values=[_square_step(F(i,cells),bits) for i in range(cells+1)]
    lo=[F(0)];hi=[F(0)]
    for i in range(cells):lo.append(lo[-1]+dt*values[i].lo);hi.append(hi[-1]+dt*values[i+1].hi)
    lo[-1]=hi[-1]=F(1,2) # Exact radial-step symmetry, not an estimated endpoint.
    total_lo=F(0);total_hi=F(0)
    for i in range(cells):
        a=F(i,cells);b=a+dt
        flow=a/F(5)-F(6,5)*hi[i+1];fhi=b/F(5)-F(6,5)*lo[i]
        total_lo+=dt*_exp_point(flow,bits).lo;total_hi+=dt*_exp_point(fhi,bits).hi
    initial=round_out(I(total_lo,total_hi),bits)
    c0=round_out((point(5)+initial+_exp_point(F(-2,5),bits))*point(F(1,2)),bits)
    return {'cells':cells,'arithmetic_bits':bits,'initial_integral':initial,'c0':c0,
            'post_decay_strip_error':F(24,1<<8192)}


def _poly_mul(a,b,n,bits):
    zero=point(0)
    return [round_out(sum((a[j]*b[k-j] for j in range(k+1)),zero),bits) for k in range(n+1)]


def _poly_inverse(a,n,bits):
    out=[a[0].reciprocal()]
    for k in range(1,n+1):out.append(round_out(-sum((a[j]*out[k-j] for j in range(1,k+1)),point(0))/a[0],bits))
    return out


def norm_margins():
    pressure=F(20+8+10*4+4+4,2)
    z=F(17,8);A=F(17,32);us=F(19,2)
    polynomial=A*(1+2*z*us)*us+4*54
    derivative=F(64)*16
    u=512+F(353,64)*derivative+4*A*z*64
    require(pressure<64 and polynomial<512 and u<8192,'actual pressure/u1 analytic margins')
    require(80*8192==655360 and 163840+655360==819200,'paired first-coefficient norm weight')
    return {'pressure_strip_bound':'64*K','pressure_derivative_bound_on_half_strip':'1024*K',
            'u1_bound_on_I_prime_4rho_tube':'8192*K','I_prime':['-2','2'],
            'u1_Brho_n1_slice_upper':'655360*K','finite_degree1_pair_upper':'819200*K/sigmaStar^2 < Q',
            'complex_Cauchy_proofs_formalized_in_Lean':False}


def source_function_samples(c0,bits=128):
    """Actual normalized first coefficient, not the complete u/velocity.

    On real |eta|<=1, the original positive h and K^-1 terms are bounded,
    not discarded: |u1/K-c0*eta*(3-eta^2)/(1+eta^2)^3|<2^-33.
    """
    require(c0.lo>0 and c0.hi<=4,'source pressure quadrature constant range')
    require(F(1639,32)<64,'real nonpressure numerator bound')
    bound=64*H+F(64,1<<40)+F(264,1<<8192)
    require(bound<F(1,1<<33),'retained source corrections')
    error=F(1,1<<33);pressure_error=F(24,1<<8192);samples=[]
    for i in range(-32,33):
        eta=F(i,32);f=1/(1+eta*eta)
        u=c0*point(eta*(3-eta*eta)*f**3)
        p=-c0*point(f*f)
        samples.append({'eta':str(eta),
                        'u1_divided_K':round_out(I(u.lo-error,u.hi+error),bits).json(),
                        'P0_divided_K':round_out(I(p.lo-pressure_error,p.hi+pressure_error),bits).json()})
    return {'scope':'CONDITIONAL_ORIGINAL_FIRST_COEFFICIENT_PREFIX',
            'surface_quantity':'Y*u1(eta)/K; first radial Taylor contribution, not full u or velocity',
            'Y_range':['0','41/10'],'eta_range':['-1','1'],
            'uniform_u1_over_K_error_from_c0_formula':'2^-33',
            'source_h_and_inverse_K_replaced_by_zero':False,
            'samples':samples,'final_A_D_field_samples':False}


def calculate(cells=512,bits=128):
    quad=pressure_quadrature(cells,bits);c=quad['c0'];epsilon=quad['post_decay_strip_error']
    pressure=[]
    for m in range(7):
        if m%2:pressure.append(point(0))
        else:
            main=c*point((-1)**(m//2+1)*(m//2+1));error=epsilon*8**m
            pressure.append(I(main.lo-error,main.hi+error))
    n=5;zero=point(0);one=point(1);rnd=lambda x:round_out(x,bits)
    pad=lambda x:(x+[zero]*6)[:6]
    h=rnd(I(F(0),H));j=rnd(I(F(0),H**4));j2=rnd(I(F(0),H**8));ki=I(F(0),F(1,1<<40))
    A=rnd(point(F(1,2))+h)
    nonpressure=pad([rnd(j*(A+point(4))),rnd(point(20)-(one+point(2)*h)*j2),
                     rnd(-j*(point(12)+point(16)*h)),rnd(-point(32)*(one+h))])
    dp=pad([rnd(pressure[k+1]*point(k+1)) for k in range(6)])
    dP=_poly_mul(pad([one,zero,point(-1)]),dp,n,bits)
    ep=_poly_mul(pad([zero,one]),[rnd(x) for x in pressure[:6]],n,bits)
    rhs=[rnd(nonpressure[k]*ki+dP[k]-point(4)*A*ep[k]) for k in range(6)]
    L=pad([one,zero,rnd(-point(2)*h)])
    u=_poly_mul(rhs,_poly_inverse(L,n,bits),n,bits)
    odd=[{'eta_order':m,'normalized_by':'K=Pstar^2','enclosure':rnd(u[m]*point(F(factorial(m),2))).json()} for m in (1,3,5)]
    even=[{'eta_order':0,'exact_positive_scale':'h^4','normalized_enclosure':rnd(point(F(9,4))+h*point(F(1,2))).json()},
          {'eta_order':2,'exact_positive_scale':'h^4','normalized_enclosure':rnd(point(-12)-point(7)*h+point(2)*h.power(2)).json()},
          {'eta_order':4,'exact_positive_scale':'h^5','normalized_enclosure':rnd(point(-288)-point(168)*h+point(48)*h.power(2)).json()}]
    return {'schema':'MathScope.M3.ActualPressureAndU1AxisCoefficients/1',
            'quadrature':{'cells':cells,'arithmetic_bits':bits,'initial_integral':quad['initial_integral'].json(),'c0':c.json()},
            'pressure_approximation':'P0/K=-c0/(1+eta^2)^2 + E(eta)',
            'pressure_error_strip':'abs(Im eta)<=1/8','pressure_error_modulus_upper':'24*2^-8192',
            'pressure_Taylor_coefficients_divided_by_K':[x.json() for x in pressure],
            'u1_odd_eta_derivatives':odd,'u1_even_eta_derivatives':even,
            'visualization':source_function_samples(c,bits),
            'u1_formula':'[A*(1-2*eta*Ustar)*Ustar+4*Hstar+d*P0_eta-4*A*eta*P0]/(2*L)',
            'source_scales':source_scales(),'whole_Phi_u_Brho_norm_proved':False,
            'norm_margins':norm_margins(),
            'pressure_strip_modulus_upper':'64*K',
            'u1_modulus_upper_on_I_prime_4rho_tube':'8192*K',
            'u1_Brho_n1_slice_on_I_prime_upper':'655360*K',
            'finite_degree1_Phi_u_pair_Brho_on_I_prime_upper':'819200*K/sigmaStar^2 < Q',
            'finite_degree1_Phi_u_pair_Brho_on_I_prime_norm_le_Q':True,
            'I_prime':['-2','2'],'complex_Cauchy_proofs_formalized_in_Lean':False,
            'original_appendix_I_bound_to_I_prime':False,'final_A_D_fields_computed':False,
            'outer_energy_tail_certified':False,
            'natural_Y_certified':33,'natural_Y_OPEN':490,'final_67_jets':0,
            'M3':'62/64','M4':'0/16','release':'HOLD'}


def main():
    p=argparse.ArgumentParser();p.add_argument('--graph-dir',required=True);p.add_argument('--output',required=True)
    p.add_argument('--cells',type=int,default=512);p.add_argument('--bits',type=int,default=128)
    args=p.parse_args();source=authenticate_source(args.graph_dir);result=calculate(args.cells,args.bits)
    payload={'schema':'MathScope.M3.SourcePinnedActualPressureU1Run/1','source':source,'result':result,
             'implementation_sha256':{name:hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()
                for name in ('original_pressure_u1_coefficients.py','original_phi1_coefficient.py',
                             'original_monotone2_interval_jets.py','rigorous_rational_intervals.py',
                             'pinned_n3_parameter_intervals.py','certify_original_two_root2_image_endpoints.py')}}
    canonical=json.dumps(payload,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()
    payload['run_hash_sha256']=hashlib.sha256(canonical).hexdigest()
    Path(args.output).write_text(json.dumps(payload,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'run_hash_sha256':payload['run_hash_sha256'],'actual_u_radial_coefficients':1,'release':'HOLD'}))


if __name__=='__main__':main()
