# MathScope M3 N6-01·N6-02 실제 독립 후속 연구 결과

**N6-01은 OPEN, N6-02는 PARTIAL이다. 무조건부 인증은 완료되지 않았다.**
실제 코드·증명·원본 소스 계산을 수행하고 GitHub의 별도 Draft PR에 보존했다.
이번에 닫힌 leaf·유한 보조정리와 전체 원본 합격 조건을 구분한다.
테스트·source PASS·표본·원문 논문의 주장으로 전칭 명제를 인증하지 않았다.

## 실행 출처와 보존

- 시작점: PR #28 최신 head `a08d9de1777cf460e6fa980674c5c70939201457`.
- 후속 브랜치: `mathscope-m3-n6-independent-20261014`, base는 PR #28 브랜치.
- [Draft PR #29](https://github.com/leegahuyn/MathScopeCompute/pull/29).
- 최종 연구 코드 커밋: [`297e0ca51780e12670b18e1faf3b13d5d4e6fdb1`](https://github.com/leegahuyn/MathScopeCompute/commit/297e0ca51780e12670b18e1faf3b13d5d4e6fdb1).
- [독립 연구 cloud run 38508339662](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38508339662): **6/6 job success**.
- 새 controls: **Python43 + Node13 = 56개 통과**. 유한 대수·적용범위·오류 거부 검사이며 전체 인증의 대용이 아니다.
- 같은 연구 코드 커밋의 기존 회귀 CI **11/11 성공**. 정확한 job·URL·커밋은 `CI_CODE_COMMIT.json`에 보존했다.

표준 `ubuntu-24.04` runner, Python3.12.10, Node24.19.0, Node heap4GiB를 사용했다.
각 전체 명령의 deadline은1,200초다. 실제 runner는 CPU4개/RAM 약16GiB였다.
별도 유료 larger runner·자동 merge·사이트 배포를 사용하지 않았다.

| job | bounded command 경과 초 | 결과 |
|---|---:|---|
| prepare | 0.517 | 원본·reference·ZIP/member 해시 검증 |
| controls | 1.232 | 56개 새 positive/negative controls |
| rayleigh | 1.585 | 실제 노드 연결, 유한 하계·parameter·열 primitive 증명 |
| analytic | 1.470 | 실제 Picard 구조·계수 inventory·sharp step·모든 fixed-order 보조정리 |
| cartesian | 42.165 | 28개 실제 jet closure 적용, 모든 cover-row 국소 지도 검증 |
| acceptance | 0.990 | 같은 run/커밋의 전체 receipt, 원본 클래스10종·상위 전칭 의무14개 보존 |

시간은 checkout/setup/queue를 포함한 workflow 전체 시간이 아니다.
새 계산은 원본 전체3,892,594노드 producer나 이미 통과한 전체 mean producer를 다시 생성하지 않았다.
기존38500114302의 ZIP6개와 모든 receipt member를 byte 인증한 뒤 필요한 DAG·registry·결과를 재사용했다.
원본155개 producer 및 진행장부 등을 포함한 보호 파일230개는 각 job 실행 전후 동일하다.
구현 파일·HEAD도 실행 전후 동일하며 모든 성공 receipt는 clean checkout의 정확한 코드 커밋에 연결된다.

성공 ZIP6개, GitHub run/jobs/artifact metadata와 archive/member SHA는
[`cloud-38508339662/ARCHIVE_MANIFEST.json`](cloud-38508339662/ARCHIVE_MANIFEST.json)에 있다.
개별 모든 로그·새 source checkpoint·원래/남은 항·미계산 요청은 해당 ZIP에 들어 있다.
`obligation-matrix.json`과 `verification-summary.json`은 같은 run의 acceptance 산출물이다.
공개 판정표 `OBLIGATION_MATRIX_SCOPED.json`은 그 원본 산출물의 SHA를 검증한 뒤 최종
독립 검토의 source/scope 명확화를 적용한 파생본이다. raw ZIP·matrix·판정·모든393요청/94guard를
그대로 보존하며, 새 수학 증명을 부여하지 않는다. `normalize_obligations.py`로 재현한다.
특히 Picard strip은 실제 내부 collar의 coefficient/forcing call만을 대상으로 하며,
natural4483/B8 5029는 관련된 별도 입력 전제다. 전체 heat의 holomorphic 확장을 요구하지 않는다.
원본 논문166쪽과 Blueprint99쪽은 이전 업로드와 저장소 보존본의 bytes가 동일함을 확인했다.
PDF를 새로 중복 저장하지 않았고, 정확한 SHA·페이지수는 `REFERENCE_RECEIPT.json`에 기록했다.

## A. 실제 전체 대표점 Rayleigh

대상은 실제 F0=622971, gR=622992, gZ=622991이다. 특히 gZ는 G_R이며 F_Z나 G_Z로 바꾸지 않는다.
실제 shared chart에서 s=s(Z,T), X=R²/(2s), eta=Z/s^(1/2-h)이므로 R미분에 대해
s_R=eta_R=0, R X_R=2X다. 원본 profile이 C1이고 해당 양의 chart에 속할 때,

\[
g_R=-aF_0,\quad g_Z=bF_0,\quad
P=-2F_0g_R(g_R^2+g_Z^2+2F_0g_R)
=2a^2F_0^4(v_s-2),\quad v_s=a+b^2/a.
\]

이 다항식 항등식과 독립 유한 lower-bound lemma를 정확 유리수 계수로 확인했다.
전체 도메인에서 F0≥f>0,a≥α>0,v_s−2≥γ>0이면 P≥2α²f⁴γ>0이다.
**실제 source의 f,α,γ를 얻었다고 주장하지 않는다.** 예제 `2/14175`는 lemma control이며 actual profile enclosure가 아니다.

실제 growth sqrt 입력623005는 P/(gR²+gZ²), c0=623008의 분모623002는
2F0gR/sqrt(gR²+gZ²)이다. P>0이 전역에서 입증되면 이 분모와 sqrt branch를 닫을 수 있다.
기존 frozenRatioBound 전제가 실제로 입증되면 P>2Renv^-70과 |c0|>Renv^-6 등의
정확 power 하계가 따른다. 현재 그 실제 입력 전제는 OPEN이다.

새로 무조건부로 증명한 explicit parameter 범위는
0<h<1/100, Renv>2^260>8192, N=1+ceil(Renv^50)>Renv^50이다.
거대한 exponential을 machine float의0/∞로 바꾸지 않았다.
이 parameter hierarchy는 Renv가 실제 전체 field norm을 지배한다는 명제와 다르다.

원본 C12의 네 cone gap에 대해서는 전체 양의 convex box의 derivative bound와
mean-value perturbation lemma를 독립 도출했다. 동일 source 비교 tuple의 raw gap≥1/Renv,
실제 error≤Renv^34/N, 실제 전체 tuple/line segment 범위가 주어지면 모든 phase의 gap은
1/(2Renv)보다 크다. **actual perturbation/envelope의 전칭 상계는 여전히 필요하다.**

실제 Rayleigh defining closure6,576노드를 읽고, natural139/quad13/monotone5,
적분452/분기155개 및 각 source ID를 보존했다. 알 수 없는 grammar는0개지만
그 operator들의 존재성·정의역·전역 하계가 자동 입증된 것은 아니다.
남은 최소 의무는 다음 다섯 가지다.

1. Fprofile71959/Uprofile9236의 전체 annulus C1 존재·접합. natural4483, B8 5025–5029, I1 9169–9173, I2 71717–71719 및 C1 inverse roots7456/7945/8490/8632의 실제 입력 범위.
2. 대표점622807–622809 전체의 Xa≤X≤Xb, |eta|≤1, 1/2≤s≤2 membership.
3. S9–S13/C12/S4와 I1/I2/heat 수정까지 포함한 actual F0>Renv^-10.
4. B29/A10/C12/O §§8–9/H19/H22/H25에 대한 actual a>Renv^-10.
5. B29/A9, 모든 C12 phase와 partial I1 repair point, O/H 전 구간의 actual v_s−2>Renv^-10.

원본 전체 Rayleigh counterexample는 발견하지 않았다. 양의 a만으로 충분하지 않다는
정확 부정 control을 actual profile의 반례로 표시하지 않았다.
자세한 증명은 [RAYLEIGH_KO.md](../../n6-unconditional-20261014/RAYLEIGH_KO.md)에 있다.

## B. 실제 Picard·natural/quadratic·열 primitive

원문 Lemma5.1(p47–49)의 integrated singular operator G(A0+A1∂eta)를 실제 source와 대조했다.
A0/A1/forcing 합집합3,679노드, parity78행, diagonal[0,0,2,0,3,1]을 확인했다.
A1는 처음 네 좌표를 마지막 두 좌표로 보내고 마지막 두 좌표를 소멸시키며,
diagonal Green kernel은 그 두 subspace를 보존한다. 이 구조를 포함하여
A1 D A1=0 및 A1 D ∂etaA1=0을 정당화했다.

모든 길이 k에 대한 nonzero derivative word의 eta미분수≤ceil(k/2),
factorial/Cauchy-loss tail과 모든 fixed-order even-X kernel은 귀납·고전적 해석학 증명이다.
유한 word/monomial controls에서 큰 차수를 검사했다는 사실로 모든 차수를 외삽하지 않았다.
일반6차원 ODE theorem으로 eta-transport PDE를 대체하지 않았다.
원본 step에 대해서는 **모든 실수에서 0≤sigma′≤8**을 독립 증명하여 기존 majorant의 sigma′<9를 공급했다.

계수 closure의 flat-step31개 및 branch selectors는 eta독립이며,
order-one coefficient closure에 quadratic root는0개였다.
natural157개 call과 eta-dependent domain guard12건(서로 다른 argument11개)을 저장했다.
12건은 inverse11건+log1건이며 nodes17/18/1195/1953/3471/3694/3725/3764/3835/4381/25745/26500이다.
각 call의 Y·branch·실제 input domain, 원문(5.8)의 actual C1 및 공통 strip은 아직 OPEN이다.
step가 eta독립이라는 사실만으로 그 모든 자연급수·분모·적분이 holomorphic임을 주장하지 않는다.

원문 LemmaA.2(p127–128)도 대조했다. actual normalized quadratic system에는
smooth invertible B, smooth Q,d와 실제 `8 beta0² kappa0 d0≤1`이 필요하다.
preselected finite k의 small norm은 별도 조건이며, 나머지 모든 fixed-order regularity는
같은 branch의 invertible Jacobian과 실제 smooth input에 대한 implicit differentiation에서 얻는다.
모든 차수의 simultaneous smallness를 가정하거나 유한 derivative samples를 all-orders proof로 바꾸지 않는다.
기존 selected4483/5029의 결과는 재사용하지만 AppendixB의 모든 natural/quadratic 입력 전제를
그 한 개 call의 증명으로 해결했다고 표시하지 않았다.

실제 Gamma71517과 heat loss71947/71948의 body/Jacobian을 인증했다. 실제 열 primitive

\[
H_h(Z)=\Gamma(1+h)^{-1}\int_0^\infty e^{-t}t^h(1+Zt)^{-h}\,dt,
\qquad Z=2(1-eta^2)/X
\]

는 physical domain X>0, |eta|≤1에서 양수이고0<H≤1이다.
모든 고정 m에 대해 |H^(m)(Z)|≤(h)_m(1+h)_m를 전 Z≥0에서 증명했다.
X≥4이면 H>1/2 및0≤−ZH′/H<6h/X를 얻는다. Gamma tail을 버리거나 quadrature 표본으로 증명하지 않았다.

동시에 실제 열 함수의 eta endpoint holomorphic extension은 불가능하다.
H^(m)(0)=(-1)^m(h)_m(1+h)_m이며 Taylor 절대계수의 비가 m보다 커져 반경0이다.
Z(eta)의 eta=±1에서의 미분이 비영이므로 holomorphic local inverse로도 이 장애가 사라지지 않는다.
**이는 전체 열 ingredient의 명제이며, 열 보정이 없는 내부 Picard strip을 반증하지 않는다.**
원문p140도 terminal heat factor에는 eta-smoothness만 필요하고 analytic axis datum을 바꾸지 않는다고 구별한다.
전체 heat에 대한 복소 strip을 전제로 삼는 접근은 제거해야 하지만,
같은 physical domain의 한쪽 실수 C∞ 성질과 모순되지 않는다.

자세한 원문·source 대응 및 미해결 class 조건은
[ANALYTIC_KO.md](../../n6-unconditional-20261014/ANALYTIC_KO.md)와 `analytic-prerequisites-result.json`에 있다.

## C·E. Cartesian 실제 jet closure와 모든 잔차

대상은 velocities3825006/3825007/3825008, pressure3825009,
direct3825257/3825259/3825261, assembled3825348/3825349/3825350으로 유지했다.

| 계산 | 이전 | 이번 |
|---|---:|---:|
| 독립 Cartesian 미계산 요청 | 393 | **365** |
| 실제 닫혀 PDE checkpoint에 적용된 요청 | 0 | **28** |
| 원래 global domain guard | 94 | **94** |
| direct-minus-assembled 분자 항수 | 169/197/654 | **169/197/654** |
| 분자 항 합계 | 1,020 | **1,020** |

23개 closure는 h와 frozen band622791에만 의존하는 ceiling의 공간좌표 미분이다.
그 complete primitive support를 추적했으므로 fixed parameters에서 정확히0이다.
변하는 ceiling 인자의 미분이나 숨은 function capture에는 이 규칙을 적용하지 않는다.

5개 closure는 실제 slow root622820의 first jet다. 원래 source image와 common collar에서
Fs>1/2, IFT·유일성을 이용해 s_Z=2Zs^(2h)/Fs 및 나머지 실제 독립 좌표 미분0을 공급했다.
모든 global application이 그 collar에 속한다는 guard는 여전히 OPEN이다.

위28개를 실제 독립 scalar PDE에 적용하여2698→2005노드의 새 checkpoint를 생성했다.
Cartesian V/divergence/time/spatial/laplacian/pressure/advective/conservative/역회전 roots를 모두 보존해 다시 썼다.
이 세 잔차가0이거나 direct=assembled라고 선언하지 않았다.
원래94개 guard, 모든 미계산 요청 및 원래/남은 rational terms와 변경 기록을 저장했다.

원본7개 indexed definition의162행씩 **1,134행** 모두에서 actual localBody/formals 바인딩이 일치했다.
fixed physical label·nearest-copy cell 내부의 **324개 chart·25,272개 Jacobian**은 정확히 일치했다.
이 조건 아래 coefficient constancy도1,134행에서 확인했다.
무조건적 primitive support만으로 constancy를 확인한 것은 residual486행이며,
velocity/pressure648행은 changing-label/copy를 고정하는 국소 전제를 추가로 요구한다.
global flat joins, 누락 labels의 locally-zero 성질과 모든 cross-label nonlinear products는 미해결이다.

남은365개 요청의 정확한 actual bases는 다음과 같다. 모든 요청 방향·순서·source node·registry·최소 lemma는 JSON에 있다.

| actual bases | registry | 요청 수 |
|---|---|---:|
| 622932/622933/622934 | expression688/689/690 | 각23 |
| 622935 | expression691, slow pressure | 5 |
| 1696799 | inverseDefinitions0 | 23 |
| 1706770/1706771/1706774/1706775/1706776 | expressionDefinitions12 | 각23 |
| 3614767/3614771/3614789 | expressionDefinitions18/19/20 | 각23 |
| 3615055 | expressionDefinitions23 | 5 |
| 3615202 | expressionDefinitions21, complete gr | 5 |
| 3676894/3676895/3676896 | fieldDefinitions6/7/8 | 각23 |
| 3676897 | fieldDefinitions9, initial angular pressure | 5 |

이전 pressure registry 누락3건은 실제 정의로 수리했다. 이름만 같다고 함수를 합치지 않았다.
94 guards는 positive argument19, nonzero22, integral Leibniz40, step6, flat join2, opaque substitution5개다.
global field audit로 이번에 해소한 guard는0개다.

coupled3825003–3825005는 실제 residual fields임을 registry/stage에서 확인했다.
direct velocity에 없다는 사실만으로 누락 update·stage mismatch·PDE 반례를 주장할 수 없었다.
별도의 numerical domain/roundoff/truncation enclosure는 생성하지 못했다.
미계산 actual jets와 함수 노름·domain·tail이 남은 상태에서 숫자 샘플을 enclosure로 표시하지 않았다.

자세한 실제 적용·국소 전제·전체 실패 목록은
[CARTESIAN_KO.md](../../n6-unconditional-20261014/CARTESIAN_KO.md)에 있다.

## D. 원래 j=0 클래스·전체 Haar moments

원래 ordered updates를 다음 순서로 보존했다.

`primary-current-pressure → temporal(8.20) → post-temporal(8.12) → five-moments(8.25) on fresh P/J → post-moment(8.12)`.

기존 mean8/8 symbolic, five-row5/5 exact arithmetic, divisor15개 비영 및 radial positivity의 증거는 유지했다.
이번의 정확 exponent 비교도 B0=7/10,C0*=6/5의 **class implication**에 해당한다.
실제 class seminorm을 얻은 것으로 표시하지 않았다.

원본 열 가지 의무는 계속 OPEN이다.

1. (9.8) residual wave W^(7/10): roots3825348–3825350.
2. (9.8) mean Etheta/Ez M^(6/5): roots3614976/3615392.
3. (9.8) defects P/Jtheta/Jz S^(6/5): roots3615055/3615101/3615147.
4. (9.9) full wave W^(1/2), full primary curls. velocities3825006–3825008은 전체 속도의 검토용 anchors이며, w는 base/mean과 분리된 실제 grouped full-curl source를 별도 바인딩해야 한다. 전체 velocity roots 자체로 W membership을 인증하지 않는다.
5. (9.9) full curl remainder W^(17/25), 모든 cutoff/connection terms. 마찬가지로 실제 w−w0_tan을 별도 바인딩해야 한다.
6. (9.9) tangential velocity·pressure: roots3614791/3614792/3615361.
7. (9.9) radial epsilon gain: root3614790 및 endpoint/cutoff 미분.
8. (9.10) 전체 angular Haar weighted moment: root3614791.
9. (9.10) 전체 axial Haar weighted moment: root3614792, actual T1/A1.
10. (9.4) common domain/support/divergence: root3825024 및 모든 cover 접합.

각 고정 multiindex마다 하나의 원래 공통 domain 위에서 모든 band/label/copy/point에 균일한
상수와 Fourier/Gaussian/flat/cutoff tail이 필요하다. 전체 Haar/radial Fubini와 limit 교환도 필요하다.
다섯 radial increment의 정확 moment row가0이라는 사실은 전체 tuple의 두 Haar conserved moments를 증명하지 않는다.
(8.26)–(8.27)의 nonlinear remainder와 최신 pressure를 원본 source binding에서 누락하지 않았다.

## 실패·검토와 최종 판정

첫 [cloud38508119409](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38508119409)는 prepare에서 실패했다.
새 verifier lock이 Windows에서 CRLF 변환된 기존 ARCHIVE_LOCK.json의 checkout 해시를 사용했기 때문이다.
원본 Git blob 해시로 교정하고 reference pin=immutable Git blob을 검증하는 control을 추가했다.
producer나 수학 명제를 수정해서 통과시킨 것이 아니다. 당시 codeSHA c804b721a0dcaaadbd393f7f9f3bbb624686e668,
실패 ZIP·run/jobs metadata·full failed-step log를 `cloud-38508119409-failed/`에 보존했다.

첫 unrestricted Cartesian map 시도에서 changing labels/copy/guards의 미분이 STOP로 남았던
전체 비교·log·실행 metadata도 `exploratory-cartesian-pre-cell/`에 보존했다.
이는 uncommitted 탐색 코드의 자료임을 표시하며, clean-commit 성공 receipt와 혼동하지 않는다.
후속 fixed-cell 비교 성공은 그 전제를 추가한 국소 결과이며 실패를 global proof로 재해석하지 않았다.

독립 peer review에서는 variable chart coefficient를 상수로 가정하는 second-word API의
Leibniz 누락 위험을 찾아, 최종 코드가 actual coefficient derivatives=0 증거 없이 호출을 거부하도록 고쳤다.
변하는 coefficient와 누락된 constancy authority를 거부하는 control도 있다.
[REVIEW_KO.md](../../n6-unconditional-20261014/REVIEW_KO.md)에 실제 증명과 적용 범위의 검토를 기록했다.

최종 acceptance는 원래 클래스10종과 A/B/C/E 상위 전칭 의무4개를 그대로 남겼다.
모든 원래393개 요청·94개 guards, 새 실제 계산과 정확한 source/receipt SHA를 machine matrix에 보존했다.
현재 실제 전체 Rayleigh margin, 공통 actual Picard norms/strip, 모든 W/M/S와 전체 Haar moments,
global cover gluing 및 independent full Cartesian PDE+error enclosure는 입증되지 않았다.

**원본 N6-01 complete=false, N6-02 complete=false, universalCertificationAchieved=false.**
이번 고전적 source-leaf 증명과 exact finite lemmas는 새 Lean kernel certificate가 아니다.
main, PR #28, 원본 producer/장부, M3 56/64 및 공개 사이트는 변경하지 않았다.
