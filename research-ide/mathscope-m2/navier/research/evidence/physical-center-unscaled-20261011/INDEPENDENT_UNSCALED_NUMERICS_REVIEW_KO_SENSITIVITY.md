# 원래 source 미분량의 닫힌 수치 곱셈: 독립 검토

검토자: `/root/sensitivity_kernel`  
검토일: 2026-10-11 UTC  
방법: 새 모듈, 테스트와 설명을 읽고 원래 228+42 body의 미분량 정의에 대조했다. 새 실제 source constructor나 browser/worker는 실행하지 않았다.

## 결론

최종 generic 함수의 방향 구간 곱셈, 입력 호환성 및 선언된 인증 범위에서 구체적인 오류를 찾지 못했다. 이 함수는 새 coefficient 구간에 설치된 양의 수치 인자 구간을 곱한다. 설치된 인자를 재평가하거나 실제 source를 재구성하지 않는다. `sourceAuthenticated:false`와 외부 pinned 증거를 확인해야 한다는 책임 경계가 유지된다.

검토 중 원래 R 정규화가 일반 편미분으로 읽힐 수 있는 문구를 보고했다. 최종 버전은 이를 아래처럼 명시한다.

- slow/fast 228행의 출력 대상은 원래 `normalizedDirectionDerivative`다. 대문자 R이 r번 있으면 지정점의 `Rsharp^r`가 보통 편미분에 곱해진다. Rv에도 이 인자가 남는다.
- physical curl 42행의 대상은 원래 `physicalValue`이며, 원통 frame 및 Hessian connection을 포함한다.
- 함수는 Rsharp를 나누지 않는다. `originalBoundQuantity`, `normalizedRadialPower`, `derivativeInterpretation`을 보존하며 일반 편미분 자체라는 주장은 false다.

Rsharp는 이 정규화에서 지정점에 고정된 수다. 반복된 R의 의미는 `Rsharp^2 * partial_R^2`이지, 가변 계수를 함께 미분하는 Euler 연산자 `(R partial_R)^2`가 아니다. UI에서도 이 구분을 유지해야 한다.

## 수치 계산과 호환성

양의 scale의 하한과 상한을 모두 엄밀히 양수로 검사하고, 닫힌 endpoint의 구조와 순서를 검사한다. 새 유리수 coefficient에는 양수, 음수, 0 교차와 정확한 0을 모두 허용하며 네 모서리를 포함하는 방향 곱셈을 사용한다. 원래 작은 양의 scale을 0으로 대체하거나 부호에 따라 편의상 한 끝점만 고르는 경로를 찾지 못했다.

세 입력 행 집합은 같은 typed key를 가져야 한다. 중복·누락·잘못된 key 및 scale root 불일치는 거부한다. 서로 다른 행이 같은 양의 source root를 공유하는 것은 허용한다. 결과 객체는 입력의 중첩 interval을 공유하지 않는다.

generic 함수는 1..270개의 부분 집합도 받을 수 있다. 따라서 이 모듈의 성공만으로 원래 전체 270행이 모두 있다는 사실을 증명하지 않는다. 전체 행 목록, 원래 derivative/scale root, source proof, 설치된 coordinate와 endpoint의 실제 관계 및 artifact SHA는 상위 wrapper가 별도로 확인해야 한다. 코드와 설명이 이 한계를 명시한다.

## 정확도와 자원

coefficient의 폭과 설치된 scale coordinate의 폭을 각각 끝점에서 정확한 유리수 산술로 다시 계산하고, 선언된 폭 문자열과 일치시키며 요청 폭과 비교한다. 더 좁은 설치 scale 증거가 필요한 요청은 `PRECISION_REQUIRED`로 끝난다. 계수 계산 요청의 192..512비트와 곱셈 계층의 384비트를 별도 표시한다.

scale coordinate는 value 또는 명시된 반복 로그 좌표다. 그 좌표의 작은 폭과 coefficient의 작은 폭을 곱한 결과가 같은 상대오차/절대오차를 가진다고 주장하지 않는다. 최종 raw interval은 지정된 원래 미분량을 포함하지만, 그 원래값의 상대 정확도 및 절대 폭 보장은 false다.

닫힌 endpoint는 유리수 문자열과 exp/neg만 허용한다. 최대 5,000,000 연산, 30,000 memo entry, depth 128 및 유리수 32,768비트 제한과 취소 hook이 명시돼 있다. generic source flag나 닫힌 수식의 모양만으로 private 증명 토큰을 만들지 않는다.

## 실행 기록과 고정 파일

`unscaled-numerics-light-attempt2.json`의 9/9 PASS, 관측 종료 코드 0, 0.1908637490014371초, heap 상한 512 MiB를 확인했다. 이 기록은 generic 경량 검사이며 실제 source/worker 실행은 false다. 이전 8개 검사와 첫 버전 snapshot은 그대로 보존돼 있고, 두 번째 실행은 구간 곱 알고리즘을 바꾸지 않고 R 정규화 metadata와 회귀 검사를 더했다.

| 파일 | SHA-256 |
|---|---|
| actual-physical-center-unscaled-numerics.mjs | `d946ca075ec205c6ea2bf55cd776603a97fa6d222c73921f30ce8ec5cdadad20` |
| tests/actual-physical-center-unscaled-numerics.test.mjs | `8dafb848a999dcc33bebd2273e526dfb89b11383e4ddd5168572318fc9b5c5f8` |
| research/ACTUAL_PHYSICAL_CENTER_UNSCALED_NUMERICS_KO.md | `68abd44fe5d3b9fe8ff35314d8e36d3abac3c9c9ff08eedaf2a989b36eef7095` |
| unscaled-numerics-light-attempt2.json | `51b597a5645f290824e1dc0617230f17ead43f00593f89ab86890d1083cf49a9` |
| unscaled-numerics-light-attempt2.log | `d19d6b9edccac680f6b3c04f49b40093ed91d9e136b5b53682d56a5bbac11ac6` |

이 읽기 검토는 설치된 실제 수치 source packet의 성공을 대신하지 않는다. 그 packet과 상위 hash 검증, 전체 worker/browser 실행은 별도 결과로 확인해야 한다. G-NUM/M2 완료 또는 M3 시작의 판정을 이 generic 검사만으로 올리지 않는다.
