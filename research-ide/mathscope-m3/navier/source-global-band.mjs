/** Additive M3 compiler of the original common-band family.
 * Every integer window has its own complete active background prefix.
 * The fixed band is a declared parameter of the actual frame, Volterra
 * solution and H; one selected H is never copied to other labels.
 *
 * This is a source-bound PARAMETRIC compiler, not yet a certificate of a
 * complete global representative selection, radial sum or N6-04. All M2
 * private authenticators remain unchanged; this module issues its own seal.
 */
import {assertActualCommonAdmissibleFamily,actualCommonAdmissibleFamilyCertificate,prepareActualCommonAdmissibleFamily} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {GlobalSourceExpressions} from './source-global-expressions.mjs';
import {actualMovingPulseFrame,covarianceMatrixAlgebra} from '../../mathscope-m2/navier/actual-covariance-matrix.mjs';
import {covarianceConcentrationRecipe} from '../../mathscope-m2/navier/actual-covariance-concentration.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {originalBandWindowExpressions} from './global-source-index.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const metadata=p=>({schema:p.schema,request:p.request,sourceBinding:p.sourceBinding,window:p.window,coordinates:p.coordinates,
  constants:p.constants,geometry:p.geometry,chart:p.chart,fields:p.fields,leadingFields:p.leadingFields,frozen:p.frozen,
  meshLabels:p.meshLabels,background:p.background,cutoffs:p.cutoffs,families:p.families,target:p.target,bounds:p.bounds,
  quantitative:p.quantitative,parameters:p.parameters,checks:p.checks,roots:p.roots,scope:p.scope});

/** Share append-only source node objects; retain separate arrays, intern
 * tables, definitions and all disposable caches. No source node is edited.
 * The private upstream prefix and the new graph are checked separately.
 * This avoids a second deep clone of hundreds of thousands of immutable
 * scalar nodes before any actual new mathematical expression is appended.
 */
export class SharedGlobalSourceExpressions extends GlobalSourceExpressions {}

function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['coefficientOrder','maxNodes'].includes(k)))
    fail('INVALID_INPUT','Only the active coefficient window and a finite node budget may be selected. Original constants, H and positive weights are not inputs.');
  const coefficientOrder=input.coefficientOrder??1,maxNodes=input.maxNodes??3500000;
  if(!Number.isSafeInteger(coefficientOrder)||coefficientOrder<0||coefficientOrder>32)
    fail('RESOURCE_LIMIT','Use an exact finite coefficient window in 0..32 and construct its genuine selector prefix first.');
  if(!Number.isSafeInteger(maxNodes)||maxNodes<1||maxNodes>4000000)
    fail('RESOURCE_LIMIT','Use a finite new M3 graph budget at most four million nodes.');
  return {coefficientOrder,maxNodes};
}

function timeCutoff(G){
  const x=G.fresh('common_band_time_cutoff_argument'),z=G.sub(G.mul(G.q(2),x),G.one),a=G.exp(G.neg(G.inv(z))),b=G.exp(G.neg(G.inv(G.sub(G.one,z)))),
    body=G.choose(x,G.q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero),
    system=G.defineExpressionFunction({name:'CommonOriginalTimeCutoff',parameters:[x],body,derivativeLimits:[G.maxDerivativeOrder??128]});
  return {x,body,system,source:'chi(x)=1-sigma_1(2*x-1), with sigma_1 made from exp(-1/x).'};
}
function fastCutoffs(G,v,Ls,r0){
  const q=(n,d=1)=>G.q(n,d),xi=G.fresh('common_band_transverse_xi'),a=G.sqrt(G.pow(G.div(xi,r0),2)),
    chi=G.choose(a,q(1,4),q(3,4),G.one,G.step(G.sub(q(3,2),G.mul(q(2),a))),G.zero),
    transverseMass=G.integral(G.pow(chi,2),xi,G.neg(r0),r0),
    psi=G.mul(G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls))));
  return {xi,chi,transverseMass,psi,transverseMassBounds:[G.div(r0,q(2)),G.mul(q(2),r0)],longitudinalPlateau:['Ls/4','3Ls/4'],actualOriginalCutoffs:true};
}

export function attachGlobalSourceBand(family,input={},context={}){
  assertActualCommonAdmissibleFamily(family);const request=requestOf(input),activeOrder=request.coefficientOrder;
  if(family.selector.rows.length<activeOrder+1||family.prepared.order<activeOrder||family.source.background.cutoffs.rows.length<activeOrder+1)
    fail('RESOURCE_LIMIT','Construct the actual source coefficient prefix and common selector through N+1 before this whole-band window. No omitted coefficient is assumed zero.');
  const sourceCount=family.G.nodes.length,sourcePrefix=canonicalStringify(family.G.nodes),sourceDefinitions=family.G.captureFunctionDefinitions(),
    G=new SharedGlobalSourceExpressions(family.G,{maxNodes:request.maxNodes,maxDerivativeOrder:128,checkCancelled:context.checkCancelled,onProgress:context.onProgress}),
    q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    window=originalBandWindowExpressions(G,{commonRows:family.selector.rows,ell0:family.constants.ell0,coefficientOrder:activeOrder}),
    {dot,mul}=covarianceMatrixAlgebra(G),c=family.constants,{h,A,D,Renv,kappa,u,Bnorm,E,r0,Tg}=c,
    ell=window.ell,Q=window.Q,S=G.pow(ell,2),epsilon=power(Q,h),k=G.ceiling(G.inv(G.sqrt(epsilon))),
    R=G.fresh('m3_global_band_slow_R'),Z=G.fresh('m3_global_band_slow_Z'),T=G.fresh('m3_global_band_slow_T'),v=G.fresh('m3_global_band_pulse_v'),theta=G.fresh('m3_global_band_angle'),
    Xrep=G.fresh('m3_global_band_representative_X'),etaRep=G.fresh('m3_global_band_representative_eta'),sRep=G.fresh('m3_global_band_representative_s'),
    sv=G.fresh('m3_global_band_implicit_s'),chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T),
    chartSystem=G.defineMonotoneSystem({name:'ActualCommonBandSlowInverse',variable:sv,parameters:[Z,T],body:chartBody,left:q(1,2),right:q(2),derivativeLower:q(1,2),derivativeUpper:G.one,
      endpointProof:'The same original image Z=s^D*eta,T=s*(1-eta^2),s in[1/2,2],eta in[-1,1] and positive h<1/16.',numericOracle:false}),
    s=G.monotoneRoot(chartSystem,[Z,T]),X=G.div(G.pow(R,2),G.mul(q(2),s)),eta=G.div(Z,power(s,D)),qActual=G.mul(Q,s),
    src=family.prepared,{X:X0,eta:eta0}=src.bootstrap.constants,q0=family.roots.q,sourceCutoff=timeCutoff(G),rows=[],
    atProfile=b=>G.simultaneousSubstitute(b,[X0,eta0],[X,eta]),at=b=>G.simultaneousSubstitute(b,[q0,X0,eta0],[qActual,X,eta]),
    Fterms=[src.records[0].global.F],Gterms=[src.records[0].global.U],Mterms=[src.bootstrap.finalM],Pterms=[family.leading.Pi],
    radialTerms=[G.mul(X0,src.records[0].global.v)],TthetaTerms=[family.leading.raw[0]],TzTerms=[family.leading.raw[1]],
    rawCount=request.coefficientOrder;
  for(let n=1;n<=rawCount;n++){
    const selected=family.selector.rows[n-1],record=src.records[n],sigma=G.mul(selected.scale,q0),chi=G.expressionValue(sourceCutoff.system,[sigma]),
      extra=G.mul(sigma,G.expressionValue(sourceCutoff.system,[sigma],[1])),powerQ=power(q0,G.mul(q(2*n),h)),
      useChi=chi,useExtra=extra,weight=G.mul(useChi,powerQ),
      sourceRoots={F:record.global.F,U:record.global.U,M:record.global.M,average:record.global.average,Pi:record.global.Pi,v:record.global.v,
        Ttheta:record.stress.Ttheta,Tz:record.stress.Tz};
    rows.push({order:n,sigma,chi,extra,reducedChi:useChi,reducedExtra:useExtra,positivePower:powerQ,weight,sourceRoots,
      scale:selected.scale,logScale:selected.logScale,sourceSelectorRow:n-1,
      cutoffReduction:'Original actual cutoff and every requested derivative retained; only the certified later window tail is omitted.'});
    Fterms.push(G.mul(weight,sourceRoots.F));Gterms.push(G.mul(weight,sourceRoots.U));Mterms.push(G.mul(weight,sourceRoots.M));Pterms.push(G.mul(weight,sourceRoots.Pi));
    radialTerms.push(G.mul(powerQ,G.sub(G.mul(useChi,X0,sourceRoots.v),G.div(G.mul(q(2),eta0,useExtra,sourceRoots.M),G.core.L))));
    TthetaTerms.push(G.mul(weight,sourceRoots.Ttheta));TzTerms.push(G.mul(weight,sourceRoots.Tz));
  }
  const normalized={F:G.add(...Fterms),G:G.add(...Gterms),M:G.add(...Mterms),pressure:G.add(...Pterms),
    b:G.div(G.add(...radialTerms),G.sqrt(G.mul(q(2),X0))),Ttheta:G.add(...TthetaTerms),Tz:G.add(...TzTerms)},
    profile=Object.fromEntries(Object.entries(normalized).map(([name,body])=>[name,G.share(body,[q0,X0,eta0],'ActualCommonBandNormalized_'+name)])),
    multipliers={F:power(s,G.neg(G.add(A,q(1,2)))),G:power(s,G.neg(A)),b:G.mul(epsilon,power(s,q(-1,2))),pressure:power(s,G.mul(q(-2),A))},
    slow=[R,Z,T],fieldBodies=Object.fromEntries(['F','G','b','pressure'].map(name=>[name,G.mul(multipliers[name],at(profile[name]))])),
    fields=Object.fromEntries(Object.entries(fieldBodies).map(([name,body])=>[name,G.share(body,[...slow,ell],'M3GlobalBandSlow_'+name)])),
    leadingFields={F:G.share(G.mul(multipliers.F,atProfile(src.records[0].global.F)),slow,'ActualCommonBandLeading_F'),
      G:G.share(G.mul(multipliers.G,atProfile(src.records[0].global.U)),slow,'ActualCommonBandLeading_G')},
    Rrep=G.sqrt(G.mul(q(2),sRep,Xrep)),Zrep=G.mul(power(sRep,D),etaRep),Trep=G.mul(sRep,G.sub(G.one,G.pow(etaRep,2))),
    atRep=body=>G.simultaneousSubstitute(body,slow,[Rrep,Zrep,Trep]),F0=atRep(leadingFields.F),FR0=atRep(G.derivative(leadingFields.F,R)),GR0=atRep(G.derivative(leadingFields.G,R)),
    g0=[G.mul(Rrep,FR0),GR0],gabs=G.sqrt(dot(g0,g0)),N=g0.map(x=>G.div(x,gabs)),K=[G.neg(N[1]),N[0]],
    growthRadicand=G.neg(G.mul(q(2),F0,N[0],G.add(gabs,G.mul(q(2),F0,N[0])))),lambda0=G.sqrt(growthRadicand),c0=G.div(lambda0,G.mul(q(2),F0,N[0])),
    frozen={F0,FR0,GR0,g0,gabs,N,K,lambda0,c0,growthRadicand,Rrep,Zrep,Trep,orderZero:true},
    paletteQuotient=G.div(G.sub(G.mul(G.add(G.one,h),ell,G.log(q(2))),G.mul(q(2),G.log(ell))),G.log(Tg)),paletteIndex=G.neg(G.ceiling(G.neg(paletteQuotient))),
    ci=G.mul(power(Tg,paletteIndex),power(Q,G.add(G.one,h))),Ls=G.div(G.mul(q(2),r0),ci),
    Bs=G.sqrt(G.div(lambda0,G.mul(epsilon,G.pow(k,2),G.pow(G.sqrt(G.add(G.one,G.pow(u,2))),3)))),
    cutoffs=fastCutoffs(G,v,Ls,r0),Dgeom=G.sub(q(4),G.mul(q(2),G.sqrt(q(2)))),haarFactor=G.mul(q(1,2),Dgeom,ci,cutoffs.transverseMass),
    matrixNorm=G.mul(G.pow(Bnorm,256),G.pow(G.add(G.one,k),8),G.pow(G.add(G.one,Ls),8)),constants={...c,matrixNorm},
    geometry={ell,Q,S,epsilon,k,Tg,r0,paletteQuotient,paletteIndex,ci,Ls,Bs,Dgeom,haarFactor,lengthRatioBounds:[c.Lmin,c.Lmax],
      angularAverage:q(1,2),rectangleBasis:[[G.one,G.sub(G.one,G.sqrt(q(2)))],[G.sub(G.sqrt(q(2)),G.one),G.one]],normalizedHaarNoExtraIntegerCoverMultiplicity:true},
    recipe=covarianceConcentrationRecipe(G,{...family.uniformCovariance.threshold.input,absoluteC0:G.neg(c0)}),parameters=[R,Z,T,Xrep,etaRep,sRep,ell],families=[];
  context.onProgress?.({stage:'common-own-band-full-background-and-frame',nodeCount:G.nodes.length});
  for(const sign of [1,-1]){
    const beta=K.map((x,j)=>G.mul(Bs,G.sub(x,G.div(G.mul(q(sign),u,N[j]),G.mul(Ls,gabs))))),pTilde=G.mul(Rrep,beta[0]),pz=beta[1],scaledP=G.mul(k,pTilde),
      rounded=G.neg(G.ceiling(G.neg(G.add(scaledP,q(1,2))))),fallback=G.choose(scaledP,G.zero,G.zero,q(-1),G.one,G.one),roundedInteger=G.choose(rounded,q(-1,2),q(1,2),rounded,fallback,rounded),
      p=G.div(roundedInteger,k),x0=G.mul(q(sign,2),Bs,u),phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G)),
      HR=G.derivative(phaseSpeed,R),HZ=G.derivative(phaseSpeed,Z),HT=G.derivative(phaseSpeed,T),
      frame=actualMovingPulseFrame(G,{F:fields.F,FR:G.derivative(fields.F,R),GR:G.derivative(fields.G,R),R,epsilon,k,p,pz,x0,v,Ls,u,c0,lambda0,HR,HZ,sign}),
      t0=G.fresh('m3_global_band_log_P_variable'),logP=G.integral(G.substitute(G.sub(frame.reference.lambda,frame.reference.dref),v,t0),t0,G.div(Ls,q(2)),v),P=G.exp(logP),
      system=G.defineCovarianceVolterra({name:'M3OwnGlobalBandPulse_'+sign,variable:v,parameters,matrix:frame.wMatrix,normUpper:matrixNorm,length:Ls}),
      w=[0,1].map(j=>G.covarianceValue(system,j,v,parameters)),z=w.map(x=>G.mul(P,x)),t=mul(frame.B,z.map(x=>[x])).map(row=>row[0]),
      Htheta=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),t[0],t[1]),v,G.zero,Ls)),Hz=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),t[0],t[2]),v,G.zero,Ls)),
      mass=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),G.pow(t[0],2)),v,G.zero,Ls)),Ac=G.mul(G.neg(c0),G.sqrt(G.add(G.one,G.pow(u,2)))),
      phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,phaseSpeed)),
      fullEikonalRemainder=G.add(G.mul(fields.b,frame.n[0]),G.mul(epsilon,v,G.sub(HT,G.mul(fields.G,HZ))));
    families.push({sign,carrier:{beta,pTilde,p,pz,x0,roundedInteger,roundingErrorUpper:G.inv(k),nonzeroAngularInteger:true},phase,phaseSpeed,
      phaseDerivatives:{R:HR,Z:HZ,T:HT},frame,logP,P,system,w,z,t,fullEikonalRemainder,
      initial:{w:[G.one,G.zero],z:[G.substitute(P,v,G.zero),G.zero],finitePartialSumUsed:false},
      covariance:{theta:Htheta,z:Hz,mass,normalizedRows:[G.neg(G.div(dot(N,[Htheta,Hz]),G.mul(Ac,mass))),G.div(dot(K,[Htheta,Hz]),G.mul(u,mass))]}});
  }
  context.onProgress?.({stage:'common-own-band-two-exact-Volterra-H',nodeCount:G.nodes.length});
  const chart={system:chartSystem,s,X,eta,qActual,q:qActual,Xb:c.Xb,slowPointDomain:'Original image s in[1/2,2], X in[Xa/2,2Xb], eta in[-1,1].',
      representativeDomain:'Original same-box representative Xrep in[Xa,Xb], etaRep in[-1,1], sRep in[1/2,2].',
      covarianceDomain:'Both slow point and representative lie in this very same original mesh box; Euclidean distance<=4/S^3.',
      positiveWeightDomain:'Additionally Xa<X<Xb and ell>=the explicit ell0.',closedEtaOneSided:true},
    chartFactor=power(s,G.neg(G.add(A,q(1,2)))),
    raw={...family.leading,chartFactor,components:family.leading.raw.map(body=>G.mul(chartFactor,atProfile(body)))},components=raw.components,
    H=[families.map(f=>f.covariance.theta),families.map(f=>f.covariance.z)],determinant=G.sub(G.mul(H[0][0],H[1][1]),G.mul(H[0][1],H[1][0])),
    adjugate=[[H[1][1],G.neg(H[0][1])],[G.neg(H[1][0]),H[0][0]]],weights=adjugate.map(row=>G.div(dot(row,components),determinant)),Hy=H.map(row=>dot(row,weights)),
    inverseChecks=Hy.map((x,j)=>sourceGraphRationalIdentity(G,G.sub(x,components[j]),{atomicNodes:[...H.flat(),...components]})),
    Ac=G.mul(G.neg(c0),G.sqrt(G.add(G.one,G.pow(u,2)))),targetScale=G.neg(G.div(dot(N,components),Ac)),
    massLower=G.mul(haarFactor,recipe.mass.massLowerCoefficient,G.sqrt(Ls)),massUpper=G.mul(haarFactor,G.pow(recipe.cone.amplitudeUpper,2),Ls),
    C=[families.map(f=>f.covariance.normalizedRows[0]),families.map(f=>f.covariance.normalizedRows[1])],
    target={raw,H,determinant,adjugate,components,weights,squareRootWeights:weights.map(x=>G.sqrt(x)),Hy,inverseChecks,targetScale,
      normalizedWeights:weights.map((y,j)=>G.div(G.mul(families[j].covariance.mass,y),targetScale)),
      targetDirectionRatio:G.div(G.mul(Ac,dot(K,components)),G.mul(u,G.neg(dot(N,components))))},
    quantitative={Ac,C,detC:G.sub(G.mul(C[0][0],C[1][1]),G.mul(C[0][1],C[1][0])),massLower,massUpper,
      uniformAbsoluteDeterminantLower:G.mul(q(15,8),Ac,u,G.pow(massLower,2)),
      weightLowerWithoutH:G.div(G.mul(kappa,targetScale),G.mul(q(64),massUpper)),weightUpperWithoutH:G.div(G.mul(q(2),targetScale),massLower),
      sourceDeterminantScaleLower:family.uniformCovariance.inverse.determinantScaleLower,
      sourceWeightOverZetaLower:family.uniformCovariance.positivity.weightOverZetaLower,numericalIntegralEvaluation:false};
  const meshLabels=['r','z','t'].map(n=>G.fresh('m3_global_fixed_mesh_'+n)),
    background={coordinates:{q:q0,X:X0,eta:eta0},roots:profile,normalizedBodies:normalized,rows,sourceCutoff,fieldBodies,multipliers,
      completeRadialCutoffCommutatorRetained:true,pressureAxisDatumAndCentrifugalPrimitiveRetained:true,
      omittedTail:{...window.exactTail,missingCoefficientAssumedZero:false,wholeBandAndAllCutoffDerivatives:true}},
    bounds={recipe,primitive:family.uniformCovariance.primitiveProof,sourceUniformConditions:family.uniformCovariance.threshold.conditions,
      commonEllMinimum:c.ellMinimum,commonEll0:c.ell0,commonQStar:c.qStar,operatorPowerAudit:family.uniformCovariance.threshold.audits.power,
      sourceDirection:family.uniformCovariance.threshold.direction,actualAllActiveOrdersRetained:true,
      applicationDomain:'Integer ell in this window; representative in the same original shell/slow box, point Xa<X<Xb. No rounded representative is differentiated.'},
    coordinates={R,Z,T,theta,v,Xrep,etaRep,sRep,ell},
    selectorChecks=family.selector.rows.slice(0,activeOrder+1).map((r,i)=>({id:'actual-monotone-common-selector-'+r.order,
      pass:r.order===i+1&&r.historicalScale===family.source.background.cutoffs.rows[i].scale&&
        r.previousLogScale===(i?family.selector.rows[i-1].logScale:G.zero)&&
        r.growth===G.add(r.previousLogScale,G.log(q(r.order===2?16:2)))&&
        G.nodes[r.logScale].op==='maximum'&&G.nodes[r.logScale].args.includes(r.historicalLogScale)&&G.nodes[r.logScale].args.includes(r.growth),
      sourceRow:i,scale:r.scale,logScale:r.logScale})),
    familyChecks=families.flatMap(f=>{
      const system=G.covarianceSystems[f.system],normal=[G.sub(f.carrier.x0,G.mul(v,f.phaseDerivatives.R)),G.div(f.carrier.p,R),G.sub(f.carrier.pz,G.mul(epsilon,v,f.phaseDerivatives.Z))];
      return [{id:'own-completed-moving-normal-'+f.sign,pass:same(f.frame.n,normal)&&f.phaseSpeed===G.add(G.mul(f.carrier.p,fields.F),G.mul(f.carrier.pz,fields.G))},
        {id:'own-Volterra-uses-frozen-band-'+f.sign,pass:same(system.matrix,f.frame.wMatrix)&&same(system.parameters,parameters)&&parameters.includes(ell)&&same(system.initial,[G.one,G.zero])},
        {id:'own-H-and-Haar-integrands-'+f.sign,pass:[1,2].every((j,i)=>H[i][families.indexOf(f)]===G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),f.t[0],f.t[j]),v,G.zero,Ls)))},
        {id:'carriers-frozen-before-slow-derivatives-'+f.sign,pass:[f.carrier.p,f.carrier.pz,f.carrier.x0].every(x=>[R,Z,T,v].every(y=>!G.freeCoordinates(x).has(y)&&G.derivative(x,y)===G.zero))}];
    }),
    checks=[{id:'genuine-common-source-family',pass:assertActualCommonAdmissibleFamily(family)},
      {id:'source-coefficient-window-is-complete',pass:rows.length===activeOrder&&window.exactTail.firstOmitted===activeOrder+1&&window.nextSourceScale===family.selector.rows[activeOrder].scale},
      {id:'original-cutoff-closed-flat-zero-boundary',pass:G.nodes[sourceCutoff.body].op==='smooth_piecewise'&&G.nodes[sourceCutoff.body].args[2]===G.one&&G.nodes[sourceCutoff.body].args[5]===G.zero},
      {id:'actual-positive-coefficients-and-pressure-retained',pass:rows.every(r=>r.scale===family.selector.rows[r.order-1].scale&&r.sourceRoots.F===src.records[r.order].global.F&&r.sourceRoots.Pi===src.records[r.order].global.Pi&&r.reducedChi===r.chi&&r.reducedExtra===r.extra)},
      {id:'actual-full-H-inverse',pass:inverseChecks.every(x=>x.pass)},
      {id:'same-parameterized-band-in-all-actual-systems',pass:families.every(f=>G.covarianceSystems[f.system].parameters.includes(ell))},
      {id:'source-prefix-and-original-function-definitions-preserved',pass:canonicalStringify(G.nodes.slice(0,sourceCount))===sourcePrefix&&family.G.functionDefinitionsUnchanged(sourceDefinitions)},
      ...selectorChecks,...familyChecks];
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','Global band source binding failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const roots={ell,Q,S,epsilon,k,ci,Ls,Bs,H,determinant,weights,squareRootWeights:target.squareRootWeights,fields,normalizedBackground:profile,
      nextSourceScale:window.nextSourceScale,windowLower:window.lower,windowUpper:window.upper},
    sourceBinding={profile:family.request.sourceProfile,parameterExpressionSHA256:family.sourceBinding.parameterExpressionSHA256,
      originalPDFSHA256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
      sourceCompiler:'mathscope-m3/navier/source-global-band.mjs',originalEquationCompiler:'mathscope-m2/navier/actual-common-admissible-band.mjs',
      originalM2SourceChanged:false,sourcePrefixNodeCount:sourceCount,sourceNodesSharedReadOnly:true,
      privateM2BandAuthenticatorUsed:false,ownM3Authenticator:true,oldSelectedHReused:false,
      formulas:'Same leading/full fields, moving frame, two actual Volterra matrices, Haar integrals and H^-1 T. ell is an explicit frozen parameter.'},
    scope={actualParametricOriginalBandConstructed:true,completeActiveCoefficientPrefix:true,allSubsequentCutoffDerivativesExactlyZeroOnWindow:true,
      ownBandOwnCarrierOwnVolterraOwnH:true,uniformSourceBoundsRetained:true,positiveWeightsRequireOriginalSameBoxDomain:true,
      arbitraryIntegerInstanceMembershipVerified:false,globalRepresentativeSelectorBound:false,allLabelsAndRadialIntegralsAssembled:false,
      newN6ClassCertificate:false,originalN604Complete:false,fullPDEFieldConstructed:false,numericalHEnclosed:false},
    result={schema:'MathScope.N6.GlobalSourceBand/1',G,family,request,window,sourceBinding,constants,geometry,coordinates,chart,fields,leadingFields,
      frozen,meshLabels,background,cutoffs,families,target,bounds,quantitative,parameters,checks,roots,scope};
  const count=G.nodes.length;
  seals.set(result,{G,family,count,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),
    covarianceCount:G.covarianceSystems.length,covariance:canonicalStringify(G.covarianceSystems),metadata:canonicalStringify(metadata(result))});
  context.onProgress?.({stage:'m3-global-parameterized-band-source-sealed',nodeCount:count,sourcePrefix:sourceCount,newNodes:count-sourceCount});
  return result;
}

export function assertGlobalSourceBand(p){
  const s=seals.get(p);
  if(!s||s.G!==p.G||s.family!==p.family||s.metadata!==canonicalStringify(metadata(p))||
    s.prefix!==canonicalStringify(p.G.nodes.slice(0,s.count))||!p.G.functionDefinitionsUnchanged(s.definitions)||
    s.covariance!==canonicalStringify(p.G.covarianceSystems.slice(0,s.covarianceCount)))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged privately issued M3 source-band program. A receipt or a changed parameter body is not source authority.');
  assertActualCommonAdmissibleFamily(s.family);return true;
}

export async function globalSourceBandCertificate(p){
  assertGlobalSourceBand(p);const s=seals.get(p),upstream=await actualCommonAdmissibleFamilyCertificate(p.family),
    delta={sourceGraph:upstream.graph,sourcePrefixNodeCount:p.sourceBinding.sourcePrefixNodeCount,newNodes:p.G.nodes.slice(p.sourceBinding.sourcePrefixNodeCount,s.count),
      definitions:s.definitions,covariance:p.G.covarianceSystems.slice(0,s.covarianceCount),metadata:metadata(p)},bytes=canonicalStringify(delta);
  return {...metadata(p),upstreamSource:upstream,
    graph:{sha256:await sha256(bytes),nodeCount:s.count,newNodeCount:s.count-p.sourceBinding.sourcePrefixNodeCount,canonicalBytes:new TextEncoder().encode(bytes).length,
      originalPrefixGraphSHA256:upstream.graph.sha256,sourceDeltaRetainsEveryNewBody:true},
    verification:{actualSourceProgramExecuted:true,numericalHOrGlobalFieldEvaluated:false,newLeanKernelExecuted:false}};
}

export function prepareGlobalSourceBand(input={},context={}){
  const request=requestOf(input),family=prepareActualCommonAdmissibleFamily({throughOrder:Math.max(2,request.coefficientOrder+1),derivativeOrder:Math.max(3,request.coefficientOrder+1),
    // Preserve the accepted upstream common6 REQUEST as well as its
    // mathematical graph. The additive compiler has its own lower budget.
    maxNodes:5000000,maxProfileJets:60000,maxJetRequests:600000},context);
  return attachGlobalSourceBand(family,request,context);
}
