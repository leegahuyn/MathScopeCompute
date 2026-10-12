# 공개 P7 API와 고정된 로컬 기록의 독립 비교

**25개 공개 실행과 각각의 별도 공개 fresh replay를 검토했다. 16개 결과는 로컬 결과 및 전체 mathematicalSHA256과 정확히 같았다. 나머지 9개는 PARI 빌드 정보와 그에 의존하는 해시만 달랐으며, 모든 차이를 개별 경로에서 설명했다.**

검토 결과는 [review.json](review.json), 읽기 전용 비교 절차는 [compare.py](compare.py)에 있다. 이 검토는 저장된 JSON과 gzip을 읽어 비교했다. HTTP 요청, GP, P7 생산자 또는 CLI 계산을 새로 실행하지 않았고 원본 기록과 원본 receipt를 수정하지 않았다.

## 결속된 원본

| 항목 | 값 |
|---|---|
| 실제 배포 commit | 3eb8427c6031dddded7d6d1b6527221cdb292017 |
| 로컬 25개 실행 manifest SHA-256 | 3c6e378b624a48ef0d03068d28b363e4e245266041d463770d308183a76d458d |
| 양쪽의 P7 수학 소스 25개 epoch | 72564078d6fd9d19dc076eb3c4a6842108fad523898f786d0ec98c18b895b041 |
| 공개 수집 terminal receipt SHA-256 | 02cda684b663232e76764d088f938212aea6939fea175c2bab383e1eb1dc2147 |
| 최종 독립 review SHA-256 | 67cb721e9aae134e2eaf6b9628718f125c28d4fb569bb250157829cfbc9ff2a0 |
| 비교 절차 source SHA-256 | 1a21c4132f8dc60755123c05bc7dd8be0da6d8b01c5063ab20868c325d67a6c5 |

원본 수집 receipt의 상태는 EXECUTION_REPLAY_PASS_SEMANTIC_REVIEW_REQUIRED이며 actualRuns=25, freshReplays=25, sourceUnchanged=true다. 이 상태를 덮어쓰지 않는다. 후속 승인 문서는 원본 수집 receipt와 이 별도 검토를 함께 참조할 수 있다.

## 무엇이 달랐는가

PARI 버전은 양쪽 모두 2.19.0이고, 공식 원본 archive SHA는 f317b9722eb5d9094a60303774f066f3a83e3ec1f170be8546c44d7583f30b6d로 같았다. 버전 출력에서 컴파일러를 적은 한 줄만 달랐다.

| 빌드 정보 | 로컬 | 공개 Render |
|---|---|---|
| 컴파일러 | GCC 13.3.0, Ubuntu | GCC 12.2.0, Debian |
| 실행 파일 bytes | 11,208,080 | 11,049,072 |
| 실행 파일 SHA-256 | 2f2e505b0fdee4faa4e5461ef7e10f16de2989f2d82caf4e304cd72122c7e42b | 350dc9eeec6e9cf3aa2eac5a3e5d3f77c18f696832ca1c55aad24b6ba45794e3 |
| 빌드 provenance SHA-256 | 0ea5d0c8d295f039120a74ffe477a4bf4314ba45101a3055b31cd2ec3ba4e513 | cdabc0a7becde98fd0ddcc1acf469ad48cca6d709f1fad9dfbf9900da36b21e1 |

결과 내부의 PARI backend 객체가 각 실행 기록의 실제 environment.arithmeticBackend와 정확히 같음을 확인했다. 허용한 빌드 차이는 binaryBytes, binarySHA256, buildProvenanceSHA256, versionOutput 네 필드다. 버전, 원본 archive, database 미사용, source 검증, 실제 버전 일치, 신뢰 경계 문구는 모두 같았다.

| 실행 | 전체 result의 leaf 차이 | 빌드 정보 | 독립 재계산한 파생 해시 | 검증한 해시 참조 |
|---|---:|---:|---:|---:|
| complex-37a1 | 6 | 4 | 2 | 0 |
| complex-additive-32 | 6 | 4 | 2 | 0 |
| arithmetic-11a1 | 12 | 8 | 3 | 1 |
| arithmetic-37a1 | 13 | 8 | 3 | 2 |
| modular-11a1 | 5 | 4 | 1 | 0 |
| modular-37a1 | 5 | 4 | 1 | 0 |
| typed-rank-37a1 | 15 | 8 | 4 | 3 |
| typed-refined-37a1 | 15 | 8 | 4 | 3 |
| typed-omitted-coefficient-prime | 15 | 8 | 4 | 3 |
| **합계** | **92** | **56** | **24** | **12** |

해시라는 이유로 필드를 삭제하거나 무시하지 않았다. 24개 파생 해시는 자기 자신의 digest 필드만 제외한 **완전한 객체**를 양쪽에서 각각 재해시했다. 그 객체의 다른 모든 차이가 먼저 설명되어야 파생 차이로 분류했다. 12개 참조는 실제로 재계산한 이전/새 digest 쌍으로 연결했다. 이 12개 경로는 모두 명시적인 SHA256 필드였으며, PARI receipt, rank upper certificate 및 saturation/typed claim의 같은 certificate 참조다. 결과 전체의 변화 그래프와 각각의 원본/공개 값은 review의 differences 원장에 남겼다.

## 같음을 확인한 수학 내용과 증거 범위

모든 숫자, 정확 유리수, complex ball 끝점과 오차, 계수, good/bad local factor, GP의 실제 stdout와 script hash, 2-cover와 map witness, 산술 rank, canonical height, saturation, regulator, 전체 실수 period가 같았다. Modular-symbol의 정규화된 중심 값 1/0, exact rank의 허용 범위, 자연어/Lean 가정, completeness inventory, 실패 및 열린 상태도 그대로였다. 37a1의 symbol zero 단독을 rank 1로 바꾸지 않았고 refined Sha 정보는 계속 UNKNOWN이었다.

각 로컬/공개/공개 fresh 기록의 완전한 record hash, input hash, environment hash, mathematical hash를 독립적으로 재계산했다. 입력, source binding, predecessor는 같았다. 실제 child 종료는 성공이었고 90초 CPU 요청과 384 MiB address-space 제한, 관찰된 환경 hash가 모두 기록과 맞았다. 각 공개 original과 별도 공개 fresh replay의 result, mathematical hash, 환경은 정확히 같았다.

이 9개에서 **전체 result hash는 실제로 다르다.** 빌드 provenance를 포함한 원본 해시를 동일하다고 바꾸지 않는다. 위 검토는 수학값과 인증 의미가 그대로이며 전체 hash 차이가 어떤 빌드 정보와 파생 참조에서 발생했는지 설명한다. 서로 다른 환경 사이에 replay를 수행했다고도 주장하지 않는다.

## 검토의 한계

이 문서는 저장된 실제 실행 근거를 비교한 결과다. 새 backend 실행, Lean proof, 임의 곡선/높이의 전역 정리 또는 universal RH/BSD 증명이 아니다. 컴파일러 실행 파일이나 빌드 sidecar 원문을 이 검토에서 별도로 다운로드하지 않았다. 그 파일의 정체성은 고정된 runtime source가 기록한 관찰이며, 수학적 witness와 결과 값은 별도로 전부 비교했다.

공개 화면의 선택, 가독성, 내보내기 및 기준 완료 판정은 담당자의 실제 UI 검증으로 이어진다. 이 파일은 진행표의 완료 값을 변경하지 않았다.
