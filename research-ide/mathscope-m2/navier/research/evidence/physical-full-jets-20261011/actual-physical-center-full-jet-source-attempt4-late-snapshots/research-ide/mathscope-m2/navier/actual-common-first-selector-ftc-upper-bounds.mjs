/** Source upper bounds of the EIGHT ORIGINAL first-selector clauses.
 * The source b_n, every FTC operand, and the original max recipe remain
 * unchanged. An additional n=1,m=5 coefficient norm is used ONLY to prove
 * inequalities for those existing constants. No upper value is substituted
 * into the actual family, band, physical point, or source coefficient.
 */
import {assertActualPhysicalCenterFiniteJetBodies} from './actual-physical-center-jet-bodies.mjs';
import {assertActualCommonPhysicalCenterEnclosure} from './actual-common-physical-center-enclosure.mjs';
import {assertActualCommonAdmissibleFamily} from './actual-common-admissible-family.mjs';
import {assertActualOrderInduction} from './actual-residual-order-induction-source.mjs';
import {attachActualInductionNorms,assertActualInductionNorms,actualNormCalculus} from './actual-residual-order-induction-norms.mjs';
import {physicalPositiveJetCalculus} from './actual-velocity-all-order-tail.mjs';
import {sourceAllOrderCutoffJets} from './actual-residual-order-induction-kernels.mjs';
import {actualLeadingHighJetBounds} from './actual-leading-high-jets.mjs';
import {traceExactArithmeticDependencies} from './actual-common-selection-arithmetic-trace.mjs';
import {firstSelectorCartesianRadialBound,firstSelectorFTCUpperFaces,firstSelectorStressMajorants,firstSelectorOuterHeatMajorant,firstSelectorTerminalBMajorant} from './actual-common-first-selector-ftc-upper-bounds-kernel.mjs';
import {captureFirstSelectorSourceTupleSnapshot,assertFirstSelectorSourceTupleSnapshotUnchanged,firstSelectorSourceTupleSnapshotAudit} from './actual-common-first-selector-source-snapshot.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),sum=a=>a.reduce((x,y)=>x+y,0),seals=new WeakMap(),MAX_NEW_NODES=100000;
const progress=(ctx,stage,G,extra={})=>{ctx.checkCancelled?.();ctx.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};
const publicData=r=>({schema:r.schema,sourceBinding:r.sourceBinding,roots:r.roots,upperRows:r.upperRows,checks:r.checks,proof:r.proof,diagnostics:r.diagnostics,scope:r.scope,pass:r.pass,sourceAuthenticated:r.sourceAuthenticated});

export function assertFirstSelectorArithmeticTraceUnchanged(G,trace){
  if(!trace||!Array.isArray(trace.nodes)||trace.nodes.some(r=>!Number.isSafeInteger(r.id)||!same(G?.nodes?.[r.id],r.node)))
    fail('INVALID_SOURCE_CONSTRUCTION','A retained first-selector upper arithmetic node changed.');return true;
}

/** Copy only newly generated arithmetic. IDs in the copied original
 * prefix are reused after a byte identity check. A new sibling ID is
 * never reinterpreted as a body-graph ID; integer metadata is not walked.
 */
export function copyFirstSelectorPositiveBounds(source,target,prefixCount,roots,context={}){
  if(!Number.isSafeInteger(prefixCount)||prefixCount<0||prefixCount>source.nodes.length||prefixCount>target.nodes.length)fail('INVALID_INPUT','Use the original common copied prefix.');
  const mapped=new Map(),rows=[],copy=id=>{
    if(mapped.has(id))return mapped.get(id);context.checkCancelled?.();
    if(!Number.isSafeInteger(id)||!source.nodes[id])fail('INVALID_SOURCE_CONSTRUCTION','A source norm operand is missing.');
    const n=source.nodes[id],a=n.args;let out,children=[];
    if(id<prefixCount){if(!same(n,target.nodes[id]))fail('INVALID_SOURCE_CONSTRUCTION','An original common source operand differs in the body graph.');out=id;}
    else if(n.op==='rational')out=target.q(...a.map(BigInt));
    else if(n.op==='source_parameter')out=target.parameter(a[0]);
    else if(n.op==='add'){children=a;out=target.add(...a.map(copy));}
    else if(n.op==='multiply'){children=a;out=target.mul(...a.map(copy));}
    else if(n.op==='maximum'){children=a;out=target.maximum(...a.map(copy));}
    else if(['inverse','exp','log_positive','sqrt_positive'].includes(n.op)){children=[a[0]];const f={inverse:'inv',exp:'exp',log_positive:'log',sqrt_positive:'sqrt'}[n.op];out=target[f](copy(a[0]));}
    else if(n.op==='integer_power'){children=[a[0]];out=target.pow(copy(a[0]),a[1]);}
    else fail('INVALID_SOURCE_CONSTRUCTION','A newly generated norm is not closed positive arithmetic: '+n.op);
    mapped.set(id,out);rows.push({originalRoot:id,copiedRoot:out,operation:n.op,originalPrefix:id<prefixCount,children,integerMetadata:n.op==='integer_power'?a[1]:null});return out;
  };
  return {roots:Object.fromEntries(Object.entries(roots).map(([k,r])=>[k,copy(r)])),rows,prefixCount,typedChildrenOnly:true,sourceAuthenticated:false};
}

/** Monotone upper comparison of a fixed positive expression, stopping at
 * proved FTC face upper bounds. Inverse/negative-power ancestors of a
 * replaced face are rejected; such a replacement would reverse order.
 */
export function firstSelectorMonotoneUpper(G,root,replacements,{maxNodes=250000}={}){
  const memo=new Map(),used=new Set(),audit=[];
  const visit=id=>{
    if(memo.has(id))return memo.get(id);
    if(memo.size>=maxNodes)fail('RESOURCE_LIMIT','The first-selector monotone comparison exhausted its explicit node budget.');
    if(replacements.has(id)){used.add(id);const out={root:replacements.get(id),changed:true};memo.set(id,out);return out;}
    const n=G.nodes[id];if(!n)fail('INVALID_SOURCE_CONSTRUCTION','An original first-selector operand is missing.');
    const childIds=['add','multiply','maximum'].includes(n.op)?n.args:['inverse','exp','log_positive','sqrt_positive','integer_power','ceiling','floor'].includes(n.op)?[n.args[0]]:[],children=childIds.map(visit),changed=children.some(c=>c.changed);
    let out=id;
    if(changed){
      const args=children.map(c=>c.root);
      if(n.op==='add')out=G.add(...args);else if(n.op==='multiply')out=G.mul(...args);else if(n.op==='maximum')out=G.maximum(...args);
      else if(n.op==='exp')out=G.exp(args[0]);else if(n.op==='log_positive')out=G.log(args[0]);else if(n.op==='sqrt_positive')out=G.sqrt(args[0]);
      else if(n.op==='integer_power'&&Number.isSafeInteger(n.args[1])&&n.args[1]>=0)out=G.pow(args[0],n.args[1]);
      else if(n.op==='ceiling')out=G.ceiling(args[0]);else if(n.op==='floor')out=G.floor(args[0]);
      else fail('INVALID_SOURCE_CONSTRUCTION','An FTC upper comparison would pass through an order-reversing operation: '+n.op);
      audit.push({original:id,upper:out,operation:n.op,nonnegativeOriginalFactorsRequired:n.op==='multiply'});
    }
    const result={root:out,changed};memo.set(id,result);return result;
  };
  const result=visit(root);return {originalRoot:root,upperRoot:result.root,changed:result.changed,usedFaceRoots:[...used].sort((a,b)=>a-b),audit,sourceAuthenticated:false};
}

function selectedFirstFaces(family){
  const v=family.source.velocitySeminorms,p=family.source.pressureStressSeminorms,vr=v.rows[0],pr=p.rows[0],vbodies=new Set(vr.components.map(c=>c.body)),
    candidates=[...v.ftcRows.filter(r=>vbodies.has(r.sourceBody)).map((r,index)=>({kind:'velocity-cartesian',index,row:r})),
      ...p.ftcRows.map((r,index)=>({kind:r.kind,index,row:r})).filter(r=>['physical-cartesian','normalized-pressure','order-one-terminal','order-one-interior'].includes(r.kind))],
    byFace=new Map();
  const scalarOnly=new Map(),hasFunctional=id=>{if(scalarOnly.has(id))return scalarOnly.get(id);const n=family.G.nodes[id],children=['add','multiply','maximum'].includes(n.op)?n.args:['inverse','exp','log_positive','sqrt_positive','integer_power','ceiling','floor'].includes(n.op)?[n.args[0]]:[],
    result=!['rational','source_parameter','add','multiply','maximum','inverse','exp','log_positive','sqrt_positive','integer_power','ceiling','floor'].includes(n.op)||children.some(hasFunctional);scalarOnly.set(id,result);return result;};
  // A face that simplifies to an exact scalar is already available to
  // closed arithmetic. Never replace a shared rational such as1 or2 in
  // unrelated radius, exponent, or denominator expressions.
  for(const candidate of candidates)for(const face of candidate.row.faces){if(!hasFunctional(face.upperBound))continue;if(!byFace.has(face.upperBound))byFace.set(face.upperBound,[]);byFace.get(face.upperBound).push({...candidate,face});}
  const used=new Set(),seen=new Set(),stack=family.selector.rows[0].constraints.map(c=>c.bound),G=family.G;
  while(stack.length){const id=stack.pop();if(seen.has(id))continue;seen.add(id);if(byFace.has(id)){used.add(id);continue;}const n=G.nodes[id];
    if(['add','multiply','maximum'].includes(n.op))stack.push(...n.args);else if(['inverse','exp','log_positive','sqrt_positive','integer_power','ceiling','floor'].includes(n.op))stack.push(n.args[0]);}
  const selected=candidates.filter(c=>c.row.faces.some(f=>used.has(f.upperBound)));
  if(!used.size||selected.some(c=>c.kind==='normalized-pressure'&&!p.normalizedPressure[0].jets.some(r=>r.bound===c.row.bound))||
     family.selector.rows[0].constraints.some(c=>c.derivativeOrder>1)||vr.order!==1||pr.order!==1)
    fail('INVALID_SOURCE_CONSTRUCTION','The selected FTC faces must belong to the unchanged first m<=1 clauses.');
  return {used,selected,componentRoots:{velocity:vr.components.map(c=>({name:c.name,body:c.body,sourceRoots:c.sourceRoots})),pressureStress:pr.components.map(c=>({name:c.name,body:c.body,sourceRoot:c.sourceRoot}))},
    producerOrderProof:'The private original first rows form bounds[k] only from byOrder[j],j<=k. Each physical recurrence shifts one profile coordinate or one Euler order. Thus every reached FTC body is an original component derivative of total profile order<=1; each anchored face adds at most one of each Cartesian/eta coordinate. The other two-coordinate first rows likewise have base order<=1. Higher produced rows are never used as upper-bound premises.'};
}

function normalizedScalarMajorants(G,norms,copy,prepared){
  const q=(n,d=1)=>G.q(n,d),a=actualNormCalculus(G),{fn,mul}=a,n=norms.normalized[0],Xlo=copy(n.domain.X[0]),aux=prepared.records[1].norm.auxiliary,
    Lambda=G.parameter('Lambda'),strip=copy(aux.strip),solution=copy(aux.solutionNorm),requests=[],lookup=(field,r,k)=>{
      const j=n.jets[field].find(j=>j.radialOrder===r&&j.etaOrder===k);if(!j)fail('RESOURCE_LIMIT','The n=1,m=5 source norm does not contain a requested normalized jet.');return copy(j.upper);},
    E=fn((r,k)=>lookup('E',r,k)),inverseR=fn((r,k)=>k?G.zero:G.div(q(factorial(r)),G.mul(G.sqrt(G.mul(q(2),Xlo)),G.pow(Xlo,r)))),annularF=mul(E,inverseR),
    core=(r,k)=>G.mul(q(factorial(r)*factorial(k)),G.pow(Lambda,r),G.pow(G.div(q(2),strip),k),solution),
    make=field=>fn((r,k)=>{if(r+k>5)fail('RESOURCE_LIMIT','A first-selector coefficient derivative would exceed the proved m=5 bound.');requests.push({field,radialOrder:r,etaOrder:k});return G.maximum(core(r,k),field==='F'?annularF.get(r,k):lookup(field,r,k));});
  return {F:make('F'),U:make('U'),Pi:make('Pi'),requests,core:{strip,solution,Lambda,domain:[G.zero,Xlo],agreement:prepared.records[1].coreAgreement,
    proof:'On0<=X<=Xa/2 the actual and auxiliary six-component solutions agree before every original cutoff. The separately constructed analytic auxiliary solution gives r!*k!*Lambda^r*(2/strip)^k*solutionNorm for F,U and Pi. No E/sqrt(X) evaluation is used at the axis.'},
    annulus:{domain:n.domain,sourceRoots:n.actualSourceRoots,proof:'OnX>=Xa/2 use every binomial term of F=E/sqrt(2X); U and Pi are the actual normalized source fields. Their actual compact zero extensions cover all larger X.'}};
}

function cartesianEnvelopes(G,{radius,profiles,stress}){
  const q=(n,d=1)=>G.q(n,d),C=physicalPositiveJetCalculus(G,{maxJetRequests:100000}),{fn,constant:K,mul}=C,
    rad=f=>fn((e,x,y,s)=>e?G.zero:firstSelectorCartesianRadialBound(G,(r,k)=>f.get(r,k),{xOrder:x,yOrder:y,etaOrder:s,radius})),
    coordinate=j=>fn((...o)=>sum(o)===0?radius:sum(o)===1&&o[j]===1?G.one:G.zero),xx=coordinate(1),yy=coordinate(2),
    etaOverL=fn((e,x,y,s)=>e||x||y?G.zero:actualNormCalculus(G).mul(stress.eta,stress.invL).get(0,s)),F=rad(profiles.F),U=rad(profiles.U),v=rad(stress.v1),avg=rad(stress.average1),
    velocity=[mul(K(q(1,2)),xx,avg),mul(K(q(1,2)),yy,avg),mul(xx,F),mul(yy,F),mul(K(q(1,2)),xx,v),mul(K(q(1,2)),yy,v),mul(xx,etaOverL,avg),mul(yy,etaOverL,avg),U],
    pressureStress=[rad(profiles.Pi),rad(stress.theta),rad(stress.z)],requests=[],boundsV=[],boundsP=[];
  for(let x=0;x<=3;x++)for(let y=0;y+x<=3;y++)for(let s=0;s<=2&&x+y+s<=4;s++){
    requests.push({xOrder:x,yOrder:y,etaOrder:s});boundsV.push(...velocity.map(f=>f.get(0,x,y,s)));boundsP.push(...pressureStress.map(f=>f.get(0,x,y,s)));
  }
  return {velocity:G.maximum(G.one,...boundsV),pressureStress:G.maximum(G.one,...boundsP),requests,
    proof:'Includes all derivatives reached by a profile derivative of order<=1 followed by a three-dimensional FTC face. The exact quadratic Cartesian chain and every derivative of each linear transverse factor, regular average and eta/L factor are included.',usage:C.usage()};
}

export function attachActualCommonFirstSelectorFTCUpperBounds(bodies,context={}){
  assertActualPhysicalCenterFiniteJetBodies(bodies);const p=bodies.physicalCenter,family=p.family,prepared=family.prepared,source=family.G,G=bodies.G;
  // The body assertion above recursively calls the original physical
  // point, band, family, and coefficient-prefix assertions. Do not repeat
  // their large unchanged snapshot traversals merely to rename them.
  if(prepared.G!==source||G===source||G===p.G)fail('INVALID_SOURCE_CONSTRUCTION','Use the original private family and the distinct same-source finite body graph.');
  const sourceStart=source.nodes.length,targetStart=G.nodes.length,selectorBefore=canonicalStringify(family.selector),tupleBefore=captureFirstSelectorSourceTupleSnapshot(prepared.records),
    pCount=p.G.nodes.length,pDefinitions=p.G.captureFunctionDefinitions(),selection=selectedFirstFaces(family),q=(n,d=1)=>G.q(n,d),
    checkBudget=()=>{context.checkCancelled?.();if(source.nodes.length-sourceStart+G.nodes.length-targetStart>MAX_NEW_NODES)fail('RESOURCE_LIMIT','The additional first-selector upper-bound graph exceeded100000 nodes. No incomplete bound is certified.');},
    ctx={...context,checkCancelled:checkBudget};
  progress(ctx,'first-selector-upper-n1-m5-source-start',G,{sourceNodeCount:sourceStart});
  const norms=attachActualInductionNorms(prepared,{throughOrder:1,derivativeOrder:5},ctx);assertActualInductionNorms(norms);
  for(const c of selection.selected)for(const id of [c.row.body,...c.row.coordinates,...c.row.lower,...c.row.upper,...c.row.faces.flatMap(f=>[f.derivative,f.upperBound])])
    if(id>=sourceStart||!same(source.nodes[id],G.nodes[id]))fail('INVALID_SOURCE_CONSTRUCTION','An original FTC operand was not retained in the same body-graph prefix.');
  // Collect precisely the source constants needed by the new bound. The
  // old family prefix is already present in G; newly appended norm roots
  // are copied by operation, not by numeric ID.
  const normRoots={...norms.roots,leadingU:norms.leadingNormalized.U[0].upper,leadingF:norms.leadingNormalized.FActive[0].upper,
    Xlo:norms.normalized[0].domain.X[0],auxiliaryStrip:prepared.records[1].norm.auxiliary.strip,auxiliaryNorm:prepared.records[1].norm.auxiliary.solutionNorm},
    imported=copyFirstSelectorPositiveBounds(source,G,sourceStart,normRoots,ctx),copyMap=new Map(imported.rows.map(r=>[r.originalRoot,r.copiedRoot])),copy=id=>{
      if(copyMap.has(id))return copyMap.get(id);const extra=copyFirstSelectorPositiveBounds(source,G,sourceStart,{root:id},ctx);imported.rows.push(...extra.rows);for(const r of extra.rows)copyMap.set(r.originalRoot,r.copiedRoot);return extra.roots.root;},
    scalar=normalizedScalarMajorants(G,norms,copy,prepared),{Xb,Xminus,Xplus}=prepared.bootstrap.orderOne,Xa=G.parameter('Xa'),h=G.parameter('h'),Csource=G.parameter('CSelected'),
    cutoff=sourceAllOrderCutoffJets({order:7},ctx),high=actualLeadingHighJetBounds({},ctx),outer=firstSelectorOuterHeatMajorant(G,{C:Csource,Xa,stepBounds:cutoff.activation.ordinaryDerivativeBounds,order:5}),
    A=actualNormCalculus(G),leadingU=A.fn((r,k)=>r<=11&&k<=24?imported.roots.leadingU:fail('RESOURCE_LIMIT','The original leading norm rectangle was exceeded.')),
    leadingF=A.fn((r,k)=>r+k<=5?G.maximum(imported.roots.leadingF,outer.upper):fail('RESOURCE_LIMIT','The complete outer leading finite norm was exceeded.')),
    stress=firstSelectorStressMajorants(G,{F0:leadingF,U0:leadingU,F1:scalar.F,U1:scalar.U,Pi1:scalar.Pi,Xupper:G.mul(q(2),Xb),Xlower:Xminus,h}),
    radius=G.sqrt(G.mul(q(2),Xb)),cart=cartesianEnvelopes(G,{radius,profiles:scalar,stress}),terminal=firstSelectorTerminalBMajorant(G,{C:Csource,rho:G.mul(G.parameter('co'),h),stepBounds:cutoff.activation.ordinaryDerivativeBounds}),
    piValues=[],weightedValues=[],terminalValues=[],weightedRequests=[],terminalRequests=[],zetaInverse=G.exp(q(16448)),
    zetaInverseX=G.mul(zetaInverse,G.inv(Xminus),G.add(G.div(q(4194304),G.parameter('t1')),q(512)));
  for(let r=0;r<=2;r++)for(let k=0;k<=2&&r+k<=3;k++){
    piValues.push(scalar.Pi.get(r,k));terminalValues.push(terminal.get(r,k));terminalRequests.push({deltaOrder:r,etaOrder:k});
    // A first two-coordinate FTC adds at most one X derivative to the
    // original quotient T_(r,k)/zeta. That derivative acts on BOTH factors.
    for(const f of [stress.theta,stress.z]){weightedValues.push(G.mul(zetaInverse,f.get(r,k)));if(r>0)weightedValues.push(G.add(G.mul(zetaInverse,f.get(r,k)),G.mul(zetaInverseX,f.get(r-1,k))));}
    weightedRequests.push({radialOrder:r,etaOrder:k});
  }
  const envelopes={'velocity-cartesian':cart.velocity,'physical-cartesian':cart.pressureStress,'normalized-pressure':G.maximum(G.one,...piValues),'order-one-terminal':G.maximum(G.one,...terminalValues),'order-one-interior':G.maximum(G.one,...weightedValues)},
    replacements=new Map(),faceProofs=[];
  for(const c of selection.selected){checkBudget();const ftc=c.row,upper=firstSelectorFTCUpperFaces(G,ftc,()=>envelopes[c.kind]);
    for(const f of upper.faces)if(selection.used.has(f.originalFaceUpper)){
      if(replacements.has(f.originalFaceUpper))replacements.set(f.originalFaceUpper,G.maximum(replacements.get(f.originalFaceUpper),f.upper));else replacements.set(f.originalFaceUpper,f.upper);
      faceProofs.push({kind:c.kind,originalRowIndex:c.index,originalBody:ftc.body,originalBound:ftc.bound,coordinates:ftc.coordinates,lower:ftc.lower,upper:ftc.upper,...f});
    }
  }
  const upperRows=family.selector.rows[0].constraints.map((original,index)=>{const comparison=firstSelectorMonotoneUpper(G,original.bound,replacements),
    upperRequiredLog=G.div(G.add(G.log(q(2)),G.log(comparison.upperRoot)),h);
    return {index,kind:original.kind,derivativeOrder:original.derivativeOrder,pole:original.pole??null,originalBound:original.bound,originalRequiredLog:original.requiredLog,
      upperBound:comparison.upperRoot,upperRequiredLog,comparison,relation:'originalBound<=upperBound and originalRequiredLog<=upperRequiredLog; neither upper expression replaces the original selected scale.'};});
  checkBudget();progress(ctx,'first-selector-upper-all-original-ftc-faces-bound',G,{faceProofs:faceProofs.length,additionalSourceNodes:source.nodes.length-sourceStart});
  const originalTrace=traceExactArithmeticDependencies(G,Object.fromEntries(upperRows.map(r=>['original_'+r.index,r.originalBound]))),
    upperTrace=traceExactArithmeticDependencies(G,Object.fromEntries(upperRows.flatMap(r=>[['upper_'+r.index,r.upperBound],['upperLog_'+r.index,r.upperRequiredLog]]))),
    outerSource=prepared.bootstrap.actualHeat.heat,
    checks=[{id:'same-eight-original-first-clauses',pass:upperRows.length===8&&upperRows.every(r=>r.derivativeOrder<=1)&&upperRows.every(r=>r.comparison.changed)},
      {id:'new-n1-m5-upper-norm-only',pass:norms.order===1&&norms.derivativeOrder===5&&norms.leading.radialOrder===11&&norms.leading.etaOrder===24&&Object.values(norms.checks).every(Boolean)},
      {id:'original-regular-axis-and-global-annulus-cover',pass:same(prepared.records[1].coreAgreement.domain,[source.zero,source.parameter('Xa')])&&
        norms.normalized[0].actualSourceRoots.F===prepared.records[1].global.F&&norms.normalized[0].actualSourceRoots.U===prepared.records[1].global.U&&norms.normalized[0].actualSourceRoots.Pi===prepared.records[1].global.Pi},
      {id:'every-reached-original-ftc-face-covered',pass:[...selection.used].every(id=>replacements.has(id))&&upperRows.every(r=>r.comparison.usedFaceRoots.length>0)},
      {id:'all-required-source-derivatives-generated',pass:scalar.requests.every(r=>r.radialOrder+r.etaOrder<=5)&&cart.requests.every(r=>r.xOrder+r.yOrder<=3&&r.etaOrder<=2&&r.xOrder+r.yOrder+r.etaOrder<=4)},
      {id:'full-outer-and-Gamma-heat-source-retained',pass:cutoff.pass&&high.pass&&outerSource.stageFields.length===prepared.bootstrap.G.outer.stages.length&&outerSource.stageFields.every((r,j)=>r.id===prepared.bootstrap.G.outer.stages[j].id)&&prepared.bootstrap.actualHeat.program.heat.tailTruncated===false},
      {id:'closed-arithmetic-except-original-A13',pass:upperTrace.nonArithmeticBoundaries.every(r=>r.node.op==='definite_integral'&&[239,257,275].includes(r.id)),remainingBoundaries:upperTrace.nonArithmeticBoundaries.map(r=>({id:r.id,operation:r.node.op}))},
      {id:'same-original-selector-and-coefficient-tuples',pass:canonicalStringify(family.selector)===selectorBefore&&assertFirstSelectorSourceTupleSnapshotUnchanged(prepared.records,tupleBefore)},
      {id:'private-original-producers-still-pass-without-resealing',pass:assertActualInductionNorms(norms)&&assertActualPhysicalCenterFiniteJetBodies(bodies),
        transitiveOriginalAssertions:['assertActualCommonPhysicalCenterEnclosure','assertActualCommonAdmissibleBand','assertActualCommonAdmissibleFamily','assertActualOrderInduction']},
      {id:'physical-point-graph-not-appended-or-rewritten',pass:p.G.nodes.length===pCount&&p.G.functionDefinitionsUnchanged(pDefinitions)}];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','Original first-selector upper bounds failed: '+checks.filter(c=>!c.pass).map(c=>c.id+(c.remainingBoundaries?' '+JSON.stringify(c.remainingBoundaries):'')).join(', '));
  const proof={originalRows:family.selector.rows[0].constraints,upperRows,selection:{componentRoots:selection.componentRoots,producerOrderProof:selection.producerOrderProof},faceProofs,
    n1Norm:{order:1,derivativeOrder:5,requestedLeadingRectangle:[11,24],roots:imported.roots,sourceRoots:norms.normalized[0].actualSourceRoots,core:scalar.core,annulus:scalar.annulus,actualDerivativeRequests:scalar.requests,
      derivativeReason:'The original radial viscosity has two radial derivatives. A positive radial derivative of its signed primitive lowers one derivative; the first physical clause and all FTC faces can therefore require F1/U1 total5. This new upper norm does not alter b_n, c_n, coefficients, cutoffs, or an existing constant.'},
    leading:{high,outer,originalFullF:prepared.records[0].global.F,originalFullU:prepared.records[0].global.U,originalHeat:outerSource.finalF,stageFields:outerSource.stageFields,sourceHeatArgument:outerSource.heatArgument},
    cartesian:cart,stress:{rule:stress.rule,originalAngular:prepared.records[1].stress.angular,originalAxial:prepared.records[1].stress.axial,originalTtheta:prepared.records[1].stress.Ttheta,originalTz:prepared.records[1].stress.Tz,zeroBefore:Xminus},
    weighted:{requests:weightedRequests,zetaInverse,zetaInverseX,originalZeta:family.source.pressureStressSeminorms.roots.sourceZeta,
      proof:'On the original interior box log(X/Xa)>=t1/128 and log(Xb/X)>=1/4. Hence zeta^-1<=exp(128^2+4*4^2), and its first X derivative is bounded by this value times Xminus^-1*(2*128^3/t1+8*4^3). The complete quotient product rule is retained. Terminal endpoint poles are unchanged.'},
    terminal:{requests:terminalRequests,flat:terminal.flat,denominatorLower:terminal.denominatorLower,inverseDenominatorBounds:terminal.inverseDenominatorBounds,heatConstant:terminal.heatConstant,proof:terminal.proof,original:family.source.pressureStressSeminorms.n1Weighted.terminal},
    imported:{prefixCount:imported.prefixCount,rows:imported.rows,typedChildrenOnly:true},arithmeticPositivity:'All changed ancestors are original sums/products/maxima of nonnegative FTC constants, absolute derivative weights, positive radius/side lengths and positive pinned h. An inverse or negative power of a changed operand is rejected.'};
  const result={schema:'MathScope.ActualCommonFirstSelectorFTCUpperBounds/1',G,bodies,physicalCenter:p,family,norms,upperRows,checks,proof,
    sourceBinding:{profileId:prepared.program.profileId,parameterExpressionSHA256:prepared.program.parameterExpressionSHA256,originalFirstLogScale:family.selector.rows[0].logScale,
      sourceCoefficientOrder:1,additionalUpperDerivativeOrder:5,unchangedFirstSelector:true,samePhysicalCenter:true},
    roots:Object.fromEntries(upperRows.flatMap(r=>[['originalBound_'+r.index,r.originalBound],['upperBound_'+r.index,r.upperBound],['upperRequiredLog_'+r.index,r.upperRequiredLog]])),
    diagnostics:{originalTrace,upperTrace,originalTupleSnapshot:firstSelectorSourceTupleSnapshotAudit(tupleBefore),sourcePrefixCount:sourceStart,targetPrefixCount:targetStart,additionalSourceNodes:source.nodes.length-sourceStart,additionalTargetNodes:G.nodes.length-targetStart,maxAdditionalNodes:MAX_NEW_NODES,
      sourceParameterDefinitions:structuredClone(G.source.parametersExactExpressions),originalOpaqueBoundaryCount:originalTrace.nonArithmeticBoundaries.length,upperOpaqueBoundaryCount:upperTrace.nonArithmeticBoundaries.length},
    pass:true,sourceAuthenticated:true,scope:{sameFirstSelectorAndTuplesUnchanged:true,allEightOriginalFirstClauseUpperBounds:true,additionalN1M5IsOnlyAnUpperBound:true,actualOriginalFTCValuesNumericallyEvaluated:false,
      originalSelectorNumericalIntervalIssued:false,sourceScaleReplaced:false,oldPointCertificateTransplanted:false,GNUMGateChanged:false,M3Started:false}};
  seals.set(result,{G,bodies,p,family,norms,count:G.nodes.length,arithmeticTrace:upperTrace,data:canonicalStringify(publicData(result))});
  progress(ctx,'first-selector-upper-source-bound-sealed',G,{upperRows:upperRows.length,remainingOriginalA13Boundaries:upperTrace.nonArithmeticBoundaries.length});return result;
}

function ownedUnchanged(result){const s=seals.get(result);if(!s||s.G!==result.G||s.bodies!==result.bodies||s.p!==result.physicalCenter||s.family!==result.family||s.norms!==result.norms||!result.pass||!result.sourceAuthenticated||
  canonicalStringify(publicData(result))!==s.data)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private original first-selector upper comparison.');assertFirstSelectorArithmeticTraceUnchanged(result.G,s.arithmeticTrace);return s;}
export function assertActualCommonFirstSelectorFTCUpperBounds(result){ownedUnchanged(result);
  assertActualInductionNorms(result.norms);assertActualPhysicalCenterFiniteJetBodies(result.bodies);return true;}

/** A plain immutable-execution receipt for JSON output, not a restored
 * private authority token. The numerical arithmetic adapter receives the
 * live object above and performs its original private assertions itself.
 */
export function projectActualCommonFirstSelectorFTCUpperBounds(result){ownedUnchanged(result);return structuredClone({...publicData(result),
  projection:{containsPrivateGraphOrProducerObjects:false,serializedRecordRestoresPrivateAuthority:false,originalProducerAssertionsPassedAtAttachment:true}});}
