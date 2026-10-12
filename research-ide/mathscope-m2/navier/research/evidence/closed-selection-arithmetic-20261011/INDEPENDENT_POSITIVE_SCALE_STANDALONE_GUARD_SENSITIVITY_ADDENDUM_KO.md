# 양의 수치 스케일의 독립 봉인 보강 검토

검토일: 2026-10-11 UTC. 검토자: `/root/sensitivity_kernel`.

이 기록은 같은 디렉터리의 `INDEPENDENT_POSITIVE_SCALE_SENSITIVITY_REVIEW_KO.md`에 대한 별도 후속 기록이다. 이전 검토 파일의 SHA256 `2e78e81916a668466cded2275be5db3854465b5ad3f4e0a8f2ae22a0968a3048` 및 당시 실행 스냅샷은 수정하지 않았다. 이번에는 원본 생성자를 실행하지 않고 변경된 검사 코드, 원본 스냅샷과의 차이, 보존된 경량 실행 기록을 읽었다.

## 1. 검토한 수정본

| 파일 | SHA256 |
| --- | --- |
| `actual-common-positive-scale-enclosure.mjs` | `2f429d1cccecb9dc240c4a8622c82e1a85696512ca30f9f7e42334ea00f60078` |
| `actual-numerical-scale-root-seal.mjs` | `dd663731d5eac692a04c161e6bae26cf0e4a99f672dfcc2401e1634f933c152d` |
| `tests/actual-numerical-scale-root-seal.test.mjs` | `8bb7771829941c2b3825d4aaae3908fc1215ba11cce9b91deb763c03e5f2b354` |

현재 파일의 해시를 직접 계산하여 위 값과 일치함을 확인했다. 이전 실제 2차 실행의 `actual-physical-center-full-jet-source-attempt2-late-snapshots/` 안에 있는 adapter는 여전히 SHA256 `976ea24af119800e55fc348257ff180a7ab70d0dfdad80ad6dc6f345a758be20`이다.

## 2. 계산 본문과 실행 당시 파일의 보존

이전 스냅샷과 현재 adapter의 `export function attachActualCommonPositiveScaleEnclosure`에서 `const ownedRoots` 직전까지를 직접 추출했다. 두 본문은 15,942바이트로 정확히 동일하며 SHA256은 모두 `27603cd0adf68ffb48c46174de0a82db8502b09efa11c3409f7c139acb0f5c6d`이다. 전체 파일 차이도 직접 읽었다. 변경은 새 검사 함수의 import, `absoluteValues`의 원본 root를 검사 집합에 포함하는 부분, 새 private snapshot의 생성 및 검증 호출이다.

따라서 이번 수정에서 원래 점·선택자·팔레트·기하 스케일·수치 끝점·오차 식은 바뀌지 않았다. 이 동일성 검토는 계산 본문에 관한 것이며, 전체 adapter의 SHA가 같다는 주장은 하지 않는다.

## 3. 이전에 지적한 누락을 막는 방식

이전 child adapter는 `namedRoots`와 `rowScales`의 노드만 직접 검사했다. 별도로 재구성한 절대 행렬식이 그 집합 밖의 새 노드가 될 수 있었다. 이번 수정은 `absoluteValues[].sourceRoot`도 포함하며, attachment 시작 시점의 `sourceCount`부터 생성이 끝난 시점까지 **추가된 모든 노드**를 직렬화하여 private `WeakMap`에 보관한다.

검증은 동일한 실제 `G` 객체, 공개 기록의 내용, 보존 구간의 모든 노드, 표시된 root 노드들을 각각 대조한다. 스냅샷은 직렬화된 문자열이므로 원래 노드 객체를 나중에 바꾸어도 검사용 사본이 함께 바뀌지 않는다. 표시되지 않은 새 중간 의존 노드도 보존 구간에 들어간다. 관련 없는 노드를 보존 끝점 이후에 추가하는 작업은 허용한다.

새 helper 자체는 `sourceAuthenticated:false`, `numericalCalculationPerformed:false`이며 원본 권한을 발급하지 않는다. attachment 이전의 원본 노드와 함수 정의는 기존 target 및 first-selector private 검사가 계속 담당한다. 이 책임 구분과 실제 adapter의 두 기존 검사 호출이 유지되는 것을 확인했다. 새 child 검사에서 원래 절대 행렬식 및 새 의존 노드 누락과 같은 구체적 결함은 찾지 못했다.

## 4. 경량 검증 기록의 범위

`positive-scale-standalone-seal-guard.log`에는 9개 검사 전부 통과, 실패 0이 기록되어 있다. 새 helper의 4개 검사는 절대 행렬식·제곱근 노드 변조, 표시되지 않는 새 의존 노드 변조, 허용되는 후속 append, 이전 표시 root 변조, 복사한 공개 기록 및 공개 메타데이터 변조를 포함한다. 기존 기하 산술의 5개 검사가 함께 실행됐다.

`positive-scale-standalone-seal-guard.json`의 관측 종료 코드는 0, 외부 경과 시간은 약 0.438초이며 `sourceRunPerformed:false`이다. 이는 새 수치·원본 생성자의 실행 기록이 아니다. 이번 독립 검토에서도 테스트나 원본 생성자를 다시 실행하지 않았다.

| 보존 기록 | 직접 확인한 SHA256 |
| --- | --- |
| `positive-scale-standalone-seal-guard.json` | `db1affa27faa633bb5c02c98c4848926c38f4e60f2449fb3dc6a88d63533e632` |
| `positive-scale-standalone-seal-guard.log` | `ba874c43aff40eca9671a776acf143da26681b742e61d1ce791be36fb62b595e` |

## 5. 실제 2차 실행과의 구분

원래 `physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt2.json`과 별도 `-process.json`도 직접 읽었다. 관측 종료 코드는 1, `complete:false`, `pass:false`이다. 오류는 first-selector adapter에서 선택적 `global.localBodies`의 `undefined`를 직렬화한 것으로 기록되어 있으며, 새로운 양의 스케일 생성자 진입 전이다. 네 source 검사와 270개 도함수 본문 생성 성공은 로그에 남아 있지만, 그 사실을 이 양의 스케일 adapter의 실제 실행 성공으로 확대하지 않는다.

해당 source JSON의 SHA256은 `e07155ea8a1ce78d41b513f8b3dc1de4b35f6116d41fcc3efacfe48e42cdf679`, process 기록은 `d3afdfb31c91a42a60fc9ac35401a898e97e437503d00524d91a422f07ee50a0`이다. 새 guard는 이 실패 실행이 끝난 뒤 작성됐으며, 당시 import 스냅샷에 소급하여 포함되지 않는다.

검토 결론: 원래 계산을 보존하는 독립 검사 보강으로서 타당하다. 전체 원본 수치 계산의 완료, 실제 270개 절대 구간의 실행 성공, G-NUM 전체 완료 또는 M3 시작 여부는 이 기록으로 승인하지 않는다.
