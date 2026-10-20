# 원본 PDF 기준 감사 — 8개 원래 의무

이 문서는 원래 기준과 원전 위치를 확인하는 감사 메모다. 구현·증거의 충족 여부를 판정하거나 ID를 닫지 않는다. 원문에 없는 요구를 추가하지 않는다. 세 PDF를 직접 읽었으며 filename만으로 title을 추정하지 않았다.

## 원본 동일성

| 원본 | 페이지 수 | SHA-256 | 업로드 인덱스 일치 |
|---|---:|---|---|
| MathScope_M2_M3_M4_Handoff_2026-10-12_KO(8).pdf | 16 | `0c9bdd670d9dbd411b34bb17dcb20efac79aaefa071be877b518967919df37f1` | byte size 및 SHA-256 모두 일치 |
| MathScope_Research_IDE_Blueprint_v1_KO(1)(20261017-114129).pdf | 99 | `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac` | byte size 및 SHA-256 모두 일치 |
| navier-stokes(20261017-114135).pdf | 166 | `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f` | byte size 및 SHA-256 모두 일치 |

Library로 확보한 세 원본의 원격 bytes와 업로드 FILE_INDEX에 기재된 원본 bytes의 동일성은 이번에 확인됐다. 이 확인은 인덱스에 남았던 세 PDF의 remote-byte identity unverified 제한을 해소한다. PDF 조회는 읽기 전용이었다.

## 원래 체크리스트 원문

아래는 Blueprint의 해당 항목 전문이다. 페이지는 파일 내 실제 1-based PDF 페이지다. 각 체크리스트의 공통 머리말은 산출물·합격 로그 확보 후 체크하고 담당자·검증일·증빙 hash를 ResearchSession에 기록하도록 한다.

### N6-01 — 초기 finite state 구성 (Blueprint p62)

□ N6-01 | 초기 finite state 구성
primary curls 뒤 temporal mean update와 다섯 moment correction을 수행하여 j=0 상태를 만든다. 합격: Proposition9.5
의 B0=0.7,C0*=1.2와 (9.9),(9.10) 명세를 충족한다. 명세의 상수 없이 경험적 power slope만으로 인증하지 않는다.

논문 연결: Definitions 6.4–6.5 (6.24)–(6.29), Definition 9.4 (9.7)–(9.10), Proposition 9.5; 실제 PDF pages 69, 70, 100, 101, 106, 107.

### N6-02 — 전체 residual 재계산 (Blueprint p62)

□ N6-02 | 전체 residual 재계산
R(u+δu,p+δp)=R(u,p)+Lu(δu,δp)+div(δu⊗δu)를 사용하며 매 substep 후 최신 압력을 복원한다. 합격: 독립 직접 PDE
평가와 decomposed residual이 오차 예산 내 일치한다. 기존 flat tail와 새 quadratic remainder를 장부에서 누락하지 않
는다.

논문 연결: Residual difference identity p59, Refresh order p100, Proposition 9.3 (9.3)–(9.6), exact increment identity p105, Proposition 9.6 ordered correction cycle pp107–111; 실제 PDF pages 59, 100, 103, 104, 105, 107, 108, 109, 110, 111.

### N6-07 — 고정 도메인과 차수 향상 (Blueprint p62)

□ N6-07 | 고정 도메인과 차수 향상
σj=1/5+j/10, gj=hj/10 및 (9.17),(9.18)의 Km,ℓm,log powers를 추적한다. 합격: 모든 finite stage가 같은 q<qbig 도메
인을 사용한다. 단 한 번의 step에서 샘플 잔차가 늘면 정밀도/범위/상수부터 조사하고 차수 theorem과 혼동하지 않는다.

논문 연결: Definition 9.4 (9.8), Lemma 9.7 common domain, Lemma 9.8 (9.17)–(9.19); 실제 PDF pages 106, 111, 112, 113, 114.

### N6-08 — 최종 local 합성 (Blueprint p62)

□ N6-08 | 최종 local 합성
(9.21)에서 Aj,Bj,pj에 shrinking cutoff를 적용하고 curl하여 local field를 만든다. finite residual의 flat terms를 무조건 합
산하지 않는다. 합격: Lemma5.4의 tail 비교로 (9.20)을 연결한다. 평가 구간의 active indices와 생략 tail의 bound를 저장
하고 없으면 finite-stage approximation으로 제한한다.
패키지 판정:

논문 연결: Lemma 5.4 (5.28)–(5.39), (9.15)–(9.18), Proposition 9.9 (9.20)–(9.21); 실제 PDF pages 57, 58, 59, 112, 113, 114, 115, 116.

### N7-04 — Terminal force jets (Blueprint p64)

□ N7-04 | Terminal force jets
Fj(x)=lim(t↑1)∂t^j f(x,t), ∂x^ αFj(0)=0을 (10.6)-(10.10)에 맞춰 구축한다. 합격: 유한 jet order M의 수치 근사와 ∀order
smooth-extension 정리의 의존성을 분리한다. 몇 개 finite differences가 작다는 이유로 C∞ force라 표시하지 않는다.

논문 연결: Lemma 10.2 (10.6)–(10.10); 실제 PDF pages 118, 119, 120.

### N7-05 — t>1 force extension (Blueprint p64)

□ N7-05 | t>1 force extension
(10.11)의 Σχ0(bjσ)σ^jFj/j!, σ=t−1≥0를 사용하며 (10.12)의 differentiated tail constraints로 bj를 선택한다. 합격:
force는 t≤2에서 compact support를 갖고 모든 인증된 jets가 접합된다. 이는 velocity를 t=1 이후 smooth하게 연장하는
알고리즘이 아니다.

논문 연결: Lemma 10.3 (10.11)–(10.12); 실제 PDF pages 120.

### N7-06 — 전역 에너지 balance (Blueprint p64)

□ N7-06 | 전역 에너지 balance
d(∥u∥²₂/2)/dt+ν∥∇u∥²₂=⟨f,u⟩를 전체 K에서 적분한다. core만의 에너지와 구분한다. 합격: 정규화 energy defect가
독립 space/time refinement에서 감소한다. ν=1에서 (10.13)의 ∥u(t)∥² ₂+2∫∥∇u∥²₂≤(∫∥f∥₂)² 상계와 모순 없어야
한다.

논문 연결: Lemma 10.4 (10.13)–(10.14); 실제 PDF pages 121.

### N8-05 — 공간·급수·정밀도 적응 (Blueprint p66)

□ N8-05 | 공간·급수·정밀도 적응
core radius, axial length, pulse wavelength, active cutoff orders를 함께 해결한다. 각 refinement 축을 독립 증가시킨
다. 합격: 2배 grid, Fourier cutoff, coefficient order, arithmetic precision 비교표와 별도 tail bound를 저장한다. 예산
초과 시 last-resolved τ와 원인을 표시한다.

논문 연결: N8 package references on Blueprint p65; no one-to-one standalone paper checklist; 실제 PDF pages 4, 5, 6, 7, 8, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 81, 82, 83, 84, 85, 86, 87, 113, 121. 이 범위는 Blueprint p65가 지정한 N8 패키지 전체의 원전 범위이며, 이 감사에서 해당 범위의 모든 페이지를 독립 검증했다는 뜻은 아니다. N8-05의 구체적인 2배 비교표와 last-resolved τ 요건은 Blueprint p66의 명시적 기준이다.

## 수학적 범위와 상수 — 원전 해석 메모

아래는 원래 항목이 인용하는 명세를 읽어 풀어 쓴 것이다. 추가 인수 조건이나 새 ID를 만들지 않는다.

### N6-01: 초기 상태의 정확한 의미

논문 p106 Definition 9.4 및 Proposition 9.5는 고정 base와 primary potentials의 curls에서 시작하여 temporal mean update (8.20), five-equation correction (8.25)를 수행하고 각 update 전후 (8.12)로 pressure를 복원한 상태를 요구한다. B₀=0.7, C₀*=1.2는 다음 normalized residual class 지수다.

- G_wave^[j] ∈ W_{B_j}; E_θ,E_z ∈ M_{C_j*}; (P,J_θ,J_z) ∈ S_{C_j*}.
- B_j=1/2+σ_j, C_j*=1+σ_j, σ_j=1/5+j/10. 따라서 j=0에서 0.7 및 1.2이다.
- (9.9): w∈W_{1/2}, w−w₀^tan∈W_{0.68}, v,γ,p_m∈M_{0.9}, β∈M_{1.9}.
- (9.10): ∫₀∞R²⟨v⟩_Y dR=0 및 ∫₀∞R⟨γ⟩_Y dR=0를 정확히 유지한다.
- pressure reconstruction은 상태의 일부다. radial residual은 −ρP와 Proposition 8.3의 flat cutoff remainder다.

논문 pp69–70 Definitions 6.4–6.5는 W/M/S를 every fixed amplitude derivative order의 weighted class로 정의한다. M은 ε^α S_*^b ζ δ^{-d}, W는 ε^α S_*^b √ζ δ^{-d}P_v, S는 ε^α S_*^b 형태를 갖고 support/zero-extension/common-torus 계약도 포함한다. 논문 pp100–101에 따르면 지수는 ε=Q^h의 지수이며, constants·S_* powers·inverse-distance powers는 고정 stage와 amplitude derivative order에 의존할 수 있으나 band·label·copy·point에는 uniform하다. physical velocity/pressure/residual rescaling은 각각 Q^{-A}, Q^{-2A}, Q^{-2A-1/2}이다. 그러므로 샘플 slope는 그 자체로 이 class 명세를 증명하지 않는다.

### N6-02: 실제 업데이트와 residual의 동일한 연결

논문 p100의 refresh 순서는 다음과 같다: full wave velocity로 W_ab=⟨w_aw_b⟩_θ를 구성하고 (8.3) 세 번째 행으로 g_r를 구함 → P=∫⟨g_r⟩_YdR 및 p_m=T₀(g_r−ρP) → 이 압력으로 (8.3) 첫째·둘째 행의 E_θ,E_z → 같은 velocity/radial source로 (8.15)의 J_θ,J_z. 모든 velocity 변경 뒤 이를 다시 적용한다. 실제 Δγ의 cutoff remainder도 곱을 평가하기 전에 포함한다.

논문 p105의 정확한 identity는 R(u+w,p+π)=R(u,p)+∂_tw−Δw+∇π+(u·∇)w+(w·∇)u+(w·∇)w다. old F는 additive하게 남고 모든 nonlinear product는 cutoff curl과 modified radial integral remainder를 포함한 actual fields를 사용한다. 새로운 flat 항을 F에 넣고, mean inverse가 실제로 소거한 항은 F에서 제거한다. nonzero-harmonic Gaussian cutoff tail은 additive residual에 보존하며 후속 forward pulse 입력에서 제외한다. paper p103–104의 (9.3)–(9.6)은 이 supported-source/flat-remainder 분해와 exact mean 연결을 규정한다.

논문 pp107–111 Proposition 9.6의 네 substep은 (i) 각 supported nonzero harmonic inverse, (ii) 고정 primary 주변 signed covariance로 auxiliary-averaged tangential residual 보정, (iii) zero-auxiliary-average temporal mean inverse, (iv) 현재 세 defects에 대한 five-equation correction이다. 각 correction 뒤 pressure를 복원하고 base·primary amplitudes·supports·inverse operators 및 (9.9),(9.10)을 유지한다. Blueprint p80은 같은 코드에서 f:=R로 정의한 뒤 R−f=0만 검사하는 방식으로 완성 판정을 내리는 것을 명시적으로 거부한다.

### N6-07: common domain과 physical derivative 비용

논문 pp111–112 Lemma 9.7의 q_big>0는 stage와 derivative order 모두와 독립이다. 모든 finite partial sum이 cutoff 합성 전 동일한 0<q<q_big에서 정의된다. fixed stage/output derivative에 필요한 input derivative 수는 유한하지만 stage별 constants는 달라도 된다.

논문 pp113–114 Lemma 9.8:

- (9.17): |Z_j|_m+|Δu_j|_m ≤ C_{j,m}q^{g_j−ℓ_m}(1+|log q|)^{P_{j,m}}, g_j=hj/10→∞.
- |(u^[j],p^[j])|_m ≤ C_{j,m}q^{-K_m}(1+|log q|)^{P_{j,m}}.
- (9.18): |R(u^[j],p^[j])|_m ≤ C_{j,m}q^{hσ_j−K_m}(1+|log q|)^{P_{j,m}}+E_{j,m}, E_{j,m}≤C_{j,m,N}q^N for every N.
- ℓ_m 및 K_m은 j와 독립이고 C_{j,m}, P_{j,m}은 j에 의존할 수 있다. 충분한 ℓ_m의 한 선택은 2A+(m+1)(1+3h/2)다.
- (9.19)의 physical losses는 radial 1/2+hκ_s, axial D=1/2−h, time 1+h, cylindrical frame 1/2이다. 추가 phase 비용을 포함한 s_x=1/2+h/2, s_t=1+3h/2를 사용한다.

### N6-08: cutoff 합성 및 finite-stage 비교

논문 p115 (9.21)은 A=A₀+Σχ(a_jq)A_j, Be_θ=B₀e_θ+Σχ(a_jq)B_j, p_loc=p₀+Σχ(a_jq)p_j, u_loc=curl A+Be_θ다. χ는 potential에 먼저 적용되므로 ∇χ×A가 curl에 포함된다. Lemma 5.4 (pp57–59)는 a_{j+1}≥2a_j, χ=1 on [0,1/2], χ=0 on [1,∞), 공통 domain·Cartesian/smooth-zero-extension 및 derivative-loss 명세를 사용한다.

(5.37)의 cutoff 선택은 Ĉ_{j,m}(1+|log q|)^{P̂_{j,m}}q^{g_j/2}≤2^{-j} (0<q≤a_j^{-1},0≤m≤j)이며, (5.35)의 finite-state tail은 |U−U^[J]|_m≤2^{-J}q^{g_{J+1}/2−ℓ'_m} (J≥max(1,m), 0<q<(2a_J)^{-1})다. (5.39)로 한 fixed J의 residual과 비교하여 (9.20)의 ∀m,N flatness를 얻는다. fixed-stage flat residual들을 직접 무한 합산하지 않는다. evaluation window에서 locally finite active cutoff terms가 유한하다는 사실과 formal background/correction asymptotic tail의 bound는 다른 계약이다. Blueprint pp79,81도 이 구별을 명시한다.

### N7-04 및 N7-05: all-order theorem과 유한 근사의 구별

논문 pp118–120 Lemma 10.2는 모든 spatial multi-index α 및 j≥0에 대해 ∂_x^α∂_t^j f의 R³ 전체 uniform limit, F_j∈C_c^∞(R³;R³), supp F_j⊂K, ∂_x^αF_j(0)=0 및 mixed derivative 호환성을 주장한다. (10.9)는 원점 근처에서 C_{α,j,N}(τ+|z|^{1/D})^N bound를 사용하고, (10.10)은 spatial/time limit 호환성을 적분식으로 연결한다.

논문 p120 Lemma 10.3는 σ=t−1≥0에서 Σχ₀(b_jσ)σ^jF_j/j!를 정의한다. b₀=1, j≥1의 b_j는 b>b_{j−1}인 증가 정수 중 max_{a,m≥0,a+m≤⌊j/2⌋} C_{j,m}b^{m−j}∥F_j∥_{C^a}≤2^{-j}를 만족하는 최소 정수다. 그러면 모든 fixed differentiated tail이 uniformly 수렴하고 σ=0에서 모든 mixed jets가 접합하며 supp f⊂K×[0,2]이다. finite jet M의 numerical 결과는 all-order source theorem 및 실제 evaluator와의 연결을 대체하지 않는다. 이 extension은 force에만 적용된다.

### N7-06: whole-support energy

논문 p121 Lemma 10.4는 ∥·∥_p=L^p(R³)로 정의하고, ν=1에서 F(t)=∫₀^t∥f(s)∥₂ds, ∥u(t)∥₂²+2∫₀^t∥∇u(s)∥₂²ds≤F(t)²를 t<1에서 준다. (10.14)의 energy identity는 고정 compact support의 전체 공간 적분이다. Blueprint p64의 independent space/time refinement와 normalized defect 감소는 실제 numeric integration의 기준이다. core-only energy는 이 양을 대체하지 않는다.

### N8-05: refinement 표와 별도 tail

Blueprint p66가 독립 증가시킬 네 축을 grid, Fourier cutoff, coefficient order, arithmetic precision으로 명시한다. core radius·axial length·pulse wavelength·active cutoff orders를 함께 resolve해야 하고, 예산 초과 시 last-resolved τ 및 원인을 표시한다. Blueprint p65 및 p82는 논문 재구성 algorithm A와 별도 periodic Galerkin comparator algorithm B의 경로를 구분한다. comparator의 자체 수렴만으로 같은 initial data/force/domain/error contract를 갖는 paper reconstruction을 인증하지 않는다. p81의 seven-series 표는 ordinary convergent series, formal series의 cutoff realization, auxiliary Fourier inverse, terminal jet cutoff extension의 각각 다른 tail 계약을 유지한다.

## 원래 경계와 인수 범위

- Handoff p1은 M2 기존 64 PASS와 source-bound 추가 관문 완료를 승계하되 이를 전체 NS 해법 또는 새 전역 Lean 해석학 증명으로 확대하지 않는다.
- Handoff p10은 M2의 E_B flatness와 전체 미보정 NS residual의 flatness가 다른 명제라고 명시하며 nonlinearAndCurlRemaindersRemainN6Inputs=true를 보존한다. N7은 N6의 같은 최종 구성에, reconstruction N8은 N2·N7에 의존한다.
- Blueprint p61의 N6 완료 관문은 현재 u,p로 재계산한 residual·moments·tail의 일관성 및 원문의 finite-state→local-field 연결이다. 유한 m,N 검사로 ∀m,N flatness를 대체하지 않는다.
- Blueprint p63의 N7 완료 관문은 모든 construction/global assumptions 충족 전 full-paper reconstruction이라는 이름을 사용하지 않고 unresolved constants/tails를 남기는 것이다. 공식 정리 검증과 actual numeric evaluator의 refinement proof 사이에는 별도 연결 theorem이 필요하다고 명시한다.
- N6-02의 deferral 해제 여부는 현재 사용자 지시의 영역이다. 원본 기준에는 deferral이나 기준 완화가 없다.

## 조회 기록

텍스트는 281개 전체 PDF 페이지에서 추출하여 source별·page별 파일로 저장했다. 직접 읽은 기준 핵심 페이지: Blueprint 1,61–66,79–82; Handoff 1,10; paper 1,55–59,68–70,100–116,118–121. 시각적으로 확인한 페이지: Blueprint 62,64,66; paper 106,113,120. 이는 원본 기준 확인이며 논문 전체의 수학적 참됨을 독립 증명했다는 주장이 아니다.
