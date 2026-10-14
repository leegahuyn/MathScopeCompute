# N6 연결 중단 후 실제 연구·코딩·클라우드 검증 결과

**개별 정의역·매끄러움 의무를 추가로 해결했고, 전체 N6-01/N6-02의 무조건부 인증은 아직 미완료다.**
기호적 8/8과 cloud job success를 unconditional mathematical proof로 승격하지 않았다.

## 정확한 시작점과 최종 연구 실행

복구한 PR #28 HEAD는 `ba87dc9c09567c9a486d424ffb3e63a7eb04a12d`, 브랜치는
`mathscope-m3-mean-equivalence-20261014`, base는 PR #27의
`5422e232219a5de4722ac4e38ba79eb83b9e95cd`였다.
최초 [38500114302](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38500114302)의
6개 성공 job, source DAG/cache, 8/8 및 5/5를 이어받았다.

이번 검증한 연구 코드 SHA는
[`47de6eb7c1e428c1e2cf1b7030f43c086158765e`](https://github.com/leegahuyn/MathScopeCompute/commit/47de6eb7c1e428c1e2cf1b7030f43c086158765e)다.
[최종 연구 Actions 38503552845](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38503552845)는
**prepare, controls, mean, initial, pde, analytic 6개 job 모두 success**다.
새 부정·범위 검사는 **Python 27개 + Node 12개 = 39개 통과**했다.
각 job은 실제 입력 ZIP/member 해시, 원본 producer/progress 230개 해시의 실행 전후 일치,
Python 3.12.10, Node 24.19.0, CPU/RAM/disk, 소스 SHA, 로그와 실패 receipt를 기록했다.
명령 전체 deadline은 1,200초이고 표준 ubuntu-24.04 runner를 썼다.

| 최종 연구 job | 실제 명령 경과 초 | 새 결과 |
|---|---:|---|
| prepare | 0.360 | 원본 ZIP 6개와 전체 member receipt 인증 |
| controls | 0.890 | 새 부정·범위 검사 39개 |
| mean | 12.420 | 원본 8/8 보존, 35 capture 경계 해소 |
| initial | 10.054 | 15개 비영 divisor, 5개 양의 moment, 3개 copy |
| pde | 1.866 | 1068 → 1020항, 모든 항·393 jet 보존 |
| analytic | 3.311 | 원본 slow chart, flat step, radial cutoff, Volterra/Picard 조건 |

시간은 runner 전체 checkout/setup 대기 시간이 아니라 실제 bounded command 경과다.
통과한 대규모 mean producer를 처음부터 재계산하지 않았다. 새 source traversal은
남은 binder·실제 정의·분모/지원구간을 확인하는 데 필요한 범위에 한정했다.

## ① Mean의 식별·바인더·함수 의미

Temporal/Moments의 기존 Etheta/gr 4개 성공을 바이트 인증한 이전 증거로 보존하고,
Ez/pressureZ의 남은 네 numerator만 같은 원본 source defining registry로 재검사했다.
네 numerator는 모두 정확 유리 산술로 0이다. **8/8 기호적 일치는 유지된다.**

de Bruijn binder scope, free coordinate source ID, 적분의 전체 body/endpoints,
named function의 body/formals/arguments/explicit captures/방향/차수, implicit system/branch,
원본 maximum을 보존했다. 이름 또는 해시만 같다는 이유로 다른 함수를 합치지 않았다.

원본 Picard[0]과 covariance originalDefinition 0/1을 추가로 펼쳤다.
**133,540 node**, 기존 35개 unknown boundary → **0**, fresh radial binder capture witness **0**이다.
여기서 닫힌 것은 새 radial binder 네 개의 포획 부재다. 임의 hidden coordinate의 formal
완전성, 모든 함수의 존재성 및 매끄러움까지 인증한 결과는 아니다.

실제 정의역 inventory에는 inverse 632, log 243, sqrt 563, integral 4299,
monotone/quadratic 14/13, natural series 523, profile/Volterra 31/4,
step/piecewise 529/2540, maximum/ceiling 96/218개가 있다. 각 source ID와 operand를
최종 mean ZIP의 `mean-capture-result.json`에 전부 보존했다.
일부 공통 prototype·chart는 아래 ④에서 닫았지만 모든 composed call의 전역 정의역은 남는다.

[상세 mean 판정](../../n6-continuation-20261014/mean_findings.md)

## ② 원본 j=0 Prop. 9.5

원문 Definition 9.4/Prop. 9.5의 B0=7/10, C0*=6/5, (9.8)–(9.10)과
실제 초기 상태의 pressure 갱신 순서를 연결했다. W/M/S는 모든 고정 multi-index마다
하나의 원본 domain 위에서 band/label/copy/point에 균일한 상수를 요구한다.
유한 jet, exponent 여유, 5/5 산술만으로 이 quantifier를 충족하지 않는다.

원본 five-bump body와 실제 scale exp(j/5), 양의 compact integrals μp를 확인했다.
λ=exp(-1000T)>0와 정확한 exponential 순서로 **실제 divisor 15개 비영**을 증명했다.
source μp 5개는 모두 양수이고, 세 profile copy의 weighted moment는 정확한
change of variables로 exp(jp/5)μp다. 기존 두 homogeneous row에 이 실제 적분 의미를
연결해 angular/axial **increment**의 weighted moment가 0임을 증명했다.

④의 actual outer-wait/cutoff 증명은 원래 finite primitive envelope가 모든 copy support를
포함함도 확인한다. 따라서 profile support를 적분 envelope 밖에서 버리는 가정을 쓰지 않는다.
하지만 전체 temporal Fourier zero mode, T1/A1의 zero-mode 보존, full tuple Fubini/support,
모든 W/M/S 균일 상계와 원본 (9.10)의 **전체** moment는 아직 미입증이다.

[초기 source 증명 및 남은 조건](../../n6-continuation-20261014/initial_source_proof_KO.md)

## ③ 전체 3성분 잔차의 의미와 정확한 축소

**175/203/690은 direct 보존형 잔차와 assembled 잔차의 차이를 전개한 유리식 분자의 항수다.**
독립 Cartesian PDE의 실제 잔차값이나 수학적 반례로 읽으면 안 된다.

| 성분 | direct root | assembled root | 기존 항 | sqrt(2)²=2 적용 후 |
|---|---:|---:|---:|---:|
| 0 | 3825257 | 3825348 | 175 | 169 |
| 1 | 3825259 | 3825349 | 203 | 197 |
| 2 | 3825261 | 3825350 | 690 | 654 |
| 합계 | | | 1068 | 1020 |

유일한 새 분자 관계는 실제 node3622=sqrt_positive(node24=2)의 제곱 관계다.
각 원래 항 번호, 변환 전후 지수·정확한 계수·상쇄, 모든 1020개 남은 항을 저장했다.
직접 factor와 defining closure의 derivative/trig/cutoff/implicit/natural/integral/Fourier/
indexed-cover 범주를 분리했다. 범주는 중첩 가능하며 오차 원인의 배타적 분해가 아니다.

outer 분자에는 직접 sine/cosine atom이 0개라서 이 단계에서 적용할 동일 phase의
sin²+cos² 관계가 없다. 실제 trig는 indexed/expression 정의 안에 있다.
원본 seven field/residual registry는 각 162행의 실제 local body/guard/map를 가진다.
모든 행 및 필요한 교차 label의 support/미분 정당성은 별도 의무다.

별도 primitive Cartesian program의 **미계산 leaf jet 요청 393개**와 domain 가정
94개를 모두 보존했다. 방향·차수·base source ID와 registry를 기록했다.
불투명 derivative를 0으로 바꾸거나 증명 없이 mixed partial을 합치지 않았다.
세 분자는 모두 아직 0이 아니다. 이는 미적용된 실제 함수 정의 관계가 남은 형식 판정이다.

[모든 항·분모·jet의 상세 판정](../../n6-continuation-20261014/pde_lemmas_KO.md)

## ④ 전역 존재성·매끄러움·정의역에서 실제로 해결한 부분

### 원래 slow chart 전체와 한 개 공통 collar

실제 node622820의 body622819는 F(s;Z,T)=s−Z²s^(2h)−T이고,
eta622829는 Zs^(-(1/2−h))다. 실제 h는 exp(-8002*(exp(1048576)+10))이고 0<h<1/64다.
원래 image는 (Z,T)=(s^(1/2−h)η,s(1−η²)), s∈[1/2,2], η∈[-1,1]이다.
이 image **전체**에서 source finite bracket의 존재·유일성과 Fs>1/2를 증명했다.

image에서 infinity-distance 1/256의 하나의 열린 collar, s∈(1/4,3)에서도 양의
미분 하계와 endpoint 부호를 얻는다. IFT와 유일성으로 같은 branch의 C∞ extension을
붙이고, 모든 고정 차수에 대한 유한 uniform chart jet 상수를 얻는다.
차수마다 다른 domain을 고르지 않는다. 원본 finite-bracket 연산자를 변경하지 않는다.

별도로 모든 Z∈R,T>0에서 유일한 positive root의 전역 정리도 증명했다.
이 continuation은 원래 bracket 밖에서 source 호출을 인증한다는 뜻이 아니다.
(Z,T)=(0,3)은 원래 [1/2,2] bracket에 root가 없으므로 전체 좌표로 무제한 extrapolation할 수 없다.

[공통 chart 증명](../../n6-continuation-20261014/analytic_initial_domain_KO.md)

### 실제 flat step와 radial cutoff

원본 sigma(t)=f(t)/(f(t)+f(1−t)), f(t)=exp(-1/t²) for t>0, 0 otherwise는
**모든 실수에서 존재하고 C∞**다. 모든 차수의 flatness는 Laurent polynomial recurrence와
exponential endpoint decay로 귀납 증명했다. 매 고정 차수의 global supremum은 유한하다.
이 prototype을 529개 실제 step 연산자에 연결했다. 각 argument의 전역 유한성·매끄러움과
2540개의 임의 piecewise join까지 자동 증명한 것은 아니다.

실제 radial cutoff633707에는 exp(-1/[t(1−t)]) bump의 모든 고정 차수 flat extension,
원래 chart의 axis gap, **actual outer wait280>0**와 전체 mean patch/five-copy support의
source finite-envelope 포함을 증명했다. 실제 정규화 적분은

rhoMass633724=(1/10)∫₀¹ exp(-1/[t(1−t)])dt ≥ exp(-9/2)/30 > 0

이며 s와 독립이다. 이 실제 분모의 비영 의무는 닫혔다.

[radial source 증명](../../n6-continuation-20261014/analytic_pde_cutoff_KO.md)

### 실제 Volterra 및 Picard

실제 frame·matrix closure 128,206 node의 unknown boundary는 0이다.
실제 Ls>0, positive integer k, 원본 fallback 정수 carrier의 |p|≥1/k를 source에 연결했다.
R>0,p≠0,Ls>0,c0≠0인 admitted finite source tuple에서는 모든 real pulse time에서
frame 분모가 nonzero다. Ordered-integral은 (KL)^n/n!로 지배되어 전역 time 해를
갖고, coefficient의 C^m slow regularity는 n^m(KmL)^n/n!로 termwise 미분된다.
이 존재성에는 후보 normUpper가 실제 상계임을 인증할 필요가 없다.

하지만 실제 source c0≠0는 다음 한 개 strict source inequality에 달려 있다.

−2F0*gR*(gR²+gZ²+2F0*gR)>0,
F0=622971, gR=622992, gZ=622991.

대표점 전체의 이 부등식과 background의 유한·실수·매끄러움을 이번에 독립 증명하지 못했다.
이전 frozenRatioBound의 S9–S13/C12/O8–9/H19/H22/H25/natural-B26-heat 전제까지
정확히 기록했다. 이전 PASS/문자열을 새 proof로 사용하지 않았다.

Picard0의 실제 A1²=0, 원래 singular diagonal, positive axis divisors는 확인했다.
하지만 A1∂ηW가 실제로 존재하므로 일반 6차원 ODE 정리만으로 부족하다.
공통 holomorphic eta strip의 A0/A1/forcing norm과 실제 tail/derivative-word bound,
모든 natural/quadratic/background domain 및 axis even extension은 남는다.

[Volterra/Picard 및 strict source blocker](../../n6-continuation-20261014/analytic_mean_findings.md)

## ⑤ 보존·실패와 최종 미입증 판정

최초 ZIP 6개는 `../mean-equivalence-20261014/cloud-38500114302/`에 저장했다.
최종 ZIP 6개, run/jobs/API artifact metadata와 전체 archive/member SHA-256은
`cloud-38503552845/ARCHIVE_MANIFEST.json`에 있다. 로컬 byte 인증 후 GitHub에 영구 보존한다.
원문 PDF 둘은 사용자가 다시 제공한 파일과 기존 저장소 SHA-256이 같아 중복 파일을 만들지 않았다.

중간 실행38503425746은 검토된 five-copy support 증명과 새 부정 검사를 최종 source에
합쳐 검증하기 위해 superseded/cancelled로 남겼다. 당시 생성된 prepare·controls·mean·initial·pde
ZIP 5개와 취소 metadata도 `cloud-38503425746-superseded/`에 보존했다. 분석 job은 실행하지 않았다.

기존 research-IDE CI38503428924 및38503558549는 새 edition 파일들의 해시/회원 목록이
기존 SOURCE_TRANSLATION_MANIFEST에 없어서 실패했다. 전체 failed-step 로그와 metadata를
`ci-failures/`에 저장했다. 원본 bytes나 수학 판단을 고친 것이 아니라, 모든 기존 edition entry가
같음을 확인하고 새 파일만 Git blob 기준으로 목록에 추가한다. 배포를 실행하지 않는다.

최종 남은 의무는 아래와 같다.

1. 모든 실제 대표점의 strict Rayleigh inequality 및 source background의 실제 norm/strip/domain.
2. Picard eta-transport limit의 실제 전제와 전체 523 natural/13 quadratic/14 monotone call의 적용 범위.
3. 전체 source integral/Fourier의 integrability, Leibniz/Fubini, support/cover/flat joins.
4. 원래 모든 고정 derivative order와 band/label/copy에 균일한 W/M/S, B0=.7,C0*=1.2.
5. 전체 초기 tuple의 moments9.10, 393 actual Cartesian jets 및 전체 PDE의 독립 함수적 일치.

**N6-01=false, N6-02=false, all-source global existence/smoothness/domain=false.**
새 chart·prototype·normalization leaf의 증명은 고전적 해석학 증명이며 새 Lean kernel 인증은 아니다.
main, 원본 producer, original56/64 및 공개 사이트를 변경하지 않았다.
Windows의 이번 세션 임시 파일은 GitHub 업로드/해시 검증 완료 후 정리한다.
