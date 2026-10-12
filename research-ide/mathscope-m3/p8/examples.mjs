import {sha256} from './contracts.mjs';
import {getExamples as m2Examples} from '../../mathscope-m2/arithmetic/index.mjs';

export async function objectExample() {
  const ref=async(id,value)=>({id,revision:'1',hash:await sha256(value)});
  return {schema:'MathScope.M3.P8.Claim/1',id:'p8:finite-complex',revision:'1',object:{id:'object:projective-p2',kind:'PRISMATIC_VIA_COMPARISON',baseRef:await ref('base:Z3',{p:'3',ring:'Z_3'}),coefficientRingRef:await ref('ring:Z3',{ring:'Z_3'})},arithmetic:{mode:'EXACT',scope:{kind:'FINITE',description:'Exact displayed finite free terms for the standard P2 comparison model; the comparison is an external theorem application.'},precision:{pAdicDigits:4}},proof:{method:'EXTERNAL_THEOREM',target:{declaration:'MathScope.P8.ProjectiveComparison',propositionId:'P8.PROJECTIVE.COMPARISON',type:'The standard smooth proper projective comparison, with its declared crystalline prism and base map.'},sourceRefs:[await ref('source:projective-bundle',{url:'https://stacks.math.columbia.edu/tag/0FUN'})],assumptionRefs:[]}};
}
export function assumptionExample(conditional=false) {
  const type='The explicitly stated target proposition holds.',claimId='claim:target',declaration='Research.target',propositionId='P8.RESEARCH.TARGET';
  const target={claimId,declaration,propositionId,type};
  const entry={id:'assumption:target',revision:'1',kind:'USER_AXIOM',declaration:'Research.assumedTarget',propositionId,statement:type,sourceRefs:[]};
  return {schema:'MathScope.M3.P8.AssumptionLedger/1',target,entries:conditional?[entry]:[],dependencyGraph:{direction:'CLAIM_TO_PREREQUISITE',nodes:[{id:claimId,kind:'theorem',statement:type,propositionId,declaration},...(conditional?[{id:entry.id,kind:'user_axiom',statement:type,propositionId,declaration:entry.declaration}]:[])],edges:conditional?[{from:claimId,to:entry.id,type:'DEPENDS_ON'}]:[]}};
}
export async function getP8Examples() {
  const inherited=m2Examples(),request=id=>inherited.find(e=>e.id===id).request;
  const example=(id,title,kind,input,criterion)=>({id,title,request:{kind,input},criterion});
  return [
    example('p8-object','객체·정확도·증거의 독립 축','p8.object_contract',{claim:await objectExample()},'P8-01'),
    ...[['basis','차수·기저·valuation','degree-basis-valuation','m2-projective-p3-n2'],['polygon','ordinary Hodge/Newton 다각형','hodge-newton','m2-elliptic-p5'],['supersingular','supersingular Hodge/Newton 다각형','hodge-newton','m2-elliptic-p7'],['weight','소수·차수·Frobenius weight','prime-degree-frobenius','m2-projective-p3-n2'],['tower','유한 정밀화 tower','refinement-tower','m2-perfectoid-tower']].map(([id,title,view,key])=>example('p8-'+id,title,'p8.visual_structure',{view,m2Request:request(key)},'P8-02')),
    ...[['etale','m2-prism-etale'],['deRham','m2-prism-de-rham'],['crystalline','m2-prism-crystalline'],['projective','m2-projective-p3-n2'],['qPD','m2-q-cech-p1']].map(([id,key])=>example('p8-comparison-'+id,'비교 사상 · '+id,'p8.comparison',{route:request(key)},'P8-03')),
    example('p8-finite','F5 점계수·trace·residue·유한 Euler 인증서','p8.finite_certificate',{prime:'5',traceLength:7},'P8-04'),
    example('p8-finite-f7','F7의 새 유한 계산과 Lean 내보내기','p8.finite_certificate',{prime:'7',traceLength:6},'P8-04'),
    example('p8-assumptions','빈 가정 장부 · 증명 미실행','p8.assumption_audit',{ledger:assumptionExample()},'P8-05'),
    example('p8-conditional','목표 명제를 가정한 조건부 결과','p8.assumption_audit',{ledger:assumptionExample(true),removeAssumptionId:'assumption:target'},'P8-05'),
    example('p8-mutations','실제 재계산과 변조 관문','p8.mutation_audit',{},'P8-06'),
    example('p8-candidates','같은 특성다항식, 다른 rank','p8.candidate_compare',{A:{id:'nilpotent',matrix:[['0','1'],['0','0']]},B:{id:'zero',matrix:[['0','0'],['0','0']]},probes:['0','1/2','1'],minimize:true},'P8-07'),
    example('p8-normalization','같은 행렬, 다른 determinant 정규화','p8.candidate_compare',{A:{id:'A',matrix:[['1']],normalization:{scalar:'2',exponentialLinear:'0'}},B:{id:'B',matrix:[['1']],normalization:{scalar:'1',exponentialLinear:'0'}},minimize:true},'P8-07'),
    example('p8-review','P1–P3 / P4 / P5–P6 / P7 / P8 독립 검토','p8.review_packets',{},'P8-08')
  ];
}
