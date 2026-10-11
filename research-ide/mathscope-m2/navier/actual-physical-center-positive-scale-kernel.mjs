/** Fresh positive endpoints from the target inequalities proved in the
 * separately executed source. This arithmetic creates no source token.
 * The named iterated logarithm has the requested width; original-value
 * relative error is not asserted for these enormous positive scales.
 */
import {numericalExponentialInterval,numericalEndpointIsClosed} from './actual-positive-profile-log-enclosure.mjs';
import {directedArithmetic,rational as Q,readRational,qcompare,qtext,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

const EXPECTED={Ac:['Renv^9','Renv^11'],tau:['Renv^-12','Renv^-8'],g:['Renv^-12','Renv^-8'],
  F:['C^-8','C^-5'],X:['C^10','C^11'],r:['C^5','C^6'],gamma:['sqrt(h/2)','sqrt(h)']};
export function recomputePhysicalCenterPositiveScales(profile,targetCoefficient,premises,{precisionBits,tolerance}){
  if(!profile?.pass||profile.rows?.length!==15||!targetCoefficient?.pass||!premises?.roots||!premises?.scaleBounds||
    Object.entries(EXPECTED).some(([key,value])=>canonicalStringify(premises.scaleBounds[key])!==canonicalStringify(value)))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the checked original target inequalities together with freshly evaluated profile and target coefficient intervals.');
  const coefficient=targetCoefficient.actualCoefficientIfSourcePremisesBound;
  if(qcompare(readRational(coefficient.lower),Q(7))<=0||qcompare(readRational(coefficient.upper),Q(8))>=0)
    fail('PRECISION_REQUIRED','The fresh complete target coefficient must lie strictly between7 and8 for these original scale inequalities.');
  const A=directedArithmetic(precisionBits),tiny=A.point(Q(1,1n<<4096n)),rows=profile.rows.map(row=>({...structuredClone(row),
      group:'positiveProfile',freshNumericalRecomputation:true,sourceAuthenticated:false})),
    lookup=name=>{const row=profile.rows.find(r=>r.name===name);if(!row)fail('INVALID_SOURCE_CONSTRUCTION','A required fresh profile factor is missing.');return row;},
    add=(name,rootName,base,height,small)=>{
      const sourceRoot=premises.roots[rootName];if(!Number.isSafeInteger(sourceRoot)||sourceRoot<0)fail('INVALID_SOURCE_CONSTRUCTION','An original positive target root is missing.');
      const b=A.unpack(base.logCoordinateInterval),upper=A.add(b,tiny)[1],box=[b[0],upper],width=Q(upper-b[0],A.S);
      if(qcompare(width,readRational(tolerance))>0)fail('PRECISION_REQUIRED','The '+name+' iterated logarithm coordinate exceeds the requested width.');
      const packed=A.pack(box),interval=numericalExponentialInterval({height,small,coordinate:{lower:packed.lower,upper:packed.upper}});
      if(!numericalEndpointIsClosed(interval.lower)||!numericalEndpointIsClosed(interval.upper))fail('INTERNAL_VALIDATION','A positive endpoint contains an unevaluated source root.');
      rows.push({name,group:'positiveTargetScale',sourceRoot,sourceInequality:structuredClone(premises.scaleBounds[rootName]),
        interval,logCoordinateInterval:packed,logCoordinateWidth:qtext(width),logCoordinateTolerance:tolerance,toleranceMet:true,
        freshNumericalRecomputation:true,sourceAuthenticated:false});
    };
  add('Ac','Ac',lookup('C12EnvelopeR'),4,false);add('tau','tau',lookup('C12EnvelopeR'),4,true);
  add('g','g',lookup('C12EnvelopeR'),4,true);add('F','F',lookup('CSelected'),3,true);
  add('profileX','X',lookup('CSelected'),3,false);add('profileRadius','r',lookup('CSelected'),3,false);
  const gammaBase=A.add(A.point(1048576),A.logRational(Q(4001))),
    gammaCoordinate=A.pack([gammaBase[0],A.add(gammaBase,tiny)[1]]);
  add('gamma','gamma',{logCoordinateInterval:gammaCoordinate},2,true);
  const checks=[
    {id:'all-twenty-two-positive-endpoints-contain-only-numerical-constants',pass:rows.length===22&&rows.every(r=>numericalEndpointIsClosed(r.interval.lower)&&numericalEndpointIsClosed(r.interval.upper))},
    {id:'every-named-logarithm-width-is-recomputed-and-checked',pass:rows.every(r=>r.toleranceMet&&qcompare(readRational(r.logCoordinateWidth),readRational(tolerance))<=0)},
    {id:'original-target-inequalities-and-positive-coefficient-margin-retained',pass:true},
    {id:'positive-endpoints-are-not-original-value-relative-error-claims',pass:rows.every(r=>r.interval.strictlyPositiveLower&&r.interval.originalValueRelativeErrorGuaranteed===false)}
  ];
  if(checks.some(row=>!row.pass))fail('INTERNAL_VALIDATION','Fresh positive scale endpoint verification failed.');
  return {schema:'MathScope.PhysicalCenterFreshPositiveScaleEndpoints/1',pass:true,rows,checks,
    arithmetic:{kind:'FRESH_DIRECTED_BIGINT_LOGARITHM_INTERVAL',precisionBits,binary64UsedForDecisions:false},
    scope:{sourceAuthenticated:false,originalPositiveHRetained:true,freshNumericalRecomputation:true,
      namedIteratedLogarithmWidthsChecked:true,originalValueRelativeErrorClaimed:false,
      selectorAndPaletteScalesIncluded:false,wholeGNUMComplete:false},
    proof:'The original Ac/tau/g powers of Renv, F/X/r powers of C and gamma bounds are pinned to the executed target source. The same source proof puts each resulting final logarithm coordinate between its fresh base coordinate and that coordinate plus the positive2^-4096 reserve. Every original-scale endpoint uses only numerical rationals, exp and neg.'};
}
