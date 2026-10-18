"""고정 초기 source의 nonzero harmonic과 W 노름 소비기.

보존된 동일 소스 노름 생성기의 수치 미실현 상수는 명시적인 참조로 유지한다.
원본 1260 검증, 보정 cycle 또는 운영 페이지를 실행/변경하지 않는다.
"""
from __future__ import annotations
from dataclasses import dataclass, replace
from fractions import Fraction as Q
from pathlib import Path
from math import comb, factorial
import json, hashlib, copy, sys
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'inherited/inherited/inherited'
sys.path.insert(0,str(BASE/'code'))
from source_bound_norms import PositiveDAG, SourceError, exponent, digest, dump, natural
KAPPA=Q(1,100000); ALPHA=Q(1,2); H0=1-KAPPA; TARGET=Q(7,10)
PUBLISHED_LINEAR=1-3*KAPPA
AFFINE_C=32404  # 4+6^4*(1+4*6), Tg=4+sqrt(2)<6

def require(x:bool,msg:str):
    if not x: raise SourceError(msg)

def sha(p:Path)->str: return hashlib.sha256(p.read_bytes()).hexdigest()

INPUTS={
 'primary':'inherited/inherited/inherited/sources/primaryClass.json',
 'family':'inherited/inherited/inherited/sources/normFamily.json',
 'initialized':'inherited/inherited/inherited/sources/initialized.json',
 'nodes':'inherited/inherited/inherited/sources/actual_source_nodes.json',
 'typed':'inherited/inherited/inherited/sources/typedSpec.json',
 'domain':'inherited/inherited/inherited/sources/domain.json',
 'primary_code':'inherited/inherited/inherited/sources/primaryClassCode.mjs',
 'angular_code':'inherited/inherited/inherited/sources/globalAngularCode.mjs',
 'initialized_code':'inherited/inherited/inherited/sources/initializedAngularCode.mjs',
 'prior_defects':'inherited/evidence/CURRENT_DEFECT_APPLICATION.json',
 'prior_mean':'inherited/inherited/evidence/FAST_CUTOFF_MEAN_REPORT.json',
 'norm_code':'inherited/inherited/inherited/sources/normCompositionCode.mjs',
 'angular_application':'inputs/ACTUAL_ANGULAR_PDE_SOURCE_APPLICATION.json',
 'angular_nodes':'inputs/ANGULAR_PDE_SOURCE_V3.json',
 'operator_source':'inputs/source-harmonic-assembly.mjs',
 'primary_application':'inputs/PRIMARY_WAVE_QUANTITATIVE_SOURCE_APPLICATION.json',
}

def load()->dict:
    lock=json.loads((ROOT/'INPUT_LOCK.json').read_text())['files']; out={}
    for key,path in INPUTS.items():
        raw=(ROOT/path).read_bytes()
        require(lock[key]['path']==path and lock[key]['sha256']==hashlib.sha256(raw).hexdigest(),'입력 해시 불일치: '+key)
        out[key]=json.loads(raw) if path.endswith('.json') else raw.decode()
    return out

def authenticate(d:dict)->dict:
    p,f,i=d['primary'],d['family'],d['initialized'];src=f['source']['source'];actual=f['source']['actualRoots']
    for key in ['paperSHA256','parameterExpressionSHA256']:
        require(p['source'][key]==i['source'][key]==src[key],'다른 판본/매개변수 소스')
    require(d['prior_mean']['source']==src,'재사용 평균이 다른 원본')
    # 기존 원본 hash 장부와 선택한 코드/자료만 대조한다. 1260 증명을 재실행하지 않는다.
    original=d['primary_application']['inputBindings']
    for key,old in [('primary','primaryClass'),('family','normFamily'),('initialized','initialized'),('primary_code','primaryClassCode'),('angular_code','globalAngularCode'),('initialized_code','initializedAngularCode'),('norm_code','normCompositionCode')]:
        require(sha(ROOT/INPUTS[key])==original[old]['sha256'],'보존 원본 장부와 해시 다름: '+key)
    require(i['global']['assembledResidual']==[3825348,3825349,3825350],'전체 잔차 참조 ID 변경')
    require(i['application']['residualRoots']==[3825003,3825004,3825005],'파동 증분의 조립 참조 변경')
    require(i['global']['referenceMeanResidual']['conservativeResidual']==[3825343,3825345,3825347],'평균 잔차 참조 변경')
    for c in range(3):
        n=d['nodes']['nodes'][str(3825348+c)]
        require(n=={'op':'add','args':[3825003+c,[3825343,3825345,3825347][c]]},'전체=평균+파동증분 원본 식 변경')
    require(actual['initializedVelocity']=={'beta':3614790,'v':3614791,'gamma':3614792},'초기 실제 평균 속도 변경')
    require(actual['initializedPressure']['value']==3615361 and actual['initializedPressure']['cutoffRemainderDeclaredZero'] is False,'최신 전체 압력/cutoff 누락')
    require(f['family']['scope']['sameSourceNormContinuationBound'],'승계할 동일 원본 노름 생성기 없음')
    program=f['certificates'][1]['program']
    require(digest(program)==f['certificates'][1]['graph']['sha256'],'부모 노름 프로그램 해시 불일치')
    require(program['savedSourceBinding']['source']==src,'부모 노름이 다른 소스')
    require(p['scope']['allFiniteOrdersBySameOriginalNormGenerator'] and p['scope']['actualFullCurlRemainderWOneMinusKappaClassCertified'],'primary/curl 동일 소스 전제 없음')
    require(all(x['pass'] for x in p['checks']),'보존 primary 클래스 검사 실패')
    require(all(x['binding']['pass'] and x['sourceAmplitudeBodyMatches'] and x['sameOriginalTimeCutoff'] for x in p['sourcePulseBindings']),'동차 pulse/실제 cutoff 연결 없음')
    require(i['application']['sourceCoverRows']==81 and i['application']['signedContributions']==162,'81개 box·두 부호 누락')
    require(i['application']['discardedLabelsOrModes']==[] and i['application']['completeYPreimageKept'],'whole torus 또는 mode 삭제')
    require(i['application']['nearestCopiesDifferentiated'] is False,'정수 label/copy를 미분함')
    require(i['reference']['fullOriginalReferenceFieldPulledBack'] and not i['reference']['ownLabelBackgroundIdentityAssumedInstead'],'전체 reference mean을 own-label base로 대체')
    require(set((t['levelDifference'],t['sign']) for t in i['templates'])==set((d,s) for d in range(5) for s in [1,-1]) and len(i['templates'])==10,'10개 lift 중복/누락')
    expected_matrices=[[[1,0],[0,1]],[[3,1],[1,5]],[[10,8],[8,26]],[[38,50],[50,138]],[[164,288],[288,740]]]
    matrix_checks=[]
    for j,mat in enumerate(program['affineProgram']['matrixRows']):
        require([[int(v) for v in row] for row in mat['matrix']]==expected_matrices[j],'고정 정수 cover matrix 변경')
        matrix_checks.append({'difference':j,'matrix':expected_matrices[j],'column_norm':max(sum(abs(expected_matrices[j][r][c]) for r in range(2)) for c in range(2))})
    templates=[]
    for t in i['templates']:
        require(all(c['pass'] for c in t['checks']),'승계한 local source 검사 실패')
        require([r['m'] for r in t['waveRows']]==[1,-1],'복소 conjugate/half pair 누락')
        require([r['m'] for r in t['waveResidual']]==[-2,-1,0,1,2] and [r['m'] for r in t['nonzeroAngularForcing']]==[-2,-1,1,2],'same-label harmonic inventory 변경')
        require(t['update']['discardedModes']==[] and t['update']['newQuadraticRemainderRetained'],'이차 교차항 제거')
        h=t['sourceFrame']['primaryHomogeneousPressure']
        require(not h['pressureOmitted'] and h['homogeneousPrimaryNotForcedInverse'] and h['identity']['pass'],'동차 pressure 또는 moving normal 항 누락')
        require(t['oldFlatResidual']==t['update']['oldFlatResidual'],'old flat residual 삭제')
        require(t['previous'][0]['pressure']['real']==i['reference']['normalizedMeanPressure'],'local mean pressure 변경')
        templates.append({k:copy.deepcopy(t[k]) for k in ['key','sign','levelDifference','phase','k','normal','normalDerivative','principalK','sourceFrame','waveRows','nonzeroAngularForcing','sourcePulseLength','sourceCutoff']})
    require(d['angular_application']['actualAngularPDEConclusions']['allMeanWaveAndSameRowSquareTermsRetained'],'보존 whole-source 교차항 적용 없음')
    require(d['angular_application']['actualAngularPDEConclusions']['allDistinctWaveCrossTensorsAndTheirRequiredDerivativesVanish'],'다른 label 지지 분리 근거 없음')
    # 한 항목의 위조 결론을 다른 source root로 전이하지 않는다.
    node_subset=d['angular_nodes']['records'];matched=0
    for comp,meanid,bgid,root in zip(['r','theta','z'],[3614790,3614791,3614792],[622934,634588,622933],[3677233,3677234,3677235]):
        require(node_subset[str(root)]=={'op':'add','args':[bgid,meanid]},'literal reference mean 정의 변경');matched+=1
    require(node_subset['3677236']=={'op':'add','args':[622935,3615361]},'literal reference pressure 정의 변경');matched+=1
    return {'schema':'MathScope.WaveNormSourceBinding/1','source':src,'inspection_roots':[3825348,3825349,3825350],
       'inspection_root_role':'전체 조립 잔차. Pi_nonzero 후 G-wave와 Gaussian flat tail을 분리해야 W 주장 가능.',
       'wave_increment_roots':[3825003,3825004,3825005],'mean_reference_roots':[3825343,3825345,3825347],
       'current_mean_velocity':actual['initializedVelocity'],'latest_mean_pressure':3615361,
       'templates':templates,'matrix_checks':matrix_checks,'same_original_domain':d['typed']['sameOriginalDomain'],
       'literal_reference_nodes_matched':matched,'source_box_count':81,'signed_source_count':162,
       'retained_modes':[-2,-1,0,1,2],'nonzero_modes':[-2,-1,1,2],'old_1260_rerun':False,'correction_substeps_executed':False,
       'ordinary_derivative_and_equality_evidence':'기존 소스/원본 장부 승계; 이번에 1260 재실행하지 않음',
       'mean_cutoff_and_defect_evidence_reused':[INPUTS['prior_defects'],INPUTS['prior_mean']],
       'source_binding_grade':'SELECTED_SAME_SOURCE_REFERENCE_APPLICATION; private live seals are not recreated'}

@dataclass(frozen=True)
class WB:
    C:int
    log:int
    pole:int
    e:Q
    z:Q=Q(0)
    pulse:int=0
    def serial(self,namespace:str)->dict:
        return {'constant':{'kind':'source_bound_expression','graph':namespace,'node':self.C},'log_power':self.log,'pole':self.pole,
          'epsilon_exponent':str(self.e),'zeta_power':str(self.z),'pulse_power':self.pulse,'numerical_constant':None}

class WA:
    def __init__(self,g:PositiveDAG):self.g=g
    def read(self,b:dict)->WB:
        require(natural(b.get('constant')) and b['constant']<len(self.g.nodes) and natural(b.get('power')) and natural(b.get('pole')),'원래 mean 상계 노드/차수 오류')
        require(b['weight'] in ['1','zeta'] and b.get('gaussian','1')=='1','원래 mean 가중치 오류')
        return WB(b['constant'],b['power'],b['pole'],exponent(b['epsilonExponent']),Q(b['weight']=='zeta'),0)
    def unit(self,C:int,e:Q=Q(0),log:int=0)->WB:return WB(C,log,0,e)
    def add(self,*bs:WB)->WB:
        require(len(bs)>0,'항의 누락')
        return WB(self.g.add(*(b.C for b in bs)),max(b.log for b in bs),max(b.pole for b in bs),min(b.e for b in bs),min(b.z for b in bs),min(b.pulse for b in bs))
    def mul(self,a:WB,b:WB)->WB:return WB(self.g.mul(a.C,b.C),a.log+b.log,a.pole+b.pole,a.e+b.e,a.z+b.z,a.pulse+b.pulse)
    def scale(self,a:WB,c:int,e:Q=Q(0))->WB:return replace(a,C=self.g.mul(c,a.C),e=a.e+e)
    def addseq(self,*ss:list[WB])->list[WB]:return [self.add(*(s[j] for s in ss)) for j in range(min(map(len,ss)))]
    def mulseq(self,a:list[WB],b:list[WB])->list[WB]:return [self.add(*(self.scale(self.mul(a[j],b[m-j]),self.g.q(comb(m,j))) for j in range(m+1))) for m in range(min(len(a),len(b)))]
    def scale_seq(self,s:list[WB],c:int,e:Q=Q(0))->list[WB]:return [self.scale(a,c,e) for a in s]
    def as_wave(self,b:WB)->WB:
        require(b.z>=Q(1,2) and b.pulse>=1,'파동 envelope/지지 가중치 없음')
        return replace(b,z=Q(1,2),pulse=1)

def compose(program:dict,parent_hash:str,order:int=2)->dict:
    require(natural(order) and order+2<len(program['updatedVelocityRows']),'출력 m에 필요한 평균 m+2 상계 누락')
    n=order+3;deg=program['degreeProgram'];require(deg['order']>=order+2,'primary derivative order 부족')
    g=PositiveDAG(program['scalarProgram']['nodes'],program['callGraph']['calls'],parent_hash);A=WA(g)
    pc=next(c['id'] for c in g.calls if c['producer']=='primary');rc=next(c['id'] for c in g.calls if c['producer']=='radial')
    PK=g.source(pc,['bounds','K']); B=g.source(rc,['geometry','B']);one=g.q(1);two=g.q(2)
    geom=g.add(one,PK,B,g.q(AFFINE_C))
    # fixed-label local (xi,v) → common-Y 양쪽 열. S^m 및 상수도 유지한다.
    def mapped(raw:dict,j:int,e:Q)->WB:
        p=raw['power'];return WB(g.mul(g.pow(PK,p),g.q(AFFINE_C**j),g.q(16),g.pow(g.q(4),p+j)),p+j,raw['pole'],e,Q(1,2),1)
    w=deg['weighted'];T=[mapped(w['amplitude'][j],j,ALPHA) for j in range(n)]
    R=[mapped(w['curl'][j],j,1-KAPPA) for j in range(n)]
    PI=[mapped(deg['pressure'][j],j,Q(1)) for j in range(n)]
    # 실제 real-cos/sine 조립은 1/2 conjugate pair다. 상계에서도 1/2 유지.
    half=g.q(Q(1,2));T=A.scale_seq(T,half);R=A.scale_seq(R,half);PI=A.scale_seq(PI,half)
    full=A.addseq(T,R)
    bg={name:[A.read(row[name]) for row in program['inputRows']['backgroundRows'][:n]] for name in ['b','F','G']}
    require(all(b.e==1 for b in bg['b']) and all(b.e==0 for name in ['F','G'] for b in bg[name]),'base exponent 전제 변경')
    mean={name:[A.read(row[name]) for row in program['updatedVelocityRows'][:n]] for name in ['beta','v','gamma']}
    require(all(b.e==H0+(name=='beta') for name,s in mean.items() for b in s),'전체 mean 원본 H0 지수 변경')
    # Reference mean → label chart: |ell_ref-ell_label|<=2. 계수 16*4^(m+log)를 보수적 상수로만 사용.
    for name,seq in mean.items():mean[name]=[A.scale(b,g.mul(g.q(16),g.pow(g.q(4),j+b.log))) for j,b in enumerate(seq)]
    inv=[A.unit(g.mul(g.q(factorial(j)),g.pow(B,j+1))) for j in range(n)]
    radius=[A.unit(g.mul(g.q(2**j),B)) for j in range(n)]
    fast=[A.unit(g.mul(g.q(factorial(j+4)),g.pow(B,j+4)),-KAPPA) for j in range(n)]
    mul=A.mulseq;add=A.addseq;scale=A.scale_seq
    def Dr(s):
        require(len(s)>=2,'Dr input order 부족')
        return add(s[1:],scale(mul(fast,s[1:]),two)) # |vr_0|+|vr_1|<2
    def Dz(s):return scale(s[1:],one,Q(1))
    # normal polynomial jets from same original mixed-Gaussian ledger, not arbitrary magnitudes.
    nr=next(r for r in w['mixed']['rows'] if r['label']=='original n_0')['powers']
    nv=[WB(g.mul(g.pow(PK,nr[j]),g.q(AFFINE_C**j),g.pow(g.q(4),nr[j]+j)),nr[j]+j,0,Q(0)) for j in range(n)]
    # |p|<=R_bound|n_theta(v=0)| and |pz|<=|n_z(v=0)|, label constants.
    carrier=[A.unit(g.mul(g.pow(PK,16),g.add(one,B)),Q(0),16) for _ in range(n)]
    H=mul(carrier,add(bg['F'],bg['G']))
    pulse_coordinate=[A.unit(geom,Q(0),1) for _ in range(n)]
    eik=add(scale(mul(pulse_coordinate,add(H[1:],mul(bg['G'],H[1:]))),one,Q(1)),mul(bg['b'],nv))
    bgV=mul(radius,bg['F']);bgall=add(bg['b'],bgV,bg['G'])
    dFull=Dr(full);zFull=Dz(full)
    # (9.2) 모든 7 그룹과 L_principal(r,0)를 따로 생성.
    slow=add(scale(full[1:],one,Q(1)),mul(bg['b'],dFull),mul(bg['G'],zFull))
    phase=scale(mul(eik,full),two,-Q(1,2)) # k<=2 eps^-1/2 for |m|=1
    base=add(mul(full,bg['b'][1:]),mul(full,Dz(bgall)),mul(mul(bg['b'],inv),full))
    pressure=add(Dr(PI),Dz(PI))
    ampvis=scale(add(Dr(dFull),mul(inv,dFull),Dz(zFull),mul(mul(inv,inv),full)),one,Q(1))
    mixed=scale(mul(nv,add(dFull,zFull)),g.q(4),Q(1,2))
    phase_div=scale(mul(add(Dr(nv),mul(inv,nv),Dz(nv)),full),two,Q(1,2))
    angular_conn=scale(mul(mul(nv,inv),full),g.q(4),Q(1,2))
    # Fast time on r; ci_label<=1 and common direction |vt|_1<2.
    fast_r=scale(R[1:],two)
    shear=add(scale(bg['F'],g.q(4)),mul(radius,bg['F'][1:]),bg['G'][1:])
    principal_r=add(fast_r,mul(shear,R),scale(mul(mul(nv,nv),R),g.q(12))) # eps*k^2<=4 and sum_i n_i^2<=3nmax^2
    groups={'slow_transport':slow,'phase_defect':phase,'base_derivatives_connections':base,'pressure_amplitude_gradient':pressure,
      'viscous_amplitude':ampvis,'viscous_mixed':mixed,'viscous_phase_divergence':phase_div,'viscous_angular_connection':angular_conn,'principal_on_curl':principal_r}
    linear=add(*groups.values())
    # Full same-label a·n is not zero. Use (7.39) exactly; m'/m=1 for m=m'=±1.
    divamp=add(dFull,mul(inv,full),zFull)
    ww_terms={'amplitude_radial':mul(full,dFull),'amplitude_axial':mul(full,zFull),'longitudinal_divergence':mul(divamp,full),'cylindrical_connection':mul(mul(inv,full),full)}
    ww=add(*ww_terms.values())
    meanmax=add(mean['beta'],mean['v'],mean['gamma'])
    wm_terms={'mean_radial_transport':mul(mean['beta'],dFull),'mean_axial_transport':mul(mean['gamma'],zFull),
      'mean_phase_transport':scale(mul(mul(meanmax,nv),full),two,-Q(1,2)),
      'wave_radial_on_mean':mul(full,Dr(meanmax)),'wave_axial_on_mean':mul(full,Dz(meanmax)),
      'both_cylindrical_connections':scale(mul(mul(inv,meanmax),full),two)}
    wm=add(*wm_terms.values())
    rows=[]
    for j in range(order+1):
        lin=A.as_wave(linear[j]); require(lin.e>=PUBLISHED_LINEAR,'전체 선형 상계가 원문 9.1 차수에 못 미침')
        # 원문의 공통 안전 지수를 유지. 더 강한 algebra 경계는 별도 저장.
        lin_reference=replace(lin,e=PUBLISHED_LINEAR)
        bil=A.as_wave(ww[j]); mix=A.as_wave(wm[j]);plus1=A.as_wave(A.add(lin_reference,mix));plus2=bil
        require(plus1.e>=TARGET and plus2.e>=TARGET,'원래 B0 기준 미달')
        rows.append({'order':j,'linear_before_reference_weakening':lin.serial('pending'),'linear':lin_reference.serial('pending'),
          'mean_wave':mix.serial('pending'),'same_label_wave_wave':bil.serial('pending'),
          'own_label_modes':{str(h):v.serial('pending') for h,v in [(-2,plus2),(-1,plus1),(1,plus1),(2,plus2)]},
          'modes':{str(h):A.scale(v,g.mul(g.q(16),g.pow(g.q(4),j+v.log))).serial('pending') for h,v in [(-2,plus2),(-1,plus1),(1,plus1),(2,plus2)]},
          'linear_groups':{k:A.as_wave(s[j]).serial('pending') for k,s in groups.items()},
          'wave_wave_groups':{k:A.as_wave(s[j]).serial('pending') for k,s in ww_terms.items()},
          'mean_wave_groups':{k:A.as_wave(s[j]).serial('pending') for k,s in wm_terms.items()},
          'full_velocity':A.as_wave(full[j]).serial('pending'),'curl':R[j].serial('pending'),
          'mean_input_orders_used':j+1,'primary_input_orders_used':j+2})
    g.validate();gh=digest(g.nodes)
    def relabel(x):
        if isinstance(x,dict):
            if x.get('kind')=='source_bound_expression':x['graph']=gh
            for v in x.values():relabel(v)
        elif isinstance(x,list):
            for v in x:relabel(v)
    relabel(rows);g.namespace=gh
    closures={}
    for row in rows:
        for m,b in row['modes'].items():
            cl=g.closure(b['constant']['node']);require(all(x['producer']!='initialized' for x in cl['source_leaves']),'현재 wave residual을 자기 입력 전제로 사용함')
            closures[f"{row['order']}:{m}"]=cl
    return {'schema':'MathScope.InitialWaveNormProgram/1','parent_program_sha256':parent_hash,'order':order,'rows':rows,
      'constant_graph_sha256':gh,'scalar_nodes':g.nodes,'call_graph':g.calls,'constant_closures':closures,
      'primary_constant_ref':{'call':pc,'path':['bounds','K'],'meaning':'order14 same-source primary generator; numeric value not materialized'},
      'affine_constant':AFFINE_C,'weights':'sqrt(zeta)*P(v), each grouped nonzero harmonic. No envelope is removed.',
      'reference_transform':'고정 reference/label 차이는 별도 bounded affine pullback. integer/copy/carrier를 미분하지 않음. 최종 잔차에 16*4^(m+log)를 추가하며 X와 zeta,delta는 물리적으로 동일하다.',
      'bound_coordinates':'own_label_modes는 전체 common-Y에서 own-label 잔차 계수, modes는 고정 reference chart 잔차 계수 상계. 실제 계수 ID는 own-label이며 전체 root는 reference 조립이다.',
      'grade':'CONDITIONAL_QUANTITATIVE_APPLICATION_ON_INHERITED_SOURCE_NORM_PREMISES','finite_orders_executed':list(range(order+1)),
      'all_orders_inferred_from_tests':False,'numerical_C_materialized':False,'original_private_runtime_rehydrated':False}

def gaussian_binding(primary:dict)->dict:
    b=primary['sourceCurrent']['sourceBand'];recipe=b['bounds']['recipe'];gl=recipe['gaussian']['lower'];Lmin=recipe['input']['lengthRatioLower']
    require(gl==617317 and Lmin==300173,'고정 Gaussian decay 또는 길이 하한이 다름')
    return {'schema':'MathScope.GaussianCutoffSourceBound/1','source':primary['source'],'band_graph':b['graph'],
      'source_P':[f['P'] for f in b['families']],'logP':[f['logP'] for f in b['families']],
      'gaussian_lower':{'namespace':'current','node':gl},'length_ratio_lower':{'namespace':'current','node':Lmin},
      'c_source_expression':{'op':'multiply','args':[{'source_node':gl},{'source_node':Lmin},{'rational':['1','25']}]},
      'cutoff_region':'|v-Ls/2|>=Ls/5','bound':'P(v)<=exp(-gaussianLower*(v-Ls/2)^2/Ls)<=exp(-c*Sstar)',
      'sign':'positive psi_prime*t in L(psi*t,psi*pi), not zero',
      'homogeneous_source':True,'forced_source_f_zero':'only original homogeneous ±1 pulses; no forced inverse run',
      'physical_derivative_contract':{'input':'C*Q^(-M)*Sstar^P*exp(-c*Sstar), c>0, M>=0, integer P>=0',
         'Q':'2^(-ell)','Sstar':'ell^2','q_over_Q':['1/2','2'],
         'output':'<= C_N*q^N for every fixed N>=0',
         'C_N':'C*2^N*(2P/c)^P*exp((M+N)^2/(2c)); (2P/c)^P=1 if P=0',
         'proof':'Split -c*ell^2 into two halves. Complete square with log2<1 for linear term; maximize x^P exp(-cx/2) and discard exp(-P)<=1.',
         'derivative_C_M_P':'source derivatives and normalization determine these per derivative; not numerically materialized here'},
      'absorbed_into_W_or_deleted':False,'final_resolvable_tau_computed':False,'new_source_parameter_choice':False,
      'grade':'SOURCE_BOUND_REFERENCE_FLATNESS_APPLICATION; not a numeric near-T error budget'}

def application(binding:dict,program:dict)->dict:
    rows=[]
    for t in binding['templates']:
        for h in t['nonzeroAngularForcing']:
            m=h['m']
            for j in range(program['order']+1):
                bound=program['rows'][j]['modes'][str(m)]
                for c in range(3):rows.append({'id':f"wave:{t['key']}:m{m}:c{c}:d{j}",'inspection_root':binding['inspection_roots'][c],
                  'template':t['key'],'harmonic':m,'component':c,'derivative_order':j,'actual_coefficient':h['value'][c],
                  'own_label_coefficient_bound':program['rows'][j]['own_label_modes'][str(m)],'supported_part_bound':bound,'target_exponent':str(TARGET),'margin':str(Q(bound['epsilon_exponent'])-TARGET),
                  'flat_part':'Gaussian pulse-cutoff tail for |m|=1; no additive quadratic truncation tail for |m|=2',
                  'not_raw_full_residual_W_assertion':True})
    return {'schema':'MathScope.CurrentInitialWaveApplication/1','rows':rows,'target_id':'9.8-wave-B0','source':binding['source'],
      'decomposition':'Pi_nonzero R_assembled = G_wave + F_pulse, with G_wave in W_(99997/100000); F_pulse retained flat',
      'conditional_wave_connection_complete':True,'unconditional_global_wave_certificate':False,
      'all_finite_order_rule':{'linear':str(PUBLISHED_LINEAR),'mean_wave':str(H0),'same_label_quadratic':str(1-KAPPA),
         'common_wave_exponent':str(PUBLISHED_LINEAR),'margin_to_B0':str(PUBLISHED_LINEAR-TARGET),
         'proof':'Each fixed derivative uses finite Leibniz sums, same-source normal/mean/pulse constants, affine lift factors. Coefficient derivative order changes C/log/pole but not the retained epsilon exponent.',
         'premises_not_eliminated':['same-source all-fixed-order norm continuation','primary homogeneous amplitude/pressure equation and tangency','full curl divergence and original supports','whole reference mean pullback and previous finite-state mean bounds']},
      'm3':{'completed':56,'total':64,'N6-01':'OPEN; final joint original finite-state acceptance not executed','N6-02':'PARTIAL; correction substeps deferred'},
      'baseline':{'original_1260':'INHERITED_COMPLETE','Guard':0,'Jet':0,'PDE':0,'exact_comparison_interval':['0','0'],'recomputed':False},
      'remote_writes':0,'mathematical_grade':program['grade']}

def main():
    d=load();b=authenticate(d);p=d['family']['certificates'][1];w=compose(p['program'],p['graph']['sha256'],2)
    app=application(b,w);tail=gaussian_binding(d['primary'])
    inventory={'schema':'MathScope.InitialHarmonicInventory/1','base_mean_mode':[0],'velocity_modes':[-1,1],
      'ordered_wave_products':[{'left':a,'right':c,'output':a+c,'kind':'mean retained by inherited mean/defect evidence' if a+c==0 else 'same-label nonlinear wave'} for a in [-1,1] for c in [-1,1]],
      'same_label_full_curl_products':['t*t','t*r','r*t','r*r'],'source_boxes':81,'signed_labels':162,'lift_templates':10,
      'nonzero_coefficient_pairs':120,'real_imaginary_scalar_refs':240,'finite_discarded_modes':[],
      'finite_omission_bound':'0 because full finite inventory retained; not an infinite Fourier tail certificate',
      'cross_label_rule':'closed support disjointness incl. derivative flat extensions; not frequency separation'}
    for name,value in [('SOURCE_BINDINGS',b),('WAVE_NORM_PROGRAM',w),('CURRENT_WAVE_APPLICATION',app),('GAUSSIAN_TAIL_CONNECTION',tail),('HARMONIC_INVENTORY',inventory)]:dump(ROOT/'evidence'/f'{name}.json',value)
    print(json.dumps({'bound_rows':len(w['rows']),'application_rows':len(app['rows']),'scalar_nodes':len(w['scalar_nodes']),
      'supported_wave_exponent':str(PUBLISHED_LINEAR),'M3':'56/64','remote_writes':0},ensure_ascii=False))

if __name__=='__main__':main()
