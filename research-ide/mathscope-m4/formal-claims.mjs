import {isVerifiedM4KernelReadback} from './kernel-evidence.mjs';

const details={
 selected_finite_fixture:{id:'M4.FINITE.GENERATED_VECTOR',criterionIds:['I3-05'],student:'G·Δ·p·정밀도·계수식·가정을 hash로 고정한 기본 소스가 실제 커널을 통과했습니다. 정리의 수학적 범위는 (2,−3,5,7) 한 정수 벡터의 고정 d²=0이며, 파라미터를 바꾸면 새로운 소스와 검사가 필요합니다.',scope:'One generated Int⁴ fixture (2,-3,5,7) for the fixed inherited D=1 differential. Other bound parameters do not broaden this theorem.',assumptions:[],counterexample:'Any one-character source or parameter/assumption change makes prior evidence stale.'},
 delta_two_numerator:{id:'M4.FINITE.DELTA_TWO_NUMERATOR',criterionIds:['I3-02'],student:'모든 정수 x,y에서 p=2 δ의 분자는 2xy입니다. 나눗셈의 정밀도와 다른 소수는 별도 조건입니다.',scope:'Universal x,y in Int; exact p=2 numerator polynomial only.',assumptions:[],counterexample:'Changing p, division convention or numerator coefficients is outside this target.'},
 differential_squared_zero:{id:'M4.FINITE.D_SQUARED_ZERO',criterionIds:['I3-02'],student:'고정 D=1 정수 행렬에서 모든 v∈ℤ⁴에 대해 d₁(d₀(v))=0입니다. 다른 복합체나 생략 weight에는 자동 적용되지 않습니다.',scope:'Universal Int⁴ coordinates for the fixed inherited D=1 matrices.',assumptions:[],counterexample:'A mutated D1 invalidates the matrix certificate.'},
 scalar_chain_map:{id:'M4.FINITE.IDENTITY_SEMILINEAR_CHAIN_MAP',criterionIds:['I3-02'],student:'계수환 ℤ의 자기 사상이 항등인 경우, 모든 정수 s와 벡터 v에 대해 d₀(sv)=s d₀(v)입니다. Frobenius 사상에는 별도 증명이 필요합니다.',scope:'All s:Int and v:Int⁴; coefficient endomorphism sigma=id on Int.',assumptions:['COEFFICIENT_ENDOMORPHISM_IDENTITY'],counterexample:'A nonidentity sigma or different coefficient ring needs its own chain-map proof.'},
 prime_interval_fixture:{id:'M4.FINITE.PRIMES_BELOW_30',criterionIds:['I3-02'],student:'2≤n<30에서 모든 시험 약수를 확인한 정확한 소수 목록입니다. 범위 밖 소수 또는 전칭 소수 정리는 포함하지 않습니다.',scope:'Finite exact trial-division interval [2,30).',assumptions:[],counterexample:'Composite 21 submitted as prime is rejected by decide.'},
 bracket_antisymmetric:{id:'M4.FINITE.BRACKET_ANTISYMMETRY',criterionIds:['I3-02'],student:'모든 2×2 정수 행렬 A,B에 대해 [A,B]+[B,A]=0입니다. bracket은 AB−BA로 정의됩니다.',scope:'Universal integer 2x2 matrix commutator.',assumptions:[],counterexample:'A changed multiplication or bracket operation needs a new source check.'},
 bracket_jacobi:{id:'M4.FINITE.BRACKET_JACOBI',criterionIds:['I3-02'],student:'모든 2×2 정수 행렬 A,B,C의 교환자 bracket이 Jacobi 항등식을 만족합니다. 이름만 Lie라고 붙인 임의 연산을 인증하지 않습니다.',scope:'Universal integer 2x2 matrix commutator Jacobi identity.',assumptions:[],counterexample:'A nonassociative multiplication is outside the proved operations.'},
 shear_plaquette:{id:'M4.FINITE.SHEAR_PLAQUETTE',criterionIds:['I3-02'],student:'모든 정수 s,t의 shear 행렬로 만든 네 변 plaquette의 곱은 항등행렬입니다. 일반 비가환 gauge 군이나 연속 극한을 의미하지 않습니다.',scope:'Universal integer shear subgroup U(s)U(t)U(-s)U(-t)=I.',assumptions:[],counterexample:'General noncommuting link matrices can have nontrivial holonomy.'},
 uniform_limit_uniformly_continuous:{id:'M4.ANALYTIC.UNIFORM_LIMIT_CONTINUITY',criterionIds:['I3-03','I3-08'],student:'명시된 precision ball 법칙을 갖는 모든 공간 X,Y에서, 모든 근사 함수가 균등연속이고 함수열이 전역적으로 균등수렴하면 극한 함수도 균등연속입니다. 모든 x에 공통인 N이 필요하며, 미분과 극한의 교환 또는 실수 norm 구현은 포함하지 않습니다.',scope:'All X,Y:Type with supplied PrecisionMetric structures; uniform convergence across all domain x; continuity of every n-th approximant. Uses two triangle steps at k+2,k+1,k.',assumptions:['PRECISION_BALL_REFLEXIVE_SYMMETRIC_TRIANGLE_FINER','UNIFORM_CONVERGENCE_ALL_DOMAIN','UNIFORM_CONTINUITY_EVERY_APPROXIMANT'],counterexample:'Pointwise convergence alone does not supply a common N; derivative-limit interchange is a separate obligation.'},
 uniform_continuity_adapter:{id:'M4.COMPARISON.UNIFORM_CONTINUITY_ADAPTER',criterionIds:['I3-04'],student:'같은 precision 공간과 균등수렴·균등연속 가정을 정확히 제공한 경우 실제 exported Lean 정리로 연결됩니다. 프리즘·BSD·NS 문헌 링크는 이 adapter의 커널 결과가 아닙니다.',scope:'Exact import of MathScope.M4.Analytic.uniform_limit_uniformly_continuous with unchanged types and premises.',assumptions:['SAME_PRECISION_METRIC','UNIFORM_CONVERGENCE_ALL_DOMAIN','UNIFORM_CONTINUITY_EVERY_APPROXIMANT'],counterexample:'A reference URL or an unrelated theorem type cannot replace the exported target.'},
 assumed_cauchy_limit:{id:'M4.CONDITIONAL.ASSUMED_COMPLETE_LIMIT',criterionIds:['I3-01','I3-06','I3-07'],student:'모든 해당 공간이 완비라는 사용자 공리를 가정할 때만 Cauchy 열의 극한 존재를 얻습니다. 이 공리를 증명하거나 연구 관문을 닫은 결과가 아닙니다.',scope:'Explicit user-axiom demonstration, intentionally barred from unconditional grade.',assumptions:['MathScope.M4.Conditional.assumedComplete'],counterexample:'Unconditional grade must reject this target because its #print axioms includes assumedComplete.'},
};
const exact = '표시된 대수 연산에 대한 정확한 항등식입니다.';
const precision = '근사는 precision ball의 자연수 지수로 표현합니다. 균등수렴의 N은 같은 지수에서 모든 x에 공통입니다.';
const uniformQuantifier = '모든 구조 X,Y,mx,my와 u,f에 대해, 모든 n에서 uₙ의 균등연속성과 u의 균등수렴을 가정합니다. 모든 출력 정밀도 k에 대해 공통 입력 정밀도 ℓ이 존재합니다.';
const coverage = {
 selected_finite_fixture: ['지정된 정수 벡터 v=(2,−3,5,7) 한 개와 고정 D=1 미분입니다.',exact,
  'd₀(2,−3,5,7)=(−3,7,7,3,3)이고 d₁(−3,7,7,3,3)=(0,0,0)입니다.'],
 delta_two_numerator: ['p=2를 고정한 모든 정수 x,y에 적용합니다.',exact],
 differential_squared_zero: ['고정 D=1 행렬의 모든 정수 4-벡터 v에 적용합니다.',exact],
 scalar_chain_map: ['정수 위 항등 계수 사상을 고정한 모든 s∈ℤ와 v∈ℤ⁴에 적용합니다.',exact],
 prime_interval_fixture: ['2≤n<30인 자연수 n에 대한 유한 목록입니다.', '유한 범위의 정확한 나머지 검사입니다.'],
 bracket_antisymmetric: ['모든 2×2 정수 행렬 A,B에 적용합니다.',exact],
 bracket_jacobi: ['모든 2×2 정수 행렬 A,B,C에 적용합니다.',exact],
 shear_plaquette: ['모든 s,t∈ℤ에서 지정된 네 shear 행렬에 적용합니다.',exact],
 uniform_limit_uniformly_continuous: [uniformQuantifier,precision,
  'k=3을 고르면 수렴 조건에서 k+2=5에 대한 공통 N을 고릅니다. u_N의 지수 5 균등연속성에서 얻은 ℓ로 모든 x,y에 같은 결론을 적용합니다.'],
 uniform_continuity_adapter: [uniformQuantifier,precision],
 assumed_cauchy_limit: ['모든 precision metric과 모든 Cauchy 열 u에 대해 극한의 존재를 결론으로 둡니다.',
  'Cauchy 및 수렴 조건을 precision ball 지수로 표시합니다. 완비성은 명시된 사용자 공리입니다.'],
};

export const M4_OPEN_RESEARCH=Object.freeze(['RH_GLOBAL_BRIDGE','BSD_UNIVERSAL','GENERAL_G_CONTINUUM_QUANTUM_YM','NEW_PRISM_COMPARISON','DERIVATIVE_LIMIT_INTERCHANGE_REAL_ADAPTER']);
export function buildFormalClaims(readback){
 if(!isVerifiedM4KernelReadback(readback))throw new TypeError('Read raw kernel evidence before producing a trusted claim view.');
 return readback.targets.filter(t=>t.target.startsWith('MathScope.M4.')).map(t=>{
  const d=details[t.target.split('.').at(-1)];if(!d)throw new Error('Unknown claim target.');
  const generated=t.target.includes('.Generated.');
  const [quantifier, approximationScope, example] = coverage[t.target.split('.').at(-1)];
  const shared = Object.freeze({claimId:d.id,scope:d.scope,assumptionIds:Object.freeze([...d.assumptions]),
    quantifier,approximationScope});
  return {...shared,shared,criterionIds:d.criterionIds,grade:t.grade,
    student:{...shared,explanation:d.student,example:example??null},
    expert:{...shared,target:t.target,targetType:t.targetType,axioms:t.axioms,userAxioms:t.userAxioms,
      counterexampleCondition:d.counterexample},
    sourceFile:generated?'research-ide/mathscope-m4/evidence/core-kernel-20261014-attempt4/sources/MathScope/M4/Generated.lean':'research-ide/mathscope-m4/lean/'+t.target.split('.').slice(0,-1).join('/')+'.lean',
    executedAt:readback.executedAt,receiptSha256:readback.receiptSha256,grantsOriginalCriterionAcceptance:false};
 });
}
