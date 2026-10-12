/** Directed slow-jet coefficients at the centered terminal pulse.
 * Every result in this file is CONDITIONAL on the printed source premises.
 * The separate adapter must authenticate the original full matrix, heat,
 * covariance inverse, positive square root and all quantitative bounds.
 */
import {directedArithmetic,rational as Q,readRational,qadd,qsub,qmul,qdiv,qcompare,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {encloseNormalizedHeatMoments} from './actual-heat-scaled-enclosure.mjs';
import {encloseTerminalStepJet} from './actual-terminal-field-scaled-enclosure.mjs';
import {retainedCommonDenominatorIdentity,instantiateRetainedThirdBodies} from './actual-third-jet-algebra.mjs';
import {retainedThirdMatrixFTCNorm} from './actual-third-jet-ftc.mjs';
import {ActualPulseJetExpressions} from './actual-pulse-jet-kernel.mjs';

/** The same exact dependency test, stored once per expression. Large
 * collections of bound FTC coordinates must not create an expression x
 * coordinate Cartesian-product cache. Non-coordinate operands keep the
 * inherited rule; all function and Volterra argument lists are retained.
 */
export class ActualCenteredSlowJetExpressions extends ActualPulseJetExpressions{
  dependsOn(id,variable){
    if(this.nodes[variable]?.op==='coordinate')return this.freeCoordinates(id).has(variable);
    return super.dependsOn(id,variable);
  }
  substitute(id,variable,value){
    if(this.nodes[variable]?.op==='coordinate'&&!this.freeCoordinates(id).has(variable))return id;
    return super.substitute(id,variable,value);
  }
}

const dyadic=n=>Q(1,1n<<BigInt(n)),rationalBox=(a,b)=>({lower:qtext(a),upper:qtext(b)});

/** Coefficientwise absolute Taylor majorants at the actual chart center.
 * These finite recurrences are bounds for the original implicit chart,
 * original step and complete positive Gamma integral, not sampled jets.
 * The separate adapter must bind the indicated original local formula.
 */
export function terminalFiniteSlowFieldMajorant(){
  const order=5,zero=()=>Array.from({length:order+1},()=>Q(0)),constant=x=>{const p=zero();p[0]=x;return p;},
    add=(a,b)=>a.map((x,i)=>qadd(x,b[i])),scale=(a,b)=>a.map(x=>qmul(x,b)),
    mul=(a,b)=>a.map((_,i)=>{let s=Q(0);for(let k=0;k<=i;k++)s=qadd(s,qmul(a[k],b[i-k]));return s;}),
    power=(a,n)=>{let p=constant(Q(1));for(let k=0;k<n;k++)p=mul(p,a);return p;},
    compose=(coeff,a)=>coeff.reduce((p,c,n)=>add(p,scale(power(a,n),c)),zero()),
    t=zero();t[1]=Q(1);const t2=mul(t,t),geometric=Array.from({length:order+1},(_,n)=>Q(1n<<BigInt(n)));
  // w=s-1=t_T+t_Z^2*(1+w)^(2h). Since 0<h<1,
  // |binomial(2h,n)|<=2^n. Every coefficient is determined by lower ones.
  let w=zero();const implicitIterations=[];
  for(let k=0;k<=order;k++){w=add(t,mul(t2,compose(geometric,w)));implicitIterations.push(w.map(qtext));}
  const logCoefficients=Array.from({length:order+1},(_,n)=>n?Q(1,n):Q(0)),logS=compose(logCoefficients,w),
    argumentShift=add(logCoefficients,scale(logS,Q(1,2))),
    g=Array.from({length:order+1},(_,n)=>n?Q(2n*BigInt(n+1)*8n**BigInt(n+2)):Q(0)),sigma=[Q(1)];
  // sigma'=sigma*(1-sigma)*g'. All intermediate signed coefficients
  // are bounded by sigma+sigma^2, preserving the finite product sums.
  for(let n=0;n<order;n++){
    let s=Q(0);
    for(let k=0;k<=n;k++){
      let product=Q(0);for(let j=0;j<=k;j++)product=qadd(product,qmul(sigma[j],sigma[k-j]));
      s=qadd(s,qmul(qadd(sigma[k],product),qmul(Q(n-k+1),g[n-k+1])));
    }
    sigma.push(qdiv(s,Q(n+1)));
  }
  const step=compose([Q(1),...sigma.slice(1).map(c=>qdiv(c,Q(256)))],argumentShift),
    inverseRadiusSquare=Array.from({length:order+1},(_,n)=>Q(n+1)),heatShift=mul(add(constant(Q(1)),t),inverseRadiusSquare);heatShift[0]=Q(0);
  const heat=compose(Array.from({length:order+1},(_,n)=>n?Q(factorial(n+1)):Q(1)),heatShift),
    radial=Array.from({length:order+1},(_,n)=>Q(BigInt((n+1)*(n+2)*(n+3)),6)),field=mul(mul(radial,step),heat),
    rows=field.map((coefficient,n)=>({order:n,absoluteTaylorCoefficient:qtext(coefficient),ordinaryDerivativeUpper:qtext(qmul(Q(factorial(n)),coefficient)),
      pass:qcompare(qmul(Q(factorial(n)),coefficient),Q(1n<<512n))<0}));
  if(rows.some(r=>!r.pass))fail('INTERNAL_VALIDATION','A retained finite slow-field majorant exceeded its exact reserve.');
  return {schema:'MathScope.TerminalFiniteSlowFieldMajorant/1',order,rows,implicitIterations,
    majorants:{chartIncrement:w.map(qtext),stepArgumentIncrement:argumentShift.map(qtext),stepAtOneEighth:sigma.map(qtext),heatArgumentIncrement:heatShift.map(qtext),radial:radial.map(qtext)},
    normalizedDerivativeBound:'2^512 times the positive original radial amplitude Bstar',
    premises:'The actual field is Bstar*(1+x)^(-2*(1+h))*f_o(11/4+2log(1+x)-log(s))*H(zstar*(1+t_T)/(1+x)^2); s-1=t_T+t_Z^2*s^(2h), 0<h<1,0<zstar<1/16. x=(R-Rstar)/Rstar and Rstar is frozen.',
    derivation:{chart:'Comparison of each absolute multivariate coefficient after replacing all absolute coordinate increments by one positive indeterminate. The exact implicit recurrence needs only previously determined degrees.',
      step:'At1/8, g=(1-x)^(-2)-x^(-2) has |[t^n]g|<=2(n+1)8^(n+2). sigma0 lies in[0,1]. Its exact logistic differential equation gives the printed finite coefficient recurrence.',
      heat:'The original complete Gamma density gives |H^(j)(z)|<=j!*(j+1)! for z>=0,0<h<1. Taylor coefficients are divided by j! before composition; no improper tail is removed.',
      radial:'For0<h<1, absolute coefficients of(1+x)^(-2*(1+h)) are bounded by those of(1-x)^(-4).',
      sourceConversion:'At the authenticated point f_o*H>1/2 and F<Renv^71, so Bstar<2Renv^71<Renv^72. Because2^512<Renv, each normalized ordinary slow derivative through five is<Renv^73. This last conversion is a source premise, not a generic certificate.'},
    allMixedCoefficientsCovered:true,onlyFiniteTaylorMajorantUsed:true,sourceAuthenticated:false,pass:true};
}

export function centeredSecondJetIndices(count=3){
  if(!Number.isSafeInteger(count)||count<1||count>3)fail('INVALID_INPUT','Use one through three slow directions.');
  const out=[Array(count).fill(0)];
  for(let i=0;i<count;i++){const a=Array(count).fill(0);a[i]=1;out.push(a);}
  for(let i=0;i<count;i++)for(let j=i;j<count;j++){const a=Array(count).fill(0);a[i]++;a[j]++;out.push(a);}
  return out;
}
const jetKey=a=>a.join(','),jetDegree=a=>a.reduce((a,b)=>a+b,0),
  subindex=(a,b)=>b.every((x,j)=>x<=a[j]),jetBinomial=(a,b)=>a.reduce((n,x,j)=>n*(x===2&&b[j]===1?2:1),1),secondBodyCache=new WeakMap();
export function centeredSecondScalarJet(G,body,directions){
  if(!Number.isSafeInteger(body)||!G.nodes[body]||!Array.isArray(directions)||new Set(directions).size!==directions.length||directions.some(x=>G.nodes[x]?.op!=='coordinate'))
    fail('INVALID_INPUT','Supply a retained scalar body and distinct coordinate directions.');
  const indices=centeredSecondJetIndices(directions.length),roots=[],lookup=new Map();
  for(const alpha of indices){let value=body;if(jetDegree(alpha)){const axis=alpha.findLastIndex(x=>x>0),previous=[...alpha];previous[axis]--;value=G.derivative(lookup.get(jetKey(previous)),directions[axis]);}roots.push(value);lookup.set(jetKey(alpha),value);}
  return {body,directions:[...directions],indices,roots,sourceAuthenticated:false};
}
export function centeredSecondBodyBinding(G,body,directions){
  let cache=secondBodyCache.get(G);if(!cache){cache=new Map();secondBodyCache.set(G,cache);}const key=JSON.stringify([body,directions]);if(cache.has(key))return cache.get(key);
  const direct=centeredSecondScalarJet(G,body,directions),free=G.freeCoordinates(body),parameters=[...directions.filter(x=>free.has(x)),...[...free].filter(x=>!directions.includes(x)).sort((a,b)=>a-b)],
    system=parameters.length?G.defineExpressionFunction({name:'CenteredSecondBody_'+body,parameters,body,derivativeLimits:parameters.map(x=>directions.includes(x)?2:0)}):null,value=system===null?body:G.expressionValue(system,parameters),formal=centeredSecondScalarJet(G,value,directions),
    materialized=formal.roots.map(id=>G.nodes[id].op==='actual_expression_partial'&&G.nodes[id].args[0]===system?G.materializeExpressionFunction(...G.nodes[id].args):id),
    checks=direct.indices.map((orders,i)=>({orders,retained:direct.roots[i],materialized:materialized[i],pass:direct.roots[i]===materialized[i]}));
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','A retained second-jet body does not materialize to its actual derivative.');
  const result={body,parameters,system,value,indices:direct.indices,roots:formal.roots,directRoots:direct.roots,materialized,checks,unspecifiedOracle:false,sourceAuthenticated:false,pass:true};cache.set(key,result);return result;
}

/** All first and mixed-second inverse/sqrt identities are collected from
 * retained H and target bodies, and separately materialized to actual AD.
 * This API has no source authority and does not accept derivative matrices.
 */
export function centeredSecondInverseSqrtAudit(G,{matrix,target,directions}){
  if(matrix?.length!==2||matrix.some(r=>r?.length!==2)||target?.length!==2||[...matrix.flat(),...target].some(x=>!Number.isSafeInteger(x)||!G.nodes[x]))fail('INVALID_INPUT','Use retained2x2 covariance and target bodies.');
  const H=matrix.map(row=>row.map(x=>centeredSecondBodyBinding(G,x,directions))),T=target.map(x=>centeredSecondBodyBinding(G,x,directions)),bindings=[...H.flat(),...T],
    indices=centeredSecondJetIndices(directions.length),lookup=new Map(indices.map((a,i)=>[jetKey(a),i])),
    inverse=(h,t)=>{const determinant=G.sub(G.mul(h[0][0],h[1][1]),G.mul(h[0][1],h[1][0])),adjugate=[[h[1][1],G.neg(h[0][1])],[G.neg(h[1][0]),h[0][0]]];
      if(determinant===G.zero)fail('SINGULAR_COVARIANCE','The retained covariance is identically singular.');return {determinant,weights:adjugate.map(row=>G.div(G.add(...row.map((x,j)=>G.mul(x,t[j]))),determinant))};},
    actual=inverse(matrix,target),formal=inverse(H.map(row=>row.map(b=>b.value)),T.map(b=>b.value)),actualY=actual.weights.map(x=>centeredSecondScalarJet(G,x,directions)),formalY=formal.weights.map(x=>centeredSecondScalarJet(G,x,directions)),inverseChecks=[];
  for(const [at,alpha]of indices.entries())for(const row of[0,1]){
    const rhs=G.add(...indices.filter(beta=>subindex(alpha,beta)).flatMap(beta=>{
      const b=lookup.get(jetKey(beta)),rest=lookup.get(jetKey(alpha.map((x,j)=>x-beta[j])));return[0,1].map(j=>G.mul(G.q(jetBinomial(alpha,beta)),H[row][j].roots[b],formalY[j].roots[rest]));})),
      algebra=retainedCommonDenominatorIdentity(G,rhs,T[row].roots[at],{denominators:[formal.determinant]}),materialized=instantiateRetainedThirdBodies(G,formalY[row].roots[at],bindings),
      retained=actualY[row].roots[at];inverseChecks.push({orders:alpha,row,algebra,materialized,retained,bodyDerivativeBinding:materialized===retained,pass:algebra.pass&&materialized===retained});
  }
  const squareRoots=actual.weights.map(value=>{
    const b=centeredSecondBodyBinding(G,value,directions),sigma=G.sqrt(value),formalSigma=G.sqrt(b.value),jet=centeredSecondScalarJet(G,sigma,directions),formalJet=centeredSecondScalarJet(G,formalSigma,directions),checks=[];
    for(const [at,alpha]of indices.entries())if(at){
      const middle=indices.filter(beta=>subindex(alpha,beta)&&jetDegree(beta)>0&&jetKey(beta)!==jetKey(alpha)),
        rhs=G.add(G.mul(G.q(2),formalSigma,formalJet.roots[at]),...middle.map(beta=>G.mul(G.q(jetBinomial(alpha,beta)),formalJet.roots[lookup.get(jetKey(beta))],formalJet.roots[lookup.get(jetKey(alpha.map((x,j)=>x-beta[j])))]))),
        algebra=retainedCommonDenominatorIdentity(G,rhs,b.roots[at],{denominators:[formalSigma]}),materialized=instantiateRetainedThirdBodies(G,formalJet.roots[at],[b]);
      checks.push({orders:alpha,middleSubindices:middle,algebra,materialized,retained:jet.roots[at],bodyDerivativeBinding:materialized===jet.roots[at],pass:algebra.pass&&materialized===jet.roots[at]});
    }
    return {value,sigma,roots:jet.roots,bodyBinding:b,checks,positiveWeightRequired:true,pass:checks.every(c=>c.pass)};
  });
  if(inverseChecks.some(c=>!c.pass)||squareRoots.some(p=>!p.pass))fail('INTERNAL_VALIDATION','A full centered inverse or positive square-root derivative lost a product term.');
  return {schema:'MathScope.CenteredSecondInverseSqrtAudit/1',indices,matrix,target,bodyBindings:bindings,determinant:actual.determinant,weights:actual.weights,
    matrixJets:indices.map((_,i)=>H.map(row=>row.map(b=>b.directRoots[i]))),targetJets:indices.map((_,i)=>T.map(b=>b.directRoots[i])),weightJets:indices.map((_,i)=>actualY.map(j=>j.roots[i])),
    inverseChecks,squareRoots,denominatorNonzeroRequired:true,sourceAuthenticated:false,pass:true};
}

export function centeredSecondProductAudit(G,{factors,directions}){
  if(!Array.isArray(factors)||!factors.length)fail('INVALID_INPUT','Use at least one retained product factor.');
  const bindings=factors.map(x=>centeredSecondBodyBinding(G,x,directions)),indices=centeredSecondJetIndices(directions.length),lookup=new Map(indices.map((a,i)=>[jetKey(a),i]));
  let expanded=indices.map((_,i)=>i?G.zero:G.one);
  for(const factor of bindings)expanded=indices.map(alpha=>G.add(...indices.filter(beta=>subindex(alpha,beta)).map(beta=>G.mul(G.q(jetBinomial(alpha,beta)),expanded[lookup.get(jetKey(beta))],factor.roots[lookup.get(jetKey(alpha.map((x,j)=>x-beta[j])))]))));
  const body=G.mul(...factors),actual=centeredSecondScalarJet(G,body,directions),formal=centeredSecondScalarJet(G,G.mul(...bindings.map(b=>b.value)),directions),checks=indices.map((orders,i)=>{
    const algebra=retainedCommonDenominatorIdentity(G,formal.roots[i],expanded[i]),materialized=instantiateRetainedThirdBodies(G,formal.roots[i],bindings);
    return {orders,algebra,materialized,retained:actual.roots[i],bodyDerivativeBinding:materialized===actual.roots[i],pass:algebra.pass&&materialized===actual.roots[i]};
  });
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','A retained second product derivative omitted a mixed or repeated term.');
  return {body,factors,indices,roots:actual.roots,bodyBindings:bindings,checks,sourceAuthenticated:false,pass:true};
}

/** Alias the genuine original Volterra value to its internally generated
 *20-component second variation. All time-uniform envelopes are complete
 *FTC integrals of the retained bodies; none is a numerical norm guess.
 */
export function defineCenteredFullSecondVariation(G,{name,originalSystem,directions}){
  const original=G.assertPulseJetCovariance(originalSystem),v=original.variable,indices=centeredSecondJetIndices(directions.length),lookup=new Map(indices.map((a,i)=>[jetKey(a),i])),
    scalar=original.matrix.map(row=>row.map(x=>centeredSecondScalarJet(G,x,directions))),matrices=indices.map((_,i)=>scalar.map(row=>row.map(j=>j.roots[i]))),
    options={variable:v,length:original.length,parameters:original.parameters},norms=matrices.map(M=>retainedThirdMatrixFTCNorm(G,M,options)),
    timeMatrix=original.matrix.map(row=>row.map(x=>G.derivative(x,v))),timeNorm=retainedThirdMatrixFTCNorm(G,timeMatrix,options),
    secondNorms=directions.map((_,i)=>directions.map((__,j)=>{const a=Array(directions.length).fill(0);a[i]++;a[j]++;return norms[lookup.get(jetKey(a))].upper;})),
    zeros=directions.map(()=>G.zero),zeroMatrix=directions.map(()=>directions.map(()=>G.zero));
  if(original.initial[0]!==G.one||original.initial[1]!==G.zero||directions.some(x=>G.derivative(original.length,x)!==G.zero))fail('INVALID_SOURCE_CONSTRUCTION','The centered source needs its actual unit datum and fixed slow-independent endpoint.');
  const system=G.definePulseSecondVariation({name,variable:v,parameters:original.parameters,directions,matrix:original.matrix,initial:original.initial,left:G.zero,length:original.length,
    matrixNorm:norms[0].upper,matrixFirstNorms:directions.map((_,i)=>norms[i+1].upper),matrixSecondNorms:secondNorms,matrixTimeNorm:timeNorm.upper,
    initialNorm:G.one,initialFirstNorms:zeros,initialSecondNorms:zeroMatrix,leftFirstNorms:zeros,leftSecondNorms:zeroMatrix});
  G.bindOriginalCovarianceJet(originalSystem,system);const retained=G.pulseJetSystems[system];
  if(JSON.stringify(retained.matrix)!==JSON.stringify(original.matrix)||retained.dimension!==2*indices.length)fail('INTERNAL_VALIDATION','The centered second variation lost its original coefficient body.');
  return {originalSystem,system,indices,matrices,norms,timeMatrix,timeNorm,dimension:retained.dimension,sourceAuthenticated:false,originalMatrixUnchanged:true,
    exactOriginalValueAlias:true,allRequiredMatrixAndTimeDerivativeBodiesGenerated:true,FTCIntegralNumericallyEvaluated:false};
}

/** Differentiate the complete comparison diagonal, INCLUDING its damping.
 * Its actual-source difference contains the retained positive 1/L, epsilon
 * and rounded-carrier errors; that difference is not set to zero here.
 */
export function centeredSlowSlopeIdentityAudit(G){
  const q=(n,d=1)=>G.q(n,d),a=G.fresh('center_slope_parameter'),F=G.fresh('center_slope_F'),alpha=G.fresh('center_slope_alpha'),R=G.fresh('center_slope_R'),
    Fi=G.fresh('center_slope_F_i'),FRi=G.fresh('center_slope_FR_i'),Ri=G.fresh('center_slope_R_i'),u=G.fresh('center_slope_u'),lambda=G.fresh('center_slope_lambda'),
    FR=G.neg(G.div(G.mul(q(2),F,G.add(G.one,alpha)),R)),Fa=G.add(F,G.mul(a,Fi)),FRa=G.add(FR,G.mul(a,FRi)),Ra=G.add(R,G.mul(a,Ri)),
    localAlpha=G.sub(G.neg(G.div(G.mul(Ra,FRa),G.mul(q(2),Fa))),G.one),D0=G.add(G.one,G.pow(u,2)),g=G.div(G.mul(q(3),lambda,G.pow(u,2)),D0),
    kappaU=G.div(D0,G.mul(q(3),G.pow(u,2))),alphaI=G.substitute(G.derivative(localAlpha,a),a,G.zero),gabs=G.mul(q(2),F,G.add(G.one,alpha)),checks=[],negativeControls=[],rows=[];
  for(const sign of [1,-1]){
    const sa=G.mul(q(sign,2),u,G.add(G.one,G.div(FRa,FR))),D=G.add(G.one,G.pow(sa,2)),
      projected=G.mul(G.div(lambda,q(2)),G.div(Fa,F),G.add(G.div(D0,D),G.div(localAlpha,alpha))),
      dampingDifference=G.mul(lambda,G.sub(G.div(D,D0),G.one)),matrix=G.sub(G.sub(projected,lambda),dampingDifference),
      differentiated=G.div(G.substitute(G.derivative(matrix,a),a,G.zero),g),
      expected=G.add(G.mul(kappaU,G.add(G.div(Fi,F),G.div(alphaI,G.mul(q(2),alpha)))),G.div(G.mul(R,FRi),G.mul(q(2),gabs))),
      check=sourceGraphRationalIdentity(G,G.sub(differentiated,expected),{maxTerms:60000}),
      omitted=sourceGraphRationalIdentity(G,G.sub(G.div(G.substitute(G.derivative(projected,a),a,G.zero),g),expected),{maxTerms:60000});
    checks.push({id:'complete-comparison-center-slope-'+sign,...check});
    negativeControls.push({sign,omitted:'Derivative of the original damping difference',check:omitted,correctlyRejected:!omitted.pass});
    rows.push({sign,sa,D,projected,dampingDifference,matrix,differentiated,expected});
  }
  const h=G.fresh('center_slope_positive_h'),xi=G.fresh('center_slope_alpha_log_T'),
    muT=G.add(G.mul(G.sub(kappaU,q(1,2)),G.sub(alpha,h)),G.mul(G.sub(G.div(kappaU,q(2)),G.div(alpha,G.mul(q(2),G.add(G.one,alpha)))),xi)),
    muR=G.add(q(3,2),alpha,G.neg(G.mul(q(2),kappaU,G.add(G.one,alpha))),G.neg(G.mul(kappaU,xi)),G.div(G.mul(alpha,xi),G.add(G.one,alpha))),
    homogeneous=G.sub(G.add(muR,G.mul(q(2),muT)),G.add(q(3,2),G.neg(G.mul(q(2),kappaU)),G.mul(G.sub(G.one,G.mul(q(2),kappaU)),h))),
    homogeneity=sourceGraphRationalIdentity(G,homogeneous,{maxTerms:20000});
  checks.push({id:'exact-positive-h-homogeneity-of-the-two-slow-slopes',...homogeneity});
  if(checks.some(c=>!c.pass)||negativeControls.some(c=>!c.correctlyRejected))fail('INTERNAL_VALIDATION','A complete center-slope or omitted-damping control failed.');
  return {schema:'MathScope.CenteredSlowSlopeIdentityAudit/1',roots:{a,F,alpha,R,Fi,FRi,Ri,u,lambda,FR,localAlpha,D0,g,kappaU,alphaI,gabs,h,xi,muT,muR},rows,checks,negativeControls,
    sourceSpecialization:'D_R=R_star*partial_R, D_Z=partial_Z, D_T=partial_T at R=R_star,Z=0,T=1 with frozen representative. alpha=h*A, xi=A_T/A. The complete terminal homogeneity gives alpha_R*R=-2*alpha_T and T*F_T/F=alpha-h.',
    exactHomogeneity:'mu_R+2*mu_T=3/2-2*kappaU+(1-2*kappaU)*h, kappaU=(1+u^-2)/3',
    sourceAuthenticated:false,actualMatrixReplacedByComparison:false,pass:true};
}

/** A finite ordinary-derivative power ledger. Each multiplication/addition
 * pays one Renv power for all finite binomial coefficients/summands.
 * Renv>2^4096 absorbs the finite constants through total order four.
 * The adapter must prove the original primitive values and lower bounds.
 */
export function terminalSlowMatrixPowerAudit(){
  const rows=[],put=(id,p,reason,dependencies=[])=>{rows.push({id,upperPower:p,reason,dependencies});return p;},
    add=(id,...ps)=>put(id,Math.max(...ps)+1,'Finite sum through four derivatives',ps),
    mul=(id,...ps)=>put(id,ps.reduce((a,b)=>a+b,0)+1,'Leibniz product through four derivatives',ps),
    inv=(id,p,m)=>put(id,5*m+4*p+6,'Inverse derivatives through order four; value denominator >= Renv^(-m)',[p,m]),
    invsqrt=(id,p,m)=>put(id,Math.ceil(m/2)+4*m+4*p+6,'Positive inverse-square-root derivatives through order four',[p,m]),
    nR=put('normal_radial',108,'Divide the complete normal by the same positive frozen Bs: sign*u/2-tau*beta*FR, beta=L*p/Bs remains the rounded value.'),
    nT=put('normal_tangential',108,'After the same exact Bs cancellation: beta/(Ls*R), -1-epsilon*tau*beta*FZ. Includes one auxiliary inverse-length, epsilon or beta derivative when bounding the comparison difference.'),
    K=put('cylindrical_K',77,'Original F, R*FR and zero-exterior GR; each normalized F derivative through five is<Renv^73.'),
    nn=add('normal_square',mul('normal_radial_square',nR,nR),mul('normal_tangent_square',nT,nT)),
    invnn=inv('inverse_normal_square',nn,1),nt2=add('tangent_square',mul('tangent_product',nT,nT),mul('tangent_product_other',nT,nT)),
    invnt2=inv('inverse_tangent_square',nt2,1),invnt=invsqrt('inverse_positive_tangent_norm',nt2,1),
    unit=mul('Ka_and_Na',nT,invnt),U=add('moving_U',mul('radial_tangent_projection',nR,nT,invnt2),unit),
    J=put('reference_J',22,'The exact frozen c0*sqrt(1+u^2*(1/2+tau)^2) and its four tau derivatives.'),
    Jinv=put('reference_J_inverse',7,'The exact positive denominator and its four tau derivatives; no slow label derivative.'),
    B=add('moving_B',mul('moving_UJ',U,J),0),Bleft=add('moving_Bleft',mul('moving_Jinverse_Uleft',Jinv,unit),0),
    nTK=add('normal_K_contraction',mul('normal_K_product',nR,K),mul('normal_K_tangent_product',nT,K)),
    pressure=add('full_moving_pressure_numerator',nTK,nR),
    Aphi=add('full_Aphi',K,mul('full_pressure_projection',nR,pressure,invnn)),
    ABminusBprime=add('Aphi_B_minus_Bprime',add('Aphi_B',mul('Aphi_B_product',Aphi,B)),B+1),
    projected=add('full_projected_matrix',mul('Bleft_times_projected_rhs',Bleft,ABminusBprime)),
    matrix=add('full_normalized_matrix_and_damping',projected,440,107,84),ceiling=3840;
  if(matrix>=ceiling||ceiling>=4096)fail('INTERNAL_VALIDATION','The actual finite-jet power ledger exceeds the source norm reserve.');
  return {schema:'MathScope.TerminalSlowMatrixPowerAudit/1',derivativeOrder:4,rows,computedMaximumPower:matrix,upperPower:ceiling,pass:true,
    printedPremises:{environment:'Renv>2^4096 and B>=Renv^4096',field:'At the fixed terminal center, every normalized slow derivative of F through order five is<Renv^73 by the printed implicit-chart, step and full Gamma majorants; G and every such G derivative vanish on its exact open common exterior.',
      coordinates:'At the source point R=R_star with Renv^-1<R_star<Renv. R_star is frozen before differentiation.',
      frozen:'Renv^-40<Bs<Renv^42; Renv^-6<abs(c0)<Renv^10; u<Renv^11; Renv^-31<lambda0<Renv^83; Renv^-20<gabs<Renv^75.',
      band:'S>=B^1024, S/B<=L<=S, original k>S^8 and epsilon<4/S^16.',
      phase:'beta=L*p/Bs equals sign*u*R_star/gabs plus the actual rounded remainder; abs(beta)<Renv^33.',
      tangent:'After dividing by the positive frozen Bs, n_z=-1 at Z=0, for every auxiliary segment between the actual and comparison inverse-length, epsilon and beta. Thus the tangent and normal square values are>=1>Renv^-1. All required local derivative coefficients, including the auxiliary derivatives, are bounded by Renv^108.',
      reference:'Four tau derivatives of c are <=Renv^22 and of1/c are <=Renv^7, from s=sign*u*(1/2+tau),0<=tau<=1.',
      derivativeDirections:'Normalized slow operators with frozen R_star, tau=v/L, and at most one auxiliary inverse-length/epsilon/beta derivative. Four total primitive derivatives cover the two slow or one slow plus one tau derivative of M, including the extra Bprime derivative.'},
    conclusion:'At the actual slow point, uniformly in0<=tau<=1, all original M, D_i M, D_iD_j M and L*partial_v D_i M are<Renv^3840<B. The one-auxiliary derivatives of D_i M obey the same bound. Original nprime pressure, Bprime and damping are included.',
    sourceAuthenticated:false,callerMatricesAccepted:false,sourceNumericalEnclosure:false};
}

function gaussianTailMoment(n,M){
  if(n===0)return Q(3,M);if(n===1)return Q(3);
  return qadd(Q(3n*BigInt(M)**BigInt(n-1)),qmul(Q(3*(n-1)),gaussianTailMoment(n-2,M)));
}

/** Exact exponent bookkeeping for the differentiated Riccati equation.
 * The derivative bounds are uniform over the WHOLE original time interval.
 * They are conditional on the complete source matrix and its stated jets;
 * no separately supplied approximate matrix or solution is used here.
 */
export function centeredRiccatiJetPowerAudit(){
  const rows=[],put=(id,power,reason)=>{rows.push({id,power,reason});return power;},
    firstForce=put('first_parameter_forcing',2,'|M21_i+(M22_i-M11_i)*r-M12_i*r^2|<=4B<B^2, since|r|<1'),
    first=put('first_parameter_solution',firstForce+1,'The exact linear Riccati coefficient is<=-1/B, and the actual initial derivative is0'),
    firstReserve=6,
    secondForce=put('second_parameter_forcing',9,'The complete repeated/mixed chain has direct forcing<=B^2, two first-product terms<=B^8, and2*M12*r_i*r_j<=2B^268/S<1'),
    second=put('second_parameter_solution',secondForce+1,'Integrating the same negative scalar linear coefficient costs at mostB'),
    secondReserve=14,
    time=put('ratio_time_derivative_numerator',262,'The original Riccati RHS has magnitude<=B^262/S, including its quadratic term'),
    firstTime=put('first_parameter_time_derivative',8,'The exact differentiated RHS is bounded by3B*B^6+4B<B^8'),
    logFirstDifference=put('log_first_minus_diagonal_numerator',264,'M12_i*r+M12*r_i, bounded by(B^261+B^262)/S'),
    logFirstTime=put('log_first_second_time_numerator',268,'M11_iv+M12_iv*r+M12_i*r_v+M12_v*r_i+M12*r_iv; |M_iv|<=B/L<=B^2/S'),
    logSecondTime=put('log_second_first_time',20,'M11_ij+M12_ij*r+M12_i*r_j+M12_j*r_i+M12*r_ij, with both mixed products'),
    centeredFirst=put('whole_interval_centered_first_scaled',300,'Taylor aboutv0 on the entire closed0<=v<=L gives an error<=B^300/sqrtS*(|x|+x^2); B^-1<g andS/B<=L<=S'),
    centeredSecond=put('whole_interval_centered_second_scaled',300,'Integrate the complete q_ij_prime on the entire closed interval: |l_ij|/(gL)<=B^300/sqrtS*|x|');
  const checks=[{id:'first-reserve',pass:first<firstReserve},{id:'second-reserve',pass:second<secondReserve},
    {id:'whole-time-and-slope-reserve',pass:time<logFirstTime&&firstTime+256<logFirstTime&&logFirstDifference+2<centeredFirst&&logFirstTime+2<centeredFirst&&logSecondTime+2<centeredSecond}];
  if(checks.some(c=>!c.pass))fail('INTERNAL_VALIDATION','The complete Riccati slow-jet exponent reserve was exceeded.');
  return {schema:'MathScope.CenteredRiccatiJetPowerAudit/1',rows,checks,pass:true,firstReserve,secondReserve,
    coefficientPremises:'B>=2^128,S>=B^1024; every normalized slow matrix jet through two is<=B, every first slow matrix jet has v derivative<=B/L. The original whole-interval cone has |r|<=B^260/S, off-diagonals<=B^256/S and the differentiated Riccati linear coefficient<=-1/B.',
    initialPremise:'The original full system starts at(1,0), with fixed left endpoint0 and all slow datum derivatives0. Hence every first/second ratio derivative initially vanishes.',
    entireTimeInterval:true,centeredExpansionRestrictedToGaussianCore:false,allMixedAndRepeatedProductsRetained:true,
    sourceAuthenticated:false,actualSourceSolutionReplaced:false};
}

export function centeredSlowJetErrorAudit(){
  const rows=[],check=(id,left,relation,right)=>{const c=qcompare(left,right);rows.push({id,left:qtext(left),relation,right:qtext(right),pass:relation==='<'?c<0:c<=0});},
    M=64,localPower=300,sourceNormalizedLocalError=dyadic(128*(512-localPower)),corePolynomial=qmul(Q(1n<<20n),Q(2n*BigInt(M)*(1n+BigInt(M)**4n))),
    core=qmul(corePolynomial,qadd(sourceNormalizedLocalError,dyadic(8192))),
    tailPolynomial=[0,1,2,3,4].map(n=>gaussianTailMoment(n,M)).reduce(qadd,Q(0)),
    actualTail=qmul(qmul(Q(2n<<20n),tailPolynomial),dyadic(Math.floor(M*M/6))),total=qadd(core,actualTail),
    integralError=dyadic(620),propagated=dyadic(600);
  check('normalized-source-slow-error-is-strictly-smaller-than-the-core-budget',sourceNormalizedLocalError,'<',dyadic(8192));
  check('complete-polynomial-Gaussian-tail-and-core',total,'<',integralError);
  check('inverse-positive-sqrt-and-centered-amplitude-error',qmul(Q(1n<<12n),integralError),'<',propagated);
  check('conditioning-neighborhood-error',integralError,'<',Q(1,1024));
  const riccati=centeredRiccatiJetPowerAudit();
  return {schema:'MathScope.CenteredSlowJetErrorAudit/1',rows,riccati,pass:rows.every(r=>r.pass)&&riccati.pass,parameters:{M,localPower,
      originalPositiveCoreError:qtext(sourceNormalizedLocalError),gaussianProfileCoreError:qtext(dyadic(8192)),actualPolynomialTailUpper:qtext(actualTail),
      completeIntegralJetError:qtext(integralError),propagatedWaveJetError:qtext(propagated)},
    premises:{sourceAuthenticated:false,B:'B>=2^128; S>=B^1024; S/B<=L<=S; B^-1<g,lambda<B.',
      matrixJets:'The actual source power ledger gives |D^alpha M|<=B for |alpha|<=2 and |partial_v D_i M|<=B/L, including every connection and damping term.',
      sourceCone:'w_plus>0, |r|=|w_minus/w_plus|<=B^260/S; |M12|,|M21|<=B^256/S; M22-M11=-2lambda+O(B^256/S).',
      slope:'At v0=L/2, D_i M11/g differs from the retained mu_i coefficient by at most B^64/S; mu_Z=0 is a comparison with a strictly positive epsilon remainder.',
      sourceGeometry:'The normalized original covariance-frame factors and target have first and second slow derivatives <=B^32. The first and second derivatives of r are <=B^6 and B^14.',
      cutoffAndGaussian:'The original psi is1 on the central window; the retained P and w give core error<2^-8192 on |x|<=64 and a whole-band tail exp(-x^2/6). Original transverse mass and Haar factors remain.',
      intervalStability:'For the same centered normalized H, infinity inverse norm<=1, each inverse weight is in[1/8,1/2], and its positive square root is at least1/4.',
      domain:'An open fixed-label terminal neighborhood around the actual selected point. Bounds do not assert that the entire normalized parameter unit ball is an allowed source box.'},
    derivation:{riccati:'r_prime=M21+(M22-M11)r-M12*r^2. Its actual parameter derivatives have zero initial data and strictly negative linear coefficient. The first and mixed second equations give |r_i|<=B^6, |r_ij|<=B^14; no second component or derivative is replaced by zero.',
      centeredLog:'Uniformly on the ENTIRE original closed interval0<=v<=L, q_i=partial_i log(w_plus) satisfies q_i_prime=M11_i+M12_i*r+M12*r_i, |q_i_prime-M11_i|<=B^264/S and |q_i_second_v|<=B^268/S; also |q_ij_prime|<=B^20. Taylor and integration aboutv0 on this whole interval give l_i/sqrt(gL)=mu_i*x+e_i, |e_i|<=B^300/sqrt(S)*(|x|+x^2) and |l_ij|/(gL)<=B^300/sqrt(S)*|x|, where l_i=q_i(v)-q_i(v0),x=(v-v0)*sqrt(g/L). These polynomial bounds hold outside the Gaussian core too, so the tail coefficients are independent of B.',
      sourceDensity:'Differentiate the ACTUAL centered density (w_plus(v)/w_plus(v0))^2 times the full frame and psi^2. The first density has 2*l_i; the second has4*l_i*l_j+2*l_ij, all frame derivatives and mixed products. No initial-center derivative is dropped.',
      gaussianMoments:'The complete odd Gaussian moment is0 and integral x^2*exp(-x^2)=sqrt(pi)/2. Therefore Hbar_i/sqrt(gL) has radius2^-620 about0 and Hbar_ij/(gL) has radius2^-620 about2*mu_i*mu_j*Hbar. This is an enclosure with nonzero remainder.',
      tails:'For n>=2, integral_M^infinity x^n*exp(-x^2/6) <= exp(-M^2/6)*[3*M^(n-1)+3*(n-1)*I_(n-2)], I0=3/M,I1=3. Both tails and all polynomials through degree4 are included. exp(-M^2/6)<2^-floor(M^2/6).',
      inverse:'Differentiate Hbar*ybar=targetbar before the positive square root. The two first-product terms H_i*y_j and H_j*y_i are retained. Exact repeated/mixed sqrt differentiation then gives W_i/(A0*sqrt(gL))=0+error and W_ij/(A0*gL)=-mu_i*mu_j*(W/A0)+error.',
      conditioning:'The first/second inverse and sqrt recurrences, |Hbar^-1|_infinity<=1, ybar in[1/8,1/2], sqrt(ybar)>=1/4 and |mu_i|<=2 give at most2^12 times the complete integral radius, less than2^-600.'},
    sourceAuthenticated:false,wholeGNUMComplete:false};
}

function numericalControls(input){
  const allowed=['precisionBits','tolerance','weightedCenters'];
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))fail('INVALID_INPUT','Use numerical precision, an exact width tolerance, and two conditional weighted-center intervals.');
  const precisionBits=input.precisionBits??192,tolerance=input.tolerance??'1/1000000000000';
  if(!Number.isSafeInteger(precisionBits)||precisionBits<192||precisionBits>512||typeof tolerance!=='string')fail('INVALID_INPUT','Use192..512 bits and an exact rational tolerance string.');
  const tol=readRational(tolerance);if(qcompare(tol,Q(0))<=0||qcompare(tol,Q(1,100))>0)fail('INVALID_INPUT','The normalized jet-width tolerance must lie in(0,1/100].');
  if(qcompare(tol,dyadic(precisionBits-48))<0)fail('PRECISION_REQUIRED','More directed bits are required for the requested slow-jet coefficients.');
  if(!Array.isArray(input.weightedCenters)||input.weightedCenters.length!==2)fail('INVALID_INPUT','Supply both conditional weighted-center intervals.');
  const weightedCenters=input.weightedCenters.map(box=>{
    if(!box||Object.keys(box).sort().join(',')!=='lower,upper'||typeof box.lower!=='string'||typeof box.upper!=='string')fail('INVALID_INPUT','Each weighted-center interval has exact rational lower and upper endpoints.');
    const lo=readRational(box.lower),hi=readRational(box.upper);
    if(qcompare(lo,Q(1,4))<0||qcompare(hi,Q(3,4))>0||qcompare(lo,hi)>0)fail('INVALID_INPUT','The conditional weighted-center intervals must be positive and inside[1/4,3/4].');
    return {lower:qtext(lo),upper:qtext(hi)};
  });
  return {precisionBits,tolerance:qtext(tol),weightedCenters};
}

export function encloseCenteredSlowJetCoefficients(input,context={}){
  const request=numericalControls(input),A=directedArithmetic(request.precisionBits),step=encloseTerminalStepJet({precisionBits:request.precisionBits}),
    heat=encloseNormalizedHeatMoments({precisionBits:request.precisionBits,tolerance:qtext(dyadic(request.precisionBits-40)),maxTerms:128,
      h:rationalBox(Q(0),dyadic(4096)),argument:rationalBox(Q(0),dyadic(2559))},context),
    h=A.small(4096),z=A.small(2559),ui2=A.small(81922),a=A.unpack(step.normalized.a),bb=A.unpack(step.normalized.b),c=A.unpack(step.normalized.c),
    D0=A.unpack(heat.coefficients.D0.interval),D1=A.unpack(heat.coefficients.D1.interval),D2=A.unpack(heat.coefficients.D2.interval),
    f=A.sub(A.one(),A.mul(h,a)),H=A.sub(A.one(),A.mul(A.mul(h,z),D0)),zD1H=A.div(A.mul(z,D1),H),Atilde=A.sub(A.sub(A.one(),A.div(bb,f)),zD1H),
    At=A.sub(A.add(A.sub(A.sub(A.div(c,f),A.div(A.mul(h,A.mul(bb,bb)),A.mul(f,f))),zD1H),A.div(A.mul(A.mul(A.mul(z,z),A.add(A.one(),h)),D2),H)),
      A.div(A.mul(A.mul(h,A.mul(z,z)),A.mul(D1,D1)),A.mul(H,H))),
    alpha=A.mul(h,Atilde),xi=A.div(At,Atilde),kappa=A.div(A.add(A.one(),ui2),A.point(3)),
    muT=A.add(A.mul(A.sub(kappa,A.point(Q(1,2))),A.sub(alpha,h)),
      A.mul(A.sub(A.div(kappa,A.point(2)),A.div(alpha,A.mul(A.point(2),A.add(A.one(),alpha)))),xi)),
    muR=A.sub(A.add(A.sub(A.point(Q(3,2)),A.mul(A.point(2),kappa)),A.mul(A.sub(A.one(),A.mul(A.point(2),kappa)),h)),A.mul(A.point(2),muT)),
    comparison={R:muR,Z:A.zero(),T:muT},audit=centeredSlowJetErrorAudit(),radius=readRational(audit.parameters.propagatedWaveJetError),rows=[];
  if(!audit.pass||f[0]<=0n||H[0]<=0n||Atilde[0]<=0n||muR[0]<=0n||muT[1]>=0n)fail('PRECISION_REQUIRED','The actual positive heat/alpha factors or the nonzero slow slopes are not separated.');
  for(const [family,box]of request.weightedCenters.entries()){
    const W=A.unpack(box);
    for(const direction of ['R','Z','T']){
      const value=A.widen(A.zero(),radius);rows.push({family,sign:family===0?1:-1,derivative:direction,order:1,comparison:'0',interval:A.pack(value),width:qtext(Q(value[1]-value[0],A.S)),exactScale:'A0*sqrt(g*Ls)',nonzeroRemainderRetained:true});
    }
    for(const pair of ['RR','RZ','RT','ZZ','ZT','TT']){
      const leading=A.neg(A.mul(W,A.mul(comparison[pair[0]],comparison[pair[1]]))),value=A.widen(leading,radius);
      rows.push({family,sign:family===0?1:-1,derivative:pair,order:2,comparison:'-mu_'+pair[0]+'*mu_'+pair[1]+'*(W/A0)',interval:A.pack(value),width:qtext(Q(value[1]-value[0],A.S)),exactScale:'A0*g*Ls',nonzeroRemainderRetained:true});
    }
  }
  for(const row of rows){
    if(qcompare(readRational(row.width),readRational(request.tolerance))>0)fail('PRECISION_REQUIRED','The normalized actual slow coefficient '+row.derivative+' exceeds its requested width.');
    row.toleranceMet=true;
    if(['RR','TT'].includes(row.derivative)&&qcompare(readRational(row.interval.upper),Q(0))>=0||row.derivative==='RT'&&qcompare(readRational(row.interval.lower),Q(0))<=0)fail('PRECISION_REQUIRED','The retained nonzero second slow coefficient is not sign separated.');
  }
  return {schema:'MathScope.CenteredSlowJetDirectedCoefficients/1',request,rows,comparisonSlopes:Object.fromEntries(Object.entries(comparison).map(([k,v])=>[k,A.pack(v)])),
    actualPositiveFactors:{hBound:rationalBox(Q(0),dyadic(4096)),heatArgumentBound:rationalBox(Q(0),dyadic(2559)),uInverseSquareBound:rationalBox(Q(0),dyadic(81922)),
      f:A.pack(f),heat:A.pack(H),alphaOverPositiveH:A.pack(Atilde),alphaLogT:A.pack(xi),actualPositiveHReplacedByZero:false},
    primitiveNumerics:{step,heat},errorAudit:audit,errorBudget:{exactRequestedWidth:request.tolerance,originalPositiveWaveJetRadius:qtext(radius),
      everyReturnedWidthChecked:true,allImproperIntegralAndGaussianPolynomialTailsIncluded:true,originalHInverseAndSqrtChainRequired:true},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,additionalOperations:A.operations(),binary64UsedForDecisions:false},
    sourceAuthenticated:false,actualFullCurlNumericalEnclosure:false,wholeGNUMComplete:false,pass:true};
}
