# MathScope M0·M1 — 소스, 계산, 증거 재현

이 패키지는 MathScope의 M0 연구 기반과 M1 수학 객체를 실제로 실행하고, 입력·결과·출처·검증 범위를 확인하기 위한 소스와 증거 묶음이다. **설치된 예제 48개를 Node Worker에서 독립 실행할 수 있으며, Lean 4.34.1 로컬 커널 검사로 확인한 target 71개가 포함된다.** 이와 별도로 원래 Lean 4.34.0-rc2에서 NS C/D 제출 모듈의 선택 빌드와 두 exported 정리의 실제 타입·공리 확인을 완료했다. 두 rc2 정리는 기존 71개 집합과 구분하며, 예제 실행 자체는 Lean 커널 실행이 아니다.

원문 체크리스트는 **70개**다. M0의 남은 6개, 산술 P1–P3의 24개, gauge Y1–Y2의 16개, Navier–Stokes N1–N3의 24개를 원래 문구로 보존한다. M0 여섯 항목은 독립 검토에서 완료했으며, 현재 전체 집계는 **61 PASS / 7 PARTIAL / 2 BLOCKED**다. **NS 원문의 전체 기본 빌드, 독립 Comparator 검사와 N3의 전체 선도 프로파일 인증은 남은 관문이다.** C/D 선택 빌드의 성공으로 이 관문이나 70개 모두의 수학적 완료를 선언하지 않는다. 최종 항목별 상태는 [원문 기준](evidence/original-acceptance.json), [M0 여섯 항목 검토](evidence/m0-six-checklist.json), [NS 체크리스트](navier/checklist-status.json)에 있다.

## 1. 가장 빠른 실행

ZIP을 풀면 `mathscope-m1`, `mathscope-m0`, 필요한 `mathscope-extension` 파일이 같은 상위 디렉터리에 놓인다. **이 상대 경로를 유지한다.** 아래 명령은 세 디렉터리가 보이는 상위 디렉터리에서 실행한다.

필수 환경은 **Node.js 24 이상**이다. 실제 CLI 확인 환경은 Node `v24.19.0`이며, CLI에는 별도 npm 패키지가 필요하지 않다. Python과 Lean은 CLI 예제 실행의 필수 조건이 아니다.

```bash
node --version
node mathscope-m1/cli.mjs list
node mathscope-m1/cli.mjs list --json
node mathscope-m1/cli.mjs run prime-1000 --out ./runs/prime-1000
```

`prime-1000`은 실제 유한 구간 `[2,1000]`에서 소수 168개를 계산한다. 기존 CLI의 [18/18 검증 기록](evidence/cli-validation.json)과 [당시 export bundle](evidence/cli-prime-1000/replay-bundle.json)을 보존했다. 최종 v50 Worker에서도 새 계산을 실행하여 [12/12 추가 검사](evidence/cli-v50-validation.json)와 [새 export bundle](evidence/cli-v50-prime-1000/replay-bundle.json)을 저장했다. 두 기록의 검사 범위와 실행 환경 해시는 별도로 읽는다. 복합체 예제를 실행하려면 다음 명령을 쓴다.

```bash
node mathscope-m1/cli.mjs run p1-p3 --out ./runs/p1-p3
```

`--out`에는 **새 디렉터리**를 지정한다. 이미 있는 디렉터리를 덮어쓰지 않는다. 옵션을 생략하면 현재 작업 디렉터리의 `m1-output` 아래에 예제 ID와 실행시각을 사용한 새 디렉터리를 만든다. 목록은 하드코딩한 설명이 아니라 현재 `core/registry.mjs`가 반환하는 실제 예제 요청이다.

CLI는 `core/engine.mjs`의 `createM1Engine`과 설치된 `WORKER_SOURCE`를 그대로 쓴다. Node `worker_threads`는 브라우저 Worker의 메시지 전송 규약을 연결한다. 별도의 소수·gauge·NS 알고리즘을 구현하지 않는다. 원래 요청의 시간·작업량·표본·결과 바이트 제한이 유지되며, Worker에는 메모리 상한도 설정한다. `Ctrl+C`는 작업을 취소하고 종료 상태의 checkpoint와 bundle을 저장하는 경로로 들어간다.

### 저장되는 결과

| 파일 | 내용 |
|---|---|
| `request.json` | 예제에서 가져온 원본 수학 입력과 정규화된 precision/budget |
| `environment.json` | 설치된 Worker SHA-256, 엔진 버전, 실제 capability와 환경 hash |
| `result.json` | 실제 도메인 계산 결과, 관측 정의, 가정, 유한 범위와 오차 기록 |
| `replay-bundle.json` | 엔진의 실제 `exportBundle` 결과. 원본 요청·환경·결과·hash·checkpoint 포함 |
| `summary.json` | 실행 상태, Node Worker 정보, source/input/result/mathematical/bundle hash와 scope |
| `files-manifest.json` | 위 다섯 파일의 바이트 수와 SHA-256 |

엔진의 `resultHash`는 전체 계산 결과를, `mathematicalHash`는 최상위 실행시간 통계를 제외한 수학적 결과를 묶는다. 이 규칙은 bundle의 `semanticHashPolicy`에 기록된다. 가져온 JSON에는 살아 있는 실행 receipt나 증명 권한이 생기지 않는다. `engine.replay(bundle)`은 동일 설치 환경에서 요청을 새로 계산해 비교하는 API이며, CLI의 최소 명령은 `list`와 `run`이다.

CLI 종료 코드는 다음과 같다. `PARTIAL`인 NS 후보도 결과와 차단 사유를 저장한다.

| 코드 | 의미 |
|---:|---|
| 0 | `COMPLETED` — 요청한 유한 계산 완료 |
| 2 | `PARTIAL` — 계산한 부분과 남은 조건을 함께 반환 |
| 3 | `PRECISION_REQUIRED` 또는 `BUDGET_EXCEEDED` |
| 4 | `UNSUPPORTED` |
| 130 | `CANCELLED` |
| 1 | 입력·실행·파일 저장 실패 |

## 2. 브라우저와 독립 CLI의 관계

**브라우저 M0 연결에는 기존 MathScope 페이지와 세션이 필요하다.** `workspace.html`, `workspace.css`, `workspace.mjs`는 기존 앱의 탐색·세션·M0 그래프에 통합되는 구성요소다. 이 ZIP을 정적 파일 서버로 열었다고 새 MathScope 사이트나 로그인된 세션이 구성되는 것은 아니다.

**CLI는 브라우저 없이 실행할 수 있다.** 필요한 M0 계약과 baseline 데이터가 소스에 포함되며, Worker 계산과 결과 export에 기존 브라우저 세션을 요구하지 않는다. CLI 결과는 파일로 저장된다. 현재 사용자의 MathScope 세션을 읽거나 수정하지 않는다.

실제 배포 정보는 [deployment.json](evidence/deployment.json), 설치된 소스와 Worker/app hash는 [build-manifest.json](build-manifest.json)이 기준이다. 보고서·CLI·압축 생성은 사이트 배포를 수행하지 않는다.

브라우저 직접 관측은 [v45–49의 25개 기록](evidence/browser-validation.json)과 [최종 v50의 9개 기록](evidence/browser-validation-v50.json)을 구분했다. v50에서는 새 Worker 출처, 같은 M0 세션에 P¹ 결과 저장과 새 계산 재현, 원문 C/D 감사 범위, heat 구간 인증, 미인증 NS 후보, G2의 실제 4D 표본과 3D 투영, 문헌·Lean 구분 검사를 확인했다. 최종 기록이 이전 모든 검사를 같은 버전에서 반복했다는 의미는 아니다.

## 3. 원문 70개 항목의 범위

| 묶음 | 원문 수 | 구현과 판단 범위 |
|---|---:|---|
| M0 남은 공통 기반 | 6 | 군·상태족 계약, 정밀도 전파, 독립 검증, 유한 Lean 정리, 해석 가정 기록, 문헌/실제 import 분리 |
| P1–P3 | 24 | 유한 소수·정확 산술·p-adic 관측·실제 점/P¹ 비교 복합체 및 Frobenius. 일반 prismatic site와 전역 BSD 증명을 포함하지 않음 |
| Y1–Y2 | 16 | 지원하는 실제 compact matrix group, Lie algebra, embedding, 4D 고전장·곡률·불변 관측과 유한 holonomy |
| N1–N3 | 24 | 원문/코드 연결, 좌표·heat 성분·기준 해, 선도 프로파일의 일부 연산과 후보. 원래 rc2의 C/D 선택 빌드·타입/공리 확인 완료와 전체 기본 빌드·독립 Comparator·전 구간 인증의 미완료를 구분 |

상세 설명은 [산술 안내](arithmetic/README_KO.md), [산술 수학 설명](arithmetic/MATHEMATICS_KO.md), [gauge 안내](gauge/README.md), [NS 안내](navier/README.md)를 따른다. 각 도메인의 `checklist`는 fixture 통과와 미지원 수학 범위를 함께 기록한다.

### Gauge와 Δ의 의미

실제 행렬 adapter는 `SU(2..6)`, `SO(3,5..8)`, compact `Sp(1..3)`, compact `G2`의 14개다. `G2`에는 Dynkin index 1과 3의 서로 다른 실제 SU(2) embedding을 제공한다. Spin, 임의 중심몫, F4/E6/E7/E8 또는 범위 밖 군은 이름만 붙인 대체 장으로 처리하지 않고 거부한다.

군 이름이나 Δ만으로는 field job을 만들 수 없다. coupling, 표현, 불변형, scale·center·coefficients, 경계와 seed, 관측 방식 등 실제 상태족 입력이 필요하다. `ASSUMED_BOUND`는 물리적 장을 유지하고 가정만 바꾼다. `UNITS`는 단위를 바꾼다. `CLASSICAL_SCALE`과 `EFFECTIVE_MODEL`은 명시한 정의에 따라 실제 장을 다시 만든다. 이 차이는 물리적 field hash와 정규화된 입력에 남는다.

BPST와 full-basis 시험장, 유한 transport는 고전 계산이다. 유한 대각 Hamiltonian의 채널 감쇠는 별도 명시 모델이다. 양자 Wilson ensemble, 무한 부피/continuum 극한, 모든 compact simple G의 양자 Yang–Mills 존재와 질량간극은 이 계산에서 얻지 않는다.

### NS의 남은 관문

heat의 유한 구간 enclosure와 정확한 기준 해 검사는 해당 성분의 결과다. 원문의 전체 NS 구성, 모든 공간·시간 점에서의 부등식, 접합, cone, 안정성, 잔차에서 해의 오차로 가는 상수를 동시에 검증했다는 뜻이 아니다. N3 후보의 `PARTIAL`, `BLOCKED`, `fullCertifiedProfile:false`, `solutionErrorBound:null`을 그대로 유지한다.

원래 rc2의 `NavierStokes.ComparatorSolution` 선택 빌드와 별도 `PinnedDeclarations.lean` 타입·공리 확인은 실제 종료 0으로 완료했다. 원래 전체 기본 대상 `NavierStokes`, `Euler`, `ComparatorChallenges`의 빌드는 **C/D를 우선하기 위해 명시 중단하여 종료 -15**였으며, 전체 성공은 아니다. N1-05는 전체 기본 빌드의 미완료, N1-06은 독립 Comparator의 환경 차단 때문에 **PARTIAL**을 유지한다. N3 후보의 수학적 잔여 조건도 그대로다.

선택 빌드·공리 확인의 성공, 전체 기본 빌드, 독립 Comparator 결과는 서로 다른 증거다. 아래 4절의 실제 명령·완료 시각·산출물 재고와 [원문 감사 요약](navier/official-validation/official-audit-summary.json)을 함께 읽는다. 패키지 생성 시점의 원장은 [NS 성분 검증 원장](navier/evidence/lean-validation.json), [NS 체크리스트](navier/checklist-status.json), `official-validation` 기록이다.

## 4. 로컬 Lean 71개 target과 별도 rc2 C/D 두 정리

| 목적 | 버전과 범위 |
|---|---|
| MathScope 로컬 성분 감사 | **Lean 4.34.1**, commit `5045d0056413266e57c625dcd7c365b10e377c52` |
| mathlib를 실제 import한 로컬 성분 | mathlib commit `d13f23b723b8a846827a245b89c10fc7d3f11612` |
| 원래 NS의 C/D 선택 빌드·타입/공리 확인 | **Lean 4.34.0-rc2**, commit `6a10ac8c22beadecabdbb0919c2b50214762f91d`. 별도 checkout·의존성·명시 설치 경로 entry·build 원장을 사용 |
| 원래 rc2의 mathlib | commit `85e3a25e006c35636f0e53b0e9296caca2685bc0`. 4.34.1 로컬 성분의 cache와 분리 |

71개는 산술 **31**, gauge **27**, NS **13** target의 합이다. 각 type, `#print axioms`, 소스, 실제 종료 코드, 로그와 hash를 보존한다. 9개의 고의 오류는 실제 커널에서 거부됐다. 이 로컬 target 집합에는 사용자 추가 axiom이나 `sorryAx`가 없다. 표준 Lean axiom 의존성은 target마다 다르므로 감사 기록을 그대로 읽는다.

### 원래 rc2 C/D의 최종 실행 결과

고정된 원문 커밋은 `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`다. **2026-10-09 16:05:12 UTC**, 원래 Lake 대상 선택 명령 `lake build NavierStokes.ComparatorSolution`이 **9,371개 Lake 작업, 종료 0**으로 완료했다. **16:06:24 UTC**에는 별도 `PinnedDeclarations.lean`의 import·타입·`#print axioms` 조회도 **종료 0**으로 완료했다. 9,371은 해당 빌드의 작업 수이며 새로운 정리의 수가 아니다.

조회한 원래 exported declaration은 다음 두 개다.

- `NavierStokes.Comparator.navier_stokes_breakdown_R3`
- `NavierStokes.Comparator.navier_stokes_breakdown_periodic`

각 정리에서 출력된 공리 집합은 정확히 **`[propext, Classical.choice, Quot.sound]`**이며, `sorryAx`나 추가 사용자 공리는 보고되지 않았다. 타입은 고정된 원문의 초기 속도·외력 조건을 포함하는 C/D 문장이다. 이 두 결과는 71개 로컬 target에 섞어 집계하지 않고 **별도 rc2 제출 정리 감사**로 기록한다. 독립 Comparator의 Challenge/Solution 동치 검사나 Nanoda 검사 완료를 뜻하지 않는다.

이 성공은 **공식 rc2 공유 라이브러리에 연결한 명시 설치 경로 entry**를 사용한 실행 프로파일의 결과다. 원래 배포 CLI의 자동 설치 경로 탐지 실패도 별도 기록으로 보존한다. 원문 proof source·manifest·커널을 바꾸지 않았고, 원래 캐시의 **8,747/8,747 요청**이 다운로드·압축 해제되어 종료 0에 도달한 뒤 빌드했다. 공식 upstream cache에 대한 통상적인 신뢰 가정은 유지하며, cache에 있는 모든 증명을 독립 외부 커널로 재검사했다는 주장은 하지 않는다.

성공한 선택 빌드 이후의 `.olean` 재고는 다음과 같다. 행들은 서로 겹치는 범위이며 합산하지 않는다. **파일 존재 재고 자체는 별도의 증명 인증서가 아니다.**

| 원문 범위 | 소스 모듈 | `.olean` 존재 | 미생성 |
|---|---:|---:|---:|
| C/D 제출의 local import closure | 609 | 609 | 0 |
| `NavierStokes` root의 source import closure | 753 | 692 | 61 |
| 전체 `NavierStokes` library | 817 | 702 | 115 |
| 전체 `Euler` library | 1,840 | 23 | 1,817 |
| `ComparatorChallenges` | 2 | 0 | 2 |

원래 `systemd-run --property=RestrictAddressFamilies=~AF_UNIX --user --pty ...` 호출은 user bus 연결 단계에서 실패하여 **Comparator는 환경 BLOCKED**다. 별도 읽기 전용 조사도 현재 컨테이너에 활성 user systemd/DBus와 필요한 cgroup 위임이 제공되지 않음을 확인했다. 보호 조건을 보존하는 정상 비특권 외부 실행 환경이 필요하며, guard를 완화하거나 fake-landrun으로 대체하지 않았다.

실제 결과를 추적하는 파일은 다음과 같다.

- [최종 rc2 명령·환경·종료·로그 해시](navier/official-validation/full-pinned-command-results.json)
- [C/D 두 정리의 실제 타입·공리 출력](navier/official-validation/ns-pinned-declarations.log)
- [공식 캐시 entry의 종료 결과](navier/official-validation/cache-context-result.json)
- [선택 빌드 이후의 원문/산출물 재고](navier/official-validation/remaining-build-scope.json)
- [원문 rc2 감사 요약](navier/official-validation/official-audit-summary.json)
- [Comparator 독립 환경 조사 JSON](navier/official-validation/comparator-environment-independent.json)과 [짧은 설명](navier/official-validation/comparator-environment-independent.md)

### 기존 로컬 감사의 범위

기존 M0에는 사용자 가정에 의존하는 별도의 조건부 예제가 있다. M1의 71개에 추가 사용자 axiom이 없다는 사실로 M0의 사용자 가정을 지우거나, 가정 있는 귀결을 무조건적 정리로 바꾸지 않는다.

확인할 원장은 다음과 같다.

- [산술 Lean 감사](arithmetic/evidence/lean-audit.json)
- [Gauge Lean 감사](gauge/lean/lean-audit.json)
- [NS 성분 Lean 감사](navier/evidence/lean-validation.json)
- [공통으로 묶인 감사 목록](evidence/packaged-audits.json)

브라우저의 `MATCHED_LOCAL_KERNEL_AUDIT`는 표시 중인 정확 소스가 이미 검사한 기록과 일치한다는 뜻이다. 편집한 임의의 Lean 소스를 새로 컴파일한 결과가 아니다. `kernelRerun:false`, `formalPass:false`를 그대로 보존한다.

### Lean을 다시 검사하려면

공식 Lean 설치와 필요한 고정 mathlib를 별도로 준비한다. 바이너리와 대형 cache는 ZIP에 없다. `gauge/lean`에는 일반 Lake 설치에서 사용할 `lean-toolchain`과 `lakefile.lean`이 있다.

```bash
cd mathscope-m1/gauge/lean
lake build
lake env lean MathScope/M1/Gauge/SU3.lean
lake env lean MathScope/M1/Gauge/G2.lean
```

다른 현재 재현 스크립트들은 검사 당시 workspace의 `lean-4.34.1-linux`, `mathlib-ym-check`, `/tmp/mathscope-lean-embed` 경로를 사용한다. [M0 driver 소스](../mathscope-m0/lean/lean-embed-check.c)와 [M0 재현 스크립트](../mathscope-m0/lean/reproduce.py), 도메인별 `lean/reproduce.py`에 실제 경로·명령·모듈 순서가 있다. 설치 경로를 준비하지 않은 상태에서 바로 실행되는 범용 Lean installer로 해석하지 않는다. 산술/NS에는 현재 별도 `lakefile.lean`이 없으므로 해당 재현 스크립트와 원장의 import closure를 기준으로 환경을 맞춘다.

driver는 설치 root를 명시해 공식 frontend를 호출하기 위한 소스다. Lean 커널·runtime·검증 guard를 변경하는 패치가 아니다. 공식 NS 원문의 rc2 재현에서는 4.34.1의 `.olean`이나 mathlib build 결과를 섞어 쓰지 않는다.

## 5. 계산·계약 검사

새 설치에서 Node 검사 경로를 확인하려면 다음 명령을 사용한다. 각 결과의 범위를 개별적으로 읽으며, 테스트 수를 서로 다른 정리의 수로 더하지 않는다.

```bash
node --test mathscope-m1/tests/core.test.mjs
node --test mathscope-m0/tests/*.test.mjs
node --test mathscope-m1/arithmetic/tests/arithmetic.test.mjs
node mathscope-m1/gauge/tests.mjs
```

일부 검사·생성기는 해당 하위 디렉터리의 fixture나 evidence 파일을 다시 쓴다. 배포 당시 원장을 보존하려면 압축을 푼 별도의 사본에서 재현한다. 산술 독립 Python 검사는 `sympy==1.14.0`, `mpmath==1.3.0`을 사용한다. 설치 목록은 `arithmetic/requirements-test.txt`에 있으며 이 의존성의 vendor 사본은 ZIP에 포함하지 않는다.

기존 검사 기록은 `evidence/core-tests.tap`, `evidence/m0-regression-tests.tap`, 각 도메인 `evidence`에 있다. 실제 독립 비교에는 point enumeration/Frobenius, exact matrix/SymPy, FFT/direct mode convolution, matrix curvature/finite difference, analytic density/quadrature가 사용된다. 같은 함수를 다시 실행한 것은 replay이며 독립 수학 검증으로 세지 않는다.

## 6. 문헌 adapter

논문 URL, 정리명, 정확한 가정과 결론은 인용 수준의 근거다. `THEOREM_REFERENCE`만 연결된 결과에는 Lean import나 커널 권한이 붙지 않는다. 실제로 import한 정리는 정확한 exported target과 그 감사 기록을 별도로 가진다.

[BSD known-case adapter](core/bsd-known-case-reference.json)는 `E/ℚ`의 해석적 랭크 0·1에서 대수적 랭크 일치와 Sha 유한성을 명시한다. 정확한 전역 L-function 가정을 충족해야 하며, 유한 Euler 목록이나 수치 threshold가 이를 증명하지 않는다. 일반 BSD의 선도계수 공식과 Sha 차수 계산을 결론에 넣지 않는다. 프리즘 비교·trace formula 및 NS 원문 정리도 해당 source/import 구분을 따른다.

## 7. 소스와 ZIP을 다시 만들 때

**일반 CLI 실행에는 `build_m1.py`가 필요하지 않다.** 이 스크립트는 기존 MathScope **v44를 기준으로 하는** 정적 bundle과 WebsitePublisher 패치 9개를 만든다. `page-patches.json`은 이미 M1이 통합된 페이지에 반복 적용하는 패치가 아니다. 기존 페이지 전체를 자동 복구하거나 배포하는 범용 명령도 아니다. 새 배포를 만들 때에는 현재 페이지 버전·이미 적용된 항목을 별도로 확인해야 한다.

소스 ZIP 스크립트는 bundle을 재생성하거나 사이트를 수정하지 않는다. 먼저 포함 파일과 설치 build의 source pin을 읽고 검사한다.

```bash
python mathscope-m1/tools/package_source.py --dry-run
python mathscope-m1/tools/package_source.py --output output/MathScope_M0_M1_Source_and_Evidence.zip
```

Python **3.10 이상**의 표준 라이브러리만 필요하다. `--dry-run`은 ZIP이나 manifest 파일을 쓰지 않는다. 기본 출력도 `output/MathScope_M0_M1_Source_and_Evidence.zip`이다. 기존 결과를 의도적으로 교체할 때만 `--force`를 지정한다.

정상 실행은 다음을 검증한다.

1. `build-manifest.json`의 모든 `sourceFiles`가 현재 파일 hash와 일치한다.
2. 필요한 M0 계약·schema·테스트·Lean driver 및 renderer와 로컬 import 경로가 포함된다.
3. 내부 `PACKAGE_MANIFEST.json`에 소스별 길이와 SHA-256이 들어간다.
4. ZIP의 전체 entry 집합, CRC, 모든 entry의 길이·hash를 다시 읽어 검사한다.
5. 포장 도중 원본 파일이 바뀌지 않았는지 확인하고, 최종 ZIP SHA-256과 `.package-receipt.json`을 기록한다.

포함 범위는 M1의 source/tests/evidence/docs/Lean 소스와 로그, 필요한 M0 소스·schema·테스트·로그, build manifest가 참조하는 renderer다. 공식 NS repository에서는 감사 import 경로에 필요한 **`Flatness.lean`, `ProblemStatement.lean`, `LICENSE`만** 포함한다. `official-validation`은 최상위 JSON/log/MD, 재현용 Python/shell/C와 실제 probe·감사 증거인 `.lean`·`.diff` 파일을 포함한다. 그 아래의 repository·cache·toolchain 디렉터리는 계속 제외한다.

설치된 Lean/mathlib와 대형 cache, vendor dependency, 원문 전체 repository, 바이너리·다운로드 archive, 외부 논문 전문 PDF와 추출한 전문 text는 제외한다. 따라서 ZIP 크기나 무결성 확인을 공식 NS 전체의 재현 성공으로 읽을 수 없다. 공개 원전의 URL·고정 commit·hash·정리 위치는 source lock과 문헌 목록에 남는다.

최종 PDF 보고서는 별도 산출물이다. 이 ZIP에는 보고서의 원문 acceptance, 정규화한 데이터, 생성 소스와 검증 기록이 들어가며 외부 논문의 전문을 복제하지 않는다.
