# PR #28 최초 실행의 복구된 증거

PR HEAD는 `ba87dc9c09567c9a486d424ffb3e63a7eb04a12d`, 브랜치는
`mathscope-m3-mean-equivalence-20261014`, base는 PR #27의
`5422e232219a5de4722ac4e38ba79eb83b9e95cd`이다.
[Actions 38500114302](https://github.com/leegahuyn/MathScopeCompute/actions/runs/38500114302)의
prepare, controls, mean, natural, residual, initial **6개 job은 모두 success**였다.
job success는 수학적 무조건부 인증이 아니다.

원래 GitHub ZIP 여섯 개와 API run/jobs/artifacts metadata, 전체 SHA-256 및 member
receipt 검사 결과를 `cloud-38500114302/ARCHIVE_MANIFEST.json`과 같은 폴더에
영구 보존했다. ZIP 총합은 17,107,885 bytes이다.

- 실제 두 mean 단계: **8/8 기호적 defining-expression 일치**. 1차 capture 검사는
  Picard/Volterra에서 35개 경계를 남겼다. 함수의 분석적 전제는 별도다.
- 원본 초기 보정식: **5/5 독립 Fraction 산술 일치**. 전체 W/M/S·모멘트 인증은 별도다.
- natural node 4483, B8 node 5029: 기존 고전적 국소 증명 및 exact arithmetic replay.
  연속 matrix의 `||I-RA||` 상계는 약 0.0243324999046으로 1/32보다 작다.
  선택한 실제 natural/B8 이력에 대한 증명이며, 전체 reachable call의 인증이 아니다.
- **175/203/690**은 전체 direct 보존형 잔차와 assembled 잔차의 **차이**를 전개한
  유리식 분자의 항수다. 독립 Cartesian PDE의 실제 값이나 반례가 아니다.
  별도 Cartesian program에는 계산하지 못한 실제 leaf jet 요청 **393개**가 남았다.
- `originalN601Complete`, `originalN602Complete`는 모두 false다.

연결 중단 이후의 새 source/domain/class/remainder/analytic 검증은
[`../n6-continuation-20261014/RESULTS_KO.md`](../n6-continuation-20261014/RESULTS_KO.md)에
별도 기록한다. 기존 통과한 대규모 mean 계산은 재실행하지 않는다.
