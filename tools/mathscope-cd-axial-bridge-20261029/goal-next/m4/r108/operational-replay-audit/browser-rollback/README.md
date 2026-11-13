# 운영 R1-08 읽기 전용 확인과 격리 복구 재현

WebsitePublisher의 운영 프로젝트 29770에서 v0.3.1.html의 버전 137, 해시 9171eb0c를 읽었다. 버전 이력은 137개이고 공급자가 tier에 포함한다고 표시한 버전은 0개다. 이력은 복구 가능성을 보장하지 않는다. 이번 조회에서 운영 HTML이나 공급자의 편집 원본을 새로 받지 않았다.

별도 Sites 후보는 소유자 계정에서 현재 버전 1, 외부 방문자 0명으로 조회됐다. 저장본 소스는 cfd810e9becc8d14680907f45013fb8e85b68654이며 공급자는 기존 배포 상태를 succeeded로 반환했다. 별도 후보의 과거 실제 게시 근거다. 이번 점검은 운영과 후보 모두 읽기 전용으로 수행했다.

## 같은 주소의 격리 복구

기존 비공개 후보 Worker 바이트를 사용해 로컬 주소 한 곳에서 후보 → 역사적 v103 기준본 → 후보 순으로 HTTP 응답을 교체했다. 후보는 28,928,002바이트이고 기준본은 28,547,605바이트다. 네 패치를 역순 적용한 기준본은 역사적 아카이브와 바이트 단위로 일치했다. 동일한 URL에서 GET·HEAD 상태 200과 no-store를 각 단계에서 확인했다. 이미 복구한 기준본에 역패치를 다시 적용한 경우와 후보 한 바이트를 바꾼 경우는 거부됐다.

같은 Chrome 탭에서도 후보의 원본 런처를 열어 M2 point를 실행했다. 기준본을 제공한 다음 새로고침하자 런처는 유지되고 후보의 작업대만 사라졌다. 후보를 다시 제공한 뒤 같은 입력을 실행했을 때 COMPLETED 상태와 입력·결과·Worker SHA256 세 개가 처음 실행과 일치했다. 격리 정책 아래의 기존 P7 연결 실패는 화면에 나타났으며 이번 동작 검사의 대상은 로컬 M2 Worker다.

운영 R1-08은 OPEN이다. 운영 범위의 패치·복구 자료와 실제 게시 후 확인이 남아 있다. 이 로컬 시험에서는 공급자 버전을 복원하지 않았다. 전체 RELEASE HOLD를 유지한다.

## 재현

~~~sh
node rehearse_archive.cjs ISOLATED/dist/server/index.js BASELINE/public-v103.html.gz \
  GOAL_NEXT/m4/r108/patches.json new-local-archive-roundtrip.json
~~~

ISOLATED는 이미 작성된 r108-isolated-site이며 BASELINE은 r107/source/docs/evidence/m4-evidence-panel-v103-20261013 디렉터리다. 끝에 새 JSON 경로를 하나 더 전달하면 loopback 주소를 그 파일에 기록하고 터미널 입력 baseline, candidate, stop을 기다린다. 새로고침 후 기존 런처로 후보 작업대를 열고 point를 실행한다.

독립 HTTP 결과는 local-archive-roundtrip.json, 공급자와 브라우저 결과는 provider-browser-readback.json에 있다.
