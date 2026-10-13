# MathScope M3 → M4 · 2026-10-14 후속 구현

현재 원문 M3 인수는 **56/64**, 잔여 원문 8개는 계속 열려 있다. 이번 변경은 실제 원본 소스의 미분 audit·꼬리 비교, 새 Lean 실행과 재현 작업대의 구현이다. 전체 M3 64/64, 전체 M4 인수 또는 release freeze를 발급하지 않는다.

## 실제 변경과 검증

- M3: saved-five norm 8/8; quadratic/monotone와 전체 mean audit 33/33; 원본 Fourier tail·실제 core 독립 refinement 7/7. 모든 실행의 소스·예산·실패 대조와 원시 receipt를 보존했다.
- M4: 모듈 Defs/Finite/Analytic/Comparison/Conditional/Open 분리. 새 실제 Lean 실행 14개 target, 새 claim 11개. 균등극한의 균등연속성과 유한 대수 작은 정리를 검증했다. 실수 norm·미분과 극한 교환·semigroup·spectral measure adapter는 별도 미완료다. 기존 공식 Lean 4.34.1/mathlib 실행 두 건의 원본도 재검증했다. 형식·증거 보호 검사 26/26.
- R1: 13개 fixture의 직접 소스와 매번 새 isolated Worker가 입력·수학 hash·불변량에서 일치한다. 독립 refinement 6개를 저장했다. fixture 검사 4/4, 실행·입력·취소·재현·retention·plot 회귀 9/9. import는 결과 권한을 가져오지 않고 실제 재계산한다.
- 운영 UI: 기존 24개 기준 패널에 재현 작업대, 출처 선택이 가능한 실제 수치 표본, 정확한 상대 Fourier-tail 비교 및 Lean type/axiom/소스 기록을 추가한다. 기존 M1/M2 고정 소스 파일과 계산 Worker bytes는 보존한다. 배포 HTML의 두 작은 constructor/normalizer bridge는 M4 patch manifest에 별도 기록한다.
- 선택적 WebMCP: 상태 조회, 설치 fixture 실행, 실제 표본 선택의 세 가지 제한된 도구. 기능 부재 시 UI는 그대로 동작한다. 계정·보안·origin 권한을 변경하지 않는다.

## 원문 잔여 의무

| 원래 기준 | 남은 관문 |
|---|---|
| N6-01 | 실제 순차 j=0 전체 압력·W/M class와 원문 B0=0.7, C0*=1.2의 모든 상수 |
| N6-02 | 같은 최신 장의 모든 nonzero harmonic 직접 PDE·전체 quadratic/flat tail 경계. whole-mean 재생은 source maximum node 539400의 미해결 의존성에서 정직하게 중단한다. |
| N6-07 | 모든 finite stage의 공통 도메인·모든 차수 상수와 미분 손실 |
| N6-08 | 실제 최종 shrinking-cutoff/curl 장 및 Lemma5.4 전체 꼬리 |
| N7-04/05 | 같은 최종 장의 모든 force jets·flatness·compact smooth extension |
| N7-06 | 같은 장의 전체 K 에너지/소산/force work와 독립 space/time 오차 |
| N8-05 | 최종 장의 독립 grid/Fourier/order/arithmetic 비교. 이번 pre-temporal tail 및 exact core 표는 좁은 추가 증거다. |

R1-07의 네 walkthrough에 대한 **외부 사람의 재현 확인**도 아직 없다. 로컬 모바일 크기 검수는 실제 휴대전화 OS 검수가 아니며, 작은 fixture의 성공을 전체 연구 대상의 성공으로 확대하지 않는다. 코드와 시각화의 배포 완료는 별도 publication receipt에서 확인한다.

## 실행과 출처

```sh
node --test --test-concurrency=1 research-ide/mathscope-m4/release-lab/verify-fixtures.test.mjs research-ide/mathscope-m4/release-lab/runtime.test.mjs
node --test research-ide/mathscope-m4/tests/acceptance.test.mjs research-ide/mathscope-m4/tests/pinned-kernel-contract.test.mjs research-ide/mathscope-m4/tests/kernel-evidence.test.mjs
node research-ide/mathscope-m4/audit-kernel-evidence.mjs
```

원문은 `research-ide/mathscope-m3/ORIGINAL_M3_M4_CRITERIA.json`; 실제 소스 한계는 `research-ide/mathscope-m3/navier/M3_RESIDUAL_SOURCE_CONTINUATION_2026_10_14_KO.md`; 형식 검증은 `research-ide/mathscope-m4/evidence/formal-audit-20261014.json`; 재현은 `research-ide/mathscope-m4/release-lab/evidence/`에 있다.

디스크 한계로 과거 대형 artifact의 부분 checkout을 사용했다. Git에 보존된 과거 증거는 삭제하거나 실패에서 성공으로 바꾸지 않았다. `tools/verify_sparse_release.py`는 모든 새 authoring 파일을 먼저 stage한 뒤 정확한 index blob으로 edition manifest를 계산한다. 원래 v54의 693개 byte·50개 computation pin·242개 image·70개 번역 기준 검사는 그대로 수행하며, GitHub CI는 전체 checkout에서 일반 validator로 다시 확인한다.
