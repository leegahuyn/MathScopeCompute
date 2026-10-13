# M4 원문 기준과 인수 보호 장치

99쪽 원 설계도의 p.19–20 I3 및 p.67–68 R1 기준을 `criteria.mjs`에 16개 원문 ID로 보존했다. M0의 기존 I3 기초와 M4 확장을 중복 집계하지 않는다. 과거 M4 최종 인수는 **미확인**이며, 미확인을 0% 또는 완료로 바꾸지 않는다.

`acceptance.mjs`는 기존 M0의 고정된 실제 Lean 감사 authority를 사용하면서 해당 소스·원시 커널 로그·오류 대조 로그·import 환경 manifest의 실제 바이트 SHA-256를 다시 읽어 검사한다. 이 성공의 범위는 **과거의 동일 커널 실행에 대한 artifact 재결속**이다. 현재 Lean을 실행하거나 신규 해석 정리·M4 항목을 승인한 결과가 아니다. 저장된 receipt를 JSON으로 복제하거나 import하면 authority가 사라진다.

원문 기준별 새 성공 로그는 독립 검토 후 불변 digest 목록에 등록해야 한다. 현재 그 목록은 비어 있으므로 조작한 `PASS`, `16/16`, `64/64` 입력은 M4 freeze를 허용하지 않는다. 이 목록의 공백은 이번 감사에서 새 승인한 기준이 없다는 뜻이며 과거 M4가 전혀 구현되지 않았다는 판정이 아니다. 전역 RH/BSD, 일반 G continuum quantum YM, 전체 원문 NS 재구성의 열린 범위는 별도 유지한다.

실행:

```sh
node --test research-ide/mathscope-m4/tests/acceptance.test.mjs
node research-ide/mathscope-m4/audit-m4.mjs --out research-ide/mathscope-m4/evidence/pinned-artifact-audit-20261013.json
```

첫 명령은 소스 한 글자 변경, 커널 type/axiom/exit/sorry 조작, 원시 로그 변조, 가정 순환, 문헌 전용 참조, 위조 전체 완료, export/import의 신뢰 경계를 공격한다. 두 번째 명령은 기존 다섯 kernel target의 실제 저장 artifact bytes를 재검사하고 실행 시각·Node 버전·현재 Git HEAD·코드 SHA·정확한 제한을 기록한다. 정확한 Git blob bytes를 고정한 commit에서 읽고 Windows checkout의 CRLF 등 바이트 차이는 별도 기록하며 자동 정규화하지 않는다. exit 0은 이 artifact 검사의 성공이며 M4 최종 인수가 아니다.

화면 통합에는 `buildM4ChecklistView`를 사용한다. 교육 설명과 전문가 요구는 원문 claim ID를 공유하고, 각 항목은 원문 페이지·검사 요구·미확인 상태·receipt digest를 보여야 한다. 이 model만으로 시각화 또는 R1 브라우저 항목이 완료되지는 않는다. 다음 실제 통합 검수가 남는다:

- R1-03: NS 점/패치 → 원식·논문 위치·실제 job·오차·claim, prism 비교사상 및 Δ generator 각각의 실제 선택 흐름.
- R1-04: p/G/Δ/τ/cutoff/계수체 변경, 계산 중 입력 변경, 취소/재개, export/import의 정확한 STALE 전파와 다른 입력 증거 차단.
- R1-05: 실제 desktop/mobile·키보드·WebGL/CPU fallback·긴 한글/수식·색 범위·표본 선택·지연/메모리 상한 관측.
- R1-07: 네 walkthrough를 다른 사람이 문서만으로 독립 재현.
- R1-08: 현재 배포 version/hash 충돌 검사, 검증된 patch와 rollback, 실제 게시 후 화면 receipt.

M3의 남은 원문 8개가 독립 승인되고 원문 I3/R1의 모든 증거가 인수되기 전에는 최종 M4 완료나 freeze를 선언하지 않는다. 기존 실패/TIME_LIMIT와 진행 장부는 이 디렉터리에서 수정하지 않는다.

2026-10-13 실제 로컬 커널 재검사도 별도 기록했다. 설치된 실행파일은 Lean **4.34.0-rc2 Windows / commit 6a10ac8c22beadecabdbb0919c2b50214762f91d**이며, 과거 M0의 **4.34.1 Linux / commit 5045d005…**와 다르다. 의존성을 내려받거나 두 환경을 같은 pin으로 표시하지 않았다.

| 실제 실행 | 결과 | 정확한 범위 |
|---|---|---|
| attempt 1, trust=0 | Defs 30초 TIME_LIMIT | 전체 import 재검사 예산 중단, Finite의 후속 missing dependency 보존 |
| attempt 2, 공식 기본 import trust | Defs / Finite exit 0 | 고정 integer complex의 행렬 곱, 모든 `v : C0`에 대한 d²=0, 정수 fixture; 실제 type/#print axioms 로그 |
| attempt 2, 오류 대조 | 두 exit 1 | 0=1의 `rfl` 실패 및 잘못된 D1의 `decide` false를 실제 확인 |
| 두 attempt, Analytic | exit 1 | 정확한 원래 소스의 `Mathlib` import 부재; 새 조건부 analytic 성공으로 승인하지 않음 |

`evidence/local-kernel-replay-20261013[-attempt2]/`에 동일 원문 Git blob 소스, 로그, 실행 receipt와 생성 olean SHA를 보존했다. 첫 attempt의 NegativeMatrix가 단순 missing dependency를 수학적 거부로 잘못 표시한 문제는 `local-kernel-replay-correction-20261013.json`에서 명시적으로 재분류했다. 원래 실패 receipt는 수정하지 않았다. attempt 2 전체 exit는 **1**이며 해석 replay 차단이 남아 있다. 새 finite 성공으로 I3 확장 전체나 M4 최종 인수를 대신하지 않는다.

새 실행은 직접 설치된 Lean executable을 지정하고 사용하지 않은 attempt 번호로 실행한다. 각 case는 30초·512 MiB·1 thread이며 runner는 이미 있는 receipt를 덮어쓰지 않는다.

```sh
node research-ide/mathscope-m4/replay-local-lean.mjs --lean <설치된 Lean 실행파일> --attempt 3 --standard-imports
```

원래 4.34.1/mathlib pin의 새 clean Linux 실행은 `.github/workflows/m4-pinned-kernel-replay.yml`과 `tools/pinned-kernel-replay.mjs`로 준비했다. 이 workflow의 작성 자체는 hosted kernel 실행 성공이 아니다. 실제 Actions run의 exit와 업로드된 `receipt.json`을 읽은 뒤에만 새 finite/conditional kernel 재검사를 판정한다. 실제 source 변경 또는 명시적 workflow dispatch로 실행하며 결과 artifact 추가만으로 다시 실행하지 않는다.

runner는 공식 Lean Linux archive digest `47bf4bbd…`, Lean commit `5045d005…`, runtime shared-library SHA, mathlib commit `d13f23b7…`, 원래 mathlib lock SHA `8f67b2cf…`, 모든 잠긴 transitive dependency를 비교한다. mathlib cache는 원래 analytic 소스의 정확한 import와 그 closure만 요청한다. 다른 commit의 cache 자동 탐색, source 수정, 무한 시간이 허용된 fallback은 사용하지 않는다. 이 pin들은 `evidence/official-pin-readback-20261013.json`에 기록한 실제 공식 HTTP readback에서도 확인했다.

원래 Defs/Finite/Analytic/Conditional/Comparison 파일의 Git blob SHA와 명시된 target type/#print axioms, 경고·sorry 및 두 오류 대조의 **예상 실패 이유**를 검사한다. 누락된 import나 TIME_LIMIT를 올바른 수학적 오류 대조로 세지 않는다. 18분 전체 runner 예산과 case당 60초/512 MiB가 적용된다. 실패도 즉시 receipt를 기록하고 Actions artifact에 남긴다. workflow에는 저장소 쓰기 권한이 없으며 root 검토자가 판정·로그를 GitHub의 새 commit으로 보존해야 한다.

전체 software 보호 검사 15개는 다음 명령으로 원시 TAP와 source SHA receipt를 새 attempt에 기록한다:

```sh
node research-ide/mathscope-m4/run-tests.mjs --attempt 4
```

`test-attempt3-20261013.{tap,json}`은 실제 15/15 PASS 기록이다. Windows에서 hosted runner를 검사한 `pinned-runner-platform-check-20261013/receipt.json`은 설치 없이 unsupported-platform을 거부한 exit 1 기록이며, Linux 실행을 대신하지 않는다.
