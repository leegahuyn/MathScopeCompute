# MathScope M2 · 구현 범위와 인수인계

기존 MathScope v0.3.1에 **M1 관측 개선과 M2 유한 계산 모듈**을 추가한 디렉터리입니다. 기존 M0/M1 수학 소스와 M1 Worker를 보존하고, 입력·원본 값·관측·검증 범위를 각각 추적합니다.

- [M2 작업창](https://project29770.websitepublisher.ai/v0.3.1.html#research-m2)
- [M1 수학 대상](https://project29770.websitepublisher.ai/v0.3.1.html#research-objects)
- [원문 기준별 상태](evidence/m2-criteria-status.json) · [원문 64개 기준](evidence/original-m2-criteria.json)

## 현재 상태

2026-10-10 작성 기준, M2 기본 예제는 **27개: 산술 11개, 게이지 8개, NS 8개**입니다. 원문 M2 기준은 **PASS 20개 / PARTIAL 39개 / OPEN 5개**입니다.

| 묶음 | PASS | PARTIAL | OPEN |
| --- | ---: | ---: | ---: |
| P4 · 고차원 산술과 Frobenius | 4 | 4 | 0 |
| P5 · 형식 q와 Breuil–Kisin | 4 | 4 | 0 |
| P6 · perfectoid 유한 관측 | 2 | 6 | 0 |
| Y3 · 유한 격자 | 6 | 2 | 0 |
| Y4 · 앙상블과 통계 | 4 | 2 | 2 |
| N4 · 배경 구성 | 0 | 5 | 3 |
| N5 · pulse 구성 | 0 | 8 | 0 |
| I2 · 관측 인터페이스 | 0 | 8 | 0 |
| **합계** | **20** | **39** | **5** |

개별 실행의 `COMPLETED`는 그 입력에 대한 유한 계산이 끝났다는 뜻입니다. 원문 기준의 전체 완료나 새로운 정리 증명을 뜻하지 않습니다. `PARTIAL` 결과도 계산한 값과 남은 조건을 함께 표시합니다. I2에는 미완료 기능이 남아 있으므로 시각화 개선만으로 전부 PASS가 되지 않습니다.

**실제 브라우저 검증을 완료한 최종 게시 버전은 v57 / `b915e5b4`입니다.** v56에서 M2 27개 예제 전부와 M1 32개 예제(기존 빈 관측 26개 포함)를 확인했습니다. v57에서는 실행 기록 복원과 입력 검증 관련 UI 수정을 반영하고 해당 동작을 다시 확인했습니다. M2 Worker는 v56과 동일하며, 최종 v57에서 M1·M2 runtime Worker 해시를 다시 확인했습니다. 브라우저 상호작용 15/15와 최종 v57 확인 6/6의 범위·개별 결과·스크린샷은 [브라우저 릴리스 검증](evidence/browser-release-audit.json)에 기록합니다. 로컬 M1 59개 검증과 실제 브라우저 M1 32개 검증은 별도 범위이며, v56의 모든 예제를 v57에서 전부 다시 실행했다고 표시하지 않습니다.

## M1에서 개선한 관측

로컬 관측 검증은 기존 **59개 예제 전부**를 실행하고 원본 입력·결과 해시를 유지합니다. 그중 원래 점·선·화살표가 모두 비었던 **26개 결과**에 실제 자료를 읽는 관측을 연결했습니다. 근거는 [관측 목록](visualization/evidence/adapted-inventory.json)과 [관측 소스 해시](visualization/evidence/source-hashes.json)입니다.

- 산술 복합체·cohomology·검증 결과에는 기저/관계 그림, 행렬, 구간, 검사 상태 또는 정확표를 제공합니다. p-adic 값이나 큰 정수를 임의의 실수 좌표로 바꾸지 않습니다.
- 군의 실제 기저·행렬과 NS의 profile·스펙트럼·구간·검사 자료를 해당 자료의 의미에 맞게 표시합니다. 공간 좌표, 스펙트럼 축, 차수, 소수 인덱스를 구별합니다.
- LOD는 원본 전체 구간에서 결정적으로 표본을 고릅니다. 표시 한계를 바꾸어도 원본 계산과 해시는 유지합니다. 정확표와 선택한 점은 원본 필드에 연결됩니다.
- 소수 Atlas는 정확히 계산한 구간과 미계산 구간을 구별합니다. 미계산을 소수 0개로 표시하지 않습니다. 기저 선택에서는 기존 미분·Frobenius·filtration 자료를 추적합니다.
- 두 완료 실행은 호환되는 관측 계약 아래 같은 카메라·축 범위·색 범위로 비교합니다. 입력을 바꾸면 이전 관측을 닫고 새 실행을 기다립니다.

렌더링은 CPU Canvas2D이며 키보드 카메라, 초기화, 색 외의 표식과 HTML 수치표를 제공합니다. **WebGL 경로와 CPU/GPU 동등성 검증은 미구현**입니다. 실제 브라우저에서 확인한 렌더링과 상호작용의 범위는 릴리스 검증에 따로 기록하며, 모든 접근성·성능 조건에 대한 인증을 부여하지 않습니다.

## M2에서 실행하는 계산과 경계

| 영역 | 구현한 계산 | 아직 완료하지 않은 범위 |
| --- | --- | --- |
| 산술 P4–P6 · 11개 예제 | Pⁿ의 유한 cohomology/Frobenius 비교 자료, 명시적 유한체의 타원곡선 점 열거, 정수 복원·Newton 기울기·유한 local factor, 형식 q-Koszul, Eisenstein δ(E), W_N(F_p)의 실제 carry, 선택한 root tower와 θ/ξ witness, 유한 η-complex 진단 | Kedlaya/MW Frobenius와 정밀도 손실 인증, 일반 semilinear coefficient Frobenius, q-framing 비교와 coherent derived descent, 전체 tilt 계수환의 Witt/sharp, 일반 AΩ·perfectoid descent, cup/E∞·무한 전역 정리 인증 |
| 게이지 Y3–Y4 · 8개 예제 | 기존의 실제 군·표현으로 4차원 링크와 경로, Wilson 작용, plaquette/clover 곡률, BPST refinement, 전체 군 proposal에 의한 Metropolis, 독립 시작·수락률·자기상관·ESS, 독립 Haar quadrature | 일반 연속체 오차 인증, 모든 군·비영 β 다중 링크의 정량 reference, 평형·위상 혼합의 보증, 모델별 reflection positivity 적용, cutoff/오차를 갖춘 전달 연산자, 연속체 양자장·질량 간극 |
| NS N4–N5 · 8개 예제 | 원문 지수와 ordered convolution 항, 명시한 상수의 cutoff/log tail, 전체 curl과 divergence 진단, 유한 dyadic chart와 support pair, 접평면 projected pulse ODE, 명시한 polarization covariance | 동일 N3 profile의 실제 양의 차수 계수 풀이, 공통 Picard 구간·모멘트 보정·전역 gluing, 실제 profile에서 유도한 상수, 엄밀한 ODE 오차와 모든 slow derivative·Gaussian remainder |

산술의 정수·다항식·유한체·지원 Witt 연산은 정확 계산입니다. 복소근 표시, 게이지 수치와 ODE는 명시한 binary64 범위입니다. NS의 outward scalar log 구간은 ODE 전체의 구간 인증이 아닙니다. 작은 ESS, covariance cone 위반, 경계 밖 입력, 정밀도 부족은 실제 실패/부분/미지원 상태로 남깁니다. 유한 root level을 perfectoid 전체로, 짧은 chain을 평형 인증으로, NS 예제의 `h`를 원본 N3의 정확한 symbolic parameter로 바꾸어 해석하지 않습니다.

세부 계약·수식·독립 oracle은 [산술](arithmetic/README.md), [게이지](gauge/README_KO.md), [NS](navier/README_KO.md)를 참조합니다.

## 실행·저장·내보내기

작업창에서 예제를 고르거나 `{kind,input,precision,budget}` JSON을 편집한 뒤 입력 검사와 계산을 실행합니다. 지원 범위는 각 모듈의 `getCapabilities()`와 원문 체크리스트에서 확인합니다. 실행 기록을 선택하면 그 실행의 입력과 관측을 함께 복원합니다. 실행·재현 중 새로 편집한 입력이나 선택은 이전 비동기 완료 결과가 덮어쓰지 않도록 보호합니다.

세션 저장은 실행을 시작한 **동일 세션·동일 revision**에서 발급된 실제 engine receipt를 요구합니다. 입력/결과/환경 해시와 저장 대상 revision을 확인하고, 최종 검사 직후 Foundation의 동기 commit을 호출합니다. 저장되는 객체는 `FiniteComputationRecord`이며 수학적 원본의 차원은 `sourceRecord.object`에 남깁니다. adapter 저장은 `NUMERICAL INDICATOR`이고 자동 `FORMAL PASS`가 아닙니다.

실행 기록은 메모리에 있으므로 새로고침 전에 필요한 JSON을 내보냅니다. 세션 저장은 유한 기록과 근거를 남기며, 전체 raw 결과의 재현 파일은 별도로 내보내야 합니다. 내보내기에는 정규화된 요청, 전체 결과, 환경/Worker 해시와 재현 해시가 포함됩니다. 읽어들인 직렬화 근거는 자동 신뢰하지 않습니다. 같은 설치 환경에서 새로 계산한 결과를 비교해야 하며, 모든 해시를 다시 붙인 위조 결과도 실제 재계산과 다르면 `MISMATCH`입니다.

`workerSha256`는 실행 코드, `inputHash`는 정규화된 요청, `resultHash`는 전체 결과를 묶습니다. `mathematicalHash`는 최상위 `executionMetrics`만 제외합니다. 도메인의 `modelHash`/`sourceHash`/`sampleHash`/`observationHash`는 해당 모형·자료·관측의 정의에 따라 구분합니다. 산술 결과의 `sourceHash`는 수학 데이터와 계산 규약의 해시이며 소스 파일의 SHA와 다릅니다. 카메라는 표시 revision만 바꾸고 모형·계산 결과를 바꾸지 않습니다.

## 원본과 근거 보존

사용자 문서는 `MathScope_Handoff_2026-10-10_1150_KO`와 `MathScope_Research_IDE_Blueprint_v1_KO`입니다. Blueprint SHA-256은 아래와 같습니다.

```text
f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac
```

I2는 pp.17–18, P4–P6은 pp.27–32, Y3–Y4는 pp.41–44, N4–N5는 pp.57–60의 원문 기준을 보존합니다. 인수인계의 **M1 64/64 + M0 잔여 6/6 = 70/70**은 과거 해당 묶음의 검증 기록입니다. Blueprint 전체 224개나 M2 완료를 뜻하지 않습니다. 이전 61/7/2 및 69/1 평가를 덮어쓰지 않고 날짜와 범위를 구별합니다.

| 파일/위치 | 보존하는 근거 |
| --- | --- |
| `evidence/original-m2-criteria.json` | 원문 64개 식별자·문구·페이지 |
| `evidence/m2-criteria-status.json` | 원문 기준별 현재 상태와 남은 범위 |
| `arithmetic/evidence/`, `gauge/evidence/`, `navier/evidence/` | 실행 결과·정확/수치 진단·독립/음성 대조군·소스 해시 |
| `visualization/evidence/` | 로컬 M1 59개 관측 목록과 adapter 소스 해시 |
| `evidence/m1-inherited-comparator-audit.json` 및 원본 ZIP | N1-06의 실제 GitHub Actions terminal 기록, 원본/로그/아카이브 해시 |
| `evidence/baseline-v54-read-projection.html.gz` | v54 기준 provider read projection의 정확한 바이트; gzip mtime=0으로 보존 |
| `build-manifest.json`, `evidence/assembly-audit.json` | 추가 코드·단일 anchor 패치·기존 소스 보존·페이지 조립 검사 |
| `evidence/browser-release-audit.json` | v56 예제 검증과 최종 v57 UI 재검증, 실제 runtime Worker 해시, 상호작용·스크린샷 |

N1-06은 run `38014602021`, job `114101981614`, artifact `11657065866`의 2026-10-10 02:44:12 UTC 성공 terminal을 보존합니다. 이 작업에서 비용이 큰 원본 Comparator를 재실행한 것으로 표시하지 않습니다. 기존 NS 개별 브라우저 fixture의 PARTIAL도 원본 성공 기록으로 바꾸어 표시하지 않습니다.

배포 도구가 읽은 HTML에는 일부 값이 가려집니다. `originalReadProjectionSha256`와 `candidateReadProjectionSha256`는 **provider read projection**의 해시입니다. 실제 라이브 HTML 전체나 실제 M1 Worker의 해시로 사용하지 않습니다. 현재 provider는 새 UI·관측 inline script의 일부도 가리므로, `bundleSha256`와 `visualizationSha256`는 로컬 빌드 산출물의 digest이며 라이브 HTML 바이트에서 독립 확인한 digest가 아닙니다. 가려진 원본을 전체 HTML로 다시 쓰지 않고 정확한 부분 패치로 보존합니다. M1·M2 runtime Worker 해시는 최종 v57의 브라우저 도구로 따로 확인했습니다. `baseVersion`은 패치를 작성한 기준 페이지 버전이고 최종 게시 버전은 릴리스 audit에 기록합니다.

## 빌드와 테스트

명령은 저장소 루트에서 실행합니다. 작성 환경은 Node.js 24.19.0, Python 3.12.14입니다. 브라우저 코드에 외부 실행 코드를 다운로드하지 않는 정적 모듈 그래프를 사용합니다.

기본 빌드는 저장소에 포함된 `evidence/baseline-v54-read-projection.html.gz`를 읽습니다. 압축을 푼 기준 바이트의 SHA-256은 `7bdf4cd11e35ab021d4d5686cdbdd709062f3675635eba523be6f16fbc7de948`이며, 빌드는 이 v54 기준값을 확인합니다. 별도의 작업 디렉터리나 과거 candidate 파일이 필요하지 않습니다.

```sh
python research-ide/mathscope-m2/build_m2.py
python research-ide/mathscope-m2/tests/check_assembly.py

node --test \
  research-ide/mathscope-m2/arithmetic/tests/*.test.mjs \
  research-ide/mathscope-m2/gauge/tests/*.test.mjs \
  research-ide/mathscope-m2/navier/tests/*.test.mjs \
  research-ide/mathscope-m2/core/tests/*.test.mjs \
  research-ide/mathscope-m2/visualization/*.test.mjs \
  research-ide/mathscope-m2/tests/*.test.mjs
```

두 Python 명령 모두 선택적으로 보존한 동일 v54 기준의 일반 HTML 또는 gzip 파일 경로를 첫 번째 인수로 받을 수 있습니다. gzip 여부는 파일 바이트로 구별합니다. 다른 페이지 버전을 입력하려면 기준 버전과 패치 anchor를 새로 검토해야 합니다.

빌드는 `prepare-evidence.mjs`로 원문 상태를 모으고 Worker, UI, 관측 번들·해시·`page-patches.json`을 생성합니다. candidate HTML은 시스템 임시 파일에만 기록하고 그 경로를 표준 출력의 `candidateTemporaryPath`로 알려줍니다. 이 파일은 provider projection의 조립 검사용 산출물입니다. 조립 검사는 압축 baseline과 순서가 있는 `page-patches.json`을 메모리에서 다시 적용하고, anchor 유일성·baseline/patch/candidate 해시·DOM ID·원본 Worker 보존을 확인하므로 임시 candidate 파일에 의존하지 않습니다.

수학 모듈을 변경한 뒤 이전 Worker를 테스트하면 source/Worker parity가 실패해야 정상입니다. 최종 변경을 모은 뒤 빌드하고, 그 산출물을 검증합니다. `build_m2.py` 자체가 모든 수학 테스트나 라이브 검증을 대신하지는 않습니다.

필요한 도메인의 기록은 해당 실행 범위를 다시 검증한 뒤 갱신합니다.

```sh
node research-ide/mathscope-m2/gauge/tests/generate-evidence.mjs
python research-ide/mathscope-m2/gauge/tests/independent.py
node research-ide/mathscope-m2/navier/tests/generate-evidence.mjs
```

core 테스트는 실제 별도 Node Worker에서 게시용 Worker 바이트를 실행하여 local 모듈과 비교합니다. 세션 테스트는 원본 Foundation의 발췌 validator/commit과 위조 receipt·환경 변조·비동기 revision 경쟁·rollback을 검사합니다. 이것은 실제 브라우저 Worker·DOM·다운로드·저장의 합격을 자동으로 부여하지 않습니다.

## 다음 확장 순서

1. 기존 원문 ID와 합격 조건을 유지하고, 새 adapter가 계산하는 유한 범위·수학 가정·미지원 입력을 먼저 명시합니다. 기존 M0/M1 파일과 원본 검증 기록은 보존합니다.
2. 도메인의 `run`/`runJob`, `validate`/`validateRequest`, `getExamples`, `getCapabilities`, `getChecklist`에 연결합니다. 요청은 `{kind,input,precision,budget}` 계약과 자원 상한을 지킵니다.
3. 실제 결과에서 관측을 만듭니다. 좌표 종류·단위·원본 필드·손실 정보·자료 해시를 기록하고, 정확값을 유지한 표와 source selection을 제공합니다. 입력 변경·실패·정밀도 부족은 이전 그림을 비웁니다.
4. 독립 oracle과 잘못된 입력/공식/상태를 거부하는 대조군을 추가합니다. 새로운 수학적 의무가 남으면 PARTIAL/OPEN을 유지하고, 테스트 실행 성공으로 원문 상태를 올리지 않습니다.
5. 관련 근거를 갱신하고 최종 정적 Worker/UI를 다시 빌드합니다. 원본 소스 보존, source/Worker parity, receipt/replay/세션 경쟁과 관측 테스트를 통과시킵니다.
6. 게시 대상의 버전·해시와 정확한 패치 anchor를 확인한 뒤 변경을 반영하고, 실제 브라우저의 새 Worker 해시·모든 해당 예제·입력 변경·카메라·저장·내보내기·재현·탐색을 별도 audit에 기록합니다.

새로운 정리 적용이나 Lean 증명이 필요한 기능은 해당 가정·버전·증명 소스·실제 verifier 결과를 별도 근거로 추가해야 합니다. 이 M2 adapter나 직렬화 JSON은 그 권한을 대신하지 않습니다.
