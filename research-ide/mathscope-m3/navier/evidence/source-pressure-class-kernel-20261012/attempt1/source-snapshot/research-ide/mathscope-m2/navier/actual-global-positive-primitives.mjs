/** Actual positive-order mass/pressure primitives, including their joins.
 *
 * This is an additive audit of the unchanged coefficient constructor. The
 * complete original fields, continuous bump moments and pressure history
 * are operands. No derivative, moment or forcing can be supplied by a user.
 * The pressure identity proved here is Pi_n,X=the ORIGINAL independently
 * constructed pressureDerivative (n>=2). Its identification with the full
 * global centrifugal/Omega convolution is a separate, exposed obligation.
 */
import {prepareActualOrderInduction,assertActualOrderInduction} from './actual-residual-order-induction-source.mjs';
import {actualSupportOrderProof,checkActualExteriorZeros} from './actual-continuation-exact-support.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {buildActualOmegaCoefficientOverX} from './actual-continuation-exact-order-two-source.mjs';
import {sourceAllOrderCutoffJets} from './actual-residual-order-induction-kernels.mjs';
import {reduceLiteralZeroDerivatives} from './actual-strengthened-background-kernels.mjs';
import {explicitPrimitiveBodyIdentity,matchExplicitPrimitiveDensity,originalRadialBumpPrimitiveIdentities,originalEvenAveragePrimitiveIdentity} from './actual-global-primitive-kernels.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const live=new WeakMap();
const data=r=>({request:r.request,source:r.source,rows:r.rows,sourceSupport:r.sourceSupport,
  sourceLeadingExterior:r.sourceLeadingExterior,generic:r.generic,remaining:r.remaining,scope:r.scope,roots:r.roots});
const body=(G,id)=>{
  const n=G.nodes[id];if(n.op!=='actual_expression_partial'||n.args[2].some(x=>x))return id;
  return body(G,G.materializeExpressionFunction(n.args[0],n.args[1],n.args[2]));
};
const requirePass=(check,message)=>{if(!check.pass)fail('INTERNAL_VALIDATION',message);return check;};

/** Locate outer literal primitives without traversing an eta-only debt or
 * pretending the compact support of an integrand makes its integral zero.
 */
function primitivesWithRight(G,root,X,right){
  const found=[],seen=new Set();
  const visit=id=>{
    if(seen.has(id)||!G.dependsOn(id,X))return;seen.add(id);id=body(G,id);
    const {op,args}=G.nodes[id];
    if(op==='definite_integral'){if(args[3]===right)found.push(id);return;}
    if(op==='smooth_piecewise')args.slice(3).forEach(visit);
    else if(['add','multiply','inverse','sqrt_positive','exp','log_positive'].includes(op))args.forEach(visit);
    else if(op==='integer_power')visit(args[0]);
  };visit(root);return [...new Set(found)];
}

function literalFTC(G,primitive,X,expectedDensity,{atomicNodes=[]}={}){
  const n=G.nodes[primitive];if(n.op!=='definite_integral')fail('INVALID_SOURCE_CONSTRUCTION','The original literal primitive is required.');
  const [integrand,variable,left,right]=n.args;
  if(G.dependsOn(left,X)||G.dependsOn(integrand,X))fail('INVALID_SOURCE_CONSTRUCTION','This primitive FTC requires the source fixed lower endpoint and an X-independent bound integrand.');
  const derivative=G.derivative(primitive,X),reduction=reduceLiteralZeroDerivatives(G,derivative,{atomicNodes}),
    endpoint=G.substitute(integrand,variable,right),expected=G.mul(endpoint,G.derivative(right,X)),
    check=requirePass(explicitPrimitiveBodyIdentity(G,reduction.value,expected,{atomicNodes}),'A literal source primitive lost its FTC endpoint term.'),
    densityCheck=requirePass(explicitPrimitiveBodyIdentity(G,endpoint,expectedDensity,{atomicNodes}),'The actual primitive endpoint density did not match its retained source body.');
  return {primitive,integrand,variable,left,right,derivative,reduction,endpoint,expected,check,densityCheck,
    fixedLowerEndpoint:true,callerDerivativeUsed:false,compactPrimitiveSetToZero:false};
}

/** The only selections here are X<Xkeep for POSITIVE coefficient tuples.
 * The endpoint ordering is supplied by the private actual source proof.
 * Leading functions and Omega are not simplified by an unproved rule.
 */
function restrictPositiveCore(G,id,prepared,{atomicNodes=[]}={}){
  const {X}=prepared.bootstrap.constants,r=prepared.bootstrap.orderOne,atoms=new Set(atomicNodes),cache=new Map(),trace=[];
  const afterCore=new Set([r.Xkeep,r.Xcut,r.X0,r.IposRight,r.Xplus,prepared.bootstrap.inner.aSquared,
    G.mul(r.X0,G.pow(r.supports[1][1],2))]);
  const visit=v=>{
    if(atoms.has(v)||!G.dependsOn(v,X))return v;if(cache.has(v))return cache.get(v);
    const original=v;v=body(G,v);const{op,args}=G.nodes[v];let out=v;
    if(op==='smooth_piecewise'&&args[0]===X&&afterCore.has(args[1])){
      out=visit(args[3]);trace.push({root:v,left:args[1],selected:'before',body:args[3]});
    }else if(op==='add')out=G.add(...args.map(visit));
    else if(op==='multiply')out=G.mul(...args.map(visit));
    else if(op==='inverse')out=G.inv(visit(args[0]));
    else if(op==='integer_power')out=G.pow(visit(args[0]),args[1]);
    cache.set(original,out);return out;
  };
  return {original:id,value:visit(id),trace,domain:[G.zero,r.Xkeep],leadingRestrictionAssumed:false};
}

function sourcePicardPrimitiveRows(G,record,prepared){
  const {X,eta}=prepared.bootstrap.constants,q=(n,d=1)=>G.q(n,d),s=G.picardSystems[record.raw.system],xi=s.xi;
  const averageRows={diagonalU:s.diagonal[1]===0,diagonalK:s.diagonal[2]===2,
    Uxi:s.A0[1].every((v,j)=>v===(j===5?G.one:G.zero)),
    Kxi:s.A0[2].every((v,j)=>v===(j===5?q(-1):G.zero)),
    noEtaSource:[...s.A1[1],...s.A1[2],s.forcing[1],s.forcing[2]].every(v=>v===G.zero)};
  if(!Object.values(averageRows).every(Boolean))fail('INVALID_SOURCE_CONSTRUCTION','The actual U/K Picard rows no longer implement the average primitive equation.');
  const pKnown=record.order===1?G.mul(q(-1,2),record.raw.omegaOverX):record.raw.pKnown,
    F0=prepared.records[0].actual.F,atXi=f=>G.substitute(f,X,G.pow(xi,2)),
    pressureRow=requirePass(explicitPrimitiveBodyIdentity(G,s.A0[3][0],G.mul(q(4),xi,atXi(F0))),'The original pressure Picard row changed.'),
    pressureForcing=requirePass(explicitPrimitiveBodyIdentity(G,s.forcing[3],G.mul(q(2),xi,atXi(pKnown))),'The actual pressure forcing is not the complete retained pKnown.'),
    noOtherPressureTerm=s.diagonal[3]===0&&s.A0[3].slice(1).every(v=>v===G.zero)&&s.A1[3].every(v=>v===G.zero),
    corePressureDensity=G.add(G.mul(q(2),F0,record.raw.F),pKnown);
  if(!noOtherPressureTerm)fail('INVALID_SOURCE_CONSTRUCTION','An original pressure Picard derivative term would be omitted.');
  return {system:record.raw.system,xi,X,eta,averageRows,pressureRow,pressureForcing,noOtherPressureTerm,pKnown,corePressureDensity,
    zeroAxisDatum:s.zeroAxisDatum??[0,0,0,0,0,0],
    statements:['xi*K_xi=-2*K-xi*U_xi, hence d_X[X*(U+K)]=U.','Pi_xi=4*xi*F0*Fn+2*xi*pKnown; X=xi^2 gives Pi_X=2*F0*Fn+pKnown.'],
    equationSource:'The original internally generated six-component Picard matrix, forcing and zero axis data.',pass:true};
}

function buildOne(G,prepared,n,generic,context){
  const record=prepared.records[n],g=record.global,r=prepared.bootstrap.orderOne,{X,eta}=prepared.bootstrap.constants,
    q=(n,d=1)=>G.q(n,d),z=G.zero,{Xkeep,Xcut,Xplus,X0,IposRight,Rbase,ef,supports,Umat,Emat}=r,
    R=G.sqrt(G.mul(q(2),X)),u=G.div(R,Rbase),p=G.sub(q(-2),G.mul(q(2),G.parameter('lambda'))),
    power=(v,e)=>G.exp(G.mul(e,G.log(v))),width=q(1,2048),bump=(s,j)=>G.div(G.step(G.div(G.sub(s,supports[j][0]),width),1),width),
    Ft=record.actual.F,Ut=record.actual.U,atoms=[...g.alpha,...g.beta,...g.localMoments,ef,Rbase],
    integrate=(f,a,b,name)=>{const t=G.fresh(name),shared=G.share(f,[X,eta],name+'_explicit_body');return G.integral(G.substitute(shared,X,t),t,a,b);};
  context.onProgress?.({phase:'positive-primitive-start',order:n,nodes:G.nodes.length});
  const picard=sourcePicardPrimitiveRows(G,record,prepared),M=body(G,g.M),Mn=G.nodes[M];
  context.onProgress?.({phase:'positive-primitive-picard-bound',order:n,nodes:G.nodes.length});
  if(Mn.op!=='smooth_piecewise'||Mn.args[0]!==X||Mn.args[1]!==Xkeep||Mn.args[5]!==z)fail('INVALID_SOURCE_CONSTRUCTION','The original mass primitive branches changed.');
  const lastU=G.mul(X0,G.pow(supports[1][1],2));
  if(Mn.args[2]!==lastU)fail('INVALID_SOURCE_CONSTRUCTION','The original last axial bump endpoint changed.');
  const prefix=integrate(Ut,z,X,'positive_mass_'+n),localMass=G.choose(X,Xkeep,Xcut,prefix,prefix,g.localMoments[0]),
    massBumps=g.alpha.map((a,j)=>{const t=G.fresh('positive_mass_bump_'+n+'_'+j);return {j,coefficient:a,
      primitive:G.integral(G.mul(t,bump(t,j)),t,supports[j][0],u),total:Umat[0][j],density:G.mul(u,bump(u,j))};}),
    correctionMass=G.mul(Rbase,G.add(...massBumps.map(b=>G.mul(b.coefficient,G.choose(u,...supports[b.j],z,b.primitive,b.total))))),
    massMiddle=G.add(localMass,correctionMass),
    massBodyCheck=requirePass(explicitPrimitiveBodyIdentity(G,Mn.args[4],massMiddle,{atomicNodes:atoms}),'The original whole mass primitive differs from its local-plus-bump reconstruction.');
  const originalMassPrefixes=primitivesWithRight(G,Mn.args[4],X,X);
  if(originalMassPrefixes.length!==1)fail('INVALID_SOURCE_CONSTRUCTION','Locate the one original local mass prefix before its correction.');
  const localMassFTC=literalFTC(G,originalMassPrefixes[0],X,Ut,{atomicNodes:atoms}),
    originalMassBumps=primitivesWithRight(G,Mn.args[4],X,u);
  if(originalMassBumps.length!==2)fail('INVALID_SOURCE_CONSTRUCTION','The original mass primitive requires both continuous radial bumps.');
  const bumpMassRows=massBumps.map((b,j)=>{
    const primitive=matchExplicitPrimitiveDensity(G,originalMassBumps,b.density,{atomicNodes:atoms});
    const check=literalFTC(G,primitive,X,massBumps[j].density,{atomicNodes:atoms}),
      derivative=G.mul(Rbase,g.alpha[j],check.reduction.value),expected=G.div(G.mul(g.alpha[j],bump(u,j)),Rbase),
      jacobian=requirePass(sourceGraphRationalIdentity(G,G.sub(derivative,expected),{atomicNodes:[...atoms,bump(u,j)]}),'The genuine mass bump lost the dX=R dR Jacobian.');
    return {...check,j,coefficient:g.alpha[j],derivative,expected,jacobian,total:Umat[0][j]};
  });
  const coreU=restrictPositiveCore(G,g.U,prepared),coreF=restrictPositiveCore(G,g.F,prepared),
    coreUCheck=requirePass(explicitPrimitiveBodyIdentity(G,coreU.value,record.raw.U),'The actual positive U does not restrict to its original core.'),
    coreFCheck=requirePass(explicitPrimitiveBodyIdentity(G,coreF.value,record.raw.F),'The actual positive F does not restrict to its original core.');
  let coreMass;
  if(n===1){
    const t=G.fresh('positive_n1_average_check'),avg=G.integral(G.substitute(record.raw.U,X,G.mul(t,X)),t,z,G.one),expected=G.mul(X,avg),
      check=requirePass(explicitPrimitiveBodyIdentity(G,Mn.args[3],expected),'The n=1 core mass is not its original integral average.');
    coreMass={kind:'literal-average-change-of-variable',check,sourceAverage:Mn.args[3],
      identity:'X*integral_0^1 U_1(tX,eta)dt=integral_0^X U_1(s,eta)ds, with the continuous X=0 limit.'};
  }else coreMass={kind:'original-Picard-U-K-row',check:requirePass(explicitPrimitiveBodyIdentity(G,Mn.args[3],G.mul(X,record.raw.average)),'The original core mass does not use its genuine U+K average.'),sourceAverage:record.raw.average,genericRule:generic.average.schema};
  const massIncoming=requirePass(explicitPrimitiveBodyIdentity(G,g.incoming[0],g.localMoments[0],{atomicNodes:g.localMoments}),'The mass join debt does not equal the actual local mass.'),
    massTotal=G.add(g.incoming[0],G.mul(Rbase,G.add(...g.alpha.map((a,j)=>G.mul(a,Umat[0][j]))))),
    massJoin=requirePass(sourceGraphRationalIdentity(G,massTotal,{atomicNodes:g.incoming}),'The actual total mass must cancel before closing the zero branch.');
  const mass={source:g.M,sourceU:g.U,sourceAverage:g.average,branches:[Xkeep,lastU],massBodyCheck,localMassFTC,bumpMassRows,coreMass,massIncoming,massTotal,massJoin,
    theorem:'For the original completed positive coefficient, partial_X M_n=U_n on X>=0, with one-sided axis derivative and eta endpoints.',
    joins:{atXkeep:'Both branches are the zero-axis primitive of the SAME raw U before the unchanged flat kappa cutoff.',
      atXcut:'The local primitive equals the stored complete local mass; all jets agree because the original cutoff has flat endpoint jets.',
      atEveryBump:'The literal partial integral equals the retained full Umat moment at its right endpoint; derivative jets are flat.',
      atLastU:'The actual first moment equation is zero; U has ended in an open collar, so the final zero branch has every derivative jet.'},
    numericalIntegralEvaluation:false,pass:true};
  context.onProgress?.({phase:'positive-primitive-mass-bound',order:n,nodes:G.nodes.length});

  let pressure;
  if(n===1){
    pressure={source:g.Pi,sourcePressureDerivative:g.pressureDerivative,pass:false,
      status:'ACTUAL_LEADING_OMEGA_PRIMITIVE_BINDING_REQUIRED',
      reason:'The original order-one pressure uses the integrated leading Omega formula. Its derivative requires the genuine global leading mass identity; this module does not assume it.'};
  }else{
    const Pi=body(G,g.Pi),Pn=G.nodes[Pi];
    if(Pn.op!=='smooth_piecewise'||Pn.args[0]!==X||Pn.args[1]!==Xkeep||Pn.args[2]!==Xplus||Pn.args[3]!==record.raw.Pi||Pn.args[5]!==z)
      fail('INVALID_SOURCE_CONSTRUCTION','The original n>=2 pressure branches changed.');
    const localBody=G.mul(q(2),prepared.records[0].actual.F,Ft),localPrefix=integrate(localBody,z,X,'positive_pressure_'+n),
      localPressure=G.choose(X,Xkeep,Xcut,localPrefix,localPrefix,g.localMoments[2]),Rp=power(Rbase,p),
      pressureBumps=g.beta.map((b,j)=>{const t=G.fresh('positive_pressure_bump_'+n+'_'+j);return {j,coefficient:b,
        primitive:G.integral(G.mul(power(t,p),bump(t,j+2)),t,supports[j+2][0],u),total:Emat[1][j],density:G.mul(power(u,p),bump(u,j+2))};}),
      correctionPressure=G.mul(q(2),ef,Rp,G.add(...pressureBumps.map(b=>G.mul(b.coefficient,G.choose(u,...supports[b.j+2],z,b.primitive,b.total))))),
      lowerPrefix=integrate(g.lowerPressure,z,X,'positive_lower_pressure_'+n),middle=G.add(localPressure,correctionPressure,lowerPrefix),
      bodyCheck=requirePass(explicitPrimitiveBodyIdentity(G,Pn.args[4],middle,{atomicNodes:[...atoms,g.lowerPressure]}),'The original pressure primitive omitted or changed one source history.');
    context.onProgress?.({phase:'positive-primitive-pressure-body-bound',order:n,nodes:G.nodes.length});
    const originalPrefixes=primitivesWithRight(G,Pn.args[4],X,X);
    if(originalPrefixes.length!==2)fail('INVALID_SOURCE_CONSTRUCTION','The pressure needs its local and whole lower-order literal prefixes.');
    // The graph canonicalizes commutative addition, so operand traversal
    // order is not the semantic local/lower-history order.
    const localPrimitive=matchExplicitPrimitiveDensity(G,originalPrefixes,localBody,{atomicNodes:atoms}),
      lowerPrimitive=matchExplicitPrimitiveDensity(G,originalPrefixes,g.lowerPressure,{atomicNodes:[...atoms,g.lowerPressure]}),
      localFTC=literalFTC(G,localPrimitive,X,localBody,{atomicNodes:atoms}),
      lowerFTC=literalFTC(G,lowerPrimitive,X,g.lowerPressure,{atomicNodes:[...atoms,g.lowerPressure]}),
      originals=primitivesWithRight(G,Pn.args[4],X,u);
    if(originals.length!==3)fail('INVALID_SOURCE_CONSTRUCTION','The original pressure must retain all three continuous angular bumps.');
    const bumpRows=pressureBumps.map((b,j)=>{
      const primitive=matchExplicitPrimitiveDensity(G,originals,b.density,{atomicNodes:atoms});
      const ftc=literalFTC(G,primitive,X,pressureBumps[j].density,{atomicNodes:atoms}),
        coefficient=G.mul(q(2),ef,Rp,g.beta[j]),derivative=G.mul(coefficient,ftc.reduction.value),
        factoredExpected=G.div(G.mul(coefficient,power(u,p),bump(u,j+2)),G.mul(Rbase,R)),
        jacobian=requirePass(sourceGraphRationalIdentity(G,G.sub(derivative,factoredExpected),{atomicNodes:[...atoms,Rp,power(u,p),bump(u,j+2)]}),'The genuine pressure bump has an incorrect radial derivative.');
      return {...ftc,j,coefficient,derivative,factoredExpected,jacobian,total:Emat[1][j],
        positivePowerIdentity:{left:G.mul(Rp,power(u,p)),right:power(R,p),exponent:p,
          sourceRbase:Rbase,sourceNormalizedR:u,reason:generic.bump.positiveRealPowerRule,condition:'X>0 and original X0Ipos>0',finiteExponentSubstitution:false}};
    });
    const lowerCore=restrictPositiveCore(G,g.lowerPressure,prepared,{atomicNodes:[record.raw.omegaOverX]}),
      knownCore=restrictPositiveCore(G,record.raw.pKnown,prepared,{atomicNodes:[record.raw.omegaOverX]}),
      coreLowerCheck=requirePass(sourceGraphRationalIdentity(G,G.sub(lowerCore.value,knownCore.value),{atomicNodes:[record.raw.omegaOverX,...prepared.records.slice(1,n).map(r=>r.raw.F)]}),'The pressure core join does not use the same complete lower-order density.');
    const F0=prepared.records[0].actual.F,F0pos=G.mul(ef,power(R,p)),dF=g.dF,
      sourceSplit=G.add(G.choose(X,Xkeep,Xcut,G.mul(F0,record.raw.F),G.mul(F0,Ft),z),G.choose(X,X0,IposRight,z,G.mul(F0pos,dF),z)),
      splitCheck=requirePass(explicitPrimitiveBodyIdentity(G,g.F0Fn,sourceSplit,{atomicNodes:[F0,Ft,dF,record.raw.F,F0pos]}),'The independently constructed original F0*Fn split changed.'),
      derivativeCheck=requirePass(sourceGraphRationalIdentity(G,G.sub(g.pressureDerivative,G.add(G.mul(q(2),g.F0Fn),g.lowerPressure)),{atomicNodes:[g.F0Fn,g.lowerPressure]}),'The original independent pressureDerivative changed.'),
      incomingReconstruction=G.add(g.localMoments[2],integrate(g.lowerPressure,z,Xplus,'positive_total_pressure_'+n)),
      incomingCheck=requirePass(explicitPrimitiveBodyIdentity(G,g.incoming[2],incomingReconstruction,{atomicNodes:[...g.localMoments,g.lowerPressure]}),'The pressure zero join lost its full lower-support integral.'),
      total=G.add(g.incoming[2],G.mul(q(2),ef,Rp,G.add(...g.beta.map((b,j)=>G.mul(b,Emat[1][j]))))),
      joinCheck=requirePass(sourceGraphRationalIdentity(G,total,{atomicNodes:g.incoming}),'The original complete pressure moment does not cancel at the zero join.');
    pressure={source:g.Pi,sourcePressureDerivative:g.pressureDerivative,bodyCheck,localFTC,lowerFTC,bumpRows,
      core:picard,lowerCore,knownCore,coreLowerCheck,splitCheck,derivativeCheck,incomingCheck,total,joinCheck,
      theorem:'partial_X Pi_n equals the original independently compiled pressureDerivative for every generated n>=2.',
      joins:{atXkeep:'The actual lower density restricts to the SAME Picard pKnown; zero axis data fix the common primitive constant.',
        atBumpsAndLocalCutoff:'The retained full matrix moments equal the corresponding literal complete integrals; original sigma_2 jets are flat.',
        atXplus:'The actual third moment is zero. Lower U/v and all positive F have ended strictly earlier, so the density vanishes in an open collar before Xplus.'},
      fullGlobalRadialEquationIdentified:false,pass:true};
  }
  // This is the unresolved DIFFERENCE, assembled independently from every
  // original global pair. It is not silently assigned zero by a flag.
  const lower=prepared.records.slice(0,n).map(r=>r.global),Omega=buildActualOmegaCoefficientOverX(G,{order:n-1,X,eta,U:lower.map(r=>r.U),v:lower.map(r=>r.v)}).value,
    pairs=Array.from({length:n+1},(_,i)=>[i,n-i]),fullCentrifugal=G.add(...pairs.map(([i,j])=>G.mul(prepared.records[i].global.F,prepared.records[j].global.F))),
    fullRadialDensity=G.sub(fullCentrifugal,G.mul(q(1,2),Omega)),remainingDifference=G.sub(g.pressureDerivative,fullRadialDensity);
  context.onProgress?.({phase:'positive-primitive-complete',order:n,nodes:G.nodes.length});
  return {order:n,picard,coreU,coreF,coreUCheck,coreFCheck,mass,pressure,
    fullPressureComparison:{sourcePressureDerivative:g.pressureDerivative,pairs,fullCentrifugal,globalOmega:Omega,fullRadialDensity,remainingDifference,
      identified:false,remaining:['Bind full leading F0 to its original common-core representative and reserved-power Ipos representative.',
        'Bind full leading M0_X=U0 and global/core v0; then transfer the raw/core Omega branch to the same global Omega.'],
      allOrderedPairsIncluded:true,differenceSetToZero:false}};
}

export function attachActualGlobalPositivePrimitives(prepared,input={},context={}){
  assertActualOrderInduction(prepared);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='throughOrder'))fail('INVALID_INPUT','Only the already-generated positive prefix length may be selected.');
  const throughOrder=input.throughOrder??prepared.order;
  if(!Number.isSafeInteger(throughOrder)||throughOrder<1||throughOrder>prepared.order)fail('INVALID_INPUT','Generate the complete requested original positive prefix first.');
  const {G,bootstrap}=prepared,sourceSupport=actualSupportOrderProof(bootstrap.completedOrderOne),
    sourceLeadingExterior=checkActualExteriorZeros(bootstrap.G,[bootstrap.finalU,bootstrap.finalv],sourceSupport),
    generic={bump:originalRadialBumpPrimitiveIdentities(),average:originalEvenAveragePrimitiveIdentity(),cutoff:sourceAllOrderCutoffJets({order:2},context)};
  if(!sourceLeadingExterior.pass)fail('INVALID_SOURCE_CONSTRUCTION','The actual leading U/v exterior is required for the pressure zero collar.');
  const rows=[];for(let n=1;n<=throughOrder;n++){context.checkCancelled?.();rows.push(buildOne(G,prepared,n,generic,context));}
  const roots={};for(const row of rows){roots['n'+row.order+'_M']=row.mass.source;roots['n'+row.order+'_Pi']=row.pressure.source;
    roots['n'+row.order+'_originalPressureDerivative']=row.pressure.sourcePressureDerivative;roots['n'+row.order+'_unclosedFullPressureDifference']=row.fullPressureComparison.remainingDifference;}
  const result={G,prepared,request:{throughOrder},source:{profileId:bootstrap.program.profileId,parameterExpressionSHA256:bootstrap.program.parameterExpressionSHA256,
    originalConstructor:'actual-residual-order-induction-source.mjs:prepareActualOrderInduction / completeOrder',originalOrderOne:'actual-continuation-exact-order-one.mjs:attachActualFirstOrderExtension'},
    rows,sourceSupport,sourceLeadingExterior,generic,roots,
    remaining:['The original leading M0 primitive and n=1 Omega primitive still need their full source binding.',
      'The explicit full pressure-convolution differences are not declared zero.',
      'Conservative total tangential residuals, all-order physical flatness, and Lean kernel proof remain separate.'],
    scope:{actualPositiveMassPrimitiveIdentity:true,actualHigherPositivePressurePrimitiveIdentity:throughOrder>=2,
      actualOrderOnePressurePrimitiveIdentity:false,actualGlobalFullPressureConvolutionIdentity:false,
      sourceBodiesAndFullContinuousMomentsPreserved:true,callerSuppliedDerivativeOrDebt:false,
      allOrderPositivePrimitiveSchemaDescribed:true,allRequestedOrdersExecuted:throughOrder,
      wholeGN4Complete:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,newLeanKernelProof:false,m3MayStart:false}};
  const packed=G.pack(roots,{schema:'MathScope.ActualGlobalPositivePrimitivesProgram/1',...data(result)}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  live.set(result,{G,prepared,nodes:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result)),program:canonicalStringify(result.program)});
  return result;
}

export function prepareActualGlobalPositivePrimitives(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','order','maxNodes','maxDerivativeOrder'].includes(k)))
    fail('INVALID_INPUT','Only original source and finite construction budgets are accepted.');
  return attachActualGlobalPositivePrimitives(prepareActualOrderInduction({sourceProfile:input.sourceProfile,order:input.order??2,maxNodes:input.maxNodes??2000000,maxDerivativeOrder:input.maxDerivativeOrder??128},context),{},context);
}

export function assertActualGlobalPositivePrimitives(result){
  const seal=live.get(result);
  if(!seal||result.G!==seal.G||result.prepared!==seal.prepared||canonicalStringify(data(result))!==seal.data||canonicalStringify(result.program)!==seal.program||
    canonicalStringify(seal.G.nodes.slice(0,seal.nodes))!==seal.prefix||!seal.G.functionDefinitionsUnchanged(seal.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally constructed positive primitive certificate.');
  assertActualOrderInduction(seal.prepared);return true;
}

export async function actualGlobalPositivePrimitivesCertificateFromProgram(result){
  assertActualGlobalPositivePrimitives(result);const encoded=canonicalStringify(result.program);
  return {schema:'MathScope.ActualGlobalPositivePrimitivesCertificate/1',...data(result),graph:{sha256:await sha256(encoded),nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length},
    semantics:'Exact original function primitives and executed algebra/FTC rules. Displayed finite numerical values are not used to establish these equalities.'};
}
