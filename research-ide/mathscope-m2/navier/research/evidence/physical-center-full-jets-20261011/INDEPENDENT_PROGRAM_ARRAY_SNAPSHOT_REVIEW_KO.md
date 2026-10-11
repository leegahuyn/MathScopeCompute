# packed program 배열 보존의 독립 검토

검토자: `ns_proof_audit`. 이 helper 및 해당 제품 수정의 작성자는 다른 agent다. 이번 검토에서는 새 실제 물리 source를 실행하거나 수치·도함수 수식을 수정하지 않았다.

## 검토한 변화와 결론

`actual-program-array-snapshot.mjs`의 전체 본문과 다섯 회귀 검사, `actual-physical-center-jet-bodies.mjs`의 `result.program` 생성 및 뒤따르는 private seal/assert/certificate를 읽었다. 현재 수정은 packed program의 **최상위 배열에 포함되는 원소 목록**을 `slice()`로 고정한다. 따라서 후속 graph/function/system append가 이미 발급한 프로그램에 새 원소를 넣지 않는다. 각 기존 node·정의 객체와 중첩 metadata는 같은 객체를 유지한다.

이 조합은 해당 제품의 기존 검증과 맞는다. 프로그램 전체 canonical 값, 원래 graph prefix의 canonical 값, 원래 함수 정의, 원래 covariance prefix, 제품 data와 부모 private 객체를 각각 다시 확인한다. 기존 node/정의/metadata 변조가 snapshot 때문에 가려지지 않는다. 이 helper는 그 검증을 대신하거나 단독으로 source 권한을 부여하지 않는다. 수학적 expression body, 실제 초기 자료, 적분·미분·양성 가정에는 변화가 없다.

검토 범위에서 구체적 오류를 찾지 못했다. 원래 live-array pack의 append 재현, snapshot 후 hash 안정성, 기존 node/함수/metadata 변조 거절, 잘못된 입력 거절이라는 다섯 검사는 이 변경의 실제 위험을 검사한다. 임의의 모든 pack 설계 또는 인증 없는 외부 객체에 대한 일반 source 인증으로 확대하지 않는다.

## 실행 근거와 바이트 대조

기존 실행 영수증 `program-array-snapshot-kernel-attempt1.json`은 **5/5 PASS, 관측 exit 0**, 432.802124 ms를 기록한다. 같은 이름의 원본 `.log`에는 다섯 검사와 pass/fail 합계가 들어 있다. 이 독립 검토에서 실행을 반복하지 않았으며, 세 파일과 로그의 현재 SHA256을 해당 영수증의 값과 직접 대조해 모두 일치함을 확인했다.

| 파일 | 검토 시 SHA256 |
|---|---|
| `actual-program-array-snapshot.mjs` | `5e42177e8e303a1e9aad9c36d8b5a8de30c59d586586eca2b623400d3591ac01` |
| `actual-physical-center-jet-bodies.mjs` | `cb730c5bb7860687f393881dd176a1d3cd95f68dd507a4005415bfdfd1686105` |
| `tests/actual-program-array-snapshot.test.mjs` | `0fe1bf84ba2045ad399ccc4ef9a8a63aae2314e1597bea312d004729d458585b` |
| `program-array-snapshot-kernel-attempt1.log` | `a106be901dc6ed586531356719f76f370972b8872a5d8127b8183078e0804f8e` |

## 실제 source 결과와의 구분

직전 실제 270개 body 실행은 수학 본문 결속 뒤 이 live-array seal 문제로 **전체 exit 1**이었으며, 그 실패를 성공으로 바꾸어 기록하지 않는다. 이 독립 검토가 직접 확인한 실행은 위 다섯 경량 검사다. 수정 뒤의 전체 실제 source 성공 및 최종 불변성은 별도의 후속 source 영수증이 있어야 한다. 이 문서는 G-NUM 또는 M2 전체 완료를 주장하지 않는다.
