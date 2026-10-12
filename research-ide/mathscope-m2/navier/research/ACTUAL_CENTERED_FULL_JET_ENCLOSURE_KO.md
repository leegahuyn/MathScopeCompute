# 원래 중심 펄스의 세 성분 fast jet와 비중심화 a/H/y slow jet

## 1. 이 모듈의 대상과 수치 출력

`actual-centered-pulse-full-jet-enclosure.mjs`는 이미 인증한 원래 terminal auxiliary 중심에서 미분의 수치 구간을 추가한다. `actual-centered-slow-jet-enclosure.mjs`의 원래 두 20성분 Volterra 변분계와 `actual-adiabatic-pulse-center-enclosure.mjs`의 절대 중심값 구간을 같은 private centered 객체에 결속한다. 원래 source graph의 함수 몸체, 양의 \(h,\epsilon\), 정수 carrier의 반올림, 전체 압력 연결, 움직이는 기저, H 적분, 표적, 역행렬과 양의 제곱근을 유지한다.

새 출력은 **138개**이다. 앞서 완료된 radial slow 18개는 별도 인증으로 보존한다.

| 새 수치 계수 | 부호당 개수 | 두 부호 합계 |
|---|---:|---:|
| 세 weighted 성분의 \(v,vv,Rv,Zv,Tv\) | \(3\times5\) | 30 |
| 접선·축 성분의 \(R,Z,T,RR,RZ,RT,ZZ,ZT,TT\) | \(2\times9\) | 36 |
| 원래 \(a=w_+(L_s/2)\)의 slow jet | 9 | 18 |
| 원래 H의 두 열별 두 행의 slow jet | \(2\times9\) | 36 |
| 원래 \(y=H^{-1}\mathcal T\)의 slow jet | 9 | 18 |

각 행은 `originalDerivative`, `witnessDerivative`, `positiveExactScale`, `coefficient`, 유리수 `directedInterval`, 정확한 `width`와 실제 몸체 미분 결속을 갖는다. 별도로 두 부호의 실제 \(D_i\log a/(gL_s)\) root 6개를 보존한다. 이 6개는 위 138행에 중복 계산하지 않는다.

공통 source profile은 `same-profile-2026-10-10.3`이다. 평가점은 기존과 같은

\[
X=X_{\rm rep}=X_b e^{-1/4},\qquad
\eta=\eta_{\rm rep}=0,\qquad
s=s_{\rm rep}=1,\qquad v_0=L_s/2
\]

이다. 이 점을 새 torus 역상의 물리점이라고 선언하지 않는다. 새 물리점과 공통 band를 다루는 별도 모듈의 값이나 위상 0 조건을 이 도함수에 대신 대입하지 않는다.

## 2. 미분과 양의 스케일

\[
D_R=R_*\partial_R,\qquad D_Z=\partial_Z,\qquad
D_T=\partial_T
\]

이며 \(R_*\)는 반복 미분 전 고정한다. 따라서 \(D_R^2=R_*^2\partial_R^2\)이다. carrier, 대표점, \(L=L_s\)와 모든 label도 고정한다. source의 양의 normalizer는

\[
g=\frac{3\lambda_0u^2}{(1+u^2)^{3/2}},\qquad
m=\frac{r_0^2}{\sqrt{gL}},\qquad
A_0=\sqrt{\frac{\tau}{m}},\qquad
(D_0,D_1,D_2)=(1,A_c,u)
\]

이다. 여기서 \(\tau=-N\cdot\mathcal T/A_c>0\)는 원래 공분산 표적 스케일이다. 정규화 시간 \(\vartheta=v/L\)와 혼동하지 않는다.

원래 weighted pulse를 \(W_j=\sqrt y\,t_j\)라 하면 아래 양수를 각각의 미분이 끝난 뒤 나눈다.

| 도함수 | 양의 정확한 스케일 |
|---|---|
| \(D_iW_j\) | \(D_jA_0\sqrt{gL}\) |
| \(D_iD_kW_j\) | \(D_jA_0gL\) |
| \(\partial_vW_j\) | \(D_jA_0\sqrt{g/L}\) |
| \(\partial_v^2W_j\) | \(D_jA_0g/L\) |
| \(D_i\partial_vW_j\) | \(D_jA_0g\) |
| \(D^\alpha a\), \(1\le|\alpha|\le2\) | \((gL)^{|\alpha|}\) |
| \(D^\alpha H_{j,\pm}\), \(j=\theta,z\) | \((A_c\text{ 또는 }u)m(gL)^{|\alpha|}\) |
| \(D^\alpha y_\pm\) | \((\tau/m)(gL)^{|\alpha|}\) |

\(A_c,u,m,\tau,g,L,A_0\)는 원래 양의 expression root이다. 그 자체의 모든 수치값이나 상대오차를 이 모듈이 계산했다고 주장하지 않는다. **중심 진폭 \(a\)는 더 이상 미평가 스케일로 남기지 않는다.** 같은 private source의 절대 구간을 계수 산술에 사용한다.

## 3. 전체 시간 구간과 초기층을 포함한 fast 경계

\(w=(w_+,w_-)\), \(r=w_-/w_+\), \(q=\log w_+\)라 하자. 원래 계수에서 양의 고정 \(B_s\)를 정확히 소거하고 \(\vartheta=v/L\)로 바꾸면, 완전한 pressure 및 \(B'\)를 포함한 행렬이 `centeredNormalizedFullFrame`과 일치한다. 원래 행렬을 변경하지 않은 채 비교식의 세 작은 인자만 분리한다.

\[
M=\begin{pmatrix}0&0\\0&-2\lambda(v)\end{pmatrix}+E,
\qquad
|\partial_\vartheta^jE|\le B^{64}/S\quad(j=0,1,2).
\]

실제 \(1/L,\epsilon\), 반올림 오차는 양의 잔여항에 들어간다. 원래 source의 \(S\ge B^{1024}\), \(B\ge2^{128}\), \(S/B\le L\le S\), \(B^{-1}<g<B\)를 사용한다. 시간 전체의 비교 항등식은 두 부호에 대해 정규화된 실제 양의 제곱근 관계를 포함해 검사한다.

\[
r_v=M_{21}+(M_{22}-M_{11})r-M_{12}r^2,
\qquad q_v=M_{11}+M_{12}r.
\]

기존 전체 구간 cone 경계 \(|r|\le B^{260}/S\), \(|D_ir|\le B^6\), \(|D_iD_jr|\le B^{14}\)와

\[
A_r=M_{22}-M_{11}-2M_{12}r\le-B^{-1}
\]

를 사용해 \(r_v\), \(D_ir_v\)의 실제 선형 변분식을 적분한다. 초기값

\[
r_v(0)=M_{21}(0),\qquad
D_ir_v(0)=D_iM_{21}(0)
\]

를 0으로 놓지 않는다. 중심 구간 \([L/4,3L/4]\)에서 초기층의 양의 인자는

\[
0<e^{-L/(4B)}<S^{-4}
\]

이다. 실제 \(L/(4B)\ge S/(4B^2)>4\log S\)로부터 도출한다. 그 결과 \(|r_v|\le B^{267}/S^2\), \(|D_ir_v|\le B^{269}/S\), \(|r_{vv}|\le B^{270}/S^2\), \(|q_{vv}|\le B^{67}/S^2\)를 얻는다. 각 forcing, 초기값과 곱항은 `centeredFastStabilityPowerAudit`에 따로 기록한다.

원래 기준 envelope는 정확히

\[
P(v_0)=1,\qquad P_v(v_0)=0,\qquad
P_{vv}(v_0)=-g/L
\]

이다. 이는 새로 만든 Gaussian의 미분이 아니라 source의 \(P'=P(\lambda-d_{\rm ref})\), \(P''=P((\lambda-d_{\rm ref})^2+(\lambda-d_{\rm ref})')\)와 원래 곡률의 결속이다. 실제 \(P_v,P_{vv}\) root를 그대로 보존한다.

## 4. 움직이는 세 성분 기저의 별도 경계

행렬 노름만으로 amplitude의 노름을 대신하지 않는다. 새 ledger는 실제 \(B_\theta/A_c\), \(B_z/u\)의 slow 10개, \(v,vv\), 세 slow–v 혼합 미분과 비교식의 보조인자·정규화 시간 미분을 생성한다. 원래 \(A_c>R_{\rm env}^{-6}\), \(u>1\)는 모든 미분에서 고정한다.

원래 필드의 5차까지 유한 경계, normal의 4차까지 경계, 양의 tangent 분모를 별도로 사용한 계산은

\[
|\text{필요한 normalized amplitude jet}|
<R_{\rm env}^{1132}<B
\]

를 준다. 필요한 finite primitive 차수와 실제 생성한 미분만 의미하며, 모든 4차 slow 행렬 미분의 수치 완료라는 뜻이 아니다.

비교 중심의 정확한 행은

\[
B_r=(1,1),\qquad B_\theta/A_c=(1,-1),\qquad
B_z/u=(\mathrm{sign},\mathrm{sign})
\]

이다. 음수 부호에서도 제곱근의 두 radicand가 같음을 먼저 증명한다. 실제 amplitude는 비교값과 같다고 놓지 않으며, \(<B^3/S\)의 entry 오차와 원래 \(r\) 및 그 도함수를 유지한다.

\(Y=yma^2/\tau\)를 사용하면 원래 radial 항등식은 \(W_r/A_0=\sqrt Y(1+r)\)이다. 이미 검증한 radial slow jet에서 \(\sqrt Y\)의 first/second 계수를 얻고, 위 실제 기저의 완전한 Leibniz 항과 결합한다. 추가 error budget은 보수적으로 \(2^{-560}\)이다.

\[
\frac{\partial_vW_j}{D_jA_0\sqrt{g/L}}=0+\mathcal E,
\qquad
\frac{\partial_v^2W_j}{D_jA_0g/L}
=-\frac{W_j}{D_jA_0}+\mathcal E,
\]

\[
\frac{D_i\partial_vW_j}{D_jA_0g}
=\mu_i\frac{W_j}{D_jA_0}+\mathcal E,
\qquad
\frac{D_iD_kW_j}{D_jA_0gL}
=-\mu_i\mu_k\frac{W_j}{D_jA_0}+\mathcal E.
\]

여기서 \(\mathcal E\)는 양의 엄밀 반경을 가진 오차이다. 공통 양수 구간이 여러 성분의 값을 포함하더라도 그 성분들이 서로 같다고 주장하지 않는다. 음수 sign의 축 성분은 **구간의 방향을 뒤집으며**, 양의 \(u\) 스케일의 부호를 바꾸지 않는다.

## 5. 전체 반 펄스 적분으로 계산한 중심 log 기울기

중심의 \(D_i\log a\)는 순간 기울기 \(\mu_i\)와 다르다. 실제 \(q_i(0)=0\)와 양의 cone를 사용하면

\[
D_i\log a=\int_0^{L/2}D_i(M_{11}+M_{12}r)\,dv.
\]

이 식의 원래 미분 integrand와 적분 root를 모두 보존한다. \(t=\vartheta+1/2\)라 쓰고

\[
c_i=\frac{D_iF}{F}+\frac{D_i\alpha}{2\alpha},\qquad
d_i=\frac{D_iF_R}{F_R},\qquad
\alpha=-1-\frac{RF_R}{2F}>0
\]

라 하면 완전 감쇠를 미분한 비교 \(M_{11,i}/g\)를 적분할 수 있다. 유한 양의 \(u^{-2}\)의 오차를 남긴 두 계수는

\[
I_A=\frac{\log2}{3},\qquad
I_B=\frac{\log2}{3}-\frac7{72},\qquad
\nu_i=I_Ac_i-I_Bd_i.
\]

실제 유한 \(u\)의 적분과의 차이는 각각 \(8/u^2\), \(64/u^2\) 이하이다. 전체 시간의 원래 mode 및 frame 차이 \(B^{266}/S\)와 합쳐

\[
\left|\frac{D_i\log a}{gL}-\nu_i\right|<2^{-600},
\qquad
\frac{|D_iD_j\log a|}{(gL)^2}\le B^{23}/S
\]

를 얻는다. 두 번째 log 도함수는 0이 아니다.

원래 heat/terminal field는 \(\alpha=h\widetilde A\), \(\alpha_T=hA_T\), \(D_R\alpha=-2\alpha_T\), \(F_T/F=\alpha-h\)를 준다. 이 항등식에는 전체 Gamma moment와 원래 step, implicit slow chart 인자가 들어 있다. \(\xi=\alpha_T/\alpha\)로 쓰면

\[
\begin{aligned}
c_R&=-2(1+\alpha)-\xi,&
d_R&=-3-2\alpha-\frac{2\alpha_T}{1+\alpha},\\
c_T&=\alpha-h+\frac\xi2,&
d_T&=\alpha-h+\frac{\alpha_T}{1+\alpha},\\
c_Z&=0,&d_Z&=0.
\end{aligned}
\]

Z 비교값도 실제 도함수의 0 대입으로 쓰지 않고 양의 오차 구간으로 반환한다. \(\nu_R\)의 비교 중심은 \(\log2/3-7/24\)이다. 엄밀 계수는 양의 \(h\)와 \(\xi\) 구간을 유지해 계산한다.

## 6. a, H, y의 완전한 비중심화 곱미분

\(K=H/a^2\), \(Y=a^2y\), \(q=\log a\)를 같은 실제 함수로 정의한다. 미분은

\[
a_i=aq_i,\qquad a_{ij}=a(q_iq_j+q_{ij}),
\]

\[
H_{ij}=a^2\{(4q_iq_j+2q_{ij})K
+2q_iK_j+2q_jK_i+K_{ij}\},
\]

\[
y_{ij}=a^{-2}\{(4q_iq_j-2q_{ij})Y
-2q_iY_j-2q_jY_i+Y_{ij}\}
\]

이다. \(Y\)에는 원래 전체 표적의 미분도 들어 있다. source는 표적을 고정한 다른 가중치로 바꾸지 않는다.

각 정확한 곱 항등식은 retained expression body의 공통 분모 대수로 확인하고, 실제 왼쪽 미분을 원래 AD 몸체와 별도로 materialize해 대조한다. 또 각 normalized H/y 몸체의 10개 미분이 기존 H/inverse의 원래 미분 root를 **고정된 양의 인자로만** 나눈 것과 같음을 검사한다.

기존 centered H/y의 first bound \(B^{32}\sqrt{gL}\), second bound \(B^{32}gL\)와 실제 positive inverse conditioning을 사용한다. 위의 비중심화 스케일에서 남는 모든 항은 \(B^{300}/\sqrt S\)로 흡수되며 유한 곱합 여유는 \(2^{12}\)보다 작다. 추가 반경 \(2^{-580}\)을 사용하여, 수치 계수의 leading term은 각각

\[
a_i/(gL)\sim a\nu_i,\qquad
a_{ij}/(gL)^2\sim a\nu_i\nu_j,
\]

\[
H_i/(Dm\,gL)\sim 2\nu_iH/(Dm),\qquad
H_{ij}/(Dm(gL)^2)\sim4\nu_i\nu_jH/(Dm),
\]

\[
y_i/((\tau/m)gL)\sim-2\nu_i y/(\tau/m),\qquad
y_{ij}/((\tau/m)(gL)^2)\sim4\nu_i\nu_jy/(\tau/m)
\]

이다. 여기의 \(\sim\)는 비교 계수에 명시된 양의 반경과 외향 반올림을 더한다는 표시이다. 등호나 점근식만으로 수치를 인증하지 않는다.

## 7. 인증, 검사와 실행 상태

일반 kernel은 source 권한을 갖지 않는다. source adapter는 동일한 private slow/absolute 객체만 받는다. 새 graph는 private 20성분 alias가 있는 **원래 slow graph에 append**한다. 복사한 descriptor만으로 alias 권한을 물려받지 않는다. 절대 중심값 predecessor에서 나중에 추가한 expression ID를 slow graph ID로 읽지 않는다. 각 predecessor의 봉인은 고정 prefix만 검사하여 정당한 후속 append와 원래 몸체 변조를 구분한다.

일반 및 작은 원본 인터페이스 검사는 14/14 통과했다. 여기에는 완전 감쇠 미분의 누락, 반복미분의 계수 2 누락, 제곱근 radicand 변경, 복사 descriptor의 가짜 권한, 원래 적분/역수의 고정 스케일 미분, 음수 축 방향, 초기값과 caller가 준 matrix·오차 전제의 거부가 포함된다.

**실제 source attempt1은 12/12 PASS, 외부에서 관측한 process exit code 0으로 완료했다.** `tests/run-centered-full-jet-validation.py`는 단일 Node process로 원래 source를 준비하고, source/root/row/범위/변조 대조와 import SHA를 확인했다. 내부 실행 시간은 162.581초, 외부 관측 시간은 162.952초이며 최대 RSS는 3,385,430,016 bytes이다. source 내부 제한 540초, 외부 제한 600초, Node heap 4096MiB 안에서 종료했다. 일반 14/14와 이 실제 source 12/12는 별도의 검사 범위이다.

완료한 원래 source graph는 **1,364,792 nodes, 57,964,788 canonical bytes**이고 SHA256은 `0399c296557ea4d3b8727cb47dd55bd6ccb069494690392e3f65fd5f152bb6d4`이다. 원래 selected graph와 기존 18행 slow graph도 고정 SHA로 재현했다. 실제 소스의 71개 literal import 파일은 실행 전후 모두 같았고, import manifest SHA256은 `86588f2853d01e4ac64ee92f83626e49a362d35cd54faecb6b52bcccbcab49d8`이다.

정식 증거 디렉터리는 `evidence/centered-full-jets-20261011/`이다. `actual-centered-full-jet-source-attempt1.json`의 SHA256은 `a54a5de3bef8fb33cec605e603d2902b71af28ffd9b76e6d9807a26b105e99a7`, `.log`는 `16d58b4db2e8478a9b5bff3a1a8d165258236026c4d8160b7931ee336872fe0f`이다. 별도 `-process.json`에 실제 종료 코드, 시간과 한 번의 source process 실행을 기록했고 `-preflight.json` 및 `-implementation-snapshot/`에 실행 당시 입력과 새 구현을 보존했다. 이 완료 기록은 원래 auxiliary point의 138행 수치 계수에 한정되며 아직 새 물리점의 미분 실행 기록은 아니다.

## 8. 남은 연결

이 모듈은 기존점의 세 weighted pulse 성분과 실제 a/H/y 미분의 **스케일을 분리한 수치 계수**를 제공한다. \(\xi\), phase 및 물리 좌표 map의 도함수, 움직이는 원통 기저와 완전 curl의 도함수를 수치로 모두 계산한 결과가 아니다. 원래 \(\chi,\psi\)의 중심 plateau는 확인하지만 \(\eta_\beta\)와 물리 chart의 미분까지 제거하지 않는다.

새 물리점으로 숫자 구간을 옮기려면 그 source의 새 평가 root와 추가로 입증한 근방 경계를 사용해야 한다. 기존점의 local FTC 연속성만으로 같은 수치 오차가 유지된다고 하지 않는다. 원래 \(P,\sin(k\Phi),\cos(k\Phi)\)와 coefficient curl을 미분한 뒤 물리점에 대입해야 한다. phase 0으로 값이 사라진 항의 도함수는 일반적으로 남는다.

모든 label의 전역 수치 실행, 모든 geometry/target 스케일의 상대오차, 전역 physical residual/flat-error 수치 구간, 새 Lean kernel proof와 전체 G-NUM 완료를 주장하지 않는다. 이 packet 단독으로 M3 개시를 승인하지 않는다.
