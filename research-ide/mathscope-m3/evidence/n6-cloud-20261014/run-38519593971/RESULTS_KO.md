# N6 원본 소스 클라우드 계산 결과

**무조건부 인증은 미완료입니다. N6-01 OPEN / N6-02 PARTIAL, M3 56/64를 유지합니다.**

- 실제 실행: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38519593971
- 코드 커밋: `ead1c419915ca7b0a9c2f61864d38f3926de6a40`; 기준 PR29: `c143b5d8093b724d2509f8fc0ab5746c531d9e0c`.
- 원본 parent SHA256: `7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f` (3,892,594 nodes).
- 클라우드 계산 작업: 10/10 성공. 실행 성공은 수학적 인증과 별도입니다.
- 추가 jet 시도: 365/365. 원본 leaf가 정의된 영역에서 추가 계산: 128; 이 범위의 미계산 237. 전역 해석적 인증으로 승격한 jet: 0.
- 원본 잔여항 시도: 1020/1020. 성분별 유한 함수 항등식 정규화 결과: 169/197/654 (기준 169/197/654). 정규화 전후 표현 기저가 달라질 수 있으므로 항 수 증가·감소는 수학적 증명 완성률이 아닙니다.
- 원본 전역 guard 시도: 94/94. 전역 원시식 증명 35, 미해결 59.
- 원본 slow implicit root의 모든 차수 상계: 원본 source image 각 점에서 `|partial_Z^a partial_T^b s| <= 3*a!*b!*1024^(a+b)`를 균일 복소 수축사상과 Cauchy 부등식으로 도출했습니다. 전체 PDE 인수가 이 image에 들어간다는 증명은 별도 미해결입니다.
- 열 함수 혼합 미분 상계 계산: 325개, 무한적분 미분 tail 상계 25개. 모든 차수 재귀식과 명시적 cutoff 정리가 유효한 ingredient 정의역에 한정됩니다.
- 전역/무한차수 추가 상계 계산 결과: 보존됨. 원본 전체 W/M/S, Haar 모멘트, 공통 support, Rayleigh 실제 전역 envelope, Picard 실제 holomorphic 계수 노름은 독립 검증에 필요한 전제가 남아 있습니다.

각 요청의 원본 node·registry·좌표 순서·capture와 모든 잔여 단항식·실패 이유는 계산 아티팩트에 보존합니다. `CERTIFICATE_HASHES.json`은 전체 결과·stdout·stderr·음성 대조 검사 파일의 해시를 보존합니다. `OBLIGATION_MATRIX.json`은 원본 393요청·94 guard·14 전역 의무를 제거하지 않은 누적 판정표입니다.

실제 Cartesian PDE 체크포인트에 추가 적용한 jet은 128개입니다. 계산된 일반식과 실제로 반영한 항목을 별도로 기록합니다.

표준 Ubuntu hosted runner만 사용했습니다. Python 3.12.10 / Node 24.19.0, 계산별 주소공간 5 GiB / CPU 840초 제한. parent 전체와 기존 mean 8/8을 다시 생성하지 않고, Git에 보존된 ZIP과 member 영수증을 검사한 공통 체크포인트를 사용했습니다. 성공 체크포인트는 동일 구현·동일 입력 해시일 때 재사용할 수 있습니다.

Artifacts 보존 요청은 90일이며 실제 만료 시각은 `GITHUB_OBSERVATION.json`을 확인합니다. 만료 뒤에는 Git에 보존한 입력/코드로 재현해야 합니다. main·원본 producer·원본 기준·공개 사이트는 변경하지 않았으며 병합·배포하지 않았습니다.

미완료 실행: 없음.
