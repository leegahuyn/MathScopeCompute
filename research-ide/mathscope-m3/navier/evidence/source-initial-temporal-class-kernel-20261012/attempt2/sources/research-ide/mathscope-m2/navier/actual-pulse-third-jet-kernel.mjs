/** Three slow derivatives of an ORIGINAL fixed-left two-component ODE.
 *
 * All |alpha|<=3 jets in three parameters form 40 scalar components.
 * A_alpha,beta=binomial(alpha,beta)*M_(alpha-beta), beta<=alpha.
 * Matrix jets and FTC envelopes are generated from the retained matrix;
 * derivative matrices and derivative norms are never caller inputs.
 *
 * The generic layer assumes real smooth coefficients on its declared
 * parameter/time domain. It cannot authenticate a source or prove its
 * positive covariance domain. Initial left endpoint is exactly zero.
 * Moving evaluation endpoints are differentiated by the actual ODE RHS.
 */
import {ActualCovarianceExpressions} from './actual-covariance-volterra.mjs';
import {actualPulseMatrixFTCNorm} from './actual-pulse-jet-source.mjs';
import {retainedThirdMatrixFTCNorm,disposableThirdJetCacheCopy} from './actual-third-jet-ftc.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const privateState=new WeakMap(),scalarJets=new WeakMap();
const snapshot=x=>JSON.stringify(x);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const node=(G,id)=>Number.isSafeInteger(id)&&id>=0&&!!G.nodes[id];
const degree=alpha=>alpha.reduce((a,b)=>a+b,0),key=alpha=>alpha.join(',');
export function thirdJetIndices(count=3){
  if(!Number.isSafeInteger(count)||count<1||count>3)fail('INVALID_INPUT','Use one through three distinct slow directions.');
  const result=[];
  const add=(remaining,prefix)=>{if(prefix.length===count-1){result.push([...prefix,remaining]);return;}for(let n=remaining;n>=0;n--)add(remaining-n,[...prefix,n]);};
  for(let d=0;d<=3;d++)add(d,[]);
  return result;
}
export function thirdJetBinomial(alpha,beta){
  if(!Array.isArray(alpha)||!Array.isArray(beta)||alpha.length<1||alpha.length>3||beta.length!==alpha.length||
    alpha.some(x=>!Number.isSafeInteger(x)||x<0||x>3)||degree(alpha)>3||beta.some((x,i)=>!Number.isSafeInteger(x)||x<0||x>alpha[i]))
    fail('INVALID_INPUT','Use componentwise beta<=alpha of total degree at most three.');
  let answer=1;
  for(let i=0;i<alpha.length;i++){let c=1;for(let j=0;j<beta[i];j++)c=c*(alpha[i]-j)/(j+1);answer*=c;}
  return answer;
}
export const thirdJetSubindices=(alpha,indices=thirdJetIndices(alpha.length))=>indices.filter(beta=>beta.every((x,i)=>x<=alpha[i]));

/** All jets are actual AD of body, using the canonical R then Z then T
 * order. Mixed-order equality additionally uses smoothness, never samples. */
export function differentiatedThirdScalarJet(G,body,directions){
  if(!node(G,body)||!Array.isArray(directions)||new Set(directions).size!==directions.length||directions.some(x=>G.nodes[x]?.op!=='coordinate'))fail('INVALID_INPUT','Use a retained body and distinct coordinate directions.');
  const indices=thirdJetIndices(directions.length);let cache=scalarJets.get(G);if(!cache){cache=new Map();scalarJets.set(G,cache);}
  const cacheKey=snapshot([body,directions]);if(cache.has(cacheKey))return cache.get(cacheKey);
  const roots=[],lookup=new Map();
  for(const alpha of indices){
    G.checkCancelled?.();let value=body;
    if(degree(alpha)){const axis=alpha.findLastIndex(x=>x>0),previous=[...alpha];previous[axis]--;value=G.derivative(lookup.get(key(previous)),directions[axis]);}
    roots.push(value);lookup.set(key(alpha),value);
  }
  const result=freeze({body,directions:[...directions],indices,roots,derivativeOrder:3,actualSourceAuthenticated:false});cache.set(cacheKey,result);return result;
}
export function differentiatedThirdMatrixJet(G,matrix,directions){
  if(!Array.isArray(matrix)||!matrix.length||!Array.isArray(matrix[0])||!matrix[0].length||matrix.some(row=>!Array.isArray(row)||row.length!==matrix[0].length||row.some(x=>!node(G,x))))fail('INVALID_INPUT','Use a nonempty rectangular matrix of retained scalar expressions.');
  const scalar=matrix.map(row=>row.map(root=>differentiatedThirdScalarJet(G,root,directions))),indices=thirdJetIndices(directions.length);
  return freeze({matrix:matrix.map(row=>[...row]),directions:[...directions],indices,matrices:indices.map((_,a)=>scalar.map(row=>row.map(jet=>jet.roots[a]))),actualSourceAuthenticated:false});
}

export class ActualPulseThirdJetExpressions extends ActualCovarianceExpressions {
  constructor(base,options={}){
    super(disposableThirdJetCacheCopy(base),options);
    this.thirdJetCompactFTC=options.compactFTC===true;this.thirdJetProgress=options.onProgress;
    this.pulseThirdJetSystems=structuredClone(base.pulseThirdJetSystems??[]);
    const covarianceOrigins=new Map();this.covarianceSystems.forEach((s,id)=>covarianceOrigins.set(id,freeze(s)));
    privateState.set(this,{systems:new Map(),covarianceOrigins,aliases:new Map(),reverseAliases:new Map(),partials:new Map()});
  }
  get pulseThirdJetAliases(){return new Map(privateState.get(this)?.aliases??[]);}
  defineCovarianceVolterra(input){
    const id=super.defineCovarianceVolterra(input);privateState.get(this).covarianceOrigins.set(id,freeze(this.covarianceSystems[id]));return id;
  }
  assertThirdJetCovariance(id){
    const saved=privateState.get(this)?.covarianceOrigins.get(id);
    if(!saved||this.covarianceSystems[id]!==saved)fail('INVALID_SOURCE_CONSTRUCTION','Use the immutable original covariance definition in this graph.');
    return saved;
  }
  covarianceValue(system,component,time,values){this.assertThirdJetCovariance(system);return super.covarianceValue(system,component,time,values);}

  definePulseThirdVariation(input){
    const allowed=['name','variable','parameters','directions','matrix','initial','left','length'];
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))fail('INVALID_INPUT','Supply the original ODE, parameters, initial datum and interval only. Jets and derivative norms are internally generated.');
    const {name,variable,parameters,directions,matrix,initial,left,length}=input;
    if(typeof name!=='string'||!name||this.nodes[variable]?.op!=='coordinate'||!Array.isArray(parameters)||new Set(parameters).size!==parameters.length||
      parameters.includes(variable)||parameters.some(x=>this.nodes[x]?.op!=='coordinate')||!Array.isArray(directions)||new Set(directions).size!==directions.length||
      directions.some(x=>!parameters.includes(x))||!Array.isArray(matrix)||matrix.length!==2||matrix.some(row=>!Array.isArray(row)||row.length!==2||row.some(x=>!node(this,x)))||
      !Array.isArray(initial)||initial.length!==2||initial.some(x=>!node(this,x))||!node(this,length))fail('INVALID_INPUT','Use a retained two-component ODE, its constant-in-time datum, and declared coordinates.');
    const indices=thirdJetIndices(directions.length),all=new Set([variable,...parameters]),constants=new Set(parameters);
    if(left!==this.zero)fail('UNSUPPORTED','This third-order kernel has the exact fixed initial endpoint zero. A moving-left problem is not silently converted to it.');
    if(this.isq(length)&&this.fraction(length)[0]<0n)fail('INVALID_INPUT','The interval length must be nonnegative.');
    if(matrix.flat().some(x=>[...this.freeCoordinates(x)].some(c=>!all.has(c)))||[length,...initial].some(x=>[...this.freeCoordinates(x)].some(c=>!constants.has(c))))fail('INVALID_INPUT','The ODE or datum has an undeclared coordinate or an initial pulse-time dependency.');
    const matrixJet=differentiatedThirdMatrixJet(this,matrix,directions),initialJets=initial.map(x=>differentiatedThirdScalarJet(this,x,directions)),options={variable,length,parameters};
    this.thirdJetProgress?.({stage:'third-original-matrix-jets-generated',name,nodeCount:this.nodes.length});
    const matrixNorms=matrixJet.matrices.map((A,at)=>{
      const norm=this.thirdJetCompactFTC?retainedThirdMatrixFTCNorm(this,A,options):actualPulseMatrixFTCNorm(this,A,options);
      if(at%5===4)this.thirdJetProgress?.({stage:'third-original-matrix-FTC-generated',name,throughMultiIndex:at,nodeCount:this.nodes.length});return norm;
    });
    const blocks=indices.map((orders,i)=>({orders,degree:degree(orders),offset:2*i})),lookup=new Map(blocks.map(b=>[key(b.orders),b.offset])),dimension=2*blocks.length;
    const augmentedMatrix=Array.from({length:dimension},()=>Array(dimension).fill(this.zero)),blockRowNorms=[];
    for(const block of blocks){
      const terms=[];
      for(const beta of thirdJetSubindices(block.orders,indices)){
        const derivative=block.orders.map((x,i)=>x-beta[i]),at=lookup.get(key(derivative))/2,column=lookup.get(key(beta)),c=thirdJetBinomial(block.orders,beta);
        matrixJet.matrices[at].forEach((row,i)=>row.forEach((x,j)=>{augmentedMatrix[block.offset+i][column+j]=this.mul(this.q(c),x);}));
        terms.push(this.mul(this.q(c),matrixNorms[at].upper));
      }
      blockRowNorms.push(this.add(...terms));
    }
    const augmentedInitial=indices.flatMap((_,j)=>initialJets.map(jet=>jet.roots[j]));
    const magnitude=x=>{if(this.isq(x)){const[n,d]=this.fraction(x);return this.q(n<0n?-n:n,d);}return this.sqrt(this.add(this.one,this.pow(x,2)));};
    const blockInitialNorms=blocks.map(b=>this.maximum(...augmentedInitial.slice(b.offset,b.offset+2).map(magnitude)));
    const augmentedMatrixNorm=this.maximum(...blockRowNorms),augmentedInitialNorm=this.maximum(...blockInitialNorms);
    const s=freeze({name,variable,parameters:[...parameters],directions:[...directions],directionParameterIndices:directions.map(x=>parameters.indexOf(x)),left,length,
      matrix:matrix.map(row=>[...row]),initial:[...initial],matrixJet,initialJets,blocks,dimension,augmentedMatrix,augmentedInitial,
      bounds:{matrixNorms,blockRowNorms,blockInitialNorms,augmentedMatrixNorm,augmentedInitialNorm,sourceAuthenticated:false},
      regularityPremises:['The retained M is C3 in selected slow coordinates and each actual M_alpha is C1 in pulse time on the swept finite interval.',
        'Each M_alpha and its pulse-time derivative is jointly continuous in parameters and time. Their exact FTC envelopes are then locally bounded.',
        'The fixed-left initial datum is C3 in the selected parameters. L>=0 is locally bounded; each compact slow neighborhood has a common finite swept pulse interval. Evaluate inside 0<=v<=L.',
        'Mixed slow orders commute on this smooth parameter domain. Moving evaluation endpoints use the actual ODE RHS and all derivatives it generates.'],
      equations:{jet:'d_v w_alpha = sum_(beta<=alpha) binomial(alpha,beta)*M_(alpha-beta)*w_beta',
        initial:'w_alpha(0,a)=partial_a^alpha g(a), since the original left endpoint is exactly zero.',
        timeChain:'d_i w_alpha(b(a),a)=w_(alpha+e_i)(b,a)+(d_v w_alpha)(b,a)*b_i; repeated differentiation retains all time/mixed/endpoint terms.',
        repeatedThird:'w_iii,v=M*w_iii+3*M_i*w_ii+3*M_ii*w_i+M_iii*w'},
      normConvention:'Induced infinity norm, bounded by max_alpha sum_(beta<=alpha) binomial(alpha,beta)*norm(M_(alpha-beta)); actual derivative norms are FTC integrals.',
      fixedLeftEndpoint:true,derivativeOrder:3,canonicalMixedDerivatives:true,sourceAuthenticated:false,
      finiteSumIsExactSolution:false,locallyUniformDifferentiatedConvergenceConditionalOnDeclaredSmoothDomain:true,globalGaussianOrFlatBound:false});
    const id=this.pulseThirdJetSystems.length;this.pulseThirdJetSystems.push(s);privateState.get(this).systems.set(id,s);return id;
  }
  assertPulseThirdVariation(id){
    const s=privateState.get(this)?.systems.get(id);
    if(!s||this.pulseThirdJetSystems[id]!==s)fail('INVALID_SOURCE_CONSTRUCTION','Use the internally differentiated immutable third-variation system in its original graph.');
    return s;
  }
  bindOriginalCovarianceThirdJet(covarianceSystem,jetSystem){
    const c=this.assertThirdJetCovariance(covarianceSystem),s=this.assertPulseThirdVariation(jetSystem),state=privateState.get(this);
    if(c.variable!==s.variable||snapshot(c.parameters)!==snapshot(s.parameters)||snapshot(c.matrix)!==snapshot(s.matrix)||snapshot(c.initial)!==snapshot(s.initial)||c.length!==s.length||s.left!==this.zero)fail('INVALID_SOURCE_CONSTRUCTION','The jet must bind the exact original covariance system, datum, variables and interval.');
    if(state.aliases.has(covarianceSystem)||state.reverseAliases.has(jetSystem))fail('INVALID_INPUT','This original system and its third jet already have a private binding.');
    state.aliases.set(covarianceSystem,jetSystem);state.reverseAliases.set(jetSystem,covarianceSystem);return true;
  }
  thirdJetComponent(id,component,orders){
    const s=this.assertPulseThirdVariation(id);
    if(![0,1].includes(component)||!Array.isArray(orders)||orders.length!==s.directions.length||orders.some(x=>!Number.isSafeInteger(x)||x<0)||degree(orders)>3)fail('UNSUPPORTED','Use an original component and a constructed slow multi-index of degree at most three.');
    const block=s.blocks.find(b=>key(b.orders)===key(orders));if(!block)fail('UNSUPPORTED','The requested third jet is not constructed.');return block.offset+component;
  }
  thirdJetEvaluation(id,component,time,values){
    const s=this.assertPulseThirdVariation(id);
    if(!Number.isSafeInteger(component)||component<0||component>=s.dimension||!node(this,time)||!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!node(this,x)))fail('INVALID_INPUT','Supply a retained jet component, time and complete parameter arguments.');
    return s;
  }
  pulseThirdJetValue(id,component,time,values){
    const s=this.thirdJetEvaluation(id,component,time,values),original=privateState.get(this).reverseAliases.get(id);
    if(component<2&&original!==undefined)return this.covarianceValue(original,component,time,values);
    if(time===this.zero)return this.simultaneousSubstitute(s.augmentedInitial[component],s.parameters,values);
    return this.node('actual_pulse_third_jet_volterra',[id,component,time,[...values]]);
  }
  pulseThirdJetRhs(id,component,time,values){
    const s=this.thirdJetEvaluation(id,component,time,values);
    return this.add(...s.augmentedMatrix[component].map((a,j)=>a===this.zero?this.zero:this.mul(this.simultaneousSubstitute(a,[s.variable,...s.parameters],[time,...values]),this.pulseThirdJetValue(id,j,time,values))));
  }
  pulseThirdJetPartialSum(id,{terms=1,time,values}={}){
    const s=this.assertPulseThirdVariation(id),state=privateState.get(this);
    if(!Number.isSafeInteger(terms)||terms<0||terms>32)fail('RESOURCE_LIMIT','Display zero through 32 finite ordered-integral corrections; retain the separate factorial tail.');
    time??=s.variable;values??=s.parameters;this.thirdJetEvaluation(id,0,time,values);
    const cacheKey=snapshot([id,terms,time,values]);if(state.partials.has(cacheKey))return state.partials.get(cacheKey);
    let term=[...s.augmentedInitial],sum=[...term];const rows=[];
    for(let n=1;n<=terms;n++){
      this.checkCancelled?.();const tau=this.fresh('actual_third_jet_ordered_time'),at=x=>this.substitute(x,s.variable,tau);
      term=s.augmentedMatrix.map(row=>this.integral(this.add(...row.map((a,j)=>a===this.zero?this.zero:this.mul(at(a),at(term[j])))),tau,this.zero,s.variable));
      sum=sum.map((x,j)=>this.add(x,term[j]));rows.push({order:n,term:[...term]});
    }
    const replace=x=>this.simultaneousSubstitute(x,[s.variable,...s.parameters],[time,...values]),K=replace(s.bounds.augmentedMatrixNorm),L=replace(s.length),I=replace(s.bounds.augmentedInitialNorm),z=this.mul(K,L);
    const tail=this.mul(I,this.exp(z),this.pow(z,terms+1),this.q(1,factorial(terms+1)));
    const result=freeze({system:id,terms,values:sum.map(replace),rows:rows.map(row=>({...row,term:row.term.map(replace)})),tail,
      augmentedMatrixNorm:K,augmentedInitialNorm:I,intervalLength:L,tailFormula:'I_aug*exp(K_aug*L)*(K_aug*L)^(N+1)/(N+1)!',
      tailAppliesToAll40Components:s.dimension===40,tailTendsToZero:true,validInterval:'0<=time<=L(parameters)',derivativeOrder:3,
      finiteJetSumEqualsDerivativeOfFiniteValueSum:true,finiteSumIsExactSolution:false,sourceAuthenticated:false,numericalIntegralEvaluated:false});
    state.partials.set(cacheKey,result);return result;
  }
  freeCoordinates(id){
    const n=this.nodes[id];if(n?.op==='actual_pulse_third_jet_volterra'){const out=new Set();for(const x of [n.args[2],...n.args[3]])for(const y of this.freeCoordinates(x))out.add(y);return out;}
    return super.freeCoordinates(id);
  }
  dependsOn(id,variable){return this.nodes[id]?.op==='actual_pulse_third_jet_volterra'?this.freeCoordinates(id).has(variable):super.dependsOn(id,variable);}
  substitute(id,variable,value){
    if(id===variable)return value;
    const n=this.nodes[id];if(n?.op==='actual_pulse_third_jet_volterra')return this.pulseThirdJetValue(n.args[0],n.args[1],this.substitute(n.args[2],variable,value),n.args[3].map(x=>this.substitute(x,variable,value)));
    return super.substitute(id,variable,value);
  }
  derivative(id,variable){
    const n=this.nodes[id],isOriginal=n?.op==='actual_covariance_volterra',isJet=n?.op==='actual_pulse_third_jet_volterra';
    if(!isOriginal&&!isJet)return this.dependsOn(id,variable)?super.derivative(id,variable):this.zero;
    const [original,component,time,values]=n.args,state=privateState.get(this);
    if(isOriginal)this.assertThirdJetCovariance(original);else this.assertPulseThirdVariation(original);
    if(!this.dependsOn(id,variable))return this.zero;
    const system=isOriginal?state.aliases.get(original):original;
    if(isOriginal&&system===undefined)return super.derivative(id,variable);
    const s=this.assertPulseThirdVariation(system),dp=values.map(x=>this.derivative(x,variable)),dt=this.derivative(time,variable),terms=[];
    if(dt!==this.zero)terms.push(this.mul(dt,this.pulseThirdJetRhs(system,component,time,values)));
    const orders=isOriginal?Array(s.directions.length).fill(0):s.blocks[Math.floor(component/2)].orders;
    for(let j=0;j<dp.length;j++)if(dp[j]!==this.zero){
      const at=s.directionParameterIndices.indexOf(j);if(at<0)fail('UNSUPPORTED','A frozen representative or unconstructed parameter derivative is not set to zero.');
      const next=[...orders];next[at]++;
      terms.push(this.mul(dp[j],this.pulseThirdJetValue(system,this.thirdJetComponent(system,component%2,next),time,values)));
    }
    return this.add(...terms);
  }
  pack(roots,extra={}){
    this.pulseThirdJetSystems.forEach((_,id)=>this.assertPulseThirdVariation(id));
    for(const[c,j]of privateState.get(this).aliases){this.assertThirdJetCovariance(c);this.assertPulseThirdVariation(j);}
    return super.pack(roots,{...extra,pulseThirdJetSystems:structuredClone(this.pulseThirdJetSystems),pulseThirdJetAliases:[...privateState.get(this).aliases],
      pulseThirdJetKernel:{schema:'MathScope.ActualPulseThirdJetKernel/1',derivativeOrder:3,allMixedThirdDerivatives:true,repeatedBinomialFactors:true,
        actualCoefficientDerivativesAndTimeFTC:true,originalCovarianceValuesPreserved:true,immutableLocalAliases:true,fixedLeftEndpointZero:true,
        movingEvaluationEndpointChain:true,orderedNoncommutativeVolterraSeries:true,sourceAuthenticationInAdapter:true,sourceAuthenticated:false,
        conditionalLocalUniformDifferentiatedConvergence:true,numericalEnclosure:false,newLeanKernelProof:false}});
  }
}
