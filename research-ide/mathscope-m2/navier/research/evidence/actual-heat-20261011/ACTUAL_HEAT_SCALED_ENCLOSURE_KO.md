# 원래 heat 인자와 slow 도함수의 엄밀 구간

## 1. 완료한 범위

새 `actual-heat-scaled-enclosure.mjs`는 **실제 원본의 양의 $h$와 양의 heat 입력을 보존하면서**, 원래 heat 인자 하나와 R/Z/T 1차·대칭 2차 도함수 아홉 개에 대해 외향 반올림한 유리수 구간을 생성한다. 원본 결속 검사는 **12/12 PASS, 실제 process exit 0**이다. 실제 계수를 정규화한 뒤 계산하므로, 원래 $h$를 binary64의 0으로 바꿀 필요가 없다.

이 증거의 실제 실행점은 기존 원본 생산자가 고정한

\[
X=X_b e^{-1/4},\quad \eta=0,\quad s=1,
\qquad R=\sqrt{2X},\quad Z=0,\quad T=1
\]

이다. 원래 배경과 heat는 band와 무관하지만, 원본 결속에는 이미 검증된 `prepareActualEllOneCovarianceObstruction` 생산자의 내부 객체를 소비했다. **이 점의 heat 수치 인증을 ell=1의 양의 공분산 가중치나 원문 Γ 멤버십으로 확대하지 않는다.** 기존 ell=1 양성 obstruction은 변경되지 않는다.

여기서 $H$는 스칼라 **heat 인자**다. 공분산 행렬 $H_{\rm cov}$와 구별해야 한다. 전체 leading $F$, 실제 Volterra 해와 그 도함수, 공분산 행렬·역행렬·제곱근 가중치·curl에 대한 합산 수치 오차는 이 결과에 포함되지 않는다. `wholeGNUMComplete=false`, `newLeanKernelProof=false`, `m3MayStart=false`를 유지한다.

## 2. 실제 적분을 그대로 유지하는 환원

원본 heat는

\[
H(z;h)=\frac1{\Gamma(1+h)}
\int_0^\infty e^{-v}v^h(1+zv)^{-h}\,dv,
\qquad h>0,\quad z\ge0
\]

이다. 원본 AST는 $v=t/(1-t)$로 전체 반직선을 $0<t<1$에 옮겨 놓은 `heatLoss`를 저장한다. 새 모듈은 이 원래 적분 본문·양끝·Gamma 분모를 직접 대조한다. 다음 적분 본문 항등식도 실행한다.

\[
e^{-v}v^h
=e^{-v}v^h\{1-(1+zv)^{-h}\}
+e^{-v}v^h(1+zv)^{-h}.
\]

따라서 원래 `1 - heatLoss`와 위 $H$는 정확히 같다. 적분변수의 이름을 바꾸는 것과 덧셈·곱셈을 재묶는 것만 허용하는 source identity 검사를 사용했다. 무한 꼬리를 잘라 버리거나 heat를 1로 치환하지 않았다.

Gamma 적분과 Tricomi $U$의 표준 적분식은 NIST DLMF의 [5.2.E1](https://dlmf.nist.gov/5.2.E1), [13.4.E4](https://dlmf.nist.gov/13.4.E4)에서 확인할 수 있다. $t=zv$를 대입하면, $z>0$에서

\[
H(z;h)=z^{-h-1}U(h+1,2,1/z)
\]

를 얻는다. 이 등식은 참조 비교를 위한 것이며, 구현의 구간 보증은 다음의 유한 Taylor 잔여항에서 직접 얻는다.

## 3. 작은 양의 인자를 나누어 보존하는 정규화

다음을 정의한다.

\[
D_0=\frac{1-H}{hz},\qquad
D_1=-\frac{H'}h,\qquad
D_2=\frac{H''}{h(1+h)}.
\]

실제 실행점에서는 $h,z>0$이므로 이 나눗셈은 정당하다. 일반 계산 API는 $h=0$ 또는 $z=0$에서도 정규화한 계수의 **연속연장**을 지원한다. 이 일반 API에는 source 인증 권한이 없으며, 그 경계값으로 실제 매개변수를 대체할 수 없다.

$m=1,2$에 대해 적분 아래 미분하면

\[
D_m=\frac1{\Gamma(1+h)}
\int_0^\infty e^{-v}v^{h+m}(1+zv)^{-h-m}\,dv.
\]

$D_0$는 나눗셈을 직접 평가하지 않고

\[
\frac{1-(1+zv)^{-h}}{hz}
=v\int_0^1(1+tzv)^{-h-1}\,dt
\]

라는 적분식을 사용해 연속연장을 정당화한다.

상승계승을 $(a)_n=a(a+1)\cdots(a+n-1)$로 쓰면 유한 $N$항 식은

\[
\begin{aligned}
D_0&=\sum_{n=0}^{N-1}
\frac{(-1)^n(h+1)_n(1+h)_{n+1}}{(n+1)!}z^n+r_{0,N},\\
D_m&=\sum_{n=0}^{N-1}
\frac{(-1)^n(h+m)_n(1+h)_{m+n}}{n!}z^n+r_{m,N},\quad m=1,2.
\end{aligned}
\]

각 잔여항의 부호는 $(-1)^N$이며 절댓값은 해당 식의 양의 $N$번째 항보다 크지 않다. 이유는 $a>0,t\ge0$에서 $(1+t)^{-a}$의 $N$차 도함수가 항상 부호 $(-1)^N$을 가지며

\[
\left|\frac{d^N}{dt^N}(1+t)^{-a}\right|
=(a)_N(1+t)^{-a-N}\le(a)_N
\]

이기 때문이다. 이 Taylor 잔여항을 **전체** 양의 Gamma 밀도에 적분하고

\[
\frac{\Gamma(1+h+j)}{\Gamma(1+h)}=(1+h)_j
\]

를 사용한다. $D_0$에서는 추가로 $\int_0^1t^Ndt=1/(N+1)$를 사용한다. 따라서 잔여항 경계에 무한구간 적분의 꼬리까지 들어 있다.

이것은 **유한 항의 엄밀한 포함 구간**이다. 일반적으로 발산할 수 있는 무한 moment 급수를 수렴급수라고 주장하지 않는다. 지정한 항수와 정밀도에서 폭을 보증하지 못하면 `RESOURCE_LIMIT` 또는 `PRECISION_REQUIRED`로 실패한다. 두 근삿값의 차이만으로 오차를 추정하지 않는다.

## 4. 외향 반올림과 오차 예산

정밀도 $p$에서 모든 산술은 정수 격자 $2^{-p}\mathbb Z$의 하한·상한을 사용한다. 곱셈·나눗셈은 BigInt 정수의 바깥쪽 반올림으로 수행하고, 비교와 허용오차 판정에 binary64를 사용하지 않는다. 입력 매개변수와 허용오차는 정확한 유리수 문자열이다.

각 $D_j$의 허용 폭을 $\tau$라고 할 때 다음을 각각 검사한다.

1. 부호 있는 다음항 잔여구간의 폭 $\le\tau/2$.
2. 유한 다항식 누적의 외향 산술·매개변수 구간 폭 $\le\tau/2$.

두 폭의 합이 실제 반환 구간의 폭이다. 전체 slow 계수 조합은 더 보수적으로 $D_j$를 요청 허용오차의 $1/64$ 폭으로 먼저 감싼 뒤, 각각의 조합 폭이 최종 요청 이하인지 다시 검사한다.

실제 실행은 **192 bits**, 최종 계수 허용 폭 **$10^{-40}$**를 사용했다. 원본에서 증명한 매개변수 포함 구간이 매우 작아 유한 **1항**으로 예산을 충족했다. 이는 $H=1$을 출력했다는 뜻이 아니다. 실제 양의 $hz$ 인자와 부호 있는 잔여항이 그대로 남는다.

## 5. 원래 slow 좌표로의 미분

실제 chart의 원본 식은

\[
X=\frac{R^2}{2s},\quad
\eta=\frac{Z}{s^{1/2-h}},\quad
s-Z^2s^{2h}=T,\quad s>0
\]

이다. 이 식들이 원래 단조 역함수 본문과 양의 root bracket에 결속되었음을 실행 검사한다. 그 뒤 보통의 실수 거듭제곱 법칙으로

\[
z=\frac{2(1-\eta^2)}X
=\frac{4(s-Z^2s^{2h})}{R^2}
=\frac{4T}{R^2}
\]

를 얻는다. 이 등식은 점 하나에서만 성립하는 대입식이 아니라 smooth chart의 근방에서 성립하므로 그 근방의 도함수도 일치한다. 역함수 root를 수치로 근사해 얻은 결론은 아니다.

따라서 다음 표의 정확한 양의 인자와 정규화 계수를 곱하면 실제 slow 도함수다. 여기서 $T$는 slow 시간이며, 원래 상수 정의의 거대한 $T_{\rm prof}$와 구별한다.

| 실제 양 | 정확한 양의 인자 | 정규화 계수 |
|---|---|---|
| $1-H$ | $hz$ | $D_0$ |
| $H_R$ | $hz/R$ | $2D_1$ |
| $H_T$ | $hz/T$ | $-D_1$ |
| $H_{RR}$ | $hz/R^2$ | $-6D_1+4(1+h)zD_2$ |
| $H_{RT}$ | $hz/(RT)$ | $2D_1-2(1+h)zD_2$ |
| $H_{TT}$ | $hz^2/T^2$ | $(1+h)D_2$ |
| $H_Z,H_{RZ},H_{ZZ},H_{ZT}$ | — | 정확히 0 |

실제 exponential integrand를 AST 미분하여 이 아홉 식을 유리식 항등 검사와 대조했다. $H_{RR}$에서 $H'z_{RR}$를 누락한 식이 실패하는 negative control도 실행했다. 정규화된 $1/T$ 표현은 현재 $T=1$인 점에서만 수치 결속한다. $T=0$에서는 이를 0/0으로 평가하지 않고 원래 chain rule의 연속연장을 사용해야 한다.

## 6. 원래 양의 매개변수에 결속한 실제 구간

원래 source의 정확한 매개변수는

\[
h=\exp\{-8002(\exp(1048576)+10)\},\qquad 0<h<2^{-4096}
\]

이다. 기존 원본 terminal-stage 증명에서 $X=X_b e^{-1/4}>X_R$를 얻고, 실제 $P_*=e^{2T_{\rm prof}}>2^{256}$, $C_{\rm selected}>1$, $X_R=110(C_{\rm selected}P_*)^{10}$를 사용하면

\[
X>2^{2560},\quad 0<z<2^{-2559},\quad
R^2>2^{2561},\quad R>2^{1280},\quad T=1.
\]

따라서 위 표의 양의 인자들에는 차례로 다음의 엄밀한 상한이 있다.

\[
hz<2^{-6655},\quad hz/R<2^{-7935},\quad hz/T<2^{-6655},
\]
\[
hz/R^2<2^{-9216},\quad hz/(RT)<2^{-7935},\quad hz^2/T^2<2^{-9214}.
\]

실행 결과를 짧은 정확한 식으로 표시하려고 $u=2^{-192}$라고 두면 다음 구간과 같다. 표의 숫자는 반올림한 소수 요약이 아니라 JSON에 저장된 유리수 구간의 정확한 재표현이다.

| 정규화 계수 | 실제 반환 구간 | 폭 |
|---|---|---|
| $D_0$ | $[1-2u,1+u]$ | $3u$ |
| $D_1$ | $[1-3u,1+u]$ | $4u$ |
| $D_2$ | $[2-13u,2+4u]$ | $17u$ |
| $H_R/(hz/R)$ | $[2-6u,2+2u]$ | $8u$ |
| $H_T/(hz/T)$ | $[-1-u,-1+3u]$ | $4u$ |
| $H_{RR}/(hz/R^2)$ | $[-6-6u,-6+29u]$ | $35u$ |
| $H_{RT}/(hz/(RT))$ | $[2-13u,2+2u]$ | $15u$ |
| $H_{TT}/(hz^2/T^2)$ | $[2-13u,2+7u]$ | $20u$ |

최대 폭은 $35\,2^{-192}\approx5.57583\times10^{-57}<10^{-40}$이다. 예를 들어 heat 인자 자체는

\[
H\in[1-(1+2^{-192})2^{-6655},\,1]
\]

에 있다. 실제로는 $h,z>0$이므로 $H<1$이다. $H_R,H_{RT},H_{TT}>0$, $H_T,H_{RR}<0$도 위 계수와 원래 양의 인자로 증명된다. 절대 구간의 0이나 1은 외향 포함구간의 끝점이다. 실제 비영 도함수 또는 실제 heat를 그 끝점으로 바꾸었다는 뜻이 아니다. 원래 양의 scale 식의 root도 `witnessPositiveFactors`에 저장된다. 실제 $h,z$ 크기에 대한 상대 정밀도를 보증한다는 주장은 하지 않는다.

## 7. 모든 유한 차수의 분석적 지배와 실행 차수의 구분

각 고정 $j\ge0$에 대해 적분 아래 미분한 본문은

\[
\frac{(h)_j}{\Gamma(1+h)}e^{-v}v^{h+j}(1+zv)^{-h-j}
\]

의 부호 있는 형태다. $z\ge0$에서 마지막 인자는 1 이하이므로 전체 적분구간의 적분가능한 Gamma moment가 지배한다. 따라서 모든 고정 유한 $j$에 대해 미분·연속성이 정당하고

\[
|H^{(j)}(z)|\le(h)_j(1+h)_j\le j!(j+1)!
\qquad (0<h<1)
\]

이다. $z=0$에서는 같은 오른쪽 미분과 연속연장을 사용한다. **이 모든 차수의 문장은 원래 적분에 대한 분석적 증명이며, 실제 도함수 root 생성과 수치 구간 실행은 2차까지다.** 새 Lean kernel 정리를 실행했다거나 임의 차수의 수치 evaluator를 실행했다고 기록하지 않는다.

## 8. Precise Special Functions와 Exa의 사용

Exa로 NIST DLMF의 Gamma·Tricomi $U$·Bessel $K$ 적분식을 조회했다. 검색 기록은 [primary-reference-lookup.json](primary-reference-lookup.json)에 있다. 사용한 페이지는 공식 1차 문헌이며, 조회 결과 자체가 수치 인증서를 제공하는 것은 아니다.

Precise Special Functions 도구는 입력을 `number`로 받으며 실제 원본 $h$를 표현할 수 없다. 따라서 **별도의 표현 가능한 참조점** $h=1/2,z=1/64$에서만 $\Gamma(3/2)$, $K_0(32)$, $K_1(32)$를 80자리로 요청했다. 원본 매개변수 대신 호출한 것이 아니다. 원시 응답은 [precise-special-functions-references.json](precise-special-functions-references.json)에 보관했다.

[DLMF 10.32.E9](https://dlmf.nist.gov/10.32.E9)의 $K_\nu$ 적분에 $v=\sinh^2(t)/z$를 사용하면

\[
H(z;1/2)=\frac{e^{1/(2z)}}{2\Gamma(3/2)z^{3/2}}
\left[K_1\!\left(\frac1{2z}\right)-K_0\!\left(\frac1{2z}\right)\right].
\]

이 식과 $K_0'=-K_1, K_1'=-K_0-K_1/x$를 사용해 $H,H',H''$의 독립 참조값을 계산했다. 뒤의 두 관계는 같은 $K$ 적분의 미분과 부분적분으로 얻을 수 있다. 플러그인 소수값의 결합은 표준 Python `decimal` 100자리로 수행했다. 참조 heat는 약 **0.98860982095167588743**이다.

이 참조점에서는 29개의 유한 moment 항을 사용한 $10^{-15}$ 폭의 세 계수 구간에 독립 $D_0,D_1,D_2$ 값이 모두 들어왔다. heat 자체도 대응 구간에 들어왔고, $D_2$ 정규화에서 $1+h$를 빠뜨리면 구간 밖으로 나갔다. **5/5 PASS** 기록은 [precise-reference-comparison-final.json](precise-reference-comparison-final.json), 재현 helper는 [check_precise_reference.py](check_precise_reference.py)다.

플러그인과 Decimal 근삿값은 인증된 구간이라고 간주하지 않는다. 이들은 서로 다른 식을 사용한 오류 발견용 참조다. 실제 구간의 권한은 source 결속, 유한 Taylor 잔여항 증명, BigInt 외향 산술에서만 나온다.

## 9. 실행 증거와 재현

| 검사 | 실제 결과 | 범위 |
|---|---|---|
| 일반 산술·미분·입력·변조 검사 | 9/9 PASS, exit 0 | 원래 exponential 적분의 chain rule 및 일반 evaluator; 실제 member 인증은 하지 않음 |
| 실제 원본 heat·scale·구간·seal 검사 | 12/12 PASS, exit 0 | 원래 source 프로그램 1개, 고정 terminal 점 |
| 독립 플러그인 참조 비교 | 5/5 PASS | 표현 가능한 별도 참조점; 실제 source 값 인증은 하지 않음 |

실제 source 실행은 **21.544초**, peak RSS **1,336,086,528 bytes**였다. 실행 당시 HEAD는 `c4b1903b21243d7a2066daa9e66423f41c4e862f`이고, 새 모듈을 포함한 **53개 파일의 literal import closure SHA**를 실행 전후 대조했다. 이 문서는 source 실행이 끝난 뒤 작성했으므로 해당 import closure에 포함되지 않는다.

- 실행 JSON: [actual-heat-scaled-enclosure-source-attempt1.json](actual-heat-scaled-enclosure-source-attempt1.json)
- 실행 로그: [actual-heat-scaled-enclosure-source-attempt1.log](actual-heat-scaled-enclosure-source-attempt1.log)
- 일반 검사 TAP: [actual-heat-kernel-final.tap](actual-heat-kernel-final.tap)
- 일반 검사 runtime: [actual-heat-kernel-runtime.json](actual-heat-kernel-runtime.json)
- 새 graph: **233,243 nodes**, **9,297,420 canonical bytes**, SHA-256 `6569333c2f43189b4cf9474048194f7c690df6233d27fa7667937f7c7645b353`
- 실행 input SHA-256: `8ea0651e243f2840ded6a71ebd1d67bf318b49863b7be92a8e6086a6d71d683e`
- 실행 import closure SHA-256: `2b8737fc72f3173af1753ab69f05b655b28d691f2f6d003fc4a452f16b0be4d2`
- 모듈 SHA-256: `965f2e8eeb7b0735ab9cb1ec50a1c9fb41874e0fc805daf15e3ca2da84f7b7d2`

새 source 실행은 아래와 같이 **새 증거 stem**을 지정해 재현한다. 실행 전에 다른 대형 source 작업이 끝났는지 확인해야 한다. 기존 기록을 덮어쓰는 실행은 runner가 거부한다.

```bash
node --max-old-space-size=2048 research-ide/mathscope-m2/navier/tests/actual-heat-scaled-enclosure-source-check.mjs research-ide/mathscope-m2/navier/research/evidence/actual-heat-20261011 actual-heat-scaled-enclosure-source-rerun
node --test research-ide/mathscope-m2/navier/tests/actual-heat-scaled-enclosure-kernel.test.mjs
python research-ide/mathscope-m2/navier/research/evidence/actual-heat-20261011/check_precise_reference.py --output research-ide/mathscope-m2/navier/research/evidence/actual-heat-20261011/precise-reference-comparison-rerun.json
```

API는 `prepareActualHeatScaledEnclosure({sourceProfile,precisionBits,tolerance,maxTerms})`와 `actualHeatScaledEnclosureCertificateFromProgram(prepared)`다. 매개변수 $h$, heat 입력, witness, caller가 공급한 bound 또는 완료 플래그는 source API 입력으로 받지 않는다. 이미 인증한 원본 객체가 있을 때에는 `attachActualHeatScaledEnclosure`를 사용할 수 있다. 복제된 객체, 수정한 계수·적분 노드·program metadata·node 배열은 seal 검사에서 실패한다. 뒤에 독립적인 graph 노드를 추가해도 이미 인증한 prefix와 원래 source certificate는 바뀌지 않는다.

이번 실행은 직접 Node source 경로다. worker와 browser에서 이 새 수치 기능을 실행했다고 기록하지 않으며, v75/v76 제품 번들이 이 새 모듈을 포함한다고 주장하지 않는다. 전체 G-NUM과 M2의 다른 수학 gate가 닫혀야 사용자가 요청한 M2 → M3 순서를 진행할 수 있다.
