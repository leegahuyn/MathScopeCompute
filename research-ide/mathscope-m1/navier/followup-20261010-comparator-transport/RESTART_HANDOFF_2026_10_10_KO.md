# MathScope M0–M1 새 채팅 인수인계

기록 기준: **2026-10-10 11:53 KST 이후의 실제 확인 결과**. 원시 증거의 UTC 시각과 SHA-256은 각 JSON 및 로그에 그대로 보존한다. 이 문서는 대화 길이 제한에 따른 **작업 재개 문서**이며, 새 70/0 완료 판정이 아니다.

## 1. 가장 먼저 알아야 할 현재 상태

**원래 70개 기준에 대한 마지막 동결 판정은 69 PASS / 1 PARTIAL / 0 BLOCKED다. 요청한 아홉 항목 가운데 여덟 항목은 완료되어 있고, N1-06의 최종 감사만 아직 닫히지 않았다.**

이번에 큰 변화가 있었다. 원문 보호 Comparator의 실제 생산 실행은 **성공했다**. 다만 확보한 실제 결과를 읽는 감사기의 정리 타입 출력 파서에서 오류를 발견했다. 감사기를 수정하고 독립 검토하는 다음 단계가 남아 있다. 실제 Comparator 실행의 성공과 감사기 프로그램의 실패를 구분해야 한다.

| 구분 | 실제 기록 |
|---|---|
| GitHub 생산 run | `38014602021` |
| 실제 job | `114101981614` |
| 실행 소스 commit | `55dacb898f8c204bf0c5925ea901d75d6c2d0f46` |
| GitHub 최종 상태 | `completed / success` |
| controller 시작 | 2026-10-10 10:49:38.160506 KST / `2026-10-10T01:49:38.160506+00:00` |
| 보호 Comparator 명령 종료 | 2026-10-10 11:44:02.979392 KST / `2026-10-10T02:44:02.979392+00:00` |
| controller 전체 종료 | **2026-10-10 11:44:09.356301 KST** / `2026-10-10T02:44:09.356301+00:00` |
| 실제 최종 API 관측 | 2026-10-10 11:45:13.698 KST / `2026-10-10T02:45:13.698Z` |
| 실제 실행 단계 | 35개 전부 종료 코드 `0` |
| 실제 보호 명령 | 종료 코드 `0`, cleanup 이전 EOF와 종료 확인, timeout 없음, cleanup `[]` |
| 필수 검증 순서 | nanoda 승인 → Lean 기본 kernel 승인 → 최종 Quot 후검사 이후 성공 |
| 실제 제출 선언 | C/D에 대응하는 R3 및 periodic 두 정리의 타입과 `#print axioms` 출력 |
| 제출 선언 공리 | 두 정리 모두 `propext`, `Classical.choice`, `Quot.sound` |
| 원문 추적 파일 | 2,669개, 전후 해시 동일 |
| 결과 artifact | `11657065866` / `original-comparator-terminal-38014602021-1.zip` |
| ZIP 크기 | **313,326 bytes** |
| ZIP SHA-256 | `1bc9b8134308ee9d8205c3273b96558ccb4efc456d0054da3ea033879c70d9b8` |
| 기존 감사기 실제 결과 | **233/234, `FAIL_OR_INCOMPLETE`, 종료 코드 1, `N106Completed=false`** |
| 유일한 실패 항목 | `both submitted theorem types actually printed` |
| 독립 감사기 실제 결과 | **347/350, `FAIL_OR_INCOMPLETE`, 종료 코드 1, `N106Completed=false`** |
| 독립 감사기의 실패 세 항목 | 같은 타입 파서의 R3·periodic 두 검사 및 primary audit가 PASS여야 한다는 연결 검사 |

실제 run 링크: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38014602021

실제 job 링크: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38014602021/job/114101981614

**아직 하지 않은 일:** 수정 감사기에 따른 실제 PASS, 새 70/0 판정, `.4` 전체 릴리스, 전체 완료를 주장하는 최종 PDF. 이번 재개 문서를 그 완료 산출물과 혼동하지 않는다.

## 2. 사용자의 원래 목표와 승인 범위

사용자는 인수인계 및 Blueprint의 **M0부터 M1까지 원래 요구사항 전부**를 충족하고, 아래 아홉 미완료 항목을 실제 근거로 닫으라고 요청했다. 기준을 줄이거나 바꾸어 완료로 만들면 안 된다.

- 원래 70개 acceptance 기준, 935개 원본 archive member, v54의 `61 PASS / 7 PARTIAL / 2 BLOCKED`를 보존한다.
- 별도로 동결한 `68/2`와 `69/1` 기록도 보존한다. 새 판정은 별도 날짜·파일로 만든다.
- 완료되어 있던 61개 항목을 이번에 새로 전수 재감사했다거나 70이라는 숫자가 수학 증명률이라고 말하지 않는다.
- 새 해석적 프로파일 전체를 Lean으로 형식화하는 것, 이후 시간 의존 Navier–Stokes 단계, `f=0`, `t=1`에서의 매끄러운 연장은 이번 원래 M0–M1 완료 범위로 추가하지 않는다.
- `leegahuyn/MathScopeCompute`에 대한 GitHub 저장·브랜치·릴리스 작업은 이미 승인되어 있다. 사이트의 실제 배포는 하지 않는다.
- 원문 소스, 공식 Lean kernel, 원문 Comparator 설정과 보호 옵션은 바꾸지 않는다. 필요한 교정은 별도 후속 파일에 남긴다.
- 작업을 이어가기 위해 다시 확인 허락을 묻거나 이미 성공한 긴 빌드부터 다시 시작하지 않는다.
- 사용자는 대화 길이 제한 때문에 이 인수인계를 요청했다. 다음 채팅의 목표는 아래 남은 감사기 교정부터 실제 완료까지 계속 진행하는 것이다.

## 3. 원래 아홉 항목의 상태

| ID | 원래 항목 | 현재 판정 | 완료 근거 또는 바로 남은 일 |
|---|---|---|---|
| N1-05 | 공식 Lean 환경 고정 | PASS | 원문 전체 기본 `lake build` 실제 exit 0 및 전체 로그·원문·공식 kernel·환경 해시 검증 |
| N1-06 | 정리 의존성과 Comparator 검사 | PARTIAL | 실제 보호 Comparator는 성공. 정리 매개변수 출력 파서 교정, 실제 결과 재감사, 독립 검토와 새 판정 필요 |
| N3-01 | 상수의 선택 순서 실행 명세 | PASS | 같은 프로파일에 대한 비순환 상수 계층과 증명된 선택 조건, 63개 정확 표현 |
| N3-02 | 외곽 radial schedule와 압력 datum | PASS | 동일한 A.21 압력, 실제 연속 보정과 모든 eta의 다섯 모멘트, 외곽 및 양의 장 연결 |
| N3-03 | 축 자료와 수렴 멱급수 | PASS | 실제 무한 고정점·불변구·수축, 유한 125개 배열·반지름/eta 꼬리·반올림 오차·실제 Lean 입력 연결 |
| N3-04 | 실제 core 압력·방사 속도 복원 | PASS | 같은 무한 core의 Cartesian 정칙성·divergence·정확 leading 항등식과 유한 배열의 오차 연결 |
| N3-05 | Inner continuation과 다섯 모멘트 접합 | PASS | 연속 적분, 모든 이차 모멘트 항과 들어오는 debt를 포함한 균일 all-eta B8 포함·수축 |
| N3-06 | Cone의 radial modulation | PASS | 하나의 유한 N, 닫힌 전체 annulus에서 strict `kappa=R^-10`, 균일 I1 복원 |
| N3-07 | 지지·끝점·예약 patch 검사 | PASS | 같은 최종 stress의 내부 양의 하한·외부 영, flat factorization, 정규화 방향의 끝점 극한, Ipos/Imean 보존 |

원래 기준 원문과 각 record 해시는 동결 평가 JSON 안에 있다. 위 표의 요약을 새 acceptance 기준으로 사용하지 않는다.

## 4. 바로 수정해야 할 오류: 타입 출력의 매개변수

현재 primary 감사기는 다음 이름으로 보존되어 있다.

`mathscope-m1/navier/followup-20261010-comparator-transport/verify_n106_terminal_artifact.py`

SHA-256: `81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef`.

이 파일의 `both submitted theorem types actually printed` 검사는 다음 형태다.

```python
all(re.search(re.escape(n) + r"\s*:", type_log) for n in THEOREMS)
```

하지만 실제 Lean `#check` 출력에는 정리 이름과 `:` 사이에 매개변수가 있다. 실제 artifact의 `submitted-type-and-axiom-audit.log`는 다음을 담고 있다.

```lean
NavierStokes.Comparator.navier_stokes_breakdown_R3 (nu : ℝ) (hnu : nu > 0) :
  ∃ u₀ f,
    NavierStokes.Comparator.InitialVelocityConditionDecay u₀ ∧
      NavierStokes.Comparator.ForceConditionDecay f ∧
        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessRn nu u₀ f v p
'NavierStokes.Comparator.navier_stokes_breakdown_R3' depends on axioms: [propext, Classical.choice, Quot.sound]
NavierStokes.Comparator.navier_stokes_breakdown_periodic (nu : ℝ) (hnu : nu > 0) :
  ∃ u₀ f,
    NavierStokes.Comparator.InitialVelocityConditionPeriodic u₀ ∧
      NavierStokes.Comparator.ForceConditionPeriodic f ∧
        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessPeriodic nu u₀ f v p
'NavierStokes.Comparator.navier_stokes_breakdown_periodic' depends on axioms: [propext, Classical.choice, Quot.sound]
```

독립 감사기 준비본에도 같은 제한적인 정규식이 들어 있다.

`mathscope-m1/navier/followup-20261010-comparator-transport/independent-artifact-reviewer/review_actual_comparator.py`

SHA-256: `0b273238813506acf49689965009496df08b2aa8dc66c83778954340ded9765f`. `actual printed submitted theorem type` 검사 부분이다.

이 독립 감사기 역시 실제 ZIP·최종 관측·원시 GitHub 로그·primary audit에 대해 수정 없이 실행했다. 결과는 347/350이며, 두 타입 패턴과 primary PASS 요구 외의 347개 검사는 통과했다. `independent-review.json` SHA는 `6211680abccbd65ff6155dc5f3b6bd88308b63888c68e09e1ec25b5ce41d1ca7`, 실제 실행 receipt SHA는 `981f6f1c6b4d895cbf6e7e1b89196560bfa6fa6d4f4c97f44563046ccb75e53f`다. primary PASS 요구의 실패는 첫 감사기 결과가 실제로 FAIL이라는 연결 검사 결과이며, 새 kernel 실행 실패가 아니다.

### 교정 원칙

1. 기존 두 감사기 및 이미 생긴 실패 결과를 덮어쓰지 않는다. 새 버전의 소스를 만든다.
2. 원래 두 제출 정리의 매개변수와 명제 본문을 읽고, 공백·줄바꿈만 정규화하여 전체 타입을 확인하는 방향으로 고친다. 임의의 이름 뒤에서 아무 `:`나 찾도록 완화하지 않는다.
3. 원문 `ComparatorChallenges/NavierStokes.lean`, `NavierStokes/ComparatorSolution.lean`, 원래 Comparator 구현·설정, 실제 제출 타입 로그를 대조한다. 실제 원문 kernel 비교는 이미 성공했다는 사실을 보존한다.
4. 기존 233개 보호·소스·kernel·명령·종료·artifact 검사를 그대로 유지한다.
5. 실제 성공 ZIP에 대한 교정 결과와, 이름만 남거나 매개변수/명제/타입 출력이 누락된 입력을 거부하는 좁은 파서 검증을 구분해서 기록한다. 테스트용으로 바꾼 입력을 실제 artifact로 표시하지 않는다.
6. 독립 검토도 실제 ZIP·API 관측·원문 입력을 직접 읽게 한다. primary 코드 또는 controller를 import하여 결과를 복제하지 않는다.
7. 실제 원본 ZIP, API 관측, 원문, 공식 kernel, 실행 controller, guard 소스는 변경하지 않는다. 새 Comparator나 전체 Lean 기본 빌드를 다시 실행할 필요는 현재 확인되지 않았다.

새 버전 파일명과 해시는 아직 정해지지 않았다. 이 인수인계의 내용은 **교정 계획**이며 실행된 수정으로 주장하지 않는다.

## 5. 실제 실행과 원문 보존에 대한 필수 정보

공식 원문 저장소: https://github.com/openai/NavierStokesAndEuler

| 대상 | 고정 값 |
|---|---|
| 원문 commit | `f9e8bc5b38b6e212696e8a30e3e91517af887bbd` |
| Lean | `leanprover/lean4:v4.34.0-rc2` |
| 공식 kernel SHA-256 | `cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5` |
| 공식 Lean archive SHA-256 | `3d011041203acacf300d343a39673f7d233743397993797c941346ae9e5df1a8` |
| Comparator commit | `19e111e2141cf333c7daff0f64c5f24acc91dd2e` |
| mathlib commit | `85e3a25e006c35636f0e53b0e9296caca2685bc0` |
| lean4export commit | `cacf989bd75f608700820f6afc595f32e7a99a4d` |
| 원래 설정 | `ComparatorChallenges/NavierStokes.json` |
| 설정 SHA-256 | `7610ecead7b390d80ff7f4229a3ff8f18d630e046f7ad1de4f92c7e8e76845b8` |
| 마지막 실제 관측 SHA-256 | `4f2edc3e751ed9c5ec4b261d26d57d58d1fc62ea45e32203d17eb4fe8781e309` |
| 실제 첫 terminal audit SHA-256 | `c1f5f3e62cb44a421722a89a5d310a4e42ddcb6e35a41a3be6477162bf1fc991` |
| actual-run-binding SHA-256 | `5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab` |
| 과거 TRUST manifest SHA-256 | `48341732c4eac4a991ed5b65b786beedc9f1d7098a97698ce99c89dead22a273` |

보호 명령의 보안 옵션은 다음과 같다. 고유 unit 이름만 전송·종료 관측을 위해 추가했다.

```text
systemd-run --user --pty --wait --collect
  --property=RestrictAddressFamilies=~AF_UNIX
  -E PATH=... --working-directory=...
  --unit=mathscope-protected-...service -- <original command>
```

원래 Landlock 옵션, 비특권 UID/EUID 1002, capability 0, 보호 probe에서 NoNewPrivs 1, AF_UNIX 차단, 실제 쓰기 대조군 및 Landlock 거부가 기록되어 있다. Comparator 전에는 원문 프로젝트의 미리 빌드한 olean이 없었다. 신뢰된 mathlib cache는 원래 정책에 따른다.

과거 TRUST manifest는 과거 controller commit을 가리킨다. 새 실제 run은 별도 `actual-run-binding.json`으로 commit 55dacb 및 여덟 runtime source를 묶는다. 서로 다른 두 시점의 commit을 같게 만들기 위해 과거 manifest를 고치지 않는다.

## 6. 저장소·폴더·복원 경로

저장소: https://github.com/leegahuyn/MathScopeCompute

이 문서에서 아래 상대 경로의 기준은 저장소의 **`research-ide/`** 폴더다.

| 약칭 | 상대 경로 |
|---|---|
| T | `mathscope-m1/navier/followup-20261010-comparator-transport` |
| F | `mathscope-m1/navier/followup-20261010-final-stress-audit` |
| N1 | `mathscope-m1/navier/followup-20261010-n1-final` |
| A | `mathscope-m1/navier/followup-20261010-same-datum-axis` |
| S | `mathscope-m1/navier/followup-20261010-symbolic-gluing` |

작업하던 로컬 저장소: `/workspace/scratch/9a6c38c54c2e/MathScopeCompute`.

이전 원문 runtime: `/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/official-validation/repo`.

새 채팅에서 이 로컬 경로가 없을 수 있다. 재개를 위해 아래 Git 체크포인트의 저장소 상대 경로를 우선 사용한다. 보존 JSON 안의 과거 절대 경로는 당시 실행 위치로 남겨 두고, `source-mapping.json`의 복사 경로로 연결한다.

- 실제 생산 실행 당시 main: `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`.
- 첫 재연결 체크포인트 브랜치: `evidence-checkpoint-20261010-terminal`.
- 첫 체크포인트 commit: `462481427488283abf35fb0588d57cd97303e702`.
- 첫 체크포인트 tree: `5c135db36562b6c301f1a6dfba15c8ca40f256d0`.
- 이번 실제 결과를 추가할 재개 브랜치: **`handoff-20261010-comparator-success`**. 최종 PDF의 저장 확인 부분과 원격 HEAD를 확인한다.
- 오래된 `handoff-resume-20261010` 원격 브랜치는 진단 workflow trigger와 연결되어 있으므로 재개 자료 배포용으로 갱신하지 않는다.

다른 환경에서의 복원 예:

```bash
git clone --branch handoff-20261010-comparator-success \
  https://github.com/leegahuyn/MathScopeCompute.git MathScopeCompute-resume
cd MathScopeCompute-resume/research-ide
python3 tools/verify_english_release.py
```

Git의 새 체크포인트 commit과 실제 검증을 실행한 commit 55dacb를 혼동하지 않는다. 새 문서·증거 commit이 원래 Comparator 실행의 생산 commit으로 바뀌는 것은 아니다.

### 실제 결과 파일

아래는 이번 체크포인트의 `T/terminal-run-0001/` 아래에 원본 바이트로 보존할 파일들이다.

- `raw/protected-run-0001/observation-034.json` — 최종 실제 API 관측.
- `raw/protected-run-0001/final-artifact-0001/original-comparator-terminal-38014602021-1.zip` — 원본 ZIP.
- `raw/protected-run-0001/final-artifact-0001/extracted/result.json` — 실제 controller PASS/0 및 35단계.
- `raw/protected-run-0001/final-artifact-0001/extracted/protected-comparator.log` — 실제 전부 로그; CR/ANSI와 진행 표시를 정규화하지 않는다.
- `raw/protected-run-0001/final-artifact-0001/extracted/submitted-type-and-axiom-audit.log` — 문제의 실제 출력.
- `raw/terminal-actual-audit-0001/comparator-terminal-audit.json` — 첫 233/234 실패 결과.
- `raw/terminal-actual-audit-0001/invocation-receipt.json` — 실제 감사 명령·종료 코드·소스 SHA.
- `raw/independent-terminal-actual-0001/` — 독립 실제 검토가 생성한 파일; 포함된 실행 receipt와 원래 판정을 읽는다.
- `source-mapping.json`, `preservation-receipt.json` — 복사 경로, 원본/사본 해시와 크기 대조. 여기의 PASS는 보존 검증이며 N1-06 완료가 아니다.

## 7. 이미 완료된 N1-05: 다시 빌드부터 시작하지 않기

원문 전체 기본 빌드는 **2026-10-10 05:59:06.787843 KST** / `2026-10-09T20:59:06.787843+00:00`에 종료 코드 0으로 끝났다. 실제 build는 11,424 jobs를 완료했다.

원본 artifact ID `11644582983`, 크기 282,640 bytes, SHA-256 `79d9b7eade3bd569a62b0a344eb0a1fd4fa37e07f6b4c10121565bd185ccf5d6`.

당시 GitHub wrapper의 최종 failure는 Git 상태 stdout과 stderr의 권한 경고를 합쳐 해석하던 기록 문제였다. 그 workflow failure 자체는 바꾸지 않았다. 실제 cache/build subcommands의 exit 0 및 소스·환경을 별도 감사하여 N1-05를 충족시켰다. 이후 controller는 두 스트림을 분리했고 이번 생산 실행은 wrapper 예외 없이 controller 자체가 PASS/0이다.

기존 N1 README와 portable/runtime/artifact audit를 사용한다. 이 과거 wrapper 예외를 이번 terminal 감사의 완료 조건으로 다시 허용하지 않는다.

## 8. 같은 최종 프로파일의 근거와 수학적 범위

마지막 동결 판정:

`F/ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10_3.json`

SHA-256 `e57681b7bb751967b406ad440942728ecfd8fe47eb9672129ff19c8a7eb6634c`.

공통 매개변수 표현 SHA-256:

`e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`.

공통 프로파일 근거 SHA-256:

`ff3b1590aa49499417910962736fe2deb8e6088acd7d77e281fd8aba6807c206`.

| 완료 연결 | 보존된 실제 검토 |
|---|---|
| 63개 정확 매개변수 및 137개 근거 입력 조립 | assembly 292/292, 독립 검토 295/295 |
| 실제 공식 rc2 형식화 실행 | 새 13-module prefix + 새 extension 1개 = 14 modules |
| 실제 선언 공리 확인 | 110개 printed declaration audit, 표준 세 공리 |
| 유한 125-entry 배열·무한 해·꼬리·반올림 연결 | consumer 812/812 |
| 실제 import 해소 검토 | 343/343 |
| 최종 형식화 연결 검토 | 883/883 |
| Theorem 4.6 (i)–(vi) 같은 프로파일 근거 지도 | 428/428, 실제 실행과 별도의 source/scope mapping review |

이 수들은 각각 증거·프로그램·산술·경로 검사의 수다. 전체 수학 정리 개수나 전체 프로파일의 Lean 형식화 비율이 아니다.

주요 실제 수학 연결:

- 상수는 정확한 표현으로 고정했다. `T=exp(2^20)+10`, `P=exp(2T)`, `lambda=exp(-1000T)`, `h=exp(-8002T)`, `j=h^4`. 거대한 유한 N을 기계 정수로 전개했다고 말하지 않는다.
- 같은 무한 축 프로파일의 불변구·수축 상계는 1/2 이하이며 원래 `f0(4.1)=0.2711140554036643841...` fixture와 실제 `Phi>1/4` 연결을 확인했다.
- 실제 유한 다항식의 오차는 명시한 `0<=Y<=4.1`, `|eta|<=rho/4` chart에서 `2^-118`보다 작다. 이 작은 chart 계산을 모든 eta의 비선형 수치 그래프라고 표시하지 않는다.
- 원문 eta 구간 `[-1,1]` 전체의 무한 family는 해석적 균일 경계와 연속 적분으로 연결한다.
- 압력의 실제 384-bit, 1,792-cell 포위와 A.21 동일 datum을 묶었다. pressure width는 `2^-279` 미만이다.
- 모멘트 접합은 실제 연속 적분의 C2 debt, 모든 이차항, `lambda^-2` 행, 균일 포함·수축 및 B8 보정으로 닫았다.
- modulation 뒤 동일한 유한 N과 `kappa=R^-10`, 전체 닫힌 annulus 및 I1 복원을 연결한다.
- 최종 stress는 내부에서 `min(C^-11,R^-8)*zeta` 이상의 양의 하한을 갖고, 외부에서는 0이며, 정확 flat factorization을 통해 정규화 방향의 끝점 극한을 확인했다.

정확한 식, 가정, proof/interval/Lean 경계와 입력 해시는 동결 JSON 및 다음 파일을 읽는다.

- `docs/SAME_PROFILE_2026_10_10_3_EN.md`
- `F/FINAL_FORMAL_CONNECTION_REVIEW_2026_10_10_EN.md`
- `T/scope-and-terminal-review-0001/raw/theorem46-scope-review/THEOREM46_SCOPE_REVIEW.md`
- `T/scope-and-terminal-review-0001/raw/theorem46-scope-review/theorem46-clause-map.json`
- `T/scope-and-terminal-review-0001/raw/theorem46-scope-review/reviewer-receipt-0001.json`

Theorem 4.6 절별 map SHA `af7021b5765feabf3d90ccc6ef77bc599b3215899755164e620421afd93dc583`, memo SHA `4765a8379badf62453a25621e3288ade1652fd309f0110f5c0bb0534e1d8febe`, review SHA `e9d1164573ec501e4ad5fd7cb8b21a4ef7eb0086b4dcd3c609e35194766b3c1b`.

향후 새 평가에서 `fullOriginalTheorem46CertificationFlag=true`를 쓸 경우 의미는 정확히 `ORIGINAL_THEOREM_4_6_LEADING_PROFILE_ACCEPTANCE_SCOPE`다. `entireNewProfileLeanFormalized=false`는 유지한다. 현재 동결 69/1 평가의 플래그를 고쳐 쓰지 않는다.

## 9. 실패·진단 이력은 그대로 유지

### 이전 보호 실행

run `37979127351`, job `113984853927`은 실제 `completed/cancelled`였다. artifact `11654200401`, 135,397 bytes, SHA `1af31713f8f021605af509bab4634fed7ab041636f6f1670be2bd3e3c61788d2`.

29개 준비 단계가 성공했고 원래 guard preflight에서 기다리는 상태로 남았다. 실제 probe 완료 JSON과 Comparator/nanoda 결과가 없었다. 취소 원인을 기록이 뒷받침하지 않으므로 timeout/OOM/증명 계산량으로 단정하지 않는다. 과거 audit 138/163 및 N106 false를 유지한다.

### 실제 진단

run `38013278865`, job `114097893399`, artifact `11655127117`은 transport 진단용이었다. PIPE에서는 이미 종료된 service 뒤 클라이언트/TTY 관측이 타임아웃났지만, outer PTY에서는 원래 AF_UNIX 및 Landlock probe가 실제 exit 0과 EOF를 냈다. 이것은 원래 보안 조건을 제거한 우회가 아니라, 원래 옵션을 유지하는 터미널 전송·종료 관측 수정의 근거다.

진단 ZIP SHA `b99bc876ebfdb71cd641247bca1b6cad38c757d9431ba81f7c70ca28a122f2ba`, 44,015 bytes. 실제 진단 검토 136/136 및 독립 135/135는 N1-06 완료 판정이 아니다.

### 이번 생산 실행

별도 main 전용 workflow `.github/workflows/ns-comparator-verification.yml`과 `tools/ns-guard-ci/run_protected.py`, `protected_transport.py`로 실행했다. 원래 controller SHA `47b0126a22ada5c2254377a458daac076948526f5e8eaa13b5c4e47f933bc220`와 보안 옵션·원문을 유지했다. 생산 전송 코드에 대한 실제 12개 테스트와 독립 73/73 소스 검토도 보존되어 있다.

이번 실제 성공 artifact와 이후 감사기의 233/234 파서 실패를 위 두 이력으로 대체하지 않는다.

## 10. 최종 판정 작성 도구의 상태

준비된 도구:

`T/write_terminal_gate_assessment.py`

SHA `d471135f614fb3ec9d18020c7744433eb4646ad7793ba720a7f127fe9eceb314`.

이 도구는 frozen primary auditor SHA 81c799...를 요구한다. 따라서 다음 채팅에서 새 감사기 버전이 생기면 **도구도 별도 버전으로 복사하여 허용하는 검토 소스·해시를 명시적으로 갱신하고 그 변경을 독립 검토해야 한다**. hash 검사를 삭제하거나 과거 도구의 해시를 맞추기 위해 파일을 바꾸면 안 된다.

이 도구는 실제 PASS audit, 실제 완료 API 관측, 원본 ZIP, 독립 actual review, 고정된 scope map/review/memo를 요구한다. 이전 여덟 PASS 항목은 깊은 동등성으로 유지하고 N1-06만 새 근거로 바꾸며, 과거 47개 참조와 같은 프로파일의 64개 참조도 검증한다. 그 뒤 새 날짜 판정 JSON과 KO Markdown을 만든다.

준비 검토 5/5는 실제 취소 입력의 거부를 확인한 것이다. 소스 독립 검토 468/468은 source review이고 실제 새 완료 판정은 아직 한 번도 생성하지 않았다.

예상 명령의 형태는 다음과 같으며 **새 감사기와 새 writer의 검토가 먼저**다.

```bash
python3 -B <new-reviewed-terminal-auditor.py> \
  --zip <preserved-original-terminal.zip> \
  --artifact-id 11657065866 \
  --observation <preserved-observation-034.json> \
  --extracted <preserved-extracted-directory> \
  --output <new-actual-audit.json>

python3 -B <new-reviewed-independent-checker.py> \
  --archive <preserved-original-terminal.zip> \
  --artifact-id 11657065866 \
  --observation <preserved-observation-034.json> \
  --original-inputs mathscope-m1/navier/followup-20261010-n1-final/comparator-auditor-inputs \
  --production-inputs mathscope-m1/navier/followup-20261010-comparator-transport/terminal-auditor-inputs \
  --primary-audit <new-actual-audit.json> \
  --output <new-independent-review.json>
```

위 명령의 꺾쇠 부분은 **아직 만들지 않은 새 파일을 뜻하는 자리표시자**다. 기존 파일을 덮어쓰지 않는다.

## 11. 영어 전체 패키지와 공개 릴리스

현재 공개된 마지막 전체 릴리스는 **`.3`**다.

https://github.com/leegahuyn/MathScopeCompute/releases/tag/mathscope-research-en-2026.10.10.3

다운로드:

https://github.com/leegahuyn/MathScopeCompute/releases/download/mathscope-research-en-2026.10.10.3/MathScope_M0_M1_English_Full.zip

| 항목 | 실제 값 |
|---|---|
| `.3` commit | `c61d35806bb3579131eb7ff8c55187ae26209ade` |
| release ID / asset ID | `408456908` / `626581803` |
| 공개 ZIP bytes | 114,184,222 |
| 공개 ZIP SHA-256 | `94bb85e441a322cd57102b5fc2bfb159d53f82b37c35de119f79a97d9f4447c8` |
| 포함 원본 | 935개 모두 |
| 당시 후속 addons | 1,528개 |
| 실제 공개 검증 | 3개 같은 commit의 CI 성공, 공개 다운로드와 로컬 ZIP 바이트 동일 |

`.3`의 `CURRENT_STATUS_EN.md`는 그 시점 69/1 기록이다. Git 체크포인트의 새 raw 결과를 추가했다고 `.3` 배포 ZIP이 자동으로 갱신되지는 않는다.

최종 실제 감사 PASS 뒤에만 새 `.4` 판정 및 영어 문서를 작성하고 `RELEASE.json`을 갱신한다. 모든 새로운 근거를 먼저 동결한 다음 다음 순서로 수행한다.

```bash
python3 tools/verify_english_release.py --write-manifest
python3 tools/verify_english_release.py
node --test tools/mathscope-en.test.mjs
python3 tools/package_english_release.py \
  --archive-members ./archive-members \
  --output ./dist/MathScope_M0_M1_English_Full.zip
python3 tools/prepare_github_release.py
```

기존 `.3` dist 파일이 있으면 먼저 과거 버전으로 보존하고 새로운 경로를 쓴다. 기존 공개 release asset을 덮어쓰지 않는다. 최종 main의 `RELEASE.json` 변경이 기존 release workflow를 실행한다. 그때 **실제 세 CI 완료, 실제 새 release API, 실제 공개 ZIP 다운로드의 SHA와 모든 member**까지 확인한다. CI를 시작한 상태를 완료로 끝내지 않는다.

`provenance/addon-archive-allowlist.json`은 ZIP을 무조건 포함하지 않고 정확한 경로·크기·SHA가 고정된 실제 CI 원본 ZIP만 허용한다. 원래 두 과거/진단 ZIP과 이번 생산 ZIP이 최종 full package에 모두 실제로 들어가는지 검사한다. 패키지의 CRC/hash PASS는 수학 또는 N1-06 PASS와 구분한다.

## 12. 한국어 PDF와 재개할 보고서 작업

기존 15쪽 후속 보고서의 정확한 SHA는 다음과 같다.

`cad9a136c0f4986f16f7f2347e5fc45441f230687e6f544a89e19354ea332888`

기존 파일명은 `MathScope_M0_M1_Followup_2026-10-10_KO.pdf`다. 첫 15쪽의 내용은 그때 69/1 기록으로 남긴다. 현재 인수인계에서는 실제 생산 성공과 파서 실패, 재개 지침을 후속 쪽으로 추가한다.

준비된 v3 부록 도구는 `tmp/final-handoff-addendum-20261010-v3/`에 있으며 preparation 218/218이었다. 실제 terminal auditor SHA 81c799...와 기존 실행 binding을 고정했다. 미래 새 감사기 버전을 사용하려면 PDF 입력 계약과 검증기도 별도 버전에서 명시적으로 갱신·검토해야 한다. 기존 v3와 기존 판정 JSON을 고쳐서 새 결과인 것처럼 만들지 않는다.

최종 완료 PDF는 새 실제 PASS 판정과 실제 `.4` 공개 결과가 확보된 뒤에 작성한다. 지금 제공하는 인수인계 PDF는 그 최종 완료 보고서가 아니다.

PDF QA에서는 모든 쪽을 렌더하고 기존 15쪽 보존, 한글 글꼴, 긴 해시·경로 줄바꿈, 표 넘침, 새로운 모든 쪽의 시각 검토를 확인한다. 완성 PDF를 저장하고 실제 열 수 있는 링크를 제공한다.

## 13. 다음 채팅의 실행 순서

1. 이 문서와 새 체크포인트를 읽고 원래 70개 기준·69/1 판정·실제 최종 ZIP의 해시를 확인한다.
2. 원래 두 제출 정리의 실제 전체 타입과 원문 선언을 대조하고, 두 감사기의 매개변수 출력 파서를 별도 버전에서 교정한다.
3. 새 parser의 좁은 실제/거부 검증과 독립 소스 검토를 기록한다. 실제 원문·보호 실행은 재작성하지 않는다.
4. **같은 실제 ZIP과 observation034**로 새 primary 및 독립 actual audit를 실행한다. 모두 통과하면 N1-06을 충족시킬 근거가 갖춰진다.
5. 새 writer 버전의 source/hash binding을 독립 검토하고, 변경되지 않은 나머지 여덟 항목과 원래 70개 기준에 대한 별도 **70/0/0** 판정을 생성한다.
6. 같은 프로파일의 Theorem 4.6 (i)–(vi) 지도와 명시된 scope 의미를 함께 보존한다. 전체 새 프로파일 Lean 형식화 완료를 추가로 주장하지 않는다.
7. 영어 `.4` 전체 패키지를 작성·검증·공개하고 실제 공개 다운로드와 같은 commit의 세 CI를 확인한다.
8. 한국어 최종 완료 PDF를 작성·렌더·검토·저장하고, 요청한 아홉 항목 전부의 실제 완료 결과와 파일 링크를 제공한다.

## 14. 새 채팅 첫 메시지

> 첨부한 MathScope M0–M1 인수인계 문서와 Blueprint를 읽고 하던 곳부터 계속 진행해 줘. 원래 70개 기준과 935개 원본 파일, 과거 61/7/2·68/2·69/1 기록을 유지해 줘. 실제 보호 Comparator run 38014602021 / job 114101981614은 성공했고 원본 ZIP도 확보했지만, 감사기가 정리 이름 다음의 `(nu : ℝ) (hnu : nu > 0)`를 처리하지 못해 현재 공식 판정은 69/1이야. 문서에 적힌 파서 문제를 별도 버전에서 교정·독립 검토하고, 같은 실제 ZIP으로 감사를 마친 다음 새 70/0 판정, 영어 전체 `.4` 릴리스, 한국어 최종 PDF까지 진행해 줘. GitHub 저장·릴리스는 이미 승인됐고 실제 사이트 배포는 하지 마. 성공한 긴 Comparator나 전체 기본 빌드부터 다시 시작하지 말고, 남은 정확한 지점부터 이어 줘.
