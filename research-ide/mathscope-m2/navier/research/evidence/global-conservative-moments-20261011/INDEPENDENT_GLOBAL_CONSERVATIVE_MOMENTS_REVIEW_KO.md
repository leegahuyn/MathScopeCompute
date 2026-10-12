# 원래 다섯 전역 모멘트 독립 검토

2026-10-11, root의 읽기 전용 수학·source 검토다. source를 다시
실행한 기록으로 세지 않는다. 검토 대상은
`actual-global-conservative-moments.mjs`, 같은 이름의 `-kernel.mjs`,
`ACTUAL_GLOBAL_CONSERVATIVE_MOMENTS_KO.md` 및 최종 validation/실행 기록이다.

## 수학적 연결

다섯 density의 R→X 변환에서 dX=R dR, E=RF를 적용하면 각각
U, 2XF, Pi_X, 2X sum(U_i F_j), sum(U_i U_j)-X Pi_X가 된다.
각 current correction의 Jacobian과 계수 2, 마지막 pressure 부호는
독립 다항식 kernel에서 올바르게 유지된다.

실제 density가 incoming+correction과 같다는 단계와 continuous
inverse 방정식의 소거 단계를 구별한다. 원래 local cutoff,
Ipos의 F0 reserved power, Ipos에서 실제로 끝난 U0의 분기,
lower convolution의 모든 ordered pair, 실제 전체 적분 상한을
유지한다. Ipos의 M0/v0를 0으로 가정하지 않는다.

U의 confluent 행 변환은 원래 양의 lambda를 유지하는 FTC
항등식이다. 적분을 점 모멘트로 바꾸거나 lambda=0 근사를 하지
않는다. 열세 continuous matrix entry의 실제 본문과 endpoint를
각각 대조한다.

1차 weighted Omega는 pressure primitive에 단순히 X를 곱한
식이 아니다. 적분 부분적분에서 생기는 -J0/(2L), -K1/4와
-X^2 v_X를 모두 유지한다. 미분 후 남는 인자는 같은 원래
leading continuity defect이며, 실제 global M0 증명을 소비해서
소거한다. 원래 다섯 whole density로부터 만든 새 prefix라는
점을 분명히 한다. 축의 X^2 boundary, 외부 v/U의 0과 각
prefix의 전체 누적 질량을 함께 사용하므로 적분 상수를 잃지 않는다.

양의 차수 v에는 D+nu가 들어간다. nu=2nh를 누락하면
indeterminate-nu continuity kernel이 실패한다. 이 kernel은
M_X-U와 그 eta 미분을 남겨 놓으며, 실제 private primitive
증명이 연결되기 전에 미해결 defect를 버리지 않는다.

pairwise conservative kernel은 angular의 2X weight와 두
독립 차수의 합을 유지한다. time/Z의 적분 부분적분, 두 radial
viscosity boundary, pressure integration의 부호가 일관된다.
무증명 continuity를 버린 음성 대조와 다섯 번째 correction을
생략한 음성 대조는 유의미하다.

## 범위와 provenance

최종 source 실행은 n=1,2의 8/8 PASS, 관측 exit 0이다.
임의 n의 귀납 recipe와 이 유한 실행의 범위를 구별한다.
stress의 실제 forward/backward 소거와 무한 cutoff residual은
이 패킷에서 완료로 표시하지 않는다. 공개 runtime이나 Lean
실행을 추가했다고 주장하지 않는다.

원래 frozen import 37개와 validation의 49개 파일 hash는
root의 별도 checkpoint hash-review에서 현재 bytes와 대조한다.
이 문서는 그 immutable validation의 adjunct이며, 기존
validation hash를 바꾸지 않는다. 첫 실패의 원본과 다음
비교 수정의 사유도 보존되어 있다.

읽은 수식·본문 연결에서 위에 적힌 범위를 무효화하는 오류를
찾지 못했다. 이 검토는 모든 차수 실행 또는 Lean analytic
instance의 새로운 증명에 해당하지 않는다.
