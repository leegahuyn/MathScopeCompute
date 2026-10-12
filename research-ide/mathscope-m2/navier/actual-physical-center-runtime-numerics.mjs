/** Fresh directed arithmetic for a pinned, externally proved source point.
 * This module has NO authority to authenticate that point or its graph.
 * Every numerical prerequisite is recomputed from fixed generic formulas
 * and the requested exact arithmetic controls. No old interval, receipt,
 * source root, point or caller-supplied derivative enters the calculation.
 * The installed wrapper must independently verify the executed source
 * evidence, its profile, original point/normalizers and build compatibility.
 */
import {SOURCE_PROFILE_ID} from './source-profile.mjs';
import {enclosePhysicalCenterCoefficients} from './actual-physical-center-kernel.mjs';
import {enclosePhysicalCenterSlowSlopes,enclosePhysicalCenterJetCoefficients} from './actual-physical-center-slow-slope-kernel.mjs';
import {enclosePhysicalCompleteCurlJetCoefficients} from './actual-physical-center-full-curl-jet-kernel.mjs';
import {encloseTerminalTargetRegularCoefficient} from './actual-terminal-target-coefficient-kernel.mjs';
import {encloseActualPositiveProfileLogs} from './actual-positive-profile-log-enclosure.mjs';
import {directedArithmetic,rational as Q,readRational,qcompare,qdiv,qsub,qtext,fail} from './actual-continuation-arithmetic.mjs';

const key=r=>[r.quantity,r.sign??'physical',r.component,r.derivative].join(':'),dyadic=n=>Q(1,1n<<BigInt(n));
const validCells=(n,low)=>Number.isSafeInteger(n)&&n>=low&&n<=4096&&(n&(n-1))===0;
const checkAll=checks=>{if(checks.some(x=>!x.pass))fail('INTERNAL_VALIDATION','Fresh physical coefficient recomputation failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));};
const widthIsExactAndWithin=(interval,printed,tolerance)=>{
  const width=qsub(readRational(interval.upper),readRational(interval.lower));
  return qcompare(width,Q(0))>=0&&qcompare(width,readRational(printed))===0&&qcompare(width,readRational(tolerance))<=0;
};

export function physicalCenterRuntimeNumericalRequest(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','precisionBits','tolerance','maxCutoffCells','maxTargetCells'].includes(k)))
    fail('INVALID_INPUT','Only the fixed profile, directed precision, exact coefficient width and two finite quadrature budgets are accepted.');
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID,precisionBits=input.precisionBits??192,tolerance=input.tolerance??'1/1000000000000',
    maxCutoffCells=input.maxCutoffCells??4096,maxTargetCells=input.maxTargetCells??1024;
  if(sourceProfile!==SOURCE_PROFILE_ID||!Number.isSafeInteger(precisionBits)||precisionBits<192||precisionBits>512||typeof tolerance!=='string')
    fail('INVALID_INPUT','Use the installed fixed profile,192..512 bits and an exact rational tolerance string.');
  const tol=readRational(tolerance);
  if(qcompare(tol,Q(0))<=0||qcompare(tol,Q(1,100))>0||!validCells(maxCutoffCells,4)||!validCells(maxTargetCells,16))
    fail('INVALID_INPUT','The exact width lies in(0,1/100]; maxCutoffCells is a power of two4..4096 and maxTargetCells16..4096.');
  if(qcompare(tol,dyadic(precisionBits-64))<0)
    fail('PRECISION_REQUIRED','The requested width leaves insufficient precision for the freshly recomputed value, slope and nonlinear derivative budgets; at most512 bits are installed.');
  // The frozen target kernel retains 64*exp(-128)<2^-122. Its own
  // quadrature guard allocates at most half the requested width to the
  // quadrature plus this positive tail. No extra precision removes it.
  if(qcompare(tol,dyadic(121))<=0)
    fail('PRECISION_REQUIRED','The installed target integral keeps the positive tail upper bound2^-122 and requires width greater than2^-121. More arithmetic bits alone do not reduce this analytic reserve; request a wider interval.');
  directedArithmetic(precisionBits);
  return {sourceProfile,precisionBits,tolerance:qtext(tol),maxCutoffCells,maxTargetCells};
}

function physicalScaleDescription(row){
  const axis=d=>d==='theta'?'Q^(-1/2)':d==='t'?'Q^(-1-h)':'Q^(-1/2)',
    omega=d=>d==='r'?'Bs*u':d==='z'?'Bs':d==='t'?'pTilde*F':'pTilde/Rsharp',
    directions=row.directions??[row.direction],component=row.component===0?'1':row.component===1?'Ac':'u',
    V='Q^(-A)*sqrt(epsilon)*eta_beta*('+component+')*A0';
  return V+' * k^'+row.order+' * '+directions.map(d=>'('+omega(d)+')*('+axis(d)+')').join(' * ')+
    '; all positive normalizers are frozen after differentiation; pTilde=Rsharp*Bs*u/(Ls*gabs), A0=sqrt(tau/massScale), massScale=r0^2/sqrt(g*Ls).'+
    (directions.includes('theta')?' Angular rows include the cylindrical vector connection; theta-theta also includes Dr(U)/R.':'');
}

function joinedRows(pulse,physical,request){
  const rows=[],tol=readRational(request.tolerance),put=(r,interval,radius,quantity,group,scaleDescription)=>{
    const derivative=r.derivative??r.direction??r.directions.join(''),width=qsub(readRational(interval.upper),readRational(interval.lower)),
      row={rowKey:key({...r,quantity,derivative}),quantity,...(r.sign===undefined?{}:{sign:r.sign}),component:r.component,derivative,order:r.order,
        directedInterval:structuredClone(interval),width:qtext(width),tolerance:request.tolerance,toleranceMet:true,positiveErrorRadius:radius,numericalGroup:group,scaleDescription};
    if(qcompare(width,Q(0))<=0||qcompare(width,tol)>0||qcompare(width,readRational(r.width))!==0||qcompare(readRational(radius),Q(0))<=0)
      fail('PRECISION_REQUIRED','The fresh '+row.rowKey+' interval failed its positive-error or exact endpoint-width check.');
    rows.push(row);
  };
  for(const r of pulse.rows)put(r,r.interval,pulse.errorBudget.positiveRadius,r.quantity,r.group,
    r.exactScale+'; D_R=Rsharp*partial_R, D_Z=partial_Z, D_T=partial_T; Rsharp and every divisor are frozen only after the original differentiation.');
  for(const r of physical.rows)put(r,r.coefficient,physical.positiveRemainder,'physicalCurl','physicalCurl',physicalScaleDescription(r));
  if(rows.length!==270||new Set(rows.map(r=>r.rowKey)).size!==270)fail('INTERNAL_VALIDATION','The fresh228+42 coefficient row keys are incomplete or duplicated.');
  return rows;
}

export async function recomputePhysicalCenterRuntimeNumerics(input={},context={}){
  const request=physicalCenterRuntimeNumericalRequest(input),tol=readRational(request.tolerance),
    valueTolerance=qtext(qdiv(tol,Q(4096))),slopeTolerance=valueTolerance,centerTolerance=qtext(qdiv(tol,Q(65536))),
    progress=(stage,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,...extra});};
  progress('fresh-cutoff-absolute-center-and-three-component-values');
  // This kernel recomputes its cutoff integral and Gaussian mass first,
  // then the absolute positive center, H, inverse weights and all values.
  const valueEnclosures=enclosePhysicalCenterCoefficients({precisionBits:request.precisionBits,tolerance:valueTolerance,
    centerTolerance,maxCutoffCells:request.maxCutoffCells},context),values=valueEnclosures.values;
  progress('fresh-new-point-comparison-slopes',{valueRows:valueEnclosures.rows.length});
  const slopes=enclosePhysicalCenterSlowSlopes({precisionBits:request.precisionBits,tolerance:slopeTolerance},context);
  progress('fresh-original-pulse-and-complete-physical-derivative-coefficients',{comparisonRows:slopes.rows.length});
  const pulse=enclosePhysicalCenterJetCoefficients({precisionBits:request.precisionBits,tolerance:request.tolerance,mu:slopes.mu,nu:slopes.nu,values},context),
    physical=enclosePhysicalCompleteCurlJetCoefficients({precisionBits:request.precisionBits,tolerance:request.tolerance,velocityCoefficients:values.weightedCylindrical[0]}),
    rows=joinedRows(pulse,physical,request);
  progress('fresh-complete-terminal-target-regular-coefficient',{derivativeRows:rows.length});
  const targetCoefficient=encloseTerminalTargetRegularCoefficient({precisionBits:request.precisionBits,tolerance:request.tolerance,maxCells:request.maxTargetCells},context);
  progress('fresh-positive-profile-logarithm-coordinates');
  const profile=await encloseActualPositiveProfileLogs({sourceProfile:request.sourceProfile,precisionBits:request.precisionBits,logCoordinateTolerance:request.tolerance}),
    positiveProfile={...structuredClone(profile),sourceAuthenticated:false,authority:'MATCHED_FIXED_PROFILE_DEFINITIONS_ONLY',
      actualSourcePointAuthenticated:false,commonSourceGraphReconstructed:false},
    checks=[
      {id:'cutoff-and-absolute-center-recomputed-with-positive-remainders',pass:valueEnclosures.pass&&valueEnclosures.centered.sigmaIntegral.pass&&
        valueEnclosures.absolute.pass&&valueEnclosures.positiveRemaindersRetained&&valueEnclosures.absolute.errorBudget.nonzeroSubUlpRemainderRoundedUp},
      {id:'all-fresh-three-component-H-and-inverse-weight-widths-checked',pass:valueEnclosures.rows.every(r=>r.toleranceMet&&widthIsExactAndWithin(r.interval,r.width,r.tolerance))&&valueEnclosures.sourceAuthenticated===false},
      {id:'all-six-new-comparison-slopes-recomputed',pass:slopes.pass&&slopes.rows.length===6&&slopes.rows.every(r=>r.toleranceMet&&widthIsExactAndWithin(r.interval,r.width,slopeTolerance))&&slopes.sourceAuthenticated===false},
      {id:'all228-pulse-and42-complete-physical-derivative-rows-recomputed',pass:pulse.pass&&physical.pass&&pulse.rows.length===228&&physical.rows.length===42&&
        rows.length===270&&rows.every(r=>r.toleranceMet&&qcompare(readRational(r.positiveErrorRadius),Q(0))>0)},
      {id:'all-angular-mixed-and-direction-hessian-connections-covered',pass:['rtheta','ztheta','ttheta','thetatheta'].every(d=>rows.filter(r=>r.quantity==='physicalCurl'&&r.derivative===d).length===3)&&
        physical.second.filter(r=>r.includesAngularDirectionConnection).length===3},
      {id:'target-regular-quadrature-and-nonzero-whole-tail-recomputed',pass:targetCoefficient.pass&&targetCoefficient.errorBudget.toleranceMet&&targetCoefficient.proof.positiveInfiniteTailRetained&&
        widthIsExactAndWithin(targetCoefficient.actualCoefficientIfSourcePremisesBound,targetCoefficient.absoluteWidth,request.tolerance)},
      {id:'all-fifteen-fixed-profile-logarithm-intervals-recomputed',pass:profile.pass&&profile.rows.length===15&&profile.rows.every(r=>r.toleranceMet&&
        widthIsExactAndWithin(r.logCoordinateInterval,r.logCoordinateWidth,request.tolerance))&&profile.sourceBinding.allUsedOriginalDefinitionsMatched},
      {id:'generic-arithmetic-does-not-reconstruct-or-authenticate-a-source-point',pass:pulse.sourceAuthenticated===false&&physical.sourceAuthenticated===false&&
        targetCoefficient.scope.actualSourcePointAuthenticated===false&&positiveProfile.actualSourcePointAuthenticated===false}
    ];
  checkAll(checks);
  const result={schema:'MathScope.PhysicalCenterFreshRuntimeNumerics/1',status:'FRESH_DIRECTED_RECOMPUTATION_REQUIRING_EXTERNAL_SOURCE_EVIDENCE',pass:true,request,
    sourceAuthenticated:false,runtimeReconstructedFullSourceGraph:false,
    rows,values,slopes,pulse,physical,targetCoefficient,positiveProfile,valueEnclosures,
    cutoff:valueEnclosures.centered.sigmaIntegral,absoluteCenter:valueEnclosures.absolute,checks,
    precisionAllocation:{requestedCoefficientWidth:request.tolerance,valueWidth:valueTolerance,slopeWidth:slopeTolerance,absoluteCenterWidth:centerTolerance,
      cutoffWidth:valueEnclosures.centered.errorBudget.cutoffRequestedWidth,targetCoefficientWidth:request.tolerance,profileLogCoordinateWidth:request.tolerance,
      everyFinalEndpointWidthChecked:true,precisionBits:request.precisionBits,maximumInstalledBits:512,
      fixedTargetTailUpper:'1/'+String(1n<<122n),targetWidthMustExceed:'1/'+String(1n<<121n)},
    sourceRequirements:{
      authority:'The installed wrapper must independently verify its pinned executed source certificate, original profile, point and band, positive normalizers, source import manifest and installed arithmetic build. This pure numerical result creates no private source token.',
      rowBinding:'Match every rowKey to the pinned same-point original derivative and positive normalizer IDs; a printed key or generic interval alone does not authenticate either source expression.',
      values:'The same new-point source proof must rebind the complete original Gaussian, finite-u transport, initial-layer, inverse-weight, frame, support and positive-domain premises. The generic ancestor audit labels are not evidence of transferring old actual values.',
      precision:'Only scaled coefficient widths and the explicitly named profile logarithm-coordinate widths are requested here. Neither original unscaled relative accuracy nor the remaining selector/palette tower is inferred.',
      replay:'A replay requires the same installed arithmetic build and pinned original source certificate, plus a fresh calculation from these exact controls. The original full source graph is not reconstructed in this module.'
    },
    arithmetic:{kind:'FRESH_DIRECTED_BIGINT_INTERVAL_PIPELINE',bits:request.precisionBits,binary64UsedForDecisions:false,callerIntervalsAccepted:false,
      priorReceiptUsedAsNumericalInput:false,everyNumericalPrerequisiteRecomputed:true},
    scope:{freshDirectedArithmeticExecuted:true,sourceAuthenticated:false,actualSourcePointAuthenticated:false,runtimeReconstructedFullSourceGraph:false,
      fixedProfileDefinitionsRechecked:true,originalPointAndPositiveNormalizersRequireExternalEvidence:true,
      conditionalPulseDerivativeRows:228,conditionalPhysicalDerivativeRows:42,conditionalCompleteSpatialHessianIncluded:true,
      positiveAnalyticRemaindersRetained:true,originalPositiveHReplacedByZero:false,oldPointActualJetValuesTransferred:false,
      originalUnscaledRelativeAccuracyClaimed:false,remainingSelectorAndPaletteScalesNumericallyClosed:false,allSourceLabelsNumericallyCovered:false,
      globalResidualNumericallyEnclosed:false,wholeGNUMComplete:false,userRequestedM2Complete:false,newLeanKernelProof:false,M3Started:false}
  };
  progress('fresh-all270-directed-derivative-coefficients-complete',{derivativeRows:rows.length,valueRows:valueEnclosures.rows.length,profileRows:profile.rows.length});
  return result;
}
