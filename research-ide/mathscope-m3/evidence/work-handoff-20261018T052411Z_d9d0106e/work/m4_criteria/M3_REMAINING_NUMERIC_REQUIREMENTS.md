# M3 남은 세 항목의 실제 수치 평가 요구

원문 기준을 구현팀에 전달하는 메모다. 새 구현의 PASS/FAIL 판정은 포함하지 않는다. 모든 검사는 해당 실제 run/source/current state와 연결하고, 선언한 finite scope를 보존한다.

## N6-02 — 전체 residual 재계산 (확장 설계도 p62)

R(u+δu,p+δp)=R(u,p)+Lu(δu,δp)+div(δu⊗δu)를 사용하며 매 substep 후 최신 압력을 복원한다. 합격: 독립 직접 PDE 평가와 decomposed residual이 오차 예산 내 일치한다. 기존 flat tail와 새 quadratic remainder를 장부에서 누락하지 않 는다.

실제 평가 대상: Same actual complete finite state, its actual implemented increment, and current full pressure after every implemented substep of a canonical cycle.

필수 출력:

- All three independently evaluated direct PDE residual components
- All three decomposed residual components R_old + L_old(delta_u,delta_p) + div(delta_u tensor delta_u)
- Mismatch with a declared error budget and provenance for input/output tuple and pressure roots
- Retained old flat residual, new quadratic remainder and all actual cutoff terms

수치 기준: The original specifies agreement inside an error budget, not a universal numerical tolerance or sample count. Declare domain, evaluation inputs, precision, derivative/truncation/quadrature errors and budget appropriate to the actual evaluator.

범위: One actual implemented complete cycle with every mandatory substep/root join tested can establish the finite implemented-cycle certificate. It does not certify numerical evaluation of all j; the original does not require literal infinite execution.

실제 complete cycle:

- forced correction for all supported nonzero angular harmonics, then pressure refresh
- signed covariance update using the fixed original positive primary amplitudes, then pressure refresh
- zero-auxiliary-mean temporal update including its actual axial cutoff remainder, then pressure refresh
- fresh five-equation moment correction from current P/Jtheta/Jz, then pressure refresh

Paper p100: use full current wave velocities to form angular covariance Wab and gr; set P=integral_R Haar_Y(gr), pm=T0(gr-rho P); use this pressure for Etheta/Ez; use the same velocity/radial source for Jtheta/Jz. Repeat after every velocity change. Angular pressure and full auxiliary covariance cannot be dropped before their required products.

Final two conservation moments remain zero. The three recomputed defects equal the nonlinear remainders in (8.26)-(8.27); they are not required to vanish exactly.

충분하지 않은 근거:

- A graph node ID or structure equality without actual residual evaluation
- Pretemporal or fresh-initialized signed checks substituted for the post-forced/post-signed/post-temporal chain
- Reusing the same residual expression on both sides as an independent direct comparison
- Dropping retained old flat terms, full pressure, axial cutoff remainder or the new quadratic term

## N7-06 — 전역 에너지 balance (확장 설계도 p64)

d(∥u∥²₂/2)/dt+ν∥∇u∥²₂=⟨f,u⟩를 전체 K에서 적분한다. core만의 에너지와 구분한다. 합격: 정규화 energy defect가 독립 space/time refinement에서 감소한다. ν=1에서 (10.13)의 ∥u(t)∥² ₂+2∫∥∇u∥²₂≤(∫∥f∥₂)² 상계와 모순 없어야 한다.

실제 평가 대상: The same actual whole localized velocity u and whole force f, integrated over the entire fixed compact support K. Core-only energy is distinct.

필수 출력:

- Normalized energy defect and all terms/normalization definition
- Independent spatial-refinement comparison, with temporal choice held fixed
- Independent temporal-refinement comparison, with spatial choice held fixed
- Whole-support quadrature/truncation and error budgets sufficient to interpret decrease and no contradiction with (10.13)

수치 기준: N7-06 itself gives no fixed tau list, grid, tolerance, or factor-two requirement. It requires normalized defect decrease under independent space/time refinement. State actual chosen window, tau, quadrature, tails and error budget.

범위: Finite positive-tau windows and selected runs must be explicit. The analytical energy theorem alone is not the required numerical refinement comparison.

식:

- d(||u||_2²/2)/dt + nu ||grad u||_2² = <f,u>
- At nu=1: ||u(t)||_2² + 2 integral_0^t ||grad u(s)||_2² ds <= (integral_0^t ||f(s)||_2 ds)²; paper (10.13).

충분하지 않은 근거:

- Inner-only or core-only integration
- A toy/model/zero extension standing in for the actual global fixture
- Naming f as the full PDE residual without evaluating its actual terms and the energy/refinement quantities; defining f by that residual is itself the original construction
- Assuming an analytic weighted-supremum selector is an effective numerical evaluator

## N8-05 — 공간·급수·정밀도 적응 (확장 설계도 p66)

core radius, axial length, pulse wavelength, active cutoff orders를 함께 해결한다. 각 refinement 축을 독립 증가시킨 다. 합격: 2배 grid, Fourier cutoff, coefficient order, arithmetic precision 비교표와 별도 tail bound를 저장한다. 예산 초과 시 last-resolved τ와 원인을 표시한다.

실제 평가 대상: Actual near-terminal construction with core radius, axial length, pulse wavelength and active cutoff orders resolved together.

필수 출력:

- Baseline versus doubled spatial grid, holding other axes fixed
- Baseline versus doubled Fourier cutoff, holding other axes fixed
- Baseline versus doubled coefficient order, holding other axes fixed
- Baseline versus doubled arithmetic precision, holding other axes fixed
- Separate tail bounds for omitted contributions
- On budget exceedance, last-resolved positive tau and the concrete cause

수치 기준: The factor two for grid/Fourier cutoff/coefficient order/arithmetic precision is explicit in N8-05. N8-04 separately lists tau=1e-2,1e-4,1e-8,1e-12; do not transplant that separate criterion as a new N8-05-only universal gate.

범위: The four doubled-axis comparison table and tail record apply to the declared actual run/window; finite numerical evidence cannot be relabeled as an all-order or infinite-limit theorem.

충분하지 않은 근거:

- Increasing all axes together
- Doubling unused metadata or a parameter that cannot change the actual evaluator
- Finite-stage structural equality or exact symbolic cutoff selection without evaluator outputs
- Reusing periodic baseline solver tests as the whole-space paper construction
