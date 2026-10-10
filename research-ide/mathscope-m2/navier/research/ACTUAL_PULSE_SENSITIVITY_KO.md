# Actual source pulse의 첫 slow 미분: 추가 구성과 공개 범위

이 문서는 원래 M2의 64개 유한 수용 항목 판정을 바꾸지 않는다. 추가 모듈은
N5 패키지에서 실제 source wave를 full curl로 연결할 때 필요한 입력 하나,
즉 실제 pulse amplitude의 첫 slow 미분을 구성한다. `fullSameProfileN5`,
실제 cutoff potential의 전체 curl, physical residual과 flat-error 패키지는
이 추가 결과만으로 완료되지 않는다.

## 1. 원래 source와 새 입력 계약

`actual-pulse-sensitivity.mjs`는 `prepareActualCovarianceOperator`가 새로 생성한
실제 completed background, 두 부호의 carrier, moving frame, 원래 `wMatrix`,
정규화된 initial datum을 그대로 사용한다. 기존 sealed covariance 모듈은
수정하지 않는다. 작은 다항식 검증 예제는 별도 테스트에만 사용한다.

공개 구성 함수는 `prepareActualPulseSensitivityProgram`이고, 해시와 표에 필요한
작은 결과를 반환하는 함수는 비동기 `actualPulseSensitivityCertificate`이다.

```js
await actualPulseSensitivityCertificate({
  ellExact: '1',
  slowCoordinate: 'R', // 'R' | 'Z' | 'T'
  derivativeOrder: 1,
  terms: 0
});
```

생략 시 위 값이 기본값이다. `sourceProfile`은 기존 실제 source identity만
허용한다. 이 공개 버전은 실제 원래 band `ell=1`을 그대로 실행한다. 다른
양의 band, canonical anchor, 양의 finite display term 수는 그래프 생성 전에
`RESOURCE_LIMIT`으로 거절한다. 검증한 band로 조용히 바꾸지 않는다.
2차·혼합 slow 미분과 대표점·정수 carrier·label의 미분은 `UNSUPPORTED`이다.
행렬, 미분 행렬, norm 상수, 완료 flag를 요청에 넣을 수 없다.

여기서 slow 미분은 pulse time `v`와 선택한 band, dyadic `Q`, 정수 carrier,
대표점 및 auxiliary label을 고정한 ordinary partial이다. 실제 source의
enlarged chart 전체와 `0 <= v <= Ls`에 대한 bound를 사용하며, chart 경계의
미분은 해당 방향의 한쪽 미분이다. 실행한 `ell=1` band가 covariance 양성에
필요한 공통 `q*` 아래라고 주장하지 않는다. 이 단계의 선형 ODE 미분에는
그 양성 결론이 필요하지 않다.

## 2. 실제 계수와 datum을 미분한 4성분 Volterra 계

일반 커널 `actual-pulse-sensitivity-kernel.mjs`는 다음의 2성분 계에서 출발한다.

\[
  w_v=M(v,a)w,\qquad w(l(a),a)=g(a),\qquad s=\partial_a w.
\]

`M_a`, `g_a`, `l_a`는 입력 body를 ordinary chain/product rule로 직접 미분한다.
caller가 미분 행렬이나 영 datum을 선언할 수 없다. 미분 계와 initial condition은

\[
  s_v=Ms+M_aw,\qquad
  s(l(a),a)=g_a-M(l(a),a)g\,l_a,
\]

이다. 따라서 `Y=(w,s)`는 실제 block matrix

\[
  \mathcal M=\begin{pmatrix}M&0\\M_a&M\end{pmatrix}
\]

를 갖는 4성분 Volterra 계로 구성된다. `M_a w`를 버리거나, 움직이는 왼쪽
끝점의 boundary term을 영으로 설정하지 않는다. 평가점도 움직이면

\[
  \frac{d}{da}w(b(a),a)=s(b(a),a)+M(b(a),a)w(b(a),a)b_a
\]

를 적용한다. 일반 커널 테스트는 `g_a`, `l_a`, `b_a`가 실제로 영이 아닌
서로 독립적인 예제를 포함한다.

원래 실제 source의 **정규화된** pulse는 `g=(1,0)`, `l=0`, `L=Ls`이므로,
고정 label의 세 slow 미분에서 `g_a=l_a=L_a=0`이다. 이 값은 source 식의
미분 결과로 확인한다. 원래 물리 amplitude의 initial datum을 상수로
가정하는 것과는 다르다.

## 3. 실제 amplitude와 envelope factor

기존 source amplitude는 `t=B P w`이다. `B`는 원래 cylindrical moving basis이며
`P=exp(integral(lambda-dref))`는 원래 positive reference envelope이다. 고정한
대표점과 label에 대한 local slow 미분에서는 `P_a=0`이 실제 식에서 계산되지만,
`P(v)` 자체는 1로 대체하지 않는다. 새 source derivative는

\[
  \partial_a t=P(v)\bigl((\partial_a B)w+B s\bigr)
\]

이다. `R` 방향에서는 실제 `B(0)`의 미분이 남는다. `Z`, `T` 방향 initial
frame 미분은 원래 frame의 식에서 영임을 확인한다. 두 부호, 세 성분의
여섯 amplitude 식에서 이 곱 미분 항등식을 별도로 검증했다.

결과에는 왼쪽, 중간, 오른쪽의 세 endpoint에서 `d_a t(b(a),a)`가 포함된다.
source adapter는 composed endpoint 식을 실제로 미분한다. 이 source 계약의
`b_a=0`은 계산 결과이며, 일반 커널의 움직이는 endpoint 테스트는 추가
`t_v b_a` 항이 빠지면 실패한다.

## 4. source에서 만든 연속 norm과 수렴 tail

`actual-pulse-sensitivity-bounds.mjs`는 실제 `M`과 `B`의 AST를 방문한다.
기존 actual completed enlarged C2 bound를 포함하는 `Bnorm`을 이용하여
`F`, `G`의 첫째·둘째 slow 미분을 bound하고, 모든 합, 곱, 역수, 양의
제곱근의 첫 미분에 triangle/Leibniz/chain rule을 적용한다. sampled maximum과
사용자 제공 derivative constant는 사용하지 않는다. 지원하지 않는 source
함수 또는 lower bound가 없는 분모를 발견하면 중단한다.

특히 moving frame의 분모는 실제 고정 carrier에서 다음과 같이 제어한다.

\[
  |n_{\rm tan}|\ge |p|/R\ge 1/(k\,B_{\rm norm}),
\]

왜냐하면 `k*p`는 영이 아닌 정수이고 enlarged chart에서 `R <= Bnorm`이기
때문이다. `|c0| >= 1/Bnorm`, `sqrt(1+sref^2) >= 1`,
`Ls >= 2^-33 >= 1/Bnorm`도 원래 frozen source bound에서 온다. 이를 실제
역수·제곱근 node의 lower bound에 연결한다. 최종 행합 norm은 sample 좌표와
pulse time을 자유변수로 포함하지 않는다.

`||M|| <= K`, `||M_a|| <= Ka`, `||g|| <= I0`, `||g_a|| <= Ia`,
`|l_a| <= La`이면

\[
  \|\mathcal M\|\le K+K_a,\qquad
  \|Y(l)\|\le I=\max(I_0,I_a+K I_0L_a).
\]

순서가 있는 Volterra 적분의 N차 partial sum `Y_N`에 대해

\[
  \|Y-Y_N\|\le
  I\exp((K+K_a)L)\frac{((K+K_a)L)^{N+1}}{(N+1)!}=:E_N.
\]

고정된 실제 band와 source에서는 모든 상수가 유한하므로 `E_N -> 0`이다.
계수와 datum의 첫 미분이 연속이며 위 uniform bound를 갖기 때문에
parameter 미분한 ordered series도 수렴한다. 따라서 augmented solution의
뒤 두 성분은 원래 해의 첫 parameter 미분이다. 일반 커널에서 norm은 명시적
가정이고 `sourceNormAuthenticated=false`이다. 실제 source adapter만 위
실제 source 식과 bound를 연결하여 결과를 인증한다.

Amplitude derivative의 별도 absolute tail은

\[
  \|\partial_a t-(\partial_a t)_N\|
  \le P(v)\bigl(\|B\|+\|\partial_a B\|\bigr)E_N
\]

이다. `P(v)>0`이라는 원래 정의를 사용하며, envelope factor를 누락하지
않는다. 공개 `terms=0`은 initial term을 표시하는 선택일 뿐이다. 0차 유한합을
해나 수치 근사 정확도로 판정하지 않고, 위의 영이 아닌 tail을 별도로 반환한다.
일반 커널의 finite ordered-integral 생성기는 0–32항을 지원하지만, 실제 source
의 양의 항 materialization은 현재 공개 worker 자원 범위에 포함하지 않는다.

## 5. 검증과 실행 범위

다음 검증은 기존 source evidence나 64개 criteria manifest를 덮어쓰지 않는다.

| 검증 | 확인한 내용 | 결과 |
|---|---|---:|
| `tests/actual-pulse-sensitivity-kernel.test.mjs` | 비가환 시간 의존 행렬의 0–5차 ordered series, `M_a`와 initial 미분 항의 독립적인 누락 대조군, 움직이는 양 끝점, factorial tail, 2차 미분 거절 | 7/7 |
| `tests/actual-pulse-sensitivity-independent.py` | 별도 Fraction 다항식 대수와 parameter 미분, 90자리 Decimal exponential tail 확인 | 43/43 |
| `tests/actual-pulse-sensitivity-source.test.mjs` | 실제 두 부호 `M_a`, 연속 source bound, 여섯 amplitude 곱 미분 식, `P`가 남은 tail, matrix/initial/graph/copy 위조와 잘못된 요청 거절 | 4/4 |
| `tests/actual-pulse-sensitivity-live.mjs R`, `Z`, `T` | 각 축을 별도 프로세스에서 실행하여 실제 source 결과 생성 | 각 7/7 내부 확인 |

공개 결과는 SHA-256, 재구성 compiler input, 6개 amplitude derivative row,
6개 endpoint row, 두 실제 ODE의 body와 derivative root, tail 및 scope를
포함한다. 전체 source graph를 결과에 중복 전송하지 않는다. private
construction identity와 원래 graph/함수/계수/datum snapshot을 검사하므로,
복사한 결과 객체나 caller가 바꾼 body는 source 인증으로 인정하지 않는다.

Node에서 실제 각 축의 결과 생성은 약 18–20초, peak RSS 약 1.20–1.21 GiB,
반환 JSON 약 17.4 kB였다. 이는 수학식과 provenance를 생성하는 시간이며
수치 quadrature 시간은 아니다. 전체 내부 serialized graph는 약 8.76 MB다.
실제 graph는 한 worker에서 하나씩 만들고 완료 후 해제해야 한다. 모든
요청을 동시에 계산하는 테스트는 이 공개 자원 계약에 포함되지 않는다.

다음의 재현 명령은 actual source graph를 직렬 실행한다.

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-pulse-sensitivity-kernel.test.mjs
python3 research-ide/mathscope-m2/navier/tests/actual-pulse-sensitivity-independent.py
node --max-old-space-size=2048 --test research-ide/mathscope-m2/navier/tests/actual-pulse-sensitivity-source.test.mjs
node --max-old-space-size=2048 research-ide/mathscope-m2/navier/tests/actual-pulse-sensitivity-live.mjs R
node --max-old-space-size=2048 research-ide/mathscope-m2/navier/tests/actual-pulse-sensitivity-live.mjs Z
node --max-old-space-size=2048 research-ide/mathscope-m2/navier/tests/actual-pulse-sensitivity-live.mjs T
```

## 6. 다음으로 연결할 실제 source 작업

현재 결과는 actual pulse의 첫 slow derivative와 그 수렴 tail이다. 다음에는
이 derivative를 실제 covariance 적분과 positive inverse weight의 미분에
연결하고, 실제 cutoff potential의 전체 curl을 조립해야 한다. 2차 이상 slow
미분, 모든 Gaussian label의 uniform bound, 최종 stress/residual/flat-error
bound는 별도 의무로 남는다. 이번 결과는 이 의무나 새로운 Lean kernel
proof를 완료했다고 표시하지 않는다.
