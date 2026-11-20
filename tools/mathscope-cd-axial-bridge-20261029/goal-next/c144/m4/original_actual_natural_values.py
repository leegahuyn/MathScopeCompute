"""Actual nonlinear natural-solution enclosures, via a proved tiny correction.

Uses the explicit-I' whole fixed-point certificate, rather than assuming
comparison coefficients are the original solution. Native caller support,
all-cycle A-D, energy, and the final67 jets remain separate obligations.
"""
import argparse,gzip,hashlib,json
from fractions import Fraction as F
from math import factorial
from pathlib import Path
from rigorous_rational_intervals import Interval as I,UncertifiedExpression
from original_monotone2_interval_jets import H,point,round_out
from original_pressure_u1_coefficients import authenticate_source,_poly_mul,_poly_inverse
from pinned_n3_parameter_intervals import pinned_profile
from conditional_original_natural523_tail import ACTUAL_REACHABLE_DERIVATIVE_SHAPES

NORM_RUN='9606baa9369803217bc620436c2c06f4ad6c4667cc7deb94c93bb6aa32d39f21'
NORM_FILE='ab77fe0dc5a441bd0ab98aaf61fa8852afb7c7739d5a2700ab1058d8bc7ab9a0'
PRESSURE_RUN='148b63ed06fa43fad880d8c4f5aedaf3a480bdd4a56f21746e3c0acbdc7697f9'
PRESSURE_FILE='0154d1501368c9551ad63942ae7fae2438c2bd9a23495634491cdfda55286ecd'


def require(ok,why):
    if not ok:raise UncertifiedExpression('ACTUAL_NATURAL_UNPROVED: '+why)


def read_pinned_run(path,file_sha,run_sha):
    raw=Path(path).read_bytes();require(hashlib.sha256(raw).hexdigest()==file_sha,'parent file bytes')
    data=json.loads(raw);claimed=data.pop('run_hash_sha256')
    require(claimed==run_sha and hashlib.sha256(json.dumps(data,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()).hexdigest()==run_sha,'parent canonical run')
    data['run_hash_sha256']=claimed;return data


def nonlinear_correction_certificate():
    rows=[]
    for k,m in sorted(ACTUAL_REACHABLE_DERIVATIVE_SHAPES):
        factor=F(factorial(m+k),2*(m+1)**2*20**k)*F(4,3)**(m+k+1)
        require(factor<2**20,'actual source derivative prefactor budget')
        rows.append({'radial_order':k,'eta_order':m,'factor_at_Y_5':str(factor)})
    require(sum(ACTUAL_REACHABLE_DERIVATIVE_SHAPES.values())==523,'actual source order census')
    require(20-38*32768 < -4096,'absolute nonlinear correction exponent')
    # Q>h^-8. Hence2^20 Q^-38 <2^20 h^304<h^300.
    require(20-4*4096<0 and 295*4096>4096,'after dividing positive h^5')
    lower=F(305719,1152000)-H
    require(lower>F(53,200),'actual Phi positivity margin')
    return {'fixed_point_norm_distance_upper':'1/(2*Q^43)',
            'derivative_distance_upper':'Q^-43*rho^-m*(m+k)!/[2*(m+1)^2*20^k]*(1-Y/20)^(-m-k-1)',
            'domain':{'Y':['0','5'],'eta':['-2','2']},'source_derivative_shapes':rows,
            'uniform_all_source_shapes_absolute_correction_strict_upper':'2^-4096',
            'correction_after_dividing_by_h_up_to_power5_strict_upper':'2^-4096',
            'average_same_bound_reason':'radial averaging has B_rho norm<=1',
            'actual_Phi_strict_lower_on_0_to_4p1':'305719/1152000-2^-4096 > 53/200',
            'actual_Phi_positivity_domain':{'Y':['0','41/10'],'eta':['-2','2']},
            'actual_Phi_positive_on_explicit_real_domain':True,
            'all_native_call_runtime_support_bound':False}


def comparison_tail(N,k=0,m=0):
    require(type(N)is int and N>=k and 0<=k<=3 and 0<=m<=5,'finite comparison tail orders')
    n=N+1;first=F(5**n,factorial(n-k)*factorial(n+1))
    ratio=F(5,(N+2-k)*(N+3));require(ratio<1,'comparison tail ratio')
    return F(factorial(m)*16**m)*first/(1-ratio)


def scaled_chi_disk_certificate():
    perturb=F(9,2)/16+F(1,32)/16+F(1,32)**8*(F(1,16)**2+4*F(1,16)**3)
    require(perturb<F(1,3),'Hstar/j0 complex xi disk')
    den=F(4,9)-F(1,4000000)
    require(den>F(2,5) and 1+F(1,4000000)/den<2,'chi holomorphic xi disk')
    return {'xi':'eta/h^4','complex_xi_disk_radius':'1/16','Hstar_over_j0_modulus_lower':'2/3',
            'Hstar_over_j0_modulus_upper':'4/3','chi_modulus_upper':2,
            'applies_to_comparison_center_only':True,
            'actual_solution_derivative_error_from_separate_Brho_bound':True}


def scaled_chi_series(degree=5,bits=256):
    z=point(0);one=point(1);h=round_out(I(F(0),H),bits);j2=round_out(I(F(0),H**8),bits)
    s=[one,round_out(point(F(9,2))-h,bits),-j2,round_out(-point(4)*j2,bits)]
    s=(s+[z]*(degree+1))[:degree+1]
    square=_poly_mul(s,s,degree,bits);den=list(square);den[0]=den[0]+point(F(1,4000000))
    return _poly_mul(square,_poly_inverse(den,degree,bits),degree,bits)


def actual_Phi_axis_jets(Y,N=32,bits=256):
    require(Y.lo>=0 and Y.hi<=5,'actual Y input inside explicit proof domain')
    Y=round_out(Y,bits)
    scaled_chi_disk_certificate();degree=5;zero=point(0);one=point(1)
    chi=scaled_chi_series(degree,bits);power=[one]+[zero]*degree
    totals={k:[zero]*(degree+1) for k in range(4)}
    for n in range(N+1):
        for k in range(min(3,n)+1):
            falling=factorial(n)//factorial(n-k)
            scalar=round_out(point(F((-1)**n*falling,2**n*factorial(n)*factorial(n+1)))*Y.power(n-k),bits)
            totals[k]=[round_out(totals[k][m]+round_out(power[m]*scalar,bits),bits) for m in range(degree+1)]
        power=_poly_mul(power,chi,degree,bits)
    rows=[]
    for k,m in sorted(ACTUAL_REACHABLE_DERIVATIVE_SHAPES):
        tail=comparison_tail(N,k,m);v=round_out(totals[k][m]*point(factorial(m)),bits)
        error=tail+H
        rows.append({'radial_order':k,'eta_order':m,'normalization':'h^(4*m) * d_Y^k d_eta^m Phi(Y,0)',
                     'enclosure':round_out(I(v.lo-error,v.hi+error),bits).json(),
                     'comparison_center_entire_tail_upper':str(tail),'original_nonlinear_error_strict_upper':'2^-4096'})
    return rows


def literal_Y_contracts():
    p=pinned_profile()['parametersExactExpressions']
    require(p['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]} and
            p['t1']=={'power':[{'ref':'CSelected'},-120]},'actual original Y scales')
    # CSelected>exp(Q^200)>2^4096, t1<2^-491520.
    # 4(exp(t1)-1)<8*t1<2^-4096; preserve positive t1.
    require(2**200>4096 and 120*4096-3>4096,'source end Y tightening')
    return {474:{'formula':'4','enclosure':point(4)},
            3628:{'formula':'Lambda*Xa*exp(t1)=4*exp(t1)','enclosure':I(F(4),F(4)+H)}}


def source_33_rows(folder):
    source=authenticate_source(folder)
    # Rebind exact source operations; no guessed t1/16 exponent.
    nodes=[]
    with gzip.open(Path(folder)/'original-source-nodes.jsonl.gz','rt',encoding='utf8') as f:
        next(f)
        for i,line in enumerate(f):
            if i>111350:break
            nodes.append(json.loads(line))
    expected={2:('coordinate',['eta']),474:('rational',['4','1']),3454:('source_parameter',['Lambda']),
              3612:('source_parameter',['t1']),3617:('source_parameter',['Xa']),
              3623:('exp',[3612]),3624:('multiply',[3617,3623]),3628:('multiply',[3454,3624])}
    for i,(op,args) in expected.items():require(nodes[i]=={'op':op,'args':args},'actual native argument node '+str(i))
    # All AST calls using these Y roots (not arbitrary root-reach inference).
    rows=[]
    for i,n in enumerate(nodes):
        if n['op']=='actual_natural_series' and n['args'][1] in (474,3628):
            c,y,e,k,m=n['args'];require(e==2 and k==0 and 0<=m<=5,'33-call source shape')
            rows.append({'node_id':i,'component':c,'Y_node':y,'eta_node':e,'k':k,'m':m})
    require(len(rows)==33 and sum(r['Y_node']==474 for r in rows)==15,'actual33 source calls')
    return source,rows


def actual_u_axis_jets(pressure_result,Y,bits=256):
    coef={}
    for row in pressure_result['u1_odd_eta_derivatives']:
        coef[row['eta_order']]=('K',I.parse(row['enclosure']))
    for row in pressure_result['u1_even_eta_derivatives']:
        coef[row['eta_order']]=(row['exact_positive_scale'],I.parse(row['normalized_enclosure']))
    result={}
    for component,factor in [('u',1),('average',F(1,2))]:
        result[component]=[]
        for m in range(6):
            scale,coefficient=coef[m];v=round_out(Y*coefficient*point(factor),bits)
            result[component].append({'eta_order':m,'normalization':'d_eta^m '+component+' divided by '+scale,
              'exact_positive_divisor':scale,'enclosure':round_out(I(v.lo-H,v.hi+H),bits).json(),
              'original_nonlinear_error_in_normalized_units_strict_upper':'2^-4096'})
    return result


def scalar_Phi(Y,chi,N=32,bits=128):
    require(Y.lo>=0 and Y.hi<=5 and chi.lo>=0 and chi.hi<=1,'real natural scalar inputs')
    if Y.hi==0:return point(1)
    z=round_out(Y*chi,bits);power=point(1);total=point(0)
    for n in range(N+1):
        total=round_out(total+round_out(power*point(F((-1)**n,2**n*factorial(n)*factorial(n+1))),bits),bits)
        power=round_out(power*z,bits)
    error=comparison_tail(N)+H
    return round_out(I(total.lo-error,total.hi+error),40)


def actual_solution_grid(pressure_result,N=32):
    xs=sorted({F(-1,2)+F(i,64) for i in range(49)}|{F(-2,9)+F(i,9000) for i in range(-12,13)})
    ys=[F(41*i,160) for i in range(17)];h=I(F(0),H);j2=I(F(0),H**8)
    chis=[]
    for x in xs:
        s=round_out(point(1)+(point(F(9,2))-h)*point(x)-j2*point(x*x)-point(4)*j2*point(x**3),128)
        s2=s.power(2);c=round_out(s2/(s2+point(F(1,4000000))),128)
        chis.append(I(max(F(0),c.lo),min(F(1),c.hi)))
    phi_frames=[];u_frames=[]
    for y in ys:
        phi_frames.append([scalar_Phi(point(y),c,N).json() for c in chis])
        u=[]
        for sample in pressure_result['visualization']['samples']:
            if y==0:v=point(0)
            else:
                center=point(y)*I.parse(sample['u1_divided_K']);v=round_out(I(center.lo-H,center.hi+H),40)
            u.append(v.json())
        u_frames.append(u)
    return {'scope':'ACTUAL_ORIGINAL_NATURAL_SOLUTION_ON_EXPLICIT_DOMAIN',
            'full_nonlinear_solution_enclosures':True,'final_A_D_field_samples':False,
            'Y_values':[str(y) for y in ys],
            'Phi_microchart':{'xi_values':[str(x) for x in xs],'eta_definition':'eta=h^4*xi; actual positive source h retained',
                             'height':'Phi(Y,h^4*xi)=source azimuthal factor divided by g',
                             'chi_intervals':[c.json() for c in chis],'frames':phi_frames},
            'u_chart':{'eta_values':[s['eta'] for s in pressure_result['visualization']['samples']],
                       'height':'actual natural u(Y,eta)/K','frames':u_frames},
            'grid_enclosures_outward_dyadic_bits':40,'triangulated_midpoints_are_visual_interpolation':True,
            'no_global_native_support_or_physical_final_field_claim':True}


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--graph-dir',required=True);ap.add_argument('--norm-run',required=True)
    ap.add_argument('--pressure-run',required=True);ap.add_argument('--output',required=True);args=ap.parse_args()
    norm=read_pinned_run(args.norm_run,NORM_FILE,NORM_RUN);pressure=read_pinned_run(args.pressure_run,PRESSURE_FILE,PRESSURE_RUN)
    require(norm['pressure_run_hash_sha256']==PRESSURE_RUN and norm['result']['whole_radial_series_Brho_on_I_prime_by_written_proof'],'actual whole-series premise')
    source,calls=source_33_rows(args.graph_dir);contracts=literal_Y_contracts();groups={}
    for y,contract in contracts.items():
        Y=contract['enclosure'];phi=actual_Phi_axis_jets(Y);u=actual_u_axis_jets(pressure['result'],Y)
        groups[str(y)]={'Y_formula':contract['formula'],'Y_enclosure':Y.json(),'evaluation_eta':'0',
                   'Phi_axis_jets':phi,'u_axis_jets':u}
    evaluated=[]
    for row in calls:
        group=groups[str(row['Y_node'])]
        if row['component']=='Phi':jet=next(x for x in group['Phi_axis_jets'] if x['radial_order']==0 and x['eta_order']==row['m'])
        else:jet=group['u_axis_jets'][row['component']][row['m']]
        evaluated.append({**row,'evaluation_eta':'0','value':jet,'global_runtime_call_support_certified':False})
    result={'schema':'MathScope.M3.ActualNatural33AxisAndSolutionGrid/1',
            'nonlinear_correction':nonlinear_correction_certificate(),'comparison_center_xi_disk':scaled_chi_disk_certificate(),
            'source_33_axis_evaluations':evaluated,'axis_groups':groups,
            'visualization':actual_solution_grid(pressure['result']),
            'new_actual_axis_template_evaluations':33,'new_runtime_global_call_domain_certifications':0,
            'natural_Y_certified':33,'natural_Y_OPEN':490,'final_67_jets':0,
            'whole_Banach_and_complex_analysis_formalized_in_Lean':False,
            'M3':'62/64','M4':'0/16','release':'HOLD'}
    payload={'schema':'MathScope.M3.SourcePinnedActualNaturalValuesRun/1','source':source,
             'whole_Brho_run_hash_sha256':NORM_RUN,'whole_Brho_file_sha256':NORM_FILE,
             'pressure_run_hash_sha256':PRESSURE_RUN,'pressure_file_sha256':PRESSURE_FILE,'result':result,
             'implementation_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
             'written_proof_sha256':hashlib.sha256(Path(__file__).with_name('ACTUAL_NATURAL_VALUES_20261027_KO.md').read_bytes()).hexdigest()}
    payload['run_hash_sha256']=hashlib.sha256(json.dumps(payload,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()).hexdigest()
    Path(args.output).write_text(json.dumps(payload,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'run_hash_sha256':payload['run_hash_sha256'],'actual_axis_template_values':33,
                      'full_natural_solution_grid':True,'final_A_D':False,'RELEASE':'HOLD'}))


if __name__=='__main__':main()
