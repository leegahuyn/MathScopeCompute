# MathScope M1 — 실제 게이지 군과 4차원 고전장

이 모듈은 **Y1–Y2의 16개 작업을 아래에 명시한 유한 지원 범위에서 구현**한다. 게이지 군의 표시 이름만 바꾸지 않고 실제 행렬 Lie 대수, 구조상수, 불변 내적, (SU(2)) 준동형, 4차원 연결과 곡률을 사용한다. Δ의 네 가지 역할을 분리하고, 원래 4차원 좌표 및 전체 생성 입력을 저장한다. 양자 양–밀스의 존재·반사 양성·연속극한·질량 간극은 이 모듈이 구성하거나 증명한 결과가 아니다. 그 별도 요구사항은 Clay의 공식 문제 설명 [YM-R01]과 `analytic-assumptions.json`에 대응시켰다.

## 1. 실제 지원 범위

| 실제 저장 군 | 허용 매개변수 | 표현 | 전역군과 주의점 |
|---|---:|---|---|
| (SU(n)) | (2leq nleq6) | 복소 (n\times n) 정의 표현 | 단일 연결 군 자체. 중심 \(\mu_n\)을 나눈 군은 별도 어댑터가 필요하다. |
| (SO(n)) | (n=3,5,6,7,8) | 실수 (n\times n) 벡터 표현 | 실제 (SO(n))에 충실하다. 이것을 (Spin(n))의 충실한 표현이라고 부르지 않는다. |
| compact (Sp(n)=USp(2n)) | (n=1,2,3) | 복소 (2n\times2n) 정의 표현 | (U^\dagger U=I\), (U^TJU=J\)인 compact 군. split (Sp(2n,\mathbb R))과 구별한다. |
| compact (G_2) | rank 2 | 실수 (7\times7) | 양의 팔원수 3-form을 보존하는 실제 행렬. 차원 14, 중심은 자명하다. |

총 **14개 실제 행렬 대수 어댑터**다. (SO(4))는 Lie 대수가 단순하지 않아 거부한다. (Spin(n)), 임의 중앙몫, (F_4,E_6,E_7,E_8), 위 한도를 넘는 표현은 `GROUP_NOT_IMPLEMENTED`, `GROUP_BOUNDS`, `GLOBAL_FORM_NOT_IMPLEMENTED` 또는 `REPRESENTATION_NOT_IMPLEMENTED`로 거부한다. 지원하지 않는 군을 (SU(2)) 장에 이름만 붙여 표시하는 경로는 없다.

여기서 `simple:true`는 compact 실 Lie 대수가 단순하다는 계약의 의미다. 중심을 가진 (SU(2))를 추상 군론의 `IsSimpleGroup`으로 선언하지 않는다. 단일 연결 덮개, kernel, 실제 표현의 충실성은 별도로 기록한다. 전역군의 분류·연결성·중심에 관한 외부 수학은 [YM-R02, YM-R14, YM-R15]의 `THEOREM_REFERENCE`이며, 아래의 유한 행렬 Lean 정리와 구별된다.

## 2. 정확한 대수 생성

`generate_groups.py`는 표준 Python의 `fractions.Fraction`만으로 \(\mathbb Q(i)\) 계산을 수행한다. 외부 CAS, 수치 고유벡터 또는 임의 난수는 사용하지 않는다.

각 군마다 다음 자료를 생성한다.

- 완전한 compact 실 기저와 희소 행렬, 전 구조상수 \(f_{ab}^{\ c}\).
- 완전한 복소 Chevalley 기저와 **정수** 구조상수, compact 기저에서 Chevalley 기저로 가는 정확한 복소 유리수 변환.
- 단순근·단순쌍대근, 전 근·쌍대근, character/cocharacter 정수 격자, pairing 및 Cartan 행렬. 행렬 convention은 \(A_{ij}=\langle\alpha_j,\alpha_i^\vee\rangle\)로, 행은 쌍대근이다.
- \([h_i,e_j]=A_{ij}e_j\), \([e_i,f_j]=\delta_{ij}h_i\), Serre 관계, 전 Chevalley bracket의 정수성.
- 모든 기저 쌍의 실제 행렬 commutator와 구조상수 재구성의 일치, 반대칭성, 모든 Jacobi 관계.
- 모든 ordered 기저 삼중항에서 \(B([X,Y],Z)=B(X,[Y,Z])\), 정확한 LDL 분해의 모든 양의 대각성분.
- 실제 compact coroot 행렬로 계산한 근의 제곱 길이. 가장 긴 근의 제곱 길이가 정확히 2인지 확인한다.

Jacobi는 서로 다른 세 기저 인덱스에 대해 전부 검사한다. 중복 인덱스의 항등식은 이미 확인한 반대칭성에 의해 소거된다. 이를 전체 ordered 삼중항 \(d^3\)에 대한 판정으로 기록하며, 임의 표본을 전체 검사로 부르지 않는다. 브라우저에서도 별도의 `BigInt` 유리수 연산기로 전 Jacobi·불변 내적 표를 검사한다. 부동소수점 행렬 commutator 검사는 그와 별개의 회귀검사다.

불변형은 다음 기본 정규화를 사용한다.

\[
B(X,Y)=-c\,\operatorname{Re}\operatorname{Tr}_R(XY),\qquad
c=\begin{cases}
1&SU(n),\ Sp(n),\\
\tfrac12&SO(n),\ n\geq5,\ G_2,\\
\tfrac14&SO(3)\text{의 }A_1\text{ 정규화}.
\end{cases}
\]

이는 실제 compact coroot 길이 검사와 연결된다. 기본형에 대한 매장 지수의 의미는 [YM-R05]를 참고한다. (SO(3)) 벡터 표현의 trace 계수는 (SO(n\geq5))와 같지 않다.

### (G_2)의 구성과 두 (SU(2)) 준동형

코드의 팔원수 convention은

\[
(a,b)(c,d)=(ac-\overline d\,b,\ da+b\overline c),\qquad a,b,c,d\in\mathbb H
\]

이다. imaginary 기저는 \((i,0),(j,0),(k,0),(0,1),(0,i),(0,j),(0,k)\)다. \(\varphi_{ijk}=\langle e_i e_j,e_k\rangle\)를 곱셈에서 직접 계산하고, \(\mathfrak{so}(7)\)의 21개 기저에 대한 infinitesimal 보존 조건을 정확히 행 소거한다. 제약 rank 7, kernel dimension 14가 실제로 계산된다. compact (G_2=\operatorname{Aut}(\mathbb O)\)의 해석은 [YM-R14, §4.1]이다. 다른 문헌의 Cayley–Dickson 순서·부호를 코드 convention과 그대로 동일시하지 않는다.

- `canonical-su2`: \((a,b)\mapsto(a,u b)\). quaternion 왼쪽 작용이 마지막 실수 4차원에 들어가며 지수는 1이다.
- `short-root-su2`: \((a,b)\mapsto(u a u^{-1},b u^{-1})\). 실제 첫 3차원 회전과 마지막 4차원 오른쪽 작용을 합친 행렬이며 지수는 **3**이다.

두 경우 모두 전 생성자 bracket, 3-form 보존, Gram pullback을 정확히 확인한다. (SU(2)\to SO(3))는 kernel \(\{\pm1\}\)인 덮개 준동형으로 별도 기록한다. `embedding`이라는 필드 이름이 이 경우 전역적으로 단사라는 주장을 뜻하지 않는다.

## 3. 실제 4차원 연결과 곡률

모든 계산은 anti-Hermitian convention

\[
D=d+A,\qquad F_{\mu\nu}=\partial_\mu A_\nu-\partial_\nu A_\mu+[A_\mu,A_\nu]
\]

을 사용한다. `fields.mjs`는 (A), 1차·2차 미분 jet, (F), 공변 미분을 실제 행렬로 계산한다. 지원 구성은 다음 세 가지다.

1. `EMBEDDED_BPST`: 선택한 실제 매장 \(\iota\)로 regular-gauge BPST를 올린다.
2. `FULL_BASIS_TRIAL`: (\mathfrak g)의 모든 기저 계수를 사용하는 명시적 시험장.
3. `BPST_PLUS_PERTURBATION`: 실제 BPST와 전 기저 시험장을 더한다.

\[
A_\mu=\frac{2\eta^a_{\mu\nu}(x-c)^\nu}{|x-c|^2+\rho^2}\,\iota(T_a),\qquad
F_{\mu\nu}=\frac{-4\rho^2\eta^a_{\mu\nu}}{(|x-c|^2+\rho^2)^2}\,\iota(T_a),
\quad T_a=-\frac{i\sigma_a}{2}.
\]

첫 번째 식의 해석 미분과 행렬 commutator로 얻은 (F)를 두 번째 식과 독립 비교한다 [YM-R06]. 전 기저 시험장에는

\[
A_\mu^{\rm trial}(x)=\frac{\varepsilon}{\ell}
\sum_{a,m}c_{\mu a m}\,\phi_m((x-c)/\ell)T_a
\]

를 쓴다. `GAUSSIAN_POLYNOMIAL`의 \(\phi_m(y)=y^{\alpha_m}e^{-|y|^2/2}\)는 총 차수 4 이하다. `FOURIER`는 기록한 정수 wave vector·phase·SIN/COS mode를 쓴다. 계수는 명시 배열이거나, 기록한 문자열 seed에서 정해지는 xorshift32로 만들고 **최종 전체 배열도 저장**한다. 군을 바꾸며 이전 차원의 계수 배열을 그대로 사용하면 shape 검사가 거부한다.

추가로 동일한 원래 scalar 계수에서 구조상수 \(f_{ab}^{\ c}\)만 사용해 (F)를 다시 계산하고, 실제 행렬 곱 결과와 비교한다. 해석 jet와 독립적인 중앙 유한차분도 사용하며, 간격 (h\to h/2)에서 오차비가 약 4가 되는 2차 수렴을 확인한다.

BPST의 자기쌍대성·양–밀스 방정식 잔차와, 모든 매끄러운 시험장이 만족해야 하는 Bianchi 항등식 잔차를 분리한다. 시험장의 양–밀스 잔차가 0이 아니면 그 값을 그대로 내보낸다. 값을 색상 정규화로 없애거나 시험장을 증명된 해로 승격하지 않는다.

## 4. 경계·게이지 변환·정규화

`R4_WINDOW/OPEN_RESTRICTION`은 \(\mathbb R^4\)에서 정의된 식을 관측하는 유한 직사각형 창이다. BPST를 단순히 복사해 붙이는 주기적 torus 입력은 거부한다. `PERIODIC_TORUS/PERIODIC`은 자명한 bundle 위의 정수 Fourier 시험장만 허용한다. 모든 방향의 seam에서 (A,F)가 일치하는지 검사한다.

비상수 게이지 함수

\[
\Omega(x)=e^{\theta(x)T},\qquad \theta(x)=a\sin(k\cdot x+\phi)
\]

에 대해

\[
A'_\mu=\Omega A_\mu\Omega^{-1}-(\partial_\mu\Omega)\Omega^{-1},\qquad
F'_{\mu\nu}=\Omega F_{\mu\nu}\Omega^{-1}
\]

를 실제로 계산한다. 변환된 (A')를 다시 유한차분하는 독립 검사도 포함한다. torus에서 전역 게이지 변환으로 사용하려면 각 (k_jL_j/(2\pi)\)가 정수여야 하며, 주기성이 없는 함수를 조용히 전역 변환으로 사용하지 않는다.

\[
\mathcal S(x)=\frac1{g^2}\sum_{\mu<\nu}B(F_{\mu\nu},F_{\mu\nu}),\qquad
q_4(x)=\frac1{8\pi^2}\sum_{\mu<\nu}B(F_{\mu\nu},(*F)_{\mu\nu}).
\]

지수 (I_\iota\)의 pure BPST는

\[
q_4(x)=I_\iota\frac{6\rho^4}{\pi^2(|x-c|^2+\rho^2)^4},\qquad
q_3(x_1,x_2,x_3)=I_\iota\frac{15\rho^4}{8\pi(r^2+\rho^2)^{7/2}},
\]

\[
\int_{\mathbb R^4}q_4=I_\iota,\qquad S=\frac{8\pi^2I_\iota}{g^2}
\]

이다. (q_4)의 단위는 길이(^{-4}), (q_3)는 길이(^{-3})다. 실제 행렬 곡률에서 얻은 밀도에 Simpson 적분과 tangent compactification을 적용해 이 식과 독립 비교한다. Simpson의 수치 일치는 무한적분에 대한 Lean 정리로 표시하지 않는다.

반경 (R\)의 4차원 공의 charge는

\[
Q(R)=I_\iota\frac{R^4(R^2+3\rho^2)}{(R^2+\rho^2)^3}.
\]

관측 창에 내접한 공을 이용해 pure BPST의 창 밖 양의 charge와 작용에 대한 보수적인 상한을 반환한다. 임의 off-shell 장에 대해서는 유한창 적분을 정수 위상전하나 전체 \(\mathbb R^4\) 작용이라고 주장하지 않는다.

## 5. Δ 상태족의 정확한 의미

| 모드 | 실제 필드 | 해시·단위 효과 |
|---|---|---|
| `ASSUMED_BOUND` | 동일 | 별도의 스펙트럼 하한 가정 기록만 바뀐다. physical field hash와 표시 밀도는 동일하다. |
| `UNITS` | 동일 | (L_{\rm unit}=\Delta/\Delta_{\rm ref}\)만 변경. (x_{\rm display}=x/L_{\rm unit}\), (q_{4,\rm display}=L_{\rm unit}^4q_4\), (q_{3,\rm display}=L_{\rm unit}^3q_3\). |
| `CLASSICAL_SCALE` | 실제 재계산 | (\lambda=\Delta/\Delta_{\rm ref}\), (A_\lambda(x)=\lambda A(c+\lambda(x-c))\). 모든 고전적 길이는 (1/\lambda\)배. torus 주기 역시 변화한다. |
| `EFFECTIVE_MODEL` | 실제 재계산 | (\ell=\hbar c/\Delta\), (\rho=\kappa\ell\)라는 명시적 모델 정의. 전 기저 섭동의 폭·계수 prefactor도 함께 변화한다. |

`ASSUMED_BOUND`는 `HYPOTHESIS`, 유효 관계는 `DEFINITION`으로 저장한다. Δ만으로 4차원 양자 상태가 결정된다고 선언하지 않는다. 같은 manifest의 결과는 정확히 재현되며, 군·표현 데이터·매장·실제 계수·길이·경계가 달라지면 physical source hash가 달라진다. 이 해시는 **게이지 궤도의 정규형**을 계산한 것이 아니라 선택한 원본 표현과 생성 입력의 식별자다.

고전적 dilation으로 길이를 절반으로 줄이면 중심 (q_4)는 16배, (q_3)는 8배가 된다. 단위 변경에서도 수치값의 변환 차수는 같지만, 원래 물리장은 그대로라는 차이를 별도의 해시와 설명으로 확인한다.

## 6. 4D 관측과 3D 표시

- `SLICE`: 실제 (x_4=c) 단면에서 곡률 밀도를 평가한다.
- `FINITE_MARGINAL`: 지정한 유한 (x_4) 구간에서 gauge-invariant scalar를 적분한다. 일반장의 생략 tail은 인증된 것으로 표시하지 않는다.
- `BPST_INFINITE_MARGINAL`: **pure embedded BPST에만** 위의 무한 marginal 식을 사용한다.
- `LINEAR_PROJECTION`: 입력한 실제 rank-3 (3\times4) 행렬 (P\)로 (Px\)를 표시한다. 모든 원래 (x\in\mathbb R^4\) 표본을 함께 반환하고 (\ker P\) 방향도 기록한다.

torus 표시 좌표는 lift 좌표다. 한 주기만큼 떨어진 두 좌표가 같은 torus 점을 나타낼 수 있다. 3차원 화면의 겹침이나 단면 모양은 4차원 상태의 동일성·복원 가능성·스펙트럼 정리를 의미하지 않는다.

공통 renderer 계약은 `visualization.points[{pos,label,value,sourceIndex}]`, `lines`, `axes`, `description`, `coordinateMeaning`, `lostInformation`이다. 임의의 고차원 대수 데이터를 물리적 공간 좌표처럼 임의 배치하지 않는다.

## 7. 유한 holonomy와 유한 스펙트럼 모델

`holonomy.mjs`는 실제 4차원 piecewise-linear 경로의 각 작은 구간에서 행렬 지수함수를 계산한다. convention은 (U_{xy}\)가 (y\)의 fibre를 (x\)로 옮기는 방향이다.

\[
U_{xy}\mapsto\Omega_xU_{xy}\Omega_y^\dagger.
\]

닫힌 경로의 trace는 불변이며, 열린 경로의 trace를 gauge invariant라고 표시하지 않는다 [YM-R07]. 두 midpoint 해상도의 차이, 실제 군 membership 잔차, 지점별 게이지 변환의 정확한 끝점 소거, 변환된 연속 연결을 독립 적분한 수렴 오차를 모두 반환한다. 유한 deterministic link는 quantum Wilson ensemble의 표본이 아니다.

이 불변형 convention에서 plaquette 계수는

\[
\beta=\frac{2\dim(R)c}{g^2},\qquad S_P=\beta\left(1-\frac{\operatorname{Re}\operatorname{Tr}_R U_P}{\dim(R)}\right).
\]

(SU(n)\)의 (2n/g^2\)를 다른 표현에 무조건 복사하지 않는다.

별도 `gauge.spectral`은

\[
H=\operatorname{diag}(0,\Delta+\epsilon_1,\ldots,\Delta+\epsilon_n),\quad
C(t)=\sum_j w_j e^{-(\Delta+\epsilon_j)t/\hbar}
\]

인 **명시적 유한 대각 모델**을 만든다. (\epsilon_j\geq0\), (w_j\geq0\), (t\geq0\), \(\hbar>0\)를 검사한다. (\hbar\)는 에너지·시간 단위를 갖는다. 실제 유한 (H\)의 gap은 (\Delta+\min_j\epsilon_j\)이고, 관측 채널이 최저 들뜸과 겹치지 않으면 채널 질량은 그보다 크다. 모델을 4차원 고전장에서 추론한 양자 Hamiltonian으로 표시하지 않는다.

무한차원으로 넘어갈 때 필요한 Hilbert norm, self-adjoint operator domain, 전체 vacuum projection, positive spectral measure, unbounded observable의 공통 domain, Tonelli/dominated convergence 조건, 채널 완전성 및 OS 재구성 요구는 `analytic-assumptions.json`에 양화사와 함께 기록한다. [YM-R08, YM-R09]는 외부 참고 정리이며 실제 선택 모델의 Lean import나 연속극한 증명으로 승격하지 않는다.

## 8. 실제 Lean 커널 검사

`lean/lean-audit.json`에 정확한 source content/SHA-256, target type, `#print axioms`, 명령·exit code·전체 log, toolchain·driver·runtime hash와 고의 오류 거부를 저장했다.

- 공식 **Lean 4.34.1**, commit `5045d0056413266e57c625dcd7c365b10e377c52`.
- 총 **27개 target**. `sorry`, `admit`, 새 사용자 공리 없음. 일부 정리는 Lean의 표준 `propext`에 의존하며 개별 목록을 그대로 공개한다.
- (SU(3)\) 전체 28쌍 및 (G_2\) 전체 91쌍의 정확한 교환자표, compact matrix 조건.
- (SU(3)\)와 (G_2\)의 canonical 지수 1 매장 bracket 및 Gram 관계. 분모를 없앤 (L_a=2T_a\)를 써서 \([L_a,L_b]=2\epsilon_{abc}L_c\)를 확인한다.
- 실제 (G_2\) 행렬로 된 finite holonomy covariance와 닫힌 Wilson trace 항등식.
- 임의의 명시적 lawful group 연산에서 성립하는 endpoint cancellation·closed holonomy·class-function 조건부 불변성.
- 자연수 단위로 정한 유한 들뜸 에너지 집합의 하한과 열린 간격 배제.
- 임의 좌표형에서의 slice roundtrip, 실제 비단사 projection collision, 전체 fibre에서 성질이 일정하다는 인증서를 요구하는 조건부 내려감.

지수 3 매장은 정확 유리수 생성기에서 검사되며, 그 Gram 관계 자체를 이 27개 Lean target에 포함했다고 주장하지 않는다. 전체 지원 군의 모든 Jacobi를 Lean으로 검사했다고도 주장하지 않는다. 그 완전 유한 검사는 Python/BigInt exact 검증이며, Lean의 Jacobi target은 명시된 (SU(3),G_2\) fixture다.

고의로 잘못 고친 bracket의 계수 3, 잘못된 Wilson trace, 서로 다른 네 번째 좌표의 동일성은 모두 커널에서 거부된다. 감사 source는 `Init`과 자체 모듈만 import한다. 환경에 있던 mathlib commit은 기록하지만 **mathlib의 Lie 군·Hilbert 공간 정리를 import했다는 의미가 아니다**. 브라우저 화면은 이 고정 source와 감사 hash를 대조하며, 브라우저에서 Lean을 다시 실행했다고 표시하지 않는다 [YM-R13].

## 9. API와 재현

공통 worker는 다음 순수 ES-module facade를 사용한다.

```js
import { getExamples, validateRequest, runJob, getCapabilities } from './gauge/index.mjs';
const request = getExamples().find(x => x.id === 'g2-index-three').request;
const validity = validateRequest(request);
if (!validity.ok) throw new Error(JSON.stringify(validity.errors));
const result = await runJob(request);
```

`kind`는 `gauge.group`, `gauge.field`, `gauge.family`, `gauge.holonomy`, `gauge.spectral`이다. 완전한 실행 예제는 27개다. `group` 이름과 Δ만 있는 field 요청은 거부한다. 기본 수치 계약은 다음과 같다.

```json
{
  "precision": {"mode":"FLOAT64","tolerance":1e-9},
  "budget": {"maxSamples":2200,"maxEvaluations":12000,"maxMatrixDimension":8}
}
```

요청 grid·적분 panel·경로 분할이 예산을 넘으면 조용히 줄이지 않고 거부한다. 필드 기본 길이·결합상수 등은 제한된 Float64 범위에서 검증한다. 수치 결과는 interval certificate가 아니며, `NaN`/`Infinity`는 실패다. 안전한 정수 범위를 벗어난 정수 모양의 부동소수점 값은 `{kind:'FLOAT64',value:...}`로 보존하여 정확 정수로 잘못 읽히지 않게 한다.

출력에는 완전한 원본 입력, `groupSpec`, 세부 `group`, `baseFieldSpec`, 선택 `fieldSpec`, `familySpec`, `stateFamilySpec`, 실제 `assumptionRecords`, 네 가지 hash, 4D 원본 표본, 관측 정의, 수치 잔차 및 참고문헌이 들어간다. 세 M0 계약은 실제 `mathscope-m0/contracts.mjs`로 확인했다. 세션이 새 revision을 부여하면 root의 저장기가 실제 삽입된 node reference로 참조를 재결합해야 한다.

프로젝트 루트에서 다음을 실행한다.

```bash
python mathscope-m1/gauge/generate_groups.py
node mathscope-m1/gauge/tests.mjs
python mathscope-m1/gauge/lean/generate_fixtures.py
python mathscope-m1/gauge/lean/reproduce.py
```

이 작업환경의 Lean 재현 스크립트는 설치 root를 명시하는 공식 shared-library frontend driver를 사용한다. runtime·kernel·guard를 변경하지 않는다. 일반 설치에서는 `lean/lean-toolchain`과 `lakefile.lean`을 사용해 `lake build` 및 `lake env lean MathScope/M1/Gauge/SU3.lean` 등을 실행할 수 있다. negative source는 각각 별도로 실행했을 때 nonzero exit여야 한다.

`evidence/validation.json`은 18개 실질 검증군의 결과와 검사 당시 소스 hash를 담는다. 14개 군의 exact algebra 및 full-color/BPST, 두 독립 곡률 경로와 유한차분, 독립 quadrature, 전역군 kernel, 주기 seam·전역 gauge 조건, Δ 역할과 단위, actual projection, holonomy 수렴, 유한 spectral channel, 27개 예제의 완전 replay, M0 계약, 고의 오류 거부를 포함한다. 개별 Y1/Y2 및 관련 M0 매핑은 `checklist.json`을 본다.

## 원전과 증거의 구별

원전의 정확한 제목·저자·위치는 `sources.json`에 있다. 모든 문헌 레코드의 상태는 `THEOREM_REFERENCE`, `leanImport:null`, `kernelReceipt:null`이다. 실제 Lean receipt는 `lean/lean-audit.json`에만 있으며, 문헌 URL이나 화면의 모습이 receipt를 대신하지 않는다. 구체적인 미지원 범위 및 필요한 후속 해석 가정은 capability 목록과 `analytic-assumptions.json`에 보존한다.
