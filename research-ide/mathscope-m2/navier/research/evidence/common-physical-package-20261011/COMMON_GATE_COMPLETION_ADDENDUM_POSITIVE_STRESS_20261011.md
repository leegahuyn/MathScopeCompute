# 공통 물리 패키지 실행 후 네 관문의 완료 검토 부록

## 판정

**원래 G-POS, G-CURL, G-N4, G-N5의 완료 판정을 지지한다.** 앞선 조건부 검토에서 요구한 실제 공통 source의 생성, private source 연결, 원래 식의 정량 논증, unchanged import, 최종 실행 증거가 이번 source attempt 5에서 함께 충족되었다. 기존 검토에서 식·범위·상계를 읽어 판정한 수학적 내용에 이번 관측 증거를 연결한 결과이며, 8이라는 검사 개수를 정리의 증명으로 사용한 판정이 아니다.

`COMMON_GATE_SCOPE_POSITIVE_STRESS_REVIEW_KO.md`는 작성 당시의 조건부 상태와 SHA를 그대로 보존한다. 이 문서가 이후 실행 결과를 추가한다. G-NUM의 새 물리점 유한 수치 도함수 연결은 별도로 남으며, 전체 M2 완료나 M3 시작을 이 부록에서 선언하지 않는다. gate JSON도 편집하지 않았다.

## 직접 확인한 실행

| 항목 | 관측 결과 |
|---|---|
| 시작 / 종료 UTC | 2026-10-11 12:14:22.275968 / 12:36:46.714929 |
| 외부 관측 종료 | exit 0, timeout false, interrupted false, runnerError null |
| 최종 source receipt | complete true |
| 실제 검사 | 8개 성공, 실패·취소·생략 0 |
| 총 시간 / peak RSS | 1344.4085952669993초 / 4,893,794,304 bytes |
| 실행 HEAD | 6a3e71a884e6faebe808fd67fd0274304a7f45e4 |
| 현재 source 대조 | runner의 120개 파일 해시를 재계산; 불일치 0 |
| CPU 진단 | 실행 중 trigger되지 않음; 프로파일을 수학 증거로 사용하지 않음 |

source JSON, process JSON, 최종 TAP 로그를 각각 직접 읽었다. 각 package의 원래 graph SHA와 모든 내부 checks가 성공인지 확인했고, backgroundFlatness의 6개 assertion과 실제 E_B의 5개 assertion도 직접 대조했다. 생성 횟수는 commonFamily, ownBand, actualPhysicalCurl, actualTargetN1, globalWave, globalCovariance, sameBackgroundFlatness, sameActualEB 각각 정확히 1이다. validator는 source를 다시 생성하여 다른 객체를 검사하지 않는다.

실제 실행 prefix는 2, background slow order는 3, target weighted order는 1, global wave order는 0, 요청 flat order는 4이다. G-N4의 별도 실행 검증은 finite N=2, derivative m=0, decay P=1이다. 이것을 무한한 모든 그래프의 문자 그대로 실행으로 확대하지 않는다. 전칭 결론은 실제 원본 constructor의 임의 유한 차수 재귀와 source에 결속된 모든 고정 차수 정량 증명으로 지지된다.

## 각 관문의 연결과 범위

### G-POS

같은 공통 admissible family의 실제 own band, 원래 두 Volterra column, 원래 H와 target, inverse, 양의 square root가 한 실행에서 결속되었다. 공통 Γ의 모든 label에 적용하는 determinant·weight 하한, weighted target의 안쪽·바깥쪽 flat factor, inverse/sqrt pole과 양 끝 Gaussian을 결합한 smooth zero extension이 최종 globalWave certificate에 포함된다. 열린 shell에서 `y_j >= c_y*zeta > 0`이며 shell 경계의 ζ=0에서 strict positivity를 주장하지 않는다. η 끝점은 원래 물리 측의 한쪽 regularity이다.

과거 ell=1 예제 또는 수치 양성 실패를 소급하여 바꾸지 않는다. 실제로 사용한 새 공통 Γ member와 그 family의 전칭 source 증명이 이번 완료 범위이다.

### G-CURL

원래 slow partition·χ·ψ·sqrt(epsilon)·sqrt(y), rounded carrier와 full phase, 움직이는 normal, 원통 기저·connection, 물리 좌표를 유지한 완전한 curl이 생성되었다. 원래 3차 variation body로 공간 2차·시간 1차 velocity와 pressure gradient가 결속되어 있다. 원래 81개 국소 partition 후보, palette, 16개 beta·32개 sign, 겹치는 최대 두 band의 정량 상계와 locally finite 합이 연결되었다.

실행한 한 label의 값으로 다른 label을 대신하지 않으며, 모든 label에 같은 원래 constructor와 같은 공통 sequence를 사용한다. 각 항의 실제 divergence 0, smooth joins와 locally finite 합으로 전역 결론이 성립한다.

### G-N4

원래 leading 전체 heat·I/J/S/Cp moments·axis pressure·두 shear 항과 positive coefficient의 다섯 conservative moments를 보존한 finite cancellation에 같은 공통 b_n를 결속했다. n=1의 complete convergent heat-subtracted moment와 남은 viscosity tail을 유지한다. 모든 ordered quadratic pair, radial stream cutoff commutator, 응력의 원통 connection이 실제 식에 남는다.

최종 E_B는 실제 physical graph의 독립 NS background vector와 실제 stress divergence의 합이다. 같은 source와 cutoff sequence에서 모든 고정 미분의 flatness 정리가 이 E_B에 결속되었다. M_eta 원본과 optimized body의 차이는 copied prefix 바이트와 실제 body identity로 증명했으며, sibling graph ID를 가져오지 않았다. 최종 E_B certificate의 `wholeGN4Complete`는 true이고 원래 전체 uncorrected NS 잔차의 flatness는 false로 유지된다.

본 검토자는 G-N4 일부 모듈의 작성자이므로 이 부록 자체를 그 부분의 독립 수학 검토로 세지 않는다. 이미 보존된 root 검토와 ns_proof_audit의 `INDEPENDENT_FINITE_AND_COMMON_RESIDUAL_REVIEW_KO.md`, 원래 leading derivative body 수정 검토가 독립 검토를 담당한다.

### G-N5

원래 Cartesian full NS의 background/wave 양방향 교차항, self-advection, eikonal 잔여항이 유지되었다. temporal force는 ψ′에 곱한 전체 curl이며, primary만으로 바꾸거나 ψ로 나누지 않는다. 모든 label과 양 끝의 Gaussian/pole, 원래 norm·partition·band 합을 연결한 all-fixed-order flat force가 인증되었다.

Covariance는 실제 angular 평균과 Haar 평균을 모두 사용하여 primary의 epsilon*H*y를 얻고, 점별 원래 NS tensor는 별도로 보존한다. signed inverse는 실제 양의 primary amplitude 주위의 선형 연산이며, 입력의 M_alpha 소속과 U in W_(1/2)를 자동 인증하지 않는다. retained full residual, curl remainder, 원래 지수와 support는 N6 입력으로 남는다. N6 correction 자체, N7 compact force·energy, N8 reconstruction은 이번 package의 범위에 들어가지 않는다.

## 보존된 한계와 다음 의존성

이 네 관문을 계속 열어 두어야 할 별도의 해석적 의존성을 현재 원래 기준과 실제 source에서 찾지 못했다. G-NUM에는 새 물리점에서의 finite weighted/curl 도함수 directed enclosure와 양의 정규화 인자의 수치 또는 엄밀한 log/scaled 평가가 별도로 필요하다. 이 부록은 numerical derivative false를 true로 바꾸거나 전체 M2 완료를 선포하지 않는다.

이전 source 1/2 실패, source 3 timeout, source 4 stale-log partial checkpoint·interruption은 원래 증거대로 보존한다. attempt 5의 성공은 이전 실패를 성공으로 재분류하지 않는다. source 4의 unattributed partial JSON도 완료 증거로 사용하지 않았다.

## 고정 해시

- 조건부 검토: `63bf26ec55551c12b6cb837c5faa2ba137bc9c57b8a533d30b8923d7e6870abd`
- source attempt 5 JSON: `44137485e789ef29c6f5ee51dfdcc294102bda3d51f15d442601c859876d04eb`
- observed process JSON: `7616a3134599d15fc6e0e98bc761f129199ce62c83eafc145058b86848c80b0e`

별도 JSON 부록에는 로그 SHA, 여덟 graph SHA와 node 수, 현재 120 source 대조, 모든 실행 조건을 함께 기록했다.

검토 UTC: 2026-10-11T12:42:16.305877+00:00
