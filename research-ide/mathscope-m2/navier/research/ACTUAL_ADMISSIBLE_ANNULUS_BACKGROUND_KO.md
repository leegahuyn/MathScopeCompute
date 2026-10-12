# 실제 cutoff 확대와 환형 영역 전체의 한 dyadic band

이 모듈은 원래 계수와 원래 cutoff 함수를 유지하면서 **별도의 더 큰 cutoff 수열 \(b_n\)** 을 선택한다. 이 선택의 한 dyadic band 전체에서 실제 1차 보정항은 남고, 2차 이후 보정항과 cutoff 미분항은 정확히 0이다. 따라서 큰 정수 \(\ell\)까지 원래 계수를 임의로 잘라 내지 않고도, 확대된 환형 영역 전체의 실제 배경을 유한한 식으로 구성한다.

이번 인증은 이 배경 구성과 원래 C2 경계의 이전까지이다. 새 두 부호 pulse, 새 공분산 행렬 \(H\), 양의 가중치, 안쪽 flat 경계의 제곱근 연장, 모든 차수의 물리적 cutoff 조건은 이 문서의 완료 항목이 아니다. 미지의 원문 \(q_{\rm big},\ell_0\)와 현재 계산한 충분조건도 구분한다.

## 1. 원본과 새 선택의 관계

원본은 [Navier–Stokes 원문](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)의 §5.5 cutoff 선택과 §6–7의 dyadic/slow 구성이다. 확인한 PDF SHA256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다.

실제 연결은 다음 기존 모듈을 통해 이루어진다.

- `actual-residual-order-induction-background.mjs`: 실제 moment 보정 계수, 전 차수 normalized 귀납, 원래 finite n=1,2 블록을 포함하는 C2 경계.
- `actual-residual-order-induction-cutoffs.mjs`: 원래 canonical 수열 \(c_n\)과 각 실제 계수 경계로 정한 대각 조건.
- `actual-residual-order-induction-kernels.mjs`: 원래 time cutoff의 모든 유한 Euler 미분과 추가 stream cutoff 미분의 계수.
- `actual-background-physical-seminorms.mjs`: 실제 Cartesian/시간 미분과 weighted stress의 유한 FTC 상수.
- `actual-stress-direction-bounds.mjs`: leading source의 닫힌 환형 영역 방향 경계.

새 `actual-admissible-annulus-background.mjs`는 이러한 private 실제 source 객체만 받는다. 계수, 상수, cutoff scale, \(\ell\), 양성 플래그는 caller 입력이 아니다. 원래 \(c_n\), 기존 배경, 이전에 저장한 다른 강화 수열 \(a_n\) 또는 \(a_n^{(v)}\)는 바꾸지 않는다. \(b_n\)으로 정의한 배경의 값이 canonical 배경과 같다고 주장하지 않는다.

## 2. cutoff를 크게 해도 유지되는 실제 normalized 경계

여기서 쓰는 time cutoff는

\[
\chi(x)=1-\sigma_1(2x-1),\qquad
\sigma_1(t)=\frac{e^{-1/t}}{e^{-1/t}+e^{-1/(1-t)}}
\]

의 원래 smooth 연결이다. \(x\le1/2\)에서는 \(\chi=1\), \(x\ge1\)에서는 \(\chi=0\)이며 두 연결점의 모든 미분이 맞는다. 이 함수는 radial square seed \(e^{-1/t^2}\)로 바꾸지 않았다.

\(E_q=q\partial_q\), \(x=aq\), \(a>0\)가 미분에서 상수이면

\[
E_q^m[q^\nu\chi(aq)]
=q^\nu\sum_{j=0}^m {m\choose j}\nu^{m-j}E_x^j\chi(x).
\]

추가 stream 항 \(x\chi'(x)\)에는 오른쪽의 \(j\)를 \(j+1\)로 바꾼다. 따라서 해당 Euler 미분의 shape 상수에는 \(a\)가 들어 있지 않는다. **보통의 \(\partial_q^m\)가 scale에 독립이라는 명제는 사용하지 않는다.** 새 generic 검사에서는 원래 cutoff 본문을 유지한 채 직접 AD와 이 식을 비교하며, \(\nu\) 또는 추가 stream 미분을 빠뜨린 식을 거절한다.

실제 canonical 대각 선택이

\[
\log c_n\ge\frac{n\log2+\log B_{n,m}}{nh}
\]

를 보증한다고 하자. \(b_n\ge c_n\)일 때, cutoff가 영이 아닐 수 있는 \(0<q\le1/b_n\)에서는

\[
B_{n,m}q^{nh}\le B_{n,m}c_n^{-nh}\le2^{-n}.
\]

여기에 나머지 \(q^{nh}\)를 곱하면 원래 normalized tail 부등식이 그대로 유지된다. \(q\ge1/b_n\)에서는 cutoff와 모든 cutoff 미분이 0이므로 같은 결론이 성립한다. \(h>0\)는 원래 값 그대로이다.

실제 C2 finite 블록의 \(n=1,2\) 상수와 cutoff shape 상수는 변하지 않는다. \(0<q\le1\)에서 그 뒤의 tail은

\[
\sum_{n\ge3}2^{-n}q^{nh}
\le\tfrac14q^{3h}\le\tfrac14q^{2h}
\]

로 같은 C2 경계에 들어간다. 일반적인 고정 유한 미분 차수 \(m\)에서도 \(n<\max(3,m)\)의 실제 finite 블록을 유지하고, 그 이후에 같은 normalized 대각 논증을 적용한다. 또한 \(b_n\ge c_n\ge2^n\)이므로 모든 \(q>0\)에서 국소 유한성은 유지된다.

새 모듈은 기존 C2 root 표를 그대로 믿지 않고 `actualBackgroundChartBound`로 다시 계산하여 root들이 같음을 확인한다. 이 동치는 cutoff 크기를 바꾸기 전의 값과 바꾼 뒤의 함수값이 같다는 뜻이 아니라, 위 부등식으로 **같은 상수가 두 수열을 모두 제어한다**는 뜻이다.

## 3. 실제 \(b_1,b_2\)와 dyadic 정수의 선택

leading 방향 경계와 방금 이전한 C2 상수로 원래 source-only 충분조건 \(\ell_{\min}\), \(q_*=2^{-(\ell_{\min}+4)}\)를 계산한다. 이 계산은 대표점 의존 \(|c_0|\)의 양의 범위를 양끝을 보존하는 구간식으로 처리하며, 실제 source 상수 외의 자유 좌표를 남기지 않는다. 이 단계만으로 새 pulse의 행렬 경계가 증명되었다고 쓰지 않는다. 새 \(H\)의 원본 결속은 다음 모듈의 작업이다.

실제 physical prefix \(n=1,m\le1\) 및 \(n=2,m\le2\)에서 생성한 각 required-log를 \(P_1,P_2\)의 원소라고 쓰면

\[
\log b_1=\max\{\log c_1,\log2,
 (\ell_{\min}+10)\log2,P_1\},
\]

\[
\log b_2=\max\{\log c_2,\log(16b_1),P_2\}.
\]

\(P_2\)에는 실제 \(n=2\) weighted stress를 \(\zeta\)로 나눈 상수도 포함된다. 이 유한 두 prefix의 실행을 모든 \(n\)의 physical 대각 선택으로 확대하지 않는다. \(n\ge3\)에서는 \(b_n\ge\max(c_n,2b_{n-1})\)인 모든 continuation이 허용되며, 추후 필요한 실제 physical 조건으로 이 값들을 더 크게 해도 아래 band의 식은 변하지 않는다.

새 정수와 band를

\[
\ell_A=\left\lceil\frac{\log(4b_1)}{\log2}\right\rceil,
\qquad Q=2^{-\ell_A},\qquad q=Qs,\quad\tfrac12\le s\le2
\]

로 정의한다. \(\ell_A\)와 \(Q\)는 exact expression이며 거대한 정수를 binary64로 평가하지 않는다. ceiling 부등식에서

\[
\frac1{8b_1}\le Q\le\frac1{4b_1},\qquad
\frac1{16b_1}\le q\le\frac1{2b_1}
\]

를 얻는다. 따라서 \(b_1q\le1/2\)이므로 첫 항의 cutoff는 1이고 모든 cutoff 미분은 0이다. \(b_2\ge16b_1\)이므로 \(b_2q\ge1\), 따라서 둘째 항부터 모든 cutoff와 그 미분은 0이다. 연결점도 원래 smooth cutoff의 flat jet로 포함된다. 단순히 \(b_2\ge2b_1\)만으로는 이 결론이 나오지 않는다. generic 음성 대조는 비율 2, 8, 15를 실제로 거절한다.

또한

\[
\ell_A\ge\ell_{\min}+12,\qquad 2Q\le q_*/128.
\]

즉 전체 physical band가 source 충분조건보다 작다. 이 식은 원문 (6.8)의 미지 \(q_{\rm big},\ell_0\)를 평가한 것이 아니다.

## 4. 실제 전체 annulus의 배경 본문

실제 원래 계수를 \(F_n,U_n,M_n,v_n\)라 하고 \(w=q^{2h}\)라 하면 위 band 전체에서

\[
F_{\rm prof}=F_0+wF_1,\quad
G_{\rm prof}=U_0+wU_1,
\]

\[
b_{\rm prof}=\frac{Xv_0+wXv_1}{\sqrt{2X}},\qquad
M_{\rm prof}=M_0+wM_1.
\]

\(M_0\)에는 원래 완료된 `bootstrap.finalM` root를 쓴다. 실제 1차 계수는 근삿값이나 0으로 대체하지 않는다. 전체 positive-order series와 위 유한 식의 동치는 모든 후속 항의 cutoff가 정확히 0이라는 증명에 의한다. 계수의 생성 예산으로 자른 것이 아니다.

적용 영역은 \(X\in[X_a/2,2X_b]\), \(\eta\in[-1,1]\), \(s\in[1/2,2]\)의 원래 확대된 annulus다. 이전 terminal 공통-support 결과의 \(X>X_+\)로 제한하지 않는다. 다만 이 단계에서 새로운 공분산 양성을 이 영역으로 확대하는 것도 아니다.

## 5. slow 차트와 실제 정규화 인자

원래 차트

\[
s-Z^2s^{2h}-T=0,\quad
X=R^2/(2s),\quad\eta=Z/s^D,\quad q=Qs
\]

를 그대로 붙이고 \(\varepsilon=Q^h\)라 둔다. 미분 **전**의 실제 slow 함수는

\[
F=s^{-A-1/2}F_{\rm prof},\qquad
G=s^{-A}G_{\rm prof},\qquad
b=\varepsilon s^{-1/2}b_{\rm prof}.
\]

새 source 검사는 각 함수의 값과 전체 차수 2 이하 R/Z/T 미분 10개씩을 직접 생성한다. 특히 \(s^{-A-1/2}\)를 생략한 profile pullback을 실제 slow \(F\)로 부르지 않는다. leading frame용 \(F_0,G_0\)도 같은 slow 인자를 붙인다. 대표점과 frozen label은 다음 pulse 구성에서 별도로 결속해야 한다.

\(\eta=\pm1\)의 \(T=0\)에서는 원래 \(z\ge0\) heat의 한쪽 연속 jet를 사용한다. 음의 물리 시간으로 원래 heat 적분을 연장했다는 주장은 없다.

## 6. 실행과 실패 기록

최종 generic 실행은 8/8 PASS, 실제 source attempt2는 12/12 PASS이며 별도 process 관측에서 exit 0이다. 실제 source graph는 512,747 nodes, canonical 21,439,364 bytes이고 SHA256은 `c2e0e84547b245eb3687ecc8b78d94badfcf3efbddc191b5f7ef2de6f65867ed`이다. source runner의 51개 literal local import는 실행 전후 같았다. source 생성과 검사 전체 wall time은 약 30.66초, peak RSS는 2,470,400,000 bytes였다.

첫 실제 attempt는 수식 생성 뒤 `rawRows[0].actualCoefficient.localBodies`의 선택적 `undefined` 메타데이터를 strict canonical JSON으로 기록하려다 실패했다. certificate는 발급되지 않았고 exit 1이었다. 이 기록과 실행 당시 모듈의 정확한 byte snapshot을 보존했다. 수정은 실제 `F/U/M/average/Pi/v` 여섯 root만 명시적으로 추출하는 것이다. 계수, cutoff 식, 선택 부등식은 바꾸지 않았다. 추가 generic 회귀 검사는 선택적 undefined가 있는 원래 형태의 실패를 재현하고 여섯 root 추출이 strict JSON을 통과함을 검사한다. 이 처음의 실패를 설계한 음성 대조라고 다시 분류하지 않는다.

실제 source 검사는 private 원본 결속, 실제 physical 상수, dyadic/cutoff 부등식의 구조, 원래 1차 본문, slow 인자와 미분, 범위 거절, source 변조 거절을 검사한다. 발급한 program의 node prefix와 metadata는 고정하며 나중의 독립적인 graph append는 이미 발급한 hash를 바꾸지 않는다.

실행 파일은 `evidence/admissible-annulus-background-20261011/`에 있다. 이 검사는 원본 식과 주장에 대한 감사 가능한 증거이며, 그 자체를 분석학 정리 또는 Lean kernel proof로 승격하지 않는다.

## 7. 다음으로 필요한 실제 의무

다음 단계는 방금 구성한 \(b_n\) 배경을 사용하는 두 부호의 실제 moving-frame/pressure/Volterra 식을 다시 생성하고, 동일 source C2 경계가 그 식의 \(E,E_d,E_f,E_s\)를 제어함을 결속하는 것이다. 이어 실제 leading target, Gaussian 질량, 정규화된 두 열, determinant와 양의 inverse weight를 연결해야 한다. terminal의 이전 \(H\)를 새 전체-annulus \(H\)라고 부를 수 없다.

그 후 안쪽·바깥쪽 flat 경계의 제곱근과 모든 실제 label의 결합, 필요한 모든 차수의 physical cutoff 대각 조건, 원문 \(\Gamma\)의 최종 선택, 전역 residual/flat-error 및 새 analytic Lean 의무가 남는다. 이번 결과만으로 G-POS 전체, M2 전체, M3 진입을 PASS로 바꾸지 않는다.
