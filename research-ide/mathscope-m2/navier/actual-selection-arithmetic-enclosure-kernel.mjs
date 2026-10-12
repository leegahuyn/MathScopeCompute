/** Interpret a finite original arithmetic dependency trace. Supplied boundary
 * intervals are mathematical PREMISES at this generic layer; only a separate
 * source adapter may prove/authenticate them. Unknown source integrals and
 * implicit function values are never treated as rational values or zero.
 */
import {fail,rational as Q} from './actual-continuation-arithmetic.mjs';

export function tracedArithmeticEvaluator(trace,N,{parameters=new Map(),boundaries=new Map(),maxNodeVisits=250000}={}){
  if(!trace||!Array.isArray(trace.nodes)||!N||typeof N.reportInterval!=='function'||!(parameters instanceof Map)||!(boundaries instanceof Map)||
    !Number.isSafeInteger(maxNodeVisits)||maxNodeVisits<1)fail('INVALID_INPUT','Use an exact sparse node trace, explicit interval premises and a finite visit budget.');
  const nodes=new Map(),values=new Map(),active=new Set(),usedParameters=new Set(),usedBoundaries=new Set();let visits=0;
  for(const row of trace.nodes){
    if(!row||!Number.isSafeInteger(row.id)||row.id<0||nodes.has(row.id)||!row.node||typeof row.node.op!=='string'||!Array.isArray(row.node.args))
      fail('INVALID_INPUT','Sparse trace node identifiers and operator records must be unique and well formed.');
    nodes.set(row.id,row.node);
  }
  const boundaryIds=new Set((trace.nonArithmeticBoundaries??[]).map(r=>r.id));
  for(const id of boundaries.keys())if(!boundaryIds.has(id))fail('INVALID_INPUT','A boundary premise may only enclose a declared non-arithmetic stop node.');
  function classify(id){
    const n=nodes.get(id);if(!n)fail('INVALID_INPUT','The sparse arithmetic graph omitted a referenced operand '+id+'.');
    const {op,args}=n;
    if(op==='rational'){
      if(args.length!==2||args.some(x=>typeof x!=='string'||!/^[-+]?\d+$/.test(x)))fail('INVALID_INPUT','A literal rational keeps its two exact integer operands.');
      return {n,children:[]};
    }
    if(op==='source_parameter'){
      if(args.length!==1||typeof args[0]!=='string')fail('INVALID_INPUT','A parameter node keeps its exact source name.');
      return {n,children:[]};
    }
    if(['inverse','exp','log_positive','sqrt_positive','ceiling','floor'].includes(op)){
      if(args.length!==1)fail('INVALID_INPUT','An arithmetic unary operator lost its one operand.');return {n,children:args};
    }
    if(op==='integer_power'){
      if(args.length!==2||!Number.isSafeInteger(args[1]))fail('INVALID_INPUT','A source integer power keeps its exact exponent, separate from its node operand.');
      return {n,children:[args[0]]};
    }
    if(['add','multiply','maximum'].includes(op)){
      if(op==='maximum'&&!args.length)fail('INVALID_INPUT','A finite maximum has at least one operand.');return {n,children:args};
    }
    if(!boundaryIds.has(id))fail('INVALID_INPUT','An unrecognized source operator was not declared as a retained boundary.');
    return {n,children:[],boundary:true};
  }
  function value(root){
    if(!Number.isSafeInteger(root)||root<0)fail('INVALID_INPUT','A root is an existing nonnegative exact node identifier.');
    const stack=[{id:root,post:false}];
    while(stack.length){
      const {id,post}=stack.pop();if(values.has(id))continue;
      const {n,children,boundary}=classify(id);
      if(!post){
        if(++visits>maxNodeVisits)fail('RESOURCE_LIMIT','The actual finite arithmetic node budget was exhausted.');
        if(active.has(id))fail('INVALID_INPUT','A cyclic arithmetic trace cannot be evaluated.');active.add(id);
        stack.push({id,post:true});
        for(const child of children){if(!Number.isSafeInteger(child)||child<0||!nodes.has(child))fail('INVALID_INPUT','An arithmetic operand is not an existing node.');
          if(!values.has(child))stack.push({id:child,post:false});}
        continue;
      }
      const {op,args}=n,c=children.map(i=>{if(!values.has(i))fail('INVALID_INPUT','A cyclic or incomplete operand graph was encountered.');return values.get(i);});let out;
      if(boundary){
        if(!boundaries.has(id))fail('NON_ARITHMETIC_BOUNDARY','No proved enclosure was supplied for the retained source boundary '+id+'.');
        usedBoundaries.add(id);out=boundaries.get(id);
      }else if(op==='rational')out=N.point(Q(BigInt(args[0]),BigInt(args[1])));
      else if(op==='source_parameter'){
        if(!parameters.has(args[0]))fail('NON_ARITHMETIC_BOUNDARY','The original source parameter '+args[0]+' has not been numerically enclosed.');
        usedParameters.add(args[0]);out=parameters.get(args[0]);
      }else if(op==='add')out=c.reduce((a,b)=>N.add(a,b),N.zero());
      else if(op==='multiply')out=c.reduce((a,b)=>N.mul(a,b),N.one());
      else if(op==='maximum')out=N.max(c);
      else if(op==='integer_power')out=N.pow(c[0],args[1]);
      else out=N[{inverse:'inverse',exp:'exp',log_positive:'log',sqrt_positive:'sqrt',ceiling:'ceil',floor:'floor'}[op]](c[0]);
      values.set(id,out);active.delete(id);
    }
    return values.get(root);
  }
  return {value,values,report:()=>({schema:'MathScope.TracedArithmeticEvaluation/1',visitedNodes:values.size,nodeVisits:visits,
    sourceParametersNumericallyConsumed:[...usedParameters].sort(),conditionalBoundaryIntervalsConsumed:[...usedBoundaries].sort((a,b)=>a-b),
    sourceAuthenticated:false,boundaryPremisesProvedHere:false,opaqueSourceValuesReplacedByZero:false,originalNodesRewritten:false})};
}
