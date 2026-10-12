/** Exact zero-data forced pulse calculus for original equations (7.5),
 * (7.13), (7.17), (7.20), and the principal cutoff identity (7.40).
 *
 * This generic kernel accepts complete scalar expression bodies. It never
 * treats a leading homogeneous covariance pulse as a forced solution.
 * Every exact limit retains its actual matrix and forcing, a producer for
 * ordered integral terms, and FTC/factorial bounds for each requested jet.
 * A private original-source assembly must authenticate the input bodies,
 * phase/path, nonvanishing normal, common domain, and support hypotheses.
 */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {actualPulseTimeFTCNorm} from '../../mathscope-m2/navier/actual-pulse-jet-source.mjs';
import {createFactoredRationalVerifier} from './forced-rational-identity.mjs';

const owners=new WeakMap(),data=new WeakMap(),inverseSeals=new WeakMap();
const fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});};
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),degree=a=>a.reduce((s,n)=>s+n,0),key=a=>a.join(',');
const factorial=n=>{let x=1n;for(let j=2;j<=n;j++)x*=BigInt(j);return x;};
const binomial=(a,b)=>a.reduce((x,n,j)=>x*factorial(n)/(factorial(b[j])*factorial(n-b[j])),1n);
const primitive=new Set(['rational','source_parameter','coordinate']);
const unary=new Set(['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling']);
const ownOps=new Set(['m3_forced_pulse_partial','m3_forced_expression_partial']);
const isRoot=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x];
const realParts=['real','imaginary'];
const complexRoots=z=>realParts.map(p=>z[p]);
const vectorRoots=z=>z.flatMap(complexRoots);
const complex=(G,real=G.zero,imaginary=G.zero)=>({real,imaginary});
const cadd=(G,...zs)=>complex(G,G.add(...zs.map(z=>z.real)),G.add(...zs.map(z=>z.imaginary)));
const cscale=(G,a,z)=>complex(G,G.mul(a,z.real),G.mul(a,z.imaginary));
const cconj=(G,z)=>complex(G,z.real,G.neg(z.imaginary));
const cdot=(G,a,z)=>cadd(G,...a.map((x,j)=>cscale(G,x,z[j])));
const dot=(G,a,b)=>G.add(...a.map((x,j)=>G.mul(x,b[j])));
const children=node=>{
  const {op,args}=node;
  if(primitive.has(op))return [];
  if(unary.has(op)||op==='integer_power'||op==='source_step_derivative')return [args[0]];
  if(op==='definite_integral')return [args[0],args[2],args[3]];
  if(op==='m3_forced_pulse_partial')return [args[3],...args[4]];
  if(op==='m3_forced_expression_partial'||op==='actual_expression_partial'||op==='m3_aux_expression_partial'||
    op==='m3_aux_indexed_partial'||op==='m3_aux_inverse_partial'||op==='m3_global_indexed_partial')return args[1];
  if(op==='actual_covariance_volterra'||op==='m3_global_pulse_jet')return [args[2],...args[3]];
  return args.filter(x=>Number.isSafeInteger(x));
};

export function forcedDownwardMultiIndices(alpha){
  if(!Array.isArray(alpha)||alpha.some(n=>!Number.isSafeInteger(n)||n<0))fail('Use a finite nonnegative multi-index.','INVALID_INPUT');
  const out=[],visit=(j,a)=>{if(j===alpha.length){out.push(a);return;}for(let n=0;n<=alpha[j];n++)visit(j+1,[...a,n]);};
  visit(0,[]);return out.sort((a,b)=>degree(a)-degree(b)||key(a).localeCompare(key(b)));
}

/** An append-only facade over the SAME scalar graph; existing operations
 * and private upstream seals remain owned by their original implementation.
 */
export class ForcedPulseExpressions{
  constructor(base,{maximumOrder=16,maximumTerms=8}={}){
    if(data.has(base))return base;if(owners.has(base))return owners.get(base);
    if(!base||!Array.isArray(base.nodes)||typeof base.derivative!=='function'||typeof base.freeCoordinates!=='function'||
      typeof base.captureFunctionDefinitions!=='function')fail('A forced pulse facade needs a retained exact scalar graph.');
    if(!Number.isSafeInteger(maximumOrder)||maximumOrder<2||maximumOrder>32||!Number.isSafeInteger(maximumTerms)||maximumTerms<1||maximumTerms>12)
      fail('Declare finite derivative and display-term budgets.','RESOURCE_LIMIT');
    const proxy=new Proxy(this,{get(target,k,receiver){
      if(Reflect.has(target,k))return Reflect.get(target,k,receiver);
      const x=base[k];return typeof x==='function'?x.bind(base):x;
    }});
    data.set(proxy,{base,initialCount:base.nodes.length,maximumOrder,maximumTerms,systems:[],expressions:[],
      extension:new Map(),free:new Map(),derivatives:new Map(),substitutions:new Map(),materializedExpressions:new Map(),
      coefficients:new Map(),blocks:new Map(),partialSums:new Map()});owners.set(base,proxy);return proxy;
  }
  get baseGraph(){return data.get(this).base;}
  get maximumForcedOrder(){return data.get(this).maximumOrder;}
  extended(id){
    const p=data.get(this),n=this.nodes[id];if(!n)fail('A forced scalar expression lost its operand.');
    if(id<p.initialCount)return false;if(p.extension.has(id))return p.extension.get(id);
    const yes=ownOps.has(n.op)||children(n).some(x=>this.extended(x));p.extension.set(id,yes);return yes;
  }
  freeCoordinates(id){
    const p=data.get(this);if(!this.extended(id))return p.base.freeCoordinates(id);if(p.free.has(id))return p.free.get(id);
    const n=this.nodes[id],out=new Set();
    if(n.op==='coordinate')out.add(id);
    else if(n.op==='definite_integral'){
      for(const x of this.freeCoordinates(n.args[0]))if(x!==n.args[1])out.add(x);
      for(const j of [2,3])for(const x of this.freeCoordinates(n.args[j]))out.add(x);
    }else for(const c of children(n))for(const x of this.freeCoordinates(c))out.add(x);
    p.free.set(id,out);return out;
  }
  dependsOn(id,variable){return this.freeCoordinates(id).has(variable);}
  simultaneousSubstitute(body,variables,values){
    if(variables.length!==values.length||new Set(variables).size!==variables.length)fail('Use a complete capture-free argument tuple.','INVALID_INPUT');
    if(variables.every((x,j)=>x===values[j]))return body;
    const temporary=variables.map(()=>this.fresh('forced_capture_free'));
    variables.forEach((x,j)=>{body=this.substitute(body,x,temporary[j]);});
    temporary.forEach((x,j)=>{body=this.substitute(body,x,values[j]);});return body;
  }
  integral(body,variable,left,right){
    if(body===this.zero||left===right)return this.zero;
    if(this.nodes[variable]?.op!=='coordinate')fail('A bound integration variable must be a coordinate.','INVALID_INPUT');
    if(!this.extended(body)&&!this.extended(left)&&!this.extended(right))return this.baseGraph.integral(body,variable,left,right);
    if(!this.dependsOn(body,variable))return this.mul(body,this.sub(right,left));
    return this.node('definite_integral',[body,variable,left,right]);
  }
  substitute(id,variable,value){
    if(id===variable)return value;const p=data.get(this);
    if(this.nodes[variable]?.op==='coordinate'&&!this.dependsOn(id,variable))return id;
    if(!this.extended(id)&&!this.extended(value))return p.base.substitute(id,variable,value);
    const cacheKey=[id,variable,value].join(':');if(p.substitutions.has(cacheKey))return p.substitutions.get(cacheKey);
    const {op,args}=this.nodes[id],at=x=>this.substitute(x,variable,value);let out=id;
    if(primitive.has(op))return id;
    if(op==='m3_forced_pulse_partial')out=this.forcedPulseValue(args[0],args[1],args[2],at(args[3]),args[4].map(at),args[5]);
    else if(op==='m3_forced_expression_partial')out=this.expressionValue(args[0],args[1].map(at),args[2]);
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
      if(x===left)out=at(args[3]);else if(x===right)out=at(args[5]);
      else if(this.isq(x)&&this.isq(left)&&this.isq(right)){
        const [xn,xd]=this.fraction(x),[ln,ld]=this.fraction(left),[rn,rd]=this.fraction(right);
        out=at(xn*ld<=ln*xd?args[3]:xn*rd>=rn*xd?args[5]:args[4]);
      }else out=this.choose(x,left,right,...args.slice(3).map(at));
    }else if(op==='definite_integral'){
      let [body,bound,left,right]=args;left=at(left);right=at(right);
      if(bound!==variable){
        if(this.dependsOn(value,bound)&&this.dependsOn(body,variable)){
          const fresh=this.fresh('forced_alpha_renamed_integral');body=this.substitute(body,bound,fresh);bound=fresh;
        }
        body=this.substitute(body,variable,value);
      }
      out=this.integral(body,bound,left,right);
    }else if(!this.extended(id))out=p.base.substitute(id,variable,value);
    else fail('No forced-pulse substitution rule for '+op+'.','UNSUPPORTED');
    p.substitutions.set(cacheKey,out);return out;
  }
  derivative(id,variable){
    const p=data.get(this);if(!this.extended(id))return p.base.derivative(id,variable);
    const cacheKey=id+':'+variable;if(p.derivatives.has(cacheKey))return p.derivatives.get(cacheKey);
    if(!this.dependsOn(id,variable))return this.zero;
    const {op,args}=this.nodes[id],d=x=>this.derivative(x,variable);let out=this.zero;
    if(op==='m3_forced_pulse_partial'){
      const [system,part,component,time,values,orders]=args,s=this.forcedPulseSystem(system),terms=[],dt=d(time);
      if(dt!==this.zero)terms.push(this.mul(dt,this.forcedPulseRhs(system,part,component,time,values,orders)));
      for(let j=0;j<values.length;j++){
        const scale=d(values[j]);if(scale===this.zero)continue;const direction=s.directionParameterIndices.indexOf(j);
        if(direction<0)fail('A frozen carrier, representative, band or label cannot be differentiated as a smooth parameter.','UNSUPPORTED');
        const next=[...orders];next[direction]++;terms.push(this.mul(scale,this.forcedPulseValue(system,part,component,time,values,next)));
      }
      out=this.add(...terms);
    }else if(op==='m3_forced_expression_partial'){
      const [system,values,orders]=args,s=this.expressionSystem(system),terms=[];
      for(let j=0;j<values.length;j++){
        const scale=d(values[j]);if(scale===this.zero)continue;const next=[...orders];next[j]++;
        terms.push(this.mul(scale,this.expressionValue(system,values,next)));
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
    }else fail('No forced-pulse derivative rule for '+op+'.','UNSUPPORTED');
    p.derivatives.set(cacheKey,out);return out;
  }
  checkOrders(orders,length){
    if(!Array.isArray(orders)||orders.length!==length||orders.some(n=>!Number.isSafeInteger(n)||n<0)||degree(orders)>this.maximumForcedOrder)
      fail('The finite forced-pulse derivative budget is exhausted; no missing derivative is set to zero.','RESOURCE_LIMIT');
  }
  defineExpressionFunction({name,parameters,body,derivativeLimits}={}){
    const p=data.get(this);derivativeLimits??=parameters?.map(()=>p.maximumOrder);
    if(!Array.isArray(parameters)||new Set(parameters).size!==parameters.length||parameters.some(x=>this.nodes[x]?.op!=='coordinate')||
      !isRoot(this,body)||!Array.isArray(derivativeLimits)||derivativeLimits.length!==parameters.length||
      derivativeLimits.some(n=>!Number.isSafeInteger(n)||n<0||n>p.maximumOrder)||[...this.freeCoordinates(body)].some(x=>!parameters.includes(x)))
      fail('A shared forced expression needs its full body, complete coordinates and finite derivative limits.','INVALID_INPUT');
    const id='forced-expression:'+p.expressions.length;
    p.expressions.push(freeze({id,name,parameters:[...parameters],body,derivativeLimits:[...derivativeLimits],sourceAuthenticated:false}));return id;
  }
  expressionSystem(id){
    const p=data.get(this),own=typeof id==='string'&&id.startsWith('forced-expression:'),
      s=own?p.expressions[Number(id.slice(18))]:(p.base.expressionSystem?.(id)??p.base.expressionSystems?.[id]);
    if(!s||own&&s.id!==id)fail('A forced expression definition is missing.');return s;
  }
  expressionValue(id,values,orders=null){
    if(typeof id!=='string'||!id.startsWith('forced-expression:'))return this.baseGraph.expressionValue(id,values,orders);
    const s=this.expressionSystem(id);orders??=s.parameters.map(()=>0);this.checkOrders(orders,s.parameters.length);
    if(!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!isRoot(this,x))||orders.some((n,j)=>n>s.derivativeLimits[j]))
      fail('Use the complete forced-expression argument tuple and supported derivative.','RESOURCE_LIMIT');
    return this.node('m3_forced_expression_partial',[id,[...values],[...orders]]);
  }
  materializeExpressionFunction(id,values,orders=null){
    if(typeof id!=='string'||!id.startsWith('forced-expression:'))return this.baseGraph.materializeExpressionFunction(id,values,orders);
    const p=data.get(this),s=this.expressionSystem(id),node=this.expressionValue(id,values,orders),alpha=this.nodes[node].args[2];
    if(p.materializedExpressions.has(node))return p.materializedExpressions.get(node);
    let body=s.body;alpha.forEach((n,j)=>{for(let k=0;k<n;k++)body=this.derivative(body,s.parameters[j]);});
    body=this.simultaneousSubstitute(body,s.parameters,values);p.materializedExpressions.set(node,body);return body;
  }
  share(body,parameters,name){return this.expressionValue(this.defineExpressionFunction({name,parameters,body}),parameters);}

  defineForcedPulse(input){
    const allowed=['name','variable','parameters','directions','length','matrix','forcing'],p=data.get(this);
    if(!input||Object.keys(input).some(k=>!allowed.includes(k)))fail('The zero-data system accepts actual matrix/source bodies, not initial data, norms or completion flags.','INVALID_INPUT');
    const {name,variable,parameters,directions,length,matrix,forcing}=input;
    if(this.nodes[variable]?.op!=='coordinate'||!Array.isArray(parameters)||new Set(parameters).size!==parameters.length||
      parameters.includes(variable)||parameters.some(x=>this.nodes[x]?.op!=='coordinate')||!Array.isArray(directions)||
      new Set(directions).size!==directions.length||directions.some(x=>!parameters.includes(x))||!isRoot(this,length)||
      !Array.isArray(matrix)||matrix.length!==3||matrix.some(row=>!Array.isArray(row)||row.length!==3||row.some(x=>!isRoot(this,x)))||
      !Array.isArray(forcing)||forcing.length!==3||forcing.some(z=>!z||Object.keys(z).length!==2||complexRoots(z).some(x=>!isRoot(this,x))))
      fail('Use a full real 3 by 3 matrix, all six complex forcing components, and complete pulse coordinates.','INVALID_INPUT');
    const permitted=new Set([variable,...parameters]);
    if([...matrix.flat(),...vectorRoots(forcing)].some(x=>[...this.freeCoordinates(x)].some(v=>!permitted.has(v)))||
      [...this.freeCoordinates(length)].some(x=>!parameters.includes(x))||this.isq(length)&&this.fraction(length)[0]<0n)
      fail('A forced source/matrix has an undeclared dependency or an invalid moving pulse interval.','INVALID_INPUT');
    const id=p.systems.length,definition=freeze({id,name,variable,parameters:[...parameters],directions:[...directions],
      directionParameterIndices:directions.map(x=>parameters.indexOf(x)),length,matrix:matrix.map(r=>[...r]),forcing:structuredClone(forcing),
      left:this.zero,initial:Array.from({length:3},()=>complex(this)),
      equation:'partial_v t = matrix*t + forcing; t(0)=0, separately for real and imaginary parts.',
      orderedTermRecurrence:'u_0(v)=integral_0^v forcing(w) dw; u_(j+1)(v)=integral_0^v matrix(w)*u_j(w) dw; t=sum_(j>=0) u_j.',
      exactSolution:'Locally uniform limit of the retained ordered integrals with generated FTC/factorial tails.',
      sourceAuthenticated:false,homogeneousPulseSubstitutedForForcedSolution:false,finitePartialSumIsExactSolution:false});
    p.systems.push(definition);return id;
  }
  forcedPulseSystem(id){const s=data.get(this)?.systems[id];if(!s||s.id!==id)fail('Use a forced equation privately defined in this facade.');return s;}
  forcedPulseValue(id,part,component,time,values,orders=null){
    const s=this.forcedPulseSystem(id);orders??=s.directions.map(()=>0);this.checkOrders(orders,s.directions.length);
    if(!realParts.includes(part)||!Number.isSafeInteger(component)||component<0||component>2||!isRoot(this,time)||
      !Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!isRoot(this,x)))
      fail('A forced value needs its real/imaginary component, pulse time and full parameter tuple.','INVALID_INPUT');
    if(time===this.zero)return this.zero;
    if(s.forcing.every(z=>z.real===this.zero&&z.imaginary===this.zero))return this.zero;
    return this.node('m3_forced_pulse_partial',[id,part,component,time,[...values],[...orders]]);
  }
  forcedCoefficient(id,orders,{withNorm=false}={}){
    const p=data.get(this),s=this.forcedPulseSystem(id);this.checkOrders(orders,s.directions.length);
    const cacheKey=id+':'+key(orders)+':'+withNorm;if(p.coefficients.has(cacheKey))return p.coefficients.get(cacheKey);
    const derivative=root=>{for(let j=0;j<orders.length;j++)for(let n=0;n<orders[j];n++)root=this.derivative(root,s.directions[j]);return root;},
      matrix=s.matrix.map(row=>row.map(derivative)),forcing=s.forcing.map(z=>complex(this,derivative(z.real),derivative(z.imaginary))),
      options={variable:s.variable,length:s.length,parameters:s.parameters},
      normEntry=x=>actualPulseTimeFTCNorm(this,x,options),
      matrixEntries=withNorm?matrix.map(row=>row.map(normEntry)):null,
      forcingEntries=withNorm?forcing.map(z=>({real:normEntry(z.real),imaginary:normEntry(z.imaginary)})):null,
      matrixRows=withNorm?matrixEntries.map(row=>this.add(...row.map(e=>e.upper))):null,
      result=freeze({system:id,orders:[...orders],matrix,forcing,matrixEntries,forcingEntries,
        matrixNorm:withNorm?this.maximum(...matrixRows):null,
        forcingNorm:withNorm?this.maximum(...forcingEntries.flatMap(z=>realParts.map(p=>z[p].upper))):null,
        allActualCoefficientBodiesGenerated:true,allActualTimeDerivativeBodiesGenerated:withNorm,sourceAuthenticated:false});
    p.coefficients.set(cacheKey,result);return result;
  }
  forcedPulseRhs(id,part,component,time,values,orders=null){
    const s=this.forcedPulseSystem(id);orders??=s.directions.map(()=>0);this.checkOrders(orders,s.directions.length);
    const at=root=>this.simultaneousSubstitute(root,[s.variable,...s.parameters],[time,...values]),
      source=this.forcedCoefficient(id,orders).forcing[component][part],terms=[at(source)];
    for(const beta of forcedDownwardMultiIndices(orders)){
      const gamma=orders.map((n,j)=>n-beta[j]),coefficient=this.forcedCoefficient(id,gamma),scale=this.q(binomial(orders,beta));
      for(let j=0;j<3;j++)if(coefficient.matrix[component][j]!==this.zero)
        terms.push(this.mul(scale,at(coefficient.matrix[component][j]),this.forcedPulseValue(id,part,j,time,values,beta)));
    }
    return this.add(...terms);
  }
  materializeForcedPulseJet(id,orders=null){
    const p=data.get(this),s=this.forcedPulseSystem(id);orders??=s.directions.map(()=>0);this.checkOrders(orders,s.directions.length);
    const cacheKey=id+':'+key(orders);if(p.blocks.has(cacheKey))return p.blocks.get(cacheKey);
    const indices=forcedDownwardMultiIndices(orders),lookup=new Map(indices.map((a,j)=>[key(a),j])),
      coefficients=indices.map(a=>this.forcedCoefficient(id,a,{withNorm:true})),
      rows=indices.map((alpha,row)=>({row,orders:alpha,forcing:coefficients[row].forcing,
        blocks:forcedDownwardMultiIndices(alpha).map(beta=>{
          const gamma=alpha.map((n,j)=>n-beta[j]),c=coefficients[lookup.get(key(gamma))],scale=this.q(binomial(alpha,beta));
          return {column:lookup.get(key(beta)),orders:beta,coefficientOrders:gamma,scale,
            matrix:c.matrix.map(r=>r.map(x=>this.mul(scale,x))),norm:this.mul(scale,c.matrixNorm)};
        })})),
      blockNorms=rows.map(row=>this.add(...row.blocks.map(b=>b.norm))),matrixNorm=this.maximum(...blockNorms),
      forcingNorm=this.maximum(...coefficients.map(c=>c.forcingNorm)),
      result=freeze({schema:'MathScope.N6.ForcedPulseVariationalSystem/1',system:id,orders:[...orders],multiIndices:indices,
        dimensionPerRealPart:3*indices.length,complexParts:2,coefficients,rows,matrixNorm,forcingNorm,
        intervalLength:s.length,initial:indices.flatMap(()=>[this.zero,this.zero,this.zero]),
        tailFormula:'F*L*exp(M*L)*(M*L)^N/(N+1)! after N source-ordered terms.',
        allActualMatrixSourceAndTimeDerivativeBodiesGenerated:coefficients.every(c=>c.allActualTimeDerivativeBodiesGenerated),
        sourceAuthenticated:false,commonAllBandClassBoundCertified:false,numericalIntegralEvaluated:false});
    p.blocks.set(cacheKey,result);return result;
  }
  forcedPulsePartialSum(id,{orders=null,terms=1,time,values}={}){
    const p=data.get(this),s=this.forcedPulseSystem(id);orders??=s.directions.map(()=>0);
    if(!Number.isSafeInteger(terms)||terms<0||terms>p.maximumTerms)fail('Use a supported finite number of ordered terms and retain its factorial tail.','RESOURCE_LIMIT');
    time??=s.variable;values??=s.parameters;this.forcedPulseValue(id,'real',0,time,values,orders);
    const cacheKey=canonicalStringify([id,orders,terms,time,values]);if(p.partialSums.has(cacheKey))return p.partialSums.get(cacheKey);
    const block=this.materializeForcedPulseJet(id,orders),size=3*block.multiIndices.length;
    let term=Array.from({length:size},()=>complex(this)),sum=structuredClone(term);const retained=[];
    for(let n=0;n<terms;n++){
      const w=this.fresh('forced_ordered_integral_time'),at=root=>this.substitute(root,s.variable,w),next=[];
      for(const row of block.rows)for(let component=0;component<3;component++){
        const integrand=n===0?row.forcing[component]:cadd(this,...row.blocks.flatMap(b=>b.matrix[component].map((x,j)=>cscale(this,x,term[3*b.column+j]))));
        next.push(complex(this,...realParts.map(part=>this.integral(at(integrand[part]),w,this.zero,s.variable))));
      }
      term=next;sum=sum.map((z,j)=>cadd(this,z,term[j]));retained.push({sourceOrder:n,values:structuredClone(term)});
    }
    const at=root=>this.simultaneousSubstitute(root,[s.variable,...s.parameters],[time,...values]),
      M=at(block.matrixNorm),F=at(block.forcingNorm),L=at(s.length),z=this.mul(M,L),
      tail=this.mul(F,L,this.exp(z),this.pow(z,terms),this.q(1,factorial(terms+1))),
      index=block.multiIndices.findIndex(a=>same(a,orders)),mapped=sum.map(z=>complex(this,at(z.real),at(z.imaginary))),
      result=freeze({schema:'MathScope.N6.ForcedPulseOrderedPartialSum/1',system:id,orders:[...orders],terms,time,values:[...values],
        velocity:mapped.slice(3*index,3*index+3),allValues:mapped,termsRetained:retained,
        matrixNorm:M,forcingNorm:F,length:L,tail,tailFormula:block.tailFormula,
        tailTendsToZero:true,uniformOn:'0<=time<=length, locally uniformly on compact admissible smooth parameter sets.',
        proof:'The jth source-ordered term has norm <=F*L*(M*L)^j/(j+1)!. For j=N+k use (N+k+1)! >= (N+1)!*k! and sum exp(M*L).',
        matrixProductsKeptInTimeOrder:true,actualSourceRetained:true,zeroInitialData:true,
        finiteSumIsExactSolution:false,omittedTermsDeclaredZero:false,sourceAuthenticated:false});
    p.partialSums.set(cacheKey,result);return result;
  }
  captureFunctionDefinitions(){
    const p=data.get(this);return {...p.base.captureFunctionDefinitions(),m3ForcedPulseCount:p.systems.length,
      m3ForcedPulses:canonicalStringify(p.systems),m3ForcedExpressionCount:p.expressions.length,m3ForcedExpressions:canonicalStringify(p.expressions)};
  }
  functionDefinitionsUnchanged(snapshot){
    const p=data.get(this);return p.base.functionDefinitionsUnchanged(snapshot)&&
      (snapshot.m3ForcedPulseCount===undefined||snapshot.m3ForcedPulses===canonicalStringify(p.systems.slice(0,snapshot.m3ForcedPulseCount))&&
        snapshot.m3ForcedExpressions===canonicalStringify(p.expressions.slice(0,snapshot.m3ForcedExpressionCount)));
  }
  forcedDefinitions(){
    const p=data.get(this);return structuredClone({systems:p.systems,expressions:p.expressions,
      coefficients:[...p.coefficients.values()].filter(c=>c.allActualTimeDerivativeBodiesGenerated),blocks:[...p.blocks.values()],
      partialSums:[...p.partialSums.values()],sourceAuthenticated:false,maximumOrder:p.maximumOrder,maximumTerms:p.maximumTerms});
  }
}

export function assertForcedPulseFacade(G,base){
  if(!data.has(G)||data.get(G).base!==base)fail('Use the unchanged privately created forced-pulse facade on the same source graph.');return true;
}

/** Exact original H_w path (6.21)/(Prop.7.2 p.79) on one fixed lifted
 * rectangle. The actual pulse-coordinate body must have the displayed
 * common-torus derivatives; a source label or another preimage is never
 * selected by this operation.
 */
export function originalForcedPulsePath(G,input){
  const allowed=['Y','pulse','w','ci','Tg','levelDifference'];
  if(!input||Object.keys(input).some(k=>!allowed.includes(k)))fail('A pulse path needs the complete actual fixed-rectangle coordinate body.','INVALID_INPUT');
  const {Y,pulse,w,ci,Tg,levelDifference}=input;
  if(!Array.isArray(Y)||Y.length!==2||new Set(Y).size!==2||Y.some(x=>G.nodes[x]?.op!=='coordinate')||
    G.nodes[w]?.op!=='coordinate'||Y.includes(w)||![pulse,ci,Tg].every(x=>isRoot(G,x))||
    !Number.isSafeInteger(levelDifference)||levelDifference<0||levelDifference>4||G.freeCoordinates(pulse).has(w)||
    [ci,Tg].some(x=>[w,...Y].some(y=>G.freeCoordinates(x).has(y))))
    fail('Use the original constant label scale and one independent path variable on a fixed common-torus lift.','INVALID_INPUT');
  if(ci===G.zero||Tg===G.zero)fail('The original pulse path has nonzero positive scale.','INVALID_INPUT');
  const b=G.sub(G.sqrt(G.q(2)),G.one),vr=[G.one,G.neg(b)],vt=[b,G.one],squared=dot(G,vt,vt),
    lambdaT=vt.map(x=>G.div(x,squared)),lambdaR=vr.map(x=>G.div(x,squared)),
    power=G.pow(Tg,levelDifference),factor=G.div(ci,power),difference=G.sub(w,pulse),
    Hw=Y.map((x,j)=>G.add(x,G.mul(factor,difference,vt[j]))),
    expectedGradient=lambdaT.map(x=>G.div(G.mul(power,x),ci)),gradient=Y.map(y=>G.derivative(pulse,y)),
    atPulse=G.simultaneousSubstitute(pulse,Y,Hw),
    transverseBefore=dot(G,lambdaR,Y),transverseAfter=dot(G,lambdaR,Hw),
    jacobian=Hw.map(x=>Y.map(y=>G.derivative(x,y))),expectedJacobian=vt.map((x,i)=>lambdaT.map((y,j)=>G.sub(i===j?G.one:G.zero,G.mul(x,y)))),
    check=root=>sourceGraphRationalIdentity(G,root,{maxTerms:80000}),
    checks=[...gradient.map((x,j)=>({id:'actual-common-pulse-derivative-'+j,...check(G.sub(x,expectedGradient[j]))})),
      {id:'actual-pulse-evaluated-at-Hw-is-w',...check(G.sub(atPulse,w))},
      {id:'actual-transverse-coordinate-is-fixed',...check(G.sub(transverseAfter,transverseBefore))},
      ...jacobian.flatMap((row,i)=>row.map((x,j)=>({id:'actual-common-path-Jacobian-'+i+'-'+j,...check(G.sub(x,expectedJacobian[i][j]))})))];
  if(checks.some(x=>!x.pass))fail('The supplied pulse-coordinate body does not use the original common-torus path normalization.');
  return freeze({schema:'MathScope.N6.OriginalForcedPulsePath/1',Y:[...Y],pulse,w,ci,Tg,levelDifference,vr,vt,lambdaT,lambdaR,
    commonToPulseScale:factor,Hw,gradient,jacobian,atPulse,transverseBefore,transverseAfter,checks,
    sourcePullbackRule:'Substitute the complete common-torus source f_m at Y=H_w, holding every slow coordinate and the actual transverse lift fixed.',
    sourceAuthenticated:false,preimagesIdentified:false,deckTranslationSelectsDifferentSource:false,slowPointMovesAlongPath:false});
}

const inverseRecord=r=>({schema:r.schema,input:r.input,normal:r.normal,K:r.K,k:r.k,epsilon:r.epsilon,damping:r.damping,
  projection:r.projection,Aphi:r.Aphi,matrix:r.matrix,source:r.source,projectedSource:r.projectedSource,
  system:r.system,velocity:r.velocity,pressure:r.pressure,pressureNumerator:r.pressureNumerator,
  rhs:r.rhs,identities:r.identities,limit:r.limit,scope:r.scope});

/** Full (7.13), including a nontransverse source and its normal pressure.
 * This returns exact lazy amplitudes; its finite display sums are separate.
 */
export function forcedAngularInverse(base,input){
  const allowed=['name','variable','parameters','directions','length','n','K','k','epsilon','forcing','m'];
  if(!input||Object.keys(input).some(k=>!allowed.includes(k)))fail('Supply complete original-operator operands; no pressure, derivative, norm or solution is supplied.','INVALID_INPUT');
  const G=new ForcedPulseExpressions(base),{variable,parameters,directions,length,n,K,k,epsilon,forcing,m}=input;
  if(!Number.isSafeInteger(m)||m===0||Math.abs(m)>1000000||!Array.isArray(n)||n.length!==3||n.some(x=>!isRoot(G,x))||
    !Array.isArray(K)||K.length!==3||K.some(row=>!Array.isArray(row)||row.length!==3||row.some(x=>!isRoot(G,x)))||
    !isRoot(G,k)||!isRoot(G,epsilon)||!Array.isArray(forcing)||forcing.length!==3||forcing.some(z=>!z||complexRoots(z).some(x=>!isRoot(G,x))))
    fail('Use a nonzero harmonic, full phase normal, all cylindrical K coefficients and all complex source components.','INVALID_INPUT');
  const nSquared=dot(G,n,n);if(nSquared===G.zero||k===G.zero)fail('The principal inverse requires a nonzero phase normal and carrier.','INVALID_INPUT');
  const nPrime=n.map(x=>G.derivative(x,variable)),normalRow=K[0].map((_,j)=>G.sub(dot(G,n,K.map(row=>row[j])),nPrime[j])),
    projection=n.map((x,i)=>n.map((y,j)=>G.sub(i===j?G.one:G.zero,G.div(G.mul(x,y),nSquared)))),
    Aphi=K.map((row,i)=>row.map((x,j)=>G.add(G.neg(x),G.div(G.mul(n[i],normalRow[j]),nSquared)))),
    damping=G.mul(epsilon,G.pow(k,2),nSquared),matrix=Aphi.map((row,i)=>row.map((x,j)=>i===j?G.sub(x,G.mul(G.q(m*m),damping)):x)),
    projectedRaw=projection.map(row=>cscale(G,G.q(-1),cdot(G,row,forcing))),
    // Composite source/normal operands may share an exact algebraic body.
    // The base graph flattens products and sums, so freezing such roots as
    // unrelated atoms can fracture a valid identity. Retain the original
    // coefficient algebra; the identity kernel already treats genuinely
    // nonrational source operations as independent exact atoms.
    coefficientIdentity=createFactoredRationalVerifier(G),
    normalizeZero=x=>coefficientIdentity(x).pass?G.zero:x,
    projectedSource=projectedRaw.map(z=>complex(G,normalizeZero(z.real),normalizeZero(z.imaginary))),
    system=G.defineForcedPulse({name:input.name??'forced_original_7_13_m'+m,variable,parameters,directions,length,matrix,forcing:projectedSource}),
    velocity=n.map((_,j)=>complex(G,...realParts.map(part=>G.forcedPulseValue(system,part,j,variable,parameters)))),
    rhs=n.map((_,j)=>complex(G,...realParts.map(part=>G.forcedPulseRhs(system,part,j,variable,parameters)))),
    pressureNumerator=cadd(G,cdot(G,normalRow,velocity),cdot(G,n,forcing)),denominator=G.mul(G.q(m),k,nSquared),
    pressure=complex(G,G.neg(G.div(pressureNumerator.imaginary,denominator)),G.div(pressureNumerator.real,denominator)),
    velocityAtoms=vectorRoots(velocity),
    rational=createFactoredRationalVerifier(G,{atomicNodes:velocityAtoms,maxTerms:120000}),
    constraint=cdot(G,n,velocity),constraintDerivative=cadd(G,cdot(G,nPrime,velocity),cdot(G,n,rhs),cscale(G,G.mul(G.q(m*m),damping),constraint)),
    residual=velocity.map((z,i)=>cadd(G,rhs[i],cdot(G,K[i],velocity),cscale(G,G.mul(G.q(m*m),damping),z),forcing[i],
      complex(G,G.neg(G.mul(G.q(m),k,n[i],pressure.imaginary)),G.mul(G.q(m),k,n[i],pressure.real)))),
    projectionNormal=projection[0].map((_,j)=>dot(G,n,projection.map(row=>row[j]))),
    checks=[...projectionNormal.map((root,j)=>({id:'full-normal-forcing-projection-'+j,...rational(root)})),
      ...realParts.map(part=>({id:'moving-normal-constraint-evolution-'+part,...rational(constraintDerivative[part])})),
      ...residual.flatMap((z,j)=>realParts.map(part=>({id:'full-principal-cancellation-'+j+'-'+part,...rational(z[part])}))),
      {id:'zero-data-all-three-complex-components',pass:velocity.every(z=>complexRoots(z).every(x=>G.substitute(x,variable,G.zero)===G.zero))},
      {id:'actual-source-normal-pressure-retained',pass:same(pressureNumerator,cadd(G,cdot(G,normalRow,velocity),cdot(G,n,forcing)))},
      {id:'actual-damping-harmonic-square-retained',pass:matrix.every((row,i)=>row.every((x,j)=>x===(i===j?G.sub(Aphi[i][j],G.mul(G.q(m*m),damping)):Aphi[i][j])))}];
  if(checks.some(x=>!x.pass))fail('A forced (7.13) identity failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const limit=G.materializeForcedPulseJet(system),result={schema:'MathScope.N6.ExactForcedAngularInverse/1',G,
    input:{name:input.name??null,variable,parameters:[...parameters],directions:[...directions],length,m},
    normal:{value:[...n],derivative:nPrime,squared:nSquared},K:K.map(row=>[...row]),k,epsilon,damping,projection,Aphi,matrix,
    source:structuredClone(forcing),projectedSource,system,velocity,pressure,pressureNumerator,rhs,
    identities:{projectionNormal,constraint,constraintDerivative,residual,checks,
      constraintConclusion:'(n dot t)prime = -m^2*d*(n dot t), with zero initial data; uniqueness gives n dot t=0.',
      pressureConclusion:'The full normal source n dot f remains in pi. Multiplication by i*k*m*n cancels the retained normal principal residual.'},
    limit,scope:{exactZeroDataForcedSolutionDefined:true,completeComplexSourceUsed:true,algebraicPressureConstructed:true,
      actualOrderedIntegralAndTailProducers:true,matrixCommutationAssumed:false,sourceAuthenticated:false,
      requiredSourcePremises:['Real smooth n,K,k,epsilon and source on the entire closed original pulse path; |n|^2>0 and k!=0.',
        'The supplied parameterization holds the original slow point and transverse coordinate fixed, with the same common-torus preimages.',
        'Source-specific original support/domain and coefficient-class bounds are authenticated separately.'],
      commonAllBandEnvelopeBoundCertified:false,nonzeroFullFinalN6FieldConstructed:false,numericalWholeFieldEnclosure:false,newLeanKernelProof:false}};
  inverseSeals.set(result,{G,system,record:canonicalStringify(inverseRecord(result)),definition:G.forcedPulseSystem(system)});return result;
}

export function assertForcedAngularInverse(result){
  const seal=inverseSeals.get(result);
  if(!seal||result.G!==seal.G||result.system!==seal.system||seal.definition!==result.G.forcedPulseSystem(result.system)||
    seal.record!==canonicalStringify(inverseRecord(result)))fail('Use the unchanged privately constructed forced inverse; copied bodies or completion flags have no authority.');return true;
}

/** Principal equation after multiplying both t and pi by psi. The full
 * potential/curl realization has additional commutators in its source layer.
 */
export function forcedAngularCutoff(result,{psi}={}){
  assertForcedAngularInverse(result);const G=result.G;if(!isRoot(G,psi))fail('Use an actual retained pulse cutoff body.','INVALID_INPUT');
  const dpsi=G.derivative(psi,result.input.variable),velocity=result.velocity.map(z=>cscale(G,psi,z)),pressure=cscale(G,psi,result.pressure),
    residual=velocity.map((z,j)=>cadd(G,complex(G,G.derivative(z.real,result.input.variable),G.derivative(z.imaginary,result.input.variable)),
      cdot(G,result.K[j],velocity),cscale(G,G.mul(G.q(result.input.m**2),result.damping),z),result.source[j],
      complex(G,G.neg(G.mul(G.q(result.input.m),result.k,result.normal.value[j],pressure.imaginary)),
        G.mul(G.q(result.input.m),result.k,result.normal.value[j],pressure.real)))),
    expected=result.source.map((z,j)=>cadd(G,cscale(G,G.sub(G.one,psi),z),cscale(G,dpsi,result.velocity[j]))),
    // Composite cutoffs/source coefficients can coincide with subterms of
    // n or K. Do not freeze them as unrelated atoms when checking the full
    // differentiated product: their original algebraic bodies are retained.
    rational=createFactoredRationalVerifier(G,{atomicNodes:vectorRoots(result.velocity),maxTerms:120000}),
    checks=residual.flatMap((z,j)=>realParts.map(part=>({id:'principal-cutoff-source-and-derivative-'+j+'-'+part,
      ...rational(G.sub(z[part],expected[j][part]))})));
  if(checks.some(x=>!x.pass))fail('The forced pulse cutoff dropped an actual source or derivative commutator.');
  return {schema:'MathScope.N6.ForcedAngularPrincipalCutoff/1',psi,dpsi,velocity,pressure,residual,expected,checks,
    formula:'principal(psi*t,psi*pi)+f=(1-psi)*f+psi_prime*t',fullPotentialCurlRemaindersHandledElsewhere:true,
    sourceAuthenticated:false,principalCutoffResidualDeclaredZero:false};
}

/** Solve every conjugate pair. Frequencies are the actual input integers;
 * no generated higher harmonic may be dropped or folded back to m=1.
 */
export function forcedAngularHarmonics(base,input){
  if(!input||!Array.isArray(input.modes)||!input.modes.length||input.modes.length>128)fail('Provide the full finite nonzero harmonic source set.','INVALID_INPUT');
  const {modes,...common}=input,G=new ForcedPulseExpressions(base),byMode=new Map();
  for(const row of modes){
    if(!row||Object.keys(row).some(k=>!['m','forcing'].includes(k))||!Number.isSafeInteger(row.m)||row.m===0||byMode.has(row.m)||
      !Array.isArray(row.forcing)||row.forcing.length!==3)fail('Nonzero harmonic rows must be complete, unique and explicit.','INVALID_INPUT');
    byMode.set(row.m,row);
  }
  const pairs=[],out=[],rational=createFactoredRationalVerifier(G,{maxTerms:120000});
  for(const m of [...byMode.keys()].filter(m=>m>0).sort((a,b)=>a-b)){
    const positive=byMode.get(m),negative=byMode.get(-m);if(!negative)fail('A real original field requires every actual negative conjugate mode.','INVALID_INPUT');
    const checks=positive.forcing.flatMap((z,j)=>realParts.map(part=>({component:j,part,
      ...rational(G.sub(negative.forcing[j][part],part==='real'?z.real:G.neg(z.imaginary)))})));
    if(checks.some(x=>!x.pass))fail('The supplied negative source is not the exact conjugate of its positive source.');
    const solution=forcedAngularInverse(G,{...common,m,forcing:positive.forcing}),negativeVelocity=solution.velocity.map(z=>cconj(G,z)),
      negativePressure=cconj(G,solution.pressure);
    out.push({m,velocity:solution.velocity,pressure:solution.pressure,source:positive.forcing,system:solution.system,conjugateOf:null},
      {m:-m,velocity:negativeVelocity,pressure:negativePressure,source:negative.forcing,system:solution.system,conjugateOf:m});
    pairs.push({m,solution,sourceConjugacyChecks:checks,
      negativeSolutionProof:'The matrix is real and depends on m^2. Conjugation preserves its zero-data IVP. The pressure factor i/m conjugates exactly when m changes sign.',
      allSourceComponentsRetained:true});
  }
  if(out.length!==modes.length)fail('The finite harmonic source set has an unmatched negative mode.','INVALID_INPUT');
  return {schema:'MathScope.N6.ExactForcedAngularHarmonics/1',G,modes:out.sort((a,b)=>a.m-b.m),pairs,
    fullInputModeSet:[...byMode.keys()].sort((a,b)=>a-b),sourceAuthenticated:false,missingHarmonicAssumedZero:false,
    zeroAngularMeanInverted:false,frequencyConvolutionMustBeConstructedBySourceAssembly:true};
}

/** Traverse the new exact operations, generate every requested source jet
 * and its own FTC tail program, and expose inherited roots to the original
 * source closure checker. New limits never become finite sums here.
 */
export function materializeForcedPulseClosure(G,roots,{maxExpressions=50000}={}){
  if(!data.has(G)||!Array.isArray(roots)||roots.some(x=>!isRoot(G,x)))fail('Use retained roots in this privately created forced facade.','INVALID_INPUT');
  const visited=new Set(),stack=[...roots],expressions=new Map(),jets=new Map(),baseRoots=new Set();
  while(stack.length){
    const id=stack.pop();if(visited.has(id))continue;visited.add(id);const n=G.nodes[id];
    if(!G.extended(id)){baseRoots.add(id);continue;}
    if(n.op==='m3_forced_expression_partial'){
      const [system,values,orders]=n.args,s=G.expressionSystem(system),k=system+':'+key(orders);
      let e=expressions.get(k);if(!e){
        if(expressions.size>=maxExpressions)fail('The full forced shared-expression closure exceeds its finite budget.','RESOURCE_LIMIT');
        e={system,orders:[...orders],parameters:s.parameters,body:G.materializeExpressionFunction(system,s.parameters,orders),applications:0};expressions.set(k,e);
      }
      e.applications++;stack.push(...values,e.body);
    }else if(n.op==='m3_forced_pulse_partial'){
      const [system,part,component,time,values,orders]=n.args,k=system+':'+key(orders);let jet=jets.get(k);
      if(!jet){
        jet=G.materializeForcedPulseJet(system,orders);jets.set(k,jet);
        stack.push(jet.matrixNorm,jet.forcingNorm,jet.intervalLength,...jet.coefficients.flatMap(c=>[...c.matrix.flat(),...vectorRoots(c.forcing),
          ...c.matrixEntries.flat().flatMap(e=>[e.expression,e.timeDerivative,e.upper]),
          ...c.forcingEntries.flatMap(z=>realParts.flatMap(p=>[z[p].expression,z[p].timeDerivative,z[p].upper]))]));
      }
      stack.push(time,...values);
    }else stack.push(...children(n));
  }
  return {schema:'MathScope.N6.ForcedPulseDerivativeClosure/1',roots:[...roots],visitedNodes:visited.size,
    expressions:[...expressions.values()],jets:[...jets.values()],inheritedRoots:[...baseRoots],
    everyRequestedForcedDerivativeHasActualSourceAndTail:true,allNewSharedDerivativeBodiesGenerated:true,
    inheritedSourceClosureVerifiedHere:false,sourceAuthenticated:false,finiteApproximationReplacesExactLimit:false};
}
