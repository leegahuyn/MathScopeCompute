# 남은 여섯 기준의 유한 합격 조건 재심사

## 판정과 변경 범위

**N4-03은 같은 N3 소스의 고정 차수 n=1에서 원문에 적힌 유한 인증 조건을 충족한다.** 이번에 원문을 수정하거나 caller가 넣은 작은 상수로 대체하지 않았다. 이미 도출되어 있던 실제 공통 collar·analytic strip·C1·Picard tail을, 원래 여섯 성분 연산자·실제 양의 차수 관측·독립 대수 검증과 연결했다.

새 `actual-picard-acceptance.mjs`의 판정은 `CERTIFIED_FINITE_FIXED_ORDER_ANALYTIC_COMPUTATION`, supported order `[1]`이다. 매우 큰 K는 정확한 유한 정수 식으로 유지하고, K항 수치 합산을 실행했다고 기록하지 않는다. 실제 모멘트 복구, 더 높은 차수, Fslow 잔차 감소, 전체 N4 및 M2 패키지는 이 인증서에서도 완료되지 않았다.

이 재심사는 이전 `RESUMED_SOURCE_AUDIT_KO.md`와 `ACTUAL_CORE_INDEPENDENT_REVIEW_KO.md`의 원전·영역·오차 검토를 보존한다. 다만 거기서 언급한 **전체 annulus, 모든 차수, 전체 패키지의 선행 조건을 개별 유한 항목의 합격 조건으로 일괄 적용해서는 안 된다**는 점을 명시한다. 이전 기록을 덮어쓰지 않고 이번 문서에서 판정 수준을 바로잡는다.

공유 checklist, index, worker, UI와 기존 frozen module은 이 작업에서 변경하지 않았다. 코드·검증 증빙은 아래 새 파일에 한정된다.

- `actual-picard-acceptance.mjs`
- `tests/actual-picard-acceptance.test.mjs`
- `tests/actual-picard-acceptance-independent.py`
- `evidence/actual-picard-acceptance.json`

## 1. 직접 확인한 원문과 판정 원칙

Blueprint 원본은 `MathScope_Research_IDE_Blueprint_v1_KO(1)(9).pdf`, 99쪽이다. 이번 재심사는 원본 페이지 텍스트를 직접 읽었다. 원본에 연결된 SHA-256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`이다. 이번 턴에서 PDF 바이트를 새로 내려받아 해시한 것은 아니며, 이 값은 보관된 원본 식별자다. 실제로 바이트를 다시 해시한 criterion 사본은 `evidence/original-m2-criteria.json`, SHA-256 `ae8d51410367ed147fda1e1e4c28bcc8df3e398378482e39102cef900ff15ed3`이다.

| 원본 페이지 | 이번 판정에 중요한 문맥 |
| --- | --- |
| p.5 | UI 완료, 수치 모델, 인증된 유한 계산, 조건부 형식화, 전칭 정리의 완료를 별도로 기록한다. 실제 fixture·artifact·관측·실패 대조군을 검증한다. |
| pp.57–58 | N4 패키지는 실제 배경·stress·flat error·remainder의 연결을 요구한다. p.58의 개별 차수 Picard, 모멘트 복구, 유한 잔차는 별도 항목이다. |
| pp.59–60 | N5 패키지는 실제 pulse·covariance·divergence·tail의 연결을 요구한다. 개별 위상 항목은 인증된 영역을 지정하며, covariance 항목에는 global identity가 명시된다. |
| p.79 | 필요한 배경 차수에서 source 추출→validated Picard→모멘트 복구→잔차 검증을 순서대로 시행한다. 국소 항등식 하나를 전체 localized pulse 검증으로 대체할 수 없다. |
| p.81 | 수렴 Picard series를 **고정 n**의 연산으로 명시하고, background formal series 및 cutoff 합성과 구별한다. |
| p.87 | 항목별 실제 산출물과 실행 결과를 근거로 삼으며, 연구 정리의 완료와 구현 완료를 구분한다. |

원전 방정식은 [공식 Navier–Stokes PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)를 직접 다시 읽었다. 보관된 원전 SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다. 이 문서는 원전의 새 정리 증명을 주장하지 않는다. 고정된 소스에서 이미 검토된 해석적 결론을 정확한 범위로 적용하고, 실제 실행하는 유한 연산을 별도 검사한다.

## 2. 여섯 원문 조건 — 문언 그대로

### N4-03 — 차수별 inner Picard 풀이 (p.58)

> (5.7)의 6성분 선형계와 (5.8)의 convergent Picard series를 사용하고 영 axis datum을 유지한다. 합격: 선택 analytic
> strip·Cn·Cauchy radius loss를 기록하고 Picard tail를 상계한다. 반경 interval은 차수에 따라 임의 축소하지 않으며 lemma
> 의 공통 interval 조건을 검사한다.

### N4-04 — 차수별 radial cutoff와 모멘트 복구 (p.58)

> Lemma5.2에 따라 En,Un을 확장하고 Vn, Πn을 재구성한 뒤 (5.10)-(5.12)의 다섯 total moments를 0으로 맞춘다. 합격:
> n차수의 moment correction 완료 전 n+1 source 생성 금지. n=1과 n≥2의 다른 Tn support를 각각 검사한다.

### N4-05 — 유한 배경 잔차 검증 (p.58)

> Fslow=R+div T를 직접 계산하고 (5.25)의 q^[2h(N+1) −Km] bound와 비교한다. 합격: N 증가에 따른 실제 잔차 감소를
> 정밀도·격자와 독립 추적한다. CN,m와 Km이 미계산이면 검증된 tail bound로 표시하지 않는다.

### N5-04 — 위상·편극·주파수 (p.60)

> k=ceil(ε^−1/2), kp는 0이 아닌 정수, (7.3)-(7.8)의 Φ,nΦ,K,AΦ,B를 생성한다. 합격: nΦ·tm=0과 nonzero denominators
> 를 검사한다. 1≤ εk²≤4 및 frame determinant lower bound를 인증된 영역에서 만족한다.

### N5-05 — 성장·감쇠 ODE 풀이 (p.60)

> (7.13),(7.17)의 projected ODE를 풀고 P(v)=exp∫( λ−dref)를 log envelope로 저장한다. 합격: (7.22)의 amplitude
> energy balance, n Φ·tm 제약, midpoint normalization과 양 끝 Gaussian bound를 검사한다. underflow를 pulse가 정
> 확히 0인 것으로 처리하지 않는다.

### N5-06 — 두 family의 positive covariance (p.60)

> (7.27)의 angular 1/2 및 Haar Jacobian을 포함해 Hcov를 적분하고 y=Hcov^ −1T0,*를 푼다. 합격: y±>0, det lower
> bound, C(W0)=εT0,* 및 global (7.30)을 확인한다. 같은 slow box를 ±로 두 번 합산하지 않는다.


## 3. N4-03: 고정 n=1의 합격 인증

### 3.1 실제 source와 연산자 연결

선택한 소스는 `same-profile-2026-10-10.3`이며 parameter graph SHA-256은 `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`이다. 실제 A.21 압력, nonlinear leading fixed point의 Bρ norm, 실제 B.26 activation과 최종 C·t1을 그대로 사용한다. h, j0, λ, t1, strip width를 0으로 대체하지 않는다.

(5.7)의 원래 미지수에 정확한 대각 변환

\[
D_C=\operatorname{diag}(C^{-1},1,1,1,C^{-1},1),\qquad
W=D_C(\phi_1,U_1,K_1,\Pi_1,\partial_\xi\phi_1,\partial_\xi U_1)^T
\]

을 적용한다. 즉 첫 성분은 F1=φ1/C이다. 두 행렬은 D_C A D_C^-1이며 singular diagonal `(0,0,2,0,3,1)`과 영 axis datum은 그대로다. 독립 Python Laurent 대수는 원래 문자열 행렬의 72개 원소를 모두 변환하여 새 정규화 행렬과 항등적으로 비교한다. 보통 크기의 점 여러 개에서 같다는 수치 검사를 항등식 증명으로 쓰지 않는다.

n=1에는 i,j≥1, i+j=1인 convolution 항이 없다. 그러나 n−1의 두 axial-viscosity source와 Ω0/(2X)는 남는다. 새 forcing의 비영 성분은

\[
f_4=-\xi\,\Omega_0/X,\quad f_5=-2Z_{-A-1/2-D}Z_{-A-1/2}F_0,
\]
\[
f_6=-2Z_{-A-D}Z_{-A}U_0+2\eta X(\Omega_0/X)/L.
\]

pressure source를 마지막 성분에서 없애거나 C 변환 한 항을 누락하는 독립 음성 대조군은 실패한다. 실제 754-node coefficient recurrence도 실행하여 양의 차수 영 datum과 radial degree 2의 소스 연결을 기록한다. 이 유한 jet를 전체 leading 함수로 바꾸어 사용하지 않는다.

### 3.2 원래 공통 collar와 source-derived C1

원래 공통 끝점은

\[
a^2=X_a e^{t_1/16},\qquad X_a=4/\Lambda,
\]

이다. cutoff ordering은 t1>0과 exp의 단조성으로 검사한다.

\[
X_a e^{t_1/128}<X_a e^{t_1/64}<X_a e^{t_1/32}
<a^2<X_a e^{t_1/8}.
\]

마지막 점은 원래 modulation의 시작이다. 따라서 첫 activation의 일부를 실제로 포함하면서 그 이후의 loop를 만나지 않는다. 정밀도나 계산 비용 때문에 반경을 작게 바꾸지 않았다. 작은 양의 반경 관측을 위한 별도 Cauchy disc는 공통 풀이 구간의 변경이 아니다.

기존 `ACTUAL_BACKGROUND_KO.md` §§1–3의 실제 함수 유도를 사용한다.

\[
\delta=\frac{\rho}{1024Q},\quad B=\frac{4096\Lambda^2Q^3}{t_1},
\quad C_1=\frac{2^{18}B^2}{\delta^2}.
\]

실제 Φ의 실수 하계와 전 η Bρ norm으로 선택한 tube에서 |Φ|≥63/256>1/8이다. 실제 activation의 logarithmic slope, reconstructed V0/X, Ω0/X 및 두 axial-viscosity source의 연속 영역 상계를 사용한다. 유한 η 표나 η=0 관측을 전 η bound로 승격하지 않는다.

source strip, solution strip, Cauchy loss는 각각 δ/4, δ/8, Δ=δ/8이다. 두 행렬의 최대 행합은 512B/δ, forcing의 최대 성분은 65536B²/δ²이다. B≥1, 0<δ≤1에서 C1은 두 번의 각 norm을 충분히 상계한다. 새 exact checker는 이 정수 계수와 strip 차이를 검사하며, 실제 함수 상계의 근거는 byte-pinned 해석적 문서에 남긴다. JSON 일치만으로 그 해석적 정리를 새로 증명했다고 하지 않는다.

### 3.3 유한 K 식과 tail 증명

A=C1 a, p=ceil(k/2), r=k+1라 놓는다. 원래 A1의 image는 마지막 두 좌표 안에 있고 그 공간을 annihilate한다. 대각 Green kernel과 η 미분은 이 block을 유지하므로 인접한 두 derivative factor는 사라진다. 따라서 길이 k의 연산에서 η 미분은 최대 ceil(k/2)번이다.

\[
B_k=\frac{A^{k+1}}{(k+1)!}\max(1,p/\Delta)^p.
\]

k≥1, 0<Δ≤1에서 p≤r/2이고 x↦x log(x/Δ)가 x≥1에서 증가한다. r!≥(r/3)^r를 적용하면

\[
B_k\le\left(\frac{3A}{\sqrt{2\Delta(k+1)}}\right)^{k+1}.
\]

요청 b에 대해 다음 **정확한 유한 정수 표현**을 선택한다.

\[
K=\max\{1,\lceil72A^2/\Delta\rceil,\lceil b/2\rceil\}.
\]

k≥K에서는 괄호가 1/4 이하이므로

\[
\left\|\sum_{k\ge K}\mathcal K^kGf_1\right\|
\le\sum_{k\ge K}4^{-k-1}=4^{-K}/3\le2^{-b}.
\]

따라서 partial sum 0≤k<K의 tail bound가 있다. 이 논증은 A가 작다는 가정을 쓰지 않는다. K를 십진수로 전개하지 않았거나 K개의 항을 수치 합산하지 않았다는 사실은 이 부등식의 유효성을 없애지 않는다. 동시에 그것을 **K항 수치 풀이를 실행했다는 주장으로 바꾸는 것도 허용하지 않는다**. `truncationActuallyEvaluated`, `numericalKTermSumExecuted`는 false로 검증한다.

원문 N4-03의 개별 합격 문구와 p.81의 고정 n 문맥에는 전체 n≥1 배열이나 이 거대한 K항 전부의 수치 합산을 완료하라는 추가 조건이 없다. 실제 소스의 함수 정의, 연산자, C1·strip·common collar·tail을 연결한 위 인증은 고정 n=1의 유한 항목을 닫는다. 임의 점의 고정밀 field sampler, n=2 source, 전역 모멘트 또는 전체 N4 패키지가 닫혔다는 뜻은 아니다.

### 3.4 실제 관측과 검증 결과

새 증빙에는 실제 axis derivative의 정규화 구간 3개와, 정확히 양의 반경 다섯 곳의 세 성분 difference quotient 구간 15개가 들어 있다. 실제 A.21 압력의 구간 오차와 해석적 remainder를 유지한다. 반경을 binary64의 0으로 바꾸지 않고, 비정규화한 거대/미소 field를 화면의 유한 수와 혼동하지 않는다. precision parameter를 바꾸면 이 관측점도 달라지므로 N4-05의 같은 점 정밀도 refinement라고 부르지 않는다.

검증은 다음과 같다.

| 검증 | 실행 결과 | 확인한 내용 |
| --- | ---: | --- |
| 전용 Node test | 8/8 | 원문·source bytes, 실제 연산/jet/관측, 독립 반경·정밀도 구분, 위조 입력과 완료 주장 거부 |
| 독립 Python exact checks | 782/782 | Laurent matrix/forcing identities, Green inverse, sparse derivative block, Fraction norm/tail/관측 계산 |
| 공개 인증 규칙 | 15/15 | source-bound n=1 certificate의 일관성 및 미실행·패키지 주장 차단 |

독립 검사에는 실제 소스의 바이트·실제 관측과, 일반 부등식의 보통 크기 arithmetic control이 구분되어 있다. 보통 크기 A와 Δ로 하는 검사는 실제 enormous parameter의 대체 모델이 아니다. 모든 k에 대한 부등식은 위의 해석적 증명이며, 유한 검사 개수를 무한 정리의 기계 검증 수로 세지 않는다.

실행 명령은 다음과 같다.

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-picard-acceptance.test.mjs
python research-ide/mathscope-m2/navier/tests/actual-picard-acceptance-independent.py
```

증빙은 `navier/evidence/actual-picard-acceptance.json`에 있으며 코드·테스트의 바이트 수와 SHA-256도 기록한다.

## 4. N5의 Imean restriction은 완성 배경과 같은가?

**그렇다. 이는 n=0 대체 배경을 허용하자는 해석이 아니다.** 원전 p.52 (5.18), p.60 (5.44), p.61 Step 2를 직접 다시 확인했다.

Lemma 5.2의 positive-order inner cutoff와 Ipos 보정 지지는 Imean의 왼쪽에 있다. 첫 total moment가 정확히 복구되면 radial primitive도 Imean에서 0이므로, 모든 n≥1의 En, Un, Fn, Vn은 이 패치에서 정확히 사라진다. Proposition 5.5의 cutoff 후 radial 성분에는 χVn뿐 아니라 χ′Fn도 있지만, 두 항 모두 여기서 0이다. 따라서 원문의 완성 velocity uB는 Imean에서 leading velocity u(0)와 정확히 같다.

이는 accepted source와 그 원래 recipe의 support·moment identity에 의해 정해지는 restriction이다. 다른 영역의 고차 계수를 수치로 아직 생성하지 않아도, 이 국소 velocity의 값은 그 미지 값에 의존하지 않는다. 원래 construction의 존재·support 결론을 적용하면서 전역 runtime이 실행됐다고 표시하지 않는 것은 p.5의 완료 수준 분리와 일치한다.

Imean에서 실제 cumulative axial moment는 M=η m*이며 m*>0이다. 따라서 V0=−m*이고 ur=−m*/r이다. M을 0으로 놓거나 방사 속도를 삭제하지 않는다. **압력과 stress는 이 zero 목록에 없다.** 실제 Ω0=−m*²/(2X)이므로 이 영역에도 Π1,X=m*²/(4X²)>0이 남는다. 국소 속도가 정확하다는 사실로 N4-04의 pressure moment나 N5-06의 heat-prepared stress를 대신할 수 없다.

## 5. N5-04의 진짜 개별 유한 조건

원문은 인증된 영역에서 원래 Φ,nΦ,K,AΦ,B, 영 normal component, nonzero denominators, frequency inequality, frame determinant bound를 요구한다. 전체 annulus의 공통 q*와 모든 slow derivative bound는 전체 Lemma 7.1 및 N5 패키지에 필요하지만, 개별 기준의 인증 영역을 자동으로 전체 annulus로 바꿀 근거는 없다.

실제 Imean의 고정된 대표점과 명시된 slow neighborhood를 인증 영역으로 삼으려면 다음 전부가 필요하다.

1. (5.18),(5.44),(5.45)의 exact restriction과 같은 source parameter를 사용한다.
2. k=ceil(ε^-1/2), 원래 nonzero nearest-integer kp를 고정한 뒤 미분한다. 거대한 정수를 정확한 식으로 표시하면 integer evaluation 미실행도 함께 표시한다.
3. 원래 (7.3),(7.4)의 phase와 normal을 생성한다. 원래 (7.6)의 K 및 moving-normal 항을 포함한 AΦ를 사용한다.
4. (7.7),(7.8)의 실제 moving frame와 left inverse를 생성하며 v 미분에서 B′를 누락하지 않는다.
5. 인증 영역 전체의 nonzero denominator 하계와 determinant 하계를 source-derived bound에 연결한다. 점의 정상적인 값만으로 전체 영역을 인증하지 않는다.

독립 대수 근거는 다음과 같다. Ka=n_tan/|n_tan|, Na=(Ka,z,−Ka,theta), sa=nr/|n_tan|라 놓으면 U=[er−sa Ka,Na]이고 n·U=0이다. J의 두 번째 행은 (c0 sqrt(1+sref²),−c0 sqrt(1+sref²))이다. 따라서

\[
\det J=-2c_0\sqrt{1+s_{\rm ref}^2},\quad
\det(B^TB)=4c_0^2(1+s_{\rm ref}^2)(1+s_a^2).
\]

|c0|≥M^-1이면 det(BᵀB)≥4M^-2이다. B는 3×2이므로 이 Gram determinant와 2×2 J determinant를 구분해야 한다. 또한

\[
A_\Phi=-K+\frac{n(n^TK-(n')^T)}{|n|^2}
\]

가 있어야 d(n·t)/dv=0이 유지된다. ε∈(0,1]과 원래 ceiling rule에서 1≤εk²≤4가 따라온다.

새 `actual-pulse-amplitude-phase.mjs`의 현재 식은 Imean의 RFR=−(2+2λ)F, GR=0을 쓰므로 원래 K의 (2,1) 성분이 −2λF가 되는 것이 맞다. Φ/n/AΦ/U/J/B/B′/Bleft 생성과 위 frame algebra는 같은 원래 식이다. 이 식 검토만으로 실행되지 않은 새로운 전용 interval/test를 대신하지 않는다. 최종 N5-04 판정은 해당 구현 담당의 실제 source-bound domain/오차/negative-control 증빙과 함께 해야 한다.

## 6. N5-05의 실제 amplitude와 reference 구분

개별 finite pulse test가 반드시 전체 annulus, 모든 harmonic, 모든 slow derivative를 완성해야 하는 것은 아니다. 하지만 실제 원래 projected ODE를 푼 검증 구간, 원래 datum, energy/transversality, midpoint envelope와 두 끝 Gaussian bound는 반드시 있어야 한다. reference envelope P만 그린 결과나 임의 가운데 unit datum을 쓴 궤적은 부족하다.

원래 normalization은 P(Ls/2)=1이다. 실제 t(Ls/2)를 unit vector로 정하라는 조건이 아니다. homogeneous datum은 z+(0)=P(0), z−(0)=0이고, 강제 source의 zero-datum inverse와도 다르다.

실제 Imean의 η=0 대표점에서 새 2차원 환원은 원래 3차원 projector에서 직접 유도된다. a=1/2+v/Ls, aTilde=1/2+(1+θ)(a−1/2), t=sqrt(1+qAngular²), D=aTilde²+(t/u*)², G=lambda0 Ls/u*라 하면

\[
x_a=-D_aD^{-1}x+GtD^{-1}\bar y-GD(1+u_*^{-2})^{-3/2}x,
\]
\[
\bar y_a=Gt^{-1}x-GD(1+u_*^{-2})^{-3/2}\bar y.
\]

−D_a/D의 두 normal 기여 중 하나는 moving-normal 항에서 나온다. 이를 삭제하면 원래 방정식이 아니다. 공통 damping을 제거하면 (D Y_a)_a=G²Y이고, dξ/da=D^-1/2, V=D^1/4Y에서

\[
V_{\xi\xi}=(G^2+H)V,\qquad
H=\frac{(1+\theta)^2}{4}\left(1+\frac{(t/u_*)^2}{D}\right).
\]

이 환원은 독립적으로 대조했고 부호와 원래 left datum이 일치한다. 실제 H의 cellwise 상하계에 positive Volterra comparison을 적용하는 경로는 원래 ODE를 유지하면서 거대한 exp(Gξ)를 log/scaled 변수로 다루는 실행 가능한 방법이다. 실제 G times phase mismatch까지 상계해야 하며, 작은 θ만 검사하고 Gθ를 버리면 안 된다.

새 integrator의 완료 여부는 그 code와 독립 solution/energy/whole-interval Gaussian 검증으로 판단한다. 실제 국소 homogeneous pulse가 검증되어도 prescribed nonzero-forcing inverse 전체, 모든 slow derivative Gaussian estimate와 전체 N5 패키지가 자동으로 완료되지는 않는다.

## 7. 다른 세 기준에서 실제로 남는 조건

| 항목 | 원문 유한 합격에 필요한 최소 내용 | 불필요하게 추가하면 안 되는 요구 | 현재 단순한 주장으로 메울 수 없는 부분 |
| --- | --- | --- | --- |
| N4-04 | 지원하는 차수에서 실제 cutoff·재구성 후 다섯 total moments를 정확히 취소하고, 다음 차수 guard 및 두 support case를 검사 | 모든 무한 차수의 scalar 값을 십진수로 먼저 계산 | 실제 source 전체의 Ω weighted moment, actual incoming debt 및 보정 후 Vn/Πn이 필요하다. 닫힌 convergent integral/root producer와 검증된 algebraic cancellation은 가능하지만 이름만 있는 debt oracle은 불충분하다. |
| N4-05 | 실제 지원 coefficient tuple로 Fslow=R+divT를 직접 구하고, N·정밀도·격자 변화를 분리하며 계산된 CN,m/Km와 비교 | 전칭 모든 derivative/모든 Borel cutoff를 한꺼번에 완료 | 실제 같은 관측점의 잔차와 명시적 상수가 필요하다. symbolic order tag, 움직이는 tiny point, toy polynomial residual을 actual decay로 표시할 수 없다. |
| N5-06 | 실제 두 pulse의 angular 1/2/Haar 적분, actual T0,* target, positive inverse와 det, local covariance 및 **global (7.30)** 조립 | 아직 M3인 모든 nonlinear correction stage까지 먼저 완료 | 이 항목의 global은 원문에 명시되어 있다. Imean의 속도만으로 heat-prepared cumulative stress가 정해지는 것은 아니며, same box ± 중복 합산이나 local covariance 하나를 global identity로 대체할 수 없다. |

N4-04의 수가 매우 크다는 사실 자체는 미정의의 근거가 아니다. 실제 함수의 convergent expression DAG, source-derived tail 및 근의 고립/존재·유일성으로 실제 값의 interval producer를 닫을 수 있다면 그 exact functional computation을 사용할 수 있다. 다만 실제 함수 의존을 제거하거나 초기 point evaluator의 η≤2 관측을 모든 필요한 parameter derivatives로 확대할 수 없다.

N5-06의 stress를 후방 적분으로 재구성하는 것은 원래 total moment와 exact heat exterior가 연결되어 있다면 조사할 수 있다. 그러나 natural core의 g(η)는 j0 shift 때문에 단순 even 함수가 아니다. 실제 최종 outer recipe에서 반사 대칭이 복원되는지 확인하지 않은 채 η=0의 axial stress를 0으로 설정해서는 안 된다.

## 8. 이번 재심사의 완료 상태

- **N4-03:** 위 새 증빙으로 실제 n=1 개별 유한 조건 PASS를 권고한다. 공개 새 certificate도 같은 범위로 PASS를 반환한다.
- **N5-04:** 아래 §10의 최종 새 phase certificate가 원래 exact Imean restriction과 명시된 인증 neighborhood에서 연결되었으므로 해당 개별 finite PASS를 승인한다. 전체 annulus는 이 판정에 포함되지 않는다.
- **N5-05:** 아래 §10의 실제 homogeneous m=1 ODE가 전체 pulse 구간에서 검증되었으므로 해당 finite PASS를 승인한다. 일반 nonzero-source inverse와 모든 slow derivative를 완료했다는 판정은 아니다.
- **N4-04, N4-05, N5-06:** 각각 actual moment closure, 실제 residual refinement, global actual covariance라는 명시적 남은 조건을 다른 항목의 성공으로 대체하지 않는다.

전체 M2 패키지와 전칭 수학 정리의 상태는 이번 개별 N4-03 판정으로 바뀌지 않는다.

## 9. 새 N4-03 산출물의 SHA-256

| 파일 | SHA-256 |
| --- | --- |
| `navier/actual-picard-acceptance.mjs` | `d7a14594d22a91f50e64adbca147288ea8ffda32d5693d0116ca3aeacf7a319f` |
| `navier/tests/actual-picard-acceptance.test.mjs` | `3c1461be18e09b5833ffd3b23ab4503be76692ed72825bae809f75a83f00012b` |
| `navier/tests/actual-picard-acceptance-independent.py` | `4d3afd067ff1ba750922607bbcc5796c6acc7a9192300d5ff2874e3aaf9c45a4` |
| `navier/evidence/actual-picard-acceptance.json` | `f0943ba02bcd8f5d351374eeaf2287291f78cc409a07fd3f166380a19ec26b91` |


## 10. 새 N5-04/05 최종 독립 수학 검토

최종 수학 검토에서는 다음 파일을 읽었다. 구현 담당은 아래 버전에서 Node 13/13과 독립 Fraction/Decimal 618/618의 최종 통과를 보고했다. 본 검토자는 같은 테스트를 불필요하게 반복하지 않고, 방정식·부호·영역·오차 유도를 원문과 별도로 대조했다.

| 파일 | 검토 SHA-256 |
| --- | --- |
| `actual-pulse-amplitude-phase.mjs` | `0ed21e490d93a59caa578d91a4dd3df3791a0e9a07a845740a15cd7578c98224` |
| `actual-pulse-amplitude-integrator.mjs` | `096eea803e7c17481c4926b4a8b811ddf54ddc4df615253477092780c3d1b60d` |
| `research/ACTUAL_PULSE_AMPLITUDE.md` | `5cca51ec0a86fca53ede24756f50487a41419d1ae4ad2eb06206bf5de1510042` |

### 인증 영역과 시간 좌표

생성된 함수식은 Imean의 원래 slow-coordinate image에서 정의된다. 실제 operator lower bound를 인증하는 영역은 y∈[1/4,19/4]의 고정된 η=0,s=1 대표점, 그 주위 slow distance≤4S*^-3인 neighborhood와 전체 0≤v≤Ls의 곱이다. 코드의 `generatedFunctionDomain`과 `certifiedOperatorDomain`이 이를 구분하며, `operatorCertificates.appliesTo`가 후자를 지정한다. 큰 함수 생성 영역을 작은 neighborhood의 C/S* 증거로 인증하지 않는다.

시간 변수는 Tc=τ/Q, τ=−t이다. 따라서 t*=∂v−ε∂Tc이고 실제 phase defect의 첫 항은 +εvpF_Tc이다. 이를 physical t 미분의 부호로 오인하지 않도록 metadata에 명시했다.

### 전달행렬과 실제 amplitude 복원

상수 H에 대한 scaled 전달행렬은 실제 [V,Vξ/G] 시스템의 exponential에서 exp(G Δξ)를 정확히 제거한 식이다. H≥0과 양의 두 초기 성분에서 positive Volterra comparison을 쓰므로, 각 cell의 H infimum/supremum으로 variable-H 해를 둘러쌀 수 있다. 이것은 step size를 줄여 값이 비슷해졌다는 경험적 오차 추정이 아니다.

초기 두 번째 scaled 성분

\[
\sqrt{D_0}/(t\sqrt{D_{ref,0}})+D_a(0)/(4\sqrt{D_0}G)
\]

은 원래 source의 J(0)(P(0),0) datum에서 나온다. phase factor의 log 오차는 작은 θ 자체가 아니라 G배 적분차로 인증한다. source bound k^-1≤M^-300 S*^-10을 적용하여 이를 2^-1000보다 작게 만든다. unknown u^-1와 reference damping을 0으로 대체하지 않는다.

physical tangential component의 두 normalization은 tθ/(sqrt(λ)uP), tz/(uP)이다. qAngular/sqrt(λ)와 qAngular*sqrt(λ)는 서로 다른 수이며 같은 작은 enclosing interval을 쓸 뿐이다. 원래 pressure의 normal cancellation과 energy identity의 scaling도 확인했다. log|t|/G에 들어가는 log(u)/G는 M^4/S*로 별도로 상계한다. u^-1<2^-1000의 증명은 약한 M≥2^50가 아니라 실제 Renv=exp(C^25600000) 정의를 사용한다.

whole-interval Gaussian 증거는 연속 cooperative system의 최솟값/최댓값 비교, 실제 reconstruction prefactor, reference log의 음의 2차 도함수로 구성된다. 균등 v 관측 행의 sample maximum으로 연속 Gaussian을 주장하지 않는다. 실제 pulse의 covariance 폭은 약 G^-1/2이므로 이 균등 행을 단순 합산하여 Haar covariance를 얻었다고 표시해서도 안 된다.

### (7.13)의 sourced inverse와 homogeneous acceptance

원문의 Proposition 7.2에서 (7.13)은 zero-datum sourced inverse다. 반면 N5-05가 명시적으로 검사하는 (7.22)의 energy는 원전에서 homogeneous t=tσ^h에 관한 항등식이다. Lemma 7.4는 m=1의 원래 growing datum을 지정하고, homogeneous pressure는 (7.13)의 f=0 식을 쓰도록 한다. (7.17)은 같은 actual moving frame에서 g=0으로 제한된다.

따라서 선언한 finite homogeneous case를 인증하기 위해 임의 모든 m/f의 sourced inverse 실행까지 새 합격 조건으로 추가할 필요는 없다. 최종 모듈은 `initial.problem=HOMOGENEOUS_M1_GROWING_SOLUTION`, `zeroDatumSourcedInverse=false`, `generalForcingInverseComplete=false`를 유지한다. 이 명시된 실제 사례의 N5-04/05 개별 PASS에는 동의한다. 전체 Section 7, global covariance, 모든 slow derivative, full physical residual, 새 Lean proof는 여전히 별도다.
