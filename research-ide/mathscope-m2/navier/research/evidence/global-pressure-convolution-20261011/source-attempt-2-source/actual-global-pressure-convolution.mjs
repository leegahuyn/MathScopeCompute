/** Additive connection of the actual global leading field to the original
 * positive pressure convolution. Historical source expressions stay live
 * and unchanged. No caller field, derivative, moment or zero flag is used.
 */
import {assertActualGlobalPositivePrimitives,prepareActualGlobalPositivePrimitives} from './actual-global-positive-primitives.mjs';
import {assertActualLeadingStreamPrimitive,attachActualLeadingStreamPrimitive} from './actual-leading-stream-primitive.mjs';
import {explicitPrimitiveBodyIdentity,matchExplicitPrimitiveDensity,originalRadialBumpPrimitiveIdentities} from './actual-global-primitive-kernels.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {buildActualOmegaCoefficientOverX} from './actual-continuation-exact-order-two-source.mjs';
import {originalLeadingOmegaPrefixIdentity} from './actual-leading-omega-prefix-kernel.mjs';
import {reduceLiteralZeroDerivatives} from './actual-strengthened-background-kernels.mjs';
import {originalPressurePairConvolutionIdentity,originalReservedPowerLogIdentity,reduceExpressionOnDeclaredBranches} from './actual-global-pressure-kernels.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const live=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=r=>({source:r.source,request:r.request,sourceBinding:r.sourceBinding,leadingRestrictions:r.leadingRestrictions,
    rows:r.rows,roots:r.roots,checks:r.checks,scope:r.scope,remaining:r.remaining});
const requirePass=(c,message)=>{if(!c.pass)fail('INVALID_SOURCE_CONSTRUCTION',message);return c;};
const body=(G,id)=>{const n=G.nodes[id];return n.op==='actual_expression_partial'&&n.args[2].every(x=>x===0)
  ?body(G,G.materializeExpressionFunction(n.args[0],n.args[1],n.args[2])):id;};
const equal=(G,a,b,atomicNodes=[])=>requirePass(explicitPrimitiveBodyIdentity(G,a,b,{atomicNodes,maxVisits:600000}),'The original pressure-source expression does not match its retained body.');
const algebra=(G,difference,atomicNodes=[])=>requirePass(sourceGraphRationalIdentity(G,difference,{atomicNodes,maxTerms:100000}),'The original pressure-source algebra did not cancel.');

function bindSameOriginalSource(primitives,stream){
  assertActualGlobalPositivePrimitives(primitives);assertActualLeadingStreamPrimitive(stream);
  const {prepared,G}=primitives,original=prepared.bootstrap.originalLeading,base=G.baseNodeCount;
  if(stream.leading!==original||stream.G!==original.G||!Number.isSafeInteger(base)||
    !same(G.nodes.slice(0,base),stream.G.nodes.slice(0,base))||
    stream.roots.actualGlobalM0!==prepared.bootstrap.finalM||stream.roots.actualGlobalU0!==prepared.bootstrap.finalU||
    stream.roots.actualGlobalv0!==prepared.bootstrap.finalv)
    fail('INVALID_SOURCE_CONSTRUCTION','The primitive audit and induction copy must contain the SAME original leading graph and roots.');
  const copied=G.expressionSystems.filter(s=>s.historicalBodyPreserved);
  if(!copied.every((s,j)=>{const t=stream.G.expressionSystems[j];return t&&s.body===t.body&&same(s.parameters,t.parameters)&&s.name===t.name;})||
    !same(G.picardSystems.slice(0,G.baseDefinitionCount),stream.G.picardSystems.slice(0,G.baseDefinitionCount)))
    fail('INVALID_SOURCE_CONSTRUCTION','An original copied source function body changed.');
  return {commonOriginalNodeCount:base,commonCopiedExpressionDefinitions:copied.length,
    originalLeadingRoots:{M:stream.roots.actualGlobalM0,U:stream.roots.actualGlobalU0,v:stream.roots.actualGlobalv0},
    separateAppendOnlyAuditGraphs:true,newAuditNodeIdsInterchanged:false,sourceMassAndContinuityAuthenticated:true};
}

function sourceRestrictionGeometry(primitives){
  const {G,prepared:{bootstrap:b}}=primitives,{X,eta}=b.constants,q=(n,d=1)=>G.q(n,d),p=G.source.parametersExactExpressions,
    {pre,loop}=b.originalLeading,{Xa,XR,Xi,restLeft,restRight}=pre.constants,heat=b.actualHeat.heat,
    {Ileft,Iright,X0:I1Left,I1Right,Xv}=b.constants,X0=b.orderOne.X0,IposRight=b.orderOne.IposRight,
    a=b.inner.aSquared,stages=G.outer.stages,reserved=stages.find(s=>s.id==='reservedPower'),pulse=stages.find(s=>s.id==='pulse'),last=stages.at(-1),
    checks={sourceSupport:primitives.sourceSupport.pass,
      sameLoopStart:same(p.loopILeft,{product:[{quotient:[{integer:4},{ref:'Lambda'}]},{exp:{quotient:[{ref:'t1'},{integer:8}]}}]}),
      sameBOuter:same(p.BOuter,{product:[{integer:1000},{ref:'T'}]}),
      sameI2Start:same(p.X0I2,{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:2},{product:[{integer:60},{ref:'BOuter'}]},{integer:-20}]}}]}),
      sameI2End:same(p.I2Right,{product:[{ref:'X0I2'},{exp:{integer:5}}]}),
      originalRestoration:restLeft===G.mul(XR,G.exp(q(-8)))&&restRight===G.mul(XR,G.exp(q(-7))),
      originalPatchRight:loop.b8.roots.B8patchRight===G.mul(XR,G.exp(q(-5))),
      originalHeatStart:explicitPrimitiveBodyIdentity(G,heat.XK,G.mul(heat.Xtail,G.exp(q(1,5)))).pass,
      reservedStageIsBeforePulse:reserved.end===pulse.start,
      originalReservedLength:reserved.length===G.mul(q(60),G.parameter('BOuter')),
      originalSourceBounds:8002n*128n>4096n&&60000n*128n>20n&&20n*128n>8n&&128n>1n,
      gapBeforeIpos:-20n+5n<-14n,
      gapAfterIpos:-14n+5n<0n,
      commonCollarBeforeLoop:16n>8n};
  const heatTailRelation=equal(G,heat.Xtail,G.mul(XR,G.exp(last.start)));
  if(!Object.values(checks).every(Boolean))fail('INVALID_SOURCE_CONSTRUCTION','The original leading/core/reserved-patch ordering changed: '+Object.keys(checks).filter(k=>!checks[k]).join(', '));
  const y0=G.add(G.parameter('T'),q(2),G.mul(q(60),G.parameter('BOuter')),q(-14)),
    yRight=G.add(y0,q(5)),y=heat.outerLogCoordinate;
  return {X,eta,Xa,XR,Xi,restLeft,restRight,Ileft,Iright,I1Left,I1Right,X0,IposRight,Xv,a,heat,reserved,pulse,last,y,y0,yRight,
    checks,heatTailRelation,
    inequalities:['0<Xa<aSquared<loopILeft<1<restLeft<restRight<B8patchRight<XR',
      'I1Right<I2Right<IposLeft<IposRight<reservedPower.end in logarithmic radius',
      'Ipos log radius lies strictly inside the original reservedPower stage',
      'IposRight<Xv<Xplus<Xb and IposRight<Xtail<XK'],
    proof:'The pinned aSquared=Xa*exp(t1/16), loopILeft=Xa*exp(t1/8),0<t1<1,Lambda>=2^16640 give the inner gaps. XR=110*(CSelected*Pstar)^10, Pstar=exp(2T),T>128 give XR*exp(-8)>1 and place every B8 bump after1. The exact logarithmic patch offsets are -25,-20,-14, with widths5. The reserved stage has length60000T; later stages are positive and consecutive. No decimal coordinate comparison is used.'};
}

function sourceFlatStepValues(G,b,{side}){
  const {X}=b.constants,q=(n,d=1)=>G.q(n,d),XR=G.parameter('XR'),X1=G.parameter('X0I1'),values=new Map();
  for(let j=0;j<5;j++){
    const a=G.div(G.sub(G.div(X,XR),q(j+6,2048)),q(1,4096));
    for(let k=0;k<=3;k++)values.set(G.step(a,k),side==='before'||k?G.zero:G.one);
    const i=G.div(G.sub(G.div(X,X1),q(j+9)),q(1,2));
    for(let k=0;k<=3;k++)values.set(G.step(i,k),side==='before'||k?G.zero:G.one);
  }
  return values;
}

function leadingRestriction(G,b,facts,kind,root){
  const {X,Xa,XR,Xi,restLeft,restRight,Ileft,Iright,I1Left,I1Right,a,heat,reserved,y}=facts,
    patchRight=b.originalLeading.loop.b8.roots.B8patchRight,
    earlyLeft=new Set([Xa,Xi,restLeft,restRight,patchRight,XR,Ileft,I1Left,heat.X0,heat.XK]),
    afterBeforeIpos=new Set([Xi,restLeft,restRight,patchRight,XR,Iright,I1Right,heat.I2Right]),
    index=G.outer.stages.findIndex(s=>s.id==='reservedPower'),
    selectPiecewise=n=>{
      if(n.coordinate===X){
        if(kind==='natural'&&earlyLeft.has(n.left))return 3;
        if(kind==='collar'){
          if(n.left===Xa)return 4;if(earlyLeft.has(n.left))return 3;
        }
        if(kind==='ipos'){
          if(n.left===Xa&&n.right===heat.XK)return 4;
          if(n.left===heat.XK)return 3;
          if(afterBeforeIpos.has(n.right))return 5;
          if(n.left===XR)return 5;
        }
      }
      if(kind==='ipos'&&n.coordinate===y){
        const j=G.outer.stages.findIndex(s=>s.start===n.left&&s.end===n.right);
        if(j>=0&&j<index)return 5;if(j===index)return 4;
      }
      return null;
    };
  return reduceExpressionOnDeclaredBranches(G,root,{coordinate:X,selectPiecewise,
    stepValues:sourceFlatStepValues(G,b,{side:kind==='ipos'?'after':'before'}),maxVisits:600000});
}

function actualLeadingRestrictions(primitives,stream,context){
  const {G,prepared:{bootstrap:b,records}}=primitives,q=(n,d=1)=>G.q(n,d),facts=sourceRestrictionGeometry(primitives),
    {X,eta,heat,reserved,y,y0,XR,X0}=facts,{F,U,v}=records[0].global,targets=records[0].actual,cases=[];
  for(const kind of ['natural','collar']){
    const rows=[];for(const [name,source]of Object.entries({F,U,v})){
      const reduced=leadingRestriction(G,b,facts,kind,source),expected=leadingRestriction(G,b,facts,kind,targets[name]),
        check=equal(G,reduced.value,expected.value);
      rows.push({name,source,innerSource:targets[name],reduced,expected,check});
    }
    cases.push({kind,domain:kind==='natural'?[G.zero,facts.Xa]:[facts.Xa,facts.a],rows});
    context.onProgress?.({phase:'pressure-leading-'+kind+'-restriction',nodes:G.nodes.length});
  }
  const ipos=leadingRestriction(G,b,facts,'ipos',F),stageField=heat.stageFields.find(s=>s.id==='reservedPower'),
    R=G.sqrt(G.mul(q(2),X)),sourceField=G.div(stageField.value,R),selectedCheck=equal(G,ipos.value,sourceField),
    lambda=G.parameter('lambda'),alpha=G.neg(G.add(q(1,2),lambda)),f=G.inv(G.add(G.one,G.pow(eta,2))),logf=G.log(f),
    stageExponent=G.add(reserved.logAStart,G.mul(alpha,G.sub(y,reserved.start)),logf),
    actualStageExpected=G.mul(G.parameter('Pstar'),G.sqrt(G.exp(G.mul(q(2),stageExponent)))),
    densityCheck=equal(G,stageField.value,actualStageExpected),
    Kexponent=G.add(G.mul(q(-1,2),G.parameter('T')),q(-7,10),G.mul(q(-1,2),lambda),G.neg(G.mul(G.add(q(1,2),lambda),G.sub(G.mul(q(60),G.parameter('BOuter')),q(14))))),
    amplitudeCheck=algebra(G,G.sub(Kexponent,G.add(reserved.logAStart,G.mul(alpha,G.sub(y0,reserved.start))))),
    Kpos=G.mul(G.parameter('Pstar'),f,G.exp(Kexponent)),Rbase=b.orderOne.Rbase,
    ef=G.mul(Kpos,G.exp(G.mul(G.add(G.one,G.mul(q(2),lambda)),G.log(Rbase)))),
    sourceAmplitudeCheck=equal(G,b.orderOne.ef,ef),
    radiusCheck={originalRbase:Rbase===G.sqrt(G.mul(q(2),X0)),originalX0:X0===G.parameter('X0Ipos'),originalX:X===G.var('X')};
  if(!Object.values(radiusCheck).every(Boolean))fail('INVALID_SOURCE_CONSTRUCTION','The reserved-power source radius changed.');
  const power=G.exp(G.mul(G.sub(q(-2),G.mul(q(2),lambda)),G.log(R))),reservedF=G.mul(b.orderOne.ef,power),generic=originalReservedPowerLogIdentity();
  context.onProgress?.({phase:'pressure-leading-Ipos-restriction',nodes:G.nodes.length});
  return {geometry:{checks:facts.checks,heatTailRelation:facts.heatTailRelation,inequalities:facts.inequalities,proof:facts.proof},cases,
    ipos:{domain:[facts.X0,facts.IposRight],source:F,reduced:ipos,selectedCheck,densityCheck,amplitudeCheck,sourceAmplitudeCheck,radiusCheck,
      actualPositiveStageDensity:stageField.value,stageExponent,sourceY:y,sourceY0:y0,sourceRbase:Rbase,reservedF,generic,
      theorem:'The actual complete leading F0 equals the original ef*R^(-2-2lambda) throughout Ipos, by its selected actual stage and the checked positive-real exponent identity.',
      fullHeatAndAllCorrectionRootsRetained:true,positiveCovarianceWeightsAssumed:false,pass:true},
    commonCore:{domain:[G.zero,facts.a],F0:targets.F,U0:targets.U,v0:targets.v,
      sourceMassIdentityUsed:stream.scope.actualGlobalLeadingMassPrimitiveIdentity,
      derivatives:'Both actual source representatives are smooth on the original common collar. Their equality on the two open subintervals and the original smooth join gives equality of every fixed jet there.',pass:true},pass:true};
}

/** First attach stage. The full convolution/primitive proof is added below;
 * this certificate never promotes the restriction alone to that theorem.
 */
export function attachActualGlobalPressureConvolution(primitives,stream,context={}){
  const sourceBinding=bindSameOriginalSource(primitives,stream),{G}=primitives,
    leadingRestrictions=actualLeadingRestrictions(primitives,stream,context),
    result={G,primitives,stream,source:primitives.source,request:{throughOrder:primitives.request.throughOrder},sourceBinding,leadingRestrictions,
      rows:[],roots:{actualFullLeadingF:primitives.prepared.records[0].global.F,actualReservedLeadingF:leadingRestrictions.ipos.reservedF},
      checks:[{id:'actual-leading-core-and-Ipos-restrictions',pass:leadingRestrictions.pass}],
      scope:{actualLeadingCoreAndReservedPressureRestrictions:true,actualGlobalFullPressureConvolutionIdentity:false,
        actualOrderOneOmegaPrefixPrimitive:false,actualOrderOnePressurePrimitive:false,
        allOrderPhysicalResidualFlatness:false,wholeGN4Complete:false,newLeanKernelProof:false,m3MayStart:false},
      remaining:['Connect the actual lower Omega representatives and all pressure ordered pairs.','Bind the actual order-one Omega prefix and every pressure primitive join.','Tangential stress cancellation and all-order full physical residual flatness remain separate.']};
  const packed=G.pack(result.roots,{schema:'MathScope.ActualGlobalPressureConvolutionProgram/1',...data(result)}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  live.set(result,{G,primitives,stream,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result)),program:canonicalStringify(result.program)});return result;
}

export function prepareActualGlobalPressureConvolution(input={},context={}){
  const primitives=prepareActualGlobalPositivePrimitives(input,context),stream=attachActualLeadingStreamPrimitive(primitives.prepared.bootstrap.originalLeading,{},context);
  return attachActualGlobalPressureConvolution(primitives,stream,context);
}

export function assertActualGlobalPressureConvolution(result){
  const s=live.get(result);if(!s||s.G!==result.G||s.primitives!==result.primitives||s.stream!==result.stream||
    canonicalStringify(data(result))!==s.data||canonicalStringify(result.program)!==s.program||canonicalStringify(result.G.nodes.slice(0,s.count))!==s.prefix||!result.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged actual global pressure proof object.');
  assertActualGlobalPositivePrimitives(s.primitives);assertActualLeadingStreamPrimitive(s.stream);return true;
}

export async function actualGlobalPressureConvolutionCertificate(result){
  assertActualGlobalPressureConvolution(result);const encoded=canonicalStringify(result.program);
  return {schema:'MathScope.ActualGlobalPressureConvolutionCertificate/1',...data(result),
    graph:{sha256:await sha256(encoded),nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length,fixedCompilerPrefix:true}};
}
