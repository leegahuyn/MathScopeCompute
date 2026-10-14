# 원본 Picard 자연급수 분류 및 복소 상계 검증 결과

2026-10-14 KST · 증거 코드 `76b49378f9b83b8ab87e0be1838f85128a197e86` · [기존 Draft PR #31](https://github.com/leegahuyn/MathScopeCompute/pull/31)

원본 계수 그래프의 자연급수 157개를 실제 두 인수 노드와 적분 바인더를 기준으로 24개 인수족으로 분류했다. 그중 **Y=4인 9개 호출의 실수 반경 인수 범위**를 정확히 검증했고, 나머지 **148개는 미해결**로 유지했다. 호환되는 실제 계수의 Bρ 노름을 전제로 하는 공통 복소 이웃의 정칙성과 노름·꼬리 상계도 도출했다. **실제 자연급수 커널의 정칙성을 새로 무조건 증명한 호출은 0개이며, 전체 A0·A1·forcing 노름과 전체 원본 Picard 수렴은 아직 증명되지 않았다.**

원본 N6 잔여는 Jet 230 · 전역 Guard 38 · PDE 잔여항 1,020 = **1,288개**다. N6-01 OPEN, N6-02 PARTIAL, M3 **56/64**를 유지한다. 이번 분류·부분 상계로 공식 소거한 원본 의무는 0개다. 이전 `RESULTS_KO.md`와 `VERIFIED_RESULT_SUMMARY.json`은 과거 실행 기록으로 보존했다.

## 실제 원본과 작업 계승

브랜치 `mathscope-m3-n6-picard-bridge-20261014`와 PR #31을 그대로 사용했다. 인수받은 커밋 `6a39ced78b64fbd0188d98492391a75440f2b310`을 확인한 뒤 같은 브랜치에서 구현했으며, 새 브랜치와 main 변경은 없다. 아래 실행 결과는 증거 코드 커밋 `76b49378f9b83b8ab87e0be1838f85128a197e86`에만 직접 대응한다. 이후 보고서 커밋의 검사는 별도 조회해야 한다.

SHA-256으로 고정한 SQLite와 header, 원본 생산자 155개 및 자연급수 생산자 3개의 바이트를 재검증했다. 대상은 `ActualSameN3OrderOneInner`, ξ node 25516, η node 2다. SQLite의 전체 그래프를 유한 계수·샘플 값으로 대체하지 않았고, 이전 PASS 라벨도 새 증명의 전제로 읽지 않았다.

| 실제 목록 | 수 |
|---|---:|
| A0·A1·forcing의 고유 계수 의존 노드 | 3,679 |
| 전체 실제 함수 호출 | 216 |
| actual_natural_series | 157 |
| inverse | 33 |
| log_positive | 21 |
| sqrt_positive | 5 |
| η 의존 함수 호출 | 169 |

원본 parent SHA-256은 `7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f`, SQLite SHA-256은 `ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003`, header SHA-256은 `010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c`이다. 기준 논문 SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다.

## 157개 호출의 함수족 분류

| 함수 성분 | 실제 호출 수 |
|---|---:|
| Phi | 83 |
| u | 51 |
| average | 23 |
| 합계 | 157 |

24개 인수족은 성분 이름만으로 묶은 결과가 아니다. 실제 `(YSourceNode, etaSourceNode)` 쌍, 계수 핵심의 캡처와 해시, 각 호출의 모든 적분 범위와 미분 차수를 보존했다. 모든 η 인수는 실제 node 2이며, 최대 반경 미분 차수는 2, η 미분 차수는 3이다. 핵심 캡처 의존 그래프는 390개 노드이고, 해시 `1566f6df28ba4547ce5a0e3c493f5b74e1b7de9aa565701718b55d97120d009a`와 자유 좌표 검사를 통해 숨은 ξ 캡처가 없음을 확인했다. 이는 노름 증명이 아니다.

| 실제 Y 인수 구조 | 인수족 수 | 호출 수 | 이번 범위 검증 |
|---|---:|---:|---|
| 정확한 유리수 | 1 | 9 | node 474 = 4 |
| 매개변수만 포함한 식 | 1 | 12 | 미해결 |
| 적분 좌표를 포함한 식 | 19 | 103 | 실제 끝점·중첩 바인더 범위 미해결 |
| ξ를 포함한 반경 식 | 3 | 33 | 실제 반경·매개변수 범위 미해결 |

검증된 인수족은 `Y:474/eta:2`다. 실제 자연급수 호출 노드는 **4468, 4469, 4483, 5303, 5307, 5748, 9836, 9839, 10450**이다. Phi·u·average 각각 3개이고 η 미분 차수 0·1·2를 포함한다. Y가 문자 그대로 4이므로 모든 등장 위치에서 |Y|≤5를 만족한다. 적분 본문은 바인더 안에서, 끝점은 바인더 밖에서 검사하며, 같은 호출의 한 등장 위치라도 범위가 미해결이면 전체 호출을 통과시키지 않는다. unknown 매개변수와 좌표의 범위를 추정하지 않았다.

**이 9개는 반경 인수만 검증한 수다.** 실제 Bρ 계수 노름, η의 공통 복소 이웃 배치와 커널 정칙성까지 새로 증명한 9개라는 뜻이 아니다. 148개 미해결 호출이나 아래 55개 비선형 함수 호출을 원래 1,288개 의무와 더하거나 빼지 않는다. 서로 다른 목록과 범위다.

## 새 조건부 복소 연속 및 수렴 정리

실수 구간 I=[−33/32,33/32]에서 실제 계수 함수들의 모든 차수 미분이 서로 호환되고 다음 가중 노름 상계를 만족한다고 전제한다.

\[
|a_n^{(l)}(x)|\le Q\,20^{-n}\rho^{-l}
\frac{l!\binom{n+l}{l}}{(n+1)^2(l+1)^2},\qquad Q>0,\ \rho>0.
\]

임의의 t,R에 대해 0≤t<1, c=1−t−R/20>0이면, |Y|≤R 및 dist(η,I)≤tρ에서 자연급수 F의 정칙 연속이 존재하고

\[
|\partial_Y^k\partial_\eta^mF(Y,\eta)|
\le Q\rho^{-m}(k+m)!20^{-k}c^{-(k+m+1)}.
\]

증명의 첫 단계는 실제 호환 미분들의 Taylor 전개다. η Taylor 합의 이항 생성함수가 `(n+m)!/n! × (1−t)^(−n−m−1)`을 주며, 이어 반경 미분 생성함수를 합하면 위 닫힌 상계가 나온다. 같은 실제 실수 계수에 일치하는 Taylor germ들은 겹치는 구간에서 접합된다. 공통 영역의 모든 compact 부분에서 정상 수렴하므로 정칙성과 항별 미분이 정당하다. `average_n=u_n/(n+1)`도 같은 상계를 만족한다. 서로 무관한 미분 배열에 노름 라벨만 붙인 경우에는 적용할 수 없다.

t=1/2, R=5를 택하면 c=1/4이므로 **공통 작은 복소 이웃** dist(η,I)≤ρ/2에서

\[
|\partial_Y^k\partial_\eta^mF|
\le Q\rho^{-m}\frac{(k+m)!4^{k+m+1}}{20^k}.
\]

아래는 실제 등장하는 10개 미분 차수에 대한 정확한 유리수 상계다. 노름 및 꼬리 모두 **Qρ^(−m)를 곱해야 하며**, 실제 Q·ρ와 계수 노름은 전제로 남아 있다. 꼬리 상계에는 유한 계수의 수치 평가 오차가 포함되지 않으며 전체 함수를 수치 계산했다는 뜻도 아니다.

| k | m | Qρ^(−m)를 제외한 노름 상계 | 꼬리 시작 전 유한 차수 N | 같은 스케일의 꼬리 상계 |
|---:|---:|---:|---:|---:|
| 0 | 0 | 4 | 8 | 1/12800 |
| 0 | 1 | 16 | 8 | 1/576 |
| 0 | 2 | 128 | 8 | 11/256 |
| 0 | 3 | 1536 | 8 | 33/28 |
| 1 | 0 | 4/5 | 8 | 81/512000 |
| 1 | 1 | 32/5 | 8 | 81/22400 |
| 1 | 2 | 384/5 | 8 | 297/3200 |
| 1 | 3 | 6144/5 | 9 | 65/44 |
| 2 | 0 | 8/25 | 8 | 3/10000 |
| 2 | 1 | 96/25 | 8 | 9/1250 |

양의 꼬리의 비율 상계는 `q (N+m+2)/(N+2−k)`이며 q=R/[20(1−t)]다. 모든 이후 항에 대해 감소하므로 첫 누락 항을 `1−ratioUpper`로 나누어 완전한 꼬리를 덮는다. 이를 정확한 분수 연산과 부정 대조 테스트로 검증했다. **이 정리는 조건부 고전 해석학 결과이며 새 Lean 커널 증명이 아니다.** 기존 원본 자료의 고전 Bρ 주장이나 저장된 PASS를 이 감사에서 자동 수입하지 않았다.

**ρ/2 이웃을 기존 1/4 stadium으로 바꾸지 않는다.** 0<h<1/100만으로 실제 ρ, Q, log·역원·정규화까지 h→0에 대해 균일하게 제어한 것도 아니다. 특히 η 인수가 node 2와 같다는 구조적 일치는 실제 복소 정의역 배치 증명이 아니다.

## 정확한 원본 역원 4개에 적용한 부분 증명

영역은 dist(η,[−1,1])<1/4, 실수 0<h<1/100이다. 실제 피연산자 다항식을 대조한 결과 다음 네 역원에 정확히 적용된다.

| 원본 역원 node | 실제 피연산자 | 피연산자 절댓값의 엄격 하계 | 역원 절댓값의 엄격 상계 |
|---:|---|---:|---:|
| 17 | 1+η² | 9/16 | 16/9 |
| 279 | 1−h | 99/100 | 100/99 |
| 1953 | 1−2hη² | 31/32 | 32/31 |
| 3434 | 1+2h | 1 | 1 |

node 17은 `(η−i)(η+i)`의 두 인자가 각각 3/4보다 큼을 사용한다. node 1953은 stadium에서 |η|<5/4, |2hη²|<1/32를 사용한다. **원판 |η|<5/4 자체를 공통 영역으로 쓰면 안 된다.** 그 원판에는 실제 node 17의 극 η=±i가 포함된다. 이 반례도 검증 코드와 화면에 기록했다.

아직 개별 공통 영역을 증명하지 않은 inverse·log_positive·sqrt_positive 호출은 **55개**다. 과거 58개에서 역원 3개의 부분 증명이 추가된 결과이며, 공식 전역 Guard 38개를 35개로 줄인 결과가 아니다.

## 전체 Picard 수렴에 남은 전제

자연급수의 조건부 정상 수렴과 원본 η-Picard 시스템의 수렴은 별개다. 아래 네 bridge 전제를 모두 OPEN으로 유지한다.

- **PB-COMPLEX-STRIP:** 모든 실제 A0·A1·forcing 합성과 적분 경로·inverse/log/sqrt 분기가 하나의 복소 이웃에서 정칙이며 균일하게 유계임을 증명한다.
- **PB-NATIVE-IDENTITY:** 실제 native 함수가 Picard majorant의 노름 입력 함수와 일치함을 증명한다. 유한 근사나 연산자 선언은 동일성 증명을 대신하지 못한다.
- **PB-PREVIOUS-ORDERS:** n≥2의 모든 필요한 하위 차수 해·moment·cutoff가 확정되어 같은 반경 구간의 forcing 노름을 제공함을 증명한다.
- **PB-ALL-BANDS:** 원래 band·label·copy와 Cartesian 평가가 같은 검증 영역과 W/M/S 상계 안에 있음을 증명한다.

기존 독립 majorant 감사의 충분 조건 `K≥ceil(9·2^140·Λ^8·Q^17·a²/(t1⁴·ρ⁵))`은 정확한 대수 관계로 유지했다. 양수성과 실제 함수 노름은 전제이며, 거대한 원본 K를 실제로 물질화하거나 원본 전체 수렴을 승인하지 않았다.

## 실제 클라우드 검사와 과거 실패

[실제 전용 실행 38537364528](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38537364528)의 bridge와 native가 모두 SUCCESS다. Bridge 정확 대수·변조 테스트 6개, native 정의역·시각화 테스트 15개, 다항식 역원 테스트 6개, 자연급수 테스트 13개로 **총 40개 PASS**다. source `76b49378…`에 대한 아래 다섯 워크플로는 2026-10-14 18:05 KST 재조회에서 모두 완료 SUCCESS로 확인했다. 이전 스냅샷의 pending을 성공으로 추정하지 않았다.

| 검사 이름 | 실제 실행 | 확인 결과 |
|---|---|---|
| M3 N6 Picard native-domain bridge audit | [38537364528](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38537364528) | SUCCESS |
| MathScopeCompute CI | [38537371553](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38537371553) | SUCCESS |
| M3 gauge and fluid execution workspaces | [38537371578](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38537371578) | SUCCESS |
| MathScope research IDE checks | [38537371646](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38537371646) | SUCCESS |
| M3 P7 continuation verification | [38537371764](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38537371764) | SUCCESS |

과거 [Research IDE 실행 38534518429](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38534518429)은 `Validate preserved source and English metadata` 단계의 영문 `SOURCE_TRANSLATION_MANIFEST.json`과 expected 전체 소스 목록 불일치로 실패했다. 누락 파일 8개를 실제 최종 소스 목록에 맞춰 정리했으며, 해당 실패 당시 뒤의 회귀검사는 실행되지 않았다. 이번 [38537371646](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38537371646)에서 수정된 목록과 전체 Research IDE 워크플로가 SUCCESS다. 과거 실패 자체를 삭제하거나 수학 검증 성공으로 덮지 않았다.

## 검증 파일과 화면 QA

아래 파일 체크섬은 다운로드한 실제 아티팩트의 `checksums.txt`와 독립 재계산이 모두 일치한다. GitHub 아티팩트는 bridge ID 11880602631, native ID 11880133812다. 압축 아티팩트 digest는 기계 판독 보고서에 별도로 기록했다. 파일 바이트 SHA-256과 내부 의미론 inventory SHA-256은 구분한다.

| 실제 아티팩트 파일 | 바이트 수 | SHA-256 |
|---|---:|---|
| `native/native-domain-inventory.json` | 2,758,403 | `4bed5d7b4847a977fe4ec5150a47368376515435b31db5b57f1d3a3d0f7e543b` |
| `native/natural-series-inventory.json` | 2,487,051 | `4db44f444226d69567adcce29b711da9b0fedde2c04c578b64791296ed307dc0` |
| `native/picard-domain-view.html` | 1,427,319 | `0a86464d9c554c3c504b887b848646e5ef3c9b9fc768f2bb623890f0d924e0dc` |
| `bridge/source.json` | 19,880 | `201fb2cc69252277e2a672c3ea7bfc4a6e27ed2c0db7d7c8ac19285168d0d06d` |
| `bridge/result.json` | 1,990 | `82fb46d82e9b62bb06efa7159dcdc031e6c63ed22caa6ba873391cabdcfbbcf7` |

자연급수 의미론 inventory SHA-256은 `83c997bb3d42218f68a106393f464074efb03aa25292ec2e31335c141b6ef013`이다. 이를 위 JSON 파일 바이트 해시와 같은 식별자로 사용하지 않는다.

M3 화면에는 실제 24개 인수족, 9/148개 반경 인수 판정, 10개 조건부 상계와 4개 역원 부분 증명을 넣었다. 원본 node 상세, 검색, URL 상태, 빈 결과, 초기화, 반경 범위 필터, 데스크톱·390px 모바일 및 표의 내부 가로 스크롤을 실제 브라우저로 검사했다. 콘솔 오류와 전체 문서의 모바일 가로 넘침이 없었으며 `fullNormRemainsUnproved` 표시도 확인했다. [로컬 QA 보고서](evidence/38537364528/picard-domain-view-qa.json)의 화면 테스트는 수학 인증 재실행이 아니다.

## 기존 공개 사이트 통합 상태

사용자의 요청에 따라 [기존 v0.3.1의 M3 유체 N6 화면](https://project29770.websitepublisher.ai/v0.3.1.html#research-fluid-m3/N6)에 **Picard 자연급수 · 실제 원본 검증** 카드를 추가했다. [독립 공개 화면](https://project29770.websitepublisher.ai/m3-picard-audit.html)을 새 탭으로 여는 링크와 같은 페이지에서 펼치는 내장 보기를 함께 제공한다. 로컬 주소는 공개 페이지의 같은 출처 주소로 연결했다.

게시 이력은 기존 페이지 version 110 / `e9c6f69a`에서 **version 111 / `80a30933`**으로, 정확히 한 곳을 수정한 기록이다. 독립 공개 화면은 version 1 / `91c43792`다. 원본 producer나 Git main은 수정하지 않았다.

**2026-10-14 공개 확인:** M3 유체 N6에서 펼친 화면에 24개 함수족·157개 호출·9개 실수 Y 범위 확인·148개 미해결 및 1,288개 잔여 의무가 표시됨을 실제 Chrome으로 확인했다. 콘솔 오류는 0개였다. 공개 HTML의 내장 JSON은 인증된 클라우드 JSON과 완전히 같았다. HTML 응답 SHA-256은 `8f099dcb035d9fb387380e64046319ed385f0076ce438f75035268ac443adda2`다. [당시 내장 화면](evidence/38537364528/Picard_Live_Embedded.jpg)을 보존했다.

**2026-10-15 재개 후 확인:** 기존 N6 카드와 링크, N7에서 N6로 돌아온 뒤 카드 유지 및 펼침 동작을 확인했다. 다만 새 공개 페이지 접속은 Chrome `ERR_CONNECTION_TIMED_OUT`, Python HTTPS 재조회도 TCP 연결 시간 초과로 실패했다. 새 내장 화면의 데이터 로드와 공개 모바일 콘텐츠 검사는 완료하지 못했다. 전날의 성공과 이날의 접속 실패를 구분하며, 현재 모바일 공개 검사를 PASS로 기록하지 않는다. 이 관측만으로 전 세계 공개 서비스 장애를 증명하지는 않는다.

상세 게시·확인 기록은 [공개 확인 결과](evidence/38537364528/Picard_Public_Publication_QA.json), 실제 데이터의 공개 일치 기록은 [내장 JSON 확인](evidence/38537364528/Picard_Public_Data_Verification.json)에 있다. 로컬 실제 데이터의 데스크톱·모바일 검사는 별도 PASS이며 최신 공개 접속 검사를 대체하지 않는다.

## 이전 대화·첨부의 복구 출처

사용자가 참조한 `Picard 검증 작업 이어가기` ID `6acf3c59-5d54-83ee-b447-0d92ed49b344`의 bounded preview는 원본 대조를 위한 인수 정보로 읽었다. 그 자체를 증명으로 쓰지 않았다. 접근 가능한 이전 채팅 **M3 시각화 추가**, ID `6acea147-b0d0-83ee-a0e8-d8d457ab0ba2`의 최근 20턴을 확인했고, 실제 Picard 노름·공통 정의역과 1,288개 잔여 및 큰 원본 계산을 GitHub에서 수행하라는 사용자 방향을 회수했다. 옛 assistant 본문 중 내용 참조 placeholder만 있는 부분의 실제 문장을 복원했다고 주장하지 않으며, 해당 채팅에 메시지를 보내지 않았다.

원래 인수 ZIP을 저장소 `reference-documents/resume-20261013/MANIFEST.json`에 고정된 Git blob `581a0d8cb95156552c72cae529309a6f6791f6e3`에서 회수했고, SHA-256 `2a1d8e1ca53db437223661b0e36eb31ccf1eb0f06a08ba4ec346b754a59a6d71` 일치를 확인했다. ZIP 안의 한국어 Markdown도 읽었다. 그 문서의 10월 13일 v102·PR21·c45 상태는 과거 provenance이며, 현재 작업은 PR31과 위 코드 커밋으로 판단한다.

현재 첨부된 원 논문 `navier-stokes(7).pdf` 2,959,204 bytes는 기존 논문 pin `0e779481…`과 같고, 최신 Research IDE Blueprint 886,241 bytes는 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`과 같다. 10월 12일 M2/M3/M4 인수 문서 231,484 bytes는 `0c9bdd670d9dbd411b34bb17dcb20efac79aaefa071be877b518967919df37f1`로 확인했다. **이 바이트 동일성은 수학적 인수 완료를 뜻하지 않는다.**
