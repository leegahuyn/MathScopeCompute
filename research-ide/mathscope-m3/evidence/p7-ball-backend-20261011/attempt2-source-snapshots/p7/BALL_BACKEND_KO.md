# M3 P7 첫 복소 ball backend — 실제 FLINT 계산과 정확한 오차 계약

이 모듈은 **M2 최종 관문 커밋 `90e977ba9225bfaa20fd3dcc97db7f794c5ed4c9` 이후 시작한 M3 P7 구현**이다. M2 원래 수학 파일은 변경하지 않는다. 사용자가 요청한 순서 중 현재 구현 범위는 P7의 실제 특수함수·도함수 구간 계산기이며, P7 전체 완료, P8, RH 전체 증명 또는 BSD 증명을 뜻하지 않는다.

구현은 [ball_backend.py](ball_backend.py), 검사는 [tests/test_ball_backend.py](tests/test_ball_backend.py)에 있다. 실행 환경의 공식 wheel 설치·SHA 기록은 [backend-install-attempt1.json](../evidence/p7-backend-20261011/backend-install-attempt1.json), 이 모듈의 실제 검사·요청별 출력은 [p7-ball-backend-20261011](../evidence/p7-ball-backend-20261011/)에 따로 보존한다. 설치 전 조사 문서는 [M3_P7_BALL_BACKEND_PREPARATION_KO.md](../../docs/M3_P7_BALL_BACKEND_PREPARATION_KO.md)이며, 당시 읽기 조사와 이번 실제 실행을 혼동하지 않는다.

## 1. 설치된 backend와 사용한 공식 API

실제 환경에서 **python-flint 0.9.0 / FLINT 3.6.0, FLINT release 30600**을 읽고 실행했다. 다른 버전은 이 모듈이 거절한다. 해당 버전을 대상으로 다음 공개 API를 공식 소스와 실제 실행 양쪽에서 확인했다.

| 계산 | 0.9.0 API | 이 모듈의 의미 |
|---|---|---|
| 복소 직사각형 | `acb(arb(real), arb(imag))` | 입력 전체의 외향 포함 구간 |
| ζ와 regularized ζ | `acb_series.zeta(deflate=False/True)` | Riemann ζ, 또는 `ζ(s)-1/(s-1)` |
| Γ, 1/Γ, log Γ | `acb_series.gamma/rgamma/lgamma()` | 실제 값과 유한 차수의 형식 급수 계수 |
| 실수 외향 끝점 | `arb.lower()`, `arb.upper()` | 현재 비트 정밀도에서 각각 −∞, +∞ 방향의 정확한 dyadic |
| 정확한 dyadic 분해 | `arb.man_exp()` | 정수 mantissa × 2의 정수 exponent 승 |
| 작업 정밀도 | `ctx.prec`, `ctx.cap` | 산술 비트 수와 급수 계수 수를 각각 설정 |

공식 근거: [python-flint 0.9.0 acb_series 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/acb_series.pyx), [arb 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/arb.pyx), [acb 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/acb.pyx), [context 소스](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/flint_base/flint_context.pyx). FLINT의 deflation·급수 의미는 [FLINT 3.6.0 acb_poly 공식 문서](https://raw.githubusercontent.com/flintlib/flint/v3.6.0/doc/source/acb_poly.rst)와 대조했다.

원래 API의 내부 오차 관리는 Arb/ACB의 포함 구간에 의존한다. 이 Python 모듈을 별도의 Lean kernel 증명 또는 FLINT와 독립적인 산술 구현으로 표시하지 않는다. Arb의 ball 산술 원리는 [저자 논문, Johansson 2017](https://arxiv.org/abs/1611.02831)에 설명되어 있다.

## 2. 정확한 입력과 `evaluate(request)` 계약

```python
from p7.ball_backend import evaluate

record = evaluate({
    "operation": "zeta_derivatives",
    "s": {"real": "1/2", "imag": "14"},
    "precisionBits": 192,
    "tolerance": "1e-40",
    "derivativeOrder": 2,
})
```

| 필드 | 허용 입력 | 의미 |
|---|---|---|
| `operation` | `zeta`, `zeta_deflated`, `gamma`, `rgamma`, `lgamma`, `xi`; 각각 `_derivatives` 접미사 허용 | 일반 이름은 지정 차수 하나, 접미사 이름은 0부터 지정 차수까지 전부 |
| `s.real`, `s.imag` | 정확한 문자열 또는 `{"lower":"…","upper":"…"}` | 유리수·십진수·과학적 표기를 정확한 유리수로 해석. `imag` 생략 시 정확한 0 |
| `precisionBits` | 16–4096 정수, 기본 192 | 실제 FLINT 작업 정밀도 |
| `tolerance` | 정확한 양의 문자열, 기본 `1e-40` | **각 복소 성분 전체 폭**의 상한 요청 |
| `derivativeOrder` | 0–16 정수, 기본 0 | 복소 변수 (s)에 대한 도함수 차수 |

좌표와 tolerance에 Python/JSON 숫자를 넣으면 거절한다. `0.5`, `float('nan')`, `True`와 같은 값으로 정확한 입력을 대신할 수 없다. 문자열 `"0.5"`, `"5e-1"`, `"1/2"`는 정확히 같은 유리수로 정규화한다. 공백, 0 분모, 비유한 문자열, 알려지지 않은 필드도 거절한다. 입력·확장 유리수의 크기를 제한하여 저장한 정규 요청을 같은 parser로 재실행할 수 있게 한다.

초기 유한 계산 예산으로 (|\Re s|,|\Im s|\le10000), 각 입력 성분의 폭 (\le1/4)를 요구한다. 넓은 직사각형은 `unsupported`를 반환하며 세분화를 요구한다. 이 수치는 함수의 해석적 정의역을 제한하는 새 수학 가정이 아니라 현재 공개 계산기의 자원·구간 폭 계약이다. malformed request는 `BallRequestError`, 설치되지 않았거나 다른 버전인 backend는 `BallBackendUnavailable`를 발생시킨다.

정확한 유리수는 `fmpq`로 만든 후 `arb`에 넣는다. 구간 입력은 두 끝점의 ball 합집합을 사용하므로 변환 과정의 반올림과 입력 구간의 불확실성이 결과에 포함된다. 입력 폭은 높은 precision으로 사라지지 않는다.

## 3. 출력, dyadic 끝점과 실제 폭

출력의 `schema`는 `MathScope.M3.P7.BallEvaluation/1`이다. `status`와 `toleranceMet`를 분리한다.

| `status` | 의미 |
|---|---|
| `finite` | 계산한 값·도함수의 유한한 복소 포함 구간을 얻음. 정확도 요청 충족 여부는 `toleranceMet`를 별도로 확인 |
| `nonfinite` | 요청 구간에 실제 극점이 있거나 backend가 비유한 구간을 반환. 유한 끝점을 만들어 넣지 않음 |
| `unsupported` | 현재 입력 예산 또는 지정된 analytic branch에서 계산을 받지 않음 |

`derivatives`의 각 행은 `order`, 정확한 `taylorCoefficientMultiplier=k!`, `ball`을 가진다. 행이 하나일 때 `value`도 그 ball을 가리킨다. ball의 `real`, `imag`는 다음처럼 닫힌 dyadic 구간을 나타낸다.

```json
{
  "kind": "finite",
  "lower": {"mantissa": "-3", "exponent": "-2"},
  "upper": {"mantissa": "-1", "exponent": "-1"},
  "width": {"mantissa": "1", "exponent": "-2"},
  "exact": false,
  "containsZero": false,
  "toleranceMet": false
}
```

위 형식 예시는 ([-3/4,-1/2])이다. 실제 실행값의 예시가 아니다. mantissa와 exponent는 모두 문자열이며, 0은 `(0,0)`, 비영 mantissa는 홀수로 정규화한다. 원래 ball의 `lower()`/`upper()`를 반대 방향으로 반올림한 뒤 `man_exp()`를 사용한다. 표시용 십진 midpoint를 인증된 끝점으로 쓰지 않는다.

`width`는 내보낸 두 dyadic 끝점의 **정확한 차**이다. 두 성분에서 각각

\[
\text{upper}-\text{lower}\le\text{tolerance}
\]

를 유리수로 검사하며, `maxComponentWidth`도 내보낸다. 따라서 tolerance는 복소 max norm에서의 성분 전체 폭 기준이다. 이를 Euclidean 지름과 같다고 쓰지 않는다. 낮은 precision에서 유한 구간을 얻었어도 폭이 크면 `toleranceMet:false`를 유지한다.

공개 공유 helper는 `parse_exact_rational`, `arb_from_exact_component`, `serialize_arb`, `serialize_acb`, `dyadic_to_fraction`, `flint_workprec`이다. 다른 P7 모듈은 자체 실제 FLINT 값의 출력에 serializer를 사용할 수 있다. serializer가 caller의 임의 숫자에 원본 인증 권한을 부여하지는 않는다.

## 4. ξ의 정규화와 removable singularity

이 모듈의 정규화는

\[
\xi(s)=\tfrac12s(s-1)\pi^{-s/2}\Gamma(s/2)\zeta(s)
\]

이다. (\zeta_d(s)=\zeta(s)-1/(s-1))를 쓰면, 원래 극점이 없는 위치에서 Γ의 재귀식으로

\[
\xi(s)=\Gamma(1+s/2)\exp[-(s/2)\log\pi]
       [1+(s-1)\zeta_d(s)]
\]

를 얻는다. 양쪽의 analytic continuation은 (s=0,1)에도 일치하며 (\xi(0)=\xi(1)=1/2)이다. deflated 함수의 (s=1) 값은 실제 Euler 상수로 계산되고, `0*infinity`를 해석한 결과를 사용하지 않는다. 정규화와 반사는 [DLMF 25.4](https://dlmf.nist.gov/25.4), deflation은 앞의 FLINT 3.6.0 공식 문서에 근거한다.

입력 직사각형의 실부 상한이 (1/2)보다 작으면 (w=1-(s+x))로 반사하여 위 식에 대입한다. 그렇지 않으면 (w=s+x)를 쓴다. 허용 입력 폭 (\le1/4) 아래에서 선택한 Γ 인자의 실부가 양수인 영역을 사용하므로 음의 짝수 등에서 중간 Γ 극점을 만들지 않는다. 반사한 경우 `-x`도 그대로 급수에 넣으므로 홀수 차 도함수의 부호가 자동으로 유지된다. ξ를 반사하면서 도함수 부호를 생략하는 경로는 검사에서 거절된다.

`xi(0)`와 `xi(1)` 값 및 도함수, 음의 짝수 부근의 반사, 일반점의 원래 (1/2) 정규화가 실제 backend 검사 대상이다. 이 유한 실행을 임의 직사각형 전체에서의 독립 analytic continuation 증명으로 확대하지 않는다.

## 5. 도함수·분기·극점·오차 항목

공식 `acb_series([s,1], prec=N+1)`와 `ctx.cap=N+1`을 사용한다. 계산한 (x^k) 계수는 (f^{(k)}(s)/k!)이므로 내보낼 때 정확한 정수 (k!)를 곱한다. 일반적인 비영 (x)에 이 유한 다항식을 대입하는 오차는 이 작업이 계산하지 않는다. `O(x^(N+1))`를 유한 반경의 수치 잔여항으로 표시하지 않으며 `finiteDisplacementTaylorRemainder:null`을 유지한다.

ζ의 (s=1), Γ·log Γ의 비양의 정수 극점은 정확한 요청 직사각형에 대해 검사한다. 반면 `rgamma`는 원래 entire 함수이므로 Γ 극점 위치에서의 정확한 0을 그대로 허용한다. `lgamma`는 음의 실수 반축을 제외한 영역의 analytic log-Gamma branch다. 일반적으로 principal `log(gamma(s))`와 같지 않다. 음의 반축과 만나는 구간은 명시적으로 거절한다. 이 분기 의미는 [공식 acb.pyx의 lgamma 문서](https://raw.githubusercontent.com/flintlib/python-flint/0.9.0/src/flint/types/acb.pyx)와 같다.

총 포함 구간은 입력 변환·전파와 FLINT 내부 산술·급수 계산 오차를 포괄한다. 그러나 0.9.0 Python API는 개별 실행의 **내부 rounding bound와 truncation bound를 따로 반환하지 않는다**. 따라서 두 항은 `null`, `internalSplitStatus`는 `not exposed separately`다. 알려지지 않은 항을 0으로 채우지 않는다. 이 backend 한 조각으로 P7 원래의 모든 L-함수, elliptic local factor, Taylor 잔여항 분리까지 완료했다고 주장할 수 없다.

## 6. 결정적 결과·재실행·실제 검증

수학 결과에는 실행 시각, elapsed, 프로세스 번호를 넣지 않는다. 요청을 정규화하고 정확한 포함 구간·계산 식·backend 버전·범위를 canonical JSON으로 직렬화하여 `computationSha256`을 계산한다. `replay_evaluation(record)`는 저장된 SHA 확인에 이어 **같은 요청을 실제 pinned backend로 다시 계산**하고 전체 결과를 비교한다. 변경한 flags나 끝점을 재해시한 자료도 원래 결과와 다르면 거절한다. 해시 자체를 새 계산의 인증으로 보지 않는다.

실제 단위검사 16개는 다음 위험을 검증한다.

- 정확한 문자열 변환, float/boolean/nonfinite/과도한 입력 거절, 외향 dyadic 폭과 정밀도 context 복원.
- ζ의 정확한 특수값, regularized ζ의 Euler 상수, Γ/rgamma 값과 ξ의 removable values.
- log Γ의 2·3차 도함수 및 정확한 (k!), Γ 재귀식의 도함수, ξ 반사의 홀수 차 부호와 (1/2) 정규화.
- 실제 극점·log Γ 분기, 구간 입력 전파, 넓은 box 거절, 낮은 precision의 실제 tolerance 실패.
- 비유한 backend 출력의 끝점 보존, 저장 자료 변조와 fresh replay 비교.

첫 검사 실행에서 테스트 코드가 Euler 상수 API 이름을 `arb.euler`로 잘못 불렀다. 실제 0.9.0의 공식 이름 `arb.const_euler`로 바꾸어 최종 16/16을 통과했다. 이는 특수함수 계산 식 변경이 아니며, 첫 실패를 성공 실행으로 세지 않는다.

예시 실행 환경은 다음과 같다. 아래 PYTHONPATH는 실행 환경용이며 설치물 자체는 repository에 복사하지 않는다.

```sh
PYTHONPATH=/workspace/scratch/cf975e3da716/tmp/mathscope-m3-python:/workspace/scratch/cf975e3da716/MathScopeCompute/research-ide/mathscope-m3 \
  python -m unittest discover -s research-ide/mathscope-m3/p7/tests -p test_ball_backend.py -v
```

후속 zero contour 계산기는 같은 Arb/ACB 산술·serializer를 공유하되 별도 전체 contour 논증과 실제 오차 검사를 제공해야 한다. 저장된 ζ 근사값 또는 FLINT의 관련 zero-list/count 두 API만으로 독립적인 총수 검증을 완료했다고 표시하지 않는다. 원래 진행 순서는 **P7→P8; Y5→Y6→Y7; N6→N7→N8**을 유지한다.
