# MathScope M3/M4 — 잔여 8개 증거 관문 (2026-10-23)

이 문서는 원본 수학적 의무/인수 기준을 변경하지 않는 추적 기록이다. `source AST PASS ≠ 실제 PDE 소거 ≠ 전 차수 해석 증명 ≠ 폐구간 수치 인증`.

## 원본 실행 계보
- 원본 PR #30 HEAD: `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60`, 미병합, 불변.
- 39944125200: 원본 Signed162 private seal + Temporal exact AST + FiveMap 5-row AST/P/J까지 실제 실행. 결과 `PARTIAL_SOURCE_AUTHENTICATED`. FiveMap 마지막 root count=4,419,183, P/J=[4418702,4418769,4418830]. FiveMap 독립 full mathematical seal 없음.
- 39955832821: 원본 후속 full 3D physical residual AST 실행 시작(HEAD `0fa586b6ae171ca4fdf950f60c066980f2369bf1`); 2026-10-23 조회 시 **in_progress**, 결과 미확정. 종료 영수증 전 PASS 승격 금지.
- 39957156963: 정확한 유한 다항식 원통좌표 direct-vs-split 검산 PASS, **실제 원본장 아님**.
- 39957977335: 소스 이전/증분 압력/비선형 교차항을 따로 구성하는 AST 모듈 preflight PASS, **source-shaped mock only**.

## 잔여 정확한 판정
| 항목 | 상태 | 닫는 데 필요한 실제 증거 |
|---|---|---|
| FiveMap 후 원본 전장 3D PDE AST | CI 실행 중 / 미확정 | 39955832821 최종 아티팩트, original roots + original full pressure + private seal |
| 직접/분해 잔차 동일성 | FINITE CONTROL PASS / ACTUAL OPEN | `source-postfive-direct-split.mjs`를 동일 sealed 3D graph에서 실행하고 3성분 defect root를 독립 소거 |
| 완전 3D PDE | OPEN | 강제형 방정식 `R(u,p)=f`의 정확한 일치, `div u=0`, 외력의 C∞·지지집합. 외력이 0이라고 가정하지 않는다 |
| A–D 전 단계 | OPEN | 매 j 원본 Forced→Signed→Temporal→FiveMap, 새 pressure와 nonlinear residual, induction source seals |
| j,m 독립 공통 정의역 | OPEN | 논문 Lemma 9.7의 `qbig>0` 및 전체 원본 정의역의 비영성·합성 유효성 |
| 전 미분차수 해석적 상계 | OPEN | Lemma 9.8, (9.17)–(9.19): 모든 m, j 독립 손실 ℓ_m, C_(j,m), Fourier C_(m+4) 실제 원본 값 |
| cutoff/무한합 | OPEN | Lemma 5.4, (9.20)–(9.21): cutoff BEFORE curl, 국소 유한성, remainder/force 전 차수 flatness |
| 67개 진짜 physical closed intervals | 0/67 | A0/A1/A2=19씩, b=6, p=4; 최종 source fields, scale selectors, interval arithmetic, independent refinement, 192 whole-K cells |

## 수학적 주의
2026-10-23 OpenAI 「Finite Time Blowup for Navier–Stokes」의 Theorem 1.1은
`∂_t u+(u·∇)u−νΔu+∇p=f`인 **강제형** 문제다. 따라서 raw residual `R(u,p)`를
전 공간에서 0으로 만들었다는 인증이 요구되는 것이 아니라
`R(u,p)=f`, `div(u)=0`, 원본 forcing smoothness/compact support 증거가 요구된다.
기존 AST `exactRealCylindricalPDE`는 f를 빼기 전의 raw residual을 반환한다.

## 금지된 상태 승격
- M3 원장 62/64; N7-06/N8-05 OPEN.
- M4 0/16 ACCEPTED.
- 67 numeric 0/67, `last_resolved_tau=null`.
- `RELEASE=HOLD`.
- 원본 PR#30 및 운영 v0.3.1 미수정; 별도 감사 브랜치에만 신규 코드 기록.
