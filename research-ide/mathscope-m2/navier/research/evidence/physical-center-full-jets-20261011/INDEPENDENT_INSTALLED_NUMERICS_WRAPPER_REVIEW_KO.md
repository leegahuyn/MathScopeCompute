# 설치된 원본 증거와 새 수치 재계산의 연결 검토

## 1. 검토 대상과 현재 결론

검토자 `/root/sensitivity_kernel`은 ROOT가 작성한 설치 증거 wrapper, pin 생성기,
새 필수 build verifier와 기존 replay 경계를 읽었다. 이 세 ROOT 모듈의 작성에는
참여하지 않았다. 아래에 고정한 코드 버전에서는 외부에서 완료한 원본 증거와
현재 요청의 외향 반올림 재계산을 구별하고, 실제 행·정규화·양의 오차·역행렬
조건을 연결하는 범위에서 추가적인 구체적 결함을 찾지 못했다.

이는 **코드 읽기 검토**이다. 이 기록을 작성할 때 설치 증거 파일은 최종
실제 source 8/8 및 관측 exit 0을 기다리고 있었으며, wrapper/pin/build verifier를
실제 설치 증거로 실행하지 않았다. 진행 중인 실제 source attempt 2의 성공을
미리 인정하지 않는다. 최초 source attempt 1은 마지막 predecessor 봉인 검사에서
실패했고 그 실패 실행은 별도로 보존된다.

## 2. 원본 프로그램과 270행의 의미

pin 생성기는 source/check 8개, 외부 프로세스의 완료·비시간초과·exit 0,
실제 JSON/log SHA, 초기 및 후반 import manifest와 현재 파일 SHA, 각 원본
certificate의 SHA를 모두 확인한 후에만 설치 파일을 만든다. 이어서 원본
수치 certificate의 각 행을 derivative-body certificate와 비교한다.

228개 pulse/공분산/weight 관련 행과 42개 물리 curl 행의 key는 quantity,
sign, component, derivative로 결정한다. 원본 도함수 ID, 평가점 ID, 양의
정규화 ID 및 계수 ID를 유지한다. 물리 42행에는 회전하는 원통 기저와
각도 방향의 Hessian 연결이 포함되며, 단순한 성분별 각도 2차 미분과
같다고 주장하지 않는다.

wrapper는 설치 파일의 전체 canonical SHA와 profile/양의 h 계약을 다시
확인한다. 270개의 서로 다른 key와 원본 도함수/정규화 ID를 요구하며,
새 수치 행을 동일 quantity/sign/component/derivative/order에만 붙인다.
파일로 가져온 임의 증거, 점, 행렬 또는 도함수는 wrapper 입력이 아니다.

## 3. 오차와 정밀도 및 역행렬 조건

각 새 수치 행의 양의 분석적 오차 반경은 실행된 원본 증거의 반경보다
작을 수 없다. 요청 tolerance를 줄이기 위해 이미 저장된 넓은 구간의
끝점만 바꾸는 경로가 없다. 순수 재계산 모듈은 cutoff, 절대 중심값,
25개 값 구간, 여섯 slope 구간, 228+42 도함수 계수, 표적 regular 적분 및
15개 profile 로그 구간을 현재 precision과 tolerance로 다시 계산한다.
각 구간의 실제 유리수 폭을 검사한다.

wrapper의 역행렬 conditioning 함수는 새 값 구간을 입력으로 받는다.
원본 source binder에서 실행하는 함수와 추출된 수치 함수의 본문이 pin과
build 단계에서 정확히 일치해야 한다. conditioning은 일반 산술 조건이며
그 자체가 source 인증을 만들지 않는다. 실제 source와의 연결은 고정된
외부 증거에만 의존한다.

순수 재계산 모듈은 본 검토자가 작성한 파일이다. 해당 모듈의 7/7 실행 및
47개 보조 구간과 270행 폭 검사는 구현자 검증으로 구분한다. 이 문서가 그
작성자를 바꾸거나 별도의 독립 수학 검증을 추가하지는 않는다.

## 4. 발견한 build 경계와 반영된 수정

최초 wrapper/pin 코드에는 산술 manifest를 기록해도 그 후의 build에서
현재 산술 파일과 다시 비교하지 않는 간극이 있었다. pin 뒤에 산술 파일을
변경하고 새 Worker를 만들면 Worker 해시는 새 파일을 고정하지만, 원래
외부 증거와 그 산술의 호환성을 다시 확인하지는 못한다.

이 지적 뒤 ROOT가 `verify-physical-center-installed-evidence.mjs`를 추가하고
`build_m2.py`의 첫 subprocess를 필수 검사로 바꿨다. 현재 verifier는 설치
증거 SHA, 산술 manifest의 count/hash와 각 현재 파일 SHA, source/process/
수치 certificate 파일 SHA, 원본 source의 8개 검사와 exit 0, 초기/후반
manifest SHA 및 동일한 conditioning 본문 SHA를 대조한다. 따라서 검토한
build 경로에서는 오래된 pin에 변경된 산술을 조용히 연결할 수 없다.

## 5. Serialized replay의 제한

기존 M2 engine은 설치된 Worker 문자열을 SHA로 확인하고 replay 때 동일
환경 및 Worker SHA를 요구한다. 가져온 결과의 등급은 승계하지 않고 원래
입력을 새로 제출하여 전체 수학 결과 해시를 비교한다. 설치 증거 wrapper도
사용자의 serialized result를 인증 입력으로 받지 않는다.

출력에는 `PINNED_EXECUTED_EXTERNAL_SOURCE_CERTIFICATE`,
`runtimeReconstructedFullSourceGraph:false`, private 원본 token 미생성이
명시된다. 원래 큰 그래프의 실행 해시와 이번 새 수치 해시는 별도이다.
이것은 동일한 원본 점에서의 외향 반올림 수치 재계산이며, 매 UI 요청마다
큰 원본 그래프를 재생성했다는 뜻이 아니다.

## 6. Top-level snapshot 수정의 구현자 검증

legacy `G.pack`은 `nodes`와 일부 function system 배열을 실제 appendable
배열로 반환한다. body certificate가 이 배열을 그대로 보관하면 나중의
additive binder가 새 식을 추가할 때 이전 프로그램 serialization도 바뀐다.

본 검토자가 작성한 `snapshotActualProgramArrays`는 pack의 top-level
배열만 복사한다. 기존 node와 definition 객체는 그대로 유지하므로 원래
canonical prefix/definition 검사가 변조를 계속 검출한다. 중첩 고정 metadata도
기존 함수 정의의 fixed seal 및 프로그램 canonical 비교가 검출한다.
공유 legacy `pack`과 기존 source assert 조건은 수정하지 않았다.

실제 작은 expression/covariance/variation 그래프로 수행한 5개 검사는 모두
통과했다: additive append 후 같은 hash, 기존 live pack의 오류 재현,
기존 node 변조 거부, 기존 function definition 변조 거부, 중첩 fixed metadata
변조 거부 및 잘못된 입력 거부이다. 이들은 이 수정의 **구현자 검사**이며
새 물리 source 전체의 성공을 대체하지 않는다. 독립 snapshot 검토는 별도
검토자에게 요청했으며 이 문서 작성 시에는 완료로 세지 않는다.

## 7. 확대하지 않는 결론

양의 원래 scale을 유지하는 270개 계수의 구간과 원래값 자체의 상대오차는
구별한다. profile의 반복 로그 좌표 폭도 원래 큰 값의 상대폭과 다르다.
모든 label, 남은 selector/palette scale, 전역 잔차의 수치 구간 또는 전체
G-NUM/M2 완료나 M3 시작을 이 코드 읽기로 인정하지 않는다. 최종 실제
source 실행, 생성된 설치 증거와 Worker parity, 화면 검증은 각각 별도의
관측 기록이 필요하다.

## 8. 읽은 파일의 고정 SHA256

| 파일 | SHA256 |
|---|---|
| `research-ide/mathscope-m2/navier/actual-physical-center-certified-numerics.mjs` | `13a7dfe0d67f52697b368ebf36cc8ffe8bcf83566058b82460eadc0e4be5c6be` |
| `research-ide/mathscope-m2/navier/tests/pin-physical-center-executed-evidence.mjs` | `c8fc5df1196cfd581f5922475eef84743a4b045579097d9995cc9ff7cbbbac77` |
| `research-ide/mathscope-m2/navier/tests/verify-physical-center-installed-evidence.mjs` | `4a64578f2e8e35bfa0a4fe66f39b3ae8ec748d5c37436eaff3806ce4e5ed29fb` |
| `research-ide/mathscope-m2/build_m2.py` | `d78dcda157ea5b2099a7d09da4dc23a6dd3af2b19c32d8793ce31c9e9bc3b7ba` |
| `research-ide/mathscope-m2/navier/actual-physical-center-jet-conditioning.mjs` | `9563fe388e3c5f21ae0d473d3697d5d1ce33668589944a0d95ea00f82adabbaf` |
| `research-ide/mathscope-m0/contracts.mjs` | `cd32d97bdbfbbcf33375cd01f3fe98cd5a202ec63a01f145c9626d0995b3a111` |
| `research-ide/mathscope-m2/core/engine.mjs` | `742d5da6826f85b7dc08c3d93c45c129fd8797161e0d5a2eee13b27995981518` |
| `research-ide/mathscope-m2/core/replay-import.mjs` | `4c51c8507949fa9a843567707c9898cd3557f261b2231bc052633fbb096a945a` |
| `research-ide/mathscope-m2/navier/actual-program-array-snapshot.mjs` | `5e42177e8e303a1e9aad9c36d8b5a8de30c59d586586eca2b623400d3591ac01` |
| `research-ide/mathscope-m2/navier/actual-physical-center-jet-bodies.mjs` | `cb730c5bb7860687f393881dd176a1d3cd95f68dd507a4005415bfdfd1686105` |
| `research-ide/mathscope-m2/navier/tests/actual-program-array-snapshot.test.mjs` | `0fe1bf84ba2045ad399ccc4ef9a8a63aae2314e1597bea312d004729d458585b` |
| `research-ide/mathscope-m2/navier/actual-physical-center-runtime-numerics.mjs` | `c2c6a9066e36e7df4ae1e5e478e2f6f01544fd678c3517da35fb6e70f183eb57` |

이 표는 검토 시점의 바이트를 고정한다. 이후 파일이 바뀌면 동일 바이트를 검토했다는 주장 대신 별도 변경/추가 검토가 필요하다.
