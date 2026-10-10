# 보호 Comparator: 단계별 비용 후보와 종료 시 증거 조건

이 문서는 실행 중인 명령을 변경하지 않은 읽기 전용 분석이다. 실제 내부
진행 단계의 추정이나 N1-06 완료 판정이 아니다. 기준 입력은 run
`37979127351`, job `113984853927`, MathScope commit
`8c4271aa5a35b1d34c30279fb306a099944e4823`의 동결된 workflow/controller와
원문 Comparator commit `19e111e2141cf333c7daff0f64c5f24acc91dd2e`이다.
입력별 SHA-256과 복사본은 `receipt.json`, `inputs/`에 보존한다.

## 1. 현재 관측으로 아는 범위

2026-10-10 **00:30:00.007 UTC**의 실제 API 응답은 별도 비특권 사용자
준비까지 성공했고, step 5인 원문 보호 검증이 `in_progress`라고만 말한다.
수집과 업로드 단계는 `pending`이며 실제 Comparator 명령의 종료 코드는
아직 없다. 공개된 artifact는 default-build의 `11644582983` 하나다.
수정된 후속 run `37992645347`에는 아직 job이 배정되지 않았다.

step 5는 다운로드부터 최종 원문 상태 검사까지 하나의 Python 명령으로
감싼다. 따라서 이 상태만으로 solution build, export, nanoda 또는 Lean
replay 중 하나를 현재 단계로 지정할 수 없다. 이전의 실행 중 job-log API
요청은 `BlobNotFound`였으며, 이것도 하위 명령의 실패를 뜻하지 않는다.

## 2. 실행 순서와 비용이 클 수 있는 지점

아래의 비용 설명은 실제 고정 소스의 연산 구조에서 나온 후보 분류다.
현재 작업이 그 단계에 있다는 진술이나 남은 시간의 예측은 아니다.

| 순서 | 실제 controller 단계 | 비용 및 관측 지점 |
|---|---|---|
| 1 | 공식 Lean archive 다운로드·해시 검사·압축 해제 | 네트워크와 디스크 I/O. archive와 kernel의 고정 SHA가 먼저 검사된다. |
| 2 | 원문 독립 clone, 2,669-file 해시, `lake exe cache get` | 원문 파일 검사와 Mathlib cache 다운로드. cache를 받아도 원문 project olean 0 조건은 뒤에서 별도로 검사한다. |
| 3 | Landrun·nanoda 고정 commit clone, Go/Rust 확인 및 빌드 | `cargo build --release --locked --jobs 2`라는 실제 병렬 제한이 있다. 이 명령별 별도 timeout은 없다. |
| 4 | `lake build comparator lean4export` | 신뢰된 도구만 미리 빌드한다. 원문 solution의 사전 빌드를 허용하는 명령으로 바꾸지 않는다. |
| 5 | 원문 olean 0와 source 재확인, 도구 해시, 두 음성 probe | 실제 AF_UNIX 차단과 Landlock 외부 쓰기 차단을 확인한 뒤에만 본 Comparator를 호출한다. |
| 6 | `protected-comparator` | 아래의 원문 내부 단계 전부를 포함한다. 정상적인 경우 이 한 controller record의 실제 return code가 그 전체 결과다. |
| 7 | 원래 두 theorem의 `#check` 및 `#print axioms` | 이미 보호된 Comparator가 만든 원문 solution을 대상으로 한다. 이 감사는 본 Comparator의 성공 뒤에만 실행된다. |
| 8 | 최종 2,669-file 해시, kernel 재검사, Git status | 모든 실질 검증 뒤의 보존 검사다. 여기서만 알려진 Git stderr 병합 오류가 발생할 수 있다. |

### Comparator 내부의 실제 직렬 순서

`Main.lean`의 `compareIt`와 `verifyMatch`는 다음 순서를 사용한다.

| 순서 | 원문 연산 및 시작 marker | 비용을 일으킬 수 있는 실제 구조 |
|---|---|---|
| A | `Building ComparatorChallenges.NavierStokes` | Landrun 내부의 `lake build`이며 `.lake`만 쓰기 대상으로 허용한다. |
| B | `Exporting ... from ComparatorChallenges.NavierStokes` | exporter의 전체 stdout을 `IO.Process.output`으로 받아 challenge export 문자열을 유지한다. exporter의 stdout 자체를 진행 로그로 스트리밍하지 않는다. |
| C | `Building NavierStokes.ComparatorSolution` | 미리 원문 solution을 빌드하지 않은 독립 checkout의 실제 protected build다. |
| D | `Exporting ... from NavierStokes.ComparatorSolution` | 두 원래 theorem 및 필요한 primitive/axiom 대상의 export를 만든다. solution export 문자열도 메모리에 유지한다. |
| E | 두 export의 파싱, `compareAt`, `checkAxioms` | 문자열을 byte stream으로 바꾸고 두 exported environment를 파싱한 뒤 statement 및 axiom 의존 관계를 확인한다. 이 부분에는 별도 controller stage marker가 없다. |
| F | `Running nanoda kernel on solution` | 실제 solution export와 nanoda config를 임시 파일에 쓰고, 원문 Landrun 경로로 nanoda를 실행하여 종료를 기다린다. 명령별 timeout이나 생략 분기는 추가하지 않는다. |
| G | `Running Lean default kernel on solution.` | 빈 Lean kernel environment에 실제 exported constants를 replay한다. 그 뒤 원문 Quot 상수 일치 검사를 수행한다. |
| H | `Your solution is okay!` | 위 비교와 kernel 검증들이 원문 절차를 통과한 뒤의 marker다. 여전히 controller의 실제 exit 0와 후속 보존 감사도 확인해야 한다. |

따라서 solution build가 끝나도 export 생성, export 파싱, 외부 kernel,
원래 Lean kernel replay가 각각 남을 수 있다. export 문자열·파싱 환경의
동시 보유 때문에 메모리와 임시 파일 I/O도 조사 대상이다. 현재 로그 없이
OOM, 디스크 부족, kernel hang 또는 특정 단계 정체를 사실로 판단하지 않는다.
명령이 종료한 뒤의 실제 error, signal/exit, 마지막 로그와 단계 시간을
먼저 확인한다.

### 사용할 수 있는 실제 과거 시간 — 현재 Comparator의 예측값 아님

같은 원래 GitHub run의 **별도 default-build job**에서 cache 명령은
109.779619초, 원문 전체 `lake build`는 5,968.074524초(99분 28.074524초)
소요되었다. 모두 실제 exit 0였다. 이 숫자는 보존된 그 job의 receipt에서
직접 뺀 값이며 `historical-default-timings.json`에 기록했다. 그 기본 빌드와
현재 Comparator는 checkout, 목표 및 추가 검사 단계가 다르므로 이 숫자를
현재 Comparator의 완료 시간이나 상한으로 사용하지 않는다.

## 3. 350분 제한과 실제 수집 가능성

고정 workflow는 **job 전체**에 `timeout-minutes: 350`을 둔다. 보호
Comparator 하위 명령에 350분이 별도로 부여되는 구조가 아니다. 알려진 run
시작 시각 2026-10-09 19:16:48 UTC를 기준으로 한 관측 경계는 대략
2026-10-10 01:07 UTC다. run 시작과 runner의 정확한 job timeout 기산점은
같다고 단정하지 않으며 실제 종료 응답과 로그가 최종 근거다. GitHub 공식
[workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idtimeout-minutes)는 job timeout을 자동 취소 시점으로 규정한다.

workflow의 수집 단계와 `actions/upload-artifact@v4`는 모두
`if: always()`다. GitHub의 [expression 문서](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#always)는 이 조건이 취소 상황에서도 참이며 로그 수집에 사용할 수 있음을 설명한다.
그러나 이 조건만으로 timeout 이후 데이터 수집·업로드가 실제 성공했다고
판정할 수 없다. runner가 수집 단계를 실행할 수 있어야 하고, 증거 디렉터리의
복사와 artifact 서비스 업로드가 모두 끝나야 한다. GitHub의
[cancellation 문서](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-cancellation)는 취소 대상 step의 entry process에 먼저 interrupt를 보내고, 후속 termination 및 process-tree 종료 절차를 적용하며, 별도의 강제 종료 경계도 있음을 설명한다. 이는 실제 artifact 도착을 대신하는 보증이 아니다.

이 고정 workflow의 수집 명령은 `/home/mathscopeverify/audit/evidence`가
있을 때 복사하고, 없더라도 pins와 MathScope commit 파일을 생성할 수 있다.
따라서 이름이 맞는 ZIP 하나가 생겼다는 것만으로 Comparator 실행 증거가
완전하다고 볼 수 없다.

## 4. 중단되면 어느 기록이 남을 수 있는가

controller의 `run()`은 명령을 시작하기 전에 label, command, cwd,
startedUTC를 `result.json`에 저장한다. stdout/stderr는 같은 로그에 모으고
한 줄마다 flush한다. `process.wait()`가 실제로 반환한 뒤에만 해당 stage의
exitCode, completedUTC, logSHA256를 붙인다. 정상 예외는 `FAILED`와 실제
오류 문자열로 저장한다.

controller에는 signal handler가 없다. 그러므로 Python이 강제 종료되면
최종 `finally` 저장이 보장되지 않는다. interrupt가 `KeyboardInterrupt`로
전파되는 경우에도 `except Exception`의 정상 실패 분기를 통과하지 않으면서
`finally`가 실행될 수 있으므로, `completedUTC`만 있고 status는 `RUNNING`,
exitCode는 null인 기록이 가능하다. **timestamp는 성공 종료 코드의 대체가
아니다.** `write_text` 도중 강제 종료된 JSON이 불완전할 가능성도 실제 바이트를
읽어 확인한다.

| 도착한 기록 | 허용되는 해석 |
|---|---|
| stage 시작과 부분 로그만 있고 exitCode 없음 | 그 stage가 시작되었다는 기록. 완료 여부는 미확인이다. |
| 실제 stage exitCode가 0이 아님 | 실제 기록된 실행 실패. 코드와 로그의 직접 원인을 보존한다. |
| nanoda acceptance만 있음 | 외부 kernel acceptance에 대한 부분 증거이며 전체 Comparator 완료는 아니다. |
| Lean acceptance만 있고 Quot 검사 또는 마지막 marker/exit가 없음 | 전체 원문 절차의 성공 증거가 아직 부족하다. Lean acceptance marker는 Quot 후검사보다 앞에 출력된다. |
| 두 kernel acceptance, 마지막 marker, 본 명령 exit 0가 있음 | 보호 Comparator 본 명령의 성공 근거. 후속 theorem audit 및 원문/kernel 보존 기록까지 별도로 확인한다. |
| 마지막 원문 Git status에 알려진 두 permission warning만 있음 | 모든 실질 검사가 통과하고 원문 바이트/커널이 보존된 경우에 한해서 기존 stderr 병합 wrapper 오류로 분리할 수 있다. GitHub job과 controller failure 자체를 성공으로 바꾸지 않는다. |
| 수집 또는 업로드가 실패했거나 artifact가 없음 | 증거 수집 실패/미도착. Comparator 성공이나 수학적 반증으로 대신 해석하지 않는다. |

`systemd-run --user --pty --wait --collect`는 정상 경로에서 보호 unit의 종료를
기다린다. timeout 시 wrapper와 systemd가 관리하는 하위 unit의 생존/종료
관계를 이 소스만으로 확정하지 않는다. wrapper 종료 이후 unit이 남았다고
가정하여 성공을 보충하지도 않는다. 주소 계열 제한과 Landrun 보호는 원문
launch 경로의 조건이며, 기다리는 시간을 줄이려고 제거하거나 우회하지 않는다.

## 5. 실제 artifact 도착 직후의 최소 조사 순서

1. 최종 job 상태, artifact id/size/digest 및 그 관측 시각을 같은 묶음으로 저장한다.
2. ZIP 실제 바이트를 내려받고 GitHub digest와 일치하는지 확인한다. 임시 signed download URL은 기록물이나 Git에 저장하지 않는다.
3. `result.json`의 마지막 실행 stage, 완결된 종료 코드, stage별 로그 SHA와 마지막 직접 오류를 읽는다. 메타데이터가 없으면 null/미확인으로 남긴다.
4. 보호 Comparator 내부 marker 순서와 실제 nanoda/Lean/Quot/final 결과를 읽는다. 기록되지 않은 내부 진행률은 만들지 않는다.
5. 준비된 `verify_n106_artifact.py`로 olean 0, 비특권 UID/capability probe, systemd/DBus, AF/Landlock 음성 검사, 고정 configuration, 원문 2,669-file·kernel·도구 pins, theorem type/axioms, 전체 로그를 검사한다.
6. 실제 본 명령 exit와 controller/GitHub 결론을 분리해 보고한다. 기존 run의 종료 전 재시작·취소·중복 실행은 하지 않는다.

이 문서는 준비된 조사 경로만 제공한다. 원래 N1-06을 닫는 것은 같은 실제
실행에서 나온 완전한 종료·kernel acceptance·보호·보존 증거다.
