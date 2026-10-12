/** Constructive C2 part of the original summed background.
 *
 * Every coefficient is the actual repaired tuple. The canonical cutoff
 * sequence is computed by one fixed finite recipe at each n. The uniform
 * derivative proof uses its closed induction, not a truncation equated to
 * the infinite field. Weighted stress and the physical flat residual are
 * separate clauses and are never asserted by this certificate.
 */
import {prepareActualOrderInduction,assertActualOrderInduction} from './actual-residual-order-induction-source.mjs';
import {attachActualCanonicalCutoffs,assertActualNormalizedCutoffs,actualNormalizedFiniteBlock} from './actual-residual-order-induction-cutoffs.mjs';
import {verifyActualInductionInnerEquations,verifyActualInductionMoments,verifyActualInductionParametricKernel} from './actual-residual-order-induction-proof.mjs';
import {sourceAllOrderCutoffJets} from './actual-residual-order-induction-kernels.mjs';
import {actualLeadingEnlargedC2,importActualPositiveNorm} from './actual-leading-enlarged-c2.mjs';
import {actualSupportOrderProof} from './actual-continuation-exact-support.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {factorial,readRational,fail} from './actual-continuation-arithmetic.mjs';

const choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const certificates=new WeakMap();

/** Positive ordinary calculus in the COMMUTING profile coordinates
 * (log q, X, eta). It is used only for derivative bounds. */
function profileCalculus(G){
  const q=(n,d=1)=>G.q(n,d),fn=body=>{const cache=new Map();return {get(e=0,r=0,m=0){const key=[e,r,m].join(':');if(!cache.has(key))cache.set(key,body(e,r,m));return cache.get(key);}};};
  const constant=v=>fn((e,r,m)=>e||r||m?G.zero:v),add=(...f)=>fn((e,r,m)=>G.add(...f.map(v=>v.get(e,r,m))));
  const multiply=(a,b)=>fn((e,r,m)=>{const terms=[];for(let i=0;i<=e;i++)for(let j=0;j<=r;j++)for(let k=0;k<=m;k++)terms.push(G.mul(q(choose(e,i)*choose(r,j)*choose(m,k)),a.get(i,j,k),b.get(e-i,r-j,m-k)));return G.add(...terms);});
  const mul=(...fs)=>fs.reduce(multiply,constant(G.one));return {fn,constant,add,mul};
}

/** The exact source chart has T=s*(1-eta^2), Z=s^D*eta,
 * X=R^2/(2s), s=q/Q. Q is fixed in every derivative. */
export function actualBackgroundChartBound(cutoffs,context={}){
  assertActualNormalizedCutoffs(cutoffs);if(!cutoffs.canonical)fail('INVALID_SOURCE_CONSTRUCTION','The background must use the canonical, prefix-independent cutoff sequence.');
  const {G}=cutoffs,norms=cutoffs.normPrefixes[1];if(!norms)fail('RESOURCE_LIMIT','The C2 finite block includes actual orders one and two.');
  const block=actualNormalizedFiniteBlock(cutoffs,{derivativeOrder:2}),q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),{fn,constant:C,add,mul}=profileCalculus(G),Xlo=norms.normalized[0].domain.X[0],Xhi=norms.normalized[0].domain.X[1];
  const zero=C(G.zero),x=fn((e,r,m)=>e||m?G.zero:r===0?Xhi:r===1?G.one:G.zero),eta=fn((e,r,m)=>e||r?G.zero:m===0||m===1?G.one:G.zero),d=fn((e,r,m)=>e||r?G.zero:m===0?G.one:m<=2?q(2):G.zero);
  const invL=fn((e,r,m)=>e||r?G.zero:q(2n*factorial(m)*8n**BigInt(m))),sInverse=fn((e,r,m)=>r||m?G.zero:q(2)),sMinusD=fn((e,r,m)=>r||m?G.zero:q(2));
  const radial=fn((e,r,m)=>m?G.zero:G.mul(q(2n*factorial(r),1n<<BigInt(e)),G.sqrt(Xhi),G.pow(Xlo,-r)));
  const rows=[
    {name:'R',coefficients:[zero,radial,zero],exact:['0','sqrt(2X/s)','0']},
    {name:'Z',coefficients:[mul(C(q(2)),eta,sMinusD,invL),mul(C(q(2)),eta,x,sMinusD,invL),mul(d,sMinusD,invL)],exact:['2*eta*s^(-D)/L','-2*eta*X*s^(-D)/L','d*s^(-D)/L']},
    {name:'T',coefficients:[mul(sInverse,invL),mul(x,sInverse,invL),mul(C(q(1,2)),eta,sInverse,invL)],exact:['1/(s*L)','-X/(s*L)','-D*eta/(s*L)']}
  ];
  const firstRows=rows.map(({coefficients,...metadata})=>({...metadata,sum:G.add(...coefficients.map(f=>f.get())),firstDerivatives:[[1,0,0],[0,1,0],[0,0,1]].map(v=>G.add(...coefficients.map(f=>f.get(...v))))}));
  const operatorA=G.maximum(G.one,...firstRows.map(r=>r.sum)),operatorB=G.maximum(G.one,...firstRows.flatMap(r=>r.firstDerivatives)),second=G.add(G.pow(operatorA,2),G.mul(operatorA,operatorB)),operatorC2=G.maximum(G.one,operatorA,second);
  const multiplierF=fn((e,r,m)=>m?G.zero:G.div(G.mul(q(4n*2n**BigInt(e)*factorial(r)),G.pow(Xlo,-r)),G.sqrt(G.mul(q(2),Xlo))));
  const multiplierV=fn((e,r,m)=>r||m?G.zero:q(2)),multiplierRadial=fn((e,r,m)=>r||m?G.zero:q(2,1n<<BigInt(e))),multiplierRawF=fn((e,r,m)=>r||m?G.zero:q(4n*2n**BigInt(e)));
  const unitProfile=fn(()=>G.one),multiplierRows=[];
  const multiplierBound=(name,f)=>{const product=mul(f,unitProfile),jets=[];for(let e=0;e<=2;e++)for(let r=0;e+r<=2;r++)for(let m=0;e+r+m<=2;m++)jets.push({eulerOrder:e,radialOrder:r,etaOrder:m,upper:product.get(e,r,m)});const bound=G.maximum(...jets.map(r=>r.upper));multiplierRows.push({name,jets,bound});return bound;};
  const Ffactor=multiplierBound('s^(-A-1/2)/sqrt(2X)',multiplierF),Vfactor=multiplierBound('s^(-A)',multiplierV),bfactor=multiplierBound('s^(-1/2)',multiplierRadial),rawFfactor=multiplierBound('s^(-A-1/2) times the profile angular velocity F0',multiplierRawF);
  // q^(2h)=epsilon^2*s^(2h), 1/2<=s<=2, 0<h<1.
  // The extra factor4 is deliberately uniform. Derivatives of q^(2h)
  // were already included in the actual profile Euler bounds.
  const Ferror=G.mul(q(4),operatorC2,Ffactor,block.coefficient),Gerror=G.mul(q(4),operatorC2,Vfactor,block.coefficient),bError=G.mul(q(4),operatorC2,bfactor,block.coefficient);
  const leadingRadial=G.maximum(...norms.leadingNormalized.radialBracket.map(r=>r.upper)),leadingU=G.maximum(...norms.leadingNormalized.U.map(r=>r.upper)),bLeading=G.mul(operatorC2,bfactor,leadingRadial),Gleading=G.mul(operatorC2,Vfactor,leadingU);
  const FGM=G.maximum(G.one,Ferror,Gerror),bM=G.add(bLeading,bError),Gtotal=G.add(Gleading,Gerror),FActiveLeading=norms.leadingNormalized.FActive.length?G.maximum(...norms.leadingNormalized.FActive.map(r=>r.upper)):null,FActiveChart=FActiveLeading===null?null:G.mul(operatorC2,rawFfactor,FActiveLeading);
  // This last F0 bound is on X<=Xplus only. It is NOT relabeled as a
  // bound on the entire enlarged annulus. Proximity is global because
  // every positive-order correction is exactly zero beyond Xplus.
  // The full leading bound has its own internally constructed source
  // proof: unchanged inner field + original closed annulus + actual
  // terminal Gamma heat field. It is not extrapolated from F0active.
  const enlarged=actualLeadingEnlargedC2({sourceProfile:norms.leading.profileId},context);
  if(!enlarged.pass||enlarged.parameterExpressionSHA256!==norms.leading.parameterExpressionSHA256||!enlarged.scope.actualEnlargedAnnulusLeadingC2Bounded||enlarged.bounds.F0.derivativeConvention!=='ordinary physical X and ordinary eta, total order<=2')fail('INVALID_SOURCE_CONSTRUCTION','The full leading angular C2 bound is missing its actual enlarged source domain.');
  const FLeadingRaw=importActualPositiveNorm(G,enlarged.normProgram,enlarged.bounds.F0.root),Fleading=G.mul(operatorC2,rawFfactor,FLeadingRaw),Ftotal=G.add(Fleading,Ferror);
  return {schema:'MathScope.ActualCompletedBackgroundChartC2/1',profileCoefficient:block.coefficient,finiteBlock:block,operatorA,operatorB,operatorC2,operatorRows:firstRows,multiplierRows,
    roots:{FErrorConstant:Ferror,GErrorConstant:Gerror,FGErrorConstant:FGM,bErrorConstant:bError,bLeadingConstant:bLeading,bTotalConstant:bM,FLeadingConstant:Fleading,FTotalConstant:Ftotal,GLeadingConstant:Gleading,GTotalConstant:Gtotal,...(FActiveChart===null?{}:{FLeadingOnPositiveSupportConstant:FActiveChart})},
    domain:{X:[Xlo,Xhi],eta:['-1','1'],qOverQ:['1/2','2'],q:['positive','<=1'],Q:['positive','<=1/2'],closedEtaEndpoints:true,timeEndpoint:'T=0 one-sided'},
    chart:{coordinateFrame:'BAND_CHART_Q_FIXED',T:'s*(1-eta^2)',Z:'s^D*eta',R:'sqrt(2*s*X)',s:'q/Q',epsilon:'Q^h',L:'1-2*h*eta^2',D:'1/2-h',A:'1/2+h',
      qEuler:'partial_(log q) holding X,eta',slowTimeDerivative:'partial_T, with tau=Q*T; the physical normalized time operator is -epsilon*partial_T'},
    exactFields:{F:'s^(-A-1/2)*[F0+sum_(n>=1) chi(c_n*q)*q^(2nh)*F_n]',G:'s^(-A)*[U0+sum_(n>=1) chi(c_n*q)*q^(2nh)*U_n]',
      b:'epsilon*s^(-1/2)*[V0/sqrt(2X)+sum_(n>=1)q^(2nh)*(chi(c_n*q)*V_n-2*eta/L*(c_n*q)*chi_prime(c_n*q)*M_n)/sqrt(2X)]'},
    bounds:{FGDifference:{constant:FGM,power:'epsilon^2',derivatives:'each ordinary slow derivative of total order<=2',comparison:'actual order-zero chart fields at the same slow point'},
      radialDifference:{constant:bError,power:'epsilon^3'},radialTotal:{constant:bM,power:'epsilon'},FTotal:{constant:Ftotal,power:'1'},GTotal:{constant:Gtotal,power:'1'},
      leadingFOnPositiveOrderSupport:{rawProfileJetConstant:FActiveLeading,rawProfileConvention:'F0=E0/sqrt(2X), ordinary physical X/eta derivatives',slowChartC2Constant:FActiveChart,
        slowChartConvention:'s^(-A-1/2)*F0 with ordinary R,Z,T derivatives',rawDomain:norms.leadingNormalized.FActiveDomain,slowDomain:{X:[Xlo,norms.leadingNormalized.FActiveDomain.X[1]],eta:['-1','1'],qOverQ:['1/2','2']}},
      leadingFOnEnlargedAnnulus:{rawProfileJetConstant:FLeadingRaw,slowChartC2Constant:Fleading,sourceParameterExpressionSHA256:enlarged.parameterExpressionSHA256,
        sourceDomain:enlarged.bounds.F0.domain,regions:enlarged.regions.map(r=>({interval:r.interval,producer:r.producer})),checks:enlarged.checks,sourceBindings:enlarged.sourceBindings},leadingFOnEnlargedAnnulusSupplied:true},
    derivation:{composition:'D_iD_j f=sum a_ik*a_jl*f_kl + sum a_ik*(partial_k a_jl)*f_l. The executed row sums give A^2+A*B; no derivative of a chart Jacobian is omitted.',
      multipliers:'Each ordinary profile derivative of each normalization factor is included by the full binomial Leibniz sum.',
      actualSequence:'The finite block uses actual n=1 and n=2. The n>=3 tail uses the all-order diagonal inequality, so its first q power is at least3h.',
      leadingRadial:'The actual complete U0 and its radial average generate V0/X. No zero radial background is assumed on Imean.'},
    scope:{actualNormalizedProximityConstantsComputed:true,wholeEnlargedAnnulusProximity:true,sourceProfileReplaced:false,finiteTruncationCalledComplete:false,
      fullLeadingFAbsoluteBoundPending:false,fullProposition55ResidualAndStressCertified:false,originalN506Complete:false}};
}

/** Exact finite query of the locally finite function. The source time
 * cutoff is the chosen C-infinity linear-exponential cutoff, including
 * its full derivative body and flat endpoint extensions. */
function timeCutoff(G){
  const t=G.fresh('actual_summation_cutoff_argument'),u=G.sub(G.mul(G.q(2),t),G.one),a=G.exp(G.neg(G.inv(u))),b=G.exp(G.neg(G.inv(G.sub(G.one,u)))),body=G.choose(t,G.q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero);
  return G.defineExpressionFunction({name:'ActualOriginalSummationTimeCutoff',parameters:[t],body,derivativeLimits:[G.maxDerivativeOrder??128],source:'chi(s)=1-sigma1(2s-1), sigma1 uses exp(-1/t); exact flat endpoints and generated all-order jets.'});
}

function buildActualPrefix(certificate,{qValue,possibleLast,plateauThrough=0},context){
  const {G,prepared,cutoffs}=certificate,q=(n,d=1)=>G.q(n,d),{X,eta}=prepared.bootstrap.constants,{A,L}=G.core,h=G.parameter('h'),sqrt2X=G.sqrt(G.mul(q(2),X)),chiSystem=timeCutoff(G),rows=[],E0=G.mul(sqrt2X,prepared.records[0].global.F),U0=prepared.records[0].global.U,M0=prepared.bootstrap.finalM,V0=G.mul(X,prepared.records[0].global.v),angular=[E0],axial=[U0],radial=[G.div(V0,sqrt2X)],stream=[M0];
  for(let n=1;n<=possibleLast;n++){
    context.checkCancelled?.();const r=prepared.records[n],scale=cutoffs.rows[n-1].scale,sigma=G.mul(scale,qValue),chi=n<=plateauThrough?G.one:G.expressionValue(chiSystem,[sigma]),extra=n<=plateauThrough?G.zero:G.mul(sigma,G.expressionValue(chiSystem,[sigma],[1])),power=G.exp(G.mul(q(2*n),h,G.log(qValue))),M=r.global.M,V=G.mul(X,r.global.v);
    const theta=G.mul(power,chi,sqrt2X,r.global.F),z=G.mul(power,chi,r.global.U),bracket=G.div(G.mul(power,G.sub(G.mul(chi,V),G.div(G.mul(q(2),eta,extra,M),L))),sqrt2X),potential=G.mul(power,chi,M);
    angular.push(theta);axial.push(z);radial.push(bracket);stream.push(potential);rows.push({order:n,actualCoefficientRoots:{F:r.global.F,U:r.global.U,M,V},sigma,chi,extraCutoff:extra,qPower:power,angular:theta,axial:z,radialBracket:bracket,stream:potential});
  }
  const angularNormalized=G.add(...angular),roots={q:qValue,angularNormalized,axialNormalized:G.add(...axial),radialNormalized:G.add(...radial),profileAngularVelocity:G.div(angularNormalized,sqrt2X),physicalStream:G.mul(G.exp(G.mul(G.sub(G.one,A),G.log(qValue))),G.add(...stream))};
  return {rows,roots,chiSystem};
}

export function actualBackgroundFiniteQuery(certificate,input={},context={}){
  assertActualCompletedBackgroundC2(certificate);for(const k of Object.keys(input))if(!['qExact','anchorOrder'].includes(k))fail('INVALID_INPUT','Supply a positive rational q or an internally constructed canonical anchor.');
  if(input.qExact!==undefined&&input.anchorOrder!==undefined)fail('INVALID_INPUT','Choose one actual q representation.');
  const {G,prepared,cutoffs}=certificate,q=(n,d=1)=>G.q(n,d);let qValue,possibleLast,offFrom,proof,anchor;
  if(input.qExact!==undefined){
    const v=readRational(input.qExact);if(v[0]<=0n||v[0]>v[1])fail('INVALID_INPUT','The exact rational q must lie in (0,1].');
    let numerator=v[0],n=0;while(numerator<v[1]){context.checkCancelled?.();numerator*=2n;n++;if(n>prepared.order+1)fail('RESOURCE_LIMIT','Generate all coefficients potentially active for this positive q; a missing prefix is not a completed field.');}
    offFrom=Math.max(1,n);possibleLast=offFrom-1;qValue=q(...v);proof={kind:'EXACT_POSITIVE_RATIONAL',qExact:[String(v[0]),String(v[1])],inequality:'2^offFrom*q>=1, c_n>=2^n, hence chi and every derivative vanish for all n>=offFrom',left:String(numerator),right:String(v[1])};
  }else{
    anchor=input.anchorOrder??1;if(!Number.isSafeInteger(anchor)||anchor<1||anchor+1>prepared.order)fail('RESOURCE_LIMIT','A canonical interior query requires its anchor and the next actual coefficient.');
    qValue=G.div(q(1,4),cutoffs.rows[anchor-1].scale);possibleLast=anchor+1;offFrom=anchor+2;proof={kind:'CANONICAL_INTERIOR',anchorOrder:anchor,q:'1/(4*c_anchor)',inequality:'n<=anchor gives c_n*q<=1/4 and chi=1; n>=anchor+2 gives c_n*q>=1 and every cutoff derivative=0; the remaining coefficient uses the actual chi body.',qPositive:true};
  }
  if(possibleLast>prepared.order)fail('RESOURCE_LIMIT','The complete active source prefix has not been generated.');
  const {rows,roots}=buildActualPrefix(certificate,{qValue,possibleLast,plateauThrough:anchor??0},context);
  return {schema:'MathScope.ActualCompletedBackgroundFiniteQuery/1',q:qValue,rows,roots,completeActiveFamily:true,potentiallyActiveLastOrder:possibleLast,allLaterInactiveFrom:offFrom,proof,
    sourceBindings:{profileId:prepared.program.profileId,parameterExpressionSHA256:prepared.program.parameterExpressionSHA256,canonicalSequence:true},
    normalization:{angular:'q^A*u_theta',axial:'q^A*u_z',radial:'q^(1/2)*u_r',physicalStream:'S0+sum chi(c_n*q)*S_n'},
    observationKind:'EXACT_CONVERGENT_SOURCE_FUNCTION_EXPRESSIONS',numericalValuesEnclosed:false,sourceUnderflowReplacedByZero:false,
    completeFieldAtDeclaredQ:true,fullProposition55ResidualAndStressCertified:false};
}

/** An actual symbolic source FAMILY on a proved compact q band. This
 * supplies q derivatives to the phase/ODE builder. It is not a fixed-q
 * substitute and not a named oracle: every returned expression has the
 * actual finite source body, whose omitted tail is identically zero on
 * the entire declared band.
 */
export function actualBackgroundSymbolicPrefix(certificate,input={},context={}){
  assertActualCompletedBackgroundC2(certificate);for(const k of Object.keys(input))if(!['anchorOrder','derivativeOrder','dyadicBand'].includes(k))fail('INVALID_INPUT','The compact source band is selected from the actual canonical cutoff sequence.');
  const anchorOrder=input.anchorOrder??1,derivativeOrder=input.derivativeOrder??2,dyadicBand=input.dyadicBand??false,{G,prepared,cutoffs}=certificate;
  if(typeof dyadicBand!=='boolean')fail('INVALID_INPUT','dyadicBand must be a boolean.');
  const extra=dyadicBand?3:2;
  if(!Number.isSafeInteger(anchorOrder)||anchorOrder<1||anchorOrder+extra>prepared.order)fail('RESOURCE_LIMIT','Generate the actual anchor+'+extra+' coefficient before requesting this entire compact q band.');
  if(!Number.isSafeInteger(derivativeOrder)||derivativeOrder<0)fail('INVALID_INPUT','Use a finite ordinary derivative order.');G.derivativeBudget(derivativeOrder);
  const anchorScale=cutoffs.rows[anchorOrder-1].scale,logTwo=G.log(G.q(2)),ell=dyadicBand?G.ceiling(G.div(G.add(G.log(G.q(4)),cutoffs.rows[anchorOrder-1].logScale),logTwo)):null;
  const Q=dyadicBand?G.exp(G.neg(G.mul(ell,logTwo))):G.div(G.q(1,4),anchorScale),qVariable=G.fresh('actual_completed_background_q'),{X,eta}=prepared.bootstrap.constants,built=buildActualPrefix(certificate,{qValue:qVariable,possibleLast:anchorOrder+extra,plateauThrough:anchorOrder},context),roots={},jets={};
  for(const [field,body] of Object.entries(built.roots)){
    if(field==='q')continue;const root=G.share(body,[qVariable,X,eta],'ActualCompletedBackground_'+field+'_Band'+anchorOrder);roots[field]=root;jets[field]=[];
    for(let e=0;e<=derivativeOrder;e++)for(let r=0;e+r<=derivativeOrder;r++)for(let m=0;e+r+m<=derivativeOrder;m++){
      let value=root;for(let j=0;j<e;j++)value=G.mul(qVariable,G.derivative(value,qVariable));for(let j=0;j<r;j++)value=G.derivative(value,X);for(let j=0;j<m;j++)value=G.derivative(value,eta);
      jets[field].push({eulerOrder:e,radialOrder:r,etaOrder:m,value});
    }
  }
  return {schema:'MathScope.ActualCompletedBackgroundSymbolicBand/1',qVariable,Q,ell,dyadicBand,coordinates:{q:qVariable,X,eta},roots,jets,rows:built.rows,cutoffSystem:built.chiSystem,derivativeOrder,
    bandSelection:dyadicBand?{kind:'ORIGINAL_DYADIC_BAND',definition:'ell=ceil(log(4*c_anchor)/log(2)), Q=2^(-ell)',ellPositiveInteger:true,
      QBounds:[G.div(G.q(1,8),anchorScale),G.div(G.q(1,4),anchorScale)],proof:'x<=ceil(x)<x+1 gives 1/(8*c_anchor)<=Q<=1/(4*c_anchor). The positive exact source scale and integer are not converted to binary64.'}
      :{kind:'CANONICAL_NON_DYADIC_BAND',definition:'Q=1/(4*c_anchor)',originalDyadicLabelClaimed:false},
    domain:{q:[G.div(Q,G.q(2)),G.mul(G.q(2),Q)],qOverQ:['1/2','2'],X:certificate.chart.domain.X,eta:['-1','1'],QPositive:true},
    exactInactiveTail:{from:anchorOrder+extra+1,proof:dyadicBand?'c_n>=2^(n-anchor)*c_anchor and q>=1/(16*c_anchor), so c_n*q>=1 for every n>=anchor+4. All cutoff derivatives vanish there.':'c_n>=2^(n-anchor)*c_anchor and q>=1/(8*c_anchor), so c_n*q>=1 for every n>=anchor+3. All cutoff derivatives vanish there.'},
    exactPlateau:{through:anchorOrder,proof:'c_n<=c_anchor and q<=1/(2*c_anchor), so chi=1 and all positive cutoff derivatives=0 for every n<=anchor.'},
    sourceBindings:{profileId:prepared.program.profileId,parameterExpressionSHA256:prepared.program.parameterExpressionSHA256,canonicalSequence:true},
    representation:'Actual shared function body plus arbitrary finite AD materializer; no coefficient values or derivatives are supplied by the caller.',
    qDerivativePreserved:true,allInactiveSourceTermsProvedZero:true,completeBackgroundOnDeclaredBand:true,
    mathematicalLocalFinitenessForAllQ:true,thisFiniteBandEqualsAllBands:false,numericalCoefficientValuesEnclosed:false,
    fullProposition55ResidualAndStressCertified:false,originalN506Complete:false};
}

/** Definition of the SAME locally finite source on EVERY positive integer
 * dyadic band. This deliberately conservative finite algorithm needs
 * coefficients1..ell: c_n>=2^n and q>=2^(-ell-1) prove all n>=ell+1 off.
 * The anchor API is an efficient source-specific compression of this
 * definition, not a different all-band field. A huge requested integer
 * which exceeds the generated prefix returns RESOURCE_LIMIT before any
 * unsafe integer conversion or omission of possible source coefficients.
 */
export function actualBackgroundDyadicPrefix(certificate,input={},context={}){
  assertActualCompletedBackgroundC2(certificate);
  for(const k of Object.keys(input))if(!['ellExact','derivativeOrder'].includes(k))fail('INVALID_INPUT','Supply a positive exact dyadic integer and a finite derivative order.');
  const raw=input.ellExact,{G,prepared}=certificate,derivativeOrder=input.derivativeOrder??2;
  if(!(typeof raw==='string'&&/^[0-9]+$/.test(raw)||typeof raw==='bigint'||typeof raw==='number'&&Number.isSafeInteger(raw)))fail('INVALID_INPUT','ellExact must be an exact integer string, BigInt or safe integer.');
  const integerEll=BigInt(raw);if(integerEll<1n)fail('INVALID_INPUT','The original dyadic band label must be a positive integer.');
  if(integerEll>BigInt(prepared.order))fail('RESOURCE_LIMIT','Generate the actual coefficient prefix through ell before requesting this conservative all-band function. No possible active source term was discarded.');
  if(!Number.isSafeInteger(derivativeOrder)||derivativeOrder<0)fail('INVALID_INPUT','Use a finite ordinary derivative order.');G.derivativeBudget(derivativeOrder);
  const ell=G.q(integerEll),Q=G.exp(G.neg(G.mul(ell,G.log(G.q(2))))),qVariable=G.fresh('actual_completed_background_dyadic_q'),{X,eta}=prepared.bootstrap.constants,
    built=buildActualPrefix(certificate,{qValue:qVariable,possibleLast:Number(integerEll)},context),roots={},jets={};
  for(const[field,body]of Object.entries(built.roots)){
    if(field==='q')continue;const root=G.share(body,[qVariable,X,eta],'ActualCompletedDyadic_'+field+'_ell'+integerEll);roots[field]=root;jets[field]=[];
    for(let e=0;e<=derivativeOrder;e++)for(let r=0;e+r<=derivativeOrder;r++)for(let m=0;e+r+m<=derivativeOrder;m++){
      let value=root;for(let j=0;j<e;j++)value=G.mul(qVariable,G.derivative(value,qVariable));for(let j=0;j<r;j++)value=G.derivative(value,X);for(let j=0;j<m;j++)value=G.derivative(value,eta);
      jets[field].push({eulerOrder:e,radialOrder:r,etaOrder:m,value});
    }
  }
  return {schema:'MathScope.ActualCompletedBackgroundArbitraryDyadicBand/1',ellExact:String(integerEll),ell,Q,qVariable,coordinates:{q:qVariable,X,eta},roots,jets,rows:built.rows,cutoffSystem:built.chiSystem,derivativeOrder,
    bandSelection:{kind:'ARBITRARY_ORIGINAL_DYADIC_INTEGER',definition:'Q=2^(-ell), exact positive integer ell',ellPositiveInteger:true},
    domain:{q:[G.div(Q,G.q(2)),G.mul(G.q(2),Q)],qOverQ:['1/2','2'],X:certificate.chart.domain.X,eta:['-1','1'],QPositive:true},
    exactInactiveTail:{from:String(integerEll+1n),proof:'q>=2^(-ell-1) and c_n>=2^n imply c_n*q>=1 for every integer n>=ell+1. The complete smooth cutoff and all its derivatives vanish.'},
    sourceBindings:{profileId:prepared.program.profileId,parameterExpressionSHA256:prepared.program.parameterExpressionSHA256,canonicalSequence:true},
    recurrence:'For each finite positive integer ell, construct the fixed actual coefficient/norm/cutoff recipes for n=1..ell, then form the displayed body. Resource exhaustion is an explicit failure, never a complete prefix.',
    representation:'Actual finite source functions with retained q dependence and mixed AD; no unspecified coefficient or supplied norm.',
    qDerivativePreserved:true,allInactiveSourceTermsProvedZero:true,completeBackgroundOnDeclaredBand:true,
    sameCanonicalSequenceAsAnchorFamily:true,algorithmDefinedForEveryFiniteIntegerEll:true,thisFiniteBandEqualsAllBands:false,numericalCoefficientValuesEnclosed:false,
    fullProposition55ResidualAndStressCertified:false,originalN506Complete:false};
}

/** Actual right branches and the five completed moments justify the
 * compact global coefficients. A bare localized integral is never set0. */
function coefficientSupport(prepared){
  assertActualOrderInduction(prepared);const {G,records,bootstrap}=prepared,sourceOrder=actualSupportOrderProof(bootstrap.completedOrderOne),{X,eta}=bootstrap.constants,allowed=new Set(Object.entries(sourceOrder.endpoints).filter(([name])=>name!=='Xb').map(([,value])=>value));
  for(const pair of bootstrap.orderOne.supports)for(const r of pair)allowed.add(G.mul(bootstrap.orderOne.X0,G.pow(r,2)));
  const trace=[],cache=new Map();
  function zero(id){
    if(id===G.zero)return true;if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let value=false;
    if(op==='multiply')value=zero(args[0])||zero(args[1]);else if(op==='add')value=zero(args[0])&&zero(args[1]);
    else if(op==='integer_power'&&args[1]>0||op==='sqrt_positive')value=zero(args[0]);
    else if(op==='smooth_piecewise'&&args[0]===X&&allowed.has(args[2])){value=zero(args[5]);if(value)trace.push({node:id,afterEndpoint:args[2],afterBody:args[5]});}
    else if(op==='actual_expression_partial'){
      const s=G.expressionSystems[args[0]];if(s.parameters.every((p,j)=>args[1][j]===p)&&s.parameters.every(p=>p===X||p===eta)){value=zero(s.body);if(value)trace.push({node:id,body:s.body,derivative:args[2],rule:'all finite derivatives of the same smooth zero exterior'});}
    }
    cache.set(id,value);return value;
  }
  const rows=records.slice(1).map(r=>({order:r.order,fields:Object.fromEntries(['F','U','M','Pi','v'].map(name=>[name,zero(r.global[name])])),actualMomentChecks:r.global.actualMomentChecks.map(c=>c.pass),coreIdentities:verifyActualInductionInnerEquations(prepared,{order:r.order}).checks}));
  const pass=sourceOrder.pass&&rows.every(r=>Object.values(r.fields).every(Boolean)&&r.actualMomentChecks.every(Boolean));if(!pass)fail('INTERNAL_VALIDATION','An actual completed coefficient is missing its smooth zero exterior.');
  const n2=records[2],t=G.fresh('uncorrected_local_mass_variable'),bare=G.integral(G.substitute(n2.actual.U,X,t),t,G.zero,bootstrap.orderOne.Xcut);
  // The diagnostic below checks the reducer's refusal, not a nonzero
  // numerical value of the uncorrected mass at a selected eta.
  const bareLocalizedIntegralProvedZero=zero(bare);
  if(bareLocalizedIntegralProvedZero)fail('INTERNAL_VALIDATION','A localized integrand alone must not certify a zero total moment.');
  return {sourceOrder,rows,trace,bareLocalizedIntegralProvedZero,pass,scope:'actual coefficient support and all smooth exterior jets; stress conservation is a separate proof'};
}

function potentialIdentity(prepared){
  const {G}=prepared,q=(n,d=1)=>G.q(n,d),{X,eta}=prepared.bootstrap.constants,{A,D,d,L}=G.core,M=G.fresh('Stokes_actual_stream_slot'),U=G.fresh('Stokes_actual_stream_X_slot'),Meta=G.fresh('Stokes_actual_stream_eta_slot'),chi=G.fresh('Stokes_actual_cutoff_slot'),extra=G.fresh('Stokes_sigma_chi_prime_slot'),rows=[];
  for(let n=1;n<=prepared.order;n++){
    const nu=G.mul(q(2*n),G.parameter('h')),v=G.div(G.sub(G.sub(G.mul(q(2),eta,X,U),G.mul(q(2),eta,G.add(D,nu),M)),G.mul(d,Meta)),L);
    const differentiated=G.neg(G.div(G.add(G.mul(q(2),eta,G.add(G.sub(G.one,A),nu),chi,M),G.neg(G.mul(q(2),eta,chi,X,U)),G.mul(d,chi,Meta),G.mul(q(2),eta,extra,M)),L));
    const displayed=G.sub(G.mul(chi,v),G.div(G.mul(q(2),eta,extra,M),L)),body=G.sub(differentiated,displayed),check=sourceGraphRationalIdentity(G,body,{atomicNodes:[M,U,Meta,chi,extra]}),negative=sourceGraphRationalIdentity(G,G.add(body,G.div(G.mul(q(2),eta,extra,M),L)),{atomicNodes:[M,U,Meta,chi,extra]});
    rows.push({order:n,check,missingExtraCutoffRejected:!negative.pass,actualSourceStream:prepared.records[n].global.M,actualSourceU:prepared.records[n].global.U});
  }
  const pass=rows.every(r=>r.check.pass&&r.missingExtraCutoffRejected);if(!pass)fail('INTERNAL_VALIDATION','The original physical potential/cutoff identity failed.');
  return {rows,pass,physicalPotential:'S_n=q^(1-A+2nh)*M_n(X,eta)',streamDerivative:'partial_X M_n=U_n follows from the actual core average PDE, FTC on the cutoff collar/Ipos, and completed mass zero branch.',
    originalSourceCoordinateDerivatives:{q_z:'2*eta*q^(1-D)/L',X_z:'-2*eta*X*q^(-D)/L',eta_z:'d*q^(-D)/L'},
    divergence:'u_r=-(1/r)*partial_z S and u_z=(1/r)*partial_r S; the two mixed physical derivatives cancel, including every cutoff transition.',
    identityIsParametricAlgebra:true,actualCoefficientSlotsConnected:true,independentSourceFunctionsSubstituted:false};
}

export function prepareActualCompletedBackgroundC2(input={},context={}){
  for(const k of Object.keys(input))if(!['sourceProfile','order','maxNodes','maxDerivativeOrder'].includes(k))fail('INVALID_INPUT','Use the original source construction; arbitrary coefficient bounds and cutoff values are not accepted.');
  const order=input.order??4;if(!Number.isSafeInteger(order)||order<3)fail('INVALID_INPUT','The independent induction verifier executes actual orders one, two, and at least one later order.');
  const prepared=prepareActualOrderInduction({...input,order},context),cutoffs=attachActualCanonicalCutoffs(prepared,context),{G}=prepared,systems=[];
  for(let n=1;n<=order;n++)for(const kind of ['actual','auxiliary'])systems.push(verifyActualInductionInnerEquations(prepared,{order:n,kind}));
  const moments=Array.from({length:order-1},(_,i)=>verifyActualInductionMoments(prepared,{order:i+2})),parametricPDE=verifyActualInductionParametricKernel(prepared),support=coefficientSupport(prepared),potential=potentialIdentity(prepared),chart=actualBackgroundChartBound(cutoffs,context),primitive=sourceAllOrderCutoffJets({order:Math.max(16,order)},context);
  const induction={
    base:{sameActualLeading:true,actualArbitraryFiniteLeadingJetRecipe:cutoffs.norms.leading.scope.arbitraryFiniteRecurrence,allRequestedLeadingChecks:cutoffs.norms.leading.pass,sourceIdentity:cutoffs.norms.leading.sourceFunctionIdentity},
    coefficientStep:{actualOrderedPairs:'i+j=n with0<i,j<n; Omega_(n-1) uses all0<=i,j<=n-1',actualAndAuxiliarySystems:true,knownForceUsesFinalizedLowerLocalCutoffs:true,
      exponent:'nu_n=2*n*h, retained at every order',everyPreviousMomentGateExecuted:true,actualMomentCorrectionUsesFullSupport:true,parametricPDE},
    analyticStep:{commonRadialDomain:'0<=X<=Xa*exp(t1/16)',auxiliaryRadii:'R_0=8, R_n=6+2^(1-n)>6',strictAuxiliaryGap:'R_(n-1)-R_n=2^(1-n)>0 for n>=2; R_0-R_1=1',
      etaStrips:'delta_n=delta/(8*256^n)>0; every previous strip is at least256*delta_n',sourceStrip:'4*delta_n',noActivationCollarComplexAnalyticity:true,
      auxiliaryAgreement:'0<=X<=Xa only, by the actual zero-datum system and induction; outside this interval the actual finalized-cutoff source is retained.'},
    normStep:{leading:'The internally generated ordinary leading jet bound at the required finite derivative rectangle.',
      radial:'At fixed n, r>=2 uses the original second-order equation and only smaller same-order radial derivatives; all lower-order derivatives are already constructed.',
      global:'Finite actual eta-independent radial moments, the fixed continuous Ipos inverse, exact bump jets, average and regular V reconstruct every mixed jet.',
      finite:'Only sums/products/positive inverses/exponentials/factorials and finite derivative recurrences occur. All positive source denominators are retained.',
      callerBound:false},
    cutoffStep:{canonical:true,definition:cutoffs.program.definition,derivativeBudget:'Each n selects all mixed norms with total derivative order<=n, including the extra stream cutoff derivative.',
      smoothLocalFiniteness:'c_n>=2^n. Every compact q interval bounded away from0 has only finitely many active terms and derivatives.',
      normalizedTail:'For each fixed m and all n>=max(2,m), every selected normalized derivative is<=2^-n*q^(n*h).'},
    proofKind:'Executable recurrence plus mathematical induction on the actual source order and ordinary radial derivative; finite source checks are regression witnesses, not a truncation proof.',
    verifiedFiniteOrders:order,allIntegerOrdersBySameWellFoundedRecipe:true,fixedSixOrTwelveOrderExtrapolation:false,
    weightedStressAndPhysicalResidualClausesIncluded:false,sourceDefinitionChanged:false
  };
  const checks={actualLeadingArbitraryFiniteRecipe:induction.base.actualArbitraryFiniteLeadingJetRecipe&&induction.base.allRequestedLeadingChecks,
    allGeneratedActualAndAuxiliaryPDEs:systems.every(s=>s.pass),indeterminateOrderPDEKernel:parametricPDE.pass,actualFiveMomentsBeforeEveryNextOrder:moments.every(m=>m.pass),actualSmoothExterior:support.pass,
    originalPotentialExtraCutoff:potential.pass,originalAllFiniteCutoffJets:primitive.pass,canonicalPrefixIndependentDefinition:cutoffs.program.definition.prefixIndependent,
    sameSourceParameters:cutoffs.norms.leading.parameterExpressionSHA256===prepared.program.parameterExpressionSHA256,positiveN2FiniteBlockRetained:chart.finiteBlock.finite.some(r=>r.order===2),
    actualFullEnlargedLeadingAngularBound:chart.bounds.leadingFOnEnlargedAnnulusSupplied&&Object.values(chart.bounds.leadingFOnEnlargedAnnulus.checks).every(Boolean)};
  const pass=Object.values(checks).every(Boolean);if(!pass)fail('INTERNAL_VALIDATION','The actual completed background C2 certificate failed.');
  const result={prepared,cutoffs,G,chart,induction,systems,moments,parametricPDE,support,potential,checks,pass,roots:chart.roots};
  result.program=G.pack(result.roots,{schema:'MathScope.ActualCompletedBackgroundC2/1',profileId:prepared.program.profileId,parameterExpressionSHA256:prepared.program.parameterExpressionSHA256,
    chart,induction,checks,pass,scope:{actualLocallyFiniteBackgroundDefined:true,canonicalActualCutoffSequence:true,actualWholeEnlargedAnnulusNormalizedProximity:true,
      actualSlowC2FGProximity:true,actualPotentialCurlAndExtraTerm:true,allRequestedSourceCoefficientsUseOriginalProfile:true,
      actualGlobalTranscendentalValuesNumericallyEnclosed:false,fullLeadingFAbsoluteBoundPending:false,weightedStressSelectorComputed:false,physicalResidualSelectorComputed:false,
      fullOriginalProposition55Certified:false,sourceUniformQStarCertified:false,originalN506Complete:false,newLeanKernelProof:false}});
  certificates.set(result,{G,prepared,cutoffs,roots:result.roots,nodeCount:G.nodes.length,prefix:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:JSON.stringify({chart,induction,checks}),pass});return result;
}

export function assertActualCompletedBackgroundC2(result){const c=certificates.get(result);if(!c||result.G!==c.G||result.prepared!==c.prepared||result.cutoffs!==c.cutoffs||result.roots!==c.roots||JSON.stringify(c.G.nodes.slice(0,c.nodeCount))!==c.prefix||!c.G.functionDefinitionsUnchanged(c.definitions)||JSON.stringify({chart:result.chart,induction:result.induction,checks:result.checks})!==c.data||!c.pass)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally constructed actual C2 background.');assertActualNormalizedCutoffs(c.cutoffs);return true;}

export const actualCompletedBackgroundC2Certificate=(input={},context={})=>prepareActualCompletedBackgroundC2(input,context).program;
