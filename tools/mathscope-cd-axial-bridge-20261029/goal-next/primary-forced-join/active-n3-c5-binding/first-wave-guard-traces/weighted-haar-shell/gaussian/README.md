# Signed의 두 원본 진폭과 방사 Gaussian 적분

## VERIFIED

원본 실행 44582875351에서 $X=R^2/(2s)$, $\eta=Z/s^{1/2-h}$,
$s$의 bracket $[1/2,2]$를 읽었다. 두 목표 성분은 원본 registry
32017과 32018에 같은 실제 $(X,\eta)$를 전달하며, 공통 차트 배율은
$s^{-A-1/2}$이다. 실제 펄스 적분 네 개가 행렬 $H$의 네 성분이다.
원래 행렬식 인자를 유지한 정확 산술에서 두 진폭 제곱값
`#17733801`, `#17733805`는 $Hy=\bar T$를 만족한다.
Signed가 나누는 양의 제곱근은 `#17733826`, `#17733827`이다.

원본 Gaussian은 $\zeta=\exp(-t_1^2/x_a^2-4/x_b^2)$이다.
$x_a=\log(X/X_a)$, $x_b=\log(X_b/X)$이며, $t_1$은 원본 인자
`#3612`이다. $\mathrm{width}=x_a+x_b$는 고정이다. 가까운 끝점 거리를
$x$로 쓰면 반대쪽 거리는 $\mathrm{width}-x$이다. 가까운 쪽과
반대쪽 Gaussian 계수 $(a,b)$는 각각 $(t_1^2,4)$ 또는 $(4,t_1^2)$다.

## CONDITIONAL

가까운 끝점에서 현재 점까지 $0<x\le d$이고
$p d^2+2b(d/(\mathrm{width}-d))^3\le 2a$이면
$x^{-p}\zeta(x)$는 증가한다. 양쪽 Gaussian을 유지한 채
$d^{-p}\zeta(d)$로 적분 전체를 제어할 수 있다. 예를 들어
$d\le\min(1,\mathrm{width}/2, a/(p+1), \mathrm{width}a/[16(a+b)])$
이면 충분하다. 이때 $p d^2\le a$이고 반대쪽 계수는
$2b(d/(\mathrm{width}-d))^3\le16b(d/\mathrm{width})^3\le a$이다.

원본 고정 적분 범위는 $[\sqrt{X_a},2\sqrt{X_b}]$다. 움직이는
물리 shell은 $[R_a,R_b]=[\sqrt{2sX_a},\sqrt{2sX_b}]$이다.
가까운 끝점부터 로그 거리를 쓰면 $R_x=R_a e^{x/2}$ 또는
$R_x=R_b e^{-x/2}$이고 절대 Jacobian은 $R_x/2$이다.
원본의 $R^{-w}$ 및 적분의 $R_x^w$를 함께 유지하면
$C\zeta(d)d^{-p}$에 곱할 계수가 다음과 같다.

| 가까운 경계 | 원본 방사 질량 |
| --- | --- |
| 안쪽 | $R/(w+1)\,[1-e^{-(w+1)d/2}]$ |
| 바깥쪽 | $R/(w+1)\,[e^{(w+1)d/2}-1]$ |

원본 Signed의 두 적분은 $w=2,1$이고 압력에는 $w=0$을 쓴다.
원본이 움직이는 shell 바깥에서 0이고 정칙하게 적분된다는 전제가
필요하다. 고정 끝점과 움직이는 끝점 사이에 상수 입력 1을 남긴
대조 예에서는 $R=2$에서 각각 $3/4$와 $7/12$가 남는다.

같은 원본 $H^{-1}$의 순수 방사 0–3차 상계와 기존 원본
$\bar T$의 $\zeta$ 가중 상계가 확보되면 정확 Leibniz 합으로
두 $y$에 같은 가중치를 옮길 수 있다. 이 재현은 실제 operands를
결속한다. 실제 Haar 잔차의 가중 상계와 shell 바깥 영연장은
별개의 현재 입력이다.

```text
python -B check_gaussian_shell.py --goal GOAL_NEXT --artifact HOSTED_ARTIFACT --cache LOCAL_CACHE --runtime ORIGINAL_RUNTIME --out NEW_JSON
```

이 재현의 `ORIGINAL_RUNTIME`에는 원본 SHA로 고정한 세 M2 소스 모듈이 필요하다.
