/** Additive joint calculus for a complete source current after angular and
 * auxiliary corrections have both been applied. The original auxiliary
 * graph and its captured definitions remain unchanged. New indexed bodies
 * live in their own namespace and may contain exact forced solutions.
 *
 * One forced facade has this dispatcher as its base. Its opaque coefficient
 * wrappers route every mixed defining-body derivative back through this
 * dispatcher; a second forced owner is never stacked on the same graph.
 */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {assertAuxiliaryFacade} from './source-auxiliary-expressions.mjs';
import {ForcedPulseExpressions,assertForcedPulseFacade,forcedAngularInverse} from './source-forced-pulse.mjs';

const data=new WeakMap(),owners=new WeakMap(),fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});};
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const degree=a=>a.reduce((s,n)=>s+n,0),primitive=new Set(['rational','source_parameter','coordinate']),
  unary=new Set(['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling']),
  ownOps=new Set(['m3_coupled_expression_partial','m3_coupled_indexed_partial','m3_coupled_inverse_partial']),
  auxiliaryOps=new Set(['m3_aux_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial']),
  forcedOps=new Set(['m3_forced_expression_partial','m3_forced_pulse_partial']);
const isRoot=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x],ownId=(id,kind)=>typeof id==='string'&&id.startsWith('coupled-'+kind+':');
const idIndex=id=>Number(id.slice(id.indexOf(':')+1));

export function coupledExpressionChildren({op,args}){
  if(primitive.has(op))return [];
  if(unary.has(op)||op==='integer_power'||op==='source_step_derivative')return [args[0]];
  if(op==='definite_integral')return [args[0],args[2],args[3]];
  if(op==='m3_forced_pulse_partial')return [args[3],...args[4]];
  if(ownOps.has(op)||auxiliaryOps.has(op)||op==='m3_forced_expression_partial'||op==='actual_expression_partial'||op==='m3_global_indexed_partial')return args[1];
  if(op==='m3_global_pulse_jet'||op==='actual_covariance_volterra')return [args[2],...args[3]];
  return args.filter(x=>Number.isSafeInteger(x));
}

export class SourceCoupledExpressions{
  constructor(base,{maximumOrder=16,maximumTerms=8}={}){
    if(data.has(base))return base;if(owners.has(base))return owners.get(base);
    assertAuxiliaryFacade(base,base.baseGraph);
    if(!Number.isSafeInteger(maximumOrder)||maximumOrder<6||maximumOrder>32||!Number.isSafeInteger(maximumTerms)||maximumTerms<1||maximumTerms>12)
      fail('Declare finite joint derivative and retained-series budgets.','RESOURCE_LIMIT');
    if(base.nodes.some(n=>ownOps.has(n.op)||forcedOps.has(n.op)))
      fail('Attach the joint calculus before any forced owner or coupled namespace has been appended to this original auxiliary graph.');
    const proxy=new Proxy(this,{get(target,key,receiver){
      if(Reflect.has(target,key))return Reflect.get(target,key,receiver);
      const value=base[key];return typeof value==='function'?value.bind(base):value;
    }}),p={base,initialCount:base.nodes.length,maximumOrder,maximumTerms,expressions:[],fields:[],inverses:[],
      extension:new Map(),free:new Map(),derivatives:new Map(),substitutions:new Map(),materializedExpressions:new Map(),programs:new Map(),forced:null};
    data.set(proxy,p);owners.set(base,proxy);
    p.forced=new ForcedPulseExpressions(proxy,{maximumOrder,maximumTerms});return proxy;
  }
  get baseGraph(){return data.get(this).base;}
  get forcedGraph(){return data.get(this).forced;}
  get maximumCoupledOrder(){return data.get(this).maximumOrder;}
  extended(id){
    const p=data.get(this),n=this.nodes[id];if(!n)fail('A coupled scalar expression lost an operand.');
    if(id<p.initialCount)return false;if(p.extension.has(id))return p.extension.get(id);
    const result=ownOps.has(n.op)||forcedOps.has(n.op)||coupledExpressionChildren(n).some(x=>this.extended(x));
    p.extension.set(id,result);return result;
  }
  freeCoordinates(id){
    const p=data.get(this);if(!this.extended(id))return p.base.freeCoordinates(id);if(p.free.has(id))return p.free.get(id);
    const n=this.nodes[id],out=new Set();
    if(n.op==='coordinate')out.add(id);
    else if(n.op==='definite_integral'){
      for(const x of this.freeCoordinates(n.args[0]))if(x!==n.args[1])out.add(x);
      for(const j of [2,3])for(const x of this.freeCoordinates(n.args[j]))out.add(x);
    }else for(const child of coupledExpressionChildren(n))for(const x of this.freeCoordinates(child))out.add(x);
    p.free.set(id,out);return out;
  }
  dependsOn(id,variable){return this.freeCoordinates(id).has(variable);}
  simultaneousSubstitute(body,variables,values){
    if(!Array.isArray(variables)||!Array.isArray(values)||variables.length!==values.length||new Set(variables).size!==variables.length)
      fail('A joint application requires a complete simultaneous argument tuple.','INVALID_INPUT');
    if(variables.every((x,j)=>x===values[j]))return body;
    const fresh=variables.map(()=>this.fresh('coupled_capture_free'));
    variables.forEach((x,j)=>{body=this.substitute(body,x,fresh[j]);});
    fresh.forEach((x,j)=>{body=this.substitute(body,x,values[j]);});return body;
  }
  integral(body,variable,left,right){
    if(body===this.zero||left===right)return this.zero;
    if(this.nodes[variable]?.op!=='coordinate')fail('A joint integral binds an actual independent coordinate.','INVALID_INPUT');
    if(!this.extended(body)&&!this.extended(left)&&!this.extended(right))return this.baseGraph.integral(body,variable,left,right);
    if(!this.dependsOn(body,variable))return this.mul(body,this.sub(right,left));
    return this.node('definite_integral',[body,variable,left,right]);
  }
  substitute(id,variable,value){
    if(id===variable)return value;
    if(this.nodes[variable]?.op==='coordinate'&&!this.dependsOn(id,variable))return id;
    const p=data.get(this);if(!this.extended(id)&&!this.extended(value))return p.base.substitute(id,variable,value);
    const key=[id,variable,value].join(':');if(p.substitutions.has(key))return p.substitutions.get(key);
    const {op,args}=this.nodes[id],at=x=>this.substitute(x,variable,value);let out=id;
    if(primitive.has(op))return id;
    if(op==='m3_forced_pulse_partial')out=p.forced.forcedPulseValue(args[0],args[1],args[2],at(args[3]),args[4].map(at),args[5]);
    else if(['m3_coupled_expression_partial','m3_aux_expression_partial','m3_forced_expression_partial','actual_expression_partial'].includes(op))
      out=this.expressionValue(args[0],args[1].map(at),args[2]);
    else if(op==='m3_coupled_indexed_partial'||op==='m3_aux_indexed_partial')out=this.periodicIndexedValue(args[0],args[1].map(at),args[2]);
    else if(op==='m3_coupled_inverse_partial'||op==='m3_aux_inverse_partial')out=this.auxiliaryInverseValue(args[0],args[1].map(at),args[2]);
    else if(op==='m3_global_pulse_jet')out=p.base.baseGraph.globalPulseJetValue(args[0],args[1],at(args[2]),args[3].map(at),args[4]);
    else if(op==='actual_covariance_volterra')out=p.base.baseGraph.covarianceValue(args[0],args[1],at(args[2]),args[3].map(at));
    else if(op==='m3_global_indexed_partial')out=p.base.baseGraph.globalIndexedValue(args[0],args[1].map(at),args[2]);
    else if(op==='add')out=this.add(...args.map(at));
    else if(op==='multiply'){const a=at(args[0]);out=a===this.zero?this.zero:this.mul(a,at(args[1]));}
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
          const fresh=this.fresh('coupled_alpha_renamed_integral');body=this.substitute(body,bound,fresh);bound=fresh;
        }body=this.substitute(body,variable,value);
      }out=this.integral(body,bound,left,right);
    }else if(!this.extended(id))out=p.base.substitute(id,variable,value);
    else fail('No joint substitution rule for '+op+'.','UNSUPPORTED');
    p.substitutions.set(key,out);return out;
  }
  derivative(id,variable){
    const p=data.get(this);if(!this.extended(id))return p.base.derivative(id,variable);
    const key=id+':'+variable;if(p.derivatives.has(key))return p.derivatives.get(key);
    if(!this.dependsOn(id,variable))return this.zero;
    const {op,args}=this.nodes[id],d=x=>this.derivative(x,variable);let out=this.zero;
    if(op==='m3_forced_pulse_partial'){
      const [system,part,component,time,values,orders]=args,s=p.forced.forcedPulseSystem(system),terms=[],dt=d(time);
      if(dt!==this.zero)terms.push(this.mul(dt,p.forced.forcedPulseRhs(system,part,component,time,values,orders)));
      for(let j=0;j<values.length;j++){
        const scale=d(values[j]);if(scale===this.zero)continue;const direction=s.directionParameterIndices.indexOf(j);
        if(direction<0)fail('A fixed source label is not a smooth joint direction.','UNSUPPORTED');
        const next=[...orders];next[direction]++;terms.push(this.mul(scale,p.forced.forcedPulseValue(system,part,component,time,values,next)));
      }out=this.add(...terms);
    }else if(ownOps.has(op)||auxiliaryOps.has(op)||op==='m3_forced_expression_partial'||op==='actual_expression_partial'){
      const [system,values,orders]=args,isExpression=op.endsWith('expression_partial'),isIndexed=op.endsWith('indexed_partial'),
        s=isExpression?this.expressionSystem(system):isIndexed?this.periodicIndexedSystem(system):this.auxiliaryInverseSystem(system),
        indices=isExpression?s.parameters.map((_,j)=>j):s.directionParameterIndices,terms=[];
      for(let j=0;j<values.length;j++){
        const scale=d(values[j]);if(scale===this.zero)continue;const direction=indices.indexOf(j);
        if(direction<0)fail('An original fixed band, palette or label is not differentiated as a continuous joint parameter.','UNSUPPORTED');
        const next=[...orders];next[direction]++;
        const value=isExpression?this.expressionValue(system,values,next):isIndexed?this.periodicIndexedValue(system,values,next):this.auxiliaryInverseValue(system,values,next);
        terms.push(this.mul(scale,value));
      }out=this.add(...terms);
    }else if(op==='m3_global_pulse_jet'||op==='actual_covariance_volterra'||op==='m3_global_indexed_partial'){
      // Differentiate the original operator at its own coordinates, then
      // apply its full chain rule in the joint graph. This keeps the old
      // private coefficient system and never asks its walker to recurse
      // through a newly introduced forced/Fourier argument.
      const B=p.base.baseGraph,indexed=op==='m3_global_indexed_partial',
        s=indexed?B.globalIndexedSystem(args[0]):op==='m3_global_pulse_jet'?B.globalPulseSystem(args[0]):B.covarianceSystems[args[0]];
      if(!s)fail('A mixed application lost its original source operator.');
      const parameters=indexed?s.parameters:[s.variable,...s.parameters],values=indexed?args[1]:[args[2],...args[3]],
        canonical=indexed?B.globalIndexedValue(args[0],s.parameters,args[2]):op==='m3_global_pulse_jet'?
          B.globalPulseJetValue(args[0],args[1],s.variable,s.parameters,args[4]):B.covarianceValue(args[0],args[1],s.variable,s.parameters),terms=[];
      for(let j=0;j<values.length;j++){
        const coefficient=d(values[j]);if(coefficient===this.zero)continue;
        const ownDerivative=B.derivative(canonical,parameters[j]);
        terms.push(this.mul(coefficient,this.simultaneousSubstitute(ownDerivative,parameters,values)));
      }out=this.add(...terms);
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
    }else fail('No joint derivative rule for '+op+'.','UNSUPPORTED');
    p.derivatives.set(key,out);return out;
  }
  checkOrders(orders,length){
    if(!Array.isArray(orders)||orders.length!==length||orders.some(n=>!Number.isSafeInteger(n)||n<0)||degree(orders)>this.maximumCoupledOrder)
      fail('The declared finite joint derivative budget is exhausted; no omitted derivative is zero.','RESOURCE_LIMIT');
  }
  checkRetainedOperands(roots){
    const p=data.get(this),stack=[...roots],seen=new Set();
    while(stack.length){
      const id=stack.pop();if(seen.has(id)||id<p.initialCount)continue;seen.add(id);
      const n=this.nodes[id];if(!n)fail('A retained mixed defining body has an invalid operand.');
      if(n.op==='m3_coupled_expression_partial'||n.op==='m3_forced_expression_partial')this.expressionSystem(n.args[0]);
      else if(n.op==='m3_coupled_indexed_partial')this.periodicIndexedSystem(n.args[0]);
      else if(n.op==='m3_coupled_inverse_partial')this.auxiliaryInverseSystem(n.args[0]);
      else if(n.op==='m3_forced_pulse_partial')p.forced.forcedPulseSystem(n.args[0]);
      stack.push(...coupledExpressionChildren(n));
    }return true;
  }
  defineExpressionFunction({name,parameters,body,derivativeLimits}={}){
    const p=data.get(this);derivativeLimits??=parameters?.map(()=>p.maximumOrder);
    if(!Array.isArray(parameters)||new Set(parameters).size!==parameters.length||parameters.some(x=>this.nodes[x]?.op!=='coordinate')||!isRoot(this,body)||
      !Array.isArray(derivativeLimits)||derivativeLimits.length!==parameters.length||derivativeLimits.some(n=>!Number.isSafeInteger(n)||n<0||n>p.maximumOrder)||
      [...this.freeCoordinates(body)].some(x=>!parameters.includes(x)))fail('A joint shared expression needs its whole actual body and complete coordinates.','INVALID_INPUT');
    this.checkRetainedOperands([body]);
    const id='coupled-expression:'+p.expressions.length;
    p.expressions.push(freeze({id,name,parameters:[...parameters],body,derivativeLimits:[...derivativeLimits],sourceAuthenticated:false}));return id;
  }
  expressionSystem(id){
    const p=data.get(this);if(ownId(id,'expression')){const s=p.expressions[idIndex(id)];if(!s||s.id!==id)fail('Unknown joint defining body.');return s;}
    if(typeof id==='string'&&id.startsWith('forced-expression:'))return p.forced.expressionSystem(id);
    return p.base.expressionSystem(id);
  }
  expressionValue(id,values,orders=null){
    const p=data.get(this);if(!ownId(id,'expression')){
      if(typeof id==='string'&&id.startsWith('forced-expression:'))return p.forced.expressionValue(id,values,orders);
      return p.base.expressionValue(id,values,orders);
    }
    const s=this.expressionSystem(id);orders??=s.parameters.map(()=>0);this.checkOrders(orders,s.parameters.length);
    if(!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!isRoot(this,x))||orders.some((n,j)=>n>s.derivativeLimits[j]))
      fail('Use a complete joint argument tuple within its derivative budget.','RESOURCE_LIMIT');
    return this.node('m3_coupled_expression_partial',[id,[...values],[...orders]]);
  }
  materializeExpressionFunction(id,values,orders=null){
    const p=data.get(this),s=this.expressionSystem(id),node=this.expressionValue(id,values,orders),alpha=this.nodes[node].args[2];
    if(p.materializedExpressions.has(node))return p.materializedExpressions.get(node);
    let body=s.body;alpha.forEach((n,j)=>{for(let k=0;k<n;k++)body=this.derivative(body,s.parameters[j]);});
    body=this.simultaneousSubstitute(body,s.parameters,values);p.materializedExpressions.set(node,body);return body;
  }
  share(body,parameters,name){return this.expressionValue(this.defineExpressionFunction({name,parameters,body}),parameters);}
  definePeriodicIndexedField(input){
    const p=data.get(this),allowed=['name','parameters','directions','rows','sourceRecipe'];
    if(!input||Object.keys(input).some(k=>!allowed.includes(k))||!Array.isArray(input.parameters)||new Set(input.parameters).size!==input.parameters.length||
      input.parameters.some(x=>this.nodes[x]?.op!=='coordinate')||!Array.isArray(input.directions)||input.directions.length<2||input.directions.length>6||
      new Set(input.directions).size!==input.directions.length||input.directions.some(x=>!input.parameters.includes(x))||!Array.isArray(input.rows)||!input.rows.length)
      fail('A joint indexed field needs every source row and all independent smooth directions.','INVALID_INPUT');
    const rows=input.rows.map(row=>{
      const s=this.expressionSystem(row.localSystem);
      if(Object.keys(row).some(k=>!['localSystem','values','derivativeMaps','coefficient','guards','label'].includes(k))||!Array.isArray(row.values)||row.values.length!==s.parameters.length||
        !Array.isArray(row.derivativeMaps)||row.derivativeMaps.length!==input.directions.length||row.derivativeMaps.some(map=>!Array.isArray(map)||map.some(x=>
          !Number.isSafeInteger(x.parameter)||x.parameter<0||x.parameter>=s.parameters.length||!isRoot(this,x.coefficient)))||
        [...row.values,row.coefficient,...row.derivativeMaps.flat().map(x=>x.coefficient),...(row.guards??[]).flat()].some(x=>!isRoot(this,x)||
          [...this.freeCoordinates(x)].some(y=>!input.parameters.includes(y))))fail('Retain each joint local body, full argument map, coefficient and outer source guards.','INVALID_INPUT');
      // All varying slow cutoffs and amplitudes belong INSIDE the body.
      // Only the original fixed-chart/normalization factors remain here.
      if([row.coefficient,...row.derivativeMaps.flat().map(x=>x.coefficient)].some(x=>input.directions.some(v=>this.dependsOn(x,v))))
        fail('A direction-dependent coefficient or chart map must remain inside the differentiated local body; its Leibniz terms cannot be omitted.','INVALID_INPUT');
      return {...structuredClone(row),guards:structuredClone(row.guards??[]),localBody:s.body,localParameters:[...s.parameters]};
    });
    const id='coupled-field:'+p.fields.length;
    p.fields.push(freeze({id,name:input.name,parameters:[...input.parameters],directions:[...input.directions],directionParameterIndices:input.directions.map(x=>input.parameters.indexOf(x)),
      rows,sourceRecipe:structuredClone(input.sourceRecipe??{}),constantChartFactorsChecked:true,
      requiredSourcePremises:['All omitted labels vanish locally.','Changing-label and nearest-copy joins are flat.',
        'The retained maps describe the actual fixed-label source coordinates.'],sourceAuthenticated:false}));return id;
  }
  periodicIndexedSystem(id){
    const p=data.get(this);if(!ownId(id,'field'))return p.base.periodicIndexedSystem(id);
    const s=p.fields[idIndex(id)];if(!s||s.id!==id)fail('Unknown joint all-label field.');return s;
  }
  periodicIndexedValue(id,values,orders=null){
    if(!ownId(id,'field'))return this.baseGraph.periodicIndexedValue(id,values,orders);
    const s=this.periodicIndexedSystem(id);orders??=s.directions.map(()=>0);this.checkOrders(orders,s.directions.length);
    if(!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!isRoot(this,x)))fail('A joint indexed value requires all original arguments.','INVALID_INPUT');
    return this.node('m3_coupled_indexed_partial',[id,[...values],[...orders]]);
  }
  commonTorusDerivativeProgram(id,orders=null){
    const p=data.get(this),s=this.periodicIndexedSystem(id);orders??=s.directions.map(()=>0);this.checkOrders(orders,s.directions.length);
    const key=id+':'+orders.join(',');if(p.programs.has(key))return p.programs.get(key);
    const localBodies=new Map(),operands=new Set(),terms=s.rows.map((row,index)=>{
      const definition=this.expressionSystem(row.localSystem);
      if(definition.body!==row.localBody||canonicalStringify(definition.parameters)!==canonicalStringify(row.localParameters))fail('An indexed mixed source lost its own defining coordinates.');
      let expansion=new Map([[row.localParameters.map(()=>0).join(','),this.one]]);
      orders.forEach((n,j)=>{for(let k=0;k<n;k++){
        const next=new Map();for(const [old,coefficient]of expansion)for(const derivative of row.derivativeMaps[j]){
          const alpha=old.split(',').map(Number);alpha[derivative.parameter]++;const key=alpha.join(','),value=this.mul(coefficient,derivative.coefficient);
          next.set(key,this.add(next.get(key)??this.zero,value));
        }expansion=next;
      }});
      const derivatives=[...expansion].map(([text,coefficient])=>{
        const localOrders=text.split(',').map(Number),key=row.localSystem+':'+text;
        if(!localBodies.has(key))localBodies.set(key,{system:row.localSystem,orders:localOrders,
          body:this.materializeExpressionFunction(row.localSystem,row.localParameters,localOrders),actualBodyDifferentiatedBeforeMapping:true});
        operands.add(coefficient);return {orders:localOrders,coefficient};
      });
      [...row.values,row.coefficient,...row.guards.flat()].forEach(x=>operands.add(x));
      return {row:index,label:row.label,localSystem:row.localSystem,values:row.values,coefficient:row.coefficient,guards:row.guards,derivatives};
    }),result=freeze({field:id,orders:[...orders],parameters:s.parameters,terms,localBodies:[...localBodies.values()],actualSourceOperands:[...operands],
      allDeclaredRowsRetained:terms.length===s.rows.length,labelsDifferentiated:false,torusNearestCopyDifferentiated:false,
      fullMixedLocalBodiesMaterialized:true,sourceAuthenticated:false});
    p.programs.set(key,result);return result;
  }
  materializePeriodicIndexedField(id,orders=null){
    const program=this.commonTorusDerivativeProgram(id,orders),terms=program.terms.map(row=>{
      const derivatives=row.derivatives.map(d=>({...d,value:this.expressionValue(row.localSystem,row.values,d.orders)})),
        unguarded=this.mul(row.coefficient,this.add(...derivatives.map(d=>this.mul(d.coefficient,d.value))));
      let value=unguarded;for(const [x,left,right]of row.guards)value=this.choose(x,left,right,this.zero,value,this.zero);
      return {...row,derivatives,unguarded,value};
    });return {...program,terms,body:this.add(...terms.map(x=>x.value))};
  }
  defineAuxiliaryInverse({name,body,Y,parameters,directions}={}){
    const p=data.get(this);
    if(!isRoot(this,body)||!Array.isArray(Y)||Y.length!==2||new Set(Y).size!==2||Y.some(x=>this.nodes[x]?.op!=='coordinate')||
      !Array.isArray(parameters)||new Set(parameters).size!==parameters.length||parameters.some(x=>this.nodes[x]?.op!=='coordinate')||Y.some(x=>!parameters.includes(x))||
      !Array.isArray(directions)||new Set(directions).size!==directions.length||directions.some(x=>!parameters.includes(x))||Y.some(x=>!directions.includes(x))||
      [...this.freeCoordinates(body)].some(x=>!parameters.includes(x)))fail('A mixed temporal inverse requires its whole actual periodic body and complete coordinates.','INVALID_INPUT');
    this.checkRetainedOperands([body]);
    const id='coupled-inverse:'+p.inverses.length;
    p.inverses.push(freeze({id,name,body,Y:[...Y],parameters:[...parameters],directions:[...directions],directionParameterIndices:directions.map(x=>parameters.indexOf(x)),
      operator:'(sqrt(2)-1)*partial_y0+partial_y1',zeroMode:'The exact normalized Haar mean is projected out.',
      coefficientProducer:'source-auxiliary-fourier.mjs:actualFourierCoefficient',partialSumProducer:'source-auxiliary-fourier.mjs:finiteAuxiliaryInverse',
      tailProducer:'source-auxiliary-fourier.mjs:auxiliaryInverseTail',finiteSumDeclaredEqualToLimit:false,sourceAuthenticated:false}));return id;
  }
  auxiliaryInverseSystem(id){
    const p=data.get(this);if(!ownId(id,'inverse'))return p.base.auxiliaryInverseSystem(id);
    const s=p.inverses[idIndex(id)];if(!s||s.id!==id)fail('Unknown joint exact Fourier limit.');return s;
  }
  auxiliaryInverseValue(id,values,orders=null){
    if(!ownId(id,'inverse'))return this.baseGraph.auxiliaryInverseValue(id,values,orders);
    const s=this.auxiliaryInverseSystem(id);orders??=s.directions.map(()=>0);this.checkOrders(orders,s.directions.length);
    if(!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!isRoot(this,x)))fail('A mixed inverse value needs its entire argument tuple.','INVALID_INPUT');
    return this.node('m3_coupled_inverse_partial',[id,[...values],[...orders]]);
  }
  captureFunctionDefinitions(){
    const p=data.get(this),forced=p.forced.forcedDefinitions();
    return {base:p.base.captureFunctionDefinitions(),maximumOrder:p.maximumOrder,maximumTerms:p.maximumTerms,
      counts:[p.expressions.length,p.fields.length,p.inverses.length,forced.systems.length,forced.expressions.length],
      definitions:canonicalStringify([p.expressions,p.fields,p.inverses,forced.systems,forced.expressions])};
  }
  functionDefinitionsUnchanged(snapshot){
    const p=data.get(this),f=p.forced.forcedDefinitions(),lists=[p.expressions,p.fields,p.inverses,f.systems,f.expressions];
    return snapshot.maximumOrder===p.maximumOrder&&snapshot.maximumTerms===p.maximumTerms&&p.base.functionDefinitionsUnchanged(snapshot.base)&&
      Array.isArray(snapshot.counts)&&snapshot.counts.length===5&&snapshot.definitions===canonicalStringify(lists.map((rows,j)=>rows.slice(0,snapshot.counts[j])));
  }
  coupledDefinitions(){
    const p=data.get(this);return structuredClone({expressions:p.expressions,fields:p.fields,inverses:p.inverses,
      maximumOrder:p.maximumOrder,maximumTerms:p.maximumTerms,singleRegisteredForcedOwner:true,originalAuxiliaryDefinitionsModified:false,sourceAuthenticated:false});
  }
}

export function assertSourceCoupledExpressions(G,base){
  const p=data.get(G);if(!p||p.base!==base||owners.get(base)!==G)fail('Use this actual auxiliary graph\'s own joint calculus.');
  assertAuxiliaryFacade(base,base.baseGraph);assertForcedPulseFacade(p.forced,G);return true;
}

/** Wrapping the complete coefficients is an exact retained-body operation.
 * It avoids feeding a foreign applied node into a frozen facade's internal
 * recursive walker. No value, coefficient, normal component or parameter is
 * changed. Every wrapper body is traversed by the joint source closure.
 */
export function coupledForcedAngularInverse(G,input){
  assertSourceCoupledExpressions(G,G.baseGraph);
  const parameters=[input.variable,...input.parameters],
    wrap=(body,name)=>body===G.zero?G.zero:G.share(body,parameters,'CoupledForced_'+name),
    forcing=input.forcing.map((z,j)=>({real:wrap(z.real,'source_'+j+'_real'),imaginary:wrap(z.imaginary,'source_'+j+'_imaginary')})),
    result=forcedAngularInverse(G,{...input,forcing});
  return {schema:'MathScope.N6.CoupledForcedAngularInverse/1',G,inverse:result,
    originalSource:structuredClone(input.forcing),wrappedSource:forcing,
    everyOriginalSourceBodyRetained:true,oneRegisteredForcedOwner:result.G===G.forcedGraph,
    sourceAuthenticated:false,allStagesConstructed:false,completeN6:false};
}
