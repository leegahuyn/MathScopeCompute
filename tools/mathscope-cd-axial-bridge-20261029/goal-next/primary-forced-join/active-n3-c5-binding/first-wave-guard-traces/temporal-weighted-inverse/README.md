# 실제 초기 Temporal 보정의 가중 외피

**VERIFIED.** 22,155,584개 노드의 원본 그래프를 다시 인증했다.
공분산 여섯 성분의 부호별 본문 열두 개와 81개 상자의 두 부호를
대조했다. 실제 횡방향 지지 내부에서 공분산은
\[
W_{\mathrm{loc}}=\chi^2 B+\chi\chi' C+(\chi')^2 D
\]
형태다. 각 느린 미분을 취해도 이 형태는 유지된다. 각 고정 라벨과
정수 복사본에서 \(L=\partial_{Y_0}+(1-\sqrt2)\partial_{Y_1}\)는
\(L\xi=(4-\sqrt2)^\Delta\), \(Lv=0\)이다. 원본의 다섯 정수 덮개와
162개 행의 실제 열 324개를 확인했다.

0과 \(\pm r_0/2\)에서 세 값을 사용했다. \(r_0=2^{-34}\)이고
두 전이점에서 \(\chi=1/2\), \(\lvert\chi'\rvert=16/r_0\)이다.
세 점의 절댓값이 \(M\) 이하이면
\[
|B|\le M,\quad |C|\le 2^{-37}M,\quad |D|\le 5\cdot 2^{-78}M .
\]
세 점 부등식은 기존 Lean 정리의 정확 스케일을 사용한다.
가우스 지수급수와 몫 미분으로 실제 cutoff의 9차까지 유리수 상계도
재생했다. 도함수별 상수는 JSON에 있다. [기존 GitHub Lean 검증](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44621136369).

## 조건부 가중 전달

\(Q=N^{-1}P_\perp\)는 실제 고정 토러스의 영평균 역연산이다.
기존 부등식 \(\|Qf\|_\infty\le(85/6)\|f\|_2+(85/216)\|L^2 f\|_2\)를
사용한다. 두 추가 \(L\)은 위의 횡방향 미분으로 전달된다.

실제 이동 적분 \(T_0\)는 cutoff가 일정한 양쪽 경계에서
\(\partial_R T_0 F=F-aL T_0F\)를 만족한다. 원본 외부 영연장과
같은 이동 인자 아래 원래 축압력은
\[
 p_{m,Z}=-W_{rr,Z}
     +T_0(-W_{rr,Z}/R-\varepsilon W_{rz,ZZ}+W_{\theta\theta,Z}/R).
\]
원본의 \(v=-QE_\theta/c_i\)와 \(\gamma=-QE_z/c_i\)를 유지하고
\(\beta=-\varepsilon\partial_Z[R^{-1}T_0(R\gamma)]\)에 적용했다.
\(\chi_R=0\)인 구간을 사용하므로 원래 cutoff 미분은 해당 구간에서
정확히 0이다. 안쪽은 \(a_\zeta=t_1^2\), 바깥쪽은 \(a_\zeta=4\)인
짧은 적분의 \(d^3\) 상계를 쓴다. 안쪽에는 그 상계의 작은 거리 조건이 필요하다.

- **전체 \(R,Z,T,L\) 5차.** 출력 역할 378개를 전개했다. 실제
  공분산의 느린 미분이 \(s\)차일 때 \(\zeta d^{-(9+3s)}\)로
  제어된다는 전제 아래 초기 Temporal 각 속도는
  \(\zeta d^{-(12+3s)}\)를 유지한다. 입력은 \(W_{rz}\) 느린 8차까지
  필요하다.
- **공간 입력 범위 \(T=0,\ Z\le4\).** 출력 역할 165개와 공분산
  요청 639개에서 느린 7차가 충분하다. 느린 7차는 \(W_{rz}\)에만
  필요하다. 동일 계산에 더 큰 \(\zeta d^{-(12+6s)}\) 입력을 넣으면
  \(v,\gamma,\beta\)의 차수별 공통 외피는 각각
  \(\zeta\)에 \(d^{-(18+6s)},d^{-(21+6s)},d^{-(24+6s)}\)를 곱한
  꼴이다.
- **실제 첫 Forced.** 열 개 차트에서 보조각 미분 계수 100개를
  비교해 원본의 \(\partial_{Y_1}\) 계수가
  \((1-\sqrt2)\) 곱의 \(\partial_{Y_0}\) 계수임을 확인했다.
  따라서 그대로 \(L\)을 쓴다. 평균 속도 성분당 43개, 총 129개
  실제 미분을 재생했고 여섯 공분산의 서로 다른 입력 요청은 600개다.
  \(W_{rz}\)의 최대 느린 차수는 7이다. [첫 Forced 증거](first-forced-covariance/README.md).

**OPEN.** 원본 가중 공분산 상수의 전 차트 정량 결속, 이어지는
전체 보정의 구간, 최종장 jet 및 N7-06과 N8-05가 남는다.
두 번째 표에는 \(R,Z,L\) 방향의 고정 차트 입력만 들어간다.

```text
python -B verify_actual_transverse_temporal.py --goal GOAL --artifact HOSTED --cache CACHE --runtime ORIGINAL_C66_RUNTIME --out NEW_SHAPE.json
python -B verify_temporal_weight_transfer.py --goal GOAL --shape NEW_SHAPE.json --out NEW_TRANSFER.json
```
