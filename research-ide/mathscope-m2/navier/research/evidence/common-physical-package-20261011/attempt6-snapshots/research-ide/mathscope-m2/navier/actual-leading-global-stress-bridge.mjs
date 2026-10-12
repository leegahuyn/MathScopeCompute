/** Original leading pressure and stress divergence, attached to the same
 * complete global F0/U0/M0 source used by the positive pressure audit.
 * Every moment is a literal primitive. The source M0 identity is imported
 * from its independently executed global join proof, never assumed zero.
 */
import {prepareActualGlobalPressureConvolution,assertActualGlobalPressureConvolution} from './actual-global-pressure-convolution.mjs';
import {actualLeadingTargetOnSensitivityGraph} from './actual-covariance-sensitivity.mjs';
import {ActualInductionExpressions} from './actual-residual-order-induction-expressions.mjs';
import {disposableThirdJetCacheCopy,clearDisposableThirdJetCaches} from './actual-third-jet-ftc.mjs';
import {explicitPrimitiveBodyIdentity} from './actual-global-primitive-kernels.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {rewriteExactPressureOperands} from './actual-global-pressure-kernels.mjs';
import {originalLeadingMomentStressIdentity} from './actual-strengthened-background-kernels.mjs';
import {sourceScaledOperators} from './actual-continuation-exact-order-two-source.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

class LeadingStressExpressions extends ActualInductionExpressions {
  derivative(id,variable){if(!this.dependsOn(id,variable))return this.zero;return super.derivative(id,variable);}
}
const live=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=p=>({request:p.request,sourceBinding:p.sourceBinding,target:p.target,primitives:p.primitives,mass:p.mass,
    residual:p.residual,identities:p.identities,roots:p.roots,checks:p.checks,proof:p.proof,scope:p.scope});
const requirePass=(check,message)=>{if(!check.pass)fail('INVALID_SOURCE_CONSTRUCTION',message);return check;};
const algebra=(G,a,atomicNodes=[])=>requirePass(sourceGraphRationalIdentity(G,a,{atomicNodes,maxTerms:100000}),'The actual leading stress algebra failed.');
const equal=(G,a,b,atomicNodes=[])=>requirePass(explicitPrimitiveBodyIdentity(G,a,b,{atomicNodes,maxVisits:600000}),'The actual leading field or primitive body changed.');
const materialize=(G,id)=>{const n=G.nodes[id];return n.op==='actual_expression_partial'?G.materializeExpressionFunction(...n.args):id;};
const progress=(context,stage,G)=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length});};

function primitiveFTC(G,root,density,X,eta,atoms){
  const shared=G.nodes[root];
  if(shared.op!=='actual_expression_partial'||!same(shared.args[1],[X,eta])||shared.args[2].some(x=>x!==0))fail('INVALID_SOURCE_CONSTRUCTION','Retain the original full leading shared primitive.');
  const literal=materialize(G,root),node=G.nodes[literal];
  if(node.op!=='definite_integral'||node.args[2]!==G.zero||node.args[3]!==X||G.dependsOn(node.args[0],X))fail('INVALID_SOURCE_CONSTRUCTION','The leading primitive must keep its original fixed axis and full integrand.');
  const [integrand,variable]=node.args,endpoint=G.substitute(integrand,variable,X),
    actualDerivative=G.derivative(root,X),actualMixedDerivative=G.derivative(G.derivative(root,eta),X),
    derivativeBody=materialize(G,actualDerivative),mixedBody=materialize(G,actualMixedDerivative),densityEta=G.derivative(density,eta),
    checks={body:equal(G,endpoint,density,atoms),FTC:equal(G,derivativeBody,density,atoms),mixedFTC:equal(G,mixedBody,densityEta,atoms)};
  return {root,literal,integrand,variable,lower:G.zero,upper:X,density,densityEta,actualDerivative,actualMixedDerivative,derivativeBody,mixedBody,checks,
    axisDatum:G.substitute(literal,X,G.zero),constantAfterIntegrandSupportRetained:true,pass:true};
}

export function prepareActualLeadingGlobalStressBridge(input={},context={}){
  return attachActualLeadingGlobalStressBridge(prepareActualGlobalPressureConvolution(input,context),context);
}

export function attachActualLeadingGlobalStressBridge(source,context={}){
  assertActualGlobalPressureConvolution(source);clearDisposableThirdJetCaches(source.G);assertActualGlobalPressureConvolution(source);
  const G=new LeadingStressExpressions(disposableThirdJetCacheCopy(source.G),{maxNodes:2000000,checkCancelled:context.checkCancelled}),
    prepared=source.primitives.prepared,b=prepared.bootstrap,{X,eta}=b.constants,q=(n,d=1)=>G.q(n,d),{A,D,d,L}=G.core,h=G.parameter('h'),
    target=actualLeadingTargetOnSensitivityGraph(G,{background:{prepared},chart:{X,eta,s:G.one},constants:{A,D,h}}),
    {F,U,M,I,J,S,Cp,Pi,W}=target,Fx=G.derivative(F,X),Fxx=G.derivative(Fx,X),Feta=G.derivative(F,eta),
    Ux=G.derivative(U,X),Uxx=G.derivative(Ux,X),Ueta=G.derivative(U,eta),Meta=G.derivative(M,eta),
    atoms=[F,Fx,Fxx,Feta,U,Ux,Uxx,Ueta,M,Meta,I,J,S,Cp,Pi,
      ...[I,J,S,Cp,Pi].map(x=>G.derivative(x,eta)),G.core.P0,G.derivative(G.core.P0,eta)],checks=[];
  const add=(id,pass,extra={})=>{if(!pass)fail('INVALID_SOURCE_CONSTRUCTION',id);checks.push({id,pass,...extra});};
  progress(context,'leading-global-target-built',G);
  add('same-full-heat-prepared-F0',materialize(G,F)===b.actualHeat.heat.finalF);
  add('same-original-U0-M0-v0-and-global-stream-proof',materialize(G,U)===b.finalU&&M===source.stream.roots.actualGlobalM0&&
    b.finalU===source.stream.roots.actualGlobalU0&&b.finalv===source.stream.roots.actualGlobalv0&&source.stream.scope.actualGlobalLeadingMassPrimitiveIdentity&&source.stream.scope.actualLeadingContinuityIdentity);
  add('same-original-source-prefix',same(G.nodes.slice(0,source.program.nodes.length),source.program.nodes));
  const primitives={I:primitiveFTC(G,I,G.mul(q(2),X,F),X,eta,atoms),J:primitiveFTC(G,J,G.mul(q(2),X,U,F),X,eta,atoms),
    S:primitiveFTC(G,S,G.sub(G.pow(U,2),G.mul(X,G.pow(F,2))),X,eta,atoms),Cp:primitiveFTC(G,Cp,G.pow(F,2),X,eta,atoms)};
  add('all-four-full-leading-prefixes-and-mixed-FTC',Object.values(primitives).every(p=>p.pass&&p.axisDatum===G.zero));
  add('original-nonconstant-pressure-axis-datum',Pi===G.add(G.core.P0,Cp)&&!G.dependsOn(G.core.P0,X)&&G.core.P0===b.originalLeading.G.core.P0);
  progress(context,'leading-global-four-prefix-FTC',G);
  const replacements=new Map();
  for(const p of Object.values(primitives)){replacements.set(p.actualDerivative,p.density);replacements.set(p.actualMixedDerivative,p.densityEta);}
  const Mx=G.derivative(M,X),MetaX=G.derivative(Meta,X),v=prepared.records[0].global.v,
    explicitV=G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.div(G.mul(q(2),D,eta,M),X)),G.div(G.mul(d,Meta),X)),L);
  // These two operands are replaced ONLY by the same private all-join M0
  // theorem already checked above. Its eta derivative follows from the
  // original smooth source; the retained raw expressions are not deleted.
  replacements.set(Mx,U);replacements.set(MetaX,Ueta);replacements.set(v,explicitV);
  const mass={M,U,v,rawMx:Mx,rawMixedMx:MetaX,explicitV,sourcePrimitive:source.stream.roots.actualGlobalM0,
    sourceProof:source.stream.parts.stream,sourceAllJoins:source.stream.parts.regularity,
    replacementAuthority:'The same private all-join M0 primitive/continuity proof, including actual original roots and their axis limits.',
    mixedIdentity:'d_X d_eta M0=d_eta U0 by original smoothness and the globally verified M0_X=U0.',pass:true};
  const {T,Z}=sourceScaledOperators(G,X,eta),angularExponent=G.neg(G.add(A,q(1,2))),axialExponent=G.neg(A),
    theta=G.add(T(angularExponent,F),G.mul(v,G.add(G.mul(X,Fx),F)),G.mul(U,Z(angularExponent,F)),G.mul(q(-2),G.add(G.mul(X,Fxx),G.mul(q(2),Fx)))),
    axial=G.add(T(axialExponent,U),G.mul(X,v,Ux),G.mul(U,Z(axialExponent,U)),Z(G.mul(q(-2),A),Pi),G.mul(q(-2),G.add(G.mul(X,Uxx),Ux))),
    radial=G.sub(G.derivative(Pi,X),G.pow(F,2)),radius=G.sqrt(G.mul(q(2),X)),
    thetaNumerator=G.add(G.mul(G.sub(G.one,h),I),G.neg(G.mul(D,eta,G.derivative(I,eta))),G.neg(G.mul(d,G.derivative(J,eta))),G.mul(q(2),G.sub(h,D),eta,J)),
    axialNumerator=G.add(G.neg(G.mul(X,W,U)),G.mul(D,G.sub(M,G.mul(eta,Meta))),G.mul(q(4),h,eta,S),G.neg(G.mul(d,G.derivative(S,eta))),G.mul(X,G.sub(G.mul(q(4),A,eta,Pi),G.mul(d,G.derivative(Pi,eta))))),
    thetaFlux=G.add(G.neg(G.div(G.mul(F,G.pow(X,2),W),L)),G.div(thetaNumerator,G.mul(q(2),L)),G.mul(q(2),G.pow(X,2),Fx)),
    axialFlux=G.add(G.div(axialNumerator,L),G.mul(q(2),X,Ux)),
    targetBindings={theta:algebra(G,G.sub(G.mul(X,materialize(G,target.raw[0])),thetaFlux),atoms),
      axial:algebra(G,G.sub(G.mul(radius,materialize(G,target.raw[1])),axialFlux),[...atoms,radius])},
    actualDefects={radial,theta:G.add(G.derivative(thetaFlux,X),G.mul(X,theta)),axial:G.add(G.derivative(axialFlux,X),axial)},
    reduced=Object.fromEntries(Object.entries(actualDefects).map(([name,root])=>[name,rewriteExactPressureOperands(G,root,{replacements,atomicNodes:atoms,maxVisits:600000})])),
    actualChecks=Object.fromEntries(Object.entries(reduced).map(([name,row])=>[name,algebra(G,row.value,atoms)])),
    generic=originalLeadingMomentStressIdentity();
  add('original-full-leading-target-and-both-shear-bindings',Object.values(targetBindings).every(c=>c.pass));
  add('actual-leading-radial-angular-axial-cancellation',Object.values(actualChecks).every(c=>c.pass));
  add('independent-universal-leading-identity-and-negative-controls',generic.pass&&Object.values(generic.checks).every(c=>c.pass)&&Object.values(generic.negativeControls).every(c=>!c.pass));
  // Preserve the uncancelled expression after deleting the ORIGINAL shear;
  // the negative control is not a synthetic arbitrary residual.
  const missingThetaShear=G.sub(actualDefects.theta,G.derivative(G.mul(q(2),G.pow(X,2),Fx),X)),
    missingZShear=G.sub(actualDefects.axial,G.derivative(G.mul(q(2),X,Ux),X)),
    negative=Object.fromEntries(Object.entries({missingThetaShear,missingZShear}).map(([name,root])=>{
      const row=rewriteExactPressureOperands(G,root,{replacements,atomicNodes:atoms,maxVisits:600000});return [name,sourceGraphRationalIdentity(G,row.value,{atomicNodes:atoms,maxTerms:100000})];
    }));
  add('omitting-either-original-shear-is-rejected',Object.values(negative).every(c=>!c.pass));
  progress(context,'leading-global-source-residual-cancelled',G);
  const residual={radial,theta,axial,thetaFlux,axialFlux,actualDefects,reduced,angularExponent,axialExponent,
    definitions:'Original independent time/transport/pressure/radial-viscosity coefficient equations from sourceScaledOperators; no residual is defined as minus a target derivative.',
    physicalRadialWeights:'d_X(X*Ttheta)+X*(rtheta/R)=0; d_X(sqrt(2X)*Tz)+rz=0.',
    axialViscosityFirstAppearsAtOrderOne:true,positiveOrderTermsRemovedFromLeadingEquationOnly:true},
    identities={targetBindings,actualChecks,generic,negativeControls:negative},
    scope={actualFullGlobalLeadingPressurePrimitive:true,actualLeadingPressureAxisDatumRetained:true,actualLeadingFullStressDivergenceCancellation:true,
      actualSameGlobalM0ContinuityConsumed:true,actualAllLeadingJoinsConsumed:true,actualPositiveOrderStressCancellations:false,
      fullInfiniteStrengthenedPhysicalResidualFlatness:false,wholeGN4Complete:false,newLeanKernelProof:false,numericalValuesComputed:false,workerExecution:false,browserExecution:false,m3MayStart:false},
    sourceBinding={sourceProfile:source.source.profileId,parameterExpressionSHA256:source.source.parameterExpressionSHA256,sourceCompiler:'prepareActualGlobalPressureConvolution',
      leadingCompiler:'prepareActualGlobalLeadingProgram',targetCompiler:'actualLeadingTargetOnSensitivityGraph',sourceNodes:source.program.nodes.length,
      completeHeatFUsed:true,rawSourcesReplaced:false,callerFieldsOrMomentsAccepted:false},
    proof={axis:'Every new prefix is exactly zero at X=0. The original P0(eta) is retained. Weighted divergence identities hold at X>0; the same original regular source jets supply their one-sided axis limits without evaluating 0/0.',
      primitives:'Literal FTC and its mixed eta derivative for all I,J,S,Cp. The full global M0 theorem supplies M_X=U through each join and original total mass cancellation.',
      stress:'Bind the original covariance-target theta/z formulas, including both radial shear terms, to their weighted conservative fluxes. Direct original momentum coefficients cancel their derivatives by exact rational arithmetic after only the authenticated FTC and stream substitutions.',
      range:'This closes the leading n0 algebra/primitive link. Positive stress moments, cutoff commutators, infinite summation and physical wave residual assembly remain separate.'},
    roots={actualF0:F,actualU0:U,actualM0:M,actualv0:v,actualPi0:Pi,actualPressureAxis:G.core.P0,actualTtheta0:target.raw[0],actualTz0:target.raw[1],
      actualRadialResidual:radial,actualThetaResidual:theta,actualAxialResidual:axial,actualThetaFlux:thetaFlux,actualAxialFlux:axialFlux},
    result={G,source,request:source.request,sourceBinding,target,primitives,mass,residual,identities,roots,checks,proof,scope},
    packed=G.pack(roots,{schema:'MathScope.ActualLeadingGlobalStressBridgeProgram/1',compiler:'actual-leading-global-stress-bridge.mjs:prepareActualLeadingGlobalStressBridge',...data(result)}),{nodes,...rest}=packed;
  result.program={...structuredClone(rest),nodes:G.nodes.slice()};
  live.set(result,{G,source,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result)),program:canonicalStringify(result.program)});
  return result;
}

export function assertActualLeadingGlobalStressBridge(p){
  const s=live.get(p);if(!s||p.G!==s.G||p.source!==s.source||canonicalStringify(p.G.nodes.slice(0,s.count))!==s.nodes||!p.G.functionDefinitionsUnchanged(s.definitions)||
    canonicalStringify(data(p))!==s.data||canonicalStringify(p.program)!==s.program)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private actual leading stress bridge.');
  assertActualGlobalPressureConvolution(s.source);return true;
}
export async function actualLeadingGlobalStressBridgeCertificate(p){
  assertActualLeadingGlobalStressBridge(p);const encoded=canonicalStringify(p.program);
  return {schema:'MathScope.ActualLeadingGlobalStressBridgeCertificate/1',pass:true,...data(p),graph:{sha256:await sha256(encoded),nodeCount:p.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).byteLength,fixedCompilerPrefix:true,graphIncluded:false}};
}
