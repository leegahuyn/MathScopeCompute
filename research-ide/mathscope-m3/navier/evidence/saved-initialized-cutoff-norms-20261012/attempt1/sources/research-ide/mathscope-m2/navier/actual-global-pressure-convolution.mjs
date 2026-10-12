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
  data=r=>({source:r.source,request:r.request,sourceBinding:r.sourceBinding,leadingRestrictions:r.leadingRestrictions,commonTuples:r.commonTuples,omegaPrefix:r.omegaPrefix,pressureOne:r.pressureOne,
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

function sourceLiteralPrefixes(G,root,X,right,{atomicNodes=[]}={}){
  const atoms=new Set(atomicNodes),seen=new Set(),found=[];
  const visit=id=>{
    if(atoms.has(id)||seen.has(id)||!G.dependsOn(id,X))return;seen.add(id);id=body(G,id);
    const {op,args}=G.nodes[id];
    if(op==='definite_integral'){if(args[3]===right)found.push(id);return;}
    if(op==='smooth_piecewise')args.slice(3).forEach(visit);
    else if(['add','multiply','inverse','integer_power','sqrt_positive','exp','log_positive'].includes(op))
      (op==='integer_power'?[args[0]]:args).forEach(visit);
  };visit(root);return [...new Set(found)];
}

function actualLiteralFTC(G,primitive,X,density,{atomicNodes=[]}={}){
  const p=G.nodes[primitive];if(p.op!=='definite_integral')fail('INVALID_SOURCE_CONSTRUCTION','The original source must contain a literal primitive.');
  const [integrand,variable,left,right]=p.args;
  if(G.dependsOn(left,X)||G.dependsOn(integrand,X))fail('INVALID_SOURCE_CONSTRUCTION','The original source primitive must use a fixed lower endpoint and a capture-free bound integrand.');
  const derivative=G.derivative(primitive,X),reduced=reduceLiteralZeroDerivatives(G,derivative,{atomicNodes}),
    endpoint=G.substitute(integrand,variable,right),expected=G.mul(density,G.derivative(right,X)),
    endpointCheck=equal(G,endpoint,density,atomicNodes),derivativeCheck=equal(G,reduced.value,expected,atomicNodes);
  return {primitive,integrand,variable,left,right,density,derivative,reduced,endpoint,expected,endpointCheck,derivativeCheck,
    fixedLowerEndpoint:true,interiorXDerivativeZeroByActualFreeCoordinates:true,compactIntegralAssignedZero:false,pass:true};
}

/** Bind the original order-one P_Omega itself, rather than a newly chosen
 * primitive with the desired derivative. The four retained prefixes and
 * its axis constant are all read from the original source graph.
 */
function actualOrderOneOmegaPrefix(primitives,stream,restrictions,convolution,context){
  const {G,prepared:{bootstrap:b}}=primitives,{X,eta,Xv}=b.constants,q=(a,d=1)=>G.q(a,d),z=G.zero,{A,D,d,L}=G.core,
    U=b.finalU,v=b.finalv,Ux=G.derivative(U,X),Ueta=G.derivative(U,eta),vX=G.derivative(v,X),vXX=G.derivative(vX,X),vEta=G.derivative(v,eta),
    UV=G.mul(U,v),UVeta=G.derivative(UV,eta),v2=G.pow(v,2),axis=b.roots.actualGlobalAxisVX,
    source=b.roots.actualOrderOneGlobalPressurePrefix,p=G.nodes[source];
  context.onProgress?.({phase:'pressure-n1-original-Omega-prefix-start',nodes:G.nodes.length});
  if(p.op!=='smooth_piecewise'||p.args[0]!==X||p.args[1]!==b.orderOne.Xkeep||p.args[2]!==Xv||p.args[3]!==p.args[4]||p.args[5]!==b.pressureOmega)
    fail('INVALID_SOURCE_CONSTRUCTION','The original n=1 Omega prefix must retain both equal active branches and its original weighted total.');
  const prefix=p.args[3],jets=[U,Ux,Ueta,v,vX,vXX,vEta],candidates=sourceLiteralPrefixes(G,prefix,X,X,{atomicNodes:jets}),
    densities={Jeta:vEta,Heta:UVeta,H:UV,K:v2};
  if(candidates.length!==4)fail('INVALID_SOURCE_CONSTRUCTION','The original Omega prefix must retain exactly J_eta, H_eta, H, K integrals; found '+candidates.length+'.');
  const rows=Object.fromEntries(Object.entries(densities).map(([name,density])=>{
    const primitive=matchExplicitPrimitiveDensity(G,candidates,density,{atomicNodes:jets});return [name,actualLiteralFTC(G,primitive,X,density,{atomicNodes:jets})];
  })),pref=Object.fromEntries(Object.entries(rows).map(([name,row])=>[name,row.primitive])),
    boundary=G.add(G.div(G.mul(X,v),G.mul(q(2),L)),G.neg(G.div(G.mul(eta,X,U,v),L)),G.mul(q(1,2),X,v2),G.neg(v),G.neg(G.mul(X,vX))),
    expected=G.add(G.div(G.add(G.mul(D,eta,pref.Jeta),G.mul(d,pref.Heta),G.mul(q(-2),A,eta,pref.H)),G.mul(q(2),L)),G.mul(q(1,4),pref.K),boundary,axis),
    sourceBodyCheck=equal(G,prefix,expected,[...jets,...Object.values(pref),axis]),
    derivative=G.derivative(prefix,X),ftcRewrite=rewriteExactPressureOperands(G,derivative,{
      replacements:new Map(Object.values(rows).map(row=>[row.derivative,row.expected])),atomicNodes:jets,maxVisits:300000}),
    originalOmega=literalLeadingOmega(G,{X,eta,U,v}),
    continuity=G.add(G.mul(L,G.add(v,G.mul(X,vX))),G.mul(d,Ueta),G.mul(q(-2),A,eta,U),G.mul(q(-2),eta,X,Ux)),
    factor=G.div(G.mul(v,continuity),G.mul(q(2),L)),
    factorization=algebra(G,G.sub(G.sub(ftcRewrite.value,G.mul(q(1,2),originalOmega.value)),factor),jets),generic=originalLeadingOmegaPrefixIdentity();
  if(!stream.scope.actualLeadingContinuityIdentity||stream.parts.stream.v!==v||convolution.omega.source!==G.choose(X,b.orderOne.Xkeep,Xv,b.inner.omegaOverX,originalOmega.value,z))
    fail('INVALID_SOURCE_CONSTRUCTION','The literal Omega factorization requires the private proved continuity of these SAME actual fields.');
  context.onProgress?.({phase:'pressure-n1-Omega-prefix-FTC-and-continuity',nodes:G.nodes.length});
  const natural=restrictions.cases.find(c=>c.kind==='natural').rows.find(r=>r.name==='v'),actualAxis=G.substitute(natural.reduced.value,X,z),
    expectedAxis=G.div(G.sub(G.mul(q(2),A,eta,G.core.Ustar),G.mul(q(4),d)),L),
    axisFormulaCheck=algebra(G,G.sub(axis,expectedAxis),[G.core.Ustar]),axisValueCheck=algebra(G,G.sub(actualAxis,axis),[G.core.Ustar]),
    w=b.originalLeading.program.weightedOmega;
  if(!same(w.names,['Jminus1','J0','Hminus1','H0','Kminus2','Kminus1'])||w.pressure!==b.pressureOmega||w.axisBoundary!==axis)
    fail('INVALID_SOURCE_CONSTRUCTION','The actual whole weighted Omega history or axis constant changed.');
  const wholeRoots={Jeta:w.derivativeIntegrals.Jmeta,Heta:w.derivativeIntegrals.Hmeta,H:w.integrals[2],K:w.integrals[4]},
    wholeRows=Object.entries(rows).map(([name,row])=>{
      const completed=G.integral(row.integrand,row.variable,row.left,Xv),check=equal(G,completed,wholeRoots[name]);
      return {name,sourcePrefix:row.primitive,completed,originalWholeIntegral:wholeRoots[name],check};
    }),wholeExpected=G.add(G.div(G.add(G.mul(D,eta,wholeRoots.Jeta),G.mul(d,wholeRoots.Heta),G.mul(q(-2),A,eta,wholeRoots.H)),G.mul(q(2),L)),G.mul(q(1,4),wholeRoots.K),axis),
    wholePressureCheck=algebra(G,G.sub(b.pressureOmega,wholeExpected),[...Object.values(wholeRoots),axis]),
    zeroExterior=convolution.omega.exterior[0],constantXDerivative=G.derivative(b.pressureOmega,X);
  if(!zeroExterior.U.pass||!zeroExterior.v.pass||constantXDerivative!==z)fail('INVALID_SOURCE_CONSTRUCTION','The original Xv closure requires zero velocity jets and an X-independent whole primitive.');
  context.onProgress?.({phase:'pressure-n1-Omega-axis-and-whole-history',nodes:G.nodes.length});
  return {source,active:prefix,sourceBodyCheck,rows,derivative,ftcRewrite,originalOmega:originalOmega.value,
    continuityExpression:continuity,defectFactor:factor,factorization,generic,
    actualContinuityPremise:{producer:'actual-leading-stream-primitive.mjs:attachActualLeadingStreamPrimitive',
      sourceM:b.finalM,sourceU:U,sourcev:v,privateSourceSealChecked:true,globalMassAndStreamReconstructionProved:true,
      consequence:'The displayed continuity expression is zero by the private SAME-source M0_X=U0 and stream reconstruction; it is retained as its original expression, not defined to be zero.'},
    axis:{actualNaturalSource:natural.reduced.value,actualValue:actualAxis,retainedConstant:axis,expected:expectedAxis,axisFormulaCheck,axisValueCheck,
      prefixValue:0,reason:'Each literal prefix has coincident endpoints at X=0. The regular natural v and v_X are finite there, so every X-multiplied boundary term vanishes; the remaining -v(0)+axisVX cancels by the executed source check.',divisionByZeroEvaluated:false},
    exterior:{endpoint:Xv,wholeRows,originalWhole:b.pressureOmega,wholePressureCheck,zeroExterior,constantXDerivative,
      reason:'At Xv the actual v and all fixed jets are zero. Each partial integral equals its retained complete weighted history by wholeRows, including mixed eta densities. Thus the original constant branch has the same value and all derivative jets.'},
    theorem:'The ORIGINAL closed P_Omega has derivative Omega_0/(2X) on X>=0, with its regular axis extension and its original Xv constant closure.',
    globalOmegaSource:convolution.omega.global,allActualPrefixTermsRetained:true,numericalWholeIntegralsEvaluated:false,newPrimitiveChosen:false,pass:true};
}

function actualOrderOnePressurePrimitive(primitives,omegaPrefix,convolution,context){
  const {G,prepared:{bootstrap:b,records}}=primitives,r=records[1],g=r.global,{X,eta}=b.constants,
    {Xkeep,Xcut,Xplus,Rbase,normalizedR:u,supports,Emat,ef}=b.orderOne,q=(a,d=1)=>G.q(a,d),z=G.zero,
    source=body(G,g.Pi),p=G.nodes[source],lambda=G.parameter('lambda'),power=(a,e)=>G.exp(G.mul(e,G.log(a))),exponent=G.sub(q(-2),G.mul(q(2),lambda)),Rp=power(Rbase,exponent),
    width=q(1,2048),bump=(a,j)=>G.div(G.step(G.div(G.sub(a,supports[j][0]),width),1),width),
    localDensity=G.mul(q(2),records[0].actual.F,r.actual.F),atoms=[omegaPrefix.source,...g.alpha,...g.beta,...g.localMoments];
  if(p.op!=='smooth_piecewise'||p.args[0]!==X||p.args[1]!==Xkeep||p.args[2]!==Xplus||p.args[3]!==r.raw.Pi||p.args[5]!==z)
    fail('INVALID_SOURCE_CONSTRUCTION','The original Pi1 must retain its inner Picard, repaired middle and final zero branches.');
  const locals=sourceLiteralPrefixes(G,p.args[4],X,X,{atomicNodes:atoms});
  if(locals.length!==1)fail('INVALID_SOURCE_CONSTRUCTION','The original Pi1 has one local angular pressure prefix outside the separately proved Omega prefix.');
  const localPrimitive=matchExplicitPrimitiveDensity(G,locals,localDensity),localFTC=actualLiteralFTC(G,localPrimitive,X,localDensity),
    localPressure=G.choose(X,Xkeep,Xcut,localPrimitive,localPrimitive,g.localMoments[2]),lp=G.nodes[localPrimitive],
    localWhole=G.integral(lp.args[0],lp.args[1],lp.args[2],Xcut),localWholeCheck=equal(G,localWhole,g.localMoments[2]),
    originals=sourceLiteralPrefixes(G,p.args[4],X,u,{atomicNodes:atoms});
  if(originals.length!==3)fail('INVALID_SOURCE_CONSTRUCTION','The original Pi1 must retain all three complete continuous angular bump primitives.');
  const bumpRows=g.beta.map((beta,j)=>{
    const density=G.mul(power(u,exponent),bump(u,j+2)),primitive=matchExplicitPrimitiveDensity(G,originals,density,{atomicNodes:atoms}),
      ftc=actualLiteralFTC(G,primitive,X,density,{atomicNodes:atoms}),coefficient=G.mul(q(2),ef,Rp,beta),
      derivative=G.mul(coefficient,ftc.reduced.value),factoredExpected=G.div(G.mul(coefficient,density),G.mul(Rbase,G.sqrt(G.mul(q(2),X)))),
      jacobian=algebra(G,G.sub(derivative,factoredExpected),[...atoms,Rp,power(u,exponent),bump(u,j+2)]),n=G.nodes[primitive],
      total=G.integral(n.args[0],n.args[1],n.args[2],supports[j+2][1]),totalCheck=equal(G,total,Emat[1][j]);
    return {j,coefficient,primitive,ftc,derivative,factoredExpected,jacobian,total,totalCheck,originalCompleteMatrixMoment:Emat[1][j],
      powerRule:'For X>0, R=Rbase*u>0 and Rbase^p*u^p=R^p with the unchanged p=-2-2lambda. This is the original positive-real log rule, not lambda=0.'};
  }),correction=G.mul(q(2),ef,Rp,G.add(...bumpRows.map(row=>G.mul(g.beta[row.j],G.choose(u,...supports[row.j+2],z,row.primitive,Emat[1][row.j]))))),
    bodyCheck=equal(G,p.args[4],G.sub(G.add(localPressure,correction),omegaPrefix.source),[...atoms,localPrimitive,...bumpRows.map(r=>r.primitive)]),
    incomingCheck=equal(G,g.incoming[2],G.sub(g.localMoments[2],b.pressureOmega)),
    totalCorrection=G.mul(q(2),ef,Rp,G.add(...g.beta.map((beta,j)=>G.mul(beta,Emat[1][j])))),
    zeroMoment=G.add(g.incoming[2],totalCorrection),momentCheck=algebra(G,zeroMoment,g.incoming),
    literalTotal=G.sub(G.add(g.localMoments[2],totalCorrection),b.pressureOmega),
    totalShapeCheck=algebra(G,G.sub(literalTotal,zeroMoment),[g.localMoments[2],b.pressureOmega,totalCorrection]),picard=primitives.rows[0].picard;
  if(!picard.pass||!omegaPrefix.pass||!convolution.pass||!g.actualMomentChecks[2].pass)
    fail('INVALID_SOURCE_CONSTRUCTION','Every original Picard, Omega and third-moment proof must precede the Pi1 primitive.');
  context.onProgress?.({phase:'pressure-n1-full-pressure-primitive-and-joins',nodes:G.nodes.length});
  return {source:g.Pi,sourcePressureDerivative:g.pressureDerivative,independentFullRadialDensity:convolution.independent.fullRadialDensity,
    bodyCheck,localFTC,localWholeCheck,bumpRows,incomingCheck,literalTotal,totalShapeCheck,zeroMoment,momentCheck,picard,
    originalOmegaPrefix:omegaPrefix.source,genericBump:originalRadialBumpPrimitiveIdentities(),
    joins:{axis:'The literal local and angular bump prefixes vanish at the axis, as does the separately proved original P_Omega. The raw Picard pressure has the same zero axis datum.',
      Xkeep:'Before Xkeep the whole repaired pressure and the original raw Picard pressure have the SAME derivative 2 F0 F1 - Omega0/(2X) and zero axis value. Their values agree at Xkeep; source smoothness gives all matching derivative jets.',
      Xcut:'The local partial integral equals the retained localMoments[2], verified by localWholeCheck. Flat kappa jets make the density join smooth.',
      bumps:'At each right support endpoint the literal primitive equals the original continuous Emat[1][j], as checked above; every sigma-prime derivative is flat there.',
      Xv:'The entire P_Omega equals the original weighted whole integral, with the separately verified zero boundary terms and all fixed exterior jets.',
      Xplus:'Every local/bump density and Omega has ended strictly before Xplus. The third original moment makes the remaining constant exactly zero, as checked by totalShapeCheck and momentCheck, so the final zero branch matches all fixed jets.'},
    theorem:'The ORIGINAL complete Pi1 has derivative sum_(i+j=1) F_i F_j - Omega0/(2X) everywhere X>=0, including its regular axis and every source join.',
    fullGlobalConvolutionUsed:true,callerMomentOrDerivativeAccepted:false,originalConservativeStressMomentsClaimedHere:false,pass:true};
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
  const omegaPrefix=actualOrderOneOmegaPrefix(primitives,stream,leadingRestrictions,rows[0],context),
    pressureOne=actualOrderOnePressurePrimitive(primitives,omegaPrefix,rows[0],context);
  rows[0].pressurePrimitiveProved=pressureOne.pass;
  const
    result={G,primitives,stream,source:primitives.source,request:{throughOrder:primitives.request.throughOrder},sourceBinding,leadingRestrictions,
      commonTuples,rows,omegaPrefix,pressureOne,roots:{actualFullLeadingF:primitives.prepared.records[0].global.F,actualReservedLeadingF:leadingRestrictions.ipos.reservedF,
        actualOriginalOmegaPrefix:omegaPrefix.source,actualOriginalOmegaPrefixDerivative:omegaPrefix.derivative,actualOriginalLeadingContinuity:omegaPrefix.continuityExpression,actualOrderOnePressure:pressureOne.source,
        ...Object.fromEntries(rows.flatMap(r=>[['n'+r.order+'_originalPressureDerivative',r.independent.sourcePressureDerivative],['n'+r.order+'_fullRadialDensity',r.independent.fullRadialDensity],['n'+r.order+'_rewrittenPressureDerivative',r.rewritten.value]]))},
      checks:[{id:'actual-leading-core-and-Ipos-restrictions',pass:leadingRestrictions.pass},...rows.map(r=>({id:'actual-full-global-pressure-convolution-n'+r.order,pass:r.pass})),
        {id:'actual-original-Omega-prefix-axis-and-whole-history',pass:omegaPrefix.pass},{id:'actual-order-one-pressure-primitive-and-all-joins',pass:pressureOne.pass}],
      scope:{actualLeadingCoreAndReservedPressureRestrictions:true,actualGlobalFullPressureConvolutionIdentity:true,
        actualOrderOneOmegaPrefixPrimitive:true,actualOrderOnePressurePrimitive:true,actualGlobalPressurePrimitivesOnGeneratedPrefix:true,
        allOrderPhysicalResidualFlatness:false,wholeGN4Complete:false,newLeanKernelProof:false,m3MayStart:false},
      remaining:['Tangential stress cancellation and all-order full physical residual flatness remain separate.','This actual finite generated pressure prefix does not assemble the infinite cutoff background or its full global physical residual.']};
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
