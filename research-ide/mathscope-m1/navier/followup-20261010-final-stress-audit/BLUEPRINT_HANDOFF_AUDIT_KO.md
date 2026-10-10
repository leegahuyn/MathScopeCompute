# M0–M1 원 요구사항과 동일 최종 프로파일에 대한 독립 감사

## 1. 감사 범위와 판정 원칙

첨부 설계도 99쪽과 인수인계 18쪽의 전체 추출 텍스트를 읽고,
설계도 핵심 수식·체크리스트 페이지를 렌더링하여 대조했다. 아래 내용은
원래 합격 조건을 확정하는 감사이며, 새로운 수학적 완료 선언이 아니다.
저장소의 과거 판정 파일은 이 감사로 수정하지 않는다.

| 기호 | 원본 | 페이지 수 | SHA-256 |
| --- | --- | ---: | --- |
| B | `MathScope_Research_IDE_Blueprint_v1_KO(1)(4).pdf` | 99 | `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac` |
| H | `MathScope_Handoff_2026-10-10_KO(1).pdf` | 18 | `d898fe8e28e4b85e0a666ef98cf10fc611e8b1035c5deb50bec338992a8cb166` |
| P | 사용자 제공 `01-navier-stokes.pdf` | 166 | `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f` |

B의 현재 첨부 파일명 끝은 인수인계에 적힌 `(3)`과 다르지만,
해시·크기·99쪽은 일치한다. 파일명 차이 때문에 다른 판본으로 취급할
필요가 없다. 반대로 다른 수학적 후보의 계산 자료를 이름만 바꿔 같은
프로파일의 증거로 취급해서는 안 된다. [H pp.2, 4, 15]

## 2. 완료율의 세 가지 분모

전체 설계는 28개 패키지 × 8개 항목으로 **224개**이다. M0부터 M4까지
포함한다. 원래 v54 실행 검수의 **70개**와는 다른 분모이다. 현재 사용자
요청은 이 가운데 남은 **9개 조건**의 후속 처리이다. [B pp.12, 88; H p.2]

| 원래 v54 분류 | 항목 수 | PASS | PARTIAL | BLOCKED |
| --- | ---: | ---: | ---: | ---: |
| M0 잔여 | 6 | 6 | 0 | 0 |
| M1 산술·점/P1 | 24 | 24 | 0 | 0 |
| M1 게이지 장 | 16 | 16 | 0 | 0 |
| M1 Navier–Stokes | 24 | 15 | 7 | 2 |
| 합계 | 70 | 61 | 7 | 2 |

M0 잔여는 I0-04, I1-03, I1-07, I3-02, I3-03, I3-04이다.
이미 합격한 M0/M1 부분을 처음부터 다시 만들 이유는 없으며, 고정 입력과
실제 실행 증거의 정합성을 먼저 확인한다. `61/7/2`는 과거 판정으로
보존하고, 후속 성공·실패는 별도 날짜·입력 해시·실행 receipt에 기록한다.
[H pp.2–4, 12, 16]

인수인계 자체는 N1-05의 사용자 지정 잔여 조건을 이미 충족했다고
기록한다. 그 근거는 전체 기본 `lake build`의 실제 exit 0이며,
독립 Comparator 성공과는 별개이다. 이 감사는 인수인계의 정적 기록을
읽은 것이고, 동적인 GitHub job 상태를 새로 관측한 증거는 아니다.
[H pp.1, 4–6]

## 3. 아홉 항목의 원문 합격 조건

| ID | 원문 기준과 실제 완료에 필요한 결속 | 단독으로는 충분하지 않은 결과 |
| --- | --- | --- |
| N1-05 | 공식 commit·toolchain·manifest를 pin하고 cache/build 종료 코드·전체 로그·환경 해시를 보존한다. 사용자 잔여 조건은 원문 기본 대상 전체의 성공 종료이다. [B p.52; H p.5] | 일부 모듈 성공, 실행 중 로그, 최종 종료가 없는 세션, 변경된 기본 대상 |
| N1-06 | 원래 제출 정리의 의존성·`#print axioms`와 C/D Comparator 실제 결과를 확보한다. 원래 guard·필수 nanoda·원문 보존 조건을 함께 만족해야 한다. [B p.52; H pp.6, 15] | 일반 Lean build 성공, Comparator wrapper만의 성공, 생략된 nanoda 또는 약화된 sandbox |
| N3-01 | 같은 완성 프로파일의 모든 충분히 크고 작은 선택을 명시적 상하계 또는 증명된 선택 조건으로 바꾼다. [B p.56; H p.4] | 외곽의 초기 상수만 선택, UI 예시 h 사용, 마지막 N만 임의로 입력 |
| N3-02 | A.4 외곽·A.21 datum·양성 E·외곽 모멘트·네 patch를 같은 입력으로 고정하고, 실제 A.7 열 외곽 변경 후 동일 압력 datum을 복원한다. [B p.56; P pp.129–140] | 목표 압력을 이름으로 지정, 열 수정 전만 검증, 모멘트 오차를 0으로 대입 |
| N3-03 | 같은 A.21 datum의 무한 비선형 고정점과 실제 Bρ norm contraction을 확보하고, 유한 jet·절단·반올림·Lean 전제의 연결을 유지한다. [B pp.56, 81; H p.4] | 유한 jet 계산, 독립적인 조건부 Lean 정리, 이전 datum의 고정점 |
| N3-04 | 같은 무한 core의 E·압력·V0를 원식으로 복원하고 Cartesian 정칙성·발산 0·선도 접선 항등식을 입증한다. [B p.56; P pp.24–28] | 별도 Gaussian core, 유한 sample residual, 완전 NS 잔차가 0이라는 잘못된 확대 |
| N3-05 | 실제 B.5–B.10 inner continuation이 공급하는 같은 소스의 다섯 모멘트 연속 적분을 포위하고 모든 η에 대해 Jacobian 가역성과 interval Newton/implicit 조건을 인증한다. [B p.56; H pp.4, 9] | 범용 5×5 operator만 인증, η 격자 검사, 실제 incoming debt가 빠진 작은 공 모형 |
| N3-06 | 같은 입력의 원문 C.12 위상 변조와 첫 patch 복원을 수행하고, 하나의 유한 N으로 최종 장의 전체 영역 strict cone을 인증한다. [B p.56; P pp.158–163] | loop 존재만 증명, N 선택 조건만 제시, 변조 전 pressure/stress로 최종 cone 검사 |
| N3-07 | 같은 최종 장의 양 끝 stress 0, 모든 내부점 stress≠0, 공통 flat weight, 매끄러운 방향의 양 끝 극한, 두 예약 patch 보존을 확인한다. [B p.56; P pp.33, 140–144] | 외곽 한쪽의 flat 인자, 조건부 endpoint 정리, 서로 다른 후보의 양 끝 결과 |

N3-08의 PASS는 Theorem 4.6(i)–(vi)의 각 항목에 증거 **또는 미해결
이유**가 연결된다는 데이터 계약이다. 이 항목만으로 N3-01–07이나
`full certified profile`이 합격하지 않는다. [B p.56; H p.4]

## 4. N3의 정확한 수학적 목표

M1의 N3 목표는 annular stress를 갖는 **Theorem 4.6의 leading profile**이다.
이 단계의 산출물을 완성된 Navier–Stokes 해로 부르면 범위를 넘는다.
원래 Theorem 1.1의 force를 보존하고, `f=0` 또는 `t=1`의 smooth velocity를
결론에 추가하지 않는다. [B pp.52, 55–56; H p.4]

P p.33의 여섯 조항은 서로 독립적인 메뉴가 아니다. 하나의 `E,U,Π`와
하나의 상수 집합이 동시에 다음을 만족해야 한다.

1. 축을 포함한 모든 유한 반경의 정칙성, 공통 복소 근방의 η 해석성,
   그리고 `Π(X,η)=-∫_X^∞ E²/(2x) dx`.
2. 정확한 방사 압력 균형·선도 접선 잔차 항등식과 stress의 정확한
   지지·내부 비자명성.
3. **닫힌 annulus 전체**의 `F>0`, `a>0`, `v_s−2>0`와 하나의 `κ>0`에
   의한 정규화 방향 cone. 물리적 q에 의존하지 않는 상수여야 한다.
4. 양 끝에서 flat인 하나의 양의 내부 weight와 각 고정 차수의 도함수
   상계·stress 하계.
5. `M∞=J∞=S∞=0`, 정확한 renormalized angular moment, 실제 heat exterior.
6. 향후 보정을 위한 서로 다른 두 예약 patch의 원래 power law.

특히 stress가 0인 edge에서 `T0/|T0|`를 직접 계산하면 안 된다.
먼저 공통 flat factor를 분리하고 매끄러운 계수의 비율로 방향을
연장해야 한다. [P pp.32–34, 142–144]

## 5. 수학적 의존성과 상수 선택의 순서

설계도 p.56의 원래 순서는 다음과 같다.

`Md → Td=exp(Md)+10 → P* → λ → h → matching tolerance,j0 → δ*,σ*,Λ → Tsh → C,XR → transition widths → N`.

이를 지킨다는 뜻은 각각의 고정 수치를 반드시 짧은 십진수로 출력한다는
뜻이 아니다. **증명된 선택 조건**도 원래 합격 기준이 허용한다. 다만
조건이 나중에 선택할 값을 앞서 사용하거나, 무한/0으로 수치적으로
대체되거나, 실제 source norm이 없는 이름뿐인 bound이면 충분하지 않다.
[B p.56; H pp.4, 8–9]

핵심 결속은 다음과 같다.

* 새 외곽이 A.21의 **하나의 분석적 Π0**를 고정한다.
* axis의 무한 고정점은 그 Π0를 전제로 한다. 이전 후보 Π0의 고정점은
  재사용할 수 없다.
* 실제 inner continuation이 B.8의 incoming five-moment debt를 공급한다.
* 같은 Π0를 사용하는 forward pressure와 다섯 exact moments가
  접합 이후의 Qs·Ns·stress를 복원한다. [P pp.28–30, Lemma 4.4]
* A.7의 실제 heat edit와 I2 보상은 total pressure increment를 정확히
  보존해야 한다. 열 인자가 η에서 해석적일 필요는 없지만, 축 datum을
  바꿀 수는 없다. [P pp.133–134, 138–140]
* C.12는 실제 변조된 값·부분 누적 모멘트로 ps를 다시 계산하고, I1에서
  모든 total moments를 복구한다. [P pp.161–163]
* A.8의 backward stress 공식은 regular axis와 exact total moments가
  모두 붙은 **같은 최종 장**에만 적용한다. [P pp.140–141]

## 6. 실제 norm과 형식화의 경계

B p.81의 Bρ norm은 임의의 유한 coefficient maximum이 아니다. 수식에
나오는 가중치는

\[
a_{\alpha\beta}=20^{-\alpha}\rho^{-\beta}
\frac{\beta!\binom{\alpha+\beta}{\beta}}
{(\alpha+1)^2(\beta+1)^2}
\]

이며, 실제 계수의 가중 norm·invariant ball·contraction을 검사해야 한다.
`|Y|<20`의 멱급수 tail, fixed-point error, 반올림 오차는 서로 다른
오차 항목이다. 유한 jet의 residual이 작아도 무한 고정점의 존재·유일성
증거로 자동 변환되지 않는다. [B pp.10, 56, 81]

조건부 Lean 정리는 전제가 무엇인지 포함하여 유효한 결과이다. 해당
해석학적 전제가 실제 동일 프로파일에서 충족됐다는 증거가 없으면
그 전제를 지웠다고 표시할 수 없다. 마찬가지로 M1 산술의 P1 비교정리는
`THEOREM_REFERENCE`, `leanImport:null`, `formalComplete:false` 경계가
원래 계약의 일부다. 외부 정리 사용을 무조건 새 Lean import로 바꾸는
것은 원문 요구가 아니다. [H pp.1, 8, 18]

## 7. 보호된 공식 Comparator

N1-05와 N1-06은 별개이다. H p.5의 전체 기본 빌드 성공은 완료된 실행의
근거이고, H p.6의 Comparator 상태는 그 문서 시점의 진행 상황이다.
후속 담당자는 실제 종료를 다시 관측해야 한다.

Comparator는 원문 제출 정리의 axiom audit, 원래 dependency와 kernel,
비특권 실행·systemd D-Bus·주소 family 제한·Landlock 및 그 음성 probe,
Comparator 이전의 보호된 olean 상태, 필수 nanoda를 보존해야 한다.
어떤 환경에서 이 보호를 구현할 수 없으면 그 환경의 한계를 기록하며,
원래 기준을 약화한 실행을 N1-06 PASS로 재명명하지 않는다. 원문
challenge template의 의도된 sorry placeholder와 실제 proof-root
의존성은 별도로 추적한다. [B p.52; H pp.5–6, 15]

## 8. 유효한 다음 단계와 완료 보류 조건

새 외곽 O의 기존 검증은 유한 A.4 영역을 다룬다. 이 영역 초입과 axial
단계에서는 원문상 **relaxed cone**만 필요한 구간이 있다. 이를 처음부터
`v_s>2`로 강화해 기존 A.4를 잘못 실패 처리하거나, 반대로 최종 annulus의
strict cone을 relaxed cone으로 낮추면 안 된다. C.1–C.2가 바로 그 간극을
처리한다. [P pp.129–137, 158–163]

현재 유효하게 추가할 수 있는 결과는 실제 same-source heat debt와 I2
보상, 실제 same-datum axis, 실제 B.8 debt enclosure, 명시적 C.1 loop
선택과 실제 C.12 debt/N, 그리고 그 결과의 양 끝 factorization이다.
이들 하위 결과는 날짜·입력·범위를 기록하여 보존한다. 마지막 동일 장의
연결이 아직 빠져 있으면 원래 전체 N3 gate를 그대로 열어 둔다.

이 폴더의 `HEAT_COMPENSATION_PROOF_EN.md`는 이 감사 이후 실제 적분으로
열 debt를 정의하고 그 bound를 새 I2 operator에 공급한 후속 논증이다.
그 파일 역시 완성된 inner profile이나 최종 Theorem 4.6 witness를
제공했다고 주장하지 않는다. 독립 감사와 scalar check의 성공을 새 전역
PDE 정리 수로 환산하지 않는다.
