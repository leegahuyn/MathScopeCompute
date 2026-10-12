# P7 ball backend 독립 읽기 검토

검토자: `/root/sensitivity_kernel` · 2026-10-11 UTC.

**판정: 아래에 한정한 실제 ball 평가·유한 차수 도함수 계약에서 구체적인 수학 또는
범위 결함을 찾지 못했다.** 이번 문서는 다른 agent가 작성한 backend의 독립 코드·수학·
실행기록 읽기 검토다. 16개 backend 검사를 새로 실행했다고 기록하지 않는다. 별도 zero
certificate 구현은 이 backend의 serializer/precision context를 실제 소비하지만,
그 경로의 영점 논증을 backend 단독 성과로 세지 않는다.

## 1. 동결 바이트와 실제 기록

현재 파일을 직접 SHA-256 해시해 실행 영수증의 항목과 모두 대조했다.

| 대상 | 현재 및 실행 기록 SHA-256 |
|---|---|
| `p7/ball_backend.py` | `be78ee06368802d1148a3d456b363da1f634d3601445bad37a20d06e79200e32` |
| `p7/tests/test_ball_backend.py` | `2d6a733e1ffd896eba6dfb4cfe0129ec30fa59c85a8181089840fb3a5ea76440` |
| `p7/BALL_BACKEND_KO.md` | `369681d09c0c7143ca5141afdfda5fd1dc1eef091c677506dd3dccf1c0b8abad` |
| 설치 영수증 | `27f08bbb3de7399cfc070feffa3a4374968a36e67fa10720daa16c43ec19ce10` |
| 최종 16개 검사 로그 | `4e30b8396dcc128424fc3eb7de7762ed87882e0167cecce48d9c745fd5799eae` |
| 10개 실제 예시·fresh replay 자료 | `48e485316f0a45cc925c4ecfedac3e3c16fab283a0e5ff33ecb5ff81d37b2e53` |

[최종 실행 영수증](ball-backend-validation-attempt2.json)의 SHA는
`a7a021ad79e2840a8a587b4ad34646d2165c6e8659281ce226b85c64fb27f8f8`다.
16/16 PASS, 관측 종료 코드 0, python-flint 0.9.0/FLINT 3.6.0, 10개 예시의 실제 재실행
일치를 기록한다. 첫 실행의 `arb.euler` 테스트 API 오류와 test-only 교정도 구분해
보존한다. 처음부터 모두 성공한 실행으로 덮어쓰지 않았다.

## 2. 정확한 입력, 직렬화와 폭

정확한 문자열은 `Fraction`으로 해석하고 `fmpq`를 거쳐 arb로 변환한다. float/bool,
비유한 문자열, 0 분모와 불명확한 추가 필드를 거절한다. 긴 십진 지수에 대해서는
확장된 canonical 유리수의 크기도 제한하므로 저장한 요청을 같은 parser로 다시
읽을 수 있다는 계약과 일치한다.

`serialize_arb`는 현재 FLINT precision에서 `lower()`와 `upper()`를 반대 방향으로
반올림한 후 exact `man_exp()`를 사용한다. 두 출력 dyadic의 정확한 차를 계산하므로
표시된 `width`는 출력 끝점의 폭과 같다. `serialize_acb`의 폭은 실부/허부의 전체
폭 중 큰 값이다. 복소 Euclidean 지름 또는 midpoint의 상대오차라고 쓰지 않는다.

비유한 값에 유한한 가짜 끝점을 주지 않으며, finite와 toleranceMet를 분리한다.
낮은 precision 또는 넓은 입력의 전파 때문에 실제 폭이 요청을 초과하면 finite라도
toleranceMet는 false다. 입력 불확실성과 입력 변환 오차가 포함 구간에 남는다.
공유 `flint_workprec`는 락 안에서 prec/cap을 저장하고 정상·예외 경로 모두 복원한다.

## 3. ξ 정규화와 반사 미분

검토한 구현식은

\[
\Gamma(1+w/2)e^{-w\log\pi/2}
       \{1+(w-1)[\zeta(w)-1/(w-1)]\}.
\]

중괄호는 정확히 `(w−1)ζ(w)`이며 Γ 재귀식은 `Γ(1+w/2)=(w/2)Γ(w/2)`이다.
따라서 전체 곱은 원래

\[
\tfrac12w(w-1)\pi^{-w/2}\Gamma(w/2)\zeta(w)
\]

와 일치한다. 여기서 1/2 인자가 누락되지 않았다. regularized ζ를 실제 사용하므로
w=1에서 `0*infinity`를 계산하지 않는다. w=1의 값은 Γ(3/2)/sqrt(π)=1/2이다.

입력 실부 상한이 1/2보다 작을 때 `w=1−(s+x)`를 사용한다. 급수 변수의 부호도 함께
반사하므로 k차 도함수의 `(-1)^k`가 남는다. 반사하지 않는 쪽은 입력 폭≤1/4와
실부 상한≥1/2에서 실부 하한≥1/4이고, 반사한 쪽도 Re(w)>1/2이다. 따라서 선택한
Γ(1+w/2)의 중간 인자는 극점에 걸리지 않는다. ξ의 반사와 normalization은
[DLMF §25.4](https://dlmf.nist.gov/25.4)에 맞는다.

## 4. 도함수·분기·극점

`acb_series([s,1],prec=N+1)`의 x^k 계수에 정확한 k!를 곱한다. log Γ의 2·3차
특수값, Γ 재귀식의 16차까지 도함수와 ξ 홀수 반사 부호에 대한 검사를 읽었다.
이 검사는 유한 Taylor 계수의 의미를 확인한다. 유한한 비영 변위에서 다항식의
수치 잔여항을 제공한 것으로 해석할 수 없고, 코드와 문서도 이를 null로 둔다.

zeta의 1, gamma/lgamma의 비양의 정수에 대한 정확한 구간 극점 검사를 확인했다.
ceil/floor 부등식은 요청 실구간에 정수가 존재하는지 올바르게 판정한다. rgamma는
이 극점에서 원래 entire 함수의 0을 허용한다. lgamma는 음의 실수 반축을 피하는
연속 analytic branch이며 `log(gamma(s))`의 주값과 동일시하지 않는다. 실제 branch
차이를 확인한 회귀도 있다. 이는 [공식 acb 문서](https://python-flint.readthedocs.io/en/latest/acb.html)의
lgamma 계약과 일치한다.

## 5. 남겨 둔 범위와 재실행

이 backend는 실제 FLINT/Arb의 rigorous enclosure 계약을 신뢰한다. 그 내부의 개별
rounding/truncation 오차를 별도 수치로 받은 것처럼 쓰지 않으며 두 항은 null이다.
유한 변위 Taylor 잔여항, contour 영점 총수, P7 전체, 전역 RH/BSD, 새 Lean kernel
증명도 승인하지 않는다.

저장한 SHA만으로 계산을 인증하지 않는다. `replay_evaluation`은 SHA 확인 뒤 같은
요청을 실제 backend에서 다시 계산하고 전체 canonical 결과를 비교한다. 변조한
flag를 새로 해시해도 fresh 결과와 불일치하므로 거절한다. 이러한 조건 하에서
문서의 실제 수행 범위와 코드가 일치한다.

이번 검토에서 원래 source, 테스트, 실행 영수증 또는 문서를 수정하지 않았다.
