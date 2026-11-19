# 첫 Forced 모드 1·2의 원본 선도 위상 및 선형항 소거

C94는 C93의 같은 원본 고정 라벨과 두 모드의 23개 실제 \(R,Z,L\) 방향을 사용한다. \(d=\log(X_b/X)\)이고 \(g(d)=e^{-2/d^2}d^{-3/2}\)이다.

## VERIFIED

- 모드 1 원본 60개 스칼라를 정규화 펄스, 실제 원통형 점성, 전체 초기 평균, 압력 및 꼬리로 재구성했다. 실수부 \(A=\operatorname{Re}U\)의 \(\partial_v A+(\lambda-d_{\rm ref}+\varepsilon k^2|n|^2)A+KA- kn\operatorname{Im}p-\mathrm{tail}\)에 실제 프레임 식을 적용하면 선도부가 소거된다. 꼬리의 역할은 실제 \(\partial_v\psi\) 항을 소거하는 것이다. 초기 평균 곱의 \(M\operatorname{div}_\phi U\)는 원본 curl의 발산 항등식으로 소거된다.
- 같은 원통 좌표의 두 커다란 잔여 계수 중 \(D_r n_\theta+n_\theta/R=0\), \(D_z n_\theta=0\), \(D_rn_z-D_zn_R=0\)를 원본 위상과 고정 펄스에서 연결했다. \(D_r\)는 원본 빠른 토러스 미분을 포함한 물리 방사 미분이고 \(D_z=\varepsilon\partial_Z\)다. \(\eta\)와 공통 토러스의 조건은 원래 차트·물리 미분을 따른다.
- 모드 2 원본 60개 스칼라에서 \(2ik(n\cdot U)U=-2k(n\cdot\operatorname{Im}U)U\)를 실제 보존형 계수로 대조했다. C91의 실제 실수부는 접평면에 놓인다. 남는 허수부의 \(k^{-1}\)은 원본에서 유지된다.
- 원통형 curl의 실수·허수 발산과 모드 2의 실수·허수 위상 소거 정리 네 개를 동일한 GitHub 컴파일에서 확인했다. [GitHub Lean 실행](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44639948538).

## CONDITIONAL

원본 \(q_{\rm Big}/64\le q<q_{\rm Big}/16\)와 \(0<d\le1/4\)에서, 원래 고정 라벨·양의 프레임과 공분산 조건, 대조한 모든 참조와 짧은 이동 경로가 해당 차트에 속한다는 전제를 사용한다. 원본 가중 Primary와 초기 평균 범위도 유지한다. 두 모드의 소거 후 원시 강제항은 \(\varepsilon^{1-1/100000}\) 이상 차수다. C93의 \(S\) 비용과 기하 배수를 합치면 같은 23개 변분 방향에서

\[
\left|D^{(r,z,l)}(U_m/P)\right|
\le\varepsilon^{49999/50000}g(d)^m d^{-21},\qquad m=1,2
\]

의 외피를 얻는다. 실제 물리 모드는 \(P(v)\)를 곱한다. 모드 1과 2의 최고 밴드 멱 \(119/4\)와 \(22\), 각 \(g^m\) 뒤의 극점 21을 유지한다. 원래 \(\zeta^{m/2}\)를 유지하면 총 극점은 \(45/2\)와 24다. 이 지수는 원래 Primary의 \(\varepsilon^{1/2}\)보다 크다. 전체 점별 비와 물리 에너지에는 방사 극점, 좌표 미분과 cutoff 후 curl을 따로 반영해야 한다.

## OPEN

첫 Forced의 바깥 반지름 구간에서 원본 선도항의 상대 지수 개선을 확인했다. 이어서 같은 물리 잠재장의 두 차수 Cartesian 미분과 원본 경로 조건을 확인해야 한다. 안쪽·중간 영역의 접합, 실제 Signed·Temporal·FiveMap과 뒤 보정의 전체 에너지·수렴 및 67개 최종 jet가 남아 있다.
