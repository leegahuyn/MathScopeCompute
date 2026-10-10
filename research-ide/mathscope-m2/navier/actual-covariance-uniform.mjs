/** Exact finite kernels for the remaining uniform covariance obligations.
 *
 * The accepted N3 cone is bound to its immutable source expressions. The
 * continuous perturbation inequalities below are actually checked as rational
 * Bernstein polynomials, not inferred from finitely many sampled labels.
 *
 * A completed-background field/jet producer is not installed here. In
 * particular the exact principal-operator routine accepts explicit numerical
 * jets and says so; its successful algebra is never a source-field receipt.
 */
import {PINNED_N3} from './source-profile-data.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile,validateParameterGraph} from './source-profile.mjs';
import {ACTUAL_PULSE_BINDINGS} from './actual-pulse-source.mjs';
import {boundActualMeanPatchJets} from './actual-pulse-meanpatch.mjs';

const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){const r=a%b;a=b;b=r;}return a;};
const Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(!d)fail('A rational denominator is zero.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];};
const parse=v=>{
  if(typeof v==='number'){if(!Number.isSafeInteger(v))fail('Use exact rational strings for noninteger values.');return Q(v);}
  if(typeof v!=='string'||v.length>2048||!/^[-+]?\d+(?:\/[-+]?\d+)?$/.test(v))fail('Use an integer or an exact numerator/denominator string.');
  const a=v.split('/');return Q(a[0],a[1]??1);
};
const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const neg=a=>[-a[0],a[1]];
const sub=(a,b)=>add(a,neg(b));
const mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]);
const div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]);
const cmp=(a,b)=>{const n=a[0]*b[1]-b[0]*a[1];return n<0n?-1:n>0n?1:0;};
const abs=a=>[a[0]<0n?-a[0]:a[0],a[1]];
const min=(a,b)=>cmp(a,b)<=0?a:b;
const max=(a,b)=>cmp(a,b)>=0?a:b;
const text=a=>a[1]===1n?String(a[0]):a.join('/');
const zero=()=>Q(0),one=()=>Q(1);
const dot=(a,b)=>a.reduce((s,x,i)=>add(s,mul(x,b[i])),zero());
const transpose=a=>a[0].map((_,j)=>a.map(row=>row[j]));
const mv=(a,b)=>a.map(row=>dot(row,b));
const serial=v=>Array.isArray(v)&&v.length===2&&typeof v[0]==='bigint'?text(v):Array.isArray(v)?v.map(serial):v;

const polynomialAdd=(a,b)=>Array.from({length:Math.max(a.length,b.length)},(_,i)=>add(a[i]??zero(),b[i]??zero()));
const polynomialScale=(a,c)=>a.map(x=>mul(x,c));
const polynomialSub=(a,b)=>polynomialAdd(a,polynomialScale(b,Q(-1)));
const polynomialMul=(a,b)=>{const c=Array.from({length:a.length+b.length-1},zero);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)c[i+j]=add(c[i+j],mul(a[i],b[j]));return c;};
const trim=a=>{while(a.length>1&&a.at(-1)[0]===0n)a.pop();return a;};
const choose=(n,k)=>{let r=1n;for(let i=1;i<=k;i++)r=r*BigInt(n+1-i)/BigInt(i);return r;};

/** A power polynomial is converted, exactly, to the Bernstein basis on [0,1].
 * Nonnegative Bernstein coefficients prove nonnegativity at every real point.
 */
export function exactUnitIntervalPolynomial(coefficients){
  if(!Array.isArray(coefficients)||!coefficients.length||coefficients.length>17)fail('Use a polynomial of degree at most sixteen.');
  const a=trim(coefficients.map(parse)),degree=a.length-1;
  const bernstein=Array.from({length:a.length},(_,j)=>{
    let b=zero();for(let i=0;i<=j;i++)b=add(b,mul(a[i],Q(choose(j,i),choose(degree,i))));return b;
  });
  const lo=bernstein.reduce(min),hi=bernstein.reduce(max);
  return{schema:'MathScope.ExactUnitIntervalPolynomial/1',variable:'kappa',domain:['0','1'],powerCoefficients:a.map(text),bernsteinCoefficients:bernstein.map(text),rangeByConvexCombination:[text(lo),text(hi)],nonnegative:cmp(lo,zero())>=0,strictlyPositive:cmp(lo,zero())>0,arithmetic:'BIGINT_RATIONAL_BERNSTEIN_CONVEX_COMBINATION',finiteSamplingUsed:false};
}

/** This is an executed universal inequality audit. Optional divisors exist for
 * independent failure controls; only the fixed defaults enter the source
 * certificate below. No caller-provided certification flags are accepted.
 */
export function covarianceConePolynomialAudit({columnErrorDivisor=128,freezeErrorDivisor=16}={}){
  if(!Number.isSafeInteger(columnErrorDivisor)||columnErrorDivisor<1||columnErrorDivisor>65536||!Number.isSafeInteger(freezeErrorDivisor)||freezeErrorDivisor<1||freezeErrorDivisor>65536)fail('Use positive bounded integer divisors.');
  const d=Q(1,columnErrorDivisor),freeze=Q(1,freezeErrorDivisor),margin=sub(Q(1,8),freeze);
  const targetRatioSquared=polynomialMul([one(),zero(),Q(1,4)],[one(),Q(-1,2)]);
  const targetBoundSquared=polynomialMul([one(),Q(-1,8)],[one(),Q(-1,8)]);
  const coneGap=polynomialSub(targetBoundSquared,targetRatioSquared);
  if(coneGap[0][0]!==0n)throw Error('The source cone comparison lost its exact kappa factor.');
  const detLower=[Q(2),mul(Q(-4),d),mul(Q(-2),mul(d,d))];
  const detUpper=[Q(2),mul(Q(4),d),mul(Q(2),mul(d,d))];
  const numeratorLowerCoefficient=sub(margin,mul(Q(2),d));
  const numeratorUpper=[Q(2),mul(Q(2),d)];
  const proofs=[
    ['source-cone-margin-after-u-choice',coneGap.slice(1),'Divide the squared margin by kappa>0.'],
    ['frozen-target-margin-positive',[margin],'The allowed slow-direction error is subtracted from kappa/8.'],
    ['normalized-determinant-lower',polynomialSub(detLower,[Q(15,8)]),'det C >= 2-4 delta-2 delta^2 >15/8.'],
    ['normalized-determinant-upper',polynomialSub([Q(17,8)],detUpper),'det C <=2+4 delta+2 delta^2 <17/8.'],
    ['inverse-numerators-positive',[numeratorLowerCoefficient],'Each inverse numerator is >=(margin-2 delta/kappa)*kappa.'],
    ['positive-inverse-lower',polynomialSub([mul(Q(64),numeratorLowerCoefficient)],detUpper),'Numerator/det >= kappa/64.'],
    ['positive-inverse-upper',polynomialSub(polynomialScale(detLower,Q(2)),numeratorUpper),'Numerator/det <=2.'],
    ['inverse-infinity-norm-upper',polynomialSub(polynomialScale(detLower,Q(2)),[Q(2),mul(Q(2),d)]),'Each absolute adjugate row sum is <=2+2 delta, so ||C^-1||_infinity<=2.']
  ].map(([id,p,reason])=>{const certificate=exactUnitIntervalPolynomial(p.map(text));return{id,reason,certificate,pass:certificate.strictlyPositive};});
  return{schema:'MathScope.CovarianceConePolynomialAudit/1',parameters:{columnErrorDivisor,freezeErrorDivisor},sourceInputInequality:'abs(c0*T_K/T_N)^2 <= 1-kappa/2',choice:'u_star=2/kappa; A_c=abs(c0)*sqrt(1+u_star^2)',normalizedTargetRatioSquaredUpper:targetRatioSquared.map(text),sourceTargetSlopeUpper:'1-kappa/8',frozenTargetSlopeUpper:'1-('+text(margin)+')*kappa',normalizedColumnErrorUpper:'kappa/'+columnErrorDivisor,normalizedMatrix:'C=[ [1+e11,1+e12],[-1+e21,1+e22] ]; each |eij|<=delta',normalizedDeterminant:[detLower.map(text),detUpper.map(text)],inverseNumeratorLowerCoefficient:text(numeratorLowerCoefficient),positiveInverseBounds:['kappa/64','2'],inverseInfinityNormUpper:'2',proofs,pass:proofs.every(p=>p.pass),actualWaveColumnErrorComputed:false};
}

function interval(v){
  const a=Array.isArray(v)?v.map(parse):[parse(v),parse(v)];
  if(a.length!==2||cmp(a[0],a[1])>0)fail('An exact interval must have ordered endpoints.');return a;
}
const ip=a=>[a,a],ia=(a,b)=>[add(a[0],b[0]),add(a[1],b[1])],in_=a=>[neg(a[1]),neg(a[0])],is=(a,b)=>ia(a,in_(b));
const im=(a,b)=>{const c=[mul(a[0],b[0]),mul(a[0],b[1]),mul(a[1],b[0]),mul(a[1],b[1])];return[c.reduce(min),c.reduce(max)];};
const inv=a=>{if(cmp(a[0],zero())<=0&&cmp(a[1],zero())>=0)fail('A reciprocal interval contains zero.');return[div(one(),a[1]),div(one(),a[0])];};
const id=(a,b)=>im(a,inv(b));
const maxabs=a=>max(abs(a[0]),abs(a[1]));

/** Certify a full continuum of normalized matrices and target slopes using
 * explicit exact interval inputs. This is a mathematical kernel for supplied
 * boxes, not authentication of a field or of an entire source annulus.
 */
export function certifyCovariancePerturbationBox(input,context={}){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('Provide an exact covariance perturbation box.');
  for(const k of Object.keys(input))if(!['kappa','targetSlope','columnErrors'].includes(k))fail('Unknown perturbation-box input: '+k);
  const kappa=parse(input.kappa);if(cmp(kappa,zero())<=0||cmp(kappa,one())>0)fail('Require exact 0<kappa<=1.');
  if(!Array.isArray(input.columnErrors)||input.columnErrors.length!==2||input.columnErrors.some(r=>!Array.isArray(r)||r.length!==2))fail('Use a two by two array of exact column-error intervals.');
  const errors=input.columnErrors.map(r=>r.map(interval)),slope=interval(input.targetSlope),delta=div(kappa,Q(128)),targetBound=sub(one(),div(kappa,Q(16)));
  const C=errors.map((row,i)=>row.map((e,j)=>ia(ip(Q(i===0?1:j===0?-1:1)),e)));
  const determinant=is(im(C[0][0],C[1][1]),im(C[0][1],C[1][0]));
  const numerators=[is(C[1][1],im(C[0][1],slope)),is(im(C[0][0],slope),C[1][0])];
  const safeDenominator=cmp(determinant[0],zero())>0;
  const solution=safeDenominator?numerators.map(n=>id(n,determinant)):null;
  const checks=[
    {id:'target-inside-frozen-source-cone',pass:cmp(maxabs(slope),targetBound)<=0},
    {id:'each-column-perturbation-within-source-budget',pass:errors.flat().every(e=>cmp(maxabs(e),delta)<=0)},
    {id:'strict-determinant-on-entire-box',pass:cmp(determinant[0],Q(15,8))>0},
    {id:'strict-positive-coefficients-on-entire-box',pass:!!solution&&solution.every(y=>cmp(y[0],div(kappa,Q(64)))>=0&&cmp(y[1],Q(2))<=0)}
  ];context.checkCancelled?.();
  return{schema:'MathScope.ExactCovariancePerturbationBox/1',arithmetic:'BIGINT_RATIONAL_INTERVALS',kappa:text(kappa),targetSlope:serial(slope),columnErrors:serial(errors),normalizedMatrix:serial(C),determinant:serial(determinant),inverseNumerators:serial(numerators),normalizedPositiveWeights:solution?serial(solution):null,normalization:{target:'T_normalized=(1,r)',columnPositiveFactors:'H_sigma=h_sigma*(-A_c*N*C_1sigma+u_star*K*C_2sigma)',weight:'y_sigma=(-T_N/A_c)*z_sigma/h_sigma; z=C^-1*(1,r)',absolutePhysicalDeterminantLower:'(15/8)*A_c*u_star*h_plus*h_minus',physicalDeterminantSign:'negative in the positively oriented (N,K) frame'},checks,pass:checks.every(c=>c.pass),scope:{allMatricesAndTargetsInSuppliedBox:true,finiteSamplingUsed:false,sourceFieldBinding:false,actualHomogeneousPulseEnclosed:false,wholeAnnulus:false}};
}

/** Exact original 3D principal equation for supplied frozen-label jets.
 * All terms in (7.4)-(7.6), including n', the connection terms and the
 * projected forcing, are evaluated. The input is deliberately NOT accepted
 * as a source-profile certificate. No positive-order background is fabricated.
 */
export function exactFrozenPulsePrincipalOperator(input,{omitMovingNormal=false,omitCylindricalConnections=false}={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('Provide exact frozen-label jets.');
  const scalarNames=['R','F','FR','FZ','G','GR','GZ','p','pz','epsilon','k','x0','v'];
  for(const name of Object.keys(input))if(![...scalarNames,'amplitude','forcing'].includes(name))fail('Unknown frozen-operator field: '+name);
  const x=Object.fromEntries(scalarNames.map(name=>[name,parse(input[name])]));
  if(cmp(x.R,zero())<=0||cmp(x.F,zero())<=0||cmp(x.epsilon,zero())<=0||cmp(x.k,zero())<=0||x.k[1]!==1n||x.p[0]===0n||cmp(x.v,zero())<0)fail('Require R,F,epsilon,k>0, integer k, p!=0 and v>=0.');
  const angularInteger=mul(x.k,x.p);if(angularInteger[1]!==1n)fail('The original angular label requires k*p to be a nonzero integer.');
  const H=add(mul(x.p,x.F),mul(x.pz,x.G)),HR=add(mul(x.p,x.FR),mul(x.pz,x.GR)),HZ=add(mul(x.p,x.FZ),mul(x.pz,x.GZ));
  const n=[sub(x.x0,mul(x.v,HR)),div(x.p,x.R),sub(x.pz,mul(mul(x.epsilon,x.v),HZ))];
  const actualNprime=[neg(HR),zero(),neg(mul(x.epsilon,HZ))],selectedNprime=omitMovingNormal?[zero(),zero(),zero()]:actualNprime;
  const norm2=dot(n,n),twoF=omitCylindricalConnections?zero():mul(Q(2),x.F);
  const K=[[zero(),neg(twoF),zero()],[add(twoF,mul(x.R,x.FR)),zero(),zero()],[x.GR,zero(),zero()]],nK=transpose(K).map(c=>dot(n,c));
  const A=K.map((row,i)=>row.map((value,j)=>add(neg(value),div(mul(n[i],sub(nK[j],selectedNprime[j])),norm2))));
  const P=n.map((_,i)=>n.map((__,j)=>sub(Q(i===j?1:0),div(mul(n[i],n[j]),norm2))));
  const damping=mul(mul(x.epsilon,mul(x.k,x.k)),norm2);
  const rationalTangentBasis=[[one(),neg(div(n[0],n[1])),zero()],[zero(),neg(div(n[2],n[1])),one()]];
  const vector=(v,name)=>{if(!Array.isArray(v)||v.length!==3)fail(name+' must have three exact components.');return v.map(parse);};
  const t=input.amplitude?vector(input.amplitude,'amplitude'):rationalTangentBasis[0].map((a,i)=>add(a,rationalTangentBasis[1][i]));
  const f=input.forcing?vector(input.forcing,'forcing'):[zero(),zero(),zero()],At=mv(A,t),Pf=mv(P,f),Kt=mv(K,t);
  const derivative=At.map((a,i)=>add(sub(a,mul(damping,t[i])),Pf[i]));
  const pressureImaginaryCoefficient=div(sub(dot(nK.map((a,i)=>sub(a,selectedNprime[i])),t),dot(n,f)),mul(x.k,norm2));
  const constraintRow=transpose(A).map((c,j)=>add(actualNprime[j],dot(n,c))),projectedForcingRow=transpose(P).map(c=>dot(n,c));
  const pressureEquation=derivative.map((a,i)=>sub(sub(add(add(a,Kt[i]),mul(damping,t[i])),mul(mul(x.k,n[i]),pressureImaginaryCoefficient)),f[i]));
  const energyResidual=sub(add(add(dot(t,derivative),mul(damping,dot(t,t))),add(mul(mul(x.R,x.FR),mul(t[0],t[1])),mul(x.GR,mul(t[0],t[2])))),dot(t,f));
  const normalConstraint=dot(n,t),epsilonK2=mul(x.epsilon,mul(x.k,x.k));
  const checks=[
    {id:'original-nonzero-integer-angular-frequency',pass:angularInteger[1]===1n&&angularInteger[0]!==0n},
    {id:'normal-denominator-strictly-positive',pass:cmp(norm2,zero())>0},
    {id:'original-connection-entries-retained',pass:cmp(K[0][1],neg(mul(Q(2),x.F)))===0&&cmp(K[1][0],add(mul(Q(2),x.F),mul(x.R,x.FR)))===0},
    {id:'moving-normal-constraint-row-identity',pass:constraintRow.every(a=>a[0]===0n)},
    {id:'forcing-projection-orthogonal-to-normal',pass:projectedForcingRow.every(a=>a[0]===0n)},
    {id:'given-amplitude-satisfies-constraint',pass:normalConstraint[0]===0n},
    {id:'original-complex-pressure-equation',pass:pressureEquation.every(a=>a[0]===0n)},
    {id:'shear-energy-cancellation',pass:normalConstraint[0]===0n&&energyResidual[0]===0n}
  ];context.checkCancelled?.();
  return{schema:'MathScope.ExactFrozenPulsePrincipalOperator/1',sourceEquations:['7.3','7.4','7.5','7.6','7.13'],arithmetic:'BIGINT_RATIONAL_LINEAR_ALGEBRA',input:Object.fromEntries(scalarNames.map(name=>[name,text(x[name])])),phaseSpeed:text(H),n:serial(n),nPrime:serial(actualNprime),normalSquared:text(norm2),K:serial(K),Aphi:serial(A),forcingProjection:serial(P),damping:text(damping),epsilonK2:text(epsilonK2),rationalTangentBasis:serial(rationalTangentBasis),amplitude:serial(t),forcing:serial(f),amplitudeDerivative:serial(derivative),pressure:{form:'i*imaginaryCoefficient',imaginaryCoefficient:text(pressureImaginaryCoefficient),includesProjectedForcing:true},residuals:{constraintRow:serial(constraintRow),normalConstraint:text(normalConstraint),forcingProjectionRow:serial(projectedForcingRow),principalEquation:serial(pressureEquation),energy:text(energyResidual)},checks,pass:checks.every(c=>c.pass),scope:{suppliedJetsOnly:true,sourceFieldBinding:false,originalPrincipalTermsComputed:true,originalNormalizedBFrameConstructed:false,homogeneousOrForcedODEIntegrated:false,backgroundJetsGenerated:false,wholeAnnulus:false}};
}

/** Source-specific facts plus exact quantitative requirements for a future
 * all-label receipt. Missing predicates cannot be set by user input.
 */
export function actualCovarianceUniformSourceCertificate(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('Use a source-bound uniform-obligation request.');
  for(const name of Object.keys(input))if(name!=='sourceProfile')fail('Unknown source uniform-certificate input: '+name);
  assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID);context.checkCancelled?.();
  const p=PINNED_N3.parametersExactExpressions,graph=validateParameterGraph(),cone=covarianceConePolynomialAudit(),meanJets=boundActualMeanPatchJets(2);
  const checks=[
    {id:'unchanged-source-parameter-graph',pass:graph.ok},
    {id:'source-kappa-is-exact-envelope-inverse-tenth-power',pass:same(p.directionalMarginKappa,{power:[{ref:'C12EnvelopeR'},-10]})},
    {id:'source-envelope-is-explicit-positive-expression',pass:same(p.C12EnvelopeR,{exp:{power:[{ref:'sourceEnvelopeS'},256]}})&&same(p.sourceEnvelopeS,{power:[{ref:'CSelected'},100000]})&&p.logCSelected.sum[1].power[1]===200},
    {id:'same-N3-stress-and-loop-margin-attached',pass:PINNED_N3.attachedAnalyticConclusions.wholeClosedAnnulusDirectionalMargin==='R^-10'&&PINNED_N3.attachedAnalyticConclusions.actualLoopDerivativeBoundAttached&&PINNED_N3.attachedAnalyticConclusions.continuousC12DebtAndI1Restoration},
    {id:'continuous-exact-cone-perturbation-inequalities',pass:cone.pass},
    {id:'actual-entire-Imean-normalized-second-jets',pass:meanJets.pass&&meanJets.uniformOverEntireBox&&meanJets.order===2}
  ];
  const dependencies=[
    {id:'completed-background-C2',available:false,requiredDomain:'A fixed radial enlargement of [Xa,Xb] x [-1,1], all 0<q<q_star',requiredQuantity:'Explicit C2 constants for the actual q-normalized Proposition 5.5 tangential background comparison in (5.42).',reason:'At fixed derivative order the Borel proof retains a finite initial positive-order block. Its actual coefficient seminorms and cutoff product terms are not supplied by the N3 preloop envelope or by a bound for the unseen high-order tail.',minimumOrderForValueProblem:2},
    {id:'actual-frozen-label-jet-provider',available:false,requiredQuantity:'F,G and first slow derivatives of those same completed fields, with uniform second-derivative bounds on each enlarged slow box.',reason:'The exact operator kernel evaluates all supplied jets, but cannot identify arbitrary input jets with the original source. The actual Imean formula supplies one preserved patch only.'},
    {id:'stress-direction-modulus',available:false,requiredQuantity:'An explicit Lipschitz bound for r=A_c*T_K/(-u_star*T_N), including the one-sided normalized direction at both flat shell edges; a box-size check yielding error<=kappa/16.',reason:'The same-source assembly proves a smooth limiting direction and positive margin. Its final section gives finiteness of requested derivative constants, not an executed numerical modulus for this normalized global ratio.'},
    {id:'uniform-homogeneous-covariance-columns',available:false,requiredQuantity:'From the same actual principal coefficients and original growing datum: positive h_sigma lower bounds and normalized entrywise column errors<=kappa/128, including transverse and pulse integration.',reason:'The installed validated covariance integral is tied to the eta=0,s=1 Imean representative. A positive target cone does not bound an ODE solution or its integrated covariance by itself.'},
    {id:'common-source-q-star',available:false,requiredQuantity:'One explicit smallness threshold satisfying all preceding value/second-jet and box-width inequalities, valid for every later label.',reason:'The finite support palette covers all discrete labels, but cannot supply the missing analytic coefficient or covariance error constants.'}
  ];
  return{schema:'MathScope.ActualCovarianceUniformSourceCertificate/1',profileId:SOURCE_PROFILE_ID,sourceHash:PINNED_N3.inputs.assembly.sha256,parameterExpressionSHA256:PINNED_N3.parameterExpressionSHA256,sourceBindings:structuredClone(ACTUAL_PULSE_BINDINGS),parameters:{kappa:{expression:structuredClone(p.directionalMarginKappa),range:'0<kappa<1',binary64:null,positiveUnderflowNotZero:true},uStar:{expression:{product:[{integer:2},{power:[{ref:'C12EnvelopeR'},10]}]}},flatStressLower:structuredClone(p.stressFlatLowerConstant)},sourceCone:{appliesTo:'Accepted N3 order-zero stress on the whole closed active annulus, with limiting edge direction.',sourceSquaredRatioBound:'abs(c0*T_K/T_N)^2<=1-kappa/2',computedSlopeBound:'abs(A_c*T_K/(-u_star*T_N))<=1-kappa/8',actualStressMagnitudePositiveInInterior:true,flatStressIsNotDividedByZeroAtEdges:true},cone,actualMeanPatchSecondJets:meanJets,certifiedSubclaims:['Actual-source choice of u_star and a quantitative frozen-point direction margin.','Exact sufficient normalized column and target perturbation budgets.','Continuous determinant and positive inverse lower bounds once those numerical budgets hold.','Actual normalized second-jet intervals on the entire preserved mean patch.'],uniformAcceptanceBudgets:{targetDirectionVariation:'<=kappa/16',eachNormalizedColumnError:'<=kappa/128',normalizedDeterminantLower:'15/8',normalizedPositiveInverseLower:'kappa/64',normalizedPositiveInverseUpper:'2',normalizedInverseInfinityNormUpper:'2',requiresPositiveActualColumnScales:true},dependencies,checks,pass:checks.every(c=>c.pass),status:'PARTIAL',scope:{sourceConeAndRobustInverseSubclaimComplete:true,allLabelsEnumerated:false,allLabelsEnumerationRequired:false,allDerivativeOrdersRequiredForThisValueSubclaim:false,sourceWholeAnnulusBackgroundBound:false,actualCovarianceOnAllSlowNeighborhoods:false,sourceUniformQStarCertified:false,wholeAnnulusEquation730Verified:false,originalN506Complete:false,fullM2PackageComplete:false,newLeanKernelProof:false}};
}
