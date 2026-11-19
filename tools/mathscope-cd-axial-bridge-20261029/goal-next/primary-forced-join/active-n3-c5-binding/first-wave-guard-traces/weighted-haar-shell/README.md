# 원본 Signed 방사 경계의 Haar 잔차

**VERIFIED** 동일 N3 원본의 두 Haar 잔차와 자승 진폭, 공분산,
축방향 압력 피드백을 결속했다. 이 Haar 평균은 원본 두 보조각
$Y_0,Y_1$에 취한다. 실제 물리각 적분은 앞선 검증 패킷에 있다.

- [원본 진폭과 양끝 Gaussian](gaussian/README.md)
- [초기 평균과 원본 응력](mean/README.md)
- [첫 Forced 공분산](covariance/README.md)
- [축방향 압력 피드백과 독립 미분 역할](pressure/README.md)

**CONDITIONAL** 원본 초기 평균 증분을 $\mu$,
$C_{ij}=\operatorname{Haar}(W_{ij}+\mu_i\mu_j)$라 하자.
원래 Temporal의 보조 평균 0, 초기 FiveMap 지지, 원본 토러스
미분과 적분의 교환 아래, 끝점 근방의 원본 Haar 잔차는

$$
 M_\theta=(\partial_R+2/R)(C_{r\theta}-\mathrm{stress}_\theta)
                 +\varepsilon\partial_Z C_{\theta z},
$$
$$
 M_z=(\partial_R+1/R)(C_{rz}-\mathrm{stress}_z)
                 +\varepsilon\partial_Z(C_{zz}+\bar p)
$$

로 정리된다. $\bar p$의 원본 방사 입력도
$-\partial_R C_{rr}+(C_{\theta\theta}-C_{rr})/R
-\varepsilon\partial_Z C_{rz}$로 정리된다.
외부 영연장과 원본 FTC가 성립하면 압력의 순수 공분산 적분에서는
$\partial_R\partial_Z C_{rr}$를 별도로 상계할 필요가 없다.
끝점값의 $C_{rr,Z}$, 적분 안의 $C_{rr,Z},C_{\theta\theta,Z}$와
$C_{rz,ZZ}$가 남는다. 모든 상계가 같은 $\zeta$를 유지하면
양끝 Gaussian 적분 비교를 순차적으로 적용할 수 있다.

**OPEN** 이 계산을 실제 균일 경계로 바꾸려면 같은 원본에서 $C$와
필요한 도함수의 $\zeta$ 가중 상계를 확보해야 한다. $μ^2$ 항에는
초기 평균의 $\sqrt{\zeta}$ 가중 상계가 충분하지만, 실제 출력의
그 상계는 별도 증거가 필요하다. 바깥 방사 경계까지 이어지는
$\theta$ 응력의 $n=3$ 항이 남는다. 고정 적분 끝점까지의 외부 영연장,
순수 방사 1–2차와 혼합 미분, 후속 보정 및 최종 적분도 열려 있다.
N7-06과 N8-05는 수락 대기, 최종 jets는 0/67, RELEASE HOLD다.
