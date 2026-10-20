"""같은 초기 소스의 빠른 시간 소거, IBP cutoff, 느린 변화 상계 합성.

원본 PDE/Guard/Jet 재증명이나 보류한 보정 substep 실행기가 아니다.
저장된 상계의 정확한 참조와 유리수 지수를 소비한다. 미실현 상수는 숫자가 아니다.
"""
from __future__ import annotations
import hashlib, json, sys
from pathlib import Path
from fractions import Fraction as Q
from math import comb, factorial
from typing import Any
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'inherited'/'code'))
from source_bound_norms import PositiveDAG, NormAlgebra, Bound, canonical, digest, dump, SourceError
K = Q(1,100000)

class BridgeError(ValueError):
    pass

def require(test: bool, message: str) -> None:
    if not test:
        raise BridgeError(message)

def integer(value: Any, minimum: int = 0) -> int:
    require(type(value) is int and value >= minimum, '차수는 지정 범위의 정수여야 합니다.')
    return value

def qobj(q: Q) -> dict:
    return {'numerator':str(q.numerator), 'denominator':str(q.denominator)}

def read_inputs(root: Path = ROOT) -> dict:
    lock = json.loads((root/'BRIDGE_INPUT_LOCK.json').read_text())
    data = {}
    for name, row in lock['inputs'].items():
        path = root/row['path']
        require(path.resolve().is_relative_to(root.resolve()), '패키지 밖 입력 경로')
        raw = path.read_bytes()
        require(len(raw)==row['bytes'] and hashlib.sha256(raw).hexdigest()==row['sha256'], '입력 해시 불일치: '+name)
        data[name] = json.loads(raw) if path.suffix=='.json' else raw.decode('utf-8')
    return data

def coefficient_sum(nodes: dict, root: int) -> list[int]:
    n = nodes.get(str(root))
    require(n is not None, f'저장된 원본 노드가 없습니다: {root}')
    return sum((coefficient_sum(nodes,r) for r in n['args']),[]) if n['op']=='add' else [root]

def factors(nodes: dict, root: int) -> list[int]:
    n = nodes.get(str(root))
    require(n is not None, f'저장된 원본 노드가 없습니다: {root}')
    return sum((factors(nodes,r) for r in n['args']),[]) if n['op']=='multiply' else [root]

def validate_sources(data: dict) -> dict:
    cutoff=data['cutoff']; authority=cutoff['authority']; family=data['family']
    src=authority['source']; roots=authority['actualRoots']; bodies=authority['bodies']
    nodes=dict(data['nodes']['nodes']); matches=0
    for name in ['selected','packet']:
        for node,record in data[name]['records'].items():
            if node in nodes:
                require(nodes[node]==record,'동일 ID의 원본 정의 불일치: '+node)
                matches+=1
            else:nodes[node]=record
    hp=data['haar']['fixture']['actual']['certificate']
    require(digest(hp['program'])==hp['graph']['sha256'],'Haar 인증서 해시 불일치')
    require(hp['program']['source']==src==family['source']['source'],'서로 다른 초기 소스 결합')
    require(family['source']['actualRoots']==roots,'최신 초기 상태 ID 불일치')
    require(roots['initializedPressure']['value']==3615361,'최신 전체 압력은 3615361이어야 합니다.')
    require(roots['temporalPressure']['value']==3614634,'temporal 압력 매핑 불일치')
    for c in family['certificates']:
        require(digest(c['program'])==c['graph']['sha256'],'부모 노름 프로그램 해시 불일치')
    parents={c['graph']['sha256']:c['program'] for c in family['certificates']}
    for stage in ['temporal','five']:
        s=data[stage]
        require(s['stage']==stage and s['parent_program_hash'] in parents,'slow_change 부모/단계 불일치')
        require(digest(s['scalar_nodes'])==s['new_graph_hash'],'slow_change 상수 DAG 변조')
        require(s['pressure_difference_retained'] and s['variable_radial_viscosity_retained'] and s['flux_terms_retained']==19,'느린 변화에서 압력·점성·곱항 누락')
        require(not s['fast_time_cancellation_applied'] and not s['cutoff_declared_zero'],'이미 소거한 항을 중복 소거하려는 입력')
        require(s['call_graph']==parents[s['parent_program_hash']]['callGraph']['calls'],'부모 생성기 변경')
    require(data['temporal']['parent_program_hash']==data['five']['parent_program_hash'],'두 변화 상계의 부모가 다릅니다.')
    for row in bodies['selectedNodeBindings']:
        require(nodes.get(str(row['id']))==row['node'],'cutoff 원본 ID 결속 불일치')
    t=bodies['temporal']; g=bodies['geometry']
    for field,key in [('theta','actualGamma0Definition'),('z','actualGamma1Definition')]:
        d=t[field+'Definition']; actual=data['packet'][key]
        require(d==actual['definition'],'원본 Fourier 역연산자 정의 변경')
        require(digest(d)==actual['definitionSHA256'],'역연산자 정의 SHA 불일치')
        require(d['operator']=='(sqrt(2)-1)*partial_y0+partial_y1' and d['Y']==g['Y'],'빠른 시간 방향/토러스 변경')
        require(d['zeroMode']=='The exact normalized Haar mean is projected out.' and d['finiteSumDeclaredEqualToLimit'] is False,'zero mode 또는 전체 Fourier 극한 누락')
        require(d['directions']==[g['R'],g['Z'],g['T'],*g['Y']],'미분 좌표 순서 불일치')
    require(sorted(factors(nodes,t['velocity']['v']))==sorted([20,t['thetaRoot'],g['ciInverse']]),'Delta v의 -ci^-1 N^-1 인자 불일치')
    require(sorted(factors(nodes,t['gammaDesired']))==sorted([20,t['zRoot'],g['ciInverse']]),'gamma_d의 부호 또는 배율 오류')
    require(nodes[str(g['ciInverse'])]=={'op':'inverse','args':[g['ci']]},'ci 역원 ID 오류')
    require(sorted(factors(nodes,t['A1']))==sorted(factors(nodes,623135)+factors(nodes,g['chiR'])+factors(nodes,t['whole'])),'A1의 R^-1, cutoff 미분, 전체 적분 누락')
    require(nodes['623135']=={'op':'inverse','args':[g['R']]},'R 역원 오류')
    require(sorted(coefficient_sum(nodes,t['velocity']['gamma']))==sorted([t['psiR'],1706779,1706781]),'전체 gamma의 방사/토러스/연결항 누락')
    require(sorted(factors(nodes,1706779))==sorted(factors(nodes,g['radialFast'])+factors(nodes,1706778)),'원래 fast radial 계수 누락')
    require(coefficient_sum(nodes,1706778)==[t['psiY'][0],1706777],'토러스 도함수 둘 중 하나 누락')
    require(sorted(factors(nodes,1706777))==sorted([623066,t['psiY'][1]]),'원래 v_r 방향 변경')
    require(nodes[str(t['whole'])]['args'][2:]==[g['innerRadius'],g['outerRadius']],'전체 원본 적분 구간 변경')
    require(nodes[str(t['left'])]['args']==[t['integrand'],t['radialVariable'],g['innerRadius'],g['R']],'prefix 적분 끝점 변경')
    for field,inc in [('beta',3614789),('v',3614767),('gamma',3614771)]:
        require(nodes[str(roots['initializedVelocity'][field])]=={'op':'add','args':[t['velocity'][field],inc]},'초기 five 증분의 실제 합성 ID 불일치')
        params=nodes[str(inc)]['args'][1]
        require(not set(g['Y']) & set(params),'five 증분에 보조 토러스 변수가 있습니다.')
        definition=data['packet']['actualDefinitions'][str(-1-nodes[str(inc)]['args'][0])]['definition']
        require(params==definition['parameters'] and definition['actualDefiningBodyRetained'],'five 공유함수의 실제 정의/인자 변경')
    require(roots['conservation']['exactTemporalZeroMeanSource']=={'theta':0,'z':0},'temporal zero Haar 기록 누락')
    require(roots['exactFiveRows'][1]['name']=='axial-conservation' and roots['exactFiveRows'][1]['target']==0,'five 축 보존 모멘트가 0이 아님')
    require(all(c['pass'] for c in roots['potential']['checks']) and roots['potential']['gammaDesired']==3614771,'five 실제 potential 동일성 승계 근거 누락')
    for p in bodies['pressureRows']:
        require(not roots['initializedPressure']['cutoffRemainderDeclaredZero'] and roots['initializedPressure']['allAuxiliaryModesRetained'],'압력 나머지/토러스 제거')
        require(sorted(coefficient_sum(nodes,p['centeredSource']))==sorted([p['gr'],3614422 if p['stage']=='temporal' else 3615149]),'압력 중심화 원본 변경')
        require(p['integrals']['originalRadialPrimitive']==g['radialPrimitive'],'압력/속도에 서로 다른 방사 위상 사용')
    norm=bodies['normalization']
    require(nodes[str(norm['rho'])]=={'op':'multiply','args':[norm['unnormalized'],norm['massInverse']]},'rho 정규화 원본 변경')
    require(nodes[str(norm['massInverse'])]=={'op':'inverse','args':[norm['mass']]},'rho의 질량 역원 변경')
    require(authority['phase']['fixedReferenceBandHeldDuringCoefficientDifferentiation'] and not authority['phase']['newCommonQThresholdIntroduced'],'고정 band 또는 정의역 변경')
    return {'source':src,'geometry':g,'raw_initial_mean_sources':{'Etheta':t['thetaDefinition']['body'],'Ez':t['zDefinition']['body']},
       'final_mean_sources':{'Etheta':3614976,'Ez':3615392},'temporal_velocity':t['velocity'],
       'five_increment':{'beta':3614789,'v':3614767,'gamma':3614771},'A1':t['A1'],
       'pressure_sources':{'initial_Haar_only':633758,'post_temporal_full':3614634,'initialized_full':3615361},
       'pressure_path_note':'초기 Haar pressure root와 전체 pressure를 구별한다. 실제 L의 전체 압력 차이는 부모 initialPressure/postPressure/updatedPressure 경로에 결속된다.',
       'selected_overlap_comparisons':matches,'source_body_bindings_pass':True,
       'old_1260_proofs_rerun':False,'old_five_identity_proof':'승계; 원본 증분 ID와 인자만 새 대조',
       'weakmap_private_authority_recreated':False}

def compose_haar(parent:dict, parent_hash:str, order:int) -> dict:
    """기존 all-finite 생성기의 같은 부모 입력으로 Haar 상계의 작은 추가 차수만 합성."""
    integer(order);require(order<=parent['request']['order'],'Haar 입력 차수 부족')
    g=PositiveDAG(parent['scalarProgram']['nodes'],parent['callGraph']['calls'],parent_hash);a=NormAlgebra(g)
    calls={c['producer']:c['id'] for c in g.calls};rad=next(c['id'] for c in g.calls if c['producer']=='radial');B=g.source(rad,['geometry','B'])
    rs={key:[] for key in ['remainder','covariance','higher','pressure']}
    for j in range(order+2):
        rem=parent['degreeProgram']['covarianceRemainder'][j];lead=parent['degreeProgram']['primaryCovariance'][j]
        rs['remainder'].append(Bound(g.source(calls['primary'],['bounds','haarRows',j,'fields','covarianceRemainder','constant']),rem['power'],rem['pole'],2-2*K,'zeta'))
        rs['covariance'].append(Bound(g.source(calls['primary'],['bounds','haarRows',j,'fields','fullCovariance','constant']),max(lead['power'],rem['power'])+1,max(lead['pole'],rem['pole']),Q(1),'zeta'))
        rs['higher'].append(Bound(g.source(calls['background'],['rows',j,'higherStress','constant']),0,3+3*j,Q(3),'zeta'))
        rs['pressure'].append(a.read(parent['initialPressure'][j]['pressure']))
    rows=[]
    for j in range(order+1):
        row={'order':j,'fields':{}}
        for field,c in [('Etheta',2),('Ez',1)]:
            terms=[rs['remainder'][j+1],rs['higher'][j+1]]
            for key in ['remainder','higher']:
                for k in range(j+1):
                    const=g.mul(g.q(c*comb(j,k)*factorial(k)),g.pow(B,k+1))
                    terms.append(a.scale(rs[key][j-k],const))
            terms.append(a.scale(rs['covariance'][j+1],g.q(1),Q(1)))
            if field=='Ez':terms.append(a.scale(rs['pressure'][j+1],g.q(1),Q(1)))
            row['fields'][field]=a.add(*terms).json('pending')
        rows.append(row)
    g.validate();graph_hash=digest(g.nodes)
    for row in rows:
        for v in row['fields'].values():v['constant']['graph']=graph_hash
    return {'schema':'MathScope.SourceBoundHaarExtension/1','parent_program_hash':parent_hash,'order':order,'new_graph_hash':graph_hash,
        'scalar_nodes':g.nodes,'call_graph':g.calls,'rows':rows,'actual_source_field_changed':False,
        'role':'정확한 Haar 상계식 합성; 입력 상계의 참조를 소비, 상수의 수치화 아님',
        'higher_stress_retained':True,'complete_pressure_derivative_retained':True,'all_original_partitions_inherited':True}

class Typed:
    def __init__(self):self.nodes=[]
    def emit(self,t,op,args):
        n={'type':t,'op':op,'args':args};self.nodes.append(n);return len(self.nodes)-1
    def result(self,t,c,path):return self.emit(t,'source_result',[c,path])
    def mul(self,*a):return self.emit('scalar','multiply',list(a))
    def max(self,*a):return self.emit('natural','maximum',list(a))
    def add(self,*a):return self.emit('natural','add',list(a))

def minimum_ibp(target:Q) -> int:
    require(isinstance(target,Q),'정확한 유리수 목표 지수 필요')
    gap=(target-(1-K))/K
    return max(1,-(-gap.numerator//gap.denominator))

def ibp_program(authority:dict, m:int, p:int) -> dict:
    integer(m);integer(p,1);u=m+2*p+3;g=Typed()
    def field(path):return {key:g.result(t,0,path+[key]) for key,t in [('constant','scalar'),('power','natural'),('pole','natural')]}
    desired=field(['temporalProducts','extended',u,'gammaDesired']);fast=field(['temporalProducts','extended',u+1,'gammaDesired'])
    post=field(['freshProducts','rows',u,'gr']);init=field(['fullUpdatedMean','rows',u,'gr'])
    tp=g.max(desired['pole'],fast['pole']);pp=g.max(post['pole'],init['pole'])
    pressure=g.result('scalar',2,['pressureRows',m,'cutoffRemainders',p-1,'constant']);gain=g.emit('natural','natural',[str(p)])
    def radial(order):return g.result('scalar',1,['rows',1,'orders',order,'remainderRows',p-1,'constant'])
    def output(name,src,b,c,pole,extra=None):
        root=g.mul(c,b['constant']) if extra is None else g.mul(extra,c,b['constant'])
        return {'name':name,'source':src,'order':m,'constant':root,'power':g.add(b['power'],gain),'pole':pole,
           'epsilonExponent':qobj(1-K+p*K),'weight':'zeta','gaussian':'1','inputNorm':dict(b),
           'completeSourceDerivativeOrder':u+1 if name=='fastA1' else u,'positiveIBPOrder':p,
           'sourceOnlyConstantAndNaturalMetadata':True,'cutoffDeclaredZero':False}
    bodies=authority['bodies'];out={}
    out['A1']=output('A1',{'actualNode':bodies['temporal']['A1']},desired,radial(m),tp)
    r=radial(m+1);two=g.emit('scalar','rational',['2','1']);sqrt2=g.emit('scalar','sqrt_positive',[two])
    out['fastA1']=output('fastA1',{'operation':'ci0*N*(-A1)','ci':bodies['geometry']['ci'],'A1':bodies['temporal']['A1'],'N':'(sqrt(2)-1)*partial_Y0+partial_Y1'},fast,r,tp,sqrt2)
    out['postTemporalA0']=output('postTemporalA0',{'actualNode':bodies['pressureRows'][0]['A0']},post,pressure,pp)
    out['initializedA0']=output('initializedA0',{'actualNode':bodies['pressureRows'][1]['A0']},init,pressure,pp)
    return {'schema':'MathScope.CheckedSourceIBPInstantiation/1','request':{'order':m,'ibpOrder':p},'source':authority['source'],
      'scalarProgram':{'nodes':g.nodes},'outputs':out,
      'calls':[{'id':0,'producer':'initialized','request':{'order':u},'dependencies':[]},
        {'id':1,'producer':'radial','request':{'order':m+1,'ibpOrder':p,'pole':{'naturalNode':tp}},'dependencies':[0]},
        {'id':2,'producer':'radial','request':{'order':m,'ibpOrder':p,'pole':{'naturalNode':pp}},'dependencies':[0]}],
      'derivative_demand':{'A_e_input_order':u,'fast_A1_desired_input_order':u+1,'fast_A1_initial_Ez_order':u+5},
      'numeric_constants_materialized':False,'upstream_high_order_program_executed':False,
      'mathematical_basis':'같은 소스의 기존 Lemma 8.2 positive-IBP 재귀를 유한 (m,p)에 대입; 노드 ID를 상수값으로 사용하지 않음'}

def verify_ibp_program(p:dict,authority:dict) -> None:
    expected=ibp_program(authority,p['request']['order'],p['request']['ibpOrder'])
    for key in ['scalarProgram','outputs','calls','derivative_demand','source']:
        require(p[key]==expected[key], 'IBP 표현 또는 미분 차수 누락: '+key)
    for i,n in enumerate(p['scalarProgram']['nodes']):
        if n['op'] in ['add','maximum','multiply','sqrt_positive']:
            require(all(type(k) is int and 0<=k<i for k in n['args']),'IBP DAG 미래 참조')
            require(all(p['scalarProgram']['nodes'][k]['type']==n['type'] for k in n['args']),'자연수 차수/상수 표현 타입 혼동')

def source_ibp_equivalence(data:dict)->list:
    out=[]
    for cert in data['cutoff']['certificates']:
        saved=cert['program'];require(digest(saved)==cert['graph']['sha256'],'저장 IBP 그래프 SHA 오류')
        p=ibp_program(data['cutoff']['authority'],saved['request']['order'],saved['request']['ibpOrder'])
        require(p['scalarProgram']['nodes']==saved['scalarProgram']['nodes'],'새 IBP 구성기와 기존 식 불일치')
        require(p['outputs']==saved['outputs'],'새 IBP 결과의 원본 selector/정량 지수 불일치')
        require(p['source']==saved['source'],'IBP 소스 변경')
        out.append({'request':p['request'],'typed_nodes':len(p['scalarProgram']['nodes']),'exact_saved_expression_match':True,'saved_program_hash':cert['graph']['sha256']})
    return out

def direct_cutoff_program(authority:dict, m:int, p:int) -> dict:
    """-ci N A1 gamma_d = A1(E0_z - Haar E0_z)를 먼저 사용한 더 짧은 상계.

    N A1=A1 N 및 A1 ci^-1=ci^-1 A1인 같은 고정 chart만 허용한다.
    초기 Ez의 중심화는 norm에 factor 2를 남긴다. 고차 source 결과를 실행하지 않는다.
    """
    integer(m);integer(p,1);u=m+2*p+3;g=Typed()
    source={key:g.result(t,0,['initialResidualRows',u,'fields','Ez',key])
      for key,t in [('constant','scalar'),('power','natural'),('pole','natural')]}
    kernel=g.result('scalar',1,['rows',1,'orders',m,'remainderRows',p-1,'constant'])
    two=g.emit('scalar','rational',['2','1']);C=g.mul(two,kernel,source['constant'])
    gain=g.emit('natural','natural',[str(p)]);power=g.add(source['power'],gain)
    t=authority['bodies']['temporal']
    return {'schema':'MathScope.DirectCommutedAxialCutoff/1','request':{'order':m,'ibpOrder':p},
      'source':authority['source'],'scalarProgram':{'nodes':g.nodes},
      'calls':[{'id':0,'producer':'initialized','request':{'order':u},'dependencies':[],
                'note':'고정 소스의 초기 residual selector만 소비. 부모 생성기 호출은 지연됨.'},
        {'id':1,'producer':'radial','request':{'order':m,'ibpOrder':p,'pole':{'naturalNode':source['pole']}},'dependencies':[0]}],
      'output':{'constant':C,'power':power,'pole':source['pole'],
         'epsilonExponent':qobj(1-K+p*K),'weight':'zeta','gaussian':'1',
         'source_expression':{'operator':'A1','argument':{'operator':'Id-minus-normalized-Haar','body':t['zDefinition']['body']}},
         'sign_in_residual':1,'identical_original_term':{'operator':'-ci*N(A1(gamma_d))','A1':t['A1'],'gamma_d':t['gammaDesired']},
         'centering_norm_factor':2,'cutoffDeclaredZero':False},
      'derivative_demand':{'initial_Ez_order':u,'old_fast_inverse_route_Ez_order':u+5,'saved_source_derivative_orders':5},
      'required_equalities':['N A1 = A1 N','A1(ci^-1 F) = ci^-1 A1(F)','N N^-1 E = E-Haar(E)'],
      'regularity_used':'동일 원본의 매끄러운 shell 지지·torus 주기 확장, 모든 유한 계수 차수; 균일 p 추정은 요구하지 않음',
      'numeric_constants_materialized':False,'upstream_high_order_program_executed':False}

def verify_direct_program(program:dict,authority:dict)->None:
    expected=direct_cutoff_program(authority,program['request']['order'],program['request']['ibpOrder'])
    require(program==expected,'직접 cutoff의 부호·중심화·차수·원본 참조가 변경됨')

def expression_sum(terms:list[dict])->dict:
    require(bool(terms),'빈 상계 합 불허')
    require(all(t['weight']=='zeta' for t in terms),'서로 다른 가중치의 무인증 합')
    return {'constant':{'op':'add','args':[t['constant'] for t in terms]},
        'power':{'op':'maximum','args':[t['power'] for t in terms]},
        'pole':{'op':'maximum','args':[t['pole'] for t in terms]},
        'epsilonExponentExact':str(min(Q(t['epsilonExponentExact']) for t in terms)),
        'weight':'zeta','gaussian':'1','numerical_constant':None}

def all_order_slow_lemma() -> dict:
    """유한 차수 m 임의의 일반 Leibniz/고정 좌표 연산에 대한 지수 증명."""
    alpha=1-K;radial=alpha+1
    groups={'slow_time':alpha+1,
      'radial_linear':min(Q(1)+alpha,radial)-K,
      'radial_old_cross':radial+alpha-K,
      'radial_quadratic':radial+alpha-K,
      'axial_linear':alpha+1,'axial_cross_and_quadratic':2*alpha+1,
      'complete_pressure_difference':alpha+1,'viscous_Dr2':alpha+1-2*K,
      'viscous_RinvDr':alpha+1-K,'viscous_Dz2':alpha+3,'viscous_cylindrical_connection':alpha+1}
    require(min(groups.values())==2-3*K,'일반 느린 변화 지수 합성 실패')
    return {'quantifier':'모든 유한 계수 미분 차수 m; 같은 고정 band와 정의역',
      'premises':{'base_b':'M1','base_V_G':'M0; 원래 느린 배경','increments_v_gamma':'M(1-kappa_s)','increments_beta':'M(2-kappa_s)',
          'old_v_gamma':'0 또는 M(1-kappa_s)','old_beta':'0 또는 M(2-kappa_s)','full_pressure_difference':'M(1-kappa_s)'},
      'explicit_operator_rules':{'Dr':'각 명시 연산 1회당 kappa_s 손실; 추가 계수미분은 상수/로그/극 차수에 반영','Dz':'epsilon 이득','slowTime':'-epsilon partial_T','laplacian':'가변 Dr를 두 번 합성; 계수 미분항 유지'},
      'group_exponents':{k:str(v) for k,v in groups.items()},'conclusion_exponent':str(2-3*K),
      'bound_construction':'완전 Leibniz 합의 계수 binomial(m,k); C는 유한 합/곱, b,d는 유한 합/최대. 실제 노름 selector를 그대로 사용.',
      'scope':'지정된 입력 클래스 상계에 대한 일반 합성 정리. 입력 클래스의 독립 증명이나 원본 전체 M3 완료가 아님.'}

def symbolic_identities() -> dict:
    import sympy as s
    E,H,LT,LF,c,NA=s.symbols('E H LT LF c NA',commutative=True)
    theta=s.expand(E-(E-H)+LT+LF-(H+LT+LF))
    axial=s.expand(E-(E-H)-c*NA+LT+LF-(H+LT+LF-c*NA))
    # Endpoint/phase cancellation for T1, without treating a cutoff as zero.
    f,Lft,J,LJ,a,chi,chip,R=s.symbols('f Lft J LJ a chi chip R',commutative=True,nonzero=True)
    partial_n=R*f-a*Lft-chip*J+chi*a*LJ
    phase_n=a*(Lft-chi*LJ)
    ftc=s.expand((partial_n+phase_n)/R-(f-chip*J/R))
    P,rhoMass=s.symbols('P rhoMass')
    centered=s.expand((P-rhoMass*P).subs(rhoMass,1))
    return {'schema':'MathScope.FastTimeSymbolicIdentities/1',
      'theta_telescoping':str(theta),'axial_telescoping':str(axial),'T1_endpoint_phase_cutoff':str(ftc),'pressure_Haar_moment':str(centered),
      'all_zero':all(v==0 for v in [theta,axial,ftc,centered]),
      'commuted_cutoff_identity':{'before':'-ci*N(A1(gamma_d))','after':'A1(E0_z-Haar(E0_z))','sign':1,
        'proof_steps':['gamma_d=-ci^-1*N^-1(E0_z)','N commutes with translated radial integrals and torus-independent cutoff','ci is constant in radial/Y variables in the fixed common chart','N*N^-1(E0_z)=E0_z-Haar(E0_z)'],
        'slow_derivatives_commuted':False,'cutoff_discarded':False},
      'signed_final_formula':{'Etheta':'Haar(E0_theta) + slowTemporal_theta + slowFive_theta',
        'Ez':'Haar(E0_z) + slowTemporal_z + slowFive_z - ci*N(A1(gamma_d))'},
      'initial_sources_are_not_zero':True,'cutoff_A1_is_not_declared_zero':True,
      'five_fast_terms':{'N_delta_v':'0','N_delta_gamma':'0','basis':'보조 토러스 독립성과 승계된 정확한 축 모멘트'},
      'proof_basis':'일반 유한 대수 항등식 + 원문 8.7/8.19/8.22의 동일 원본 적용. 원본 PDE 재계산 아님.'}

def build(data:dict) -> dict:
    bindings=validate_sources(data);ibp_matches=source_ibp_equivalence(data);identities=symbolic_identities()
    require(identities['all_zero'],'빠른 소거 항등식 실패')
    ph=data['temporal']['parent_program_hash'];parent=next(c['program'] for c in data['family']['certificates'] if c['graph']['sha256']==ph)
    haar=compose_haar(parent,ph,1)
    authority=data['cutoff']['authority'];cutoffs=[ibp_program(authority,m,49001) for m in range(2)]
    for c in cutoffs:verify_ibp_program(c,authority)
    rows=[]
    for m in range(2):
        ibp=cutoffs[m];graph=digest(ibp['scalarProgram']['nodes']);c=ibp['outputs']['fastA1'];exp=Q(int(c['epsilonExponent']['numerator']),int(c['epsilonExponent']['denominator']))
        fast={'constant':{'kind':'typed_source_bound_expression','graph':graph,'node':c['constant']},
              'power':{'kind':'typed_source_natural','graph':graph,'node':c['power']},
              'pole':{'kind':'typed_source_natural','graph':graph,'node':c['pole']},
              'epsilonExponentExact':str(exp),'weight':'zeta','source':c['source'],'sign_in_residual':-1}
        for name in ['Etheta','Ez']:
            parts=[haar['rows'][m]['fields'][name],data['temporal']['rows'][m]['fields'][name],data['five']['rows'][m]['fields'][name]]
            term_names=['initial_Haar','temporal_slow_change','five_slow_change']
            if name=='Ez':parts.append(fast);term_names.append('negative_fast_A1')
            bound=expression_sum(parts)
            rows.append({'order':m,'field':name,'actual_final_source_id':bindings['final_mean_sources'][name],
              'terms':dict(zip(term_names,parts)),'composed_bound':bound,
              'margin_over_6_5':str(Q(bound['epsilonExponentExact'])-Q(6,5)),
              'mathematical_status':'CONDITIONAL_SOURCE_BOUND_ESTIMATE','new_complete_original_norm':False,
              'premise':'기존 소스 노름 생성기가 명시한 모든 입력 상계가 같은 원본에서 성립한다는 조건; 소수값 출력은 요구하지 않음'})
    return {'bindings':bindings,'ibp_matches':ibp_matches,'identities':identities,'haar':haar,'cutoffs':cutoffs,
      'direct_cutoffs':[direct_cutoff_program(authority,m,49001) for m in range(2)],
      'report':{'schema':'MathScope.M3.InitialMeanFastCutoffBridge/1','task':'temporal/five slow_change에 빠른 시간 소거와 cutoff 증거 연결',
       'source':bindings['source'],'rows':rows,'all_order_slow_lemma':all_order_slow_lemma(),
       'direct_cutoff_improvement':{'identity':'-ci N A1 gamma_d = +A1(E0_z-Haar(E0_z))','old_initial_Ez_order':'m+98010','direct_initial_Ez_order':'m+98005','source_derivative_orders_saved':5,'numeric_runtime_speedup_measured':False},
       'minimum_positive_ibp':{'target_6_5':minimum_ibp(Q(6,5)),'target_149_100':minimum_ibp(Q(149,100))},
       'connections_completed':['동일 원본 8.22 빠른 소거와 전체 T1','N-A1 교환 후 원본 초기 Ez에 대한 직접 cutoff 연결','초기 temporal→five 망원 합성','A1 부호·전체 torus·양의 IBP 상계','두 최신 압력 A0 중심화/영 Haar 모멘트','m=0,1 실제 상계 표현 합성'],
       'remaining_source_norm_premises':['원본 primary/배경 노름 생성기의 입력 상계 및 전칭 적용은 기존 same-source norm continuation을 참조한다. 이번 연결기의 독립 증명으로 승격하지 않음.',
           'source_norm_result의 상수/로그/극 차수는 지정된 생성기의 값 또는 정리 적용으로 소비해야 함. 98,000차 도함수 배열 전체 출력을 새 조건으로 요구하지 않음.'],
       'new_original_norm_ids_fully_closed':[],
       'inherited':{'original_1260':'COMPLETE_IN_DECLARED_CURRENT_SOURCE_SCOPE','Guard':0,'Jet':0,'PDE':0,'exact_difference_interval':['0','0'],'M3':'56/64','N6-01':'OPEN','N6-02':'PARTIAL; correction substeps deferred'},
       'old_proofs_rerun':False,'correction_substeps_rerun':False,'remote_writes':0,'new_lean_kernel_proof':False}}

def main() -> None:
    data=read_inputs();r=build(data)
    outputs={'SOURCE_BINDINGS.json':r['bindings'],'FAST_TIME_IDENTITIES.json':r['identities'],
      'IBP_TEMPLATE_COMPARISON.json':r['ibp_matches'],'INITIAL_HAAR_M0_M1.json':r['haar'],
      'FAST_CUTOFF_MEAN_REPORT.json':r['report']}
    for m,c in enumerate(r['cutoffs']):outputs[f'IBP_FAST_A1_m{m}_p49001.json']=c
    for m,c in enumerate(r['direct_cutoffs']):
        verify_direct_program(c,data['cutoff']['authority'])
        outputs[f'IBP_DIRECT_A1_m{m}_p49001.json']=c
    for name,content in outputs.items():dump(ROOT/'evidence'/name,content)
    print(json.dumps({'written_outputs':len(outputs),'IBP_matches':len(r['ibp_matches']),
      'composed_rows':len(r['report']['rows']),'row_exponents':[(x['field'],x['order'],x['composed_bound']['epsilonExponentExact']) for x in r['report']['rows']],
      'M3':'56/64','new_complete_original_norms':0,'remote_writes':0},ensure_ascii=False))

if __name__=='__main__':main()
