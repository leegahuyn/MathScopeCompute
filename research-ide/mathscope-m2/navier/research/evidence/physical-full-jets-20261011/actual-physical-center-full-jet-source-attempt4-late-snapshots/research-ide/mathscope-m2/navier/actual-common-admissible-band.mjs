/** Every invocation creates its OWN original band/background/pulse/H.
 * The default symbolic integer band lies inside the certified small-q
 * domain. Literal integer requests are accepted up to the available true
 * coefficient prefix; missing terms cause a resource error, never zero.
 */
import {assertActualCommonAdmissibleFamily} from './actual-common-admissible-family.mjs';
import {ActualInnerCovarianceExpressions} from './actual-inner-covariance-flat-extension.mjs';
import {actualMovingPulseFrame,covarianceMatrixAlgebra} from './actual-covariance-matrix.mjs';
import {covarianceConcentrationRecipe} from './actual-covariance-concentration.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {clearDisposableThirdJetCaches,disposableThirdJetCacheCopy} from './actual-third-jet-ftc.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,constants:p.constants,geometry:p.geometry,coordinates:p.coordinates,
    chart:p.chart,fields:p.fields,leadingFields:p.leadingFields,frozen:p.frozen,meshLabels:p.meshLabels,background:p.background,
    cutoffs:p.cutoffs,families:p.families,target:p.target,bounds:p.bounds,quantitative:p.quantitative,checks:p.checks,roots:p.roots,scope:p.scope});

function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['ell','meshLabels','maxNodes'].includes(k)))
    fail('INVALID_INPUT','Choose an original band, fixed integer labels and a finite expression budget only.');
  const ell=input.ell??'first-admissible',maxNodes=input.maxNodes??4000000;
  if(ell!=='first-admissible'&&(!Number.isSafeInteger(ell)||ell<1))fail('INVALID_INPUT','ell is a positive integer or the exact first-admissible source integer.');
  if(!Number.isSafeInteger(maxNodes)||maxNodes<1)fail('INVALID_INPUT','maxNodes is a positive finite budget.');
  if(input.meshLabels!==undefined&&(!Array.isArray(input.meshLabels)||input.meshLabels.length!==3||input.meshLabels.some(x=>!(Number.isSafeInteger(x)||typeof x==='string'&&/^-?\d{1,1000}$/.test(x)))))
    fail('INVALID_INPUT','Use exactly three fixed integer mesh labels.');
  return {ell,maxNodes,meshLabels:input.meshLabels?.map(String)??'source-witness-containing-box'};
}

/** Original time cutoff uses exp(-1/x), as in the original background.
 * The transverse/pulse cutoff below uses the distinct squared-flat seed.
 */
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

export function actualCommonAdmissibleBand(family,input={},context={}){
  assertActualCommonAdmissibleFamily(family);const request=requestOf(input),anchor=request.ell==='first-admissible',
    finiteThrough=anchor?1:request.ell;
  if(!anchor&&(finiteThrough>family.selector.rows.length||finiteThrough>family.prepared.order))
    fail('RESOURCE_LIMIT','This integer band needs the true common selector and coefficient prefix through ell; extend the actual family query. Missing cutoff coefficients are not zero.');
  clearDisposableThirdJetCaches(family.G);assertActualCommonAdmissibleFamily(family);
  const count=family.G.nodes.length,G=new ActualInnerCovarianceExpressions(disposableThirdJetCacheCopy(family.G),
    {maxNodes:request.maxNodes,maxDerivativeOrder:128,checkCancelled:context.checkCancelled}),q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    {dot,mul}=covarianceMatrixAlgebra(G),c=family.constants,{h,A,D,Renv,kappa,u,Bnorm,E,r0,Tg}=c,
    ell=anchor?family.selector.ellA:q(request.ell),Q=G.exp(G.neg(G.mul(ell,G.log(q(2))))),S=G.pow(ell,2),epsilon=power(Q,h),k=G.ceiling(G.inv(G.sqrt(epsilon))),
    R=G.fresh('common_band_slow_R'),Z=G.fresh('common_band_slow_Z'),T=G.fresh('common_band_slow_T'),v=G.fresh('common_band_pulse_v'),theta=G.fresh('common_band_angle'),
    Xrep=G.fresh('common_band_representative_X'),etaRep=G.fresh('common_band_representative_eta'),sRep=G.fresh('common_band_representative_s'),
    sv=G.fresh('common_band_implicit_s'),chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T),
    chartSystem=G.defineMonotoneSystem({name:'ActualCommonBandSlowInverse',variable:sv,parameters:[Z,T],body:chartBody,left:q(1,2),right:q(2),derivativeLower:q(1,2),derivativeUpper:G.one,
      endpointProof:'The same original image Z=s^D*eta,T=s*(1-eta^2),s in[1/2,2],eta in[-1,1] and positive h<1/16.',numericOracle:false}),
    s=G.monotoneRoot(chartSystem,[Z,T]),X=G.div(G.pow(R,2),G.mul(q(2),s)),eta=G.div(Z,power(s,D)),qActual=G.mul(Q,s),
    src=family.prepared,{X:X0,eta:eta0}=src.bootstrap.constants,q0=family.roots.q,sourceCutoff=timeCutoff(G),rows=[],
    atProfile=b=>G.simultaneousSubstitute(b,[X0,eta0],[X,eta]),at=b=>G.simultaneousSubstitute(b,[q0,X0,eta0],[qActual,X,eta]),
    Fterms=[src.records[0].global.F],Gterms=[src.records[0].global.U],Mterms=[src.bootstrap.finalM],Pterms=[family.leading.Pi],
    radialTerms=[G.mul(X0,src.records[0].global.v)],TthetaTerms=[family.leading.raw[0]],TzTerms=[family.leading.raw[1]],
    rawCount=anchor?2:finiteThrough;
  for(let n=1;n<=rawCount;n++){
    const selected=family.selector.rows[n-1],record=src.records[n],sigma=G.mul(selected.scale,q0),chi=G.expressionValue(sourceCutoff.system,[sigma]),
      extra=G.mul(sigma,G.expressionValue(sourceCutoff.system,[sigma],[1])),powerQ=power(q0,G.mul(q(2*n),h)),
      useChi=anchor?(n===1?G.one:G.zero):chi,useExtra=anchor?G.zero:extra,weight=G.mul(useChi,powerQ),
      sourceRoots={F:record.global.F,U:record.global.U,M:record.global.M,average:record.global.average,Pi:record.global.Pi,v:record.global.v,
        Ttheta:record.stress.Ttheta,Tz:record.stress.Tz};
    rows.push({order:n,sigma,chi,extra,reducedChi:useChi,reducedExtra:useExtra,positivePower:powerQ,weight,sourceRoots,
      scale:selected.scale,logScale:selected.logScale,sourceSelectorRow:n-1,
      cutoffReduction:anchor?(n===1?'The whole band has b1*q<=1/2: original plateau.':'The whole band has b2*q>=1: original flat-zero branch.'):'No cutoff reduction: original actual value and all derivatives retained.'});
    Fterms.push(G.mul(weight,sourceRoots.F));Gterms.push(G.mul(weight,sourceRoots.U));Mterms.push(G.mul(weight,sourceRoots.M));Pterms.push(G.mul(weight,sourceRoots.Pi));
    radialTerms.push(G.mul(powerQ,G.sub(G.mul(useChi,X0,sourceRoots.v),G.div(G.mul(q(2),eta0,useExtra,sourceRoots.M),G.core.L))));
    TthetaTerms.push(G.mul(weight,sourceRoots.Ttheta));TzTerms.push(G.mul(weight,sourceRoots.Tz));
  }
  const normalized={F:G.add(...Fterms),G:G.add(...Gterms),M:G.add(...Mterms),pressure:G.add(...Pterms),
    b:G.div(G.add(...radialTerms),G.sqrt(G.mul(q(2),X0))),Ttheta:G.add(...TthetaTerms),Tz:G.add(...TzTerms)},
    profile=Object.fromEntries(Object.entries(normalized).map(([name,body])=>[name,G.share(body,[q0,X0,eta0],'ActualCommonBandNormalized_'+name)])),
    multipliers={F:power(s,G.neg(G.add(A,q(1,2)))),G:power(s,G.neg(A)),b:G.mul(epsilon,power(s,q(-1,2))),pressure:power(s,G.mul(q(-2),A))},
    slow=[R,Z,T],fieldBodies=Object.fromEntries(['F','G','b','pressure'].map(name=>[name,G.mul(multipliers[name],at(profile[name]))])),
    fields=Object.fromEntries(Object.entries(fieldBodies).map(([name,body])=>[name,G.share(body,slow,'ActualCommonBandSlow_'+name)])),
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
    recipe=covarianceConcentrationRecipe(G,{...family.uniformCovariance.threshold.input,absoluteC0:G.neg(c0)}),parameters=[R,Z,T,Xrep,etaRep,sRep],families=[];
  context.onProgress?.({stage:'common-own-band-full-background-and-frame',nodeCount:G.nodes.length});
  for(const sign of [1,-1]){
    const beta=K.map((x,j)=>G.mul(Bs,G.sub(x,G.div(G.mul(q(sign),u,N[j]),G.mul(Ls,gabs))))),pTilde=G.mul(Rrep,beta[0]),pz=beta[1],scaledP=G.mul(k,pTilde),
      rounded=G.neg(G.ceiling(G.neg(G.add(scaledP,q(1,2))))),fallback=G.choose(scaledP,G.zero,G.zero,q(-1),G.one,G.one),roundedInteger=G.choose(rounded,q(-1,2),q(1,2),rounded,fallback,rounded),
      p=G.div(roundedInteger,k),x0=G.mul(q(sign,2),Bs,u),phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G)),
      HR=G.derivative(phaseSpeed,R),HZ=G.derivative(phaseSpeed,Z),HT=G.derivative(phaseSpeed,T),
      frame=actualMovingPulseFrame(G,{F:fields.F,FR:G.derivative(fields.F,R),GR:G.derivative(fields.G,R),R,epsilon,k,p,pz,x0,v,Ls,u,c0,lambda0,HR,HZ,sign}),
      t0=G.fresh('common_band_log_P_variable'),logP=G.integral(G.substitute(G.sub(frame.reference.lambda,frame.reference.dref),v,t0),t0,G.div(Ls,q(2)),v),P=G.exp(logP),
      system=G.defineCovarianceVolterra({name:'ActualOwnCommonBandPulse_'+sign,variable:v,parameters,matrix:frame.wMatrix,normUpper:matrixNorm,length:Ls}),
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
      sourceWeightOverZetaLower:family.uniformCovariance.positivity.weightOverZetaLower,numericalIntegralEvaluation:false},
    witnessX=q(110),witnessR=G.sqrt(G.mul(q(2),witnessX)),witnessPoint=[witnessR,G.zero,G.one],
    meshLabels=Array.isArray(request.meshLabels)?request.meshLabels.map(x=>q(BigInt(x))):witnessPoint.map(x=>G.neg(G.ceiling(G.neg(G.mul(G.pow(ell,6),x))))),
    atWitness=x=>G.simultaneousSubstitute(x,parameters,[...witnessPoint,witnessX,G.zero,G.one]),
    witness={X:witnessX,slowPoint:witnessPoint,representative:[witnessX,G.zero,G.one],meshLabels,
      fields:Object.fromEntries(Object.entries(fields).map(([name,root])=>[name,atWitness(root)])),H:H.map(row=>row.map(atWitness)),target:components.map(atWitness),
      labelMembership:Array.isArray(request.meshLabels)?'Caller-chosen fixed labels: witness membership is not asserted.':'Each label is floor(ell^6*point_j), hence the original partition argument is in[0,1). Use the permitted point as the representative.',
      actualDomainWitness:!Array.isArray(request.meshLabels)&&anchor},
    background={coordinates:{q:q0,X:X0,eta:eta0},roots:profile,normalizedBodies:normalized,rows,sourceCutoff,fieldBodies,multipliers,
      completeRadialCutoffCommutatorRetained:true,pressureAxisDatumAndCentrifugalPrimitiveRetained:true,
      sourceLeadingRoots:{F:family.leading.F,U:family.leading.U,M:family.leading.M,Pi:family.leading.Pi,Ttheta:family.leading.raw[0],Tz:family.leading.raw[1]},
      omittedTail:{firstOmitted:anchor?3:finiteThrough+1,
        proof:anchor?'b2>=16*b1 and b1*q>=1/16 make every n>=2 flat zero; the raw n2 row above retains its exact cutoff/body.':'For n>=ell+1, b_n>=2^n and q>=2^(-ell-1) imply b_n*q>=1. Every omitted cutoff and every derivative is exactly zero.',
        missingCoefficientAssumedZero:false},normalization:'b=epsilon*s^-1/2*radialProfile; F=s^(-A-1/2)*Fprofile; G=s^-A*Uprofile; p=s^-2A*PiProfile.'},
    bounds={recipe,primitive:family.uniformCovariance.primitiveProof,commonFamilyRoots:family.roots,
      sourceUniformConditions:family.uniformCovariance.threshold.conditions,commonEllMinimum:c.ellMinimum,commonEll0:c.ell0,commonQStar:c.qStar,
      operatorPowerAudit:family.uniformCovariance.threshold.audits.power,sourceDirection:family.uniformCovariance.threshold.direction,
      actualAllActiveOrdersRetained:true,universalRecipeNotFiniteSample:true},
    coordinates={R,Z,T,theta,v,Xrep,etaRep,sRep},familyChecks=families.flatMap(f=>{
      const system=G.covarianceSystems[f.system],normal=[G.sub(f.carrier.x0,G.mul(v,f.phaseDerivatives.R)),G.div(f.carrier.p,R),G.sub(f.carrier.pz,G.mul(epsilon,v,f.phaseDerivatives.Z))],
        nPrime=[G.neg(f.phaseDerivatives.R),G.zero,G.neg(G.mul(epsilon,f.phaseDerivatives.Z))];
      return[{id:'own-actual-completed-moving-normal-'+f.sign,pass:same(f.frame.n,normal)&&same(f.frame.nPrime,nPrime)&&f.phaseSpeed===G.add(G.mul(f.carrier.p,fields.F),G.mul(f.carrier.pz,fields.G))},
        {id:'own-actual-Volterra-initial-one-zero-'+f.sign,pass:same(system.matrix,f.frame.wMatrix)&&same(system.initial,[G.one,G.zero])&&system.variable===v&&system.length===Ls&&same(system.parameters,parameters)},
        {id:'own-original-H-and-mass-integrands-'+f.sign,pass:[1,2].every((j,i)=>H[i][families.indexOf(f)]===G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),f.t[0],f.t[j]),v,G.zero,Ls)))},
        {id:'own-original-frozen-rounded-carrier-'+f.sign,pass:[f.carrier.p,f.carrier.pz,f.carrier.x0].every(x=>[R,Z,T,v].every(y=>!G.freeCoordinates(x).has(y)&&G.derivative(x,y)===G.zero))}];
    }),checks=[{id:'same-private-common-selector',pass:assertActualCommonAdmissibleFamily(family)},
      {id:'exact-original-family-prefix-copy',pass:same(G.nodes.slice(0,count),family.G.nodes.slice(0,count))},
      {id:'same-actual-positive-coefficient-cutoffs',pass:rows.every(r=>r.scale===family.selector.rows[r.order-1].scale&&r.sourceRoots.F===src.records[r.order].global.F&&r.sourceRoots.Pi===src.records[r.order].global.Pi)},
      {id:'full-radial-commutator-and-pressure',pass:fields.b!==undefined&&fields.pressure!==undefined&&Pterms[0]===family.leading.Pi&&background.completeRadialCutoffCommutatorRetained},
      {id:'full-original-leading-covariance-target',pass:raw.F===family.leading.F&&raw.M===family.leading.M&&raw.Pi===family.leading.Pi&&raw.bothShearTermsRetained},
      {id:'actual-full-H-inverse',pass:inverseChecks.every(x=>x.pass)},
      {id:'fixed-own-band-and-mesh-labels',pass:[ell,Q,S,epsilon,k,ci,Ls,...meshLabels].every(x=>[R,Z,T,v,theta].every(y=>!G.freeCoordinates(x).has(y)))},
      {id:'source-witness-full-substitution',pass:[...Object.values(witness.fields),...witness.H.flat(),...witness.target].every(x=>G.freeCoordinates(x).size===0)},
      ...familyChecks];
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','Own common-band source binding failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const scope={actualOwnBandCompleteBackground:true,actualOwnBandTwoSignH:true,allActivePositiveCoefficientsRetained:true,
    actualBandInsideExplicitGamma:anchor,literalIntegerBandMembership:anchor?'PROVED_BY_SOURCE_ANCHOR':'NOT_INSIDE_THE_EXPLICIT_SUFFICIENT_DOMAIN',
    actualPositiveWeightsOnDeclaredAdmissibleDomain:anchor,actualSmoothInteriorSquareRootsOnDeclaredAdmissibleDomain:anchor,
    sourceUniformProofAppliesToEveryAdmissibleBand:true,everyBandLiterallyExecuted:false,allLabelPhysicalCurlAttached:false,
    temporalPhysicalGaussianTailAttached:false,numericalHEnclosed:false,wholeGPOSComplete:false,wholeM2Complete:false,M3Started:false},
    sourceBinding={sourceProfile:family.request.sourceProfile,parameterExpressionSHA256:family.sourceBinding.parameterExpressionSHA256,
      commonSelector:true,sourcePrefixNodeCount:count,ownBandOwnRepresentativeOwnCarrierOwnH:true,canonicalOriginalSourceChanged:false,
      backgroundIsTheSameCommonEnlargedFamily:true,oldSelectedHOrPulseCopied:false,
      membershipQualification:'Strict positivity is asserted only under this common source Gamma and original same-box domains. Literal small ell requests keep symbolic inverse expressions but receive no positivity or square-root domain certificate.'},
    roots={Q,ell,S,epsilon,k,ci,Ls,Bs,H,determinant,weights,squareRootWeights:target.squareRootWeights,fields,normalizedBackground:profile,
      sourceDeterminantScaleLower:quantitative.sourceDeterminantScaleLower,sourceWeightOverZetaLower:quantitative.sourceWeightOverZetaLower,Xb:c.Xb,witness},
    result={G,family,commonFamily:family,request,sourceBinding,constants,geometry,coordinates,chart,fields,leadingFields,frozen,meshLabels,
      background,cutoffs,families,target,bounds,quantitative,checks,roots,scope},
    packed=G.pack(roots,{schema:'MathScope.ActualCommonAdmissibleBandProgram/1',request,sourceBinding,constants,geometry,coordinates,chart,fields,leadingFields,
      frozen,meshLabels,background,cutoffs,families,target,bounds,quantitative,checks,scope});
  result.program=JSON.parse(canonicalStringify(packed));
  seals.set(result,{G,family,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),covarianceCount:G.covarianceSystems.length,
    covariance:canonicalStringify(G.covarianceSystems),data:data(result),program:canonicalStringify(result.program)});
  context.onProgress?.({stage:'common-own-band-source-sealed',nodeCount:G.nodes.length});return result;
}

export function assertActualCommonAdmissibleBand(p){
  const s=seals.get(p);
  if(!s||p.G!==s.G||p.family!==s.family||p.commonFamily!==s.family||data(p)!==s.data||canonicalStringify(p.program)!==s.program||
    canonicalStringify(p.G.nodes.slice(0,s.count))!==s.prefix||!p.G.functionDefinitionsUnchanged(s.definitions)||canonicalStringify(p.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private own common-band source and its fixed certificate prefix.');
  assertActualCommonAdmissibleFamily(s.family);return true;
}

export async function actualCommonAdmissibleBandCertificate(p){
  assertActualCommonAdmissibleBand(p);const s=seals.get(p);
  return {schema:'MathScope.ActualCommonAdmissibleBandCertificate/1',request:p.request,sourceBinding:p.sourceBinding,scope:p.scope,chart:p.chart,
    geometry:p.geometry,quantitative:p.quantitative,checks:p.checks,roots:p.roots,
    graph:{sha256:await sha256(s.program),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.program).length,fixedCompilerPrefix:true}};
}
