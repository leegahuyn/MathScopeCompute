# MathScope v0.3.1 Stage 8 사용·검증 안내

이 문서는 개발판의 실제 조작 순서와 결과를 해석하는 범위를 설명한다. **릴리스 상태는 HOLD**이며, 이 문서를 추가하거나 개별 테스트가 통과했다고 최종 동결되는 것은 아니다. 배포된 화면의 버전, Git commit, 수치·증명 환경 및 검증 시각을 결과와 함께 기록한다. 전체 승인 기준은 [릴리스 요구사항 표](STAGE8_RELEASE_REQUIREMENTS.md)를 따른다.

- 개발판: <https://project29770.websitepublisher.ai/v0.3.1.html>
- 계산 서비스: <https://mathscope-compute.onrender.com>
- 안정판 `index.html` v0.2.1은 별도이며 이 작업의 수정 대상이 아니다.

## 시작과 세션 보존

1. 개발판에서 Stage 1을 열고 현재 ResearchSession의 ID와 revision을 기록한다. `Save session`으로 저장하고 `Export v0.3.1 JSON`으로 보관할 수 있다.
2. Stage 8의 `Export .mathscope`는 세션, typed 객체, 환경과 재현 기록을 함께 담는 ZIP이다. JSON 내보내기와 용도가 다르다.
3. `Import verified .mathscope`에서 파일을 선택하면 먼저 구조와 CRC/SHA가 검사된다. 가져오기를 승인하면 별도의 세션 ID가 생기고 원본 증거는 과거 기록으로 보존된다.
4. `STALE`, `REPLAY REQUIRED`, `UNKNOWN`, `DEPENDENCY MISSING`은 성공의 다른 표현이 아니다. 입력 변경 또는 가져오기 이후에는 재계산·재검증 결과를 확인한다.

SHA가 맞는 파일이라는 사실은 작성자의 진위나 수학적 정확성을 증명하지 않는다. 세션 ID, revision, source hash와 환경을 각각 확인해야 한다.

## 한 세션에서 Golden A → B → C → D 실행

Stage 8에서 `Run Golden A → B → C → D`를 사용한다. 이 버튼은 별도 모듈의 예제들을 나란히 실행하는 검사가 아니다. 하나의 비선형 타원 PDE와 후보해를 바탕으로 공유 ID, revision, 입력 및 증거 연결을 생성·검사한다. 서버가 깨어나는 동안 요청이 오래 걸릴 수 있으며 화면의 실행 상태를 기다린다.

검사하는 일반 형식은 `F(u) = -Δ_g u + λu - u³ = 0`, `L = DF(u*)`이다. 현재 fixture의 구체적 manifold, domain, 경계, λ, 후보, 격자 및 허용 오차는 실행 결과에 기록된 값을 따른다. 예시의 이산 수치 결과를 임의의 manifold에 대한 정리로 일반화하지 않는다.

| 단계 | 반드시 함께 읽을 항목 |
|---|---|
| A | PDE·domain·경계·λ·후보해, residual, 선형화, 유한 격자·스펙트럼, 가정과 오차 |
| B | 원본 field와 3D representation, projection map, 소실 정보, singularity 후보, topology/fidelity의 구분 |
| C | 정확한 hypothesis 범위, stress 결과·반례, 의존 revision, 증명 대상과 formal coverage |
| D | 주기호·ξ≠0, ellipticity 판정 방식, K-class 대표, Fredholm/index, 경계와 적용 한계 |

결과의 모든 연결이 같은 실행에 속하는지 확인한다. ID만 같고 revision 또는 hash가 다른 출력은 동일한 Golden 실행의 증거로 취급하지 않는다. 실행 중 기존 세션을 변경하거나 가져온 경우에는 오래된 응답을 새 세션에 붙여 넣어서는 안 된다.

`Cancel Golden request`는 브라우저의 대기를 취소한다. 이미 시작된 서버 계산을 중단했다는 보장은 없다. 취소한 응답은 현재 증거로 확정하지 않는다.

## 내보내기 → 가져오기 → 재실행

1. 성공한 Golden 실행의 세션 ID, revision, job ID, 입력·출력 hash, adapter 및 환경을 기록한다.
2. `Export .mathscope`로 파일을 내려받는다. 파일명, 크기와 ZIP 내 manifest를 보존한다.
3. `Import verified .mathscope`로 같은 파일을 올린다. 새 session ID와 원본 session/revision의 출처를 확인한다.
4. `Replay imported numerical job`을 실행한다. 이 단계는 ZIP 내용 조회가 아니라 저장된 실행 입력을 새로 계산하는 검사다.
5. 재실행 결과의 입력과 환경, 허용된 비교 기준, 출력 hash/수치, 새 revision 및 evidence의 연결을 확인한다.
6. 수치 replay 성공은 과거 `FORMAL PASS` 증거를 자동으로 현재 증거로 바꾸지 않는다. 형식 증명은 해당 원본, 명제, pinned 환경과 axiom audit를 다시 검증해야 한다.

환경이 달라지면 그 차이를 숨기지 않는다. 동일 환경에서의 결정적 출력과 서로 다른 Python·수치 라이브러리에서의 bitwise 일치는 별개의 요구다. 지원되지 않는 adapter, 입력이 빠진 옛 번들, hash 불일치, 손상 ZIP은 명시적인 실패 또는 HOLD로 표시되어야 한다.

## 수치·정리·형식 증명 상태 읽기

| 표시 | 의미 |
|---|---|
| NUMERICAL INDICATOR | 기록된 유한 입력·격자·정밀도에서 계산한 관측값. 오차 인증이나 일반 정리를 뜻하지 않음 |
| CERTIFIED NUMERICAL | 실제 검증된 오차 보증이 있는 범위에만 사용 |
| THEOREM-BACKED | 명시된 가정과 이미 증명된 정리를 적용한 범위. 가정 충족 확인이 필요 |
| FORMAL PASS | 특정 명제·원본·환경에 대해 최종 verifier가 통과한 범위. LSP 진단, 코드 생성, 다른 명제의 성공으로 대체 불가 |
| RESEARCH HYPOTHESIS | 검증할 주장 또는 후보. Copilot 제안도 이 경계를 넘지 않음 |
| UNKNOWN / HOLD | 자료·구현·검증이 부족하여 결론 보류 |
| STALE / REPLAY REQUIRED | 원본·가정·환경 변경 또는 가져오기로 현재 증거로 사용할 수 없음 |

Proof Dock에서는 최종 검사 결과와 coverage를 함께 읽는다. C-014의 제한된 exact slice가 통과해도 PDE 전체 해의 존재·유일성, 일반 spectral theorem, Atiyah–Singer 전체가 형식화되었다는 뜻이 아니다. Lean dependency가 빠졌다면 명제를 증명한 것으로 표시하지 않는다.

Golden용 별도 제한 명제 `GOLDEN-NONLINEAR-ALGEBRA-001`은 `F(u+tv)`의 정확한 대수 전개, 주어진 `D(1)=0` 가정하의 λ=1/u=1 잔차, 그 지점의 일차항을 검증한다. 이것은 C-014와 다른 명제다. torus의 Laplacian이 실제로 해당 D라는 분석적 증명, Fréchet 미분의 domain/regularity, PDE 해의 존재·유일성, spectrum/topology/index는 포함하지 않는다. 원본과 로컬 재현법은 [formal 안내](../formal/README.md)를 따른다. 새 cloud endpoint의 배포·pinned 환경·실제 실행이 확인되기 전에는 cloud FORMAL PASS로 기록하지 않는다.

## 3D와 복소 ζ 화면

Stage 5, 6, 7의 3D 패널에서 모드를 선택하고 `Render 3D`를 누른다. 아래 텍스트에서 source, 좌표 map, 버린 정보, evidence grade, scope를 읽는다. 키보드로 canvas에 초점을 두고 방향키로 회전, `+`/`-`로 확대·축소, `Home`으로 초기화한다. 화면의 `Rotate left`, `Zoom in`, `Reset camera` 같은 버튼도 같은 조작을 제공한다.

- `Full sampled mesh`와 `Compact mesh (stride 2)`는 표시할 mesh의 상세도 선택이다. source 데이터와 수학적 증거 등급은 바꾸지 않는다. compact에서는 더 적은 꼭짓점과 삼각형을 사용하며 mask를 가로질러 면을 채우지 않는다.
- Research Graph의 3D 표시는 최대 120개 source node의 배치이다. 전체 노드 검색, 페이지 이동, 각 노드의 `Inspect`는 2D graph 아래 표를 이용한다. canvas의 간선은 해당 페이지 내부만 나타내며 inspector는 페이지 밖 의존성도 보여 준다.
- 복소 ζ는 `x=Re(s), y=Im(s), z=log(1+|ζ(s)|)`와 위상 색상으로 표시한다. 극점 근처는 mask한다. 흰 점은 알려진 영점 높이의 참고 표시이며 영점 인증이 아니다.
- `CLOUD NUMERICAL`과 브라우저 근사 fallback은 구분한다. fallback이 표시되면 `Render 3D`로 cloud 요청을 다시 시도할 수 있다. `Riemann ζ ≠ Spectral ζ`, `zeroCertification: NONE`을 유지한다.
- `Cancel zeta sampling / request`는 로컬 worker를 종료하거나 브라우저 요청을 취소한다. 서버 작업 종료 확인은 별도로 필요하다.

## 성능 검사

`Measure 3D frames`는 현재 보이는 canvas에서 180개의 정지 화면 frame 간격과 렌더 명령 제출 시간을 측정한다. `CPU sampling benchmark`는 별도 worker에서 320개의 유한 Euler–eta 계산 시간을 측정한다. worker를 만들 수 없으면 UI thread에서 몰래 계산하지 않고 실패를 알린다. `Cancel sampling / request`으로 worker를 종료할 수 있다.

측정 시 다음을 함께 남긴다: 브라우저·OS·장치·화면 주사율, viewport, devicePixelRatio, WebGL/가속 상태, full/compact LOD, 모드와 데이터 크기, reduced motion, visible 여부, 냉간/워밍업, FPS·p95 frame time·제출 시간. CPU elapsed time은 CPU 사용률이 아니고 제출 시간은 GPU 완료 시간이 아니다.

60fps는 원본 체크리스트의 목표다. 기존 180-frame 측정이나 작은 CPU 예제로 모든 target device의 성능을 승인하지 않는다. 별도 CPU 사용률 예산이나 허용된 FPS 오차 폭은 원본에 정의되어 있지 않으므로 임의로 만들어 통과시키지 않는다.

개발 검사는 DPR>1에서도 매 frame canvas가 재설정되지 않는지, 빠른 pointer/resize/slider 입력이 frame당 한 번으로 합쳐지는지, view 이동·재생성 때 observer/worker가 해제되는지, mask 보존 LOD와 큰 graph의 모든 페이지에 도달 가능한지 확인한다. 실제 브라우저 성능과 다르므로 자동 코드 테스트만으로 성능 게이트를 체크하지 않는다.

## PC Chrome·Edge 직접 검증 순서

1. Chrome과 Edge 각각에서 개발판을 새로 열고 버전·OS·화면 주사율·viewport를 적는다. 확대율 100%로 시작한다.
2. Stage 1–8 메뉴를 클릭해 이동한다. Stage 5/6/7의 3D 모드를 바꾸고 실제 mesh, source/scope 텍스트와 오류 표시를 확인한다.
3. 마우스 없이 `Tab`/`Shift+Tab`으로 이동한다. 메뉴, selector, 버튼, 가져오기, graph 표, inspector에 초점이 보이는지 확인한다. canvas 방향키·확대·초기화와 native camera 버튼을 각각 확인한다.
4. Windows Narrator 또는 NVDA를 켜고 같은 경로를 따라간다. 입력의 이름, 선택된 모드, 버튼 목적, 오류·상태, graph 표의 열 제목·노드·의존성을 읽을 수 있는지 적는다. DOM에 ARIA 속성이 있다는 사실만으로 이 검사를 통과시키지 않는다.
5. OS의 reduced motion을 켜고 새로 연다. 회전이 강제되지 않는지 확인한다. 화면을 좁히고 확대율 200%에서 controls와 오류를 읽고 조작할 수 있는지 확인한다.
6. full/compact, 정지/회전, desktop/narrow viewport에서 frame을 측정한다. 같은 조건에서 워밍업 후 3회 기록한다. 실제 휴대전화 검사는 별도이며 PC mobile emulation으로 대체했다고 쓰지 않는다.
7. Golden 실행 → `.mathscope` 내려받기 → 가져오기 → numerical replay를 수행한다. 가져온 증거의 quarantine, 새 세션 ID, 동일 입력 비교와 formal 분리를 확인한다.
8. 브라우저 console 오류, 실패 화면, 조작 단계와 결과를 저장한다. 하나라도 재현 가능한 문제가 있으면 해당 항목은 미완료로 남긴다.

## 실패 결과와 적용 범위

발산, 잘못된 mesh, domain/정리 가정 누락, spectral pollution 경고, projection 비단사성, 불완전한 topology 계산, K backend 미지원, 경계 조건 불확정, proof dependency 누락은 각각의 실패 이유를 보존한다. 실패 뒤 이전의 성공 표시를 현재 결과처럼 재사용하지 않는다.

이 배포의 reference fixture나 semantic guard가 일반 ODE/DAE/FEM, 모든 함수공간의 해석, 일반 Ricci flow/surgery, 임의 K-theory 또는 완전한 증명 자동화를 구현했다는 뜻은 아니다. 그런 고급 기능은 해당 adapter, 입력 범위, 수학적 계약과 실제 검증 결과가 추가될 때 별도로 승인한다.

