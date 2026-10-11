# 공통 전역 파동·공분산·물리 미분 캐시 독립 검토

검토일: 2026-10-11. 검토자: `positive_stress`.

## 판정과 현재 실행 범위

원문 6.4–6.6, 7.2–7.4 및 Definition 9.4의 정의와 아래 실제 모듈을
읽어 대조했다. 같은 공통 계수열, 원래 Gaussian, 양의 제곱근, 실제
full curl과 남는 Navier–Stokes 잔차의 구분은 유지된다. **출시 전
수정할 사항은 전역 flat 상수의 band 중첩 계수, N6의 공분산 평균
표기, 공개 signed-target 호출의 private 출처 재검사 세 가지다.**
root는 세 사항을 수용했고 실행 중인 source attempt3가 끝난 뒤
적용하기로 했다. 이 문서는 그 수정이 이미 실행·인증되었다고
말하지 않는다.

후속 상태는 마지막 7절에 추가했다. 위 문단과 원래 SHA 표는 수정
전 검토 기록이며, 현재의 적용·재실행 상태는 7절과 함께 읽는다.

source attempt1 및 attempt2는 전체 실패를 보존한다. attempt2에서
배경 flatness main theorem만 실제 내부 8개 및 validator 6개 검사를
통과했으며, E_B는 선행 물리 치환 실패 때문에 실행되지 않았다.
현재 attempt3의 최종 process receipt는 아직 대기 중이다. 검토자는
별도 큰 source 프로세스를 병행하지 않았다.

## 읽은 파일의 정확한 버전

아래 SHA는 source attempt3 실행 중의 변경 전 bytes다. 후속 수정의
실행 결과는 이 표를 덮어쓰지 말고 별도 receipt로 결속해야 한다.

| 파일 | SHA-256 |
| --- | --- |
| `actual-common-global-wave-bounds.mjs` | `f7961901c9d5f5cff4c69a60b7abbbdac671047a8d07fd325bc58a4d57c4a358` |
| `actual-common-global-covariance.mjs` | `d81d08d05916faa79c8a4d7ce83b8262d8b9fc26235d67a79b26e83f403d8bfa` |
| `actual-common-physical-jet-kernel.mjs` | `4ffa1f1608b12b54efa36b2f7e185c48fe1522c943206f2223b2c60299b70a00` |
| `actual-common-band-background-residual.mjs` | `c68cd761e662fb224d1daa13fac59144630a90f9ce83e24d9a16ed4d2f73b831` |
| `actual-background-residual-flatness.mjs` | `87b8291fa7b2d66cc8c3a78621adeef55745c750366abdb4ad486b47fc744cb5` |

의존하는 `actual-all-order-gaussian-jet-kernel.mjs`,
`actual-global-wave-bound-kernel.mjs`, `actual-physical-residual-algebra.mjs`의
일반 recurrence 검토는 앞선
`../common-wave-calculus-20261011/INDEPENDENT_COMMON_WAVE_KERNEL_REVIEW_KO.md`에
남아 있다. 이번 검토에서는 일반 부등식의 실제 source 전제를 추가로
대조했다. 원문은 제공된 `navier-stokes.pdf`와 그 텍스트 추출본이며,
웹의 다른 정리나 수치를 대신 사용하지 않았다.

## 1. 실제 공통 source와 모든 고정 미분 차수

`family`, `targetWeightedNorms`, `physicalCurl`의 private 인증과 객체
동일성을 검사하므로 압력·stress·velocity의 서로 다른 계수열을
섞지 않는다. 실제 target norm을 담는 그래프와 물리 curl을 담는
그래프는 서로 다른 namespace로 보존한다. 물리 pulse root는
`graphNamespace: physical`인 외부 참고이며 norm 그래프의 산술
operand로 사용하지 않는다.

요구한 물리 미분 차수가 m이면 실제 `C_(m+3)`와 target weighted
jet 0,…,m+1을 요구한다. 없는 높은 차수 상수를 C2나 0으로 대체하지
않는다. 실제 `C_j`는 j 이하의 모든 slow 미분을 덮고, Gaussian
base에는 원래 Bnorm, 해당 C, factorial, Lmax가 들어간다. 이는
일반 mixed matrix ledger의 전제와 맞는다.

정규화된 실제 행렬은

\[
M=\operatorname{diag}(0,-2\lambda)+E_{\rm actual}-(d-d_{\rm ref})I.
\]

원래 음의 두 번째 대각항을 양의 절댓값으로 바꾸지 않고
\(\mu_\infty(M)\le(2E+E_d)/S\)를 쓴다. 따라서 실제 propagator의
상수 \(W=\exp(3E L_{\max})\)는 band와 무관하다. 순수 slow 미분은
동일한 propagator로 Duhamel 전개하고, fast 미분을 포함한 단어는
ODE를 미분한다. 두 경우 모두 모든 subset/binomial 항을 유지한다.
원래 정규화 초기값 (1,0)은 slow 변수와 무관하며 실제 P의 적분 body,
중점, 상한과 FTC를 실제 물리 그래프에서 다시 대조한다.

이 구성은 각 고정 유한 m에 대한 동일한 source recipe다. 이번 작은
m의 실행을 무한 개의 그래프가 실행되었다는 주장으로 확대하지 않는다.

## 2. weighted H, 역행렬, 양의 제곱근

H는 원래 두 sign의 Haar·cutoff 적분이다. \(c_iL_s=2r_0\)를 써서
적분 길이의 S 인자를 정확히 처리한다. 원래 determinant 하한
\(|\det H|\ge d_*/S\), 양의 weight 하한 \(y_j\ge c_y\zeta\),
target jet bound가 동일한 공통 family에서 온다.

\(D^m H^{-1}\), \(D^m(H^{-1}T)\), \(D^m\sqrt y\)의 recurrence는
matrix dimension 2와 모든 Leibniz 계수를 포함한다. 제곱근 미분에서는
\(\sigma^2=y\)를 미분하고 실제 양의 \(2\sigma\)로 나눈다. 분자의
두 \(\sqrt\zeta\) 또는 한 \(\zeta\)가 분모와 결합하여 남기는
\(\sqrt\zeta\)를 보존한다. endpoint에서 역수나 제곱근을 평가하지
않고, 두 원래 radial exponential이 모든 유한 pole을 흡수한 뒤 0으로
연장한다. 닫힌 eta 끝점은 원래 시간 영역의 one-sided heat jet이다.

K는 실제 B, W, determinant/weight 역하한, 원래 Haar 길이 상수,
원래 cutoff·chart FTC 상수, 모든 필요한 target N_j를 포함한다.
최종 \(K^{\mathrm{physicalPower}}\)는 Gaussian 상수에서 빠지지 않는다.
고정 물리 미분 한 번에 Q의 두 역거듭제곱을 배정하는 손실 계산은
\(0<h<1/16\)의 정확한 유리수 여유로 검증된다. 실제 h는 양수로
보존하며 binary64의 0으로 바꾸지 않는다.

## 3. Gaussian 끝점 상수와 full temporal force

원래 temporal cutoff는 \(\psi=\sigma_2(20v/L-4)\sigma_2(16-20v/L)\)다.
양의 차수의 cutoff 미분이 남는 곳은
\(|v-L/2|\ge L/4\)이므로 원문에서 쓰는 L/5 거리보다 강하다.
reference \(\tau=1/2+v/L\), \(u\ge2\)에 대해

\[
(\log P)''\le-\frac{\lambda_0}{2uL},\qquad
\log P(v)\le-\frac{\lambda_0(v-L/2)^2}{4uL}.
\]

이는 원래 \(\lambda-d_{\rm ref}\)의 실제 식을 미분하고
\((1+u^2)^{3/2}<2u^3\)를 쓰면 얻는다. 따라서
\(L\ge2r_0S\), \(\lambda_0\ge R_{\rm env}^{-31}\)에서

\[
P(v)\le e^{-aS},\qquad a=\frac{r_0R_{\rm env}^{-31}}{32u}>0.
\]

adapter의 a는 이 값과 같다. \(P\equiv1\)이나 고른 수치 Gaussian으로
바꾸지 않는다. 원래 두 radial edge 지수는 \(t_1^2\), 4이며,
\(\nu=ab/(a+b)>0\)의 완전제곱 부등식으로 모든 유한 endpoint pole을
덮는다.

temporal force는 단순 primary coefficient가 아니라 원래
\(Q^{-A-1-h}\psi'\operatorname{curl}_*(A_{\rm base})\)다. potential의
coefficient, cylindrical frame, slow cutoff 미분을 모두 포함한 full
curl을 유지한다. \(\psi\)로 나누어 중앙 또는 끝점에서 숨겨진 항을
지우지 않는다. 미분된 force의 각 항에 양의 cutoff 미분이 남으므로
위 Gaussian을 적용할 수 있다. 전체 nonlinear·eikonal 잔차는 별도의
실제 표현으로 N6에 전달되며 flat이라고 선언하지 않는다.

### 수정 1 — 전역 flat 상수의 두 band 중첩

현재 generic scalar 부등식은 한 band에 대해

\[
\ell^b2^{p\ell}e^{-a\ell^2}
\le C_Nq^Ne^{-a\ell^2/2}\le C_Nq^N
\]

를 준다. meshCount의 2는 **두 sign**을 센다. 한 점에서는
\(|\ell+\log_2q|<3/4\)를 만족하는 정수 band가 최대 두 개이므로
전체 force의 표시된 상수에 추가 2가 필요하다. 현재 코드에는 남은
반 Gaussian의 두 항 합을 1 이하로 만드는 별도 threshold 증명이 없다.

수용된 수정은 global adapter에서 `activeBandCount=2`를 명시하고
`flatConstant=2*K^physicalPower*tail.flatConstant`로 두는 것이다.
`infiniteTail`은 이미 모든 band의 Gaussian 합을 사용하므로 추가 2를
곱하지 않는다. 이는 질적 flatness의 변경이 아니라 표시된 전역 상수의
완성이다. 이 수정 및 실제 재검사는 **대기 중**이다.

## 4. 공분산 7.30과 signed inverse 7.31–7.42

각 local H column에는 실제 cosine-square 평균 1/2와 정규화 Haar
측도가 이미 들어 있다. 두 sign에 다시 1/2를 붙이거나 정수 cover의
차수를 추가하지 않는다. 원래 양의 square root와 실제 inverse로
\(\epsilon Hy=\epsilon T_{0,*}\)를 두 성분 모두 확인한다. 모든
slow squared-partition 후보 81개와 정확히 영인 omitted complement,
원래 물리 지수 \(Q^{-2A}\epsilon(Q/q)^{A+1/2}=q^{-A-1/2}\)를 보존한다.

signed target에는

\[
d_\Sigma=H^{-1}(\Sigma/\epsilon),\quad
\delta a_j=(d_\Sigma)_j/(2a_j)
\]

를 사용한다. 원래 고정 양의 a를 계속 분모로 쓰므로 Sigma의 부호나
상대 크기 제약은 필요하지 않다. witness Sigma=-epsilon*T는 d=-y를
실제로 확인한다. \(\epsilon H(\delta a)^2\)라는 quadratic remainder는
삭제되지 않는다. 원문 7.41의 세 remainder와 별도 전제
\(U\in W_{1/2}\)도 유지하며, 임의 rho에서 이 전제를 추론하지 않는다.

실제 입력을 slow 좌표에 한정하는 것은 원문이 요구하는 angular·auxiliary
독립성과 일치한다. 단, 임의 표현이 M_alpha에 속한다는 권한을 자동으로
발급하지 않는다. class membership와 chart 간 일치는 후속 N6의 별도
의무다. 제공된 interface는 N6 correction을 이미 수행했다고 선언하지
않는다.

### 수정 2 — N6 C/B의 평균을 명시

현재 `covarianceFrame.definition`은 C/B를 평균 없는 원통 성분 곱으로
적는다. 원문 7.23에서 C/B는 이 곱의 **theta 평균 후 Y 평균**이다.
따라서 C/B 정의에는 두 평균을 명시하고, NS에 쓰는 pointwise tensor는
별도 항목으로 유지해야 한다. 실제 Cartesian vector를 원래 theta의
radial/angular/axial basis로 투영하는 코드는 맞다. 전체 잔차를 그
평균으로 바꾸는 수정은 하지 않는다. 표기 수정은 **대기 중**이다.

### 수정 3 — signed-target 호출 시 출처 재검사

현재 공개 `constructSignedLocalTarget` closure는 생성 뒤 physical 또는
band가 바뀌어도 호출 시 private 인증을 다시 하지 않는다. 실제 H와
양의 amplitudes라는 주장을 유지하려면 각 유효 입력 호출에서
`assertActualCommonBandPhysicalCurl(physical)`를 먼저 실행해야 한다.
잘못된 좌표 입력은 값싼 검사로 앞에서 거부하고, 통과한 입력에만 이
출처 검사를 수행하는 수정이 수용되었다. 수정은 **대기 중**이다.

## 5. 물리 미분 캐시의 의미 보존

새 `ActualCommonPhysicalJetExpressions`의 dependsOn/substitute
short-circuit를 기본 AD와 대조했다. coordinate에 대한 의존 여부는
이미 있는 freeCoordinates 집합으로 판단하므로 node×coordinate Map의
폭증을 줄인다. definite integral은 body의 bound coordinate만 제외하고
두 moving limit의 의존성을 포함한다. opaque 원래 function은 명시적인
arguments로 free coordinates를 전달한다.

실제 의존성이 있거나 non-coordinate 변수를 치환할 때는 기존
substitute에 위임한다. 따라서 bound variable의 capture를 피하는
alpha-renaming, moving endpoint, 비영 대체값과 signed coordinate
제약을 유지한다. 원래 독립 smooth-piecewise wrapper가 일부 그대로
남을 수는 있으나 함수값을 바꾸는 최적화는 아니다. 고정 원래 node를
변경하거나 새로운 의미의 연산을 도입하는 결함은 발견하지 못했다.
root의 별도 작은 helper 검사 결과와 이 읽기 검토를 구분한다.

## 6. E_B의 미분 표현 차이: 실행과 분리한 수정안

동결된 E_B binder는 원래 target.W/raw에 담긴 M_eta와 물리 AD가
영 적분을 생략하며 얻은 M_eta를 직접 rational comparison에 섞는다.
별도 작은 fixture에서 이 표현 차이를 재현했다. fixture의 U는 매끄러운
함수이며 M은 그 실제 원시함수다. 원래 함수는 실패하고, 다음 방식의
isolated draft는 4/4, 관측 exit 0으로 끝났다.

1. family.G의 원래 M_eta, F_X, U_X가 physical의 인증된 복제 prefix
   안에 있고 각 node bytes가 같은지 검사한다. 복제 뒤 sibling에서
   새로 만든 root는 거부한다.
2. `leadingDerivativeBodyIdentity`로 모든 원래 branch·적분 body와
   한계를 보존하며 각 old/new 미분의 등식을 먼저 증명한다.
3. 원래 stress flux와 coefficient flux 양쪽에 이 증명된 root 쌍만
   적용하여 두 flux의 등식을 확인한다. 그 등식을 얻은 뒤 coefficient
   flux를 미분한다. 이 순서가 W_X 속의 같은 미분 등식도 정당화한다.
4. M_X=U와 M_etaX=U_eta의 원래 mass/혼합 FTC 권위는 별도로 보존한다.
   어느 shear를 삭제하거나 copied node를 바꾸는 대조는 실패한다.

검사: `node --test .../positive_stress_eb_draft/leading-regular-divergence-draft.test.mjs`,
관측 4/4, exit 0, TAP duration 762.476239ms, 도구 chunk `4f66ba`.
이는 작은 formal/source-formula fixture이며 실제 full E_B 재실행을
대신하지 않는다. 실행 imports는 아직 변경하지 않았다.

draft SHA-256:

| 파일 | SHA-256 |
| --- | --- |
| `actual-common-band-background-residual-draft.mjs` | `03f3e6f037ff8c2da0ca0e2b8b4cafcef88f592ca1128a179d5c69e5c08b1e74` |
| `leading-derivative-pairs.mjs` | `9b8382889829feabbb96af9a38bfdb12a020e7c744b5106319461c21bbc79fa9` |
| `leading-regular-divergence-draft.test.mjs` | `72721678c5586f3137be82eb5fdd25cd4b5375ae523e1ffe9d7f25fc929ff3b8` |

이 문서가 발급하는 실행 범위는 위 4개 작은 검사뿐이다. 큰 통합 실행의
최종 결과와 세 root 수정 및 E_B 정식 적용은 후속 process·source hash·
certificate 검토가 필요하다. 전체 M2, M3 및 새 Lean kernel 증명을
이 독립 리뷰로 인증하지 않는다.

## 7. source attempt3 종료 뒤 적용 대조

실제 process receipt를 다시 읽었다. attempt3는
2026-10-11 11:21:22 UTC부터 11:33:22 UTC까지 실행되었으며,
720초 timeout, exit 1, 관측 통과 검사 5개, `complete=false`다.
부분 source JSON SHA는
`65c199e14f87abd297a40eae4749f273f35d85ff5d83e19dc32dd75b0292b957`이다.
이 packet에는 physical, target, globalWave, covariance와 main theorem
certificate가 있으나 실제 E_B certificate는 없다. main theorem은
앞선 attempt2와 같은 graph SHA 및 내부 8개·validator 6개 성공이다.
전체 통합 성공으로 승격하지 않는다.

root가 세 사항을 적용한 실제 파일을 다시 읽었다.

| 수정 후 파일 | SHA-256 | 읽기 대조 결과 |
| --- | --- | --- |
| `actual-common-global-wave-bounds.mjs` | `63262e2bc53e2032fab12cfc8e1eac61021cc4728b8e5f49a5623fc9aa9089ad` | activeBandCount=2가 flatConstant와 검사에 들어가고 infiniteTail은 전체 합 그대로다. |
| `actual-common-global-covariance.mjs` | `2541b28f946be22c96480400ad91259f81f7d061cbf473632db5d0cec1b001ff` | C_raw/B_raw와 두 번 평균하는 C/B가 구분되며, 유효 signed 호출은 실제 physical private 인증을 다시 실행한다. |

세 수정은 지적한 문제를 해결한다. 새로운 수학적 문제는 이 변경에서
발견하지 못했다. **수정 뒤 큰 실제 source 재실행은 아직 대기 중**이다.
따라서 위의 변경 전 global certificate를 이 새 SHA의 실행 증거로
인용하지 않는다.

E_B 정식 적용 파일은
`actual-common-band-background-residual.mjs`, SHA
`3d55f1cc8044631b6d45af357190a40d5a890b47bb35c5eba46a1d0f8011deee`이며,
새 generic helper는 `copiedLeadingDerivativePairs`와
`leadingRegularDivergenceBodyBinding`이다. 두 helper는 private source
인증을 자체 발급하지 않는다. 실제 private adapter가 원래 family,
physical 및 그 복제 prefix를 확인한 뒤 사용한다.

정식 작은 검사
`tests/actual-common-leading-regular-divergence.test.mjs`의 SHA는
`3d2d64ecf4dad6f2ecf4ec3f195363dae9376fac2a42426c105544f1dc366a6d`이며,
4/4, 관측 exit 0, TAP duration 778.536259ms다. 기록은
`leading-regular-divergence-fix-attempt1.json`과 그 snapshot 디렉터리다.
source attempt3의 수정 전 E_B snapshot도 그대로 보존했다.
검토자가 직접 수정한 E_B의 정식 적용은 root 또는 다른 agent의
추가 독립 읽기 검토와 후속 실제 source 실행이 필요하다.
