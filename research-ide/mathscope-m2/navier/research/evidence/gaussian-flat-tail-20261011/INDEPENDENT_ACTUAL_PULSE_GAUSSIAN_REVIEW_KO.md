# 실제 homogeneous pulse Gaussian 꼬리 독립 검토

## 1. 검토 대상과 결론

2026-10-11에 `actual-pulse-gaussian-power-kernel.mjs`, `actual-gaussian-flat-tail-kernel.mjs`, `actual-pulse-gaussian-tail.mjs` 전체, `ACTUAL_PULSE_GAUSSIAN_TAIL_KO.md`, 실제 source 검사와 attempt3의 certificate/process/TAP을 읽었다. 추가 실제 source 실행은 하지 않았다. 원본 `actual-covariance-operator-bounds.mjs`의 primitive 유도와 원래 frame 식도 대조했다.

**기록된 terminal 영역의 실제 bare homogeneous pulse에 대한 안정한 propagator, fast-v 도함수 및 cutoff Gaussian 꼬리 추정에서 수학적 결함을 찾지 못했다.** 이것은 아래 범위의 서술형 수학·소스 결속 검토이며, 모든 label의 진폭, covariance weight 도함수, 물리 잔차 또는 Lean 해석학 증명의 완료 판정이 아니다.

## 2. 원시 상계와 안정한 방정식

모듈이 사용하는 B는 임의로 공급한 수가 아니다. 기존 private source의 norm 합과 동일하며, `actualOperatorPowerAudit` 및 `primitiveDerivation`의 원래 completed C2, 대표점 거리, carrier rounding과 radial cancellation에서 다음 상계를 가져온다.

\[
|n|\le B^4,\quad |n'|\le B^{12}/S,
\quad |n_{tan}|,|n|\ge B^{-2},\quad |c_0|\ge B^{-1}.
\]

고정 slow 점에서 n은 v의 affine 함수이므로 높은 v 미분의 영값은 실제 본문에서 나온다. 이를 slow 고차 미분의 영값으로 사용하지 않는다. `S>=B^512` 및 원래 small-q 조건이 유지된다.

원래 moving pressure와 B′를 포함한 행렬을

\[
M=\operatorname{diag}(0,-2\lambda)+E_{actual}-(d-d_{ref})I
\]

로 쓰는 항등식은 코드의 원래 projected matrix와 일치한다. 각 error entry의 E/S 상계에서 무한 logarithmic norm은 `(2E+Ed)/S` 이하이다. 둘째 대각의 음수항을 상계에서 제외할 수 있으므로, `Ls<=Lmax*S`와 초기값 `(1,0)`은

\[
\|w(v)\|_\infty\le \exp((2E+E_d)L_{max})=W
\]

를 준다. 같은 상계는 모든 순방향 propagator 구간에 적용된다. W를 1에 가깝다고 가정하지 않고, source-only 양수 표현으로 남기는 점이 정확하다.

## 3. fast-v 미분과 Gaussian 계수

power ledger의 합·곱·역수·양의 제곱근 재귀를 확인했다. 보통 미분의 binomial 계수, 모든 역수 하계, B′를 위해 필요한 추가 한 차수가 유지된다. 생략된 마지막 derivative row는 정확한 영으로 표기되지 않는다. w 미분에는 W가 한 번, P 미분에는 P가 한 번 들어가므로, 최종 `Bframe*P*w` 추정이 W를 불필요하게 제곱하지 않는다. 실제 0·1·2차 결과 `p=(14,66,119)`는 제시한 재귀와 일치한다.

`s_ref=±u eta_time`, `eta_time=1/2+v/Ls`라고 쓰면 원래 적분 인자는

\[
\rho=\frac{\lambda_0}{\sqrt{1+u^2\eta_{time}^2}}
-\frac{\lambda_0(1+u^2\eta_{time}^2)}{(1+u^2)^{3/2}}.
\]

따라서

\[
\rho'=-\frac{\lambda_0u^2\eta_{time}}{L_s}
\left[(1+u^2\eta_{time}^2)^{-3/2}+2(1+u^2)^{-3/2}\right]
\le-\frac{\lambda_{lower}}{2uL_s}.
\]

여기에는 `eta_time>=1/2`와 `u>=2`가 사용된다. `rho(Ls/2)=0`을 적분하면 양쪽 v 방향에서

\[
P(v)\le \exp\left[-\frac{\lambda_{lower}}{4uL_s}(v-L_s/2)^2\right]
\]

가 성립한다. 원래 ψ의 모든 양의 차수 미분은 중앙에서 `Ls/4` 이상 떨어진 곳에만 지지되므로, `Ls>=2r0*S`는 정확히 `a=r0*lambdaLower/(32u)`를 준다. 코드의 `lambdaLower=Renv^-31`과 일치하며 지수 인자를 machine zero로 바꾸지 않는다.

FTC로 정의한 step 도함수 상수와 ψ의 Leibniz 상수도 충분하다. Ls의 음수 거듭제곱은 더 작은 실제 상계에 남고, 균일 상계에서는 실제 `Ls>=1` 조건을 통해서만 제외된다. homogeneous f가 영인 사실은 원래 source의 forcing에서 나온다. `psi′*t`는 남아 있으며, bare t를 시간 끝점에서 영으로 연장한다고 주장하지 않는다.

실제 amplitude를 공유 함수로 다루는 부분은 단순한 형식 oracle이 아니다. 사용한 모든 free coordinate가 매개변수에 들어가고, 공유한 v jet를 materialize한 결과가 원래 실제 t의 직접 AD root와 같다는 검사가 따로 있다. Leibniz 항등식 검사는 이 본문 결속을 대신하지 않는다.

## 4. mesh 수, flatness와 범위

원래 slow annulus에서 `|R|<=2sqrt(Xb)`, `|Z|,|T|<=2`이다. 세 정수 mesh 좌표에 대한 `(2M_j+3)ell^6` 상계를 곱하고 두 sign을 포함하면 서면의 `2(4sqrt(Xb)+3)*7*7*ell^18`이 된다. 한 점에서 band 한 축과 mesh 세 축 각각 최대 두 개 양수 중심을 가지므로 β는 최대 16개, sign 포함 32개이다. 이 국소 개수는 모든 label 진폭을 수치 실행했다는 뜻이 아니다.

`log ell<=ell` 및 완성 제곱으로 얻는

\[
\ell^b2^{p\ell}e^{-a\ell^2}
\le 2^N\exp\frac{[b+(p+N)\log2]^2}{2a}\ q^N e^{-a\ell^2/2}
\]

의 지수와 q-band 방향을 확인했다. 무한합 경계에는 정수 d에 대한 `(J+d)^2>=J^2+(2J+1)d`를 사용하므로, 분모 `1-exp[-a(2J+1)/2]`가 정확하다. tail은 엄격히 양수로 보존된다. N에 따라 상수는 변하지만 같은 a와 source threshold를 사용할 수 있다.

이 계산은 상계가 이미 인증된 항의 합을 제어한다. 모든 label의 실제 H와 sqrt weight, slow partition 도함수 및 physical chain을 아직 인증하지 않은 상태에서 전역 잔차의 flatness를 주지 않는다. 이 제한은 모듈·서면의 false scope와 일치한다. 새로운 공개 Worker/browser 검증으로 세지도 않는다.

## 5. 실제 실행·byte 결속 확인

source attempt3의 process가 보존한 **61개 import**를 현재 파일 및 실행 후 hash와 모두 비교하여 일치를 확인했다. 이 가운데 58개는 기존 frozen import이고 3개는 새 Gaussian 모듈이다. source 검사와 실행기의 hash도 실행 snapshot 및 현재 파일과 일치한다.

| 증거 | 확인 내용 |
|---|---|
| source attempt3 | TAP 8/8, 내부 source check 12개, 관측 child exit 0 |
| 시간·메모리 | process 33.616860192초, source 내부 33.342913619초, peak 2,319,081,472 bytes |
| 최종 graph | 237,138 nodes, canonical 9,538,575 bytes |
| 최종 graph SHA256 | `e6c442d56c029fdf12ee873a94a9542d445b0c3e059efb438689442dd6c4c73a` |
| 원래 private source graph SHA256 | `8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a` |
| source certificate SHA256 | `3276f5eba34c30b313cba68dfb5c33600124b17f0a1426ce15cc130bbf296633` |
| process receipt SHA256 | `9253ff039b09321c821ac08ad10e93a22131cf97f45cf3cd2d7bffe4701f0608` |
| TAP SHA256 | `d58864f92d03124bcec9cef5f53a4ca17cde3c389eedcd7f19a28066dee4df6c` |

실행 1·2의 timeout 기록은 보존되며 성공이나 의도된 음성 대조로 계산하지 않는다. 실제 source body를 유지한 채 공유 본문과 materialization 비교를 적용한 실행 3만 성공 기록이다. generic 검사의 17차 recurrence와 실제 source의 2차 미분도 서로 구분한다.

## 6. 독립 검토의 판정

이 문서는 코드·원본 식·서술 증명·기록된 실행의 독립 대조이다. 새로운 source 계산, 원본 파일 수정, 수치 pulse enclosure 또는 Lean kernel 실행은 수행하지 않았다. bare homogeneous pulse의 현재 source-bound Gaussian 결과를 승인하며, `allLabelAmplitudeBoundsAuthenticated`, `covarianceWeightDerivativesInTail`, `physicalPullbackDerivativeLossesIncluded`, `globalPhysicalResidualFlatness`, `wholeGN5Complete`, `wholeGNUMComplete`, `m3MayStart`의 false 상태를 유지하는 것이 맞다.
