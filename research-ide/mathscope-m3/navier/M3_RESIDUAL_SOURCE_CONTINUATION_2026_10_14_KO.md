# M3 남은 8개 기준의 실제 소스 후속 작업

이번 후속 작업은 `f1206131fb87c929d89b5fcc8edf248e66692ac0`의 실제 저장 소스에서 시작했다. 원 설계도 기준과 원 논문 잠금값을 바꾸지 않았다. 원 논문 SHA-256은 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`이다. **원 M3 완료 수는 56/64를 유지한다. 아래 실행 성공은 남은 8개 원 기준의 합격을 뜻하지 않는다.**

## 실제로 추가·실행한 내용

- 저장된 다섯 moment-map 변경 norm 테스트를 Node v24.18.0, old-space 1536 MiB, 150초 예산으로 실행했다. 실제 원본 3,615,866-node 초기 mean 소스에 묶인 8개 테스트와 세 가지 공격 통제가 모두 통과했다. 소스 모듈 118개의 해시가 실행 중 유지되었다. 실행 시간은 53.891초다.
- 전체 mean의 독립 conservative cylindrical 재구성에 원본 monotone 및 quadratic implicit derivative adapter를 함께 연결했다. quadratic adapter는 원본 세 시스템의 연속 방정식, 실제 선택 분기, zero seed, 계수와 Jacobian 가정을 유지한다. 미분 가능한 정의역과 비특이성 가정을 입증했다고 표시하지 않는다.
- 이 연결의 실제 소스·공격 통제 테스트는 11 + 12 + 10 = 33개가 통과했다. 전체 mean의 수학적 판정은 `UNRESOLVED`다. temporal 단계에서 원본 `maximum` 선택 node `539400`이 미분 좌표 node `622802`에 의존하며, fixed/smooth branch가 입증되지 않아 중단했다. 실제 전체 mean 재구성은 이 관문보다 뒤의 quadratic 호출까지 도달하지 않았다. 별도 quadratic 테스트는 원본 retained 시스템을 감사했다.
- 원본 temporal inverse의 실제 두 residual root `643053`, `643068`과 C0/C1의 네 derivative-bound root를 연결한 Fourier tail 표를 추가했다. K = 1, 2, 4, 8에서 같은 원본 scalar bound를 정확히 1/K로 비교한다. `source_scalar(node)`는 수치 샘플이 아니다. K>1의 Fourier 계수 적분을 새로 계산했다고 표시하지 않는다.
- 실제 core evaluator를 11개의 독립 설정에서 새로 실행했다. grid 2/4, comparison degree 32/64, directed arithmetic 128/256 bits를 각각 하나씩 바꿨으며, 같은 물리 좌표의 정확한 interval은 모두 겹쳤다. 기존의 양의 nonlinear 및 pressure error를 유지했다. annular field 또는 균일한 공간 보간 오차를 입증한 것으로 바꾸지 않았다.
- 이 두 refinement의 의미·해시·변조 거부 테스트 7개가 통과했다. CI는 현재 `mathscope-m3-*` push 및 관련 PR에서 작동하고, 새 refinement 테스트의 존재와 정확한 개수, 실제 출력 artifact를 요구한다. 기존 integrated five-map 테스트의 실제 관측 artifact도 보존한다.

## 원 기준별 남은 관문

| 원 기준 | 추가된 실제 소스 근거 | 아직 필요한 원 합격 근거 |
|---|---|---|
| N6-01 | 원 temporal → 최신 pressure → 새 five-map → 최신 pressure 순서의 저장 소스에 묶인 norm composition 8/8 | 같은 tuple에 대해 B0=0.7, C0*=1.2, (9.9), (9.10)의 완전한 class 상수 및 추정 |
| N6-02 | 독립 전체 mean replay에 원 implicit derivative adapter 두 종류 연결; 실제 중단 node 보존 | 모든 substep의 nonzero-angular/full physical PDE, 독립 직접 평가와 오차 예산, 아직 입증되지 않은 branch 및 domain closure |
| N6-07 | 기존 fixed-domain finite norm/degree 프로그램과 현재 소스 연결 유지 | 실제 j→j+1 전체 cycle, 같은 q<qbig에서 (9.17), (9.18)의 Km, ℓm 및 log powers를 만족하는 실제 stage별 추정 |
| N6-08 | 기존 source cutoff/final summation 모듈 유지 | 위 실제 stage들에 묶인 (9.21) field와 Lemma 5.4 tail, 실제 active index 및 생략 bound |
| N7-04 | 기존 exterior 제한 jet 근거를 그대로 유지 | K 전체의 terminal Fj와 origin spatial flatness; 제한된 exterior 관측을 전체 K의 jet으로 바꿀 수 없음 |
| N7-05 | 기존 정확한 (10.11), (10.12) cutoff kernel 및 접합 항등식 유지 | 실제 전체 K의 Fj, source-derived norm, 왼쪽 접합 compatibility 및 공간·시간 support |
| N7-06 | 기존 energy 관련 경계 및 source 의존성 유지 | 전체 K의 실제 energy/dissipation/work 적분, 독립 space/time refinement와 감소하는 정규화 defect, (10.13) 일관성 |
| N8-05 | 실제 core 세 축의 새 interval 비교 + 별도의 원 temporal Fourier tail K 표 | 같은 최종 field의 네 축 비교, annular/core·axial/pulse·active cutoff scale 해결, 별도 전체 tail 및 last-resolved τ |

## 증거와 실행

주요 증거는 다음 경로에 있으며 과거 실패 기록을 덮어쓰지 않았다.

- `../evidence/resume-20261013/local-latest-norms-attempt4/`: 초기 checkout의 LF/CRLF 손상으로 거부된 실제 실패.
- `../evidence/resume-20261013/local-latest-norms-attempt5/`: 원본 해시를 복원한 후의 8/8 PASS, 두 certificate, 실제 TAP, receipt.
- `../evidence/resume-20261014/checkout-byte-repair.json`: 원본 git object 및 고정 SHA/size 570개 검증. 저장 소스의 수학적 내용을 바꾸지 않음.
- `../evidence/resume-20261014/implicit-integration-attempt1/`: 첫 진단 naming assertion 실패와 이어진 실제 derivative 감사 기록.
- `../evidence/resume-20261014/implicit-integration-attempt2/`: 변경 없는 원 소스에서 33/33 실행 PASS 및 `UNRESOLVED` 수학적 결과.
- `../evidence/resume-20261014/refinement-attempt1/`: 실제 core interval 결과, 기록된 원 temporal tail 표, 26 KB display JSON, 실행 receipt.
- `../evidence/resume-20261014/refinement-attempt1/verification/`: 7/7 테스트, 출력된 원 temporal 표, 실제 TAP 및 receipt.

원 source norm producer의 반환값은 deferred scalar expression이며 실행된 수치 norm으로 바꾸지 않았다. old-space 1536 MiB는 V8 heap 설정이며 process-tree RSS 제한을 뜻하지 않는다. CI workflow 정의나 로컬 실행을 독립 GitHub CI 실행 성공으로 대신 표시하지 않는다.

간단한 로컬 검사는 다음과 같이 재현할 수 있다.

```text
node --max-old-space-size=1536 --test --test-reporter=tap --test-concurrency=1 research-ide/mathscope-m3/navier/tests/saved-five-mean-change-norms.test.mjs
node --max-old-space-size=1536 --test --test-reporter=tap --test-concurrency=1 research-ide/mathscope-m3/navier/tests/saved-whole-mean-direct-audit.test.mjs research-ide/mathscope-m3/navier/tests/saved-quadratic-implicit-derivatives.test.mjs research-ide/mathscope-m3/navier/tests/saved-monotone-implicit-derivatives.test.mjs
node --max-old-space-size=1536 --test --test-reporter=tap --test-concurrency=1 research-ide/mathscope-m3/navier/tests/source-core-refinement.test.mjs research-ide/mathscope-m3/navier/tests/temporal-cutoff-refinement.test.mjs
```

새 공개 소비 함수는 `evaluateRecordedTemporalCutoffRefinement()`이며, `recordedTemporalCutoffRefinementObservations()`는 변경 없는 private 결과에서만 표시용 표를 반환한다. 복사되거나 completion flag가 바뀐 결과는 거부한다. 이 표의 표시 범위는 **pre-temporal 원 auxiliary inverse tail**이다.
