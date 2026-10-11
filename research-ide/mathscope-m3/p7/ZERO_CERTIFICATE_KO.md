# P7 유한 높이 제타 영점 인증: T=20, T=30

이 단계는 **실제 FLINT 구간 계산으로 T=20과 T=30까지의 유한 RH 명제**를
검증한다. 무한 높이의 리만 가설, P7 전체, 새로운 형식 커널 증명을 완료했다는
뜻은 아니다. 제타 함수의 표준 해석적 성질과 아래 경로 감김수 논증을 사용하고,
그 논증의 수치 전제를 원래 제타 함수의 실제 복소 ball 평가로 확인한다.

실행 코드는 [zero_certificate.py](zero_certificate.py), 공유 외향 반올림 및
직렬화 코드는 [ball_backend.py](ball_backend.py)다. python-flint **0.9.0**과
그 배포판의 FLINT **3.6.0**을 요구한다. 설치 wheel과 실제 바이너리 해시는
[설치 기록](../evidence/p7-backend-20261011/backend-install-attempt1.json)에 있다.

## 1. 실제 완료한 두 경우

192-bit 작업 정밀도, 정확한 허용 폭 `1e-30`으로 실행했다. 이 정밀도 숫자만으로
정확성을 선언하지 않는다. 최종 감김수 구간, Hardy Z 영점 구간, 부호를 판정한
함숫값, FLINT 비교 영점의 **실제 외향 구간 폭**을 각각 확인한다.

| 높이 T | 전체 경로의 인증된 tube 수 | 감김수 W | 극 보정 후 직사각형 안 영점 수 | 양의 높이의 임계선 영점 수 |
|---|---:|---:|---:|---:|
| 20 | 657 | 1 | 2 | 1 |
| 30 | 1113 | 5 | 6 | 3 |

감김수 구간의 정확한 전체 폭은 각각 `5091 * 2^(-192)`,
`821 * 2^(-188)`이다. 둘 다 `1e-30`보다 작다. 양의 높이 영점들의 대략적인
위치는 14.1347251417, 21.0220396388, 25.0108575801이다. 이 소수 표시는 읽기용이며,
실제 증거는 각 JSON에 저장한 정확한 유리수 부호 구간과 dyadic ball 끝점이다.

- [T=20 실제 전체 기록](../evidence/p7-zero-certificate-20261011/zero-certificate-height20-attempt2.json)
- [T=30 실제 전체 기록](../evidence/p7-zero-certificate-20261011/zero-certificate-height30-attempt2.json)
- [12개 검증 실행 기록](../evidence/p7-zero-certificate-20261011/zero-certificate-validation-attempt2.json)
- [외부에서 관측한 종료 코드](../evidence/p7-zero-certificate-20261011/zero-certificate-validation-attempt2-process.json)

## 2. 표본 사이를 빠뜨리지 않는 경로 인증

직사각형

\[
R_T=\{s:-1\leq\operatorname{Re}s\leq2,\ -T\leq\operatorname{Im}s\leq T\}
\]

의 경계를 반시계 방향으로 돈다. 순서는 왼쪽 아래, 오른쪽 아래, 오른쪽 위,
왼쪽 위, 다시 왼쪽 아래다. 네 변은 유리수 이등분으로 세분한다.

작은 선분의 양끝을 a,b라 하고, 좌표별 중점과 반길이를 m,r라 하자. 코드가
사용하는 padding은 `max(r)/8`이다. 각 좌표의 정확한 구간

\[
[m_j-r_j-p,\ m_j+r_j+p],\qquad p=\max(r)/8>0
\]

을 외향 반올림하여 복소 직사각형 tube D로 만든다. 선분 전체는 D의 내부에
들어가므로 이 검사는 유한 개 점의 함수값 검사와 다르다.

각 D에 대하여 다음을 **실제 ball 부등식**으로 검사한다.

1. `D.contains(1)`이 거짓이다. 제타 함수의 유일한 극 1이 없으므로 D와 선분
   근방에서 제타 함수가 정칙이다.
2. `zeta(D)`가 유한하고 0을 포함하지 않으며, `abs_lower()`가 엄밀히 양수다.
3. `zeta(D) / zeta(a)`의 실수부 하한이 엄밀히 양수다. 분모도 별도로 유한하고
   0을 포함하지 않음을 검사한다.

어느 하나라도 실패하면 선분을 이등분한다. 허용 깊이·cell 수·평가 횟수·시간을
초과하면 결과는 `UNRESOLVED`다. 실패한 구간을 생략하거나 표본으로 대신하지 않는다.

이 조건이 왜 branch를 인증하는지도 중요하다. 실제 함수

\[
f(s)=\zeta(s)/\zeta(a)
\]

는 선분 전체에서 열린 오른쪽 반평면 안에 있고 f(a)=1이다. 따라서 그 선분에서는
0에서 시작하는 하나의 연속 로그 branch가 존재한다. 이 branch의 끝점 허수부는
주값 `arg(zeta(b)/zeta(a))`와 정확히 같다. 실제 함숫값의 비를 interval 연산으로
감싼 것이므로 분자·분모의 상관관계를 독립 구간으로 넓혀도 포함성은 보존된다.

각 선분의 arg 증가량을 외향 ball 덧셈으로 더한 뒤 `2*pi()`로 나눈다. 닫힌 비영
곡선의 감김수는 정수이므로, 결과 ball이 **정수 하나만 포함**하고 요청한 폭까지
충족하면 그 정수가 전체 감김수 W다. 각 선분의 정확한 양끝 연결과 경로의 닫힘도
완성된 기록에서 다시 검사한다. `cells`에는 tube·제타의 tube 상·분모/끝점 상·
양의 하한·arg 증가량이 전부 저장된다.

이 방식은 검증된 연속 branch 감김수 방식이다. `acb.integral`을 호출했다거나
제타 로그도함수의 수치 적분을 실행했다고 기록하지 않는다.

## 3. 극 보정과 Hardy Z 영점 존재의 연결

제타 함수는 s=1에 단순극 하나가 있고, 나머지 점에서는 정칙이다. 음의 짝수인
자명한 영점들은 Re(s)=-1 왼쪽에 있다. 따라서 논증 원리에 의해 이 직사각형의
영점 수를 중복도까지 세면

\[
N_{\rm rect}=W+1.
\]

극점·임계 띠에 관한 표준 성질은 [DLMF §25.2](https://dlmf.nist.gov/25.2)와
[DLMF §25.10](https://dlmf.nist.gov/25.10)에 명시되어 있다. 이 성질 자체를
새 Lean 정리로 증명한 것은 아니다.

다음에는 별도로 **실제 부호 변화로 영점의 존재를 증명**한다. Hardy 함수는

\[
Z(t)=e^{i\vartheta(t)}\zeta(1/2+it),\qquad
\vartheta(t)=\operatorname{Im}\log\Gamma(1/4+it/2)-\frac t2\log\pi
\]

로 평가한다. 여기서 `lgamma`는 음의 실축을 제외한 연속 log-Gamma branch이며,
`log(gamma(...))`의 주값으로 바꾸지 않는다. 입력의 Gamma 실수부는 1/4이므로
이 branch에 문제가 없다. 실제 t에서 Z는 연속인 실함수이고, 지수 인자는
0이 아니므로 Z의 영점과 임계선 위 제타 영점이 일치한다.
[DLMF §25.10 식 (1)–(2)](https://dlmf.nist.gov/25.10)와
[python-flint acb 문서](https://python-flint.readthedocs.io/en/latest/acb.html)는
각각 이 함수와 연속 `lgamma` branch를 설명한다.

초기 구간 [14,15], [21,22], [25,26]은 탐색 후보일 뿐이다. 코드가 양끝의 Z 값을
실제로 계산해 0보다 큰 하한과 0보다 작은 상한을 확인해야 한다. 그 뒤 정확한
유리수 이등분을 하면서 부호가 반대인 양끝을 유지한다. 부호가 분해되지 않거나
최종 실제 폭이 요청보다 넓으면 완료를 반환하지 않는다.

서로 겹치지 않는 k개의 양의 부호 구간은 적어도 k개의 임계선 영점을 보장한다.
복소켤레 대칭에 의해 음의 높이에 k개가 더 있다. 이 **2k개가 실제 논증 원리의
중복도를 포함한 총수 W+1과 같을 때만** 다음 결론을 낸다.

- 각 구간에는 영점이 정확히 하나 있고 그 영점은 단순하다.
- 직사각형 안에 그 밖의 영점은 없다.
- 특히 이 높이 범위에는 임계선 밖의 영점이 없다.

실수축의 별도 무영점 전제를 넣어 총수를 반으로 잘라 증명하는 방식도 아니다.
이미 존재를 증명한 2k개가 총수를 채우므로 나머지 영점이 없다는 결론이 나온다.
전체 위쪽 경계도 비영으로 검증했으므로 최종 높이 구간은 `0<Im(s)<=T`라고 쓸
수 있다. 비자명한 영점이 원래 임계 띠 안에 있다는 표준 정리와 결합하면 이것이
해당 유한 높이의 RH 명제다.

영점 ball을 제타 함수에 넣어 0이 포함되는지도 일관성 검사로 남기지만,
**그 포함만으로 존재를 증명하지 않는다.** `imageContainsZeroUsedForExistence:false`
및 실제 양끝 부호를 기록한다.

## 4. FLINT의 별도 목록·개수와 독립성의 정확한 범위

동일 높이에서 `arb(T).zeta_nzeros()`와 `acb.zeta_zeros(1,k)`도 실제 호출한다.
개수의 실제 ball이 정수 하나를 결정하고 폭을 만족해야 하며, 각 반환 영점 ball은
대응하는 부호 구간 안에 들어가야 한다. 이 경로의 문서는
[FLINT acb_dirichlet](https://flintlib.org/doc/acb_dirichlet.html)에 있다.

목록과 개수 함수는 관련 Gram/Turing 기구를 쓰므로 둘을 서로 독립적인 두 증명으로
세지 않는다. 새 contour 알고리즘은 이 함수를 호출하지 않고 감김수를 구하며,
그 결과를 마지막에 목록·개수와 비교한다. 다만 contour와 비교 경로 모두 같은
FLINT ball 산술과 제타 평가기를 사용한다. 따라서 **독립 counting 알고리즘**이지
완전히 독립적으로 구현된 산술 라이브러리 두 개의 교차 검증은 아니다.

## 5. 호출 계약과 실패 상태

```python
from p7.zero_certificate import certify_zeros

result = certify_zeros({
    "height": "30",
    "precisionBits": 192,
    "tolerance": "1e-30",
    "maxCells": 16384,
    "maxDepth": 24,
    "maxEvaluations": 100000,
    "timeoutSeconds": 45,
})
```

수학적 입력은 정확한 문자열이며 float나 bool로 좌표·허용 오차를 받지 않는다.
첫 범위는 height `20` 또는 `30`이다. 작업 정밀도는 32–4096 bits, 시간 예산은
1–60초로 제한한다. 각 계산 전 시간과 횟수를 점검한다. 강제 프로세스 종료가
필요한 배포 환경에서는 외부 실행기가 별도 timeout과 관측 종료 코드를 기록해야
한다. 내부 시간 검사만으로 단일 C 호출을 선점 중단한다고 주장하지 않는다.

완료 상태는 `FINITE_RH_TO_T`다. 입력 거부, 부족한 실제 폭, branch 미인증,
부호 미결정, total-count 불일치, 예산 소진은 모두 `UNRESOLVED`와 사유를 반환한다.
어떤 경우에도 `globalRHProved`, `formalKernelProof`, `completeP7Milestone`은
true로 바뀌지 않는다.

결과에 계산시각·경과시간을 넣지 않아 같은 요청과 바이트에서 결정적인 값 및
`computationSha256`을 얻는다. 이 SHA는 계산 결과의 식별자다. 저장된 JSON이나
해시만으로 새 실행을 인증하지 않으며, replay는 원래 함수를 다시 실행해야 한다.
모든 FLINT precision/cap 변경은 공유 context를 사용해 저장·복원한다.

## 6. 실제 검증과 최초 실패 보존

최종 [test_zero_certificate.py](../tests/test_zero_certificate.py)는 실제 두 높이의
전체 인증, tube의 엄밀한 양의 부등식/연결, 부호 구간과 count 포화, FLINT 비교,
정밀도 부족, 극점 포함, 표본 양끝은 비영이지만 영점을 지나는 선분, cell/depth/
평가 예산, deadline, float 입력, 위조된 caller count, 결정적 재실행을 검사한다.
최종 실행은 **12/12 PASS, 관측 종료 코드 0**, 약 3.008초, 최대 RSS 153,505,792 bytes다.

최초 실행은 11개 통과 뒤 한 negative fixture의 `arb("1 +/- 1/8")` 문자열 구문이
해당 API에서 지원되지 않아 실패했다. 수학 본체와 두 실제 높이의 certificate는
그 실행에서도 성공했다. 테스트만 `arb(mid, exact_radius)`로 바꿨고 본체는 바꾸지
않았다. 최초 코드 snapshot·실패 로그·실제 certificate를 `attempt1`에 보존했다.
최종 두 certificate는 최초 certificate와 **정확히 같은 바이트/SHA**다.

실행기록의 범위는 이 유한 P7 사례다. M2 증거를 변경하지 않았으며 P7의 나머지
고도화나 M3의 뒤 단계까지 통과한 것으로 확대하지 않는다.
