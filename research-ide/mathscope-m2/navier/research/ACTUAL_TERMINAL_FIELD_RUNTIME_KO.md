# 원래 terminal F의 실행·표시 연결 — 0.3.11 공개 검증

`ns.actual-terminal-field-scaled-enclosure`는 기존에 검증된
`actual-terminal-field-scaled-enclosure.mjs`의 prepare 함수와 private certificate
생성 함수를 실행한다. 원래 완성된 F의 지정점과 R/Z/T 1차·2차 도함수,
원래 step·heat·slow 배율 및 양의 B·h를 유지한다. 이 연결에서 수학 source
모듈을 변경하지 않았다.

## 요청과 정밀도

입력은 `sourceProfile`, `precisionBits`, 정확한 유리수 문자열 `tolerance`,
`maxTerms` 네 항목이다. h, B, heat 입력, 좌표, 다른 label, caller 계수 및
별도 heat 허용 폭을 받을 수 없다. 기본 예제는 192 bits, 계수 허용 폭
`1/10000000000000000000000000000000000000000`, 최대 128항이다.

원래 field 생성자의 조건을 그대로 사전 검사한다.

- 완전한 각 계수의 허용 폭은 `2^(-(bits-48))` 이상이다.
- heat 계수에는 field 허용 폭의 `1/1048576`을 전달한다.
- 내부 heat moment에는 다시 `1/64`를 전달한다.
- 두 내부 허용 폭도 heat 산술 하한 `2^(-(bits-16))`을 만족하는지 검사한다.
- 모든 비교는 BigInt 유리수이다. 전체 원래 값의 상대 정밀도를 약속하지 않는다.

잘못된 입력, 정밀도 부족, 허용 작업량 부족은 source 그래프 할당 전에
각각 FAILED, PRECISION_REQUIRED, BUDGET_EXCEEDED로 반환한다.

## 네 표

| 표 | 표시 내용 |
|---|---|
| `terminal-field-coefficient-intervals` | F와 아홉 도함수의 정확한 계수 하한·상한·폭 |
| `terminal-field-positive-scales` | 원래 인자, 엄격한 거듭제곱 상한, 부호, 원래 값의 유리수 구간 |
| `terminal-field-error-budget` | field·heat·moment 허용 폭, 정밀도, step Taylor 잔여항, D0·D1·D2의 분리된 잔여항·산술 폭 |
| `terminal-field-completion-scope` | 원본 certificate의 완료 범위와 미완료 범위 |

각 실제 값에는 정확한 원본 JSON 경로를 연결한다. 화면에서 행 수를 줄여도
원본과 유리수 문자열을 변경하지 않는다. 비영 행의 원래 값 구간 끝점 0은
경계이며, 원래 인자를 0으로 바꾸지 않는다. Z·RZ·ZT의 정확한 0과 실제로
남는 ZZ를 구별한다. 이 결과는 지정점
`X=Xb*exp(-1/4), eta=0, s=1`에 한정된다.

## 수행한 검사와 실제 실행

2026-10-11의 새 runtime 4개, 새 view 4개, 기존 heat 회귀 5개가 모두
통과했다. 총 **13/13**, 도구에서 관측한 프로세스 종료 코드는 **0**이다.
96/192/512 bits의 정확한 경계값과 한 단계 더 좁은 허용 폭, 중첩 heat
허용 폭, 허용되지 않은 매개변수 치환, stale·실패·불완전 결과, 전체 원본
셀 경로, 긴 유리수 보존, 선택된 네 view와 결정적인 행 축소를 검사했다.
workspace 문법 검사도 관측 종료 코드 0이다.

실행 명령과 변경 파일 해시는
`evidence/terminal-field-runtime-20261011/preflight-and-views-attempt1.json`에
있다. 기존 terminal source2 certificate는 이 검사에서 **표시 fixture로만**
읽었다. 새 source 계산이나 private 인증을 발급한 것으로 취급하지 않는다.

이어 실제 source 계산과 빌드된 Worker를 각각 실행했다. 두 프로세스의
관측 종료 코드는 모두 **0**이며 각각 **18.818초**, **18.568초**에 끝났다.
두 결과는 `COMPLETED`, 원래 source 검사 **10/10**, 동일한 수학 결과
SHA-256 `706f2e6d0f92db6a4ff5b2b667fb9567a732ee4da422bc8f0286b3db262bd742`
를 반환했다. 실제 원본 certificate와 네 표의 **129개 값 셀**을 비교했다.
29개 항목명 셀은 표시용이며 원본 수치 경로가 있다는 주장에 포함하지 않는다.

공개 페이지 `https://project29770.websitepublisher.ai/v0.3.1.html#research-m2/ns`
에도 반영했다. 78번 페이지에서는 수치 129개가 일치했지만 긴 유리수가
가로로 잘리는 문제가 관측됐다. 이 시도의 화면과 기록을 보존하고 두 CSS
규칙만 고쳤다. **79번 페이지 / `596b9751`**에서 새 실행
`m2-job:mv3rzju8:1`이 다시 `COMPLETED`로 끝났으며 source·Worker와 같은
수학 결과 해시를 반환했다. 네 표의 10·10·17·12행이 앞서 검증한 원본과
전부 일치했고, 각 표와 감싸는 영역의 표시 폭·내용 폭은 모두 586px였다.
긴 유리수는 `pre-wrap`과 `overflow-wrap:anywhere`로 줄을 바꿔 표시한다.

검증된 Worker SHA-256은
`a845abd6c35b2f00f95e806c4ce3ddf856720bf7c86b2442e8e2cbc0f9908a3b`,
workspace bundle SHA-256은
`9a80d655824c0a07bd2eb35b0cd2233c7af4aabfc662d72df21ee6311b0fd324`
이다. CSS 수정 전후 이 두 파일과 수학 source 바이트는 같았다.
78→79 수정의 원격 확인은 공급자의 버전·해시와 실제 브라우저 관측이다.
79번 전체 HTML을 다시 내려받아 바이트 단위로 대조했다는 뜻은 아니다.

프로세스 실행 기록은 `attempt1-source-process.json`,
`attempt1-worker-process.json`, 공개 실행과 수치 셀 대조는
`browser-verification.json`, CSS 보완 후 재실행과 폭 검사는
`browser-v79-verification.json`에 있다. 모두 같은 evidence 폴더에 보관한다.
최종 실제 화면은 `terminal-field-public-v79-wrapped-table.jpg`이다.

이 실행 기록은 전역 F나 pulse·공분산의 수치 구간, M2 전체 완료 또는
M3 시작을 선언하지 않는다.
