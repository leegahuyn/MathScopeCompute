# Signed 방사 경계의 축방향 압력 피드백

## VERIFIED

원본 축방향 잔차 `#22000445`는 $\varepsilon p_Z$ 항
`#22000444`를 가진다. 실제 $p_Z$의 두 적분은 같은
$g_{r,Z}-\partial_Z(\rho P)$ 원본 피적분함수를 쓰며, 왼쪽 적분과
전체 적분의 위끝이 각각 현재 방사점과 고정 바깥 끝점이다.
실제 $-\chi_Z$ 곱미분 항도 남긴다. 정규화 범프 및 그 $Z$ 도함수에
같은 이동 지지가 있음을 확인했다. 원본 두 보조각 이동은 $Z,T$와
보조각 자체에 독립이다.

실제 $g_r$ 정의의 공분산 인자 여섯 개를 정확 산술로 비교했다.
$rr$에는 방사 미분, 두 빠른 도함수 및 $-1/R$ 항,
$rz$에는 $-\varepsilon\partial_Z$, $\theta\theta$에는
$+1/R$가 붙는다.

## CONDITIONAL

원본 보조각 주기성, 적분과 $Z$ 미분의 교환, 원본 외부 영연장에서
보조 Haar 평균을 취하면 빠른 미분이 소거된다. $\chi$가 0인 안쪽
경계에서는 고정 안쪽 끝점부터 현재 점까지, $\chi=1$인 바깥 경계에서는
현재 점부터 고정 바깥 끝점까지의 적분에 음의 부호를 붙인다.
$\rho=\rho_Z=\chi_Z=0$인 해당 짧은 구간을 사용한다.

원래 $-\partial_R\partial_Z\overline{W}_{rr}$를 적분하면
양쪽 모두 $-\partial_Z\overline{W}_{rr}(R)$가 남는다.
따라서 이 공분산 압력 기여에 필요한 독립 가중 미분은
$\overline{W}_{rr,Z}$, $\overline{W}_{\theta\theta,Z}$,
$\overline{W}_{rz,ZZ}$이다. 앞 두 도함수는 반경 역수와,
마지막은 원본 $\varepsilon$과 조합한다. 실제 원본의 압력 평균
전체에는 초기 평균장과 배경 및 점성 항이 추가된다.

첫 Forced 공분산 증분의 직접항과 압력항을 합치면, 세 복소 계수
계열 각각에서 값, $R$, $Z$를 세 성분 모두에 요구한다. $ZZ$는
방사와 축 성분에 필요하다. 직접항의 고정 차트별 8개 역할에 압력항이
3개를 추가한다. 원본 10개 차트에서 총 330개의 계수 역할이다.

세 도함수의 공통 외피를 $\zeta(x)x^{-p}$, 각각의 계수를
$C_{rr},C_{\theta\theta},C_{rz}$로 둔다. 같은 shell의 양의 최소
반경 $R_{\min}$과 가까운 끝점까지의 실제 방사 길이 $\Delta R$를 쓰면
이 항의 $\varepsilon p_Z$에 곱할 계수는 다음과 같다.

$$
\varepsilon\left[C_{rr}+\Delta R\left(\frac{C_{rr}+C_{\theta\theta}}{R_{\min}}
 +\varepsilon C_{rz}\right)\right].
$$

이는 [Gaussian 비교](../gaussian/README.md)의 $w=0$인 경우이며,
끝점 적분 인자가 실제 길이 $\Delta R$로 줄어든다.

## OPEN

위 세 도함수의 원본 균일 상계, 전체 압력의 초기 평균 항,
외부 영연장 및 혼합 미분이 남는다. 실제 압력 수치는 아직 열려 있다.

```text
python -B check_pressure_shell.py --goal GOAL_NEXT --artifact HOSTED_ARTIFACT --cache LOCAL_CACHE --runtime ORIGINAL_RUNTIME --out NEW_JSON
```
`ORIGINAL_RUNTIME`에는 원본 SHA로 고정한 M3 압력과 평균 방정식 소스가 필요하다.
