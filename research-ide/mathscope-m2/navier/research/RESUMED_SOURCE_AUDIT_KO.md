# 재개 작업의 독립 N3 원전·구성 감사

작성일: 2026-10-10. 감사 기준: v61 / commit `5fbd3f26…`, 기존 M2 판정 58 PASS / 6 PARTIAL / 0 OPEN.

이 문서는 기존 파일을 읽고 원전 및 식의 의존 관계를 대조한 결과다. 구현 담당자가 작성 중인 새 모듈을 일부 읽었지만, 이 감사에서는 코드·공유 체크리스트·원본 증거·배포 파일을 변경하지 않았다. 새 Lean 실행, 원 논문 전체의 독립 증명, 전체 58개 PASS의 수학적 재심사를 수행한 것으로 해석하면 안 된다.

## 1. 결론과 사용할 수 있는 실제 입력

**같은 N3 프로필의 실제 함수 정의는 남아 있다.** 바깥 프로필의 연속 적분과 작은 근, 실제 A.21 압력, 완전한 비선형 Banach 고정점, B.22/B.26/B.34 연결, B.8 복구, 열 외부장과 보상, 실제 C.12 변조 및 최종 전방 적분을 하나의 선택 순서로 정의한 자료가 있다. 함수가 지정되지 않은 상태와, 그 함수를 전체 영역에서 수치 평가하는 실행기가 없는 상태를 구별해야 한다.

현재 보관된 수치 관측은 실제 무한 코어에 관한 유한 관측이다. η=0의 값이나 유한 혼합 계수만으로 전체 두 변수 함수를 재구성할 수는 없다. 전체 함수를 식별하는 근거는 **동일한 실제 압력, 완전한 고정점 방정식, 유일성 및 무한 계수공간의 상계**다. 이 근거를 사용하면 전체 η에 대한 제한된 새 계산·해석 인증을 계속 만들 수 있다.

아주 큰 정확한 상수는 그 자체로 수학적 장애가 아니다. 소수로 펼치지 않은 유한 실수 식, 적분, 유일한 근, 수렴급수를 정확한 함수 표현으로 유지할 수 있다. 다만 그 표현을 생성한 것, 수렴 오차를 증명한 것, 실제 유한 근사값을 계산한 것, 원문 Lean 전제를 채운 것은 서로 다른 성과다.

## 2. 원래 완료 기준과 증거 식별자 보존

읽기 검사에서 다음을 확인했다.

| 대조 대상 | 결과 | 이 검사가 뜻하는 것 |
| --- | --- | --- |
| `evidence/original-m2-criteria.json` 대 집계 판정의 `title`, `criteria`, `sourcePage` | 64개 모두 일치, 불일치 0 | 원문 완료 기준 문자열을 줄여서 PASS한 흔적은 이 비교에서 없음 |
| 같은 원문 대 `navier/evidence/acceptance.json` | NS 16개 모두 일치, 불일치 0 | NS 판정에 실린 기준 문자열 보존 |
| `PINNED_N3.inputs` 파일 내용 대 SHA-256 | 6개 모두 일치 | M2가 가리키는 기존 N3 입력 내용 보존 |
| 같은 프로필 조립 receipt의 `acceptedEvidence` | 29개 모두 파일 존재·SHA-256 일치 | 실제 부착된 증거의 내용 식별자 보존 |

기준 시점의 여섯 PARTIAL은 N4-03, N4-04, N4-05, N5-04, N5-05, N5-06이다. 원문 제목은 각각 **차수별 inner Picard 풀이**, **차수별 radial cutoff와 모멘트 복구**, **유한 배경 잔차 검증**, **위상·편극·주파수**, **성장·감쇠 ODE 풀이**, **두 family의 positive covariance**다. 원문 청사진 페이지는 N4 세 항목 58쪽, N5 세 항목 60쪽이다.

기존 NS receipt의 `sourceInstanceCertified`, `allOrderSourceCertificate`, `fullN4`, `fullN5`, `formalComplete`, `globalNavierStokesConstruction`은 모두 false였다. 기존 PASS에 붙은 범위 제한도 남아 있었다. 예를 들어 N4-06은 입력 상수에 대한 조건부 bound, N4-08은 입력된 potential에 대한 합산, N5-07은 실제 source curl 연산자에 local probe jet을 적용한 결과, N5-08은 조건부 envelope·입력 도함수 검사였다. 이 감사는 이런 PASS를 실제 전역 N3 계수열이나 전체 시간 의존 해의 완료로 바꾸지 않는다.

## 3. 자료가 실제로 제공하는 것

아래 상대 경로의 기준 디렉터리는 `research-ide/mathscope-m1/navier/`다.

| 자료 | 실제로 제공하는 내용 | 자동으로 확대할 수 없는 내용 |
| --- | --- | --- |
| `followup-20261010-symbolic-gluing/ONE_PROFILE_SPECIFICATION.md` §§2–4 | 하나의 정확한 파라미터 계층, 최종 프로필의 전체 구성 순서, 실제 support와 reserved patch | 모든 값의 수치 평가, 모든 원래 Lean 전제의 실행 |
| `followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md` §§2–9 | 실제 압력, 공통 복소 tube, 완전한 고정점 연산자와 수렴, 원래 radial recurrence, 실제 무한 함수의 bound | 유한 계수표를 벗어난 전역 수치 관측의 완료 |
| 같은 디렉터리의 `symbolic_axis_jet.py` | 실제 압력·정규화 진폭·η 미분을 남긴 정확한 유리식 DAG, radial degree 2–64 | 이름만 있는 미분 node를 0으로 채운 값, 전 η 비선형 graph의 수치 평가 |
| `followup-20261010-symbolic-gluing/attempts/core-intervals-0002/receipt.json` | 실제 무한 코어의 75개 구간 관측; η=0, Y=0,1,2,4,41/10; radial 미분과 일부 η 미분 | 모든 η에 대한 값, 전체 프로필 인증 |
| `followup-20261010-same-datum-axis/evaluated-phi-mixed-comparison.json` | 실제 비선형 Φ의 125개 혼합 계수 enclosure, 75개 혼합 미분 관측 | nonlinear recurrence의 직접 평가, 한 Taylor chart로 전 η 범위 덮기 |
| `CONTINUATION_AND_NEW_DEBT.md` | 실제 B.22/B.26 연결, 유한 폭 선택, 새 B.8 debt의 전 η bound | 최종 프로필을 예전 임의 datum으로 대체하는 것 |
| `followup-20261010-final-stress-audit/ACTIVATION_COLLAR_BOUNDS_EN.md` | 실제 activation collar, 고정 공통 radial endpoint 및 변조 전 support 순서 | Xa 이후를 계속 자연 코어로 취급하는 것 |
| 같은 디렉터리의 `GLOBAL_STRESS_ASSEMBLY_EN.md` | 최종 같은 장의 stress·전방 moments·보상 뒤 일치, Ipos/Imean의 국소 power law | 국소 E,U만으로 최종 누적 moments·압력이 정해진다는 주장 |
| `followup-20261010-same-datum-axis/GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md` | 실제 **변조 전** 장의 지정 영역 J 및 유한 mixed derivative envelope | C.12의 높은 radial derivative에 N 인자를 누락하거나 J 밖에 그대로 적용하는 것 |

혼합 계수 artifact의 실제 η 근사 chart는 `|eta| <= rho/4`다. 정규화 좌표 ξ=η/j0에서 `|xi|<=1/16`이라는 별도 큰 disk는 비교 함수에 대한 것이다. 이 비교 disk를 실제 비선형 Φ의 평가 영역으로 가져오면 안 된다. receipt도 `nonlinearRecurrenceDirectlyEvaluated:false`, `wholeEtaIntervalCoveredByOneTaylorChart:false`를 명시한다.

핵심 파일의 내용 식별자는 다음과 같다.

| 파일 | SHA-256 |
| --- | --- |
| `ONE_PROFILE_SPECIFICATION.md` | `38d8a88220094cf2e6b2571f214f38361783669b646c0c08eb206eb2b9100bdd` |
| `SAME_DATUM_ANALYTIC_AXIS.md` | `1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920` |
| `core-intervals-0002/receipt.json` | `8f65d85d903df534c2c10501119fbcef636678c95ec214e165041681d16fb5a5` |
| `evaluated-phi-mixed-comparison.json` | `eb7e2448416c4be63d86c41d2be7ad6c6c11c057bc2a852b30b95807232e49b5` |
| `CONTINUATION_AND_NEW_DEBT.md` | `b2b4dfc3f1223e3a5e2bb09043dc649d48d2cda16813d6c719f7d47f6b0214e2` |
| `ACTIVATION_COLLAR_BOUNDS_EN.md` | `2035fa202134d7ca0affcad7ad7aafbb05e3508fde3a5f34a3f2cea6fd003750` |
| `GLOBAL_STRESS_ASSEMBLY_EN.md` | `3c89af370fb2728bc407f5192493eb7474666051289626c57b73f19da7e59516` |
| `OUTER_DERIVATION.md` | `ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81` |
| literal schedule 구현 `followup-construction/outer.mjs` | `4c0213f892a32611c79655fbe065cebbaca0fc9acdd0cf2dd057d2506a10c087` |

## 4. 실제 코어를 식별하는 함수 정의

선택된 정확한 수는 다음과 같다.

\[
T=e^{2^{20}}+10,\quad P_*=e^{2T},\quad
\lambda=e^{-1000T},\quad h=e^{-8002T},\quad j_0=h^4,
\]
\[
\sigma=j_0/2000,\quad\rho=\sigma^2/65536,\quad
Q=2^{260}P_*^2/\sigma^2,\quad\Lambda=Q^{64},
\]
\[
C=(1+Q^{300})^{10}e^{Q^{200}},\qquad
t_1=\kappa_0=\omega_1=\omega_2=C^{-120}.
\]

여기에서 0<h,λ,t1<1 및 C<∞는 정확한 실수 명제다. underflow가 난 표현을 0으로 바꾸거나 C를 무한대로 바꾸면 실제 source가 달라진다.

`SAME_DATUM_ANALYTIC_AXIS.md`의 실제 압력은 고정된 바깥 schedule이 생성한 유한 양의 측도 μ에 대해

\[
P(z)=-\int(1+z^2)^{-2\theta(y)}\,d\mu(y),\qquad 0\le\theta\le1
\]

로 정의된다. 측도 질량과 복소 strip bound가 주어져 있고, η 미분은 이 실제 적분을 미분한 것이다. 임의로 주어진 압력 norm을 source로 삼지 않는다.

같은 노트의 완전한 `naturalRemainder`와 resolvent를 사용한 무한 계수공간의 실제 고정점을 x=(Φ,u)라 하자. 반경 1의 실제 ball, x0, F가 명시되어 있으며, ε=1/(2Q^32)와 더 강한 displacement 29Q^-53을 따로 가진다. Picard 반복 x^(n+1)=F(x^(n))은 이 ball에 머물고

\[
\|x-x^{(n)}\|\le\varepsilon^{n+1}/(1-\varepsilon)
\]

를 만족한다. 이 함수 정의와 오차식을 활용하는 것은 가능하다. 그러나 비교용 Bessel 계수에 이 displacement를 더한 유한 구간 표를 실제 nonlinear recurrence 자체의 실행이라고 부르면 안 된다.

## 5. 전 η strip와 실제 activation collar의 독립 계산

### 5.1. 무한 계수공간에서 복소 strip로

원래 가중치의 radial base는 **20**이다. 실제 f의 Bρ norm이 M 이하일 때, 각 실수 η0에 대한 Taylor 전개와 이항 생성함수를 합하면 다음 상계를 얻는다.

\[
|\partial_Y^k\partial_\eta^s f(Y,\eta_0+z)|
\le \frac{M(k+s)!}{20^k\rho^s
(1-|Y|/20-|z|/\rho)^{k+s+1}}.
\]

이는 `|Y|/20+|z|/rho<1`에서 성립한다. 도출 과정은 계수 상계의 `(n+1)^2(m+1)^2`를 1로 낮추고, n=k+ℓ로 치환한 뒤

\[
\sum_{\ell,m\ge0}\frac{(\ell+m+d)!}{\ell!m!}a^\ell b^m
=\frac{d!}{(1-a-b)^{d+1}}
\]

를 사용하는 것이다. 따라서 `|Y|<=5`, `dist(eta,I)<=rho/4`에서

\[
|\partial_Y^k\partial_\eta^s f|
\le \frac{M\,2^{k+s+1}(k+s)!}{20^k\rho^s},
\qquad I=[-33/32,33/32].
\]

이 계산은 실제 무한 norm의 귀결이다. 유한 125개 coefficient array의 표본을 전 영역으로 보간한 주장이 아니다.

### 5.2. Xa 다음에는 실제 B.26을 사용한다

공통 endpoint는 `a^2=Xa exp(t1/16)`, `Xa=4/Lambda`다. 이 endpoint는 Xa보다 크므로 그 사이에 실제 activation이 들어간다. 양의 차수 cutoff를 선택할 때 다음 순서를 유지할 수 있다.

\[
X_a e^{t_1/128}<X_a e^{t_1/64}<X_a e^{t_1/32}
<a^2=X_a e^{t_1/16}<X_a e^{t_1/8}.
\]

마지막 endpoint는 기존 leading modulation의 시작이다. 새 양의 차수 cutoff와 기존 modulation의 Xminus 표기를 혼동하면 안 된다.

0≤y=log(X/Xa)≤t1/16에서는 B.26에 쓰이는 reference가 여전히 자연 코어와 같다. κ(y)=1−(1−t1)σ(y/t1)를 사용하면, F=φ/C에 대한 실제 activation은

\[
F_s(y,\eta)=g(\eta)\Phi(4,\eta)
\exp\!\left(\int_0^y\kappa(s)
\frac{Y\Phi_Y}{\Phi}(4e^s,\eta)\,ds\right),
\]
\[
U_s(y,\eta)=U_{nat}(4,\eta)+\Lambda^{-1}
\int_0^y\kappa(s)Y u_Y(4e^s,\eta)\,ds
\]

로 쓸 수 있다. 필요한 함수 및 적분이 모두 같은 source에 결속된다.

δ=rho/(1024Q)를 선택하면 위 무한 norm 상계와 실수에서 Φ≥1/4를 이용해 복소 strip에서

\[
|\Phi|\ge\tfrac14-\tfrac1{256}=\tfrac{63}{256}>\tfrac18,
\qquad |1/\Phi|<8
\]

를 얻는다. `4 exp(t1/16)<4.1`, `8Qt1<1`이므로 같은 전체 collar에서 `|F|<=6Q`, `|U|<=6`, `|Pi|<=2Q`라는 보수적 상계가 가능하다. raw φ를 쓰는 행렬에는 C를 유지해야 한다. F=φ/C로 계산하면 6성분 계를 정확히 conjugation한 사실을 기록해야 한다.

### 5.3. 새 n=1 majorant에 대한 읽기 검토

작성 중인 `mathscope-m2/navier/actual-background-majorant.mjs`의 식을 독립 삼각부등식으로 점검했다. 이 검토는 아래 식과 그 가정에 대한 것이며 해당 모듈 전체 테스트나 형식 증명을 대체하지 않는다.

\[
B=4096\Lambda^2Q^3/t_1,\qquad
\|\Omega_0/X\|\le4096B^2/\delta^2,\qquad
\|f_1\|\le65536B^2/\delta^2,
\]
\[
C_1=2^{18}B^2/\delta^2.
\]

activation의 r=YΦY/Φ에 대해 `|r|<=8Q`, `|d_y r|<=16Q+64Q^2<=80Q^2`다. 실제 step의 `|sigmaPrime|<9`와 X≥4/Λ를 대입하면 제시된 FXX, UXX, ΠXX 상계에 여유가 있다. radial average를 축에서 특이한 나눗셈으로 평가할 필요도 없다.

v=V0/X를 사용하면 source 식은

\[
\frac{\Omega_0}{X}=
\frac{D\eta v_\eta+v+Xv_X}{L}
+v(v/2+Xv_X)
+\frac{U_0}{L}\{d v_\eta-2\eta(v+Xv_X)\}
-2(2v_X+Xv_{XX}).
\]

`a^2<1`, `delta<1`, `B>=1`, `|eta|<=2`, `|d|<=3`, `|L^-1|<=2`, `|U|<=B` 아래에서 `|v|,|vX|,|vXX|<=28B/delta`, `|v_eta|<=112B/delta^2`를 넣으면 네 묶음은 각각 336, 1176, 1120, 168 배의 `B^2/delta^2` 이하다. 합 2800은 4096보다 작다.

source strip δ/4와 solution strip δ/8 사이의 손실 Δ=δ/8을 구별해야 한다. A=C1a, pk=ceil(k/2)라 하면 k≥1, Δ≤1에서 Picard 항의 bound는

\[
B_k\le\left(\frac{3A}{\sqrt{2\Delta(k+1)}}\right)^{k+1}
\]

로 낮출 수 있다. 따라서 `K>=ceil(72 A^2/Delta)`이면 k≥K에서 우변의 밑이 1/4 이하이고, tail은 `4^-K/3` 이하다. `K>=ceil(bits/2)`까지 요구하면 2^-bits보다 작다. K가 정확한 유한 정수 식이라는 사실과 실제로 K항을 실행했다는 사실은 별개다.

## 6. N4-04: 실제 모멘트 보정의 정확한 함수 DAG는 가능한가

### 6.1. 수학적으로는 가능하며 새 임의 입력이 필요하지 않다

실제 n=1 inner Picard 해를 얻었다고 하고, η와 무관한 고정 smooth cutoff κ로

\[
\widetilde U=\kappa U_1^{in},\qquad
\widetilde E=(R/C)\kappa\phi_1^{in},\qquad R=\sqrt{2X}
\]

를 정의한다. 다음 다섯 함수는 실제 원문 연산자를 n=1에 대입해서 얻는 exact integral node로 표현할 수 있다.

\[
\begin{aligned}
m_1^0&=\int R\widetilde U\,dR, &
m_2^0&=\int R^2\widetilde E\,dR,\\
m_3^0&=\int(2E_0\widetilde E-\Omega_0)R^{-1}\,dR, &
m_4^0&=\int R^2(U_0\widetilde E+\widetilde U E_0)\,dR,\\
m_5^0&=\int[2R U_0\widetilde U-R E_0\widetilde E+(R/2)\Omega_0]\,dR.
\end{aligned}
\]

적분구간은 0부터 ∞까지이나 integrand의 support·축 regularity를 이용하면 유한 구간의 실제 연속 적분이다. Ipos에서 `U0=0`, `E0=e_* f(eta) R^(-1-2lambda)`이고 e*>0, f>0다. 고정된 실제 bump 적분 행렬을 BU, BE라 하면

\[
\alpha=-B_U^{-1}(m_1^0,m_4^0/(e_*f))^T,
\]
\[
\beta=-B_E^{-1}(m_2^0,m_3^0/(2e_*f),-m_5^0/(e_*f))^T
\]

는 실제 보정계수를 정의한다. 이 선형 보정에는 debt가 작다는 별도 전제가 없다. λ>0, ordered disjoint bump support, 양의 bump mass로 행렬이 가역이고, 실제 debt가 유한한 smooth 함수이면 계수가 정의된다. λ가 작아서 역행렬이 커지는 것은 원문에서 금지한 일이 아니다.

**그러므로 수치 크기만을 이유로 actual n=1 moment repair가 원천적으로 불가능하다고 판단하면 부정확하다.** 정의가 완전히 결속된 함수 DAG와 그 의미를 검사하는 연산자로 실제 보정을 구성할 수 있다.

### 6.2. 실제로 연결해야 하는 의존 관계

위 다섯 식에서 m3와 m5의 Ω0 항이 핵심이다. Ω0는 전체 **최종 leading U0,V0**로 계산해야 한다. inner 코어만의 Ω0 또는 modulation 전 장의 Ω0로 바꾸면 다른 모멘트를 보정하게 된다. Ω0는 Ipos 이후에도 남을 수 있고, leading U0=V0=0인 Xv 이후에야 반드시 0이다.

전체 source recipe는 존재한다. 따라서 이 의존 관계를 해결하기 위해 사용자가 새 임의 initial value를 제공할 필요는 없다. 구현에서 아직 해결하지 못한 부분은 다음처럼 구체적으로 표시해야 한다.

1. actual inner Picard node가 실제 pressure·B.26·공통 strip·C1·tail에 연결되는가. 단순한 함수 이름이나 caller-supplied norm으로 끝나면 안 된다.
2. 전역 leading field의 단계별 함수, implicit root, loop의 phase `N log X`, 전방 moment가 실제 같은 조립 recipe에 연결되는가. 기존 premodulation bound S를 최종 고주파 장의 radial derivative bound로 그대로 쓰지 않는다.
3. Ω0/X의 축 regularity와 Xv 뒤의 정확한 support 소멸을 사용해 적분이 유한함을 검증하는가. requested η derivative의 미분·적분 교환에는 같은 구간의 bound가 필요하다.
4. bump의 질량 1과 행렬 원소가 **정확한 적분**인가. 기존 interval matrix의 임의 점을 실제 행렬로 선택하면 안 된다. 작은 λ에 대한 confluent row transform을 쓰면 debt의 동일 row transform 및 physical scale도 함께 변환한다.
5. α,β를 넣은 실제 En,Un을 만든 다음 Vn,Πn을 같은 전방 적분으로 재구성하는가. 다섯 모멘트의 상쇄를 함수의 선형성·행렬식으로 검사하고, 입력 해시 및 cutoff·support에 연결해야 한다.
6. 실제 5개 함수 복구가 끝나기 전에 n+1 source를 생성하지 않는가. n=1 stress support와 n≥2 support를 하나로 합치면 안 된다.

기존 식을 충실하게 해석하는 exact functional operator는 의미 있는 계산이다. 반면 문자열 `m=0` 또는 실행 의미가 없는 opaque `ActualOmega0` node를 출력하는 것은 모멘트 보정 수행의 근거가 아니다. 소수 점값 출력이 반드시 필요한 것은 아니지만, exact node의 의미·의존·적분 유한성·상쇄 증거가 필요하다. 수치 enclosure 또는 도함수 tail을 추가로 주장하면 해당 연산의 오차 전파까지 필요하다.

## 7. 실제 Imean 국소 evaluator와 방사 성분

Imean은 main axial pulse **이전**의 reserved power-law 구간이다. B=1000T,

\[
X_0^{mean}=X_R\exp(T+2+60B-8),\qquad
x=X/X_0^{mean}\in(1,e^5)
\]

로 놓으면 최종 leading field의 국소 식은

\[
E=K_{mean}(1+\eta^2)^{-1}x^{-1/2-\lambda},\qquad U=0.
\]

literal step의 reflection으로 `integral_0^1 sigma=1/2`다. 초기 transition, 길이 T axial stage, entry transition, mean patch까지의 power-law 구간을 적분하면

\[
\log K_{mean}=\tfrac32T-\tfrac7{10}-\tfrac\lambda2
-(\tfrac12+\lambda)(60000T-8).
\]

상쇄를 먼저 수행한 같은 식은

\[
\boxed{\log K_{mean}=-\tfrac{59997}{2}T+\tfrac{33}{10}
+(\tfrac{15}{2}-60000T)\lambda.}
\]

이 normalization은 임의 국소 probe를 골라서 맞춘 값이 아니다. 정확한 source schedule의 적분 결과다. `followup-construction/outer.mjs`의 초기·axial·entry·reserved 단계 식을 재확인했지만, 그 파일의 역사적인 보통 크기 numeric fixture를 새 datum으로 사용하지 않았다.

### 7.1. U=0이어도 방사 속도는 0이 아니다

Imean 전의 axial moment는

\[
M(X,\eta)=\eta m_*,\qquad
m_*=X_R e\left(4+\int_0^T e^s k(s)\,ds\right),
\]
\[
k(s)=4\left[1-\sigma\!\left(\log(1+s)/2^{20}\right)\right].
\]

따라서 `4 XR e < m_* < 4 XR exp(T+1)`이고 m*>0이다. I1은 Imean 전에 다섯 모멘트 복구를 끝내며, I2는 E-only라 M을 변경하지 않는다. 그러므로 이 M은 최종 source에도 적용된다.

`2D=1-2h`, `d=1-eta^2`, `L=1-2h eta^2`를 대입하면

\[
V_0=-m_*\frac{2D\eta^2+d}{L}=-m_*,\qquad
u_r^{(0)}=-m_*/r.
\]

η=0에서 M 자체는 0이지만 Mη=m*>0이므로 같은 결론이다. 원래 `U=M=J=0`이라는 외부장 주장은 pulse와 그 보정 **이후**에 관한 것이다. Imean에 옮겨 쓰면 안 된다.

### 7.2. 양의 차수 velocity 소멸과 압력 소멸은 다르다

모멘트를 제대로 복구한 양의 차수는 Imean에서 `En=Un=Fn=Vn=0`이다. Stokes streamfunction cutoff를 미분할 때 생기는 `chiPrime*Fn` 항도 0이므로 이 결과는 합산된 velocity에 보존된다. 여기에는 Fn의 total moment 상쇄가 필요하다.

그러나 Πn과 Tn은 이 국소 zero 목록에 없다. 위 실제 m*를 원래 Ω0 식에 대입하면 독립적인 정확한 대조식을 얻는다.

\[
\boxed{\Omega_0=-\frac{m_*^2}{2X}\ne0,\qquad
\partial_X\Pi_1=\frac{m_*^2}{4X^2}>0\quad\text{on Imean}.}
\]

이는 V0가 X,η에 대해 상수이므로 T0,0 V0=0, Z0,0 V0=0, V0의 radial derivative=0이고, centrifugal term만 남는다는 직접 대입이다. core 또는 Ipos 뒤에서 Ω0를 0으로 설정하는 구현을 잡는 source-specific negative control로 사용할 수 있다.

### 7.3. 국소 크기 상계

Fscale=Kmean/sqrt(2X0mean)에 대해서

\[
\log Fscale=-60009T-5\log C+\tfrac{63}{10}
-\tfrac12\log220+(\tfrac{15}{2}-60000T)\lambda.
\]

`log C>=Q^200`, `log Q>=64020T`, `60000T lambda<1/4`를 사용하면 Imean의 `0<log x<5`, `|eta|<=1`에서 다음 보수적 bound가 성립한다.

\[
C^{-7}<Fscale<1,\quad F>C^{-8},\quad
R=\sqrt{2X}<C^6,\quad m_*<C^{12},\quad\lambda^{-1}<C.
\]

이 bound는 실제 국소 velocity와 도함수 normalization의 출발점이다. projector/frame의 모든 상수를 이 숫자에 묶으려면 해당 행렬·분모에 대한 별도 식 전개가 필요하다. 이 bound만으로 실제 T0 target이나 전체 annulus의 pulse 인증이 완료되지는 않는다. 특히 열 보상은 I,S,Cp를 바꿀 수 있으므로 stress는 최종 누적 moment ledger를 사용해야 한다.

## 8. pulse ODE의 실제 initial datum

원문에는 leading homogeneous pulse의 initial datum도 정해져 있다. moving frame에서 t^h=B(z+,z-)^T라 할 때 왼쪽 growing-coordinate datum은 `zPlus(0)=P(0)`, `zMinus(0)=0`이다. P는 midpoint에서 1로 정규화한 실제 growth/decay envelope다.

이는 prescribed forcing의 ODE inverse에서 쓰는 zero datum과 다른 문제다. 또한 midpoint에서 임의 단위 벡터를 골라 양쪽으로 적분하는 방식과도 같은 initial value problem이 아니다.

underflow를 피하려면 원문의 ratio 식을 사용할 수 있다. r=zMinus/zPlus와 log(zPlus/P)를 미지수로 삼으면 초기값은 모두 0이고, P(0)는 정확한 양의 exponential 식으로 유지된다. 이 변수의 방정식은 실제 frame error Eij, growth λ, damping d와 dref를 사용한다. 이 방법은 source가 정한 datum을 바꾸지 않으면서 작은 amplitude를 보존한다.

실제 projected ODE 계수는 여전히 actual slow background와 그 도함수, phase, moving frame에 연결되어야 한다. 국소 Imean velocity 식은 그 입력 일부를 실제로 제공할 수 있다. 하지만 영역 전체의 nonzero normal denominator, frame determinant, 성장/감쇠 비교, 양끝 Gaussian bound와 필요한 slow derivative bound는 그 같은 영역에서 각각 검증해야 한다.

## 9. 여섯 항목에 대한 구현·검증 경계

| 원문 항목 | 현재 새 작업에 사용할 수 있는 실제 근거 | 완료 주장을 위해 남겨서는 안 되는 빈자리 |
| --- | --- | --- |
| N4-03 | 완전한 실제 코어, 실제 B.26 collar, 위 Bρ strip 변환과 C1/tail 경로 | 실제 source가 아닌 caller Cn; 공통 interval의 임의 축소; K항 미실행을 실행한 것으로 표시 |
| N4-04 | 위 actual n=1 다섯 적분식, exact Ipos bump/inverse, source 전체 recipe | global Ω0 의존 누락, interval matrix의 임의 대표값, En/Un 보정 뒤 Vn/Πn 미재구성, 다음 차수 선행 |
| N4-05 | 완료된 실제 유한 coefficient tuple이 있으면 differential polynomial과 stress 적분에 직접 대입 가능 | symbolic residual identity만으로 실제 N 증가·정밀도·격자 독립 잔차 추적을 대신하는 것; 미계산 CN,m·Km의 tail 인증 |
| N5-04 | 실제 Imean의 E,U,V0 식과 정확한 normalization/분모 규모, 기존 actual dyadic geometry | 임의 local probe를 actual source로 표시, frame lower bound 없이 interval point 확인만 수행, local domain을 전역으로 확대 |
| N5-05 | source가 지정한 homogeneous datum, ratio/log 변수, actual background에 대한 projected ODE | 예전 임의 midpoint datum, source 없는 계수, underflow를 exact zero 처리, 한 궤적 관측을 양끝 uniform Gaussian 인증으로 표시 |
| N5-06 | 실제 ± pulse를 얻은 뒤 exact angular/Haar 적분과 양의 두 열 solve를 구성 가능 | toy covariance를 actual T0 target으로 대체, heat-prepared cumulative moments 누락, 같은 slow box를 두 번 합산 |

특히 N4-05는 원문 기준 자체가 **N 증가에 따른 실제 잔차 감소를 정밀도·격자와 독립 추적**하도록 요구한다. exact functional construction과 오차 정리는 그 실험을 뒷받침하지만 실험을 했다는 기록을 대신하지 않는다. N5-06도 실제 covariance target과 두 family의 실제 적분이 결속되어야 한다.

## 10. 원전 접근 범위와 인용

주원전은 OpenAI의 [Finite Time Blowup for Navier–Stokes, 166쪽 PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)다. source lock의 SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다. 이번 읽기에서는 특히 §4의 물리 프로필·누적 적분, §5의 source 순서와 모멘트 보정·mean patch, §7의 homogeneous pulse, Appendix B의 coefficient-space·activation 정의를 확인했다. 새 식 전개와 보수적 bound는 위 저장소 노트의 같은-source 가정에서 독립적으로 도출한 것으로 구분했다.

공식 Lean source의 고정 commit은 `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`이고 기존 lock에는 Lean 4.34.0-rc2가 기록되어 있다. 이번 직접 웹 접근에서 두 Lean 원본 파일은 DisabledError로 읽지 못했다. 저장소의 pinned source inventory, 제출된 선언·노트·기존 kernel receipt는 확인했지만, 이를 새 원본 전체 읽기나 새 Lean build로 표현하지 않는다.

이 문서는 criterion status를 변경하지 않는다. 실제 함수의 정의가 존재하는 곳, 이미 계산된 유한 관측, 새로 도출 가능한 source bound, 아직 실행기에 연결되지 않은 연산을 분리하여 다음 구현이 같은 원문·같은 프로필에서 진행되게 하는 것이 감사 결과다.
