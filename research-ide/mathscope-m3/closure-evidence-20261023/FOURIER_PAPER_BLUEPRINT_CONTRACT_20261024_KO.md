# 2026-10-24 KST · N6-05 원본 Fourier 역연산 수치 커널 / PDF 근거 감사

## 출처 고정
- 사용자가 첨부한 `navier-stokes(20261023-160203).pdf` (166쪽), SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
- 사용자가 첨부한 `MathScope_Research_IDE_Blueprint_v1_KO(1)(20261023-160203).pdf` (99쪽), SHA-256 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`.
- Blueprint p.62: N6-05 (zero auxiliary mean and +4 torus derivatives), N6-06 (five radial moment equations), N6-07 (stage-independent domain), N6-08 (cutoff summation).
- Paper p.63–64: equations (6.2), (6.7), irrational direction and divisor; pp.95–96: Lemma 8.6, equations (8.19)–(8.23); pp.107–114: Proposition 9.6 and Lemmas 9.7–9.8.

## 엄밀히 구현/검증한 범위
- `original_torus_fourier_interval.py`: period-one original torus (v_t=(\sqrt2-1,1)), nonzero finite frequency, exact integer Pell-norm (a^2-2b^2\ne0), integer-square-root rational enclosure for \(\sqrt2\), alternating rational arctan Machin bound for \(\pi\).
- Complex Fourier coefficients are given as **external assumed** certified rational intervals. Zero Haar mean and conjugate reality are enforced; the output coefficient division is guaranteed to enclose the exact *finite-mode* inverse.
- `conditional_Cm_fourier_tail_bound(m,K,M)`: provided \(F\in C^\infty(T^2)\) has a **source-proved** \(M=\max_{|\alpha|=m+4}\|D^\alpha F\|_\infty\), derives \(\|N^{-1}F-S_K\|_{C^m}\le7M/(1944 K)\), \(K\ge1\). This constant follows from rational estimates \(2+\sqrt2<7/2\), \(\pi>3\) and frequency max-shell \(8n\).
- `paper_eq820_torus_mean_update.py`: computes \(\Delta v=-c_i^{-1}N_i^{-1}E_\theta^\circ\), \(\gamma_d=-c_i^{-1}N_i^{-1}E_z^\circ\) on **finite given source modes**; a strict rational lower bound for \(c_i\) is obligatory.
- All 17 relevant GitHub CI tests PASS: [run #39984683008](https://github.com/leegahuyn/MathScopeCompute/actions/runs/39984683008).
- Tests reject nonzero zero-mode, absent/inconsistent real conjugate pair, zero-frequency denominator, nonpositive or zero-containing \(c_i\), and unsupported or floating-point norm inputs.

## 반드시 남겨야 하는 원본 의무
1. \(E_\theta^\circ,E_z^\circ\) 전체 source-native function definition과 모든 needed Fourier coefficients에 대한 실제 certified interval evaluator.
2. 원본 \(c_i=T_g^i Q^{1+h}\)의 해당 collar·index 전체에 대한 source-pinned strict positive enclosure.
3. 원본의 모든 고정차수 \(m\), 모든 반복단계 \(j\)에 대한 \(M_{j,m+4}\)와 공통 domain; Lemmas 9.7, 9.8. 현재 generic tail **does not supply them**.
4. \(\gamma_d\)에서 실제 axial velocity를 구성하는 (8.14), (8.21)의 \(A_1\gamma_d\) cutoff flat remainder와 full latest-pressure refresh.
5. Original cycle Proposition 9.6, Borel shrinking-cutoff Lemma 5.4, terminal compact force and entire 67 physical field jets remain OPEN.
6. #39977528137 original full graph archive: query workflow status and obtain actual source-node operation histogram. The first **actual** blocking native operation cannot be determined from a generic operator catalogue alone.

## 인증 경계
N6-05 = CONDITIONALLY_IMPLEMENTED_FINITE_FOURIER_SUBKERNEL, NOT ORIGINAL_FULL_CORRECTION_CERTIFIED.
M3 62/64 · M4 0/16 · original final 67 numeric 0/67 · last_resolved_tau=null · RELEASE HOLD.
Original PR #30 `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60` unchanged. Live website unchanged.
