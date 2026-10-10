# N4-04: 실제 1·2차 배경의 radial cutoff, 다섯 모멘트 복구와 응력 지지

## 1. 구현한 결과와 원문 기준

이 구현은 보관된 동일 N3 프로필 `same-profile-2026-10-10.3`에서 실제
1차와 2차 계수를 구성한다. 각 차수의 다섯 **전체** 모멘트를 입력으로
연속 모멘트 행렬을 역산하고, 보정된 함수로 다음 차수 소스를 만든다.
응력은 원래 잔차의 부호 있는 적분으로 구성하며, 두 차수의 서로 다른
지지구간을 내부 PDE·외부 0·보존 적분식으로 확인한다.

기준은 `evidence/original-m2-criteria.json`의 다음 원문이다.

> **N4-04 — 차수별 radial cutoff와 모멘트 복구**, 청사진 58쪽.
> Lemma5.2에 따라 En,Un을 확장하고 Vn, Πn을 재구성한 뒤
> (5.10)-(5.12)의 다섯 total moments를 0으로 맞춘다. 합격:
> n차수의 moment correction 완료 전 n+1 source 생성 금지.
> n=1과 n≥2의 다른 Tn support를 각각 검사한다.

여기서 완료한 것은 **실제 차수 1과 2를 사용하는 원문 유한 구현 기준**이다.
모든 자연수 차수의 계수·미분 노름·시간 cutoff 수열을 생성했다고 주장하지
않는다. 전역 부호 있는 모멘트의 소수값이나 전체 NS 잔차의 수치 포락구간도
이 결과의 범위에 포함하지 않는다. 이 구분은 실행 결과의 `scope`에 있다.

## 2. 수치 중간값 없이 실제 함수가 지정되는 방식

`actual-continuation-exact-*` 파일은 하나의 명시적 함수 프로그램을 만든다.
적분에는 실제 integrand·적분 변수·양 끝점이 들어 있다. 자연 급수에는 실제
계수 재귀와 0으로 수렴하는 Bρ 꼬리가 들어 있고, Picard 해에는 원래 여섯
성분 행렬·forcing·영 축 데이터·공통 구간·Cauchy 손실·수렴 꼬리가 붙는다.
암시적 근에는 실제 연속 행렬, 실제 입력 모멘트, 선택 근과 수축 상계가 있다.

다음 전체 의존성을 유지한다.

1. 전체 A.21 압력과 양의 `g`, 실제 비선형 B.14–B.15 자연 급수.
2. B.22 기준 모멘트, B.26 실제 전이, B.34 정렬, 원래 U 복원.
3. 실제 다섯 입력 오차를 소비하는 B.8 근과 전체 pre-C12 함수.
4. 원래 `N=1+ceil(R^50)`를 사용하는 C.12 원주 역함수와 진동,
   그 실제 다섯 변화량을 소비하는 I1 연속 근.
5. 전체 A.2 외곽 E, 각운동량 보정, A.13 기다림, 무한 열 꼬리와 실제
   세 열 모멘트, 이를 복원하는 I2 E 전용 근.
6. 실제 1차 내부 forcing → cutoff → 전체 다섯 모멘트 → Ipos 역행렬.
7. **완료된 1차** 함수 → 실제 2차 forcing → 같은 공통 내부 구간 →
   전체 비선형 lower-order 모멘트 → 2차 Ipos 복구.

고정 오차의 Bessel 비교함수나 supplied probe를 이 실제 함수로 바꾸어
표시하지 않는다. 거대한 원래 상수를 더 작은 값으로 치환하지 않는다.
표시용 유한 Picard 항이나 근의 유한 반복을 수렴 극한과 동일시하지 않는다.

### 핵심 정규화

\[
X=R^2/2,\quad F_n=E_n/R=\phi_n/C,\quad
A=\tfrac12+h,\quad D=\tfrac12-h,\quad
d=1-\eta^2,\quad L=1-2h\eta^2.
\]

차수 이동은 \(\nu_n=2nh\)이다. 외곽 power 구간의
\(\lambda=\exp(-1000T)\)와 혼동하지 않는다. 둘 다 코드에서 원래 양의
식으로 남아 있다.

## 3. 실제 다섯 전체 모멘트

모든 적분은 해당 함수의 전체 지지와 필요한 lower-order 항을 포함한다.
다음 표는 공개 표에 표시되는 실제 물리적 모멘트이다.

| 행 | 1차 | 2차 |
|---|---|---|
| 1 | \(\int R U_1\,dR\) | \(\int R U_2\,dR\) |
| 2 | \(\int R^2 E_1\,dR\) | \(\int R^2 E_2\,dR\) |
| 3 | \(\int(2E_0E_1-\Omega_0)\,dR/R\) | \(\int(2E_0E_2+E_1^2-\Omega_1)\,dR/R\) |
| 4 | \(\int R^2(U_0E_1+U_1E_0)\,dR\) | \(\int R^2(U_0E_2+U_1E_1+U_2E_0)\,dR\) |
| 5 | \(\int R(2U_0U_1-E_0E_1+\Omega_0/2)\,dR\) | \(\int R(2U_0U_2+U_1^2-E_0E_2-E_1^2/2+\Omega_1/2)\,dR\) |

특히 2차의 \(F_1^2, U_1F_1, U_1^2-XF_1^2,\Omega_1\)는 보정된
전역 1차 함수로 계산한다. 내부 축 부근만 적분하거나, Ipos 보정 이후
부분을 생략하지 않는다. `Xkeep < X < a²`에서도 실제로 이미 적용된
1차 cutoff를 유지한다.

Ipos에서 U의 2×2 블록과 E의 3×3 블록은 실제 bump 연속 적분이다.
U의 두 power 행이 작은 \(\lambda\) 때문에 겹쳐 보이는 문제는 confluent
행으로 처리한다. 원래 두 번째 행은 `row0 − 2*lambda*confluentRow1`이다.
양의 \(\lambda\), 물리적 반경·진폭 스케일과 determinant 상계를 보존한다.
`sourceGraphRationalIdentity`는 이 **실제 행렬·실제 rhs**의 adjugate 계산을
BigInt 유리함수로 전개해 10개 residual의 분자를 정확히 0으로 확인한다.
분모의 비영성은 별도의 연속 행렬·양의 소스 스케일 증거에 의존한다.

모멘트가 0이라는 결론은 소수로 평가한 입력 오차가 작다는 뜻이 아니다.
원래 입력 함수와 그 입력으로 구성한 보정 함수가 정확히 상쇄된다는 뜻이다.
공개 결과는 `rawDebtRoot`, `correctionRoot`, `correctedResidualRoot`를
각각 남기며 부호 있는 입력 모멘트의 크기를 만들어내지 않는다.

## 4. 다음 차수의 생성 조건

`assertActualFirstOrderCompleted`와 `assertActualSecondOrderCompleted`는
실제 생성 함수가 만든 live instance만 받는다. 다음 항목을 검사한다.

- 같은 프로필·정확한 원래 파라미터와 함수 그래프 prefix.
- 원래 필드 roots와 미분 함수·Picard·암시적 근의 정의.
- 실제 다섯 모멘트 복구의 unchanged 결과.

복사한 JSON, `momentsComplete: true`, 외부 입력 모멘트, 바뀐 그래프 또는
수정된 공유 integrand는 통과하지 못한다. 새로운 노드를 덧붙이는 정상적인
재구성은 허용한다. 2차 소스는 이 검사를 통과한 실제 1차 인스턴스를 소비한다.
2차 gate가 다음 차수의 전제 검사를 할 수 있다는 사실을 실제 3차 생성으로
표시하지 않는다.

## 5. 응력 지지와 내부 방정식

\[
X_- =X_a e^{t_1/128},\quad
X_{\rm keep}=X_a e^{t_1/64},\quad
X_{\rm cut}=X_a e^{t_1/32},\quad
a^2=X_a e^{t_1/16},\quad X_+=eX_v.
\]

실행된 소스 순서 검사는
\(X_-<X_{\rm keep}<X_{\rm cut}<a^2<I_{\rm pos,left}
<I_{\rm pos,right}<X_v<X_+<X_b\)를 원래 식으로 확인한다.
`Xb`는 실제 A.2 최종 stage 끝점이다. `Tf=128`, 양의 stage 길이,
\(\lambda>h\), A.13의 \(Q_b>Q_p>0\)를 사용하며, 숫자 underflow 후의
좌표 비교를 사용하지 않는다.

| 성분 | 검사한 원래 지지 |
|---|---|
| \(T^\theta_1\) | \([X_-,X_b]\) |
| \(T^z_1\) | \([X_-,X_+]\) |
| \(T^\theta_2\), \(T^z_2\) | \([X_-,X_+]\) |

왼쪽에 0 branch를 두는 근거는 실제 내부 PDE이다.
`actual-continuation-exact-pde-proof.mjs`는 보관된 각 차수의 실제
\(A_0,A_1,f\)를 사용해 F/U 미분, 평균, 압력, 두 tangential 잔차의
여섯 항등식을 정확히 전개한다. 원래 대각선은 `[0,0,2,0,3,1]`이다.
forcing을 하나 빼는 음성 대조는 실패한다.

축 미분은 singular ODE의 실제 Taylor 계수로 계산한다.
\(W=\sum w_j\xi^j\), \(w_0=0\)에서
\[
w_{1,i}=f_i(0)/(1+c_i),\qquad
(2+c_i)w_{2,i}=f_i'(0)+(A_0(0)w_1+A_1(0)\partial_\eta w_1)_i.
\]
짝함수의 첫 X 미분은 \(w_2\)다. 이 방식은 축에서 0에 곱해질 거대한
미분 그래프를 먼저 전개하지 않으면서 실제 계수를 유지한다.
\(\Pi_{1,X}(0)\)의 비영 원식과 \(\Pi_{2,X}(0)\)의 실제 0 상쇄를 각각
원래 pressure integrand와 확인한다. 비영 node ID를 비영 수학 값으로
해석하지 않는다.

오른쪽 0은 source support reducer가 실제 각 항의 외부 branch를 확인한다.
compact integrand의 부정적분을 저절로 0으로 취급하지 않는다. 부호 있는
전방·후방 응력 적분이 같은 이유는 다음 전체 보존 적분식이다.

## 6. 보존 적분식과 열 보정 전 상수항

\[
\overline T_a m=(-am+D\eta m_\eta)/L,\qquad
\overline Z_a m=(2a\eta m+d m_\eta)/L.
\]

원문 (5.20)–(5.21)은 다섯 실제 보정 모멘트 및 lower-order 모멘트에 이
연산자를 적용한 식이다. `exact-conservation.mjs`는 실제 residual body를
가진 zero-function과 그 \(\eta\) 미분 0–2차를 사용해 네 총적분을 0으로
환원한다. 이전 차수의 viscosity 지수 이동과 압력 부분적분을 유지한다.

1차 angular viscosity에는 원래 (5.19)의 **전체** leading subtracted moment가
필요하다. `exact-leading-conservation.mjs`는 열 변화량만으로 이 상수항을
0이라고 결론 내리지 않는다. 다음 원래 사슬을 연결한다.

\[
I=\int_0^X\sqrt{2s}\,E(s)\,ds,\quad H=\sqrt{2X}E,\quad
r=I/(XH),\quad Q=(1-h)r-1.
\]

- 실제 B8와 I1의 angular 입력 오차와 그 근에 의한 보정을 각각 상쇄한다.
- A.2의 실제 각운동량 행은 `r_release−1/(1−lambda)`를 0으로 만든다.
  steepen/flatten의 homogeneous factor는
  \(\exp[-(1-\lambda)/2-(1-h)/2]\)다.
- 실제 기다림은 \(\log(Q_b/Q_p)/(1-h)\)다. 양의 실제 \(Q_b,Q_p\)와
  지수의 정확한 항등식을 확인한 뒤
  \(\exp[-(1-h)wait]=Q_p/Q_b\)를 사용한다.
- terminal 구간에서
  \(J=e^{(1-h)s}f_o(s)/(1-\rho)\)이고
  \((JQ)'=-e^{(1-h)s}f_o'(s)/(1-\rho)\)다.
  실제 A.13 \(Q_p\) 적분은 `sigma((s−1)/2)`의 **1/2 미분 계수**와
  구간 1–3의 전체 손실을 포함한다. 이 ODE도 실제 그래프로 검사한다.
- 물리적 계수 \(X_{start}H_{start}/(1-h)\)를 곱하면 열 보정 전의
  \(I-I_{pow}\) 상수항이 된다. 그 뒤 실제 heat 변화와 I2 변화가 상쇄된다.

wait, 실제 angular correction 또는 B8 angular correction을 빠뜨린 음성
대조는 각각 실패한다. 무한 열 꼬리의 양의 적분과 \(1/h\) 의존성은
버리지 않는다. 외부 \(F=C_*X^b H(2(1-\eta^2)/X)\)의 \(Z_bF=0\) 검사도
열 함수와 그 도함수를 유지하며 수행한다.

## 7. 공개 API와 화면 해석

```js
import {
  actualBackgroundMomentCertificate,
  compileActualBackgroundMomentProgram,
} from './actual-continuation-exact-certificate.mjs';

const receipt = await actualBackgroundMomentCertificate({
  sourceProfile: 'same-profile-2026-10-10.3',
  terms: 0,
  bits: 128,
  etaOrder: 2,
  heatIterations: 0,
});
```

`terms`와 `heatIterations`는 **표시할 유한 근사 식의 수**다. 0을 선택해도
실제 함수는 지정된 수렴 극한으로 구성된다. 0차 함수·0 벡터로 대체하지
않는다. `bits`는 실제 Picard 꼬리의 목표이며, 전체 signed moment를 그
정밀도로 수치 적분했다는 뜻이 아니다.

주요 공개 필드는 다음과 같다.

| 필드 | 의미 |
|---|---|
| `momentIdentities` | 10개의 실제 raw/correction/residual roots와 정확한 0 증거 |
| `supportRows` | 네 실제 응력 root, 원래 끝점 root와 내부·외부·보존 증거 |
| `sourceGates` | 복구 전·복사 보고서 거부와 복구 후 허용 |
| `continuousInverse` | 실제 2×2/3×3 행렬, determinant 및 비영 상계 |
| `innerProofs`, `conservation` | 실제 PDE와 전역 보존·열 invariant의 실행 흔적 |
| `graph` | 전체 프로그램 SHA-256, node 수, roots, compiler와 동일 재현 입력 |
| `scope` | 원문 유한 기준과 수치·all-order·formal proof 범위의 구분 |

공개 receipt는 전체 그래프를 여러 번 전송하지 않는다.
`compileActualBackgroundMomentProgram(input)`으로 **동일한 단일 전체 DAG**를
재구성할 수 있고, `canonicalStringify`와 WebCrypto `sha256`으로 receipt의
digest와 대조할 수 있다. SHA는 실제 프로그램과 모든 함수 정의·roots·증거를
포함한 빌드 재현 digest이며, 라이브 HTML 자체의 digest가 아니다.

지지 그림의 균등 간격은 `Xminus`, `Xplus`, `Xb`의 **순서 순위**이다.
거대한 실제 X값이나 로그 거리의 수치 그래프로 표시하지 않는다.
적분 표의 0은 실제 입력 모멘트 크기의 추정값이 아니라 상쇄 항등식이다.

## 8. 소스 파일과 재현 명령

전체 소스 의존 파일 및 SHA는
`tests/actual-continuation-exact-manifest.json`에 기록한다. 원래 N3 자료와
원문 PDF 해시는 기존 pinned source 자료를 보존한다. 주요 구현 층은 다음과 같다.

| 파일 | 역할 |
|---|---|
| `exact-core`, `exact-tail`, `exact-functions` | 실제 급수·수렴 극한·AD·공유 함수 |
| `exact-pregluing`, `exact-b8`, `exact-loop`, `exact-global` | 실제 전체 leading 단계와 I1 |
| `exact-inner`, `exact-order-one` | 1차 내부·다섯 모멘트 복구 |
| `exact-order-two-source`, `exact-order-two` | 완료된 1차에서 2차 생성·복구 |
| `exact-heat` | 전체 E0, 실제 heat 및 I2 |
| `exact-stress`, `exact-order-two-stress` | 실제 두 차수의 raw 잔차와 응력 적분 |
| `exact-support`, `exact-pde-proof` | 소스 순서·외부 0·실제 내부 PDE |
| `exact-leading-conservation`, `exact-conservation` | 전체 (5.19)와 네 보존 총적분 |
| `exact-identities`, `exact-linear`, `exact-certificate` | 정확한 항등식과 공개 receipt |

위 짧은 파일 이름에는 모두 `actual-continuation-` 접두사와 `.mjs` 확장자가
붙는다. 저장소 루트에서 실행한다.

```bash
node --test \
  research-ide/mathscope-m2/navier/tests/actual-continuation-exact.test.mjs \
  research-ide/mathscope-m2/navier/tests/actual-continuation-global.test.mjs \
  research-ide/mathscope-m2/navier/tests/actual-continuation-stress.test.mjs \
  research-ide/mathscope-m2/navier/tests/actual-continuation-functions.test.mjs \
  research-ide/mathscope-m2/navier/tests/actual-continuation-certificate.test.mjs

python research-ide/mathscope-m2/navier/tests/actual-continuation-conservation-independent.py
```

이 묶음은 **Node 49개**와 **독립 Fraction 항등식 12개 + 누락 음성 대조 12개**를
검사한다. Fraction 검사는 별도로 구현한 유리수 Taylor·다항식 적분으로
원래 잔차와 보존 적분식을 대조하며, manufactured field를 실제 N3 값으로
부르지 않는다. 원래 stage join의 유한 binary64 대조도 별도 diagnostic이며
원래 파라미터의 수치 인증이 아니다.

함수 공유의 혼합 AD, moving endpoint, alpha-renaming, 한계 미분 거부,
0의 음수 거듭제곱·0/0 거부, 복사·변조 gate, 축 jet, compact primitive
오판, 원문 문언 보존과 전체 프로그램 SHA replay를 함께 확인한다.

검증 증거는 `evidence/actual-moment-restoration.json`을 참조한다. 라이브
브라우저·Worker·표·지지 그림의 최종 배포 검사는 루트 release audit에 별도로
기록한다. 이 소스 검사 결과를 라이브 검사 완료 수치로 자동 승격하지 않는다.
