# 첫 공통 선택 FTC 상계의 독립 읽기 검토

검토자: `/root/sensitivity_kernel`  
검토 시점: 2026-10-11 UTC  
검토 방식: 새 두 모듈, 경량 검사, 수학 설명과 원래 producer를 읽고 최종 파일 SHA를 실행 receipt와 직접 대조했다. 이 검토에서 실제 공통 family나 물리점 생성기를 다시 실행하지 않았다.

## 1. 결론과 실행 범위

아래에 고정한 코드가 선언하는 **원래 첫 여덟 조건의 별도 상계** 범위에서 구체적인 수학 오류를 찾지 못했다. 이는 원래 FTC 값과 새 상계의 동등식이 아니라 부등식이다. 원래 `b_n`, 첫 selector, 물리점, cutoff tuple은 바꾸지 않으며, 원래 양의 `h`를 사용한다.

확인한 경량 receipt는 `first-selector-upper-light-attempt1.json`이다. 8/8 PASS, 관측 종료 코드 0, 외부 경과 시간 0.34495652700206847초가 기록되어 있다. receipt의 네 파일 SHA가 현재 파일과 모두 일치함을 확인했다. **이 receipt는 실제 private source 실행의 성공을 기록하지 않는다.** 새 adapter를 전체 source에 붙이는 실행, 원래 selector의 닫힌 수치 구간, G-NUM의 완료는 이 검토에서 승인하지 않는다.

| 파일 | SHA-256 |
|---|---|
| actual-common-first-selector-ftc-upper-bounds.mjs | `37c678fb96ed0f34aa043e87051233f0ddc3414140daacf3180eee5cf7a4abdb` |
| actual-common-first-selector-ftc-upper-bounds-kernel.mjs | `f73a23f469cbfd581af41cfd4883a7e3bf49df831010ec9c2d2fb16026bc6bc1` |
| tests/actual-common-first-selector-ftc-upper-bounds.test.mjs | `db2fee9ee2e5c4b81af2b0c425119143b81ece5e59cc9188cf4d526141c95ce6` |
| research/ACTUAL_COMMON_FIRST_SELECTOR_FTC_UPPER_BOUNDS_KO.md | `bcac7c1411feac632ad901e764f96c4cf8fe8ebe7d988cc51f3d95d498eefd38` |
| first-selector-upper-light-attempt1.json | `ac84260c3e55517d2e3ba41555461e959601842909b74ae1674202f48c709916` |

## 2. 원래 도함수 예산과 축의 정칙성

`actual-residual-order-induction-norms.mjs`와 `actual-leading-all-order-jets.mjs`를 대조했다. 후자의 `boundConvention`은 각 반환 scalar가 요청한 전체 미분 직사각형을 덮는다고 선언하며 실제 producer도 그 공통 root를 각 행에 넣는다. 따라서 새 코드가 `leadingNormalized.U[0].upper`와 `FActive[0].upper`를 사용하는 것은 zeroth derivative 하나를 높은 차수로 재명명한 것이 아니다. 이번 요청의 실제 leading 직사각형은 `(11,24)`다.

첫 물리 도함수는 profile 차수를 한 번 올린다. 세 좌표의 anchored FTC는 각 좌표를 최대 한 번 추가하므로 Cartesian 공간 합계 최대 3, eta 최대 2, 총합 최대 4가 필요하다. 원래 점성항의 방사형 두 차수와 signed primitive의 한 차수 감소를 합치면 `F1/U1` 총 5차가 필요하다. 새 `n=1,m=5` norm의 요구는 이 계산과 일치한다. 실제 ordinary mixed Leibniz 재귀의 이항계수를 유지한다.

축을 포함한 구간에는 auxiliary의 여섯 성분 정칙 해와 원래 core agreement를 사용한다. `X>=Xa/2`에서만 `E1/sqrt(2X)`를 미분하며 모든 Leibniz 항을 포함한다. 두 구간을 max로 결합하므로 축에서 인위적인 `1/sqrt(X)` 평가를 만들지 않는다. `M/X=integral_0^1 U(sX) ds`의 방사형 도함수에는 `1/(r+1)`가 남는다.

정확한 이차 Cartesian 치환의 짝수 수축 계수와 선형 좌표 인자의 도함수를 확인했다. 원래 velocity/potential의 아홉 성분과 pressure/stress의 세 성분은 절댓값을 취한 공통 max 안에 모두 들어간다.

## 3. 완전한 outer와 terminal 식

`actual-global-source-outer.mjs`와 `actual-continuation-exact-heat.mjs`의 열두 실제 stage를 대조했다. stage 끝점 및 `logAStart`는 eta 독립이다. 비상수 도함수에는 원래 고정 기울기, sigma, interpolation, `log(1+eta^2)`와 terminal `fo`가 남는다. `Tf>1`, `fo>=1/2`, 원래 양의 분모를 사용하면 새 유한 reciprocal/log 및 Bell 상수가 총 5차의 큰 상계를 준다. 원래 CSelected를 source parameter로 결속하며, 이미 증명된 실제 scalar E 높이 `<CSelected^2`를 사용한다. 높이 상계 자체를 다시 지수화하지 않는다.

angular repair의 두 bump는 버리지 않는다. `actual-leading-high-jets.mjs`의 같은 small-root branch, 반지름 1/4 복소 eta tube와 높이 `65536*lambda^29`에서 Cauchy 상계를 얻으며, 실제 bump의 추가 sigma 도함수를 포함한다. 이는 전체 heat가 eta 경계 바깥에 복소 해석적으로 연장된다는 주장이 아니다.

heat에는 전체 Gamma 적분의 `|H^(j)(z)| <= j! (j+1)!`, `z>=0`, `0<h<1`를 쓴다. heat가 활성인 `X>=XK>1`의 logX/eta jets, 원래 heat cutoff와 `fo`, 마지막 `(2X)^(-1/2)` 및 unsigned Stirling 변환이 남는다. `Xplus` 이전은 같은 실제 FActive norm으로 덮는다. 소스의 무한 heat tail을 삭제하지 않는다.

원래 terminal B의 `f_second`, `f_first`, `(64-24 delta^2)f`와 `-bz`를 실제 식과 대조했다. 절댓값 상계에서는 각각 완전한 양의 Leibniz 합으로 확대하며 항을 생략하지 않는다. 분모의 양의 하한은 `exp(-64/49)`이고 reciprocal의 이항 재귀가 맞다. flat Gaussian의 Laurent 재귀 `P_next=P_prime+8 delta^(-3) P`와 `u^n exp(-u^2)<=ceil(n/2)!` 상계도 맞다. 실제 요청은 **delta 차수<=2, eta 차수<=2, 총합<=3**이고 factor에는 필요한 다섯째 도함수까지 생성한다. delta=0에서 음의 거듭제곱을 평가하지 않는다.

## 4. 실제 stress, weighted FTC와 단조 비교

원래 pressure/stress producer와 대조하여 시간, 대류, 압력, 방사형 점성 및 leading axial viscosity가 모두 상계에 남는 것을 확인했다. signed primitive의 zeroth order는 전 지지 길이를, 양의 방사형 차수는 피적분함수의 한 차수 낮은 도함수를 사용한다. `X<Xminus`의 원래 zero extension에 양의 반지름 분모를 잘못 적용하지 않는다.

interior에서 `log(X/Xa)>=t1/128`, `log(Xb/X)>=1/4`이므로 `zeta^-1<=exp(16448)`와 그 첫 X 도함수 상계의 계수 `4194304/t1+512`가 맞다. FTC의 추가 X 미분은 `T_(r,k)/zeta`의 두 인자에 작용한다. 원래 quotient를 반복 미분한 것으로 잘못 바꾸지 않는다.

각 원래 FTC 면에는 `sqrt(1+f^2)<=1+M`과 그 면의 실제 side-length 곱을 사용한다. 이후 원래 양의 bound 식에 한해 합, 곱, max 및 증가 함수를 따라 상계를 전파한다. 바뀐 피연산자의 inverse나 negative power는 거부한다. 공유 유리수 1, 2 등으로 단순화된 면은 전역 치환 대상에서 제외한다. 이 단조성은 실제 producer의 비음수 weight/길이/상수 구조에 의존하며 generic helper만으로 임의 부호의 입력까지 인증하지 않는다.

## 5. 그래프 결속과 수정 이력

원래 private body assertion은 physical point, band, family, coefficient prefix까지 확인한다. 원래 FTC의 body, 좌표, 끝점, face derivative 및 bound의 copied-prefix literal도 별도로 검사한다. 신규 sibling 산술은 연산별로 복사하므로 같은 정수 ID의 우연한 충돌을 source 식의 동일성으로 취급하지 않는다. `integer_power`의 exponent는 child ID로 걷지 않는다.

초안에서 새 upper DAG의 node 변경이 기존 body prefix 밖에서 일어나면 private assertion이 놓칠 수 있는 결함을 검토 중 보고했다. 최종 버전은 `norms` 객체 identity를 고정하고, structured-clone된 upper arithmetic trace의 모든 소비 node를 현재 G와 대조한다. 관련 negative control이 최종 경량 8개 검사에 들어 있다. 원래 A.13 및 function body는 기존 private prefix 검사를 유지하며 기존 producer를 재봉인하지 않는다.

공개 projection은 G/p/bodies/family/norms를 제외하고 private authority를 복구하지 않는다는 범위를 명시한다. actual source 실행 후에는 별도의 실행 결과와 그 실제 source/import SHA를 이 읽기 검토와 함께 확인해야 한다. 이 문서는 새 Lean kernel theorem, 원래 FTC의 직접 수치 평가 또는 M2/M3 전환의 증거로 사용하지 않는다.
