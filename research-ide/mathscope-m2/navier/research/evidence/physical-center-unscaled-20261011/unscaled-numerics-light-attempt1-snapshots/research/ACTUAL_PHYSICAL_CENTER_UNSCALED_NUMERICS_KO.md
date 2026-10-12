# 원래 크기의 물리 도함수 구간: 브라우저 수치 곱셈

`actual-physical-center-unscaled-numerics.mjs`는 새로 계산한 유리수 계수 구간과 설치된 양의 크기 인자 구간을 방향 반올림으로 곱한다. 값이 매우 크거나 작더라도 끝점은 유리수 문자열과 `exp`, `neg`로 이루어진 닫힌 수식으로 남는다. 거대한 수를 `Number`로 바꾸거나 양의 작은 인자를 0으로 바꾸지 않는다.

## 입력과 출력

```js
recomputePhysicalCenterUnscaledDerivativeBounds(
  numericalRows,
  originalBindings,
  installedScaleRows,
  controls = {},
  context = {}
)
```

입력 행의 수는 각각 1부터 270까지이며 세 입력의 행 집합이 정확히 같아야 한다. 이 함수는 전체 270행의 원래 물리적 완전성을 인증하지 않는다. 설치된 wrapper가 전체 행 목록과 외부 원본 실행 인증을 검사한다.

| 입력 | 소비하는 내용 |
|---|---|
| `numericalRows` | `quantity`, `sign`, `component`, `derivative`, `rowKey`, 유리수 문자열 끝점의 `directedInterval`, 선택적인 정확한 `width` |
| `originalBindings` | `rowKey`, `positiveExactScale`; 원래 metadata가 있으면 typed key와 일치 검사 |
| `installedScaleRows` | typed key, `sourceRoot`, 닫힌 양의 `interval`, 명시된 `coordinateDefinition`, 유리수 `coordinate`, `logCoordinateWidth`, `toleranceMet`, `actualScaleRecipeBound` |
| `controls` | 기존 fresh coefficient request의 `tolerance`, `precisionBits`; profile·quadrature 제어는 상위 wrapper의 범위 |

행 키는 `[quantity, sign ?? 'physical', component, derivative].join(':')`이다. 세 입력 각각에서 키 중복을 거부하고, `sourceRoot === original.positiveExactScale`를 확인한다. 서로 다른 행이 같은 양의 인자를 사용하는 것은 허용한다. 출력 순서는 새 계수 행의 순서다.

각 출력 행에는 다음 항목이 있다.

- `scaledCoefficientInterval`, 정확한 `scaledCoefficientWidth`와 요청 폭.
- `positiveExactScale`, `sourceRoot` 및 원래 크기 인자의 `positiveScaleInterval`.
- `positiveScaleCoordinate`: 저장된 인자의 좌표 정의, 유리수 좌표 구간, 정확한 폭.
- `rawDerivativeInterval`: 두 구간의 새 방향 곱으로 얻은 닫힌 수치 끝점.

양·음·0 교차 여부에 따라 임의로 한쪽 끝점만 선택하지 않는다. 기존 `numericalExponentialArithmetic`의 `fromClosed`, 네 꼭짓점의 방향 `mul`, `toClosed`를 사용한다. 각 입력의 중첩 객체를 출력에 공유하지 않아 출력 변경이 설치된 증거나 새 계수 입력을 바꾸지 않는다.

## 정밀도와 자원

곱셈 계층은 384비트, 연산 5,000,000회, memo entry 30,000개, 끝점 중첩 깊이 128, 유리수 32,768비트의 고정 상한을 사용한다. 기존 coefficient request의 192–512비트는 `request.coefficientPrecisionBits`로 보존하며, 곱셈의 비트 수는 별도로 명시한다. 이 함수는 새 계수의 산출 과정을 실행하거나 그 비트 수를 변경하지 않는다.

새 계수의 실제 끝점 차와 저장된 인자의 실제 좌표 끝점 차를 정확한 유리수 산술로 계산한다. 주어진 폭 문자열과 일치해야 하고, 각각 요청 `controls.tolerance` 이하여야 한다. 인자 구간 안에 중복 기록된 좌표 metadata가 있으면 바깥 metadata와도 일치해야 한다. 요청 폭이 설치된 좌표 폭보다 작으면 `PRECISION_REQUIRED`로 끝나며, 비트 수만 높였다는 이유로 기존 설치 구간을 좁히지 않는다.

요청 폭은 **계수 구간 및 명시된 인자 좌표 구간의 폭**이다. 최종 원래 도함수의 같은 상대오차나 절대오차를 보장하지 않는다. 예를 들어 `log^n(value)`의 작은 폭은 원래 `value`의 작은 상대폭과 동치가 아니다. 출력은 원래 도함수를 포함하는 닫힌 양끝점을 제공하고, 상대오차 보장과 원래 값의 절대폭 요청은 각각 `false`로 유지한다.

## 인증 범위

이 모듈과 각 행의 `sourceAuthenticated`는 항상 `false`다. `actualScaleRecipeBound: true`는 입력의 필요한 호환성 항목이며 자체적인 증명 토큰이 아니다. wrapper가 설치된 source certificate·270행 binding·positive scale projection의 SHA와 원래 실행/증명 범위를 별도로 인증해야 한다. 저장된 좌표가 그 인자 끝점의 해당 로그 좌표를 실제로 둘러싼다는 근거도 이 외부 인증에 속한다.

현재 함수는 원래 graph를 재구성하지 않고 private token을 만들지 않으며, 저장된 양의 인자를 새로 계산했다고 주장하지 않는다. 설치된 양의 구간에 새 계수 구간을 곱하는 연산만 새로 실행한다. 전체 G-NUM/M2 완료나 M3 시작을 승인하는 함수도 아니다.

## 경량 검증

`tests/actual-physical-center-unscaled-numerics.test.mjs`는 다음을 확인한다.

- 독립적으로 계산한 유리수 양수·음수·0 교차·정확한 0의 곱.
- `exp(exp(1000))`과 `exp(-exp(1000))`의 ±1배가 닫힌 정확한 부호 끝점을 유지함.
- 서로 다른 typed key의 같은 scale root 사용, 순서 독립적인 입력 대조.
- 동결된 입력을 바꾸지 않고 출력 객체도 입력과 공유하지 않음.
- 중복/누락 행, 잘못된 root/key, 뒤집힌 구간, 0 이하 인자, source parameter나 integral 끝점, 바뀐 endpoint type 거부.
- 거짓 좌표 폭, 중첩 metadata 불일치, 더 좁은 정밀도 요구, 유한 행 상한 및 취소 처리.

실제 큰 source constructor나 전체 browser worker는 이 검증에서 실행하지 않았다. 외부 실행 exit 및 TAP 로그는 별도 `physical-center-unscaled-20261011` evidence에 저장한다.
