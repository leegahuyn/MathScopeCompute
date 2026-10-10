# 실제 공분산 소스 연결의 독립 검토

검토 대상은 원문 **N5-06 「두 family의 positive covariance」(Blueprint p.60)** 이다. 검토자는 산술·배경 복원 담당 에이전트이며, 아래 실행 중 실제 공분산 구현 파일을 변경하지 않았다. 수학적 원전은 [Navier–Stokes 원문](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)의 (4.26), (6.8), (6.16), (7.24), (7.27)–(7.30)이다.

## 결론과 적용 범위

검토한 생성기는 동일한 실제 N3/N4 소스의 완성된 배경, 이동 위상·편극 ODE, 수렴하는 Volterra 적분, 실제 선도 응력, 두 열의 부호 있는 역행렬 및 전체 느린 분할을 연결한다. 원문 N5-06의 **정확한 함수식·수렴 적분 구성과 공통 기준을 만족하는 함수족**이라는 범위에서 추가 수학적 장애를 발견하지 못했다.

보증 영역은 내부에서 생성한 `ellMinimum` 이상인 모든 원래 정수 band와 `0 < q < qStar`이다. 엄격한 `y_plus, y_minus > 0`은 열린 응력 annulus에서 성립하며, 양 끝점에서는 실제 flat factor에 따라 두 값이 0이고 매끄럽게 연장된다. 화면에서 실행한 유한 anchor가 이 기준을 넘는다는 주장은 별도로 하지 않는다. `exercisedMember`의 band 소속·역행렬 비영성·양수성 인증은 `false`로 유지된다.

`H`의 실제 물리 좌표 행렬식은 음수이다. 양의 하계는 `|det(H)|`에 적용하며, 역원 계산은 실제 부호를 보존한다. 유한 Volterra 항에는 0이 아닌 factorial tail을 유지한다. 전체 `H`의 수치 적분, Navier–Stokes 전체 잔차의 검증 또는 새로운 Lean 커널 증명을 이 검토의 결과로 표시하지 않는다.

## 확인하고 수정한 실제 연결

- 전역 분할의 독립 offset 좌표를 `q → -log(q)/log(2) → nearest band → 각 band의 Q와 C_ell → ell^6 mesh → nearest mesh offset`의 실제 식으로 바꾸었다. 81개의 후보 상자에는 실제 정수 label과 palette center가 연결된다.
- 파동은 `localCoordinateWave → auxiliaryMappedWave → physicalLocalWave`로 합성된다. 최종 식에는 독립 `xi`, `v`, `Yi`가 남지 않으며, 지원 밖의 0 분기가 Volterra 함수의 인증 영역을 보존한다.
- 원문의 `tau = 1 - t`에 맞추어 실제 물리 시간을 `t = 1 - tau`로 복원했다. 이는 원문 p.64의 `C_ell` 및 기존 소스 좌표계와 일치한다.
- Gaussian 적분의 계수와 실제 공분산 열의 mass 하계를 분리했다. 완전한 하계에는 `haarFactor * massLowerCoefficient * sqrt(Ls)`가 들어간다.
- 이전 요청의 함수 그래프를 누적하던 mutable background cache를 제거한 소스를 확인했다. 반복 실행의 최종 해시는 별도 재실행 증거가 담당한다.

## 실제 실행한 검토

새 Node 프로세스에서 `prepareActualCovarianceFamilyProgram({anchorOrder: 1, terms: 1})`을 실행했다. 준비 시간은 약 **24.60초**, 검토용 식을 덧붙이기 전에는 **316,480개 노드**, 생성기 자체 검사는 **26/26 통과**였다.

별도로 다음 **13개 검토**가 통과했다: `t + tau = 1`의 정확한 유리식 항등식, 실제 `h/q/Q`의 세 root 일치, 두 실제 `H` 역원 항등식, 실제 두 `H` 열의 보존, 완전한 mass 하계, 실제 물리 좌표만을 사용하는 분할 offsets, 81개의 상자와 상자 안의 두 sign, 물리 파동에서 독립 로컬 좌표의 제거, source-only threshold program, 그리고 음성 대조 후 두 private 인증의 정상 복원이다.

**4개 음성 대조**에서는 복제 operator, 복제 partition, 소스 `h` root 재지정, 상자 행 중복이 모두 `INVALID_SOURCE_CONSTRUCTION`으로 차단됐다. 공개 API의 잘못된 소스·호출자 제공 필드/목표/완료 플래그·band 형식 및 자원 제한에 대한 **10개 입력 대조**도 예상 오류 코드로 차단됐다. 검사별 ID, 실행 요청과 결과는 `../evidence/actual-covariance-source-review.json`에 보존한다. 이 수들은 별도의 검토 실행이며 프로젝트 전체 회귀 테스트 수에 자동으로 가산하지 않는다.

## 해시 및 재현 기록의 범위

음성 대조와 추가 항등식 검토는 메모리의 그래프에 임시 노드를 추가했다. 그러므로 그 실행 끝에서 계산한 `8f202b22…5a3e4`는 **검토 후 그래프의 진단 해시**이며, 기본 생성기 재실행·Worker·배포 해시로 사용하지 않는다. 소스에만 의존하는 threshold program 해시는 `da2db77ef2fdaaf4a61aeb7650a15e04cdc460a6f2a2810d079ea4ad741df1d2`였다.

동반 JSON의 파일 SHA-256은 검토 직후 읽은 소스 바이트의 관찰 기록이다. 실행 전에 고정한 release manifest로 표시하지 않는다.

후속으로 구현 담당자의 `tests/actual-covariance-source.test.mjs`와 실제 생성된 재실행 기록을 읽어 확인했다. 동일 프로세스의 `default → ellExact:1 → explicit default`에서 첫 번째와 세 번째 **전체 canonical packet, graph SHA 및 root IDs가 일치**했고, 세 요청의 threshold SHA도 같았다. 소스 suite는 담당자가 **11/11 통과**로 보고했으며, 이 검토자가 같은 suite를 다시 실행한 수로 중복 집계하지 않는다. 정상 기본 그래프는 **316,480개 노드 / 12,675,574 bytes**, compact packet은 **130,618 bytes**, graph SHA는 `c3c1979a569c2f995fe7c6332e34b5d5a7f068207be0f7690c14d1dccc6e1d4c`이다. 이는 앞의 임시 검토 그래프 해시와 구별된다. 배포 브라우저 검증은 해당 최종 증거를 별도로 참조해야 하며, 이 문서는 라이브 배포 통과 여부를 생성하지 않는다.
