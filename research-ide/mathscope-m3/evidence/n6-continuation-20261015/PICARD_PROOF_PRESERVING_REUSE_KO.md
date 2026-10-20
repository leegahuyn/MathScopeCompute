# Picard0에서 실제 원본 의무까지의 증명 보존형 재사용

원본 의무1260개 ID, 정량 상수, 허용 정의역, 순서 있는 미분 및 PDE 계수를
그대로 유지한다. 36개 범위 검증이 모두 통과한 run38726706597의 원본
잔여는10/230/1020이었다. 검증 수와 원본 소거 수를 구분한다.

Picard0 재검토는 독립 natural/P0/g 입력, 실제 계수 생성자, B의 별도 AST,
두 solutionNorm 필드, 정확한 원래 K조건을 연결한다. 값 tube delta/8와
추가 도함수 tube delta/16을 구분하고, Taylor 겹침·균일성을 명시한다.
원본 저장 K는 저장된 eta 차수/정밀도에 해당하며 다른 모든 차수에 같은
정밀도를 보장한다고 주장하지 않는다.

consumer 도구는 모든 원본 ID에서 실제 native 본문의 AST 경로를 찾는다.
body/A0/A1/forcing/행의 실제 인자/정적분/역연산 등을 검토된 필드로만
연결하며 메타데이터 정수를 node로 읽지 않는다. 값 경로와 노름·guard
계약 경로를 구분한다. 실제 인자 치환이 정리의 collar에 들어오는지,
역수/암시적 Jacobian 비소멸, Fourier 분모와 주기성 등은 별도 전제다.

application audit은 동일 원본 그래프와 Picard 영수증의 해시를 대조하고
Guard/Jet/PDE 각 ID에 남은 전제를 기록한다. 단순 도달 경로는 PASS가
아니다. 배경26개는 별도의 실제 body/순서 미분 증명이 완성된 경우에만
가져오며, 원래 요구14개를 줄이거나 whole-g 결론으로 승격하지 않는다.

PDE 각 성분에는 정확한 원본 계수·인자 목록과 coupled residual을
연결한다. 독립 증분 항등식은 비선형 제곱과 교차항, cutoff curl 및
동일 강제항을 유지한다. 실제 전체 필드의 직접 평가·조립식 동등성과
flat join 전제가 남은 성분은 OPEN이며 개별 monomial을0으로 선언하지 않는다.

10x24 gate는 같은 실제 leading 함수의 유한 혼합 미분 상계만 추가한다.
현재 n1 계수/auxiliary 정량 상계, 전체 Bnorm 지배, H determinant/양의
weight, 모든 higher prefix의 수치 조건과 전체 complete_gr는 별도다.
새 코드의 실제 실행 결과를 확인하기 전 원본 잔여를 낮추지 않는다.
