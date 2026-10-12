# 실제 중심 slow 도함수 수치 포획의 독립 검토

검토일: 2026-10-11 UTC. 검토자: `positive_stress` 작업 에이전트.

## 1. 결론과 검토 범위

현재 고정된 세 구현의 원래 행렬 결속, 전체 시간 구간 오차, 가우스 적분 오차와 공분산 역행렬·양의 제곱근 오차 전파를 직접 대조했다. 아래에 명시한 실제 고정 중심점과 두 부호의 가중 방사 성분에 대해 수학적 또는 논리적 결함을 발견하지 못했다. 이 결론은 실제 원본 행렬을 보존하는 증명과 실행된 source attempt2의 범위를 함께 사용한다.

인증 대상은 각 부호에서 `R,Z,T,RR,RZ,RT,ZZ,ZT,TT`의 총 18개 값이다. 미분 전에 고정한 `Rstar`에 대해 `D_R=Rstar*partial_R`를 사용하므로 `RR`은 `Rstar^2*partial_RR`이며, 가변 계수 Euler 연산자를 두 번 적용한 값과 혼동하지 않는다. 1차 값은 정확한 양의 인자 `A0*sqrt(g*Ls)`, 2차 값은 `A0*g*Ls`를 남긴 계수 구간이다. 비교식이 0인 행도 양의 오차 반지름을 유지한다.

다른 두 가중 성분, fast 미분, 모든 label, 전체 curl의 수치 포획, 토러스 역상으로 지정한 물리점, 전체 G-NUM, M2/M3 완료는 이 결과에 포함되지 않는다. 구현과 실행 영수증은 이 항목들을 `false`로 유지한다. 검토자가 새로운 heavy source나 worker/browser 실행을 수행하지는 않았다.

## 2. 고정된 검토 대상과 실행 증거

구현 경로는 `research-ide/mathscope-m2/navier/`를 기준으로 한다.

| 파일 | SHA-256 |
| --- | --- |
| `actual-centered-slow-jet-enclosure.mjs` | `5624f5b284639baed56c8d97b3335e2f357bbee49b0b00896b9f53b723d93c8e` |
| `actual-centered-slow-jet-enclosure-kernel.mjs` | `5380b3b9857cb3df1e185675647337f9da12308ebaff260c57c3076d577449ab` |
| `actual-centered-slow-jet-source-bounds.mjs` | `b459a15cf3efdc21588f77f25573a7fabf5f05a8bc03b02865e0503f7265011b` |
| `research/ACTUAL_CENTERED_SLOW_JET_ENCLOSURE_KO.md` | `91388a6f8ee80f8338f2bc28caa9ce98b4acdd31eb876aff1e912fa321b7d672` |

실제 source 검사, 커널 검사, 이전 centered pulse 수치 포획, 원래 moving frame·전체 heat/outer target의 관련 정의도 읽었다. source attempt2의 68개 literal import를 현재 파일과 각각 해시 대조했으며 변경된 의존성은 없었다. 이 검토는 단순히 테스트 개수를 다시 인용하는 대신 3–7절의 수학적 재도출을 추가한다.

| 관측 자료 | 결과 및 SHA-256 |
| --- | --- |
| `actual-centered-slow-jet-source-attempt2.json` | source 12/12, 내부 11/11, `EXECUTED_VERIFIED_SCOPED`; `6af25b8966fd14ed0c064de8f5e92dfd18d2755b6ffc26927bb6897d168cffa7` |
| `actual-centered-slow-jet-source-attempt2-process.json` | 실제 외부 종료 코드 0, timeout 없음, 82.38888115699956초; `add61ea97950e544f11f89374df2e3783530105cf128d14a058b1d95b3393b54` |
| `actual-centered-slow-jet-source-attempt2.log` | 실제 source 실행 로그; `f48828f5ab62130aab774948aee5f54ce1d0439043b7308a1a470f1a2a3f3ef4` |
| `centered-slow-jet-light-validation.json` | 경량 커널 11/11, 실제 종료 코드 0; `aba8f87010236a604204e9c1d1aaf88db4d4dd7512a53f48b16cf8c71ae501e2` |

source 본체의 경과 시간은 81.980566994초, 기록된 최대 RSS는 2,992,844,800바이트이다. 실제 최종 그래프는 439,629노드·18,565,716 canonical 바이트이며 SHA-256은 `c4d8b3daca26c061ae227a6744654d41c67b6ffa98a8d7c62dfd518f52e04a00`이다. 68개 import closure의 해시는 `0b0c3c0048b0f6c25104fc82dc352c336635b61be2f6c25db167417a62df9b4f`이다.

attempt1은 원래 leading slow scale의 표현 결속에서 실제 종료 코드 1로 실패했다. 해당 실패 JSON·로그·별도 source snapshot은 보존되어 있다. attempt2만 위의 성공 근거로 사용한다.

## 3. 실제 미분 대상과 양의 중심 인자의 결속

`bindFullFrame`은 원래 `M`, 위상 미분, `nprime` 압력 항과 `Bprime` 이동 기저 항을 재생성하여 대조한다. `defineCenteredFullSecondVariation`은 이 같은 2성분 원본에 대해 모든 1차·반복/혼합 2차 도함수를 직접 생성한 20성분 계를 구성한다. 단위 초기값과 고정된 `Ls`의 도함수는 실제로 0인지 검사한다. 각 계의 40개 행렬 성분에 대한 FTC 상계는 원래 body의 적분이다. 숫자로 추측한 행렬 norm이나 호출자 제공 도함수 행렬을 인증하지 않는다.

원래 H의 40개 적분 도함수, H 역행렬의 20개 항등식, 양의 제곱근의 18개 항등식은 원래 AD 식으로 materialize하여 비교한다. 반복 미분 계수 2와 혼합 미분의 두 순서 곱을 모두 유지한다.

중심 진폭은 `a_i(R,Z,T)=w_plus_i(Ls/2;R,Z,T)`라는 **함수**다. 실제로 이를 미분한 뒤 다음 정확한 정규화를 사용한다.

\[
\bar H_{ji}=\frac{H_{ji}}{D_j m a_i^2},\qquad
\bar y_i=\frac{y_i m a_i^2}{\tau},\qquad
\bar T_j=\frac{T_j}{D_j\tau},\qquad
D=(A_c,u),\quad m=\frac{r_0^2}{\sqrt{gL}}.
\]

각 항의 곱 항등식으로 `Hbar*Ybar=Tbar`를 확인하고, 실제 고정점 값이 앞선 private centered 수치 포획의 H·y·a와 일치하는지 확인한다. `a_i>0`, `y_i>0`, `m>0`, `tau>0`인 원래 영역에서

\[
\frac{W_i}{A_0}=\sqrt{\bar y_i}\,(1+r_i(v_0)),
\qquad A_0=\sqrt{\tau/m},\quad r=w_-/w_+,
\]

가 성립한다. 여기서 미분 방향의 첨자와 부호 label을 구별해야 한다. 코드의 `centers`, `centerJets`, `ratioJets`는 중심을 상수로 간주하여 큰 slow 항을 삭제하지 않는다. 반대로 최종 양의 단위 인자 `A0,g,L,Rstar`는 정해진 대표점의 고정 스케일이다.

## 4. 원래 heat, slow slope와 유한 source 상계

실제 terminal 열린 영역에서 완성된 U/M의 모멘트 항등식으로 축방향 배경이 사라지는 것을 사용한다. 원래 열 인자는 전체 양의 Gamma 적분으로 유지되며, source의 `s^(-A-1/2)` 스케일을 포함한 뒤에만 정확한 양의 거듭제곱 항등식으로 정리한다. 그 결과는

\[
F=B_*(R^2/2)^{-1-h}
f_o\!\left(\log\frac{R^2}{2sX_{\rm tail}}\right)
H(4T/R^2),\qquad s-Z^2s^{2h}=T
\]

이다. `H=1-hzD0`, `H'=-hD1`, `H''=h(1+h)D2`에서 어느 improper tail도 제거하지 않는다. `h,z,u^-2` 구간의 0 끝점은 아래 경계이며 실제 양의 원본 값을 0으로 대체하지 않는다.

`alpha=-RF_R/(2F)-1=h*Atilde`, `xi=alpha_T/alpha`, `kappa_u=(1+u^-2)/3`를 사용하여 완전한 비교 행렬의 `d-dref`까지 미분하면

\[
\mu_T=(\kappa_u-\tfrac12)(\alpha-h)
+\left(\tfrac{\kappa_u}{2}-\frac{\alpha}{2(1+\alpha)}\right)\xi,
\qquad
\mu_R=\tfrac32-2\kappa_u+(1-2\kappa_u)h-2\mu_T
\]

를 얻는다. 이 식을 직접 재도출했다. damping 도함수를 빠뜨린 비교식은 코드의 음성 대조에서 거부된다. `mu_Z=0`은 비교값이며 실제 epsilon·frame 미분은 오차로 남는다. 원래 1/8 step과 heat 구간으로 `|mu_i|<2`도 얻는다. 예를 들어 `sigma(1/8)<2^-62`, `|sigma'|<2^-51`, `|sigma''|<2^-39`의 느슨한 상계만 사용해도 `|xi|<2^-46`이고 필요한 여유가 충분하다.

유한 5차 field 상계는 모든 절댓값 다변수 Taylor 계수를 한 양의 변수로 모은 재귀다. implicit chart, logistic step, 전체 Gamma 도함수, 반지름의 일반 이항계수를 각각 상계하고 합성한다. 일반 도함수의 factorial을 되돌린 최대값도 `2^512`보다 작다. 원래 amplitude의 `Bstar<Renv^72`를 결합하면 `Renv^73`의 각 실제 field jet 상계가 나온다.

전체 moving frame의 `tau=v/L` 정규화는 양의 고정 `Bs`만 상쇄한다. 실제 점에서 `n_hat_z=-1`이므로 실제 계수와 비교 계수를 잇는 보조 선분 전체의 normal/tangent 제곱 분모는 1 이상이다. 따라서 원래 pressure·basis·damping과 그 두 slow 미분, 한 slow 미분의 시간 미분, 필요한 보조 미분에 사용하는 유한 거듭제곱 장부는 특이 분모를 지나지 않는다. 그 최대 3313보다 큰 3840 reserve는 `Renv^3840<B` 안에 있다.

완전한 target 상계는 원래 outer theta, axial, 중첩 pressure/backward kernel과 heat를 포함한다. `delta/sqrt(1+delta^2*t)`의 두 도함수와 `(1+delta^2*t)^(-k)`의 두 도함수를 `exp(-4t)`의 정확한 0·1·2차 모멘트로 적분하는 상계를 확인했다. 최종 정규화에 실제 `tau>Renv^-60`, `Ac>Renv^-6`을 사용한 최대 248은 reserve 512보다 작다.

## 5. 전체 시간 구간의 Riccati 오차를 다시 계산한 결과

이 부분은 가우스 중심 창 안의 추정만으로 꼬리까지 결론을 확장하는 오류가 없는지 중점적으로 확인했다. 실제 원본의

\[
r'=M_{21}+(M_{22}-M_{11})r-M_{12}r^2
\]

를 미분한다. 원래 초기 미분은 0이고 선형 계수는 `<=-1/B`다. 모든 추정은 **전체 `0<=v<=L`**에서 성립한다.

| 도출 항 | 직접 상계와 구현의 여유 |
| --- | --- |
| 1차 Riccati forcing | `4B<B^2`, 적분 비용 `B`로 `B^3<B^6` |
| 2차 forcing | 직접 항 `B^2`, 두 1차 곱 `B^8`, `2*M12*r_i*r_j<1`; 합 `B^9`, 해 `B^10<B^14` |
| `r_v` | `B^262/S` |
| `r_iv` | `B^8` |
| `q_i'-M11_i`, `q=log(w_plus)` | `M12_i*r+M12*r_i`, 상계 `B^264/S` |
| `q_i''`의 시간 2차 미분 | 다섯 원래 항을 합쳐 `B^268/S` |
| `q_ij'` | `M11_ij+M12_ij*r+M12_i*r_j+M12_j*r_i+M12*r_ij`, 상계 `B^20` |

`v0=L/2`, `x=(v-v0)*sqrt(g/L)`, `J=sqrt(gL)`라 두면 전체 구간의 Taylor 정리·적분으로

\[
\frac{q_i(v)-q_i(v_0)}{J}=\mu_i x+e_i,
\quad |e_i|\le\delta(|x|+x^2),\qquad
\frac{|q_{ij}(v)-q_{ij}(v_0)|}{J^2}\le\delta|x|,
\quad \delta=\frac{B^{300}}{\sqrt S}
\]

를 얻는다. `B>=2^128`, `S>=B^1024`에서 `delta<=2^-27136<2^-8192`. 그러므로 중심 밖에서 `delta*x^2` 자체가 작다고 가정할 필요 없이 `delta<=1`과 `|mu_i|<2`만으로 4차 이하 다항식의 **B와 무관한** 계수를 얻는다. 이 사실이 전체 Gaussian tail 상계를 정당화한다.

## 6. Gaussian 적분 상계와 원래 frame의 크기

원래 centered pulse의 whole-band 추정 `P^2<=exp(-x^2/3)`과 `w_plus/a`의 log 기울기를 결합하여 `|x|>=64`에서 실제 중심 density를 `exp(-x^2/6)`으로 제어한다. 원래 시간 cutoff는 0과 1 사이이며 중심 창에서는 정확히 1이다. 원래 transverse mass와 Haar 인자는 그대로 남는다.

상수 `2^20`의 꼬리 계수에는 원래 frame의 0차 크기도 필요하다. 이는 단순히 미분 상계 `B^32`를 적용해서 얻는 것이 아니라 실제 midpoint geometry로 얻는다. 전체 `tau` 구간에서

\[
\frac{|c|}{A_c}=\frac{\sqrt{1+u^2(1/2+\tau)^2}}{\sqrt{1+u^2}}
\le\frac32,
\qquad |s|/u\le\frac32.
\]

여기에 원래 `Ka,K,Na,N,sa,s`의 차이 `<=B^256/S`, `|r|<=B^260/S`, `Ac,u>B^-1`을 넣으면 정규화된 covariance frame의 0차 곱은 절대 상수로 제한된다. 첫째·둘째 slow frame jet을 `J,J^2`로 나눈 항도 각각 `B^32/J`, `B^32/J^2<delta`다. 따라서 실제 frame의 모든 미분 곱을 포함해 구현의 `2^20*(1+|x|^4)` 여유가 충분하다.

중심 창 `|x|<=64`의 Gaussian profile 오차와 위 `delta` 오차를 코드의 정확한 유리수 다항식으로 적분한다. 양쪽 꼬리에는

\[
I_0=3/M,\quad I_1=3,\quad
I_n=3M^{n-1}+3(n-1)I_{n-2},\qquad M=64
\]

와 `exp(-M^2/6)<2^-682`를 사용한다. 0차부터 4차까지의 모든 항, 두 꼬리, 기준 Gaussian의 꼬리를 포함한 총량이 `2^-620`보다 작다. 홀수 Gaussian 모멘트는 0, 완전한 둘째 모멘트는 `sqrt(pi)/2`이므로

\[
\bar H_i/J=0+E_i,\qquad
\bar H_{ij}/J^2=2\mu_i\mu_j\bar H+E_{ij},\qquad
|(E_i)_{ab}|,|(E_{ij})_{ab}|\le2^{-620}
\]

라는 실제 행렬 구간을 얻는다. 유한 시간 구간의 비대칭이나 원래 frame를 정확한 대칭 Gaussian으로 대체하지 않고 그 차이를 양의 반지름에 넣는다.

## 7. 실제 H의 conditioning과 마지막 오차 전파

`numericalConditioning`은 앞선 private source의 directed H 구간으로 determinant와 adjugate를 계산한다. determinant가 음수로 분리되고 실제 `||Hbar^-1||_infinity<=1`, 각 `Ybar`가 `[1/8,1/2]`, 각 양의 제곱근이 `>=1/4`인지 BigInt 구간으로 검사한다. 두 부호의 실제 열이 같다는 가정은 없다.

`e=2^-620`라 두고 원래 `Hbar*ybar=Tbar`를 미분하면 원소별 `H_i/J` 오차가 e이므로 행합 norm은 2e다. `|y|_infinity<=1/2`와 target 미분 상계를 사용하여 `|y_i/J|<=2e`를 얻는다. 둘째 미분에서 **두 항** `H_i*y_j`, `H_j*y_i`를 유지하면

\[
 y_{ij}/J^2=-2\mu_i\mu_j y+E,
 \qquad |E|_\infty\le2e+8e^2<3e.
\]

양의 제곱근의 정확한 두 번 미분과 `sqrt(y)>=1/4`에서 1차 오차는 4e 이하, 2차 오차는 7e보다 작은 여유로 제한된다. 마지막 실제 인자 `1+r(v0)`와 그 1·2차 미분은 whole-v Riccati 상계로 제어된다. 따라서 구현이 할당한 `2^12*e=2^-608<2^-600`의 reserve는 충분하다. 1차 비교값 0과 2차 비교값 `-mu_i*mu_j*(W/A0)` 양쪽에서 실제 양의 오차를 보존한다.

최종 각 행은 요청된 정확한 폭과 다시 비교하고, `RR,TT<0`, `RT>0`의 분리를 직접 검사한다. 비교값이 0인 나머지 행을 실제 도함수 0으로 단정하지 않는다. private seal은 원래 source, 함수·Volterra 정의, roots·metadata와 prefix를 재검사하고 단순 복사 보고서나 변조를 거부한다. 향후 별도 graph append는 인증된 고정 prefix에서 제외되므로 기존 인증서를 변경하지 않는다.

## 8. 후속 작업에 사용할 수 있는 범위

이 패킷은 실제 고정 source의 가중 방사 성분에 대한 18개 directed slow 계수와 완전한 원래 미분 body를 제공한다. 미계산 geometry/target 스케일을 exact 양의 인자로 유지하는 것이 이 패킷의 명시적 출력 형식이다. 다음 G-NUM 연결에서는 나머지 가중 성분·fast derivatives·물리 curl 변환·점 지정과 필요한 수치 스케일을 별도로 결속해야 한다. 현재 통합 common physical source 실행이나 그 최종 M2 판정을 이 문서에서 선취하지 않는다.
