# Source 5: 공통 물리 구성의 최종 교차 전제 검토

검토자: `ns_proof_audit`. 검토일: 2026-10-11 UTC.

## 1. 판정과 독립성

**최종 source 5의 실제 실행과 현재 수학 본문을 함께 읽은 결과, 선언된 원래 영역에서 G-POS, G-CURL, G-N4, G-N5를 닫는 데 필요한 연결에 새로운 수학적 결함을 발견하지 못했다.** 이 판단은 아래 source 항등식, 동일한 재귀 선택 수열, 정량 하한, 모든 고정 차수의 귀납, 실제 물리식과 평균의 구분을 확인한 결과이다. `8/8`이라는 소프트웨어 검사 개수 자체를 해석학적 정리로 사용하지 않는다.

G-NUM의 실제 도함수 구간, 남은 양의 수치 인자 및 새 물리점으로의 수치 전달은 별도 작업이다. 이 문서는 전체 M2 완료나 M3 시작을 발급하지 않는다. 기존 Lean 증명에 추가 해석학 정리를 kernel 검사했다고 주장하지 않는다.

작성자는 공통 family/band, target weighted norm, 앞선 안쪽·바깥쪽 양성 연장의 작성자이다. 따라서 그 부분은 **자기 코드의 후속 소비 전제와 실행 동일성 확인**이며, 독립 검토로 다시 세지 않는다. 해당 수학의 독립 검토는 root가 작성한 [공통 family 검토](../../INDEPENDENT_COMMON_ADMISSIBLE_FAMILY_REVIEW_KO.md), 앞선 annulus/inner/outer 패킷에 있다. 반면 root의 full physical curl/global wave/global covariance와 positive_stress의 finite residual/flatness/실제 E_B 본문은 다른 작성자의 코드를 읽은 독립 검토이다. 작성자는 앞서 E_B의 원래 derivative와 optimized derivative를 대조하는 방법을 제안했으므로, 그 표현 비교 helper에 대한 자신의 기여도 숨기지 않는다. 여기서는 실제 잔차식, 공통 선택 조건, 모든 미분 차수의 비교 정리와 최종 source의 연결을 별도로 대조했다.

검토 과정에서 큰 source 실행을 다시 돌리거나 수학 JS, 원래 graph, 실행 기록, gate를 수정하지 않았다. `SOURCE5_CROSS_PREMISES_NS_AUDIT.json`은 이번 읽기 시점의 바이트 비교만 기록한다.

## 2. 실제 실행과 바이트 동일성

최종 실행은 2026-10-11 12:14:22.275968 UTC에 시작하여 12:36:46.714929 UTC에 끝났다. 관측 결과는 **exit 0, 8/8 PASS, `complete:true`, timeout=false, interrupted=false**이다. 경과 시간은 1,344.4085952669993초, 기록된 peak RSS는 4,893,794,304 bytes이다. 실행 시점의 저장 HEAD는 `6a3e71a884e6faebe808fd67fd0274304a7f45e4`이며 이후 저장으로 바꾸지 않는다.

| 실제 기록 | SHA-256 |
|---|---|
| `actual-common-physical-package-source-attempt5.json` | `44137485e789ef29c6f5ee51dfdcc294102bda3d51f15d442601c859876d04eb` |
| `actual-common-physical-package-source-attempt5-process.json` | `7616a3134599d15fc6e0e98bc761f129199ce62c83eafc145058b86848c80b0e` |
| `actual-common-physical-package-source-attempt5.log` | `d1bf4d311612a8e3b47a1972abdda9f0dfd64a45f87cdcc3c2bf1490f9438696` |

Process가 기록한 **120개 literal import의 현재 바이트 SHA를 직접 재계산하여 120/120 일치**를 확인했다. 기록된 실행 전후 동일성도 유지된다. Source의 eight constructors는 각각 한 번 실행됐고, 사후 validator가 다른 source를 만들어 대신 검사하지 않았다.

| 패키지 | 노드 수 | graph SHA-256 | 내부 결속 |
|---|---:|---|---:|
| 공통 family | 622,781 | `bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219` | 9 |
| 자체 band | 627,497 | `5912d073e58d1f587395d4478b5ad704f63530f8bd5219cca54da1d95c39f3ff` | 16 |
| 전체 physical curl | 719,974 | `304668ef4223e7080e075eb0212c5c88a880a19e0fa53e1722bdfb1c8d7982f5` | 11 |
| target N0/N1 | 627,405 | `ac6f39969928e481c32690336686e360e3f23efa51ce39332b73f53e5deecdd6` | 9 |
| global wave bound | 628,525 | `a93fd64bd45a8e6ed375ed87b921a6cd2297c81cd2ec443ecffab97a2198bff4` | 12 |
| global covariance | 720,453 | `3a1e62a6ef126d588bcb8c486094fcc25d22a6ec0888379da9b8ccf279d74e41` | 11 |
| background flatness | 884,353 | `1301fe662653d92f24acf8df74567f51dc3efa0a0142d059da854fa41160ebce` | 8 |
| 실제 E_B | 728,257 | `9f904c3c4b842c53d667f8677779100eed7864b50d76942d30851370f375398c` | 6 |

실행한 유한 데이터는 positive prefix 2, background slow order 3, target weighted order 1, global wave order 0, flat order 4이다. 일반 정리는 각 고정 차수에 필요한 동일 source constructor와 재귀를 다시 적용하는 진술이다. 무한히 많은 literal graph를 이번 실행에서 만들었다고 주장하지 않는다.

## 3. G-POS 및 G-CURL: 동일한 원본 family에서의 전역 구성

### 같은 영역과 같은 선택 수열

Family의 `b_n`은 모든 `m<=n`에 대한 실제 velocity/potential, pressure/stress, normalized pressure와 weighted stress 상수를 포함한다. 조건은 각 항마다

\[
B_{n,m}b_n^{-nh}\le 2^{-n}
\]

이다. 새 선행값을 사용하는 재귀 maximum으로 `b_2>=16 b_1`을 유지하고, 이후 두 배 성장을 유지한다. 서로 다른 선택 수열을 점별 maximum으로 합친 뒤 선행값 관계를 잃는 방식이 아니다. 원래 `h>0`를 계속 사용한다.

최종 전체 합의 영역은 family의 충분조건 영역보다 더 작은

\[
0<q<q_{\rm global}=2^{-(\ell_0+4)}
\]

이다. 원래 band cutoff가 활성일 때 `|ell+log2(q)|<3/4`이므로 `ell>ell0+13/4`이다. 따라서 **모든 활성 band**가 같은 family의 양성 전제를 만족한다. 한 선택 band의 성공을 다른 band로 복사한 것이 아니다. 각 band와 frozen box label은 자기 원래 background, rounded carrier, 두 Volterra 계, H와 target를 구성한다. 임의로 작은 원문 `ell0/qbig`를 추정하지 않으며, 원문 허용 선택을 실제로 만족시키는 명시적 충분조건 영역을 택한다.

### 실제 H, y 및 경계의 제곱근

원래 normalized Haar, transverse mass, 실제 고정 대표점 및 full leading target를 함께 써서

\[
|\det H|\ge d_*/S,\qquad y_j\ge c_y\zeta>0
\]

를 얻는다. `ci*Ls=2*r0`에 따른 Haar/length 상쇄가 determinant의 `S^-1`에 필요하다. H의 부호와 양의 역가중치를 혼동하지 않는다. 경계에서 양의 하한을 주장하지 않으며, 열린 annulus에서만 H의 역과 양의 sqrt를 평가한다.

`Hy=Tbar`와 `sigma^2=y`를 실제 H/T의 완전한 Leibniz 재귀로 미분한다. H inverse의 각 고정 차수는 S의 유한 거듭제곱으로 제어된다. Target의 같은 source weighted norm은 `zeta`와 차수별 유한 boundary pole을 남기고, sqrt 재귀 뒤에도 `sqrt(zeta)`가 남는다. 안쪽 원래 `exp(-t1^2/y^2)`와 바깥쪽 원래 `exp(-4/delta^2)`가 모든 고정 pole을 흡수한다. 따라서 **가중된 구성식을 먼저 zero extension**하여 매끄럽게 잇는다. 경계의 singular inverse에 0을 대입하는 계산이 아니다.

Eta의 양 끝은 원래 물리 측 시간의 한쪽 heat jet이다. 원래 실수 heat 적분을 음의 시간까지 사용했다거나 이후 N7의 종단 force 정리를 이미 수행했다고 확대하지 않는다.

### 전체 curl과 물리 미분

각 sign의 원래 potential에는 slow partition, `sqrt(epsilon)`, `sqrt(y)`, fast χ/ψ, carrier, moving frame 및 pressure가 들어 있다. 원래 potential을 Cartesian 기저로 회전한 뒤 미분한다. `D_r=partial_R+a(R)partial_xi`, `D_z=epsilon partial_Z`, `D_t=-epsilon partial_T+partial_v`와 원통 기저를 반복해서 미분하므로 `Ctheta/R`, radial-fast 계수의 미분, phase 및 cutoff 항이 보존된다. 실제 각 sign의 40성분 third variation과 본문 partial의 결속은 공간 2차·시간 1차 NS 입력에 사용된다.

원래 81개 squared partition 후보와 palette 분리, 모든 integer label의 유한 겹침을 연결한다. 시간 내부의 합은 국소 유한하고, 경계에서는 아래 Gaussian 추정으로 모든 고정 미분을 연장한다. 같은 원래 potential에 `div curl=0`을 적용하므로 전체 field의 divergence가 0이다. Full curl과 primary wave의 차이는 실제 식으로 남는다. **전체 curl의 covariance가 primary covariance와 같다는 주장은 없다.**

## 4. G-N4: 실제 배경 NS와 동일 b_n의 전 차수 flatness

`actual-global-finite-residual.mjs`, `actual-background-residual-flatness.mjs` 및 `actual-common-band-background-residual.mjs`의 서로 다른 책임을 구분해 읽었다. Finite module은 전체 원래 leading heat/pressure/stream, positive conservative moments와 두 shear의 계수 소거를 제공한다. Flatness module은 같은 b_n의 실제 tuple과 그 유한 prefix를 비교한다. E_B adapter는 이미 만들어진 물리 background NS에 **원래 응력의 실제 divergence를 더해** E_B 자체를 구성한다.

작은 q에서 `q<1/(2b_J)`이면 `n<=J` cutoff는 plateau이고, 이후 꼬리에 실제 diagonal inequality를 적용한다. 고정 `r<=J`에 대해 tuple 차이는

\[
\|\mathcal T_B-\mathcal T^{[J]}\|_r
\le 2^{-J}q^{(J+1)h-(2A+r)}
\]

형태로 제어된다. 원래 radial stream의 χ′ commutator, 축 pressure, 원통 stress의 `1/R`, `2/R` 항을 버리지 않는다. 차이의 support가 축에서 떨어져 있다는 사실과 `M_X=U`의 원래 연속성/FTC authority를 적용하는 순서가 맞다.

고정 미분 차수 m와 원하는 P에서 사용하는 J는 유한하며, 보수적 선택은

\[
J=\max\left(m+2,\left\lceil
\frac{P+2+2(2A+m+2)+(m+1)}h
\right\rceil\right)
\]

이다. 여기서 `K=2A+m+2`, `H=m+1`, `tau=(J+1)h-K`라 두면 비교 여유가 `tau>P+2+K+H`이다. 코드의 실제 비교 상수와 floor/ceil 부등식에 이 여유를 확인했다. 실제 finite constructor가 `C_fin(J,m)`와 `C_u(J,m+2)`를 정의하며, 아직 생성하지 않은 큰 J의 root 값을 실행했다고 발급하지 않는다.

비선형 차이에는 두 방향 transport 교차항과 자기제곱을 모두 포함한다. 그 결과

\[
C_{\rm flat}=C_{\rm fin}
+D_m2^{-J}(C_u+2)
\]

형태의 실제 유한 상수가 q의 원하는 차수를 제어한다. 미분 손실은 `2A+1+m` 등 고정 m에 의존하며 J에 따라 악화되지 않는다. 그래서 모든 고정 m/P에 대해 하나의 원래 cutoff 합이 flat하다. 서로 다른 J마다 새로운 배경을 선택하는 정리가 아니다.

실제 E_B는 `R(u_B,p_B)+div(T_B)`이다. Original/copy graph의 미분 표현 차이는 family에서 먼저 캡처한 `M_eta,F_X,U_X`와 copied prefix 동일성으로 검사한다. 원래 body의 alpha/영 분기 항등식이 확인된 쌍에만 congruence를 적용한 뒤 flux를 미분한다. 불일치하는 opaque function을 동일 atom으로 취급하지 않는다. 최종 source의 실제 NS vector와 응력 divergence는 0으로 덮어쓰지 않았다.

이로써 선언하는 것은 배경 잔차 `R(u_B,p_B)=-div(T_B)+E_B`와 E_B의 모든 고정 차수 flatness이다. Wave를 합친 뒤의 uncorrected NS 잔차 전체가 0 또는 flat이라는 결론은 아니다.

## 5. G-N5: 안정한 변분, 모든 label의 시간 잔여항, 실제 N6 입력

### band와 무관한 안정 상수

원래 moving system은

\[
M=\operatorname{diag}(0,-2\lambda)+E_{\rm actual}-(d-d_{\rm ref})I
\]

형태이며, infinity logarithmic norm이 `3E/S` 이하이다. `Ls<=Lmax*S`이므로 propagator 상수 `W=exp(3E*Lmax)`는 band에 독립이다. 거친 `exp(||M||Ls)`를 사용해 exponential S 성장을 만들지 않는다. 모든 고정 slow/mixed variation에는 완전한 부분집합 Duhamel 재귀와 원래 초기값 `(1,0)`을 쓰고, P의 실제 slow 독립성을 별도로 결속한다.

Wave 미분 차수 m에서 필요한 실제 background는 **C_(m+3)**이고, target norm은 0..m+1이다. 소스에서 없는 고차 norm을 C2로 대신하지 않는다. 실제 `K`에는 background norm, W, determinant 하한의 역, weight 하한의 역제곱근, 원래 Haar-length, cutoff/chart FTC 및 모든 필요한 target N_j가 들어 있다. 이에 대한 정해진 유한 거듭제곱 장부가 inverse/sqrt, phase, chart 및 product 계수를 함께 제어한다.

### 원래 ψ′ 전체 force와 Gaussian 합

실제 temporal force는

\[
Q^{-A-1-h}\psi'\,\operatorname{curl}_*(A_{\rm base})
\]

이다. Primary t로 전체 curl을 대체하지 않으며 ψ로 나누지 않는다. 원래 P의 중심 Gaussian과 `supp(psi')`의 중심에서의 거리, `Ls>=2r0*S`를 함께 사용하여 `P<=exp(-a*S)`, `a=r0*Renv^-31/(32u)>0`를 얻는다. 물리 미분의 Q 손실, source 상수와 S 다항식, 각 ell의 실제 mesh 개수와 끝의 양의 infinite tail을 모두 포함한다.

현재 `flatConstant`의 **동시에 활성인 두 band** 계수 2를 확인했다. 무한 tail은 이미 모든 band를 합한 식이므로 그곳에 2를 다시 곱하지 않는다. 모든 label을 한 유한 witness의 값으로 치환하는 대신 원래 constructor의 uniform 전제를 사용한다. 이 Gaussian 논증은 모든 고정 미분과 원하는 q 차수에 대해 실제 temporal force를 flat하게 한다.

### Primary 평균, signed inverse 및 남긴 항

원래 7.30의 covariance에는 angular cosine-square의 `1/2`, normalized Haar 및 squared slow partition이 들어 있다. N6에 넘기는 C/B는 실제 Cartesian vector를 원통 기저로 투영하고 **theta 평균과 Y Haar 평균을 모두** 취한 연산이다. 점별 nonlinear NS product는 별도로 보존한다.

Signed local inverse는 원래 양의 primary `sqrt(y)` 주위에서 선형화한 `H^-1 Sigma/(2 sqrt(y))`와 원래 epsilon factor를 사용한다. Sigma의 부호는 제한하지 않지만, 필요한 `M_alpha` 소속을 임의 입력에 자동 승인하지 않는다. 허용 좌표는 R/Z/T와 고정 대표점 세 좌표이며 theta/xi/v/Yi/grid/unknown은 제외한다. 성공하는 callback마다 private physical source를 다시 인증하므로 이후의 변조로 거짓 inverse를 발급하지 않는다. 원래 `U in W_(1/2)` 전제도 임의 rho에서 추정하지 않고 남겨 두었다.

실제 full curl remainder, nonzero eikonal residual, wave self-advection, 두 방향 background/wave 항과 전체 physical NS는 N6 입력으로 남는다. `B(E,L Sigma)`, `B(U,R_curl Sigma)`, `C(V)`의 원래 class 지수를 기록하지만 actual N6 correction을 수행한 것으로 표시하지 않는다. N6→N7→N8 순서를 앞당기는 해석은 허용되지 않는다.

## 6. 실제로 확인한 실패/수정의 경계

Source 1/2의 dependency/substitution cache 상한, source 3의 timeout, source 4의 관측 정체와 안전한 interruption은 이전 기록대로 보존한다. 이번 성공을 과거 실패의 음성대조였다고 소급하지 않는다. `freeCoordinates`를 이용한 현재 단축은 부재한 free coordinate에만 적용하며, 실제 dependent substitution은 원래 bound-variable/Volterra/분기 규칙을 사용한다.

최종 source에는 private 객체 복제 거부, append 후 receipt hash 고정, 허용하지 않은 signed auxiliary 입력 거부, 성공 callback 직전 source 변조 거부가 들어 있다. 이전 검토에서 지적했던 두 band 계수, C/B 이중 평균, 성공 callback 재인증과 `U in W_(1/2)` 전제를 실제 operand/본문에서 확인했다.

결론의 범위는 동일한 공통 원본 family에서의 네 비수치 관문이다. 실제 numerical interval 또는 미래 N6/N7/N8 결과를 이 검토에 포함시키지 않는다.
