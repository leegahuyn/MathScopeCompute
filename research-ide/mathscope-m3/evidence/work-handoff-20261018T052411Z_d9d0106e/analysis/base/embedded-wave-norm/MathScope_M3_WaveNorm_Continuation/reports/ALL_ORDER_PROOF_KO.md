# 파동 연결의 모든 고정 차수 논증과 전제

## 1. 명제의 범위

첨부한 166쪽 판본과 같은 원본의 초기 유한 상태를 사용한다. 고정 label γ, harmonic m 및 coefficient multi-index I에 대해 논한다. 0<q<qGlobalStar, b_(N+1)q≥1이며 이번 literal prefix는 N=1이다. 이 prefix를 모든 q에서 유효하다고 하지 않는다. atlas 호환성은 기존 소스 결과를 승계한다.

**전제:** 원래 고정 배경의 클래스, 같은 양의 primary 진폭과 homogeneous ODE/pressure 식, 모든 고정 차수의 primary·radial·mean 노름 생성기, 실제 curl/divergence 및 닫힌 지지 분리, 정규화/겹침 일치. 이 전제의 원본 ID와 해시는 SOURCE_BINDINGS 및 INPUT_LOCK에 연결한다. 다른 source의 상계 또는 임의 숫자 함수는 허용하지 않는다. 현재 잔차 자체의 W 노름을 입력 leaf로 넣지 않는다.

아래는 그 전제에서 얻는 정량 적용 논증이다. 0·1·2차 실행 결과에서 모든 차수의 참을 추론하지 않는다. 새 Lean 커널 증명도 아니다.

## 2. 선형 주항과 나머지

각 원래 cosine은 t/2의 ±1 conjugate pair를 갖는다. m≠0에서

C_m = i n×t_m / (k m |n|²), a_m=t_m+r_m,
r_m=(-Dz C_θ, Dz C_r−Dr C_z, (Dr+1/R)C_θ).

n·t=0으로부터 ikm n×C=t이고, 전체 curl은 정확히 divergence-free다. 모든 고정 I에 대해 t∈W_(1/2), C,π∈W_1, r∈W_(1−κ_s)를 기존 동일 소스 노름으로 소비한다. cutoff는 potential과 pressure에 먼저 곱한다.

(9.1)의 homogeneous principal operator는 cutoff 전 t,π에서 0이다. cutoff 후에는 +ψ′t가 남는다. 직접 (9.2)를 전개하여

L(a,π)=L_principal(r,0)+L_rem(a,π)+F_pulse

로 분리한다. L_rem에는 모든 느린 운반/phase/pressure/viscous/frame 항이 포함된다. `INDEPENDENT_ALGEBRA.json`은 임의 함수의 연산자 항등식 자체를 별도 SymPy 미분으로 검사한다. 실제 소스의 ODE 성립을 그 generic 검사로 대신하지 않는다.

실제 위상 H=pF+pzG에 대해

Eik=εv(H_T−G H_Z)+b n_r.

이는 Dr v=Dz v=0인 원래 고정 lifted chart에서의 식이다. 임의 mean 함수의 radial inverse와 느린 미분이 commute한다고 가정하지 않는다. 고정 계수 미분 차수를 늘리면 유한한 Leibniz 합만 증가하며 ε 지수 손실은 (9.2)에 실제로 존재하는 Dr 횟수만 부담한다. Proposition 9.1의 공통 안전 지수 W_(1−3κ_s)를 사용한다.

## 3. 정확 종방향 식과 모든 교차항

전체 a는 n에 수직일 필요가 없다. 실제 divergence 식은

ikm n·a = −[(Dr+1/R)a_r+Dz a_z].

따라서 같은 label의 두 harmonic에서

ikm′(a·n)a′ = −(m′/m)[(Dr+1/R)a_r+Dz a_z]a′.

이 치환은 항을 삭제하지 않고 빠른 k 손실을 없앤다. m=m′=±1에서는 m′/m=1이며 출력은 ±2다. 계수 미분, radial/axial 진폭 운반 및 원통 연결항을 모두 포함하면 W_(1−κ_s)를 얻는다. t+r를 두 인자 모두에 써서 t×t,t×r,r×t,r×r가 남는다.

m=−m′인 두 순서의 항은 각도 평균에 남고 기존 평균 경로에서 처리한다. 그 항을 비영 harmonic 목록에서 뺐다는 이유로 전체 잔차에서 없어진 것으로 취급하지 않는다. 닫힌 지지 분리로만 distinct-label 곱을 소거하며, 그 성질은 smooth zero extension의 도함수에도 유지된다.

전체 mean correction의 tangential 지수는 H0=1−κ_s, radial은 H0+1이다. mean–wave 대칭 운반에 Lemma 9.2를 적용하면 W_(1/2+H0−1/2)=W_H0이다. 실제 temporal γ에는 desired−A1 전체가 포함되어 있고, five γ의 특수 exactness를 앞선 γ에 확대하지 않는다.

그 결과 지지된 ±1 harmonic은 W_(1−3κ_s), ±2는 W_(1−κ_s), 전체 grouped supported wave는 W_(1−3κ_s)⊂W_(7/10)다.

## 4. 상수·로그·가중치를 유지한 실행식

|D^I G_(γ,m)| ≤ C_(γ,m,j) ε^α S_*^L √ζ δ^(−d) P(v), |I|≤j.

상수는 실제 부모 생성기의 `source_norm_result` 참조와 양의 rational/add/multiply/integer_power/sqrt 연산으로 구성한다. 계수 j차의 곱 상계는 Σ_(r=0)^j binom(j,r) C_r D_(j−r)를 사용한다. 어떤 미분 multi-index에서도 해당 분할 multiplicity의 합은 binom(j,r)이므로 모든 길이 j의 미분에 유효하다. 0≤ζ≤1, 0<P(v)≤1, 0<δ≤1, S_*≥1, 0<ε≤1을 사용한다.

고정 affine torus map의 Jacobian 행 노름은 (4+6^4(1+4Tg))S_ref≤32404S_ref다. higher affine derivatives는 0이다. S_label≤4S_ref와 slow chart derivative factor≤4를 보수적으로 포함한다. reference 잔차의 물리 배율은 ratio^(2A+1/2), |log_4 ratio|≤1이며 h<1/100과 현재 지수 범위에서 16으로 상계한다. 따라서 최종 변환에서 16·4^(j+L)를 적용한다. 중복 상계 인자는 삭제하지 않고 충분조건으로 남긴다. 한 label의 계수를 묶은 W 노름이므로 162개의 전체 합을 무조건 원래 한 coefficient의 크기라고 바꾸지 않는다.

이 실행 프로그램은 이번에 j≤2를 실행했고 실제 호출 그래프의 지원 차수에서 더 높은 요청을 거부한다. 모든 고정 차수의 논증은 같은 원본 생성기의 필요한 유한 차수 입력으로 일반화하는 구조이며, 이미 계산한 세 행의 단순 연장이 아니다.

## 5. Gaussian tail: 명시적인 flatness 변환

원본 Gaussian lower=g>0, Ls≥Lmin S_*에서 cutoff 변화 영역의 P(v)는 exp(−gLs/25)≤exp(−cS_*), c=gLmin/25다. 각 고정 물리 미분 상계를 C Q^(−M) S_*^P exp(−cS_*), Q=2^(−ℓ), S_*=ℓ²로 쓴다. 필요하면 P를 더 큰 음이 아닌 정수로 잡을 수 있다.

q≥Q/2이므로 q^(−N) times 이 상계는

C 2^N ℓ^(2P) exp(−cℓ²+(M+N)ℓ log 2).

−cℓ²의 절반씩을 나누고 log2≤1을 쓰면

−cℓ²/2+(M+N)ℓ ≤ (M+N)²/(2c),
ℓ^(2P) exp(−cℓ²/2) ≤ (2P/c)^P

를 얻는다. P=0의 인자는 1이다. 따라서

C_N = C·2^N·(2P/c)^P·exp((M+N)²/(2c))

라는 유한 상수로 모든 고정 N에서 ≤C_N q^N를 얻는다. 미분별 C,M,P를 구체적인 수치로 실현한 것은 아니며, 이 식만으로 최종 τ/precision 보장을 출력하지 않는다. Gaussian tail은 G의 W 인증에 숨기거나 0으로 삭제하지 않는다.

## 6. 공개 등급

원문의 정리 주장, 승계한 원본 증거, 이번 조건부 정량 적용, generic exact algebra fixture, 유한 차수 출력, DOM 화면 검사를 따로 저장한다. 어떤 테스트 성공도 전체 원문 증명이나 외력 없는 NS 해결로 확대하지 않는다. 논문의 표제/저자 표기는 첨부 판본의 식별 정보이며 이번에 공식 발표 상태를 새로 검증하지 않았다.
