# Y5 독립 척도·진공 제거·유한 한계 비교

이 추가 구현은 Y5-05/06/08의 남은 실험 경로다. 기존 Y6 flow, Y7 Lean source와 원본 compiler receipt는 수정하지 않는다. `ensemble-study`는 실제 새 SU(2) Wilson chain을 실행한다. 짧은 공개 예제와 긴 생산 실행을 구분하며, target에 맞지 않거나 통계가 부족한 결과도 그대로 남긴다.

## 독립 기준 척도

작용과 적분 측도는

\[
S_W=\beta\sum_p(1-\operatorname{ReTr}U_p/2),\qquad
\beta=4/g_0^2,\qquad d\mu=\prod_e d\operatorname{Haar}(U_e)
\]

이다. 각 link는 전체 연속 SU(2)의 단위 quaternion이며 유한 subgroup 또는 표현 cutoff로 대체하지 않는다. 각 sweep은 정확 조건부 밀도에 대한 SU(2) heatbath와 선택한 횟수의 microcanonical overrelaxation으로 구성된다. 이는 Float64와 명시 PRNG를 사용하는 수치 sampler다. 정상분포의 조건부 갱신 규칙과 유한 chain의 평형 진단은 별개다.

기준 척도는 [Hirakida–Itou–Kouno, arXiv:1811.02800, 식 (3.1)](https://arxiv.org/abs/1811.02800)의 SU(2) 규약

\[
t_0^2\langle E(t_0)\rangle=0.1
\]

을 사용한다. SU(3)에 흔히 쓰는 0.3을 SU(2)에 그대로 적용하지 않는다. 실제 scale chain과 channel chain의 seed·초기조건·trajectory를 분리한다. scale seed와 척도 정의에는 target Δ가 들어가지 않는다. β별 scale/reference geometry를 고정하고, 같은 β의 L/T sweep은 **같은 독립 reference 결과**를 공유한다. L을 바꾸면서 그 ensemble의 자체 t₀로 a를 다시 정의하지 않는다.

표시 단위는 \(\ell_{\rm ref}=\sqrt{t_0}\)다. 따라서

\[
\frac a{\sqrt{t_0}}=\frac1{\sqrt{t_0/a^2}},\quad
\frac L{\sqrt{t_0}}=\frac{N_s}{\sqrt{t_0/a^2}},\quad
\frac T{\sqrt{t_0}}=\frac{N_t}{\sqrt{t_0/a^2}},\quad
m\sqrt{t_0}=(am)\sqrt{t_0/a^2}.
\]

이는 독립적으로 측정한 상대적 기준 단위다. 외부의 물리 기준값을 가져오지 않았으므로 fm·MeV 보정값을 만들지 않는다. 에너지를 길이의 역수로 쓸 때는 자연단위 \(\hbar=c=1\)를 사용한다. target와 측정 질량·오차를 나란히 내보내고, 일치를 강제하지 않는다.

### 표준 flow의 정규화

기존 M1의 invariant form은 SU(2)에서 \(B(X,Y)=-\operatorname{Tr}(XY)\)다. [Lüscher, arXiv:1006.4518, 식 (1.4)와 Appendix C](https://arxiv.org/abs/1006.4518)의 표준 Wilson flow와 맞추면 새 scale solver는

\[
\frac{dV}{d(t/a^2)}=-\frac{g_0^2}{2}\operatorname{grad}_B S_W(V)\,V
\]

를 사용한다. 기존 Y6가 명시한 \(-g_0^2\operatorname{grad}_B S_W\) 규약과는 \(t_{\rm standard}=2t_{\rm Y6}\) 관계다. 새 척도 solver만 표준 시간을 쓰며 기존 Y6의 의미를 바꾸지 않는다. 독립 행렬 force와의 비교 검사가 이 계수까지 확인한다.

실제 에너지는 clover의 \(\sum_{\mu<\nu}-\operatorname{Tr} F_{\mu\nu}^2\)다. β를 곱한 action density를 E로 재사용하지 않는다. 별도의 plaquette 정의 \(E_P=4\sum_{\mu<\nu}(1-\operatorname{ReTr}U_{\mu\nu}/2)\)와 비교한다. full simultaneous force를 쓰는 group RK3, 실제 step halving, SU(2) 유지, action 감소와 전체 gauge covariance를 검사한다. step 차이와 두 E 정의의 차이는 수치·격자계통 비교이며 엄밀한 global error bound가 아니다.

## 유한 pure-gauge 진공과 실제 관측 벡터

적용 범위는 유한 주기 경계, β>0, 전체 Haar 구성 공간, 추가 action·fermion·sector restriction·representation cutoff가 없는 pure SU(2) Wilson 모형이다. 그 조건을 바꾸면 uniqueness 적용을 거부한다.

[Lüscher의 transfer kernel 구성](https://bib-pubdb1.desy.de/record/396349/files/7611148.pdf), 식 (17), (20)–(23)에서 pure-gauge 인자를 취하면 양의 전체 상수를 제외하고

\[
K(U,V)=e^{-S_s(U)/2-S_s(V)/2}
\int d\Omega\,e^{-\beta\sum_{e\in E_s}(1-\operatorname{ReTr}[U_e(\Omega.V)_e^\dagger]/2)}
\]

를 얻는다. 정규화 Haar 위에서
\(m=e^{-2\beta(E_s+P_s)}\le K\le1\)이다. \(E_s=P_s=3N_s^3\)다. compact, continuous, symmetric kernel이므로 transfer는 compact Hilbert–Schmidt selfadjoint 연산자이며, 별도의 positive character expansion이 비음수 spectrum을 준다.

유일성은 여기서 **별도로 적은 pure-gauge 논증**이다. 최대 고유함수 f를 |f|로 바꾸면 Rayleigh quotient가 내려가지 않으며, 양의 kernel 때문에 |f|는 연속이고 엄밀히 양수다. 최대 고유공간에 직교한 두 번째 실수 고유함수가 있다면 양·음 영역이 모두 양의 측도를 가져야 한다. K>0이므로 그 함수의 절댓값은 더 큰 Rayleigh quotient를 가져 모순이다. 따라서 전체 진공 공간은 rank one이다. 원문이 fermion을 포함한 일반 경우에서 유일성을 미정으로 남긴 식 (27) 주변의 문장을, 이미 유일성을 증명한 문장으로 바꾸어 인용하지 않는다. 이 해석적 논증은 새 Lean 실행을 뜻하지 않는다.

유일한 진공에서는 정확한 벡터가

\[
v_i=(I-P_0)O_i\psi_0
=(O_i-\langle\psi_0,O_i\psi_0\rangle)\psi_0
\]

다. 그러나 유한 주기 시간의 표본평균은 \(\langle O_i\rangle_T\)를 추정한다. 이를 정확한 진공 평균이라고 표시하지 않는다.

### 전체 영에너지 공간을 제거하는 차분 관측

별도의 실제 관측은 Euclidean time difference다. 정해진 reflection-odd 부호로

\[
C_D(t)=C(t-1)-2C(t)+C(t+1)=-\langle D(t)D(0)\rangle,
\qquad D(t)=O(t+1)-O(t)
\]

를 원래 표본에서 계산한다. 이 부호는 데이터를 본 뒤 양수로 만드는 `abs`가 아니다. 음의 관측값은 음의 값으로 유지한다.

영온도에서는 \(\bar T=T/\lambda_0\)에 대해

\[
w_i=(I-\bar T)O_i\psi_0,\qquad
C_D(t)=\langle w_i,\bar T^{t-1}w_j\rangle\quad(t\ge1).
\]

\(0\le\bar T\le I\)이므로 이 벡터는 bounded operator로 정의되며, \(P_0(I-\bar T)=0\)으로 전체 진공 공간이 제거된다. 비유계 \(\sinh(H/2)\)의 추가 domain 가정을 필요로 하지 않는다. 일반 finite-T 전개에서도 \(2(\cosh(a(E_n-E_m))-1)\) 인자가 모든 영에너지 block을 없앤다. 하지만 들뜬 상태끼리의 서로 다른 에너지 전이는 남는다.

이를 검증하는 음성 사례에는 degeneracy가 있는 vacuum에서 평균 제거만으로 C가 남는 경우, 유일 진공이어도 thermal mean과 vacuum mean이 다른 경우, thermal transition의 effective mass가 ground gap보다 작은 경우가 있다. 따라서

\[
\mathrm{gap}_{\rm global}\le E_{\rm channel}\le m_{\rm eff}
\]

는 양의 spectral measure와 전체 진공 직교성을 갖는 영온도 관측에만 적용한다. periodic cosh 근사는 finite-T의 모든 thermal transition을 정확히 제거하는 정리가 아니다.

## 상관함수, overlap과 오차

실제 operator basis는 같은 time slice의 공간 plaquette와 공간 APE-smearing 수준들이다. 시간 방향 link를 smear하지 않는다. basis별 C, 명시된 t₀를 쓰는 GEVP, 사전에 정한 fit window, cosh fit의 데이터·오차·잔차·자유도를 모두 반환한다. C₀가 특이하거나 비양성이면 GEVP에 임의 ridge를 붙이지 않는다. C≤0, acosh argument<1, 탐색 끝에 닿은 mass, 부족한 bootstrap은 각각 별도 미해결 상태다.

불확실성은 chain 안의 whole-configuration circular block bootstrap으로 계산하고 표본평균을 매번 다시 제거한다. 독립 scale bootstrap과 channel bootstrap을 함께 전파해 \(m\sqrt{t_0}\)의 통계 오차를 계산한다. bootstrap 성공률을 stationarity 증명으로 표시하지 않는다. cold/hot, burn-in history, split-Rhat, autocorrelation window, ESS, unrounded clover-charge 이력을 별도로 보존한다.

fit objective의 covariance는 diagonal이며 이 한계를 명시한다. whole-configuration bootstrap refit에는 시간별 관측의 상관이 유지된다. 단일 operator의 양의 fit, 작은 residual, 한 GEVP 고유값은 전체 spectrum의 양의 하한이 아니다. 넓은 window가 실패하면 성공한 짧은 window로 실패 결과를 덮어쓰지 않는다.

## 일정 기준에서의 a·L·T 비교

서로 다른 β에서 독립적으로 측정한 a로 L/√t₀와 T/√t₀를 맞춘다. 실제 deviation, 사전에 지정한 matching tolerance와 모든 원래 lattice 크기를 노출한다. 같은 β의 Ns 또는 Nt를 바꾸는 sweep은 동일한 reference scale을 사용해 반대편 길이를 고정한다. 순서는 유한 a,L에서 T 증가, 유한 a에서 L 증가, 고정 기준 척도에서 a 감소다. 실제 유한 데이터가 이 수학적 극한의 존재를 증명하지는 않는다.

통계, operator overlap, T, L, a, 표현 cutoff를 분리한다. 본 solver의 표현 cutoff는 `NONE`이다. 추가로 flow step·t₀의 수치 interpolation·clover/plaquette 정의·reference-volume dependence가 남는다. 최소 세 개의 맞춘 spacing과 해석 가능한 error-bearing mass가 없으면 a² 외삽을 그리지 않는다. 그 조건을 만족해 그리는 fit도 ansatz·window·data·오차 가정을 노출하며 continuum gap lower bound는 `null`이다.

## 원본과 재현

각 scale configuration의 전체 flow curve, 채널 configuration의 전체 time-slice operator 값, 정수로 반올림하지 않은 Q, source SHA와 chain seed를 보존한다. 전체 링크의 SHA는 명시한 little-endian IEEE754 Float64 byte열과 정확한 model descriptor를 함께 묶는다. 일부 점만 골라 source hash를 만들지 않는다. 초기조건부터 같은 전체 chain을 다시 실행하여 원본을 복원할 수 있다.

생산 작업은 [experiments/run-study-job.mjs](experiments/run-study-job.mjs)로 실행한다. 새 job directory가 이미 있으면 덮어쓰지 않는다. 그 실행 당시의 kernel·analysis·protected dependency source를 따로 저장하며 결과 SHA를 기록한다. 같은 β의 L/T 작업에 앞선 reference를 쓰면 정확히 어떤 source-bound 생산 결과를 재사용했는지 표시한다. 새 channel chain은 그 작업에서 실제 실행한다.

검증 명령:

```bash
node --test research-ide/mathscope-m3/gauge/tests/su2-study-kernel.test.mjs \
  research-ide/mathscope-m3/gauge/tests/scale-analysis.test.mjs
node research-ide/mathscope-m3/gauge/experiments/run-study-job.mjs \
  research-ide/mathscope-m3/gauge/experiments/production-a-base-input.json \
  a-new-unwritten-job-id
```

현재 수치·해석적 유한 격자 근거는 기존 유한 Real Lean theorem과 별도다. 모든 결과에서 continuum Yang–Mills의 구성, uniform positive gap과 Clay 문제 해결은 주장하지 않는다.

## 실제 장시간 실행 결과

아래 수치는 [실제 원본 7개 행의 합본 검토](evidence/scale-expansion/matched-study-review-attempt1/review.json.gz)에서 가져왔다. bootstrap 구간은 95% percentile **통계 추정 구간**이며 엄밀한 신뢰구간 또는 계통오차를 모두 포함한 구간이 아니다. 각 행에는 새 cold/hot chain의 두 seed·전체 configuration source hash, 원본 파일과 실행 당시 source snapshot이 있다. 합본 검토와 공개 archive는 이 결과를 읽어 검증하며 그 자체가 새 Monte Carlo 실행은 아니다.

| 행 | β | 격자 | t₀/a² | m√t₀ 추정 | 통계 구간 | 원래 target |
| --- | ---: | --- | ---: | ---: | --- | ---: |
| a-coarse | 2.16 | 5³×10 | 0.37745545 | 0.934023 | [0.705755, 1.222837] | 1.25 |
| a-base | 2.30 | 6³×12 | 0.58570987 | 0.909369 | [0.787653, 1.047144] | 1.25 |
| a-fine | 2.40 | 8³×16 | 0.99778830 | 0.979797 | [0.828584, 1.168130] | 1.25 |
| L 증가 | 2.30 | 8³×12 | 동일 β reference | 1.042173 | [0.792123, 1.295417] | 1.25 |
| T 증가 | 2.30 | 6³×24 | 동일 β reference | 0.807059 | [0.675722, 0.952361] | 1.25 |
| 별도 검증 Δ=.9 | 2.30 | 6³×12 | 동일 독립 reference | 0.768808 | [0.653576, 0.914692] | 0.9 |
| 별도 검증 Δ=1 | 2.40 | 8³×16 | 동일 독립 reference | 0.901483 | [0.773723, 1.065400] | 1.0 |

처음 목표 1.25를 대부분의 모형이 달성하지 못한 결과도 남긴다. 그 탐색 뒤 .9와 1.0을 별도 입력 파일에 지정하고, production과 겹치지 않는 새 seed·configuration으로 평가했다. 이 둘은 명시한 통계 구간에 들어가지만 중심 추정값은 목표와 다르다. pilot을 보고 정한 목표라는 선택 이력을 공개하며, 정확한 일치나 일반적인 목표 찾기의 성공을 주장하지 않는다.

coarse의 첫 2,048개 표본 실행은 128회 bootstrap 중 유효 84회로 미해결이었다. 같은 두 chain의 동일 prefix를 포함한 4,096개 표본 실행을 사용했으며, 앞선 실패를 [원본 기록](evidence/scale-expansion/production-a-coarse-attempt1/result.json)에 남겼다. 이것은 독립 검증이 아니라 명시한 연장이다. 독립 검증 두 행의 configuration은 production과 겹치지 않음을 전수 검사했다.

전체 공개 7행에는 **12,288개 실제 channel configuration과 별도 reference 384개**가 있다. 원래 실패한 coarse 첫 실행까지 합쳐 실행 receipt는 8개다. 같은 reference와 base 행을 a/L/T 그래프에서 재사용할 때 이를 독립 표본으로 여러 번 세지 않는다.

### 비교가 말하는 범위

세 a행의 실제 L/√t₀는 8.13836, 7.83989, 8.00886이고 T는 각각 그 두 배다. 사전에 지정한 nominal (8,16), 허용 상대 편차 .08 아래의 실제 최대 편차는 약 **2.002%**다. 길이가 정확히 같다고 표기하지 않는다. 고정 β의 L 비교와 T 비교에는 똑같은 reference가 들어가므로 a와 반대편 길이가 실제로 고정된다.

세 a행으로 조건부 `m√t₀=c₀+c₁(a/√t₀)²` fit을 계산하면 c₀≈0.99710, 표시용 통계 표준오차≈0.15593이다. 이는 큰 격자 간격 a/√t₀≈1.00–1.63의 세 점을 사용한 ansatz 비교다. scaling 영역의 검증이나 양의 continuum 하한이 아니다. 데이터, fit window인 세 행 ID, diagonal 오차 가정과 유한 L/T·overlap·matching 계통효과를 모두 반환한다. `continuumPositiveLowerBound`는 `null`이다.

다음 수치 한계는 그대로 남는다.

- β=2.3 reference의 cold-chain ESS는 **15.7138**로, 사전에 고정한 최소 16보다 작다. `INSUFFICIENT_EFFECTIVE_SAMPLES`를 삭제하거나 문턱을 내리지 않는다. 이 reference를 쓰는 질량의 구간은 stationarity에 조건부인 추정이다.
- base의 primary fit bootstrap은 103/128회로 기준에 간신히 도달했다. L 차이의 공통 scale bootstrap은 98회, T 차이는 102회만 유효하여 요구 103회에 미달한다. 따라서 그 차이의 별도 구간은 `null`이며 계통오차 상한을 발급하지 않는다.
- 늦은 시간의 음의 C와 차분 C, 실패한 fit window, 비양성 GEVP는 원래 값과 사유를 유지한다. 한 창의 성공을 plateau 증명으로 바꾸지 않는다.
- 표준 flow의 수치 오차, t₀ interpolation, clover/plaquette 정의 차이, reference 자체의 유한 부피, Float64·PRNG 한계는 Monte Carlo 표본오차와 별개다.

특히 clover t₀와 plaquette t₀의 차이는 β=2.16/2.3/2.4에서 각각 **0.214580, 0.345832, 0.400670**이다. plaquette t₀는 각각 0.162876, 0.239878, 0.597118이어서 격자 척도 정의 차이가 매우 크다. 이는 작은 RK3 step 차이로 상쇄되지 않는다. 이 데이터로 asymptotic scaling 영역에 도달했다고 주장할 수 없다.

### 독립 재계산과 공개 archive

[verify-study-numerics.py](experiments/verify-study-numerics.py)는 JS 수치 함수를 가져오지 않고 NumPy의 전체 time-slice contraction과 SciPy의 scalar minimizer로 원자료를 다시 계산했다. 모든 채널의 raw/connected C와 전체 영에너지 차분, 선택 채널의 128회 block bootstrap 오차와 fit, 세 reference의 모든 flow crossing/bootstrap, 독립 척도가 전파된 질량 구간이 명시한 Float64 허용오차 안에서 일치했다. [검산 receipt](evidence/scale-expansion/independent-numerical-review-attempt1.json)는 사용한 라이브러리 버전·검산 source SHA·원본 file SHA·실제 잔차를 포함한다.

`{kind:'ensemble-study',recordId:'su2-production-v1'}`는 해당 실제 실행을 공개하기 위한 byte 검증 archive다. `newExecution:false`와 `ARCHIVED_ACTUAL_NUMERICAL_RUNS`를 반환한다. 원본 8개 file·result·80개 source snapshot의 SHA는 packaging에서 실제 검사하며, 브라우저는 archive body와 표시할 7개 행의 SHA를 다시 확인한다. 브라우저가 raw 파일을 다시 다운로드했다고 주장하지 않는다. 모든 fit 데이터·조건·실패 상태는 표시 결과에 유지하고, 전체 raw configuration·bootstrap replicate는 링크한 저장소 파일에 보존한다.
