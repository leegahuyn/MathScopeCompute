# P7 replay 메타데이터 보강 — 독립 검토 부록

검토자: `/root/sensitivity_kernel` · 2026-10-11 UTC.

이 문서는 [최초 독립 리뷰](INDEPENDENT_BALL_BACKEND_REVIEW_KO_SENSITIVITY.md)를
그대로 보존하고, 그 뒤의 `replay_evaluation` 메타데이터 수정만 따로 검토한다.

## 정확히 수정한 의미

이전 구현은 일치한 fresh 판정에 대해 항상 `backendRecomputed:true`를 반환했다.
그런데 실제 극점을 포함하거나 지원하지 않는 branch/domain 요청은 `evaluate`가
정확한 정의역 판정만 수행하고 FLINT 특수함수 평가를 하지 않는다. 따라서 그 경로에
대해서도 실제 backend가 다시 계산되었다고 쓰는 것은 과했다.

수정된 구현은 다음을 구분한다.

- `evaluationRecomputed:true`: 원래 요청의 판정을 실제 다시 수행하고 전체 결과가 일치했다.
- `backendRecomputed:actual.scope.actualBackendExecution`: 이번 판정에서 FLINT 함수를
  실제 실행했는지에 맞춘다. 극점·미지원 정의역의 사전 판정에서는 false다.

이는 타당한 수정이다. 최초 독립 리뷰의 §5에서 쓴 “실제 backend에서 다시 계산”은
backend 평가를 수행하는 요청에 한정해야 한다. 최초 문서의 바이트를 고치거나
이 메타데이터 구분을 그때 이미 확인했다고 기록하지 않는다.

## 바이트 및 수학 결과의 불변성

다음 항목을 파일에서 직접 재계산해 확인했다.

| 항목 | 값 |
|---|---|
| 이전 module SHA | `be78ee06368802d1148a3d456b363da1f634d3601445bad37a20d06e79200e32` |
| 새 module SHA | `ff0d3c467d02ee5de99c85215ea129468a35308aec25c664e0e3783ac9102ea5` |
| replay 앞의 불변 바이트 수 | 19,958 |
| 그 prefix SHA | `428b13c082b80d009ecd7b55ff1b1fc0ffbc573280cf62d9fb44abf675406108` |
| 그 밖에 AST가 같은 함수·클래스 | 22개 |
| 실행 body가 바뀐 함수 | `replay_evaluation` 하나 |
| 10개 실제 수학 `record` | 이전·이후 모두 정확히 동일 |

실제 변경 코드를 읽었고 위 prefix equality와 22개 AST 비교를 독립적으로 실행했다.
10개 예시에서 `record` 부분은 정확히 같고 `replay` 메타데이터 부분만 달라지는 것도
직접 비교했다. 입력 parser, dyadic serializer, precision context, 특수함수·도함수
계산에는 변경이 없다.

[교정 기록](ball-replay-metadata-correction.json)의 SHA는
`bbfc57d889bc7915ec8f10a16011ae22392f2fa39ccaf92d448012696e9a0f78`이다.
[최종 attempt3 실행 기록](ball-backend-validation-attempt3.json)의 SHA는
`492407bd0c1e23e5b0506db937e0efd46a256c5b2c64954131f68b8e9f5940db`이며,
16/16 PASS, 관측 종료 코드 0, 10개 실제 fresh replay를 기록한다. 이 부록 작성자가
그 16개 검사를 또 실행했다고 주장하지 않는다.

새 test SHA는 `65d02f2b3779a3148789b09e751edd8402a574a429957595c263e1a4e58febca`,
새 본문 SHA는 `6a4b58db6d0aa8f663a345e623fa1ea0472995bfb150530c12518b5818795c59`다.
이전 module/test/doc은 `attempt2-source-snapshots`에 남아 있다.

## zero certificate 기록과의 관계

zero 본체 SHA는 계속
`3d0355994605d7203b5f9b35d22ffe3ae97aadd26e65c8b6eb6c20c0a929a1ba`다.
해당 모듈은 바뀐 `replay_evaluation`을 호출하지 않는다. 과거 zero 실행 영수증이
이전 ball module SHA에 결속된 사실을 유지한다. 이 교정만으로 새 zero 실행을 했다고
표시하지 않는다. 후속 root CLI 실행은 새 최종 source binding 아래서 별도로 기록된다.

이번 부록은 결과 메타데이터와 그 출처의 정확성 보강이다. 유한 변위 잔여항,
새 formal proof, P7/M3 전체 완료 범위가 추가된 것은 아니다.
