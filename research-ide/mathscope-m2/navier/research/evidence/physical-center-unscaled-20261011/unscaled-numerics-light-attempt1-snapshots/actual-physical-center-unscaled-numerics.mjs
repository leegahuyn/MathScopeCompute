/** Browser arithmetic for original-value derivative enclosures.
 * Fresh rational coefficient boxes are multiplied by installed, CLOSED
 * positive scale boxes. This generic module checks their numerical and
 * row/root compatibility. Only its caller can authenticate the separately
 * executed source certificate and the installed scale proof against pinned
 * hashes. No source graph, private source token or proof is recreated here.
 */
import {numericalExponentialArithmetic,closedNumericalExponentialEndpoint} from './actual-numerical-exponential-arithmetic.mjs';
import {rational as Q,readRational,qcompare,qsub,qtext,fail} from './actual-continuation-arithmetic.mjs';

const LIMITS=Object.freeze({precisionBits:384,maxOperations:5000000,maxMemoEntries:30000,maxDepth:128,maxRationalBits:32768});
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const label=x=>typeof x==='string'&&x.length>0&&x.length<=128&&!x.includes(':');
const root=x=>Number.isSafeInteger(x)&&x>=0;
const sameQ=(a,b)=>qcompare(readRational(a),readRational(b))===0;
const key=r=>[r.quantity,r.sign??'physical',r.component,r.derivative].join(':');

function requestControls(controls){
  if(!object(controls)||Object.keys(controls).some(k=>!['sourceProfile','precisionBits','tolerance','maxCutoffCells','maxTargetCells'].includes(k)))
    fail('INVALID_INPUT','Use the fresh coefficient request controls, without injected scales, endpoints or source evidence.');
  const tolerance=controls.tolerance??'1/1000000000000',coefficientPrecisionBits=controls.precisionBits??192;
  if(typeof tolerance!=='string'||!Number.isSafeInteger(coefficientPrecisionBits)||coefficientPrecisionBits<192||coefficientPrecisionBits>512)
    fail('INVALID_INPUT','The coefficient request needs192..512 bits and an exact rational tolerance string.');
  const tol=readRational(tolerance);
  if(qcompare(tol,Q(0))<=0)fail('INVALID_INPUT','The exact coefficient and scale-coordinate width must be positive.');
  return {tolerance:qtext(tol),coefficientPrecisionBits,arithmeticPrecisionBits:LIMITS.precisionBits};
}

function rationalBox(box,name){
  if(!object(box)||typeof box.lower!=='string'||typeof box.upper!=='string')
    fail('INVALID_INPUT',name+' requires two exact rational STRING endpoints.');
  const lower=readRational(box.lower),upper=readRational(box.upper),width=qsub(upper,lower);
  if(qcompare(width,Q(0))<0)fail('INVALID_INPUT',name+' has reversed endpoints.');
  return {interval:{lower:qtext(lower),upper:qtext(upper)},width:qtext(width)};
}

// The engine also accepts safe integer rational leaves for internal use.
// Installed browser endpoints have a stricter serialized STRING contract:
// changing an endpoint's type never silently changes its interpretation.
function strictlyClosedEndpoint(endpoint){
  if(!closedNumericalExponentialEndpoint(endpoint,LIMITS))return false;
  let p=endpoint;
  while(!Object.hasOwn(p,'rational'))p=Object.hasOwn(p,'exp')?p.exp:p.neg;
  return typeof p.rational==='string';
}

function checkedKey(row,name){
  if(!object(row)||!label(row.quantity)||!label(row.derivative)||!Number.isSafeInteger(row.component)||row.component<0||row.component>2||
    ![undefined,null,1,-1].includes(row.sign))fail('INVALID_INPUT',name+' has an invalid quantity, sign, component or derivative.');
  const k=key(row);
  if(row.rowKey!==undefined&&row.rowKey!==k)fail('INVALID_INPUT',name+' rowKey differs from its typed row fields.');
  return k;
}

function uniqueRows(rows,name,getKey){
  if(!Array.isArray(rows)||rows.length<1||rows.length>270)fail('INVALID_INPUT',name+' must contain1..270 rows.');
  const result=new Map();
  for(const row of rows){const k=getKey(row,name);if(result.has(k))fail('INVALID_INPUT',name+' contains a duplicate row key: '+k);result.set(k,row);}
  return result;
}

function checkedBinding(row,name){
  if(!object(row)||typeof row.rowKey!=='string'||row.rowKey.length<1||row.rowKey.length>512||!root(row.positiveExactScale))
    fail('INVALID_INPUT',name+' needs an original rowKey and a nonnegative exact scale root ID.');
  if(row.quantity!==undefined||row.component!==undefined||row.derivative!==undefined)checkedKey(row,name);
  return row.rowKey;
}

function scaleCoordinate(row,tolerance){
  if(typeof row.coordinateDefinition!=='string'||! /^(value|-log\(value\)|log\^[1-9][0-9]*\(value\)|log\^[1-9][0-9]*\(-log\(value\)\))$/.test(row.coordinateDefinition)||
    row.coordinateDefinition.length>64||typeof row.logCoordinateWidth!=='string'||row.toleranceMet!==true||row.actualScaleRecipeBound!==true)
    fail('INVALID_INPUT','Each installed scale needs its proved recipe and a named, exact numerical coordinate interval.');
  const coordinate=rationalBox(row.coordinate,'The installed scale coordinate');
  if(!sameQ(coordinate.width,row.logCoordinateWidth))fail('INVALID_INPUT','The installed scale coordinate width differs from its exact endpoints.');
  if(qcompare(readRational(coordinate.width),readRational(tolerance))>0)
    fail('PRECISION_REQUIRED','The requested width is smaller than the installed positive-scale log-coordinate enclosure; new source-scale numerical evidence is required.');
  // The installed projection repeats this metadata inside interval. If
  // present, both views must agree; neither view supplies source authority.
  const inner=row.interval;
  if(inner.coordinateDefinition!==undefined&&inner.coordinateDefinition!==row.coordinateDefinition||
    inner.toleranceMet!==undefined&&inner.toleranceMet!==true||
    inner.coordinateWidth!==undefined&&(typeof inner.coordinateWidth!=='string'||!sameQ(inner.coordinateWidth,coordinate.width)))
    fail('INVALID_INPUT','The installed scale has inconsistent nested coordinate metadata.');
  if(inner.coordinate!==undefined){
    const nested=rationalBox(inner.coordinate,'The repeated installed scale coordinate');
    if(!sameQ(nested.interval.lower,coordinate.interval.lower)||!sameQ(nested.interval.upper,coordinate.interval.upper))
      fail('INVALID_INPUT','The repeated installed scale coordinate endpoints disagree.');
  }
  return {coordinateDefinition:row.coordinateDefinition,coordinate:coordinate.interval,logCoordinateWidth:coordinate.width,toleranceMet:true};
}

export function recomputePhysicalCenterUnscaledDerivativeBounds(numericalRows,originalBindings,installedScaleRows,controls={},context={}){
  const request=requestControls(controls),tolerance=readRational(request.tolerance),
    numerics=uniqueRows(numericalRows,'Fresh coefficient rows',checkedKey),
    originals=uniqueRows(originalBindings,'Original derivative bindings',checkedBinding),
    scales=uniqueRows(installedScaleRows,'Installed scale rows',checkedKey),
    progress=(stage,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,...extra});};
  if(numerics.size!==originals.size||numerics.size!==scales.size||[...numerics.keys()].some(k=>!originals.has(k)||!scales.has(k)))
    fail('INVALID_INPUT','The coefficient, original binding and installed scale row sets must match exactly.');
  progress('fresh-original-value-derivative-products-start',{rows:numerics.size});
  const N=numericalExponentialArithmetic(LIMITS),rows=[];
  for(const[rowKey,row]of numerics){
    context.checkCancelled?.();
    const original=originals.get(rowKey),scale=scales.get(rowKey);
    if(!root(scale.sourceRoot)||scale.sourceRoot!==original.positiveExactScale||
      scale.positiveExactScale!==undefined&&scale.positiveExactScale!==original.positiveExactScale)
      fail('INVALID_INPUT','An installed positive scale does not match its original source root: '+rowKey);
    if(!object(scale.interval)||!strictlyClosedEndpoint(scale.interval.lower)||!strictlyClosedEndpoint(scale.interval.upper))
      fail('INVALID_INPUT','Installed positive endpoints must be closed rational-string/exp/neg trees.');
    const coefficient=rationalBox(row.directedInterval,'The fresh coefficient '+rowKey);
    if(row.width!==undefined&&(typeof row.width!=='string'||!sameQ(coefficient.width,row.width))||
      row.toleranceMet!==undefined&&row.toleranceMet!==true)
      fail('INVALID_INPUT','A fresh coefficient has inconsistent width metadata: '+rowKey);
    if(qcompare(readRational(coefficient.width),tolerance)>0)
      fail('PRECISION_REQUIRED','A fresh scaled coefficient interval exceeds the requested width: '+rowKey);
    const coordinate=scaleCoordinate(scale,request.tolerance),positiveScaleInterval=structuredClone({lower:scale.interval.lower,upper:scale.interval.upper}),
      scaleInterval=N.fromClosed(positiveScaleInterval);
    if(N.compareEndpoints(positiveScaleInterval.lower,{rational:'0'})!==1||N.compareEndpoints(positiveScaleInterval.upper,{rational:'0'})!==1)
      fail('INVALID_INPUT','Every installed scale endpoint must be strictly positive: '+rowKey);
    const coefficientInterval=N.fromClosed({lower:{rational:coefficient.interval.lower},upper:{rational:coefficient.interval.upper}}),
      rawDerivativeInterval=N.toClosed(N.mul(coefficientInterval,scaleInterval));
    if(!strictlyClosedEndpoint(rawDerivativeInterval.lower)||!strictlyClosedEndpoint(rawDerivativeInterval.upper))
      fail('INTERNAL_VALIDATION','A directed original-value product did not retain closed numerical endpoints.');
    rows.push({rowKey,quantity:row.quantity,sign:row.sign??null,component:row.component,derivative:row.derivative,
      ...(row.order===undefined?{}:{order:row.order}),positiveExactScale:original.positiveExactScale,sourceRoot:scale.sourceRoot,
      scaledCoefficientInterval:coefficient.interval,scaledCoefficientWidth:coefficient.width,scaledCoefficientTolerance:request.tolerance,
      scaledCoefficientToleranceMet:true,positiveScaleInterval,positiveScaleCoordinate:coordinate,rawDerivativeInterval,
      installedScaleRecipeFlagChecked:true,closedNumericalEndpoints:true,allSignedProductCornersEnclosed:true,
      rawDerivativeRelativeToleranceGuaranteed:false,rawDerivativeAbsoluteWidthRequested:false,sourceAuthenticated:false});
  }
  const checks=[
    {id:'unique-original-coefficient-and-scale-row-sets-match',pass:rows.length===numerics.size},
    {id:'every-positive-scale-root-matches-its-original-binding',pass:rows.every(r=>r.positiveExactScale===r.sourceRoot)},
    {id:'every-scale-is-closed-ordered-and-strictly-positive',pass:true},
    {id:'exact-coefficient-and-installed-coordinate-widths-meet-request',pass:rows.every(r=>r.scaledCoefficientToleranceMet&&r.positiveScaleCoordinate.toleranceMet)},
    {id:'all-signed-products-recomputed-with-directed-closed-endpoints',pass:rows.every(r=>r.closedNumericalEndpoints&&r.allSignedProductCornersEnclosed)},
    {id:'generic-arithmetic-does-not-authenticate-or-reconstruct-source',pass:rows.every(r=>r.sourceAuthenticated===false&&r.rawDerivativeRelativeToleranceGuaranteed===false)}
  ],result={schema:'MathScope.PhysicalCenterUnscaledDerivativeNumerics/1',status:'FRESH_DIRECTED_PRODUCTS_REQUIRING_EXTERNAL_SOURCE_EVIDENCE',pass:true,
    request,rows,checks,arithmetic:{...N.report(),maximumOperations:LIMITS.maxOperations,maximumMemoEntries:LIMITS.maxMemoEntries,
      productsRecomputed:true,installedPositiveIntervalsRecomputed:false},sourceAuthenticated:false,runtimeReconstructedFullSourceGraph:false,
    precision:{scaledCoefficientWidth:request.tolerance,installedScaleCoordinateWidth:request.tolerance,
      rawDerivativeRelativeToleranceGuaranteed:false,rawDerivativeAbsoluteWidthRequested:false,
      interpretation:'The requested width bounds each scaled rational coefficient and each explicitly named scale coordinate. Their directed product encloses the original derivative. A narrow coefficient or iterated-log coordinate does not imply the same relative or absolute width for the original value.'},
    sourceRequirements:{installedEvidenceMustBePinnedByWrapper:true,originalDerivativeAndScaleBindingsMustBeAuthenticatedByWrapper:true,
      installedCoordinateToEndpointRelationMustBeAuthenticatedByWrapper:true,
      interpretation:'Row IDs, recipe flags and closed intervals are compatibility inputs, not a source proof. The wrapper must verify the installed executed source evidence and scale projection against pinned hashes; this function does not verify those hashes or create private source authority.'},
    scope:{freshOriginalValueProductsComputed:true,sourceAuthenticated:false,actualSourceGraphReconstructed:false,privateSourceTokenCreated:false,
      installedPositiveScalesUsed:true,installedPositiveScalesRecomputed:false,scaledCoefficientToleranceChecked:true,installedScaleCoordinateToleranceChecked:true,
      originalValueRelativeToleranceGuaranteed:false,allSourceLabelsNumericallyCovered:false,wholeGNUMComplete:false,userRequestedM2Complete:false,M3Started:false}};
  progress('fresh-original-value-derivative-products-complete',{rows:rows.length,arithmetic:result.arithmetic});return result;
}
