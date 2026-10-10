/** Executed source operator and concentration budgets. Large constants are
 * retained as positive expressions; they are not rounded to machine zero or
 * forced into the old fixed R envelope. The source frame remains order zero.
 */
import {assertActualCovarianceOperator} from './actual-covariance-source-operator.mjs';
import {covarianceConcentrationRecipe,covarianceConcentrationScalarAudit} from './actual-covariance-concentration.mjs';
import {covarianceConePolynomialAudit} from './actual-covariance-uniform.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const max=(...v)=>v.filter(x=>x!==null).length?Math.max(...v.filter(x=>x!==null)):null;
const plus=(a,b)=>a===null||b===null?null:a+b;
/** For B>=2 and S>=1 a triple (v,e,d) records
 * |f|,|f_ref|<=B^v; |f-f_ref|<=B^e/S; |f'|<=B^d/S.
 * null means exactly zero. Sums absorb their finite coefficient in B.
 * All reciprocal/square-root lower bounds are separate actual premises. */
class FramePowerLedger{
  rows=[];
  put(label,v,e=null,d=null,rule='source primitive',inputs=[]){const r={label,v,e,d,rule,inputs};this.rows.push(r);return r;}
  sum(label,...a){const nn=a.filter(x=>x.v!==null);if(!nn.length)return this.put(label,null,null,null,'zero sum');const reserve=Math.ceil(Math.log2(nn.length));return this.put(label,max(...nn.map(x=>x.v))+reserve,max(...nn.map(x=>x.e))===null?null:max(...nn.map(x=>x.e))+reserve,max(...nn.map(x=>x.d))===null?null:max(...nn.map(x=>x.d))+reserve,'triangle inequality; finite sum <= B^ceil(log2 count)',a.map(x=>x.label));}
  product(label,a,b){return this.put(label,plus(a.v,b.v),max(plus(a.e,b.v),plus(a.v,b.e))===null?null:max(plus(a.e,b.v),plus(a.v,b.e))+1,max(plus(a.d,b.v),plus(a.v,b.d))===null?null:max(plus(a.d,b.v),plus(a.v,b.d))+1,'two-term difference and ordinary Leibniz rule',[a.label,b.label]);}
  inv(label,a,lowerPower){return this.put(label,lowerPower,a.e===null?null:a.e+2*lowerPower,a.d===null?null:a.d+2*lowerPower,'both actual/reference absolute values >= B^-'+lowerPower,[a.label]);}
  sqrt(label,a,sqrtLowerPower){return this.put(label,Math.ceil(a.v/2),a.e===null?null:a.e+sqrtLowerPower,a.d===null?null:a.d+sqrtLowerPower,'positive square root; both roots >= B^-'+sqrtLowerPower,[a.label]);}
  tighten(label,a,v,reason){if(v>a.v)fail('INTERNAL_VALIDATION','A structure tightening cannot enlarge a bound.');return this.put(label,v,a.e,a.d,reason,[a.label]);}
  derivativeError(label,a){return this.put(label,a.d,a.d,null,'actual v derivative with zero reference; the factor 1/S is retained',[a.label]);}
}

/** These finite scalar/matrix budgets are calculated, not copied as a
 * predeclared E. Their primitive rows are connected to the actual source
 * equations by certifyActualCovarianceOperatorBounds below. */
export function actualOperatorPowerAudit(){
  const a=new FramePowerLedger(),zero=a.put('zero',null),one=a.put('one',0),two=a.put('two',1),F=a.put('F',1,5),FR=a.put('F_R',1,5),GR=a.put('G_R',1,5),radial=a.put('R_chart',1,1);
  const n=Array.from({length:3},(_,i)=>a.put('n_'+i,4,12,12)),nPrime=n.map((x,i)=>a.derivativeError('n_prime_'+i,x));
  const prod=(label,x,y)=>a.product(label,x,y),sum=(label,...x)=>a.sum(label,...x);
  const dot=(label,x,y)=>sum(label,...x.map((v,i)=>prod(label+'_term'+i,v,y[i]))),mm=(label,A,B)=>A.map((row,i)=>B[0].map((_,j)=>sum(label+'_'+i+j,...row.map((x,k)=>prod(label+'_'+i+j+'_'+k,x,B[k][j])))));
  const nn=dot('n_squared',n,n),invN2=a.inv('inverse_n_squared',nn,4),K=[[zero,prod('K_rtheta',two,F),zero],[sum('K_thetar',prod('twice_F',two,F),prod('R_FR',radial,FR)),zero,zero],[GR,zero,zero]];
  const pressure=Array.from({length:3},(_,j)=>sum('pressure_numerator_'+j,dot('nTK_'+j,n,K.map(r=>r[j])),nPrime[j]));
  const A=K.map((row,i)=>row.map((x,j)=>sum('Aphi_'+i+j,x,prod('Aphi_rank_'+i+j,prod('n_pressure_'+i+j,n[i],pressure[j]),invN2))));
  const nt2=sum('nt_squared',prod('ntheta_squared',n[1],n[1]),prod('nz_squared',n[2],n[2])),nt=a.sqrt('nt',nt2,2),invNt=a.inv('inverse_nt',nt,2);
  const Ka=[1,2].map((j,i)=>a.tighten('K_a_'+i,prod('K_a_raw_'+i,n[j],invNt),0,'exact normalized tangential unit vector')),Na=[Ka[1],Ka[0]];
  const sa=a.tighten('s_a',prod('s_a_raw',n[0],invNt),3,'|s_a-s_ref|<=B^29/S, |s_ref|<=3u/2, S>=B^512');
  const sr=a.put('s_reference',2,null,2),root=a.sqrt('reference_sqrt',sum('one_plus_s_squared',one,prod('s_reference_squared',sr,sr)),0),c0=a.put('c0',1),c=prod('c0_reference_sqrt',c0,root),invC=a.inv('inverse_c0_reference_sqrt',c,1);
  const U=[[one,zero],[prod('U_theta_first',sa,Ka[0]),Na[0]],[prod('U_z_first',sa,Ka[1]),Na[1]]],J=[[one,one],[c,c]],Jinv=[[one,invC],[one,invC]],Uleft=[[one,zero,zero],[zero,Na[0],Na[1]]];
  const B=mm('B',U,J),Bleft=mm('Bleft',Jinv,Uleft),Bprime=B.map((row,i)=>row.map((x,j)=>a.derivativeError('Bprime_'+i+j,x)));
  const first=mm('Bleft_Aphi_B',mm('Bleft_Aphi',Bleft,A),B),second=mm('Bleft_Bprime',Bleft,Bprime),error=first.map((row,i)=>row.map((x,j)=>sum('projected_error_'+i+j,x,second[i][j])));
  const damping=prod('damping_difference',a.put('epsilon_k_squared',1),nn),computed={operatorError:max(...error.flat().map(x=>x.e)),dampingError:damping.e,unitFrameError:max(...Ka.map(x=>x.e)),slopeError:sa.e};
  const unconditional=[
    {id:'nonzero-carrier-normal-floor',upperPower:1,formula:'1/|n| <= 1/|n_tan| <= k*B; p*k is a nonzero integer and R_chart<=B'},
    {id:'unrounded-and-rounded-carrier',upperPower:5,formula:'|p|,|pz| <= B^5 using Ls>=1/B and actual frozen reciprocal bounds'},
    {id:'phase-gradient',upperPower:8,formula:'|n| <= B^8*(1+Ls), |n_prime|<=B^8'},
    {id:'rank-one-normal-projector',upperPower:12,formula:'|Aphi| <= B^12*(1+k), since ||n n_prime^T/|n|^2||<=|n_prime|/|n|'},
    {id:'actual-tangent-frame',upperPower:20,formula:'|s_a|<=B^10*k*(1+Ls), |s_a_prime|+|K_a_prime|<=B^20*k^2*(1+Ls)'},
    {id:'actual-moving-basis',upperPower:28,formula:'|B|<=B^16*k*(1+Ls), |B_prime|<=B^28*k^2*(1+Ls), |Bleft|<=B^3'},
    {id:'normalized-w-ode',upperPower:40,formula:'Induced infinity ||Bleft(Aphi B-Bprime)-lambda I-(d-dref)I|| <= B^40*(1+k)^3*(1+Ls)^2'}
  ];
  const checks=[{id:'all-moving-matrix-terms-below-output',pass:Object.values(computed).every(v=>Number.isSafeInteger(v)&&v<256)},
    {id:'unconditional-volterra-bound-dominates-all-products',pass:unconditional.at(-1).upperPower<256&&3<=8&&2<=8},
    {id:'tangent-normal-floor-follows-smallness',pass:512>14+1},
    {id:'reference-slope-value-tightening',pass:512>sa.e+1},
    {id:'log-frequency-and-profile-path-reserve',pass:12>9+1&&5>=4+1&&2n**128n>8n}];
  return {schema:'MathScope.ActualCovarianceOperatorPowerAudit/1',baseLower:'B>=2^128',smallness:'S>=B^512, S^2*(epsilon+epsilon^2+k^-1)<=1',
    primitives:{fieldValueAndC2:'<=B',fieldJetDifference:'<=B^5/S^3, relaxed only after the n primitive is built',normalDifference:'|n-n_ref|<=B^12/S',normalDerivative:'|n_prime|<=B^12/S',
      normalMagnitude:'|n|,|n_ref|<=B^4',tangentNormLower:'|n_tan|,Bs>=B^-2',referenceScalarDenominator:'|c0|*sqrt(1+s_ref^2)>=B^-1'},
    rows:a.rows,computed,chosen:{operatorErrorPower:256,dampingErrorPower:256,unitFrameErrorPower:256,slopeErrorPower:256},unconditional,checks,pass:checks.every(r=>r.pass),
    movingNormalIncluded:true,movingBasisIncluded:true,ordinaryProductDerivativesIncluded:true,referenceDiagonalizationRequiresSourceAlgebra:true};
}

/** Positive range propagation only through a single positive quantity.
 * It is used to remove the representative-dependent |c0| from q*. Every
 * generated condition keeps both its lower and upper bound where inversion
 * needs them. No endpoint substitution asserts global monotonicity. */
export function positiveParameterRange(G,roots,parameter,lower,upper){
  const dependent=new Map(),cache=new Map();
  const has=id=>{if(id===parameter)return true;if(dependent.has(id))return dependent.get(id);const n=G.nodes[id];let ids=[];if(['add','multiply','maximum'].includes(n.op))ids=n.args;else if(['inverse','sqrt_positive','exp','log_positive','ceiling','integer_power'].includes(n.op))ids=[n.args[0]];const v=ids.some(has);dependent.set(id,v);return v;};
  const visit=id=>{if(id===parameter)return[lower,upper];if(cache.has(id))return cache.get(id);if(!has(id))return[id,id];const {op,args}=G.nodes[id],v=args.map((x,j)=>op==='integer_power'&&j===1?x:visit(x));let out;
    if(op==='add')out=[G.add(...v.map(x=>x[0])),G.add(...v.map(x=>x[1]))];
    else if(op==='multiply'){const corners=[G.mul(v[0][0],v[1][0]),G.mul(v[0][0],v[1][1]),G.mul(v[0][1],v[1][0]),G.mul(v[0][1],v[1][1])];out=[G.neg(G.maximum(...corners.map(x=>G.neg(x)))),G.maximum(...corners)];}
    else if(op==='inverse')out=[G.inv(v[0][1]),G.inv(v[0][0])];
    else if(op==='sqrt_positive')out=[G.sqrt(v[0][0]),G.sqrt(v[0][1])];
    else if(op==='exp')out=[G.exp(v[0][0]),G.exp(v[0][1])];
    else if(op==='maximum')out=[G.maximum(...v.map(x=>x[0])),G.maximum(...v.map(x=>x[1]))];
    else if(op==='integer_power'&&args[1]>=0)out=[G.pow(v[0][0],args[1]),G.pow(v[0][1],args[1])];
    else fail('UNSUPPORTED','Positive covariance condition range cannot silently assume monotonicity for '+op);
    cache.set(id,out);return out;};
  return {ranges:roots.map(visit),visitedDependentNodes:cache.size,method:'Positive reciprocal/square-root interval arithmetic: inverse reverses endpoints; all four product corners are retained, including signed constant coefficients.'};
}

export function certifyActualCovarianceOperatorBounds(operator){
  assertActualCovarianceOperator(operator);const {G,background,direction,constants:c,geometry:g,frozen:f}=operator,q=(n,d=1)=>G.q(n,d),audit=actualOperatorPowerAudit(),scalar=covarianceConcentrationScalarAudit(),cone=covarianceConePolynomialAudit();
  if(!audit.pass||!scalar.pass||!cone.pass||!direction.pass||!background.pass)fail('INTERNAL_VALIDATION','An actual source, matrix, concentration or inverse-cone gate failed.');
  const E=G.pow(c.Bnorm,256),absoluteC0=G.neg(f.c0),lambdaLower=G.pow(c.Renv,-31),lambdaUpper=G.pow(c.Renv,83);
  const recipe=covarianceConcentrationRecipe(G,{h:c.h,kappa:c.kappa,u:c.u,lambdaLower,lambdaUpper,absoluteC0,operatorError:E,dampingError:E,unitFrameError:E,slopeError:E,lengthRatioLower:g.lengthRatioBounds[0],lengthRatioUpper:g.lengthRatioBounds[1]});
  const intervals=positiveParameterRange(G,recipe.selection.conditions.map(x=>x.lower),absoluteC0,G.pow(c.Renv,-6),G.pow(c.Renv,10)),sourceConditions=[
    ...recipe.selection.conditions.map((r,i)=>({...r,lower:intervals.ranges[i][1],representativeRemoved:true})),
    {id:'actual-moving-frame-denominators-and-primitive-budget',lower:G.pow(c.Bnorm,512),inequality:'S>=B^512'},
    {id:'actual-flat-edge-direction-box',lower:G.pow(c.Renv,1024),inequality:'S>=R^1024'},
  ];
  const Sminimum=G.maximum(...sourceConditions.map(r=>r.lower)),frequencyMinimum=G.pow(G.div(q(64),c.h),2),ellMinimum=G.ceiling(G.maximum(q(8),Sminimum,frequencyMinimum)),qStar=G.exp(G.neg(G.mul(G.add(ellMinimum,q(4)),G.log(q(2)))));
  if(G.freeCoordinates(qStar).size)fail('INVALID_SOURCE_CONSTRUCTION','The selected common q-star still depends on a representative or slow point.');
  const primitiveDerivation={
    fixedSourceInputs:{completedC2:background.roots,sourceNorm:c.Bnorm,leadingDirection:direction.bounds,sourceR:c.Renv,originalMargin:c.kappa},
    profilePath:'Connect (s,X,eta) by its straight path inside [1/2,2]x[Xa/2,2Xb]x[-1,1]. For its slow image, both chart and inverse endpoint difference norms are bounded by B; integrate the known slow C2 gradient along this path. Including the finite dimension/norm factors yields <=B^4*|Delta slow|, without extending the nonconvex slow image.',
    chartEndpointDifference:'Subtract s-Z^2*s^(2h)-T at the two endpoint roots. With 1-8h>1/2 on s in[1/2,2], |Delta s|<=2(|Delta T|+4|Delta Z|); eta=Z/s^D and X=R^2/(2s) give the remaining bounds <=B*|Delta slow|.',
    closeFields:'The source box diameter <=4/S^3, leading C2<=B and completed-leading C2<=B*epsilon^2 give |F-F0|,|FR-FR0|,|GR-GR0|<=B^5/S^3.',
    frozenPhaseCancellation:'pTilde*FR0+pz*GR0 = betaTilde dot (R0*FR0,GR0) = -sign*Bs*u/Ls, since K dot g0=0 and N dot g0=|g0|.',
    rounding:'Choose the nearest nonzero integer to k*pTilde, retaining its sign in the zero-rounding cell. Thus |p-pTilde|<=1/k; p is never divided into a frame coordinate.',
    radialNormal:'HR+sign*Bs*u/Ls=(p-pTilde)FR0+p(FR-FR0)+pz(GR-GR0), bounded by B^9/S^2. Since v<=Ls<=B*S, |nr-sign*Bs*(u/2+uv/Ls)|<=B^12/S.',
    tangentNormal:'n_theta-pTilde/R0=(p-pTilde)/R+pTilde*(1/R-1/R0), plus the explicit -sign*Bs*u*Ntheta/(Ls*|g0|). For n_z retain both this designed O(1/Ls) tilt and -epsilon*v*(pF_Z+pzG_Z). Both are <=B^12/S.',
    derivativeNormal:'n_prime=(-HR,0,-epsilon*HZ); the same cancellation gives |n_prime|<=B^12/S.',
    positiveDenominators:'Bs>=R^-40>B^-1; S>=B^512 makes |n_tan-Bs*K|<=Bs/2, so |n_tan|>=B^-2. The frozen source supplies |c0|>=R^-6>B^-1. Every division in the frame is one of these or |n|^2.',
    referenceDiagonal:'At nref=Bs*(s_ref,K), project the cylindrical K0 with no geometric derivative. In Uref=[er-s_ref*K,N] this is [[0,2F0*Ntheta/(1+s_ref^2)],[-(|g0|+2F0*Ntheta),0]]. The actual c0/lambda0 definitions diagonalize it by J; all nprime and Bprime terms remain in the calculated error.',
    damping:'epsilon*k^2*Bs^2=lambda0/(1+u^2)^(3/2), so epsilon*k^2*|nref|^2=dref exactly. epsilon*k^2<=4; the n-nref product bound gives Ed.'};
  const checks={actualSourcePrivateIdentity:true,actualCompletedAllOrderC2:background.program.scope.actualSlowC2FGProximity,
    originalLeadingFrame:operator.frozen.orderZero,actualLeadingDirection:direction.scope.actualClosedAnnulusDirectionModulusDerived,
    explicitMovingMatrixAudit:audit.pass,continuousConcentrationAudit:scalar.pass,continuousPositiveInverseAudit:cone.pass,
    actualNegativeC0:direction.ratio.rows.some(x=>x.id==='frozen-normal-and-c0'),
    originalPaletteLengthRatios:g.lengthRatioBounds.length===2,
    fullHaarAndAngularFactor:operator.geometry.angularAverage===q(1,2)&&operator.geometry.transverseIndependentAmplitude,
    fixedSourceOnlyThreshold:G.freeCoordinates(qStar).size===0};
  return {schema:'MathScope.ActualCovarianceSourceOperatorBounds/1',G,sourceProfile:operator.sourceProfile,parameterExpressionSHA256:operator.parameterExpressionSHA256,
    sourceOperator:operator,primitiveDerivation,audit,
    domain:{representative:{X:['Xa','Xb'],eta:['-1','1'],s:['1/2','2']},
      slowPoint:{profileX:['Xa/2','2*Xb'],eta:['-1','1'],s:['1/2','2'],image:'R=sqrt(2*s*X), Z=s^D*eta, T=s*(1-eta^2)'},
      sameBoxDistance:{norm:'Euclidean distance in slow R,Z,T',upper:'4/S^3'},
      operator:'All v in[0,Ls]; representatives and slow points are coupled by the same actual slow box, not independent arbitrary pairs.',
      targetCone:'Intersect the slow box with Xa<=X<=Xb; limiting directions at its two flat endpoints.'},
    operatorConstants:{operatorError:E,dampingError:E,unitFrameError:E,slopeError:E},recipe,scalar,cone,
    representativeRange:{absoluteC0:[G.pow(c.Renv,-6),G.pow(c.Renv,10)],intervals},
    selection:{conditions:sourceConditions,Sminimum,frequencyMinimum,ellMinimum,qStar,activeBandBuffer:4,
      appliesTo:'Every original integer band ell>=ellMinimum and every certified slow box intersected with the original source closed annulus.',
      sourceDependencies:'Fixed actual n1/n2 C2 finite block, the canonical all-n tail, fixed leading enlarged C2 and leading source direction/geometry.',
      displayAnchorChangesThreshold:false,higherDerivativeOrdersChangeThreshold:false,positiveExactExpression:true,machineValueOfQStarRequested:false},
    uniformColumns:{normalizedIdeal:[[1,1],[-1,1]],maximumEntryError:G.div(c.kappa,q(128)),positiveMassLower:'(Dg/2)*ci*(Integral chi^2)*massLowerCoefficient*sqrt(Ls)',
      normalizedDeterminantLower:q(15,8),absolutePhysicalDeterminantLower:'(15/8)*Ac*u*h_plus*h_minus',physicalDeterminantSign:'negative: det([-N/Ac;K/u])=-1/(Ac*u), so det(H)=-Ac*u*h_plus*h_minus*det(C)',
      positiveInverse:'kappa/64 <= normalized y_sign <= 2 on the open nonzero stress annulus',zeroStressEdge:'y_plus=y_minus=0; source flat direction and smooth zero extension retained'},
    checks,pass:Object.values(checks).every(Boolean),scope:{actualSourceOperatorConstantsDerived:true,actualCompletedC2PremisesConsumed:true,actualUniformHColumnsCertified:true,
      sourceUniformQStarCertified:true,exactHIsSourceVolterraIntegral:true,numericalWholeHEnclosure:false,pointSamplePromotedToAllLabels:false,
      actualTargetAndPositiveInverseAssembled:false,globalEquation730Certified:false,originalN506Complete:false,newLeanKernelProof:false}};
}
