# 원본 PDE 회로 재사용: 정확한 인수 보존 검산

실행: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38525128679  
코드: `f5d00cc6b7fcc6604e7b02648dca8023becc1688`. 원본 미분 회로는 run38523108728에서 생성한 SHA256 영수증을 재검증해 클라우드 안에서 재사용했습니다. 사용자 노트북에 저장소·ZIP·아티팩트를 받지 않았습니다.

원본169/197/654항,총1020항의 계수·source node·registry 결합을 다시 검사했습니다. 조건부 유리식 분자의 독립 검산 완료 항 수는 **미인증/미인증/미인증**입니다. 이는 전개 뒤 남은 단항식 수이며 원본 PDE가0이라는 뜻이 아닙니다. 전체 단항식·분모·변이 검사·stdout/stderr·자원 중단은Artifacts와 CERTIFICATE_HASHES.json에 보존합니다.

이전의 공통 분모 전체 전개 때문에 발생한 곱셈 폭증을 피하고,각 정확한 분모 인수를 음의 정수 거듭제곱으로 유지한 유리식으로 원래 식과의 차를 검산했습니다. 원본 producer와 미분 계산을 반복하지 않았습니다. 분기 밖 피연산자·분모 정의역 같은 추가 전제는 유지하며 조건부 대수와 원본 해석적 항등식을 구분합니다.

새 jet7개를 독립 재계산·원본 Cartesian 식에 적용하고 guard17개를 증명한 이전 결과를 보존합니다. **남은 jet230개,guard41개,원본 전역 PDE 인증 대상1020항입니다. N6-01 OPEN/N6-02 PARTIAL,M3 56/64를 유지합니다.** 원본 전역 image/공통 support,전체 W/M/S·Haar,실제 Picard 계수 노름과 source 함수 동일성,전체3D PDE/정의역·오차 enclosure는 아직 완료되지 않았습니다.

표준 Ubuntu hosted runner,Python3.12/Node24를 사용했습니다. 과금 runner·병합·배포를 사용하지 않았습니다. Artifacts 보존90일이며 실제 만료시각과 digest는 GITHUB_OBSERVATION.json에 기록합니다. 작업별 결과: `[{"component": 0, "status": "EXACT_ALGEBRA_STOP", "elapsedSeconds": 80.94356963300001, "nodeResourceFailure": null, "receiptSHA256": "8044e239f657b8c7a2081132671b52d40c8dddc806dbada1d9ffbdc76637a5cc"}, {"component": 1, "status": "EXACT_ALGEBRA_STOP", "elapsedSeconds": 120.45092368200002, "nodeResourceFailure": null, "receiptSHA256": "573f6bbc13807612523c12efa75b2073785ac8cd88daa044ec1363943779f93b"}, {"component": 2, "status": "EXACT_ALGEBRA_STOP", "elapsedSeconds": 180.069584497, "nodeResourceFailure": null, "receiptSHA256": "150a96ec5d819bf96a1a5b010e15470fa09ced06516fe06028aee196fb24b183"}]`.
