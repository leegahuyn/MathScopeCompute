# 첫 전담 실행의 엄격 검증 실패와 수정

실제 실행 https://github.com/leegahuyn/MathScopeCompute/actions/runs/38521462859
의 코드 커밋은8a82853c22e9b17e03d8954ec3970d5958bffd6d입니다.
원본 입력 준비와9개 계산 작업은 성공했습니다. 모든 작업의 stdout/stderr,
미분식,원본 항 계수,남은 항 및 실패 내역은 해당 실행의Artifacts에 있습니다.

최종 엄격 검증은실패했습니다. 새 jet 행이 원본 요청을 그대로 보존했지만
별도 필드originalSourceNodeSHA256를 기록하지 않아 기존 원본 결합 검사가
`Original jet source node hash changed`로 거부했습니다. 이 실행의 계산
성공을 수학적 인증 성공으로 해석하거나 새 완료 수를 확정하지 않습니다.

수정본은 원본 노드의 실제 JSON SHA256,원본 최소 의무,완전한 capture
감사와 실제 미분 계산 여부를 행에 기록합니다. 회귀 검사는 실제
verify_request_binding을 호출하고 원본 요청 변이도 거부합니다. 새 jet은
독립 재계산과 원본 Cartesian 식에 실제 대입까지 통과해야 집계됩니다.
PDE 대수 검증이 자원 제한 등으로 미완료이면 정규화 항 수를 인증된 수로
표시하지 않습니다. 큰 분자/분모 전체는Artifacts에 보존하고 Git에는
그 정확한 해시와 결과를 저장합니다.

첫 실행의 N6-01 OPEN/N6-02 PARTIAL과 원본56/64를 유지합니다.

후속 실행38522782830은 시작 직후 중단했습니다. 추가 검토에서 delayed
integral의 capture 방지와 lazy 비활성 분기 대수 전개의 정의역 조건을
보강할 필요를 확인했기 때문입니다. 수정본은 적분 binder를 실제로
alpha-renaming하고,분기 indicator 곱셈 전개의 추가 정의역 전제를 별도로
보존합니다. 이 조건부 전개로 얻은 zero를 원본 leaf zero로 세지 않습니다.
