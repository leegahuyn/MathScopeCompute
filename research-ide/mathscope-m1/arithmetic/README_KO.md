# MathScope M1 산술·프리즘 엔진

이 폴더는 설계도 P1–P3의 24개 acceptance와 I1-03/I1-07/I3-02/I3-04의 산술 담당 부분을 구현한다. 무한 소수집합의 명세, 요청한 유한 구간의 완전한 소수 열거, 정확한 p-adic 계수 연산, 점과 P¹의 실제 crystalline/prismatic **비교 모델**을 제공한다. `checklist.json`은 설계 원문 acceptance, 구현 위치, 검증 근거, 형식화 범위를 항목별로 보존한다.

## 실행 API

외부 npm 의존성이 없는 정적 ESM이다. 모든 import는 같은 폴더의 `.mjs` 파일을 가리킨다. Browser Worker 및 WebCrypto를 제공하는 Node 환경에서 사용한다. 입력·출력의 큰 정수는 10진 문자열이다.

```js
import {runJob, getExamples, getCapabilities, validateRequest}
  from './arithmetic/index.mjs';

const request = {
  kind: 'arithmetic.p1',
  input: {p: '3', filtrationKind: 'hodge', filtrationIndex: 1},
  precision: {N: 4, D: 1},
  budget: {maxOperations: 50000000, maxMillis: 30000}
};
const validation = validateRequest(request);
if (!validation.ok) throw new Error(validation.errors[0].message);
const result = await runJob(request, {
  isCancelled: () => false,
  onCheckpoint: checkpoint => { /* 완료한 소수 세그먼트 저장 */ }
});
console.log(result.results.smith.cohomology);
console.log(result.results.frobenius.cohomologyFrobenius);
```

`runJob(request, context={})`는 오류 시 `ArithmeticError`를 던진다. 오류에는 `code`, `message`, `details`가 있으며, 예를 들어 `PRECISION_REQUIRED`, `INVALID_PRIME`, `PADIC_BASE_MISMATCH`, `FROBENIUS_TARGET_MISMATCH`, `RESOURCE_LIMIT`, `TIMEOUT`, `CANCELLED`가 있다. 잘못된 수학 입력을 계산 성공으로 포장하지 않는다. 공통 worker는 예외를 구조화된 job 실패로 표시해야 한다.

| kind | 주요 입력 | 주요 결과 |
|---|---|---|
| `arithmetic.primes` | `a`, `b`, `segmentSize`, `checkpoint`; 또는 `operation:'nextPrime'`, `after` | 정확한 구간 소수, segment/base hash, π/ψ/Li₂ 및 표시 manifest |
| `arithmetic.primeCertificate` | `n` 또는 `certificate` | Lucas/Pratt 인증서와 독립 verifier 결과; 지원 밖은 `UNKNOWN` |
| `arithmetic.padic` | `operation`, `p`, 계수/행렬/complex; `precision.N` | 덧셈·곱·나눗셈·delta·Smith·determinant·derived base change |
| `arithmetic.point` | `p`, `precision.N` | 점의 Z_p[0] 비교 모델과 유한 관측 |
| `arithmetic.p1` | `p`, `precision.N`, `precision.D`, filtration 설정 | 실제 chart complex, i/r/h, 전체 weight 인증, Frobenius, 비교정리 적용 기록 |
| `arithmetic.localFactors` | `model:'point'|'P1'|'elliptic'`, `primes`, `a`, `b`, `precision.levels` | 동일 정수 모형의 p별 tower, good/bad 판정, 국소 인자, 불완전 전역 묶음 |
| `arithmetic.verify` | `type:'primeCertificate'|'primeSegments'|'module'|'model'|'weight'|'complex'|'chainMap'|'filtration'` 및 해당 원자료 | 독립 재검사 결과와 정확한 계수 범위 |

`getExamples()`는 실행 가능한 11개 `{id,label,request}`를 반환한다. `getCapabilities()`는 지원 범위와 resource limits를 알려 준다. `validateRequest()`는 공통 JSON 모양·kind·기본 정밀도와 예산을 검사하며, operation별 수학 admission은 `runJob()` 안에서 수행한다.

`arithmetic.padic`의 `baseChange`에는 `coefficientRing`, `dims`, `basis`(선택), `differentials`를 가진 bounded free complex를 넣는다. 환은 `INTEGER_RING` 또는 같은 p의 `FINITE_P_POWER_RING`이어야 한다. 이 연산은 자유 복합체를 항별 tensor하며, 임의 행렬에 기하적 prismatic 해석을 부여하지 않는다.

## 데이터와 3D 표현

결과는 `object`, `request`, `scope`, `results`, `checks`, `precisionLedger`, `evidence`, `provenance`, `visualization`, `resultHash`를 포함한다. 최상위 `resultHash`는 canonical JSON의 SHA-256이며, 수학 모델에는 별도의 `rawHash`와 integrity payload가 있다. 카메라와 LOD는 원래 수학 데이터와 정확한 개수를 바꾸지 않는다.

`visualization`은 points/lines/axes뿐 아니라 `coordinateMeaning`과 `lostInformation`을 반환한다. P¹ 도식의 축은 cohomological degree, 순서 있는 기저 index, Laurent weight이다. 화면의 거리·각도는 p-adic 거리나 공간의 물리적 사영이 아니다. 소수 도식은 완료된 유한 범위의 관측이다.

## 정확도와 증거 등급

소수 목록, π, 소수 거듭제곱 가중치, 정수 행렬, 유한환 연산에는 반올림 오차가 없다. ψ는 정확한 log 선형결합과 정수 fixed-point 계산으로 얻은 엄밀한 구간을 함께 가진다. Li₂는 `∫₂ˣ dt/log(t)`의 float64 Simpson 근사이며 `certified:false`이다. 통상 `li(x)`와의 정규화 차이가 표시된다.

Z/p^N은 Z_p의 관측환이다. 이를 prism 자체로 승인하지 않는다. Delta의 목표 N자리에는 N+1자리 입력이 필요하고, 원래 잔여류와 일치하는 정확한 정수 원본이 있을 때만 추가 자릿수를 자동 복원한다. p^v로 나누면 v자리를 소비한다. 적분 계수 미분·Frobenius·determinant와 단위 basis transform은 입력 p-adic 자릿수를 잃지 않는다.

유한환 Smith 계산은 체의 Gaussian rank를 사용하지 않는다. `U A V = S mod p^N`과 U/V의 단위 determinant를 검사하고, kernel/cokernel의 자유 부분과 순환 torsion을 반환한다. `[3] : Z/27 → Z/27`의 kernel과 cokernel은 각각 Z/3이다.

점과 P¹은 `PRISMATIC_VIA_COMPARISON`이다. 실제 기하, completed Čech–de Rham complex, 명시적 finite-perfect replacement, Frobenius가 있고 아래 원전의 비교정리 적용 조건을 기록한다. **S01/S02의 scheme/cohomology 정리는 이 프로젝트에서 Lean으로 import하지 않았다.** 해당 화살표는 `THEOREM_REFERENCE`, `leanImport:null`, `formalComplete:false`이다. 이는 일반 CW toy나 bare 행렬의 재명명이 아니다. 동시에 underlying module complex의 비교를 cup-product 또는 E-infinity formality의 인증으로 확대하지 않는다.

실제 커널 검사는 31개의 명시된 Lean theorem에만 적용된다. 완전한 JavaScript 구현 refinement, 모든 formal scheme 구조, 모든 completed cohomology 정리가 형식화되었다는 뜻은 아니다. UI의 정적 감사 파일 조회는 새 커널 실행이 아니다.

## 소수별 데이터와 전역 경계

`PrimeSet = {n : Nat | Nat.Prime n}`은 무한 집합의 명세다. 생성기는 요청한 유한 구간을 완전히 열거하거나, 예산/취소 상태와 마지막 완료 구간을 반환한다. 직접 사용할 수 있는 `streamInterval()`은 소비할 다음 타일만 계산한다. `nextPrime()`은 소수성을 해결하지 못한 후보를 건너뛰지 않는다.

하나의 정수 모형 아래 각 p의 prism과 precision tower를 별도로 만든다. 서로 다른 p 사이에 계수환 덧셈이나 감소 사상을 만들지 않는다. 같은 p에서만 N을 감소시킨다. 타원곡선의 표시 모형 판별식이 p로 나뉜다고 곧바로 곡선 자체의 bad reduction이라고 결론내리지 않는다. 명시적 scale 변환 가능성 및 최소성 근거를 기록하고, 일반 최소화가 필요한 경우 `MINIMIZATION_REQUIRED`로 남긴다.

P¹은 실제 chain Frobenius의 H⁰/H² 작용으로 `1/((1-T)(1-pT))`를 얻고, 작은 유한체의 projective orbit 점계수와 교차 검사한다. E의 good 인자는 직접 점계수로 얻은 `1/(1-a_pT+pT²)`이며 원문 trace theorem의 인용과 연결한다. integral elliptic prismatic 행렬을 계산했다고 표시하지 않는다. bad-prime 인자·conductor·무한 목록이 미완료이면 전역 묶음은 반드시 `INCOMPLETE_LOCAL_DATA`이다.

## 기본 한도

| 항목 | 지원 한도 |
|---|---|
| 한 소수 요청의 정수 개수 | 기본 2,097,152; 최대 8,388,608 |
| 한 segment | 최대 1,048,576 |
| 기초 소수 상한 | 2,000,000; 따라서 그보다 큰 sqrt(b)를 요구하면 resource error |
| 소수 도식 점 | 최대 20,000 |
| p-adic N | 1–256; delta 출력에 257번째 입력 자릿수가 필요하면 지원 한계 오류 |
| P¹ 원본 D / Frobenius 대상 pD | 1–32 / 최대 256 |
| 유한환 Smith 행렬 | 최대 16×16 |
| determinant | 최대 32×32 |
| 직접 P¹/E 점계수 | p≤257; P¹의 명시적 Frobenius target 한도도 적용 |

이 값들은 한 계산 요청의 자원 한도다. 임의의 p·n에 대한 새 수학 정리의 범위를 뜻하지 않는다. 임의 prism, A_inf/perfectoid/q/Breuil–Kisin 연산, Nygaard descent, 일반 Tate 알고리즘, 고차원/타원곡선 integral complex, 완전한 전역 L 함수와 RH/BSD 연구 bridge는 후속 패키지의 범위다.

## 검증과 재현

현재 최종 결과는 **Node 38개**, **독립 Python 55개**, **Lean exported theorem 31개**, **Lean 음성 대조 4개 모두 거부**이다. Lean 경고·sorry·사용자 공리는 0개다. `evidence/validation-summary.json`과 `evidence/lean-audit.json`에 실제 로그·해시·명령을 저장한다.

workspace 루트에서 다음 명령으로 산술 계산 검사를 재현한다. Python 의존성은 테스트 전용이며 배포 Worker에는 포함되지 않는다.

```bash
node --test mathscope-m1/arithmetic/tests/arithmetic.test.mjs
python -m pip install --target mathscope-m1/arithmetic/vendor \
  -r mathscope-m1/arithmetic/requirements-test.txt
python mathscope-m1/arithmetic/tests/independent.py
```

테스트는 SymPy 1.14.0, mpmath 1.3.0으로 고정한다. Python 독립 verifier는 JS의 행렬 연산을 복사하지 않고 SymPy 정수 SNF·상징식을 사용한다. ψ는 Decimal 100자리 로그, 타원곡선은 Legendre character sum, Li₂는 mpmath 적분으로 비교한다. 근사의 교차 일치는 엄밀한 Li₂ 오차 certificate로 간주하지 않는다.

커널 검증 버전은 Lean **4.34.1**, Lean commit `5045d0056413266e57c625dcd7c365b10e377c52`, mathlib commit `d13f23b723b8a846827a245b89c10fc7d3f11612`이다. 동일 workspace의 기존 공식 shared-library frontend와 M0 감사 helper를 사용한 실제 재현 명령은 다음과 같다.

```bash
python mathscope-m1/arithmetic/lean/reproduce.py
```

이 명령은 `lean-4.34.1-linux`, 고정 commit의 `mathlib-ym-check`, `/tmp/mathscope-lean-embed`, 기존 `mathscope-m0/lean/reproduce.py`를 사용한다. 설치 root를 지정하는 frontend launcher만 사용하며 커널·runtime·guard는 변경하지 않는다. `--workspace`와 `--driver`로 위치를 지정할 수 있다. 새 장비에서는 전체 프로젝트의 고정 Lean 설치 절차를 먼저 실행하고 동일 버전·commit을 확인한다. 일반 Lean/Lake 설치에서는 다음 공식 dependency 명령을 사용할 수 있다.

```bash
elan toolchain install leanprover/lean4:v4.34.1
git clone https://github.com/leanprover-community/mathlib4.git mathlib-ym-check
git -C mathlib-ym-check checkout d13f23b723b8a846827a245b89c10fc7d3f11612
```

mathlib 폴더에서 고정 toolchain으로 `lake exe cache get Mathlib.Tactic.Ring Mathlib.Data.Nat.Prime.Basic Mathlib.Order.Interval.Finset.Nat Mathlib.NumberTheory.LucasPrimality Mathlib.Tactic.NormNum Mathlib.Data.Int.ModEq`를 실행하면 필요한 공식 cache를 요청할 수 있다. 이 workspace의 실제 cache 실행 명령은 `evidence/official-cache-download.json`에 그대로 보존했다. 공식 URL은 `https://cache.mathlib.org/mathlib4-master`이며 818개 archive를 내려받았고, 기존 mathlib-root `.olean`을 변경하지 않으면서 814개를 추가했다. package 모듈을 포함한 최종 import closure 3,072개는 별도 해시 목록으로 기록했다.

배포 ZIP에서는 `vendor/`, `.lake/`, 공식 Lean/mathlib 다운로드 전체를 제외할 수 있다. 소스·requirements·고정 commit·감사 로그·import closure·해시는 유지한다. 이전 `*-initial.log` 파일이 있다면 이는 해결된 초기 진단이며 최종 성공 판정은 `lean-audit.json`이 지정하는 `*-audit.log`만 사용한다.

## 원전 및 수학 근거

- **S01:** Bhatt–Scholze, *Prisms and Prismatic Cohomology*, Definition 1.1, Example 1.3(1), Definition 1.4, Theorem 1.8(1), Theorem 5.2. https://people.mpim-bonn.mpg.de/scholze/prisms.pdf
- **S02:** Bhatt–de Jong, *Crystalline cohomology and de Rham cohomology*, Theorem 3.6, Corollary 3.8. https://arxiv.org/html/1110.5001v1
- **S07:** Deligne, *La conjecture de Weil I*, (1.5.1)–(1.5.4), pp.275–276. https://www.numdam.org/item/PMIHES_1974__43__273_0.pdf
- **S08:** Wiles, *The Birch and Swinnerton-Dyer Conjecture*, pp.1–2. https://www.claymath.org/wp-content/uploads/2022/05/birchswin.pdf
- **S10:** NIST DLMF §25.16(i). https://dlmf.nist.gov/25.16
- **S14:** SageMath, *Isomorphisms between Weierstrass models*, 명시적 (u,r,s,t) 계수변환. https://doc.sagemath.org/html/en/reference/arithmetic_curves/sage/schemes/elliptic_curves/weierstrass_morphism.html
- **실제 Lean import:** 위 고정 mathlib commit의 `Mathlib/NumberTheory/LucasPrimality.lean`을 import하는 `MathScope.M1.Arithmetic.lucas_certificate_sound`; 정확한 type와 axioms는 감사 파일에 있다.

명시적 P¹의 signed-weight contraction과 코드의 finite-perfect replacement는 설계 부록의 계산을 전개한 자체 구성이다. 비교정리 논문이 이 구체적인 구현 알고리즘을 제공한다고 주장하지 않는다. 완결 모델의 수학적 이유는 `MATHEMATICS_KO.md`에서 독립적으로 설명한다.
