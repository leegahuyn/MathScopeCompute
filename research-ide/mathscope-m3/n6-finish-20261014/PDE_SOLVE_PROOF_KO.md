# 원본 PDE 잔여 1,020항 전담 계산

이 작업은 이전 지수함수 곱 정규화의 PASS를 다시 세지 않는다. 원본 direct roots3825257/3825259/3825261과 assembled roots3825348/3825349/3825350의 차이에서 남은 169/197/654항을 정확히 입력으로 삼는다. 각 항의 원본 번호, 유리계수, source ID, 거듭제곱, 새 수식 root, 실패 이유를 전부 보존한다.

새 규칙은 실제 registry의 defining body를 연다. 원본에 저장된 미분 순서를 formal parameter 순서대로 먼저 적용하고, 그 뒤에 완전한 실제 인수 tuple을 **동시에** 대입한다. 외부 Cartesian 검사에서 닫힌 128개 result ID를 별도 source basis에 끼워 넣지 않는다.

각 원본 source 미분을 두 방법으로 계산한다. 첫 번째는 product/chain rule을 한 방향씩 적용한다. 두 번째는 subset으로 색인한 혼합 Taylor jet과 set partition에 대한 고차 chain rule을 쓴다. 두 계산은 미분 구현을 공유하지 않는다. 등록 함수의 body/parameter/actual argument 결합과 capture audit는 원본 hash에 묶인다. 완전한 defining body에 첫 저장 미분 방향이 전혀 나타나지 않으면 그 미분과 이후의 0 미분은 정확히 0이다. 나중 방향이 없다는 이유로 앞서 미입증인 미분을 없애지 않는다.

일반 inverse/exp/log/sqrt/sin/cos 및 원본 flat-step의 입증된 모든 차수 chain rule만 실행한다. 실제 indexed/Fourier/Picard/Volterra/적분/flat join 값이 요청 방향으로 변하면 필요한 해석적 미분 보조정리가 없는 경우 원본 atom을 그대로 남긴다. 값을 0으로 추측하거나 형식적인 미계산 미분을 답으로 바꾸지 않는다.

추가로 실제 indexed field의 162개 행을 **전부** 여는 물리적 theta fiber 규칙을 적용한다. 모든 다른 local 인수·계수·원본 guard가 theta에 실제로 의존하지 않는지 전수 확인하고, theta actual argument와 source Jacobian이 정확히 identity인지 확인한다. 그때 순수 theta 미분과 0차 값을 전체 유한 합으로 바꿀 수 있다. slow label/copy를 상수로 가정하지 않는다. 각 원본 `choose(x,l,r,0,f,0)`는 정확한 열린 구간 indicator와 f의 곱으로 표현하여 양 끝점의 원본 0도 유지한다. 비theta 혼합 미분과 theta에 변하는 selector는 거절한다. ordinary와 Taylor 방법이 각 local body를 별도로 미분하므로 다른 출처의 Cartesian result를 원본 atom 대신 넣지 않는다.

별도의 JavaScript BigInt 유리함수 검증기는 원본 모든 항의 유리계수와 인수 결합으로 전체 circuit을 다시 조립한다. 두 미분 circuit이 같은지 확인하고, 정확한 분자와 공통 분모를 전개한다. 모든 남은 monomial/계수/분모를 내보낸 뒤 원래 circuit과 `N/D`를 다시 비교한다. 원본 계수 변경·항 누락·source hash 변경·인수 차수 변경·해석적 승격의 다섯 변이와 수식/분자에 `+1`을 넣는 두 변이를 거절해야 한다.

미분 계산은 일반 atom당 6초, indexed atom당 최대 30초, 전체 body 전개 240초, 전체 circuit350,000 nodes, 정규화 분자50,000항/곱5,000,000회의 유한 예산을 사용한다. 예산을 넘으면 원본 atom과 모든 미시도를 보존하고 정확한 정지 이유를 기록한다. 계산 완료가 모든 원본 함수의 존재·전역 정의역·W/M/S·지지·Haar 모멘트·반올림/꼬리 오차 enclosure의 완료를 뜻하지 않는다. 따라서 source가 실제 전역에서 정의된다는 전체 증명이 없는 한 analyticallyDischargedTerms는 0이고 N6-01 OPEN·N6-02 PARTIAL을 유지한다.
