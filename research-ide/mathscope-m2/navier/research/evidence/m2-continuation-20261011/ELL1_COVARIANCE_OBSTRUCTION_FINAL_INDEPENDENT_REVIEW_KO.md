# ell=1 covariance 부호 장애의 최종 독립 검토

작성일: 2026-10-11. 검토자 역할: 실제 cutoff 수치 경계를 담당한 별도 agent. 이 검토에서는 제품 코드를 수정하거나 두 번째 actual-source worker를 실행하지 않았다. 원래 heat/target/frame 정의, 추가된 source 결속 코드 및 실행 기록을 읽고, 현재 파일 해시를 기록의 전체 import manifest와 대조했다.

## 결론

고정된 실제 source의 현재 **ell=1 표시식 확장**에서

\[
s=1,\quad \eta=0,\quad
X=X_be^{-1/4},\quad R=\sqrt{2X},\quad Z=0,\quad T=1
\]

을 slow point 및 미분 전에 고정한 representative로 선택하면

\[
H_{\theta,+}<0,\qquad H_{\theta,-}<0,\qquad T_{\theta}>0
\]

라는 서술형 해석 증명과 실제 source 결속에서 오류를 발견하지 못했다. 따라서 이 표시식의 이 점에서 \(Hy=T\)를 만족하는 \(y_+,y_-\ge0\)는 존재하지 않는다. 이는 양의 covariance weight를 구하는 경로에 실제 수학적 장애가 있음을 뜻한다.

이 결론은 source 본문과 정확 유리수 항등식을 검사한 **해석적 부호 증명**이다. \(H\)의 수치 적분, determinant 부호, 각 역행렬 weight의 개별 부호 또는 새 Lean kernel 증명이 아니다. 특히 \(\det H\ne0\)도 여기서 증명하지 않는다. 역행렬이 존재한다면 적어도 한 weight가 음수라는 조건부 결론만 추가로 따른다.

## 실제 실행과 독립적으로 확인한 결속

검토한 실행은 [actual source JSON](actual-covariance-ell-one-obstruction-source-attempt1.json)과 [TAP](actual-covariance-ell-one-obstruction-source-attempt1.tap)이다. 단일 원본 graph를 생성한 기록이며 동일 검증을 다시 실행하지 않았다.

| 항목 | 기록에서 확인한 값 |
|---|---|
| Source test groups | 12/12 PASS, 실패·취소·건너뜀 0; 실행 담당자가 process exit 0을 확인 |
| 원래 source 결속 검사 | 56개 모두 PASS |
| 움직이는 pulse ODE 유리식 항등식 | 10개 모두 PASS |
| 독립 유리수 상수 비교 | 12개 모두 PASS |
| Compiler graph | 232,122 nodes, 9,247,471 canonical bytes |
| Graph SHA256 | `f8386ffcb68a398b48ba0920df5baf01f632908715cd51ef29b0e6454a622dd1` |
| 실행 시작 HEAD | `8a0046c547af4cccdbecae81fe647d414dd75d3f` |
| Import closure | 52 files; 현재 52개 파일 SHA가 기록과 모두 일치 |
| Import closure SHA256 | `e13efc0cd07d8a94bf18ff2d4694651e94082b145a6f0996bbded23e63e26298` |
| Node / V8 | v24.19.0 / 13.6.233.17-node.51 |
| 기록의 elapsed | 21,040.792444 ms |
| 기록의 peak RSS | 1,269,276,672 bytes |
| JSON SHA256 | `01fe6e46397288916188f8812bae3924c678ce8641fa6e66c5662f3b1d9746f4` |
| TAP SHA256 | `5939b1d6e5ca9b8ca97e198d246f6a1d18771ad0b50792cd09c13d65ae1a5f69` |

실행은 단순한 문자열 출력 검사가 아니다. 다음 실제 경로와 거부 검사가 포함되어 통과했다.

- 고정 profile 및 original positive \(h\), 원래 12개 stage의 길이·경계·logA, A.13의 Qb/Qp/wait 적분 roots를 대조했다.
- 실제 full heat loss와 Euler gamma의 전체 improper integral, \(2(1-\eta^2)/X\) 인자, terminal cutoff 및 target의 viscous shear를 유지했다.
- 두 carrier의 원래 sign-preserving nonzero rounding, moving normal, pressure, Volterra matrix·initial value, \(P\), \(t\), 원래 \(H_\theta\) integrand를 대조했다.
- witness 대입 후 실제 completed F, leading F, target 및 두 H roots의 자유좌표가 모두 0임을 검사했다. Aphi에는 pulse time v만 남을 수 있으며, frozen carriers에는 자유좌표가 남지 않는다.
- moving-normal pressure term을 누락한 잘못된 ODE 항등식은 실패했다.
- 원래 Etail node 변경, 복사한 인증 객체, 결론 flag 승격, program node-list 교체 및 임의 metadata 추가를 모두 거부했다. 이후 독립적인 node append가 원래 compiler prefix나 두 certificate의 해시를 바꾸지 않음도 확인했다.

원래 `G.captureFunctionDefinitions()`가 outer와 pressure metadata 전체를 잠그므로, 추가 모듈이 사용한 stage 정의는 검사 없이 교체할 수 있는 외부 입력이 아니다. 추가 source 모듈은 계수·필드·좌표·상수 경계·완료 flag를 caller 입력으로 받지 않는다.

## 수학적 검토의 핵심

### 실제 heat와 terminal target

원래 heat 함수는

\[
H(\zeta)=\Gamma(1+h)^{-1}\int_0^\infty
e^{-v}v^h(1+\zeta v)^{-h}\,dv,\qquad \zeta=2/X>0.
\]

Gamma density의 평균은 \(1+h\)다. \((1+t)^{-h}\ge1-ht\) 및 실제 derivative integrand로

\[
1\ge H\ge1-h(1+h)\zeta>1/2,\qquad
0<-H'\le h(1+h)
\]

를 얻는다. 따라서 \(h<1/16\), \(\zeta\le1/16\)에서

\[
0<-\zeta H'/H<17h/128<h/4.
\]

terminal local coordinate는 \(y=11/4\), \(\delta=3-y=1/4\)이다. 원래 \(\sigma\)의 logistic exponent를 \(\delta/2=1/8\)에 대입하면 \(-3072/49<-62\), exponent derivative는 \(1024+1024/343<2^{11}\)이다. 따라서 \(0<\sigma'(1/8)<2^{-51}\)이고 \(0<f_o'/f_o<h2^{-59}\)이다. 실제 \(F\)의 두 인자를 미분하여

\[
\alpha=-1-XF_X/F=h+\zeta H'/H-f_o'/f_o\in(h/2,h)
\]

를 얻는다. \(h\), \(\zeta\), heat loss를 0으로 치환하지 않는다.

원래 A.54는 실제 terminal stress를 boundary \(Kf_r\)와 두 비음수 적분으로 표시한다. 원래 heat field는 \(K>0\), \(K_r<0\)이고 이 점에서 \(f_r>0\)이므로 boundary term은 엄밀히 양수다. 이 식을 사용하는 전제인 실제 moment-restoration과 heat compensation은 원래 full leading source에 유지되어 있다. \(s=1\)의 target chart factor도 1이다.

### Stage 상수와 원래 반경·진폭

[별도 scalar 증명](ELL1_TERMINAL_SCALAR_BOUNDS_KO.md)은 다음을 원래 A.13에서 도출한다.
이 절의 \(T_{\rm prof}=\exp(1048576)+10\)은 고정 profile 상수이며, witness의 slow time \(T=1\)과 다르다.

\[
0<Q_{\rm steep}<4,\quad
1<Q_b<7+32008T_{\rm prof},\quad
\rho_o<Q_p<1,\quad
0<\mathrm{wait}<16006T_{\rm prof}+34.
\]

특히 \(Q_p\)의 \(e^{(1-h)s}/(1-\rho_o)\) 인자를 유지했다. 실제 stage 길이 합과 큰 profile Q로 \(X_b<C^{11}\), \(R<C^6\)를 얻는다. 모든 preterminal endpoint logA 증가량은 음수이므로 \(E_{\rm tail}<P_*\)이며, 실제 \(0<H\le1\)을 사용해 \(0<F<1\)을 얻는다. 이전에 불확실했던 wait의 부호나 미평가 stage 상수를 가정으로 남기지 않았다.

### 움직이는 pulse의 부호 보존

\(b=p/R\), \(c=-B_s\), \(D_n=n_r^2+b^2+c^2\)라 쓰면, 원래 moving-normal pressure를 유지한 r/theta subsystem은

\[
M=\frac{2F}{D_n}
\begin{pmatrix}
-(1+2\alpha)n_rb & b^2+c^2\\
\alpha(n_r^2+c^2)-(1+\alpha)b^2 & -n_rb
\end{pmatrix}.
\]

세 번째 column은 0이라 이 두 성분이 닫힌다. \(t=BPw\)의 실제 식으로부터 \(B'\)와 reference scalar 항이 정확히 소거되고, 양의 scalar damping 및 \(P(0)\)를 분리한 진폭 \(a\)는 이 subsystem을 만족한다.

원래 carrier는 sign을 유지하며 \(|b|\ge1/(2R)\)다. 원래 \(R_{\rm env}=\exp(C^{25600000})\), \(u=2R_{\rm env}^{10}\), \(B_s\)를 유지한 상계는

\[
|n_r/b|<1/512<1/32,\qquad |c/b|<2^{-40}<1/128
\]

이다. 초기 \(a_r(0)=1\)이고 \(a_\theta(0)\)의 양수/음수 항의 절댓값 비율 제곱은

\[
\alpha(1+4/u^2)(1+(B_s/b)^2)
\le16385/131072<1.
\]

따라서 \(a_\theta(0)<0\), \(M_{21}<0\), \(\|M\|_\infty<4F\)이다. 실제 \(L_s=2^{-32+h}<2^{-31}\), \(F<1\)로

\[
|a_r(v)-1|<\frac1{2^{29}-1}<1/2.
\]

그 결과 \(a_r>1/2\)이고, theta 방정식의 적분인자 표현에는 음수인 초기값과 \(M_{21}a_r<0\)만 들어가므로 전체 pulse 구간에서 \(a_\theta<0\)이다. 원래 양의 scalar 인자를 복원해도 \(t_rt_\theta<0\)이다.

각 Htheta는 양의 Haar factor와 원래 \(\int\psi^2t_rt_\theta\)의 곱이다. \(\psi\)는 \([L_s/4,3L_s/4]\)에서 1이므로 두 Htheta의 엄밀한 음성이 따른다. 전체 H를 수치로 평가할 필요가 없는 부호 증명이다.

## 원문 Γ와 구분한 정확한 의미

실행된 source band certificate는 선택한 `ellMinimum/qStar` 영역에서 이 후보를 제외한다. 이것만으로 임의로 정해지지 않은 원문 \(\ell_0,q_{\rm big}\) 값을 판정하지 않는다.

원문 (6.8) 직전의 별도 조건은 \(q_{\rm big}\le2^{-\ell_0}\)이고 active 조건은 \(q<q_{\rm big}\)다. 이 witness는 \(q=Q s=1/2\)이므로 **모든 \(\ell_0\ge1\) 선택**에서 strict q 조건 때문에 원문 Γ 밖이다. 최종 machine decision은 이 조건부 결론과 선택한 인증 영역 비멤버십을 분리하고, 미지정 \(\ell_0,q_{\rm big}\) 값을 실제로 평가했다는 claim을 명시적으로 부정한다.

representative를 grid center에만 제한할 이유도 없다. 원래 (6.8)은 box와 active set의 교집합에서 고정점을 선택하게 한다. 후보점의 nearest box 기하와 representative 고정 방식은 표시식 확장에 맞지만, 그 기하만으로 원문 Γ membership을 부여하지 않는다.

이 때문에 결과를 원문 NS 정리의 반례나 whole G-POS 통과로 확대할 수 없다. 현재 ell=1 식을 그대로 두고 전체 양의 weight 경로가 완료됐다고 주장할 수 없다는 구체적 장애다. G-NUM 전체, 물리 residual과 전역 flat-error, 새로운 analytic Lean 증명 및 M3 시작 여부도 완료로 바뀌지 않는다.

## 검토 파일의 정확한 식별

| 파일 | SHA256 |
|---|---|
| [새 source 모듈](../../../actual-covariance-ell-one-obstruction.mjs) | `305fb60d757d6e4b1963bb6be73a73e25ab14c04c6a6a23aaa74b99ee48eb96f` |
| [실제 source test](../../../tests/actual-covariance-ell-one-obstruction-source.test.mjs) | `2d56e34ac6c7588a96c345530f129217d33ab59ebb13b26eda85db679296c1fd` |
| [Generic test](../../../tests/actual-covariance-ell-one-obstruction-kernel.test.mjs) | `c3af467e3726091f50c76112a0b1e74fd25748459a993d40bb2fe8136d7df8e5` |
| [독립 scalar 증명](ELL1_TERMINAL_SCALAR_BOUNDS_KO.md) | `86b4d060cd8bf86763a069232928b8ee77e349c8f8de259e2e9e4763e77412b4` |
| 검토한 원문 PDF | `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f` |

[이전 후보 검토](ELL1_COVARIANCE_OBSTRUCTION_INDEPENDENT_REVIEW_KO.md)는 source 결속 전의 이력으로 보존했다. 이 최종 기록은 실제 source receipt와 결속된 현재 판단을 설명하며 이전 파일을 덮어쓰지 않는다.
