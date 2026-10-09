# 원문 저장소의 원래 rc2 빌드 감사

## 현재 판정

**원래 고정 rc2의 `NavierStokes.ComparatorSolution` 선택 빌드는 2026-10-09 16:05:12 UTC에 종료 0, 9,371개 Lake 작업으로 완료했다.** 별도 원래 rc2 `PinnedDeclarations.lean` 명령도 16:06:24 UTC에 종료 0으로 완료했다. C/D 두 exported declaration의 실제 타입과 공리 의존성을 출력했으며, 각 정리의 공리는 `propext`, `Classical.choice`, `Quot.sound` 세 개이다. 정확한 명령·환경·출력과 해시는 `full-pinned-command-results.json`, `ns-pinned-declarations.log`, `official-audit-summary.json`에 연결되어 있다.

원래 전체 기본 대상 `NavierStokes`, `Euler`, `ComparatorChallenges`의 빌드는 종료 **-15**로 명시 중단했고 전체 성공으로 표시하지 않는다. 엄격한 Comparator 실행은 **환경 BLOCKED**이다. 원래 보호 실행을 사용자 systemd 버스로 시작할 수 없고, 세션의 UID 0은 Comparator가 문서화한 비특권 사용자 가정에도 맞지 않는다. 보호 장치를 생략한 다른 실행으로 Comparator 완료를 판정하지 않는다.

브라우저에 이미 묶인 M1 수치 코드와 로컬 Lean 4.34.1 검증 결과는 동결되어 있다. 이 디렉터리는 추가로 요청된 **원문 rc2 실행 프로파일**의 독립적인 증거이다. N1-05/06의 체크리스트 증거는 이번 실제 실행에 맞춰 갱신하며 원래 detail/acceptance 문장은 보존한다. N3의 실제 원문 프로파일 접합 및 전구간 cone 인증 차단 조건은 이 빌드로 해소되지 않는다.

## 고정된 입력과 격리

| 입력 | 값 또는 증거 |
|---|---|
| 원문 저장소 | `https://github.com/openai/NavierStokesAndEuler` |
| 원문 커밋 | `f9e8bc5b38b6e212696e8a30e3e91517af887bbd` |
| 원래 도구 체인 | `leanprover/lean4:v4.34.0-rc2` |
| 실제 rc2 컴파일러 커밋 | `6a10ac8c22beadecabdbb0919c2b50214762f91d` |
| 공식 배포 압축본 SHA-256 | `3d011041203acacf300d343a39673f7d233743397993797c941346ae9e5df1a8` |
| mathlib 커밋 | `85e3a25e006c35636f0e53b0e9296caca2685bc0` |
| Comparator 커밋 | `19e111e2141cf333c7daff0f64c5f24acc91dd2e` |
| lean4export 커밋 | `cacf989bd75f608700820f6afc595f32e7a99a4d` |
| 원래 기본 빌드 대상 | `NavierStokes`, `Euler`, `ComparatorChallenges` |
| 원문 Lean 파일 수 | 총 2,659개: NavierStokes 817개, Euler 1,840개, ComparatorChallenges 2개 |

원래 `lean-toolchain`, `lakefile.toml`, `lake-manifest.json` 및 모든 tracked source를 유지한다. `repo/`는 독립 객체를 가진 별도 checkout이다. `.lake`, mathlib 캐시, rc2 도구 체인, 보조 빌드 도구가 모두 이 감사 디렉터리에 있다. 기존 4.34.1 설치와 기존 mathlib `.olean` 파일은 이 시도에서 수정하지 않는다. 입력별 SHA와 상태는 `environment-before.json`, `environment-during.json`, `pinned-source-inventory.json`에 있다.

## 실행 프로파일과 경로 오류

원래 배포본의 `lean --version`은 `failed to locate application`으로 종료 1이다. 원래 `lake --version`은 rc2 버전을 보고하지만, 별도 경로를 주지 않은 `lake exe cache get`와 `lake build`는 Lake 설치 경로 탐지 단계에서 종료 1이다. 실제 명령과 로그는 `official-command-results.json` 및 대응 `.log`에 기록되어 있다.

Lake가 공식 지원하는 `LEAN_SYSROOT`와 `LAKE_HOME`을 명시한 재시도에서도, 자식 Lean 프로세스의 애플리케이션 경로 탐지가 실패했다. `official-explicit-command-results.json`은 이 프로파일을 구분한다. 원래 proof source나 manifest를 바꾸어 이 오류를 감추지 않았다.

그다음 기존에 승인된 `lean-embed-check.c`의 **동일한 소스**를 공식 rc2 헤더 및 `libleanshared.so`에 링크했다. `lean-rc2-entry.c`와 실행 파일, 공식 공유 라이브러리 SHA는 `driver-build.json`에 있다. 이 entry는 명시적인 설치 경로를 초기화한 다음 공식 `lean_shell_options_process`와 `lean_shell_main`을 호출한다. 기존 entry의 task-manager worker 수는 1이며, 이는 `environment-during.json`에도 공개한다. 기록된 명령은 `--threads`를 사용하지 않는다. proof source, 커널, 논리적 elaboration 옵션 및 실패 코드를 대체하지 않았다.

`lean-entry-layout/`은 공식 배포본을 가리키는 별도 symlink 구조이며 `bin/lean`만 위 entry를 호출한다. 원래 배포본 파일의 바이트는 수정하지 않는다. 표준 CLI 실패와 이 명시 경로 프로파일의 성공 여부를 합치지 않는다.

entry의 독립 대조에서는 `(0 : Nat) = 0`의 `rfl` 증명은 종료 0과 빈 공리 의존성을 보고하고, `(0 : Nat) = 1`의 거짓 `rfl` 증명은 종료 1로 거부했다. 실제 로그와 해시는 `pinned-entry-kernel-controls.json`에 있다.

## 원래 캐시 프로그램의 명시 경로 entry

위 entry로 원래 Cache 모듈 25개 및 원래 native cache 실행 파일을 빌드할 수 있었다. 그러나 native cache 실행 파일은 `CacheM.getContext` 안의 `Lean.getSrcSearchPath`가 무조건 `IO.appDir`을 호출하면서 같은 애플리케이션 경로 오류로 종료했다. 캐시 다운로드 자체가 시작되기 전의 오류이다.

이에 proof 저장소 밖의 `CacheEntryExplicit.lean`에서 원래 `Cache/Main.lean` 명령 본문을 유지하고 `CacheM.run`의 환경 자동 탐지를 명시적인 `ReaderT.run` context로만 바꿨다. 정확히 고정된 소스 경로와 공식 Lean 소스 경로를 전달한다. 차이는 `cache-entry.diff`, 원문과 entry의 SHA는 `cache-entry.json`에 있다.

원래 캐시 키 산출, 전송, 검사, 압축 해제 코드와 CLI 옵션은 유지한다. `--unsafe` 등의 우회 옵션을 사용하지 않는다. 원래 endpoint `https://lakecache.blob.core.windows.net/mathlib4-master`와 원래 병렬 다운로드 모드를 사용한다. 이 캐시는 정상적인 공식 캐시 신뢰 가정을 포함하며, 모든 캐시 내부 증명을 별도 외부 커널로 다시 검사했다는 의미는 없다.

첫 원문 빌드는 1,142개 작업이 성공한 후 캐시를 먼저 완성하기 위해 명시적으로 중단했다. 해당 종료 `-15`와 중단 이유는 `official-wrapper-command-results.json`에 보존되어 있다. 공식 캐시 요청 **8,747개가 모두 다운로드·압축 해제되고 캐시 entry가 종료 0**에 도달한 다음 원래 기본 빌드를 다시 시작했다. `cache-context-result.json`과 `cache-context-explicit.log`가 실제 결과이다. `.lake`의 압축 해제와 빌드가 동시에 쓰이지 않게 순차 실행했다.

## 전체 빌드와 제출 정리 확인

명시 경로 프로파일에서 원래 `lake build`를 15:23:30 UTC에 실행했다. 원래 기본 대상과 proof source, warning 옵션은 유지했다. Euler의 독립 모듈 빌드가 시작되어 NS C/D를 우선하기 위해 15:37:13 UTC에 명시 중단했고 실제 종료는 -15이다. 승인된 순서 변경은 `priority-transition.json`에 있다.

동일 `.lake`에 동시에 쓰지 않고 그다음 원래 Lake의 표준 대상 선택 명령 `lake build NavierStokes.ComparatorSolution`을 실행했다. 15:37:33부터 16:05:12 UTC까지 1,659초에 종료 0으로 끝났고 원문 제출 파일 자체의 두 `#print axioms`도 출력되었다. 이후 별도 entry를 `lake env lean --root … PinnedDeclarations.lean`으로 실행해 72초에 종료 0을 확보했다. 이 entry는 unchanged `NavierStokes.ComparatorSolution`을 import하고 아래 두 이름의 일반 type, `pp.all` type 및 `#print axioms`를 출력했다.

1. `NavierStokes.Comparator.navier_stokes_breakdown_R3`
2. `NavierStokes.Comparator.navier_stokes_breakdown_periodic`

실제 일반 type 출력은 다음과 같다. 각 조건의 정의도 고정된 저장소의 그대로인 정의를 사용한다.

```lean
NavierStokes.Comparator.navier_stokes_breakdown_R3 : ∀ nu > 0,
  ∃ u₀ f,
    NavierStokes.Comparator.InitialVelocityConditionDecay u₀ ∧
      NavierStokes.Comparator.ForceConditionDecay f ∧
        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessRn nu u₀ f v p

NavierStokes.Comparator.navier_stokes_breakdown_periodic : ∀ nu > 0,
  ∃ u₀ f,
    NavierStokes.Comparator.InitialVelocityConditionPeriodic u₀ ∧
      NavierStokes.Comparator.ForceConditionPeriodic f ∧
        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessPeriodic nu u₀ f v p
```

원문 제출 파일의 그대로인 사본 `OfficialComparatorSolution.lean`, 감사 entry `PinnedDeclarations.lean`, 실제 제출 `.olean`의 해시·크기, 공식 공유 라이브러리·driver 해시, 정확한 argv·cwd·환경, 두 타입과 공리 전체 출력은 `official-audit-summary.json`에서 추적된다. `sorryAx` 또는 추가 사용자 공리에 의존한다고 출력되지 않았다. 이 커널 실행은 원래 upstream mathlib 캐시를 사용하는 명시 경로 실행 프로파일이다.

두 정리는 각각 강제력이 있는 원문 C/D 문장을 참조한다. 전체 기본 빌드의 성공과 C/D 파일의 개별 성공은 구분한다. 외부 Comparator가 차단된 상태에서 type 출력이나 source hash만으로 독립적인 Comparator 동치 검사 완료를 선언하지 않는다. 브라우저의 source validation과 기존 14:39 Lean 4.34.1의 13개 로컬 대상 감사도 이 두 rc2 정리의 실행으로 자동 승격하지 않는다.

### 남은 빌드 범위

`remaining-build-scope.json`은 성공한 C/D 선택 빌드 이후 원래 tracked source와 `.olean` 존재 여부를 읽어 기록한 재고이다. 재고 자체는 별도 proof certificate가 아니다.

| 범위 | 원문 모듈 | `.olean` 존재 | 미생성 |
|---|---:|---:|---:|
| C/D 제출의 local import closure | 609 | 609 | 0 |
| `NavierStokes` root의 source import closure | 753 | 692 | 61 |
| 전체 `NavierStokes` library | 817 | 702 | 115 |
| 전체 `Euler` library | 1,840 | 23 | 1,817 |
| `ComparatorChallenges` | 2 | 0 | 2 |

기록된 NS 모듈 702개의 보고 시간 중앙값은 10초, 최댓값은 367초이다. 의존성의 직렬 구간과 모듈별 난도가 달라 이 통계만으로 남은 전체 빌드 시간의 상한을 보증하지 않는다. 이번 추가 작업의 우선 요구인 C/D 실제 타입·공리 실행은 완료했고, 이후 NS aggregate나 Euler 기본 전체 빌드를 더 시작하지 않았다. N1-05/06은 각각 전체 기본 빌드 미완료와 독립 Comparator 환경 차단 때문에 **PARTIAL**을 유지한다. 원본 detail/acceptance는 변경하지 않았다.

## Comparator 환경 BLOCKED

원래 NS config는 `enable_nanoda: true`이며 허용 공리는 `propext`, `Quot.sound`, `Classical.choice`이다. 이 설정을 수정하지 않았다. 원래 Comparator README의 보호 조건인

```text
systemd-run --property=RestrictAddressFamilies=~AF_UNIX --user --pty ...
  lake exe comparator ComparatorChallenges/NavierStokes.json
```

호출은 `Failed to connect to bus: No medium found`로 종료 1이다. `comparator-pinned-guarded.json`에 정확한 argv, cwd, config SHA와 로그 SHA가 있다. Comparator 본체에 도달하지 못했으므로, 이 결과는 정리의 거짓이나 증명 실패를 의미하지 않는다. UID 0과 Linux 6.18.44도 실제 환경 값으로 기록되어 있다.

보호 장치를 완화하거나 development용 fake-landrun으로 바꾸지 않았다. 더 약한 경로의 실행을 Comparator 완료로 판정하지 않는다. 원문에서 지정하는 정식 Landrun 소스는 정상 빌드되었고 동일한 원래 sandbox 인자 패턴의 무해한 `true` 명령은 종료 0이었다. 진행 중이던 정식 Nanoda 소스 빌드도 완료되었다. 이 도구의 빌드 성공은 Comparator 증명 검사 성공과 별개이다.

별도 담당자의 읽기 전용 조사인 `comparator-environment-independent.json`과 `comparator-environment-independent.md`는 현재 컨테이너의 PID 1이 `supervisord`이며 활성 user systemd/DBus가 관측되지 않고, cgroup 마운트가 read-only이며 현재 도구 프로파일의 UID/GID 매핑은 0만 포함하고 `CapBnd`는 0임을 기록한다. 기존 비특권 계정의 존재와 실제 이 프로파일의 전환 가능성을 구분했다. 이 조사는 Comparator를 다시 실행하거나 보호 조건을 바꾸지 않았다. 보고서 안의 `AUDIT.md` 해시는 16:00:25 UTC 당시 설명의 snapshot이며, 빌드 완료 후 갱신된 본문의 해시라는 뜻이 아니다.

## 전달할 파일

감사 전달물은 이 디렉터리의 `.json`, `.log`, `.md`, `.lean`, `.diff`, `.py`, `.c` 파일이다. 용량이 큰 도구 체인, 공식 배포 압축본, 원문 checkout, `.lake`, 캐시, Go/Rust 빌드 디렉터리는 전달 ZIP에 넣을 필요가 없다. 원문 위치, 커밋, 다운로드 URL과 SHA, 실행 환경, 실제 명령이 별도 metadata에 있어 재실행 경로를 보존한다.
