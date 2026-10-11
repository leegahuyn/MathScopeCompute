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
import {originalPressurePairConvolutionIdentity,originalReservedPowerLogIdentity,reduceExpressionOnDeclaredBranches,rewriteExactPressureOperands} from './actual-global-pressure-kernels.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const live=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=r=>({source:r.source,request:r.request,sourceBinding:r.sourceBinding,leadingRestrictions:r.leadingRestrictions,commonTuples:r.commonTuples,
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

function literalLeadingOmega(G,{X,eta,U,v}){
  const q=(n,d=1)=>G.q(n,d),{D,d,L}=G.core,vX=G.derivative(v,X),vXX=G.derivative(vX,X),vEta=G.derivative(v,eta),vPlus=G.add(v,G.mul(X,vX));
  return {value:G.add(G.div(G.add(G.mul(D,eta,vEta),vPlus),L),
    G.mul(v,G.add(G.mul(q(1,2),v),G.mul(X,vX))),
    G.div(G.mul(U,G.sub(G.mul(d,vEta),G.mul(q(2),eta,vPlus))),L),
    G.mul(q(-2),G.add(G.mul(q(2),vX),G.mul(X,vXX)))),jets:[U,v,vX,vXX,vEta]};
}

/** The actual positive average still carries its accumulated local mass
 * on Xcut<X<aSquared. This is the part lost by an uncut-core replacement.
 */
function positiveCommonTuple(primitives,n,context){
  const {G,prepared:{bootstrap:b,records}}=primitives,r=records[n],g=r.global,local=r.actual,
    {X,eta}=b.constants,{Xkeep,Xcut,X0,IposRight}=b.orderOne,q=(a,d=1)=>G.q(a,d),z=G.zero,
    sourceMass=primitives.rows[n-1].mass,kappa=G.sub(G.one,G.step(G.div(G.sub(G.log(G.div(X,G.parameter('Xa'))),G.div(G.parameter('t1'),q(64))),G.div(G.parameter('t1'),q(64))))),
    expectedF=G.choose(X,Xkeep,Xcut,r.raw.F,G.mul(kappa,r.raw.F),z),expectedU=G.choose(X,Xkeep,Xcut,r.raw.U,G.mul(kappa,r.raw.U),z),
    localChecks={F:equal(G,local.F,expectedF),U:equal(G,local.U,expectedU)},
    reduce=id=>reduceExpressionOnDeclaredBranches(G,id,{coordinate:X,
      selectPiecewise:p=>p.coordinate===X&&p.left===X0&&p.right===IposRight?3:null,
      atomicNodes:[local.F,local.U],maxVisits:300000}),
    F=reduce(g.F),U=reduce(g.U),fieldChecks={F:equal(G,F.value,local.F),U:equal(G,U.value,local.U)},
    t=G.fresh('global_pressure_local_average_'+n),expectedAverage=G.integral(G.substitute(local.U,X,G.mul(t,X)),t,z,G.one),
    averageLiteralCheck=equal(G,local.average,expectedAverage),
    globalAverage=body(G,g.average),av=G.nodes[globalAverage],mass=body(G,g.M),massNode=G.nodes[mass];
  if(av.op!=='smooth_piecewise'||massNode.op!=='smooth_piecewise'||av.args[0]!==X||av.args[1]!==Xkeep||
    av.args[2]!==sourceMass.branches[1]||av.args[5]!==z||massNode.args[5]!==z)
    fail('INVALID_SOURCE_CONSTRUCTION','The original positive average must retain its regular core, mass/X, and moment-closed zero branches.');
  const averageBranches={core:equal(G,massNode.args[3],G.mul(X,av.args[3])),middle:equal(G,av.args[4],G.div(mass,X))},
    avgForFormula=n===1?globalAverage:g.average,UForFormula=n===1?body(G,g.U):g.U,
    expectedGlobalV=G.div(G.sub(G.sub(G.mul(q(2),eta,UForFormula),G.mul(q(2),eta,G.add(G.core.D,r.raw.lambda),avgForFormula)),G.mul(G.core.d,G.derivative(avgForFormula,eta))),G.core.L),
    expectedLocalV=G.div(G.sub(G.sub(G.mul(q(2),eta,local.U),G.mul(q(2),eta,G.add(G.core.D,r.raw.lambda),local.average)),G.mul(G.core.d,G.derivative(local.average,eta))),G.core.L),
    reconstructionChecks={global:equal(G,g.v,expectedGlobalV),local:equal(G,local.v,expectedLocalV)};
  if(!sourceMass.pass||!primitives.sourceSupport.expressionChecks.commonInterval)fail('INVALID_SOURCE_CONSTRUCTION','The live source mass primitive and full common collar are required.');
  context.onProgress?.({phase:'pressure-positive-common-tuple',order:n,nodes:G.nodes.length});
  return {order:n,domain:[z,b.inner.aSquared],localChecks,F,U,fieldChecks,averageLiteralCheck,averageBranches,reconstructionChecks,
    actualRoots:{globalF:g.F,globalU:g.U,globalAverage:g.average,globalv:g.v,globalM:g.M,localF:local.F,localU:local.U,localAverage:local.average,localv:local.v},
    sourceMassPrimitive:sourceMass.source,originalKappa:kappa,originalRawLambda:r.raw.lambda,
    proof:{mass:'The live actual mass proof gives M_n(X)=integral_0^X U_n(s)ds, including zero axis data and every cutoff join. All Ipos bumps start after aSquared; the actual U_n equals its retained cutoff local U on [0,aSquared].',
      average:'For X>0 change variables s=tX in the retained literal local average. Both actual averages equal integral_0^1 U_local(tX)dt; their continuous regular limits agree at X=0. On Xcut<X<aSquared the accumulated local mass is retained, even though U_local(X)=0.',
      velocity:'The two checked original stream reconstructions use the same U, average, eta derivative and D+2*n*h. Therefore global and cutoff-local v agree on the entire common collar, as do all fixed jets by the original smooth joins.'},
    localMassAfterCutoffDiscarded:false,uncutRawTupleUsedAcrossActivation:false,pass:true};
}

function sourceExteriorAt(primitives,root,{atXv=false}={}){
  const {G,prepared:{bootstrap:b}}=primitives,{X}=b.constants,support=primitives.sourceSupport,
    {Xb,Xplus,...earlier}=support.endpoints,allowed=new Set(Object.values(earlier));
  if(!atXv)allowed.add(Xplus);
  support.leadingExterior.physicalRightEnds.forEach(x=>allowed.add(x));
  const tail=support.leadingExterior,steps=sourceFlatStepValues(G,b,{side:'after'}),
    reduced=reduceExpressionOnDeclaredBranches(G,root,{coordinate:X,stepValues:steps,
      selectPiecewise:p=>p.coordinate===X&&allowed.has(p.right)||p.coordinate===tail.tailLogCoordinate&&p.right===tail.tailLogRight?5:null,maxVisits:600000}),
    zero=reduceLiteralZeroDerivatives(G,reduced.value);
  if(zero.value!==G.zero)fail('INVALID_SOURCE_CONSTRUCTION','The actual pressure/Omega field lacks its retained zero exterior at '+(atXv?'Xv':'Xplus')+'.');
  return {root,endpoint:atXv?b.constants.Xv:Xplus,reduced,zero,
    reason:'Every selected endpoint is earlier by the live original support proof; accumulated primitives are retained unless their original moment-closed branch is zero.',
    allFixedJetsZero:'The actual field is smooth through its source joins and is identically zero on this exterior, hence each fixed derivative is zero there.',pass:true};
}

function actualLeadingProduct(primitives,n,restrictions){
  const {G,prepared:{bootstrap:b,records}}=primitives,r=records[n],g=r.global,{X}=b.constants,
    {Xkeep,Xcut,X0,IposRight}=b.orderOne,F0=records[0].actual.F,Ft=r.actual.F,z=G.zero,
    operands=[],collect=id=>{id=body(G,id);const row=G.nodes[id];if(row.op==='add')row.args.forEach(collect);else operands.push(id);};collect(g.F);
  const correction=operands.filter(id=>{const row=G.nodes[id];return row.op==='smooth_piecewise'&&row.args[0]===X&&row.args[1]===X0&&row.args[2]===IposRight;});
  if(correction.length!==1)fail('INVALID_SOURCE_CONSTRUCTION','Locate the actual Ipos F correction, without dropping its solved moment coefficients.');
  const dF=correction[0],fieldCheck=equal(G,g.F,G.add(Ft,dF)),sourceSplit=n===1?b.orderOne.F0F1:g.F0Fn,
    expected=G.add(G.choose(X,Xkeep,Xcut,G.mul(F0,r.raw.F),G.mul(F0,Ft),z),G.choose(X,X0,IposRight,z,G.mul(restrictions.ipos.reservedF,dF),z)),
    splitCheck=equal(G,sourceSplit,expected),fullProduct=G.mul(records[0].global.F,g.F);
  if(!restrictions.pass||!primitives.sourceSupport.pass)fail('INVALID_SOURCE_CONSTRUCTION','The actual leading restriction and source support must precede its product equality.');
  return {source:sourceSplit,fullProduct,actualCorrection:dF,actualLocal:Ft,
    fieldCheck,splitCheck,domain:[z,'infinity'],
    proof:'On [0,Xcut], the full F0 is the checked common-core F0; the literal kappa local Fn is retained on Xkeep..Xcut. On Ipos, the full F0 is the checked original reserved power. Outside these disjoint supports Fn is the literal zero branch. Thus the original split equals the product of the complete global fields everywhere, with matching flat jets.',
    replacementUsesAuthenticatedSourceEquality:true,fullLeadingHeatAndPatchesRetained:true,pass:true};
}

function actualOmegaRepresentative(primitives,n,commonTuples,context){
  const {G,prepared:{bootstrap:b,records}}=primitives,{X,eta}=b.constants,r=records[n],z=G.zero,
    lower=records.slice(0,n),local=buildActualOmegaCoefficientOverX(G,{order:n-1,X,eta,U:lower.map(t=>t.actual.U),v:lower.map(t=>t.actual.v)}),
    full=buildActualOmegaCoefficientOverX(G,{order:n-1,X,eta,U:lower.map(t=>t.global.U),v:lower.map(t=>t.global.v)}),
    originalFull=primitives.rows[n-1].fullPressureComparison.globalOmega,fullSourceCheck=equal(G,full.value,originalFull);
  let source,coreCheck,middleCheck;
  if(n===1){
    const inner=literalLeadingOmega(G,{X,eta,U:b.inner.U0,v:b.inner.v0}),global=literalLeadingOmega(G,{X,eta,U:b.finalU,v:b.finalv}),
      normal= rewriteExactPressureOperands(G,full.value,{atomicNodes:global.jets,materializeSharing:true,maxVisits:300000});
    coreCheck={originalFormula:equal(G,r.raw.omegaOverX,inner.value),operatorIdentity:algebra(G,G.sub(local.value,inner.value),inner.jets)};
    middleCheck={sourceFormula:global.value,expandedSharing:normal,operatorIdentity:algebra(G,G.sub(normal.value,global.value),global.jets)};
    source=G.choose(X,b.orderOne.Xkeep,b.constants.Xv,r.raw.omegaOverX,global.value,z);
  }else{
    source=r.global.omega;const wrapper=G.nodes[source];
    if(wrapper.op!=='smooth_piecewise'||wrapper.args[0]!==X||wrapper.args[1]!==b.inner.aSquared||wrapper.args[2]!==b.orderOne.Xplus||wrapper.args[3]!==r.raw.omegaOverX||wrapper.args[5]!==z)
      fail('INVALID_SOURCE_CONSTRUCTION','The original Omega wrapper must keep its complete cutoff-local and global representatives.');
    coreCheck={originalFormula:equal(G,r.raw.omegaOverX,local.value)};
    middleCheck={sourceFormula:wrapper.args[4],operatorIdentity:equal(G,wrapper.args[4],full.value)};
  }
  const exterior=lower.map(t=>({order:t.order,U:sourceExteriorAt(primitives,t.global.U,{atXv:n===1}),v:sourceExteriorAt(primitives,t.global.v,{atXv:n===1})}));
  if(commonTuples.length!==n-1||commonTuples.some(t=>!t.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual completed local average of every lower order is required.');
  context.onProgress?.({phase:'pressure-full-Omega-representative',order:n,nodes:G.nodes.length});
  return {source,global:full.value,local:local.value,fullSourceCheck,coreCheck,middleCheck,exterior,
    sourceOrders:lower.map(t=>t.order),actualDerivativeOrder:2,axialViscosityShift:full.axialViscosityShift,
    proof:'The original Omega builder is the same finite differential polynomial of every U_i and v_i through n-1, including its preceding-order axial viscosity term. The checked actual leading and positive cutoff-local tuples agree with their global fields on the entire common interval, including all fixed jets. The middle branch is the full global polynomial. All U_i/v_i and their fixed jets vanish on the selected original exterior; hence that polynomial also equals the original zero branch. Smooth joins close the endpoint equalities.',
    noRawTupleSubstitutionAcrossKappa:true,remainingDifferenceAssignedZero:false,pass:true};
}

function fullPressureConvolutionRow(primitives,n,restrictions,commonTuples,context){
  const {G,prepared:{records}}=primitives,q=(a,d=1)=>G.q(a,d),g=records[n].global,
    leadingProduct=actualLeadingProduct(primitives,n,restrictions),omega=actualOmegaRepresentative(primitives,n,commonTuples,context),
    middle=G.add(...Array.from({length:n-1},(_,j)=>G.mul(records[j+1].global.F,records[n-j-1].global.F))),
    expectedOriginal=G.sub(G.add(G.mul(q(2),leadingProduct.source),middle),G.mul(q(1,2),omega.source)),
    originalDerivativeCheck=algebra(G,G.sub(g.pressureDerivative,expectedOriginal),[leadingProduct.source,omega.source,...records.map(r=>r.global.F)]),
    rewritten=rewriteExactPressureOperands(G,g.pressureDerivative,{replacements:new Map([[leadingProduct.source,leadingProduct.fullProduct],[omega.source,omega.global]]),atomicNodes:records.map(r=>r.global.F)}),
    independent=primitives.rows[n-1].fullPressureComparison,
    finalIdentity=algebra(G,G.sub(rewritten.value,independent.fullRadialDensity),[...records.map(r=>r.global.F),omega.global]),
    generic=originalPressurePairConvolutionIdentity(n);
  if(!rewritten.trace.some(t=>t.source===leadingProduct.source)||!rewritten.trace.some(t=>t.source===omega.source))
    fail('INVALID_SOURCE_CONSTRUCTION','Both proved source product/Omega operands must occur in the original pressure derivative.');
  return {order:n,leadingProduct,omega,originalDerivativeCheck,rewritten,independent,
    finalIdentity,generic,identity:'Pi_n,X = sum_(i+j=n) F_i*F_j - Omega_(n-1)/(2X)',
    pressureDerivativeIdentity:true,pressurePrimitiveProved:n>=2&&primitives.rows[n-1].pressure.pass,
    originalUnrewrittenDifference:independent.remainingDifference,
    exactSourceRewrites:[{source:leadingProduct.source,value:leadingProduct.fullProduct,proof:'this row.leadingProduct'},
      {source:omega.source,value:omega.global,proof:'this row.omega'}],
    actualAllOrderedPairs:n+1,assumedResidualZero:false,pass:true};
}

/** First attach stage. The full convolution/primitive proof is added below;
 * this certificate never promotes the restriction alone to that theorem.
 */
export function attachActualGlobalPressureConvolution(primitives,stream,context={}){
  const sourceBinding=bindSameOriginalSource(primitives,stream),{G}=primitives,
    leadingRestrictions=actualLeadingRestrictions(primitives,stream,context),commonTuples=[],rows=[];
  for(let n=1;n<=primitives.request.throughOrder;n++){
    context.checkCancelled?.();rows.push(fullPressureConvolutionRow(primitives,n,leadingRestrictions,commonTuples,context));
    if(n<primitives.request.throughOrder)commonTuples.push(positiveCommonTuple(primitives,n,context));
  }
  const
    result={G,primitives,stream,source:primitives.source,request:{throughOrder:primitives.request.throughOrder},sourceBinding,leadingRestrictions,
      commonTuples,rows,roots:{actualFullLeadingF:primitives.prepared.records[0].global.F,actualReservedLeadingF:leadingRestrictions.ipos.reservedF,
        ...Object.fromEntries(rows.flatMap(r=>[['n'+r.order+'_originalPressureDerivative',r.independent.sourcePressureDerivative],['n'+r.order+'_fullRadialDensity',r.independent.fullRadialDensity],['n'+r.order+'_rewrittenPressureDerivative',r.rewritten.value]]))},
      checks:[{id:'actual-leading-core-and-Ipos-restrictions',pass:leadingRestrictions.pass},...rows.map(r=>({id:'actual-full-global-pressure-convolution-n'+r.order,pass:r.pass}))],
      scope:{actualLeadingCoreAndReservedPressureRestrictions:true,actualGlobalFullPressureConvolutionIdentity:true,
        actualOrderOneOmegaPrefixPrimitive:false,actualOrderOnePressurePrimitive:false,
        allOrderPhysicalResidualFlatness:false,wholeGN4Complete:false,newLeanKernelProof:false,m3MayStart:false},
      remaining:['Bind the actual order-one Omega prefix and every pressure primitive join.','Tangential stress cancellation and all-order full physical residual flatness remain separate.']};
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
