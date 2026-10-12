# 원래 first-selector 튜플 기록 방식의 독립 후속 검토

검토일: 2026-10-11 UTC. 검토자: `/root/sensitivity_kernel`.

기존 `INDEPENDENT_FIRST_SELECTOR_FTC_UPPER_SENSITIVITY_REVIEW_KO.md`(SHA256 `f06d31f129888a34c7fc5c2680afb77b9043a68cc163ba66eb950b1ea1e88bb3`)는 그대로 유지한다. 이번 기록은 실제 통합 source attempt2의 직렬화 실패를 처리하는 **추가 norm 생성 전후의 메타데이터 비교 방식**에 관한 후속 검토다. 원래 수학 kernel은 변경되지 않았다. 검토자는 원본 생성자나 경량 테스트를 다시 실행하지 않았다.

## 1. 고정된 검토 대상과 실행 기록

현재 파일 5개, 보존된 실행 스냅샷 5개 및 경량 영수증의 SHA256을 각각 직접 계산하여 모두 일치함을 확인했다.

| 파일 | SHA256 |
| --- | --- |
| `actual-common-first-selector-ftc-upper-bounds.mjs` | `684c2f0d421a510fd6f68fc47f2564530be2c3654233b969049089e082c2eceb` |
| `actual-common-first-selector-source-snapshot.mjs` | `360bad9378fcf8d31f8074463709d795d0ef6b4c458f6f7368bc9fb3f222d3e1` |
| `actual-common-first-selector-ftc-upper-bounds-kernel.mjs` | `f73a23f469cbfd581af41cfd4883a7e3bf49df831010ec9c2d2fb16026bc6bc1` |
| `tests/actual-common-first-selector-ftc-upper-bounds.test.mjs` | `6fa953eefb3dd48cdff55a84ba1d21787f97f1777dcd11b9fd22bb008958816a` |
| `research/ACTUAL_COMMON_FIRST_SELECTOR_FTC_UPPER_BOUNDS_KO.md` | `ddf129b7547293452a70525c7ec4776cc6863853957c2e3d7b383dd0724b45ae` |

`first-selector-upper-light-attempt2.json`의 SHA256은 `742ef68076e196e099edb5fdf1d16d4d50142d5897a24982a9a84237bd5d298a`, 로그는 `06633741409743c22eccc69689b4cddb1c9091990036e24c0c823b6e6bf37975`이다. 기록된 검사는 12/12 통과, 관측 종료 코드 0, 외부 약 0.333초, Node heap 제한 512MiB다. 실제 source 생성자는 실행하지 않았고, 작은 실제 leading-high-jet 일반 producer와 공개 projection의 직렬화 검사는 실행했다.

## 2. 원래 producer에서 확인한 실패 원인

`actual-residual-order-induction-source.mjs`의 원래 n1 기록 생성부를 읽었다. `global.localBodies`는 원래 `r.localBodies`를 값으로 갖는 존재하는 속성이고, 해당 실제 tuple에는 그 값이 `undefined`다. `stress`는 원래 bootstrap stress 객체이며 그 안에 `Z`, `T` 함수가 들어간다. `actual-continuation-exact-order-two-source.mjs`의 `sourceScaledOperators`에서 생성하는 실제 두 함수의 형태도 읽었다.

이 기록을 일반 JSON으로 바꾸면 `undefined`와 함수 항목이 사라지며, 기존 strict canonical 함수는 사라지게 두지 않고 오류로 처리한다. 새 수정은 원래 필드를 제거하거나 전역 canonical 정책을 완화하지 않는다. 원래 8개 first-selector 조건, n1/m5 상계 계산, FTC 얼굴·길이·상위 단조 비교, 원래 cutoff 및 source 식에도 변경이 없다. 기존 frozen helper와 현재 helper의 전체 차이를 직접 읽어 이 범위를 확인했다.

## 3. 새 비교의 실제 보장

새 helper는 값의 종류를 명시하는 직렬화 가능한 encoding을 만들고, 그 encoding 자체의 원본 문자열을 private `WeakMap`에 보관한다. 존재하는 `undefined`, 없는 필드, `null`, 배열 구멍과 명시적 `undefined`를 구분한다. 데이터 property descriptor와 값, 공유 참조와 cycle, Map의 key/value 및 Set의 순서 있는 기록도 비교한다. 유한 입력 예산을 넘거나 지원하지 않는 타입이면 실패한다.

함수는 단순히 `toString` 값으로 같은 함수라고 판단하지 않는다. 최초 캡처 때의 실제 함수 객체를 private Map에 보관하고, 전후 비교에서 그 객체 identity를 확인한다. 같은 본문 문자열의 새 함수를 넣어도 거절한다. 공개 encoding에는 함수 객체가 들어가지 않는다. 함수가 닫아 둔 원본 `G` 자체를 직렬화해 복원한다는 주장도 없으며, 원래 `G`와 원본 도함수 정의는 기존 private predecessor 검사들이 계속 보호한다.

검사는 추가 n1/m5 norm 생성 **전후**에 적용된다. 성공 후 공개 진단에는 타입 통계·함수와 undefined 경로·전후 비교 여부를 담은 작은 audit만 들어간다. 새 helper와 audit의 `sourceAuthenticated`는 모두 `false`이며, 공개 audit로 live tuple이나 원래 함수 identity를 복원할 수 없다. 원래 실제 adapter의 권한은 기존 private family/body/norm 검사에 의존한다. 비교용 snapshot을 공개 source token으로 승격하지 않는 구분은 적절하다.

## 4. 실제 준비된 기록의 형태와 공개 projection

별도로 보존된 `physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt3-prepared-source-schema.json`을 직접 읽고 SHA256 `1c83b52aa9612b6f57a04c5103a6aa8955cf76f0a710240e1dcd843298c08cd9`를 확인했다. 타입 트리를 직접 다시 세어 배열 179개, 객체 239개, 숫자 1630개, boolean 232개, 문자열 189개, null 3개, undefined 1개, 함수 2개, 최대 깊이 8을 얻었다. 특수 항목은 정확히 `$.1.global.localBodies`, `$.1.stress.Z`, `$.1.stress.T`다. 이 타입·크기는 새 snapshot의 250000-entry/128-depth 예산에서 지원하는 형태다.

이 저장된 schema에는 원래 함수의 live identity가 없다. 위 진단은 실행 중인 process에서 새 helper가 해야 할 identity 비교를 대체하지 않는다. 실제 source3의 최종 성공 역시 이 진단으로 추론하지 않는다. 작성자의 별도 schema 검토 기록 SHA256 `06706b624ed364f33de4bf26da53ec77734c01c2c892643e70ea5e6e786db7d7`과 위 타입 계산도 일치한다.

공개 `proof.leading`, Cartesian/stress, terminal 필드의 생성부를 읽었다. 새 `get()` 계산기·cache·Z/T 함수가 공개 projection에 들어가지 않고 필요한 식 ID·명시적 증명 메타데이터가 추출된다. 원래 `n1Weighted.terminal`도 `actual-pressure-stress-all-order-tail.mjs`에서 이미 strict canonical로 다루는 plain projection임을 확인했다. 12번째 경량 검사는 실제 작은 leading-high-jet producer와 새 terminal/outer projection의 strict canonical 및 `structuredClone`을 통과시킨다. 이것은 전체 실제 prepared/body graph의 생성 성공과 구분해야 한다.

## 5. 검토 결론과 실행 범위

실제 source2가 실패한 필드들을 보존하면서 원래 tuple의 전후 비교를 수행하는 수정으로서 타당하다. 현재 검토 대상의 사용 범위에서 구체적인 수학 또는 source 비교 결함을 찾지 못했다. 이전 8개 경량 검사와 새 4개 검사의 의미는 읽기·영수증·스냅샷 대조로 확인했다.

Source attempt2의 종료 코드 1과 보존된 스냅샷은 그대로 유지된다. 이 문서는 source3의 최종 실행 성공, 실제 first-selector 수치 구간 발급, 270개 절대 구간의 전체 계산 완료 또는 G-NUM/M3 상태 변경을 승인하는 기록이 아니다. 그것은 실행 중인 실제 process의 별도 최종 결과에 따라 판단해야 한다.
