import {getCapabilities as m1Capabilities,getExamples as m1Examples} from '../../mathscope-m1/arithmetic/index.mjs';
import {getCapabilities as m2Capabilities,getExamples as m2Examples} from '../../mathscope-m2/arithmetic/index.mjs';
import {canonicalJSON,cloneJSON,freeze,sha256} from './contracts.mjs';

/** Release review documents enumerate scope. They never certify a conjecture. */
export async function exportReviewPackets(snapshot,sourceBinding) {
  const m1=m1Capabilities(),m2=m2Capabilities();
  const examples1=m1Examples(),examples2=m2Examples();
  const make=(id,title,supported,fixtures,remaining,questions)=>({schema:'MathScope.M3.P8.ReviewPacket/1',id,title,sourceBinding:cloneJSON(sourceBinding),supportedScope:supported,fixtures,remainingProofs:remaining,researchQuestions:questions,releaseAcceptance:{status:id==='P7'?'VISUALIZATION_PUBLISHED_MATH_CRITERIA_PARTIAL':id==='P8'?'IN_PROGRESS':'INHERITED_SCOPED_IMPLEMENTATION',allOriginalCriteriaComplete:false},conjectureResolution:{globalRH:false,globalBSD:false,globalYangMillsMassGap:false,universalNavierStokesRegularity:false},importedAuthorityAccepted:false});
  const fixture=e=>({id:e.id,title:e.title||e.label||e.id,request:e.request,executionStatus:'AVAILABLE_FOR_INDEPENDENT_REPLAY_NOT_EXECUTED_BY_PACKET_EXPORT'});
  const packets=[
    make('P1-P3','P1–P3 · 유한 소수·p-adic·복합체',m1.supported,examples1.map(fixture),m1.unsupported,['How far do the current explicit comparison models extend to new native prismatic inputs without adding hypotheses?']),
    make('P4','P4 · Frobenius와 유한 cohomology',m2.supported.filter(x=>/Frobenius|projective|Euler|Monsky/.test(x)),examples2.filter(x=>/projective|elliptic|mw-|semilinear|residue/.test(x.id)).map(fixture),m2.unsupported.filter(x=>/MW|RH|BSD|kernel/.test(x)),['Which new geometric comparisons are needed before a companion matrix may be identified with a cohomological Frobenius?']),
    make('P5-P6','P5–P6 · q-PD·BK·perfectoid 비교',m2.supported.filter(x=>!/Frobenius|projective|Euler|Monsky/.test(x)),examples2.filter(x=>/q-|bk-|tilt|sharp|theta|witt|tower|aomega|prism/.test(x.id)).map(fixture),m2.unsupported.filter(x=>!/MW/.test(x)),['Which descent, convergence and comparison steps remain external theorems for arbitrary completed presentations?']),
    make('P7','P7 · 유한 해석적 인증과 8개 3D 보기',snapshot.p7.supported,snapshot.p7.fixtures,snapshot.p7.criteria,['What effective general-height zero isolation, general Tate/descent/rank certificates and global operator bridges can be added with independently checkable evidence?']),
    make('P8','P8 · 객체·비교·유한 Lean·검토', ['Independent object/arithmetic/proof axes','Fresh inherited M2 calculations for four structural views','Typed comparison maps with required assumptions','Deterministic exact finite witnesses and Lean source exports','Source-bound execution and replay; imported authority never adopted','Exact finite candidate comparisons and bounded counterexample minimization'],snapshot.p8.fixtures,snapshot.p8.criteria,['How can the finite consumers be connected to broader geometric objects without silently assuming the desired comparison?'])
  ];
  for(const packet of packets){packet.packetSHA256=await sha256(packet);}
  return freeze({schema:'MathScope.M3.P8.ReviewPackets/1',packets,originalCriteriaSource:cloneJSON(snapshot.originalCriteriaSource),sourceSnapshotSHA256:await sha256(snapshot),packetsSHA256:await sha256(packets),authority:'REVIEW_DOCUMENTS_ONLY',wholeP8Complete:false,wholeM3Complete:false,universalConjectureSolved:false});
}
