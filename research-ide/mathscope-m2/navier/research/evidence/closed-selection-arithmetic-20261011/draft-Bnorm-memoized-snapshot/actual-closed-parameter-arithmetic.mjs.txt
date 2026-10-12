/** Finite exact-definition interpretation by directed numerical exponential
 * arithmetic. Every ref is resolved from the original arithmetic definition
 * graph. An integral, unknown operation, free parameter or implicit solution
 * is a hard boundary, never an assigned numerical zero. The generic function
 * authenticates no source; the pinned wrapper owns the source definitions.
 */
import {numericalExponentialArithmetic} from './actual-numerical-exponential-arithmetic.mjs';
import {getPinnedSourceProfile,SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap();
export function evaluateClosedArithmeticDefinitions(definitions,N,{names,maxExpressionVisits=100000,maxDepth=128}={}){
  if(!definitions||typeof definitions!=='object'||Array.isArray(definitions)||!N||typeof N.reportInterval!=='function'||
    !Number.isSafeInteger(maxExpressionVisits)||maxExpressionVisits<1||!Number.isSafeInteger(maxDepth)||maxDepth<1)
    fail('INVALID_INPUT','Use a finite named arithmetic graph and explicit evaluation budgets.');
  if(names===undefined)names=Object.keys(definitions);
  if(!Array.isArray(names)||names.some(x=>typeof x!=='string'||!Object.hasOwn(definitions,x)))
    fail('INVALID_INPUT','Every requested name must belong to the supplied arithmetic definition graph.');
  const values=new Map(),active=new Set(),order=[],counts={};let visits=0;
  const minimum=xs=>N.neg(N.max(xs.map(x=>N.neg(x))));
  const visit=(x,depth=0)=>{
    if(++visits>maxExpressionVisits||depth>maxDepth)fail('RESOURCE_LIMIT','The arithmetic definition traversal exceeded its finite budget.');
    if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==1)
      fail('INVALID_INPUT','Every exact arithmetic expression has one recognized operator.');
    const [op,arg]=Object.entries(x)[0];counts[op]=(counts[op]??0)+1;
    if(op==='integer'){
      if(!(typeof arg==='number'&&Number.isSafeInteger(arg))&&!(typeof arg==='string'&&/^[-+]?\d+$/.test(arg)))
        fail('INVALID_INPUT','An integer source literal must remain an exact integer.');
      return N.point(arg);
    }
    if(op==='rational')return N.point(arg);
    if(op==='ref')return parameter(arg,depth+1);
    if(['sum','product','min','max'].includes(op)){
      if(!Array.isArray(arg)||arg.length<1)fail('INVALID_INPUT','A finite arithmetic aggregate must have at least one operand.');
      const operands=arg.map(y=>visit(y,depth+1));
      if(op==='min')return minimum(operands);if(op==='max')return N.max(operands);
      return operands.reduce((a,b)=>op==='sum'?N.add(a,b):N.mul(a,b),op==='sum'?N.zero():N.one());
    }
    if(op==='quotient'||op==='power'){
      if(!Array.isArray(arg)||arg.length!==2)fail('INVALID_INPUT','A quotient or integer power uses exactly two operands.');
      const first=visit(arg[0],depth+1);
      if(op==='quotient')return N.div(first,visit(arg[1],depth+1));
      if(!Number.isSafeInteger(arg[1]))fail('INVALID_INPUT','The power exponent is an exact finite integer, never a root identifier.');
      return N.pow(first,arg[1]);
    }
    if(['exp','log','sqrt','ceil','floor','neg'].includes(op))return N[op](visit(arg,depth+1));
    fail('NON_ARITHMETIC_BOUNDARY','No closed numerical evaluation was supplied for operation '+op+'.');
  };
  function parameter(name,depth=0){
    if(typeof name!=='string'||!Object.hasOwn(definitions,name))fail('INVALID_INPUT','An arithmetic reference points outside the definition graph.');
    if(values.has(name))return values.get(name);
    if(active.has(name))fail('INVALID_INPUT','Cyclic arithmetic definitions cannot produce a numerical certificate.');
    active.add(name);const result=visit(definitions[name],depth+1);active.delete(name);values.set(name,result);order.push(name);return result;
  }
  for(const name of names)parameter(name);
  return {values,requested:[...names],evaluationOrder:order,expressionVisits:visits,operationCounts:counts,
    sourceAuthenticated:false,opaqueValueAssigned:false,sourceDefinitionGraphMutated:false};
}

function requestOf(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(x=>!['sourceProfile','precisionBits','logCoordinateTolerance','maxOperations','maxExpressionVisits','maxDepth'].includes(x)))
    fail('INVALID_INPUT','The pinned numerical source wrapper accepts only its profile and finite arithmetic/error controls.');
  const request={sourceProfile:input.sourceProfile??SOURCE_PROFILE_ID,precisionBits:input.precisionBits??384,
    logCoordinateTolerance:input.logCoordinateTolerance??'1/1000000000000',maxOperations:input.maxOperations??5000000,
    maxExpressionVisits:input.maxExpressionVisits??100000,maxDepth:input.maxDepth??128};
  assertSourceProfile(request.sourceProfile);return request;
}

export async function encloseActualClosedParameterArithmetic(input={}){
  const request=requestOf(input),profile=getPinnedSourceProfile(),definitions=profile.parametersExactExpressions,
    N=numericalExponentialArithmetic(request),evaluated=evaluateClosedArithmeticDefinitions(definitions,N,request),
    rows=evaluated.evaluationOrder.map(name=>({name,interval:N.reportInterval(evaluated.values.get(name),request)})),
    definitionSHA256=await sha256(canonicalStringify(definitions));
  const result={schema:'MathScope.ActualClosedParameterArithmetic/1',status:'PINNED_ARITHMETIC_DEFINITIONS_NUMERICALLY_ENCLOSED',pass:true,request,
    source:{sourceProfile:request.sourceProfile,originalParameterExpressionSHA256:profile.parameterExpressionSHA256,
      evaluatedDefinitionSHA256:definitionSHA256,definitions:structuredClone(definitions),
      everyOriginalNamedParameterEvaluated:rows.length===Object.keys(definitions).length,
      originalDefinitionGraphUsed:true,sourceDefinitionsSuppliedByCaller:false,opaqueValueAssigned:false},
    rows,arithmetic:N.report(),traversal:{parameterCount:rows.length,expressionVisits:evaluated.expressionVisits,operationCounts:evaluated.operationCounts,
      evaluationOrder:evaluated.evaluationOrder},
    proof:'Induct over the finite original definition graph. Directed rational arithmetic, monotone exp/log, outward signed endpoint operations, and exact exp-log cancellation enclose each operation. A numerical output contains only rational constants and exp/neg; its explicitly named iterated-log width is checked individually.',
    scope:{originalProfileClosedNumericalIntervals:true,everyNamedLogCoordinateWidthChecked:true,positiveSmallValuesRetained:true,
      originalValueRelativeToleranceGuaranteed:false,actualCommonNormsNumericallyEnclosed:false,actualCommonSelectorNumericallyEnclosed:false,
      actualCiLsEpsilonNumericallyEnclosed:false,actualHAndWeightAbsoluteEnclosures:false,wholeGNUMComplete:false,M3Started:false}};
  seals.set(result,canonicalStringify(result));return result;
}
export function assertActualClosedParameterArithmetic(result){
  if(!result||!seals.has(result)||seals.get(result)!==canonicalStringify(result))fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private pinned arithmetic numerical result.');
  return true;
}
export function actualClosedParameterArithmeticCertificate(result){assertActualClosedParameterArithmetic(result);return structuredClone(result);}
