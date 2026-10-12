# 새 실제 물리점의 270개 유한 도함수에 대한 원본 경계 결속

이 문서는 `actual-physical-center-jet-source-bounds.mjs`의 고정 유한 경계와 `actual-physical-center-jet-source-enclosure-bounds.mjs`의 실제 원본 결속을 설명한다. 전자는 조건부 수학 함의이고 언제나 `sourceAuthenticated:false`이다. 후자는 원래 물리점, 비교 기울기, 목표 응력, 새로 생성한 도함수 몸체라는 세 private 선행 결과를 검사한 뒤에만 실제 원본 경계를 반환한다.

현재 이 문서가 기록하는 직접 실행 범위는 경량 14/14·관측 종료 코드 0이다. 새 물리점에서의 전체 270행 실행은 부모가 보존된 private 객체를 사용하는 별도 단계 실행에서 확인한다. 경량 검사 개수만으로 실제 원본 생성의 성공이나 G-NUM 완료를 주장하지 않는다.

## 1. 실제 원본과 그래프의 범위

호출은 다음과 같다.

```js
bindActualPhysicalCenterFullJetSourceBounds(bodies, slopes, target, context)
```

`bodies.physicalCenter`, `slopes.p`, `slopes.physicalCenter`, `target.p`는 동일한 객체여야 한다. 기울기와 목표의 그래프는 원래 `p.G`이고 도함수 그래프는 이를 복사한 `bodies.G`다. 실제 몸체 생성 전에 기울기와 목표를 `p.G`에 붙여야 한다. 사용한 외부 식 번호가 복사 시점의 원래 prefix 안에 있고 그 식 노드의 바이트가 같은지 다시 검사한다. 같은 정수 번호를 가진 다른 sibling 그래프의 식은 허용하지 않는다.

모든 추가 함수·도함수·보조 적분은 `bodies.G`에만 생성한다. 생성 전후 `p.G`의 노드와 함수 정의가 그대로인지 검사한다. 원래 두 Volterra 계수 행렬과 고정 초기값 `(1,0)`도 그대로 유지한다. 독립 생성된 20차원 변분 시스템은 각 부호에 대해 값 2개와 1·2차 혼합 slow jet을 결속한다.

실제 source tuple, 자체 common band, 완전한 곱·역행렬·양의 제곱근·물리 curl의 private 인증은 선행 객체에서 소비한다. 공개 입력으로 상계나 `true` 플래그를 넘겨 조건부 함의를 승격시키는 API는 없다.

## 2. 새 점을 포함하는 완전한 장의 유한 경계

정확한 원래 역상과 주파수 조건은 다음 영역을 준다.

\[
\frac3{16}<\delta_\sharp<\frac5{16},\qquad
\frac{15}{16}<T_\sharp<\frac{17}{16},\qquad
Z_\sharp=0,\qquad 0<z_\sharp<\frac1{16}.
\]

여기서 `h`는 원래의 엄밀히 양수인 지수이며 0으로 바꾸지 않는다. 이미 완료된 실제 support·전체 모멘트 증명으로 이 열린 영역에서는 모든 양의 차수 배경 보정과 그 유한 도함수가 0이다. 원래 완전한 장을 실제 행렬에서 지우지는 않는다. 이 열린 영역의 항등식은 경계를 증명할 때만 사용한다.

정규화된 증분을 `x=(R−Rsharp)/Rsharp`, `tT=T−Tsharp`, `tZ=Z`라 두면 원래 implicit chart는

\[
w=s/T_\sharp-1
=\frac{t_T}{T_\sharp}
+t_Z^2T_\sharp^{2h-1}(1+w)^{2h}.
\]

두 고정 계수의 절댓값은 2 미만이다. 양의 형식급수의 각 차수가 이전 차수에만 의존하는 재귀를 사용한다. terminal step의 원래 logistic 지수는 `[3/32,5/32]`에서 역수 16을 사용해 지배한다. 완전한 heat factor는 원래 양의 Gamma 밀도와 끝점 0..1 전체를 유지한다.

heat integrand의 1..5차를 실제 자동미분하고 다음 식과 정확한 유리식 비교를 한다.

\[
\partial_z^j\{\rho(u)(1+zu)^{-h}\}
=(-1)^j(h)_j\,\rho(u)(1+zu)^{-h}
\frac{u^j}{(1+zu)^j}.
\]

`(h)_j=h(h+1)…(h+j−1)`이다. 모든 `j≤5`에서 전체 Gamma 적분의 절댓값 상계는 `j!(j+1)!`이다. 따라서 무한 꼬리를 잘라 버리지 않고 미분을 원래 적분 안으로 옮길 수 있다.

implicit chart·step·heat·원래 방사상 거듭제곱을 합성한 정확한 일반 도함수 상계는 다음과 같다.

| 차수 | 전체 혼합 도함수를 지배하는 상계 |
|---:|---:|
| 0 | 1 |
| 1 | 268 |
| 2 | 25197488 |
| 3 | 3581759752704 |
| 4 | 677825802747383016 |
| 5 | 160382079967680232221120 |

모두 `2^512` 미만이다. 원래 `f_o H>1/2`, `F<Renv^71`, `Renv>2^4096`과 결합하면 정규화된 F의 5차 이하 혼합 jet은 `Renv^73` 미만이다. 이전 점에서 수치화한 도함수를 새 점으로 전달하는 단계는 없다.

## 3. 원래 M, moving B, 압력과 전체 시간 구간

각 부호에서 원래 F, F_R, G_R, 위상 도함수, p, pz, x0, epsilon, k를 넣어 전체 moving frame을 재생성한다. 원래 행렬과 모든 4개 성분을 직접 비교한다. 압력 투영, normal, 접선·법선 기저, Bprime, 실제 damping은 모두 남는다.

양수인 원래 Bs를 정확히 소거하고 `tau=v/Ls`로 바꾸는 독립 유리식 증명을 통해 동일한 정규화 template에 원래 식을 넣는다. 원래 반올림 p의 `beta=Ls*p/Bs`를 보존한다. 비교식만 세 작은 매개변수를 옮긴다.

\[
1/L_s\le B/S,\quad
0<\epsilon<4/S^{16},\quad
|\beta-\beta_0|\le L_s/(kB_s)<R_{env}^{40}/S^7.
\]

비교 전체 구간은 `0≤tau≤1`이다. midplane에서 정규화된 normal의 z성분은 정확히 −1이므로 이 세 매개변수의 전 구간에서 법선 제곱과 접선 제곱의 분모는 1 이상이다. 전체 비교 행렬은 모든 시간에서 `diag(0,−2lambda)`이다.

원래 M의 v·vv, 기존 1·2차 slow M jet, Ls*M_iv, 모든 3성분 moving B의 slow/v/vv/slow-v jet을 생성한다. 같은 정규화 template에는 tau 0..2차와 세 보조 매개변수의 실제 도함수를 생성한다. primitive 최고 차수는 Bprime의 추가 한 차수를 포함해 4이고, underlying F는 위의 5차 경계를 사용한다.

원래 matrix ledger의 지수 3313<3840<4096과 별도의 amplitude 지수 1132<4096을 사용한다. B의 경계를 M의 경계로 대신하지 않는다. 따라서 실제 오차 행렬 E와 tau 1·2차는 모두 `B^64/S` 이하이고 원래 M_i, M_ij, Ls*M_iv는 해당 B 경계를 만족한다.

## 4. 전체 Riccati 적분, 실제 중심과 역행렬 조건

원래 `r=wminus/wplus`, `q=log(wplus)`에 대해 실제 미분으로 다음 두 RHS를 확인한다.

\[
q_v=M_{11}+M_{12}r,\qquad
r_v=M_{21}+(M_{22}-M_{11})r-M_{12}r^2.
\]

원래 양수 cone, 전체 구간 안정성, 원래 `(1,0)` 초기값을 사용한다. 특히

\[
r_v(0)=M_{21}(0),\qquad r_{iv}(0)=M_{21,i}(0)
\]

는 일반적으로 0이 아니다. 중심 영역에서 이 값에 곱해지는 양수 `exp(−Ls/(4B))<S^−4`를 명시적으로 유지한다.

각 실제 동적 중심 `a_i(R,Z,T)=wplus_i(Ls/2)`를 미분한 뒤 새 점에 대입한다. 실제 `D_i log(a)`와 완전한 반구간 적분 `Integral_0^(Ls/2) D_i(M11+M12*r)`의 식을 모두 보존한다. 비교 `mu`, `nu`는 새 점의 원래 F와 Rayleigh 함수에서 얻은 private source 함수다. `Tsharp=1`로 바꾸지 않아 1/T 계수가 유지된다. 비교 nu의 유한 u 적분 오차 `8/u^2`, `64/u^2`도 양수로 유지한다.

각 원래 H 성분은 `haarFactor*Integral_0^Ls psi^2*t_r*t_j`이다. 40개의 값·1차·혼합 2차 식마다 원래 integrand 곱의 미분 및 고정 끝점 적분과 실제 inverse 입력 jet이 같은지 확인한다. Gaussian core만 적분하지 않으며 전체 원래 꼬리와 Haar 정규화를 유지한다.

D=(Ac,u), m=massScale에 대해

\[
K_{ji}=\frac{H_{ji}}{D_jma_i^2},\quad
Y_i=\frac{y_i ma_i^2}{\tau},\quad
\bar T_j=\frac{T_j}{D_j\tau}
\]

를 실제 식으로 구성하고 `K*Y=Tbar`의 열별 소거를 확인한다. 원래 양의 `a,y,m,tau`에서 `sqrt(y)/A0=sqrt(Y)/a`가 성립한다. 이때 a의 도함수를 동결하지 않는다.

조건수 검사는 실제 새 점의 source-directed H, a, y 구간을 별도로 사용한다. 두 중심은 각각 자기 열에만 적용한다. 실제 구간으로 `det K<0`, `||K^-1||infinity≤1`, `1/8≤Y≤1/2`, `sqrt(Y)≥1/4`를 검증한 뒤 미분 경계를 적용한다. 도함수 결론을 자기 자신의 오차 증명에 쓰지 않는다. 별도의 더 넓은 inverse32, Y≥1/16 경계는 전체 유한 크기 상계에도 사용한다.

## 5. 목표, partition, 42개 물리 도함수

목표는 같은 실제 새 점의 원래 전체 응력이다. 원래 A.54의 두 backward kernel, 복원된 모멘트, angular와 axial shear를 모두 유지한 source identity를 소비한다. 값이 0인 axial 목표도 그 도함수를 0으로 지정하지 않는다. 원래 두 profile 변수의 6개 jet과 실제 세 slow 변수의 10개 target jet을 결속한다.

원래 slow partition의 세 mesh 인자 및 band 인자마다 numerator, 세 이웃의 전체 denominator, 실제 bump 몸체를 재생성하여 비교한다. mesh offset의 원래 범위는 절댓값 9/16 미만이어서 개별 인자는 `2^-18`보다 크고 네 인자의 곱은 `2^-72`보다 크다. 원래 분모의 1·2차를 포함한 quotient 재귀와 `ell^6=S^3`을 사용해 상대 도함수를 제한한다. `chi`, `psi`의 fast plateau는 각 원래 branch에서 증명된 것으로만 사용한다.

물리 도함수는 성분 3개 × (방향 4개의 1차 + 대칭 방향 10개의 2차) = 42개다. r,z,t,theta의 원래 위상을 직접 미분하며 다음 연결항을 유지한다.

\[
N_\theta U=(\partial_\theta+J)U/R,\quad
\operatorname{Hess}_{\theta\theta}U=N_\theta N_\theta U+D_rU/R.
\]

scalar phase에도 `Hess_theta,theta(Phi)=Dr(Phi)/R`가 있다. 정규화 분모 `(pTilde/R)^2`에는 원래 pulse length의 제곱이 들어가므로 phase 경계는 **B^64 S^2**이다. S 한 번으로 줄인다는 가정은 하지 않는다.

실제 Phi와 C의 곱 `−C*sin(kPhi)`를 먼저 미분하고 phase0을 넣는다. coefficientCurl의 1차, 방사상 fast chain, 두 angular 연결항을 유지한다. 최종 유한 경계는 다음과 같다.

| 원래 대상 | source 상계 |
|---|---:|
| 고정 scalar와 역수 | B^16 |
| 2차 이하 weighted pulse | B^512 S^4 |
| 2차 이하 slow partition 상대 도함수 | B^8 S^6 |
| normal 및 inverse square의 유한 jet | B^64 |
| 정규화된 1·2차 phase | B^64 S^2 |

같은 원래 주파수 조건은 `epsilon^(1/200000)*S^16384<2^-16384`를 준다. 이 표의 유한 곱·합에 필요한 지수는 그 여유 안에 있으므로 full-curl의 나머지는 양수 2^-512 최종 계수 오차 안에 들어간다. 228개 pulse·raw center·H·y 행에는 원래 whole-time 오차와 새 mu/nu 비교 구간을 합쳐 양수 2^-560 여유를 사용한다.

## 6. 별도 수치 스케일 진단

`diagnostics`는 숫자 인증과 구분한다. 원래 A.13 적분 239,257,275의 typed 식 closure, Qb/Qp/wait, 12개 원래 stage의 길이와 끝점, 첫 common selector의 모든 constraints, 원래 velocity/pressure/stress FTC records와 필요한 함수 metadata를 보존한다.

integer exponent와 derivative order를 식 번호로 취급하지 않는다. 알려지지 않은 functional node는 원래 몸체 참조로 남기며 값을 제공하지 않는다. 이 진단은 `sourceAuthenticated:false`, `numericalScaleBoundProved:false`, `all401OpaqueBodiesExpanded:false`다. selector/palette/실제 좌표의 수치 끝점은 별도 실제 산술 증명이 필요하다.

## 7. 실행 증거와 제한

`source-bound-ledgers-light-attempt3.json`은 두 경량 파일의 14/14 성공, 관측 종료 코드0, 실제 경과0.840524843초와 실행 당시 네 파일의 SHA를 기록한다. 실제 전체 source는 실행하지 않은 경량 packet이다. 최초 fixture의 메서드명 오류(2/5)와 다음 fixture의 negated-product literal AST 비교 오류(4/5)는 각 당시 코드와 실패 기록을 별도 보존했다. 실제 적분 항등식이나 원래 모듈을 완화하지 않고 fixture를 고쳤다.

현재 고정 source 두 파일의 SHA는 다음과 같다.

- 고정 유한 함의: `19d97a1aa16a038a8725b04056c93ad9c9d487154ed1f84cf0cbe1f0feecf128`
- 실제 새 점 결속: `4efc3c1892ed76454aba589b2a1fc886beb80e76308c927572464b095fe781a9`

경량 기록 SHA는 `a8609561d567e3ded006856bdcd2085850fb4cabe24adad3283f7b0ec3cd8cc7`이다. 실제270행 source receipt의 성공 여부와 실행 bytes는 후속 완료 addendum에서 결속해야 한다. 이 문서는 아직 그 결과를 대신하지 않는다.
