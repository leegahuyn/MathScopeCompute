# 실제 ell=1 표시 확장에서 비음수 공분산 가중치가 존재하지 않는 점

## 결론과 정확한 범위

현재 고정된 원본 source를 그대로 사용하되, **큰 band 정리 밖의 `ell=1`에 같은 local pulse 공식을 적용한 표시 확장**에는 다음 점이 있다.

\[
\ell=1,\qquad s=1,\qquad \eta=0,\qquad
X_*=X_b e^{-1/4},\qquad R_*=\sqrt{2X_*},\quad Z_*=0,\quad T_*=1.
\]

그 점을 slow point와 고정 대표점으로 함께 선택한다. 아래 원본 결속 및 해석적 증명은 두 공분산 열과 실제 target의 theta 성분에 대해

\[
\boxed{H_{\theta,+}<0,\qquad H_{\theta,-}<0,
\qquad \mathcal T_\theta>0}
\]

를 도출한다. 따라서 **\(Hy=\mathcal T\)를 만족하는 \(y_+,y_-\ge0\)는 존재하지 않는다.**

이 결론으로 `det(H)`의 부호나 비영성을 결정하지 않는다. 역행렬이 존재한다면 두 inverse weight 중 적어도 하나가 음수라는 조건부 결론만 얻는다. 두 개별 inverse weight의 부호는 계속 `UNKNOWN`이다. 정밀한 H quadrature로 얻은 수치 반례나 새로운 Lean kernel 증명으로 기록하지 않는다.

원문 정리의 반례도 아니다. 원문 §6.2는 충분히 큰 lower band \(\ell_0\), \(q_{\rm big}\le2^{-\ell_0}\), 그리고 엄격한 active 조건 \(q<q_{\rm big}\)를 요구한다. 이 고정점은 \(q=Q s=1/2\)이므로 **모든 \(\ell_0\ge1\) 선택에서 그 active 조건 밖**이다. 이와 별개로 현재 구현의 명시적인 인증 영역은 `ellMinimum`과 `qStar`로 정의되고, 그 영역의 비멤버십은 [band admissibility 증명](ACTUAL_COVARIANCE_BAND_ADMISSIBILITY_KO.md)에서 확인한다. 지정되지 않은 원문의 \(\ell_0,q_{\rm big}\) 실제 값을 실행했다고 주장하지 않는다.

이 결과는 현재 표시용 `ell=1` 확장을 원본 식 그대로 양의 covariance 구성으로 단순히 승격할 수 없다는 구체적 장애다. 전체 M2 목표는 원문 허용 영역의 후속 구성을 요구한다. `wholeGPOSComplete=false`, `m3MayStart=false`를 유지한다.

## 1. 결속된 원본과 검증 종류

새 [obstruction 모듈](../actual-covariance-ell-one-obstruction.mjs)은 private 원본 [operator](../actual-covariance-source-operator.mjs), [band 판정](../actual-covariance-band-admissibility.mjs), [완전한 heat leading source](../actual-continuation-exact-heat.mjs), [actual target](../actual-covariance-source-target.mjs)를 소비한다. 호출자는 field, 좌표, scalar bound, 행렬, proof flag를 입력할 수 없다.

검증에는 서로 다른 세 부분이 있다.

| 종류 | 확인하는 내용 | 이 종류만으로 주장하지 않는 내용 |
|---|---|---|
| 원본 body 결속 | 실제 h·C·XR·envelope, A.13의 모든 적분과 12개 outer stage, complete gamma/heat loss, 실제 frame·Volterra·Htheta·target root | 수치 H 값이나 모든 해석적 부등식의 자동 증명 |
| 정확 rational 대수 | 실제 moving-frame 생성자의 폐쇄 2×2 ODE, 정수·유리수 상수의 엄격한 여유, pressure를 뺀 실패 대조 | 주어진 일반 행렬을 actual source라고 인증 |
| 서면 해석적 증명 | 아래 heat 부호, support 환원, 실제 scalar 비교, 짧은 시간의 ODE 부호, 원문 A.54 target 부호 | 새로운 Lean kernel 증명 |

독립 검토는 [최종 source·수학 검토](evidence/m2-continuation-20261011/ELL1_COVARIANCE_OBSTRUCTION_FINAL_INDEPENDENT_REVIEW_KO.md), [이전 ODE·heat 후보 검토](evidence/m2-continuation-20261011/ELL1_COVARIANCE_OBSTRUCTION_INDEPENDENT_REVIEW_KO.md) 및 [A.13의 scalar 경계](evidence/m2-continuation-20261011/ELL1_TERMINAL_SCALAR_BOUNDS_KO.md)에 기록했다. 원문은 [Navier–Stokes PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), SHA256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다. 관련 식은 (6.8), (7.1)–(7.2), (7.27), (7.29), (A.13), (A.52), (A.54), (A.56)이다.

## 2. 대표점과 정확한 leading 환원

원문 (6.8)은 대표점을 격자 중심으로 제한하지 않는다. box와 active 집합의 교집합 안에서 임의로 선택한 뒤 고정한다. 임의의 고정 격자 원점에서도 각 좌표에 nearest integer를 택하면 offset은 \([-1/2,1/2]\)에 있다. 실제 bump는 그 구간에서 양수이므로 이 점을 포함하는 box가 있다. 이 설명은 **box·radial shell의 기하 규칙**에 대한 것이다. 앞서 분리한 원문 전체 active q 제한을 통과한 Γ label을 생성했다고 주장하지 않는다.

실제 원본의 첫 canonical cutoff는

\[
\log c_1\ge\frac{\log2+\log B_{1,0}}h,
\qquad B_{1,0}\ge1,
\qquad 0<h<2^{-4096}
\]

이므로 \(c_1\ge2^{1/h}>2^{129}\)이다. 원래 doubling 규칙은 모든 \(n\ge1\)에서 \(c_n\ge c_1\)를 준다. 현재 지원 범위 \(1\le\ell\le128\), \(s\in[1/2,2]\)에는 \(q\ge2^{-129}\)이므로 \(c_nq>1\)이다. 완전한 time cutoff와 모든 도함수는 그 위치에서 정확히 0이다. 별도의 \(\sigma\chi'(\sigma)\) stream 항도 포함한다. 따라서 이 표시 범위의 completed F,G는 open neighborhood에서 leading F,G와 정확히 같다.

원래 terminal stage의 길이는 3이며 \(X_b=e^3X_{\rm tail}\)이다. 고정점은

\[
\delta=\log(X_b/X_*)=1/4,\qquad
y=\log(X_*/X_{\rm tail})=11/4
\]

에 있다. heat cutoff는 이미 \(y\ge1/2\)에서 1이다. axial pulse가 끝나는 \(X_v\)는 \(X_{\rm tail}\)보다 앞이고 그 뒤에는 \(U=M=V=0\)이다. B.8, C.12, I1 및 I2의 실제 support도 이 terminal 점보다 앞에 있다. 각 stage의 길이와 선후관계는 원래 양의 A.13 wait를 포함한다.

원래 chart 식 \(s-Z^2s^{2h}-T=0\)의 단조 근은 \(Z=0,T=1\)에서 정확히 \(s=1\)이다. terminal F와 chart는 Z에 대해 짝함수이므로 \(F_Z=0\), G와 그 도함수들은 0이다. h를 0으로 바꾸지 않는다.

## 3. 원래 heat를 유지한 양성과 alpha

이 문서에서는 heat 함수를 \(H_{\rm heat}\), 공분산 행렬을 \(H\)로 구분한다. 원래 compactified improper 적분은 정확히

\[
H_{\rm heat}(z)=\frac1{\Gamma(1+h)}
\int_0^\infty e^{-v}v^h(1+zv)^{-h}\,dv,
\qquad z=\frac2X>0
\]

를 준다. 실제 graph의 `heatLoss`는 \(1-H_{\rm heat}\)이며 전체 무한 꼬리를 포함한다. gamma 적분의 양의 integrand와 적분 부분적분으로 평균 v가 \(1+h\)임을 얻는다. \((1+x)^{-h}\ge1-hx\)와 양의 integrand 비교로

\[
1\ge H_{\rm heat}(z)\ge1-h(1+h)z>1/2,
\quad 0<-H_{\rm heat}'(z)\le h(1+h)
\]

이다. \(h<1/16,z\le1/16\)에서

\[
0<-zH_{\rm heat}'/H_{\rm heat}<17h/128<h/4.
\]

gamma 적분과 그 first derivative의 적분 가능성은 \(e^{-v}v^h\)에 고정 다항식을 곱한 majorant로 보장된다. endpoint를 수치로 샘플링하거나 작은 heat correction을 버리지 않는다.

\(\rho_o=h/256\), \(f_o(y)=1-\rho_o\sigma(\delta/2)\)라 놓으면 현재 \(\delta/2=1/8\)이다. 원래 smooth step의 logistic exponent 및 도함수는

\[
z_\sigma(1/8)=-3072/49<-62,
\qquad z_\sigma'(1/8)=1024+1024/343<2^{11}.
\]

따라서 \(0<\sigma'(1/8)<2^{-51}\), \(0<f_o'/f_o<h2^{-59}<h/4\)이다. 이 점의 실제 F는

\[
F(X,0)=\frac{E_{\rm tail}e^{-(1/2+h)y}}{\sqrt{2X}}
\frac{f_o(y)}{1-\rho_o}H_{\rm heat}(2/X).
\]

그러므로

\[
\alpha=-1-\frac{XF_X}{F}
=h+z\frac{H_{\rm heat}'(z)}{H_{\rm heat}(z)}-\frac{f_o'}{f_o},
\qquad \boxed{h/2<\alpha<h<1/16}.
\]

이로부터 \(R F_R=-2(1+\alpha)F\), \(N=(-1,0)\), \(K=(0,-1)\), \(c_0=-\sqrt\alpha\), \(\lambda_0=2F\sqrt\alpha>0\)를 얻는다.

## 4. 실제 크기와 rounding을 포함한 normal 비율

여기서 source scalar \(\mathsf T=\exp(1048576)+10\)는 slow coordinate \(T_*=1\)과 다르다. [독립 scalar 증명](evidence/m2-continuation-20261011/ELL1_TERMINAL_SCALAR_BOUNDS_KO.md)은 원래 A.13 식에서

\[
0<Q_{\rm steep}<4,\quad
1<Q_b<7+32008\mathsf T,\quad
\rho_o<Q_p<1,\quad
0<\mathrm{wait}<16006\mathsf T+34
\]

를 보인다. 12개 stage를 모두 합치면

\[
y_{\rm end}=13e^{1000\mathsf T}+122009\mathsf T+135+\mathrm{wait}.
\]

원래 \(Q_{\rm prof}=2^{260}2000^2P_*^2h^{-8}\), \(\log C\ge Q_{\rm prof}^{200}\)와 비교하면 \(X_b<C^{11}\), \(R_*<C^6\)이다. terminal 시작 이전의 모든 log amplitude increment가 음수이므로 \(0<E_{\rm tail}<P_*\)이다. 실제 \(X_R=110(CP_*)^{10}\) 및 heat 상한을 사용하면

\[
0<F<\frac{2P_*}{\sqrt{2X_R}}
=\frac2{\sqrt{220}C^5P_*^4}<1.
\]

원래 envelope는 \(E_{\rm env}=\exp(C^{25600000})>C^3\), \(u=2E_{\rm env}^{10}\)이다. ell=1 geometry는 정확히 \(k=2\), \(1/2<\epsilon<1\), \(L_s=2^{-32+h}<2^{-31}\)이고

\[
B_s^2=\frac{F\sqrt\alpha}{2\epsilon(1+u^2)^{3/2}}<\frac1{4u^3}.
\]

actual rounding은 \(\lfloor kp_{\rm tilde}+1/2\rfloor\)에 원래 sign을 보존하는 nonzero fallback을 적용한다. \(p_{\rm tilde}\)의 부호가 family sign과 같으므로 \(\operatorname{sgn}p=\operatorname{sgn}\), \(|p|\ge1/2\)이다. \(p=\pm1/2\)나 반대 sign의 rounding 대칭을 가정하지 않는다.

\(b=p/R\), \(c=-B_s\)라 두면 실제 normal은

\[
n_r(v)=\operatorname{sgn}\frac{B_su}2+2(1+\alpha)Fb\,v,
\qquad n_\theta=b,\qquad n_z=c.
\]

\(R B_su<1/1024\), \(2RB_s<2^{-40}\)이며 추가 drift는 \((17/8)2^{-31}<1/1024\)보다 작다. 따라서 전체 pulse interval에서

\[
n_r/b>0,\qquad |n_r/b|<1/512<1/32,
\qquad |c/b|<2^{-40}<1/128.
\]

## 5. 실제 ODE에서 두 theta 진폭이 음수인 이유

원래 frame의 모든 connection과 moving-normal pressure를 유지하면 \(t'=(A_\phi-dI)t\), \(d=\epsilon k^2|n|^2\ge0\)이다. 실제 P와 w의 정의에서 reference \(\lambda,d_{\rm ref}\)가 정확히 소거된다. 양의 damping과 \(P(0)\)을 제거한 \(a=e^{\int d}t/P(0)\)는 \(a'=A_\phi a\), \(a(0)=B(0)e_1\)을 만족한다.

\(D_n=n_r^2+b^2+c^2>0\)라 놓으면 first two components는 다음 행렬로 닫힌다.

\[
M=\frac{2F}{D_n}
\begin{pmatrix}
-(1+2\alpha)n_rb & b^2+c^2\\
\alpha(n_r^2+c^2)-(1+\alpha)b^2 & -n_rb
\end{pmatrix}.
\]

이 행렬은 일반적인 비슷한 ODE를 새로 선택한 것이 아니다. 원래 `actualMovingPulseFrame`의 \(A_\phi\)와 정확 rational identity로 비교하며, pressure 항을 누락하는 대조는 실패한다. 실제 source frame의 \(K,n,n',A_\phi\)와 두 Volterra system의 matrix/initial roots도 별도로 결속한다.

위 normal 비율로 \(M_{21}<0\), \(\|M\|_\infty<4F\)이다. 원래 초기 frame은 \(a_r(0)=1\)을 주고, theta 성분에는 음의 항과 양의 항이 하나씩 있다. 양의 항 대 음의 항의 크기 비율 제곱은

\[
\alpha(1+4/u^2)(1+(B_s/b)^2)
\le\frac{16385}{131072}<1.
\]

따라서 \(a_\theta(0)<0\), \(|a_\theta(0)|<1\)이다. Gronwall과 \(F<1,L_s<2^{-31}\)로

\[
|a_r(v)-1|\le e^{4FL_s}-1
<\frac1{2^{29}-1}<1/2.
\]

즉 \(a_r>1/2\)이다. theta 방정식의 적분인자 공식에는 초기 음수와 \(M_{21}a_r<0\)의 적분만 남으므로 \(a_\theta(v)<0\)가 전체 pulse interval에서 유지된다. 원래 양의 damping/P를 복구해도 두 sign family 모두 \(t_r>0>t_\theta\)이다.

## 6. 실제 target과 공분산의 부호 충돌

실제 target는 complete leading field의 I,J,S,Cp prefix, 실제 finalized M, pressure datum, 두 viscous shear term을 모두 포함한다. B.8/C.12/I1/I2의 원래 moment 보존 및 heat cancellation을 유지하므로 terminal에서 원문 (A.54)의 backward stress와 같다.

원문 (A.54)의 세 항은 전체 heat velocity \(K>0\), \(K_r<0\), \(f_o'\ge0\) 때문에 모두 비음수다. 고정점 \(y=11/4\)에서는 \(f_o'>0\)여서 boundary 항 \(Kf_r>0\)이며 실제 \(\mathcal T_\theta>0\)이다. slow target factor \(s^{-A-1/2}\)는 이 점에서 1이다.

두 실제 공분산 열은

\[
H_{\theta,\pm}
=c_{\rm Haar}\int_0^{L_s}\psi(v)^2
t_{r,\pm}(v)t_{\theta,\pm}(v)\,dv,
\qquad c_{\rm Haar}>0.
\]

원래 \(\psi\)는 \([L_s/4,3L_s/4]\)에서 1이다. 적분 함수의 부호와 이 양의 길이 구간 때문에 두 적분 모두 엄격히 음수다. 따라서 비음수 y의 theta row는 0 이하이고, 양의 target와 일치할 수 없다.

## 7. 실행 기록과 변경 방지

실제 source 검사는 [source runner](../tests/actual-covariance-ell-one-obstruction-source.test.mjs)가 원본 graph 한 개를 만들어 수행한다. 고정점 대입 후 F·target·Htheta root에 자유 slow/representative 좌표가 남지 않음을 확인하고, Aphi에는 pulse v만 허용한다. 일반 대수·음성 대조는 [kernel runner](../tests/actual-covariance-ell-one-obstruction-kernel.test.mjs)가 별도 수행한다.

프로그램은 발급 당시 node prefix와 모든 metadata를 복사·봉인한다. caller의 program nodes 교체, source body 변경, completion flag 추가, copied private object는 거부한다. 이후 원본 G에 독립 식을 append해도 이미 발급한 band/obstruction compiler hash는 변하지 않는다. 최초 실행의 runner/source SHA를 나중 코드 SHA로 덮어쓰지 않는다.

2026-10-11의 실제 실행은 [source JSON](evidence/m2-continuation-20261011/actual-covariance-ell-one-obstruction-source-attempt1.json)과 [source TAP](evidence/m2-continuation-20261011/actual-covariance-ell-one-obstruction-source-attempt1.tap)에 저장했다. 첫 source 시도에서 **12/12 PASS, process exit 0**이었다. kernel은 [JSON](evidence/m2-continuation-20261011/actual-covariance-ell-one-obstruction-kernel.json)과 [TAP](evidence/m2-continuation-20261011/actual-covariance-ell-one-obstruction-kernel.tap)에 **6/6 PASS, exit 0**으로 저장했다.

| 최종 source 실행 | 관측값 |
|---|---|
| 실제 source 결속 | 56개 PASS |
| 정확한 reduced ODE 항등식 | 10개 PASS; moving-normal pressure 누락 대조는 거부 |
| 정확한 rational 부등식 | 12개 PASS |
| 원본 graph | 232,122 nodes, 9,247,471 canonical bytes |
| Graph SHA256 | `f8386ffcb68a398b48ba0920df5baf01f632908715cd51ef29b0e6454a622dd1` |
| 실행 시간 / peak RSS | 21,040.792444 ms / 1,269,276,672 bytes |
| Literal import closure | 52개 파일; 실행 전후 SHA 불변, 독립 검토 시에도 모두 일치 |
| Import closure SHA256 | `e13efc0cd07d8a94bf18ff2d4694651e94082b145a6f0996bbded23e63e26298` |
| Source JSON SHA256 | `01fe6e46397288916188f8812bae3924c678ce8641fa6e66c5662f3b1d9746f4` |
| Source TAP SHA256 | `5939b1d6e5ca9b8ca97e198d246f6a1d18771ad0b50792cd09c13d65ae1a5f69` |
| Kernel JSON SHA256 | `bdd8aeadab815a5a34b9b20456a086402b6fee23f86f022556fe07efbdead644` |
| Kernel TAP SHA256 | `59b2c1a668a948f6dca3cd49543516451a51d2b2c38c8b7250e12c94b1d54633` |

실행 PASS의 범위는 source 결속·exact rational identity·변경 방지다. 위 해석적 증명과 원문 정의역을 별도로 읽어야 한다. 후속 검증이나 화면 배포가 이 부호 결과를 원문 전체 정리의 반례 또는 whole G-POS 완료로 바꾸지 않는다.

