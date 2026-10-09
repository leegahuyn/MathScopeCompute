# MathScope M0 — 구현 소스와 검증 자료

2026-10-09. 기존 MathScope ResearchSession에 수학 대상·가정·정밀도·계산·증거·Lean 감사의 공통 실행 기반을 추가했다.

실제 페이지: https://project29770.websitepublisher.ai/v0.3.1.html#research-foundation/lean

- 배포 페이지: WebsitePublisher project 29770, version **44**, version hash **4d79dd82**.
- M0 번들: **b337da82947040c17b2271d34eb70eb9fba46f2aca6e8860ffcce2cc089f8695**, 264,909 bytes.
- 변경 시작 기준: version 41 / d400a17e. 중간 배포 42·43을 거쳐 44에서 직접 링크 초기화를 수정했다.
- 새 페이지 0개, 새 외부 asset 0개. 기존 RELEASE HOLD와 기존 FORMAL PASS 발급 경로를 유지했다.

## 지금 사용할 수 있는 기능

1. **대상·계약:** 17개 스키마 문서와 10개 입력 예제, 계약 검사, 입력 등록, 기존 RX 관측 연결.
2. **정밀도·계산:** 4개 유한 계산 어댑터, 정확 값 타입, 자원 예산, 취소·checkpoint·재개, 결과 저장과 새 엔진 재실행.
3. **가정·증거:** 명시적 USER_AXIOM, 원본 ID/revision/hash 의존 관계, 변경된 가정의 후손만 STALE 처리, 가져온 기록의 재검증 상태.
4. **Lean·감사:** 실제 Lean 검사로 만든 5개 선택 가능한 묶음, 정확한 source/target/환경/가정 대조, 소스 편집 시 STALE, ProofJob 내보내기.

프리즘·일반 G·PDE의 스키마는 후속 계산을 받는 입력 계약이다. 새 프리즘 복합체 전체 계산, 일반 군의 양자 장 구성, 논문의 Navier–Stokes 전체 재구성은 이번 4개 어댑터가 제공하는 기능에 포함되지 않는다. 그 범위는 `docs/M0_Delivery_Report_KO.md`의 24개 체크리스트에 명시했다.

## 직접 확인한 계산

| 어댑터 | 예제의 정확한 결과 | 지원 범위 |
|---|---|---|
| prime-segment | [2,1000]의 소수 168개 | 0 ≤ L ≤ U ≤ 1,000,000, U−L ≤ 20,000 |
| padic-delta | p=5, a=7+O(5⁴), δ(a)=15+O(5³) | 정준 Zp, Frobenius lift=identity, 출력 N자리에 입력 N+1자리 필요 |
| rational-interval | [1/3,1/2] × [−2,3] = [−1,3/2] | 정확한 유리수 끝점의 사칙연산, 0을 포함하는 구간으로의 나눗셈 거부 |
| integer-matrix-product | 고정 D1(3×5)D0(5×4)=0(3×4) | 차원 ≤16, 정수 입력 한 개당 ≤512자리 |

브라우저에서는 별도 Web Worker가 계산한다. 정수는 BigInt, 유리수는 정수 분자·분모, p-adic 값은 잉여류와 정밀도로 유지한다. 브라우저를 닫은 후에도 계속 도는 원격 작업 큐는 구현하지 않았다. 작업 한도는 capability manifest에서 확인한다.

## 검증 결과와 근거

| 검사 | 결과 | 파일 |
|---|---|---|
| 전체 M0 Node 검사 | 82/82 | evidence/unit-tests.txt |
| 실제 주입 저장 함수 검사 | 9/9, 위 82개에 포함 | tests/bridge.test.mjs, evidence/bridge-validation.json |
| 최종 번들 VM 검사 | 12/12 | evidence/bundle-acceptance.json |
| 실제 브라우저 M0 검사 | 12/12 | evidence/browser-webmcp-validation.json |
| 기존 RX Node 회귀 | 13/13 | evidence/legacy-extension-tests.txt |
| 기존 RX 브라우저 회귀 | 28/28 | evidence/validation-summary.json |
| 실제 Lean 실행 | 6모듈·8감사대상 성공, 거짓 정리 2개 거부 | evidence/lean-validation.json 및 lean-*-audit.txt |
| 실제 WebMCP 소비자 호출 | M0 7종의 응답 확인 | evidence/browser-webmcp-validation.json |

각 검사 묶음에는 범위 중복이 있다. 이 개수를 독립적인 수학 정리 수로 합산하지 않는다. WebMCP의 완료 작업 취소 호출은 `cancelRequested:false`와 기존 완료 상태 보존을 확인한 것이다. 실행 중 작업의 취소·재개는 별도 자동 검사에서 검증했다.

브라우저에서 다음도 확인했다: 실제 결과를 같은 연구 세션에 저장, 새 계산 엔진의 replay MATCH, p-adic 입력 한 자리 부족 시 PRECISION_REQUIRED, 가정 수정 후 관련 노드 두 개만 STALE, Lean 편집 소스의 기존 audit 재사용 거부, 기존 양–밀스 관측의 M0 연결. 기존 객체·표현·주장·증거 개수는 각각 5·5·5·6으로 유지됐다. 검사 시점의 세션 ID는 `rs-mv0tg8vv-bgefzg`, 최종 M0 revision은 22, 노드 수는 17이다. 이 시험 세션은 브라우저 저장소에 있으며 다른 기기에 자동 동기화되지는 않는다.

### 내보내기와 실제 UI 가져오기 검증의 제한

테스트 브라우저에서는 Blob 다운로드가 실패했다. 내보내기는 지속되는 다운로드 링크와 전체 JSON을 읽기 전용 입력란에 준비하도록 구현했다. 자동 clipboard API가 제한된 경우 JSON 전체를 선택하고 Ctrl+C/Command+C를 안내한다. 실제 수동 단축키로 **275,922자 전체가 원문과 정확히 일치하게 복사된 것**을 확인했다. 그 당시 M0 revision 21의 내보내기 원본이 `evidence/browser-session-bundle.json`이다. 이후 revision 22에서 양–밀스 관측 한 개를 추가로 연결했다.

브라우저의 file chooser에 이 파일을 넣는 동작은 보안 승인 검토에서 거절됐다. 따라서 실제 UI 재가져오기 흐름은 미검증 상태로 남겼다. 가져오기·재검증·재계산의 코드와 통합 검사는 통과했다. 승인 거절된 파일 선택을 다른 경로로 우회하지 않았다.

최종 브라우저 로그에는 브라우저 확장의 metadata 오류와 기존 Three.js WebGL context 생성 불가가 있었다. 이 cloud GPU 환경에서는 기존 GPU 3D 전체 동작까지 검증했다고 주장하지 않는다. M0 Worker·계약·감사와 RX CPU 3D 관련 검사는 완료했다. 관측한 로그는 `evidence/browser-console-final.json`에 있다.

## 테스트와 빌드 재현

압축을 푼 프로젝트 루트에서 실행한다. Node의 내장 test runner와 Python 3을 사용한다. `mathscope-extension/session-bundle.mjs`는 기존 세션 호환 검사에 필요하므로 함께 포함했다.

```bash
node --test mathscope-m0/tests/*.test.mjs
node --test mathscope-extension/arithmetic-model.test.mjs mathscope-extension/ns-model.test.mjs mathscope-extension/test-ym-model.mjs
python3 mathscope-m0/build_m0.py
```

빌드 스크립트는 source 모듈들을 순서가 고정된 IIFE 번들로 묶고, HTML/CSS 및 기존 세션 저장 함수를 위한 targeted patch를 만든다. 배포 도구나 사용자 credential은 이 소스 묶음에 포함하지 않았다.

### 스냅샷과 배포 patch의 구별

`baseline/v031.html`은 커넥터가 돌려준 version 41 스냅샷이다. 일부 불투명한 기존 필드는 `[REDACTED]`로 마스킹돼 있다. 따라서 `v031-with-m0.html`은 번들·주입 코드 검사에 쓰는 재구성 결과이며, 현재 웹사이트를 전체 덮어쓰는 업로드 파일로 쓰면 안 된다.

`page-patches.json`은 version 41에서 M0 전체를 추가하는 10개 변경을 재현한다. version 44에 이 초기 patch를 다시 적용하지 않는다. 후속 배포는 현재 버전과 정확한 변경 지점을 먼저 읽고, 그 버전에 대한 최소 diff를 만들어야 한다. 기존 불투명 필드의 값을 재구성하거나 마스킹된 값으로 교체하지 않는다.

## Lean 실행과 해석

Lean **4.34.1**, mathlib commit **d13f23b723b8a846827a245b89c10fc7d3f11612**를 고정했다. `lean/lakefile.lean`, `lean/lean-toolchain`, 실제 환경과 2,258개 import의 hash 기록을 포함했다. 커널·runtime·verifier guard를 변경하지 않았다.

일반 Lean/Lake 설치에서 의존성을 준비하고 `mathscope-m0/lean`을 작업 디렉터리로 사용한다.

```bash
lake update
lake build
lake env lean MathScope/M0/Finite.lean
lake env lean MathScope/M0/Analytic.lean
lake env lean MathScope/M0/Conditional.lean
lake env lean MathScope/M0/Comparison.lean
```

이 검증 환경에서 필요한 명시적 설치 루트 driver와 재현 스크립트는 `lean/lean-embed-check.c`, `lean/reproduce.py`다. 그 스크립트의 기본 경로는 당시 검사 환경용이며 다른 설치에서는 경로를 맞추거나 위의 일반 Lake 명령을 사용한다. Lean 설치와 mathlib 빌드 캐시는 크기 때문에 이 압축에 포함하지 않았다.

고정 행렬의 `∀ v : Z⁴, d1(d0(v))=0`과 명시적인 실수 스펙트럼 조건의 귀결을 실제로 검사했다. 선택한 Δ=1 가정의 귀결에는 `selectedSpectrum`, `userAssumedGapAtOne` 두 USER_AXIOM이 그대로 남는다. 이 조건부 귀결은 양자 양–밀스 이론의 존재를 구성하지 않는다.

사이트의 `LOCAL_AUDIT_VERIFIED`는 지금의 정확한 소스·가정·target이 포함된 실제 검사 기록과 일치한다는 뜻이다. 버튼이 임의의 새 Lean 소스를 브라우저나 서버에서 컴파일하는 것은 아니다. ProofJob을 편집·내보낼 수 있으며 새로운 실제 컴파일 연결은 후속 인프라 선택이다. 직렬화된 receipt와 가져온 JSON은 그 자체로 현재 증명 권한을 얻지 않는다.

## 주요 구현 파일

| 파일 | 역할 |
|---|---|
| contracts.mjs, schemas/ | 공통 입력 계약과 의미 경계 |
| session.mjs | migration, revision, 의존 그래프, stale, import/export |
| values.mjs | 정확 값·구간·p-adic 타입 |
| worker.mjs, compute.mjs | 실제 계산, 작업·예산·checkpoint·replay |
| integration.mjs | 현재 세션 대상·작업·결과의 일치 검증과 저장 |
| proof.mjs, lean/ | 소스·공리 감사와 실제 검사한 정리 |
| foundation.html, foundation.css, foundation.mjs | 기존 앱과 연결한 네 작업 화면 |
| webmcp.mjs | 동일 UI controller를 사용하는 native WebMCP 7종 |
| acceptance.mjs, tests/ | 실제 실행·거부·호환성 검사 |
| docs/M0_Delivery_Report_KO.md | 24항목 상태·후속 범위·사용 순서 |
| evidence/validation-summary.json | 최종 배포와 검증 결과 요약 |

`compute-acceptance-validation.json` 등 앞선 작업 중간 기록은 역사적 검증 자료다. 최종 버전 판단은 `build-manifest.json`, `evidence/validation-summary.json`, 최종 검사 로그를 우선한다. PDF 생성 스크립트는 ReportLab과 한국어 폰트가 필요하며 실행 환경에 맞는 폰트 경로를 지정해야 한다.

## 다음 설계 선택

새로운 임의 Lean 소스를 매번 실제 컴파일하려면 실행 위치(local/private 또는 인증된 원격 worker), toolchain, 제한 시간·메모리, 허용 import, 감사 결과 발급 방식을 정해야 한다. 브라우저를 닫은 뒤에도 계산을 유지하려면 서버의 지속 작업 큐·저장소·인증·보관·비용 한도를 정해야 한다. 이 선택 없이 현재 M0의 로컬 기능은 사용할 수 있다.
