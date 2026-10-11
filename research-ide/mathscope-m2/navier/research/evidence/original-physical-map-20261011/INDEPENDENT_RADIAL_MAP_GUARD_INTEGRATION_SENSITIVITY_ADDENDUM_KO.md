# 원문 radial equation guard 통합의 독립 검토

검토자: `sensitivity_kernel`. 날짜: 2026-10-11 UTC. 이 문서는 [기존 수학적 영향 검토](INDEPENDENT_RADIAL_EXPONENT_IMPACT_SENSITIVITY_REVIEW_KO.md)의 별도 후속 기록이다. 기존 검토와 구 실행물은 수정하지 않았다.

## 결론과 현재 관측 경계

원문의

\[
d_r=2\big((1+h)\rho_g-h/100000\big)
\]

를 다섯 계산 지점에 적용하는 공통 recipe, 독립 literal equation 검사, 같은 실제 물리점의 inverse와 private seal, 실제 source 체크, 설치 pin/build/runtime의 연결을 읽었다. 아래 고정된 바이트 범위에서 구체적인 구현·수학 오류를 발견하지 못했다. 이 검토로 교정된 실제 source 재실행을 막아야 할 이유는 발견하지 못했다.

**교정된 전체 source의 관측 PASS는 아직 이 문서의 검토 범위가 아니다.** 확인한 실행은 경량 회귀와, 잘못된 지도를 포함한 과거 source attempt 3 및 그 결과의 설치 거절이다. 새 original point/root/270행을 실제 생성·검사해야 한다는 기존 결론은 유지된다.

## 1. 식과 원래 양의 h를 검사하는 경계

`source-radial-phase-exponent.mjs`의 `originalRadialPhaseExponentRecipe`는 바깥 2를 두 항 전체에 곱한다. exact source와 관측용 interval 산술이 같은 recipe를 사용한다. interval caller의 \(\kappa_s\)는 이진 소수 literal을 정확한 유리수로 취급하지 않고 `idiv(point(1),point(100000))`로 감싼다.

`originalSourceRadialPhase`는 caller의 graph에 원래 \(h,\Lambda_g,T_g,\rho_g,\kappa_s,d_r\)를 생성한다. optional `h`와 `Tg`를 임의 상수로 바꿀 수 없고, 실제 원본 매개변수 root와 \(4+\sqrt2\)를 요구한다. 현재 actual geometry producers의 `Tg`도 같은 literal 몸체임을 읽어 확인했다.

`assertOriginalSourceTorusMap`은 이 recipe를 다시 호출하는 비교만으로 끝나지 않는다. 별도로 명시한 typed arithmetic tree와 현재 `G.nodes`의 작은 closure를 직접 비교한다. 원래 이항 괄호를 보존하고 add/multiply의 교환만 허용한다. `G.lookup`의 오래된 hash-cons 결과만 믿지 않으므로, root ID를 보존한 채 \(\kappa_s\) operand를 `1/200000`로 바꾸는 음성 대조도 거절한다.

이 검사는 여섯 몸체와 actual map의 \(\Lambda_g,\rho_g,d_r\) root를 확인하고, 원래 profile ID와 parameter expression SHA 및 `h`, `T`, `Md`의 원래 정의 바이트를 비교한다. `strictPositiveSourceRetained`는 이 원래 정의를 보존한다는 뜻이다. \(h=0\) 평가나 양의 \(h\)를 수치적으로 0으로 바꾸는 규칙은 없다.

반환 JSON의 범위는 equation binding이며 `privateParentAuthenticationRequired:true`, `fullPhysicalGraphExecutionProved:false`다. 저장된 이 JSON만으로 새 private physical-source 권한을 만들지 않는다.

## 2. 다섯 계산 지점과 actual point의 연결

다음 다섯 caller의 교정 diff를 읽었다.

- `source-geometry.mjs`
- `actual-covariance-source-certificate.mjs`
- `actual-full-curl.mjs`
- `actual-terminal-physical-velocity-jets.mjs`
- `actual-common-global-wave-bounds.mjs`

다섯 곳 모두 동일 helper를 사용하고, 전역 `fastRadialProof`는 정확한 \(\epsilon^{-\kappa_s}S^{-\rho_g}\) 상계로 정정됐다. falling-product/radius 및 기존 최종 \(\epsilon^{-\kappa_s}\) 손실 장부를 바꾸지는 않았다.

`actual-common-physical-center-enclosure.mjs`의 `buildPhysicalPoint`는 다음 순서를 따른다.

1. 같은 `G`, 원래 band constants/geometry로 `attachSourcePalette`를 호출한다.
2. 바로 그 `G`, `c.h`, `g.Tg`, `template.physicalMap`을 `assertOriginalSourceTorusMap`에 넘긴다.
3. 같은 `template.physicalMap.dr`를 `exactInversePhysicalTorusCenter`의 `input.dr`로 전달한다.
4. `originalPhysicalMap`, `originalTorusMapBinding`, 실제 inverse와 새 대표점을 하나의 `point.public`에 보관한다.

private `data(p)`는 `point` 전체를 canonical 문자열에 포함한다. private node-prefix seal은 당시 실제 operand들을, function-definition/covariance seal은 실제 system들을 함께 보호한다. 최종 program도 별도 JSON snapshot이다. 따라서 binding metadata를 바꾸거나 actual \(d_r\) operand를 바꾼 뒤 같은 private result라고 주장하면 기존 authenticator의 비교를 통과하지 못한다.

`physicalCenterFrequencyAudit`는 새 공통 specification을 hypothesis로 사용한다. 원문의 강한 \(M_i>\epsilon^{-\kappa_s}/(3S)\)에서 기존 더 약한 \(M_i>\epsilon^{-1/200000}/(3S)\)를 도출한다고 명시했다. 이 약한 하계를 유지하는 것이 원래 exponent를 반으로 줄이는 뜻이 아님을 설명한다. 새 actual \(h\)와 모든 양의 변위·잔여항은 유지한다.

## 3. 실제 source부터 설치까지 이어지는 검사

staged source runner의 첫 번째 검사에서 private `p`를 먼저 인증한 다음, live `p.G`와 `p.point.originalPhysicalMap`으로 equation audit를 다시 실행한다. 그 결과와 `p.point.originalTorusMapBinding`이 같고 \(d_r\)가 `p.point.inverse.input.dr`와 같아야 한다. 이를 같은 프로세스의 별도 `original-torus-map-equation` 파일로 기록한다. 기존 여덟 개 top-level 검사를 통과하는 의무를 줄이거나 구 실행의 flags를 새 검사 대신 쓰지 않는다.

공통 physical package source suite의 두 번째 검사도 live physical `G`와 `p.geometry.physicalMap`을 같은 helper에 전달한다. 이 경로는 중심의 값만 검사하는 것이 아니라 common physical source의 실제 map 연결을 대상으로 한다. 이 검사가 교정된 원본을 생성한 프로세스에서 관측돼야 전역 physical certificate의 원문 결속을 다시 승인할 수 있다.

`pin-physical-center-executed-evidence.mjs`는 다음을 함께 요구한다.

- 실제 source 8/8, complete/exit 0 및 별도 관측 process record와 SHA.
- 초기·후기 import manifests 및 모든 certificate의 현재 바이트 일치.
- 새 original equation 파일의 SHA와 현재 specification 전체의 일치.
- 원래 양의 \(h\) profile, 여섯 몸체 검사, `dr === actualDr`.
- 같은 physical-center certificate의 map, inverse, source h root와 equation binding 전체의 일치.
- 실제 source manifest에 equation helper가 포함됨.
- 기존 270개 actual body row와 numerical row/positive scale root의 대응 및 source error/conditioning 의무.

필수 build verifier는 pin 자체의 SHA, source/process/원래 equation 파일, physical-center certificate 및 같은 point binding을 다시 비교한다. 기존 fresh numerical algorithm 및 conditioning body의 호환성 검사는 유지된다.

runtime wrapper도 새 specification, 엄밀 양의 h 기록, 같은 \(d_r\) root, 여섯 몸체 검사와 legacy-rejection policy를 요구한다. 반환 `sourceEvidence`에 original equation 파일과 binding을 노출한다. 실제 거대 원본 graph를 runtime에서 재구성했다는 주장으로 바꾸지 않고, 설치된 외부 원본 실행 증거와 현재의 directed numerical 재계산을 구분한다. 228개 pulse의 고정 \(R_\#^r\partial^\alpha\) 정규화와 42개 physical/covariant 행의 의미도 이번 교정으로 바뀌지 않는다.

## 4. 직접 확인한 관측 기록

### 구 지도 source attempt 3

최종 source JSON과 별도 process JSON을 읽었다.

- source 8/8, `pass:true`, `complete:true`, exit 0.
- 별도 process `timeout:false`, 1595.3374762349995초, peak RSS 5,428,256,768 bytes.
- source SHA: `905e88f8cc70a977f362e4841346f2e535baeb3eb1340123547329705737e7c5`.
- process SHA: `a30b88d8c4986ba3ee0369dd3b78c7c539d4d4c91c2a7dcddc86977efdaeec39`.
- source에 새 `originalTorusMap` 필드가 없음을 직접 확인했다.

이는 구 구현이 자기 source 검사들을 통과한 사실이다. 원문 지도와 다르므로 교정된 원문 source의 PASS가 아니다.

[설치 음성 대조 기록](../original-radial-exponent-20261011/legacy-execution-install-rejection.json)은 실제 `node --max-old-space-size=512 .../pin-physical-center-executed-evidence.mjs 3` 실행의 exit 1을 보존한다. 거절 이유는 원래 (6.2)의 관측 binding 누락이며, 설치 artifact가 생성되지 않았다고 기록돼 있다. 해당 실행의 pin-script SHA는 아래 읽은 최종 pin 파일과 일치한다. 본 검토자가 이 명령을 재실행하거나 구 결과를 수정하지 않았다.

### 교정 경량 회귀

[최종 caller 경량 기록](../radial-phase-exponent-correction-20261011/corrected-radial-phase-final-light.json)은 kernel 31/31와 geometry 직접 import 2/2, 각각 관측 exit 0을 보존한다. 이전 전체 `source.test.mjs`의 진입 전 installed-evidence import 실패도 별도 기록으로 남아 있다. 성공을 얻기 위해 임시 설치 인증 파일을 만들지 않았다.

[physical-center 경량 원 로그](../radial-exponent-correction-20261011/physical-center-map-correction-light-attempt1.log)의 실제 spec 출력에서 tests 11, pass 11, fail 0을 직접 읽었다. 최초 receipt의 TAP 전용 parser가 비워 둔 `counts:{}`는 원본을 덮어쓰지 않고 [별도 counts addendum](../radial-exponent-correction-20261011/physical-center-map-correction-light-attempt1-counts.json)에서 정정했다. 새 두 검사는 원래 palette logarithm의 full \(\kappa_s\)와 잘못된 half exponent를 구분하고, equation/inverse가 같은 literal radial root를 소비하는지 확인한다. 범용 inverse의 source membership 승인은 여전히 false다.

이 모든 경량 검사는 corrected physical constructor의 전체 원본 실행을 대신하지 않는다. 새 source를 직접 관측한 뒤 새 certificate/pin/build/runtime 검증을 계속해야 한다.

## 5. 이 검토의 고정 바이트

| 파일 | SHA-256 |
|---|---|
| `source-radial-phase-exponent.mjs` | `09ffa7aca344391d39de50f38a9a4c67f175d6d500e4514ac6a86e591768ab7c` |
| `actual-common-physical-center-enclosure.mjs` | `f60441131a2650b15b5f3f2aa8894a0462eb0383735a256d895e0c10c70fe6eb` |
| `actual-physical-center-kernel.mjs` | `8f65b781a5b68eb993db4789943e2c09bd05957543749a9582adbab4274b7e08` |
| `tests/actual-physical-center-full-jet-staged-source-check.mjs` | `371ace04ec7d8284b8b447ae5db3344576436b4f7d4db3578d84e3591b419a40` |
| `tests/actual-common-physical-package-source.test.mjs` | `7ac8f71b7a65db98845a0c2908904ffe5730506853a6e39f8f45e41d9dcb3c38` |
| `tests/pin-physical-center-executed-evidence.mjs` | `c8571d1f7c63c22b418b2f1909b00583759e2698b97da473da1ed4d97c2a53b7` |
| `tests/verify-physical-center-installed-evidence.mjs` | `552ad898f807ab005b98487c95c2f70d5f8bb4fc7e241e6e2e4542984d37d4a5` |
| `actual-physical-center-certified-numerics.mjs` | `8d240786c1a944ed4be4ba577f74a2fae81cf5122d074053d4c0945539bd46ee` |
| `corrected-radial-phase-final-light.json` | `f49c005c63c417f74e3f43a877bb52cd42d1a746b94b50af7c4168d2eb07dd13` |
| `physical-center-map-correction-light-attempt1.json` | `3dd0196512cd8dfafadfee998c01ca0c9a18cf3fa9e7addbf88da0c40c46a76d` |
| `physical-center-map-correction-light-attempt1.log` | `ad7463eb40d87798d05d7825614f27fe6648933858160ef2cc8a6e8f577bddbd` |

다섯 caller의 개별 최종 SHA는 위 `corrected-radial-phase-final-light.json`에 기록된 값과 직접 대조한 diff를 대상으로 한다. 그 기록의 새 실제 source 실행은 pending이다. 이 문서로 원문 M2 완료, 모든 label의 수치 평가, 새로운 Lean kernel 증명, M3 시작을 승인하지 않는다.
