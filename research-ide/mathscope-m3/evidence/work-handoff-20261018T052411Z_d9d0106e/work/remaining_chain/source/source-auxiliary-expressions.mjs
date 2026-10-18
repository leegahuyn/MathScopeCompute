/** Additive calculus for complete source fields on a common auxiliary torus.
 *
 * This facade appends explicit nodes to the SAME source graph. It neither
 * replaces the original graph object nor transplants any of its private
 * band/current seals. Existing M2/M3 operations continue to use their own
 * original implementations. New definitions and their derivatives belong
 * only to this facade and are separately sealed by their source caller.
 *
 * An indexed derivative differentiates its actual fixed-label local body
 * before applying a constant chart/torus Jacobian and the complete cover.
 * It never differentiates floor-selected labels or nearest torus lifts.
 */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {materializeGlobalSourceClosure} from './source-global-expressions.mjs';

const owners=new WeakMap(),data=new WeakMap(),fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});};
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const custom=new Set(['m3_aux_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial']);
const unary=new Set(['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling']);
const primitive=new Set(['rational','source_parameter','coordinate']);
const sum=xs=>xs.reduce((a,b)=>a+b,0),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);

function children(node){
  const {op,args}=node;
  if(primitive.has(op))return [];
  if(unary.has(op)||op==='integer_power'||op==='source_step_derivative')return [args[0]];
  if(op==='definite_integral')return [args[0],args[2],args[3]];
  if(custom.has(op)||op==='actual_expression_partial'||op==='m3_global_indexed_partial')return args[1];
  if(op==='m3_global_pulse_jet'||op==='actual_covariance_volterra')return [args[2],...args[3]];
  return args.filter(x=>Number.isSafeInteger(x));
}

export class AuxiliarySourceExpressions{
  constructor(base,{maximumOrder=12}={}){
    if(data.has(base))return base;
    if(owners.has(base))return owners.get(base);
    if(!base||!Array.isArray(base.nodes)||typeof base.derivative!=='function'||typeof base.captureFunctionDefinitions!=='function')
      fail('An auxiliary facade requires an actual retained expression graph.');
    if(!Number.isSafeInteger(maximumOrder)||maximumOrder<6||maximumOrder>32)fail('Declare a finite auxiliary derivative order between6 and32.','RESOURCE_LIMIT');
    const proxy=new Proxy(this,{get(target,key,receiver){
      if(Reflect.has(target,key))return Reflect.get(target,key,receiver);
      const value=base[key];return typeof value==='function'?value.bind(base):value;
    }});
    data.set(proxy,{base,initialCount:base.nodes.length,maximumOrder,expressions:[],fields:[],inverses:[],
      extension:new Map(),free:new Map(),derivatives:new Map(),substitutions:new Map(),materializedExpressions:new Map(),materializedFields:new Map()});
    owners.set(base,proxy);return proxy;
  }
  get baseGraph(){return data.get(this).base;}
  get maximumAuxiliaryOrder(){return data.get(this).maximumOrder;}
  extended(id){
    const p=data.get(this),node=this.nodes[id];if(!node)fail('A source expression operand is missing.');
    if(id<p.initialCount)return false;if(p.extension.has(id))return p.extension.get(id);
    const yes=custom.has(node.op)||children(node).some(x=>this.extended(x));p.extension.set(id,yes);return yes;
  }
  freeCoordinates(id){
    const p=data.get(this);if(!this.extended(id))return p.base.freeCoordinates(id);if(p.free.has(id))return p.free.get(id);
    const node=this.nodes[id],out=new Set();
    if(node.op==='coordinate')out.add(id);
    else if(node.op==='definite_integral'){
      for(const x of this.freeCoordinates(node.args[0]))if(x!==node.args[1])out.add(x);
      for(const i of [2,3])for(const x of this.freeCoordinates(node.args[i]))out.add(x);
    }else for(const child of children(node))for(const x of this.freeCoordinates(child))out.add(x);
    p.free.set(id,out);return out;
  }
  dependsOn(id,variable){return this.freeCoordinates(id).has(variable);}
  choose(x,left,right,before,inside,after){
    if(x===left||x===this.zero&&this.baseGraph.sourcePositiveGeometry?.(left))return before;
    if(x===right)return after;
    if(this.isq(x)&&this.isq(left)&&this.isq(right)){
      const [xn,xd]=this.fraction(x),[ln,ld]=this.fraction(left),[rn,rd]=this.fraction(right);
      return xn*ld<=ln*xd?before:xn*rd>=rn*xd?after:inside;
    }
    return this.baseGraph.choose(x,left,right,before,inside,after);
  }
  integral(body,variable,left,right){
    if(body===this.zero||left===right)return this.zero;
    if(this.nodes[variable]?.op!=='coordinate')fail('A bound integral variable must be a coordinate.','INVALID_INPUT');
    if(!this.extended(body)&&!this.extended(left)&&!this.extended(right))return this.baseGraph.integral(body,variable,left,right);
    if(!this.dependsOn(body,variable))return this.mul(body,this.sub(right,left));
    return this.node('definite_integral',[body,variable,left,right]);
  }
  simultaneousSubstitute(body,variables,values){
    if(variables.length!==values.length||new Set(variables).size!==variables.length)fail('A simultaneous substitution needs distinct complete operands.','INVALID_INPUT');
    const temporary=variables.map(()=>this.fresh('auxiliary_capture_free'));
    variables.forEach((x,j)=>{body=this.substitute(body,x,temporary[j]);});
    temporary.forEach((x,j)=>{body=this.substitute(body,x,values[j]);});return body;
  }
  substitute(id,variable,value){
    if(id===variable)return value;
    if(this.nodes[variable]?.op==='coordinate'&&!this.dependsOn(id,variable))return id;
    const p=data.get(this);if(!this.extended(id)&&!this.extended(value))return p.base.substitute(id,variable,value);
    const key=[id,variable,value].join(':');if(p.substitutions.has(key))return p.substitutions.get(key);
    const {op,args}=this.nodes[id],at=x=>this.substitute(x,variable,value);let out=id;
    if(primitive.has(op))return id;
    if(op==='m3_aux_expression_partial')out=this.expressionValue(args[0],args[1].map(at),args[2]);
    else if(op==='m3_aux_indexed_partial')out=this.periodicIndexedValue(args[0],args[1].map(at),args[2]);
    else if(op==='m3_aux_inverse_partial')out=this.auxiliaryInverseValue(args[0],args[1].map(at),args[2]);
    else if(op==='add')out=this.add(...args.map(at));
    else if(op==='multiply'){const first=at(args[0]);out=first===this.zero?this.zero:this.mul(first,at(args[1]));}
    else if(op==='inverse')out=this.inv(at(args[0]));
    else if(op==='integer_power')out=this.pow(at(args[0]),args[1]);
    else if(op==='exp')out=this.exp(at(args[0]));
    else if(op==='log_positive')out=this.log(at(args[0]));
    else if(op==='sqrt_positive')out=this.sqrt(at(args[0]));
    else if(op==='sine')out=this.sine(at(args[0]));
    else if(op==='cosine')out=this.cosine(at(args[0]));
    else if(op==='ceiling')out=this.ceiling(at(args[0]));
    else if(op==='maximum')out=this.maximum(...args.map(at));
    else if(op==='source_step_derivative')out=this.step(at(args[0]),args[1]);
    else if(op==='smooth_piecewise'){
      const x=at(args[0]),left=at(args[1]),right=at(args[2]);
      // Select an inactive source guard before descending into a body
      // containing an inverse, square root or fixed representative.
      if(x===left||x===this.zero&&this.baseGraph.sourcePositiveGeometry?.(left))out=at(args[3]);
      else if(x===right)out=at(args[5]);
      else if(this.isq(x)&&this.isq(left)&&this.isq(right)){
        const [xn,xd]=this.fraction(x),[ln,ld]=this.fraction(left),[rn,rd]=this.fraction(right);
        out=at(xn*ld<=ln*xd?args[3]:xn*rd>=rn*xd?args[5]:args[4]);
      }else out=this.choose(x,left,right,...args.slice(3).map(at));
    }else if(op==='definite_integral'){
      let [body,bound,left,right]=args;left=at(left);right=at(right);
      if(bound!==variable){
        if(this.dependsOn(value,bound)&&this.dependsOn(body,variable)){
          const renamed=this.fresh('auxiliary_alpha_renamed_integral');body=this.substitute(body,bound,renamed);bound=renamed;
        }
        body=this.substitute(body,variable,value);
      }
      out=this.integral(body,bound,left,right);
    }
    else if(!this.extended(id))out=p.base.substitute(id,variable,value);
    else fail('No auxiliary substitution rule for '+op+'.','UNSUPPORTED');
    p.substitutions.set(key,out);return out;
  }
  derivative(id,variable){
    const p=data.get(this);if(!this.extended(id))return p.base.derivative(id,variable);
    const key=id+':'+variable;if(p.derivatives.has(key))return p.derivatives.get(key);
    if(!this.dependsOn(id,variable))return this.zero;
    const {op,args}=this.nodes[id],d=x=>this.derivative(x,variable);let out=this.zero;
    if(custom.has(op)){
      const [system,values,orders]=args,definition=op==='m3_aux_expression_partial'?this.expressionSystem(system):
        op==='m3_aux_indexed_partial'?this.periodicIndexedSystem(system):this.auxiliaryInverseSystem(system),
        at=op==='m3_aux_expression_partial'?definition.parameters.map((_,j)=>j):definition.directionParameterIndices,
        terms=[];
      for(let j=0;j<values.length;j++){
        const scale=d(values[j]);if(scale===this.zero)continue;const direction=at.indexOf(j);
        if(direction<0)fail('A frozen reference band, palette or label is not differentiated as a continuous parameter.','UNSUPPORTED');
        const next=[...orders];next[direction]++;
        const value=op==='m3_aux_expression_partial'?this.expressionValue(system,values,next):
          op==='m3_aux_indexed_partial'?this.periodicIndexedValue(system,values,next):this.auxiliaryInverseValue(system,values,next);
        terms.push(this.mul(scale,value));
      }
      out=this.add(...terms);
    }else if(op==='add')out=this.add(...args.map(d));
    else if(op==='multiply')out=this.add(this.mul(d(args[0]),args[1]),this.mul(args[0],d(args[1])));
    else if(op==='inverse')out=this.neg(this.mul(d(args[0]),this.pow(id,2)));
    else if(op==='integer_power')out=this.mul(this.q(args[1]),this.pow(args[0],args[1]-1),d(args[0]));
    else if(op==='exp')out=this.mul(id,d(args[0]));
    else if(op==='log_positive')out=this.div(d(args[0]),args[0]);
    else if(op==='sqrt_positive')out=this.div(d(args[0]),this.mul(this.q(2),id));
    else if(op==='sine')out=this.mul(this.cosine(args[0]),d(args[0]));
    else if(op==='cosine')out=this.neg(this.mul(this.sine(args[0]),d(args[0])));
    else if(op==='source_step_derivative')out=this.mul(this.step(args[0],args[1]+1),d(args[0]));
    else if(op==='smooth_piecewise')out=this.choose(args[0],args[1],args[2],...args.slice(3).map(d));
    else if(op==='definite_integral'){
      const [body,bound,left,right]=args,dl=d(left),dr=d(right);
      out=this.add(bound===variable?this.zero:this.integral(this.derivative(body,variable),bound,left,right),
        dr===this.zero?this.zero:this.mul(this.substitute(body,bound,right),dr),
        dl===this.zero?this.zero:this.neg(this.mul(this.substitute(body,bound,left),dl)));
    }else fail('No auxiliary derivative rule for '+op+'.','UNSUPPORTED');
    p.derivatives.set(key,out);return out;
  }
  checkOrders(orders,length){
    if(!Array.isArray(orders)||orders.length!==length||orders.some(x=>!Number.isSafeInteger(x)||x<0)||sum(orders)>this.maximumAuxiliaryOrder)
      fail('The declared finite auxiliary derivative budget is exhausted; an omitted derivative is never zero.','RESOURCE_LIMIT');
  }
  defineExpressionFunction({name,parameters,body,derivativeLimits}={}){
    const p=data.get(this);derivativeLimits??=parameters?.map(()=>p.maximumOrder);
    if(!Array.isArray(parameters)||!parameters.length||new Set(parameters).size!==parameters.length||parameters.some(x=>this.nodes[x]?.op!=='coordinate')||
      !this.nodes[body]||!Array.isArray(derivativeLimits)||derivativeLimits.length!==parameters.length||
      derivativeLimits.some(x=>!Number.isSafeInteger(x)||x<0||x>p.maximumOrder)||[...this.freeCoordinates(body)].some(x=>!parameters.includes(x)))
      fail('A shared auxiliary expression needs its actual body, every free coordinate and finite derivative limits.','INVALID_INPUT');
    const id=-1-p.expressions.length;
    p.expressions.push(freeze({name,parameters:[...parameters],body,derivativeLimits:[...derivativeLimits],actualDefiningBodyRetained:true,sourceAuthenticated:false}));return id;
  }
  expressionSystem(id){
    const p=data.get(this),definition=id>=0?p.base.expressionSystems[id]:p.expressions[-1-id];
    if(!definition)fail('Unknown actual shared expression definition.');return definition;
  }
  expressionValue(id,values,orders=null){
    if(id>=0)return this.baseGraph.expressionValue(id,values,orders);
    const s=this.expressionSystem(id);orders??=s.parameters.map(()=>0);this.checkOrders(orders,s.parameters.length);
    if(!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!this.nodes[x])||orders.some((n,j)=>n>s.derivativeLimits[j]))
      fail('Use the complete actual shared argument tuple and supported derivative.','RESOURCE_LIMIT');
    return this.node('m3_aux_expression_partial',[id,[...values],[...orders]]);
  }
  share(body,parameters,name){const id=this.defineExpressionFunction({name,parameters,body});return this.expressionValue(id,parameters);}
  materializeExpressionFunction(id,values,orders=null){
    if(id>=0)return this.baseGraph.materializeExpressionFunction(id,values,orders);
    const p=data.get(this),s=this.expressionSystem(id),node=this.expressionValue(id,values,orders),actualOrders=this.nodes[node].args[2];
    if(p.materializedExpressions.has(node))return p.materializedExpressions.get(node);
    let body=s.body;actualOrders.forEach((n,j)=>{for(let k=0;k<n;k++)body=this.derivative(body,s.parameters[j]);});
    const result=this.simultaneousSubstitute(body,s.parameters,values);p.materializedExpressions.set(node,result);return result;
  }
  definePeriodicIndexedField(input){
    const p=data.get(this),allowed=['name','parameters','directions','rows','sourceRecipe'];
    if(!input||Object.keys(input).some(k=>!allowed.includes(k))||!Array.isArray(input.parameters)||
      new Set(input.parameters).size!==input.parameters.length||input.parameters.some(x=>this.nodes[x]?.op!=='coordinate')||
      !Array.isArray(input.directions)||input.directions.length<2||input.directions.length>6||
      new Set(input.directions).size!==input.directions.length||input.directions.some(x=>!input.parameters.includes(x))||
      !Array.isArray(input.rows)||!input.rows.length)fail('An auxiliary indexed field needs a complete finite cover and explicit independent directions.','INVALID_INPUT');
    const rows=input.rows.map(row=>{
      const s=this.expressionSystem(row.localSystem);
      if(Object.keys(row).some(k=>!['localSystem','values','derivativeMaps','coefficient','guards','label'].includes(k))||
        !Array.isArray(row.values)||row.values.length!==s.parameters.length||
        !Array.isArray(row.derivativeMaps)||row.derivativeMaps.length!==input.directions.length||
        row.derivativeMaps.some(map=>!Array.isArray(map)||map.some(x=>!Number.isSafeInteger(x.parameter)||x.parameter<0||x.parameter>=s.parameters.length||!this.nodes[x.coefficient]))||
        [...row.values,row.coefficient,...row.derivativeMaps.flat().map(x=>x.coefficient),...(row.guards??[]).flat()].some(x=>!this.nodes[x]||[...this.freeCoordinates(x)].some(y=>!input.parameters.includes(y))))
        fail('Each torus cover row must retain its actual body, entire argument tuple and every constant chart derivative coefficient.','INVALID_INPUT');
      return {...structuredClone(row),guards:structuredClone(row.guards??[]),localBody:s.body,localParameters:[...s.parameters]};
    });
    const id=p.fields.length;p.fields.push(freeze({name:input.name,parameters:[...input.parameters],directions:[...input.directions],
      directionParameterIndices:input.directions.map(x=>input.parameters.indexOf(x)),rows,sourceRecipe:structuredClone(input.sourceRecipe??{}),
      derivativeRule:'Differentiate each fixed-label compact local body before its affine torus/physical-coordinate map; then reindex the entire cover.',
      requiredSourcePremises:['Every omitted label vanishes locally.','All changing-label and torus-copy joins are flat.',
        'Every displayed Jacobian and normalization is constant when the original physical labels are fixed.'],sourceAuthenticated:false}));return id;
  }
  periodicIndexedSystem(id){const s=data.get(this).fields[id];if(!s)fail('Unknown privately defined common-torus field.');return s;}
  periodicIndexedValue(id,values,orders=null){
    const s=this.periodicIndexedSystem(id);orders??=s.directions.map(()=>0);this.checkOrders(orders,s.directions.length);
    if(!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!this.nodes[x]))fail('A common-torus field needs its entire reference argument tuple.','INVALID_INPUT');
    return this.node('m3_aux_indexed_partial',[id,[...values],[...orders]]);
  }
  materializePeriodicIndexedField(id,orders=null){
    const p=data.get(this),s=this.periodicIndexedSystem(id);orders??=s.directions.map(()=>0);this.checkOrders(orders,s.directions.length);
    const key=id+':'+orders.join(',');if(p.materializedFields.has(key))return p.materializedFields.get(key);
    const localBodies=new Map(),terms=s.rows.map((row,index)=>{
      let expansion=new Map([[row.localParameters.map(()=>0).join(','),this.one]]);
      orders.forEach((n,j)=>{for(let k=0;k<n;k++){
        const next=new Map();for(const [old,coefficient]of expansion)for(const derivative of row.derivativeMaps[j]){
          const alpha=old.split(',').map(Number);alpha[derivative.parameter]++;const key=alpha.join(','),value=this.mul(coefficient,derivative.coefficient);
          next.set(key,this.add(next.get(key)??this.zero,value));
        }expansion=next;
      }});
      const derivatives=[...expansion].map(([ordersText,coefficient])=>{
        const localOrders=ordersText.split(',').map(Number),cacheKey=row.localSystem+':'+ordersText;
        if(!localBodies.has(cacheKey))localBodies.set(cacheKey,{system:row.localSystem,orders:localOrders,
          body:this.materializeExpressionFunction(row.localSystem,row.localParameters,localOrders),actualBodyDifferentiatedBeforeMapping:true});
        const value=this.expressionValue(row.localSystem,row.values,localOrders);return {orders:localOrders,coefficient,value};
      }),unguarded=this.mul(row.coefficient,this.add(...derivatives.map(d=>this.mul(d.coefficient,d.value)))),guards=[];
      let value=unguarded;for(const [coordinate,left,right]of row.guards){const body=value;value=this.choose(coordinate,left,right,this.zero,body,this.zero);guards.push({coordinate,left,right,body,value});}
      return {row:index,label:row.label,derivatives,unguarded,guards,value};
    }),result=freeze({field:id,orders:[...orders],parameters:s.parameters,body:this.add(...terms.map(x=>x.value)),terms,localBodies:[...localBodies.values()],
      completeDeclaredRowCount:s.rows.length,allDeclaredRowsRetained:terms.length===s.rows.length,labelsDifferentiated:false,torusNearestCopyDifferentiated:false,
      finiteBodyReplacesAnInfiniteSpatialMesh:false,sourceAuthenticated:false});
    p.materializedFields.set(key,result);return result;
  }
  /** The exact operation is the unique zero-Haar-mean Fourier solution.
   * Its finite coefficient and original sqrt2-divisor/tail producers live
   * in source-auxiliary-fourier.mjs. The enclosing source constructor must
   * execute those producers and authenticate smooth torus periodicity.
   */
  defineAuxiliaryInverse({name,body,Y,parameters,directions}={}){
    const p=data.get(this);
    if(!this.nodes[body]||!Array.isArray(Y)||Y.length!==2||new Set(Y).size!==2||Y.some(x=>this.nodes[x]?.op!=='coordinate')||
      !Array.isArray(parameters)||new Set(parameters).size!==parameters.length||parameters.some(x=>this.nodes[x]?.op!=='coordinate')||Y.some(x=>!parameters.includes(x))||
      !Array.isArray(directions)||new Set(directions).size!==directions.length||directions.some(x=>!parameters.includes(x))||Y.some(x=>!directions.includes(x))||
      [...this.freeCoordinates(body)].some(x=>!parameters.includes(x)))fail('An exact temporal inverse requires its whole actual periodic body and complete coordinates.','INVALID_INPUT');
    const id=p.inverses.length;p.inverses.push(freeze({name,body,Y:[...Y],parameters:[...parameters],directions:[...directions],
      directionParameterIndices:directions.map(x=>parameters.indexOf(x)),
      operator:'(sqrt(2)-1)*partial_y0+partial_y1',zeroMode:'The exact normalized Haar mean is projected out.',
      coefficientProducer:'source-auxiliary-fourier.mjs:actualFourierCoefficient',
      partialSumProducer:'source-auxiliary-fourier.mjs:finiteAuxiliaryInverse',tailProducer:'source-auxiliary-fourier.mjs:auxiliaryInverseTail',
      definition:'Limit of the source Fourier coefficient partial sums divided by the fixed exact nonzero original Diophantine divisors.',
      finiteSumDeclaredEqualToLimit:false,sourceAuthenticated:false}));return id;
  }
  auxiliaryInverseSystem(id){const s=data.get(this).inverses[id];if(!s)fail('Unknown exact auxiliary inverse definition.');return s;}
  auxiliaryInverseValue(id,values,orders=null){
    const s=this.auxiliaryInverseSystem(id);orders??=s.directions.map(()=>0);this.checkOrders(orders,s.directions.length);
    if(!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!this.nodes[x]))fail('An exact inverse partial needs its complete actual arguments.','INVALID_INPUT');
    return this.node('m3_aux_inverse_partial',[id,[...values],[...orders]]);
  }
  captureFunctionDefinitions(){
    const p=data.get(this);return {base:p.base.captureFunctionDefinitions(),expressions:p.expressions.length,fields:p.fields.length,inverses:p.inverses.length,
      expressionDefinitions:canonicalStringify(p.expressions),fieldDefinitions:canonicalStringify(p.fields),inverseDefinitions:canonicalStringify(p.inverses),maximumOrder:p.maximumOrder};
  }
  functionDefinitionsUnchanged(snapshot){
    const p=data.get(this);return snapshot.maximumOrder===p.maximumOrder&&p.base.functionDefinitionsUnchanged(snapshot.base)&&
      snapshot.expressionDefinitions===canonicalStringify(p.expressions.slice(0,snapshot.expressions))&&
      snapshot.fieldDefinitions===canonicalStringify(p.fields.slice(0,snapshot.fields))&&
      snapshot.inverseDefinitions===canonicalStringify(p.inverses.slice(0,snapshot.inverses));
  }
  auxiliaryKernelDefinitions(){
    const p=data.get(this);return structuredClone({expressions:p.expressions,fields:p.fields,inverses:p.inverses,maximumOrder:p.maximumOrder,
      separateFromOriginalSourceSeals:true,originalBaseGraphObjectReplaced:false,sourceAuthenticated:false});
  }
}

export function assertAuxiliaryFacade(G,base){
  if(!data.has(G)||data.get(G).base!==base||owners.get(base)!==G)fail('Use this source graph\'s own additive auxiliary calculus.');return true;
}

/** Expand every newly requested finite derivative at its actual defining
 * arguments, then let the unchanged original source kernel materialize
 * every underlying source function and pulse variational system. A new
 * Fourier limit stays a limit and requires its separately generated tail.
 */
export function materializeAuxiliarySourceClosure(G,roots,{maxExpressions=60000,onProgress}={}){
  assertAuxiliaryFacade(G,G.baseGraph);
  if(!Array.isArray(roots)||roots.some(x=>!G.nodes[x])||!Number.isSafeInteger(maxExpressions)||maxExpressions<1||maxExpressions>100000)
    fail('Declare existing source roots and a finite complete derivative closure budget.','INVALID_INPUT');
  const stack=[...roots],visited=new Set(),baseRoots=new Set(),expressions=new Map(),fields=new Map(),inverses=new Map();
  while(stack.length){
    G.checkCancelled?.();const id=stack.pop();if(visited.has(id))continue;visited.add(id);
    if(!G.extended(id)){baseRoots.add(id);continue;}
    const {op,args}=G.nodes[id];let next;
    if(op==='m3_aux_expression_partial'){
      const [system,values,orders]=args,key=system+':'+orders.join(',');let row=expressions.get(key);
      if(!row){
        if(expressions.size+fields.size>=maxExpressions)fail('The complete auxiliary source derivative closure exceeded its declared budget.','RESOURCE_LIMIT');
        const s=G.expressionSystem(system),body=G.materializeExpressionFunction(system,s.parameters,orders);
        row={system,orders:[...orders],parameters:[...s.parameters],body,applicationsChecked:0,actualBodyGenerated:true};expressions.set(key,row);
      }
      row.applicationsChecked++;next=[...values,row.body];
    }else if(op==='m3_aux_indexed_partial'){
      const [system,values,orders]=args,key=system+':'+orders.join(',');let row=fields.get(key);
      if(!row){
        if(expressions.size+fields.size>=maxExpressions)fail('The complete auxiliary source derivative closure exceeded its declared budget.','RESOURCE_LIMIT');
        row=G.materializePeriodicIndexedField(system,orders);fields.set(key,row);
        onProgress?.({stage:'global-source-common-torus-indexed-derivative',field:system,orders,rows:row.terms.length,nodeCount:G.nodes.length});
      }
      next=[...values,row.body,...row.localBodies.map(x=>x.body)];
    }else if(op==='m3_aux_inverse_partial'){
      const [system,values,orders]=args,key=system+':'+orders.join(','),s=G.auxiliaryInverseSystem(system);
      if(!inverses.has(key))inverses.set(key,{system,orders:[...orders],body:s.body,parameters:s.parameters,Y:s.Y,
        exactInfiniteLimitRetained:true,finiteTailProducer:s.tailProducer,sourceTailMustBeExecutedSeparately:true});
      next=[...values,s.body];
    }else next=children(G.nodes[id]);
    stack.push(...next);
  }
  onProgress?.({stage:'global-source-common-torus-base-derivative-closure',newExpressions:expressions.size,newIndexed:fields.size,baseRoots:baseRoots.size,nodeCount:G.nodes.length});
  const baseClosure=materializeGlobalSourceClosure(G.baseGraph,[...baseRoots],{maxExpressions,onProgress});
  return {schema:'MathScope.N6.ActualAuxiliaryDerivativeClosure/1',roots:[...roots],visitedNodes:visited.size,
    expressions:[...expressions.values()],indexedPartials:[...fields.values()].map(row=>({field:row.field,orders:row.orders,body:row.body,
      rows:row.terms.length,localBodies:row.localBodies,allDeclaredRowsRetained:row.allDeclaredRowsRetained,
      labelsDifferentiated:row.labelsDifferentiated,torusNearestCopyDifferentiated:row.torusNearestCopyDifferentiated})),
    exactInversePartials:[...inverses.values()],baseClosure,allRequestedSharedBodiesMaterialized:true,
    allDeclaredCoverRowsRetained:[...fields.values()].every(row=>row.allDeclaredRowsRetained),
    exactFourierLimitsRequireTheirActualTail:inverses.size>0,numericalValuesOrEnclosures:false,
    finiteApproximationsReplacedInfiniteSolutions:false,allOrderSourceClassBoundClaimed:false,sourceAuthenticated:false};
}
