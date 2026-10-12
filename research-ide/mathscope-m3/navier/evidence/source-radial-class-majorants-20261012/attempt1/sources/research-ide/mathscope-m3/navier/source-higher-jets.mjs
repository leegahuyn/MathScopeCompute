/** Higher finite slow jets of the unchanged original pulse ODE.
 *
 * M2 owns its C3 kernel. This M3 graph is an independent copy with an
 * explicit C4..C6 variational extension; the original M2 graph, private
 * aliases and runtime are never edited. Every new matrix coefficient is
 * an AD derivative of the retained original 2x2 matrix. Its norm is the
 * actual finite-interval FTC integral, not a supplied derivative bound.
 */
import {ActualCommonPhysicalJetExpressions} from '../../mathscope-m2/navier/actual-common-physical-jet-kernel.mjs';
import {retainedThirdMatrixFTCNorm} from '../../mathscope-m2/navier/actual-third-jet-ftc.mjs';
import {assertActualCurrentMeanState} from './source-current-state.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const privateState=new WeakMap();
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const degree=a=>a.reduce((s,n)=>s+n,0),key=a=>a.join(','),frozen=value=>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(frozen);Object.freeze(value);}return value;
};
const factorial=n=>{let p=1n;for(let j=2;j<=n;j++)p*=BigInt(j);return p;};
function indices(count,order){
  const rows=[],visit=(prefix,left)=>{
    if(prefix.length===count-1){rows.push([...prefix,left]);return;}
    for(let j=0;j<=left;j++)visit([...prefix,j],left-j);
  };
  for(let n=0;n<=order;n++)visit([],n);return rows;
}
function binomial(a,b){return a.reduce((v,n,j)=>v*factorial(n)/(factorial(b[j])*factorial(n-b[j])),1n);}

export class ActualNavierHigherJetExpressions extends ActualCommonPhysicalJetExpressions{
  constructor(state,{maxNodes=4000000,maximumSlowOrder=6,onProgress,checkCancelled}={}){
    assertActualCurrentMeanState(state);
    if(!Number.isInteger(maximumSlowOrder)||maximumSlowOrder<4||maximumSlowOrder>6)fail('RESOURCE_LIMIT','This finite M3 materializer supports a declared maximum slow order of4 through6.');
    const origin=state.G,originCount=origin.nodes.length,originNodes=canonicalStringify(origin.nodes),aliases=[...origin.pulseThirdJetAliases];
    super(origin,{maxNodes,compactFTC:true,onProgress,checkCancelled});
    const systems=new Map(this.pulseThirdJetSystems.map((s,i)=>[i,frozen(s)])),reverse=new Map(aliases.map(([a,b])=>[b,a]));
    privateState.set(this,{state,origin,originCount,originNodes,originDefinitions:origin.captureFunctionDefinitions(),aliases:new Map(aliases),reverse,systems,maximumSlowOrder,onProgress,
      higher:[],higherLookup:new Map(),higherPartials:new Map()});
    if(canonicalStringify(this.nodes.slice(0,originCount))!==originNodes)fail('INVALID_SOURCE_CONSTRUCTION','The M3 higher-jet copy changed an original expression.');
    for(const [covariance,third]of aliases){
      const c=this.covarianceSystems[covariance],s=systems.get(third);
      if(!s||c.variable!==s.variable||canonicalStringify(c.matrix)!==canonicalStringify(s.matrix)||canonicalStringify(c.parameters)!==canonicalStringify(s.parameters)||
        canonicalStringify(c.initial)!==canonicalStringify(s.initial)||c.length!==s.length||s.left!==this.zero)
        fail('INVALID_SOURCE_CONSTRUCTION','The copied third jet does not bind the unchanged original covariance ODE.');
    }
    privateState.get(this).initialDefinitions=this.captureFunctionDefinitions();
  }

  get pulseThirdJetAliases(){return new Map(privateState.get(this)?.aliases??super.pulseThirdJetAliases);}
  assertPulseThirdVariation(id){
    const s=privateState.get(this)?.systems.get(id);
    if(s){if(this.pulseThirdJetSystems[id]!==s)fail('INVALID_SOURCE_CONSTRUCTION','An adopted original source variation was edited.');return s;}
    return super.assertPulseThirdVariation(id);
  }
  pulseThirdJetValue(id,component,time,values){
    const original=privateState.get(this)?.reverse.get(id);
    if(original!==undefined&&component<2){this.thirdJetEvaluation(id,component,time,values);return this.covarianceValue(original,component,time,values);}
    return super.pulseThirdJetValue(id,component,time,values);
  }

  defineHigherVariation(thirdId,order){
    const p=privateState.get(this),cacheKey=thirdId+':'+order;
    if(p.higherLookup.has(cacheKey))return p.higherLookup.get(cacheKey);
    if(!Number.isInteger(order)||order<4||order>p.maximumSlowOrder)fail('RESOURCE_LIMIT','The requested source slow derivative exceeds the declared M3 materialization budget.');
    const larger=p.higher.findIndex(s=>s.thirdId===thirdId&&s.order>=order);
    if(larger>=0){p.higherLookup.set(cacheKey,larger);return larger;}
    const source=this.assertPulseThirdVariation(thirdId),multi=indices(source.directions.length,order),
      derivative=(root,alpha)=>{for(let j=0;j<alpha.length;j++)for(let n=0;n<alpha[j];n++)root=this.derivative(root,source.directions[j]);return root;},
      matrices=multi.map(alpha=>source.matrix.map(row=>row.map(root=>derivative(root,alpha)))),
      initial=multi.flatMap(alpha=>source.initial.map(root=>derivative(root,alpha))),
      matrixNorms=matrices.map((matrix,i)=>{
        const norm=retainedThirdMatrixFTCNorm(this,matrix,{variable:source.variable,length:source.length,parameters:source.parameters});
        if(i%5===4)p.onProgress?.({stage:'n6-higher-original-matrix-FTC',thirdId,order,throughMultiIndex:i,nodeCount:this.nodes.length});
        return norm;
      }),blocks=multi.map((alpha,i)=>({orders:alpha,offset:2*i})),lookup=new Map(blocks.map(b=>[key(b.orders),b.offset])),
      dimension=2*blocks.length,augmentedMatrix=Array.from({length:dimension},()=>Array(dimension).fill(this.zero)),blockNorms=[];
    for(const block of blocks){
      const norms=[];
      for(const beta of multi.filter(beta=>beta.every((n,i)=>n<=block.orders[i]))){
        const alpha=block.orders.map((n,i)=>n-beta[i]),at=lookup.get(key(alpha))/2,column=lookup.get(key(beta)),coefficient=this.q(binomial(block.orders,beta));
        for(let i=0;i<2;i++)for(let j=0;j<2;j++)augmentedMatrix[block.offset+i][column+j]=this.mul(coefficient,matrices[at][i][j]);
        norms.push(this.mul(coefficient,matrixNorms[at].upper));
      }
      blockNorms.push(this.add(...norms));
    }
    const magnitude=x=>this.isq(x)?this.q(this.fraction(x)[0]<0n?-this.fraction(x)[0]:this.fraction(x)[0],this.fraction(x)[1]):this.sqrt(this.add(this.one,this.pow(x,2))),
      initialNorm=this.maximum(...initial.map(magnitude)),matrixNorm=this.maximum(...blockNorms),
      system=frozen({thirdId,originalCovariance:p.reverse.get(thirdId),order,variable:source.variable,parameters:[...source.parameters],directions:[...source.directions],
        directionParameterIndices:[...source.directionParameterIndices],left:source.left,length:source.length,
        originalMatrix:source.matrix.map(row=>[...row]),originalInitial:[...source.initial],blocks,dimension,matrices,initial,matrixNorms,augmentedMatrix,blockNorms,matrixNorm,initialNorm,
        equations:{jet:'d_v w_alpha=sum_(beta<=alpha) binomial(alpha,beta)*D^(alpha-beta)M*w_beta',
          initial:'w_alpha(0)=D^alpha(original datum)',
          mixed:'Every retained alpha is a canonical multi-index; time-chain derivatives also retain the complete ODE RHS.'},
        matrixAndEveryTimeDerivativeMaterialized:matrixNorms.every(n=>n.allOriginalTimeDerivativeBodiesGenerated&&n.entries.flat().every(e=>e.actualBodyBinding&&e.actualTimeDerivativeBinding)),
        derivativeBounds:'Finite-interval FTC integrals of the actual coefficient and its actual pulse-time derivative.',
        locallyUniformConvergencePremises:'The unchanged original coefficient functions are smooth on their source admissible open chart; the FTC integrals are locally finite. Global class constants remain a separate source-bound query.',
        finiteSumIsExactSolution:false,allOrderGlobalSourceNormClaimed:false});
    if(!system.matrixAndEveryTimeDerivativeMaterialized)fail('INVALID_SOURCE_CONSTRUCTION','A higher variation has an unbound coefficient derivative.');
    const id=p.higher.length;p.higher.push(system);p.higherLookup.set(cacheKey,id);
    p.onProgress?.({stage:'n6-higher-original-pulse-variation-bound',thirdId,order,dimension,nodeCount:this.nodes.length});return id;
  }

  higherSystem(id){
    const s=privateState.get(this)?.higher[id];if(!s)fail('INVALID_SOURCE_CONSTRUCTION','Use a privately generated higher variation of the unchanged source ODE.');return s;
  }
  higherValue(id,component,time,values){
    const s=this.higherSystem(id);
    if(!Number.isSafeInteger(component)||component<0||component>=s.dimension||!this.nodes[time]||!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!this.nodes[x]))
      fail('INVALID_INPUT','A higher pulse value needs a retained component, time and complete original parameter tuple.');
    const alpha=s.blocks[Math.floor(component/2)].orders;
    if(degree(alpha)<=3)return this.pulseThirdJetValue(s.thirdId,this.thirdJetComponent(s.thirdId,component%2,alpha),time,values);
    if(time===this.zero)return this.simultaneousSubstitute(s.initial[component],s.parameters,values);
    return this.node('actual_n6_pulse_higher_jet_volterra',[id,component,time,[...values]]);
  }
  higherRhs(id,component,time,values){
    const s=this.higherSystem(id);
    return this.add(...s.augmentedMatrix[component].map((root,j)=>root===this.zero?this.zero:
      this.mul(this.simultaneousSubstitute(root,[s.variable,...s.parameters],[time,...values]),this.higherValue(id,j,time,values))));
  }

  pulseHigherPartialSum(id,{terms=1,time,values}={}){
    const p=privateState.get(this),s=this.higherSystem(id);
    if(!Number.isInteger(terms)||terms<0||terms>8)fail('RESOURCE_LIMIT','Materialize zero through8 ordered-integral terms and retain their explicit factorial tail.');
    time??=s.variable;values??=s.parameters;const cacheKey=canonicalStringify([id,terms,time,values]);
    if(p.higherPartials.has(cacheKey))return p.higherPartials.get(cacheKey);
    let term=[...s.initial],sum=[...term];const rows=[];
    for(let n=1;n<=terms;n++){
      this.checkCancelled?.();const t=this.fresh('n6_higher_ordered_time'),at=root=>this.substitute(root,s.variable,t);
      term=s.augmentedMatrix.map(row=>this.integral(this.add(...row.map((root,j)=>root===this.zero?this.zero:this.mul(at(root),at(term[j])))),t,this.zero,s.variable));
      sum=sum.map((root,i)=>this.add(root,term[i]));rows.push({order:n,term:[...term]});
    }
    const at=root=>this.simultaneousSubstitute(root,[s.variable,...s.parameters],[time,...values]),
      K=at(s.matrixNorm),L=at(s.length),I=at(s.initialNorm),z=this.mul(K,L),
      tail=this.mul(I,this.exp(z),this.pow(z,terms+1),this.q(1,factorial(terms+1))),
      result=frozen({system:id,order:s.order,terms,dimension:s.dimension,values:sum.map(at),rows:rows.map(r=>({...r,term:r.term.map(at)})),
        intervalLength:L,matrixNorm:K,initialNorm:I,tail,tailFormula:'I*exp(K*L)*(K*L)^(N+1)/(N+1)!',
        validOn:'0<=v<=the original L(parameters)',tailTendsToZero:true,finiteSumIsExactSolution:false,numericalEnclosureComputed:false,
        originalSourceMatrixAndInitialDatumRetained:true});
    p.higherPartials.set(cacheKey,result);return result;
  }

  freeCoordinates(id){
    const n=this.nodes[id];
    if(n?.op==='actual_n6_pulse_higher_jet_volterra'){
      const out=new Set();for(const root of [n.args[2],...n.args[3]])for(const v of this.freeCoordinates(root))out.add(v);return out;
    }
    return super.freeCoordinates(id);
  }
  dependsOn(id,variable){return this.nodes[id]?.op==='actual_n6_pulse_higher_jet_volterra'?this.freeCoordinates(id).has(variable):super.dependsOn(id,variable);}
  substitute(id,variable,value){
    const n=this.nodes[id];if(n?.op==='actual_n6_pulse_higher_jet_volterra')return this.higherValue(n.args[0],n.args[1],this.substitute(n.args[2],variable,value),n.args[3].map(x=>this.substitute(x,variable,value)));
    return super.substitute(id,variable,value);
  }
  derivative(id,variable){
    const n=this.nodes[id],p=privateState.get(this),original=n?.op==='actual_covariance_volterra',third=n?.op==='actual_pulse_third_jet_volterra',higher=n?.op==='actual_n6_pulse_higher_jet_volterra';
    if(!p||!original&&!third&&!higher)return super.derivative(id,variable);
    if(!this.dependsOn(id,variable))return this.zero;
    const [oldId,component,time,values]=n.args,thirdId=original?p.aliases.get(oldId):higher?this.higherSystem(oldId).thirdId:oldId;
    if(thirdId===undefined)return super.derivative(id,variable);
    const source=this.assertPulseThirdVariation(thirdId),system=higher?this.higherSystem(oldId):source,
      alpha=original?Array(source.directions.length).fill(0):system.blocks[Math.floor(component/2)].orders,
      dt=this.derivative(time,variable),dp=values.map(x=>this.derivative(x,variable)),terms=[];
    if(dt!==this.zero)terms.push(this.mul(dt,higher?this.higherRhs(oldId,component,time,values):this.pulseThirdJetRhs(thirdId,component,time,values)));
    for(let j=0;j<dp.length;j++)if(dp[j]!==this.zero){
      const direction=source.directionParameterIndices.indexOf(j);
      if(direction<0)fail('UNSUPPORTED','A frozen representative derivative is not silently replaced by zero.');
      const next=[...alpha];next[direction]++;
      if(degree(next)<=3)terms.push(this.mul(dp[j],this.pulseThirdJetValue(thirdId,this.thirdJetComponent(thirdId,component%2,next),time,values)));
      else{
        const hId=this.defineHigherVariation(thirdId,degree(next)),h=this.higherSystem(hId),offset=h.blocks.find(b=>key(b.orders)===key(next)).offset;
        terms.push(this.mul(dp[j],this.higherValue(hId,offset+component%2,time,values)));
      }
    }
    return this.add(...terms);
  }

  captureFunctionDefinitions(){
    const base=super.captureFunctionDefinitions(),p=privateState.get(this);
    return p?{...base,m3AdoptedAliases:canonicalStringify([...p.aliases]),m3HigherCount:p.higher.length,m3Higher:canonicalStringify(p.higher)}:base;
  }
  functionDefinitionsUnchanged(snapshot){
    const p=privateState.get(this);return super.functionDefinitionsUnchanged(snapshot)&&
      (snapshot.m3HigherCount===undefined||p&&snapshot.m3AdoptedAliases===canonicalStringify([...p.aliases])&&snapshot.m3Higher===canonicalStringify(p.higher.slice(0,snapshot.m3HigherCount)));
  }
  pack(roots,extra={}){
    const p=privateState.get(this);
    const program=super.pack(roots,{...extra,pulseHigherJetSystems:structuredClone(p.higher),
      m3HigherJetKernel:{schema:'MathScope.N6.ActualHigherPulseJetKernel/1',maximumSlowOrder:p.maximumSlowOrder,
        independentM3GraphCopy:true,sourceOriginalGraphModified:false,originalNoncommutativeODE:true,actualCoefficientAndFTCBodyDerivatives:true,
        finiteOrderedIntegralProducer:'source-higher-jets.mjs:pulseHigherPartialSum',explicitFactorialTail:true,allOrderGlobalClassBoundClaimed:false}});
    // The M2 base owns a separate, initially empty alias map in a clone.
    // Only this private M3 constructor authenticates the adopted aliases.
    return {...program,pulseThirdJetAliases:[...p.aliases]};
  }
}

export function assertActualNavierHigherJetExpressions(G,state){
  const p=privateState.get(G);
  if(!p||(state!==undefined&&p.state!==state))fail('INVALID_SOURCE_CONSTRUCTION','Use the private higher-jet graph of the same actual current source state.');
  assertActualCurrentMeanState(p.state);
  if(canonicalStringify(p.origin.nodes.slice(0,p.originCount))!==p.originNodes||canonicalStringify(G.nodes.slice(0,p.originCount))!==p.originNodes||
    !p.origin.functionDefinitionsUnchanged(p.originDefinitions)||!G.functionDefinitionsUnchanged(p.initialDefinitions))
    fail('INVALID_SOURCE_CONSTRUCTION','A retained source node or function definition in the higher-jet construction was changed.');
  return true;
}

/** Materialize the actual derivative body once at its defining parameters.
 * The original application retains all actual arguments and simultaneous
 * substitution. This is ordinary exact function sharing, not a value oracle:
 * D^orders f is generated from f's stored body, and every argument remains
 * a source expression. Replacing parameters at every call would repeatedly
 * copy large nested integral DAGs, without adding a mathematical operation.
 * This helper alone does not authenticate a paper source.
 */
export function materializeParametricExpressionBody(G,expression){
  const node=G.nodes[expression];
  if(node?.op!=='actual_expression_partial')fail('INVALID_INPUT','Use an existing explicit shared-expression application.');
  const [system,values,orders]=node.args,s=G.expressionSystems[system];
  if(!s||G.expressionValue(system,values,orders)!==expression||s.parameters.some(x=>G.nodes[x]?.op!=='coordinate'))
    fail('INVALID_SOURCE_CONSTRUCTION','The shared derivative application lost its complete explicit definition.');
  const body=G.materializeExpressionFunction(system,s.parameters,orders);
  if([...G.freeCoordinates(body)].some(x=>!s.parameters.includes(x)))
    fail('INVALID_SOURCE_CONSTRUCTION','A parametric derivative acquired an undeclared free coordinate.');
  return {expression,system,orders:[...orders],body,parameters:[...s.parameters],arguments:[...values],
    bodyAtDefiningParameters:true,actualDerivativeBodyGenerated:true,
    applicationMeaning:'Apply the generated actual derivative body to the retained arguments by capture-free simultaneous substitution.',
    sourceAuthenticated:false};
}

/** Follow every shared derivative required by these roots to its actual
 * retained parametric body and every argument. An application is retained
 * with its exact parameter tuple instead of repeatedly inlining the same
 * large integral. Volterra/natural/Picard limits keep their exact producers
 * and tails; they are not evaluated as finite floating values.
 */
export function materializeActualHigherExpressionClosure(G,roots,{maxExpressions=50000,onProgress}={}){
  assertActualNavierHigherJetExpressions(G);
  if(!Array.isArray(roots)||roots.some(x=>!Number.isSafeInteger(x)||!G.nodes[x])||!Number.isSafeInteger(maxExpressions)||maxExpressions<1||maxExpressions>100000)
    fail('INVALID_INPUT','Supply retained roots and a finite shared-expression materialization budget.');
  const visited=new Set(),stack=[...roots],partials=[],limitOperations=new Map(),allArguments=new Set([
    'add','multiply','inverse','exp','log_positive','sqrt_positive','sine','cosine','ceiling','maximum','smooth_piecewise']);
  while(stack.length){
    const id=stack.pop();if(visited.has(id))continue;visited.add(id);
    const n=G.nodes[id];if(!n)fail('INVALID_SOURCE_CONSTRUCTION','A materialized source dependency is not a retained node.');
    const {op,args}=n;let children=[];
    if(['rational','coordinate','source_parameter'].includes(op)){}
    else if(['integer_power','source_step_derivative'].includes(op))children=[args[0]];
    else if(allArguments.has(op))children=args;
    else if(op==='definite_integral')children=[args[0],args[2],args[3]];
    else if(op==='actual_expression_partial'){
      if(partials.length>=maxExpressions)fail('RESOURCE_LIMIT','The actual derivative closure exhausted its declared finite budget; no unresolved body was set to zero.');
      const materialized=materializeParametricExpressionBody(G,id);
      partials.push(materialized);children=[...materialized.arguments,materialized.body];
      if(partials.length%500===0)onProgress?.({stage:'n6-materialized-current-source-shared-derivatives',functions:partials.length,nodes:G.nodes.length});
    }else if(['actual_covariance_volterra','actual_pulse_third_jet_volterra','actual_n6_pulse_higher_jet_volterra'].includes(op)){
      limitOperations.set(op,(limitOperations.get(op)??0)+1);children=[args[2],...args[3]];
    }else if(op==='actual_natural_series'){
      limitOperations.set(op,(limitOperations.get(op)??0)+1);children=[args[1],args[2]];
    }else if(['actual_background_picard','actual_background_even_profile'].includes(op)){
      limitOperations.set(op,(limitOperations.get(op)??0)+1);children=[args[2],args[3]];
    }else if(op==='actual_quadratic_root')children=[args[2]];
    else if(op==='actual_monotone_root')children=args.slice(1);
    else fail('UNSUPPORTED','No source derivative-closure rule is declared for '+op+'.');
    stack.push(...children);
  }
  return {schema:'MathScope.N6.ActualSharedDerivativeClosure/1',roots:[...roots],visitedNodes:visited.size,partials,
    retainedExactLimitOperations:Object.fromEntries(limitOperations),allRequestedSharedBodiesMaterialized:true,
    actualArgumentsRetained:true,bodyRepresentation:'Canonical defining parameters with exact capture-free function applications.',
    unresolvedBodyReplacedByOracle:false,limitReplacedByFiniteSum:false,numericalEnclosureComputed:false};
}

export async function actualHigherJetCertificate(G,roots){
  const p=privateState.get(G);if(!p)fail('INVALID_SOURCE_CONSTRUCTION','Use a private M3 higher-jet graph generated from the actual current source state.');
  assertActualNavierHigherJetExpressions(G);
  const systems=p.higher.map((s,id)=>({...s,id})),program=G.pack(roots,{schema:'MathScope.N6.ActualHigherPulseJetProgram/1'}),encoded=canonicalStringify(program);
  return {schema:'MathScope.N6.ActualHigherPulseJetCertificate/1',source:{samePrivateCurrentState:true,sourceGraphNodeCount:p.originCount,
      paperSHA256:p.state.source.paperSHA256,parameterExpressionSHA256:p.state.source.parameterExpressionSHA256,originalGraphModified:false},roots,systems,
    graph:{sha256:await sha256(encoded),nodeCount:G.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length},
    checks:[{id:'actual-source-prefix-preserved',pass:true},{id:'all-higher-coefficient-and-time-derivative-bodies-bound',pass:systems.every(s=>s.matrixAndEveryTimeDerivativeMaterialized)},
      {id:'original-fixed-datum-and-interval',pass:systems.every(s=>s.left===G.zero&&s.originalCovariance!==undefined)}],
    scope:{actualOriginalFiniteHigherVariationsConstructed:true,finiteSumReplacesExactSource:false,allOrderGlobalClassBounds:false,numericalEnclosureComputed:false,completeN6:false}};
}
