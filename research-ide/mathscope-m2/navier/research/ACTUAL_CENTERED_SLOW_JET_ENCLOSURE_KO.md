# 실제 중심 가중 radial pulse의 slow 1차·혼합 2차 수치 구간

## 1. 대상과 현재 검증 상태

이 확장은 원래 두 성분 비자율 Volterra 해, 이동 기저, 공분산 적분과 양의 가중치를 그대로 사용하여

\[
W_\pm(R,Z,T)=\sqrt{y_\pm(R,Z,T)}\,t_{r,\pm}(L_s/2;R,Z,T)
\]

의 세 1차 및 여섯 대칭 2차 slow 미분을 다룬다. 대표점, 정수 label, band, palette와 carrier는 먼저 고정한다. 평가점은 기존 실제 terminal member와 동일한

\[
X=X_{\rm rep}=X_b e^{-1/4},\quad \eta=\eta_{\rm rep}=0,
\quad s=s_{\rm rep}=1,\quad R=R_*:=\sqrt{2X},\quad Z=0,\quad T=1
\]

이다. 새 코드는 기존에 동결한 source나 public bundle을 수정하지 않는다.

**실행 상태:** 실제 source의 두 번째 실행은 **12/12 검사와 내부 source 검사 11개를 통과했고, 외부 프로세스 종료 코드도 0으로 관측했다.** 원래 식의 구조 차이를 검증하는 회귀 검사를 포함한 일반 kernel은 11/11 통과했다. 성공한 실제 프로그램은 439,629개 node이며 source graph SHA256은 `c4d8b3daca26c061ae227a6744654d41c67b6ffa98a8d7c62dfd518f52e04a00`이다. 첫 실패 실행과 당시 source snapshot은 삭제하거나 성공으로 고쳐 쓰지 않았다. 실행과 독립 수학 읽기 검토는 서로 다른 기록이다.

출력은 실제 미분을 **명시한 양의 원본 scale로 나눈 계수의 구간**이다. 아직 그 scale 자체를 고정 자릿수로 평가한 결과, 실제 torus 역상에서의 물리점, fast 미분 또는 전체 물리 curl 수치 결과가 아니다. 모든 원본 \(h,\epsilon\)은 엄밀히 양수로 유지한다.

## 2. 어떤 미분과 scale인가

이 문서에서

\[
D_R=R_*\partial_R,\qquad D_Z=\partial_Z,\qquad D_T=\partial_T
\]

이며 \(R_*\)는 **미분 전에 고정한 값**이다. 따라서 반복 미분은 \(D_R^2=R_*^2\partial_R^2\)이다. 가변 계수의 Euler 연산자 \((R\partial_R)^2\)와 구분한다.

원래 고정 대표점의 \(u,\lambda_0\)를 써서

\[
g=\frac{3\lambda_0u^2}{(1+u^2)^{3/2}},\qquad
m=\frac{r_0^2}{\sqrt{gL_s}},\qquad
\tau=-\frac{N\cdot T_{\rm source}}{A_c}>0,\qquad
A_0=\sqrt{\tau/m}
\]

를 정의한다. 이들은 새 임의 상수가 아니라 실제 source의 양의 expression root이다. 출력 18개는 각 부호마다 다음 아홉 가지다.

| 미분 | 출력 계수 | 비교 중심 |
|---|---|---|
| \(R,Z,T\) | \(D_iW_\pm/(A_0\sqrt{gL_s})\) | \(0\) |
| \(RR,RZ,RT,ZZ,ZT,TT\) | \(D_iD_jW_\pm/(A_0gL_s)\) | \(-\mu_i\mu_j(W_\pm/A_0)\) |

비교 중심이 0인 행에도 **양의 잔여항 반경**을 붙인다. 실제 \(\epsilon\) 항, 다른 pulse 성분의 응답, target 미분 또는 움직이는 frame 미분을 0으로 치환하지 않는다.

## 3. 실제 두 성분 해의 모든 2차 변분

각 부호의 원래 system은

\[
w'=Mw,\quad w(0)=(1,0)^t
\]

이며 \(M\)에는 \(n'\) 압력 보정, \(B'\) 기저 연결 및 원래 \(d-d_{\rm ref}\) 감쇠 차가 모두 남는다. source adapter는 caller가 미분행렬이나 수치 norm을 넣는 경로를 제공하지 않는다. 실제 \(M\) body에서

\[
w_i'=Mw_i+M_iw,
\qquad
w_{ij}'=Mw_{ij}+M_iw_j+M_jw_i+M_{ij}w
\]

를 구성한다. \(i=j\)이면 두 첫째 forcing이 합쳐져 계수 2가 된다. 세 방향에 대해 \(1+3+6=10\)개의 두 성분 block, 즉 부호당 20성분이다. 기존 covariance value root는 이 새 변분 system에 private alias로 결속하며, 원래 value나 matrix를 교체하지 않는다.

각 부호에서 \(M,M_i,M_{ij}\)의 40개 scalar entry와 각각의 실제 \(v\) 미분을 생성한다. 고정 시간 구간에서

\[
U(f)=\sqrt{1+f(0)^2}
+\int_0^{L_s}\sqrt{1+(\partial_v f)^2}\,dv
\]

를 사용하는 원본 body의 FTC 상계가 Volterra 미분·수렴의 전제를 제공한다. 이 FTC 적분은 정확한 식이며, 수치 적분을 완료했다고 표시하지 않는다. 원본 smooth body와 분모의 비영성으로 envelope가 slow 변수에 연속이고, 국소적으로 유계이므로 미분된 순서 적분열의 국소 균등 수렴을 얻는다.

수치 오차에 필요한 norm은 별도의 유한 source power 계산으로 얻는다. 두 역할을 혼동하지 않는다.

## 4. 전체 원본 배경장과 감쇠의 기울기

이 실제 열린 terminal 근방에서는 모든 양의 차수 배경이 공통 지지집합 밖에서 사라진다. 원래 global moment를 복구한 axial field도 이 근방에서 사라진다. 따라서 실제 leading slow field와 원래 complete field가 같고,

\[
F=\mathcal B_*(R)f_o(y)H(z),\quad
\mathcal B_*(R)=E_* (R^2/2)^{-1-h},
\quad y=\log\frac{R^2}{2sX_{\rm tail}},\quad z=\frac{4T}{R^2}.
\]

원래 \(s^{-A-1/2}\) factor는 미분 전에 포함되어 있다. \(X=R^2/(2s)\), \(A=1/2+h\)이므로 양의 실수 거듭제곱의 항등식으로 radial factor와 정확히 합쳐진다. source chart의 \(s-Z^2s^{2h}=T\)는 원래 heat argument를 \(4T/R^2\)로 바꾼다. 특히 heat의 \(Z\) 의존성이 없다고 전체 \(F_{ZZ}\)를 없애면 안 된다. 원래 \(f_o(y)\)와 암시적 \(s\)의 곡률이 남는다.

실제 Gamma 밀도 전체를 보존하여

\[
H=1-hzD_0,\qquad H'=-hD_1,
\qquad H''=h(1+h)D_2
\]

를 쓴다. 부호가 고정되는 유한 Taylor 잔여항과 전체 Gamma moment가 \(D_0,D_1,D_2\)의 외향 구간을 준다. 무한 moment 급수가 수렴한다고 가정하지 않는다.

평가점의 reflected step argument가 \(1/8\)이므로

\[
a=\frac{\sigma(1/8)}{256},\quad
b_s=\frac{\sigma'(1/8)}{512},\quad
c_s=-\frac{\sigma''(1/8)}{1024},\quad f=1-ha.
\]

원래 Rayleigh 제곱값 \(\alpha=(-c_0)^2\)는

\[
\alpha=-\frac{RF_R}{2F}-1=h\mathcal A,\qquad
\mathcal A=1-\frac{b_s}{f}-\frac{zD_1}{H}
\]

이고

\[
\mathcal A_T=
\frac{c_s}{f}-\frac{h b_s^2}{f^2}
-\frac{zD_1}{H}
+\frac{z^2(1+h)D_2}{H}
-\frac{hz^2D_1^2}{H^2}
\]

이다. \(\xi=\mathcal A_T/\mathcal A\), \(\kappa_u=(1+u^{-2})/3\)라 놓으면 완전 감쇠항을 미분한 중심 기울기는

\[
\begin{aligned}
\mu_T&=(\kappa_u-1/2)(\alpha-h)
+\left(\frac{\kappa_u}{2}-\frac{\alpha}{2(1+\alpha)}\right)\xi,\\
\mu_R&=\frac32-2\kappa_u+(1-2\kappa_u)h-2\mu_T,\\
\mu_Z&=0\quad\text{(비교식의 값)}.
\end{aligned}
\]

일반 식 검사에서 원래 감쇠 미분을 빠뜨리면 동일성 검사가 실패한다. 실제 \(M_i/g\)와 이 비교 기울기의 차이는 아래의 양의 source 잔여항에 포함된다.

## 5. 원본 유한 미분 상계

반지름 \(R\)와 구분하여 source envelope를 \(\mathcal R\), 원래 source norm을 \(B\)라 쓴다. 실제 selector가

\[
B\ge 2^{128},\quad B\ge\mathcal R^{4096},\quad
S=\ell^2\ge B^{1024},\quad S/B\le L_s\le S
\]

를 준다. 원래 \(k=\lceil\epsilon^{-1/2}\rceil\)와 \(\ell\)의 최대식으로 \(k>S^8\), \(0<\epsilon<4/S^{16}\)을 얻는다. 거대한 정수와 실수 parameter를 binary64로 평가하지 않는다.

실제 implicit chart, cutoff와 complete heat의 유한 Taylor 계수에 절댓값 majorant를 적용했다. \(s-1=t_T+t_Z^2s^{2h}\), 원래 \(\sigma\)의 logistic 미분식, 그리고

\[
|H^{(j)}(z)|\le (h)_j(1+h)_j\le j!(j+1)!
\]

를 사용한다. 다변수 절댓값 증가량을 한 양의 indeterminate로 모은 뒤 다시 \(n!\)를 곱하면 모든 해당 mixed ordinary derivative를 포함한다. 0차부터 5차까지의 계산된 상계 계수는

\[
1,\ 34,\ 222764,\ 2976125004,\ 52970966813880,
\ 1178784498865381440
\]

이며 모두 \(2^{512}\)보다 작다. source \(F<\mathcal R^{71}\), \(f_oH>1/2\)를 사용하면 각 normalized slow field jet이 \(\mathcal R^{73}\)보다 작다.

이 값을 양의 \(B_s\)를 공통으로 제거한 **완전 moving frame**에 넣는다. \(\tau_v=v/L_s\), 실제 반올림을 유지한 \(\beta=L_sp/B_s\)에 대해

\[
\widehat n=
\left(\frac{\pm u}{2}-\tau_v\beta F_R,
\frac{\beta}{L_sR},
-1-\epsilon\tau_v\beta F_Z\right).
\]

midplane에서 \(\widehat n_z=-1\)이므로 원래 값과 비교값을 잇는 보조 parameter 선분 전체에서도 필요한 normal/tangent 제곱 분모가 1 이상이다. \(n'\) 압력 및 \(B'\)를 포함한 곱·역수·제곱근의 유한 미분 장부 최대 지수는 3313이며, \(3840<4096\)의 reserve 안에 들어간다.

이는 정확히 \(M,M_i,M_{ij},L_s\partial_vM_i\)와 비교 오차에 필요한 한 번의 보조 parameter 미분을 위한 계산이다. **모든 4차 slow \(M\) 미분을 인증했다고 확대하지 않는다.** 실제 beta와 비교 beta의 차이는

\[
\left|\beta+\frac{\pm u}{F_{R,*}}\right|
\le\frac{L_s}{kB_s}<\frac{\mathcal R^{40}}{S^7}
\]

이며, 다른 보조 오차 \(L_s^{-1},\epsilon\)과 함께 \(|D_iM_{11}(L_s/2)/g-\mu_i|\le B^{64}/S\)에 들어간다.

전체 target의 2차까지 미분도 원래 heat와 backward pressure kernel을 유지한다. \(s=\delta/\sqrt{1+\delta^2t}\)의 두 미분 및 \((1+\delta^2t)^{-k}\)의 미분을 전체 \(e^{-4t}\) moment \(1/4,1/16,1/32\)로 적분한다. nested pressure term을 포함한 최종 target power는 248이며, 실제 \(\tau>\mathcal R^{-60}\)를 나눈 뒤에도 \(B\)보다 작다.

## 6. 전체 시간 구간의 Riccati 미분과 Gaussian 잔여항

원래 full solution에서 \(r=w_-/w_+\)라 놓으면

\[
r'=M_{21}+(M_{22}-M_{11})r-M_{12}r^2.
\]

원래 cone은 \(w_+>0\), \(|r|\le B^{260}/S\)를 주고, parameter 미분 방정식의 선형 계수는 \(-1/B\) 이하이다. 실제 초기 미분은 0이다. 이 방정식을 한 번·두 번 미분하고 두 mixed 곱항과 quadratic 항을 모두 넣으면

\[
|r_i|\le B^6,\qquad |r_{ij}|\le B^{14}
\]

을 얻는다. \(q_i=D_i\log w_+\)의 정확한 식은

\[
q_i'=M_{11,i}+M_{12,i}r+M_{12}r_i.
\]

전 시간 구간 \(0\le v\le L_s\)에서

\[
|q_i'-M_{11,i}|\le B^{264}/S,\quad
|q_i''|\le B^{268}/S,\quad
|q_{ij}'|\le B^{20}
\]

이다. 따라서 \(v_0=L_s/2\), \(x=(v-v_0)\sqrt{g/L_s}\),
\(l_i=q_i(v)-q_i(v_0)\)에 대해 **구간 전체에서**

\[
\frac{l_i}{\sqrt{gL_s}}=\mu_ix+e_i,
\quad |e_i|\le\frac{B^{300}}{\sqrt S}(|x|+x^2),
\quad \frac{|l_{ij}|}{gL_s}\le\frac{B^{300}}{\sqrt S}|x|
\]

가 성립한다. 이는 중심 window 안에서만 사용하는 Taylor 식이 아니다. 그 때문에 tail에서도 계수가 \(B\)와 무관한 4차 polynomial majorant를 사용할 수 있다.

원래 \(\psi\)의 plateau에는 \(|x|\le64\)가 들어간다. 기존 실제 centered Gaussian 증명과 위 미분 장부를 결합하고 양쪽 tail에

\[
I_0=3/M,\quad I_1=3,\quad
I_n=3M^{n-1}+3(n-1)I_{n-2}
\]

를 쓰면, \(\int_M^\infty x^n e^{-x^2/6}\,dx\le e^{-M^2/6}I_n\)이다. \(M=64\), polynomial 계수 reserve \(2^{20}\)을 사용하여 전체 covariance jet 오차가 \(2^{-620}\)보다 작음을 유리수로 확인했다. 모든 Gaussian tail 및 \(B^{300}/\sqrt S\) 항은 양의 상계로 남는다.

## 7. 실제 H·역행렬·제곱근과 중심 상쇄

여기서 가장 중요한 구별은 \(a_i=w_{+,i}(v_0)\)를 **slow 함수로 미분한다는 것**이다. 평가점의 상수로 먼저 바꾸지 않는다. \(D=(A_c,u)\)를 고정하여

\[
\overline H_{ji}=\frac{H_{ji}}{D_jma_i^2},\qquad
\overline y_i=\frac{y_i m a_i^2}{\tau},\qquad
\overline T_j=\frac{T_j}{D_j\tau}
\]

이면 원래 \(Hy=T\)로부터 \(\overline H\,\overline y=\overline T\)이다. source adapter는 원래 covariance integrand의 40개 value/jet, 역행렬의 20개 항등식, square root의 18개 항등식을 별도로 생성하고 실제 AD body와 materialization이 같은지 검사한다.

양의 원래 값들에 대해

\[
\frac{W_i}{A_0}=\sqrt{\overline y_i}\frac{t_{r,i}(v_0)}{a_i}
\]

가 열린 근방에서 성립한다. \(\overline H\)의 Gaussian odd moment는 0이고 second moment는 \(\sqrt\pi/2\)이다. 따라서

\[
\frac{\overline H_i}{\sqrt{gL_s}}=0+E_i,
\qquad
\frac{\overline H_{ij}}{gL_s}
=2\mu_i\mu_j\overline H+E_{ij}
\]

와 각 entry의 양의 오차를 얻는다. 원래 source-directed interval로
\(\|\overline H^{-1}\|_\infty\le1\),
\(\overline y_i\in[1/8,1/2]\),
\(\sqrt{\overline y_i}\ge1/4\)를 확인한 다음 실제 inverse와 sqrt 미분을 전파한다. 모든 mixed 곱항을 포함한 reserve가 \(2^{12}\)이므로 최종 가중 wave jet의 잔여항 반경 \(2^{-600}>0\)을 사용할 수 있다.

일반 arithmetic 함수는 이 source 전제들을 스스로 인증하지 않는다. 새 private adapter만 원래 표현식, 실제 band, 전제 근거 및 generated derivatives를 묶는다. caller가 만든 객체, 복사한 certificate, 수정한 구간 또는 미분 matrix를 source로 받아들이지 않는다.

## 8. 실제 수치와 실행 기록

실행 입력은 `precisionBits:192`, 정확한 허용 폭 `1/1000000000000`이며, 원래 cutoff 구적의 최대 cell 수는 4096이다. 선행 centered 적분에는 이 허용 폭을 1024로 나눈 `1/1024000000000000`을 배정했다. 같은 실제 두 부호는 각각 독립된 구간으로 평가했으며, 그 값을 정확히 같다고 선언하지 않는다.

| 미분 | 실제 출력 계수의 표시값 또는 표시 구간 | 실제 값의 양의 scale |
|---|---|---|
| R, Z, T | `[-2^-192, 2^-192]` | \(A_0\sqrt{gL_s}\) |
| RR | 약 `-0.345885018733218` | \(A_0gL_s\) |
| RT | 약 `4.120502152339241e-26` | \(A_0gL_s\) |
| TT | `[-4.908723531800763e-51, -4.908722894563997e-51]` | \(A_0gL_s\) |
| RZ, ZZ, ZT | `[-2^-192, 2^-192]` | \(A_0gL_s\) |

RR/RT의 표시는 읽기 위한 근삿값이다. 판정에는 JSON에 보관한 정확한 유리수 끝점을 사용한다. TT의 표시 구간도 해당 정확한 유리수 구간을 바깥으로 감싼 것이다. 분석적 반경 \(2^{-600}\)은 양수이며 192-bit 격자로 외향 반올림할 때 최소 양의 폭이 보존된다. 이 표에서 0 주변 구간은 실제 도함수가 정확히 0임을 뜻하지 않는다.

| 실행 | 결과 | 내부 시간 | 외부 관측 시간 | 최대 RSS |
|---|---|---|---|---|
| source attempt1 | 실제 source 결속 실패, exit 1 | 54.038초 | 54.357초 | 2,983,079,936 bytes |
| source attempt2 | 12/12 및 내부 11개 PASS, exit 0 | 81.981초 | 82.389초 | 2,992,844,800 bytes |
| 별도 light kernel | 11/11 PASS, exit 0 | 로그에 기록 | 별도 실행 | 실제 source 생성 없음 |

첫 실패는 원래 producer의 `exp((-A-1/2)*log(s))`와 검사식의 `exp(-((A+1/2)*log(s)))`가 표현 graph에서 다른 node라는 점이었다. 새 검사를 원래 producer의 AST와 일치시켰고, 작은 fixture에서 지수 자체의 항등식·공유 함수 본문·원래 slow scale 미분항의 생략 거부를 확인했다. 원래 producer, 실제 field 또는 미분 body를 수정하지 않았다.

성공 실행은 문자 그대로의 local import closure 68개를 실행 전후 확인했다. closure SHA256은 `0b0c3c0048b0f6c25104fc82dc352c336635b61be2f6c25db167417a62df9b4f`, 입력 SHA256은 `82a9d8098ecdbb13a7b5ed0fa48d5233a8fc30049cfadcebef9a51cce605cebb`다. 성공 graph의 canonical 크기는 18,565,716 bytes이다. 상위 Git HEAD는 실행 시점의 이력이고, 새 모듈까지 결속하는 증거는 별도의 이 import manifest다.

실행 증거는 아래 파일들에 남긴다.

- [실제 성공 source JSON](evidence/centered-slow-jets-20261011/actual-centered-slow-jet-source-attempt2.json)
- [실제 성공 로그](evidence/centered-slow-jets-20261011/actual-centered-slow-jet-source-attempt2.log)
- [외부 프로세스 종료 관측](evidence/centered-slow-jets-20261011/actual-centered-slow-jet-source-attempt2-process.json)
- [첫 실제 실패](evidence/centered-slow-jets-20261011/actual-centered-slow-jet-source-attempt1.json)와 [실행 당시 snapshot manifest](evidence/centered-slow-jets-20261011/attempt1-source-snapshot/snapshot-manifest.json)
- [별도 light kernel 기록](evidence/centered-slow-jets-20261011/centered-slow-jet-light-validation.json)

## 9. 실행 파일과 범위

새 구현은 다음 파일로 분리한다.

- `actual-centered-slow-jet-enclosure-kernel.mjs`: 일반 변분·역행렬·sqrt·product 검사, whole-time Riccati 및 외향 산술.
- `actual-centered-slow-jet-source-bounds.mjs`: 원래 moving frame의 시간 변환과 target kernel의 유한 상계.
- `actual-centered-slow-jet-enclosure.mjs`: private source 결속, 실제 미분, 수치 구간과 certificate.
- `tests/actual-centered-slow-jet-kernel.test.mjs`: 비가환·mixed·생략·precision·cache 대조.
- `tests/actual-centered-slow-jet-source-check.mjs`와 `tests/run-centered-slow-jet-validation.py`: 단일 실제 source 실행 및 SHA/관측 종료 기록.

실제 실행 증거는 `research/evidence/centered-slow-jets-20261011/`에 별도 저장한다. 실패 실행이 발생하면 기존 파일을 덮어쓰지 않는다. source, generic, Worker 및 Browser 실행을 서로 대신했다고 표시하지 않는다.

이 단계의 실제 source 실행이 성공했지만 **전체 G-NUM은 계속 열린다.** 남은 실제 geometry/target scale의 숫자, fast 변수, harmonic phase·partition factor, 실제 물리점의 torus 역상, full curl 및 그 물리 미분은 추가 결속이 필요하다. 원래 H와 y의 모든 미분 body는 생성됐지만, 비정규화 H/y 미분의 수치 구간까지 이 packet으로 인증하지 않는다. 이 문서나 kernel의 일반 검사만으로 M3 진입을 승인하지 않는다.
