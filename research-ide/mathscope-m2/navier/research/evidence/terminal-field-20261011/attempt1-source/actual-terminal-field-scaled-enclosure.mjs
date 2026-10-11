/** Complete terminal F, including its outer step and implicit-chart jets.
 * The exact positive amplitude is retained. Directed intervals enclose the
 * coefficients after that scaling; they do not numerically evaluate B, H's
 * covariance matrix, the pulse solution, or the global physical residual.
 */
import {directedArithmetic,readRational,rational as Q,qadd,qsub,qmul,qdiv,qcompare,qtext,factorial,fail} from './actual-continuation-arithmetic.mjs';
import {prepareActualHeatScaledEnclosure,assertActualHeatScaledEnclosure} from './actual-heat-scaled-enclosure.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {SOURCE_PROFILE_ID} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),zero=Q(0),one=Q(1),interval=(a,b)=>({lower:qtext(a),upper:qtext(b)});
const floor=(a,b)=>{let n=a/b;if(a<0n&&a%b)n--;return n;},ceil=(a,b)=>-floor(-a,b);
const metadata=p=>{const{nodes,...rest}=p;return canonicalStringify(rest);};
const data=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,checks:p.checks,roots:p.roots,numerics:p.numerics,proof:p.proof,scope:p.scope});

function controlsOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance','maxTerms'].includes(k)))fail('INVALID_INPUT','Use directed precision, exact rational coefficient-width tolerance and maxTerms only.');
  const precisionBits=input.precisionBits??192,tolerance=input.tolerance??'1/10000000000000000000000000000000000000000',maxTerms=input.maxTerms??128;
  if(!Number.isSafeInteger(precisionBits)||precisionBits<96||precisionBits>512||typeof tolerance!=='string'||!Number.isSafeInteger(maxTerms)||maxTerms<1||maxTerms>256)fail('INVALID_INPUT','Use 96..512 bits, an exact rational string and 1..256 finite heat terms.');
  const tol=readRational(tolerance);
  if(qcompare(tol,zero)<=0||qcompare(tol,one)>0)fail('INVALID_INPUT','The coefficient-width tolerance must lie in (0,1].');
  if(qcompare(tol,Q(1,1n<<BigInt(precisionBits-48)))<0)fail('PRECISION_REQUIRED','The complete field coefficients need more directed bits.');
  return {precisionBits,tolerance:qtext(tol),maxTerms};
}

/** Only exp(-3072/49) is needed. Positive Taylor terms, an explicit tail,
 * outward squaring, then an outward reciprocal avoid cancellation. */
export function encloseTerminalStepJet({precisionBits=192}={}){
  if(!Number.isSafeInteger(precisionBits)||precisionBits<96||precisionBits>512)fail('INVALID_INPUT','Use 96..512 directed bits.');
  const A=directedArithmetic(precisionBits),x=Q(3072,49);let shifts=0;
  while(qcompare(qdiv(x,Q(1n<<BigInt(shifts))),Q(1,8))>0)shifts++;
  const reduced=qdiv(x,Q(1n<<BigInt(shifts))),a=A.point(reduced);let degree=0,tail;
  do{degree++;tail=Q(8n,7n*8n**BigInt(degree+1)*factorial(degree+1));}while(qcompare(tail,Q(1,1n<<BigInt(precisionBits+24)))>0);
  let term=A.one(),sum=A.one();
  for(let k=1;k<=degree;k++){const product=A.mul(term,a);term=[floor(product[0],BigInt(k)),ceil(product[1],BigInt(k))];sum=A.add(sum,term);}
  sum=[sum[0],sum[1]+ceil(tail[0]*A.S,tail[1])];
  for(let j=0;j<shifts;j++)sum=A.mul(sum,sum);
  const exp=A.div(A.one(),sum),sigma=A.div(exp,A.add(A.one(),exp)),om=A.sub(A.one(),sigma),pair=A.mul(sigma,om);
  const g1=A.point(qadd(Q(1024),Q(1024,343))),g2=A.point(qadd(Q(-24576),Q(24576,2401)));
  const first=A.mul(pair,g1),second=A.mul(pair,A.add(g2,A.mul(A.sub(A.one(),A.mul(A.point(2),sigma)),A.mul(g1,g1))));
  const pack=b=>interval(Q(b[0],A.S),Q(b[1],A.S));
  if(exp[0]<=0n||sigma[0]<=0n||first[0]<=0n||second[0]<=0n)fail('PRECISION_REQUIRED','The actual nonzero terminal step derivatives are not sign separated at these bits.');
  return {schema:'MathScope.TerminalStepDirectedJet/1',point:'1/8',exponent:'-3072/49',exp:pack(exp),sigma:pack(sigma),first:pack(first),second:pack(second),
    normalized:{a:pack(A.div(sigma,A.point(256))),b:pack(A.div(first,A.point(512))),c:pack(A.neg(A.div(second,A.point(1024))))},
    proof:{definition:'sigma(x)=exp(g)/(1+exp(g)), g=(1-x)^(-2)-x^(-2)',gFirst:'1024+1024/343',gSecond:'-24576+24576/2401',
      first:'sigma*(1-sigma)*g_prime',second:'sigma*(1-sigma)*(g_second+(1-2*sigma)*g_prime^2)',
      rangeReductionShifts:shifts,reducedArgument:qtext(reduced),taylorDegree:degree,positiveTaylorRemainderUpper:qtext(tail),
      tailProof:'On 0<=a<=1/8, the exponential tail after degree n is <=(8/7)*(1/8)^(n+1)/(n+1)!. Every subsequent arithmetic operation is outward rounded.'},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false},sourceAuthenticated:false};
}

function formulas(G,{b,h,f,fy,fyy,H,D1,D2,z}){
  const q=(n,d=1)=>G.q(n,d),hp=G.add(G.one,h),Hp=G.neg(G.mul(h,D1)),Hpp=G.mul(h,hp,D2);
  const U=G.sub(G.mul(G.add(G.mul(b,f),fy),H),G.mul(f,z,Hp));
  const V=G.add(G.mul(G.add(G.mul(G.pow(b,2),f),G.mul(q(2),b,fy),fyy),H),
    G.mul(G.sub(G.mul(G.sub(G.one,G.mul(q(2),b)),f),G.mul(q(2),fy)),z,Hp),G.mul(f,G.pow(z,2),Hpp));
  return {U,V,Hp,Hpp};
}

/** Differentiate the literal step and positive heat integrand. The source
 * implicit equation supplies the separately checked Z curvature at Z=0. */
export function terminalFieldSlowJetIdentityAudit(G){
  const q=(n,d=1)=>G.q(n,d),R=G.fresh('field_audit_R'),T=G.fresh('field_audit_T'),Xtail=G.fresh('field_audit_Xtail'),h=G.fresh('field_audit_h'),v=G.fresh('field_audit_v');
  const X=G.div(G.pow(R,2),G.mul(q(2),T)),y=G.log(G.div(X,Xtail)),z=G.div(G.mul(q(4),T),G.pow(R,2)),b=G.neg(G.add(G.one,h)),B=G.exp(G.mul(b,G.log(X))),arg=G.div(G.sub(q(3),y),q(2));
  const f=G.sub(G.one,G.mul(G.div(h,q(256)),G.step(arg))),fy=G.mul(G.div(h,q(512)),G.step(arg,1)),fyy=G.neg(G.mul(G.div(h,q(1024)),G.step(arg,2)));
  const den=G.add(G.one,G.mul(z,v)),H=G.exp(G.neg(G.mul(h,G.log(den)))),D1=G.div(G.mul(v,H),den),D2=G.div(G.mul(G.pow(v,2),H),G.pow(den,2)),F=G.mul(B,f,H),{U,V}=formulas(G,{b,h,f,fy,fyy,H,D1,D2,z});
  const roots={R:G.derivative(F,R),T:G.derivative(F,T),RR:G.derivative(G.derivative(F,R),R),RT:G.derivative(G.derivative(F,R),T),TT:G.derivative(G.derivative(F,T),T)};
  const expected={R:G.mul(G.div(B,R),q(2),U),T:G.neg(G.mul(G.div(B,T),U)),RR:G.mul(G.div(B,G.pow(R,2)),G.sub(G.mul(q(4),V),G.mul(q(2),U))),RT:G.neg(G.mul(G.div(B,G.mul(R,T)),q(2),V)),TT:G.mul(G.div(B,G.pow(T,2)),G.add(V,U))};
  const atoms=[B,H,G.step(arg),G.step(arg,1),G.step(arg,2)],audit=x=>sourceGraphRationalIdentity(G,x,{atomicNodes:atoms,maxTerms:20000});
  const checks=Object.keys(roots).map(id=>({id:'complete-terminal-integrand-'+id,...audit(G.sub(roots[id],expected[id]))}));
  const a=G.fresh('field_audit_a'),bb=G.fresh('field_audit_step_b'),c=G.fresh('field_audit_c'),HH=G.fresh('field_audit_heat'),d1=G.fresh('field_audit_D1'),d2=G.fresh('field_audit_D2'),zz=G.fresh('field_audit_z');
  const ff=G.sub(G.one,G.mul(h,a)),f1=G.mul(h,bb),f2=G.mul(h,c),j=formulas(G,{b,h,f:ff,fy:f1,fyy:f2,H:HH,D1:d1,D2:d2,z:zz});
  const TTnormalized=G.add(G.mul(G.add(G.sub(G.mul(G.add(G.one,h),ff),G.mul(G.add(G.one,G.mul(q(2),h)),bb)),c),HH),
    G.neg(G.mul(q(2),G.sub(G.mul(G.add(G.one,h),ff),G.mul(h,bb)),zz,d1)),G.mul(ff,G.add(G.one,h),G.pow(zz,2),d2));
  checks.push({id:'TT-retains-exact-positive-h-factor',...sourceGraphRationalIdentity(G,G.sub(G.add(j.V,j.U),G.mul(h,TTnormalized)))});
  const s=G.fresh('field_audit_s'),Z=G.fresh('field_audit_Z'),tau=G.fresh('field_audit_tau'),implicit=G.sub(G.sub(s,G.mul(G.pow(Z,2),G.exp(G.mul(q(2),h,G.log(s))))),tau);
  const at=x=>G.substitute(G.substitute(G.substitute(x,Z,G.zero),s,G.one),tau,G.one),ps=G.derivative(implicit,s),pz=G.derivative(implicit,Z),pzz=G.derivative(pz,Z);
  checks.push({id:'actual-implicit-witness-equation',...sourceGraphRationalIdentity(G,at(implicit))});
  checks.push({id:'actual-implicit-positive-s-derivative',...sourceGraphRationalIdentity(G,G.sub(at(ps),G.one))});
  checks.push({id:'actual-implicit-first-Z-zero',...sourceGraphRationalIdentity(G,at(pz))});
  checks.push({id:'actual-implicit-second-Z-two',...sourceGraphRationalIdentity(G,G.add(G.mul(q(2),at(ps)),at(pzz)))});
  const omittedRR=audit(G.sub(roots.RR,G.mul(G.div(B,G.pow(R,2)),q(4),V))),omittedZ=sourceGraphRationalIdentity(G,G.neg(G.mul(q(2),G.add(G.mul(b,ff),f1),HH)));
  if(checks.some(c=>!c.pass)||omittedRR.pass||omittedZ.pass)fail('INTERNAL_VALIDATION','The complete terminal chain rule or a missing-curvature control failed.');
  return {schema:'MathScope.TerminalFieldSlowJetIdentityAudit/1',checks,pass:true,sourceAuthenticated:false,
    negativeControls:[{omitted:'-2U radial curvature in F_RR',correctlyRejected:!omittedRR.pass,check:omittedRR},{omitted:'Implicit-chart contribution to F_ZZ',correctlyRejected:!omittedZ.pass,check:omittedZ}],
    ZDerivation:'The exact chart gives s_Z=0,s_ZZ=2 at Z=0,T=1. The reduced heat argument 4T/R^2 has no Z dependence. Thus F_Z=F_RZ=F_ZT=0 and F_ZZ=-2*B*(b*f+f_y)*H. The same exact Z-even equation supplies both mixed zeros.'};
}

function scaledNumerics(request,heatNumerics,context){
  context.checkCancelled?.();const A=directedArithmetic(request.precisionBits),step=encloseTerminalStepJet(request),C=Object.fromEntries(Object.entries(heatNumerics.moments.coefficients).map(([id,row])=>[id,A.unpack(row.interval)]));
  const h=A.unpack(heatNumerics.bounds.h),z=A.unpack(heatNumerics.bounds.argument),a=A.unpack(step.normalized.a),bb=A.unpack(step.normalized.b),c=A.unpack(step.normalized.c),hp=A.add(A.one(),h),b=A.neg(hp);
  const f=A.sub(A.one(),A.mul(h,a)),fy=A.mul(h,bb),fyy=A.mul(h,c),H=A.sub(A.one(),A.mul(A.mul(h,z),C.D0)),Hp=A.neg(A.mul(h,C.D1)),Hpp=A.mul(A.mul(h,hp),C.D2);
  const U=A.sub(A.mul(A.add(A.mul(b,f),fy),H),A.mul(A.mul(f,z),Hp));
  const V=A.add(A.add(A.mul(A.add(A.add(A.mul(A.mul(b,b),f),A.mul(A.mul(A.point(2),b),fy)),fyy),H),
    A.mul(A.mul(A.sub(A.mul(A.sub(A.one(),A.mul(A.point(2),b)),f),A.mul(A.point(2),fy)),z),Hp)),A.mul(A.mul(f,A.mul(z,z)),Hpp));
  const TT=A.add(A.add(A.mul(A.add(A.sub(A.mul(hp,f),A.mul(A.add(A.one(),A.mul(A.point(2),h)),bb)),c),H),
    A.neg(A.mul(A.mul(A.mul(A.point(2),A.sub(A.mul(hp,f),A.mul(h,bb))),z),C.D1))),A.mul(A.mul(A.mul(f,hp),A.mul(z,z)),C.D2));
  const boxes={F:A.mul(f,H),R:A.mul(A.point(2),U),Z:A.zero(),T:A.neg(U),RR:A.sub(A.mul(A.point(4),V),A.mul(A.point(2),U)),RZ:A.zero(),RT:A.neg(A.mul(A.point(2),V)),ZZ:A.neg(A.mul(A.mul(A.point(2),A.add(A.mul(b,f),fy)),H)),ZT:A.zero(),TT};
  const info={F:['B',0,'POSITIVE'],R:['B/R',1280,'NEGATIVE'],Z:['0',null,'ZERO'],T:['B/T',0,'POSITIVE'],RR:['B/R^2',2561,'POSITIVE'],RZ:['0',null,'ZERO'],RT:['B/(R*T)',1280,'NEGATIVE'],ZZ:['B',0,'POSITIVE'],ZT:['0',null,'ZERO'],TT:['B*h/T^2',4096,'POSITIVE']};
  const rows=Object.entries(boxes).map(([id,box])=>{
    const coefficient=interval(Q(box[0],A.S),Q(box[1],A.S)),coefficientWidth=qtext(qsub(readRational(coefficient.upper),readRational(coefficient.lower))),[factor,exponent,sign]=info[id];
    if(qcompare(readRational(coefficientWidth),readRational(request.tolerance))>0)fail('PRECISION_REQUIRED','The complete field coefficient '+id+' exceeds its requested width.');
    if(sign==='POSITIVE'&&box[0]<=0n||sign==='NEGATIVE'&&box[1]>=0n||sign==='ZERO'&&(box[0]!==0n||box[1]!==0n))fail('PRECISION_REQUIRED','The complete field jet '+id+' is not sign separated.');
    const scale=exponent===null?zero:Q(1,1n<<BigInt(exponent)),raw=sign==='NEGATIVE'?interval(qmul(readRational(coefficient.lower),scale),zero):interval(zero,qmul(readRational(coefficient.upper),scale));
    return {id,coefficient,coefficientWidth,exactPositiveFactor:factor,factorStrictUpperPowerOfTwo:exponent===null?null:-exponent,sign,rawAbsoluteEnclosure:raw,sourceFactorSetToZero:false};
  });
  return {schema:'MathScope.ActualTerminalFieldScaledJetNumerics/1',step,heatMoments:heatNumerics.moments,rows,
    errorBudget:{tolerance:request.tolerance,heatCoefficientTolerance:heatNumerics.errorBudget.tolerance,eachCompleteCoefficientWidthChecked:true,allArithmeticAndElementaryTailsIncluded:true,originalPositiveFactorsRetained:true,rawRelativePrecisionClaimed:false},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,additionalOperations:A.operations(),binary64UsedForDecisions:false},
    bounds:'0<B<1; 0<h<2^-4096; 0<z<2^-2559; R>2^1280; R^2>2^2561; T=1. Closed zero interval endpoints are bounds, never source substitutions.'};
}

export function attachActualTerminalFieldScaledEnclosure(heatEnclosure,controls={},context={}){
  assertActualHeatScaledEnclosure(heatEnclosure);const request=controlsOf(controls);
  if(request.precisionBits!==heatEnclosure.request.precisionBits||qcompare(readRational(heatEnclosure.request.tolerance),qdiv(readRational(request.tolerance),Q(1n<<20n)))>0)fail('PRECISION_REQUIRED','Supply a private heat enclosure with the same bits and tolerance at most the complete-field tolerance divided by 2^20.');
  const numerics=scaledNumerics(request,heatEnclosure.numerics,context),source=heatEnclosure.source,{G,operator}=source,{X,eta}=operator.background.prepared.bootstrap.constants,heat=operator.background.prepared.bootstrap.actualHeat.heat,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),b=G.neg(G.add(G.one,h));
  const R=source.roots.witnessR,z=heatEnclosure.roots.witnessArgument,H=heatEnclosure.roots.witnessHeatFactor,{D1,D2}=heatEnclosure.roots.normalizedMomentRoots;
  const a=G.div(G.step(q(1,8)),q(256)),bb=G.div(G.step(q(1,8),1),q(512)),c=G.neg(G.div(G.step(q(1,8),2),q(1024))),f=G.sub(G.one,G.mul(h,a)),fy=G.mul(h,bb),fyy=G.mul(h,c);
  const B=G.mul(heat.exteriorAmplitude,G.exp(G.mul(b,G.log(source.roots.witnessX)))),{U,V}=formulas(G,{b,h,f,fy,fyy,H,D1,D2,z});
  const hp=G.add(G.one,h),TT=G.add(G.mul(G.add(G.sub(G.mul(hp,f),G.mul(G.add(G.one,G.mul(q(2),h)),bb)),c),H),
    G.neg(G.mul(q(2),G.sub(G.mul(hp,f),G.mul(h,bb)),z,D1)),G.mul(f,hp,G.pow(z,2),D2));
  const coefficients={F:G.mul(f,H),R:G.mul(q(2),U),Z:G.zero,T:G.neg(U),RR:G.sub(G.mul(q(4),V),G.mul(q(2),U)),RZ:G.zero,RT:G.neg(G.mul(q(2),V)),ZZ:G.neg(G.mul(q(2),G.add(G.mul(b,f),fy),H)),ZT:G.zero,TT};
  const factors={F:B,R:G.div(B,R),Z:G.zero,T:B,RR:G.div(B,G.pow(R,2)),RZ:G.zero,RT:G.div(B,R),ZZ:B,ZT:G.zero,TT:G.mul(B,h)};
  const witnessJets=Object.fromEntries(Object.keys(coefficients).map(id=>[id,G.mul(factors[id],coefficients[id])])),audit=terminalFieldSlowJetIdentityAudit(G),tailY=G.log(G.div(X,heat.Xtail));
  const originalFo=G.sub(G.one,G.mul(G.parameter('co'),h,G.sub(G.one,G.step(G.div(G.sub(tailY,G.one),q(2))))));
  const checks=[{id:'private-original-heat-and-terminal-source',pass:true},
    {id:'same-literal-source-terminal-step',pass:source.roots.terminalFo===originalFo&&G.source.parametersExactExpressions.co.rational==='1/256'},
    {id:'same-original-terminal-amplitude-and-exponent',pass:sourceGraphRationalIdentity(G,G.sub(heat.exteriorExponent,b)).pass&&[heat.exteriorAmplitude,heat.Xb,heat.Xtail].every(root=>G.derivative(root,eta)===G.zero)},
    {id:'same-original-X-R-and-positive-h',pass:source.roots.witnessX===G.mul(heat.Xb,G.exp(q(-1,4)))&&R===G.sqrt(G.mul(q(2),source.roots.witnessX))&&heatEnclosure.roots.h===h},
    {id:'completed-field-neighborhood-reduces-to-original-leading-field',pass:source.band.decision.positiveOrderBackgroundCutoffsAllInactive===true&&source.band.decision.completedFGExactlyLeadingOnFiniteBands===true},
    {id:'complete-step-heat-and-chart-chain-identities',pass:audit.pass},
    {id:'all-ten-value-and-jet-rows-keep-positive-scales',pass:numerics.rows.length===10&&numerics.rows.every(r=>r.sourceFactorSetToZero===false)},
    {id:'whole-F-ZZ-kept-despite-heat-ZZ-zero',pass:coefficients.ZZ!==G.zero&&heatEnclosure.roots.witnessSlowJets.ZZ===G.zero}];
  // The band producer's serialized proof is checked below against its actual
  // finite-band source decisions, never accepted as a caller supplied flag.
  if(!checks.every(c=>c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The complete terminal F source binding changed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const roots={h,B,R,z,originalCompletedFAtWitness:source.roots.actualCompletedFAtWitness,originalLeadingFAtWitness:source.roots.actualLeadingFAtWitness,originalTerminalFo:originalFo,originalHeatFactor:heatEnclosure.roots.originalHeatFactor,
    stepPoint:q(1,8),normalizedStep:{a,b:bb,c},terminalStep:{f,fy,fyy},coefficientRoots:coefficients,exactPositiveFactors:factors,witnessJets};
  if([B,R,z,...Object.values(witnessJets)].some(root=>G.freeCoordinates(root).size))fail('INVALID_SOURCE_CONSTRUCTION','The complete terminal witness retains an unintended free coordinate.');
  const proof={kind:'SOURCE_BOUND_TERMINAL_REDUCTION_AND_DIRECTED_SCALED_FULL_FIELD_JETS',
    exactField:'On the actual terminal neighborhood, F=B(X)*f_o(log(X/Xtail))*H(2*(1-eta^2)/X), B=exteriorAmplitude*X^(-1-h). All original preterminal corrections have ended; the completed positive-order cutoffs are identically zero for this ell=1 neighborhood.',
    witness:'X=Xb*exp(-1/4), Xtail=Xb*exp(-3), eta=0,s=1,R=sqrt(2X),Z=0,T=1, hence y=11/4 and delta/2=1/8.',
    stepReflection:'The literal source definition gives sigma(1-x)=1-sigma(x). Thus f_o=1-h*sigma((3-y)/2)/256, f_y=h*sigma_prime/512, f_yy=-h*sigma_second/1024. This identity is valid on a neighborhood, not only at the displayed point.',
    chart:heatEnclosure.proof.chartIdentity,implicitZ:audit.ZDerivation,
    derivativeFormulas:{U:'(b*f+f_y)*H-f*z*H_prime',V:'(b^2*f+2*b*f_y+f_yy)*H+((1-2*b)*f-2*f_y)*z*H_prime+f*z^2*H_second',
      R:'2*B*U/R',T:'-B*U/T',RR:'B*(4*V-2*U)/R^2',RT:'-2*B*V/(R*T)',TT:'B*(V+U)/T^2; factor the strictly positive h analytically before interval evaluation',ZZ:'-2*B*(b*f+f_y)*H at the fixed witness',Z:'0',RZ:'0',ZT:'0'},
    amplitudeBound:'At y=11/4, Etail<=Pstar, exp(-A*y)<=1, 1-rho>1/2 and X>XR. Therefore B<=2*Pstar/sqrt(2*XR)=2/(sqrt(220)*C^5*Pstar^4)<1. B stays its exact positive source expression.',
    integrandDifferentiation:'The literal cutoff is smooth in this interior collar. Every displayed heat derivative is dominated by the complete gamma density times a fixed polynomial. The integrated generic integrand identities therefore give the same complete heat factor derivatives.',
    identityAudit:audit,heatNotReplacedByOne:true,hNotReplacedByZero:true,amplitudeNotReplacedByOne:true};
  const sourceBinding={...heatEnclosure.sourceBinding,completeFieldProducer:'The same private original completed F and terminal heat source. No caller coefficients or coordinates are accepted.',
    exactSourceScalesNumericallyEvaluated:false,originalGammaMembershipForEllOne:false};
  const scope={actualCompleteTerminalFAndNineSlowJetsBound:true,exactOriginalPositiveAmplitudeRetained:true,directedScaledCoefficientIntervals:true,rawAbsoluteRationalEnclosures:true,
    unscaledHighRelativePrecision:false,wholeDomainFNumericallyEnclosed:false,actualPulseVolterraJetsEnclosed:false,wholeCovarianceHEnclosed:false,determinantOrWeightsEnclosed:false,wholeGNUMComplete:false,newLeanKernelProof:false,m3MayStart:false};
  const packed=G.pack(roots,{schema:'MathScope.ActualTerminalFieldScaledEnclosureProgram/1',compiler:'actual-terminal-field-scaled-enclosure.mjs:attachActualTerminalFieldScaledEnclosure',compilerInput:{sourceProfile:operator.sourceProfile,...request},sourceBinding,checks,numerics,proof,scope}),{nodes,...rest}=packed,program={...structuredClone(rest),nodes:nodes.slice()},result={G,heatEnclosure,source,request,roots,checks,numerics,proof,sourceBinding,scope,program};
  seals.set(result,{G,heatEnclosure,source,count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),program,programNodes:program.nodes,metadata:metadata(program),data:data(result),serialized:canonicalStringify(program)});return result;
}

export function assertActualTerminalFieldScaledEnclosure(p){
  const s=seals.get(p);if(!s||p.G!==s.G||p.heatEnclosure!==s.heatEnclosure||p.source!==s.source||p.program!==s.program||p.program.nodes!==s.programNodes||metadata(p.program)!==s.metadata||data(p)!==s.data||JSON.stringify(p.program.nodes)!==s.nodes||JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions))fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private complete terminal F enclosure.');
  assertActualHeatScaledEnclosure(s.heatEnclosure);return true;
}

export function prepareActualTerminalFieldScaledEnclosure(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','precisionBits','tolerance','maxTerms'].includes(k)))fail('INVALID_INPUT','Only the source profile and numerical controls are accepted.');
  const{sourceProfile=SOURCE_PROFILE_ID,...rest}=input,request=controlsOf(rest),heat=prepareActualHeatScaledEnclosure({sourceProfile,...request,tolerance:qtext(qdiv(readRational(request.tolerance),Q(1n<<20n)))},context);
  return attachActualTerminalFieldScaledEnclosure(heat,request,context);
}

export async function actualTerminalFieldScaledEnclosureCertificateFromProgram(p,context={}){
  assertActualTerminalFieldScaledEnclosure(p);const s=seals.get(p),hash=await sha256(s.serialized);context.checkCancelled?.();
  return {schema:'MathScope.ActualTerminalFieldScaledEnclosureCertificate/1',status:'COMPLETED',pass:true,request:p.request,sourceBinding:p.sourceBinding,
    graph:{sha256:hash,nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).length,compiler:p.program.compiler,compilerInput:p.program.compilerInput,roots:p.roots,graphIncluded:false,fixedCompilerPrefix:true,laterSourceAppendsExcluded:true},
    checks:p.checks,numerics:p.numerics,proof:p.proof,scope:p.scope};
}
