# M3 남은 8개 — 재현 가능한 GitHub Actions 클라우드 검증

> 기존 M3 56/64를 보존한다. 유한 실행 테스트 통과와 원본 수학적 인증은 구별한다.

## 원본과 환경

- 논문: *Finite Time Blowup for Navier–Stokes*, 166쪽 (Propositions 9.5, 9.6, 9.9; Lemmas 5.4, 9.7, 9.8, 10.2–10.4). 논문 주장 전체의 독립 검증은 별도.
- 기준: `research-ide/mathscope-m3/ORIGINAL_M3_M4_CRITERIA.json` 및 `N6_PROGRESS.json`, `N7_PROGRESS.json`, `N8_PROGRESS.json` (읽기 전용).
- 승계: `mathscope-m3-m4-20261014` (기준 HEAD: `11c4803d1f59b6ad480261ddda23450b70f0faea`).
- 기존 CI: `.github/workflows/m3-resume-focused-verification.yml`; 성공한 기존 실행: https://github.com/leegahuyn/MathScopeCompute/actions/runs/38452572524
- 이번 보완: `.github/workflows/m3-remaining-eight-cloud.yml`와 `cloud/remaining8_replay.py`.

## 실행과 증거

이 브랜치로 push하면 `smoke` 범위가 자동으로 실행된다. GitHub Actions의 *M3 remaining eight cloud replay* 항목에서 결과 및 아티팩트를 확인한다. 기본 브랜치에 워크플로가 반영된 이후에는 Run workflow에서 `extended`를 선택할 수 있다.

외부 연구자는 정확한 Git SHA를 checkout하고 Python 3.12, Node 24에서 다음을 실행할 수 있다.

```bash
python -B research-ide/mathscope-m3/cloud/remaining8_replay.py --profile smoke --output /tmp/m3-remaining8 --wall-seconds 180 --node-heap-mib 1536
```

`started.json`, `result.json`, 테스트별 원시 TAP/표준에러, evidence의 SHA-256 및 실행 시간·환경·정확한 commit/tree를 남긴다. artifact 보존 기간은 30일이며 영구 보관이 필요하면 별도 저장한다. 기존 소스 및 판정 장부는 수정하지 않는다.

테스트는 순차 실행, 기본 per-test wall time 180초, Node V8 heap 1536 MiB 제한이다. V8 heap 제한은 프로세스 전체 RSS 상한을 의미하지 않는다. 클라우드 러너 용량과 사용량 과금은 GitHub 계정·러너 종류에 따라 달라질 수 있다. 대형 원본 재생성은 이 워크플로에서 자동 실행하지 않는다.

## 8개 기준과 검증 범위

| ID | 실행 대상 | 남는 핵심 의무 |
|---|---|---|
| N6-01 | saved-five mean norm/integrated tests | Prop.9.5 j=0 실제 클래스, 최신 압력, B0=0.7 및 C0*=1.2 |
| N6-02 | independent mean audit 및 monotone/quadratic derivative tests | 원본 node 539400 maximum 분기 매끄러움, node 4483 자연급수 미분, 전체 3D PDE의 완전한 일치 |
| N6-07 | iteration-decay 및 source-localization tests | 모든 finite stage의 공통 도메인, 실제 상수·로그·미분 손실 |
| N6-08 | final-summation test | 실제 원본 장의 (9.21), Lemma 5.4 cutoff와 인증된 누락 tail |
| N7-04 | source-exterior-force-jets test | 전체 K의 원본 최종 장 force jets, 모든 차수의 flatness |
| N7-05 | terminal-cutoff schedule test | 모든 전역 F_j로 (10.11) 구성 및 (10.12) tails |
| N7-06 | flow-interface/flow-observations tests: **GENERIC FINITE MODEL ONLY** | 실제 원본 최종장의 전체 K energy/dissipation/force work; space/time refinement |
| N8-05 | temporal-tail/core-refinement tests | 실제 최종장의 grid/Fourier/series/precision 독립 재현, error enclosure 및 last-resolved tau |

## 후속 수학 관문

1. **Gate A:** N6-01/02 초기 상태·최신 압력·독립 잔차; 미해결 음함수 분기·원본 해석적 정의역을 검증한다.
2. **Gate B:** N6-07/08의 모든 유한 단계 bound를 동일한 실제 source에 연결하고 Lemma 5.4의 전체 cutoff/tail을 인증한다.
3. **Gate C:** N7-04/05/06의 전체 K terminal jet, force extension, energy와 독립 수치오차를 연결한다.
4. **Gate D:** N8-05의 모든 물리적 축과 복잡한 생략 tail을 포함한 재현·정밀도 인증을 완료한다.

**금지:** 그래프 node ID를 함수값으로 해석하거나, 일반 finite Galerkin 모형을 원본 해로 대체하거나, `PASS_FINITE_TEST`를 `originalCriterionComplete=true`로 자동 승격해서는 안 된다. 이 프로그램의 `allEightOriginalCriteriaProved`, `wholeM3Complete`, `mathematicalAcceptanceChanged`는 언제나 false다.
