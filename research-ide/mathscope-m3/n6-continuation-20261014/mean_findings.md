# 실제 mean 8/8 및 binder·정의역 후속 판정

기준 소스는 PR #28 HEAD `ba87dc9c09567c9a486d424ffb3e63a7eb04a12d`, 1차 실행은 `38500114302`이다. 이 후속 검사는 이미 통과한 대규모 mean 계산을 반복하지 않는다. 1차 `original-mean-result.json`의 SHA256 `76dbdd374189a0f4a1da5e3f331883bda6c97cfc7e5153d8aac1f26c4f7ee738` 및 `mean-functional-equivalence.json`의 SHA256 `3ac8514cec70b9dd844fcfdee48be5be05e64321a44c88d43a8da09a88095ded`를 고정하고 원본 saved source 권한으로 그래프·155개 의존성 바이트를 다시 확인한다. JSON의 PASS 플래그로 원본 권한을 재구성하지 않는다.

## 기호 동등성

두 단계의 `Etheta`, `gr` 기존 4개 성공은 고정된 아티팩트로 보존한다. Temporal/Moments의 `Ez`, `pressureZ`에 남았던 각각 8개 단항식을 현재 원본 defining registry 및 source provider에 묶어 재검사했다. 네 numerator 모두 정확한 유리 산술로 0이 되었다. 각 단계의 정규화 작업은 2,774, integral equality 기록은 11개다. 전체 symbolic 8/8의 판정은 유지된다.

de Bruijn binder 거리는 현재 scope의 실제 coordinate ID로 정한다. 적분 endpoint는 그 적분의 binder scope 밖에 둔다. 독립 free coordinate는 source ID를 유지하고, 이름만 같다고 합치지 않는다. Named partial의 전체 registry 기록·body ID·formal ID·방향·미분 order·actual argument·explicit capture tuple, implicit root의 call ID·registry·전체 argument를 보존한다. 최대값은 원본 값을 유지한다. 분모를 지운 numerator equality는 해당 분모가 0인 점에서의 함수 동등성을 증명하지 않는다.

## 새로 닫힌 capture 경계

1차 결과는 fresh radial binder 네 ID `3614424`, `3614535`, `3615151`, `3615262`의 확장에서 35개 경계를 남겼다. 31개 `actual_background_even_profile`은 저장된 `picard[0]`의 실제 6성분 `A0/A1/forcing`, axis datum, radial domain, source-leading 및 tail/norm operand를 확장했다. 4개 `actual_covariance_volterra`는 `m3GlobalPulses`의 실제 `originalDefinition` 두 개와 wrapper의 matrix·variable·parameters·initial·length의 일치를 확인하고 전체 matrix/norm/initial operand를 확장했다.

로컬 실제 source 결과는 **133,540 node / 518,881 work**, 남은 unknown boundary **0**, fresh binder capture witness **0**이다. 원래 분석의 78개 정의와 추가로 검토한 limit 정의 3개를 보존한다. 새 정의의 SHA256은 다음과 같다.

| 정의 | SHA256 | scalar operand 수 |
|---|---|---:|
| `picard:0` | `c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60` | 103 |
| `covariance:0` | `756dfed4b201f62954236ae25b1d25d87499815f4e4677359254fbfde44ee625` | 16 |
| `covariance:1` | `9a3594ab28caaa1c3f52cbd558c9f0d03c10d8bb573b14a15eb9f7d3145f0c17` | 16 |

이 결과는 **이 네 fresh binder가 검토된 전체 정의에 숨겨진 capture로 들어 있지 않음**을 인증한다. 모든 숨겨진 coordinate가 각 함수의 formal로 선언되어 있음을 별도로 인증한 결과나 함수의 존재·매끄러움 증명으로 읽으면 안 된다. 원본 `allHiddenCaptureClosureProved` 이름은 이 검사에서 지정한 네 binder의 absence에만 한정된다. 다른 Picard system의 다른 lower-order grammar, 알 수 없는 defining-record field, 다른 signature는 자동으로 수용하지 않는다.

## 정의역·해석 조건

실제 후속 traversal의 각 source ID와 전체 operand tuple을 `domainInventory`에 저장했다. 재방문을 제외한 연산자 개수는 다음과 같다.

| 조건이 필요한 실제 연산자 | node 수 | 판정 |
|---|---:|---|
| `inverse` | 632 | 실제 전체 정의역의 nonzero 미입증 |
| `log_positive` | 243 | 실제 전체 정의역의 positivity 미입증 |
| `sqrt_positive` | 563 | 실제 branch domain 및 regularity 미입증 |
| `definite_integral` | 4,299 | integrability·Leibniz·FTC·zero-extension 조건 미입증 |
| `actual_monotone_root` / `actual_quadratic_root` | 14 / 13 | 모든 actual argument의 branch/Jacobian 조건 미입증 |
| `actual_natural_series` | 523 | 모든 call의 공통 analytic domain·국소 균등 미분 조건 미입증 |
| `actual_background_even_profile` / `actual_covariance_volterra` | 31 / 4 | 원본 norm/convergence·parameter derivative·axis 조건 미입증 |
| `source_step_derivative` / `smooth_piecewise` | 529 / 2,540 | 모든 collar/endpoint regularity 미입증 |
| `maximum` / `ceiling` | 96 / 218 | 미분되는 곳의 정당한 parameter 처리·국소 상수 조건 미입증 |

선택된 natural node 4483 또는 quadratic node 5029의 기존 국소 증명을 위 모든 call의 증명으로 확장하지 않는다. 원본 j=0 Prop 9.5의 W/M/S, B0=.7, C0*=1.2, moments, support 및 전체 Cartesian PDE는 독립 의무이다. 따라서 `actualMathematicalIdentitiesCertified`, `allAnalyticDomainsProved`, N6-01/N6-02/completeN6는 모두 false다.

## 재현

```sh
node --test research-ide/mathscope-m3/n6-continuation-20261014/mean_capture.test.mjs
node --max-old-space-size=8192 research-ide/mathscope-m3/n6-continuation-20261014/mean_capture_run.mjs --artifacts INPUT_ARTIFACTS --output OUTPUT_DIR
```

`INPUT_ARTIFACTS`에는 1차 실행의 `mean-proof-mean-38500114302` 등이 들어 있어야 한다. 원본 저장소의 immutable saved source도 필요하다. 성공·실패 모두 별도 JSON으로 저장한다. 사본 capability, 다른 첫 실행 아티팩트 또는 다른 registry/body로는 성공하지 않는다. 원본 producer/main/56/64/public site는 변경하지 않는다.
