# 원래 중심점의 138개 수치 jet 독립 검토

검토자: `ns_proof_audit`. 검토일: 2026-10-11 UTC.

## 판정과 읽은 바이트

새 kernel, source adapter, 설명 문서와 최종 실제 source 기록을 읽었다. **원래 auxiliary 중심점에 한정한 138개 scaled numerical coefficient와 양의 잔여항의 논증에서 구체적인 수학적 오류를 발견하지 못했다.** 움직이는 두 mode, 원래 H/target와 inverse/sqrt의 slow 미분, 초기층, full moving frame을 그대로 사용하는지 독립적으로 대조했다. 이 검토자는 두 새 모듈의 작성자가 아니다. 큰 source 실행을 다시 돌리거나 source 코드 및 실행물을 수정하지 않았다.

| 읽은 파일 | SHA-256 |
|---|---|
| `actual-centered-fast-jet-enclosure-kernel.mjs` | `962f6d50ce6fe01c50ba780fe134e3033a09e35c88fea94c3a2afb6ad1652b70` |
| `actual-centered-pulse-full-jet-enclosure.mjs` | `3fb33dd41b8a423c309d31f7d4d87a180604498bf6b3c2e71e96d6c9a92052c3` |
| `ACTUAL_CENTERED_FULL_JET_ENCLOSURE_KO.md` | `9980184ec47b7d9706c6bc53b0bae87e72160fbce1fb80db33682eb5ec0fc803` |
| `actual-centered-full-jet-source-attempt1.json` | `a54a5de3bef8fb33cec605e603d2902b71af28ffd9b76e6d9807a26b105e99a7` |
| `actual-centered-full-jet-source-attempt1-process.json` | `c8232d8f8f5d8ee9ae6d18abeb9ea632d34ccdd106e9926472025c789aaec3ef` |
| `actual-centered-full-jet-source-attempt1.log` | `16d58b4db2e8478a9b5bff3a1a8d165258236026c4d8160b7931ee336872fe0f` |

실제 source의 **71개 literal import SHA를 현재 파일에서 모두 다시 계산하여 71/71 일치**를 확인했다. 실행 manifest SHA는 `86588f2853d01e4ac64ee92f83626e49a362d35cd54faecb6b52bcccbcab49d8`이다. 관측 process는 **exit 0, timeout=false, 한 source process**, 실제 source 검사는 **12/12 PASS**이다. 외부 경과 시간 162.95230501100013초, 내부 시간 162.580555582초, peak RSS 3,385,430,016 bytes를 구분한다. Graph는 1,364,792 nodes, SHA `0399c296557ea4d3b8727cb47dd55bd6ccb069494690392e3f65fd5f152bb6d4`이다.

검사 개수를 해석학적 증명으로 대신하지 않았다. 아래 source 전제와 정확한 식을 읽은 판정을 실행의 바이트 동일성에 연결했다.

## 1. 동일한 점, 고정한 정규화, 서로 다른 graph 권한

평가점은 원래 `X=Xrep=Xb*exp(-1/4)`, `eta=etaRep=0`, `s=srep=1`, `v=Ls/2`이다. 이 점을 실제 torus 역상으로 택한 새 물리점과 구별한다. R 방향은 반복 미분 전에 고정한 `Rstar*partial_R`이므로 RR에 `Rstar^2`가 붙고 Rstar의 미분이 생기지 않는다. Label, representative, carrier와 Ls를 고정한 원래 slow calculus를 사용한다.

`g,Ls,Ac,u,m,tau,A0`는 실제 양의 정규화 값이며, 미분을 마친 원래 root를 이 고정값으로 나눈다. 이러한 인자 자체의 모든 수치값을 이번 모듈이 평가한 것은 아니다. 반면 중심 진폭 a는 같은 private absolute-center predecessor의 수치 구간을 사용하므로 미평가 진폭으로 남지 않는다.

Slow와 absolute predecessor는 정확히 같은 private centered 객체에 결속된다. Private 20성분 alias가 있는 originating slow graph에 append하며, descriptor만 복사해 권한을 만들지 않는다. Absolute predecessor가 common prefix 이후 생성한 ID를 slow graph에 이식하지 않는다. 원래 H/y/a value의 동일성과 실제 derivative root의 대응도 별도로 검사한다.

## 2. 전체 시간 구간의 안정성 및 초기층

두 sign 모두 원래 pressure와 Bprime을 포함한 정규화 행렬을 먼저 결속한다. 비교식의 `inverseLength=epsilon=0`과 기준 beta는 실제 matrix의 값을 바꾸는 것이 아니다. 실제 양의 세 작은 인자에 mean-value bound를 적용하고 그 차이를 오차에 남긴다.

비교 항등식은 모든 `0<=v/Ls<=1`에서 `diag(0,-2lambda(v))`이다. 따라서 시간 1·2차 비교 error도 0이지만, 실제 error와 그 도함수는 `B^64/S` 이하의 **양의 경계**로 유지된다. 보조인자 세 개의 미분과 시간 2차를 생성하며, Bprime이 포함하는 추가 미분을 계산한 네 primitive derivative reserve 안에서 처리한다. 실제 matrix 미분의 모든 고차 완료라고 확대하지 않는다.

`r=wminus/wplus`, `q=log(wplus)`에 대해

\[
r_v=M_{21}+(M_{22}-M_{11})r-M_{12}r^2,
\qquad q_v=M_{11}+M_{12}r
\]

를 사용한다. 실제 `A_r<=-1/B`와 전체 구간 cone/slow-ratio bounds가 안정한 선형 변분을 제공한다. 특히 `r_v(0)=M21(0)`, `r_iv(0)=M21_i(0)`를 0으로 버리지 않았다. `L/(4B)>=S/(4B^2)>4log S`이므로 중심 부근의 초기층은 `0<exp(-L/(4B))<S^-4`이다. 원래 양의 초기항과 convolution을 합한 뒤 `r_v`, `r_iv`, `r_vv`, `q_vv`의 명시된 거듭제곱 경계가 따른다.

`S>=B^1024`, `B>=2^128`에서 `B^300/sqrt(S)`가 충분히 작다는 마지막 여유를 확인했다. 단순한 전체 구간 r의 크기만으로 fast derivative가 작다고 추정하는 논증이 아니다.

## 3. 세 amplitude 성분과 fast/slow 미분

원래 t의 radial 행은 `(1,1)`이다. Tangential/axial의 상계를 matrix norm에서 추정하지 않고, 원래 normalized frame의 별도 네 primitive derivative ledger로 구성한다. 양의 tangent denominator와 고정 `Ac>Renv^-6`, `u>1`, 필드 5차 경계를 사용한 최대 지수 1132는 `B>=Renv^4096`보다 작다. Slow 10개와 v/vv, 세 slow-v, 보조인자/시간 미분이 같은 실제 body에 남는다.

정확한 비교 중심은 `Btheta/Ac=(1,-1)`, `Bz/u=(sign,sign)`이다. Sign이 음수일 때 먼저 양의 sqrt의 radicand 동일성을 증명한다. Actual frame의 유한 오차를 0으로 놓지 않으며, 두 mode와 그 slow/fast 미분도 유지한다.

원래 P에서 `P=1`, `Pv=0`, `Pvv=-g/Ls`의 중심식이 나온다. 새 Gaussian을 대신 미분한 결과가 아니다. 실제 `Pv`, `Pvv`, envelope ODE 및 같은 양의 reference root를 함께 결속한다. Product의 반복미분 계수 2와 네 slow-v 교차항을 exact common-denominator algebra로 확인하고, 같은 몸체의 원래 AD로 다시 materialize한다.

이로써 각 실제 normalized 성분에 대한 v 비교 0, vv 비교 `-Wj/(Dj*A0)`, iv 비교 `mu_i*Wj/(Dj*A0)`가 양의 error와 함께 성립한다. 추가 theta/z slow 1·2차에는 원래 radial의 `sqrt(Ybar)` 미분을 먼저 추출하고 실제 component factor의 Leibniz 항을 전부 더한다. `2^-560`의 추가 반경은 새 moving-basis 항을 포함한다. 동일한 interval이 여러 component 값을 포함한다는 이유로 그 실제 값들을 동일시하지 않는다. Negative sign의 axial 값은 interval의 방향을 뒤집으며 양의 u scale은 유지한다.

## 4. 순간 slope와 다른 실제 log-center slope

실제 `D_i log a`는 원래 반 펄스 구간의 적분이다. `q_i(0)=0`, 양의 wplus 및 실제 ODE로부터

\[
D_i\log a=\int_0^{Ls/2}D_i(M_{11}+M_{12}r)\,dv
\]

가 나온다. 원래 derivative와 실제 integrand 둘 다 보존한다. Full comparison의 damping을 미분한 항을 포함하여 적분하면

\[
I_A=\frac{\log2}{3},\qquad
I_B=\frac{\log2}{3}-\frac7{72},\qquad
\nu_i=I_A\left(\frac{D_iF}{F}+\frac{D_i\alpha}{2\alpha}\right)
-I_B\frac{D_iF_R}{F_R}
\]

이다. 이 두 적분 계수를 독립적으로 재계산했다. `t in[1/2,1]`, `zeta=u^-2 in(0,1)`의 integrand를 zeta로 미분한 거친 경계 16,128은 충분하며, 적분 폭 1/2에 따라 `8/u^2`, `64/u^2`의 양의 오차를 준다. 원래 유한 u를 무한대로 바꾼 것이 아니다.

원래 T=1, Z=0의 fullheat/implicit chart에서 `alpha=h*Atilde`, `alpha_T=h*At`, `D_R alpha=-2alpha_T`, `F_T/F=alpha-h`이다. 이 식을 사용한 c/d의 R,T 식과 부호를 독립적으로 대조했다. 따라서 `nu_R` 비교값 `log2/3-7/24`와 `nu_T`의 원래 xi 의존성이 맞다. 원래 h가 너무 작아 outward interval의 하단에 0이 포함될 수 있지만, actual expression 및 positivity proof에서 h를 0으로 대체하지 않는다.

전체 time coupled-mode remainder와 actual finite-u 차이는 `2^-600` 안에 포함된다. `q_ij/(gLs)^2` 역시 `B^23/S`로 남으며 0이라고 하지 않는다. 이 nu를 기존 순간 mu 또는 새 실제 물리점의 nu와 혼동하지 않아야 한다.

## 5. a/H/y의 비중심화와 전체 표적

같은 원래 함수로 `K=H/a^2`, `Y=a^2 y`, `q=log a`를 두고 미분하면

\[
H_{ij}=a^2\{(4q_iq_j+2q_{ij})K+2q_iK_j+2q_jK_i+K_{ij}\},
\]

\[
y_{ij}=a^{-2}\{(4q_iq_j-2q_{ij})Y-2q_iY_j-2q_jY_i+Y_{ij}\}.
\]

두 식의 부호와 반복미분 계수, `a_ij=a(q_i q_j+q_ij)`를 확인했다. Y에는 실제 full target의 미분도 포함된다. Target를 고정한 다른 inverse의 도함수가 아니다. Centered H/y의 first·second bound와 원래 positive inverse conditioning, `a in[1/4,1/2]`를 사용한 `2^-580`의 추가 반경은 모든 남은 center 및 cross term을 포함한다.

공통 분모 대수의 역할과 body materialization의 역할이 구별된다. 전자는 이미 정의된 모든 body share 사이의 product identity를 검증한다. 후자는 실제 왼쪽 derivative가 원래 AD root인지 검증한다. 또한 normalized H/y의 10개 derivative를 원래 inverse matrix/weight jet과 **고정 양의 normalizer만으로** 대조한다. 임의 derivative oracle을 받아 source 인증으로 승격하지 않는다.

## 6. 최종 범위

실제 138행은 30 three-component fast, 36 theta/z slow, 18 a slow, 36 H-entry slow, 18 y slow이다. 선행 radial slow 18행과 별도 log-center root 6개를 새 개수에 중복하지 않는다. 각 coefficient의 free coordinates 제거, complete derivative body, interval width와 양의 remainder가 final source에서 확인됐다. Private copy/변조 거부와 append 후 compiler prefix 고정도 실제 검사에 들어 있다.

이 결과는 원래 auxiliary 중심의 scaled coefficient 구간이다. 남은 geometry/target 인자를 전부 numerical enclosure했다고 하지 않으며, 새 torus inverse의 물리점이나 full curl의 수치 도함수를 인증한 결과도 아니다. 새 점에서 같은 실제 원본 도함수와 근방 부등식을 다시 결속하는 후속 adapter가 필요하다. 기존 point의 mu/nu 숫자를 그 새점의 숫자로 곧바로 복사하는 해석은 이 검토에 포함하지 않는다. Whole G-NUM, M3, 새 Lean kernel proof는 이 packet으로 승인하지 않는다.
