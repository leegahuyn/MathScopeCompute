/** Actual finite numerical-error premises at the newly inverted physical
 * center. Generic power ledgers are implications only; this adapter binds
 * their operands to the same private full field, frame, coupled systems,
 * inverse, target and physical potential, in the derivative graph itself.
 * The original physical-center graph is never appended to or rewritten.
 */
import {assertActualPhysicalCenterFiniteJetBodies} from './actual-physical-center-jet-bodies.mjs';
import {assertActualPhysicalCenterSlowSlopeEnclosure} from './actual-physical-center-slow-slope-enclosure.mjs';
import {assertActualPhysicalCenterTargetEnclosure} from './actual-physical-center-target-enclosure.mjs';
import {physicalCenterJetSourceBoundAudit,physicalCenterOriginalPhaseJetAudit} from './actual-physical-center-jet-source-bounds.mjs';
import {centeredSecondScalarJet,centeredSecondProductAudit,centeredSlowJetErrorAudit} from './actual-centered-slow-jet-enclosure-kernel.mjs';
import {centeredNormalizedFullFrame,centeredNormalizedFullFrameAudit} from './actual-centered-slow-jet-source-bounds.mjs';
import {centeredWholeTimeReferenceFrameAudit,centeredWholeTimeSlowSlopeAudit,centeredFastStabilityPowerAudit,
  centeredUncenteredJetErrorAudit,centeredNormalizedAmplitudeReferenceAudit} from './actual-centered-fast-jet-enclosure-kernel.mjs';
import {actualMovingPulseFrame} from './actual-covariance-matrix.mjs';
import {adiabaticExactBranchNormalizer} from './actual-adiabatic-pulse-center-kernel.mjs';
import {ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fixedLabelSourcePartitionFactor} from './actual-physical-full-curl.mjs';
import {clearDisposableThirdJetCaches} from './actual-third-jet-ftc.mjs';
import {directedArithmetic,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),isRoot=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x],
  requireAll=(checks,message)=>{if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION',message+': '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));},
  progress=(ctx,stage,G,extra={})=>{ctx.checkCancelled?.();ctx.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};

/** This small prefix check supplies no source authority. A private caller
 * must independently authenticate both predecessor objects. In particular
 * an integer root from a sibling append cannot be imported by coincidence.
 */
export function physicalCenterCopiedOperandAudit(G,original,count,roots){
  if(!G?.nodes||!original?.nodes||!Number.isSafeInteger(count)||count<1||!Array.isArray(roots))
    fail('INVALID_INPUT','A copied graph prefix and explicit source operands are required.');
  const checks=roots.map(root=>({root,pass:isRoot(G,root)&&isRoot(original,root)&&root<count&&same(G.nodes[root],original.nodes[root])}));
  requireAll(checks,'A source operand is outside or differs from the copied original prefix');
  return {count,roots,checks,pass:true,sourceAuthenticated:false};
}

/** Five exact derivatives of the complete positive Gamma integrand. The
 * moment endpoints remain0..1, including the whole compactified tail.
 * This is generic algebra; only bindField below connects it to the source.
 */
export function physicalCenterCompleteHeatFiveJetAudit(G,local){
  const x=local?.roots,z=local?.coordinates?.z;
  if(!x||![z,x.h,x.gamma,x.density,x.variable,x.u,x.den,x.power,x.body].every(r=>isRoot(G,r))||G.nodes[z].op!=='coordinate')
    fail('INVALID_INPUT','Use complete heat operands with an independent heat-argument coordinate.');
  let actual=x.body,rising=G.one;const rows=[];
  for(let j=1;j<=5;j++){
    actual=G.derivative(actual,z);rising=G.mul(rising,G.add(x.h,G.q(j-1)));
    const integrand=G.div(G.mul(x.body,G.pow(x.u,j)),G.pow(x.den,j)),expected=G.mul(G.q(j%2?-1:1),rising,integrand),
      identity=sourceGraphRationalIdentity(G,G.sub(actual,expected),{atomicNodes:[x.density,x.power],maxTerms:20000}),
      moment=G.div(G.integral(integrand,x.variable,G.zero,G.one),x.gamma);
    rows.push({order:j,actual,expected,integrand,moment,rising,identity,pass:identity.pass});
  }
  requireAll(rows.map(r=>({id:'whole-heat-integrand-'+r.order,pass:r.pass})),'A complete heat derivative failed');
  return {rows,originalBody:x.body,originalGamma:x.gamma,variable:x.variable,lower:G.zero,upper:G.one,pass:true,sourceAuthenticated:false,
    domination:'For0<h<1,z>=0, the positive denominator is>=1. The complete Gamma density bounds |H^(j)| by j!*(j+1)!, j<=5. Differentiation under the original whole integral follows from these integrable majorants.'};
}

/** Directed conditioning of actual NEW source values. Do not infer it
 * from symmetry of the two approximate columns, nor from derivative rows.
 * Exported separately for singular/sign/precision regression controls.
 */
export function physicalCenterNumericalJetConditioning(values,bits){
  if(!values||values.centers?.length!==2||values.weights?.length!==2||values.covariance?.length!==2||values.covariance.some(r=>r.length!==2))
    fail('INVALID_INPUT','Two center, covariance-column and positive-weight value intervals are required.');
  const A=directedArithmetic(bits),centers=values.centers.map(x=>A.unpack(x)),squares=centers.map(x=>A.mul(x,x)),
    rawH=values.covariance.map(row=>row.map(x=>A.unpack(x))),rawY=values.weights.map(x=>A.unpack(x)),
    H=rawH.map(row=>row.map((x,i)=>A.div(x,squares[i]))),Y=rawY.map((x,i)=>A.mul(x,squares[i])),
    det=A.sub(A.mul(H[0][0],H[1][1]),A.mul(H[0][1],H[1][0])),
    inverse=[[H[1][1],A.neg(H[0][1])],[A.neg(H[1][0]),H[0][0]]].map(row=>row.map(x=>A.div(x,det))),
    abs=x=>[x[0]>=0n?x[0]:x[1]<=0n?-x[1]:0n,(x[0]<0n?-x[0]:x[0])>(x[1]<0n?-x[1]:x[1])?(x[0]<0n?-x[0]:x[0]):(x[1]<0n?-x[1]:x[1])],
    inverseRows=inverse.map(row=>row.map(abs).reduce((a,b)=>A.add(a,b),A.zero())),sqrtY=Y.map(x=>A.sqrt(x)),
    checks=[{id:'actual-centers-in-one-quarter-to-one-half',pass:centers.every(x=>4n*x[0]>=A.S&&2n*x[1]<=A.S)},
      {id:'actual-uncentered-covariance-has-opposite-second-row-signs',pass:rawH[0].every(x=>8n*x[0]>=A.S&&2n*x[1]<=A.S)&&
        8n*rawH[1][0][0]>=A.S&&2n*rawH[1][0][1]<=A.S&&8n*rawH[1][1][1]<=-A.S&&2n*rawH[1][1][0]>=-A.S},
      {id:'actual-uncentered-positive-weights-in-one-to-four',pass:rawY.every(x=>x[0]>=A.S&&x[1]<=4n*A.S)},
      {id:'actual-centered-H-determinant-negative',pass:det[1]<0n},
      {id:'actual-centered-H-infinity-inverse-at-most-one',pass:inverseRows.every(x=>x[1]<=A.S)},
      {id:'actual-centered-weights-in-one-eighth-to-one-half',pass:Y.every(x=>8n*x[0]>=A.S&&2n*x[1]<=A.S)},
      {id:'actual-centered-positive-square-root-at-least-one-quarter',pass:sqrtY.every(x=>4n*x[0]>=A.S)}];
  if(checks.some(x=>!x.pass))fail('PRECISION_REQUIRED','The actual new-center inverse conditioning is not separated: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {checks,pass:true,sourceAuthenticated:false,H:H.map(row=>row.map(x=>A.pack(x))),Y:Y.map(x=>A.pack(x)),
    determinant:A.pack(det),inverse:inverse.map(row=>row.map(x=>A.pack(x))),inverseRowBounds:inverseRows.map(x=>A.pack(x)),sqrtY:sqrtY.map(x=>A.pack(x)),
    arithmetic:{bits,kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',binary64UsedForDecisions:false},
    source:'H is the actual H/(diag(Ac,u)*massScale); centers are actual a_sign, and weights are actual y/(tau/massScale). Centering divides each independent column by its own positive a_sign^2.'};
}

/** Read-only diagnostic addendum for the later selector-scale arithmetic
 * proof. Typed child rules deliberately exclude derivative orders and
 * integer exponents. Unknown functional nodes are retained as boundaries,
 * never evaluated or treated as a proved numerical bound.
 */
export function physicalCenterSelectorSourceDiagnostics(G,p){
  const first=p.family.selector.rows[0],rootNames={A13SteepIntegral:239,A13FlattenIntegral:257,A13TerminalIntegral:275,
    Qb:G.outer.roots.Qb,Qp:G.outer.roots.Qp,terminalWait:G.outer.roots.terminalWait},stages=G.outer.stages.map(s=>({id:s.id,
      start:s.start,end:s.end,length:s.length,logAStart:s.logAStart,logAEnd:s.logAEnd}));
  const nodes=new Map(),boundaries=[],stack=[...Object.values(rootNames),...stages.flatMap(s=>[s.start,s.end,s.length,s.logAStart,s.logAEnd])],
    leaf=new Set(['rational','source_parameter','coordinate']),unary=new Set(['inverse','exp','log_positive','sqrt_positive','ceiling','floor','sine','cosine']),
    allChildren=new Set(['add','multiply','maximum','definite_integral','smooth_piecewise']);
  while(stack.length){
    const id=stack.pop();if(nodes.has(id))continue;
    if(!isRoot(G,id)||nodes.size>=25000)fail('RESOURCE_LIMIT','The original small A.13 diagnostic closure is missing or exceeds its finite budget.');
    const node=G.nodes[id];nodes.set(id,{id,node:structuredClone(node)});let children=[];
    if(leaf.has(node.op)){}
    else if(unary.has(node.op)||node.op==='integer_power'||node.op==='source_step_derivative')children=[node.args[0]];
    else if(allChildren.has(node.op))children=node.args;
    else boundaries.push({id,node:structuredClone(node),reason:'Retained original functional boundary, no numerical value supplied.'});
    stack.push(...children);
  }
  const source=p.family.source,velocity=source.velocitySeminorms,stress=source.pressureStressSeminorms,
    expression9=G.expressionSystems[9],diagnostics={schema:'MathScope.PhysicalCenterSelectorSourceDiagnostics/1',
      originalGraphNodeCount:G.nodes.length,rootNames,originalA13IntegralTypes:[239,257,275].map(id=>({id,op:G.nodes[id]?.op,
        isOriginalDefiniteIntegral:G.nodes[id]?.op==='definite_integral'})),
      stages,nodes:[...nodes.values()].sort((a,b)=>a.id-b.id),functionalBoundaries:boundaries,completeA13Closure:boundaries.length===0,
      firstConstraints:first.constraints.map((c,index)=>({index,...structuredClone(c)})),
      originalNormRecords:{velocity:{request:velocity.request,domain:velocity.domain,rows:velocity.rows.filter(r=>r.order===1),ftcRows:velocity.ftcRows},
        pressureStress:{request:stress.request,domain:stress.domain,rows:stress.rows.filter(r=>r.order===1),
          normalizedPressure:stress.normalizedPressure.filter(r=>r.order===1),n1Weighted:stress.n1Weighted,ftcRows:stress.ftcRows}},
      definitionNamespaces:{expressionSystems:expression9?[{index:9,definition:structuredClone(expression9)}]:[],
        picardSystems:structuredClone(G.picardSystems),naturalSeriesKernel:structuredClone(G.naturalKernel)},
      scope:{readOnly:true,sourceAuthenticated:false,numericalScaleBoundProved:false,all401OpaqueBodiesExpanded:false,
        originalFTCReferencesRetained:true,integerMetadataTreatedAsGraphRoots:false,wholeGNUMComplete:false}};
  return diagnostics;
}

function bindField(G,p,slopes,ledger,point){
  const b=p.band,x=slopes.roots,heat=physicalCenterCompleteHeatFiveJetAudit(G,slopes.source.local),
    needed=id=>slopes.source.checks.some(r=>r.id===id&&r.pass),checks=[
      {id:'same-private-complete-field-and-original-Gamma',pass:slopes.source.pass&&slopes.source.sourceAuthenticated===true&&
        needed('original-improper-heat-loss-density-gamma-and-endpoints')&&needed('same-original-full-heat-and-terminal-step')&&needed('complete-leading-body-and-original-slow-prefactor')},
      {id:'same-new-point-and-open-completed-exterior',pass:needed('full-completed-source-equals-leading-on-this-open-neighborhood')&&needed('original-implicit-chart-and-positive-bracket')&&
        needed('same-actual-anchor-and-exact-small-point-displacement')&&p.point.inverse.slow.Z===G.zero&&p.point.pass&&p.support.pass},
      {id:'source-positive-h-and-expanded-implicit-majorant',pass:p.sourceBounds.contract.positive&&p.sourceBounds.contract.notNumericallyReplaced&&
        p.sourceBounds.contract.upperBoundExact==='2^-4096'&&x.h===b.constants.h&&ledger.primitive.field.order===5&&ledger.primitive.field.pass},
      {id:'original-field-bodies-before-point-evaluation',pass:x.originalFBody===b.fields.F&&x.originalFRBody===G.derivative(b.fields.F,b.coordinates.R)&&
        point.at(x.originalFBody)===p.midplane.roots.F&&point.at(x.originalFRBody)===p.midplane.roots.FR},
      {id:'complete-five-heat-jets-and-source-Gamma',pass:heat.pass&&heat.originalGamma===x.originalGamma&&slopes.source.local.pass},
      {id:'new-point-comparison-functionals-retain-time-factor',pass:slopes.source.slopeAudit.pass&&slopes.source.fieldAudit.pass&&slopes.source.ratioAudit.pass&&
        ['R','Z','T'].every(k=>isRoot(G,x.mu[k])&&isRoot(G,x.nu[k])&&isRoot(G,x.sourceC[k])&&isRoot(G,x.sourceD[k]))}];
  requireAll(checks,'The new-point complete field source premise failed');
  return {checks,pass:true,heat,sourceRoots:x,fieldMajorant:ledger.primitive.field,sourceEqualities:slopes.source.sourceEqualities,
    domainProof:p.point.domainProof,originalPositiveSupportProof:p.support.proof,
    primitiveConversion:'The private original f*H>1/2 and F<Renv^71 imply Bstar<2Renv^71<Renv^72. The expanded implicit-chart/step/Gamma recurrence supplies every normalized mixed field jet throughfive<Renv^73 at every center in the declared delta/T box. Original G and every finite jet vanish only by the complete source exterior proof; they are retained in every raw matrix below.'};
}

function bindRawFrame(G,b,f,ctx){
  const {R,Z,v}=b.coordinates,g=b.geometry,c=b.constants,F=b.fields.F,
    input={F,FR:G.derivative(F,R),GR:G.derivative(b.fields.G,R),R,epsilon:g.epsilon,k:g.k,p:f.carrier.p,pz:f.carrier.pz,x0:f.carrier.x0,v,Ls:g.Ls,u:c.u,
      c0:b.frozen.c0,lambda0:b.frozen.lambda0,HR:f.phaseDerivatives.R,HZ:f.phaseDerivatives.Z,sign:f.sign},
    regenerated=actualMovingPulseFrame(G,input),branch=adiabaticExactBranchNormalizer(G),normal=branch.normalize,
    checks=f.frame.wMatrix.flatMap((row,i)=>row.map((x,j)=>({id:'original-full-M-'+i+'-'+j,...ellOneSourceScalarIdentity(G,normal(x),normal(regenerated.wMatrix[i][j]))}))),
    phaseChecks=[[R,f.phaseDerivatives.R],[Z,f.phaseDerivatives.Z]].map(([axis,body])=>{
      const actual=normal(body),expected=normal(G.add(G.mul(f.carrier.p,G.derivative(F,axis)),G.mul(f.carrier.pz,G.derivative(b.fields.G,axis))));
      return {id:'original-slow-phase-'+axis,axis,actual,expected,...sourceGraphRationalIdentity(G,G.sub(actual,expected),
        {atomicNodes:[normal(f.carrier.p),normal(f.carrier.pz),normal(G.derivative(F,axis)),normal(G.derivative(b.fields.G,axis))],maxTerms:12000})};});
  requireAll([...checks,...phaseChecks],'The complete original frame and phase derivative changed');
  progress(ctx,'new-physical-jet-bound-original-full-frame-'+f.sign,G);
  return {input,retainedMatrix:f.frame.wMatrix,regeneratedMatrix:regenerated.wMatrix,checks,phaseChecks,
    branches:branch.receipt([...f.frame.wMatrix.flat(),...regenerated.wMatrix.flat()]),pass:true,fullPressureAndBPrimeRetained:true,actualBodyModified:false};
}

function bindWholeTime(G,bodies,p,ledger,algebra,point,ctx){
  const b=p.band,g=b.geometry,c=b.constants,{R,Z,v}=b.coordinates,directions=point.directions,
    tau=G.fresh('new_physical_jet_normalized_time'),names=['F','FR','FZ','R','beta','inverseLength','epsilon','lambda0','c0','u','dampingScale'],
    formal=Object.fromEntries(names.map(k=>[k,G.fresh('new_physical_jet_primitive_'+k)])),auxNames=['inverseLength','epsilon','beta'],rows=[];
  for(const [i,f]of b.families.entries()){
    const raw=bindRawFrame(G,b,f,ctx),template=centeredNormalizedFullFrame(G,{...formal,tau,sign:f.sign}),jets=[];
    for(let order=0;order<=2;order++){
      const derivative=body=>{let x=body;for(let j=0;j<order;j++)x=G.derivative(x,tau);return x;},matrix=template.wMatrix.map(row=>row.map(derivative)),
        D=[G.one,G.neg(G.mul(formal.c0,G.sqrt(G.add(G.one,G.pow(formal.u,2))))),formal.u],
        amplitude=template.B.map((row,j)=>row.map(x=>derivative(G.div(x,D[j]))));
      jets.push({order,matrix,amplitude,auxiliary:auxNames.map(name=>({name,coordinate:formal[name],
        matrix:matrix.map(row=>row.map(x=>G.derivative(x,formal[name]))),amplitude:amplitude.map(row=>row.map(x=>G.derivative(x,formal[name])))}))});
    }
    const original=G.covarianceSystems[f.system],variation=bodies.variations[i],actualTimeJets=[original.matrix];
    for(let j=1;j<=2;j++)actualTimeJets.push(actualTimeJets[j-1].map(row=>row.map(x=>G.derivative(x,v))));
    const actualMixedTimeJets=directions.map((d,j)=>({direction:d,matrix:variation.matrices[j+1].map(row=>row.map(x=>G.mul(g.Ls,G.derivative(x,v))))})),
      D=[G.one,p.roots.scales.Ac,c.u],actualAmplitudeJets=f.frame.B.map((row,j)=>row.map(body=>{
        const normalized=G.div(body,D[j]);return {component:j,originalBody:body,normalized,slow:centeredSecondScalarJet(G,normalized,directions),
          first:G.derivative(normalized,v),second:G.derivative(G.derivative(normalized,v),v),mixed:directions.map(d=>G.derivative(G.derivative(normalized,d),v))};})),
      sourcePort={F:b.fields.F,FR:G.derivative(b.fields.F,R),FZ:G.derivative(b.fields.F,Z),R,
        beta:G.div(G.mul(g.Ls,f.carrier.p),g.Bs),inverseLength:G.inv(g.Ls),epsilon:g.epsilon,lambda0:b.frozen.lambda0,c0:b.frozen.c0,u:c.u,
        dampingScale:G.div(b.frozen.lambda0,G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3))},
      sourceChecks=[{id:'same-original-system-unit-datum-and-whole-interval',pass:same(original.matrix,f.frame.wMatrix)&&same(original.initial,[G.one,G.zero])&&
        original.variable===v&&original.length===g.Ls&&same(original.parameters,point.parameters)},
        {id:'same-original-twenty-dimensional-second-variation',pass:variation.dimension===20&&variation.originalSystem===f.system&&
          variation.originalMatrixUnchanged&&variation.exactOriginalValueAlias&&variation.allRequiredMatrixAndTimeDerivativeBodiesGenerated&&same(actualTimeJets[1],variation.timeMatrix)},
        {id:'same-source-rounded-carrier-not-replaced-by-reference',pass:p.rows[i].copiedChecks.every(x=>x.pass)&&p.rows[i].formalBinding.rewriteChecks.every(x=>x.pass)&&
          p.rows[i].formalBinding.actualMatrixReplaced===false&&f.carrier.nonzeroAngularInteger&&f.carrier.roundingErrorUpper===G.inv(g.k)},
        {id:'positive-Bs-scale-and-full-damping',pass:g.Bs===G.sqrt(G.div(b.frozen.lambda0,G.mul(g.epsilon,G.pow(g.k,2),G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3))))&&
          algebra.frame.rows[i].partChecks.every(x=>x.pass)&&template.fullMovingPressureRetained&&template.fullMovingBasisRetained},
        {id:'entire-auxiliary-segment-has-positive-normal-denominators',pass:G.substitute(template.n[2],formal.FZ,G.zero)===G.q(-1)&&p.support.pass&&p.midplane.pass},
        {id:'complete-slow-fast-and-auxiliary-derivative-bodies',pass:jets.length===3&&jets.every(j=>j.auxiliary.length===3&&j.matrix.flat().every(x=>isRoot(G,x))&&
          j.auxiliary.every(a=>[...a.matrix.flat(),...a.amplitude.flat()].every(x=>isRoot(G,x))))&&
          actualAmplitudeJets.flat().every(x=>x.slow.roots.length===10&&x.mixed.length===3&&isRoot(G,x.first)&&isRoot(G,x.second))},
        {id:'separate-normalized-amplitude-finite-bound',pass:ledger.primitive.amplitude.maximumPower===1132&&ledger.primitive.amplitude.pass&&
          ellOneSourceScalarIdentity(G,D[1],point.at(G.mul(G.neg(b.frozen.c0),G.sqrt(G.add(G.one,G.pow(c.u,2)))))).pass&&directions.every(d=>G.derivative(D[1],d)===G.zero)},
        {id:'whole-original-Gaussian-and-stable-positive-cone',pass:p.rows[i].gaussian.pass&&p.sourceBounds.pass&&p.sourceBounds.contract.positive&&p.physical.cutoffPlateau.pass}];
    requireAll(sourceChecks,'A new-point whole-time source premise failed for sign '+f.sign);
    rows.push({sign:f.sign,raw,formal,tau,template,jets,sourcePort,sourcePortAtPoint:Object.fromEntries(Object.entries(sourcePort).map(([k,x])=>[k,point.at(x)])),
      zeroAuxiliaryComparison:{inverseLength:G.zero,epsilon:G.zero,beta:G.neg(G.div(G.mul(G.q(f.sign),c.u),p.midplane.roots.FR))},
      originalMatrix:original.matrix,actualTimeJets,actualMixedTimeJets,actualAmplitudeJets,variationSystem:variation.system,sourceChecks,pass:true});
    progress(ctx,'new-physical-jet-bound-whole-time-and-amplitude-'+f.sign,G);clearDisposableThirdJetCaches(G);
  }
  return {rows,pass:true,sourcePrimitiveLedger:ledger.primitive,
    exactPort:'The checked original raw frame cancels the same positive frozen Bs from n,nprime,K projection,tangent/normal basis,B,Bleft and Bprime. The exact raw/tau identity then gives the retained normalized template. The actual local completed source has G and all its slow jets zero only on the authenticated open exterior; atZ=0,FZ=0,N=(-1,0),K=(0,-1),pz=-Bs,x0=sign*u*Bs/2. The full actual bodies are unchanged.',
    finiteAuxiliaryProof:'The expanded field and original scalar bounds give the printed matrix primitive maximum3313<3840<4096 and separate amplitude1132<4096. Two tau derivatives and one small-auxiliary derivative use at mostfour underlying primitive derivatives, including Bprime. Actual M_i,M_ij,L*M_iv are generated before point substitution. These bounded primitive orders suffice; no bound for every fourth slow derivative of M is asserted.',
    originalRoundedError:'beta=Ls*p/Bs is retained. Its comparison beta0=-sign*u/FRsharp obeys |beta-beta0|<=Ls/(k*Bs)<Renv^40/S^7. Also1/Ls<=B/S and0<epsilon<4/S^16. Since the full reference matrix is diag(0,-2lambda) throughout0<=tau<=1, the actual error and both tau derivatives are<=B^64/S by the printed finite mean-value integral on these three auxiliaries.',
    coneAndInitialLayer:{source:p.sourceBounds.derivation,reference:algebra.reference,stability:algebra.fast,
      proof:'lambda>=1/B and its first two tau derivatives<=B^2. The actual stable Riccati slope is<=-1/B, with positive w_plus and |r|<=B^260/S. For L/4<=v<=3L/4 retain r_v(0)=M21(0) and r_iv(0)=M21_i(0), multiplied by the positive exp(-L/(4B))<S^-4. Neither initial layer is set to zero.'}};
}

function bindCenterAndIntegrals(G,bodies,p,slopes,point,conditioning,ctx){
  const b=p.band,g=b.geometry,v=b.coordinates.v,dirs=point.directions,scales=p.roots.scales,m=scales.massScale,tau=scales.tau,
    diagonal=[scales.Ac,b.constants.u],centers=bodies.families.map(f=>f.rawModes[0].roots[0]),H=b.target.H,y=b.target.weights,
    Hbar=H.map((row,j)=>row.map((x,i)=>G.div(x,G.mul(diagonal[j],m,G.pow(centers[i],2))))),
    Ybar=y.map((x,i)=>G.div(G.mul(x,m,G.pow(centers[i],2)),tau)),Tbar=b.target.components.map((x,j)=>G.div(x,G.mul(diagonal[j],tau))),
    columnChecks=Hbar.flatMap((row,j)=>row.map((x,i)=>({id:'exact-centered-column-'+j+'-'+i,...sourceGraphRationalIdentity(G,
      G.sub(G.mul(x,Ybar[i]),G.div(G.mul(H[j][i],y[i]),G.mul(diagonal[j],tau))),{atomicNodes:[H[j][i],y[i],diagonal[j],m,tau,centers[i]],maxTerms:12000})}))),
    Hjets=Hbar.map(row=>row.map(x=>centeredSecondScalarJet(G,x,dirs))),Yjets=Ybar.map(x=>centeredSecondScalarJet(G,x,dirs)),Tjets=Tbar.map(x=>centeredSecondScalarJet(G,x,dirs)),
    covarianceChecks=[],logRows=[];
  for(const [i,f]of b.families.entries()){
    for(const component of [1,2]){
      const product=centeredSecondProductAudit(G,{factors:[G.pow(b.cutoffs.psi,2),f.t[0],f.t[component]],directions:dirs});
      for(let j=0;j<product.indices.length;j++){
        const expected=G.mul(g.haarFactor,G.integral(product.roots[j],v,G.zero,g.Ls)),retained=bodies.inverse.matrixJets[j][component-1][i];
        covarianceChecks.push({id:'whole-H-'+f.sign+'-'+component+'-'+j,sign:f.sign,component,orders:product.indices[j],retained,expected,
          integrand:product.roots[j],integrandCheck:product.checks[j],pass:retained===expected&&product.checks[j].pass});
      }
    }
    const w=f.w,M=G.covarianceSystems[f.system].matrix,ratio=G.div(w[1],w[0]),log=G.log(w[0]),qv=G.add(M[0][0],G.mul(M[0][1],ratio)),
      rv=G.sub(G.add(M[1][0],G.mul(G.sub(M[1][1],M[0][0]),ratio)),G.mul(M[0][1],G.pow(ratio,2))),
      qvCheck=sourceGraphRationalIdentity(G,G.sub(G.derivative(log,v),qv),{atomicNodes:[...M.flat(),...w],maxTerms:20000}),
      rvCheck=sourceGraphRationalIdentity(G,G.sub(G.derivative(ratio,v),rv),{atomicNodes:[...M.flat(),...w],maxTerms:20000}),
      centerLog=G.log(centers[i]),centerRows=dirs.map((axis,j)=>{
        const factor=j===0?point.values[0]:G.one,derivative=G.mul(factor,G.derivative(centerLog,axis)),integrand=G.mul(factor,G.derivative(qv,axis)),
          integral=G.integral(integrand,v,G.zero,bodies.roots.centerTime),initial=G.substitute(G.mul(factor,G.derivative(log,axis)),v,G.zero);
        return {direction:['R','Z','T'][j],dynamicCenterDerivative:derivative,wholeHalfPulseIntegrand:integrand,wholeHalfPulseIntegral:integral,
          initial,atPoint:point.at(derivative),integralAtPoint:point.at(integral),pass:initial===G.zero,
          exactFTC:'D_i log a=Integral_0^(Ls/2) D_i(M11+M12*r)dv. The actual positive center and original forcing are both retained.'};
      });
    requireAll([{id:'complete-log-RHS-'+f.sign,pass:qvCheck.pass},{id:'complete-ratio-RHS-'+f.sign,pass:rvCheck.pass},
      ...centerRows.map(x=>({id:'unit-initial-log-'+f.sign+'-'+x.direction,pass:x.pass})),
      {id:'same-dynamic-original-center-'+f.sign,pass:point.at(centers[i])===p.rows[i].center.a}], 'The original center/logarithmic FTC failed');
    logRows.push({sign:f.sign,ratio,log,qv,rv,qvCheck,rvCheck,center:centers[i],centerRows,
      firstSlow:dirs.map(d=>G.derivative(ratio,d)),secondSlow:centeredSecondScalarJet(G,ratio,dirs),
      initialFirstTime:G.substitute(M[1][0],v,G.zero),initialMixedTime:dirs.map(d=>G.substitute(G.derivative(M[1][0],d),v,G.zero)),pass:true});
    progress(ctx,'new-physical-jet-bound-whole-H-and-half-pulse-'+f.sign,G);clearDisposableThirdJetCaches(G);
  }
  requireAll([...columnChecks,...covarianceChecks],'The exact dynamic centering or original whole H integral failed');
  return {centers,Hbar,Ybar,Tbar,Hjets,Yjets,Tjets,columnChecks,covarianceChecks,logRows,conditioning,pass:true,
    sourceComparison:{mu:slopes.roots.mu,nu:slopes.roots.nu,c:slopes.roots.sourceC,d:slopes.roots.sourceD,proof:slopes.source.sourceEqualities.slopes},
    exactCentering:'With frozen D=(Ac,u),m,tau, K_ji=H_ji/(D_j*m*a_i^2),Y_i=y_i*m*a_i^2/tau,Tbar_j=T_j/(D_j*tau), K*Y=Tbar follows from the actual inverse identity and the checked column products. Since a,y,m,tau>0, sqrt(y)/A0=sqrt(Y)/a. Every a_i remains a slow function during differentiation; both coupled channels and all target derivatives are retained.',
    wholeGaussian:'Differentiate every original psi^2*t_r*t_j integrand on0..Ls and retain the original haarFactor. The source whole-time Gaussian and stable ratio proof bounds the complete normalized integral, including both tails, by2^16. Dynamic centering bounds logarithmic differences polynomially; no exp(B*S) estimate or core-only integral is used.',
    slopeError:'The original normalized comparison gives mu_i=kappa*c_i-d_i/2 atv0, and nu_i=IA*c_i-IB*d_i on the whole first half. Here IA=log2/3,IB=IA-7/72; original finite-u errors8/u^2 and64/u^2 remain positive. The whole original q_i forcing contributes<B^266/S after dividing bygLs, while |q_ij|/(gLs)^2<B^23/S. The actual first/second center and w_minus derivatives are bounded, never zeroed.',
    inverseError:'Actual NEW directed value boxes first prove ||K^-1||_infinity<=1 and1/8<=Y<=1/2. Differentiating K*Y=Tbar and the positive square root therefore meets the original sharp centered-error conditioning. The coarser independent inverse32/Y>=1/16 ledger additionally bounds all weighted jets byB^512*S^4.'};
}

function bindTargetPartitionPhase(G,bodies,p,target,ledger,point,ctx){
  const b=p.band,g=b.geometry,c=b.constants,{R,Z,T,v,theta}=b.coordinates,cut=p.point.slowCutoff,
    originalAxes=[...cut.meshAxes,cut.bandAxis],axes=originalAxes.map(axis=>fixedLabelSourcePartitionFactor(G,axis.offset)),
    axisChecks=axes.map((a,i)=>({id:'original-normalized-partition-axis-'+i,pass:['value','numerator','denominator'].every(k=>a[k]===originalAxes[i][k])&&
      same(a.bumps,originalAxes[i].bumps)&&same(a.relativeIndices,[-1,0,1])})),
    partitionJets=centeredSecondScalarJet(G,cut.body,point.directions),relativeJets=partitionJets.roots.map((x,j)=>G.div(G.mul(G.pow(point.values[0],partitionJets.indices[j][0]),point.at(x)),cut.value)),
    profileTargets=[p.support.outer.roots.outerTheta,p.support.outer.roots.outerScaledZ],profileTargetJets=profileTargets.map(x=>centeredSecondScalarJet(G,x,[p.support.coordinates.delta,p.support.coordinates.factorEta])),
    rawTargetJets=bodies.inverse.targetJets,normalizedTargetJets=rawTargetJets.map((row,j)=>row.map((x,i)=>G.div(G.mul(G.pow(point.values[0],bodies.inverse.indices[j][0]),point.at(x)),
      G.mul(i===0?p.roots.scales.Ac:c.u,p.roots.scales.tau)))),
    phase=physicalCenterOriginalPhaseJetAudit(G,{phase:p.physical.originalPhase,speed:b.families[0].phaseSpeed,p:b.families[0].carrier.p,pz:b.families[0].carrier.pz,
      x0:b.families[0].carrier.x0,epsilon:g.epsilon,R,Z,T,v,theta,xi:b.cutoffs.xi}),
    frozen=[g.ell,g.S,g.Q,g.epsilon,g.k,g.ci,g.Ls,c.Bnorm,c.u,c.Renv,p.roots.scales.Ac,p.roots.scales.tau,...b.families.flatMap(f=>[f.carrier.p,f.carrier.pz,f.carrier.x0])],
    frozenChecks=frozen.map(root=>({root,derivatives:point.directions.map(d=>G.derivative(root,d))})),checks=[...axisChecks,
      {id:'exact-original-four-factor-cutoff',pass:cut.body===G.mul(cut.bandAxis.value,...cut.meshAxes.map(x=>x.value))&&point.at(cut.body)===cut.value},
      {id:'new-selected-label-and-original-positive-domain',pass:p.point.pass&&p.point.checks.every(x=>x.pass)&&p.sourceBounds.audit.power===16384&&p.sourceBounds.audit.bits===16384&&
        p.point.otherSign.excluded&&p.physical.cutoffPlateau.pass&&ledger.partition.pass},
      {id:'full-original-target-kernels-and-new-positive-tau',pass:target.source.pass&&target.source.outerScaleBinding.pass&&target.source.sourceKernels.length===2&&
        target.source.sourceTargetIdentity.actualTargetTau===p.roots.scales.tau&&target.source.sourceTargetIdentity.fullTargetNodeReplaced===false&&
        target.source.roots.Ac===p.roots.scales.Ac&&ellOneSourceScalarIdentity(G,target.source.roots.Xb,p.support.endpoints.Xb).pass},
      {id:'all-original-profile-and-slow-target-derivatives',pass:profileTargetJets.every(x=>x.roots.length===6)&&rawTargetJets.length===10&&
        rawTargetJets.every(x=>x.length===2)&&normalizedTargetJets.flat().every(x=>G.freeCoordinates(x).size===0)&&ledger.primitive.target.pass},
      {id:'original-positive-normalizers-and-fixed-integer-labels',pass:frozenChecks.every(x=>x.derivatives.every(d=>d===G.zero))&&p.sourceBounds.pass},
      {id:'same-original-full-phase-before-four-direction-jets',pass:phase.pass&&phase.first.length===4&&phase.second.length===10&&
        bodies.physical.phase.body===p.physical.originalPhase&&bodies.physical.phase.originalBodyBound&&bodies.physical.phaseJets.first.length===4&&bodies.physical.phaseJets.second.length===10},
      {id:'angular-phase-Hessian-retains-length-squared-reserve',pass:ledger.phase.requiredSourcePhasePower.B===64&&ledger.phase.requiredSourcePhasePower.S===2&&
        bodies.physical.angular.pass&&bodies.physical.completeSpatialHessianWithDirectionBasisConnections},
      {id:'original-complete-potential-and-all-forty-two-curl-rows',pass:bodies.physical.pass&&bodies.physical.rows.length===42&&
        same(bodies.physical.shared,p.physical.shared)&&p.physical.bodyChecks.every(x=>x.pass)&&bodies.physical.directCurlChecks.every(x=>x.pass)&&bodies.physical.divergenceCheck.pass}];
  requireAll(checks,'An original target, partition, normalizer or phase premise failed');
  progress(ctx,'new-physical-jet-bound-original-target-partition-and-phase',G);
  return {checks,pass:true,axes,partitionJets,relativeJets,profileTargets,profileTargetJets,rawTargetJets,normalizedTargetJets,phase,frozenChecks,
    originalTarget:target.source,physicalScales:bodies.physical.scales,potential:p.physical.originalPotentialCoefficient,
    partitionBound:'The private point proof places every original mesh offset inside(-9/16,9/16), so each retained normalized factor>2^-18 and their product>2^-72. The full three-neighbor denominators and all repeated/mixed derivatives obey the independent exact partition recurrence. ell^6=S^3 costs are explicit. Original fast cutoffs are constant on their own open plateaus, with derivatives zero by their branch bodies.',
    targetBound:ledger.primitive.target,
    phaseBound:'Use the actual rounded angular carrier in Phi=p*theta+pz*Z/epsilon+x0*R-v*(pF+pzG). All R/Z/T derivatives are taken before the open G=0 identity. In particular F_ZZ is retained. pTilde=Rsharp*Bs*u/(Ls*gabs)>0 defines the original natural scales. Ls*pTilde and its reciprocal fit the finite Renv ledger. The angular Hessian has DrPhi/R, whose normalization costs Ls^2; the source phase reserve is B^64*S^2, not an unproved S^1 bound.',
    fullCurl:'The private body proof differentiates -C*sin(kPhi) before evaluating phase zero. It retains both coefficientCurl first derivatives, the original radial-fast connection, the angular vector connection and angular direction-Hessian connection. The finite C geometry ledger applies to the complete n cross weightedPulse/(k*n^2) times the original positive partition.'};
}

export function bindActualPhysicalCenterFullJetSourceBounds(bodies,slopes,target,ctx={}){
  const p=bodies?.physicalCenter;
  if(!p||slopes?.physicalCenter!==p||slopes.p!==p||target?.p!==p||slopes.G!==p.G||target.G!==p.G||bodies.G===p.G)
    fail('INVALID_SOURCE_CONSTRUCTION','The original body, slope and target predecessors must share the identical private new physical point.');
  assertActualPhysicalCenterFiniteJetBodies(bodies);assertActualPhysicalCenterSlowSlopeEnclosure(slopes);assertActualPhysicalCenterTargetEnclosure(target);
  const G=bodies.G,b=p.band,count=bodies.sourceBinding.originalCopiedPrefixNodeCount,originalCount=p.G.nodes.length,
    originalDefinitions=p.G.captureFunctionDefinitions(),originalNodes=canonicalStringify(p.G.nodes),
    external=[...Object.values(slopes.roots.mu),...Object.values(slopes.roots.nu),slopes.roots.originalFBody,slopes.roots.originalFRBody,
      ...Object.values(slopes.source.local.coordinates),...['h','gamma','density','variable','u','den','power','body'].map(k=>slopes.source.local.roots[k]),
      ...Object.values(target.source.roots).filter(x=>Number.isSafeInteger(x))],prefix=physicalCenterCopiedOperandAudit(G,p.G,count,external),
    directions=['R','Z','T'].map(k=>b.coordinates[k]),parameters=bodies.roots.parameters,values=bodies.roots.values,
    point={directions,parameters,values,at:body=>G.simultaneousSubstitute(body,parameters,values)},ledger=physicalCenterJetSourceBoundAudit(),
    field=bindField(G,p,slopes,ledger,point),conditioning=physicalCenterNumericalJetConditioning(p.numerics.values,p.request.precisionBits);
  progress(ctx,'new-physical-jet-bound-private-prefix-field-and-conditioning',G,{copiedPrefix:count});
  const reference=centeredWholeTimeReferenceFrameAudit(G),algebra={frame:centeredNormalizedFullFrameAudit(G),reference,
    slope:centeredWholeTimeSlowSlopeAudit(G),amplitudeReference:centeredNormalizedAmplitudeReferenceAudit(G,reference),
    slow:centeredSlowJetErrorAudit(),fast:centeredFastStabilityPowerAudit(),uncentered:centeredUncenteredJetErrorAudit()};
  progress(ctx,'new-physical-jet-bound-complete-reference-and-error-algebra',G);clearDisposableThirdJetCaches(G);
  const wholeTime=bindWholeTime(G,bodies,p,ledger,algebra,point,ctx),centering=bindCenterAndIntegrals(G,bodies,p,slopes,point,conditioning,ctx),
    geometry=bindTargetPartitionPhase(G,bodies,p,target,ledger,point,ctx),checks=[
      {id:'same-private-new-physical-source-and-copied-operands',pass:prefix.pass&&bodies.sourceBinding.sameOriginalPhysicalPointAndBand&&p.band===b},
      {id:'complete-original-field-on-expanded-new-neighborhood',pass:field.pass&&field.checks.every(x=>x.pass)},
      {id:'whole-original-time-matrix-amplitude-and-auxiliary-jets',pass:wholeTime.pass&&wholeTime.rows.length===2&&wholeTime.rows.every(x=>x.sourceChecks.every(c=>c.pass))},
      {id:'actual-dynamic-centers-whole-H-inverse-and-half-pulse-FTC',pass:centering.pass&&centering.covarianceChecks.length===40&&conditioning.pass&&bodies.inverse.pass},
      {id:'actual-full-target-partition-phase-and-curl-premises',pass:geometry.pass&&geometry.checks.every(x=>x.pass)},
      {id:'finite-source-implication-and-all-sharp-error-kernels',pass:ledger.pass&&Object.values(algebra).every(x=>x.pass)},
      {id:'all-original-228-plus42-finite-derivative-bodies-retained',pass:bodies.rows.length===228&&bodies.physical.rows.length===42&&
        bodies.rows.every(x=>x.bodyDerivativeBinding)&&bodies.physical.rows.every(x=>x.bodyDerivativeBinding)},
      {id:'predecessor-graph-and-definitions-never-mutated',pass:p.G.nodes.length===originalCount&&canonicalStringify(p.G.nodes)===originalNodes&&p.G.functionDefinitionsUnchanged(originalDefinitions)}];
  requireAll(checks,'The actual new-point full-jet numerical premise binding failed');
  const roots={B:b.constants.Bnorm,S:b.geometry.S,L:b.geometry.Ls,h:b.constants.h,Renv:b.constants.Renv,
    originalH:b.target.H,originalWeights:b.target.weights,originalSquareRoots:b.target.squareRootWeights,
    newPoint:values,actualMu:slopes.roots.mu,actualNu:slopes.roots.nu,actualTargetTau:target.source.roots.tau,
    actualPhase:p.physical.originalPhase,actualPotential:p.physical.originalPotentialCoefficient,
    actualDerivativeValues:[...bodies.rows.map(r=>r.atPoint),...bodies.physical.rows.map(r=>r.physicalValue)]},
    proof={source:'Every actual bound consumes the same privately authenticated physical center, original common band, raw matrix/field/target roots, whole integrals and independently generated coupled20-component variations. Copied-prefix node bytes are checked before reading appended slope or target roots. Generic ledgers alone never confer source authority.',
      finitePowers:{sourcePremises:ledger.sourcePremises,field:field.primitiveConversion,wholeTime:wholeTime.finiteAuxiliaryProof,partition:geometry.partitionBound,
        target:geometry.targetBound,phase:geometry.phaseBound},
      sharpErrors:{wholeReference:algebra.reference,completeSlowComparison:algebra.slope,slow:algebra.slow,fast:algebra.fast,uncentered:algebra.uncentered,
        actualConditioning:conditioning,wholeInitialLayer:wholeTime.coneAndInitialLayer,slope:centering.slopeError,
        conclusion:'The actual source B>=2^128,S>=B^1024 and tiny positive auxiliary errors give the same strict2^-600 sharp normalized reserves used by the new-point228-row kernel. The fixed2^-560 final coefficient radius also contains its directed arithmetic and the private mu/nu comparison-transfer error. No actual old-point Volterra jet is transferred.'},
      physical:geometry.fullCurl,
      physicalFrequency:'The same positive original frequency gives k^-1<sqrt(epsilon)<epsilon^(1/200000). Its original source audit proves epsilon^(1/200000)*S^16384<2^-16384. Complete first/second pulse, partition, normal and phase products consume only the printed B/S powers (including angular S^2), so every suppressed full-curl term is inside the positive2^-512 physical coefficient radius.',
      limits:'This binds finite numerical error premises for the270 displayed derivative coefficients at this actual source point. Remaining closed numerical endpoints of selector/palette/physical scales have their own arithmetic proof. No all-label pointwise numerical claim, M2 gate change or M3 conclusion follows from this adapter alone.'};
  const diagnostics=physicalCenterSelectorSourceDiagnostics(G,p);
  progress(ctx,'new-physical-jet-source-enclosure-bounds-complete',G,{checks:checks.length});
  return {schema:'MathScope.ActualPhysicalCenterFullJetSourceBounds/1',pass:true,sourceAuthenticated:true,checks,roots,prefix,ledger,field,conditioning,
    algebra,wholeTime,centering,geometry,proof,diagnostics,scope:{samePrivatePhysicalPoint:true,completeOriginalDerivativeBodies:true,
      original270FiniteDerivativeErrorPremises:true,actualOldPointJetsTransplanted:false,originalInitialLayerDiscarded:false,wholeGNUMComplete:false,M3Started:false}};
}
