# 실제 Signed의 바깥 방사 적분과 미분 외피

**VERIFIED.** 원본 C83의 두 방사 적분과 여섯 Signed 포텐셜을 C85의 실제 $n=1$ 각응력 상계식에 대입했다. C85에서 전체 각 모멘트와 독립적으로 소거된 원본 적분항은 여기서도 나타나지 않는다. 조건을 적용할 수 있는 방사 범위와 미분 차수별 역거듭제곱은 유리수로 검증했다.

$x$를 가까운 방사 경계까지의 로그 거리, $D=\log(X_b/X_a)$를 두 경계 사이 거리로 두고
$g(x)=\exp(-a/x^2-b/(D-x)^2)x^{-p}$라 하자.
$0<x\le d<D$ 및
$p d^2+2b(d/(D-d))^3\le a$일 때 $(\log g)'(x)\ge a/d^3$이다.
따라서 $g(x)\le g(d)\exp(-a(d-x)/d^3)$이고
$\int_0^d g\le d^3g(d)/a$다. 이 비교에는 두 Gaussian 인자가 그대로 들어간다.
바깥쪽은 $a=4$, $b=t_1^2$이며 원본의 $D>2$, $t_1<1/128$을 사용하면 $0<d\le1/4$에서 $0\le p\le63$에 대한 조건이 성립한다.

**CONDITIONAL.** 원본 적분의 외부 영연장과 변수 변환이 성립하면, 두 원본 Signed 적분에서 방사 가중치 $(r/R)^w$, $w=2,1$과 야코비안 $r/2$를 포함해
$\lvert\Sigma\rvert\le C_0 R_{\max}^{w+1}\zeta(d)d^{3-p}/(2R_{\min}^wa)$이다.
여기서 $C_0$은 원본 Haar 잔차 기여의 값에 대한 계수다. $R_{\min}, R_{\max}$는 같은 짧은 적분 구간의 방사 하한과 상한이다.
고정 끝점까지의 원본 전체 모멘트 보정이 바깥쪽에서 $\chi=1$을 취하므로 이 짧은 적분으로 정확히 바뀐다.

| 실제 $n=1$ 각응력의 기여 | 방사 0차 | 방사 1차 | 방사 2차 | 방사 3차 |
| --- | ---: | ---: | ---: | ---: |
| 국소 Haar 잔차의 $\zeta$ 역거듭제곱 | 6 | 9 | 12 | |
| $\Sigma_\theta$의 $\zeta$ 역거듭제곱 | 3 | 6 | 9 | 12 |
| Signed 포텐셜의 $\sqrt{\zeta}$ 역거듭제곱 | $3/2$ | $9/2$ | $15/2$ | $21/2$ |

마지막 줄은 같은 실제 차트의 양의 진폭이 원본 끝점 형태
$e^{-2/d^2}d^{-3/2}\sqrt{W}$를 가지며 나머지 계수와 $1/\sqrt W$의
0–3차 방사 미분이 유계라는 조건을 쓴다. 역진폭 몫의 미분은
$e^{2/d^2}d^{3/2-3j}P_j(d^2)$이고 $P_j$ 네 개와 원본 $\Sigma$의
유리수 미분 계수를 대조했다. 각 줄의 마지막 상계는 원래 Gaussian에서
유한 역거듭제곱을 흡수하므로 0–3차 모두 $O(d^2)$이다.

**OPEN.** 같은 실제 차트의 진폭 결속과 계수 미분의 균일 상계,
전체 원본 Haar 잔차, 혼합 미분과 최종장 jet 값이 남는다.
이 계산은 원본 활성 각응력의 한 기여에 적용된다.
최종 jets 0/67 및 RELEASE HOLD다.

## 실제 각응력의 전체 모멘트

원본 차수 1 컴파일러에서 `#117048`의 전체 적분 `#117072`를 재실행했다.
비교한 원본 경계는 `#28814`에서 `#28826`이다.
같은 원본 차수 1의 축방향 전체 적분은 `#117075`이며
축방향 피적분함수는 `#117047`이다.
활성 그래프에서 같은 117,100개 원본 노드와 참조한 네이티브 등록을
대조했다. 두 피적분함수의 \([X,\eta]\) 형식 인자와 본문은 같고
재귀 구현은 기존 함수 전개 메서드를 상속한다. 두 미분 허용 한도는
원본 \([4,6]\)에서 활성 등록 \([128,128]\)로 확대되었다.

\[
\begin{aligned}
I_0(\eta)&=\int_0^\infty 2X[F_0(X,\eta)-C X^{-1-h}]\,dX,\\
J_\theta&=\overline T_{1+h}m_{1,2}
+\overline Z_{1/2}m_{1,4}
-\overline Z_{1/2}\overline Z_{1-h}I_0 .
\end{aligned}
\]

같은 원본의 연속 역행렬이 두 현재 모멘트를 복원한다. 선도항에서는
열 부채와 I2 상쇄에 더해 원본 A.2 재설정, A.13 대기·종결과
B8/I1 복원을 보존했다. 실제 \(m_{1,2}=m_{1,4}=0\)이어도
\(I_0=1\)인 대조식은 \(\eta=0\)에서 \(-2(1-h)\)를 남긴다.

바깥 꼬리에는 \(F_0=C X^{-1-h}H(2(1-\eta^2)/X)\)를 그대로 쓴다.
\(|\eta|\le1\)과 \(0<h<1\)에서 Laplace 적분의 두 미분은
\(\lvert H'\rvert\le2\), \(\lvert H''\rvert\le12\)다.
따라서 같은 \(2X\) 가중 피적분함수와 그 \(\eta\) 1·2차 미분은
각각 \(8,16,400\)에 \(\lvert C\rvert X^{-1-h}\)를 곱한 공통 형태의
꼬리 상계를 가진다. \(\eta=\pm1\)에서는 안쪽 미분을 사용한다.
원래 좌표의 \(C X^{-1-h}\) 차감항은 고정 물리 멱법칙이어서
축방향 미분이 0이다.

**CONDITIONAL.** 같은 원본 네이티브 함수의 보통 미분, 유한 구간의
미분 지배와 각 접합에서의 경계값을 쓰면 원본 \(J_\theta=0\)이고
전방·후방 \(\theta\) 응력이 일치한다. 실제 \(n=2\) 이상의 네이티브
재귀에 대한 판정은 이전 증거 범위를 유지한다.

초기 Temporal을 따로 대조하면 원본 응력은 \(E-\langle E\rangle\)에서
상쇄된다. 실제 이동 압력 적분의 \(Z,T,Y\) 독립 이동과 남는
공분산 항은 별도 재현 코드로 확인했다. [초기 Temporal](initial-temporal/README.md).

Python 재현에는 C83–85 원본 영수증과 C30에 보존한 원본 런타임을 사용한다.
짧은 적분의 \(d^3\) 이득 정리는 GitHub에서 컴파일했고 두 실행의
산출 로그를 함께 보존했다. [GitHub Lean](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44621136369).

```text
python -B verify_signed_cubic_transfer.py --goal GOAL --runtime ORIGINAL_RUNTIME --out NEW_JSON
node replay_original_angular_cancellation.mjs ORIGINAL_RUNTIME ORIGINAL_JSON
python -B verify_original_angular_eta.py --goal GOAL --artifact HOSTED --cache CACHE --original ORIGINAL_JSON --out NEW_ETA_JSON
```
