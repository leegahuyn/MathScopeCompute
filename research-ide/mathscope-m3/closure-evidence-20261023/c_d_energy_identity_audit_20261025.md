# Clay (C) → (D) 한정 검증 인수인계 · 2026-10-25

## 정확한 적용 범위

OpenAI 원본 논문 *Finite Time Blowup for Navier–Stokes*의 Theorem 1.1 (C), Section 10.3 Lemma 10.4 (10.13), Section 10.4 (10.22)–(10.23), Section 10.5 Corollary 10.6 (D)를 대상으로 한다.

- **(C)**: 외력이 포함된 R³의 양의 점성 Navier–Stokes. 초기 속도 0, 매끄러운 강제력, 고정된 compact spatial support, 유한 에너지 및 시간 1 이전 속도 blowup. 동일한 외력·초기자료에 대해 uniform L² energy를 갖는 전역 매끄러운 경쟁해 배제.
- **(D)**: 물리적 T³=R³/Z³, 주기 속도·압력·외력, 초기 속도 0, 강제력이 시간상 compact, 시간 1 blowup 및 전역 매끄러운 주기해 배제.
- Section 6의 **auxiliary Fourier torus는 (D)의 물리적 토러스가 아니다**.
- Theorem 1.1을 독립적으로 완성하지 않고 (D)만으로 소스의 부족한 실제 함수값·정칙성을 인증한 것으로 볼 수 없다.

OpenAI 공식 Lean revision `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`에 `NavierStokes/R3/ParabolicScaling.lean`, `NavierStokes/PeriodicPaperSupport.lean`, `NavierStokes/PeriodicPaperScalingSupport.lean`, `NavierStokes/PeriodicPaperTheorem.lean`를 고정하였다. 해당 Lean 결과의 원본 MathScope AST·native 구현 정제 증명은 여전히 **OPEN**이다.

## 신규 조건부 C→D 원본 계산

C의 실제 필드 u,p,f가 공통 공간 지원 `K ⊆ [-R,R]^3` 및 시간 원점 근방의 실제 정지 구간을 갖는다는 별도 가정을 요구한다. 합리수(정확한 유리수) `lambda>max(1,4R)`로 택하고 `t0=1-lambda^-2`라 하면, 부호를 보존한 원본 변환은 다음과 같다.

- `u_tilde(x,t)=lambda*u(lambda*x,lambda^2(t-t0))`
- `p_tilde(x,t)=lambda^2*p(lambda*x,lambda^2(t-t0))`
- `f_tilde(x,t)=lambda^3*f(lambda*x,lambda^2(t-t0))`

모든 운동량 방정식의 항은 `lambda^3` 배, 발산은 `lambda^2` 배이고 점성은 그대로다. 각 지지집합은 `[-R/lambda,R/lambda]^3 ⊂ (-1/4,1/4)^3`에 있으므로 서로 다른 정수 주기 이동 사이 거리는 최소 `1-2R/lambda > 1/2`이며 nonlinear 교차항은 소거된다. 시간 `s=1`은 `t=1`에 정확히 대응한다.

L² 속도 제곱, `nu * ∫||grad u||² dt`, `(∫||f||₂dt)²`는 모두 `lambda^-1` 배가 된다. C의 에너지 인증이 주어지면 D의 에너지 상계도 상속된다. 예: `R=1`, `lambda=6`, `t0=35/36`, 강제력의 원래 상한 시각이 2라면 압축 시간 지지는 `[35/36,37/36]`.

별도로 (10.22) 점성 변환은 `u_nu(x,t)=sqrt(nu)*u(x/sqrt(nu),t)`, `p_nu=nu*p(...)`, `f_nu=sqrt(nu)*f(...)`; 속도 L² 제곱 및 점성 가중 총 소산량은 모두 `nu^(5/2)` 배다. 이는 C의 점성 ν=1 구성을 일반 ν>0로 옮기는 선행 작업이며, 그 후 공간 압축 lambda를 취한다.

## N7-06의 실제 통합 항등식

컴팩트한 u,p 및 실수 공간 전체 K(또는 진정한 물리 토러스)에서 다음 식을 유지한다. `R = u_t + (u·grad)u - nu Delta u + grad p - f`, `d=div u`라면

`[E(T)-E(0)]/2 + nu ∫|grad u|² - ∫f·u = ∫R·u + (1/2)∫|u|²d + ∫p d.`

실제 발산 오차 `d`, 압력 및 residual 항을 버리면 수치 상계는 불건전하다. 원래 (10.13)은 정확한 `R=0`, `d=0`, 매끄러운 소스에 한정해 얻어지며, C 전역 K의 에너지와 독립적 공간·시간 refinement는 아직 수행되지 않았다. 개별 정확 유리수 장부 테스트는 **수학적 식 확인용**일 뿐 192 K 셀 또는 실제 final A–D 장 평가가 아니다.

## 구현 및 완료 증거

- `certify_original_C_to_D_periodic_transfer.py`, `test_certify_original_C_to_D_periodic_transfer.py`
- `energy_defect_rational_20261025.py`, `test_energy_defect_rational_20261025.py`
- `.github/workflows/mathscope-C-D-periodic-transfer-20261025.yml`
- 전용 검증 CI **SUCCESS**: https://github.com/leegahuyn/MathScopeCompute/actions/runs/40134005583

검증은 exact rational algebra 및 작은 다항식 PDE·압력 장부 예제에 대한 것이며 원본 11 physical roots를 수치평가하거나 최종 67 제트를 증명하지 않는다.

## 이후 실제 C→D 연결을 위한 필수 입력

MathScope source의 최종 A–D 속도·압력·강제력, 발산=0, full 3D NS residual=f, compact support, 전 시간 스무스 force, 시간초기 정지구간, 공통 ∞차 정칙성 및 동일 source finite coefficients와 tail의 인증. C의 전체 K 에너지 및 독립 네 축 refinement를 우선 완료해야 한다. C를 완료하면 D는 위 검증된 scaling/periodization 정리로 이관 가능하지만, 원본 최종장과 공식 Lean CandidateProperties 간 정제/결합은 별도 의무다.

**기존 상태 변경 없음:** 114/114 조건부 첫분기, native 전역 OPEN, 원본 natural 33/523 certified·490 OPEN, final 67 jets 0/67, M3 62/64, M4 0/16, RELEASE HOLD. 원본 PR #30과 운영 페이지 변경 없음.
