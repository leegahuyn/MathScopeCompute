# 원래 9개 잔여 조건의 최종 형식 연결 후 독립 판정

판정일: 2026-10-10 UTC / KST. 정확한 동결 시각은 같은 이름의 JSON에 기록한다.  
이 판정에 포함한 보호 Comparator의 실제 관측: 2026-10-10 00:10:05.202 UTC.

## 1. 판정: 9개 중 8개 충족, 보호 Comparator 1개 미완료

**원래 남은 9개 조건 중 8개를 충족했다. N1-06의 보호 Comparator 최종
실행 결과만 아직 확인되지 않았다.** 새 무한 axis의 실제 Lean 입력,
고정점, 모든 차수의 도함수 오차, 실제 유한 배열 및 양방향 절단·반올림
오차의 연결이 완료되어 N3-03을 새롭게 PASS로 판정한다. 원래 70항목에
이번 후속 증거를 적용한 별도 집계는 **69 PASS / 1 PARTIAL / 0 BLOCKED**다.

기존 61/7/2 기준표와 그 뒤의 68/2 판정은 모두 원래 바이트로 보존한다.
이 문서는 그 두 문서를 수정하는 대신 새 증거로 발행한 후속 판정이다.
이전 조건부 정리와 실패한 실행의 완료 플래그도 바꾸지 않는다. 전체
70항목 또는 9개 조건 모두의 완료를 주장하지 않는다.

| 항목 | 사용자가 지정한 원래 잔여 조건 | 현재 판정 | 실제 근거 또는 남은 조건 |
| --- | --- | --- | --- |
| N1-05 공식 Lean 환경 고정 | 원문 전체 기본 빌드의 성공 종료 확인 | **충족** | 고정 원문 전체 `lake build`가 2026-10-09 20:59:06 UTC 실제 exit 0. 전체 11,424 작업 로그와 원문·커널·환경 감사를 보존했다. |
| N1-06 의존성과 Comparator | 원문 보호 조건을 유지한 독립 Comparator 실행 | **부분 완료** | 실제 run 37979127351 / job 113984853927이 마지막 관측에서 진행 중이고 conclusion은 null이다. 필수 nanoda, 보호 설정 및 원문 보존을 증명하는 최종 artifact가 아직 없다. |
| N3-01 상수 선택 순서 | 하나의 완성 프로파일에 대한 전체 매개변수 계층 | **충족** | 동일 63개 정확 식에 실제 source bound, gap bound, 하나의 유한 N 및 모든 보정 근을 연결했다. |
| N3-02 외곽과 압력 datum | 보정한 장의 압력과 A.21 목표 압력의 동일성, 모든 eta의 정확 모멘트 | **충족** | 실제 A.21 전체 적분과 B.8·I2·I1의 모든 eta 모멘트 보존을 같은 최종 장에 연결했다. 새 형식 체인도 그 실제 압력 함수를 사용한다. |
| N3-03 축과 수렴 멱급수 | 무한 고정점·유한 jet·반올림 오차·Lean 전제의 연결 | **이번에 충족** | 실제 analytic/norm 입력으로 원래 고정점 정리를 적용했다. all-n/m recurrence, 실제 125개 배열, 양방향 tail/roundoff, 원래 f0 fixture 및 실제 Phi>1/4를 연결했다. |
| N3-04 core 복원 | 같은 무한 프로파일의 정확한 선도 항등식 | **충족** | 같은 무한 방정식에서 Cartesian 정칙성과 정확한 leading 항등식을 도출하고 실제 core·혼합 도함수 배열에 양의 오차를 부착했다. |
| N3-05 다섯 모멘트 접합 | 연속 적분의 엄밀한 포위와 전체 eta의 interval Newton 인증 | **충족** | 실제 incoming debt, 연속 5×5 비선형 포함과 모든 이차항, 전체 eta의 작은 근을 동일 source에 결속했다. |
| N3-06 cone 변조 | 같은 최종 프로파일의 전 영역 strict cone 및 균일 복원 | **충족** | 실제 S와 gap 하한으로 원래 loop/C.12를 적용하고 N=1+ceil(R^50), kappa=R^-10을 같은 최종 장에 얻었다. |
| N3-07 지지와 끝점 | 같은 최종 장의 stress·flat factorization·끝점 극한 | **충족** | 최종 stress는 지정 annulus 밖에서 0이고 내부에서 min(C^-11,R^-8) zeta 하한을 갖는다. 양끝 flat factor와 방향 극한, 예약 power-law patch가 보존된다. |

원래 기준은 설계도 p.52, pp.55–56, 인수인계 p.4, p.10 및 변경하지 않은
[원래 70항목](../../evidence/original-acceptance.json)과
[NS_GATES_EN.md](../../../docs/NS_GATES_EN.md)를 따른다. 두 PDF의 정확한
SHA-256과 페이지, 9개 원문 criterionText 및 detailText는 새 JSON에 그대로
복사하고 원본과 대조했다. 별도 69/1 집계는 수학적 진척도의 백분율이 아니다.

## 2. 이전 68/2와 달라진 정확한 한 조건

역사적 [68/2 판정](ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10.json)의 SHA-256은
`913faa68844dc0f8108ea6b3e0a2144dfcd6e2d2213c4861954f67e99ab476a9`다.
그 시점에는 실제 pressure 및 함수 입력의 해석학적 전제를 원래 Lean
구조체에 모두 공급하고 실제 고정점 정리를 적용하는 부분이 남아 있었다.
지금은 아래의 실제 consumer가 이를 공급한다.

| 형식 연결 단계 | 실제 증명 내용 |
| --- | --- |
| SameDatumInputs / SameDatumMass | 같은 h, j, sigma, rho 및 실제 angular/pressure 함수의 holomorphy와 전체 clock 적분 경계 |
| FieldBounds / PressureSelection | 실제 11개 계수 입력과 compatible-data 항등식, 실제 decay hold의 양성, ideal prefix 및 원래 PressureData |
| AmplitudeInput / AmplitudeDynamics | 같은 Q, Lambda, C의 실제 진폭 norm과 실제 로그 도함수 |
| ThresholdBridge / OperatorBounds | literal original threshold와 모든 실제 field/operator/resolvent bound, Q^64의 허용성 |
| ConcreteProducer | 실제 invariant ball 안의 유일한 무한 고정점, 29/Q^53 오차, 원래 IsScaledSolution, 모든 차수의 UniformMixedError |
| AxisFiniteJet / SelectedReferenceBoxes / ConcreteFiniteJet | 정확한 계수 연결, 실제 eta=0의 25개 dyadic box, radial tail 및 실제 rounding |
| ConcreteJetRecurrence / MixedEtaBindings | 실제 모든 n,m,eta recurrence와 25×5 projection, 실제 reference의 모든 eta 도함수, 양의 eta chart 및 정확한 chi 식 |

`ConcreteProducer`에는 호출자가 채우지 않은 진폭 norm, pressure predicate
또는 실제 데이터의 해석학적 전제가 남아 있지 않다. 선택한 고정점은
원래 가중 계수공간에서 실제 reference와 거리 1 이내이고, 원래
contraction factor는 1/2 이하이며, 날카로운 오차는 29/Q^53이다.
원래 정리와 실제 입력의 연결을 직접 검사한 커널 결과가 있다.

그 형식 객체가 이미 쓴 continuation의 무한 axis와 같은 이유는 같은
매개변수·압력 적분·진폭·고정점 방정식을 사용하고 같은 invariant ball
안의 유일성이 있기 때문이다. 일부 수치 endpoint가 가깝다는 관찰로
이 동일성을 대신하지 않았다. 이 판단은
[최종 독립 연결 검토](FINAL_FORMAL_CONNECTION_REVIEW_2026_10_10_EN.md)에
원래 체크리스트 여섯 항목별로 기록했다.

## 3. 실행 증거의 범위를 구별했다

원문 rc2 환경에서 새 디렉터리의 custom object 수가 0임을 확인한 후
**13개 모듈을 실제 새로 컴파일**했고, 그 정확한 prefix를 사용해
**MixedEtaBindings 한 모듈을 추가 컴파일**했다. 모든 컴파일은 exit 0이다.
총 14개 모듈의 110개 출력 선언에 대한 axiom audit는 `propext`,
`Classical.choice`, `Quot.sound`만을 포함한다. prefix를 두 번 새로
컴파일했다고 표현하지 않는다.

[별도 import 감사](../followup-20261010-same-datum-axis/formal-input-producer/replay-independent-audit/attempts/0001/receipt.json)는
343/343을 통과했다. 실제 원래 Lean parser와 object resolver가 각
custom import를 새 출력의 정확한 경로와 SHA로 찾는 것을 확인했다.
보존한 launcher는 직접 `--deps`를 전달하지 못하므로 그 exit 1 로그를
남기고, 원래 Lean.Shell의 같은 구현인 `Lean.Elab.printImports` API를
실제로 실행했다. launcher나 커널을 고치지 않았다.

새 [독립 연결 감사](formal-connection-review/0001/receipt.json)는 이 기록을
그대로 믿고 집계하는 데 머물지 않고 실제 source/object/log, 110개
선언, dependency 경로·해시, 정확한 125개 중점·반경과 오차 합을 별도로
대조해 **883/883**을 통과했다. 이 883개는 새로운 Lean 컴파일이나 수학
정리의 개수를 뜻하지 않는다. 모든 원문 2,669 tracked file과 원래 커널의
해시는 보존되었다.

## 4. 실제 125개 배열과 유한 eta chart

실제 reference의 정확한 n차 계수는 모든 실제 eta에 대해

\[
B_n(\eta)=\frac{(-\chi(h,j,\sigma,\eta)/2)^n}{n!(n+1)!}
\]

다. 모든 eta 도함수의 정확한 항등식과 실제 nonlinear 계수의 차이 경계가
커널 증명되어 있다. xi=eta/j의 Taylor 계수는 j^m/m!로 정규화하고,
도함수 값의 별도 표는 j^m로 정규화한다. n=0의 실제 계수는 정확히 1이다.

실제 interval consumer는 n=0..24, m=0..4의 125개 계수를 정확 유리수로
검증하고 각 nonlinear interval의 중점 c_nm과 반경 d_nm을 직렬화했다.
이 중점들이 정의하는 한 유한 다항식 M에 대해

\[
0\le Y\le4.1,\quad |\eta|\le\rho/4,\quad
\xi=\eta/j,\quad |\xi|\le2^{-16000}
\]

인 **연속 영역 전체에서**

\[
|\Phi_{\rm selected}(Y,\eta)-M(Y,\eta/j)|<2^{-118}
\]

을 얻었다. nonlinear value error, eta Taylor tail, radial factorial
tail, nonlinear finite-block error, 실제 directed rounding을 각각
포위한 정확 합은 더 강하게 2^-119 미만이다.
[실제 binding](../followup-20261010-same-datum-axis/independent-review/actual-mixed-eta-binding-001.json)의
812/812 검증에는 임의의 c, delta, hround 가정이 남아 있지 않다.

이 계산은 125개 수치 box 전부를 Lean 커널 안에서 재계산했다는 뜻이
아니다. 실제 커널 항등식에 정확 interval 계산을 연결한 증거다. 원래
기준에는 모든 interval 연산을 커널에서 반복하라는 요구가 없으므로
그 구현을 새 필수 조건으로 덧붙이지 않았다. 반대로 비교함수만의
복소 xi disk |xi|<=1/16을 nonlinear 해의 영역으로 넓혀 주장하지도 않는다.
유한 eta chart의 범위와 전 실수 source window의 무한해·모든 차수 경계를
분리하여 명시했다.

## 5. 원래 f0 fixture와 실제 Phi 양수성

원래 요구한 값은

\[
f_0(4.1)=0.2711140554036643841027965\ldots
\]

다. 이번 독립 검증은 40개 정확 유리수 항과 다음 alternating term으로
이를 다시 포위했다. 그 정확 구간은 원래 outward interval
`[0.2711140554036619, 0.27111405540366706]` 안에 포함된다.
이는 새 실제 nonlinear Phi(4.1,0)의 근사값
`0.2711141757820183`과 다른 값이다. 새 reference는 eta=0에서
chi=4000000/4000001을 사용하므로 두 값을 혼동하지 않는다.

실제 모든 eta에서 0<=chi<=1이고, 0<=z<=4.1에서 alternating series의
정확한 3차 하한은

\[
f_0(z)\ge1-z/4+z^2/48-z^3/1152\ge305719/1152000.
\]

실제 무한해의 zeroth-order 오차는 2^-100보다 작으므로 같은 전 구간에서
Phi=phi/phi-star>1/4>0이다. 이로써 원래 수락 문구의 fixture와 실제
프로파일 양수성을 모두 충족했다.

## 6. 동일 최종 프로파일의 나머지 조건과 보존 범위

N3-01·02·04·05·06·07의 판정은 이전에 독립 검토한 실제 동일 source
assembly와 연속 증명에 근거하며 이번에도 같은 대상을 사용한다.
one-profile-0002는 63개 정확 식과 137개 입력 사본을 연결하며 292/292,
그 독립 전체 감사는 295/295다. 정확 매개변수 SHA는
`e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`,
증거 SHA는
`ff3b1590aa49499417910962736fe2deb8e6088acd7d77e281fd8aba6807c206`이다.

그 실제 장의 A.21 압력, all-eta B.8·I2·I1 모멘트, 하나의 유한 N을 통한
strict cone, 최종 stress 및 끝점 논증은
[이전 독립 전체 검토](ONE_PROFILE_ASSEMBLY_INDEPENDENT_REVIEW_EN.md)와
[역사적 판정문](ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10_KO.md)에 있다.
새 N3-03 형식 연결은 그 결과를 다른 프로파일로 교체하지 않는다.

이번 판정으로 전역 nonlinear 표현 그래프를 모든 eta에서 직접 수치
평가했다고 주장하지 않는다. 또한 외곽·continuation·cone·stress·끝점의
전체 연속 논증까지 전부 Lean으로 형식화했다고 주장하지 않는다.
원래 요구에 맞는 서면 해석 증명과 연속 interval 인증의 역할을 유지한다.

## 7. 정확히 남은 N1-06

2026-10-10 00:10:05.202 UTC의 실제
[관측 013](../followup-20261010-n1-final/github-observation-013.json)에서
보호 Comparator job 113984853927은 진행 중이고 conclusion은 null이다.
완료하려면 실제 최종 run의 nanoda와 Comparator 결과, 종료 코드 및
로그, 정확한 C/D 선언과 axiom 검사, 보호 파일·원문·커널 보존을 함께
확인한 최종 artifact가 필요하다.

따라서 원래 전체 완료 플래그는 false로 남긴다. 이후 관측은 별도 파일로
추가할 수 있으며 이 판정의 시각과 당시 사실을 소급하여 바꾸지 않는다.
후속 실제 실행이 실패하면 실패를 그대로 기록하고 필요한 원인 수정과
보호 실행의 재검증으로 이어져야 한다.

## 8. 재현과 읽는 순서

새 판정 JSON은 원래 70개 criterion과 NS_GATES, 두 PDF 및 현재 실제 증거의
SHA를 대조한 뒤 원래 문구를 그대로 복사한다. 이 문서의 작성 프로그램은
`write_final_gate_assessment.py`이고 이미 존재하는 출력을 덮어쓰지 않는다.
독립 formal 연결은 `check_final_formal_connection.py`, 이전 전체 결합 감사는
`check_one_profile_assembly_review.py`로 재현한다. 각각 새 결과 경로를
지정해야 한다.

현재 결과를 검토할 때에는 새 판정 JSON, 최종 N3-03 독립 검토문과
883-check receipt, 실제 812-check binding, 13+1 fresh compile receipts와
343-check import audit를 먼저 읽으면 된다. 나머지 6개 N3 조건의 연속
수학 증명과 source 연결은 292/295 assembly의 역할별 증거로 추적한다.
