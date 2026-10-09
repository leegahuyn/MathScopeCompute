# 실제 Bρ 국소 인증 후속 모듈

이 후속 파일들은 frozen v50 보고서·기존 계산 소스를 바꾸지 않는다. 원문 Appendix B의 무한 계수 공간에 대한 명시적 국소 상계를 계산한다. 첫 지원 데이터는 정확히 정의된 `P(η)=-K/(1+η²)^2`이며 완성된 원문 outer pressure라고 표시하지 않는다.

## API

```js
import {certifyAxis, axisExampleInput, validateAxisInput, getAxisExamples}
  from './axis-certificates.mjs';
import {makeBudget} from '../numerics.mjs';
const budget = makeBudget(request.budget, {
  isCancelled: () => false,
  progress: value => { /* optional */ }
});
const result = certifyAxis(axisExampleInput(), budget);
```

**두 번째 인수는 기존 `makeBudget()`의 반환 객체를 직접 전달한다.** `{budget}` 래퍼나 hook 자체가 아니다. 생략하면 기본 budget을 만든다. `tick()`, `maxPoints`, `snapshot()`을 사용하며 취소·연산량·시간 제한을 같은 예외 계약으로 반환한다. 모든 인증 판정은 BigInt/유리수 연산으로 수행한다. 큰 B/L/Λ/logC는 문자열이며 시각화에만 근사 float를 사용한다.

`axisExampleInput()`은 매번 새로운 안전 JSON 객체를 반환한다. `getAxisExamples()`는 `{id,label,request:{kind:'ns.axis-certificate',input}}` 배열이다. 입력은 `h`, `j0`, `pressure:{family:'rational',K}`, 자동 `sigmaMode`/`lambdaMode`, 작은 정수 `lambdaMultiplier`, `coefficientRadiusRatio`, tail·도함수 차수, 표시 η/Y/표본수, 정수 반올림 비트수를 지원한다. 임의의 norm·tail·Λ·logC·인증 플래그는 거부한다.

## 실제로 인증하는 범위

1. `K>=4`, `0<h<=1/100`, `0<j0<=1/20`의 정확 입력과 pressure의 음수·도함수 부호·해석성 조건.
2. 전체 `[-1,1]`의 유리수 구간 cover로 `|Z*|<=j0/10`인 곳의 `H*²>=m>0`를 증명한다. `sigma=min(1,m)/20`을 선택하여 그 집합에서 `chi>=400/401>99/100`을 얻는다.
3. `[-11/10,11/10]` 주위 복소 tube를 다항식 perturbation bound로 선택한다. `1+z²`, `L(z)`, `H*(z)²+sigma²` 분모의 양의 절댓값 하한을 계산한다.
4. 모든 η 도함수 차수의 Cauchy 상계와 `radiusLoss(q)=(1+q)/(1-q)^3`로 고정 계수 및 normalized amplitude의 실제 Bρ norm 상계를 만든다.
5. 공식 `AxisOperators`의 64/80/5120 상수와 `AxisResolvent`의 factorial majorant를 사용한다. 무한 합의 finite prefix는 정수 나눗셈으로 상·하방 반올림하고 나머지는 기하급수로 상계한다.
6. 원래 `controlledRemainder`의 모든 항을 포함하는 bound/Lipschitz 연산 트리를 계산한다. `Lambda >= 1+B+L` 및 양성에 필요한 더 큰 상계를 자동 선택한다. `C=exp(logC)`의 정확한 기호 표현이 복소 정규화 조건을 만족하도록 한다.
7. 원문 B.11의 **전 구간** cubic lower bound로 `Phi>1/4`를 얻는다. 추가로 `f0prime(z)<=-1/4+z/24<=-19/240<0`의 교대급수 근거를 명시한다. 단일 `f0(4.1)` 표본을 무한차원 증명으로 쓰지 않는다.
8. 유일한 무한 계수 고정점의 radial·mixed-derivative tail를 계산한다. 기존 `axis-series.mjs` 배열의 계수 오차와 이 tail를 연결하는 것은 별도 작업이다.

## 증거 등급

`VERIFIED_LOCAL_BOUND_CERTIFICATE`는 정확한 입력 함수에서 계산한 전 구간 상계와 원문 정리의 적용 계약이다. `formalPass`와 `fullCertificateKernelChecked`는 false다. 실제 원문 exported theorem 감사와 생성된 모든 해석 전제의 새 Lean 증명은 구별한다. 이 결과로 원문 outer pressure, 전역 witness, N3 전체 PASS, 기존 float η-jet의 정확성 또는 B.3/B.5/A.7/A.8/A.11 관문을 자동 승격하지 않는다.

원문 `NaturalAxisData.SmallParameters`는 `h,j<=1/1000`을 요구한다. 기본 `h=1/200,j0=3/100`은 이 전문화의 인스턴스가 아니다. 해당 파일의 root/σ 정리 감사는 정확한 전제를 포함한 참고이며, 새 인증의 low-Z 분리는 전체 η 구간의 독립 exact cover가 직접 공급한다. 일반 `Controlled` / `CompatibleData` 경로와 원문의 더 좁은 작은 매개변수 보조 정리를 혼동하지 않는다.

표시 좌표는 `(Y=Lambda X, Phi 구간 중심, log10 tail 상계)`다. 모든 행에 원본 `X=Y/Lambda`를 정확한 유리수로 남긴다. C는 매우 클 수 있다. 기존 evaluator가 `exp(Lambda*phase-logC)`를 0으로 언더플로시키면 그 float는 엄밀한 `g>0` 조건을 보존하지 못한다.

## 검증 명령

```bash
node --test mathscope-m1/navier/followup-construction/axis-certificates.test.mjs
python -B mathscope-m1/navier/followup-construction/verify-axis-independent.py
```

Lean 원본을 설치한 동일 환경에서 수행한 정확한 명령·환경은 `axis-lean-command.json` 및 `axis-negative-command.json`에 남긴다. 완료된 기록만 수집하는 명령은 다음과 같다. 이 수집 명령 자체가 Lean을 다시 실행하는 것은 아니다.

```bash
python -B mathscope-m1/navier/followup-construction/collect-axis-audit.py
```

일반적인 동일 버전 원본 checkout에서는 해당 저장소를 현재 디렉터리로 하고 `lake env lean --root <followup-directory> <followup-directory>/AxisBoundAudit.lean`을 실행한다. 실제 이 세션은 이전에 감사한 명시적 경로 entry와 원래 rc2 커널을 사용했으며, 순수 vanilla CLI 실행이라고 표시하지 않는다. 원문 source·kernel·manifest·논리 옵션·guard는 변경하지 않는다.

원전은 고정 PDF pp.144–148, B.1/B.2/B.4–B.16 및 p.157 B.40, 공식 저장소 commit `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`다. 정확한 파일·정리 이름·원전 URL은 `axisCertificateSources`에 수록한다.

## 완료된 검사 기록

2026-10-09에 JS 27/27, 독립 Python Fraction/Bernstein/급수 검사 131/131을 통과했다. 같은 원래 Lean 4.34.0-rc2와 mathlib `85e3a25e006c35636f0e53b0e9296caca2685bc0`에서 `AxisBoundAudit.lean` 검사가 17:16:16 UTC에 exit 0으로 완료됐다. 원문 exported 타입·공리 참조 16개와 새 스칼라 정리 4개를 구별하며, 모두 `[propext, Classical.choice, Quot.sound]`만 의존한다. 새 스칼라는 기본 fixture의 ball/수축 조건, log C 정규화, 양성 margin, 도함수 비교용 선형 상계다.

올바르게 실수 타입이 잡힌 거짓 부등식 `305719/1152000-1/318<=1/4`는 17:15:26 UTC에 `⊢ False`를 남기고 exit 1로 거부됐다. 최초의 지원되지 않는 표시 옵션 시도와 negative source의 실수 import 부족 시도는 별도 실패 로그로 보존하며, 성공한 검사나 유효한 음성 대조로 세지 않는다.

`axis-lean-audit.json`은 원문·타입·공리·환경·명령·로그·해시의 전체 감사다. `axis-pinned-audit.json`은 동일한 기록을 IDE AUDITS 스키마로 옮긴 정적 표시용 자료다. 브라우저에서 이를 표시하는 것은 커널 재실행이 아니다. `axis-test-results.json`, `axis-followup-status.json`, `axis-followup-manifest.json`은 검사 집계, 원문 N3-01/N3-03의 실제 남은 조건, 이 후속 파일의 byte/SHA 원장을 각각 기록한다.

감사 JSON과 문서가 모두 준비된 뒤 기록을 수집하는 명령은 `python -B mathscope-m1/navier/followup-construction/finalize-axis-evidence.py`다. 이 명령은 이미 완료된 로그를 읽으며 JS나 Lean을 다시 실행하지 않는다. 기존 로컬 71개와 원문 C/D 2개를 후속 16+4개와 합쳐 하나의 증명 완료 수치로 표시하지 않는다.
