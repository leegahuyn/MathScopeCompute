# 원본 maximum / monotone 0·1·2의 해석적 증명 시도

이 문서는 기존 조건부 항등식보다 한 단계 더 나아가, 원본 C.1 루프의 분산 함수 자체에 필요한 양성·단순근·정규화 정리를 증명한다. 아래에서 `PROVED`는 명시한 정리와 전제에 대한 통상적인 실해석 증명이다. `proofMethod=CLASSICAL_ANALYTIC_WRITTEN`으로 기록하며, Lean 실행이나 원본 전체 필드의 무조건적인 인증을 뜻하지 않는다. `SOURCE_VERIFIED`는 원본 바이트와 노드의 동일성 확인이다. 원본 전처리 필드에 그 정리를 적용하는 데 아직 필요한 조건은 `UNRESOLVED`로 남긴다.

대상 논문은 SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`인 제공된 166쪽 논문이다. C.4–C.11은 PDF pp.159–160, 원본 source j=0 Proposition 9.5는 별도 상류 기준이다. 이 문서는 그 기준의 완료 수를 올리지 않는다.

원본 구현은 `mathscope-m2/navier/actual-continuation-exact-loop.mjs`의 `prepareActualLoopProgram`, `mathscope-m3/navier/source-global-band.mjs`의 `attachGlobalSourceBand`, `mathscope-m2/navier/actual-background-physical-seminorms.mjs`의 `rectangularSourceFTC`이다. 실행 산출물의 `source.reviewedProducerBindings`에는 원래 실행에 포착된 각 파일의 SHA-256과 바이트 수가 있다. 스크립트는 기존 155개 원본 파일과 보관 사본을 실행 전후 확인하고, 3,892,594개 노드의 전체 압축·비압축 스트림을 끝까지 인증한다. 원본 PASS 플래그는 수학 전제로 사용하지 않는다.

## 1. Q 양성은 새 가정이 필요하지 않다

원본 그대로 정규화된 원주 평균을 쓰고

\[
M(z)=\langle e^{z\sin\theta}\rangle,\qquad
R(z)=\frac{M(2z)}{M(z)^2},\qquad
Q(z)=\int_0^1(1-s)R''(sz)\,ds
\]

로 둔다. 모든 실수 z에 대해 M(z)>0이며, 매개변수의 유계 구간에서 적분 안의 모든 도함수는 하나의 상수로 지배된다. 따라서 M은 실해석적이고 실수 축에서 그 역수도 실해석적이다.

S=sin θ라 쓰면 ES=0, ES²=1/2이다. 분산 항등식으로

\[
R(z)-1=\frac{\operatorname{Var}(e^{zS})}{M(z)^2}.
\]

z≠0에서 e^(zS)는 상수가 아니므로 오른쪽은 엄밀히 양수다. R(0)=1, R′(0)=0, R″(0)=1이므로 Taylor의 적분 나머지가 정확히 Q=(R−1)/z²를 주고, 제거 가능한 점에서 Q(0)=1/2이다. 그러므로 Q는 실수 축 전체에서 양의 실해석 함수다. R″이 모든 점에서 양수라는 불필요한 명제는 사용하지 않는다.

독립인 S,S′를 사용한 분산 표현과 평균값 정리에서

\[
|z|e^{-|z|}|S-S'|\le|e^{zS}-e^{zS'}|
\le |z|e^{|z|}|S-S'|
\]

를 얻는다. 또한 e^(−|z|)≤M(z)≤e^|z|이다. 이를 대입하면, z=0의 연속 값을 포함하여

\[
\frac12e^{-4|z|}\le Q(z)\le\frac12e^{4|z|}.
\tag{A}
\]

이것은 실제 z가 유한한 실수라는 것 외에는 원본 B.8 필드의 추정치를 요구하지 않는다.

## 2. 실제 signed root의 단순근

원본은 비음수 분산의 제곱근을 임의로 미분하는 대신

\[
W(\mu,p)=d_0\mu\sqrt{Q(\mu p)}
\]

를 이미 구현한다. d0>0이면 이 함수는 (μ,p)의 실수 평면에서 실해석적이다. m=(log M)′라 두면

\[
m'(t)=\operatorname{Var}_{t}(S)>0,\qquad
(\log R)'(z)=2\{m(2z)-m(z)\}.
\]

따라서 zR′(z)>0이다. μp≠0에서는

\[
W_\mu=\frac{d_0R'(z)}{2z\sqrt{Q(z)}}>0,
\quad z=\mu p.
\]

p=0 또는 μ=0에서 제거 가능한 식의 값은 d0/√2>0이다. μ≥0에서 실제 W는 엄밀하게 증가한다.

정규화된 tilted density는 e^(−2|t|) 이상이다. 두 독립 tilted 변수의 분산 표현은 m′(t)≥e^(−4|t|)/2를 준다. |z|≤B에서 m(2z)−m(z)를 z..2z에 걸쳐 적분하고 R≥1을 사용하면 |R′(z)|≥|z|e^(−8B)이다. 반대로 m′≤1, R≤e^(4B)에서 |R′(z)|≤2|z|e^(4B)이다. (A)와 함께

\[
\frac{d_0}{\sqrt2}e^{-10B}\le W_\mu
\le \sqrt2d_0e^{6B}
\tag{B}
\]

를 얻는다. 0에서의 연속 값에도 같은 경계가 적용된다.

## 3. 원본 괄호와 exp 경계의 명시적 충분 조건

원본 정확한 매개변수는 h=exp(−8002T), T=exp(1048576)+10, S=CSelected^100000, d0=1/(8S), μmax=S^12, δ=exp(−S^16)이다. 스크립트는 이름만 확인하지 않고 해당 전체 매개변수 식을 대조한다.

T>10과 exp x≥1+x에서 0<h<1/16이다. Pstar>1,K>1,0<σstar<1이므로 Qparameter>2^260>1이다. log CSelected>Qparameter^200>1에서 CSelected>e>2, 따라서 S>2^100000>2^20이다. 여기의 Qparameter는 1절의 분산 Q(z)와 다른 원본 계수 노름 매개변수다.

실제 전처리 필드에 a≥1/S, |p2|≤S, bs∈R가 성립하면 |μp2|≤S^13이다. (B)에 B=S^13을 넣는다. S≥16에서

\[
S^{14}-10S^{13}\ge6S^{13}\ge12S>
\log(8\sqrt2S),\qquad 6S^{13}<S^{22}.
\]

그러므로 원본 선언 경계 exp(−S^14)<Fμ<exp(S^22)가 실제 Wμ를 지배한다. 이 수치 흡수는 원본 jet norm 플래그를 읽지 않고 도출된다.

괄호의 오른쪽 끝은 다음 전역 분산 하한으로 처리한다:

\[
R(z)-1\ge
\begin{cases}z^2/4,& |z|\le1,\\
\sqrt{|z|}/64,& |z|\ge1.
\end{cases}
\tag{C}
\]

작은 z에서는 Cauchy–Schwarz로 Var(e^(zS))≥z²/2이고,
M(1)≤5/4+(1/64)/(1−1/36)=709/560, 그 제곱은 2보다 작다. 큰 z≥1에서는 cos θ≤1−2θ²/π², cos θ≥1−θ²/2와 Gaussian 적분으로 M(z)²<e^(2z)/(2z), M(2z)>e^(2z)/(12√z)를 얻는다. 여기에는 e<3, π<4만 사용한다. 따라서 R(z)>√z/6이다. z≥144에서 R−1≥√z/12, 1≤z≤144에서는 엄밀 증가와 R(1)−1≥1/4에서 R−1≥√z/48이다. 둘을 느슨하게 하여 (C)를 얻는다. 음의 z는 짝함수 성질로 처리한다.

μ=S^12에서 V=W²는 작은 z 영역에서 S^22/256 이상이다. 큰 z 영역에서는 |p2|^(3/2)≤S²를 쓰면 V≥S²/4096이다. S>2^20에서 둘 다 4S보다 크다.

원본 vs=a+bs²/a≥a>0, vstar=2+δ/2<5/2이다. literal cutoff의 활성 구간에서 r²=ζ²(vstar−vs)/a<3/a≤3S이고, 비활성 구간에서 r=0이다. 따라서 F(0)=−r≤0<F(S^12)이다. 이로써 실제 a,p2에 위의 연속 영역 경계가 공급되면 원본 system0의 존재성·유일성·괄호·m/M 경계가 함께 따라온다.

그러나 그 **실제 a,p2 경계 자체는 아직 이 감사가 증명하지 않았다**. 기존 B.8 producer의 정확한 rhs는 전체 B.22/B.26/B.34 및 restoration 적분인 `pre.scaledDebt`다. `actualB8ContractionProof()`는 `actual-continuation-exact-b8-data.mjs`에 저장된 incoming preconditioned bound=10^−8을 받아 유한 산술을 확인한다. 현재 감사는 그 정확한 rhs가 전 η 구간에서 그 노름 이하라는 연결을 독립적으로 인증하지 않는다. 이 연결 없이 E>0,a≥1/S,|p2|≤S를 새 PASS로 만들지 않는다.

## 4. 원본 circle lift의 정규화와 양성

system0의 실제 해 W=r와 실제 실수 a>0,ts,p2를 전제로 한다. 원본 t의 제거 가능한 적분은 p2≠0일 때

\[
t= t_s+\frac{d_0}{p_2}
\left\{\frac{e^{\mu p_2\sin\theta}}{M(\mu p_2)}-1\right\}
\]

이고 p2=0에서는 ts+d0μ sin θ다. 평균은 ts, 분산은 W²=r²이므로

\[
a\{1+\langle t^2\rangle\}=v_s+ar^2=v_{\rm Target}.
\]

원본 density=a(1+t²)/(2πvTarget)는 양수이고 한 주기 적분이 1이다. 따라서 φ(0)=0, φ(θ+2π)=φ(θ)+1이며 φ는 R 전체에서 엄밀 증가하고 전사이다. n≤phase<n+1인 정수 n을 써서 양쪽 원본 괄호 2π(phase±1)의 끝점 부호를 얻는다. 이는 floor를 미분하는 절차가 아니다.

추가로 실제 |ts|≤S,a≤S,vs≤S이면 vTarget≤2S이고 density≥1/(16S²)이다. literal cutoff 구간을 구분하면 vTarget≥a이다. 정규화 exponential tilt의 z 도함수 절댓값은 2e^(2|z|) 이하이므로 |t|≤S+2d0S^12e^(2S^13)<exp(S^14)다. density≤(1+t²)/(2π)<exp(S^38)에서 원본 system1의 선언 경계도 따라온다. 원본 입력의 동일한 pointwise envelope를 공급하는 일은 여전히 미해결이다.

## 5. system2의 정확한 원본 이미지

원본 body node622819는 F(s)=s−Z²s^(2h)−T이며, root call은 node622820이다. 원본 이미지 Z=s0^(1/2−h)η,T=s0(1−η²),s0∈[1/2,2],η∈[−1,1]에서 2D+2h=1이므로 F(s0)=0이다. 전 구간 s∈[1/2,2]에서

\[
0\le 2hZ^2s^{2h-1}
\le2h\,2^{2-4h}<8h<1/2.
\]

따라서 1/2<Fs≤1이고 같은 괄호에서 해는 유일하다. 0<h<1/16은 앞서 실제 정확한 매개변수에서 증명했다. 이 정리는 이미지를 갖는 매개변수 전체에 대한 정리다. 임의의 formal Z,T나 실제로 이미지 밖에 있는 대입까지 인증하지 않는다. 소스의 이미지 정의와 개별 대입의 이미지 소속 검사는 구분한다.

## 6. maximum node539400의 남은 실제 조건

원본 node539400=max(1,B), B=node539399이다. B는 24개 FTC 얼굴의 합이며 차원별 개수는 [3,9,9,3]이다. 무적분 앵커는 node494498,499013,516218이고 각각 sqrt(1+f²)다. 나머지 적분이 실수 유한 비음수이면 B≥3>1이므로 최대값의 두 번째 가지는 유일하다.

각 η 구간의 끝점은 node20=−1,node1=1이다. Cartesian 끝점은 ±radius이며 radius=node215514=sqrt(node137008), 음의 끝점은 node346574=−radius다. radius²의 양성은 그 실제 원본 식으로 확인해야 한다. 끝점이 순서대로 있다는 것과 모든 실제 얼굴 함수의 실수성·적분 가능성·매개변수 미분의 지배는 다른 주장이다.

새 스크립트의 `sourceClosures`는 serialized `freeCoordinates` 결과를 읽지 않는다. natural recurrence의 core, quadratic의 전체 방정식·branch metadata, monotone의 실제 body·괄호·경계, shared expression의 body·formal parameter를 직접 펼쳐 lexical capture를 조사한다. 아직 지원하지 못한 정의 연산자는 노드 번호와 함께 남긴다. 알려진 primitive 부분의 free-coordinate 목록이 비어도 미지원 정의가 있으면 폐쇄를 통과로 처리하지 않는다.

전체 maximum 원본은 node622802인 미래 R 좌표보다 먼저 만들어졌으므로 그 원본 숫자 DAG에 그 미래 좌표가 직접 등장할 수 없다. 대입 후 나타나는 R 의존성을 해소하려면 상류 정의의 숨은 X/η capture와 FTC 바인딩을 위와 같이 직접 감사해야 한다. 실제 적분 함수가 유한 C^m임을 아직 독립적으로 증명하지 못하면 B의 가지 선택도 전체 원본의 무조건적인 C^m 인증으로 승격하지 않는다.

## 7. 실행과 남은 최소 연결

`python research-ide/mathscope-m3/certification-20261014/radius_monotone.py --output EVIDENCE_DIR`는 `radius-monotone-proof.json`과 `execution.json`을 배타적으로 생성한다. `--self-test`는 지수값이나 수치 표본 없이 14개의 정확한 유리수·정수 부등식과 Q(0)=1/2의 계수를 검증한다. 실제 원본 전체 계산은 클라우드 job에서 수행한다.

남은 연결은 구체적으로 다음과 같다.

1. 원본 B.8의 실제 `pre.scaledDebt`와 저장된 contraction incoming bound를 같은 전체 η 영역에서 연결하고, 이어서 실제 E,a,p2,ts,vs의 pointwise envelope 및 필요한 유한 차수의 regularity를 증명한다. system0 body7450과 system1 body7539의 원본 natural node4483·quadratic node5029까지 같은 정의여야 한다.
2. FTC node539399의 모든 실제 얼굴 함수가 해당 box에서 실수이고 적분 가능함을 증명하고, 미분할 각 차수에 대한 지배를 공급한다. 식의 동일성, finite jet3, C∞/모든 차수는 서로 대체할 수 없다.
3. system2의 실제 각 대입이 선언된 원본 이미지에 속한다는 연결을 유지한다. 매개변수 h의 경계 자체는 이 감사에서 실제 식으로 증명한다.

Q 양성·signed variance의 단순근·정규화 정리는 위 연결을 해결하는 데 재사용할 수 있는 증명 결과다. 전체 updated mean/residual, physical PDE, original N6-01/N6-02, 56/64 진도는 이 결과만으로 완료되지 않는다.
