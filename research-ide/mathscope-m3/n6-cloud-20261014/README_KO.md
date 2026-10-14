# 원본 N6 cloud-only 계산

기준은 PR #29 HEAD `c143b5d8093b724d2509f8fc0ab5746c531d9e0c`입니다. 자식 브랜치 `mathscope-m3-n6-cloud-20261014`의 push가 `.github/workflows/m3-n6-cloud.yml`을 실행합니다. 저장소/ZIP/계산 아티팩트를 사용자 노트북에 받지 않아도 됩니다.

표준 Ubuntu 24.04 hosted runner에서 Python 3.12.10, Node 24.19.0으로 실행합니다. Actions 의존성은 commit SHA에 고정했습니다. 입력은 Git에 보존된 원본 ZIP과 member SHA256을 검사하여 prepare 작업에서 한 번 풉니다. 각 계산은 공통 체크포인트를 받아 사용하고 원본 3,892,594-node parent와 기존 mean 8/8을 다시 생성하지 않습니다.

- A: 365개 원본 jet 요청을 실제 registry family로 묶어 4개 작업에서 계산. 캡처·좌표 순서·정의역 전제를 보존합니다.
- B: 169/197/654개 원본 잔여항을 성분별 정확 유리수 계산. 원본 항과 모든 계수, 실패, 독립 재검산, 변조 음성 대조를 보존합니다.
- C: 94개 원본 전역 guard를 고유 source ID로 검사. 정확 파라미터 식의 부호·유한성·전역 원시함수 미분을 증명할 수 있는 경우에만 닫습니다.
- Bounds: 원본 열 함수의 혼합 미분과 무한구간 tail에 대해 모든 고정 차수에 적용되는 상계식을 도출합니다. 전체 W/M/S 상계와 원시함수 상계를 구분합니다.
- D: 원본 j0, B0=7/10, C0*=6/5, W/M/S 모든 차수, 전체 Haar 모멘트, support/tail, 독립 3성분 PDE와 정의역/오차 enclosure 의존성을 검사합니다. 실행 성공이나 JSON 완료 표시는 증명으로 인정하지 않습니다.

계산별 주소공간 5 GiB, CPU 840초, 최대 동시 작업 4개입니다. stdout/stderr와 영수증은 성공·실패 모두 `if: always()`로 업로드합니다. 체크포인트와 완료 shard 재사용은 입력·구현·영수증 해시가 일치할 때만 가능합니다. workflow_dispatch를 사용할 수 있는 환경에서는 `resume_run_id`로 이전 실행을 지정할 수 있습니다. 기본 경로는 자식 브랜치 push 실행입니다.

Actions 아티팩트 보존 기간은 90일입니다. 결과·판정표·모든 증명/로그 파일 해시·실제 artifact 만료 시각은 같은 자식 브랜치 evidence 아래에 커밋합니다. 큰 계산 결과는 아티팩트 만료 후 Git의 입력과 코드로 재현해야 합니다. 실패한 shard도 판정표에서 제거하지 않습니다.

원본 producer, 원본 criteria/progress 56/64, main, 공개 사이트는 보호합니다. 병합·배포는 수행하지 않습니다. 실제 실행 결과는 `research-ide/mathscope-m3/evidence/n6-cloud-20261014/run-<ID>/RESULTS_KO.md`를 확인합니다.
