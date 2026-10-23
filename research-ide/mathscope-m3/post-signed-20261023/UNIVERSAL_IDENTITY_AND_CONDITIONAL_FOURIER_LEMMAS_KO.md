# MathScope: 엄밀히 증명된 일반 보조정리와 여전히 미증명인 원본 의무
2026-10-23. Original PR #30: \`a9b3a5b317525f6d0a71e2e356b054c9d25d2e60\` (unchanged).

## A. 원통좌표 보존형 잔차의 극화 항등식 — 일반 정리 증명

양의 반경 영역 \(r>0\)에서 매끄러운 속도장 \(u,v\), 스칼라 압력 \(p,q\)를 취한다. 독립 변수는 \((r,z,T,\theta,\xi,\eta)\)이며, MathScope의 미분 방향은

\[
D_r=\partial_r+a(r)\partial_\xi,\quad
D_z=\varepsilon\partial_z,\quad
D_\theta=r^{-1}\partial_\theta,\quad
D_t=-\varepsilon\partial_T+\partial_\eta.
\]

\(B(u,v)=(u\cdot\nabla)v\)는 원통좌표 연결항 \(-u_\theta v_\theta/r\) (반경 성분), \(+u_\theta v_r/r\) (각도 성분)을 포함한 **쌍선형** 연산자다. 정의

\[
\mathcal R(u,p)=D_tu-\nu\Delta_{\rm cyl}u+B(u,u)+\nabla_{\rm cyl}p
                 +u\,\operatorname{div}_{\rm cyl}u
\]

에서 \(\Delta_{\rm cyl}\)는 원통좌표 기저 접속을 포함하는 **선형 벡터 라플라시안**이다. 그러면

\[
\boxed{\mathcal R(u+v,p+q)
=\mathcal R(u,p)+\mathcal R(v,q)+B(u,v)+B(v,u)
+u\,\operatorname{div}_{\rm cyl}v
+v\,\operatorname{div}_{\rm cyl}u.}
\]

**증명.** 시간미분, 벡터 라플라시안, 압력 경사 및 발산은 선형이고, \(B\)는 양쪽 인수에 대해 선형이다. 따라서 \(B(u+v,u+v)\)는 네 쌍선형 항으로, \((u+v)\operatorname{div}(u+v)\) 또한 네 항으로 전개된다. 두 개의 자기항을 뺀 나머지가 위 식과 일치한다. 각각 \(u\), \(v\)가 발산 0이라는 가정도 사용하지 않는다. \(\square\)

**독립 검사.** \`verify_universal_full_3d_polarization.py\`는 속도장 각 성분을 여섯 변수의 임의의 SymPy \`Function\`으로 두고 \(a(r)\), \(\varepsilon\), \(\nu\)까지 기호로 유지하여 세 성분 전부와 발산의 차가 정확히 0임을 검사한다. 원통좌표 연결항 누락 변이도 거부한다.

**한계:** 이 정리는 임의의 충분히 매끄러운 함수가 만족하는 일반 항등식이다. 실제 MathScope 440만 노드 원본장이 정칙하다는 사실, 미분 DAG의 구현 의미론이 맞다는 사실, 두 DAG root가 정규화 후 같다는 사실, 원본 \(R=f\)와 외력 정칙성은 **여전히 OPEN**이다.

## B. 원래 2-토러스 방향의 정확한 작은 분모·Fourier 꼬리 — 조건부 정리 증명

\(\omega=(\sqrt2-1,1)\)와 평균 0인 \(F\in C^\infty(\mathbb T^2)\)를 취하자. 주기 1 기준으로 \(k=(k_0,k_1)\ne0\)의 역연산 계수는

\[
\widehat{H}(k)=\frac{\widehat{F}(k)}{2\pi i(k\cdot\omega)}.
\]

\(a=k_1-k_0\), \(b=k_0\), \(n=\max(|k_0|,|k_1|)\ge1\)이면 \(a^2-2b^2\)는 0이 아닌 정수다. 따라서

\[
|k\cdot\omega|^{-1}
=\frac{|a-\sqrt2 b|}{|a^2-2b^2|}
\le |a|+\sqrt2|b|
\le(2+\sqrt2)n.
\]

임의의 고정된 \(m\ge0\)에 대해
\(C_{m+4}=\max_{|\alpha|=m+4}\|\partial^\alpha F\|_\infty<\infty\)라 둔다.
\(|k_j|=n\)인 좌표에서 \(m+4\)번 부분적분하면

\[
|\widehat F(k)|\le \frac{C_{m+4}}{(2\pi n)^{m+4}}.
\]

\(m\)차 미분의 Fourier multiplier는 최대 \((2\pi n)^m\), 역연산 multiplier는 \((2\pi |k\cdot\omega|)^{-1}\)다. 정수 max-norm \(n\) 껍질의 모드 수가 정확히 \(8n\)개이고
\(\sum_{n>K}n^{-2}\le1/K\)이므로,

\[
\boxed{
\|H-S_K\|_{C^m}
\le\frac{8(2+\sqrt2)C_{m+4}}{(2\pi)^5}
\sum_{n>K}n^{-2}
\le\frac{8(2+\sqrt2)C_{m+4}}{(2\pi)^5 K}
}\quad(K\ge1).
\]

매 고정 \(m\)에 대해 꼬리가 수렴하므로, **실제 \(F\in C^\infty\)라는 전제 아래** \(H\in C^\infty\)이고 \(\omega\cdot\nabla H=F\)다. 평균이 0이 아니면 오른쪽을 \(F-\langle F\rangle\)로 바꾼다. \(\square\)

**한계:** 원본 각 \(F_j\)의 \(C_{j,m+4}\) 값을 산출하지 못했으며, 공통 domain, 모든 반복 단계의 상계, 원본 cutoff 합성의 무한급수 수렴은 증명하지 못했다. 그러므로 원래 Lemma 9.7/9.8·Lemma 5.4나 A–D 반복 완성을 의미하지 않는다.

## 증거 레벨 구별

- **일반 보조정리 A·조건부 보조정리 B:** 위 가정하에 수학적으로 증명.
- **원본 소스-전장 증명:** 아직 불충분. 실제 3D PDE 영수증과 private 증거 필요.
- **A–D 전 단계·전 미분차수·공통 collar·무한합:** OPEN.
- **원본 최종장 수치 67제트:** 0/67, 실제 scale selector 및 interval evaluator 없음.
- **원래 인수 원장:** M3 62/64, M4 0/16; N7-06·N8-05 OPEN, \`last_resolved_tau=null\`, RELEASE HOLD.
