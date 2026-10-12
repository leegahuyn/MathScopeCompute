# M2 산술 P4–P6: 실제 계산과 정리 조건을 연결한 24개 원문 기준

현재 산술 원문 기준은 **24 PASS / 0 PARTIAL**입니다. 이전 10 PASS / 14 PARTIAL에서 14개 항목을 실제 알고리즘과 비교 경로로 보강했습니다. `checklist.mjs`의 24개 원문·페이지는 그대로 보존합니다. 이 평가의 `PASS`는 문서가 요구한 표준 대상의 계산과 정리 적용 조건을 충족한다는 의미입니다. 새 Lean kernel 실행, 임의 perfectoid algebra, 일반 E∞ 인증을 뜻하지 않습니다.

P5-08도 최종적으로 **실제 q-PD diagonal envelope와 small Čech–Alexander nerve**를 구현했습니다. 두 chart의 ad hoc q-module contraction만으로 완료하지 않았습니다. S01 Lemma 16.10이 주는 full completed δ-presentation에 대해 exact δ-relations, face/degeneracy와 inversion overlap을 생성하고, 같은 smooth 입력에 대한 canonical descent 정리를 적용합니다. 유한 δ-depth와 nerve 그림은 전체 완비 객체의 관측이며 고차 generator를 0으로 놓는 quotient가 아닙니다.

## API와 실행 예제

기존 8개 kind를 유지합니다. 서버 호출이나 별도 설치 없이 브라우저 worker와 Node에서 같은 모듈을 실행합니다.

```js
import {
  run, runJob, validate, getExamples, getCapabilities, getChecklist
} from './index.mjs';

// Differential reduction에서 Frobenius 행렬을 직접 계산합니다.
const mw = await run('arithmetic.elliptic', {
  p: '5', backend: 'mw', N: 3
});

// 두 좌표계의 실제 chain map과 inverse를 계산합니다.
const comparison = await run('arithmetic.qDeRham', {
  operation: 'framingComparison', p: '3', degree: 8
});

const aomega = await run('arithmetic.comparison', {
  operation: 'aomega', p: '3', dimensions: 2,
  weight: [3, -2], N: 4, U: 12
});
```

`getExamples()`는 **25개** `{id,label,request}`를 반환합니다. 기존 11개와 신규 14개이며, 25개 모두 `COMPLETED`입니다. 이는 Node의 산술 예제 검증 수입니다. 통합 worker 및 live browser 검증은 상위 릴리스 audit에서 별도로 기록합니다.

| Kind | 주요 operation / 입력 | 계산 결과 |
| --- | --- | --- |
| `arithmetic.projective` | `n=0..8`; 수학 명세는 모든 자연수 n | 유한 자유 complex, projective-bundle derived 비교, Frobenius, local zeta, 수렴 상계 |
| `arithmetic.elliptic` | 기본 point count; `backend:'mw'`; `operation:'globalIdentity'` | 유한체 점, 직접 MW 행렬, good global Euler 항등식 |
| `arithmetic.frobeniusReconstruct` | residue/bounds 또는 `matrix`, `extensionBaseDegree`, `coefficientPolynomial` | Hensel coefficient Frobenius와 semilinear 곱, 유일 정수 복원 |
| `arithmetic.qDeRham` | 기본 `koszul`; `framingComparison`; `cechP1` | q 미분, R/R¹ 정리 경로, chain iso, 실제 q-PD diagonal nerve와 두-affine descent |
| `arithmetic.breuilKisin` | `E`, `baseMapPolynomial` | Eisenstein/δ(E), 실제 세 coefficient map 및 point의 derived base change |
| `arithmetic.perfectoidTower` | `tower`, `tilt`, `sharp`, `theta`, `aomega`, `perfectPrism` | 표준 완비 base와 실제 유한 관측, 비교 경로 |
| `arithmetic.witt` | 기본 Fp; `coefficientRing:'standard-tilt'` | Teichmüller integer oracle 또는 universal Witt polynomial 연산 |
| `arithmetic.comparison` | 기본 `eta`; `aomega`; `perfectPrism` | torsion 진단, 완비 torus AΩ, 순서가 있는 derived comparison |

반환 구조는 `{schema,version,kind,status,object,request,scope,results,checks,blockers,tables,precisionLedger,evidence,provenance,visualization,resultHash}`입니다. `checks`는 `{name,pass,...details}`, table은 `{title,columns,rows}`입니다. 취소·budget context는 기존 `signal`, `isCancelled`, `checkCancelled`, `onCheckpoint`, `budget` 규약을 유지합니다.

## P4: Frobenius를 실제로 계산하는 경로

### 유한 perfect projective 모델

`projectiveComparison`은 `⊕ Z_p[-2i]`를 단순 Betti 수로만 취급하지 않습니다. 각 generator를 `c1_dR(O(1))^i`로 보내는 **derived projective bundle formula**를 적용합니다. 모든 항이 유한 자유이므로 p-power derived reduction도 그대로 계산됩니다. Projective Frobenius lift의 `F*O(1)=O(p)`에서 `F(e_i)=p^i e_i`를 얻고, smooth proper lift의 de Rham–crystalline 및 crystalline–prismatic 비교를 연결합니다.

근거는 [Stacks 0FUN, Remark 50.14.2](https://stacks.math.columbia.edu/tag/0FUN), [0FMJ, Lemma 50.11.4](https://stacks.math.columbia.edu/tag/0FMJ), [S02](https://arxiv.org/abs/1110.5001), [S01](https://people.mpim-bonn.mpg.de/scholze/prisms.pdf)입니다. 화면 n≤8은 상계가 있는 관측 범위이며 all-n 정리를 대체하지 않습니다.

### Direct Monsky–Washnitzer

`mw-frobenius.mjs`는 good short Weierstrass curve `y²=f(x)=x³+ax+b`, p≥5에 대해 다음을 정확한 유리수로 계산합니다.

- Frobenius lift `x→x^p`와 `D=f(x^p)-f(x)^p`를 형성합니다. D는 coefficientwise p의 배수입니다.
- `p binom(-1/2,k) x^(p(i+1)-1) D^k / y^(p(2k+1))`를 `dx/y`, `x dx/y` basis로 줄입니다.
- Bézout 역원, vertical reduction 및 horizontal exact-differential reduction의 항등식을 검사합니다. 부동소수점으로 p-adic 계수를 근사하지 않습니다.
- [S06 §3 Lemma 2 및 §4](https://arxiv.org/abs/math/0105031)를 적용하고, positive-power 부분은 실제 divisor `2d−1`를 따로 제한합니다. 이 방법은 정오표가 있는 2001년 Lemma 3의 원래 추정에 의존하지 않습니다.

첫 생략 항 k 이후의 valuation 하한은 `k-floor(log_p(2k+1))`입니다. 이 값이 요청 N보다 작거나 working precision이 감소 상계를 감당하지 못하면 행렬을 반환하지 않고 `PRECISION_REQUIRED`가 됩니다. 유한 항 계산 자체는 exact rational이므로 rounding loss는 0입니다. 해당 matrix는 rational cohomology의 Frobenius이며 integral prismatic complex 전체로 승격하지 않습니다.

계산 후 별도의 all-pairs finite-field oracle과 characteristic polynomial을 비교합니다. p=5에서는 `X²+2X+5`, p=7에서는 `X²+7`이 나옵니다. 테스트는 다른 good curves를 포함한 6개 곡선을 N=2와 N=3에서 계산하여 matrix reduction의 합치성도 검사합니다. 실행 상계는 p≤43, N≤12, binomial 항≤32입니다. p=2·3과 extension-field MW는 지원하지 않습니다.

### Unramified semilinear 연산

`unramified-frobenius.mjs`는 `(Z/p^N)[z]/f(z)`에서 mod p irreducibility를 먼저 검사합니다. `sigma(z)`는 `z^p mod p`와 합치하는 **f의 Hensel root**입니다. 혼합표수에서 일반 원소를 단순히 p제곱하는 함수로 대체하지 않습니다. `M sigma(M)…sigma^(a−1)(M)`를 곱한 뒤 division-free determinant로 다항식을 구하고, 모든 계수가 sigma-fixed scalar subring으로 내려오는지 검사합니다.

각 정수 coefficient는 `p^N>2B_j`일 때만 유일 복원합니다. 사용자 행렬은 입력 provenance를 유지하며, 이를 자동으로 기하적 Frobenius로 인증하지 않습니다. F9 손계산 대조 행렬에서는 semilinear trace=8, determinant=10이며 잘못된 plain square의 trace=6과 구별됩니다.

### Global Euler 연결

유한 곱은 각 prime의 변수 `T_p`를 보존합니다. Good elliptic model은 판별식의 모든 prime divisor가 제외 집합 S에 포함되어야 합니다. 무한 곱에는 `sigma>n+1` 또는 `sigma>2`의 실제 수렴 증거를 붙입니다.

`delta=sigma-boundary>0`이고 cutoff L에 대해 logarithmic tail을

`C L^(-delta) / (delta (1-2^(-1-delta)))`

로 제한합니다. C는 projective의 n+1 또는 elliptic의 4입니다. 분수 지수의 upper bound는 정수 근 계산으로 얻은 유리수라 Float64 반올림에 의존하지 않습니다. 독립적인 유한 logarithmic sum이 이 상계보다 작음을 대조합니다. 이 항등식은 RH/BSD, analytic continuation 또는 모든 prime의 수치 평가를 출력하지 않습니다.

## P5: q 비교와 BK point

`qPrismaticApplication`은 D의 q-PD ideal `(q−1)`과 prism ideal `([p]_q)`를 분리하고, `R^(1)=R completed-tensor_(D/I,phi) D/[p]_q`를 명시합니다. q→1, q→ζp, φ 후 q→ζp^p=1은 서로 다른 map입니다. S01 Theorems 16.18/16.22의 smooth polynomial 입력 가정이 해당 객체에 저장됩니다.

T와 `S=T+c`의 chain comparison은

`P_n(S)=sum_k (-c)^(n-k) GaussianBinomial(n,k;q) S^k`

와 `D_q P_n=[n]_q P_(n−1)`을 사용합니다. 두 degree에서 integral unit-triangular inverse를 실제 계산하므로 양 합성이 identity이고 cone이 contractible입니다. q=1일 때 `P_n(S)=(S-c)^n=T^n`이므로 같은 ring 원소를 비교합니다. 계수의 integral bound로 completed restricted series에도 연속 확장됩니다. 이 module chain iso는 multiplicative/E∞ map이라는 주장을 하지 않습니다.

BK point는 입력 polynomial을 u→0, u→π, u→π^p에 실제 적용합니다. Source `A[0]`가 free이므로 derived tensor의 higher Tor가 없고 generator 1을 각 target의 1로 보냅니다. 일반 uniformizer 변경이나 임의 Tate multiplier는 별도 certificate 없이 허용하지 않습니다.

현재 q-PD finite observer는 p=2,3,5, 표시 δ-depth=0..1, 표시 nerve degree=2..3을 지원합니다. 이 상계는 전체 완비 객체의 정의를 자르지 않습니다. P5-08의 actual adapter는 각 n에 대해 `P^n=D<T_0,...,T_n>`의 diagonal ideal을 사용합니다. `Y_j,0=(T_j^p-T_0^p)/[p]_q`를 δ-ring에서 자유롭게 첨가하고 모든 `δ^k([p]_q Y_j,0-(T_j^p-T_0^p))=0` 관계와 derived completion을 보존합니다. Monic diagonal sequence의 relative regularity가 S01 Lemma 16.10의 가정을 충족하므로 이 객체가 실제 discrete, flat, `[p]_q`-torsionfree q-PD envelope라는 정리를 적용할 수 있습니다.

Face map은 `T_j→T_alpha(j)`, `Y_j,0→Y_alpha(j),0−Y_alpha(0),0`이며 higher image를 실제 δ-polynomial로 계산합니다. Overlap inversion은 `T_j→T_j^-1`, `Y_j,0→−Y_j,0/(T_j^p T_0^p)`입니다. Face와 inversion의 차이는 free polynomial ring에서 항상 0이 아닙니다. 구현은 그 차이에 `[p]_q`를 곱한 뒤 **실제 defining relations**로 0을 확인하고 source의 torsionfreeness로 취소합니다. 객체 안에서 `[p]_q`를 invert하지 않습니다. Higher δ의 자연성은 δ-closed ideal과 envelope의 universal property로 이어집니다.

Diagonal nerve의 alternating differential, degeneracy, 두-affine overlap의 triple cocycle, mixed differential cancellation을 검증합니다. S01 Remark 16.16이 각 actual nerve를 affine q-crystalline complex와 식별하고, Remark 16.15의 Zariski descent가 P¹의 global totalization으로 연결합니다. Theorem 16.22의 비교는 같은 framed q-PD 입력의 double complex에서 form degree 0 및 Čech degree 0으로 향하는 두 projection의 quasi-isomorphism으로 기록합니다. 이 module/derived comparison에 multiplicative/E∞ 인증을 자동으로 덧붙이지 않습니다.

추가 4개 테스트는 독립 F101 rational polynomial oracle로 모든 relation·face·inversion 값을 대조하고, nontrivial δ carry, relation 삭제, map 변조, 부당한 prism-generator inversion을 검사합니다. 이 보조 oracle는 p-adic base를 F101로 바꾸는 기하적 주장으로 사용하지 않습니다. 기존 `cechModuleP1` weight-contraction diagnostic은 실제 envelope nerve의 증거로 사용하지 않으며 별도 낮은 등급을 유지합니다.

## P6: 표준 완비 대상과 실제 유한 관측

Base는 `K=completion(union Q_p(p^(1/p^m)))`와 compatible roots, `v(p)=1`, pseudo-uniformizer `p^(1/p)`를 고정합니다. Gauss norm, completion, mod-p Frobenius surjectivity가 [S04](https://www.math.uni-bonn.de/people/scholze/PerfectoidSpaces.pdf)의 표준 perfectoid torus 정리 가정에 연결됩니다. 유한 root level과 일반 projective variety를 perfectoid라고 분류하지 않습니다.

Dense tilt의 coefficient는 `{coefficient:'1', exponents:[piExponent,T1Exponent,...]}` monomial 배열입니다. Exponent denominator는 `p^M`이며 torus exponent는 음수도 가능합니다. 실제 addition/multiplication, 다음 root level의 Frobenius inverse, untilt mod p의 compatible sequence를 계산합니다. 임의 completed element는 Cauchy presentation과 오차 oracle이 추가로 필요합니다.

Sharp는 inverse Frobenius root의 integral lift를 p^r제곱합니다. Lift를 p의 배수만큼 바꾸면 r번째 결과의 차이는 valuation≥r+1입니다. 요청 V digits에 최소 V−1회 step이 필요하며 부족하면 `PRECISION_REQUIRED`입니다. Tilt와 untilt의 덧셈은 다릅니다. `sharp(1+t)`의 실제 비상수 correction과 lift perturbation/refinement 검사가 그 경계를 확인합니다.

Witt backend는 `w_n=sum_i p^i X_i^(p^(n-i))`에서 각 addition/multiplication coordinate를 재귀적으로 구합니다. p-torsionfree monomial lift에서 ghost numerator를 계산하고 p^n으로 정확히 나눈 뒤 mod p로 내립니다. 비상수 coefficient에 대해 associativity, distributivity, Teichmüller multiplication 및 Frobenius를 검사합니다. 작은 Fp 입력은 별도의 `W_N(Fp)≈Z/p^N` integer oracle와 전수 대조합니다.

Theta는 standard Witt coordinates에 대해 `sum_i p^i sharp(a_i^(1/p^i))`를 계산합니다. `xi=[p^flat]-p`는 실제 Witt subtraction으로 구하며 `xi_1=-1`의 unit, `theta(xi)=0`, `theta(phi(xi))=p^p-p`를 확인합니다. [S03 Lemmas 3.10–3.12](https://people.mpim-bonn.mpg.de/scholze/integralpadicHodge.pdf)와 S01 perfect-prism theorem의 kernel/regularity 가정은 선택한 untilt hash에 묶입니다.

AΩ adapter는 `C=completed algebraic closure(K)`로의 map, `O_C` torus와 completed p-power cover를 기록합니다. 실제 continuous group Koszul model은 mu-torsionfree이고 `L eta_mu`를 적용하면 integral character differential이 `[k]_q`가 됩니다. Fractional character에서는 `g*h=mu`인 integral scaling을 구하여 eta complex가 contractible임을 계산합니다. 완비 전체 객체와 pro-étale AΩ의 식별에는 S03 Lemma 9.6, Lemma 9.13, Proposition 9.14, Theorem 9.4(iii)를 정확한 standard torus 가정으로 적용합니다. Raw almost quasi-isomorphism 자체를 actual quasi-isomorphism으로 승격하지 않습니다.

Perfect-prism comparison은 étale의 reduction→I inversion→derived Frobenius fixed points, Zp의 추가 derived inverse limit, de Rham의 φ-twisted θ base change와 p-completion, crystalline의 residue Witt prism map 및 completed base change를 구별합니다. 단계를 제거하거나 순서를 바꾸면 실패합니다. 유한 mod-p 그림을 Zp étale cohomology로 표시하지 않습니다.

## 검증, evidence, 확장

Repo root에서 실행합니다.

```bash
node --test research-ide/mathscope-m2/arithmetic/tests/*.test.mjs
node research-ide/mathscope-m2/arithmetic/tests/record-evidence.mjs
```

현재 테스트는 **42/42** 통과합니다. 기존 원문 fixture 21개와 신규 독립·음성 대조 21개입니다. Evidence generator는 테스트를 실제 실행하고, 25개 example result, 원문 보존 검사, capabilities, runtime/test source SHA와 결과 hash를 기록합니다. 실행이 실패하면 성공 manifest를 쓰지 않습니다. 과거 0.1.0 evidence는 `evidence/history/`에 보존합니다.

`visualization.sourceHash`는 kind, input, scope, algorithm version, 수학 결과 body의 hash입니다. Source-code file SHA는 acceptance manifest에서 별도로 관리합니다. 모든 point는 exact source field에 묶이고, 대형 정수는 문자열, q축은 형식 coefficient index, finite-field 좌표는 residue code, p-adic 좌표는 valuation으로 표시합니다. Euclidean 거리로 p-adic convergence를 인증하지 않습니다.

새로운 adapter는 해당 theorem hypotheses를 입력 construction에서 검증하고, precision loss/완비화/출력 범위를 먼저 정해야 합니다. 독립 oracle와 실패해야 하는 변조·오입력 검사를 추가한 다음 해당 원문 criterion의 상태를 재평가합니다. 원문을 좁히거나 결과 badge를 `formalComplete:true`로 바꾸어 완료하지 않습니다. M1 보호 source 및 이전 evidence는 수정하지 않습니다. 통합 worker build, session binding, live browser verification과 배포는 상위 프로젝트 절차가 담당합니다.
