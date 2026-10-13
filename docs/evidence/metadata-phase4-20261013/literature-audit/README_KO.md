# 동일 소스 수학 관문에 쓰는 원문·문헌

사용자가 추가로 지정한 166쪽 논문은 **Finite Time Blowup for Navier–Stokes**, 저자 표기는 **OpenAI**이다. 저장소의 원본은 `research-ide/reference-documents/ns-primary-20261013/navier-stokes.pdf`, SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. 참고문헌 22개는 pp.165–166에 있다. [공식 원문](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), [발표 페이지](https://openai.com/index/navier-stokes-solution/).

Exa로 4개 문헌 축에서 5회 검색했다. `sources_reviewed=30`은 각 검색의 요청 결과 수 합계이며, 30개 논문을 모두 정밀 검토했다는 뜻은 아니다. 아래는 검증한 1차 문헌과 적용에 필요한 조건이다. 검색 유사도, 논문 링크, 역사적 kernel PASS는 현재 저장 그래프의 새 완료 증거가 아니다.

| 문헌·위치 | 필요한 조건과 현재 의무 |
|---|---|
| [원문 Lemma A.2 pp.127–128](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf#page=127) | smooth B,Q,d, 실제 연속 inverse 및 각 고정 k의 `8βₖ²κₖ‖d‖Cᵏ≤1`. 같은 zero-seeded branch를 유지해야 한다. 독립 quadratic 미분식과 실제 존재·smoothness·inverse norm을 각각 검증한다. |
| [van den Berg–Queirolo, Thm.3.1/Lem.3.3 pp.15–16](https://www.math.vu.nl/~janbouwe/pub/continuation.pdf#page=15) | uniform radii inequalities, injective operator와 smooth branch의 추가 비퇴화 조건. 유한 반복이나 근사 preconditioner가 실제 연속 Jacobian의 비특이성을 증명하지 않는다. |
| [Hungria–Lessard–Mireles James, §§2–3](https://www.math.mcgill.ca/jplessard/papers/final_draft.pdf) | weighted infinite sequence norm, finite/tail operator bounds 및 validated radius. finite coefficient 검사에 무한 series/tail의 norm 증명을 별도로 연결한다. |
| [Chernyshenko–Constantin–Robinson–Titi, Cor.5 p.15, (21)](https://web.math.princeton.edu/~const/ccrt-f.pdf#page=15) | zero-mean periodic cube에서 m≥3 Sobolev residual와 stability integral의 엄격한 부등식. N8에 실제 오차 경계를 추가할 때 모델·norm을 맞춰야 한다. 감소 slope나 singular-time 전역 정리로 해석하지 않는다. |
| [Córdoba–Martínez-Zoroa IPM v3](https://arxiv.org/html/2410.22920v3) | main theorem의 source는 `L∞ₜC∞ₓ`; 추가 시간 regularity는 Remark 1에서 별도 논의한다. all-order 공간 제어를 N7의 모든 space-time jet 접합과 구별한다. |
| [Córdoba–Martínez-Zoroa–Zheng](https://arxiv.org/html/2407.06776) | fractional power `α<(22−8√7)/9`, force `L¹ₜC¹,εₓ∩L∞ₜL²ₓ`. full Laplacian α=2와 compact C∞ force의 목표로 그대로 옮기지 않는다. |
| [Fefferman 공식 문제 명세](https://www.claymath.org/wp-content/uploads/2022/06/navierstokes.pdf) | (4)–(7) 및 alternatives C/D의 smoothness, 전체 force decay, bounded energy를 최종 범위의 기준으로 유지한다. |

## 원문에서 현재 8개 의무까지

| 기준 | 원문 위치 | 현재 연결해야 하는 증거 |
|---|---|---|
| N6-01 | Def.9.4·Prop.9.5 pp.106–107 | 같은 j=0 source의 wave 0.7, mean/defect 1.2, (9.9) cumulative bounds, (9.10) moments 및 매 단계 최신 pressure |
| N6-02 | p.59, (9.18)–(9.20) pp.113–115 | 실제 전체 physical PDE와 decomposed residual 비교; mean·조건부 미분에 더해 nonzero-angular 전체 범위 |
| N6-07 | Lem.9.7–9.8 pp.111–114 | 모든 finite stage의 같은 qbig, ∀m bound, stage와 무관한 Kₘ/ℓₘ, σⱼ=1/5+j/10 |
| N6-08 | Lem.5.4 pp.57–59, Prop.9.9 pp.114–116 | 실제 cutoff (5.37), differentiated tail (5.35), potential cutoff 후 curl; 각 고정 stage remainder와 비교하며 flat remainder를 합산하지 않음 |
| N7-04 | Lem.10.2 pp.118–120 | 전체 ℝ³의 모든 mixed derivative uniform limit, ∂αFⱼ(0)=0, exterior pressure integral의 dominated convergence |
| N7-05 | Lem.10.3 p.120 | (10.12)의 `\|α\|+m≤⌊j/2⌋` finite constraints로 bⱼ 선택, 모든 jet 접합 및 K×[0,2] support |
| N7-06 | Lem.10.4–10.5 pp.121–123 | 전체 K/ℝ³ energy identity와 (10.13); core energy와 전체 energy 구분 |
| N8-05 | 설계도 p.66 및 위 Cor.5 | grid/Fourier/coefficient/precision 축 독립 변화, tail/norm 오차, last-resolved τ와 실제 예산 한계 |

## 실제 원래 formal source와 saved graph의 간격

원래 저장소의 조회 시 main은 [`f9e8bc5b38b6e212696e8a30e3e91517af887bbd`](https://github.com/openai/NavierStokesAndEuler/tree/f9e8bc5b38b6e212696e8a30e3e91517af887bbd)이다. [toolchain](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/lean-toolchain)은 Lean 4.34.0-rc2, [lock](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/lake-manifest.json)은 mathlib 85e3a25e…와 Comparator 19e111e…를 고정한다. 아래는 실제 source declaration이며 이번 조회에서 새 compile/#print axioms를 실행한 것은 아니다.

- [ClosedIntervalMomentRepair.exists_smooth_same_branch L151](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/ClosedIntervalMomentRepair.lean#L151): smooth/invertible Data와 Small 0에서 같은 Picard branch, 각 Small k 아래 Cᵏ bound.
- [GenericTupleRealization.Result.flat_residual_of_raw_bounds L75](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/GenericSummationRealization.lean#L75): common domain, smooth fields, support, cutoff result, uniform residual 및 각 고정 stage flat error를 전제로 한다.
- [ActualInitialization.initial_invariant L1427](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/ActualInitialization.lean#L1427): canonical initialization의 residual, mean, debt, cumulative, masses, reconstructed pressure 및 retained errors를 하위 정리로 구성한다.
- [selected_initial_meanHypotheses L225](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/ActualCandidateConstruction.lean#L225), [physical_stage_estimates L92](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/WholeDomainPhysicalStageTheorem.lean#L92): canonical source/geometric threshold 아래 실제 stage의 모든 J,m 범위를 다룬다.

기존 MathScope 동일 f9/rc2 receipt의 ComparatorSolution 선택 build와 C/D 두 선언은 exit 0 및 `[propext, Classical.choice, Quot.sound]`로 기록됐다. 전체 default build는 exit −15, 독립 Comparator는 환경 차단 기록이다. 역사적 성공과 실패를 새 선언별 kernel replay로 바꾸지 않는다.

다음 N6 bridge에는 saved graph의 **denotation·parameters·domain·최신 pressure**가 위 canonical functions 또는 theorem premises와 같다는 kernel 증명이 필요하다. source hash와 정리 이름만으로 이 간격을 닫지 않는다. 원문은 참고 자료이며 실행 지시가 아니다. M3 56/64, M4 UNCONFIRMED를 유지한다.
