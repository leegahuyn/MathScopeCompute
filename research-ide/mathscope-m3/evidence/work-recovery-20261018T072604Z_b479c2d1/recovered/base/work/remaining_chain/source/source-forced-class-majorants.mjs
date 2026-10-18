/** Original stable forced-pulse operator bounds for the class induction.
 *
 * A Volterra factorial tail proves which exact solution is represented.
 * It is not the polynomial-S estimate used here. This module preserves
 * the original dissipative moving-frame decomposition and applies the
 * differentiated zero-data Duhamel equation to that SAME source inverse.
 * Input source W_alpha seminorms remain an explicit, separate obligation.
 */
import {allOrderMixedGaussianJetPowerAudit} from '../../mathscope-m2/navier/actual-all-order-gaussian-jet-kernel.mjs';
import {assertActualCommonAdmissibleFamily} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {normalizedHomogeneousPulseBinding} from '../../mathscope-m2/navier/actual-pulse-gaussian-power-kernel.mjs';
import {assertGlobalForcedCurrent} from './source-global-forced-current.mjs';
import {assertForcedAngularInverse} from './source-forced-pulse.mjs';
import {assertOriginalFixedLiftPulsePath} from './source-initialized-angular.mjs';
import {createQuadraticSourceVerifier} from './source-quadratic-identity.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),copy=x=>structuredClone(x),
  natural=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail(name+' must be an exact finite nonnegative integer.','RESOURCE_LIMIT');return n;},
  reserve=n=>n<=1n?0:(n-1n).toString(2).length,
  binomial=(n,k)=>{let c=1n;for(let j=1;j<=k;j++)c=c*BigInt(n-j+1)/BigInt(j);return c;},
  plus=(a,b)=>a===null||b===null?null:a+b,
  boundSum=xs=>{const a=xs.filter(x=>x!==null);return a.length?Math.max(...a)+reserve(BigInt(a.length)):null;},
  scale=(p,n)=>p===null?null:p+reserve(n),
  product=(a,b,m)=>boundSum(Array.from({length:m+1},(_,j)=>scale(plus(a[j],b[m-j]),binomial(m,j))));

/** Each exponent p means (K*S)^p. K is a single actual source-only base
 * at this requested order; K>=2 and includes the requested finite maximum
 * harmonic. No caller-provided power arrays or omitted source terms are
 * accepted. F_m bounds the COMPLETE actual input after its original H_w
 * pullback, expressed in the common reference weights:
 * F_m*epsilon_ref^alpha*S_ref^b*sqrt(zeta_ref)*delta_ref^-a*P(v).
 * If a preceding certificate instead uses local-label weights, its exact
 * chart factors and the 4^b neighboring-band factor belong in F_m. This
 * operator never claims to supply or silently discard that conversion.
 */
export function originalStableForcedClassPowers(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))
    fail('Select finite derivative order and work budget only, never replacement source powers.','INVALID_INPUT');
  const order=input.order??2,maxWork=input.maxWork??100000;
  natural(order,'Derivative order');natural(maxWork,'Work budget');
  if(maxWork<1||(BigInt(order)+4n)**3n>BigInt(maxWork))fail('The complete mixed forced recurrence exceeds its finite work budget.','RESOURCE_LIMIT');
  const mixed=allOrderMixedGaussianJetPowerAudit({order:order+1,maxWork}),at=name=>{
    const row=mixed.rows.find(r=>r.label===name);if(!row)fail('An original mixed frame operation is missing: '+name);return row.powers;
  },count=order+1,range=Array.from({length:count},(_,j)=>j),
    norm=names=>range.map(m=>Math.max(...names.map(row=>boundSum(row.map(name=>at(name)[m]))??0))),
    frame=norm(Array.from({length:3},(_,i)=>Array.from({length:2},(_,j)=>'original B '+i+j))),
    leftFrame=norm(Array.from({length:2},(_,i)=>Array.from({length:3},(_,j)=>'original Bleft '+i+j))),
    n=range.map(m=>Math.max(...[0,1,2].map(i=>at('original n_'+i)[m]))),
    nPrime=range.map(m=>Math.max(...[0,1,2].map(i=>at('original n_prime_'+i)[m]??0))),
    invN=at('original 1/|n|^2').slice(0,count),
    normalSquare=range.map(m=>product(n,n,m)),normalProjection=range.map(m=>scale(product(normalSquare,invN,m),3n)),
    projection=range.map(m=>boundSum([m===0?0:null,normalProjection[m]])),
    P=mixed.powers.P.slice(0,count),inverseP=[0],inversePRows=[];
  for(let m=1;m<=order;m++){
    const terms=Array.from({length:m},(_,j)=>({derivative:j+1,remaining:m-j-1,binomial:String(binomial(m,j+1)),
      power:scale(plus(P[j+1],inverseP[m-j-1]),binomial(m,j+1))})),power=boundSum(terms.map(t=>t.power));
    inverseP.push(power);inversePRows.push({order:m,terms,power,
      identity:'P*D^m(P^-1)=-sum_(j=1)^m binom(m,j)*(D^j P)*D^(m-j)(P^-1).',
      originalPositivePFactorRetained:true});
  }
  // Projection and frame factors have no shell pole. Every f derivative
  // has the ORIGINAL P. Division by P cancels that envelope once; its
  // derivative ratios are the complete recurrence above, not an exp(L).
  const sourcePathPullbackPowers=range.map(m=>3*m),
    projectionInput=range.map(m=>boundSum(Array.from({length:m+1},(_,j)=>scale(plus(projection[j],sourcePathPullbackPowers[m-j]),binomial(m,j))))),
    frameInput=range.map(m=>product(leftFrame,projectionInput,m)),forcing=range.map(m=>product(inverseP,frameInput,m)),
    damping=at('original d').slice(0,count),
    matrix=range.map(m=>boundSum([mixed.powers.matrix[m],damping[m]===null?null:damping[m]+2])),
    w=[forcing[0]+1],recurrence=[{order:0,power:forcing[0]+1,propagatorPower:1,integrationLengthPower:1,
      identity:'w(v)=-integral_0^v V_m(v,u)*(B_left*projection*f/P)(u)du.'}];
  for(let m=1;m<=order;m++){
    const slowTerms=Array.from({length:m},(_,j)=>({matrixOrder:j+1,solutionOrder:m-j-1,
      binomial:String(binomial(m,j+1)),power:scale(plus(matrix[j+1],w[m-j-1]),binomial(m,j+1))})),
      fastTerms=Array.from({length:m},(_,j)=>({matrixOrder:j,solutionOrder:m-j-1,
        binomial:String(binomial(m-1,j)),power:scale(plus(matrix[j],w[m-j-1]),binomial(m-1,j))})),
      slowPower=boundSum([forcing[m],...slowTerms.map(t=>t.power)])+1,
      fastPower=boundSum([forcing[m-1],...fastTerms.map(t=>t.power)]),power=Math.max(slowPower,fastPower);
    w.push(power);recurrence.push({order:m,forcingOrder:m,slowTerms,fastTerms,slowPower,fastPower,power,
      propagatorPower:m+1,integrationLengthPower:1,zeroInitialParameterDerivatives:true,
      slowIdentity:'D^alpha w=integral V_m*(D^alpha g+sum_(0<beta<=alpha) binom(alpha,beta)*D^beta M_m*D^(alpha-beta)w).',
      fastIdentity:'D_slow^alpha D_v^(b+1)w=D_slow^alpha D_v^b(M_m*w+g); all solution requests have lower total order.'});
  }
  const Pw=range.map(m=>product(P,w,m)),amplitude=range.map(m=>product(frame,Pw,m)),
    Kmatrix=norm([['zero','K_rtheta','zero'],['K_thetar','zero','zero'],['original G_R','zero','zero']]),
    nK=range.map(m=>product(n,Kmatrix,m)),pressureNumerator=range.map(m=>boundSum([
      scale(product(nK,amplitude,m),3n),scale(product(nPrime,amplitude,m),3n),
      scale(boundSum(Array.from({length:m+1},(_,j)=>scale(plus(n[j],sourcePathPullbackPowers[m-j]),binomial(m,j)))),3n)])),
    pressure=range.map(m=>product(invN,pressureNumerator,m)),
    // The returned current point is an affine common-Y pullback. Its
    // pulse gradient is O(S); the transverse projection is bounded, and
    // all derivatives of order>=2 of these affine maps vanish. K includes
    // their original finite coefficient bound. 4^m counts every branch.
    mapped=range.map(m=>({order:m,chainCountPower:2*m,affinePulseDegree:m,
      amplitudePower:Math.max(...amplitude.slice(0,m+1))+3*m,
      pressurePower:Math.max(...pressure.slice(0,m+1))+3*m,
      commonReferenceSPowerAmplitude:Math.max(...amplitude.slice(0,m+1))+3*m,
      commonReferenceSPowerPressure:Math.max(...pressure.slice(0,m+1))+3*m,
      neighboringSComparison:'S_label<=4*S_ref for |ell_label-ell_ref|<=2 and ell_ref>=8.'}));
  if([...frame,...leftFrame,...n,...nPrime,...invN,...P,...inverseP,...forcing,...matrix,...w,...amplitude,...pressure,
    ...mapped.flatMap(r=>[r.amplitudePower,r.pressurePower])].some(p=>!Number.isSafeInteger(p)||p<0))
    fail('The finite original forced derivative exponent recurrence exceeded its exact representation budget.','RESOURCE_LIMIT');
  return {schema:'MathScope.N6.OriginalStableForcedClassPowers/1',order,mixed,frame,leftFrame,n,nPrime,invN,projection,
    P,inverseP,inversePRows,sourcePathPullbackPowers,forcing,matrix,w,recurrence,amplitude,pressure,mapped,
    stableIdentity:'M_m=M_1-(m^2-1)*d*I; V_m(v,u)=exp(-(m^2-1)*integral_u^v d)*V_1(v,u).',
    originalDampingNonnegativeRequired:true,onlyNonzeroHarmonics:true,propagatorIndependentOfMaximumHarmonic:true,
    fullComplexPressureFormula:'pi_m=i/(k*m)*(n.K.t-n_prime.t+n.f)/|n|^2',
    inputDerivativeOrder:order,inputWAlphaSeminormStillRequired:true,inputSPowerPreserved:true,inputBoundaryPolePreserved:true,
    inputNormalization:{referenceS:'S_ref=ell_ref^2',completePullbackIncludedInInput:true,
      epsilon:'epsilon_ref^alpha',boundary:'sqrt(zeta_ref)*delta_ref^-a',
      neighboringInputConstant:'A local-label source bound F_m*S_label^b first contributes 4^b to the common-reference input F_m; every epsilon/zeta/chart ratio must also be retained there.',
      localInputNormAutomaticallyConverted:false,sourceCoefficientPullbackBudgetRetainedSeparately:true},
    backgroundPrefix:{coefficientDerivativeOrder:order,normalDerivativeOrder:order+1,
      requiredBackgroundDerivativeOrder:order+2,largerGenericLedgerOrder:order+1,
      proof:'Only coefficient/frame/P prefixes through m are consumed. Their n-prime entries use n through m+1 and hence F,G through m+2. The extra generic ledger rows beyond that prefix are not asserted under this lower background bound.'},
    amplitudeEpsilonExponentChange:'0',pressureEpsilonExponentChange:'1/2',
    coefficientConstantBase:'K_m>=max(2, B_m, maximum absolute harmonic, Lmax, all fixed affine common-torus factors).',
    estimate:'Every derivative through m is bounded by the common-reference input F_m*W^(m+1)*(K_m*S_ref)^p times its retained reference epsilon/zeta/pole factors and P; pressure gains sqrt(epsilon_ref), with any local/reference epsilon ratio included in F_m.',
    polynomialSNotAbsoluteMatrixGronwall:true,allMixedBinomialSubsetsRetained:true,sourceAuthenticated:false,completeN6:false};
}

const record=p=>({schema:p.schema,request:p.request,source:p.source,stableBindings:p.stableBindings,
  actualInverses:p.actualInverses,powers:p.powers,constants:p.constants,operatorRows:p.operatorRows,
  checks:p.checks,scope:p.scope});

/** Actual-source attachment. This is deliberately AFTER the complete
 * forced source construction. A serialized certificate or generic kernel
 * object cannot bind these uniform operator constants to a current.
 */
export function attachGlobalForcedClassOperator(forced,input={},context={}){
  assertGlobalForcedCurrent(forced);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))
    fail('Select requested finite order only; actual source, frame, bounds and harmonic inventory are fixed.','INVALID_INPUT');
  const request={order:input.order??0,maxWork:input.maxWork??100000},powers=originalStableForcedClassPowers(request),G=forced.G,
    current=forced.input.mean.temporal.pressure.current,band=current.band,family=band.family,
    ownStart=G.nodes.length,originalStart=current.G.nodes.length;
  assertActualCommonAdmissibleFamily(family);
  const row=family.source.backgroundNorms.gaussianRows.find(r=>r.derivativeOrder===request.order),c=family.constants;
  if(!row||row.backgroundDerivativeOrder!==request.order+2||!Number.isSafeInteger(row.B_m)||!G.nodes[row.B_m])
    fail('The same actual family must generate its requested complete C_(m+2) background norm before this operator bound.','RESOURCE_LIMIT');
  const q=(n,d=1)=>G.q(n,d),E=G.pow(c.Bnorm,256),W=G.exp(G.mul(q(3),E,c.Lmax)),
    maximumHarmonic=Math.max(...forced.templates.flatMap(t=>t.forced.map(f=>f.m))),
    sqrtTwo=G.sqrt(q(2)),Tg=G.add(q(4),sqrtTwo),
    // ||lambda_t|| and ||I-v_t lambda_t|| have fixed source constants;
    // ci_label^-1*Tg^delta<=Tg^5*S_label follows from the original index.
    commonAffineFactor=G.mul(q(16),G.pow(Tg,5)),pressureReferenceFactor=G.exp(G.mul(c.h,G.log(q(2)))),
    K=G.maximum(q(4),row.B_m,q(maximumHarmonic),c.Lmax,commonAffineFactor),
    stableBindings=band.families.map(f=>{
      const original=current.G.covarianceSystems[f.system],binding=normalizedHomogeneousPulseBinding(current.G,{
        v:band.coordinates.v,length:band.geometry.Ls,lambda:f.frame.reference.lambda,dref:f.frame.reference.dref,
        damping:f.frame.actualDamping,projected:f.frame.projected,error:f.frame.projectedError,
        matrix:original.matrix,P:f.P,initial:original.initial},context);
      return {sign:f.sign,system:f.system,binding,graphNamespace:'originalCurrent.G',originalNormal:f.frame.n,originalMatrix:original.matrix,
        originalB:f.frame.B,sourceFrameLowerBounds:family.uniformCovariance.primitiveProof.frame,
        sameSourceS:'S_label=ell_label^2',bound:'mu_infinity(M_1)<=3*Bnorm^256/S_label; Ls<=Lmax*S_label'};
    }),actualInverses=forced.templates.flatMap(t=>t.forced.map(f=>{
      assertForcedAngularInverse(f.inverse);assertOriginalFixedLiftPulsePath(G,f.path);
      const old=forced.input.templates.find(x=>x.key===t.key),w=f.inverse.input.variable,
        normal=old.sourceFrame.normalBeforePath.map(x=>G.substitute(x,old.sourceFrame.pulseVariable,w)),
        expectedK=old.principalK,extraDamping=G.mul(q(f.m*f.m-1),f.inverse.damping),
        expectedMatrix=f.inverse.Aphi.map((r,i)=>r.map((x,j)=>i===j?G.sub(x,G.mul(q(f.m*f.m),f.inverse.damping)):x)),
        verify=createQuadraticSourceVerifier(G,{maxTerms:120000}),
        dampingChecks=expectedMatrix.flatMap((r,i)=>r.map((x,j)=>({row:i,column:j,
          ...verify(G.sub(x,f.inverse.matrix[i][j]))}))),
        originalInputs=same(f.inverse.normal.value,normal)&&same(f.inverse.K,expectedK)&&f.inverse.k===band.geometry.k&&
          f.inverse.epsilon===band.geometry.epsilon&&f.inverse.input.length===band.geometry.Ls;
      return {key:t.key,m:f.m,system:f.inverse.system,source:f.inverse.source,normal:f.inverse.normal.value,K:f.inverse.K,
        fullPressure:f.inverse.pressure,extraDamping,dampingChecks,originalInputs,
        sourcePath:f.path,sourceChecks:f.checks,sourceScope:f.sourcePathInvariance,
        negativeModeVerified:f.signedSolutions.length===2&&f.signedSolutions[1].checks.every(x=>x.pass),
        inputClass:'The exact retained full source f_m, with all mean/wave/pressure terms and the actual H_w/chart pullback, needs its own common-reference W_alpha seminorm through this order.'};
    })),operatorRows=powers.mapped.map(p=>({order:p.order,inputOrder:p.order,
      amplitudeConstant:G.mul(G.pow(W,p.order+1),G.pow(K,3*p.amplitudePower)),amplitudeSPower:p.amplitudePower,
      pressureConstant:G.mul(pressureReferenceFactor,G.pow(W,p.order+1),G.pow(K,3*p.pressurePower)),pressureSPower:p.pressurePower,
      amplitudeEpsilonGain:'0',pressureEpsilonGain:'1/2',inputBoundaryPoleAdded:0,
      factorMeaning:'Multiply by the actual maximum common-reference input W_alpha seminorm through this order. The operator-only S_label power consumes two additional K powers per S power. Pressure additionally retains 2^h for sqrt(epsilon_label/epsilon_ref); the input 4^b and exact epsilon/zeta/chart ratios remain in the input seminorm.',
      actualInputSeminormSupplied:false})),
    checks=[
      {id:'same-private-actual-forced-current-and-common-family',pass:family.scope.allFixedDerivativeClausesBySameRecipe&&family.uniformCovariance.universalAnalyticRecipeSourceBound},
      {id:'actual-requested-complete-background-Cm-plus-two',pass:row.backgroundDerivativeOrder===request.order+2&&G.freeCoordinates(row.B_m).size===0},
      {id:'both-original-normalized-homogeneous-frame-bindings',pass:stableBindings.length===2&&stableBindings.every(x=>x.binding.checks.every(y=>y.pass))},
      {id:'all-actual-forced-systems-and-negative-pressure-partners',pass:actualInverses.length===20&&actualInverses.every(x=>x.originalInputs&&x.negativeModeVerified&&x.dampingChecks.every(y=>y.pass)&&x.sourceChecks.every(y=>y.pass))},
      {id:'only-additional-damping-not-an-absolute-Gramian-exponential',pass:actualInverses.every(x=>x.m>=1)&&powers.polynomialSNotAbsoluteMatrixGronwall&&powers.propagatorIndependentOfMaximumHarmonic},
      {id:'constant-roots-are-source-only-and-input-norm-is-unfilled',pass:[K,W,...operatorRows.flatMap(r=>[r.amplitudeConstant,r.pressureConstant])].every(x=>G.freeCoordinates(x).size===0)&&operatorRows.every(x=>!x.actualInputSeminormSupplied)}];
  if(checks.some(x=>!x.pass))fail('The stable class operator does not bind the exact forced source: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const result={schema:'MathScope.N6.ActualForcedStableClassOperator/1',G,forced,request,
    source:{paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,
      originalFamilyDerivativeOrder:family.request.derivativeOrder,backgroundNorm:copy(row),
      fixedDomain:'Same authenticated common qBig of Lemma9.7; no order or harmonic threshold shrink.',sourcePages:[78,79,80],equations:['7.13','7.17','7.18','7.19','7.20']},
    stableBindings,actualInverses,powers,constants:{E,W,K,maximumHarmonic,commonAffineFactor,pressureReferenceFactor,
      pressureReferenceProof:'|ell_label-ell_ref|<=2 gives sqrt(epsilon_label/epsilon_ref)<=2^h exactly.'},operatorRows,checks,
    scope:{actualStableOperatorBoundToAllCurrentForcedSystems:true,actualRequestedFixedOperatorNormsConstructed:true,
      fullMovingNormalSourcePressureAndConjugatesRetained:true,absoluteMatrixTailUsedAsSBound:false,
      actualInputForcingWClassCertified:false,actualCompleteCurrentClassCertified:false,
      subsequentSignedAndMeanStagesConstructed:false,allFiniteStagesClassCertified:false,completeN6:false,newLeanKernelProof:false}};
  seals.set(result,{G,forced,ownStart,count:G.nodes.length,ownNodes:canonicalStringify(G.nodes.slice(ownStart)),
    definitions:G.captureFunctionDefinitions(),originalG:current.G,originalStart,originalCount:current.G.nodes.length,
    originalNodes:canonicalStringify(current.G.nodes.slice(originalStart)),originalDefinitions:current.G.captureFunctionDefinitions(),
    record:canonicalStringify(record(result))});return result;
}

export function assertGlobalForcedClassOperator(p){
  const s=seals.get(p);if(!s||s.G!==p.G||s.forced!==p.forced||s.record!==canonicalStringify(record(p))||
    s.ownNodes!==canonicalStringify(p.G.nodes.slice(s.ownStart,s.count))||!p.G.functionDefinitionsUnchanged(s.definitions)||
    s.originalG!==p.forced.input.mean.temporal.pressure.current.G||
    s.originalNodes!==canonicalStringify(s.originalG.nodes.slice(s.originalStart,s.originalCount))||
    !s.originalG.functionDefinitionsUnchanged(s.originalDefinitions))
    fail('Use the unchanged actual forced-operator class attachment.');
  assertGlobalForcedCurrent(p.forced);return true;
}

export async function globalForcedClassOperatorCertificate(p){
  assertGlobalForcedClassOperator(p);const data=record(p),encoded=canonicalStringify(data);
  return {...data,schema:'MathScope.N6.ActualForcedStableClassOperatorCertificate/1',
    bindingSHA256:await sha256(encoded),sourceGraphNamespace:'actualForced.G',
    integerExpressionRootsAreNotNumericalNormValues:true};
}
