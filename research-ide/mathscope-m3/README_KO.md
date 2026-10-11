# MathScope M3 — P7 첫 실제 계산 릴리스

M2 최종 관문 커밋 [`90e977ba`](https://github.com/leegahuyn/MathScopeCompute/commit/90e977ba9225bfaa20fd3dcc97db7f794c5ed4c9) 뒤에 시작한 **M3 P7의 실제 Python 계산기**다. ζ·Γ·ξ의 복소 구간과 도함수, 높이 20·30의 유한 영점 인증, 두 타원곡선의 정확한 국소 산술을 구현하고 실행했다. 최종 선택한 예제 **9개**, 새 프로세스로 다시 계산한 replay **3개**가 성공했고, 관련 입력·출력·로그 **33개 파일**을 실행 당시 해시와 대조했다.

현재 상태는 **P7 진행 중**이다. 원래 8개 기준을 모두 완료하거나 M3 전체, RH, BSD를 증명했다고 표시하지 않는다. [P7_PROGRESS.json](P7_PROGRESS.json)에 원래 기준별 구현·미완 범위를, [P7_EXECUTED_RELEASE.json](P7_EXECUTED_RELEASE.json)에 실제 결과·정확한 끝점·실행 해시를 저장했다. M3 작업 순서는 **P7 → P8, Y5 → Y6 → Y7, N6 → N7 → N8**을 유지한다. P7의 원래 선행 조건은 P1·P4이고, P8의 원래 선행 조건 P1–P4도 바꾸지 않았다.

## 1. 이번에 실행한 기능

| CLI kind | 구현 범위 | 수학적 결과의 성공 조건 |
|---|---|---|
| `p7.special_function` | ζ, regularized ζ, Γ, 1/Γ, analytic log Γ, 정규화 ξ와 0–16차 도함수 | `status=finite`와 `toleranceMet=true`를 각각 확인 |
| `p7.zeta_zeros` | 정확한 높이 `20`, `30`; 전체 contour 영점 계수와 Hardy Z 부호 구간 | `status=FINITE_RH_TO_T`, 전체 경로·폭·총수 포화·교차검사 모두 성공 |
| `p7.elliptic_local` | 일반 5계수 Weierstrass의 정확 산술, good/multiplicative 국소 가지, 11a1·37a1의 전체 semistable 국소 자료·32개 계수 | 요청한 자료별 `certified`/`unsupported`와 rank 하계·상계를 구분 |

실행 상태 `COMPLETED`는 계산 프로세스가 결과 레코드를 반환했다는 뜻이다. 극점에 대한 `nonfinite`, 정밀도 부족으로 인한 `toleranceMet=false`, 영점 인증의 `UNRESOLVED`도 정상적인 결과 레코드일 수 있다. 따라서 프로세스 종료 코드만 보고 수학적 인증 성공으로 표시하면 안 된다.

코드는 [cli.py](cli.py), [ball_backend.py](p7/ball_backend.py), [zero_certificate.py](p7/zero_certificate.py), [elliptic_local.py](p7/elliptic_local.py)에 있다. 세 계산 영역의 식·가정·범위는 각각 [BALL_BACKEND_KO.md](p7/BALL_BACKEND_KO.md), [ZERO_CERTIFICATE_KO.md](p7/ZERO_CERTIFICATE_KO.md), [ELLIPTIC_LOCAL_KO.md](p7/ELLIPTIC_LOCAL_KO.md)에 설명했다.

## 2. 실제 수치 결과

아래 십진수는 읽기 위한 midpoint 표시다. 인증된 데이터는 원문 JSON의 **정확한 dyadic 또는 유리수 하한·상한**이다. 작업 정밀도는 192 bits이며, 특수함수 예제의 요청은 실수부·허수부 각각의 전체 폭 `≤1e-40`이다.

| 계산 | 표시값 | 실제 성분 전체 폭의 요약 |
|---|---|---|
| ζ(2) | 1.644934066848226436472415166646… | 실수부 약 1.2745×10^-57, 허수부 정확한 0 |
| Γ(1/2) | 1.772453850905516027298167483341… | 실수부 약 1.2745×10^-57, 허수부 정확한 0 |
| ζ(1/2+14i) | 0.0222411426099935892462 − 0.1032581232664500579024i | 각 성분 폭 < 8×10^-59 |
| ζ′(1/2+14i) | 0.7482336961200862625292 + 0.2044365337849974194717i | 각 성분 폭 < 6.4×10^-58 |
| ζ″(1/2+14i) | −0.5683673666975583034126 − 0.2894841143397962494713i | 각 성분 폭 < 9.6×10^-58 |
| ξ(1) | 0.5 | 정확한 값 1/2를 포함하는 구간, 폭 < 9.6×10^-58 |
| ξ(1/2+14i) | 0.000201294444235257509489968437… | 각 성분 폭 < 7×10^-60, 허수부 구간은 0을 포함 |

ξ는 `s(s−1)π^(−s/2)Γ(s/2)ζ(s)/2` 정규화를 사용한다. 실제 계산은 deflated ζ와 Γ 재귀식, 필요한 경우 `ξ(s)=ξ(1−s)`를 사용하여 removable singularity에서 `0×∞`를 만들지 않는다. 도함수는 급수 계수에 정확한 `k!`를 곱하며, 반사한 홀수 차 도함수의 부호도 유지한다. [실제 2차 jet 기록](evidence/p7-release-20261011/attempt3/zeta-critical-jet.json)과 [그 새 실행 replay](evidence/p7-release-20261011/attempt3/zeta-critical-jet-replay.json)에 전체 끝점을 보존했다.

### 유한 영점 인증

| 높이 T | 양의 높이 영점 수 N(T) | contour 감김수 W | 인증한 전체 tube 수 | 각 Hardy 영점 bracket의 정확한 폭 |
|---|---:|---:|---:|---|
| 20 | 1 | 1 | 657 | 2^-102 ≈ 1.97215×10^-31 |
| 30 | 3 | 5 | 1,113 | 2^-102 ≈ 1.97215×10^-31 |

세 양의 영점의 높이는 다음 구간에 들어간다. 표시값의 마지막 자리를 인증된 끝점으로 해석하지 않는다.

- 14.134725141734693790457251983562…
- 21.022039638771554992628479593897…
- 25.010857580145688763213790992563…

사각형 `Re(s)∈[-1,2], Im(s)∈[-T,T]`의 모든 선분을 양의 두께를 가진 tube로 덮고 `Re(ζ(tube)/ζ(start))>0`을 실제로 확인한다. 이 조건으로 연속 argument branch를 정한 뒤 증가량을 더한다. argument principle의 `W=영점 수−극점 수`에 극점 하나를 보정한다. 별도로 Hardy Z의 실제 양끝 부호가 반대인 서로 겹치지 않는 구간을 좁힌다. 양·음 높이 구간이 총수 `W+1`을 모두 채우므로, 이 유한 높이의 영점은 모두 임계선에 있고 각 구간에서 단순하다.

FLINT의 관련 zero-list/count 함수도 비교했다. 새 contour 계산은 다른 **계수 알고리즘**이지만, FLINT의 구간 산술과 ζ 평가기를 공유한다. 이를 독립 소프트웨어 두 개의 일치나 새 Lean kernel 증명으로 표시하지 않는다. 임의 높이 T를 받는 일반 계산기와 전역 RH 증명도 현재 범위에 포함되지 않는다. [T=20 원문](evidence/p7-release-20261011/attempt3/zeros-to-20.json), [T=30 원문](evidence/p7-release-20261011/attempt3/zeros-to-30.json), [T=30 실제 replay](evidence/p7-release-20261011/attempt3/zeros-to-30-replay.json)를 확인할 수 있다.

### 타원곡선의 정확 산술

| 항목 | 11a1 | 37a1 |
|---|---|---|
| 일반 Weierstrass 계수 | [0,−1,1,−10,−20] | [0,0,1,−1,0] |
| 판별식 Δ | −161051 = −11^5 | 37 |
| 도체 | 11 | 37 |
| 전역 근수 | +1 | −1 |
| 나쁜 소수의 reduction | p=11, split I5 | p=37, nonsplit I1 |
| 해당 Tamagawa 수 | 5 | 1 |
| 확인한 유리 꼬임군 | Z/5Z | 자명군 |
| 산술 rank의 이번 하계 | 0 | 1 |
| 산술 rank 상계 | 미계산 | 미계산 |

이 값은 이름으로 결과 표를 조회한 것이 아니라 입력 계수에서 정확한 유리수·유한체 계산으로 얻었다. 11a1의 `(5,5)`는 차수 5이고, 37a1의 `(0,0)`은 good reduction에서 얻은 꼬임 제약과 실제 점의 배수 계산으로 비꼬임임을 확인했다. **37a1의 rank 하계 1은 rank가 정확히 1이라는 이번 증명과 다르다.** 높이·regulator·descent/Selmer 상계·saturation·Sha는 열린 상태다.

각 곡선의 첫 32개 `a_n`을 good-prime 점 개수, 인증한 multiplicative bad factor, 소수 거듭제곱 재귀와 서로소 곱셈성으로 계산했다. 완전한 bad factor가 없으면 완전한 L 계수를 반환하지 않는다. `L^S` 모드는 제외 소수를 명시한다. 현재는 elliptic L의 임계대역 해석적 값이나 analytic rank를 계산하지 않는다. [11a1 기록](evidence/p7-release-20261011/attempt3/elliptic-11a1.json), [37a1 기록](evidence/p7-release-20261011/attempt3/elliptic-37a1.json)에 점·국소 자료·계수를 보존했다.

## 3. 설치와 사용

이 릴리스의 검증 환경은 **CPython 3.12.14, Linux x86_64, python-flint 0.9.0 / FLINT 3.6.0**이다. 해당 Linux wheel의 SHA-256은 `376b88cacd30612479e839ffdba887599d3f9c8c0e214852bf80bb2b194e4d76`이며 공식 배포값과 다운로드 파일을 대조했다. [설치 기록](evidence/p7-backend-20261011/backend-install-attempt1.json)에 실제 설치·특수값 검사와 파일 해시가 있다.

다음 명령은 `research-ide/mathscope-m3`에서 실행한다. 다른 운영체제용 wheel 해시를 이 Linux lock으로 대신하지 않는다.

```sh
python3 -m venv .venv
.venv/bin/python -m pip install --only-binary=:all: --require-hashes --no-deps -r requirements-linux.lock

.venv/bin/python cli.py run examples/zeta-critical-jet.json --output runs/zeta-jet.json
.venv/bin/python cli.py replay runs/zeta-jet.json --output runs/zeta-jet-replay.json
.venv/bin/python cli.py run examples/zeros-to-30.json --output runs/zeros-to-30.json
.venv/bin/python cli.py run examples/elliptic-37a1.json --output runs/elliptic-37a1.json
```

좌표·tolerance는 `"1/2"`, `"14"`, `"1e-40"`처럼 정확한 문자열을 사용한다. JSON 숫자 `0.5`를 복소 좌표로 넣거나 중복 키·NaN을 넣으면 거절한다. 예제 입력은 [examples](examples/)에 있다. 같은 출력 파일을 덮어쓰지 않으므로 새 실행에는 새 파일명을 쓴다. 기본 자원 예산은 각 계산 child의 wall time 90초·주소 공간 1536 MiB이며, CLI의 허용 범위 안에서 변경할 수 있다. 영점 모듈은 별도의 cell·depth·평가 횟수·시간 예산을 가진다.

새로 실행한 기록에는 입력·수학 결과·소스 파일·backend binary의 해시, 실제 child의 자원 제한, 종료 코드와 시간을 저장한다. 실제 로드된 FLINT의 경로가 fingerprint 대상 배포물과 같은지 부모·child에서 확인한다. replay는 같은 소스·환경·M2 선행 기록을 확인한 뒤 **실제 새 프로세스로 다시 계산**한다. 다른 Python·backend 환경에서는 원래 입력으로 새 run을 만들며, 이전 환경의 replay를 일치했다고 쓰지 않는다. 가져온 파일의 `formalLeanProofIssued` 또는 전체 완료 주장을 채택하지 않는다.

## 4. 검사와 저장 무결성

| 검사 | 실제 결과 | 주된 위험 |
|---|---:|---|
| 특수함수 backend | 16/16 PASS | 정확한 입력, 극점·분기, k!, ξ 반사, 실제 구간 폭, 변조 replay |
| 유한 영점 인증 | 12/12 PASS | 전체 tube, pole/zero 교차, 부호·총수 포화, 낮은 정밀도·예산 부족 |
| 정확한 타원곡선 산술 | 24/24 PASS | 전수 점 개수 비교, 일반 군법, 최소성·작은 특성의 split, bad factor 거부 |
| CLI와 replay 경계 | 13/13 PASS | 실제 child·동일 환경, 재해시한 잘못된 값, 위조 완료 필드, shadow package, 파일 덮어쓰기 |
| 최종 예제 | 9/9 성공 | 요청한 실제 수학 결과와 tolerance를 별도로 검사 |
| 최종 fresh replay | 3/3 MATCH | 특수함수 jet·T=30 영점·37a1를 각 새 프로세스에서 재계산 |

이 검사 수는 Blueprint의 원래 64개 요구사항 PASS 수가 아니다. 첫 ball 테스트의 Euler 상수 API 오타와 첫 zero 테스트의 Arb fixture 구문 오류는 최종 성공과 구분했다. ball의 최초 raw stdout은 보존되지 않았다는 한계도 기록했다. Elliptic 첫 검사는 23/23 성공이었고 자원 경계 보강 후 24/24를 통과했다. 모든 음성 대조를 실제 생산 계산의 자원 고갈로 표시하지 않는다. CLI의 MemoryError·SIGXCPU 분류 검사는 명시적인 fault injection이다.

최초 두 통합 실행은 계산·replay를 마쳤으나, 저장 후 읽기에서 각각 `zeros-to-30.json.gz`가 당시 해시와 달라졌다. 원인은 확인하지 못했다. 당시 실행 영수증과 바뀐 파일을 보존하고 최종 제공 대상에서 제외했다. **최종 제공 대상은 `attempt3`의 JSON 원문**이다. [1차 사후 검사](evidence/p7-release-20261011/attempt1/post-execution-integrity-observation.json), [2차 사후 검사](evidence/p7-release-20261011/attempt2/post-execution-integrity-observation.json)를 남겼다. 2차 관측의 `gzipValid=true`는 Python `gzip.decompress(b"")`가 예외 없이 빈 바이트를 반환했다는 진단값이며, 유효한 JSON 기록을 뜻하지 않는다. 그 관측 자체도 0 bytes·해시 불일치·최종 릴리스 제외를 명시한다.

최종 선택 기록의 해시·replay 관계·소스/환경 일치 확인은 [build_release_summary.py](tests/build_release_summary.py)가 수행했다. 큰 기록에서 요약 표만 남기지 않고 전체 tube와 부호 구간을 유지한다. 독립 읽기 검토는 [ball 검토](evidence/p7-ball-backend-20261011/INDEPENDENT_BALL_BACKEND_REVIEW_KO_SENSITIVITY.md), [replay 메타데이터 보강](evidence/p7-ball-backend-20261011/INDEPENDENT_BALL_REPLAY_METADATA_ADDENDUM_SENSITIVITY.md), [영점 검토](evidence/p7-zero-certificate-20261011/INDEPENDENT_FINITE_ZERO_NS_REVIEW_KO.md), [타원곡선 검토](evidence/p7-elliptic-local-20261011/INDEPENDENT_ELLIPTIC_LOCAL_NS_REVIEW_KO.md)에 있다. 이전 ball 소스의 해시를 인용하는 과거 검토는 당시 snapshot으로 검증하며, 새 코드의 해시로 덮어쓰지 않았다.

## 5. 원래 P7에서 남은 작업과 M2 연결

P7의 후속 작업은 일반 최소모형·Tate 가지, elliptic L의 certified analytic continuation, 별도의 반올림·급수·꼬리 오차 계약, 비영 변위 Taylor 잔여항, 유한 오차가 있는 explicit formula, operator/determinant 가정, analytic rank, descent/Selmer 상계·높이·regulator·saturation·Sha 자료다. FLINT가 반환하는 총 구간은 사용하지만, Python API에서 따로 나오지 않는 내부 rounding/truncation bound를 0으로 채우지 않는다.

M2 최종 선행 조건은 [M3_ENTRY.json](M3_ENTRY.json)에 커밋·gate 파일 해시로 고정했다. M2의 원래 방사 위상 보정, 전체 curl·전역 공분산·background/flat-force 연결과 실제 수치 결과는 [M2 최종 설명](../mathscope-m2/navier/research/M2_COMPLETION_GATE_KO.md)에 있다. M2의 전체 uncorrected 물리 잔차를 0 또는 flat으로 확대하거나, 기존 algebra kernel 검증을 새 해석학 전체 Lean instance로 확대하지 않는다.

M2 공개 화면은 [기존 연구 화면](https://project29770.websitepublisher.ai/v0.3.1.html#research-m2/ns)에서 유지된다. 이번 M3 기능의 실행 경로는 위 CLI다. M3 Python backend를 브라우저에서 실행하거나 새 P7 공개 화면을 배포했다고 기록하지 않았다. M2의 공개 브라우저 native 파일 가져오기/replay는 자동화 연결 중단 때문에 미확인으로 남아 있으며, 공개 실행·저장·export 확인과 구분한 [도구 한계 기록](../mathscope-m2/navier/research/evidence/m2-final-completion-20261011/browser-tool-limitation.json)을 보존한다.
