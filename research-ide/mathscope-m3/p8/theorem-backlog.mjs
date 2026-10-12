import {cloneJSON,freeze} from './contracts.mjs';

/** Candidate plans are not theorem receipts. Only a validated exact-input audit
 * can attach an actual compiled declaration below. */
const CANDIDATES = [
  {
    id:'P8.CANDIDATE.INTEGER_D2',title:'정수 미분 d² = 0',
    theoremStatement:'For v : MathScope.M1.Arithmetic.C0 ℤ, d1 (d0 v) = ⟨0,0,0⟩.',
    inputType:'MathScope.M1.Arithmetic.C0 ℤ; the explicitly defined integer differentials d0 and d1.',
    coreLemmas:['MathScope.M1.Arithmetic.p1_d_squared_zero'],
    certificateConsumption:'The compiled universal consumer imports the actual differential definitions. The finite JSON may display their integer product but cannot replace the definitions.',
    declarations:['MathScope.P8.inherited_d_squared'],additionalAxioms:[],
    scope:'The stated integer complex; no automatic identification with a native prismatic complex.'
  },
  {
    id:'P8.CANDIDATE.UNIT_CONTRACTION',title:'가역 성분의 contraction',
    theoremStatement:'weightB k (posA k x)=0, posH1 (posA k x)=x, posA k (posH1 (u,v))+weightH2 (weightB k (u,v))=(u,v), and weightB k (weightH2 w)=w.',
    inputType:'k x u v w : ℤ; inherited posA, weightB, posH1 and weightH2.',
    coreLemmas:['MathScope.M1.Arithmetic.positive_weight_contractible'],
    certificateConsumption:'The four identities are consumed as a conjunction in the named compiled declaration. No division by a nonunit is introduced.',
    declarations:['MathScope.P8.inherited_unit_contraction'],additionalAxioms:[],
    scope:'The explicit positive-weight integer block and its specified homotopy.'
  },
  {
    id:'P8.CANDIDATE.CHAIN_EQUIVALENCE',title:'유한 chain equivalence',
    theoremStatement:'For the explicit P1 comparison complex and its retained degree 0 and degree 2 summands, r∘i=id and i∘r + d∘H + H∘d=id in every represented degree.',
    inputType:'The inherited C0 R, C1 R, C2 R, i0/i2, r0/r2 and h1/h2 for a commutative coefficient ring R.',
    coreLemmas:['MathScope.M1.Arithmetic.p1_retraction','MathScope.M1.Arithmetic.p1_homotopy_degree_zero','MathScope.M1.Arithmetic.p1_homotopy_degree_one','MathScope.M1.Arithmetic.p1_homotopy_degree_two'],
    certificateConsumption:'A future dedicated P8 consumer must import the actual chain maps and verify all degreewise retraction/homotopy identities; matrix rank agreement alone is insufficient.',
    declarations:[],additionalAxioms:[],
    sourceAvailable:'p8/lean/MathScope/M1/Arithmetic/Algebra.lean',
    remainingObligations:['Add a dedicated P8 chain-equivalence consumer and its actual type/axiom audit. The inherited lemmas are not promoted by this backlog entry.'],
    scope:'BACKLOG_NOT_COMPILED_AS_P8_CONSUMER; this is a planned finite certificate, not a geometric comparison theorem.'
  },
  {
    id:'P8.CANDIDATE.POINT_COUNT',title:'유한체 점계수',
    theoremStatement:'For the generated prime, the computed affinePoints list equals expectedAffine, contains no duplicates, and pointCount prime equals its exact recorded cardinality including the one infinity point.',
    inputType:'A supported exact prime string and traceLength; generated List (ℕ × ℕ) for y² = x³ − x modulo p.',
    coreLemmas:['MathScope.P8.affinePoints','MathScope.P8.pointCount','MathScope.P8.Generated.prime_and_smooth_fixture'],
    certificateConsumption:'exportLeanCertificate deterministically emits the exhaustive residue list and decide consumers. Only a matching prime/input/generated-source digest may use a recorded compilation.',
    declarations:['MathScope.P8.Generated.point_count_certificate','MathScope.P8.Generated.prime_and_smooth_fixture'],additionalAxioms:[],
    scope:'The exact generated prime-field curve fixture; no extension-field count or global L-function inference.'
  },
  {
    id:'P8.CANDIDATE.TRACE_RECURRENCE',title:'2×2 trace recurrence',
    theoremStatement:'For A : Mat2 and n : ℕ, tr(A^(n+2)) = tr(A)·tr(A^(n+1)) − det(A)·tr(A^n); the generated finite prefix is checked independently.',
    inputType:'Mat2 with four integer entries; natural power index and finite generated trace prefix.',
    coreLemmas:['MathScope.P8.trace_cayley_hamilton','MathScope.P8.mpow','MathScope.P8.tracePrefix'],
    certificateConsumption:'The universal matrix recurrence is compiled from ring identities. The generated companion matrix is evaluated separately against each printed integer trace coefficient.',
    declarations:['MathScope.P8.trace_cayley_hamilton','MathScope.P8.matrix_trace_recurrence','MathScope.P8.Generated.trace_matrix_certificate'],additionalAxioms:[],
    scope:'An exact matrix/polynomial model. A crystalline or prismatic Frobenius interpretation still needs its comparison certificate.'
  },
  {
    id:'P8.CANDIDATE.BOUNDED_RESIDUE',title:'경계가 붙은 residue 복원',
    theoremStatement:'If −5 ≤ x,y ≤ 5 and x mod 625 = y mod 625, then x=y; each generated boundedResidues candidate list is evaluated exactly.',
    inputType:'x y : ℤ with the printed interval hypotheses; explicit modulus, residue and natural bound for finite lists.',
    coreLemmas:['MathScope.P8.boundedResidues','MathScope.M1.Arithmetic.precision_reduction_composes'],
    certificateConsumption:'The uniqueness consumer keeps its interval hypotheses. The generated residue lists and the precision-reduction identity are separate audited declarations.',
    declarations:['MathScope.P8.residue_625_unique','MathScope.P8.inherited_precision_reduction','MathScope.P8.Generated.reconstruction_certificate'],additionalAxioms:[],
    scope:'The displayed modulus and bounds only; an omitted or enlarged bound is not silently certified.'
  },
  {
    id:'P8.CANDIDATE.FINITE_EULER',title:'유한 Euler 항등식',
    theoremStatement:'((1−Tp)(1−pTp))((1−Tq)(1−qTq)) = ((1−Tp)(1−Tq))((1−pTp)(1−qTq)) in a commutative ring, together with the generated finite coefficient convolution identity.',
    inputType:'R with CommRing R; p q Tp Tq : R; exact finite integer coefficient lists and a truncation length.',
    coreLemmas:['MathScope.P8.truncatedProduct','MathScope.P8.finite_euler_regrouping'],
    certificateConsumption:'The universal regrouping uses the ring tactic; the separate generated decide declaration consumes the exact finite coefficient prefix.',
    declarations:['MathScope.P8.finite_euler_regrouping','MathScope.P8.Generated.finite_euler_certificate'],additionalAxioms:[],
    scope:'Finite polynomial identities. No analytic continuation, missing-prime completion or infinite tail estimate is inferred.'
  }
];

const LIBRARY_COVERAGE = {
  schema:'MathScope.M3.P8.LibraryCoverage/1',reviewedAt:'2026-10-12',
  pinnedLean:'4.34.1',pinnedMathlibCommit:'d13f23b723b8a846827a245b89c10fc7d3f11612',
  scope:'Primary documentation was inspected separately from the pinned local consumer compilation. Documentation presence does not assert availability or compilation at the deployed pin.',
  entries:[
    {topic:'Axiom audit',status:'OFFICIAL_DOCUMENTATION_CONFIRMED',url:'https://lean-lang.org/doc/reference/latest/Axioms/',observation:'The official command reports transitive axiom dependencies. P8 checks exact declaration types and explicit custom-axiom ledgers.'},
    {topic:'Witt vectors',status:'OFFICIAL_DOCUMENTATION_CONFIRMED',url:'https://leanprover-community.github.io/mathlib4_docs/Mathlib/RingTheory/WittVector/Defs.html',observation:'The documented p-typical Witt-vector structure and polynomial ring operations are building blocks, not a prismatic comparison theorem.'},
    {topic:'Homotopy and quasi-isomorphism',status:'OFFICIAL_DOCUMENTATION_CONFIRMED',url:'https://leanprover-community.github.io/mathlib4_docs/Mathlib/Algebra/Homology/QuasiIso.html',observation:'The documentation includes quasi-isomorphisms and HomotopyEquiv.quasiIso_hom. A typed connection from a concrete certificate remains necessary.'},
    {topic:'Native advanced prismatic comparisons',status:'NOT_CONFIRMED_FOR_PINNED_DEPLOYMENT',url:'https://arxiv.org/abs/1905.08229',observation:'The referenced mathematical comparison theory remains an external theorem source in the current P8 routes. No named kernel-compiled advanced comparison is supplied by this assessment; search non-detection is not a proof of library absence.'}
  ],
  freshKernelExecuted:false,formalProofIssued:false
};

export function buildTheoremBacklog(leanStatus) {
  const recorded = leanStatus?.status==='RECORDED_KERNEL_CHECK_MATCH' && leanStatus?.registry?.ok===true;
  const targets = new Map(recorded ? (leanStatus.recordedAudit?.targets||[]).map(row=>[row.name,row]) : []);
  const candidates=CANDIDATES.map(candidate=>{
    const audited=candidate.declarations.map(name=>targets.get(name)).filter(Boolean);
    return {...cloneJSON(candidate),
      compileStatus:!candidate.declarations.length?'BACKLOG_NOT_COMPILED_AS_P8_CONSUMER':audited.length===candidate.declarations.length?'RECORDED_EXACT_INPUT_KERNEL_TYPES_ATTACHED':'NO_MATCHING_SUCCESSFUL_P8_AUDIT',
      actualAuditedTargets:cloneJSON(audited),
      additionalAxiomsPolicy:'No custom axiom is permitted in the finite audit; exact standard axioms are reported by each actual compiled target.',
      freshKernelExecuted:false,formalProofIssued:false};
  });
  return freeze({schema:'MathScope.M3.P8.TheoremBacklog/1',candidates,libraryCoverage:cloneJSON(LIBRARY_COVERAGE),
    authority:'CANDIDATE_METADATA_AND_MATCHED_RECORDED_TYPES_ONLY',formalProofIssued:false,wholeP8Complete:false,wholeM3Complete:false});
}
