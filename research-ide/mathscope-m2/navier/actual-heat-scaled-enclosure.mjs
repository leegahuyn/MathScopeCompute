/** Directed, parameter-scaled enclosures for the ORIGINAL Laplace heat factor.
 * Positive source h and the positive source argument remain exact roots.
 * The finite moment expansion has a signed global remainder; it is not an
 * assertion that its usually divergent infinite asymptotic series converges.
 * No covariance, weight, pulse solution, whole F, or whole G-NUM is certified.
 */
import {directedArithmetic,readRational,rational as Q,qadd,qsub,qmul,qdiv,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {prepareActualEllOneCovarianceObstruction,assertActualEllOneCovarianceObstruction,ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),zero=Q(0),one=Q(1);
const interval=(lo,hi)=>({lower:qtext(lo),upper:qtext(hi)});
const width=box=>qsub(readRational(box.upper),readRational(box.lower));
const metadata=p=>{const{nodes,...rest}=p;return canonicalStringify(rest);};
const data=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,checks:p.checks,roots:p.roots,numerics:p.numerics,proof:p.proof,scope:p.scope});

function controlsOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['precisionBits','tolerance','maxTerms'].includes(k)))fail('INVALID_INPUT','Use only directed precision, an exact rational coefficient-width tolerance and maxTerms.');
  const precisionBits=input.precisionBits??192,tolerance=input.tolerance??'1/10000000000000000000000000000000000000000',maxTerms=input.maxTerms??128;
  if(!Number.isSafeInteger(precisionBits)||precisionBits<96||precisionBits>512)fail('INVALID_INPUT','Use 96..512 directed arithmetic bits.');
  if(typeof tolerance!=='string')fail('INVALID_INPUT','Tolerance must be an exact rational string, not a decimal Number.');
  const tol=readRational(tolerance);
  if(qcompare(tol,zero)<=0||qcompare(tol,one)>0)fail('INVALID_INPUT','Tolerance must be in (0,1].');
  if(qcompare(tol,Q(1,1n<<BigInt(precisionBits-16)))<0)fail('PRECISION_REQUIRED','The requested coefficient width needs more directed bits.');
  if(!Number.isSafeInteger(maxTerms)||maxTerms<1||maxTerms>256)fail('INVALID_INPUT','Use 1..256 finite moment terms.');
  return {precisionBits,tolerance:qtext(tol),maxTerms};
}

function exactBox(box,name,max){
  if(!box||typeof box!=='object'||Array.isArray(box)||Object.keys(box).sort().join(',')!=='lower,upper'||typeof box.lower!=='string'||typeof box.upper!=='string')fail('INVALID_INPUT',name+' must have two exact rational string endpoints.');
  const lo=readRational(box.lower),hi=readRational(box.upper);
  if(qcompare(lo,zero)<0||qcompare(lo,hi)>0||qcompare(hi,max)>0)fail('INVALID_INPUT',name+' has an invalid nonnegative parameter range.');
  return {lo,hi,public:interval(lo,hi)};
}

/** Generic coefficient enclosure, including continuous extensions at h=0
 * or z=0. These generic boxes cannot authenticate actual-source parameters.
 * D0=(1-H)/(h*z), D1=-H'/h, D2=H''/(h*(1+h)).
 */
export function encloseNormalizedHeatMoments(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['h','argument','precisionBits','tolerance','maxTerms'].includes(k)))fail('INVALID_INPUT','Supply exact h and argument boxes plus numerical controls only.');
  const {h,argument,...rest}=input,request=controlsOf(rest),hb=exactBox(h,'h',one),zb=exactBox(argument,'argument',Q(1,16)),A=directedArithmetic(request.precisionBits),tol=readRational(request.tolerance);
  const H=[A.point(hb.lo)[0],A.point(hb.hi)[1]],Z=[A.point(zb.lo)[0],A.point(zb.hi)[1]],Hp=n=>A.add(H,A.point(n));
  let terms=[Hp(1),Hp(1),A.mul(Hp(1),Hp(2))],partial=[A.zero(),A.zero(),A.zero()];
  const history=[];
  for(let n=0;n<request.maxTerms;n++){
    context.checkCancelled?.();
    partial=partial.map((p,j)=>A.add(p,n%2?A.neg(terms[j]):terms[j]));
    const next=terms.map((term,j)=>{
      const m=j===2?2:1,denominator=j===0?n+2:n+1;
      return A.div(A.mul(A.mul(A.mul(term,Hp(m+n)),Hp(m+n+1)),Z),A.point(denominator));
    });
    const N=n+1,boxes=partial.map((p,j)=>N%2?[p[0]-next[j][1],p[1]]:[p[0],p[1]+next[j][1]]),rows=boxes.map((box,j)=>{
      const remainderWidth=next[j][1],arithmeticAndParameterWidth=partial[j][1]-partial[j][0],pass=2n*remainderWidth*tol[1]<=tol[0]*A.S&&2n*arithmeticAndParameterWidth*tol[1]<=tol[0]*A.S;
      return {id:'D'+j,interval:interval(Q(box[0],A.S),Q(box[1],A.S)),signedRemainder:N%2?'NONPOSITIVE':'NONNEGATIVE',
        remainderAbsoluteUpper:qtext(Q(remainderWidth,A.S)),arithmeticAndParameterWidth:qtext(Q(arithmeticAndParameterWidth,A.S)),totalWidth:qtext(Q(box[1]-box[0],A.S)),pass};
    });
    history.push({terms:N,widths:rows.map(r=>r.totalWidth),allBudgetsMet:rows.every(r=>r.pass)});
    if(rows.every(r=>r.pass)){
      if(rows.some(r=>qcompare(readRational(r.interval.lower),zero)<=0))fail('INTERNAL_VALIDATION','The retained positive heat moments lost their positive enclosure.');
      return {schema:'MathScope.NormalizedHeatMomentEnclosure/1',status:'COMPLETED',pass:true,request:{...request,h:hb.public,argument:zb.public},terms:N,coefficients:Object.fromEntries(rows.map(r=>[r.id,r])),history,
        arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,operations:A.operations(),binary64UsedForDecisions:false},
        errorBudget:{tolerance:request.tolerance,remainderAllocation:qtext(qdiv(tol,Q(2))),arithmeticAndParameterAllocation:qtext(qdiv(tol,Q(2))),
          includesParameterBoxVariation:true,includesAllImproperTail:true,refinementDifferenceUsedAsError:false},
        definitions:{D0:'(1-H)/(h*z), with continuous extension at h*z=0',D1:'-H_prime/h, with continuous extension at h=0',D2:'H_second/(h*(1+h)), with continuous extension at h=0'},
        proof:{D0Term:'(-1)^n*(h+1)_n*(1+h)_(n+1)*z^n/(n+1)!',DmTerm:'(-1)^n*(h+m)_n*(1+h)_(m+n)*z^n/n!, m=1,2',
          remainder:'After N terms, the sign is (-1)^N and the absolute remainder is at most the positive N-th term. Taylor remainder for (1+t)^(-a) has this sign and is bounded by (a)_N*t^N/N! for all t>=0; integrate against the complete positive gamma density.',
          convergenceClaim:'Finite asymptotic enclosure only. The infinite moment series is not claimed to converge.',gammaMoment:'Gamma(1+h+m+n)/Gamma(1+h)=(1+h)_(m+n)',
          zeroParameterPolicy:'Generic h=0 or z=0 means the analytic continuous extension of normalized coefficients. Actual-source h and z below are strictly positive and are never replaced.'},
        sourceAuthenticated:false,originalParametersSubstitutedByGenericValues:false,wholeGNUMComplete:false};
    }
    terms=next;
  }
  fail('RESOURCE_LIMIT','The finite signed-moment bounds did not meet the requested width. Increase maxTerms, precision, or narrow the parameter range; the asymptotic series is not assumed to converge.');
}

/** Explicit original integrand chain-rule audit. It differentiates a heat
 * exponential, not a toy polynomial; the gamma density is a slow constant.
 */
export function heatSlowDerivativeIdentityAudit(G){
  const h=G.fresh('heat_audit_h'),R=G.fresh('heat_audit_R'),Z=G.fresh('heat_audit_Z'),T=G.fresh('heat_audit_T'),v=G.fresh('heat_audit_v'),weight=G.fresh('heat_audit_gamma_density'),q=(n,d=1)=>G.q(n,d);
  const z=G.div(G.mul(q(4),T),G.pow(R,2)),den=G.add(G.one,G.mul(z,v)),power=G.exp(G.neg(G.mul(h,G.log(den)))),body=G.mul(weight,power),D1=G.div(G.mul(weight,v,power),den),D2=G.div(G.mul(weight,G.pow(v,2),power),G.pow(den,2));
  const actual={R:G.derivative(body,R),Z:G.derivative(body,Z),T:G.derivative(body,T)};
  for(const [name,a,b]of[['RR',R,R],['RZ',R,Z],['RT',R,T],['ZZ',Z,Z],['ZT',Z,T],['TT',T,T]])actual[name]=G.derivative(G.derivative(body,a),b);
  const expected={R:G.mul(G.div(G.mul(h,z),R),q(2),D1),Z:G.zero,T:G.neg(G.mul(G.div(G.mul(h,z),T),D1)),
    RR:G.mul(G.div(G.mul(h,z),G.pow(R,2)),G.add(G.mul(q(-6),D1),G.mul(q(4),G.add(G.one,h),z,D2))),RZ:G.zero,
    RT:G.mul(G.div(G.mul(h,z),G.mul(R,T)),G.sub(G.mul(q(2),D1),G.mul(q(2),G.add(G.one,h),z,D2))),ZZ:G.zero,ZT:G.zero,
    TT:G.mul(G.div(G.mul(h,G.pow(z,2)),G.pow(T,2)),G.add(G.one,h),D2)};
  const audit=body=>sourceGraphRationalIdentity(G,body,{atomicNodes:[h,R,Z,T,v,weight,power],maxTerms:20000});
  const checks=Object.keys(actual).map(key=>({id:'actual-heat-integrand-'+key,...audit(G.sub(actual[key],expected[key]))}));
  const omitted=audit(G.sub(actual.RR,G.mul(G.div(G.mul(h,z),G.pow(R,2)),G.mul(q(4),G.add(G.one,h),z,D2))));
  if(checks.some(c=>!c.pass)||omitted.pass)fail('INTERNAL_VALIDATION','The heat slow chain rule or its omitted second-chain-term control failed.');
  return {schema:'MathScope.HeatSlowDerivativeIdentityAudit/1',checks,pass:true,negativeControl:{omitted:'H_prime*z_RR term',correctlyRejected:!omitted.pass,check:omitted},sourceAuthenticated:false};
}

function scaledNumerics(request,context){
  const hUpper=Q(1,1n<<4096n),zUpper=Q(1,1n<<2559n),innerTolerance=qdiv(readRational(request.tolerance),Q(64));
  const moments=encloseNormalizedHeatMoments({...request,tolerance:qtext(innerTolerance),h:interval(zero,hUpper),argument:interval(zero,zUpper)},context),A=directedArithmetic(request.precisionBits),C=Object.fromEntries(Object.entries(moments.coefficients).map(([key,row])=>[key,A.unpack(row.interval)])),H=A.unpack(interval(zero,hUpper)),Z=A.unpack(interval(zero,zUpper)),hp=A.add(A.one(),H);
  const coefficientBoxes={loss:C.D0,R:A.mul(A.point(2),C.D1),Z:A.zero(),T:A.neg(C.D1),
    RR:A.add(A.mul(A.point(-6),C.D1),A.mul(A.mul(A.mul(A.point(4),hp),Z),C.D2)),RZ:A.zero(),
    RT:A.sub(A.mul(A.point(2),C.D1),A.mul(A.mul(A.mul(A.point(2),hp),Z),C.D2)),ZZ:A.zero(),ZT:A.zero(),TT:A.mul(hp,C.D2)};
  const descriptions={loss:['h*z',6655,'POSITIVE'],R:['h*z/R',7935,'POSITIVE'],Z:['0',null,'ZERO'],T:['h*z/T',6655,'NEGATIVE'],RR:['h*z/R^2',9216,'NEGATIVE'],RZ:['0',null,'ZERO'],RT:['h*z/(R*T)',7935,'POSITIVE'],ZZ:['0',null,'ZERO'],ZT:['0',null,'ZERO'],TT:['h*z^2/T^2',9214,'POSITIVE']};
  const rows=Object.entries(coefficientBoxes).map(([id,box])=>{
    const coefficient=interval(Q(box[0],A.S),Q(box[1],A.S)),[factor,exponent,sign]=descriptions[id],factorUpper=exponent===null?zero:Q(1,1n<<BigInt(exponent));
    if(qcompare(width(coefficient),readRational(request.tolerance))>0)fail('PRECISION_REQUIRED','A complete slow-jet coefficient exceeds the requested width.');
    if(sign==='POSITIVE'&&box[0]<=0n||sign==='NEGATIVE'&&box[1]>=0n||sign==='ZERO'&&(box[0]!==0n||box[1]!==0n))fail('INTERNAL_VALIDATION','The exact heat-jet sign is not separated.');
    const raw=sign==='POSITIVE'?interval(zero,qmul(readRational(coefficient.upper),factorUpper)):sign==='NEGATIVE'?interval(qmul(readRational(coefficient.lower),factorUpper),zero):interval(zero,zero);
    return {id,coefficient,coefficientWidth:qtext(width(coefficient)),exactPositiveFactor:factor,factorStrictUpperPowerOfTwo:exponent===null?null:-exponent,sign,rawAbsoluteEnclosure:raw,
      zeroEndpointOnlyForNonzeroRows:sign!=='ZERO',sourceFactorSetToZero:false};
  });
  const loss=rows.find(r=>r.id==='loss');
  return {schema:'MathScope.ActualHeatScaledJetNumerics/1',moments,rows,heatFactorEnclosure:interval(qsub(one,readRational(loss.rawAbsoluteEnclosure.upper)),one),
    bounds:{h:interval(zero,hUpper),argument:interval(zero,zUpper),strictSourceRanges:'0<h<2^-4096; 0<z<2^-2559; R>2^1280; R^2>2^2561; slow T=1.',
      closedZeroEndpointsAreEnclosuresOnly:true},
    arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits:A.bits,additionalOperations:A.operations(),binary64UsedForDecisions:false},
    errorBudget:{tolerance:request.tolerance,normalizedMomentTolerance:qtext(innerTolerance),eachCompleteCoefficientWidthChecked:true,
      originalPositiveFactorsRetained:true,allRawIntervalBoundsExactRational:true,rawRelativePrecisionClaimed:false}};
}

export function attachActualHeatScaledEnclosure(source,controls={},context={}){
  assertActualEllOneCovarianceObstruction(source);const request=controlsOf(controls),numerics=scaledNumerics(request,context);context.checkCancelled?.();
  const {G,operator}=source,heat=operator.background.prepared.bootstrap.actualHeat.heat,{X,eta}=operator.background.prepared.bootstrap.constants,{R,Z,T}=operator.coordinates,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),gamma=heat.gamma;
  const lossNode=G.nodes[heat.heatLoss],integralId=lossNode.op==='multiply'?lossNode.args.find(id=>G.nodes[id].op==='definite_integral'):null;
  if(integralId===null||integralId===undefined)fail('INVALID_SOURCE_CONSTRUCTION','The actual complete heat-loss integral is required.');
  const sourceIntegral=G.nodes[integralId],v=sourceIntegral.args[1],om=G.sub(G.one,v),u=G.div(v,om),density=G.mul(G.exp(G.add(G.neg(u),G.mul(h,G.log(u)))),G.pow(om,-2)),sourceArgument=heat.heatArgument;
  const originalPower=G.exp(G.neg(G.mul(h,G.log(G.add(G.one,G.mul(sourceArgument,u)))))),profileBody=G.mul(density,originalPower),lossBody=G.mul(density,G.sub(G.one,originalPower));
  const originalFactor=G.sub(G.one,heat.heatLoss),profileFactor=G.div(G.integral(profileBody,v,G.zero,G.one),gamma),reducedArgument=G.div(G.mul(q(4),T),G.pow(R,2)),den=G.add(G.one,G.mul(reducedArgument,u)),power=G.exp(G.neg(G.mul(h,G.log(den)))),body=G.mul(density,power),reducedFactor=G.div(G.integral(body,v,G.zero,G.one),gamma);
  const D1=G.div(G.integral(G.div(G.mul(density,u,power),den),v,G.zero,G.one),gamma),D2=G.div(G.integral(G.div(G.mul(density,G.pow(u,2),power),G.pow(den,2)),v,G.zero,G.one),gamma),lossAtSlow=G.sub(G.one,reducedFactor),D0=G.div(lossAtSlow,G.mul(h,reducedArgument));
  const at=body=>G.simultaneousSubstitute(body,[R,Z,T],[source.roots.witnessR,G.zero,G.one]),jets={R:G.derivative(reducedFactor,R),Z:G.derivative(reducedFactor,Z),T:G.derivative(reducedFactor,T)};
  for(const [name,a,b]of[['RR',R,R],['RZ',R,Z],['RT',R,T],['ZZ',Z,Z],['ZT',Z,T],['TT',T,T]])jets[name]=G.derivative(G.derivative(reducedFactor,a),b);
  const audit=heatSlowDerivativeIdentityAudit(G),chart=operator.chart,s=chart.s,D=G.sub(q(1,2),h),powReal=(x,a)=>G.exp(G.mul(a,G.log(x))),chartSystem=G.monotoneSystems[chart.system],sv=chartSystem.variable;
  const partition=sourceGraphRationalIdentity(G,G.sub(density,G.add(lossBody,profileBody)),{atomicNodes:[density,originalPower],maxTerms:20000}),sigma=sourceExponentContract();
  const checks=[
    {id:'private-actual-terminal-source-and-derivative-domain',pass:true},
    {id:'positive-h-unchanged',pass:source.roots.h===h&&sigma.positive&&sigma.notNumericallyReplaced&&sigma.upperBoundExact==='2^-4096'},
    {id:'original-complete-loss-body-and-boundaries',pass:ellOneSourceScalarIdentity(G,sourceIntegral.args[0],lossBody).pass&&sourceIntegral.args[2]===G.zero&&sourceIntegral.args[3]===G.one&&heat.heatLoss===G.div(integralId,gamma)},
    {id:'original-gamma-equals-complete-density-integral',pass:ellOneSourceScalarIdentity(G,gamma,G.integral(density,v,G.zero,G.one)).pass},
    {id:'exact-integrand-partition-one-minus-loss',pass:partition.pass},
    {id:'actual-profile-heat-argument',pass:sourceArgument===G.div(G.mul(q(2),G.sub(G.one,G.pow(eta,2))),X)},
    {id:'literal-source-chart-and-positive-root-bracket',pass:chart.X===G.div(G.pow(R,2),G.mul(q(2),s))&&chart.eta===G.div(Z,powReal(s,D))&&chartSystem.body===G.sub(G.sub(sv,G.mul(G.pow(Z,2),powReal(sv,G.mul(q(2),h)))),T)&&chartSystem.left===q(1,2)&&chartSystem.right===q(2)},
    {id:'original-density-and-gamma-slow-constant',pass:[density,gamma,h].every(root=>[R,Z,T].every(axis=>!G.freeCoordinates(root).has(axis)))},
    {id:'actual-witness-X-and-R',pass:source.roots.witnessX===G.mul(heat.Xb,G.exp(q(-1,4)))&&source.roots.witnessR===G.sqrt(G.mul(q(2),source.roots.witnessX))},
    {id:'slow-integrand-derivatives-all-nine',pass:audit.pass&&audit.checks.length===9},
    {id:'exact-Z-and-mixed-Z-zeros',pass:['Z','RZ','ZZ','ZT'].every(key=>jets[key]===G.zero)}
  ];
  if(checks.some(row=>!row.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual heat scaling source changed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const roots={h,originalArgument:sourceArgument,originalGamma:gamma,originalLoss:heat.heatLoss,originalHeatFactor:originalFactor,equivalentProfileIntegral:profileFactor,
    originalChartComposition:G.simultaneousSubstitute(originalFactor,[X,eta],[chart.X,chart.eta]),equivalentReducedSlowHeatFactor:reducedFactor,reducedArgument,
    witnessX:source.roots.witnessX,witnessR:source.roots.witnessR,witnessHeatFactor:at(reducedFactor),witnessArgument:at(reducedArgument),
    normalizedMomentRoots:{D0:at(D0),D1:at(D1),D2:at(D2)},slowJets:jets,witnessSlowJets:Object.fromEntries(Object.entries(jets).map(([key,root])=>[key,at(root)])),
    witnessPositiveFactors:{loss:at(G.mul(h,reducedArgument)),R:at(G.div(G.mul(h,reducedArgument),R)),T:at(G.div(G.mul(h,reducedArgument),T)),
      RR:at(G.div(G.mul(h,reducedArgument),G.pow(R,2))),RT:at(G.div(G.mul(h,reducedArgument),G.mul(R,T))),TT:at(G.div(G.mul(h,G.pow(reducedArgument,2)),G.pow(T,2)))}};
  if([roots.witnessArgument,roots.witnessHeatFactor,...Object.values(roots.normalizedMomentRoots),...Object.values(roots.witnessSlowJets)].some(root=>G.freeCoordinates(root).size))fail('INVALID_SOURCE_CONSTRUCTION','The actual point substitution must eliminate every free slow coordinate.');
  const proof={kind:'SOURCE_BOUND_ANALYTIC_REDUCTION_WITH_EXECUTED_DIRECTED_COEFFICIENT_ENCLOSURES',
    gammaAndDerivatives:'Gamma density exp(-v)*v^h/Gamma(1+h) has moment (1+h)_j. Every fixed heat argument derivative is dominated by (h)_j*exp(-v)*v^(h+j)/Gamma(1+h); this dominates the complete improper interval and all compact nonnegative argument ranges.',
    everyFiniteOrderBound:'For every fixed integer j>=0 and z>=0, |H^(j)(z)| <= (h)_j*(1+h)_j <= j!*(j+1)! when 0<h<1. At z=0 use the same right derivatives and continuous extension. Only j<=2 source slow-jet roots and numerical enclosures are executed here.',
    chartIdentity:'X=R^2/(2s), eta=Z/s^(1/2-h), s-Z^2*s^(2h)=T. Since s>0, ordinary real exponential power rules give 2*(1-eta^2)/X=4*(s-Z^2*s^(2h))/R^2=4T/R^2 throughout the smooth source chart. Equality on a neighborhood identifies all displayed slow derivatives; this is an analytic chart identity, not an evaluated inverse-root approximation.',
    sourceBounds:'The authenticated terminal point has X=Xb*exp(-1/4)>XR because all original preterminal stage lengths and wait are positive. The pinned profile has Tprof=exp(1048576)+10>128, Pstar=exp(2*Tprof)>2^256 (e>2), CSelected>1, XR=110*(CSelected*Pstar)^10>2^2560. Thus z=2/X<2^-2559 and R^2=2X>2^2561, R>2^1280. Slow T=1 is distinct from Tprof.',
    positiveFactors:'The original h,z,R and slow T are strictly positive. They remain exact source roots. Zero endpoints in absolute rational enclosures are outward bounds and do not state that any nonzero heat jet is zero.',
    normalizedSlowJets:{R:'2D1',T:'-D1',RR:'-6D1+4*(1+h)*z*D2',RT:'2D1-2*(1+h)*z*D2',TT:'(1+h)*D2',Z:'0',RZ:'0',ZZ:'0',ZT:'0'},
    identityAudit:audit,sourceHeatNotReplacedByOne:true,hNotReplacedByZero:true,finiteSeriesNotIdentifiedWithHeat:true};
  const sourceBinding={sourceProfile:operator.sourceProfile,parameterExpressionSHA256:operator.parameterExpressionSHA256,witness:'ACTUAL_ELL1_TERMINAL_S1_ETA0_DELTA1_OVER4',
    exactSourceProducer:'Private prepareActualEllOneCovarianceObstruction and its original complete heat producer.',originalH:'1 minus the original complete heatLoss, with the original gamma denominator and positive h.',
    referencePluginRole:'Independent representable reference comparisons only. No plugin decimal, user parameter, generic h=0 box or external interval can supply actual source authority.'};
  const scope={actualHeatFactorAndNineSlowJetsBound:true,actualPositiveParametersPreserved:true,parameterScaledCoefficientIntervals:true,rawAbsoluteRationalEnclosures:true,
    wholeLeadingFJetsEnclosed:false,actualPulseVolterraJetsEnclosed:false,wholeCovarianceHEnclosed:false,determinantOrWeightsEnclosed:false,wholeGNUMComplete:false,newLeanKernelProof:false,m3MayStart:false};
  const packed=G.pack(roots,{schema:'MathScope.ActualHeatScaledEnclosureProgram/1',compiler:'actual-heat-scaled-enclosure.mjs:attachActualHeatScaledEnclosure',compilerInput:{sourceProfile:operator.sourceProfile,...request},sourceBinding,checks,numerics,proof,scope}),{nodes,...meta}=packed,program={...structuredClone(meta),nodes:nodes.slice()},result={G,source,request,roots,sourceBinding,checks,numerics,proof,scope,program};
  seals.set(result,{G,source,program,programNodes:program.nodes,programMetadata:metadata(program),count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),serialized:canonicalStringify(program),data:data(result)});
  return result;
}

export function assertActualHeatScaledEnclosure(p){
  const saved=seals.get(p);
  if(!saved||p.G!==saved.G||p.source!==saved.source||data(p)!==saved.data||p.program!==saved.program||p.program.nodes!==saved.programNodes||metadata(p.program)!==saved.programMetadata||JSON.stringify(p.program.nodes)!==saved.nodes||JSON.stringify(saved.G.nodes.slice(0,saved.count))!==saved.nodes||!saved.G.functionDefinitionsUnchanged(saved.definitions))fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged privately source-bound heat enclosure.');
  assertActualEllOneCovarianceObstruction(saved.source);return true;
}

export function prepareActualHeatScaledEnclosure(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','precisionBits','tolerance','maxTerms'].includes(k)))fail('INVALID_INPUT','The actual source witness and h are internal; only sourceProfile and numerical controls are inputs.');
  const {sourceProfile=SOURCE_PROFILE_ID,...controls}=input,request=controlsOf(controls);
  // Resolve coefficient accuracy cheaply before constructing a large source.
  scaledNumerics(request,context);
  return attachActualHeatScaledEnclosure(prepareActualEllOneCovarianceObstruction({sourceProfile},context),request,context);
}

export async function actualHeatScaledEnclosureCertificateFromProgram(p,context={}){
  assertActualHeatScaledEnclosure(p);const saved=seals.get(p),graphSHA256=await sha256(saved.serialized);context.checkCancelled?.();
  return {schema:'MathScope.ActualHeatScaledEnclosureCertificate/1',status:'COMPLETED',pass:true,request:p.request,sourceBinding:p.sourceBinding,
    graph:{sha256:graphSHA256,nodeCount:saved.count,canonicalBytes:new TextEncoder().encode(saved.serialized).length,compiler:p.program.compiler,compilerInput:p.program.compilerInput,roots:p.roots,graphIncluded:false,fixedCompilerPrefix:true,laterSourceAppendsExcluded:true},
    checks:p.checks,numerics:p.numerics,proof:p.proof,scope:p.scope};
}
