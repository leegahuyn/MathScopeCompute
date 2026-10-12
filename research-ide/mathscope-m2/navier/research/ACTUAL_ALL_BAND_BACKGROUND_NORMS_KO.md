# 모든 band에서 공통으로 쓰는 실제 배경의 유한 차수 slow 상계

`actual-all-band-background-norms.mjs`는 원래 완료 배경의 임의의 고정 유한 차수 도함수에 대해 **band와 mesh 라벨에 의존하지 않는 양의 상수**를 만든다. 상수는 실제 원본 함수의 유한 FTC 적분과 이미 증명한 양의 계수 수열의 대각선 경계로 정의한다. 수치적으로 적분한 값은 아니다.

원래 (F_0)의 I2 보정, 전체 heat 꼬리와 (U_0)를 그대로 사용한다. active positive-order support에 제한된 leading 경계를 전체 구간으로 확대하지 않는다. 원래 (h>0) 역시 유지한다.

## 1. 실제 실행과 적용 범위

첫 실제 source 실행은 **7/7 검사, 11개 내부 결속, 실제 Node exit 0**으로 끝났다. 전체 process 시간은 20.621초, 최대 RSS는 2,399,522,816바이트다. 44개 literal import의 실행 전후 SHA가 같았다. 생성된 그래프는 455,842개 노드, 18,148,760바이트이며 SHA256은 `6c6e051b96e6c745b40c97bd9b4808baba96f959b7215f0e5c872c894a8f2b53`이다.

실행한 차수는 (m=2)다. (F_0,U_0)의 12개 실제 mixed profile jet에 2차원 FTC를 붙이고, 158개의 slow coefficient 상계를 만들었다. 각 비상수 coefficient에는 3차원 FTC의 모든 8개 face를 유지했다. 이 실행은 (C_0,C_1,C_2)와 필요한 (C_2)가 실제로 있는 Gaussian용 (B_0)를 발급했다. (C_{j+2})를 생성하지 않은 (B_j)는 발급하지 않는다.

별도의 커널 검사 5개는 원래 chart의 9개 inverse-Jacobian 식과 9개 commutator, 전체 mixed slow 2차까지의 독립 본문 AD, 실제 shared expression의 Euler 미분, multiplier 및 coefficient 미분 누락 거절, 명시적 작업 예산을 확인했다. 처음 만든 선택적 3차 다항식 전개 검사는 매우 큰 rational expansion 때문에 중단했다. 이는 source 실패나 반례가 아니며, 3차 generic 실행을 통과했다고 기록하지 않는다. 같은 recurrence의 수학적 유한 차수 귀납과 실제 실행한 차수는 구분한다.

실행 증거는 `evidence/all-band-background-norms-20261011/actual-all-band-background-norms-source-attempt1.{json,log}`와 별도 `-process.json`에 있다. source JSON SHA256은 `31a6b836a38e8f4482801478d29cc091a30129e7642d9b30b75460b2f3aedd42`다.

## 2. 전체 leading source의 실제 함수 결속

입력은 private `prepareActualCompletedBackgroundC2` 결과다. 그 안의 `prepared.records[0].global.F`가 참조하는 shared body는 정확히 `bootstrap.actualHeat.heat.finalF`이어야 한다. 이 식은 원래 natural core, 모든 outer stage, I1과 I2의 실제 연속 root, heat 보정 및 무한 heat 꼬리를 포함한다. (U_0)의 body는 정확히 `bootstrap.finalU`이어야 한다. 두 shared value를 materialize했을 때도 이 본문과 문자 그대로 같아야 한다.

영역은

\[
\mathcal R=[X_a/2,2X_b]\times[-1,1],\qquad
\mathcal B=[1/2,2]\times[X_a/2,2X_b]\times[-1,1].
\]

(X_a>0)이므로 여기서 radial 분모는 0에 접근하지 않는다. 원래 flat activation과 각 moment patch의 경계는 모든 유한 미분이 맞는다. 안쪽 활성화 collar에서 복소 radial analyticity를 가정하지 않는다. 실제 radial 방정식, 원래 자연해 및 실제 유한 moment·implicit-root 식의 실수 미분으로 각 고정 차수를 얻는다.

Heat의 원래 실수 표현은

\[
H(z)=\frac1{\Gamma(1+h)}\int_0^\infty e^{-v}v^h(1+zv)^{-h}\,dv,
\qquad z=\frac{2(1-\eta^2)}X\ge0.
\]

모든 유한 (j\ge0)에 대해

\[
(-1)^jH^{(j)}(z)
=\frac{(h)_j}{\Gamma(1+h)}
\int_0^\infty e^{-v}v^{h+j}(1+zv)^{-h-j}\,dv,
\]

따라서

\[
|H^{(j)}(z)|\le(h)_j(1+h)_j\le j!(j+1)!.
\]

오른쪽 적분 majorant는 (z\ge0)에서 공통이고 양 끝에서 적분 가능하다. 유한 번의 dominated convergence로 (z=0)에서의 오른쪽 미분과 연속 jet도 얻는다. (eta)에 대한 chain rule에서는 (z_eta,z_{etaeta})만 남으며, 원래 무한 heat debt 적분의 각 추가 (z) 미분에는 대응하는 (X^{-1})이 붙어 기존 적분 가능성을 유지한다.

I2의 원래 정규화 contraction은 실제 본문과 (1/4) 이하의 Lipschitz 경계를 유지한다. 따라서 각 (eta)에서 implicit Jacobian의 역은 (4/3) 이하이며, 이미 smooth한 실제 heat debt를 유한 번 미분하면 I2 root의 모든 고정 차수도 존재한다. 반복식의 유한 근삿값을 root로 대신하지 않는다.

(eta=\pm1)은 (T=0)에 해당하므로 **원래 (T\ge0) 쪽에서의 jet**이다. (z<0)의 원래 실수 heat 적분이나 음의 시간으로의 연장은 주장하지 않는다.

## 3. 각 실제 leading jet의 FTC 상수

고정 (f=\partial_X^r\partial_\eta^kF_0) 또는 (U_0)에 대해 anchored rectangular FTC를 적용한다. 일반 (d)차원 box의 하한을 (a), 상한을 (b)라 하면

\[
\sup_{x\in[a,b]}|f(x)|
\le \sum_{S\subseteq\{1,\ldots,d\}}
\int_{[a_S,b_S]}
\sqrt{1+|\partial_S f(t_S,a_{S^c})|^2}\,dt_S.
\]

빈 (S)의 항은 (sqrt{1+f(a)^2})다. 각 적분의 본문은 원래 shared function의 실제 mixed derivative를 가리킨다. 정의되지 않은 oracle나 caller가 제공한 상계는 허용하지 않는다. 필요한 모든 mixed derivative의 연속성은 앞 절의 실제 source regularity에서 온다. 이 적분 상수는 (X,\eta)에 의존하지 않는다.

## 4. 정확한 slow 미분과 coefficient recurrence

원래 chart를

\[
R=\sqrt{2sX},\quad Z=s^D\eta,\quad T=s(1-\eta^2),\quad
A=\tfrac12+h,\ D=\tfrac12-h,\ L=1-2h\eta^2
\]

로 쓴다. (E_s=s\partial_s), (d=1-\eta^2)라 하면

\[
\partial_R=\frac Rs\partial_X,
\]
\[
\partial_Z=\frac{2\eta s^{-D}}L E_s
-\frac{2\eta Xs^{-D}}L\partial_X
+\frac{d s^{-D}}L\partial_\eta,
\]
\[
\partial_T=\frac1{sL}E_s-\frac X{sL}\partial_X
-\frac{D\eta}{sL}\partial_\eta.
\]

원래 chart 좌표에 이 세 연산자를 적용하면 정확한 identity matrix가 나오며, coefficient commutator도 0이다. 여기서 (E_s,\partial_X,\partial_\eta)는 서로 commute한다. 따라서 모든 mixed 순서를 대표하는 유한 multiindex recurrence를 사용할 수 있다.

실제 multiplier (a)와 profile (P)에 대해

\[
D^\alpha(aP)=\sum_\beta c_{\alpha\beta}
E_s^{\beta_0}\partial_X^{\beta_1}\partial_\eta^{\beta_2}P
\]

를 만들고, 다음 미분에서

\[
D_i(c_\beta P_\beta)
=(D_i c_\beta)P_\beta+
\sum_j c_\beta a_{ij}P_{\beta+e_j}
\]

를 그대로 사용한다. coefficient의 미분항을 삭제하지 않는다. 각 실제 (c_{\alpha\beta})에는 같은 (mathcal B) 위 3차원 FTC 상계를 붙인다. 분모 (s,X,L)의 원래 양의 하한 때문에 이 상수들도 유한하다.

Leading multiplier는 (s^{-A-1/2})와 (s^{-A})다. 양의 차수에서 기존 normalized profile은 (E_n=\sqrt{2X}F_n)를 쓰므로 angular multiplier는 (s^{-A-1/2}/\sqrt{2X})이다. (U_n)의 multiplier는 (s^{-A})다. 이 모든 인자를 미분 **이전**에 유지한다.

## 5. 양의 계수 무한합과 cutoff 확대

원래 canonical (c_n)은 실제 (n)번째 source norm을 이용한 prefix-independent 대각선 수열이다. 임의의 (b_n\ge c_n)에 대해서도

\[
E_q^m[q^{2nh}\chi(b_nq)]
=q^{2nh}\sum_{j=0}^m\binom mj(2nh)^{m-j}E_x^j\chi(x),
\quad x=b_nq
\]

이므로 동일한 Euler 상계가 성립한다. 원래 radial extra stream 항 (x\chi'(x))에는 다음 Euler jet을 쓴다. (b_n)을 더 크게 한다고 이 bound에 추가적인 (b_n) 인자가 생기지 않는다.

고정 (m)에서 (J=\max(3,m))라 놓는다. (n<J)는 실제 (n,m) norm을 유한하게 합하고, (n\ge J)는 각자의 대각선 경계를 사용한다. (0<q\le1)에서 그 tail은

\[
\sum_{n\ge J}2^{-n}q^{nh}
\le2^{1-J}q^{Jh}\le2^{1-J}q^{2h}
\]

이다. 실제 (n=1,2)를 버리지 않는다. (b_n\ge2^n) 때문에 (q>0)의 모든 compact 구간에서 합과 모든 cutoff 미분은 locally finite하다.

각 positive profile jet의 상계에 앞 절의 exact coefficient 상계를 곱하면 slow jet 상수를 얻는다. (q=Qs), (epsilon=Q^h), (1/2\le s\le2)에서 (q^{2h}\le4\epsilon^2)를 사용한다. 모든 lower-order 값을 포함한 maximum을 (C_m)로 택하면

\[
\max_{|\alpha|\le m}(|D^\alpha F|,|D^\alpha G|)\le C_m
\]

이며, 별도의 (C_m^{\rm err})에 대해 completed-minus-leading slow jet은 (C_m^{\rm err}\epsilon^2) 이하이다. 이 상수는 (ell,Q,q), 대표점 또는 box label에 의존하지 않는다. 각 고정 (m)마다 동일한 유한 recipe와 원래 source induction으로 증명한다.

## 6. API와 후속 결합

`attachActualAllBandBackgroundNorms(background,{derivativeOrder:m,...budgets})`는 private full C2 배경과 필요한 실제 canonical prefix를 요구한다. `rows[j].Cslow`는 (j\le m)에서만 존재한다. `gaussianRows[j].B_m`는 (j+2\le m)일 때

\[
B_j=\max(B_{\rm norm},C_{j+2},(j+2)!,L_{\max},2)
\]

로 발급한다. 임의 차수 recipe에는 수학적 16차 제한이 없다. 현재 생성된 prefix나 작업 예산이 부족하면 `RESOURCE_LIMIT`으로 끝나며 누락한 도함수를 0으로 놓지 않는다.

이 결과 자체가 새 공통 물리 cutoff 수열, 모든 band의 (H), 양의 가중치 또는 전역 residual 조립을 완료하지는 않는다. 후속 common family는 이 상수와 실제 velocity/pressure/stress norm을 같은 재귀 (b_n)에 결속해야 한다. 현재 module scope의 그 항목들은 `false`다. 원래 source 수학, 기존 UI 또는 M3 상태는 이 작업에서 변경하지 않았다.
