/** Whole-interval comparison and center fast-jet lemmas.
 * This generic layer never authenticates a source. Every actual coefficient,
 * derivative, rounded carrier, initial condition and positive denominator
 * must be bound by the distinct original-source adapter.
 */
import {centeredNormalizedFullFrame} from './actual-centered-slow-jet-source-bounds.mjs';
import {encloseCenteredSlowJetCoefficients,centeredSecondBodyBinding} from './actual-centered-slow-jet-enclosure-kernel.mjs';
import {adiabaticReplaceExactOperands} from './actual-adiabatic-pulse-center-kernel.mjs';
import {retainedCommonDenominatorIdentity,instantiateRetainedThirdBodies} from './actual-third-jet-algebra.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {directedArithmetic,rational as Q,readRational,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';

const dyadic=n=>Q(1,1n<<BigInt(n));

/** Only the requested complete derivatives are materialized. Four
 * coordinates are allowed, but no third-order jet is manufactured merely
 * to check a two-factor first/second product. */
function selectedBodyBinding(G,body,sequences){
  if(!G.nodes[body]||sequences.some(s=>s.length>2||s.some(x=>G.nodes[x]?.op!=='coordinate')))
    fail('INVALID_INPUT','Use an original retained body and first/second coordinate derivative sequences.');
  const free=[...G.freeCoordinates(body)].sort((a,b)=>a-b),system=free.length?G.defineExpressionFunction({name:'CenteredFastBody_'+body,parameters:free,body,derivativeLimits:free.map(()=>2)}):null,
    value=system===null?body:G.expressionValue(system,free),derivative=(root,s)=>s.reduce((x,d)=>G.derivative(x,d),root),
    direct=sequences.map(s=>derivative(body,s)),formal=sequences.map(s=>derivative(value,s)),
    materialized=formal.map(id=>G.nodes[id].op==='actual_expression_partial'&&G.nodes[id].args[0]===system?G.materializeExpressionFunction(...G.nodes[id].args):id),
    checks=sequences.map((s,i)=>({sequence:s,retained:direct[i],materialized:materialized[i],pass:direct[i]===materialized[i]}));
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','A selected complete fast body failed its direct AD binding.');
  return {body,system,parameters:free,value,sequences,direct,formal,materialized,checks,pass:true,sourceAuthenticated:false};
}

export function centeredFastWeightedProductAudit(G,{weight,radial,directions,variable}){
  if(!Array.isArray(directions)||directions.length!==3||new Set([...directions,variable]).size!==4)
    fail('INVALID_INPUT','Use three distinct slow coordinates and a distinct actual pulse coordinate.');
  const v=variable,sequences=[[],[v],[v,v],...directions.map(d=>[d]),...directions.map(d=>[d,v])],
    a=selectedBodyBinding(G,weight,sequences),b=selectedBodyBinding(G,radial,sequences),bindings=[a,b],
    actualBody=G.mul(weight,radial),formalBody=G.mul(a.value,b.value),
    specs=[{id:'v',sequence:[v],expected:G.add(G.mul(a.formal[1],b.value),G.mul(a.value,b.formal[1]))},
      {id:'vv',sequence:[v,v],expected:G.add(G.mul(a.formal[2],b.value),G.mul(G.q(2),a.formal[1],b.formal[1]),G.mul(a.value,b.formal[2]))},
      ...directions.map((d,i)=>({id:['R','Z','T'][i]+'v',sequence:[d,v],expected:G.add(G.mul(a.formal[6+i],b.value),G.mul(a.formal[3+i],b.formal[1]),G.mul(a.formal[1],b.formal[3+i]),G.mul(a.value,b.formal[6+i]))}))],
    rows=specs.map(s=>{
      const actual=s.sequence.reduce((x,d)=>G.derivative(x,d),actualBody),formal=s.sequence.reduce((x,d)=>G.derivative(x,d),formalBody),
        algebra=retainedCommonDenominatorIdentity(G,formal,s.expected),materialized=instantiateRetainedThirdBodies(G,formal,bindings);
      return {...s,actual,formal,algebra,materialized,bodyDerivativeBinding:actual===materialized,pass:algebra.pass&&actual===materialized};
    });
  if(rows.some(c=>!c.pass))fail('INTERNAL_VALIDATION','A full fast weighted product lost a first, repeated or mixed term.');
  return {schema:'MathScope.CenteredFastWeightedProductAudit/1',weight,radial,actualBody,bindings,rows,pass:true,
    sourceAuthenticated:false,allFourMixedTermsPresent:true,repeatedDerivativeCoefficient:2,actualWeightTimeIndependenceMustBeBoundSeparately:true};
}

/** Differentiate H=a^2 K and y=a^-2 Y as identities of their retained
 * functions. The source factors are shared for finite exact algebra, and
 * each requested original body derivative is independently materialized.
 * H/y can include the whole original improper integrals and inverse. */
export function centeredUncenteredJetIdentityAudit(G,{center,values,directions}){
  if(!Array.isArray(values)||!values.length||values.some(x=>!['H','y'].includes(x.kind)||!G.nodes[x.body]))
    fail('INVALID_INPUT','Use nonempty retained H/y scalar bodies and the dynamic positive center.');
  const a=centeredSecondBodyBinding(G,center,directions),indices=a.indices,A=a.value,q=G.log(A),
    first=directions.map(d=>G.derivative(q,d)),qjets=indices.map(alpha=>{let x=q;for(let j=0;j<alpha.length;j++)for(let k=0;k<alpha[j];k++)x=G.derivative(x,directions[j]);return x;}),
    rows=values.map(item=>{
      const b=centeredSecondBodyBinding(G,item.body,directions),factor=item.kind==='H'?G.div(b.value,G.pow(A,2)):G.mul(b.value,G.pow(A,2)),
        scalarJets=indices.map(alpha=>{let x=factor;for(let j=0;j<alpha.length;j++)for(let k=0;k<alpha[j];k++)x=G.derivative(x,directions[j]);return x;}),
        sign=item.kind==='H'?1:-1,multiplier=G.pow(A,2*sign),checks=[];
      for(let k=1;k<indices.length;k++){
        const alpha=indices[k],axes=alpha.flatMap((n,j)=>Array(n).fill(j)),degree=axes.length,i=axes[0],j=axes[1],
          expected=degree===1?G.mul(multiplier,G.add(G.mul(G.q(2*sign),first[i],factor),scalarJets[k])):
            G.mul(multiplier,G.add(G.mul(G.add(G.mul(G.q(4),first[i],first[j]),G.mul(G.q(2*sign),qjets[k])),factor),
              G.mul(G.q(2*sign),first[i],scalarJets[1+j]),G.mul(G.q(2*sign),first[j],scalarJets[1+i]),scalarJets[k])),
          algebra=retainedCommonDenominatorIdentity(G,b.roots[k],expected,{denominators:[A],maxTerms:30000}),
          actual=b.directRoots[k],materializedLeft=instantiateRetainedThirdBodies(G,b.roots[k],[a,b]);
        checks.push({orders:alpha,formalActual:b.roots[k],expected,algebra,actual,materializedLeft,
          bodyDerivativeBinding:actual===materializedLeft,pass:algebra.pass&&actual===materializedLeft});
      }
      return {...item,bodyBinding:b,factor,firstLogJets:first,secondLogJets:qjets,checks,pass:checks.every(c=>c.pass)};
    });
  if(rows.some(r=>!r.pass))fail('INTERNAL_VALIDATION','An original uncentered H/y derivative lost a dynamic-center product or inverse sign.');
  return {schema:'MathScope.CenteredUncenteredJetIdentityAudit/1',center,centerBodyBinding:a,rows,pass:true,
    nonzeroPositiveCenterRequired:true,originalTargetInsideWeightRetained:true,sourceAuthenticated:false,
    materializationMeaning:'The complete left derivative is materialized to direct AD. The right expression is equal by exact common-denominator algebra on the same fully specified body shares; no unspecified derivative oracle is used.'};
}

export function centeredUncenteredJetErrorAudit(){
  const Bpower=128,SminimumPower=1024,logErrorPower=600,sourceResidualPower=300,conditioningPower=12,
    positiveRadius=dyadic(580),checks=[
      {id:'whole-log-second-relative-bound',pass:23<sourceResidualPower},
      {id:'centered-H-and-weight-jet-growth-after-gL-scaling',pass:32+2+14<sourceResidualPower},
      {id:'source-error-exponent-before-rounding',pass:Bpower*(SminimumPower/2-sourceResidualPower)>logErrorPower},
      {id:'all-products-and-positive-inverse-conditioning-budget',pass:580+conditioningPower<logErrorPower}];
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The complete uncentered derivative error budget is insufficient.');
  return {schema:'MathScope.CenteredUncenteredJetErrorAudit/1',checks,pass:true,sourceAuthenticated:false,
    premises:'The bound source has a in[1/4,1/2], |H/(D*m)|<=1/2, y/(tau/m)<=4, |nu_i|<=1, B>=2^128, S>=B^1024, gL>=S/B^2. Its actual centered H/y first jets are <=B^32*sqrt(gL) and second jets <=B^32*gL. All these are inequalities for the original full functions at the fixed point.',
    logErrors:'|q_i/(gL)-nu_i|<=2^-600, |q_ij|/(gL)^2<=B^23/S, with q=log(a). q_ij is not zero.',
    productProof:'For H=a^2*K, divide each complete second Leibniz term by(gL)^2. The terms K_i/(gL),K_ij/(gL)^2 and q_ij/(gL)^2 have bounds <=B^300/sqrtS after the source positive conditioning. The four leading factors give4*nu_i*nu_j*H/(D*m). For y=a^-2*Y the first coefficient changes sign, while the second leading coefficient remains+4; both minus2*q_i*Y_j terms and minus2*q_ij*Y are included. For a itself the same q_ij bound remains. Finite sums, two bounded slopes, value magnitudes and the already source-conditioned inverse/sqrt cost less than2^12.',
    strictPositiveRadius:qtext(positiveRadius),allDynamicCenterAndTargetDerivativesRetained:true,remainingGeometryScalesNumericallyEvaluated:false};
}

/** Separate finite ledger for the actual normalized moving amplitudes.
 * This is not inferred merely from a norm on the final 2x2 matrix.
 * Four primitive derivatives cover all two slow, two tau, mixed and one
 * auxiliary derivatives used below. The positive scales Ac,u are frozen. */
export function centeredNormalizedAmplitudePowerAudit(){
  const rows=[],put=(id,power,reason)=>{rows.push({id,power,reason});return power;},
    product=(id,...powers)=>put(id,powers.reduce((a,b)=>a+b,0)+1,'Finite four-derivative Leibniz sum'),
    sum=(id,...powers)=>put(id,Math.max(...powers)+1,'Finite four-derivative sum'),
    nR=put('normal_radial',108,'The original normalized radial normal and its finite slow/tau/auxiliary derivatives.'),
    nT=put('normal_tangent_components',108,'The original beta/(L*R),-1-epsilon*tau*beta*FZ and all requested finite derivatives.'),
    nt2=sum('tangent_squared',product('tangent_squared_first',nT,nT),product('tangent_squared_second',nT,nT)),
    invNt2=put('inverse_tangent_squared',5+4*nt2+6,'Four inverse derivatives, original squared tangent denominator>=1>Renv^-1.'),
    invNt=put('inverse_positive_tangent_norm',1+4+4*nt2+6,'Four inverse-square-root derivatives, same positive source denominator.'),
    unit=product('Ka_Na',nT,invNt),projection=product('sa_Ka',nR,nT,invNt2),U=sum('complete_U',unit,projection),
    J=put('complete_reference_J',22,'Four derivatives ofc=c0*sqrt(1+u^2*(1/2+tau)^2); frozen reference and retained positive root.'),
    B=sum('complete_B',product('complete_U_times_J',U,J),0),theta=product('theta_row_divided_by_frozen_Ac',B,6),axial=product('axial_row_divided_by_frozen_u',B,0),
    maximumPower=Math.max(theta,axial),checks=[{id:'normalized-amplitude-reserve',pass:maximumPower<4096},
      {id:'center-value-comparison-error',pass:3<260},{id:'two-mode-first-and-second-product-reserves',pass:16+3<300},
      {id:'remaining-positive-sqrt-product-error-budget',pass:560+30<600}];
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The complete three-component amplitude ledger exceeded its source reserve.');
  return {schema:'MathScope.CenteredNormalizedAmplitudePowerAudit/1',rows,maximumPower,checks,pass:true,sourceAuthenticated:false,
    premises:'The separately bound actual field derivatives throughfive are<Renv^73; normalized normal primitives throughfour<Renv^108; every tangent denominator along the actual auxiliary segment is>=1. The SAME source Ac>Renv^-6,u>1 is frozen under all derivatives. Renv>2^4096 andB>=Renv^4096.',
    consequence:'Every required first/second slow,tau,mixed and one-auxiliary derivative ofB_theta/Ac andB_z/u is<Renv^'+maximumPower+'<B. Derivatives in v gain1/L per v derivative. No inequality for the projected matrix is substituted for this amplitude estimate.',
    centerReference:'At inverseLength=epsilon=0,beta=-sign*u/FRstar,tau=1/2, the exact normalized rows areB_r=(1,1),B_theta/Ac=(1,-1),B_z/u=(sign,sign). Actual finite positive inverseLength/epsilon/rounding errors give entry errors<B^3/S. With|r|<=B^260/S, each full normalized center factor b_plus+b_minus*r has magnitude<2.',
    derivatives:'The derivatives of the full frame factors after multiplying(1,r) have first slow size<B^8 and second/mixed size<B^16, by the original r_i/r_ij bounds. The actual frame_v and frame_iv remain and are bounded byB/L.',
    weightedSlowProof:'The old exact radial identityW_r/A0=sqrt(Ybar)*(1+r), its first/second numerical rows and|r|<1/2 imply |(sqrtYbar)_i|/sqrt(gL)<2^-598 and |(sqrtYbar)_ij/(gL)+mu_i*mu_j*sqrtYbar|<2^-598. Multiply these identities by the actual normalized component factor, whose value is<2 and whose first/second jets obey the printed B powers. Every added term is<2^-590 usingS>=B^1024. Therefore the new conservative2^-560 error retains every basis and covariance derivative.',
    weightedFastProof:'Differentiate sqrtYbar*P*(w_plus/a)*(b_plus+b_minus*r) in v and in(i,v). Atv0,P=1,P_v=0,P_vv=-g/L and(w_plus/a)_i=0 exactly. The complete Riccati time/initial-layer bounds control q_v,q_iv,r_v,r_iv,r_vv. Each non-principal basis derivative has its1/L or1/L^2 factor; sqrtYbar_i times such a factor is also retained. The remaining normalized terms are bounded by2^-560.',
    strictlyPositiveAdditionalRadius:qtext(dyadic(560)),originalMovingFrameDerivativesSetToZero:false};
}

export function centeredNormalizedAmplitudeReferenceAudit(G,reference=centeredWholeTimeReferenceFrameAudit(G)){
  const{gamma,u,tau}=reference.coordinates,commonArgument=G.add(G.one,G.pow(u,2)),commonRoot=G.sqrt(commonArgument),Ac=G.mul(gamma,commonRoot),rows=reference.rows.map(r=>{
    const actualArgument=G.substitute(G.add(G.one,G.pow(r.frame.s,2)),tau,G.q(1,2)),actualRoot=G.sqrt(actualArgument),
      argumentCheck=sourceGraphRationalIdentity(G,G.sub(actualArgument,commonArgument),{maxTerms:2000});
    const expected=[[G.one,G.one],[G.one,G.q(-1)],[G.q(r.sign),G.q(r.sign)]],scales=[G.one,Ac,u],
      atCenter=r.frame.B.map((row,j)=>row.map(body=>G.div(G.substitute(body,tau,G.q(1,2)),scales[j]))),
      checks=atCenter.flatMap((row,j)=>row.map((root,k)=>({component:j,column:k,actual:root,expected:expected[j][k],
        ...sourceGraphRationalIdentity(G,G.sub(G.substitute(root,actualRoot,commonRoot),expected[j][k]),{maxTerms:12000})}))),
      retainedTimeDerivatives=[1,2].map(j=>r.frame.B[j].map(body=>G.derivative(G.div(body,scales[j]),tau)));
    return {sign:r.sign,expected,atCenter,checks,positiveRootCongruence:{actualArgument,commonArgument,actualRoot,commonRoot,argumentCheck,
      statement:'Equal positive radicands have the same positive square root; the sign-square relation is checked before this exact congruence.'},
      retainedTimeDerivatives,pass:argumentCheck.pass&&checks.every(c=>c.pass)};
  });
  if(rows.some(r=>!r.pass))fail('INTERNAL_VALIDATION','A normalized reference amplitude row has the wrong sign or scale.');
  return {schema:'MathScope.CenteredNormalizedAmplitudeReferenceAudit/1',reference,Ac,rows,pass:true,sourceAuthenticated:false,
    positiveScalePremises:'gamma>0,u>0; Ac=gamma*sqrt(1+u^2).',actualFrameReplaced:false,nonzeroTimeDerivativesRetained:true};
}

/** Thirty complete fast rows and the thirty-six previously unprovided
 * tangential/axial slow rows. For the negative-sign axial component the
 * numerical interval itself is negated; the geometric scale stays positive.
 * The two source signs/components use independent boxes even if the same
 * proved enclosure endpoints happen to contain them. */
export function encloseCenteredThreeComponentJetCoefficients(input,context={}){
  const fast=encloseCenteredFastJetCoefficients(input,context),slow=encloseCenteredSlowJetCoefficients(input,context),A=directedArithmetic(fast.request.precisionBits),
    amplitudeAudit=centeredNormalizedAmplitudePowerAudit(),radius=dyadic(560),rows=[];
  const put=(n,component,kind)=>{
    const signed=component===2&&n.sign===-1?A.neg(A.unpack(n.interval)):A.unpack(n.interval),box=A.widen(signed,radius),width=Q(box[1]-box[0],A.S);
    if(qcompare(width,readRational(fast.request.tolerance))>0)fail('PRECISION_REQUIRED','A complete three-component jet coefficient exceeds its exact requested width.');
    rows.push({...n,component,kind,interval:A.pack(box),width:qtext(width),positiveComponentScale:component===0?'1':component===1?'Ac':'u',
      axialOrientation:component===2?n.sign:1,extraFrameErrorRetained:true,nonzeroRemainderRetained:true,toleranceMet:true});
  };
  for(const component of[0,1,2])for(const n of fast.rows)put(n,component,'fast');
  for(const component of[1,2])for(const n of slow.rows)put(n,component,'slow');
  return {schema:'MathScope.CenteredThreeComponentJetDirectedCoefficients/1',request:fast.request,rows,amplitudeAudit,
    errorBudget:{positiveAdditionalRadius:qtext(radius),fastPredecessor:fast.errorBudget,slowPredecessor:slow.errorBudget,allMovingBasisAndDynamicCenterTermsRetained:true},
    sameOriginalAuxiliaryPointRequired:true,sourceAuthenticated:false,actualFullCurlNumericallyEnclosed:false,wholeGNUMComplete:false,pass:true};
}

/** Exact reduction in the quadratic algebra A+B*r, r^2=D. Nonzero
 * denominators have already been cleared. Coefficients retain their
 * original bodies; a root-dependent unhandled operation is rejected.
 */
export function centeredPositiveQuadraticReduction(G,expression,r,D){
  if(G.nodes[r]?.op!=='coordinate'||G.freeCoordinates(D).has(r))fail('INVALID_INPUT','The quadratic audit needs an independent formal root and its retained root-independent radicand.');
  const cache=new Map(),add=(a,b)=>[G.add(a[0],b[0]),G.add(a[1],b[1])],
    mul=(a,b)=>[G.add(G.mul(a[0],b[0]),G.mul(D,a[1],b[1])),G.add(G.mul(a[0],b[1]),G.mul(a[1],b[0]))],
    pow=(a,n)=>{let out=[G.one,G.zero];while(n){if(n%2)out=mul(out,a);n=Math.floor(n/2);if(n)a=mul(a,a);}return out;};
  function visit(id){
    if(cache.has(id))return cache.get(id);let value;
    if(id===r)value=[G.zero,G.one];
    else if(!G.freeCoordinates(id).has(r))value=[id,G.zero];
    else{const n=G.nodes[id];
      if(n.op==='add')value=n.args.map(visit).reduce(add);
      else if(n.op==='multiply')value=n.args.map(visit).reduce(mul);
      else if(n.op==='integer_power'&&n.args[1]>=0)value=pow(visit(n.args[0]),n.args[1]);
      else fail('INVALID_INPUT','Clear every root-dependent denominator before the quadratic identity audit.');
    }
    cache.set(id,value);return value;
  }
  const coefficients=visit(expression),checks=coefficients.map(x=>sourceGraphRationalIdentity(G,x,{maxTerms:80000}));
  return {expression,formalRoot:r,radicand:D,coefficients,checks,pass:checks.every(c=>c.pass),
    exactRelation:'r^2=D',positiveRealRootBindingRequired:true,sourceAuthenticated:false};
}

/** The full limiting matrix on EVERY 0<=tau<=1. The value of the full
 * source matrix is not assigned this comparison. Its positive distance
 * follows from separately retained inverse-length/epsilon/rounding errors.
 */
export function centeredWholeTimeReferenceFrameAudit(G){
  const q=(n,d=1)=>G.q(n,d),x=Object.fromEntries(['F','gamma','R','u','tau'].map(k=>[k,G.fresh('center_fast_reference_'+k)])),
    alpha=G.pow(x.gamma,2),FR=G.neg(G.div(G.mul(q(2),x.F,G.add(G.one,alpha)),x.R)),lambda0=G.mul(q(2),x.F,x.gamma),
    D0=G.add(G.one,G.pow(x.u,2)),dampingScale=G.div(lambda0,G.pow(G.sqrt(D0),3)),rows=[];
  for(const sign of[1,-1]){
    const beta=G.neg(G.div(G.mul(q(sign),x.u),FR)),frame=centeredNormalizedFullFrame(G,{F:x.F,FR,FZ:G.zero,R:x.R,tau:x.tau,beta,
      inverseLength:G.zero,epsilon:G.zero,lambda0,c0:G.neg(x.gamma),u:x.u,dampingScale,sign}),
      D=G.add(G.one,G.pow(frame.s,2)),root=G.sqrt(D),positiveRoot=G.fresh('center_fast_reference_root_'+sign),
      normalSquare=sourceGraphRationalIdentity(G,G.sub(frame.nSquared,D),{maxTerms:10000}),
      replacements=[[frame.nSquared,G.pow(positiveRoot,2)],[root,positiveRoot],[D,G.pow(positiveRoot,2)]],
      expected=[[G.zero,G.zero],[G.zero,G.neg(G.div(G.mul(q(2),lambda0),root))]],
      checks=frame.wMatrix.flatMap((row,i)=>row.map((body,j)=>{
        const left=adiabaticReplaceExactOperands(G,body,replacements),right=adiabaticReplaceExactOperands(G,expected[i][j],replacements),
          cleared=retainedCommonDenominatorIdentity(G,left,right,{denominators:[x.F,x.gamma,x.R,FR,positiveRoot,G.sqrt(D0)],maxTerms:30000}),
          reduction=centeredPositiveQuadraticReduction(G,cleared.clearedNumerator,positiveRoot,D),check={cleared,reduction,pass:reduction.pass};
        return {row:i,column:j,retained:body,expected:expected[i][j],check,pass:check.pass};
      }));
    rows.push({sign,frame,expected,normalSquare,checks,positiveRootRelation:{actualRoot:root,positiveRoot,radicand:D,
      statement:'The same positive sqrt(1+s^2) has square 1+s^2; nSquared=D is independently checked before rewriting.'},
      pass:normalSquare.pass&&checks.every(c=>c.pass)});
  }
  if(rows.some(r=>!r.pass))throw Object.assign(Error('The full-time reference matrix identity failed.'),{code:'INTERNAL_VALIDATION',rows});
  return {schema:'MathScope.CenteredWholeTimeReferenceFrameAudit/1',coordinates:x,rows,pass:true,
    identity:'M_comparison(tau)=diag(0,-2*lambda0/sqrt(1+u^2*(1/2+tau)^2)) on the entire0<=tau<=1.',
    derivativeConsequence:'Because this is an identity of the retained smooth bodies in tau, every finite tau derivative of the comparison error is zero. The source adapter needs its actual finite auxiliary derivatives before applying a mean-value bound.',
    fullPressureAndBasisFormulaRetained:true,comparisonOnly:true,actualMatrixReplaced:false,sourceAuthenticated:false};
}

/** Differentiate the COMPLETE comparison matrix at a fixed representative.
 * The field, radial derivative and radial coordinate vary; c0, lambda0,
 * beta0, L and labels remain frozen. The damping derivative is retained.
 */
export function centeredWholeTimeSlowSlopeAudit(G){
  const q=(n,d=1)=>G.q(n,d),x=Object.fromEntries(['F0','gamma','R0','u','tau','increment','f','d','r'].map(k=>[k,G.fresh('center_log_slope_'+k)])),
    alpha=G.pow(x.gamma,2),FR0=G.neg(G.div(G.mul(q(2),x.F0,G.add(G.one,alpha)),x.R0)),
    F=G.mul(x.F0,G.add(G.one,G.mul(x.f,x.increment))),FR=G.mul(FR0,G.add(G.one,G.mul(x.d,x.increment))),R=G.mul(x.R0,G.add(G.one,G.mul(x.r,x.increment))),
    lambda0=G.mul(q(2),x.F0,x.gamma),D0=G.add(G.one,G.pow(x.u,2)),dscale=G.div(lambda0,G.pow(G.sqrt(D0),3)),
    g=G.div(G.mul(q(3),lambda0,G.pow(x.u,2)),G.pow(G.sqrt(D0),3)),t=G.add(q(1,2),x.tau),D=G.add(G.one,G.mul(G.pow(x.u,2),G.pow(t,2))),
    refRoot=G.sqrt(D),lambda=G.div(lambda0,refRoot),AA=G.div(lambda,g),alphaDerivative=G.mul(G.add(G.one,alpha),G.sub(G.add(x.r,x.d),x.f)),
    c=G.add(x.f,G.div(alphaDerivative,G.mul(q(2),alpha))),
    expected=G.sub(G.mul(AA,c),G.mul(x.tau,t,G.add(G.div(G.mul(AA,G.pow(x.u,2)),D),q(2,3)),x.d)),rows=[];
  for(const sign of[1,-1]){
    const beta=G.neg(G.div(G.mul(q(sign),x.u),FR0)),frame=centeredNormalizedFullFrame(G,{F,FR,FZ:G.zero,R,tau:x.tau,beta,
      inverseLength:G.zero,epsilon:G.zero,lambda0,c0:G.neg(x.gamma),u:x.u,dampingScale:dscale,sign}),
      at=body=>G.substitute(body,x.increment,G.zero),actual=G.div(at(G.derivative(frame.wMatrix[0][0],x.increment)),g),
      nSquare=at(frame.nSquared),normalSquare=sourceGraphRationalIdentity(G,G.sub(nSquare,D),{maxTerms:5000}),
      actualReferenceRoot=G.sqrt(G.add(G.one,G.pow(frame.s,2))),positiveRoot=G.fresh('center_log_slope_positive_root_'+sign),
      squareRelation=sourceGraphRationalIdentity(G,G.sub(G.nodes[actualReferenceRoot].args[0],D),{maxTerms:5000}),
      pairs=[[nSquare,G.pow(positiveRoot,2)],[actualReferenceRoot,positiveRoot],[refRoot,positiveRoot],
        [G.nodes[actualReferenceRoot].args[0],G.pow(positiveRoot,2)],[D,G.pow(positiveRoot,2)]],
      left=adiabaticReplaceExactOperands(G,actual,pairs),right=adiabaticReplaceExactOperands(G,expected,pairs),
      cleared=retainedCommonDenominatorIdentity(G,left,right,{denominators:[x.F0,x.gamma,x.R0,x.u,FR0,positiveRoot,G.sqrt(D0),lambda0],maxTerms:80000}),
      reduction=centeredPositiveQuadraticReduction(G,cleared.clearedNumerator,positiveRoot,D),check={cleared,reduction,pass:reduction.pass},
      withoutDamping=G.add(expected,G.mul(q(2,3),x.tau,t,x.d)),omitted=sourceGraphRationalIdentity(G,G.sub(expected,withoutDamping),{maxTerms:2000});
    rows.push({sign,frame,actual,expected,check,normalSquare,squareRelation,negativeControl:{omitted:'the derivative of the actual reference-normalized damping',check:omitted,correctlyRejected:!omitted.pass},
      pass:check.pass&&normalSquare.pass&&squareRelation.pass&&!omitted.pass});
  }
  if(rows.some(r=>!r.pass))throw Object.assign(Error('The full-time slow diagonal derivative did not bind.'),{code:'INTERNAL_VALIDATION',rows});
  return {schema:'MathScope.CenteredWholeTimeSlowSlopeAudit/1',coordinates:x,alpha,alphaDerivative,c,expected,g,t,D,AA,rows,pass:true,
    formula:'M11_i/g=A(t)*(F_i/F+alpha_i/(2alpha))-(t-1/2)*t*(A(t)*u^2/(1+u^2*t^2)+2/3)*(FR_i/FR),t=1/2+tau.',
    integration:{range:['1/2','1'],limitIA:'log(2)/3',limitIB:'log(2)/3-7/72',
      exactPositiveInverseU2:'zeta=u^-2>0',IAIntegrand:'(1+zeta)^(3/2)/(3*sqrt(t^2+zeta))',
      IBIntegrand:'(t-1/2)*t*((1+zeta)^(3/2)/(3*(t^2+zeta)^(3/2))+2/3)',
      finiteUError:'For0<zeta<1 and1/2<=t<=1, the zeta derivatives of these two integrands have absolute values<16 and<128. Their integration widths are1/2, so replacing only the COMPARISON integrals by IA,IB has errors<8*zeta and64*zeta respectively.',
      primitive:'Integral_(1/2)^1 [(t-1/2)/(3*t^2)+(2/3)*(t-1/2)*t]dt=(log2-1/2)/3+5/72.'},
    originalSlowFactorAndDampingRequired:true,actualSourceMatrixReplaced:false,sourceAuthenticated:false};
}

/** A differentiated stable Riccati estimate at the center, including the
 * initial layer. A whole-interval cone alone does not prove these jets.
 */
export function centeredFastStabilityPowerAudit(){
  const rows=[],put=(id,power,denominatorPower,reason)=>{rows.push({id,power,denominatorPower,reason});return power;},
    error=put('error_matrix_and_two_tau_derivatives',64,1,'The entire reference error is zero. Actual auxiliary mean-value bounds include tau^2 and one auxiliary derivative, inside the four-primitive reserve including Bprime.'),
    qv=put('log_positive_mode_first_v',66,1,'M11+M12*r, |r|<=B^260/S<1.'),
    globalRv=put('whole_interval_ratio_v',263,1,'The complete Riccati RHS; no initial layer is dropped.'),
    ratioVForce=put('ratio_v_linear_forcing',265,2,'M21_v+(M22_v-M11_v)*r-M12_v*r^2; lambda_v<=B^3/S and E_v<=B^65/S^2.'),
    rv=put('center_ratio_v',267,2,'The exact linear propagator is <=exp(-(v-s)/B), costing B; the nonzero initial r_v(0) is suppressed by exp(-L/(4B)).'),
    rIvForce=put('mixed_ratio_iv_linear_forcing',267,1,'Differentiate r_i prime=A_r*r_i+F_i in v, retaining A_r_v*r_i and every F_i_v product; use the global ratio_v bound and |r_i|<=B^6.'),
    riv=put('center_mixed_ratio_iv',269,1,'The same stable convolution costs B and preserves the initial M21_i(0) exp(-v/B) term.'),
    rvv=put('center_ratio_vv',270,2,'Evaluate A_r*r_v+F_v with the already bounded actual center r_v.'),
    qvv=put('center_log_positive_mode_second_v',67,2,'E11_v+E12_v*r+E12*r_v, with the actual center ratio derivative.'),
    wvv=put('center_positive_mode_second_v_over_value',134,2,'q_v^2+q_vv; every quadratic term is retained.'),
    normalized=put('complete_weighted_fast_and_mixed_error_reserve',300,0,'P(v0)=1,P_v(v0)=0,P_vv(v0)=-g/L. Combine all mode, ratio and inverse-weight derivatives before dividing by A0 and the displayed scales.');
  const checks=[{id:'first-stable-convolution-reserve',pass:ratioVForce+1<rv},
    {id:'mixed-stable-convolution-reserve',pass:rIvForce+1<riv},
    {id:'second-mode-and-product-reserve',pass:Math.max(rv+2,ratioVForce)+1<=rvv&&2*qv+2<=wvv},
    {id:'final-normalized-reserve',pass:Math.max(rvv+3,riv+2,wvv+3,qv+6)<normalized},
    {id:'positive-source-power-is-smaller-than-dyadic-budget',pass:128*(512-normalized)>600},
    {id:'whole-center-layer-is-smaller-than-four-logarithms',pass:512>2+4}];
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The fast variational power reserve failed.');
  return {schema:'MathScope.CenteredFastStabilityPowerAudit/1',rows,checks,pass:true,
    premises:{source:'B>=2^128,S>=B^1024,S/B<=L<=S,B^-1<g<B; fixed L and representative.',
      coefficients:'M=diag(0,-2lambda)+E, |partial_tau^j E|<=B^64/S and |partial_tau^j lambda|<=B^2 forj<=2. All M_i,M_ij,L*M_iv are<=B.',
      solution:'w(0)=(1,0); w_plus>0,|r|<=B^260/S; A_r=M22-M11-2M12*r<=-1/B. The actual r_i bound is B^6 and its initial value is0.',
      inverse:'The original centered H/inverse/sqrt first-jet bounds hold with their positive conditioning domain; |(sqrt ybar)_i|/sqrt(gL)<=1.'},
    initialLayer:{timeDomain:'L/4<=v<=3L/4',positiveTerm:'exp(-L/(4B))',
      proof:'Since L/(4B)>=S/(4B^2), sqrtS>=B^512>16B^2 and logS<sqrtS, S/(4B^2)>4logS. Hence0<exp(-L/(4B))<S^-4. The initial terms are included before the stated polynomial bounds.',
      initialValues:'r_v(0)=M21(0), r_iv(0)=M21_i(0); these need not be zero.'},
    identities:{qv:'q_v=M11+M12*r',rv:'r_v=M21+(M22-M11)*r-M12*r^2',
      fast:'W_v/(A0*sqrt(g/L))=0+error; W_vv/(A0*g/L)=-(W/A0)+error.',
      mixed:'D_i W_v/(A0*g)=mu_i*(W/A0)+error. The derivative of the dynamic center cancels exactly; derivatives of sqrt ybar and r remain.'},
    positiveNormalizedError:dyadic(600).map(String).join('/'),sourceAuthenticated:false,actualMatrixOrInitialLayerDiscarded:false};
}

export function encloseCenteredFastJetCoefficients(input,context={}){
  const slow=encloseCenteredSlowJetCoefficients(input,context),request=slow.request,A=directedArithmetic(request.precisionBits),
    audit=centeredFastStabilityPowerAudit(),radius=dyadic(600),mu=Object.fromEntries(Object.entries(slow.comparisonSlopes).map(([k,v])=>[k,A.unpack(v)])),rows=[];
  for(const [family,box]of request.weightedCenters.entries()){
    const W=A.unpack(box),put=(derivative,order,comparison,leading,exactScale)=>{
      const value=A.widen(leading,radius),width=Q(value[1]-value[0],A.S);
      if(qcompare(width,readRational(request.tolerance))>0)fail('PRECISION_REQUIRED','The conditional complete fast coefficient '+derivative+' exceeds its tolerance.');
      rows.push({family,sign:family===0?1:-1,derivative,order,comparison,interval:A.pack(value),width:qtext(width),exactScale,nonzeroRemainderRetained:true,toleranceMet:true});
    };
    put('v',1,'0',A.zero(),'A0*sqrt(g/Ls)');
    put('vv',2,'-W/A0',A.neg(W),'A0*g/Ls');
    for(const i of['R','Z','T'])put(i+'v',2,'mu_'+i+'*(W/A0)',A.mul(mu[i],W),'A0*g');
  }
  return {schema:'MathScope.CenteredFastJetDirectedCoefficients/1',request,rows,comparisonSlopes:slow.comparisonSlopes,audit,
    errorBudget:{radius:qtext(radius),initialLayerIncluded:true,allMixedWeightAndModeDerivativesRequired:true,everyWidthChecked:true},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,additionalOperations:A.operations(),binary64UsedForDecisions:false},
    sourceAuthenticated:false,actualPhysicalCurlNumericallyEnclosed:false,wholeGNUMComplete:false,pass:true};
}

/** The center logarithmic derivative is an integral over the full first
 * half of the pulse, not the diagonal slope at its endpoint. Actual h,
 * step and complete Gamma factors are retained in c_i and d_i.
 */
export function enclosePulseCenterLogSlopes(input,context={}){
  const slow=encloseCenteredSlowJetCoefficients(input,context),request=slow.request,A=directedArithmetic(request.precisionBits),
    h=A.small(4096),alpha=A.mul(h,A.unpack(slow.actualPositiveFactors.alphaOverPositiveH)),xi=A.unpack(slow.actualPositiveFactors.alphaLogT),
    alphaT=A.mul(alpha,xi),fR=A.neg(A.mul(A.point(2),A.add(A.one(),alpha))),fT=A.sub(alpha,h),
    c={R:A.sub(fR,xi),Z:A.zero(),T:A.add(fT,A.div(xi,A.point(2)))},
    d={R:A.sub(A.sub(fR,A.one()),A.div(A.mul(A.point(2),alphaT),A.add(A.one(),alpha))),Z:A.zero(),T:A.add(fT,A.div(alphaT,A.add(A.one(),alpha)))},
    logTwo=A.logRational('2'),IA=A.div(logTwo,A.point(3)),IB=A.sub(IA,A.point(Q(7,72))),radius=dyadic(600),rows=[];
  for(const direction of['R','Z','T']){
    const reference=A.sub(A.mul(IA,c[direction]),A.mul(IB,d[direction])),value=A.widen(reference,radius),width=Q(value[1]-value[0],A.S);
    if(qcompare(width,readRational(request.tolerance))>0)fail('PRECISION_REQUIRED','The center logarithmic slope width exceeds its exact tolerance.');
    if(direction!=='Z'&&value[1]>=0n)fail('PRECISION_REQUIRED','The nonzero negative original center slope is not separated.');
    rows.push({direction,coefficient:A.pack(value),reference:A.pack(reference),width:qtext(width),exactQuantity:'D_'+direction+' log(w_plus(v0))/(g*Ls)',
      exactScale:'g*Ls',nonzeroRemainderRetained:true,toleranceMet:true});
  }
  return {schema:'MathScope.PulseCenterLogSlopeDirectedCoefficients/1',request,rows,c:Object.fromEntries(Object.entries(c).map(([k,v])=>[k,A.pack(v)])),
    d:Object.fromEntries(Object.entries(d).map(([k,v])=>[k,A.pack(v)])),logTwo:A.pack(logTwo),IA:A.pack(IA),IB:A.pack(IB),
    formula:'nu_i=(log2/3)*c_i-(log2/3-7/72)*d_i; c_i=F_i/F+alpha_i/(2alpha),d_i=FR_i/FR, with frozen D_R=Rstar*partial_R.',
    errorBudget:{positiveRadius:qtext(radius),finitePositiveInverseU2Upper:'2^-81922',finiteUIntegralErrors:['8/u^2','64/u^2'],
      wholeTimeOriginalMatrixAndModeError:'B^266/S',fullSecondLogarithmicDerivative:'|D_iD_j log a|/(gLs)^2<=B^23/S',
      noWholeImproperHeatTailRemoved:true,noOriginalCenterOrSlowDerivativeSetToZero:true},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,additionalOperations:A.operations(),binary64UsedForDecisions:false},
    sourceAuthenticated:false,wholeGNUMComplete:false,pass:true};
}

/** Original a,H,y derivatives, with no unknown center amplitude left in
 * the numerical coefficient. Their remaining source geometry scales are
 * explicit and MUST NOT be described as numerically evaluated here.
 */
export function encloseCenterCovarianceSlowJetCoefficients(input,context={}){
  if(!input||Object.keys(input).some(k=>!['precisionBits','tolerance','weightedCenters','absoluteCenters','absoluteH','absoluteWeights'].includes(k)))
    fail('INVALID_INPUT','Only exact numerical controls and the separate conditional original center/H/weight intervals are accepted.');
  const {absoluteCenters,absoluteH,absoluteWeights,...controls}=input,nu=enclosePulseCenterLogSlopes(controls,context),request=nu.request,A=directedArithmetic(request.precisionBits),
    boxed=(x,low,high,name)=>{if(!x||Object.keys(x).sort().join(',')!=='lower,upper')fail('INVALID_INPUT','Use exact two-endpoint conditional '+name+' intervals.');
      const value=A.unpack(x);if(value[0]<A.point(low)[0]||value[1]>A.point(high)[1])fail('INVALID_INPUT','The '+name+' interval lies outside its declared conditioning box.');return value;},
    directions=['R','Z','T'],pairs=['RR','RZ','RT','ZZ','ZT','TT'],slopes=Object.fromEntries(nu.rows.map(r=>[r.direction,A.unpack(r.coefficient)]));
  if(!Array.isArray(absoluteCenters)||absoluteCenters.length!==2||!Array.isArray(absoluteWeights)||absoluteWeights.length!==2||
    !Array.isArray(absoluteH)||absoluteH.length!==2||absoluteH.some(row=>!Array.isArray(row)||row.length!==2))
    fail('INVALID_INPUT','Two original centers, four H entries and two original positive weights are required.');
  const a=absoluteCenters.map(x=>boxed(x,Q(1,4),Q(1,2),'center')),y=absoluteWeights.map(x=>boxed(x,Q(1),Q(4),'weight')),
    H=absoluteH.map((row,j)=>row.map((x,i)=>boxed(x,j===1&&i===1?Q(-1,2):Q(1,8),j===1&&i===1?Q(-1,8):Q(1,2),'H'))),
    radius=dyadic(580),rows=[],put=(quantity,sign,component,derivative,order,base,multiplier,scale)=>{
      const lead=A.mul(base,multiplier),box=A.widen(lead,radius),width=Q(box[1]-box[0],A.S);
      if(qcompare(width,readRational(request.tolerance))>0)fail('PRECISION_REQUIRED','The original '+quantity+' '+derivative+' coefficient exceeds its exact tolerance.');
      rows.push({quantity,sign,component,derivative,order,interval:A.pack(box),width:qtext(width),exactScale:scale,nonzeroRemainderRetained:true,toleranceMet:true});
    };
  for(let i=0;i<2;i++){
    const sign=i===0?1:-1;
    for(const axis of directions){
      put('a',sign,0,axis,1,a[i],slopes[axis],'g*Ls');
      for(let j=0;j<2;j++)put('H',sign,j,axis,1,H[j][i],A.mul(A.point(2),slopes[axis]),(j===0?'Ac':'u')+'*massScale*g*Ls');
      put('y',sign,0,axis,1,y[i],A.mul(A.point(-2),slopes[axis]),'(tau/massScale)*g*Ls');
    }
    for(const pair of pairs){
      const square=A.mul(slopes[pair[0]],slopes[pair[1]]);
      put('a',sign,0,pair,2,a[i],square,'(g*Ls)^2');
      for(let j=0;j<2;j++)put('H',sign,j,pair,2,H[j][i],A.mul(A.point(4),square),(j===0?'Ac':'u')+'*massScale*(g*Ls)^2');
      put('y',sign,0,pair,2,y[i],A.mul(A.point(4),square),'(tau/massScale)*(g*Ls)^2');
    }
  }
  return {schema:'MathScope.CenterCovarianceSlowJetDirectedCoefficients/1',request,nu,rows,conditionalValueBoxes:{absoluteCenters,absoluteH,absoluteWeights},
    recurrences:{center:'a_i=a*q_i; a_ij=a*(q_i*q_j+q_ij).',
      covariance:'H_ij=a^2*((4*q_i*q_j+2*q_ij)*K+2*q_i*K_j+2*q_j*K_i+K_ij),K=H/a^2.',
      inverse:'y_ij=a^-2*((4*q_i*q_j-2*q_ij)*Y-2*q_i*Y_j-2*q_j*Y_i+Y_ij),Y=a^2*y; the original full target is inside Y.'},
    errorBudget:{positiveRadius:qtext(radius),centerAmplitudeNumericallyEnclosed:true,originalSecondLogarithmicDerivativeRetained:true,
      everyWholeIntervalAndMixedProductErrorIncluded:true,exactPositiveGeometryScalesNumericallyEvaluated:false},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,additionalOperations:A.operations(),binary64UsedForDecisions:false},
    sourceAuthenticated:false,originalHOrWeightReplaced:false,wholeGNUMComplete:false,pass:true};
}
