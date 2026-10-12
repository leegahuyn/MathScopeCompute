/** Exact, append-only M3 expression operations for an original global wave.
 *
 * The pulse operation differentiates the retained noncommutative 2x2 ODE.
 * It constructs only the downward-closed multi-indices a query needs. Every
 * coefficient and its pulse-time derivative has an actual FTC norm body.
 *
 * The indexed-field operation differentiates each fixed-label local body
 * before reindexing a complete finite local cover. It NEVER differentiates
 * a floor-selected label. Its source caller must prove local finiteness,
 * flat joins, completeness and the indicated constant chart Jacobians.
 * This generic kernel does not issue paper-source or M_alpha authority.
 */
import {ActualCommonPhysicalJetExpressions} from '../../mathscope-m2/navier/actual-common-physical-jet-kernel.mjs';
import {disposableThirdJetCacheCopy,retainedThirdMatrixFTCNorm} from '../../mathscope-m2/navier/actual-third-jet-ftc.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

const privateData=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const frozen=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(frozen);Object.freeze(x);}return x;};
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),degree=a=>a.reduce((s,n)=>s+n,0),key=a=>a.join(','),
  factorial=n=>{let r=1n;for(let j=2;j<=n;j++)r*=BigInt(j);return r;},
  binomial=(a,b)=>a.reduce((r,n,j)=>r*factorial(n)/(factorial(b[j])*factorial(n-b[j])),1n);

export function downwardMultiIndices(alpha){
  if(!Array.isArray(alpha)||!alpha.length||alpha.some(n=>!Number.isSafeInteger(n)||n<0))fail('INVALID_INPUT','Use a nonnegative finite multi-index.');
  const result=[],visit=(at,row)=>{if(at===alpha.length){result.push(row);return;}for(let n=0;n<=alpha[at];n++)visit(at+1,[...row,n]);};
  visit(0,[]);return result.sort((a,b)=>degree(a)-degree(b)||key(a).localeCompare(key(b)));
}

/** Source nodes are immutable shared objects. New arrays, intern tables and
 * all disposable caches are independent; no M2 graph or private seal is
 * changed. An M3 custom operation cannot acquire authority through cloning.
 */
export class GlobalSourceExpressions extends ActualCommonPhysicalJetExpressions{
  constructor(base,{maximumSlowOrder=8,...options}={}){
    if(!Number.isSafeInteger(maximumSlowOrder)||maximumSlowOrder<2||maximumSlowOrder>32)
      fail('RESOURCE_LIMIT','Declare a finite global slow-jet order from 2 through 32.');
    const view=disposableThirdJetCacheCopy(base),nodes=base.nodes,lookup=base.lookup;
    view.nodes=[];view.lookup=new Map();super(view,{...options,compactFTC:true});
    this.nodes=nodes.slice();this.lookup=new Map(lookup);this.baseNodeCount=nodes.length;this.globalSharedPrefixLength=nodes.length;
    privateData.set(this,{maximumSlowOrder,pulses:[],byCovariance:new Map(),coefficients:[],coefficientLookup:new Map(),
      blocks:[],blockLookup:new Map(),pulseSums:new Map(),fields:[],fieldMaterializations:new Map(),onProgress:options.onProgress});
  }

  /** The only accepted coefficient matrix and datum come from this graph's
   * existing covariance operation; supplied jets, norms and replacement
   * matrices are not arguments. Binding adds independent M3 rules only.
   */
  bindGlobalPulseDerivatives(covariance,input){
    const p=privateData.get(this),s=this.covarianceSystems[covariance];
    if(!input||Object.keys(input).some(k=>k!=='directions')||!s||!Array.isArray(input.directions)||input.directions.length!==3||
      new Set(input.directions).size!==3||input.directions.some(x=>!s.parameters.includes(x)))
      fail('INVALID_INPUT','Bind the retained original covariance equation and exactly three of its independent slow parameters.');
    if(p.byCovariance.has(covariance)){
      const id=p.byCovariance.get(covariance),a=this.globalPulseSystem(id);
      if(!same(a.directions,input.directions))fail('INVALID_SOURCE_CONSTRUCTION','An original ODE cannot be rebound to different derivative directions.');
      return id;
    }
    if(!same(s.initial,[this.one,this.zero])||s.parameters.includes(s.variable)||
      s.matrix.flat().some(x=>[...this.freeCoordinates(x)].some(v=>![s.variable,...s.parameters].includes(v))))
      fail('INVALID_SOURCE_CONSTRUCTION','Retain the same fixed e1 initial datum, pulse coordinate and complete explicit matrix parameters.');
    const id=p.pulses.length,definition=frozen({covariance,variable:s.variable,parameters:[...s.parameters],directions:[...input.directions],
      directionParameterIndices:input.directions.map(v=>s.parameters.indexOf(v)),matrix:s.matrix.map(r=>[...r]),initial:[...s.initial],
      left:this.zero,length:s.length,originalDefinition:canonicalStringify(s),
      equation:'d_v w_alpha=sum_(beta<=alpha) binomial(alpha,beta) D^(alpha-beta)M w_beta',
      exactSolution:'Locally uniform ordered-integral limit of the full downward-closed variational system.',
      matrixDerivativesSuppliedByCaller:false,sourceAuthenticated:false});
    p.pulses.push({definition,original:s});p.byCovariance.set(covariance,id);return id;
  }

  globalPulseSystem(id){
    const row=privateData.get(this)?.pulses[id];
    if(!row||this.covarianceSystems[row.definition.covariance]!==row.original||canonicalStringify(row.original)!==row.definition.originalDefinition)
      fail('INVALID_SOURCE_CONSTRUCTION','Use this M3 graph\'s unchanged retained original covariance definition.');
    return row.definition;
  }
  globalOrders(alpha){
    const p=privateData.get(this);
    if(!Array.isArray(alpha)||alpha.length!==3||alpha.some(n=>!Number.isSafeInteger(n)||n<0))fail('INVALID_INPUT','Use a three-component nonnegative slow multi-index.');
    if(degree(alpha)>p.maximumSlowOrder)fail('RESOURCE_LIMIT','The declared finite source jet budget is exhausted; no omitted derivative is set to zero.');
    return alpha;
  }
  globalPulseCoefficient(id,alpha,{withNorm=false}={}){
    const p=privateData.get(this),s=this.globalPulseSystem(id);this.globalOrders(alpha);
    const lookup=id+':'+key(alpha),cached=p.coefficientLookup.get(lookup);
    if(cached!==undefined&&(!withNorm||p.coefficients[cached].norm))return p.coefficients[cached];
    const derivative=root=>{for(let j=0;j<3;j++)for(let n=0;n<alpha[j];n++)root=this.derivative(root,s.directions[j]);return root;},
      matrix=cached===undefined?s.matrix.map(row=>row.map(derivative)):p.coefficients[cached].matrix,
      initial=s.initial.map(derivative),norm=withNorm?retainedThirdMatrixFTCNorm(this,matrix,{variable:s.variable,length:s.length,parameters:s.parameters}):null,
      record=frozen({pulse:id,orders:[...alpha],matrix,initial,norm,originalMatrix:s.matrix,actualADDerivative:true,
        derivativeOrder:degree(alpha),sourceAuthenticated:false});
    // Norm enrichment appends a new immutable record. Older definition
    // snapshots remain exact prefixes rather than being silently rewritten.
    p.coefficientLookup.set(lookup,p.coefficients.length);p.coefficients.push(record);return record;
  }

  globalPulseJetValue(id,component,time,values,alpha=[0,0,0]){
    const s=this.globalPulseSystem(id);this.globalOrders(alpha);
    if(![0,1].includes(component)||!this.nodes[time]||!Array.isArray(values)||values.length!==s.parameters.length||values.some(v=>!this.nodes[v]))
      fail('INVALID_INPUT','A pulse jet needs its original component, time and complete parameter tuple.');
    if(degree(alpha)===0)return this.covarianceValue(s.covariance,component,time,values);
    if(time===this.zero)return this.zero; // D^alpha e1=0, explicitly bound above.
    return this.node('m3_global_pulse_jet',[id,component,time,[...values],[...alpha]]);
  }
  globalPulseJetRhs(id,component,time,values,alpha){
    const s=this.globalPulseSystem(id);this.globalOrders(alpha);const terms=[];
    for(const beta of downwardMultiIndices(alpha)){
      const gamma=alpha.map((n,j)=>n-beta[j]),coefficient=this.globalPulseCoefficient(id,gamma),scale=this.q(binomial(alpha,beta));
      for(let j=0;j<2;j++)if(coefficient.matrix[component][j]!==this.zero)
        terms.push(this.mul(scale,this.simultaneousSubstitute(coefficient.matrix[component][j],[s.variable,...s.parameters],[time,...values]),
          this.globalPulseJetValue(id,j,time,values,beta)));
    }
    return this.add(...terms);
  }

  materializeGlobalPulseJet(id,alpha){
    const p=privateData.get(this),s=this.globalPulseSystem(id);this.globalOrders(alpha);const lookup=id+':'+key(alpha);
    if(p.blockLookup.has(lookup))return p.blocks[p.blockLookup.get(lookup)];
    const multi=downwardMultiIndices(alpha),coefficients=multi.map(a=>this.globalPulseCoefficient(id,a,{withNorm:true})),
      index=new Map(multi.map((a,j)=>[key(a),j])),rows=[],blockNorms=[];
    for(const [i,a]of multi.entries()){
      const blocks=downwardMultiIndices(a).map(beta=>{
        const gamma=a.map((n,j)=>n-beta[j]),c=coefficients[index.get(key(gamma))],scale=this.q(binomial(a,beta));
        return {column:index.get(key(beta)),orders:beta,coefficientOrders:gamma,scale,matrix:c.matrix.map(row=>row.map(x=>this.mul(scale,x))),norm:this.mul(scale,c.norm.upper)};
      });
      blockNorms.push(this.add(...blocks.map(b=>b.norm)));rows.push({row:i,orders:a,blocks});
    }
    const result=frozen({pulse:id,requestedOrders:[...alpha],multiIndices:multi,dimension:2*multi.length,coefficients,rows,
      initial:multi.flatMap(a=>degree(a)===0?s.initial:[this.zero,this.zero]),matrixNorm:this.maximum(...blockNorms),blockNorms,initialNorm:this.one,
      intervalLength:s.length,fixedLeft:s.left,originalCovariance:s.covariance,allCoefficientAndTimeDerivativeBodiesGenerated:
        coefficients.every(c=>c.norm.allOriginalTimeDerivativeBodiesGenerated&&c.norm.entries.flat().every(e=>e.actualBodyBinding&&e.actualTimeDerivativeBinding)),
      sparsity:'All nonzero 2x2 variational blocks are retained; no dense array of zero expressions is stored.',
      tailFormula:'I exp(K L) (K L)^(n+1)/(n+1)!',locallyUniformOn:'Compact subsets of the original admissible smooth parameter domain.',
      fullSourceAllOrderClassBound:false,numericalIntegralEvaluated:false,sourceAuthenticated:false});
    if(!result.allCoefficientAndTimeDerivativeBodiesGenerated)fail('INVALID_SOURCE_CONSTRUCTION','A requested exact pulse derivative is missing its actual FTC coefficient body.');
    p.blockLookup.set(lookup,p.blocks.length);p.blocks.push(result);
    p.onProgress?.({stage:'global-source-sparse-pulse-variation',pulse:id,orders:alpha,dimension:result.dimension,nodeCount:this.nodes.length});return result;
  }
  globalPulsePartialSum(id,{orders=[0,0,0],terms=1,time,values}={}){
    const p=privateData.get(this),s=this.globalPulseSystem(id),b=this.materializeGlobalPulseJet(id,orders);
    if(!Number.isSafeInteger(terms)||terms<0||terms>8)fail('RESOURCE_LIMIT','Materialize 0 through 8 ordered-integral terms with their actual nonzero factorial tail.');
    time??=s.variable;values??=s.parameters;const cacheKey=canonicalStringify([id,orders,terms,time,values]);
    if(p.pulseSums.has(cacheKey))return p.pulseSums.get(cacheKey);
    let term=[...b.initial],sum=[...term];const termsRetained=[];
    for(let n=1;n<=terms;n++){
      this.checkCancelled?.();const tau=this.fresh('m3_global_ordered_pulse_time'),at=root=>this.substitute(root,s.variable,tau),next=[];
      for(const row of b.rows)for(let component=0;component<2;component++){
        const integrand=this.add(...row.blocks.flatMap(block=>block.matrix[component].map((m,j)=>m===this.zero?this.zero:this.mul(at(m),at(term[2*block.column+j])))));
        next.push(this.integral(integrand,tau,this.zero,s.variable));
      }
      term=next;sum=sum.map((x,j)=>this.add(x,term[j]));termsRetained.push({order:n,values:[...term]});
    }
    const at=root=>this.simultaneousSubstitute(root,[s.variable,...s.parameters],[time,...values]),K=at(b.matrixNorm),L=at(s.length),z=this.mul(K,L),
      tail=this.mul(this.exp(z),this.pow(z,terms+1),this.q(1,factorial(terms+1))),which=b.multiIndices.findIndex(a=>same(a,orders)),
      result=frozen({pulse:id,orders:[...orders],terms,values:sum.slice(2*which,2*which+2).map(at),allValues:sum.map(at),termsRetained,
        multiIndices:b.multiIndices,matrixNorm:K,length:L,initialNorm:this.one,tail,tailFormula:b.tailFormula,
        originalMatrixAndDatumRetained:true,tailTendsToZero:true,finiteSumIsExactSolution:false,sourceAuthenticated:false});
    p.pulseSums.set(cacheKey,result);return result;
  }

  /** Complete local-cover data, not an arbitrary derivative callback. Each
   * row retains the local expression body, all arguments, its normalization
   * and three diagonal constant-chart derivative factors. The source layer
   * must authenticate the cover and flatness facts accompanying this data.
   */
  defineGlobalIndexedField(input){
    const allowed=['name','parameters','directions','rows','sourceRecipe'],p=privateData.get(this);
    if(!input||Object.keys(input).some(k=>!allowed.includes(k))||!Array.isArray(input.parameters)||new Set(input.parameters).size!==input.parameters.length||
      input.parameters.some(x=>this.nodes[x]?.op!=='coordinate')||!Array.isArray(input.directions)||input.directions.length!==3||
      new Set(input.directions).size!==3||input.directions.some(x=>!input.parameters.includes(x))||!Array.isArray(input.rows)||!input.rows.length)
      fail('INVALID_INPUT','An indexed field requires explicit coordinates, three slow directions and its entire declared cover.');
    const permit=new Set(input.parameters),rows=input.rows.map(row=>{
      if(!row||Object.keys(row).some(k=>!['localSystem','values','localDirectionIndices','coefficient','derivativeScales','label','guards'].includes(k)))
        fail('INVALID_INPUT','Supply the complete exact local-body recipe, not externally supplied derivative values.');
      const s=this.expressionSystems[row.localSystem];
      if(!s||!Array.isArray(row.values)||row.values.length!==s.parameters.length||!Array.isArray(row.localDirectionIndices)||row.localDirectionIndices.length!==3||
        new Set(row.localDirectionIndices).size!==3||row.localDirectionIndices.some(j=>!Number.isSafeInteger(j)||j<0||j>=s.parameters.length)||
        !Array.isArray(row.derivativeScales)||row.derivativeScales.length!==3||
        (row.guards!==undefined&&(!Array.isArray(row.guards)||row.guards.some(g=>!Array.isArray(g)||g.length!==3)))||
        [...row.values,row.coefficient,...row.derivativeScales,...(row.guards??[]).flat()].some(x=>!this.nodes[x]||[...this.freeCoordinates(x)].some(v=>!permit.has(v))))
        fail('INVALID_INPUT','A cover row lost its local system, original argument tuple or declared chart scales.');
      return {...structuredClone(row),guards:structuredClone(row.guards??[]),localBody:s.body,localParameters:[...s.parameters]};
    });
    const id=p.fields.length;p.fields.push(frozen({name:input.name,parameters:[...input.parameters],directions:[...input.directions],
      directionParameterIndices:input.directions.map(v=>input.parameters.indexOf(v)),rows,sourceRecipe:structuredClone(input.sourceRecipe??{}),
      derivativeRule:'Differentiate the fixed-label local defining body, then sum the full cover with its constant chart Jacobian.',
      analyticPremises:['Every omitted label is identically zero locally.','Each changing cover label crosses a flat zero support boundary.',
        'The supplied chart Jacobians and normalizations are constant when their actual labels are fixed.'],
      sourceAuthenticated:false,paperClassBoundVerified:false}));return id;
  }
  globalIndexedSystem(id){const s=privateData.get(this)?.fields[id];if(!s)fail('INVALID_SOURCE_CONSTRUCTION','Use an indexed field privately defined in this graph.');return s;}
  globalIndexedValue(id,values,orders=[0,0,0]){
    const s=this.globalIndexedSystem(id);this.globalOrders(orders);
    if(!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!this.nodes[x]))fail('INVALID_INPUT','An indexed value needs all of its explicit original arguments.');
    return this.node('m3_global_indexed_partial',[id,[...values],[...orders]]);
  }
  materializeGlobalIndexedField(id,orders=[0,0,0]){
    const p=privateData.get(this),s=this.globalIndexedSystem(id);this.globalOrders(orders);const cacheKey=id+':'+key(orders);
    if(p.fieldMaterializations.has(cacheKey))return p.fieldMaterializations.get(cacheKey);
    const localBodies=new Map(),terms=s.rows.map((row,i)=>{
      const def=this.expressionSystems[row.localSystem],localOrders=def.parameters.map(()=>0);
      orders.forEach((n,j)=>localOrders[row.localDirectionIndices[j]]=n);
      const localKey=row.localSystem+':'+localOrders.join(',');
      if(!localBodies.has(localKey)){
        const body=this.materializeExpressionFunction(row.localSystem,def.parameters,localOrders);
        if([...this.freeCoordinates(body)].some(v=>!def.parameters.includes(v)))fail('INVALID_SOURCE_CONSTRUCTION','A generated local derivative acquired an undeclared coordinate.');
        localBodies.set(localKey,{system:row.localSystem,parameters:[...def.parameters],orders:localOrders,body,actualDerivativeBodyGenerated:true});
      }
      const value=this.expressionValue(row.localSystem,row.values,localOrders),scale=this.mul(row.coefficient,...orders.map((n,j)=>this.pow(row.derivativeScales[j],n))),
        unguarded=this.mul(scale,value),layers=[];
      let guarded=unguarded;
      for(const [coordinate,left,right]of row.guards){const prior=guarded;guarded=this.choose(coordinate,left,right,this.zero,prior,this.zero);layers.push({coordinate,left,right,body:prior,guarded});}
      return {row:i,label:row.label,localValue:value,scale,unguarded,guardLayers:layers,value:guarded};
    }),body=this.add(...terms.map(t=>t.value)),out=frozen({field:id,orders:[...orders],parameters:[...s.parameters],body,terms,
      localBodies:[...localBodies.values()],allDeclaredRowsRetained:terms.length===s.rows.length,
      labelsDifferentiated:false,exactFiniteBodyRetained:true,sourceAuthenticated:false});
    p.fieldMaterializations.set(cacheKey,out);return out;
  }

  freeCoordinates(id){
    const n=this.nodes[id];
    if(n?.op==='m3_global_pulse_jet'||n?.op==='m3_global_indexed_partial'){
      const roots=n.op==='m3_global_pulse_jet'?[n.args[2],...n.args[3]]:n.args[1],out=new Set();
      for(const root of roots)for(const v of this.freeCoordinates(root))out.add(v);return out;
    }
    return super.freeCoordinates(id);
  }
  substitute(id,variable,value){
    if(id===variable)return value;const n=this.nodes[id];
    if(n?.op==='m3_global_pulse_jet')return this.globalPulseJetValue(n.args[0],n.args[1],this.substitute(n.args[2],variable,value),n.args[3].map(x=>this.substitute(x,variable,value)),n.args[4]);
    if(n?.op==='m3_global_indexed_partial')return this.globalIndexedValue(n.args[0],n.args[1].map(x=>this.substitute(x,variable,value)),n.args[2]);
    return super.substitute(id,variable,value);
  }
  derivative(id,variable){
    const n=this.nodes[id],p=privateData.get(this);
    if(!p)return super.derivative(id,variable);
    const pulse=n?.op==='m3_global_pulse_jet',original=n?.op==='actual_covariance_volterra',indexed=n?.op==='m3_global_indexed_partial';
    if(indexed){
      if(!this.dependsOn(id,variable))return this.zero;
      const [which,values,orders]=n.args,s=this.globalIndexedSystem(which),terms=[];
      for(let j=0;j<values.length;j++){
        const d=this.derivative(values[j],variable);if(d===this.zero)continue;
        const at=s.directionParameterIndices.indexOf(j);
        if(at<0)fail('UNSUPPORTED','A discrete/frozen reference-chart label is not differentiated as a continuous variable.');
        const next=[...orders];next[at]++;terms.push(this.mul(d,this.globalIndexedValue(which,values,next)));
      }
      return this.add(...terms);
    }
    const which=original?p.byCovariance.get(n.args[0]):pulse?n.args[0]:undefined;
    if(which===undefined)return super.derivative(id,variable);
    if(!this.dependsOn(id,variable))return this.zero;
    const [,component,time,values]=n.args,alpha=pulse?n.args[4]:[0,0,0],s=this.globalPulseSystem(which),terms=[],dt=this.derivative(time,variable);
    if(dt!==this.zero)terms.push(this.mul(dt,this.globalPulseJetRhs(which,component,time,values,alpha)));
    for(let j=0;j<values.length;j++){
      const d=this.derivative(values[j],variable);if(d===this.zero)continue;
      const at=s.directionParameterIndices.indexOf(j);
      if(at<0)fail('UNSUPPORTED','Frozen representative, band or label derivatives require a different actual source family; they are never set to zero.');
      const next=[...alpha];next[at]++;terms.push(this.mul(d,this.globalPulseJetValue(which,component,time,values,next)));
    }
    return this.add(...terms);
  }
  captureFunctionDefinitions(){
    const base=super.captureFunctionDefinitions(),p=privateData.get(this);if(!p)return base;
    return {...base,m3GlobalPulseCount:p.pulses.length,m3GlobalPulses:canonicalStringify(p.pulses.map(x=>x.definition)),
      m3GlobalCoefficientCount:p.coefficients.length,m3GlobalCoefficients:canonicalStringify(p.coefficients),
      m3GlobalBlockCount:p.blocks.length,m3GlobalBlocks:canonicalStringify(p.blocks),
      m3GlobalFieldCount:p.fields.length,m3GlobalFields:canonicalStringify(p.fields)};
  }
  functionDefinitionsUnchanged(snapshot){
    const p=privateData.get(this);return super.functionDefinitionsUnchanged(snapshot)&&
      (snapshot.m3GlobalPulseCount===undefined||p&&snapshot.m3GlobalPulses===canonicalStringify(p.pulses.slice(0,snapshot.m3GlobalPulseCount).map(x=>x.definition))&&
        snapshot.m3GlobalCoefficients===canonicalStringify(p.coefficients.slice(0,snapshot.m3GlobalCoefficientCount))&&
        snapshot.m3GlobalBlocks===canonicalStringify(p.blocks.slice(0,snapshot.m3GlobalBlockCount))&&
        snapshot.m3GlobalFields===canonicalStringify(p.fields.slice(0,snapshot.m3GlobalFieldCount)));
  }
  globalKernelDefinitions(){
    const p=privateData.get(this);return structuredClone({pulses:p.pulses.map(x=>x.definition),coefficients:p.coefficients,blocks:p.blocks,fields:p.fields,
      indexedMaterializations:[...p.fieldMaterializations.values()],maximumSlowOrder:p.maximumSlowOrder,
      sourceAuthenticated:false,globalPaperRegularityClassCertified:false});
  }
  pack(roots,extra={}){return super.pack(roots,{...extra,m3GlobalSourceKernel:this.globalKernelDefinitions()});}
}

/** Generate every requested shared derivative at its canonical defining
 * parameters and retain all actual application arguments. This preserves
 * exact function sharing instead of inlining the same large local ODE at
 * 81 arguments. Exact infinite operations keep their real matrix/series
 * producer and tail; the audit never substitutes a finite approximation.
 */
export function materializeGlobalSourceClosure(G,roots,{maxExpressions=60000,onProgress}={}){
  const p=privateData.get(G);
  if(!p||!Array.isArray(roots)||roots.some(x=>!Number.isSafeInteger(x)||!G.nodes[x])||
    !Number.isSafeInteger(maxExpressions)||maxExpressions<1||maxExpressions>100000)
    fail('INVALID_INPUT','Use this actual M3 graph, retained roots and a finite body materialization budget.');
  const visited=new Set(),stack=[...roots],partials=new Map(),indexed=new Map(),pulseBlocks=new Map(),limits=new Map(),
    allArguments=new Set(['add','multiply','inverse','exp','log_positive','sqrt_positive','sine','cosine','ceiling','maximum','smooth_piecewise']);
  while(stack.length){
    const id=stack.pop();if(visited.has(id))continue;visited.add(id);const node=G.nodes[id];
    if(!node)fail('INVALID_SOURCE_CONSTRUCTION','The actual derivative closure lost a referenced source node.');
    const {op,args}=node;let children=[];
    if(['rational','coordinate','source_parameter'].includes(op)){}
    else if(['integer_power','source_step_derivative'].includes(op))children=[args[0]];
    else if(allArguments.has(op))children=args;
    else if(op==='definite_integral')children=[args[0],args[2],args[3]];
    else if(op==='actual_expression_partial'){
      const [system,values,orders]=args,s=G.expressionSystems[system],k=system+':'+orders.join(',');
      if(!s||G.expressionValue(system,values,orders)!==id)fail('INVALID_SOURCE_CONSTRUCTION','An expression derivative no longer binds its actual argument tuple.');
      let record=partials.get(k);
      if(!record){
        if(partials.size>=maxExpressions)fail('RESOURCE_LIMIT','The complete derivative closure exceeds this finite query budget; no missing body is replaced by zero.');
        const body=G.materializeExpressionFunction(system,s.parameters,orders);
        if([...G.freeCoordinates(body)].some(x=>!s.parameters.includes(x)))fail('INVALID_SOURCE_CONSTRUCTION','A generated derivative has an undeclared coordinate.');
        record={system,orders:[...orders],parameters:[...s.parameters],body,applicationsChecked:0,actualBodyGenerated:true};partials.set(k,record);
        if(partials.size%250===0)onProgress?.({stage:'global-source-actual-shared-derivative-closure',functions:partials.size,nodeCount:G.nodes.length});
      }
      record.applicationsChecked++;children=[...values,record.body];
    }else if(op==='m3_global_indexed_partial'){
      const [field,values,orders]=args,k=field+':'+orders.join(',');
      let record=indexed.get(k);if(!record){record=G.materializeGlobalIndexedField(field,orders);indexed.set(k,record);}
      children=[...values,record.body];
    }else if(op==='m3_global_pulse_jet'||op==='actual_covariance_volterra'){
      limits.set(op,(limits.get(op)??0)+1);children=[args[2],...args[3]];
      const pulse=op==='m3_global_pulse_jet'?args[0]:p.byCovariance.get(args[0]);
      if(pulse!==undefined){
        const alpha=op==='m3_global_pulse_jet'?args[4]:[0,0,0],k=pulse+':'+key(alpha);
        let block=pulseBlocks.get(k);
        if(!block){block=G.materializeGlobalPulseJet(pulse,alpha);pulseBlocks.set(k,block);
          children.push(...block.coefficients.flatMap(c=>[...c.matrix.flat(),c.norm.upper]),block.matrixNorm,block.intervalLength);}
      }else{
        const s=G.covarianceSystems[args[0]];
        if(!s)fail('INVALID_SOURCE_CONSTRUCTION','A retained covariance limit lost its matrix or initial data.');
        children.push(...s.matrix.flat(),...s.initial,s.normUpper,s.length);
      }
    }else if(op==='actual_natural_series'){
      limits.set(op,(limits.get(op)??0)+1);children=[args[1],args[2]];
    }else if(['actual_background_picard','actual_background_even_profile'].includes(op)){
      limits.set(op,(limits.get(op)??0)+1);children=[args[2],args[3]];
      const s=G.picardSystems[args[0]];if(!s)fail('INVALID_SOURCE_CONSTRUCTION','A source Picard limit lost its original defining system.');
      children.push(...s.A0.flat(),...s.A1.flat(),...s.forcing);
    }else if(op==='actual_quadratic_root')children=[args[2]];
    else if(op==='actual_monotone_root'){
      const s=G.monotoneSystems[args[0]];if(!s)fail('INVALID_SOURCE_CONSTRUCTION','A monotone source root lost its original defining equation.');
      children=[...args.slice(1),s.body,s.left,s.right,s.derivativeLower,s.derivativeUpper];
    }else fail('UNSUPPORTED','No exact global source derivative closure is defined for '+op+'.');
    stack.push(...children);
  }
  return {schema:'MathScope.N6.GlobalActualDerivativeClosure/1',roots:[...roots],visitedNodes:visited.size,partials:[...partials.values()],
    indexedPartials:[...indexed.values()].map(x=>({field:x.field,orders:x.orders,body:x.body,rows:x.terms.length,
      localBodies:x.localBodies,allDeclaredRowsRetained:x.allDeclaredRowsRetained,labelsDifferentiated:x.labelsDifferentiated})),
    pulseBlocks:[...pulseBlocks.values()].map(x=>({pulse:x.pulse,orders:x.requestedOrders,dimension:x.dimension,
      matrixNorm:x.matrixNorm,allCoefficientAndTimeDerivativeBodiesGenerated:x.allCoefficientAndTimeDerivativeBodiesGenerated})),
    exactLimits:Object.fromEntries(limits),allRequestedSharedBodiesMaterialized:true,allActualApplicationArgumentsRetained:true,
    numericalValueOrIntegralEvaluated:false,finiteApproximationReplacesExactLimit:false,allOrderSourceClassBoundClaimed:false,sourceAuthenticated:false};
}
