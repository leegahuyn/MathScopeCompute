"""Source-pinned whole radial-series majorant on explicit I'=[-2,2].

Exact scalar/combinatorial certificates accompany the written Banach proof.
This is not a Lean formalization of complex analysis or Banach's theorem.
No native call arguments, original unspecified I, final A-D, or energy gate
is promoted by the explicit-interval coefficient-space result.
"""
import argparse,hashlib,json
from fractions import Fraction as F
from math import comb,factorial
from pathlib import Path
from original_phi1_coefficient import tube_bound,source_parameter_bounds
from original_pressure_u1_coefficients import authenticate_source,norm_margins,source_scales
from pinned_n3_parameter_intervals import pinned_profile
from rigorous_rational_intervals import UncertifiedExpression

PRESSURE_RUN='148b63ed06fa43fad880d8c4f5aedaf3a480bdd4a56f21746e3c0acbdc7697f9'
PRESSURE_FILE='0154d1501368c9551ad63942ae7fae2438c2bd9a23495634491cdfda55286ecd'
ALGEBRA=256
MCHI=ALGEBRA*3


def require(ok,why):
    if not ok:raise UncertifiedExpression('BRHO_UNPROVED: '+why)


def weight(n,m,rho=F(1)):
    require(type(n) is int and type(m) is int and n>=0 and m>=0,'natural weight indices')
    require(rho>0,'positive rho')
    return F(factorial(m)*comb(n+m,m),20**n*(n+1)**2*(m+1)**2)*rho**(-m)


def resolvent_certificate(N=256,mchi=MCHI):
    """All k>N: t[k+1]/t[k] decreases, exact positive-series tail."""
    require(type(N) is int and N>=0 and mchi>=0,'resolvent inputs')
    B=F(40*mchi);t=F(1);partial=t
    for k in range(N):t*=B/F((k+1)*(k+2));partial+=t
    first=t*B/F((N+1)*(N+2));ratio=B/F((N+2)*(N+3))
    require(ratio<1,'resolvent tail ratio')
    upper=partial+first/(1-ratio)
    require(upper<2**704,'explicit resolvent upper')
    return {'M_chi':mchi,'B':str(B),'partial_degree':N,'positive_partial_sum':str(partial),
            'first_omitted_term':str(first),'omitted_successive_ratio_upper':str(ratio),
            'entire_resolvent_norm_upper':str(upper),'strict_power_of_two_upper':'2^704',
            'all_k_not_only_finite_partial_sum':True}


# In J[c * inner], c is radial-independent and commutes with J. Every
# source factor has B_rho norm<=Q. Product costs one Q per algebra256.
# Inner kernels include the J inverse; their indicated Q powers include
# both unknown norms and operator constants, never a raw eta derivative.
# The nested pressure kernels retain g^2 and the FULL Phi^2.
KERNELS={
 'Phi':(2,1),'u':(2,1),'DXPhi':(2,1),'DXu':(2,1),
 'etaPhi':(2,1),'etau':(2,1),
 'avg_u_Phi':(3,2),'etaavg_u_Phi':(3,2),
 'u_Phi':(3,2),'avg_u_DXPhi':(3,2),'etaavg_u_DXPhi':(3,2),
 'u_etaPhi':(3,2),'u_u':(3,2),'avg_u_DXu':(3,2),
 'etaavg_u_DXu':(3,2),'u_etau':(3,2),
 'I_g_g_Phi_Phi':(9,2),'etaI_g_g_Phi_Phi':(9,2),
 'Y_g_g_Phi_Phi':(9,2),
}
R1=[
 (['Linv','Wstar'],'Phi'),
 (['Linv','eps','minus2','D','eta'],'avg_u_Phi'),
 (['Linv','eps','minus1','d'],'etaavg_u_Phi'),
 (['Linv','h'],'Phi'),
 (['Linv','minus2','h','eta','Ustar'],'Phi'),
 (['Linv','minus2','h','eta','eps'],'u_Phi'),
 (['Linv','d','zeta'],'u_Phi'),
 (['Linv','Wstar'],'DXPhi'),
 (['Linv','eps','minus2','D','eta'],'avg_u_DXPhi'),
 (['Linv','eps','minus1','d'],'etaavg_u_DXPhi'),
 (['Linv','Hstar'],'etaPhi'),
 (['Linv','eps','d'],'u_etaPhi'),
]
R2=[
 (['Linv','alpha'],'u'),
 (['Linv','minus2','A','eta','eps'],'u_u'),
 (['Linv','Wstar'],'DXu'),
 (['Linv','eps','minus2','D','eta'],'avg_u_DXu'),
 (['Linv','eps','minus1','d'],'etaavg_u_DXu'),
 (['Linv','Hstar'],'etau'),
 (['Linv','eps','d'],'u_etau'),
 (['Linv','minus4','A','eta'],'I_g_g_Phi_Phi'),
 (['Linv','d'],'etaI_g_g_Phi_Phi'),
 (['Linv','minus2','eta'],'Y_g_g_Phi_Phi'),
]
SOURCE_FACTORS={'Linv','Wstar','eps','minus2','minus1','minus4','D','eta',
                'd','h','Ustar','zeta','Hstar','alpha','A'}


def remainder_majorant(rows):
    require(0<len(rows)<=16,'monomial count budget')
    cert=[]
    for factors,kernel in rows:
        require(factors and set(factors)<=SOURCE_FACTORS,'known scalar source factors')
        require(kernel in KERNELS,'known integrated derivative kernel')
        inner,degree=KERNELS[kernel]
        require(degree in (1,2),'actual polynomial degree in unknown pair')
        # Norm(c)<=Q^(2r-1), norm(c*inner)<=Q^(2r+inner).
        exponent=2*len(factors)+inner
        # For a difference, replacing a single unknown removes a Q.
        # Sum at most2 replacements; 2/Q<=1, hence same exponent.
        require(exponent<=19,'per-monomial Q-exponent budget')
        cert.append({'scalar_factors':factors,'integrated_kernel':kernel,
                     'unknown_degree':degree,'norm_Q_exponent':exponent,
                     'Lipschitz_Q_exponent':exponent})
    exponent=max(r['norm_Q_exponent'] for r in cert)+1 # sum<=16<=Q
    require(exponent<=20,'summed Q-exponent budget')
    return {'monomials':cert,'computed_total_Q_exponent':exponent,
            'uniform_norm_upper':'Q^20','uniform_Lipschitz_upper':'Q^20',
            'unknown_pair_max_norm_assumption':'<=Q'}


def source_budget():
    source_parameter_bounds();source_scales();tube_bound();norm_margins()
    p=pinned_profile()['parametersExactExpressions']
    require(p['CSelected']=={'exp':{'ref':'logCSelected'}} and
            p['BRefUpper']=={'power':[{'ref':'Q'},300]} and
            p['logCSelected']=={'sum':[{'product':[{'integer':10},{'log':{'sum':[{'integer':1},{'ref':'BRefUpper'}]}}]},{'power':[{'ref':'Q'},200]}]},'actual complex amplitude selection')
    C=int(p['Q']['quotient'][0]['product'][0]['integer'])
    require(C>2**240,'actual Q numerator')
    require(C>20480*65536,'all inverse/mixed operator constants below Q')
    require(C>4*655360,'u0 center <Q/4')
    require(C>648,'g primitive budget')
    require(32768>704+2,'Phi0 center <Q/4')
    require(F(17,32)*(1+4*F(17,8)*F(19,2))+4*F(353,64)<256,'alpha tube')
    require(1+4*F(353,64)+F(17,8)*F(19,2)<128,'Wstar tube')
    # Exact N3 structure is authenticated by source_parameter_bounds().
    # Q=C*K/sigma^2, K>=1, sigma^2=h^8/4000000<2^-32768.
    return {'Q':'C*K/sigmaStar^2','C':str(C),'K':'Pstar^2>=1',
            'Q_strict_lower':'2^32768','Lambda':'Q^64',
            'rho':'sigmaStar^2/65536','all_operator_constants_upper':'Q',
            'source_scalar_tube_bounds':{'Linv':'2','eta':'17/8','d':'353/64',
             'Ustar':'19/2','Hstar':'54','Wstar':'128','alpha':'256',
             'zeta':'216/sigmaStar^2','chi':'3','g':'1'},
            'chi_Brho_upper':3,'g_Brho_upper':1,
            'g_complex_primitive_path_length_upper':3,
            'psi_modulus_upper':'648/sigmaStar^2 < Q',
            'CSelected':'exp(Q^200)*(1+Q^300)^10',
            'g_modulus_upper_argument':'exp(Q^65-Q^200)<1 on convex 4rho tube',
            'source_pressure_datum_upper':'64*K on abs(Im eta)<=1/8',
            'center_Phi0_norm_upper':'2^704 < Q/4',
            'center_u0_norm_upper':'655360*K < Q/4'}


def normalized_tail(N=64,k=0,m=0,Y=F(41,10)):
    """Tail divided by Q*rho^-m*m!/(m+1)^2; Q is symbolic, not 0."""
    require(all(type(x) is int and x>=0 for x in (N,k,m)) and N>=k,'tail indices')
    require(0<Y<20,'tail Y range')
    n=N+1
    falling=factorial(n)//factorial(n-k)
    first=F(comb(n+m,m)*falling,20**n*(n+1)**2)*Y**(n-k)
    ratio=Y/F(20)*F(N+2+m,N+2-k)
    require(ratio<1,'tail ratio <1')
    return {'N':N,'radial_order':k,'eta_order':m,'Y':str(Y),
            'normalized_first_omitted_term':str(first),'ratio_upper':str(ratio),
            'normalized_entire_tail_upper':str(first/(1-ratio)),
            'restore_positive_scale':'Q*rho^-m*m!/(m+1)^2',
            'small_absolute_numeric_error_claimed':False}


def calculate():
    budget=source_budget();r1=remainder_majorant(R1);r2=remainder_majorant(R2)
    resolve=resolvent_certificate()
    return {'schema':'MathScope.M3.ExplicitIntervalWholeBrhoMajorant/1',
            'I_prime':['-2','2'],'tube_radius':'4*rho',
            'source_budget':budget,'resolvent':resolve,'J2_R1':r1,'J1_R2':r2,
            'fixed_point_ball':{'space':'B_rho(I_prime)^2 with max norm',
             'center':['f0(Y*chi)','-Y*Zstar/(2*L)'],'radius':'Q/4',
             'center_max_norm_strict_upper':'Q/4','enclosing_pair_max_norm':'Q/2',
             'map_displacement_upper':'1/(2*Q^43)','map_Lipschitz_upper':'1/(2*Q^43)<1/2',
             'invariant_and_contractive_by_written_proof':True},
            'whole_series_Brho_on_explicit_I_prime_upper':'Q/2 per component',
            'whole_radial_series_Brho_on_I_prime_by_written_proof':True,
            'common_complex_domain':{'radial_disk':'abs(Y)<5',
             'eta_disks':'abs(eta-x)<rho/2, x in I_prime',
             'generating_function_parameters':['1/4','1/2'],'joint_sum_upper':4},
            'all_order_tail_examples':[normalized_tail(64,k,m) for k,m in [(0,0),(4,0),(0,5),(4,5)]],
            'quadrature_Banach_complex_analysis_formalized_in_Lean':False,
            'original_unspecified_appendix_I_bound':False,
            'all_native_call_arguments_bound':False,'natural_Y_certified':33,
            'natural_Y_OPEN':490,'final_A_D_fields_computed':False,
            'global_energy_certified':False,'N8_four_axis_refinement_certified':False,
            'final_67_jets':0,'M3':'62/64','M4':'0/16','release':'HOLD'}


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--graph-dir',required=True)
    ap.add_argument('--pressure-run',required=True);ap.add_argument('--output',required=True)
    args=ap.parse_args();raw=Path(args.pressure_run).read_bytes()
    require(hashlib.sha256(raw).hexdigest()==PRESSURE_FILE,'actual pressure evidence bytes')
    prior=json.loads(raw);run=prior.pop('run_hash_sha256')
    require(run==PRESSURE_RUN and hashlib.sha256(json.dumps(prior,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()).hexdigest()==run,'prior canonical run')
    source=authenticate_source(args.graph_dir)
    payload={'schema':'MathScope.M3.SourcePinnedExplicitWholeBrhoRun/1',
             'source':source,'pressure_run_hash_sha256':run,'pressure_file_sha256':PRESSURE_FILE,
             'result':calculate(),
             'implementation_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
             'written_proof_sha256':hashlib.sha256(Path(__file__).with_name('EXPLICIT_WHOLE_BRHO_20261027_KO.md').read_bytes()).hexdigest()}
    payload['run_hash_sha256']=hashlib.sha256(json.dumps(payload,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()).hexdigest()
    Path(args.output).write_text(json.dumps(payload,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'run_hash_sha256':payload['run_hash_sha256'],'explicit_I_prime_whole_radial_norm':'Q/2','native_bindings_completed':False,'release':'HOLD'}))


if __name__=='__main__':main()
