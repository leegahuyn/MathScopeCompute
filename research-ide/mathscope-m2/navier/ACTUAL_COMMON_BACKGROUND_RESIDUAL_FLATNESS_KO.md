# 같은 공통 계수열에서 실제 배경 잔차의 모든 미분 flatness

## 현재 증거 상태

이 문서는 `actual-background-residual-flatness.mjs`와
`actual-common-band-background-residual.mjs`의 수학적 결속을 설명한다.
유한 잔차 kernel 7/7, 실제 (N=2,m=0) 유한 source 5/5와 공통 family
source 8/8은 별도 관측 실행을 마쳤다. 통합 source attempt2에서는
**main theorem의 실제 (N=2,m=0,P=1) 구성, 내부 8개 검사 및 별도
validator 6개 검사가 통과했다.** 이 실행 전체는 physical 치환 캐시의
`Map maximum size exceeded` 때문에 3/8, exit 1로 끝났으며,
실제 (E_B) adapter는 그 선행 오류 때문에 아직 실행되지 않았다.
실제 (E_B)의 통합 증거가 확보되기 전에는 G-N4 완료를 인증하지
않는다. 아래 실행 절은 이 부분 성공과 전체 실패를 구분하여 기록한다.

## 결론의 대상

원래 완성된 무한 계수열과 단 하나의 공통 재귀 (b_n)로 만든 배경을

\[
\mathcal B=(u_B,p_B,T_B)
\]

라고 쓴다. 여기서 (T_B=(T_{B,\theta},T_{B,z}))는 원래 두 stress
성분이며, 그 발산은

\[
\operatorname{div}T_B
=e_\theta(\partial_r+2/r)T_{B,\theta}
 +e_z(\partial_r+1/r)T_{B,z}
\]

이다. 비교할 실제 잔차는

\[
E_B=\partial_tu_B-\Delta u_B
 +(u_B\cdot\nabla)u_B+\nabla p_B
 +\operatorname{div}T_B.
\]

목표는 모든 고정한 물리 미분 차수 (m\ge0)와 모든 (P\ge0)에 대해
같은 (E_B)가

\[
\|E_B\|_m\le C_{m,P}q^P\qquad(0<q<q_{m,P})
\]

를 만족한다는 것이다. (
\|\cdot\|_m)는 (x_1,x_2,z,t)에 대한 길이 (m) 이하의 모든 물리
미분을 포함한다. 함수값에 대한 작은 추정치를 나중에 미분하지 않는다.
각 요구된 미분은 원래 함수에서 먼저 생성되고 그 미분의 상수가 쓰인다.

실제 (u_B+w)의 보정 전 Navier–Stokes 잔차는 별개다.

\[
R(u_B+w,p_B+\pi)
=E_B-\operatorname{div}T_B
 +L_{u_B}(w,\pi)+(w\cdot\nabla)w.
\]

이 식의 나머지 세 항은 별도의 실제 wave/covariance 구성에서 다룬다.
본 adapter는 전체 보정 전 잔차가 flat이라고 선언하지 않는다.

## 모든 필드가 공유하는 재귀

`actual-common-admissible-family.mjs`는 원래 canonical (c_n), 실제
velocity/potential, pressure 및 두 stress의 각 유한 미분 상수,
weighted endpoint 상수를 같은 maximum에 넣는다. (h>0)에 대해

\[
\log b_n\ge
 \frac{n\log2+\log B_{n,r}}{nh},\qquad 0\le r\le n,
\]

따라서 (B_{n,r}b_n^{-nh}\le2^{-n})이다. 다음 차수는 새로 정한
직전의 (b_{n-1})를 사용한다. 특별한 두 번째 간격과 이후 간격은

\[
b_2\ge16b_1,\qquad b_n\ge2b_{n-1}\quad(n\ge3)
\]

이다. 모든 단계에서 (b_n\ge c_n) 및 (b_n\ge2^n)도 유지된다.
독립적인 여러 계수열을 만든 뒤 점별 maximum으로 바꾸지 않는다.

압력, stress, velocity, radial commutator, normal 계산은 이 동일한

\[
\chi(b_nq),\qquad q\partial_q\chi(b_nq)
\]

를 사용한다. (chi=1)인 원래 구간은 (b_nq\le1/2), (chi=0)인
구간은 (b_nq\ge1)이며 모든 cutoff jet은 같은 끝점에서 flat하다.
실제 physical norm은 이미 필요한 Euler cutoff 미분을 포함하므로
cutoff 계수를 다시 곱하지 않는다.

각 고정 (q>0)의 근방에서는 (b_n\to\infty)에 의해 모든 충분히
높은 항이 문자 그대로 0이다. 따라서 합과 그 물리 미분은 국소적으로
유한 합이다. 무한 개의 그래프를 문자 그대로 저장할 필요는 없다.

## 원래 radial commutator와 divergence

각 원래 양의 계수는 (M_{n,X}=U_n)과 원래 continuity 식을 만족한다.
cutoff를 stream potential에 먼저 곱하면 물리 radial 성분에는

\[
q^{-1/2+2nh}y
\left[
 \frac{\chi(b_nq)}2v_n
 -\frac{\eta}{L}
  (q\partial_q\chi(b_nq))\frac{M_n}{X}
\right]
\]

이 생긴다. 원래 regular average (M_n/X)를 사용하며 축에서 0/0을
계산하지 않는다. 보편 kernel은 아직 상쇄하지 않은 두 source defect를
유지하여

\[
\operatorname{div}_{\rm normalized}u_n^{\rm cut}
=\chi\,\operatorname{div}_{\rm original}u_n
 +\frac{2\eta}{L}(q\partial_q\chi)(U_n-M_{n,X})
\]

를 독립 계산한다. 원래 mass와 continuity의 private source 증명을
소비한 뒤에만 두 항을 0으로 결론 내린다. commutator, mass 관계,
continuity 중 하나를 누락한 음성 대조군은 모두 실패한다.

## 같은 계수열에서 얻는 실제 tuple tail

유한 uncut tuple을 (mathcal B^{[J]})라고 한다. (J\ge r)를 고정하고

\[
0<q<\min(1,(2b_J)^{-1})
\]

이면 (n\le J)의 모든 원래 cutoff는 1이고 모든 cutoff 미분은 0이다.
따라서 (mathcal B-mathcal B^{[J]})는 실제로 높은 cut 항들의 합이다.
leading full heat와 압력 축값, 두 leading shear는 양쪽에서 같은
실제 함수이므로 차이에서 소거된다.

원래 (n)번째 항 또는 그 미분이 0이 아닌 점에서는 (q\le b_n^{-1})이다.
그곳에서 실제 미분 상수는

\[
B_{n,r}q^{2nh}
 =q^{nh}\,B_{n,r}q^{nh}
 \le2^{-n}q^{nh}
\]

를 만족한다. 같은 점에서 모든 (n>J\ge r)를 합하면

\[
\|\mathcal B-\mathcal B^{[J]}\|_r
\le 2^{-J}
 q^{(J+1)h-(2A+r)}.
\]

상수는 (sum_{n>J}2^{-n}=2^{-J})라는 정확한 합이다. 한 cutoff가 0인
영역에서는 해당 항과 모든 jet 자체가 0이므로 부등식에 기여하지 않는다.

첫 양의 stress의 weighted bound에는 원래 endpoint pole이 남아 있다.
그 pole을 (b_1)의 선택으로 없앴다고 주장하지 않는다. 위 unweighted
물리 tuple bound에는 별도로 인증된 full-heat/FTC 상수를 사용한다.
wave의 weighted 제곱근 추정에서는 그 원래 pole과 Gaussian factor를
그대로 함께 사용한다.

## 유한 잔차의 상쇄와 남는 항

`actual-global-finite-residual.mjs`는 임의 유한 (J)의 전체 원래 물리
잔차를 전개한다. 모든 순서쌍, angular/axial viscosity의 차수 1 이동,
방사 Omega의 이동 1 및 그 축 viscosity의 이동 2를 보존한다.

원래 (n\le J) 계수는 독립 actual leading 및 positive 증명과 실제로
대조하여 상쇄한다. (n>J) 항은 삭제하지 않고 남긴다. 그 결과

\[
\|E^{[J]}\|_m
\le C_{\rm fin}(J,m)
 q^{2h(J+1)-(2A+1+m)}.
\]

여기서 (2A+1+m)은 (J)와 무관하다. 상수는 남은 원래 함수에 대한
모든 물리 미분 단어와 완전한 rectangular FTC receipt의 유한 합이다.
동일한 source constructor는 잔차 차이가 놓이는 방사 상자에서

\[
\|u^{[J]}\|_{m+2}
\le C_u(J,m+2)q^{-(2A+m+2)}
\]

도 구성한다. 그 상자 밖에서는 양의 차수 차이가 0이다. 원래 leading
heat tail을 잘라서 compact한 것처럼 만드는 가정은 들어가지 않는다.

## 모든 nonlinear 항을 포함한 비교

velocity 차이를 (e), pressure 차이를 (pi), stress 차이를 (S)라고
하면 독립 Cartesian kernel이

\[
\begin{aligned}
E_B-E^{[J]}={}&e_t-\Delta e+\nabla\pi+\operatorname{div}S\\
&+(u^{[J]}\cdot\nabla)e
 +(e\cdot\nabla)u^{[J]}
 +(e\cdot\nabla)e
\end{aligned}
\]

를 확인한다. 두 mixed transport와 마지막 이차 항을 모두 유지한다.
이차 항을 누락한 음성 대조군도 실패한다.

stress 차이는 (X_{\min}\le X\le X_b)인 원래 annulus에 지지된다.
그곳에서는 (r\ge\sqrt{2qX_{\min}})이다. stress 발산의 Cartesian
계수는 (x_1^ax_2^br^{-k}) 꼴이며, 정확한 반복 미분식

\[
\partial_{x_j}(x_1^ax_2^br^{-k})
=\text{분자 멱의 미분}
 -k x_jx_1^ax_2^br^{-k-2}
\]

으로 모든 고정 차수의 양의 majorant를 만든다. 이 계수는 물리 변수
(z,t)와 무관하다. (q)는 미분 뒤 얻은 부등식에서만 사용되므로
이미 얻은 부등식을 다시 미분하는 오류가 없다.

geometry recurrence의 실제 상수를 (D_m^{\rm stress})라고 하면

\[
D_m=16\,2^m+D_m^{\rm stress}
\]

으로 시간, Laplacian, 압력, 모든 Leibniz 대류항과 stress 발산을 함께
덮을 수 있다. (r=m+2), (K=2A+r), (H=m+1),

\[
\tau=(J+1)h-K
\]

로 놓으면

\[
\|E_B-E^{[J]}\|_m
\le D_m2^{-J}(C_u(J,m+2)+2)
 q^{\tau-H-K}
\]

를 얻는다. stress 차이가 0인 축 근방에는 (1/r) bound를 적용하지
않는다. 원래 leading stress의 축 연장은 독립 실제 운동량 계수와
가중 FTC로 증명된 regular 발산을 사용한다.

## 정확한 비교 차수와 상수

고정한 (m,P)에 대해

\[
J=\max\!\left(m+2,
\left\lceil
 \frac{P+2+2(2A+m+2)+(m+1)}h
\right\rceil\right)
\]

을 택한다. 원래 (h>0)이므로 유한한 선택이다. 이 정의는

\[
\tau-H-K>P+2
\]

를 준다. 유한 잔차 지수의 여유도 정확한 대수 계산으로 확인한다.
threshold의 두 배에서 유한 손실과 (P+2)를 빼면

\[
P+11+5m+6A>0
\]

이다. 따라서

\[
\|E_B\|_m\le C_{m,P}q^{P+2}\le C_{m,P}q^P,
\]

\[
C_{m,P}=C_{\rm fin}(J,m)
 +D_m2^{-J}(C_u(J,m+2)+2),\qquad
q_{m,P}=\min(1,(2b_J)^{-1}).
\]

여기서 (b_J)는 새로 고른 별도 수열이 아니라 처음부터 사용한 같은
공통 재귀의 (J)번째 값이다. 필요한 (C_{\rm fin},C_u)는 위에서
명시한 원래 유한 source 알고리즘이 정의한다. 거대한 (J)의 숫자나
미실행 상수의 수치를 임의로 발급하지 않는다.

실행 (N=2,m=0)은 유한 constructor의 실제 source 결속 증거다.
임의 (J,m)의 결론은 원래 임의 차수 계수 구성, 모든 순서쌍의 유한
전개, 미분·FTC의 유한 반복, 같은 maximum 재귀에 대한 수학적 귀납이다.
현재 실행한 작은 (N)을 symbolic (J)와 같다고 간주하지 않는다.

## 실제 물리 (E_B) 그래프

물리 adapter는 private common family와 private physical curl 객체가
동일한 family를 가리키는지 검사한다. 실제 band가 보존한 각 원래

\[
F_n,U_n,M_n,M_n/X,v_n,\Pi_n,T_{n,\theta},T_{n,z},b_n
\]

root 및 (chi, q\chi_q)를 다시 확인한다. band의 full normalized
합과 원래 radial commutator가 일치하는지도 실제 식으로 대조한다.

그 다음 **physical 객체가 소유한 같은 그래프에서** 원래 stress의
물리 가중치와 radial 미분을 만든다. 원래 physical velocity의 실제
시간 미분, Laplacian, 압력 gradient 및 대류에서 (R(u_B,p_B))를
다시 조립하여 기존 physical residual과 확인한다. 마지막에야

\[
E_B[j]=R(u_B,p_B)[j]+\operatorname{div}T_B[j]
\]

를 세 성분에 대해 만든다. 이 세 실제 표현은 결과에 그대로 남는다.
이를 0으로 정의하지 않는다.

finite theorem의 별도 그래프에 있는 root 번호는 물리 operand로
옮기지 않는다. 물리 (D_m)와 symbolic (J)는 실제 physical.G에서
다시 구성하고, 외부 유한 source 증거는 명시적인 namespace의 참고로만
보존한다. 각 private seal은 append-only 확장을 허용하되 기존 노드,
정의 또는 인증된 자료를 바꾼 객체는 거부한다.

main theorem은 family 그래프를 복제하기 전에 원래 (M_eta,F_X,U_X)를
캡처한다. 원래 AD가 보존한 영 적분·영 piecewise 미분과 독립 AD가
생략한 영 항은 모든 branch와 적분 body를 유지하는 literal-zero
정규화 및 alpha-equivalence로 먼저 대조한다. 이 검사가 증명한
미분 root 쌍만 원래 stress shell에 적용한다. 비영 적분, 바뀐 적분
한계 또는 어느 한 shear의 삭제는 이 절차로 정당화되지 않는다.

## (q=0)에서의 물리 flat 연장

위 부등식은 (q)에 대한 형식적인 Taylor 급수에 그치지 않는다.
원래 (t=-q(1-\eta^2)), (z=q^D\eta)를 이용하면

- (|\eta|\le1/\sqrt2)일 때 (q\le2|t|).
- (|\eta|\ge1/\sqrt2)일 때
  (q\le2^{1/(2D)}|z|^{1/D}).

원래 (0<D<1/2)이고 (|z|\le1)에서는

\[
q\le C_D(|t|+|z|).
\]

따라서 모든 물리 미분의 임의 (q^P) decay는 모든 물리 거리의
거듭제곱에 대한 decay도 준다. 원래 시간 영역의 one-sided endpoint
jets와 함께 (q=0)의 특이 집합에 0으로 연장하면 모든 jet이 0으로
맞는다. 방사 compact support 때문에 (x_\perp\ne0)인 그 집합 근방은
이미 실제 잔차가 0이다. 이는 전체 시간 경계 (t=0)에서 잔차를
임의로 0으로 설정한다는 뜻이 아니다.

## 실행 증거와 권한

이미 관측된 유한 단계의 정확한 실행은
`research/evidence/background-residual-flatness-20261011/finite-validation.json`
과 `ACTUAL_GLOBAL_FINITE_RESIDUAL_KO.md`를 따른다. 원래 공통 family의
별도 성공 증거는
`research/evidence/common-admissible-family-20261011/actual-common-admissible-family-source-attempt3.json`
이다.

통합 runner는 한 번 만든 실제 family, band, physical curl을 다음 두
constructor와 두 재생성 없는 validator에 전달한다.

1. `attachActualBackgroundResidualFlatness` 및
   `validateActualBackgroundResidualFlatness`.
2. `attachActualCommonBandBackgroundResidual` 및
   `validateActualCommonBandBackgroundResidual`.

통합 attempt2의 관측 실행은 2026-10-11 11:13:19 UTC에 시작하여
11:19:52 UTC에 종료했다. 전체 결과는 **3/8, exit 1**이며, 실제
main theorem certificate와 validator는 모두 통과한 부분 결과다.
`actual-common-physical-package-source-attempt2.json`의 SHA-256은
`aade59c813b4c8e93f9f88f451fcfa0941ef6f14bd7586a98c30c4e577145131`이다.
같은 디렉터리의 `-process.json`, `.log`, `attempt2-snapshots/`가
관측 종료, 실패와 실행 당시 파일을 보존한다.

main theorem 그래프는 884,353개 노드, canonical 38,855,624 bytes이며
SHA-256은
`1301fe662653d92f24acf8df74567f51dc3efa0a0142d059da854fa41160ebce`다.
그 certificate의 `actualBandResidualAttached`, `wholeGN4Complete`,
`wholeM2Complete`, `m3MayStart`는 모두 false다. 아직 실행하지 못한
물리 (E_B) 성공을 이 부분 결과에서 추론하지 않는다.

후속 통합 attempt3는 720초 제한으로 종료했다. 관측 process는
5개 검사 통과, `complete=false`, exit 1을 기록한다. main theorem은
동일한 위 graph SHA 및 내부 8개·validator 6개 성공을 다시 기록했다.
물리 (E_B)는 시작 뒤 제한에 걸려 certificate가 없으므로 성공으로
표시하지 않는다. 부분 packet SHA는
`65c199e14f87abd297a40eae4749f273f35d85ff5d83e19dc32dd75b0292b957`이다.

이 실행 뒤 E_B에도 원래 M_eta/F_X/U_X의 copied-prefix·body equality
결속을 적용했다. 양쪽 원래 flux를 대조한 뒤 그 등식을 미분하며,
M_X=U와 혼합 mass FTC의 별도 권위를 유지한다. 새 작은 원래-formula
검사는 4/4, 관측 exit 0으로 끝났고
`research/evidence/common-physical-package-20261011/leading-regular-divergence-fix-attempt1.json`
에 기록했다. 이는 실제 full (E_B) 재실행의 성공을 대신하지 않는다.
전체 M2 및 M3 시작 권한은 별도 상위 gate에 남아 있고, 이 source-bound
프로그램은 새 Lean kernel 증명이라고 표시하지 않는다.
