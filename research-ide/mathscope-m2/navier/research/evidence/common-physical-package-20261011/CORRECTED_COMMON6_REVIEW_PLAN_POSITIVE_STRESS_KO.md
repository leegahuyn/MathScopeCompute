# 교정된 common source6의 독립 검토 범위 — 실행 대기 기록

작성: 2026-10-11 14:58 UTC, `positive_stress`.

**이 문서는 검토 기준을 고정하며 완료를 판정하지 않는다.** 작성 시 source6은 실행 중이고 최종 source/process receipt는 아직 없다. 기존 common source5의 실행·검토와 당시 해시는 그대로 보존한다. 이후 source6 결과는 별도 완료 부록에 기록한다. M2 gate와 M3 상태를 편집하지 않는다.

## 교정과 비교 기준

원문 NS PDF SHA `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`, 인쇄 p.63의 식 (6.2)는

\[
d_r=2\big((1+h)\rho_g-h\kappa_s\big),\qquad
\rho_g=\frac{\log(4-\sqrt2)}{\log(4+\sqrt2)},\quad
\kappa_s=1/100000
\]

이다. 원래 고정 양수 `h`와 parameter expression SHA `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`를 바꾸지 않는다. 원래 식의 바깥 2를 생략한 실행은 수정된 물리장의 완료 증거로 재사용하지 않는다.

common5의 120파일 manifest를 현재 source와 직접 대조했을 때, 기존 파일 중 변화는 다음 다섯 개였다.

| 파일 | source6에서 필요한 의미 |
|---|---|
| `actual-common-global-wave-bounds.mjs` | 같은 원문 helper로 radial norm 지수를 생성하며 전체 `epsilon^(-kappa_s)` 비용을 유지 |
| `actual-covariance-source-certificate.mjs` | 실제 auxiliary torus map의 원래 `d_r` |
| `actual-full-curl.mjs` | 실제 원래 phase/physical curl 생성 시 같은 지수 |
| `source-geometry.mjs` | 원래 geometry 생성 시 같은 지수 |
| `tests/actual-common-physical-package-source.test.mjs` | 실제 physical graph의 원문 식 (6.2) typed body assertion 추가 |

새 `source-radial-phase-exponent.mjs`와 source6 runner가 추가된다. 기존 background residual, E_B, common covariance와 Gaussian algebra 모듈의 수학 본문은 common5 실행 당시 bytes를 유지한다. 새 runner가 복사한 실제 118파일 snapshot/최종 manifest를 완료 시 다시 대조한다. 모든 graph SHA가 바뀌어야 한다는 조건은 두지 않는다. radial map을 소비하지 않는 원래 source 부분이 같을 수 있다.

## 완료 후 읽을 실제 근거

1. **실행과 원본 식.** 외부 process의 exit 0, timeout false, source `complete:true`, 여덟 실제 source 검사와 각 내부 검사, 최종 manifest 불변 및 모든 snapshot SHA를 확인한다. `assertions.originalTorusMap`의 specification, 원래 `h`·`Tg`, typed 연산 노드가 실제 `certificates.physical.geometry.physicalMap.dr`에 연결되어야 한다. `oldMissingFactorAccepted:false`와 원문 helper의 정확한 괄호를 확인한다. source4 숫자점과 source6 symbol graph의 정수 root ID를 서로 동일시하지 않는다.

2. **같은 공통 family.** 실제 `C3`, 모든 velocity/pressure/stress diagonal clause, n=1 weighted endpoint 조건, 원래 최소 scale 및 재귀 gap을 확인한다. background, covariance, physical curl, global norm, E_B가 같은 `b_n`와 같은 private family를 사용해야 한다. 별도의 잔차용 cutoff sequence를 도입하거나 실행한 하나의 label로 나머지 label을 대체하지 않는다.

3. **완전한 물리 curl.** 두 부호의 원래 40-component third variations, 원래 `sqrt(y)`의 도함수, pressure, rounded carrier, full phase, χ·ψ·slow partition, 원통 기저와 connection 및 실제 좌표 합성을 확인한다. 경계에서는 inverse나 square root를 평가하기 전에 원래 supported zero extension을 적용해야 한다. `curl remainder = full curl - primary`의 원래 3성분은 보존한다.

4. **모든 label의 상계와 양 끝.** 실제 norm graph의 `sourceCutoffAndMapConstants`가 원래 지수를 소비하고 radial 미분 비용 `epsilon^(-kappa_s)`를 물리 Q 손실과 유한 S 상계에 넣는지 읽는다. 원래 target N0/N1의 pole 3/6, 안쪽·바깥쪽 Gaussian factor, 모든 고정 차수 inverse/sqrt 재귀, 81개 partition 후보, mesh 합과 최대 두 active band가 필요하다. `flatConstant`에는 두 band 인자 2를 곱하며, 이미 모든 band를 합하는 `infiniteTail`에는 다시 곱하지 않는다. 꼬리를 0으로 바꾸지 않는다. η 끝점은 원래 T≥0 쪽의 한쪽 regularity이다.

5. **실제 temporal force.** `psi_prime × complete curl` 및 모든 시간 cutoff 미분 항을 유지한다. ψ로 나누거나 primary만으로 대체하지 않는다. 실제 모든 label의 정량 Gaussian 합으로 모든 고정 미분과 flat order를 제어하는지 확인한다. derivative order m에 필요한 C_(m+3)나 higher target norm이 없을 때 C2로 대체하지 않는다.

6. **같은 source의 E_B.** leading 전체 heat·I/J/S/Cp moments·axis pressure·두 shear와 positive 다섯 conservative moments를 유지한다. n=1은 완전히 수렴하는 heat-subtracted angular moment 및 남은 viscosity tail을 사용한다. 모든 ordered quadratic pair, radial stream cutoff commutator와 그 도함수, 응력의 원통 connection을 확인한다. 실제 `E_B = NS(u_B,p_B) + div(T_B)`를 독립 계산한 식으로 보존한다. 미리 0으로 정의하지 않는다. 임의 고정 차수의 비교 정리는 같은 `b_J`를 사용하고 물리 손실 `2A+1+m`이 truncation N과 무관해야 한다.

7. **Covariance와 N6 경계.** target과 같다는 결론은 θ 평균 뒤 정규화 Haar 평균을 취한 **primary** covariance이다. 원래 full curl의 점별 NS 곱을 평균으로 바꾸지 않는다. signed inverse의 실제 H 두 column과 양의 고정 amplitude를 유지하며, 임의 입력에 M_alpha 소속을 발급하지 않는다. 원래 추가 전제 U∈W_(1/2), nonlinear square와 curl remainder 및 full NS residual은 N6 인터페이스에 남는다. N6 correction 자체가 수행됐다는 결론은 금지한다.

8. **최종 private 인증.** 복제 객체·변조 입력 거부와 append 후 기존 certificate hash 안정성을 확인한다. 모든 실제 package가 한 번씩 만들어지고 validator가 다른 source를 새로 생성하지 않았는지 확인한다. 이 확인은 algebra/analytic proof를 읽은 결과와 실행한 원본 source를 연결하는 것이며 검사 개수 8을 전칭 정리의 증명으로 취급하지 않는다.

## 판정의 허용 범위

위 조건을 모두 실제 source6에 연결할 수 있으면 원문 radial map에 영향받은 G-CURL과 G-N5의 재검토를 닫을 근거가 된다. G-POS와 G-N4의 같은 source 결속도 함께 재확인한다. 임의 유한 차수 constructor와 source에 결속된 귀납 논증이 전칭 범위를 담당하며 무한히 많은 graph를 문자 그대로 실행했다고 쓰지 않는다.

G-NUM의 교정된 physical source4, 270 도함수 행·정확한 양의 배율·두 `w_minus` VALUE, 설치 pin, source/Worker/browser/replay는 별도 실행 및 검토가 필요하다. 전체 M2 완료와 배포 gate는 root의 통합 판정 대상이다. 기존 G-LEAN의 실제 analytic instantiation 미완 상태를 새로운 Lean 완료로 바꾸지 않는다.

이 문서의 검토자는 G-N4 일부 모듈의 작성자다. 그 부분의 독립 수학 검토는 이미 보존된 root 및 `ns_proof_audit` 기록과 함께 사용해야 하며, 본 문서만을 두 번째 독립 검토자로 세지 않는다.
