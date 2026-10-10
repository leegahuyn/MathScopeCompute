/** An append-only copy of the actual source functional graph, with finite
 * derivative/resource budgets independent of the historical order-12 UI.
 * All function operations retain their bodies and their materializers.
 * This file never changes a previously certified source graph.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const integer=(n,name)=>{if(!Number.isSafeInteger(n)||n<0)fail('INVALID_INPUT',name+' must be a nonnegative safe integer.');};

export class ActualInductionExpressions extends ActualConvergentExpressions {
  constructor(base,{maxNodes=1500000,maxDerivativeOrder=128,checkCancelled}={}){
    super(base.source.id);
    integer(maxNodes,'maxNodes');integer(maxDerivativeOrder,'maxDerivativeOrder');
    if(maxNodes<base.nodes.length||maxNodes>8000000||maxDerivativeOrder<2)fail('RESOURCE_LIMIT','The actual graph copy needs a sufficient explicit node/derivative budget.');
    for(const [key,value]of Object.entries(base)){
      if(value instanceof Map)this[key]=new Map(value);
      else if(Array.isArray(value))this[key]=structuredClone(value);
      else if(value&&typeof value==='object')this[key]=structuredClone(value);
      else this[key]=value;
    }
    this.maxNodes=maxNodes;this.maxDerivativeOrder=maxDerivativeOrder;this.checkCancelled=checkCancelled;
    // These are new local function definitions. The original bodies and
    // variable lists remain identical; only the materialization budget grows.
    this.expressionSystems=this.expressionSystems.map(s=>({...s,derivativeLimits:s.parameters.map(()=>maxDerivativeOrder),
      implementation:'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',historicalBodyPreserved:true}));
    this.baseNodeCount=base.nodes.length;this.baseDefinitionCount=base.picardSystems.length;
  }
  node(op,args){
    const key=JSON.stringify([op,args]);if(this.lookup.has(key))return this.lookup.get(key);
    if(this.maxNodes!==undefined&&this.nodes.length>=this.maxNodes)fail('RESOURCE_LIMIT','The actual induction graph exhausted its declared node budget. No order certificate was returned.');
    if(this.nodes.length%8192===0)this.checkCancelled?.();
    const id=this.nodes.length;this.nodes.push({op,args});this.lookup.set(key,id);return id;
  }
  derivativeBudget(...orders){for(const n of orders){integer(n,'derivative order');if(n>this.maxDerivativeOrder)fail('RESOURCE_LIMIT','This finite materialization exceeds its derivative budget; no missing derivative is set to zero.');}}
  step(x,order=0){this.derivativeBudget(order);return this.node('source_step_derivative',[x,order]);}
  natural(component,Y,eta=this.core.eta,radialOrder=0,etaOrder=0){
    if(!['Phi','u','average'].includes(component))fail('INVALID_INPUT','Unknown original natural component.');
    this.derivativeBudget(radialOrder,etaOrder);
    if(Y===this.zero)return this.naturalAxisDerivative(component,eta,radialOrder,etaOrder);
    return this.node('actual_natural_series',[component,Y,eta,radialOrder,etaOrder]);
  }
  picardRoot(system,component,xi,eta=this.core.eta,etaOrder=0){
    this.derivativeBudget(etaOrder);
    if(!this.picardSystems[system]||!Number.isInteger(component)||component<0||component>5)fail('INVALID_INPUT','Unknown actual Picard component.');
    if(xi===this.zero)return this.zero;
    return this.node('actual_background_picard',[system,component,xi,eta,etaOrder]);
  }
  picardEven(system,component,X,eta=this.core.eta,radialOrder=0,etaOrder=0){
    this.derivativeBudget(2*radialOrder,etaOrder);
    if(!this.picardSystems[system]||!Number.isInteger(component)||component<0||component>3)fail('INVALID_INPUT','Use an even component of the actual source system.');
    if(X===this.zero)return radialOrder?this.materializePicardEvenDerivative(system,component,X,eta,radialOrder,etaOrder):this.zero;
    return this.node('actual_background_even_profile',[system,component,X,eta,radialOrder,etaOrder]);
  }
  materializePicardEvenDerivative(system,component,X,eta=this.core.eta,radialOrder=0,etaOrder=0){
    this.derivativeBudget(2*radialOrder,etaOrder);const s=this.picardSystems[system];
    if(!s||component<0||component>3)fail('INVALID_INPUT','Use an actual even component.');
    if(radialOrder===0)return this.picardRoot(system,component,this.sqrt(X),eta,etaOrder);
    let body=this.picardRoot(system,component,s.xi,s.eta,etaOrder);
    for(let j=0;j<2*radialOrder;j++)body=this.derivative(body,s.xi);
    const variables=Array.from({length:radialOrder},()=>this.fresh('induction_even_X'));
    body=this.simultaneousSubstitute(body,[s.xi,s.eta],[this.mul(this.sqrt(X),...variables),eta]);
    body=this.mul(body,...variables.map((t,j)=>this.pow(t,2*(radialOrder-1-j))));
    for(const t of variables)body=this.integral(body,t,this.zero,this.one);
    return this.mul(this.q(1,1n<<BigInt(radialOrder)),body);
  }
  defineExpressionFunction({name,parameters,body,derivativeLimits=parameters?.map(()=>this.maxDerivativeOrder)}){
    if(!Array.isArray(parameters)||!parameters.length||parameters.some(v=>this.nodes[v]?.op!=='coordinate')||new Set(parameters).size!==parameters.length||!this.nodes[body])fail('INVALID_INPUT','An actual shared expression needs its body and explicit parameters.');
    if(!Array.isArray(derivativeLimits)||derivativeLimits.length!==parameters.length)fail('INVALID_INPUT','Every expression parameter needs a derivative budget.');
    this.derivativeBudget(...derivativeLimits);
    if([...this.freeCoordinates(body)].some(v=>!parameters.includes(v)))fail('INVALID_INPUT','An induction expression contains an unbound free coordinate.');
    const id=this.expressionSystems.length;this.expressionSystems.push({name,parameters:[...parameters],body,derivativeLimits:[...derivativeLimits],
      implementation:'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',unspecifiedOracle:false});return id;
  }
  expressionValue(system,values,orders=null){
    const s=this.expressionSystems[system];orders??=s?.parameters.map(()=>0);
    if(!s||!Array.isArray(values)||values.length!==s.parameters.length||values.some(v=>!this.nodes[v])||!Array.isArray(orders)||orders.length!==values.length)fail('INVALID_INPUT','Unknown actual expression or incomplete arguments.');
    this.derivativeBudget(...orders);
    if(orders.some((v,j)=>v>s.derivativeLimits[j]))fail('RESOURCE_LIMIT','The shared body derivative budget is exhausted.');
    return this.node('actual_expression_partial',[system,[...values],[...orders]]);
  }
  share(body,parameters,name){return this.expressionValue(this.defineExpressionFunction({name,parameters,body}),parameters);}
  pack(roots,extra={}){return super.pack(roots,{inductionExpressionKernel:{implementation:'actual-residual-order-induction-expressions.mjs',
    copiedOriginalGraph:true,originalGraphMutated:false,arbitraryFiniteDerivativeRecurrence:true,maxDerivativeOrder:this.maxDerivativeOrder,maxNodes:this.maxNodes,
    omittedDerivativeIsZero:false,naturalAxisMaterializerBudget:'The source coefficient materializer may return RESOURCE_LIMIT above its own finite degree budget; no axis oracle replaces it.',
    picardEvenIdentity:'d_X^r f(sqrt X)=2^-r integral_[0,1]^r product_j t_j^(2(r-1-j))*f^(2r)(sqrt X product_j t_j) dt'},...extra});}
}
