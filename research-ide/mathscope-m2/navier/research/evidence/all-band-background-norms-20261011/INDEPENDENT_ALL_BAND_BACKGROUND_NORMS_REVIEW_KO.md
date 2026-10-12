# 모든 band 배경장 C_m 경계 독립 검토

검토일: 2026-10-11. 검토자: `/root`. 구현 담당자 `/root/ns_proof_audit`와 별도로 생성자, 정확한 slow 미분 kernel, 실제 source test 및 관측 process 기록을 읽었다. 이 문서는 새로운 source 실행 또는 Lean kernel 실행 기록이 아니다.

## 판정과 범위

**명시된 범위에서 수학적 연결을 승인한다.** 원래 full F0의 heat·I2 보정항과 full U0를 보존한 모든 고정 유한 차수의 slow norm 생성 절차다. 실제 실행한 차수는 m=2이며 C0, C1, C2와 Gaussian B0만 발급했다. 이 실행 자체를 모든 차수의 그래프 실행이나 모든 H의 양의성 증명으로 해석하지 않는다.

검토한 source module SHA256은 `f3e0fc5058173d9bd42e20b1fd3b57aba873610247ceb9ba71cf28fab6b397ce`, kernel SHA256은 `384daafdcb5cad2e57b4bbb0440bc4b2e4a5912b4835e2d7510c21301a44ff15`다. 실제 source receipt SHA256은 `31a6b836a38e8f4482801478d29cc091a30129e7642d9b30b75460b2f3aedd42`다.

## 확인한 수학

1. 원래 좌표변환 R=sqrt(2sX), Z=s^D eta, T=s(1-eta^2)를 직접 미분한다. 역 Jacobian의 9개 값과 profile basis의 9개 교환자 검사는 같은 양의 h를 사용한다. profile basis는 s partial_s, partial_X, partial_eta이며 서로 교환한다.
2. 고차 미분은 D_i(c P_beta)=(D_i c)P_beta+sum_j c a_ij P_(beta+e_j)를 적용한다. 비상수 계수의 미분을 매번 남기므로 2차·혼합 미분에서 역좌표 계수가 누락되지 않는다. leading multiplier s^(-A-1/2), s^(-A)와 양의 차수 angular 변환의 1/sqrt(2X)도 포함한다.
3. 원래 leading shared expression의 body를 직접 materialize하여 full heat F0 및 원래 U0와 일치시킨다. raw X/eta jet의 2차원 FTC와 좌표 계수의 3차원 FTC는 고정된 s∈[1/2,2], X∈[Xa/2,2Xb], eta∈[-1,1]에서 상수를 만든다. 유한 적분 상수는 수치 근사로 바꾸지 않는다.
4. 원래 heat 함수의 j차 미분은 양의 Gamma 적분으로부터 |H^(j)(z)|≤(h)_j(1+h)_j≤j!(j+1)! (z≥0, 0<h<1)을 갖는다. eta=±1에서는 T≥0 쪽의 연속 미분을 사용한다. I2의 실제 contraction root는 미분 Jacobian norm≤1/4, 역행렬 bound≤4/3으로 모든 고정 차수 implicit 미분을 갖는다. 유한 반복값을 root로 선언하지 않는다.
5. 실제 n1과 n2를 포함한 finite block 및 그 이후 원래 대각 tail을 모두 유지한다. q=Q s, epsilon=Q^h이므로 q^(2h)≤4 epsilon^2가 양의 correction의 proximity bound에 사용된다. q나 Q를 slow 미분의 독립 변수로 바꾸지 않는다.
6. b_n≥c_n으로 원래 cutoff scale을 늘려도 Euler cutoff 미분의 상수는 변하지 않는다. q>0의 compact 집합에서는 b_n≥2^n에 의해 활성 항이 유한하다. 따라서 같은 finite-block/tail 증명은 이후 한 공통 cutoff 수열을 선택할 때 재사용할 수 있다.

## 실행 증거와 남은 결속

[관측 process 기록](actual-all-band-background-norms-source-attempt1-process.json)은 exit0, 20.621초, 최대 RSS 2,399,522,816 bytes를 기록한다. 실제 source 7/7과 내부 11개 확인이 통과했다. 실행 전후 module/test 바이트가 같은지도 기록에 남겼다.

후속 Gaussian m차 ledger가 C_(m+2) 또는 C_(m+3)를 요구하면 그 차수의 실제 생성 절차를 호출해야 한다. 현재 C2를 고차 상수로 간주할 수 없다. 같은 cutoff의 전체 H·가중치·전체 물리 curl과 물리 잔차는 별도 결속 의무다. 따라서 이 검토로 G-POS, G-N4, G-N5 또는 전체 M2를 승격하지 않는다.
