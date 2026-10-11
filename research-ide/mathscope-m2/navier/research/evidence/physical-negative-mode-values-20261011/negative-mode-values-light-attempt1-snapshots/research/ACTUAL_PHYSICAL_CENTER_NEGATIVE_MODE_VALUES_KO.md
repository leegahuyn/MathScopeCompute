# 원래 두 결합계의 작은 성분 w_minus VALUE

이 보조 모듈은 이미 인증한 실제 source 부등식의 **정확한 수치 후처리**를 한다. 실제 source, 그래프, band 또는 물리점을 생성하지 않으며 `sourceAuthenticated:false`를 유지한다. 원래 228+42 도함수 행에 빠져 있던 두 `w_minus`의 **0차 값**을 별도 두 행으로 제공한다.

## 원래 값과 근거

`actual-common-physical-center-enclosure.mjs`의 `bindNewCenterFamily`는 각 `sign=+1,-1`에 대하여 같은 원래 결합계와 같은 대표점에서

```js
a = G.covarianceValue(f.system, 0, v0, values)
bOther = G.covarianceValue(f.system, 1, v0, values)
```

를 생성한다. 출력 `rows[i].center.a`는 `w_plus`, `rows[i].center.other`는 `w_minus`다. 이 `w_minus`는 `sign=-1` 부호군을 뜻하지 않는다. **두 부호군 각각에 두 결합 성분이 있다.** `other`에는 `Ac`, `u`, `A0`, 가중치의 제곱근 또는 도함수의 `Rsharp` 인자가 곱해져 있지 않다.

실제 physical source certificate의 `sourceBounds.derivation.base`, `.band`, `.cone`은 각각

\[
B\ge 2^{128},\qquad S\ge B^{1024},\qquad
w_+>0,\quad |w_-/w_+|\le B^{260}/S
\]

를 같은 원래 source에 결속한다. 원래 coupled system, 단위 초기값, moving-pressure/basis/damping 및 source Gaussian/Riccati premise 검사도 함께 통과해야 한다. 일반 audit의 조건부 `pass`나 caller가 보낸 root ID만으로 이 인증을 발급할 수 없다.

완료된 physical certificate의 정확한 `numerics.values.centers[i]`와 같은 정의를 새 directed arithmetic으로 계산한 `w_plus` 구간은 `0 < lower <= w_plus <= upper < 1/2`를 준다. 보조 모듈은 표시용 부동소수점 구간을 읽지 않고 정확한 유리수 끝점으로 이 조건을 직접 검사한다. 그러면

\[
|w_-| < \frac12\frac{B^{260}}{S}
\le \frac12 B^{-764}
\le 2^{-(128\cdot764+1)}=2^{-97793}.
\]

이것은 원래 결합해의 작은 성분을 0으로 놓는 계산이 아니다. 대칭 구간 안에 0이 들어갈 뿐이며 실제 부호를 별도로 판정하지 않는다.

## API 및 방향 반올림

`enclosePhysicalCenterNegativeModeValues(centers, originalBindings, controls, context)`는 다음 입력을 받는다.

- `centers`: 위 순서와 일치하는 두 fresh `w_plus` 유리수 구간 `{lower, upper}`.
- `originalBindings`: 두 `{sign, centerRoot, negativeModeRoot}`. 부호 및 네 원본 root가 서로 다른지 검사한다. 원본 certificate와의 실제 동일성은 설치 wrapper의 책임이다.
- `controls`: runtime의 `precisionBits`, 정확한 유리수 `tolerance`. 192~512 bits를 허용한다. runtime의 나머지 세 제어 필드는 수학 전제나 상수로 사용하지 않는다.
- `context`: 취소 및 진행 콜백.

고정된 원래 지수 `128*(1024-260)+1`은 `BigInt`로 계산한다. `192 <= bits <= 512 < 97793`이므로 양의 source 반지름 `2^-97793`을 bits의 dyadic 격자로 바깥쪽 반올림하면 정확히 한 격자 단위 `2^-bits`가 된다. 반환하는 각 행의 `directedInterval`은 정확한 유리수

\[
[-2^{-\mathrm{bits}},\;2^{-\mathrm{bits}}]
\]

이고 폭 `2^(1-bits)`를 요청한 **절대 폭**과 비교한다. 폭이 크면 `PRECISION_REQUIRED`를 반환한다. 작은 source 반지름은 `{kind:'EXACT_POSITIVE_DYADIC', numerator:'1', denominatorPowerOfTwo:97793}`로 보존하므로 거대한 분모 문자열이 필요 없다.

이 두 값 행은 `wMinus:{sign}:1:VALUE`라는 고유 key를 갖는다. 기존 270개 도함수 행의 수와 의미는 바뀌지 않는다. 상대 오차, 원래 그래프 재생성, 새 private source token 또는 M2 전체 완료를 주장하지 않는다.

## 인증 연결과 실행 범위

설치 wrapper는 최종 source 실행의 성공·완료 기록, 정확한 source certificate SHA, 교정된 원래 식 (6.2)의 물리 지도, `sourceBounds`의 B/S/결합계 전제 및 두 `center.other` root를 고정하고 검증해야 한다. 이 generic 출력에 `sourceAuthenticated:true`를 붙이는 것으로 인증을 대신할 수 없다. 외부 실행 인증과 새 수치 계산의 출처를 명시적으로 구분해야 한다.

경량 테스트는 고정된 지수의 정확한 정수 항등식, 원래 power quotient를 직접 계산한 양·음 cone endpoint, 두 부호군, 잘못된 center/부호/root/precision 거부, 입력 불변과 취소를 검사한다. 무거운 실제 source constructor는 실행하지 않는다. 교정된 실제 source4 전체의 완료 여부는 별도의 실행 receipt로 판단한다.
