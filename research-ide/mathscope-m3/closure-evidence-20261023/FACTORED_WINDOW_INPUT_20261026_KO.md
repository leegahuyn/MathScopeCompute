# 원본 window와 척도를 보존하는 native 입력

이번 변경은 소스 그래프의 첫 coefficient window N=1에 대한 정확한 인덱스 관계를 계산 경로에 연결한다. h를 0으로 바꾸거나 매우 작은 `Q^h`를 1로 근사하지 않는다. **원본 norm·selector 표현이 유한한 실수라는 전제는 아직 인증하지 못했다.** 이 전제는 출력에 OPEN으로 남으며 최종장/전역 정의역 인증을 대신하지 않는다.

## 앞 단계 일반 좌표 예제의 한계

원본 #617357은 `(64/h)^2`, #617431은 이 항을 포함하는 max, #617432는 그 ceil, #617433은 `ell0=ellMinimum+6`이다. `0<h<2^-4096`이므로

`ellMinimum ≥ (64/h)^2 > 2^8204`.

따라서 원본 norm 표현들이 유한한 실수로 정의되는 모든 경우, 활성 ell은 이보다 크다. 앞 단계 `original_physical_slow_chart.py`의 입력은 유리수의 분자·분모 bit budget이 32768이므로 선택되는 ell≤32768이다. 해당 계산은 q의 좌표 계산 검증으로 유효하지만 **원본 활성 window의 물리장 데이터가 될 수 없다.** 앞 단계의 결과를 소급해서 실제 최종장 샘플로 바꾸지 않는다.

원본 Q의 분모를 일반 정수로 펼치는 계산 방식은 이 척도에 적합하지 않다. h가 작더라도 ell·h는 작다고 할 수 없다. `Q^h=exp(-ell*h*log 2)`를 1로 바꾸는 것은 허용되지 않는다.

## 원본 첫 window에 속하는 네 개의 식

다음 소스 관계를 전체 그래프·registry SHA와 45개 수식 노드에 대조한다. 원본 cutoff expression system #680과 그 after 분기의 상수 0도 대조한다.

| 대상 | 원본 노드 | 관계 |
|---|---:|---|
| ellMinimum, ell0 | #617432, #617433 | 정수, ell0=ellMinimum+6 |
| log b1 | #617465 | max에 `(ellMinimum+10)*log 2` 포함 |
| log b2 | #617514 | max에 `log b1+log 16` 포함 |
| m | #622784 | `floor(log b1/log 2)` |
| n | #622789 | `floor(log b2/log 2)` |
| N=1 window | #622785, #622790 | `[max(ell0,m), n−1]` |
| Q | #622794 | `exp(-ell*log 2)` |

유한 실수 전제 아래 `log 2>0`, `log 16=4 log 2`, floor의 단조성과 정수 평행이동으로

`m≥ellMinimum+10`, `n≥m+4`.

따라서 `ell=m+j, j=0,1,2,3` 모두 원본 N=1 window에 들어간다. `WindowBridge.lean`은 **이 두 정수 부등식을 전제로 한** 네 레벨의 소속, qStar 지수 여유 및 첫 omitted cutoff의 지수 여유를 증명한다. 실수 로그·floor 부분과 norm의 유한성까지 Lean으로 증명한 것은 아니다.

이 원본 ell을 보존한 상태에서 `Q=exp(-ell log 2)`, `z=0`, `tau=Q`로 놓는다. native 입력은 `Z=0,T=1`이며 원본 #622820의 해는 모든 원본 h에 대해 정확히 s=1, q=Q다. band offset은 0이다. 또한

`q/qStar≤2^(-6-j)`, `b2*q≥2^(4-j)≥2`.

후자는 원본 첫 omitted cutoff `chi(b2*q)`와 그 도함수가 0임을 보인다. 모든 이후 cutoff에 같은 결론을 적용하려면 원본 전 차수 selector의 단조 재귀가 필요하다. 생성되지 않은 계수가 0이라고 가정하지 않는다.

## 물리 q 미분의 정확한 척도

기존 원본 inverse 제트 계산기를 실행해 Z,T 미분 계수의 유리수 구간을 얻고, 다음 척도를 별도로 보존한다.

`∂z^a ∂tau^b q = Q^(1−a/2−b+a*h) * ∂Z^a ∂T^b s`.

예를 들어 이 축 위 입력에서 `q_zz=2 Q^(2h)`다. native `s_ZZ=2`를 물리 `q_zz=2`로 바꾸면 안 된다. 출력은 유리수 지수와 h 계수를 각각 보존한다. t=1−tau 미분은 `(-1)^b`를 추가한다. Q·라벨은 미분하는 동안 고정된다.

`original_monotone2_interval_jets.py`에서 s=1이 이미 증명된 경우 s^(2h)=1도 정확히 사용하도록 보강했다. 이 때문에 위 축 입력의 s_ZZ=2는 반올림 폭 없이 나온다.

## 검증과 남은 경계

양성 Lean 파일은 일반 커널로 컴파일하고 다섯 정리의 axioms를 출력한다. `sorryAx`가 없어야 한다. factor-16 대신 factor-8의 잘못된 전제를 사용한 `NegativeWindowBridge.lean`은 거부되어야 한다. 이 검사는 source의 실수 정칙성을 자동으로 증명하지 않는다.

남은 핵심 전제는 norm·selector 표현의 실제 유한 실수성, 원본 shell의 반경과 메시 라벨 계산, #623935 대표점의 활성 지지집합, 공통 복소 정칙성·Bρ·tail 및 최종장 67+13개 제트다. 이번 실행은 최종 속도장·압력·3D PDE 잔차·에너지 데이터가 아니며 운영 페이지를 변경하지 않는다.

**M3 62/64 · M4 0/16 · 최종 제트 0/67 · RELEASE HOLD 유지.**
