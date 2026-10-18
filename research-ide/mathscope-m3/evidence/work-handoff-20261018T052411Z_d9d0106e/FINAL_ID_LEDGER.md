# 원래 8개 최종 판정

M3: **62/64**. 이번에 CLOSED 6개. 초기1260/1260은 원래 초기 구성 범위에서 별도로 승계한다.

| ID | 판정 | 근거/잔여 의무 |
|---|---|---|
| N6-01 | CLOSED | 원래 j=0 초기 상태의 공동 조건 완료 |
| N6-02 | CLOSED | 필수 실제 canonical finite cycle의 네 poststep 인수 완료 |
| N6-07 | CLOSED | 같은 실제 재귀 상태의 공통 도메인·전차수 상계 구성 완료 |
| N6-08 | CLOSED | 같은 실제 potential cutoff 합과 명시적 구간·tail 완료 |
| N7-04 | CLOSED | 동일한 전체 localized force의 terminal jets 수학적 구성 완료 |
| N7-05 | CLOSED | 같은 실제 jets의 정수 schedule·모든 차수 접합 완료 |
| N7-06 | OPEN | 실제장의 분석적 에너지 동일성은 연결; 필수 수치 세분화 미완료 |
| N8-05 | OPEN | 실제 전역장의 네 축 수치 evaluator·비교표 미완료 |

## N6-01 — CLOSED

□ N6-01 | 초기 finite state 구성
primary curls 뒤 temporal mean update와 다섯 moment correction을 수행하여 j=0 상태를 만든다. 합격: Proposition9.5
의 B0=0.7,C0*=1.2와 (9.9),(9.10) 명세를 충족한다. 명세의 상수 없이 경험적 power slope만으로 인증하지 않는다.

**실제 대상:** 속도3825006/3825007/3825008, 전체압력3825009, 최종mean압력3615361 및 잔차3825348/3825349/3825350에 동일 source identity로 결합.

**판정:** 원래 j=0 초기 상태의 공동 조건 완료

**검증:** 공동 적용 검사 exit0, 두 잘못된 source 대조 거부; 독립 검토 2개가 동일 SHA를 승인. 유한 검사 수에서 전차수 정리를 외삽하지 않음.

**범위:** 새 전역장 수치평가를 수행했다는 판정이 아님.

**남은 원래 의무:** 없음. 수치 구현 범위는 위에 별도 표시.

증거: `work/theorem_connection/evidence/N601_JOINT_SOURCE_APPLICATION.json`, `work/theorem_connection/N601_JOINT_PROOF.md`

## N6-02 — CLOSED

□ N6-02 | 전체 residual 재계산
R(u+δu,p+δp)=R(u,p)+Lu(δu,δp)+div(δu⊗δu)를 사용하며 매 substep 후 최신 압력을 복원한다. 합격: 독립 직접 PDE
평가와 decomposed residual이 오차 예산 내 일치한다. 기존 flat tail와 새 quadratic remainder를 장부에서 누락하지 않
는다.

**실제 대상:** genuine original forced private state에서 signed→temporal→fresh-five로 연결. 각 최신 전체 압력 root는4159969,4191026,4309421,4311541이며 실행 고유 graph에 속한다.

**판정:** 필수 실제 canonical finite cycle의 네 poststep 인수 완료

**검증:** 실제 전체 finite cycle EXIT0,1700.657초,4,312,220 nodes.12 exact comparisons/9 omission controls. 독립 source 검토46개 및 두번째 원문/정의역 검토. 기존355.34초 pre-temporal 실행은 별도 보존.

**범위:** 하나의 실제 필수 유한 canonical cycle이다. 무한literal실행을 요구하지 않으며 전역장 수치평가·N7-06/N8-05 인수와 구분한다.

**남은 원래 의무:** 없음. 수치 구현 범위는 위에 별도 표시.

증거: `work/n602_continuation/ACTUAL_FINITE_CYCLE_RECEIPT.json`, `work/n602_continuation/ACTUAL_PROCESS.json`, `work/n602_continuation/FINITE_CYCLE_RESULT.json`, `work/n602_continuation/DOMAIN_AND_SOURCE_SCOPE.md`

## N6-07 — CLOSED

□ N6-07 | 고정 도메인과 차수 향상
σj=1/5+j/10, gj=hj/10 및 (9.17),(9.18)의 Km,ℓm,log powers를 추적한다. 합격: 모든 finite stage가 같은 q<qbig 도메
인을 사용한다. 단 한 번의 step에서 샘플 잔차가 늘면 정밀도/범위/상수부터 조사하고 차수 theorem과 혼동하지 않는다.

**실제 대상:** 같은 초기 tuple에서 forced→pressure→signed→pressure→temporal→pressure→fresh-five→pressure를 모든 finite j에 정의. 모든 생성 harmonic과 conjugate 및 원래 potential을 보존.

**판정:** 같은 실제 재귀 상태의 공통 도메인·전차수 상계 구성 완료

**검증:** 원래 정리 적용과 source-functional graph,42개 affine 지수 관계 및 잘못된 현재 상태 대조를 검토. 독립 검토2개 승인.

**범위:** 정확한 수학적 함수·상수 구성이다. 모든 실제 상수의 수치값이나 실행 가능한 최종장 수치 evaluator를 제공한 것은 아니다.

**남은 원래 의무:** 없음. 수치 구현 범위는 위에 별도 표시.

증거: `work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json`, `work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json`, `work/remaining_chain/PROOF_APPLICATION.md`

## N6-08 — CLOSED

□ N6-08 | 최종 local 합성
(9.21)에서 Aj,Bj,pj에 shrinking cutoff를 적용하고 curl하여 local field를 만든다. finite residual의 flat terms를 무조건 합
산하지 않는다. 합격: Lemma5.4의 tail 비교로 (9.20)을 연결한다. 평가 구간의 active indices와 생략 tail의 bound를 저장
하고 없으면 finite-stage approximation으로 제한한다.
패키지 판정:

**실제 대상:** 원래 potential gauge를 고정하고 cutoff를 potential에 적용한 뒤 curl. cutoff 상계는 a>=1 전체에 대한 supremum을 먼저 정의하여 a_j 선택과의 순환 의존을 제거.

**판정:** 같은 실제 potential cutoff 합과 명시적 구간·tail 완료

**검증:** 정확한 source-dependent symbolic 구간과 전체 전차수 비교 증명에 대해 독립 검토2개 승인.

**범위:** 구간 끝점은 정확한 source 식으로 저장했다. decimal endpoint나 그 구간의 수치 field 평가 완료를 주장하지 않는다.

**남은 원래 의무:** 없음. 수치 구현 범위는 위에 별도 표시.

증거: `work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json`, `work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json`, `work/remaining_chain/PROOF_APPLICATION.md`

## N7-04 — CLOSED

□ N7-04 | Terminal force jets
Fj(x)=lim(t↑1)∂t^j f(x,t), ∂x^ αFj(0)=0을 (10.6)-(10.10)에 맞춰 구축한다. 합격: 유한 jet order M의 수치 근사와 ∀order
smooth-extension 정리의 의존성을 분리한다. 몇 개 finite differences가 작다는 이유로 C∞ force라 표시하지 않는다.

**실제 대상:** f=R(curl(c*A)+c*B*e_theta,c*p_loc)에서 실제 F_j를 uniform terminal limit로 정의. source localization qbig가 위 domain과 일치.

**판정:** 동일한 전체 localized force의 terminal jets 수학적 구성 완료

**검증:** 같은 최종 함수에 대한 세 영역의 분석적 연결을 두 독립 검토자가 승인.

**범위:** 유한 수치 jet 근사와 wholeK norm의 수치값은 계산하지 않았다. 표본 최대값을 norm 상계로 사용하지 않았다.

**남은 원래 의무:** 없음. 수치 구현 범위는 위에 별도 표시.

증거: `work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json`, `work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json`, `work/remaining_chain/PROOF_APPLICATION.md`

## N7-05 — CLOSED

□ N7-05 | t>1 force extension
(10.11)의 Σχ0(bjσ)σ^jFj/j!, σ=t−1≥0를 사용하며 (10.12)의 differentiated tail constraints로 bj를 선택한다. 합격:
force는 t≤2에서 compact support를 갖고 모든 인증된 jets가 접합된다. 이는 velocity를 t=1 이후 smooth하게 연장하는
알고리즘이 아니다.

**실제 대상:** N_(j,a)=||F_j||_C^a(K)는 위 실제 force에서 완전히 정의된 유한 norm. b0=1 이후 모든 a+m<=floor(j/2)를 만족하는 최소 정수 b_j>b_(j-1)를 선택.

**판정:** 같은 실제 jets의 정수 schedule·모든 차수 접합 완료

**검증:** 정의된 actual norm과 실제 jets를 대상으로 한 원래 정리 적용을 독립 검토2개 승인.

**범위:** 실제 b_j의 decimal/integer 출력 목록은 평가하지 않았다. 과거 hardcoded5,11,22,43,86,172는 actual schedule이 아니다.

**남은 원래 의무:** 없음. 수치 구현 범위는 위에 별도 표시.

증거: `work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json`, `work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json`, `work/remaining_chain/PROOF_APPLICATION.md`

## N7-06 — OPEN

□ N7-06 | 전역 에너지 balance
d(∥u∥²₂/2)/dt+ν∥∇u∥²₂=⟨f,u⟩를 전체 K에서 적분한다. core만의 에너지와 구분한다. 합격: 정규화 energy defect가
독립 space/time refinement에서 감소한다. ν=1에서 (10.13)의 ∥u(t)∥² ₂+2∫∥∇u∥²₂≤(∫∥f∥₂)² 상계와 모순 없어야
한다.

**실제 대상:** 전체 compact K의 실제 u,f에 적분부분법 에너지 동일성과nu=1 상계를 적용. 모델의 energy 결과는 별도.

**판정:** 실제장의 분석적 에너지 동일성은 연결; 필수 수치 세분화 미완료

**검증:** 통합 회귀17개 PASS. 수정 모델 defect 약2.54313e-7(256,128). 실제 전역장 세분화 표는 없다. 추가 실제 core7평가와3축독립2배 표, 실제10angulartemplate의473node 에너지식, 동일header22packet의92,722records 결합을 실행했다. 최종globalfield는 아니다.

**범위:** 모델 수정 성공을 실제 global energy 수치 인증으로 승격하지 않음.

**남은 원래 의무:** 정의한 실제 최종장/force와 cutoff selector의 검증 가능한 수치 evaluator 및 quadrature/tail 상계를 구현해야 한다. 전체K에서 공간·시간 축을 독립 세분화한 정규화 energy defect 감소 표와10.13 상계 비교를 저장해야 한다. 실제 계수 closure의 미확보 scalar records700개/native 수치 kernel 경계138개를 연결해야 한다. 원래 직접 Picard 충분조건 K>2^121045와 carrier>2^4107bits는 해당 literal계산법의 budget장애이며 다른 알고리즘의 불가능성 주장은 아니다.

증거: `work/integrated_verifier/evidence/INTEGRATION_RUN_RECEIPT.json`, `work/derivative_fix/evidence/EXECUTION_RECEIPT.json`, `work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json`, `work/actual_evaluator/evidence/EXECUTION_RECEIPT.json`, `work/actual_evaluator/README.md`, `work/actual_evaluator_sources/CONSTRUCTIVE_ROUTE.md`

## N8-05 — OPEN

□ N8-05 | 공간·급수·정밀도 적응
core radius, axial length, pulse wavelength, active cutoff orders를 함께 해결한다. 각 refinement 축을 독립 증가시킨
다. 합격: 2배 grid, Fourier cutoff, coefficient order, arithmetic precision 비교표와 별도 tail bound를 저장한다. 예산
초과 시 last-resolved τ와 원인을 표시한다.

**실제 대상:** 대상은 위의 같은 global field. 모델 fixture의 tau는 제외하고 actual last-resolved tau=null을 유지.

**판정:** 실제 전역장의 네 축 수치 evaluator·비교표 미완료

**검증:** 모델/실제 scope 회귀 통과. 실제4축2배 비교는 실행되지 않았다. 추가 실제 core7평가와3축독립2배 표, 실제10angulartemplate의473node 에너지식, 동일header22packet의92,722records 결합을 실행했다. 최종globalfield는 아니다.

**범위:** actual_last_resolved_tau=null; model_last_resolved_tau와 혼합하지 않음.

**남은 원래 의무:** source-specific 상수/selector와 실제 field를 수치 평가하는 구현이 필요하다. 현재 exact supremum/최소 선택 정의는 수학적 구성이며 효과적인 수치 알고리즘이 아니다. 같은 actual tau에서 grid/Fourier/coefficient order/arithmetic precision을 각각2배 비교하고 독립 tail 및 중단 원인을 저장해야 한다. 실제 계수 closure의 미확보 scalar records700개/native 수치 kernel 경계138개를 연결해야 한다. 원래 직접 Picard 충분조건 K>2^121045와 carrier>2^4107bits는 해당 literal계산법의 budget장애이며 다른 알고리즘의 불가능성 주장은 아니다.

증거: `work/integrated_verifier/evidence/INTEGRATION_RUN_RECEIPT.json`, `work/remaining_chain/evidence/ACTUAL_REMAINING_CHAIN_APPLICATION.json`, `work/actual_evaluator/evidence/EXECUTION_RECEIPT.json`, `work/actual_evaluator/README.md`, `work/actual_evaluator_sources/CONSTRUCTIVE_ROUTE.md`
