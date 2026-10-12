# M2 재개 · 독립 검토와 복구 기록

검토일: 2026-10-11 KST / 2026-10-10 UTC. 이 기록은 재개 시점의 소스 확인과 아래에 명시한 수정·검사의 범위를 남긴다. 새 릴리스의 배포 여부와 전체 회귀 검사 결과는 별도 릴리스 기록에서 확인한다.

## 1. 복구한 기준점과 원문 64개

인수인계 시점의 v59 (`a66afbbd`), **58 PASS / 6 PARTIAL** 기록 이후의 소스를 복구했다. 재개 시작점에서 확인한 공개본은 **v70 (`b0d649ae`), M2 0.3.6**이며, 기준 브랜치는 `mathscope-m2-visuals-20261010`, commit은 `a8e3361dd04155738f5c873f6af59f1e0a317771`이다. 복구본의 원문 체크리스트는 **64 PASS / 0 PARTIAL / 0 OPEN**이다. 페이지·번들·manifest 대응 결과와 해시는 [소스 복구 기록](source-recovery.json)에 있다.

따라서 이번 재개를 새로 58개에서 64개로 완료한 작업으로 집계하지 않는다. 복구된 기존 판정을 승계하고, 발견한 추적성·재현 경계의 결함과 추가 구현을 구분한다. 기존 **M0 잔여 6개 + M1 64개 = 70/70**의 인수 판정도 보존한다.

첨부 설계도에서 다시 추출한 원문과 [저장소 원문](../original-m2-criteria.json), [현재 상태표](../m2-criteria-status.json)를 대조했다. **64개 모두 ID·제목·전체 합격 문구가 공백 정규화 후 일치하고, 체크리스트 페이지도 일치했다.** 기준을 줄이거나 합격 문구를 고친 차이는 없었다. 설계도 SHA-256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`이다.

| 원문 묶음 | 보존한 ID | 개수 | 설계도 설명·체크리스트 쪽 |
| --- | --- | ---: | --- |
| P4 | P4-01 … P4-08 | 8 | 27–28 |
| P5 | P5-01 … P5-08 | 8 | 29–30 |
| P6 | P6-01 … P6-08 | 8 | 31–32 |
| Y3 | Y3-01 … Y3-08 | 8 | 41–42 |
| Y4 | Y4-01 … Y4-08 | 8 | 43–44 |
| N4 | N4-01 … N4-08 | 8 | 57–58 |
| N5 | N5-01 … N5-08 | 8 | 59–60 |
| I2 | I2-01 … I2-08 | 8 | 17–18 |

원문 기준의 상태와 예제 실행 상태는 별도 집계다. 기준점의 **13개 PARTIAL 예제**는 짧은 게이지 앙상블과 제한된 NS 계산의 범위를 계속 드러낸다. 기준 64 PASS를 이유로 이 예제들을 일괄 COMPLETED로 바꾸지 않는다. 각 기준의 `implementedScope`·`acceptanceScope`와 [구현 범위 설명](../../README_KO.md)을 함께 읽는다.

## 2. 게이지 16개 기준의 근거 연결 보완

[gauge/index.mjs](../../gauge/index.mjs)의 `getChecklist()`가 Y3/Y4 **16개 각각의 실제 근거 경로**를 반환하도록 보완했다. 출처는 기존 [criterion-completion.json](../../gauge/evidence/criterion-completion.json)이며, 항목별 소스와 이미 존재하는 검사·독립 검증 기록에 연결한다. 원래 상태와 설명은 유지했다.

`evidencePathBase`, `evidencePaths`, `testStatus`, `inheritedFrom`이 승계 근거를 표시한다. `inheritedFrom.newExecution:false`는 과거 영수증을 새 실행으로 세지 않도록 명시한다. `tests.tap`, 독립 검증 JSON, Lean transport 기록의 존재와 연결을 확인한 것이며, 그 수치 검사나 Lean을 이번에 모두 다시 실행했다는 뜻이 아니다.

새 [evidence-links.test.mjs](../../gauge/tests/evidence-links.test.mjs)는 **2/2 통과**했다. 원문 16개 ID, 기존 상태·설명, 항목별 경로의 실제 존재, 경로 중복·이탈 방지, 반환 객체를 수정해도 다음 조회가 바뀌지 않는 조건을 확인한다.

## 3. JSON import · 재현의 신뢰 경계와 비동기 상태 변경

[replay-import.mjs](../../core/replay-import.mjs), [engine.mjs](../../core/engine.mjs), [workspace.mjs](../../workspace.mjs), WebMCP 경로를 함께 검토했다. 직렬화된 파일의 등급·receipt는 신뢰하지 않는다. 요청·입력·결과·수학 결과·실행 환경의 해시와 설치 Worker의 환경을 검사한 뒤, **현재 세션에서 새 실행으로 얻은 결과**를 비교한다. 모든 해시를 다시 계산해 붙인 가짜 결과도 실제 재실행과 다르면 `MISMATCH`이다. 다른 실행 환경의 파일은 `INPUT_ONLY`로 제한하므로, 브라우저가 달라도 무조건 재현된다고 주장하지 않는다.

검토 중 발견한 편집·세션 변경 경쟁 조건은 다음 경계로 보완했다.

- `sourceCurrent()`가 content ticket, 제출 순서, 원래 세션 ID·revision을 확인하고, `initialCurrent()`가 초기 표시 상태도 확인한다.
- `shouldDispatch`를 제출 함수의 마지막 비동기 작업 이후, **jobs에 삽입하기 직전**에 다시 검사한다. 오래된 import는 작업을 만들지 않는다.
- 제출 알림·최종 선택·성공 및 오류 보고에도 현재 상태 검사를 적용한다. 늦게 끝난 import가 새 편집이나 선택을 덮어쓰지 않는다.
- 제출 뒤 취소하면 새 Worker를 중단하고 늦은 결과를 무시한다. 제출 callback이 예외를 던져도 새 작업을 취소·정리한 뒤 오류를 반환한다.

집중 검사 [replay-import.test.mjs](../../core/tests/replay-import.test.mjs)는 **11/11 통과**했다. 정상 새 세션 재현, 잘못되거나 과도한 JSON, 해시·환경 위조, 다른 환경, 해시가 일관된 가짜 결과, 제출 전 취소, 비동기 중 상태 변경으로 작업 0개 유지, 제출 후 취소, callback 오류 정리, WebMCP 입력 경계, 근거 URL 경로 제한을 포함한다. import된 과거 기록을 다른 세션의 저장 권한으로 승격하지 않는다.

### 추가 확인: 파일을 읽는 동안 이전 JSON을 재현하던 경로

최종 소스 검토에서 별도의 경쟁 조건을 발견했다. textarea에 A가 남은 채 파일 B를 선택하면 ticket은 먼저 증가하지만 `file.text()`를 기다리는 동안 A를 재현할 수 있었다. 이 경우 A의 내용과 새 ticket이 함께 캡처되고, B를 textarea에 대입할 때 ticket이 다시 바뀌지 않아 A의 현재 상태 검사가 통과할 수 있었다.

수정된 파일 `change` handler는 파일 존재를 확인한 직후, **크기 검사와 첫 `await` 전에** textarea를 비우고, 이전 report 패널을 숨기고, report 내용을 지우고, `파일을 읽는 중입니다.` 상태를 표시한다. 이 네 작업이 동기적으로 끝나므로 이후 UI 버튼은 이전 A를 읽을 수 없다. 크기 초과나 읽기 실패 때도 A가 남지 않으며, 읽기 중 붙여넣기·다른 파일 선택은 기존 ticket 검사로 보호된다. 해당 소스의 실행 순서를 확인해 **이 특정한 이전 JSON 재현 경로가 차단됨**을 검토했다.

이 추가 확인은 소스 제어 흐름 검토이며 새 테스트 실행이나 파일 읽기를 강제로 지연한 실제 브라우저 재현 검사는 수행하지 않았다. 앞의 11/11 기록을 이 파일 선택 경쟁 조건의 추가 회귀 검사로 세지 않으며, 이 문단으로 새 배포나 전체 검사 완료를 주장하지 않는다.

## 4. 실제 pulse의 첫 slow 미분 검토

[source adapter](../../navier/actual-pulse-sensitivity.mjs), [변분 kernel](../../navier/actual-pulse-sensitivity-kernel.mjs), [행렬 미분 상계](../../navier/actual-pulse-sensitivity-bounds.mjs)를 검토했다. 현재 구성에서 구체적인 수학적 결함을 찾지 못했다. 확인한 핵심은 다음과 같다.

- 실제 source의 두 부호에 대해 원래 행렬을 유지하고 `partial_a M`을 그 식에서 생성한다. 변분식은 `s_v=M*s+(partial_a M)*w`이다.
- 움직이는 왼쪽 끝점의 초기값 `g_a-M(left)*g*left_a`와 평가 끝점의 chain rule을 보존한다.
- `t=P*B*w`의 미분에 `P*(B_a*w+B*s)`와 실제 초기 frame 미분을 포함한다. 유한 근사의 절대 tail에도 **P(v)**를 명시적으로 곱한다.
- 완성된 source의 C2 상계와 실제 분모 하계를 사용한다. `|n_tan|>=1/(k*B)`는 0이 아닌 정수 `k*p`에서 나오며, 표시 band가 이후의 공통 `qStar` 아래라는 가정을 쓰지 않는다. 블록 infinity norm `K+Ka`와 factorial tail은 유한 근사를 정확해로 바꾸지 않는다.

**이번 구현의 실행 API 지원 범위는 `ellExact:"1"`, `terms:0`, `derivativeOrder:1`, R/Z/T 중 하나로 제한된다.** 실제 양의 항 수를 물질화하는 경로의 메모리 한계가 확인되어, 다른 band·canonical anchor·양의 표시 항 수는 source 생성 전에 자원 한계로 거절한다. 표시한 것은 **0항 근사와 0이 아닌 수렴 tail**, 그리고 별도로 보존한 정확한 Volterra 미분 식이다. 실제 source 미분의 수치 quadrature나 작은 수치 오차를 얻었다는 뜻은 아니다.

이 추가 구현은 고정 label에서의 첫 국소 slow 미분이다. 대표점·label 미분, 두 번째 slow 미분, 실제 covariance 가중치 미분, 전체 source curl, 모든 slow Gaussian 미분, 전체 물리 residual·flat-error 조립은 별도 범위로 남아 있다. `formalPass:false`와 새 Lean 증명 없음도 유지한다.

## 5. 이번 기록으로 인정하는 검사 범위

이 문서의 신규 집중 실행 수치는 **게이지 연결 2/2, import 11/11**이다. 검사 명령은 저장소 루트에서 다음과 같다.

```sh
node --test research-ide/mathscope-m2/gauge/tests/evidence-links.test.mjs
node --test research-ide/mathscope-m2/core/tests/replay-import.test.mjs
```

검토 당시 출력의 SHA-256은 각각 `09e2f5d38e256c3a235a99572e4d91c4547ffa6ea10ffc368b21ff726fefd21c`, `09367933f5c55a562de7fb94d7a9f27178b2a32e1d8f01673217b9a9d265cdf3`이다. 이는 해당 집중 실행의 기록이며 변경 전체의 회귀 통과를 대신하지 않는다. sensitivity의 독립 수학 검토도 전체 actual-source suite 완료 영수증을 대신하지 않는다.

과거 v70 검사·인증 기록의 승계, 이번 신규 실행, 새 릴리스의 최종 검증과 배포는 각각의 시점과 범위를 유지한다. 이 메모는 새 배포 완료, 새로운 Lean kernel 통과, 전체 Navier–Stokes 구성이나 모든 차수의 물리 잔차 완성을 선언하지 않는다.
