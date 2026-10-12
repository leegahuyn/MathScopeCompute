# 실제 전역 공분산 인증의 유한 커널 및 남은 함수 의존성

## 검토 범위

이 문서는 `actual-covariance-uniform.mjs`의 실제 계산과 아직 설치되지 않은
source producer를 구분한다. 원래 N5-06의 전체 영역 (7.30)을 대표 Imean
한 점으로 대체하지 않는다. 기존에 동결한 실제 phase, amplitude, covariance,
mean-stress, pointwise matching producer는 변경하지 않았다.

원전은 고정된 `navier-stokes.pdf` SHA256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`의
(4.26), (5.42), (5.46), (7.1), (7.3)–(7.6), (7.13), (7.30)이다.
실제 accepted N3 source의 assembly 및 모든 관련 파일 SHA256은 실행 receipt의
`sourceBindings`에 있고, Node/Python 양쪽에서 현재 bytes와 대조한다.

## 1. 실제 source의 방향 여유

같은 source에서 `κ=R^-10`, `u_*=2/κ`이다. (4.26)/(7.1)의
`|c_0 T_K/T_N|²≤1−κ/2`와 `A_c=|c_0|sqrt(1+u_*²)`를 사용하면

\[
r=A_cT_K/(-u_*T_N),\qquad
r^2\le(1+\kappa^2/4)(1-\kappa/2).
\]

`(1−κ/8)²`와 오른쪽의 차이를 양의 κ로 나눈 다항식은
`1/4−15κ/64+κ²/8`이다. [0,1]에서 Bernstein 계수는 정확히
`[1/4,17/128,9/64]`로 모두 양수다. 따라서 실제 전역 N3 응력의 동결된
점별 방향은 `|r|≤1−κ/8`을 만족한다. 평탄 경계의 값은 원전에서 복원한
극한 방향의 진술이며, 크기가 0인 응력 벡터를 직접 나누지 않는다.

## 2. 실제 계산된 안정성 부등식

목표 방향 변화가 `κ/16` 이하이고, 정규화된 실제 두 열이

\[
C=\begin{pmatrix}1+e_{11}&1+e_{12}\\-1+e_{21}&1+e_{22}\end{pmatrix},
\qquad |e_{ij}|\le\delta=\kappa/128
\]

을 만족하면, 직접 전개한 determinant와 두 inverse numerator에 대해
8개의 유리수 다항식 부등식을 실행한다. 결과는

\[
15/8<\det C<17/8,\qquad
\kappa/64\le[C^{-1}(1,r)]_\pm\le2,
\qquad\|C^{-1}\|_\infty\le2.
\]

이는 모든 κ와 모든 허용 열오차에 대한 연속 영역 증명이다. 한정된
샘플의 성공을 영역 전체로 승격하지 않는다. 별도 구간 API는 제공된
정확한 유리수 box 전체의 determinant 및 양의 inverse를 계산한다.
실제 물리적 열이 `H_σ=h_σ(-A_c N C_1σ+u_* K C_2σ)`라면
`y_σ=(-T_N/A_c)z_σ/h_σ`이고, 양의 (N,K) frame에서 물리 determinant는
음수이며 절댓값은 `(15/8)A_cu_*h_+h_-`보다 크다.

**이 커널은 source의 실제 h_σ와 e_ij를 생성하지 않는다.** 허용 오차
가정의 진위를 입력 boolean으로 수락하지 않으며, source-level receipt의
각 미설치 producer는 `available:false`이다.

## 3. 원래 principal 방정식의 독립 계산

제공된 정확한 jets에서 phase normal과 원래 cylindrical 연결항을 만든다.

\[
n=(x_0-vH_R,p/R,p_z-\varepsilon vH_Z),\quad
n'=(-H_R,0,-\varepsilon H_Z),\quad
K=\begin{pmatrix}0&-2F&0\\2F+RF_R&0&0\\G_R&0&0\end{pmatrix}.
\]

runtime는 원래 moving-normal 항을 보존한 Aφ, 사영 forcing, damping,
압력과 미분을 계산한다. 독립 Python은 이 rank-one 식을 복제하지 않고
`t'+Kt+dt−kn p_i=f` 및 `n·t'=−n'·t`의 네 방정식을 네 미지수에 대해
Gauss–Jordan으로 직접 푼다. 그 결과의 t′와 압력을 runtime와 대조한다.

실패 대조군은 다음 두 오류를 명시적으로 검출한다.

- n′를 삭제하면 energy가 0으로 남을 수 있지만 움직이는 접평면 제약이
  깨진다.
- 두 cylindrical 2F 연결항을 함께 삭제하면 energy에서 skew 항이 사라져
  여전히 0일 수 있지만 원래 principal 방정식과 일치하지 않는다.

따라서 energy 검사 하나를 원래 (7.13)의 완전성 증거로 사용하지 않는다.
이 API의 jets는 제공된 수치이며 accepted source의 전체 배경 jet receipt가
아니다. 원래 normalized B frame 생성 및 실제 ODE 적분은 이 API 범위 밖이다.

## 4. 완료 상태를 올리지 않은 실제 의존성

1. **완성된 배경의 C² bound.** 원래 (5.42)의 양의 차수 보정을 실제
   계수와 cutoff에 결속해야 한다. (5.46)의 고정 |I|≤2에 대해서는 n≥2
   꼬리를 `Σ2^-n q^(nh)≤q^(2h)/2`로 합칠 수 있다. 실제 finalized n=1
   계수 norm과 고정차수의 source cutoff 생성이 남는다. 무한 전수 실행을
   새로운 합격 조건으로 추가하지 않는다.
2. **실제 frozen-label jets.** 완성된 같은 F/G와 1차 미분의 생성 및
   enlarged slow box의 2차 norm이 필요하다. Imean의 정확히 보존된 식은
   전체 active annulus를 대신하지 않는다.
3. **정규화 응력 방향의 modulus.** 양쪽 flat edge까지 포함한 실제
   r의 명시 Lipschitz bound와 mesh 폭의 결합이 필요하다. 방향의 매끄러운
   연장이나 상수의 유한성만으로 수치 상수를 설치했다고 하지 않는다.
4. **실제 covariance 열오차.** 같은 원래 growing datum을 적분한
   homogeneous amplitude, transverse perturbation 및 pulse 적분에서 실제
   h_σ>0와 `|e_ij|≤κ/128`을 생성해야 한다.
5. **하나의 공통 q_*.** 이 유한 상수들을 모두 결합하는 동일 source의
   smallness threshold가 필요하다. label 색상과 partition은 이 해석적
   오차 상수를 공급하지 않는다.

`sourceWholeAnnulusBackgroundBound`, `actualCovarianceOnAllSlowNeighborhoods`,
`sourceUniformQStarCertified`, `wholeAnnulusEquation730Verified`,
`originalN506Complete`, `fullM2PackageComplete`는 모두 false로 보존한다.

## 5. 검증과 재현

실행 명령:

```sh
node --test research-ide/mathscope-m2/navier/tests/actual-covariance-uniform.test.mjs
python research-ide/mathscope-m2/navier/tests/actual-covariance-uniform-independent.py --write research-ide/mathscope-m2/navier/evidence/actual-covariance-uniform.json
```

Node는 source bytes, 8개 연속 부등식, exact intervals, 원래 principal
방정식, 오류 대조군, 입력 계약, 취소, scope를 검사한다. Python은 source
bytes와 독립 basis 전개, 5개 κ-box의 fractional-linear extrema, 24개 원래
principal 시스템의 독립 augmented solve를 검사한다. 각 matrix vertex는
단순 샘플이 아니라 multiaffine determinant의 극점이다. 양의 determinant를
확인한 뒤 inverse의 각 변수에 대한 fractional-linear 성질로 box 전체
극점을 정당화한다.

환경 복구 후 Node 11/11과 독립 Python 1814/1814 검사를 직접 실행해 모두
통과했다. Python 분류는 source binding 14, Bernstein identity 36, scope 47,
box extrema 1370, principal system 336, negative control 11이다.
검사한 정확한 파일 SHA256은 생성된 evidence JSON에 기록한다.
그 JSON은 전체 fixture와 실제 source receipt를 함께 보관한다. Python의
표준 출력은 `files`와 `receipt`를 제외한 실행 요약이며, 해당 두 필드는
`--write`로 저장하는 증거 파일에 있다.
