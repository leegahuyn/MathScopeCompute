# 원본 n=1 각응력의 바깥 방사 경계

## VERIFIED

원본 가중치의 지수 $6h,4h,2h$를 실제 $q$와 대조했다. 이전 계산의
배열 위치 1·2·3은 실제 차수 3·2·1에 대응한다. 바깥 끝점 $X_b$에
닿는 항은 실제 $n=1$의 $\theta$ 응력이다. 이전 C84 결과 JSON의
`order`는 당시 배열 위치이며 이 검증이 원본 차수를 결속한다.

원본 전방 응력 `#117068`과 후방 응력은 동일한 원본 피적분함수
`#117048`을 사용한다. 형식·실제 인자, 적분 변수의 결속, 양끝,
차수 가중치와 실제 방사 미분을 확인했다. 국소 잔차에는 전방 적분
`#17744317`이 남지 않는다. 관련 정리 세 개가 GitHub Lean에서
통과했다. [GitHub Lean](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44617281687).

실제 끝점 함수는 `B=#17717057`이다. 원본 컴파일러를 2차로 다시
실행해 $B$, $B_\delta$, $B_{\delta\delta}$의 유한 양의 사각형 FTC
상계식 세 개를 생성했다. 활성 원본과 새 그래프에서 $B$ 및 기존
0차 상계 `#17717108`의 타입 있는 AST가 변수와 노드의 번호를
바꾸어도 동일함을 확인했다. 새 상계식의 네 면씩 12개에서 실제
미분 차수와 합도 대조했다. 상계식의 새 그래프 ID는
`117859`, `118006`, `118103`이다.

## CONDITIONAL

원본 고정 $(Z,T,\ell)$ 차트에서
$K=\varepsilon s^{-A-1/2}\chi_1(q)q^{2h}$, $X=R^2/(2s)$라 두면 실제
Signed의 Haar 잔차에 들어가는 응력 항은
$-K(\partial_R T_{\theta,1}+2T_{\theta,1}/R)
=K(R/s)\mathcal A_\theta(X,\eta)$이다.
응력 값의 전방·후방 차이는 $-J_\theta(\eta)/(2X)$이며,
원본 전체 각 모멘트는 `#117072`이다. 원본 축방향 integrand
`#117047`은 별도다.

바깥 로그 거리 $\delta=\log(X_b/X)\in(0,1/4]$에서 원본 열 요인과
지지 조건 아래
$\mathcal A_\theta=e^{-4/\delta^2+2\delta}\delta^{-6}B$이다.
양끝 Gaussian의 반대편 인자를 유지한 정확 유리수 계산에서 이
응력 기여의 방사 0·1·2차는 $\zeta\delta^{-6}$,
$\zeta\delta^{-9}$, $\zeta\delta^{-12}$의 상계를 가진다.
0차의 충분한 계수는 $8\varepsilon q^{2h}\sqrt{X_b}B_0$이다.
세 상계의 원본 FTC 조건 및 적분의 실제 실해석 해석을 사용한다.

## OPEN

전체 각 모멘트의 독립 소거와 응력 자체의 접합, 위 상계의 수치 평가,
초기 평균·공분산·압력을 합친 전체 Haar 잔차가 남는다.
[첫 Forced](forced/README.md)의 모드 2는 실제 Primary 이차항이며,
모드 1의 실제 선형 축확산항은 투영 뒤에도 남는다. C84의 계수 역할
330개에는 원본 고정 차트의 미분 요청 12종이 필요하다. 전체 N7-06,
N8-05와 최종 jets는 열려 있다.

## 재현

```text
python -B transport/check_stress_transport.py --goal GOAL --artifact HOSTED --cache CACHE --runtime ORIGINAL_RUNTIME --out NEW_FLUX.json
node transport/construct_terminal_norms.mjs ORIGINAL_RUNTIME NEW_NORMS.json LOCAL_GRAPH.json
python -B transport/bind_terminal_norms.py --goal GOAL --artifact HOSTED --cache CACHE --norm NEW_NORMS.json --private-graph LOCAL_GRAPH.json --out NEW_BINDING.json
python -B transport/check_terminal_transport_bounds.py --goal GOAL --transport NEW_FLUX.json --binding NEW_BINDING.json --terminal terminal/theta-outer.json --out NEW_BOUNDS.json
```

`ORIGINAL_RUNTIME`은 C30에 보존한 원본이다. 전체 생성 그래프는
재현 시 로컬에 생성하는 중간 자료다.
