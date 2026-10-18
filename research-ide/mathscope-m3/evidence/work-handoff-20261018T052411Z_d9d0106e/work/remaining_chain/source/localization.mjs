/** N7/near-T operations. Source assumptions are inputs with explicit
 * obligations, never facts inferred from finite data. */
import {NS_PAPER} from './corrections.mjs';
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const finite=x=>typeof x==='number'&&Number.isFinite(x);

export function localizationContract(input={}){
  const qstar=input.qstar??null,h=input.h??null,r0=input.r0??1;
  if(!finite(r0)||r0<=0)fail('INVALID_INPUT','Choose a positive radial support bound.');
  if(qstar!==null&&(!finite(qstar)||qstar<=0||qstar>=1))fail('INVALID_INPUT','The finite domain qstar must lie in (0,1).');
  if(h!==null&&(!finite(h)||h<=0||h>=.01))fail('INVALID_INPUT','The finite h must lie in (0,.01).');
  let selected=null;if(qstar!==null&&h!==null){const D=.5-h,C0=Math.max(2,2**(1/(2*D))),tau0=Math.min(.25,qstar/(8*C0)),z0=(qstar/(8*C0))**D;
    selected={D,C0,tau0,z0,r0,domainMargin:C0*(tau0+z0**(1/D)),requiredUpper:qstar/2,pass:C0*(tau0+z0**(1/D))<qstar/2};}
  return {schema:'MathScope.N7.LocalizationContract/1',paper:NS_PAPER,reference:'Proposition10.1, (10.3)-(10.5)',
    status:selected?'FINITE_DOMAIN_CHOICE_EXECUTED':'SYMBOLIC_SOURCE_DOMAIN_CHOICE',selected,
    symbolic:{D:'1/2-h',C0:'max(2,2^(1/(2D)))',tau0:'min(1/4,qstar/(8 C0))',z0:'(qstar/(8 C0))^D',
      margin:'C0*(tau0+z0^(1/D)) <= qstar/4 < qstar/2',
      spatialCutoff:'chi_x = eta(r^2; r0^2/4,9r0^2/16)*eta(z^2; z0^2/4,9z0^2/16), eta=1 below its first threshold and 0 above its second, smooth.',
      temporalCutoff:'chi_t=eta(tau;tau0/2,tau0), tau=1-t',compactSet:'{r<=3r0/4, |z|<=3z0/4}',
      velocity:'curl(c A)+c B e_theta = c u_local + grad(c) cross A',pressure:'c p_local',
      force:'partial_t u + (u dot grad)u - nu Delta u + grad p',
      pressurePoisson:'-Delta p = partial_i partial_j(u_i u_j) - div f'},
    fixedCompactSupport:true,cutoffOnSquaredRadius:true,curlCommutatorRetained:true,forceNeedNotBeDivergenceFree:true,
    inheritedLocalFieldAvailable:false,actualForceEvaluated:false,allOrderSmoothForceEstablished:false,
    requirements:['Same N6 final potentials A,B and pressure p_local.','Source-bound qstar and endpoint/tail bounds of Proposition9.9.','All cutoff derivatives in actual force evaluation.']};
}

/** Minimal increasing integer choices for the finite part of (10.12).
 * Each bound is an explicit premise. A finite jet list is not C-infinity. */
export function forceExtensionSchedule(input={}){
  const bounds=input.bounds??[];if(!Array.isArray(bounds)||bounds.length>32)fail('RESOURCE_LIMIT','Use a finite list of at most 32 jet-order records.');
  let previous=1;const rows=[];
  for(let j=0;j<bounds.length;j++){
    const row=bounds[j];if(row.j!==j||!Array.isArray(row.constraints))fail('INVALID_JET_SEQUENCE','Jet orders must be consecutive from zero.');
    const required=[];if(j>0)for(let a=0;a<=Math.floor(j/2);a++)for(let m=0;m<=Math.floor(j/2)-a;m++)required.push([a,m]);
    const clauses=required.map(([a,m])=>{const c=row.constraints.find(x=>x.a===a&&x.m===m);if(!c||!finite(c.Cjm)||c.Cjm<=0||!finite(c.jetNorm)||c.jetNorm<0)fail('JET_BOUND_MISSING',`Order ${j} requires bound a=${a},m=${m}.`);return {...c};});
    let b=j===0?1:previous+1;for(const c of clauses){const need=c.jetNorm===0?1:Math.exp((j*Math.LN2+Math.log(c.Cjm)+Math.log(c.jetNorm))/(j-c.m));b=Math.max(b,Math.ceil(need));}
    if(!Number.isSafeInteger(b)||b>1e12)fail('LOG_SCALE_REQUIRED','The cutoff schedule needs a logarithmic or arbitrary-precision integer representation.');
    while(clauses.some(c=>c.Cjm*c.jetNorm*b**(c.m-j)>2**(-j)))b++;
    const checks=clauses.map(c=>({...c,value:c.Cjm*c.jetNorm*b**(c.m-j),upper:2**(-j),pass:c.Cjm*c.jetNorm*b**(c.m-j)<=2**(-j)}));
    rows.push({j,b,checks,activeSigmaUpper:1/b});previous=b;
  }
  return {schema:'MathScope.N7.ForceExtensionSchedule/1',paper:NS_PAPER,reference:'(10.11)-(10.12)',status:'CONDITIONAL_FINITE_JET_SCHEDULE',rows,
    formula:'sum_j chi0(b_j sigma) sigma^j F_j/j!, sigma=t-1 >=0',
    cutoffSupport:'0<=sigma<1, hence t<=2',finiteJetOrder:bounds.length-1,allSpecifiedConstraintsPass:rows.every(r=>r.checks.every(c=>c.pass)),
    jetNormBoundsAreAssumptions:true,terminalJetCompatibilityVerified:false,allOrderCompletion:false,velocityExtendedPastOne:false,
    requiresForInfiniteExtension:'Consecutive source-derived jet bounds for every j and uniform differentiated convergence. For order d, the tail from j>=max(J,2d) is bounded by sum 2^-j once every required source clause is proved.'};
}

export function verifyPeriodization(input={}){
  const {supportHalfWidths=[.2,.2,.2],periods=[1,1,1],viscosity=1,sameForcing=false,periodicPressure=false,zeroInitialData=false}=input;
  if(!Array.isArray(supportHalfWidths)||!Array.isArray(periods)||supportHalfWidths.length!==3||periods.length!==3||supportHalfWidths.some(x=>!finite(x)||x<0)||periods.some(x=>!finite(x)||x<=0)||!finite(viscosity)||viscosity<=0)fail('INVALID_INPUT','Use finite nonnegative support half widths, positive periods and positive viscosity.');
  const gaps=periods.map((p,i)=>p-2*supportHalfWidths[i]),disjoint=gaps.every(x=>x>0);
  return {schema:'MathScope.N7.PeriodizationGate/1',paper:NS_PAPER,reference:'(10.22)-(10.23), Corollary10.6',gaps,disjoint,
    sameForcing,periodicPressure,zeroInitialData,status:disjoint&&sameForcing&&periodicPressure&&zeroInitialData?'FINITE_SUPPORT_CONTRACT_ACCEPTED':'CONTRACT_REJECTED',
    nonlinearCrossTermsVanishFromDisjointSupport:disjoint,sourcePDEVerified:false,continuumClaim:false,
    missing:[...(!disjoint?['Overlapping or touching translated supports']:[]),...(!sameForcing?['same force']:[]),...(!periodicPressure?['periodic pressure']:[]),...(!zeroInitialData?['zero initial data']:[])],
    viscosityRescaling:{velocity:'sqrt(nu) u(x/sqrt(nu),t)',pressure:'nu p(x/sqrt(nu),t)',force:'sqrt(nu) f(x/sqrt(nu),t)',energyFactor:viscosity**2.5}};
}

/** Parse a positive decimal without first converting to a floating number. */
export function positiveTau(text){
  if(typeof text==='number')text=String(text);
  if(typeof text!=='string'||text.length>256)fail('INVALID_TAU','tau must be a finite positive decimal string.');
  const match=text.trim().match(/^\+?(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);if(!match)fail('INVALID_TAU','Invalid decimal syntax for tau.');
  let digits=(match[1]+(match[2]??'')).replace(/^0+/,'');if(!digits)fail('TERMINAL_TIME_FORBIDDEN','tau=0 is outside the reconstruction domain.');
  const exponent=Number(match[3]??0)-(match[2]??'').length;if(!Number.isSafeInteger(exponent)||Math.abs(exponent)>1000000)fail('RESOURCE_LIMIT','Decimal tau exponent must be within +/-10^6.');
  const sci=exponent+digits.length-1,mantissa=Number(digits[0]+'.'+digits.slice(1,17)),logTau=(sci+Math.log10(mantissa))*Math.LN10;
  if(logTau>=0)fail('INVALID_TAU','The near-terminal schedule requires 0<tau<1.');
  return {input:text,exactSign:'POSITIVE',integerDigits:digits,powerOfTen:exponent,scientificExponent:sci,mantissa,logTau,s:-logTau,
    binary64Value:Number(text),displayTime:1-Number(text),displayTimeRoundedToOne:1-Number(text)===1,internalTauNeverReconstructedFromT:true};
}

export function nearTerminalSchedule(input={}){
  const taus=input.taus??['1e-2','1e-4','1e-8','1e-12','1e-40','1e-1000'];if(!Array.isArray(taus)||taus.length>100)fail('RESOURCE_LIMIT','At most 100 tau samples are supported.');
  const rows=taus.map(positiveTau).map(t=>({...t,radialLogScale:t.logTau/2,axialLogScaleFormula:'(1/2-h)*log(tau)',velocityLogScaleFormula:'-(1/2+h)*log(tau)',
    coreEnergyLogScaleFormula:'(1/2-3h)*log(tau)',radialScaleMantissa:10**((t.scientificExponent/2)%1)*Math.sqrt(t.mantissa),
    radialScaleExponent:Math.trunc(t.scientificExponent/2),sourceH:'exp(-8002*(exp(1048576)+10))',sourceHReplacedByZero:false}));
  return {schema:'MathScope.N8.PositiveTauSchedule/1',status:'POSITIVE_TAU_COORDINATES_EXECUTED',paper:NS_PAPER,reference:'(3.2), (9.19), (10.20)',rows,
    coordinatePrecision:'Exact integer decimal sign/exponent; logarithms and display mantissas are binary64 observations.',
    sourceDomainMembership:'NOT_ESTABLISHED: qbig is source-defined and may be far below these sample values.',
    physicalFieldEvaluated:false,finiteValueUsedAsBlowupProof:false,actualReconstructionCertified:false};
}

export function localizationAcceptance(){
  const domain=localizationContract({h:.005,qstar:.001}),near=nearTerminalSchedule(),extension=forceExtensionSchedule({bounds:Array.from({length:8},(_,j)=>({j,constraints:Array.from({length:Math.floor(j/2)+1},(_,a)=>Array.from({length:Math.floor(j/2)-a+1},(_,m)=>({a,m,Cjm:2**j,jetNorm:1+j}))).flat()}))}),period=verifyPeriodization({sameForcing:true,periodicPressure:true,zeroInitialData:true}),overlap=verifyPeriodization({supportHalfWidths:[.6,.2,.2],sameForcing:true,periodicPressure:true,zeroInitialData:true});
  let zeroRejected=false;try{positiveTau('0');}catch(e){zeroRejected=e.code==='TERMINAL_TIME_FORBIDDEN';}
  const checks=[{id:'N7-01-cutoff-domain-margin',pass:domain.selected.pass},{id:'N7-05-finite-extension-tail-constraints',pass:extension.allSpecifiedConstraintsPass},
    {id:'N7-08-periodization-overlap-negative',pass:period.status==='FINITE_SUPPORT_CONTRACT_ACCEPTED'&&overlap.status==='CONTRACT_REJECTED'},
    {id:'N8-04-positive-tau-underflow',pass:near.rows.every(x=>x.exactSign==='POSITIVE')&&near.rows.at(-1).binary64Value===0},
    {id:'N8-04-terminal-time-rejected',pass:zeroRejected}];
  return {schema:'MathScope.N7.LocalizationAcceptance/1',checks,pass:checks.every(x=>x.pass),domain,extension,period,overlap,near,
    scope:'Finite contract and parameter operations; the source final field, terminal jets, global energy and growth certificates remain prerequisites.'};
}
