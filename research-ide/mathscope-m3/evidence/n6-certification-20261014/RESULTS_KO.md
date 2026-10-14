# N6-01 / N6-02 원본 인증 시도 결과

**무조건부 N6-01·N6-02 인증은 미완료다. 원래 56/64 판정은 유지한다.** 테스트 실행 성공, 원본 바이트 일치, 조건부 대수 일치, 실제 함수의 존재·노름·전체 PDE 인증을 구분했다.

- 별도 브랜치: `mathscope-m3-n6-certification-20261014`, [Draft PR #27](https://github.com/leegahuyn/MathScopeCompute/pull/27). 기반은 PR #26의 `bd93e3ee24212eb68c8ed3b6017c234758bd48f5`다.
- [최종 계산 실행 38495642925](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38495642925): 독립 7개 작업 모두 실행 성공. 이는 N6 합격을 뜻하지 않는다.
- 원본 155개 producer와 저장된 3,892,594-node parent를 전후 검증했다. source·PDF·요청 원문·성공 및 미일치 결과·공식 ZIP 아티팩트를 GitHub에 저장했다. ZIP의 다운로드 SHA256을 GitHub Actions 공식 digest와 대조했다.

## 실제로 증명한 것

1. **실제 retained A.21 압력 datum `P0` (source node 3451, normalized node 3449).** 원본 12개 stage의 integrand, endpoint, 연결 amplitude, Qb/Qp wait, 무한 prefix와 tail을 독립 식과 모두 대조했다. 양의 측도 질량은 `nu(R) <= 1125K/296 < 4K`다. `|Im eta| < 1/16`에서 실제 P0의 holomorphy와 `|P0| < 5K`, 실수 압력 부호도 따른다. [전개한 증명](../../certification-20261014/pressure_mass_lemma.md). 이는 고전적 수학 증명과 정확한 소스 식·유리수 검산의 결합이며, 새 Lean kernel 증명은 아니다. 이후 최신 pressure calibration/PDE 압력과의 동일성은 별도 미해결이다.
2. 원본 signed variance의 일반 정리: `Q(z)>0`, `Q(0)=1/2`, `W_mu>0`. 실제 preloop 입력 envelope가 공급될 때 S^12 bracket 및 선언된 미분 상계/하계가 따른다. circle lift의 양성·정규화·전역 괄호, system2의 **선언된 source image**에서 전 구간 `F_s>1/2`를 증명했다. [해석적 증명 및 실제 적용 경계](../../certification-20261014/RADIUS_MONOTONE_PROOF_KO.md).
3. 원본 B8/C2 연속 행렬의 독립적인 determinant/cofactor 상계와 조건부 Lemma A.2 수치 조건을 다시 유도했다. B8 inverse 상계 `2^68`, C2 inverse 상계 `2^30`; 실제 complete rhs/debt의 노름 연결은 아직 미입증이다. [급수·quadratic 증명 시도](../../certification-20261014/series_quadratic_lemmas.md).

## 실제 원본 계산

| 범위 | 실제 결과 | 인증 경계 |
|---|---|---|
| root 633815 | 의존 노드 126,484개, 적분 4,186개 복원; 빠진 definition node 없음; SQLite/압축 DAG checkpoint 재읽기 일치 | 원본 DAG 복원·재시작 동일성이다. 미분기 내부 상태의 중단 지점 복원까지 증명한 것은 아니다. |
| node 539400 / 539403 | 원본은 각각 `max(1,B0)`, `max(1,B0,B1)`이다. Picard/natural/quadratic/expression body까지 lexical capture 검사. 539403의 81,777-node closure는 free coordinate·미지원 operator 없음 | 정의된 값이면 물리 좌표에 대한 상수다. 원본 limit/적분의 실제 존재·유한성은 별도로 남는다. B0/B1 임의 우열을 가정하지 않았다. |
| 원본 전체 mean | temporal/moments 두 단계 모두 재구성. **원본 maximum 값을 그대로 유지한 전략에서도** 작업 350,225, 독립 scalar node 53,131, source node 127,469; resource stop 없음 | 8개 비교 중 Etheta/gr 4개 일치, Ez/pressureZ 4개 미일치. source/domain/limit guards는 미해결이다. |
| 남은 mean operand | 단계마다 정확한 325-node operand checkpoint 보존. 압력 미분 차이는 각 8개 monomial | primitive alpha 비교가 `independent_implicit_monotone_root` 또는 `independent_defined_partial`에서 거부된다. 이름만 같다는 이유로 unknown body를 합치지 않았다. |
| 실제 전체 3성분 residual | direct conservative roots 3825257/3825259/3825261과 assembled roots 3825348/3825349/3825350을 독립 rational 비교 | 남은 monomial 175/203/690. 실제 analytic/function/integral node를 원본 ID의 atom으로 보존했으므로 아직 PDE 반례라고 결론내릴 수 없다. |
| j=0 Prop9.5 | 실제 temporal/moment 최신 속도·압력, axial cutoff, 새 P/J 및 nonlinear remainder, full field roots를 원본 순서대로 대조 | (9.8)–(9.10) 10개 클래스/보존/영역 요구의 무조건부 인증은 미완료다. |

`maximum`의 다음 분기 중단을 실제 식까지 추적했다. 그 중 539403의 R 의존 중단은 세 미분 branch가 모두 0인 `smooth_piecewise`를 비영 노드로 남기는 독립 reader 정규화 문제였다. 별도 fork에서 `choose(x,a,b,0,0,0)=0`을 적용했다. 실제 source maximum 값을 0으로 대체하거나 특정 branch를 임의 선택하지 않았다. 이후 conditional FTC 전략과 **원본 maximum 전부 유지 전략**을 각각 실행해 같은 4/8 결과를 얻었다. 과거 중단 아티팩트도 그대로 보관했다.

## 남은 정확한 식과 최소 과제

두 단계의 pressureZ 차이는

`A * ((I_derived - I_source) - chi * (J_derived - J_source))`

로 묶인다. `A = s - 2*h*Z^2*exp(source 633904)`, `s`는 actual monotone source 622820, `h`는 source 9, `Z`는 source 622803, `chi`는 source 633733이다. Ez 차이는 해당 압력 미분 차이에 epsilon을 곱한 것이다.

- temporal source I/J: **3614628/3614629**, 비교 pressureZ **3614703**.
- moments source I/J: **3615355/3615356**, 비교 pressureZ **3615388**.
- 양쪽 I/J의 적분 끝점은 같고 binder/integrand ID가 다르다. 이것은 alpha/body equality 후보이며, 아직 동일성 증명은 아니다. named body의 complete capture/partial semantics를 원본 정의에 연결한 뒤 integrand equality와 적분 alpha equality를 증명해야 한다.
- node **4483**: actual B_rho input elements, 원본 integrated operator와 B.14/B.15 recurrence의 전체 대응 및 원본 호출의 정의역을 하나의 인증으로 조립해야 한다. 실제 retained P0 mass 전제는 이번 독립 증명으로 닫혔다. 유한 계수를 무한 limit으로 대체하지 않았다.
- node **5029**: actual B22/B26/B34/restoration 전체 history의 5개 rhs에 대해 `max_(m<=2)||partial_eta^m rhs||_infinity <= 15h`를 직접 연결해야 한다. source radius/preconditioner/PASS는 이 부등식의 증명이 아니다. I1 C12 envelope와 I2 improper heat debt도 별도 미입증이다.
- monotone **0/1**: actual continued/B8 `E>0`, `a>=1/S`, `|p2|,|ts|,vs<=S`, 필요한 모든 차수의 real regularity를 연결해야 한다. system **2**: 모든 actual 대입 tuple의 source-image 소속을 증명해야 한다.
- N6-01: 실제 complete curl/covariance input seminorm, (9.11) cancellation, Fourier/radial/pressure/five-map operator의 actual input classes, (8.26)/(8.27)의 전체 nonlinear/cutoff/flat tails와 두 exact Haar moments를 같은 원본 domain에서 연결해야 한다. `B0=0.7`, `C0*=1.2`를 slope 표본으로 인증하지 않았다.
- N6-02 전체 PDE: 실제 full field `u=[3825006,3825007,3825008]`, pressure **3825009**의 source jets를 Cartesian rotation/frame/fast-phase chain까지 독립 미분하고 direct/assembled residual과 맞춰야 한다. 전체-domain interval enclosure, Gaussian/Fourier tails 및 수치 오차 예산은 아직 계산하지 않았다.

## 보존 및 재현

본 폴더의 `run-*-observation.json`은 실제 실행 SHA, 공식 artifact ID/digest, ZIP 멤버를 기록한다. 대응 ZIP에 TAP/실제 stdout/runner RAM·CPU·disk/JSON/ledger 전후 SHA/checkpoint가 들어 있다. 마지막 mean ZIP에는 `mean-result.json`과 **`original-mean-result.json`**이 함께 있다.

실행: `.github/workflows/m3-n6-certification.yml`. Python 3.12, Node 24, 공개 저장소의 표준 ubuntu-24.04 runner, Node heap 8192 MiB, 독립 작업의 fail-fast=false, 단계 2200초 한도, if:always artifact upload를 사용한다. 유료 larger runner나 Render 배포를 사용하지 않았다. [표준 runner 설명](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).

main 및 기존 브랜치/원본 producer·판정 파일은 수정하지 않았다. 공개 사이트 배포도 수행하지 않았다. 자료 추가로 달라진 source edition membership/hash만 명시적으로 갱신했고 클라우드의 원본 693개/50 pin 및 metadata 검증을 통과시켰다. 판정은 [VERDICT.json](VERDICT.json)의 enum과 개별 미입증 조건을 따른다.
