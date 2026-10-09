# N3-01 / N3-03 독립 검토와 실제 후속 구현

## 결론

원문에 없는 Banach 정리부터 새로 연구해야 하는 상태는 아니다. 고정 저장소의 `AxisContraction.lean`은 실제 nonlinear remainder의 각 항에 대해 bounded/Lipschitz 상계를 이미 증명하며, `contractionThreshold=1+remainderBound+remainderLip`를 제공한다. 부족했던 부분은 실제 함수에서 수치 norm 상계·복소 반경·정규화·무한 tail를 생산하고 이 정리의 가정을 채우는 실행 코드였다.

새 `axis-certificates.mjs`는 그 실행 부분을 **명시적으로 정의된 rational pressure datum**에 대해 구현한다. 기존 v50 소스·PDF의 판정과 원문 70개 기준을 바꾸지 않는다. 실제 원문 outer pressure와 수치 고정점의 전역 witness는 여전히 별도 연결이다.

## 공식 정리가 정확히 요구하는 것

`AxisContraction.Controlled E E R`에는 값 함수와 두 상수 `bound`, `lip`, 비음수성 및 다음 두 보편 명제가 들어간다.

- 모든 `||x||<=R`에 대해 `||f(x)||<=bound`.
- 모든 `||x||,||y||<=R`에 대해 `||f(x)-f(y)||<=lip*||x-y||`.

`exists_fixedPoint_of_controlled`는 완비 normed space에서 중심 x0와 `R=||x0||+1`, `s>=0`, `s*bound<=1`, `s*lip<=1/2`를 받아 닫힌 반경 1의 ball 안의 유일한 고정점과 `||x-x0||<=s*bound`를 준다. 실제 nonlinear system에는 `s=1/(2 Lambda)`를 넣는다.

`exists_unique_natural_fixedPoint`는 실제 `NaturalOperators`, `AxisData`, resolvent S, amplitude norm M 및 `Lambda>=1+B+L`에서 위 결과를 준다. 이 정리의 존재 결론만 읽는 것으로 외부 배열의 동일성은 성립하지 않는다. `NaturalAxisBridge.exists_scaled_profiles`에는 추가로 실제 `CompatibleData`, 계수 공간의 원소, radially constant amplitude가 필요하다. 모든 입력을 유한 수치 열 대신 그 공간의 실제 함수로 해석해야 한다.

원래 파일 위치: `mathscope-m1/navier/sources/official-repo/NavierStokes/AxisContraction.lean`의 `Controlled`, `controlledRemainder`, `contractionThreshold`, `exists_unique_natural_fixedPoint`; `NaturalAxisBridge.lean`의 `exists_scaled_profiles`. 고정 commit은 `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`다.

전제의 범위도 구분한다. `NaturalAxisData.SmallParameters`는 `0<h,j<=1/1000`인 별도의 작은 매개변수 전문화다. 본 기본 fixture `h=1/200,j=3/100`은 그 root/σ 존재 정리를 인스턴스화한 것이 아니다. 새 모듈의 low-Z margin·σ는 전체 η 구간 exact cover로 직접 인증하며, 일반 계수 공간의 `Controlled`·`CompatibleData` 정리를 사용한다. 따라서 원문 root/σ 정리의 타입·공리 감사와 본 입력에 대한 적용 증거는 서로 다른 기록이다.

## 실제로 수치화한 선택

| 원래 선택 또는 상계 | 기존 증명의 형태 | 후속 모듈이 계산하는 근거 |
|---|---|---|
| δ* | `NaturalAxisData.low_Z_has_H_margin`에서 δ*=j/10 명시 | 동일한 정확 유리수 |
| σ* | low-Z compact set에서 H²의 양의 최소 하한 m을 선택 | 전체 [-1,1]를 덮는 유리수 구간 cover, 각 cell의 Z 제외 또는 H² 하한, σ=min(1,m)/20 |
| 복소 Ω | `exists_cthickening_subset_open`로 반경 존재 | H의 다항식 계수 perturbation bound와 L·H²+σ²·1+z²의 양의 절댓값 하한 |
| 고정 계수 norm | compact continuous family의 sup 존재 | 복소 supremum의 명시적 대수 상계와 모든 도함수의 Cauchy bound |
| normalized g norm | `C>=exp(Lambda*realPartSup)` | 복소 선분 적분의 phase bound, 정확 `logC=Lambda*phaseUpper+1`, C=exp(logC) |
| nonlinear ball | `Controlled` 연산 트리 | 원문 lin1/quad1/slow1/lin2/slow2/pressure의 모든 항을 포함한 B/L 전파 |
| resolvent | factorial decay와 무한 operator sum | 2560||chi|| majorant의 정확 정수 반올림 prefix 및 기하 tail |
| nonlinear radial tail | Bρ 계수의 보편 상계 | 모든 α>N 및 고정 mixed derivative 차수의 명시적 기하 tail |

상수 64, 80, 5120 및 ρ에 대한 나눗셈은 `AxisOperators`의 실제 norm 정리에 나온다. Bρ의 η 차수는 Taylor 계수가 아니라 **실제 도함수**이며 β!를 포함한다. `rho/complexRadius=q`일 때 `(1+q)/(1-q)^3`의 Cauchy 손실은 모든 β를 동시에 제어한다.

`NaturalAxisCoefficients.normalizationThreshold`의 `realPartSup`는 `sSup`이므로 그 정의를 float로 평가하는 함수가 아니다. 새 모듈은 supremum의 값을 추정하여 입력하는 대신 함수 정의에서 안전한 상계를 만들어 C를 선택한다.

## 기본 fixture의 실제 결과

입력은 K=10, h=1/200, j0=3/100, P(η)=-10/(1+η²)^2, 자동 σ/Λ/C다.

- 전체 η 구간을 덮는 11개 cell을 얻었다. 독립 Python 검증은 JS interval 연산을 재사용하지 않고 Bernstein 다항식 양성 판정으로 각 cell을 확인했다.
- σ*=1701858529809/219902325555200000, δ*=3/1000.
- Bρ 반경은 1/1125899906842624다. 매우 보수적인 공통 복소 반경의 결과이며 전 η 구간보다 큰 실수 window에서 유효하다.
- Λ는 약 5.27248×10^92이며 정확 정수 문자열로 보존한다. log C는 약 1.24605×10^104이고 C 자체는 `exp(logC)`라는 정확 양수다.
- 자기지도 변위 상계는 1/400, Lipschitz 상계는 1/2보다 작다.
- `[0,4.1]×[-1,1]` 전체에서 `|Phi-f0(Y chi)|<=1/318`이며 `Phi>=16011107/61056000>1/4`다.
- 양성은 원문 B.11의 전 구간 cubic lower bound에서 따른다. `f0prime(z)<=-1/4+z/24<=-19/240<0`도 기록한다. 4.1 한 점의 표본을 양성 증명으로 대체하지 않는다.

정확한 결과는 `axis-default-certificate.json`에 있다. JS 27개 검사는 유효 입력, 변경된 K/Λ, tail 개선, 자원 제한, 취소와 위조 입력 거부를 포함한다. `axis-independent-validation.json`의 131개 독립 검사는 유리수 연산, 전체 구간 Bernstein 양성, 반올림 없는 factorial 급수, 별도 다항식 remainder/Lipschitz 전개, 무한 tail를 대조한다.

## 남은 연결을 정확히 구분하기

### 1. 완성된 원문 pressure와의 연결

현재 v50 `radial.mjs`의 `pressureJet`은 `-2.5 PStar²`와 잘린 reference 적분을 사용하고 heat·moment repairs를 적용하지 않았다고 명시한다. 새 모듈의 P=-K/(1+η²)^2도 그 reference 배열을 그대로 인증한 것이 아니다. 별도 정확 함수 datum으로 국소 방정식을 인증한다.

원문의 실제 Π0는 A.21의 전체 log-radius 적분이다. η interpolation 구간은 f(η)^(2 theta(y))를 포함하며 theta가 0과 1 사이에서 변한다. 일반적으로 하나의 상수 K 곱 f²와 같지 않다. 실제 연결에는 완전한 schedule·holomorphic pressure 적분 상계·pressure-preserving angular/heat/moment corrections의 증거가 필요하다. 임의의 사용자가 “norm=1”을 넣어 이 전제를 충족했다고 표시하는 경로는 없다.

### 2. 기존 finite η-jet와의 연결

기존 `axis-series.mjs`는 단일 η에서 유한 차수의 Taylor jet를 binary64로 계산한다. 새 tail는 **원문 함수 공간의 유일한 무한 고정점**에 대한 상계다. 기존 배열과 coefficient recurrence를 coefficient-by-coefficient로 연결하고, 입력 coefficient·적분·rounding·derivative loss를 엄밀하게 묶기 전에는 그 배열의 tail/error certificate가 아니다.

인증 C는 매우 크므로 기존 `Math.exp(Lambda*phase-logC)`가 0으로 언더플로될 수 있다. 이때 float E=0은 정확 수학적 E>0을 대체하지 못한다. 실제 계수 evaluator에는 scaled/log amplitude, interval coefficients 및 normalization-preserving operations가 더 필요하다.

### 3. N3-01의 나머지 전체 선택 순서

이번 모듈은 δ/σ/Ω/norm/Λ/C의 **rational pressure 국소 분기**를 실행했다. A.6/B.40의 Md→Td→P*→λ→h, 실제 exterior에 의존하는 matching tolerance, 지정된 유한 η derivative 목록, Bk/Tsh, XR와 final activation widths, 마지막 cone frequency 전체를 선택한 것은 아니다.

원문 B.40은 모든 도함수의 smallness를 한 번에 요구하지 않는다. 필요한 **유한 목록**을 먼저 고정하고, 나머지 고정 차수에는 finite bound만 요구한다. 이 순서를 유지해야 한다. `ScheduledProfileChoice.exists_scheduled_core_below`는 UniformAngularReset/PulseAmplitude의 threshold 존재 정리를 사용하는 등, 문헌상의 선택을 수치 상계 producer로 바꿔야 하는 다른 지점도 남는다.

### 4. B.3 / B.5 이후

현재 결과의 Φ 양성만으로 B.3의 Sq 하한이나 Y=4에서 `p1+p2²/p1>2+c`를 인증했다고 할 수 없다. 지정한 derivative 차수의 approximation bound, complementary χ/Z 영역, 큰 C의 endpoint 효과를 함께 대조해야 한다. B.5 controlled continuation, moment Newton, cone loop와 최종 support도 별도 인증이다.

이것들은 기존 원문 proof를 정량화하고 실행 코드에 연결해야 하는 작업이다. 확인된 원문 정리가 없어서 새 Banach 정리를 발명해야 한다는 의미도, 유한 표본으로 이미 끝났다는 의미도 아니다.

## 형식 감사 범위

`AxisBoundAudit.lean`은 원래 exported 16개 정리의 정확 타입·공리를 조사하고, 기본 fixture의 scalar Banach gate·normalization gate·양성 margin·도함수 상계 4개를 별도로 증명했다. 원래 Lean 4.34.0-rc2 명령은 2026-10-09 17:16:16 UTC에 exit 0으로 끝났으며 각 대상의 공리는 `[propext, Classical.choice, Quot.sound]`다. 거짓 margin 부등식은 실수 타입의 목표 `False`로 정규화되어 exit 1로 거부됐다. 실제 명령·환경·원문과 `.olean`의 해시·타입·공리·로그는 `axis-lean-audit.json` 및 IDE용 `axis-pinned-audit.json`에 있다.

이 scalar 4개는 JS analytic producer 전체를 Lean으로 재형식화한 것과 다르다. 기존 로컬71개 또는 원문 C/D2개와 합산하여 하나의 증명 완료 수치로 표시하지 않는다. 처음의 미지원 표시 옵션과 negative source의 공개 실수 import 부족은 별도 실패 기록으로 남기고 성공 수에 포함하지 않는다. 이번 후속 모듈이 완성한 것은 명시적인 rational datum의 국소 상계 성분이며, 원문 N3-01/N3-03의 상태는 PARTIAL로 유지한다.

## 원전

- 고정 첨부 PDF pp.144–148: B.1–B.16, Lemma B.1, Proposition B.2. p.157: B.40. SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
- [AxisContraction.lean](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/AxisContraction.lean)
- [AxisOperators.lean](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/AxisOperators.lean)
- [AxisResolvent.lean](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/AxisResolvent.lean)
- [NaturalAxisCoefficients.lean](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/NaturalAxisCoefficients.lean)
- [NaturalAxisData.lean](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/NaturalAxisData.lean)
- [AnalyticCoefficientBounds.lean](https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/AnalyticCoefficientBounds.lean)
