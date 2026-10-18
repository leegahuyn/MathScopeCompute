"""현재 세 결함에 (8.26),(8.27)의 같은 원본 노름을 적용하는 소비기.

원본 장/기존 증명을 재생성하지 않는다. 양의 상계식과 유리수 지수를 새로
합성하며, 기존 source_norm_result는 같은 소스의 정리 적용 전제로 보존한다.
"""
from __future__ import annotations
import sys,json,hashlib,copy
from pathlib import Path
from fractions import Fraction as Q
from math import comb,factorial
from typing import Any
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'inherited/inherited'
sys.path.insert(0,str(BASE/'code'))
from source_bound_norms import PositiveDAG,NormAlgebra,Bound,SourceError,canonical,digest,dump,natural,exponent
K=Q(1,100000);H0=1-K;TARGET=Q(6,5)

INPUTS={
 'family':'inherited/inherited/sources/normFamily.json',
 'nodes':'inherited/inherited/sources/actual_source_nodes.json',
 'cutoff':'inherited/inherited/sources/cutoff.json',
 'typed':'inherited/inherited/sources/typedSpec.json',
 'logic':'inherited/source_additions/INITIALIZED_MEAN_SOURCE_LOGIC_REVIEW.json',
 'bindings':'inherited/source_additions/INDEPENDENT_SELECTED_SOURCE_BINDINGS.json',
 'packet':'inherited/source_additions/PRESSURE15_ACTUAL_SOURCE_PACKET.json',
 'bump_packet':'source_additions/FIVE_BUMP_ACTUAL_SOURCE_PACKET.json',
 'mean_source':'inherited/inherited/sources/initialMeanCode.mjs',
 'full_mean_source':'source_additions/source-full-mean-equations.mjs',
 'norm_source':'inherited/inherited/sources/normCompositionCode.mjs',
 'family_source':'inherited/inherited/sources/normFamilyCode.mjs',
 'parent_mean':'inherited/evidence/FAST_CUTOFF_MEAN_REPORT.json',
 'temporal_slow':'inherited/inherited/evidence/temporal_slow_change.json',
 'five_slow':'inherited/inherited/evidence/five_slow_change.json',
 'direct0':'inherited/evidence/IBP_DIRECT_A1_m0_p49001.json',
 'direct1':'inherited/evidence/IBP_DIRECT_A1_m1_p49001.json',
 'algebra':'evidence/INDEPENDENT_ALGEBRA.json',
}

def require(ok:bool,message:str)->None:
 if not ok:raise SourceError(message)

def load()->dict:
 lock=json.loads((ROOT/'INPUT_LOCK.json').read_text());out={}
 for name,path in INPUTS.items():
  raw=(ROOT/path).read_bytes();record=lock['files'][name]
  require(record['path']==path and record['sha256']==hashlib.sha256(raw).hexdigest(), '입력 해시 불일치: '+name)
  out[name]=json.loads(raw) if path.endswith('.json') else raw.decode()
 return out

def authenticate(d:dict)->dict:
 f=d['family'];a=f['source']['actualRoots'];source=f['source']['source']
 required={'P':3615055,'Jtheta':3615101,'Jz':3615147}
 retained={'P':3615635,'Jtheta':3615673,'Jz':3615848}
 require(a['initializedDefects']==required and a['retainedRemainderDefects']==retained,'현재 결함/보존 나머지 ID 불일치')
 require(a['freshInputDefects']=={'P':3614334,'Jtheta':3614376,'Jz':3614420},'five 입력에 갱신 전 결함을 사용함')
 require(a['temporalVelocity']=={'beta':1706773,'v':1706624,'gamma':1706782},'temporal 실제 전체 속도 변경')
 require(a['initializedVelocity']=={'beta':3614790,'v':3614791,'gamma':3614792},'초기 finite state 변경')
 require(a['initializedPressure']['value']==3615361 and a['temporalPressure']['value']==3614634,'최신 압력 대신 이전 압력 사용')
 for key in ['temporalPressure','initializedPressure']:
  require(a[key]['allAuxiliaryModesRetained'] and a[key]['cutoffRemainderDeclaredZero'] is False,'압력 cutoff 또는 전체 torus 삭제')
 require(f['family']['source']==source==d['cutoff']['authority']['source'],'서로 다른 파라미터/소스의 합성')
 require(f['family']['scope']['sameSourceNormContinuationBound'],'같은 소스 전 차수 상계 연결이 없음')
 require(d['algebra']['pass'] and len(d['algebra']['checks'])==9 and all(c['exact_zero'] for c in d['algebra']['checks']),'독립 대수 항등식 미확인')
 nodes=copy.deepcopy(d['nodes']['nodes']); overlap=0
 for extra in [d['bindings']['records'],d['packet']['records'],d['bump_packet']['records']]:
  for k,v in extra.items():
   if k in nodes:require(nodes[k]==v,'선택 원본 노드 충돌: '+k);overlap+=1
   else:nodes[k]=v
 for c in f['selectedNodeBindings']:require(nodes[str(c['id'])]==c['node'],'노름 원본 결속 변경')
 for c in d['cutoff']['authority']['bodies']['selectedNodeBindings']:require(nodes[str(c['id'])]==c['node'],'cutoff 원본 결속 변경')
 inc={'beta':3614789,'v':3614767,'gamma':3614771}
 for k,v in inc.items():
  require(nodes[str(a['initializedVelocity'][k])]=={'op':'add','args':[a['temporalVelocity'][k],v]},'실제 증분 합이 다름: '+k)
  n=nodes[str(v)];require(n['op']=='m3_aux_expression_partial' and all(i==0 for i in n['args'][2]),'five 증분 원본 정의 변경')
  require(not set(d['cutoff']['authority']['bodies']['geometry']['Y'])&set(n['args'][1]),'five 증분에 보조 토러스가 존재함')
  definition=d['bump_packet']['definitions'].get(str(-1-n['args'][0]))
  if definition is None:definition=d['packet']['actualDefinitions'].get(str(-1-n['args'][0]))
  require(definition is not None,'five 증분의 실제 함수 정의가 없음')
  body=definition.get('definition',definition)
  require(body['parameters']==n['args'][1] and body['actualDefiningBodyRetained'],'five 원본 함수 인자/정의 없음')
 rows=a['exactFiveRows'];expected_names=['angular-conservation','axial-conservation','radial-pressure-defect','angular-axial-defect','axial-pressure-defect']
 require([x['name'] for x in rows]==expected_names,'five 행 순서 또는 행 삭제')
 require([x['target'] for x in rows]==[0,0,3614717,3614719,3614718],'five 행의 부호/타깃 불일치')
 require([x['value'] for x in rows]==[3614735,3614752,3614740,3614755,3614745],'five 행 값 원본 변경')
 require(nodes[str(rows[0]['weightPower'])]=={'op':'rational','args':['2','1']},'weightPower는 숫자24가 아닌 원본 지수2 노드')
 require(nodes[str(rows[1]['weightPower'])]=={'op':'rational','args':['1','1']},'축 행 지수1 누락')
 require(len(a['fiveCoefficients']['checks'])==5 and all(c['pass'] for c in a['fiveCoefficients']['checks']),'승계한 다섯 선형 행의 정확 검사 누락')
 pot=a['potential'];require(pot['gammaDesired']==inc['gamma'] and pot['deltaBeta']==inc['beta'] and all(c['pass'] for c in pot['checks']),'잠재함수 실현 승계 누락')
 require(pot['originalMeanPatchSupportRetained'] and pot['analyticIntegralReductionUsed'],'잠재함수 지지/전체 모멘트 근거 누락')
 require(a['conservation']['angular']==0 and a['conservation']['axial']==0 and a['conservation']['allCorrectionsRemainDivergenceFree'],'보존 적분/발산 조건 변경')
 # 기존 상계 코드와 초기 mean 생성기는 각자의 실제 보존 장부에 대조한다.
 # recipe.files의 4개 base 파일을 전체 생성기 목록으로 오인하지 않는다.
 prior_lock=json.loads((BASE/'INPUT_LOCK.json').read_text())['sources']
 expected={
  'mean_source':next(x['sha256'] for x in d['cutoff']['authority']['originalSourceFiles'] if x['path'].endswith('/source-global-initial-mean.mjs')),
  'norm_source':prior_lock['normCompositionCode']['sha256'],
  'family_source':prior_lock['normFamilyCode']['sha256'],
  'full_mean_source':next(x['sha256'] for x in json.loads((ROOT/'SOURCE_ADDITIONS_LOCK.json').read_text()) if x['path'].endswith('/source-full-mean-equations.mjs'))}
 matches=[]
 for key,expected_hash in expected.items():
  h=hashlib.sha256(d[key].encode()).hexdigest()
  require(h==expected_hash,'보존된 원래 코드 해시 불일치: '+key)
  matches.append({'input':key,'sha256':h,'matched_recorded_hash':True,
   'record':'현재 v4 추가 입력 장부; 원문식과 새 독립 대수 대조' if key=='full_mean_source' else '이전 동일 소스 상계/생성기 장부'})
 for c in f['certificates']:
  p=c['program'];require(digest(p)==c['graph']['sha256'],'부모 상계 프로그램 해시 변경')
  require(p['savedSourceBinding']['source']==source and p['savedSourceBinding']['actualRoots']==a,'다른 실제 소스에서 가져온 노름')
  PositiveDAG(p['scalarProgram']['nodes'],p['callGraph']['calls'],c['graph']['sha256'])
 return {'schema':'MathScope.CurrentDefectSameSourceApplication/1','source':source,'current_defects':required,'retained_remainders':retained,
  'previous_full_velocity':a['temporalVelocity'],'increment':inc,'updated_velocity':a['initializedVelocity'],
  'fresh_five_targets':a['freshInputDefects'],'latest_pressure':3615361,'fixed_background':a['background'],'fixed_covariance':a['covariance'],
  'geometry':d['cutoff']['authority']['bodies']['geometry'],'same_original_domain':d['typed']['sameOriginalDomain'],'five_rows':rows,'five_checks_inherited':[c['id'] for c in a['fiveCoefficients']['checks']],
  'source_recipe_matches':matches,'overlapping_selected_nodes_matched':overlap,
  'relation':'각 현재 결함은 원문 8.27의 보존된 nonlinear remainder integral과 동일. 다섯 원본 행/정칙성은 승계하고 대수 결합을 새 검사.',
  'old_temporal_gamma_has_A1':True,'five_gamma_equals_desired_by_own_zero_moment':True,'pressure_A0_not_appended_again':True,
  'source_authentication':'이전 고정 소스 인증 승계 + 이번 선택된 정의/증분/행 결속 대조. 원본 전체 재인증으로 표시하지 않는다.',
  'private_WeakMap_recreated':False,'original_1260_proofs_rerun':False,'new_correction_substeps':False}

def compose(program:dict,parent_hash:str,m:int)->dict:
 require(natural(m) and m<=program['request']['order'],'요청 차수에 맞는 같은 소스 부모 상계 증거가 필요함')
 g=PositiveDAG(program['scalarProgram']['nodes'],program['callGraph']['calls'],parent_hash);A=NormAlgebra(g)
 radial=[c for c in g.calls if c['producer']=='radial'];base_radial=radial[0]['id'];fresh_radial=radial[-1]
 B=g.source(base_radial,['geometry','B']);projection=g.source(fresh_radial['id'],['pressureInput',0,'wholeHaarProjectionConstant'])
 ONE=g.q(1);TWO=g.q(2);SQRT2=g.sqrt(TWO)
 def seq(rows,key,n,fields=False):
  require(len(rows)>=n,'필요한 입력 도함수 상계 누락: '+key)
  require(all(row['order']==j for j,row in enumerate(rows[:n])),'미분 차수의 순서/누락 오류')
  return [A.read((row['fields'] if fields else row)[key]) for row in rows[:n]]
 old={k:seq(program['temporalProducts']['rows'],k,m+2,True) for k in ['beta','v','gamma']}
 inc={k:seq(program['fiveProducts']['rows'],k,m+3,True) for k in ['beta','v','gamma']}
 bg={k:seq(program['inputRows']['backgroundRows'],k,m+2) for k in ['b','G']}
 require(all(x.eps==H0 for k in ['v','gamma'] for x in old[k]+inc[k]) and all(x.eps==1+H0 for x in old['beta']+inc['beta']),'초기 원본 H0 지수 전제 변경')
 require(all(x.eps==1 for x in bg['b']) and all(x.eps==0 for x in bg['G']),'원래 국소 base 노름 전제 변경')
 def inv(n):return [A.unit(g.mul(g.q(factorial(j)),g.pow(B,j+1))) for j in range(n)]
 def fast(n):return [A.unit(g.mul(g.q(factorial(j+4)),g.pow(B,j+4)),-K) for j in range(n)]
 def Dr(s,slow=False):
  require(len(s)>=2,'방사 도함수 입력 부족')
  return s[1:] if slow else A.seqadd(s[1:],A.seqscale(A.seqmul(fast(len(s)-1),s[1:]),SQRT2))
 def De(s,e,slow=False):return A.seqadd(Dr(s,slow),A.seqscale(A.seqmul(inv(len(s)-1),s),g.q(e)))
 def Dz(s):return A.seqscale(s[1:],ONE,Q(1))
 def radial_weight(s,power):
  # 출력은 모든 혼합 계수 미분 <=j 상계이므로 고차 R^p row도 0으로 바꾸지 않음.
  w=[A.unit(g.mul(g.q(2**j),g.pow(B,power))) for j in range(len(s))]
  return A.seqmul(w,s)
 mul=A.seqmul;scale=A.seqscale;db,dv,dg=inc['beta'],inc['v'],inc['gamma']
 radial_products={'2b_dbeta':scale(mul(bg['b'],db),TWO),'2old_beta_dbeta':scale(mul(old['beta'],db),TWO),'dbeta_squared':mul(db,db)}
 radial_terms={k:De(v,1,k!='2old_beta_dbeta') for k,v in radial_products.items()}
 axial_products={'b_dgamma':mul(bg['b'],dg),'G_dbeta':mul(bg['G'],db),'old_beta_dgamma':mul(old['beta'],dg),'old_gamma_dbeta':mul(old['gamma'],db),'dbeta_dgamma':mul(db,dg)}
 angular_products={'2old_v_dv':scale(mul(old['v'],dv),TWO),'dv_squared':mul(dv,dv)}
 angular_terms={k:mul(inv(len(v)),v) for k,v in angular_products.items()}
 ddb=Dr(db,True)
 viscous_terms={'Dr_Dr_dbeta':scale(Dr(ddb,True),ONE,Q(1)),
  'Rinv_Dr_dbeta':scale(mul(inv(len(ddb)),ddb),ONE,Q(1)),
  'Dz_Dz_dbeta':scale(db[2:],ONE,Q(3)),
  'Rinv_squared_dbeta':scale(mul(mul(inv(len(db)),inv(len(db))),db),ONE,Q(1))}
 groups={'time':Dz(db),'radial':A.seqadd(*radial_terms.values()),'axial':Dz(A.seqadd(*axial_products.values())),
         'angular':A.seqadd(*angular_terms.values()),'viscous':A.seqadd(*viscous_terms.values())}
 raw_rg=A.seqadd(*groups.values())
 theta_products={'old_gamma_dv':mul(old['gamma'],dv),'old_v_dgamma':mul(old['v'],dg),'dgamma_dv':mul(dg,dv)}
 z_products={'2old_gamma_dgamma':scale(mul(old['gamma'],dg),TWO),'dgamma_squared':mul(dg,dg)}
 theta=radial_weight(A.seqadd(*theta_products.values()),2);zvel=radial_weight(A.seqadd(*z_products.values()),1);rg2=radial_weight(raw_rg,2)
 def whole(b:Bound)->Bound:
  require(b.weight=='zeta','전체 방사 적분에 필요한 지지/경계 가중치 없음')
  require(b.pole<=fresh_radial['request']['pole'],'선택 투영 상수가 입력 극 차수를 흡수하지 못함')
  return Bound(g.mul(projection,b.constant),b.power,0,b.eps,'1')
 rows=[]
 for j in range(m+1):
  pp=whole(raw_rg[j]);jt=whole(theta[j]);zv=whole(zvel[j]);zp=A.scale(whole(rg2[j]),g.q(Q(1,2)));jz=A.add(zv,zp)
  def serial(b):return b.json('pending')
  term_rows={k:serial(s[j]) for k,s in groups.items()}
  rows.append({'order':j,'Rg':serial(raw_rg[j]),'groups':term_rows,
   'radial_terms':{k:serial(s[j]) for k,s in radial_terms.items()},
   'axial_products':{k:serial(s[j]) for k,s in axial_products.items()},
   'angular_terms':{k:serial(s[j]) for k,s in angular_terms.items()},
   'viscous_terms':{k:serial(s[j]) for k,s in viscous_terms.items()},
   'theta_products':{k:serial(s[j]) for k,s in theta_products.items()},
   'z_products':{k:serial(s[j]) for k,s in z_products.items()},
   'defects':{k:serial(b) for k,b in [('P',pp),('Jtheta',jt),('Jz',jz)]},
   'JzParts':{'velocity':serial(zv),'pressure_half_R2Rg':serial(zp)},
   'identity_sign_of_pressure_part':'-1/2','triangle_bound_sign':'positive upper bound, not changed identity',
   'whole_projection_constant_node':projection,'projection_input_pole':fresh_radial['request']['pole'],
   'stored_parent_groups':copy.deepcopy(program['remainder']['rows'][j]['terms']),
   'stored_parent_defects':copy.deepcopy(program['remainder']['rows'][j]['defects'])})
 g.validate();hash_=digest(g.nodes)
 def relabel(x):
  if isinstance(x,dict):
   if x.get('kind')=='source_bound_expression':x['graph']=hash_
   for v in x.values():relabel(v)
  elif isinstance(x,list):
   for v in x:relabel(v)
 relabel(rows)
 g.namespace=hash_
 leaves={}
 for row in rows:
  for k,b in row['defects'].items():
   cl=g.closure(b['constant']['node']);require(all(x['producer']!='initialized' for x in cl['source_leaves']),'현재 결함 자체를 전제로 하는 순환 노름')
   leaves[f'{row["order"]}:{k}']=cl
 return {'schema':'MathScope.FiveDefectNormComposition/1','parent_program_hash':parent_hash,'order':m,'scalar_graph_hash':hash_,
  'scalar_nodes':g.nodes,'call_graph':g.calls,'rows':rows,'constant_closures':leaves,
  'normalization':'고정 Q chart; 모든 혼합 (R,Z,T,Y0,Y1) 계수 미분 <=m. 최종 S 모멘트는 (Z,T) 미분.',
  'operator_change':'five 증분의 보조변수 독립성을 적용: t*= -epsilon partial_T, Dr=partial_R on this increment only',
  'previous_temporal_gamma_used':'actual gamma=desired-A1, not desired alone',
  'support':'원래 잠재함수 지지; bump 사이 구간 포함. 전역 정규화된 Haar와 전체 방사 envelope 적분.',
  'numerical_constants_materialized':False,'same_source_norm_premises_inherited':True,
  'zero_defects_claimed':False,'no_new_cutoff_flatness_proof':True,'no_new_correction_substeps':True}

def all_order_proof()->dict:
 r=H0;k=K
 terms={
  'slow-time':r+2,'radial_2b_dbeta':r+2,'radial_2old_beta_dbeta':2*r+2-k,'radial_dbeta_squared':2*r+2,
  'axial_b_dgamma':r+2,'axial_G_dbeta':r+2,'axial_old_beta_dgamma':2*r+2,'axial_old_gamma_dbeta':2*r+2,'axial_dbeta_dgamma':2*r+2,
  'angular_2v_dv':2*r,'angular_dv_squared':2*r,
  'viscous_radial':r+2,'viscous_axial':r+4,'viscous_cylindrical':r+2,
  'theta_gamma_dv':2*r,'theta_v_dgamma':2*r,'theta_dgamma_dv':2*r,'z_2gamma_dgamma':2*r,'z_dgamma_squared':2*r}
 require(min(terms.values())==2*r and 2*r>TARGET,'초기 지수 판정 실패')
 return {'schema':'MathScope.AllFiniteDefectExponentProof/1','H0':str(r),'kappa_s':str(k),'target':str(TARGET),'result':str(2*r),'exact_margin':str(2*r-TARGET),
  'terms':[{'id':key,'exponent':str(e),'margin_to_2H0':str(e-2*r)} for key,e in terms.items()],
  'quantifiers':'각 임의의 유한 m에서 같은 입력 노름의 충분한 유한 차수를 소비한다. 계수 미분의 차수 m와 무관한 epsilon 지수를 얻는다.',
  'premises':['고정 같은 소스의 all-finite norm continuation: b in M1, G bounded; temporal v,gamma in M_H0, beta in M_(H0+1)',
    '8.25의 같은 새 targets in S_H0; 고정 five map으로 dv,dgamma in M_H0, dbeta in M_(H0+1)',
    'five 증분은 slow; 원래 compact potential와 normalized full-Haar/whole-radial projection',
    '0<epsilon<=1, Sstar>=1, 0<delta<=1, 0<=zeta<=1; 각 source_norm_result가 지정한 노름 상계를 제공'],
  'proof_steps':['각 고정 다중지표에 Leibniz의 유한 binomial convolution을 적용한다.',
    '원래 radialFast의 계수 미분 상계는 차수와 무관하게 epsilon^-kappa_s 하나를 사용한다. slow five 증분의 fast 성분은 항등적으로 0이다.',
    '위 19개 지수 비교 항목은 모든 유한 m에서 동일하다. 각 항은 2H0 이상의 지수를 가진다.',
    '곱의 상수/로그/극 차수는 유한 합/곱으로 생성한다. final radial projection이 유한 극 차수를 원래 Gaussian 가중치에서 흡수한다.',
    '8.27의 정확한 동일성과 0<epsilon<=1에서 지수 약화로 세 현재 결함 in S_(6/5)를 얻는다. 현재 결함을 가정에 다시 넣지 않는다.'],
  'grade':'CONDITIONAL_REFERENCE_APPLICATION_ON_INHERITED_SAME_SOURCE_NORM_PREMISES',
  'new_finite_instantiations':[0,1,2],'all_orders_not_inferred_from_finite_tests':True,'independent_Lean_proof':False,
  'numeric_C_not_required_for_this_class_membership':True}

def build(d:dict)->tuple[dict,dict,dict]:
 binding=authenticate(d);cert=d['family']['certificates'][1];out=compose(cert['program'],cert['graph']['sha256'],2);proof=all_order_proof()
 current=binding['current_defects'];rem=binding['retained_remainders'];rows=[]
 for row in out['rows']:
  for key,b in row['defects'].items():
   require(Q(b['epsilonExponentExact'])==Q(proof['result']),'전 차수 지수표와 유한 상계 불일치')
   rows.append({'name':key,'derivative_order':row['order'],'current_source_id':current[key],'retained_remainder_id':rem[key],
    'bound':b,'target_exponent':str(TARGET),'exponent_margin':proof['exact_margin'],'source_equality':'8.25+8.26+8.27; inherited five-row proof consumed',
    'scope':'동일 원본 입력 노름 전제하의 정량 클래스 적용. 실제 함수 표본값/Lean PASS가 아님.'})
 application={'schema':'MathScope.CurrentDefectNormApplication/1','original_norm_id':'9.8-defects-C0',
  'connection_status':'COMPLETE','grade':proof['grade'],'class_implication':'(P,Jtheta,Jz) in S_(99999/50000) subset S_(6/5)',
  'rows':rows,'all_order_proof':'ALL_ORDER_EXPONENT_PROOF.json','bound_program':'DEFECT_NORM_PROGRAM.json','source_binding':'SOURCE_BINDINGS.json',
  'original_M3_items_newly_completed':[],'M3':'56/64','N6-01':'OPEN; five norm total not complete','N6-02':'PARTIAL; correction substeps deferred',
  'inherited_initial_1260':{'status':'COMPLETE_IN_DECLARED_CURRENT_SOURCE_SCOPE','Guard':0,'Jet':0,'PDE':0,'exact_interval':['0','0'],'rerun':False},
  'all_three_fresh_defects_set_zero':False,'prior_mean_cutoff_results':'reused without recomputation','remote_writes':0,
  'remaining':'원래 wave B0 노름, 나머지 노름의 최종 source-premise/정의역 종합 판정. 현재 출력은 이 세 결함의 같은 소스 정량 적용을 완료함.'}
 return binding,out,{'proof':proof,'application':application}

def main():
 d=load();binding,out,rest=build(d)
 for name,obj in [('SOURCE_BINDINGS',binding),('DEFECT_NORM_PROGRAM',out),('ALL_ORDER_EXPONENT_PROOF',rest['proof']),('CURRENT_DEFECT_APPLICATION',rest['application'])]:dump(ROOT/'evidence'/f'{name}.json',obj)
 print(json.dumps({'source_ids':binding['current_defects'],'output_rows':len(rest['application']['rows']),'epsilon_exponent':rest['proof']['result'],'target_margin':rest['proof']['exact_margin'],'graph_nodes':len(out['scalar_nodes']),'connection_status':'COMPLETE','grade':rest['proof']['grade'],'M3':'56/64'},ensure_ascii=False))
if __name__=='__main__':main()
