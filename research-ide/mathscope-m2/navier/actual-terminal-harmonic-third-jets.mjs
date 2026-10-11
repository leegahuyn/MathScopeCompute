/** Harmonic third slow jets of the unchanged actual terminal C/Phi source.
 * This additive adapter cannot accept a serialized certificate, caller
 * derivative arrays, a substituted source, or a new positivity premise.
 */
import {prepareActualTerminalPotentialThirdJets,assertActualTerminalPotentialThirdJets,actualTerminalPotentialThirdJetsCertificateFromProgram} from './actual-terminal-potential-third-jets.mjs';
import {exactThirdHarmonicPotentialJets} from './actual-harmonic-third-jet-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const metadata=p=>{const{nodes,...rest}=p;return canonicalStringify(rest);};
const publicData=p=>canonicalStringify({request:p.request,coordinates:p.coordinates,rows:p.rows,checks:p.checks,roots:p.roots,domain:p.domain,scope:p.scope,sourceBinding:p.sourceBinding});
const progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};

export function prepareActualTerminalHarmonicThirdJets(input={},context={}){
  return attachActualTerminalHarmonicThirdJets(prepareActualTerminalPotentialThirdJets(input,context),context);
}

export function attachActualTerminalHarmonicThirdJets(coefficientSource,context={}){
  assertActualTerminalPotentialThirdJets(coefficientSource);context.checkCancelled?.();
  const p=coefficientSource,G=p.G,sourceCount=p.program.nodes.length,coordinates=structuredClone(p.coordinates),directions=['R','Z','T'].map(name=>coordinates[name]),k=p.source.geometry.k,rows=[];
  for(const original of p.potentials){
    const harmonic=exactThirdHarmonicPotentialJets(G,{coefficient:original.body,phase:original.phase,k,directions}),fixedScale=original.physicalPotentialScale;
    const bodyChecks=harmonic.coefficientBindings.map((b,j)=>({component:j,originalBody:b.body===original.body[j],
      allTwentyOriginalCoefficientJets:b.directRoots.every((id,at)=>id===original.jets[at].roots[j]),allTwentyMaterializations:b.checks.every(c=>c.pass)}));
    const fixedScaleChecks=directions.map(direction=>({direction,actuallyIndependent:!G.freeCoordinates(fixedScale).has(direction),derivative:G.derivative(fixedScale,direction)}));
    const scaledBodies=harmonic.originalBodies.map(b=>({real:G.mul(fixedScale,b.real),imaginary:G.mul(fixedScale,b.imaginary)}));
    const scaledRoots=harmonic.jets.map(j=>({orders:j.orders,roots:j.roots.map(r=>({real:G.mul(fixedScale,r.real),imaginary:G.mul(fixedScale,r.imaginary)}))}));
    if(bodyChecks.some(c=>!c.originalBody||!c.allTwentyOriginalCoefficientJets||!c.allTwentyMaterializations)||fixedScaleChecks.some(c=>!c.actuallyIndependent||c.derivative!==G.zero))
      fail('INVALID_SOURCE_CONSTRUCTION','The harmonic source must retain all original C jets, the actual phase and the frozen source scale.');
    rows.push({sign:original.sign,originalCoefficient:original.body,originalPhase:original.phase,fixedScale,fixedScaleChecks,bodyChecks,harmonic,scaledBodies,scaledRoots,
      scaledMeaning:'Multiplication by the original frozen Q^(1/2-A) potential prefactor only. No physical coordinate or cylindrical basis derivatives are inferred.'});
    progress(context,'third-actual-harmonic-'+original.sign,G);
  }
  const checks=[
    {id:'unchanged-private-terminal-coefficient-source',pass:assertActualTerminalPotentialThirdJets(p)},
    {id:'original-coefficient-program-prefix-unchanged',pass:same(G.nodes.slice(0,sourceCount),p.program.nodes)},
    {id:'both-original-C-phase-and-frozen-k-bodies',pass:rows.length===2&&rows.every((r,j)=>same(r.originalCoefficient,p.potentials[j].body)&&r.originalPhase===p.potentials[j].phase&&r.harmonic.k===k&&r.bodyChecks.every(c=>c.originalBody&&c.allTwentyOriginalCoefficientJets&&c.allTwentyMaterializations))},
    {id:'all-one-hundred-twenty-real-harmonic-jets-per-sign',pass:rows.every(r=>r.harmonic.jets.length===20&&r.harmonic.jets.every(j=>j.roots.length===3&&j.checks.every(c=>c.real.pass&&c.imaginary.pass)))},
    {id:'all-thirty-phase-and-ninety-component-recurrence-edges-per-sign',pass:rows.every(r=>r.harmonic.phaseRecurrenceChecks.length===30&&r.harmonic.recurrenceChecks.length===90&&[...r.harmonic.phaseRecurrenceChecks,...r.harmonic.recurrenceChecks].every(c=>c.real.pass&&c.imaginary.pass))},
    {id:'original-frozen-potential-scale-retained',pass:rows.every(r=>r.fixedScaleChecks.every(c=>c.actuallyIndependent&&c.derivative===G.zero))},
    {id:'every-actual-trigonometric-body-materialization-and-no-oracles',pass:rows.every(r=>[r.harmonic.phaseBinding,...r.harmonic.coefficientBindings].every(b=>b.unspecifiedOracle===false&&b.checks.every(c=>c.pass))&&r.harmonic.jets.every(j=>j.checks.every(c=>c.real.bodyDerivativeBinding&&c.imaginary.bodyDerivativeBinding)))},
    {id:'original-actual-pulse-limits-kept',pass:p.scope.actualFortyComponentPulseThirdJets&&p.pulses.every(x=>!x.finite.finiteSumIsExactSolution)&&rows.every(r=>!r.harmonic.finiteApproximationSubstitutedForExactBody)}
  ];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','An actual harmonic third-jet source binding failed.');
  const roots={sourceCoefficientRoots:p.potentials.map(p=>p.body),sourceCoefficientJets:p.roots.potentialJets,phase:rows.map(r=>r.originalPhase),
    phaseJets:rows.map(r=>r.harmonic.phaseBinding.directRoots),k,fixedPotentialScale:rows.map(r=>r.fixedScale),
    harmonicCoefficients:rows.map(r=>r.harmonic.jets.map(j=>j.coefficients)),harmonicRealImaginaryRoots:rows.map(r=>r.harmonic.jets.map(j=>j.roots)),
    fixedScaledHarmonicRoots:rows.map(r=>r.scaledRoots.map(j=>j.roots))};
  const domain={...p.domain,harmonic:'The same open actual small-q terminal chart, with fixed labels and the same positive covariance domain. Xi, pulse time v and theta remain independent coordinates during these R/Z/T derivatives.',
    physicalAssembly:'The exact fixed potential prefactor is retained. Mapping slow and fast variables to physical coordinates and differentiating the cylindrical basis are separate.'};
  const scope={actualSelectedSmallQTerminalSource:true,originalCoefficientPhaseAndCarrierUnchanged:true,actualAllThirdSlowHarmonicJets:true,actualRealAndImaginaryTrigonometricBodies:true,
    everyActualCoefficientJetAndPhaseJetBodyBound:true,frozenPhysicalPotentialPrefactorRetained:true,originalPositiveWeightsAndFullVolterraLimitsRetained:true,
    actualFastXiAndPulseTimeJetAssembly:false,actualPhysicalSecondVelocityDerivativesConstructed:false,fullPhysicalSpaceTimePotentialJet:false,
    allLabelSeriesControlled:false,globalPhysicalResidual:false,flatErrorPackageComplete:false,wholeGNUMComplete:false,fullSameProfileN5:false,
    differentStrengthenedBackgroundSubstituted:false,newLeanKernelProof:false,workerExecution:false,browserExecution:false,m3MayStart:false};
  const sourceBinding={...p.sourceBinding,producer:'The unchanged private actual-terminal-potential-third-jets source supplies C/Phi. The harmonic adapter appends exact sine/cosine bodies and independently checked Bell/Leibniz recurrences.',
    coefficientSourceCompiler:p.program.compiler,coefficientSourceNodeCount:sourceCount,originalCoefficientAndPhaseRootEquality:true,
    callerDerivativeBodiesAccepted:false,commonDenominatorHelperIsOnlyAlgebra:true,actualBodyMaterializationPerformedSeparately:true};
  const result={G,coefficientSource:p,request:p.request,coordinates,rows,roots,checks,domain,scope,sourceBinding};
  const packed=G.pack(roots,{schema:'MathScope.ActualTerminalHarmonicThirdJetsProgram/1',compiler:'actual-terminal-harmonic-third-jets.mjs:prepareActualTerminalHarmonicThirdJets',compilerInput:p.request,
    coordinates,rows,checks,domain,scope,sourceBinding}),{nodes,...rest}=packed,program={...structuredClone(rest),nodes:nodes.slice()};result.program=program;
  seals.set(result,{G,coefficientSource:p,count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),program,programNodes:program.nodes,metadata:metadata(program),serialized:canonicalStringify(program),data:publicData(result)});
  progress(context,'third-harmonic-program-sealed',G);return result;
}

export function assertActualTerminalHarmonicThirdJets(p){
  const s=seals.get(p);
  if(!s||p.G!==s.G||p.coefficientSource!==s.coefficientSource||p.program!==s.program||p.program.nodes!==s.programNodes||metadata(p.program)!==s.metadata||JSON.stringify(p.program.nodes)!==s.nodes||
    JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions)||publicData(p)!==s.data)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged privately constructed actual harmonic source. Edited bodies, jet arrays or metadata and copied records are not source authority.');
  assertActualTerminalPotentialThirdJets(s.coefficientSource);return true;
}

export async function actualTerminalHarmonicThirdJetsCertificateFromProgram(p,context={}){
  assertActualTerminalHarmonicThirdJets(p);const s=seals.get(p),original=await actualTerminalPotentialThirdJetsCertificateFromProgram(p.coefficientSource,context),hash=await sha256(s.serialized);context.checkCancelled?.();
  return {schema:'MathScope.ActualTerminalHarmonicThirdJetsCertificate/1',status:'COMPLETED',pass:true,request:p.request,sourceBinding:p.sourceBinding,
    coefficientSourceGraph:original.graph,domain:p.domain,scope:p.scope,checks:p.checks,
    graph:{sha256:hash,nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,compiler:p.program.compiler,roots:p.roots,graphIncluded:false,fixedCompilerPrefix:true,laterAppendsExcluded:true},
    rows:p.rows.map(r=>({sign:r.sign,originalCoefficient:r.originalCoefficient,phase:r.originalPhase,k:r.harmonic.k,fixedScale:r.fixedScale,
      multiIndexCount:20,realScalarJetRootCount:120,phaseRecurrenceEdges:30,componentRecurrenceEdges:90,
      bodyChecks:r.bodyChecks,phaseJetRoots:r.harmonic.phaseBinding.directRoots,harmonicJets:r.harmonic.jets,scaledRoots:r.scaledRoots,
      formulas:r.harmonic.formulas,bodyBindingResponsibility:r.harmonic.bodyBindingResponsibility}))};
}
