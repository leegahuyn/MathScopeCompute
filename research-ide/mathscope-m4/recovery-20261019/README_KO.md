# 2026-10-19 M4 독립 준비 및 원문 16개 인수 추적

이 디렉터리는 실제 PR30 HEAD `333d6095d4a2d2d69ceec9b25c44e1d3381e36d2`에서 확인한 기존 M4 소스를 승계한 추가 구현이다. 원 설계도 p.20의 I3-01~08과 p.68의 R1-01~08을 그대로 추적한다. 현재 M3는 62/64, N7-06·N8-05는 OPEN, actual global last-resolved tau는 null이다. M4의 현재 릴리스 인수 수는 미확인이며 이 작업에서 16/16로 올리지 않는다.

## 실제 추가한 동작

`evidence-session.mjs`는 선언된 의미 의존관계에 입력·소스 SHA-256를 결합한다. p·G·delta·tau·cutoff·계수체 변경은 해당 키를 소비하는 노드와 그 후속 노드만 무효화한다. 카메라·레이어·선택 상태는 별도 view revision을 사용한다. 계산 도중 입력을 바꿨다가 원래 값으로 돌려도 이전 실행은 STALE이며, 취소한 실행을 재개하면 중단 당시 입력으로 새 실행을 만든다. 다른 세션의 실행 token, 조작된 결과 hash, 한 번 더 제출한 완료, 위조한 PASS를 거부한다. 가져온 결과는 바이트·결합을 검사해도 자동 연결하지 않고 재계산을 요구한다.

이 계층은 호출자가 제공한 의존 그래프의 계약을 지킨다. 그래프 자체가 전체 수학 소스의 정확한 의존성이라는 증명은 제공하지 않는다. `RECORDED`는 계산 결과를 hash로 묶어 보관했다는 뜻이며 커널 PASS나 원래 인수 완료가 아니다.

`inspect-evidence.mjs`는 선택한 값이 원래 결과의 실제 속성인지 검사하고, 원식·문서 SHA/페이지·job·입출력 hash·소스 SHA·고정 commit 링크·가정·범위를 연결한다. prototype 경로와 없는 좌표를 거부한다. 오차나 원 좌표가 미확인이면 null을 유지한다. 학생과 전문가 모드는 같은 claim ID, 가정, 범위, 원값을 사용한다. 새로 생성한 세 가지 기록은 실제 설치된 Worker의 기준 Taylor–Green, 유한 prism 비교, 고전적 delta fixture이다. 이 NS 기준 예제를 실제 최종 whole-K 장으로 표시하지 않는다.

## 검증과 그 범위

`evidence/attempt5/execution.json`과 원시 TAP·stderr에는 총 **51개 검사의 실제 실행 결과**가 있다. 새 의미 의존성 10개와 선택 추적 6개, 기존 M4 인수 보호 13개·커널 계약 4개·실제 저장 커널 바이트 재결속 9개·기존 release runtime 9개가 모두 성공했다. 각 명령은 테스트 파일을 직접 실행하며 실제 등록한 검사 수와 TAP의 tests/pass 수가 일치해야 성공으로 기록한다. 파일 하나가 exit 0을 반환한 것만으로 내부 검사가 실행됐다고 세지 않는다. 이전 attempt2~4 기록도 보존했다. 생성자는 첫 비동기 hash 계산 전에 입력과 소스를 복사하며, 호출자가 대기 중 객체를 바꿔도 세션의 검증된 입력이 바뀌지 않는 회귀 검사를 통과했다.

별도 검토자는 선택 경로가 비동기 읽기 중 바뀌는 문제와 UTF-8 BOM이 디코딩 과정에서 사라져 원본 SHA와 잘못 일치하는 문제를 실제 재현했다. 선택 경로·원값은 첫 await 전에 확정하고, 소스는 복사한 원 바이트를 직접 hash하도록 수정했다. 두 문제의 최초 재현과 수정 후 독립 재검사는 `evidence/peer_review/`에 각각 보존했다. 수정 후 두 대조가 모두 통과했으며 module SHA가 검토 전후 같았다.

첫 선택 추적 검사는 sandbox Node의 `child_process`에서 `git` 실행이 EPERM으로 거부되어 4개 중 3개가 계산 전에 실패했다. 그 기록은 `evidence/inspection-attempt1-failure.json`에 보존했다. 원격 기준 commit은 이미 승인된 셸 읽기 결과로 분리해 기록하고, 브라우저 호환 테스트는 불필요한 Git subprocess 없이 그 기준을 사용하도록 수정했다. 기존 커널 검사에 필요한 읽기 전용 Git subprocess는 승인된 실행 경로에서 검사했다. 접근 제어나 권한 설정을 변경하지 않았다.

과거 실제 Lean 실행의 소스·로그·타입·공리·바이트를 재결속했지만 **이 재개에서 새 Lean 커널을 실행하지 않았다**. 테스트 실행, 독립 유한 Worker 관측, M3 전역 수학 의무, M4 원문 최종 인수, 원격 저장, 사이트 게시, 실제 브라우저 검수는 각각 별도 상태이다.

```sh
python3 research-ide/mathscope-m4/recovery-20261019/run_recovery.py --out research-ide/mathscope-m4/recovery-20261019/evidence/<unused-attempt>
node research-ide/mathscope-m4/recovery-20261019/capture_observations.mjs
python3 research-ide/mathscope-m4/recovery-20261019/build_matrix.py
```

검사 runner는 기존 evidence 디렉터리를 덮어쓰지 않는다. `capture_observations.mjs`도 기존 `observations` 디렉터리가 있으면 중단하므로 새 재실행에는 별도 출력 경로를 설정해야 한다. 이미 확인한 고정 입력의 비싼 수학 계산을 반복하는 명령은 포함하지 않았다.

## 원문별 판정과 다음 작업

`M4_ORIGINAL_ACCEPTANCE_MATRIX.json`은 16개 ID의 원문, 페이지, 구현 파일 SHA, 검사 명령·예상 결과·실행 결과·증거 SHA, 승계 범위와 미해결 조건을 묶는다. 14개는 부분 구현/검증, R1-05와 R1-08은 현 릴리스 검수 및 게시 연결이 필요한 OPEN이다. 이는 완료율을 14/16로 센 것이 아니다. `acceptedCurrentRelease`는 null, `finalAcceptance`는 UNCONFIRMED, 전체 릴리스는 HOLD이다.

현재 운영 UI에 새 contract를 연결한 검수, 실제 전체 K의 에너지 및 N8의 독립 grid/Fourier/coefficient/precision 네 축, 필요한 사용자·전문가 walkthrough, 현재 버전의 desktop/mobile·키보드·WebGL/CPU fallback·지연/메모리 관측이 남는다. root 작업은 GitHub 저장·CI·게시·게시 후 확인의 별도 영수증을 추가한다. 이 디렉터리의 기준 시점 상태를 나중의 게시 성공으로 소급해서 바꾸지 않는다.
