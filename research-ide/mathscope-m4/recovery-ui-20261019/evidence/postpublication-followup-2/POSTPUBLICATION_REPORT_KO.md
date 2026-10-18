# Followup-2 실제 운영 브라우저 검수

이 문서는 게시 전 README·동결 계획과 별개의 **게시 후 관찰**이다. 실제 관찰 원문은 `mathscope-followup2-browser-qa.json`, 파일 무결성은 `ARTIFACT_MANIFEST.json`에 저장했다. 검사 완료 시각은 **2026-10-18T23:26:28.948Z**이다.

## 게시와 검수 범위

- 실제 운영 URL을 다시 불러온 뒤 검사했다: `https://project29770.websitepublisher.ai/v0.3.1.html?r1=point#research-fluid-m3/N8`.
- 부모 실행 주체가 저장한 실제 patch 응답은 `../FOLLOWUP2_LAYOUT_PATCH_RESULT.json`, `../FOLLOWUP2_RUNTIME_PATCH_RESULT.json`이다. 각각 layout v2 / `460012fd`, runtime v2 / `fa62da96`, patches_applied=2, cache_invalidated=true다. 이 검수 실행은 원격 쓰기를 하지 않았다.
- 브라우저 뷰포트는 1363×936이다. 실제 모바일 뷰포트·기기·터치는 미검수다. 좁은 화면 CSS의 코드 준비를 실제 모바일 검사로 간주하지 않았다.
- 부모 실행의 별도 실제 HTTP 영수증 `../FOLLOWUP2_PUBLIC_BYTE_AUDIT.json`도 직접 읽었다. 23:16:27.871–23:16:38.985 UTC GET은 HTTP 200, **29,173,684바이트**, SHA-256 **`3436ed76a985ee554c889ebabddae758a09b5b385b12bc2908fd0d4f32c90135`**다. 실제 바이트가 계획과 일치하고, marker 밖의 39개 script 및 모든 바이트가 원 v117/v118과 동일하다. 12개 데이터 조각의 복원 JSON 1,139,222바이트/SHA `a0aece9bfb60d7ca3d7632c5e61c3d4f32b5a2bd495642b9517a3c0e03e23e85`도 보존됐다. 이 HTTP 검사는 브라우저 조작 검사와 구분한 별도 증거다.

## 실제 확인 결과

| 검사 | 결과와 적용 범위 | 원문 필드 |
|---|---|---|
| 새 증거 launcher | 실제 마우스 클릭으로 새 dialog가 열리고 close에 초점이 이동했다. 중심의 elementFromPoint가 자기 자신이다. bottom=76px. | `initial.launchers`, `newLauncherClick` |
| 기존 M3 launcher | 실제 마우스 클릭으로 기존 M3 dialog가 열렸다. 중심 hit가 자기 자신이며 bottom=132px다. 기존 계산·과거 데이터는 유지됐다. | `initial.launchers`, `legacyM3Click` |
| 기존 M4 launcher 및 footer | 실제 마우스 클릭으로 기존 M4 dialog가 열렸다. 왼쪽 bottom=12px 중심 hit가 자기 자신이다. 기존 I3 커널·가정 탭도 실제 반응했다. | `legacyM4Click`, `legacyM4Tab` |
| 역사 안내 3개 | main Picard와 기존 M3/M4 dialog에 각 1개가 있다. 두 dialog를 다시 열어도 총 3개, 각 1개로 유지됐다. 과거 56/64를 현재 수학 완료 수와 구별한다. | `initial.notices`, `reopenNotices` |
| 원문 항목과 현재 원장 | 총 80개의 원문 항목 버튼. M3 62/64와 N7-06·N8-05 OPEN, 실제 전역 last-resolved tau 및 에너지 null이 표시된다. | `newLauncherClick`, `conclusions` |
| M4 필터 | 실제 M4 선택 후 16개가 표시됐다. 14 PARTIAL, R1-05·R1-08 OPEN. 원래 인수 전체는 UNCONFIRMED다. | `m4Filter` |
| 키보드 | Tab이 열린 dialog 내부의 다음 항목으로 이동했다. Escape로 닫힌 뒤 새 launcher에 초점이 복귀했다. | `tabOrder`, `escapeFocus` |
| 실제 native 저장 데이터 | root 필터의 8개 행을 확인했다. 선택 행은 실제 균일 구간 enclosure의 범위를 표시하며 미계산 중심값을 0으로 만들지 않는다. | `native` |
| 실제 cutoff 시각화 | 선택 셀 3,3,4와 저장 시간·z-slice 4가 상세값에 연결됐다. SVG의 64개 셀과 원 정의역/표시 상자 구분을 확인했다. 실제 전역 에너지·tau는 null이다. | `support` |
| 출처 링크 | 실제 화면의 cutoff 전체 셀 데이터 링크를 클릭하고 cf98 고정 GitHub 파일의 JSON을 읽었다. 512개 셀, 320 exact-zero, 192 missing-field, 원래 두 의무 false, 에너지·tau null 및 run hash가 맞았다. | `actualSourceVisit` |
| 데스크톱 배치 | 브라우저에서 가로 overflow=false. 실제 3개 launcher hit와 dialog 위치를 확인하고 3장 화면을 보존했다. | `initial`, `*Screenshot` |

512개는 원래 K를 포함하는 정규화 상자 [-1,1]^3의 분할이다. 320개의 영확장 셀을 실제 전역 에너지 평가 완료 비율로 해석하지 않는다. 실제 비영 전역장의 A/b/p jet, 에너지·오차·tail 의무가 충족됐다고 표시하지 않았다.

## 콘솔과 재사용한 검증의 한계

이번 콘솔 조회의 error/warn 최대 60개 원문은 `console`에 보존했다. 새 recovery runtime의 오류는 관찰되지 않았다. 그러나 WebGL이 비활성인 이 브라우저에서 기존 Three.js 시작 오류 **3개**와 브라우저 확장 프로그램의 metadata 오류가 관찰됐다. 따라서 전체 콘솔을 무오류로 보고하지 않는다. 이번 새 cutoff 시각화는 실제로 표시된 SVG이며 WebGL에 의존하지 않는다.

기존 Taylor-Green reference Worker의 실제 완료 결과, Canvas/SVG 대체 표시, 이전 29/29 시각 회귀 검사는 `../V118_FLUID_REFERENCE_RESULT.json`, `../V118_BROWSER_QA_BEFORE_FOLLOWUP.json`, `../v118-fluid-reference.jpg`의 **원래 적용 범위**로 재사용한다. 이번 CSS 배치·역사 안내 후속 패치 뒤에 같은 Worker를 다시 실행하지 않았다. 그 reference 계산은 원래 whole-K 최종장 계산의 대용이 아니다. 전체 M4 성능·메모리 인수도 새로 충족했다고 주장하지 않는다.

## 증거 파일

- `mathscope-followup2-browser-qa.json`: 48,008바이트, SHA-256 `6631bba485cabb566e64bd4461c4ac9568283cf9b00a897307a369d97c86bdfb`
- `mathscope-followup2-current-evidence.jpg`: 현재 62/64·M4 부분 준비·tau null 표시
- `mathscope-followup2-cutoff-slice.jpg`: 실제 저장 cutoff 셀 선택과 SVG
- `mathscope-followup2-legacy.jpg`: 기존 과거 패널과 현재 원장 안내
- `ARTIFACT_MANIFEST.json`: 위 원본 4개 파일의 실제 복사 경로·크기·해시

수학 상태는 **M3 62/64, M4 원래 전체 인수 UNCONFIRMED**로 유지한다. 이 보고서는 게시·브라우저 동작의 증거이며 N7-06·N8-05나 M4 원래 조건의 수학적 완료 증거가 아니다.
